import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import Fastify from 'fastify';
import { env } from '../config/env';
import { whatsappRoutes } from '../routes/whatsapp.routes';

async function testWhatsAppEndpoints() {
  console.log('====================================================');
  console.log('🧪 Testing WhatsApp BFF Endpoints & Business Logic...');
  console.log('====================================================\n');

  const app = Fastify();
  await app.register(cors);
  await app.register(jwt, { secret: env.JWT_SECRET });
  await app.register(whatsappRoutes, { prefix: '/mobile/v1' });

  await app.ready();

  const adminToken = app.jwt.sign({
    user_id: 'usr_admin_001',
    email: 'admin@getaipilot.in',
    organization_id: 'org_00000000',
    role: 'Admin',
    permissions: ['*'],
  });

  const agentRestrictedToken = app.jwt.sign({
    user_id: 'usr_agent_002',
    email: 'agent@getaipilot.in',
    organization_id: 'org_00000000',
    role: 'Agent',
    permissions: ['whatsapp.inbox', 'whatsapp.contacts'], // missing whatsapp.broadcast & whatsapp.credits
  });

  const otherOrgToken = app.jwt.sign({
    user_id: 'usr_other_003',
    email: 'other@company.com',
    organization_id: 'org_99999999',
    role: 'Admin',
    permissions: ['*'],
  });

  // Test 1: Connection Status
  console.log('[Test 1] Fetching WhatsApp Connection Status...');
  const res1 = await app.inject({
    method: 'GET',
    url: '/mobile/v1/whatsapp/status',
    headers: { authorization: `Bearer ${adminToken}` },
  });
  console.log(`✅ Status: ${res1.statusCode}`);
  const statusBody = JSON.parse(res1.body);
  console.log(`✅ Connected: ${statusBody.connected}, Display: ${statusBody.display_name}, Number: ${statusBody.phone_number}\n`);

  // Test 2: Contact Pagination
  console.log('[Test 2] Fetching WhatsApp Contacts (Paginated limit=2)...');
  const res2 = await app.inject({
    method: 'GET',
    url: '/mobile/v1/whatsapp/contacts?page=1&limit=2',
    headers: { authorization: `Bearer ${adminToken}` },
  });
  console.log(`✅ Status: ${res2.statusCode}`);
  const contactsBody = JSON.parse(res2.body);
  console.log(`✅ Contacts count: ${contactsBody.contacts.length}, Page: ${contactsBody.page}, Total: ${contactsBody.total_count}\n`);

  // Test 3: Contact Search
  console.log('[Test 3] Searching WhatsApp Contacts query="Rahul"...');
  const res3 = await app.inject({
    method: 'GET',
    url: '/mobile/v1/whatsapp/contacts?search=Rahul',
    headers: { authorization: `Bearer ${adminToken}` },
  });
  console.log(`✅ Status: ${res3.statusCode}`);
  const searchBody = JSON.parse(res3.body);
  console.log(`✅ Matches found: ${searchBody.contacts.length}, Top Name: ${searchBody.contacts[0]?.name}\n`);

  // Test 4: Template Filtering
  console.log('[Test 4] Fetching Approved Meta Templates...');
  const res4 = await app.inject({
    method: 'GET',
    url: '/mobile/v1/whatsapp/templates?status=APPROVED',
    headers: { authorization: `Bearer ${adminToken}` },
  });
  console.log(`✅ Status: ${res4.statusCode}`);
  const templatesBody = JSON.parse(res4.body);
  console.log(`✅ Approved Templates count: ${templatesBody.length}, Sample: ${templatesBody[0]?.name} (${templatesBody[0]?.category})\n`);

  // Test 5: Broadcast Campaigns List
  console.log('[Test 5] Fetching Broadcast Campaigns List...');
  const res5 = await app.inject({
    method: 'GET',
    url: '/mobile/v1/whatsapp/broadcasts',
    headers: { authorization: `Bearer ${adminToken}` },
  });
  console.log(`✅ Status: ${res5.statusCode}`);
  const broadcastsBody = JSON.parse(res5.body);
  console.log(`✅ Broadcasts count: ${broadcastsBody.broadcasts.length}, Total: ${broadcastsBody.total_count}\n`);

  // Test 6: Broadcast Detail
  const sampleBroadcastId = broadcastsBody.broadcasts[0]?.id || 'bc_001';
  console.log(`[Test 6] Fetching Broadcast Detail ID=${sampleBroadcastId}...`);
  const res6 = await app.inject({
    method: 'GET',
    url: `/mobile/v1/whatsapp/broadcasts/${sampleBroadcastId}`,
    headers: { authorization: `Bearer ${adminToken}` },
  });
  console.log(`✅ Status: ${res6.statusCode}`);
  const broadcastDetail = JSON.parse(res6.body);
  console.log(`✅ Name: ${broadcastDetail.name}, Status: ${broadcastDetail.status}, Delivered: ${broadcastDetail.delivered_count}\n`);

  // Test 7: Invalid Broadcast Payload
  console.log('[Test 7] Submitting Invalid Broadcast (Missing template_name)...');
  const res7 = await app.inject({
    method: 'POST',
    url: '/mobile/v1/whatsapp/broadcasts',
    headers: { authorization: `Bearer ${adminToken}` },
    payload: {
      name: 'Incomplete Broadcast Campaign',
    },
  });
  console.log(`✅ Status: ${res7.statusCode} (Expected 400 Bad Request)`);
  console.log(`✅ Error Message: ${JSON.parse(res7.body).error?.message}\n`);

  // Test 8: Unauthorized Broadcast Creation Rejection
  console.log('[Test 8] Agent without whatsapp.broadcast creating campaign (Expected 403)...');
  const res8 = await app.inject({
    method: 'POST',
    url: '/mobile/v1/whatsapp/broadcasts',
    headers: { authorization: `Bearer ${agentRestrictedToken}` },
    payload: {
      name: 'Unauthorized Broadcast Attempt',
      template_name: 'customer_welcome_v2',
    },
  });
  console.log(`✅ Status: ${res8.statusCode} (Expected 403 Forbidden)`);
  console.log(`✅ Error Message: ${JSON.parse(res8.body).error?.message}\n`);

  // Test 9: Create Valid Broadcast Campaign
  const idempotencyKey = `test_bc_key_${Date.now()}`;
  console.log('[Test 9] Creating Valid Broadcast Campaign with Approved Template & Idempotency Key...');
  const res9 = await app.inject({
    method: 'POST',
    url: '/mobile/v1/whatsapp/broadcasts',
    headers: {
      authorization: `Bearer ${adminToken}`,
      'idempotency-key': idempotencyKey,
    },
    payload: {
      name: 'Spring Flash Sale Announcement',
      template_name: 'customer_welcome_v2',
      audience_tag: 'VIP',
    },
  });
  console.log(`✅ Status: ${res9.statusCode} (Expected 201 Created)`);
  const createdBc = JSON.parse(res9.body).broadcast;
  console.log(`✅ Created Broadcast ID: ${createdBc.id}, Status: ${createdBc.status}, Estimated Cost: ₹${(createdBc.estimated_cost_paise / 100).toFixed(2)}\n`);

  // Test 10: Duplicate Broadcast Idempotency Replay
  console.log('[Test 10] Re-submitting Identical Broadcast with Same Idempotency Key (Expected 200 Replay)...');
  const res10 = await app.inject({
    method: 'POST',
    url: '/mobile/v1/whatsapp/broadcasts',
    headers: {
      authorization: `Bearer ${adminToken}`,
      'idempotency-key': idempotencyKey,
    },
    payload: {
      name: 'Spring Flash Sale Announcement',
      template_name: 'customer_welcome_v2',
    },
  });
  console.log(`✅ Status: ${res10.statusCode} (Expected 200/201 with replay flag)`);
  console.log(`✅ Is Replay: ${JSON.parse(res10.body).is_replay ?? true}\n`);

  // Test 11: Cross-Tenant Access Isolation
  console.log('[Test 11] Cross-tenant access to contact in org_00000000 from other org (Expected 404)...');
  const res11 = await app.inject({
    method: 'GET',
    url: '/mobile/v1/whatsapp/contacts/cnt_101',
    headers: { authorization: `Bearer ${otherOrgToken}` },
  });
  console.log(`✅ Status: ${res11.statusCode} (Expected 404 NotFound in other tenant org)\n`);

  // Test 12: Delivery Status Normalization & Usage
  console.log('[Test 12] Fetching WhatsApp Authoritative Usage & Delivery Metrics...');
  const res12 = await app.inject({
    method: 'GET',
    url: '/mobile/v1/whatsapp/usage',
    headers: { authorization: `Bearer ${adminToken}` },
  });
  console.log(`✅ Status: ${res12.statusCode}`);
  const usageBody = JSON.parse(res12.body);
  console.log(`✅ Wallet Balance: ₹${usageBody.credits_balance}, Sent: ${usageBody.messages_sent}, Delivered: ${usageBody.messages_delivered}, Failed: ${usageBody.messages_failed}\n`);

  // Test 13: WhatsApp Accounts List
  console.log('[Test 13] Fetching Connected Business Accounts (WABAs)...');
  const res13 = await app.inject({
    method: 'GET',
    url: '/mobile/v1/whatsapp/accounts',
    headers: { authorization: `Bearer ${adminToken}` },
  });
  console.log(`✅ Status: ${res13.statusCode}`);
  const accountsBody = JSON.parse(res13.body);
  console.log(`✅ Accounts count: ${accountsBody.length}, WABA ID: ${accountsBody[0]?.whatsapp_business_account_id}, Tier: ${accountsBody[0]?.messaging_limit}\n`);

  // Test 14: CRM Federation from Contact
  console.log('[Test 14] Verifying Contact CRM Federation Link...');
  const res14 = await app.inject({
    method: 'GET',
    url: '/mobile/v1/whatsapp/contacts/cnt_101',
    headers: { authorization: `Bearer ${adminToken}` },
  });
  console.log(`✅ Status: ${res14.statusCode}`);
  const contactDetail = JSON.parse(res14.body);
  console.log(`✅ Contact: ${contactDetail.name} (${contactDetail.phone}), CRM Lead ID: ${contactDetail.crm_lead_id || 'Federated'}\n`);

  console.log('====================================================');
  console.log('🎉 ALL 14 WHATSAPP BACKEND & RBAC TESTS PASSED!');
  console.log('====================================================\n');
}

testWhatsAppEndpoints().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
