import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useWhatsAppBroadcasts } from '../hooks/useWhatsAppBroadcasts';
import { WhatsAppBroadcast } from '../types';
import { WhatsAppHomeSkeleton } from '../../../components/skeletonScreen';

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

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const { data: broadcastsData, isLoading } = useWhatsAppBroadcasts();
  const broadcast = initialBroadcast || broadcastsData?.broadcasts.find((b) => b.id === broadcastId);

  if (isLoading && !broadcast) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#000000' : '#F8F9FA' }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#25D366" />
          <Text style={[styles.loadingText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Loading broadcast analytics...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!broadcast) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#000000' : '#F8F9FA' }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
            Broadcast campaign not found
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.backPillButton,
              isDark ? styles.backPillDark : styles.backPillLight,
              pressed && styles.backButtonPressed,
            ]}
            onPress={handleBack}
          >
            <Ionicons name="chevron-back" size={16} color={isDark ? '#F8FAFC' : '#0F172A'} style={{ marginRight: 4 }} />
            <Text style={[styles.backPillText, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
              Return to Broadcasts
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isCompleted = broadcast.status === 'completed';
  const isQueued = broadcast.status === 'queued' || broadcast.status === 'preparing';
  const statusColor = isCompleted ? '#25D366' : isQueued ? '#6366F1' : '#EF4444';

  const deliveryRate =
    broadcast.sent_count > 0
      ? Math.round((broadcast.delivered_count / broadcast.sent_count) * 100)
      : 0;
  const readRate =
    broadcast.sent_count > 0 ? Math.round((broadcast.read_count / broadcast.sent_count) * 100) : 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#000000' : '#F8F9FA' }]}>
      {/* Header matching Overview Tab */}
      <View style={[styles.header, isDark ? styles.headerDark : styles.headerLight]}>
        <View style={styles.headerLeftRow}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              isDark ? styles.backButtonDark : styles.backButtonLight,
              pressed && styles.backButtonPressed,
            ]}
            onPress={handleBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={isDark ? '#F8FAFC' : '#0F172A'}
            />
          </Pressable>
          <Text style={[styles.title, isDark ? styles.titleDark : styles.titleLight]} numberOfLines={1}>
            {broadcast.name}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Status Card */}
        <View style={[styles.statusCard, isDark ? styles.statusCardDark : styles.statusCardLight]}>
          <View style={styles.statusHeader}>
            <Text style={[styles.statusLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>Execution Status</Text>
            <View style={[styles.statusBadge, { borderColor: statusColor, backgroundColor: `${statusColor}1A` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {broadcast.status.charAt(0).toUpperCase() + broadcast.status.slice(1).toLowerCase()}
              </Text>
            </View>
          </View>
          <Text style={[styles.campaignName, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>{broadcast.name}</Text>
          <Text style={[styles.templateDetail, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Template: {broadcast.template_name} ({broadcast.template_language})
          </Text>
        </View>

        {/* Funnel Telemetry Breakdown */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>Delivery Funnel</Text>
        <View style={[styles.funnelContainer, isDark ? styles.funnelContainerDark : styles.funnelContainerLight]}>
          <View style={[styles.funnelItem, isDark ? styles.funnelItemDark : styles.funnelItemLight]}>
            <Text style={[styles.funnelLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>Total Audience</Text>
            <Text style={[styles.funnelValue, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
              {broadcast.recipients_count.toLocaleString()}
            </Text>
          </View>
          <View style={styles.funnelArrow}><Text style={[styles.arrowText, { color: isDark ? '#475569' : '#94A3B8' }]}>↓</Text></View>

          <View style={[styles.funnelItem, isDark ? styles.funnelItemDark : styles.funnelItemLight]}>
            <Text style={[styles.funnelLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>Dispatched / Sent</Text>
            <Text style={[styles.funnelValue, { color: '#6366F1' }]}>
              {broadcast.sent_count.toLocaleString()}
            </Text>
          </View>
          <View style={styles.funnelArrow}><Text style={[styles.arrowText, { color: isDark ? '#475569' : '#94A3B8' }]}>↓</Text></View>

          <View style={[styles.funnelItem, isDark ? styles.funnelItemDark : styles.funnelItemLight]}>
            <Text style={[styles.funnelLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
              Delivered ({deliveryRate}%)
            </Text>
            <Text style={[styles.funnelValue, { color: '#25D366' }]}>
              {broadcast.delivered_count.toLocaleString()}
            </Text>
          </View>
          <View style={styles.funnelArrow}><Text style={[styles.arrowText, { color: isDark ? '#475569' : '#94A3B8' }]}>↓</Text></View>

          <View style={[styles.funnelItem, isDark ? styles.funnelItemDark : styles.funnelItemLight]}>
            <Text style={[styles.funnelLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
              Read / Opened ({readRate}%)
            </Text>
            <Text style={[styles.funnelValue, { color: isDark ? '#38BDF8' : '#0284C7' }]}>
              {broadcast.read_count.toLocaleString()}
            </Text>
          </View>

          {broadcast.failed_count > 0 ? (
            <View style={[styles.funnelItem, isDark ? styles.funnelItemDark : styles.funnelItemLight, { marginTop: 8, borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
              <Text style={[styles.funnelLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>Failed / Undelivered</Text>
              <Text style={[styles.funnelValue, { color: '#EF4444' }]}>
                {broadcast.failed_count.toLocaleString()}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Metadata Card */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>Campaign Details</Text>
        <View style={[styles.metaCard, isDark ? styles.metaCardDark : styles.metaCardLight]}>
          <View style={[styles.metaRow, { borderBottomColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
            <Text style={[styles.metaLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>Audience Segment</Text>
            <Text style={[styles.metaValue, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>{broadcast.audience_tag || 'All Contacts'}</Text>
          </View>
          <View style={[styles.metaRow, { borderBottomColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
            <Text style={[styles.metaLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>Audience Type</Text>
            <Text style={[styles.metaValue, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
              {broadcast.audience_type ? broadcast.audience_type.charAt(0).toUpperCase() + broadcast.audience_type.slice(1).toLowerCase() : 'Custom'}
            </Text>
          </View>
          <View style={[styles.metaRow, { borderBottomColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
            <Text style={[styles.metaLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>Cost Incurred</Text>
            <Text style={[styles.metaValue, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
              ₹{((broadcast.actual_cost_paise || broadcast.estimated_cost_paise || 0) / 100).toFixed(2)}
            </Text>
          </View>
          <View style={[styles.metaRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.metaLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>Created At</Text>
            <Text style={[styles.metaValue, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>{new Date(broadcast.created_at).toLocaleString()}</Text>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerDark: {
    backgroundColor: '#000000',
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerLight: {
    backgroundColor: '#FFFFFF',
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  backButtonLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  backButtonDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  backButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
  backPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 12,
  },
  backPillLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  backPillDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  backPillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
    flex: 1,
  },
  titleLight: {
    color: '#0F172A',
  },
  titleDark: {
    color: '#F8FAFC',
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
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  statusCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
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
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  campaignName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  templateDetail: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  funnelContainer: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  funnelContainerDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  funnelContainerLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
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
    backgroundColor: '#121214',
    borderColor: '#2C2C2E',
  },
  funnelItemLight: {
    backgroundColor: '#F8F9FA',
    borderColor: '#E5E7EB',
  },
  funnelLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  funnelValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  funnelArrow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  arrowText: {
    fontSize: 14,
    fontWeight: '700',
  },
  metaCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  metaCardDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  metaCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  metaLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
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
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
});
