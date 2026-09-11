import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
);

async function inspectTg() {
  const { data: botSessions, error: err1 } = await supabase.from('tg_bot_sessions').select('*').limit(2);
  console.log('tg_bot_sessions sample:', JSON.stringify(botSessions || err1, null, 2));

  const { data: landingPages, error: err2 } = await supabase.from('tg_landing_pages').select('*').limit(2);
  console.log('tg_landing_pages sample:', JSON.stringify(landingPages || err2, null, 2));
}

inspectTg();
