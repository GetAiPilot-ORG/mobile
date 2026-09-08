import { apiClient } from '../../../core/api/client';
import { NormalizedConversation, NormalizedMessage, SendMessagePayload } from '../types';

export const inboxApi = {
  getConversations: async (
    channel?: string,
    status?: string,
    search?: string
  ): Promise<NormalizedConversation[]> => {
    return await apiClient.get<NormalizedConversation[]>('/mobile/v1/conversations', {
      params: {
        channel: channel || 'all',
        status: status || 'all',
        search: search || undefined,
      },
    });
  },

  getConversationDetails: async (
    id: string
  ): Promise<{ conversation: NormalizedConversation | null; messages: NormalizedMessage[] }> => {
    return await apiClient.get<{
      conversation: NormalizedConversation | null;
      messages: NormalizedMessage[];
    }>(`/mobile/v1/conversations/${id}`);
  },

  sendMessage: async (payload: SendMessagePayload): Promise<NormalizedMessage> => {
    return await apiClient.post<NormalizedMessage>('/mobile/v1/messages', payload);
  },
};
