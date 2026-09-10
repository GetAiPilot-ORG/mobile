import { FastifyInstance } from 'fastify';
import { TelegramAdapter } from '../adapters/telegram.adapter.js';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { JWTPayload } from '../types/index.js';

export async function telegramRoutes(fastify: FastifyInstance) {
  // Helper to extract session context
  const getContext = (user: JWTPayload) => ({
    sessionId: user.session_id,
    userId: user.user_id,
    role: user.role,
    organizationId: user.organization_id || `org_${user.user_id.slice(0, 8)}`,
  });

  // GET /mobile/v1/telegram/summary
  fastify.get('/telegram/summary', { preHandler: [authenticateToken, requirePermission('telegram.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const summary = await TelegramAdapter.getSummary(user.user_id, getContext(user));
    return reply.send(summary);
  });

  // GET /mobile/v1/telegram/tracker/bots
  fastify.get('/telegram/tracker/bots', { preHandler: [authenticateToken, requirePermission('telegram.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const bots = await TelegramAdapter.getTrackerBots(user.user_id, getContext(user));
    return reply.send(bots);
  });

  // GET /mobile/v1/telegram/hub
  fastify.get('/telegram/hub', { preHandler: [authenticateToken, requirePermission('telegram.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const hub = await TelegramAdapter.getHubStatus(user.user_id, getContext(user));
    return reply.send(hub);
  });

  // GET /mobile/v1/telegram/status
  fastify.get('/telegram/status', { preHandler: [authenticateToken, requirePermission('telegram.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const status = await TelegramAdapter.getSessionStatus(user.user_id, getContext(user));
    return reply.send(status);
  });

  // POST /mobile/v1/telegram/login/start
  fastify.post('/telegram/login/start', { preHandler: [authenticateToken, requirePermission('telegram.manage')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const body = request.body as { phone: string };
    const result = await TelegramAdapter.startLogin(body.phone, getContext(user));
    return reply.send(result);
  });

  // POST /mobile/v1/telegram/login/otp
  fastify.post('/telegram/login/otp', { preHandler: [authenticateToken, requirePermission('telegram.manage')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const body = request.body as { phone: string; otp: string; phone_code_hash?: string };
    const result = await TelegramAdapter.verifyOtp(body, getContext(user));
    return reply.send(result);
  });

  // POST /mobile/v1/telegram/login/password
  fastify.post('/telegram/login/password', { preHandler: [authenticateToken, requirePermission('telegram.manage')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const body = request.body as { password: string };
    const result = await TelegramAdapter.submitPassword(body.password, getContext(user));
    return reply.send(result);
  });

  // GET /mobile/v1/telegram/chats
  fastify.get('/telegram/chats', { preHandler: [authenticateToken, requirePermission('telegram.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const chats = await TelegramAdapter.getChats(user.user_id, getContext(user));
    return reply.send(chats);
  });

  // POST /mobile/v1/telegram/sync/chats
  fastify.post('/telegram/sync/chats', { preHandler: [authenticateToken, requirePermission('telegram.manage')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const result = await TelegramAdapter.syncChats(getContext(user));
    return reply.send(result);
  });

  // GET /mobile/v1/telegram/autoforward/rules
  fastify.get('/telegram/autoforward/rules', { preHandler: [authenticateToken, requirePermission('telegram.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const rules = await TelegramAdapter.getForwardRules(user.user_id, getContext(user));
    return reply.send(rules);
  });

  // POST /mobile/v1/telegram/autoforward/rules
  fastify.post('/telegram/autoforward/rules', { preHandler: [authenticateToken, requirePermission('telegram.manage')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const payload = request.body as any;
    const result = await TelegramAdapter.createForwardRule(payload, getContext(user));
    return reply.send(result);
  });

  // POST /mobile/v1/telegram/broadcast
  fastify.post('/telegram/broadcast', { preHandler: [authenticateToken, requirePermission('telegram.manage')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const payload = request.body as any;
    const result = await TelegramAdapter.sendBroadcast(payload, getContext(user));
    return reply.send(result);
  });

  // GET /mobile/v1/telegram/broadcast/status
  fastify.get('/telegram/broadcast/status', { preHandler: [authenticateToken, requirePermission('telegram.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const result = await TelegramAdapter.getBroadcastStatus(getContext(user));
    return reply.send(result);
  });


  // GET /mobile/v1/telegram/sub-manager/plans
  fastify.get('/telegram/sub-manager/plans', { preHandler: [authenticateToken, requirePermission('telegram.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const plans = await TelegramAdapter.getSubPlans(user.user_id, getContext(user));
    return reply.send(plans);
  });

  // POST /mobile/v1/telegram/sub-manager/plans
  fastify.post('/telegram/sub-manager/plans', { preHandler: [authenticateToken, requirePermission('telegram.manage')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const payload = request.body as any;
    const result = await TelegramAdapter.createSubPlan(payload, getContext(user));
    return reply.send(result);
  });

  // POST /mobile/v1/telegram/auto-approve
  fastify.post('/telegram/auto-approve', { preHandler: [authenticateToken, requirePermission('telegram.manage')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const body = request.body as { enabled: boolean; channelId: string };
    const result = await TelegramAdapter.toggleAutoApprove(body.enabled, body.channelId, getContext(user));
    return reply.send(result);
  });

  // GET /mobile/v1/telegram/auto-approve/status
  fastify.get('/telegram/auto-approve/status', { preHandler: [authenticateToken, requirePermission('telegram.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const result = await TelegramAdapter.getAutoApproveStatus(getContext(user));
    return reply.send(result);
  });

  // GET /mobile/v1/telegram/report-bot/dashboard
  fastify.get('/telegram/report-bot/dashboard', { preHandler: [authenticateToken, requirePermission('telegram.read')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const result = await TelegramAdapter.getReportBotDashboard(getContext(user));
    return reply.send(result);
  });

  // POST /mobile/v1/telegram/report-bot/settings
  fastify.post('/telegram/report-bot/settings', { preHandler: [authenticateToken, requirePermission('telegram.manage')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const body = request.body as any;
    const result = await TelegramAdapter.saveReportBotSettings(body, getContext(user));
    return reply.send(result);
  });

  // GET /mobile/v1/telegram/reactions/dashboard
  fastify.get('/telegram/reactions/dashboard', { preHandler: [authenticateToken, requirePermission('telegram.manage')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const result = await TelegramAdapter.getReactionsDashboard(getContext(user));
    return reply.send(result);
  });

  // POST /mobile/v1/telegram/reactions/autopilot/toggle
  fastify.post('/telegram/reactions/autopilot/toggle', { preHandler: [authenticateToken, requirePermission('telegram.manage')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const body = request.body as { ruleId: string; isActive: boolean };
    const result = await TelegramAdapter.toggleAutopilotRule(body.ruleId, body.isActive, getContext(user));
    return reply.send(result);
  });

  // POST /mobile/v1/telegram/reactions/autopilot/create
  fastify.post('/telegram/reactions/autopilot/create', { preHandler: [authenticateToken, requirePermission('telegram.manage')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const body = request.body as {
      channelUsername: string;
      minQuantity: number;
      maxQuantity: number;
      reactions: string[];
      postsLimit?: number | null;
    };
    const result = await TelegramAdapter.createAutopilotRule(body, getContext(user));
    return reply.send(result);
  });

  // DELETE /mobile/v1/telegram/reactions/autopilot/:id
  fastify.delete('/telegram/reactions/autopilot/:id', { preHandler: [authenticateToken, requirePermission('telegram.manage')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const params = request.params as { id: string };
    const result = await TelegramAdapter.deleteAutopilotRule(params.id, getContext(user));
    return reply.send(result);
  });

  // POST /mobile/v1/telegram/reactions/order
  fastify.post('/telegram/reactions/order', { preHandler: [authenticateToken, requirePermission('telegram.manage')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const body = request.body as {
      link: string;
      quantity: number;
      reactions: string[];
      campaignType?: string;
    };
    const result = await TelegramAdapter.createReactionOrder(body, getContext(user));
    return reply.send(result);
  });

  // POST /mobile/v1/telegram/reactions
  fastify.post('/telegram/reactions', { preHandler: [authenticateToken, requirePermission('telegram.manage')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const body = request.body as { emojis: string[]; speed: string };
    const result = await TelegramAdapter.updateReactions(body.emojis, body.speed, getContext(user));
    return reply.send(result);
  });

  // GET /mobile/v1/telegram/chatbots
  fastify.get('/telegram/chatbots', { preHandler: [authenticateToken, requirePermission('telegram.manage')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const result = await TelegramAdapter.getChatbots(getContext(user));
    return reply.send(result);
  });

  // POST /mobile/v1/telegram/chatbots/connect
  fastify.post('/telegram/chatbots/connect', { preHandler: [authenticateToken, requirePermission('telegram.manage')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const body = request.body as {
      botToken: string;
      botName?: string;
      botUsername?: string;
      supportName: string;
      provider?: string;
      apiKey: string;
      knowledgeBaseName?: string;
      businessInfo?: string;
    };
    const result = await TelegramAdapter.createChatbot(body, getContext(user));
    return reply.send(result);
  });

  // POST /mobile/v1/telegram/chatbots/toggle
  fastify.post('/telegram/chatbots/toggle', { preHandler: [authenticateToken, requirePermission('telegram.manage')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const body = request.body as { configId: string; status: 'active' | 'paused' };
    const result = await TelegramAdapter.toggleChatbotStatus(body.configId, body.status, getContext(user));
    return reply.send(result);
  });

  // POST /mobile/v1/telegram/chatbots/reset-history
  fastify.post('/telegram/chatbots/reset-history', { preHandler: [authenticateToken, requirePermission('telegram.manage')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const body = request.body as { botId: string };
    const result = await TelegramAdapter.resetChatbotHistory(body.botId, getContext(user));
    return reply.send(result);
  });

  // GET /mobile/v1/telegram/chatbots/:botId/sessions
  fastify.get('/telegram/chatbots/:botId/sessions', { preHandler: [authenticateToken, requirePermission('telegram.manage')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const params = request.params as { botId: string };
    const result = await TelegramAdapter.getChatbotSessions(params.botId, getContext(user));
    return reply.send(result);
  });

  // GET /mobile/v1/telegram/chatbots/:botId/sessions/:telegramUserId/messages
  fastify.get('/telegram/chatbots/:botId/sessions/:telegramUserId/messages', { preHandler: [authenticateToken, requirePermission('telegram.manage')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const params = request.params as { botId: string; telegramUserId: string };
    const result = await TelegramAdapter.getChatbotUserMessages(params.botId, parseInt(params.telegramUserId, 10), getContext(user));
    return reply.send(result);
  });


  // PUT /mobile/v1/telegram/chatbots/:id
  fastify.put('/telegram/chatbots/:id', { preHandler: [authenticateToken, requirePermission('telegram.manage')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const params = request.params as { id: string };
    const body = request.body as {
      supportName?: string;
      provider?: string;
      apiKey?: string;
      knowledgeBaseName?: string;
      businessInfo?: string;
    };
    const result = await TelegramAdapter.updateChatbot(params.id, body, getContext(user));
    return reply.send(result);
  });

  // DELETE /mobile/v1/telegram/chatbots/:id
  fastify.delete('/telegram/chatbots/:id', { preHandler: [authenticateToken, requirePermission('telegram.manage')] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const params = request.params as { id: string };
    const result = await TelegramAdapter.deleteChatbot(params.id, getContext(user));
    return reply.send(result);
  });
}


