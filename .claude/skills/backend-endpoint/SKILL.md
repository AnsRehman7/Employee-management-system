---
name: backend-endpoint
description: How to add or change an API endpoint in the DayMark Express/Prisma backend — routes, controllers, services, zod validators, permissions, and multi-tenant scoping. Load when adding a route, endpoint, or API, when wiring a new service or controller, when adding a permission, or when changing what data an endpoint returns. Triggers on endpoint, route, controller, service, API, permission, zod, validator, Prisma query.
---

# Adding a backend endpoint

Four layers, each with one job. Skipping a layer is what causes the bugs.

```
routes/       authenticate + requirePermission        no logic
controllers/  parseBody, call service, res { data }   no logic
services/     business logic, tenant scoping, ApiError   never sees req/res
utils/validators.js   zod schema
```

## The order to work in

**1. Permission.** If the action needs a new one, add it to `PERMISSIONS` in `src/utils/permissions.js`
*and* to `PERMISSION_CATALOG` with a `group`, `label`, and `description` — the catalog is what renders
the roles UI, so a key without a catalog entry is invisible and ungrantable.

**2. Validator** in `src/utils/validators.js`:

```js
const createThingSchema = z.object({ name: z.string().trim().min(1) });
```

Cross-field rules go in `.superRefine` with an explicit `path`, so the frontend can show it as a
field error rather than a toast.

**3. Service** in `src/services/<area>.service.js`. This is where everything real happens:

```js
const createThing = async (currentUser, payload) => {
  const project = await prisma.project.findFirst({
    where: { id: payload.projectId, organizationId: currentUser.organizationId },
  });
  if (!project) throw new ApiError(404, "Project not found.");
  // ...
};
```

**4. Controller** — thin, always `asyncHandler`:

```js
const createThing = asyncHandler(async (req, res) => {
  const payload = parseBody(createThingSchema, req.body);
  const thing = await thingService.createThing(req.user, payload);
  res.status(201).json({ data: { thing } });
});
```

**5. Route** — mount under `router.use(authenticate)`:

```js
router.post("/", requirePermission(PERMISSIONS.THINGS_CREATE), thingController.createThing);
```

Register the router in `src/routes/index.js`.

**6. Test** in `backend/test/`. Backend tests run with **no database**, so test schemas, permission
resolution, and pure logic. Don't try to test the query.

## Non-negotiables

**Every Prisma call is scoped by `organizationId`.** Use `findFirst({ where: { id, organizationId } })`,
never `findUnique({ where: { id } })` on tenant data. A `findUnique` by id alone returns another
company's row and looks completely correct in single-workspace testing. This is the single easiest
way to ship a data leak here.

**Route permission does not replace service ownership checks.** `requirePermission` proves the caller
*may* do this kind of thing; the service must still prove this *specific record* is theirs.

**Errors are `throw new ApiError(status, message)`.** The message reaches the user, so write it for
them. `error.middleware.js` shapes the response as `{ error: { message, details, requestId } }`, which
`frontend/src/context/api.js` already unwraps.

**404 over 403 for records outside the tenant.** Telling someone a record exists but isn't theirs
leaks its existence. Return "not found".

**Never widen a role's default permissions to make something work.** Grant it explicitly. Role
defaults are a security boundary and `role.service.js` has an escalation guard that assumes they hold.

**Keep object keys alphabetized.** The codebase does this everywhere, including `data:` and `where:`.

## Frontend side

Add the call to `frontend/src/context/api.js` — never `fetch` from a component. `api.js` attaches the
Firebase token, unwraps `{ data }`, applies a 30s timeout, and normalizes errors. New pages need the
permission gate too, or the UI will offer an action the API then rejects.
