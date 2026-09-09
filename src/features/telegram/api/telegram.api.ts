import { apiClient } from '../../../core/api/client';
import {
  TelegramStatusResponse,
  TelegramDashboardData,
  SetupHubData,
  AutoforwardOverview,
  SubManagerOverview,
  TrackerOverview,
  ReportBotConfig,
  BroadcastTask,
  ChatbotConfig,
  ReactionsOverview,
} from '../types/telegram.types';

export const TelegramApi = {
  // 1. Status & Lifecycle
  getStatus: async (): Promise<TelegramStatusResponse> => {
    return apiClient.get('/mobile/v1/telegram/account/status');
  },

  startLogin: async (phone: string): Promise<any> => {
    return apiClient.post('/mobile/v1/telegram/login/start', { phone });
  },

  verifyOtp: async (otp: string): Promise<any> => {
    return apiClient.post('/mobile/v1/telegram/login/otp', { otp });
  },

  verifyPassword: async (password: string, phone?: string): Promise<any> => {
    return apiClient.post('/mobile/v1/telegram/login/password', { password, phone });
  },

  logout: async (): Promise<any> => {
    return apiClient.post('/mobile/v1/telegram/logout');
  },

  getChats: async (): Promise<any[]> => {
    return apiClient.get('/mobile/v1/telegram/chats');
  },

  syncChats: async (): Promise<any> => {
    return apiClient.post('/mobile/v1/telegram/sync/chats');
  },

  // 2. Dashboard & Setup Hub
  getDashboard: async (): Promise<TelegramDashboardData> => {
    return apiClient.get('/mobile/v1/telegram/dashboard');
  },

  getSetupHub: async (): Promise<SetupHubData> => {
    return apiClient.get('/mobile/v1/telegram/setup-hub');
  },

  // 3. GAP Autoforwarding
  getAutoforwardOverview: async (): Promise<AutoforwardOverview> => {
    return apiClient.get('/mobile/v1/telegram/autoforward/overview');
  },

  getForwardMappings: async (): Promise<any[]> => {
    return apiClient.get('/mobile/v1/telegram/autoforward/mappings');
  },

  createForwardMapping: async (data: { source_channel_id: string; destination_channel_id: string; is_active?: boolean }): Promise<any> => {
    return apiClient.post('/mobile/v1/telegram/autoforward/mappings', data);
  },

  updateForwardMapping: async (id: string | number, data: Partial<{ is_active: boolean }>): Promise<any> => {
    return apiClient.patch(`/mobile/v1/telegram/autoforward/mappings/${id}`, data);
  },

  deleteForwardMapping: async (id: string | number): Promise<any> => {
    return apiClient.delete(`/mobile/v1/telegram/autoforward/mappings/${id}`);
  },

  createFilter: async (data: { search_text: string; replace_text: string }): Promise<any> => {
    return apiClient.post('/mobile/v1/telegram/autoforward/filters', data);
  },

  deleteFilter: async (id: string | number): Promise<any> => {
    return apiClient.delete(`/mobile/v1/telegram/autoforward/filters/${id}`);
  },

  createBlockedWord: async (word: string): Promise<any> => {
    return apiClient.post('/mobile/v1/telegram/autoforward/blocked-words', { word });
  },

  deleteBlockedWord: async (id: string | number): Promise<any> => {
    return apiClient.delete(`/mobile/v1/telegram/autoforward/blocked-words/${id}`);
  },

  updateAutoforwardSettings: async (settings: { delay?: number }): Promise<any> => {
    return apiClient.patch('/mobile/v1/telegram/autoforward/settings', settings);
  },

  updateTextAddons: async (addons: { start_text?: string; end_text?: string }): Promise<any> => {
    return apiClient.patch('/mobile/v1/telegram/autoforward/text-addons', addons);
  },

  // 4. GAP Sub Manager
  getSubManagerOverview: async (): Promise<SubManagerOverview> => {
    return apiClient.get('/mobile/v1/telegram/sub-manager/overview');
  },

  getLandingPages: async (): Promise<any[]> => {
    return apiClient.get('/mobile/v1/telegram/sub-manager/pages');
  },

  createLandingPage: async (data: any): Promise<any> => {
    return apiClient.post('/mobile/v1/telegram/sub-manager/pages', data);
  },

  updateLandingPage: async (id: string, data: any): Promise<any> => {
    return apiClient.patch(`/mobile/v1/telegram/sub-manager/pages/${id}`, data);
  },

  getSubscribers: async (): Promise<any[]> => {
    return apiClient.get('/mobile/v1/telegram/sub-manager/subscribers');
  },

  getPayoutStatus: async (): Promise<any> => {
    return apiClient.get('/mobile/v1/telegram/sub-manager/payout-status');
  },

  // 5. GAP Tracker
  getTrackerOverview: async (): Promise<TrackerOverview> => {
    return apiClient.get('/mobile/v1/telegram/tracker/overview');
  },

  saveTrackerBot: async (bot_token: string): Promise<any> => {
    return apiClient.post('/mobile/v1/telegram/tracker/bots', { bot_token });
  },

  getJoinLinks: async (): Promise<any[]> => {
    return apiClient.get('/mobile/v1/telegram/tracker/links');
  },

  createJoinLink: async (data: { link_name: string; channel_id: string; campaign_name?: string }): Promise<any> => {
    return apiClient.post('/mobile/v1/telegram/tracker/links', data);
  },

  deleteJoinLink: async (id: string): Promise<any> => {
    return apiClient.delete(`/mobile/v1/telegram/tracker/links/${id}`);
  },

  // 6. GAP Report Bot
  getReportBotConfig: async (): Promise<ReportBotConfig> => {
    return apiClient.get('/mobile/v1/telegram/report-bot/config');
  },

  updateReportBotConfig: async (data: any): Promise<any> => {
    return apiClient.patch('/mobile/v1/telegram/report-bot/config', data);
  },

  // 7. Broadcast Msg
  getBroadcasts: async (): Promise<BroadcastTask[]> => {
    return apiClient.get('/mobile/v1/telegram/broadcasts');
  },

  createBroadcast: async (data: { message: string; target_audience?: string; scheduled_at?: string }): Promise<any> => {
    return apiClient.post('/mobile/v1/telegram/broadcasts', data);
  },

  // 8. GAP Auto Approve
  getAutoApproveStatus: async (): Promise<any> => {
    return apiClient.get('/mobile/v1/telegram/auto-approve');
  },

  // 9. Chat Bot Automation
  getChatbotConfigs: async (): Promise<ChatbotConfig[]> => {
    return apiClient.get('/mobile/v1/telegram/chatbot/configs');
  },

  createChatbotConfig: async (data: any): Promise<any> => {
    return apiClient.post('/mobile/v1/telegram/chatbot/configs', data);
  },

  updateChatbotConfig: async (id: string, data: any): Promise<any> => {
    return apiClient.patch(`/mobile/v1/telegram/chatbot/configs/${id}`, data);
  },

  // 10. GAP Reactions
  getReactionsOverview: async (): Promise<ReactionsOverview> => {
    return apiClient.get('/mobile/v1/telegram/reactions/overview');
  },

  createReactionOrder: async (data: { post_link: string; reactions: string[]; quantity: number }): Promise<any> => {
    return apiClient.post('/mobile/v1/telegram/reactions/orders', data);
  },
};
