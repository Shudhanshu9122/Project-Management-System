# Deployment

Three things get deployed: the database, the API, and the web app. The Android app is built and
installed from a file rather than deployed to a server.

Provider names appear here because the assignment named them. The steps are the same on any host
that can run Node and reach a Postgres instance.

Order matters: the database first, then the API (it needs a `DATABASE_URL`), then the web app (it
needs the API URL), then the APK (it needs the API URL too).

---

## 1. Database - Neon or Supabase

### Neon

1. Create a project at [neon.tech](https://neon.tech). Pick the region closest to where the API will
   run.
2. Copy the connection string from the dashboard. It looks like:

   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

3. Keep `?sslmode=require` on the end. Managed providers refuse unencrypted connections.
4. Create the schema once, from your machine:

   ```bash
   cd backend
   DATABASE_URL='postgresql://...neon.tech/neondb?sslmode=require' npm run migrate
   ```

   Add `&& npm run seed` if you want the demo data in the deployed database.

### Supabase

1. Create a project. The database password is shown once, so save it.
2. **Project settings → Database → Connection string → URI**.
3. For a long-running server use the direct connection (port `5432`). If your host has no static IP
   or you hit connection limits, use the connection pooler on port `6543` instead, which is
   PgBouncer. Note that with PgBouncer in transaction mode you should keep `DATABASE_POOL_MAX` low
   (for example `5`) and set `?pgbouncer=true`.
4. Apply the schema the same way as above.

### Notes that apply to both

- Free tiers suspend an idle database. The first request after a pause can take a few seconds; the
  API's connection timeout is 10 seconds, which covers it.
- Neither provider lets you create a `pms_test` database on the free tier. Run the test suite
  locally or in CI instead.
- `db/schema.sql` only uses `gen_random_uuid()`, which is core in PostgreSQL 13 and later, so no
  extension has to be enabled on the managed instance.

---

## 2. Backend - Render or Railway

The repository already contains `backend/Dockerfile`, so a Docker-based deploy needs no build
configuration. A plain Node deploy works too.

### Render

1. **New → Web Service**, connect the repository.
2. Root directory: `backend`. Runtime: Docker (or Node with build `npm ci` and start
   `node src/server.js`).
3. Health check path: `/health`.
4. Environment:

   | Key | Value |
   | --- | --- |
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | the string from step 1 |
   | `JWT_SECRET` | a fresh random value, **32 characters or more** |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CORS_ORIGINS` | the web URL, e.g. `https://northstar-pms.vercel.app` |
   | `TRUST_PROXY` | `true` (Render terminates TLS in front of your service) |
   | `LOG_LEVEL` | `info` |

   Generate the secret with `openssl rand -base64 48` or
   `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`.

5. Deploy. `NODE_ENV=production` makes the config refuse to start with a short secret, so a weak
   value fails at boot rather than silently shipping.
6. Apply the schema. Either run it once from your machine against the deployed `DATABASE_URL`, or add
   a release step. `docker-compose.yml` uses `node src/scripts/migrate.js && node src/server.js` as
   its command, and the same works as a start command here.
7. Check `https://<your-service>.onrender.com/health` returns `{"status":"ok","database":"up"}`.

### Railway

1. **New Project → Deploy from GitHub repo**.
2. Set the service root to `backend`. Railway detects the Dockerfile.
3. Add the same environment variables. `TRUST_PROXY=true` as well.
4. **Settings → Networking → Generate domain** to get a public URL.
5. Railway can also host the database: add the Postgres plugin and it exposes `DATABASE_URL`
   automatically, so you can skip step 1 entirely.

### After the API is live

```bash
curl https://<your-api-host>/health
curl -X POST https://<your-api-host>/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"fullName":"Smoke Test","email":"smoke@example.com","password":"Passw0rd123"}'
```

If register returns `429 RATE_LIMITED`, the limiter is doing its job and you have used the ten
requests for that IP in the window. Wait fifteen minutes or raise `AUTH_RATE_LIMIT_MAX`.

---

## 3. Web - Vercel or Netlify

The web app is a static bundle. `VITE_API_URL` is inlined at build time, so it must be set *before*
the build runs - changing it later requires a rebuild.

### Vercel

1. **Add New → Project**, import the repository.
2. Root directory: `web`. Framework preset: Vite. Build command `npm run build`, output `dist`.
3. **Environment Variables**: `VITE_API_URL` = `https://<your-api-host>/api`.
4. Deploy.
5. Copy the deployment URL and add it to the backend's `CORS_ORIGINS`, then redeploy the backend.
   Until you do, the browser console shows a CORS error even though the API answers curl fine.
6. Nothing else. `web/vercel.json` already rewrites unknown paths to `index.html`, so a refresh on
   `/projects/:id` is handled by the app rather than returning a 404.

### Netlify

1. **Add new site → Import an existing project**. Base directory `web`, build `npm run build`,
   publish `dist`.
2. Add `VITE_API_URL` under **Site settings → Environment variables**.
3. Update the backend's `CORS_ORIGINS` with the Netlify URL.

   `web/public/_redirects` already contains `/* /index.html 200`, which Vite copies into `dist`, so
   the same routing rule is in place here too.

### Verify the pair

Open the site, register an account and create a project. If the app loads but every request fails,
it is almost always `CORS_ORIGINS` or a missing `/api` suffix on `VITE_API_URL`.

---

## 4. Android APK - Expo / EAS

`mobile/eas.json` defines a `preview` profile with `"buildType": "apk"`, which produces an
installable file instead of a Play Store bundle.

```bash
cd mobile
npm install -g eas-cli
eas login
eas init                      # links the project and writes extra.eas.projectId

# Point the build at the deployed API before building:
echo 'EXPO_PUBLIC_API_URL=https://<your-api-host>/api' > .env

eas build --platform android --profile preview
```

EAS prints a URL when it finishes; open it on the device to install, or scan the QR code.

The same variable can be set in `eas.json` under `build.preview.env`, which is where the committed
placeholder lives, so the build does not depend on a local `.env` file.

### Building without EAS

```bash
npx expo run:android                # debug APK on a connected device or emulator
npx expo start --tunnel             # Expo Go when the phone is not on the same Wi-Fi
```

### The one thing that usually goes wrong

A build that bundles `http://10.0.2.2:4000/api` will work perfectly in the emulator and fail on a
real phone, because `10.0.2.2` is the emulator's alias for the host machine. A physical device needs
either your machine's LAN IP and the same Wi-Fi network, or the deployed API URL. `EXPO_PUBLIC_*`
values are baked in at bundle time, so re-run with `npx expo start --clear` after changing `.env`.

---

## 5. Five-minute demo video checklist

Two devices, one account. Plan for 4:30 and leave slack.

**Prepare (before recording)**

- [ ] Backend deployed and `/health` returns `ok`.
- [ ] Web app deployed and logged in a throwaway browser profile, with the theme set to light for
      legibility on video.
- [ ] APK installed on the phone, or Expo Go running the app.
- [ ] Both clients point at the *same* deployed API.
- [ ] Demo account has data: run `npm run seed` against the deployed database.
- [ ] Notifications and the phone's screen recorder are silenced.
- [ ] Screen recording started on both the desktop and the phone, or use one device and a phone
      camera pointed at it.

**The script**

| Time | What | Why it is on camera |
| --- | --- | --- |
| 0:00 - 0:20 | One sentence on what the project is: a project and task manager, one backend, web plus Android | Sets the frame |
| 0:20 - 0:40 | `curl https://<api>/health` in a terminal | Shows the deployed API is real and healthy |
| 0:40 - 1:10 | Log in on the web with `shudhanshu@example.com` / `Password123`. Land on the dashboard | Same account as mobile, coming up |
| 1:10 - 1:35 | Point at the six stat cards and the donut, then open **Projects** and search for `redesign` | Search, filters and the fact that the numbers come from the API |
| 1:35 - 1:55 | Toggle the theme, then narrow the window to show the sidebar collapsing into a drawer | The responsive and themed requirement, in ten seconds |
| 1:55 - 2:35 | Open **Website Redesign**, click **Add task**, create "Demo sync task" with a due date, save | The write path, a modal form and validation |
| 2:35 - 3:05 | Pick up the phone. Log in with the same account. Land on the dashboard | The same account, a different platform |
| 3:05 - 3:30 | Pull to refresh on Projects, open **Website Redesign** | The task just created on the web is there - this is the core requirement |
| 3:30 - 4:00 | On the phone, tap a task's status badge and change it to Completed; tap the checkbox on another | Editing from mobile, and it is not a read-only client |
| 4:00 - 4:25 | Back on the web, refresh and show the task marked complete from the phone | Round trip proves the shared backend |
| 4:25 - 4:45 | On the phone, turn on airplane mode, pull to refresh, show the offline banner and that the last task list is still readable | The offline requirement |
| 4:45 - 5:00 | Show the repository: `db/schema.sql`, `tests/`, the ER diagram | Where the graded artifacts live |

**If something breaks live**

- A `401` on the web means the token expired. Log in again; the app explains why.
- Requests failing only on the phone means a wrong `EXPO_PUBLIC_API_URL` or a different network.
- A CORS error means the deployed web URL is missing from `CORS_ORIGINS`.
- Keep the raw recordings. A smooth five minutes that was clearly recorded in one take is worth more
  than a re-recorded one, and the fallback recordings can be cut together afterwards.
