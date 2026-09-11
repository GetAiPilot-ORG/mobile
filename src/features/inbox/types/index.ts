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
  assigned_agent_name?: string;
  assigned_agent_id?: string;
  bot_enabled?: boolean;
  bot_paused?: boolean;
  latest_customer_message_at?: string;
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
  sender_user_id?: string;
  sender_type?: string;
  is_internal_note?: boolean;
  is_bot_reply?: boolean;
  status?: 'sent' | 'delivered' | 'read' | 'failed' | 'pending';
  template?: {
    name?: string;
    header?: { type?: string; text?: string; media_url?: string };
    body?: string;
    footer?: string;
    buttons?: Array<{ text: string; type?: string; url?: string; phone_number?: string }>;
  };
  created_at: string;
}

export type Message = NormalizedMessage;

export interface SendMessagePayload {
  conversation_id: string;
  message: string;
  is_internal_note?: boolean;
  attachments?: Array<{
    url: string;
    type: 'image' | 'audio' | 'video' | 'document';
  }>;
  template?: any;
}

export interface TeamMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: string;
  name: string;
  email: string;
  is_active: boolean;
  is_online?: boolean;
  avatar_color?: string;
}

export interface TemplateButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
  text: string;
  url?: string;
  phone_number?: string;
}

export interface MetaTemplate {
  name: string;
  label: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  header?: string;
  body: string;
  footer?: string;
  buttons?: TemplateButton[];
}

export interface ContactItem {
  id: string;
  name?: string;
  custom_name?: string;
  phone: string;
  wa_id?: string;
  tags?: string[];
  custom_fields?: Record<string, any>;
}
