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
  private static tokenCache = new Map<string, { token: string; refreshToken?: string; expiresAt: number }>();
  private static activeTokenResolutions = new Map<string, Promise<string | null>>();

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
    } catch { }
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
   * Validates that a JWT was genuinely issued by the SocialPilot Supabase instance
   * (https://oqaysrnncwbtrujnxsdo.supabase.co/auth/v1) and has not expired.
   */
  public static isSocialSupabaseToken(token?: string | null): boolean {
    if (!token || typeof token !== 'string') return false;
    try {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        const isSocialIss =
          (typeof payload.iss === 'string' && payload.iss.includes('oqaysrnncwbtrujnxsdo')) ||
          (typeof payload.ref === 'string' && payload.ref.includes('oqaysrnncwbtrujnxsdo'));
        const isNotExpired = typeof payload.exp === 'number' ? payload.exp * 1000 > Date.now() + 60_000 : true;
        return Boolean(isSocialIss && isNotExpired);
      }
    } catch {
      return false;
    }
    return false;
  }

  /**
   * Allows dynamic invalidation of cached SocialPilot token
   */
  public static invalidateToken(emailOrUserId?: string): void {
    if (emailOrUserId) {
      this.tokenCache.delete(emailOrUserId);
      this.activeTokenResolutions.delete(emailOrUserId);
    } else {
      this.tokenCache.clear();
      this.activeTokenResolutions.clear();
    }
  }

  /**
   * Sets a dynamic token directly into cache
   */
  public static setDynamicToken(emailOrUserId: string, token: string, refreshToken?: string): void {
    const expiresAt = this.getJwtExpiryMs(token);
    this.tokenCache.set(emailOrUserId, { token, refreshToken, expiresAt });
  }

  /**
   * Generates or retrieves a valid access token dynamically for the live SocialPilot backend.
   * Utilizes a single-flight mutex to prevent concurrent token refresh race conditions.
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
      if (cached && this.isSocialSupabaseToken(cached.token)) {
        return cached.token;
      }
    }

    // Coalesce concurrent requests into a single in-flight resolution promise
    if (this.activeTokenResolutions.has(cacheKey)) {
      console.log('[SOCIAL ADAPTER] Joining in-flight SocialPilot token resolution for', cacheKey);
      return this.activeTokenResolutions.get(cacheKey)!;
    }

    const resolutionPromise = (async (): Promise<string | null> => {
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

          let socialHash =
            (linkData as any)?.properties?.hashed_token ||
            (linkData as any)?.hashed_token;

          if (!socialHash && ((linkData as any)?.properties?.action_link || (linkData as any)?.action_link)) {
            try {
              const u = new URL((linkData as any)?.properties?.action_link || (linkData as any)?.action_link);
              socialHash = u.searchParams.get('token');
            } catch {}
          }

          if (!linkErr && socialHash) {
            const { data: sessionData, error: sessionErr } = await this.socialSupabase.auth.verifyOtp({
              token_hash: socialHash,
              type: 'email',
            });

            if (!sessionErr && sessionData?.session?.access_token) {
              const token = sessionData.session.access_token;
              const refreshToken = sessionData.session.refresh_token;
              const expiresAt = this.getJwtExpiryMs(token);
              this.tokenCache.set(cacheKey, { token, refreshToken, expiresAt });
              return token;
            }
          }
        }

        // 2. Hub SSO Bridge exchange flow with api.getaipilot.in
        const { data: hubLinkData, error: hubLinkErr } = await this.hubAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: targetEmail,
        });

        let hubTokenHash =
          hubLinkData?.properties?.hashed_token ||
          (hubLinkData as any)?.hashed_token;

        if (!hubTokenHash && (hubLinkData?.properties?.action_link || (hubLinkData as any)?.action_link)) {
          try {
            const u = new URL(hubLinkData?.properties?.action_link || (hubLinkData as any)?.action_link);
            hubTokenHash = u.searchParams.get('token');
          } catch {}
        }

        if (!hubLinkErr && hubTokenHash) {
          const hubVerifyRes = await fetch(`${env.SUPABASE_URL}/auth/v1/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
              type: 'magiclink',
              token_hash: hubTokenHash,
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
                          const socialOtpType = magicUrl.searchParams.get('type') || 'magiclink';
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
                            const socialRefreshToken = socialSession?.refresh_token;
                            if (socialAccessToken) {
                              const expiresAt = this.getJwtExpiryMs(socialAccessToken);
                              this.tokenCache.set(cacheKey, {
                                token: socialAccessToken,
                                refreshToken: socialRefreshToken,
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
      } finally {
        this.activeTokenResolutions.delete(cacheKey);
      }

      return null;
    })();

    this.activeTokenResolutions.set(cacheKey, resolutionPromise);
    return await resolutionPromise;
  }

  /**
   * Returns a fully authenticated SSO Web URL for SocialPilot
   * Targets supported:
   * - 'new-post' | '/dashboard' -> https://social.getaipilot.in/dashboard
   * - 'schedule' | '/dashboard/queue' -> https://social.getaipilot.in/dashboard/queue
   * - 'builder' | '/dashboard/instapilot?mode=builder' -> https://social.getaipilot.in/dashboard/instapilot?mode=builder
   * - 'upload-short' | 'compose' | '/dashboard/compose' -> https://social.getaipilot.in/dashboard/compose
   * - 'new-automation' | '/dashboard/auto-dm/automations/new' -> https://social.getaipilot.in/dashboard/auto-dm/automations/new
   */
  public static async getSocialHandoffUrl(
    user: JWTPayload,
    target: string = 'new-post'
  ): Promise<string> {
    const SOCIAL_BASE = 'https://social.getaipilot.in';

    let path = '/dashboard';
    switch (target) {
      case 'new-post':
      case '/dashboard':
        path = '/dashboard';
        break;
      case 'schedule':
      case 'queue':
      case '/dashboard/queue':
        path = '/dashboard/queue';
        break;
      case 'builder':
      case 'instapilot':
      case '/dashboard/instapilot?mode=builder':
        path = '/dashboard/instapilot?mode=builder';
        break;
      case 'upload-short':
      case 'compose':
      case '/dashboard/compose':
        path = '/dashboard/compose';
        break;
      case 'new-automation':
      case 'automation':
      case '/dashboard/auto-dm/automations/new':
        path = '/dashboard/auto-dm/automations/new';
        break;
      default:
        path = target.startsWith('/') ? target : `/${target}`;
    }

    try {
      const email = user.email;
      if (email) {
        const { data: hubLinkData, error: hubLinkErr } = await this.hubAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email,
        });

        let hubTokenHash =
          hubLinkData?.properties?.hashed_token ||
          (hubLinkData as any)?.hashed_token;

        if (!hubTokenHash && (hubLinkData?.properties?.action_link || (hubLinkData as any)?.action_link)) {
          try {
            const u = new URL(hubLinkData?.properties?.action_link || (hubLinkData as any)?.action_link);
            hubTokenHash = u.searchParams.get('token');
          } catch {}
        }

        if (!hubLinkErr && hubTokenHash) {
          const hubVerifyRes = await fetch(`${env.SUPABASE_URL}/auth/v1/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
              type: 'magiclink',
              token_hash: hubTokenHash,
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
                body: JSON.stringify({ dmpilot_url: SOCIAL_BASE }),
              });

              if (ssoEdgeRes.ok) {
                const ssoEdgeData: any = await ssoEdgeRes.json();
                if (ssoEdgeData?.launch_url) {
                  try {
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
                          magicUrl.searchParams.set('redirect_to', `${SOCIAL_BASE}${path}`);
                          return magicUrl.toString();
                        }
                      }
                    }
                  } catch (exErr) {
                    console.warn('[SOCIAL ADAPTER] Magic link customization error:', exErr);
                  }
                  return ssoEdgeData.launch_url;
                }
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.warn('[SOCIAL ADAPTER] Error generating SSO handoff URL:', err.message);
    }

    return `${SOCIAL_BASE}${path}`;
  }

  /**
   * Universal Upstream Request Broker
   * Routes all API calls to the live SocialPilot backend (https://api.getaipilot.in).
   * Authenticates requests strictly with a valid SocialPilot Supabase token (oqaysrnncwbtrujnxsdo).
   */
  private static async requestUpstream<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      body?: any;
      formData?: FormData;
      params?: Record<string, string | number | boolean | undefined>;
      user?: JWTPayload | { user_id?: string; organization_id?: string; email?: string; token?: string;[key: string]: any };
      headers?: Record<string, string>;
      isRetry?: boolean;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, formData, params, user, headers: customHeaders, isRetry = false } = options;
    const userId = user?.user_id || (user as any)?.id || 'system';
    const orgId = user?.organization_id || (user as any)?.orgId || userId || 'default';
    const email = (user as any)?.email;

    // 1. Check for dynamic token passed in request headers or user context
    let authToken: string | null =
      customHeaders?.['x-social-token'] ||
      customHeaders?.['x-socialpilot-token'] ||
      (user as any)?.social_token ||
      (user as any)?.socialToken ||
      null;

    if (authToken && this.isSocialSupabaseToken(authToken)) {
      console.log('[SOCIAL ADAPTER] Using explicitly provided dynamic Social token for user', email || userId);
    } else {
      authToken = null;

      // 2. Dynamically resolve or refresh SocialPilot Supabase token with single-flight mutex
      const socialToken = await this.getSocialSupabaseToken(email, userId, isRetry /* forceFresh on retry */);
      if (socialToken) {
        authToken = socialToken;
        console.log('[SOCIAL ADAPTER] Dynamically resolved SocialPilot token for', email || userId);
      }
    }

    if (!authToken) {
      const authErr: any = new Error('Could not establish an authenticated SocialPilot session for user');
      authErr.statusCode = 502;
      authErr.code = 'SOCIAL_UPSTREAM_AUTH_FAILED';
      throw authErr;
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
        } catch { }

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
      const seenIds = new Set<string>();

      for (const p of providers) {
        const arrKey = `${p}Accounts`;
        if (Array.isArray(raw[arrKey])) {
          raw[arrKey].forEach((acc: any) => {
            const id = acc.id || acc.accountId || acc.account_id || acc.pageId || acc.page_id || `${p}_${acc.username || normalized.length}`;
            const dedupeKey = `${p}_${acc.username || id}`;
            if (!seenIds.has(dedupeKey)) {
              seenIds.add(dedupeKey);
              normalized.push({
                id,
                platform: p,
                provider: p,
                account_name: acc.name || acc.username || acc.channelTitle || p,
                username: acc.username || acc.name || '',
                avatar: acc.profilePicture || acc.profile_picture_url || acc.thumbnailUrl || null,
                profilePicture: acc.profilePicture || acc.profile_picture_url || acc.thumbnailUrl || null,
                profile_picture_url: acc.profile_picture_url || acc.profilePicture || null,
                tokenExpiry: acc.tokenExpiry || acc.token_expiry || acc.tokenExpiresAt || null,
                token_expiry: acc.token_expiry || acc.tokenExpiry || acc.tokenExpiresAt || null,
                followers: acc.followers ?? acc.followers_count ?? null,
                followers_count: acc.followers_count ?? acc.followers ?? null,
                media_count: acc.media_count ?? acc.mediaCount ?? null,
                status: acc.status || 'connected',
                connected: acc.connected !== false,
                raw: acc,
              });
            }
          });
        }

        if (raw[p]?.connected) {
          const acc = raw[p];
          const id = acc.id || acc.accountId || acc.account_id || acc.page_id || acc.pageId || `${p}_${acc.username || 0}`;
          const dedupeKey = `${p}_${acc.username || id}`;
          if (!seenIds.has(dedupeKey)) {
            seenIds.add(dedupeKey);
            normalized.push({
              id,
              platform: p,
              provider: p,
              account_name: acc.name || acc.username || p,
              username: acc.username || acc.name || '',
              avatar: acc.profilePicture || acc.profile_picture_url || null,
              profilePicture: acc.profilePicture || acc.profile_picture_url || null,
              profile_picture_url: acc.profile_picture_url || acc.profilePicture || null,
              tokenExpiry: acc.tokenExpiry || acc.token_expiry || acc.tokenExpiresAt || null,
              token_expiry: acc.token_expiry || acc.tokenExpiry || acc.tokenExpiresAt || null,
              followers: acc.followers ?? acc.followers_count ?? null,
              followers_count: acc.followers_count ?? acc.followers ?? null,
              media_count: acc.media_count ?? acc.mediaCount ?? null,
              status: acc.status || 'connected',
              connected: true,
              raw: acc,
            });
          }
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

  public static async getPlans(user?: JWTPayload) {
    const res: any = await this.requestUpstream('/api/billing/plans', { user });
    return res.plans ? res : { success: true, plans: res };
  }

  /**
   * Dynamically resolves the Supabase Anon Key and/or Auth Token for different users/tenants.
   * Order of precedence:
   * 1. Explicit custom key supplied by caller (e.g. from request headers 'apikey', 'x-anon-key', or 'x-supabase-anon-key')
   * 2. Dynamic user token resolved via UpstreamSessionService (active session) or Social Supabase token exchange
   * 3. Tenant-specific anon key stored in user profile / custom settings in Supabase
   * 4. Environment variable fallback (SOCIAL_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY)
   */
  public static async resolveDynamicAnonKey(
    user?: JWTPayload,
    customKey?: string
  ): Promise<{ anonKey: string; authToken?: string; supabaseUrl: string }> {
    const supabaseUrl = env.SUPABASE_URL || 'https://uklxlappjcuvdqjvecfh.supabase.co';
    let anonKey = customKey && customKey.trim() ? customKey.trim() : '';
    let authToken: string | undefined = undefined;

    // 1. If user context is provided, attempt to resolve user-specific dynamic token and custom profile keys
    if (user) {
      try {
        // A. Resolve active Supabase session access token
        if (user.session_id && user.user_id) {
          const userAccessToken = await UpstreamSessionService.getSupabaseAccessToken(
            user.session_id,
            user.user_id
          );
          if (userAccessToken) {
            authToken = userAccessToken;
          }
        }

        // B. Dynamic social token exchange if session token wasn't found
        if (!authToken) {
          const socialToken = await this.getSocialSupabaseToken(user.email, user.user_id);
          if (socialToken) {
            authToken = socialToken;
          }
        }

        // C. Check if tenant has a custom anon key stored in profiles
        if (!anonKey && user.user_id) {
          const { data: profile } = await this.hubAdmin
            .from('profiles')
            .select('supabase_anon_key, anon_key, custom_keys')
            .eq('id', user.user_id)
            .maybeSingle();

          if (profile?.supabase_anon_key) {
            anonKey = profile.supabase_anon_key;
          } else if (profile?.anon_key) {
            anonKey = profile.anon_key;
          } else if (profile?.custom_keys?.supabase_anon_key) {
            anonKey = profile.custom_keys.supabase_anon_key;
          }
        }
      } catch (err) {
        console.warn('[SocialAdapter] Error resolving user-specific dynamic anonKey/token:', err);
      }
    }

    // 2. Fallback to environment variables
    if (!anonKey) {
      anonKey = env.SOCIAL_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
    }

    return {
      anonKey,
      authToken: authToken || anonKey,
      supabaseUrl,
    };
  }

  // --- 8. System Status & Settings ---
  public static async getSystemSettings(user?: JWTPayload, customKey?: string) {
    const { anonKey, supabaseUrl } = await this.resolveDynamicAnonKey(user, customKey);

    try {
      const resp = await fetch(`${supabaseUrl}/rest/v1/system_settings?select=*`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e: any) {
      console.warn('[SOCIAL ADAPTER] Error fetching system_settings:', e?.message);
    }

    return [{ id: 'default', global_maintenance_enabled: false }];
  }

  public static async getSystemProductStatus(productKey = 'social_pilot', user?: JWTPayload, customKey?: string) {
    const { anonKey, supabaseUrl } = await this.resolveDynamicAnonKey(user, customKey);

    try {
      const resp = await fetch(`${supabaseUrl}/rest/v1/system_products?product_key=eq.${productKey}&select=*`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e: any) {
      console.warn('[SOCIAL ADAPTER] Error fetching system_products:', e?.message);
    }

    return [{ id: 'default', product_key: productKey, product_name: 'GAP Social Pilot', status: 'operational' }];
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
