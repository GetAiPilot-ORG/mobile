import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
);

async function inspectAllColumns() {
  const userId = '9f77c84d-89bb-4406-8ca0-e412ebc33f7f';

  const { data: bots } = await supabase
    .from('tg_tracker')
    .select('*')
    .eq('user_id', userId);

  console.log('=== ALL 10 BOTS IN TG_TRACKER FOR THIS USER ===');
  (bots || []).forEach((b) => {
    console.log(`Bot: ${b.bot_name} (@${b.bot_username})`);
    console.log(`  ID: ${b.id}`);
    console.log(`  Status: ${b.status}`);
    console.log(`  Channel Name: ${b.channel_name}`);
    console.log(`  Channel ID: ${b.channel_id}`);
    console.log(`  is_detecting: ${b.is_detecting}`);
    console.log(`  bot_file_id: ${b.bot_file_id}`);
    console.log(`  created_at: ${b.created_at}`);
    console.log('---');
  });
}

inspectAllColumns();
