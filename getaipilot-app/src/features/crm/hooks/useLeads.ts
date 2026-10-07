import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { crmApi, LeadFilterParams } from '../api/crm.api';
import { CRMContact, PaginatedLeadsResponse } from '../types';
import { CRM_DASHBOARD_KEY } from './useCrmDashboard';

export const CRM_LEADS_KEY = ['crm', 'leads'] as const;

export const useLeads = (params?: LeadFilterParams) => {
  return useQuery<PaginatedLeadsResponse>({
    queryKey: [...CRM_LEADS_KEY, params],
    queryFn: () => crmApi.getLeads(params),
    staleTime: 1000 * 60 * 2,
  });
};

export const useLead = (id?: string) => {
  return useQuery<CRMContact>({
    queryKey: ['crm', 'lead', id],
    queryFn: () => crmApi.getLead(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
};

export const useCreateLead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CRMContact>) => crmApi.createLead(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CRM_LEADS_KEY });
      qc.invalidateQueries({ queryKey: CRM_DASHBOARD_KEY });
    },
  });
};

export const useUpdateLead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<CRMContact> }) =>
      crmApi.updateLead(id, patch),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: CRM_LEADS_KEY });
      qc.invalidateQueries({ queryKey: ['crm', 'lead', id] });
      qc.invalidateQueries({ queryKey: CRM_DASHBOARD_KEY });
    },
  });
};

export const useDeleteLead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteLead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CRM_LEADS_KEY });
      qc.invalidateQueries({ queryKey: CRM_DASHBOARD_KEY });
    },
  });
};
