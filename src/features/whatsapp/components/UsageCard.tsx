import React from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { WhatsAppUsage } from '../types';

interface UsageCardProps {
  usage?: WhatsAppUsage;
  isLoading?: boolean;
}

export const UsageCard: React.FC<UsageCardProps> = ({ usage, isLoading }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const balance = usage ? `₹${usage.credits_balance.toFixed(2)}` : isLoading ? '₹...' : '₹0.00';
  const sent = usage?.messages_sent ?? 0;
  const delivered = usage?.messages_delivered ?? 0;
  const failed = usage?.messages_failed ?? 0;

  const deliveryRate = sent > 0 ? Math.round((delivered / sent) * 100) : (isLoading ? 0 : 100);

  return (
    <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.label, { color: isDark ? '#94a3b8' : '#64748b' }]}>WhatsApp Cloud Wallet</Text>
          <Text style={[styles.balance, { color: isDark ? '#ffffff' : '#0f172a' }]}>{balance}</Text>
        </View>

        <View style={styles.safeBadge}>
          <Text style={styles.safeText}>Authoritative</Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]} />

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Sent</Text>
          <Text style={[styles.statNumber, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{sent.toLocaleString()}</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Delivered</Text>
          <Text style={[styles.statNumber, { color: '#10b981' }]}>
            {delivered.toLocaleString()}
          </Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Failed</Text>
          <Text style={[styles.statNumber, { color: failed > 0 ? '#ef4444' : isDark ? '#64748b' : '#94a3b8' }]}>
            {failed.toLocaleString()}
          </Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Delivery %</Text>
          <Text style={[styles.statNumber, { color: '#0284c7' }]}>{deliveryRate}%</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardDark: {
    backgroundColor: '#0b1329',
    borderColor: '#1e293b',
  },
  cardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  balance: {
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
    fontSize: 14,
    fontWeight: '800',
  },
});
