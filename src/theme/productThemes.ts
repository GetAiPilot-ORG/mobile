import { colors } from './colors';

export interface ProductTheme {
  id: string;
  name: string;
  tagline: string;
  primary: string;
  dark: string;
  soft: string;
  border: string;
  badge: string;
  iconBg: string;
  gradient: [string, string];
}

/**
 * Product-specific design tokens mapped directly from getaipilot.in/src/config/navigation.ts
 */
export const productThemes: Record<string, ProductTheme> = {
  telegram: {
    id: 'telegram',
    name: 'GAP Telegram',
    tagline: 'Auto-forwarding, Auto-Approve, Reactions & Sub Manager Paywalls',
    primary: colors.products.telegram,
    dark: colors.products.telegramDark,
    soft: colors.products.telegramSoft,
    border: 'rgba(34, 158, 217, 0.25)',
    badge: '#0284C7',
    iconBg: '#E0F2FE',
    gradient: ['#0284C7', '#0369A1'],
  },
  whatsapp: {
    id: 'whatsapp',
    name: 'GAP WhatsApp',
    tagline: 'Multi-inbox broadcast, automated responses & contact synchronization',
    primary: colors.products.whatsapp,
    dark: colors.products.whatsappDark,
    soft: colors.products.whatsappSoft,
    border: 'rgba(37, 211, 102, 0.25)',
    badge: '#16A34A',
    iconBg: '#DCFCE7',
    gradient: ['#16A34A', '#15803D'],
  },
  crm: {
    id: 'crm',
    name: 'GAP Smart CRM',
    tagline: 'Multi-tenant pipelines, lead scoring & team organization management',
    primary: colors.products.crm,
    dark: colors.products.crmDark,
    soft: colors.products.crmSoft,
    border: 'rgba(245, 158, 11, 0.25)',
    badge: '#D97706',
    iconBg: '#FEF3C7',
    gradient: ['#D97706', '#B45309'],
  },
  voice: {
    id: 'voice',
    name: 'GAP Voice Pilot',
    tagline: 'AI Calling agents, automated voice dialers & wallet call logs',
    primary: colors.products.voice,
    dark: colors.products.voiceDark,
    soft: colors.products.voiceSoft,
    border: 'rgba(139, 92, 246, 0.25)',
    badge: '#7C3AED',
    iconBg: '#EDE9FE',
    gradient: ['#7C3AED', '#6D28D9'],
  },
  social: {
    id: 'social',
    name: 'GAP Social Pilot',
    tagline: 'Multi-platform social scheduler & cross-channel content distribution',
    primary: colors.products.social,
    dark: colors.products.socialDark,
    soft: colors.products.socialSoft,
    border: 'rgba(225, 48, 108, 0.25)',
    badge: '#DB2777',
    iconBg: '#FCE7F3',
    gradient: ['#DB2777', '#BE185D'],
  },
  tools: {
    id: 'tools',
    name: 'Free Growth Tools',
    tagline: 'QR generator, short links, AI forms, bio pages & landing templates',
    primary: colors.accent,
    dark: colors.primary,
    soft: colors.accentSoft,
    border: 'rgba(22, 184, 130, 0.25)',
    badge: '#059669',
    iconBg: '#D1FAE5',
    gradient: ['#059669', '#047857'],
  },
};
