import { SocialAdapter } from '../adapters/social.adapter.js';
import { TelegramAdapter } from '../adapters/telegram.adapter.js';
import { WhatsAppAdapter } from '../adapters/whatsapp.adapter.js';
import { JWTPayload, NormalizedConversation, NormalizedMessage } from '../types/index.js';
import { WebSocketService } from './websocket.service.js';

export interface GetConversationsOptions {
  channel?: string;
  status?: string;
  search?: string;
}

export class InboxService {
  /**
   * Aggregates conversations across WhatsApp, Telegram, Instagram, and Facebook
   */
  public static async getConversations(
    user: JWTPayload,
    options: GetConversationsOptions = {}
  ): Promise<NormalizedConversation[]> {
    const orgId = user.organization_id;
    const userId = user.user_id;

    // Concurrently fetch conversations across WhatsApp and Social channels (Telegram excluded per configuration)
    const [waConvs, socialConvs] = await Promise.all([
      WhatsAppAdapter.getConversations(orgId),
      SocialAdapter.getConversations(orgId),
    ]);

    let allConversations: NormalizedConversation[] = [...waConvs, ...socialConvs];

    // Filter by Channel
    if (options.channel && options.channel !== 'all') {
      allConversations = allConversations.filter((c) => c.channel === options.channel);
    }

    // Filter by Status
    if (options.status && options.status !== 'all') {
      allConversations = allConversations.filter((c) => c.status === options.status);
    }

    // Filter by Search Query
    if (options.search && options.search.trim()) {
      const q = options.search.toLowerCase().trim();
      allConversations = allConversations.filter(
        (c) =>
          c.contact.name.toLowerCase().includes(q) ||
          c.contact.handle_or_phone.toLowerCase().includes(q) ||
          c.last_message.content.toLowerCase().includes(q)
      );
    }

    // Sort by latest message timestamp descending
    allConversations.sort(
      (a, b) =>
        new Date(b.last_message.created_at).getTime() -
        new Date(a.last_message.created_at).getTime()
    );

    return allConversations;
  }

  /**
   * Fetches conversation details and message history
   */
  public static async getConversationDetails(
    conversationId: string,
    user: JWTPayload
  ): Promise<{ conversation: NormalizedConversation | null; messages: NormalizedMessage[] }> {
    const allConvs = await this.getConversations(user);
    const conversation = allConvs.find((c) => c.id === conversationId) || null;

    let messages: NormalizedMessage[] = [];

    if (conversationId.startsWith('tg_')) {
      messages = await TelegramAdapter.getMessages(conversationId);
    } else if (conversationId.startsWith('ig_') || conversationId.startsWith('fb_')) {
      messages = await SocialAdapter.getMessages(conversationId);
    } else {
      messages = await WhatsAppAdapter.getMessages(conversationId);
    }

    // Automatically mark conversation as read when details/messages are retrieved
    await this.markConversationAsRead(conversationId, user).catch(() => {});
    if (conversation) {
      conversation.unread_count = 0;
    }

    return { conversation, messages };
  }

  /**
   * Marks a conversation as read and clears unread count
   */
  public static async markConversationAsRead(
    conversationId: string,
    user: JWTPayload
  ): Promise<void> {
    if (
      !conversationId.startsWith('tg_') &&
      !conversationId.startsWith('ig_') &&
      !conversationId.startsWith('fb_')
    ) {
      await WhatsAppAdapter.markConversationAsRead(conversationId, user.organization_id);
    }

    // Broadcast realtime event
    WebSocketService.broadcastToOrg(user.organization_id, 'conversation.updated', {
      conversation_id: conversationId,
      unread_count: 0,
    });
  }

  /**
   * Sends a message to a conversation across any channel and broadcasts realtime events
   */
  public static async sendMessage(
    conversationId: string,
    content: string,
    attachments: Array<{ url: string; type: string }> = [],
    user: JWTPayload,
    options?: {
      is_internal_note?: boolean;
      template?: any;
    }
  ): Promise<NormalizedMessage> {
    let sentMessage: NormalizedMessage;

    if (conversationId.startsWith('tg_')) {
      sentMessage = await TelegramAdapter.sendMessage(conversationId, content, attachments);
    } else if (conversationId.startsWith('ig_') || conversationId.startsWith('fb_')) {
      sentMessage = await SocialAdapter.sendMessage(conversationId, content, attachments);
    } else {
      sentMessage = await WhatsAppAdapter.sendMessage(conversationId, content, attachments, {
        is_internal_note: options?.is_internal_note,
        template: options?.template,
        sender_user_id: user.user_id,
        sender_name: user.email?.split('@')[0] || 'You',
        context: {
          userId: user.user_id,
          organizationId: user.organization_id,
          role: user.role,
          sessionId: user.session_id,
        },
      });
    }

    // Broadcast Realtime Events across WebSocket Gateway
    WebSocketService.broadcastToOrg(user.organization_id, 'message.created', sentMessage);
    WebSocketService.broadcastToOrg(user.organization_id, 'conversation.updated', {
      conversation_id: conversationId,
      last_message: {
        content: options?.is_internal_note ? `🔒 Note: ${content}` : content,
        created_at: sentMessage.created_at,
        direction: 'outbound',
      },
    });

    return sentMessage;
  }

  public static async assignAgent(
    conversationId: string,
    agentId: string | null,
    agentName: string | null,
    user: JWTPayload
  ) {
    const res = await WhatsAppAdapter.assignAgent(conversationId, user.organization_id, agentId, agentName);
    WebSocketService.broadcastToOrg(user.organization_id, 'conversation.assigned', {
      conversation_id: conversationId,
      assigned_agent_id: agentId,
      assigned_agent_name: agentName,
    });
    return res;
  }

  public static async toggleBot(
    conversationId: string,
    enabled: boolean,
    botId: string | null,
    user: JWTPayload
  ) {
    const res = await WhatsAppAdapter.toggleBot(conversationId, user.organization_id, enabled, botId);
    WebSocketService.broadcastToOrg(user.organization_id, 'conversation.bot_toggled', {
      conversation_id: conversationId,
      bot_enabled: enabled,
      assigned_bot_id: botId,
    });
    return res;
  }

  public static async getTeamMembers(user: JWTPayload) {
    return await WhatsAppAdapter.getTeamMembers(user.organization_id);
  }

  public static async getOrCreateConversation(contactId: string, user: JWTPayload) {
    return await WhatsAppAdapter.getOrCreateConversation(user.organization_id, contactId);
  }
}
