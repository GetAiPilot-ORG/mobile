import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
);

async function listAllTables() {
  const commonNames = [
    'telegram_bots', 'tg_bots', 'bots', 'channels', 'tg_channels',
    'tg_rules', 'auto_forward_rules', 'forward_rules', 'telesub_plans',
    'tg_plans', 'tg_subscriptions', 'telesub_subscriptions',
    'tg_broadcasts', 'broadcast_campaigns', 'tg_reactions',
    'tg_auto_approve', 'tg_analytics', 'tg_campaigns',
    'tg_communities', 'communities'
  ];

  for (const t of commonNames) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    if (!error) {
      console.log(`FOUND TABLE: ${t} (rows: ${count})`);
    }
  }
}

listAllTables();
