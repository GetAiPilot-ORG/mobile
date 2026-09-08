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
    .limit(2);
  console.log('w_conversations sample:', convSample, convErr?.message);

  const { data: msgSample, error: msgErr } = await supabase
    .from('w_messages')
    .select('*')
    .limit(2);
  console.log('w_messages sample:', msgSample, msgErr?.message);

  const { data: cntSample, error: cntErr } = await supabase
    .from('w_contacts')
    .select('*')
    .limit(2);
  console.log('w_contacts sample:', cntSample, cntErr?.message);
}

inspectWhatsAppTables();
