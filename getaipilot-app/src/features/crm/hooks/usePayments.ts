import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { crmApi } from '../api/crm.api';
import { CRMPayment, PaginatedPaymentsResponse } from '../types';

export const CRM_PAYMENTS_KEY = ['crm', 'payments'] as const;

export const usePayments = (params?: { invoice_id?: string; limit?: number; offset?: number }) => {
  return useQuery<PaginatedPaymentsResponse>({
    queryKey: [...CRM_PAYMENTS_KEY, params],
    queryFn: () => crmApi.getPayments(params),
    staleTime: 1000 * 60 * 2,
  });
};

export const useCreatePayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CRMPayment>) => crmApi.createPayment(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CRM_PAYMENTS_KEY });
      qc.invalidateQueries({ queryKey: ['crm-payments'] });
      qc.invalidateQueries({ queryKey: ['crm', 'invoices'] });
      qc.invalidateQueries({ queryKey: ['crm-dashboard'] });
    },
  });
};

export const useDeletePayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.deletePayment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CRM_PAYMENTS_KEY });
      qc.invalidateQueries({ queryKey: ['crm-payments'] });
      qc.invalidateQueries({ queryKey: ['crm', 'invoices'] });
      qc.invalidateQueries({ queryKey: ['crm-dashboard'] });
    },
  });
};
