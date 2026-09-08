import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { CRMService } from '../services/crm.service.js';
import { JWTPayload } from '../types/index.js';

export async function crmRoutes(fastify: FastifyInstance) {
  // GET /mobile/v1/crm/pipelines
  fastify.get('/crm/pipelines', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const pipelines = await CRMService.getPipelines(user);
    return reply.send(pipelines);
  });

  // GET /mobile/v1/crm/stages
  fastify.get('/crm/stages', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const stages = await CRMService.getStages(user);
    return reply.send(stages);
  });

  // GET /mobile/v1/crm/contacts
  fastify.get('/crm/contacts', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const contacts = await CRMService.getContacts(user);
    return reply.send(contacts);
  });

  // Handler for listing leads with filters
  const getLeadsHandler = async (request: any, reply: any) => {
    const user = request.user as JWTPayload;
    const { pipeline_id, stage_id, owner_id, status, search, cursor, limit } = request.query as {
      pipeline_id?: string;
      stage_id?: string;
      owner_id?: string;
      status?: string;
      search?: string;
      cursor?: string;
      limit?: string;
    };

    const result = await CRMService.getLeads(user, {
      pipeline_id,
      stage_id,
      owner_id,
      status,
      search,
      cursor,
      limit: limit ? Number(limit) : undefined,
    });

    return reply.send(result);
  };

  // GET /mobile/v1/leads & GET /mobile/v1/crm/leads
  fastify.get('/leads', { preHandler: [authenticateToken] }, getLeadsHandler);
  fastify.get('/crm/leads', { preHandler: [authenticateToken] }, getLeadsHandler);

  // Handler for single lead
  const getLeadHandler = async (request: any, reply: any) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };

    try {
      const lead = await CRMService.getLead(user, id);
      return reply.send(lead);
    } catch (err: any) {
      const status = err.message.startsWith('NotFound') ? 404 : 403;
      return reply.status(status).send({ statusCode: status, message: err.message });
    }
  };

  // GET /mobile/v1/leads/:id & GET /mobile/v1/crm/leads/:id
  fastify.get('/leads/:id', { preHandler: [authenticateToken] }, getLeadHandler);
  fastify.get('/crm/leads/:id', { preHandler: [authenticateToken] }, getLeadHandler);

  // Create lead schema & handler
  const leadSchema = z.object({
    name: z.string().min(1),
    email: z.string().email().nullable().optional(),
    phone: z.string().nullable().optional(),
    company: z.string().nullable().optional(),
    pipeline_id: z.string().default('pipe_default'),
    stage_id: z.string().default('lead'),
    value: z.number().nullable().optional(),
    currency: z.string().default('INR'),
    source: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    contact_id: z.string().nullable().optional(),
  });

  const createLeadHandler = async (request: any, reply: any) => {
    const user = request.user as JWTPayload;
    const parseResult = leadSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'BadRequest',
        message: parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      });
    }

    try {
      const created = await CRMService.createLead(user, parseResult.data);
      return reply.status(201).send(created);
    } catch (err: any) {
      return reply.status(403).send({ statusCode: 403, message: err.message });
    }
  };

  // POST /mobile/v1/leads & POST /mobile/v1/crm/leads
  fastify.post('/leads', { preHandler: [authenticateToken] }, createLeadHandler);
  fastify.post('/crm/leads', { preHandler: [authenticateToken] }, createLeadHandler);

  // Update lead schema & handler
  const updateSchema = z.object({
    name: z.string().optional(),
    email: z.string().email().nullable().optional(),
    phone: z.string().nullable().optional(),
    company: z.string().nullable().optional(),
    value: z.number().nullable().optional(),
    source: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    status: z.string().optional(),
  });

  const updateLeadHandler = async (request: any, reply: any) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    const parseResult = updateSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ statusCode: 400, message: 'Invalid update payload' });
    }

    try {
      const updated = await CRMService.updateLead(user, id, parseResult.data);
      return reply.send(updated);
    } catch (err: any) {
      const status = err.message.startsWith('Forbidden') ? 403 : 404;
      return reply.status(status).send({ statusCode: status, message: err.message });
    }
  };

  // PATCH /mobile/v1/leads/:id & PATCH /mobile/v1/crm/leads/:id
  fastify.patch('/leads/:id', { preHandler: [authenticateToken] }, updateLeadHandler);
  fastify.patch('/crm/leads/:id', { preHandler: [authenticateToken] }, updateLeadHandler);

  // Move lead handler
  const moveSchema = z.object({
    stage_id: z.string().min(1),
  });

  const moveLeadHandler = async (request: any, reply: any) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    const parseResult = moveSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ statusCode: 400, message: 'stage_id is required' });
    }

    try {
      const moved = await CRMService.moveLead(user, id, parseResult.data.stage_id);
      return reply.send(moved);
    } catch (err: any) {
      const status = err.message.startsWith('Forbidden') ? 403 : 400;
      return reply.status(status).send({ statusCode: status, message: err.message });
    }
  };

  // POST /mobile/v1/leads/:id/move & POST /mobile/v1/crm/leads/:id/move
  fastify.post('/leads/:id/move', { preHandler: [authenticateToken] }, moveLeadHandler);
  fastify.post('/crm/leads/:id/move', { preHandler: [authenticateToken] }, moveLeadHandler);

  // Assign lead handler
  const assignSchema = z.object({
    owner_id: z.string().min(1),
    owner_name: z.string().min(1),
  });

  const assignLeadHandler = async (request: any, reply: any) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    const parseResult = assignSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ statusCode: 400, message: 'owner_id and owner_name are required' });
    }

    try {
      const assigned = await CRMService.assignLead(
        user,
        id,
        parseResult.data.owner_id,
        parseResult.data.owner_name
      );
      return reply.send(assigned);
    } catch (err: any) {
      return reply.status(403).send({ statusCode: 403, message: err.message });
    }
  };

  // POST /mobile/v1/leads/:id/assign & POST /mobile/v1/crm/leads/:id/assign
  fastify.post('/leads/:id/assign', { preHandler: [authenticateToken] }, assignLeadHandler);
  fastify.post('/crm/leads/:id/assign', { preHandler: [authenticateToken] }, assignLeadHandler);

  // Lead activities timeline handler
  const leadActivitiesHandler = async (request: any, reply: any) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };

    try {
      const timeline = await CRMService.getLeadUnifiedTimeline(user, id);
      return reply.send(timeline);
    } catch (err: any) {
      const status = err.message.startsWith('NotFound') ? 404 : 403;
      return reply.status(status).send({ statusCode: status, message: err.message });
    }
  };

  // GET /mobile/v1/leads/:id/activities & GET /mobile/v1/crm/leads/:id/activities
  fastify.get('/leads/:id/activities', { preHandler: [authenticateToken] }, leadActivitiesHandler);
  fastify.get('/crm/leads/:id/activities', { preHandler: [authenticateToken] }, leadActivitiesHandler);

  // Add lead note handler
  const noteSchema = z.object({
    note: z.string().min(1),
  });

  const addLeadNoteHandler = async (request: any, reply: any) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    const parseResult = noteSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ statusCode: 400, message: 'note is required' });
    }

    try {
      const noteActivity = await CRMService.addLeadNote(user, id, parseResult.data.note);
      return reply.status(201).send(noteActivity);
    } catch (err: any) {
      const status = err.message.startsWith('NotFound') ? 404 : 403;
      return reply.status(status).send({ statusCode: status, message: err.message });
    }
  };

  // POST /mobile/v1/leads/:id/notes & POST /mobile/v1/crm/leads/:id/notes
  fastify.post('/leads/:id/notes', { preHandler: [authenticateToken] }, addLeadNoteHandler);
  fastify.post('/crm/leads/:id/notes', { preHandler: [authenticateToken] }, addLeadNoteHandler);
}
