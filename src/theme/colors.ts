export const colors = {
  // Core iOS Brand Tokens (GetAiPilot)
  primary: '#0084FF', // iOS System Electric Blue
  primaryHover: '#0070D8',
  primaryForeground: '#FFFFFF',
  primaryMuted: '#EBF5FF',

  // Accents & Highlights
  accent: '#0084FF',
  accentForeground: '#FFFFFF',
  accentSoft: 'rgba(0, 132, 255, 0.12)',

  // Surfaces & Layout
  background: '#F8F9FA', // Clean iOS light canvas
  backgroundDark: '#05080D', // Deep navy-black OLED dark canvas
  canvas: '#F8F9FA',
  canvasDark: '#05080D',
  surface: '#FFFFFF',
  surfaceDark: '#0A111B',
  surfaceGrouped: '#F2F4F7', // iOS Grouped tableview background
  surfaceElevated: '#FFFFFF',
  surfaceElevatedDark: '#0D1724',
  foreground: '#000000', // Crisp primary text
  foregroundDark: '#F7FAFC', // Crisp white primary text
  text: '#000000',
  textDark: '#F7FAFC',
  textSecondary: '#6B7280',
  textSecondaryDark: '#8FA3B8',

  // Cards & Modals
  card: '#FFFFFF',
  cardDark: '#0B1420',
  cardBorder: '#E5E7EB',
  cardBorderDark: '#234563',
  cardShell: '#F2F4F7',
  cardShellDark: '#0E1927',
  cardShellBorder: '#E5E7EB',
  cardShellBorderDark: '#234563',
  cardForeground: '#000000',
  cardForegroundDark: '#F7FAFC',
  border: '#E5E7EB',
  borderDark: '#1B334A',

  // Functional Colors
  destructive: '#DC2626',
  destructiveForeground: '#FFFFFF',
  destructiveSoft: 'rgba(220, 38, 38, 0.1)',

  success: '#16A34A',
  successForeground: '#FFFFFF',
  successSoft: 'rgba(22, 163, 74, 0.12)',

  warning: '#F59E0B',
  warningForeground: '#FFFFFF',
  warningSoft: 'rgba(245, 158, 11, 0.12)',

  muted: '#F2F4F7',
  mutedDark: '#0A111B',
  mutedForeground: '#6B7280',

  secondary: '#F2F4F7',
  secondaryForeground: '#000000',

  // Product Hub Specific Accents
  products: {
    whatsapp: '#25D366',
    whatsappDark: '#075E54',
    whatsappSoft: 'rgba(37, 211, 102, 0.12)',

    telegram: '#229ED9',
    telegramDark: '#0088CC',
    telegramSoft: 'rgba(34, 158, 217, 0.12)',

    voice: '#8B5CF6',
    voiceDark: '#6D28D9',
    voiceSoft: 'rgba(139, 92, 246, 0.12)',

    social: '#E1306C',
    socialDark: '#C13584',
    socialSoft: 'rgba(225, 48, 108, 0.12)',

    crm: '#F59E0B',
    crmDark: '#B45309',
    crmSoft: 'rgba(245, 158, 11, 0.12)',
  },
};




export const getColors = (isDark: boolean) => ({
  // Core Brand Tokens
  primary: isDark ? '#2F8CFF' : '#0084FF',
  primaryHover: isDark ? '#2477DA' : '#0070D8',
  primaryForeground: '#FFFFFF',
  primaryMuted: isDark ? 'rgba(47, 140, 255, 0.14)' : '#EBF5FF',

  // Accents & Highlights
  accent: isDark ? '#4BA3FF' : '#0084FF',
  accentForeground: '#FFFFFF',
  accentSoft: isDark
    ? 'rgba(75, 163, 255, 0.16)'
    : 'rgba(0, 132, 255, 0.12)',

  // Surfaces & Layout
  background: isDark ? '#05080D' : '#F8F9FA',
  canvas: isDark ? '#05080D' : '#F8F9FA',

  surface: isDark ? '#0A111B' : '#FFFFFF',
  surfaceGrouped: isDark ? '#08111C' : '#F2F4F7',
  surfaceElevated: isDark ? '#0D1724' : '#FFFFFF',

  foreground: isDark ? '#F7FAFC' : '#000000',
  text: isDark ? '#F7FAFC' : '#000000',
  textSecondary: isDark ? '#8FA3B8' : '#6B7280',

  // Cards & Modals
  card: isDark ? '#0B1420' : '#FFFFFF',
  cardBorder: isDark ? '#234563' : '#E5E7EB',

  cardShell: isDark ? '#0E1927' : '#F2F4F7',
  cardShellBorder: isDark ? '#234563' : '#E5E7EB',

  cardForeground: isDark ? '#F7FAFC' : '#000000',

  border: isDark ? '#1B334A' : '#E5E7EB',
  divider: isDark ? '#162B3F' : '#E5E7EB',

  // Interaction
  focusRing: isDark ? 'rgba(75, 163, 255, 0.42)' : 'rgba(0, 132, 255, 0.3)',
  selectedBorder: isDark ? '#3E9BFF' : '#0084FF',
  selectedSurface: isDark ? 'rgba(47, 140, 255, 0.10)' : 'rgba(0, 132, 255, 0.08)',

  // Functional Colors
  destructive: isDark ? '#FB7185' : '#DC2626',
  destructiveForeground: '#FFFFFF',
  destructiveSoft: isDark
    ? 'rgba(251, 113, 133, 0.14)'
    : 'rgba(220, 38, 38, 0.1)',

  success: isDark ? '#34D399' : '#16A34A',
  successForeground: '#FFFFFF',
  successSoft: isDark
    ? 'rgba(52, 211, 153, 0.14)'
    : 'rgba(22, 163, 74, 0.12)',

  warning: isDark ? '#FBBF24' : '#F59E0B',
  warningForeground: '#FFFFFF',
  warningSoft: isDark
    ? 'rgba(251, 191, 36, 0.14)'
    : 'rgba(245, 158, 11, 0.12)',

  muted: isDark ? '#0A111B' : '#F2F4F7',

  mutedForeground: isDark ? '#8FA3B8' : '#6B7280',
  secondaryForeground: isDark ? '#B7C5D3' : '#000000',

  secondary: isDark ? '#101C2A' : '#F2F4F7',

  // Optional Neutrals
  overlay: isDark ? 'rgba(2, 8, 18, 0.72)' : 'rgba(0, 0, 0, 0.45)',
  pressedOverlay: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
  disabledSurface: isDark ? '#0B1119' : '#F2F4F7',
  disabledText: isDark ? '#55687B' : '#9CA3AF',

  // Product Hub Specific Accents
  products: {
    whatsapp: '#25D366',
    whatsappDark: '#075E54',
    whatsappSoft: isDark
      ? 'rgba(37, 211, 102, 0.16)'
      : 'rgba(37, 211, 102, 0.12)',

    telegram: '#229ED9',
    telegramDark: '#0088CC',
    telegramSoft: isDark
      ? 'rgba(34, 158, 217, 0.16)'
      : 'rgba(34, 158, 217, 0.12)',

    voice: '#8B5CF6',
    voiceDark: '#6D28D9',
    voiceSoft: isDark
      ? 'rgba(139, 92, 246, 0.16)'
      : 'rgba(139, 92, 246, 0.12)',

    social: '#E1306C',
    socialDark: '#C13584',
    socialSoft: isDark
      ? 'rgba(225, 48, 108, 0.16)'
      : 'rgba(225, 48, 108, 0.12)',

    crm: '#F59E0B',
    crmDark: '#B45309',
    crmSoft: isDark
      ? 'rgba(245, 158, 11, 0.16)'
      : 'rgba(245, 158, 11, 0.12)',
  },
});

export type AppColors = ReturnType<typeof getColors>;
