import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { getAccountPalette } from './AccountUIComponents';

export interface AccountHeaderProps {
  displayName: string;
  email: string;
  phone?: string;
  backupEmail?: string;
  initials: string;
  avatarUrl?: string | null;
  isAdmin: boolean;
  isActive: boolean;
  planLabel: string;
  quotaPercent?: number; // e.g. 68
  renewalDateText?: string; // e.g. "Renews in 24 days"
  memberSince?: string; // e.g. "Oct 2024"
  connectedAppsCount?: number; // e.g. 5
  deviceCount?: number; // e.g. 2
  isDark: boolean;
  onEditAvatar?: () => void;
  onEditProfile?: () => void;
  onPressPlan?: () => void;
  onPressDevices?: () => void;
  onPressApps?: () => void;
}

export const AccountHeader: React.FC<AccountHeaderProps> = ({
  displayName,
  email,
  phone,
  backupEmail,
  initials,
  isAdmin,
  isActive,
  planLabel,
  quotaPercent = 68,
  renewalDateText = 'Renews in 24 days',
  memberSince = 'Oct 2024',
  connectedAppsCount = 5,
  deviceCount = 1,
  isDark,
  onEditAvatar,
  onEditProfile,
  onPressPlan,
  onPressDevices,
  onPressApps,
}) => {
  const palette = getAccountPalette(isDark);

  // 1. Sanitize Name: Trim trailing punctuation like dots/commas and spaces, fallback to email prefix
  const cleanDisplayName = useMemo(() => {
    if (!displayName) return email ? email.split('@')[0] : 'GetAiPilot User';
    const trimmed = displayName.trim().replace(/[\s.,_-]+$/, '').trim();
    return trimmed || (email ? email.split('@')[0] : 'GetAiPilot User');
  }, [displayName, email]);

  // 2. Profile Completeness Calculation
  const { completeness, missingPrompt } = useMemo(() => {
    let score = 40; // Base: email and account created
    let missing: string | null = null;

    if (cleanDisplayName && cleanDisplayName !== 'User' && cleanDisplayName !== 'GetAiPilot User') {
      score += 20;
    }

    if (phone && phone.trim().length > 4) {
      score += 20;
    } else if (!missing) {
      missing = 'Add phone number';
    }

    if (backupEmail && backupEmail.trim().length > 3) {
      score += 20;
    } else if (!missing) {
      missing = 'Add a backup email';
    }

    return {
      completeness: Math.min(100, score),
      missingPrompt: missing,
    };
  }, [cleanDisplayName, phone, backupEmail]);

  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

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
      {/* ─── Top Profile Row ──────────────────────────────────────────────── */}
      <View style={styles.topRow}>
        {/* Avatar with subtle purple gradient ring + camera edit badge */}
        <Pressable
          cssInterop={false}
          onPress={() => {
            triggerHaptic();
            onEditAvatar?.();
          }}
          accessibilityRole="button"
          accessibilityLabel="Change profile picture"
          style={styles.avatarWrapper}
        >
          <LinearGradient
            colors={isDark ? ['#A855F7', '#6366F1'] : ['#C084FC', '#818CF8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientRing}
          >
            <View
              style={[
                styles.avatarInner,
                {
                  backgroundColor: isDark ? '#231F34' : '#EEE8FF',
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
          </LinearGradient>

          {/* Small Camera/Edit Badge */}
          <View
            style={[
              styles.cameraBadge,
              {
                backgroundColor: isDark ? '#7055E8' : '#7055E8',
                borderColor: isDark ? '#1C1A25' : '#FFFFFF',
              },
            ]}
          >
            <Ionicons name="camera" size={10} color="#FFFFFF" />
          </View>
        </Pressable>

        {/* User Info Column */}
        <View style={styles.infoCol}>
          <View style={styles.nameActionRow}>
            <Text
              style={[styles.userName, { color: palette.textPrimary }]}
              numberOfLines={1}
            >
              {cleanDisplayName}
            </Text>

            {/* Pencil "Edit profile" button */}
            <Pressable
              cssInterop={false}
              onPress={() => {
                triggerHaptic();
                onEditProfile?.();
              }}
              accessibilityRole="button"
              accessibilityLabel="Edit profile details"
              style={({ pressed }) => [
                styles.editBtn,
                {
                  backgroundColor: isDark ? 'rgba(185, 168, 255, 0.12)' : '#F0ECFF',
                  borderColor: isDark ? 'rgba(185, 168, 255, 0.25)' : '#E0D7FA',
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Ionicons name="pencil" size={11} color={isDark ? '#B9A8FF' : '#7055E8'} />
              <Text
                style={[
                  styles.editBtnText,
                  { color: isDark ? '#B9A8FF' : '#7055E8' },
                ]}
              >
                Edit
              </Text>
            </Pressable>
          </View>

          <Text
            style={[styles.userEmail, { color: palette.textSecondary }]}
            numberOfLines={1}
          >
            {email || phone || 'GetAiPilot User'}
          </Text>

          {/* Badges Row (Verified & Admin) */}
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

            {/* Quick Status Dot */}
            <View
              style={[
                styles.badgePill,
                {
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
                  borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#A7F3D0',
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isActive ? '#10B981' : '#9CA3AF' },
                ]}
              />
              <Text
                style={[
                  styles.badgeText,
                  { color: isActive ? '#059669' : palette.textSecondary },
                ]}
              >
                {isActive ? 'Active' : 'Free'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ─── Profile Completeness Row (Hidden at 100%) ─────────────────────── */}
      {completeness < 100 && (
        <Pressable
          cssInterop={false}
          onPress={() => {
            triggerHaptic();
            onEditProfile?.();
          }}
          accessibilityRole="button"
          accessibilityLabel={`Profile completeness: ${completeness}%. ${missingPrompt || 'Complete profile'}. Tap to complete.`}
          style={[
            styles.completenessBox,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FBFBFE',
              borderColor: palette.divider,
            },
          ]}
        >
          <View style={styles.completenessHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="sparkles" size={13} color={isDark ? '#C084FC' : '#7055E8'} />
              <Text style={[styles.completenessTitle, { color: palette.textPrimary }]}>
                {missingPrompt || 'Complete your profile'}
              </Text>
            </View>
            <Text style={[styles.completenessPercent, { color: isDark ? '#B9A8FF' : '#7055E8' }]}>
              {completeness}% complete
            </Text>
          </View>
          <View
            style={[
              styles.completenessTrack,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#EAE6F8' },
            ]}
          >
            <View
              style={[
                styles.completenessFill,
                {
                  width: `${completeness}%`,
                  backgroundColor: isDark ? '#B9A8FF' : '#7055E8',
                },
              ]}
            />
          </View>
        </Pressable>
      )}

      {/* ─── 3 Small Tappable Pills Inside Card ────────────────────────────── */}
      <View style={styles.metricsPillsRow}>
        <View
          style={[
            styles.metricPill,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F6F5FC',
              borderColor: palette.border,
            },
          ]}
        >
          <Ionicons name="calendar-outline" size={12} color={palette.textSecondary} />
          <Text style={[styles.metricPillText, { color: palette.textSecondary }]}>
            Since {memberSince}
          </Text>
        </View>

        <Pressable
          cssInterop={false}
          onPress={() => {
            triggerHaptic();
            onPressApps?.();
          }}
          accessibilityRole="button"
          accessibilityLabel={`${connectedAppsCount} apps connected. Tap to view.`}
          style={({ pressed }) => [
            styles.metricPill,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F6F5FC',
              borderColor: palette.border,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Ionicons name="apps-outline" size={12} color={palette.primary} />
          <Text style={[styles.metricPillText, { color: palette.textPrimary, fontWeight: '600' }]}>
            {connectedAppsCount} Apps
          </Text>
        </Pressable>

        <Pressable
          cssInterop={false}
          onPress={() => {
            triggerHaptic();
            onPressDevices?.();
          }}
          accessibilityRole="button"
          accessibilityLabel={`${deviceCount} active ${deviceCount === 1 ? 'device' : 'devices'}. Tap to view security sessions.`}
          style={({ pressed }) => [
            styles.metricPill,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F6F5FC',
              borderColor: palette.border,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Ionicons name="hardware-chip-outline" size={12} color="#06B6D4" />
          <Text style={[styles.metricPillText, { color: palette.textPrimary, fontWeight: '600' }]}>
            {deviceCount} {deviceCount === 1 ? 'Device' : 'Devices'}
          </Text>
        </Pressable>
      </View>

      {/* ─── Tappable Active Plan Chip with Mini Usage Meter ────────────────── */}
      <Pressable
        cssInterop={false}
        onPress={() => {
          triggerHaptic();
          onPressPlan?.();
        }}
        accessibilityRole="button"
        accessibilityLabel={`Active plan ${isActive ? (planLabel || 'Core') : 'Free'}. ${quotaPercent}% of quota used. ${renewalDateText}. Tap to manage.`}
        style={({ pressed }) => [
          styles.planChipWrapper,
          {
            backgroundColor: isDark ? 'rgba(112, 85, 232, 0.12)' : '#F8F6FE',
            borderColor: isDark ? 'rgba(185, 168, 255, 0.22)' : '#E9E2FD',
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <View style={styles.planChipTopRow}>
          <View style={styles.planBadgeLeft}>
            <View style={[styles.diamondCircle, { backgroundColor: isDark ? 'rgba(185, 168, 255, 0.2)' : '#EEE8FF' }]}>
              <Ionicons name="diamond" size={13} color={isDark ? '#C084FC' : '#7055E8'} />
            </View>
            <View>
              <Text style={[styles.planTitleSmall, { color: palette.textSecondary }]}>
                ACTIVE PLAN
              </Text>
              <Text style={[styles.planTitleName, { color: palette.textPrimary }]}>
                GAP {isActive ? (planLabel || 'Core') : 'Free'}
              </Text>
            </View>
          </View>

          <View style={styles.planBadgeRight}>
            <Text style={[styles.planRenewalText, { color: palette.textSecondary }]}>
              {renewalDateText}
            </Text>
            <Ionicons name="chevron-forward" size={15} color={palette.textSecondary} />
          </View>
        </View>

        {/* Mini Usage Meter */}
        <View style={styles.meterContainer}>
          <View style={styles.meterHeader}>
            <Text style={[styles.meterLabel, { color: palette.textSecondary }]}>
              Monthly AI Quota
            </Text>
            <Text style={[styles.meterValue, { color: isDark ? '#B9A8FF' : '#7055E8' }]}>
              {quotaPercent}% used
            </Text>
          </View>
          <View
            style={[
              styles.meterTrack,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E6E0FA' },
            ]}
          >
            <View
              style={[
                styles.meterFill,
                {
                  width: `${Math.min(100, Math.max(0, quotaPercent))}%`,
                  backgroundColor: isDark ? '#B9A8FF' : '#7055E8',
                },
              ]}
            />
          </View>
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrapper: {
    position: 'relative',
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  infoCol: {
    flex: 1,
    gap: 2,
  },
  nameActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    flex: 1,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 12.5,
    fontWeight: '400',
    marginTop: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7.5,
    paddingVertical: 2.5,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  statusDot: {
    width: 5.5,
    height: 5.5,
    borderRadius: 2.75,
  },
  completenessBox: {
    marginTop: 14,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  completenessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  completenessTitle: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  completenessPercent: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  completenessTrack: {
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  completenessFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  metricsPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  metricPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  metricPillText: {
    fontSize: 11,
    letterSpacing: -0.1,
  },
  planChipWrapper: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  planChipTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planBadgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  diamondCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planTitleSmall: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  planTitleName: {
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  planBadgeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  planRenewalText: {
    fontSize: 11,
    fontWeight: '500',
  },
  meterContainer: {
    gap: 5,
    marginTop: 2,
  },
  meterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meterLabel: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  meterValue: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  meterTrack: {
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 2.5,
  },
});
