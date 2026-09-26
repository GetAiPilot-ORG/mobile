import { Appearance } from 'react-native';
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
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

