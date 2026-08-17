# Deployment Runbook

Deploy in this order: rotate/configure secrets, migrate PostgreSQL, deploy the API, verify readiness, deploy the web client, then publish signed mobile builds.

## 1. Rotate Exposed Credentials

Before the next deployment, revoke and replace every credential previously pasted into chat or screenshots:

- Delete the exposed Firebase service-account key and create a new key only if workload identity is unavailable.
- Rotate the Neon database role password and replace every pooled/unpooled URL.
- Rotate Groq, VAPID, cron, and any leaked signing secrets.
- Search repository history and deployment logs, not only the current files.

The application `.env` files were intentionally not rewritten by this upgrade.

## 2. PostgreSQL and Migrations

Use Neon's unpooled URL for migrations and pooled URL for the serverless runtime.

```powershell
cd backend
$env:DATABASE_URL=$env:DATABASE_URL_UNPOOLED
npx prisma migrate deploy
```

Never run `prisma migrate dev`, `db push`, or Prisma Studio against production. Back up production, test the migration chain on a staging branch/database, and deploy API code only after `migrate deploy` succeeds.

## 3. Vercel API

Set the project root to `backend`, Node.js 22, and configure:

- `NODE_ENV=production`
- pooled `DATABASE_URL`
- exact comma-separated `CORS_ORIGIN` values
- one Firebase Admin credential format from `backend/.env.example`
- `FIREBASE_WEB_API_KEY` only as a local REST fallback; Admin credentials are mandatory in production
- `GROQ_API_KEY` and optional `GROQ_MODEL`
- a long random `CRON_SECRET`
- a long random `OTP_SECRET` (required; rotating it invalidates every outstanding sign-in code)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `MAIL_FROM_ADDRESS` so sign-in codes can be delivered; the API refuses to start in production without them
- optional `SESSION_MAX_DAYS` (default 3) and the `OTP_*` throttles
- `REQUIRE_FIREBASE_APP_CHECK=true` after App Check is configured on every production client
- rate/outbox settings as needed

`postinstall` generates Prisma Client. The daily Vercel cron calls the protected outbox recovery endpoint; normal notifications are still delivered immediately. Vercel Hobby cron schedules cannot run hourly, so the repository uses one daily recovery run. See [Vercel Cron usage and pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing).

Verify after each deployment:

```text
GET https://<api-domain>/health  -> 200
GET https://<api-domain>/ready   -> 200 and status=ready
GET https://<api-domain>/api/auth/me without token -> 401
```

Check structured logs by `X-Request-Id`. A healthy `/health` with a failing `/ready` means the function runs but Firebase or database migrations are not ready.

## 4. Netlify Web App

Set base directory `frontend`, build command `npm run build`, and publish directory `frontend/dist` (or use the root `netlify.toml`). Configure every variable from `frontend/.env.example`.

Firebase configuration:

1. Enable the email/password provider. Google sign-in is no longer used and can be disabled.
2. Add only hostnames, such as `ahsanfyp.netlify.app`, under Authorized domains.
3. Configure the Web Push certificate and set `VITE_FIREBASE_VAPID_KEY`.
4. Register App Check for the deployed hostname before enabling required enforcement in the API.

The Netlify SPA redirect fixes direct navigation and refreshes. Security headers and CSP are in `netlify.toml`; update the API origin there if the backend domain changes.

## 5. Mobile Releases

Create `AttendenceApp/.env` from its example. It needs the HTTPS API/web URLs and Firebase Web API key; office coordinates come from the authenticated API.

Android release signing is externalized. Put these values in user-level `~/.gradle/gradle.properties` or CI secrets, never in Git:

```properties
STAFFFLOW_UPLOAD_STORE_FILE=/absolute/path/to/staffflow-upload.jks
STAFFFLOW_UPLOAD_STORE_PASSWORD=...
STAFFFLOW_UPLOAD_KEY_ALIAS=...
STAFFFLOW_UPLOAD_KEY_PASSWORD=...
```

Build with `cd AttendenceApp/android` then `./gradlew bundleRelease`. For native push notifications, separately register the Android/iOS Firebase apps and add platform configuration files through protected CI secrets.

## 6. Release Gate

- CI green on a clean database migration.
- Staging sign-in code request/verify, resend throttling, wrong-code attempt cap, session expiry after `SESSION_MAX_DAYS`, planner generate/review/approve, task completion, notification, attendance retry, and correction flows tested.
- Confirm super admin password break-glass still works before disabling any email path, and send one real test code end to end through the configured SMTP host.
- No production secrets in source, artifacts, screenshots, or client bundles.
- Database backup and rollback owner confirmed.
- Error monitoring, uptime checks for `/ready`, and alert routing configured.
- Release notes include migration name and known residual risks.
