const db = require('../config/db');
const { AppError } = require('../utils/AppError');
const { asyncHandler, buildSet, escapeLike, paginationMeta } = require('../utils/helpers');

const TASK_COLUMNS = `t.id,
  t.project_id AS "projectId",
  t.name,
  t.description,
  t.priority,
  t.status,
  t.due_date AS "dueDate",
  t.created_at AS "createdAt",
  t.updated_at AS "updatedAt"`;

const TASK_SELECT = `${TASK_COLUMNS}, p.name AS "projectName"`;



const TASK_LIST_SORTS = {
  createdAt: 't.created_at',
  name: 't.name',
  dueDate: 't.due_date',
  priority: "CASE t.priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END",
  status: "CASE t.status WHEN 'Pending' THEN 1 WHEN 'In Progress' THEN 2 ELSE 3 END",
};

const TASK_WRITE_COLUMNS = [
  ['projectId', 'project_id'],
  ['name', 'name'],
  ['description', 'description'],
  ['priority', 'priority'],
  ['status', 'status'],
  ['dueDate', 'due_date'],
];



async function findOwnedTask(taskId, ownerId) {
  const { rows } = await db.query(
    `SELECT ${TASK_SELECT}
     FROM tasks t
     JOIN projects p ON p.id = t.project_id
     WHERE t.id = $1 AND p.owner_id = $2`,
    [taskId, ownerId]
  );
  return rows[0] || null;
}

async function assertProjectOwned(projectId, ownerId) {
  const { rows } = await db.query('SELECT 1 FROM projects WHERE id = $1 AND owner_id = $2', [
    projectId,
    ownerId,
  ]);

  if (rows.length === 0) {
    throw AppError.notFound('project');
  }
}

const list = asyncHandler(async (req, res) => {
  const { projectId, search, status, priority, sort = 'createdAt', order, page, limit } = req.query;

  const conditions = ['p.owner_id = $1'];
  const values = [req.user.id];

  if (projectId) {
    values.push(projectId);
    conditions.push(`t.project_id = $${values.length}`);
  }
  if (search) {
    values.push(`%${escapeLike(search)}%`);
    conditions.push(`t.name ILIKE $${values.length} ESCAPE '\\'`);
  }
  if (status) {
    values.push(status);
    conditions.push(`t.status = $${values.length}`);
  }
  if (priority) {
    values.push(priority);
    conditions.push(`t.priority = $${values.length}`);
  }

  const where = conditions.join(' AND ');

  const { rows: countRows } = await db.query(
    `SELECT COUNT(*)::int AS total
     FROM tasks t
     JOIN projects p ON p.id = t.project_id
     WHERE ${where}`,
    values
  );

  const direction = (order || (sort === 'createdAt' ? 'desc' : 'asc')) === 'asc' ? 'ASC' : 'DESC';
  values.push(limit, (page - 1) * limit);

  const { rows } = await db.query(
    `SELECT ${TASK_SELECT}
     FROM tasks t
     JOIN projects p ON p.id = t.project_id
     WHERE ${where}
     ORDER BY ${TASK_LIST_SORTS[sort]} ${direction} NULLS LAST, t.id
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  res.json({ data: rows, meta: paginationMeta(page, limit, countRows[0].total) });
});

const getOne = asyncHandler(async (req, res) => {
  const task = await findOwnedTask(req.params.id, req.user.id);
  if (!task) {
    throw AppError.notFound('task');
  }

  res.json({ data: task });
});

const create = asyncHandler(async (req, res) => {
  const { projectId, name, description = null, priority = 'Medium', status = 'Pending', dueDate = null } =
    req.body;

  
  await assertProjectOwned(projectId, req.user.id);

  const { rows } = await db.query(
    `INSERT INTO tasks (project_id, name, description, priority, status, due_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id,
       project_id AS "projectId",
       name,
       description,
       priority,
       status,
       due_date AS "dueDate",
       created_at AS "createdAt",
       updated_at AS "updatedAt"`,
    [projectId, name, description, priority, status, dueDate]
  );

  const { rows: projectRows } = await db.query('SELECT name FROM projects WHERE id = $1', [rows[0].projectId]);

  res.status(201).json({ data: { ...rows[0], projectName: projectRows[0].name } });
});

const update = asyncHandler(async (req, res) => {
  const current = await findOwnedTask(req.params.id, req.user.id);
  if (!current) {
    throw AppError.notFound('task');
  }

  
  if (req.body.projectId !== undefined) {
    await assertProjectOwned(req.body.projectId, req.user.id);
  }

  const { clauses, values } = buildSet(req.body, TASK_WRITE_COLUMNS, 1);
  clauses.push('updated_at = now()');
  values.push(req.params.id);

  const { rows } = await db.query(
    `UPDATE tasks SET ${clauses.join(', ')}
     WHERE id = $${values.length}
     RETURNING id,
       project_id AS "projectId",
       name,
       description,
       priority,
       status,
       due_date AS "dueDate",
       created_at AS "createdAt",
       updated_at AS "updatedAt"`,
    values
  );

  const { rows: projectRows } = await db.query('SELECT name FROM projects WHERE id = $1', [rows[0].projectId]);

  res.json({ data: { ...rows[0], projectName: projectRows[0].name } });
});

const remove = asyncHandler(async (req, res) => {
  const current = await findOwnedTask(req.params.id, req.user.id);
  if (!current) {
    throw AppError.notFound('task');
  }

  await db.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

module.exports = { list, getOne, create, update, remove };
