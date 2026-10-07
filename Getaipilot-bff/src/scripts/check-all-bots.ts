import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
);

async function checkBots() {
  const { data: trackerBots } = await supabase.from('tg_tracker').select('*');
  console.log('ALL TG_TRACKER BOTS IN DB:', JSON.stringify(trackerBots, null, 2));

  const { data: communities } = await supabase.from('tg_communities').select('*');
  console.log('ALL TG_COMMUNITIES IN DB:', JSON.stringify(communities, null, 2));
}

checkBots();
