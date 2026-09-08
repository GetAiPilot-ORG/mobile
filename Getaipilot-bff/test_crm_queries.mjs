import { createClient } from '@supabase/supabase-js';

const crmUrl = 'https://hhieilvvechtdhhfjomn.supabase.co';
const crmServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQwNjM3MSwiZXhwIjoyMDg5OTgyMzcxfQ.Xfq4xxNiEJ_qW7PBNeWkrQbfssljdJwsaN0aZQ7RVqM';
const crmSupabase = createClient(crmUrl, crmServiceKey);

async function resolveCrmOrg(user) {
  console.log('\nResolving CRM org for:', user.email);

  // 1. Check organizations by hub_user_id
  const { data: orgByHubUser } = await crmSupabase
    .from('organizations')
    .select('id, name, slug')
    .eq('hub_user_id', user.user_id)
    .maybeSingle();

  if (orgByHubUser) {
    console.log('Found org by hub_user_id:', orgByHubUser);
    return orgByHubUser.id;
  }

  // 2. Check crm_members by email
  const { data: member } = await crmSupabase
    .from('crm_members')
    .select('org_id, name, role')
    .ilike('email', user.email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (member?.org_id) {
    console.log('Found org by crm_members email:', member);
    return member.org_id;
  }

  // 3. Check organizations by id
  const { data: orgById } = await crmSupabase
    .from('organizations')
    .select('id, name, slug')
    .eq('id', user.organization_id)
    .maybeSingle();

  if (orgById) {
    console.log('Found org by direct id:', orgById);
    return orgById.id;
  }

  console.log('No existing CRM org found, using fallback.');
  return user.organization_id;
}

async function run() {
  const users = [
    { user_id: 'fc82499d-96b7-4f50-ab12-c1399d90b75f', email: 'shwetchourey3@gmail.com', organization_id: '847e859b-9bd7-4407-93c7-84e6b7a499f2' },
    { user_id: '66f4b35c-ce7c-41a5-a3c6-d46bde691046', email: 'test@getaipilot.com', organization_id: 'org_66f4b35c' }
  ];

  for (const u of users) {
    const orgId = await resolveCrmOrg(u);
    console.log(`Resolved CRM OrgId for ${u.email}: ${orgId}`);

    // Query deals for this org
    const { data: deals, count: dealsCount, error: dealsErr } = await crmSupabase
      .from('crm_deals')
      .select('*, contact:crm_contacts(*)', { count: 'exact' })
      .eq('org_id', orgId);
    console.log(`Deals count for ${u.email}: ${dealsCount}, Deals retrieved: ${deals?.length}`);
    if (deals && deals.length > 0) {
      console.log('Sample Deal:', deals[0]);
    }

    // Query contacts for this org
    const { data: contacts, count: contactsCount, error: contactsErr } = await crmSupabase
      .from('crm_contacts')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);
    console.log(`Contacts count for ${u.email}: ${contactsCount}, Contacts retrieved: ${contacts?.length}`);
    if (contacts && contacts.length > 0) {
      console.log('Sample Contact:', contacts[0]);
    }
  }
}

run().catch(console.error);
