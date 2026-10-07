import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
);

async function checkAccountScopedData() {
  const userId = '9f77c84d-89bb-4406-8ca0-e412ebc33f7f';

  console.log('=== BOTS OWNED BY THIS ACCOUNT (tg_tracker) ===');
  const { data: bots } = await supabase
    .from('tg_tracker')
    .select('id, bot_name, bot_username, channel_id, channel_name, status, created_at')
    .eq('user_id', userId);
  console.log(`Count: ${bots?.length || 0}`);
  console.log(JSON.stringify(bots, null, 2));

  console.log('\n=== COMMUNITIES OWNED BY THIS ACCOUNT (tg_communities) ===');
  const { data: comms } = await supabase
    .from('tg_communities')
    .select('id, title, telegram_chat_id, join_mode, invite_link, member_count, created_at')
    .eq('user_id', userId);
  console.log(`Count: ${comms?.length || 0}`);
  console.log(JSON.stringify(comms, null, 2));

  console.log('\n=== TRACKING LINKS / LANDING PAGES (tg_landing_pages) ===');
  const { data: lps } = await supabase
    .from('tg_landing_pages')
    .select('id, title, slug, is_active, created_at, view_count, channel_id')
    .eq('user_id', userId);
  console.log(`Count: ${lps?.length || 0}`);
  console.log(JSON.stringify(lps, null, 2));

  if (bots && bots.length > 0) {
    const botIds = bots.map(b => b.id);
    console.log('\n=== SESSIONS FOR THIS ACCOUNT BOTS (tg_bot_sessions) ===');
    const { data: sessions } = await supabase
      .from('tg_bot_sessions')
      .select('id, bot_id, telegram_user_id, user_name, created_at')
      .in('bot_id', botIds);
    console.log(`Count: ${sessions?.length || 0}`);
    console.log(JSON.stringify(sessions, null, 2));
  }
}

checkAccountScopedData();
