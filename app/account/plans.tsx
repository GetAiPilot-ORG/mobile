import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { colors } from '../../src/theme/colors';
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
    badgeColor: '#00F5D4',
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
  const { planLabel, isActive } = usePlatformSubscription();
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
    <AppScreen safeArea={false} backgroundColor="#000000">
      <AppTopBar title="Plans & Quotas" subtitle="Enterprise Subscriptions & Scaling" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Active Status Glass Banner */}
        <View style={styles.statusBanner}>
          <View style={styles.statusGlow} />
          <View style={styles.statusHeader}>
            <View style={styles.activePill}>
              <View style={styles.activeDot} />
              <Text style={styles.activePillText}>ACTIVE SUBSCRIPTION</Text>
            </View>
            <Text style={styles.planStatusDate}>Renews 1st of next month</Text>
          </View>
          <Text style={styles.statusPlanName}>{planLabel || 'GAP Pro Max (Active)'}</Text>
          <Text style={styles.statusPlanDesc}>
            All 5 automation engines & 10 growth utilities operating at unrestricted speed.
          </Text>
        </View>

        {/* Billing Cycle Toggle */}
        <View style={styles.toggleContainer}>
          <Pressable
            style={[styles.toggleBtn, billingCycle === 'annual' && styles.toggleBtnActive]}
            onPress={() => handleCycleChange('annual')}
          >
            <Text style={[styles.toggleBtnText, billingCycle === 'annual' && styles.toggleBtnTextActive]}>
              Annual (Save 20%)
            </Text>
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>SAVE 20%</Text>
            </View>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, billingCycle === 'monthly' && styles.toggleBtnActive]}
            onPress={() => handleCycleChange('monthly')}
          >
            <Text style={[styles.toggleBtnText, billingCycle === 'monthly' && styles.toggleBtnTextActive]}>
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
                  isCurrent && styles.tierCardActive,
                ]}
                onPress={() => handleSelectTier(tier.id)}
              >
                {/* Header */}
                <View style={styles.tierTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tierTitle}>{tier.name}</Text>
                    <Text style={styles.tierSubtitle}>{tier.subtitle}</Text>
                  </View>
                  <View style={[styles.badgePill, { backgroundColor: `${tier.badgeColor}22`, borderColor: `${tier.badgeColor}55` }]}>
                    <Text style={[styles.badgeText, { color: tier.badgeColor }]}>{tier.badge}</Text>
                  </View>
                </View>

                {/* Price Display */}
                <View style={styles.priceRow}>
                  {price !== null ? (
                    <>
                      <Text style={styles.priceCurrency}>₹</Text>
                      <Text style={styles.priceValue}>{price.toLocaleString()}</Text>
                      <Text style={styles.pricePeriod}>/ month</Text>
                    </>
                  ) : (
                    <Text style={styles.customPriceText}>Custom SLA Quote</Text>
                  )}
                </View>

                {/* Quota Strip */}
                <View style={styles.quotaStrip}>
                  {tier.quotas.map((q, idx) => (
                    <View key={idx} style={styles.quotaBox}>
                      <Text style={styles.quotaVal}>{q.value}</Text>
                      <Text style={styles.quotaLbl}>{q.label}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.tierDivider} />

                {/* Features List */}
                <View style={styles.featuresList}>
                  {tier.features.map((feat, fIdx) => (
                    <View key={fIdx} style={styles.featureItem}>
                      <View style={[styles.checkCircle, feat.highlight && styles.checkCircleHighlight]}>
                        <Text style={[styles.checkIcon, feat.highlight && styles.checkIconHighlight]}>✓</Text>
                      </View>
                      <Text style={[styles.featureText, feat.highlight && styles.featureTextHighlight]}>
                        {feat.text}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Action CTA */}
                <Pressable
                  style={[
                    styles.upgradeBtn,
                    isCurrent ? styles.upgradeBtnPrimary : styles.upgradeBtnOutline,
                  ]}
                  onPress={() => handleUpgrade(tier.name)}
                >
                  <Text style={[styles.upgradeBtnText, !isCurrent && styles.upgradeBtnTextOutline]}>
                    {tier.id === 'custom' ? 'Talk to Enterprise Team →' : `Upgrade to ${tier.name} →`}
                  </Text>
                </Pressable>
              </Pressable>
            );
          })}
        </View>

        {/* Security & Guarantee Note */}
        <View style={styles.guaranteeBox}>
          <Text style={styles.guaranteeIcon}>🛡️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.guaranteeTitle}>Bank-Grade 256-Bit SSL Encryption</Text>
            <Text style={styles.guaranteeSub}>
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
    backgroundColor: '#071612',
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#10B98144',
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
    backgroundColor: '#10B98118',
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
    backgroundColor: '#10B98122',
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
    color: '#9CA3AF',
  },
  statusPlanName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  statusPlanDesc: {
    fontSize: 13,
    color: '#D1D5DB',
    marginTop: 6,
    lineHeight: 18,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#12151A',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1F242F',
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
  toggleBtnActive: {
    backgroundColor: '#1F2937',
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
    backgroundColor: '#0D1117',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1F242F',
  },
  tierCardActive: {
    borderColor: '#10B98188',
    backgroundColor: '#0F161A',
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
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  tierSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
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
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  pricePeriod: {
    fontSize: 13,
    color: '#9CA3AF',
    marginLeft: 6,
  },
  customPriceText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#A78BFA',
  },
  quotaStrip: {
    flexDirection: 'row',
    backgroundColor: '#161B22',
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
    color: '#FFFFFF',
  },
  quotaLbl: {
    fontSize: 9.5,
    color: '#9CA3AF',
    marginTop: 2,
  },
  tierDivider: {
    height: 1,
    backgroundColor: '#21262D',
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
    backgroundColor: '#1F242F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleHighlight: {
    backgroundColor: '#10B98125',
  },
  checkIcon: {
    fontSize: 11,
    fontWeight: '900',
    color: '#9CA3AF',
  },
  checkIconHighlight: {
    color: '#10B981',
  },
  featureText: {
    fontSize: 13,
    color: '#9CA3AF',
    flex: 1,
    lineHeight: 18,
  },
  featureTextHighlight: {
    color: '#F3F4F6',
    fontWeight: '600',
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
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#374151',
  },
  upgradeBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
  },
  upgradeBtnTextOutline: {
    color: '#FFFFFF',
  },
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#0D1117',
    borderRadius: 18,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#1F242F',
  },
  guaranteeIcon: {
    fontSize: 26,
  },
  guaranteeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  guaranteeSub: {
    fontSize: 11.5,
    color: '#9CA3AF',
    marginTop: 3,
    lineHeight: 16,
  },
});
