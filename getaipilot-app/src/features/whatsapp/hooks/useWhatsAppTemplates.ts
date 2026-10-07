import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/store/authStore';
import { whatsappApi } from '../api/whatsapp.api';
import { WhatsAppTemplate } from '../types';

export const useWhatsAppTemplates = (statusFilter?: string) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<WhatsAppTemplate[]>({
    queryKey: ['whatsapp_templates', statusFilter],
    queryFn: () => whatsappApi.getTemplates(statusFilter),
    enabled: isAuthenticated,
    staleTime: 1000 * 60, // 1 min
  });
};

