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
  _displayInForeground?: boolean;
}

export class NotificationService {
  private static adminSupabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
  );
  private static recentSentKeys = new Set<string>();

  private static isDuplicateBffSend(key: string): boolean {
    if (this.recentSentKeys.has(key)) return true;
    this.recentSentKeys.add(key);
    setTimeout(() => this.recentSentKeys.delete(key), 12000);
    return false;
  }

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
        badge: 1,
        _displayInForeground: true,
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
   * Broadcast an Admin Update or Announcement to ALL regular mobile app users
   * Delivers high-priority push notifications across Foreground, Background, and Kill mode.
   */
  static async sendToAllUsers(notification: {
    title: string;
    body: string;
    data?: Record<string, any>;
    channelId?: string;
  }) {
    try {
      // 1. Fetch all profiles that have an active push token registered
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
        .filter((t): t is string => Boolean(t && (t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken['))));

      // Deduplicate tokens
      const uniqueTokens = Array.from(new Set(validTokens));

      if (uniqueTokens.length === 0) {
        console.warn('[NotificationService] No registered user push tokens found for broadcast.');
        return { success: false, reason: 'No registered push tokens found for users' };
      }

      console.log(`[NotificationService] Broadcasting admin update to ${uniqueTokens.length} active mobile user devices...`);

      // 2. Batch in chunks of 100 for Expo HTTP push service
      const chunkSize = 100;
      const results = [];

      for (let i = 0; i < uniqueTokens.length; i += chunkSize) {
        const chunk = uniqueTokens.slice(i, i + chunkSize);
        const messages: ExpoPushMessage[] = chunk.map((token) => ({
          to: token,
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: 'default',
          channelId: notification.channelId || 'default',
          priority: 'high',
          badge: 1,
          _displayInForeground: true,
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
   * Dedicated Admin Activity Dispatcher:
   * Called whenever an Admin performs an action on the dashboard or backend,
   * informing regular mobile users about the update!
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
   * Send push notification directly to all Administrators & Platform Owners
   */
  static async sendToAdmins(notification: {
    title: string;
    body: string;
    data?: Record<string, any>;
    channelId?: string;
  }) {
    try {
      // Find all profiles where is_admin is true OR role is 'admin' / 'Admin' / 'Owner'
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
        .filter((t): t is string => Boolean(t && (t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken['))));

      if (validTokens.length === 0) {
        return { success: false, reason: 'No registered push tokens found for administrators' };
      }

      const messages: ExpoPushMessage[] = validTokens.map((token) => ({
        to: token,
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        sound: 'default',
        channelId: notification.channelId || 'admin',
        priority: 'high',
      }));

      return await this.sendExpoPushNotification(messages);
    } catch (err: any) {
      console.error('[NotificationService] Error sending notification to admins:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Broadcast an Admin Activity notification to all administrators
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
        body = body || `${activity.details?.productName || 'Platform'} maintenance was toggled by ${activity.actorName || 'Admin'}.`;
        channelId = 'admin';
        targetRoute = '/admin/maintenance';
        extraData.type = 'admin_maintenance';
        break;
      }

      case 'payment_received': {
        title = title || `💰 Revenue Alert: ₹${activity.details?.amount || 0}`;
        body = body || `Customer purchased ${activity.details?.planName || 'Plan'} (${activity.details?.userName || 'Customer'}).`;
        channelId = 'billing';
        targetRoute = '/admin/monetize';
        extraData.type = 'admin_payment';
        break;
      }

      case 'new_signup':
      case 'sales_lead': {
        title = title || `🚀 New User / Lead Registered`;
        body = body || `${activity.details?.name || activity.details?.email || 'New prospect'} registered on GetAiPilot.`;
        channelId = 'leads';
        targetRoute = '/admin/sales-leads';
        extraData.type = 'admin_sales';
        break;
      }

      case 'product_updated': {
        title = title || `🏷️ Product Catalog Updated`;
        body = body || `${activity.details?.productName || 'Product'} details were adjusted by ${activity.actorName || 'Admin'}.`;
        channelId = 'admin';
        targetRoute = '/admin/monetize';
        extraData.type = 'admin_monetize';
        break;
      }

      case 'team_updated': {
        title = title || `👥 Team Staff Role Updated`;
        body = body || `${activity.details?.name || 'Staff member'} updated to ${activity.details?.role || 'Member'}.`;
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
   * Universal Event Dispatcher:
   * Maps any system/CRM/Inbox/Voice/Payment/Admin event to a high-priority push notification.
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

      // Handover: AI to Real Human takeover (WhatsApp, Instagram, Social)
      case 'conversation.handover':
      case 'conversation.bot_toggled': {
        if (event === 'conversation.bot_toggled' && data?.bot_enabled !== false) {
          return; // Only notify when AI is disabled and real human takes over
        }
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

      // WhatsApp Number Connected
      case 'whatsapp.connected':
      case 'whatsapp.connection.updated': {
        if (event === 'whatsapp.connection.updated' && data?.status !== 'connected' && data?.status !== 'active') {
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

      // Social Media Account Connected (Social Pilot)
      case 'social.account.connected': {
        const platform = data?.provider || data?.platform || 'Social';
        const name = data?.name || data?.username || data?.account_name || '';
        title = `🔗 Social Account Connected`;
        body = `${platform} account ${name ? `(${name}) ` : ''}has been successfully connected to Social Pilot.`;
        channelId = 'campaigns';
        targetRoute = '/tools';
        extraData = { type: 'social_connected', provider: platform };
        break;
      }

      // WhatsApp Template Verified / Approved
      case 'whatsapp.template.approved':
      case 'whatsapp.template.updated': {
        if (event === 'whatsapp.template.updated' && data?.status !== 'APPROVED' && data?.status !== 'approved') {
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

      // New Team Member Added
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

      // 7. Admin & Security Console Activities
      case 'admin.maintenance': {
        await this.notifyAdminActivity({
          action: 'maintenance_toggle',
          actorName: data?.actor_name,
          details: data,
        });
        return;
      }

      case 'admin.payment': {
        await this.notifyAdminActivity({
          action: 'payment_received',
          details: data,
        });
        return;
      }

      case 'admin.sales_lead': {
        await this.notifyAdminActivity({
          action: 'sales_lead',
          details: data,
        });
        return;
      }

      case 'admin.product_updated': {
        await this.notifyAdminActivity({
          action: 'product_updated',
          details: data,
        });
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

  /**
   * Realtime Database Bridge:
  /**
   * Helper to process any notification record and send native Expo Push Notification
   */
  static async processNotificationRow(row: any) {
    if (!row) return;

    const title = row.title || 'GetAiPilot Alert';
    const body = row.description || row.content || '';
    let channelId = 'default';
    let route = row.link || '/(tabs)/activity';

    const rawType = (row.type || 'info').toLowerCase();
    if (rawType.includes('whatsapp') || rawType === 'messages') {
      channelId = 'messages';
      route = row.link || '/(tabs)';
    } else if (rawType.includes('handover') || rawType.includes('takeover') || rawType.includes('human')) {
      channelId = 'messages';
      route = row.link || '/inbox';
    } else if (rawType.includes('social') || rawType.includes('template') || rawType.includes('campaign')) {
      channelId = 'campaigns';
      route = row.link || '/tools';
    } else if (rawType.includes('team') || rawType.includes('member') || rawType === 'admin' || rawType === 'leave') {
      channelId = 'admin';
      route = row.link || '/crm';
    } else if (rawType === 'system') {
      channelId = 'system';
    } else if (rawType.includes('click') || rawType.includes('view') || rawType === 'analytics') {
      channelId = 'analytics';
      route = row.link || '/tools/my-designs';
    }

    const dedupeKey = `${row.id || ''}_${row.user_id || row.org_id || 'broadcast'}_${title}_${body}`;
    if (this.isDuplicateBffSend(dedupeKey)) {
      return;
    }

    console.log(`[NotificationService] Processing DB notification: "${title}" (Type: ${row.type}, Channel: ${channelId})`);

    if (row.user_id) {
      await this.sendToUser(row.user_id, {
        title,
        body,
        channelId,
        data: {
          route,
          type: row.type || 'system',
          id: row.id,
          userId: row.user_id,
          metadata: row.metadata,
        },
      });
    } else if (row.org_id) {
      await this.sendToOrg(row.org_id, {
        title,
        body,
        channelId,
        data: {
          route,
          type: row.type || 'system',
          id: row.id,
          metadata: row.metadata,
        },
      });
    } else {
      // Platform-wide Broadcast (user_id is null): Deliver to ALL active mobile users
      await this.sendToAllUsers({
        title,
        body,
        channelId,
        data: {
          route,
          type: row.type || 'broadcast',
          id: row.id,
          metadata: row.metadata,
        },
      });
    }
  }

  /**
   * Listens to table `notifications` inserts from bot-dashboard (Admin Broadcast,
   * Waitlist alerts, Attendance/Leave requests) and automatically forwards them
   * as Expo Push Notifications to mobile devices in Foreground, Background, and Kill mode.
   * Includes both Supabase Realtime and high-speed DB polling fallback.
   */
  static initRealtimeDbListener() {
    try {
      // 1. Supabase Realtime channel listener
      this.adminSupabase
        .channel('public:notifications-push-bridge')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications' },
          async (payload) => {
            const row = payload.new as any;
            if (row) {
              await this.processNotificationRow(row);
            }
          }
        )
        .subscribe((status) => {
          console.log(`[NotificationService] Bot-Dashboard DB Notifications Realtime Bridge: ${status}`);
        });
    } catch (err: any) {
      console.warn('[NotificationService] Failed to initialize DB notifications bridge:', err?.message || err);
    }
  }

  /**
   * Monitor user landing pages and bio pages for click count & view milestone updates.
   * Listens directly to postgres_changes UPDATE events on:
   *  - free_template_submissions
   *  - landing_template_submissions
   *  - tg_landing_pages
   * ZERO POLLING / ZERO REST queries: 100% event-driven, exactly like QuickPost.
   */
  static initPageClickMonitor() {
    try {
      const handleSubmissionUpdate = async (payload: any, type: 'bio' | 'landing') => {
        try {
          const oldRow = payload.old || {};
          const newRow = payload.new || {};

          if (!newRow.user_id) return;

          const prevClicks = Number(oldRow.button_clicks || 0);
          const currClicks = Number(newRow.button_clicks || 0);
          const prevMilestone = Math.floor(prevClicks / 50) * 50;
          const currMilestone = Math.floor(currClicks / 50) * 50;

          const title = newRow.page_title || newRow.slug || (type === 'bio' ? 'Bio Page' : 'Landing Page');
          const pageTypeLabel = type === 'bio' ? 'Bio' : 'Landing';

          // Milestone reached at 50, 100, 150, 200, 250, ...
          if (currMilestone >= 50 && currMilestone > prevMilestone) {
            console.log(`[NotificationService] ${currMilestone} clicks milestone achieved for user ${newRow.user_id}: ${title}`);
            await this.adminSupabase.from('notifications').insert({
              user_id: newRow.user_id,
              title: `🏆 ${currMilestone} Clicks Milestone on ${pageTypeLabel} Page!`,
              description: `Congratulations! Your ${pageTypeLabel.toLowerCase()} page "${title}" just crossed ${currMilestone} clicks! Total clicks: ${currClicks} 🎉`,
              type: 'page_click',
              is_read: false,
            });
          }

          // Views milestone reached at 100, 200, 300, ...
          const prevViews = Number(oldRow.page_views || 0);
          const currViews = Number(newRow.page_views || 0);
          const prevViewMilestone = Math.floor(prevViews / 100) * 100;
          const currViewMilestone = Math.floor(currViews / 100) * 100;

          if (currViewMilestone >= 100 && currViewMilestone > prevViewMilestone) {
            console.log(`[NotificationService] ${currViewMilestone} views milestone detected for user ${newRow.user_id}: ${title}`);
            await this.adminSupabase.from('notifications').insert({
              user_id: newRow.user_id,
              title: `👀 ${currViewMilestone} Views Milestone on ${pageTypeLabel} Page!`,
              description: `Awesome! Your ${pageTypeLabel.toLowerCase()} page "${title}" just crossed ${currViewMilestone} views! Total views: ${currViews} 🚀`,
              type: 'page_view',
              is_read: false,
            });
          }
        } catch (err: any) {
          console.warn('[NotificationService] Error handling submission update event:', err?.message || err);
        }
      };

      const handleTgPageUpdate = async (payload: any) => {
        try {
          const oldRow = payload.old || {};
          const newRow = payload.new || {};

          if (!newRow.user_id) return;

          const prevViews = Number(oldRow.view_count || 0);
          const currViews = Number(newRow.view_count || 0);
          const prevViewMilestone = Math.floor(prevViews / 100) * 100;
          const currViewMilestone = Math.floor(currViews / 100) * 100;

          const title = newRow.title || newRow.slug || 'TG Landing Page';

          if (currViewMilestone >= 100 && currViewMilestone > prevViewMilestone) {
            console.log(`[NotificationService] ${currViewMilestone} views milestone detected for TG page user ${newRow.user_id}: ${title}`);
            await this.adminSupabase.from('notifications').insert({
              user_id: newRow.user_id,
              title: `👀 ${currViewMilestone} Views Milestone on Landing Page!`,
              description: `Awesome! Your Telegram landing page "${title}" just crossed ${currViewMilestone} views! Total views: ${currViews} 🚀`,
              type: 'page_view',
              is_read: false,
            });
          }
        } catch (err: any) {
          console.warn('[NotificationService] Error handling tg_landing_pages update event:', err?.message || err);
        }
      };

      this.adminSupabase
        .channel('public:page-milestones-realtime')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'free_template_submissions' },
          (payload) => handleSubmissionUpdate(payload, 'bio')
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'landing_template_submissions' },
          (payload) => handleSubmissionUpdate(payload, 'landing')
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'tg_landing_pages' },
          (payload) => handleTgPageUpdate(payload)
        )
        .subscribe((status) => {
          console.log(`[NotificationService] Page Milestone Realtime Listener: ${status}`);
        });
    } catch (err: any) {
      console.warn('[NotificationService] Failed to initialize page click realtime monitor:', err?.message || err);
    }
  }
}
