import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { TelegramAdapter } from '../adapters/telegram.adapter.js';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { JWTPayload } from '../types/index.js';

function handleTelegramError(err: any, reply: FastifyReply, defaultCode: string) {
  const statusCode = err.statusCode || 500;
  const code = err.code || defaultCode;
  const message = err.message || 'An error occurred while processing Telegram request';

  return reply.status(statusCode).send({
    error: {
      code,
      message,
    },
  });
}

export async function telegramRoutes(fastify: FastifyInstance) {
  // Pre-handler auth diagnostic logging
  fastify.addHook('preHandler', async (request) => {
    const user = request.user as any;
    console.log('[TELEGRAM BFF AUTH]', {
      route: request.url,
      userResolved: Boolean(user?.id || user?.user_id || user?.userId),
      orgResolved: Boolean(user?.organizationId || user?.orgId || user?.organization_id),
    });
  });

  // ==========================================
  // 1. Dashboard & Setup Hub
  // ==========================================

  fastify.get('/telegram/dashboard', { preHandler: [authenticateToken, requirePermission('telegram.read')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const dashboard = await TelegramAdapter.getDashboard(user);
      return reply.send(dashboard);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_DASHBOARD_ERROR');
    }
  });

  fastify.get('/telegram/setup-hub', { preHandler: [authenticateToken, requirePermission('telegram.read')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const setup = await TelegramAdapter.getSetupHub(user);
      return reply.send(setup);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_SETUP_HUB_ERROR');
    }
  });

  // ==========================================
  // 2. Account & Connection Lifecycle
  // ==========================================

  fastify.get('/telegram/status', { preHandler: [authenticateToken, requirePermission('telegram.read')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const status = await TelegramAdapter.getStatus(user);
      return reply.send(status);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_STATUS_ERROR');
    }
  });

  fastify.get('/telegram/account/status', { preHandler: [authenticateToken, requirePermission('telegram.read')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const status = await TelegramAdapter.getStatus(user);
      return reply.send(status);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_STATUS_ERROR');
    }
  });

  const phoneSchema = z.object({ phone: z.string().min(6, 'Valid phone number required') });
  fastify.post('/telegram/login/start', { preHandler: [authenticateToken, requirePermission('telegram.post')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const body = phoneSchema.parse(request.body);
      const result = await TelegramAdapter.startLogin(user, body.phone);
      return reply.send(result);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_LOGIN_START_ERROR');
    }
  });

  const otpSchema = z.object({ otp: z.string().min(1, 'OTP is required') });
  fastify.post('/telegram/login/otp', { preHandler: [authenticateToken, requirePermission('telegram.post')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const body = otpSchema.parse(request.body);
      const result = await TelegramAdapter.verifyOtp(user, body.otp);
      return reply.send(result);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_LOGIN_OTP_ERROR');
    }
  });

  const passwordSchema = z.object({
    password: z.string().min(1, 'Password is required'),
    phone: z.string().optional(),
  });
  fastify.post('/telegram/login/password', { preHandler: [authenticateToken, requirePermission('telegram.post')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const body = passwordSchema.parse(request.body);
      const result = await TelegramAdapter.verifyPassword(user, body.password, body.phone);
      return reply.send(result);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_LOGIN_PASSWORD_ERROR');
    }
  });

  fastify.post('/telegram/logout', { preHandler: [authenticateToken, requirePermission('telegram.post')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const result = await TelegramAdapter.logout(user);
      return reply.send(result);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_LOGOUT_ERROR');
    }
  });

  fastify.get('/telegram/chats', { preHandler: [authenticateToken, requirePermission('telegram.read')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const chats = await TelegramAdapter.getChats(user);
      return reply.send(chats);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_CHATS_ERROR');
    }
  });

  fastify.post('/telegram/sync/chats', { preHandler: [authenticateToken, requirePermission('telegram.post')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const result = await TelegramAdapter.syncChats(user);
      return reply.send(result);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_SYNC_CHATS_ERROR');
    }
  });

  // ==========================================
  // 3. GAP Autoforwarding (BigInt Scoped)
  // ==========================================

  fastify.get('/telegram/autoforward/overview', { preHandler: [authenticateToken, requirePermission('telegram.read')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const overview = await TelegramAdapter.getAutoforwardOverview(user);
      return reply.send(overview);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_AUTOFORWARD_OVERVIEW_ERROR');
    }
  });

  fastify.get('/telegram/autoforward/mappings', { preHandler: [authenticateToken, requirePermission('telegram.read')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const mappings = await TelegramAdapter.getForwardMappings(user);
      return reply.send(mappings);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_AUTOFORWARD_MAPPINGS_ERROR');
    }
  });

  const mappingSchema = z.object({
    source_channel_id: z.string(),
    destination_channel_id: z.string(),
    is_active: z.boolean().optional(),
  });
  fastify.post('/telegram/autoforward/mappings', { preHandler: [authenticateToken, requirePermission('telegram.post')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const body = mappingSchema.parse(request.body);
      const mapping = await TelegramAdapter.createForwardMapping(user, body);
      return reply.send(mapping);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_CREATE_MAPPING_ERROR');
    }
  });

  fastify.patch('/telegram/autoforward/mappings/:id', { preHandler: [authenticateToken, requirePermission('telegram.post')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const { id } = request.params as { id: string };
      const body = request.body as any;
      const updated = await TelegramAdapter.updateForwardMapping(user, id, body);
      return reply.send(updated);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_UPDATE_MAPPING_ERROR');
    }
  });

  fastify.delete('/telegram/autoforward/mappings/:id', { preHandler: [authenticateToken, requirePermission('telegram.post')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const { id } = request.params as { id: string };
      const result = await TelegramAdapter.deleteForwardMapping(user, id);
      return reply.send(result);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_DELETE_MAPPING_ERROR');
    }
  });

  const textFilterSchema = z.object({ search_text: z.string().min(1), replace_text: z.string() });
  fastify.post('/telegram/autoforward/filters', { preHandler: [authenticateToken, requirePermission('telegram.post')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const body = textFilterSchema.parse(request.body);
      const filter = await TelegramAdapter.createTextFilter(user, body);
      return reply.send(filter);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_CREATE_FILTER_ERROR');
    }
  });

  fastify.delete('/telegram/autoforward/filters/:id', { preHandler: [authenticateToken, requirePermission('telegram.post')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const { id } = request.params as { id: string };
      const result = await TelegramAdapter.deleteTextFilter(user, id);
      return reply.send(result);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_DELETE_FILTER_ERROR');
    }
  });

  const blockedWordSchema = z.object({ word: z.string().min(1) });
  fastify.post('/telegram/autoforward/blocked-words', { preHandler: [authenticateToken, requirePermission('telegram.post')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const body = blockedWordSchema.parse(request.body);
      const word = await TelegramAdapter.createBlockedWord(user, body.word);
      return reply.send(word);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_CREATE_BLOCKED_WORD_ERROR');
    }
  });

  fastify.delete('/telegram/autoforward/blocked-words/:id', { preHandler: [authenticateToken, requirePermission('telegram.post')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const { id } = request.params as { id: string };
      const result = await TelegramAdapter.deleteBlockedWord(user, id);
      return reply.send(result);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_DELETE_BLOCKED_WORD_ERROR');
    }
  });

  fastify.patch('/telegram/autoforward/settings', { preHandler: [authenticateToken, requirePermission('telegram.post')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const result = await TelegramAdapter.updateAutoforwardSettings(user, request.body as any);
      return reply.send(result);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_UPDATE_SETTINGS_ERROR');
    }
  });

  fastify.patch('/telegram/autoforward/text-addons', { preHandler: [authenticateToken, requirePermission('telegram.post')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const result = await TelegramAdapter.updateTextAddons(user, request.body as any);
      return reply.send(result);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_UPDATE_ADDONS_ERROR');
    }
  });

  // ==========================================
  // 4. GAP Sub Manager (TeleSub)
  // ==========================================

  fastify.get('/telegram/sub-manager/overview', { preHandler: [authenticateToken, requirePermission('telegram.read')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const overview = await TelegramAdapter.getSubManagerOverview(user);
      return reply.send(overview);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_SUB_MANAGER_OVERVIEW_ERROR');
    }
  });

  fastify.get('/telegram/sub-manager/pages', { preHandler: [authenticateToken, requirePermission('telegram.read')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const pages = await TelegramAdapter.getLandingPages(user);
      return reply.send(pages);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_SUB_PAGES_ERROR');
    }
  });

  fastify.post('/telegram/sub-manager/pages', { preHandler: [authenticateToken, requirePermission('telegram.post')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const page = await TelegramAdapter.createLandingPage(user, request.body);
      return reply.send(page);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_CREATE_SUB_PAGE_ERROR');
    }
  });

  fastify.patch('/telegram/sub-manager/pages/:id', { preHandler: [authenticateToken, requirePermission('telegram.post')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const { id } = request.params as { id: string };
      const updated = await TelegramAdapter.updateLandingPage(user, id, request.body);
      return reply.send(updated);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_UPDATE_SUB_PAGE_ERROR');
    }
  });

  fastify.get('/telegram/sub-manager/subscribers', { preHandler: [authenticateToken, requirePermission('telegram.read')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const subscribers = await TelegramAdapter.getSubscribers(user);
      return reply.send(subscribers);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_SUBSCRIBERS_ERROR');
    }
  });

  fastify.get('/telegram/sub-manager/payout-status', { preHandler: [authenticateToken, requirePermission('telegram.read')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const payout = await TelegramAdapter.getPayoutStatus(user);
      return reply.send(payout);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_PAYOUT_STATUS_ERROR');
    }
  });

  // ==========================================
  // 5. GAP Tracker
  // ==========================================

  fastify.get('/telegram/tracker/overview', { preHandler: [authenticateToken, requirePermission('telegram.read')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const overview = await TelegramAdapter.getTrackerOverview(user);
      return reply.send(overview);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_TRACKER_OVERVIEW_ERROR');
    }
  });

  const trackerBotSchema = z.object({ bot_token: z.string().min(10) });
  fastify.post('/telegram/tracker/bots', { preHandler: [authenticateToken, requirePermission('telegram.post')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const body = trackerBotSchema.parse(request.body);
      const bot = await TelegramAdapter.saveTrackerBot(user, body);
      return reply.send(bot);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_SAVE_TRACKER_BOT_ERROR');
    }
  });

  fastify.get('/telegram/tracker/links', { preHandler: [authenticateToken, requirePermission('telegram.read')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const links = await TelegramAdapter.getJoinLinks(user);
      return reply.send(links);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_JOIN_LINKS_ERROR');
    }
  });

  const joinLinkSchema = z.object({
    link_name: z.string().min(1),
    channel_id: z.string().min(1),
    campaign_name: z.string().optional(),
  });
  fastify.post('/telegram/tracker/links', { preHandler: [authenticateToken, requirePermission('telegram.post')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const body = joinLinkSchema.parse(request.body);
      const link = await TelegramAdapter.createJoinLink(user, body);
      return reply.send(link);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_CREATE_JOIN_LINK_ERROR');
    }
  });

  fastify.delete('/telegram/tracker/links/:id', { preHandler: [authenticateToken, requirePermission('telegram.post')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const { id } = request.params as { id: string };
      const result = await TelegramAdapter.deleteJoinLink(user, id);
      return reply.send(result);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_DELETE_JOIN_LINK_ERROR');
    }
  });

  // ==========================================
  // 6. GAP Report Bot
  // ==========================================

  fastify.get('/telegram/report-bot/config', { preHandler: [authenticateToken, requirePermission('telegram.read')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const config = await TelegramAdapter.getReportBotConfig(user);
      return reply.send(config);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_REPORT_BOT_CONFIG_ERROR');
    }
  });

  fastify.patch('/telegram/report-bot/config', { preHandler: [authenticateToken, requirePermission('telegram.post')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const updated = await TelegramAdapter.updateReportBotConfig(user, request.body);
      return reply.send(updated);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_UPDATE_REPORT_BOT_ERROR');
    }
  });

  // ==========================================
  // 7. Broadcast Msg
  // ==========================================

  fastify.get('/telegram/broadcasts', { preHandler: [authenticateToken, requirePermission('telegram.read')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const broadcasts = await TelegramAdapter.getBroadcasts(user);
      return reply.send(broadcasts);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_BROADCASTS_ERROR');
    }
  });

  const broadcastSchema = z.object({
    message: z.string().min(1),
    target_audience: z.string().optional(),
    scheduled_at: z.string().optional(),
  });
  fastify.post('/telegram/broadcasts', { preHandler: [authenticateToken, requirePermission('telegram.post')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const body = broadcastSchema.parse(request.body);
      const result = await TelegramAdapter.createBroadcastTask(user, body);
      return reply.send(result);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_CREATE_BROADCAST_ERROR');
    }
  });

  // ==========================================
  // 8. GAP Auto Approve
  // ==========================================

  fastify.get('/telegram/auto-approve', { preHandler: [authenticateToken, requirePermission('telegram.read')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const status = await TelegramAdapter.getAutoApproveStatus(user);
      return reply.send(status);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_AUTO_APPROVE_ERROR');
    }
  });

  // ==========================================
  // 9. Chat Bot Automation
  // ==========================================

  fastify.get('/telegram/chatbot/configs', { preHandler: [authenticateToken, requirePermission('telegram.read')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const configs = await TelegramAdapter.getChatbotConfigs(user);
      return reply.send(configs);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_CHATBOT_CONFIGS_ERROR');
    }
  });

  fastify.post('/telegram/chatbot/configs', { preHandler: [authenticateToken, requirePermission('telegram.post')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const created = await TelegramAdapter.createChatbotConfig(user, request.body);
      return reply.send(created);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_CREATE_CHATBOT_ERROR');
    }
  });

  fastify.patch('/telegram/chatbot/configs/:id', { preHandler: [authenticateToken, requirePermission('telegram.post')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const { id } = request.params as { id: string };
      const updated = await TelegramAdapter.updateChatbotConfig(user, id, request.body);
      return reply.send(updated);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_UPDATE_CHATBOT_ERROR');
    }
  });

  // ==========================================
  // 10. GAP Reactions
  // ==========================================

  fastify.get('/telegram/reactions/overview', { preHandler: [authenticateToken, requirePermission('telegram.read')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const overview = await TelegramAdapter.getReactionsOverview(user);
      return reply.send(overview);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_REACTIONS_OVERVIEW_ERROR');
    }
  });

  const reactionOrderSchema = z.object({
    post_link: z.string().url(),
    reactions: z.array(z.string()).min(1),
    quantity: z.number().min(1),
  });
  fastify.post('/telegram/reactions/orders', { preHandler: [authenticateToken, requirePermission('telegram.post')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const body = reactionOrderSchema.parse(request.body);
      const order = await TelegramAdapter.createReactionOrder(user, body);
      return reply.send(order);
    } catch (err) {
      return handleTelegramError(err, reply, 'TELEGRAM_CREATE_REACTION_ORDER_ERROR');
    }
  });
}
