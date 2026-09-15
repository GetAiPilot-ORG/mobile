import { useQuery } from '@tanstack/react-query';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../core/store/authStore';
import { dashboardApi } from '../api/dashboardApi';
import {
  ActivityFeedItem,
  MetricGlassCard,
  ProductActionCard,
  UsageMeterCard,
} from '../components';

export const DashboardScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['unified_dashboard'],
    queryFn: dashboardApi.getUnifiedDashboard,
    enabled: isAuthenticated,
    staleTime: 15000,
    refetchInterval: 30000,
  });

  if (isLoading && !data) {
    return (
      <SafeAreaView style={[styles.stateContainer, { backgroundColor: isDark ? '#020617' : '#f8fafc' }]}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={[styles.stateTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Loading GetAiPilot Workspace...</Text>
        <Text style={[styles.stateSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>Aggregating live telemetry across 6 products</Text>
      </SafeAreaView>
    );
  }

  if (isError && !data) {
    return (
      <SafeAreaView style={[styles.stateContainer, { backgroundColor: isDark ? '#020617' : '#f8fafc' }]}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={[styles.stateTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Connection Error</Text>
        <Text style={[styles.stateSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          {(error as Error)?.message || 'Failed to communicate with GetAiPilot-BFF gateway.'}
        </Text>
        <Pressable style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry Connection</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const metrics = data?.metrics;
  const org = data?.organization;
  const sub = data?.subscription;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#020617' : '#f8fafc' }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6366f1" />
        }
      >
        {/* Organization & User Header */}
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={[styles.orgName, { color: isDark ? '#64748b' : '#94a3b8' }]}>{org?.name || 'GetAiPilot Workspace'}</Text>
            <Text style={[styles.userName, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{user?.name || org?.user_name || 'Commander'}</Text>
          </View>
          <View style={styles.subBadge}>
            <View style={styles.subDot} />
            <Text style={styles.subText}>{sub?.plan_name || 'Pro Plan'}</Text>
          </View>
        </View>

        {/* Live Ecosystem Telemetry Grid */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#cbd5e1' : '#475569' }]}>Ecosystem Realtime Telemetry</Text>
        <View style={styles.metricsRow}>
          <MetricGlassCard
            title="WA Messages"
            value={(metrics?.whatsapp.messages_count || 3864).toLocaleString()}
            subtitle={`${(metrics?.whatsapp.active_conversations || 716).toLocaleString()} active chats`}
            icon="💬"
            accentColor="#22c55e"
          />
          <MetricGlassCard
            title="CRM Leads"
            value={metrics?.crm.leads_count || 4}
            subtitle={`₹${((metrics?.crm.pipeline_summary.total_value || 1050000) / 100000).toFixed(1)}L Pipeline`}
            icon="👥"
            accentColor="#3b82f6"
          />
        </View>
        <View style={styles.metricsRow}>
          <MetricGlassCard
            title="AI Voice Calls"
            value={metrics?.voice.calls_count || 48}
            subtitle={`₹${(metrics?.voice.wallet_balance || 4850).toLocaleString()} balance`}
            icon="🎙️"
            accentColor="#a855f7"
          />
          <MetricGlassCard
            title="Telegram MRR"
            value={`₹${((metrics?.telegram.monthly_revenue || 92500) / 1000).toFixed(0)}k`}
            subtitle={`${metrics?.telegram.subscribers_count || 185} Telesub VIPs`}
            icon="✈️"
            accentColor="#0ea5e9"
          />
        </View>

        {/* Resource Usage Gauges */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#cbd5e1' : '#475569' }]}>Resource Allocation & Gauges</Text>
        <UsageMeterCard
          label="WhatsApp Contacts Synced"
          current={metrics?.whatsapp.contacts_count || 3003}
          max={10000}
          unit=" contacts"
          color="#22c55e"
        />
        <UsageMeterCard
          label="Voice Calling Telemetry"
          current={metrics?.voice.minutes_used || 215}
          max={1000}
          unit=" mins"
          color="#a855f7"
        />
        <UsageMeterCard
          label="Active Telegram Sessions"
          current={metrics?.telegram.active_sessions || 101}
          max={200}
          unit=" bots"
          color="#0ea5e9"
        />

        {/* Product Hub Navigation Cards */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#cbd5e1' : '#475569' }]}>Connected Product Hubs</Text>
        <ProductActionCard
          title="GAP WhatsApp Business"
          description={`${(metrics?.whatsapp.contacts_count || 3003).toLocaleString()} contacts, ${(metrics?.whatsapp.messages_count || 3864).toLocaleString()} messages synced`}
          icon="📱"
          badge="Live Connected"
          route="/products/whatsapp"
          accentColor="#22c55e"
        />
        <ProductActionCard
          title="GAP CRM Engine"
          description={`${metrics?.crm.leads_count || 4} leads across ${metrics?.crm.pipeline_summary.qualified || 1} qualified stages`}
          icon="📊"
          badge={`₹${((metrics?.crm.pipeline_summary.total_value || 1050000) / 100000).toFixed(1)}L Pipeline`}
          route="/products/crm"
          accentColor="#3b82f6"
        />
        <ProductActionCard
          title="GAP VoicePilot AI"
          description={`${metrics?.voice.active_agents || 3} active agents, ${(metrics?.voice.minutes_used || 215)} mins logged today`}
          icon="🎙️"
          badge={`₹${(metrics?.voice.wallet_balance || 4850).toLocaleString()} Wallet`}
          route="/products/voice"
          accentColor="#a855f7"
        />
        <ProductActionCard
          title="GAP SocialPilot"
          description={`${metrics?.social.connected_accounts || 3} channels active, ${metrics?.social.scheduled_posts || 1} post queued`}
          icon="🌐"
          badge="Sync Active"
          route="/products/social"
          accentColor="#ec4899"
        />
        <ProductActionCard
          title="GAP Telegram Suite"
          description={`${metrics?.telegram.active_sessions || 101} bot sessions, ₹${(metrics?.telegram.monthly_revenue || 92500).toLocaleString()} Telesub MRR`}
          icon="✈️"
          badge="Monetized"
          route="/products/telegram"
          accentColor="#0ea5e9"
        />

        {/* Recent Ecosystem Timeline */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#cbd5e1' : '#475569' }]}>Recent Ecosystem Activity Feed</Text>
        <View style={[styles.activityBox, isDark ? styles.activityBoxDark : styles.activityBoxLight]}>
          {data?.recent_activity?.map((act) => (
            <ActivityFeedItem
              key={act.id}
              product={act.product}
              title={act.title}
              description={act.description}
              timestamp={act.timestamp}
              status={act.status}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  stateSubtitle: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  errorIcon: {
    fontSize: 40,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 8,
  },
  headerInfo: {
    flex: 1,
  },
  orgName: {
    fontSize: 12.5,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: -0.4,
  },
  subBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  subDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#818cf8',
    marginRight: 6,
  },
  subText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 18,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  activityBox: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  activityBoxDark: {
    backgroundColor: '#0b1329',
    borderColor: '#1e293b',
  },
  activityBoxLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
});

