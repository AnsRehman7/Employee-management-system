export const USER_ROLE_OPTIONS = [
  { label: "Employee", value: "employee" },
  { label: "Manager", value: "manager" },
  { label: "HR", value: "hr" },
  { label: "Accounts", value: "accounts" },
  { label: "Admin", value: "admin" },
  { label: "Super Admin", value: "super_admin" },
];

export const USER_STATUS_STYLES = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-800",
  suspended: "border-slate-200 bg-slate-100 text-slate-700",
};

export const getAssignableRoleOptions = (actorRole) => {
  if (actorRole === "hr") return USER_ROLE_OPTIONS.filter((option) => option.value === "employee");
  if (actorRole === "admin") return USER_ROLE_OPTIONS.filter((option) => option.value !== "super_admin");
  return USER_ROLE_OPTIONS;
};

export const canEditWorkspaceUser = (actor, target) => {
  if (!actor || !target) return false;
  if (actor.role === "super_admin") return true;
  if (actor.role === "admin") return target.role !== "super_admin";
  return actor.role === "hr" && target.role === "employee";
};
