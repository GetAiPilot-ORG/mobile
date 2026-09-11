import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
);

async function checkTracker() {
  const { data: trackerBots } = await supabase.from('tg_tracker').select('id, user_id, bot_name, bot_username, channel_id, channel_name, status, created_at');
  console.log('=== TG_TRACKER BOT RECORDS ===');
  console.log(JSON.stringify(trackerBots, null, 2));
}

checkTracker();
