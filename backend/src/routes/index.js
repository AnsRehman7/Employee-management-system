const express = require("express");
const authRoutes = require("./auth.routes");
const projectRoutes = require("./project.routes");
const taskRoutes = require("./task.routes");
const userRoutes = require("./user.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/projects", projectRoutes);
router.use("/tasks", taskRoutes);
router.use("/users", userRoutes);

module.exports = router;
