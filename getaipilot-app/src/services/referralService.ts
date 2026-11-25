import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";

export const STORAGE_KEY_PENDING_REFERRAL = "@pending_referral_code";
export const STORAGE_KEY_REFERRED_VIA_LINK = "@referred_via_link";
export const STORAGE_KEY_REFERRER_CODE = "@referrer_code";

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
    discountPercent: 0,
    bonusPerk: "₹100 Cash Reward",
    description: "₹100 direct cash reward",
    badgeColor: "#D97706",
  },
  {
    level: 2,
    title: "Silver Aviator",
    requiredReferrals: 3,
    discountPercent: 0,
    bonusPerk: "₹300 Cash Reward",
    description: "₹300 total cash rewards (₹100/ref)",
    badgeColor: "#94A3B8",
  },
  {
    level: 3,
    title: "Gold Commander",
    requiredReferrals: 5,
    discountPercent: 0,
    bonusPerk: "₹500 Cash Reward",
    description: "₹500 total cash rewards (₹100/ref)",
    badgeColor: "#EAB308",
  },
  {
    level: 4,
    title: "Diamond Ambassador",
    requiredReferrals: 10,
    discountPercent: 0,
    bonusPerk: "₹1,000 Cash Reward",
    description: "₹1,000 total cash rewards (₹100/ref)",
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
  pending_withdrawals?: number;
  total_withdrawn?: number;
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
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEY_PENDING_REFERRAL, normalized),
      AsyncStorage.setItem(STORAGE_KEY_REFERRED_VIA_LINK, "true"),
      AsyncStorage.setItem(STORAGE_KEY_REFERRER_CODE, normalized),
    ]);
    return true;
  } catch (e) {
    console.warn("[Referral] Error saving pending referral code:", e);
    return false;
  }
};

export const hasUserArrivedViaReferralLink = async (): Promise<boolean> => {
  try {
    const flag = await AsyncStorage.getItem(STORAGE_KEY_REFERRED_VIA_LINK);
    if (flag === "true") return true;
    const refCode = await AsyncStorage.getItem(STORAGE_KEY_REFERRER_CODE);
    if (refCode && refCode !== "null" && refCode !== "undefined") return true;
    const activeDiscount = await AsyncStorage.getItem("@referral_discount_active");
    if (activeDiscount === "true") return true;
    const code = await AsyncStorage.getItem(STORAGE_KEY_PENDING_REFERRAL);
    return Boolean(code && code !== "null" && code !== "undefined");
  } catch {
    return false;
  }
};

export const getPendingReferralCode = async (): Promise<string | null> => {
  try {
    const code = await AsyncStorage.getItem(STORAGE_KEY_PENDING_REFERRAL);
    if (code && code !== "null" && code !== "undefined") return normalizeReferralCode(code);
    const refCode = await AsyncStorage.getItem(STORAGE_KEY_REFERRER_CODE);
    return refCode && refCode !== "null" && refCode !== "undefined" ? normalizeReferralCode(refCode) : null;
  } catch (e) {
    console.warn("[Referral] Error getting pending referral code:", e);
    return null;
  }
};

export const clearPendingReferralCode = async (): Promise<void> => {
  try {
    // Only clear the pending unlinked code queue, preserve the referred status flag
    await AsyncStorage.removeItem(STORAGE_KEY_PENDING_REFERRAL);
  } catch (e) {
    console.warn("[Referral] Error clearing pending referral code:", e);
  }
};

export const markReferralDiscountRedeemed = async (): Promise<void> => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEY_PENDING_REFERRAL),
      AsyncStorage.removeItem(STORAGE_KEY_REFERRED_VIA_LINK),
      AsyncStorage.removeItem(STORAGE_KEY_REFERRER_CODE),
      AsyncStorage.removeItem("@referral_discount_active"),
      AsyncStorage.setItem("@referral_discount_redeemed", "true"),
    ]);
  } catch (e) {
    console.warn("[Referral] Error marking discount redeemed:", e);
  }
};

export const captureReferralParam = async (urlOrSearch: string): Promise<string | null> => {
  if (!urlOrSearch) return null;
  try {
    // 1. Strip hash fragments first (e.g. #L12)
    const withoutHash = urlOrSearch.split("#")[0] || "";

    // 2. Extract search segment
    let search = "";
    if (withoutHash.includes("?")) {
      search = withoutHash.substring(withoutHash.indexOf("?") + 1);
    } else {
      search = withoutHash;
    }

    const params = new URLSearchParams(search);
    const code = params.get("ref") || params.get("referral") || params.get("code");
    if (code) {
      const clean = normalizeReferralCode(code);
      if (clean && clean.length >= 3) {
        await savePendingReferralCode(clean);
        return clean;
      }
    }

    // 3. Regex fallback in case of nested deep link paths
    const match = withoutHash.match(/[?&](?:ref|referral|code)=([A-Za-z0-9_-]+)/i);
    if (match && match[1]) {
      const clean = normalizeReferralCode(match[1]);
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

    const fallbackCode = "GAP" + userId.replace(/-/g, "").slice(0, 5).toUpperCase();

    // Persist code only if the user has already completed onboarding
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.onboarding_completed) {
      await supabase
        .from("profiles")
        .update({ referral_code: fallbackCode })
        .eq("id", userId);
    }

    return fallbackCode;
  } catch (e) {
    console.error("[Referral] Exception reading referral code:", e);
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

    const { data: sub, error } = await supabase
      .from("app_user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.warn("[Referral] Error fetching subscription for referral eligibility:", error);
    }

    const now = Date.now();
    const expiresAt = sub?.expires_at ? new Date(sub.expires_at).getTime() : null;
    const curStatus = (sub?.subscription_status || "").toLowerCase();
    const planId = (sub?.plan_id || "").toLowerCase();
    const planLabel = (sub?.plan_label || "").toLowerCase();

    const isProPlan = Boolean(
      profile?.is_admin ||
      planId.includes("all_in_one") ||
      planId.includes("bundle") ||
      planId.includes("pro") ||
      planId.includes("gap_pro") ||
      planId.includes("scale") ||
      planId.includes("enterprise") ||
      planId.includes("gap_max") ||
      planLabel.includes("pro") ||
      planLabel.includes("enterprise") ||
      planLabel.includes("scale")
    );

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
      sub?.last_payment_id ||
      sub?.razorpay_payment_id ||
      sub?.razorpay_subscription_id ||
      (sub?.plan_price_paise && Number(sub.plan_price_paise) > 0)
    );

    // Also check verified payment transactions in app_subscription_payments table
    let hasDirectPayment = false;
    let hasDirectProPayment = false;
    try {
      const { data: paidPayments } = await supabase
        .from("app_subscription_payments")
        .select("id, amount_paise, payment_status, plan_id, plan_name")
        .eq("user_id", userId)
        .gt("amount_paise", 0)
        .in("payment_status", ["verified", "captured", "success", "paid"])
        .order("created_at", { ascending: false });

      if (paidPayments && paidPayments.length > 0) {
        hasDirectPayment = true;
        hasDirectProPayment = paidPayments.some((p: any) => {
          const pid = (p.plan_id || "").toLowerCase();
          const pname = (p.plan_name || "").toLowerCase();
          return (
            pid.includes("pro") ||
            pid.includes("gap_pro") ||
            pid.includes("all_in_one") ||
            pid.includes("bundle") ||
            pid.includes("scale") ||
            pid.includes("enterprise") ||
            pid.includes("max") ||
            pname.includes("pro") ||
            pname.includes("all-in-one") ||
            pname.includes("enterprise")
          );
        });
      }
    } catch (payErr) {
      console.warn("[Referral] checkUserCanRefer payment check warning:", payErr);
    }

    const hasPurchased = Boolean(
      profile?.is_admin ||
      hasDirectPayment ||
      hasPaymentRecord ||
      (!isTrial && (isActive || sub?.started_at !== null))
    );

    // Rule: User must have active GAP Pro plan to refer and earn money
    const hasActiveProSubscription = !isTrial && isActive && isProPlan;
    const hasGapPro = Boolean(
      profile?.is_admin ||
      hasActiveProSubscription ||
      hasDirectProPayment
    );

    const canRefer = hasGapPro;

    return {
      canRefer,
      isSubscribed: isActive && !isTrial,
      hasPurchased,
      isPro: isProPlan,
      planName: sub?.plan_id || undefined,
      planLabel: profile?.is_admin
        ? "Admin Access (GAP Pro)"
        : hasGapPro
          ? sub?.plan_label || "GAP Pro Active"
          : sub?.plan_label || (hasPurchased ? "Standard Member" : "Free / Direct Member"),
      reason: canRefer
        ? undefined
        : "You must have an active GAP Pro plan to unlock your referral link and earn flat ₹100 cash per referral.",
    };
  } catch (err) {
    console.error("[Referral] Exception checking referral eligibility:", err);
    return {
      canRefer: false,
      isSubscribed: false,
      hasPurchased: false,
      isPro: false,
      reason: "Could not verify plan status.",
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

    // 2.3 Check if code is a phone number (e.g. 10+ digits or stripped of country code)
    if (!referrer) {
      const digitsOnly = code.replace(/\D/g, "");
      if (digitsOnly.length >= 10) {
        const last10 = digitsOnly.slice(-10);
        try {
          const { data: phoneMatch } = await supabase
            .from("profiles")
            .select("id, referral_code, full_name, phone")
            .or(`phone.eq.${digitsOnly},phone.eq.+91${last10},phone.ilike.%${last10}`)
            .maybeSingle();

          if (phoneMatch) {
            referrer = {
              referrer_id: phoneMatch.id,
              referral_code:
                phoneMatch.referral_code ||
                `GAP${phoneMatch.id.replace(/-/g, "").slice(0, 5).toUpperCase()}`,
              full_name: phoneMatch.full_name,
            };
            console.log("[Referral] Referrer found by phone number:", referrer);
          }
        } catch (phoneErr) {
          console.warn("[Referral] Phone lookup warning:", phoneErr);
        }
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

    // Ensure profile exists for the referred user before inserting referral
    // (required by foreign key constraint referrals_referred_user_fkey)
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!userProfile) {
      console.log("[Referral] Creating minimal profile row for user before referral insert:", user.id);
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

// ==============================================================================
// Incoming Referral (Who Referred the Current User / Partner Sponsor Details)
// ==============================================================================
export interface IncomingReferralInfo {
  hasReferrer: boolean;
  referrerId?: string;
  referrerName?: string;
  referrerCode?: string;
  referralStatus?: "pending" | "completed" | "rewarded";
  referredAt?: string;
  completedAt?: string;
  welcomeDiscountPercent: number;
}

export const getIncomingReferral = async (userId: string): Promise<IncomingReferralInfo> => {
  if (!userId) return { hasReferrer: false, welcomeDiscountPercent: 0 };
  try {
    const { data: ref, error } = await supabase
      .from("referrals")
      .select("id, referrer_id, referral_code, status, created_at, completed_at")
      .eq("referred_user_id", userId)
      .maybeSingle();

    if (error || !ref) {
      return { hasReferrer: false, welcomeDiscountPercent: 0 };
    }

    let referrerName: string | undefined = undefined;
    let referrerCode: string = ref.referral_code || "";

    try {
      const { data: referrerProfile } = await supabase
        .from("profiles")
        .select("id, full_name, referral_code")
        .eq("id", ref.referrer_id)
        .maybeSingle();

      if (referrerProfile) {
        if (referrerProfile.full_name?.trim()) referrerName = referrerProfile.full_name.trim();
        if (referrerProfile.referral_code) referrerCode = referrerProfile.referral_code;
      }
    } catch (profErr) {
      console.warn("[Referral] Profile query warning:", profErr);
    }

    const cleanReferrerCode = (referrerCode && !referrerCode.includes("@"))
      ? referrerCode
      : `GAP${ref.referrer_id.replace(/-/g, "").slice(0, 5).toUpperCase()}`;

    const finalName = (referrerName && !referrerName.includes("@"))
      ? referrerName
      : `Partner #${cleanReferrerCode}`;

    return {
      hasReferrer: true,
      referrerId: ref.referrer_id,
      referrerName: finalName,
      referrerCode: cleanReferrerCode,
      referralStatus: ref.status as any,
      referredAt: ref.created_at,
      completedAt: ref.completed_at,
      welcomeDiscountPercent: 5,
    };
  } catch (e) {
    console.error("[Referral] Error fetching incoming referral:", e);
    return { hasReferrer: false, welcomeDiscountPercent: 0 };
  }
};

// Manually link a sponsor/referrer by referral code or phone number (for direct signups)
export const linkReferrerManually = async (
  userId: string,
  partnerCode: string
): Promise<{ success: boolean; message: string; referral?: any }> => {
  if (!userId || !partnerCode) {
    return { success: false, message: "Please provide a valid referral code or phone number." };
  }
  const raw = partnerCode.trim();
  const digitsOnly = raw.replace(/\D/g, "");
  const isPhone = digitsOnly.length >= 10;
  const clean = normalizeReferralCode(raw);

  if ((!clean || clean.length < 3) && !isPhone) {
    return { success: false, message: "Please enter a valid referral code or phone number." };
  }
  if (clean.includes("@")) {
    return { success: false, message: "Please enter a valid referral code or phone number, not an email address." };
  }
  const codeToSave = isPhone ? digitsOnly : clean;
  await savePendingReferralCode(codeToSave);
  const res = await handlePendingReferral(codeToSave);
  if (res?.referral) {
    return { success: true, message: "Referral linked successfully! Welcome discount activated.", referral: res.referral };
  }
  return { success: false, message: res?.error || "Could not find a registered partner matching that referral code or phone number." };
};

// ==============================================================================
// Referrer Activity Ledger Data Joining (matching bot-dashboard)
// ==============================================================================
export interface ReferralDashboardItem {
  referral_id: string;
  referrer_id: string;
  referred_user_id: string;
  referral_code: string;
  referral_status: "pending" | "completed" | "rewarded";
  referred_at: string;
  reward_id: string | null;
  reward_amount: number;
  reward_status: string;
  rewarded_at: string | null;
  referred_name: string;
  referred_email?: string | null;
  referred_phone?: string | null;
  referred_plan?: string | null;
}

export const getReferralDashboard = async (userId: string): Promise<ReferralDashboardItem[]> => {
  if (!userId) return [];

  try {
    const { data: refs, error: refsError } = await supabase
      .from("referrals")
      .select("id, referrer_id, referred_user_id, referral_code, status, reward_amount, created_at, completed_at, rewarded_at")
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false });

    if (refsError) {
      console.error("[Referral] refs fetch error:", refsError);
      return [];
    }

    const refList = refs || [];
    if (refList.length === 0) return [];

    const { data: rewards } = await supabase
      .from("referral_rewards")
      .select("*")
      .eq("user_id", userId);

    const rewardMap = new Map((rewards || []).map((r) => [r.referral_id, r]));

    const userIds = Array.from(new Set(refList.map((r) => r.referred_user_id).filter(Boolean)));
    let profileMap = new Map<string, { full_name?: string; email?: string | null; phone?: string | null; subscription?: string | null }>();
    if (userIds.length > 0) {
      try {
        // Select all profile columns so missing columns (e.g. subscription) never fail the query
        const { data: profiles, error: pErr } = await supabase
          .from("profiles")
          .select("*")
          .in("id", userIds);

        if (!pErr && profiles) {
          profiles.forEach((p: any) => {
            const phone = p.phone || p.mobile_number || p.phone_number || null;
            const email = p.email || p.business_email || null;
            const name =
              p.full_name?.trim() ||
              [p.first_name, p.last_name].filter(Boolean).join(" ").trim() ||
              p.username?.trim() ||
              "";
            profileMap.set(p.id, {
              full_name: name,
              email,
              phone,
              subscription: p.subscription || null,
            });
          });
        } else {
          if (pErr) console.warn("[Referral] Profiles select(*) note:", pErr.message);
          // Fallback: try selecting standard minimal columns if select * had an issue
          const { data: fallbackProfiles } = await supabase
            .from("profiles")
            .select("id, full_name, email, phone")
            .in("id", userIds);
          if (fallbackProfiles) {
            fallbackProfiles.forEach((p: any) => {
              profileMap.set(p.id, {
                full_name: p.full_name?.trim() || "",
                email: p.email || null,
                phone: p.phone || null,
              });
            });
          }
        }
      } catch (pErr) {
        console.warn("[Referral] Profiles fetch warning:", pErr);
      }
    }

    return refList.map((r) => {
      const rw = rewardMap.get(r.id);
      const prof = profileMap.get(r.referred_user_id);
      const rawStatus = (r.status || "pending").toLowerCase().trim();
      const isCompleted = rawStatus === "completed" || rawStatus === "rewarded" || rawStatus === "active";
      const cleanStatus = isCompleted ? ("completed" as const) : ("pending" as const);
      const referredName = prof?.full_name?.trim() || "";
      return {
        referral_id: r.id,
        referrer_id: r.referrer_id,
        referred_user_id: r.referred_user_id,
        referral_code: r.referral_code,
        referral_status: cleanStatus,
        referred_at: r.created_at,
        reward_id: rw?.id || null,
        reward_amount: isCompleted ? Math.max(100, Number(rw?.reward_amount || (r as any).reward_amount || 100)) : 0,
        reward_status: rw?.status || rw?.reward_status || (isCompleted ? "rewarded" : "pending"),
        rewarded_at: rw?.created_at || r.rewarded_at || null,
        referred_name: referredName,
        referred_email: prof?.email || null,
        referred_phone: prof?.phone || null,
        referred_plan: prof?.subscription || null,
      };
    });
  } catch (joinErr) {
    console.error("[Referral] Error joining referral data:", joinErr);
    return [];
  }
};

export const getActiveReferralDiscount = async (
  userId?: string | null
): Promise<ReferralDiscountInfo> => {
  // 1. Check local pending referral code, saved referral code, or link arrival flag
  const pendingCode = await getPendingReferralCode();
  const arrivedViaLink = await hasUserArrivedViaReferralLink();
  const savedCode = await AsyncStorage.getItem(STORAGE_KEY_REFERRER_CODE);
  const hasStorageReferral = Boolean(
    arrivedViaLink ||
    pendingCode ||
    (savedCode && savedCode !== "null" && savedCode !== "undefined")
  );

  // If not authenticated, return 5% discount immediately if arrived via referral link
  if (!userId) {
    if (hasStorageReferral) {
      return {
        hasDiscount: true,
        discountPercent: 5,
        rewardAmount: 0,
        milestoneTitle: "Referred Member Welcome Perk",
        bonusPerk: "5% Welcome Referral Discount on GAP Pro",
        isWelcomeDiscount: true,
      };
    }
    return { hasDiscount: false, discountPercent: 0, rewardAmount: 0 };
  }

  try {
    // 2. Link pending referral if present in storage
    if (pendingCode) {
      try {
        await handlePendingReferral(pendingCode);
      } catch (linkErr) {
        console.warn("[Referral] Linking pending code warning:", linkErr);
      }
    }

    // 3. Check if this user was referred by someone in the database
    const { data: incomingRefs } = await supabase
      .from("referrals")
      .select("id, status, referral_code, created_at")
      .eq("referred_user_id", userId)
      .order("created_at", { ascending: false });

    const incomingRef = incomingRefs && incomingRefs.length > 0 ? incomingRefs[0] : null;

    // 4. Check if user has already purchased a GAP Pro plan
    let hasPaidProPlan = false;
    try {
      const { data: paidPayments } = await supabase
        .from("app_subscription_payments")
        .select("id, amount_paise, payment_status, plan_id, plan_name")
        .eq("user_id", userId)
        .gt("amount_paise", 0)
        .in("payment_status", ["verified", "captured", "success", "paid"]);

      if (paidPayments && paidPayments.length > 0) {
        hasPaidProPlan = paidPayments.some((p: any) => {
          const pid = (p.plan_id || "").toLowerCase();
          const pname = (p.plan_name || "").toLowerCase();
          return (
            pid.includes("pro") ||
            pid.includes("gap_pro") ||
            pid.includes("all_in_one") ||
            pid.includes("bundle") ||
            pname.includes("pro") ||
            pname.includes("all-in-one")
          );
        });
      }
    } catch (payCheckErr) {
      console.warn("[Referral] Payment check error:", payCheckErr);
    }

    const { data: sub } = await supabase
      .from("app_user_subscriptions")
      .select("plan_id, plan_label, subscription_status, expires_at")
      .eq("user_id", userId)
      .maybeSingle();

    const subPlanId = (sub?.plan_id || "").toLowerCase();
    const subPlanLabel = (sub?.plan_label || "").toLowerCase();
    const subStatus = (sub?.subscription_status || "").toLowerCase();
    const isSubActive =
      subStatus === "active" &&
      subStatus !== "trial" &&
      (!sub?.expires_at || new Date(sub.expires_at).getTime() > Date.now());

    const hasActiveProSub =
      isSubActive &&
      (subPlanId.includes("pro") ||
        subPlanId.includes("all_in_one") ||
        subPlanId.includes("bundle") ||
        subPlanLabel.includes("pro"));

    const hasAlreadyPurchasedPro = hasPaidProPlan || hasActiveProSub;

    // 5. If referred (either via DB incoming referral OR via captured referral link/storage)
    // and has NOT purchased GAP Pro yet -> User gets 5% Welcome Discount on GAP Pro plan!
    const isReferred = Boolean(incomingRef || hasStorageReferral);
    if (isReferred && !hasAlreadyPurchasedPro) {
      return {
        hasDiscount: true,
        discountPercent: 5,
        rewardAmount: 0,
        milestoneTitle: "Referred Member Welcome Perk",
        bonusPerk: "5% Welcome Referral Discount on GAP Pro",
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
    const rewardAmount = 100; // Flat ₹100 for every referral

    const { error: updateError } = await supabase
      .from("referrals")
      .update({
        status: "completed",
        reward_amount: rewardAmount,
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
      amount: rewardAmount,
      reward_amount: rewardAmount,
      reward_type: "referral",
      status: "credited",
      reward_status: "rewarded",
      milestone_level: milestoneLevel,
      created_at: now,
      updated_at: now,
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
    const [refRes, rewRes, withRes] = await Promise.all([
      supabase.from("referrals").select("id, status, reward_amount").eq("referrer_id", userId),
      supabase
        .from("referral_rewards")
        .select("id, amount, reward_amount, status, reward_status, redeemed_at")
        .eq("user_id", userId),
      supabase
        .from("referral_withdrawals")
        .select("id, amount, status")
        .eq("user_id", userId),
    ]);

    const referrals = refRes.data || [];
    const rewards = rewRes.data || [];
    const withdrawals = withRes.data || [];

    const totalReferrals = referrals.length;
    const completedReferrals = referrals.filter(
      (r) => r.status === "completed" || r.status === "rewarded"
    ).length;
    const pendingReferrals = referrals.filter((r) => r.status === "pending").length;

    // Lifetime rewards earned:
    // Check rewards table first, then referrals table reward_amount, or flat ₹100 per completed referral
    const rewardsSum = rewards.reduce((sum, r) => sum + (Number(r.amount || r.reward_amount) || 0), 0);
    const referralAmountsSum = referrals
      .filter((r) => r.status === "completed" || r.status === "rewarded")
      .reduce((sum, r) => sum + (Number(r.reward_amount) || 100), 0);

    const lifetimeEarnings = Math.max(rewardsSum, referralAmountsSum, completedReferrals * 100);

    // Deduct all non-rejected withdrawals (pending, processing, completed)
    const totalWithdrawnOrPending = withdrawals
      .filter((w) => w.status !== "rejected" && w.status !== "cancelled")
      .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

    const pendingWithdrawals = withdrawals
      .filter((w) => w.status === "pending" || w.status === "processing")
      .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

    const activeRewardsBalance = Math.max(0, lifetimeEarnings - totalWithdrawnOrPending);

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
      pending_withdrawals: pendingWithdrawals,
      total_withdrawn: totalWithdrawnOrPending,
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
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("referral_rewards")
      .update({
        reward_status: "redeemed",
        redeemed_at: now,
        updated_at: now,
      })
      .eq("id", rewardId)
      .eq("user_id", userId);

    return !error;
  } catch (e) {
    console.error("[Referral] Error redeeming reward:", e);
    return false;
  }
};

// ==============================================================================
// Referral Cash Withdrawals (UPI & Bank Transfer)
// ==============================================================================
export interface ReferralWithdrawalRecord {
  id: string;
  user_id: string;
  amount: number;
  payout_method: "upi" | "bank";
  upi_id?: string;
  account_holder_name?: string;
  account_number?: string;
  ifsc_code?: string;
  bank_name?: string;
  status: "pending" | "processing" | "completed" | "rejected";
  notes?: string;
  created_at: string;
  processed_at?: string;
}

export interface RequestWithdrawalParams {
  userId: string;
  amount: number;
  payoutMethod: "upi" | "bank";
  upiId?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
}

export const requestReferralWithdrawal = async (
  params: RequestWithdrawalParams
): Promise<{ success: boolean; message?: string; withdrawal?: any }> => {
  const { userId, amount, payoutMethod, upiId, accountHolderName, accountNumber, ifscCode, bankName } = params;

  if (!userId) {
    return { success: false, message: "User not authenticated." };
  }
  if (!amount || amount < 100) {
    return { success: false, message: "Minimum withdrawal amount is ₹100." };
  }
  if (payoutMethod === "upi") {
    if (!upiId || !upiId.trim() || !upiId.includes("@")) {
      return { success: false, message: "Please enter a valid UPI ID (e.g. name@okhdfcbank)." };
    }
  } else if (payoutMethod === "bank") {
    if (!accountHolderName?.trim() || !accountNumber?.trim() || !ifscCode?.trim()) {
      return { success: false, message: "Please fill in all required bank account details." };
    }
  }

  try {
    // 1. Check user's available unredeemed referral rewards and pending/completed withdrawals
    const earnings = await getReferralEarnings(userId);
    const activeBalance = earnings?.active_rewards_balance ?? 0;

    if (activeBalance < amount) {
      return {
        success: false,
        message: earnings?.pending_withdrawals && earnings.pending_withdrawals > 0
          ? `You have a pending payout of ₹${earnings.pending_withdrawals}. Available cash balance: ₹${activeBalance.toFixed(0)}`
          : `Insufficient referral balance. Available balance: ₹${activeBalance.toFixed(0)}`,
      };
    }

    const { data: rewards } = await supabase
      .from("referral_rewards")
      .select("id, amount, reward_amount, status, reward_status, redeemed_at")
      .eq("user_id", userId);

    const unredeemedRewards = (rewards || []).filter(
      (r) => (r.status === "credited" || r.status === "pending" || r.reward_status === "rewarded") && !r.redeemed_at
    );

    const now = new Date().toISOString();
    const withdrawalPayload = {
      user_id: userId,
      amount,
      payout_method: payoutMethod,
      upi_id: payoutMethod === "upi" ? upiId?.trim() : null,
      account_holder_name: payoutMethod === "bank" ? accountHolderName?.trim() : null,
      account_number: payoutMethod === "bank" ? accountNumber?.trim() : null,
      ifsc_code: payoutMethod === "bank" ? ifscCode?.trim().toUpperCase() : null,
      bank_name: payoutMethod === "bank" ? bankName?.trim() : null,
      status: "pending",
      created_at: now,
      updated_at: now,
    };

    // 2. Insert into referral_withdrawals table
    let insertedWithdrawal: any = null;
    const { data: insData, error: insErr } = await supabase
      .from("referral_withdrawals")
      .insert(withdrawalPayload)
      .select()
      .single();

    if (insErr) {
      console.error("[Referral] Failed to insert referral_withdrawals:", insErr);
      return { success: false, message: insErr.message || "Failed to submit withdrawal request." };
    }
    insertedWithdrawal = insData;

    // 3. Mark unredeemed rewards as redeemed up to the withdrawn amount
    let remainingToDeduct = amount;
    for (const rew of unredeemedRewards) {
      if (remainingToDeduct <= 0) break;
      const val = Number(rew.amount || rew.reward_amount) || 0;
      await supabase
        .from("referral_rewards")
        .update({
          reward_status: "redeemed",
          redeemed_at: now,
          updated_at: now,
        })
        .eq("id", rew.id)
        .eq("user_id", userId);
      remainingToDeduct -= val;
    }

    return {
      success: true,
      message: `Withdrawal request for ₹${amount} submitted successfully! Your payout will be transferred to your ${payoutMethod === "upi" ? "UPI ID" : "Bank Account"} shortly.`,
      withdrawal: insertedWithdrawal || withdrawalPayload,
    };
  } catch (err: any) {
    console.error("[Referral] Error submitting withdrawal request:", err);
    return { success: false, message: err?.message || "Failed to submit withdrawal request." };
  }
};

export const cancelReferralWithdrawal = async (
  withdrawalId: string,
  userId: string
): Promise<{ success: boolean; message?: string }> => {
  if (!withdrawalId || !userId) {
    return { success: false, message: "Missing withdrawal ID or user ID" };
  }
  try {
    const { data: withdrawal, error: fetchErr } = await supabase
      .from("referral_withdrawals")
      .select("*")
      .eq("id", withdrawalId)
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchErr || !withdrawal) {
      return { success: false, message: "Withdrawal request not found" };
    }

    if (withdrawal.status !== "pending" && withdrawal.status !== "processing") {
      return {
        success: false,
        message: `This withdrawal request is already ${withdrawal.status} and cannot be cancelled.`,
      };
    }

    const now = new Date().toISOString();

    // 1. Try to update status to 'rejected' with select() to verify row modification
    let cancelled = false;
    const { data: updateData, error: updateErr } = await supabase
      .from("referral_withdrawals")
      .update({
        status: "rejected",
        notes: "Cancelled by user",
        updated_at: now,
      })
      .eq("id", withdrawalId)
      .eq("user_id", userId)
      .select();

    if (!updateErr && updateData && updateData.length > 0) {
      cancelled = true;
    } else {
      console.warn("[Referral] Update to rejected failed or returned 0 rows, trying delete fallback:", updateErr?.message);
      // Fallback: If update is restricted by RLS, delete the pending row
      const { data: delData, error: delErr } = await supabase
        .from("referral_withdrawals")
        .delete()
        .eq("id", withdrawalId)
        .eq("user_id", userId)
        .select();

      if (!delErr && delData && delData.length > 0) {
        cancelled = true;
      } else {
        // Check if row actually changed or was deleted
        const { data: checkRow } = await supabase
          .from("referral_withdrawals")
          .select("id, status")
          .eq("id", withdrawalId)
          .maybeSingle();

        if (!checkRow || checkRow.status === "rejected") {
          cancelled = true;
        } else {
          console.error("[Referral] Cancellation failed: RLS may prevent update/delete on referral_withdrawals");
          return {
            success: false,
            message:
              "Unable to cancel request. Please ensure UPDATE and DELETE policies are enabled on 'referral_withdrawals' in Supabase.",
          };
        }
      }
    }

    // 2. Restore any redeemed rewards back to unredeemed
    try {
      await supabase
        .from("referral_rewards")
        .update({
          reward_status: "rewarded",
          redeemed_at: null,
          updated_at: now,
        })
        .eq("user_id", userId)
        .eq("reward_status", "redeemed");
    } catch (rewErr) {
      console.warn("[Referral] Restore rewards warning:", rewErr);
    }

    return {
      success: true,
      message: `Withdrawal request cancelled successfully. ₹${withdrawal.amount} has been restored to your available cash.`,
    };
  } catch (err: any) {
    console.error("[Referral] Error cancelling withdrawal:", err);
    return { success: false, message: err?.message || "Failed to cancel withdrawal request." };
  }
};

export interface WithdrawalEligibility {
  canWithdraw: boolean;
  availableBalance: number;
  pendingAmount: number;
  totalWithdrawn: number;
  minAmount: number;
  reason?: string;
}

export const checkWithdrawalEligibility = async (
  userId: string
): Promise<WithdrawalEligibility> => {
  const minAmount = 100;
  if (!userId) {
    return {
      canWithdraw: false,
      availableBalance: 0,
      pendingAmount: 0,
      totalWithdrawn: 0,
      minAmount,
      reason: "User not authenticated",
    };
  }

  const earnings = await getReferralEarnings(userId);
  const availableBalance = earnings?.active_rewards_balance ?? 0;
  const pendingAmount = earnings?.pending_withdrawals ?? 0;
  const totalWithdrawn = earnings?.total_withdrawn ?? 0;

  if (pendingAmount > 0 && availableBalance < minAmount) {
    return {
      canWithdraw: false,
      availableBalance,
      pendingAmount,
      totalWithdrawn,
      minAmount,
      reason: `You have a pending payout of ₹${pendingAmount}. New requests require at least ₹${minAmount} available cash.`,
    };
  }

  if (availableBalance < minAmount) {
    return {
      canWithdraw: false,
      availableBalance,
      pendingAmount,
      totalWithdrawn,
      minAmount,
      reason: `Minimum withdrawal amount is ₹${minAmount}. Current available cash is ₹${availableBalance.toFixed(0)}.`,
    };
  }

  return {
    canWithdraw: true,
    availableBalance,
    pendingAmount,
    totalWithdrawn,
    minAmount,
  };
};

export const getReferralWithdrawals = async (
  userId: string
): Promise<ReferralWithdrawalRecord[]> => {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from("referral_withdrawals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[Referral] Error fetching referral withdrawals:", error);
      return [];
    }
    return (data as ReferralWithdrawalRecord[]) || [];
  } catch (e) {
    console.warn("[Referral] Exception fetching withdrawals:", e);
    return [];
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

export interface AdminReferralStats {
  totalReferrals: number;
  discountRecipientsCount: number; // Total users who purchased a plan using the 5% referral discount
  pendingReferralsCount: number;
  totalReferrerRewardsPaid: number;
  recentDiscountPurchases: Array<{
    referral_id: string;
    referred_user_id: string;
    referred_name: string;
    referred_email: string;
    referral_code: string;
    referrer_name: string;
    completed_at: string;
    reward_amount: number;
  }>;
}

/**
 * Fetches full audit metrics for admins:
 * How many users joined via referral link, availed the 5% discount, and completed their purchase.
 */
export const getAdminReferralDiscountStats = async (): Promise<AdminReferralStats> => {
  try {
    const { data: refs, error } = await supabase
      .from("referrals")
      .select("id, referrer_id, referred_user_id, referral_code, status, completed_at, reward_amount")
      .order("completed_at", { ascending: false });

    if (error || !refs) {
      return {
        totalReferrals: 0,
        discountRecipientsCount: 0,
        pendingReferralsCount: 0,
        totalReferrerRewardsPaid: 0,
        recentDiscountPurchases: [],
      };
    }

    const completed = refs.filter((r) => r.status === "completed" || r.status === "rewarded");
    const pending = refs.filter((r) => r.status === "pending");

    const userIds = Array.from(
      new Set(completed.flatMap((r) => [r.referred_user_id, r.referrer_id]).filter(Boolean))
    );

    let profileMap = new Map<string, { full_name?: string; email?: string }>();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);
      (profiles || []).forEach((p) => profileMap.set(p.id, p));
    }

    const recentDiscountPurchases = completed.slice(0, 25).map((r) => {
      const buyerProf = profileMap.get(r.referred_user_id);
      const referrerProf = profileMap.get(r.referrer_id);
      return {
        referral_id: r.id,
        referred_user_id: r.referred_user_id,
        referred_name: buyerProf?.full_name || "Referred User",
        referred_email: buyerProf?.email || "",
        referral_code: r.referral_code,
        referrer_name: referrerProf?.full_name || "Referrer",
        completed_at: r.completed_at || "",
        reward_amount: Number(r.reward_amount) || 100,
      };
    });

    const totalReferrerRewardsPaid = completed.reduce(
      (sum, r) => sum + (Number(r.reward_amount) || 100),
      0
    );

    return {
      totalReferrals: refs.length,
      discountRecipientsCount: completed.length,
      pendingReferralsCount: pending.length,
      totalReferrerRewardsPaid,
      recentDiscountPurchases,
    };
  } catch (err) {
    console.error("[Referral] Failed to fetch admin discount stats:", err);
    return {
      totalReferrals: 0,
      discountRecipientsCount: 0,
      pendingReferralsCount: 0,
      totalReferrerRewardsPaid: 0,
      recentDiscountPurchases: [],
    };
  }
};
