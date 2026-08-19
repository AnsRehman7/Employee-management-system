import { environment } from '../config';

const DEFAULT_TIMEOUT_MS = 75000;
const wait = milliseconds =>
  new Promise(resolve => setTimeout(resolve, milliseconds));

export const requestStaffFlow = async (
  session,
  path,
  options = {},
) => {
  const method = options.method || 'GET';
  const retries = Math.max(
    0,
    Math.min(options.retries ?? (method === 'GET' ? 1 : 0), 2),
  );
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
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
          ...(session?.idToken
            ? { Authorization: `Bearer ${session.idToken}` }
            : {}),
          ...(options.headers || {}),
        },
        method,
        signal: controller.signal,
      });

      if (response.status === 204) return {};
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(
          payload?.error?.message ||
            payload?.message ||
            'DayMark could not complete this request.',
        );
        error.status = response.status;
        throw error;
      }
      return payload.data || {};
    } catch (error) {
      lastError = error;
      const retryable =
        error?.name === 'AbortError' ||
        error instanceof TypeError ||
        error?.status === 502 ||
        error?.status === 503 ||
        error?.status === 504;
      if (!retryable || attempt === retries) break;
      await wait(750 * 2 ** attempt);
    } finally {
      clearTimeout(timeout);
    }
  }

  if (lastError?.name === 'AbortError') {
    throw new Error(
      'DayMark took too long to respond. Check your connection and try again.',
    );
  }
  throw lastError;
};

/**
 * Sign-in endpoints run before a session exists, so they carry no bearer token.
 */
export const requestSignInCode = email =>
  requestStaffFlow({ idToken: '' }, '/auth/otp/request', {
    body: { email },
    method: 'POST',
  });

export const verifySignInCode = ({ code, email }) =>
  requestStaffFlow({ idToken: '' }, '/auth/otp/verify', {
    body: { code, email },
    method: 'POST',
  });
