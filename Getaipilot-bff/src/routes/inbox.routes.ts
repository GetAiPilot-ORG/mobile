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

  // GET /mobile/v1/conversations/:id - Conversation details and message history
  fastify.get('/conversations/:id', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };

    const details = await InboxService.getConversationDetails(id, user);
    return reply.send(details);
  });

  // POST /mobile/v1/messages - Send Message across any channel
  fastify.post('/messages', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const sendSchema = z.object({
      conversation_id: z.string().min(1),
      message: z.string().min(1),
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

    const { conversation_id, message, attachments } = parseResult.data;
    const sentMessage = await InboxService.sendMessage(conversation_id, message, attachments, user);

    return reply.status(201).send(sentMessage);
  });
}
