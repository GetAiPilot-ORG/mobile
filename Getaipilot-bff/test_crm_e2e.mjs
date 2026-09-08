async function testUserCRM(email, password) {
  console.log(`\n========================================`);
  console.log(`Testing CRM for: ${email}`);
  console.log(`========================================`);

  const loginRes = await fetch('http://localhost:4000/mobile/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const loginData = await loginRes.json();
  const token = loginData.accessToken;
  console.log('Login Status:', loginRes.status);
  console.log('User ID:', loginData.user?.id);
  console.log('Org ID:', loginData.user?.organizationId);

  const headers = { Authorization: `Bearer ${token}` };

  // 1. Pipelines
  const pipeRes = await fetch('http://localhost:4000/mobile/v1/crm/pipelines', { headers });
  const pipelines = await pipeRes.json();
  console.log(`GET /mobile/v1/crm/pipelines -> ${pipeRes.status}`);
  console.log('Pipelines stages:', pipelines[0]?.stages?.map(s => `${s.name}: ${s.lead_count} leads (₹${s.total_value})`));

  // 2. Stages
  const stageRes = await fetch('http://localhost:4000/mobile/v1/crm/stages', { headers });
  const stages = await stageRes.json();
  console.log(`GET /mobile/v1/crm/stages -> ${stageRes.status}, count: ${stages?.length}`);

  // 3. Leads (both /mobile/v1/crm/leads and /mobile/v1/leads)
  const crmLeadsRes = await fetch('http://localhost:4000/mobile/v1/crm/leads', { headers });
  const crmLeads = await crmLeadsRes.json();
  console.log(`GET /mobile/v1/crm/leads -> ${crmLeadsRes.status}, total_count: ${crmLeads?.total_count}, rows: ${crmLeads?.leads?.length}`);

  const leadsRes = await fetch('http://localhost:4000/mobile/v1/leads', { headers });
  const leads = await leadsRes.json();
  console.log(`GET /mobile/v1/leads -> ${leadsRes.status}, total_count: ${leads?.total_count}, rows: ${leads?.leads?.length}`);

  if (leads?.leads?.length > 0) {
    const firstLead = leads.leads[0];
    console.log(`Sample Lead: ID=${firstLead.id}, Name="${firstLead.name}", Value=₹${firstLead.value}, Stage="${firstLead.stage_name}", ContactEmail=${firstLead.email}, ContactPhone=${firstLead.phone}`);

    // 4. Single Lead Detail
    const detailRes = await fetch(`http://localhost:4000/mobile/v1/leads/${firstLead.id}`, { headers });
    const detail = await detailRes.json();
    console.log(`GET /mobile/v1/leads/${firstLead.id} -> ${detailRes.status}, Name: ${detail.name}`);

    // 5. Activities
    const actRes = await fetch(`http://localhost:4000/mobile/v1/leads/${firstLead.id}/activities`, { headers });
    const activities = await actRes.json();
    console.log(`GET /mobile/v1/leads/${firstLead.id}/activities -> ${actRes.status}, count: ${activities?.length}`);
  }

  // 6. Contacts
  const contactsRes = await fetch('http://localhost:4000/mobile/v1/crm/contacts', { headers });
  const contacts = await contactsRes.json();
  console.log(`GET /mobile/v1/crm/contacts -> ${contactsRes.status}, count: ${contacts?.length}`);
  if (contacts?.length > 0) {
    console.log(`Sample Contact: Name="${contacts[0].name}", Phone="${contacts[0].phone}", Email="${contacts[0].email}", Company="${contacts[0].company}"`);
  }
}

async function main() {
  await testUserCRM('shwetchourey3@gmail.com', 'Shwet@1234');
  await testUserCRM('test@getaipilot.com', 'Password123!');
}

main().catch(console.error);
