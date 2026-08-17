export const USER_STATUS_STYLES = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-800",
  suspended: "border-slate-200 bg-slate-100 text-slate-700",
};

/**
 * Roles are workspace data, so assignable options come from `useRoles()` and the
 * server is the authority. These helpers only cover presentation and the optimistic
 * UI check; the API re-validates every assignment.
 */
export const canEditWorkspaceUser = (actor, target) => {
  if (!actor || !target) return false;
  if (actor.role === "super_admin") return true;
  if (target.role === "super_admin") return false;
  if (actor.role === "hr") return target.role === "employee";

  const actorRank = Number.isFinite(actor.roleRank) ? actor.roleRank : Number.POSITIVE_INFINITY;
  const targetRank = Number.isFinite(target.roleRank) ? target.roleRank : Number.POSITIVE_INFINITY;
  return actorRank < targetRank;
};
