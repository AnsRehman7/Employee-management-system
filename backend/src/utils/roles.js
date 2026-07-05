const USER_ROLES = {
  ADMIN: "ADMIN",
  EMPLOYEE: "EMPLOYEE",
  HR: "HR",
};

const PRIVILEGED_ROLES = [USER_ROLES.ADMIN, USER_ROLES.HR];

const normalizeRole = (role) => {
  const value = String(role || "").trim().toUpperCase();
  return Object.values(USER_ROLES).includes(value) ? value : USER_ROLES.EMPLOYEE;
};

const toClientRole = (role) => String(role || USER_ROLES.EMPLOYEE).toLowerCase();

const isPrivileged = (user) => PRIVILEGED_ROLES.includes(user?.role);

module.exports = {
  isPrivileged,
  normalizeRole,
  PRIVILEGED_ROLES,
  toClientRole,
  USER_ROLES,
};
