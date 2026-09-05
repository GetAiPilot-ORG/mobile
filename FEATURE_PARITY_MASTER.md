# GetAIPilot Feature Parity Master Matrix (`FEATURE_PARITY_MASTER.md`)

This living document tracks 100% of the web routes, pages, components, data sources, and functional capabilities between `getaipilot.in/` (Single Source of Truth) and `mobile/` (React Native + Expo).

---

## 1. Route & Feature Parity Master Table

| Feature Area | Web Route | Web Page Component | Key Web Components | User/Admin | Plan Restriction | Primary Data Source | Mobile Route | Parity Status | Visual Parity | Functional Parity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Workspace Overview** | `/` / `/user-overview` | `Dashboard.tsx` | `UserDashboardOverview.tsx`, `AppNavbar.tsx` | User | All (Free/Pro/Trial) | `profiles`, `app_subscription_payments` | `/(tabs)/index.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **Connected Chats / Inbox** | `/connected-chats` / `/user-dashboard` | `ConnectedPlatformsChatsPage.tsx` | `EcosystemContactsPanel.tsx`, `PlatformTabs` | User | Pro / Growth | `whatsapp_message_usage_logs`, `w_conversations`, Edge functions | `/(tabs)/activity.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **Products Hub** | Sidebar Nav | `AppSidebar.tsx` | `AutomationSection.tsx` | User | All | `profiles` | `/(tabs)/products.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **Telegram Setup Hub** | `/telegram` / `/telegram/setup-hub` | `TelegramSetupHub.tsx` | `TelegramDashboard.tsx`, `TelegramSettings.tsx` | User | Pro / Addon | `tg_bot_sessions`, `tg_bot_settings` | `/products/telegram.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **Telegram AutoForward** | `/telegram/auto-forward` | `AutoforwardDashboard.tsx` | `Autoforward.tsx` | User | Pro / Addon | `tg_forward_mappings`, `tg_forward_logs` | `/products/telegram.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **Telegram Telesub** | `/telegram/telesub/dashboard` | `TelesubDashboard.tsx` | `LandingPagesTable.tsx`, `LinkedAccountSetup.tsx` | User | Monetize / Pro | `tg_landing_pages`, `telegram_user_purchases` | `/products/telegram.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **Telegram Join Tracker** | `/telegram/join-bot` | `ChannelJoinDashboard.tsx` | `JoinPages.tsx`, `CreateJoinPage.tsx` | User | Pro / Addon | `tg_tracker`, `tg_bot_join_links` | `/products/telegram.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **Telegram Auto-Approve** | `/telegram/auto-approve` | `AutoApproveBotDashboard.tsx` | `AutoApproveBot.tsx` | User | Pro / Addon | `tg_auto_approvals` | `/products/telegram.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **Telegram ChatBot AI** | `/telegram/chatbot` | `ChatBotDashboard.tsx` | `ChatBotConfigForm.tsx` | User | Pro / Addon | `tg_chatbot_configs` | `/products/telegram.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **Telegram Reactions** | `/telegram/reactions` | `ReactionsDashboard.tsx` | `ReactionCard.tsx` | User | Pro / Addon | `tg_reactions`, `tg_reaction_plans` | `/products/telegram.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **Telegram Broadcast** | `/telegram/broadcast-msg` | `BroadcastMsgDashboard.tsx` | `BroadcastComposer.tsx` | User | Pro / Addon | `tg_broadcasts` | `/products/telegram.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **WhatsApp Hub** | `/whatsapp` | `ServicePages.tsx` | `WhatsAppBroadcast`, `WhatsAppAutomation` | User | Pro / Addon | `w_accounts`, `w_templates` | `/products/whatsapp.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **Voice Pilot Hub** | `/telecalling` | `TelecallingDashboard.tsx` | `TelecallingAIAgent`, `CallLogs` | User | Voice / Wallet | `tele_wallet_transactions`, `tele_call_reports` | `/products/voice.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **GAP CRM (Multi-tenant)**| `/crm` | `CRMPage.tsx` / `SetupCRM.tsx` | `CRMOverview.tsx`, `CRMContacts.tsx`, `CRMPipelines.tsx` | User | CRM Pro / Addon | `crm_organizations`, `crm_contacts`, `crm_deals` | `/products/crm.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **Social Pilot Hub** | `/social` | `SocialDashboard.tsx` | `AutoPostCampaigns.tsx` | User | Social Growth | `social_accounts`, `social_posts` | `/products/social.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **Free Tools Hub** | `/free-tools` | `FreeToolsOverview.tsx` | `FreeToolsCardGrid.tsx` | User | Free (Rate-limited) | Local / RPCs | `/(tabs)/tools.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **QR Code Generator** | `/free-tools/qr-generator` | `QRCodeGenerator.tsx` | `QRCanvas.tsx`, `ColorPicker.tsx` | Public/User | Free | Client-side Canvas | `/tools/qr-code.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **Link Shortener** | `/free-tools/link-shortener` | `LinkShortener.tsx` | `ShortLinkTable.tsx` | Public/User | Free | `short_links` | `/tools/link-shortener.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **WhatsApp Link Gen** | `/free-tools/whatsapp-link-generator` | `WhatsAppLinkGenerator.tsx` | `PhoneInput.tsx`, `MessagePreview.tsx` | Public/User | Free | Client-side URI | `/tools/whatsapp-link.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **Payment Link Gen** | `/free-tools/payment-link-generator` | `PaymentLinkGenerator.tsx` | `UPIGenerator.tsx` | Public/User | Free | Client-side UPI String | `/tools/payment-link.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **File Linker** | `/free-tools/file-linker` | `FileLinkGenerator.tsx` | `StorageUploader.tsx` | Public/User | Free | Supabase Storage (`file_links`) | `/tools/file-linker.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **Event Links** | `/free-tools/event-links` | `EventLinksDashboard.tsx` | `EventCard.tsx` | Public/User | Free | `event_links` | `/tools/event-links.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **AI Speech to Text** | `/free-tools/speech-to-text` | `AISpeechToText.tsx` | `AudioRecorder.tsx` | Public/User | Free | `transcribe-audio` Edge function | `/tools/speech-to-text.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **Website Audit Tool** | `/free-tools/website-audit` | `WebsiteAuditTool.tsx` | `AuditMetrics.tsx` | Public/User | Free | PageSpeed API / Mock analyzer | `/tools/website-audit.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **QuickForms Hub** | `/free-tools/quick-forms` | `QuickFormsDashboard.tsx` | `FormCard.tsx`, `CreateWithAIModal.tsx` | Public/User | Free | `quick_forms`, `quick_form_submissions` | `/tools/quick-forms.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **Landing Templates** | `/free-tools/landing-templates` | `LandingTemplatesPage.tsx` | `TemplateGrid.tsx`, `CategoryFilters.tsx` | Public/User | Free | Static template registry | `/tools/landing-templates.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **Bio Templates** | `/free-tools/builder/creators-v1` | `BuilderPage.tsx` | `BioCanvas.tsx`, `ThemePicker.tsx` | Public/User | Free | `bio_pages` | `/tools/bio-templates.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **My Designs** | `/free-tools/dashboard` | `UnifiedDashboard.tsx` | `UserDesignsGrid.tsx` | User | Free/Pro | `bio_pages`, `landing_pages` | `/tools/my-designs.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **Login / SSO** | `/login` | `Login.tsx` | `LoginForm.tsx`, `TruecallerButton.tsx` | Public | None | Supabase Auth (`signInWithPassword`) | `/(auth)/login.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **Signup / Register** | `/register` | `Register.tsx` | `RegisterForm.tsx` | Public | None | Supabase Auth (`signUp`) | `/(auth)/signup.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **Forgot Password** | `/reset-password` | `ResetPassword.tsx` | `ResetForm.tsx` | Public | None | Supabase Auth (`resetPasswordForEmail`) | `/(auth)/forgot-password.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **User Account / Profile**| `/profile` | `Profile.tsx` / `UserProfile.tsx` | `ProfileDetails.tsx`, `BillingSection.tsx` | User | All | `profiles`, `user_billing_profiles` | `/(tabs)/account.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **Pricing & Plans** | `/pricing` | `Pricing.tsx` | `PricingCard.tsx`, `PlanToggle.tsx` | Public/User | All | `pricing_plans`, Razorpay Edge fn | `/account/plans.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **Help & Support** | `/help` / `/support` | `HelpCenter.tsx` / `Support.tsx` | `FAQAccordion.tsx`, `TicketForm.tsx` | Public/User | All | Static FAQs & Support RPC | `/account/help.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **App Customization** | Sidebar customizer | `CustomizeSidebarModal.tsx` | `SidebarPreferenceList.tsx` | User | All | `useSidebarPreferences` | `/account/customize.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **Super Admin Panel** | `/admin` | `AdminDashboard.tsx` | `AdminStatsCards.tsx`, `AdminUserTable.tsx` | Admin Only | Superadmin role | `profiles`, `app_subscription_payments`, RPCs | `/(tabs)/admin.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **Admin Maintenance** | `/admin/maintenance` | `MaintenanceControl.tsx` | `KillSwitchToggle.tsx` | Admin Only | Superadmin role | `platform_settings` | `/admin/maintenance.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **Admin Sales Leads** | `/control/sales` | `SalesLeadsPage.tsx` | `SalesLeadsTable.tsx` | Admin Only | Superadmin role | `sales_user_leads` | `/admin/sales-leads.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
| **Earn / Monetization** | `/earn` | `EarnLayout.tsx` / `EarnEarningsPage.tsx` | `SubManagerEarningsStation.tsx`, `PayoutForm` | User | Monetize / Earn | `telegram_user_purchases`, `user_linked_accounts` | `/admin/monetize.tsx` | `IMPLEMENTED` | PASS ✓ | PASS ✓ |
