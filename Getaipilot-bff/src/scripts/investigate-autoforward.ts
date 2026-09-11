import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
);

async function investigateAutoforwarding() {
  console.log('=== 1. SEARCHING SUPABASE TABLES FOR AUTOFORWARDING ===');

  const candidateTables = [
    'tg_auto_forward',
    'tg_autoforward',
    'tg_forwarding_rules',
    'tg_forward_rules',
    'tg_forward_tasks',
    'tg_forward_logs',
    'tg_rules',
    'forwarding_rules',
    'forward_rules',
    'auto_forward_rules',
    'autoforward_rules',
    'tg_channel_forwards',
    'tg_sessions',
    'tg_user_sessions',
    'tg_clients',
    'telegram_sessions'
  ];

  for (const table of candidateTables) {
    try {
      const { data, count, error } = await supabase.from(table).select('*', { count: 'exact' }).limit(3);
      if (!error) {
        console.log(`✅ Table '${table}' exists! Rows: ${count}`);
        if (data && data.length > 0) {
          console.log(`   Sample:`, JSON.stringify(data[0], null, 2));
        }
      }
    } catch (e) {
      // ignore
    }
  }

  console.log('\n=== 2. TESTING UPSTREAM TELEGRAM SERVICE (https://tg.getaipilot.in) ===');
  const upstreamUrl = env.TELEGRAM_SERVICE_URL || 'https://tg.getaipilot.in';

  const testEndpoints = [
    '/',
    '/api',
    '/api/health',
    '/api/status',
    '/api/autoforward',
    '/api/forward',
    '/api/forwarding',
    '/api/rules',
    '/api/telegram/rules',
    '/api/telegram/autoforward',
    '/api/channels',
  ];

  for (const ep of testEndpoints) {
    try {
      const res = await fetch(`${upstreamUrl.replace(/\/$/, '')}${ep}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      const text = await res.text();
      console.log(`Endpoint ${ep} -> Status: ${res.status}, Type: ${res.headers.get('content-type')}, Preview: ${text.substring(0, 150)}`);
    } catch (err: any) {
      console.log(`Endpoint ${ep} -> Error: ${err.message}`);
    }
  }
}

investigateAutoforwarding();
