import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { getDeviceLoginInfo } from "../../lib/device-session";
import { supabase } from "../../lib/supabase";
import { apiClient } from "../api/client";
import { authStorage } from "../storage/authStorage";
import { getPendingReferralCode, handlePendingReferral } from "../../services/referralService";

const CACHED_USER_KEY = "@gap_cached_user";

function isSyntheticBffEmail(email?: string | null): boolean {
  if (!email) return false;
  return (
    (email.endsWith("@getaipilot.com") && /^[0-9a-f-]{36}@/i.test(email)) ||
    email.endsWith("@truecaller.getaipilot.in")
  );
}

function isUuidString(val?: string | null): boolean {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
}

async function resolveProfileFallbacks(
  userId: string,
  rawEmail?: string | null,
  rawName?: string | null,
  rawPhone?: string | null
): Promise<{ email: string; name: string; phone?: string }> {
  let email = rawEmail && !isSyntheticBffEmail(rawEmail) ? rawEmail : "";
  let name = rawName && !isUuidString(rawName) ? rawName : "";
  let phone = rawPhone || undefined;

  if (!email || !name || !phone) {
    try {
      const { data: p } = await supabase
        .from("profiles")
        .select("email, phone, mobile_number, full_name")
        .eq("id", userId)
        .maybeSingle();
      if (p) {
        if (!email && p.email && !isSyntheticBffEmail(p.email)) {
          email = p.email;
        }
        if (!name && p.full_name && !isUuidString(p.full_name)) {
          name = p.full_name;
        }
        if (!phone) {
          phone = p.phone || p.mobile_number || undefined;
        }
      }
    } catch {}
  }

  if (!name) {
    name = (email ? email.split("@")[0] : "") || phone || "User";
  }

  return { email, name, phone };
}

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
  onboardingCompleted: boolean | null;
  setOnboardingCompleted: (completed: boolean) => void;
  checkOnboardingStatus: (userId?: string) => Promise<boolean>;
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
      onboardingCompleted: null,
    });
  });

  return {
    user: null,
    tenantMapping: null,
    isAuthenticated: false,
    isLoading: true,
    authStatus: "hydrating",
    onboardingCompleted: null,

    setOnboardingCompleted: (completed: boolean) => {
      const uid = get().user?.id;
      if (uid && completed) {
        AsyncStorage.setItem(`onboarding_completed_${uid}`, "true").catch(() => {});
      }
      if (completed) {
        AsyncStorage.setItem("@onboarding_completed_global", "true").catch(() => {});
      }
      set({ onboardingCompleted: completed });
    },

    checkOnboardingStatus: async (userId?: string) => {
      const uid = userId || get().user?.id;
      if (!uid) {
        set({ onboardingCompleted: false });
        return false;
      }

      // 1. Instant check from per-user local cache
      try {
        const cached = await AsyncStorage.getItem(`onboarding_completed_${uid}`);
        if (cached === "true") {
          set({ onboardingCompleted: true });
          return true;
        }
      } catch {}

      // 2. Query Supabase profile
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("onboarding_completed, account_type, business_name, full_name, first_name")
          .eq("id", uid)
          .maybeSingle();

        if (error) {
          console.warn("[AuthStore] Notice checking onboarding status:", error.message);
          // Don't lock out logged-in users on network/RLS error: default to complete
          set({ onboardingCompleted: true });
          return true;
        }

        const isComplete = Boolean(
          data?.onboarding_completed ||
          data?.account_type ||
          data?.business_name ||
          data?.full_name ||
          data?.first_name
        );

        if (isComplete) {
          await AsyncStorage.setItem(`onboarding_completed_${uid}`, "true").catch(() => {});
          await AsyncStorage.setItem("@onboarding_completed_global", "true").catch(() => {});
        } else {
          await AsyncStorage.removeItem("@onboarding_completed_global").catch(() => {});
        }

        set({ onboardingCompleted: isComplete });
        return isComplete;
      } catch (err) {
        console.warn("[AuthStore] Failed to check onboarding status:", err);
        set({ onboardingCompleted: true });
        return true;
      }
    },

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

        const isOnboarded = await get().checkOnboardingStatus(userObj.id);

        set({
          user: userObj,
          tenantMapping: bffData?.tenantMapping || null,
          isAuthenticated: true,
          isLoading: false,
          authStatus: "authenticated",
          onboardingCompleted: true,
        });
        AsyncStorage.setItem(`onboarding_completed_${userObj.id}`, "true").catch(() => {});
        AsyncStorage.setItem("@onboarding_completed_global", "true").catch(() => {});

        // Auto-link any pending referral code captured on phone
        getPendingReferralCode().then((code) => {
          if (code) {
            handlePendingReferral(code).catch((e) => {
              console.warn("[AuthStore] Pending referral linking note:", e);
            });
          }
        }).catch(() => {});
      } catch (e) {
        set({ isLoading: false, authStatus: "unauthenticated", onboardingCompleted: null });
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
        const resolved = await resolveProfileFallbacks(
          meData?.id || fallbackUser?.id || "user",
          meData?.email || fallbackUser?.email,
          meData?.name || fallbackUser?.user_metadata?.full_name,
          meData?.phone || fallbackUser?.phone
        );

        const userObj: User = meData
          ? {
              id: meData.id,
              email: resolved.email,
              name: resolved.name,
              role: meData.role,
              organizationId: meData.organizationId,
              permissions: meData.permissions,
              phone: resolved.phone,
            }
          : {
              id: fallbackUser?.id || "user",
              email: resolved.email,
              name: resolved.name,
              role: (fallbackUser?.app_metadata?.role as any) || "Agent",
              organizationId: "",
              permissions: ["*"],
              phone: resolved.phone,
              user_metadata: fallbackUser?.user_metadata,
            };

        AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(userObj)).catch(
          () => {},
        );

        const isOnboarded = await get().checkOnboardingStatus(userObj.id);

        set({
          user: userObj,
          tenantMapping: meData?.tenantMapping || null,
          isAuthenticated: true,
          isLoading: false,
          authStatus: "authenticated",
          onboardingCompleted: isOnboarded,
        });
        if (isOnboarded) {
          AsyncStorage.setItem(`onboarding_completed_${userObj.id}`, "true").catch(() => {});
          AsyncStorage.setItem("@onboarding_completed_global", "true").catch(() => {});
        }

        // Auto-link any pending referral code captured on phone
        getPendingReferralCode().then((code) => {
          if (code) {
            handlePendingReferral(code).catch((e) => {
              console.warn("[AuthStore] Pending referral linking note:", e);
            });
          }
        }).catch(() => {});
      } catch (e) {
        set({ isLoading: false });
        throw e;
      }
    },

    logout: async () => {
      const currentUser = get().user;
      const uid = currentUser?.id;

      try {
        if (uid) {
          // Clear push token from user profile in Supabase so this account stops receiving pushes on this device
          const cachedToken = await AsyncStorage.getItem('@getaipilot_expo_push_token').catch(() => null);
          const { error: pushTokenError } = await supabase
            .from('profiles')
            .update({ push_token: null })
            .eq('id', uid);
          if (pushTokenError) console.warn('[Auth] Could not clear push token:', pushTokenError.message);

          if (cachedToken) {
            try {
              await supabase
                .from('user_push_tokens')
                .delete()
                .eq('user_id', uid)
                .eq('push_token', cachedToken);
            } catch {
              // noop
            }
          }
        }
        await apiClient.post("/mobile/v1/auth/logout", {}).catch(() => {});
      } finally {
        await supabase.auth.signOut({ scope: "local" }).catch(() => {});
        await authStorage.clear();
        await AsyncStorage.multiRemove([
          CACHED_USER_KEY,
          "@getaipilot_expo_push_token",
          "@getaipilot_push_token_synced_user",
          "@onboarding_completed_global",
        ]).catch(() => {});
        set({
          user: null,
          tenantMapping: null,
          isAuthenticated: false,
          isLoading: false,
          authStatus: "unauthenticated",
          onboardingCompleted: null,
        });
      }
    },

    loadSession: async () => {
      set({ isLoading: true, authStatus: "hydrating" });
      try {
        let token = await authStorage.getAccessToken();
        if (!token) {
          // Check if Supabase has an active session before declaring unauthenticated
          const { data: sbData } = await supabase.auth
            .getSession()
            .catch(() => ({ data: { session: null } }));
          if (sbData?.session?.access_token) {
            await get().syncSession(sbData.session);
            return;
          }

          set({
            user: null,
            tenantMapping: null,
            isAuthenticated: false,
            isLoading: false,
            authStatus: "unauthenticated",
            onboardingCompleted: null,
          });
          return;
        }

        try {
          const me = await apiClient.get<any>("/mobile/v1/auth/me");
          const resolved = await resolveProfileFallbacks(
            me.id,
            me.email,
            me.name,
            me.phone
          );
          const userObj: User = {
            id: me.id,
            email: resolved.email,
            name: resolved.name,
            role: me.role,
            organizationId: me.organizationId,
            permissions: me.permissions,
            phone: resolved.phone,
          };
          AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(userObj)).catch(
            () => {},
          );
          const isOnboarded = await get().checkOnboardingStatus(userObj.id);
          if (isOnboarded) {
            AsyncStorage.setItem(`onboarding_completed_${userObj.id}`, "true").catch(() => {});
            AsyncStorage.setItem("@onboarding_completed_global", "true").catch(() => {});
          }
          set({
            user: userObj,
            tenantMapping: me.tenantMapping,
            isAuthenticated: true,
            isLoading: false,
            authStatus: "authenticated",
            onboardingCompleted: isOnboarded,
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
              onboardingCompleted: null,
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
              const isOnboarded = await get().checkOnboardingStatus(cachedUser.id);
              AsyncStorage.setItem(`onboarding_completed_${cachedUser.id}`, "true").catch(() => {});
              AsyncStorage.setItem("@onboarding_completed_global", "true").catch(() => {});
              set({
                user: cachedUser,
                tenantMapping: null,
                isAuthenticated: true,
                isLoading: false,
                authStatus: "authenticated",
                onboardingCompleted: true,
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
            const isOnboarded = await get().checkOnboardingStatus(restoredUser.id);
            AsyncStorage.setItem(`onboarding_completed_${restoredUser.id}`, "true").catch(() => {});
            AsyncStorage.setItem("@onboarding_completed_global", "true").catch(() => {});
            set({
              user: restoredUser,
              tenantMapping: null,
              isAuthenticated: true,
              isLoading: false,
              authStatus: "authenticated",
              onboardingCompleted: true,
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
            onboardingCompleted: null,
          });
        }
      } catch (e) {
        set({
          user: null,
          tenantMapping: null,
          isAuthenticated: false,
          isLoading: false,
          authStatus: "unauthenticated",
          onboardingCompleted: null,
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
