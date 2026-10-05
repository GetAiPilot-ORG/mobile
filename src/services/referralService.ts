import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";

export const STORAGE_KEY_PENDING_REFERRAL = "@pending_referral_code";

export interface ReferralMilestone {
  level: number;
  title: string;
  requiredReferrals: number;
  discountPercent: number;
  bonusPerk: string;
  description: string;
  badgeColor: string;
}

export const REFERRAL_MILESTONES: ReferralMilestone[] = [
  {
    level: 1,
    title: "Bronze Pilot",
    requiredReferrals: 1,
    discountPercent: 10,
    bonusPerk: "100 AI Voice Minutes",
    description: "10% OFF next purchase",
    badgeColor: "#D97706",
  },
  {
    level: 2,
    title: "Silver Aviator",
    requiredReferrals: 3,
    discountPercent: 25,
    bonusPerk: "Telegram Bot Suite (1 Mo)",
    description: "25% OFF next purchase",
    badgeColor: "#94A3B8",
  },
  {
    level: 3,
    title: "Gold Commander",
    requiredReferrals: 5,
    discountPercent: 50,
    bonusPerk: "Social Pilot Pro (1 Mo)",
    description: "50% OFF next purchase",
    badgeColor: "#EAB308",
  },
  {
    level: 4,
    title: "Diamond Ambassador",
    requiredReferrals: 10,
    discountPercent: 75,
    bonusPerk: "75% Free Pro Plan Month",
    description: "75% Free Pro Plan month",
    badgeColor: "#06B6D4",
  },
];

export interface UserReferralEligibility {
  canRefer: boolean;
  isSubscribed: boolean;
  hasPurchased: boolean;
  isPro: boolean;
  planName?: string;
  planLabel?: string;
  reason?: string;
}

export interface ReferralDiscountInfo {
  hasDiscount: boolean;
  discountPercent: number;
  rewardAmount: number;
  milestoneTitle?: string;
  bonusPerk?: string;
  isWelcomeDiscount?: boolean;
}

export interface ReferralEarnings {
  total_referrals: number;
  completed_referrals: number;
  pending_referrals: number;
  active_rewards_balance: number;
  lifetime_earnings: number;
  milestone: ReferralMilestone;
  nextMilestone: ReferralMilestone | null;
  progressPercent: number;
}

export const generateReferralCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const normalizeReferralCode = (code?: string | null): string => {
  if (!code) return "";
  return code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
};

export const savePendingReferralCode = async (code: string): Promise<boolean> => {
  const normalized = normalizeReferralCode(code);
  if (!normalized || normalized === "NULL" || normalized === "UNDEFINED") {
    return false;
  }
  try {
    await AsyncStorage.setItem(STORAGE_KEY_PENDING_REFERRAL, normalized);
    return true;
  } catch (e) {
    console.warn("[Referral] Error saving pending referral code:", e);
    return false;
  }
};

export const getPendingReferralCode = async (): Promise<string | null> => {
  try {
    const code = await AsyncStorage.getItem(STORAGE_KEY_PENDING_REFERRAL);
    return code ? normalizeReferralCode(code) : null;
  } catch (e) {
    console.warn("[Referral] Error getting pending referral code:", e);
    return null;
  }
};

export const clearPendingReferralCode = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY_PENDING_REFERRAL);
  } catch (e) {
    console.warn("[Referral] Error clearing pending referral code:", e);
  }
};

export const captureReferralParam = async (urlOrSearch: string): Promise<string | null> => {
  if (!urlOrSearch) return null;
  try {
    let search = "";
    if (urlOrSearch.includes("?")) {
      search = urlOrSearch.split("?")[1] || "";
    } else {
      search = urlOrSearch;
    }
    const params = new URLSearchParams(search);
    const code = params.get("ref") || params.get("referral");
    if (code) {
      const clean = normalizeReferralCode(code);
      if (clean && clean.length >= 3) {
        await savePendingReferralCode(clean);
        return clean;
      }
    }
  } catch (e) {
    console.warn("[Referral] Error capturing referral param:", e);
  }
  return null;
};

export const getReferralCode = async (userId: string): Promise<string | null> => {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("referral_code")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) return null;
    return data.referral_code || null;
  } catch (e) {
    console.warn("[Referral] Error getting referral code:", e);
    return null;
  }
};

export const getOrCreateReferralCode = async (userId: string, email?: string): Promise<string> => {
  if (!userId) return "";
  try {
    const existing = await getReferralCode(userId);
    if (existing) return existing;

    const newCode = "GAP" + userId.replace(/-/g, "").slice(0, 5).toUpperCase();
    const { error } = await supabase
      .from("profiles")
      .update({ referral_code: newCode })
      .eq("id", userId);

    if (error) {
      console.warn("[Referral] Could not update generated referral code:", error);
    }
    return newCode;
  } catch (e) {
    console.error("[Referral] Exception creating referral code:", e);
    return "GAP" + userId.slice(0, 5).toUpperCase();
  }
};

export const checkUserCanRefer = async (userId: string): Promise<UserReferralEligibility> => {
  if (!userId) {
    return {
      canRefer: false,
      isSubscribed: false,
      hasPurchased: false,
      isPro: false,
      reason: "User not authenticated",
    };
  }

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, is_admin, referral_code")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.is_admin) {
      return {
        canRefer: true,
        isSubscribed: true,
        hasPurchased: true,
        isPro: true,
        planLabel: "Admin Access (GAP Pro)",
      };
    }

    const { data: sub, error } = await supabase
      .from("app_user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.warn("[Referral] Error fetching subscription for referral eligibility:", error);
    }

    if (!sub) {
      return {
        canRefer: false,
        isSubscribed: false,
        hasPurchased: false,
        isPro: false,
        reason:
          "Referral program is exclusive to GAP Pro subscribers. Upgrade to GAP Pro to unlock your referral link.",
      };
    }

    const now = Date.now();
    const expiresAt = sub.expires_at ? new Date(sub.expires_at).getTime() : null;
    const curStatus = (sub.subscription_status || "").toLowerCase();
    const planId = (sub.plan_id || "").toLowerCase();
    const planLabel = (sub.plan_label || "").toLowerCase();

    const isProPlan =
      planId.includes("all_in_one") ||
      planId.includes("bundle") ||
      planId.includes("pro") ||
      planId.includes("gap_pro") ||
      planId.includes("scale") ||
      planId.includes("enterprise") ||
      planId.includes("gap_max") ||
      planLabel.includes("pro") ||
      planLabel.includes("enterprise") ||
      planLabel.includes("scale");

    const isTrial =
      planId.includes("free_trial") ||
      planLabel.includes("free_trial") ||
      curStatus === "trial";
    const isExpired =
      (expiresAt !== null && expiresAt <= now) ||
      curStatus === "expired" ||
      curStatus === "cancelled";
    const isActive = !isExpired && (expiresAt === null || expiresAt > now);

    const hasPaymentRecord = Boolean(
      sub.last_payment_id ||
      sub.razorpay_payment_id ||
      sub.razorpay_subscription_id ||
      (sub.plan_price_paise && Number(sub.plan_price_paise) > 0) ||
      (sub.raw && typeof sub.raw === "object" && (sub.raw as any).razorpay_payment_id)
    );

    const hasPurchased = hasPaymentRecord || (!isTrial && (isActive || sub.started_at !== null));
    const isSubscribed = isActive && !isTrial;
    const canRefer = isProPlan && (isSubscribed || hasPurchased);

    return {
      canRefer,
      isSubscribed,
      hasPurchased,
      isPro: isProPlan,
      planName: sub.plan_id || undefined,
      planLabel: sub.plan_label || (isProPlan ? "GAP Pro" : "Basic / Starter"),
      reason: canRefer
        ? undefined
        : "Referral program is exclusive to GAP Pro subscribers. Upgrade to GAP Pro to unlock your referral link.",
    };
  } catch (err) {
    console.error("[Referral] Exception checking referral eligibility:", err);
    return {
      canRefer: false,
      isSubscribed: false,
      hasPurchased: false,
      isPro: false,
      reason: "Could not verify subscription status.",
    };
  }
};

export const handlePendingReferral = async (
  pendingReferralCode?: string | null
): Promise<{ referral: any; error?: string }> => {
  const code = pendingReferralCode || (await getPendingReferralCode());
  if (!code) {
    return { referral: null };
  }

  const normalizedCode = normalizeReferralCode(code);
  if (!normalizedCode || normalizedCode.length < 3) {
    return { referral: null };
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log("[Referral] No authenticated user yet; preserving pending code in storage");
      return { referral: null };
    }

    // 1. Try atomic link_referral RPC
    try {
      const { data: rpcRes, error: linkErr } = await supabase.rpc("link_referral", {
        p_referred_user_id: user.id,
        p_referral_code: normalizedCode,
      });

      if (!linkErr && rpcRes && rpcRes.success) {
        console.log("[Referral] Linked via link_referral RPC:", rpcRes);
        await clearPendingReferralCode();
        return {
          referral: rpcRes.referral || {
            id: rpcRes.referral_id,
            referrer_id: rpcRes.referrer_id,
          },
        };
      }
      if (rpcRes && !rpcRes.success) {
        console.warn("[Referral] link_referral RPC notice:", rpcRes.message);
      }
    } catch (rpcCatch) {
      console.warn("[Referral] link_referral RPC fallback to direct flow:", rpcCatch);
    }

    // 2. Direct lookup in profiles
    let referrer: { referrer_id: string; referral_code: string; full_name?: string } | null = null;
    const { data: profileMatch } = await supabase
      .from("profiles")
      .select("id, referral_code, full_name")
      .ilike("referral_code", normalizedCode)
      .maybeSingle();

    if (profileMatch) {
      referrer = {
        referrer_id: profileMatch.id,
        referral_code: profileMatch.referral_code || normalizedCode,
        full_name: profileMatch.full_name,
      };
    } else if (normalizedCode.startsWith("GAP") && normalizedCode.length >= 8) {
      const uuidPrefix = normalizedCode.slice(3).toLowerCase();
      const { data: rpcMatches } = await supabase.rpc("find_profile_by_id_prefix", {
        id_prefix: uuidPrefix,
      });
      const idMatch = (rpcMatches || [])[0] || null;
      if (idMatch) {
        referrer = {
          referrer_id: idMatch.id,
          referral_code: idMatch.referral_code || normalizedCode,
          full_name: idMatch.full_name,
        };
      }
    }

    if (!referrer) {
      console.warn("[Referral] No referrer found for code:", normalizedCode);
      return { referral: null, error: "Referral code not found" };
    }

    // Prevent self referral
    if (referrer.referrer_id === user.id) {
      console.warn("[Referral] Self referral ignored");
      await clearPendingReferralCode();
      return { referral: null, error: "Self referral is not allowed" };
    }

    // Check if already referred
    const { data: existingRef } = await supabase
      .from("referrals")
      .select("*")
      .eq("referred_user_id", user.id)
      .maybeSingle();

    if (existingRef) {
      await clearPendingReferralCode();
      return { referral: existingRef };
    }

    // Ensure user profile exists
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!userProfile) {
      await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        },
        { onConflict: "id" }
      );
    }

    // Insert referral
    const codeToStore = referrer.referral_code || normalizedCode;
    const { data: createdReferral, error: insertErr } = await supabase
      .from("referrals")
      .insert({
        referrer_id: referrer.referrer_id,
        referred_user_id: user.id,
        referral_code: codeToStore,
        status: "pending",
      })
      .select()
      .single();

    if (insertErr) {
      console.error("[Referral] Insert referral failed:", insertErr);
      return { referral: null, error: insertErr.message };
    }

    await clearPendingReferralCode();
    return { referral: createdReferral };
  } catch (e: any) {
    console.error("[Referral] Unexpected error in handlePendingReferral:", e);
    return { referral: null, error: e?.message };
  }
};

export const getActiveReferralDiscount = async (
  userId?: string | null
): Promise<ReferralDiscountInfo> => {
  // If not authenticated, check local pending referral code
  if (!userId) {
    const pendingCode = await getPendingReferralCode();
    if (pendingCode) {
      return {
        hasDiscount: true,
        discountPercent: 5,
        rewardAmount: 0,
        milestoneTitle: "Referred Member Welcome Perk",
        bonusPerk: "5% Welcome Referral Discount",
        isWelcomeDiscount: true,
      };
    }
    return { hasDiscount: false, discountPercent: 0, rewardAmount: 0 };
  }

  try {
    // 1. Link pending referral if present in storage
    const pendingCode = await getPendingReferralCode();
    if (pendingCode) {
      await handlePendingReferral(pendingCode);
    }

    // 2. Check if this user was referred by someone
    const { data: incomingRefs } = await supabase
      .from("referrals")
      .select("id, status, referral_code, created_at")
      .eq("referred_user_id", userId)
      .order("created_at", { ascending: false });

    const incomingRef = incomingRefs && incomingRefs.length > 0 ? incomingRefs[0] : null;

    let hasPaidPlan = false;
    if (incomingRef) {
      const { data: paidPayments } = await supabase
        .from("app_subscription_payments")
        .select("id, amount_paise, payment_status")
        .eq("user_id", userId)
        .gt("amount_paise", 0)
        .in("payment_status", ["verified", "captured", "success", "paid"])
        .limit(1);

      hasPaidPlan = !!(paidPayments && paidPayments.length > 0);
    }

    const earnings = await getReferralEarnings(userId);
    const completedCount = earnings?.completed_referrals || 0;

    let milestone = REFERRAL_MILESTONES[0];
    for (let i = REFERRAL_MILESTONES.length - 1; i >= 0; i--) {
      if (completedCount >= REFERRAL_MILESTONES[i].requiredReferrals) {
        milestone = REFERRAL_MILESTONES[i];
        break;
      }
    }

    // If the user has completed referrals as referrer
    if (completedCount >= 1) {
      const isWelcomeEligible = incomingRef && !hasPaidPlan;
      const discountPercent = Math.max(
        isWelcomeEligible ? 5 : 0,
        milestone.discountPercent
      );
      return {
        hasDiscount: true,
        discountPercent,
        rewardAmount: earnings?.active_rewards_balance || 500,
        milestoneTitle: milestone.title,
        bonusPerk: milestone.bonusPerk,
        isWelcomeDiscount: false,
      };
    }

    // If referred and has no paid plan yet -> 5% Welcome Discount
    if (incomingRef && !hasPaidPlan) {
      return {
        hasDiscount: true,
        discountPercent: 5,
        rewardAmount: 0,
        milestoneTitle: "Referred Member Welcome Perk",
        bonusPerk: "5% Welcome Referral Discount",
        isWelcomeDiscount: true,
      };
    }

    return { hasDiscount: false, discountPercent: 0, rewardAmount: 0 };
  } catch (e) {
    console.error("[Referral] Failed to check active discount:", e);
    return { hasDiscount: false, discountPercent: 0, rewardAmount: 0 };
  }
};

export const checkAndCompleteReferralReward = async (
  buyerUserId: string,
  planName?: string,
  amountPaid?: number
): Promise<{ success: boolean; message?: string;[key: string]: any }> => {
  if (!buyerUserId) return { success: false, message: "Missing buyer user ID" };

  const cleanPlan = (planName || "").toLowerCase().trim();
  if (
    cleanPlan.includes("trial") ||
    cleanPlan.includes("free") ||
    (amountPaid !== undefined && amountPaid <= 0)
  ) {
    console.log("[Referral] Skipping referral completion for trial or zero amount");
    return { success: false, message: "Referral completion requires a paid plan purchase." };
  }

  try {
    // 1. Try RPC process_referral_reward
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "process_referral_reward",
        {
          p_buyer_id: buyerUserId,
          p_plan_name: planName || "gap_pro",
          p_amount_paid: amountPaid || 0,
        }
      );

      if (!rpcError && rpcData?.success) {
        console.log("[Referral] Completed via RPC successfully:", rpcData);
        return { success: true, ...rpcData };
      }
    } catch (rpcErr) {
      console.warn("[Referral] RPC error, falling back to direct table update:", rpcErr);
    }

    // 2. Direct fallback
    const { data: pendingRef, error: fetchError } = await supabase
      .from("referrals")
      .select("id, referrer_id, referral_code, status")
      .eq("referred_user_id", buyerUserId)
      .eq("status", "pending")
      .maybeSingle();

    if (fetchError || !pendingRef) {
      return { success: false, message: "No pending referral found for buyer" };
    }

    const now = new Date().toISOString();
    const rewardAmount = amountPaid ? Math.max(500, Math.round(amountPaid * 0.15)) : 500;

    const { error: updateError } = await supabase
      .from("referrals")
      .update({
        status: "completed",
        completed_at: now,
        rewarded_at: now,
      })
      .eq("id", pendingRef.id);

    if (updateError) {
      return { success: false, error: updateError };
    }

    const { count: completedCount } = await supabase
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", pendingRef.referrer_id)
      .in("status", ["completed", "rewarded"]);

    const totalCompleted = completedCount || 0;
    let milestoneLevel = 1;
    if (totalCompleted >= 10) milestoneLevel = 4;
    else if (totalCompleted >= 5) milestoneLevel = 3;
    else if (totalCompleted >= 3) milestoneLevel = 2;

    await supabase.from("referral_rewards").insert({
      referral_id: pendingRef.id,
      user_id: pendingRef.referrer_id,
      reward_amount: rewardAmount,
      reward_type: "discount",
      status: "rewarded",
      reward_status: "rewarded",
      milestone_level: milestoneLevel,
      created_at: now,
    });

    return {
      success: true,
      referral_id: pendingRef.id,
      referrer_id: pendingRef.referrer_id,
      reward_amount: rewardAmount,
      milestone_level: milestoneLevel,
      status: "rewarded",
    };
  } catch (err: any) {
    console.error("[Referral] Unexpected error processing reward:", err);
    return { success: false, error: err?.message };
  }
};

export const getReferralEarnings = async (
  userId: string
): Promise<ReferralEarnings | null> => {
  if (!userId) return null;

  try {
    const [refRes, rewRes] = await Promise.all([
      supabase.from("referrals").select("id, status").eq("referrer_id", userId),
      supabase
        .from("referral_rewards")
        .select("id, reward_amount, status, reward_status, redeemed_at")
        .eq("user_id", userId),
    ]);

    const referrals = refRes.data || [];
    const rewards = rewRes.data || [];

    const totalReferrals = referrals.length;
    const completedReferrals = referrals.filter(
      (r) => r.status === "completed" || r.status === "rewarded"
    ).length;
    const pendingReferrals = referrals.filter((r) => r.status === "pending").length;

    const lifetimeEarnings = rewards.reduce((sum, r) => sum + (Number(r.reward_amount) || 0), 0);
    const activeRewardsBalance = rewards
      .filter((r) => (r.status === "rewarded" || r.reward_status === "rewarded") && !r.redeemed_at)
      .reduce((sum, r) => sum + (Number(r.reward_amount) || 0), 0);

    let currentMilestone = REFERRAL_MILESTONES[0];
    let nextMilestone: ReferralMilestone | null = REFERRAL_MILESTONES[0];

    for (let i = REFERRAL_MILESTONES.length - 1; i >= 0; i--) {
      if (completedReferrals >= REFERRAL_MILESTONES[i].requiredReferrals) {
        currentMilestone = REFERRAL_MILESTONES[i];
        nextMilestone = REFERRAL_MILESTONES[i + 1] || null;
        break;
      }
    }

    if (completedReferrals < REFERRAL_MILESTONES[0].requiredReferrals) {
      nextMilestone = REFERRAL_MILESTONES[0];
    }

    const prevReq =
      completedReferrals < REFERRAL_MILESTONES[0].requiredReferrals
        ? 0
        : currentMilestone.requiredReferrals;
    const nextReq = nextMilestone ? nextMilestone.requiredReferrals : currentMilestone.requiredReferrals;
    const progressPercent = nextMilestone
      ? Math.min(
        100,
        Math.max(
          0,
          Math.round(((completedReferrals - prevReq) / (nextReq - prevReq)) * 100)
        )
      )
      : 100;

    return {
      total_referrals: totalReferrals,
      completed_referrals: completedReferrals,
      pending_referrals: pendingReferrals,
      active_rewards_balance: activeRewardsBalance,
      lifetime_earnings: lifetimeEarnings,
      milestone: currentMilestone,
      nextMilestone,
      progressPercent,
    };
  } catch (e) {
    console.error("[Referral] Error fetching earnings:", e);
    return null;
  }
};

export const redeemReferralReward = async (
  rewardId: string,
  userId: string
): Promise<boolean> => {
  if (!rewardId || !userId) return false;
  try {
    const { error } = await supabase
      .from("referral_rewards")
      .update({
        status: "redeemed",
        reward_status: "redeemed",
        redeemed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", rewardId)
      .eq("user_id", userId);

    return !error;
  } catch (e) {
    console.error("[Referral] Error redeeming reward:", e);
    return false;
  }
};

export const isGapProPlan = (plan: { id?: string | null; plan_name?: string | null; plan_label?: string | null; category?: string | null; is_addon?: boolean | null }): boolean => {
  const cat = (plan.category || "").toLowerCase().trim();
  const name = (plan.plan_name || "").toLowerCase().trim();
  const label = (plan.plan_label || "").toLowerCase().trim();
  const id = (plan.id || "").toLowerCase().trim();

  // Exclude addons and standalone phone lines or extra seats
  if (
    name.includes("number") ||
    id.includes("number") ||
    name.includes("extra_user") ||
    id.includes("extra_user") ||
    Boolean(plan.is_addon)
  ) {
    return false;
  }

  // Must match all-in-one / bundle category
  if (cat === "all-in-one" || cat === "all_in_one" || cat === "bundle" || cat === "ecosystem") {
    return true;
  }

  // Plan name or label matching GAP Pro / All-In-One / GAP Max / GAP Enterprise
  if (
    name.includes("all_in_one") ||
    name.includes("bundle") ||
    name.includes("gap_pro") ||
    name.includes("gap_scale") ||
    name.includes("gap_max") ||
    label.includes("gap pro") ||
    label.includes("gap core") ||
    label.includes("gap max") ||
    label.includes("gap enterprise")
  ) {
    return true;
  }

  return false;
};
