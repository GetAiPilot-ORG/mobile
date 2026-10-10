
export const colors = {
  // Brand
  primary: '#B044F2',
  primaryHover: '#9635D6',
  primaryForeground: '#FFFFFF',
  primaryMuted: 'rgba(176, 68, 242, 0.10)',

  brandPink: '#FF4D9D',
  brandPurple: '#B044F2',
  brandBlue: '#398BFF',

  accent: '#D83DCE',
  accentForeground: '#FFFFFF',
  accentSoft: 'rgba(216, 61, 206, 0.10)',

  // Premium backgrounds
  background: '#F7F5F2',
  backgroundDark: '#11100F',
  canvas: '#F7F5F2',
  canvasDark: '#11100F',

  // Surfaces
  surface: '#FDFCFB',
  surfaceDark: '#191715',
  surfaceGrouped: '#F0EDE8',
  surfaceElevated: '#FFFFFF',
  surfaceElevatedDark: '#26221F',

  // Text
  foreground: '#211E1A',
  foregroundDark: '#F5F1EB',
  text: '#211E1A',
  textDark: '#F5F1EB',
  textSecondary: '#77716A',
  textSecondaryDark: '#B6ADA3',

  // Cards
  card: '#FDFCFB',
  cardDark: '#191715',
  cardBorder: '#E7E2DC',
  cardBorderDark: '#39332E',

  cardShell: '#F0EDE8',
  cardShellDark: '#201D1A',
  cardShellBorder: '#E7E2DC',
  cardShellBorderDark: '#39332E',

  cardForeground: '#211E1A',
  cardForegroundDark: '#F5F1EB',

  border: '#E7E2DC',
  borderDark: '#39332E',

  // Functional colors
  destructive: '#D94352',
  destructiveForeground: '#FFFFFF',
  destructiveSoft: 'rgba(217, 67, 82, 0.10)',

  success: '#16845B',
  successForeground: '#FFFFFF',
  successSoft: 'rgba(22, 132, 91, 0.10)',

  warning: '#B77916',
  warningForeground: '#FFFFFF',
  warningSoft: 'rgba(183, 121, 22, 0.12)',

  muted: '#F0EDE8',
  mutedDark: '#201D1A',
  mutedForeground: '#77716A',

  secondary: '#F0EDE8',
  secondaryForeground: '#211E1A',

  // Product Hub
  products: {
    whatsapp: '#25D366',
    whatsappDark: '#075E54',
    whatsappSoft: 'rgba(37, 211, 102, 0.10)',

    telegram: '#229ED9',
    telegramDark: '#0088CC',
    telegramSoft: 'rgba(34, 158, 217, 0.10)',

    voice: '#A855F7',
    voiceDark: '#7E22CE',
    voiceSoft: 'rgba(168, 85, 247, 0.10)',

    social: '#E1306C',
    socialDark: '#C13584',
    socialSoft: 'rgba(225, 48, 108, 0.10)',

    crm: '#F59E0B',
    crmDark: '#B45309',
    crmSoft: 'rgba(245, 158, 11, 0.10)',
  },
};

export const getColors = (isDark: boolean) => ({
  // Brand
  primary: isDark ? '#C56BFF' : '#B044F2',
  primaryHover: isDark ? '#D18AFF' : '#9635D6',
  primaryForeground: '#FFFFFF',
  primaryMuted: isDark
    ? 'rgba(197, 107, 255, 0.16)'
    : 'rgba(176, 68, 242, 0.10)',

  brandPink: '#FF4D9D',
  brandPurple: isDark ? '#C56BFF' : '#B044F2',
  brandBlue: isDark ? '#65A5FF' : '#398BFF',

  accent: isDark ? '#D66BDF' : '#D83DCE',
  accentForeground: '#FFFFFF',
  accentSoft: isDark
    ? 'rgba(214, 107, 223, 0.16)'
    : 'rgba(216, 61, 206, 0.10)',

  // Backgrounds
  background: isDark ? '#11100F' : '#F7F5F2',
  canvas: isDark ? '#11100F' : '#F7F5F2',

  // Surfaces
  surface: isDark ? '#191715' : '#FDFCFB',
  surfaceGrouped: isDark ? '#201D1A' : '#F0EDE8',
  surfaceElevated: isDark ? '#26221F' : '#FFFFFF',

  // Text
  foreground: isDark ? '#F5F1EB' : '#211E1A',
  text: isDark ? '#F5F1EB' : '#211E1A',
  textSecondary: isDark ? '#B6ADA3' : '#77716A',

  // Cards
  card: isDark ? '#191715' : '#FDFCFB',
  cardBorder: isDark ? '#39332E' : '#E7E2DC',

  cardShell: isDark ? '#201D1A' : '#F0EDE8',
  cardShellBorder: isDark ? '#39332E' : '#E7E2DC',

  cardForeground: isDark ? '#F5F1EB' : '#211E1A',

  border: isDark ? '#39332E' : '#E7E2DC',
  divider: isDark ? '#302B26' : '#EAE5DF',

  // Interaction
  focusRing: isDark
    ? 'rgba(197, 107, 255, 0.45)'
    : 'rgba(176, 68, 242, 0.30)',

  selectedBorder: isDark ? '#C56BFF' : '#B044F2',
  selectedSurface: isDark
    ? 'rgba(197, 107, 255, 0.14)'
    : 'rgba(176, 68, 242, 0.07)',

  // Functional colors
  destructive: isDark ? '#FF7185' : '#D94352',
  destructiveForeground: '#FFFFFF',
  destructiveSoft: isDark
    ? 'rgba(255, 113, 133, 0.16)'
    : 'rgba(217, 67, 82, 0.10)',

  success: isDark ? '#34D399' : '#16845B',
  successForeground: '#FFFFFF',
  successSoft: isDark
    ? 'rgba(52, 211, 153, 0.16)'
    : 'rgba(22, 132, 91, 0.10)',

  warning: isDark ? '#FBBF24' : '#B77916',
  warningForeground: isDark ? '#211E1A' : '#FFFFFF',
  warningSoft: isDark
    ? 'rgba(251, 191, 36, 0.16)'
    : 'rgba(183, 121, 22, 0.12)',

  muted: isDark ? '#201D1A' : '#F0EDE8',
  mutedForeground: isDark ? '#B6ADA3' : '#77716A',

  secondary: isDark ? '#201D1A' : '#F0EDE8',
  secondaryForeground: isDark ? '#F5F1EB' : '#211E1A',

  // Overlays and disabled states
  overlay: isDark
    ? 'rgba(0, 0, 0, 0.72)'
    : 'rgba(33, 30, 26, 0.35)',

  pressedOverlay: isDark
    ? 'rgba(255, 255, 255, 0.06)'
    : 'rgba(33, 30, 26, 0.04)',

  disabledSurface: isDark ? '#191715' : '#F0EDE8',
  disabledText: isDark ? '#898078' : '#A49C93',

  // Product Hub
  products: {
    whatsapp: '#25D366',
    whatsappDark: '#075E54',
    whatsappSoft: isDark
      ? 'rgba(37, 211, 102, 0.16)'
      : 'rgba(37, 211, 102, 0.10)',

    telegram: '#229ED9',
    telegramDark: '#0088CC',
    telegramSoft: isDark
      ? 'rgba(34, 158, 217, 0.16)'
      : 'rgba(34, 158, 217, 0.10)',

    voice: '#A855F7',
    voiceDark: '#7E22CE',
    voiceSoft: isDark
      ? 'rgba(168, 85, 247, 0.16)'
      : 'rgba(168, 85, 247, 0.10)',

    social: '#E1306C',
    socialDark: '#C13584',
    socialSoft: isDark
      ? 'rgba(225, 48, 108, 0.16)'
      : 'rgba(225, 48, 108, 0.10)',

    crm: '#F59E0B',
    crmDark: '#B45309',
    crmSoft: isDark
      ? 'rgba(245, 158, 11, 0.16)'
      : 'rgba(245, 158, 11, 0.10)',
  },
});

export type AppColors = ReturnType<typeof getColors>;