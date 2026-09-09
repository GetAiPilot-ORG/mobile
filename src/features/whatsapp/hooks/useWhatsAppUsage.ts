import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/store/authStore';
import { whatsappApi } from '../api/whatsapp.api';
import { WhatsAppUsage } from '../types';

export const useWhatsAppUsage = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<WhatsAppUsage>({
    queryKey: ['whatsapp_usage'],
    queryFn: () => whatsappApi.getUsage(),
    enabled: isAuthenticated,
    staleTime: 1000 * 30,
  });
};

