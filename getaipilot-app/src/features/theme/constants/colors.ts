export const getColors = (isDark: boolean = false) => ({
  // Soft pastel mobile palette
  galleryWhite: "#ffffff",
  studioMist: "#f5f5f7",
  paperFrost: "#fafafc",
  hairlineSilver: "#d6d6d6",
  controlGray: "#e6e6e8",
  ink: "#1d1d1f",
  slate: "#696575",
  steel: "#86868b",
  appleBlue: "#0066cc",
  pricingBlue: "#0071e3",
  launchOrange: "#b64400",

  // BRAND & ACCENT
  primary: isDark ? "#B9A8FF" : "#17171C",
  primaryHover: isDark ? "#CBBEFF" : "#6C55C5",
  primaryPressed: isDark ? "#A18BEF" : "#55419F",
  primaryForeground: isDark ? "#202027" : "#FFFFFF",
  primaryMuted: isDark ? "rgba(185, 168, 255, 0.16)" : "#E9E3FA",

  accent: isDark ? "#B9A8FF" : "#6C55C5",
  accentHover: isDark ? "#CBBEFF" : "#55419F",
  accentForeground: isDark ? "#202027" : "#FFFFFF",
  accentSoft: isDark
    ? "rgba(185, 168, 255, 0.16)"
    : "#E9E3FA",

  // BACKGROUNDS & CANVAS
  background: isDark ? "#14131B" : "#F5F3FB",
  canvas: isDark ? "#14131B" : "#F5F3FB",
  backgroundSecondary: isDark ? "#1C1A25" : "#F0EEF8",
  backgroundTertiary: isDark ? "#252230" : "#F8F7FC",

  backgroundDark: "#14131B",
  backgroundLight: "#FFFFFF",
  canvasDark: "#14131B",
  canvasLight: "#FFFFFF",

  // SURFACES (Gallery White on Studio Mist)
  surface: isDark ? "#1C1A25" : "#FFFFFF",
  surfaceSecondary: isDark ? "#252230" : "#F0EEF8",
  surfaceTertiary: isDark ? "#2C2839" : "#F8F7FC",
  surfaceGrouped: isDark ? "#252230" : "#F0EEF8",
  surfaceElevated: isDark ? "#2C2839" : "#FFFFFF",
  surfaceHover: isDark ? "#1F1F23" : "#F0EEF8",
  surfacePressed: isDark ? "#26262B" : "#E5E0F1",
  surfaceDark: "#1C1A25",
  surfaceLight: "#FFFFFF",

  // TYPOGRAPHY (Ink, Slate, Steel)
  text: isDark ? "#F0EEF8" : "#202027",
  mutedText: isDark ? "#ACA6BB" : "#696575",
  foreground: isDark ? "#F0EEF8" : "#202027",
  foregroundDark: "#F0EEF8",
  foregroundLight: "#202027",
  textPrimary: isDark ? "#F0EEF8" : "#202027",
  textSecondary: isDark ? "#ACA6BB" : "#696575",
  textTertiary: isDark ? "#A39CB2" : "#716B7C",
  textMuted: isDark ? "#ACA6BB" : "#696575",
  textDisabled: isDark ? "#555558" : "#716B7C",
  textInverse: isDark ? "#202027" : "#FFFFFF",

  // CARDS (28px radius, flat & shadowless, hairline dividers)
  card: isDark ? "#1C1A25" : "#FFFFFF",
  cardBackground: isDark ? "#1C1A25" : "#FFFFFF",
  cardDark: "#1C1A25",
  cardLight: "#FFFFFF",
  cardForeground: isDark ? "#F0EEF8" : "#202027",
  cardBorder: isDark ? "#2C2C2E" : "#E9E6F2",
  cardBorderDark: "#2C2C2E",
  cardBorderLight: "#E9E6F2",
  cardHover: isDark ? "#2C2839" : "#F8F7FC",
  cardShell: isDark ? "#252230" : "#F0EEF8",
  cardShellBorder: isDark ? "#2C2C2E" : "#E5E0F1",

  // BORDERS & HAIRLINES
  border: isDark ? "#2C2C2E" : "#E9E6F2",
  borderDark: "#2C2C2E",
  borderLight: isDark ? "#1C1C1E" : "#E5E0F1",
  borderStrong: isDark ? "#3A3A3C" : "#716B7C",
  divider: isDark ? "#1C1C1E" : "#E9E6F2",
  focusBorder: isDark ? "#B9A8FF" : "#6C55C5",

  // INPUTS (980px pill radius)
  input: isDark ? "#252230" : "#F8F7FC",
  inputBackground: isDark ? "#252230" : "#F8F7FC",
  inputForeground: isDark ? "#F0EEF8" : "#202027",
  inputPlaceholder: isDark ? "#ACA6BB" : "#716B7C",
  inputBorder: isDark ? "#3A3A3C" : "#E9E6F2",
  inputBorderFocus: isDark ? "#B9A8FF" : "#6C55C5",
  inputDisabled: isDark ? "#1C1C1E" : "#F0EEF8",
  inputDisabledText: isDark ? "#555558" : "#716B7C",

  // BUTTONS (9999px pills, Pricing Blue or transparent outline)
  buttonPrimary: isDark ? "#B9A8FF" : "#17171C",
  buttonPrimaryHover: isDark ? "#CBBEFF" : "#6C55C5",
  buttonPrimaryPressed: isDark ? "#A18BEF" : "#55419F",
  buttonPrimaryForeground: isDark ? "#202027" : "#FFFFFF",

  buttonSecondary: isDark ? "#1C1C1E" : "#F0EEF8",
  buttonSecondaryHover: isDark ? "#2C2C2E" : "#E5E0F1",
  buttonSecondaryPressed: isDark ? "#3A3A3C" : "#E9E6F2",
  buttonSecondaryForeground: isDark ? "#F0EEF8" : "#202027",

  buttonGhost: "transparent",
  buttonGhostHover: isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(29, 29, 31, 0.04)",
  buttonGhostPressed: isDark
    ? "rgba(255, 255, 255, 0.12)"
    : "rgba(29, 29, 31, 0.08)",
  buttonGhostForeground: isDark ? "#F0EEF8" : "#202027",

  buttonDisabled: isDark ? "#1C1C1E" : "#E5E0F1",
  buttonDisabledForeground: isDark ? "#555558" : "#716B7C",

  // STATUS & LAUNCH TOKENS
  launch: "#B64400",
  launchForeground: "#FFFFFF",
  launchSoft: "rgba(182, 68, 0, 0.10)",

  success: isDark ? "#30D158" : "#16A34A",
  successHover: isDark ? "#5AE37C" : "#15803D",
  successForeground: "#FFFFFF",
  successSoft: isDark
    ? "rgba(48, 209, 88, 0.16)"
    : "rgba(22, 163, 74, 0.10)",

  warning: isDark ? "#FF9F0A" : "#B64400",
  warningHover: isDark ? "#FFB340" : "#943700",
  warningForeground: isDark ? "#202027" : "#FFFFFF",
  warningSoft: isDark
    ? "rgba(255, 159, 10, 0.16)"
    : "rgba(182, 68, 0, 0.10)",

  destructive: isDark ? "#FF453A" : "#D70015",
  destructiveHover: isDark ? "#FF6961" : "#B50012",
  destructivePressed: isDark ? "#D32F2F" : "#8E000F",
  destructiveForeground: "#FFFFFF",
  destructiveSoft: isDark
    ? "rgba(255, 69, 58, 0.16)"
    : "rgba(215, 0, 21, 0.10)",

  info: isDark ? "#B9A8FF" : "#6C55C5",
  infoHover: isDark ? "#CBBEFF" : "#55419F",
  infoForeground: isDark ? "#202027" : "#FFFFFF",
  infoSoft: isDark
    ? "rgba(185, 168, 255, 0.16)"
    : "rgba(0, 102, 204, 0.10)",

  muted: isDark ? "#252230" : "#F0EEF8",
  mutedHover: isDark ? "#1C1C1E" : "#E5E0F1",
  mutedForeground: isDark ? "#ACA6BB" : "#696575",

  secondary: isDark ? "#252230" : "#F0EEF8",
  secondaryHover: isDark ? "#1C1C1E" : "#E5E0F1",
  secondaryForeground: isDark ? "#F0EEF8" : "#202027",

  // LINKS & TABS (Apple Blue #6C55C5)
  link: isDark ? "#B9A8FF" : "#6C55C5",
  linkHover: isDark ? "#CBBEFF" : "#17171C",
  linkVisited: isDark ? "#A370F7" : "#681DA8",

  tabBackground: isDark ? "#1C1A25" : "#F8F7FC",
  tabActive: isDark ? "#B9A8FF" : "#6C55C5",
  tabActiveBackground: isDark
    ? "rgba(185, 168, 255, 0.14)"
    : "#E9E3FA",
  tabInactive: isDark ? "#ACA6BB" : "#696575",
  tabBorder: isDark ? "#2C2C2E" : "#E9E6F2",

  // NAVIGATION (20px container radius, 44px height)
  navigationBackground: isDark ? "#1C1A25" : "#FFFFFF",
  navigationBorder: isDark ? "#2C2C2E" : "#E9E6F2",
  navigationActive: isDark ? "#B9A8FF" : "#6C55C5",
  navigationInactive: isDark ? "#ACA6BB" : "#696575",

  badgePrimary: isDark
    ? "rgba(185, 168, 255, 0.16)"
    : "#E9E3FA",
  badgePrimaryText: isDark ? "#CBBEFF" : "#17171C",

  badgeSuccess: isDark
    ? "rgba(48, 209, 88, 0.16)"
    : "rgba(22, 163, 74, 0.10)",
  badgeSuccessText: isDark ? "#5AE37C" : "#15803D",

  badgeWarning: isDark
    ? "rgba(255, 159, 10, 0.16)"
    : "rgba(182, 68, 0, 0.10)",
  badgeWarningText: isDark ? "#FFB340" : "#B64400",

  badgeDanger: isDark
    ? "rgba(255, 69, 58, 0.16)"
    : "rgba(215, 0, 21, 0.10)",
  badgeDangerText: isDark ? "#FF6961" : "#D70015",

  badgeNeutral: isDark ? "#1C1C1E" : "#F0EEF8",
  badgeNeutralText: isDark ? "#ACA6BB" : "#696575",

  // OVERLAYS & MODALS
  overlay: isDark
    ? "rgba(0, 0, 0, 0.78)"
    : "rgba(29, 29, 31, 0.35)",
  modalBackground: isDark ? "#1C1A25" : "#FFFFFF",
  modalBorder: isDark ? "#2C2C2E" : "#E9E6F2",
  modalTitle: isDark ? "#F0EEF8" : "#202027",
  modalDescription: isDark ? "#ACA6BB" : "#696575",

  skeleton: isDark ? "#1C1C1E" : "#E5E0F1",
  skeletonHighlight: isDark ? "#2C2C2E" : "#F0EEF8",

  // ICONS
  iconPrimary: isDark ? "#F0EEF8" : "#202027",
  iconSecondary: isDark ? "#ACA6BB" : "#696575",
  iconMuted: isDark ? "#A39CB2" : "#716B7C",
  iconActive: isDark ? "#B9A8FF" : "#6C55C5",
  iconSuccess: isDark ? "#30D158" : "#16A34A",
  iconWarning: isDark ? "#FF9F0A" : "#B64400",
  iconDanger: isDark ? "#FF453A" : "#D70015",
  iconInfo: isDark ? "#B9A8FF" : "#6C55C5",

  online: isDark ? "#30D158" : "#16A34A",
  offline: isDark ? "#A39CB2" : "#716B7C",
  busy: isDark ? "#FF9F0A" : "#B64400",
  error: isDark ? "#FF453A" : "#D70015",

  selection: isDark
    ? "rgba(185, 168, 255, 0.25)"
    : "#E9E3FA",
  ripple: isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(29, 29, 31, 0.05)",
  shadow: isDark
    ? "rgba(0, 0, 0, 0.40)"
    : "rgba(0, 0, 0, 0.04)",
  transparent: "transparent",

  // PRODUCT ACCENTS
  products: {
    whatsapp: "#25D366",
    whatsappDark: "#075E54",
    whatsappSoft: isDark
      ? "rgba(37, 211, 102, 0.16)"
      : "rgba(37, 211, 102, 0.10)",

    telegram: "#229ED9",
    telegramDark: "#0088CC",
    telegramSoft: isDark
      ? "rgba(34, 158, 217, 0.16)"
      : "rgba(34, 158, 217, 0.10)",

    voice: "#A855F7",
    voiceDark: "#7E22CE",
    voiceHeader: isDark ? "#1C162E" : "#4C1D95",
    voiceBanner: isDark ? "#151022" : "#3B0764",
    voiceCard: isDark ? "#1C152C" : "#FFFFFF",
    voiceSoft: isDark
      ? "rgba(168, 85, 247, 0.16)"
      : "rgba(168, 85, 247, 0.10)",
    voiceMuted: isDark ? "#2E2248" : "#F5F3FF",
    voiceAccent: "#9333EA",
    voiceBorder: isDark ? "rgba(168, 85, 247, 0.20)" : "rgba(168, 85, 247, 0.12)",

    social: "#E1306C",
    socialDark: "#C13584",
    socialSoft: isDark
      ? "rgba(225, 48, 108, 0.16)"
      : "rgba(225, 48, 108, 0.10)",

    crm: "#F59E0B",
    crmDark: "#B45309",
    crmSoft: isDark
      ? "rgba(245, 158, 11, 0.16)"
      : "rgba(245, 158, 11, 0.10)",
  },
});

export type AppColors = ReturnType<typeof getColors>;
export type ThemeColors = AppColors;
export const colors = getColors(false);