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
    try {
      const res = await apiClient.get<PaginatedContactsResponse>('/mobile/v1/crm/contacts', {
        params: {
          status: params?.status,
          assigned_to: params?.assigned_to,
          search: params?.search,
          limit: params?.limit,
          offset: params?.offset,
        },
      });
      if (res && Array.isArray(res.contacts)) {
        return res;
      }
    } catch (bffErr: any) {
      if (__DEV__) {
        console.warn('[crmApi.getContacts] BFF query error, falling back to direct CRM Supabase REST:', bffErr?.message);
      }
    }

    try {
      let url = 'https://hhieilvvechtdhhfjomn.supabase.co/rest/v1/crm_contacts?select=*&order=created_at.desc';
      if (params?.limit) url += `&limit=${params.limit}`;
      if (params?.status) url += `&status=eq.${encodeURIComponent(params.status)}`;
      if (params?.search) {
        const s = encodeURIComponent(`%${params.search}%`);
        url += `&or=(first_name.ilike.${s},last_name.ilike.${s},email.ilike.${s},phone.ilike.${s},company.ilike.${s})`;
      }

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDYzNzEsImV4cCI6MjA4OTk4MjM3MX0.jrDgt81FFK5owy3OPIp9RlaaYJddlaZ87Iz2Uz8rXTE',
          'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDYzNzEsImV4cCI6MjA4OTk4MjM3MX0.jrDgt81FFK5owy3OPIp9RlaaYJddlaZ87Iz2Uz8rXTE',
        },
      });

      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        return {
          contacts: list,
          total_count: list.length,
        };
      }
    } catch (sbErr) {
      if (__DEV__) {
        console.warn('[crmApi.getContacts] Direct Supabase REST fetch failed:', sbErr);
      }
    }

    return { contacts: [], total_count: 0 };
  },

  getContact: async (id: string): Promise<CRMContact> => {
    try {
      return await apiClient.get<CRMContact>(`/mobile/v1/crm/contacts/${id}`);
    } catch (bffErr: any) {
      const res = await fetch(`https://hhieilvvechtdhhfjomn.supabase.co/rest/v1/crm_contacts?id=eq.${id}&select=*`, {
        headers: {
          'accept': 'application/vnd.pgrst.object+json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDYzNzEsImV4cCI6MjA4OTk4MjM3MX0.jrDgt81FFK5owy3OPIp9RlaaYJddlaZ87Iz2Uz8rXTE',
          'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDYzNzEsImV4cCI6MjA4OTk4MjM3MX0.jrDgt81FFK5owy3OPIp9RlaaYJddlaZ87Iz2Uz8rXTE',
        },
      });
      if (res.ok) {
        return (await res.json()) as CRMContact;
      }
      throw bffErr;
    }
  },

  createContact: async (data: Partial<CRMContact>): Promise<CRMContact> => {
    try {
      const res = await apiClient.post<CRMContact>('/mobile/v1/crm/contacts', data);
      if (res && res.id) return res;
    } catch (bffErr: any) {
      if (__DEV__) {
        console.warn('[crmApi.createContact] BFF error, trying direct CRM Supabase REST API:', bffErr?.message);
      }
    }

    // Direct Supabase REST call matching the official cURL specification
    const payload = {
      first_name: data.first_name?.trim() || '',
      last_name: data.last_name?.trim() || '',
      email: data.email?.trim() || '',
      phone: data.phone?.trim() || '',
      company: data.company?.trim() || '',
      job_title: data.job_title?.trim() || '',
      status: data.status || 'prospect',
      notes: data.notes || '',
      tags: data.tags || [],
      org_id: data.org_id || '7eb7dd38-00bc-49b8-a87f-96c27cac7866',
    };

    const res = await fetch('https://hhieilvvechtdhhfjomn.supabase.co/rest/v1/crm_contacts?select=*', {
      method: 'POST',
      headers: {
        'accept': 'application/vnd.pgrst.object+json',
        'accept-language': 'en-US,en;q=0.9',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDYzNzEsImV4cCI6MjA4OTk4MjM3MX0.jrDgt81FFK5owy3OPIp9RlaaYJddlaZ87Iz2Uz8rXTE',
        'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDYzNzEsImV4cCI6MjA4OTk4MjM3MX0.jrDgt81FFK5owy3OPIp9RlaaYJddlaZ87Iz2Uz8rXTE',
        'content-profile': 'public',
        'content-type': 'application/json',
        'prefer': 'return=representation',
        'origin': 'https://getaipilot.online',
        'referer': 'https://getaipilot.online/',
        'x-client-info': 'supabase-js-web/2.100.1',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || `Failed to create contact (HTTP ${res.status})`);
    }

    return (await res.json()) as CRMContact;
  },

  updateContact: async (id: string, patch: Partial<CRMContact>): Promise<CRMContact> => {
    try {
      return await apiClient.patch<CRMContact>(`/mobile/v1/crm/contacts/${id}`, patch);
    } catch (bffErr: any) {
      const res = await fetch(`https://hhieilvvechtdhhfjomn.supabase.co/rest/v1/crm_contacts?id=eq.${id}&select=*`, {
        method: 'PATCH',
        headers: {
          'accept': 'application/vnd.pgrst.object+json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDYzNzEsImV4cCI6MjA4OTk4MjM3MX0.jrDgt81FFK5owy3OPIp9RlaaYJddlaZ87Iz2Uz8rXTE',
          'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDYzNzEsImV4cCI6MjA4OTk4MjM3MX0.jrDgt81FFK5owy3OPIp9RlaaYJddlaZ87Iz2Uz8rXTE',
          'content-type': 'application/json',
          'prefer': 'return=representation',
        },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        return (await res.json()) as CRMContact;
      }
      throw bffErr;
    }
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
    try {
      const res = await apiClient.post<CRMDeal>('/mobile/v1/crm/deals', data);
      if (res && res.id) return res;
    } catch (bffErr: any) {
      if (__DEV__) {
        console.warn('[crmApi.createDeal] BFF error, trying direct CRM Supabase REST API:', bffErr?.message);
      }
    }

    const payload = {
      title: data.title?.trim() || 'New Deal',
      contact_id: data.contact_id || null,
      value: data.value !== undefined ? Number(data.value) : 0,
      currency: data.currency || 'INR',
      stage: data.stage || 'lead',
      expected_close_date: data.expected_close_date || null,
      assigned_to: data.assigned_to || null,
      probability: data.probability !== undefined ? Number(data.probability) : null,
      notes: data.notes || null,
      org_id: data.org_id || '7eb7dd38-00bc-49b8-a87f-96c27cac7866',
    };

    const res = await fetch('https://hhieilvvechtdhhfjomn.supabase.co/rest/v1/crm_deals?select=*', {
      method: 'POST',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDYzNzEsImV4cCI6MjA4OTk4MjM3MX0.jrDgt81FFK5owy3OPIp9RlaaYJddlaZ87Iz2Uz8rXTE',
        'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDYzNzEsImV4cCI6MjA4OTk4MjM3MX0.jrDgt81FFK5owy3OPIp9RlaaYJddlaZ87Iz2Uz8rXTE',
        'content-type': 'application/json',
        'accept': 'application/vnd.pgrst.object+json',
        'prefer': 'return=representation',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || `Failed to create deal (HTTP ${res.status})`);
    }

    return (await res.json()) as CRMDeal;
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
    try {
      const res = await apiClient.post<CRMTask>('/mobile/v1/crm/tasks', data);
      if (res && res.id) return res;
    } catch (bffErr: any) {
      if (__DEV__) {
        console.warn('[crmApi.createTask] BFF error, trying direct CRM Supabase REST API:', bffErr?.message);
      }
    }

    const payload = {
      title: data.title?.trim() || 'New Task',
      description: data.description?.trim() || '',
      priority: data.priority || 'medium',
      status: data.status || 'todo',
      due_date: data.due_date || null,
      contact_id: data.contact_id || null,
      deal_id: data.deal_id || null,
      assigned_to: data.assigned_to || null,
      org_id: data.org_id || '7eb7dd38-00bc-49b8-a87f-96c27cac7866',
    };

    const res = await fetch('https://hhieilvvechtdhhfjomn.supabase.co/rest/v1/crm_tasks?select=*', {
      method: 'POST',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDYzNzEsImV4cCI6MjA4OTk4MjM3MX0.jrDgt81FFK5owy3OPIp9RlaaYJddlaZ87Iz2Uz8rXTE',
        'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDYzNzEsImV4cCI6MjA4OTk4MjM3MX0.jrDgt81FFK5owy3OPIp9RlaaYJddlaZ87Iz2Uz8rXTE',
        'content-type': 'application/json',
        'accept': 'application/vnd.pgrst.object+json',
        'prefer': 'return=representation',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || `Failed to create task (HTTP ${res.status})`);
    }

    return (await res.json()) as CRMTask;
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
    try {
      const res = await apiClient.get<PaginatedBillingProfilesResponse>('/mobile/v1/crm/billing-profiles', { params });
      if (res && Array.isArray(res.profiles)) return res;
    } catch (bffErr: any) {
      if (__DEV__) {
        console.warn('[crmApi.getBillingProfiles] BFF error, falling back to direct Supabase REST:', bffErr?.message);
      }
    }

    try {
      let url = 'https://hhieilvvechtdhhfjomn.supabase.co/rest/v1/crm_billing_profiles?select=*,contact:crm_contacts(*)&order=created_at.desc';
      if (params?.limit) url += `&limit=${params.limit}`;
      if (params?.contact_id) url += `&contact_id=eq.${params.contact_id}`;

      const res = await fetch(url, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDYzNzEsImV4cCI6MjA4OTk4MjM3MX0.jrDgt81FFK5owy3OPIp9RlaaYJddlaZ87Iz2Uz8rXTE',
          'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDYzNzEsImV4cCI6MjA4OTk4MjM3MX0.jrDgt81FFK5owy3OPIp9RlaaYJddlaZ87Iz2Uz8rXTE',
        },
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        return { profiles: list, total_count: list.length };
      }
    } catch {}

    return { profiles: [], total_count: 0 };
  },

  getBillingProfile: async (id: string): Promise<CRMBillingProfile> => {
    return await apiClient.get<CRMBillingProfile>(`/mobile/v1/crm/billing-profiles/${id}`);
  },

  createBillingProfile: async (data: Partial<CRMBillingProfile>): Promise<CRMBillingProfile> => {
    try {
      const res = await apiClient.post<CRMBillingProfile>('/mobile/v1/crm/billing-profiles', data);
      if (res && res.id) return res;
    } catch (bffErr: any) {
      if (__DEV__) {
        console.warn('[crmApi.createBillingProfile] BFF error, trying direct CRM Supabase REST API:', bffErr?.message);
      }
    }

    const payload = {
      legal_name: data.legal_name?.trim() || 'Client',
      gstin: data.gstin?.trim() || '',
      pan: data.pan?.trim() || '',
      billing_address_street: data.billing_address_street?.trim() || '',
      billing_address_city: data.billing_address_city?.trim() || '',
      billing_address_state: data.billing_address_state?.trim() || '',
      billing_address_pincode: data.billing_address_pincode?.trim() || '',
      state_code: data.state_code?.trim() || '',
      place_of_supply: data.place_of_supply?.trim() || '',
      email: data.email?.trim() || '',
      phone: data.phone?.trim() || '',
      contact_id: data.contact_id || null,
      org_id: data.org_id || '7eb7dd38-00bc-49b8-a87f-96c27cac7866',
    };

    const res = await fetch('https://hhieilvvechtdhhfjomn.supabase.co/rest/v1/crm_billing_profiles?select=*', {
      method: 'POST',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDYzNzEsImV4cCI6MjA4OTk4MjM3MX0.jrDgt81FFK5owy3OPIp9RlaaYJddlaZ87Iz2Uz8rXTE',
        'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDYzNzEsImV4cCI6MjA4OTk4MjM3MX0.jrDgt81FFK5owy3OPIp9RlaaYJddlaZ87Iz2Uz8rXTE',
        'content-type': 'application/json',
        'accept': 'application/vnd.pgrst.object+json',
        'prefer': 'return=representation',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || `Failed to create billing profile (HTTP ${res.status})`);
    }

    return (await res.json()) as CRMBillingProfile;
  },

  updateBillingProfile: async (id: string, patch: Partial<CRMBillingProfile>): Promise<CRMBillingProfile> => {
    return await apiClient.patch<CRMBillingProfile>(`/mobile/v1/crm/billing-profiles/${id}`, patch);
  },

  deleteBillingProfile: async (id: string): Promise<{ success: boolean; id: string }> => {
    return await apiClient.delete<{ success: boolean; id: string }>(`/mobile/v1/crm/billing-profiles/${id}`);
  },

  // ── Payments ──────────────────────────────────────────────────────────────
  getPayments: async (params?: { invoice_id?: string; limit?: number; offset?: number }): Promise<PaginatedPaymentsResponse> => {
    try {
      const res = await apiClient.get<PaginatedPaymentsResponse>('/mobile/v1/crm/payments', { params });
      if (res && Array.isArray(res.payments)) return res;
    } catch (bffErr: any) {
      if (__DEV__) {
        console.warn('[crmApi.getPayments] BFF error, falling back to direct Supabase REST:', bffErr?.message);
      }
    }

    try {
      let url = 'https://hhieilvvechtdhhfjomn.supabase.co/rest/v1/crm_payments?select=*&order=payment_date.desc,created_at.desc';
      if (params?.limit) url += `&limit=${params.limit}`;
      if (params?.invoice_id) url += `&invoice_id=eq.${params.invoice_id}`;

      const res = await fetch(url, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDYzNzEsImV4cCI6MjA4OTk4MjM3MX0.jrDgt81FFK5owy3OPIp9RlaaYJddlaZ87Iz2Uz8rXTE',
          'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDYzNzEsImV4cCI6MjA4OTk4MjM3MX0.jrDgt81FFK5owy3OPIp9RlaaYJddlaZ87Iz2Uz8rXTE',
        },
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        return { payments: list, total_count: list.length };
      }
    } catch {}

    return { payments: [], total_count: 0 };
  },

  createPayment: async (data: Partial<CRMPayment>): Promise<CRMPayment> => {
    try {
      const res = await apiClient.post<CRMPayment>('/mobile/v1/crm/payments', data);
      if (res && res.id) return res;
    } catch (bffErr: any) {
      if (__DEV__) {
        console.warn('[crmApi.createPayment] BFF error, trying direct CRM Supabase REST API:', bffErr?.message);
      }
    }

    const payload = {
      amount: data.amount !== undefined ? Number(data.amount) : 0,
      payment_date: data.payment_date || new Date().toISOString().slice(0, 10),
      payment_method: data.payment_method || 'BANK_TRANSFER',
      invoice_id: data.invoice_id || null,
      billing_profile_id: data.billing_profile_id || null,
      reference_number: data.reference_number || '',
      notes: data.notes || '',
      status: data.status || 'COMPLETED',
      org_id: data.org_id || '7eb7dd38-00bc-49b8-a87f-96c27cac7866',
    };

    const res = await fetch('https://hhieilvvechtdhhfjomn.supabase.co/rest/v1/crm_payments?select=*', {
      method: 'POST',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDYzNzEsImV4cCI6MjA4OTk4MjM3MX0.jrDgt81FFK5owy3OPIp9RlaaYJddlaZ87Iz2Uz8rXTE',
        'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDYzNzEsImV4cCI6MjA4OTk4MjM3MX0.jrDgt81FFK5owy3OPIp9RlaaYJddlaZ87Iz2Uz8rXTE',
        'content-type': 'application/json',
        'accept': 'application/vnd.pgrst.object+json',
        'prefer': 'return=representation',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || `Failed to record payment (HTTP ${res.status})`);
    }

    return (await res.json()) as CRMPayment;
  },

  deletePayment: async (id: string): Promise<{ success: boolean; id: string }> => {
    return await apiClient.delete<{ success: boolean; id: string }>(`/mobile/v1/crm/payments/${id}`);
  },
};

