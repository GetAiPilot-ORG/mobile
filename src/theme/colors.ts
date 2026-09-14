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
  backgroundDark: '#000000', // Deep iOS OLED dark canvas
  canvas: '#F8F9FA',
  canvasDark: '#000000',
  surface: '#FFFFFF',
  surfaceDark: '#1C1C1E',
  surfaceGrouped: '#F2F4F7', // iOS Grouped tableview background
  surfaceElevated: '#FFFFFF',
  surfaceElevatedDark: '#1C1C1E',
  foreground: '#000000', // Crisp primary text
  foregroundDark: '#FFFFFF', // Clean white primary text

  // Cards & Modals
  card: '#FFFFFF',
  cardDark: '#1C1C1E',
  cardBorder: '#E5E7EB',
  cardBorderDark: '#2C2C2E',
  cardShell: '#F2F4F7',
  cardShellDark: '#1C1C1E',
  cardShellBorder: '#E5E7EB',
  cardShellBorderDark: '#2C2C2E',
  cardForeground: '#000000',
  cardForegroundDark: '#FFFFFF',
  border: '#E5E7EB',
  borderDark: '#2C2C2E',

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
  mutedDark: '#1C1C1E',
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
  primary: '#0084FF',
  primaryHover: '#0070D8',
  primaryForeground: '#FFFFFF',
  primaryMuted: isDark ? '#0B2942' : '#EBF5FF',

  // Accents & Highlights
  accent: '#0084FF',
  accentForeground: '#FFFFFF',
  accentSoft: isDark
    ? 'rgba(0, 132, 255, 0.18)'
    : 'rgba(0, 132, 255, 0.12)',

  // Surfaces & Layout
  background: isDark ? '#000000' : '#F8F9FA',
  canvas: isDark ? '#000000' : '#F8F9FA',

  surface: isDark ? '#1C1C1E' : '#FFFFFF',
  surfaceGrouped: isDark ? '#1C1C1E' : '#F2F4F7',
  surfaceElevated: isDark ? '#1C1C1E' : '#FFFFFF',

  foreground: isDark ? '#FFFFFF' : '#000000',

  // Cards & Modals
  card: isDark ? '#1C1C1E' : '#FFFFFF',
  cardBorder: isDark ? '#2C2C2E' : '#E5E7EB',

  cardShell: isDark ? '#1C1C1E' : '#F2F4F7',
  cardShellBorder: isDark ? '#2C2C2E' : '#E5E7EB',

  cardForeground: isDark ? '#FFFFFF' : '#000000',

  border: isDark ? '#2C2C2E' : '#E5E7EB',

  // Functional Colors
  destructive: '#DC2626',
  destructiveForeground: '#FFFFFF',
  destructiveSoft: isDark
    ? 'rgba(220, 38, 38, 0.18)'
    : 'rgba(220, 38, 38, 0.1)',

  success: '#16A34A',
  successForeground: '#FFFFFF',
  successSoft: isDark
    ? 'rgba(22, 163, 74, 0.18)'
    : 'rgba(22, 163, 74, 0.12)',

  warning: '#F59E0B',
  warningForeground: '#FFFFFF',
  warningSoft: isDark
    ? 'rgba(245, 158, 11, 0.18)'
    : 'rgba(245, 158, 11, 0.12)',

  muted: isDark ? '#1C1C1E' : '#F2F4F7',

  mutedForeground: isDark ? '#98989D' : '#6B7280',

  secondary: isDark ? '#1C1C1E' : '#F2F4F7',
  secondaryForeground: isDark ? '#FFFFFF' : '#000000',

  // Product Hub Specific Accents
  products: {
    whatsapp: '#25D366',
    whatsappDark: '#075E54',
    whatsappSoft: isDark
      ? 'rgba(37, 211, 102, 0.18)'
      : 'rgba(37, 211, 102, 0.12)',

    telegram: '#229ED9',
    telegramDark: '#0088CC',
    telegramSoft: isDark
      ? 'rgba(34, 158, 217, 0.18)'
      : 'rgba(34, 158, 217, 0.12)',

    voice: '#8B5CF6',
    voiceDark: '#6D28D9',
    voiceSoft: isDark
      ? 'rgba(139, 92, 246, 0.18)'
      : 'rgba(139, 92, 246, 0.12)',

    social: '#E1306C',
    socialDark: '#C13584',
    socialSoft: isDark
      ? 'rgba(225, 48, 108, 0.18)'
      : 'rgba(225, 48, 108, 0.12)',

    crm: '#F59E0B',
    crmDark: '#B45309',
    crmSoft: isDark
      ? 'rgba(245, 158, 11, 0.18)'
      : 'rgba(245, 158, 11, 0.12)',
  },
});

export type AppColors = ReturnType<typeof getColors>;