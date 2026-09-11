import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
);

async function searchChannels() {
  console.log('=== SEARCHING FOR TEST BOT CHANNEL, JUNCTION, SHWET ===');
  
  const { data: forwardMappings } = await supabase.from('tg_forward_mappings').select('*');
  console.log('tg_forward_mappings:', JSON.stringify(forwardMappings, null, 2));

  const { data: allCommunities } = await supabase.from('tg_communities').select('*');
  console.log('tg_communities:', JSON.stringify(allCommunities, null, 2));

  const { data: allLandingPages } = await supabase.from('tg_landing_pages').select('*');
  console.log('tg_landing_pages:', JSON.stringify(allLandingPages, null, 2));
}

searchChannels();
