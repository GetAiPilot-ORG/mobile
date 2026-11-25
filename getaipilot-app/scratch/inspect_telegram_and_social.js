const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uklxlappjcuvdqjvecfh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbHhsYXBwamN1dmRxanZlY2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDcwODMsImV4cCI6MjA4MzcyMzA4M30.v-TvyQrYpttcmCnzT9MkUlBgGXXU3lspZCxCYm-Oil4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('--- Inspecting tg_chat_messages ---');
  const { data: msgs, error: msgsErr } = await supabase
    .from('tg_chat_messages')
    .select('id, telegram_user_id, user_name, role, content, bot_id, created_at')
    .order('created_at', { ascending: false });

  if (msgsErr) console.error('Error fetching tg_chat_messages:', msgsErr);
  else {
    console.log(`Total messages in tg_chat_messages: ${msgs.length}`);
    const uniqueUsers = new Map();
    msgs.forEach(m => {
      const uid = String(m.telegram_user_id || 'unknown');
      if (!uniqueUsers.has(uid)) {
        uniqueUsers.set(uid, {
          uid,
          user_name: m.user_name,
          bot_id: m.bot_id,
          count: 0,
          latest_msg: m.content,
          created_at: m.created_at
        });
      }
      uniqueUsers.get(uid).count++;
    });
    console.log(`Unique users in tg_chat_messages: ${uniqueUsers.size}`);
    console.log(JSON.stringify(Array.from(uniqueUsers.values()), null, 2));
  }

  console.log('\n--- Inspecting tg_chatbot_configs ---');
  const { data: bots, error: botsErr } = await supabase
    .from('tg_chatbot_configs')
    .select('*');
  if (botsErr) console.error('Error fetching tg_chatbot_configs:', botsErr);
  else {
    console.log(`Total bots in tg_chatbot_configs: ${bots.length}`);
    console.log(JSON.stringify(bots.map(b => ({ id: b.id, bot_id: b.bot_id, bot_name: b.bot_name, user_id: b.user_id })), null, 2));
  }

  console.log('\n--- Inspecting tg_tracker ---');
  const { data: trackers, error: trackErr } = await supabase
    .from('tg_tracker')
    .select('id, bot_name, bot_username, user_id');
  if (trackErr) console.error('Error fetching tg_tracker:', trackErr);
  else {
    console.log(`Total trackers in tg_tracker: ${trackers.length}`);
    console.log(JSON.stringify(trackers, null, 2));
  }

  console.log('\n--- Checking for social / instagram tables in supabase ---');
  const socialTables = [
    'instagram_conversations',
    'instagram_messages',
    'social_conversations',
    'social_messages',
    'social_accounts',
    'social_posts',
    'instapilot_conversations',
    'instapilot_messages'
  ];
  for (const tbl of socialTables) {
    const { data, error } = await supabase.from(tbl).select('*').limit(2);
    if (!error) {
      console.log(`Table EXISTS: ${tbl}, rows: ${data ? data.length : 0}`);
    }
  }
}

main().catch(console.error);
