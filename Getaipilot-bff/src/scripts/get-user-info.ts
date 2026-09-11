import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
);

async function getUserInfo() {
  console.log('=== USER PROFILE FOR 9f77c84d-89bb-4406-8ca0-e412ebc33f7f ===');
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', '9f77c84d-89bb-4406-8ca0-e412ebc33f7f')
    .maybeSingle();

  console.log('Profile:', JSON.stringify(profile, null, 2));

  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const matchedAuth = authUsers?.users?.find(u => u.id === '9f77c84d-89bb-4406-8ca0-e412ebc33f7f');
  console.log('Auth user details:', JSON.stringify({
    id: matchedAuth?.id,
    email: matchedAuth?.email,
    phone: matchedAuth?.phone,
    user_metadata: matchedAuth?.user_metadata,
    created_at: matchedAuth?.created_at,
  }, null, 2));

  console.log('\n=== ALL TOP ADMIN/OWNER ACCOUNTS ===');
  const topUsers = (authUsers?.users || []).slice(0, 5).map(u => ({
    id: u.id,
    email: u.email,
    name: u.user_metadata?.full_name || u.user_metadata?.name || u.email,
  }));
  console.log(JSON.stringify(topUsers, null, 2));
}

getUserInfo();
