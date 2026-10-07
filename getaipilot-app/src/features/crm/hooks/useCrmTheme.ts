import { useTheme, useProductTheme, ProductTheme, ThemeContextType } from '@/features/theme';

export interface CrmThemeHookResult extends ThemeContextType {
  crmTheme: ProductTheme;
  accentColor: string;
  accentSoft: string;
  accentBorder: string;
  accentBadge: string;
  gradient: [string, string];
}

export function useCrmTheme(): CrmThemeHookResult {
  const themeContext = useTheme();
  const crmTheme = useProductTheme('crm');

  return {
    ...themeContext,
    crmTheme,
    accentColor: crmTheme.primary,
    accentSoft: crmTheme.soft,
    accentBorder: crmTheme.border,
    accentBadge: crmTheme.badge,
    gradient: crmTheme.gradient,
  };
}
