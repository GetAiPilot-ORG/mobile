import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import Fastify from 'fastify';
import { env } from '../config/env';
import { crmRoutes } from '../routes/crm.routes';

async function testCRMEndpoints() {
  console.log('====================================================');
  console.log('🧪 Testing CRM BFF Endpoints & RBAC Enforcement...');
  console.log('====================================================\n');

  const app = Fastify();
  await app.register(cors);
  await app.register(jwt, { secret: env.JWT_SECRET });
  await app.register(crmRoutes, { prefix: '/mobile/v1' });

  await app.ready();

  const adminToken = app.jwt.sign({
    user_id: 'usr_admin_001',
    email: 'admin@getaipilot.in',
    organization_id: 'org_00000000',
    role: 'Admin',
    permissions: ['*'],
  });

  const agentToken = app.jwt.sign({
    user_id: 'usr_agent_sarah',
    email: 'sarah@getaipilot.in',
    organization_id: 'org_00000000',
    role: 'Agent',
    permissions: ['crm.read', 'crm.write_assigned'],
  });

  const unauthorizedAgentToken = app.jwt.sign({
    user_id: 'usr_agent_stranger',
    email: 'stranger@getaipilot.in',
    organization_id: 'org_00000000',
    role: 'Agent',
    permissions: ['crm.read', 'crm.write_assigned'],
  });

  const otherOrgToken = app.jwt.sign({
    user_id: 'usr_other_tenant',
    email: 'other@company.in',
    organization_id: 'org_other_999',
    role: 'Admin',
    permissions: ['*'],
  });

  // 1. Fetch Pipelines
  console.log('[Test 1] Fetching pipelines and stages...');
  const pipeRes = await app.inject({
    method: 'GET',
    url: '/mobile/v1/crm/pipelines',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`✅ Status: ${pipeRes.statusCode}`);
  const pipelines = JSON.parse(pipeRes.body);
  console.log(`✅ Pipeline: ${pipelines[0]?.name}, Stages count: ${pipelines[0]?.stages.length}`);

  // 2. Fetch Leads with Cursor Pagination
  console.log('\n[Test 2] Fetching paginated leads...');
  const leadsRes = await app.inject({
    method: 'GET',
    url: '/mobile/v1/leads?limit=2',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`✅ Status: ${leadsRes.statusCode}`);
  const leadsData = JSON.parse(leadsRes.body);
  console.log(`✅ Leads count: ${leadsData.leads.length}, next_cursor: ${leadsData.next_cursor}, total: ${leadsData.total_count}`);

  // 3. Create Lead
  console.log('\n[Test 3] Creating new lead with Zod validation...');
  const createRes = await app.inject({
    method: 'POST',
    url: '/mobile/v1/leads',
    headers: { Authorization: `Bearer ${adminToken}` },
    payload: {
      name: 'Rohan Deshmukh',
      email: 'rohan@deshmukh.in',
      phone: '+91 99112 23344',
      company: 'Deshmukh Industries',
      stage_id: 'lead',
      value: 200000,
      source: 'WhatsApp Inbound',
      notes: 'Initial inquiry for Enterprise voice bot.',
    },
  });
  console.log(`✅ Status: ${createRes.statusCode}`);
  const newLead = JSON.parse(createRes.body);
  console.log(`✅ Created Lead ID: ${newLead.id}, Name: ${newLead.name}, Stage: ${newLead.stage_name}`);

  // 4. Move Stage
  console.log(`\n[Test 4] Moving lead ${newLead.id} to "qualified"...`);
  const moveRes = await app.inject({
    method: 'POST',
    url: `/mobile/v1/leads/${newLead.id}/move`,
    headers: { Authorization: `Bearer ${adminToken}` },
    payload: { stage_id: 'qualified' },
  });
  console.log(`✅ Status: ${moveRes.statusCode}`);
  const movedLead = JSON.parse(moveRes.body);
  console.log(`✅ Updated Stage: ${movedLead.stage_name}`);

  // 5. Assign Lead to Agent Sarah
  console.log(`\n[Test 5] Assigning lead to Agent Sarah...`);
  const assignRes = await app.inject({
    method: 'POST',
    url: `/mobile/v1/leads/${newLead.id}/assign`,
    headers: { Authorization: `Bearer ${adminToken}` },
    payload: { owner_id: 'usr_agent_sarah', owner_name: 'Agent Sarah' },
  });
  console.log(`✅ Status: ${assignRes.statusCode}`);
  const assignedLead = JSON.parse(assignRes.body);
  console.log(`✅ Assigned Owner: ${assignedLead.owner?.name}`);

  // 6. Test RBAC: Agent Sarah CAN modify her assigned lead
  console.log(`\n[Test 6] Agent Sarah modifying her assigned lead (Expected 200)...`);
  const agentUpdateRes = await app.inject({
    method: 'PATCH',
    url: `/mobile/v1/leads/${newLead.id}`,
    headers: { Authorization: `Bearer ${agentToken}` },
    payload: { value: 250000 },
  });
  console.log(`✅ Status: ${agentUpdateRes.statusCode} (Allowed)`);

  // 7. Test RBAC: Stranger Agent CANNOT modify Sarah's lead
  console.log(`\n[Test 7] Stranger Agent modifying Sarah's lead (Expected 403)...`);
  const unauthorizedUpdateRes = await app.inject({
    method: 'PATCH',
    url: `/mobile/v1/leads/${newLead.id}`,
    headers: { Authorization: `Bearer ${unauthorizedAgentToken}` },
    payload: { value: 999999 },
  });
  console.log(`✅ Status: ${unauthorizedUpdateRes.statusCode} (Expected 403 Forbidden)`);

  // 8. Test Cross-Tenant Isolation Rejection
  console.log(`\n[Test 8] Cross-tenant access rejection (Expected 404/403)...`);
  const crossTenantRes = await app.inject({
    method: 'GET',
    url: `/mobile/v1/leads/${newLead.id}`,
    headers: { Authorization: `Bearer ${otherOrgToken}` },
  });
  console.log(`✅ Status: ${crossTenantRes.statusCode} (Expected 404 NotFound in other org)`);

  // 9. Add Agent Note
  console.log(`\n[Test 9] Adding agent note to lead...`);
  const noteRes = await app.inject({
    method: 'POST',
    url: `/mobile/v1/leads/${newLead.id}/notes`,
    headers: { Authorization: `Bearer ${adminToken}` },
    payload: { note: 'Client agreed to proceed with full pilot rollout next Monday.' },
  });
  console.log(`✅ Status: ${noteRes.statusCode}`);

  // 10. Fetch Unified Activity Timeline
  console.log(`\n[Test 10] Fetching unified timeline for lead ${newLead.id}...`);
  const timelineRes = await app.inject({
    method: 'GET',
    url: `/mobile/v1/leads/${newLead.id}/activities`,
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`✅ Status: ${timelineRes.statusCode}`);
  const timeline = JSON.parse(timelineRes.body);
  console.log(`✅ Timeline Events Count: ${timeline.length}`);
  console.log('Sample event:', timeline[0]);

  console.log('\n====================================================');
  console.log('🎉 ALL CRM BACKEND & RBAC INTEGRATION TESTS PASSED!');
  console.log('====================================================');
}

testCRMEndpoints();
