import { environment } from '../config';

const firebaseMessages = {
  EMAIL_NOT_FOUND: 'No StaffFlow login was found for this email.',
  INVALID_EMAIL: 'Enter a valid email address.',
  INVALID_LOGIN_CREDENTIALS: 'Email or password is incorrect.',
  INVALID_PASSWORD: 'Email or password is incorrect.',
  TOO_MANY_ATTEMPTS_TRY_LATER:
    'Too many sign-in attempts. Wait a moment and try again.',
  USER_DISABLED: 'This StaffFlow account is disabled.',
};

const firebaseError = payload =>
  firebaseMessages[payload?.error?.message] ||
  'Unable to sign in. Please try again.';

export const signInWithFirebase = async ({ email, password }) => {
  if (!environment.firebaseWebApiKey) {
    throw new Error('Firebase authentication is not configured for this app.');
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.firebaseWebApiKey}`,
    {
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    },
  );
  const payload = await response.json();

  if (!response.ok) throw new Error(firebaseError(payload));

  return {
    email: payload.email,
    expiresAt: Date.now() + Number(payload.expiresIn || 3600) * 1000,
    idToken: payload.idToken,
    localId: payload.localId,
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
