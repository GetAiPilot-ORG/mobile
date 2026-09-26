import { useTheme } from '../context/ThemeContext';

export function useColorScheme(): 'light' | 'dark' {
  const { theme } = useTheme();
  return theme;
}
