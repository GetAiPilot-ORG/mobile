import { create } from "zustand";
import { supabase } from "../../lib/supabase";
import { apiClient } from "../api/client";
import { authStorage } from "../storage/authStorage";
import { getDeviceLoginInfo } from "../../lib/device-session";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "Owner" | "Admin" | "Manager" | "Agent";
  organizationId: string;
  permissions: string[];
  phone?: string;
  created_at?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    [key: string]: any;
  };
}

export interface TenantMapping {
  id: string;
  hub_org_id: string;
  whatsapp_org_id: string;
  voice_workspace_id: string;
  social_workspace_id: string;
  telegram_user_id: string;
}

export type AuthStatus = "hydrating" | "authenticated" | "unauthenticated";

interface AuthState {
  user: User | null;
  tenantMapping: TenantMapping | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authStatus: AuthStatus;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Wire 401 callback from ApiClient to reset auth store cleanly
  apiClient.setOnUnauthorized(() => {
    set({
      user: null,
      tenantMapping: null,
      isAuthenticated: false,
      isLoading: false,
      authStatus: "unauthenticated",
    });
  });

  return {
    user: null,
    tenantMapping: null,
    isAuthenticated: false,
    isLoading: true,
    authStatus: "hydrating",

    login: async (email: string, password?: string) => {
      set({ isLoading: true });
      try {
        const supabaseAuth = await supabase.auth.signInWithPassword({
          email,
          password: password || "Password123!",
        });
        if (supabaseAuth.error) throw supabaseAuth.error;

        const device = await getDeviceLoginInfo();
        const data = await apiClient.post(
          "/mobile/v1/auth/login",
          {
            email,
            password: password || "Password123!",
            device,
          },
          { skipAuth: true },
        );

        await authStorage.setTokens(data.accessToken, data.refreshToken);

        set({
          user: data.user,
          tenantMapping: data.tenantMapping,
          isAuthenticated: true,
          isLoading: false,
          authStatus: "authenticated",
        });
      } catch (e) {
        set({ isLoading: false, authStatus: "unauthenticated" });
        throw e;
      }
    },

    logout: async () => {
      try {
        await apiClient.post("/mobile/v1/auth/logout", {}).catch(() => {});
      } finally {
        // This removes the Supabase session from this installation only. It
        // must not sign the user out of their other logged-in devices.
        await supabase.auth.signOut({ scope: "local" }).catch(() => {});
        await authStorage.clear();
        set({
          user: null,
          tenantMapping: null,
          isAuthenticated: false,
          isLoading: false,
          authStatus: "unauthenticated",
        });
      }
    },

    loadSession: async () => {
      set({ isLoading: true, authStatus: "hydrating" });
      try {
        const token = await authStorage.getAccessToken();
        if (!token) {
          set({
            user: null,
            tenantMapping: null,
            isAuthenticated: false,
            isLoading: false,
            authStatus: "unauthenticated",
          });
          return;
        }

        const me = await apiClient.get<any>("/mobile/v1/auth/me");
        set({
          user: {
            id: me.id,
            email: me.email,
            name: me.name,
            role: me.role,
            organizationId: me.organizationId,
            permissions: me.permissions,
          },
          tenantMapping: me.tenantMapping,
          isAuthenticated: true,
          isLoading: false,
          authStatus: "authenticated",
        });
      } catch (e) {
        await authStorage.clear();
        set({
          user: null,
          tenantMapping: null,
          isAuthenticated: false,
          isLoading: false,
          authStatus: "unauthenticated",
        });
      }
    },

    hasPermission: (permission: string) => {
      const { user } = get();
      if (!user || !user.permissions) return false;
      if (user.permissions.includes("*")) return true;
      return user.permissions.includes(permission);
    },
  };
});
