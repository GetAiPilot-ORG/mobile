export type UserRole = 'Owner' | 'Admin' | 'Manager' | 'Agent';

export interface JWTPayload {
  session_id?: string;
  user_id: string;
  email: string;
  organization_id: string;
  role: UserRole;
  permissions: string[];
  subscription_tier?: string;
}

export interface TenantMapping {
  id: string;
  hub_org_id: string;
  whatsapp_org_id: string;
  voice_workspace_id: string;
  social_workspace_id: string;
  telegram_user_id: string;
  created_at: string;
  updated_at: string;
}

export type InboxChannel = 'whatsapp' | 'telegram' | 'instagram' | 'facebook';

export interface NormalizedConversation {
  id: string;
  organization_id: string;
  contact: {
    name: string;
    handle_or_phone: string;
    avatar_url?: string;
  };
  channel: InboxChannel;
  last_message: {
    content: string;
    created_at: string;
    direction: 'inbound' | 'outbound';
  };
  unread_count: number;
  assigned_to?: string;
  status: 'active' | 'resolved' | 'pending';
}

export type Conversation = NormalizedConversation;

export interface NormalizedMessage {
  id: string;
  conversation_id: string;
  channel: InboxChannel;
  direction: 'inbound' | 'outbound';
  content: string;
  media: Array<{
    url: string;
    type: 'image' | 'audio' | 'video' | 'document';
  }>;
  sender: {
    name: string;
    type: 'contact' | 'agent' | 'bot' | 'system';
  };
  created_at: string;
}

export type Message = NormalizedMessage;

export interface SendMessagePayload {
  conversation_id: string;
  message: string;
  attachments?: Array<{
    url: string;
    type: 'image' | 'audio' | 'video' | 'document';
  }>;
}

// ── Normalized CRM Models ───────────────────────────────────────────────────

export interface Lead {
  id: string;
  organization_id: string;
  contact_id?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  avatar_url?: string | null;
  pipeline_id: string;
  stage_id: string;
  stage_name: string;
  owner?: {
    id: string;
    name: string;
  } | null;
  value?: number | null;
  currency?: string | null;
  source?: string | null;
  status: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export type CRMLead = Lead;

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  lead_count: number;
  total_value: number;
}

export interface Pipeline {
  id: string;
  name: string;
  stages: PipelineStage[];
}

export interface CRMActivity {
  id: string;
  lead_id: string;
  type: 'message' | 'call' | 'note' | 'stage_change' | 'assignment' | 'form_submission';
  title: string;
  description?: string;
  product?: string;
  created_at: string;
}

export interface VoiceCallLog {
  id: string;
  agentId: string;
  agentName: string;
  customerPhone: string;
  direction: 'inbound' | 'outbound';
  durationSeconds: number;
  status: 'completed' | 'in_progress' | 'failed' | 'busy' | 'no_answer';
  transcriptSnippet?: string;
  audioRecordingUrl?: string;
  timestamp: string;
}

export interface SocialPost {
  id: string;
  platforms: Array<'instagram' | 'facebook' | 'linkedin' | 'youtube'>;
  caption: string;
  mediaUrls: string[];
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledFor: string;
  publishedAt?: string;
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
}

// ==========================================
// WhatsApp Normalized Models
// ==========================================

export interface WhatsAppConnection {
  connected: boolean;
  status: 'connected' | 'disconnected' | 'degraded' | string;
  phone_number?: string;
  display_name?: string;
  quality_rating?: 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN' | string;
  messaging_limit?: string;
  business_account_id?: string;
  phone_number_id?: string;
}

export interface WhatsAppAccount {
  id: string;
  organization_id: string;
  phone_number_id: string;
  whatsapp_business_account_id?: string | null;
  display_phone_number: string;
  name: string;
  status: string;
  quality_rating: string;
  messaging_limit: string;
}

export interface WhatsAppContact {
  id: string;
  organization_id: string;
  name?: string;
  phone: string;
  avatar_url?: string | null;
  tags?: string[];
  crm_lead_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  language: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION' | string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'PAUSED' | string;
  components: any[];
  quality_score?: string;
  rejection_reason?: string | null;
  updated_at: string;
}

export interface WhatsAppBroadcast {
  id: string;
  organization_id: string;
  name: string;
  status: 'preparing' | 'queued' | 'processing' | 'completed' | 'cancelled' | 'failed' | 'scheduled' | string;
  template_name: string;
  template_language: string;
  audience_tag?: string | null;
  audience_type: string;
  recipients_count: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  estimated_cost_paise?: number;
  actual_cost_paise?: number;
  created_at: string;
  scheduled_at?: string | null;
}

export interface WhatsAppUsage {
  credits_balance: number; // in INR (₹)
  credits_balance_paise: number;
  currency: string;
  messages_sent: number;
  messages_delivered: number;
  messages_failed: number;
  period_start: string;
  period_end: string;
}

export interface CreateBroadcastPayload {
  name: string;
  template_name: string;
  template_language?: string;
  audience_tag?: string;
  audience_type?: 'all' | 'tag' | 'csv';
  wa_account_id?: string;
  variable_mapping?: Record<string, any>;
  scheduled_at?: string;
  idempotency_key?: string;
}

export interface PaginatedContactsResponse {
  contacts: WhatsAppContact[];
  total_count: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface PaginatedBroadcastsResponse {
  broadcasts: WhatsAppBroadcast[];
  total_count: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

