import { createClient } from '@supabase/supabase-js';

const HUB_SUPABASE_URL = 'https://uklxlappjcuvdqjvecfh.supabase.co';
const HUB_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbHhsYXBwamN1dmRxanZlY2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDcwODMsImV4cCI6MjA4MzcyMzA4M30.v-TvyQrYpttcmCnzT9MkUlBgGXXU3lspZCxCYm-Oil4';

const SOCIAL_SUPABASE_URL = 'https://oqaysrnncwbtrujnxsdo.supabase.co';
const SOCIAL_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xYXlzcm5uY3didHJ1am54c2RvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzY3OTMwNywiZXhwIjoyMDgzMjU1MzA3fQ.uORVIfBmYzRQXPRvAWjC1P94g6PL2c13cC-cH74k1ww';

const hubSupabase = createClient(HUB_SUPABASE_URL, HUB_ANON_KEY);
const socialSupabase = createClient(SOCIAL_SUPABASE_URL, SOCIAL_SERVICE_ROLE_KEY);

async function runSocialAudit() {
  console.log('=== GAP SOCIALPILOT FULL INTEGRATION & RUNTIME AUDIT ===\n');

  // 1. Inspect SocialPilot Supabase tables directly
  console.log('[STEP 1] Direct Database Inspection:');
  const { data: users, error: userErr } = await socialSupabase
    .from('users')
    .select('id, email, name')
    .limit(5);

  if (userErr) {
    console.error('  Error reading SocialPilot users table:', userErr);
  } else {
    console.log(`  Found ${users?.length || 0} registered users in SocialPilot database.`);
    users?.forEach((u) => console.log(`    - [${u.id}] ${u.email} (${u.name})`));
  }

  const { data: socialTokens } = await socialSupabase
    .from('social_tokens')
    .select('id, user_id, provider, username, account_id')
    .limit(10);

  console.log(`  Found ${socialTokens?.length || 0} connected social tokens in social_tokens table:`);
  socialTokens?.forEach((t) => console.log(`    - [${t.provider}] @${t.username || t.account_id} (User: ${t.user_id})`));

  const { data: broadcasts } = await socialSupabase
    .from('broadcasts')
    .select('id, user_id, caption, status, created_at, scheduled_for')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log(`  Found ${broadcasts?.length || 0} recent broadcast records in broadcasts table.`);
  broadcasts?.forEach((b) =>
    console.log(`    - [${b.status}] ${b.caption?.slice(0, 40)}... (ID: ${b.id})`)
  );

  // 2. Test Local SocialPilot API Server
  console.log('\n[STEP 2] Testing SocialPilot Express Server (http://127.0.0.1:5000):');
  try {
    const rootRes = await fetch('http://127.0.0.1:5000/');
    const rootJson = await rootRes.json();
    console.log('  Root endpoint response:', rootJson.message || rootJson);
  } catch (err: any) {
    console.error('  Could not reach http://127.0.0.1:5000:', err.message);
  }

  // 3. Test with a test user context
  const testUserId = users && users.length > 0 ? users[0].id : '00000000-0000-0000-0000-000000000001';
  console.log(`\n[STEP 3] Testing SocialAdapter Endpoints for User: ${testUserId}`);

  // Test Overview
  const overviewRes = await fetch(`http://127.0.0.1:5000/api/dashboard/overview`, {
    headers: { 'x-user-id': testUserId, 'x-workspace-id': testUserId }
  });
  console.log(`  GET /api/dashboard/overview Status: ${overviewRes.status}`);
  if (overviewRes.ok) {
    const overview = await overviewRes.json();
    console.log('    Overview operations:', overview.operations);
    console.log('    Overview accounts total:', overview.accounts?.totalConnected);
  }

  // Test Accounts
  const accountsRes = await fetch(`http://127.0.0.1:5000/api/auth/accounts`, {
    headers: { 'x-user-id': testUserId, 'x-workspace-id': testUserId }
  });
  console.log(`  GET /api/auth/accounts Status: ${accountsRes.status}`);
  if (accountsRes.ok) {
    const acc = await accountsRes.json();
    console.log('    Accounts returned:', Object.keys(acc.accounts || acc));
  }

  // Test Broadcasts History
  const broadcastsRes = await fetch(`http://127.0.0.1:5000/api/broadcasts`, {
    headers: { 'x-user-id': testUserId, 'x-workspace-id': testUserId }
  });
  console.log(`  GET /api/broadcasts Status: ${broadcastsRes.status}`);
  if (broadcastsRes.ok) {
    const bData = await broadcastsRes.json();
    console.log(`    Broadcasts count: ${Array.isArray(bData) ? bData.length : bData.broadcasts?.length || 0}`);
  }

  // Test Queue
  const queueRes = await fetch(`http://127.0.0.1:5000/api/broadcasts/queue`, {
    headers: { 'x-user-id': testUserId, 'x-workspace-id': testUserId }
  });
  console.log(`  GET /api/broadcasts/queue Status: ${queueRes.status}`);

  // Test Trends Feed
  const trendsRes = await fetch(`http://127.0.0.1:5000/api/trends/feed`, {
    headers: { 'x-user-id': testUserId, 'x-workspace-id': testUserId }
  });
  console.log(`  GET /api/trends/feed Status: ${trendsRes.status}`);

  // Test Entitlements
  const entRes = await fetch(`http://127.0.0.1:5000/api/billing/entitlements`, {
    headers: { 'x-user-id': testUserId, 'x-workspace-id': testUserId }
  });
  console.log(`  GET /api/billing/entitlements Status: ${entRes.status}`);

  console.log('\n=== SOCIALPILOT AUDIT COMPLETED ===\n');
}

runSocialAudit().catch(console.error);
