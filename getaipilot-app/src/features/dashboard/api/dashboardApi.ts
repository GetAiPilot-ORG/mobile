import { apiClient } from '../../../core/api/client';
import { UnifiedDashboardData } from '../types';

export const dashboardApi = {
  getUnifiedDashboard: async (): Promise<UnifiedDashboardData> => {
    return await apiClient.get<UnifiedDashboardData>('/mobile/v1/dashboard');
  },
  getModules: async () => {
    return await apiClient.get<{ modules: any[] }>('/mobile/v1/modules');
  },
};
