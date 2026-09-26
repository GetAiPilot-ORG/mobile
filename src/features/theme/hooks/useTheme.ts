import { useTheme as useThemeContext } from '../context/ThemeContext';
import { ThemeContextType } from '../types';

export function useTheme(): ThemeContextType {
  return useThemeContext();
}
