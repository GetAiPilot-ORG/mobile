import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../../lib/supabase';
import { authStorage } from '../storage/authStorage';

/**
 * Returns the local development BFF URL based on the current platform/host.
 */
export function getLocalDevBffUrl(): string {
  // Physical Android device, Waydroid, or iOS on same Wi-Fi LAN via Metro Host IP
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:4000`;
    }
  }

  // Waydroid or Android emulator loopback alias
  if (Platform.OS === 'android') {
    return 'http://192.168.240.1:4000';
  }

  return 'http://localhost:4000';
}

/**
 * Dynamically resolves the BFF backend URL across Web, Android Emulator,
 * Physical LAN device (via Expo Metro host), and Production env.
 */
export function resolveBffBaseUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:4000';
    }
  }

  // 1. Explicitly configured BFF URL from environment takes top priority
  const customUrl = process.env.EXPO_PUBLIC_BFF_URL?.trim();
  if (customUrl && !customUrl.includes('bff.getaipilot.in')) {
    return customUrl.replace(/\/+$/, '');
  }

  // 2. In local development without an explicit BFF URL, route to local BFF server
  if (__DEV__) {
    const devUrl = getLocalDevBffUrl();
    return devUrl;
  }

  return 'https://app.getaipilot.com';
}

export const BFF_BASE_URL = resolveBffBaseUrl();

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean;
  _isRetry?: boolean;
  _hasFallenBack?: boolean;
  _permissionRetried?: boolean;
}

let skipLocalBffUntil = 0;
let supabaseOverrideUntil = 0;
let supabaseTokenPromise: Promise<string | null> | null = null;

function isJwtValidSoon(token: string, minRemainingSeconds = 30): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const decoded =
      typeof globalThis.atob === 'function' ? globalThis.atob(padded) : '';
    if (!decoded) return true;
    const payload = JSON.parse(decoded);
    if (typeof payload.exp !== 'number') return true;
    return payload.exp > Math.floor(Date.now() / 1000) + minRemainingSeconds;
  } catch {
    return true;
  }
}

async function getActiveSupabaseAccessToken(): Promise<string | null> {
  if (supabaseTokenPromise) {
    return await supabaseTokenPromise;
  }

  supabaseTokenPromise = (async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const currentToken = data?.session?.access_token;
      if (currentToken && isJwtValidSoon(currentToken)) {
        return currentToken;
      }
      if (data?.session?.refresh_token) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        return refreshed?.session?.access_token || null;
      }
      return currentToken || null;
    } catch {
      return null;
    } finally {
      supabaseTokenPromise = null;
    }
  })();

  return await supabaseTokenPromise;
}

function isNetworkFailureMessage(message?: string): boolean {
  const errMsg = (message || '').toLowerCase();
  return (
    errMsg.includes('network request failed') ||
    errMsg.includes('failed to fetch') ||
    errMsg.includes('fetch failed') ||
    errMsg.includes('connectexception') ||
    errMsg.includes('networkerror') ||
    errMsg.includes('noroutetohost') ||
    errMsg.includes('unreachable')
  );
}

function getFallbackBaseUrl(currentBase: string): string | null {
  const fallbackBase = currentBase.includes('app.getaipilot.com')
    ? getLocalDevBffUrl()
    : 'https://app.getaipilot.com';
  return fallbackBase && fallbackBase !== currentBase ? fallbackBase : null;
}

class ApiClient {
  private baseUrl: string;
  private refreshPromise: Promise<boolean> | null = null;
  private onUnauthorizedCallback: (() => void) | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  public setOnUnauthorized(callback: () => void) {
    this.onUnauthorizedCallback = callback;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private createFallbackClient(fallbackBase: string): ApiClient {
    const fallbackClient = new ApiClient(fallbackBase);
    if (this.onUnauthorizedCallback) {
      fallbackClient.setOnUnauthorized(this.onUnauthorizedCallback);
    }
    return fallbackClient;
  }

  public async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const {
      params,
      skipAuth,
      _isRetry,
      _hasFallenBack,
      _permissionRetried,
      headers: customHeaders,
      ...restOptions
    } = options;

    // If local dev BFF recently refused connections, go straight to fallback briefly to avoid noisy 401/refresh misses
    if (!_hasFallenBack && !this.baseUrl.includes('app.getaipilot.com') && Date.now() < skipLocalBffUntil) {
      const fallbackBase = getFallbackBaseUrl(this.baseUrl);
      if (fallbackBase) {
        return await this.createFallbackClient(fallbackBase).request<T>(endpoint, {
          ...options,
          _hasFallenBack: true,
        });
      }
    }

    let url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(restOptions.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(customHeaders as Record<string, string>),
    };

    if (!skipAuth && !headers['Authorization']) {
      const token = await authStorage.getAccessToken();
      if (token) {
        if (Date.now() < supabaseOverrideUntil) {
          const sbToken = await getActiveSupabaseAccessToken();
          headers['Authorization'] = `Bearer ${sbToken || token}`;
        } else {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } else {
        throw new Error('Not authenticated: No active session');
      }
    }

    try {
      const response = await fetch(url, {
        ...restOptions,
        headers,
      });

      // 401 Unauthorized handling with single refresh mutex
      if (response.status === 401 && !skipAuth && !_isRetry) {
        if (_permissionRetried) {
          supabaseOverrideUntil = 0;
        }
        if (__DEV__) console.log(`[ApiClient] 401 on ${endpoint} -> Initiating token refresh`);
        const refreshed = await this.executeSingleRefresh();
        if (refreshed) {
          const newToken = await authStorage.getAccessToken();
          if (newToken) {
            headers['Authorization'] = `Bearer ${newToken}`;
            return await this.request<T>(endpoint, {
              ...options,
              _isRetry: true,
              headers,
            });
          }
        } else {
          await authStorage.clear();
          if (this.onUnauthorizedCallback) {
            this.onUnauthorizedCallback();
          }
          throw new Error('Session expired: Please log in again');
        }
      }

      // If 404 on current base URL, fallback between production and local dev server
      if (response.status === 404 && !_hasFallenBack) {
        const fallbackBase = getFallbackBaseUrl(this.baseUrl);

        if (fallbackBase) {
          if (__DEV__) {
            console.log(
              `[ApiClient] Route 404 on ${this.baseUrl}${endpoint} -> Auto-retrying on ${fallbackBase}${endpoint}`
            );
          }
          try {
            return await this.createFallbackClient(fallbackBase).request<T>(endpoint, {
              ...options,
              _hasFallenBack: true,
            });
          } catch (fallbackError: any) {
            if (!isNetworkFailureMessage(fallbackError?.message)) {
              throw fallbackError;
            }
          }
        }
      }

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const errMessage = errorBody.message || `HTTP ${response.status}: ${response.statusText}`;

        // Remote BFF JWTs for 'Agent' accounts can lack social.read/social.post; Hub Supabase tokens carry full user context
        if (
          response.status === 403 &&
          !skipAuth &&
          !_permissionRetried &&
          typeof errMessage === 'string' &&
          errMessage.toLowerCase().includes('missing required permission')
        ) {
          const sbToken = await getActiveSupabaseAccessToken();
          const currentBearer = headers['Authorization']?.replace(/^Bearer\s+/i, '').trim();
          if (sbToken && sbToken !== currentBearer) {
            supabaseOverrideUntil = Date.now() + 5 * 60_000;
            return await this.request<T>(endpoint, {
              ...options,
              _permissionRetried: true,
              headers: {
                ...(customHeaders as Record<string, string>),
                Authorization: `Bearer ${sbToken}`,
              },
            });
          }
        }

        throw new Error(errMessage);
      }

      return await response.json();
    } catch (error: any) {
      // Auto-fallback on network failure if we haven't already tried the fallback host
      const isNetworkError = isNetworkFailureMessage(error?.message);

      if (!_hasFallenBack && isNetworkError) {
        const fallbackBase = getFallbackBaseUrl(this.baseUrl);

        if (fallbackBase) {
          if (!this.baseUrl.includes('app.getaipilot.com')) {
            skipLocalBffUntil = Date.now() + 30_000;
          }
          try {
            return await this.createFallbackClient(fallbackBase).request<T>(endpoint, {
              ...options,
              _hasFallenBack: true,
            });
          } catch (fallbackError: any) {
            // Surface the fallback server's real error (e.g. 401/Session expired/502/504) instead of masking it with localhost's "Failed to fetch"
            throw fallbackError;
          }
        }
      }

      if (__DEV__ && !error?.message?.includes('Not authenticated') && !endpoint.includes('heartbeat') && !endpoint.includes('device-sessions')) {
        console.warn(`[ApiClient] Request to ${endpoint} failed:`, error?.message);
      }
      throw error;
    }
  }

  /**
   * Thread-safe / Mutex-protected single refresh exchange
   */
  private async executeSingleRefresh(): Promise<boolean> {
    if (this.refreshPromise) {
      return await this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = await authStorage.getRefreshToken();
        if (!refreshToken) {
          return false;
        }

        const attemptRefresh = async (baseUrl: string) =>
          fetch(`${baseUrl}/mobile/v1/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

        let response: Response;
        try {
          response = await attemptRefresh(this.baseUrl);
        } catch (refreshNetErr: any) {
          const fallbackBase = getFallbackBaseUrl(this.baseUrl);
          if (!fallbackBase || !isNetworkFailureMessage(refreshNetErr?.message)) {
            throw refreshNetErr;
          }
          response = await attemptRefresh(fallbackBase);
        }

        if (response.ok) {
          const data = await response.json();
          if (data.accessToken) {
            await authStorage.setAccessToken(data.accessToken);
            if (data.refreshToken) {
              await authStorage.setRefreshToken(data.refreshToken);
            }
            if (__DEV__) console.log('[ApiClient] Token refresh succeeded');
            return true;
          }
        }
        return false;
      } catch (e) {
        if (__DEV__) console.warn('[ApiClient] Token refresh error:', e);
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return await this.refreshPromise;
  }

  public get<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public put<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(BFF_BASE_URL);
