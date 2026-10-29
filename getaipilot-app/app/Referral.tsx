import * as Clipboard from "expo-clipboard";
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  Gift,
  Info,
  Link as LinkIcon,
  Lock,
  Mail,
  Percent,
  Phone,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  User,
  Users,
  Wallet,
  X,
  XCircle,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { supabase } from "@/lib/supabase";
import { getColors } from "@/theme/colors";
import { useTheme } from "../src/theme";
import { useThemedDialog } from "@/components";
import {
  getOrCreateReferralCode,
  getReferralEarnings,
  getReferralWithdrawals,
  getReferralDashboard,
  cancelReferralWithdrawal,
  checkUserCanRefer,
  getIncomingReferral,
  IncomingReferralInfo,
  UserReferralEligibility,
  REFERRAL_MILESTONES,
  ReferralEarnings,
  ReferralMilestone,
  ReferralWithdrawalRecord,
} from "../src/services/referralService";
import { AnimatedReferralCard } from "../src/components/home/AnimatedReferralCard";
import { ReferralWithdrawModal } from "../src/components/referral/ReferralWithdrawModal";

type ReferralStatus = "pending" | "completed" | "rewarded" | "cancelled";

interface Referral {
  id: string;
  referral_code: string;
  referred_user_id?: string;
  referred_name?: string;
  referred_email?: string | null;
  referred_phone?: string | null;
  referred_subscription?: string | null;
  status: ReferralStatus;
  reward_amount: number;
  created_at: string;
  completed_at: string | null;
  rewarded_at: string | null;
}

const APP_REFERRAL_URL = "https://getaipilot.in/referral";

export const maskEmail = (email?: string | null): string => {
  if (!email || !email.includes("@")) return "";
  const parts = email.split("@");
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) return `${name[0]}*@${domain}`;
  return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
};

export const maskPhone = (phone?: string | null): string => {
  if (!phone) return "";
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.length <= 6) return cleaned;
  return `${cleaned.slice(0, 4)}****${cleaned.slice(-2)}`;
};

export const getReferralDisplayName = (item: Referral, index: number): string => {
  if (item.referred_name && item.referred_name.trim()) {
    return item.referred_name.trim();
  }
  if (item.referred_email) {
    return maskEmail(item.referred_email);
  }
  if (item.referred_phone) {
    return maskPhone(item.referred_phone);
  }
  if (item.referred_user_id) {
    return `Invited Member #${item.referred_user_id.replace(/-/g, "").slice(0, 5).toUpperCase()}`;
  }
  return `Referred Friend #${index + 1}`;
};

export default function ReferralScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { showAlert, showReferral } = useThemedDialog();

  const [userId, setUserId] = useState<string>("");
  const [referralCode, setReferralCode] = useState<string>("");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [withdrawals, setWithdrawals] = useState<ReferralWithdrawalRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"referrals" | "withdrawals">("referrals");
  const [earnings, setEarnings] = useState<ReferralEarnings | null>(null);
  const [showMilestonesModal, setShowMilestonesModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<ReferralWithdrawalRecord | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [withdrawalToCancel, setWithdrawalToCancel] = useState<ReferralWithdrawalRecord | null>(null);
  const [eligibility, setEligibility] = useState<UserReferralEligibility | null>(null);
  const [incomingRef, setIncomingRef] = useState<IncomingReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReferralData = async () => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      setLoading(false);
      return;
    }

    setUserId(user.id);

    try {
      setError(null);

      // 1. Get or create referral code (resilient fallback)
      try {
        const code = await getOrCreateReferralCode(user.id, user.email);
        setReferralCode(code || `GAP${user.id.replace(/-/g, "").slice(0, 5).toUpperCase()}`);
      } catch (cErr) {
        console.warn("[Referral] Referral code fetch error:", cErr);
        setReferralCode(`GAP${user.id.replace(/-/g, "").slice(0, 5).toUpperCase()}`);
      }

      // 2. Load referrals with user profiles & reward details
      try {
        const dashboardItems = await getReferralDashboard(user.id);
        if (dashboardItems && dashboardItems.length > 0) {
          setReferrals(
            dashboardItems.map((item) => ({
              id: item.referral_id,
              referral_code: item.referral_code,
              referred_user_id: item.referred_user_id,
              referred_name: item.referred_name,
              referred_email: item.referred_email,
              referred_phone: item.referred_phone,
              referred_subscription: item.referred_plan,
              status: item.referral_status as ReferralStatus,
              reward_amount: item.reward_amount,
              created_at: item.referred_at,
              completed_at: item.rewarded_at,
              rewarded_at: item.rewarded_at,
            }))
          );
        } else {
          const { data: refData, error: refError } = await supabase
            .from("referrals")
            .select(
              "id, referrer_id, referred_user_id, referral_code, status, reward_amount, created_at, completed_at, rewarded_at"
            )
            .eq("referrer_id", user.id)
            .order("created_at", { ascending: false });

          if (refError) {
            console.warn("[Referral] Error fetching referrals list:", refError);
          }

          const rawList = refData || [];
          const userIds = Array.from(new Set(rawList.map((r: any) => r.referred_user_id).filter(Boolean)));
          let profMap = new Map<string, any>();
          if (userIds.length > 0) {
            try {
              const { data: profs, error: pErr } = await supabase
                .from("profiles")
                .select("*")
                .in("id", userIds);

              if (!pErr && profs) {
                profs.forEach((p: any) => {
                  profMap.set(p.id, {
                    full_name:
                      p.full_name?.trim() ||
                      [p.first_name, p.last_name].filter(Boolean).join(" ").trim() ||
                      p.username?.trim() ||
                      "",
                    email: p.email || p.business_email || null,
                    phone: p.phone || p.mobile_number || p.phone_number || null,
                    subscription: p.subscription || null,
                  });
                });
              } else {
                const { data: fallbackProfs } = await supabase
                  .from("profiles")
                  .select("id, full_name, email, phone")
                  .in("id", userIds);
                (fallbackProfs || []).forEach((p: any) => profMap.set(p.id, p));
              }
            } catch (pErr) {
              console.warn("[Referral] Profiles fallback warning:", pErr);
            }
          }

          const mapped: Referral[] = rawList.map((r: any) => {
            const prof = profMap.get(r.referred_user_id);
            const isDone = r.status === "completed" || r.status === "rewarded";
            return {
              id: r.id,
              referral_code: r.referral_code,
              referred_user_id: r.referred_user_id,
              referred_name: prof?.full_name?.trim() || "",
              referred_email: prof?.email || null,
              referred_phone: prof?.phone || null,
              referred_subscription: prof?.subscription || null,
              status: isDone ? "completed" : "pending",
              reward_amount: isDone ? Math.max(100, Number(r.reward_amount) || 100) : 0,
              created_at: r.created_at,
              completed_at: r.completed_at,
              rewarded_at: r.rewarded_at,
            };
          });
          setReferrals(mapped);
        }
      } catch (listErr) {
        console.warn("[Referral] Referrals list fetch error:", listErr);
      }

      // 3. Load aggregated earnings and withdrawal totals
      try {
        const earningsData = await getReferralEarnings(user.id);
        if (earningsData) setEarnings(earningsData);
      } catch (earnErr) {
        console.warn("[Referral] Earnings fetch error:", earnErr);
      }

      // 4. Load withdrawals history
      try {
        const withdrawalsData = await getReferralWithdrawals(user.id);
        setWithdrawals(withdrawalsData);
      } catch (withErr) {
        console.warn("[Referral] Withdrawals fetch error:", withErr);
      }

      // 5. Verify plan purchase eligibility for sharing (GAP Pro plan required)
      try {
        const elig = await checkUserCanRefer(user.id);
        setEligibility(elig);
      } catch (eligErr) {
        console.warn("[Referral] Eligibility check error:", eligErr);
      }

      // 6. Check incoming referral & welcome discount
      try {
        const inc = await getIncomingReferral(user.id);
        if (inc) setIncomingRef(inc);
      } catch (incErr) {
        console.warn("[Referral] Incoming referral check error:", incErr);
      }
    } catch (err: any) {
      console.error("[Referral] Failed to load referral data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferralData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadReferralData();
    } finally {
      setRefreshing(false);
    }
  }, []);

  const promptPlanRequired = () => {
    showAlert({
      type: "warning",
      title: "GAP Pro Plan Required",
      message:
        "You must have an active GAP Pro plan before you can share your referral link and earn flat ₹100 cash rewards. Upgrade to GAP Pro to activate your referral link!",
      buttonText: "Upgrade to GAP Pro",
      onConfirm: () => {
        router.push("/account/plans");
      },
    });
  };

  const copyReferralCode = async () => {
    if (eligibility && !eligibility.canRefer) {
      promptPlanRequired();
      return;
    }
    if (!referralCode) {
      showAlert({
        type: "warning",
        title: "Referral code unavailable",
        message: "Please wait while your referral code is being generated.",
      });
      return;
    }

    try {
      await Clipboard.setStringAsync(referralCode);
      showAlert({
        type: "success",
        title: "Copied!",
        message: `Referral code ${referralCode} has been copied to your clipboard.`,
        buttonText: "Done",
      });
    } catch (err) {
      console.warn("Copy referral code error:", err);
    }
  };

  const copyReferralLink = async () => {
    if (eligibility && !eligibility.canRefer) {
      promptPlanRequired();
      return;
    }
    if (!referralCode) {
      showAlert({
        type: "warning",
        title: "Referral code unavailable",
        message: "Your referral code is not available yet.",
      });
      return;
    }
    const link = `${APP_REFERRAL_URL}?ref=${encodeURIComponent(referralCode)}`;
    try {
      await Clipboard.setStringAsync(link);
      showAlert({
        type: "success",
        title: "Link Copied!",
        message: "Your personalized referral link has been copied to your clipboard.",
        buttonText: "Done",
      });
    } catch (err) {
      console.warn("Copy referral link error:", err);
    }
  };

  const shareReferral = async () => {
    if (eligibility && !eligibility.canRefer) {
      promptPlanRequired();
      return;
    }
    if (!referralCode) {
      showAlert({
        type: "warning",
        title: "Referral code unavailable",
        message: "Your referral code is not available yet.",
      });
      return;
    }

    const referralLink = `${APP_REFERRAL_URL}?ref=${encodeURIComponent(referralCode)}`;

    showReferral({
      referralCode,
      referralLink,
      title: "Share & Earn ₹100 Cash",
      description: "Earn flat ₹100 cash reward for every friend who joins using your referral link.",
      referralReward: "Flat ₹100 direct cash reward for every referral who joins with your link.",
      onShare: async () => {
        try {
          const shareContent = Platform.select({
            ios: {
              message: `Hey! Try GetAiPilot — the all-in-one AI automation platform for WhatsApp, Telegram, Voice AI, CRM, and Marketing.\n\nReferral Code: ${referralCode}`,
              url: referralLink,
            },
            default: {
              title: "Join GetAiPilot",
              message:
                "Hey! Try GetAiPilot — the all-in-one AI automation platform for WhatsApp, Telegram, Voice AI, CRM, and Marketing.\n\n" +
                `Join using my referral link:\n${referralLink}\n\n` +
                `Referral Code: ${referralCode}`,
            },
          });

          await Share.share(shareContent!, {
            dialogTitle: "Share Referral Link",
          });
        } catch (err: any) {
          const message = String(err?.message || err || "").toLowerCase();
          if (
            message.includes("cancel") ||
            message.includes("dismiss") ||
            message.includes("user did not share")
          ) {
            return;
          }
          console.warn("[Referral] Share referral error:", err);
        }
      },
    });
  };

  const handleCancelWithdrawal = async (withdrawal: ReferralWithdrawalRecord) => {
    if (!userId || !withdrawal.id) return;
    setCancellingId(withdrawal.id);
    try {
      const res = await cancelReferralWithdrawal(withdrawal.id, userId);
      if (res.success) {
        setWithdrawalToCancel(null);
        setSelectedWithdrawal(null);
        showAlert({
          type: "success",
          title: "Withdrawal Cancelled",
          message: res.message || "Your withdrawal request was cancelled. ₹" + withdrawal.amount + " has been restored to your available cash.",
          buttonText: "OK",
        });
        await loadReferralData();
      } else {
        showAlert({
          type: "warning",
          title: "Cannot Cancel",
          message: res.message || "Could not cancel this withdrawal request.",
        });
      }
    } finally {
      setCancellingId(null);
    }
  };

  const handleSelectReferral = async (item: Referral) => {
    setSelectedReferral(item);
    if (!item.referred_user_id) return;

    try {
      // Direct fetch from profiles table to ensure freshest phone and email
      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", item.referred_user_id)
        .maybeSingle();

      if (!profErr && prof) {
        const phone = prof.phone || prof.mobile_number || prof.phone_number || item.referred_phone || null;
        const email = prof.email || prof.business_email || item.referred_email || null;
        const name =
          prof.full_name?.trim() ||
          [prof.first_name, prof.last_name].filter(Boolean).join(" ").trim() ||
          prof.username?.trim() ||
          item.referred_name;

        setSelectedReferral((prev) => {
          if (!prev || prev.id !== item.id) return prev;
          return {
            ...prev,
            referred_name: name || prev.referred_name,
            referred_email: email || prev.referred_email,
            referred_phone: phone || prev.referred_phone,
          };
        });
      }
    } catch (err) {
      console.warn("[Referral] Error fetching profile for referral details:", err);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pendingCount = earnings?.pending_referrals ?? referrals.filter((item) => item.status === "pending").length;
  const completedCount = earnings?.completed_referrals ?? referrals.filter((item) => item.status === "completed" || item.status === "rewarded").length;
  const totalCount = earnings?.total_referrals ?? referrals.length;
  const totalRewards = earnings?.lifetime_earnings ?? referrals.reduce((total, item) => {
    if (item.status === "completed" || item.status === "rewarded") {
      return total + Number(item.reward_amount || 100);
    }
    return total;
  }, 0);

  // Calculate pending and completed withdrawals
  const pendingWithdrawalsAmount = withdrawals
    .filter((w) => w.status === "pending" || w.status === "processing")
    .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

  const completedWithdrawalsAmount = withdrawals
    .filter((w) => w.status === "completed")
    .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

  const totalWithdrawnOrPending = pendingWithdrawalsAmount + completedWithdrawalsAmount;

  // Real available balance is lifetime earnings minus all active/pending/completed withdrawals
  const availableBalance = earnings?.active_rewards_balance !== undefined
    ? earnings.active_rewards_balance
    : Math.max(0, totalRewards - totalWithdrawnOrPending);

  const hasPendingWithdrawal = pendingWithdrawalsAmount > 0;
  const pendingWithdrawalItem = withdrawals.find(
    (w) => w.status === "pending" || w.status === "processing"
  );

  const currentMilestone = earnings?.milestone || REFERRAL_MILESTONES[0];
  const nextMilestone = earnings?.nextMilestone;
  const progressPercent = earnings?.progressPercent || 0;

  const getStatusConfig = (status: ReferralStatus) => {
    switch (status) {
      case "pending":
        return { label: "Pending", icon: Clock3, color: "#F59E0B", bg: "rgba(245, 158, 11, 0.15)" };
      case "completed":
        return { label: "Completed", icon: CheckCircle2, color: "#10B981", bg: "rgba(16, 185, 129, 0.15)" };
      case "rewarded":
        return { label: "Rewarded", icon: Gift, color: "#8B5CF6", bg: "rgba(139, 92, 246, 0.15)" };
      case "cancelled":
        return { label: "Cancelled", icon: Clock3, color: "#EF4444", bg: "rgba(239, 68, 68, 0.15)" };
      default:
        return { label: status, icon: Clock3, color: "#6B7280", bg: "rgba(107, 114, 128, 0.15)" };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading referral system...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorTitle, { color: colors.text }]}>Something went wrong</Text>
          <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>{error}</Text>
          <Pressable
            onPress={loadReferralData}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.retryText, { color: colors.primaryForeground }]}>Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top"]}>
      <FlatList
        data={activeTab === "referrals" ? referrals : (withdrawals as any[])}
        keyExtractor={(item: any) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View>
            {/* Top Navigation Bar */}
            <View style={styles.header}>
              <Pressable
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace('/(tabs)/account' as any);
                  }
                }}
                hitSlop={12}
                style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <ArrowLeft size={20} color={colors.text} />
              </Pressable>

              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.title, { color: colors.text }]}>Refer & Earn</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Earn flat ₹100 cash for every friend you refer
                </Text>
              </View>

              <View style={[styles.headerIcon, { backgroundColor: colors.primaryMuted }]}>
                <Gift size={22} color={colors.primary} />
              </View>
            </View>

            {/* Locked Notice if user has not purchased GAP Pro plan */}
            {eligibility && !eligibility.canRefer && (
              <View
                style={[
                  styles.lockedNoticeCard,
                  {
                    backgroundColor: isDark ? "rgba(245, 158, 11, 0.12)" : "#FFFBEB",
                    borderColor: isDark ? "rgba(245, 158, 11, 0.4)" : "#FDE68A",
                  },
                ]}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={[
                      styles.lockedIconBox,
                      { backgroundColor: isDark ? "rgba(245, 158, 11, 0.25)" : "#FEF3C7" },
                    ]}
                  >
                    <Lock size={18} color="#D97706" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.lockedNoticeTitle, { color: colors.text }]}>
                      {incomingRef?.hasReferrer
                        ? "5% Referral Welcome Discount Available"
                        : "GAP Pro Required to Refer & Earn"}
                    </Text>
                    <Text style={[styles.lockedNoticeBody, { color: colors.textSecondary }]}>
                      {incomingRef?.hasReferrer
                        ? `You were invited by ${incomingRef.referrerName || "a friend"}! You get 5% Welcome Discount on all GAP Pro plans. Upgrade now to claim your 5% OFF and start earning flat ₹100 cash per referral.`
                        : "Upgrade to GAP Pro to unlock your personal referral link and start earning flat ₹100 cash on every friend who joins."}
                    </Text>
                  </View>
                </View>

                {incomingRef?.hasReferrer && Boolean(incomingRef.referrerCode) && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: isDark ? "rgba(0,0,0,0.25)" : "#FFFFFF",
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      marginVertical: 10,
                      borderWidth: 1,
                      borderColor: isDark ? "rgba(245, 158, 11, 0.3)" : "#FDE68A",
                    }}
                  >
                    <View>
                      <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: "600" }}>
                        REFERRER CODE
                      </Text>
                      <Text style={{ fontSize: 13, fontWeight: "800", color: colors.text, letterSpacing: 0.8 }}>
                        {incomingRef.referrerCode}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={async () => {
                        if (incomingRef.referrerCode) {
                          await Clipboard.setStringAsync(incomingRef.referrerCode);
                          showAlert({
                            type: "success",
                            title: "Copied!",
                            message: `Referrer code ${incomingRef.referrerCode} copied to clipboard.`,
                          });
                        }
                      }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        paddingVertical: 5,
                        paddingHorizontal: 10,
                        borderRadius: 8,
                        backgroundColor: isDark ? "rgba(217, 119, 6, 0.2)" : "#FEF3C7",
                      }}
                      activeOpacity={0.7}
                    >
                      <Copy size={13} color="#D97706" />
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#D97706" }}>Copy Code</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => router.push("/account/plans")}
                  style={[styles.lockedActionBtn, { backgroundColor: colors.primary }]}
                  activeOpacity={0.8}
                >
                  <Sparkles size={14} color={colors.primaryForeground} />
                  <Text style={[styles.lockedActionBtnText, { color: colors.primaryForeground }]}>
                    {incomingRef?.hasReferrer
                      ? "Claim 5% Discount on GAP Pro"
                      : "Upgrade to GAP Pro to Unlock"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Consolidated Minimal Referral Hero Card */}
            <View style={{ marginBottom: 16 }}>
              <AnimatedReferralCard
                isDark={isDark}
                referralCode={referralCode}
                onCopyCode={copyReferralCode}
                onCopyLink={copyReferralLink}
                onShare={shareReferral}
                headline={
                  eligibility && !eligibility.canRefer
                    ? "GAP Pro Required to Refer & Earn"
                    : "Invite Friends & Earn ₹100"
                }
                badgeText={
                  eligibility && !eligibility.canRefer
                    ? "🔒 GAP Pro Plan Required to Share"
                    : "Give 5% OFF • Earn ₹100 Cash"
                }
                subtitle={
                  eligibility && !eligibility.canRefer
                    ? "You must have an active GAP Pro plan to activate your referral link. Friends you invite get 5% OFF GAP Pro!"
                    : "Friends you refer get 5% Welcome Discount on all GAP Pro plans. You earn flat ₹100 cash on every subscription!"
                }
                buttonText={
                  eligibility && !eligibility.canRefer
                    ? "Get GAP Pro to Unlock"
                    : "Share Referral Link"
                }
              />
            </View>

            {/* Statistics */}
            <View style={styles.statsRow}>
              <StatCard
                icon={Clock3}
                label="Pending"
                value={String(pendingCount)}
                colors={colors}
              />
              <StatCard
                icon={CheckCircle2}
                label="Completed"
                value={String(completedCount)}
                colors={colors}
              />
              <StatCard
                icon={Wallet}
                label="Total Rewards"
                value={`₹${totalRewards.toFixed(0)}`}
                colors={colors}
              />
            </View>

            {/* 5% Welcome Discount Feature Pill */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: isDark ? "rgba(139, 92, 246, 0.12)" : "#F5F3FF",
                borderWidth: 1,
                borderColor: isDark ? "rgba(139, 92, 246, 0.3)" : "#DDD6FE",
                borderRadius: 14,
                paddingVertical: 10,
                paddingHorizontal: 14,
                marginBottom: 16,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: "#8B5CF6",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Percent size={16} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: isDark ? "#C084FC" : "#6D28D9" }}>
                    5% Welcome Discount Active
                  </Text>
                  <Text style={{ fontSize: 11, color: isDark ? "#E9D5FF" : "#7C3AED" }}>
                    Every friend you invite gets 5% OFF all GAP Pro plans
                  </Text>
                </View>
              </View>
              <View
                style={{
                  backgroundColor: "#8B5CF6",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "800", color: "#FFFFFF" }}>5% OFF</Text>
              </View>
            </View>

            {/* Available Cash & Withdraw Banner */}
            <View
              style={[
                styles.balanceCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.balanceInfo}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
                    AVAILABLE CASH
                  </Text>
                  <View
                    style={[
                      styles.activeDot,
                      {
                        backgroundColor:
                          availableBalance >= 100
                            ? "#10B981"
                            : hasPendingWithdrawal
                              ? "#F59E0B"
                              : "#9CA3AF",
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.balanceAmount, { color: colors.text }]}>
                  ₹{availableBalance.toFixed(0)}
                </Text>
                <Text style={[styles.balanceSubtext, { color: colors.textSecondary }]}>
                  {hasPendingWithdrawal
                    ? `₹${pendingWithdrawalsAmount.toFixed(0)} payout in review • Processing`
                    : availableBalance >= 100
                      ? "Ready for instant UPI / Bank payout"
                      : "Min ₹100 required to withdraw"}
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  if (hasPendingWithdrawal && availableBalance < 100) {
                    if (pendingWithdrawalItem) {
                      setSelectedWithdrawal(pendingWithdrawalItem);
                    } else {
                      showAlert({
                        type: "info",
                        title: "Payout In Progress",
                        message: `A withdrawal request for ₹${pendingWithdrawalsAmount.toFixed(0)} has been submitted and is currently being processed. You cannot withdraw this amount again until completed or cancelled.`,
                        buttonText: "Understood",
                      });
                    }
                    return;
                  }
                  if (availableBalance < 100) {
                    showAlert({
                      type: "warning",
                      title: "Minimum Withdrawal ₹100",
                      message: `Your available balance is ₹${availableBalance.toFixed(0)}. You need at least ₹100 to request a payout. Refer friends to earn flat ₹100 cash!`,
                      buttonText: "OK",
                    });
                    return;
                  }
                  setShowWithdrawModal(true);
                }}
                style={[
                  styles.withdrawBtn,
                  {
                    backgroundColor:
                      availableBalance >= 100
                        ? colors.primary
                        : hasPendingWithdrawal
                          ? (isDark ? "rgba(245, 158, 11, 0.2)" : "#FEF3C7")
                          : (isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"),
                    borderColor: hasPendingWithdrawal && availableBalance < 100 ? "#F59E0B" : "transparent",
                    borderWidth: hasPendingWithdrawal && availableBalance < 100 ? 1 : 0,
                  },
                ]}
              >
                {hasPendingWithdrawal && availableBalance < 100 ? (
                  <Clock3 size={15} color={isDark ? "#FCD34D" : "#B45309"} />
                ) : (
                  <Wallet
                    size={16}
                    color={availableBalance >= 100 ? colors.primaryForeground : colors.textSecondary}
                  />
                )}
                <Text
                  style={[
                    styles.withdrawBtnText,
                    {
                      color:
                        availableBalance >= 100
                          ? colors.primaryForeground
                          : hasPendingWithdrawal
                            ? (isDark ? "#FCD34D" : "#B45309")
                            : colors.textSecondary,
                    },
                  ]}
                >
                  {hasPendingWithdrawal && availableBalance < 100 ? "In Review" : "Withdraw"}
                </Text>
              </Pressable>
            </View>

            {/* Pending Payout Banner if withdrawal request is in progress */}
            {hasPendingWithdrawal && (
              <View
                style={[
                  styles.pendingPayoutNotice,
                  {
                    backgroundColor: isDark ? "rgba(245, 158, 11, 0.12)" : "#FFFBEB",
                    borderColor: isDark ? "rgba(245, 158, 11, 0.35)" : "#FDE68A",
                  },
                ]}
              >
                <Clock3 size={16} color="#F59E0B" style={{ marginTop: 2 }} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <Text style={[styles.pendingNoticeTitle, { color: isDark ? "#FCD34D" : "#92400E" }]}>
                      Payout Request: ₹{pendingWithdrawalsAmount.toFixed(0)}
                    </Text>
                    <View style={styles.inReviewPill}>
                      <Text style={styles.inReviewPillText}>Processing</Text>
                    </View>
                  </View>
                  <Text style={[styles.pendingNoticeBody, { color: isDark ? "#E5E7EB" : "#78350F" }]}>
                    Your ₹{pendingWithdrawalsAmount.toFixed(0)} withdrawal request is being processed. It has been deducted from your available cash and is not ready to withdraw again.
                  </Text>
                  {pendingWithdrawalItem && (
                    <View style={styles.bannerActionRow}>
                      <TouchableOpacity
                        onPress={() => setWithdrawalToCancel(pendingWithdrawalItem)}
                        style={[
                          styles.bannerCancelBtn,
                          {
                            backgroundColor: isDark ? "rgba(239, 68, 68, 0.18)" : "#FEE2E2",
                            borderColor: "#EF4444",
                          },
                        ]}
                        activeOpacity={0.7}
                      >
                        <XCircle size={13} color="#EF4444" />
                        <Text style={styles.bannerCancelBtnText}>Cancel Request</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setSelectedWithdrawal(pendingWithdrawalItem)}
                        style={[
                          styles.bannerDetailBtn,
                          {
                            backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#FFFFFF",
                            borderColor: colors.border,
                          },
                        ]}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.bannerDetailBtnText, { color: colors.text }]}>View Details</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Activity Header */}
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Referral Activity
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  Track your invites and payout requests
                </Text>
              </View>
            </View>

            {/* Invites vs Withdrawals Tab Bar */}
            <View
              style={[
                styles.tabBar,
                { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6" },
              ]}
            >
              <Pressable
                onPress={() => setActiveTab("referrals")}
                style={[
                  styles.tabItem,
                  activeTab === "referrals" && [
                    styles.tabItemActive,
                    { backgroundColor: colors.surface },
                  ],
                ]}
              >
                <Users
                  size={15}
                  color={activeTab === "referrals" ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: activeTab === "referrals" ? colors.text : colors.textSecondary,
                      fontWeight: activeTab === "referrals" ? "700" : "500",
                    },
                  ]}
                >
                  Invites ({referrals.length})
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveTab("withdrawals")}
                style={[
                  styles.tabItem,
                  activeTab === "withdrawals" && [
                    styles.tabItemActive,
                    { backgroundColor: colors.surface },
                  ],
                ]}
              >
                <Wallet
                  size={15}
                  color={activeTab === "withdrawals" ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: activeTab === "withdrawals" ? colors.text : colors.textSecondary,
                      fontWeight: activeTab === "withdrawals" ? "700" : "500",
                    },
                  ]}
                >
                  Withdrawals ({withdrawals.length})
                </Text>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item, index }: { item: any; index: number }) => {
          if (activeTab === "withdrawals") {
            const isUPI = item.payout_method === "upi";
            const isCompleted = item.status === "completed";
            const isRejected = item.status === "rejected";
            const statusBg = isCompleted
              ? "rgba(16, 185, 129, 0.15)"
              : isRejected
                ? "rgba(239, 68, 68, 0.15)"
                : "rgba(245, 158, 11, 0.15)";
            const statusColor = isCompleted ? "#10B981" : isRejected ? "#EF4444" : "#F59E0B";
            const statusLabel = isCompleted ? "Transferred" : isRejected ? "Rejected" : "Processing";

            return (
              <TouchableOpacity
                onPress={() => setSelectedWithdrawal(item)}
                style={[
                  styles.referralItem,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.referralIcon,
                    { backgroundColor: isDark ? "rgba(10, 132, 255, 0.15)" : "#EBF5FF" },
                  ]}
                >
                  {isUPI ? (
                    <Smartphone size={20} color="#0A84FF" />
                  ) : (
                    <Building2 size={20} color="#0A84FF" />
                  )}
                </View>

                <View style={styles.referralInfo}>
                  <Text style={[styles.referralTitle, { color: colors.text }]} numberOfLines={1}>
                    {isUPI ? `UPI: ${item.upi_id}` : (item.bank_name ? item.bank_name : "Bank Transfer")}
                  </Text>
                  <Text style={[styles.referralDate, { color: colors.textSecondary }]}>
                    {isUPI ? "UPI Transfer" : (item.account_holder_name ? `A/c: ${item.account_holder_name}` : "Bank Transfer")} • {formatDate(item.created_at)}
                  </Text>
                </View>

                <View style={styles.referralRight}>
                  <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {statusLabel}
                    </Text>
                  </View>
                  <Text style={[styles.rewardAmount, { color: colors.text }]}>
                    ₹{item.amount}
                  </Text>
                  {(item.status === "pending" || item.status === "processing") && (
                    <TouchableOpacity
                      onPress={() => setWithdrawalToCancel(item)}
                      style={[
                        styles.inlineCancelBtn,
                        {
                          backgroundColor: isDark ? "rgba(239, 68, 68, 0.15)" : "#FEE2E2",
                          borderColor: "#EF4444",
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.inlineCancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <ChevronRight size={15} color={colors.textSecondary} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            );
          }

          const statusConfig = getStatusConfig(item.status);
          const StatusIcon = statusConfig.icon;
          const isDone = item.status === "completed" || item.status === "rewarded";
          const displayName = getReferralDisplayName(item, index);

          return (
            <TouchableOpacity
              onPress={() => handleSelectReferral(item)}
              style={[
                styles.referralItem,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.referralIcon,
                  { backgroundColor: statusConfig.bg },
                ]}
              >
                <StatusIcon size={20} color={statusConfig.color} />
              </View>

              <View style={styles.referralInfo}>
                <Text style={[styles.referralTitle, { color: colors.text }]} numberOfLines={1}>
                  {displayName}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 }}>
                  <Text style={[styles.referralDate, { color: colors.textSecondary }]}>
                    {formatDate(item.created_at)}
                  </Text>
                  <Text style={{ fontSize: 10, color: colors.textSecondary }}>•</Text>
                  <View
                    style={{
                      backgroundColor: isDone
                        ? (isDark ? "rgba(16, 185, 129, 0.2)" : "#ECFDF5")
                        : (isDark ? "rgba(139, 92, 246, 0.2)" : "#F5F3FF"),
                      paddingHorizontal: 6,
                      paddingVertical: 1,
                      borderRadius: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "700",
                        color: isDone ? "#10B981" : "#8B5CF6",
                      }}
                    >
                      {isDone ? "5% Discount Used" : "5% Welcome Discount"}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.referralRight}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusConfig.bg },
                  ]}
                >
                  <Text style={[styles.statusText, { color: statusConfig.color }]}>
                    {statusConfig.label}
                  </Text>
                </View>

                {isDone ? (
                  <Text style={[styles.rewardAmount, { color: "#10B981" }]}>
                    +₹{Math.max(100, Number(item.reward_amount) || 100)}
                  </Text>
                ) : (
                  <Text style={[styles.rewardPendingAmount, { color: colors.textSecondary }]}>
                    ₹100 on sub
                  </Text>
                )}
              </View>

              <ChevronRight size={15} color={colors.textSecondary} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          activeTab === "withdrawals" ? (
            <View style={[styles.emptyContainer, { borderColor: colors.border }]}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.primaryMuted }]}>
                <Wallet size={28} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Withdrawals Yet</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {availableBalance >= 100
                  ? `You have ₹${availableBalance.toFixed(0)} available cash balance. Tap 'Withdraw' to request a payout to your UPI ID or Bank Account.`
                  : "Once you refer friends and earn ₹100 or more, you can withdraw your cash rewards directly to your UPI ID or Bank Account."}
              </Text>
              {availableBalance >= 100 && (
                <Pressable
                  onPress={() => setShowWithdrawModal(true)}
                  style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                >
                  <Wallet size={16} color={colors.primaryForeground} />
                  <Text style={[styles.emptyButtonText, { color: colors.primaryForeground }]}>
                    Withdraw Cash Now
                  </Text>
                </Pressable>
              )}
            </View>
          ) : (
            <View style={[styles.emptyContainer, { borderColor: colors.border }]}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.primaryMuted }]}>
                <Users size={28} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Referrals Yet</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Share your referral link with friends. For every friend who joins GetAiPilot, you will receive flat ₹100 cash reward!
              </Text>
              <Pressable
                onPress={shareReferral}
                style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              >
                {eligibility && !eligibility.canRefer ? (
                  <>
                    <Lock size={16} color={colors.primaryForeground} />
                    <Text style={[styles.emptyButtonText, { color: colors.primaryForeground }]}>
                      Unlock Referral Link
                    </Text>
                  </>
                ) : (
                  <>
                    <Share2 size={16} color={colors.primaryForeground} />
                    <Text style={[styles.emptyButtonText, { color: colors.primaryForeground }]}>
                      Invite Friends Now
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          )
        }
      />

      {/* Milestone Levels Modal */}
      <Modal
        visible={showMilestonesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMilestonesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Referral Cash Rewards
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  Earn flat ₹100 cash reward for every referral who joins
                </Text>
              </View>
              <Pressable
                onPress={() => setShowMilestonesModal(false)}
                style={[styles.modalCloseBtn, { backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center" }]}
              >
                <X size={16} color={colors.text} />
              </Pressable>
            </View>

            <View style={{ gap: 12, marginVertical: 16 }}>
              {REFERRAL_MILESTONES.map((m) => {
                const isReached = completedCount >= m.requiredReferrals;
                return (
                  <View
                    key={m.level}
                    style={[
                      styles.milestoneRow,
                      {
                        backgroundColor: isReached
                          ? (isDark ? "rgba(16, 185, 129, 0.15)" : "#ECFDF5")
                          : colors.background,
                        borderColor: isReached ? "#10B981" : colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.tierBadge,
                        { backgroundColor: m.badgeColor || "#0A84FF" },
                      ]}
                    >
                      <Text style={styles.tierBadgeText}>Lvl {m.level}</Text>
                    </View>

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={[styles.tierTitle, { color: colors.text }]}>
                          {m.title}
                        </Text>
                        <Text style={[styles.tierRequired, { color: colors.textSecondary }]}>
                          ({m.requiredReferrals}+ refs)
                        </Text>
                      </View>
                      <Text style={[styles.tierPerk, { color: colors.textSecondary }]}>
                        {m.description}
                      </Text>
                    </View>

                    {isReached && (
                      <View style={styles.unlockedTag}>
                        <CheckCircle2 size={16} color="#10B981" />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            <Pressable
              onPress={() => setShowMilestonesModal(false)}
              style={[styles.modalDoneBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.modalDoneBtnText, { color: colors.primaryForeground }]}>
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Referral Withdraw Modal */}
      <ReferralWithdrawModal
        visible={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        userId={userId}
        availableBalance={availableBalance}
        onSuccess={() => {
          loadReferralData();
        }}
        colors={colors}
      />

      {/* Referral Detail Modal */}
      <Modal
        visible={!!selectedReferral}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedReferral(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Referral Details
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  Referred member information and reward status
                </Text>
              </View>
              <Pressable
                onPress={() => setSelectedReferral(null)}
                style={[styles.modalCloseBtn, { backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center" }]}
              >
                <X size={16} color={colors.text} />
              </Pressable>
            </View>

            {selectedReferral && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                {/* Member Header Card */}
                <View
                  style={[
                    styles.detailProfileCard,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                >
                  <View style={[styles.detailAvatar, { backgroundColor: colors.primaryMuted }]}>
                    <User size={22} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.detailMemberName, { color: colors.text }]}>
                      {getReferralDisplayName(selectedReferral, 0)}
                    </Text>
                    <Text style={[styles.detailMemberSubtitle, { color: colors.textSecondary }]}>
                      Joined on {formatDate(selectedReferral.created_at)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          selectedReferral.status === "completed" || selectedReferral.status === "rewarded"
                            ? "rgba(16, 185, 129, 0.15)"
                            : "rgba(245, 158, 11, 0.15)",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            selectedReferral.status === "completed" || selectedReferral.status === "rewarded"
                              ? "#10B981"
                              : "#F59E0B",
                        },
                      ]}
                    >
                      {selectedReferral.status === "completed" || selectedReferral.status === "rewarded"
                        ? "Completed"
                        : "Pending"}
                    </Text>
                  </View>
                </View>

                {/* Info Rows */}
                <View
                  style={[
                    styles.detailSectionBox,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                >
                  {/* Email */}
                  <View style={styles.detailRow}>
                    <View style={styles.detailRowLeft}>
                      <Mail size={16} color={colors.textSecondary} />
                      <Text style={[styles.detailRowLabel, { color: colors.textSecondary }]}>
                        Email Address
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={[styles.detailRowValue, { color: colors.text }]} selectable>
                        {selectedReferral.referred_email || "Not specified"}
                      </Text>
                      {selectedReferral.referred_email ? (
                        <TouchableOpacity
                          onPress={() => {
                            Clipboard.setStringAsync(selectedReferral.referred_email!);
                            showAlert({
                              type: "success",
                              title: "Copied",
                              message: "Email address copied to clipboard.",
                            });
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Copy size={13} color={colors.textSecondary} />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>

                  {/* Phone */}
                  <View style={styles.detailRow}>
                    <View style={styles.detailRowLeft}>
                      <Phone size={16} color={colors.textSecondary} />
                      <Text style={[styles.detailRowLabel, { color: colors.textSecondary }]}>
                        Phone Number
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={[styles.detailRowValue, { color: colors.text }]} selectable>
                        {selectedReferral.referred_phone || "Not specified"}
                      </Text>
                      {selectedReferral.referred_phone ? (
                        <TouchableOpacity
                          onPress={() => {
                            Clipboard.setStringAsync(selectedReferral.referred_phone!);
                            showAlert({
                              type: "success",
                              title: "Copied",
                              message: "Phone number copied to clipboard.",
                            });
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Copy size={13} color={colors.textSecondary} />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>

                  {/* Referral Code */}
                  <View style={styles.detailRow}>
                    <View style={styles.detailRowLeft}>
                      <Gift size={16} color={colors.textSecondary} />
                      <Text style={[styles.detailRowLabel, { color: colors.textSecondary }]}>
                        Referral Code
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={[styles.detailRowValue, { color: colors.primary, fontWeight: "700" }]}>
                        {selectedReferral.referral_code || referralCode}
                      </Text>
                      <TouchableOpacity
                        onPress={async () => {
                          const c = selectedReferral.referral_code || referralCode;
                          if (c) {
                            await Clipboard.setStringAsync(c);
                            showAlert({
                              type: "success",
                              title: "Copied!",
                              message: `Referral code ${c} copied to clipboard.`,
                            });
                          }
                        }}
                        hitSlop={8}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                          paddingVertical: 3,
                          paddingHorizontal: 8,
                          borderRadius: 8,
                          backgroundColor: colors.primaryMuted,
                        }}
                        activeOpacity={0.7}
                      >
                        <Copy size={12} color={colors.primary} />
                        <Text style={{ fontSize: 11, fontWeight: "700", color: colors.primary }}>Copy</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Friend's Welcome Discount */}
                  <View style={styles.detailRow}>
                    <View style={styles.detailRowLeft}>
                      <Percent size={16} color="#8B5CF6" />
                      <Text style={[styles.detailRowLabel, { color: colors.textSecondary }]}>
                        Welcome Discount
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        backgroundColor:
                          selectedReferral.status === "completed" || selectedReferral.status === "rewarded"
                            ? (isDark ? "rgba(16, 185, 129, 0.2)" : "#ECFDF5")
                            : (isDark ? "rgba(139, 92, 246, 0.2)" : "#F5F3FF"),
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "800",
                          color:
                            selectedReferral.status === "completed" || selectedReferral.status === "rewarded"
                              ? "#10B981"
                              : "#8B5CF6",
                        }}
                      >
                        5% OFF GAP Pro
                      </Text>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "700",
                          color:
                            selectedReferral.status === "completed" || selectedReferral.status === "rewarded"
                              ? "#059669"
                              : "#7C3AED",
                        }}
                      >
                        {selectedReferral.status === "completed" || selectedReferral.status === "rewarded"
                          ? "• Claimed"
                          : "• Active"}
                      </Text>
                    </View>
                  </View>

                  {/* Your Reward Amount */}
                  <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                    <View style={styles.detailRowLeft}>
                      <Wallet size={16} color={colors.textSecondary} />
                      <Text style={[styles.detailRowLabel, { color: colors.textSecondary }]}>
                        Your Cash Reward
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.detailRowValue,
                        {
                          color:
                            selectedReferral.status === "completed" || selectedReferral.status === "rewarded"
                              ? "#10B981"
                              : "#F59E0B",
                          fontWeight: "700",
                        },
                      ]}
                    >
                      {selectedReferral.status === "completed" || selectedReferral.status === "rewarded"
                        ? `+₹${Math.max(100, Number(selectedReferral.reward_amount) || 100)} Cash (Credited)`
                        : "₹100 (On Plan Purchase)"}
                    </Text>
                  </View>
                </View>

                {/* Status Explanation Box */}
                <View
                  style={[
                    styles.detailHintBox,
                    {
                      backgroundColor:
                        selectedReferral.status === "completed" || selectedReferral.status === "rewarded"
                          ? (isDark ? "rgba(16, 185, 129, 0.12)" : "#ECFDF5")
                          : (isDark ? "rgba(245, 158, 11, 0.12)" : "#FFFBEB"),
                      borderColor:
                        selectedReferral.status === "completed" || selectedReferral.status === "rewarded"
                          ? "#10B981"
                          : "#F59E0B",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.detailHintText,
                      {
                        color:
                          selectedReferral.status === "completed" || selectedReferral.status === "rewarded"
                            ? (isDark ? "#A7F3D0" : "#065F46")
                            : (isDark ? "#FDE68A" : "#92400E"),
                      },
                    ]}
                  >
                    {selectedReferral.status === "completed" || selectedReferral.status === "rewarded"
                      ? "✓ This friend claimed their 5% welcome discount on GAP Pro. Flat ₹100 cash reward was credited directly to your Available Cash balance."
                      : "⏳ This friend joined with your referral link and gets 5% OFF on all GAP Pro plans. As soon as they subscribe, ₹100 cash will be credited directly to your Available Cash balance."}
                  </Text>
                </View>
              </ScrollView>
            )}

            <Pressable
              onPress={() => setSelectedReferral(null)}
              style={[styles.modalDoneBtn, { backgroundColor: colors.primary, marginTop: 14 }]}
            >
              <Text style={[styles.modalDoneBtnText, { color: colors.primaryForeground }]}>
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Withdrawal Detail Modal with Cancel Action */}
      <Modal
        visible={!!selectedWithdrawal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedWithdrawal(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Withdrawal Details
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  Payout request and transfer information
                </Text>
              </View>
              <Pressable
                onPress={() => setSelectedWithdrawal(null)}
                style={[styles.modalCloseBtn, { backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center" }]}
              >
                <X size={16} color={colors.text} />
              </Pressable>
            </View>

            {selectedWithdrawal && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }}>
                {/* Payout Banner */}
                <View
                  style={[
                    styles.detailProfileCard,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                >
                  <View style={[styles.detailAvatar, { backgroundColor: colors.primaryMuted }]}>
                    <Wallet size={22} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.detailMemberName, { color: colors.text }]}>
                      ₹{selectedWithdrawal.amount}
                    </Text>
                    <Text style={[styles.detailMemberSubtitle, { color: colors.textSecondary }]}>
                      Requested on {formatDateTime(selectedWithdrawal.created_at)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          selectedWithdrawal.status === "completed"
                            ? "rgba(16, 185, 129, 0.15)"
                            : selectedWithdrawal.status === "rejected"
                              ? "rgba(239, 68, 68, 0.15)"
                              : "rgba(245, 158, 11, 0.15)",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            selectedWithdrawal.status === "completed"
                              ? "#10B981"
                              : selectedWithdrawal.status === "rejected"
                                ? "#EF4444"
                                : "#F59E0B",
                        },
                      ]}
                    >
                      {selectedWithdrawal.status === "completed"
                        ? "Transferred"
                        : selectedWithdrawal.status === "rejected"
                          ? "Rejected"
                          : "Processing"}
                    </Text>
                  </View>
                </View>

                {/* Details Box */}
                <View
                  style={[
                    styles.detailSectionBox,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.detailRow}>
                    <View style={styles.detailRowLeft}>
                      <Smartphone size={16} color={colors.textSecondary} />
                      <Text style={[styles.detailRowLabel, { color: colors.textSecondary }]}>
                        Payout Method
                      </Text>
                    </View>
                    <Text style={[styles.detailRowValue, { color: colors.text }]}>
                      {selectedWithdrawal.payout_method === "upi" ? "UPI Transfer" : "Bank Transfer"}
                    </Text>
                  </View>

                  {selectedWithdrawal.payout_method === "upi" ? (
                    <View style={styles.detailRow}>
                      <View style={styles.detailRowLeft}>
                        <Wallet size={16} color={colors.textSecondary} />
                        <Text style={[styles.detailRowLabel, { color: colors.textSecondary }]}>
                          UPI ID
                        </Text>
                      </View>
                      <Text style={[styles.detailRowValue, { color: colors.primary, fontWeight: "700" }]}>
                        {selectedWithdrawal.upi_id}
                      </Text>
                    </View>
                  ) : (
                    <>
                      <View style={styles.detailRow}>
                        <View style={styles.detailRowLeft}>
                          <Building2 size={16} color={colors.textSecondary} />
                          <Text style={[styles.detailRowLabel, { color: colors.textSecondary }]}>
                            Bank Account
                          </Text>
                        </View>
                        <Text style={[styles.detailRowValue, { color: colors.text }]}>
                          {selectedWithdrawal.account_number}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <View style={styles.detailRowLeft}>
                          <User size={16} color={colors.textSecondary} />
                          <Text style={[styles.detailRowLabel, { color: colors.textSecondary }]}>
                            A/C Name
                          </Text>
                        </View>
                        <Text style={[styles.detailRowValue, { color: colors.text }]}>
                          {selectedWithdrawal.account_holder_name}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <View style={styles.detailRowLeft}>
                          <Info size={16} color={colors.textSecondary} />
                          <Text style={[styles.detailRowLabel, { color: colors.textSecondary }]}>
                            IFSC Code
                          </Text>
                        </View>
                        <Text style={[styles.detailRowValue, { color: colors.text }]}>
                          {selectedWithdrawal.ifsc_code}
                        </Text>
                      </View>
                    </>
                  )}

                  <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                    <View style={styles.detailRowLeft}>
                      <Clock3 size={16} color={colors.textSecondary} />
                      <Text style={[styles.detailRowLabel, { color: colors.textSecondary }]}>
                        Payout Status
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.detailRowValue,
                        {
                          color:
                            selectedWithdrawal.status === "completed"
                              ? "#10B981"
                              : selectedWithdrawal.status === "rejected"
                                ? "#EF4444"
                                : "#F59E0B",
                          fontWeight: "700",
                        },
                      ]}
                    >
                      {selectedWithdrawal.status === "completed"
                        ? "Transferred Successfully"
                        : selectedWithdrawal.status === "rejected"
                          ? "Rejected"
                          : "Under Review / Processing"}
                    </Text>
                  </View>
                </View>

                {/* Status Explanation Box */}
                <View
                  style={[
                    styles.detailHintBox,
                    {
                      backgroundColor:
                        selectedWithdrawal.status === "completed"
                          ? (isDark ? "rgba(16, 185, 129, 0.12)" : "#ECFDF5")
                          : selectedWithdrawal.status === "rejected"
                            ? (isDark ? "rgba(239, 68, 68, 0.12)" : "#FEF2F2")
                            : (isDark ? "rgba(245, 158, 11, 0.12)" : "#FFFBEB"),
                      borderColor:
                        selectedWithdrawal.status === "completed"
                          ? "#10B981"
                          : selectedWithdrawal.status === "rejected"
                            ? "#EF4444"
                            : "#F59E0B",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.detailHintText,
                      {
                        color:
                          selectedWithdrawal.status === "completed"
                            ? (isDark ? "#A7F3D0" : "#065F46")
                            : selectedWithdrawal.status === "rejected"
                              ? (isDark ? "#FCA5A5" : "#991B1B")
                              : (isDark ? "#FDE68A" : "#92400E"),
                      },
                    ]}
                  >
                    {selectedWithdrawal.status === "completed"
                      ? `✓ Payout of ₹${selectedWithdrawal.amount} has been transferred to your destination account.`
                      : selectedWithdrawal.status === "rejected"
                        ? `✕ Payout request was rejected: ${selectedWithdrawal.notes || "Please check your account details or contact support."}`
                        : `⏳ Payout request of ₹${selectedWithdrawal.amount} is currently in review. Funds are dispatched within 24-48 business hours. This amount is deducted from available cash and not ready to withdraw again.`}
                  </Text>
                </View>

                {/* Cancel Request Button for Pending/Processing Withdrawals */}
                {(selectedWithdrawal.status === "pending" || selectedWithdrawal.status === "processing") && (
                  <Pressable
                    onPress={() => {
                      const item = selectedWithdrawal;
                      setSelectedWithdrawal(null);
                      setWithdrawalToCancel(item);
                    }}
                    disabled={cancellingId === selectedWithdrawal.id}
                    style={[
                      styles.cancelWithdrawalBtn,
                      {
                        backgroundColor: isDark ? "rgba(239, 68, 68, 0.15)" : "#FEF2F2",
                        borderColor: "#EF4444",
                      },
                    ]}
                  >
                    {cancellingId === selectedWithdrawal.id ? (
                      <ActivityIndicator size="small" color="#EF4444" />
                    ) : (
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <XCircle size={15} color="#EF4444" />
                        <Text style={styles.cancelWithdrawalText}>
                          Cancel Withdrawal Request (Restore ₹{selectedWithdrawal.amount})
                        </Text>
                      </View>
                    )}
                  </Pressable>
                )}
              </ScrollView>
            )}

            <Pressable
              onPress={() => setSelectedWithdrawal(null)}
              style={[styles.modalDoneBtn, { backgroundColor: colors.primary, marginTop: 14 }]}
            >
              <Text style={[styles.modalDoneBtnText, { color: colors.primaryForeground }]}>
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Dedicated Cancel Withdrawal Confirmation Modal */}
      <Modal
        visible={!!withdrawalToCancel}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!cancellingId) setWithdrawalToCancel(null);
        }}
      >
        <View style={styles.cancelModalOverlay}>
          <View
            style={[
              styles.cancelModalContent,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.cancelModalHeaderIcon}>
              <AlertTriangle size={28} color="#EF4444" />
            </View>

            <Text style={[styles.cancelModalTitle, { color: colors.text }]}>
              Cancel Withdrawal Request?
            </Text>

            <Text style={[styles.cancelModalSubtitle, { color: colors.textSecondary }]}>
              Are you sure you want to cancel this payout request of{" "}
              <Text style={{ fontWeight: "700", color: colors.text }}>
                ₹{withdrawalToCancel?.amount}
              </Text>
              ? The full amount will be immediately returned to your Available Cash.
            </Text>

            {withdrawalToCancel && (
              <View
                style={[
                  styles.cancelModalDetailsBox,
                  {
                    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F9FAFB",
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.cancelModalRow}>
                  <Text style={[styles.cancelModalRowLabel, { color: colors.textSecondary }]}>
                    Amount
                  </Text>
                  <Text style={[styles.cancelModalRowValue, { color: colors.text, fontWeight: "700" }]}>
                    ₹{withdrawalToCancel.amount}
                  </Text>
                </View>
                <View style={styles.cancelModalRow}>
                  <Text style={[styles.cancelModalRowLabel, { color: colors.textSecondary }]}>
                    Payout Method
                  </Text>
                  <Text style={[styles.cancelModalRowValue, { color: colors.text }]}>
                    {withdrawalToCancel.payout_method === "upi"
                      ? `UPI (${withdrawalToCancel.upi_id || "ID"})`
                      : `Bank (${withdrawalToCancel.bank_name || "A/c"})`}
                  </Text>
                </View>
                <View style={styles.cancelModalRow}>
                  <Text style={[styles.cancelModalRowLabel, { color: colors.textSecondary }]}>
                    Status
                  </Text>
                  <Text style={[styles.cancelModalRowValue, { color: "#F59E0B", fontWeight: "600" }]}>
                    Pending Review
                  </Text>
                </View>
              </View>
            )}

            <Pressable
              onPress={() => {
                if (withdrawalToCancel) {
                  handleCancelWithdrawal(withdrawalToCancel);
                }
              }}
              disabled={cancellingId === withdrawalToCancel?.id}
              style={[styles.confirmCancelBtn, { backgroundColor: "#EF4444" }]}
            >
              {cancellingId === withdrawalToCancel?.id ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmCancelBtnText}>Yes, Cancel Request</Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => setWithdrawalToCancel(null)}
              disabled={!!cancellingId}
              style={[
                styles.dismissCancelBtn,
                {
                  borderColor: colors.border,
                  backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#F3F4F6",
                },
              ]}
            >
              <Text style={[styles.dismissCancelBtnText, { color: colors.text }]}>
                Keep Request Active
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  colors,
}: {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  colors: ReturnType<typeof getColors>;
}) {
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={[styles.statIcon, { backgroundColor: colors.primaryMuted }]}>
        <Icon size={17} color={colors.primary} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 14,
    fontWeight: "700",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 18,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12.5,
    marginTop: 2,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  milestoneCard: {
    borderWidth: 0,
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
  },
  milestoneTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  milestoneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#10B981",
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 8,
  },
  milestoneBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  viewPerksBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  viewPerksText: {
    fontSize: 12,
    fontWeight: "700",
  },
  milestonePerkHeading: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 12,
  },
  progressBarWrapper: {
    gap: 6,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressSubtitle: {
    fontSize: 11,
  },
  progressPercentText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minHeight: 100,
    borderRadius: 20,
    borderWidth: 0,
    padding: 12,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 17,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  balanceCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  balanceAmount: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginVertical: 2,
  },
  balanceSubtext: {
    fontSize: 11.5,
  },
  withdrawBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  withdrawBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  pendingPayoutNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderRadius: 16,
    padding: 13,
    marginBottom: 16,
  },
  pendingNoticeTitle: {
    fontSize: 13.5,
    fontWeight: "700",
  },
  inReviewPill: {
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  inReviewPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#D97706",
  },
  pendingNoticeBody: {
    fontSize: 11.5,
    marginTop: 4,
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 11,
  },
  tabItemActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12.5,
  },
  referralItem: {
    minHeight: 72,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
  },
  referralIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  referralInfo: {
    flex: 1,
    marginLeft: 12,
  },
  referralTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  referralDate: {
    fontSize: 11,
    marginTop: 3,
  },
  referralRight: {
    alignItems: "flex-end",
    marginLeft: 8,
  },
  statusBadge: {
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  rewardAmount: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  rewardPendingAmount: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
  emptyContainer: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 6,
    maxWidth: 280,
  },
  emptyButton: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  emptyButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tierBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  tierTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  tierRequired: {
    fontSize: 11,
  },
  tierPerk: {
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },
  unlockedTag: {
    marginLeft: 8,
  },
  modalDoneBtn: {
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  modalDoneBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  detailProfileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 14,
    marginBottom: 12,
  },
  detailAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  detailMemberName: {
    fontSize: 15,
    fontWeight: "700",
  },
  detailMemberSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
  },
  detailSectionBox: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150, 150, 150, 0.15)",
  },
  detailRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailRowLabel: {
    fontSize: 12.5,
    fontWeight: "500",
  },
  detailRowValue: {
    fontSize: 12.5,
    fontWeight: "600",
  },
  detailHintBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  detailHintText: {
    fontSize: 12,
    lineHeight: 17,
  },
  cancelWithdrawalBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    marginBottom: 4,
  },
  cancelWithdrawalText: {
    color: "#EF4444",
    fontSize: 12.5,
    fontWeight: "700",
  },
  bannerActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  bannerCancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  bannerCancelBtnText: {
    color: "#EF4444",
    fontSize: 11.5,
    fontWeight: "700",
  },
  bannerDetailBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  bannerDetailBtnText: {
    fontSize: 11.5,
    fontWeight: "600",
  },
  inlineCancelBtn: {
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  inlineCancelBtnText: {
    color: "#EF4444",
    fontSize: 10.5,
    fontWeight: "700",
  },
  cancelModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  cancelModalContent: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    alignItems: "center",
  },
  cancelModalHeaderIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  cancelModalTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  cancelModalSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginBottom: 16,
  },
  cancelModalDetailsBox: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 18,
    gap: 8,
  },
  cancelModalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cancelModalRowLabel: {
    fontSize: 12,
  },
  cancelModalRowValue: {
    fontSize: 12,
  },
  confirmCancelBtn: {
    width: "100%",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  confirmCancelBtnText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "700",
  },
  dismissCancelBtn: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dismissCancelBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  lockedNoticeCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  lockedIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  lockedNoticeTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  lockedNoticeBody: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  lockedActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  lockedActionBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
