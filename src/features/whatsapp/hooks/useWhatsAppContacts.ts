import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/store/authStore';
import { ContactFilterParams, whatsappApi } from '../api/whatsapp.api';
import { PaginatedContactsResponse } from '../types';

export const useWhatsAppContacts = (params?: ContactFilterParams) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<PaginatedContactsResponse>({
    queryKey: ['whatsapp_contacts', params],
    queryFn: () => whatsappApi.getContacts(params),
    enabled: isAuthenticated,
    staleTime: 1000 * 30,
  });
};

