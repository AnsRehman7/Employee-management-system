import { environment } from '../config';

const DEFAULT_TIMEOUT_MS = 60000;

export const requestStaffFlow = async (
  session,
  path,
  options = {},
) => {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeout || DEFAULT_TIMEOUT_MS,
  );

  try {
    const response = await fetch(`${environment.apiBaseUrl}${path}`, {
      body: options.body ? JSON.stringify(options.body) : undefined,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.idToken}`,
        ...(options.headers || {}),
      },
      method: options.method || 'GET',
      signal: controller.signal,
    });

    if (response.status === 204) return {};
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(
        payload?.error?.message ||
          payload?.message ||
          'StaffFlow could not complete this request.',
      );
      error.status = response.status;
      throw error;
    }
    return payload.data || {};
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('StaffFlow took too long to respond. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};
