import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { UpstreamSessionService } from '../services/upstream-session.service.js';
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

function createInternalBffToken(payload: { user_id: string; email?: string; organization_id?: string }, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const claims = {
    user_id: payload.user_id,
    email: payload.email || `${payload.user_id}@getaipilot.in`,
    organization_id: payload.organization_id || payload.user_id,
    iss: 'getaipilot-bff',
    aud: 'socialpilot',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const b64Payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${b64Header}.${b64Payload}`)
    .digest('base64url');

  return `${b64Header}.${b64Payload}.${signature}`;
}

export class SocialAdapter {
  private static baseUrl = env.SOCIAL_SERVICE_URL || 'https://api.getaipilot.in';
  private static secret = env.JWT_SECRET || 'getaipilot-super-secure-mobile-bff-jwt-secret-2026';
  private static hubAdmin: SupabaseClient = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
  private static socialSupabase: SupabaseClient | null = env.SOCIAL_SUPABASE_SERVICE_ROLE_KEY
    ? createClient(env.SOCIAL_SUPABASE_URL, env.SOCIAL_SUPABASE_SERVICE_ROLE_KEY as string)
    : null;
  private static tokenCache = new Map<string, { token: string; expiresAt: number }>();

  /**
   * Generates or retrieves a valid access token for the live SocialPilot backend
   */
  private static async getSocialSupabaseToken(email?: string, userId?: string): Promise<string | null> {
    if (!email && !userId) return null;

    const cacheKey = email || userId || '';
    const cached = this.tokenCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.token;
    }

    try {
      let targetEmail = email;
      if (!targetEmail && userId) {
        const { data: p } = await this.hubAdmin
          .from('profiles')
          .select('email')
          .eq('id', userId)
          .maybeSingle();
        targetEmail = p?.email;

        if (!targetEmail) {
          const { data: userRes } = await this.hubAdmin.auth.admin.getUserById(userId);
          targetEmail = userRes?.user?.email;
        }
      }

      if (!targetEmail) return null;

      // 1. Direct SocialPilot Supabase admin resolution if service role key configured
      if (this.socialSupabase) {
        const { data: linkData, error: linkErr } = await this.socialSupabase.auth.admin.generateLink({
          type: 'magiclink',
          email: targetEmail,
        });

        if (!linkErr && (linkData as any)?.properties?.hashed_token) {
          const { data: sessionData, error: sessionErr } = await this.socialSupabase.auth.verifyOtp({
            token_hash: (linkData as any).properties.hashed_token,
            type: 'email',
          });

          if (!sessionErr && sessionData?.session?.access_token) {
            const token = sessionData.session.access_token;
            this.tokenCache.set(cacheKey, { token, expiresAt: Date.now() + 3500 * 1000 });
            return token;
          }
        }
      }

      // 2. Hub SSO Bridge exchange flow with api.getaipilot.in
      const { data: hubLinkData, error: hubLinkErr } = await this.hubAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: targetEmail,
      });

      if (!hubLinkErr && hubLinkData?.properties?.hashed_token) {
        const hubVerifyRes = await fetch(`${env.SUPABASE_URL}/auth/v1/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            type: 'magiclink',
            token_hash: hubLinkData.properties.hashed_token,
          }),
        });

        if (hubVerifyRes.ok) {
          const hubSession: any = await hubVerifyRes.json();
          const hubUserToken = hubSession?.access_token;

          if (hubUserToken) {
            const ssoEdgeRes = await fetch(`${env.SUPABASE_URL}/functions/v1/social-sso`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${hubUserToken}`,
              },
              body: JSON.stringify({ dmpilot_url: 'https://social.getaipilot.in' }),
            });

            if (ssoEdgeRes.ok) {
              const ssoEdgeData: any = await ssoEdgeRes.json();
              if (ssoEdgeData?.launch_url) {
                const launchUrl = new URL(ssoEdgeData.launch_url);
                const ssoJwt = launchUrl.searchParams.get('token');

                if (ssoJwt) {
                  const exchangeRes = await fetch(`${this.baseUrl}/api/auth/sso`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: ssoJwt }),
                  });

                  if (exchangeRes.ok) {
                    const exchangeData: any = await exchangeRes.json();
                    if (exchangeData?.magic_link_url) {
                      const magicUrl = new URL(exchangeData.magic_link_url);
                      const socialTokenHash = magicUrl.searchParams.get('token');
                      const socialOtpType = magicUrl.searchParams.get('type') || 'signup';

                      if (socialTokenHash) {
                        const socialVerifyRes = await fetch(`${env.SOCIAL_SUPABASE_URL}/auth/v1/verify`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xYXlzcm5uY3didHJ1am54c2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NzkzMDcsImV4cCI6MjA4MzI1NTMwN30.ijLQ4PvBuL9BtuDnNfjQeRh12Q1MPInbI_Tvj1mvOd8',
                          },
                          body: JSON.stringify({
                            type: socialOtpType,
                            token_hash: socialTokenHash,
                          }),
                        });

                        if (socialVerifyRes.ok) {
                          const socialSession: any = await socialVerifyRes.json();
                          const socialAccessToken = socialSession?.access_token;
                          if (socialAccessToken) {
                            this.tokenCache.set(cacheKey, {
                              token: socialAccessToken,
                              expiresAt: Date.now() + 3000 * 1000,
                            });
                            console.log('[SOCIAL ADAPTER] Issued & cached live SocialPilot token for', targetEmail);
                            return socialAccessToken;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.warn('[SOCIAL ADAPTER] Error obtaining SocialPilot Supabase token:', err.message);
    }

    return null;
  }

  /**
   * Centralized HTTP requester to the real upstream SocialPilot backend
   */
  private static async requestUpstream<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      body?: any;
      params?: Record<string, string | number | boolean | undefined>;
      user?: JWTPayload | { user_id?: string; organization_id?: string; email?: string; token?: string; [key: string]: any };
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, params, user, headers: customHeaders } = options;
    const userId = user?.user_id || (user as any)?.id || 'system';
    const orgId = user?.organization_id || (user as any)?.orgId || userId || 'default';
    const email = (user as any)?.email;
    const sessionId = (user as any)?.session_id as string | undefined;

    let authToken: string | null = null;
    if (sessionId || userId) {
      try {
        authToken = await UpstreamSessionService.getSupabaseAccessToken(sessionId, userId);
      } catch (sessionErr: any) {
        console.warn('[SOCIAL ADAPTER] Could not retrieve upstream Supabase token:', sessionErr?.message);
      }
    }

    // For live api.getaipilot.in, exchange or ensure a valid SocialPilot Supabase token
    const socialToken = await this.getSocialSupabaseToken(email, userId);
    if (socialToken) {
      authToken = socialToken;
      console.log('[SOCIAL ADAPTER] Using SocialPilot Supabase token for user', email || userId);
    } else if (!authToken) {
      // Fallback: generate signed internal bearer token for SocialPilot
      authToken = createInternalBffToken(
        { user_id: userId, email, organization_id: orgId },
        this.secret
      );
      console.log('[SOCIAL ADAPTER] Using internal BFF token for user', userId);
    } else {
      console.log('[SOCIAL ADAPTER] Forwarding Hub Supabase access_token for user', userId);
    }

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

    console.log('[SOCIAL UPSTREAM REQUEST]', {
      path: upstreamPath,
      baseUrl: this.baseUrl,
      hasUpstreamAuthorization: Boolean(authToken),
      hasWorkspaceContext: Boolean(orgId),
      hasUserContext: Boolean(userId),
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'x-user-id': userId,
        'x-workspace-id': orgId,
        ...customHeaders,
      };

      const response = await fetch(url.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      console.log('[SOCIAL UPSTREAM RESPONSE]', {
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
        // CRITICAL: Prevent upstream 401 from being treated as BFF session expiration
        err.statusCode = response.status === 401 ? 502 : response.status;
        err.code = response.status === 401 ? 'SOCIAL_UPSTREAM_AUTH_FAILED' : 'SOCIAL_UPSTREAM_ERROR';
        throw err;
      }

      const json = await response.json();
      return json as T;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        const timeoutErr: any = new Error('SocialPilot upstream request timed out');
        timeoutErr.statusCode = 504;
        timeoutErr.code = 'SOCIAL_UPSTREAM_TIMEOUT';
        throw timeoutErr;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // --- 1. Dashboard Overview ---
  public static async getOverview(
    user: JWTPayload | { user_id?: string; organization_id?: string } | string,
    query?: { range?: number; instagramAccountId?: string }
  ) {
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
    const raw = res?.accounts || res?.data || res || {};

    const normalized: any[] = [];
    if (Array.isArray(raw)) {
      normalized.push(...raw);
    } else if (typeof raw === 'object') {
      const providers = ['facebook', 'instagram', 'threads', 'youtube', 'linkedin', 'x', 'twitter', 'reddit', 'pinterest', 'googleBusiness'];
      for (const p of providers) {
        const arrKey = `${p}Accounts`;
        if (Array.isArray(raw[arrKey])) {
          raw[arrKey].forEach((acc: any) => {
            normalized.push({
              id: acc.id || acc.accountId || acc.pageId || `${p}_${normalized.length}`,
              platform: p,
              account_name: acc.name || acc.username || acc.channelTitle || p,
              username: acc.username || acc.name || '',
              avatar: acc.profilePicture || acc.profile_picture_url || acc.thumbnailUrl || null,
              status: acc.status || 'connected',
              connected: acc.connected !== false,
              raw: acc,
            });
          });
        } else if (raw[p]?.connected) {
          const acc = raw[p];
          normalized.push({
            id: acc.id || acc.accountId || `${p}_0`,
            platform: p,
            account_name: acc.name || acc.username || p,
            username: acc.username || acc.name || '',
            avatar: acc.profilePicture || acc.profile_picture_url || null,
            status: acc.status || 'connected',
            connected: true,
            raw: acc,
          });
        }
      }
    }

    return normalized;
  }

  public static async getConnectedAccounts(userOrOrgId: JWTPayload | { user_id?: string; organization_id?: string } | string) {
    return this.getAccounts(userOrOrgId);
  }

  public static async disconnectAccount(
    user: JWTPayload | { user_id?: string; organization_id?: string } | string,
    payload: { provider: string; accountId?: string; pageId?: string }
  ) {
    const userObj = typeof user === 'string' ? { organization_id: user, user_id: user } : user;
    return this.requestUpstream('/api/auth/disconnect', {
      method: 'POST',
      body: payload,
      user: userObj,
    });
  }

  // --- 3. Broadcasts / Posts History & Queue ---
  public static async getPosts(
    user: JWTPayload | { user_id?: string; organization_id?: string } | string,
    filters?: SocialBroadcastFilter
  ) {
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

  // --- 4. Inbox & Social Conversations ---
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

  // --- 5. Post Lifecycle Operations ---
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

  // --- 6. Trend Feed ---
  public static async getTrends(user: JWTPayload, query?: { page?: number; limit?: number; interests?: string }) {
    const res: any = await this.requestUpstream('/api/trends/feed', {
      user,
      params: query,
    });
    return Array.isArray(res) ? res : (res.posts || res.data || []);
  }

  // --- 7. Entitlements & Billing ---
  public static async getEntitlements(user: JWTPayload) {
    const res: any = await this.requestUpstream('/api/billing/entitlements', { user });
    return res.entitlements || res.data || res;
  }
}
