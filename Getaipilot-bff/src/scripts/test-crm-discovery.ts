import { crmSupabase } from '../services/crm/crmSupabase.js';

async function main() {
  console.log('=== DEEP CRM SCHEMA AND RECORD DISCOVERY ===');
  
  // 1. Orgs
  const { data: orgs } = await crmSupabase.from('organizations').select('*').limit(10);
  console.log('\n--- ORGANIZATIONS (Count: ' + orgs?.length + ') ---');
  console.log(orgs);

  // Pick first active org
  const activeOrg = orgs?.[0];
  const orgId = activeOrg?.id;
  console.log(`\nTesting with Org ID: ${orgId} (${activeOrg?.name}, slug: ${activeOrg?.slug})`);

  // 2. Contacts / Leads
  const { data: contacts } = await crmSupabase.from('crm_contacts').select('*').limit(10);
  console.log('\n--- CONTACTS / LEADS (Sample 10) ---');
  console.log(contacts);

  // Group contacts by status
  const { data: contactsByStatus } = await crmSupabase.from('crm_contacts').select('status');
  const statusCounts = contactsByStatus?.reduce((acc: any, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});
  console.log('\n--- CONTACT STATUS COUNTS ---', statusCounts);

  // 3. Deals
  const { data: deals } = await crmSupabase.from('crm_deals').select('*, contact:crm_contacts(*)').limit(10);
  console.log('\n--- DEALS (Sample 10) ---');
  console.log(deals);

  // 4. Tasks
  const { data: tasks } = await crmSupabase.from('crm_tasks').select('*').limit(10);
  console.log('\n--- TASKS (Sample 10) ---');
  console.log(tasks);

  // 5. Activities
  const { data: activities } = await crmSupabase.from('crm_activities').select('*').limit(10);
  console.log('\n--- ACTIVITIES (Sample 10) ---');
  console.log(activities);

  // 6. Activity Comments & Attachments
  const { data: comments } = await crmSupabase.from('crm_activity_comments').select('*').limit(5);
  console.log('\n--- ACTIVITY COMMENTS (Sample 5) ---', comments);

  // 7. Members & Users
  const { data: members } = await crmSupabase.from('crm_members').select('*').limit(10);
  console.log('\n--- MEMBERS (Sample 10) ---');
  console.log(members);

  const { data: crmUsers } = await crmSupabase.from('crm_users').select('*').limit(10);
  console.log('\n--- CRM USERS (Sample 10) ---');
  console.log(crmUsers);

  console.log('\n=== DISCOVERY COMPLETE ===');
}

main().catch(console.error);
