import { FastifyInstance } from 'fastify';
import { HubAdapter } from '../adapters/hub.adapter.js';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { JWTPayload } from '../types/index.js';

export async function billingRoutes(fastify: FastifyInstance) {
  // GET /mobile/v1/billing
  fastify.get('/billing', { preHandler: [authenticateToken, requirePermission('billing.view')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const billing = await HubAdapter.getBillingStatus(user.user_id);
    return reply.send(billing);
  });
}
