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
| `/auth` | Request/verify email sign-in codes, sync identity, read/update current profile |
| `/projects` | Filter/list, create, detail, update, soft-delete, activity timeline |
| `/projects/:id/plans` | Generate/list plan versions, approve/reject, evaluate outcomes |
| `/tasks` | Filter/list/stats, create, detail, update, status transition, soft-delete |
| `/tasks/:id` | Time logs, comments/mentions, attachments, watchers, activity timeline |
| `/attendance` | Issue challenge, list offices/scans, daily summary register, submit verified scan, corrections/review |
| `/meetings` | Schedule, update, cancel, respond, and the attendance-overlaid calendar |
| `/users` | Directory, detail, create, profile/status/permission administration |
| `/roles` | Workspace role catalogue: list, create, update, delete custom roles |
| `/workspace` | Workspace settings and office geofence administration |
| `/notifications` | Inbox, read state, register/unregister push subscriptions |
| `/customization` | Versioned module and field definitions |
| `/modules` | Typed runtime custom records |
| `/reports/overview` | Delivery, attendance, capacity, risk, and planner research metrics |
| `/audit` | Organization-scoped administrative audit log |

## Authentication Contract

Sign-in is passwordless. `POST /auth/otp/request` takes an email and always answers `202` for a well-formed address, whether or not an account exists, so the endpoint cannot be used to enumerate members. `POST /auth/otp/verify` takes the email and the 6-digit code and returns a short-lived Firebase **custom token**; the client exchanges it via `signInWithCustomToken` and continues to send a normal Firebase ID token on every request.

Codes are persisted only as an HMAC-SHA256 digest keyed by `OTP_SECRET`, never in plaintext, so a leaked store yields no usable credential. Storage is Upstash Redis when `REDIS_URL` and `REDIS_REST_TOKEN` are set (HTTP-based, so it works on serverless, with native TTL expiry and atomic `SET NX` throttling and `GETDEL` single-use claiming); otherwise it falls back to the `login_otps` table. Each code is single-use (claimed atomically), expires after `OTP_TTL_MINUTES`, allows `OTP_MAX_ATTEMPTS` guesses before being burned, and is throttled per email by `OTP_COOLDOWN_SECONDS` and `OTP_MAX_PER_HOUR`. Every failed verification returns one identical message regardless of cause.

Sessions last `SESSION_MAX_DAYS` (default 3). Because Firebase ID tokens expire hourly and refresh silently, the limit is enforced against the token's `auth_time` — the original sign-in, which refreshing does not advance — so a client cannot extend a session by refreshing. Past the limit the API returns `401` and the client must sign in with a new code.

Sign-in method is enforced server-side on every authenticated request: `custom` (email code) is the normal path, `password` is accepted **only** for a super admin as break-glass access when email delivery is unavailable, and every other provider is rejected. Existing password or Google sessions therefore stop working for regular members as soon as this is deployed.

## Meetings Contract

Any member may organize a meeting and answer their own invitations. Editing or cancelling **someone else's** meeting requires `meetings.manage`, held by default by super admin, admin, manager, and HR. Members without it see only meetings they organize or are invited to; holders see the whole workspace calendar.

`POST /meetings` returns `{ meeting, conflicts }`. Conflicts list attendees who already have a `SCHEDULED` meeting overlapping the slot, using a half-open comparison (`endsAt > start AND startsAt < end`) so back-to-back meetings do not collide. **A conflict is reported, never blocking** — double-booking is sometimes deliberate and only the organizer knows.

Rescheduling resets every other attendee's response to `INVITED`, since an answer to the old time says nothing about the new one. The organizer is always an attendee and is auto-accepted.

`GET /meetings/calendar` returns the day grid: meetings plus `isWorkingDay`, `isHoliday`, and `presentCount` drawn from accepted attendance scans, all resolved in the workspace timezone through the same helpers the attendance register uses. Members without `attendance.view_all` see only their own presence reflected there.

## Roles Contract

Roles are workspace data, not a fixed list. Each organization is seeded with six built-in roles (`super_admin`, `admin`, `manager`, `hr`, `accounts`, `employee`) which cannot be renamed or deleted, and `permissions.manage` holders may add their own alongside them via `/roles`.

Every role carries a `rank` where lower is more senior, and all guards compare ranks rather than role names so custom roles slot into the same hierarchy:

- A new role is created one step below its author, so it can never reach sideways or upward.
- A role may only be created, edited, deleted, or assigned by someone strictly more senior than it. Equal rank is not sufficient.
- **A role can never carry a permission its author does not already hold.** This is what stops role creation from becoming a privilege-escalation path.
- A role still assigned to members cannot be deleted; move them first.

`GET /users` and `/auth/me` return `role` (the key), `roleName`, and `roleRank`. Permission resolution order is: per-account override, then the assigned role record, then the legacy `users.role` enum. Members on a custom role carry `EMPLOYEE` in that enum, so any path still reading it fails closed rather than inheriting broader access. Recipient lookups for notifications resolve by permission, so custom roles receive the same alerts as the built-ins.

## Attendance Contract

Attendance is recorded **only** by a verified device scan: the client requests a one-use challenge from `POST /attendance/challenge`, then submits `POST /attendance/scans` with that token plus device coordinates and accuracy. The API rejects a scan for any user other than the caller, so there is no manual attendance entry path. Adjustments go through `/attendance/corrections`, which is reviewed by an attendance manager and writes an audited scan on approval.

`GET /attendance/summary` returns the computed daily register rather than raw scans. It applies the workspace attendance rules (`workdayStart`, `checkInGraceMinutes`, `checkoutWindowStart`/`checkoutWindowEnd`, `minimumOfficeMinutes`, working days, and holidays, all in the workspace timezone) and supports `from`, `to`, `userId`, `department`, `search`, `status`, `page`, and `pageSize`. A range is capped at 92 days per view. Members without `attendance.view_all` are scoped to their own records regardless of the requested `userId`.

Attendance rules live on the workspace, not the attendance screen: read them from `GET /workspace/settings` and change them with `PATCH /workspace/settings` (`settings.manage` required).

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
