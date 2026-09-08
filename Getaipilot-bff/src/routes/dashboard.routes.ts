import { FastifyInstance } from 'fastify';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { DashboardService } from '../services/dashboard.service.js';
import { JWTPayload } from '../types/index.js';

export async function dashboardRoutes(fastify: FastifyInstance) {
  // GET /mobile/v1/dashboard - Real Unified Production Dashboard Endpoint
  fastify.get('/dashboard', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const dashboardData = await DashboardService.getUnifiedDashboard(user);
    return reply.send(dashboardData);
  });

  // GET /mobile/v1/modules - Active ecosystem modules for the tenant
  fastify.get('/modules', { preHandler: [authenticateToken] }, async (request, reply) => {
    return reply.send({
      modules: [
        { id: 'whatsapp', name: 'GAP WhatsApp', enabled: true, status: 'connected' },
        { id: 'crm', name: 'GAP CRM', enabled: true, status: 'active' },
        { id: 'voice', name: 'GAP VoicePilot', enabled: true, status: 'active' },
        { id: 'social', name: 'GAP SocialPilot', enabled: true, status: 'connected' },
        { id: 'telegram', name: 'GAP Telegram', enabled: true, status: 'connected' },
        { id: 'tools', name: 'GAP Free Tools', enabled: true, status: 'active' },
      ],
    });
  });
}
