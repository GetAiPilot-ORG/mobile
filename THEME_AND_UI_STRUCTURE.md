# GetAiPilot Mobile — UI Architecture & Theme Specification

> **Comprehensive UI directory structure, design tokens, theme system, and per-page styling mapping for GetAiPilot Mobile (React Native / Expo Router).**

---

## 1. Unified Theme Architecture

GetAiPilot Mobile follows an **Apple iOS Human Interface Guidelines (HIG)** aesthetic:
- **Light Theme**: Crisp white canvases (`#F8F9FA` / `#FFFFFF`), soft slate borders (`#E5E7EB`), and high-contrast typography (`#000000`).
- **Dark Theme**: Pure OLED Pitch Black (`#000000`), neutral gray surface cards (`#1C1C1E`), subtle structural borders (`#2C2C2E`), and high-contrast white typography (`#FFFFFF`).

### 1.1 Theme Context Engine (`src/contexts/ThemeContext.tsx`)
Theme state is managed globally through `ThemeProvider` and consumed everywhere via `useTheme()`:
```tsx
import { useTheme } from '../contexts/ThemeContext';

const { themeMode, theme, isDark, colors, setThemeMode, toggleTheme } = useTheme();
```
- **Supported Modes**: `'system'` (default, adapts to OS), `'light'`, and `'dark'`.
- **Persistence**: Persisted across app reloads via `@react-native-async-storage/async-storage` (`@gap_app_theme_mode`).
- **Real-Time Cross-Platform Synchronization**: Automatically listens to native `Appearance.addChangeListener` and Web `window.matchMedia('(prefers-color-scheme: dark)')`.

---

## 2. Core Design Tokens & Color Palette

### 2.1 Color Tokens (`src/theme/colors.ts`)

| Category | Token | Light Mode Value | Dark Mode Value (OLED) | Description / Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Canvas** | `background` / `canvas` | `#F8F9FA` | `#000000` | Full screen root background |
| **Surfaces** | `surface` / `card` | `#FFFFFF` | `#1C1C1E` | Card containers, bottom sheets, modal bodies |
| **Grouped** | `surfaceGrouped` | `#F2F4F7` | `#1C1C1E` | Grouped list views and section containers |
| **Borders** | `border` / `cardBorder` | `#E5E7EB` | `#2C2C2E` | Card borders, dividers, list separators |
| **Typography** | `foreground` / `cardForeground` | `#000000` | `#FFFFFF` | Primary headers, values, active tab titles |
| **Muted Text** | `mutedForeground` | `#6B7280` | `#8E8E93` | Subtitles, helper text, telemetry labels |
| **Brand Primary** | `primary` | `#0084FF` | `#0084FF` | iOS Electric Blue primary CTA buttons |
| **Primary Muted** | `primaryMuted` | `#EBF5FF` | `#0B2942` | Primary chip backgrounds and pills |
| **Destructive** | `destructive` | `#DC2626` | `#DC2626` | Delete actions, errors, cancellation buttons |
| **Success** | `success` | `#16A34A` / `#30D158` | `#30D158` | Connected status, active agents, success pills |
| **Warning** | `warning` | `#F59E0B` | `#F59E0B` | In-progress tasks, pending broadcasts |

### 2.2 Product Accent Palette

| Product Suite | Accent Token | Primary Hex | Dark Accent Hex | Soft Glow Pill / Tint |
| :--- | :--- | :--- | :--- | :--- |
| **WhatsApp Pilot** | `products.whatsapp` | `#25D366` | `#075E54` | `rgba(37, 211, 102, 0.15)` |
| **Telegram Tracker**| `products.telegram` | `#229ED9` | `#0088CC` | `rgba(34, 158, 217, 0.15)` |
| **VoicePilot** | `products.voice` | `#8B5CF6` | `#6D28D9` | `rgba(139, 92, 246, 0.15)` |
| **Social Pilot** | `products.social` | `#E1306C` | `#C13584` | `rgba(225, 48, 108, 0.15)` |
| **CRM Pipeline** | `products.crm` | `#F59E0B` | `#B45309` | `rgba(245, 158, 11, 0.15)` |

---

## 3. Full Project Directory Structure

```
mobile/
├── app/                                # Expo Router File-Based Routing
│   ├── (auth)/                         # Authentication Screens
│   │   ├── forgot-password.tsx         # Password reset flow
│   │   ├── login.tsx                   # User login with Supabase/BFF
│   │   └── signup.tsx                  # Registration flow
│   ├── (tabs)/                         # Main Bottom Tab Navigation
│   │   ├── _layout.tsx                 # Tab Navigator setup with FloatingTabBar
│   │   ├── index.tsx                   # Home / Command Center Dashboard
│   │   ├── products.tsx                # Products Hub (WhatsApp, Voice, Telegram, CRM, Social)
│   │   ├── tools.tsx                   # Standalone Utility Tools Grid
│   │   ├── activity.tsx                # Live System Telemetry & Event Stream
│   │   ├── account.tsx                 # User Profile, Plan, & Settings
│   │   ├── fleet.tsx                   # AI Agent Fleet Live Monitor
│   │   ├── inbox.tsx                   # Unified Multi-Channel Inbox
│   │   └── admin.tsx                   # Admin Control Center (for Staff/Admins)
│   ├── products/                       # Dedicated Product Deep-Dive Routes
│   │   ├── crm/                        # CRM Suite
│   │   │   ├── index.tsx               # CRM Dashboard & Metrics
│   │   │   ├── pipeline.tsx            # Visual Deal Stages & Kanban Pipeline
│   │   │   └── leads/                  # Lead management screens
│   │   ├── whatsapp/                   # WhatsApp Automation Suite
│   │   │   ├── index.tsx               # WhatsApp Hub (Chats, QR Pairing, Metrics)
│   │   │   ├── contacts.tsx            # Contact Lists & Audience Segments
│   │   │   ├── templates.tsx           # WhatsApp Official Template Manager
│   │   │   └── broadcasts/             # Outbound Broadcast Campaigns
│   │   │       ├── index.tsx           # Broadcast History & Campaign Creation
│   │   │       └── [id].tsx            # Broadcast Telemetry & Recipient Drill-down
│   │   ├── telegram.tsx                # Telegram Automation & Gap Tracker Suite
│   │   ├── voice.tsx                   # VoicePilot AI Telecalling & Agent Fleet
│   │   └── social.tsx                  # AI Social Media Post Generator & Scheduler
│   ├── tools/                          # Standalone AI Utilities
│   │   ├── bio-templates.tsx           # Link-in-Bio Builder
│   │   ├── event-links.tsx             # Calendar & Event Link Creator
│   │   ├── file-linker.tsx             # Cloud File Sharing & Gate Linker
│   │   ├── landing-templates.tsx       # AI Landing Page Template Showcase
│   │   ├── link-shortener.tsx          # Dynamic URL Shortener with Analytics
│   │   ├── my-designs.tsx              # Saved Templates & Visual Assets
│   │   ├── payment-link.tsx            # Instant Payment Gateway Link Generator
│   │   ├── qr-code.tsx                 # Custom Styled QR Code Engine
│   │   ├── quick-forms.tsx             # Lead Capture Form Builder
│   │   ├── speech-to-text.tsx          # Real-time Voice Audio Transcription
│   │   ├── website-audit.tsx           # AI SEO & Website Performance Auditor
│   │   └── whatsapp-link.tsx           # Click-to-Chat Direct WhatsApp Link Maker
│   ├── account/                        # Account & Preferences Sub-pages
│   │   ├── customize.tsx               # Appearance & Theme Mode Preference Switcher
│   │   ├── help.tsx                    # Documentation, FAQs & Support Ticket System
│   │   └── plans.tsx                   # Subscription Tier Upgrades & AI Credit Top-ups
│   ├── admin/                          # Administrative Tooling
│   │   ├── maintenance.tsx             # Cache Flusher, Redis, DB Status
│   │   ├── monetize.tsx                # Revenue, MRR, & Billing Telemetry
│   │   └── sales-leads.tsx             # Enterprise Inbound Leads Pipeline
│   ├── inbox/                          # Chat & Messaging Drilldown
│   │   └── [id].tsx                    # 1-on-1 Multi-Channel Conversation Thread
│   ├── onboarding.tsx                  # Interactive App Tour for New Users
│   ├── +not-found.tsx                  # 404 Route Fallback
│   └── _layout.tsx                     # Root App Layout with QueryProvider & ThemeProvider
│
├── src/                                # Core Application Logic & Components
│   ├── components/                     # Reusable UI Atoms & Organisms
│   │   ├── AppScreen.tsx               # Root container with dynamic StatusBar & theme background
│   │   ├── AppTopBar.tsx               # Universal adaptive top navigation bar
│   │   ├── FloatingTabBar.tsx          # Glassmorphic bottom navigation dock
│   │   ├── ProductFloatingBottomBar.tsx# Contextual 5-tab floating action dock for products
│   │   ├── QuickActionCard.tsx         # Dashboard quick launcher cards
│   │   └── skeletonScreen/             # Shimmer skeleton loaders for all screen types
│   ├── contexts/                       # React Context Providers
│   │   ├── AuthContext.tsx             # Supabase Authentication & User Session
│   │   └── ThemeContext.tsx            # Dynamic Light/Dark Theme Context Engine
│   ├── core/                           # Networking & API Infrastructure
│   │   └── api/client.ts               # Axios / Fetch client with Auth Interceptor
│   ├── features/                       # Modular Feature Packages
│   │   ├── crm/                        # CRM screens, hooks, and modals
│   │   ├── dashboard/                  # Home dashboard widgets and telemetry
│   │   ├── inbox/                      # Multi-channel chat interface components
│   │   ├── social/                     # Social media AI generation components
│   │   ├── telegram/                   # Telegram bot manager & channel tracker
│   │   │   ├── screens/TelegramScreen.tsx
│   │   │   └── screens/TrackerScreen.tsx
│   │   ├── voice/                      # VoicePilot Telecalling & Agent Fleet
│   │   │   ├── components/CallDetailsModal.tsx
│   │   │   ├── components/TriggerCallModal.tsx
│   │   │   ├── components/CreateCampaignModal.tsx
│   │   │   ├── components/CreateAgentModal.tsx
│   │   │   └── screens/VoiceScreen.tsx
│   │   └── whatsapp/                   # WhatsApp screens, broadcasts & templates
│   │       └── screens/WhatsAppBroadcastsScreen.tsx
│   ├── hooks/                          # Custom React Hooks (useTheme, useAuth, useDebounce)
│   └── theme/                          # Color palettes and typography constants
│       ├── colors.ts                   # Hex and RGBA color mapping
│       └── typography.ts               # Font sizes, line heights, and weights
```

---

## 4. Per-Page UI & Theme Specification Mapping

### 4.1 Home / Command Center (`app/(tabs)/index.tsx`)
- **Route**: `/`
- **Theme Adaptation**:
  - Light: Canvas `#F8F9FA`, Header Surface `#FFFFFF`, Border `#E5E7EB`.
  - Dark: Canvas `#000000`, Header Surface `#1C1C1E`, Border `#2C2C2E`.
- **Key Sections**:
  - Dynamic Greeting Bar (with real-time system clock & theme toggle button).
  - Quick Action Dock (Broadcast, Trigger Voice Call, QR Code, New Lead).
  - Telemetry Metric Cards (2x2 Grid for WhatsApp, Voice, Telegram & Active Users).
  - Recent AI Activity Feed with animated status badges.
- **Floating Bar**: Primary `FloatingTabBar` docked at bottom (`#1C1C1E` in dark mode).

### 4.2 VoicePilot Voice Telecalling (`app/products/voice.tsx` -> `VoiceScreen.tsx`)
- **Route**: `/products/voice`
- **Product Accent Color**: `#8B5CF6` (Electric Purple)
- **Theme Adaptation**:
  - Dark Mode: OLED Pitch Black (`#000000`), `#1C1C1E` cards, `#2C2C2E` segmented pill controls and card borders, pure white text (`#FFFFFF`) for numbers, neutral gray (`#8E8E93`) for subtext.
- **Tabs & Sub-views**:
  1. `Overview`: 2x2 Telemetry Grid (Active Agents, Dispatched Calls, Campaigns, Credit Balance) + Quick Actions dock + Recent Call Stream.
  2. `Calls`: Full Call Log stream with duration, assistant tag, summary snippet, and recording status.
  3. `Agents`: Stack of AI Voice Agents with online status indicator, voice prompt preview, and instant "Test Call" button.
  4. `Campaigns`: Bulk automated outbound voice campaigns with contact counts and execution status.
  5. `Numbers`: Virtual claimed telephony numbers and assigned bot mappings.
- **Embedded Modals**:
  - `CallDetailsModal`: Call audio playback, metadata inspection, AI summary & full conversation bubble transcript.
  - `TriggerCallModal`: Instant single outbound AI call launcher with number input and agent selector.
  - `CreateCampaignModal`: Bulk fleet outbound campaign dispatcher.
  - `CreateAgentModal`: Voice Agent creator with AI System Prompt Auto-generator (`/mobile/v1/voice/agents/generate-prompt`).
- **Floating Bar**: `ProductFloatingBottomBar` with 5 Voice tabs + Violet accent indicator.

### 4.3 WhatsApp Pilot Suite (`app/products/whatsapp/`)
- **Route**: `/products/whatsapp`, `/products/whatsapp/broadcasts`, `/products/whatsapp/contacts`, `/products/whatsapp/templates`
- **Product Accent Color**: `#25D366` (WhatsApp Emerald Green)
- **Theme Adaptation**:
  - Dark Mode: `#000000` Canvas, `#1C1C1E` Cards, `#2C2C2E` Dividers, `#25D366` Active Pills.
- **Key Features**:
  - QR Code Device Pairing Widget with connection state.
  - Template Message Sync from Meta Cloud API.
  - Broadcast Campaign Manager with recipient analytics and delivery rate metrics.
  - Contact Segment Manager.

### 4.4 Telegram Automation & Gap Tracker (`app/products/telegram.tsx`)
- **Route**: `/products/telegram`
- **Product Accent Color**: `#229ED9` (Telegram Sky Blue)
- **Theme Adaptation**:
  - Dark Mode: Pitch Black Canvas, `#1C1C1E` Card Containers, `#2C2C2E` Bordering.
- **Key Features**:
  - Real-time Channel & Group Keyword Tracker.
  - Automatic resolution of channel titles and usernames (with ID fallback).
  - Forwarding rules and lead alerts.

### 4.5 CRM & Deals Pipeline (`app/products/crm/`)
- **Route**: `/products/crm`, `/products/crm/pipeline`
- **Product Accent Color**: `#F59E0B` (Amber Gold)
- **Key Features**:
  - Visual Lead Kanban Board (New, Contacted, Qualified, Proposal, Won).
  - Contact timeline and automated AI interaction history.

### 4.6 Standalone Tools Hub (`app/(tabs)/tools.tsx` & `app/tools/*`)
- **Route**: `/tools`
- **Tools Included**:
  - **Link-in-Bio Builder** (`bio-templates.tsx`): Profile link aggregator.
  - **File Linker** (`file-linker.tsx`): Secure download gates.
  - **QR Code Generator** (`qr-code.tsx`): Custom color & logo QR engine.
  - **WhatsApp Direct Link** (`whatsapp-link.tsx`): Custom message links.
  - **AI Website Auditor** (`website-audit.tsx`): SEO & performance scanner.
  - **Speech-to-Text** (`speech-to-text.tsx`): Audio transcription engine.
  - **Quick Forms** (`quick-forms.tsx`): Embeddable lead forms.
  - **Payment Links** (`payment-link.tsx`): Quick checkout links.

### 4.7 User Preferences & Appearance (`app/account/customize.tsx`)
- **Route**: `/account/customize`
- **Theme Switcher Options**:
  - ☀️ **Light Mode**: Forces Crisp High-Contrast Light Theme (`#F8F9FA`).
  - 🌙 **Dark Mode**: Forces OLED Pitch Black & Neutral Gray Theme (`#000000`).
  - ⚙️ **System Default**: Dynamically tracks user device settings.

---

## 5. UI Best Practices for New Screens

When building new screens or extending existing ones in GetAiPilot Mobile:

1. **Always Wrap in `<AppScreen>`**:
   ```tsx
   import { AppScreen } from '../../components/AppScreen';
   import { AppTopBar } from '../../components/AppTopBar';

   export default function MyScreen() {
     return (
       <AppScreen safeArea={false}>
         <AppTopBar title="My Screen" showBack={true} />
         {/* Screen Content */}
       </AppScreen>
     );
   }
   ```
2. **Always Consume `useTheme()`**:
   ```tsx
   import { useTheme } from '../../contexts/ThemeContext';

   const { isDark, colors } = useTheme();
   ```
3. **Use Neutral Gray & OLED Black Tokens in Dark Mode**:
   - `backgroundColor: isDark ? '#000000' : '#F8F9FA'`
   - `cardBackground: isDark ? '#1C1C1E' : '#FFFFFF'`
   - `borderColor: isDark ? '#2C2C2E' : '#E5E7EB'`
   - `textColor: isDark ? '#FFFFFF' : '#000000'`
   - `mutedText: isDark ? '#8E8E93' : '#6B7280'`
