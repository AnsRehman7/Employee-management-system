const { z } = require("zod");

const optionalTrimmedString = (max = 255) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal("").transform(() => undefined));

const syncProfileSchema = z.object({
  contact: optionalTrimmedString(40),
  fullName: optionalTrimmedString(120),
  role: optionalTrimmedString(30),
});

const createTaskSchema = z.object({
  assignedToId: z.string().trim().min(1, "Choose an employee before creating the task."),
  category: z.string().trim().min(1, "Category is required.").max(80),
  deadline: optionalTrimmedString(40),
  description: z.string().trim().min(1, "Description is required.").max(5000),
  priority: z.enum(["low", "normal", "high", "LOW", "NORMAL", "HIGH"]).default("normal"),
  title: z.string().trim().min(1, "Task title is required.").max(160),
});

const updateTaskStatusSchema = z.object({
  status: z.enum(["new", "completed", "NEW", "COMPLETED"]),
});

const updateUserRoleSchema = z.object({
  role: z.enum(["admin", "hr", "employee", "ADMIN", "HR", "EMPLOYEE"]),
});

const parseBody = (schema, body) => schema.parse(body || {});

module.exports = {
  createTaskSchema,
  parseBody,
  syncProfileSchema,
  updateTaskStatusSchema,
  updateUserRoleSchema,
};
