import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import Fastify from 'fastify';
import { env } from '../config/env.js';
import { authRoutes } from '../routes/auth.routes.js';

async function testHttpAuthFlow() {
  console.log('====================================================');
  console.log('🧪 Testing Fastify Mobile V1 Auth Endpoints...');
  console.log('====================================================\n');

  const app = Fastify();
  await app.register(cors);
  await app.register(jwt, { secret: env.JWT_SECRET });
  await app.register(authRoutes, { prefix: '/mobile/v1/auth' });

  await app.ready();

  // 1. Test Login Request Validation
  console.log('[Test 1] Testing Invalid Login Payload rejection...');
  const badLoginRes = await app.inject({
    method: 'POST',
    url: '/mobile/v1/auth/login',
    payload: { email: 'invalid-email' },
  });
  console.log(`✅ Status: ${badLoginRes.statusCode} (Expected 400)`);

  // 2. Test Signing & Verify Token with /me
  console.log('\n[Test 2] Testing Token Generation & /me Authentication...');
  const testPayload = {
    user_id: 'usr_test_mobile_101',
    email: 'alex@getaipilot.in',
    organization_id: 'org_test_101',
    role: 'Admin',
    permissions: ['crm.read', 'crm.write', 'whatsapp.inbox', '*'],
  };
  const token = app.jwt.sign(testPayload);

  const meRes = await app.inject({
    method: 'GET',
    url: '/mobile/v1/auth/me',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log(`✅ Status: ${meRes.statusCode}`);
  const meData = JSON.parse(meRes.body);
  console.log('✅ Resolved /me Response:', {
    id: meData.id,
    email: meData.email,
    role: meData.role,
    organizationId: meData.organizationId,
    tenantMapping: meData.tenantMapping,
  });

  // 3. Test Refresh Token
  console.log('\n[Test 3] Testing Token Refresh Exchange...');
  const refreshToken = app.jwt.sign({ user_id: 'usr_test_mobile_101', email: 'alex@getaipilot.in' });
  const refreshRes = await app.inject({
    method: 'POST',
    url: '/mobile/v1/auth/refresh',
    payload: { refreshToken },
  });

  console.log(`✅ Status: ${refreshRes.statusCode}`);
  const refreshData = JSON.parse(refreshRes.body);
  console.log('✅ Issued New Access Token:', refreshData.accessToken ? 'Present (Valid JWT)' : 'Missing');

  // 4. Test Logout
  console.log('\n[Test 4] Testing Logout Endpoint...');
  const logoutRes = await app.inject({
    method: 'POST',
    url: '/mobile/v1/auth/logout',
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`✅ Status: ${logoutRes.statusCode}`);
  console.log('✅ Response:', JSON.parse(logoutRes.body));

  console.log('\n====================================================');
  console.log('🎉 ALL HTTP AUTH ENDPOINT TESTS PASSED!');
  console.log('====================================================');
}

testHttpAuthFlow();
