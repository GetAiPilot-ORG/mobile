import { AppColors } from '../constants/colors';
import { ProductTheme } from '../constants/productThemes';

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

export type { ProductTheme, AppColors };
