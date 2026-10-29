import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BiometricSettings } from '../../../lib/biometrics';
import { DeviceSessionsSkeleton } from '../../../components/skeletonScreen';
import {
  AccountCard,
  SectionHeading,
  getAccountPalette,
} from './AccountUIComponents';

export interface DeviceSession {
  sessionId: string;
  platform: 'ios' | 'android' | 'web';
  deviceName: string;
  deviceType: 'phone' | 'tablet' | 'desktop' | 'tv' | 'unknown' | null;
  osVersion: string | null;
  appVersion: string | null;
  signedInAt: string;
  lastSeenAt: string;
  isOnline: boolean;
  isCurrent: boolean;
}

interface SecurityTabProps {
  biometricSettings: BiometricSettings;
  isUpdatingBiometrics: boolean;
  onToggleBiometric: (val: boolean) => void;
  onChangeTimeout: (minutes: number) => void;
  deviceSessions: DeviceSession[];
  activeDeviceCount: number;
  isLoadingDevices: boolean;
  isRefreshingDevices: boolean;
  onRefreshDevices: () => void;
  onSignOutOtherDevice: (device: DeviceSession) => void;
  signingOutDeviceId: string | null;
  onPasswordReset: () => void;
  isDark: boolean;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({
  biometricSettings,
  isUpdatingBiometrics,
  onToggleBiometric,
  onChangeTimeout,
  deviceSessions,
  activeDeviceCount,
  isLoadingDevices,
  isRefreshingDevices,
  onRefreshDevices,
  onSignOutOtherDevice,
  signingOutDeviceId,
  onPasswordReset,
  isDark,
}) => {
  const palette = getAccountPalette(isDark);

  const formatLastSeen = (device: DeviceSession) => {
    if (device.isCurrent) return 'Active now';
    const d = new Date(device.lastSeenAt);
    if (isNaN(d.getTime())) return 'Recently active';
    return `Active ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  };

  const getDeviceIcon = (device: DeviceSession): keyof typeof Ionicons.glyphMap => {
    if (device.platform === 'web') return 'globe-outline';
    if (device.deviceType === 'tablet') return 'tablet-portrait-outline';
    if (device.deviceType === 'desktop') return 'desktop-outline';
    return 'phone-portrait-outline';
  };

  return (
    <View style={styles.container}>
      {/* 1. App Lock & Biometrics */}
      <SectionHeading
        title="App Lock & Authentication"
        isDark={isDark}
        rightAction={
          <View
            style={[
              styles.hardwareBadge,
              {
                backgroundColor: biometricSettings.hasHardware
                  ? 'rgba(22, 163, 74, 0.12)'
                  : isDark
                    ? '#252230'
                    : '#F0EEF8',
              },
            ]}
          >
            <Ionicons
              name={biometricSettings.hasHardware ? 'shield-checkmark' : 'lock-closed-outline'}
              size={11}
              color={biometricSettings.hasHardware ? '#16A34A' : palette.textSecondary}
            />
            <Text
              style={[
                styles.hardwareBadgeText,
                {
                  color: biometricSettings.hasHardware ? '#16A34A' : palette.textSecondary,
                },
              ]}
            >
              {biometricSettings.hasHardware
                ? `${biometricSettings.biometricLabel} Ready`
                : 'Passcode Mode'}
            </Text>
          </View>
        }
      />
      <AccountCard isDark={isDark} noPadding>
        {/* Toggle Row */}
        <View
          style={[
            styles.switchRow,
            !biometricSettings.enabled && { borderBottomWidth: 0 },
            { borderBottomColor: palette.divider },
          ]}
        >
          <View
            style={[
              styles.iconBox,
              { backgroundColor: isDark ? 'rgba(22, 163, 74, 0.15)' : '#DCFCE7' },
            ]}
          >
            <Ionicons
              name={
                biometricSettings.biometricType === 'FACE_ID'
                  ? 'scan-outline'
                  : biometricSettings.biometricType === 'TOUCH_ID' ||
                    biometricSettings.biometricType === 'FINGERPRINT'
                    ? 'finger-print-outline'
                    : 'lock-closed-outline'
              }
              size={18}
              color="#16A34A"
            />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.rowTitle, { color: palette.textPrimary }]}>
              {biometricSettings.biometricLabel} Lock
            </Text>
            <Text style={[styles.rowSubtitle, { color: palette.textSecondary }]}>
              Require biometric scan or passcode to access app
            </Text>
          </View>
          <Switch
            value={biometricSettings.enabled}
            onValueChange={onToggleBiometric}
            disabled={isUpdatingBiometrics}
            trackColor={{
              false: isDark ? '#3A3A3C' : '#E9E6F2',
              true: '#16A34A',
            }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Timeout Selector */}
        {biometricSettings.enabled && (
          <View style={styles.timeoutSection}>
            <Text style={[styles.timeoutTitle, { color: palette.textPrimary }]}>
              Require {biometricSettings.biometricLabel}
            </Text>
            <Text style={[styles.timeoutSubtitle, { color: palette.textSecondary }]}>
              Lock after app is minimized for:
            </Text>
            <View
              style={[
                styles.timeoutSegment,
                { backgroundColor: isDark ? '#252230' : '#F0EEF8' },
              ]}
            >
              {[
                { label: 'Immediately', val: 0 },
                { label: '1 min', val: 1 },
                { label: '5 min', val: 5 },
                { label: '15 min', val: 15 },
              ].map((opt) => {
                const isSelected = biometricSettings.timeoutMinutes === opt.val;
                return (
                  <Pressable
                    key={opt.val}
                    cssInterop={false}
                    onPress={() => onChangeTimeout(opt.val)}
                    style={({ pressed }) => [
                      styles.timeoutBtn,
                      isSelected && [
                        styles.timeoutBtnActive,
                        {
                          backgroundColor: isDark ? '#1C1A25' : '#FFFFFF',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.08,
                          shadowRadius: 2,
                          elevation: 1,
                        },
                      ],
                      { opacity: pressed ? 0.75 : 1 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.timeoutBtnText,
                        {
                          color: isSelected
                            ? isDark
                              ? '#B9A8FF'
                              : '#7055E8'
                            : palette.textSecondary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </AccountCard>

      {/* 2. Logged-in Devices */}
      <SectionHeading
        title="Logged-In Devices"
        isDark={isDark}
        rightAction={
          <Pressable
            cssInterop={false}
            onPress={onRefreshDevices}
            disabled={isRefreshingDevices}
            hitSlop={8}
            style={({ pressed }) => [
              styles.refreshActionBtn,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            {isRefreshingDevices ? (
              <ActivityIndicator size="small" color={palette.primary} />
            ) : (
              <>
                <Ionicons name="refresh" size={13} color={palette.primary} />
                <Text style={[styles.refreshText, { color: palette.primary }]}>
                  Refresh
                </Text>
              </>
            )}
          </Pressable>
        }
      />
      <AccountCard isDark={isDark} noPadding>
        {/* Device Summary Header */}
        <View
          style={[
            styles.deviceSummaryRow,
            { borderBottomColor: palette.divider, borderBottomWidth: 1 },
          ]}
        >
          <View
            style={[
              styles.iconBox,
              { backgroundColor: isDark ? 'rgba(112, 85, 232, 0.15)' : '#EEE8FF' },
            ]}
          >
            <Ionicons name="phone-portrait-outline" size={17} color={palette.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTitle, { color: palette.textPrimary }]}>
              {activeDeviceCount} Active {activeDeviceCount === 1 ? 'Device' : 'Devices'}
            </Text>
            <Text style={[styles.rowSubtitle, { color: palette.textSecondary }]}>
              Manage active sessions signed into your account
            </Text>
          </View>
        </View>

        {/* Device List Items */}
        {isLoadingDevices ? (
          <DeviceSessionsSkeleton />
        ) : deviceSessions.length > 0 ? (
          deviceSessions.map((device, index) => {
            const isLast = index === deviceSessions.length - 1;
            const isSigningOut = signingOutDeviceId === device.sessionId;

            return (
              <View
                key={device.sessionId}
                style={[
                  styles.deviceRow,
                  !isLast && { borderBottomColor: palette.divider, borderBottomWidth: 1 },
                ]}
              >
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: device.isCurrent
                        ? isDark
                          ? 'rgba(22, 163, 74, 0.15)'
                          : '#DCFCE7'
                        : isDark
                          ? '#252230'
                          : '#F0EEF8',
                    },
                  ]}
                >
                  <Ionicons
                    name={getDeviceIcon(device)}
                    size={17}
                    color={device.isCurrent ? '#16A34A' : palette.textSecondary}
                  />
                </View>

                <View style={{ flex: 1, gap: 1 }}>
                  <Text
                    style={[styles.deviceNameText, { color: palette.textPrimary }]}
                    numberOfLines={1}
                  >
                    {device.deviceName}
                  </Text>
                  <Text
                    style={[styles.deviceMetaText, { color: palette.textSecondary }]}
                    numberOfLines={1}
                  >
                    {[
                      device.platform.toUpperCase(),
                      device.osVersion,
                      device.isOnline ? 'Online' : 'Offline',
                      formatLastSeen(device),
                    ]
                      .filter(Boolean)
                      .join(' • ')}
                  </Text>
                </View>

                {device.isCurrent ? (
                  <View style={styles.currentDevicePill}>
                    <Text style={styles.currentDeviceText}>This device</Text>
                  </View>
                ) : (
                  <Pressable
                    cssInterop={false}
                    onPress={() => onSignOutOtherDevice(device)}
                    disabled={isSigningOut}
                    style={({ pressed }) => [
                      styles.signOutDeviceBtn,
                      {
                        backgroundColor: isDark ? 'rgba(229, 72, 77, 0.12)' : '#FDE8E8',
                        borderColor: isDark ? 'rgba(229, 72, 77, 0.25)' : '#FCA5A5',
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                  >
                    {isSigningOut ? (
                      <ActivityIndicator size="small" color="#E5484D" />
                    ) : (
                      <Text style={styles.signOutDeviceText}>Sign out</Text>
                    )}
                  </Pressable>
                )}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyDeviceBox}>
            <Text style={[styles.emptyDeviceText, { color: palette.textSecondary }]}>
              No active device sessions found.
            </Text>
          </View>
        )}
      </AccountCard>

      {/* 3. Authentication & Password */}
      <SectionHeading title="Authentication & Password" isDark={isDark} />
      <AccountCard isDark={isDark} noPadding>
        <View
          style={[
            styles.actionRow,
            { borderBottomColor: palette.divider, borderBottomWidth: 1 },
          ]}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.rowTitle, { color: palette.textPrimary }]}>Password</Text>
            <Text style={[styles.rowSubtitle, { color: palette.textSecondary }]}>
              Send a secure password reset link to your email
            </Text>
          </View>
          <Pressable
            cssInterop={false}
            onPress={onPasswordReset}
            style={({ pressed }) => [
              styles.resetBtn,
              {
                backgroundColor: isDark ? '#252230' : '#F0EEF8',
                borderColor: palette.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Text style={[styles.resetBtnText, { color: palette.textPrimary }]}>Reset</Text>
          </Pressable>
        </View>

        <View style={styles.actionRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.rowTitle, { color: palette.textPrimary }]}>
              Two-Factor Authentication
            </Text>
            <Text style={[styles.rowSubtitle, { color: palette.textSecondary }]}>
              Enforce OTP / Magic link verification on sign-in
            </Text>
          </View>
          <View style={styles.activePill}>
            <Text style={styles.activePillText}>Active</Text>
          </View>
        </View>
      </AccountCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  hardwareBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  hardwareBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  rowSubtitle: {
    fontSize: 12,
    fontWeight: '400',
  },
  timeoutSection: {
    padding: 16,
    gap: 6,
  },
  timeoutTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  timeoutSubtitle: {
    fontSize: 11.5,
  },
  timeoutSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    borderRadius: 10,
    marginTop: 4,
  },
  timeoutBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  timeoutBtnActive: {},
  timeoutBtnText: {
    fontSize: 11.5,
  },
  refreshActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  refreshText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deviceSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  deviceNameText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  deviceMetaText: {
    fontSize: 11.5,
  },
  currentDevicePill: {
    backgroundColor: 'rgba(22, 163, 74, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  currentDeviceText: {
    color: '#16A34A',
    fontSize: 10.5,
    fontWeight: '700',
  },
  signOutDeviceBtn: {
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  signOutDeviceText: {
    color: '#E5484D',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyDeviceBox: {
    padding: 20,
    alignItems: 'center',
  },
  emptyDeviceText: {
    fontSize: 12.5,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
  },
  resetBtn: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activePill: {
    backgroundColor: 'rgba(22, 163, 74, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activePillText: {
    color: '#16A34A',
    fontSize: 10.5,
    fontWeight: '700',
  },
});

