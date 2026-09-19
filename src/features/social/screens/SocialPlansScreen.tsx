import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { AppScreen } from '../../../components/AppScreen';
import { AppTopBar } from '../../../components/AppTopBar';
import { apiClient } from '../../../core/api/client';
import { useRazorpay } from '../../../contexts/RazorpayContext';
import { BillingInterval, SocialPlan } from '../types';

const BILLING_INTERVALS: { key: BillingInterval; label: string; discountBadge?: string }[] = [
  { key: 'month', label: 'Monthly' },
  { key: 'quarterly', label: 'Quarterly', discountBadge: '10% OFF' },
  { key: 'six_months', label: '6 Months', discountBadge: '20% OFF' },
  { key: 'year', label: 'Yearly', discountBadge: '30% OFF' },
];

const DEFAULT_PLANS: SocialPlan[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Best for exploring multi-channel publishing & AI automation',
    prices: { month: 0, year: 0 },
    features: {
      publishing: true,
      scheduling: true,
      analytics: true,
      autodm: true,
      approval_workflow: false,
      api: false,
      priority_support: false,
    },
    limits: {
      social_accounts: 3,
      scheduled_queue: 10,
      team_members: 1,
      history_days: 7,
      autodm_accounts: 3,
      autodm_automations: 1,
      autodm_replies_per_month: 50,
      contacts: 100,
    },
  },
  {
    id: 'slite',
    name: 'Starter',
    tagline: 'For growing creators, influencers & brand channels',
    isPopular: true,
    prices: {
      month: 999,
      quarterly: 899.1,
      six_months: 799.2,
      year: 699.3,
    },
    features: {
      publishing: true,
      scheduling: true,
      analytics: true,
      autodm: true,
      approval_workflow: false,
      api: false,
      priority_support: true,
    },
    limits: {
      social_accounts: 10,
      scheduled_queue: 1000000,
      team_members: 1,
      history_days: 90,
      autodm_accounts: 10,
      autodm_automations: 1000000,
      autodm_replies_per_month: 1000000,
      contacts: 1000000,
    },
  },
  {
    id: 'sgrowth',
    name: 'Growth',
    tagline: 'Full agency firepower, unlimited queue & multi-seat team access',
    prices: {
      month: 1999,
      quarterly: 1799.1,
      six_months: 1599.2,
      year: 1399.3,
    },
    features: {
      publishing: true,
      scheduling: true,
      analytics: true,
      autodm: true,
      approval_workflow: true,
      api: true,
      priority_support: true,
    },
    limits: {
      social_accounts: 30,
      scheduled_queue: 1000000,
      team_members: 10,
      history_days: 365,
      autodm_accounts: 30,
      autodm_automations: 1000000,
      autodm_replies_per_month: 1000000,
      contacts: 1000000,
    },
  },
];

export const SocialPlansScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const queryClient = useQueryClient();
  const { openRazorpayCheckout } = useRazorpay();

  // 1. Fetch Entitlements
  const { data: entitlementsData, isLoading: entitlementsLoading } = useQuery({
    queryKey: ['social', 'entitlements'],
    queryFn: async () => {
      try {
        return await apiClient.get<any>('/mobile/v1/social/entitlements');
      } catch {
        return null;
      }
    },
  });

  // 2. Fetch Plans
  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['social', 'plans'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>('/mobile/v1/social/plans');
        return res?.plans || (Array.isArray(res) ? res : null);
      } catch {
        return null;
      }
    },
    staleTime: 15 * 60 * 1000,
  });

  const subscription = entitlementsData?.subscription;
  const currentPlanId = entitlementsData?.plan?.id || subscription?.plan_id || 'free';
  const currentPlanName = entitlementsData?.plan?.name || (currentPlanId === 'sgrowth' ? 'Growth' : currentPlanId === 'slite' ? 'Starter' : 'Free');
  const limits = entitlementsData?.limits || {
    social_accounts: 3,
    scheduled_queue: 10,
    team_members: 1,
    history_days: 7,
    autodm_accounts: 3,
    autodm_automations: 1,
    autodm_replies_per_month: 50,
    contacts: 100,
  };

  const [selectedInterval, setSelectedInterval] = useState<BillingInterval>(
    (subscription?.billing_interval as BillingInterval) || 'quarterly'
  );

  const activePlans: SocialPlan[] = useMemo(() => {
    const rawPlans = Array.isArray(plansData) ? plansData : plansData?.plans;
    if (Array.isArray(rawPlans) && rawPlans.length > 0) {
      return rawPlans.map((p: any) => {
        const matchingDef = DEFAULT_PLANS.find((d) => d.id === p.id);
        return {
          id: p.id,
          name: p.name || matchingDef?.name || p.id,
          tagline: p.tagline || matchingDef?.tagline || '',
          isPopular: p.isPopular ?? matchingDef?.isPopular ?? false,
          prices: {
            month: p.prices?.month ?? matchingDef?.prices?.month ?? 0,
            quarterly: p.prices?.quarterly ?? matchingDef?.prices?.quarterly,
            six_months: p.prices?.six_months ?? matchingDef?.prices?.six_months,
            year: p.prices?.year ?? matchingDef?.prices?.year,
          },
          features: {
            publishing: p.features?.publishing ?? true,
            scheduling: p.features?.scheduling ?? true,
            analytics: p.features?.analytics ?? true,
            autodm: p.features?.autodm ?? true,
            approval_workflow: p.features?.approval_workflow ?? false,
            api: p.features?.api ?? false,
            priority_support: p.features?.priority_support ?? false,
          },
          limits: {
            social_accounts: p.limits?.social_accounts ?? matchingDef?.limits?.social_accounts ?? 3,
            scheduled_queue: p.limits?.scheduled_queue ?? matchingDef?.limits?.scheduled_queue ?? 10,
            team_members: p.limits?.team_members ?? matchingDef?.limits?.team_members ?? 1,
            history_days: p.limits?.history_days ?? matchingDef?.limits?.history_days ?? 7,
            autodm_accounts: p.limits?.autodm_accounts ?? matchingDef?.limits?.autodm_accounts ?? 3,
            autodm_automations: p.limits?.autodm_automations ?? matchingDef?.limits?.autodm_automations ?? 1,
            autodm_replies_per_month: p.limits?.autodm_replies_per_month ?? matchingDef?.limits?.autodm_replies_per_month ?? 50,
            contacts: p.limits?.contacts ?? matchingDef?.limits?.contacts ?? 100,
          },
        };
      });
    }
    return DEFAULT_PLANS;
  }, [plansData]);

  const handleSelectPlan = (plan: SocialPlan) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const intervalObj = BILLING_INTERVALS.find((i) => i.key === selectedInterval);
    const price = selectedInterval === 'month'
      ? plan.prices.month
      : Math.round(plan.prices[selectedInterval] ?? plan.prices.month);

    if (plan.id === currentPlanId) {
      Alert.alert(
        'Current Plan',
        `You are currently active on the ${plan.name} plan (${intervalObj?.label} billing).`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (plan.id === 'free') {
      Alert.alert(
        'Switch to Free Plan?',
        'Would you like to switch to the Free plan? Workspace quotas will adjust accordingly.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm Switch',
            onPress: async () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Plan Updated', 'You are now on the Free Plan.');
              await queryClient.invalidateQueries({ queryKey: ['social', 'entitlements'] });
              await queryClient.invalidateQueries({ queryKey: ['social', 'plans'] });
              await queryClient.invalidateQueries({ queryKey: ['platform-subscription'] });
            },
          },
        ]
      );
      return;
    }

    // Launch global Razorpay checkout for paid plans (Starter, Growth)
    openRazorpayCheckout({
      amount: price,
      currency: 'INR',
      product: 'social',
      planId: plan.id,
      planName: `SocialPilot ${plan.name}`,
      billingInterval: selectedInterval,
      description: `${plan.name} Tier (${intervalObj?.label} Billing)`,
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['social', 'entitlements'] });
        await queryClient.invalidateQueries({ queryKey: ['social', 'plans'] });
        await queryClient.invalidateQueries({ queryKey: ['platform-subscription'] });
        await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      },
    });
  };

  return (
    <AppScreen safeArea={false} backgroundColor={isDark ? '#000000' : '#F8FAFC'}>
      <AppTopBar
        title="SocialPilot Plans"
        subtitle="Multi-Channel Quotas & Pricing"
        showBack={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Active Plan Telemetry Glass Card */}
        <View
          style={[
            styles.activePlanCard,
            {
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              borderColor: isDark ? '#1e293b' : '#e2e8f0',
            },
          ]}
        >
          <View style={styles.activeCardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.activeIconWrap}>
                <Ionicons name="shield-checkmark" size={18} color="#ec4899" />
              </View>
              <View>
                <Text style={[styles.activeCardTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                  Active Plan: {currentPlanName}
                </Text>
                <Text style={[styles.activeCardSub, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  {subscription?.current_period_end
                    ? `Renews ${new Date(subscription.current_period_end).toLocaleDateString()} · ${subscription.billing_interval?.toUpperCase() || 'QUARTERLY'}`
                    : 'Standard Free Workspace Quotas'}
                </Text>
              </View>
            </View>
            <View style={[styles.activeBadgePill, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
              <View style={styles.activeDot} />
              <Text style={styles.activeBadgeText}>ACTIVE</Text>
            </View>
          </View>

          {/* Quota Metrics Row */}
          <View style={styles.quotaPillsRow}>
            <View style={[styles.quotaPill, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
              <Ionicons name="apps" size={12} color="#ec4899" />
              <Text style={[styles.quotaPillText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                {limits.social_accounts} Channels
              </Text>
            </View>

            <View style={[styles.quotaPill, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
              <Ionicons name="calendar" size={12} color="#3b82f6" />
              <Text style={[styles.quotaPillText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                {limits.scheduled_queue >= 1000000 ? 'Unlimited' : `${limits.scheduled_queue}`} Queue
              </Text>
            </View>

            <View style={[styles.quotaPill, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
              <Ionicons name="chatbubbles" size={12} color="#8b5cf6" />
              <Text style={[styles.quotaPillText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                {limits.autodm_automations >= 1000000 ? 'Unlimited' : `${limits.autodm_automations}`} AutoDM
              </Text>
            </View>

            <View style={[styles.quotaPill, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
              <Ionicons name="time" size={12} color="#06b6d4" />
              <Text style={[styles.quotaPillText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                {limits.history_days}d History
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Billing Cycle Switcher */}
        <View style={styles.sectionHeadingWrap}>
          <Text style={[styles.sectionHeading, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
            Choose Your Billing Interval
          </Text>
          <Text style={[styles.sectionSub, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            Save up to 30% with annual & semi-annual commitments
          </Text>
        </View>

        <View style={styles.intervalScrollWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.intervalRow}
          >
            {BILLING_INTERVALS.map((inv) => {
              const isSelected = selectedInterval === inv.key;
              return (
                <Pressable
                  key={inv.key}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedInterval(inv.key);
                  }}
                  style={[
                    styles.intervalChip,
                    {
                      backgroundColor: isSelected
                        ? '#ec4899'
                        : isDark
                          ? '#1e293b'
                          : '#ffffff',
                      borderColor: isSelected ? '#ec4899' : isDark ? '#334155' : '#e2e8f0',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.intervalChipText,
                      { color: isSelected ? '#ffffff' : isDark ? '#cbd5e1' : '#475569' },
                    ]}
                  >
                    {inv.label}
                  </Text>
                  {Boolean(inv.discountBadge) && (
                    <View
                      style={[
                        styles.discountTag,
                        { backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(34, 197, 94, 0.15)' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.discountTagText,
                          { color: isSelected ? '#ffffff' : '#22c55e' },
                        ]}
                      >
                        {inv.discountBadge}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* 3. Stack of Pricing Tier Cards */}
        <View style={styles.plansStack}>
          {activePlans.map((plan) => {
            const isCurrent = currentPlanId === plan.id;
            const price = selectedInterval === 'month'
              ? plan.prices.month
              : (plan.prices[selectedInterval] ?? plan.prices.month);
            const originalPrice = plan.prices.month;
            const hasDiscount = selectedInterval !== 'month' && originalPrice > price;

            return (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isCurrent
                      ? '#22c55e'
                      : plan.isPopular
                        ? '#ec4899'
                        : isDark
                          ? '#1e293b'
                          : '#e2e8f0',
                  },
                ]}
              >
                {/* Header Row */}
                <View style={styles.planCardTop}>
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={[styles.planTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                        {plan.name}
                      </Text>
                      {plan.isPopular && (
                        <View style={styles.popularPill}>
                          <Ionicons name="flash" size={10} color="#ffffff" />
                          <Text style={styles.popularPillText}>MOST POPULAR</Text>
                        </View>
                      )}
                      {isCurrent && (
                        <View style={styles.activePill}>
                          <Ionicons name="checkmark-circle" size={11} color="#ffffff" />
                          <Text style={styles.activePillText}>ACTIVE PLAN</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.planTagline, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                      {plan.tagline}
                    </Text>
                  </View>
                </View>

                {/* Price Display */}
                <View style={styles.priceRow}>
                  {plan.id === 'free' ? (
                    <View style={styles.priceValueWrap}>
                      <Text style={[styles.priceCurrency, { color: isDark ? '#f8fafc' : '#0f172a' }]}>₹</Text>
                      <Text style={[styles.priceLarge, { color: isDark ? '#f8fafc' : '#0f172a' }]}>0</Text>
                      <Text style={[styles.pricePeriod, { color: isDark ? '#94a3b8' : '#64748b' }]}>/ month</Text>
                    </View>
                  ) : (
                    <View>
                      <View style={styles.priceValueWrap}>
                        <Text style={[styles.priceCurrency, { color: isDark ? '#f8fafc' : '#0f172a' }]}>₹</Text>
                        <Text style={[styles.priceLarge, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                          {Math.round(price)}
                        </Text>
                        <Text style={[styles.pricePeriod, { color: isDark ? '#94a3b8' : '#64748b' }]}>/ mo</Text>
                        {hasDiscount && (
                          <Text style={styles.originalPrice}>₹{originalPrice}</Text>
                        )}
                      </View>
                      <Text style={[styles.billingFrequency, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                        {selectedInterval === 'month'
                          ? 'Billed monthly'
                          : `Billed ${BILLING_INTERVALS.find(b => b.key === selectedInterval)?.label.toLowerCase()}`}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Action CTA */}
                {isCurrent ? (
                  <View style={styles.currentActiveBtn}>
                    <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                    <Text style={styles.currentActiveBtnText}>Current Active Tier</Text>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => handleSelectPlan(plan)}
                    style={[
                      styles.actionBtn,
                      { backgroundColor: plan.id === 'sgrowth' ? '#8b5cf6' : '#ec4899' },
                    ]}
                  >
                    <Ionicons name="sparkles" size={15} color="#ffffff" />
                    <Text style={styles.actionBtnText}>
                      {plan.id === 'free' ? 'Select Free Plan' : `Upgrade to ${plan.name}`}
                    </Text>
                  </Pressable>
                )}

                <View style={[styles.divider, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]} />

                {/* Workspace Limits List */}
                <Text style={[styles.specsTitle, { color: isDark ? '#cbd5e1' : '#334155' }]}>
                  INCLUDED CAPACITY & QUOTAS
                </Text>
                <View style={styles.specsList}>
                  <View style={styles.specItem}>
                    <Ionicons name="apps-outline" size={14} color="#ec4899" />
                    <Text style={[styles.specLabel, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                      Connected Channels:
                    </Text>
                    <Text style={[styles.specVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      {plan.limits.social_accounts} Accounts
                    </Text>
                  </View>

                  <View style={styles.specItem}>
                    <Ionicons name="calendar-outline" size={14} color="#3b82f6" />
                    <Text style={[styles.specLabel, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                      Scheduled Queue:
                    </Text>
                    <Text style={[styles.specVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      {plan.limits.scheduled_queue >= 1000000 ? 'Unlimited' : `${plan.limits.scheduled_queue} Posts`}
                    </Text>
                  </View>

                  <View style={styles.specItem}>
                    <Ionicons name="chatbubbles-outline" size={14} color="#8b5cf6" />
                    <Text style={[styles.specLabel, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                      AutoDM Automations:
                    </Text>
                    <Text style={[styles.specVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      {plan.limits.autodm_automations >= 1000000 ? 'Unlimited' : `${plan.limits.autodm_automations} Rule`}
                    </Text>
                  </View>

                  <View style={styles.specItem}>
                    <Ionicons name="send-outline" size={14} color="#10b981" />
                    <Text style={[styles.specLabel, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                      Monthly AutoDM Replies:
                    </Text>
                    <Text style={[styles.specVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      {plan.limits.autodm_replies_per_month >= 1000000 ? 'Unlimited' : `${plan.limits.autodm_replies_per_month} /mo`}
                    </Text>
                  </View>

                  <View style={styles.specItem}>
                    <Ionicons name="people-outline" size={14} color="#f59e0b" />
                    <Text style={[styles.specLabel, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                      Audience Contacts:
                    </Text>
                    <Text style={[styles.specVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      {plan.limits.contacts >= 1000000 ? 'Unlimited' : `${plan.limits.contacts} Contacts`}
                    </Text>
                  </View>

                  <View style={styles.specItem}>
                    <Ionicons name="time-outline" size={14} color="#06b6d4" />
                    <Text style={[styles.specLabel, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                      Analytics History:
                    </Text>
                    <Text style={[styles.specVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      {plan.limits.history_days} Days
                    </Text>
                  </View>

                  <View style={styles.specItem}>
                    <Ionicons name="person-circle-outline" size={14} color="#ec4899" />
                    <Text style={[styles.specLabel, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                      Team Seats:
                    </Text>
                    <Text style={[styles.specVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      {plan.limits.team_members} Member{plan.limits.team_members > 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]} />

                {/* Features Checklist */}
                <Text style={[styles.specsTitle, { color: isDark ? '#cbd5e1' : '#334155' }]}>
                  FEATURES & WORKFLOWS
                </Text>
                <View style={styles.featuresList}>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={15} color="#22c55e" />
                    <Text style={[styles.featureText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                      Omnichannel Publishing (IG, YT, X, FB, LinkedIn, Pinterest)
                    </Text>
                  </View>

                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={15} color="#22c55e" />
                    <Text style={[styles.featureText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                      Reels & Shorts Automated Scheduling Engine
                    </Text>
                  </View>

                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={15} color="#22c55e" />
                    <Text style={[styles.featureText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                      Keyword-Triggered AutoDM & Lead Capture
                    </Text>
                  </View>

                  <View style={styles.featureItem}>
                    <Ionicons
                      name={plan.features.approval_workflow ? 'checkmark-circle' : 'close-circle'}
                      size={15}
                      color={plan.features.approval_workflow ? '#22c55e' : isDark ? '#64748b' : '#94a3b8'}
                    />
                    <Text
                      style={[
                        styles.featureText,
                        {
                          color: plan.features.approval_workflow
                            ? isDark ? '#cbd5e1' : '#475569'
                            : isDark ? '#64748b' : '#94a3b8',
                        },
                      ]}
                    >
                      Team Approval Workflows & Review Drafts
                    </Text>
                  </View>

                  <View style={styles.featureItem}>
                    <Ionicons
                      name={plan.features.api ? 'checkmark-circle' : 'close-circle'}
                      size={15}
                      color={plan.features.api ? '#22c55e' : isDark ? '#64748b' : '#94a3b8'}
                    />
                    <Text
                      style={[
                        styles.featureText,
                        {
                          color: plan.features.api
                            ? isDark ? '#cbd5e1' : '#475569'
                            : isDark ? '#64748b' : '#94a3b8',
                        },
                      ]}
                    >
                      REST API & Webhook Developer Integration
                    </Text>
                  </View>

                  <View style={styles.featureItem}>
                    <Ionicons
                      name={plan.features.priority_support ? 'checkmark-circle' : 'checkmark-circle-outline'}
                      size={15}
                      color={plan.features.priority_support ? '#22c55e' : '#3b82f6'}
                    />
                    <Text style={[styles.featureText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                      {plan.features.priority_support ? 'Priority 24/7 Support with SLA' : 'Standard Community Support'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* 4. FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={[styles.faqHeaderTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
            Frequently Asked Questions
          </Text>

          <View style={[styles.faqCard, { backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
            <Text style={[styles.faqQuestion, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
              Can I upgrade or change billing cycles anytime?
            </Text>
            <Text style={[styles.faqAnswer, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              Yes. You can switch between Monthly, Quarterly, and Annual plans at any moment. Your new quotas will be activated instantly on your account.
            </Text>
          </View>

          <View style={[styles.faqCard, { backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
            <Text style={[styles.faqQuestion, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
              What happens if I reach my queue limit on Free?
            </Text>
            <Text style={[styles.faqAnswer, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              On the Free plan, you can have up to 10 publications in your scheduled broadcast queue. Once a post is sent, you can schedule another, or upgrade to Starter/Growth for unlimited queue slots.
            </Text>
          </View>

          <View style={[styles.faqCard, { backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
            <Text style={[styles.faqQuestion, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
              Are all social media channels supported?
            </Text>
            <Text style={[styles.faqAnswer, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              SocialPilot connects with Instagram, Facebook, YouTube, LinkedIn, X (Twitter), and Pinterest, with cross-posting supported across all plans.
            </Text>
          </View>
        </View>
      </ScrollView>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 48,
    gap: 18,
  },
  activePlanCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  activeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  activeCardSub: {
    fontSize: 11,
    marginTop: 2,
  },
  activeBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#22c55e',
  },
  quotaPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  quotaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quotaPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionHeadingWrap: {
    gap: 3,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '800',
  },
  sectionSub: {
    fontSize: 12,
  },
  intervalScrollWrap: {
    marginVertical: -4,
  },
  intervalRow: {
    gap: 8,
    paddingVertical: 2,
  },
  intervalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  intervalChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  discountTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountTagText: {
    fontSize: 9,
    fontWeight: '800',
  },
  plansStack: {
    gap: 16,
  },
  planCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 18,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  planCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  popularPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ec4899',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  popularPillText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activePillText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  planTagline: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  priceRow: {
    paddingVertical: 2,
  },
  priceValueWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  priceCurrency: {
    fontSize: 20,
    fontWeight: '800',
  },
  priceLarge: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  pricePeriod: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  originalPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  billingFrequency: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  currentActiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  currentActiveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16a34a',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  divider: {
    height: 1,
  },
  specsTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  specsList: {
    gap: 8,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  specLabel: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  specVal: {
    fontSize: 12,
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
  },
  faqSection: {
    gap: 12,
    marginTop: 8,
  },
  faqHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  faqCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: '700',
  },
  faqAnswer: {
    fontSize: 12,
    lineHeight: 18,
  },
});
