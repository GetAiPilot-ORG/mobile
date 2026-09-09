import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

const isClient = typeof window !== "undefined";

const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (!isClient) return null;
    if (Platform.OS === "web") {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (!isClient) return;
    if (Platform.OS === "web") {
      try {
        window.localStorage.setItem(key, value);
      } catch {}
      return;
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (!isClient) return;
    if (Platform.OS === "web") {
      try {
        window.localStorage.removeItem(key);
      } catch {}
      return;
    }
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: safeStorage,
    autoRefreshToken: isClient,
    persistSession: isClient,
    detectSessionInUrl: false,
  },
});
