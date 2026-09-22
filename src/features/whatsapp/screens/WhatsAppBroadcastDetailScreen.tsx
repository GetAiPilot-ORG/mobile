import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../contexts/ThemeContext';

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
  const { isDark } = useTheme();

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
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={[styles.safeArea, { backgroundColor: isDark ? '#000000' : '#F8F9FA' }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDark ? '#F8FAFC' : '#0A84FF'} />
          <Text style={[styles.loadingText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Loading broadcast analytics...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!broadcast) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={[styles.safeArea, { backgroundColor: isDark ? '#000000' : '#F8F9FA' }]}
      >
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
  const isScheduled = broadcast.status === 'scheduled';

  const statusBg = isCompleted
    ? isDark ? 'rgba(52, 199, 89, 0.16)' : 'rgba(52, 199, 89, 0.12)'
    : isQueued
    ? isDark ? 'rgba(10, 132, 255, 0.16)' : 'rgba(0, 122, 255, 0.12)'
    : isScheduled
    ? isDark ? 'rgba(255, 159, 10, 0.16)' : 'rgba(255, 149, 0, 0.12)'
    : isDark ? 'rgba(255, 69, 58, 0.16)' : 'rgba(255, 59, 48, 0.12)';

  const statusText = isCompleted
    ? isDark ? '#30D158' : '#248A3D'
    : isQueued
    ? isDark ? '#0A84FF' : '#007AFF'
    : isScheduled
    ? isDark ? '#FF9F0A' : '#D97706'
    : isDark ? '#FF453A' : '#DC2626';

  const deliveryRate =
    broadcast.sent_count > 0
      ? Math.round((broadcast.delivered_count / broadcast.sent_count) * 100)
      : 0;
  const readRate =
    broadcast.sent_count > 0 ? Math.round((broadcast.read_count / broadcast.sent_count) * 100) : 0;

  const funnelSteps = [
    {
      label: 'Total Audience',
      value: broadcast.recipients_count.toLocaleString(),
      icon: 'people-outline' as const,
      iconColor: isDark ? '#94A3B8' : '#64748B',
      bgColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
    },
    {
      label: 'Dispatched / Sent',
      value: broadcast.sent_count.toLocaleString(),
      icon: 'paper-plane-outline' as const,
      iconColor: '#0A84FF',
      bgColor: isDark ? 'rgba(10, 132, 255, 0.12)' : 'rgba(0, 122, 255, 0.08)',
    },
    {
      label: `Delivered (${deliveryRate}%)`,
      value: broadcast.delivered_count.toLocaleString(),
      icon: 'checkmark-done-outline' as const,
      iconColor: isDark ? '#30D158' : '#248A3D',
      bgColor: isDark ? 'rgba(52, 199, 89, 0.12)' : 'rgba(52, 199, 89, 0.08)',
    },
    {
      label: `Read / Opened (${readRate}%)`,
      value: broadcast.read_count.toLocaleString(),
      icon: 'mail-open-outline' as const,
      iconColor: isDark ? '#38BDF8' : '#0284C7',
      bgColor: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(2, 132, 199, 0.08)',
    },
    ...(broadcast.failed_count > 0
      ? [
          {
            label: 'Failed / Undelivered',
            value: broadcast.failed_count.toLocaleString(),
            icon: 'alert-circle-outline' as const,
            iconColor: isDark ? '#FF453A' : '#DC2626',
            bgColor: isDark ? 'rgba(255, 69, 58, 0.12)' : 'rgba(220, 38, 38, 0.08)',
          },
        ]
      : []),
  ];

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: isDark ? '#000000' : '#F8F9FA' }]}
    >
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

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Campaign Summary Card */}
        <View style={[styles.summaryCard, isDark ? styles.cardDark : styles.cardLight]}>
          <View style={styles.summaryTopRow}>
            <Text style={[styles.summaryLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
              Execution Status
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <Text style={[styles.statusText, { color: statusText }]}>
                {broadcast.status.charAt(0).toUpperCase() + broadcast.status.slice(1).toLowerCase()}
              </Text>
            </View>
          </View>
          <Text style={[styles.campaignName, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
            {broadcast.name}
          </Text>
          <Text
            style={[styles.templateDetail, isDark ? styles.textSecondaryDark : styles.textSecondaryLight]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            Template: {broadcast.template_name} ({broadcast.template_language})
          </Text>
        </View>

        {/* Funnel Telemetry Breakdown */}
        <Text style={[styles.sectionTitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
          Delivery Funnel
        </Text>
        <View style={[styles.funnelGroup, isDark ? styles.cardDark : styles.cardLight]}>
          {funnelSteps.map((step, index) => (
            <React.Fragment key={step.label}>
              <View style={styles.funnelRow}>
                <View style={[styles.funnelIconBox, { backgroundColor: step.bgColor }]}>
                  <Ionicons name={step.icon} size={18} color={step.iconColor} />
                </View>
                <View style={styles.funnelTextCol}>
                  <Text style={[styles.funnelLabel, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                    {step.label}
                  </Text>
                </View>
                <Text style={[styles.funnelValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                  {step.value}
                </Text>
              </View>
              {index < funnelSteps.length - 1 && (
                <View style={[styles.divider, isDark ? styles.dividerDark : styles.dividerLight]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Campaign Metadata Details */}
        <Text style={[styles.sectionTitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
          Campaign Details
        </Text>
        <View style={[styles.metaGroup, isDark ? styles.cardDark : styles.cardLight]}>
          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, isDark ? styles.textSecondaryDark : styles.textSecondaryLight]}>
              Audience Segment
            </Text>
            <Text style={[styles.metaValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
              {broadcast.audience_tag || 'All Contacts'}
            </Text>
          </View>
          <View style={[styles.divider, isDark ? styles.dividerDark : styles.dividerLight]} />

          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, isDark ? styles.textSecondaryDark : styles.textSecondaryLight]}>
              Audience Type
            </Text>
            <Text style={[styles.metaValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
              {broadcast.audience_type
                ? broadcast.audience_type.charAt(0).toUpperCase() + broadcast.audience_type.slice(1).toLowerCase()
                : 'Custom'}
            </Text>
          </View>
          <View style={[styles.divider, isDark ? styles.dividerDark : styles.dividerLight]} />

          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, isDark ? styles.textSecondaryDark : styles.textSecondaryLight]}>
              Cost Incurred
            </Text>
            <Text style={[styles.metaValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
              ₹{((broadcast.actual_cost_paise || broadcast.estimated_cost_paise || 0) / 100).toFixed(2)}
            </Text>
          </View>
          <View style={[styles.divider, isDark ? styles.dividerDark : styles.dividerLight]} />

          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, isDark ? styles.textSecondaryDark : styles.textSecondaryLight]}>
              Created At
            </Text>
            <Text style={[styles.metaValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
              {new Date(broadcast.created_at).toLocaleString()}
            </Text>
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
    paddingBottom: 140, // Ensure content scrolls comfortably past floating bottom bar
  },
  cardDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 20,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  campaignName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  templateDetail: {
    fontSize: 12.5,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 10,
    marginLeft: 4,
  },
  funnelGroup: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: 20,
  },
  funnelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  funnelIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  funnelTextCol: {
    flex: 1,
  },
  funnelLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  funnelValue: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  metaGroup: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  metaLabel: {
    fontSize: 13.5,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  metaValue: {
    fontSize: 13.5,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  dividerDark: {
    backgroundColor: '#2C2C2E',
  },
  dividerLight: {
    backgroundColor: '#E5E7EB',
  },
  textPrimaryDark: {
    color: '#F8FAFC',
  },
  textPrimaryLight: {
    color: '#0F172A',
  },
  textSecondaryDark: {
    color: '#94A3B8',
  },
  textSecondaryLight: {
    color: '#64748B',
  },
  textMutedDark: {
    color: '#64748B',
  },
  textMutedLight: {
    color: '#94A3B8',
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
