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
