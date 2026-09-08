import { apiClient } from '../../../core/api/client';
import { CRMActivity, Lead, PaginatedLeadsResponse, Pipeline } from '../types';

export interface LeadFilterParams {
  pipeline_id?: string;
  stage_id?: string;
  owner_id?: string;
  status?: string;
  search?: string;
  cursor?: string;
  limit?: number;
}

export const crmApi = {
  getPipelines: async (): Promise<Pipeline[]> => {
    return await apiClient.get<Pipeline[]>('/mobile/v1/crm/pipelines');
  },

  getLeads: async (params?: LeadFilterParams): Promise<PaginatedLeadsResponse> => {
    return await apiClient.get<PaginatedLeadsResponse>('/mobile/v1/leads', {
      params: {
        pipeline_id: params?.pipeline_id,
        stage_id: params?.stage_id,
        owner_id: params?.owner_id,
        status: params?.status,
        search: params?.search,
        cursor: params?.cursor,
        limit: params?.limit,
      },
    });
  },

  getLead: async (id: string): Promise<Lead> => {
    return await apiClient.get<Lead>(`/mobile/v1/leads/${id}`);
  },

  createLead: async (data: Partial<Lead>): Promise<Lead> => {
    return await apiClient.post<Lead>('/mobile/v1/leads', data);
  },

  updateLead: async (id: string, patch: Partial<Lead>): Promise<Lead> => {
    return await apiClient.patch<Lead>(`/mobile/v1/leads/${id}`, patch);
  },

  moveLead: async (id: string, stageId: string): Promise<Lead> => {
    return await apiClient.post<Lead>(`/mobile/v1/leads/${id}/move`, { stage_id: stageId });
  },

  assignLead: async (id: string, ownerId: string, ownerName: string): Promise<Lead> => {
    return await apiClient.post<Lead>(`/mobile/v1/leads/${id}/assign`, {
      owner_id: ownerId,
      owner_name: ownerName,
    });
  },

  getLeadActivities: async (id: string): Promise<CRMActivity[]> => {
    return await apiClient.get<CRMActivity[]>(`/mobile/v1/leads/${id}/activities`);
  },

  addLeadNote: async (id: string, note: string): Promise<CRMActivity> => {
    return await apiClient.post<CRMActivity>(`/mobile/v1/leads/${id}/notes`, { note });
  },
};
