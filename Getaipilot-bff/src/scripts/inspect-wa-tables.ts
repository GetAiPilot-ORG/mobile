import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
);

async function inspectWhatsAppTables() {
  console.log('Inspecting WhatsApp tables schema & sample rows...');

  const { data: convSample, error: convErr } = await supabase
    .from('w_conversations')
    .select('*')
  console.log('Cleaning up test message...');
  await supabase
    .from('w_messages')
    .delete()
    .eq('id', 'b9eca865-9937-4d51-807d-3371e42bb999');
  console.log('Deleted test message.');
}

inspectWhatsAppTables();
