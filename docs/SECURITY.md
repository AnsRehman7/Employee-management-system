# Security Model

## Trust Model

Browser and mobile clients are untrusted. Firebase authenticates a person, but StaffFlow authorization, tenancy, workflow transitions, attendance acceptance, and AI approval happen in the API. PostgreSQL, Firebase Admin, Groq, cron, signing, and push credentials are server/CI secrets.

Primary threats are cross-tenant access, broken role checks, stolen tokens, leaked service credentials, task/plan tampering, attendance replay or location spoofing, prompt injection, abusive traffic, and notification data exposure.

## Implemented Controls

- Tenant-scoped Prisma queries and permission middleware for protected operations.
- Production fail-fast when Firebase Admin or required runtime configuration is missing.
- Optional Firebase App Check enforcement in addition to Firebase ID-token verification.
- Twelve-character application password policy; administrator-created users can receive setup/reset links instead of shared passwords.
- Exact production CORS allowlists, Helmet API headers, Netlify CSP/HSTS/COOP/CORP/Permissions Policy, 1 MB JSON limits, and rate limits.
- Zod validation for API payloads and AI-generated structured plans.
- Optimistic versions, soft deletion, immutable plan snapshots, audit logs, and before/after activity records.
- Short-lived, one-use attendance challenges; server time, database office coordinates, accuracy bounds, geofencing, scan sequencing, and retry-safe replay behavior.
- Passwordless sign-in codes stored only as an `OTP_SECRET`-keyed HMAC, single-use and atomically claimed, expiring in minutes, attempt-capped, and throttled per email. Verification failures are indistinguishable from one another and code requests never reveal whether an account exists.
- Custom roles cannot escalate: a role is created strictly below its author, may only be managed by someone more senior, and can never carry a permission its author does not hold. Permission resolution falls back to a fail-closed `EMPLOYEE` enum rather than to a broader role.
- Sessions capped at `SESSION_MAX_DAYS` and enforced from the token's `auth_time`, so silent refreshes cannot extend a session. Sign-in provider is re-checked on every authenticated request; password sign-in survives only for the super admin as break-glass access.
- Mobile tokens stored in the operating-system credential vault rather than AsyncStorage.
- AI input is treated as data in a constrained prompt, output is schema-validated, and no AI plan can materialize tasks without authorized human approval.
- Durable outbox processing prevents a database commit from depending on a successful push request.
- User-safe 5xx responses and request IDs prevent stack traces from reaching clients while retaining support traceability.

## Credential Handling

- Never commit `.env`, `google-services.json`, service-account JSON, private keys, database URLs, VAPID private material, or keystores.
- Prefer a base64 service-account value in Vercel only when workload identity is unavailable.
- Give runtime database credentials only the privileges required by the application. Keep migration credentials separate when possible.
- Rotate immediately after accidental disclosure; deleting a local file does not revoke a key.
- Restrict Firebase Web API keys by API and allowed web/app origins. They are public identifiers, but restriction still limits abuse.

## Residual Risks Before Real Customers

- In-process rate limiting is not globally consistent across serverless instances. Add edge/WAF or Redis-backed enforcement.
- GPS plus local biometrics does not prove an uncompromised device. Rooted devices and mocked locations need device attestation (Play Integrity/App Attest) for high-assurance attendance.
- Attachment records contain external link metadata only. Add managed object storage, signed URLs, MIME/size validation, and malware scanning before uploads.
- Native mobile push needs Firebase platform files and token registration; web FCM is implemented.
- Add centralized error monitoring, security alerting, database PITR verification, and an incident-response runbook.
- Add retention/deletion policies and consent notices for location, attendance, audit, and notification data before organizational deployment.
- Dependency audits include transitive advisories with no non-breaking upstream remediation. Review them each release and upgrade framework majors in a dedicated compatibility branch.

## Verification Checklist

- Attempt cross-organization IDs for every detail/mutation endpoint and expect `404` or `403`.
- Test suspended users and removed permissions with an existing Firebase token.
- Submit stale versions, dependency cycles, repeated plan approvals, and repeated attendance challenges.
- Create a custom role granting permissions the author lacks, assign a role at or above your own rank, edit a built-in role, and escalate by deleting a role still in use.
- Replay a consumed sign-in code, brute-force codes past the attempt cap, request codes for unknown emails to compare responses, and continue using a session past its maximum age.
- Verify unauthorized origins, oversized JSON, missing/invalid tokens, and invalid App Check tokens are denied.
- Confirm logs contain request IDs but no authorization headers, tokens, passwords, coordinates beyond operational need, or AI/API secrets.
- Run secret scanning and dependency audit in CI, plus periodic SAST/DAST against staging.

This document describes controls in the repository; it is not a compliance certification or penetration-test result.
