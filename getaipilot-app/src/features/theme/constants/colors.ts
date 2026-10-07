export const getColors = (isDark: boolean = false) => ({
  // =========================================================
  // BRAND
  // =========================================================
  primary: "#CABFAB",
  primaryHover: "#B9AE95",
  primaryPressed: "#A99E87",
  primaryForeground: "#41444B",
  primaryMuted: isDark ? "#3E3B35" : "#F0ECE3",

  accent: "#CABFAB",
  accentHover: "#B9AE95",
  accentForeground: "#41444B",
  accentSoft: isDark
    ? "rgba(202, 191, 171, 0.16)"
    : "rgba(202, 191, 171, 0.22)",

  // =========================================================
  // BACKGROUND
  // =========================================================
  background: isDark ? "#41444B" : "#DFD8C8",
  canvas: isDark ? "#41444B" : "#DFD8C8",
  backgroundSecondary: isDark ? "#3A3D43" : "#E8E2D5",
  backgroundTertiary: isDark ? "#52575D" : "#F0ECE3",

  // Compatibility aliases
  backgroundDark: "#41444B",
  backgroundLight: "#DFD8C8",
  canvasDark: "#41444B",
  canvasLight: "#DFD8C8",

  // =========================================================
  // SURFACES
  // =========================================================
  surface: isDark ? "#52575D" : "#F4F0E8",
  surfaceSecondary: isDark ? "#494E54" : "#EAE4D8",
  surfaceTertiary: isDark ? "#5A5F65" : "#DFD8C8",
  surfaceGrouped: isDark ? "#3A3D43" : "#EAE4D8",
  surfaceElevated: isDark ? "#52575D" : "#F8F5EF",
  surfaceHover: isDark ? "#5A5F65" : "#E8E2D5",
  surfacePressed: isDark ? "#62676D" : "#DDD5C6",
  surfaceDark: "#52575D",
  surfaceLight: "#F4F0E8",

  // =========================================================
  // TEXT
  // =========================================================
  text: isDark ? "#F7F3EA" : "#41444B",
  mutedText: isDark ? "#C6C0B5" : "#6B7076",
  foreground: isDark ? "#F7F3EA" : "#41444B",
  foregroundDark: "#F7F3EA",
  foregroundLight: "#41444B",
  textPrimary: isDark ? "#F7F3EA" : "#41444B",
  textSecondary: isDark ? "#DFD8C8" : "#52575D",
  textTertiary: isDark ? "#C6C0B5" : "#6B7076",
  textMuted: isDark ? "#AAA79F" : "#777B80",
  textDisabled: isDark ? "#777B80" : "#A5A7A9",
  textInverse: isDark ? "#41444B" : "#F7F3EA",

  // =========================================================
  // CARDS
  // =========================================================
  card: isDark ? "#52575D" : "#F8F5EF",
  cardBackground: isDark ? "#52575D" : "#F8F5EF",
  cardDark: "#52575D",
  cardLight: "#F8F5EF",
  cardForeground: isDark ? "#F7F3EA" : "#41444B",
  cardBorder: isDark ? "#686D72" : "#D2CABA",
  cardBorderDark: "#686D72",
  cardBorderLight: "#D2CABA",
  cardHover: isDark ? "#5A5F65" : "#F1ECE3",
  cardShell: isDark ? "#3A3D43" : "#EAE4D8",
  cardShellBorder: isDark ? "#52575D" : "#D2CABA",

  // =========================================================
  // BORDERS
  // =========================================================
  border: isDark ? "#686D72" : "#D2CABA",
  borderDark: "#686D72",
  borderLight: isDark ? "#5A5F65" : "#E5DFD4",
  borderStrong: isDark ? "#777B80" : "#B9B0A0",
  divider: isDark ? "#5A5F65" : "#D8D0C2",
  focusBorder: "#CABFAB",

  // =========================================================
  // INPUTS
  // =========================================================
  input: isDark ? "#52575D" : "#F8F5EF",
  inputBackground: isDark ? "#52575D" : "#F8F5EF",
  inputForeground: isDark ? "#F7F3EA" : "#41444B",
  inputPlaceholder: isDark ? "#AAA79F" : "#8A8D91",
  inputBorder: isDark ? "#686D72" : "#D2CABA",
  inputBorderFocus: "#CABFAB",
  inputDisabled: isDark ? "#3A3D43" : "#EAE4D8",
  inputDisabledText: isDark ? "#777B80" : "#A5A7A9",

  // =========================================================
  // BUTTONS
  // =========================================================
  buttonPrimary: "#CABFAB",
  buttonPrimaryHover: "#B9AE95",
  buttonPrimaryPressed: "#A99E87",
  buttonPrimaryForeground: "#41444B",

  buttonSecondary: isDark ? "#52575D" : "#EAE4D8",
  buttonSecondaryHover: isDark ? "#5A5F65" : "#DFD8C8",
  buttonSecondaryPressed: isDark ? "#686D72" : "#D4CCBD",
  buttonSecondaryForeground: isDark ? "#F7F3EA" : "#41444B",

  buttonGhost: "transparent",
  buttonGhostHover: isDark
    ? "rgba(223, 216, 200, 0.10)"
    : "rgba(65, 68, 75, 0.06)",
  buttonGhostPressed: isDark
    ? "rgba(223, 216, 200, 0.16)"
    : "rgba(65, 68, 75, 0.10)",
  buttonGhostForeground: isDark ? "#DFD8C8" : "#41444B",

  buttonDisabled: isDark ? "#3A3D43" : "#E1DBD0",
  buttonDisabledForeground: isDark ? "#777B80" : "#A5A7A9",

  // =========================================================
  // STATUS & FEEDBACK
  // =========================================================
  success: "#4F8A68",
  successHover: "#417456",
  successForeground: "#FFFFFF",
  successSoft: isDark ? "rgba(79, 138, 104, 0.20)" : "rgba(79, 138, 104, 0.12)",

  warning: "#B8863B",
  warningHover: "#9C702E",
  warningForeground: "#FFFFFF",
  warningSoft: isDark ? "rgba(184, 134, 59, 0.20)" : "rgba(184, 134, 59, 0.12)",

  destructive: "#B85C5C",
  destructiveHover: "#994848",
  destructivePressed: "#803B3B",
  destructiveForeground: "#FFFFFF",
  destructiveSoft: isDark
    ? "rgba(184, 92, 92, 0.20)"
    : "rgba(184, 92, 92, 0.12)",

  info: "#647D8C",
  infoHover: "#536A78",
  infoForeground: "#FFFFFF",
  infoSoft: isDark ? "rgba(100, 125, 140, 0.20)" : "rgba(100, 125, 140, 0.12)",

  muted: isDark ? "#52575D" : "#EAE4D8",
  mutedHover: isDark ? "#5A5F65" : "#DFD8C8",
  mutedForeground: isDark ? "#C6C0B5" : "#6B7076",

  secondary: isDark ? "#52575D" : "#EAE4D8",
  secondaryHover: isDark ? "#5A5F65" : "#DFD8C8",
  secondaryForeground: isDark ? "#F7F3EA" : "#41444B",

  // =========================================================
  // LINKS & TABS
  // =========================================================
  link: "#9B8F70",
  linkHover: "#7F7459",
  linkVisited: "#776B86",

  tabBackground: isDark ? "#3A3D43" : "#EAE4D8",
  tabActive: "#CABFAB",
  tabActiveBackground: isDark
    ? "rgba(202, 191, 171, 0.16)"
    : "rgba(202, 191, 171, 0.30)",
  tabInactive: isDark ? "#C6C0B5" : "#6B7076",
  tabBorder: isDark ? "#52575D" : "#D2CABA",

  // =========================================================
  // NAVIGATION & BADGES
  // =========================================================
  navigationBackground: isDark ? "#41444B" : "#F8F5EF",
  navigationBorder: isDark ? "#52575D" : "#D2CABA",
  navigationActive: "#CABFAB",
  navigationInactive: isDark ? "#AAA79F" : "#777B80",

  badgePrimary: isDark
    ? "rgba(202, 191, 171, 0.18)"
    : "rgba(202, 191, 171, 0.30)",
  badgePrimaryText: isDark ? "#DFD8C8" : "#625B4C",
  badgeSuccess: isDark
    ? "rgba(79, 138, 104, 0.20)"
    : "rgba(79, 138, 104, 0.12)",
  badgeSuccessText: isDark ? "#8FC3A4" : "#417456",
  badgeWarning: isDark
    ? "rgba(184, 134, 59, 0.20)"
    : "rgba(184, 134, 59, 0.12)",
  badgeWarningText: isDark ? "#E0B86E" : "#8A652D",
  badgeDanger: isDark ? "rgba(184, 92, 92, 0.20)" : "rgba(184, 92, 92, 0.12)",
  badgeDangerText: isDark ? "#E59A9A" : "#994848",
  badgeNeutral: isDark ? "#52575D" : "#EAE4D8",
  badgeNeutralText: isDark ? "#DFD8C8" : "#52575D",

  // =========================================================
  // OVERLAY & SKELETON & ICONS
  // =========================================================
  overlay: isDark ? "rgba(0, 0, 0, 0.70)" : "rgba(65, 68, 75, 0.35)",
  modalBackground: isDark ? "#52575D" : "#F8F5EF",
  modalBorder: isDark ? "#686D72" : "#D2CABA",
  modalTitle: isDark ? "#F7F3EA" : "#41444B",
  modalDescription: isDark ? "#DFD8C8" : "#6B7076",

  skeleton: isDark ? "#52575D" : "#D8D1C4",
  skeletonHighlight: isDark ? "#686D72" : "#E8E2D5",

  iconPrimary: isDark ? "#F7F3EA" : "#41444B",
  iconSecondary: isDark ? "#DFD8C8" : "#52575D",
  iconMuted: isDark ? "#8C9094" : "#8A8D91",
  iconActive: "#CABFAB",
  iconSuccess: "#4F8A68",
  iconWarning: "#B8863B",
  iconDanger: "#B85C5C",
  iconInfo: "#647D8C",

  online: "#4F8A68",
  offline: "#8A8D91",
  busy: "#B8863B",
  error: "#B85C5C",

  selection: isDark ? "rgba(202, 191, 171, 0.25)" : "rgba(202, 191, 171, 0.35)",
  ripple: isDark ? "rgba(223, 216, 200, 0.10)" : "rgba(65, 68, 75, 0.06)",
  shadow: isDark ? "rgba(0, 0, 0, 0.35)" : "rgba(65, 68, 75, 0.12)",
  transparent: "transparent",

  // =========================================================
  // PRODUCT ACCENTS
  // =========================================================
  products: {
    whatsapp: "#25D366",
    whatsappDark: "#075E54",
    whatsappSoft: isDark
      ? "rgba(37, 211, 102, 0.18)"
      : "rgba(37, 211, 102, 0.10)",

    telegram: "#229ED9",
    telegramDark: "#0088CC",
    telegramSoft: isDark
      ? "rgba(34, 158, 217, 0.18)"
      : "rgba(34, 158, 217, 0.10)",

    voice: "#8B5CF6",
    voiceDark: "#6D28D9",
    voiceSoft: isDark ? "rgba(139, 92, 246, 0.18)" : "rgba(139, 92, 246, 0.10)",

    social: "#E1306C",
    socialDark: "#C13584",
    socialSoft: isDark
      ? "rgba(225, 48, 108, 0.18)"
      : "rgba(225, 48, 108, 0.10)",

    crm: "#B8863B",
    crmDark: "#8A652D",
    crmSoft: isDark ? "rgba(184, 134, 59, 0.18)" : "rgba(184, 134, 59, 0.10)",
  },
});

export type AppColors = ReturnType<typeof getColors>;
export type ThemeColors = AppColors;
export const colors = getColors(false);
