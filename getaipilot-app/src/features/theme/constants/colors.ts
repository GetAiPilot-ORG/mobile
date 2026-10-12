
export const getColors = (isDark: boolean = false) => ({
  // BRAND
  primary: isDark ? "#C56BFF" : "#B044F2",
  primaryHover: isDark ? "#D18AFF" : "#9635D6",
  primaryPressed: isDark ? "#B653F2" : "#8129BE",
  primaryForeground: "#FFFFFF",
  primaryMuted: isDark ? "#352440" : "#F2E8FA",

  accent: isDark ? "#D66BDF" : "#D83DCE",
  accentHover: isDark ? "#E18AE8" : "#B82DB0",
  accentForeground: "#FFFFFF",
  accentSoft: isDark
    ? "rgba(214, 107, 223, 0.16)"
    : "rgba(216, 61, 206, 0.10)",

  // BACKGROUNDS
  background: isDark ? "#11100F" : "#F7F5F2",
  canvas: isDark ? "#11100F" : "#F7F5F2",
  backgroundSecondary: isDark ? "#191715" : "#F0EDE8",
  backgroundTertiary: isDark ? "#201D1A" : "#EAE5DF",

  backgroundDark: "#11100F",
  backgroundLight: "#F7F5F2",
  canvasDark: "#11100F",
  canvasLight: "#F7F5F2",

  // SURFACES
  surface: isDark ? "#191715" : "#FDFCFB",
  surfaceSecondary: isDark ? "#201D1A" : "#F0EDE8",
  surfaceTertiary: isDark ? "#26221F" : "#EAE5DF",
  surfaceGrouped: isDark ? "#191715" : "#F0EDE8",
  surfaceElevated: isDark ? "#26221F" : "#FFFFFF",
  surfaceHover: isDark ? "#302B26" : "#F0EDE8",
  surfacePressed: isDark ? "#39332E" : "#E7E2DC",
  surfaceDark: "#191715",
  surfaceLight: "#FDFCFB",

  // TEXT
  text: isDark ? "#F5F1EB" : "#211E1A",
  mutedText: isDark ? "#B6ADA3" : "#77716A",
  foreground: isDark ? "#F5F1EB" : "#211E1A",
  foregroundDark: "#F5F1EB",
  foregroundLight: "#211E1A",
  textPrimary: isDark ? "#F5F1EB" : "#211E1A",
  textSecondary: isDark ? "#B6ADA3" : "#77716A",
  textTertiary: isDark ? "#A49B91" : "#8A837B",
  textMuted: isDark ? "#898078" : "#8A837B",
  textDisabled: isDark ? "#706961" : "#AAA39B",
  textInverse: isDark ? "#211E1A" : "#FFFFFF",

  // CARDS
  card: isDark ? "#191715" : "#FDFCFB",
  cardBackground: isDark ? "#191715" : "#FDFCFB",
  cardDark: "#191715",
  cardLight: "#FDFCFB",
  cardForeground: isDark ? "#F5F1EB" : "#211E1A",
  cardBorder: isDark ? "#39332E" : "#E7E2DC",
  cardBorderDark: "#39332E",
  cardBorderLight: "#E7E2DC",
  cardHover: isDark ? "#26221F" : "#F7F3EE",
  cardShell: isDark ? "#201D1A" : "#F0EDE8",
  cardShellBorder: isDark ? "#39332E" : "#E7E2DC",

  // BORDERS
  border: isDark ? "#39332E" : "#E7E2DC",
  borderDark: "#39332E",
  borderLight: isDark ? "#302B26" : "#F0EDE8",
  borderStrong: isDark ? "#51483F" : "#D2CAC0",
  divider: isDark ? "#302B26" : "#EAE5DF",
  focusBorder: isDark ? "#C56BFF" : "#B044F2",

  // INPUTS
  input: isDark ? "#191715" : "#FDFCFB",
  inputBackground: isDark ? "#191715" : "#FDFCFB",
  inputForeground: isDark ? "#F5F1EB" : "#211E1A",
  inputPlaceholder: isDark ? "#A49B91" : "#8A837B",
  inputBorder: isDark ? "#39332E" : "#E7E2DC",
  inputBorderFocus: isDark ? "#C56BFF" : "#B044F2",
  inputDisabled: isDark ? "#201D1A" : "#F0EDE8",
  inputDisabledText: isDark ? "#706961" : "#AAA39B",

  // BUTTONS
  buttonPrimary: isDark ? "#C56BFF" : "#B044F2",
  buttonPrimaryHover: isDark ? "#D18AFF" : "#9635D6",
  buttonPrimaryPressed: isDark ? "#B653F2" : "#8129BE",
  buttonPrimaryForeground: "#FFFFFF",

  buttonSecondary: isDark ? "#26221F" : "#F0EDE8",
  buttonSecondaryHover: isDark ? "#302B26" : "#E7E2DC",
  buttonSecondaryPressed: isDark ? "#39332E" : "#DCD5CC",
  buttonSecondaryForeground: isDark ? "#F5F1EB" : "#211E1A",

  buttonGhost: "transparent",
  buttonGhostHover: isDark
    ? "rgba(255, 255, 255, 0.06)"
    : "rgba(33, 30, 26, 0.04)",
  buttonGhostPressed: isDark
    ? "rgba(255, 255, 255, 0.10)"
    : "rgba(33, 30, 26, 0.08)",
  buttonGhostForeground: isDark ? "#F5F1EB" : "#211E1A",

  buttonDisabled: isDark ? "#26221F" : "#EAE5DF",
  buttonDisabledForeground: isDark ? "#706961" : "#AAA39B",

  // STATUS & FEEDBACK
  success: isDark ? "#34D399" : "#16845B",
  successHover: isDark ? "#6EE7B7" : "#116B49",
  successForeground: "#FFFFFF",
  successSoft: isDark
    ? "rgba(52, 211, 153, 0.16)"
    : "rgba(22, 132, 91, 0.10)",

  warning: isDark ? "#FBBF24" : "#A66B12",
  warningHover: isDark ? "#FCD34D" : "#87550D",
  warningForeground: isDark ? "#211E1A" : "#FFFFFF",
  warningSoft: isDark
    ? "rgba(251, 191, 36, 0.16)"
    : "rgba(166, 107, 18, 0.10)",

  destructive: isDark ? "#FF7185" : "#D94352",
  destructiveHover: isDark ? "#FF91A0" : "#B52E3D",
  destructivePressed: isDark ? "#F05265" : "#982536",
  destructiveForeground: "#FFFFFF",
  destructiveSoft: isDark
    ? "rgba(255, 113, 133, 0.16)"
    : "rgba(217, 67, 82, 0.10)",

  info: isDark ? "#79B8FF" : "#3979B8",
  infoHover: isDark ? "#9ACBFF" : "#2D6296",
  infoForeground: "#FFFFFF",
  infoSoft: isDark
    ? "rgba(121, 184, 255, 0.16)"
    : "rgba(57, 121, 184, 0.10)",

  muted: isDark ? "#201D1A" : "#F0EDE8",
  mutedHover: isDark ? "#302B26" : "#E7E2DC",
  mutedForeground: isDark ? "#B6ADA3" : "#77716A",

  secondary: isDark ? "#201D1A" : "#F0EDE8",
  secondaryHover: isDark ? "#302B26" : "#E7E2DC",
  secondaryForeground: isDark ? "#F5F1EB" : "#211E1A",

  // LINKS & TABS
  link: isDark ? "#D18AFF" : "#9635D6",
  linkHover: isDark ? "#E0B4FF" : "#8129BE",
  linkVisited: isDark ? "#D6A0E8" : "#86519A",

  tabBackground: isDark ? "#191715" : "#F0EDE8",
  tabActive: isDark ? "#C56BFF" : "#B044F2",
  tabActiveBackground: isDark
    ? "rgba(197, 107, 255, 0.16)"
    : "rgba(176, 68, 242, 0.08)",
  tabInactive: isDark ? "#B6ADA3" : "#77716A",
  tabBorder: isDark ? "#39332E" : "#E7E2DC",

  // NAVIGATION & BADGES
  navigationBackground: isDark ? "#191715" : "#FDFCFB",
  navigationBorder: isDark ? "#39332E" : "#E7E2DC",
  navigationActive: isDark ? "#C56BFF" : "#B044F2",
  navigationInactive: isDark ? "#A49B91" : "#8A837B",

  badgePrimary: isDark
    ? "rgba(197, 107, 255, 0.16)"
    : "rgba(176, 68, 242, 0.10)",
  badgePrimaryText: isDark ? "#DDB4FF" : "#8129BE",

  badgeSuccess: isDark
    ? "rgba(52, 211, 153, 0.16)"
    : "rgba(22, 132, 91, 0.10)",
  badgeSuccessText: isDark ? "#6EE7B7" : "#116B49",

  badgeWarning: isDark
    ? "rgba(251, 191, 36, 0.16)"
    : "rgba(166, 107, 18, 0.10)",
  badgeWarningText: isDark ? "#FCD34D" : "#87550D",

  badgeDanger: isDark
    ? "rgba(255, 113, 133, 0.16)"
    : "rgba(217, 67, 82, 0.10)",
  badgeDangerText: isDark ? "#FF91A0" : "#B52E3D",

  badgeNeutral: isDark ? "#26221F" : "#F0EDE8",
  badgeNeutralText: isDark ? "#B6ADA3" : "#77716A",

  // OVERLAYS, MODALS & SKELETONS
  overlay: isDark
    ? "rgba(0, 0, 0, 0.72)"
    : "rgba(33, 30, 26, 0.35)",
  modalBackground: isDark ? "#191715" : "#FDFCFB",
  modalBorder: isDark ? "#39332E" : "#E7E2DC",
  modalTitle: isDark ? "#F5F1EB" : "#211E1A",
  modalDescription: isDark ? "#B6ADA3" : "#77716A",

  skeleton: isDark ? "#26221F" : "#E7E2DC",
  skeletonHighlight: isDark ? "#39332E" : "#F0EDE8",

  // ICONS
  iconPrimary: isDark ? "#F5F1EB" : "#211E1A",
  iconSecondary: isDark ? "#B6ADA3" : "#77716A",
  iconMuted: isDark ? "#898078" : "#8A837B",
  iconActive: isDark ? "#C56BFF" : "#B044F2",
  iconSuccess: isDark ? "#34D399" : "#16845B",
  iconWarning: isDark ? "#FBBF24" : "#A66B12",
  iconDanger: isDark ? "#FF7185" : "#D94352",
  iconInfo: isDark ? "#79B8FF" : "#3979B8",

  online: isDark ? "#34D399" : "#16845B",
  offline: isDark ? "#898078" : "#8A837B",
  busy: isDark ? "#FBBF24" : "#A66B12",
  error: isDark ? "#FF7185" : "#D94352",

  selection: isDark
    ? "rgba(197, 107, 255, 0.25)"
    : "rgba(176, 68, 242, 0.12)",
  ripple: isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(33, 30, 26, 0.06)",
  shadow: isDark
    ? "rgba(0, 0, 0, 0.35)"
    : "rgba(33, 30, 26, 0.08)",
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
    voiceSoft: isDark
      ? "rgba(168, 85, 247, 0.16)"
      : "rgba(168, 85, 247, 0.10)",

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