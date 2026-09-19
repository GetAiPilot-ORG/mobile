import { FastifyInstance } from 'fastify';
import { HubAdapter } from '../adapters/hub.adapter.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { JWTPayload } from '../types/index.js';

export async function billingRoutes(fastify: FastifyInstance) {
  // GET /mobile/v1/user/profile
  fastify.get('/user/profile', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const profile = await HubAdapter.getUserProfileDetails(user.user_id);
    return reply.send(profile);
  });

  // PATCH /mobile/v1/user/profile
  fastify.patch('/user/profile', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const updates = request.body as Record<string, any>;
    const updated = await HubAdapter.updateUserProfile(user.user_id, updates);
    return reply.send(updated);
  });

  // GET /mobile/v1/user/subscription
  fastify.get('/user/subscription', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const subDetails = await HubAdapter.getUserSubscriptionDetails(user.user_id);
    return reply.send(subDetails);
  });

  // GET /mobile/v1/user/invoices
  fastify.get('/user/invoices', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const invoices = await HubAdapter.getUserInvoices(user.user_id);
    return reply.send(invoices);
  });

  // GET /mobile/v1/user/billing-profile
  fastify.get('/user/billing-profile', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const billingProfile = await HubAdapter.getUserBillingProfile(user.user_id);
    return reply.send(billingProfile);
  });

  // POST /mobile/v1/user/billing-profile
  fastify.post('/user/billing-profile', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const body = request.body as Record<string, any>;
    const saved = await HubAdapter.saveUserBillingProfile(user.user_id, body);
    return reply.send(saved);
  });

  // GET /mobile/v1/billing
  fastify.get('/billing', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const billing = await HubAdapter.getBillingStatus(user.user_id);
    return reply.send(billing);
  });

  // GET /mobile/v1/billing/plans (Public & Authenticated Ecosystem Pricing Plans)
  fastify.get('/billing/plans', async (request, reply) => {
    const q = request.query as { category?: string };
    const plans = await HubAdapter.getPricingPlans(q?.category);
    return reply.send({ success: true, data: plans });
  });
}

