import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  useColorScheme,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { usePlatformSubscription } from '../../src/hooks/usePlatformSubscription';

const TIERS = [
  {
    id: 'starter',
    name: 'GAP Core',
    subtitle: 'Essential AI Automations for Creators & SMBs',
    monthlyPrice: 2499,
    annualPrice: 1999,
    badge: 'Popular',
    badgeColor: '#10B981',
    features: [
      { text: '1 Active Telegram Auto-Forwarder', highlight: true },
      { text: 'WhatsApp Meta Cloud API Gateway (5k msgs/mo)', highlight: false },
      { text: '500 Free AI Telecalling Voice Minutes', highlight: false },
      { text: 'Smart CRM (Up to 250 Active Leads)', highlight: false },
      { text: '10 Growth Automation Tools Included', highlight: true },
      { text: 'Standard 24h Ticket Support', highlight: false },
    ],
    quotas: [
      { label: 'Voice Minutes', value: '500 min/mo' },
      { label: 'WhatsApp Msgs', value: '5,000 /mo' },
      { label: 'CRM Leads', value: '250 Max' },
    ],
  },
  {
    id: 'pro',
    name: 'GAP Pro Max',
    subtitle: 'Full Enterprise Scale with Multi-Engine Sync',
    monthlyPrice: 5999,
    annualPrice: 4799,
    badge: 'Enterprise Choice',
    badgeColor: '#00D2B4',
    features: [
      { text: 'Unlimited Telegram Channel Forwarders & Bots', highlight: true },
      { text: 'WhatsApp Mass Broadcasts & Webhook Triggers', highlight: true },
      { text: '2,500 Autonomous AI Telecaller Voice Minutes', highlight: true },
      { text: 'Omnichannel Social Pilot Sync (6 Networks)', highlight: true },
      { text: 'Smart CRM Unlimited Leads & Pipelines', highlight: false },
      { text: 'Custom Bio & High-Conversion Landing Pages', highlight: false },
      { text: 'Dedicated 1-on-1 WhatsApp Priority Support', highlight: true },
    ],
    quotas: [
      { label: 'Voice Minutes', value: '2,500 min/mo' },
      { label: 'WhatsApp Msgs', value: 'Unlimited' },
      { label: 'Forwarding Bots', value: 'Unlimited' },
    ],
  },
  {
    id: 'custom',
    name: 'Custom Enterprise',
    subtitle: 'Dedicated Cloud Infrastructure & Custom AI LLM Finetuning',
    monthlyPrice: null,
    annualPrice: null,
    badge: 'Dedicated SLA',
    badgeColor: '#8B5CF6',
    features: [
      { text: 'Dedicated Supabase & Redis Infrastructure', highlight: true },
      { text: 'Custom Fine-Tuned Voice Models & Prompt Engineering', highlight: true },
      { text: 'Unlimited Multi-Tenant Agent Accounts', highlight: true },
      { text: 'Direct CPaaS Carrier Trunking (India/Global)', highlight: false },
      { text: 'Custom Security & SSO Auth Integration', highlight: false },
      { text: '99.99% Uptime SLA Guarantee', highlight: true },
    ],
    quotas: [
      { label: 'Voice Minutes', value: 'Custom Quota' },
      { label: 'Dedicated Account', value: 'Assigned Eng.' },
      { label: 'SLA Support', value: '< 15 min' },
    ],
  },
];

export default function PlansPricingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { planLabel } = usePlatformSubscription();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [selectedTier, setSelectedTier] = useState<string>('pro');

  const handleCycleChange = (cycle: 'monthly' | 'annual') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBillingCycle(cycle);
  };

  const handleSelectTier = (tierId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedTier(tierId);
  };

  const handleUpgrade = (tierName: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Plan Upgrade Request',
      `You selected ${tierName} (${billingCycle === 'annual' ? 'Billed Annually' : 'Billed Monthly'}). A GetAIPilot billing specialist will activate your enterprise quota within minutes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed to Activate',
          onPress: () => {
            Alert.alert('Request Received', 'Your upgrade request has been queued. Verification link sent to your email.');
          },
        },
      ]
    );
  };

  return (
    <AppScreen safeArea={false} backgroundColor={isDark ? '#000000' : '#F8FAFC'}>
      <AppTopBar title="Plans & Quotas" subtitle="Enterprise Subscriptions & Scaling" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Active Status Glass Banner */}
        <View
          style={[
            styles.statusBanner,
            {
              backgroundColor: isDark ? '#071612' : '#ECFDF5',
              borderColor: isDark ? '#10B98144' : '#A7F3D0',
            },
          ]}
        >
          <View
            style={[
              styles.statusGlow,
              { backgroundColor: isDark ? '#10B98118' : 'rgba(16, 185, 129, 0.08)' },
            ]}
          />
          <View style={styles.statusHeader}>
            <View
              style={[
                styles.activePill,
                { backgroundColor: isDark ? '#10B98122' : '#D1FAE5' },
              ]}
            >
              <View style={styles.activeDot} />
              <Text style={styles.activePillText}>ACTIVE SUBSCRIPTION</Text>
            </View>
            <Text style={[styles.planStatusDate, { color: isDark ? '#9CA3AF' : '#059669' }]}>
              Renews 1st of next month
            </Text>
          </View>
          <Text style={[styles.statusPlanName, { color: isDark ? '#FFFFFF' : '#065F46' }]}>
            {planLabel || 'GAP Pro Max (Active)'}
          </Text>
          <Text style={[styles.statusPlanDesc, { color: isDark ? '#D1D5DB' : '#047857' }]}>
            All 5 automation engines & 10 growth utilities operating at unrestricted speed.
          </Text>
        </View>

        {/* Billing Cycle Toggle */}
        <View
          style={[
            styles.toggleContainer,
            {
              backgroundColor: isDark ? '#12151A' : '#E2E8F0',
              borderColor: isDark ? '#1F242F' : '#CBD5E1',
            },
          ]}
        >
          <Pressable
            style={[
              styles.toggleBtn,
              billingCycle === 'annual' && {
                backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isDark ? 0 : 0.08,
                shadowRadius: 2,
                elevation: 1,
              },
            ]}
            onPress={() => handleCycleChange('annual')}
          >
            <Text
              style={[
                styles.toggleBtnText,
                { color: isDark ? '#9CA3AF' : '#64748B' },
                billingCycle === 'annual' && {
                  color: isDark ? '#FFFFFF' : '#0F172A',
                  fontWeight: '700',
                },
              ]}
            >
              Annual (Save 20%)
            </Text>
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>SAVE 20%</Text>
            </View>
          </Pressable>
          <Pressable
            style={[
              styles.toggleBtn,
              billingCycle === 'monthly' && {
                backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isDark ? 0 : 0.08,
                shadowRadius: 2,
                elevation: 1,
              },
            ]}
            onPress={() => handleCycleChange('monthly')}
          >
            <Text
              style={[
                styles.toggleBtnText,
                { color: isDark ? '#9CA3AF' : '#64748B' },
                billingCycle === 'monthly' && {
                  color: isDark ? '#FFFFFF' : '#0F172A',
                  fontWeight: '700',
                },
              ]}
            >
              Monthly
            </Text>
          </Pressable>
        </View>

        {/* Tier Cards */}
        <View style={styles.tiersList}>
          {TIERS.map((tier) => {
            const isCurrent = selectedTier === tier.id;
            const price = billingCycle === 'annual' ? tier.annualPrice : tier.monthlyPrice;

            return (
              <Pressable
                key={tier.id}
                style={[
                  styles.tierCard,
                  {
                    backgroundColor: isDark
                      ? isCurrent
                        ? '#0F161A'
                        : '#0D1117'
                      : isCurrent
                      ? '#F0FDF4'
                      : '#FFFFFF',
                    borderColor: isCurrent
                      ? isDark
                        ? '#10B98188'
                        : '#10B981'
                      : isDark
                      ? '#1F242F'
                      : '#E2E8F0',
                  },
                ]}
                onPress={() => handleSelectTier(tier.id)}
              >
                {/* Header */}
                <View style={styles.tierTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tierTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                      {tier.name}
                    </Text>
                    <Text style={[styles.tierSubtitle, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                      {tier.subtitle}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.badgePill,
                      {
                        backgroundColor: `${tier.badgeColor}22`,
                        borderColor: `${tier.badgeColor}55`,
                      },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: tier.badgeColor }]}>{tier.badge}</Text>
                  </View>
                </View>

                {/* Price Display */}
                <View style={styles.priceRow}>
                  {price !== null ? (
                    <>
                      <Text style={styles.priceCurrency}>₹</Text>
                      <Text style={[styles.priceValue, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                        {price.toLocaleString()}
                      </Text>
                      <Text style={[styles.pricePeriod, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                        / month
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.customPriceText}>Custom SLA Quote</Text>
                  )}
                </View>

                {/* Quota Strip */}
                <View
                  style={[
                    styles.quotaStrip,
                    {
                      backgroundColor: isDark ? '#161B22' : '#F8FAFC',
                      borderColor: isDark ? '#21262D' : '#E2E8F0',
                      borderWidth: 1,
                    },
                  ]}
                >
                  {tier.quotas.map((q, idx) => (
                    <View key={idx} style={styles.quotaBox}>
                      <Text style={[styles.quotaVal, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                        {q.value}
                      </Text>
                      <Text style={[styles.quotaLbl, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                        {q.label}
                      </Text>
                    </View>
                  ))}
                </View>

                <View
                  style={[
                    styles.tierDivider,
                    { backgroundColor: isDark ? '#21262D' : '#E2E8F0' },
                  ]}
                />

                {/* Features List */}
                <View style={styles.featuresList}>
                  {tier.features.map((feat, fIdx) => (
                    <View key={fIdx} style={styles.featureItem}>
                      <View
                        style={[
                          styles.checkCircle,
                          {
                            backgroundColor: feat.highlight
                              ? isDark
                                ? '#10B98125'
                                : '#D1FAE5'
                              : isDark
                              ? '#1F242F'
                              : '#F1F5F9',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.checkIcon,
                            { color: feat.highlight ? '#10B981' : isDark ? '#9CA3AF' : '#64748B' },
                          ]}
                        >
                          ✓
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.featureText,
                          {
                            color: feat.highlight
                              ? isDark
                                ? '#F3F4F6'
                                : '#0F172A'
                              : isDark
                              ? '#9CA3AF'
                              : '#64748B',
                            fontWeight: feat.highlight ? '600' : '400',
                          },
                        ]}
                      >
                        {feat.text}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Action CTA */}
                <Pressable
                  style={[
                    styles.upgradeBtn,
                    isCurrent
                      ? styles.upgradeBtnPrimary
                      : [
                          styles.upgradeBtnOutline,
                          {
                            borderColor: isDark ? '#374151' : '#CBD5E1',
                            backgroundColor: isDark ? 'transparent' : '#FFFFFF',
                          },
                        ],
                  ]}
                  onPress={() => handleUpgrade(tier.name)}
                >
                  <Text
                    style={[
                      styles.upgradeBtnText,
                      !isCurrent && { color: isDark ? '#FFFFFF' : '#0F172A' },
                    ]}
                  >
                    {tier.id === 'custom' ? 'Talk to Enterprise Team →' : `Upgrade to ${tier.name} →`}
                  </Text>
                </Pressable>
              </Pressable>
            );
          })}
        </View>

        {/* Security & Guarantee Note */}
        <View
          style={[
            styles.guaranteeBox,
            {
              backgroundColor: isDark ? '#0D1117' : '#FFFFFF',
              borderColor: isDark ? '#1F242F' : '#E2E8F0',
            },
          ]}
        >
          <Text style={styles.guaranteeIcon}>🛡️</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.guaranteeTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              Bank-Grade 256-Bit SSL Encryption
            </Text>
            <Text style={[styles.guaranteeSub, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
              Cancel or adjust quotas anytime. Enterprise invoices include GST compliance and instant billing receipt downloads.
            </Text>
          </View>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  statusBanner: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  statusGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  activePillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.8,
  },
  planStatusDate: {
    fontSize: 11,
  },
  statusPlanName: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  statusPlanDesc: {
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 11,
    gap: 6,
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveBadge: {
    backgroundColor: '#10B98122',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  saveBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#10B981',
  },
  tiersList: {
    gap: 16,
  },
  tierCard: {
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
  },
  tierTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  tierTitle: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  tierSubtitle: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 14,
    marginBottom: 14,
  },
  priceCurrency: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
    marginRight: 2,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  pricePeriod: {
    fontSize: 13,
    marginLeft: 6,
  },
  customPriceText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#8B5CF6',
  },
  quotaStrip: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  quotaBox: {
    flex: 1,
    alignItems: 'center',
  },
  quotaVal: {
    fontSize: 12,
    fontWeight: '800',
  },
  quotaLbl: {
    fontSize: 9.5,
    marginTop: 2,
  },
  tierDivider: {
    height: 1,
    marginBottom: 16,
  },
  featuresList: {
    gap: 10,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    fontSize: 11,
    fontWeight: '900',
  },
  featureText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  upgradeBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeBtnPrimary: {
    backgroundColor: '#10B981',
  },
  upgradeBtnOutline: {
    borderWidth: 1,
  },
  upgradeBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
  },
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 18,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
  },
  guaranteeIcon: {
    fontSize: 26,
  },
  guaranteeTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  guaranteeSub: {
    fontSize: 11.5,
    marginTop: 3,
    lineHeight: 16,
  },
});
