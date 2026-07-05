/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react";
import { initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";

const FirebaseContext = createContext(null);

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDiaRd6tXL-sbEUOkZHKcc7fbE_WylEvDY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "employee-94f1d.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "employee-94f1d",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "employee-94f1d.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "237423846118",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:237423846118:web:7be9797024e6b64689d127",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-DK4GTRQYH1",
};

export const firebaseapp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseapp);

const normalizeEmail = (email = "") => email.trim().toLowerCase();

export const formatFirebaseError = (error) => {
  const code = error?.code || "";

  const messages = {
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/invalid-credential": "The email or password is incorrect.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/network-request-failed": "Network error. Check your connection and try again.",
    "auth/popup-closed-by-user": "Google sign-in was closed before it finished.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/user-not-found": "No account was found for this email.",
    "auth/weak-password": "Use a stronger password with at least 6 characters.",
    "permission-denied": "You do not have permission to perform this action.",
  };

  return messages[code] || error?.message || "Something went wrong. Please try again.";
};

const signup = async ({ email, password }) => {
  const userCredential = await createUserWithEmailAndPassword(auth, normalizeEmail(email), password);
  return userCredential.user;
};

export const signupWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

export const login = async (email, password) => {
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
      logout,
      sendResetPassword,
      signup,
      signupWithGoogle,
    }}
  >
    {children}
  </FirebaseContext.Provider>
);
