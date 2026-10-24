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
  collapseId?: string;
  _displayInForeground?: boolean;
  richContent?: {
    image?: string;
  };
}

export const DEFAULT_NOTIFICATION_LARGE_ICON =
  'https://uklxlappjcuvdqjvecfh.supabase.co/storage/v1/object/public/landing-page-logos/notification_large_icon.png';

export class NotificationService {
  private static adminSupabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
  );

  // Canonical send dedupe: key = `${rowId}:${token}` (60s window).
  // Falls back to `${token}:${title}:${body}` (60s window) for ad-hoc sends.
  private static recentDispatchedPayloads = new Map<string, number>();

  // Canonical processed-row set (row.id) — 5 min window, both for
  // realtime INSERTs and polling-inserted rows.
  private static processedRowIds = new Set<string>();

  // Milestone emitter guard so a slow poll can't re-emit the same milestone.
  private static emittedMilestones = new Set<string>();

  private static realtimeChannel: any = null;

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
   * Send Expo Push Notification via Expo HTTP API.
   * Canonical dedupe key = `row:${data.id}:${token}` when data.id exists,
   * otherwise `msg:${token}:${title}:${body}`. Window = 60s.
   */
  static async sendExpoPushNotification(messages: ExpoPushMessage | ExpoPushMessage[]): Promise<any> {
    const messageList = Array.isArray(messages) ? messages : [messages];

    const validMessages = messageList.filter((m) => {
      const tokens = Array.isArray(m.to) ? m.to : [m.to];
      return tokens.some(
        (t) =>
          typeof t === 'string' &&
          (t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken['))
      );
    });

    if (validMessages.length === 0) {
      console.warn('[NotificationService] No valid Expo push tokens found in messages.');
      return { success: false, reason: 'No valid Expo push tokens' };
    }

    const now = Date.now();
    const DEDUPE_WINDOW_MS = 60_000;

    const uniqueMessages = validMessages.filter((msg) => {
      const targetToken = Array.isArray(msg.to) ? msg.to.join(',') : msg.to;
      const rowId = msg.data?.id;
      const dedupeKey = rowId
        ? `row:${rowId}:${targetToken}`
        : `msg:${targetToken}:${msg.title}:${msg.body}`;

      const lastSent = NotificationService.recentDispatchedPayloads.get(dedupeKey);
      if (lastSent && now - lastSent < DEDUPE_WINDOW_MS) {
        console.warn(`🛑 [NotificationService] Suppressing duplicate push (${dedupeKey})`);
        return false;
      }
      NotificationService.recentDispatchedPayloads.set(dedupeKey, now);

      // Opportunistic cleanup of stale entries
      if (NotificationService.recentDispatchedPayloads.size > 2000) {
        for (const [k, t] of NotificationService.recentDispatchedPayloads) {
          if (now - t > DEDUPE_WINDOW_MS) NotificationService.recentDispatchedPayloads.delete(k);
        }
      }
      return true;
    });

    if (uniqueMessages.length === 0) {
      console.log('ℹ️ [NotificationService] All identical duplicate notifications suppressed.');
      return { success: true, reason: 'Duplicates suppressed' };
    }

    try {
      const response = await axios.post(
        'https://exp.host/--/api/v2/push/send',
        uniqueMessages,
        {
          headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
        }
      );

      const tickets = response.data?.data;
      if (Array.isArray(tickets)) {
        const ticketToTokenMap = new Map<string, string>();
        for (let i = 0; i < tickets.length; i++) {
          const ticket = tickets[i];
          const msg = uniqueMessages[i];
          const targetToken = Array.isArray(msg?.to) ? msg.to.join(',') : msg?.to;
          if (ticket?.status === 'error') {
            console.error(
              `❌ [NotificationService] Delivery ticket error for ${targetToken}:`,
              ticket.message,
              ticket.details
            );
            if (ticket.details?.error === 'DeviceNotRegistered') {
              console.warn(`🧹 [NotificationService] Removing expired FCM token from profiles: ${targetToken}`);
              await this.adminSupabase.from('profiles').update({ push_token: null }).eq('push_token', targetToken);
            }
          } else if (ticket?.id && targetToken) {
            ticketToTokenMap.set(ticket.id, targetToken);
            console.log(`✅ [NotificationService] Push ticket dispatched: ${ticket.id} to ${targetToken}`);
          }
        }

        if (ticketToTokenMap.size > 0) {
          setTimeout(async () => {
            try {
              const receiptRes = await axios.post(
                'https://exp.host/--/api/v2/push/getReceipts',
                { ids: Array.from(ticketToTokenMap.keys()) },
                { headers: { 'Content-Type': 'application/json' } }
              );
              const receipts = receiptRes.data?.data || {};
              for (const [tId, tToken] of ticketToTokenMap.entries()) {
                const r = receipts[tId];
                if (r?.status === 'error') {
                  console.error(`❌ [NotificationService] FCM Receipt failed for ${tToken}:`, r.message, r.details);
                  if (r.details?.error === 'DeviceNotRegistered') {
                    console.warn(`🧹 [NotificationService] Auto-cleaning invalid FCM token: ${tToken}`);
                    await this.adminSupabase.from('profiles').update({ push_token: null }).eq('push_token', tToken);
                  }
                } else if (r?.status === 'ok') {
                  console.log(`🎉 [NotificationService] FCM Confirmed Delivery for ${tToken}`);
                }
              }
            } catch (rErr: any) {
              console.warn('[NotificationService] Receipt check notice:', rErr?.message || rErr);
            }
          }, 2500);
        }
      }

      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(
        '[NotificationService] Error sending Expo push notification:',
        error?.response?.data || error.message
      );
      return { success: false, error: error?.response?.data || error.message };
    }
  }

  /**
   * Send push notification directly to an Expo push token
   */
  static async sendDirectPush(
    pushToken: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, any>;
      channelId?: string;
      imageUrl?: string;
    }
  ) {
    if (!pushToken || (!pushToken.startsWith('ExponentPushToken[') && !pushToken.startsWith('ExpoPushToken['))) {
      return { success: false, reason: 'Invalid Expo push token' };
    }

    const rawImageUrl =
      notification.imageUrl ||
      notification.data?.imageUrl ||
      notification.data?.image ||
      DEFAULT_NOTIFICATION_LARGE_ICON;
    const isValidHttpsUrl = typeof rawImageUrl === 'string' && rawImageUrl.trim().startsWith('https://');
    const imageUrl = isValidHttpsUrl ? rawImageUrl.trim() : DEFAULT_NOTIFICATION_LARGE_ICON;

    const rowId = notification.data?.id;
    const notifTag = `getai_${rowId || 'direct'}_${Date.now()}`;
    const payload: ExpoPushMessage = {
      to: pushToken,
      title: notification.title,
      body: notification.body,
      data: {
        ...(notification.data || {}),
        tag: notifTag,
        imageUrl,
      },
      sound: 'default',
      channelId: notification.channelId || 'default',
      priority: 'high',
      badge: 1,
      collapseId: notifTag,
      richContent: { image: imageUrl },
    };

    return await this.sendExpoPushNotification(payload);
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
      imageUrl?: string;
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

      const rawImageUrl =
        notification.imageUrl ||
        notification.data?.imageUrl ||
        notification.data?.image ||
        DEFAULT_NOTIFICATION_LARGE_ICON;
      const isValidHttpsUrl = typeof rawImageUrl === 'string' && rawImageUrl.trim().startsWith('https://');
      const imageUrl = isValidHttpsUrl ? rawImageUrl.trim() : DEFAULT_NOTIFICATION_LARGE_ICON;

      const rowId = notification.data?.id;
      const notifTag = `getai_${rowId || userId}`;
      const payload: ExpoPushMessage = {
        to: pushToken,
        title: notification.title,
        body: notification.body,
        data: {
          ...(notification.data || {}),
          tag: notifTag,
          imageUrl,
        },
        sound: 'default',
        channelId: notification.channelId || 'default',
        priority: 'high',
        badge: 1,
        collapseId: notifTag,
        richContent: { image: imageUrl },
      };

      return await this.sendExpoPushNotification(payload);
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

    if (organizationId && organizationId !== excludeUserId) {
      targetUserIds.add(organizationId);
    }

    if (targetUserIds.size === 0) {
      return { success: false, reason: 'No destination users found for organization' };
    }

    try {
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
        .filter(
          (t): t is string =>
            Boolean(t && (t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken[')))
        );

      const uniqueTokens = Array.from(new Set(validTokens));
      if (uniqueTokens.length === 0) {
        return { success: false, reason: 'No registered push tokens found for organization users' };
      }

      const rowId = notification.data?.id;
      const notifTag = `getai_org_${organizationId}_${rowId || Date.now()}`;
      const messages: ExpoPushMessage[] = uniqueTokens.map((token) => ({
        to: token,
        title: notification.title,
        body: notification.body,
        data: {
          ...(notification.data || {}),
          tag: notifTag,
        },
        sound: 'default',
        channelId: notification.channelId || 'default',
        priority: 'high',
        collapseId: notifTag,
        richContent: { image: DEFAULT_NOTIFICATION_LARGE_ICON },
      }));

      return await this.sendExpoPushNotification(messages);
    } catch (err: any) {
      console.error(`[NotificationService] Error sending notification to org ${organizationId}:`, err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Broadcast to ALL regular mobile app users
   */
  static async sendToAllUsers(notification: {
    title: string;
    body: string;
    data?: Record<string, any>;
    channelId?: string;
  }) {
    try {
      const { data: profiles, error } = await this.adminSupabase
        .from('profiles')
        .select('id, push_token')
        .not('push_token', 'is', null);

      if (error || !profiles) {
        console.warn('[NotificationService] Failed to query user push tokens for broadcast:', error?.message);
        return { success: false, error: error?.message };
      }

      const validTokens = profiles
        .map((p) => p.push_token)
        .filter(
          (t): t is string =>
            Boolean(t && (t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken[')))
        );

      const uniqueTokens = Array.from(new Set(validTokens));
      if (uniqueTokens.length === 0) {
        console.warn('[NotificationService] No registered user push tokens found for broadcast.');
        return { success: false, reason: 'No registered push tokens found for users' };
      }

      console.log(
        `[NotificationService] Broadcasting admin update to ${uniqueTokens.length} active mobile user devices...`
      );

      const chunkSize = 100;
      const results = [];
      const rowId = notification.data?.id;
      const notifTag = `getai_broadcast_${rowId || Date.now()}`;

      for (let i = 0; i < uniqueTokens.length; i += chunkSize) {
        const chunk = uniqueTokens.slice(i, i + chunkSize);
        const messages: ExpoPushMessage[] = chunk.map((token) => ({
          to: token,
          title: notification.title,
          body: notification.body,
          data: {
            ...(notification.data || {}),
            tag: notifTag,
          },
          sound: 'default',
          channelId: notification.channelId || 'default',
          priority: 'high',
          badge: 1,
          collapseId: notifTag,
          richContent: { image: DEFAULT_NOTIFICATION_LARGE_ICON },
        }));

        const res = await this.sendExpoPushNotification(messages);
        results.push(res);
      }

      return { success: true, count: uniqueTokens.length, results };
    } catch (err: any) {
      console.error('[NotificationService] Error broadcasting admin update to users:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Admin Activity Dispatcher
   */
  static async broadcastAdminUpdateToUsers(update: {
    type: 'broadcast' | 'maintenance' | 'feature' | 'offer' | 'custom';
    title?: string;
    body: string;
    route?: string;
    metadata?: Record<string, any>;
  }) {
    let title = update.title;
    let channelId = 'default';
    let route = update.route || '/(tabs)';

    switch (update.type) {
      case 'maintenance': {
        title = title || '🛠️ System Maintenance Update';
        channelId = 'system';
        route = route || '/(tabs)';
        break;
      }
      case 'feature': {
        title = title || '🚀 New Platform Update Available';
        channelId = 'default';
        route = route || '/tools';
        break;
      }
      case 'offer': {
        title = title || '🎁 Special Announcement & Offers';
        channelId = 'billing';
        route = route || '/pricing';
        break;
      }
      case 'broadcast':
      default: {
        title = title || '📢 Announcement from GetAiPilot';
        channelId = 'default';
        route = route || '/(tabs)';
        break;
      }
    }

    return await this.sendToAllUsers({
      title,
      body: update.body,
      channelId,
      data: {
        route,
        type: update.type,
        ...(update.metadata || {}),
      },
    });
  }

  /**
   * Send push notification to all Administrators
   */
  static async sendToAdmins(notification: {
    title: string;
    body: string;
    data?: Record<string, any>;
    channelId?: string;
  }) {
    try {
      const { data: adminProfiles, error } = await this.adminSupabase
        .from('profiles')
        .select('id, push_token, is_admin, role')
        .or('is_admin.eq.true,role.eq.Admin,role.eq.admin,role.eq.Owner');

      if (error || !adminProfiles) {
        console.warn('[NotificationService] Admin profiles lookup notice:', error?.message);
        return { success: false, error: error?.message };
      }

      const validTokens = adminProfiles
        .map((p) => p.push_token)
        .filter(
          (t): t is string =>
            Boolean(t && (t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken[')))
        );

      const uniqueTokens = Array.from(new Set(validTokens));
      if (uniqueTokens.length === 0) {
        return { success: false, reason: 'No registered push tokens found for administrators' };
      }

      const messages: ExpoPushMessage[] = uniqueTokens.map((token) => ({
        to: token,
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        sound: 'default',
        channelId: notification.channelId || 'admin',
        priority: 'high',
        richContent: { image: DEFAULT_NOTIFICATION_LARGE_ICON },
      }));

      return await this.sendExpoPushNotification(messages);
    } catch (err: any) {
      console.error('[NotificationService] Error sending notification to admins:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Broadcast an Admin Activity notification
   */
  static async notifyAdminActivity(activity: {
    action: string;
    title?: string;
    message?: string;
    actorName?: string;
    actorId?: string;
    details?: Record<string, any>;
  }) {
    let title = activity.title;
    let body = activity.message;
    let channelId = 'admin';
    let targetRoute = '/(tabs)/admin';
    const extraData: Record<string, any> = {
      type: 'admin',
      action: activity.action,
      ...(activity.details || {}),
    };

    switch (activity.action) {
      case 'maintenance_toggle': {
        const status = activity.details?.enabled ? 'Activated 🛑' : 'Deactivated ✅';
        title = title || `🛡️ Maintenance ${status}`;
        body =
          body ||
          `${activity.details?.productName || 'Platform'} maintenance was toggled by ${activity.actorName || 'Admin'
          }.`;
        channelId = 'admin';
        targetRoute = '/admin/maintenance';
        extraData.type = 'admin_maintenance';
        break;
      }
      case 'payment_received': {
        title = title || `💰 Revenue Alert: ₹${activity.details?.amount || 0}`;
        body =
          body ||
          `Customer purchased ${activity.details?.planName || 'Plan'} (${activity.details?.userName || 'Customer'
          }).`;
        channelId = 'billing';
        targetRoute = '/admin/monetize';
        extraData.type = 'admin_payment';
        break;
      }
      case 'new_signup':
      case 'sales_lead': {
        title = title || `🚀 New User / Lead Registered`;
        body =
          body ||
          `${activity.details?.name || activity.details?.email || 'New prospect'} registered on GetAiPilot.`;
        channelId = 'leads';
        targetRoute = '/admin/sales-leads';
        extraData.type = 'admin_sales';
        break;
      }
      case 'product_updated': {
        title = title || `🏷️ Product Catalog Updated`;
        body =
          body ||
          `${activity.details?.productName || 'Product'} details were adjusted by ${activity.actorName || 'Admin'
          }.`;
        channelId = 'admin';
        targetRoute = '/admin/monetize';
        extraData.type = 'admin_monetize';
        break;
      }
      case 'team_updated': {
        title = title || `👥 Team Staff Role Updated`;
        body =
          body ||
          `${activity.details?.name || 'Staff member'} updated to ${activity.details?.role || 'Member'
          }.`;
        channelId = 'admin';
        targetRoute = '/crm';
        extraData.type = 'team';
        break;
      }
      default: {
        title = title || `🛡️ Admin Activity: ${activity.action}`;
        body = body || activity.message || 'Administrative operation performed.';
        channelId = 'admin';
        targetRoute = '/(tabs)/admin';
        break;
      }
    }

    return await this.sendToAdmins({
      title,
      body,
      channelId,
      data: {
        route: targetRoute,
        ...extraData,
      },
    });
  }

  /**
   * Universal Event Dispatcher
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
      case 'message.created': {
        if (data?.direction === 'outbound') return;
        const sender = data?.sender_name || data?.contact_name || 'Customer';
        title = `💬 Message from ${sender}`;
        body =
          typeof data?.content === 'string' && data.content.trim()
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
      case 'conversation.handover':
      case 'conversation.bot_toggled': {
        if (event === 'conversation.bot_toggled' && data?.bot_enabled !== false) return;
        const channelName = data?.channel || 'chat';
        const contact = data?.contact_name || data?.sender_name || 'Customer';
        title = `👤 Human Takeover Requested`;
        body = `AI stopped for ${contact} on ${channelName}. Real human agent is now required.`;
        channelId = 'messages';
        targetRoute = data?.conversation_id ? `/inbox/${data.conversation_id}` : '/inbox';
        extraData = {
          type: 'handover',
          conversationId: data?.conversation_id || data?.conversationId,
          channel: channelName,
        };
        break;
      }
      case 'whatsapp.connected':
      case 'whatsapp.connection.updated': {
        if (
          event === 'whatsapp.connection.updated' &&
          data?.status !== 'connected' &&
          data?.status !== 'active'
        ) {
          return;
        }
        const phone = data?.phone_number || data?.phone || 'Account';
        title = `🟢 WhatsApp Number Connected`;
        body = `WhatsApp Business account (${phone}) is now connected and operational.`;
        channelId = 'messages';
        targetRoute = '/(tabs)';
        extraData = { type: 'whatsapp_connected', phone };
        break;
      }
      case 'social.account.connected': {
        const platform = data?.provider || data?.platform || 'Social';
        const name = data?.name || data?.username || data?.account_name || '';
        title = `🔗 Social Account Connected`;
        body = `${platform} account ${name ? `(${name}) ` : ''
          }has been successfully connected to Social Pilot.`;
        channelId = 'campaigns';
        targetRoute = '/tools';
        extraData = { type: 'social_connected', provider: platform };
        break;
      }
      case 'whatsapp.template.approved':
      case 'whatsapp.template.updated': {
        if (
          event === 'whatsapp.template.updated' &&
          data?.status !== 'APPROVED' &&
          data?.status !== 'approved'
        ) {
          return;
        }
        const templateName = data?.template_name || data?.name || 'Template';
        title = `✅ WhatsApp Template Verified`;
        body = `Template "${templateName}" has been approved by Meta and is ready to send.`;
        channelId = 'campaigns';
        targetRoute = '/(tabs)';
        extraData = { type: 'template_verified', templateName };
        break;
      }
      case 'team.member.created': {
        const memberName = data?.name || data?.first_name || data?.email || 'New member';
        const role = data?.role || 'Member';
        title = `👥 New Team Member Added`;
        body = `${memberName} has been added to your workspace team as ${role}.`;
        channelId = 'admin';
        targetRoute = '/crm';
        extraData = { type: 'team_member', memberId: data?.id };
        break;
      }
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
        return;
      }
      case 'notification.created': {
        title = data?.title || 'GetAiPilot Alert';
        body = data?.body || data?.message || 'New update in your workspace';
        channelId = data?.channelId || 'default';
        targetRoute = data?.route || '/(tabs)/activity';
        extraData = data?.data || {};
        break;
      }
      case 'admin.maintenance': {
        await this.notifyAdminActivity({
          action: 'maintenance_toggle',
          actorName: data?.actor_name,
          details: data,
        });
        return;
      }
      case 'admin.payment': {
        await this.notifyAdminActivity({ action: 'payment_received', details: data });
        return;
      }
      case 'admin.sales_lead': {
        await this.notifyAdminActivity({ action: 'sales_lead', details: data });
        return;
      }
      case 'admin.product_updated': {
        await this.notifyAdminActivity({ action: 'product_updated', details: data });
        return;
      }
      case 'admin.activity': {
        await this.notifyAdminActivity({
          action: data?.action || 'admin_event',
          title: data?.title,
          message: data?.message || data?.body,
          details: data,
        });
        return;
      }
      default: {
        if (data?.title && (data?.body || data?.message)) {
          title = data.title;
          body = data.body || data.message;
          channelId = data?.channelId || 'default';
          targetRoute = data?.route || '/(tabs)/activity';
          extraData = data?.data || {};
        } else {
          return;
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

  /**
   * Process a single `notifications` row → exactly ONE Expo push.
   * Canonical dedupe key = row.id (processedRowIds, 5 min window).
   * sendExpoPushNotification additionally dedupes by `row:${rowId}:${token}`.
   */
  static async processNotificationRow(row: any) {
    if (!row) return;

    // Canonical server-side row dedupe (safely stringified to prevent number/string mismatch)
    const rowIdKey = row.id != null ? String(row.id) : null;
    if (rowIdKey) {
      if (NotificationService.processedRowIds.has(rowIdKey)) {
        console.log(`🛑 [NotificationService] Row ${rowIdKey} already processed. Skipping.`);
        return;
      }
      NotificationService.processedRowIds.add(rowIdKey);
      setTimeout(() => NotificationService.processedRowIds.delete(rowIdKey), 5 * 60_000);
    }

    const title = row.title || 'GetAiPilot Alert';
    const body = row.description || row.content || '';
    let channelId = 'default';
    let route = row.link || '/(tabs)/activity';

    const rawType = (row.type || 'info').toLowerCase();
    if (rawType.includes('whatsapp') || rawType === 'messages') {
      channelId = 'messages';
      route = row.link || '/(tabs)';
    } else if (
      rawType.includes('handover') ||
      rawType.includes('takeover') ||
      rawType.includes('human')
    ) {
      channelId = 'messages';
      route = row.link || '/inbox';
    } else if (
      rawType.includes('social') ||
      rawType.includes('template') ||
      rawType.includes('campaign')
    ) {
      channelId = 'campaigns';
      route = row.link || '/tools';
    } else if (
      rawType.includes('team') ||
      rawType.includes('member') ||
      rawType === 'admin' ||
      rawType === 'leave'
    ) {
      channelId = 'admin';
      route = row.link || '/crm';
    } else if (rawType === 'system') {
      channelId = 'system';
    } else if (
      rawType.includes('click') ||
      rawType.includes('view') ||
      rawType === 'analytics'
    ) {
      channelId = 'analytics';
      route = row.link || '/tools/my-designs';
    }

    console.log(
      `[NotificationService] Dispatching row "${title}" (type=${row.type}, channel=${channelId})`
    );

    const payloadData = {
      route,
      type: row.type || 'system',
      id: row.id,
      userId: row.user_id,
      metadata: row.metadata,
    };

    if (row.user_id) {
      await this.sendToUser(row.user_id, { title, body, channelId, data: payloadData });
    } else if (row.org_id) {
      await this.sendToOrg(row.org_id, { title, body, channelId, data: payloadData });
    } else {
      await this.sendToAllUsers({ title, body, channelId, data: payloadData });
    }
  }

  /**
   * Realtime listener → forwards every `notifications` INSERT to exactly one push.
   */
  static initRealtimeDbListener() {
    try {
      if (NotificationService.realtimeChannel) {
        try {
          this.adminSupabase.removeChannel(NotificationService.realtimeChannel);
        } catch { }
        NotificationService.realtimeChannel = null;
      }

      NotificationService.realtimeChannel = this.adminSupabase
        .channel('public:notifications-push-bridge')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications' },
          async (payload) => {
            const row = payload.new as any;
            if (row) await this.processNotificationRow(row);
          }
        )
        .subscribe((status) => {
          console.log(`[NotificationService] DB Notifications Realtime Bridge: ${status}`);
        });
    } catch (err: any) {
      console.warn('[NotificationService] Failed to init DB notifications bridge:', err?.message || err);
    }
  }

  /**
   * Milestone monitor. Inserts a `notifications` row when a milestone is hit.
   * The row itself is what drives push delivery via initRealtimeDbListener.
   * `emittedMilestones` prevents the same milestone from being inserted twice
   * if a slow poll overlaps with the previous commit.
   */
  static initPageClickMonitor(intervalMs = 30_000) {
    let lastMetrics: Record<string, { clicks: number; views: number }> = {};
    let initialized = false;

    const checkMetrics = async () => {
      try {
        const [bioRes, landingRes, tgRes] = await Promise.all([
          this.adminSupabase
            .from('free_template_submissions')
            .select('id, user_id, page_title, slug, page_views, button_clicks'),
          this.adminSupabase
            .from('landing_template_submissions')
            .select('id, user_id, page_title, slug, page_views, button_clicks'),
          this.adminSupabase
            .from('tg_landing_pages')
            .select('id, user_id, title, slug, view_count'),
        ]);

        const currentMetrics: Record<
          string,
          { clicks: number; views: number; userId: string; title: string; type: 'bio' | 'landing' }
        > = {};

        if (Array.isArray(bioRes.data)) {
          for (const item of bioRes.data) {
            if (!item.user_id) continue;
            currentMetrics[`bio_${item.id}`] = {
              clicks: Number(item.button_clicks || 0),
              views: Number(item.page_views || 0),
              userId: item.user_id,
              title: item.page_title || item.slug || 'Bio Page',
              type: 'bio',
            };
          }
        }
        if (Array.isArray(landingRes.data)) {
          for (const item of landingRes.data) {
            if (!item.user_id) continue;
            currentMetrics[`landing_${item.id}`] = {
              clicks: Number(item.button_clicks || 0),
              views: Number(item.page_views || 0),
              userId: item.user_id,
              title: item.page_title || item.slug || 'Landing Page',
              type: 'landing',
            };
          }
        }
        if (Array.isArray(tgRes.data)) {
          for (const item of tgRes.data) {
            if (!item.user_id) continue;
            currentMetrics[`tg_${item.id}`] = {
              clicks: 0,
              views: Number(item.view_count || 0),
              userId: item.user_id,
              title: item.title || item.slug || 'TG Landing Page',
              type: 'landing',
            };
          }
        }

        if (!initialized) {
          lastMetrics = {};
          for (const [k, v] of Object.entries(currentMetrics)) {
            lastMetrics[k] = { clicks: v.clicks, views: v.views };
          }
          initialized = true;
          return;
        }

        for (const [key, curr] of Object.entries(currentMetrics)) {
          const prev = lastMetrics[key];
          if (!prev) {
            lastMetrics[key] = { clicks: curr.clicks, views: curr.views };
            continue;
          }

          // --- Click milestone (50, 100, 150, ...) ---
          const prevClicks = prev.clicks || 0;
          const currClicks = curr.clicks || 0;
          const prevMilestone = Math.floor(prevClicks / 50) * 50;
          const currMilestone = Math.floor(currClicks / 50) * 50;

          if (currMilestone >= 50 && currMilestone > prevMilestone) {
            const milestoneKey = `click:${curr.userId}:${key}:${currMilestone}`;
            if (!NotificationService.emittedMilestones.has(milestoneKey)) {
              NotificationService.emittedMilestones.add(milestoneKey);
              setTimeout(
                () => NotificationService.emittedMilestones.delete(milestoneKey),
                10 * 60_000
              );

              const pageTypeLabel = curr.type === 'bio' ? 'Bio' : 'Landing';
              const title = `🏆 ${currMilestone} Clicks Milestone on ${pageTypeLabel} Page!`;
              const description = `Congratulations! Your ${pageTypeLabel.toLowerCase()} page "${curr.title
                }" just crossed ${currMilestone} clicks! Total clicks: ${currClicks} 🎉`;

              console.log(
                `[NotificationService] ${currMilestone} clicks milestone for user ${curr.userId}: ${curr.title}`
              );

              const { error: insErr } = await this.adminSupabase
                .from('notifications')
                .insert({
                  user_id: curr.userId,
                  title,
                  description,
                  type: 'page_click',
                  is_read: false,
                });

              if (insErr) {
                console.warn('[NotificationService] Milestone insert error:', insErr.message);
              }
              // Row insert is automatically dispatched to exactly one push by initRealtimeDbListener
            }
          }

          // --- View milestone (100, 200, 300, ...) ---
          const prevViews = prev.views || 0;
          const currViews = curr.views || 0;
          const prevViewMilestone = Math.floor(prevViews / 100) * 100;
          const currViewMilestone = Math.floor(currViews / 100) * 100;

          if (currViewMilestone >= 100 && currViewMilestone > prevViewMilestone) {
            const milestoneKey = `view:${curr.userId}:${key}:${currViewMilestone}`;
            if (!NotificationService.emittedMilestones.has(milestoneKey)) {
              NotificationService.emittedMilestones.add(milestoneKey);
              setTimeout(
                () => NotificationService.emittedMilestones.delete(milestoneKey),
                10 * 60_000
              );

              const pageTypeLabel = curr.type === 'bio' ? 'Bio' : 'Landing';
              const title = `👀 ${currViewMilestone} Views Milestone on ${pageTypeLabel} Page!`;
              const description = `Awesome! Your ${pageTypeLabel.toLowerCase()} page "${curr.title
                }" just crossed ${currViewMilestone} views! Total views: ${currViews} 🚀`;

              console.log(
                `[NotificationService] ${currViewMilestone} views milestone for user ${curr.userId}: ${curr.title}`
              );

              const { error: insErr } = await this.adminSupabase
                .from('notifications')
                .insert({
                  user_id: curr.userId,
                  title,
                  description,
                  type: 'page_view',
                  is_read: false,
                });

              if (insErr) {
                console.warn('[NotificationService] Milestone insert error:', insErr.message);
              }
              // Row insert is automatically dispatched to exactly one push by initRealtimeDbListener
            }
          }

          lastMetrics[key] = { clicks: curr.clicks, views: curr.views };
        }
      } catch (err: any) {
        console.warn('[NotificationService] Page click monitor error:', err?.message || err);
      }
    };

    setTimeout(checkMetrics, 5000);
  }
}