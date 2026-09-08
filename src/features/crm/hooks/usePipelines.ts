import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/store/authStore';
import { crmApi } from '../api/crm.api';

export function usePipelines() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['crm_pipelines'],
    queryFn: crmApi.getPipelines,
    enabled: isAuthenticated,
    staleTime: 30000,
  });
}

