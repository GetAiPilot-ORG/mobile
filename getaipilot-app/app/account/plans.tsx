import { getColors, useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { useAuth } from '../../src/contexts/AuthContext';
import { useRazorpay } from '../../src/contexts/RazorpayContext';
import {
  calculateGapProPricing,
  CATEGORY_META,
  GAP_PRO_INTERVALS,
  GapProInterval,
  isAddonPlan,
  PlanCategory,
  PricingPlan,
  PricingService,
} from '../../src/core/pricing/pricingService';
import { openVoiceWebBilling } from '../../src/features/voice/utils/voiceBilling';
import { usePlatformSubscription } from '../../src/hooks/usePlatformSubscription';
import {
  ReferralDiscountInfo,
  checkAndCompleteReferralReward,
  getActiveReferralDiscount,
  isGapProPlan,
} from '../../src/services/referralService';

type MainTab = 'pro' | 'modular';

interface EngineMeta {
  key: PlanCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  lightBg: string;
  darkBg: string;
}

const MODULAR_ENGINES: EngineMeta[] = [
  { key: 'calling', label: 'Voice AI', icon: 'call-outline', color: '#A855F7', lightBg: '#FAF5FF', darkBg: '#2E1065' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp', color: '#10B981', lightBg: '#F0FDF4', darkBg: '#064E3B' },
  { key: 'telegram', label: 'Telegram', icon: 'paper-plane-outline', color: '#0284C7', lightBg: '#F0F9FF', darkBg: '#0C4A6E' },
  { key: 'crm', label: 'Smart CRM', icon: 'people-outline', color: '#F59E0B', lightBg: '#FFFBEB', darkBg: '#451A03' },
  { key: 'social', label: 'Social Pilot', icon: 'share-social-outline', color: '#EC4899', lightBg: '#FDF2F8', darkBg: '#500724' },
];

/**
 * Returns dynamic theme color for any given plan
 */
function getPlanTheme(plan: PricingPlan) {
  if (isGapProPlan(plan)) {
    return {
      color: '#8B5CF6',
      lightBg: '#FAF7FF',
      darkBg: '#231548',
      badge: 'ALL-IN-ONE VIP',
      icon: 'diamond' as keyof typeof Ionicons.glyphMap,
    };
  }

  const cat = (plan.category || '').toLowerCase();
  if (cat === 'calling' || cat === 'voice' || isAddonPlan(plan)) {
    return {
      color: '#A855F7',
      lightBg: '#FAF5FF',
      darkBg: '#2E1065',
      badge: 'VOICE AGENTS',
      icon: 'call' as keyof typeof Ionicons.glyphMap,
    };
  }
  if (cat === 'whatsapp') {
    return {
      color: '#10B981',
      lightBg: '#F0FDF4',
      darkBg: '#064E3B',
      badge: 'META CLOUD API',
      icon: 'logo-whatsapp' as keyof typeof Ionicons.glyphMap,
    };
  }
  if (cat === 'telegram') {
    return {
      color: '#0284C7',
      lightBg: '#F0F9FF',
      darkBg: '#0C4A6E',
      badge: 'TELEGRAM HUB',
      icon: 'paper-plane' as keyof typeof Ionicons.glyphMap,
    };
  }
  if (cat === 'crm') {
    return {
      color: '#F59E0B',
      lightBg: '#FFFBEB',
      darkBg: '#451A03',
      badge: 'SMART CRM',
      icon: 'people' as keyof typeof Ionicons.glyphMap,
    };
  }
  if (cat === 'social') {
    return {
      color: '#EC4899',
      lightBg: '#FDF2F8',
      darkBg: '#500724',
      badge: 'OMNICHANNEL',
      icon: 'share-social' as keyof typeof Ionicons.glyphMap,
    };
  }

  return {
    color: '#0284C7',
    lightBg: '#F0F9FF',
    darkBg: '#0C4A6E',
    badge: 'ECOSYSTEM',
    icon: 'shield-checkmark' as keyof typeof Ionicons.glyphMap,
  };
}

export default function OverallPricingScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();
  const { openRazorpayCheckout } = useRazorpay();
  const params = useLocalSearchParams<{ category?: string }>();

  // Main Segmented Tab: GAP Pro vs Modular Engines
  const [activeTab, setActiveTab] = useState<MainTab>(
    params.category && params.category !== 'all' && params.category !== 'all-in-one'
      ? 'modular'
      : 'pro'
  );

  // Selected Modular Engine Filter
  const [selectedEngine, setSelectedEngine] = useState<PlanCategory>(
    params.category && params.category !== 'all' && params.category !== 'all-in-one'
      ? (params.category as PlanCategory)
      : 'calling'
  );

  // GAP Pro Billing Interval: Monthly | Quarterly | Half-Yearly | Yearly
  const [gapProInterval, setGapProInterval] = useState<GapProInterval>('year');

  // Currently Selected Plan ID (for the card highlight state)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/products');
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
    queryKey: ['active-referral-discount', user?.id],
    queryFn: () => getActiveReferralDiscount(user?.id),
    staleTime: 60 * 1000,
  });

  const hasReferralDiscount = Boolean(
    referralDiscount?.hasDiscount && (referralDiscount.discountPercent || 0) > 0
  );
  const discountPercent = referralDiscount?.discountPercent || 0;

  // Query all active plans from DB / BFF
  const {
    data: allPlans = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<PricingPlan[]>({
    queryKey: ['ecosystem-pricing-plans-all'],
    queryFn: () => PricingService.getPlans('all'),
    staleTime: 60 * 1000,
  });

  const onRefresh = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([refetch(), refreshSub(), refetchDiscount()]);
  };

  // GAP Pro Plans
  const gapProPlans = useMemo(() => {
    return allPlans
      .filter((p) => isGapProPlan(p))
      .sort((a, b) => a.amount - b.amount);
  }, [allPlans]);

  // Modular Plans for selected engine
  const currentModularPlans = useMemo(() => {
    return allPlans
      .filter((p) => {
        if (isGapProPlan(p)) return false;
        if (selectedEngine === 'calling') {
          return p.category === 'calling' || p.category === 'voice' || isAddonPlan(p);
        }
        return p.category === selectedEngine;
      })
      .sort((a, b) => a.amount - b.amount);
  }, [allPlans, selectedEngine]);

  // Active displayed plans
  const displayedPlans = useMemo(() => {
    return activeTab === 'pro' ? gapProPlans : currentModularPlans;
  }, [activeTab, gapProPlans, currentModularPlans]);

  // Automatically select the popular or first plan if none selected
  useEffect(() => {
    if (displayedPlans.length > 0) {
      const popular = displayedPlans.find((p) => p.is_popular);
      const chosen = popular || displayedPlans[0];
      setSelectedPlanId((prev) => {
        if (!prev || !displayedPlans.some((p) => p.id === prev)) {
          return chosen.id;
        }
        return prev;
      });
    }
  }, [displayedPlans]);

  useEffect(() => {
    if (params.category) {
      if (params.category === 'all' || params.category === 'all-in-one') {
        setActiveTab('pro');
      } else {
        setActiveTab('modular');
        setSelectedEngine(params.category as PlanCategory);
      }
    }
  }, [params.category]);

  const selectedPlan = useMemo(() => {
    return displayedPlans.find((p) => p.id === selectedPlanId) || displayedPlans[0];
  }, [displayedPlans, selectedPlanId]);

  const selectedTheme = useMemo(() => {
    return selectedPlan ? getPlanTheme(selectedPlan) : { color: '#8B5CF6' };
  }, [selectedPlan]);

  const currentTabThemeColor = useMemo(() => {
    if (activeTab === 'pro') return '#8B5CF6';
    const found = MODULAR_ENGINES.find((e) => e.key === selectedEngine);
    return found ? found.color : '#0284C7';
  }, [activeTab, selectedEngine]);

  const handleCheckout = (planToBuy?: PricingPlan) => {
    const plan = planToBuy || selectedPlan;
    if (!plan) return;

    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const isAddon = isAddonPlan(plan);
    const isVoicePlan =
      plan.category === 'calling' ||
      plan.category === 'voice' ||
      plan.id.startsWith('calling') ||
      plan.id.startsWith('call_') ||
      isAddon;

    const theme = getPlanTheme(plan);
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
        currency: plan.currency || 'INR',
        product: 'ecosystem',
        planId: plan.id,
        planName: `GetAiPilot - ${planDisplayName}`,
        billingInterval: gapProInterval,
        description: `${planDisplayName} Subscription · ${proPricing.option.days} Days Quotas`,
        themeColor: theme.color,
        onSuccess: async () => {
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }

          if (user?.id) {
            try {
              await checkAndCompleteReferralReward(user.id, plan.id, amountInRupees);
            } catch (refErr) {
              console.warn('[Pricing] Referral reward completion notice:', refErr);
            }
          }

          Alert.alert(
            'Subscription Activated! 🎉',
            `Your ${proPricing.option.label} subscription to ${planDisplayName} has been confirmed. Quotas are active in your workspace for ${proPricing.option.days} days.`,
            [{ text: 'Great!' }]
          );
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['platform-subscription'] }),
            queryClient.invalidateQueries({ queryKey: ['ecosystem-pricing-plans-all'] }),
            queryClient.invalidateQueries({ queryKey: ['active-referral-discount'] }),
            queryClient.invalidateQueries({ queryKey: ['social', 'entitlements'] }),
            queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
            queryClient.invalidateQueries({ queryKey: ['voice'] }),
            queryClient.invalidateQueries({ queryKey: ['voice', 'overview'] }),
            queryClient.invalidateQueries({ queryKey: ['voice', 'numbers'] }),
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
      dur.includes('year')
        ? 'year'
        : dur.includes('quarter')
        ? 'quarterly'
        : dur.includes('6')
        ? 'six_months'
        : 'month';

    openRazorpayCheckout({
      amount: amountInRupees,
      currency: plan.currency || 'INR',
      product: isVoicePlan ? 'calling' : plan.category || 'ecosystem',
      planId: plan.id,
      planName: `GetAiPilot - ${planDisplayName}`,
      billingInterval,
      description: plan.description || `${planDisplayName} Subscription`,
      themeColor: theme.color,
      onSuccess: async () => {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        Alert.alert(
          'Subscription Activated! 🎉',
          `Your subscription to ${planDisplayName} has been confirmed. Quotas are active in your workspace.`,
          [{ text: 'Great!' }]
        );
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['platform-subscription'] }),
          queryClient.invalidateQueries({ queryKey: ['ecosystem-pricing-plans-all'] }),
          queryClient.invalidateQueries({ queryKey: ['active-referral-discount'] }),
          queryClient.invalidateQueries({ queryKey: ['social', 'entitlements'] }),
          queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
          queryClient.invalidateQueries({ queryKey: ['voice'] }),
          queryClient.invalidateQueries({ queryKey: ['voice', 'overview'] }),
          queryClient.invalidateQueries({ queryKey: ['voice', 'numbers'] }),
        ]);
      },
    });
  };



  return (
    <AppScreen safeArea={false} backgroundColor={isDark ? '#0F172A' : '#F8FAFC'}>
      <AppTopBar
        title="Choose Your Plan"
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
            tintColor={currentTabThemeColor}
          />
        }
      >
        {/* Title Header matching Screenshot 1 & 2 */}
        <View className="items-center px-4 pt-2 pb-1">
          <Text
            className="text-2xl font-black tracking-tight text-center"
            style={{ color: colors.text }}
          >
            Our Packages
          </Text>
          <Text
            className="text-xs text-center mt-1.5 leading-4 px-4"
            style={{ color: colors.textMuted }}
          >
            Select the optimal tier for your team and proceed directly with Razorpay checkout.
          </Text>
        </View>

        {/* Top Segmented Switcher (Exact style of Screenshot 1: [ PERSONAL ] [ BUSINESS ]) */}
        <View className="items-center my-3">
          <View
            className="flex-row p-1 rounded-full border shadow-sm"
            style={{
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#E2E8F0',
              width: Math.min(width - 32, 340),
            }}
          >
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('pro');
              }}
              className="flex-1 py-2.5 rounded-full items-center justify-center"
              style={{
                backgroundColor: activeTab === 'pro' ? '#8B5CF6' : 'transparent',
                shadowColor: activeTab === 'pro' ? '#8B5CF6' : 'transparent',
                shadowOpacity: activeTab === 'pro' ? 0.35 : 0,
                shadowRadius: 6,
                elevation: activeTab === 'pro' ? 3 : 0,
              }}
            >
              <Text
                className="text-xs font-black tracking-wider"
                style={{
                  color: activeTab === 'pro' ? '#FFFFFF' : colors.textMuted,
                }}
              >
                ALL-IN-ONE PRO
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('modular');
              }}
              className="flex-1 py-2.5 rounded-full items-center justify-center"
              style={{
                backgroundColor: activeTab === 'modular' ? currentTabThemeColor : 'transparent',
                shadowColor: activeTab === 'modular' ? currentTabThemeColor : 'transparent',
                shadowOpacity: activeTab === 'modular' ? 0.35 : 0,
                shadowRadius: 6,
                elevation: activeTab === 'modular' ? 3 : 0,
              }}
            >
              <Text
                className="text-xs font-black tracking-wider"
                style={{
                  color: activeTab === 'modular' ? '#FFFFFF' : colors.textMuted,
                }}
              >
                SINGLE ENGINES
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Sub-Filters: Interval Cadence for Pro, or Engine Chips for Modular */}
        {activeTab === 'pro' ? (
          <View className="mb-2 px-1">
            <View
              className="flex-row p-1 rounded-2xl border"
              style={{
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                borderColor: isDark ? '#334155' : '#E2E8F0',
              }}
            >
              {GAP_PRO_INTERVALS.map((inv) => {
                const isSelected = gapProInterval === inv.key;
                return (
                  <Pressable
                    key={inv.key}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setGapProInterval(inv.key);
                    }}
                    className="flex-1 py-2 px-1 rounded-xl items-center justify-center"
                    style={{
                      backgroundColor: isSelected
                        ? isDark
                          ? '#334155'
                          : '#F1F5F9'
                        : 'transparent',
                    }}
                  >
                    <Text
                      className="text-[11px]"
                      style={{
                        fontWeight: isSelected ? '900' : '600',
                        color: isSelected ? (isDark ? '#F8FAFC' : '#0F172A') : colors.textMuted,
                      }}
                    >
                      {inv.label}
                    </Text>
                    {Boolean(inv.badge) && (
                      <Text className="text-[8.5px] font-black text-purple-500 mt-0.5">
                        {inv.badge}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : (
          <View className="mb-2">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}
            >
              {MODULAR_ENGINES.map((eng) => {
                const isSelected = selectedEngine === eng.key;
                return (
                  <Pressable
                    key={eng.key}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedEngine(eng.key);
                    }}
                    className="flex-row items-center gap-1.5 px-3.5 py-2 rounded-full border shadow-sm"
                    style={{
                      backgroundColor: isSelected
                        ? eng.color
                        : isDark
                        ? '#1E293B'
                        : '#FFFFFF',
                      borderColor: isSelected
                        ? eng.color
                        : isDark
                        ? '#334155'
                        : '#E2E8F0',
                    }}
                  >
                    <Ionicons
                      name={eng.icon}
                      size={13}
                      color={isSelected ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'}
                    />
                    <Text
                      className="text-xs"
                      style={{
                        fontWeight: isSelected ? '900' : '600',
                        color: isSelected ? '#FFFFFF' : colors.text,
                      }}
                    >
                      {eng.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Active Referral Perk Notice */}
        {hasReferralDiscount && (
          <View
            className="flex-row items-center gap-2.5 p-3 rounded-2xl mb-2 border"
            style={{
              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
              borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#A7F3D0',
            }}
          >
            <Ionicons name="gift" size={16} color="#10B981" />
            <Text
              className="text-xs font-bold flex-1"
              style={{ color: isDark ? '#34D399' : '#065F46' }}
            >
              {discountPercent}% Referral Perk applied automatically at checkout!
            </Text>
          </View>
        )}

        {/* LOADING STATE */}
        {isLoading ? (
          <View className="py-16 items-center gap-3">
            <ActivityIndicator size="large" color={currentTabThemeColor} />
            <Text className="text-xs font-semibold" style={{ color: colors.textMuted }}>
              Loading verified packages...
            </Text>
          </View>
        ) : displayedPlans.length === 0 ? (
          <View
            className="p-8 rounded-2xl items-center justify-center gap-2 border my-4"
            style={{
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#E2E8F0',
            }}
          >
            <Ionicons name="cube-outline" size={32} color={currentTabThemeColor} />
            <Text className="text-sm font-bold" style={{ color: colors.text }}>
              No plans available
            </Text>
            <Text className="text-xs text-center" style={{ color: colors.textMuted }}>
              Switch tabs or refresh to load verified plans.
            </Text>
          </View>
        ) : (
          /* PLAN CARDS LIST: Matching Screenshots 1 & 2 directly with DYNAMIC COLORS */
          <View className="gap-3.5 my-1">
            {displayedPlans.map((plan) => {
              const isSelected = plan.id === selectedPlanId;
              const isPro = isGapProPlan(plan);
              const isAddon = isAddonPlan(plan);
              const isPopular = Boolean(plan.is_popular);
              const theme = getPlanTheme(plan);

              // Pro Interval Calculations
              const proPricing = isPro
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

              const formattedPrice =
                isPro && proPricing
                  ? PricingService.formatPrice(proPricing.baseMonthlyRupees * 100, plan.currency)
                  : PricingService.formatPrice(plan.amount, plan.currency);

              const formattedDiscountedPrice =
                isPro && proPricing
                  ? PricingService.formatPrice(proPricing.finalMonthlyRupees * 100, plan.currency)
                  : PricingService.formatPrice(discountedPriceRupees * 100, plan.currency);

              const formattedDuration = isPro
                ? '/mo'
                : PricingService.formatDuration(plan.duration || 'monthly');

              // Features to display on selected card
              const featuresToShow =
                Array.isArray(plan.features) && plan.features.length > 0
                  ? plan.features.slice(0, 4)
                  : [
                      isPro ? 'All 5 AI Engines Included' : `${plan.plan_label} Quotas`,
                      Boolean(plan.included_call_minutes)
                        ? `${plan.included_call_minutes} AI Calling Minutes`
                        : 'Unlimited bot automation',
                      Boolean(plan.included_numbers)
                        ? `${plan.included_numbers} Virtual Dedicated Line`
                        : 'Instant priority cloud server',
                    ];

              /* ----------------------------------------------------------------- */
              /* STATE 1: SELECTED CARD (Dynamic Color Theme Matching Screenshot 2)*/
              /* ----------------------------------------------------------------- */
              if (isSelected) {
                return (
                  <Pressable
                    key={plan.id}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedPlanId(plan.id);
                    }}
                    className="rounded-3xl p-5 border-2 shadow-sm"
                    style={{
                      backgroundColor: isDark ? theme.darkBg : theme.lightBg,
                      borderColor: theme.color,
                    }}
                  >
                    {/* Top Row: Title + Badge + Clickable Arrow Button */}
                    <View className="flex-row items-center justify-between mb-3.5">
                      <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                        <Text
                          className="text-[17px] font-black tracking-tight"
                          style={{ color: colors.text }}
                        >
                          {plan.plan_label || plan.plan_name}
                        </Text>

                        {isPopular ? (
                          <View
                            className="px-2.5 py-0.5 rounded-full"
                            style={{ backgroundColor: theme.color }}
                          >
                            <Text className="text-[9px] font-black text-white tracking-wider">
                              MOST POPULAR
                            </Text>
                          </View>
                        ) : isPro ? (
                          <View
                            className="px-2.5 py-0.5 rounded-full"
                            style={{ backgroundColor: `${theme.color}25` }}
                          >
                            <Text
                              className="text-[9px] font-black tracking-wider"
                              style={{ color: theme.color }}
                            >
                              BEST VALUE
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      {/* Selected checkmark indicator */}
                      <View
                        className="w-7 h-7 rounded-full items-center justify-center"
                        style={{ backgroundColor: theme.color }}
                      >
                        <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                      </View>
                    </View>

                    {/* Middle Row: Features on Left, Large Price on Right */}
                    <View className="flex-row items-center justify-between gap-3">
                      {/* Left Checklist */}
                      <View className="flex-1 gap-2">
                        {featuresToShow.map((feat, fIdx) => (
                          <View key={fIdx} className="flex-row items-center gap-2">
                            <View
                              className="w-4 h-4 rounded-full items-center justify-center"
                              style={{ backgroundColor: `${theme.color}25` }}
                            >
                              <Ionicons name="checkmark" size={10} color={theme.color} />
                            </View>
                            <Text
                              className="text-xs font-semibold"
                              style={{ color: colors.text }}
                              numberOfLines={1}
                            >
                              {feat}
                            </Text>
                          </View>
                        ))}
                      </View>

                      {/* Right Pricing Display */}
                      <View className="items-end pl-2">
                        {(isPro ? proPricing?.hasDiscount : isEligibleForDiscount) ? (
                          <View className="items-end">
                            <Text
                              className="text-2xl font-black tracking-tight"
                              style={{ color: colors.text }}
                            >
                              {formattedDiscountedPrice}
                            </Text>
                            <Text
                              className="text-xs line-through font-semibold"
                              style={{ color: colors.textMuted }}
                            >
                              {formattedPrice}
                            </Text>
                          </View>
                        ) : (
                          <Text
                            className="text-2xl font-black tracking-tight"
                            style={{ color: colors.text }}
                          >
                            {formattedPrice}
                          </Text>
                        )}
                        <Text
                          className="text-[10px] font-bold mt-0.5"
                          style={{ color: theme.color }}
                        >
                          {isAddon ? '/30 days' : formattedDuration}
                        </Text>
                      </View>
                    </View>

                    {/* Bottom Billing Note if discounted */}
                    {isPro && proPricing && proPricing.option.discountPercent > 0 && (
                      <View
                        className="mt-3.5 pt-2.5 border-t flex-row items-center justify-between"
                        style={{ borderTopColor: `${theme.color}30` }}
                      >
                        <Text className="text-[11px] font-bold" style={{ color: theme.color }}>
                          Total ₹{proPricing.totalChargedRupees.toLocaleString('en-IN')} for {proPricing.option.months} mos
                        </Text>
                        <Text className="text-[10px] font-black text-emerald-500">
                          Save ₹{proPricing.totalSavedRupees.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    )}
                    {/* Direct 1-Tap Razorpay Button on Card */}
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        handleCheckout(plan);
                      }}
                      className="mt-3.5 py-3 rounded-2xl items-center justify-center flex-row gap-2 active:opacity-90 shadow-sm"
                      style={{ backgroundColor: theme.color }}
                    >
                      <Ionicons name="card-outline" size={15} color="#FFFFFF" />
                      <Text className="text-white text-xs font-black tracking-wider">
                        PAY WITH RAZORPAY
                      </Text>
                    </Pressable>
                  </Pressable>
                );
              }

              /* ----------------------------------------------------------------- */
              /* STATE 2: UNSELECTED CARD (Dynamic Color Theme Matching Screenshot 1)*/
              /* ----------------------------------------------------------------- */
              return (
                <Pressable
                  key={plan.id}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedPlanId(plan.id);
                  }}
                  className="rounded-2xl p-4 border flex-row items-center justify-between shadow-sm active:opacity-85"
                  style={{
                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                  }}
                >
                  {/* Left: Dynamic Colored Ring Indicator + Title & Subtitle */}
                  <View className="flex-row items-center gap-3.5 flex-1 min-w-0 mr-2">
                    <View
                      className="w-5 h-5 rounded-full border-2 items-center justify-center"
                      style={{ borderColor: theme.color }}
                    />

                    <View className="flex-1 min-w-0">
                      <Text
                        className="text-[15px] font-extrabold tracking-tight"
                        style={{ color: colors.text }}
                        numberOfLines={1}
                      >
                        {plan.plan_label || plan.plan_name}
                      </Text>
                      <Text
                        className="text-[11.5px] mt-0.5"
                        style={{ color: colors.textMuted }}
                        numberOfLines={1}
                      >
                        {plan.description || (isPro ? 'All-in-One VIP Suite' : `${theme.badge} Module`)}
                      </Text>
                    </View>
                  </View>

                  {/* Right: Price + Arrow/Chevron Button (Tap to Open Detail Page) */}
                  <View className="flex-row items-center gap-3">
                    <View className="items-end">
                      <Text
                        className="text-lg font-black tracking-tight"
                        style={{ color: colors.text }}
                      >
                        {(isPro ? proPricing?.hasDiscount : isEligibleForDiscount)
                          ? formattedDiscountedPrice
                          : formattedPrice}
                      </Text>
                      <Text className="text-[9.5px] font-medium" style={{ color: colors.textMuted }}>
                        {isAddon ? '/30-day' : formattedDuration}
                      </Text>
                    </View>

                    <View
                      className="w-7 h-7 rounded-full items-center justify-center"
                      style={{ backgroundColor: `${theme.color}15` }}
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={15}
                        color={theme.color}
                      />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Security & Assurance Mini Footer */}
        <View className="flex-row items-center justify-center gap-4 py-3 opacity-75">
          <View className="flex-row items-center gap-1">
            <Ionicons name="shield-checkmark" size={12} color="#10B981" />
            <Text className="text-[10.5px] font-bold" style={{ color: colors.textMuted }}>
              SSL Secure
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Ionicons name="flash" size={12} color="#F59E0B" />
            <Text className="text-[10.5px] font-bold" style={{ color: colors.textMuted }}>
              Instant Activation
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Ionicons name="receipt-outline" size={12} color="#0284C7" />
            <Text className="text-[10.5px] font-bold" style={{ color: colors.textMuted }}>
              GST Invoices
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Sticky CTA Button (Dynamic Theme Color) */}
      <View
        className="px-5 py-3 border-t"
        style={{
          backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
          borderTopColor: isDark ? '#1E293B' : '#E2E8F0',
        }}
      >
        <Pressable
          onPress={() => handleCheckout()}
          disabled={!selectedPlan}
          className="w-full py-3.5 rounded-2xl items-center justify-center flex-col gap-0.5 active:opacity-90 shadow-md"
          style={{
            backgroundColor: selectedTheme.color,
            shadowColor: selectedTheme.color,
            shadowOpacity: 0.35,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <View className="flex-row items-center gap-2">
            <Text className="text-white text-[15px] font-black tracking-wide">
              {selectedPlan
                ? `Continue to Purchase · ${
                    isGapProPlan(selectedPlan)
                      ? PricingService.formatPrice(
                          calculateGapProPricing(
                            selectedPlan.amount,
                            gapProInterval,
                            hasReferralDiscount ? discountPercent : 0
                          ).totalChargedRupees * 100,
                          selectedPlan.currency
                        )
                      : PricingService.formatPrice(selectedPlan.amount, selectedPlan.currency)
                  }`
                : 'Continue to Purchase'}
            </Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </View>
          <View className="flex-row items-center gap-1 opacity-90">
            <Ionicons name="shield-checkmark" size={10} color="#FFFFFF" />
            <Text className="text-[10px] font-bold text-white tracking-wider">
              RAZORPAY SECURE SDK · UPI & CARDS
            </Text>
          </View>
        </Pressable>
      </View>


    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    gap: 10,
  },
});
