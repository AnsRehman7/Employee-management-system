import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import {
  createShadow,
  createTypography,
  darkColors,
  lightColors,
} from './theme';

const ThemeContext = createContext(null);

/**
 * Follows the device appearance by default, matching the web app's "system" default.
 * An in-app override lasts for the session; persisting it would need a storage
 * dependency and therefore a native rebuild.
 */
export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState(null);
  const scheme = override || (systemScheme === 'dark' ? 'dark' : 'light');

  const value = useMemo(() => {
    const colors = scheme === 'dark' ? darkColors : lightColors;
    return {
      colors,
      isDark: scheme === 'dark',
      scheme,
      shadow: createShadow(scheme),
      typography: createTypography(colors),
    };
  }, [scheme]);

  const toggleTheme = useCallback(() => {
    setOverride(scheme === 'dark' ? 'light' : 'dark');
  }, [scheme]);

  const followSystem = useCallback(() => setOverride(null), []);

  const contextValue = useMemo(
    () => ({ ...value, followSystem, isFollowingSystem: override === null, toggleTheme }),
    [followSystem, override, toggleTheme, value],
  );

  return (
    <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (context) return context;

  // Falls back to light so a component rendered outside the provider still works.
  return {
    colors: lightColors,
    followSystem: () => {},
    isDark: false,
    isFollowingSystem: true,
    scheme: 'light',
    shadow: createShadow('light'),
    toggleTheme: () => {},
    typography: createTypography(lightColors),
  };
};

/**
 * Builds a themed StyleSheet, rebuilt only when the palette changes. The factory
 * receives one object so each file destructures just the tokens it needs.
 */
export const useThemedStyles = (factory) => {
  const { colors, shadow, typography } = useAppTheme();
  return useMemo(
    () => factory({ colors, shadow, typography }),
    [colors, factory, shadow, typography],
  );
};
