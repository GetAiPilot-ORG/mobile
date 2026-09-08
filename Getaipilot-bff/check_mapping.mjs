import { createClient } from '@supabase/supabase-js';

const hubUrl = 'https://uklxlappjcuvdqjvecfh.supabase.co';
const hubKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbHhsYXBwamN1dmRxanZlY2ZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE0NzA4MywiZXhwIjoyMDgzNzIzMDgzfQ.8raDYx4BqeVELD691E720qBORhWEI4L68c_ED2JIt5w';
const hubSupabase = createClient(hubUrl, hubKey);

const crmUrl = 'https://hhieilvvechtdhhfjomn.supabase.co';
const crmKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQwNjM3MSwiZXhwIjoyMDg5OTgyMzcxfQ.Xfq4xxNiEJ_qW7PBNeWkrQbfssljdJwsaN0aZQ7RVqM';
const crmSupabase = createClient(crmUrl, crmKey);

async function checkTenantMapping() {
  console.log('--- Checking Hub Orgs vs CRM Orgs ---');
  const { data: hubOrgs } = await hubSupabase.from('organizations').select('id, name, slug').limit(10);
  console.log('Hub Orgs:', hubOrgs);

  const { data: crmOrgs } = await crmSupabase.from('organizations').select('id, name, slug, hub_user_id').limit(10);
  console.log('CRM Orgs:', crmOrgs);

  // Check specific test accounts
  const testEmails = ['shwetchourey3@gmail.com', 'test@getaipilot.com'];
  for (const email of testEmails) {
    console.log(`\nMapping for email: ${email}`);
    const { data: hubUser } = await hubSupabase.from('organization_members').select('*').eq('email', email);
    console.log('Hub members for email:', hubUser);

    const { data: crmMembers } = await crmSupabase.from('crm_members').select('*').ilike('email', email);
    console.log('CRM members for email:', crmMembers);

    if (hubUser && hubUser.length > 0) {
      const hubOrgId = hubUser[0].organization_id;
      const { data: crmOrgById } = await crmSupabase.from('organizations').select('id, name, slug').eq('id', hubOrgId).maybeSingle();
      console.log(`CRM Org matching Hub orgId (${hubOrgId}):`, crmOrgById);
    }
  }

  // Check where the deals/contacts are located
  const { data: contacts } = await crmSupabase.from('crm_contacts').select('id, org_id, first_name, email, phone').limit(5);
  console.log('\nCRM contacts org_ids:', contacts);
  if (contacts && contacts.length > 0) {
    const orgId = contacts[0].org_id;
    const { data: org } = await crmSupabase.from('organizations').select('id, name, slug, hub_user_id').eq('id', orgId).single();
    console.log('Org holding contacts:', org);
  }
}

checkTenantMapping().catch(console.error);
