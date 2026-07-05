const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

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
  createTask: (payload) => request("/tasks", { body: payload, method: "POST" }),
  deleteTask: (taskId) => request(`/tasks/${taskId}`, { method: "DELETE" }),
  getCurrentUser: () => request("/auth/me"),
  getEmployees: () => request("/users/employees"),
  getTaskStats: () => request("/tasks/stats"),
  getTasks: () => request("/tasks"),
  getUsers: () => request("/users"),
  syncProfile: (payload = {}) => request("/auth/sync", { body: payload, method: "POST" }),
  updateTaskStatus: (taskId, status) =>
    request(`/tasks/${taskId}/status`, { body: { status }, method: "PATCH" }),
  updateUserRole: (userId, role) => request(`/users/${userId}/role`, { body: { role }, method: "PATCH" }),
};
