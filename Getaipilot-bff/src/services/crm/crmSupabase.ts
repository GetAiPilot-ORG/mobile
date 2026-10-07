import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../../config/env.js';

const url = env.CRM_SUPABASE_URL || process.env.CRM_SUPABASE_URL;
const serviceKey = env.CRM_SUPABASE_SERVICE_ROLE_KEY || process.env.CRM_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error('CRM Supabase configuration missing: CRM_SUPABASE_URL or CRM_SUPABASE_SERVICE_ROLE_KEY is not defined.');
}

export const crmSupabase: SupabaseClient = createClient(url, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
