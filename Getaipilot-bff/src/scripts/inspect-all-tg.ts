import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
);

async function inspectAllTgTables() {
  const tables = [
    'tg_communities',
    'tg_landing_pages',
    'tg_plans',
    'tg_bot_sessions',
    'telegram_user_purchases',
    'tele_assistants',
    'tele_call_reports',
    'tele_wallet_transactions'
  ];

  for (const table of tables) {
    const { data, count, error } = await supabase.from(table).select('*').limit(1);
    if (!error) {
      console.log(`Table: ${table} | Rows: ${count ?? (data ? data.length : 0)}`);
      if (data && data.length > 0) {
        console.log(`  Columns:`, Object.keys(data[0]));
      }
    }
  }
}

inspectAllTgTables();
