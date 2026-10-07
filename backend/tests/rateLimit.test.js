// Kept in its own file because the limiters read their ceilings from env when
// the module is first imported, and node:test gives each file a fresh process.
process.env.PMS_TEST_AUTH_RATE_LIMIT = '3';
process.env.PMS_TEST_API_RATE_LIMIT = '4';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  app,
  request,
  auth,
  closeDatabase,
  registerUser,
  resetDatabase,
  resetRateLimits,
  uniqueEmail,
} = require('./helpers');

test.beforeEach(async () => {
  await resetDatabase();
  resetRateLimits();
});

test.after(closeDatabase);

test.describe('credential rate limiting', () => {
  test('stops login attempts once the window budget is spent', async () => {
    const { payload } = await registerUser();

    const attempts = [];
    for (let index = 0; index < 5; index += 1) {
      attempts.push(
        await request(app)
          .post('/api/auth/login')
          .send({ email: payload.email, password: 'DefinitelyWr0ng' })
      );
    }

    const statuses = attempts.map((response) => response.status);
    // Registering above already spent one of the three allowed requests.
    assert.deepEqual(statuses, [401, 401, 429, 429, 429]);

    const limited = attempts.find((response) => response.status === 429);
    assert.equal(limited.body.error.code, 'RATE_LIMITED');
  });

  test('limits registration as well as login', async () => {
    const statuses = [];
    for (let index = 0; index < 5; index += 1) {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ fullName: 'Ada Lovelace', email: uniqueEmail('burst'), password: 'Passw0rd123' });
      statuses.push(response.status);
    }

    assert.deepEqual(statuses, [201, 201, 201, 429, 429]);
  });

  test('the general limiter guards authenticated endpoints too', async () => {
    const { token } = await registerUser();

    const statuses = [];
    for (let index = 0; index < 10; index += 1) {
      const response = await request(app).get('/api/projects').set(auth(token));
      statuses.push(response.status);
      if (response.status === 429) {
        assert.equal(response.body.error.code, 'RATE_LIMITED');
        break;
      }
    }

    // Registration spent one of the four allowed requests.
    assert.deepEqual(statuses, [200, 200, 200, 429]);
  });

  test('the health check is never throttled', async () => {
    for (let index = 0; index < 8; index += 1) {
      const response = await request(app).get('/health');
      assert.equal(response.status, 200);
    }
  });
});
