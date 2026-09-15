import React from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { WhatsAppBroadcast } from '../types';

interface BroadcastCardProps {
  broadcast: WhatsAppBroadcast;
  onPress?: (broadcast: WhatsAppBroadcast) => void;
}

export const BroadcastCard: React.FC<BroadcastCardProps> = ({ broadcast, onPress }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const isCompleted = broadcast.status === 'completed';
  const isQueued = broadcast.status === 'queued' || broadcast.status === 'preparing';
  const isScheduled = broadcast.status === 'scheduled';

  // Subtle Apple HIG status colors & backgrounds
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

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isDark ? styles.cardDark : styles.cardLight,
        pressed && styles.cardPressed,
      ]}
      onPress={() => onPress && onPress(broadcast)}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={[styles.name, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]} numberOfLines={1}>
            {broadcast.name}
          </Text>
          <Text
            style={[styles.templateName, isDark ? styles.textSecondaryDark : styles.textSecondaryLight]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            Template: {broadcast.template_name} ({broadcast.template_language})
          </Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
          <Text style={[styles.statusText, { color: statusText }]}>
            {broadcast.status.charAt(0).toUpperCase() + broadcast.status.slice(1).toLowerCase()}
          </Text>
        </View>
      </View>

      {/* Metrics Row - Clean iOS Inset Box */}
      <View style={[styles.metricsRow, isDark ? styles.metricsRowDark : styles.metricsRowLight]}>
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Audience</Text>
          <Text style={[styles.metricValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
            {broadcast.recipients_count.toLocaleString()}
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Delivered</Text>
          <Text style={[styles.metricValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
            {broadcast.delivered_count.toLocaleString()}
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Read</Text>
          <Text style={[styles.metricValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
            {broadcast.read_count.toLocaleString()}
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Success Rate</Text>
          <Text style={[styles.metricValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
            {deliveryRate}%
          </Text>
        </View>
      </View>

      {/* Footer without harsh divider lines */}
      <View style={styles.footerRow}>
        <Text style={[styles.costText, isDark ? styles.textSecondaryDark : styles.textSecondaryLight]}>
          Cost: ₹{((broadcast.actual_cost_paise || broadcast.estimated_cost_paise || 0) / 100).toFixed(2)}
        </Text>
        <Text style={[styles.dateText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
          {new Date(broadcast.created_at).toLocaleDateString()}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
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
  cardPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  templateName: {
    fontSize: 12,
    fontWeight: '500',
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
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  metricsRowDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  metricsRowLight: {
    backgroundColor: '#F8F9FA',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: -0.1,
    marginBottom: 3,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  costText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  dateText: {
    fontSize: 11.5,
    fontWeight: '400',
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
});
