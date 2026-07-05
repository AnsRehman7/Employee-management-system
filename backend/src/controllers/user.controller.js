const userService = require("../services/user.service");
const asyncHandler = require("../utils/asyncHandler");
const { parseBody, updateUserRoleSchema } = require("../utils/validators");

const listEmployees = asyncHandler(async (_req, res) => {
  const employees = await userService.listEmployees();
  res.status(200).json({ data: { employees } });
});

const listUsers = asyncHandler(async (_req, res) => {
  const users = await userService.listUsers();
  res.status(200).json({ data: { users } });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const payload = parseBody(updateUserRoleSchema, req.body);
  const user = await userService.updateUserRole(req.params.userId, payload.role);

  res.status(200).json({ data: { user } });
});

module.exports = {
  listEmployees,
  listUsers,
  updateUserRole,
};
