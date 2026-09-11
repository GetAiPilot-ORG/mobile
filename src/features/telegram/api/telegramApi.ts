import { apiClient } from '../../../core/api/client';
import {
  TelegramSummary,
  TelegramHubStatus,
  TelegramSessionStatus,
  TelegramChat,
  TelegramTrackerBot,
  ForwardRuleDetails,
  CreateForwardRulePayload,
} from '../types';

export const telegramApi = {
  getSummary: () => apiClient.get<TelegramSummary>('/mobile/v1/telegram/summary'),
  getHub: () => apiClient.get<TelegramHubStatus>('/mobile/v1/telegram/hub'),
  getTrackerBots: () => apiClient.get<TelegramTrackerBot[]>('/mobile/v1/telegram/tracker/bots'),

  // Session Management
  getSessionStatus: () => apiClient.get<TelegramSessionStatus>('/mobile/v1/telegram/status'),
  startLogin: (phone: string) =>
    apiClient.post<{ success: boolean; message: string; phone_code_hash?: string }>('/mobile/v1/telegram/login/start', { phone }),
  verifyOtp: (payload: { phone: string; otp: string; phone_code_hash?: string }) =>
    apiClient.post<{ success: boolean; message: string; requires_password?: boolean }>('/mobile/v1/telegram/login/otp', payload),
  submitPassword: (password: string) =>
    apiClient.post<{ success: boolean; message: string }>('/mobile/v1/telegram/login/password', { password }),

  // Channels & Chats
  getChats: () => apiClient.get<TelegramChat[]>('/mobile/v1/telegram/chats'),
  syncChats: () =>
    apiClient.post<{ success: boolean; synced_count: number; message: string }>('/mobile/v1/telegram/sync/chats', {}),

  // Autoforwarding
  getForwardRules: () => apiClient.get<ForwardRuleDetails[]>('/mobile/v1/telegram/autoforward/rules'),
  createForwardRule: (payload: CreateForwardRulePayload) =>
    apiClient.post<ForwardRuleDetails>('/mobile/v1/telegram/autoforward/rules', payload),

  // Other Tools
  getBroadcastStatus: () =>
    apiClient.get<import('../types').TelegramBroadcastStatus>('/mobile/v1/telegram/broadcast/status'),

  sendBroadcast: (payload: {
    title: string;
    content: string;
    channels: string[];
    buttonText?: string;
    buttonUrl?: string;
  }) => apiClient.post('/mobile/v1/telegram/broadcast', payload),


  createSubPlan: (payload: {
    tierName: string;
    price: number;
    currency: string;
    durationDays: number;
    channelId: string;
  }) => apiClient.post('/mobile/v1/telegram/sub-manager/plans', payload),

  getSubPlans: () =>
    apiClient.get<Array<{
      id: string;
      name: string;
      price: number;
      currency: string;
      durationDays: number;
      inviteLink?: string;
      landingPageTitle?: string;
      activeMembers?: number;
      created_at?: string;
    }>>('/mobile/v1/telegram/sub-manager/plans'),

  getAutoApproveStatus: () =>
    apiClient.get<import('../types').TelegramAutoApproveStatus>('/mobile/v1/telegram/auto-approve/status'),

  getReportBotDashboard: () =>
    apiClient.get<import('../types').ReportBotDashboardData>('/mobile/v1/telegram/report-bot/dashboard'),

  saveReportBotSettings: (payload: Partial<import('../types').ReportBotBrandProfile>) =>
    apiClient.post<{ success: boolean; settings: any }>('/mobile/v1/telegram/report-bot/settings', payload),

  toggleAutoApprove: (payload: { enabled: boolean; channelId: string }) =>
    apiClient.post('/mobile/v1/telegram/auto-approve', payload),

  updateReactions: (payload: { emojis: string[]; speed: string }) =>
    apiClient.post('/mobile/v1/telegram/reactions', payload),

  getReactionsDashboard: () =>
    apiClient.get<import('../types').ReactionsDashboardData>('/mobile/v1/telegram/reactions/dashboard'),

  toggleAutopilotRule: (payload: { ruleId: string; isActive: boolean }) =>
    apiClient.post<{ success: boolean; rule: import('../types').ReactionAutopilotRule }>('/mobile/v1/telegram/reactions/autopilot/toggle', payload),

  createAutopilotRule: (payload: {
    channelUsername: string;
    minQuantity: number;
    maxQuantity: number;
    reactions: string[];
    postsLimit?: number | null;
  }) => apiClient.post<{ success: boolean; rule: import('../types').ReactionAutopilotRule }>('/mobile/v1/telegram/reactions/autopilot/create', payload),

  deleteAutopilotRule: (ruleId: string) =>
    apiClient.delete<{ success: boolean; deletedId: string }>(`/mobile/v1/telegram/reactions/autopilot/${ruleId}`),

  createReactionOrder: (payload: {
    link: string;
    quantity: number;
    reactions: string[];
    campaignType?: string;
  }) => apiClient.post<{ success: boolean; order: import('../types').ReactionOrder }>('/mobile/v1/telegram/reactions/order', payload),

  getChatbots: () =>
    apiClient.get<import('../types').ChatBotConfig[]>('/mobile/v1/telegram/chatbots'),

  connectChatbot: (payload: {
    botToken: string;
    botName?: string;
    botUsername?: string;
    supportName: string;
    provider?: string;
    apiKey: string;
    knowledgeBaseName?: string;
    businessInfo?: string;
  }) => apiClient.post<{ success: boolean; bot: any; config: import('../types').ChatBotConfig }>('/mobile/v1/telegram/chatbots/connect', payload),

  toggleChatbotStatus: (payload: { configId: string; status: 'active' | 'paused' }) =>
    apiClient.post<{ success: boolean; chatbot: import('../types').ChatBotConfig }>('/mobile/v1/telegram/chatbots/toggle', payload),

  resetChatbotHistory: (payload: { botId: string }) =>
    apiClient.post<{ success: boolean; message: string }>('/mobile/v1/telegram/chatbots/reset-history', payload),

  getChatbotSessions: (botId: string) =>
    apiClient.get<import('../types').ChatBotSession[]>(`/mobile/v1/telegram/chatbots/${botId}/sessions`),

  getChatbotUserMessages: (botId: string, telegramUserId: number) =>
    apiClient.get<import('../types').ChatBotThreadData>(`/mobile/v1/telegram/chatbots/${botId}/sessions/${telegramUserId}/messages`),

  updateChatbot: (id: string, payload: {
    supportName?: string;
    provider?: string;
    apiKey?: string;
    knowledgeBaseName?: string;
    businessInfo?: string;
  }) => apiClient.put<{ success: boolean; chatbot: import('../types').ChatBotConfig }>(`/mobile/v1/telegram/chatbots/${id}`, payload),

  deleteChatbot: (id: string) =>
    apiClient.delete<{ success: boolean; deletedId: string }>(`/mobile/v1/telegram/chatbots/${id}`),
};




