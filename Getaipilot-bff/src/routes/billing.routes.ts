import { FastifyInstance } from 'fastify';
import { HubAdapter } from '../adapters/hub.adapter.js';
import { NotificationService } from '../services/notification.service.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { JWTPayload } from '../types/index.js';

export async function billingRoutes(fastify: FastifyInstance) {
  // POST /mobile/v1/user/push-token - Register device Expo push token
  fastify.post('/user/push-token', async (request: any, reply: any) => {
    let userId: string | undefined = (request.user as JWTPayload)?.user_id;
    const body = request.body as {
      user_id?: string;
      userId?: string;
      push_token: string;
      platform?: string;
      device_name?: string;
      app_version?: string;
    };

    userId = userId || body?.user_id || body?.userId;

    if (!userId || !body?.push_token) {
      return reply.status(400).send({ error: 'user_id and push_token are required' });
    }

    try {
      const result = await NotificationService.registerUserPushToken(userId, body);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(500).send({ error: err.message || 'Failed to save push token' });
    }
  });

  // POST /mobile/v1/user/test-push - Send a test push notification to user's device
  fastify.post('/user/test-push', async (request: any, reply: any) => {
    let userId: string | undefined = (request.user as JWTPayload)?.user_id;
    const body = (request.body as any) || {};
    userId = userId || body.user_id || body.userId;
    const directToken = body.push_token || body.pushToken;

    if (!userId && !directToken) {
      return reply.status(400).send({ error: 'userId or push_token is required' });
    }

    const imageUrl = body.imageUrl || body.image || 'https://uklxlappjcuvdqjvecfh.supabase.co/storage/v1/object/public/landing-page-logos/notification_large_icon.png';
    const notificationPayload = {
      title: body.title || 'GetAiPilot Push Notification 🚀',
      body: body.body || 'Push notifications are fully working from your BFF service!',
      channelId: body.channelId || 'default',
      imageUrl,
      data: body.data || {
        route: body.route || '/account/plans',
        isTest: true,
        ...(imageUrl ? { imageUrl } : {}),
      },
    };

    let result;
    if (directToken) {
      result = await NotificationService.sendDirectPush(directToken, notificationPayload);
    } else if (userId) {
      result = await NotificationService.sendToUser(userId, notificationPayload);
    }

    return reply.send(result);
  });

  // POST /mobile/v1/user/test-event - Trigger an event-driven push notification across the organization
  fastify.post('/user/test-event', { preHandler: [authenticateToken] }, async (request: any, reply: any) => {
    const user = request.user as JWTPayload;
    const body = (request.body as any) || {};
    const event = body.event || 'lead.created';
    const eventData = body.data || {
      first_name: 'John Doe',
      company: 'Acme Growth Corp',
      email: 'john@example.com',
      phone: '+1 555-0199',
    };

    const orgId = user.organization_id || user.user_id;
    await NotificationService.dispatchOrgEventNotification(orgId, event, eventData);
    return reply.send({ success: true, event, organization_id: orgId });
  });

  // POST /mobile/v1/admin/broadcast-to-users - Admin broadcasts an announcement/update to all mobile users
  fastify.post('/admin/broadcast-to-users', async (request: any, reply: any) => {
    const body = (request.body as any) || {};

    if (!body.body && !body.message) {
      return reply.status(400).send({ error: 'Notification message body is required' });
    }

    const result = await NotificationService.broadcastAdminUpdateToUsers({
      type: body.type || 'broadcast',
      title: body.title,
      body: body.body || body.message,
      route: body.route,
      metadata: body.metadata || body.data,
    });

    return reply.send(result);
  });

  // POST /mobile/v1/admin/maintenance-update - Admin notifies all mobile users about platform maintenance
  fastify.post('/admin/maintenance-update', async (request: any, reply: any) => {
    const body = (request.body as any) || {};
    const isEnabled = Boolean(body.enabled);

    const result = await NotificationService.broadcastAdminUpdateToUsers({
      type: 'maintenance',
      title: isEnabled ? '🛠️ Scheduled System Maintenance' : '✅ System Maintenance Completed',
      body: body.message || (isEnabled
        ? 'GetAiPilot is undergoing scheduled maintenance. Services will resume shortly.'
        : 'All GetAiPilot services and AI pilots are now fully operational!'),
      route: '/(tabs)',
      metadata: { enabled: isEnabled },
    });

    return reply.send(result);
  });

  // POST /mobile/v1/admin/notify-activity - Dispatch real-time push notification to all platform administrators
  fastify.post('/admin/notify-activity', async (request: any, reply: any) => {
    const body = (request.body as any) || {};
    const result = await NotificationService.notifyAdminActivity({
      action: body.action || 'system_alert',
      title: body.title,
      message: body.message,
      actorName: body.actorName,
      actorId: body.actorId,
      details: body.details || {},
    });
    return reply.send(result);
  });
  // GET /mobile/v1/user/profile
  fastify.get('/user/profile', { preHandler: [authenticateToken] }, async (request: any, reply: any) => {
    const user = request.user as JWTPayload;
    const profile = await HubAdapter.getUserProfileDetails(user.user_id);
    return reply.send(profile);
  });

  // PATCH /mobile/v1/user/profile
  fastify.patch('/user/profile', { preHandler: [authenticateToken] }, async (request: any, reply: any) => {
    const user = request.user as JWTPayload;
    const updates = request.body as Record<string, any>;
    const updated = await HubAdapter.updateUserProfile(user.user_id, updates);
    return reply.send(updated);
  });

  // GET /mobile/v1/user/subscription
  fastify.get('/user/subscription', { preHandler: [authenticateToken] }, async (request: any, reply: any) => {
    const user = request.user as JWTPayload;
    const subDetails = await HubAdapter.getUserSubscriptionDetails(user.user_id);
    return reply.send(subDetails);
  });

  // GET /mobile/v1/user/invoices
  fastify.get('/user/invoices', { preHandler: [authenticateToken] }, async (request: any, reply: any) => {
    const user = request.user as JWTPayload;
    const invoices = await HubAdapter.getUserInvoices(user.user_id);
    return reply.send(invoices);
  });

  // GET /mobile/v1/user/billing-profile
  fastify.get('/user/billing-profile', { preHandler: [authenticateToken] }, async (request: any, reply: any) => {
    const user = request.user as JWTPayload;
    const billingProfile = await HubAdapter.getUserBillingProfile(user.user_id);
    return reply.send(billingProfile);
  });

  // POST /mobile/v1/user/billing-profile
  fastify.post('/user/billing-profile', { preHandler: [authenticateToken] }, async (request: any, reply: any) => {
    const user = request.user as JWTPayload;
    const body = request.body as Record<string, any>;
    const saved = await HubAdapter.saveUserBillingProfile(user.user_id, body);
    return reply.send(saved);
  });

  // GET /mobile/v1/billing
  fastify.get('/billing', { preHandler: [authenticateToken] }, async (request: any, reply: any) => {
    const user = request.user as JWTPayload;
    const billing = await HubAdapter.getBillingStatus(user.user_id);
    return reply.send(billing);
  });

  // GET /mobile/v1/billing/plans (Public & Authenticated Ecosystem Pricing Plans)
  fastify.get('/billing/plans', async (request: any, reply: any) => {
    const q = request.query as { category?: string };
    const plans = await HubAdapter.getPricingPlans(q?.category);
    return reply.send({ success: true, data: plans });
  });
}

