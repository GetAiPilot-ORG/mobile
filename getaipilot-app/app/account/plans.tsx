import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ProductHeading } from "@/components/ProductUI";
import { getColors, useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
  GAP_PRO_INTERVALS,
  GapProInterval,
  isAddonPlan,
  PlanCategory,
  PricingPlan,
  PricingService,
} from '../../src/core/pricing/pricingService';
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
      color: '#6C55C5',
      lightBg: '#E7DEFA',
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
  const reducedMotion = useReducedMotion();
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
  const [gapProInterval, setGapProInterval] = useState<GapProInterval>('month');

  // Currently Selected Plan ID (for the card highlight state)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [routeCategory, setRouteCategory] = useState(params.category);
  if (routeCategory !== params.category) {
    setRouteCategory(params.category);
    const modular = Boolean(params.category && params.category !== 'all' && params.category !== 'all-in-one');
    setActiveTab(modular ? 'modular' : 'pro');
    setSelectedEngine(modular ? params.category as PlanCategory : 'calling');
  }


  // Detail Modal State (opens when tapping arrow icon)
  const [detailModalPlan, setDetailModalPlan] = useState<PricingPlan | null>(null);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/products');
    }
  };

  const {
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

  const selectedPlan = useMemo(() => {
    return displayedPlans.find((p) => p.id === selectedPlanId) || displayedPlans.find((p) => p.is_popular) || displayedPlans[0];
  }, [displayedPlans, selectedPlanId]);

  const selectedTheme = useMemo(() => {
    return selectedPlan ? getPlanTheme(selectedPlan) : { color: '#6C55C5' };
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

    // Close detail modal if open
    setDetailModalPlan(null);

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

  const openDetailModal = (plan: PricingPlan) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDetailModalPlan(plan);
  };

  return (
    <AppScreen safeArea={false} backgroundColor={isDark ? '#0F172A' : '#F8FAFC'}>
      <AppTopBar
        title="Plans"
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
        <ProductHeading title="Choose your plan" />

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
                backgroundColor: activeTab === 'pro' ? colors.accentSoft : 'transparent',
                shadowColor: activeTab === 'pro' ? '#8B5CF6' : 'transparent',
                shadowOpacity: 0,
                shadowRadius: 6,
                elevation: activeTab === 'pro' ? 3 : 0,
              }}
            >
              <Text
                className="text-xs font-medium "
                style={{
                  color: activeTab === 'pro' ? colors.accent : colors.textMuted,
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
                backgroundColor: activeTab === 'modular' ? colors.accentSoft : 'transparent',
                shadowColor: activeTab === 'modular' ? currentTabThemeColor : 'transparent',
                shadowOpacity: 0,
                shadowRadius: 6,
                elevation: activeTab === 'modular' ? 3 : 0,
              }}
            >
              <Text
                className="text-xs font-medium "
                style={{
                  color: activeTab === 'modular' ? colors.accent : colors.textMuted,
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
                      <Text className="text-[8.5px] font-medium text-purple-500 mt-0.5">
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
              const isSelected = plan.id === selectedPlan?.id;
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
                          className="text-[17px] font-medium tracking-tight"
                          style={{ color: colors.text }}
                        >
                          {plan.plan_label || plan.plan_name}
                        </Text>

                        {isPopular ? (
                          <View
                            className="px-2.5 py-0.5 rounded-full"
                            style={{ backgroundColor: colors.buttonPrimary }}
                          >
                            <Text className="text-[9px] font-medium text-white ">
                              MOST POPULAR
                            </Text>
                          </View>
                        ) : isPro ? (
                          <View
                            className="px-2.5 py-0.5 rounded-full"
                            style={{ backgroundColor: `${theme.color}25` }}
                          >
                            <Text
                              className="text-[9px] font-medium "
                              style={{ color: theme.color }}
                            >
                              BEST VALUE
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      {/* Right top arrow button circle: OPENS DETAIL PAGE */}
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          openDetailModal(plan);
                        }}
                        className="w-8 h-8 rounded-full items-center justify-center active:scale-95"
                        style={{ backgroundColor: colors.buttonPrimary }}
                      >
                        <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                      </Pressable>
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
                              className="text-2xl font-medium tracking-tight"
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
                            className="text-2xl font-medium tracking-tight"
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
                        <Text className="text-[10px] font-medium text-emerald-500">
                          Save ₹{proPricing.totalSavedRupees.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    )}
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
                        className="text-[15px] font-semibold tracking-tight"
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
                        className="text-lg font-medium tracking-tight"
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

                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        openDetailModal(plan);
                      }}
                      className="w-7 h-7 rounded-full items-center justify-center"
                      style={{ backgroundColor: `${theme.color}15` }}
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={15}
                        color={theme.color}
                      />
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

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
          className="w-full py-3.5 rounded-2xl items-center justify-center flex-col gap-0.5 active:opacity-90 shadow-none"
          style={{
            backgroundColor: colors.buttonPrimary,
            shadowColor: selectedTheme.color,
            shadowOpacity: 0,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <View className="flex-row items-center gap-2">
            <Text className="text-[15px] font-medium" style={{ color: colors.buttonPrimaryForeground }}>
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

        </Pressable>
      </View>

      {/* ========================================================================= */}
      {/* DETAIL MODAL / SHEET: Opens when tapping arrow icon on any plan card      */}
      {/* ========================================================================= */}
      {detailModalPlan && (
        <Modal
          visible={Boolean(detailModalPlan)}
          animationType={reducedMotion ? "none" : "fade"}
          transparent={true}
          onRequestClose={() => setDetailModalPlan(null)}
        >
          <View
            className="flex-1 justify-end"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}
          >
            <Pressable
              className="flex-1"
              onPress={() => setDetailModalPlan(null)}
            />

            <View
              className="rounded-t-3xl border-t p-5 max-h-[85%]"
              style={{
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                borderColor: isDark ? '#334155' : '#E2E8F0',
              }}
            >
              {/* Drag Handle Bar */}
              <View className="items-center mb-3">
                <View
                  className="w-10 h-1.5 rounded-full"
                  style={{ backgroundColor: isDark ? '#334155' : '#CBD5E1' }}
                />
              </View>

              {/* Modal Header */}
              {(() => {
                const plan = detailModalPlan;
                const isPro = isGapProPlan(plan);
                const theme = getPlanTheme(plan);

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

                const finalChargedRupees = isPro && proPricing
                  ? proPricing.totalChargedRupees
                  : discountedPriceRupees;

                return (
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3 flex-1 mr-2">
                        <View
                          className="w-12 h-12 rounded-2xl items-center justify-center"
                          style={{ backgroundColor: `${theme.color}20` }}
                        >
                          <Ionicons name={theme.icon} size={24} color={theme.color} />
                        </View>
                        <View className="flex-1">
                          <Text
                            className="text-lg font-medium tracking-tight"
                            style={{ color: colors.text }}
                          >
                            {plan.plan_label || plan.plan_name}
                          </Text>
                          <View className="flex-row items-center gap-1.5 mt-0.5">
                            <View
                              className="px-2 py-0.5 rounded-md"
                              style={{ backgroundColor: `${theme.color}15` }}
                            >
                              <Text
                                className="text-[10px] font-medium "
                                style={{ color: theme.color }}
                              >
                                {theme.badge}
                              </Text>
                            </View>
                            {plan.is_popular && (
                              <View className="px-2 py-0.5 rounded-md bg-[#F59E0B]">
                                <Text className="text-[9.5px] font-medium text-white">
                                  POPULAR
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>

                      <Pressable
                        onPress={() => setDetailModalPlan(null)}
                        className="w-8 h-8 rounded-full items-center justify-center"
                        style={{ backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }}
                      >
                        <Ionicons name="close" size={18} color={colors.text} />
                      </Pressable>
                    </View>

                    {/* Price & Billing Summary Box */}
                    <View
                      className="p-4 rounded-2xl border"
                      style={{
                        backgroundColor: isDark ? theme.darkBg : theme.lightBg,
                        borderColor: `${theme.color}40`,
                      }}
                    >
                      <View className="flex-row items-baseline justify-between mb-1">
                        <View className="flex-row items-baseline gap-2">
                          <Text
                            className="text-3xl font-medium"
                            style={{ color: colors.text }}
                          >
                            {(isPro ? proPricing?.hasDiscount : isEligibleForDiscount)
                              ? formattedDiscountedPrice
                              : formattedPrice}
                          </Text>
                          {(isPro ? proPricing?.hasDiscount : isEligibleForDiscount) && (
                            <Text
                              className="text-base line-through font-semibold"
                              style={{ color: colors.textMuted }}
                            >
                              {formattedPrice}
                            </Text>
                          )}
                          <Text
                            className="text-xs font-bold"
                            style={{ color: theme.color }}
                          >
                            {isPro ? '/month' : `/${plan.duration || 'monthly'}`}
                          </Text>
                        </View>

                        {isPro && proPricing && proPricing.option.discountPercent > 0 && (
                          <View className="px-2.5 py-1 rounded-full bg-emerald-500">
                            <Text className="text-[10px] font-medium text-white">
                              SAVE {proPricing.option.discountPercent}%
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text
                        className="text-xs font-semibold mt-1"
                        style={{ color: colors.textSecondary }}
                      >
                        {isPro && proPricing
                          ? gapProInterval === 'month'
                            ? 'Billed monthly • 30-day renewal cycle'
                            : `Total ₹${proPricing.totalChargedRupees.toLocaleString('en-IN')} billed for ${proPricing.option.months} months (₹${proPricing.totalSavedRupees.toLocaleString('en-IN')} saved)`
                          : plan.billing_note || plan.description || 'Production-grade workspace quotas.'}
                      </Text>
                    </View>

                    {/* Quotas Overview Pills (if available) */}
                    {(Boolean(plan.included_call_minutes) ||
                      Boolean(plan.included_numbers) ||
                      Boolean(plan.included_channels)) && (
                      <View className="gap-2">
                        <Text
                          className="text-[11px] font-medium "
                          style={{ color: colors.textMuted }}
                        >
                          RESOURCE QUOTAS
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                          {Boolean(plan.included_call_minutes) && (
                            <View
                              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl border"
                              style={{
                                backgroundColor: isDark ? 'rgba(168, 85, 247, 0.15)' : '#FAF5FF',
                                borderColor: 'rgba(168, 85, 247, 0.3)',
                              }}
                            >
                              <Ionicons name="mic" size={13} color="#A855F7" />
                              <Text className="text-xs font-bold text-[#A855F7]">
                                {plan.included_call_minutes} AI Calling Minutes
                              </Text>
                            </View>
                          )}

                          {Boolean(plan.included_numbers) && (
                            <View
                              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl border"
                              style={{
                                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#F0FDF4',
                                borderColor: 'rgba(16, 185, 129, 0.3)',
                              }}
                            >
                              <Ionicons name="call" size={13} color="#10B981" />
                              <Text className="text-xs font-bold text-[#10B981]">
                                {plan.included_numbers} Dedicated Virtual Line
                              </Text>
                            </View>
                          )}

                          {Boolean(plan.included_channels) && (
                            <View
                              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl border"
                              style={{
                                backgroundColor: isDark ? 'rgba(236, 72, 153, 0.15)' : '#FDF2F8',
                                borderColor: 'rgba(236, 72, 153, 0.3)',
                              }}
                            >
                              <Ionicons name="share-social" size={13} color="#EC4899" />
                              <Text className="text-xs font-bold text-[#EC4899]">
                                {plan.included_channels} Connected Channels
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}

                    {/* Complete Features Checklist */}
                    <View className="gap-2.5">
                      <Text
                        className="text-[11px] font-medium "
                        style={{ color: colors.textMuted }}
                      >
                        ALL INCLUDED CAPABILITIES
                      </Text>
                      {(Array.isArray(plan.features) && plan.features.length > 0
                        ? plan.features
                        : [
                            'Instant workspace activation',
                            'Automated cloud API access',
                            '24/7 autonomous monitoring',
                            'GST invoice delivery via email',
                          ]
                      ).map((feat, idx) => (
                        <View key={idx} className="flex-row items-start gap-2.5">
                          <View
                            className="w-5 h-5 rounded-full items-center justify-center mt-0.5"
                            style={{ backgroundColor: `${theme.color}25` }}
                          >
                            <Ionicons name="checkmark" size={12} color={theme.color} />
                          </View>
                          <Text
                            className="text-[13px] font-semibold leading-5 flex-1"
                            style={{ color: colors.text }}
                          >
                            {feat}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Guarantee Perks */}
                    <View
                      className="p-3 rounded-2xl flex-row items-center justify-around border my-1"
                      style={{
                        backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                        borderColor: isDark ? '#334155' : '#E2E8F0',
                      }}
                    >
                      <View className="items-center gap-1">
                        <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                        <Text className="text-[10px] font-bold" style={{ color: colors.textMuted }}>
                          256-Bit SSL
                        </Text>
                      </View>
                      <View className="items-center gap-1">
                        <Ionicons name="flash" size={16} color={theme.color} />
                        <Text className="text-[10px] font-bold" style={{ color: colors.textMuted }}>
                          Instant Active
                        </Text>
                      </View>
                      <View className="items-center gap-1">
                        <Ionicons name="receipt-outline" size={16} color="#0284C7" />
                        <Text className="text-[10px] font-bold" style={{ color: colors.textMuted }}>
                          GST Invoice
                        </Text>
                      </View>
                    </View>

                    {/* Purchase Button Inside Modal */}
                    <Pressable
                      onPress={() => handleCheckout(plan)}
                      className="w-full py-3.5 rounded-2xl items-center justify-center flex-col gap-0.5 active:opacity-90 shadow-lg mt-2 mb-4"
                      style={{
                        backgroundColor: colors.buttonPrimary,
                        shadowColor: theme.color,
                        shadowOpacity: 0.4,
                        shadowRadius: 10,
                        elevation: 5,
                      }}
                    >
                      <View className="flex-row items-center gap-2">
                        <Text className="text-[15px] font-medium" style={{ color: colors.buttonPrimaryForeground }}>
                          Purchase Plan · ₹{finalChargedRupees.toLocaleString('en-IN')}
                        </Text>
                        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                      </View>
                      <View className="flex-row items-center gap-1 opacity-90">
                        <Ionicons name="shield-checkmark" size={10} color="#FFFFFF" />
                        <Text className="text-[10px] font-medium" style={{ color: colors.buttonPrimaryForeground }}>
                          PAY VIA RAZORPAY SDK
                        </Text>
                      </View>
                    </Pressable>
                  </ScrollView>
                );
              })()}
            </View>
          </View>
        </Modal>
      )}
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
