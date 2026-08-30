---
name: destructive-data-ops
description: Required procedure before writing code that deletes, purges, suspends, or bulk-updates data in DayMark, given 30 Prisma models with mixed Cascade/Restrict/SetNull relations. Load when implementing delete, remove, purge, suspend, deactivate, reset, or bulk update, or when a delete fails on a foreign key constraint. Triggers on delete, cascade, purge, remove account, suspend, foreign key, onDelete, data loss.
---

# Destructive data operations

The schema has 30 models with **42 Cascade, 23 SetNull, and 6 Restrict** relations. A delete that
looks like one row can silently remove a subtree, or fail at runtime on a constraint that only
triggers with real data. Never write one from memory.

## Audit first — always

```bash
grep -n "model <Name>\|onDelete" backend/prisma/schema.prisma
```

For the target model, list every relation pointing **at** it and classify:

- **Cascade** → those rows die with it. Confirm that's intended; this is where surprise data loss lives.
- **Restrict** → the delete *fails* until these are cleared or reassigned first.
- **SetNull** → survives, but the reference is nulled. Check nothing reads it assuming non-null.

Only then write the code.

## Established patterns

**Deepest-first, single transaction.** `workspace.service.js#deleteWorkspace` deletes 24 models in
dependency order inside one `prisma.$transaction`. A partial delete is worse than none — it leaves a
workspace nobody can log into whose data still exists. Watch ordering subtleties: plans reference
tasks, so plans go first.

**Reassign before deleting where Restrict applies.** `user.service.js#purgeOrganizationUser` moves
`task.createdById`, `project.createdById`, `projectRequirement.createdById`, `projectPlan.createdById`,
and `meeting.organizerId` to the acting admin *before* removing the user, because those block the delete.

**External systems come after the DB commits.** Firebase logins are deleted only once the transaction
succeeds. Doing it first strips logins from a workspace that still exists if the transaction then rolls
back — and Firebase has no transaction to roll back with.

**Suspension releases the identity.** Suspending rewrites `email` to `released+<id>@removed.invalid`
and `firebaseUid` to `released:<id>`, so the person can sign up their own workspace with that address.
Anything iterating users must tolerate those sentinel values — check `firebaseUid.startsWith("released:")`
before calling Firebase with it.

## Guards to include

- **Confirmation for anything irreversible.** Workspace deletion requires typing the exact workspace
  name. Match that bar for comparable operations.
- **Permission check at the route *and* a role check in the service.** Workspace deletion re-verifies
  `roleKeyOf(currentUser) === "super_admin"` inside the service.
- **Scope by `organizationId`** in the delete's `where`, exactly as in reads.
- **Write the test.** `backend/test/workspace-deletion.test.js` is the model. Order-of-deletion bugs
  do not surface until real data exists.
