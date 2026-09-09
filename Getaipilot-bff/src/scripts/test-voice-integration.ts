import { env } from '../config/env.js';
import { VoiceAdapter } from '../adapters/voice.adapter.js';

async function runVoiceIntegrationTest() {
  console.log('====================================================');
  console.log('🚀 VOICEPILOT BFF & API INTEGRATION TEST');
  console.log('====================================================');
  console.log('Voice Service URL:', env.VOICE_SERVICE_URL);

  const mockUserPayload: any = {
    user_id: 'test-voice-user-001',
    email: 'voice-tester@getaipilot.in',
    organization_id: 'test-voice-org-001',
    role: 'Admin',
    permissions: ['voice.read', 'voice.outbound'],
  };

  const results: Record<string, { status: string; countOrData?: any; error?: string }> = {};

  // 1. Overview
  try {
    console.log('\n[1/7] Testing Voice Overview...');
    const overview = await VoiceAdapter.getOverview(mockUserPayload);
    console.log('✅ Overview Response:', JSON.stringify(overview, null, 2));
    results['Overview'] = { status: 'PASS', countOrData: overview };
  } catch (err: any) {
    console.error('❌ Overview Error:', err.message);
    results['Overview'] = { status: 'FAIL', error: err.message };
  }

  // 2. Agents / Assistants
  try {
    console.log('\n[2/7] Testing Voice Agents / Assistants List...');
    const agents = await VoiceAdapter.getAgents(mockUserPayload);
    console.log(`✅ Loaded ${agents.length} Assistants:`, agents.slice(0, 3).map((a: any) => a.name));
    results['Agents'] = { status: 'PASS', countOrData: `${agents.length} assistants` };
  } catch (err: any) {
    console.error('❌ Agents Error:', err.message);
    results['Agents'] = { status: 'FAIL', error: err.message };
  }

  // 3. Call Logs
  try {
    console.log('\n[3/7] Testing Voice Call Logs List...');
    const calls = await VoiceAdapter.getCalls(mockUserPayload, { limit: 10 });
    console.log(`✅ Loaded ${calls.length} Call Records:`, calls.slice(0, 2).map((c: any) => ({
      id: c.id,
      customer: c.customerNumber,
      assistant: c.assistant,
      status: c.status,
      duration: c.duration,
    })));
    results['Calls'] = { status: 'PASS', countOrData: `${calls.length} calls` };
  } catch (err: any) {
    console.error('❌ Calls Error:', err.message);
    results['Calls'] = { status: 'FAIL', error: err.message };
  }

  // 4. Campaigns
  try {
    console.log('\n[4/7] Testing Voice Campaigns...');
    const campaigns = await VoiceAdapter.getCampaigns(mockUserPayload);
    console.log(`✅ Loaded ${campaigns.length} Campaigns:`, campaigns.slice(0, 2).map((c: any) => c.name));
    results['Campaigns'] = { status: 'PASS', countOrData: `${campaigns.length} campaigns` };
  } catch (err: any) {
    console.error('❌ Campaigns Error:', err.message);
    results['Campaigns'] = { status: 'FAIL', error: err.message };
  }

  // 5. Phone Numbers
  try {
    console.log('\n[5/7] Testing Phone Numbers...');
    const numbers = await VoiceAdapter.getPhoneNumbers(mockUserPayload);
    console.log(`✅ Loaded ${numbers.length} Phone Numbers`);
    results['PhoneNumbers'] = { status: 'PASS', countOrData: `${numbers.length} numbers` };
  } catch (err: any) {
    console.error('❌ PhoneNumbers Error:', err.message);
    results['PhoneNumbers'] = { status: 'FAIL', error: err.message };
  }

  // 6. Contacts
  try {
    console.log('\n[6/7] Testing Contacts...');
    const contacts = await VoiceAdapter.getContacts(mockUserPayload);
    console.log(`✅ Loaded ${contacts.length} Contacts`);
    results['Contacts'] = { status: 'PASS', countOrData: `${contacts.length} contacts` };
  } catch (err: any) {
    console.error('❌ Contacts Error:', err.message);
    results['Contacts'] = { status: 'FAIL', error: err.message };
  }

  // 7. Usage & Wallet
  try {
    console.log('\n[7/7] Testing Usage & Wallet...');
    const usage = await VoiceAdapter.getUsage(mockUserPayload);
    console.log('✅ Usage Response:', JSON.stringify(usage, null, 2));
    results['Usage'] = { status: 'PASS', countOrData: usage };
  } catch (err: any) {
    console.error('❌ Usage Error:', err.message);
    results['Usage'] = { status: 'FAIL', error: err.message };
  }

  console.log('\n====================================================');
  console.log('📊 FINAL INTEGRATION TEST RESULTS');
  console.log('====================================================');
  console.table(results);
}

runVoiceIntegrationTest().catch(console.error);
