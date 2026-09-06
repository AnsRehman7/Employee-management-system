---
name: assistant
description: How the DayMark workspace assistant (AI chatbot) works — the interpret/execute split, signed plans, entity resolution, and the action allowlist. Load before adding a new assistant action type, changing the prompt, debugging a wrong or refused assistant response, or changing which model is used. Triggers on assistant, chatbot, chat, LLM, Groq, prompt, action plan, natural language, intent, tool calling.
---

# Workspace assistant

Natural-language commands that create projects and tasks and assign work. The model
proposes; the person confirms; the ordinary services execute.

```
frontend/src/components/ChatAssistant.jsx   panel, preview, Apply / Discard
backend/src/routes/assistant.routes.js      POST /interpret · POST /execute
backend/src/services/assistant.service.js   prompt, coercion, plan signing  (no DB)
backend/src/services/assistantResolver.service.js   name -> row matching   (pure)
backend/src/services/assistantRunner.service.js     resolve, gate, execute
```

## The rules that make it safe

**Never let the model write.** `/interpret` only ever returns a preview. `/execute` runs a
plan the user pressed Apply on. Do not add an endpoint that does both.

**The model never produces an id.** It returns names; `assistantResolver.service.js` maps
them onto real rows. Given the chance the model invents plausible ids that point at real
records belonging to someone else.

**Ambiguity is a question, not a guess.** Two people called Ahmed produce `status:
"ambiguous"` and the user picks. Never silently take the first match — that assigns real
work to the wrong person.

**The action allowlist is the security boundary, not the prompt.** `ACTION_TYPES` holds
three entries. `normalizePlan` discards anything else, so a jailbreak that convinces the
model to emit `delete_everything` still produces zero actions. Prompt instructions are
advisory; the allowlist is enforcement. Tested in `backend/test/assistant.test.js`.

**Permissions come from the service layer.** Each action is checked with `hasPermission`
during resolution, and the real service re-checks on execution. An employee cannot create
a project through the assistant regardless of what the model returns.

**Plans are HMAC-signed, not stored.** The signature covers the actions, the user id, the
org id, and an expiry, so `/execute` cannot be handed a hand-written action list, and a
leaked token is useless to another user. Signing rather than caching keeps this working on
Vercel where there is no shared memory. Key derives from `OTP_SECRET`, with the same
development fallback `otp.service.js` uses.

## Adding an action type

1. Add it to `ACTION_TYPES` and give it a permission in `PERMISSION_FOR_ACTION`.
2. Add a coercion branch in `normalizePlan` — cap every string, validate every date.
3. Add resolution in `resolvePlan` if it references a person, project, or task.
4. Add a branch in `execute` that calls the **existing** service. Never write Prisma
   queries here; the whole design depends on reusing services that already scope by tenant.
5. Add a line to `describeAction` so the preview reads as a sentence.
6. Add the action shape to the prompt in `buildPrompt`.
7. Test coercion and rejection in `backend/test/assistant.test.js`.

## Execution is sequential, not atomic

Actions run in order and stop at the first failure, reporting what was applied. They are
not in one transaction because the project and task services own their own. Reusing them
is worth more than batch atomicity — but a partial batch is possible, so the result list
must always be shown to the user.

## Providers

All AI JSON generation goes through `llm.service.js`, which tries **Gemini first and Groq
as a fallback**. Both providers expose the same `generateJson` signature and the same
ApiError status codes, so no caller knows which one answered. Only a 5xx-class failure
falls through to the next provider — a 4xx means the request itself was refused, and
retrying it elsewhere would fail the same way more slowly.

`GEMINI_MODEL` defaults to `gemini-flash-lite-latest`. **Do not use `gemini-flash-latest`**
— it measured 33 seconds on this account, which exceeds the serverless function limit.
`gemini-2.5-flash` and `gemini-2.5-pro` return 404 for newer keys.

`GROQ_MODEL` defaults to `openai/gpt-oss-120b` (open weight, Apache-2.0, free tier).
`llama-3.3-70b-versatile` was retired and now 404s.

If the assistant or the planner starts failing, check what each key can actually serve:

```bash
curl -s https://api.groq.com/openai/v1/models -H "Authorization: Bearer $GROQ_API_KEY"
curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY"
```

Relative dates are the weakest part of any of these models. The preview step is what makes
that acceptable — the user sees the resolved date before anything is written.
