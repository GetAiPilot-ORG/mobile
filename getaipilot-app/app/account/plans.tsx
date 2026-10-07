import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
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
  useWindowDimensions,
} from "react-native";
import { AppScreen } from "../../src/components/AppScreen";
import { AppTopBar } from "../../src/components/AppTopBar";
import { useAuth } from "../../src/contexts/AuthContext";
import { useRazorpay } from "../../src/contexts/RazorpayContext";
import {
  calculateGapProPricing,
  CATEGORY_META,
  GAP_PRO_INTERVALS,
  GapProInterval,
  isAddonPlan,
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
import { getColors, useTheme } from "../../src/theme";

const CATEGORIES: { key: PlanCategory; label: string; icon: string }[] = [
  { key: "all", label: "All Plans", icon: "apps" },
  { key: "all-in-one", label: "GAP Pro", icon: "diamond" },
  { key: "calling", label: "Voice AI", icon: "call" },
  { key: "whatsapp", label: "WhatsApp", icon: "logo-whatsapp" },
  { key: "telegram", label: "Telegram", icon: "paper-plane" },
  { key: "crm", label: "Smart CRM", icon: "people" },
  { key: "social", label: "Social Pilot", icon: "share-social" },
];

export default function OverallPricingScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { width: windowWidth } = useWindowDimensions();
  const queryClient = useQueryClient();
  const { openRazorpayCheckout } = useRazorpay();
  const params = useLocalSearchParams<{ category?: string }>();

  // Responsive card dimensions for horizontal carousel swiping
  const cardWidth = Math.min(Math.max(Math.round(windowWidth * 0.78), 275), 340);
  const snapInterval = cardWidth + 14;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/products");
    }
  };

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
  const [gapProInterval, setGapProInterval] = useState<GapProInterval>("month");

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

  // Section 1: GAP Pro plans at the top (All-In-One ecosystem tiers)
  const gapProPlans = useMemo(() => {
    return allPlans
      .filter((p) => isGapProPlan(p))
      .sort((a, b) => a.amount - b.amount);
  }, [allPlans]);

  // Section 2: Voice AI plans
  const voicePlans = useMemo(() => {
    return allPlans
      .filter((p) => !isGapProPlan(p) && (p.category === "calling" || p.category === "voice"))
      .sort((a, b) => a.amount - b.amount);
  }, [allPlans]);

  // Section 3: WhatsApp Automation plans
  const whatsappPlans = useMemo(() => {
    return allPlans
      .filter((p) => !isGapProPlan(p) && p.category === "whatsapp")
      .sort((a, b) => a.amount - b.amount);
  }, [allPlans]);

  // Section 4: Telegram Ecosystem plans
  const telegramPlans = useMemo(() => {
    return allPlans
      .filter((p) => !isGapProPlan(p) && p.category === "telegram")
      .sort((a, b) => a.amount - b.amount);
  }, [allPlans]);

  // Section 5: Smart CRM & Pipeline plans
  const crmPlans = useMemo(() => {
    return allPlans
      .filter((p) => !isGapProPlan(p) && p.category === "crm")
      .sort((a, b) => a.amount - b.amount);
  }, [allPlans]);

  // Section 6: Social Pilot plans
  const socialPlans = useMemo(() => {
    return allPlans
      .filter((p) => !isGapProPlan(p) && p.category === "social")
      .sort((a, b) => a.amount - b.amount);
  }, [allPlans]);

  const handleSelectPlan = (plan: PricingPlan) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const isAddon = isAddonPlan(plan);
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

    // GAP Pro interval calculation with duration discounts
    if (isPro) {
      const proPricing = calculateGapProPricing(
        plan.amount,
        gapProInterval,
        hasReferralDiscount ? discountPercent : 0
      );
      const amountInRupees = proPricing.totalChargedRupees;
      const planDisplayName = `${plan.plan_label || plan.plan_name} (${proPricing.option.label})`;

      openRazorpayCheckout({
        amount: amountInRupees,
        currency: plan.currency || "INR",
        product: "ecosystem",
        planId: plan.id,
        planName: `GetAiPilot - ${planDisplayName}`,
        billingInterval: gapProInterval,
        description: `${planDisplayName} Subscription · ${proPricing.option.days} Days Quotas`,
        onSuccess: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          // Complete referral reward & link if buyer was referred and purchased GAP Pro
          if (user?.id) {
            try {
              await checkAndCompleteReferralReward(user.id, plan.id, amountInRupees);
            } catch (refErr) {
              console.warn("[Pricing] Referral reward completion notice:", refErr);
            }
          }

          Alert.alert(
            "Subscription Activated! 🎉",
            `Your ${proPricing.option.label} subscription to ${planDisplayName} has been confirmed. Quotas are active in your workspace for ${proPricing.option.days} days.`,
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
      return;
    }

    // Standard modular plan checkout
    const baseAmountInRupees = Math.round(plan.amount / 100);
    const amountInRupees = baseAmountInRupees;
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
    const isPopular = Boolean(plan.is_popular);
    const isAddon = isAddonPlan(plan);
    const isPro = isGapProPlan(plan);

    // GAP Pro interval pricing calculation with dynamic discounts
    const proPricing = isProCard
      ? calculateGapProPricing(
          plan.amount,
          gapProInterval,
          hasReferralDiscount ? discountPercent : 0
        )
      : null;

    const baseAmountInRupees = Math.round(plan.amount / 100);
    const isEligibleForDiscount = hasReferralDiscount && isPro;
    const discountedPriceRupees = isEligibleForDiscount
      ? Math.max(1, Math.round(baseAmountInRupees * (1 - discountPercent / 100)))
      : baseAmountInRupees;

    const formattedPrice = isProCard && proPricing
      ? PricingService.formatPrice(proPricing.baseMonthlyRupees * 100, plan.currency)
      : PricingService.formatPrice(plan.amount, plan.currency);

    const formattedDiscountedPrice = isProCard && proPricing
      ? PricingService.formatPrice(proPricing.finalMonthlyRupees * 100, plan.currency)
      : PricingService.formatPrice(discountedPriceRupees * 100, plan.currency);

    const formattedDuration = isProCard
      ? "/month"
      : PricingService.formatDuration(plan.duration || "monthly");

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

          {isProCard && proPricing && proPricing.option.discountPercent > 0 && (
            <View
              style={[
                styles.durationSavingsBadge,
                {
                  backgroundColor: isDark ? "rgba(139, 92, 246, 0.25)" : "#EDE9FE",
                  borderColor: isDark ? "#8B5CF6" : "#C4B5FD",
                },
              ]}
            >
              <Ionicons name="flash" size={10} color="#8B5CF6" />
              <Text style={[styles.durationSavingsBadgeText, { color: isDark ? "#DDD6FE" : "#6D28D9" }]}>
                {proPricing.option.badge}
              </Text>
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
          <Text style={[styles.planTitle, { color: colors.text }]}>
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
              style={[styles.planDescription, { color: colors.textMuted }]}
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
            {(isProCard ? proPricing?.hasDiscount : isEligibleForDiscount) ? (
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
                <Text style={[styles.priceAmount, { color: "#10B981" }]}>
                  {formattedDiscountedPrice}
                </Text>
                <Text
                  style={[
                    styles.originalPrice,
                    { color: colors.textMuted },
                  ]}
                >
                  {formattedPrice}
                </Text>
              </View>
            ) : (
              <Text style={[styles.priceAmount, { color: colors.text }]}>
                {formattedPrice}
              </Text>
            )}
            <Text
              style={[styles.priceDuration, { color: colors.textMuted }]}
            >
              {isAddon ? "/ 30-day" : formattedDuration}
            </Text>
            {(isProCard ? proPricing?.hasDiscount : isEligibleForDiscount) && (
              <View style={styles.discountPill}>
                <Text style={styles.discountPillText}>
                  -{isProCard && proPricing
                    ? proPricing.intervalDiscountPercent + (hasReferralDiscount ? discountPercent : 0)
                    : discountPercent}%
                </Text>
              </View>
            )}
          </View>
          {isProCard && proPricing ? (
            <Text
              style={[styles.billingNote, { color: "#8B5CF6" }]}
              numberOfLines={1}
            >
              {gapProInterval === "month"
                ? "Billed monthly · 30-day renewal cycle"
                : `Billed ₹${proPricing.totalChargedRupees.toLocaleString('en-IN')} for ${proPricing.option.months} mos · Save ₹${proPricing.totalSavedRupees.toLocaleString('en-IN')}`}
            </Text>
          ) : plan.billing_note ? (
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
                    { backgroundColor: colors.surfaceSecondary },
                  ]}
                >
                  <Ionicons name="mic" size={11} color="#8b5cf6" />
                  <Text
                    style={[
                      styles.quotaTagText,
                      { color: colors.textSecondary },
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
                    { backgroundColor: colors.surfaceSecondary },
                  ]}
                >
                  <Ionicons name="pricetag" size={11} color="#8b5cf6" />
                  <Text
                    style={[
                      styles.quotaTagText,
                      { color: colors.textSecondary },
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
                    { backgroundColor: colors.surfaceSecondary },
                  ]}
                >
                  <Ionicons name="share-social" size={11} color="#ec4899" />
                  <Text
                    style={[
                      styles.quotaTagText,
                      { color: colors.textSecondary },
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
                    { color: colors.text },
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
            {isProCard && proPricing
              ? `Get ${plan.plan_label || "GAP Pro"} · ₹${proPricing.totalChargedRupees.toLocaleString("en-IN")}`
              : isProCard
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

  /**
   * Render a dedicated product category section with verified plans, header badge & carousel
   */
  const renderProductCategorySection = (
    categoryKey: PlanCategory,
    plansList: PricingPlan[]
  ) => {
    const meta = CATEGORY_META[categoryKey] || CATEGORY_META.all;
    if (plansList.length === 0) return null;

    return (
      <View
        key={categoryKey}
        style={[
          styles.sectionContainer,
          {
            backgroundColor: colors.surface,
            borderColor: isDark ? `${meta.color}40` : `${meta.color}30`,
          },
        ]}
      >
        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <View
              style={[
                styles.sectionIconBadge,
                { backgroundColor: `${meta.color}18` },
              ]}
            >
              <Ionicons name={meta.icon as any} size={17} color={meta.color} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {meta.label} Plans
                </Text>
                <View
                  style={{
                    backgroundColor: `${meta.color}20`,
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                    borderRadius: 6,
                  }}
                >
                  <Text
                    style={{
                      color: meta.color,
                      fontSize: 10,
                      fontWeight: "800",
                      letterSpacing: 0.5,
                    }}
                  >
                    {meta.badge}
                  </Text>
                </View>
              </View>
              <Text
                style={[styles.sectionSubtitle, { color: colors.textMuted }]}
                numberOfLines={1}
              >
                {meta.desc}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.scrollHintBadge,
              { backgroundColor: `${meta.color}15` },
            ]}
          >
            <Ionicons name="swap-horizontal" size={13} color={meta.color} />
            <Text style={[styles.scrollHintText, { color: meta.color }]}>
              {plansList.length} Tiers ⇄
            </Text>
          </View>
        </View>

        {/* Horizontal Scroll Area */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={snapInterval}
          snapToAlignment="start"
          contentContainerStyle={styles.horizontalScrollContent}
        >
          {plansList.map((plan) => renderPlanCard(plan, false))}
        </ScrollView>
      </View>
    );
  };

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar
        title="Overall Pricing & Plans"
        subtitle="GetAiPilot Ecosystem Subscriptions"
        showBack={true}
        onBackPress={handleBack}
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
            <Text style={[styles.planStatusDate, { color: colors.textMuted }]}>
              {expiresAt
                ? `Renews ${new Date(expiresAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}`
                : "Active Tier"}
            </Text>
          </View>

          <Text style={[styles.statusPlanName, { color: colors.text }]}>
            {planLabel || "GAP Pro Max"}
          </Text>
          <Text style={[styles.statusPlanDesc, { color: colors.textSecondary }]}>
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


        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0A84FF" />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
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
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
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

              {/* Duration Filter: Monthly, Quarterly, Half-Yearly, Yearly */}
              <View style={styles.proIntervalWrapper}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.proIntervalScroll}
                >
                  {GAP_PRO_INTERVALS.map((inv) => {
                    const isSelected = gapProInterval === inv.key;
                    return (
                      <Pressable
                        key={inv.key}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setGapProInterval(inv.key);
                        }}
                        style={[
                          styles.proIntervalChip,
                          {
                            backgroundColor: isSelected
                              ? "#8B5CF6"
                              : isDark
                                ? "#161331"
                                : "#EDE9FE",
                            borderColor: isSelected
                              ? "#7C3AED"
                              : isDark
                                ? "rgba(139, 92, 246, 0.4)"
                                : "#DDD6FE",
                          },
                        ]}
                      >
                        <Ionicons
                          name={
                            inv.key === "year"
                              ? "trophy"
                              : inv.key === "six_months"
                                ? "shield-checkmark"
                                : inv.key === "quarterly"
                                  ? "flash"
                                  : "calendar"
                          }
                          size={13}
                          color={isSelected ? "#ffffff" : isDark ? "#C4B5FD" : "#7C3AED"}
                        />
                        <Text
                          style={[
                            styles.proIntervalChipText,
                            {
                              color: isSelected
                                ? "#ffffff"
                                : isDark
                                  ? "#DDD6FE"
                                  : "#6D28D9",
                              fontWeight: isSelected ? "800" : "600",
                            },
                          ]}
                        >
                          {inv.label}
                        </Text>
                        {Boolean(inv.badge) && (
                          <View
                            style={[
                              styles.proIntervalChipBadge,
                              {
                                backgroundColor: isSelected
                                  ? "rgba(255, 255, 255, 0.25)"
                                  : isDark
                                    ? "rgba(16, 185, 129, 0.2)"
                                    : "#DCFCE7",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.proIntervalChipBadgeText,
                                { color: isSelected ? "#ffffff" : "#059669" },
                              ]}
                            >
                              {inv.badge}
                            </Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>
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
                      { color: colors.text },
                    ]}
                  >
                    No GAP Pro plans available
                  </Text>
                  <Text
                    style={[
                      styles.innerEmptyDesc,
                      { color: colors.textMuted },
                    ]}
                  >
                    Please verify your network connection or pull to refresh.
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
              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
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
                            : colors.surface,
                          borderColor: isSelected
                            ? meta.color
                            : colors.border,
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
                            color: isSelected ? "#ffffff" : colors.text,
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
            {/* Product Category Sections */}
            {(selectedCategory === "all" || selectedCategory === "calling") &&
              renderProductCategorySection("calling", voicePlans)}

            {(selectedCategory === "all" || selectedCategory === "whatsapp") &&
              renderProductCategorySection("whatsapp", whatsappPlans)}

            {(selectedCategory === "all" || selectedCategory === "telegram") &&
              renderProductCategorySection("telegram", telegramPlans)}

            {(selectedCategory === "all" || selectedCategory === "crm") &&
              renderProductCategorySection("crm", crmPlans)}

            {(selectedCategory === "all" || selectedCategory === "social") &&
              renderProductCategorySection("social", socialPlans)}

            {selectedCategory === "all-in-one" && (
              <View
                style={[
                  styles.emptyHorizontalBox,
                  { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
                ]}
              >
                <Ionicons name="diamond-outline" size={28} color="#8B5CF6" />
                <Text style={[styles.innerEmptyTitle, { color: colors.text }]}>
                  GAP Pro All-in-One Featured
                </Text>
                <Text style={[styles.innerEmptyDesc, { color: colors.textMuted }]}>
                  All GAP Pro unified ecosystem tiers are featured in the top carousel. Select "All Plans" or specific engine tabs above to browse modular plans.
                </Text>
              </View>
            )}
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
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
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
  proIntervalWrapper: {
    marginTop: 2,
    marginBottom: 4,
  },
  proIntervalScroll: {
    gap: 8,
    paddingVertical: 2,
    paddingRight: 8,
  },
  proIntervalChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  proIntervalChipText: {
    fontSize: 12.5,
  },
  proIntervalChipBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  proIntervalChipBadgeText: {
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  durationSavingsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  durationSavingsBadgeText: {
    fontSize: 10,
    fontWeight: "800",
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
