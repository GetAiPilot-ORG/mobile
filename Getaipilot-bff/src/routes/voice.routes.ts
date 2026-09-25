import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { VoiceAdapter } from '../adapters/voice.adapter.js';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { WebSocketService } from '../services/websocket.service.js';
import { JWTPayload } from '../types/index.js';

export async function voiceRoutes(fastify: FastifyInstance) {
  // 1. Overview & Summary
  fastify.get('/voice/overview', { preHandler: [authenticateToken, requirePermission('voice.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const overview = await VoiceAdapter.getOverview(user);
    return reply.send(overview);
  });

  fastify.get('/voice/summary', { preHandler: [authenticateToken, requirePermission('voice.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const overview = await VoiceAdapter.getOverview(user);
    return reply.send(overview);
  });

  // 2. Call Logs & Details
  fastify.get('/voice/calls', { preHandler: [authenticateToken, requirePermission('voice.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const query = request.query as { limit?: string; status?: string; assistantId?: string };
    const calls = await VoiceAdapter.getCalls(user, {
      limit: query.limit ? parseInt(query.limit) : undefined,
      status: query.status,
      assistantId: query.assistantId,
    });
    return reply.send(calls);
  });

  fastify.get('/calls', { preHandler: [authenticateToken, requirePermission('voice.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const calls = await VoiceAdapter.getCalls(user);
    return reply.send(calls);
  });

  fastify.get('/voice/calls/:id', { preHandler: [authenticateToken, requirePermission('voice.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    const call = await VoiceAdapter.getCallDetails(user, id);
    return reply.send(call);
  });

  fastify.get('/voice/calls/:id/transcript', { preHandler: [authenticateToken, requirePermission('voice.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    const transcript = await VoiceAdapter.getCallTranscript(user, id);
    return reply.send(transcript);
  });

  fastify.get('/voice/calls/:id/recording', { preHandler: [authenticateToken, requirePermission('voice.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    const recording = await VoiceAdapter.getCallRecording(user, id);
    return reply.send(recording);
  });

  // 3. Trigger Outbound Call
  const outboundCallSchema = z.object({
    customerNumber: z.string().optional(),
    phone: z.string().optional(),
    customerName: z.string().optional(),
    assistantId: z.string().optional(),
    agentId: z.string().optional(),
    assignedNumber: z.string().optional(),
    customerCountryCode: z.string().optional(),
    additionalData: z.record(z.any()).optional(),
  });

  const handleOutboundCall = async (request: any, reply: any) => {
    const user = request.user as JWTPayload;
    const body = outboundCallSchema.parse(request.body);

    const targetPhone = body.customerNumber || body.phone;
    if (!targetPhone) {
      return reply.status(400).send({ error: 'customerNumber (or phone) is required' });
    }

    const callResult = await VoiceAdapter.triggerOutboundCall(user, {
      customerNumber: targetPhone,
      customerName: body.customerName,
      assistantId: body.assistantId || body.agentId,
      assignedNumber: body.assignedNumber,
      customerCountryCode: body.customerCountryCode,
      additionalData: body.additionalData,
    });

    WebSocketService.broadcastToOrg(user.organization_id, 'call.started', callResult);
    return reply.status(201).send(callResult);
  };

  fastify.post('/voice/calls', { preHandler: [authenticateToken, requirePermission('voice.outbound')] }, handleOutboundCall);
  fastify.post('/calls/outbound', { preHandler: [authenticateToken, requirePermission('voice.outbound')] }, handleOutboundCall);

  // 4. Assistants / Agents
  fastify.get('/voice/agents', { preHandler: [authenticateToken, requirePermission('voice.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const agents = await VoiceAdapter.getAgents(user);
    return reply.send(agents);
  });

  fastify.get('/voice/agents/:id', { preHandler: [authenticateToken, requirePermission('voice.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    const agent = await VoiceAdapter.getAgentDetails(user, id);
    return reply.send(agent);
  });

  fastify.post('/voice/agents', { preHandler: [authenticateToken, requirePermission('voice.outbound')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const agent = await VoiceAdapter.createAgent(user, request.body as any);
    return reply.status(201).send(agent);
  });

  fastify.put('/voice/agents/:id', { preHandler: [authenticateToken, requirePermission('voice.outbound')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    const agent = await VoiceAdapter.updateAgent(user, id, request.body as any);
    return reply.send(agent);
  });

  fastify.delete('/voice/agents/:id', { preHandler: [authenticateToken, requirePermission('voice.outbound')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    const result = await VoiceAdapter.deleteAgent(user, id);
    return reply.send(result);
  });

  fastify.post('/voice/agents/generate-prompt', { preHandler: [authenticateToken, requirePermission('voice.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { topic, name } = (request.body || {}) as { topic: string; name?: string };
    const prompt = await VoiceAdapter.generatePrompt(user, topic, name);
    return reply.send(prompt);
  });

  // 5. Campaigns
  fastify.get('/voice/campaigns', { preHandler: [authenticateToken, requirePermission('voice.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const campaigns = await VoiceAdapter.getCampaigns(user);
    return reply.send(campaigns);
  });

  fastify.get('/voice/campaigns/:id', { preHandler: [authenticateToken, requirePermission('voice.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    const campaign = await VoiceAdapter.getCampaignDetails(user, id);
    return reply.send(campaign);
  });

  fastify.post('/voice/campaigns', { preHandler: [authenticateToken, requirePermission('voice.outbound')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const campaign = await VoiceAdapter.createCampaign(user, request.body as any);
    return reply.status(201).send(campaign);
  });

  fastify.put('/voice/campaigns/:id', { preHandler: [authenticateToken, requirePermission('voice.outbound')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    const campaign = await VoiceAdapter.updateCampaign(user, id, request.body as any);
    return reply.send(campaign);
  });

  fastify.delete('/voice/campaigns/:id', { preHandler: [authenticateToken, requirePermission('voice.outbound')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    const result = await VoiceAdapter.deleteCampaign(user, id);
    return reply.send(result);
  });

  fastify.post('/voice/campaigns/:id/status', { preHandler: [authenticateToken, requirePermission('voice.outbound')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    const { status } = (request.body || {}) as { status: string };
    const result = await VoiceAdapter.updateCampaignStatus(user, id, status);
    return reply.send(result);
  });

  // 6. Phone Numbers & KYC
  fastify.get('/voice/numbers', { preHandler: [authenticateToken, requirePermission('voice.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const numbers = await VoiceAdapter.getPhoneNumbers(user);
    return reply.send(numbers);
  });

  fastify.get('/voice/numbers/available', { preHandler: [authenticateToken, requirePermission('voice.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const numbers = await VoiceAdapter.getAvailableNumbers(user);
    return reply.send(numbers);
  });

  fastify.post('/voice/numbers/buy', { preHandler: [authenticateToken, requirePermission('voice.outbound')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const result = await VoiceAdapter.buyPhoneNumber(user, request.body as any);
    return reply.send(result);
  });

  fastify.post('/voice/numbers/claim', { preHandler: [authenticateToken, requirePermission('voice.outbound')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const result = await VoiceAdapter.buyPhoneNumber(user, request.body as any);
    return reply.send(result);
  });

  fastify.put('/voice/numbers/assign', { preHandler: [authenticateToken, requirePermission('voice.outbound')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const result = await VoiceAdapter.assignPhoneNumber(user, request.body as any);
    return reply.send(result);
  });

  fastify.get('/voice/kyc', { preHandler: [authenticateToken, requirePermission('voice.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const kyc = await VoiceAdapter.getKycStatus(user);
    return reply.send(kyc);
  });

  fastify.post('/voice/kyc/request', { preHandler: [authenticateToken, requirePermission('voice.outbound')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const result = await VoiceAdapter.submitKycRequest(user, request.body as any);
    return reply.send(result);
  });

  // 7. Contacts
  fastify.get('/voice/contacts', { preHandler: [authenticateToken, requirePermission('voice.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const contacts = await VoiceAdapter.getContacts(user);
    return reply.send(contacts);
  });

  fastify.get('/voice/contacts/:id', { preHandler: [authenticateToken, requirePermission('voice.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    const contact = await VoiceAdapter.getContactDetails(user, id);
    return reply.send(contact);
  });

  fastify.post('/voice/contacts', { preHandler: [authenticateToken, requirePermission('voice.outbound')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const result = await VoiceAdapter.createContact(user, request.body as any);
    return reply.status(201).send(result);
  });

  fastify.put('/voice/contacts/:id', { preHandler: [authenticateToken, requirePermission('voice.outbound')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    const result = await VoiceAdapter.updateContact(user, id, request.body as any);
    return reply.send(result);
  });

  fastify.delete('/voice/contacts/:id', { preHandler: [authenticateToken, requirePermission('voice.outbound')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    const result = await VoiceAdapter.deleteContact(user, id);
    return reply.send(result);
  });

  // 8. Usage, Analytics & Billing
  fastify.get('/voice/usage', { preHandler: [authenticateToken, requirePermission('voice.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const usage = await VoiceAdapter.getUsage(user);
    return reply.send(usage);
  });

  fastify.get('/voice/analytics', { preHandler: [authenticateToken, requirePermission('voice.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const analytics = await VoiceAdapter.getAnalytics(user);
    return reply.send(analytics);
  });

  fastify.get('/voice/billing/transactions', { preHandler: [authenticateToken, requirePermission('voice.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const transactions = await VoiceAdapter.getBillingTransactions(user);
    return reply.send(transactions);
  });
}

