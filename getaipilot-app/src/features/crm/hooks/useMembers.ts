import { useQuery } from '@tanstack/react-query';
import { crmApi } from '../api/crm.api';
import { CRMMember } from '../types';

export const CRM_MEMBERS_KEY = ['crm', 'members'] as const;

export const useMembers = () => {
  return useQuery<CRMMember[]>({
    queryKey: CRM_MEMBERS_KEY,
    queryFn: () => crmApi.getMembers(),
    staleTime: 1000 * 60 * 5, // 5 min
  });
};
