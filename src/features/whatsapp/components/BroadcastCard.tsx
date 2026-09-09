import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WhatsAppBroadcast } from '../types';

interface BroadcastCardProps {
  broadcast: WhatsAppBroadcast;
  onPress?: (broadcast: WhatsAppBroadcast) => void;
}

export const BroadcastCard: React.FC<BroadcastCardProps> = ({ broadcast, onPress }) => {
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
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress && onPress(broadcast)}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {broadcast.name}
          </Text>
          <Text style={styles.templateName}>
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
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Audience</Text>
          <Text style={styles.metricValue}>{broadcast.recipients_count.toLocaleString()}</Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Delivered</Text>
          <Text style={[styles.metricValue, { color: '#10b981' }]}>
            {broadcast.delivered_count.toLocaleString()}
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Read</Text>
          <Text style={[styles.metricValue, { color: '#38bdf8' }]}>
            {broadcast.read_count.toLocaleString()}
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Success Rate</Text>
          <Text style={styles.metricValue}>{deliveryRate}%</Text>
        </View>
      </View>

      {broadcast.estimated_cost_paise ? (
        <View style={styles.footerRow}>
          <Text style={styles.costText}>
            Cost: ₹{((broadcast.actual_cost_paise || broadcast.estimated_cost_paise) / 100).toFixed(2)}
          </Text>
          <Text style={styles.dateText}>
            {new Date(broadcast.created_at).toLocaleDateString()}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 10,
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
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  templateName: {
    color: '#94a3b8',
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
    backgroundColor: '#020617',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
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
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 8,
  },
  costText: {
    color: '#a5b4fc',
    fontSize: 11,
    fontWeight: '700',
  },
  dateText: {
    color: '#64748b',
    fontSize: 11,
  },
});
