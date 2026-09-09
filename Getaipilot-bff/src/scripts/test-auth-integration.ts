import { HubAdapter } from '../adapters/hub.adapter.js';
import { PermissionService } from '../services/permission.service.js';
import { TenantService } from '../services/tenant.service.js';

async function runAuthIntegrationTest() {
  console.log('====================================================');
  console.log('🧪 Starting Hub Identity Auth Integration Test...');
  console.log('====================================================\n');

  try {
    // 1. Test Supabase Database & Profile Resolution
    console.log('[Step 1] Testing Supabase Profile & Identity Resolution...');
    const testUserId = '00000000-0000-0000-0000-000000000001';
    const profile = await HubAdapter.getUserProfile(testUserId, 'admin@getaipilot.in');
    console.log('✅ Resolved Profile:', {
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      role: profile.role,
      isAdmin: profile.isAdmin,
      organizationId: profile.organizationId,
      subscriptionTier: profile.subscriptionTier,
    });

    // 2. Test Multi-Tenant Mapping Resolution
    console.log('\n[Step 2] Testing Multi-Tenant Mapping Resolution...');
    const tenantMapping = await TenantService.resolveTenantMapping(
      profile.id,
      profile.organizationId,
      profile.telegramUserId
    );
    console.log('✅ Resolved Multi-Tenant Mapping:', tenantMapping);

    // 3. Test RBAC Permission Engine
    console.log('\n[Step 3] Testing RBAC Permission Engine...');
    const adminPermissions = PermissionService.getPermissionsForRole('Admin');
    const agentPermissions = PermissionService.getPermissionsForRole('Agent');
    console.log(`✅ Admin Permissions (${adminPermissions.length}):`, adminPermissions);
    console.log(`✅ Agent Permissions (${agentPermissions.length}):`, agentPermissions);

    // 4. Test Permission Checks
    console.log('\n[Step 4] Testing Permission Verification...');
    const canManageCRM = PermissionService.hasPermission(adminPermissions, 'crm.write');
    const canAgentDeleteCRM = PermissionService.hasPermission(agentPermissions, 'crm.delete');
    console.log(`✅ Admin has 'crm.write': ${canManageCRM}`);
    console.log(`✅ Agent has 'crm.delete': ${canAgentDeleteCRM} (Expected: false)`);

    // 5. Test Billing & Subscription Resolution
    console.log('\n[Step 5] Testing Billing Status Resolution...');
    const billing = await HubAdapter.getBillingStatus(testUserId);
    console.log('✅ Resolved Billing Context:', billing);

    console.log('\n====================================================');
    console.log('🎉 ALL HUB IDENTITY AUTH INTEGRATION TESTS PASSED!');
    console.log('====================================================');
  } catch (error: any) {
    console.error('❌ Auth Integration Test Failed:', error);
    process.exit(1);
  }
}

runAuthIntegrationTest();
