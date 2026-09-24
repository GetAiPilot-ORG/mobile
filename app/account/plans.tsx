import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
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
} from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { useRazorpay } from '../../src/contexts/RazorpayContext';
import {
  CATEGORY_META,
  PlanCategory,
  PricingPlan,
  PricingService,
} from '../../src/core/pricing/pricingService';
import { usePlatformSubscription } from '../../src/hooks/usePlatformSubscription';

const CATEGORIES: { key: PlanCategory; label: string; icon: string }[] = [
  { key: 'all', label: 'All Plans', icon: 'apps' },
  { key: 'calling', label: 'Voice AI', icon: 'call' },
  { key: 'social', label: 'Social Pilot', icon: 'share-social' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp' },
  { key: 'telegram', label: 'Telegram', icon: 'paper-plane' },
  { key: 'crm', label: 'Smart CRM', icon: 'people' },
];

export default function OverallPricingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const queryClient = useQueryClient();
  const { openRazorpayCheckout } = useRazorpay();

  const {
    planLabel,
    subscriptionStatus,
    expiresAt,
    refresh: refreshSub,
  } = usePlatformSubscription();

  const [selectedCategory, setSelectedCategory] = useState<PlanCategory>('all');
  const [selectedDuration, setSelectedDuration] = useState<'all' | 'monthly' | 'yearly'>('all');

  // Query active plans from public.pricing_plans
  const {
    data: plans = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<PricingPlan[]>({
    queryKey: ['ecosystem-pricing-plans', selectedCategory],
    queryFn: () => PricingService.getPlans(selectedCategory),
    staleTime: 60 * 1000,
  });

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([refetch(), refreshSub()]);
  };

  // Filter by duration if user selects specific duration tab
  const filteredPlans = useMemo(() => {
    if (selectedDuration === 'all') return plans;
    return plans.filter((p) => {
      const d = (p.duration || 'monthly').toLowerCase();
      if (selectedDuration === 'monthly') return d.includes('month');
      if (selectedDuration === 'yearly') return d.includes('year') || d.includes('annual');
      return true;
    });
  }, [plans, selectedDuration]);

  const handleSelectPlan = (plan: PricingPlan) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const amountInRupees = Math.round(plan.amount / 100);
    const planDisplayName = plan.plan_label || plan.plan_name;

    openRazorpayCheckout({
      amount: amountInRupees,
      currency: plan.currency || 'INR',
      product: plan.category || 'ecosystem',
      planId: plan.id,
      planName: `GetAiPilot - ${planDisplayName}`,
      billingInterval: plan.duration?.toLowerCase().includes('year') ? 'year' : 'month',
      description: plan.description || `${planDisplayName} Subscription`,
      onSuccess: async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Subscription Activated! 🎉',
          `Your subscription to ${planDisplayName} has been confirmed. Quotas are active in your workspace.`,
          [{ text: 'Great!' }]
        );
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['platform-subscription'] }),
          queryClient.invalidateQueries({ queryKey: ['ecosystem-pricing-plans'] }),
          queryClient.invalidateQueries({ queryKey: ['social', 'entitlements'] }),
          queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        ]);
      },
    });
  };

  return (
    <AppScreen safeArea={false} backgroundColor={isDark ? '#000000' : '#F8FAFC'}>
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
              backgroundColor: isDark ? '#06131d' : '#eff6ff',
              borderColor: isDark ? '#1e3a8a44' : '#bfdbfe',
            },
          ]}
        >
          <View style={styles.statusHeader}>
            <View
              style={[
                styles.activePill,
                { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#dcfce7' },
              ]}
            >
              <View style={styles.activeDot} />
              <Text style={styles.activePillText}>
                {subscriptionStatus ? subscriptionStatus.toUpperCase() : 'ACTIVE WORKSPACE'}
              </Text>
            </View>
            <Text style={[styles.planStatusDate, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              {expiresAt
                ? `Renews ${new Date(expiresAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}`
                : 'Active Tier'}
            </Text>
          </View>

          <Text style={[styles.statusPlanName, { color: isDark ? '#FFFFFF' : '#0f172a' }]}>
            {planLabel || 'GAP Pro Max'}
          </Text>
          <Text style={[styles.statusPlanDesc, { color: isDark ? '#cbd5e1' : '#475569' }]}>
            Full multi-engine access enabled: Voice AI, Social Pilot, WhatsApp, Telegram & Smart CRM.
          </Text>
        </View>

        {/* 2. Category Selector Pills (Scrollable) */}
        <View style={styles.categorySection}>
          <Text style={[styles.sectionLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
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
                          ? '#0f172a'
                          : '#ffffff',
                      borderColor: isSelected
                        ? meta.color
                        : isDark
                          ? '#1e293b'
                          : '#e2e8f0',
                    },
                  ]}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={14}
                    color={isSelected ? '#ffffff' : meta.color}
                  />
                  <Text
                    style={[
                      styles.categoryPillText,
                      {
                        color: isSelected ? '#ffffff' : isDark ? '#f1f5f9' : '#1e293b',
                        fontWeight: isSelected ? '800' : '600',
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

        {/* 4. Plans Grid / List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0A84FF" />
            <Text style={[styles.loadingText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              Loading verified pricing plans...
            </Text>
          </View>
        ) : filteredPlans.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>
            <Ionicons name="pricetags-outline" size={40} color="#94a3b8" />
            <Text style={[styles.emptyTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
              No Plans in this Category
            </Text>
            <Text style={[styles.emptyDesc, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              Try selecting "All Plans" to view all ecosystem automation tiers.
            </Text>
            <Pressable
              onPress={() => setSelectedCategory('all')}
              style={styles.emptyBtn}
            >
              <Text style={styles.emptyBtnText}>View All Plans</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.plansList}>
            {filteredPlans.map((plan) => {
              const catKey = (plan.category || 'all').toLowerCase();
              const meta = CATEGORY_META[catKey] || CATEGORY_META.all;
              const formattedPrice = PricingService.formatPrice(plan.amount, plan.currency);
              const formattedDuration = PricingService.formatDuration(plan.duration || 'monthly');
              const isPopular = Boolean(plan.is_popular);

              return (
                <View
                  key={plan.id}
                  style={[
                    styles.planCard,
                    {
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isPopular
                        ? meta.color
                        : isDark
                          ? '#1e293b'
                          : '#e2e8f0',
                      borderWidth: isPopular ? 2 : 1,
                    },
                  ]}
                >
                  {/* Popular Ribbon / Badge */}
                  <View style={styles.cardTopRow}>
                    <View
                      style={[
                        styles.categoryBadge,
                        { backgroundColor: `${meta.color}20` },
                      ]}
                    >
                      <Ionicons name={meta.icon as any} size={11} color={meta.color} />
                      <Text style={[styles.categoryBadgeText, { color: meta.color }]}>
                        {meta.label.toUpperCase()}
                      </Text>
                    </View>

                    {isPopular && (
                      <View style={[styles.popularBadge, { backgroundColor: meta.color }]}>
                        <Ionicons name="sparkles" size={10} color="#ffffff" />
                        <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                      </View>
                    )}
                  </View>

                  {/* Plan Name & Tagline */}
                  <View style={styles.planHeader}>
                    <Text style={[styles.planTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      {plan.plan_label || plan.plan_name}
                    </Text>
                    {plan.description ? (
                      <Text style={[styles.planDescription, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                        {plan.description}
                      </Text>
                    ) : null}
                  </View>

                  {/* Pricing Box */}
                  <View style={[styles.priceBox, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
                    <View style={styles.priceRow}>
                      <Text style={[styles.priceAmount, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                        {formattedPrice}
                      </Text>
                      <Text style={[styles.priceDuration, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                        {formattedDuration}
                      </Text>
                    </View>
                    {plan.billing_note ? (
                      <Text style={[styles.billingNote, { color: meta.color }]}>
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
                          <View style={[styles.quotaTag, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                            <Ionicons name="mic" size={12} color="#8b5cf6" />
                            <Text style={[styles.quotaTagText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                              {plan.included_call_minutes} AI Mins
                            </Text>
                          </View>
                        )}
                        {Boolean(plan.extra_call_rate_paise) && (
                          <View style={[styles.quotaTag, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                            <Ionicons name="pricetag" size={12} color="#8b5cf6" />
                            <Text style={[styles.quotaTagText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                              ₹{plan.extra_call_rate_paise! / 100}/min extra
                            </Text>
                          </View>
                        )}
                        {Boolean(plan.included_numbers) && (
                          <View style={[styles.quotaTag, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                            <Ionicons name="call" size={12} color="#25d366" />
                            <Text style={[styles.quotaTagText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                              {plan.included_numbers} Number
                            </Text>
                          </View>
                        )}
                        {Boolean(plan.included_channels) && (
                          <View style={[styles.quotaTag, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                            <Ionicons name="share-social" size={12} color="#ec4899" />
                            <Text style={[styles.quotaTagText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                              {plan.included_channels} Channels
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                  {/* Feature Checklist */}
                  {Array.isArray(plan.features) && plan.features.length > 0 && (
                    <View style={styles.featuresList}>
                      {plan.features.map((feat, idx) => (
                        <View key={idx} style={styles.featureItem}>
                          <Ionicons name="checkmark-circle" size={15} color="#10B981" />
                          <Text
                            style={[
                              styles.featureText,
                              { color: isDark ? '#e2e8f0' : '#334155' },
                            ]}
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
                      {
                        backgroundColor: meta.color,
                        shadowColor: meta.color,
                      },
                    ]}
                  >
                    <Ionicons name="shield-checkmark" size={16} color="#ffffff" />
                    <Text style={styles.subscribeBtnText}>
                      Subscribe · {formattedPrice}
                    </Text>
                    <Ionicons name="arrow-forward" size={15} color="#ffffff" />
                  </Pressable>
                </View>
              );
            })}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  activePillText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  planStatusDate: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusPlanName: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statusPlanDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  categorySection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
  },
  durationTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  durationTabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  durationTabActiveDark: {
    backgroundColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 1,
  },
  durationTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 6,
  },
  emptyDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: '#0A84FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  emptyBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  plansList: {
    gap: 16,
  },
  planCard: {
    borderRadius: 20,
    padding: 18,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  popularBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  planHeader: {
    gap: 4,
  },
  planTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  planDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  priceBox: {
    padding: 14,
    borderRadius: 12,
    gap: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  priceDuration: {
    fontSize: 13,
    fontWeight: '600',
  },
  billingNote: {
    fontSize: 11,
    fontWeight: '700',
  },
  quotasRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quotaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quotaTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    lineHeight: 16,
  },
  subscribeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  subscribeBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  trustCard: {
    padding: 16,
    borderRadius: 16,
    gap: 14,
    marginTop: 8,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trustTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  trustDesc: {
    fontSize: 11,
    marginTop: 1,
  },
});
