# DayMark

DayMark is a multi-tenant workforce and project-delivery system built as a BSCS final-year project. It combines role-based operations, auditable project/task workflows, verified attendance, configurable business modules, durable notifications, and an explainable constraint-aware project planner.

The planner is the research contribution: it turns requirements into a traceable, dependency-aware plan; schedules work against calendars and employee capacity; explains suggested assignees; flags infeasible plans; and requires a manager to approve or override every generated plan before tasks are created.

## Applications

| Application | Stack | Purpose |
| --- | --- | --- |
| `backend` | Node.js, Express, Prisma, PostgreSQL, Firebase Admin | Tenant-safe API, workflow rules, planner, attendance verification, notifications |
| `frontend` | React, Vite, Tailwind CSS, Firebase Auth | Responsive operational workspace and planner review UI |
| `AttendenceApp` | React Native | Biometric and geofence-assisted attendance client |

## Production-Oriented Capabilities

- Multi-tenant role and per-user permission enforcement in the API.
- Email/password and Google authentication through Firebase.
- Versioned projects/tasks, soft deletion, audit timelines, dependencies, comments, mentions, watchers, and attachment metadata.
- Requirement-to-task traceability, milestones, acceptance criteria, effort, skills, risks, confidence scores, and dependency graphs.
- Capacity/calendar scheduling with working days, holidays, existing workload, and part-time employee limits.
- Explainable assignee recommendations with explicit human approval and recorded overrides.
- Planner evaluation metrics for requirement coverage, violations, effort error, planning time saved, and manager override rate.
- Server-issued attendance challenges, replay-safe retries, accuracy checks, database-backed office geofences, and correction requests.
- Durable in-app/browser push notifications through an outbox with retry recovery.
- Versioned custom modules, typed custom fields, runtime validation, and custom records.
- Request IDs, strict production configuration, CORS allowlists, security headers, rate limiting, readiness checks, and CI.

## Local Start

Prerequisites: Node.js 22, PostgreSQL, Firebase web configuration, and Firebase Admin credentials.

```powershell
cd backend
npm ci
Copy-Item .env.example .env
npx prisma migrate deploy
npm run dev
```

```powershell
cd frontend
npm ci
Copy-Item .env.example .env
npm run dev
```

Use `npm ci`, not `npm install`, in CI and deployment builds. Groq is optional locally; deterministic planning remains available when `GROQ_API_KEY` is absent.

## Verification

```powershell
cd backend; npm test
cd ..\frontend; npm run lint; npm test; npm run build
cd ..\AttendenceApp; npm run lint; npm test -- --runInBand
cd android; .\gradlew.bat assembleDebug --no-daemon
```

The GitHub Actions workflow repeats these checks and applies the full migration chain to a clean PostgreSQL service.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [API contract](docs/API.md)
- [Deployment runbook](docs/DEPLOYMENT.md)
- [Security model](docs/SECURITY.md)
- [Planner research evaluation](docs/PLANNER_EVALUATION.md)

Never commit `.env` files, service-account JSON, database passwords, Groq keys, VAPID private material, or signing keys. Rotate any secret that has appeared in chat, screenshots, logs, or source history.
