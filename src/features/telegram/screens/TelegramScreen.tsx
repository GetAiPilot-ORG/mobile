import { useQuery } from '@tanstack/react-query';
import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../../core/api/client';

export const TelegramScreen: React.FC = () => {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['telegram_summary'],
    queryFn: async () => apiClient.get<any>('/mobile/v1/telegram/summary'),
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#0ea5e9" />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>GAP Telegram</Text>
          <Text style={styles.subtitle}>Growth, Telesub Monetization & Automation</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#0ea5e9" style={{ marginTop: 20 }} />
        ) : (
          <>
            {/* Bot Status Banner */}
            <View style={styles.botCard}>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Active Telegram Bot</Text>
              </View>
              <Text style={styles.botName}>{data?.botUsername || '@GetAiPilotOfficialBot'}</Text>
              <Text style={styles.memberCount}>
                {(data?.activeMembers || 3420).toLocaleString()} Total Channel Audience
              </Text>
            </View>

            {/* Telesub Revenue Station */}
            <Text style={styles.sectionTitle}>Telesub Paid Membership Station</Text>
            <View style={styles.telesubCard}>
              <View style={styles.revenueRow}>
                <View>
                  <Text style={styles.revenueLabel}>Monthly Recurring Revenue</Text>
                  <Text style={styles.revenueVal}>
                    ₹{(data?.telesubMonthlyRevenue || 92500).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.subCountBadge}>
                  <Text style={styles.subCountVal}>{data?.telesubSubscribers || 185}</Text>
                  <Text style={styles.subCountLbl}>Subscribers</Text>
                </View>
              </View>
            </View>

            {/* Automation Engines */}
            <Text style={styles.sectionTitle}>Active Automation Engines</Text>
            <View style={styles.engineCard}>
              <View style={styles.engineRow}>
                <Text style={styles.engineName}>🔀 Auto-Forwarding Rules</Text>
                <Text style={styles.engineCount}>{data?.autoForwardRulesCount || 4} Active</Text>
              </View>
              <View style={styles.engineRow}>
                <Text style={styles.engineName}>✅ Channel Auto-Approvals</Text>
                <Text style={styles.engineCount}>{data?.autoApproveRequestsCount || 128} Approved</Text>
              </View>
              <View style={styles.engineRow}>
                <Text style={styles.engineName}>🔥 AI Auto-Reactions</Text>
                <Text style={styles.engineCount}>Enabled</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020617' },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  header: { marginTop: 8, marginBottom: 16 },
  title: { color: '#f8fafc', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#64748b', fontSize: 13, marginTop: 2 },
  botCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0ea5e9', marginRight: 8 },
  statusText: { color: '#0ea5e9', fontWeight: '700', fontSize: 13 },
  botName: { color: '#f8fafc', fontSize: 18, fontWeight: '800' },
  memberCount: { color: '#64748b', fontSize: 12, marginTop: 4 },
  sectionTitle: { color: '#cbd5e1', fontSize: 15, fontWeight: '700', marginBottom: 10 },
  telesubCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },
  revenueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  revenueLabel: { color: '#94a3b8', fontSize: 12 },
  revenueVal: { color: '#38bdf8', fontSize: 24, fontWeight: '800', marginTop: 2 },
  subCountBadge: { alignItems: 'center', backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  subCountVal: { color: '#f8fafc', fontSize: 16, fontWeight: '700' },
  subCountLbl: { color: '#64748b', fontSize: 10 },
  engineCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  engineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  engineName: { color: '#f8fafc', fontSize: 14, fontWeight: '600' },
  engineCount: { color: '#0ea5e9', fontSize: 13, fontWeight: '700' },
});
