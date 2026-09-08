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

    // Concurrently fetch conversations across all channel adapters
    const [waConvs, tgConvs, socialConvs] = await Promise.all([
      WhatsAppAdapter.getConversations(orgId),
      TelegramAdapter.getConversations(userId),
      SocialAdapter.getConversations(orgId),
    ]);

    let allConversations: NormalizedConversation[] = [...waConvs, ...tgConvs, ...socialConvs];

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

    return { conversation, messages };
  }

  /**
   * Sends a message to a conversation across any channel and broadcasts realtime events
   */
  public static async sendMessage(
    conversationId: string,
    content: string,
    attachments: Array<{ url: string; type: string }> = [],
    user: JWTPayload
  ): Promise<NormalizedMessage> {
    let sentMessage: NormalizedMessage;

    if (conversationId.startsWith('tg_')) {
      sentMessage = await TelegramAdapter.sendMessage(conversationId, content, attachments);
    } else if (conversationId.startsWith('ig_') || conversationId.startsWith('fb_')) {
      sentMessage = await SocialAdapter.sendMessage(conversationId, content, attachments);
    } else {
      sentMessage = await WhatsAppAdapter.sendMessage(conversationId, content, attachments);
    }

    // Broadcast Realtime Events across WebSocket Gateway
    WebSocketService.broadcastToOrg(user.organization_id, 'message.created', sentMessage);
    WebSocketService.broadcastToOrg(user.organization_id, 'conversation.updated', {
      conversation_id: conversationId,
      last_message: {
        content,
        created_at: sentMessage.created_at,
        direction: 'outbound',
      },
    });

    return sentMessage;
  }
}
