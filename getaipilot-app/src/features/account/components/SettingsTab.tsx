import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  AccountCard,
  SectionHeading,
  getAccountPalette,
} from './AccountUIComponents';

interface SettingsTabProps {
  soundEnabled: boolean;
  onToggleSound: (val: boolean) => void;
  hapticsEnabled: boolean;
  onToggleHaptics: (val: boolean) => void;
  themeMode: string;
  onSelectTheme: (mode: 'light' | 'dark' | 'system') => void;
  pushEnabled: boolean;
  onTogglePush: (val: boolean) => void;
  emailAlerts: boolean;
  onToggleEmailAlerts: (val: boolean) => void;
  biometricEnabled: boolean;
  onToggleBiometric: (val: boolean) => void;
  biometricLabel: string;
  isDark: boolean;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  soundEnabled,
  onToggleSound,
  hapticsEnabled,
  onToggleHaptics,
  themeMode,
  onSelectTheme,
  pushEnabled,
  onTogglePush,
  emailAlerts,
  onToggleEmailAlerts,
  biometricEnabled,
  onToggleBiometric,
  biometricLabel,
  isDark,
}) => {
  const palette = getAccountPalette(isDark);

  return (
    <View style={styles.container}>
      {/* 1. Sound & Feedback */}
      <SectionHeading title="Sound & Audio Feedback" isDark={isDark} />
      <AccountCard isDark={isDark} noPadding>
        {/* UI Sounds */}
        <View
          style={[
            styles.settingRow,
            { borderBottomColor: palette.divider, borderBottomWidth: 1 },
          ]}
        >
          <View
            style={[
              styles.iconBox,
              { backgroundColor: isDark ? 'rgba(112, 85, 232, 0.15)' : '#EEE8FF' },
            ]}
          >
            <Ionicons name="volume-medium-outline" size={17} color={palette.primary} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.settingTitle, { color: palette.textPrimary }]}>
                Button & UI Sounds
              </Text>
              {soundEnabled && <View style={styles.greenDot} />}
            </View>
            <Text style={[styles.settingSub, { color: palette.textSecondary }]}>
              Synthesized audio cues on taps and actions
            </Text>
          </View>
          <Switch
            value={soundEnabled}
            onValueChange={onToggleSound}
            trackColor={{
              false: isDark ? '#3A3A3C' : '#E9E6F2',
              true: palette.primary,
            }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Haptics */}
        <View style={styles.settingRow}>
          <View
            style={[
              styles.iconBox,
              { backgroundColor: isDark ? 'rgba(22, 163, 74, 0.15)' : '#DCFCE7' },
            ]}
          >
            <Ionicons name="radio-outline" size={17} color="#16A34A" />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.settingTitle, { color: palette.textPrimary }]}>
                Haptic Vibrations
              </Text>
              {hapticsEnabled && <View style={styles.greenDot} />}
            </View>
            <Text style={[styles.settingSub, { color: palette.textSecondary }]}>
              Tactile motor feedback on taps and card scrolls
            </Text>
          </View>
          <Switch
            value={hapticsEnabled}
            onValueChange={onToggleHaptics}
            trackColor={{
              false: isDark ? '#3A3A3C' : '#E9E6F2',
              true: '#16A34A',
            }}
            thumbColor="#FFFFFF"
          />
        </View>
      </AccountCard>

      {/* 2. Appearance & Theme */}
      <SectionHeading title="Appearance & Theme" isDark={isDark} />
      <AccountCard isDark={isDark}>
        <View style={styles.themeSelectorRow}>
          {[
            { id: 'light', label: 'Light', icon: 'sunny-outline' as const },
            { id: 'dark', label: 'Dark', icon: 'moon-outline' as const },
            { id: 'system', label: 'System', icon: 'phone-portrait-outline' as const },
          ].map((item) => {
            const isSelected = themeMode === item.id;
            return (
              <Pressable
                key={item.id}
                cssInterop={false}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  onSelectTheme(item.id as any);
                }}
                style={({ pressed }) => [
                  styles.themePill,
                  {
                    backgroundColor: isSelected
                      ? isDark
                        ? 'rgba(185, 168, 255, 0.18)'
                        : '#EEE8FF'
                      : isDark
                        ? '#252230'
                        : '#F8F9FD',
                    borderColor: isSelected
                      ? palette.primary
                      : palette.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={15}
                  color={isSelected ? palette.primary : palette.textSecondary}
                />
                <Text
                  style={[
                    styles.themePillText,
                    {
                      color: isSelected ? palette.primary : palette.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </AccountCard>

      {/* 3. Application Preferences */}
      <SectionHeading title="Application Preferences" isDark={isDark} />
      <AccountCard isDark={isDark} noPadding>
        {/* Push Notifications */}
        <View
          style={[
            styles.settingRow,
            { borderBottomColor: palette.divider, borderBottomWidth: 1 },
          ]}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.settingTitle, { color: palette.textPrimary }]}>
                Push Notifications
              </Text>
              {pushEnabled && <View style={styles.greenDot} />}
            </View>
            <Text style={[styles.settingSub, { color: palette.textSecondary }]}>
              Receive instant alerts on campaigns, bots, and events
            </Text>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={onTogglePush}
            trackColor={{
              false: isDark ? '#3A3A3C' : '#E9E6F2',
              true: palette.primary,
            }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Email Digests */}
        <View
          style={[
            styles.settingRow,
            { borderBottomColor: palette.divider, borderBottomWidth: 1 },
          ]}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.settingTitle, { color: palette.textPrimary }]}>
              Email Digests
            </Text>
            <Text style={[styles.settingSub, { color: palette.textSecondary }]}>
              Weekly summary of automation performance and metrics
            </Text>
          </View>
          <Switch
            value={emailAlerts}
            onValueChange={onToggleEmailAlerts}
            trackColor={{
              false: isDark ? '#3A3A3C' : '#E9E6F2',
              true: palette.primary,
            }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Biometric App Lock Shortcut */}
        <View style={styles.settingRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.settingTitle, { color: palette.textPrimary }]}>
              {biometricLabel} Lock
            </Text>
            <Text style={[styles.settingSub, { color: palette.textSecondary }]}>
              Lock app whenever minimized or closed
            </Text>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={onToggleBiometric}
            trackColor={{
              false: isDark ? '#3A3A3C' : '#E9E6F2',
              true: '#16A34A',
            }}
            thumbColor="#FFFFFF"
          />
        </View>
      </AccountCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingSub: {
    fontSize: 12,
    fontWeight: '400',
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  themeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  themePillText: {
    fontSize: 12.5,
  },
});

