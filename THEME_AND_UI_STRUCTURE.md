# GetAiPilot Mobile — UI Architecture & Theme Specification

> **Comprehensive UI directory structure, design tokens, theme system, navigation architecture, and per-feature specification mapping for GetAiPilot Mobile (React Native / Expo Router).**

---

## 1. Unified Theme Architecture

GetAiPilot Mobile follows an **Apple iOS Human Interface Guidelines (HIG)** aesthetic combined with high-contrast OLED styling:
- **Light Theme**: Crisp white canvases (`#F8F9FA` / `#FFFFFF`), soft slate borders (`#E5E7EB`), and high-contrast typography (`#000000`).
- **Dark Theme**: Pure OLED Pitch Black (`#000000`), neutral gray surface cards (`#1C1C1E`), subtle structural borders (`#2C2C2E`), and high-contrast white typography (`#FFFFFF`).

### 1.1 Theme Context Engine (`src/contexts/ThemeContext.tsx`)
Theme state is managed globally through `ThemeProvider` and consumed everywhere via `useTheme()`:
```tsx
import { useTheme } from '../contexts/ThemeContext';

const { themeMode, theme, isDark, tailwindClass, colors, setThemeMode, toggleTheme } = useTheme();
```
- **Supported Modes**: `'system'` (default, dynamically tracks OS), `'light'`, and `'dark'`.
- **Persistence**: Persisted across app reloads via `@react-native-async-storage/async-storage` (`@gap_app_theme_mode`).
- **Cross-Platform Synchronization**:
  - **Native**: Listens to `Appearance.addChangeListener` and updates native status bars and appearance.
  - **Web**: Synchronizes with browser `window.matchMedia('(prefers-color-scheme: dark)')`, updates `document.documentElement` (`data-theme`, `classList.add('dark')`), and matches `document.body` canvas colors.
  - **NativeWind / Tailwind**: Synchronizes scheme directly with NativeWind runtime via `useColorScheme`.

---

## 2. Core Design Tokens & System

### 2.1 Color Tokens (`src/theme/colors.ts`)

| Category | Token | Light Mode Value | Dark Mode Value (OLED) | Description / Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Canvas** | `background` / `canvas` | `#F8F9FA` | `#000000` | Full screen root background canvas |
| **Surfaces** | `surface` / `surfaceElevated` | `#FFFFFF` | `#1C1C1E` | Card containers, bottom sheets, modal bodies |
| **Grouped** | `surfaceGrouped` | `#F2F4F7` | `#1C1C1E` | iOS Grouped tableview background & section containers |
| **Cards** | `card` / `cardShell` | `#FFFFFF` / `#F2F4F7` | `#1C1C1E` | Inner content cards and outer shell wrappers |
| **Borders** | `border` / `cardBorder` | `#E5E7EB` | `#2C2C2E` | Structural card borders, list dividers, header rules |
| **Typography** | `foreground` / `cardForeground` | `#000000` | `#FFFFFF` | Primary headers, data values, active item titles |
| **Muted Text** | `mutedForeground` | `#6B7280` | `#98989D` | Subtitles, helper text, telemetry labels |
| **Secondary** | `secondary` | `#F2F4F7` | `#1C1C1E` | Secondary button containers, subtle backings |
| **Brand Primary** | `primary` | `#0084FF` | `#0084FF` | iOS Electric Blue primary CTA buttons |
| **Primary Hover** | `primaryHover` | `#0070D8` | `#0070D8` | Active button touch feedback states |
| **Primary Muted** | `primaryMuted` | `#EBF5FF` | `#0B2942` | Primary chip backgrounds and badge pills |
| **Primary Accent** | `accent` / `accentSoft` | `#0084FF` | `rgba(0,132,255,0.18)` | Soft glows, active focus rings, selection pills |
| **Destructive** | `destructive` / `destructiveSoft` | `#DC2626` | `rgba(220,38,38,0.18)` | Delete actions, errors, cancellation buttons |
| **Success** | `success` / `successSoft` | `#16A34A` | `rgba(22,163,74,0.18)` | Connected status, active agents, success pills |
| **Warning** | `warning` / `warningSoft` | `#F59E0B` | `rgba(245,158,11,0.18)` | In-progress tasks, pending broadcasts, alerts |

### 2.2 Product Accent & Theme Matrix (`src/theme/productThemes.ts`)

| Product Suite | Accent Token | Primary Hex | Dark Accent Hex | Soft Pill Tint (Dark / Light) | Badge Hex |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **WhatsApp Pilot** | `products.whatsapp` | `#25D366` | `#075E54` | `rgba(37, 211, 102, 0.18 / 0.12)` | `#16A34A` |
| **Telegram Tracker**| `products.telegram` | `#229ED9` | `#0088CC` | `rgba(34, 158, 217, 0.18 / 0.12)` | `#0284C7` |
| **VoicePilot** | `products.voice` | `#8B5CF6` | `#6D28D9` | `rgba(139, 92, 246, 0.18 / 0.12)` | `#7C3AED` |
| **SocialPilot** | `products.social` | `#E1306C` | `#C13584` | `rgba(225, 48, 108, 0.18 / 0.12)` | `#DB2777` |
| **Smart CRM** | `products.crm` | `#F59E0B` | `#B45309` | `rgba(245, 158, 11, 0.18 / 0.12)` | `#D97706` |
| **Free Growth Tools** | `products.tools` | `#0084FF` | `#0070D8` | `rgba(0, 132, 255, 0.18 / 0.12)` | `#059669` |

### 2.3 Spacing, Radius, Typography & Shadows

- **Spacing (`src/theme/spacing.ts`)**:
  - `xs: 4`, `sm: 8`, `md: 12`, `lg: 16`, `xl: 20`, `xxl: 24`, `huge: 32`
- **Border Radius (`src/theme/radius.ts`)**:
  - `xs: 4`, `sm: 6`, `md: 10`, `lg: 14`, `xl: 18`, `cardShell: 22`, `xxl: 24`, `full: 9999`
- **Typography (`src/theme/typography.ts`)**:
  - `fontFamily`: `sans: 'System'`, `mono: 'monospace'`
  - `sizes`: `xs: 10.5`, `sm: 12`, `md: 13.5`, `base: 15`, `lg: 17`, `xl: 20`, `xxl: 24`, `display: 28`
  - `lineHeights`: `xs: 14`, `sm: 16`, `md: 18`, `base: 20`, `lg: 23`, `xl: 26`, `xxl: 30`, `display: 34`
  - `weights`: `regular: '400'`, `medium: '500'`, `semibold: '600'`, `bold: '700'`, `extrabold: '800'`, `black: '900'`
- **Shadows (`src/theme/shadows.ts`)**:
  - Cross-platform unified definitions (`card`, `hero`, `button`, `tabActive`) adapting to `boxShadow` on Web and native iOS/Android shadow offsets and elevations.

---

## 3. Full Project Directory Structure

```
mobile/
├── app/                                # Expo Router File-Based Routing
│   ├── (auth)/                         # Authentication Route Group
│   │   ├── callback.tsx                # OAuth & Magic link redirect handler
│   │   ├── forgot-password.tsx         # Password recovery trigger
│   │   ├── login.tsx                   # Supabase email/password login & session creation
│   │   ├── reset-password.tsx          # Password update completion
│   │   └── signup.tsx                  # New user registration flow
│   ├── (tabs)/                         # Main App Floating Tab Navigation
│   │   ├── _layout.tsx                 # Tab layout config with FloatingTabBar
│   │   ├── index.tsx                   # Home / Command Center Dashboard
│   │   ├── inbox.tsx                   # Omnichannel Customer Inbox / WhatsApp LiveChat
│   │   ├── tools.tsx                   # Free Tools Hub (Native utilities & Webview builders)
│   │   ├── activity.tsx                # Realtime System Activity & Telemetry Feed
│   │   ├── admin.tsx                   # System Admin Center (visible to admins only)
│   │   ├── products.tsx                # Products Hub (href: null, accessed via Home cards)
│   │   ├── account.tsx                 # Profile & Settings (href: null, accessed via TopBar)
│   │   └── fleet.tsx                   # AI Agent Fleet Monitor (href: null)
│   ├── account/                        # Account Subroutes
│   │   ├── customize.tsx               # Theme & Appearance Mode Switcher (System/Light/Dark)
│   │   ├── help.tsx                    # Documentation, FAQs & Support Tickets
│   │   └── plans.tsx                   # Subscription Tiers & AI Credit Top-ups
│   ├── admin/                          # Dedicated Admin Subroutes
│   │   ├── index.tsx                   # Redirects to /(tabs)/admin
│   │   ├── maintenance.tsx             # Cache Flusher, Redis, & DB Health
│   │   ├── monetize.tsx                # MRR, Revenue & Billing Analytics
│   │   └── sales-leads.tsx             # Enterprise Inbound Leads Pipeline
│   ├── crm/                            # CRM Deep-Link Subroutes
│   │   ├── billing-profiles.tsx        # Client Billing Profiles
│   │   ├── contacts.tsx                # CRM Contacts & Lead Directory
│   │   ├── deals.tsx                   # Deals & Pipeline Stage Kanban
│   │   ├── invoices.tsx                # Invoices & Billing Documents
│   │   ├── payments.tsx                # Payment History & Gateway Settlements
│   │   ├── quotations.tsx              # Sales Quotations & Proposals
│   │   └── tasks.tsx                   # Team Tasks & Due Dates
│   ├── inbox/                          # Messaging Deep-Link Routes
│   │   └── [id].tsx                    # 1-on-1 Multi-Channel Conversation Thread
│   ├── products/                       # Dedicated Product Hub Suites
│   │   ├── crm/                        # Smart CRM Suite
│   │   │   ├── index.tsx               # CRM 5-Tab Hub (Overview, Team, Planner, Calendar, Connect)
│   │   │   ├── pipeline.tsx            # Full Pipeline Kanban Screen
│   │   │   └── leads/
│   │   │       ├── index.tsx           # Lead List Screen
│   │   │       └── [id].tsx            # Single Lead Detail & Timeline Screen
│   │   ├── social/                     # SocialPilot Suite
│   │   │   ├── index.tsx               # Social 4-Tab Hub (Overview, Trends, Inbox, Activity)
│   │   │   └── plans.tsx               # SocialPilot Dedicated Tier Subscriptions
│   │   ├── telegram.tsx                # Telegram 9-Service Automation Hub
│   │   ├── voice.tsx                   # VoicePilot 4-Tab Hub (Overview, Calls, Campaigns, Contacts)
│   │   └── whatsapp/                   # WhatsApp Pilot Suite
│   │       ├── index.tsx               # WhatsApp 4-Tab Hub (Overview, Broadcasts, Contacts, Templates)
│   │       ├── contacts.tsx            # Contact Segments & CRM Linking
│   │       ├── templates.tsx           # Meta-Approved WhatsApp Message Templates
│   │       └── broadcasts/
│   │           ├── index.tsx           # Outbound Broadcast History & Trigger
│   │           └── [id].tsx            # Broadcast Telemetry & Delivery Analytics
│   ├── tools/                          # Standalone AI Utilities & Builders
│   │   ├── bio-templates.tsx           # Link-in-Bio Visual Page Builder
│   │   ├── event-links.tsx             # Calendar & Event Link Creator
│   │   ├── file-linker.tsx             # Cloud File Sharing & Download Gate Linker
│   │   ├── landing-templates.tsx       # AI Landing Page Template Showcase
│   │   ├── link-shortener.tsx          # Dynamic URL Shortener with Analytics
│   │   ├── my-designs.tsx              # Saved Templates & Visual Assets
│   │   ├── payment-link.tsx            # Instant UPI Payment Gateway Link Generator
│   │   ├── qr-code.tsx                 # Custom Styled QR Code Engine
│   │   ├── quick-forms.tsx             # Dynamic Lead Capture Form Builder
│   │   ├── speech-to-text.tsx          # Real-time Voice Audio Transcription Engine
│   │   ├── website-audit.tsx           # AI SEO & Website Performance Auditor
│   │   └── whatsapp-link.tsx           # Click-to-Chat Direct WhatsApp Link Maker
│   ├── +native-intent.tsx              # Universal Deep-Link Normalizer (Auth, Tools & Templates)
│   ├── +not-found.tsx                  # 404 Route Fallback
│   ├── onboarding.tsx                  # Interactive App Tour for New Users
│   ├── pricing.tsx                     # Global Pricing Alias (renders account/plans)
│   └── _layout.tsx                     # Root App Layout with QueryClient, AuthGuard & Providers
│
├── src/                                # Core Application Architecture & UI Library
│   ├── components/                     # Universal UI Components & Design System
│   │   ├── AppScreen.tsx               # Root view with dynamic StatusBar & canvas theming
│   │   ├── AppTopBar.tsx               # Standardized top header with back navigation & avatars
│   │   ├── BiometricGuard.tsx          # Biometric & FaceID local authentication layer
│   │   ├── Button.tsx                  # Primary, secondary, outline & destructive button primitives
│   │   ├── Card.tsx                    # HIG-compliant surface card with theme border & background
│   │   ├── DatePickerModal.tsx         # Cross-platform date and time picker bottom sheet
│   │   ├── EmptyState.tsx              # Empty data placeholder with icons and CTA
│   │   ├── FloatingTabBar.tsx          # Glassmorphic bottom navigation dock for main tabs
│   │   ├── GlobalErrorBoundary.tsx     # Application error catch boundary
│   │   ├── Input.tsx                   # Universal themed text field with label and error state
│   │   ├── MetricCard.tsx              # Key performance metric card with icon & delta
│   │   ├── OfflineNotice.tsx           # Persistent network disconnection status banner
│   │   ├── ProductCard.tsx             # Interactive launcher card for product hub suites
│   │   ├── ProductFloatingBottomBar.tsx# Dynamic floating bottom dock with 'More' sheet for product sub-tabs
│   │   ├── SearchInput.tsx             # Search input field with clear action
│   │   ├── Skeleton.tsx                # Shimmer skeleton primitives (Circle, Row, Text)
│   │   ├── StatusBadge.tsx             # Color-coded status badge pill (Active, Pending, Failed)
│   │   ├── StatusScreen.tsx            # Generic operational status/confirmation screen
│   │   ├── ToolCard.tsx                # Grid launcher card for free growth tools
│   │   ├── payments/
│   │   │   └── RazorpayCheckoutModal.tsx # Native Razorpay SDK & Web Checkout integration
│   │   └── skeletonScreen/             # 14 Screen-specific skeleton loaders
│   │       ├── AccountSkeletonScreen.tsx
│   │       ├── ActivitySkeletonScreen.tsx
│   │       ├── AdminSkeletonScreen.tsx
│   │       ├── AuthSkeletonScreen.tsx
│   │       ├── CrmSkeletonScreen.tsx
│   │       ├── DashboardSkeletonScreen.tsx
│   │       ├── HomeSkeletonScreen.tsx
│   │       ├── InboxSkeletonScreen.tsx
│   │       ├── LayoutSkeletonScreen.tsx
│   │       ├── SocialSkeletonScreen.tsx
│   │       ├── TelegramSkeletonScreen.tsx
│   │       ├── ToolsSkeletonScreen.tsx
│   │       ├── VoiceSkeletonScreen.tsx
│   │       ├── WhatsAppSkeletonScreen.tsx
│   │       └── index.ts
│   │
│   ├── contexts/                       # Global React Context Providers
│   │   ├── AuthContext.tsx             # Supabase session, user state, and auth mutations
│   │   ├── NetworkContext.tsx          # Connectivity monitoring via NetInfo
│   │   ├── RazorpayContext.tsx         # Payment order creation and verification flow
│   │   └── ThemeContext.tsx            # Theme mode state engine (System, Light, Dark)
│   │
│   ├── core/                           # Business Logic & Infrastructure
│   │   ├── api/
│   │   │   └── client.ts               # Axios client with session interceptor & base URL
│   │   ├── payments/
│   │   │   ├── razorpayService.ts      # Razorpay order generation & verification service
│   │   │   ├── types.ts                # Payment transaction contracts & response types
│   │   │   └── validation.ts           # Payment payload validation schemas
│   │   ├── pricing/
│   │   │   └── pricingService.ts       # Dynamic pricing plans and coupon validation
│   │   ├── storage/
│   │   │   ├── authStorage.ts          # Auth token storage adapter
│   │   │   └── secureStorage.ts        # Expo SecureStore encrypted storage
│   │   └── store/
│   │       └── authStore.ts            # Zustand global auth state & hydration tracker
│   │
│   ├── features/                       # Modular Product Feature Packages
│   │   ├── crm/                        # Smart CRM Suite
│   │   │   ├── api/                    # crm.api.ts & crmApi.ts
│   │   │   ├── components/             # DealCard, LeadCard, PipelineStage, StageSelectorSheet, etc.
│   │   │   ├── hooks/                  # useLeads, useDeals, usePipelines, useCrmDashboard, etc.
│   │   │   ├── screens/                # CRMDashboardScreen, PipelineScreen, LeadListScreen, etc.
│   │   │   └── types/                  # CRM entity contracts
│   │   ├── dashboard/                  # Home Command Center
│   │   │   ├── api/                    # dashboardApi.ts
│   │   │   ├── components/             # MetricGlassCard, ProductActionCard, UsageMeterCard, etc.
│   │   │   ├── screens/                # DashboardScreen.tsx
│   │   │   └── types/                  # Dashboard telemetry types
│   │   ├── inbox/                      # Omnichannel LiveChat Inbox
│   │   │   ├── api/                    # inboxApi.ts
│   │   │   ├── components/             # ConversationCard, MessageBubble, ChannelBadge, etc.
│   │   │   ├── hooks/                  # useInboxWebSocket.ts (Real-time message push)
│   │   │   ├── screens/                # InboxScreen.tsx, ConversationScreen.tsx
│   │   │   └── types/                  # Conversation and Message schema
│   │   ├── social/                     # SocialPilot Cross-Channel Suite
│   │   │   ├── components/             # SocialOverviewTab, SocialTrendsTab, SocialInboxTab, SocialActivityTab,
│   │   │   │                           # CreatePostModal, PostDetailsModal, AccountsModal, InstapilotConversationModal
│   │   │   │   ├── activity/           # ActivityAutoDMSubTab, ActivityInstapilotSubTab, ActivityQueueSubTab, ActivityYouTubeSubTab
│   │   │   │   └── autodm/             # AutoDMAutomationsView, AutoDMContactsView, AutoDMProfileView, AutoDMAddRuleModal
│   │   │   ├── screens/                # SocialScreen.tsx, SocialPlansScreen.tsx
│   │   │   ├── types/                  # Social post, queue, channel & trend contracts
│   │   │   └── utils/                  # socialHandoff.ts
│   │   ├── team/                       # Team, Attendance & Communication
│   │   │   ├── api/                    # team.api.ts
│   │   │   └── screens/                # TeamScreen.tsx, PlannerScreen.tsx, CommunicationScreen.tsx
│   │   ├── telegram/                   # Telegram Automation & Tracker Suite
│   │   │   ├── api/                    # telegram.api.ts, telegramApi.ts, telegramSupabase.ts
│   │   │   ├── components/             # AutoApproveModal, AutoforwardModal, BroadcastModal, ChatBotModal,
│   │   │   │                           # DashboardAnalyticsCharts, ReactionsModal, ReportBotModal, SubManagerModal, etc.
│   │   │   ├── hooks/                  # useTelegram.ts
│   │   │   ├── screens/                # TelegramScreen.tsx (Shell), OverviewScreen, AutoForwardScreen,
│   │   │   │                           # TrackerScreen, SubManagerScreen, ReportBotScreen, BroadcastScreen,
│   │   │   │                           # AutoApproveScreen, ChatBotScreen, ReactionsScreen
│   │   │   └── types/                  # Telegram bot and tracker types
│   │   ├── tools/                      # Free Growth Tools Hub
│   │   │   └── screens/                # ToolsScreen.tsx (Native tools & SSO Webview builders)
│   │   ├── voice/                      # VoicePilot Telecalling & Fleet Suite
│   │   │   ├── api/                    # voiceApi.ts
│   │   │   ├── components/             # BuyDedicatedNumberModal, CallDetailsModal, CampaignDetailsModal,
│   │   │   │                           # ContactDetailsModal, CreateAgentModal, CreateCampaignModal, KycRequestModal, etc.
│   │   │   └── screens/                # VoiceScreen.tsx (Shell), VoiceOverviewScreen, CallsScreen, CampaignsScreen, ContactsScreen
│   │   └── whatsapp/                   # WhatsApp Business Pilot Suite
│   │       ├── api/                    # whatsapp.api.ts
│   │       ├── components/             # ConnectionStatusCard, UsageCard, WhatsAppMetricCard, ContactCard, BroadcastCard, TemplateCard
│   │       ├── hooks/                  # useWhatsAppAccounts, useWhatsAppBroadcasts, useWhatsAppContacts, useWhatsAppStatus, useWhatsAppTemplates, useWhatsAppUsage
│   │       ├── screens/                # WhatsAppHomeScreen.tsx (Shell), WhatsAppBroadcastsScreen, WhatsAppBroadcastDetailScreen,
│   │       │                           # WhatsAppContactsScreen, WhatsAppTemplatesScreen
│   │       └── types/                  # WhatsApp connection, template & broadcast contracts
│   │
│   ├── hooks/                          # Reusable Custom React Hooks
│   │   ├── use-color-scheme.ts         # Native color scheme hook
│   │   ├── use-color-scheme.web.ts     # Web color scheme hook with matchMedia
│   │   ├── use-theme.ts                # Direct access hook to ThemeContext
│   │   ├── useNetworkStatus.ts         # Online/offline network status hook
│   │   └── usePlatformSubscription.ts  # Workspace subscription tier & feature gating
│   │
│   ├── lib/                            # Platform Libraries & Utilities
│   │   ├── biometrics.ts               # LocalAuthentication (FaceID / Fingerprint)
│   │   ├── device-session.ts           # Device UUID & session tracking
│   │   ├── supabase.ts                 # Supabase client singleton
│   │   ├── template-deep-link.ts       # Template URL parser and routing logic
│   │   ├── utils.ts                    # String, number, and date formatters
│   │   └── validators.ts               # Input validation helpers
│   │
│   ├── theme/                          # Unified Design System Tokens
│   │   ├── colors.ts                   # Light/Dark OLED palettes and product accents
│   │   ├── index.ts                    # Central barrel export for all theme tokens
│   │   ├── productThemes.ts            # Product-specific branding, gradients & badges
│   │   ├── radius.ts                   # Corner radius constants
│   │   ├── shadows.ts                  # Cross-platform shadow configurations
│   │   ├── spacing.ts                  # Layout padding and gap constants
│   │   └── typography.ts               # Font scales, weights, and line heights
│   │
│   └── types/                          # Global Types & Database Schema
│       ├── database.ts                 # Supabase database TypeScript definitions
│       └── declarations.d.ts           # Asset and module declarations
```

---

## 4. Per-Feature Architecture & Specification Mapping

### 4.1 Root Layout & Route Security (`app/_layout.tsx`)
- **Root Stack**: Standardized Expo Router `Stack` with horizontal transition animations (`animationDuration: 250ms`).
- **Global Providers Hierarchy**:
  1. `GestureHandlerRootView`: Gesture coordination across mobile and web.
  2. `GlobalErrorBoundary`: Captures runtime component crashes.
  3. `SafeAreaProvider`: Screen edge insets for notches and home indicators.
  4. `NetworkProvider`: Continuous connection listener with real-time `<OfflineNotice />`.
  5. `QueryClientProvider`: Stale time caching (30s) and intelligent retry limiter (skips 400, 401, 403, 404, 502).
  6. `ThemeProvider`: Dynamic theme engine with system auto-tracking.
  7. `AuthProvider`: Supabase authentication session provider.
  8. `RazorpayProvider`: Native and web checkout transaction context.
- **Authoritative Auth Guard (`AuthRouteGuard`)**:
  - Listens strictly to `[authStatus, segments]`.
  - While hydrating, navigation is paused. Once hydrated:
    - If `unauthenticated` and not in `(auth)`, automatically replaces route with `/(auth)/login`.
    - If `authenticated` and inside `(auth)`, automatically routes into `/(tabs)`.
- **Splash Overlay (`SplashOverlay`)**:
  - Displays `<LayoutSkeletonScreen />` until both network and session hydration complete.

---

### 4.2 Main Floating Bottom Dock (`FloatingTabBar.tsx`)
Docked at the bottom of all root tab screens with a floating pill container:
- **Dimensions & Styling**:
  - Height: `52px`, `borderRadius: 26px`, anchored `12px` to `safeAreaInsets.bottom`.
  - Light Mode: `#FFFFFF` surface, `rgba(0,0,0,0.08)` border, 12pt elevation shadow.
  - Dark Mode: `#121214` surface, `rgba(255,255,255,0.12)` border, 14pt elevation shadow.
- **Active Pill Animation**:
  - Smooth spring animation via `LayoutAnimation` (`springDamping: 0.75`).
  - Dark Mode Active Pill: Pure `#FFFFFF` background with `#000000` text and icon.
  - Light Mode Active Pill: Pitch `#0F172A` background with `#FFFFFF` text and icon.
- **Visible Tabs**:
  1. `Home` (`index.tsx`): Home icon (`home` / `home-outline`).
  2. `Inbox` (`inbox.tsx`): Omnichannel chat icon (`chatbubbles` / `chatbubbles-outline`).
  3. `Tools` (`tools.tsx`): Utility suite icon (`telescope` / `telescope-outline`).
  4. `Activity` (`activity.tsx`): Realtime telemetry icon (`pulse` / `pulse-outline`).
  5. `Admin` (`admin.tsx`): Shield icon (`shield-checkmark` / `shield-checkmark-outline`), **strictly displayed only when `isAdmin` is true**.
- **Hidden Tabs (`href: null`)**:
  - `products`: Dedicated products are navigated contextually from home product cards.
  - `account`: Accessed via the top-bar profile avatar.
  - `fleet`: Accessed contextually.

---

### 4.3 Home / Command Center (`app/(tabs)/index.tsx` -> `DashboardScreen.tsx`)
- **Route**: `/(tabs)`
- **Theme Adaptation**:
  - Canvas: Light `#F8F9FA` / Dark `#000000`.
  - Metric Cards: Light `#FFFFFF` / Dark `#1C1C1E`.
- **Key Sections**:
  1. **Top Bar Header**: User avatar with direct link to `/account`, workspace selector, and theme toggle button.
  2. **Quick Launcher Row**: Instant launchers for Send Broadcast, AI Voice Call, QR Code Maker, and New CRM Lead.
  3. **Product Hub Suite Cards**: High-impact cards for WhatsApp, VoicePilot, Telegram, Smart CRM, and SocialPilot with live status indicators and product accent glows.
  4. **Telemetry Metric Cards**: 2x2 grid displaying Active AI Agents, Dispatched Outbound Calls, Telegram Joins, and WhatsApp Message Volumes.
  5. **Live AI Activity Stream**: Chronological event log with animated status badges and instant drilldown.

---

### 4.4 VoicePilot Telecalling & Fleet Suite (`app/products/voice.tsx` -> `VoiceScreen.tsx`)
- **Route**: `/products/voice`
- **Product Accent Color**: `#8B5CF6` (Electric Purple) / Dark: `#6D28D9`
- **Bottom Navigation**: `ProductFloatingBottomBar` with 4 dedicated tabs:
  1. `Overview` (`VoiceOverviewScreen.tsx`): Telemetry counters (Dispatched Calls, Minutes Used, Active Numbers, Wallet Balance), quick action buttons, and dedicated phone number manager.
  2. `Calls` (`CallsScreen.tsx`): Complete call log list with audio recordings, duration, call status, and transcript snippet.
  3. `Campaigns` (`CampaignsScreen.tsx`): Outbound campaign fleet runner, bulk contact dispatchers, and campaign performance.
  4. `Contacts` (`ContactsScreen.tsx`): Voice audience contact lists, lead call histories, and segment tags.
- **Embedded Modals**:
  - `CallDetailsModal`: Call playback, audio waveform, AI summary & full dialogue bubbles.
  - `TriggerCallModal`: Instant single outbound AI call launcher with number input and agent selector.
  - `CreateCampaignModal`: Bulk outbound fleet campaign dispatcher.
  - `EditCampaignModal`: Campaign update and schedule adjustment modal.
  - `CreateAgentModal`: Voice Agent creator with AI prompt generator.
  - `CreateContactModal` & `EditContactModal`: Lead creation & editing.
  - `ContactDetailsModal`: Contact calling history inspection.
  - `BuyDedicatedNumberModal`: Telephony number purchase with instant allocation.
  - `KycRequestModal`: Telephony regulatory KYC submission modal.

---

### 4.5 Telegram Automation & Tracker Suite (`app/products/telegram.tsx` -> `TelegramScreen.tsx`)
- **Route**: `/products/telegram`
- **Product Accent Color**: `#229ED9` (Telegram Sky Blue) / Dark: `#0088CC`
- **Architecture**: Modular shell (`TelegramScreen.tsx`) delegating to 9 specialized service screens:
  1. `Overview` (`OverviewScreen.tsx`): Master KPI command center, gross revenue, net creator share, connected bot health, and 8-tool quick grid.
  2. `Forward` (`AutoForwardScreen.tsx`): Channel-to-channel message auto-routing rules and delay filters.
  3. `Tracker` (`TrackerScreen.tsx`): Channel join link tracking, member retention, conversion rates, and join/leave logs.
  4. `SubMgr` (`SubManagerScreen.tsx`): VIP paid channel subscription paywalls, landing pages, earnings and subscriber counts.
  5. `Report` (`ReportBotScreen.tsx`): Research and market analysis automated PDF generator.
  6. `Broadcast` (`BroadcastScreen.tsx`): Mass message broadcaster to linked channels and groups.
  7. `Approve` (`AutoApproveScreen.tsx`): Instant auto-approval engine for channel join requests.
  8. `ChatBot` (`ChatBotScreen.tsx`): Interactive Telegram conversational bots and keyword auto-responders.
  9. `Reactions` (`ReactionsScreen.tsx`): Automated emoji reactions for newly posted channel messages.
- **Embedded Modals**:
  - `AutoforwardModal`, `SubManagerModal`, `ReportBotModal`, `BroadcastModal`, `AutoApproveModal`, `ChatBotModal`, `ReactionsModal`, `TelegramLoginModal`, `TelegramConnectModal`.

---

### 4.6 WhatsApp Business Pilot Suite (`app/products/whatsapp/` -> `WhatsAppHomeScreen.tsx`)
- **Route**: `/products/whatsapp`
- **Product Accent Color**: `#25D366` (WhatsApp Emerald Green) / Dark: `#075E54`
- **Bottom Navigation**: `ProductFloatingBottomBar` with 4 core tabs:
  1. `Overview` (`home`):
     - `ConnectionStatusCard`: Active phone number, Meta quality rating, messaging tier limit, and multi-account switcher button.
     - `UsageCard`: Cloud wallet messages sent, delivered, failed, and estimated remaining balance.
     - `Metrics 2x2 Grid`: Contacts count, Meta-approved templates, dispatched broadcasts, and Cloud SLA delivery rate.
     - `Product Navigation List`: Direct links into Contacts, Templates, and Broadcasts.
     - `Account Switcher Bottom Sheet`: iOS-style modal to switch active WhatsApp business numbers in multi-number accounts.
  2. `Broadcasts` (`WhatsAppBroadcastsScreen.tsx`): List of outbound broadcast campaigns with delivery funnels and status filters.
  3. `Contacts` (`WhatsAppContactsScreen.tsx`): Contact directory, tags, import actions, and CRM customer linkage.
  4. `Templates` (`WhatsAppTemplatesScreen.tsx`): Meta Cloud API synced template manager with approval status badges (Approved, Pending, Rejected).
- **Sub-pages & Deep Links**:
  - `/products/whatsapp/broadcasts/[id]` (`WhatsAppBroadcastDetailScreen.tsx`): Per-recipient delivery telemetry, read receipts, and failure reasons.

---

### 4.7 Smart CRM Suite (`app/products/crm/index.tsx` & `app/crm/*`)
- **Route**: `/products/crm`
- **Product Accent Color**: `#F59E0B` (Amber Gold) / Dark: `#B45309`
- **Bottom Navigation**: `ProductFloatingBottomBar` with 5 product sub-tabs:
  1. `Overview` (`CRMDashboardScreen.tsx`): Pipeline revenue, active deals count, lead conversion metrics, and quick action launcher.
  2. `Team` (`TeamScreen.tsx`): Team members directory, presence indicators, attendance tracking, and leave management.
  3. `Planner` (`PlannerScreen.tsx`): Company holidays, upcoming member birthdays, and team milestones.
  4. `Calendar` (`GoogleCalendarScreen.tsx`): Integrated Google Calendar scheduled meetings and deal follow-ups.
  5. `Communication` (`CommunicationScreen.tsx`): Internal team messaging, announcements, and work-from-home notifications.
- **Dedicated Sub-pages (`app/crm/*` & `app/products/crm/*`)**:
  - `deals.tsx` / `pipeline.tsx`: Visual Lead & Deal Kanban Board (`PipelineScreen.tsx`) across customizable stages (`LeadCard.tsx`, `PipelineStage.tsx`, `StageSelectorSheet.tsx`).
  - `leads/index.tsx` / `contacts.tsx`: Full searchable lead directory (`LeadListScreen.tsx`, `ContactsScreen.tsx`).
  - `leads/[id].tsx`: Detailed lead dossier with activity timeline (`LeadDetailScreen.tsx`, `ActivityTimelineItem.tsx`, `LogActivityModal.tsx`).
  - `tasks.tsx`: Team tasks, deadlines, and reminders (`TasksScreen.tsx`).
  - `quotations.tsx`: Sales quotes and proposals (`QuotationsScreen.tsx`).
  - `invoices.tsx`: Invoices and PDF receipts (`InvoicesScreen.tsx`).
  - `payments.tsx`: Payment reconciliation and settlement history (`PaymentsScreen.tsx`).
  - `billing-profiles.tsx`: Customer and company legal billing profiles (`ClientProfilesScreen.tsx`).

---

### 4.8 SocialPilot Cross-Channel Suite (`app/products/social/` -> `SocialScreen.tsx`)
- **Route**: `/products/social`
- **Product Accent Color**: `#E1306C` (Social Magenta) / Dark: `#C13584`
- **Bottom Navigation**: `ProductFloatingBottomBar` with 4 tabs:
  1. `Overview` (`SocialOverviewTab.tsx`):
     - Connected channels list (Instagram, Facebook, YouTube, LinkedIn, X, Threads, Pinterest, Reddit, Mastodon, Bluesky, Google Business).
     - Performance telemetry: Total Sent, Scheduled in Queue, Failed, and computed Success Rate.
     - Time range switcher (7 days, 30 days, 90 days).
  2. `Trend Feed` (`SocialTrendsTab.tsx`):
     - Viral trends curated from YouTube, Reddit, and social feeds with one-click **"Use in Post"** to open post composer with pre-filled content.
  3. `Social Inbox` (`SocialInboxTab.tsx`):
     - Instagram Direct Messages and Facebook page conversations with 5-second polling synchronization.
  4. `Activity` (`SocialActivityTab.tsx`):
     - Four specialized sub-views:
       - **Scheduled Queue** (`ActivityQueueSubTab.tsx`): Pending scheduled social posts with instant cancel and retry actions.
       - **Instapilot Direct Messages** (`ActivityInstapilotSubTab.tsx`): Automated Instagram conversational flows.
       - **YouTube Studio** (`ActivityYouTubeSubTab.tsx`): YouTube channel metrics, subscribers, video views, and sync status.
       - **AutoDM Automation** (`ActivityAutoDMSubTab.tsx`): Automated direct message trigger rules (`AutoDMAutomationsView.tsx`), audience contacts (`AutoDMContactsView.tsx`), profile configuration (`AutoDMProfileView.tsx`), and rule modal (`AutoDMAddRuleModal.tsx`).
- **Modals**:
  - `CreatePostModal`: Multi-platform publisher with AI caption assistant, media picker, character limits per provider, and date/time scheduler.
  - `PostDetailsModal`: Inspection of published or failed social posts with retry and cancellation actions.
  - `AccountsModal`: Connect and disconnect social network providers.
  - `InstapilotConversationModal`: Thread inspector for Instagram DM automation.
- **Dedicated Sub-pages**:
  - `plans.tsx` (`SocialPlansScreen.tsx`): Dedicated subscription tier upgrades for SocialPilot.

---

### 4.9 Omnichannel Inbox / WhatsApp LiveChat (`app/(tabs)/inbox.tsx` & `app/inbox/[id].tsx`)
- **Route**: `/(tabs)/inbox` & `/inbox/[id]`
- **Real-Time Integration**:
  - Hooked directly to backend via WebSocket (`useInboxWebSocket.ts`) with fallback 5-second polling.
- **Header & Filter Tabs**:
  - Top header with total unread counter pill and `+ New Chat` action.
  - Search bar supporting contact names, phone numbers, and message content.
  - Horizontal filter tabs:
    - `All Chats` (`ALL`)
    - `Unread` (`UNREAD`)
    - `Unassigned` (`UNASSIGNED`)
    - `Assigned to Me` (`MINE`)
    - `AI Active` (`BOT_ACTIVE`)
- **Conversations & Chat Thread**:
  - Conversation cards (`ConversationCard.tsx`) showing customer avatar, platform badge (`ChannelBadge.tsx`), snippet, relative timestamp, bot status, and unread pill.
  - Fullscreen conversation view (`ConversationScreen.tsx`) supporting message bubbles (`MessageBubble.tsx`), incoming/outgoing indicators, media attachments, template messages, human takeover toggle, and quick canned responses.
- **Start New Chat Modal**:
  - Contact selector modal with real-time search across workspace contact database.

---

### 4.10 Standalone Tools Hub & Webview Builders (`app/(tabs)/tools.tsx` & `app/tools/*`)
- **Route**: `/(tabs)/tools`
- **Dual Tool Architecture**:
  1. **Native Free Tools (Built-in Mobile Views)**:
     - `QR Code Generator` (`/tools/qr-code`): Custom styled QR codes with logos and colors.
     - `Link Shortener` (`/tools/link-shortener`): Dynamic shortened links with visit analytics.
     - `WhatsApp Direct Link` (`/tools/whatsapp-link`): Click-to-chat links with pre-filled message text.
     - `UPI Payment Link` (`/tools/payment-link`): Instant UPI and gateway payment links.
     - `File Cloud Linker` (`/tools/file-linker`): Secure cloud-hosted file links.
     - `Event Calendar Links` (`/tools/event-links`): Add-to-calendar universal event links.
     - `AI Speech-to-Text` (`/tools/speech-to-text`): Audio voice memo transcription.
     - `Website SEO Audit` (`/tools/website-audit`): AI-driven website performance and SEO auditor.
     - `QuickForms Creator` (`/tools/quick-forms`): Embeddable lead capture form creator.
     - Additional templates: `landing-templates.tsx`, `bio-templates.tsx`, `my-designs.tsx`.
  2. **Visual Web Builders (Single-Sign-On via Session Token)**:
     - Launched via `/mobile/v1/webview/session-token` into mobile browser / in-app webview:
       - **Landing Page Builder** (`landing-templates`): Visual drag-and-drop landing page designer.
       - **Link-in-Bio Builder** (`bio-builder`): Mobile-first profile link canvas.
       - **Automation Flow Builder** (`flow-builder`): Visual bot conversation flow designer.

---

### 4.11 User Preferences, Accounts & Plans (`app/account/*`)
- **Appearance Switcher (`app/account/customize.tsx`)**:
  - ☀️ **Light Mode**: Forces Crisp High-Contrast Light Theme (`#F8F9FA`).
  - 🌙 **Dark Mode**: Forces OLED Pitch Black & Neutral Gray Theme (`#000000`).
  - ⚙️ **System Default**: Dynamically tracks user device settings.
- **Help & Support (`app/account/help.tsx`)**:
  - Documentation guides, video tutorials, FAQ accordion, and support ticket creation.
- **Subscription Plans & Credits (`app/account/plans.tsx` / `app/pricing.tsx`)**:
  - Tier selection (Starter, Pro, Enterprise) with monthly/annual billing toggle.
  - Razorpay checkout integration with instant credit top-up and coupon redemption.

---

### 4.12 Admin Operations & Telemetry (`app/admin/*` & `app/(tabs)/admin.tsx`)
- **Access Control**: Gated strictly to administrative accounts (`role === 'admin'` or `is_admin === true`).
- **Screens**:
  - `(tabs)/admin.tsx`: Main administrative hub.
  - `admin/maintenance.tsx`: Redis cache flusher, Supabase database latency, background worker status, and log tailing.
  - `admin/monetize.tsx`: Platform MRR, customer churn, active paid subscriptions, and Razorpay settlement volumes.
  - `admin/sales-leads.tsx`: Enterprise incoming high-value sales leads pipeline and contact requests.

---

## 5. UI Best Practices for New Screens & Components

When building new screens or extending existing ones in GetAiPilot Mobile:

### 5.1 Screen Structure Template
Every screen should use `<AppScreen>` and standard navigation:
```tsx
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '../../components/AppScreen';
import { AppTopBar } from '../../components/AppTopBar';
import { useTheme } from '../../contexts/ThemeContext';

export default function ExampleScreen() {
  const { isDark, colors } = useTheme();

  return (
    <AppScreen safeArea={false}>
      <AppTopBar
        title="Screen Title"
        subtitle="Descriptive subtitle"
        showBack={true}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.heading, { color: colors.foreground }]}>Card Title</Text>
          <Text style={[styles.subtext, { color: colors.mutedForeground }]}>
            Card content adhering to system design tokens.
          </Text>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 110 },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  heading: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  subtext: { fontSize: 13, lineHeight: 18 },
});
```

### 5.2 Product Color Coding Standard
When working inside a specific product suite, always consume the designated product accent:
```tsx
import { productThemes } from '../../theme/productThemes';

const theme = productThemes.whatsapp; // or .telegram, .voice, .social, .crm, .tools
// theme.primary -> main button / active tab color
// theme.soft    -> pill background / subtle highlight
// theme.dark    -> high-contrast dark accent
```

### 5.3 Guidelines Checklist
1. **OLED Pure Black in Dark Mode**: Never use washed-out dark grays for the root background; always use `#000000` for canvas and `#1C1C1E` for cards.
2. **Bottom Floating Bar Padding**: Any screen that displays above a floating tab dock must have `paddingBottom: 110` (or `130`) on its scroll container to prevent content occlusion.
3. **Hardware Back Button Handling**: On multi-tab product screens, always attach a `BackHandler` listener that navigates back to the product overview tab before popping the navigation stack.
4. **Haptic Feedback**: Always trigger `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)` on tab switches, modal launches, and primary action taps on native platforms.
5. **Loading States**: Always provide a dedicated skeleton loader from `src/components/skeletonScreen/` instead of an unstyled spinner.
