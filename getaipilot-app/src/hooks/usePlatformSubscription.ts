import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../core/api/client";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { formatPlanLabel } from "../lib/utils";

export function usePlatformSubscription() {
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ["platform-subscription", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return null;

      // 1. Primary: Fetch via BFF API (bypasses RLS safely server-side)
      try {
        const bffRes = await apiClient.get<any>("/mobile/v1/user/subscription");
        if (bffRes && (bffRes.sub || bffRes.isAdmin !== undefined)) {
          return {
            sub: bffRes.sub,
            isAdmin: bffRes.isAdmin || false,
          };
        }
      } catch (e) {
        console.warn("[usePlatformSubscription] BFF sub fetch error, falling back:", e);
      }

      // 2. Fallback: Direct Supabase client
      const [subRes, profileRes] = await Promise.all([
        supabase
          .from("app_user_subscriptions")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("is_admin, role, subscription")
          .eq("id", userId)
          .maybeSingle()
      ]);

      return {
        sub: subRes.data,
        isAdmin: Boolean(profileRes.data?.is_admin === true || profileRes.data?.role?.toLowerCase() === 'admin'),
      };
    },
  });

  const subData = data?.sub || null;
  const isAdmin = data?.isAdmin || false;

  const now = Date.now();
  const startedAt = subData?.started_at ? new Date(subData.started_at).getTime() : null;
  const expiresAt = subData?.expires_at ? new Date(subData.expires_at).getTime() : null;

  // Real active subscription check based on actual database records in app_user_subscriptions
  const hasValidStatus = Boolean(
    subData &&
    (subData.subscription_status === 'active' ||
      subData.subscription_status === 'authenticated' ||
      subData.subscription_status === 'created' ||
      subData.status === 'active')
  );
  const isActive = Boolean(hasValidStatus && expiresAt && expiresAt > now);

  const isTrial = isActive && Boolean(
    (subData?.plan_id || subData?.plan_label || "")
      .toLowerCase()
      .includes("free_trial")
  );
  const trialDaysLeft = isTrial && expiresAt
    ? Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)))
    : null;

  // Sync DB status if expiration timestamp has passed but status is still marked active
  useEffect(() => {
    if (
      userId &&
      subData &&
      !isAdmin &&
      expiresAt &&
      expiresAt <= now &&
      (subData.subscription_status === 'active' ||
        subData.subscription_status === 'authenticated' ||
        subData.subscription_status === 'created')
    ) {
      supabase
        .from('app_user_subscriptions')
        .update({ subscription_status: 'expired' })
        .eq('user_id', userId)
        .then(({ error }) => {
          if (error) console.warn('Failed to sync expired subscription status in DB:', error);
        });
    }
  }, [userId, subData, isAdmin, expiresAt, now]);


  const rawStatus = subData?.subscription_status || null;
  const subscriptionStatus = isActive ? (rawStatus || "active") : (expiresAt && expiresAt <= now ? "expired" : "none");
  const razorpaySubscriptionId = subData?.razorpay_subscription_id || null;
  const isRecurring = isActive && Boolean(razorpaySubscriptionId);
  
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["platform-subscription"] });
  };

  const planText = `${subData?.plan_id || ''} ${subData?.plan_label || ''}`.toLowerCase();
  const isAllInOne = isAdmin || (isActive && (
    planText.includes("bundle") ||
    planText.includes("all_in_one") ||
    planText.includes("gap_pro") ||
    planText.includes("gap_max") ||
    planText.includes("enterprise") ||
    planText.includes("platinum")
  ));

  const hasWhatsApp = isAllInOne || (isActive && (planText.includes("whatsapp") || planText.startsWith("wa_")));
  const hasTelegram = isAllInOne || (isActive && (planText.includes("telegram") || planText.includes("tg_")));
  const hasCRM = isAllInOne || (isActive && planText.includes("crm"));
  const hasSocial = isAllInOne || (isActive && (planText.includes("social") || planText.includes("spstarter") || planText.includes("spgrowth") || planText.includes("slite")));
  const hasVoice = isAllInOne || (isActive && (planText.includes("voice") || planText.includes("calling") || planText.includes("call_")));

  return {
    isActive,
    loading: authLoading || Boolean(userId && isLoading),
    plan: isActive ? (subData?.plan_id || null) : null,
    planLabel: isActive ? (formatPlanLabel(subData?.plan_label, subData?.plan_id) || 'Pro') : "Free",
    startedAt: startedAt ? new Date(startedAt).toISOString() : null,
    expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    isTrial,
    trialDaysLeft,
    trialEnded: Boolean(isTrial && expiresAt && expiresAt <= now),
    planExpired: Boolean(expiresAt && expiresAt <= now),
    isAdmin,
    subscriptionStatus,
    refresh,
    hasWhatsApp,
    hasTelegram,
    hasCRM,
    hasSocial,
    hasVoice,
  };
}
