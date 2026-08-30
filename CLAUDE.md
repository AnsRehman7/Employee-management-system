# DayMark

Workforce, attendance, and project-delivery platform. Monorepo, three deployable codebases,
one shared Postgres.

| Path             | Stack                              | Deploys to            |
| ---------------- | ---------------------------------- | --------------------- |
| `frontend/`      | React 19 + Vite + Tailwind v4      | Netlify (`base = frontend`) |
| `backend/`       | Express + Prisma + Postgres        | Vercel (serverless)   |
| `AttendenceApp/` | React Native (Android-first)       | APK, sideloaded       |

Data lives in Neon Postgres. OTP and rate-limit state live in Upstash Redis.
Auth is Firebase (custom tokens), email is SMTP via nodemailer, AI planning is Groq.

## Commands

```bash
# backend
cd backend && npm test          # node --test, no DB needed
cd backend && npm run dev       # node --watch, :4000
cd backend && npx prisma migrate dev --name <name>

# frontend
cd frontend && npm run lint     # must pass with 0 warnings
cd frontend && npm test         # vitest
cd frontend && npm run build    # always run before claiming a UI change is done

# mobile
cd AttendenceApp && npm test
cd AttendenceApp/android && ./gradlew assembleRelease
```

Before saying a change is finished: backend `npm test`, frontend `lint` + `test` + `build`.
Lint and tests passing is not enough on its own — the Vite build catches things they miss.

## Invariants

These are the rules that break production quietly when violated. They are not style preferences.

**Every query is tenant-scoped.** Each row belongs to an `organizationId`. A Prisma call that
filters by `id` alone and not also by `organizationId` is a cross-tenant data leak, even when
it looks correct in testing with one workspace. Use `where: { id, organizationId: currentUser.organizationId }`.

**Permissions are checked at the route, ownership in the service.** Routes declare
`requirePermission(PERMISSIONS.X)`; the service still re-checks that the specific record belongs
to the caller's org. Neither layer is redundant.

**Attendance is business-day based, never calendar-day based.** This workspace runs an overnight
shift and a scan after midnight belongs to the day the shift *started*. See the `attendance-rules` skill
before touching anything that groups, filters, or reports on attendance dates.

**Serverless has no shared memory.** Vercel gives each invocation its own process. Anything that must
persist between requests goes in Redis or Postgres. `src/middlewares/rateLimit.middleware.js` uses an
in-process `Map` and is therefore per-lambda and approximate by design — don't build on that pattern.

**Never hard-fail at boot on missing config.** A throw at module load takes down every route and
returns an opaque `FUNCTION_INVOCATION_FAILED`. Collect config problems, warn, and fail closed at
request time in the one handler that needs the value.

## Conventions

- **Backend layering:** `routes` (auth + permission) → `controllers` (`asyncHandler`, parse with
  `parseBody(schema, req.body)`, respond `{ data }`) → `services` (all business logic, tenant scoping,
  throw `ApiError`). Controllers hold no logic; services never touch `req`/`res`.
- **Validation** is zod in `src/utils/validators.js`. Errors surface as field errors, so add issues with
  a `path` rather than throwing bare messages.
- **Tests** are `node:test` + `node:assert/strict` on the backend, Vitest on the frontend. Backend tests
  run without a database — test pure logic and schemas, not queries.
- **Object keys and imports are alphabetized** throughout this codebase. Match it.
- Frontend API calls go through `src/context/api.js`, which unwraps `{ data }` and attaches the
  Firebase token. Don't call `fetch` directly from a component.

## Skills

Load these when the work touches their area — they carry detail deliberately kept out of this file:

- `assistant` — the AI chatbot: interpret/execute split, signed plans, action allowlist.
- `attendance-rules` — overnight shifts, business days, lateness. Read before any attendance change.
- `backend-endpoint` — adding an endpoint end to end, with the tenancy and permission checklist.
- `theming` — Tailwind v4 dark mode, the CSS layer precedence trap.
- `destructive-data-ops` — the cascade audit required before writing any delete.
- `deploy-preflight` — env matrix and what breaks on Vercel/Netlify specifically.
- `mobile-release` — building a shareable APK, and the ProGuard trap that silently strips config.
