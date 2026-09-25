import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { getDeviceLoginInfo } from "../../lib/device-session";
import { supabase } from "../../lib/supabase";
import { apiClient } from "../api/client";
import { authStorage } from "../storage/authStorage";

const CACHED_USER_KEY = "@gap_cached_user";

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
  syncSession: (session: {
    access_token: string;
    refresh_token?: string;
    user?: any;
  }) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Wire 401 callback from ApiClient to reset auth store cleanly
  apiClient.setOnUnauthorized(() => {
    AsyncStorage.removeItem(CACHED_USER_KEY).catch(() => {});
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
      if (!password) {
        set({ isLoading: false });
        throw new Error("Password is required to sign in.");
      }

      try {
        const supabaseAuth = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        console.log("[AuthStore] Supabase auth response:", supabaseAuth);
        if (supabaseAuth.error) throw supabaseAuth.error;

        const device = await getDeviceLoginInfo();
        let bffData: any = null;
        try {
          bffData = await apiClient.post(
            "/mobile/v1/auth/login",
            {
              email,
              password,
              device,
            },
            { skipAuth: true },
          );
        } catch (bffErr: any) {
          if (__DEV__)
            console.warn("[AuthStore] BFF login fallback:", bffErr?.message);
        }

        const accessToken =
          bffData?.accessToken || supabaseAuth.data.session?.access_token;
        const refreshToken =
          bffData?.refreshToken || supabaseAuth.data.session?.refresh_token;

        if (accessToken) {
          await authStorage.setTokens(accessToken, refreshToken);
        }

        const userObj: User = bffData?.user || {
          id: supabaseAuth.data.user?.id || "user",
          email: supabaseAuth.data.user?.email || email,
          name:
            supabaseAuth.data.user?.user_metadata?.full_name ||
            email.split("@")[0],
          role: "Agent",
          organizationId: "",
          permissions: ["*"],
          user_metadata: supabaseAuth.data.user?.user_metadata,
        };

        AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(userObj)).catch(
          () => {},
        );

        set({
          user: userObj,
          tenantMapping: bffData?.tenantMapping || null,
          isAuthenticated: true,
          isLoading: false,
          authStatus: "authenticated",
        });
      } catch (e) {
        set({ isLoading: false, authStatus: "unauthenticated" });
        throw e;
      }
    },

    syncSession: async (session: {
      access_token: string;
      refresh_token?: string;
      user?: any;
    }) => {
      set({ isLoading: true });
      try {
        if (session.access_token) {
          await authStorage.setTokens(
            session.access_token,
            session.refresh_token,
          );
        }

        let meData: any = null;
        try {
          meData = await apiClient.get<any>("/mobile/v1/auth/me");
        } catch (e) {
          if (__DEV__)
            console.warn(
              "[AuthStore] BFF /auth/me unavailable during syncSession:",
              e,
            );
        }

        const fallbackUser = session.user;
        const userObj: User = meData
          ? {
              id: meData.id,
              email: meData.email,
              name: meData.name,
              role: meData.role,
              organizationId: meData.organizationId,
              permissions: meData.permissions,
            }
          : {
              id: fallbackUser?.id || "user",
              email: fallbackUser?.email || "",
              name:
                fallbackUser?.user_metadata?.full_name ||
                fallbackUser?.email?.split("@")[0] ||
                "User",
              role: (fallbackUser?.app_metadata?.role as any) || "Agent",
              organizationId: "",
              permissions: ["*"],
              user_metadata: fallbackUser?.user_metadata,
            };

        AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(userObj)).catch(
          () => {},
        );

        set({
          user: userObj,
          tenantMapping: meData?.tenantMapping || null,
          isAuthenticated: true,
          isLoading: false,
          authStatus: "authenticated",
        });
      } catch (e) {
        set({ isLoading: false });
        throw e;
      }
    },

    logout: async () => {
      try {
        await apiClient.post("/mobile/v1/auth/logout", {}).catch(() => {});
      } finally {
        await supabase.auth.signOut({ scope: "local" }).catch(() => {});
        await authStorage.clear();
        await AsyncStorage.removeItem(CACHED_USER_KEY).catch(() => {});
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

        try {
          const me = await apiClient.get<any>("/mobile/v1/auth/me");
          const userObj: User = {
            id: me.id,
            email: me.email,
            name: me.name,
            role: me.role,
            organizationId: me.organizationId,
            permissions: me.permissions,
          };
          AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(userObj)).catch(
            () => {},
          );
          set({
            user: userObj,
            tenantMapping: me.tenantMapping,
            isAuthenticated: true,
            isLoading: false,
            authStatus: "authenticated",
          });
          return;
        } catch (apiErr: any) {
          const errMsg = (apiErr?.message || "").toLowerCase();
          const isAuthError =
            errMsg.includes("401") ||
            errMsg.includes("unauthorized") ||
            errMsg.includes("session expired") ||
            errMsg.includes("jwt expired");

          if (isAuthError) {
            // Truly invalid/expired token: clear storage
            await authStorage.clear();
            await AsyncStorage.removeItem(CACHED_USER_KEY).catch(() => {});
            set({
              user: null,
              tenantMapping: null,
              isAuthenticated: false,
              isLoading: false,
              authStatus: "unauthenticated",
            });
            return;
          }

          // Network failure or offline: attempt to restore cached user or Supabase session
          const cachedUserStr = await AsyncStorage.getItem(
            CACHED_USER_KEY,
          ).catch(() => null);
          if (cachedUserStr) {
            try {
              const cachedUser = JSON.parse(cachedUserStr);
              set({
                user: cachedUser,
                tenantMapping: null,
                isAuthenticated: true,
                isLoading: false,
                authStatus: "authenticated",
              });
              return;
            } catch {}
          }

          // Check if Supabase session is still valid locally
          const { data: sbSessionData } = await supabase.auth
            .getSession()
            .catch(() => ({ data: { session: null } }));
          if (sbSessionData?.session?.user) {
            const u = sbSessionData.session.user;
            const restoredUser: User = {
              id: u.id,
              email: u.email || "",
              name:
                u.user_metadata?.full_name || u.email?.split("@")[0] || "User",
              role: "Agent",
              organizationId: "",
              permissions: ["*"],
              user_metadata: u.user_metadata,
            };
            set({
              user: restoredUser,
              tenantMapping: null,
              isAuthenticated: true,
              isLoading: false,
              authStatus: "authenticated",
            });
            return;
          }

          // If no fallback available and offline, keep unauthenticated but don't delete token
          set({
            user: null,
            tenantMapping: null,
            isAuthenticated: false,
            isLoading: false,
            authStatus: "unauthenticated",
          });
        }
      } catch (e) {
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
