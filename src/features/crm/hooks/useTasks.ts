import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { crmApi, TaskFilterParams } from '../api/crm.api';
import { CRMTask } from '../types';
import { CRM_DASHBOARD_KEY } from './useCrmDashboard';

export const CRM_TASKS_KEY = ['crm', 'tasks'] as const;

export const useTasks = (params?: TaskFilterParams) => {
  return useQuery<CRMTask[]>({
    queryKey: [...CRM_TASKS_KEY, params],
    queryFn: () => crmApi.getTasks(params),
    staleTime: 1000 * 60 * 2,
  });
};

export const useTask = (id?: string) => {
  return useQuery<CRMTask>({
    queryKey: ['crm', 'task', id],
    queryFn: () => crmApi.getTask(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
};

export const useCreateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CRMTask>) => crmApi.createTask(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CRM_TASKS_KEY });
      qc.invalidateQueries({ queryKey: CRM_DASHBOARD_KEY });
    },
  });
};

export const useUpdateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<CRMTask> }) =>
      crmApi.updateTask(id, patch),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: CRM_TASKS_KEY });
      qc.invalidateQueries({ queryKey: ['crm', 'task', id] });
      qc.invalidateQueries({ queryKey: CRM_DASHBOARD_KEY });
    },
  });
};

export const useToggleTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      crmApi.toggleTask(id, done),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: CRM_TASKS_KEY });
      qc.invalidateQueries({ queryKey: ['crm', 'task', id] });
      qc.invalidateQueries({ queryKey: CRM_DASHBOARD_KEY });
    },
  });
};

export const useDeleteTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CRM_TASKS_KEY });
      qc.invalidateQueries({ queryKey: CRM_DASHBOARD_KEY });
    },
  });
};
