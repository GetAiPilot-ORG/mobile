const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uklxlappjcuvdqjvecfh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbHhsYXBwamN1dmRxanZlY2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDcwODMsImV4cCI6MjA4MzcyMzA4M30.v-TvyQrYpttcmCnzT9MkUlBgGXXU3lspZCxCYm-Oil4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: tgMsgs } = await supabase
    .from('tg_chat_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  const userGroups = new Map();
  tgMsgs.forEach((msg) => {
    const uid = String(msg.telegram_user_id || 'unknown');
    if (!userGroups.has(uid)) {
      userGroups.set(uid, []);
    }
    userGroups.get(uid).push(msg);
  });

  console.log(`Old query unique user count: ${userGroups.size}`);
  for (const [uid, msgs] of userGroups.entries()) {
    const latest = msgs[0];
    console.log(`- uid: ${uid} | name: ${latest.user_name} | bot_id: ${latest.bot_id} | date: ${latest.created_at}`);
  }
}

main().catch(console.error);
