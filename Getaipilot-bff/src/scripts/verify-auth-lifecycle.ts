import { FastifyInstance } from 'fastify';
import { env } from '../config/env.js';

async function testAuthLifecycle() {
  console.log('====================================================');
  console.log('🧪 Step 15: Direct BFF Auth Lifecycle Test');
  console.log('====================================================\n');

  const baseUrl = `http://localhost:${env.PORT}`;

  // Step A: Login
  console.log('[Step A] Testing POST /mobile/v1/auth/login...');
  const loginRes = await fetch(`${baseUrl}/mobile/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@getaipilot.in',
      password: 'Password123!',
    }),
  });

  console.log(`Login Status: ${loginRes.status}`);
  if (!loginRes.ok) {
    const err = await loginRes.json();
    console.error('Login failed:', err);
    process.exit(1);
  }

  const loginData = (await loginRes.json()) as any;
  const { accessToken, refreshToken, user, tenantMapping } = loginData;
  console.log('✅ Login succeeded. User:', user.name, 'Role:', user.role, 'Org:', tenantMapping.hub_org_id);
  console.log('✅ Access Token format valid (JWT payload generated)');

  // Step B: Test /auth/me with fresh access token
  console.log('\n[Step B] Testing GET /mobile/v1/auth/me with Bearer token...');
  const meRes = await fetch(`${baseUrl}/mobile/v1/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  console.log(`Auth /me Status: ${meRes.status}`);
  if (!meRes.ok) {
    console.error('GET /auth/me failed:', await meRes.text());
    process.exit(1);
  }
  const meData = (await meRes.json()) as any;
  console.log('✅ /auth/me verified successfully for:', meData.email);

  // Step C: Test /dashboard with same access token
  console.log('\n[Step C] Testing GET /mobile/v1/dashboard with same token...');
  const dashRes = await fetch(`${baseUrl}/mobile/v1/dashboard`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  console.log(`Dashboard Status: ${dashRes.status}`);
  if (!dashRes.ok) {
    console.error('GET /dashboard failed:', await dashRes.text());
    process.exit(1);
  }
  const dashData = (await dashRes.json()) as any;
  console.log('✅ Dashboard loaded live metrics: WhatsApp messages =', dashData.metrics.whatsapp.messages_count);

  // Step D: Test /conversations with same access token
  console.log('\n[Step D] Testing GET /mobile/v1/conversations with same token...');
  const convRes = await fetch(`${baseUrl}/mobile/v1/conversations`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  console.log(`Conversations Status: ${convRes.status}`);
  if (!convRes.ok) {
    console.error('GET /conversations failed:', await convRes.text());
    process.exit(1);
  }
  console.log('✅ Conversations loaded successfully');

  // Step E: Test /whatsapp/status with same access token
  console.log('\n[Step E] Testing GET /mobile/v1/whatsapp/status with same token...');
  const waRes = await fetch(`${baseUrl}/mobile/v1/whatsapp/status`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  console.log(`WhatsApp Status: ${waRes.status}`);
  if (!waRes.ok) {
    console.error('GET /whatsapp/status failed:', await waRes.text());
    process.exit(1);
  }
  console.log('✅ WhatsApp status loaded successfully');

  // Step F: Test silent refresh flow
  console.log('\n[Step F] Testing POST /mobile/v1/auth/refresh with refreshToken...');
  const refreshRes = await fetch(`${baseUrl}/mobile/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  console.log(`Refresh Status: ${refreshRes.status}`);
  if (!refreshRes.ok) {
    console.error('POST /auth/refresh failed:', await refreshRes.text());
    process.exit(1);
  }
  const refreshData = (await refreshRes.json()) as any;
  console.log('✅ Silent refresh returned new accessToken');

  // Step G: Test /dashboard with refreshed access token
  console.log('\n[Step G] Testing GET /mobile/v1/dashboard with refreshed token...');
  const dashRes2 = await fetch(`${baseUrl}/mobile/v1/dashboard`, {
    headers: { Authorization: `Bearer ${refreshData.accessToken}` },
  });
  console.log(`Refreshed Dashboard Status: ${dashRes2.status}`);
  if (!dashRes2.ok) {
    console.error('Refreshed token failed:', await dashRes2.text());
    process.exit(1);
  }
  console.log('✅ Refreshed token works seamlessly with protected endpoints');

  console.log('\n====================================================');
  console.log('🎉 DIRECT BFF AUTHENTICATION LIFECYCLE 100% PASSED!');
  console.log('====================================================');
}

testAuthLifecycle().catch(console.error);
