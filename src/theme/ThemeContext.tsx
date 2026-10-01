import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { darkTheme, lightTheme, type ThemeColors, type ThemeMode } from './tokens';

const THEME_KEY = 'nutriai.theme';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  /** true once the persisted choice (or device default) has loaded */
  ready: boolean;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  colors: lightTheme,
  ready: false,
  setMode: () => {},
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const deviceScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    SecureStore.getItemAsync(THEME_KEY)
      .then((stored) => {
        if (!alive) return;
        if (stored === 'light' || stored === 'dark') {
          setModeState(stored);
        } else if (deviceScheme === 'dark') {
          setModeState('dark');
        }
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, [deviceScheme]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    SecureStore.setItemAsync(THEME_KEY, next).catch(() => {});
  }, []);

  const toggle = useCallback(() => {
    setModeState((prev) => {
      const next: ThemeMode = prev === 'light' ? 'dark' : 'light';
      SecureStore.setItemAsync(THEME_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      colors: mode === 'dark' ? darkTheme : lightTheme,
      ready,
      setMode,
      toggle,
    }),
    [mode, ready, setMode, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
