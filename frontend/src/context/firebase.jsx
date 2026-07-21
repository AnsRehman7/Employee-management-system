/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react";
import { initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  linkWithPopup,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";

const FirebaseContext = createContext(null);

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const requiredFirebaseKeys = ["apiKey", "authDomain", "projectId", "appId"];
export const missingFirebaseConfig = requiredFirebaseKeys.filter((key) => !firebaseConfig[key]);

if (missingFirebaseConfig.length) {
  console.error(`Missing Firebase configuration: ${missingFirebaseConfig.join(", ")}`);
}

export const firebaseapp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseapp);
const authPersistenceReady = setPersistence(auth, browserLocalPersistence);

const normalizeEmail = (email = "") => email.trim().toLowerCase();

export const formatFirebaseError = (error) => {
  const code = error?.code || "";

  const messages = {
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/configuration-not-found": "Google sign-in is not enabled for this Firebase project.",
    "auth/credential-already-in-use": "This Google account is already connected to another StaffFlow login.",
    "auth/invalid-credential": "The email or password is incorrect.",
    "auth/invalid-api-key": "The Firebase API key is invalid. Check the deployed frontend environment variables.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/network-request-failed": "Network error. Check your connection and try again.",
    "auth/operation-not-allowed": "Enable Google sign-in in Firebase Authentication, then try again.",
    "auth/account-exists-with-different-credential":
      "This email already uses password sign-in. Sign in with your password first.",
    "auth/popup-blocked": "Allow pop-ups for this site, then try Google sign-in again.",
    "auth/popup-closed-by-user": "Google sign-in was closed before it finished.",
    "auth/provider-already-linked": "Google sign-in is already connected to this account.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/user-not-found": "No account was found for this email.",
    "auth/unauthorized-domain":
      `This website is not authorized in Firebase. Add ${typeof window === "undefined" ? "the deployed domain" : window.location.hostname} under Authentication > Settings > Authorized domains.`,
    "auth/weak-password": "Use a stronger password with at least 6 characters.",
    "permission-denied": "You do not have permission to perform this action.",
  };

  return messages[code] || error?.message || "Something went wrong. Please try again.";
};

const signup = async ({ email, password }) => {
  await authPersistenceReady;
  const userCredential = await createUserWithEmailAndPassword(auth, normalizeEmail(email), password);
  return userCredential.user;
};

export const signInWithGoogle = async () => {
  await authPersistenceReady;
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  provider.addScope("email");
  provider.addScope("profile");
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

export const linkGoogleAccount = async () => {
  await authPersistenceReady;
  if (!auth.currentUser) throw new Error("Sign in before connecting a Google account.");
  if (auth.currentUser.providerData.some(({ providerId }) => providerId === GoogleAuthProvider.PROVIDER_ID)) {
    return auth.currentUser;
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await linkWithPopup(auth.currentUser, provider);
  return result.user;
};

export const login = async (email, password) => {
  await authPersistenceReady;
  const userCredential = await signInWithEmailAndPassword(auth, normalizeEmail(email), password);
  return userCredential.user;
};

export const logout = () => signOut(auth);

export const sendResetPassword = (email) => sendPasswordResetEmail(auth, normalizeEmail(email));

export const useFirebase = () => useContext(FirebaseContext);

export const FirebaseProvider = ({ children }) => (
  <FirebaseContext.Provider
    value={{
      auth,
      formatFirebaseError,
      login,
      linkGoogleAccount,
      logout,
      sendResetPassword,
      signup,
      signInWithGoogle,
    }}
  >
    {children}
  </FirebaseContext.Provider>
);
