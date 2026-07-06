const prisma = require("../db/prisma");
const ApiError = require("../utils/apiError");
const { isPrivileged, USER_ROLES } = require("../utils/roles");

const normalizePriority = (priority = "normal") => String(priority).trim().toUpperCase();
const normalizeStatus = (status = "new") => String(status).trim().toUpperCase();
const toNumber = (value) => (value === null || value === undefined ? null : Number(value));

const parseDate = (value, label) => {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(400, `${label} must be a valid date.`);
  }

  return parsed;
};

const serializeTimeLog = (timeLog) => ({
  createdAt: timeLog.createdAt,
  hours: toNumber(timeLog.hours) || 0,
  id: timeLog.id,
  loggedAt: timeLog.loggedAt,
  note: timeLog.note || "",
  taskId: timeLog.taskId,
  userId: timeLog.userId,
  userName: timeLog.user?.fullName || "Team member",
});

const serializeTask = (task) => ({
  assignedToEmail: task.assignedTo?.email || "",
  assignedToId: task.assignedToId,
  assignedToName: task.assignedTo?.fullName || "Unassigned",
  category: task.category,
  completedAt: task.completedAt,
  createdAt: task.createdAt,
  createdByEmail: task.createdBy?.email || "",
  createdById: task.createdById,
  createdByName: task.createdBy?.fullName || "Manager",
  deadline: task.deadline ? task.deadline.toISOString().slice(0, 10) : "",
  description: task.description,
  estimatedHours: toNumber(task.estimatedHours),
  id: task.id,
  priority: String(task.priority).toLowerCase(),
  projectId: task.projectId || "",
  projectName: task.project?.name || "Unassigned project",
  status: String(task.status).toLowerCase(),
  successCriteria: task.successCriteria || "",
  timeLogs: (task.timeLogs || []).map(serializeTimeLog),
  title: task.title,
  totalLoggedHours: (task.timeLogs || []).reduce((total, timeLog) => total + (toNumber(timeLog.hours) || 0), 0),
  updatedAt: task.updatedAt,
});

const taskInclude = {
  assignedTo: true,
  createdBy: true,
  project: true,
  timeLogs: {
    include: {
      user: true,
    },
    orderBy: {
      loggedAt: "desc",
    },
  },
};

const listTasks = async (currentUser) => {
  const tasks = await prisma.task.findMany({
    include: taskInclude,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    where: isPrivileged(currentUser) ? undefined : { assignedToId: currentUser.id },
  });

  return tasks.map(serializeTask);
};

const createTask = async (currentUser, payload) => {
  if (!isPrivileged(currentUser)) {
    throw new ApiError(403, "Only admins and HR can assign tasks.");
  }

  const assignee = await prisma.user.findUnique({
    where: { id: payload.assignedToId },
  });

  if (!assignee || assignee.role !== USER_ROLES.EMPLOYEE) {
    throw new ApiError(400, "Choose a valid employee assignee.");
  }

  const project = await prisma.project.findUnique({
    where: { id: payload.projectId },
  });

  if (!project) {
    throw new ApiError(400, "Choose a valid project before assigning the task.");
  }

  if (project.status === "ARCHIVED") {
    throw new ApiError(400, "Archived projects cannot receive new tasks.");
  }

  const task = await prisma.task.create({
    data: {
      assignedToId: assignee.id,
      category: payload.category,
      createdById: currentUser.id,
      deadline: parseDate(payload.deadline, "Deadline"),
      description: payload.description,
      estimatedHours: payload.estimatedHours ?? null,
      priority: normalizePriority(payload.priority),
      projectId: payload.projectId,
      successCriteria: payload.successCriteria || null,
      title: payload.title,
    },
    include: taskInclude,
  });

  return serializeTask(task);
};

const getTaskForAction = async (taskId, currentUser) => {
  const task = await prisma.task.findUnique({
    include: taskInclude,
    where: { id: taskId },
  });

  if (!task) {
    throw new ApiError(404, "Task not found.");
  }

  if (!isPrivileged(currentUser) && task.assignedToId !== currentUser.id) {
    throw new ApiError(403, "You can only update tasks assigned to you.");
  }

  return task;
};

const updateTaskStatus = async (taskId, status, currentUser) => {
  await getTaskForAction(taskId, currentUser);

  const normalizedStatus = normalizeStatus(status);
  const task = await prisma.task.update({
    data: {
      completedAt: normalizedStatus === "COMPLETED" ? new Date() : null,
      status: normalizedStatus,
    },
    include: taskInclude,
    where: { id: taskId },
  });

  return serializeTask(task);
};

const createTimeLog = async (taskId, currentUser, payload) => {
  await getTaskForAction(taskId, currentUser);

  const timeLog = await prisma.timeLog.create({
    data: {
      hours: payload.hours,
      loggedAt: parseDate(payload.loggedAt, "Logged date") || new Date(),
      note: payload.note || null,
      taskId,
      userId: currentUser.id,
    },
    include: {
      user: true,
    },
  });

  return serializeTimeLog(timeLog);
};

const deleteTask = async (taskId, currentUser) => {
  if (!isPrivileged(currentUser)) {
    throw new ApiError(403, "Only admins and HR can delete tasks.");
  }

  await getTaskForAction(taskId, currentUser);
  await prisma.task.delete({ where: { id: taskId } });
};

const getTaskStats = async (currentUser) => {
  const where = isPrivileged(currentUser) ? undefined : { assignedToId: currentUser.id };
  const [total, completed, active] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.count({ where: { ...where, status: "COMPLETED" } }),
    prisma.task.count({ where: { ...where, status: "NEW" } }),
  ]);

  return { active, completed, total };
};

module.exports = {
  createTimeLog,
  createTask,
  deleteTask,
  getTaskStats,
  listTasks,
  serializeTask,
  taskInclude,
  updateTaskStatus,
};
