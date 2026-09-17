import React from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Image } from 'expo-image';
import { WhatsAppUsage } from '../types';

const moneyIcon = require('../../../../assets/images/money.png');

interface UsageCardProps {
  usage?: WhatsAppUsage;
  isLoading?: boolean;
  isConnected?: boolean;
}

export const UsageCard: React.FC<UsageCardProps> = ({ usage, isLoading, isConnected = true }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const rawBalance = usage?.credits_balance ?? 0;
  const balance = isLoading
    ? '₹...'
    : `₹${rawBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const sent = usage?.messages_sent ?? 0;
  const delivered = usage?.messages_delivered ?? 0;
  const failed = usage?.messages_failed ?? 0;

  const deliveryRate =
    sent > 0 ? Math.round((delivered / sent) * 100) : 0;

  return (
    <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
      {/* Wallet Top Header */}
      <View style={styles.topRow}>
        <View style={styles.walletHeaderLeft}>
          <View style={styles.walletIconCircle}>
            <Image source={moneyIcon} style={styles.moneyIcon} contentFit="contain" />
          </View>
          <Text style={[styles.label, isDark ? styles.textSecondaryDark : styles.textSecondaryLight]}>
            WhatsApp Cloud Wallet
          </Text>
        </View>

        <View style={styles.statusDotRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isConnected ? '#22C55E' : (isDark ? '#636366' : '#94A3B8') },
            ]}
          />
          <Text
            style={[
              styles.statusDotText,
              {
                color: isConnected
                  ? (isDark ? '#34C759' : '#16A34A')
                  : (isDark ? '#8E8E93' : '#64748B'),
              },
            ]}
          >
            {isConnected ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {/* Main Balance Display */}
      <View style={styles.balanceContainer}>
        <Text style={[styles.balance, isDark ? styles.textLight : styles.textDark]}>
          {balance}
        </Text>
      </View>

      {/* Sleek Integrated Stats Bar */}
      <View style={[styles.statsBar, isDark ? styles.statsBarDark : styles.statsBarLight]}>
        {/* Sent */}
        <View style={styles.statCol}>
          <Text style={[styles.statLabel, isDark ? styles.textSecondaryDark : styles.textSecondaryLight]}>
            Sent
          </Text>
          <Text style={[styles.statValue, isDark ? styles.textLight : styles.textDark]}>
            {sent.toLocaleString()}
          </Text>
        </View>

        <View style={[styles.colDivider, isDark ? styles.colDividerDark : styles.colDividerLight]} />

        {/* Delivered */}
        <View style={styles.statCol}>
          <Text style={[styles.statLabel, isDark ? styles.textSecondaryDark : styles.textSecondaryLight]}>
            Delivered
          </Text>
          <Text style={[styles.statValue, { color: '#22C55E' }]}>
            {delivered.toLocaleString()}
          </Text>
        </View>

        <View style={[styles.colDivider, isDark ? styles.colDividerDark : styles.colDividerLight]} />

        {/* Failed */}
        <View style={styles.statCol}>
          <Text style={[styles.statLabel, isDark ? styles.textSecondaryDark : styles.textSecondaryLight]}>
            Failed
          </Text>
          <Text
            style={[
              styles.statValue,
              { color: failed > 0 ? '#EF4444' : isDark ? '#8E8E93' : '#94A3B8' },
            ]}
          >
            {failed.toLocaleString()}
          </Text>
        </View>

        <View style={[styles.colDivider, isDark ? styles.colDividerDark : styles.colDividerLight]} />

        {/* Delivery % */}
        <View style={styles.statCol}>
          <Text style={[styles.statLabel, isDark ? styles.textSecondaryDark : styles.textSecondaryLight]}>
            Delivery %
          </Text>
          <Text style={[styles.statValue, isDark ? styles.textLight : styles.textDark]}>
            {deliveryRate}%
          </Text>
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
    marginBottom: 12,
  },
  cardDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  walletHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  walletIconCircle: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moneyIcon: {
    width: 32,
    height: 32,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  statusDotText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  balanceContainer: {
    marginTop: 2,
    marginBottom: 14,
  },
  balance: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderWidth: 1,
  },
  statsBarDark: {
    backgroundColor: '#121214',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statsBarLight: {
    backgroundColor: '#F8F9FA',
    borderColor: '#F2F4F7',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 3,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  colDivider: {
    width: StyleSheet.hairlineWidth,
    height: 22,
  },
  colDividerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  colDividerLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  textLight: {
    color: '#FFFFFF',
  },
  textDark: {
    color: '#000000',
  },
  textSecondaryDark: {
    color: '#8E8E93',
  },
  textSecondaryLight: {
    color: '#6B7280',
  },
});
