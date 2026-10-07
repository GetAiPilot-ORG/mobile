import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getProductThemes, ProductTheme } from '../constants/productThemes';

export function useProductTheme(productKey: string): ProductTheme {
  const { isDark } = useTheme();

  return useMemo(() => {
    const allThemes = getProductThemes(isDark);
    const key = productKey.toLowerCase();
    if (allThemes[key]) {
      return allThemes[key];
    }
    return allThemes.tools;
  }, [productKey, isDark]);
}
