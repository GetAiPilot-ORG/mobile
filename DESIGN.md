# GetAIPilot Mobile Design System Specification (`DESIGN.md`)

This document is the **Single Source of Truth** for the official GetAIPilot React Native + Expo mobile design system, derived directly from the production website (`getaipilot.in`).

---

## 1. Brand & Visual Identity

### Brand Essence
GetAIPilot combines clean, high-efficiency enterprise capability with a luxurious, warm modern aesthetic. The visual tone is defined by deep forest emerald tones, warm cream canvas backgrounds, crisp rounded cards, and vibrant accent indicators.

### Logo Specifications
- **Logomark:** Forest emerald badge with geometric stylized 'G' and animated glowing aura.
- **Logotype:** Ubuntu / IBM Plex Sans font. "Get AI" in gradient forest-to-emerald, "Pilot" in brand gradient.
- **Sub-badge:** "AUTOMATION" in uppercase tracking (`tracking-[0.15em]`) with pulsating online status dot (`#10B981`).

---

## 2. Color Tokens

### A. Core Canvas & Surfaces
| Token | Web Value / HSL | Hex / RGBA | Mobile Role |
| :--- | :--- | :--- | :--- |
| `background` | `hsl(33 43% 96%)` | `#F9F5F0` | Default warm cream screen canvas |
| `backgroundDark` | `hsl(222 47% 11%)` | `#0D1B18` | Dark mode base canvas |
| `surface` | `hsl(0 0% 100%)` | `#FFFFFF` | Standard card and modal surface |
| `surfaceRaised` | `hsl(0 0% 100%)` | `#FFFFFF` | Elevated headers and floating menus |
| `surfaceMuted` | `hsl(210 20% 97%)` | `#F1F5F9` | Secondary card fills and input backgrounds |
| `border` | `hsl(214 32% 91%)` | `#E2DED4` | Card, divider, and input borders |
| `foreground` | `hsl(224 71% 4%)` | `#111816` | Primary high-contrast typography |
| `mutedForeground` | `hsl(215 16% 47%)` | `#706D64` | Subtitles, labels, and secondary copy |

### B. Brand Green Tokens
| Token | Web Value / HSL | Hex / RGBA | Mobile Role |
| :--- | :--- | :--- | :--- |
| `primary` | `hsl(160 80% 18%)` | `#003C33` / `#0A5C3D` | Primary brand headers, active tabs, main CTAs |
| `primaryHover` | `hsl(160 84% 15%)` | `#064E3B` | Pressed buttons and active tab backgrounds |
| `primaryMuted` | — | `#073F36` | Hero card fills and banner gradients |
| `accent` | `hsl(152 48% 45%)` | `#16B882` | Active badges, success highlights, live indicators |
| `accentSoft` | `hsl(152 55% 94%)` | `rgba(22, 184, 130, 0.12)` | Badge backgrounds and active highlight pills |

### C. Functional & Status Colors
| Status | Text Color | Background Pill Color | Use Case |
| :--- | :--- | :--- | :--- |
| **Operational / Active** | `#16B882` | `rgba(22, 184, 130, 0.12)` | Live services, verified accounts, running bots |
| **Maintenance** | `#EF4444` | `rgba(239, 68, 68, 0.12)` | Services under maintenance, global kill switch |
| **Degraded / Trial** | `#F59E0B` | `rgba(245, 158, 11, 0.12)` | High latency alerts, trial accounts expiring |
| **Outage / Error** | `#DC2626` | `rgba(220, 38, 38, 0.12)` | Service disconnects, failed webhook responses |

### D. Product Hub Identity Colors
| Product | Primary Accent | Dark Shade | Soft Pill Background |
| :--- | :--- | :--- | :--- |
| **GAP WhatsApp** | `#25D366` | `#075E54` | `rgba(37, 211, 102, 0.12)` |
| **GAP Telegram** | `#229ED9` | `#0088CC` | `rgba(34, 158, 217, 0.12)` |
| **GAP Voice Pilot** | `#8B5CF6` | `#6D28D9` | `rgba(139, 92, 246, 0.12)` |
| **GAP Social Pilot** | `#E1306C` | `#C13584` | `rgba(225, 48, 108, 0.12)` |
| **GAP Smart CRM** | `#F59E0B` | `#B45309` | `rgba(245, 158, 11, 0.12)` |

---

## 3. Typography Hierarchy

| Style Role | Font Weight | Size (pt) | Line Height | Tracking |
| :--- | :--- | :--- | :--- | :--- |
| **Display Title (Hero)** | 900 (Black) | 24–28 | 32 | `-0.5px` |
| **Section Heading** | 800 (Extrabold) | 18–20 | 24 | `-0.3px` |
| **Card Title** | 800 (Bold) | 15–16 | 20 | `-0.2px` |
| **Body (Regular)** | 500 (Medium) | 13–14 | 19 | `0px` |
| **Caption / Subtext** | 500 (Regular) | 12 | 16 | `0px` |
| **Category Overline** | 800 (Black) | 10.5 | 14 | `+0.6px` (UPPERCASE) |
| **Badge Label** | 800 (Extrabold) | 10–11 | 13 | `+0.4px` (UPPERCASE) |

---

## 4. Spacing System

Consistent spacing rhythm matching website paddings:
- `spacing.xs`: `4px` (Micro gap, pill padding)
- `spacing.sm`: `8px` (Icon to text gap, chip padding)
- `spacing.md`: `12px` (Card inner spacing, grid gap)
- `spacing.lg`: `16px` (Standard screen horizontal padding)
- `spacing.xl`: `20px` (Card padding, section gap)
- `spacing.xxl`: `24px` (Screen top/bottom gutter)
- `spacing.huge`: `32px` (Empty state padding)

---

## 5. Border Radius Tokens

- `radius.sm`: `6px` (Badges, tags, small action buttons)
- `radius.md`: `10px` (Input fields, secondary buttons)
- `radius.lg`: `14px` (Standard product cards, metric cards)
- `radius.xl`: `18px` (Hero banners, large cards)
- `radius.full`: `9999px` (Pills, avatar circles)

---

## 6. Shadows & Depth

- **Card Shadow:** `shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2`
- **Hero Banner Shadow:** `shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 4`
- **Button Shadow:** `shadowColor: colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 2`

---

## 7. Component Specifications

### 1. AppTopBar
- **Height:** `56px`
- **Background:** `#FFFFFF` with `1px` border bottom `#E2DED4`.
- **Left:** Back arrow `‹` (if nested screen) or GetAIPilot Brand Logomark + "GetAIPilot" title.
- **Right:** Avatar badge (with user initial) or Action icons.

### 2. ProductCard
- **Layout:** Icon box (top-left) with product brand background, category overline, bold name, status badge (top-right), 2-line description, bottom divider with colored arrow action button.

### 3. ToolCard
- **Layout:** Soft icon box, category overline, tool title, 2-line description, optional "Popular" / "Free" badge.

### 4. MetricCard
- **Layout:** Upper label in uppercase tracking, big bold stat number (`22pt`), trend/status badge pill, subtext.

### 5. StatusBadge
- **Layout:** Rounded pill with animated live dot (`6px`) + uppercase status text.

---

## 8. Role-Based Navigation Architecture

### Normal User Tabs:
1. **HOME** (`/(tabs)/index.tsx`) &mdash; Overview & "Your AI Workspace", plan status, 5 product indicators, quick launcher.
2. **PRODUCTS** (`/(tabs)/products.tsx`) &mdash; GAP Telegram, GAP CRM, GAP WhatsApp, GAP Voice Pilot, GAP Social Pilot.
3. **TOOLS** (`/(tabs)/tools.tsx`) &mdash; All 10 Free Tools (My Designs, Bio Templates, Landing Templates, QuickForms, WhatsApp Link, Link Shortener, File Linker, Event Links, AI Speech to Text, QR Generator).
4. **ACCOUNT** (`/(tabs)/account.tsx`) &mdash; Profile, Help Center, Plans & Pricing, Customize App.

### Admin User Addition:
- **ADMIN TAB** (`/(tabs)/admin.tsx`) &mdash; Admin Dashboard, Sales Leads Manager, Central Maintenance Controls, Monetize / Earn Hub.
