const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uklxlappjcuvdqjvecfh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbHhsYXBwamN1dmRxanZlY2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDcwODMsImV4cCI6MjA4MzcyMzA4M30.v-TvyQrYpttcmCnzT9MkUlBgGXXU3lspZCxCYm-Oil4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const userId = 'd6261cf1-6a8f-4112-9cd7-a9b46b1ca980';
  console.log(`Checking bots for user ${userId}:`);

  const { data: chatbots } = await supabase
    .from('tg_chatbot_configs')
    .select('*')
    .eq('user_id', userId);
  console.log('tg_chatbot_configs:', chatbots);

  const { data: trackerBots } = await supabase
    .from('tg_tracker')
    .select('*')
    .eq('user_id', userId);
  console.log('tg_tracker:', trackerBots);

  const botIds = [
    ...(chatbots || []).map(b => b.bot_id || b.id),
    ...(trackerBots || []).map(b => b.id)
  ];
  console.log('All bot IDs for user:', botIds);

  const { data: msgs } = await supabase
    .from('tg_chat_messages')
    .select('*')
    .in('bot_id', botIds)
    .order('created_at', { ascending: false });

  console.log(`\nTotal messages for user's bots: ${msgs ? msgs.length : 0}`);

  const userMap = new Map();
  msgs.forEach(m => {
    const uid = String(m.telegram_user_id || 'unknown');
    if (!userMap.has(uid)) {
      userMap.set(uid, {
        user_name: m.user_name,
        bot_id: m.bot_id,
        count: 0,
        latest_msg: m.content,
        created_at: m.created_at
      });
    }
    userMap.get(uid).count++;
  });

  console.log(`Unique telegram users for user's bots: ${userMap.size}`);
  for (const [uid, u] of userMap.entries()) {
    console.log(`User ID: ${uid} | Name: ${u.user_name} | BotId: ${u.bot_id} | Created: ${u.created_at} | Msg: ${u.latest_msg?.slice(0, 45)}`);
  }
}

main().catch(console.error);
