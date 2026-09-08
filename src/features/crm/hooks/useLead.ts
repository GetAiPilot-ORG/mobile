import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/store/authStore';
import { crmApi } from '../api/crm.api';

export function useLead(leadId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const leadQuery = useQuery({
    queryKey: ['crm_lead', leadId],
    queryFn: () => crmApi.getLead(leadId),
    enabled: isAuthenticated && !!leadId,
  });

  const timelineQuery = useQuery({
    queryKey: ['crm_lead_activities', leadId],
    queryFn: () => crmApi.getLeadActivities(leadId),
    enabled: isAuthenticated && !!leadId,
  });


  return {
    lead: leadQuery.data,
    isLoadingLead: leadQuery.isLoading,
    isErrorLead: leadQuery.isError,
    activities: timelineQuery.data || [],
    isLoadingActivities: timelineQuery.isLoading,
    refetch: () => {
      leadQuery.refetch();
      timelineQuery.refetch();
    },
  };
}
