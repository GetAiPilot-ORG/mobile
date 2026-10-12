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
import { AnimatedHero } from "../../src/features/telegram/components/ui/AnimatedHero";

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

  const availableCategories = useMemo(() => {
    return CATEGORIES.filter((cat) => {
      if (cat.key === "all") return true;
      if (cat.key === "all-in-one") return gapProPlans.length > 0;
      if (cat.key === "calling") return voicePlans.length > 0;
      if (cat.key === "whatsapp") return whatsappPlans.length > 0;
      if (cat.key === "telegram") return telegramPlans.length > 0;
      if (cat.key === "crm") return crmPlans.length > 0;
      if (cat.key === "social") return socialPlans.length > 0;
      return true;
    });
  }, [gapProPlans.length, voicePlans.length, whatsappPlans.length, telegramPlans.length, crmPlans.length, socialPlans.length]);

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
                ? "#120E2C"
                : isAddon
                  ? "#101026"
                  : colors.card
              : isProCard
                ? "#FAF7FF"
                : isAddon
                  ? "#FAFAFF"
                  : colors.card,
            borderColor: isProCard
              ? isDark
                ? "rgba(139, 92, 246, 0.45)"
                : "rgba(167, 139, 250, 0.5)"
              : isPopular
                ? `${meta.color}50`
                : isDark
                  ? "rgba(255, 255, 255, 0.07)"
                  : "rgba(0, 0, 0, 0.05)",
            borderWidth: isProCard ? 1.5 : isPopular ? 1.5 : 1,
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

  const isWide = windowWidth >= 768;
  const numColumns = isWide ? 4 : 2;
  const kpiCardWidth = numColumns === 4 ? "23.5%" : "48.5%";

  const pricingKpis = [
    {
      title: "CURRENT STATUS",
      value: (subscriptionStatus || "ACTIVE").toUpperCase(),
      icon: "shield-checkmark-outline" as const,
      color: "#10B981",
      subtext: planLabel || "GAP Pro Workspace",
    },
    {
      title: "RENEWAL CYCLE",
      value: expiresAt
        ? new Date(expiresAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })
        : "Active Tier",
      icon: "calendar-outline" as const,
      color: "#8B5CF6",
      subtext: expiresAt ? "Auto-renewing cycle" : "Permanent access",
    },
    {
      title: "CATALOG TIERS",
      value: `${allPlans.length} Plans`,
      icon: "diamond-outline" as const,
      color: "#0284C7",
      subtext: `${availableCategories.length - 1} Product Engines`,
    },
    {
      title: "SPECIAL OFFERS",
      value: hasReferralDiscount ? `${discountPercent}% OFF` : "Best Value",
      icon: "gift-outline" as const,
      color: hasReferralDiscount ? "#EC4899" : "#F59E0B",
      subtext: hasReferralDiscount ? "Referral perk applied" : "Save up to 40% yearly",
    },
  ];

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar
        title="Overall Pricing & Plans"
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
        {/* 1. Cyber Animated Hero Banner */}
        <AnimatedHero
          variant="pricing"
          tagText="GETAIPILOT ECOSYSTEM TIERS"
          tagIcon="diamond"
          title="GAP Pricing & Plans"
          subtitle="Enterprise-grade AI engines, modular tiers & all-in-one VIP access"
        />

        {/* 2. Responsive KPI Command Cards */}
        <View className="flex-row flex-wrap gap-2.5 w-full">
          {pricingKpis.map((kpi, idx) => (
            <View
              key={idx}
              className="p-3.5 rounded-2xl flex-col justify-between"
              style={{
                backgroundColor: colors.card,
                width: kpiCardWidth,
                minHeight: 88,
              }}
            >
              <View className="flex-row items-center justify-between mb-1">
                <Text
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                  numberOfLines={1}
                >
                  {kpi.title}
                </Text>
                <View
                  className="w-6 h-6 rounded-lg items-center justify-center"
                  style={{ backgroundColor: `${kpi.color}15` }}
                >
                  <Ionicons name={kpi.icon} size={13} color={kpi.color} />
                </View>
              </View>

              <Text
                className="text-sm font-extrabold"
                style={{ color: colors.text }}
                numberOfLines={1}
              >
                {kpi.value}
              </Text>

              <Text
                className="text-[10px] font-medium mt-0.5"
                style={{ color: isDark ? "#64748B" : "#94A3B8" }}
                numberOfLines={1}
              >
                {kpi.subtext}
              </Text>
            </View>
          ))}
        </View>

        {/* 3. Referral Discount Active Banner */}
        {hasReferralDiscount && (
          <View
            className="w-full rounded-2xl p-4 flex-row items-center gap-3.5"
            style={{
              backgroundColor: isDark ? "rgba(16, 185, 129, 0.12)" : "#ECFDF5",
            }}
          >
            <View
              className="w-10 h-10 rounded-xl items-center justify-center"
              style={{ backgroundColor: "#10B98120" }}
            >
              <Ionicons name="gift" size={20} color="#10B981" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2 flex-wrap">
                <Text
                  className="text-xs font-extrabold"
                  style={{ color: isDark ? "#34D399" : "#065F46" }}
                >
                  {referralDiscount?.isWelcomeDiscount
                    ? "Welcome Referral Perk Active!"
                    : `${referralDiscount?.milestoneTitle || "Referral Perk"} Active!`}
                </Text>
                <View className="px-2 py-0.5 rounded-full bg-[#10B981]">
                  <Text className="text-[9px] font-black text-white">
                    {discountPercent}% OFF GAP PRO
                  </Text>
                </View>
              </View>
              <Text
                className="text-[11px] leading-4 mt-0.5"
                style={{ color: isDark ? "#A7F3D0" : "#047857" }}
              >
                {referralDiscount?.isWelcomeDiscount
                  ? `${discountPercent}% discount is automatically applied to all GAP Pro plans!`
                  : `${referralDiscount?.bonusPerk || `${discountPercent}% discount`} applied to your purchase!`}
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
            {/* SECTION 1: GAP PRO PLANS (At the top, only if GAP Pro tiers exist)        */}
            {/* ========================================================================= */}
            {gapProPlans.length > 0 && (
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
              </View>
            )}

            {/* ========================================================================= */}
            {/* SECTION 2: OTHER PLANS & ADD-ONS (Below it, horizontal swipeable carousel)*/}
            {/* ========================================================================= */}

            {/* 3. Modern Category Selector Filter Bar */}
            <View
              className="w-full flex-row items-center p-2 rounded-2xl"
              style={{ backgroundColor: colors.card }}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}
              >
                {availableCategories.map((cat) => {
                  const isSelected = selectedCategory === cat.key;
                  const meta = CATEGORY_META[cat.key];
                  const count =
                    cat.key === "all"
                      ? allPlans.length
                      : cat.key === "all-in-one"
                        ? gapProPlans.length
                        : cat.key === "calling"
                          ? voicePlans.length
                          : cat.key === "whatsapp"
                            ? whatsappPlans.length
                            : cat.key === "telegram"
                              ? telegramPlans.length
                              : cat.key === "crm"
                                ? crmPlans.length
                                : cat.key === "social"
                                  ? socialPlans.length
                                  : 0;

                  return (
                    <Pressable
                      key={cat.key}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedCategory(cat.key);
                      }}
                      style={[
                        {
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 12,
                          backgroundColor: isSelected
                            ? meta.color
                            : isDark
                              ? "rgba(255, 255, 255, 0.05)"
                              : "#F1F5F9",
                        },
                      ]}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={13}
                        color={isSelected ? "#ffffff" : meta.color}
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          color: isSelected ? "#ffffff" : colors.text,
                          fontWeight: isSelected ? "800" : "600",
                        }}
                      >
                        {cat.label}
                      </Text>
                      <View
                        style={{
                          paddingHorizontal: 5,
                          paddingVertical: 1,
                          borderRadius: 8,
                          backgroundColor: isSelected
                            ? "rgba(255, 255, 255, 0.25)"
                            : isDark
                              ? "rgba(255, 255, 255, 0.08)"
                              : "#E2E8F0",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 9.5,
                            fontWeight: "800",
                            color: isSelected
                              ? "#ffffff"
                              : isDark
                                ? "#94A3B8"
                                : "#64748B",
                          }}
                        >
                          {count}
                        </Text>
                      </View>
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
    padding: 16,
    gap: 14,
  },
  proSectionBox: {
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.12,
    shadowRadius: 10,
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
