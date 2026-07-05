const prisma = require("../db/prisma");
const ApiError = require("../utils/apiError");
const { env } = require("../config/env");
const { normalizeRole, toClientRole, USER_ROLES } = require("../utils/roles");

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const serializeUser = (user) => ({
  contact: user.contact || "",
  email: user.email,
  id: user.id,
  name: user.fullName,
  role: toClientRole(user.role),
  uid: user.firebaseUid,
});

const resolveNewUserRole = async ({ email, requestedRole }) => {
  const userCount = await prisma.user.count();
  const normalizedEmail = normalizeEmail(email);

  if (userCount === 0 || env.bootstrapAdminEmails.includes(normalizedEmail)) {
    return USER_ROLES.ADMIN;
  }

  if (env.allowClientRoleSelection) {
    return normalizeRole(requestedRole);
  }

  return USER_ROLES.EMPLOYEE;
};

const syncUserProfile = async (firebaseUser, payload = {}) => {
  const firebaseUid = firebaseUser.uid;
  const email = normalizeEmail(firebaseUser.email);

  if (!email) {
    throw new ApiError(400, "Firebase account must have an email address.");
  }

  const existingUser = await prisma.user.findUnique({
    where: { firebaseUid },
  });

  if (existingUser) {
    const updatedUser = await prisma.user.update({
      data: {
        contact: payload.contact ?? existingUser.contact,
        email,
        fullName: payload.fullName || existingUser.fullName,
      },
      where: { firebaseUid },
    });

    return serializeUser(updatedUser);
  }

  const role = await resolveNewUserRole({
    email,
    requestedRole: payload.role,
  });

  const createdUser = await prisma.user.create({
    data: {
      contact: payload.contact || "",
      email,
      firebaseUid,
      fullName: payload.fullName || firebaseUser.name || email,
      role,
    },
  });

  return serializeUser(createdUser);
};

const getCurrentUser = (user) => serializeUser(user);

const listEmployees = async () => {
  const employees = await prisma.user.findMany({
    orderBy: { fullName: "asc" },
    where: { role: USER_ROLES.EMPLOYEE },
  });

  return employees.map(serializeUser);
};

const listUsers = async () => {
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { fullName: "asc" }],
  });

  return users.map(serializeUser);
};

const updateUserRole = async (userId, role) => {
  const updatedUser = await prisma.user.update({
    data: { role: normalizeRole(role) },
    where: { id: userId },
  });

  return serializeUser(updatedUser);
};

module.exports = {
  getCurrentUser,
  listEmployees,
  listUsers,
  serializeUser,
  syncUserProfile,
  updateUserRole,
};
