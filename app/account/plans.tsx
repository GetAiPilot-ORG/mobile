import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { colors } from '../../src/theme/colors';
import { usePlatformSubscription } from '../../src/hooks/usePlatformSubscription';

const TIERS = [
  {
    id: 'starter',
    name: 'GAP Core (Starter)',
    price: '₹2,499 / mo',
    desc: 'Essential automation for single channels and small businesses.',
    features: ['1 Active Telegram Bot', 'WhatsApp Cloud API Gateway', '500 Free Voice Minutes', 'Smart CRM (Up to 100 Leads)', 'All 10 Free Tools Access'],
    badge: 'Popular',
    color: '#003C33',
  },
  {
    id: 'pro',
    name: 'GAP Pro Max (All-In-One)',
    price: '₹5,999 / mo',
    desc: 'Full enterprise capabilities with multi-platform synchronization.',
    features: ['Unlimited Telegram Forwarders', 'WhatsApp Mass Broadcast Campaigns', 'Autonomous AI Telecaller (2,500 Min)', 'Omnichannel Social Pilot Sync', 'Custom Domain Bio & Landing Pages', 'Dedicated Priority SLA Support'],
    badge: 'Enterprise',
    color: '#16B882',
  },
];

export default function PlansPricingScreen() {
  const { planLabel, isActive, isTrial } = usePlatformSubscription();

  const handleInquiry = (tierName: string) => {
    Alert.alert(
      'Plan Upgrade',
      `You selected ${tierName}. Contacting your dedicated GetAIPilot account representative for activation.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed to Connect',
          onPress: () => {
            Alert.alert('Request Sent', 'Our billing operations team will reach out to activate your subscription.');
          },
        },
      ]
    );
  };

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar title="Plans & Subscriptions" subtitle="Tier Features & Resource Quotas" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Current Plan Banner */}
        <View style={styles.currentPlanCard}>
          <Text style={styles.currentPlanLabel}>CURRENT SUBSCRIPTION</Text>
          <Text style={styles.currentPlanName}>{planLabel || 'GAP Core (Active)'}</Text>
          <Text style={styles.currentPlanSub}>
            {isActive ? 'All features and automation pipelines are active.' : 'Free trial account.'}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Available Tiers</Text>

        <View style={styles.tiersList}>
          {TIERS.map((tier) => (
            <View key={tier.id} style={styles.tierCard}>
              <View style={styles.tierTop}>
                <View>
                  <Text style={styles.tierName}>{tier.name}</Text>
                  <Text style={styles.tierPrice}>{tier.price}</Text>
                </View>
                <View style={[styles.tierBadge, { backgroundColor: tier.color + '20' }]}>
                  <Text style={[styles.tierBadgeText, { color: tier.color }]}>{tier.badge}</Text>
                </View>
              </View>

              <Text style={styles.tierDesc}>{tier.desc}</Text>

              <View style={styles.featureDivider} />

              <View style={styles.featuresBox}>
                {tier.features.map((f, i) => (
                  <View key={i} style={styles.featureItem}>
                    <Text style={styles.featureCheck}>✓</Text>
                    <Text style={styles.featureLabel}>{f}</Text>
                  </View>
                ))}
              </View>

              <Pressable
                style={[styles.selectBtn, { backgroundColor: tier.color }]}
                onPress={() => handleInquiry(tier.name)}
              >
                <Text style={styles.selectBtnText}>Select {tier.name} →</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  currentPlanCard: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
  },
  currentPlanLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.8,
  },
  currentPlanName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  currentPlanSub: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.foreground,
    marginBottom: 12,
  },
  tiersList: {
    gap: 16,
  },
  tierCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tierTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tierName: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.foreground,
  },
  tierPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tierBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  tierDesc: {
    fontSize: 13,
    color: colors.mutedForeground,
    lineHeight: 18,
    marginBottom: 14,
  },
  featureDivider: {
    height: 1,
    backgroundColor: colors.muted,
    marginBottom: 14,
  },
  featuresBox: {
    gap: 8,
    marginBottom: 18,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureCheck: {
    color: '#16B882',
    fontWeight: '900',
    fontSize: 13,
  },
  featureLabel: {
    fontSize: 13,
    color: colors.foreground,
  },
  selectBtn: {
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  selectBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
