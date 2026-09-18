import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { SocialAdapter } from '../adapters/social.adapter.js';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { JWTPayload } from '../types/index.js';

export async function socialRoutes(fastify: FastifyInstance) {
  // Log BFF Auth diagnostics after authentication middleware
  fastify.addHook('preHandler', async (request) => {
    const user = request.user as any;
    if (user) {
      const dynamicToken =
        (request.headers['x-social-token'] as string) ||
        (request.headers['x-socialpilot-token'] as string) ||
        undefined;
      if (dynamicToken) {
        user.social_token = dynamicToken;
      }
    }
    console.log('[SOCIAL BFF AUTH]', {
      route: request.url,
      bffAuthenticated: Boolean(request.user),
      userIdPresent: Boolean(user?.id || user?.userId || user?.user_id),
      orgIdPresent: Boolean(
        user?.organizationId ||
        user?.orgId ||
        user?.organization_id
      ),
      hasDynamicSocialToken: Boolean(user?.social_token),
    });
  });

  // 1. Overview & Summary
  fastify.get('/social/overview', { preHandler: [authenticateToken, requirePermission('social.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const query = request.query as { range?: string; instagramAccountId?: string };
    const overview = await SocialAdapter.getOverview(user, {
      range: query.range ? parseInt(query.range) : undefined,
      instagramAccountId: query.instagramAccountId,
    });
    return reply.send(overview);
  });

  // 2. Connected Channels / Accounts
  fastify.get('/social/accounts', { preHandler: [authenticateToken, requirePermission('social.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const accounts = await SocialAdapter.getAccounts(user);
    return reply.send(accounts);
  });

  fastify.post('/social/accounts/disconnect', { preHandler: [authenticateToken, requirePermission('social.post')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const body = request.body as { provider: string; accountId?: string; pageId?: string };
    const result = await SocialAdapter.disconnectAccount(user, body);
    return reply.send(result);
  });

  // 3. Posts History & Queue
  fastify.get('/social/posts', { preHandler: [authenticateToken, requirePermission('social.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const query = request.query as { status?: string; limit?: string };
    const posts = await SocialAdapter.getPosts(user, {
      status: query.status,
      limit: query.limit ? parseInt(query.limit) : undefined,
    });
    return reply.send(posts);
  });

  fastify.get('/social/queue', { preHandler: [authenticateToken, requirePermission('social.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const queue = await SocialAdapter.getQueue(user);
    return reply.send(queue);
  });

  fastify.get('/social/stats', { preHandler: [authenticateToken, requirePermission('social.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const stats = await SocialAdapter.getStats(user);
    return reply.send(stats);
  });

  // 3.5. InstaPilot Inbox Sync & Conversations
  fastify.post('/social/instapilot/sync', { preHandler: [authenticateToken, requirePermission('social.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const result = await SocialAdapter.syncInstapilotInbox(user);
    return reply.send(result);
  });

  fastify.get('/social/instapilot/conversations', { preHandler: [authenticateToken, requirePermission('social.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const result = await SocialAdapter.getInstapilotConversations(user);
    return reply.send(result);
  });

  // 3.6. Social Inbox (Conversations, Messages, Read, Reply)
  fastify.get('/social/inbox/conversations', { preHandler: [authenticateToken, requirePermission('social.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const query = request.query as { limit?: string };
    const limit = query.limit ? parseInt(query.limit, 10) : 50;
    const items = await SocialAdapter.getSocialInboxConversations(user, limit);
    return reply.send({ success: true, items });
  });

  fastify.get('/social/inbox/conversations/:id/messages', { preHandler: [authenticateToken, requirePermission('social.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    const query = request.query as { limit?: string };
    const limit = query.limit ? parseInt(query.limit, 10) : 50;
    const messages = await SocialAdapter.getSocialInboxMessages(user, id, limit);
    return reply.send({ success: true, messages });
  });

  fastify.post('/social/inbox/conversations/:id/read', { preHandler: [authenticateToken, requirePermission('social.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    const result = await SocialAdapter.markSocialInboxConversationRead(user, id);
    return reply.send(result);
  });

  fastify.post('/social/inbox/reply', { preHandler: [authenticateToken, requirePermission('social.post')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const body = request.body as {
      platform: string;
      accountId?: string;
      commentId?: string;
      recipientId?: string;
      postId?: string | null;
      text: string;
      conversationDatabaseId?: string;
    };
    const result = await SocialAdapter.sendSocialInboxReply(user, body);
    return reply.send(result);
  });

  // 4. Create, Schedule, Update, Cancel, Retry, Delete Post
  const createPostSchema = z.object({
    caption: z.string().min(1, 'Caption is required'),
    selectedChannels: z.array(z.string()).min(1, 'Select at least one channel'),
    mediaUrls: z.array(z.string()).optional(),
    isScheduled: z.boolean().optional(),
    scheduledAt: z.string().optional(),
    userTimezone: z.string().optional(),
    postType: z.string().optional(),
    platformData: z.record(z.any()).optional(),
    platformPresets: z.record(z.any()).optional(),
  });

  fastify.post('/social/posts', { preHandler: [authenticateToken, requirePermission('social.post')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const body = createPostSchema.parse(request.body);
    const result = await SocialAdapter.createPost(user, body);
    return reply.status(201).send(result);
  });

  fastify.post('/social/schedule', { preHandler: [authenticateToken, requirePermission('social.post')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const body = createPostSchema.parse(request.body);
    const result = await SocialAdapter.createPost(user, { ...body, isScheduled: true });
    return reply.status(201).send(result);
  });

  fastify.patch('/social/posts/:id', { preHandler: [authenticateToken, requirePermission('social.post')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    const result = await SocialAdapter.updatePost(user, id, request.body as any);
    return reply.send(result);
  });

  fastify.post('/social/posts/:id/cancel', { preHandler: [authenticateToken, requirePermission('social.post')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    const result = await SocialAdapter.cancelPost(user, id);
    return reply.send(result);
  });

  fastify.post('/social/posts/:id/retry', { preHandler: [authenticateToken, requirePermission('social.post')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    const result = await SocialAdapter.retryPost(user, id);
    return reply.send(result);
  });

  fastify.delete('/social/posts/:id', { preHandler: [authenticateToken, requirePermission('social.post')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    const result = await SocialAdapter.deletePost(user, id);
    return reply.send(result);
  });

  // Media Upload from Mobile
  const uploadMediaSchema = z.object({
    fileData: z.string().min(1, 'fileData is required'),
    fileName: z.string().optional(),
    contentType: z.string().optional(),
  });

  fastify.post('/social/media/upload', { preHandler: [authenticateToken, requirePermission('social.post')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const body = uploadMediaSchema.parse(request.body);
    const result = await SocialAdapter.uploadMedia(user, body);
    return reply.status(201).send(result);
  });

  // 5. Trend Feed
  fastify.get('/social/trends', { preHandler: [authenticateToken, requirePermission('social.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const query = request.query as any;
    const trends = await SocialAdapter.getTrends(user, query);
    return reply.send(trends);
  });

  // 6. Entitlements
  fastify.get('/social/entitlements', { preHandler: [authenticateToken, requirePermission('social.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const entitlements = await SocialAdapter.getEntitlements(user);
    return reply.send(entitlements);
  });

  // 7. System Settings & Product Health
  fastify.get('/social/system/settings', async (_request, reply) => {
    const settings = await SocialAdapter.getSystemSettings();
    return reply.send(settings);
  });

  fastify.get('/social/system/product', async (request, reply) => {
    const query = request.query as { product_key?: string };
    const product = await SocialAdapter.getSystemProductStatus(query.product_key || 'social_pilot');
    return reply.send(product);
  });

  // 8. YouTube Studio Accounts
  fastify.get('/social/youtube/accounts', { preHandler: [authenticateToken, requirePermission('social.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const accounts = await SocialAdapter.getYouTubeAccounts(user);
    return reply.send(accounts);
  });

  // 9. AutoDM Routes (Status, Daily Metrics, Automations)
  fastify.get('/social/autodm/status', { preHandler: [authenticateToken, requirePermission('social.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const status = await SocialAdapter.getAutoDMStatus(user);
    return reply.send(status);
  });

  fastify.get('/social/autodm/daily-metrics', { preHandler: [authenticateToken, requirePermission('social.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const query = request.query as { instagramAccountId?: string; startDate?: string };
    const metrics = await SocialAdapter.getAutoDMDailyMetrics(user, query);
    return reply.send(metrics);
  });

  fastify.get('/social/autodm/automations', { preHandler: [authenticateToken, requirePermission('social.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const query = request.query as { instagramAccountId?: string };
    const automations = await SocialAdapter.getAutoDMAutomations(user, query);
    return reply.send(automations);
  });

  fastify.patch('/social/autodm/automations/:id', { preHandler: [authenticateToken, requirePermission('social.post')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, any>;
    const result = await SocialAdapter.updateAutoDMAutomation(user, id, body);
    return reply.send(result);
  });

  fastify.post('/social/autodm/automations', { preHandler: [authenticateToken, requirePermission('social.post')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const body = request.body as Record<string, any>;
    const result = await SocialAdapter.createAutoDMAutomation(user, body);
    return reply.status(201).send(result);
  });

  fastify.delete('/social/autodm/automations/:id', { preHandler: [authenticateToken, requirePermission('social.post')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    const result = await SocialAdapter.deleteAutoDMAutomation(user, id);
    return reply.send(result);
  });

  fastify.get('/social/autodm/contacts', { preHandler: [authenticateToken, requirePermission('social.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const query = request.query as { instagramAccountId?: string };
    const contacts = await SocialAdapter.getAutoDMContacts(user, query);
    return reply.send(contacts);
  });

  fastify.get('/social/autodm/instagram-media', { preHandler: [authenticateToken, requirePermission('social.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const query = request.query as { instagramAccountId?: string; limit?: number };
    const media = await SocialAdapter.getAutoDMInstagramMedia(user, query);
    return reply.send(media);
  });
}
