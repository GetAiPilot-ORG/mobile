export type TelegramToolKey =
  | 'autoforward'
  | 'sub_manager'
  | 'tracker'
  | 'report_bot'
  | 'broadcast'
  | 'auto_approve'
  | 'chatbot'
  | 'reactions';

export interface TelegramHubTool {
  key: TelegramToolKey;
  title: string;
  description: string;
  isCompleted: boolean;
  statusText: string;
  badge?: string;
  icon: string;
  stats?: Record<string, any>;
}

export interface TelegramHubStatus {
  totalModules: number;
  completedModules: number;
  tools: TelegramHubTool[];
}

export interface TelegramTrackerBot {
  id: string;
  bot_name: string;
  bot_username: string;
  status: string;
  channel_id?: string | null;
  channel_name?: string | null;
  channel_icon_url?: string | null;
  bot_icon_url?: string | null;
  created_at: string;
}

export interface TelegramSummary {
  botConnected: boolean;
  botUsername?: string;
  activeMembers: number;
  telesubSubscribers: number;
  telesubMonthlyRevenue: number;
  autoForwardRulesCount: number;
  autoApproveRequestsCount: number;
  autoReactionsActive: boolean;
  trackedBotsCount?: number;
  channelsCount?: number;
  deepLinksCount?: number;
  forwardsCount?: number;
  teleSubPagesCount?: number;
  revenue?: number;
  trackerBots?: TelegramTrackerBot[];
  hub?: TelegramHubStatus;
}

export interface ForwardRule {
  id: string;
  sourceChannel: string;
  targetChannel: string;
  keywordsFilter: string[];
  delaySeconds: number;
  addHeaderFooter: boolean;
  status: 'active' | 'paused';
}

export interface SubPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  durationDays: number;
  inviteLink: string;
  activeMembers: number;
}

export interface TelegramSessionStatus {
  connected: boolean;
  phone?: string;
  user_id?: number | string;
  first_name?: string;
  username?: string;
  is_active: boolean;
}

export interface TelegramChat {
  id: number | string;
  title: string;
  type: 'channel' | 'supergroup' | 'group' | 'chat';
  username?: string;
  member_count?: number;
  is_creator?: boolean;
  is_admin?: boolean;
  join_mode?: 'request' | 'auto';
  photo_url?: string;
}

export interface ForwardRuleDetails {
  id: string;
  name?: string;
  source_chat_id: number | string;
  source_chat_title: string;
  target_chat_id: number | string;
  target_chat_title: string;
  keywords_filter?: string[];
  blacklist_keywords?: string[];
  replace_header?: string;
  replace_footer?: string;
  delay_seconds: number;
  is_active: boolean;
  created_at: string;
}

export interface CreateForwardRulePayload {
  sourceChannel: string;
  targetChannel: string;
  sourceChannelId?: number | string;
  targetChannelId?: number | string;
  keywordsFilter?: string[];
  blacklistKeywords?: string[];
  addHeaderFooter?: boolean;
  replaceHeader?: string;
  replaceFooter?: string;
  delaySeconds?: number;
}

export interface ReactionAutopilotRule {
  id: string;
  user_id: string;
  channel_username: string;
  min_quantity: number;
  max_quantity: number;
  reactions: string[];
  type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  posts_limit?: number | null;
  posts_processed: number;
}

export interface ReactionOrder {
  id: string;
  user_id: string;
  link: string;
  quantity: number;
  reactions: string;
  smm_order_id?: string;
  status: string;
  charge: number;
  currency: string;
  created_at: string;
  start_count?: number;
  remains?: number;
  cost_charged?: number;
  refunded_amount?: number;
}

export interface ReactionsDashboardData {
  botUsername: string;
  rates: {
    views: number;
    votes: number;
    reactions: number;
    auto_views: number;
    members_30d?: number;
    members_90d?: number;
    members_365d?: number;
    auto_reactions?: number;
    members_indian?: number;
    [key: string]: any;
  };
  wallet: {
    balance: number;
    currency: string;
  };
  autopilotRules: ReactionAutopilotRule[];
  orders: ReactionOrder[];
  kpis: {
    active: number;
    totalEmojis: number;
    successRate: number;
    totalOrders: number;
  };
}

export interface ChatBotConfig {
  id: string;
  bot_id: string;
  bot_name: string;
  bot_username: string;
  bot_icon_url?: string | null;
  support_name: string;
  provider: string;
  api_key?: string;
  knowledge_base_name: string;
  knowledge_base_url?: string | null;
  business_info?: string;
  system_prompt?: string;
  status: 'active' | 'paused';
  chats_count: number;
  created_at: string;
  updated_at?: string;
}

export interface ChatBotSession {
  id: string;
  bot_id: string;
  telegram_user_id: number;
  user_name?: string;
  created_at: string;
  memory?: {
    language?: string;
    budget?: string;
    services_interested?: string[];
    lead_stage?: string;
    last_topic?: string;
  } | null;
}

export interface ChatBotMessage {
  id: string;
  bot_id: string;
  telegram_user_id: number;
  user_name?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  telegram_message_id?: number | null;
}

export interface ChatBotThreadData {
  messages: ChatBotMessage[];
  memory?: {
    language?: string;
    budget?: string;
    services_interested?: string[];
    lead_stage?: string;
    last_topic?: string;
    preferences?: any;
    important_facts?: any;
  } | null;
}

export interface TelegramBroadcastStatus {
  botName: string;
  botUsername: string;
  botUrl: string;
  telegramUserId: number;
  isConnected: boolean;
}

export interface TelegramAutoApproveStatus {
  botName: string;
  botUsername: string;
  botUrl: string;
  telegramUserId: number | string;
  isConnected: boolean;
}

export interface ReportBotBrandProfile {
  advisoryFirm: string;
  researchAnalyst: string;
  sebiRegistration: string;
  website: string;
  email?: string;
  officeAddress?: string;
  logoUrl?: string | null;
  page1Disclaimer: string;
  page2Disclosure?: string;
  page3Conflicts?: string;
  page4Policy?: string;
}

export interface ReportBotReportItem {
  id: string;
  title: string;
  callType: string;
  entry: string;
  target: string;
  stopLoss: string;
  createdAt: string;
  pdfUrl?: string;
}

export interface ReportBotDashboardData {
  botName: string;
  botUsername: string;
  botUrl: string;
  telegramUserId: number | string;
  dmConnected: boolean;
  channelsCount: number;
  reportsCount: number;
  brandProfile: ReportBotBrandProfile;
  channels: Array<{ id: string; name: string; is_active: boolean }>;
  reports: ReportBotReportItem[];
}





