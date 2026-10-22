const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uklxlappjcuvdqjvecfh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbHhsYXBwamN1dmRxanZlY2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDcwODMsImV4cCI6MjA4MzcyMzA4M30.v-TvyQrYpttcmCnzT9MkUlBgGXXU3lspZCxCYm-Oil4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: msgs } = await supabase
    .from('tg_chat_messages')
    .select('id, telegram_user_id, user_name, role, content, bot_id, created_at')
    .order('created_at', { ascending: false });

  console.log(`Total messages: ${msgs.length}`);

  // Group by bot_id
  const byBot = {};
  msgs.forEach(m => {
    const b = m.bot_id || 'NO_BOT_ID';
    if (!byBot[b]) byBot[b] = { count: 0, users: new Map() };
    byBot[b].count++;
    const uid = String(m.telegram_user_id || 'unknown');
    if (!byBot[b].users.has(uid)) {
      byBot[b].users.set(uid, {
        user_name: m.user_name,
        latest_msg: m.content,
        created_at: m.created_at
      });
    }
  });

  for (const [botId, data] of Object.entries(byBot)) {
    console.log(`\n=== Bot ID: ${botId} (Total msgs: ${data.count}, Unique users: ${data.users.size}) ===`);
    for (const [uid, udata] of data.users.entries()) {
      console.log(`  User ID: ${uid} | Name: ${udata.user_name} | Created: ${udata.created_at} | Msg: ${udata.latest_msg?.slice(0, 40)}`);
    }
  }
}

main().catch(console.error);
