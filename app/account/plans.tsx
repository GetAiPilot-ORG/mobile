import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { AppScreen } from "../../src/components/AppScreen";
import { AppTopBar } from "../../src/components/AppTopBar";
import { useAuth } from "../../src/contexts/AuthContext";
import { useRazorpay } from "../../src/contexts/RazorpayContext";
import {
  CATEGORY_META,
  PlanCategory,
  PricingPlan,
  PricingService,
} from "../../src/core/pricing/pricingService";
import { openVoiceWebBilling } from "../../src/features/voice/utils/voiceBilling";
import { usePlatformSubscription } from "../../src/hooks/usePlatformSubscription";
import {
  ReferralDiscountInfo,
  checkAndCompleteReferralReward,
  getActiveReferralDiscount,
  isGapProPlan,
} from "../../src/services/referralService";

const CATEGORIES: { key: PlanCategory; label: string; icon: string }[] = [
  // { key: "all", label: "All Plans", icon: "apps" },
  // { key: "all-in-one", label: "GAP Pro", icon: "diamond" },
  { key: "calling", label: "Voice AI", icon: "call" },
  { key: "social", label: "Social Pilot", icon: "share-social" },
  { key: "whatsapp", label: "WhatsApp", icon: "logo-whatsapp" },
  { key: "telegram", label: "Telegram", icon: "paper-plane" },
  { key: "crm", label: "Smart CRM", icon: "people" },
];

export default function OverallPricingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { width: windowWidth } = useWindowDimensions();
  const queryClient = useQueryClient();
  const { openRazorpayCheckout } = useRazorpay();
  const params = useLocalSearchParams<{ category?: string }>();

  // Card dimensions for horizontal carousel swiping
  const cardWidth = Math.min(Math.max(Math.round(windowWidth * 0.78), 285), 335);
  const snapInterval = cardWidth + 14;

  const {
    planLabel,
    subscriptionStatus,
    expiresAt,
    refresh: refreshSub,
  } = usePlatformSubscription();

  const { user } = useAuth();

  const { data: referralDiscount, refetch: refetchDiscount } = useQuery<ReferralDiscountInfo>({
    queryKey: ["active-referral-discount", user?.id],
    queryFn: () => getActiveReferralDiscount(user?.id),
    staleTime: 60 * 1000,
  });

  const hasReferralDiscount = Boolean(
    referralDiscount?.hasDiscount && (referralDiscount.discountPercent || 0) > 0
  );
  const discountPercent = referralDiscount?.discountPercent || 0;

  const [selectedCategory, setSelectedCategory] = useState<PlanCategory>(
    (params.category as PlanCategory) || "all"
  );
  const [selectedDuration, setSelectedDuration] = useState<"all" | "monthly" | "yearly">("all");

  useEffect(() => {
    if (params.category && params.category !== selectedCategory) {
      setSelectedCategory(params.category as PlanCategory);
    }
  }, [params.category]);

  // Query all active plans from DB / BFF
  const {
    data: allPlans = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<PricingPlan[]>({
    queryKey: ["ecosystem-pricing-plans-all"],
    queryFn: () => PricingService.getPlans("all"),
    staleTime: 60 * 1000,
  });

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([refetch(), refreshSub(), refetchDiscount()]);
  };

  // Duration filter helper
  const matchesDuration = (p: PricingPlan) => {
    if (selectedDuration === "all") return true;
    const d = (p.duration || "monthly").toLowerCase();
    if (selectedDuration === "monthly") return d.includes("month");
    if (selectedDuration === "yearly") return d.includes("year") || d.includes("annual");
    return true;
  };

  // Section 1: GAP Pro plans at the top (All-In-One ecosystem tiers)
  const gapProPlans = useMemo(() => {
    return allPlans
      .filter((p) => isGapProPlan(p) && matchesDuration(p))
      .sort((a, b) => a.amount - b.amount);
  }, [allPlans, selectedDuration]);

  // Section 2: Other Plans & Add-ons below it (Modular individual tools)
  const otherPlans = useMemo(() => {
    return allPlans
      .filter((p) => {
        if (isGapProPlan(p)) return false;
        if (!matchesDuration(p)) return false;
        if (selectedCategory === "all") return true;
        if (selectedCategory === "all-in-one") return false;
        const cat = (p.category || "").toLowerCase();
        return cat === selectedCategory;
      })
      .sort((a, b) => a.amount - b.amount);
  }, [allPlans, selectedCategory, selectedDuration]);

  const handleSelectPlan = (plan: PricingPlan) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const isAddon = plan.id === "calling_number" || Boolean(plan.is_addon) || plan.id.includes("number");
    const isVoicePlan =
      plan.category === "calling" ||
      plan.category === "voice" ||
      plan.id.startsWith("calling") ||
      plan.id.startsWith("call_") ||
      isAddon;

    if (isVoicePlan) {
      openVoiceWebBilling(queryClient, isDark);
      return;
    }

    const isPro = isGapProPlan(plan);
    const baseAmountInRupees = Math.round(plan.amount / 100);
    // Referral discount strictly applies ONLY to GAP Pro plans (same as bot-dashboard)
    const amountInRupees =
      isPro && hasReferralDiscount
        ? Math.max(1, Math.round(baseAmountInRupees * (1 - discountPercent / 100)))
        : baseAmountInRupees;
    const planDisplayName = plan.plan_label || plan.plan_name;

    const dur = (plan.duration || '').toLowerCase();
    const billingInterval: 'month' | 'quarterly' | 'six_months' | 'year' =
      dur.includes('year') ? 'year' :
        dur.includes('quarter') ? 'quarterly' :
          dur.includes('6') ? 'six_months' : 'month';

    openRazorpayCheckout({
      amount: amountInRupees,
      currency: plan.currency || "INR",
      product: isVoicePlan ? "calling" : plan.category || "ecosystem",
      planId: plan.id,
      planName: `GetAiPilot - ${planDisplayName}`,
      billingInterval,
      description: plan.description || `${planDisplayName} Subscription`,
      onSuccess: async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Complete referral reward & link if buyer was referred and purchased GAP Pro
        if (user?.id && isPro) {
          try {
            await checkAndCompleteReferralReward(user.id, plan.id, amountInRupees);
          } catch (refErr) {
            console.warn("[Pricing] Referral reward completion notice:", refErr);
          }
        }

        Alert.alert(
          "Subscription Activated! 🎉",
          `Your subscription to ${planDisplayName} has been confirmed. Quotas are active in your workspace.`,
          [{ text: "Great!" }]
        );
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["platform-subscription"] }),
          queryClient.invalidateQueries({ queryKey: ["ecosystem-pricing-plans-all"] }),
          queryClient.invalidateQueries({ queryKey: ["active-referral-discount"] }),
          queryClient.invalidateQueries({ queryKey: ["social", "entitlements"] }),
          queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
          queryClient.invalidateQueries({ queryKey: ["voice"] }),
          queryClient.invalidateQueries({ queryKey: ["voice", "overview"] }),
          queryClient.invalidateQueries({ queryKey: ["voice", "numbers"] }),
        ]);
      },
    });
  };

  /**
   * Render individual plan card with horizontal carousel dimensions
   */
  const renderPlanCard = (plan: PricingPlan, isProCard: boolean) => {
    const catKey = (plan.category || "all").toLowerCase();
    const meta = CATEGORY_META[catKey] || CATEGORY_META.all;
    const formattedPrice = PricingService.formatPrice(plan.amount, plan.currency);
    const formattedDuration = PricingService.formatDuration(plan.duration || "monthly");
    const isPopular = Boolean(plan.is_popular);
    const isAddon = plan.id === "calling_number" || Boolean(plan.is_addon) || plan.id.includes("number");
    const isPro = isGapProPlan(plan);
    const baseAmountInRupees = Math.round(plan.amount / 100);

    // Referral discount strictly applies ONLY to GAP Pro plans
    const isEligibleForDiscount = hasReferralDiscount && isPro;
    const discountedPriceRupees = isEligibleForDiscount
      ? Math.max(1, Math.round(baseAmountInRupees * (1 - discountPercent / 100)))
      : baseAmountInRupees;
    const formattedDiscountedPrice = PricingService.formatPrice(
      discountedPriceRupees * 100,
      plan.currency
    );

    return (
      <View
        key={plan.id}
        style={[
          styles.planCard,
          { width: cardWidth },
          isProCard ? styles.proPlanCard : (isAddon ? styles.addonCard : null),
          {
            backgroundColor: isDark
              ? isProCard
                ? "#0d0b26"
                : isAddon
                  ? "#111026"
                  : "#0f172a"
              : isProCard
                ? "#FAF7FF"
                : isAddon
                  ? "#FAFAFF"
                  : "#ffffff",
            borderColor: isProCard
              ? isDark
                ? "#8B5CF6"
                : "#A78BFA"
              : isAddon
                ? isDark
                  ? "#6366F1"
                  : "#4F46E5"
                : isPopular
                  ? meta.color
                  : isDark
                    ? "#1e293b"
                    : "#e2e8f0",
            borderWidth: isProCard ? 1.8 : isAddon ? 1.5 : isPopular ? 2 : 1,
          },
        ]}
      >
        {/* Top Badges */}
        <View style={styles.cardTopRow}>
          {isProCard ? (
            <View
              style={[
                styles.proCardBadge,
                { backgroundColor: isDark ? "rgba(139, 92, 246, 0.25)" : "#EDE9FE" },
              ]}
            >
              <Ionicons name="diamond" size={11} color="#8B5CF6" />
              <Text style={styles.proCardBadgeText}>GAP PRO VIP</Text>
            </View>
          ) : isAddon ? (
            <View
              style={[
                styles.addonBadge,
                {
                  backgroundColor: isDark ? "rgba(99, 102, 241, 0.2)" : "#EEF2FF",
                  borderColor: isDark ? "#6366F1" : "#C7D2FE",
                },
              ]}
            >
              <Ionicons name="cube" size={11} color="#6366F1" />
              <Text style={[styles.addonBadgeText, { color: "#6366F1" }]}>ADD-ON</Text>
            </View>
          ) : (
            <View style={[styles.categoryBadge, { backgroundColor: `${meta.color}20` }]}>
              <Ionicons name={meta.icon as any} size={11} color={meta.color} />
              <Text style={[styles.categoryBadgeText, { color: meta.color }]}>
                {meta.label.toUpperCase()}
              </Text>
            </View>
          )}

          {isPopular && (
            <View
              style={[
                styles.popularBadge,
                { backgroundColor: isProCard ? "#F59E0B" : meta.color },
              ]}
            >
              <Ionicons name="sparkles" size={10} color="#ffffff" />
              <Text style={styles.popularBadgeText}>POPULAR</Text>
            </View>
          )}

          {isEligibleForDiscount && (
            <View
              style={[
                styles.referralCardBadge,
                { backgroundColor: isDark ? "rgba(16, 185, 129, 0.2)" : "#DCFCE7" },
              ]}
            >
              <Ionicons name="gift" size={10} color="#10B981" />
              <Text style={styles.referralCardBadgeText}>{discountPercent}% OFF</Text>
            </View>
          )}

          {isAddon && (
            <View
              style={[
                styles.addonValidityBadge,
                { backgroundColor: isDark ? "rgba(16, 185, 129, 0.15)" : "#DCFCE7" },
              ]}
            >
              <Ionicons name="time" size={10} color="#10B981" />
              <Text style={styles.addonValidityBadgeText}>30-DAY</Text>
            </View>
          )}
        </View>

        {/* Plan Name & Tagline */}
        <View style={styles.planHeader}>
          <Text style={[styles.planTitle, { color: isDark ? "#f8fafc" : "#0f172a" }]}>
            {plan.plan_label || plan.plan_name}
          </Text>
          {isProCard ? (
            <View
              style={[
                styles.proEnginesPill,
                { backgroundColor: isDark ? "rgba(139, 92, 246, 0.15)" : "#F3E8FF" },
              ]}
            >
              <Ionicons name="flash" size={11} color="#A855F7" />
              <Text style={[styles.proEnginesPillText, { color: isDark ? "#D8B4FE" : "#7E22CE" }]}>
                WhatsApp + Telegram + Voice + Social + CRM
              </Text>
            </View>
          ) : plan.description ? (
            <Text
              style={[styles.planDescription, { color: isDark ? "#94a3b8" : "#64748b" }]}
              numberOfLines={2}
            >
              {plan.description}
            </Text>
          ) : null}
        </View>

        {/* Pricing Box */}
        <View
          style={[
            styles.priceBox,
            isProCard ? styles.proPriceBox : isAddon ? styles.addonPriceBox : null,
            {
              backgroundColor: isDark
                ? isProCard
                  ? "rgba(139, 92, 246, 0.14)"
                  : isAddon
                    ? "rgba(99, 102, 241, 0.1)"
                    : "#1e293b"
                : isProCard
                  ? "#F5F3FF"
                  : isAddon
                    ? "#EEF2FF"
                    : "#f8fafc",
            },
          ]}
        >
          <View style={styles.priceRow}>
            {isEligibleForDiscount ? (
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
                <Text style={[styles.priceAmount, { color: "#10B981" }]}>
                  {formattedDiscountedPrice}
                </Text>
                <Text
                  style={[
                    styles.originalPrice,
                    { color: isDark ? "#64748B" : "#94A3B8" },
                  ]}
                >
                  {formattedPrice}
                </Text>
              </View>
            ) : (
              <Text style={[styles.priceAmount, { color: isDark ? "#ffffff" : "#0f172a" }]}>
                {formattedPrice}
              </Text>
            )}
            <Text
              style={[styles.priceDuration, { color: isDark ? "#94a3b8" : "#64748b" }]}
            >
              {isAddon ? "/ 30-day" : formattedDuration}
            </Text>
            {isEligibleForDiscount && (
              <View style={styles.discountPill}>
                <Text style={styles.discountPillText}>-{discountPercent}%</Text>
              </View>
            )}
          </View>
          {plan.billing_note ? (
            <Text
              style={[
                styles.billingNote,
                { color: isProCard ? "#8B5CF6" : isAddon ? "#6366F1" : meta.color },
              ]}
              numberOfLines={1}
            >
              {plan.billing_note}
            </Text>
          ) : null}
        </View>

        {/* Quotas Spotlight Row (if quotas exist) */}
        {(Boolean(plan.included_call_minutes) ||
          Boolean(plan.included_numbers) ||
          Boolean(plan.included_channels)) && (
            <View style={styles.quotasRow}>
              {Boolean(plan.included_call_minutes) && (
                <View
                  style={[
                    styles.quotaTag,
                    { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" },
                  ]}
                >
                  <Ionicons name="mic" size={11} color="#8b5cf6" />
                  <Text
                    style={[
                      styles.quotaTagText,
                      { color: isDark ? "#cbd5e1" : "#475569" },
                    ]}
                  >
                    {plan.included_call_minutes} AI Mins
                  </Text>
                </View>
              )}
              {Boolean(plan.extra_call_rate_paise) && (
                <View
                  style={[
                    styles.quotaTag,
                    { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" },
                  ]}
                >
                  <Ionicons name="pricetag" size={11} color="#8b5cf6" />
                  <Text
                    style={[
                      styles.quotaTagText,
                      { color: isDark ? "#cbd5e1" : "#475569" },
                    ]}
                  >
                    ₹{plan.extra_call_rate_paise! / 100}/min
                  </Text>
                </View>
              )}
              {Boolean(plan.included_numbers) && (
                <View
                  style={[
                    styles.quotaTag,
                    {
                      backgroundColor: isAddon
                        ? isDark
                          ? "rgba(99, 102, 241, 0.15)"
                          : "#EEF2FF"
                        : isDark
                          ? "#1e293b"
                          : "#f1f5f9",
                    },
                  ]}
                >
                  <Ionicons
                    name="call"
                    size={11}
                    color={isAddon ? "#6366F1" : "#25d366"}
                  />
                  <Text
                    style={[
                      styles.quotaTagText,
                      {
                        color: isAddon
                          ? isDark
                            ? "#A5B4FC"
                            : "#4F46E5"
                          : isDark
                            ? "#cbd5e1"
                            : "#475569",
                      },
                    ]}
                  >
                    {isAddon ? "+1 Virtual Line" : `${plan.included_numbers} Line`}
                  </Text>
                </View>
              )}
              {Boolean(plan.included_channels) && !isAddon && (
                <View
                  style={[
                    styles.quotaTag,
                    { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" },
                  ]}
                >
                  <Ionicons name="share-social" size={11} color="#ec4899" />
                  <Text
                    style={[
                      styles.quotaTagText,
                      { color: isDark ? "#cbd5e1" : "#475569" },
                    ]}
                  >
                    {plan.included_channels} Channels
                  </Text>
                </View>
              )}
            </View>
          )}

        {/* Feature Checklist */}
        {Array.isArray(plan.features) && plan.features.length > 0 && (
          <View style={styles.featuresList}>
            {plan.features.slice(0, 5).map((feat, idx) => (
              <View key={idx} style={styles.featureItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={isProCard ? "#8B5CF6" : isAddon ? "#6366F1" : "#10B981"}
                />
                <Text
                  style={[
                    styles.featureText,
                    { color: isDark ? "#e2e8f0" : "#334155" },
                  ]}
                  numberOfLines={2}
                >
                  {feat}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Button: Subscribe with Razorpay */}
        <Pressable
          onPress={() => handleSelectPlan(plan)}
          style={[
            styles.subscribeBtn,
            isProCard ? styles.proSubscribeBtn : isAddon ? styles.addonBtn : null,
            {
              backgroundColor: isProCard ? "#7C3AED" : isAddon ? "#4F46E5" : meta.color,
              shadowColor: isProCard ? "#7C3AED" : isAddon ? "#4F46E5" : meta.color,
            },
          ]}
        >
          <Ionicons
            name={isProCard ? "diamond" : isAddon ? "call" : "shield-checkmark"}
            size={15}
            color="#ffffff"
          />
          <Text style={styles.subscribeBtnText}>
            {isProCard
              ? `Get GAP Pro · ${isEligibleForDiscount ? formattedDiscountedPrice : formattedPrice}`
              : isAddon
                ? `Add Line · ${formattedPrice}`
                : `Subscribe · ${formattedPrice}`}
          </Text>
          <Ionicons name="arrow-forward" size={14} color="#ffffff" />
        </Pressable>
      </View>
    );
  };

  return (
    <AppScreen safeArea={false} backgroundColor={isDark ? "#000000" : "#F8FAFC"}>
      <AppTopBar
        title="Overall Pricing & Plans"
        subtitle="GetAiPilot Ecosystem Subscriptions"
        showBack={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor="#0A84FF"
          />
        }
      >
        {/* 1. Active Workspace Subscription Status Card */}
        <View
          style={[
            styles.statusBanner,
            {
              backgroundColor: isDark ? "#06131d" : "#eff6ff",
              borderColor: isDark ? "#1e3a8a44" : "#bfdbfe",
            },
          ]}
        >
          <View style={styles.statusHeader}>
            <View
              style={[
                styles.activePill,
                { backgroundColor: isDark ? "rgba(16, 185, 129, 0.2)" : "#dcfce7" },
              ]}
            >
              <View style={styles.activeDot} />
              <Text style={styles.activePillText}>
                {subscriptionStatus ? subscriptionStatus.toUpperCase() : "ACTIVE WORKSPACE"}
              </Text>
            </View>
            <Text style={[styles.planStatusDate, { color: isDark ? "#94a3b8" : "#64748b" }]}>
              {expiresAt
                ? `Renews ${new Date(expiresAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}`
                : "Active Tier"}
            </Text>
          </View>

          <Text style={[styles.statusPlanName, { color: isDark ? "#FFFFFF" : "#0f172a" }]}>
            {planLabel || "GAP Pro Max"}
          </Text>
          <Text style={[styles.statusPlanDesc, { color: isDark ? "#cbd5e1" : "#475569" }]}>
            Full multi-engine access enabled: Voice AI, Social Pilot, WhatsApp, Telegram & Smart CRM.
          </Text>
        </View>

        {/* Referral Discount Active Banner */}
        {hasReferralDiscount && (
          <View
            style={[
              styles.referralBanner,
              {
                backgroundColor: isDark ? "rgba(16, 185, 129, 0.12)" : "#ECFDF5",
                borderColor: isDark ? "rgba(16, 185, 129, 0.3)" : "#A7F3D0",
              },
            ]}
          >
            <View style={styles.referralBannerIcon}>
              <Ionicons name="gift" size={20} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  flexWrap: "wrap",
                }}
              >
                <Text
                  style={[
                    styles.referralBannerTitle,
                    { color: isDark ? "#34D399" : "#065F46" },
                  ]}
                >
                  {referralDiscount?.isWelcomeDiscount
                    ? "Welcome Referral Perk Active!"
                    : `${referralDiscount?.milestoneTitle || "Referral Perk"} Active!`}
                </Text>
                <View style={styles.referralBadge}>
                  <Text style={styles.referralBadgeText}>{discountPercent}% OFF GAP PRO</Text>
                </View>
              </View>
              <Text
                style={[
                  styles.referralBannerSubtitle,
                  { color: isDark ? "#A7F3D0" : "#047857" },
                ]}
              >
                {referralDiscount?.isWelcomeDiscount
                  ? `${discountPercent}% Welcome referral discount is automatically applied to all GAP Pro plans!`
                  : `${referralDiscount?.bonusPerk || `${discountPercent}% discount`} applied to your GAP Pro plan purchase!`}
              </Text>
            </View>
          </View>
        )}

        {/* 2. Duration Selector (Monthly vs Yearly) */}
        <View
          style={[
            styles.durationBar,
            {
              backgroundColor: isDark ? "#0f172a" : "#f1f5f9",
              borderColor: isDark ? "#1e293b" : "#e2e8f0",
            },
          ]}
        >
          <Pressable
            style={[
              styles.durationTab,
              selectedDuration === "all" &&
              (isDark ? styles.durationTabActiveDark : styles.durationTabActive),
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedDuration("all");
            }}
          >
            <Text
              style={[
                styles.durationTabText,
                { color: selectedDuration === "all" ? (isDark ? "#fff" : "#0f172a") : "#64748b" },
              ]}
            >
              All Durations
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.durationTab,
              selectedDuration === "monthly" &&
              (isDark ? styles.durationTabActiveDark : styles.durationTabActive),
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedDuration("monthly");
            }}
          >
            <Text
              style={[
                styles.durationTabText,
                { color: selectedDuration === "monthly" ? (isDark ? "#fff" : "#0f172a") : "#64748b" },
              ]}
            >
              Monthly
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.durationTab,
              selectedDuration === "yearly" &&
              (isDark ? styles.durationTabActiveDark : styles.durationTabActive),
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedDuration("yearly");
            }}
          >
            <Text
              style={[
                styles.durationTabText,
                { color: selectedDuration === "yearly" ? (isDark ? "#fff" : "#0f172a") : "#64748b" },
              ]}
            >
              Annual (Save 20%+)
            </Text>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0A84FF" />
            <Text style={[styles.loadingText, { color: isDark ? "#94a3b8" : "#64748b" }]}>
              Loading verified pricing plans...
            </Text>
          </View>
        ) : (
          <View style={{ gap: 26 }}>
            {/* ========================================================================= */}
            {/* SECTION 1: GAP PRO PLANS (At the top, horizontal swipeable carousel)      */}
            {/* ========================================================================= */}
            <View
              style={[
                styles.sectionContainer,
                styles.proSectionBox,
                {
                  backgroundColor: isDark ? "#09081c" : "#FBF9FF",
                  borderColor: isDark ? "#8B5CF6" : "#DDD6FE",
                },
              ]}
            >
              {/* Section Header */}
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderLeft}>
                  <View
                    style={[
                      styles.sectionIconBadge,
                      { backgroundColor: isDark ? "rgba(139, 92, 246, 0.25)" : "#EDE9FE" },
                    ]}
                  >
                    <Ionicons name="diamond" size={17} color="#8B5CF6" />
                  </View>
                  <View>
                    <Text style={[styles.sectionTitle, { color: isDark ? "#FFFFFF" : "#0f172a" }]}>
                      GAP Pro All-in-One Plans
                    </Text>
                    <Text
                      style={[
                        styles.sectionSubtitle,
                        { color: isDark ? "#C4B5FD" : "#6B21A8" },
                      ]}
                    >
                      5-in-1 Unified Suite • All Automation Engines Included
                    </Text>
                  </View>
                </View>

                <View style={styles.scrollHintBadge}>
                  <Ionicons name="swap-horizontal" size={13} color="#8B5CF6" />
                  <Text style={styles.scrollHintText}>
                    {gapProPlans.length} Tiers ⇄
                  </Text>
                </View>
              </View>

              {/* Horizontal Scroll Area for GAP Pro */}
              {gapProPlans.length === 0 ? (
                <View
                  style={[
                    styles.emptyHorizontalBox,
                    { backgroundColor: isDark ? "#060515" : "#F4F0FF" },
                  ]}
                >
                  <Ionicons name="diamond-outline" size={28} color="#8B5CF6" />
                  <Text
                    style={[
                      styles.innerEmptyTitle,
                      { color: isDark ? "#f8fafc" : "#0f172a" },
                    ]}
                  >
                    No GAP Pro plans matching this duration filter
                  </Text>
                  <Text
                    style={[
                      styles.innerEmptyDesc,
                      { color: isDark ? "#94a3b8" : "#64748b" },
                    ]}
                  >
                    Switch duration filter to "All Durations" to view monthly & annual bundles.
                  </Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  decelerationRate="fast"
                  snapToInterval={snapInterval}
                  snapToAlignment="start"
                  contentContainerStyle={styles.horizontalScrollContent}
                >
                  {gapProPlans.map((plan) => renderPlanCard(plan, true))}
                </ScrollView>
              )}
            </View>

            {/* ========================================================================= */}
            {/* SECTION 2: OTHER PLANS & ADD-ONS (Below it, horizontal swipeable carousel)*/}
            {/* ========================================================================= */}

            {/* 3. Category Selector Pills (Scrollable) */}
            <View style={styles.categorySection}>
              <Text style={[styles.sectionLabel, { color: isDark ? "#94a3b8" : "#64748b" }]}>
                FILTER BY PRODUCT CATEGORY
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
              >
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.key;
                  const meta = CATEGORY_META[cat.key];
                  return (
                    <Pressable
                      key={cat.key}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedCategory(cat.key);
                      }}
                      style={[
                        styles.categoryPill,
                        {
                          backgroundColor: isSelected
                            ? meta.color
                            : isDark
                              ? "#0f172a"
                              : "#ffffff",
                          borderColor: isSelected
                            ? meta.color
                            : isDark
                              ? "#1e293b"
                              : "#e2e8f0",
                        },
                      ]}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={14}
                        color={isSelected ? "#ffffff" : meta.color}
                      />
                      <Text
                        style={[
                          styles.categoryPillText,
                          {
                            color: isSelected ? "#ffffff" : isDark ? "#f1f5f9" : "#1e293b",
                            fontWeight: isSelected ? "800" : "600",
                          },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
            <View
              style={[
                styles.sectionContainer,
                {
                  backgroundColor: isDark ? "#0b1120" : "#ffffff",
                  borderColor: isDark ? "#1e293b" : "#e2e8f0",
                },
              ]}
            >
              {/* Section Header */}
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderLeft}>
                  <View
                    style={[
                      styles.sectionIconBadge,
                      { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" },
                    ]}
                  >
                    <Ionicons name="cube-outline" size={17} color="#0A84FF" />
                  </View>
                  <View>
                    <Text style={[styles.sectionTitle, { color: isDark ? "#FFFFFF" : "#0f172a" }]}>
                      Individual Engine Plans & Add-ons
                    </Text>
                    <Text
                      style={[
                        styles.sectionSubtitle,
                        { color: isDark ? "#94a3b8" : "#64748b" },
                      ]}
                    >
                      Modular single-channel tools & dedicated phone lines
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.scrollHintBadge,
                    { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" },
                  ]}
                >
                  <Ionicons name="swap-horizontal" size={13} color="#0A84FF" />
                  <Text style={[styles.scrollHintText, { color: "#0A84FF" }]}>
                    {otherPlans.length} Plans ⇄
                  </Text>
                </View>
              </View>

              {/* Horizontal Scroll Area for Other Plans */}
              {otherPlans.length === 0 ? (
                <View
                  style={[
                    styles.emptyHorizontalBox,
                    { backgroundColor: isDark ? "#080c17" : "#F8FAFC" },
                  ]}
                >
                  <Ionicons name="pricetags-outline" size={28} color="#0A84FF" />
                  <Text
                    style={[
                      styles.innerEmptyTitle,
                      { color: isDark ? "#f8fafc" : "#0f172a" },
                    ]}
                  >
                    {selectedCategory === "all-in-one"
                      ? "Viewing GAP Pro Suite"
                      : "No plans in this category"}
                  </Text>
                  <Text
                    style={[
                      styles.innerEmptyDesc,
                      { color: isDark ? "#94a3b8" : "#64748b" },
                    ]}
                  >
                    {selectedCategory === "all-in-one"
                      ? "GAP Pro All-In-One plans are featured in the top carousel. Tap Voice AI, WhatsApp, or Telegram to view modular standalone tools."
                      : "Try selecting another product category or duration filter above."}
                  </Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  decelerationRate="fast"
                  snapToInterval={snapInterval}
                  snapToAlignment="start"
                  contentContainerStyle={styles.horizontalScrollContent}
                >
                  {otherPlans.map((plan) => renderPlanCard(plan, false))}
                </ScrollView>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
    gap: 16,
  },
  statusBanner: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  activePillText: {
    color: "#10B981",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  planStatusDate: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusPlanName: {
    fontSize: 20,
    fontWeight: "800",
  },
  statusPlanDesc: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  categorySection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  categoryScroll: {
    gap: 8,
    paddingRight: 16,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 12,
  },
  durationBar: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  durationTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  durationTabActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  durationTabActiveDark: {
    backgroundColor: "#1e293b",
  },
  durationTabText: {
    fontSize: 12,
    fontWeight: "700",
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // Dual Section Container Styles
  sectionContainer: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 14,
    gap: 14,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  proSectionBox: {
    borderWidth: 2,
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  sectionIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  scrollHintBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },
  scrollHintText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#8B5CF6",
  },

  // Horizontal Scroll Container
  horizontalScrollContent: {
    paddingHorizontal: 2,
    paddingVertical: 4,
    gap: 14,
  },
  emptyHorizontalBox: {
    padding: 22,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  innerEmptyTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    textAlign: "center",
  },
  innerEmptyDesc: {
    fontSize: 11.5,
    textAlign: "center",
    lineHeight: 16,
  },

  // Plan Card Styles
  planCard: {
    padding: 16,
    borderRadius: 18,
    gap: 13,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  proPlanCard: {
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  proCardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4.5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  proCardBadgeText: {
    color: "#8B5CF6",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  popularBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  popularBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  referralCardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  referralCardBadgeText: {
    color: "#10B981",
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  planHeader: {
    gap: 5,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  proEnginesPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  proEnginesPillText: {
    fontSize: 10.5,
    fontWeight: "700",
  },
  planDescription: {
    fontSize: 11.5,
    lineHeight: 15,
  },
  priceBox: {
    padding: 11,
    borderRadius: 12,
    gap: 3,
  },
  proPriceBox: {
    borderLeftWidth: 3,
    borderLeftColor: "#8B5CF6",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    flexWrap: "wrap",
  },
  priceAmount: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -1,
  },
  priceDuration: {
    fontSize: 12,
    fontWeight: "600",
  },
  billingNote: {
    fontSize: 10,
    fontWeight: "700",
  },
  quotasRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  quotaTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 7,
  },
  quotaTagText: {
    fontSize: 10.5,
    fontWeight: "700",
  },
  featuresList: {
    gap: 6,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  featureText: {
    fontSize: 11.5,
    fontWeight: "500",
    flex: 1,
    lineHeight: 15,
  },
  subscribeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 12,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 3,
  },
  proSubscribeBtn: {
    shadowColor: "#7C3AED",
  },
  subscribeBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },
  addonBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  addonBadgeText: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  addonValidityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  addonValidityBadgeText: {
    color: "#10B981",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  addonCard: {
    shadowOpacity: 0.08,
  },
  addonPriceBox: {
    borderLeftWidth: 3,
    borderLeftColor: "#6366F1",
  },
  addonBtn: {
    backgroundColor: "#4F46E5",
    shadowColor: "#4F46E5",
  },
  referralBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  referralBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  referralBannerTitle: {
    fontSize: 13.5,
    fontWeight: "800",
  },
  referralBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  referralBadgeText: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "800",
  },
  referralBannerSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 15,
  },
  originalPrice: {
    fontSize: 14.5,
    textDecorationLine: "line-through",
    fontWeight: "600",
  },
  discountPill: {
    backgroundColor: "#10B981",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  discountPillText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },
});
