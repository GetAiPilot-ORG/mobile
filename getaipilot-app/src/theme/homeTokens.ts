/**
 * GetAiPilot Home Screen Design Tokens
 * Strictly preserves the authentic glassmorphic, 3D aesthetic,
 * while standardizing spacing, radii, color gradients, and WCAG AA contrast.
 */

export const HOME_SPACING = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const HOME_RADIUS = {
  sm: 12,
  medium: 16, // small cards
  large: 24,  // large cards & hero
  pill: 9999,
} as const;

export const HOME_CONTRAST_COLORS = {
  dark: {
    textPrimary: '#FFFFFF',
    textSecondary: '#C4BEDB', // High contrast WCAG AA (>5:1 on dark backgrounds)
    textMuted: '#9E97B5',
    cardBorder: 'rgba(255, 255, 255, 0.12)',
    glassSpecular: 'rgba(255, 255, 255, 0.14)',
  },
  light: {
    textPrimary: '#1A1726',
    textSecondary: '#4A4658', // High contrast WCAG AA (>5:1 on light backgrounds)
    textMuted: '#6B6678',
    cardBorder: 'rgba(0, 0, 0, 0.08)',
    glassSpecular: 'rgba(255, 255, 255, 0.75)',
  },
} as const;

export const CATEGORY_GRADIENTS = {
  // AI Products
  telegram: {
    light: ['#E7F7FC', '#CEF0FA'] as const,
    dark: ['#0E2A38', '#071A24'] as const,
    accent: '#0284C7',
    borderLight: 'rgba(2, 132, 199, 0.25)',
    borderDark: 'rgba(56, 189, 248, 0.32)',
    shadow: '#0284C7',
  },
  whatsapp: {
    light: ['#EDFDF5', '#D1FAE5'] as const,
    dark: ['#062E1F', '#031C13'] as const,
    accent: '#10B981',
    borderLight: 'rgba(16, 185, 129, 0.25)',
    borderDark: 'rgba(52, 211, 153, 0.32)',
    shadow: '#10B981',
  },
  social: {
    light: ['#FDF2F8', '#FCE7F3'] as const,
    dark: ['#381128', '#230818'] as const,
    accent: '#EC4899',
    borderLight: 'rgba(236, 72, 153, 0.25)',
    borderDark: 'rgba(244, 114, 182, 0.32)',
    shadow: '#EC4899',
  },
  voice: {
    light: ['#F5F3FF', '#EDE9FE'] as const,
    dark: ['#28164C', '#180B32'] as const,
    accent: '#8B5CF6',
    borderLight: 'rgba(139, 92, 246, 0.25)',
    borderDark: 'rgba(167, 139, 250, 0.32)',
    shadow: '#8B5CF6',
  },
  crm: {
    light: ['#FFFBEB', '#FEF3C7'] as const,
    dark: ['#3A2209', '#241404'] as const,
    accent: '#F59E0B',
    borderLight: 'rgba(245, 158, 11, 0.25)',
    borderDark: 'rgba(251, 191, 36, 0.32)',
    shadow: '#F59E0B',
  },

  // Stat Cards (Pages, Forms, Links)
  pages: {
    light: ['#F5EFFF', '#E7D8FD'] as const,
    dark: ['#2C1A48', '#1B0F2E'] as const,
    accentLight: '#7C3AED',
    accentDark: '#C084FC',
    borderLight: 'rgba(168, 85, 247, 0.25)',
    borderDark: 'rgba(192, 132, 252, 0.32)',
    shadow: '#8B5CF6',
  },
  forms: {
    light: ['#FFF4EB', '#FDE3CE'] as const,
    dark: ['#3D2214', '#24130A'] as const,
    accentLight: '#D97706',
    accentDark: '#FBBF24',
    borderLight: 'rgba(245, 158, 11, 0.25)',
    borderDark: 'rgba(251, 191, 36, 0.32)',
    shadow: '#F59E0B',
  },
  links: {
    light: ['#E7F7FC', '#CEF0FA'] as const,
    dark: ['#10303D', '#0A1D25'] as const,
    accentLight: '#0284C7',
    accentDark: '#38BDF8',
    borderLight: 'rgba(6, 182, 212, 0.25)',
    borderDark: 'rgba(56, 189, 248, 0.32)',
    shadow: '#06B6D4',
  },

  // Free Tools
  quickForms: {
    light: ['#ECFDF5', '#A7F3D0'] as const,
    dark: ['#063323', '#031F15'] as const,
    accent: '#059669',
  },
  speechToText: {
    light: ['#FAF5FF', '#E9D5FF'] as const,
    dark: ['#2E1065', '#1B093D'] as const,
    accent: '#7C3AED',
  },
  qrCode: {
    light: ['#F3E8FF', '#E9D5FF'] as const,
    dark: ['#281442', '#180B28'] as const,
    accent: '#7E22CE',
  },
  linkShortener: {
    light: ['#E0F2FE', '#BAE6FD'] as const,
    dark: ['#082F49', '#041C2C'] as const,
    accent: '#0284C7',
  },

  // Bottom Promos
  inviteFriends: {
    light: ['#FAF5FF', '#F3E8FF', '#E9D5FF'] as const,
    dark: ['#2A1347', '#1D0C35', '#120524'] as const,
    accent: '#A855F7',
    borderLight: 'rgba(147, 51, 234, 0.40)',
    borderDark: 'rgba(192, 132, 252, 0.48)',
    shadow: '#8B5CF6',
  },
  security: {
    light: ['#F0FDF4', '#DCFCE7', '#BBF7D0'] as const,
    dark: ['#07281D', '#031A12', '#010E09'] as const,
    accent: '#10B981',
    borderLight: 'rgba(16, 185, 129, 0.28)',
    borderDark: 'rgba(52, 211, 153, 0.32)',
    shadow: '#10B981',
  },
} as const;

