import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { VoiceAdapter } from '../adapters/voice.adapter.js';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { WebSocketService } from '../services/websocket.service.js';
import { JWTPayload } from '../types/index.js';

export async function voiceRoutes(fastify: FastifyInstance) {
  // GET /mobile/v1/voice/summary
  fastify.get('/voice/summary', { preHandler: [authenticateToken, requirePermission('voice.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const summary = await VoiceAdapter.getSummary(user.organization_id);
    return reply.send(summary);
  });

  // GET /mobile/v1/calls
  fastify.get('/calls', { preHandler: [authenticateToken, requirePermission('voice.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const calls = await VoiceAdapter.getCallLogs(user.organization_id);
    return reply.send(calls);
  });

  // POST /mobile/v1/calls/outbound
  fastify.post('/calls/outbound', { preHandler: [authenticateToken, requirePermission('voice.outbound')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const callSchema = z.object({
      agentId: z.string().default('agent_v_1'),
      phone: z.string().min(10),
    });

    const body = callSchema.parse(request.body);
    const call = await VoiceAdapter.triggerOutboundCall(body.agentId, body.phone);

    WebSocketService.broadcastToOrg(user.organization_id, 'call.started', call);

    return reply.status(201).send(call);
  });
}
