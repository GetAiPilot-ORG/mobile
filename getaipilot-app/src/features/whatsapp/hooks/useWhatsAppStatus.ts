import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/store/authStore';
import { whatsappApi } from '../api/whatsapp.api';
import { WhatsAppConnection } from '../types';

export const useWhatsAppStatus = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<WhatsAppConnection>({
    queryKey: ['whatsapp_status'],
    queryFn: () => whatsappApi.getStatus(),
    enabled: isAuthenticated,
    staleTime: 1000 * 30, // 30s
  });
};

