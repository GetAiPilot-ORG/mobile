import { VoiceCallLog } from '../types/index.js';

export class VoiceAdapter {
  private static callLogsStore: VoiceCallLog[] = [
    {
      id: 'call_1',
      agentId: 'agent_v_1',
      agentName: 'Aria - Sales Qualifier',
      customerPhone: '+91 99887 76655',
      direction: 'outbound',
      durationSeconds: 142,
      status: 'completed',
      transcriptSnippet: 'Customer expressed strong interest in 50k WhatsApp broadcast plan.',
      audioRecordingUrl: 'https://cdn.getaipilot.in/recordings/sample_call_1.mp3',
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    },
    {
      id: 'call_2',
      agentId: 'agent_v_2',
      agentName: 'Leo - Support Assistant',
      customerPhone: '+91 99776 65544',
      direction: 'inbound',
      durationSeconds: 88,
      status: 'completed',
      transcriptSnippet: 'Assisted customer with connecting Telegram bot webhook.',
      audioRecordingUrl: 'https://cdn.getaipilot.in/recordings/sample_call_2.mp3',
      timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    },
  ];

  public static async getSummary(workspaceId: string) {
    return {
      activeAgentsCount: 3,
      totalCallsToday: 48,
      totalMinutesUsed: 215,
      walletCreditsRemaining: 4850.0,
      currency: 'INR',
    };
  }

  public static async getCallLogs(workspaceId: string): Promise<VoiceCallLog[]> {
    return this.callLogsStore;
  }

  public static async triggerOutboundCall(agentId: string, phone: string) {
    const newCall: VoiceCallLog = {
      id: `call_${Date.now()}`,
      agentId,
      agentName: 'Aria - Sales Qualifier',
      customerPhone: phone,
      direction: 'outbound',
      durationSeconds: 0,
      status: 'in_progress',
      transcriptSnippet: 'Call initiated by mobile dashboard.',
      timestamp: new Date().toISOString(),
    };
    this.callLogsStore.unshift(newCall);
    return newCall;
  }
}
