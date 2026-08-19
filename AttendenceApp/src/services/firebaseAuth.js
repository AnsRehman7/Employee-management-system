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
 * Exchanges the custom token minted by the DayMark API after a verified email
 * code for a normal Firebase session. Attendance scans keep using the resulting
 * ID token exactly as before.
 */
export const signInWithCustomToken = async ({ customToken, email }) => {
  if (!environment.firebaseWebApiKey) {
    throw new Error('Firebase authentication is not configured for this app.');
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${environment.firebaseWebApiKey}`,
    {
      body: JSON.stringify({ returnSecureToken: true, token: customToken }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    },
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

  const response = await fetch(
    `https://securetoken.googleapis.com/v1/token?key=${environment.firebaseWebApiKey}`,
    {
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(
        session.refreshToken,
      )}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      method: 'POST',
    },
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
