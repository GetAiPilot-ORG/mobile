import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { WhatsAppService } from '../services/whatsapp.service.js';
import { JWTPayload } from '../types/index.js';

// Validation Schemas
const CreateBroadcastSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  template_name: z.string().min(1, 'Template name is required'),
  template_language: z.string().optional().default('en_US'),
  audience_tag: z.string().optional(),
  audience_type: z.enum(['all', 'tag', 'csv']).optional().default('all'),
  wa_account_id: z.string().optional(),
  variable_mapping: z.record(z.any()).optional(),
  scheduled_at: z.string().optional(),
  idempotency_key: z.string().optional(),
});

function handleWhatsAppError(err: any, reply: FastifyReply, defaultCode: string) {
  const statusCode = err.statusCode || 500;
  const code = err.code || defaultCode;
  const message = err.message || 'An error occurred while processing WhatsApp request';

  return reply.status(statusCode).send({
    error: {
      code,
      message,
    },
  });
}

export async function whatsappRoutes(fastify: FastifyInstance) {
  // Auth Hook
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.status(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired authentication token',
        },
      });
    }
  });

  /**
   * 1. GET /mobile/v1/whatsapp/status
   */
  fastify.get('/whatsapp/status', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const status = await WhatsAppService.getConnectionStatus(user);
      return reply.status(200).send(status);
    } catch (err: any) {
      return handleWhatsAppError(err, reply, 'WHATSAPP_STATUS_ERROR');
    }
  });

  /**
   * 2. GET /mobile/v1/whatsapp/accounts
   */
  fastify.get('/whatsapp/accounts', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const accounts = await WhatsAppService.getAccounts(user);
      return reply.status(200).send(accounts);
    } catch (err: any) {
      return handleWhatsAppError(err, reply, 'WHATSAPP_ACCOUNTS_ERROR');
    }
  });

  /**
   * 3. GET /mobile/v1/whatsapp/contacts
   */
  fastify.get('/whatsapp/contacts', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const query = request.query as {
        search?: string;
        tag?: string;
        page?: string;
        limit?: string;
      };

      const contacts = await WhatsAppService.getContacts(user, {
        search: query.search,
        tag: query.tag,
        page: query.page ? parseInt(query.page, 10) : undefined,
        limit: query.limit ? parseInt(query.limit, 10) : undefined,
      });

      return reply.status(200).send(contacts);
    } catch (err: any) {
      return handleWhatsAppError(err, reply, 'WHATSAPP_CONTACTS_ERROR');
    }
  });

  /**
   * 4. GET /mobile/v1/whatsapp/contacts/:id
   */
  fastify.get('/whatsapp/contacts/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const { id } = request.params as { id: string };
      const contact = await WhatsAppService.getContact(user, id);
      return reply.status(200).send(contact);
    } catch (err: any) {
      return handleWhatsAppError(err, reply, 'WHATSAPP_CONTACT_NOT_FOUND');
    }
  });

  /**
   * 5. GET /mobile/v1/whatsapp/templates
   */
  fastify.get('/whatsapp/templates', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const query = request.query as { status?: string };
      const templates = await WhatsAppService.getTemplates(user, query.status);
      return reply.status(200).send(templates);
    } catch (err: any) {
      return handleWhatsAppError(err, reply, 'WHATSAPP_TEMPLATES_ERROR');
    }
  });

  /**
   * 6. GET /mobile/v1/whatsapp/broadcasts
   */
  fastify.get('/whatsapp/broadcasts', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const query = request.query as {
        page?: string;
        limit?: string;
        status?: string;
      };

      const broadcasts = await WhatsAppService.getBroadcasts(user, {
        page: query.page ? parseInt(query.page, 10) : undefined,
        limit: query.limit ? parseInt(query.limit, 10) : undefined,
        status: query.status,
      });

      return reply.status(200).send(broadcasts);
    } catch (err: any) {
      return handleWhatsAppError(err, reply, 'WHATSAPP_BROADCASTS_ERROR');
    }
  });

  /**
   * 7. GET /mobile/v1/whatsapp/broadcasts/:id
   */
  fastify.get('/whatsapp/broadcasts/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const { id } = request.params as { id: string };
      const broadcast = await WhatsAppService.getBroadcast(user, id);
      return reply.status(200).send(broadcast);
    } catch (err: any) {
      return handleWhatsAppError(err, reply, 'WHATSAPP_BROADCAST_NOT_FOUND');
    }
  });

  /**
   * 8. POST /mobile/v1/whatsapp/broadcasts
   */
  fastify.post('/whatsapp/broadcasts', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const parsedBody = CreateBroadcastSchema.safeParse(request.body);

      if (!parsedBody.success) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: parsedBody.error.errors[0]?.message || 'Invalid broadcast payload',
            details: parsedBody.error.errors,
          },
        });
      }

      const idempotencyKey =
        (request.headers['idempotency-key'] as string) ||
        parsedBody.data.idempotency_key ||
        undefined;

      const result = await WhatsAppService.createBroadcast(user, parsedBody.data, idempotencyKey);
      return reply.status(result.is_replay ? 200 : 201).send(result);
    } catch (err: any) {
      return handleWhatsAppError(err, reply, 'WHATSAPP_BROADCAST_CREATION_FAILED');
    }
  });

  /**
   * 9. GET /mobile/v1/whatsapp/usage
   */
  fastify.get('/whatsapp/usage', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as JWTPayload;
      const usage = await WhatsAppService.getUsage(user);
      return reply.status(200).send(usage);
    } catch (err: any) {
      return handleWhatsAppError(err, reply, 'WHATSAPP_USAGE_ERROR');
    }
  });
}
