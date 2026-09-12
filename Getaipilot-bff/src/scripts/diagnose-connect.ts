import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
);

async function diagnoseConnectSection() {
  const userId = '9f77c84d-89bb-4406-8ca0-e412ebc33f7f';

  console.log('=== 1. tg_tracker for getaipilot ===');
  const { data: trackerBots } = await supabase
    .from('tg_tracker')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  console.log('Count:', trackerBots?.length || 0);
  console.log(JSON.stringify(trackerBots, null, 2));

  console.log('\n=== 2. Check all tables with "channel" or "bot" or "tg_" ===');
  const tables = [
    'tg_tracker',
    'tg_communities',
    'tg_bot_sessions',
    'tg_forward_mappings',
    'tg_landing_pages',
    'tg_plans',
    'tg_user_sessions',
    'tele_call_reports',
    'tg_chatbot_configs',
  ];

  for (const t of tables) {
    try {
      const { data, error } = await supabase.from(t).select('*').limit(2);
      console.log(`Table ${t}: ${error ? 'ERROR: ' + error.message : 'OK, rows: ' + data?.length}`);
    } catch (e: any) {
      console.log(`Table ${t}: exception ${e.message}`);
    }
  }
}

diagnoseConnectSection();
