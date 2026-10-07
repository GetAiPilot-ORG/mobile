import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
);

async function checkDb() {
  console.log('=== 1. TG_TRACKER (Connected Bots) ===');
  const { data: trackerBots, error: e1 } = await supabase.from('tg_tracker').select('*').limit(10);
  console.log('Bots count:', trackerBots?.length || 0, 'Error:', e1?.message || 'none');
  if (trackerBots && trackerBots.length > 0) {
    console.log(JSON.stringify(trackerBots, null, 2));
  }

  console.log('\n=== 2. TG_COMMUNITIES (Mapped Channels) ===');
  const { data: communities, error: e2 } = await supabase.from('tg_communities').select('*').limit(10);
  console.log('Communities count:', communities?.length || 0, 'Error:', e2?.message || 'none');
  if (communities && communities.length > 0) {
    console.log(JSON.stringify(communities, null, 2));
  }

  console.log('\n=== 3. TG_LANDING_PAGES / TRACKER LINKS ===');
  const { data: lps, error: e3 } = await supabase.from('tg_landing_pages').select('*').limit(10);
  console.log('Landing pages count:', lps?.length || 0, 'Error:', e3?.message || 'none');
  if (lps && lps.length > 0) {
    console.log(JSON.stringify(lps, null, 2));
  }

  console.log('\n=== 4. TG_BOT_SESSIONS (User Starts / Joins) ===');
  const { data: sessions, error: e4 } = await supabase.from('tg_bot_sessions').select('*').limit(10);
  console.log('Sessions count:', sessions?.length || 0, 'Error:', e4?.message || 'none');
  if (sessions && sessions.length > 0) {
    console.log(JSON.stringify(sessions, null, 2));
  }

  console.log('\n=== 5. PROFILES (Users) ===');
  const { data: profiles, error: e5 } = await supabase.from('profiles').select('id, full_name, email, phone, role').limit(10);
  console.log('Profiles count:', profiles?.length || 0, 'Error:', e5?.message || 'none');
  if (profiles && profiles.length > 0) {
    console.log(JSON.stringify(profiles, null, 2));
  }
}

checkDb();
