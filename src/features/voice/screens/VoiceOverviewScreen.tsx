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
import {
  BillingTransactions,
  DedicatedNumber,
  KycStatusResponse,
  VoiceAnalytics,
  voiceApi,
} from '../api/voiceApi';
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
  const kyc: KycStatusResponse = kycData || { status: 'not_submitted', businessName: '' };
  const analytics: VoiceAnalytics = analyticsData || {
    totalCalls: 0,
    completedCalls: 0,
    failedCalls: 0,
    totalDurationDisplay: '0m',
    totalDurationSeconds: 0,
    creditsUsed: '0 Mins',
    campaignCalls: 0,
  };
  const billing: BillingTransactions = billingData || {
    payments: [],
    creditLedger: [],
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
      {/* 1. COMPACT HERO HEADER CARD */}
      <View style={[styles.heroCard, isDark ? styles.cardDark : styles.cardLight]}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroLeft}>
            <View style={styles.phoneBadge}>
              <Ionicons name="call" size={14} color="#8B5CF6" />
              <Text style={styles.heroMetaLabel}>VIRTUAL LINE</Text>
            </View>
            <Text style={[styles.heroNumber, isDark && styles.textDark]}>
              {dedicatedNumber?.phone_number || 'No Number Assigned'}
            </Text>
          </View>
          <View style={[styles.statusBadge, dedicatedNumber ? styles.statusActive : styles.statusInactive]}>
            <View style={[styles.dot, dedicatedNumber ? styles.dotActive : styles.dotInactive]} />
            <Text style={[styles.statusText, dedicatedNumber ? styles.textActive : styles.textInactive]}>
              {dedicatedNumber?.status?.toUpperCase() || 'UNASSIGNED'}
            </Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: '#8B5CF6' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsTriggerModalOpen(true);
            }}
          >
            <Ionicons name="call" size={14} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>Test Call</Text>
          </Pressable>

          <Pressable
            style={[styles.secondaryBtn, isDark ? styles.secondaryBtnDark : styles.secondaryBtnLight]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsBuyModalOpen(true);
            }}
          >
            <Ionicons name="add-circle-outline" size={15} color={isDark ? '#FFFFFF' : '#0F172A'} />
            <Text style={[styles.secondaryBtnText, isDark ? styles.textDark : { color: '#0F172A' }]}>
              Get Number
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 2. STREAMLINED TELEMETRY GRID (2x2) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>REAL-TIME TELEMETRY</Text>
      </View>

      <View style={styles.gridContainer}>
        <View style={styles.gridRow}>
          <View style={[styles.metricCard, isDark ? styles.cardDark : styles.cardLight]}>
            <View style={styles.metricHeader}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(10, 132, 255, 0.12)' }]}>
                <Ionicons name="call" size={15} color="#0A84FF" />
              </View>
              <Text style={styles.metricLabel}>Total Calls</Text>
            </View>
            <Text style={[styles.metricValue, isDark && styles.textDark]}>{analytics.totalCalls}</Text>
          </View>

          <View style={[styles.metricCard, isDark ? styles.cardDark : styles.cardLight]}>
            <View style={styles.metricHeader}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(48, 209, 88, 0.12)' }]}>
                <Ionicons name="checkmark-done" size={15} color="#30D158" />
              </View>
              <Text style={styles.metricLabel}>Completed</Text>
            </View>
            <Text style={[styles.metricValue, { color: '#30D158' }]}>{analytics.completedCalls}</Text>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={[styles.metricCard, isDark ? styles.cardDark : styles.cardLight]}>
            <View style={styles.metricHeader}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                <Ionicons name="time" size={15} color="#F59E0B" />
              </View>
              <Text style={styles.metricLabel}>Total Duration</Text>
            </View>
            <Text style={[styles.metricValue, isDark && styles.textDark]}>{analytics.totalDurationDisplay}</Text>
          </View>

          <View style={[styles.metricCard, isDark ? styles.cardDark : styles.cardLight]}>
            <View style={styles.metricHeader}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                <Ionicons name="flash" size={15} color="#8B5CF6" />
              </View>
              <Text style={styles.metricLabel}>Credits Billed</Text>
            </View>
            <Text style={[styles.metricValue, { color: '#8B5CF6' }]}>{analytics.creditsUsed}</Text>
          </View>
        </View>
      </View>

      {/* 3. QUICK SHORTCUTS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>WORKSPACE TOOLS</Text>
      </View>

      <View style={styles.toolsRow}>
        <Pressable
          style={[styles.toolCard, isDark ? styles.cardDark : styles.cardLight]}
          onPress={() => onNavigateTab && onNavigateTab('calls')}
        >
          <View style={[styles.toolIcon, { backgroundColor: 'rgba(10, 132, 255, 0.12)' }]}>
            <Ionicons name="list" size={18} color="#0A84FF" />
          </View>
          <Text style={[styles.toolTitle, isDark && styles.textDark]}>Calls</Text>
          <Text style={styles.toolSub}>Call History</Text>
        </Pressable>

        <Pressable
          style={[styles.toolCard, isDark ? styles.cardDark : styles.cardLight]}
          onPress={() => onNavigateTab && onNavigateTab('campaigns')}
        >
          <View style={[styles.toolIcon, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
            <Ionicons name="megaphone-outline" size={18} color="#8B5CF6" />
          </View>
          <Text style={[styles.toolTitle, isDark && styles.textDark]}>Campaigns</Text>
          <Text style={styles.toolSub}>Outbound</Text>
        </Pressable>

        <Pressable
          style={[styles.toolCard, isDark ? styles.cardDark : styles.cardLight]}
          onPress={() => onNavigateTab && onNavigateTab('contacts')}
        >
          <View style={[styles.toolIcon, { backgroundColor: 'rgba(48, 209, 88, 0.12)' }]}>
            <Ionicons name="people-outline" size={18} color="#30D158" />
          </View>
          <Text style={[styles.toolTitle, isDark && styles.textDark]}>Contacts</Text>
          <Text style={styles.toolSub}>CRM Sync</Text>
        </Pressable>
      </View>

      {/* 4. SUBSCRIPTION SUMMARY (IF AVAILABLE) */}
      {billing.subscription && (
        <View style={[styles.subCard, isDark ? styles.cardDark : styles.cardLight]}>
          <View style={styles.subLeft}>
            <Text style={styles.subMeta}>SUBSCRIPTION</Text>
            <Text style={[styles.subName, isDark && styles.textDark]}>{billing.subscription.plan}</Text>
          </View>
          <View style={styles.subRight}>
            <Text style={styles.subPrice}>₹{billing.subscription.priceMonthly}/mo</Text>
            <Text style={styles.subRenew}>Renews {billing.subscription.renewalDate}</Text>
          </View>
        </View>
      )}

      {/* MODALS */}
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
  containerLight: { backgroundColor: '#F8FAFC' },
  containerDark: { backgroundColor: '#020617' },
  contentContainer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120, gap: 14 },
  
  cardLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  cardDark: { backgroundColor: '#0F172A', borderColor: '#1E293B' },

  heroCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLeft: { gap: 4 },
  phoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroMetaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  heroNumber: {
    fontSize: 17,
    fontWeight: '800',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: { backgroundColor: 'rgba(48, 209, 88, 0.12)' },
  statusInactive: { backgroundColor: 'rgba(148, 163, 184, 0.12)' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { backgroundColor: '#30D158' },
  dotInactive: { backgroundColor: '#94A3B8' },
  statusText: { fontSize: 10.5, fontWeight: '800' },
  textActive: { color: '#30D158' },
  textInactive: { color: '#94A3B8' },

  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  secondaryBtnLight: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  secondaryBtnDark: { backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  sectionHeader: {
    marginTop: 2,
    marginBottom: -4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
  },

  gridContainer: { gap: 8 },
  gridRow: { flexDirection: 'row', gap: 8 },
  metricCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    gap: 8,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
  },

  toolsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toolCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  toolIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  toolTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  toolSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },

  subCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subLeft: { gap: 2 },
  subMeta: { fontSize: 10, fontWeight: '700', color: '#64748B', letterSpacing: 0.5 },
  subName: { fontSize: 14, fontWeight: '700' },
  subRight: { alignItems: 'flex-end', gap: 2 },
  subPrice: { fontSize: 14, fontWeight: '800', color: '#8B5CF6' },
  subRenew: { fontSize: 10, color: '#64748B' },

  textDark: { color: '#F8FAFC' },
});
