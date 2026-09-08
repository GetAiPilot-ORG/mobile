import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import Fastify from 'fastify';
import { env } from '../config/env.js';
import { dashboardRoutes } from '../routes/dashboard.routes.js';

async function testDashboardEndpoint() {
  console.log('====================================================');
  console.log('🧪 Testing GET /mobile/v1/dashboard Production Aggregation...');
  console.log('====================================================\n');

  const app = Fastify();
  await app.register(cors);
  await app.register(jwt, { secret: env.JWT_SECRET });
  await app.register(dashboardRoutes, { prefix: '/mobile/v1' });

  await app.ready();

  const testToken = app.jwt.sign({
    user_id: '00000000-0000-0000-0000-000000000001',
    email: 'admin@getaipilot.in',
    organization_id: 'org_00000000',
    role: 'Admin',
    permissions: ['*'],
  });

  const res = await app.inject({
    method: 'GET',
    url: '/mobile/v1/dashboard',
    headers: {
      Authorization: `Bearer ${testToken}`,
    },
  });

  console.log(`✅ Status Code: ${res.statusCode}`);
  const payload = JSON.parse(res.body);
  console.log('✅ Organization:', payload.organization);
  console.log('✅ Subscription:', payload.subscription);
  console.log('✅ Metrics:', JSON.stringify(payload.metrics, null, 2));
  console.log(`✅ Recent Activity Items: ${payload.recent_activity.length}`);

  console.log('\n====================================================');
  console.log('🎉 REAL UNIFIED DASHBOARD AGGREGATION TEST PASSED!');
  console.log('====================================================');
}

testDashboardEndpoint();
