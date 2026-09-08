import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useWhatsAppBroadcasts } from '../hooks/useWhatsAppBroadcasts';
import { WhatsAppBroadcast } from '../types';

interface WhatsAppBroadcastDetailScreenProps {
  broadcast?: WhatsAppBroadcast;
  broadcastId?: string;
  onBack?: () => void;
}

export const WhatsAppBroadcastDetailScreen: React.FC<WhatsAppBroadcastDetailScreenProps> = ({
  broadcast: initialBroadcast,
  broadcastId,
  onBack,
}) => {
  const router = useRouter();
  const handleBack = onBack || (() => router.back());

  const { data: broadcastsData, isLoading } = useWhatsAppBroadcasts();
  const broadcast = initialBroadcast || broadcastsData?.broadcasts.find((b) => b.id === broadcastId);

  if (isLoading && !broadcast) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.loadingText}>Loading broadcast analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!broadcast) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Broadcast campaign not found</Text>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backText}>← Return to Broadcasts</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isCompleted = broadcast.status === 'completed';
  const isQueued = broadcast.status === 'queued' || broadcast.status === 'preparing';
  const statusColor = isCompleted ? '#10b981' : isQueued ? '#6366f1' : '#ef4444';

  const deliveryRate =
    broadcast.sent_count > 0
      ? Math.round((broadcast.delivered_count / broadcast.sent_count) * 100)
      : 0;
  const readRate =
    broadcast.sent_count > 0 ? Math.round((broadcast.read_count / broadcast.sent_count) * 100) : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {broadcast.name}
          </Text>
          <Text style={styles.subtitle}>Campaign Analytics</Text>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusLabel}>Execution Status</Text>
            <View style={[styles.statusBadge, { borderColor: statusColor, backgroundColor: `${statusColor}1A` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {broadcast.status.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.campaignName}>{broadcast.name}</Text>
          <Text style={styles.templateDetail}>
            Template: {broadcast.template_name} ({broadcast.template_language})
          </Text>
        </View>

        {/* Funnel Telemetry Breakdown */}
        <Text style={styles.sectionTitle}>Delivery Funnel</Text>
        <View style={styles.funnelContainer}>
          <View style={styles.funnelItem}>
            <Text style={styles.funnelLabel}>Total Audience</Text>
            <Text style={styles.funnelValue}>{broadcast.recipients_count.toLocaleString()}</Text>
          </View>
          <View style={styles.funnelArrow}><Text style={styles.arrowText}>↓</Text></View>

          <View style={styles.funnelItem}>
            <Text style={styles.funnelLabel}>Dispatched / Sent</Text>
            <Text style={[styles.funnelValue, { color: '#6366f1' }]}>
              {broadcast.sent_count.toLocaleString()}
            </Text>
          </View>
          <View style={styles.funnelArrow}><Text style={styles.arrowText}>↓</Text></View>

          <View style={styles.funnelItem}>
            <Text style={styles.funnelLabel}>Delivered ({deliveryRate}%)</Text>
            <Text style={[styles.funnelValue, { color: '#10b981' }]}>
              {broadcast.delivered_count.toLocaleString()}
            </Text>
          </View>
          <View style={styles.funnelArrow}><Text style={styles.arrowText}>↓</Text></View>

          <View style={styles.funnelItem}>
            <Text style={styles.funnelLabel}>Read / Opened ({readRate}%)</Text>
            <Text style={[styles.funnelValue, { color: '#38bdf8' }]}>
              {broadcast.read_count.toLocaleString()}
            </Text>
          </View>

          {broadcast.failed_count > 0 ? (
            <View style={[styles.funnelItem, { marginTop: 8, borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
              <Text style={styles.funnelLabel}>Failed / Undelivered</Text>
              <Text style={[styles.funnelValue, { color: '#ef4444' }]}>
                {broadcast.failed_count.toLocaleString()}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Metadata Card */}
        <Text style={styles.sectionTitle}>Campaign Details</Text>
        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Audience Segment</Text>
            <Text style={styles.metaValue}>{broadcast.audience_tag || 'All Contacts'}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Audience Type</Text>
            <Text style={styles.metaValue}>{broadcast.audience_type.toUpperCase()}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Cost Incurred</Text>
            <Text style={styles.metaValue}>
              ₹{((broadcast.actual_cost_paise || broadcast.estimated_cost_paise || 0) / 100).toFixed(2)}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Created At</Text>
            <Text style={styles.metaValue}>{new Date(broadcast.created_at).toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    marginRight: 12,
  },
  backText: {
    color: '#818cf8',
    fontSize: 13,
    fontWeight: '700',
  },
  headerTitleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 11,
    color: '#94a3b8',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  statusCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  campaignName: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  templateDetail: {
    color: '#64748b',
    fontSize: 12,
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  funnelContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 20,
  },
  funnelItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#020617',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  funnelLabel: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  funnelValue: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
  },
  funnelArrow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  arrowText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '800',
  },
  metaCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  metaLabel: {
    color: '#94a3b8',
    fontSize: 13,
  },
  metaValue: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 12,
  },
  errorText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
});
