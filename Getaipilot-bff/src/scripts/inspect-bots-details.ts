import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
);

async function inspectBotsDetails() {
  const userId = '9f77c84d-89bb-4406-8ca0-e412ebc33f7f';

  const { data: bots } = await supabase
    .from('tg_tracker')
    .select('*')
    .eq('user_id', userId);

  console.log('=== ALL BOTS FOR GETAIPILOT ===');
  (bots || []).forEach((b, i) => {
    console.log(`\n[BOT ${i + 1}] ID: ${b.id}`);
    console.log(`  Name: ${b.bot_name}`);
    console.log(`  Username: ${b.bot_username}`);
    console.log(`  Channel Name: ${b.channel_name}`);
    console.log(`  Channel ID: ${b.channel_id}`);
    console.log(`  Status: ${b.status}`);
    console.log(`  Created: ${b.created_at}`);
    console.log(`  Other keys:`, Object.keys(b).filter(k => b[k] !== null));
  });

  // Check if there are other channels mapped in tg_communities or if channel_id is an array/string
  const { data: comms } = await supabase.from('tg_communities').select('*');
  console.log('\n=== ALL TG_COMMUNITIES ===');
  console.log(JSON.stringify(comms, null, 2));
}

inspectBotsDetails();
