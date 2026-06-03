/**
 * ThemeContext — light / dark / system preference with AsyncStorage persistence.
 *
 * Usage:
 *   const { colors, themeMode, setTheme, toggleTheme } = useTheme();
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, type ColorPalette } from '../constants/theme';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = '@closira_theme';

interface ThemeContextValue {
  /** Resolved color palette for the current mode */
  colors: ColorPalette;
  /** Current user preference */
  themeMode: ThemeMode;
  /** Whether the resolved theme is dark */
  isDark: boolean;
  /** Change theme preference */
  setTheme: (mode: ThemeMode) => void;
  /** Cycle: dark → light → dark */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');

  // Load saved preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setThemeMode(saved);
      }
    });
  }, []);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeMode(mode);
    AsyncStorage.setItem(STORAGE_KEY, mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(themeMode === 'dark' ? 'light' : 'dark');
  }, [themeMode, setTheme]);

  const isDark =
    themeMode === 'dark' ||
    (themeMode === 'system' && systemScheme === 'dark') ||
    (themeMode === 'system' && systemScheme == null);

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ colors, themeMode, isDark, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return ctx;
}
