# GetAiPilot Mobile App 📱

The official cross-platform mobile application for the **GetAiPilot Ecosystem** (`getaipilot.in`), built with **React Native**, **Expo SDK 57**, **Expo Router**, **TypeScript**, and **Supabase**.

---

## 🚀 Overview

GetAiPilot Mobile brings the full power of the GetAiPilot automation ecosystem to mobile devices (iOS & Android) and mobile web, featuring complete feature parity with the web platform:

- 🤖 **Telegram Automation Suite**: Auto-forwarding, Telesub monetization, Auto-approve bot, Channel join link tracker, AI ChatBot, auto-reactions, and broadcast campaigns.
- 💬 **WhatsApp Automation & Broadcast**: Template managers, conversational workflows, and campaign logs.
- 🎙️ **Voice Pilot Hub**: AI Telecalling agent manager, credit wallet, and live call analytics.
- 🏢 **Multi-Tenant GAP CRM**: Organizations, pipelines, deals, contacts, extra seats, and automated provisioning.
- 🌐 **Social Pilot**: Multi-channel campaign posting and scheduling.
- 🛠️ **Free Tools Suite**: QR code creator, link shortener, WhatsApp/UPI payment link generators, cloud file linker, event links, AI speech-to-text transcription, website SEO audit, QuickForms, and Bio/Landing page builders.
- 💳 **Billing & Monetization**: Plan tiers, Razorpay payment flows, creator payouts, and earnings dashboard.
- 🛡️ **Super Admin Controls**: System kill-switches, maintenance mode toggles, sales leads, and real-time platform telemetry.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [React Native 0.86](https://reactnative.dev/) / [Expo SDK 57](https://expo.dev/) |
| **Navigation & Routing** | [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation) |
| **Language** | [TypeScript 6](https://www.typescriptlang.org/) |
| **Backend & Database** | [Supabase](https://supabase.com/) (Auth, PostgreSQL, Realtime, Storage, Edge Functions) |
| **Data Fetching & Cache** | [@tanstack/react-query v5](https://tanstack.com/query/latest) |
| **Animations & Gestures** | `react-native-reanimated`, `react-native-gesture-handler` |
| **State Management** | React Context API (`AuthContext`, `FreeToolsLimitContext`, `EarnContext`, etc.) |
| **Security & Storage** | `expo-secure-store`, `@react-native-async-storage/async-storage`, `expo-local-authentication` |
| **Validation** | `zod` |

---

## 📁 Project Architecture & Directory Structure

```text
mobile/
├── app/                              # File-based navigation (Expo Router)
│   ├── _layout.tsx                   # Root layout, providers & auth gates
│   ├── onboarding.tsx                # First-time onboarding screen
│   ├── (auth)/                       # Authentication group
│   │   ├── _layout.tsx
│   │   ├── login.tsx                 # Email/Password & SSO login
│   │   ├── signup.tsx                # Account registration
│   │   └── forgot-password.tsx       # Password recovery flow
│   ├── (tabs)/                       # Main Tab Bar navigation
│   │   ├── _layout.tsx
│   │   ├── index.tsx                 # Workspace Dashboard Overview
│   │   ├── activity.tsx              # Connected Chats & Live Inbox
│   │   ├── products.tsx              # Automation Hub directory
│   │   ├── tools.tsx                 # Free Tools directory
│   │   ├── admin.tsx                 # Super Admin control panel
│   │   └── account.tsx               # User profile, plans & settings
│   ├── products/                     # Product Suite screens
│   │   ├── telegram.tsx              # Telegram bot manager & Telesub
│   │   ├── whatsapp.tsx              # WhatsApp campaigns & bot configs
│   │   ├── crm.tsx                   # Multi-tenant CRM dashboard
│   │   ├── voice.tsx                 # Voice pilot & telecalling logs
│   │   └── social.tsx                # Social media scheduler
│   ├── tools/                        # Free Tools & Utilities
│   │   ├── qr-code.tsx               # QR Code Generator
│   │   ├── link-shortener.tsx        # Link Shortener
│   │   ├── whatsapp-link.tsx         # WhatsApp Direct Link Generator
│   │   ├── payment-link.tsx          # UPI Payment Link Generator
│   │   ├── file-linker.tsx           # Cloud File Link Generator
│   │   ├── event-links.tsx           # Calendar & Event Link Creator
│   │   ├── speech-to-text.tsx        # AI Audio-to-Text Transcription
│   │   ├── website-audit.tsx         # Website SEO & Performance Audit
│   │   ├── quick-forms.tsx           # Dynamic QuickForms builder
│   │   ├── landing-templates.tsx     # Landing Page Templates
│   │   ├── bio-templates.tsx         # Link-in-Bio builder
│   │   └── my-designs.tsx            # User created assets & templates
│   ├── admin/                        # Admin sub-routes
│   │   ├── maintenance.tsx           # Platform kill switches & settings
│   │   ├── sales-leads.tsx           # Sales inquiry tracker
│   │   └── monetize.tsx              # Creator monetization & payout station
│   └── account/                      # Account sub-routes
│       ├── plans.tsx                 # Subscription plans & billing
│       ├── help.tsx                  # Help center & FAQ tickets
│       └── customize.tsx             # Sidebar / tab customizer
├── src/
│   ├── components/                   # Reusable UI & presentation components
│   ├── constants/                    # Application constants & static config
│   ├── contexts/                     # React Context providers (Auth, Theme, FreeTools)
│   ├── hooks/                        # Custom React hooks (Data fetching & state)
│   ├── lib/                          # Services (Supabase client, CRM provisioning, APIs)
│   ├── theme/                        # Design tokens, color palette, typography & glass styles
│   └── types/                        # TypeScript type declarations
├── assets/                           # Images, icons, and splash screens
├── .env                              # Supabase API keys & endpoint config
├── app.json                          # Expo project configuration
└── package.json                      # Dependencies and scripts
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the `mobile` root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**
- **Expo Go** app on your physical mobile device, or Android Studio / Xcode for local emulators.

### 2. Installation
```bash
cd mobile
npm install
```

### 3. Start Development Server
```bash
npx expo start
```
From the interactive terminal output:
- Press `a` to open in an **Android Emulator** or connected Android device.
- Press `i` to open in an **iOS Simulator** (macOS only).
- Press `w` to open in a **Web Browser**.
- Scan the QR code using the **Expo Go** app on iOS / Android.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm start` / `npx expo start` | Starts the Expo development bundler (Metro) |
| `npm run android` | Builds and runs the native Android debug app |
| `npm run ios` | Builds and runs the native iOS debug app |
| `npm run web` | Launches the app in local web preview mode |
| `npm run lint` | Runs Expo / ESLint checks across codebase |

---

## 📖 Key Documentation

For deep technical details and parity verification, refer to:
- 📊 [`DATA_FLOW.md`](./DATA_FLOW.md) — Real-time data pipeline architecture between Supabase and React components.
- 🎨 [`DESIGN.md`](./DESIGN.md) — Design system specifications, color palettes, and glassmorphic UI standards.
- 📑 [`FEATURE_PARITY_MASTER.md`](./FEATURE_PARITY_MASTER.md) — Master matrix mapping web routes to mobile routes.
- 🔍 [`FUNCTIONALITY_AUDIT.md`](./FUNCTIONALITY_AUDIT.md) — Detailed feature audit & verification reports.
- 📄 [`PAGE_PARITY.md`](./PAGE_PARITY.md) — Comprehensive breakdown of individual screens and behaviors.
- 🔄 [`COMPONENT_MIGRATION.md`](./COMPONENT_MIGRATION.md) — Web to React Native component migration guide.

---

## 📄 License

This project is proprietary and confidential. See [`LICENSE`](./LICENSE) for terms.
