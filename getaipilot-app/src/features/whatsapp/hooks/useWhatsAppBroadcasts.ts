import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/store/authStore';
import { BroadcastFilterParams, whatsappApi } from '../api/whatsapp.api';
import { PaginatedBroadcastsResponse } from '../types';

export const useWhatsAppBroadcasts = (params?: BroadcastFilterParams) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<PaginatedBroadcastsResponse>({
    queryKey: ['whatsapp_broadcasts', params],
    queryFn: () => whatsappApi.getBroadcasts(params),
    enabled: isAuthenticated,
    staleTime: 1000 * 15,
  });
};

