import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
);

async function diagnoseSubManager() {
  const userId = '9f77c84d-89bb-4406-8ca0-e412ebc33f7f';

  console.log('=== 1. TG_LANDING_PAGES FOR GETAIPILOT ===');
  const { data: lps } = await supabase
    .from('tg_landing_pages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  console.log('Count:', lps?.length || 0);
  console.log(JSON.stringify(lps, null, 2));

  console.log('\n=== 2. TG_PLANS FOR GETAIPILOT ===');
  const { data: plans } = await supabase
    .from('tg_plans')
    .select('*')
    .eq('user_id', userId);
  console.log('Count:', plans?.length || 0);
  console.log(JSON.stringify(plans, null, 2));

  console.log('\n=== 3. TG_COMMUNITIES (Channels to link in Community dropdown) ===');
  const { data: comms } = await supabase
    .from('tg_communities')
    .select('*')
    .eq('user_id', userId);
  console.log('Count:', comms?.length || 0);
  console.log(JSON.stringify(comms, null, 2));

  console.log('\n=== 4. PAYOUT / BANK ACCOUNT DETAILS in profiles ===');
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, business_name, checklist_progress, subscription')
    .eq('id', userId)
    .maybeSingle();
  console.log('Profile:', JSON.stringify(profile, null, 2));
}

diagnoseSubManager();
