import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/store/authStore';
import { whatsappApi } from '../api/whatsapp.api';
import { WhatsAppAccount } from '../types';

export const useWhatsAppAccounts = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<WhatsAppAccount[]>({
    queryKey: ['whatsapp_accounts'],
    queryFn: () => whatsappApi.getAccounts(),
    enabled: isAuthenticated,
    staleTime: 1000 * 30, // 30s
  });
};
