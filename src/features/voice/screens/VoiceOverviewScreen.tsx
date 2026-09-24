import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { useAuthStore } from '../../../core/store/authStore';
import {
  BillingTransactions,
  DedicatedNumber,
  KycStatusResponse,
  VoiceAnalytics,
  VoiceBalanceStatus,
  voiceApi,
} from '../api/voiceApi';
import {
  BuyDedicatedNumberModal,
  KycRequestModal,
  TopUpCreditsModal,
  TriggerCallModal,
} from '../components';

interface VoiceOverviewScreenProps {
  onNavigateTab?: (tab: 'overview' | 'numbers' | 'calls' | 'campaigns' | 'contacts') => void;
}

export const VoiceOverviewScreen: React.FC<VoiceOverviewScreenProps> = ({ onNavigateTab }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);

  // 1. Queries
  const {
    data: numbersData,
    isLoading: isNumbersLoading,
    refetch: refetchNumbers,
  } = useQuery({
    queryKey: ['voice', 'numbers'],
    queryFn: () => voiceApi.getNumbers(),
  });

  const { data: availableNumbers } = useQuery({
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
    data: balanceData,
    isLoading: isBalanceLoading,
    refetch: refetchBalance,
  } = useQuery({
    queryKey: ['voice', 'balance'],
    queryFn: () => voiceApi.getBalanceStatus(),
  });

  const {
    data: billingData,
    isLoading: isBillingLoading,
    refetch: refetchBilling,
  } = useQuery({
    queryKey: ['voice', 'billing'],
    queryFn: () => voiceApi.getBillingTransactions(),
  });

  const { data: assistantsData } = useQuery({
    queryKey: ['voice', 'assistants'],
    queryFn: () => voiceApi.getAssistants(),
  });

  // 2. Mutations
  const claimNumberMutation = useMutation({
    mutationFn: (phoneNumber: string) => voiceApi.claimDedicatedNumber({ phoneNumber }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice', 'numbers'] });
      queryClient.invalidateQueries({ queryKey: ['voice', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['voice', 'billing'] });
    },
  });

  const topUpMutation = useMutation({
    mutationFn: (amount: number) => voiceApi.topUpCredits(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice', 'balance'] });
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
      queryClient.invalidateQueries({ queryKey: ['voice', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['voice', 'billing'] });
    },
  });

  const isRefreshing =
    isNumbersLoading || isKycLoading || isAnalyticsLoading || isBillingLoading || isBalanceLoading;

  const handleRefresh = () => {
    refetchNumbers();
    refetchKyc();
    refetchAnalytics();
    refetchBalance();
    refetchBilling();
  };

  const dedicatedNumber: DedicatedNumber | undefined = numbersData?.[0];
  const kyc: KycStatusResponse = kycData || { status: 'not_submitted', businessName: '' };
  const balance: VoiceBalanceStatus = balanceData || {
    availableBalance: 0,
    availableMinutes: 0,
    totalCreditsEarned: 0,
    totalCreditsUsed: 0,
    reservedCredits: 0,
    status: 'depleted',
    formattedBalance: '₹0.00',
    ratePerMinute: '₹1.00/min',
    planName: '',
    planRenewalDate: '',
    dedicatedNumberEntitlements: 0,
  };

  const analytics: VoiceAnalytics = analyticsData || {
    totalCalls: 0,
    completedCalls: 0,
    failedCalls: 0,
    totalDurationDisplay: '0m',
    totalDurationSeconds: 0,
    creditsUsed: '₹0',
    campaignCalls: 0,
  };

  const billing: BillingTransactions = billingData || {
    payments: [],
    creditLedger: [],
    subscription: undefined,
  };

  return (
    <ScrollView
      style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={isDark ? '#FFFFFF' : '#8B5CF6'}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* 1. TOP OVERVIEW & ENGINE HEADER */}
      <View style={[styles.topHeaderCard, isDark ? styles.cardDark : styles.cardLight]}>
        <View style={styles.topHeaderRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.engineBadgeRow}>
              <View style={styles.liveIndicator} />
              <Text style={styles.engineName}>VOMYRA AI TELEPHONY</Text>
            </View>
            <Text style={[styles.workspaceTitle, isDark && styles.textDark]}>
              {user?.name || kyc.businessName || 'VoicePilot Workspace'}
            </Text>
            <Text style={styles.workspaceSubtitle} numberOfLines={1}>
              {user?.email || 'Active Workspace Session'}
            </Text>
          </View>
          <View style={styles.statusPill}>
            <Ionicons name="shield-checkmark" size={14} color="#30D158" />
            <Text style={styles.statusPillText}>ENGINE ONLINE</Text>
          </View>
        </View>
      </View>

      {/* 2. REAL-TIME BALANCE STATUS (WEBSITE MIRROR) */}
      <View style={[styles.card, styles.balanceCard, isDark ? styles.cardDark : styles.cardLight]}>
        <View style={styles.balanceHeader}>
          <View style={styles.balanceHeaderLeft}>
            <View style={[styles.walletIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
              <Ionicons name="wallet" size={20} color="#8B5CF6" />
            </View>
            <View>
              <Text style={styles.balanceLabel}>AVAILABLE TELEPHONY BALANCE</Text>
              <Text style={[styles.balanceValue, isDark && styles.textDark]}>
                ₹{balance.availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          {/* Status Badge */}
          <View
            style={[
              styles.healthBadge,
              balance.status === 'healthy'
                ? styles.healthBadgeGreen
                : balance.status === 'low'
                ? styles.healthBadgeAmber
                : styles.healthBadgeRed,
            ]}
          >
            <View
              style={[
                styles.smallDot,
                {
                  backgroundColor:
                    balance.status === 'healthy'
                      ? '#30D158'
                      : balance.status === 'low'
                      ? '#F59E0B'
                      : '#EF4444',
                },
              ]}
            />
            <Text
              style={[
                styles.healthBadgeText,
                {
                  color:
                    balance.status === 'healthy'
                      ? '#30D158'
                      : balance.status === 'low'
                      ? '#F59E0B'
                      : '#EF4444',
                },
              ]}
            >
              {balance.status === 'healthy'
                ? 'HEALTHY'
                : balance.status === 'low'
                ? 'LOW BALANCE'
                : 'RECHARGE REQ'}
            </Text>
          </View>
        </View>

        {/* Talk Time & Rate Banner */}
        <View style={[styles.talkTimeBanner, isDark ? styles.talkTimeDark : styles.talkTimeLight]}>
          <View style={styles.talkTimeLeft}>
            <Ionicons name="time" size={16} color="#8B5CF6" />
            <Text style={[styles.talkTimeText, isDark && styles.textDark]}>
              ~{balance.availableMinutes.toLocaleString('en-IN')} Call Minutes Available
            </Text>
          </View>
          <View style={styles.rateTag}>
            <Text style={styles.rateTagText}>{balance.ratePerMinute}</Text>
          </View>
        </View>

        {/* 3-Way Ledger Breakdown */}
        <View style={styles.breakdownRow}>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Total Added</Text>
            <Text style={[styles.breakdownVal, { color: '#30D158' }]}>
              +₹{balance.totalCreditsEarned.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={[styles.verticalLine, isDark ? styles.dividerDark : styles.dividerLight]} />

          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Charged / Used</Text>
            <Text style={[styles.breakdownVal, { color: '#EF4444' }]}>
              -₹{balance.totalCreditsUsed.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={[styles.verticalLine, isDark ? styles.dividerDark : styles.dividerLight]} />

          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>In-Flight Holds</Text>
            <Text style={[styles.breakdownVal, isDark && styles.textDark]}>
              ₹{balance.reservedCredits.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, isDark ? styles.dividerDark : styles.dividerLight]} />

        {/* Plan Quota & Top Up Action */}
        <View style={styles.balanceFooter}>
          <View style={{ flex: 1 }}>
            <Text style={styles.planNameText}>
              Plan: <Text style={{ fontWeight: '700' }}>{balance.planName}</Text>
            </Text>
            <Text style={styles.planSubText}>
              {balance.dedicatedNumberEntitlements} Virtual Line Included • Renews {balance.planRenewalDate}
            </Text>
          </View>

          <Pressable
            style={styles.topUpBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setIsTopUpModalOpen(true);
            }}
          >
            <Ionicons name="flash" size={14} color="#FFFFFF" />
            <Text style={styles.topUpBtnText}>+ Top Up</Text>
          </Pressable>
        </View>
      </View>

      {/* 3. DEDICATED NUMBER HERO CARD */}
      <View style={[styles.card, styles.heroCard, isDark ? styles.cardDark : styles.cardLight]}>
        <View style={styles.heroHeader}>
          <View style={[styles.heroIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
            <Ionicons name="call" size={22} color="#8B5CF6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroMetaLabel}>DEDICATED CALLER ID (VIRTUAL LINE)</Text>
            <Text style={[styles.heroNumber, isDark && styles.textDark]}>
              {dedicatedNumber?.phone_number || 'No Virtual Number Assigned'}
            </Text>
          </View>
          <View
            style={[
              styles.badge,
              dedicatedNumber?.status === 'active' ? styles.badgeSuccess : styles.badgeWarning,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                dedicatedNumber?.status === 'active' ? styles.textSuccess : styles.textWarning,
              ]}
            >
              {dedicatedNumber?.status ? dedicatedNumber.status.toUpperCase() : 'CLAIM REQUIRED'}
            </Text>
          </View>
        </View>

        <View style={styles.numberMetaRow}>
          <Pressable style={styles.metaItem} onPress={() => setIsKycModalOpen(true)}>
            <Text style={styles.metaKey}>KYC Verification</Text>
            <View style={styles.inlineBadge}>
              <View
                style={[
                  styles.smallDot,
                  { backgroundColor: kyc.status === 'verified' ? '#30D158' : '#F59E0B' },
                ]}
              />
              <Text
                style={[
                  styles.metaVal,
                  { color: kyc.status === 'verified' ? '#30D158' : '#F59E0B' },
                ]}
              >
                {kyc.status === 'verified' ? 'Verified (TRAI)' : 'Action Required'}
              </Text>
            </View>
          </Pressable>

          <View style={styles.metaItem}>
            <Text style={styles.metaKey}>Assigned AI Voice</Text>
            <Text style={[styles.metaVal, isDark && styles.textDark]} numberOfLines={1}>
              {dedicatedNumber?.assistants?.name || assistantsData?.[0]?.name || 'Auto Assistant'}
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
              {dedicatedNumber ? 'Switch Number' : 'Get Dedicated Number'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 4. REAL-TIME VOICE TELEMETRY */}
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
            <Text style={styles.metricLabel}>Completed</Text>
          </View>

          <View style={[styles.metricTile, isDark ? styles.cardDark : styles.cardLight]}>
            <View style={[styles.tileIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Ionicons name="close-circle" size={16} color="#EF4444" />
            </View>
            <Text style={[styles.metricValue, { color: '#EF4444' }]}>{analytics.failedCalls}</Text>
            <Text style={styles.metricLabel}>Failed</Text>
          </View>
        </View>

        {/* Row 2 */}
        <View style={styles.gridRow}>
          <View style={[styles.metricTile, isDark ? styles.cardDark : styles.cardLight]}>
            <View style={[styles.tileIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Ionicons name="time" size={16} color="#F59E0B" />
            </View>
            <Text style={[styles.metricValue, isDark && styles.textDark]}>
              {analytics.totalDurationDisplay}
            </Text>
            <Text style={styles.metricLabel}>Total Duration</Text>
          </View>

          <View style={[styles.metricTile, isDark ? styles.cardDark : styles.cardLight]}>
            <View style={[styles.tileIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
              <Ionicons name="flash" size={16} color="#8B5CF6" />
            </View>
            <Text style={[styles.metricValue, { color: '#8B5CF6' }]}>{analytics.creditsUsed}</Text>
            <Text style={styles.metricLabel}>Credits Charged</Text>
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

      {/* 5. QUICK NAVIGATION TILES */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>WORKSPACE MODULES</Text>
      </View>

      <View style={styles.navRow}>
        <Pressable
          style={[styles.navCard, isDark ? styles.cardDark : styles.cardLight]}
          onPress={() => onNavigateTab && onNavigateTab('numbers')}
        >
          <View style={[styles.navIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
            <Ionicons name="keypad" size={18} color="#8B5CF6" />
          </View>
          <Text style={[styles.navTitle, isDark && styles.textDark]}>Phone Lines</Text>
          <Text style={styles.navDesc}>Caller IDs & routing</Text>
        </Pressable>

        <Pressable
          style={[styles.navCard, isDark ? styles.cardDark : styles.cardLight]}
          onPress={() => onNavigateTab && onNavigateTab('calls')}
        >
          <View style={[styles.navIconBox, { backgroundColor: 'rgba(10, 132, 255, 0.15)' }]}>
            <Ionicons name="call" size={18} color="#0A84FF" />
          </View>
          <Text style={[styles.navTitle, isDark && styles.textDark]}>Calls</Text>
          <Text style={styles.navDesc}>Test call & logs</Text>
        </Pressable>

        <Pressable
          style={[styles.navCard, isDark ? styles.cardDark : styles.cardLight]}
          onPress={() => onNavigateTab && onNavigateTab('campaigns')}
        >
          <View style={[styles.navIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <Ionicons name="rocket" size={18} color="#F59E0B" />
          </View>
          <Text style={[styles.navTitle, isDark && styles.textDark]}>Campaigns</Text>
          <Text style={styles.navDesc}>Bulk dialer</Text>
        </Pressable>

        <Pressable
          style={[styles.navCard, isDark ? styles.cardDark : styles.cardLight]}
          onPress={() => onNavigateTab && onNavigateTab('contacts')}
        >
          <View style={[styles.navIconBox, { backgroundColor: 'rgba(48, 209, 88, 0.15)' }]}>
            <Ionicons name="people" size={18} color="#30D158" />
          </View>
          <Text style={[styles.navTitle, isDark && styles.textDark]}>Contacts</Text>
          <Text style={styles.navDesc}>Leads CRM</Text>
        </Pressable>
      </View>

      {/* 6. BILLING & RECENT TRANSACTIONS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>BILLING & RECENT TRANSACTIONS</Text>
      </View>

      <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
        {/* Subscription Banner */}
        <View style={styles.subBanner}>
          <View>
            <Text style={styles.metaKey}>ACTIVE SUBSCRIPTION</Text>
            <Text style={[styles.subTitle, isDark && styles.textDark]}>
              {billing.subscription?.plan || balance.planName}
            </Text>
          </View>
          <View style={styles.subPriceBox}>
            <Text style={styles.subPrice}>₹{billing.subscription?.priceMonthly || 1499}/mo</Text>
            <Text style={styles.subRenew}>Renews {balance.planRenewalDate}</Text>
          </View>
        </View>

        <View style={[styles.divider, isDark ? styles.dividerDark : styles.dividerLight]} />

        {/* Payments List */}
        <Text style={styles.ledgerHeader}>RECENT INVOICES & PAYMENTS</Text>
        {billing.payments.length === 0 ? (
          <Text style={styles.emptyNotice}>No recent payment invoices.</Text>
        ) : (
          billing.payments.slice(0, 3).map((pm, idx, arr) => (
            <View key={pm.id || idx}>
              <View style={styles.paymentRow}>
                <View style={[styles.payIconBox, { backgroundColor: 'rgba(48, 209, 88, 0.12)' }]}>
                  <Ionicons name="card" size={16} color="#30D158" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.payTitle, isDark && styles.textDark]} numberOfLines={1}>
                    {pm.title}
                  </Text>
                  <Text style={styles.payDate}>
                    {new Date(pm.date).toLocaleDateString()} • {pm.invoice_id || 'INV-GAP'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.payAmount, isDark && styles.textDark]}>₹{pm.amount}</Text>
                  <Text style={styles.payStatus}>{pm.status.toUpperCase()}</Text>
                </View>
              </View>
              {idx < arr.length - 1 && (
                <View style={[styles.divider, isDark ? styles.dividerDark : styles.dividerLight]} />
              )}
            </View>
          ))
        )}

        <View style={[styles.divider, isDark ? styles.dividerDark : styles.dividerLight]} />

        {/* Credit Usage Ledger */}
        <Text style={styles.ledgerHeader}>CREDIT USAGE LEDGER</Text>
        {billing.creditLedger.length === 0 ? (
          <Text style={styles.emptyNotice}>No ledger entries yet.</Text>
        ) : (
          billing.creditLedger.slice(0, 3).map((cl, idx, arr) => (
            <View key={cl.id || idx}>
              <View style={styles.creditRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.creditDesc, isDark && styles.textDark]} numberOfLines={1}>
                    {cl.description}
                  </Text>
                  <Text style={styles.creditDate}>{new Date(cl.date).toLocaleDateString()}</Text>
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
              {idx < arr.length - 1 && (
                <View style={[styles.divider, isDark ? styles.dividerDark : styles.dividerLight]} />
              )}
            </View>
          ))
        )}
      </View>

      {/* Modals */}
      <TopUpCreditsModal
        visible={isTopUpModalOpen}
        currentBalance={balance.availableBalance}
        onClose={() => setIsTopUpModalOpen(false)}
        onTopUp={async (amount) => {
          await topUpMutation.mutateAsync(amount);
        }}
        isLoading={topUpMutation.isPending}
      />

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
        kycData={kycData}
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

  topHeaderCard: { borderRadius: 16, padding: 16, borderWidth: 1 },
  topHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  engineBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  liveIndicator: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#30D158' },
  engineName: { fontSize: 10, fontWeight: '800', color: '#8B5CF6', letterSpacing: 0.8 },
  workspaceTitle: { fontSize: 17, fontWeight: '800' },
  workspaceSubtitle: { fontSize: 11.5, color: '#64748B', marginTop: 1 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.25)',
  },
  statusPillText: { fontSize: 9.5, fontWeight: '800', color: '#30D158', letterSpacing: 0.5 },

  // Balance Card
  balanceCard: { borderLeftWidth: 4, borderLeftColor: '#8B5CF6' },
  balanceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balanceHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  walletIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  balanceLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', letterSpacing: 0.5 },
  balanceValue: { fontSize: 24, fontWeight: '800', marginTop: 2, color: '#111827' },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  healthBadgeGreen: { backgroundColor: 'rgba(48, 209, 88, 0.12)', borderColor: 'rgba(48, 209, 88, 0.25)' },
  healthBadgeAmber: { backgroundColor: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.25)' },
  healthBadgeRed: { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.25)' },
  healthBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  talkTimeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 14,
  },
  talkTimeLight: { backgroundColor: '#F8FAFC' },
  talkTimeDark: { backgroundColor: '#1E293B' },
  talkTimeLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  talkTimeText: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  rateTag: { backgroundColor: 'rgba(139, 92, 246, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  rateTagText: { fontSize: 11, fontWeight: '700', color: '#8B5CF6' },

  breakdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  breakdownItem: { flex: 1, alignItems: 'center' },
  breakdownLabel: { fontSize: 10.5, color: '#64748B', fontWeight: '500', marginBottom: 2 },
  breakdownVal: { fontSize: 13, fontWeight: '700' },
  verticalLine: { width: 1, height: 28 },

  balanceFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  planNameText: { fontSize: 12, color: '#64748B' },
  planSubText: { fontSize: 10.5, color: '#94A3B8', marginTop: 2 },
  topUpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  topUpBtnText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '700' },

  // Hero Card
  heroCard: { borderLeftWidth: 4, borderLeftColor: '#3B82F6' },
  heroHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  heroMetaLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', letterSpacing: 0.5 },
  heroNumber: { fontSize: 17, fontWeight: '800', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeSuccess: { backgroundColor: 'rgba(48, 209, 88, 0.15)' },
  badgeWarning: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  badgeText: { fontSize: 10, fontWeight: '800' },
  textSuccess: { color: '#30D158' },
  textWarning: { color: '#F59E0B' },
  textDark: { color: '#F8FAFC' },

  numberMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  metaItem: { flex: 1 },
  metaKey: { fontSize: 10.5, color: '#64748B', fontWeight: '500', marginBottom: 2 },
  metaVal: { fontSize: 12, fontWeight: '700' },
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
    paddingVertical: 11,
    borderRadius: 10,
  },
  heroBtnText: { fontSize: 12.5, fontWeight: '700', color: '#FFFFFF' },
  secondaryBtnLight: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1' },
  secondaryBtnDark: { backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' },

  sectionHeader: { marginTop: 4 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#64748B', letterSpacing: 0.6 },
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
  metricValue: { fontSize: 17, fontWeight: '800' },
  metricLabel: { fontSize: 10.5, color: '#64748B', fontWeight: '500', marginTop: 2 },

  navRow: { flexDirection: 'row', gap: 8 },
  navCard: { flex: 1, borderRadius: 14, padding: 12, borderWidth: 1 },
  navIconBox: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  navTitle: { fontSize: 12.5, fontWeight: '700' },
  navDesc: { fontSize: 10, color: '#64748B', marginTop: 2, lineHeight: 14 },

  subBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subTitle: { fontSize: 14.5, fontWeight: '700', marginTop: 2 },
  subPriceBox: { alignItems: 'flex-end' },
  subPrice: { fontSize: 14.5, fontWeight: '800', color: '#8B5CF6' },
  subRenew: { fontSize: 10, color: '#64748B', marginTop: 2 },
  ledgerHeader: { fontSize: 10.5, fontWeight: '700', color: '#64748B', letterSpacing: 0.5, marginBottom: 10 },
  emptyNotice: { fontSize: 11.5, color: '#94A3B8', fontStyle: 'italic', marginVertical: 4 },

  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  payIconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  payTitle: { fontSize: 12.5, fontWeight: '600' },
  payDate: { fontSize: 10.5, color: '#64748B', marginTop: 1 },
  payAmount: { fontSize: 12.5, fontWeight: '700' },
  payStatus: { fontSize: 9.5, fontWeight: '700', color: '#30D158', marginTop: 1 },

  creditRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  creditDesc: { fontSize: 12, fontWeight: '600' },
  creditDate: { fontSize: 10.5, color: '#64748B', marginTop: 1 },
  creditAmount: { fontSize: 12, fontWeight: '700' },
});
