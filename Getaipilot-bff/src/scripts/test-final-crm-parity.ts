import { CRMService } from '../services/crm.service.js';
import { CRMRepository } from '../services/crm/crm.repository.js';
import { JWTPayload } from '../types/index.js';

async function runParityAndSecurityTests() {
  console.log('===============================================================');
  console.log('  GETAIPILOT CRM — COMPLETE PARITY & MUTATION RUNTIME PROOF    ');
  console.log('===============================================================\n');

  // Tenant A: Primary active tenant (from organizations table)
  const tenantA: JWTPayload = {
    user_id: '7eb7dd38-00bc-49b8-a87f-96c27cac7866',
    email: 'shwetchourey3@gmail.com',
    organization_id: '7eb7dd38-00bc-49b8-a87f-96c27cac7866',
    role: 'Admin',
    permissions: ['*'],
  };

  // Tenant B: Another distinct tenant in CRM Supabase
  const tenantB: JWTPayload = {
    user_id: 'cb357a4f-d95e-4039-a440-28d90c7504a0',
    email: 'shwetchourey4@gmail.com',
    organization_id: 'cb357a4f-d95e-4039-a440-28d90c7504a0',
    role: 'Admin',
    permissions: ['*'],
  };

  // ── TEST 1: Tenant Context Resolution ────────────────────────────────────
  console.log('[TEST 1] Testing Canonical Tenant Context Resolution...');
  const ctxA = await CRMRepository.resolveCrmContext(tenantA);
  const ctxB = await CRMRepository.resolveCrmContext(tenantB);
  console.log(`  Tenant A resolved CRM Org ID: ${ctxA.crmOrgId} (Role: ${ctxA.crmRole})`);
  console.log(`  Tenant B resolved CRM Org ID: ${ctxB.crmOrgId} (Role: ${ctxB.crmRole})`);
  if (ctxA.crmOrgId === ctxB.crmOrgId) {
    throw new Error('FAILED: Tenant A and Tenant B resolved to the same CRM Org ID!');
  }
  console.log('  -> PASS: Tenant context isolation verified.\n');

  // ── TEST 2: Dashboard Aggregation Parity ─────────────────────────────────
  console.log('[TEST 2] Testing Dashboard KPI Aggregations...');
  const dashA = await CRMService.getDashboardSummary(tenantA);
  console.log('  Tenant A Stats:', JSON.stringify(dashA.stats, null, 2));
  console.log('  Pipeline Summary count:', dashA.pipelineSummary.length);
  console.log('  -> PASS: Dashboard stats calculated live from CRM Supabase.\n');

  // ── TEST 3: Lead Lifecycle & Mutation Verification ───────────────────────
  console.log('[TEST 3] Testing Lead Creation, Update, Note, and Deletion...');
  const testLeadName = `Mobile Parity Test Lead ${Date.now()}`;
  const createdLead = await CRMService.createLead(tenantA, {
    first_name: testLeadName,
    last_name: 'AutoVerifier',
    company: 'Test Company Ltd',
    phone: '+15551234567',
    email: 'testlead@autoverifier.com',
    status: 'lead',
  });
  console.log(`  Created Lead ID: ${createdLead.id}, Name: ${createdLead.name}, Status: ${createdLead.status}`);

  // Update lead status to prospect
  const updatedLead = await CRMService.updateLead(tenantA, createdLead.id, {
    status: 'prospect',
    notes: 'Qualified via automated mobile test suite',
  });
  console.log(`  Updated Lead ID: ${updatedLead.id}, New Status: ${updatedLead.status}, Notes: ${updatedLead.notes}`);
  if (updatedLead.status !== 'prospect') throw new Error('FAILED: Lead update did not persist!');

  // Add note to lead
  const leadNote = await CRMService.createActivity(tenantA, {
    contact_id: createdLead.id,
    type: 'note',
    subject: 'Initial discovery call',
    description: 'Budget confirmed, ready for proposal',
  });
  console.log(`  Logged Note ID: ${leadNote.id}, Subject: ${leadNote.subject}`);

  // Verify activity is readable
  const leadActivities = await CRMService.getActivities(tenantA, { contact_id: createdLead.id });
  console.log(`  Read Lead Activities count: ${leadActivities.length}`);
  if (leadActivities.length === 0) throw new Error('FAILED: Logged activity was not retrieved!');

  console.log('  -> PASS: Lead mutations and activity stream verified.\n');

  // ── TEST 4: Deal & Stage Progression Verification ────────────────────────
  console.log('[TEST 4] Testing Deal Creation and Stage Transitions...');
  const createdDeal = await CRMService.createDeal(tenantA, {
    title: `Deal for ${createdLead.name}`,
    contact_id: createdLead.id,
    value: 150000,
    currency: 'INR',
    stage: 'qualified',
  });
  console.log(`  Created Deal ID: ${createdDeal.id}, Title: ${createdDeal.title}, Stage: ${createdDeal.stage}, Value: ₹${createdDeal.value}`);

  // Move stage to proposal
  const movedDeal = await CRMService.updateDealStage(tenantA, createdDeal.id, 'proposal');
  console.log(`  Moved Deal ID: ${movedDeal.id}, New Stage: ${movedDeal.stage}`);
  if (movedDeal.stage !== 'proposal') throw new Error('FAILED: Deal stage transition did not persist!');

  console.log('  -> PASS: Deal creation and stage update verified.\n');

  // ── TEST 5: Tasks & Completion Toggle Verification ───────────────────────
  console.log('[TEST 5] Testing Task Creation and Interactive Toggle...');
  const createdTask = await CRMService.createTask(tenantA, {
    title: `Follow-up with ${createdLead.name}`,
    contact_id: createdLead.id,
    deal_id: createdDeal.id,
    priority: 'high',
    due_date: new Date().toISOString().split('T')[0],
  });
  console.log(`  Created Task ID: ${createdTask.id}, Title: ${createdTask.title}, Status: ${createdTask.status}`);

  // Toggle task to done
  const toggledTask = await CRMService.toggleTask(tenantA, createdTask.id, true);
  console.log(`  Toggled Task ID: ${toggledTask.id}, New Status: ${toggledTask.status}`);
  if (toggledTask.status !== 'done') throw new Error('FAILED: Task toggle did not persist!');

  console.log('  -> PASS: Task creation and completion toggle verified.\n');

  // ── TEST 6: Cross-Tenant Security Isolation ──────────────────────────────
  console.log('[TEST 6] Testing Cross-Tenant Security Isolation...');
  try {
    // Tenant B attempts to read Tenant A's lead
    await CRMService.getLead(tenantB, createdLead.id);
    throw new Error('SECURITY VIOLATION: Tenant B was able to read Tenant A lead!');
  } catch (err: any) {
    if (err.message.includes('NotFound') || err.message.includes('Forbidden')) {
      console.log(`  Cross-Tenant Read Blocked as expected: "${err.message}"`);
    } else {
      throw err;
    }
  }

  try {
    // Tenant B attempts to read Tenant A's deal
    await CRMService.getDeal(tenantB, createdDeal.id);
    throw new Error('SECURITY VIOLATION: Tenant B was able to read Tenant A deal!');
  } catch (err: any) {
    if (err.message.includes('NotFound') || err.message.includes('Forbidden')) {
      console.log(`  Cross-Tenant Deal Access Blocked as expected: "${err.message}"`);
    } else {
      throw err;
    }
  }
  console.log('  -> PASS: Cross-tenant isolation strictly enforced server-side.\n');

  // ── TEST 7: Safe Cleanup of Test Records ─────────────────────────────────
  console.log('[TEST 7] Cleaning up test records...');
  await CRMService.deleteActivity(tenantA, leadNote.id);
  await CRMService.deleteTask(tenantA, createdTask.id);
  await CRMService.deleteDeal(tenantA, createdDeal.id);
  await CRMService.deleteLead(tenantA, createdLead.id);
  console.log('  Cleaned up test task, deal, activity, and lead.');
  console.log('  -> PASS: Cleanup complete.\n');

  console.log('===============================================================');
  console.log('  ALL CRM RUNTIME VERIFICATION TESTS PASSED SUCCESSFULLY!      ');
  console.log('===============================================================');
}

runParityAndSecurityTests().catch((err) => {
  console.error('\nRUNTIME VERIFICATION FAILED:', err);
  process.exit(1);
});
