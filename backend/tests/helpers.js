const path = require('node:path');
const dotenv = require('dotenv');

// .env is read first so TEST_DATABASE_URL can be picked up from it, then the
// values below are overwritten before anything below requires config/env.
dotenv.config({ path: path.resolve(__dirname, '../.env') });

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/pms_test';
process.env.JWT_SECRET = 'test-only-secret-value-at-least-32-chars';
// bcrypt at the production cost would dominate the suite's runtime.
process.env.BCRYPT_ROUNDS = '4';
process.env.CORS_ORIGINS = 'http://localhost:5173';
// Ceilings high enough that functional tests never trip a limiter. The rate
// limiting suite sets the PMS_TEST_* overrides before requiring this module,
// because the limiters read env when they are constructed.
process.env.RATE_LIMIT_MAX = process.env.PMS_TEST_API_RATE_LIMIT || '5000';
process.env.AUTH_RATE_LIMIT_MAX = process.env.PMS_TEST_AUTH_RATE_LIMIT || '5000';
process.env.LOG_LEVEL = 'error';

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');
const { apiLimiter, authLimiter } = require('../src/middleware/rateLimit');

// The limiters keep their counters in memory for the lifetime of the process, so
// a suite that deliberately exhausts one has to clear it between tests. supertest
// connects over IPv4 loopback, which is the key express-rate-limit derives.
const LOOPBACK_IP = '127.0.0.1';

function resetRateLimits() {
  authLimiter.resetKey(LOOPBACK_IP);
  apiLimiter.resetKey(LOOPBACK_IP);
}

const DEFAULT_PASSWORD = 'Passw0rd123';

let emailCounter = 0;

function uniqueEmail(prefix = 'user') {
  emailCounter += 1;
  return `${prefix}.${process.pid}.${emailCounter}@example.com`;
}

async function resetDatabase() {
  // users cascades into projects and tasks.
  await db.query('TRUNCATE users, revoked_tokens CASCADE');
}

async function registerUser(overrides = {}) {
  const payload = {
    fullName: 'Ada Lovelace',
    email: uniqueEmail(),
    password: DEFAULT_PASSWORD,
    ...overrides,
  };

  const response = await request(app).post('/api/auth/register').send(payload);

  return {
    payload,
    response,
    token: response.body.token,
    id: response.body.user ? response.body.user.id : undefined,
  };
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

async function createProject(token, overrides = {}) {
  const response = await request(app)
    .post('/api/projects')
    .set(auth(token))
    .send({ name: 'Website Redesign', ...overrides });

  if (response.status !== 201) {
    throw new Error(`Project fixture failed: ${response.status} ${JSON.stringify(response.body)}`);
  }

  return response.body.data;
}

async function createTask(token, projectId, overrides = {}) {
  const response = await request(app)
    .post('/api/tasks')
    .set(auth(token))
    .send({ projectId, name: 'Build component library', ...overrides });

  if (response.status !== 201) {
    throw new Error(`Task fixture failed: ${response.status} ${JSON.stringify(response.body)}`);
  }

  return response.body.data;
}

function closeDatabase() {
  return db.close();
}

module.exports = {
  app,
  request,
  db,
  auth,
  closeDatabase,
  createProject,
  createTask,
  registerUser,
  resetDatabase,
  resetRateLimits,
  uniqueEmail,
  DEFAULT_PASSWORD,
};
