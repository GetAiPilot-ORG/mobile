import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { authStorage } from '../storage/authStorage';

/**
 * Dynamically resolves the BFF backend URL across Web, Android Emulator,
 * Physical LAN device (via Expo Metro host), and Production env.
 */
export function resolveBffBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_BFF_URL) {
    return process.env.EXPO_PUBLIC_BFF_URL;
  }

  if (Platform.OS === 'web') {
    return 'http://localhost:4000';
  }

  // Physical Android device or iOS on same Wi-Fi LAN
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:4000`;
    }
  }

  // Android emulator loopback alias
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000';
  }

  return 'http://localhost:4000';
}

export const BFF_BASE_URL = resolveBffBaseUrl();

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean;
  _isRetry?: boolean;
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

  public async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, skipAuth, _isRetry, headers: customHeaders, ...restOptions } = options;

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
      ...(restOptions.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(customHeaders as Record<string, string>),
    };

    if (!skipAuth) {
      const token = await authStorage.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
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

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      if (__DEV__ && !error?.message?.includes('Not authenticated')) {
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

        const response = await fetch(`${this.baseUrl}/mobile/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

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

