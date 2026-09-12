import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { crmApi, DealFilterParams } from '../api/crm.api';
import { CRMDeal, DealStage } from '../types';
import { CRM_DASHBOARD_KEY } from './useCrmDashboard';

export const CRM_DEALS_KEY = ['crm', 'deals'] as const;

export const useDeals = (params?: DealFilterParams) => {
  return useQuery<CRMDeal[]>({
    queryKey: [...CRM_DEALS_KEY, params],
    queryFn: () => crmApi.getDeals(params),
    staleTime: 1000 * 60 * 2,
  });
};

export const useDeal = (id?: string) => {
  return useQuery<CRMDeal>({
    queryKey: ['crm', 'deal', id],
    queryFn: () => crmApi.getDeal(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
};

export const useCreateDeal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CRMDeal>) => crmApi.createDeal(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CRM_DEALS_KEY });
      qc.invalidateQueries({ queryKey: CRM_DASHBOARD_KEY });
    },
  });
};

export const useUpdateDeal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<CRMDeal> }) =>
      crmApi.updateDeal(id, patch),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: CRM_DEALS_KEY });
      qc.invalidateQueries({ queryKey: ['crm', 'deal', id] });
      qc.invalidateQueries({ queryKey: CRM_DASHBOARD_KEY });
    },
  });
};

export const useUpdateDealStage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: DealStage }) =>
      crmApi.updateDealStage(id, stage),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: CRM_DEALS_KEY });
      qc.invalidateQueries({ queryKey: ['crm', 'deal', id] });
      qc.invalidateQueries({ queryKey: CRM_DASHBOARD_KEY });
    },
  });
};

export const useDeleteDeal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteDeal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CRM_DEALS_KEY });
      qc.invalidateQueries({ queryKey: CRM_DASHBOARD_KEY });
    },
  });
};
