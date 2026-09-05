# GetAIPilot Mobile Data Flow Architecture (`DATA_FLOW.md`)

This document maps the real data pathways from PostgreSQL tables and Edge Functions through native services and React hooks directly into screen components.

---

## 1. Authentication & Session Pipeline

```
[Supabase Auth Engine] 
       │ (JWT Token + Session Storage)
       ▼
[mobile/src/services/supabase.ts] 
       │ (AsyncStorage persistent session)
       ▼
[mobile/src/contexts/AuthContext.tsx] 
       ├── User profile state (`profiles` table)
       ├── User role detection (`is_admin`, `role === 'admin'`)
       └── Plan & Subscription tier (`usePlatformSubscription`)
       ▼
[App / Route Gate: app/_layout.tsx]
       ├── If Authenticated -> /(tabs) / Deep links
       └── If Unauthenticated -> /(auth)/login
```

---

## 2. Feature Area Data Flows

### A. Telegram Automation Suite
- **Tables**: `tg_bot_sessions`, `tg_bot_settings`, `tg_forward_mappings`, `tg_landing_pages`, `telegram_user_purchases`, `tg_bot_join_links`, `tg_chatbot_configs`, `tg_reactions`
- **Edge Functions**: `verify-telegram-bot`, `telegram-call-report`, `telegram-reactions`
- **Hooks & Services**: `useAuth`, `usePlatformSubscription`, `supabase.from('tg_*')`
- **Screens**: `mobile/app/products/telegram.tsx`, `mobile/app/(tabs)/activity.tsx`
- **Flow**: User inputs bot token -> Edge Function validates with Telegram Bot API -> session saved to `tg_bot_sessions` -> Realtime telemetry displayed on dashboard.

### B. Multi-Tenant CRM
- **Tables**: `crm_organizations`, `crm_contacts`, `crm_deals`, `crm_pipelines`, `crm_extra_seats`
- **Edge Functions**: `crm-auth`, `setup-organization`, `sync-organization-plan-update`
- **Hooks & Services**: `useCRMProvisioning.ts`, `src/lib/crm-plan-service.ts`, `src/lib/crmAutoProvision.ts`
- **Screens**: `mobile/app/products/crm.tsx`
- **Flow**: User signs up -> `useCRMProvisioning` checks tenant -> creates organization in `crm_organizations` with default stages -> Contacts and deals synced in real-time.

### C. Free Tools & QuickForms
- **Tables**: `quick_forms`, `quick_form_submissions`, `short_links`, `file_links`, `event_links`, `bio_pages`
- **Edge Functions**: `generate-form`, `transcribe-audio`, `fetch-link-preview`
- **Contexts**: `FreeToolsLimitContext.tsx`
- **Screens**: `mobile/app/tools/*`
- **Flow**: Tool invoked -> `FreeToolsLimitContext` checks usage quota against limits -> user creates asset -> saved to Supabase with public slug -> shared via native share sheet.

### D. Billing, Plans & Monetization
- **Tables**: `pricing_plans`, `app_subscription_payments`, `user_billing_profiles`, `user_linked_accounts`
- **Edge Functions**: `create-razorpay-subscription`, `razorpay-subscription-webhook`, `create-linked-account`, `process-payout`
- **Hooks**: `usePlatformSubscription.tsx`, `EarnContext.tsx`
- **Screens**: `mobile/app/account/plans.tsx`, `mobile/app/admin/monetize.tsx`
- **Flow**: User selects plan -> Edge Function creates subscription -> status tracked in `app_subscription_payments` -> webhook grants immediate feature tier access.

### E. Super Admin Controls
- **Tables**: `profiles`, `platform_settings`, `sales_user_leads`, `admin_activity_logs`
- **RPC Functions**: `get_admin_user_stats()`, `get_platform_metrics()`
- **Screens**: `mobile/app/(tabs)/admin.tsx`, `mobile/app/admin/maintenance.tsx`, `mobile/app/admin/sales-leads.tsx`
- **Flow**: User profile verified with `role === 'admin'` or `is_admin === true` -> unlocks admin tab -> live telemetry and maintenance toggles update `platform_settings`.
