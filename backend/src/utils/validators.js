const { z } = require("zod");

const optionalTrimmedString = (max = 255) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal("").transform(() => undefined));

const optionalNumber = (max = 9999) =>
  z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) return undefined;
      return Number(value);
    },
    z.number().finite().nonnegative().max(max).optional()
  );

const requiredNumber = (max = 9999) =>
  z.preprocess((value) => Number(value), z.number().finite().positive().max(max));

const syncProfileSchema = z.object({
  contact: optionalTrimmedString(40),
  fullName: optionalTrimmedString(120),
  role: optionalTrimmedString(30),
});

const createProjectSchema = z.object({
  description: optionalTrimmedString(5000),
  dueDate: optionalTrimmedString(40),
  name: z.string().trim().min(1, "Project name is required.").max(160),
  startDate: optionalTrimmedString(40),
});

const updateProjectSchema = z.object({
  description: optionalTrimmedString(5000),
  dueDate: optionalTrimmedString(40),
  name: optionalTrimmedString(160),
  startDate: optionalTrimmedString(40),
  status: z.enum(["planned", "active", "completed", "archived", "PLANNED", "ACTIVE", "COMPLETED", "ARCHIVED"]).optional(),
});

const createTaskSchema = z.object({
  assignedToId: z.string().trim().min(1, "Choose an employee before creating the task."),
  category: z.string().trim().min(1, "Category is required.").max(80),
  deadline: optionalTrimmedString(40),
  description: z.string().trim().min(1, "Description is required.").max(5000),
  estimatedHours: optionalNumber(999.99),
  priority: z.enum(["low", "normal", "high", "LOW", "NORMAL", "HIGH"]).default("normal"),
  projectId: z.string().trim().min(1, "Choose a project before creating the task."),
  successCriteria: optionalTrimmedString(5000),
  title: z.string().trim().min(1, "Task title is required.").max(160),
});

const createTimeLogSchema = z.object({
  hours: requiredNumber(999.99),
  loggedAt: optionalTrimmedString(40),
  note: optionalTrimmedString(1000),
});

const updateTaskStatusSchema = z.object({
  status: z.enum(["new", "completed", "NEW", "COMPLETED"]),
});

const updateUserRoleSchema = z.object({
  role: z.enum(["admin", "hr", "employee", "ADMIN", "HR", "EMPLOYEE"]),
});

const parseBody = (schema, body) => schema.parse(body || {});

module.exports = {
  createProjectSchema,
  createTaskSchema,
  createTimeLogSchema,
  parseBody,
  syncProfileSchema,
  updateProjectSchema,
  updateTaskStatusSchema,
  updateUserRoleSchema,
};
