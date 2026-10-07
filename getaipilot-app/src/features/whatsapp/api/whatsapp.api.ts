import { apiClient } from '../../../core/api/client';
import {
  CreateBroadcastPayload,
  PaginatedBroadcastsResponse,
  PaginatedContactsResponse,
  WhatsAppAccount,
  WhatsAppBroadcast,
  WhatsAppConnection,
  WhatsAppContact,
  WhatsAppTemplate,
  WhatsAppUsage,
} from '../types';

export interface ContactFilterParams {
  [key: string]: string | number | boolean | undefined;
  search?: string;
  tag?: string;
  page?: number;
  limit?: number;
}

export interface BroadcastFilterParams {
  [key: string]: string | number | boolean | undefined;
  status?: string;
  page?: number;
  limit?: number;
}

export const whatsappApi = {
  getStatus: async (): Promise<WhatsAppConnection> => {
    return await apiClient.get<WhatsAppConnection>('/mobile/v1/whatsapp/status');
  },

  getAccounts: async (): Promise<WhatsAppAccount[]> => {
    return await apiClient.get<WhatsAppAccount[]>('/mobile/v1/whatsapp/accounts');
  },

  getContacts: async (params?: ContactFilterParams): Promise<PaginatedContactsResponse> => {
    return await apiClient.get<PaginatedContactsResponse>('/mobile/v1/whatsapp/contacts', {
      params,
    });
  },

  getContact: async (id: string): Promise<WhatsAppContact> => {
    return await apiClient.get<WhatsAppContact>(`/mobile/v1/whatsapp/contacts/${id}`);
  },

  getTemplates: async (status?: string): Promise<WhatsAppTemplate[]> => {
    return await apiClient.get<WhatsAppTemplate[]>('/mobile/v1/whatsapp/templates', {
      params: { status },
    });
  },

  getBroadcasts: async (params?: BroadcastFilterParams): Promise<PaginatedBroadcastsResponse> => {
    return await apiClient.get<PaginatedBroadcastsResponse>('/mobile/v1/whatsapp/broadcasts', {
      params,
    });
  },

  getBroadcast: async (id: string): Promise<WhatsAppBroadcast> => {
    return await apiClient.get<WhatsAppBroadcast>(`/mobile/v1/whatsapp/broadcasts/${id}`);
  },

  createBroadcast: async (
    payload: CreateBroadcastPayload,
    idempotencyKey?: string
  ): Promise<{ broadcast: WhatsAppBroadcast; is_replay?: boolean }> => {
    return await apiClient.post<{ broadcast: WhatsAppBroadcast; is_replay?: boolean }>(
      '/mobile/v1/whatsapp/broadcasts',
      payload,
      {
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
      }
    );
  },

  getUsage: async (): Promise<WhatsAppUsage> => {
    return await apiClient.get<WhatsAppUsage>('/mobile/v1/whatsapp/usage');
  },
};
