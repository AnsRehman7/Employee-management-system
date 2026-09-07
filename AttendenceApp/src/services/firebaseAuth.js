import { environment } from '../config';

const firebaseMessages = {
  CREDENTIAL_MISMATCH: 'This sign-in code was issued for a different workspace.',
  EMAIL_NOT_FOUND: 'No DayMark login was found for this email.',
  INVALID_CUSTOM_TOKEN: 'This sign-in code is no longer valid. Request a new one.',
  INVALID_EMAIL: 'Enter a valid email address.',
  TOKEN_EXPIRED: 'This sign-in code expired. Request a new one.',
  TOO_MANY_ATTEMPTS_TRY_LATER:
    'Too many sign-in attempts. Wait a moment and try again.',
  USER_DISABLED: 'This DayMark account is disabled.',
};

const firebaseError = payload =>
  firebaseMessages[payload?.error?.message] ||
  'Unable to sign in. Please try again.';

/**
 * Google's identity endpoints are called during app start-up, before any screen is shown.
 * A request that never settles - a captive portal, a stalled DNS lookup, a network that
 * drops mid-flight - would leave the caller awaiting forever and the app stuck on its
 * loading state, so every call is bounded by an explicit timeout.
 */
const FIREBASE_TIMEOUT_MS = 15000;

const fetchWithTimeout = async (url, options, timeoutMessage) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FIREBASE_TIMEOUT_MS);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === 'AbortError') throw new Error(timeoutMessage);
    // A DNS or connectivity failure surfaces as a bare TypeError from fetch.
    throw new Error(timeoutMessage);
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Exchanges the custom token minted by the DayMark API after a verified email
 * code for a normal Firebase session. Attendance scans keep using the resulting
 * ID token exactly as before.
 */
export const signInWithCustomToken = async ({ customToken, email }) => {
  if (!environment.firebaseWebApiKey) {
    throw new Error('Firebase authentication is not configured for this app.');
  }

  const response = await fetchWithTimeout(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${environment.firebaseWebApiKey}`,
    {
      body: JSON.stringify({ returnSecureToken: true, token: customToken }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    },
    'Sign-in timed out. Check your connection and try again.',
  );
  const payload = await response.json();

  if (!response.ok) throw new Error(firebaseError(payload));

  return {
    email,
    expiresAt: Date.now() + Number(payload.expiresIn || 3600) * 1000,
    idToken: payload.idToken,
    localId: payload.localId || '',
    refreshToken: payload.refreshToken,
  };
};

export const refreshFirebaseSession = async session => {
  if (!environment.firebaseWebApiKey || !session?.refreshToken) {
    throw new Error('Your session expired. Please sign in again.');
  }

  const response = await fetchWithTimeout(
    `https://securetoken.googleapis.com/v1/token?key=${environment.firebaseWebApiKey}`,
    {
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(
        session.refreshToken,
      )}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      method: 'POST',
    },
    'Could not refresh your session. Check your connection and try again.',
  );
  const payload = await response.json();

  if (!response.ok) {
    throw new Error('Your session expired. Please sign in again.');
  }

  return {
    ...session,
    expiresAt: Date.now() + Number(payload.expires_in || 3600) * 1000,
    idToken: payload.id_token,
    refreshToken: payload.refresh_token || session.refreshToken,
  };
};
