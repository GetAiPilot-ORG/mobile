import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAccountPalette } from './AccountUIComponents';

interface AccountHeaderProps {
  displayName: string;
  email: string;
  phone?: string;
  initials: string;
  isAdmin: boolean;
  isActive: boolean;
  planLabel: string;
  isDark: boolean;
}

export const AccountHeader: React.FC<AccountHeaderProps> = ({
  displayName,
  email,
  phone,
  initials,
  isAdmin,
  isActive,
  planLabel,
  isDark,
}) => {
  const palette = getAccountPalette(isDark);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: palette.card,
          borderColor: palette.border,
        },
      ]}
    >
      {/* Top Profile Summary */}
      <View style={styles.topRow}>
        {/* Avatar */}
        <View
          style={[
            styles.avatarCircle,
            {
              backgroundColor: isDark ? 'rgba(185, 168, 255, 0.18)' : '#EEE8FF',
              borderColor: isDark ? 'rgba(185, 168, 255, 0.3)' : '#DDD4FA',
            },
          ]}
        >
          <Text
            style={[
              styles.avatarText,
              { color: isDark ? '#B9A8FF' : '#7055E8' },
            ]}
          >
            {initials}
          </Text>
        </View>

        {/* User Details */}
        <View style={styles.infoCol}>
          <Text
            style={[styles.userName, { color: palette.textPrimary }]}
            numberOfLines={1}
          >
            {displayName}
          </Text>
          <Text
            style={[styles.userEmail, { color: palette.textSecondary }]}
            numberOfLines={1}
          >
            {email || phone || 'GetAiPilot User'}
          </Text>

          {/* Badges Row */}
          <View style={styles.badgesRow}>
            <View
              style={[
                styles.badgePill,
                {
                  backgroundColor: isDark ? 'rgba(112, 85, 232, 0.16)' : '#F0ECFF',
                  borderColor: isDark ? 'rgba(112, 85, 232, 0.28)' : '#E0D7FA',
                },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={11}
                color={isDark ? '#B9A8FF' : '#7055E8'}
              />
              <Text
                style={[
                  styles.badgeText,
                  { color: isDark ? '#B9A8FF' : '#7055E8' },
                ]}
              >
                Verified
              </Text>
            </View>

            {isAdmin ? (
              <View
                style={[
                  styles.badgePill,
                  {
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7',
                    borderColor: isDark ? 'rgba(16, 185, 129, 0.28)' : '#BBF7D0',
                  },
                ]}
              >
                <Ionicons name="shield-checkmark" size={11} color="#16A34A" />
                <Text style={[styles.badgeText, { color: '#16A34A' }]}>Admin</Text>
              </View>
            ) : (
              <View
                style={[
                  styles.badgePill,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F0EEF8',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#EAEBF2',
                  },
                ]}
              >
                <Text style={[styles.badgeText, { color: palette.textSecondary }]}>
                  Member
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: palette.divider }]} />

      {/* Bottom Status & Plan Row */}
      <View style={styles.bottomStatsRow}>
        <View style={styles.statCol}>
          <Text style={[styles.statLabel, { color: palette.textSecondary }]}>
            Status
          </Text>
          <View style={styles.statusIndicatorRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isActive ? '#16A34A' : '#73798B' },
              ]}
            />
            <Text
              style={[
                styles.statValue,
                { color: isActive ? '#16A34A' : palette.textSecondary },
              ]}
            >
              {isActive ? 'Active' : 'Free User'}
            </Text>
          </View>
        </View>

        <View style={[styles.statCol, { alignItems: 'flex-end' }]}>
          <Text style={[styles.statLabel, { color: palette.textSecondary }]}>
            Active Plan
          </Text>
          <Text
            style={[
              styles.statValue,
              { color: isActive ? (isDark ? '#B9A8FF' : '#7055E8') : palette.textSecondary },
            ]}
          >
            {isActive ? (planLabel || 'Pro') : 'Free'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  infoCol: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  userEmail: {
    fontSize: 12.5,
    fontWeight: '400',
    marginTop: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    paddingHorizontal: 7.5,
    paddingVertical: 2.5,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 13,
  },
  bottomStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statCol: {
    gap: 3,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statValue: {
    fontSize: 13.5,
    fontWeight: '600',
  },
});

