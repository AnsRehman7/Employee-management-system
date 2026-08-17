/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { api, formatApiError, setAuthTokenProvider } from "./api";
import { auth } from "./firebase";

const UserContext = createContext(null);

setAuthTokenProvider(async ({ forceRefresh = false } = {}) => {
  if (!auth.currentUser) return null;
  return auth.currentUser.getIdToken(forceRefresh);
});

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestVersion = useRef(0);

  const refreshUser = useCallback(async (profileData = {}) => {
    const version = ++requestVersion.current;

    if (!auth.currentUser) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const { user: profile } = await api.syncProfile(profileData);
      if (version === requestVersion.current) {
        setError("");
        setUser(profile);
      }
      return profile;
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const version = ++requestVersion.current;
      setError("");

      try {
        if (!firebaseUser) {
          setUser(null);
          return;
        }

        const { user: profile } = await api.getCurrentUser();
        if (version === requestVersion.current) setUser(profile);
      } catch (sessionError) {
        // A 401 here means the server rejected the session itself: the 3-day window
        // elapsed, or the sign-in method is no longer allowed. Clear the Firebase
        // session too, otherwise the client keeps a token the API will never accept.
        if (sessionError?.status === 401) {
          await signOut(auth).catch(() => {});
        }

        if (version === requestVersion.current) {
          if (sessionError?.status !== 404) {
            console.error("Session error:", sessionError);
            setError(formatApiError(sessionError));
          }
          setUser(null);
        }
      } finally {
        if (version === requestVersion.current) setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      error,
      loading,
      refreshUser,
      setUser,
      user,
    }),
    [error, loading, refreshUser, user]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => useContext(UserContext);
