# Architecture

## System Boundaries

DayMark has three clients but one source of business truth. Firebase proves identity; the Express API resolves that identity to a PostgreSQL user and organization, enforces permissions, and owns every workflow transition. The browser and mobile app never receive database credentials or Firebase Admin material.

```text
React web ---- Firebase Auth ---- Google/Firebase
    |                 |
    +--- ID token ----+
    |
React Native --- ID token ---> Express API ---> Prisma ---> PostgreSQL
                                    |
                                    +-- Groq (optional planning enrichment)
                                    +-- Firebase Cloud Messaging
```

Every tenant-owned query is scoped by `organizationId`. Role defaults are convenience presets; API permissions are authoritative and can be overridden per user. A hidden control in the UI is never treated as authorization.

## Main Domains

- **Identity and access:** Firebase identities, workspace profiles, roles, permission overrides, suspension, and audit history.
- **Delivery:** projects, requirements, tasks, task dependencies, milestones, time logs, collaboration, version checks, and soft deletion.
- **Planning:** immutable plan versions, requirement traceability, constraint scheduling, explainable recommendations, approval, materialization, and evaluation.
- **Attendance:** offices, short-lived challenges, scans, geofence/accuracy verification, sequence rules, and correction requests.
- **Customization:** versioned module schemas, typed fields, runtime record validation, and custom records.
- **Messaging:** notifications, push subscriptions, transactional outbox events, retry attempts, and audit entries.

## Explainable Planning Flow

1. A manager records structured project requirements and a deadline.
2. Groq returns a structured blueprint. If it is unavailable or invalid, a deterministic generator preserves traceability.
3. Zod validates and normalizes task keys, requirement references, dependencies, estimates, confidence, skills, risks, milestones, and acceptance criteria.
4. The scheduler topologically orders tasks and detects cycles or conflicting dependencies.
5. It computes business-day slots from workspace working days and holidays.
6. Existing open work and each employee's weekly capacity constrain start dates.
7. Skill overlap and remaining capacity produce an assignee recommendation and a plain-language reason.
8. The engine reports uncovered requirements, low confidence, overload, impossible deadlines, cycles, and missing input.
9. A manager reviews assignments and explicitly approves, overrides, or rejects the draft.
10. Approval transactionally creates tasks, dependencies, audit records, notifications, and an outbox event.

AI output is advisory. It cannot create delivery work without a user who has `projects.edit` permission approving the plan.

## Reliability Model

- Mutations that affect business data, audit history, and outbox messages use Prisma transactions.
- Task and project versions provide optimistic concurrency checks for edits.
- Deletes are soft where history must remain referentially valid.
- Attendance challenge consumption is idempotent for a matching retry, preventing a network timeout from losing a successful scan.
- Notification delivery is attempted immediately; failed outbox events remain durable for the protected recovery worker.
- `GET /health` proves the process is alive. `GET /ready` additionally checks Firebase mode and required database tables/migrations.
- API errors include a stable HTTP status, user-safe message, validation details when applicable, and `X-Request-Id` for log correlation.

## Data and Schema Evolution

Prisma migrations are append-only deployment artifacts. Schema customization creates application-level schema versions; it does not execute tenant-authored SQL or alter physical tables. Custom values remain JSON-backed and are validated against the active version, avoiding unsafe runtime DDL and cross-tenant schema drift.

Deployment order is database migration, backend, then clients. Older clients remain supported through `/api`; versioned integrations may use `/api/v1`.

## Current Scale Boundaries

- The API rate limiter is process-local. Add Vercel WAF or a Redis-backed limiter before sustained multi-instance traffic.
- Attachment support stores validated link metadata; production binary uploads need object storage, malware scanning, content limits, and signed URLs.
- The web client supports FCM push. Native mobile push still requires Firebase Android/iOS application files and platform registration.
- Reporting is calculated on demand. At larger data volumes, move aggregates to scheduled materialized summaries.
