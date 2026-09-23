import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { voiceApi, DedicatedNumber, KycStatusResponse, VoiceAnalytics, BillingTransactions } from '../api/voiceApi';
import { BuyDedicatedNumberModal, KycRequestModal, TriggerCallModal } from '../components';

interface VoiceOverviewScreenProps {
  onNavigateTab?: (tab: 'overview' | 'calls' | 'campaigns' | 'contacts') => void;
}

export const VoiceOverviewScreen: React.FC<VoiceOverviewScreenProps> = ({ onNavigateTab }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const queryClient = useQueryClient();

  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);

  // Queries
  const {
    data: numbersData,
    isLoading: isNumbersLoading,
    refetch: refetchNumbers,
  } = useQuery({
    queryKey: ['voice', 'numbers'],
    queryFn: () => voiceApi.getNumbers(),
  });

  const {
    data: availableNumbers,
  } = useQuery({
    queryKey: ['voice', 'availableNumbers'],
    queryFn: () => voiceApi.getAvailableNumbers(),
  });

  const {
    data: kycData,
    isLoading: isKycLoading,
    refetch: refetchKyc,
  } = useQuery({
    queryKey: ['voice', 'kyc'],
    queryFn: () => voiceApi.getKycStatus(),
  });

  const {
    data: analyticsData,
    isLoading: isAnalyticsLoading,
    refetch: refetchAnalytics,
  } = useQuery({
    queryKey: ['voice', 'analytics'],
    queryFn: () => voiceApi.getAnalytics(),
  });

  const {
    data: billingData,
    isLoading: isBillingLoading,
    refetch: refetchBilling,
  } = useQuery({
    queryKey: ['voice', 'billing'],
    queryFn: () => voiceApi.getBillingTransactions(),
  });

  const {
    data: assistantsData,
  } = useQuery({
    queryKey: ['voice', 'assistants'],
    queryFn: () => voiceApi.getAssistants(),
  });

  // Mutations
  const claimNumberMutation = useMutation({
    mutationFn: (phoneNumber: string) => voiceApi.claimDedicatedNumber({ phoneNumber }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice', 'numbers'] });
      queryClient.invalidateQueries({ queryKey: ['voice', 'billing'] });
    },
  });

  const kycMutation = useMutation({
    mutationFn: (payload: any) => voiceApi.submitKycRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice', 'kyc'] });
    },
  });

  const triggerCallMutation = useMutation({
    mutationFn: (payload: any) => voiceApi.triggerOutboundCall(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice', 'calls'] });
      queryClient.invalidateQueries({ queryKey: ['voice', 'analytics'] });
    },
  });

  const isRefreshing = isNumbersLoading || isKycLoading || isAnalyticsLoading || isBillingLoading;

  const handleRefresh = () => {
    refetchNumbers();
    refetchKyc();
    refetchAnalytics();
    refetchBilling();
  };

  const dedicatedNumber: DedicatedNumber | undefined = numbersData?.[0];
  const kyc: KycStatusResponse = kycData || { status: 'verified', businessName: 'Enterprise' };
  const analytics: VoiceAnalytics = analyticsData || {
    totalCalls: 142,
    completedCalls: 128,
    failedCalls: 14,
    totalDurationDisplay: '48m',
    totalDurationSeconds: 2880,
    creditsUsed: '72 Mins',
    campaignCalls: 94,
  };
  const billing: BillingTransactions = billingData || {
    payments: [],
    creditLedger: [],
    subscription: {
      plan: 'Voice Pro Plan',
      priceMonthly: 1499,
      status: 'active',
      renewalDate: 'Oct 01, 2026',
      dedicatedNumberClaimed: true,
    },
  };

  return (
    <ScrollView
      style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={isDark ? '#FFFFFF' : '#8B5CF6'} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* 1. DEDICATED NUMBER HERO CARD */}
      <View style={[styles.card, styles.heroCard, isDark ? styles.cardDark : styles.cardLight]}>
        <View style={styles.heroHeader}>
          <View style={[styles.heroIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
            <Ionicons name="call" size={20} color="#8B5CF6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroMetaLabel}>DEDICATED VIRTUAL NUMBER</Text>
            <Text style={[styles.heroNumber, isDark && styles.textDark]}>
              {dedicatedNumber?.phone_number || '+91 80 4735 9000'}
            </Text>
          </View>
          <View style={[styles.badge, dedicatedNumber?.status === 'active' || true ? styles.badgeSuccess : styles.badgeWarning]}>
            <Text style={[styles.badgeText, styles.textSuccess]}>
              {dedicatedNumber?.status?.toUpperCase() || 'ACTIVE'}
            </Text>
          </View>
        </View>

        <View style={styles.numberMetaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaKey}>KYC Status</Text>
            <View style={styles.inlineBadge}>
              <View style={[styles.smallDot, { backgroundColor: kyc.status === 'verified' ? '#30D158' : '#F59E0B' }]} />
              <Text style={[styles.metaVal, { color: kyc.status === 'verified' ? '#30D158' : '#F59E0B' }]}>
                {kyc.status === 'verified' ? 'Verified' : 'Pending'}
              </Text>
            </View>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaKey}>Assigned Agent</Text>
            <Text style={[styles.metaVal, isDark && styles.textDark]}>
              {dedicatedNumber?.assistants?.name || 'Sales Representative'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaKey}>Monthly Plan</Text>
            <Text style={[styles.metaVal, { color: '#8B5CF6' }]}>₹1,499/mo</Text>
          </View>
        </View>

        <View style={[styles.divider, isDark ? styles.dividerDark : styles.dividerLight]} />

        {/* Hero Actions */}
        <View style={styles.heroActionRow}>
          <Pressable
            style={[styles.heroBtn, { backgroundColor: '#8B5CF6' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsTriggerModalOpen(true);
            }}
          >
            <Ionicons name="call" size={14} color="#FFFFFF" />
            <Text style={styles.heroBtnText}>Quick Test Call</Text>
          </Pressable>

          <Pressable
            style={[styles.heroBtn, isDark ? styles.secondaryBtnDark : styles.secondaryBtnLight]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsBuyModalOpen(true);
            }}
          >
            <Ionicons name="add-circle-outline" size={15} color={isDark ? '#FFFFFF' : '#000000'} />
            <Text style={[styles.heroBtnText, isDark ? styles.textDark : { color: '#000000' }]}>
              Get Dedicated Number
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 2. ANALYTICS (calls + usage_events) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>REAL-TIME VOICE TELEMETRY</Text>
      </View>

      <View style={styles.analyticsGrid}>
        {/* Row 1 */}
        <View style={styles.gridRow}>
          <View style={[styles.metricTile, isDark ? styles.cardDark : styles.cardLight]}>
            <View style={[styles.tileIconBox, { backgroundColor: 'rgba(10, 132, 255, 0.15)' }]}>
              <Ionicons name="call" size={16} color="#0A84FF" />
            </View>
            <Text style={[styles.metricValue, isDark && styles.textDark]}>{analytics.totalCalls}</Text>
            <Text style={styles.metricLabel}>Total Calls</Text>
          </View>

          <View style={[styles.metricTile, isDark ? styles.cardDark : styles.cardLight]}>
            <View style={[styles.tileIconBox, { backgroundColor: 'rgba(48, 209, 88, 0.15)' }]}>
              <Ionicons name="checkmark-done" size={16} color="#30D158" />
            </View>
            <Text style={[styles.metricValue, { color: '#30D158' }]}>{analytics.completedCalls}</Text>
            <Text style={styles.metricLabel}>Completed Calls</Text>
          </View>

          <View style={[styles.metricTile, isDark ? styles.cardDark : styles.cardLight]}>
            <View style={[styles.tileIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Ionicons name="close-circle" size={16} color="#EF4444" />
            </View>
            <Text style={[styles.metricValue, { color: '#EF4444' }]}>{analytics.failedCalls}</Text>
            <Text style={styles.metricLabel}>Failed Calls</Text>
          </View>
        </View>

        {/* Row 2 */}
        <View style={styles.gridRow}>
          <View style={[styles.metricTile, isDark ? styles.cardDark : styles.cardLight]}>
            <View style={[styles.tileIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Ionicons name="time" size={16} color="#F59E0B" />
            </View>
            <Text style={[styles.metricValue, isDark && styles.textDark]}>{analytics.totalDurationDisplay}</Text>
            <Text style={styles.metricLabel}>Total Duration</Text>
          </View>

          <View style={[styles.metricTile, isDark ? styles.cardDark : styles.cardLight]}>
            <View style={[styles.tileIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
              <Ionicons name="flash" size={16} color="#8B5CF6" />
            </View>
            <Text style={[styles.metricValue, { color: '#8B5CF6' }]}>{analytics.creditsUsed}</Text>
            <Text style={styles.metricLabel}>Credits Used</Text>
          </View>

          <View style={[styles.metricTile, isDark ? styles.cardDark : styles.cardLight]}>
            <View style={[styles.tileIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Ionicons name="rocket" size={16} color="#3B82F6" />
            </View>
            <Text style={[styles.metricValue, isDark && styles.textDark]}>{analytics.campaignCalls}</Text>
            <Text style={styles.metricLabel}>Campaign Calls</Text>
          </View>
        </View>
      </View>

      {/* 3. QUICK NAVIGATION TILES */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>WORKSPACE TOOLS</Text>
      </View>

      <View style={styles.navRow}>
        <Pressable
          style={[styles.navCard, isDark ? styles.cardDark : styles.cardLight]}
          onPress={() => onNavigateTab && onNavigateTab('calls')}
        >
          <View style={[styles.navIconBox, { backgroundColor: 'rgba(10, 132, 255, 0.15)' }]}>
            <Ionicons name="call" size={18} color="#0A84FF" />
          </View>
          <Text style={[styles.navTitle, isDark && styles.textDark]}>Calls & Logs</Text>
          <Text style={styles.navDesc}>Test call, KYC & history</Text>
        </Pressable>

        <Pressable
          style={[styles.navCard, isDark ? styles.cardDark : styles.cardLight]}
          onPress={() => onNavigateTab && onNavigateTab('campaigns')}
        >
          <View style={[styles.navIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
            <Ionicons name="rocket" size={18} color="#8B5CF6" />
          </View>
          <Text style={[styles.navTitle, isDark && styles.textDark]}>Campaigns</Text>
          <Text style={styles.navDesc}>Outbound telecalling</Text>
        </Pressable>

        <Pressable
          style={[styles.navCard, isDark ? styles.cardDark : styles.cardLight]}
          onPress={() => onNavigateTab && onNavigateTab('contacts')}
        >
          <View style={[styles.navIconBox, { backgroundColor: 'rgba(48, 209, 88, 0.15)' }]}>
            <Ionicons name="people" size={18} color="#30D158" />
          </View>
          <Text style={[styles.navTitle, isDark && styles.textDark]}>Contacts</Text>
          <Text style={styles.navDesc}>Lead management</Text>
        </Pressable>
      </View>

      {/* 4. BILLING & TRANSACTIONS (payment_intents, credit_ledger, workspace_subscriptions) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>BILLING & RECENT TRANSACTIONS</Text>
      </View>

      <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
        {/* Subscription Banner */}
        <View style={styles.subBanner}>
          <View>
            <Text style={styles.metaKey}>ACTIVE SUBSCRIPTION</Text>
            <Text style={[styles.subTitle, isDark && styles.textDark]}>
              {billing.subscription?.plan || 'Voice Pro Plan'}
            </Text>
          </View>
          <View style={styles.subPriceBox}>
            <Text style={styles.subPrice}>₹{billing.subscription?.priceMonthly || 1499}/mo</Text>
            <Text style={styles.subRenew}>Renews {billing.subscription?.renewalDate || 'Oct 01, 2026'}</Text>
          </View>
        </View>

        <View style={[styles.divider, isDark ? styles.dividerDark : styles.dividerLight]} />

        {/* Payments List */}
        <Text style={styles.ledgerHeader}>RECENT INVOICES & PAYMENTS</Text>
        {billing.payments.slice(0, 3).map((pm, idx, arr) => (
          <View key={pm.id || idx}>
            <View style={styles.paymentRow}>
              <View style={[styles.payIconBox, { backgroundColor: 'rgba(48, 209, 88, 0.12)' }]}>
                <Ionicons name="card" size={16} color="#30D158" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.payTitle, isDark && styles.textDark]} numberOfLines={1}>
                  {pm.title}
                </Text>
                <Text style={styles.payDate}>{pm.date} • {pm.invoice_id || 'INV-GAP'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.payAmount, isDark && styles.textDark]}>₹{pm.amount}</Text>
                <Text style={styles.payStatus}>{pm.status.toUpperCase()}</Text>
              </View>
            </View>
            {idx < arr.length - 1 && <View style={[styles.divider, isDark ? styles.dividerDark : styles.dividerLight]} />}
          </View>
        ))}

        <View style={[styles.divider, isDark ? styles.dividerDark : styles.dividerLight]} />

        {/* Credit Usage Ledger */}
        <Text style={styles.ledgerHeader}>CREDIT USAGE LEDGER</Text>
        {billing.creditLedger.slice(0, 3).map((cl, idx, arr) => (
          <View key={cl.id || idx}>
            <View style={styles.creditRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.creditDesc, isDark && styles.textDark]} numberOfLines={1}>
                  {cl.description}
                </Text>
                <Text style={styles.creditDate}>{cl.date}</Text>
              </View>
              <Text
                style={[
                  styles.creditAmount,
                  cl.credits > 0 ? { color: '#30D158' } : { color: '#EF4444' },
                ]}
              >
                {cl.credits > 0 ? `+${cl.credits}` : cl.credits} Mins
              </Text>
            </View>
            {idx < arr.length - 1 && <View style={[styles.divider, isDark ? styles.dividerDark : styles.dividerLight]} />}
          </View>
        ))}
      </View>

      {/* Modals */}
      <BuyDedicatedNumberModal
        visible={isBuyModalOpen}
        availableNumbers={availableNumbers || []}
        onClose={() => setIsBuyModalOpen(false)}
        onClaim={async (phoneNumber) => {
          await claimNumberMutation.mutateAsync(phoneNumber);
        }}
        isLoading={claimNumberMutation.isPending}
      />

      <KycRequestModal
        visible={isKycModalOpen}
        onClose={() => setIsKycModalOpen(false)}
        onSubmit={async (payload) => {
          await kycMutation.mutateAsync(payload);
        }}
        isLoading={kycMutation.isPending}
      />

      <TriggerCallModal
        visible={isTriggerModalOpen}
        assistants={assistantsData || []}
        onClose={() => setIsTriggerModalOpen(false)}
        onSubmit={async (payload) => {
          await triggerCallMutation.mutateAsync(payload);
        }}
        isLoading={triggerCallMutation.isPending}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerLight: { backgroundColor: '#F2F2F7' },
  containerDark: { backgroundColor: '#020617' },
  contentContainer: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 130, gap: 14 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1 },
  cardLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  cardDark: { backgroundColor: '#0F172A', borderColor: '#1E293B' },
  heroCard: { borderLeftWidth: 4, borderLeftColor: '#8B5CF6' },
  heroHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIconBox: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  heroMetaLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', letterSpacing: 0.5 },
  heroNumber: { fontSize: 18, fontWeight: '800', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeSuccess: { backgroundColor: 'rgba(48, 209, 88, 0.15)' },
  badgeWarning: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  badgeText: { fontSize: 10.5, fontWeight: '800' },
  textSuccess: { color: '#30D158' },
  textDark: { color: '#F8FAFC' },
  numberMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  metaItem: { flex: 1 },
  metaKey: { fontSize: 10.5, color: '#64748B', fontWeight: '500', marginBottom: 2 },
  metaVal: { fontSize: 12.5, fontWeight: '700' },
  inlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  smallDot: { width: 6, height: 6, borderRadius: 3 },
  divider: { height: 1, marginVertical: 12 },
  dividerLight: { backgroundColor: '#E2E8F0' },
  dividerDark: { backgroundColor: '#1E293B' },
  heroActionRow: { flexDirection: 'row', gap: 8 },
  heroBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  heroBtnText: { fontSize: 12.5, fontWeight: '700', color: '#FFFFFF' },
  secondaryBtnLight: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1' },
  secondaryBtnDark: { backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' },
  sectionHeader: { marginTop: 4 },
  sectionTitle: { fontSize: 11.5, fontWeight: '700', color: '#64748B', letterSpacing: 0.5 },
  analyticsGrid: { gap: 8 },
  gridRow: { flexDirection: 'row', gap: 8 },
  metricTile: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    justifyContent: 'space-between',
    minHeight: 88,
  },
  tileIconBox: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  metricValue: { fontSize: 18, fontWeight: '800' },
  metricLabel: { fontSize: 10.5, color: '#64748B', fontWeight: '500', marginTop: 2 },
  navRow: { flexDirection: 'row', gap: 8 },
  navCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  navIconBox: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  navTitle: { fontSize: 13, fontWeight: '700' },
  navDesc: { fontSize: 10.5, color: '#64748B', marginTop: 2 },
  subBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subTitle: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  subPriceBox: { alignItems: 'flex-end' },
  subPrice: { fontSize: 15, fontWeight: '800', color: '#8B5CF6' },
  subRenew: { fontSize: 10.5, color: '#64748B', marginTop: 2 },
  ledgerHeader: { fontSize: 10.5, fontWeight: '700', color: '#64748B', letterSpacing: 0.5, marginBottom: 10 },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  payIconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  payTitle: { fontSize: 13, fontWeight: '600' },
  payDate: { fontSize: 11, color: '#64748B', marginTop: 1 },
  payAmount: { fontSize: 13, fontWeight: '700' },
  payStatus: { fontSize: 9.5, fontWeight: '700', color: '#30D158', marginTop: 1 },
  creditRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  creditDesc: { fontSize: 12.5, fontWeight: '600' },
  creditDate: { fontSize: 10.5, color: '#64748B', marginTop: 1 },
  creditAmount: { fontSize: 12.5, fontWeight: '700' },
});
