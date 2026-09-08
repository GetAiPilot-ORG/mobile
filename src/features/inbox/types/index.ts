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
