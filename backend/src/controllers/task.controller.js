const taskService = require("../services/task.service");
const asyncHandler = require("../utils/asyncHandler");
const { createTaskSchema, parseBody, updateTaskStatusSchema } = require("../utils/validators");

const listTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.listTasks(req.user);
  res.status(200).json({ data: { tasks } });
});

const getTaskStats = asyncHandler(async (req, res) => {
  const stats = await taskService.getTaskStats(req.user);
  res.status(200).json({ data: { stats } });
});

const createTask = asyncHandler(async (req, res) => {
  const payload = parseBody(createTaskSchema, req.body);
  const task = await taskService.createTask(req.user, payload);

  res.status(201).json({ data: { task } });
});

const updateTaskStatus = asyncHandler(async (req, res) => {
  const payload = parseBody(updateTaskStatusSchema, req.body);
  const task = await taskService.updateTaskStatus(req.params.taskId, payload.status, req.user);

  res.status(200).json({ data: { task } });
});

const deleteTask = asyncHandler(async (req, res) => {
  await taskService.deleteTask(req.params.taskId, req.user);
  res.status(204).send();
});

module.exports = {
  createTask,
  deleteTask,
  getTaskStats,
  listTasks,
  updateTaskStatus,
};
