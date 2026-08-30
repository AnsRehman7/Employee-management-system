---
name: deploy-preflight
description: Environment variables and platform constraints for deploying DayMark — backend to Vercel serverless, frontend to Netlify, Neon Postgres, Upstash Redis. Load before deploying, when adding or renaming an env var, when adding config a service needs at startup, when a deploy crashes with FUNCTION_INVOCATION_FAILED, or when something works locally but not in production. Triggers on deploy, Vercel, Netlify, env var, environment, production, serverless, CSP, cold start, 500 error.
---

# Deploy preflight

| Piece    | Platform            | Notes                                          |
| -------- | ------------------- | ---------------------------------------------- |
| backend  | Vercel serverless   | no shared memory, cold starts, no background work |
| frontend | Netlify             | `base = frontend`, SPA redirect, strict CSP    |
| database | Neon Postgres       | pooled connections                             |
| cache    | Upstash Redis       | REST/HTTP, safe from serverless                |

## Serverless constraints that change how you write code

**No shared memory between invocations.** Each request may hit a fresh process. In-memory state —
caches, counters, OTPs, sessions — does not survive. Anything durable goes in Redis or Postgres.
`src/middlewares/rateLimit.middleware.js` uses an in-process `Map`, so it is **per-lambda and
approximate by design**. Don't extend that pattern; don't assume it's a real global limit.

**Never throw at module load over missing config.** A boot-time hard fail takes down every route and
surfaces as an opaque `FUNCTION_INVOCATION_FAILED` with nothing useful in the log. This has already
caused one production outage here.

> Collect config problems into warnings, let the app boot, and **fail closed at request time** in the
> one handler that needs the value. A missing SMTP password should break sending mail — not the health
> check, not login, not everything.

**No background work after the response.** The lambda freezes. Finish the work or queue it
(`OutboxEvent`), don't fire and forget.

## Env vars

**Backend (Vercel).** Required: `DATABASE_URL`, Firebase admin credentials (`FIREBASE_PROJECT_ID` +
`FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`, or `FIREBASE_SERVICE_ACCOUNT_BASE64`), `OTP_SECRET`,
`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`, SMTP (`SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/
`SMTP_PASS`), `CORS_ORIGIN`, `GROQ_API_KEY` for AI planning.

`FIREBASE_PRIVATE_KEY` contains literal `\n` sequences that must become real newlines — this is the
most common cause of a working-locally, failing-in-prod auth error.

**Frontend (Netlify).** `VITE_API_URL` plus the `VITE_FIREBASE_*` set. These are **inlined at build
time**, so changing one in the Netlify UI does nothing until you redeploy. They are also public by
definition — never put a secret behind a `VITE_` prefix.

## Netlify CSP

`netlify.toml` sets a strict `Content-Security-Policy` with `script-src 'self'`. A new external domain
— API host, font host, analytics, image CDN — must be added to the right directive or the browser
blocks it with a console error and no network request. Changing the backend URL means updating
`connect-src`.

## Checklist

```bash
cd backend  && npm test
cd frontend && npm run lint && npm test && npm run build
```

Then: new env vars set in **both** the platform UI and `.env.example`; the frontend redeployed if any
`VITE_` value changed; `prisma migrate deploy` run for schema changes (`prisma generate` is already
wired into `postinstall`); and after deploying, actually exercise **login** — it depends on Firebase,
Redis, SMTP, and Postgres at once, so it is the fastest end-to-end smoke test available.
