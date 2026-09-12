import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { InboxService } from '../services/inbox.service.js';
import { JWTPayload } from '../types/index.js';

export async function inboxRoutes(fastify: FastifyInstance) {
  // GET /mobile/v1/conversations - Normalized Omnichannel Conversations
  fastify.get('/conversations', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { channel, status, search } = request.query as {
      channel?: string;
      status?: string;
      search?: string;
    };

    const conversations = await InboxService.getConversations(user, {
      channel,
      status,
      search,
    });

    return reply.send(conversations);
  });

  // POST /mobile/v1/conversations - Start or retrieve conversation for contact
  fastify.post('/conversations', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const schema = z.object({
      contact_id: z.string().min(1),
    });

    const parseResult = schema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'contact_id is required' });
    }

    const conv = await InboxService.getOrCreateConversation(parseResult.data.contact_id, user);
    return reply.status(201).send(conv);
  });

  // GET /mobile/v1/conversations/:id - Conversation details and message history
  fastify.get('/conversations/:id', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };

    const details = await InboxService.getConversationDetails(id, user);
    return reply.send(details);
  });

  // PATCH /mobile/v1/conversations/:id/assign - Assign conversation to agent
  fastify.patch('/conversations/:id/assign', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    const schema = z.object({
      agent_id: z.string().nullable().optional(),
      agent_name: z.string().nullable().optional(),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid assign payload' });
    }

    const updated = await InboxService.assignAgent(
      id,
      parsed.data.agent_id || null,
      parsed.data.agent_name || null,
      user
    );
    return reply.send({ success: true, updated });
  });

  // PATCH /mobile/v1/conversations/:id/bot - Toggle bot auto-reply
  fastify.patch('/conversations/:id/bot', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    const schema = z.object({
      bot_enabled: z.boolean(),
      assigned_bot_id: z.string().nullable().optional(),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid bot toggle payload' });
    }

    const updated = await InboxService.toggleBot(
      id,
      parsed.data.bot_enabled,
      parsed.data.assigned_bot_id || null,
      user
    );
    return reply.send({ success: true, updated });
  });

  // PATCH /mobile/v1/conversations/:id/read - Mark conversation as read
  fastify.patch('/conversations/:id/read', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    await InboxService.markConversationAsRead(id, user);
    return reply.send({ success: true, id, unread_count: 0 });
  });

  // GET /mobile/v1/team/members - Organization team members for agent assignment
  fastify.get('/team/members', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const members = await InboxService.getTeamMembers(user);
    return reply.send(members);
  });

  // POST /mobile/v1/messages - Send Message across any channel
  fastify.post('/messages', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const sendSchema = z.object({
      conversation_id: z.string().min(1),
      message: z.string().min(1),
      is_internal_note: z.boolean().optional(),
      template: z.any().optional(),
      attachments: z
        .array(
          z.object({
            url: z.string().url(),
            type: z.enum(['image', 'audio', 'video', 'document']),
          })
        )
        .default([]),
    });

    const parseResult = sendSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'BadRequest',
        message: 'conversation_id and non-empty message are required',
      });
    }

    const { conversation_id, message, attachments, is_internal_note, template } = parseResult.data;
    const sentMessage = await InboxService.sendMessage(
      conversation_id,
      message,
      attachments,
      user,
      { is_internal_note, template }
    );

    return reply.status(201).send(sentMessage);
  });
}
