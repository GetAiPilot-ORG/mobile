import { env } from '../config/env.js';
import { JWTPayload } from '../types/index.js';

export interface VoiceCallFilter {
  limit?: number;
  status?: string;
  assistantId?: string;
}

export interface VoiceOutboundPayload {
  customerNumber: string;
  customerName?: string;
  assistantId?: string;
  assignedNumber?: string;
  customerCountryCode?: string;
  additionalData?: Record<string, any>;
}

export interface VoiceCampaignPayload {
  name: string;
  assistantId: string;
  phoneNumberId?: string;
  contacts?: Array<{ name?: string; phone: string; followUpDate?: string; details?: string }>;
  numbers?: string;
}

export interface VoiceAgentPayload {
  name: string;
  prompt?: string;
  voice?: {
    model?: string;
    voice_id?: string;
    speed?: number;
    pitch?: number;
  };
  language?: string;
  first_message?: string;
  tools?: string[];
}

export class VoiceAdapter {
  private static baseUrl = env.VOICE_SERVICE_URL || 'http://127.0.0.1:8000';

  /**
   * Resolves the VoicePilot workspace context for the authenticated user/organization.
   */
  public static async resolveWorkspaceId(user: JWTPayload | { user_id?: string; organization_id?: string }): Promise<string> {
    const userId = user.user_id;
    const orgId = user.organization_id;
    // Map Hub org / user to VoicePilot workspace
    return orgId || userId || 'default';
  }

  /**
   * Centralized HTTP caller to the real upstream VoicePilot API
   */
  private static async requestUpstream<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: any;
      params?: Record<string, string | number | boolean | undefined>;
      user?: JWTPayload | { user_id?: string; organization_id?: string };
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, params, user } = options;
    const userId = user?.user_id || 'system';
    const orgId = user?.organization_id || 'default';
    const workspaceId = await this.resolveWorkspaceId(user || { user_id: userId, organization_id: orgId });

    // Build URL with query params
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          url.searchParams.append(k, String(v));
        }
      });
    }

    if (!url.searchParams.has('workspaceId')) {
      url.searchParams.append('workspaceId', workspaceId);
    }
    if (!url.searchParams.has('userId')) {
      url.searchParams.append('userId', userId);
    }

    const upstreamPath = url.pathname + url.search;

    console.log('[VOICE TRACE]', {
      route: endpoint,
      userResolved: Boolean(userId),
      orgResolved: Boolean(orgId),
      workspaceResolved: Boolean(workspaceId),
      upstreamCalled: true,
      upstreamPath,
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-workspace-id': workspaceId,
        'x-user-id': userId,
      };

      const response = await fetch(url.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      console.log('[VOICE UPSTREAM]', {
        path: upstreamPath,
        status: response.status,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let parsedMessage = errorText;
        try {
          const jsonErr = JSON.parse(errorText);
          parsedMessage = jsonErr.error?.message || jsonErr.error || jsonErr.message || errorText;
        } catch {}

        const err: any = new Error(parsedMessage);
        err.statusCode = response.status;
        throw err;
      }

      const json = await response.json();
      return json as T;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        const timeoutErr: any = new Error('VoicePilot upstream request timed out');
        timeoutErr.statusCode = 504;
        throw timeoutErr;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // --- 1. Overview ---
  public static async getOverview(user: JWTPayload | { user_id?: string; organization_id?: string } | string) {
    const userObj = typeof user === 'string' ? { organization_id: user, user_id: user } : user;
    const res: any = await this.requestUpstream('/api/v1/overview', { user: userObj });
    return res.data || res;
  }

  public static async getSummary(userOrOrgId: JWTPayload | { user_id?: string; organization_id?: string } | string) {
    return this.getOverview(userOrOrgId);
  }

  // --- 2. Call Logs ---
  public static async getCalls(user: JWTPayload | { user_id?: string; organization_id?: string } | string, filters?: VoiceCallFilter) {
    const userObj = typeof user === 'string' ? { organization_id: user, user_id: user } : user;
    const res: any = await this.requestUpstream('/api/v1/calls', {
      user: userObj,
      params: {
        limit: filters?.limit || 50,
        status: filters?.status,
        assistantId: filters?.assistantId,
      },
    });
    return res.calls || res.data || [];
  }

  public static async getCallLogs(userOrOrgId: JWTPayload | { user_id?: string; organization_id?: string } | string): Promise<any[]> {
    return this.getCalls(userOrOrgId);
  }

  public static async getCallDetails(user: JWTPayload, callId: string) {
    const res: any = await this.requestUpstream(`/api/v1/calls/${callId}`, { user });
    return res.data || res;
  }

  public static async getCallTranscript(user: JWTPayload, callId: string) {
    const res: any = await this.requestUpstream(`/api/v1/calls/${callId}/transcript`, { user });
    return res.data || res;
  }

  public static async getCallRecording(user: JWTPayload, callId: string) {
    const res: any = await this.requestUpstream(`/api/v1/calls/${callId}/recording`, { user });
    return res.data || res;
  }

  public static async triggerOutboundCall(user: JWTPayload, payload: VoiceOutboundPayload) {
    const workspaceId = await this.resolveWorkspaceId(user);
    const body: any = {
      customer_number: payload.customerNumber,
      customer_name: payload.customerName || 'Valued Customer',
      customer_country_code: payload.customerCountryCode,
      assistant_id: payload.assistantId,
      assigned_number: payload.assignedNumber,
      workspaceId,
      createdBy: user.user_id,
      additional_data: payload.additionalData || { source: 'GAP_Mobile_App' },
    };

    const res: any = await this.requestUpstream('/api/v1/calls', {
      method: 'POST',
      body,
      user,
    });
    return res.data || res;
  }

  // --- 3. Assistants / Agents ---
  public static async getAgents(user: JWTPayload) {
    const res: any = await this.requestUpstream('/api/v1/assistants', { user });
    return res.assistants || res.data || [];
  }

  public static async getAgentDetails(user: JWTPayload, assistantId: string) {
    const res: any = await this.requestUpstream(`/api/v1/assistants/${assistantId}`, { user });
    return res;
  }

  public static async createAgent(user: JWTPayload, payload: VoiceAgentPayload) {
    const workspaceId = await this.resolveWorkspaceId(user);
    const body = {
      ...payload,
      workspaceId,
      createdBy: user.user_id,
    };
    const res: any = await this.requestUpstream('/api/v1/assistants', {
      method: 'POST',
      body,
      user,
    });
    return res;
  }

  public static async updateAgent(user: JWTPayload, assistantId: string, payload: Partial<VoiceAgentPayload>) {
    const res: any = await this.requestUpstream(`/api/v1/assistants/${assistantId}`, {
      method: 'PUT',
      body: payload,
      user,
    });
    return res.data || res;
  }

  public static async deleteAgent(user: JWTPayload, assistantId: string) {
    const res: any = await this.requestUpstream(`/api/v1/assistants/${assistantId}`, {
      method: 'DELETE',
      user,
    });
    return res;
  }

  public static async generatePrompt(user: JWTPayload, topic: string, name?: string) {
    const res: any = await this.requestUpstream('/api/v1/assistants/generate-prompt', {
      method: 'POST',
      body: { topic, name: name || 'Virtual Assistant' },
      user,
    });
    return res;
  }

  // --- 4. Campaigns ---
  public static async getCampaigns(user: JWTPayload) {
    const res: any = await this.requestUpstream('/api/v1/campaigns', { user });
    return res.campaigns || res.data || [];
  }

  public static async getCampaignDetails(user: JWTPayload, campaignId: string) {
    const res: any = await this.requestUpstream(`/api/v1/campaigns/${campaignId}`, { user });
    return res.campaign || res.data || res;
  }

  public static async createCampaign(user: JWTPayload, payload: VoiceCampaignPayload) {
    const workspaceId = await this.resolveWorkspaceId(user);
    const body = {
      ...payload,
      workspaceId,
      createdBy: user.user_id,
    };
    const res: any = await this.requestUpstream('/api/v1/campaigns', {
      method: 'POST',
      body,
      user,
    });
    return res.campaign || res;
  }

  // --- 5. Phone Numbers ---
  public static async getPhoneNumbers(user: JWTPayload) {
    const res: any = await this.requestUpstream('/api/v1/phone-numbers/my', { user });
    return res.phone_numbers || res.data || [];
  }

  public static async getAvailableNumbers(user: JWTPayload) {
    const res: any = await this.requestUpstream('/api/v1/phone-numbers/available', { user });
    return res.available_numbers || res.data || [];
  }

  public static async buyPhoneNumber(user: JWTPayload, payload: { phoneNumber: string; price?: number }) {
    const workspaceId = await this.resolveWorkspaceId(user);
    const res: any = await this.requestUpstream('/api/v1/phone-numbers/buy', {
      method: 'POST',
      body: { ...payload, workspaceId },
      user,
    });
    return res;
  }

  public static async assignPhoneNumber(user: JWTPayload, payload: { numberId: string; assistantId: string }) {
    const res: any = await this.requestUpstream('/api/v1/phone-numbers/assign', {
      method: 'PUT',
      body: payload,
      user,
    });
    return res;
  }

  // --- 6. Contacts ---
  public static async getContacts(user: JWTPayload) {
    const res: any = await this.requestUpstream('/api/v1/contacts', { user });
    return res.contacts || res.data || [];
  }

  public static async createContact(user: JWTPayload, payload: { name: string; phone: string; metadata?: any }) {
    const workspaceId = await this.resolveWorkspaceId(user);
    const res: any = await this.requestUpstream('/api/v1/contacts', {
      method: 'POST',
      body: { ...payload, workspaceId, userId: user.user_id },
      user,
    });
    return res.contact || res;
  }

  // --- 7. Usage & Wallet ---
  public static async getUsage(user: JWTPayload) {
    const res: any = await this.requestUpstream('/api/v1/payments/usage', { user });
    return res.data || res;
  }
}
