# GetAIPilot Component Migration Mapping (Web → Mobile)

This document is the authoritative component-by-component mapping between the existing production web app (`getaipilot.in/src/`) and the native React Native mobile app (`mobile/src/`).

## Architecture & Migration Method

For every component:
1. **Business Logic & Types:** Reused directly (`SupabaseClient`, queries, mutations, state structures, formatters).
2. **Visual Hierarchy & Token System:** Preserved 1:1 using `mobile/src/theme/` (colors, radius, spacing, typography).
3. **Primitives Conversion:**
   - `div`, `section`, `article` → `View` / `ScrollView` / `FlatList`
   - `span`, `p`, `h1-h6` → `Text`
   - `button` → `Pressable`
   - `input`, `textarea` → `TextInput`
   - `img` → `Image` (from `react-native` or `expo-image`)
   - `framer-motion` → `react-native-reanimated` / native transitions
   - `lucide-react` / `remixicon` → Native SVG / Vector Icons

---

## 1. Dashboard & Navigation

| Web Component (`getaipilot.in/src/`) | Mobile Component (`mobile/src/` & `mobile/app/`) | What Was Reused | What Was Adapted |
|---|---|---|---|
| `components/dashboard/UserDashboardOverview.tsx` | `mobile/app/(tabs)/index.tsx` | Telemetry counters, 5 product card shells (`#ECEAE4`, circular arrow CTA, right mockup visual), plan tier badge logic | Converted CSS grid to responsive native stack, Framer Motion to RN, fixed web pixel heights to scalable tokens |
| `components/AppSidebar.tsx` | `mobile/app/(tabs)/_layout.tsx` | Section hierarchy (Overview, Automation, Free Tools, Account, Administration), live badge indicators, permission gates | Converted desktop collapsible sidebar to native 4-tab bottom navigation (`Home`, `Products`, `Tools`, `Account`) with admin tab guard |
| `components/CustomizeSidebarModal.tsx` | `mobile/app/account/customize.tsx` | Section & tool visibility toggles, reset defaults logic, local preference persistence | Replaced web modal portal with native settings screen and AsyncStorage |

---

## 2. Automation Products

| Web Component (`getaipilot.in/src/`) | Mobile Component (`mobile/src/` & `mobile/app/`) | What Was Reused | What Was Adapted |
|---|---|---|---|
| `components/dashboard/WhatsAppCustomView.tsx` | `mobile/app/products/whatsapp.tsx` | Meta Cloud API token/number storage, broadcast campaign list, auto-reply trigger keywords, green `#25D366` branding | Replaced HTML form inputs with native `TextInput`, alert modals with native `Alert` |
| `pages/telegram/TelegramDashboard.tsx` & `AutoForward/` | `mobile/app/products/telegram.tsx` | Forwarding rules schema, word blacklist sanitizer, channel IDs mapping, Telegram blue `#229ED9` branding | Replaced browser table with swipeable/pressable native cards and live rule switches |
| `pages/telecalling/TelecallingDashboard.tsx` | `mobile/app/products/voice.tsx` | Voice agent metrics, call duration tracking, persona prompt presets, violet `#8B5CF6` branding | Replaced web wave animation with native animated voice wave bars and test call simulator |
| `components/dashboard/SocialPilotCustomView.tsx` | `mobile/app/products/social.tsx` | Verified 6 platforms (IG, YT, X, LinkedIn, FB, Bluesky), cross-poster queue schema, pink/rose branding | Converted web drag-and-drop queue to native touch list with instant schedule mutation |
| `pages/crm/CRMPage.tsx` & `components/crm/` | `mobile/app/products/crm.tsx` | 4-stage pipeline (Lead, Contacted, Qualified, Closed), lead scoring, direct `tel:` & WhatsApp URL triggers | Replaced horizontal web Kanban board with mobile segmented stage switcher and native outreach action buttons |

---

## 3. Free Tools

| Web Component (`getaipilot.in/src/`) | Mobile Component (`mobile/src/` & `mobile/app/`) | What Was Reused | What Was Adapted |
|---|---|---|---|
| `pages/free-tools/FreeToolsOverview.tsx` | `mobile/app/(tabs)/tools.tsx` | Tool categorization, search filter, tool icons, direct route mapping | Converted multi-column web grid to native search header and card list |
| `pages/free-tools/bio-pages/BuilderPage.tsx` | `mobile/app/tools/bio-templates.tsx` | Bio profiles presets, theme previews, copy live link action | Adapted desktop builder canvas into mobile template selector with instant copy/share |
| `pages/free-tools/landing-designs/LandingBuilderPage.tsx` | `mobile/app/tools/landing-templates.tsx` | High-converting landing templates inventory, industry categories | Adapted desktop iframe preview into native card previews with direct share/download |
| `pages/free-tools/link/WhatsAppLinkGenerator.tsx` | `mobile/app/tools/whatsapp-link.tsx` | Phone validation, prefilled text encoding, `wa.me` URL construction | Added native `Share.share()` for 1-click sharing to WhatsApp app |
| `pages/free-tools/link/QRCodeGenerator.tsx` | `mobile/app/tools/qr-code.tsx` | QR payload types (URL, Text, Wi-Fi), color pickers, download action | Integrated native QR generator renderer with direct clipboard copying |
| `pages/free-tools/link/LinkShortener.tsx` | `mobile/app/tools/link-shortener.tsx` | Custom slug validation, click counters, Supabase link records | Native input form with instant copyable shortlink card |
| `pages/free-tools/link/FileLinker.tsx` | `mobile/app/tools/file-linker.tsx` | Direct file distribution link schema, download counter | Native document link generator with clipboard integration |
| `pages/free-tools/link/EventLinksDashboard.tsx` | `mobile/app/tools/event-links.tsx` | Event details, date/time formatting, calendar invite URL generator | Native event link generator with 1-click share |
| `pages/free-tools/SpeechToText.tsx` | `mobile/app/tools/speech-to-text.tsx` | Language options, transcription status states, copy transcript | Adapted audio recorder to mobile audio interface |

---

## 4. Account & Administration

| Web Component (`getaipilot.in/src/`) | Mobile Component (`mobile/src/` & `mobile/app/`) | What Was Reused | What Was Adapted |
|---|---|---|---|
| `pages/UserProfile.tsx` | `mobile/app/(tabs)/account.tsx` | Supabase `profiles` query/mutation, password reset via Supabase Auth, verified badges | Converted desktop profile tabs to native tab switcher and settings list |
| `pages/HelpCenter.tsx` | `mobile/app/account/help.tsx` | Categorized FAQs, tutorial topics, ticket submission mutation to Supabase | Adapted accordion list to native touchable items and ticket form |
| `pages/Pricing.tsx` & `components/pricing/` | `mobile/app/account/plans.tsx` | Plan tiers (Free, Core, Max), pricing rates (INR/USD), feature checkmarks | Converted desktop comparison table into mobile plan carousel/cards |
| `pages/admin/AdminMaintenance.tsx` | `mobile/app/(tabs)/admin.tsx` | `system_settings` global kill-switch, `system_products` maintenance states, `system_maintenance_logs` audit trail | Adapted desktop data table into native status switch cards and modal notice editor |
| `pages/sales/SalesLeadsPage.tsx` | `mobile/app/admin/sales-leads.tsx` | `sales_leads` query/mutation, stage filters, direct call/email/WhatsApp links | Replaced desktop table with searchable native lead cards and 1-click outreach buttons |
| `pages/earn/EarnEarningsPage.tsx` & `EarnShopPage.tsx` | `mobile/app/admin/monetize.tsx` | Store products catalog, gross/net revenue calculations, payment gateway toggle | Adapted desktop store preview into mobile catalog list and revenue cards |
