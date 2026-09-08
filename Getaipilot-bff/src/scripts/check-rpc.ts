import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
);

async function listAllTables() {
  const { data, error } = await supabase.rpc('get_admin_user_stats');
  console.log('get_admin_user_stats result:', data, error?.message);
}

listAllTables();
