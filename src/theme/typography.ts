export const typography = {
  fontFamily: {
    sans: 'System',
    mono: 'monospace',
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    black: '900' as const,
  },
  sizes: {
    xs: 10.5,
    sm: 12,
    md: 13.5,
    base: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    display: 28,
  },
  lineHeights: {
    xs: 14,
    sm: 16,
    md: 18,
    base: 20,
    lg: 23,
    xl: 26,
    xxl: 30,
    display: 34,
  },
  tracking: {
    tighter: -0.5,
    tight: -0.3,
    normal: 0,
    wide: 0.5,
    wider: 1.0,
  }
};
