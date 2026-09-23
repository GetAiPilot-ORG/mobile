import { apiClient } from '../../../core/api/client';

export interface DedicatedNumber {
  id: string;
  phone_number: string;
  status: 'active' | 'inactive' | 'pending' | 'available';
  provider?: string;
  kyc_status?: 'verified' | 'pending' | 'rejected' | 'not_submitted';
  assistants?: { id: string; name: string };
  monthly_price?: number;
  assigned_at?: string;
}

export interface KycStatusResponse {
  id?: string;
  status: 'verified' | 'pending' | 'rejected' | 'not_submitted';
  businessName?: string;
  documentType?: string;
  idNumber?: string;
  verifiedAt?: string;
  assignedNumber?: string;
  rejectionReason?: string;
}

export interface VoiceAnalytics {
  totalCalls: number;
  completedCalls: number;
  failedCalls: number;
  totalDurationDisplay: string;
  totalDurationSeconds: number;
  creditsUsed: string;
  campaignCalls: number;
}

export interface BillingTransactions {
  payments: Array<{
    id: string;
    type: 'number_purchase' | 'subscription' | 'credit_topup';
    title: string;
    amount: number;
    currency: string;
    status: 'paid' | 'pending' | 'failed';
    date: string;
    invoice_id?: string;
  }>;
  creditLedger: Array<{
    id: string;
    type: 'usage' | 'topup';
    description: string;
    credits: number;
    date: string;
  }>;
  subscription?: {
    plan: string;
    priceMonthly: number;
    status: string;
    renewalDate: string;
    dedicatedNumberClaimed: boolean;
  };
}

export interface VoiceCall {
  id: string;
  assistant?: string;
  assistantId?: string;
  customerNumber: string;
  callerName?: string;
  assignedNumber?: string;
  duration?: string;
  durationSeconds?: number;
  status: 'completed' | 'in_progress' | 'failed' | 'cancelled' | 'ringing';
  direction?: 'inbound' | 'outbound';
  cost?: string;
  time?: string;
  createdAt?: string;
  recordingUrl?: string;
  summary?: string;
  transcript?: string;
  notes?: string;
  campaign?: string;
  campaignId?: string;
}

export interface VoiceCampaign {
  id: string;
  name: string;
  category?: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'failed';
  assistant_id?: string;
  assistant_name?: string;
  phone_number_id?: string;
  phone_number?: string;
  total_contacts: number;
  pending_contacts?: number;
  completed_contacts?: number;
  failed_contacts?: number;
  retry_count?: number;
  progress?: number;
  created_at?: string;
  updated_at?: string;
  recent_calls?: VoiceCall[];
}

export interface VoiceContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  notes?: string;
  campaigns_count?: number;
  calls_count?: number;
  last_called_at?: string;
  created_at?: string;
  campaign_history?: Array<{
    id: string;
    name: string;
    date: string;
    status: string;
    duration: string;
  }>;
  call_history?: Array<{
    id: string;
    time: string;
    duration: string;
    status: string;
    assistant: string;
    recording_url?: string;
  }>;
}

export interface VoiceAssistant {
  id: string;
  name: string;
  provider?: string;
  status?: string;
  config_snapshot?: {
    prompt?: string;
    system_prompt?: string;
    voice_id?: string;
    language?: string;
  };
}

export const voiceApi = {
  // Overview & Analytics
  getOverview: async () => {
    return apiClient.get<any>('/mobile/v1/voice/overview');
  },

  getAnalytics: async (): Promise<VoiceAnalytics> => {
    return apiClient.get<VoiceAnalytics>('/mobile/v1/voice/analytics');
  },

  getBillingTransactions: async (): Promise<BillingTransactions> => {
    return apiClient.get<BillingTransactions>('/mobile/v1/voice/billing/transactions');
  },

  // Dedicated Numbers & KYC
  getNumbers: async (): Promise<DedicatedNumber[]> => {
    const res = await apiClient.get<any>('/mobile/v1/voice/numbers');
    return Array.isArray(res) ? res : res.phone_numbers || res.data || [];
  },

  getAvailableNumbers: async () => {
    const res = await apiClient.get<any>('/mobile/v1/voice/numbers/available');
    return Array.isArray(res) ? res : res.available_numbers || res.data || [];
  },

  claimDedicatedNumber: async (payload: { phoneNumber: string; price?: number }) => {
    return apiClient.post('/mobile/v1/voice/numbers/claim', payload);
  },

  assignPhoneNumber: async (payload: { numberId: string; assistantId: string }) => {
    return apiClient.put('/mobile/v1/voice/numbers/assign', payload);
  },

  getKycStatus: async (): Promise<KycStatusResponse> => {
    return apiClient.get<KycStatusResponse>('/mobile/v1/voice/kyc');
  },

  submitKycRequest: async (payload: { businessName: string; documentType: string; idNumber: string; comments?: string }) => {
    return apiClient.post('/mobile/v1/voice/kyc/request', payload);
  },

  // Calls
  getCalls: async (params?: { limit?: number; status?: string; assistantId?: string }): Promise<VoiceCall[]> => {
    const query = params ? `?limit=${params.limit || 50}${params.status ? `&status=${params.status}` : ''}${params.assistantId ? `&assistantId=${params.assistantId}` : ''}` : '';
    const res = await apiClient.get<any>(`/mobile/v1/voice/calls${query}`);
    return Array.isArray(res) ? res : res.calls || res.data || [];
  },

  getCallDetails: async (callId: string): Promise<VoiceCall> => {
    const res = await apiClient.get<any>(`/mobile/v1/voice/calls/${callId}`);
    return res.call || res.data || res;
  },

  getCallTranscript: async (callId: string) => {
    return apiClient.get<any>(`/mobile/v1/voice/calls/${callId}/transcript`);
  },

  getCallRecording: async (callId: string) => {
    return apiClient.get<any>(`/mobile/v1/voice/calls/${callId}/recording`);
  },

  triggerOutboundCall: async (payload: {
    customerNumber: string;
    customerName?: string;
    assistantId?: string;
    assignedNumber?: string;
    customerCountryCode?: string;
    additionalData?: Record<string, any>;
  }) => {
    return apiClient.post('/mobile/v1/voice/calls', payload);
  },

  // Assistants
  getAssistants: async (): Promise<VoiceAssistant[]> => {
    const res = await apiClient.get<any>('/mobile/v1/voice/agents');
    return Array.isArray(res) ? res : res.assistants || res.data || [];
  },

  // Campaigns
  getCampaigns: async (): Promise<VoiceCampaign[]> => {
    const res = await apiClient.get<any>('/mobile/v1/voice/campaigns');
    return Array.isArray(res) ? res : res.campaigns || res.data || [];
  },

  getCampaignDetails: async (campaignId: string): Promise<VoiceCampaign> => {
    const res = await apiClient.get<any>(`/mobile/v1/voice/campaigns/${campaignId}`);
    return res.campaign || res.data || res;
  },

  createCampaign: async (payload: {
    name: string;
    assistantId: string;
    phoneNumberId?: string;
    contacts?: Array<{ name?: string; phone: string; details?: string }>;
    numbers?: string;
  }) => {
    return apiClient.post('/mobile/v1/voice/campaigns', payload);
  },

  updateCampaign: async (campaignId: string, payload: any) => {
    return apiClient.put(`/mobile/v1/voice/campaigns/${campaignId}`, payload);
  },

  deleteCampaign: async (campaignId: string) => {
    return apiClient.delete(`/mobile/v1/voice/campaigns/${campaignId}`);
  },

  updateCampaignStatus: async (campaignId: string, status: 'draft' | 'running' | 'paused' | 'completed' | 'failed') => {
    return apiClient.post(`/mobile/v1/voice/campaigns/${campaignId}/status`, { status });
  },

  // Contacts
  getContacts: async (): Promise<VoiceContact[]> => {
    const res = await apiClient.get<any>('/mobile/v1/voice/contacts');
    return Array.isArray(res) ? res : res.contacts || res.data || [];
  },

  getContactDetails: async (contactId: string): Promise<VoiceContact> => {
    const res = await apiClient.get<any>(`/mobile/v1/voice/contacts/${contactId}`);
    return res.contact || res.data || res;
  },

  createContact: async (payload: {
    name: string;
    phone: string;
    email?: string;
    company?: string;
    notes?: string;
  }) => {
    return apiClient.post('/mobile/v1/voice/contacts', payload);
  },

  updateContact: async (contactId: string, payload: Partial<VoiceContact>) => {
    return apiClient.put(`/mobile/v1/voice/contacts/${contactId}`, payload);
  },

  deleteContact: async (contactId: string) => {
    return apiClient.delete(`/mobile/v1/voice/contacts/${contactId}`);
  },
};
