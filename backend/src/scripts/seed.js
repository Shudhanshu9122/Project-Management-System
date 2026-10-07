const bcrypt = require('bcryptjs');
const db = require('../config/db');
const env = require('../config/env');
const logger = require('../config/logger');

const DEMO_EMAIL = 'demo@example.com';
const DEMO_PASSWORD = 'Password123';

// Test data only. Re-running replaces the demo account's rows rather than
// appending duplicates.
const PROJECTS = [
  {
    name: 'Website Redesign',
    description: 'New marketing site with a shared component library.',
    status: 'In Progress',
    startDate: '2026-08-03',
    endDate: '2026-11-20',
    tasks: [
      { name: 'Audit current pages', priority: 'High', status: 'Completed', dueDate: '2026-08-14' },
      { name: 'Wireframe new landing page', priority: 'Medium', status: 'Completed', dueDate: '2026-08-28' },
      { name: 'Build component library', priority: 'High', status: 'In Progress', dueDate: '2026-09-25' },
      { name: 'Migrate blog to new layout', priority: 'Medium', status: 'Pending', dueDate: '2026-10-20' },
      { name: 'Accessibility pass', priority: 'Low', status: 'Pending', dueDate: '2026-11-06' },
    ],
  },
  {
    name: 'Q4 Marketing Plan',
    description: 'Campaign calendar, budget split and launch sequence.',
    status: 'In Progress',
    startDate: '2026-09-15',
    endDate: '2026-12-18',
    tasks: [
      { name: 'Define campaign budget', priority: 'High', status: 'Completed', dueDate: '2026-09-22' },
      { name: 'Draft email sequence', priority: 'Medium', status: 'In Progress', dueDate: '2026-10-12' },
      { name: 'Book sponsored newsletter slots', priority: 'High', status: 'Pending', dueDate: '2026-10-02' },
      { name: 'Prepare launch assets', priority: 'Medium', status: 'Pending', dueDate: '2026-11-10' },
    ],
  },
  {
    name: 'Mobile App Launch',
    description: 'Play Store submission and release checklist.',
    status: 'Not Started',
    startDate: '2026-11-02',
    endDate: '2026-12-15',
    tasks: [
      { name: 'Finalise Play Store listing', priority: 'Medium', status: 'Pending', dueDate: '2026-11-16' },
      { name: 'Set up crash reporting', priority: 'Low', status: 'Pending', dueDate: '2026-11-30' },
    ],
  },
  {
    name: 'Internal Tooling Cleanup',
    description: 'Retired the old scheduler and wrote down how to deploy.',
    status: 'Completed',
    startDate: '2026-05-04',
    endDate: '2026-06-30',
    tasks: [
      { name: 'Retire legacy cron jobs', priority: 'High', status: 'Completed', dueDate: '2026-06-10' },
      { name: 'Document deploy runbook', priority: 'Medium', status: 'Completed', dueDate: '2026-06-24' },
    ],
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, env.bcryptRounds);

  const summary = await db.withTransaction(async (client) => {
    // Cascades remove this account's projects and tasks too.
    await client.query('DELETE FROM users WHERE lower(email) = lower($1)', [DEMO_EMAIL]);

    const { rows: userRows } = await client.query(
      `INSERT INTO users (full_name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id`,
      ['Demo User', DEMO_EMAIL, passwordHash]
    );
    const ownerId = userRows[0].id;

    let taskCount = 0;

    for (const project of PROJECTS) {
      const { rows: projectRows } = await client.query(
        `INSERT INTO projects (owner_id, name, description, status, start_date, end_date)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [ownerId, project.name, project.description, project.status, project.startDate, project.endDate]
      );

      for (const task of project.tasks) {
        await client.query(
          `INSERT INTO tasks (project_id, name, priority, status, due_date)
           VALUES ($1, $2, $3, $4, $5)`,
          [projectRows[0].id, task.name, task.priority, task.status, task.dueDate]
        );
        taskCount += 1;
      }
    }

    return { projects: PROJECTS.length, tasks: taskCount };
  });

  logger.info(
    `Seeded ${summary.projects} projects and ${summary.tasks} tasks for ${DEMO_EMAIL} (password: ${DEMO_PASSWORD})`
  );
}

main()
  .catch((error) => {
    logger.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => db.close());
