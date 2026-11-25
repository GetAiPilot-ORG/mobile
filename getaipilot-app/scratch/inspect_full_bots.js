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

  console.log('ALL COLUMNS of tg_chatbot_configs for user:');
  console.log(JSON.stringify(chatbots, null, 2));

  const { data: trackers } = await supabase
    .from('tg_tracker')
    .select('*')
    .eq('user_id', userId);
  console.log('\nALL COLUMNS of tg_tracker for user:');
  console.log(JSON.stringify(trackers, null, 2));
}

main().catch(console.error);
