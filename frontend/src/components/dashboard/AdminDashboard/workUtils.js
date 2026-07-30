export const TASK_STATUS_OPTIONS = [
  { label: "Open", value: "open" },
  { label: "Active", value: "active" },
  { label: "In progress", value: "in_progress" },
  { label: "Blocked", value: "blocked" },
  { label: "Completed", value: "completed" },
];

export const TASK_STATUS_STYLES = {
  active: "border-teal-200 bg-teal-50 text-teal-900",
  blocked: "border-rose-200 bg-rose-50 text-rose-800",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  in_progress: "border-teal-200 bg-teal-50 text-teal-900",
  open: "border-amber-200 bg-amber-50 text-amber-800",
};

export const PROJECT_STATUS_OPTIONS = [
  { label: "Planned", value: "planned" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Archived", value: "archived" },
];

export const PROJECT_STATUS_STYLES = {
  active: "border-teal-200 bg-teal-50 text-teal-900",
  archived: "border-slate-200 bg-slate-100 text-slate-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  planned: "border-emerald-200 bg-emerald-50 text-emerald-900",
};

export const PROJECT_HEALTH_STYLES = {
  archived: "text-slate-600",
  complete: "text-emerald-700",
  "due-soon": "text-amber-700",
  "on-track": "text-teal-800",
  overdue: "text-rose-700",
};

export const labelForValue = (value = "") =>
  String(value)
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const parseDate = (value) => {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00`);
  return new Date(value);
};

export const formatDate = (value, fallback = "Not set") => {
  const date = parseDate(value);
  if (!date || Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

export const formatDateTime = (value, fallback = "Not available") => {
  const date = parseDate(value);
  if (!date || Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

export const isOverdue = (value, status) => {
  if (!value || status === "completed") return false;
  const date = parseDate(value);
  if (!date || Number.isNaN(date.getTime())) return false;
  date.setHours(23, 59, 59, 999);
  return date.getTime() < Date.now();
};

export const initialsFor = (name = "Team member") =>
  (String(name || "").trim() || "Team member")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
