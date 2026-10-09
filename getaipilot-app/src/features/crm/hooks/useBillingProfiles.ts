import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { crmApi } from '../api/crm.api';
import { CRMBillingProfile, PaginatedBillingProfilesResponse } from '../types';

export const CRM_BILLING_PROFILES_KEY = ['crm', 'billing-profiles'] as const;

export const useBillingProfiles = (params?: { contact_id?: string; limit?: number }) => {
  return useQuery<PaginatedBillingProfilesResponse>({
    queryKey: [...CRM_BILLING_PROFILES_KEY, params],
    queryFn: () => crmApi.getBillingProfiles(params),
    staleTime: 1000 * 60 * 2,
  });
};

export const useBillingProfile = (id?: string) => {
  return useQuery<CRMBillingProfile>({
    queryKey: ['crm', 'billing-profile', id],
    queryFn: () => crmApi.getBillingProfile(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
};

export const useCreateBillingProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CRMBillingProfile>) => crmApi.createBillingProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CRM_BILLING_PROFILES_KEY });
      qc.invalidateQueries({ queryKey: ['crm-billing-profiles'] });
    },
  });
};

export const useUpdateBillingProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<CRMBillingProfile> }) =>
      crmApi.updateBillingProfile(id, patch),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: CRM_BILLING_PROFILES_KEY });
      qc.invalidateQueries({ queryKey: ['crm-billing-profiles'] });
      qc.invalidateQueries({ queryKey: ['crm', 'billing-profile', id] });
    },
  });
};

export const useDeleteBillingProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteBillingProfile(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CRM_BILLING_PROFILES_KEY });
      qc.invalidateQueries({ queryKey: ['crm-billing-profiles'] });
    },
  });
};
