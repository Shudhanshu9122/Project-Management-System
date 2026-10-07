# API reference

Base URL: `/api` (for example `http://localhost:4000/api`).

All requests and responses are JSON. Response fields are camelCase; the database uses snake_case and
the conversion happens in the SQL projection.

## Conventions

### Authentication

Every endpoint except `POST /api/auth/register`, `POST /api/auth/login` and `GET /health` requires a
bearer token:

```
Authorization: Bearer <token>
```

Tokens are HS256 JWTs. The payload carries `sub` (the user id), `jti` (a random id used for
revocation) and `exp`.

A token can fail in three distinguishable ways, and the clients use the code to decide what to do:

| Code | HTTP | Meaning | Client behaviour |
| --- | --- | --- | --- |
| `INVALID_TOKEN` | 401 | Missing, malformed or wrongly signed | Clear session, go to login |
| `TOKEN_EXPIRED` | 401 | Signature fine, `exp` passed | Clear session, explain the session expired |
| `TOKEN_REVOKED` | 401 | The `jti` is in `revoked_tokens` (logged out) | Clear session, explain they were logged out |

### Error shape

Every error, from validation to a database constraint, uses one shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": [{ "field": "email", "message": "Enter a valid email address." }]
  }
}
```

`details` is present only when there is something field-specific to say.

| Code | HTTP | When |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | zod rejected the body, query or params |
| `INVALID_JSON` | 400 | The request body is not parseable |
| `CHECK_VIOLATION` | 400 | A database CHECK constraint rejected the values |
| `INVALID_INPUT` | 400 | Postgres rejected a value's format (`22P02`) |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password (one message for both) |
| `INVALID_TOKEN` / `TOKEN_EXPIRED` / `TOKEN_REVOKED` | 401 | See above |
| `NOT_FOUND` | 404 | Missing, or owned by another account |
| `EMAIL_TAKEN` | 409 | Registering an email that already exists |
| `DUPLICATE_RESOURCE` | 409 | Another unique constraint fired |
| `REFERENCE_VIOLATION` | 409 | A foreign key target does not exist |
| `PAYLOAD_TOO_LARGE` | 413 | Body over 100kb |
| `RATE_LIMITED` | 429 | Limiter budget spent |
| `INTERNAL_ERROR` | 500 | Unexpected; the real cause is only in the logs |

### Pagination envelope

List endpoints return:

```json
{
  "data": [],
  "meta": { "page": 1, "limit": 10, "total": 0, "totalPages": 1 }
}
```

`total` is the count before `limit` is applied. `totalPages` is never 0.

### Shared list parameters

| Parameter | Type | Default | Notes |
| --- | --- | --- | --- |
| `search` | string, max 100 | - | Case-insensitive partial match on name. `%` and `_` are literal |
| `sort` | enum | `createdAt` | See each endpoint |
| `order` | `asc` \| `desc` | `desc` for `createdAt`, `asc` otherwise | |
| `page` | integer ≥ 1 | `1` | |
| `limit` | integer 1-100 | `10` | 100 is the hard cap |

An empty value (`?status=`) means "not set", so a cleared filter in the UI does not need special
handling on the client.

---

## Auth

### POST /api/auth/register

Creates an account and returns a session.

- Auth: none
- Rate limited by the strict credential limiter
- Body:

| Field | Rules |
| --- | --- |
| `fullName` | required, trimmed, 1-120 characters |
| `email` | required, valid email, max 254 characters, lowercased before storing |
| `password` | required, 8-72 characters, at least one letter and one number |

Success `201`:

```json
{
  "user": { "id": "uuid", "fullName": "Ada Lovelace", "email": "ada@example.com", "createdAt": "2026-10-06T11:22:33.000Z" },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

Errors: `400 VALIDATION_ERROR`, `409 EMAIL_TAKEN`, `429 RATE_LIMITED`.

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"fullName":"Ada Lovelace","email":"ada@example.com","password":"Passw0rd123"}'
```

### POST /api/auth/login

- Auth: none
- Rate limited by the strict credential limiter
- Body: `email`, `password` (presence only; no composition rules, so an existing weak password still
  works)

Success `200`: same body as register.

Errors: `400 VALIDATION_ERROR`, `401 INVALID_CREDENTIALS` (identical message for unknown account and
wrong password), `429 RATE_LIMITED`.

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@example.com","password":"Password123"}'
```

### POST /api/auth/logout

Revokes the presented token by inserting its `jti` into `revoked_tokens`.

- Auth: required
- Body: none

Success `204` with no body. Using the token again returns `401 TOKEN_REVOKED`.

```bash
curl -X POST http://localhost:4000/api/auth/logout -H "Authorization: Bearer $TOKEN"
```

### GET /api/auth/me

Returns the current account.

- Auth: required

Success `200`:

```json
{ "user": { "id": "uuid", "fullName": "Demo User", "email": "demo@example.com", "createdAt": "2026-10-06T11:22:33.000Z" } }
```

Errors: `401 INVALID_TOKEN`, `401 TOKEN_EXPIRED`, `401 TOKEN_REVOKED`.

```bash
curl http://localhost:4000/api/auth/me -H "Authorization: Bearer $TOKEN"
```

---

## Projects

All project endpoints are scoped to the authenticated owner. A project belonging to another account
returns `404`.

### GET /api/projects

- Auth: required
- Query: the [shared list parameters](#shared-list-parameters) plus

| Parameter | Values |
| --- | --- |
| `status` | `Not Started`, `In Progress`, `Completed` |
| `sort` | `createdAt`, `name`, `startDate`, `endDate` |

Success `200`:

```json
{
  "data": [
    {
      "id": "uuid",
      "ownerId": "uuid",
      "name": "Website Redesign",
      "description": "New marketing site with a shared component library.",
      "status": "In Progress",
      "startDate": "2026-08-03",
      "endDate": "2026-11-20",
      "createdAt": "2026-10-06T11:22:33.000Z",
      "updatedAt": "2026-10-06T11:22:33.000Z",
      "taskCount": 5,
      "completedTaskCount": 2
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 4, "totalPages": 1 }
}
```

```bash
curl "http://localhost:4000/api/projects?search=redsign&status=In%20Progress&sort=name&order=asc&limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

### GET /api/projects/:id

- Auth: required
- Params: `id` must be a UUID

Success `200`: `{ "data": { ...project, "taskCount": 5, "completedTaskCount": 2 } }`

Errors: `400 VALIDATION_ERROR` for a malformed UUID, `404 NOT_FOUND` if missing or not owned.

```bash
curl http://localhost:4000/api/projects/$PROJECT_ID -H "Authorization: Bearer $TOKEN"
```

### POST /api/projects

- Auth: required
- Body:

| Field | Rules |
| --- | --- |
| `name` | required, trimmed, 1-120 characters |
| `description` | optional, max 2000 characters, `null` or `''` stores no description |
| `status` | optional, one of the three values, defaults to `Not Started` |
| `startDate` | optional, `YYYY-MM-DD`, must be a real calendar date |
| `endDate` | optional, `YYYY-MM-DD`, must not be before `startDate` |

Unknown keys are rejected with `400`.

Success `201`: `{ "data": { ...project, "taskCount": 0, "completedTaskCount": 0 } }`

Errors: `400 VALIDATION_ERROR` (with `details[].field` naming the offending input, and cross-field
date errors reported against `endDate`).

```bash
curl -X POST http://localhost:4000/api/projects \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"Q4 Marketing Plan","status":"In Progress","startDate":"2026-09-15","endDate":"2026-12-18"}'
```

### PUT /api/projects/:id

Partial update. Any subset of the create fields; at least one must be present.

- Auth: required
- Params: `id` UUID
- Body: any subset of `name`, `description`, `status`, `startDate`, `endDate`

The date ordering rule is checked against the stored row too, so sending only `endDate` cannot invert
a project's dates.

Success `200`: the updated project with fresh task counts.

Errors: `400 VALIDATION_ERROR` (empty body, or dates that would invert), `404 NOT_FOUND`.

```bash
curl -X PUT http://localhost:4000/api/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"status":"Completed"}'
```

### DELETE /api/projects/:id

- Auth: required
- Params: `id` UUID

Success `204` with no body. Tasks are removed by `ON DELETE CASCADE`.

Errors: `404 NOT_FOUND`.

```bash
curl -X DELETE http://localhost:4000/api/projects/$PROJECT_ID -H "Authorization: Bearer $TOKEN"
```

---

## Tasks

Task access is derived from the owning project, so a task in someone else's project returns `404`.

### GET /api/tasks

- Auth: required
- Query: the [shared list parameters](#shared-list-parameters) plus

| Parameter | Values |
| --- | --- |
| `projectId` | UUID, restricts to one project |
| `status` | `Pending`, `In Progress`, `Completed` |
| `priority` | `Low`, `Medium`, `High` |
| `sort` | `createdAt`, `name`, `dueDate`, `priority`, `status` |

`sort=priority` orders High, Medium, Low and `sort=status` orders Pending, In Progress, Completed,
using a `CASE` expression rather than the stored text.

Success `200`:

```json
{
  "data": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "projectName": "Website Redesign",
      "name": "Build component library",
      "description": null,
      "priority": "High",
      "status": "In Progress",
      "dueDate": "2026-09-25",
      "createdAt": "2026-10-06T11:22:33.000Z",
      "updatedAt": "2026-10-06T11:22:33.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 13, "totalPages": 2 }
}
```

```bash
curl "http://localhost:4000/api/tasks?status=Pending&priority=High&sort=dueDate&order=asc" \
  -H "Authorization: Bearer $TOKEN"
```

### GET /api/tasks/:id

- Auth: required

Success `200`: `{ "data": { ...task, "projectName": "Website Redesign" } }`

Errors: `400 VALIDATION_ERROR`, `404 NOT_FOUND`.

### POST /api/tasks

- Auth: required
- Body:

| Field | Rules |
| --- | --- |
| `projectId` | required UUID, must belong to the caller |
| `name` | required, trimmed, 1-160 characters |
| `description` | optional, max 2000 characters |
| `priority` | optional, `Low` / `Medium` / `High`, defaults to `Medium` |
| `status` | optional, `Pending` / `In Progress` / `Completed`, defaults to `Pending` |
| `dueDate` | optional, `YYYY-MM-DD` |

Success `201`: the created task including `projectName`.

Errors: `400 VALIDATION_ERROR`, `404 NOT_FOUND` if the project is missing or not owned.

```bash
curl -X POST http://localhost:4000/api/tasks \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"projectId":"'$PROJECT_ID'","name":"Finalise Play Store listing","priority":"High","dueDate":"2026-11-16"}'
```

### PUT /api/tasks/:id

Partial update. Any subset of the create fields, and the project may be changed to move the task.

- Auth: required

Both the task and the destination project are checked for ownership before the write.

Success `200`: the updated task.

Errors: `400 VALIDATION_ERROR`, `404 NOT_FOUND` (the task, the current project, or the target
project is not owned).

```bash
curl -X PUT http://localhost:4000/api/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"status":"Completed"}'
```

### DELETE /api/tasks/:id

- Auth: required

Success `204` with no body. Errors: `404 NOT_FOUND`.

```bash
curl -X DELETE http://localhost:4000/api/tasks/$TASK_ID -H "Authorization: Bearer $TOKEN"
```

---

## Dashboard

### GET /api/dashboard

All seven numbers are computed in one query against a CTE scoped to the caller.

- Auth: required

Success `200`:

```json
{
  "data": {
    "totalProjects": 4,
    "totalTasks": 13,
    "completedTasks": 5,
    "pendingTasks": 6,
    "inProgressTasks": 2,
    "projectsInProgress": 2,
    "overdueTasks": 2
  }
}
```

A task is overdue when `due_date < CURRENT_DATE` and its status is not `Completed`, using the
database's date rather than the client's clock.

Errors: `401` when unauthenticated.

```bash
curl http://localhost:4000/api/dashboard -H "Authorization: Bearer $TOKEN"
```

---

## Health

### GET /health

Liveness and readiness in one endpoint. Unauthenticated and never rate limited, so a container probe
is not throttled.

Success `200`:

```json
{ "status": "ok", "database": "up", "uptime": 42 }
```

If the database cannot be reached: `503` with `{ "status": "degraded", "database": "unreachable" }`.

```bash
curl http://localhost:4000/health
```
