import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gkyilicraflkgcfgqypc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdreWlsaWNyYWZsa2djZmdxeXBjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjA4Mzc0NiwiZXhwIjoyMTAxNjU5NzQ2fQ.DYf3RkJp3F8WFPNio6XiUVCYv2Fc7WztfKeLwI4N3eI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('=== Recent Campaigns Details ===');
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);

  console.log(JSON.stringify(campaigns, null, 2));

  if (campaigns && campaigns.length > 0) {
    for (const c of campaigns) {
      console.log(`\n--- Jobs for Campaign: ${c.name} (${c.id}) ---`);
      const { data: jobs } = await supabase
        .from('campaign_dispatch_jobs')
        .select('*')
        .eq('campaign_id', c.id);
      console.log(JSON.stringify(jobs, null, 2));

      console.log(`\n--- Assistant for Campaign: ${c.assistant_id} ---`);
      const { data: ast } = await supabase
        .from('assistants')
        .select('*')
        .eq('id', c.assistant_id);
      console.log(JSON.stringify(ast, null, 2));

      console.log(`\n--- Phone Number for Campaign: ${c.phone_number_id} ---`);
      const { data: num } = await supabase
        .from('phone_numbers')
        .select('*')
        .eq('id', c.phone_number_id);
      console.log(JSON.stringify(num, null, 2));
    }
  }
}

main().catch(console.error);
