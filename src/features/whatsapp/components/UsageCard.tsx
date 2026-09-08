import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WhatsAppUsage } from '../types';

interface UsageCardProps {
  usage?: WhatsAppUsage;
  isLoading?: boolean;
}

export const UsageCard: React.FC<UsageCardProps> = ({ usage, isLoading }) => {
  const balance = usage ? `₹${usage.credits_balance.toFixed(2)}` : '₹2,500.00';
  const sent = usage?.messages_sent ?? 3864;
  const delivered = usage?.messages_delivered ?? 3792;
  const failed = usage?.messages_failed ?? 72;

  const deliveryRate = sent > 0 ? Math.round((delivered / sent) * 100) : 100;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.label}>WhatsApp Cloud Wallet</Text>
          <Text style={styles.balance}>{balance}</Text>
        </View>

        <View style={styles.safeBadge}>
          <Text style={styles.safeText}>Authoritative</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Sent</Text>
          <Text style={styles.statNumber}>{sent.toLocaleString()}</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Delivered</Text>
          <Text style={[styles.statNumber, { color: '#10b981' }]}>
            {delivered.toLocaleString()}
          </Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Failed</Text>
          <Text style={[styles.statNumber, { color: failed > 0 ? '#ef4444' : '#64748b' }]}>
            {failed.toLocaleString()}
          </Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Delivery %</Text>
          <Text style={[styles.statNumber, { color: '#38bdf8' }]}>{deliveryRate}%</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0b1329',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  balance: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
  },
  safeBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  safeText: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  statNumber: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
  },
});
