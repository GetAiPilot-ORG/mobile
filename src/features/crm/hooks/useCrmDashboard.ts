import { useQuery } from '@tanstack/react-query';
import { crmApi } from '../api/crm.api';
import { CRMDashboardSummary } from '../types';

export const CRM_DASHBOARD_KEY = ['crm', 'dashboard'] as const;

export const useCrmDashboard = () => {
  return useQuery<CRMDashboardSummary>({
    queryKey: CRM_DASHBOARD_KEY,
    queryFn: () => crmApi.getDashboard(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
  });
};
