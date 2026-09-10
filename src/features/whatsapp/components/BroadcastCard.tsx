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
  const statusColor = isCompleted ? '#10b981' : isQueued ? '#6366f1' : isScheduled ? '#f59e0b' : '#ef4444';

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
          <Text style={[styles.name, { color: isDark ? '#f8fafc' : '#0f172a' }]} numberOfLines={1}>
            {broadcast.name}
          </Text>
          <Text style={[styles.templateName, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            Template: {broadcast.template_name} ({broadcast.template_language})
          </Text>
        </View>

        <View style={[styles.statusBadge, { borderColor: statusColor, backgroundColor: `${statusColor}1A` }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {broadcast.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Metrics Row */}
      <View style={[styles.metricsRow, isDark ? styles.metricsRowDark : styles.metricsRowLight]}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Audience</Text>
          <Text style={[styles.metricValue, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
            {broadcast.recipients_count.toLocaleString()}
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Delivered</Text>
          <Text style={[styles.metricValue, { color: '#10b981' }]}>
            {broadcast.delivered_count.toLocaleString()}
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Read</Text>
          <Text style={[styles.metricValue, { color: isDark ? '#38bdf8' : '#0284c7' }]}>
            {broadcast.read_count.toLocaleString()}
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Success Rate</Text>
          <Text style={[styles.metricValue, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{deliveryRate}%</Text>
        </View>
      </View>

      {broadcast.estimated_cost_paise ? (
        <View style={[styles.footerRow, { borderTopColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
          <Text style={[styles.costText, { color: isDark ? '#a5b4fc' : '#4f46e5' }]}>
            Cost: ₹{((broadcast.actual_cost_paise || broadcast.estimated_cost_paise) / 100).toFixed(2)}
          </Text>
          <Text style={[styles.dateText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
            {new Date(broadcast.created_at).toLocaleDateString()}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  cardDark: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  cardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.8,
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
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  templateName: {
    fontSize: 11,
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
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  metricsRowDark: {
    backgroundColor: '#020617',
  },
  metricsRowLight: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  costText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 11,
  },
});
