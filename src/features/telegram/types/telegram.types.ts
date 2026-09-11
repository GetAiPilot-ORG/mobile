export type TelegramSection = 'dashboard' | 'setup' | 'monetization' | 'channels' | 'tools';

export type TelegramToolType =
  | 'autoforward'
  | 'tracker'
  | 'report_bot'
  | 'broadcast'
  | 'auto_approve'
  | 'chatbot'
  | 'reactions';

export interface TelegramStatusResponse {
  connected: boolean;
  phone: string | null;
  status: 'connected' | 'reconnecting' | 'not_connected';
  account?: {
    id: string;
    phone: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  } | null;
  telegramUserId?: number | null;
}

export interface TelegramDashboardData {
  connected: boolean;
  phone: string | null;
  telegramUserId: number | null;
  metrics: {
    totalChannels: number;
    activeBots: number;
    activeForwards: number;
    totalLandingPages: number;
    activeSubscribers: number;
    activeChatbots: number;
  };
  trackerBots: Array<{
    id: string;
    bot_name: string;
    bot_username: string;
    is_active: boolean;
  }>;
  landingPages: Array<{
    id: string;
    title: string;
    slug: string;
    is_published: boolean;
    price: number;
  }>;
  chatbots: Array<{
    id: string;
    bot_name: string;
    provider: string;
    is_active: boolean;
  }>;
  brandSettings?: {
    analyst_name?: string;
    registration_no?: string;
    website?: string;
    office_address?: string;
    is_monitored?: boolean;
  } | null;
}

export interface SetupModule {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  missingRequirements: string[];
  setupRoute: string;
}

export interface SetupHubData {
  completed: number;
  total: number;
  progressPercentage: number;
  modules: SetupModule[];
}

export interface AutoforwardOverview {
  activeMappings: number;
  textFilters: number;
  blockedWords: number;
  delay: number;
  textAddons: {
    start_text: string;
    end_text: string;
  };
  mappings: Array<{
    id: string | number;
    source_channel_id: string;
    destination_channel_id: string;
    is_active: boolean;
  }>;
  filters: Array<{
    id: string | number;
    search_text: string;
    replace_text: string;
  }>;
  blacklist: Array<{
    id: string | number;
    word: string;
  }>;
}

export interface SubManagerOverview {
  totalRevenue: number;
  activeSubscribers: number;
  totalPages: number;
  botAutomatedAccess: boolean;
  readiness: {
    telegramOwnerLinked: boolean;
    channelBotAdmin: boolean;
    payoutKycCompleted: boolean;
    subscriptionPagePublished: boolean;
  };
  pages: Array<{
    id: string;
    title: string;
    slug: string;
    price: number;
    currency: string;
    duration_days: number;
    is_published: boolean;
  }>;
  subscribersCount: number;
}

export interface TrackerOverview {
  connectedBotsCount: number;
  totalLinksCount: number;
  totalJoins: number;
  activeJoins: number;
  bots: Array<{
    id: string;
    bot_name: string;
    bot_username: string;
    is_active: boolean;
  }>;
  links: Array<{
    id: string;
    link_name: string;
    channel_id: string;
    campaign_name: string;
    public_url: string;
    link_slug: string;
    created_at: string;
  }>;
}

export interface ReportBotConfig {
  brand: {
    analyst_name: string;
    registration_no: string;
    website: string;
    office_address: string;
    logo_url?: string;
    is_monitored: boolean;
  };
  recentReports: Array<{
    id: string;
    symbol?: string;
    action?: string;
    entry_price?: number;
    target_price?: number;
    stop_loss?: number;
    pdf_url?: string;
    created_at: string;
  }>;
}

export interface BroadcastTask {
  id: string;
  message: string;
  target_audience: string;
  scheduled_at: string;
  status: 'queued' | 'processing' | 'sent' | 'failed';
  created_at: string;
}

export interface ChatbotConfig {
  id: string;
  bot_name: string;
  provider: string;
  system_prompt: string;
  welcome_message: string;
  is_active: boolean;
  hasApiKey?: boolean;
}

export interface ReactionsOverview {
  walletBalance: number;
  orders: Array<{
    id: string;
    post_link: string;
    reactions: string[];
    quantity: number;
    status: string;
    created_at: string;
  }>;
}
