import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Appearance, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import * as SystemUI from 'expo-system-ui';
import { getColors, AppColors } from '../theme/colors';

export { getColors, AppColors };

export type ThemeMode = 'system' | 'light' | 'dark';

export interface ThemeContextType {
  themeMode: ThemeMode;
  theme: 'light' | 'dark';
  isDark: boolean;
  tailwindClass: 'light' | 'dark';
  colors: AppColors;
  color: AppColors;
  getColors: (isDark?: boolean) => AppColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const THEME_STORAGE_KEY = '@gap_app_theme_mode';

const defaultIsDark = (() => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return Appearance.getColorScheme() === 'dark';
})();

const defaultColors = getColors(defaultIsDark);

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'system',
  theme: defaultIsDark ? 'dark' : 'light',
  isDark: defaultIsDark,
  tailwindClass: defaultIsDark ? 'dark' : 'light',
  colors: defaultColors,
  color: defaultColors,
  getColors: (dark?: boolean) => getColors(dark !== undefined ? dark : defaultIsDark),
  setThemeMode: async () => {},
  toggleTheme: async () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [systemScheme, setSystemScheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    const initial = Appearance.getColorScheme();
    return initial === 'dark' ? 'dark' : 'light';
  });

  const { setColorScheme: setNWColorScheme } = useNativeWindColorScheme();

  // Listen to system theme changes across native and web
  useEffect(() => {
    // 1. Native Appearance listener
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme === 'dark' || colorScheme === 'light') {
        setSystemScheme(colorScheme);
      }
    });

    // 2. Web matchMedia listener for real-time browser theme change
    let mediaQueryList: MediaQueryList | null = null;
    let mediaListener: ((e: MediaQueryListEvent) => void) | null = null;

    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.matchMedia) {
      mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      setSystemScheme(mediaQueryList.matches ? 'dark' : 'light');

      mediaListener = (e: MediaQueryListEvent) => {
        setSystemScheme(e.matches ? 'dark' : 'light');
      };

      if (mediaQueryList.addEventListener) {
        mediaQueryList.addEventListener('change', mediaListener);
      } else if ((mediaQueryList as any).addListener) {
        (mediaQueryList as any).addListener(mediaListener);
      }
    }

    // 3. Load saved preference from AsyncStorage
    async function loadSavedTheme() {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setThemeModeState(saved);
        }
      } catch (err) {
        console.warn('[ThemeProvider] Failed to load saved theme:', err);
      }
    }

    loadSavedTheme();

    return () => {
      subscription.remove();
      if (mediaQueryList && mediaListener) {
        if (mediaQueryList.removeEventListener) {
          mediaQueryList.removeEventListener('change', mediaListener);
        } else if ((mediaQueryList as any).removeListener) {
          (mediaQueryList as any).removeListener(mediaListener);
        }
      }
    };
  }, []);

  const isDark = useMemo(() => {
    if (themeMode === 'dark') return true;
    if (themeMode === 'light') return false;
    return systemScheme === 'dark';
  }, [themeMode, systemScheme]);

  const activeTheme: 'light' | 'dark' = isDark ? 'dark' : 'light';

  // Synchronize Web document and body for uniform browser canvas
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const bg = isDark ? '#41444B' : '#DFD8C8';
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
      document.documentElement.style.backgroundColor = bg;
      document.body.style.backgroundColor = bg;
    }
  }, [isDark]);

  // Synchronize SystemUI background color on native platforms
  useEffect(() => {
    try {
      SystemUI.setBackgroundColorAsync(isDark ? '#41444B' : '#DFD8C8');
    } catch (e) {
      // safe fallback
    }
  }, [isDark]);

  // Synchronize Appearance and NativeWind with activeTheme
  useEffect(() => {
    try {
      if (Appearance && typeof (Appearance as any).setColorScheme === 'function') {
        if (themeMode === 'system') {
          (Appearance as any).setColorScheme(null);
        } else {
          (Appearance as any).setColorScheme(activeTheme);
        }
      }
    } catch (e) {
      // safe fallback
    }
    try {
      if (setNWColorScheme) {
        setNWColorScheme(themeMode === 'system' ? 'system' : activeTheme);
      }
    } catch (e) {
      // safe fallback
    }
  }, [themeMode, activeTheme, setNWColorScheme]);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (err) {
      console.warn('[ThemeProvider] Failed to save theme mode:', err);
    }
  };

  const toggleTheme = async () => {
    const nextMode: ThemeMode = isDark ? 'light' : 'dark';
    await setThemeMode(nextMode);
  };

  const colors = useMemo(() => getColors(isDark), [isDark]);

  const value = useMemo(
    () => ({
      themeMode,
      theme: activeTheme,
      isDark,
      tailwindClass: activeTheme,
      colors,
      color: colors,
      getColors: (dark?: boolean) => getColors(dark !== undefined ? dark : isDark),
      setThemeMode,
      toggleTheme,
    }),
    [themeMode, activeTheme, isDark, colors]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  return context;
}
