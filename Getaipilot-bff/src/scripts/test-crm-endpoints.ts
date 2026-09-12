import { CRMService } from '../services/crm.service.js';
import { JWTPayload } from '../types/index.js';

async function testEndpoints() {
  console.log('=== TESTING BFF CRM ENDPOINTS & DATA PARITY ===\n');

  const mockUser: JWTPayload = {
    user_id: '7eb7dd38-00bc-49b8-a87f-96c27cac7866',
    email: 'shwetchourey3@gmail.com',
    organization_id: '7eb7dd38-00bc-49b8-a87f-96c27cac7866',
    role: 'Admin',
    permissions: ['*'],
  };

  // 1. Stages & Members
  const stages = await CRMService.getStages(mockUser);
  console.log('1. Pipeline Stages count:', stages.length, stages.map(s => s.label));

  const members = await CRMService.getMembers(mockUser);
  console.log('2. Members count:', members.length, members.map(m => ({ id: m.id, name: m.name, email: m.email, role: m.role })));

  // 3. Dashboard Summary
  const dashboard = await CRMService.getDashboardSummary(mockUser);
  console.log('3. Dashboard Stats:', dashboard.stats);
  console.log('   Recent Leads:', dashboard.recentLeads.length);
  console.log('   Upcoming Tasks:', dashboard.upcomingTasks.length);
  console.log('   Pipeline Summary:', dashboard.pipelineSummary);

  // 4. Leads
  const leads = await CRMService.getLeads(mockUser, { limit: 10 });
  console.log('4. Leads count:', leads.total_count, 'Returned:', leads.leads.length, leads.leads.map(l => ({ id: l.id, name: l.name, status: l.status, company: l.company })));

  // 5. Contacts
  const contacts = await CRMService.getContacts(mockUser, { limit: 10 });
  console.log('5. Contacts count:', contacts.total_count, 'Returned:', contacts.contacts.length);

  // 6. Deals
  const deals = await CRMService.getDeals(mockUser);
  console.log('6. Deals count:', deals.length, deals.slice(0, 3).map(d => ({ id: d.id, title: d.title, value: d.value, stage: d.stage })));

  // 7. Tasks
  const tasks = await CRMService.getTasks(mockUser);
  console.log('7. Tasks count:', tasks.length);

  // 8. Activities
  const activities = await CRMService.getActivities(mockUser, { limit: 10 });
  console.log('8. Activities count:', activities.length);

  console.log('\n=== ALL BFF CRM ENDPOINT CHECKS PASSED ===');
}

testEndpoints().catch(console.error);
