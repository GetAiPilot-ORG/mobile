import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { SocialAdapter } from '../adapters/social.adapter.js';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { JWTPayload } from '../types/index.js';

export async function socialRoutes(fastify: FastifyInstance) {
  // Log BFF Auth diagnostics after authentication middleware
  fastify.addHook('preHandler', async (request) => {
    const user = request.user as any;
    console.log('[SOCIAL BFF AUTH]', {
      route: request.url,
      bffAuthenticated: Boolean(request.user),
      userIdPresent: Boolean(user?.id || user?.userId || user?.user_id),
      orgIdPresent: Boolean(
        user?.organizationId ||
        user?.orgId ||
        user?.organization_id
      ),
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
}
