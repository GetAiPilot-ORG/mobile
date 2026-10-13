import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

export interface ExpoPushMessage {
  to: string | string[];
  title?: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
  badge?: number;
}

export class NotificationService {
  private static adminSupabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
  );

  /**
   * Save / register device push token for a user
   */
  static async registerUserPushToken(
    userId: string,
    payload: {
      push_token: string;
      platform?: string;
      device_name?: string;
      app_version?: string;
    }
  ) {
    if (!userId || !payload.push_token) {
      throw new Error('userId and push_token are required');
    }

    try {
      // 1. Update user profile push_token column
      const { error: profileError } = await this.adminSupabase
        .from('profiles')
        .update({
          push_token: payload.push_token,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (profileError) {
        console.warn(`[NotificationService] Profile push_token update warning:`, profileError.message);
      }

      console.log(`[NotificationService] Registered push token for user ${userId}`);
      return { success: true, token: payload.push_token };
    } catch (err: any) {
      console.error(`[NotificationService] Failed to register push token:`, err);
      throw err;
    }
  }

  /**
   * Send Expo Push Notification via Expo HTTP API
   * (https://exp.host/--/api/v2/push/send)
   */
  static async sendExpoPushNotification(messages: ExpoPushMessage | ExpoPushMessage[]): Promise<any> {
    const messageList = Array.isArray(messages) ? messages : [messages];

    // Filter only valid Expo Push Tokens
    const validMessages = messageList.filter((m) => {
      const tokens = Array.isArray(m.to) ? m.to : [m.to];
      return tokens.some((t) => typeof t === 'string' && (t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken[')));
    });

    if (validMessages.length === 0) {
      console.warn('[NotificationService] No valid Expo push tokens found in messages.');
      return { success: false, reason: 'No valid Expo push tokens' };
    }

    try {
      const response = await axios.post(
        'https://exp.host/--/api/v2/push/send',
        validMessages,
        {
          headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
        }
      );

      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('[NotificationService] Error sending Expo push notification:', error?.response?.data || error.message);
      return { success: false, error: error?.response?.data || error.message };
    }
  }

  /**
   * Send push notification directly to a specific user by their Supabase ID
   */
  static async sendToUser(
    userId: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, any>;
      channelId?: string;
    }
  ) {
    try {
      const { data: profile } = await this.adminSupabase
        .from('profiles')
        .select('push_token')
        .eq('id', userId)
        .maybeSingle();

      const pushToken = profile?.push_token;
      if (!pushToken) {
        return { success: false, reason: 'User has no registered push token' };
      }

      return await this.sendExpoPushNotification({
        to: pushToken,
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        sound: 'default',
        channelId: notification.channelId || 'default',
        priority: 'high',
      });
    } catch (err: any) {
      console.error(`[NotificationService] Error sending notification to user ${userId}:`, err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Send push notification to all active team members/users of an organization
   */
  static async sendToOrg(
    organizationId: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, any>;
      channelId?: string;
    },
    excludeUserId?: string
  ) {
    if (!organizationId) return { success: false, reason: 'organizationId is required' };

    const targetUserIds = new Set<string>();

    try {
      // 1. Fetch organization members
      const { data: members, error: memErr } = await this.adminSupabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', organizationId)
        .eq('is_active', true);

      if (!memErr && members) {
        for (const m of members) {
          if (m.user_id && m.user_id !== excludeUserId) {
            targetUserIds.add(m.user_id);
          }
        }
      }
    } catch (e: any) {
      console.warn('[NotificationService] Org members lookup notice:', e?.message || e);
    }

    // 2. Also check if organizationId itself matches a user account (solo/direct workspace)
    if (organizationId && organizationId !== excludeUserId) {
      targetUserIds.add(organizationId);
    }

    if (targetUserIds.size === 0) {
      return { success: false, reason: 'No destination users found for organization' };
    }

    try {
      // 3. Retrieve registered push tokens for these users
      const { data: profiles, error: profErr } = await this.adminSupabase
        .from('profiles')
        .select('id, push_token')
        .in('id', Array.from(targetUserIds));

      if (profErr || !profiles) {
        console.warn('[NotificationService] Profile push token query notice:', profErr?.message);
        return { success: false, error: profErr?.message };
      }

      const validTokens = profiles
        .map((p) => p.push_token)
        .filter((t): t is string => Boolean(t && (t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken['))));

      if (validTokens.length === 0) {
        return { success: false, reason: 'No registered push tokens found for organization users' };
      }

      const messages: ExpoPushMessage[] = validTokens.map((token) => ({
        to: token,
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        sound: 'default',
        channelId: notification.channelId || 'default',
        priority: 'high',
      }));

      return await this.sendExpoPushNotification(messages);
    } catch (err: any) {
      console.error(`[NotificationService] Error sending notification to org ${organizationId}:`, err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Universal Event Dispatcher:
   * Maps any system/CRM/Inbox/Voice/Payment event to a high-priority push notification.
   * Reaches devices in:
   * - Foreground (heads-up banner + audio)
   * - Background (system tray banner)
   * - Kill mode (cold launch notification)
   */
  static async dispatchOrgEventNotification(
    organizationId: string,
    event: string,
    data: any,
    triggeredByUserId?: string
  ) {
    if (!organizationId) return;

    let title = '';
    let body = '';
    let channelId = 'default';
    let targetRoute = '/(tabs)/activity';
    let extraData: Record<string, any> = {};

    switch (event) {
      // 1. CRM & Leads
      case 'lead.created': {
        const leadName = data?.first_name || data?.name || data?.full_name || 'New Prospect';
        title = `🎯 New Lead: ${leadName}`;
        body = data?.company
          ? `${data.company} • ${data?.phone || data?.email || 'Captured via inbound channel'}`
          : `Captured new lead: ${data?.phone || data?.email || 'Check CRM for contact details'}`;
        channelId = 'leads';
        targetRoute = '/crm/contacts';
        extraData = { type: 'lead', leadId: data?.id };
        break;
      }

      case 'deal.created': {
        title = `💼 New Deal Created`;
        body = `${data?.title || 'Pipeline Deal'}${data?.value ? ` • $${data.value}` : ''}`;
        channelId = 'leads';
        targetRoute = '/crm/deals';
        extraData = { type: 'deal', dealId: data?.id };
        break;
      }

      case 'task.created': {
        title = `📌 New Task Assigned`;
        body = `${data?.title || 'CRM Task'}${data?.due_date ? ` • Due: ${data.due_date}` : ''}`;
        channelId = 'leads';
        targetRoute = '/crm/tasks';
        extraData = { type: 'task', taskId: data?.id };
        break;
      }

      // 2. Messaging & Inbox (WhatsApp / Telegram / Live Chat)
      case 'message.created': {
        // Do not notify if this message was sent outbound by ourselves
        if (data?.direction === 'outbound') {
          return;
        }

        const sender = data?.sender_name || data?.contact_name || 'Customer';
        title = `💬 Message from ${sender}`;
        body = typeof data?.content === 'string' && data.content.trim()
          ? data.content.trim().slice(0, 100)
          : 'Sent an attachment / media';
        channelId = 'messages';
        targetRoute = '/inbox';
        extraData = {
          type: 'message',
          conversationId: data?.conversation_id || data?.conversationId,
        };
        break;
      }

      case 'conversation.assigned': {
        title = `👤 Conversation Assigned`;
        body = `A customer conversation was assigned to you.`;
        channelId = 'messages';
        targetRoute = '/inbox';
        extraData = {
          type: 'message',
          conversationId: data?.conversation_id || data?.conversationId,
        };
        break;
      }

      // 3. AI Voice Agent & Calls
      case 'call.started': {
        title = `📞 Voice AI Call In Progress`;
        body = `Active call with ${data?.lead_name || data?.phone || 'contact'}`;
        channelId = 'calls';
        targetRoute = '/(tabs)/activity';
        extraData = { type: 'call' };
        break;
      }

      case 'call.completed': {
        title = `✅ Voice AI Call Finished`;
        body = `Call with ${data?.lead_name || data?.phone || 'contact'} completed`;
        channelId = 'calls';
        targetRoute = '/(tabs)/activity';
        extraData = { type: 'call' };
        break;
      }

      // 4. Marketing Broadcasts & Automations
      case 'whatsapp.broadcast.created': {
        title = `📢 Broadcast Launched`;
        body = `Campaign "${data?.name || 'Broadcast'}" is now delivering.`;
        channelId = 'campaigns';
        targetRoute = '/fleet';
        extraData = { type: 'broadcast', broadcastId: data?.id };
        break;
      }

      case 'whatsapp.broadcast.completed': {
        title = `🎉 Broadcast Delivered`;
        body = `Finished sending "${data?.name || 'Broadcast'}".`;
        channelId = 'campaigns';
        targetRoute = '/fleet';
        extraData = { type: 'broadcast', broadcastId: data?.id };
        break;
      }

      // 5. Billing & Quotas
      case 'payment.failed': {
        title = `⚠️ Subscription Renewal Notice`;
        body = `Payment could not be processed. Update payment method.`;
        channelId = 'billing';
        targetRoute = '/account/plans';
        extraData = { type: 'billing' };
        break;
      }

      case 'whatsapp.credits.updated': {
        if (typeof data?.credits === 'number' && data.credits < 20) {
          title = `💳 Low Messaging Balance`;
          body = `You have ${data.credits} credits remaining. Top up to keep automation active.`;
          channelId = 'billing';
          targetRoute = '/account/plans';
          extraData = { type: 'billing' };
          break;
        }
        return; // Don't spam on normal balance refreshes
      }

      // 6. Direct / Custom Notification
      case 'notification.created': {
        title = data?.title || 'GetAiPilot Alert';
        body = data?.body || data?.message || 'New update in your workspace';
        channelId = data?.channelId || 'default';
        targetRoute = data?.route || '/(tabs)/activity';
        extraData = data?.data || {};
        break;
      }

      default: {
        // If data provides explicit title & body, forward it
        if (data?.title && (data?.body || data?.message)) {
          title = data.title;
          body = data.body || data.message;
          channelId = data?.channelId || 'default';
          targetRoute = data?.route || '/(tabs)/activity';
          extraData = data?.data || {};
        } else {
          return; // Ignore internal telemetry events without user-facing text
        }
      }
    }

    await this.sendToOrg(
      organizationId,
      {
        title,
        body,
        channelId,
        data: {
          route: targetRoute,
          ...extraData,
        },
      },
      triggeredByUserId
    );
  }
}
