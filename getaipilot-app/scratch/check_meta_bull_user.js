const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uklxlappjcuvdqjvecfh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbHhsYXBwamN1dmRxanZlY2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDcwODMsImV4cCI6MjA4MzcyMzA4M30.v-TvyQrYpttcmCnzT9MkUlBgGXXU3lspZCxCYm-Oil4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const userId = '9f77c84d-89bb-4406-8ca0-e412ebc33f7f';
  console.log(`Checking bots for user ${userId}:`);

  const { data: chatbots } = await supabase
    .from('tg_chatbot_configs')
    .select('*')
    .eq('user_id', userId);
  console.log('tg_chatbot_configs:', chatbots.map(b => ({ id: b.id, bot_id: b.bot_id, bot_name: b.bot_name })));

  const { data: trackerBots } = await supabase
    .from('tg_tracker')
    .select('*')
    .eq('user_id', userId);
  console.log('tg_tracker:', trackerBots.map(b => ({ id: b.id, bot_name: b.bot_name })));

  // Look at what inboxApi.ts did:
  const userBotIds = new Set();
  (chatbots || []).forEach(b => {
    if (b.bot_id) userBotIds.add(String(b.bot_id));
    if (b.id) userBotIds.add(String(b.id));
  });
  (trackerBots || []).forEach(b => {
    if (b.id) userBotIds.add(String(b.id));
  });

  console.log('userBotIds set:', Array.from(userBotIds));

  const { data: tgMsgs } = await supabase
    .from('tg_chat_messages')
    .select('*')
    .in('bot_id', Array.from(userBotIds))
    .order('created_at', { ascending: false });

  console.log(`Total messages in tg_chat_messages: ${tgMsgs.length}`);

  // In inboxApi.ts:
  // userGroups.forEach((msgs, uid) => { ... tgList.push({ id: `tg_conv_${uid}_bot_${botId}` }) })
  const userGroups = new Map();
  tgMsgs.forEach(m => {
    const uid = String(m.telegram_user_id || 'unknown');
    if (!userGroups.has(uid)) userGroups.set(uid, []);
    userGroups.get(uid).push(m);
  });

  console.log(`\nUnique users grouped by uid only: ${userGroups.size}`);
  for (const [uid, msgs] of userGroups.entries()) {
    const latest = msgs[0];
    console.log(`- uid: ${uid} | name: ${latest.user_name} | bot_id: ${latest.bot_id} | date: ${latest.created_at} | msg: ${latest.content?.slice(0, 40)}`);
  }
}

main().catch(console.error);
