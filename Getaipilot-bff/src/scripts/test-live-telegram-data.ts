import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
);

async function testLiveTelegramData() {
  console.log('====================================================');
  console.log('1. LIVE DATA FROM SUPABASE PRODUCTION DATABASE');
  console.log('====================================================');

  // 1. tg_user_sessions
  const { data: userSessions, count: sessionCount } = await supabase
    .from('tg_user_sessions')
    .select('*', { count: 'exact' });
  console.log(`\n[tg_user_sessions] Total rows: ${sessionCount}`);
  console.log(JSON.stringify(userSessions, null, 2));

  // 2. tg_communities
  const { data: communities, count: commCount } = await supabase
    .from('tg_communities')
    .select('*', { count: 'exact' });
  console.log(`\n[tg_communities] Total rows: ${commCount}`);
  console.log(JSON.stringify(communities, null, 2));

  // 3. tg_landing_pages
  const { data: landingPages, count: lpCount } = await supabase
    .from('tg_landing_pages')
    .select('id, user_id, community_id, slug, title, is_active, channel_id, view_count', { count: 'exact' });
  console.log(`\n[tg_landing_pages] Total rows: ${lpCount}`);
  console.log(JSON.stringify(landingPages, null, 2));

  // 4. tg_plans
  const { data: plans, count: planCount } = await supabase
    .from('tg_plans')
    .select('*', { count: 'exact' });
  console.log(`\n[tg_plans] Total rows: ${planCount}`);
  console.log(JSON.stringify(plans, null, 2));

  console.log('\n====================================================');
  console.log('2. LIVE RESPONSES FROM tg.getaipilot.in');
  console.log('====================================================');

  const upstreamUrl = env.TELEGRAM_SERVICE_URL || 'https://tg.getaipilot.in';

  // Test root / health
  try {
    const rootRes = await fetch(`${upstreamUrl}/`);
    const rootData = await rootRes.json();
    console.log('\n[GET /] Response:');
    console.log(JSON.stringify(rootData, null, 2));
  } catch (e: any) {
    console.log('\n[GET /] Error:', e.message);
  }

  // Test /telegram/status without auth header
  try {
    const statusRes = await fetch(`${upstreamUrl}/telegram/status`);
    const statusData = await statusRes.json();
    console.log('\n[GET /telegram/status (No Auth)] Response:');
    console.log(JSON.stringify(statusData, null, 2));
  } catch (e: any) {
    console.log('\n[GET /telegram/status] Error:', e.message);
  }

  // Test /telegram/status with service role / test header
  try {
    const authStatusRes = await fetch(`${upstreamUrl}/telegram/status`, {
      headers: {
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    const authStatusData = await authStatusRes.json();
    console.log('\n[GET /telegram/status (With Bearer Token)] Status:', authStatusRes.status);
    console.log(JSON.stringify(authStatusData, null, 2));
  } catch (e: any) {
    console.log('\n[GET /telegram/status (With Bearer)] Error:', e.message);
  }
}

testLiveTelegramData();
