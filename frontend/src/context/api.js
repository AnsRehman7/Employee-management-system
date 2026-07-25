const API_BASE_URL = String(
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:4000/api" : ""),
).replace(/\/$/, "");

let authTokenProvider = async () => null;

export const setAuthTokenProvider = (provider) => {
  authTokenProvider = provider;
};

const parseResponse = async (response) => {
  if (response.status === 204) return null;

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.error?.message || "Request failed. Please try again.";
    const error = new Error(message);
    error.status = response.status;
    error.details = payload?.error?.details;
    error.requestId = payload?.error?.requestId || response.headers.get("x-request-id") || "";
    throw error;
  }

  return payload.data;
};

const fetchRequest = async (path, options, forceRefresh = false) => {
  if (!API_BASE_URL) {
    throw new Error("VITE_API_URL is not configured for this deployment.");
  }

  const token = await authTokenProvider({ forceRefresh });
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), options.timeout || 30_000);

  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("The server took too long to respond. Please try again.");
    }

    throw new Error(`Unable to reach the StaffFlow API at ${API_BASE_URL}.`);
  } finally {
    window.clearTimeout(timeout);
  }
};

const request = async (path, options = {}) => {
  let response = await fetchRequest(path, options);

  if (response.status === 401) {
    response = await fetchRequest(path, options, true);
  }

  return parseResponse(response);
};

const withQuery = (path, values = {}) => {
  const search = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, value);
  });
  const query = search.toString();
  return query ? `${path}?${query}` : path;
};

export const formatApiError = (error) => {
  if (error?.details && typeof error.details === "object") {
    const firstMessage = Object.values(error.details).flat().find(Boolean);
    if (firstMessage) return firstMessage;
  }

  return error?.message || "Something went wrong. Please try again.";
};

export const api = {
  createAttendanceScan: (payload) => request("/attendance/scans", { body: payload, method: "POST" }),
  createCustomField: (moduleId, payload) =>
    request(`/customization/modules/${moduleId}/fields`, { body: payload, method: "POST" }),
  createCustomModule: (payload) => request("/customization/modules", { body: payload, method: "POST" }),
  createCustomRecord: (moduleKey, values) =>
    request(`/modules/${moduleKey}/records`, { body: { values }, method: "POST" }),
  createProject: (payload) => request("/projects", { body: payload, method: "POST", timeout: 60_000 }),
  createTask: (payload) => request("/tasks", { body: payload, method: "POST" }),
  createTimeLog: (taskId, payload) => request(`/tasks/${taskId}/time-logs`, { body: payload, method: "POST" }),
  createUser: (payload) => request("/users", { body: payload, method: "POST" }),
  deleteProject: (projectId) => request(`/projects/${projectId}`, { method: "DELETE" }),
  deleteCustomField: (moduleId, fieldId) =>
    request(`/customization/modules/${moduleId}/fields/${fieldId}`, { method: "DELETE" }),
  deleteCustomRecord: (moduleKey, recordId) =>
    request(`/modules/${moduleKey}/records/${recordId}`, { method: "DELETE" }),
  deleteTask: (taskId) => request(`/tasks/${taskId}`, { method: "DELETE" }),
  deleteUser: (userId) => request(`/users/${userId}`, { method: "DELETE" }),
  getAttendanceScans: (date) => request(`/attendance/scans${date ? `?date=${encodeURIComponent(date)}` : ""}`),
  getCurrentUser: () => request("/auth/me"),
  getAuditLogs: (filters = {}) => request(withQuery("/audit", filters)),
  getAvailableModules: () => request("/modules"),
  getCustomizationModules: () => request("/customization/modules"),
  getCustomModule: (moduleKey) => request(`/modules/${moduleKey}`),
  getCustomRecord: (moduleKey, recordId) => request(`/modules/${moduleKey}/records/${recordId}`),
  getCustomRecords: (moduleKey) => request(`/modules/${moduleKey}/records`),
  getEmployees: () => request("/users/employees"),
  getProject: (projectId) => request(`/projects/${projectId}`),
  getProjectActivity: (projectId) => request(`/projects/${projectId}/activity`),
  getProjects: () => request("/projects"),
  getNotifications: () => request("/notifications"),
  getOverviewReport: (days = 30) => request(withQuery("/reports/overview", { days })),
  getPermissionCatalog: () => request("/users/permissions/catalog"),
  getTask: (taskId) => request(`/tasks/${taskId}`),
  getTaskActivity: (taskId) => request(`/tasks/${taskId}/activity`),
  getTaskStats: () => request("/tasks/stats"),
  getTasks: () => request("/tasks"),
  getUser: (userId) => request(`/users/${userId}`),
  getUsers: () => request("/users"),
  getWorkspaceSettings: () => request("/workspace/settings"),
  syncProfile: (payload = {}) => request("/auth/sync", { body: payload, method: "POST" }),
  markAllNotificationsRead: () => request("/notifications/read-all", { method: "PATCH" }),
  markNotificationRead: (notificationId) => request(`/notifications/${notificationId}/read`, { method: "PATCH" }),
  updateCurrentProfile: (payload) => request("/auth/me", { body: payload, method: "PATCH" }),
  updateCustomField: (moduleId, fieldId, payload) =>
    request(`/customization/modules/${moduleId}/fields/${fieldId}`, { body: payload, method: "PATCH" }),
  updateCustomModule: (moduleId, payload) =>
    request(`/customization/modules/${moduleId}`, { body: payload, method: "PATCH" }),
  updateCustomRecord: (moduleKey, recordId, values) =>
    request(`/modules/${moduleKey}/records/${recordId}`, { body: { values }, method: "PATCH" }),
  updateProject: (projectId, payload) => request(`/projects/${projectId}`, { body: payload, method: "PATCH" }),
  updateTask: (taskId, payload) => request(`/tasks/${taskId}`, { body: payload, method: "PATCH" }),
  updateTaskStatus: (taskId, status) =>
    request(`/tasks/${taskId}/status`, { body: { status }, method: "PATCH" }),
  updateUser: (userId, payload) => request(`/users/${userId}`, { body: payload, method: "PATCH" }),
  updateUserRole: (userId, role) => request(`/users/${userId}/role`, { body: { role }, method: "PATCH" }),
  updateUserPermissions: (userId, payload) =>
    request(`/users/${userId}/permissions`, { body: payload, method: "PATCH" }),
  updateWorkspaceSettings: (payload) => request("/workspace/settings", { body: payload, method: "PATCH" }),
};
