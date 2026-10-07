# Northstar - Project Management System

A project and task management system with a web app, an Android app and one shared backend, so the
same account sees the same data on both.

The name is just a product name; the repository is the assignment's Project Management System.

```
web (React + Vite)  ─┐
                     ├─►  backend (Express, /api)  ──►  PostgreSQL
mobile (Expo)       ─┘
```

## Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
  - [1. Database](#1-database)
  - [2. Backend](#2-backend)
  - [3. Web](#3-web)
  - [4. Mobile](#4-mobile)
- [Environment variables](#environment-variables)
- [Running the tests](#running-the-tests)
- [Docker](#docker)
- [Mobile against a deployed backend](#mobile-against-a-deployed-backend)
- [Security decisions](#security-decisions)
- [Folder structure](#folder-structure)
- [Demo credentials](#demo-credentials)
- [Design decisions](#design-decisions)
- [Known limitations and future work](#known-limitations-and-future-work)

## Features

**Accounts**

- Register and log in with the same account on web and Android.
- Password rules enforced in three places: the client for instant feedback, zod on the server as the
  authority, and the database as a last resort.
- Logout really invalidates the token server-side, not just on the device.

**Projects**

- Full CRUD with status (`Not Started`, `In Progress`, `Completed`), start and end dates, a
  description, and a check that the end date cannot precede the start date.
- Search by name (debounced 300 ms), filter by status, sort by creation, name or either date,
  paginated.
- Each project reports `taskCount` and `completedTaskCount`, which drives the progress bar.

**Tasks**

- Full CRUD inside a project, with priority (`Low`, `Medium`, `High`), status (`Pending`,
  `In Progress`, `Completed`) and a due date.
- Search, filter by status and priority, sort by creation, name, due date, priority or status,
  paginated, with the owning project's name on every row.
- A task can be moved to another project the user owns.

**Dashboard**

- Six counters: total projects, total tasks, completed, pending, projects in progress, overdue.
- An SVG donut of the task status breakdown and a list of the most recent projects.

**Web**

- Light and dark theme following the OS by default, remembered afterwards.
- Collapsible sidebar on desktop, slide-in drawer on mobile, 360px upward.
- Skeleton loaders, empty states, error states with retry, toasts, confirm dialogs before deletes,
  modal forms, keyboard accessible with visible focus rings.

**Mobile**

- Bottom tabs (Dashboard, Projects, My Tasks, Profile) plus stack screens for project detail and
  the task and project forms.
- Pull-to-refresh on every list, inline status and priority changes, tap to edit, long-press to
  delete, checkbox to complete.
- Token in the Android Keystore, offline banner, and the last loaded task list kept for viewing
  while offline.

## Architecture

```mermaid
flowchart LR
  subgraph clients [Clients]
    W["Web app<br/>React 18 + Vite"]
    M["Android app<br/>Expo / React Native"]
  end

  subgraph api [Backend]
    E["Express 4<br/>/api"]
    A["auth middleware<br/>JWT HS256"]
    V["zod validation"]
    C["controllers"]
    R["rate limiting"]
  end

  DB[("PostgreSQL 16<br/>users, projects, tasks,<br/>revoked_tokens")]

  W -->|"Authorization: Bearer"| E
  M -->|"Authorization: Bearer"| E
  E --> R --> V --> A --> C
  C -->|"pg, parameterized"| DB
```

Both clients call exactly the same endpoints. There is no second backend for mobile.

## Tech stack

| Layer | Choice |
| --- | --- |
| Backend | Node.js 20+, Express 4, CommonJS, `pg` |
| Database | PostgreSQL 14+ |
| Validation | `zod` on body, query and params |
| Auth | JWT (HS256) in `Authorization: Bearer`, `bcryptjs` |
| Security | `helmet`, `cors` allow-list, `express-rate-limit` |
| Logging | `winston` + `morgan` |
| Web | React 18, Vite 5, React Router 6, plain CSS, `lucide-react` |
| Mobile | Expo SDK 57, React Navigation 7, `expo-secure-store`, `@react-native-community/netinfo` |
| Tests | Node's built-in test runner + `supertest`, against a real test database |

## Prerequisites

- Node.js 20 or newer (`node -v`)
- npm 10 or newer
- PostgreSQL 14 or newer, or Docker
- For the mobile app: the Expo Go app on a device, or an Android emulator

## Setup

Clone the repository and install each package. The three packages are independent; there is no
workspace tool.

### 1. Database

Pick whichever option suits you. All three end with a `DATABASE_URL` you can paste into
`backend/.env`.

**Option A - Docker (recommended for a first run)**

```bash
docker run --name pms-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=pms \
  -p 5432:5432 -d postgres:16-alpine

docker exec -it pms-db createdb -U postgres pms_test
```

**Option B - Local PostgreSQL**

```bash
createdb pms
createdb pms_test
```

**Option C - Hosted (Neon or Supabase)**

Create a project in the dashboard and copy the connection string. It usually needs
`?sslmode=require` appended. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

Then create the schema. `db/schema.sql` is idempotent, so running it repeatedly is safe.

```bash
cd backend
npm install
npm run migrate   # applies db/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# edit .env: DATABASE_URL and JWT_SECRET at minimum
npm run migrate
npm run seed      # optional demo data
npm run dev       # node --watch, http://localhost:4000
```

Check it is alive:

```bash
curl http://localhost:4000/health
# {"status":"ok","database":"up","uptime":3}
```

If you have neither Docker nor PostgreSQL, `npm run db:local` starts a throwaway cluster from the
PostgreSQL binaries in `node_modules` on port 5433 and prints the two connection strings. It is a
development convenience; a deployed environment always points `DATABASE_URL` at a real server.

### 3. Web

```bash
cd web
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:4000/api
npm run dev               # http://localhost:5173
```

`CORS_ORIGINS` in `backend/.env` must contain the origin the web app is served from
(`http://localhost:5173` by default).

```bash
npm run build             # production bundle in web/dist
npm run preview           # serve the built bundle on 5173
```

### 4. Mobile

```bash
cd mobile
npm install
cp .env.example .env      # EXPO_PUBLIC_API_URL
npm start                 # then press "a", or scan the QR code with Expo Go

# or directly on an Android emulator
npm run android
```

Two things are easy to get wrong here:

1. **The API URL.** `localhost` inside an Android emulator points at the emulator, not your machine.
   Use `http://10.0.2.2:4000/api` for an emulator and your machine's LAN IP (for example
   `http://192.168.1.20:4000/api`) for a physical device on the same Wi-Fi. The phone and the
   computer must be on the same network, and the port must not be blocked by a firewall.
2. **Metro caches `EXPO_PUBLIC_*` at bundle time.** After editing `.env`, restart with
   `npx expo start --clear`.

Building an installable APK is covered in
[Mobile against a deployed backend](#mobile-against-a-deployed-backend).

## Environment variables

### Backend (`backend/.env`)

| Name | Required | Default | Description |
| --- | --- | --- | --- |
| `NODE_ENV` | no | `development` | `production` enables JSON logs and enforces a long `JWT_SECRET` |
| `PORT` | no | `4000` | HTTP port; `0` lets the OS choose |
| `DATABASE_URL` | **yes** | - | PostgreSQL connection string |
| `TEST_DATABASE_URL` | no | `DATABASE_URL` | Database used by the test suite; point it at `pms_test` |
| `JWT_SECRET` | **yes** | - | Signing key. Must be 32+ characters when `NODE_ENV=production` |
| `JWT_EXPIRES_IN` | no | `7d` | Token lifetime, any `jsonwebtoken` duration |
| `BCRYPT_ROUNDS` | no | `12` | Password hashing cost |
| `DATABASE_POOL_MAX` | no | `10` | `pg` pool size |
| `CORS_ORIGINS` | no | `http://localhost:5173` | Comma separated allow-list |
| `TRUST_PROXY` | no | `false` | `true`, `false` or a hop count; needed behind a load balancer |
| `RATE_LIMIT_WINDOW_MS` | no | `900000` | General API limiter window |
| `RATE_LIMIT_MAX` | no | `300` | Requests per window per IP |
| `AUTH_RATE_LIMIT_MAX` | no | `10` | Requests per window per IP for register and login |
| `LOG_LEVEL` | no | `debug` in dev, `info` in production | `error`, `warn`, `info` or `debug` |

### Web (`web/.env`)

| Name | Required | Default | Description |
| --- | --- | --- | --- |
| `VITE_API_URL` | no | `http://localhost:4000/api` | API base URL including `/api`. Inlined at build time |

### Mobile (`mobile/.env`)

| Name | Required | Default | Description |
| --- | --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | no | `http://10.0.2.2:4000/api` | API base URL including `/api`. Inlined at bundle time |

## Running the tests

The suite is integration-first: it starts no server, but it does talk to a real PostgreSQL database
through `supertest`, so the schema has to exist there.

```bash
cd backend
cp .env.example .env
# point TEST_DATABASE_URL at a throwaway database, e.g. .../pms_test

npm run migrate   # with DATABASE_URL set to the test database, or run it twice
npm test
```

To apply the schema to the test database specifically:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pms_test npm run migrate
```

What is covered (65 tests across two files):

- Registration, duplicate email (`409`), case-insensitive email, validation errors with per-field
  details, unknown fields rejected, malformed JSON.
- Login success, login failure, and that "wrong password" and "unknown account" return the same
  code and message.
- `/auth/me` without a token, with a forged token, with an expired token (`TOKEN_EXPIRED`) and with
  a valid one.
- Logout, and that the token is rejected afterwards (`TOKEN_REVOKED`).
- Project and task CRUD, partial updates, empty updates rejected, malformed UUIDs, impossible
  calendar dates, end-before-start rejected on create and on update.
- Cross-account isolation: reading, updating, deleting and moving another account's project or task
  returns `404`, and list endpoints only ever return the caller's rows.
- Dashboard counts per account, including overdue logic.
- Search, filters, sorting (priority ordered by meaning, not by spelling), pagination, and LIKE
  wildcard escaping.
- SQL-injection-shaped input returning a normal empty result, and an invalid sort column rejected.
- Rate limiting on register and login (`429`), the general limiter, and `/health` never throttled.
- CORS headers present for an allowed origin and absent for an unknown one.

The credential limiter is exercised in `tests/rateLimit.test.js`, which sets its own low ceilings
before importing the app, because node's test runner gives each file a fresh process.

## Docker

```bash
docker compose up --build
```

| Service | URL | Notes |
| --- | --- | --- |
| `db` | `localhost:5432` | `postgres` / `postgres`, database `pms`, health-checked |
| `backend` | http://localhost:4000 | Runs `migrate` before `server`, health-checked |
| `web` | http://localhost:5173 | nginx serving the built bundle, API URL baked in at build time |

The web container is built with `VITE_API_URL=http://localhost:4000/api` because the *browser* runs
on your host, not inside the compose network. Change the build arg in `docker-compose.yml` if you
serve the API elsewhere.

## Mobile against a deployed backend

1. Deploy the backend first and copy its public URL, for example
   `https://pms-api.onrender.com`. The base path must end in `/api`.
2. Point the app at it:

   ```bash
   cd mobile
   echo 'EXPO_PUBLIC_API_URL=https://pms-api.onrender.com/api' > .env
   npx expo start --clear
   ```

3. Make sure the deployed backend allows the app. Native requests send no `Origin` header, which the
   CORS configuration always allows, so `CORS_ORIGINS` only needs the web URL.

4. Build an APK with EAS:

   ```bash
   npm install -g eas-cli
   eas login
   eas init                       # links the project, writes extra.eas.projectId
   eas build --platform android --profile preview
   ```

   `preview` is configured in `mobile/eas.json` with `"buildType": "apk"`, which produces a file you
   can install directly rather than an `.aab` for the Play Store. EAS prints a download link when
   the build finishes.

5. Without EAS, `npx expo run:android` builds and installs a debug APK on a connected device or
   running emulator, and `npx expo start --tunnel` works when the phone and the computer are not on
   the same network.

## Security decisions

**Passwords.** Hashed with bcrypt at cost 12 (`BCRYPT_ROUNDS`), never logged, and `password_hash` is
absent from every `SELECT` in the codebase, so no endpoint can return it by accident. The 72 byte
bcrypt input limit is enforced by the validator rather than left implicit.

**User enumeration.** Login returns the same `INVALID_CREDENTIALS` code and message whether the
account exists or the password is wrong, and compares against a dummy hash when the account is
missing so response time does not betray which case it was.

**JWT and logout.** HS256, `sub` for the user id and a random `jti`. A signature stays valid until it
expires, so logout inserts the `jti` into `revoked_tokens` with the token's own expiry, and the auth
middleware checks that table on every request. Expired tokens return `401 TOKEN_EXPIRED`, revoked
ones `401 TOKEN_REVOKED`; both clients use the code to clear the session and explain why.

**Authorization.** Every project query is filtered by `owner_id`, and every task query joins through
`projects.owner_id`. A resource belonging to someone else returns **404, not 403**, so the API does
not confirm that an id exists. Creating or moving a task verifies the target project is owned by the
caller before writing.

**Validation.** zod schemas cover body, query and params for every route. They reject empty or
whitespace-only strings, bad emails, unknown enum values, malformed UUIDs, impossible dates such as
`2025-02-31`, an end date before the start date, unknown JSON keys, and oversize input. A blank
filter (`?status=`) is treated as "not set".

**SQL injection.** Only parameterized queries (`$1`, `$2`). Dynamic `UPDATE ... SET` clauses are
built from a fixed list of `[requestField, column]` pairs declared in the controller, so column names
never come from the request. Sort columns come from a fixed map, and an unknown sort is a `400`
rather than string interpolation. `%` and `_` in search terms are escaped and the query uses
`ESCAPE '\'`.

**Rate limiting.** A strict limiter on `/auth/register` and `/auth/login` (10 per 15 minutes per IP
by default) plus a general API limiter (300 per 15 minutes). Both read their ceilings from env.
`/health` sits before the limiter so a container probe is never throttled. `TRUST_PROXY` lets a
hosted deployment get the real client IP without trusting `X-Forwarded-For` unconditionally.

**CORS.** An allow-list parsed from `CORS_ORIGINS`. A request with no `Origin` header (native apps,
curl, server-to-server) is allowed, because there is no browser policy to enforce there and the JWT
is the real boundary. A disallowed origin receives no CORS headers, so the browser blocks it rather
than the API returning a confusing error.

**Transport.** `helmet` for security headers, `express.json({ limit: '100kb' })`, `x-powered-by`
disabled, and a central error handler that maps known failures to proper status codes while logging
unknown ones with a stack trace and returning only a generic `500` message to the client.

## Folder structure

```
project-management-system/
├── backend/
│   ├── db/schema.sql              # the schema submission item, idempotent
│   ├── src/
│   │   ├── app.js                 # middleware, routes, error handling
│   │   ├── server.js              # http server, graceful shutdown
│   │   ├── config/                # env, database pool, logger
│   │   ├── middleware/            # auth, validate, rateLimit, errorHandler
│   │   ├── routes/                # thin routers
│   │   ├── controllers/           # the logic
│   │   ├── validators/schemas.js  # every zod schema
│   │   ├── utils/                 # AppError, helpers, token
│   │   └── scripts/               # migrate, seed, local db
│   └── tests/                     # integration tests
├── web/src/
│   ├── api/client.js              # one fetch wrapper
│   ├── context/                   # Auth, Theme, Toast
│   ├── hooks/                     # useDebounce, useFetch
│   ├── components/                # Layout, Modal, forms, badges, charts
│   ├── pages/                     # Dashboard, Projects, ProjectDetail, Tasks, auth, 404
│   └── styles/                    # tokens, base, layout, components
├── mobile/
│   ├── App.js, index.js, app.json, eas.json
│   └── src/
│       ├── api/                   # client, secure token, network, offline cache
│       ├── context/               # Auth
│       ├── navigation/            # RootNavigator
│       ├── screens/               # auth, tabs, forms
│       ├── components/            # controls, layout, states, task row
│       └── theme/                 # palette, spacing, dark mode
├── docs/                          # API.md, ER_DIAGRAM.md, DEPLOYMENT.md
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Demo credentials

Created by `npm run seed` in `backend`. This is generated test data, not a real person.

```
email:    demo@example.com
password: Password123
```

The seed creates four projects (Website Redesign, Q4 Marketing Plan, Mobile App Launch, Internal
Tooling Cleanup) and thirteen tasks across every status and priority, including two overdue ones so
the dashboard has something to show. Re-running the seed replaces the demo account's data rather
than duplicating it.

## Design decisions

Notes for the review conversation. Each one is the *reason*, not a restatement of the code.

**Why `pg` and not an ORM.** The assignment asked for parameterized SQL, and the queries here are
small enough to read. The one place where dynamic SQL is unavoidable - a partial `UPDATE` - is
handled with a fixed column list rather than string building.

**Why ownership lives on `projects` only.** Tasks have no `owner_id`. Duplicating it would let the
two copies disagree, and a task's owner is definitionally its project's owner. The cost is a join on
every task query, which the `tasks(project_id)` index already serves.

**Why `lower(email)` has a unique index.** Uniqueness has to be case-insensitive, otherwise
`Ada@example.com` and `ada@example.com` are two accounts for one person. The API lowercases on the
way in as well, so the index is a backstop rather than the only defence.

**Why a `revoked_tokens` table instead of short-lived tokens plus refresh.** Refresh tokens add a
second credential to store, rotate and revoke on two clients. A `jti` list is one insert on logout
and one indexed lookup per request. The table only holds rows until the token would have expired
anyway, so it stays small.

**Why 404 instead of 403.** A `403` tells the caller the resource exists and belongs to someone
else. A `404` says nothing. The cost is that a genuinely mistyped id and a forbidden id look the
same, which is the intended trade-off.

**Why dates are `DATE` and parsed as strings.** `pg` turns a `DATE` into a JavaScript `Date` at local
midnight. Serializing that in a non-UTC timezone moves the calendar day, which is exactly the bug
people hit with due dates. A type parser returns the column untouched and the API contract is
`YYYY-MM-DD` end to end.

**Why the web token is in `localStorage`.** The API is token based and the web app is served from a
different origin than the API in every deployed setup, so a cookie would need
`SameSite=None; Secure` plus CORS credentials. `localStorage` is simpler to run and explain, at the
cost that any XSS on the origin can read the token. The production path is an `httpOnly`,
`Secure`, `SameSite=Lax` cookie issued by the API and refreshed by a short-lived access token, which
also removes the token from JavaScript entirely. That is a deliberate follow-up, not an oversight.

**Why client-side validation duplicates the server rules.** The duplication is real and it is
accepted: a round trip per keystroke is worse UX than 30 lines of mirror logic, and the server stays
the authority. Both copies live next to a comment saying so.

**Why `totalPages` is never 0.** An empty result still reports one page, so a page indicator never
has to special-case zero.

**Why sort has a tiebreaker.** Every list query ends with `, id`, so paginating a set with equal sort
keys cannot repeat or skip a row between pages.

**Why the SQL `CASE` for priority sorting.** Ordering by the stored text would give High, Low, Medium.
A `CASE` expression encodes the intended order without adding a lookup table for three values.

**Why the rate limiter tests live in their own file.** `express-rate-limit` keeps counters in memory
for the life of the process, and node's test runner gives each file its own process. Setting a low
ceiling in the same file as the functional tests would throttle them.

**Why mobile caches the task list in memory.** It covers the case that actually happens - opening the
app with no signal and wanting to see what you were working on - without adding a storage dependency.
A cache that survives a cold start needs the filesystem, which is a larger decision than the feature
deserves right now.

**Why the offline banner and the error states are separate.** A failed request and a missing
connection are different problems with different remedies (retry vs wait), so the app distinguishes
them using `NetInfo` plus the client's `NETWORK_ERROR` code instead of showing one generic failure.

## Known limitations and future work

Stated plainly rather than left for the reader to discover.

- **No refresh tokens.** A session lasts `JWT_EXPIRES_IN` (7 days by default) and then the user logs
  in again. Refresh token rotation is the next step.
- **`revoked_tokens` is never pruned.** Rows are only useful until their `expires_at` passes. A cron
  job or `pg_cron` should delete expired rows; the index on `expires_at` exists for that query.
- **No project sharing or teams.** One owner per project. Collaborators would need a `project_members`
  table and would change every ownership check from "equals owner" to "is a member", which is why it
  is not bolted on now.
- **No task assignment, comments or attachments.** All three are natural additions with the schema
  already normalized to accept them.
- **Mobile tasks cannot be reordered, and there is no drag and drop.** Ordering is by the chosen sort
  key only.
- **Mobile dates are typed, not picked.** A `YYYY-MM-DD` text field with validation avoids adding a
  date picker dependency; `@react-native-community/datetimepicker` would be the upgrade.
- **The rate limiter is in-process.** With more than one API instance each has its own counters.
  A shared store (Redis) is the fix, and `express-rate-limit` accepts one directly.
- **No error tracking or metrics.** `winston` writes structured logs and nothing consumes them yet.
- **The offline cache is in memory.** It survives navigation, not an app restart.
- **CI does not build a mobile binary.** It exports the Android bundle, which catches import and
  syntax errors; an EAS build needs credentials and is left to a manual step.
- **No end-to-end browser tests.** The web app was checked by hand; Playwright would be the addition.
