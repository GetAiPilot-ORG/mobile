const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uklxlappjcuvdqjvecfh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbHhsYXBwamN1dmRxanZlY2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDcwODMsImV4cCI6MjA4MzcyMzA4M30.v-TvyQrYpttcmCnzT9MkUlBgGXXU3lspZCxCYm-Oil4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const userId = '9f77c84d-89bb-4406-8ca0-e412ebc33f7f';

  const { data: chatbots } = await supabase
    .from('tg_chatbot_configs')
    .select('*')
    .eq('user_id', userId);

  console.log('Chatbot configs for user:');
  chatbots.forEach(b => {
    console.log({
      id: b.id,
      bot_id: b.bot_id,
      bot_name: b.bot_name,
      bot_username: b.bot_username,
      status: b.status,
      chats_count: b.chats_count,
      created_at: b.created_at
    });
  });
}

main().catch(console.error);
