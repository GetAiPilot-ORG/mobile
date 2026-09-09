import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
);

async function inspectTables() {
  console.log('Inspecting Supabase database tables...');

  const tablesToCheck = [
    'profiles',
    'app_user_subscriptions',
    'app_subscription_payments',
    'w_accounts',
    'w_conversations',
    'w_messages',
    'w_contacts',
    'crm_organizations',
    'crm_leads',
    'crm_deals',
    'crm_contacts',
    'tele_assistants',
    'tele_call_reports',
    'tele_wallet_transactions',
    'social_accounts',
    'social_posts',
    'tg_bot_sessions',
    'tg_landing_pages',
    'telegram_user_purchases',
  ];

  for (const table of tablesToCheck) {
    try {
      const { data, count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ Table '${table}': ${error.message}`);
      } else {
        console.log(`✅ Table '${table}': Available (count: ${count ?? 0})`);
      }
    } catch (err: any) {
      console.log(`❌ Table '${table}': ${err.message}`);
    }
  }
}

inspectTables();
