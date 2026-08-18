/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);

const STORAGE_KEY = "staffflow.theme";
const THEMES = ["light", "dark", "system"];

const systemPrefersDark = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;

/** Light is the default; dark and system are opt-in choices the user makes. */
export const readStoredTheme = () => {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return THEMES.includes(stored) ? stored : "light";
};

/** Resolves the user's choice to the theme actually painted. */
export const resolveTheme = (preference) =>
  preference === "system" ? (systemPrefersDark() ? "dark" : "light") : preference;

const applyTheme = (resolved) => {
  document.documentElement.setAttribute("data-theme", resolved);
};

export const ThemeProvider = ({ children }) => {
  const [preference, setPreference] = useState(readStoredTheme);
  const [resolved, setResolved] = useState(() => resolveTheme(readStoredTheme()));

  useEffect(() => {
    const next = resolveTheme(preference);
    setResolved(next);
    applyTheme(next);
    window.localStorage.setItem(STORAGE_KEY, preference);
  }, [preference]);

  // Follow the OS while the user is on "system".
  useEffect(() => {
    if (preference !== "system") return undefined;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = systemPrefersDark() ? "dark" : "light";
      setResolved(next);
      applyTheme(next);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [preference]);

  const toggleTheme = useCallback(() => {
    setPreference(resolveTheme(readStoredTheme()) === "dark" ? "light" : "dark");
  }, []);

  const value = useMemo(
    () => ({ isDark: resolved === "dark", preference, resolved, setPreference, toggleTheme }),
    [preference, resolved, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
