# GetAiPilot iOS Design System Specification (`DESIGN.md`)

This document is the **Single Source of Truth** for the official GetAiPilot iOS-first mobile experience, adhering to **Apple Human Interface Guidelines (HIG)** with modern iOS Messenger-style clean aesthetics.

---

## 1. Core Visual Principles & iOS HIG Compliance

1. **Clarity & Content First:** Minimalist white/black canvas with purposeful color accents. No unnecessary borders or visual clutter.
2. **Deference & Depth:** Soft iOS grouped containers (`#F2F4F7` in Light Mode, `#1C1C1E` in Dark Mode), subtle ambient blur/shadows, and natural layered depth.
3. **Consistency:** Unified pill buttons (`borderRadius: 28`), continuous squircle cards (`borderRadius: 16`), and system typography scale across every screen.
4. **Direct Manipulation & Tactile Touch:** Integrated `expo-haptics` on all primary buttons, toggle switches, card selections, and error events.

---

## 2. Color Tokens & System Themes

### A. Surface & Canvas Tokens
| Token | Light Mode (Default) | Dark Mode (OLED) | Role & Usage |
| :--- | :--- | :--- | :--- |
| `background` | `#F8F9FA` | `#000000` | Full screen primary canvas (Deep true OLED black) |
| `surfaceGrouped` | `#FFFFFF` | `#1C1C1E` | Grouped input cards, list containers, unselected pills |
| `surfaceElevated` | `#FFFFFF` | `#1C1C1E` | Floating action sheets, modals, cards with ambient shadow |
| `cardBorder` | `#E5E7EB` | `#2C2C2E` | 1px clean card boundary in dark/light modes |
| `divider` | `rgba(0, 0, 0, 0.08)` (`#E5E7EB`) | `rgba(255, 255, 255, 0.12)` (`#2C2C2E`) | Hairline separators within grouped lists |
| `textPrimary` | `#000000` | `#FFFFFF` | Page titles, primary labels, emphasized numbers |
| `textSecondary` | `#6B7280` (`#8E8E93`) | `#8E8E93` | Subtitles, input placeholders, helper captions |
| `textTertiary` | `#9CA3AF` | `#636366` | Footnotes, timestamps, inactive badge text |

> [!IMPORTANT]
> **No Hardcoded Scroll Backgrounds**: Never hardcode `backgroundColor: '#FFFFFF'` on scroll containers or `contentContainerStyle`. Screens must inherit `AppScreen` canvas dynamically (`#000000` in dark mode, `#F8F9FA` in light mode).

### B. Interactive Accent & Brand Tokens
| Token | Hex Value | Role & Usage |
| :--- | :--- | :--- |
| `brandPrimary` | `#0A84FF` / `#0084FF` | Primary CTA pill buttons, active checkboxes, links |
| `brandPrimaryHover` | `#0070D8` | Pressed state for primary CTA |
| `brandGradient` | `['#FF7A00', '#FF007A', '#8B5CF6', '#0A84FF']` | Brand logo glow, hero spotlights, premium badges |
| `success` | `#16A34A` / `#34C759` | Active status badges, connected indicators, success banners |
| `destructive` | `#DC2626` / `#FF3B30` | Delete actions, error banners, disconnected alerts |
| `warning` | `#F59E0B` / `#FF9500` | Pending states, quota warnings |

---

## 3. Typography Hierarchy (SF Pro System Scale)

| Level | Size | Weight | Tracking (Letter Spacing) | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Large Title / Hero** | `26px` - `28px` | `800` (Bold) | `-0.6px` | `32px` - `34px` | Auth & Onboarding screen headlines |
| **Title 1 / Page Title**| `22px` - `24px` | `700` (Bold) | `-0.5px` | `28px` - `30px` | Main tab headers & Hub titles |
| **Title 2 / Section** | `18px` - `20px` | `700` (Bold) | `-0.3px` | `24px` | Card headings & feature sections |
| **Body / Inputs** | `15px` - `16px` | `400` / `500` | `-0.2px` | `22px` | Text inputs, primary descriptions |
| **Callout / Button** | `16px` | `700` (Bold) | `-0.2px` | `20px` | Pill buttons ("Log in", "Continue", "Create") |
| **Subhead / Caption** | `13px` - `14px` | `500` / `600` | `0px` | `18px` | Input labels, secondary status, list subtitles |
| **Footnote / Badge** | `11px` - `12px` | `700` (Bold) | `+0.2px` | `16px` | Pill badges, terms notes, helper hints |

---

## 4. Component Design Patterns

### A. Brand Logo Header
- Centered circular container: `width: 92px, height: 92px, borderRadius: 46px`.
- High-res asset [logo.jpg](file:///c:/Users/pc/Documents/GitHub/GetAiPilot/mobile/assets/images/logo.jpg).
- Ambient iOS drop shadow: `shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16`.

### B. Grouped Input Cards (iOS TableView Style)
- Grouped container with `borderRadius: 16`, `overflow: 'hidden'`, and background `#FFFFFF` (Light) / `#1C1C1E` (Dark), with 1px border `#E5E7EB` (Light) / `#2C2C2E` (Dark).
- Each row has `minHeight: 52px`, `paddingHorizontal: 16px`.
- Separators use `StyleSheet.hairlineWidth` with `marginLeft: 16px`.
- Trailing clear button (`✕`) and secure entry toggle (`Show`/`Hide`).

### C. Selection Cards & Options (Onboarding / Settings)
- Unselected: Background `#FFFFFF` (Light) / `#1C1C1E` (Dark), subtle border `1px` (`#E5E7EB` / `#2C2C2E`), dark icon badge.
- Selected: Background `#FFFFFF` (Light) / `#1C1C1E` (Dark), active border `2px #0A84FF`, with a circular blue checkmark badge (`✓`) and subtle ambient shadow.
- Light haptic feedback on selection: `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`.

### D. Action Buttons
- **Primary Pill Button:** `height: 52px` (or `paddingVertical: 15px`), `borderRadius: 28px`, background `#0A84FF`, bold text `#FFFFFF`.
  - Disabled state: Background `#F2F4F7` (Dark: `#2C2C2E`), text `#9CA3AF`.
- **Secondary Pill Button:** `borderRadius: 28px`, background `#FFFFFF` (Light) / `#1C1C1E` (Dark), text `#000000` (Light) / `#FFFFFF` (Dark), border 1px `#E5E7EB` (Light) / `#2C2C2E` (Dark).
- **Tertiary Link:** Centered text in `#0A84FF` with hitSlop.

### E. iOS Floating Liquid Glass Tab Bar (visionOS / HIG Standard)
- **Mathematical Symmetry:**
  - Dynamic width measurement via `onLayout`.
  - Usable width divided equally into `N` columns (`tabWidth = availableWidth / N`), ensuring 100% geometric balance.
  - Symmetrical margins: `paddingHorizontal: 6px`, container centered with `maxWidth: 390px, left: 20px, right: 20px`.
- **Animated Gliding Liquid Glass Pill:**
  - Absolutely positioned sliding pill behind the active tab driven by Apple spring physics (`tension: 68, friction: 9`).
  - Dark Mode: `LinearGradient ['rgba(10, 132, 255, 0.32)', 'rgba(10, 132, 255, 0.16)']`, 1.2px glass border `rgba(10, 132, 255, 0.45)`, ambient blue glow `shadowColor: '#0A84FF', shadowRadius: 8`.
  - Light Mode: `LinearGradient ['rgba(0, 132, 255, 0.16)', 'rgba(0, 132, 255, 0.08)']`, 1px border `rgba(0, 132, 255, 0.25)`.
- **Dock Glass Shell:**
  - Dark Mode: `rgba(24, 24, 27, 0.88)` with `rgba(255, 255, 255, 0.14)` border, `borderRadius: 32px`, `height: 64px`.
  - Light Mode: `rgba(255, 255, 255, 0.94)` with `rgba(255, 255, 255, 0.85)` border.
- **Icon Micro-Animations:**
  - Active icon scales by `1.08` with bold typography `#0A84FF` (`fontWeight: '800'`).
  - Inactive icons & labels render in neutral `#8E8E93` (Dark) / `#6B7280` (Light).
  - Tactile light haptic feedback on every tab press.
- **Content Clearance:** All scrollable tabs maintain `paddingBottom: 140` so content is never obscured.

### F. Dynamic Inset & Safe-Area Architecture
- **Top Inset (Dynamic Island / Notch / Punch-Hole):** `AppTopBar` automatically integrates `paddingTop: Math.max(insets.top, 12)` and `height: 54 + insets.top` to extend header backgrounds seamlessly under status bars.
- **Bottom Inset (Home Indicator):** Handled dynamically via `FloatingTabBar` offset and `useSafeAreaInsets().bottom`.

### G. Feedback & Status Toasts
- Non-intrusive rounded banners with soft translucent fills (`#FEE2E2` for error, `#DCFCE7` for success).
- Haptic trigger on appearance (`Heavy` on error, `Medium` on success).

---

## 5. Navigation & Layout Conventions

- **Safe Area Insets:** Always wrap screens with `useSafeAreaInsets()` to account for Dynamic Island, Notch, and Home Indicator.
- **Keyboard Handling:** Always wrap form views with `KeyboardAvoidingView` (`behavior="padding"` on iOS) and `TouchableWithoutFeedback` with `Keyboard.dismiss`.
- **Scroll Continuity:** Set `keyboardShouldPersistTaps="handled"` and `showsVerticalScrollIndicator={false}`.

---

## 6. Mobile Permissions & Biometric Security Architecture (Apple HIG Standard)

### A. Pre-Permission Primer Rule
- Never request raw system permissions (Camera, Face ID, Notifications, Location) on cold launch without context.
- Use **Visual In-App Primers** in Onboarding Step 3 or in-context feature cards explaining the user benefit before triggering native dialogs.

### B. Biometric & Device Security Hierarchy
1. **Hardware Discovery:** Dynamic interrogation (`LocalAuthentication.supportedAuthenticationTypesAsync()`) to detect `Face ID` (iPhone X+), `Touch ID` (iPhone SE/iPad), `Fingerprint` (Android), or `Device Passcode`.
2. **Apple Inset Grouped UI:** 40×40 rounded squircles with semantic Apple colors (`#10B981` Emerald for Biometrics, `#0A84FF` Sapphire for Notifications, `#8B5CF6` Purple for Haptics).
3. **Auto-Lock Policy:** Configurable grace-period timeouts (`Immediately`, `1 min`, `5 min`, `15 min`).
4. **Lifecycle Isolation:** Ignore OS system sheet transitions (`inactive` <-> `active`); only trigger auto-lock when transitioning from true background (`background` -> `active`).

