# ✅ PROSHU Submission Checklist

Everything the assignment asks for, and where to find it. Items marked **[fill in]** are placeholders that only you can provide.
that only you can provide.

## Links

| Item | Where |
| --- | --- |
| Public GitHub repository | **[fill in]** `https://github.com/Shudhanshu9122/project-management-system` |
| Deployed web app | **[fill in]** e.g. `https://proshu-pms.vercel.app` |
| Deployed backend API | **[fill in]** e.g. `https://pms-api.onrender.com` (health: `/health`) |
| Android APK / EAS build link | **[fill in]** e.g. `https://expo.dev/accounts/<user>/projects/proshu-pms/builds/<id>` |
| Demo video (5 minutes) | **[fill in]** e.g. `https://youtu.be/<id>` - script in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#5-five-minute-demo-video-checklist) |

## Deliverables

| Deliverable | Location |
| --- | --- |
| Complete project as a ZIP | `project-management-system.zip` (built without `node_modules`, with `.env.example` files) |
| README | [README.md](README.md) |
| API documentation | [docs/API.md](docs/API.md) |
| ER diagram | [docs/ER_DIAGRAM.md](docs/ER_DIAGRAM.md) |
| Deployment guide | [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) |
| Schema submission item | [backend/db/schema.sql](backend/db/schema.sql) |
| Review preparation | [REVIEW_QA.md](REVIEW_QA.md) |

## Backend requirements

| Requirement | Status | Location |
| --- | --- | --- |
| Node.js + Express 4, CommonJS | Done | [backend/package.json](backend/package.json), [backend/src/app.js](backend/src/app.js) |
| MySQL through `mysql2`, parameterized only | Done | [backend/src/config/db.js](backend/src/config/db.js), all controllers |
| zod validation on body, query and params | Done | [validators/schemas.js](backend/src/validators/schemas.js), [middleware/validate.js](backend/src/middleware/validate.js) |
| JWT HS256 in `Authorization: Bearer` | Done | [utils/token.js](backend/src/utils/token.js), [middleware/auth.js](backend/src/middleware/auth.js) |
| bcrypt password hashing | Done | [controllers/auth.controller.js](backend/src/controllers/auth.controller.js) |
| `helmet`, `cors` allow-list, `express-rate-limit` | Done | [app.js](backend/src/app.js), [middleware/rateLimit.js](backend/src/middleware/rateLimit.js) |
| `winston` + `morgan` logging | Done | [config/logger.js](backend/src/config/logger.js), [app.js](backend/src/app.js) |
| `npm run migrate` and `npm run seed` | Done | [scripts/migrate.js](backend/src/scripts/migrate.js), [scripts/seed.js](backend/src/scripts/seed.js) |
| 17 endpoints including `/health` | Done | [routes/](backend/src/routes), [docs/API.md](docs/API.md) |
| One error shape with codes and details | Done | [middleware/errorHandler.js](backend/src/middleware/errorHandler.js) |
| Integration tests with supertest | Done | [backend/tests/](backend/tests) - 65 tests |
| Dockerfile for the backend | Done | [backend/Dockerfile](backend/Dockerfile) |
| Graceful shutdown on `SIGTERM` | Done | [server.js](backend/src/server.js) |

## Database requirements

| Requirement | Status | Location |
| --- | --- | --- |
| `users`, `projects`, `tasks`, `revoked_tokens` | Done | [backend/db/schema.sql](backend/db/schema.sql) |
| UUID primary keys from `randomUUID()` | Done | same |
| Foreign keys with `ON DELETE CASCADE` | Done | same |
| `CHECK` constraints on status, priority and dates | Done | same, listed in [ER_DIAGRAM.md](docs/ER_DIAGRAM.md#constraints) |
| Case-insensitive unique index on `email` | Done | same |
| Indexes on `owner_id`, `(owner_id, status)`, `project_id`, `(project_id, status)` | Done | same |
| Idempotent schema | Done | same, `IF NOT EXISTS` throughout |
| `DATE` columns returned as `YYYY-MM-DD` strings | Done | [config/db.js](backend/src/config/db.js) type parser for `dateStrings: true` |

## Web requirements

| Requirement | Status | Location |
| --- | --- | --- |
| React 18 + Vite, JavaScript | Done | [web/package.json](web/package.json) |
| React Router 6 | Done | [web/src/App.jsx](web/src/App.jsx) |
| Custom CSS design system, no UI kit | Done | [web/src/styles/](web/src/styles) |
| Light and dark theme, OS default, persisted | Done | [context/ThemeContext.jsx](web/src/context/ThemeContext.jsx) |
| Collapsible sidebar, drawer on mobile | Done | [components/Layout.jsx](web/src/components/Layout.jsx), [Sidebar.jsx](web/src/components/Sidebar.jsx) |
| Status and priority badges, text plus colour | Done | [components/Badge.jsx](web/src/components/Badge.jsx) |
| Progress bars on project cards | Done | [components/ProgressBar.jsx](web/src/components/ProgressBar.jsx) |
| Dashboard with 6 stat cards and an SVG donut | Done | [pages/Dashboard.jsx](web/src/pages/Dashboard.jsx), [components/DonutChart.jsx](web/src/components/DonutChart.jsx) |
| Skeletons, empty states, toasts, confirm dialog, modals | Done | [web/src/components/](web/src/components) |
| Debounced search, filter chips, sort, pagination | Done | [pages/Projects.jsx](web/src/pages/Projects.jsx), [pages/Tasks.jsx](web/src/pages/Tasks.jsx) |
| Project detail with task filters and inline changes | Done | [pages/ProjectDetail.jsx](web/src/pages/ProjectDetail.jsx) |
| 401 handling redirects to login with a message | Done | [api/client.js](web/src/api/client.js), [context/AuthContext.jsx](web/src/context/AuthContext.jsx) |
| `VITE_API_URL` and a protected route | Done | [web/.env.example](web/.env.example), [components/ProtectedRoute.jsx](web/src/components/ProtectedRoute.jsx) |

## Mobile requirements

| Requirement | Status | Location |
| --- | --- | --- |
| Expo, Android | Done | [mobile/app.json](mobile/app.json) - SDK 57 |
| React Navigation, auth stack plus tabs | Done | [navigation/RootNavigator.js](mobile/src/navigation/RootNavigator.js) |
| Token in `expo-secure-store` | Done | [api/client.js](mobile/src/api/client.js) |
| Session restored on start, splash while checking | Done | [context/AuthContext.js](mobile/src/context/AuthContext.js) |
| Expired token returns to login with a message | Done | same, plus [screens/LoginScreen.js](mobile/src/screens/LoginScreen.js) |
| `NetInfo` offline banner and retry | Done | [api/network.js](mobile/src/api/network.js), [components/States.js](mobile/src/components/States.js) |
| Pull-to-refresh on all four lists | Done | Dashboard, Projects, ProjectDetail, Tasks screens |
| Task create, edit, delete; project form | Done | [screens/TaskFormScreen.js](mobile/src/screens/TaskFormScreen.js), [screens/ProjectFormScreen.js](mobile/src/screens/ProjectFormScreen.js) |
| Quick status and priority changes | Done | [components/TaskRow.js](mobile/src/components/TaskRow.js), [components/OptionSheet.js](mobile/src/components/OptionSheet.js) |
| Dark mode follows the system | Done | [theme/index.js](mobile/src/theme/index.js) |
| `EXPO_PUBLIC_API_URL`, documented for emulator and device | Done | [mobile/.env.example](mobile/.env.example), [README](README.md#4-mobile) |
| `eas.json` preview profile building an APK | Done | [mobile/eas.json](mobile/eas.json) |
| Bonus: offline task viewing | Done | [api/offlineCache.js](mobile/src/api/offlineCache.js), [screens/TasksScreen.js](mobile/src/screens/TasksScreen.js) |

## DevOps and bonus features

| Requirement | Status | Location |
| --- | --- | --- |
| `docker-compose.yml` with db, backend and web | Done | [docker-compose.yml](docker-compose.yml), [web/Dockerfile](web/Dockerfile), [web/nginx.conf](web/nginx.conf) |
| GitHub Actions CI | Done | [.github/workflows/ci.yml](.github/workflows/ci.yml) |
| Token revocation on logout | Done | [controllers/auth.controller.js](backend/src/controllers/auth.controller.js) |
| Pagination and sorting | Done | Both list controllers |
| Shared validation rules documented across layers | Done | Comment in [web/src/validation.js](web/src/validation.js) and [mobile/src/validation.js](mobile/src/validation.js) pointing at [backend/src/validators/schemas.js](backend/src/validators/schemas.js) |
| Realistic git history | Done | Small commits per layer; see `git log --oneline` |

## Before you submit

- [ ] Fill in the five links at the top of this file.
- [ ] Replace `JWT_SECRET` on the deployed backend with a 32+ character random value.
- [ ] Set `CORS_ORIGINS` on the backend to the deployed web URL.
- [ ] Confirm `/health` returns `{"status":"ok","database":"up"}` on the deployment.
- [ ] Register a fresh account on the deployed pair and create one project, to prove the whole path
      works outside your machine.
- [ ] Install the APK on a real device and log in with the same account.
- [ ] Record the demo video against the deployed URLs, not against `localhost`.
- [ ] Confirm no `.env` file is committed - only `.env.example`.
- [ ] Run `cd backend && npm test` once more and paste the summary into the submission.
