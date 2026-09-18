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
   * Reads JWT exp claim and returns expiration in milliseconds
   */
  private static getJwtExpiryMs(token: string): number {
    try {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        if (typeof payload.exp === 'number') {
          return payload.exp * 1000;
        }
      }
    } catch {}
    return Date.now() + 3600 * 1000;
  }

  /**
   * Validates JWT structure and ensures at least 60s validity remains
   */
  private static isJwtValidAndNotExpired(token: string): boolean {
    try {
      const expiryMs = this.getJwtExpiryMs(token);
      return expiryMs > Date.now() + 60_000;
    } catch {
      return false;
    }
  }

  /**
   * Allows dynamic invalidation of cached SocialPilot token
   */
  public static invalidateToken(emailOrUserId?: string): void {
    if (emailOrUserId) {
      this.tokenCache.delete(emailOrUserId);
    } else {
      this.tokenCache.clear();
    }
  }

  /**
   * Sets a dynamic token directly into cache
   */
  public static setDynamicToken(emailOrUserId: string, token: string): void {
    const expiresAt = this.getJwtExpiryMs(token);
    this.tokenCache.set(emailOrUserId, { token, expiresAt });
  }

  /**
   * Generates or retrieves a valid access token dynamically for the live SocialPilot backend
   */
  private static async getSocialSupabaseToken(
    email?: string,
    userId?: string,
    forceFresh = false
  ): Promise<string | null> {
    if (!email && !userId) return null;

    const cacheKey = email || userId || '';
    if (!forceFresh) {
      const cached = this.tokenCache.get(cacheKey);
      if (cached && this.isJwtValidAndNotExpired(cached.token)) {
        return cached.token;
      }
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
            const expiresAt = this.getJwtExpiryMs(token);
            this.tokenCache.set(cacheKey, { token, expiresAt });
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
                      if (socialTokenHash) {
                        const socialOtpType = magicUrl.searchParams.get('type') || 'signup';
                        const socialApiKey = env.SOCIAL_SUPABASE_ANON_KEY || env.SOCIAL_SUPABASE_SERVICE_ROLE_KEY || '';
                        if (!socialApiKey) {
                          console.warn('[SOCIAL ADAPTER] Warning: Neither SOCIAL_SUPABASE_ANON_KEY nor SOCIAL_SUPABASE_SERVICE_ROLE_KEY is set in .env');
                        }

                        const socialVerifyRes = await fetch(`${env.SOCIAL_SUPABASE_URL}/auth/v1/verify`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            apikey: socialApiKey,
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
                            const expiresAt = this.getJwtExpiryMs(socialAccessToken);
                            this.tokenCache.set(cacheKey, {
                              token: socialAccessToken,
                              expiresAt,
                            });
                            console.log('[SOCIAL ADAPTER] Issued & dynamically cached live SocialPilot token for', targetEmail);
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
      formData?: FormData;
      params?: Record<string, string | number | boolean | undefined>;
      user?: JWTPayload | { user_id?: string; organization_id?: string; email?: string; token?: string; [key: string]: any };
      headers?: Record<string, string>;
      isRetry?: boolean;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, formData, params, user, headers: customHeaders, isRetry = false } = options;
    const userId = user?.user_id || (user as any)?.id || 'system';
    const orgId = user?.organization_id || (user as any)?.orgId || userId || 'default';
    const email = (user as any)?.email;
    const sessionId = (user as any)?.session_id as string | undefined;

    // 1. Check for dynamic token passed in request headers or user context
    let authToken: string | null =
      customHeaders?.['x-social-token'] ||
      customHeaders?.['x-socialpilot-token'] ||
      (user as any)?.social_token ||
      (user as any)?.socialToken ||
      null;

    if (authToken && this.isJwtValidAndNotExpired(authToken)) {
      console.log('[SOCIAL ADAPTER] Using explicitly provided dynamic social token for user', email || userId);
    } else {
      authToken = null;

      // 2. Try UpstreamSessionService for active user session if valid
      if (sessionId || userId) {
        try {
          const sessionToken = await UpstreamSessionService.getSupabaseAccessToken(sessionId, userId);
          if (sessionToken && this.isJwtValidAndNotExpired(sessionToken)) {
            authToken = sessionToken;
          }
        } catch (sessionErr: any) {
          console.warn('[SOCIAL ADAPTER] Could not retrieve upstream Supabase token:', sessionErr?.message);
        }
      }

      // 3. Dynamically resolve or refresh SocialPilot Supabase token
      if (!authToken || !this.isJwtValidAndNotExpired(authToken)) {
        const socialToken = await this.getSocialSupabaseToken(email, userId, isRetry /* forceFresh on retry */);
        if (socialToken) {
          authToken = socialToken;
          console.log('[SOCIAL ADAPTER] Dynamically resolved SocialPilot token for', email || userId);
        } else if (!authToken) {
          // 4. Fallback: generate signed internal bearer token for SocialPilot
          authToken = createInternalBffToken(
            { user_id: userId, email, organization_id: orgId },
            this.secret
          );
          console.log('[SOCIAL ADAPTER] Using internal BFF token for user', userId);
        }
      }
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
        'Authorization': `Bearer ${authToken}`,
        'x-user-id': userId,
        'x-workspace-id': orgId,
        'origin': 'https://social.getaipilot.in',
        'referer': 'https://social.getaipilot.in/',
        ...customHeaders,
      };

      if (!formData) {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(url.toString(), {
        method,
        headers,
        body: formData ? (formData as any) : body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      console.log('[SOCIAL UPSTREAM RESPONSE]', {
        path: upstreamPath,
        status: response.status,
      });

      if (!response.ok) {
        // Self-healing: if upstream returns 401, evict cache and auto-retry once with a freshly resolved token
        if (response.status === 401 && !isRetry) {
          const cacheKey = email || userId || '';
          this.tokenCache.delete(cacheKey);
          console.warn('[SOCIAL ADAPTER] Upstream returned 401. Evicting token cache and retrying dynamically...');
          return await this.requestUpstream<T>(endpoint, {
            ...options,
            isRetry: true,
          });
        }

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
              provider: p,
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
            provider: p,
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
    return Array.isArray(res) ? res : (res.broadcasts || res.queue || res.data || []);
  }

  public static async getStats(user: JWTPayload | { user_id?: string; organization_id?: string } | string) {
    const userObj = typeof user === 'string' ? { organization_id: user, user_id: user } : user;
    const res: any = await this.requestUpstream('/api/broadcasts/stats', { user: userObj });
    return res.stats || res.data || res;
  }

  // --- 4.5 InstaPilot Inbox & Sync ---
  public static async syncInstapilotInbox(user: JWTPayload | { user_id?: string; organization_id?: string } | string) {
    const userObj = typeof user === 'string' ? { organization_id: user, user_id: user } : user;
    const res: any = await this.requestUpstream('/api/instapilot/inbox/sync', {
      method: 'POST',
      body: {},
      user: userObj,
    });
    return res;
  }

  public static async getInstapilotConversations(user: JWTPayload | { user_id?: string; organization_id?: string } | string) {
    const userObj = typeof user === 'string' ? { organization_id: user, user_id: user } : user;
    const res: any = await this.requestUpstream('/api/instapilot/inbox/conversations', {
      user: userObj,
    });
    return Array.isArray(res) ? res : (res.conversations || res.data || []);
  }

  // --- 4. Inbox & Social Conversations ---
  public static async getSocialInboxConversations(user: JWTPayload, limit: number = 50): Promise<any[]> {
    try {
      const res: any = await this.requestUpstream('/api/inbox/conversations', {
        user,
        params: { limit },
      });
      return Array.isArray(res) ? res : (res?.items || res?.conversations || res?.data || []);
    } catch (err: any) {
      console.warn('[SOCIAL ADAPTER] Failed to fetch inbox conversations:', err.message);
      return [];
    }
  }

  public static async getSocialInboxMessages(user: JWTPayload, conversationId: string, limit: number = 50): Promise<any[]> {
    try {
      const res: any = await this.requestUpstream(`/api/inbox/conversations/${conversationId}/messages`, {
        user,
        params: { limit },
      });
      return Array.isArray(res) ? res : (res?.messages || res?.data || []);
    } catch (err: any) {
      console.warn('[SOCIAL ADAPTER] Failed to fetch inbox messages for', conversationId, err.message);
      return [];
    }
  }

  public static async markSocialInboxConversationRead(user: JWTPayload, conversationId: string): Promise<any> {
    try {
      const res: any = await this.requestUpstream(`/api/inbox/conversations/${conversationId}/read`, {
        method: 'POST',
        user,
        body: {},
      });
      return res || { success: true };
    } catch (err: any) {
      console.warn('[SOCIAL ADAPTER] Failed to mark conversation as read:', conversationId, err.message);
      return { success: false, error: err.message };
    }
  }

  public static async sendSocialInboxReply(
    user: JWTPayload,
    payload: {
      platform: string;
      accountId?: string;
      commentId?: string;
      recipientId?: string;
      postId?: string | null;
      text: string;
      conversationDatabaseId?: string;
    }
  ): Promise<any> {
    try {
      const replyBody = {
        platform: payload.platform || 'instagram',
        accountId: payload.accountId,
        commentId: payload.commentId,
        recipientId: payload.recipientId,
        postId: payload.postId || null,
        text: payload.text,
      };
      const res: any = await this.requestUpstream('/api/inbox/reply', {
        method: 'POST',
        user,
        body: replyBody,
      });
      return res;
    } catch (err: any) {
      console.warn('[SOCIAL ADAPTER] Failed to send reply:', err.message);
      return {
        success: false,
        error: err.message,
        message: err.message || 'Failed to send message',
      };
    }
  }

  public static async getConversations(workspaceId: string): Promise<any[]> {
    try {
      const res: any = await this.requestUpstream('/api/inbox/conversations', {
        user: { organization_id: workspaceId, user_id: workspaceId },
      });
      return Array.isArray(res) ? res : (res?.items || res?.conversations || res?.data || []);
    } catch {
      return [];
    }
  }

  public static async getMessages(conversationId: string): Promise<any[]> {
    try {
      const res: any = await this.requestUpstream(`/api/inbox/conversations/${conversationId}/messages`);
      return Array.isArray(res) ? res : (res?.messages || res?.data || []);
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
    const formData = new FormData();
    formData.append('caption', payload.caption || '');
    formData.append('selectedChannels', JSON.stringify(payload.selectedChannels || []));
    formData.append('postType', payload.postType || 'post');
    formData.append('platformData', JSON.stringify(payload.platformData || {}));
    formData.append('platformPresets', JSON.stringify(payload.platformPresets || {}));
    formData.append('userTimezone', payload.userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata');
    formData.append('isScheduled', (payload.isScheduled || Boolean(payload.scheduledAt)) ? 'true' : 'false');
    if (payload.scheduledAt) {
      formData.append('scheduledAt', new Date(payload.scheduledAt).toISOString());
    }
    formData.append('selectedAspectRatio', '1:1');
    formData.append('selectedPostSizePreset', '');

    const mediaUrls = payload.mediaUrls || [];
    for (let i = 0; i < mediaUrls.length; i++) {
      const url = mediaUrls[i];
      if (url) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const blob = await res.blob();
            const contentType = blob.type || 'image/png';
            const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
            formData.append('media', blob, `media_${Date.now()}_${i}.${ext}`);
          }
        } catch (fetchErr: any) {
          console.warn('[SOCIAL ADAPTER] Error fetching mediaUrl for broadcast upload:', url, fetchErr?.message);
        }
      }
    }

    return this.requestUpstream('/api/broadcast', {
      method: 'POST',
      formData,
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

  public static async uploadMedia(
    user: JWTPayload,
    payload: { fileData: string; fileName?: string; contentType?: string }
  ) {
    let base64 = payload.fileData;
    let mimeType = payload.contentType || 'image/jpeg';

    // Parse data URL prefix if present
    if (base64.startsWith('data:')) {
      const match = base64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64 = match[2];
      }
    }

    const buffer = Buffer.from(base64, 'base64');
    const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    const cleanFileName = (payload.fileName || `media_${Date.now()}.${ext}`).replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `social/${user.organization_id || user.user_id}/${Date.now()}_${cleanFileName}`;

    const { data, error } = await this.hubAdmin.storage
      .from('shared_files')
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload media: ${error.message}`);
    }

    const { data: pubData } = this.hubAdmin.storage
      .from('shared_files')
      .getPublicUrl(filePath);

    return {
      success: true,
      publicUrl: pubData.publicUrl,
      fileName: cleanFileName,
      contentType: mimeType,
      size: buffer.length,
    };
  }

  // --- 6. Trend Feed ---
  public static async getTrends(
    user: JWTPayload,
    query?: {
      page?: number;
      limit?: number;
      type?: string;
      category?: string;
      region?: string;
      seen?: string;
      interests?: string;
    }
  ) {
    const res: any = await this.requestUpstream('/api/trends/feed', {
      user,
      params: query,
    });
    if (res && Array.isArray(res.items)) {
      return res;
    }
    if (Array.isArray(res)) {
      return { success: true, items: res, page: query?.page || 1 };
    }
    return {
      success: true,
      items: res?.posts || res?.data || [],
      page: query?.page || 1,
      ...res,
    };
  }

  // --- 7. Entitlements & Billing ---
  public static async getEntitlements(user: JWTPayload) {
    const res: any = await this.requestUpstream('/api/billing/entitlements', { user });
    return res.entitlements || res.data || res;
  }

  // --- 8. System Status & Settings ---
  public static async getSystemSettings() {
    const supabaseUrl = 'https://uklxlappjcuvdqjvecfh.supabase.co';
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbHhsYXBwamN1dmRxanZlY2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDcwODMsImV4cCI6MjA4MzcyMzA4M30.v-TvyQrYpttcmCnzT9MkUlBgGXXU3lspZCxCYm-Oil4';

    const resp = await fetch(`${supabaseUrl}/rest/v1/system_settings?select=*`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
    });
    if (!resp.ok) {
      throw new Error(`Failed to fetch system settings: ${resp.status}`);
    }
    return await resp.json();
  }

  public static async getSystemProductStatus(productKey = 'social_pilot') {
    const supabaseUrl = 'https://uklxlappjcuvdqjvecfh.supabase.co';
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbHhsYXBwamN1dmRxanZlY2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDcwODMsImV4cCI6MjA4MzcyMzA4M30.v-TvyQrYpttcmCnzT9MkUlBgGXXU3lspZCxCYm-Oil4';

    const resp = await fetch(`${supabaseUrl}/rest/v1/system_products?product_key=eq.${productKey}&select=*`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
    });
    if (!resp.ok) {
      throw new Error(`Failed to fetch system product status: ${resp.status}`);
    }
    return await resp.json();
  }

  // --- 9. YouTube Studio ---
  public static async getYouTubeAccounts(user: JWTPayload) {
    try {
      const res: any = await this.requestUpstream('/api/youtube/accounts', { user });
      return res?.accounts || [];
    } catch {
      return [];
    }
  }

  // --- 10. AutoDM Operations ---
  public static async getAutoDMStatus(user: JWTPayload) {
    try {
      const res: any = await this.requestUpstream('/api/autodm/status', { user });
      return res || { success: true, autodmAccounts: [] };
    } catch (err: any) {
      console.warn('[SOCIAL ADAPTER] Failed to fetch autodm status:', err.message);
      return { success: false, autodmAccounts: [], error: err.message };
    }
  }

  public static async getAutoDMDailyMetrics(
    user: JWTPayload,
    params: { instagramAccountId?: string; startDate?: string }
  ) {
    try {
      let accountId = params.instagramAccountId;
      if (!accountId) {
        const statusRes = await this.getAutoDMStatus(user);
        accountId = statusRes?.autodmAccounts?.[0]?.id;
      }
      const startDate =
        params.startDate ||
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      if (!accountId) {
        return { success: true, metrics: [] };
      }

      const res: any = await this.requestUpstream('/api/autodm/daily-metrics', {
        user,
        params: {
          instagramAccountId: accountId,
          startDate,
        },
      });
      return res || { success: true, metrics: [] };
    } catch (err: any) {
      console.warn('[SOCIAL ADAPTER] Failed to fetch autodm daily-metrics:', err.message);
      return { success: false, metrics: [], error: err.message };
    }
  }

  public static async getAutoDMAutomations(
    user: JWTPayload,
    params: { instagramAccountId?: string }
  ) {
    try {
      let accountId = params.instagramAccountId;
      if (!accountId) {
        const statusRes = await this.getAutoDMStatus(user);
        accountId = statusRes?.autodmAccounts?.[0]?.id;
      }

      if (!accountId) {
        return { success: true, automations: [] };
      }

      const res: any = await this.requestUpstream('/api/autodm/automations', {
        user,
        params: {
          instagramAccountId: accountId,
        },
      });
      return res || { success: true, automations: [] };
    } catch (err: any) {
      console.warn('[SOCIAL ADAPTER] Failed to fetch autodm automations:', err.message);
      return { success: false, automations: [], error: err.message };
    }
  }

  public static async updateAutoDMAutomation(
    user: JWTPayload,
    automationId: string,
    updates: Record<string, any>
  ) {
    try {
      const res: any = await this.requestUpstream(`/api/autodm/automations/${automationId}`, {
        method: 'PATCH',
        user,
        body: updates,
      });
      return res;
    } catch (err: any) {
      console.warn('[SOCIAL ADAPTER] Failed to update autodm automation:', err.message);
      return { success: false, error: err.message };
    }
  }

  public static async createAutoDMAutomation(
    user: JWTPayload,
    payload: Record<string, any>
  ) {
    try {
      let accountId = payload.instagram_account_id || payload.instagramAccountId;
      if (!accountId) {
        const statusRes = await this.getAutoDMStatus(user);
        accountId = statusRes?.autodmAccounts?.[0]?.id;
      }
      const res: any = await this.requestUpstream('/api/autodm/automations', {
        method: 'POST',
        user,
        body: {
          ...payload,
          instagram_account_id: accountId,
        },
      });
      return res;
    } catch (err: any) {
      console.warn('[SOCIAL ADAPTER] Failed to create autodm automation:', err.message);
      return { success: false, error: err.message };
    }
  }

  public static async deleteAutoDMAutomation(user: JWTPayload, automationId: string) {
    try {
      const res: any = await this.requestUpstream(`/api/autodm/automations/${automationId}`, {
        method: 'DELETE',
        user,
      });
      return res || { success: true };
    } catch (err: any) {
      console.warn('[SOCIAL ADAPTER] Failed to delete autodm automation:', err.message);
      return { success: false, error: err.message };
    }
  }

  public static async getAutoDMContacts(
    user: JWTPayload,
    params: { instagramAccountId?: string }
  ) {
    try {
      let accountId = params.instagramAccountId;
      if (!accountId) {
        const statusRes = await this.getAutoDMStatus(user);
        accountId = statusRes?.autodmAccounts?.[0]?.id;
      }

      if (!accountId) {
        return { success: true, contacts: [] };
      }

      const res: any = await this.requestUpstream('/api/autodm/contacts', {
        user,
        params: {
          instagramAccountId: accountId,
        },
      });
      return res || { success: true, contacts: [] };
    } catch (err: any) {
      console.warn('[SOCIAL ADAPTER] Failed to fetch autodm contacts:', err.message);
      return { success: false, contacts: [], error: err.message };
    }
  }

  public static async getAutoDMInstagramMedia(
    user: JWTPayload,
    params: { instagramAccountId?: string; limit?: number }
  ) {
    try {
      let accountId = params.instagramAccountId;
      if (!accountId) {
        const statusRes = await this.getAutoDMStatus(user);
        accountId = statusRes?.autodmAccounts?.[0]?.id;
      }

      if (!accountId) {
        return { success: true, media: [], account: null };
      }

      const res: any = await this.requestUpstream('/api/autodm/instagram-media', {
        user,
        params: {
          instagramAccountId: accountId,
          limit: params.limit || 60,
        },
      });
      return res || { success: true, media: [], account: null };
    } catch (err: any) {
      console.warn('[SOCIAL ADAPTER] Failed to fetch autodm instagram-media:', err.message);
      return { success: false, media: [], account: null, error: err.message };
    }
  }
}
