import { NormalizedConversation, NormalizedMessage, TelegramSummary } from '../types/index.js';

export class TelegramAdapter {
  public static async getSummary(userId: string): Promise<TelegramSummary> {
    return {
      botConnected: true,
      botUsername: '@GetAiPilotOfficialBot',
      activeMembers: 3420,
      telesubSubscribers: 185,
      telesubMonthlyRevenue: 92500,
      autoForwardRulesCount: 4,
      autoApproveRequestsCount: 128,
      autoReactionsActive: true,
    };
  }

  public static async getConversations(userId: string): Promise<NormalizedConversation[]> {
    return [
      {
        id: 'tg_conv_1',
        organization_id: `org_${userId.slice(0, 8)}`,
        contact: {
          name: 'Aman Deep',
          handle_or_phone: '@amandeep_crypto',
        },
        channel: 'telegram',
        last_message: {
          content: 'I subscribed to the VIP Signal group via Telesub.',
          created_at: new Date(Date.now() - 3 * 60000).toISOString(),
          direction: 'inbound',
        },
        unread_count: 1,
        status: 'active',
      },
      {
        id: 'tg_conv_2',
        organization_id: `org_${userId.slice(0, 8)}`,
        contact: {
          name: 'Priya Mehta',
          handle_or_phone: '@priya_invest',
        },
        channel: 'telegram',
        last_message: {
          content: 'Auto-approval worked instantly! Thanks.',
          created_at: new Date(Date.now() - 55 * 60000).toISOString(),
          direction: 'inbound',
        },
        unread_count: 0,
        status: 'resolved',
      },
    ];
  }

  public static async getMessages(conversationId: string): Promise<NormalizedMessage[]> {
    return [
      {
        id: `tg_msg_1`,
        conversation_id: conversationId,
        channel: 'telegram',
        direction: 'inbound',
        content: 'I subscribed to the VIP Signal group via Telesub.',
        media: [],
        sender: { name: 'Aman Deep', type: 'contact' },
        created_at: new Date(Date.now() - 5 * 60000).toISOString(),
      },
      {
        id: `tg_msg_2`,
        conversation_id: conversationId,
        channel: 'telegram',
        direction: 'outbound',
        content: 'Welcome Aman! You now have full access to our automated signals channel.',
        media: [],
        sender: { name: 'GAP Telegram Bot', type: 'bot' },
        created_at: new Date(Date.now() - 3 * 60000).toISOString(),
      },
    ];
  }

  public static async sendMessage(
    conversationId: string,
    content: string,
    attachments?: Array<{ url: string; type: string }>
  ): Promise<NormalizedMessage> {
    return {
      id: `tg_msg_${Date.now()}`,
      conversation_id: conversationId,
      channel: 'telegram',
      direction: 'outbound',
      content,
      media: (attachments || []).map((a) => ({ url: a.url, type: a.type as any })),
      sender: { name: 'Support Agent', type: 'agent' },
      created_at: new Date().toISOString(),
    };
  }
}
