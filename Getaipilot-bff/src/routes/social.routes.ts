import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { SocialAdapter } from '../adapters/social.adapter.js';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { JWTPayload } from '../types/index.js';

export async function socialRoutes(fastify: FastifyInstance) {
  // GET /mobile/v1/social/accounts
  fastify.get('/social/accounts', { preHandler: [authenticateToken, requirePermission('social.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const accounts = await SocialAdapter.getConnectedAccounts(user.organization_id);
    return reply.send(accounts);
  });

  // GET /mobile/v1/social/posts
  fastify.get('/social/posts', { preHandler: [authenticateToken, requirePermission('social.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const posts = await SocialAdapter.getPosts(user.organization_id);
    return reply.send(posts);
  });

  // POST /mobile/v1/social/schedule
  fastify.post('/social/schedule', { preHandler: [authenticateToken, requirePermission('social.post')] }, async (request, reply) => {
    const scheduleSchema = z.object({
      platforms: z.array(z.enum(['instagram', 'facebook', 'linkedin', 'youtube'])).min(1),
      caption: z.string().min(1),
      mediaUrls: z.array(z.string()).default([]),
      scheduledFor: z.string(),
    });

    const body = scheduleSchema.parse(request.body);
    const newPost = await SocialAdapter.schedulePost(body);

    return reply.status(201).send(newPost);
  });
}
