import { CRMRepository, PIPELINE_STAGES } from './crm/crm.repository.js';
import { JWTPayload } from '../types/index.js';
import {
  CRMActivity,
  CRMContact,
  CRMDashboardSummary,
  CRMDeal,
  CRMMember,
  CRMTask,
  DealStage,
} from '../types/crm.types.js';
import { WebSocketService } from './websocket.service.js';

export class CRMService {
  // ── Context & Stages ───────────────────────────────────────────────────────

  public static async getStages(_user: JWTPayload) {
    return PIPELINE_STAGES;
  }

  public static async getMembers(user: JWTPayload): Promise<CRMMember[]> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    return await CRMRepository.getMembers(ctx.crmOrgId);
  }

  // ── Dashboard Summary ──────────────────────────────────────────────────────

  public static async getDashboardSummary(user: JWTPayload): Promise<CRMDashboardSummary> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    return await CRMRepository.getDashboardSummary(ctx.crmOrgId);
  }

  // ── Leads (Contacts with status='lead' or all contacts) ─────────────────────

  public static async getLeads(
    user: JWTPayload,
    filters: { status?: string; search?: string; assigned_to?: string; limit?: number; offset?: number } = {}
  ): Promise<{ leads: CRMContact[]; total_count: number }> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    const effectiveStatus = filters.status || 'lead';
    const result = await CRMRepository.getContacts(ctx.crmOrgId, {
      ...filters,
      status: effectiveStatus,
    });
    return {
      leads: result.contacts,
      total_count: result.totalCount,
    };
  }

  public static async getLead(user: JWTPayload, id: string): Promise<CRMContact> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    const lead = await CRMRepository.getContactById(ctx.crmOrgId, id);
    if (!lead) {
      throw new Error('NotFound: Lead not found in this organization');
    }
    return lead;
  }

  public static async createLead(user: JWTPayload, data: Partial<CRMContact>): Promise<CRMContact> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    const leadData: Partial<CRMContact> = {
      ...data,
      status: data.status || 'lead',
      assigned_to: data.assigned_to || (ctx.crmMemberId !== ctx.hubUserId ? ctx.crmMemberId : null),
    };
    const newLead = await CRMRepository.createContact(ctx.crmOrgId, leadData);

    WebSocketService.broadcastToOrg(user.organization_id, 'lead.created' as any, newLead);
    return newLead;
  }

  public static async updateLead(user: JWTPayload, id: string, data: Partial<CRMContact>): Promise<CRMContact> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    const updated = await CRMRepository.updateContact(ctx.crmOrgId, id, data);

    WebSocketService.broadcastToOrg(user.organization_id, 'lead.updated' as any, updated);
    return updated;
  }

  public static async deleteLead(user: JWTPayload, id: string): Promise<boolean> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    return await CRMRepository.deleteContact(ctx.crmOrgId, id);
  }

  // ── Contacts Directory ─────────────────────────────────────────────────────

  public static async getContacts(
    user: JWTPayload,
    filters: { status?: string; search?: string; assigned_to?: string; limit?: number; offset?: number } = {}
  ): Promise<{ contacts: CRMContact[]; total_count: number }> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    const result = await CRMRepository.getContacts(ctx.crmOrgId, filters);
    return {
      contacts: result.contacts,
      total_count: result.totalCount,
    };
  }

  public static async getContact(user: JWTPayload, id: string): Promise<CRMContact> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    const contact = await CRMRepository.getContactById(ctx.crmOrgId, id);
    if (!contact) {
      throw new Error('NotFound: Contact not found in this organization');
    }
    return contact;
  }

  public static async createContact(user: JWTPayload, data: Partial<CRMContact>): Promise<CRMContact> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    return await CRMRepository.createContact(ctx.crmOrgId, data);
  }

  public static async updateContact(user: JWTPayload, id: string, data: Partial<CRMContact>): Promise<CRMContact> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    return await CRMRepository.updateContact(ctx.crmOrgId, id, data);
  }

  public static async deleteContact(user: JWTPayload, id: string): Promise<boolean> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    return await CRMRepository.deleteContact(ctx.crmOrgId, id);
  }

  // ── Deals / Pipeline ───────────────────────────────────────────────────────

  public static async getDeals(
    user: JWTPayload,
    filters: { stage?: string; assigned_to?: string; search?: string; contact_id?: string } = {}
  ): Promise<CRMDeal[]> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    return await CRMRepository.getDeals(ctx.crmOrgId, filters);
  }

  public static async getDeal(user: JWTPayload, id: string): Promise<CRMDeal> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    const deal = await CRMRepository.getDealById(ctx.crmOrgId, id);
    if (!deal) {
      throw new Error('NotFound: Deal not found in this organization');
    }
    return deal;
  }

  public static async createDeal(user: JWTPayload, data: Partial<CRMDeal>): Promise<CRMDeal> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    const created = await CRMRepository.createDeal(ctx.crmOrgId, data);
    WebSocketService.broadcastToOrg(user.organization_id, 'deal.created' as any, created);
    return created;
  }

  public static async updateDeal(user: JWTPayload, id: string, data: Partial<CRMDeal>): Promise<CRMDeal> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    const updated = await CRMRepository.updateDeal(ctx.crmOrgId, id, data);
    WebSocketService.broadcastToOrg(user.organization_id, 'deal.updated' as any, updated);
    return updated;
  }

  public static async updateDealStage(user: JWTPayload, id: string, stage: DealStage): Promise<CRMDeal> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    const updated = await CRMRepository.updateDealStage(ctx.crmOrgId, id, stage);
    WebSocketService.broadcastToOrg(user.organization_id, 'deal.updated' as any, updated);
    return updated;
  }

  public static async deleteDeal(user: JWTPayload, id: string): Promise<boolean> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    return await CRMRepository.deleteDeal(ctx.crmOrgId, id);
  }

  // ── Tasks & Follow-ups ─────────────────────────────────────────────────────

  public static async getTasks(
    user: JWTPayload,
    filters: {
      status?: string;
      priority?: string;
      assigned_to?: string;
      contact_id?: string;
      deal_id?: string;
      timeframe?: 'today' | 'upcoming' | 'overdue' | 'completed' | 'all';
    } = {}
  ): Promise<CRMTask[]> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    return await CRMRepository.getTasks(ctx.crmOrgId, filters);
  }

  public static async getTask(user: JWTPayload, id: string): Promise<CRMTask> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    const task = await CRMRepository.getTaskById(ctx.crmOrgId, id);
    if (!task) {
      throw new Error('NotFound: Task not found in this organization');
    }
    return task;
  }

  public static async createTask(user: JWTPayload, data: Partial<CRMTask>): Promise<CRMTask> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    const created = await CRMRepository.createTask(ctx.crmOrgId, data);
    WebSocketService.broadcastToOrg(user.organization_id, 'task.created' as any, created);
    return created;
  }

  public static async updateTask(user: JWTPayload, id: string, data: Partial<CRMTask>): Promise<CRMTask> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    const updated = await CRMRepository.updateTask(ctx.crmOrgId, id, data);
    WebSocketService.broadcastToOrg(user.organization_id, 'task.updated' as any, updated);
    return updated;
  }

  public static async toggleTask(user: JWTPayload, id: string, done: boolean): Promise<CRMTask> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    const toggled = await CRMRepository.toggleTask(ctx.crmOrgId, id, done);
    WebSocketService.broadcastToOrg(user.organization_id, 'task.updated' as any, toggled);
    return toggled;
  }

  public static async deleteTask(user: JWTPayload, id: string): Promise<boolean> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    return await CRMRepository.deleteTask(ctx.crmOrgId, id);
  }

  // ── Activities & Timeline ──────────────────────────────────────────────────

  public static async getActivities(
    user: JWTPayload,
    filters: {
      type?: string;
      contact_id?: string;
      deal_id?: string;
      assigned_to?: string;
      search?: string;
      limit?: number;
    } = {}
  ): Promise<CRMActivity[]> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    return await CRMRepository.getActivities(ctx.crmOrgId, filters);
  }

  public static async createActivity(user: JWTPayload, data: Partial<CRMActivity>): Promise<CRMActivity> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    const payload: Partial<CRMActivity> = {
      ...data,
      created_by: ctx.crmMemberId !== ctx.hubUserId ? ctx.crmMemberId : undefined,
    };
    const created = await CRMRepository.createActivity(ctx.crmOrgId, payload);
    WebSocketService.broadcastToOrg(user.organization_id, 'activity.created' as any, created);
    return created;
  }

  public static async updateActivityStatus(user: JWTPayload, id: string, status: string): Promise<CRMActivity> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    return await CRMRepository.updateActivityStatus(ctx.crmOrgId, id, status);
  }

  public static async deleteActivity(user: JWTPayload, id: string): Promise<boolean> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    return await CRMRepository.deleteActivity(ctx.crmOrgId, id);
  }

  // ── Organization ────────────────────────────────────────────────────────────

  public static async getOrganization(user: JWTPayload): Promise<any> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    return await CRMRepository.getOrganization(ctx.crmOrgId);
  }

  // ── Invoices ────────────────────────────────────────────────────────────────

  public static async getInvoices(user: JWTPayload, filters: any = {}): Promise<any> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    return await CRMRepository.getInvoices(ctx.crmOrgId, filters);
  }

  public static async getInvoiceById(user: JWTPayload, id: string): Promise<any> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    return await CRMRepository.getInvoiceById(ctx.crmOrgId, id);
  }

  public static async createInvoice(user: JWTPayload, data: any): Promise<any> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    return await CRMRepository.createInvoice(ctx.crmOrgId, data);
  }

  public static async updateInvoice(user: JWTPayload, id: string, patch: any): Promise<any> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    return await CRMRepository.updateInvoice(ctx.crmOrgId, id, patch);
  }

  public static async deleteInvoice(user: JWTPayload, id: string): Promise<boolean> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    return await CRMRepository.deleteInvoice(ctx.crmOrgId, id);
  }

  // ── Quotations ──────────────────────────────────────────────────────────────

  public static async getQuotations(user: JWTPayload, filters: any = {}): Promise<any> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    return await CRMRepository.getQuotations(ctx.crmOrgId, filters);
  }

  public static async getQuotationById(user: JWTPayload, id: string): Promise<any> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    return await CRMRepository.getQuotationById(ctx.crmOrgId, id);
  }

  public static async createQuotation(user: JWTPayload, data: any): Promise<any> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    return await CRMRepository.createQuotation(ctx.crmOrgId, data);
  }

  public static async updateQuotation(user: JWTPayload, id: string, patch: any): Promise<any> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    return await CRMRepository.updateQuotation(ctx.crmOrgId, id, patch);
  }

  public static async deleteQuotation(user: JWTPayload, id: string): Promise<boolean> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    return await CRMRepository.deleteQuotation(ctx.crmOrgId, id);
  }

  // ── Billing Profiles ────────────────────────────────────────────────────────

  public static async getBillingProfiles(user: JWTPayload, filters: any = {}): Promise<any> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    return await CRMRepository.getBillingProfiles(ctx.crmOrgId, filters);
  }

  public static async getBillingProfileById(user: JWTPayload, id: string): Promise<any> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    return await CRMRepository.getBillingProfileById(ctx.crmOrgId, id);
  }

  public static async createBillingProfile(user: JWTPayload, data: any): Promise<any> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    return await CRMRepository.createBillingProfile(ctx.crmOrgId, data);
  }

  public static async updateBillingProfile(user: JWTPayload, id: string, patch: any): Promise<any> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    return await CRMRepository.updateBillingProfile(ctx.crmOrgId, id, patch);
  }

  public static async deleteBillingProfile(user: JWTPayload, id: string): Promise<boolean> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    return await CRMRepository.deleteBillingProfile(ctx.crmOrgId, id);
  }

  // ── Payments ────────────────────────────────────────────────────────────────

  public static async getPayments(user: JWTPayload, filters: any = {}): Promise<any> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    return await CRMRepository.getPayments(ctx.crmOrgId, filters);
  }

  public static async createPayment(user: JWTPayload, data: any): Promise<any> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    return await CRMRepository.createPayment(ctx.crmOrgId, data);
  }

  public static async deletePayment(user: JWTPayload, id: string): Promise<boolean> {
    const ctx = await CRMRepository.resolveCrmContext(user);
    return await CRMRepository.deletePayment(ctx.crmOrgId, id);
  }
}

