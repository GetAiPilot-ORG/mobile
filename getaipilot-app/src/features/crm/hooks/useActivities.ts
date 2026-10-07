import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityFilterParams, crmApi } from '../api/crm.api';
import { CRMActivity } from '../types';
import { CRM_DASHBOARD_KEY } from './useCrmDashboard';

export const CRM_ACTIVITIES_KEY = ['crm', 'activities'] as const;

export const useActivities = (params?: ActivityFilterParams) => {
  return useQuery<CRMActivity[]>({
    queryKey: [...CRM_ACTIVITIES_KEY, params],
    queryFn: () => crmApi.getActivities(params),
    staleTime: 1000 * 60 * 2,
  });
};

export const useCreateActivity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CRMActivity>) => crmApi.createActivity(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CRM_ACTIVITIES_KEY });
      qc.invalidateQueries({ queryKey: CRM_DASHBOARD_KEY });
    },
  });
};

export const useUpdateActivityStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      crmApi.updateActivityStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CRM_ACTIVITIES_KEY });
      qc.invalidateQueries({ queryKey: CRM_DASHBOARD_KEY });
    },
  });
};

export const useDeleteActivity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteActivity(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CRM_ACTIVITIES_KEY });
      qc.invalidateQueries({ queryKey: CRM_DASHBOARD_KEY });
    },
  });
};

export const useAddLeadNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, note }: { leadId: string; note: string }) =>
      crmApi.addLeadNote(leadId, note),
    onSuccess: (_, { leadId }) => {
      qc.invalidateQueries({ queryKey: CRM_ACTIVITIES_KEY });
      qc.invalidateQueries({ queryKey: ['crm', 'lead', leadId] });
      qc.invalidateQueries({ queryKey: CRM_DASHBOARD_KEY });
    },
  });
};
