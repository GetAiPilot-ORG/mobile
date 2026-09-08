import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/store/authStore';
import { crmApi, LeadFilterParams } from '../api/crm.api';

export function useLeads(filters: LeadFilterParams = {}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['crm_leads', filters],
    queryFn: () => crmApi.getLeads(filters),
    enabled: isAuthenticated,
    staleTime: 15000,
  });
}

