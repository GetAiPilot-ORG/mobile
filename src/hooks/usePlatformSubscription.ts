import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

      const [subRes, profileRes] = await Promise.all([
        supabase
          .from("app_user_subscriptions")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", userId)
          .maybeSingle()
      ]);

      if (subRes.error && subRes.error.code !== "PGRST116") {
        console.warn("Sub error", subRes.error);
      }
      return {
        sub: subRes.data,
        isAdmin: profileRes.data?.is_admin || false
      };
    },
  });

  const subData = data?.sub || null;
  const isAdmin = data?.isAdmin || false;

  const now = Date.now();
  const startedAt = isAdmin && subData
    ? (subData.started_at ? new Date(subData.started_at).getTime() : new Date('2026-06-01T00:00:00.000Z').getTime())
    : (subData?.started_at ? new Date(subData.started_at).getTime() : null);

  const expiresAt = isAdmin && subData
    ? (subData.expires_at ? new Date(subData.expires_at).getTime() : new Date('2036-06-01T00:00:00.000Z').getTime())
    : (subData?.expires_at ? new Date(subData.expires_at).getTime() : null);

  const isActive = isAdmin && subData ? true : (expiresAt ? expiresAt > now : false);
  const isTrial = isAdmin && subData
    ? false
    : (subData?.plan_id || subData?.plan_label || "")
        .toLowerCase()
        .includes("free_trial");
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


  const rawStatus = isAdmin && subData ? "active" : (subData?.subscription_status || null);
  const subscriptionStatus = isAdmin && subData
    ? "active"
    : (expiresAt && expiresAt <= now ? "expired" : rawStatus);
  const razorpaySubscriptionId = isAdmin && subData ? "admin_mock_subscription" : (subData?.razorpay_subscription_id || null);
  const isRecurring = isAdmin && subData ? true : Boolean(razorpaySubscriptionId);
  
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["platform-subscription"] });
  };

  const plans = isActive && subData?.plan_id ? [subData.plan_id] : [];

  const hasWhatsApp = isActive && plans.some(p => p.toLowerCase().includes("whatsapp") || p.toLowerCase().startsWith("wa_") || p.toLowerCase().includes("bundle") || p.toLowerCase().includes("all_in_one"));
  const hasTelegram = isActive && plans.some(p => p.toLowerCase().includes("telegram") || p.toLowerCase().startsWith("tg_") || p.toLowerCase().includes("bundle") || p.toLowerCase().includes("all_in_one"));
  const hasCRM = isActive && plans.some(p => p.toLowerCase().includes("crm") || p.toLowerCase().includes("bundle") || p.toLowerCase().includes("all_in_one"));
  const hasSocial = isActive && plans.some(p => p.toLowerCase().includes("social") || p.toLowerCase().includes("bundle") || p.toLowerCase().includes("all_in_one"));
  const hasVoice = isActive && plans.some(p => p.toLowerCase().includes("voice") || p.toLowerCase().includes("calling") || p.toLowerCase().includes("bundle") || p.toLowerCase().includes("all_in_one"));

  return {
    isActive,
    loading: authLoading || Boolean(userId && isLoading),
    plan: isAdmin && subData ? (subData.plan_id || 'all_in_one_bundle_monthly') : (isActive ? (subData?.plan_id || null) : null),
    planLabel: isActive ? (isAdmin && subData ? (formatPlanLabel(subData.plan_label, subData.plan_id) || 'GAP Core') : formatPlanLabel(subData?.plan_label, subData?.plan_id)) : "Free",
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
