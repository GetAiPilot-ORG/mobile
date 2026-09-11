import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { CRMService } from '../services/crm.service.js';
import { JWTPayload } from '../types/index.js';

export async function crmRoutes(fastify: FastifyInstance) {
  // ── 1. Dashboard & Metadata ────────────────────────────────────────────────

  // GET /mobile/v1/crm/dashboard
  fastify.get('/crm/dashboard', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    try {
      const dashboard = await CRMService.getDashboardSummary(user);
      return reply.send(dashboard);
    } catch (err: any) {
      return reply.status(500).send({ statusCode: 500, message: err.message });
    }
  });

  // GET /mobile/v1/crm/stages
  fastify.get('/crm/stages', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const stages = await CRMService.getStages(user);
    return reply.send(stages);
  });

  // GET /mobile/v1/crm/members
  fastify.get('/crm/members', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    try {
      const members = await CRMService.getMembers(user);
      return reply.send(members);
    } catch (err: any) {
      return reply.status(500).send({ statusCode: 500, message: err.message });
    }
  });

  // ── 2. Leads ───────────────────────────────────────────────────────────────

  // GET /mobile/v1/crm/leads & GET /mobile/v1/leads
  const getLeadsHandler = async (request: any, reply: any) => {
    const user = request.user as JWTPayload;
    const { status, search, assigned_to, limit, offset } = request.query as any;

    try {
      const result = await CRMService.getLeads(user, {
        status,
        search,
        assigned_to,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });
      return reply.send(result);
    } catch (err: any) {
      return reply.status(500).send({ statusCode: 500, message: err.message });
    }
  };

  fastify.get('/crm/leads', { preHandler: [authenticateToken] }, getLeadsHandler);
  fastify.get('/leads', { preHandler: [authenticateToken] }, getLeadsHandler);

  // GET /mobile/v1/crm/leads/:id & GET /mobile/v1/leads/:id
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

  fastify.get('/crm/leads/:id', { preHandler: [authenticateToken] }, getLeadHandler);
  fastify.get('/leads/:id', { preHandler: [authenticateToken] }, getLeadHandler);

  // POST /mobile/v1/crm/leads & POST /mobile/v1/leads
  const leadCreateSchema = z.object({
    first_name: z.string().min(1),
    last_name: z.string().optional().default(''),
    email: z.string().email().nullable().optional(),
    phone: z.string().nullable().optional(),
    company: z.string().nullable().optional(),
    job_title: z.string().nullable().optional(),
    status: z.enum(['lead', 'prospect', 'customer', 'churned']).optional().default('lead'),
    assigned_to: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
  });

  const createLeadHandler = async (request: any, reply: any) => {
    const user = request.user as JWTPayload;
    const parsed = leadCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'BadRequest',
        message: parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      });
    }

    try {
      const lead = await CRMService.createLead(user, parsed.data as any);
      return reply.status(201).send(lead);
    } catch (err: any) {
      return reply.status(500).send({ statusCode: 500, message: err.message });
    }
  };

  fastify.post('/crm/leads', { preHandler: [authenticateToken] }, createLeadHandler);
  fastify.post('/leads', { preHandler: [authenticateToken] }, createLeadHandler);

  // PATCH /mobile/v1/crm/leads/:id & PATCH /mobile/v1/leads/:id
  const leadUpdateSchema = z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    email: z.string().email().nullable().optional(),
    phone: z.string().nullable().optional(),
    company: z.string().nullable().optional(),
    job_title: z.string().nullable().optional(),
    status: z.enum(['lead', 'prospect', 'customer', 'churned']).optional(),
    assigned_to: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
  });

  const updateLeadHandler = async (request: any, reply: any) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    const parsed = leadUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ statusCode: 400, message: 'Invalid payload' });
    }

    try {
      const updated = await CRMService.updateLead(user, id, parsed.data as any);
      return reply.send(updated);
    } catch (err: any) {
      const status = err.message.startsWith('NotFound') ? 404 : 500;
      return reply.status(status).send({ statusCode: status, message: err.message });
    }
  };

  fastify.patch('/crm/leads/:id', { preHandler: [authenticateToken] }, updateLeadHandler);
  fastify.patch('/leads/:id', { preHandler: [authenticateToken] }, updateLeadHandler);

  // DELETE /mobile/v1/crm/leads/:id & DELETE /mobile/v1/leads/:id
  const deleteLeadHandler = async (request: any, reply: any) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };

    try {
      await CRMService.deleteLead(user, id);
      return reply.send({ success: true, id });
    } catch (err: any) {
      return reply.status(500).send({ statusCode: 500, message: err.message });
    }
  };

  fastify.delete('/crm/leads/:id', { preHandler: [authenticateToken] }, deleteLeadHandler);
  fastify.delete('/leads/:id', { preHandler: [authenticateToken] }, deleteLeadHandler);

  // ── 3. Contacts ────────────────────────────────────────────────────────────

  // GET /mobile/v1/crm/contacts
  fastify.get('/crm/contacts', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { status, search, assigned_to, limit, offset } = request.query as any;

    try {
      const result = await CRMService.getContacts(user, {
        status,
        search,
        assigned_to,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });
      return reply.send(result);
    } catch (err: any) {
      return reply.status(500).send({ statusCode: 500, message: err.message });
    }
  });

  // GET /mobile/v1/crm/contacts/:id
  fastify.get('/crm/contacts/:id', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };

    try {
      const contact = await CRMService.getContact(user, id);
      return reply.send(contact);
    } catch (err: any) {
      const status = err.message.startsWith('NotFound') ? 404 : 403;
      return reply.status(status).send({ statusCode: status, message: err.message });
    }
  });

  // POST /mobile/v1/crm/contacts
  fastify.post('/crm/contacts', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const parsed = leadCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ statusCode: 400, message: 'Invalid contact payload' });
    }

    try {
      const contact = await CRMService.createContact(user, parsed.data as any);
      return reply.status(201).send(contact);
    } catch (err: any) {
      return reply.status(500).send({ statusCode: 500, message: err.message });
    }
  });

  // PATCH /mobile/v1/crm/contacts/:id
  fastify.patch('/crm/contacts/:id', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    const parsed = leadUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ statusCode: 400, message: 'Invalid payload' });
    }

    try {
      const updated = await CRMService.updateContact(user, id, parsed.data as any);
      return reply.send(updated);
    } catch (err: any) {
      return reply.status(500).send({ statusCode: 500, message: err.message });
    }
  });

  // DELETE /mobile/v1/crm/contacts/:id
  fastify.delete('/crm/contacts/:id', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };

    try {
      await CRMService.deleteContact(user, id);
      return reply.send({ success: true, id });
    } catch (err: any) {
      return reply.status(500).send({ statusCode: 500, message: err.message });
    }
  });

  // ── 4. Deals / Pipeline ────────────────────────────────────────────────────

  // GET /mobile/v1/crm/deals
  fastify.get('/crm/deals', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { stage, assigned_to, search, contact_id } = request.query as any;

    try {
      const deals = await CRMService.getDeals(user, { stage, assigned_to, search, contact_id });
      return reply.send(deals);
    } catch (err: any) {
      return reply.status(500).send({ statusCode: 500, message: err.message });
    }
  });

  // GET /mobile/v1/crm/deals/:id
  fastify.get('/crm/deals/:id', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };

    try {
      const deal = await CRMService.getDeal(user, id);
      return reply.send(deal);
    } catch (err: any) {
      const status = err.message.startsWith('NotFound') ? 404 : 403;
      return reply.status(status).send({ statusCode: status, message: err.message });
    }
  });

  const dealCreateSchema = z.object({
    title: z.string().min(1),
    contact_id: z.string().nullable().optional(),
    value: z.number().optional().default(0),
    currency: z.string().optional().default('INR'),
    stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).optional().default('lead'),
    expected_close_date: z.string().nullable().optional(),
    assigned_to: z.string().nullable().optional(),
    probability: z.number().nullable().optional(),
    notes: z.string().nullable().optional(),
  });

  // POST /mobile/v1/crm/deals
  fastify.post('/crm/deals', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const parsed = dealCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'BadRequest',
        message: parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      });
    }

    try {
      const created = await CRMService.createDeal(user, parsed.data as any);
      return reply.status(201).send(created);
    } catch (err: any) {
      return reply.status(500).send({ statusCode: 500, message: err.message });
    }
  });

  // PATCH /mobile/v1/crm/deals/:id
  fastify.patch('/crm/deals/:id', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };

    try {
      const updated = await CRMService.updateDeal(user, id, request.body as any);
      return reply.send(updated);
    } catch (err: any) {
      return reply.status(500).send({ statusCode: 500, message: err.message });
    }
  });

  // POST /mobile/v1/crm/deals/:id/stage
  fastify.post('/crm/deals/:id/stage', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    const { stage } = (request.body as { stage?: string }) || {};

    if (!stage) {
      return reply.status(400).send({ statusCode: 400, message: 'stage is required' });
    }

    try {
      const updated = await CRMService.updateDealStage(user, id, stage as any);
      return reply.send(updated);
    } catch (err: any) {
      return reply.status(500).send({ statusCode: 500, message: err.message });
    }
  });

  // DELETE /mobile/v1/crm/deals/:id
  fastify.delete('/crm/deals/:id', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };

    try {
      await CRMService.deleteDeal(user, id);
      return reply.send({ success: true, id });
    } catch (err: any) {
      return reply.status(500).send({ statusCode: 500, message: err.message });
    }
  });

  // ── 5. Tasks & Follow-ups ──────────────────────────────────────────────────

  // GET /mobile/v1/crm/tasks
  fastify.get('/crm/tasks', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { status, priority, assigned_to, contact_id, deal_id, timeframe } = request.query as any;

    try {
      const tasks = await CRMService.getTasks(user, {
        status,
        priority,
        assigned_to,
        contact_id,
        deal_id,
        timeframe,
      });
      return reply.send(tasks);
    } catch (err: any) {
      return reply.status(500).send({ statusCode: 500, message: err.message });
    }
  });

  // GET /mobile/v1/crm/tasks/:id
  fastify.get('/crm/tasks/:id', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };

    try {
      const task = await CRMService.getTask(user, id);
      return reply.send(task);
    } catch (err: any) {
      const status = err.message.startsWith('NotFound') ? 404 : 403;
      return reply.status(status).send({ statusCode: status, message: err.message });
    }
  });

  const taskCreateSchema = z.object({
    title: z.string().min(1),
    description: z.string().nullable().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
    status: z.enum(['todo', 'in_progress', 'done', 'cancelled']).optional().default('todo'),
    due_date: z.string().nullable().optional(),
    assigned_to: z.string().nullable().optional(),
    contact_id: z.string().nullable().optional(),
    deal_id: z.string().nullable().optional(),
  });

  // POST /mobile/v1/crm/tasks
  fastify.post('/crm/tasks', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const parsed = taskCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'BadRequest',
        message: parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      });
    }

    try {
      const created = await CRMService.createTask(user, parsed.data as any);
      return reply.status(201).send(created);
    } catch (err: any) {
      return reply.status(500).send({ statusCode: 500, message: err.message });
    }
  });

  // PATCH /mobile/v1/crm/tasks/:id
  fastify.patch('/crm/tasks/:id', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };

    try {
      const updated = await CRMService.updateTask(user, id, request.body as any);
      return reply.send(updated);
    } catch (err: any) {
      return reply.status(500).send({ statusCode: 500, message: err.message });
    }
  });

  // POST /mobile/v1/crm/tasks/:id/toggle
  fastify.post('/crm/tasks/:id/toggle', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    const { done } = (request.body as { done?: boolean }) || {};

    try {
      const updated = await CRMService.toggleTask(user, id, done ?? true);
      return reply.send(updated);
    } catch (err: any) {
      return reply.status(500).send({ statusCode: 500, message: err.message });
    }
  });

  // DELETE /mobile/v1/crm/tasks/:id
  fastify.delete('/crm/tasks/:id', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };

    try {
      await CRMService.deleteTask(user, id);
      return reply.send({ success: true, id });
    } catch (err: any) {
      return reply.status(500).send({ statusCode: 500, message: err.message });
    }
  });

  // ── 6. Activities & Timeline ───────────────────────────────────────────────

  // GET /mobile/v1/crm/activities
  fastify.get('/crm/activities', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { type, contact_id, deal_id, assigned_to, search, limit } = request.query as any;

    try {
      const activities = await CRMService.getActivities(user, {
        type,
        contact_id,
        deal_id,
        assigned_to,
        search,
        limit: limit ? Number(limit) : undefined,
      });
      return reply.send(activities);
    } catch (err: any) {
      return reply.status(500).send({ statusCode: 500, message: err.message });
    }
  });

  const activityCreateSchema = z.object({
    type: z.enum(['call', 'email', 'meeting', 'note', 'task', 'follow_up']),
    subject: z.string().min(1),
    description: z.string().nullable().optional(),
    contact_id: z.string().nullable().optional(),
    deal_id: z.string().nullable().optional(),
    assigned_to: z.string().nullable().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
    status: z.string().optional().default('completed'),
    scheduled_for: z.string().nullable().optional(),
  });

  // POST /mobile/v1/crm/activities
  fastify.post('/crm/activities', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const parsed = activityCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'BadRequest',
        message: parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      });
    }

    try {
      const created = await CRMService.createActivity(user, parsed.data as any);
      return reply.status(201).send(created);
    } catch (err: any) {
      return reply.status(500).send({ statusCode: 500, message: err.message });
    }
  });

  // POST /mobile/v1/crm/activities/:id/status
  fastify.post('/crm/activities/:id/status', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    const { status } = (request.body as { status?: string }) || {};

    if (!status) {
      return reply.status(400).send({ statusCode: 400, message: 'status is required' });
    }

    try {
      const updated = await CRMService.updateActivityStatus(user, id, status);
      return reply.send(updated);
    } catch (err: any) {
      return reply.status(500).send({ statusCode: 500, message: err.message });
    }
  });

  // DELETE /mobile/v1/crm/activities/:id
  fastify.delete('/crm/activities/:id', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };

    try {
      await CRMService.deleteActivity(user, id);
      return reply.send({ success: true, id });
    } catch (err: any) {
      return reply.status(500).send({ statusCode: 500, message: err.message });
    }
  });

  // Compatibility routes for lead notes
  fastify.post('/crm/leads/:id/notes', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };
    const { note } = (request.body as { note?: string }) || {};

    if (!note || !note.trim()) {
      return reply.status(400).send({ statusCode: 400, message: 'note is required' });
    }

    try {
      const activity = await CRMService.createActivity(user, {
        contact_id: id,
        type: 'note',
        subject: 'Lead Note',
        description: note.trim(),
        status: 'completed',
      });
      return reply.status(201).send(activity);
    } catch (err: any) {
      return reply.status(500).send({ statusCode: 500, message: err.message });
    }
  });

  // Compatibility routes for lead activities
  fastify.get('/crm/leads/:id/activities', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;
    const { id } = request.params as { id: string };

    try {
      const activities = await CRMService.getActivities(user, { contact_id: id });
      return reply.send(activities);
    } catch (err: any) {
      return reply.status(500).send({ statusCode: 500, message: err.message });
    }
  });
}
