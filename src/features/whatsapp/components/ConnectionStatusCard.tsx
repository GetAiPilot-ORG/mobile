import React from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { WhatsAppConnection } from '../types';

interface ConnectionStatusCardProps {
  connection?: WhatsAppConnection;
  isLoading?: boolean;
}

export const ConnectionStatusCard: React.FC<ConnectionStatusCardProps> = ({
  connection,
  isLoading,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const isConnected = connection?.connected ?? true;
  const ratingColor =
    connection?.quality_rating === 'GREEN'
      ? '#10b981'
      : connection?.quality_rating === 'YELLOW'
      ? '#f59e0b'
      : '#ef4444';

  return (
    <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
      <View style={styles.headerRow}>
        <View style={styles.badgeContainer}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#10b981' : '#ef4444' }]} />
          <Text style={styles.statusText}>{isConnected ? 'Meta Cloud Connected' : 'Disconnected'}</Text>
        </View>

        <View style={[styles.qualityBadge, { borderColor: ratingColor }]}>
          <Text style={[styles.qualityText, { color: ratingColor }]}>
            Quality: {connection?.quality_rating || 'GREEN'}
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Text style={[styles.displayName, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
          {connection?.display_name || 'GetAiPilot Verified Business'}
        </Text>
        <Text style={[styles.phoneNumber, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          {connection?.phone_number || '+91 98765 43210'}
        </Text>
      </View>

      <View style={[styles.footerRow, { borderTopColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
        <Text style={styles.limitLabel}>
          Tier Limit: <Text style={[styles.limitValue, { color: isDark ? '#cbd5e1' : '#334155' }]}>{connection?.messaging_limit || 'TIER_10K'} / 24h</Text>
        </Text>
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
    backgroundColor: '#0f172a',
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '700',
  },
  qualityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  qualityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  infoRow: {
    marginBottom: 10,
  },
  displayName: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 2,
  },
  phoneNumber: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  footerRow: {
    borderTopWidth: 1,
    paddingTop: 8,
  },
  limitLabel: {
    color: '#64748b',
    fontSize: 12,
  },
  limitValue: {
    fontWeight: '700',
  },
});
