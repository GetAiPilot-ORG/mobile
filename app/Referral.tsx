import * as Clipboard from "expo-clipboard";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  Gift,
  Link as LinkIcon,
  Share2,
  Sparkles,
  Users,
  Wallet,
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
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { supabase } from "@/lib/supabase";
import { getColors } from "@/theme/colors";
import { useTheme } from "../src/theme";
import {
  getOrCreateReferralCode,
  getReferralEarnings,
  REFERRAL_MILESTONES,
  ReferralEarnings,
  ReferralMilestone,
} from "../src/services/referralService";

type ReferralStatus = "pending" | "completed" | "rewarded" | "cancelled";

interface Referral {
  id: string;
  referral_code: string;
  status: ReferralStatus;
  reward_amount: number;
  created_at: string;
  completed_at: string | null;
  rewarded_at: string | null;
}

const APP_REFERRAL_URL = "https://getaipilot.in/referral";

export default function ReferralScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const [referralCode, setReferralCode] = useState<string>("");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [earnings, setEarnings] = useState<ReferralEarnings | null>(null);
  const [showMilestonesModal, setShowMilestonesModal] = useState(false);
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

    try {
      setError(null);

      // 1. Get or create referral code
      const code = await getOrCreateReferralCode(user.id, user.email);
      setReferralCode(code);

      // 2. Load referrals list
      const { data: refData, error: refError } = await supabase
        .from("referrals")
        .select(
          "id, referral_code, status, reward_amount, created_at, completed_at, rewarded_at"
        )
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });

      if (refError) {
        console.warn("[Referral] Error fetching referrals list:", refError);
      }
      setReferrals((refData as Referral[]) || []);

      // 3. Load aggregated earnings and milestone info
      const earningsData = await getReferralEarnings(user.id);
      setEarnings(earningsData);
    } catch (err: any) {
      console.error("[Referral] Failed to load referral data:", err);
      setError(err?.message || "Unable to load referral information.");
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

  const copyReferralCode = async () => {
    if (!referralCode) {
      Alert.alert("Referral code unavailable", "Please wait while your referral code is being generated.");
      return;
    }

    try {
      await Clipboard.setStringAsync(referralCode);
      Alert.alert("Copied!", `Referral code ${referralCode} has been copied to your clipboard.`);
    } catch (err) {
      console.error("Copy referral code error:", err);
    }
  };

  const copyReferralLink = async () => {
    if (!referralCode) return;
    const link = `${APP_REFERRAL_URL}?ref=${encodeURIComponent(referralCode)}`;
    try {
      await Clipboard.setStringAsync(link);
      Alert.alert("Link Copied!", "Your personalized referral link has been copied to your clipboard.");
    } catch (err) {
      console.error("Copy referral link error:", err);
    }
  };

  const shareReferral = async () => {
    if (!referralCode) {
      Alert.alert("Referral code unavailable", "Your referral code is not available yet.");
      return;
    }

    const referralLink = `${APP_REFERRAL_URL}?ref=${encodeURIComponent(referralCode)}`;

    try {
      await Share.share({
        title: "Try GetAiPilot with 5% Discount",
        message:
          "Hey! Try GetAiPilot — the all-in-one AI automation suite for WhatsApp, Telegram, Voice AI, CRM, and Social Marketing.\n\n" +
          `Use my referral link for an instant 5% discount on your first plan:\n${referralLink}\n\n` +
          `Referral Code: ${referralCode}`,
      });
    } catch (err) {
      console.error("Share referral error:", err);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const pendingCount = earnings?.pending_referrals ?? referrals.filter((item) => item.status === "pending").length;
  const completedCount = earnings?.completed_referrals ?? referrals.filter((item) => item.status === "completed" || item.status === "rewarded").length;
  const totalCount = earnings?.total_referrals ?? referrals.length;
  const totalRewards = earnings?.lifetime_earnings ?? referrals.reduce((total, item) => {
    if (item.status === "completed" || item.status === "rewarded") {
      return total + Number(item.reward_amount || 0);
    }
    return total;
  }, 0);

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
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading referrals...</Text>
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
        data={referrals}
        keyExtractor={(item) => item.id}
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
                onPress={() => router.back()}
                hitSlop={12}
                style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <ArrowLeft size={20} color={colors.text} />
              </Pressable>

              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.title, { color: colors.text }]}>Refer & Earn</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Invite friends and unlock milestone perks
                </Text>
              </View>

              <View style={[styles.headerIcon, { backgroundColor: colors.primaryMuted }]}>
                <Gift size={22} color={colors.primary} />
              </View>
            </View>

            {/* Referral Code Card */}
            <View
              style={[
                styles.codeCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.codeHeader}>
                <View style={[styles.smallIcon, { backgroundColor: colors.primaryMuted }]}>
                  <LinkIcon size={18} color={colors.primary} />
                </View>

                <View style={styles.codeHeaderText}>
                  <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
                    YOUR REFERRAL CODE
                  </Text>
                  <Text style={[styles.code, { color: colors.text }]}>{referralCode || "---"}</Text>
                </View>

                <Pressable
                  onPress={copyReferralCode}
                  hitSlop={10}
                  style={[styles.copyButton, { backgroundColor: colors.primaryMuted }]}
                >
                  <Copy size={18} color={colors.primary} />
                </Pressable>
              </View>

              <Text style={[styles.codeDescription, { color: colors.textSecondary }]}>
                Share your code with colleagues or friends. When they register with your referral, they receive an instant 5% discount on their GAP Pro plan purchase, and you earn milestone perks!
              </Text>

              <View style={styles.actionButtonsRow}>
                <Pressable
                  onPress={shareReferral}
                  style={({ pressed }) => [
                    styles.shareButton,
                    { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Share2 size={18} color={colors.primaryForeground} />
                  <Text style={[styles.shareButtonText, { color: colors.primaryForeground }]}>
                    Share Referral Link
                  </Text>
                </Pressable>

                <Pressable
                  onPress={copyReferralLink}
                  style={({ pressed }) => [
                    styles.copyLinkBtn,
                    {
                      backgroundColor: colors.primaryMuted,
                      borderColor: colors.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <LinkIcon size={17} color={colors.primary} />
                </Pressable>
              </View>
            </View>

            {/* Milestone Progression Card */}
            <View
              style={[
                styles.milestoneCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.milestoneTopRow}>
                <View style={styles.milestoneBadge}>
                  <Award size={16} color="#FFFFFF" />
                  <Text style={styles.milestoneBadgeText}>
                    {completedCount >= 1 ? currentMilestone.title : "Bronze Candidate"}
                  </Text>
                </View>

                <Pressable
                  onPress={() => setShowMilestonesModal(true)}
                  style={styles.viewPerksBtn}
                >
                  <Text style={[styles.viewPerksText, { color: colors.primary }]}>
                    View All Tiers →
                  </Text>
                </Pressable>
              </View>

              <Text style={[styles.milestonePerkHeading, { color: colors.text }]}>
                {completedCount >= 1
                  ? `Unlocked: ${currentMilestone.bonusPerk} (${currentMilestone.discountPercent}% OFF)`
                  : "Refer 1 friend to unlock Bronze Pilot & 10% OFF"}
              </Text>

              {/* Progress Bar */}
              <View style={styles.progressBarWrapper}>
                <View style={[styles.progressBarTrack, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${progressPercent}%`,
                        backgroundColor: currentMilestone.badgeColor || colors.primary,
                      },
                    ]}
                  />
                </View>

                <View style={styles.progressLabelRow}>
                  <Text style={[styles.progressSubtitle, { color: colors.textSecondary }]}>
                    {nextMilestone
                      ? `${completedCount} / ${nextMilestone.requiredReferrals} referrals to ${nextMilestone.title}`
                      : "Diamond VIP status achieved! 🏆"}
                  </Text>
                  <Text style={[styles.progressPercentText, { color: colors.text }]}>
                    {progressPercent}%
                  </Text>
                </View>
              </View>
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

            {/* Activity Header */}
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Referral Activity
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  Track your invites and earnings status
                </Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const statusConfig = getStatusConfig(item.status);
          const StatusIcon = statusConfig.icon;

          return (
            <View
              style={[
                styles.referralItem,
                { backgroundColor: colors.surface, borderColor: colors.border },
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
                <Text style={[styles.referralTitle, { color: colors.text }]}>
                  Code: {item.referral_code}
                </Text>
                <Text style={[styles.referralDate, { color: colors.textSecondary }]}>
                  Invited on {formatDate(item.created_at)}
                </Text>
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

                {Boolean(item.reward_amount && item.reward_amount > 0) && (
                  <Text style={[styles.rewardAmount, { color: "#10B981" }]}>
                    +₹{item.reward_amount}
                  </Text>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { borderColor: colors.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primaryMuted }]}>
              <Users size={28} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Referrals Yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Share your referral link with friends. When they subscribe to GetAiPilot, their completed referral and your milestone perks will appear here!
            </Text>
            <Pressable
              onPress={shareReferral}
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            >
              <Share2 size={16} color={colors.primaryForeground} />
              <Text style={[styles.emptyButtonText, { color: colors.primaryForeground }]}>
                Invite Friends Now
              </Text>
            </Pressable>
          </View>
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
                  Referral Milestones & Perks
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  Unlock higher discounts and exclusive tools
                </Text>
              </View>
              <Pressable
                onPress={() => setShowMilestonesModal(false)}
                style={[styles.modalCloseBtn, { backgroundColor: colors.primaryMuted }]}
              >
                <Text style={{ color: colors.text, fontWeight: "700" }}>✕</Text>
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
  codeCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
  },
  codeHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  smallIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  codeHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  code: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 3,
  },
  copyButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  codeDescription: {
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 14,
  },
  actionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },
  shareButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  copyLinkBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  milestoneCard: {
    borderWidth: 1,
    borderRadius: 20,
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
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minHeight: 105,
    borderRadius: 16,
    borderWidth: 1,
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
    maxHeight: "80%",
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
});
