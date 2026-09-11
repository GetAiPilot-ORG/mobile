import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { crmApi, LeadFilterParams } from '../api/crm.api';
import { CRMContact, PaginatedContactsResponse } from '../types';
import { CRM_DASHBOARD_KEY } from './useCrmDashboard';

export const CRM_CONTACTS_KEY = ['crm', 'contacts'] as const;

export const useContacts = (params?: LeadFilterParams) => {
  return useQuery<PaginatedContactsResponse>({
    queryKey: [...CRM_CONTACTS_KEY, params],
    queryFn: () => crmApi.getContacts(params),
    staleTime: 1000 * 60 * 2,
  });
};

export const useContact = (id?: string) => {
  return useQuery<CRMContact>({
    queryKey: ['crm', 'contact', id],
    queryFn: () => crmApi.getContact(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
};

export const useCreateContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CRMContact>) => crmApi.createContact(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CRM_CONTACTS_KEY });
      qc.invalidateQueries({ queryKey: CRM_DASHBOARD_KEY });
    },
  });
};

export const useUpdateContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<CRMContact> }) =>
      crmApi.updateContact(id, patch),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: CRM_CONTACTS_KEY });
      qc.invalidateQueries({ queryKey: ['crm', 'contact', id] });
      qc.invalidateQueries({ queryKey: CRM_DASHBOARD_KEY });
    },
  });
};

export const useDeleteContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteContact(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CRM_CONTACTS_KEY });
      qc.invalidateQueries({ queryKey: CRM_DASHBOARD_KEY });
    },
  });
};
