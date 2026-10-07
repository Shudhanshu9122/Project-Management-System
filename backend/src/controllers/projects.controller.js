const db = require('../config/db');
const { AppError } = require('../utils/AppError');
const { asyncHandler, buildSet, escapeLike, paginationMeta } = require('../utils/helpers');
const { projectDateOrderMessage } = require('../validators/schemas');

// Qualified with the `p` alias because the list query joins tasks, which also
// has an `id` column.
const PROJECT_COLUMNS = `p.id,
  p.owner_id AS "ownerId",
  p.name,
  p.description,
  p.status,
  p.start_date AS "startDate",
  p.end_date AS "endDate",
  p.created_at AS "createdAt",
  p.updated_at AS "updatedAt"`;

const PROJECT_LIST_SORTS = {
  createdAt: 'p.created_at',
  name: 'p.name',
  startDate: 'p.start_date',
  endDate: 'p.end_date',
};

// The only payload fields an UPDATE may touch, as [requestField, column] pairs.
// Column names in the generated SQL come from this list, never from the request.
const PROJECT_WRITE_COLUMNS = [
  ['name', 'name'],
  ['description', 'description'],
  ['status', 'status'],
  ['startDate', 'start_date'],
  ['endDate', 'end_date'],
];

async function findOwnedProject(projectId, ownerId) {
  const { rows } = await db.query(
    `SELECT ${PROJECT_COLUMNS} FROM projects p WHERE p.id = $1 AND p.owner_id = $2`,
    [projectId, ownerId]
  );
  return rows[0] || null;
}

const list = asyncHandler(async (req, res) => {
  const { search, status, sort = 'createdAt', order, page, limit } = req.query;

  // Scoping by owner_id is the first condition of every query in this file.
  const conditions = ['p.owner_id = $1'];
  const values = [req.user.id];

  if (search) {
    values.push(`%${escapeLike(search)}%`);
    conditions.push(`p.name ILIKE $${values.length} ESCAPE '\\'`);
  }
  if (status) {
    values.push(status);
    conditions.push(`p.status = $${values.length}`);
  }

  const where = conditions.join(' AND ');

  const { rows: countRows } = await db.query(
    `SELECT COUNT(*)::int AS total FROM projects p WHERE ${where}`,
    values
  );

  const direction = (order || (sort === 'createdAt' ? 'desc' : 'asc')) === 'asc' ? 'ASC' : 'DESC';
  values.push(limit, (page - 1) * limit);

  const { rows } = await db.query(
    `SELECT ${PROJECT_COLUMNS},
            COUNT(t.id)::int AS "taskCount",
            COUNT(t.id) FILTER (WHERE t.status = 'Completed')::int AS "completedTaskCount"
     FROM projects p
     LEFT JOIN tasks t ON t.project_id = p.id
     WHERE ${where}
     GROUP BY p.id
     ORDER BY ${PROJECT_LIST_SORTS[sort]} ${direction} NULLS LAST, p.id
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  res.json({ data: rows, meta: paginationMeta(page, limit, countRows[0].total) });
});

const getOne = asyncHandler(async (req, res) => {
  const project = await findOwnedProject(req.params.id, req.user.id);
  if (!project) {
    throw AppError.notFound('project');
  }

  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS "taskCount",
            COUNT(*) FILTER (WHERE status = 'Completed')::int AS "completedTaskCount"
     FROM tasks WHERE project_id = $1`,
    [project.id]
  );

  res.json({ data: { ...project, ...rows[0] } });
});

const create = asyncHandler(async (req, res) => {
  const { name, description = null, status = 'Not Started', startDate = null, endDate = null } = req.body;

  const { rows } = await db.query(
    `INSERT INTO projects (owner_id, name, description, status, start_date, end_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id,
       owner_id AS "ownerId",
       name,
       description,
       status,
       start_date AS "startDate",
       end_date AS "endDate",
       created_at AS "createdAt",
       updated_at AS "updatedAt"`,
    [req.user.id, name, description, status, startDate, endDate]
  );

  res.status(201).json({ data: { ...rows[0], taskCount: 0, completedTaskCount: 0 } });
});

const update = asyncHandler(async (req, res) => {
  const current = await findOwnedProject(req.params.id, req.user.id);
  if (!current) {
    throw AppError.notFound('project');
  }

  // A partial update can break the ordering rule using a value that is already
  // stored, which the body schema alone cannot see.
  const startDate = req.body.startDate !== undefined ? req.body.startDate : current.startDate;
  const endDate = req.body.endDate !== undefined ? req.body.endDate : current.endDate;
  if (startDate && endDate && endDate < startDate) {
    throw AppError.badRequest('VALIDATION_ERROR', 'Request validation failed.', [
      { field: 'endDate', message: projectDateOrderMessage },
    ]);
  }

  const { clauses, values } = buildSet(req.body, PROJECT_WRITE_COLUMNS, 1);
  clauses.push('updated_at = now()');
  values.push(req.params.id, req.user.id);

  const { rows } = await db.query(
    `UPDATE projects SET ${clauses.join(', ')}
     WHERE id = $${values.length - 1} AND owner_id = $${values.length}
     RETURNING id,
       owner_id AS "ownerId",
       name,
       description,
       status,
       start_date AS "startDate",
       end_date AS "endDate",
       created_at AS "createdAt",
       updated_at AS "updatedAt"`,
    values
  );

  if (!rows[0]) {
    throw AppError.notFound('project');
  }

  const { rows: counts } = await db.query(
    `SELECT COUNT(*)::int AS "taskCount",
            COUNT(*) FILTER (WHERE status = 'Completed')::int AS "completedTaskCount"
     FROM tasks WHERE project_id = $1`,
    [rows[0].id]
  );

  res.json({ data: { ...rows[0], ...counts[0] } });
});

const remove = asyncHandler(async (req, res) => {
  // Tasks disappear with the project through ON DELETE CASCADE.
  const { rowCount } = await db.query('DELETE FROM projects WHERE id = $1 AND owner_id = $2', [
    req.params.id,
    req.user.id,
  ]);

  if (rowCount === 0) {
    throw AppError.notFound('project');
  }

  res.status(204).end();
});

module.exports = { list, getOne, create, update, remove };
