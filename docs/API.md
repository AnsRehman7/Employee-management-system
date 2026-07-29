# API Contract

The production base path is `/api`; `/api/v1` is an equivalent versioned alias. JSON request bodies are limited to 1 MB.

## Authentication

Protected routes require a current Firebase ID token:

```http
Authorization: Bearer <firebase-id-token>
```

`POST /auth/sync` exchanges a verified Firebase identity plus onboarding/profile data for the workspace profile. The API derives organization and permission context server-side. Clients must refresh the Firebase token after claims or account state change.

## Response Shape

Successful endpoints return a `data` property. Lists may additionally include pagination metadata. Errors are safe to display and carry a correlation ID:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": { "field": ["Reason"] },
    "requestId": "..."
  }
}
```

The same identifier is returned as `X-Request-Id`. Include it in support reports, but do not expose server logs or secrets to users.

## Resource Groups

| Prefix | Important operations |
| --- | --- |
| `/auth` | Sync identity, read/update current profile |
| `/projects` | Filter/list, create, detail, update, soft-delete, activity timeline |
| `/projects/:id/plans` | Generate/list plan versions, approve/reject, evaluate outcomes |
| `/tasks` | Filter/list/stats, create, detail, update, status transition, soft-delete |
| `/tasks/:id` | Time logs, comments/mentions, attachments, watchers, activity timeline |
| `/attendance` | Issue challenge, list offices/scans, submit scan, corrections/review |
| `/users` | Directory, detail, create, profile/status/permission administration |
| `/workspace` | Workspace settings and office geofence administration |
| `/notifications` | Inbox, read state, register/unregister push subscriptions |
| `/customization` | Versioned module and field definitions |
| `/modules` | Typed runtime custom records |
| `/reports/overview` | Delivery, attendance, capacity, risk, and planner research metrics |
| `/audit` | Organization-scoped administrative audit log |

## Planner Approval Contract

`POST /projects/:projectId/plans/generate` creates a draft only. It accepts structured requirements and an optional manual planning-time baseline. The response contains warnings, traceability, recommendations, capacity metrics, schedule dates, risks, and confidence.

`POST /projects/:projectId/plans/:planId/approve` is the human decision point. `useRecommendations` controls whether untouched suggestions are accepted; `assignmentOverrides` maps planned-task keys to selected user IDs or `null`. Approval materializes tasks once and rejects a repeated approval with `409 Conflict`.

`POST /projects/:projectId/plans/:planId/evaluate` records observed metrics after approval. It does not rewrite the historical plan snapshot.

## Concurrency and Retry

- Project/task updates carry the version read by the client. A stale write returns `409`; reload before applying the edit again.
- Reusing a consumed attendance challenge returns the already-created matching scan when the previous response was lost, making a slow-network retry safe.
- Reads may be retried with backoff. Do not blindly retry non-idempotent writes unless the endpoint explicitly documents idempotency.
- Use `page`, `pageSize`, filters, and sort parameters on list endpoints; clients should not assume an unbounded result set.

## Operational Endpoints

- `GET /health`: process liveness and Firebase authentication mode.
- `GET /ready`: Firebase and migrated PostgreSQL readiness; returns `503` when degraded.
- `GET|POST /internal/outbox/process`: protected by `Authorization: Bearer <CRON_SECRET>` and intended only for the deployment scheduler.
