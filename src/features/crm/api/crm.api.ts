import { apiClient } from '../../../core/api/client';
import {
  CRMActivity,
  CRMBillingProfile,
  CRMContact,
  CRMDashboardSummary,
  CRMDeal,
  CRMInvoice,
  CRMMember,
  CRMOrganization,
  CRMPayment,
  CRMQuotation,
  CRMTask,
  DealStage,
  PaginatedBillingProfilesResponse,
  PaginatedContactsResponse,
  PaginatedInvoicesResponse,
  PaginatedLeadsResponse,
  PaginatedPaymentsResponse,
  PaginatedQuotationsResponse,
} from '../types';

export interface LeadFilterParams {
  status?: string;
  assigned_to?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface DealFilterParams {
  stage?: string;
  assigned_to?: string;
  search?: string;
  contact_id?: string;
}

export interface TaskFilterParams {
  status?: string;
  priority?: string;
  assigned_to?: string;
  contact_id?: string;
  deal_id?: string;
  timeframe?: 'today' | 'upcoming' | 'overdue' | 'completed' | 'all';
}

export interface ActivityFilterParams {
  type?: string;
  contact_id?: string;
  deal_id?: string;
  assigned_to?: string;
  search?: string;
  limit?: number;
}

export const crmApi = {
  // ── Dashboard & Metadata ──────────────────────────────────────────────────
  getDashboard: async (): Promise<CRMDashboardSummary> => {
    return await apiClient.get<CRMDashboardSummary>('/mobile/v1/crm/dashboard');
  },

  getMembers: async (): Promise<CRMMember[]> => {
    return await apiClient.get<CRMMember[]>('/mobile/v1/crm/members');
  },

  getOrganization: async (): Promise<CRMOrganization> => {
    return await apiClient.get<CRMOrganization>('/mobile/v1/crm/organization');
  },

  // ── Leads ──────────────────────────────────────────────────────────────────
  getLeads: async (params?: LeadFilterParams): Promise<PaginatedLeadsResponse> => {
    return await apiClient.get<PaginatedLeadsResponse>('/mobile/v1/crm/leads', {
      params: {
        status: params?.status,
        assigned_to: params?.assigned_to,
        search: params?.search,
        limit: params?.limit,
        offset: params?.offset,
      },
    });
  },

  getLead: async (id: string): Promise<CRMContact> => {
    return await apiClient.get<CRMContact>(`/mobile/v1/crm/leads/${id}`);
  },

  createLead: async (data: Partial<CRMContact>): Promise<CRMContact> => {
    return await apiClient.post<CRMContact>('/mobile/v1/crm/leads', data);
  },

  updateLead: async (id: string, patch: Partial<CRMContact>): Promise<CRMContact> => {
    return await apiClient.patch<CRMContact>(`/mobile/v1/crm/leads/${id}`, patch);
  },

  deleteLead: async (id: string): Promise<{ success: boolean; id: string }> => {
    return await apiClient.delete<{ success: boolean; id: string }>(`/mobile/v1/crm/leads/${id}`);
  },

  // ── Contacts Directory ─────────────────────────────────────────────────────
  getContacts: async (params?: LeadFilterParams): Promise<PaginatedContactsResponse> => {
    return await apiClient.get<PaginatedContactsResponse>('/mobile/v1/crm/contacts', {
      params: {
        status: params?.status,
        assigned_to: params?.assigned_to,
        search: params?.search,
        limit: params?.limit,
        offset: params?.offset,
      },
    });
  },

  getContact: async (id: string): Promise<CRMContact> => {
    return await apiClient.get<CRMContact>(`/mobile/v1/crm/contacts/${id}`);
  },

  createContact: async (data: Partial<CRMContact>): Promise<CRMContact> => {
    return await apiClient.post<CRMContact>('/mobile/v1/crm/contacts', data);
  },

  updateContact: async (id: string, patch: Partial<CRMContact>): Promise<CRMContact> => {
    return await apiClient.patch<CRMContact>(`/mobile/v1/crm/contacts/${id}`, patch);
  },

  deleteContact: async (id: string): Promise<{ success: boolean; id: string }> => {
    return await apiClient.delete<{ success: boolean; id: string }>(`/mobile/v1/crm/contacts/${id}`);
  },

  // ── Deals / Pipeline ───────────────────────────────────────────────────────
  getDeals: async (params?: DealFilterParams): Promise<CRMDeal[]> => {
    return await apiClient.get<CRMDeal[]>('/mobile/v1/crm/deals', {
      params: {
        stage: params?.stage,
        assigned_to: params?.assigned_to,
        search: params?.search,
        contact_id: params?.contact_id,
      },
    });
  },

  getDeal: async (id: string): Promise<CRMDeal> => {
    return await apiClient.get<CRMDeal>(`/mobile/v1/crm/deals/${id}`);
  },

  createDeal: async (data: Partial<CRMDeal>): Promise<CRMDeal> => {
    return await apiClient.post<CRMDeal>('/mobile/v1/crm/deals', data);
  },

  updateDeal: async (id: string, patch: Partial<CRMDeal>): Promise<CRMDeal> => {
    return await apiClient.patch<CRMDeal>(`/mobile/v1/crm/deals/${id}`, patch);
  },

  updateDealStage: async (id: string, stage: DealStage): Promise<CRMDeal> => {
    return await apiClient.post<CRMDeal>(`/mobile/v1/crm/deals/${id}/stage`, { stage });
  },

  deleteDeal: async (id: string): Promise<{ success: boolean; id: string }> => {
    return await apiClient.delete<{ success: boolean; id: string }>(`/mobile/v1/crm/deals/${id}`);
  },

  // ── Tasks & Follow-ups ─────────────────────────────────────────────────────
  getTasks: async (params?: TaskFilterParams): Promise<CRMTask[]> => {
    return await apiClient.get<CRMTask[]>('/mobile/v1/crm/tasks', {
      params: {
        status: params?.status,
        priority: params?.priority,
        assigned_to: params?.assigned_to,
        contact_id: params?.contact_id,
        deal_id: params?.deal_id,
        timeframe: params?.timeframe,
      },
    });
  },

  getTask: async (id: string): Promise<CRMTask> => {
    return await apiClient.get<CRMTask>(`/mobile/v1/crm/tasks/${id}`);
  },

  createTask: async (data: Partial<CRMTask>): Promise<CRMTask> => {
    return await apiClient.post<CRMTask>('/mobile/v1/crm/tasks', data);
  },

  updateTask: async (id: string, patch: Partial<CRMTask>): Promise<CRMTask> => {
    return await apiClient.patch<CRMTask>(`/mobile/v1/crm/tasks/${id}`, patch);
  },

  toggleTask: async (id: string, done: boolean): Promise<CRMTask> => {
    return await apiClient.post<CRMTask>(`/mobile/v1/crm/tasks/${id}/toggle`, { done });
  },

  deleteTask: async (id: string): Promise<{ success: boolean; id: string }> => {
    return await apiClient.delete<{ success: boolean; id: string }>(`/mobile/v1/crm/tasks/${id}`);
  },

  // ── Activities & Timeline ──────────────────────────────────────────────────
  getActivities: async (params?: ActivityFilterParams): Promise<CRMActivity[]> => {
    return await apiClient.get<CRMActivity[]>('/mobile/v1/crm/activities', {
      params: {
        type: params?.type,
        contact_id: params?.contact_id,
        deal_id: params?.deal_id,
        assigned_to: params?.assigned_to,
        search: params?.search,
        limit: params?.limit,
      },
    });
  },

  createActivity: async (data: Partial<CRMActivity>): Promise<CRMActivity> => {
    return await apiClient.post<CRMActivity>('/mobile/v1/crm/activities', data);
  },

  updateActivityStatus: async (id: string, status: string): Promise<CRMActivity> => {
    return await apiClient.post<CRMActivity>(`/mobile/v1/crm/activities/${id}/status`, { status });
  },

  deleteActivity: async (id: string): Promise<{ success: boolean; id: string }> => {
    return await apiClient.delete<{ success: boolean; id: string }>(`/mobile/v1/crm/activities/${id}`);
  },

  addLeadNote: async (id: string, note: string): Promise<CRMActivity> => {
    return await apiClient.post<CRMActivity>(`/mobile/v1/crm/leads/${id}/notes`, { note });
  },

  // ── Invoices ──────────────────────────────────────────────────────────────
  getInvoices: async (params?: { status?: string; contact_id?: string; limit?: number; offset?: number }): Promise<PaginatedInvoicesResponse> => {
    return await apiClient.get<PaginatedInvoicesResponse>('/mobile/v1/crm/invoices', { params });
  },

  getInvoice: async (id: string): Promise<CRMInvoice> => {
    return await apiClient.get<CRMInvoice>(`/mobile/v1/crm/invoices/${id}`);
  },

  createInvoice: async (data: Partial<CRMInvoice>): Promise<CRMInvoice> => {
    return await apiClient.post<CRMInvoice>('/mobile/v1/crm/invoices', data);
  },

  updateInvoice: async (id: string, patch: Partial<CRMInvoice>): Promise<CRMInvoice> => {
    return await apiClient.patch<CRMInvoice>(`/mobile/v1/crm/invoices/${id}`, patch);
  },

  deleteInvoice: async (id: string): Promise<{ success: boolean; id: string }> => {
    return await apiClient.delete<{ success: boolean; id: string }>(`/mobile/v1/crm/invoices/${id}`);
  },

  // ── Quotations ────────────────────────────────────────────────────────────
  getQuotations: async (params?: { status?: string; contact_id?: string; limit?: number }): Promise<PaginatedQuotationsResponse> => {
    return await apiClient.get<PaginatedQuotationsResponse>('/mobile/v1/crm/quotations', { params });
  },

  getQuotation: async (id: string): Promise<CRMQuotation> => {
    return await apiClient.get<CRMQuotation>(`/mobile/v1/crm/quotations/${id}`);
  },

  createQuotation: async (data: Partial<CRMQuotation>): Promise<CRMQuotation> => {
    return await apiClient.post<CRMQuotation>('/mobile/v1/crm/quotations', data);
  },

  updateQuotation: async (id: string, patch: Partial<CRMQuotation>): Promise<CRMQuotation> => {
    return await apiClient.patch<CRMQuotation>(`/mobile/v1/crm/quotations/${id}`, patch);
  },

  deleteQuotation: async (id: string): Promise<{ success: boolean; id: string }> => {
    return await apiClient.delete<{ success: boolean; id: string }>(`/mobile/v1/crm/quotations/${id}`);
  },

  // ── Billing Profiles (Client Profiles) ───────────────────────────────────
  getBillingProfiles: async (params?: { contact_id?: string; limit?: number }): Promise<PaginatedBillingProfilesResponse> => {
    return await apiClient.get<PaginatedBillingProfilesResponse>('/mobile/v1/crm/billing-profiles', { params });
  },

  getBillingProfile: async (id: string): Promise<CRMBillingProfile> => {
    return await apiClient.get<CRMBillingProfile>(`/mobile/v1/crm/billing-profiles/${id}`);
  },

  createBillingProfile: async (data: Partial<CRMBillingProfile>): Promise<CRMBillingProfile> => {
    return await apiClient.post<CRMBillingProfile>('/mobile/v1/crm/billing-profiles', data);
  },

  updateBillingProfile: async (id: string, patch: Partial<CRMBillingProfile>): Promise<CRMBillingProfile> => {
    return await apiClient.patch<CRMBillingProfile>(`/mobile/v1/crm/billing-profiles/${id}`, patch);
  },

  deleteBillingProfile: async (id: string): Promise<{ success: boolean; id: string }> => {
    return await apiClient.delete<{ success: boolean; id: string }>(`/mobile/v1/crm/billing-profiles/${id}`);
  },

  // ── Payments ──────────────────────────────────────────────────────────────
  getPayments: async (params?: { invoice_id?: string; limit?: number; offset?: number }): Promise<PaginatedPaymentsResponse> => {
    return await apiClient.get<PaginatedPaymentsResponse>('/mobile/v1/crm/payments', { params });
  },

  createPayment: async (data: Partial<CRMPayment>): Promise<CRMPayment> => {
    return await apiClient.post<CRMPayment>('/mobile/v1/crm/payments', data);
  },

  deletePayment: async (id: string): Promise<{ success: boolean; id: string }> => {
    return await apiClient.delete<{ success: boolean; id: string }>(`/mobile/v1/crm/payments/${id}`);
  },
};

