import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/store/authStore';
import { crmApi } from '../api/crm.api';
import { Pipeline } from '../types';

export function usePipelines() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<Pipeline[]>({
    queryKey: ['crm_pipelines'],
    queryFn: async () => {
      const dash = await crmApi.getDashboard();
      const pipeline: Pipeline = {
        id: 'pipe_default',
        name: 'Sales Pipeline',
        stages: dash.pipelineSummary || [],
      };
      return [pipeline];
    },
    enabled: isAuthenticated,
    staleTime: 30000,
  });
}
