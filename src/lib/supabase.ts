import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const customStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') {
        return null;
      }
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') {
        return;
      }
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // ignore
      }
      return;
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') {
        return;
      }
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
      return;
    }
    return AsyncStorage.removeItem(key);
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// During server-side rendering `window` is undefined and React Native
// AsyncStorage may attempt to access globals that aren't available.
// Provide a no-op async storage implementation for server runtime.
const isServer = typeof window === 'undefined';

const noopAsyncStorage = {
  getItem: async (_key: string) => null,
  setItem: async (_key: string, _value: string) => {},
  removeItem: async (_key: string) => {},
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: isServer ? noopAsyncStorage : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web' && !isServer,
  },
});

