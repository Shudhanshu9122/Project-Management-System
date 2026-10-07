const { randomUUID } = require('node:crypto');
const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const {
  app,
  request,
  db,
  auth,
  closeDatabase,
  createProject,
  createTask,
  registerUser,
  resetDatabase,
  uniqueEmail,
  DEFAULT_PASSWORD,
} = require('./helpers');

test.beforeEach(resetDatabase);
test.after(closeDatabase);

test.describe('health', () => {
  test('reports the process and database as reachable without authentication', async () => {
    const response = await request(app).get('/health');

    assert.equal(response.status, 200);
    assert.equal(response.body.status, 'ok');
    assert.equal(response.body.database, 'up');
  });
});

test.describe('POST /api/auth/register', () => {
  test('creates an account and returns a token', async () => {
    const { response } = await registerUser({ fullName: 'Grace Hopper', email: 'grace@example.com' });

    assert.equal(response.status, 201);
    assert.equal(response.body.user.fullName, 'Grace Hopper');
    assert.equal(response.body.user.email, 'grace@example.com');
    assert.equal(typeof response.body.user.id, 'string');
    assert.equal(typeof response.body.token, 'string');
  });

  test('never returns the password hash', async () => {
    const { response } = await registerUser();

    const serialized = JSON.stringify(response.body);
    assert.ok(!serialized.includes('passwordHash'));
    assert.ok(!serialized.includes('password_hash'));
    assert.ok(!serialized.includes('$2'));
  });

  test('stores the password as a bcrypt hash, not plain text', async () => {
    const { payload } = await registerUser();

    const { rows } = await db.query('SELECT password_hash FROM users WHERE email = $1', [payload.email]);
    assert.match(rows[0].password_hash, /^\$2[aby]\$/);
    assert.notEqual(rows[0].password_hash, payload.password);
  });

  test('lowercases the email before storing it', async () => {
    const { response } = await registerUser({ email: 'Mixed.Case@Example.COM' });

    assert.equal(response.body.user.email, 'mixed.case@example.com');
  });

  test('rejects a duplicate email with 409, case-insensitively', async () => {
    await registerUser({ email: 'taken@example.com' });
    const { response } = await registerUser({ email: 'TAKEN@example.com' });

    assert.equal(response.status, 409);
    assert.equal(response.body.error.code, 'EMAIL_TAKEN');
  });

  test('rejects invalid input with field level details', async () => {
    const response = await request(app).post('/api/auth/register').send({
      fullName: '   ',
      email: 'not-an-email',
      password: 'short',
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, 'VALIDATION_ERROR');

    const fields = response.body.error.details.map((detail) => detail.field);
    assert.ok(fields.includes('fullName'));
    assert.ok(fields.includes('email'));
    assert.ok(fields.includes('password'));
  });

  test('requires a number in the password', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Ada', email: uniqueEmail(), password: 'onlyletters' });

    assert.equal(response.status, 400);
    assert.match(JSON.stringify(response.body.error.details), /at least one number/);
  });

  test('rejects unknown fields instead of ignoring them', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Ada', email: uniqueEmail(), password: DEFAULT_PASSWORD, role: 'admin' });

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  });

  test('rejects a malformed JSON body with 400', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{"fullName": "Ada",');

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, 'INVALID_JSON');
  });
});

test.describe('POST /api/auth/login', () => {
  test('returns a token for valid credentials', async () => {
    const { payload } = await registerUser();

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: payload.password });

    assert.equal(response.status, 200);
    assert.equal(response.body.user.email, payload.email);
    assert.equal(typeof response.body.token, 'string');
  });

  test('accepts a differently cased email', async () => {
    const { payload } = await registerUser();

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: payload.email.toUpperCase(), password: payload.password });

    assert.equal(response.status, 200);
  });

  test('gives the same answer for a wrong password and an unknown account', async () => {
    const { payload } = await registerUser();

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: 'Wr0ngPassword' });
    const unknownAccount = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'Wr0ngPassword' });

    assert.equal(wrongPassword.status, 401);
    assert.equal(unknownAccount.status, 401);
    assert.equal(wrongPassword.body.error.code, 'INVALID_CREDENTIALS');
    assert.equal(unknownAccount.body.error.code, 'INVALID_CREDENTIALS');
    assert.equal(wrongPassword.body.error.message, unknownAccount.body.error.message);
  });
});

test.describe('GET /api/auth/me', () => {
  test('requires a token', async () => {
    const response = await request(app).get('/api/auth/me');

    assert.equal(response.status, 401);
    assert.equal(response.body.error.code, 'INVALID_TOKEN');
  });

  test('rejects a token signed with another secret', async () => {
    const { id } = await registerUser();
    const forged = jwt.sign({ jti: randomUUID() }, 'a-different-secret', {
      algorithm: 'HS256',
      subject: id,
      expiresIn: '1h',
    });

    const response = await request(app).get('/api/auth/me').set(auth(forged));

    assert.equal(response.status, 401);
    assert.equal(response.body.error.code, 'INVALID_TOKEN');
  });

  test('distinguishes an expired token so clients can redirect to login', async () => {
    const { id } = await registerUser();
    const expired = jwt.sign({ jti: randomUUID() }, process.env.JWT_SECRET, {
      algorithm: 'HS256',
      subject: id,
      expiresIn: '-5s',
    });

    const response = await request(app).get('/api/auth/me').set(auth(expired));

    assert.equal(response.status, 401);
    assert.equal(response.body.error.code, 'TOKEN_EXPIRED');
  });

  test('returns the current account', async () => {
    const { token, payload } = await registerUser();

    const response = await request(app).get('/api/auth/me').set(auth(token));

    assert.equal(response.status, 200);
    assert.equal(response.body.user.email, payload.email);
  });
});

test.describe('POST /api/auth/logout', () => {
  test('revokes the presented token', async () => {
    const { token } = await registerUser();

    const logout = await request(app).post('/api/auth/logout').set(auth(token));
    assert.equal(logout.status, 204);

    const reuse = await request(app).get('/api/auth/me').set(auth(token));
    assert.equal(reuse.status, 401);
    assert.equal(reuse.body.error.code, 'TOKEN_REVOKED');
  });

  test('records the revocation with its original expiry', async () => {
    const { token } = await registerUser();
    await request(app).post('/api/auth/logout').set(auth(token));

    const { rows } = await db.query('SELECT expires_at FROM revoked_tokens');
    assert.equal(rows.length, 1);
    assert.ok(rows[0].expires_at > new Date(Date.now() - 1000));
  });
});

test.describe('projects', () => {
  test('rejects unauthenticated access', async () => {
    const response = await request(app).get('/api/projects');

    assert.equal(response.status, 401);
  });

  test('creates, reads, updates and deletes a project', async () => {
    const { token } = await registerUser();

    const created = await request(app)
      .post('/api/projects')
      .set(auth(token))
      .send({
        name: 'Q4 Marketing Plan',
        description: 'Campaign calendar and budget split.',
        status: 'In Progress',
        startDate: '2026-09-15',
        endDate: '2026-12-18',
      });

    assert.equal(created.status, 201);
    assert.equal(created.body.data.name, 'Q4 Marketing Plan');
    assert.equal(created.body.data.taskCount, 0);
    assert.equal(created.body.data.completedTaskCount, 0);

    const projectId = created.body.data.id;

    const fetched = await request(app).get(`/api/projects/${projectId}`).set(auth(token));
    assert.equal(fetched.status, 200);
    assert.equal(fetched.body.data.description, 'Campaign calendar and budget split.');

    const updated = await request(app)
      .put(`/api/projects/${projectId}`)
      .set(auth(token))
      .send({ status: 'Completed', name: 'Q4 Marketing Plan (final)' });

    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.status, 'Completed');
    assert.equal(updated.body.data.name, 'Q4 Marketing Plan (final)');

    const removed = await request(app).delete(`/api/projects/${projectId}`).set(auth(token));
    assert.equal(removed.status, 204);

    const gone = await request(app).get(`/api/projects/${projectId}`).set(auth(token));
    assert.equal(gone.status, 404);
  });

  test('returns dates as plain YYYY-MM-DD strings', async () => {
    const { token } = await registerUser();
    const project = await createProject(token, { startDate: '2026-01-06', endDate: '2026-03-31' });

    assert.equal(project.startDate, '2026-01-06');
    assert.equal(project.endDate, '2026-03-31');
    assert.equal(typeof project.startDate, 'string');
  });

  test('rejects an impossible calendar date', async () => {
    const { token } = await registerUser();

    const response = await request(app)
      .post('/api/projects')
      .set(auth(token))
      .send({ name: 'Bad dates', startDate: '2025-02-31' });

    assert.equal(response.status, 400);
    assert.match(JSON.stringify(response.body.error.details), /not a real calendar date/);
  });

  test('rejects an end date before the start date', async () => {
    const { token } = await registerUser();

    const response = await request(app)
      .post('/api/projects')
      .set(auth(token))
      .send({ name: 'Backwards', startDate: '2026-05-01', endDate: '2026-04-01' });

    assert.equal(response.status, 400);
    assert.equal(response.body.error.details[0].field, 'endDate');
  });

  test('rejects an update that would invert stored dates', async () => {
    const { token } = await registerUser();
    const project = await createProject(token, { startDate: '2026-05-01', endDate: '2026-05-20' });

    const response = await request(app)
      .put(`/api/projects/${project.id}`)
      .set(auth(token))
      .send({ endDate: '2026-04-01' });

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  });

  test('rejects an empty update body', async () => {
    const { token } = await registerUser();
    const project = await createProject(token);

    const response = await request(app).put(`/api/projects/${project.id}`).set(auth(token)).send({});

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  });

  test('rejects a malformed uuid in the path', async () => {
    const { token } = await registerUser();

    const response = await request(app).get('/api/projects/not-a-uuid').set(auth(token));

    assert.equal(response.status, 400);
    assert.equal(response.body.error.details[0].field, 'id');
  });

  test('rejects an invalid status value', async () => {
    const { token } = await registerUser();

    const response = await request(app)
      .post('/api/projects')
      .set(auth(token))
      .send({ name: 'Late', status: 'Done' });

    assert.equal(response.status, 400);
    assert.match(JSON.stringify(response.body.error.details), /Status must be one of/);
  });

  test('deleting a project also deletes its tasks', async () => {
    const { token } = await registerUser();
    const project = await createProject(token);
    await createTask(token, project.id);

    await request(app).delete(`/api/projects/${project.id}`).set(auth(token));

    const { rows } = await db.query('SELECT COUNT(*)::int AS total FROM tasks');
    assert.equal(rows[0].total, 0);
  });

  test('treats a blank status filter as not set', async () => {
    const { token } = await registerUser();
    await createProject(token, { name: 'One' });

    const response = await request(app).get('/api/projects?status=&search=').set(auth(token));

    assert.equal(response.status, 200);
    assert.equal(response.body.meta.total, 1);
  });
});

test.describe('project listing', () => {
  test('searches by name', async () => {
    const { token } = await registerUser();
    await createProject(token, { name: 'Website Redesign' });
    await createProject(token, { name: 'Mobile App Launch' });

    const response = await request(app).get('/api/projects?search=redesign').set(auth(token));

    assert.equal(response.body.meta.total, 1);
    assert.equal(response.body.data[0].name, 'Website Redesign');
  });

  test('escapes LIKE wildcards in the search term', async () => {
    const { token } = await registerUser();
    await createProject(token, { name: 'Save 100% Budget' });
    await createProject(token, { name: 'Save 100 Budget' });

    const response = await request(app).get('/api/projects?search=100%').set(auth(token));
    assert.equal(response.body.meta.total, 1);
    assert.equal(response.body.data[0].name, 'Save 100% Budget');

    // `_` is a single character wildcard in LIKE and must not match here.
    const underscore = await request(app).get('/api/projects?search=10_%').set(auth(token));
    assert.equal(underscore.body.meta.total, 0);
  });

  test('filters by status', async () => {
    const { token } = await registerUser();
    await createProject(token, { name: 'A', status: 'Completed' });
    await createProject(token, { name: 'B', status: 'In Progress' });
    await createProject(token, { name: 'C', status: 'In Progress' });

    const response = await request(app)
      .get('/api/projects?status=In%20Progress')
      .set(auth(token));

    assert.equal(response.body.meta.total, 2);
  });

  test('sorts by name in both directions', async () => {
    const { token } = await registerUser();
    await createProject(token, { name: 'Charlie' });
    await createProject(token, { name: 'Alpha' });
    await createProject(token, { name: 'Bravo' });

    const ascending = await request(app).get('/api/projects?sort=name&order=asc').set(auth(token));
    assert.deepEqual(
      ascending.body.data.map((project) => project.name),
      ['Alpha', 'Bravo', 'Charlie']
    );

    const descending = await request(app).get('/api/projects?sort=name&order=desc').set(auth(token));
    assert.deepEqual(
      descending.body.data.map((project) => project.name),
      ['Charlie', 'Bravo', 'Alpha']
    );
  });

  test('paginates and reports the total before the limit is applied', async () => {
    const { token } = await registerUser();
    for (const name of ['One', 'Two', 'Three']) {
      await createProject(token, { name });
    }

    const response = await request(app).get('/api/projects?limit=2&page=2&sort=name').set(auth(token));

    assert.equal(response.body.data.length, 1);
    assert.deepEqual(response.body.meta, { page: 2, limit: 2, total: 3, totalPages: 2 });
  });

  test('rejects a page size above the cap', async () => {
    const { token } = await registerUser();

    const response = await request(app).get('/api/projects?limit=500').set(auth(token));

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  });

  test('includes task counts on each project', async () => {
    const { token } = await registerUser();
    const project = await createProject(token);
    await createTask(token, project.id, { name: 'Audit current pages', status: 'Completed' });
    await createTask(token, project.id, { name: 'Wireframe new landing page' });

    const response = await request(app).get('/api/projects').set(auth(token));

    assert.equal(response.body.data[0].taskCount, 2);
    assert.equal(response.body.data[0].completedTaskCount, 1);
  });

  test('a search term that looks like SQL returns a normal empty result', async () => {
    const { token } = await registerUser();
    await createProject(token, { name: 'Website Redesign' });

    const response = await request(app)
      .get(`/api/projects?search=${encodeURIComponent("' OR 1=1 --")}`)
      .set(auth(token));

    assert.equal(response.status, 200);
    assert.equal(response.body.meta.total, 0);
  });

  test('an invalid sort column is rejected rather than interpolated', async () => {
    const { token } = await registerUser();

    const response = await request(app)
      .get('/api/projects?sort=owner_id;DROP%20TABLE%20users')
      .set(auth(token));

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  });
});

test.describe('tasks', () => {
  test('creates a task in an owned project and returns its project name', async () => {
    const { token } = await registerUser();
    const project = await createProject(token, { name: 'Mobile App Launch' });

    const response = await request(app)
      .post('/api/tasks')
      .set(auth(token))
      .send({
        projectId: project.id,
        name: 'Finalise Play Store listing',
        priority: 'High',
        dueDate: '2026-11-16',
      });

    assert.equal(response.status, 201);
    assert.equal(response.body.data.projectName, 'Mobile App Launch');
    assert.equal(response.body.data.priority, 'High');
    assert.equal(response.body.data.status, 'Pending');
    assert.equal(response.body.data.dueDate, '2026-11-16');
  });

  test('requires a project that exists', async () => {
    const { token } = await registerUser();

    const response = await request(app)
      .post('/api/tasks')
      .set(auth(token))
      .send({ projectId: randomUUID(), name: 'Orphan task' });

    assert.equal(response.status, 404);
    assert.equal(response.body.error.code, 'NOT_FOUND');
  });

  test('updates any subset of fields and moves the task to another owned project', async () => {
    const { token } = await registerUser();
    const first = await createProject(token, { name: 'Website Redesign' });
    const second = await createProject(token, { name: 'Q4 Marketing Plan' });
    const task = await createTask(token, first.id);

    const updated = await request(app)
      .put(`/api/tasks/${task.id}`)
      .set(auth(token))
      .send({ projectId: second.id, status: 'Completed' });

    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.projectId, second.id);
    assert.equal(updated.body.data.projectName, 'Q4 Marketing Plan');
    assert.equal(updated.body.data.status, 'Completed');
  });

  test('rejects an unknown priority', async () => {
    const { token } = await registerUser();
    const project = await createProject(token);

    const response = await request(app)
      .post('/api/tasks')
      .set(auth(token))
      .send({ projectId: project.id, name: 'Urgent', priority: 'Critical' });

    assert.equal(response.status, 400);
    assert.match(JSON.stringify(response.body.error.details), /Priority must be one of/);
  });

  test('deletes a task', async () => {
    const { token } = await registerUser();
    const project = await createProject(token);
    const task = await createTask(token, project.id);

    const removed = await request(app).delete(`/api/tasks/${task.id}`).set(auth(token));
    assert.equal(removed.status, 204);

    const gone = await request(app).get(`/api/tasks/${task.id}`).set(auth(token));
    assert.equal(gone.status, 404);
  });

  test('orders by priority by meaning, not by spelling', async () => {
    const { token } = await registerUser();
    const project = await createProject(token);
    await createTask(token, project.id, { name: 'Low one', priority: 'Low' });
    await createTask(token, project.id, { name: 'High one', priority: 'High' });
    await createTask(token, project.id, { name: 'Medium one', priority: 'Medium' });

    const response = await request(app).get('/api/tasks?sort=priority').set(auth(token));

    assert.deepEqual(
      response.body.data.map((task) => task.priority),
      ['High', 'Medium', 'Low']
    );
  });

  test('filters by project, status and priority together', async () => {
    const { token } = await registerUser();
    const project = await createProject(token, { name: 'Website Redesign' });
    const other = await createProject(token, { name: 'Mobile App Launch' });

    await createTask(token, project.id, { name: 'A', priority: 'High', status: 'Pending' });
    await createTask(token, project.id, { name: 'B', priority: 'High', status: 'Completed' });
    await createTask(token, project.id, { name: 'C', priority: 'Low', status: 'Pending' });
    await createTask(token, other.id, { name: 'D', priority: 'High', status: 'Pending' });

    const response = await request(app)
      .get(`/api/tasks?projectId=${project.id}&status=Pending&priority=High`)
      .set(auth(token));

    assert.equal(response.body.meta.total, 1);
    assert.equal(response.body.data[0].name, 'A');
  });

  test('lists every task belonging to the user across projects', async () => {
    const { token } = await registerUser();
    const first = await createProject(token, { name: 'Website Redesign' });
    const second = await createProject(token, { name: 'Q4 Marketing Plan' });
    await createTask(token, first.id, { name: 'Audit current pages' });
    await createTask(token, second.id, { name: 'Define campaign budget' });

    const response = await request(app).get('/api/tasks?sort=name').set(auth(token));

    assert.equal(response.body.meta.total, 2);
    assert.deepEqual(
      response.body.data.map((task) => task.projectName),
      ['Website Redesign', 'Q4 Marketing Plan']
    );
  });
});

test.describe('cross-account isolation', () => {
  test('another account cannot read, update or delete a project (404, not 403)', async () => {
    const owner = await registerUser();
    const stranger = await registerUser();
    const project = await createProject(owner.token, { name: 'Private plan' });

    const read = await request(app).get(`/api/projects/${project.id}`).set(auth(stranger.token));
    const update = await request(app)
      .put(`/api/projects/${project.id}`)
      .set(auth(stranger.token))
      .send({ name: 'Hijacked' });
    const remove = await request(app).delete(`/api/projects/${project.id}`).set(auth(stranger.token));

    assert.equal(read.status, 404);
    assert.equal(update.status, 404);
    assert.equal(remove.status, 404);
    assert.equal(read.body.error.code, 'NOT_FOUND');

    // The project is untouched.
    const stillThere = await request(app).get(`/api/projects/${project.id}`).set(auth(owner.token));
    assert.equal(stillThere.body.data.name, 'Private plan');
  });

  test('another account cannot read, update or delete a task', async () => {
    const owner = await registerUser();
    const stranger = await registerUser();
    const project = await createProject(owner.token);
    const task = await createTask(owner.token, project.id);

    const read = await request(app).get(`/api/tasks/${task.id}`).set(auth(stranger.token));
    const update = await request(app)
      .put(`/api/tasks/${task.id}`)
      .set(auth(stranger.token))
      .send({ status: 'Completed' });
    const remove = await request(app).delete(`/api/tasks/${task.id}`).set(auth(stranger.token));

    assert.equal(read.status, 404);
    assert.equal(update.status, 404);
    assert.equal(remove.status, 404);
  });

  test('a task cannot be created in someone else\u2019s project', async () => {
    const owner = await registerUser();
    const stranger = await registerUser();
    const project = await createProject(owner.token);

    const response = await request(app)
      .post('/api/tasks')
      .set(auth(stranger.token))
      .send({ projectId: project.id, name: 'Intruder' });

    assert.equal(response.status, 404);
  });

  test('a task cannot be moved into someone else\u2019s project', async () => {
    const owner = await registerUser();
    const stranger = await registerUser();
    const target = await createProject(owner.token, { name: 'Not yours' });
    const ownProject = await createProject(stranger.token, { name: 'Mine' });
    const task = await createTask(stranger.token, ownProject.id);

    const response = await request(app)
      .put(`/api/tasks/${task.id}`)
      .set(auth(stranger.token))
      .send({ projectId: target.id });

    assert.equal(response.status, 404);
  });

  test('list endpoints only ever return the caller\u2019s rows', async () => {
    const owner = await registerUser();
    const stranger = await registerUser();
    const project = await createProject(owner.token, { name: 'Owner project' });
    await createTask(owner.token, project.id, { name: 'Owner task' });
    await createProject(stranger.token, { name: 'Stranger project' });

    const projects = await request(app).get('/api/projects').set(auth(stranger.token));
    const tasks = await request(app).get('/api/tasks').set(auth(stranger.token));

    assert.deepEqual(
      projects.body.data.map((row) => row.name),
      ['Stranger project']
    );
    assert.equal(tasks.body.meta.total, 0);
  });

  test('a task search cannot reach another account\u2019s task by name', async () => {
    const owner = await registerUser();
    const stranger = await registerUser();
    const project = await createProject(owner.token);
    await createTask(owner.token, project.id, { name: 'Secret deliverable' });

    const response = await request(app).get('/api/tasks?search=Secret').set(auth(stranger.token));

    assert.equal(response.body.meta.total, 0);
  });
});

test.describe('dashboard', () => {
  test('reports the caller\u2019s own totals', async () => {
    const { token } = await registerUser();
    const redesign = await createProject(token, { name: 'Website Redesign', status: 'In Progress' });
    const plan = await createProject(token, { name: 'Q4 Marketing Plan', status: 'Completed' });

    await createTask(token, redesign.id, { name: 'A', status: 'Completed' });
    await createTask(token, redesign.id, { name: 'B', status: 'In Progress' });
    await createTask(token, redesign.id, { name: 'C', status: 'Pending' });
    await createTask(token, plan.id, { name: 'D', status: 'Pending' });

    const response = await request(app).get('/api/dashboard').set(auth(token));

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, {
      totalProjects: 2,
      projectsInProgress: 1,
      totalTasks: 4,
      completedTasks: 1,
      pendingTasks: 2,
      inProgressTasks: 1,
      overdueTasks: 0,
    });
  });

  test('counts overdue tasks as past due and not completed', async () => {
    const { token } = await registerUser();
    const project = await createProject(token);
    await createTask(token, project.id, { name: 'Late', dueDate: '2020-01-01', status: 'Pending' });
    await createTask(token, project.id, { name: 'Late but done', dueDate: '2020-01-01', status: 'Completed' });
    await createTask(token, project.id, { name: 'Future', dueDate: '2099-01-01', status: 'Pending' });

    const response = await request(app).get('/api/dashboard').set(auth(token));

    assert.equal(response.body.data.overdueTasks, 1);
  });

  test('does not mix two accounts together', async () => {
    const first = await registerUser();
    const second = await registerUser();
    const project = await createProject(first.token);
    await createTask(first.token, project.id);

    const response = await request(app).get('/api/dashboard').set(auth(second.token));

    assert.deepEqual(response.body.data, {
      totalProjects: 0,
      projectsInProgress: 0,
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      inProgressTasks: 0,
      overdueTasks: 0,
    });
  });

  test('requires authentication', async () => {
    const response = await request(app).get('/api/dashboard');

    assert.equal(response.status, 401);
  });
});

test.describe('transport level behaviour', () => {
  test('answers unknown routes with the shared error shape', async () => {
    const response = await request(app).get('/api/does-not-exist');

    assert.equal(response.status, 404);
    assert.equal(response.body.error.code, 'NOT_FOUND');
  });

  test('sends CORS headers for an allowed origin and none for an unknown one', async () => {
    const allowed = await request(app).get('/health').set('Origin', 'http://localhost:5173');
    assert.equal(allowed.headers['access-control-allow-origin'], 'http://localhost:5173');

    const blocked = await request(app).get('/health').set('Origin', 'https://evil.example');
    assert.equal(blocked.headers['access-control-allow-origin'], undefined);
  });

  test('allows requests with no Origin header, as native clients send', async () => {
    const response = await request(app).get('/health');

    assert.equal(response.status, 200);
  });

  test('does not advertise the framework', async () => {
    const response = await request(app).get('/health');

    assert.equal(response.headers['x-powered-by'], undefined);
    assert.ok(response.headers['content-security-policy']);
  });
});
