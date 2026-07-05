/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { api, formatApiError, setAuthTokenProvider } from "./api";
import { auth } from "./firebase";

const UserContext = createContext(null);

setAuthTokenProvider(async () => {
  if (!auth.currentUser) return null;
  return auth.currentUser.getIdToken();
});

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshUser = useCallback(async (profileData = {}) => {
    if (!auth.currentUser) {
      setUser(null);
      return null;
    }

    const { user: profile } = await api.syncProfile(profileData);
    setUser(profile);
    return profile;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setError("");

      try {
        if (!firebaseUser) {
          setUser(null);
          return;
        }

        const { user: profile } = await api.syncProfile();
        setUser(profile);
      } catch (sessionError) {
        console.error("Session error:", sessionError);
        setError(formatApiError(sessionError));
        setUser(null);
      } finally {
        setLoading(false);
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
