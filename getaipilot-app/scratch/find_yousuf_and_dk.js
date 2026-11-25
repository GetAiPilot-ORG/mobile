const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uklxlappjcuvdqjvecfh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbHhsYXBwamN1dmRxanZlY2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDcwODMsImV4cCI6MjA4MzcyMzA4M30.v-TvyQrYpttcmCnzT9MkUlBgGXXU3lspZCxCYm-Oil4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Searching for Yousuf Khan and Dk and S K in tg_chat_messages:');
  const { data: tgSearch } = await supabase
    .from('tg_chat_messages')
    .select('*')
    .or('user_name.ilike.%Yousuf%,user_name.ilike.%Dk%,user_name.ilike.%S K%,content.ilike.%Yousuf%');
  console.log('tg_chat_messages results:', tgSearch);

  console.log('\nSearching in all tables for Yousuf or Dk:');
  // Check w_conversations, w_contacts
  const { data: wContacts } = await supabase
    .from('w_contacts')
    .select('*')
    .or('name.ilike.%Yousuf%,name.ilike.%Dk%,name.ilike.%S K%');
  console.log('w_contacts results:', wContacts);

  // Check w_conversations
  const { data: wConvs } = await supabase
    .from('w_conversations')
    .select('*')
    .limit(10);
  console.log('w_conversations sample:', wConvs);
}

main().catch(console.error);
