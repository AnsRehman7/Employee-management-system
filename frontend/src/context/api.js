const API_BASE_URL = import.meta.env.VITE_API_URL;

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
    throw error;
  }

  return payload.data;
};

const request = async (path, options = {}) => {
  const token = await authTokenProvider();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  return parseResponse(response);
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
  createProject: (payload) => request("/projects", { body: payload, method: "POST" }),
  createTask: (payload) => request("/tasks", { body: payload, method: "POST" }),
  createTimeLog: (taskId, payload) => request(`/tasks/${taskId}/time-logs`, { body: payload, method: "POST" }),
  createUser: (payload) => request("/users", { body: payload, method: "POST" }),
  deleteProject: (projectId) => request(`/projects/${projectId}`, { method: "DELETE" }),
  deleteTask: (taskId) => request(`/tasks/${taskId}`, { method: "DELETE" }),
  deleteUser: (userId) => request(`/users/${userId}`, { method: "DELETE" }),
  getAttendanceScans: (date) => request(`/attendance/scans${date ? `?date=${encodeURIComponent(date)}` : ""}`),
  getCurrentUser: () => request("/auth/me"),
  getEmployees: () => request("/users/employees"),
  getProject: (projectId) => request(`/projects/${projectId}`),
  getProjects: () => request("/projects"),
  getNotifications: () => request("/notifications"),
  getPermissionCatalog: () => request("/users/permissions/catalog"),
  getTask: (taskId) => request(`/tasks/${taskId}`),
  getTaskStats: () => request("/tasks/stats"),
  getTasks: () => request("/tasks"),
  getUser: (userId) => request(`/users/${userId}`),
  getUsers: () => request("/users"),
  syncProfile: (payload = {}) => request("/auth/sync", { body: payload, method: "POST" }),
  markAllNotificationsRead: () => request("/notifications/read-all", { method: "PATCH" }),
  markNotificationRead: (notificationId) => request(`/notifications/${notificationId}/read`, { method: "PATCH" }),
  updateCurrentProfile: (payload) => request("/auth/me", { body: payload, method: "PATCH" }),
  updateProject: (projectId, payload) => request(`/projects/${projectId}`, { body: payload, method: "PATCH" }),
  updateTask: (taskId, payload) => request(`/tasks/${taskId}`, { body: payload, method: "PATCH" }),
  updateTaskStatus: (taskId, status) =>
    request(`/tasks/${taskId}/status`, { body: { status }, method: "PATCH" }),
  updateUser: (userId, payload) => request(`/users/${userId}`, { body: payload, method: "PATCH" }),
  updateUserRole: (userId, role) => request(`/users/${userId}/role`, { body: { role }, method: "PATCH" }),
  updateUserPermissions: (userId, payload) =>
    request(`/users/${userId}/permissions`, { body: payload, method: "PATCH" }),
};
