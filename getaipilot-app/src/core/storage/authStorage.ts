import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'gap_access_token';
const REFRESH_TOKEN_KEY = 'gap_refresh_token';

export interface AuthTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

export class AuthStorage {
  public static async getAccessToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(ACCESS_TOKEN_KEY);
        }
        return null;
      }
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch (e) {
      if (__DEV__) console.warn('[AuthStorage] getAccessToken error:', e);
      return null;
    }
  }

  public static async setAccessToken(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
        }
      } else {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
      }
    } catch (e) {
      if (__DEV__) console.warn('[AuthStorage] setAccessToken error:', e);
    }
  }

  public static async getRefreshToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(REFRESH_TOKEN_KEY);
        }
        return null;
      }
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (e) {
      if (__DEV__) console.warn('[AuthStorage] getRefreshToken error:', e);
      return null;
    }
  }

  public static async setRefreshToken(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
        }
      } else {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
      }
    } catch (e) {
      if (__DEV__) console.warn('[AuthStorage] setRefreshToken error:', e);
    }
  }

  public static async getSession(): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.getAccessToken(),
      this.getRefreshToken(),
    ]);
    return { accessToken, refreshToken };
  }

  public static async setTokens(accessToken: string, refreshToken?: string): Promise<void> {
    await this.setAccessToken(accessToken);
    if (refreshToken) {
      await this.setRefreshToken(refreshToken);
    }
  }

  public static async clear(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(ACCESS_TOKEN_KEY);
          window.localStorage.removeItem(REFRESH_TOKEN_KEY);
          // Clean legacy keys if present
          window.localStorage.removeItem('access_token');
          window.localStorage.removeItem('refresh_token');
        }
      } else {
        await Promise.all([
          SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY).catch(() => {}),
          SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {}),
          SecureStore.deleteItemAsync('access_token').catch(() => {}),
          SecureStore.deleteItemAsync('refresh_token').catch(() => {}),
        ]);
      }
    } catch (e) {
      if (__DEV__) console.warn('[AuthStorage] clear error:', e);
    }
  }
}

export const authStorage = AuthStorage;
