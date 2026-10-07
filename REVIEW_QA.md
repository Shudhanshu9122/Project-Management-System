# Review Q&A

Twenty-five questions a reviewer is likely to ask, answered from this codebase rather than in the
abstract. File references are given so the answer can be checked.

## Authentication and sessions

**1. Walk me through what happens when a user logs in.**

`POST /api/auth/login` goes through `authLimiter`, then `validate(schemas.login)`, then
`login` in [auth.controller.js](backend/src/controllers/auth.controller.js). The controller selects
the account by `lower(email) = lower($1)` and compares the password with `bcrypt.compare`. On
success it signs a JWT containing a random `jti` and `sub` set to the user id, and returns
`{ user, token }`. The client stores the token, and from then on sends
`Authorization: Bearer <token>`. The user object never contains `password_hash`, because
`USER_COLUMNS` in that file lists the returned columns explicitly.

**2. Why JWT instead of server-side sessions?**

The same token has to work for a browser and for a native app on a different origin. A cookie session
would need `SameSite=None; Secure`, CORS credentials and cookie handling in Expo; a bearer token is
one header on both clients. The cost is that a JWT cannot be revoked by deleting a row, which is why
`revoked_tokens` exists (see question 3).

**3. How does logout actually invalidate a token?**

The signature stays valid until `exp`, so revocation has to be recorded. Logout inserts the token's
`jti` into `revoked_tokens` with `to_timestamp(exp)` as its expiry
([auth.controller.js](backend/src/controllers/auth.controller.js)), and `requireAuth` runs
`SELECT 1 FROM revoked_tokens WHERE jti = $1` on every request
([auth.js](backend/src/middleware/auth.js)). A revoked token gets `401 TOKEN_REVOKED` and both
clients clear the session and say why.

**4. What is the difference between `TOKEN_EXPIRED` and `INVALID_TOKEN`, and why bother?**

`jsonwebtoken` throws `TokenExpiredError` for the first and `JsonWebTokenError` for the second, and
[token.js](backend/src/utils/token.js) maps them to different codes. The distinction is only useful
to the client: "your session expired" is a message a user can act on, "invalid token" usually means
something is wrong that they cannot fix.

**5. How do you prevent user enumeration at login?**

Two ways. The response is identical for an unknown account and a wrong password - same status, same
`INVALID_CREDENTIALS` code, same message. And when the account does not exist the controller still
calls `bcrypt.compare` against a `DUMMY_HASH` computed at module load, so the response time does not
reveal which case it was. There is a test asserting both responses are identical.

**6. Why not store the token in a cookie on the web?**

The API is on a different origin from the web app in every realistic deployment, so a cookie would
need `SameSite=None; Secure` plus `credentials: true` in CORS. It is not wrong, it is more moving
parts. The trade-off of `localStorage` - any XSS can read it - is written up in the README's design
decisions, along with the `httpOnly` cookie path for production. The key point is that it is a
documented decision, not an accident.

## Authorization

**7. Why 404 instead of 403 for another user's resource?**

A `403` confirms the resource exists. A `404` says nothing, so an attacker cannot enumerate ids. The
cost is that a typo and a forbidden id look the same. Implemented by making `owner_id = $user` part
of the `WHERE` clause rather than a separate check: a row that is not yours simply is not selected,
so `getOne` and `remove` fall through to `AppError.notFound`.

**8. Tasks have no `owner_id`. How is authorization applied to them?**

Through the join. `findOwnedTask` in [tasks.controller.js](backend/src/controllers/tasks.controller.js)
selects from `tasks t JOIN projects p ON p.id = t.project_id WHERE t.id = $1 AND p.owner_id = $2`,
and the list query filters on `p.owner_id`. Creating or moving a task calls `assertProjectOwned`
first, so a task cannot be parked in someone else's project.

**9. Could a user guess another user's project id and read it?**

No. `uuid` primary keys make guessing impractical, and even with a correct id the query returns
nothing because `owner_id` is in the `WHERE`. There is a test that registers two accounts and asserts
`GET`, `PUT` and `DELETE` on the other's project all return `404`, and that the project is unchanged
afterwards.

## Database

**10. Why is there no `owner_id` on tasks?**

Because it would duplicate `projects.owner_id`. Two sources of truth for the same fact drift, and
which one an authorization check reads would change the answer. Normalization here is not academic:
it removes a class of bug where a task is reassigned to a project the original owner does not own.

**11. Why `DATE` and not `TIMESTAMP` for due dates?**

A due date is a calendar day, not an instant. Storing an instant invites a timezone bug where a task
due on the 16th renders as the 15th for anyone west of UTC.

**12. Then how do you stop that bug from happening anyway?**

`pg` converts a `DATE` to a JavaScript `Date` at local midnight, and `JSON.stringify` then serializes
that instant, which shifts the day. [db.js](backend/src/config/db.js) registers a type parser for OID
1082 that returns the raw string, so `2026-10-16` stays `2026-10-16` from the column to the browser.
A test asserts `typeof project.startDate === 'string'` and the exact value.

**13. Why `CHECK` constraints instead of Postgres enum types?**

Enums need `ALTER TYPE` to change, cannot be reordered, and are awkward to remove a value from.
A `CHECK` is one line in `schema.sql` that can be dropped and recreated, and it keeps the database
vocabulary identical to the zod `z.enum` values. The trade is that a `CHECK` is a table rewrite when
you add a value on a large table, which is not a concern at this size.

**14. Why a unique index on `lower(email)` rather than `UNIQUE(email)`?**

`Ada@example.com` and `ada@example.com` are the same person. A plain unique constraint would let both
register. The API also lowercases the email on the way in, so the index is a backstop that catches a
bug rather than the only thing preventing duplicates.

**15. How do the indexes match the queries?**

`projects_owner_id_idx` serves the list query and `projects_owner_status_idx` serves it with a status
filter. `tasks_project_id_idx` serves a project's task list and the `ON DELETE CASCADE` lookup, which
Postgres does not index for you. `revoked_tokens_pkey` serves the per-request revocation check and
`revoked_tokens_expires_at_idx` exists for the future cleanup query.

**16. Is `schema.sql` a real migration system?**

No, and the docs say so. It is idempotent `CREATE ... IF NOT EXISTS`, which is enough while the
schema only grows. The moment a column has to be altered in place, a tool with up and down steps is
the right answer. Claiming otherwise would be overselling it.

## Validation and injection

**17. Why zod, and where does it run?**

It runs as middleware on every route, for `params`, `query` and `body` -
[schemas.js](backend/src/validators/schemas.js) holds every schema and
[validate.js](backend/src/middleware/validate.js) applies them. zod gives one place to declare rules
and one error shape to return, and it coerces types, so a query string `limit=20` arrives at the
controller as the number `20`. Bodies use `.strict()`, so a typo'd or unexpected key is a `400`
rather than being silently dropped.

**18. Does client-side validation duplicate the server, and is that a problem?**

Yes it duplicates, and it is a deliberate trade. `web/src/validation.js` and
`mobile/src/validation.js` mirror the same rules for instant feedback; the server remains the
authority and its per-field errors are merged on top of the client's. A round trip per keystroke is
worse UX than 30 lines of mirror logic, and both files carry a comment pointing at the server schema
so they are changed together.

**19. How is SQL injection prevented?**

Every query is parameterized (`$1`, `$2`); there is no string concatenation of user input anywhere.
The two places where SQL is assembled at runtime are controlled by whitelists: `buildSet` in
[helpers.js](backend/src/utils/helpers.js) takes a fixed `[[requestField, column]]` list declared in
the controller, and sort columns come from a constant map. An unknown sort is a `400`, not
interpolation, and there is a test sending `sort=owner_id;DROP TABLE users` that asserts `400`.

**20. What about `%` and `_` in a search box?**

In `LIKE`, `%` matches anything and `_` matches one character, so a user typing `100%` would
otherwise match everything. `escapeLike` escapes `\`, `%` and `_`, and the query pairs it with
`ESCAPE '\'`. Tests assert that `search=100%` matches only "Save 100% Budget" and that `search=10_%`
matches nothing.

**21. What happens if a client sends `{"startDate": "2025-02-31"}`?**

zod rejects it before the database sees it. The date validator re-derives the components through
`Date.UTC` and checks they round-trip, which catches `2025-02-31` while still accepting `2025-03-03`.
The error names the field, so the form can put the message under the right input.

## API design

**22. Why does the error response have a `code` as well as a message?**

Messages are for humans and change; codes are for programs. The clients branch on the code - three
different `401` codes each produce a different explanation - while the message can be reworded or
translated without breaking anything.

**23. Why return `{ data, meta }` for lists?**

The counts (`total`, `page`, `totalPages`) belong to the response, not to any item in it. Wrapping
lets the array stay a plain array. `total` is computed before `LIMIT` so pagination can show "1-10 of
43" without a second request.

**24. How does the dashboard compute seven numbers without seven queries?**

One query in [dashboard.controller.js](backend/src/controllers/dashboard.controller.js) defines an
owner-scoped CTE and selects seven scalar subqueries from it. Beyond the round trip, it means the
numbers are mutually consistent: they all read the same snapshot of the data. `overdueTasks` uses
`CURRENT_DATE` on the server, so a device with a wrong clock cannot change the answer.

## Mobile

**25. Where is the mobile token stored, and what happens when it expires?**

In `expo-secure-store`, which is the Android Keystore and the iOS Keychain - see
[client.js](mobile/src/api/client.js). AsyncStorage is deliberately not used for it; it is plain text
on disk and readable on a rooted device. On start-up the app reads the token and calls `/auth/me` to
confirm it before showing anything. If that call fails with `TOKEN_EXPIRED`, `TOKEN_REVOKED` or
`INVALID_TOKEN`, the client clears the token, `AuthContext` drops the user, the navigator swaps to the
auth stack, and the login screen shows "Your session has expired. Please log in again." A network
failure is treated differently: the token is kept, because being offline is not the same as being
logged out.

## Scaling and next steps

**26. What breaks first if this gets a lot of traffic?**

The rate limiter, because it counts in process memory: with three API instances an attacker gets
three times the budget. `express-rate-limit` accepts a shared store, so a Redis instance fixes it
without touching the route definitions. After that, the dashboard query, which is seven scans over
the user's tasks - `tasks_project_status_idx` covers most of it, and a materialized counter on
`projects` would be the next step if it mattered.

**27. How would you add collaboration without rewriting the authorization layer?**

Add `project_members (project_id, user_id, role)` and change the constant `p.owner_id = $1` in each
query to a membership test, ideally as a single `EXISTS (SELECT 1 FROM project_members ...)` predicate
in one shared place. The important part is that ownership is currently expressed as a `WHERE` clause
rather than scattered `if` statements, so the change is localized. Tasks need no change at all,
because they already derive access from their project.

**28. What would you change if you had another week?**

Refresh token rotation, so a session can be extended without a 7-day token; a scheduled
`DELETE FROM revoked_tokens WHERE expires_at < now()`; and a Playwright suite driving the web app,
because the web is currently verified by hand while the API has 65 automated tests.
