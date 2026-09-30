import { useTheme } from '../contexts/ThemeContext';

export function useColorScheme(): 'light' | 'dark' {
  try {
    const theme = useTheme();
    if (theme && theme.theme) {
      return theme.theme;
    }
  } catch (e) {
    // fallback if used outside provider
  }
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

