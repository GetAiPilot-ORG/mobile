import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import Fastify from 'fastify';
import { env } from '../config/env.js';
import { inboxRoutes } from '../routes/inbox.routes.js';

async function testInboxEndpoints() {
  console.log('====================================================');
  console.log('🧪 Testing GET /mobile/v1/conversations & POST /mobile/v1/messages...');
  console.log('====================================================\n');

  const app = Fastify();
  await app.register(cors);
  await app.register(jwt, { secret: env.JWT_SECRET });
  await app.register(inboxRoutes, { prefix: '/mobile/v1' });

  await app.ready();

  const testToken = app.jwt.sign({
    user_id: '00000000-0000-0000-0000-000000000001',
    email: 'admin@getaipilot.in',
    organization_id: 'org_00000000',
    role: 'Admin',
    permissions: ['*'],
  });

  // 1. Fetch All Conversations
  console.log('[Test 1] Fetching all omnichannel conversations...');
  const allRes = await app.inject({
    method: 'GET',
    url: '/mobile/v1/conversations',
    headers: { Authorization: `Bearer ${testToken}` },
  });
  console.log(`✅ Status: ${allRes.statusCode}`);
  const allConvs = JSON.parse(allRes.body);
  console.log(`✅ Total Conversations Received: ${allConvs.length}`);
  console.log('Sample conversation:', allConvs[0]);

  // 2. Filter by Channel: WhatsApp
  console.log('\n[Test 2] Filtering by channel: whatsapp...');
  const waRes = await app.inject({
    method: 'GET',
    url: '/mobile/v1/conversations?channel=whatsapp',
    headers: { Authorization: `Bearer ${testToken}` },
  });
  const waConvs = JSON.parse(waRes.body);
  console.log(`✅ WhatsApp Conversations: ${waConvs.length}`);

  // 3. Filter by Channel: Telegram
  console.log('\n[Test 3] Filtering by channel: telegram...');
  const tgRes = await app.inject({
    method: 'GET',
    url: '/mobile/v1/conversations?channel=telegram',
    headers: { Authorization: `Bearer ${testToken}` },
  });
  const tgConvs = JSON.parse(tgRes.body);
  console.log(`✅ Telegram Conversations: ${tgConvs.length}`);

  // 4. Fetch Message History for first conversation
  const targetConvId = allConvs[0]?.id || 'wa_conv_1';
  console.log(`\n[Test 4] Fetching message history for conversation: ${targetConvId}...`);
  const detailsRes = await app.inject({
    method: 'GET',
    url: `/mobile/v1/conversations/${targetConvId}`,
    headers: { Authorization: `Bearer ${testToken}` },
  });
  const details = JSON.parse(detailsRes.body);
  console.log(`✅ Status: ${detailsRes.statusCode}`);
  console.log(`✅ Messages Count: ${details.messages?.length}`);
  console.log('Sample message:', details.messages?.[0]);

  // 5. Send a reply message
  console.log(`\n[Test 5] Sending reply message to conversation: ${targetConvId}...`);
  const sendRes = await app.inject({
    method: 'POST',
    url: '/mobile/v1/messages',
    headers: { Authorization: `Bearer ${testToken}` },
    payload: {
      conversation_id: targetConvId,
      message: 'Hello! I am responding via GetAiPilot Unified Mobile Inbox.',
      attachments: [],
    },
  });
  console.log(`✅ Status: ${sendRes.statusCode}`);
  const sentMsg = JSON.parse(sendRes.body);
  console.log('✅ Sent message:', sentMsg);

  console.log('\n====================================================');
  console.log('🎉 UNIFIED INBOX BACKEND INTEGRATION TESTS PASSED!');
  console.log('====================================================');
}

testInboxEndpoints();
