const db = require('../config/db');
const { asyncHandler } = require('../utils/helpers');



const STATS_SQL = `
  WITH owned_projects AS (
    SELECT id, status FROM projects WHERE owner_id = $1
  )
  SELECT
    (SELECT COUNT(*)::int FROM owned_projects) AS "totalProjects",
    (SELECT COUNT(*)::int FROM owned_projects WHERE status = 'In Progress') AS "projectsInProgress",
    (SELECT COUNT(*)::int FROM tasks t JOIN owned_projects p ON p.id = t.project_id) AS "totalTasks",
    (SELECT COUNT(*)::int FROM tasks t JOIN owned_projects p ON p.id = t.project_id
      WHERE t.status = 'Completed') AS "completedTasks",
    (SELECT COUNT(*)::int FROM tasks t JOIN owned_projects p ON p.id = t.project_id
      WHERE t.status = 'Pending') AS "pendingTasks",
    (SELECT COUNT(*)::int FROM tasks t JOIN owned_projects p ON p.id = t.project_id
      WHERE t.status = 'In Progress') AS "inProgressTasks",
    (SELECT COUNT(*)::int FROM tasks t JOIN owned_projects p ON p.id = t.project_id
      WHERE t.due_date IS NOT NULL AND t.due_date < CURRENT_DATE AND t.status <> 'Completed') AS "overdueTasks"
`;

const getStats = asyncHandler(async (req, res) => {
  const { rows } = await db.query(STATS_SQL, [req.user.id]);
  res.json({ data: rows[0] });
});

module.exports = { getStats };
