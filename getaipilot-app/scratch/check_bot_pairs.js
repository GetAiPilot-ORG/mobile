const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uklxlappjcuvdqjvecfh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbHhsYXBwamN1dmRxanZlY2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDcwODMsImV4cCI6MjA4MzcyMzA4M30.v-TvyQrYpttcmCnzT9MkUlBgGXXU3lspZCxCYm-Oil4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const userId = '9f77c84d-89bb-4406-8ca0-e412ebc33f7f';

  const { data: chatbots } = await supabase
    .from('tg_chatbot_configs')
    .select('id, bot_id, user_id, status, created_at')
    .eq('user_id', userId);

  console.log('Chatbot configs:');
  console.log(JSON.stringify(chatbots, null, 2));

  // For each bot_id, find if it exists in tg_tracker
  for (const cb of chatbots) {
    const { data: tr } = await supabase
      .from('tg_tracker')
      .select('id, bot_name, bot_username, status')
      .eq('id', cb.bot_id)
      .maybeSingle();
    console.log(`Bot ${cb.bot_id} in tg_tracker:`, tr);
  }
}

main().catch(console.error);
