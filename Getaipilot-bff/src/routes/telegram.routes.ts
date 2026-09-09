import { FastifyInstance } from 'fastify';
import { TelegramAdapter } from '../adapters/telegram.adapter.js';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { JWTPayload } from '../types/index.js';

export async function telegramRoutes(fastify: FastifyInstance) {
  // GET /mobile/v1/telegram/summary
  fastify.get('/telegram/summary', { preHandler: [authenticateToken, requirePermission('telegram.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const summary = await TelegramAdapter.getSummary(user.user_id);
    return reply.send(summary);
  });
}
