const express = require("express");
const userController = require("../controllers/user.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireRoles } = require("../middlewares/role.middleware");
const { USER_ROLES } = require("../utils/roles");

const router = express.Router();

router.use(authenticate);

router.get("/employees", requireRoles(USER_ROLES.ADMIN, USER_ROLES.HR), userController.listEmployees);
router.get("/", requireRoles(USER_ROLES.ADMIN), userController.listUsers);
router.patch("/:userId/role", requireRoles(USER_ROLES.ADMIN), userController.updateUserRole);

module.exports = router;
