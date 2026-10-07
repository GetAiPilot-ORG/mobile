import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = "https://gkyilicraflkgcfgqypc.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdreWlsaWNyYWZsa2djZmdxeXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwODM3NDYsImV4cCI6MjEwMTY1OTc0Nn0.o_k59maBpY-ibLrldlRu3tGUSL0lxcIMDMRSAdkMBVU";

if (!supabaseUrl) {
  throw new Error("Missing EXPO_PUBLIC_VOICE_PILOT_URL in .env");
}

if (!supabaseAnonKey) {
  throw new Error("Missing EXPO_PUBLIC_VOICE_PILOT_ANON_KEY in .env");
}

export const voiceSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false,
  },
});
