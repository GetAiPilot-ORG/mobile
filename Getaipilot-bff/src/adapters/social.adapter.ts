import { env } from '../config/env.js';
import { JWTPayload } from '../types/index.js';

export interface SocialBroadcastFilter {
  status?: string;
  limit?: number;
}

export interface CreateBroadcastPayload {
  caption: string;
  selectedChannels: string[];
  mediaUrls?: string[];
  isScheduled?: boolean;
  scheduledAt?: string;
  userTimezone?: string;
  postType?: string;
  platformData?: Record<string, any>;
  platformPresets?: Record<string, any>;
}

export class SocialAdapter {
  private static baseUrl = env.SOCIAL_SERVICE_URL || 'http://127.0.0.1:5000';

  /**
   * Centralized HTTP requester to the real upstream SocialPilot backend
   */
  private static async requestUpstream<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      body?: any;
      params?: Record<string, string | number | boolean | undefined>;
      user?: JWTPayload | { user_id?: string; organization_id?: string; token?: string; [key: string]: any };
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, params, user, headers: customHeaders } = options;
    const userId = user?.user_id || 'system';
    const orgId = user?.organization_id || 'default';
    const token = (user as any)?.token || (user as any)?.session_token || '';

    // Build URL with query params
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          url.searchParams.append(k, String(v));
        }
      });
    }

    const upstreamPath = url.pathname + url.search;

    console.log('[SOCIAL TRACE]', {
      route: endpoint,
      userResolved: Boolean(userId),
      orgResolved: Boolean(orgId),
      workspaceResolved: Boolean(orgId),
      upstreamCalled: true,
      upstreamPath,
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-id': userId,
        'x-workspace-id': orgId,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...customHeaders,
      };

      const response = await fetch(url.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      console.log('[SOCIAL UPSTREAM]', {
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
        const timeoutErr: any = new Error('SocialPilot upstream request timed out');
        timeoutErr.statusCode = 504;
        throw timeoutErr;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // --- 1. Dashboard Overview ---
  public static async getOverview(user: JWTPayload | { user_id?: string; organization_id?: string } | string, query?: { range?: number; instagramAccountId?: string }) {
    const userObj = typeof user === 'string' ? { organization_id: user, user_id: user } : user;
    return this.requestUpstream('/api/dashboard/overview', {
      user: userObj,
      params: {
        range: query?.range || 30,
        instagramAccountId: query?.instagramAccountId,
      },
    });
  }

  // --- 2. Connected Channels / Accounts ---
  public static async getAccounts(user: JWTPayload | { user_id?: string; organization_id?: string } | string) {
    const userObj = typeof user === 'string' ? { organization_id: user, user_id: user } : user;
    const res: any = await this.requestUpstream('/api/auth/accounts', { user: userObj });
    return res.accounts || res.data || res;
  }

  public static async getConnectedAccounts(userOrOrgId: JWTPayload | { user_id?: string; organization_id?: string } | string) {
    return this.getAccounts(userOrOrgId);
  }

  public static async disconnectAccount(user: JWTPayload | { user_id?: string; organization_id?: string } | string, payload: { provider: string; accountId?: string; pageId?: string }) {
    const userObj = typeof user === 'string' ? { organization_id: user, user_id: user } : user;
    return this.requestUpstream('/api/auth/disconnect', {
      method: 'POST',
      body: payload,
      user: userObj,
    });
  }

  // --- 3. Broadcasts / Posts History & Queue ---
  public static async getPosts(user: JWTPayload | { user_id?: string; organization_id?: string } | string, filters?: SocialBroadcastFilter) {
    const userObj = typeof user === 'string' ? { organization_id: user, user_id: user } : user;
    const res: any = await this.requestUpstream('/api/broadcasts', {
      user: userObj,
      params: {
        status: filters?.status,
        limit: filters?.limit || 50,
      },
    });
    return Array.isArray(res) ? res : (res.broadcasts || res.data || []);
  }

  public static async getQueue(user: JWTPayload | { user_id?: string; organization_id?: string } | string) {
    const userObj = typeof user === 'string' ? { organization_id: user, user_id: user } : user;
    const res: any = await this.requestUpstream('/api/broadcasts/queue', { user: userObj });
    return Array.isArray(res) ? res : (res.queue || res.data || []);
  }

  public static async getStats(user: JWTPayload | { user_id?: string; organization_id?: string } | string) {
    const userObj = typeof user === 'string' ? { organization_id: user, user_id: user } : user;
    const res: any = await this.requestUpstream('/api/broadcasts/stats', { user: userObj });
    return res.stats || res.data || res;
  }

  // --- Inbox & Social Conversations ---
  public static async getConversations(workspaceId: string): Promise<any[]> {
    try {
      const res: any = await this.requestUpstream('/api/inbox/conversations', {
        user: { organization_id: workspaceId, user_id: workspaceId },
      });
      return Array.isArray(res) ? res : (res.conversations || res.data || []);
    } catch {
      return [];
    }
  }

  public static async getMessages(conversationId: string): Promise<any[]> {
    try {
      const res: any = await this.requestUpstream(`/api/inbox/conversations/${conversationId}/messages`);
      return Array.isArray(res) ? res : (res.messages || res.data || []);
    } catch {
      return [];
    }
  }

  public static async sendMessage(
    conversationId: string,
    content: string,
    attachments?: Array<{ url: string; type: string }>
  ): Promise<any> {
    try {
      return await this.requestUpstream('/api/inbox/reply', {
        method: 'POST',
        body: { conversationId, message: content, attachments },
      });
    } catch {
      return {
        id: `soc_msg_${Date.now()}`,
        conversation_id: conversationId,
        direction: 'outbound',
        content,
        created_at: new Date().toISOString(),
      };
    }
  }

  // --- 4. Post Lifecycle Operations ---
  public static async createPost(user: JWTPayload, payload: CreateBroadcastPayload) {
    const body = {
      caption: payload.caption,
      selectedChannels: payload.selectedChannels,
      mediaUrls: payload.mediaUrls || [],
      isScheduled: payload.isScheduled || Boolean(payload.scheduledAt),
      scheduledAt: payload.scheduledAt,
      userTimezone: payload.userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      postType: payload.postType || 'post',
      platformData: payload.platformData || {},
      platformPresets: payload.platformPresets || {},
    };

    return this.requestUpstream('/api/broadcast', {
      method: 'POST',
      body,
      user,
    });
  }

  public static async updatePost(user: JWTPayload, postId: string, payload: Partial<CreateBroadcastPayload>) {
    return this.requestUpstream(`/api/broadcasts/${postId}`, {
      method: 'PATCH',
      body: payload,
      user,
    });
  }

  public static async cancelPost(user: JWTPayload, postId: string) {
    return this.requestUpstream(`/api/broadcasts/${postId}/cancel`, {
      method: 'POST',
      user,
    });
  }

  public static async retryPost(user: JWTPayload, postId: string) {
    return this.requestUpstream(`/api/broadcasts/${postId}/retry`, {
      method: 'POST',
      user,
    });
  }

  public static async deletePost(user: JWTPayload, postId: string) {
    return this.requestUpstream(`/api/broadcasts/${postId}`, {
      method: 'DELETE',
      user,
    });
  }

  // --- 5. Trend Feed ---
  public static async getTrends(user: JWTPayload, query?: { page?: number; limit?: number; interests?: string }) {
    const res: any = await this.requestUpstream('/api/trends/feed', {
      user,
      params: query,
    });
    return res.data || res.posts || res;
  }

  // --- 6. Entitlements & Billing ---
  public static async getEntitlements(user: JWTPayload) {
    const res: any = await this.requestUpstream('/api/billing/entitlements', { user });
    return res.entitlements || res.data || res;
  }
}
