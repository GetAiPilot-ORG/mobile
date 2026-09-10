import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const handleBack = onBack || (() => router.back());

  const { data: broadcastsData, isLoading } = useWhatsAppBroadcasts();
  const broadcast = initialBroadcast || broadcastsData?.broadcasts.find((b) => b.id === broadcastId);

  if (isLoading && !broadcast) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#020617' : '#f8fafc' }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={[styles.loadingText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            Loading broadcast analytics...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!broadcast) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#020617' : '#f8fafc' }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
            Broadcast campaign not found
          </Text>
          <Pressable
            style={[styles.backButton, isDark ? styles.backButtonDark : styles.backButtonLight]}
            onPress={handleBack}
          >
            <Text style={[styles.backText, { color: isDark ? '#818cf8' : '#4f46e5' }]}>
              ← Return to Broadcasts
            </Text>
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#020617' : '#f8fafc' }]}>
      <View style={[styles.header, isDark ? styles.headerDark : styles.headerLight]}>
        <Pressable
          style={[styles.backButton, isDark ? styles.backButtonDark : styles.backButtonLight]}
          onPress={handleBack}
        >
          <Text style={[styles.backText, { color: isDark ? '#818cf8' : '#4f46e5' }]}>← Back</Text>
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.title, { color: isDark ? '#f8fafc' : '#0f172a' }]} numberOfLines={1}>
            {broadcast.name}
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>Campaign Analytics</Text>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Status Card */}
        <View style={[styles.statusCard, isDark ? styles.statusCardDark : styles.statusCardLight]}>
          <View style={styles.statusHeader}>
            <Text style={[styles.statusLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Execution Status</Text>
            <View style={[styles.statusBadge, { borderColor: statusColor, backgroundColor: `${statusColor}1A` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {broadcast.status.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={[styles.campaignName, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{broadcast.name}</Text>
          <Text style={[styles.templateDetail, { color: isDark ? '#64748b' : '#64748b' }]}>
            Template: {broadcast.template_name} ({broadcast.template_language})
          </Text>
        </View>

        {/* Funnel Telemetry Breakdown */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>Delivery Funnel</Text>
        <View style={[styles.funnelContainer, isDark ? styles.funnelContainerDark : styles.funnelContainerLight]}>
          <View style={[styles.funnelItem, isDark ? styles.funnelItemDark : styles.funnelItemLight]}>
            <Text style={[styles.funnelLabel, { color: isDark ? '#cbd5e1' : '#334155' }]}>Total Audience</Text>
            <Text style={[styles.funnelValue, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
              {broadcast.recipients_count.toLocaleString()}
            </Text>
          </View>
          <View style={styles.funnelArrow}><Text style={[styles.arrowText, { color: isDark ? '#475569' : '#94a3b8' }]}>↓</Text></View>

          <View style={[styles.funnelItem, isDark ? styles.funnelItemDark : styles.funnelItemLight]}>
            <Text style={[styles.funnelLabel, { color: isDark ? '#cbd5e1' : '#334155' }]}>Dispatched / Sent</Text>
            <Text style={[styles.funnelValue, { color: '#6366f1' }]}>
              {broadcast.sent_count.toLocaleString()}
            </Text>
          </View>
          <View style={styles.funnelArrow}><Text style={[styles.arrowText, { color: isDark ? '#475569' : '#94a3b8' }]}>↓</Text></View>

          <View style={[styles.funnelItem, isDark ? styles.funnelItemDark : styles.funnelItemLight]}>
            <Text style={[styles.funnelLabel, { color: isDark ? '#cbd5e1' : '#334155' }]}>
              Delivered ({deliveryRate}%)
            </Text>
            <Text style={[styles.funnelValue, { color: '#10b981' }]}>
              {broadcast.delivered_count.toLocaleString()}
            </Text>
          </View>
          <View style={styles.funnelArrow}><Text style={[styles.arrowText, { color: isDark ? '#475569' : '#94a3b8' }]}>↓</Text></View>

          <View style={[styles.funnelItem, isDark ? styles.funnelItemDark : styles.funnelItemLight]}>
            <Text style={[styles.funnelLabel, { color: isDark ? '#cbd5e1' : '#334155' }]}>
              Read / Opened ({readRate}%)
            </Text>
            <Text style={[styles.funnelValue, { color: isDark ? '#38bdf8' : '#0284c7' }]}>
              {broadcast.read_count.toLocaleString()}
            </Text>
          </View>

          {broadcast.failed_count > 0 ? (
            <View style={[styles.funnelItem, isDark ? styles.funnelItemDark : styles.funnelItemLight, { marginTop: 8, borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
              <Text style={[styles.funnelLabel, { color: isDark ? '#cbd5e1' : '#334155' }]}>Failed / Undelivered</Text>
              <Text style={[styles.funnelValue, { color: '#ef4444' }]}>
                {broadcast.failed_count.toLocaleString()}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Metadata Card */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>Campaign Details</Text>
        <View style={[styles.metaCard, isDark ? styles.metaCardDark : styles.metaCardLight]}>
          <View style={[styles.metaRow, { borderBottomColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
            <Text style={[styles.metaLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Audience Segment</Text>
            <Text style={[styles.metaValue, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{broadcast.audience_tag || 'All Contacts'}</Text>
          </View>
          <View style={[styles.metaRow, { borderBottomColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
            <Text style={[styles.metaLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Audience Type</Text>
            <Text style={[styles.metaValue, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{broadcast.audience_type.toUpperCase()}</Text>
          </View>
          <View style={[styles.metaRow, { borderBottomColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
            <Text style={[styles.metaLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Cost Incurred</Text>
            <Text style={[styles.metaValue, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
              ₹{((broadcast.actual_cost_paise || broadcast.estimated_cost_paise || 0) / 100).toFixed(2)}
            </Text>
          </View>
          <View style={[styles.metaRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.metaLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Created At</Text>
            <Text style={[styles.metaValue, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{new Date(broadcast.created_at).toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerDark: {
    backgroundColor: '#0b1329',
    borderBottomColor: '#1e293b',
  },
  headerLight: {
    backgroundColor: '#ffffff',
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 12,
  },
  backButtonDark: {
    backgroundColor: '#1e293b',
  },
  backButtonLight: {
    backgroundColor: '#f1f5f9',
  },
  backText: {
    fontSize: 13,
    fontWeight: '700',
  },
  headerTitleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  statusCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  statusCardDark: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  statusCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
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
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  templateDetail: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  funnelContainer: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  funnelContainerDark: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  funnelContainerLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  funnelItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  funnelItemDark: {
    backgroundColor: '#020617',
    borderColor: '#1e293b',
  },
  funnelItemLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  funnelLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  funnelValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  funnelArrow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  arrowText: {
    fontSize: 14,
    fontWeight: '800',
  },
  metaCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  metaCardDark: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  metaCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  metaLabel: {
    fontSize: 13,
  },
  metaValue: {
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
    fontSize: 14,
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
});
