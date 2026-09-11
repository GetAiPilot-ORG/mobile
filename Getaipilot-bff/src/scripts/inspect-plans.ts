import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
);

async function inspectData() {
  const { data: plans } = await supabase.from('tg_plans').select('*').limit(3);
  console.log('tg_plans:', JSON.stringify(plans, null, 2));

  const { data: communities } = await supabase.from('tg_communities').select('*').limit(3);
  console.log('tg_communities:', JSON.stringify(communities, null, 2));
}

inspectData();
