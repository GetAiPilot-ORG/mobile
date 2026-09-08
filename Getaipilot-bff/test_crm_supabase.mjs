import { createClient } from '@supabase/supabase-js';

const crmUrl = 'https://hhieilvvechtdhhfjomn.supabase.co';
const crmServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQwNjM3MSwiZXhwIjoyMDg5OTgyMzcxfQ.Xfq4xxNiEJ_qW7PBNeWkrQbfssljdJwsaN0aZQ7RVqM';

const supabase = createClient(crmUrl, crmServiceKey);

async function main() {
  console.log('Testing CRM Supabase at:', crmUrl);
  const tables = ['organizations', 'crm_contacts', 'crm_deals', 'crm_activities', 'crm_members', 'crm_users'];
  for (const table of tables) {
    try {
      const { data, count, error } = await supabase.from(table).select('*', { count: 'exact' }).limit(3);
      if (error) {
        console.log(`Table ${table} -> ERROR: ${error.message}`);
      } else {
        console.log(`Table ${table} -> Total count: ${count}, Sample rows: ${data?.length}`);
        if (data && data.length > 0) {
          console.log(`  Sample keys from ${table}:`, Object.keys(data[0]));
          console.log(`  Sample row from ${table}:`, data[0]);
        }
      }
    } catch (e) {
      console.log(`Table ${table} -> EXCEPTION: ${e.message}`);
    }
  }
}

main().catch(console.error);
