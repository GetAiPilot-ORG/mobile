import React, { useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import {
  AccountCard,
  DangerButton,
  SectionHeading,
  getAccountPalette,
} from './AccountUIComponents';

export interface OverviewTabProps {
  email: string;
  phone: string;
  isActive: boolean;
  isAdmin: boolean;
  planLabel: string;
  deviceCount: number;
  pushEnabled: boolean;
  themeMode: 'light' | 'dark' | 'system';
  onSelectTheme: (mode: 'light' | 'dark' | 'system') => void;
  onNavigateTab: (tab: 'security' | 'billing' | 'preferences') => void;
  onEditProfile: () => void;
  onSignOut: () => void;
  onShowToast: (msg: string) => void;
  isDark: boolean;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  email,
  phone,
  isActive,
  isAdmin,
  planLabel,
  deviceCount,
  pushEnabled,
  themeMode,
  onSelectTheme,
  onNavigateTab,
  onEditProfile,
  onSignOut,
  onShowToast,
  isDark,
}) => {
  const router = useRouter();
  const palette = getAccountPalette(isDark);

  // Phone masking & 10s auto-remask timer
  const [isPhoneRevealed, setIsPhoneRevealed] = useState(false);
  const remaskTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (remaskTimerRef.current) clearTimeout(remaskTimerRef.current);
    };
  }, []);

  const togglePhoneReveal = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }

    if (isPhoneRevealed) {
      setIsPhoneRevealed(false);
      if (remaskTimerRef.current) clearTimeout(remaskTimerRef.current);
    } else {
      setIsPhoneRevealed(true);
      if (remaskTimerRef.current) clearTimeout(remaskTimerRef.current);
      remaskTimerRef.current = setTimeout(() => {
        setIsPhoneRevealed(false);
      }, 10000); // 10 seconds auto re-mask
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    if (!text || text === 'Not provided') return;
    try {
      await Clipboard.setStringAsync(text);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onShowToast(`${label} copied to clipboard`);
    } catch {}
  };

  const maskedPhone = React.useMemo(() => {
    if (!phone) return 'Not provided';
    const trimmed = phone.trim();
    if (trimmed.length < 8) return trimmed;
    const start = trimmed.slice(0, Math.min(6, Math.floor(trimmed.length * 0.4)));
    const end = trimmed.slice(-Math.min(4, Math.floor(trimmed.length * 0.3)));
    return `${start}•••• ${end}`;
  }, [phone]);

  return (
    <View style={styles.container}>
      {/* ─── 1. ACCOUNT INFORMATION ────────────────────────────────────────── */}
      <SectionHeading title="Account Information" isDark={isDark} />
      <AccountCard isDark={isDark}>
        {/* Email Row */}
        <View style={[styles.infoRow, { borderBottomColor: palette.divider, borderBottomWidth: 1 }]}>
          <View style={styles.infoLabelCol}>
            <Text style={[styles.infoLabel, { color: palette.textSecondary }]}>Email</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <Text
                style={[styles.infoValueMain, { color: palette.textPrimary }]}
                numberOfLines={1}
              >
                {email || '—'}
              </Text>
              <View style={[styles.microBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7' }]}>
                <Ionicons name="checkmark-circle" size={10} color="#16A34A" />
                <Text style={styles.microBadgeText}>Verified</Text>
              </View>
            </View>
          </View>

          <Pressable
            cssInterop={false}
            onPress={() => copyToClipboard(email, 'Email')}
            accessibilityRole="button"
            accessibilityLabel="Copy email address"
            hitSlop={8}
            style={({ pressed }) => [
              styles.iconActionBtn,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F5F3FF',
                borderColor: palette.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Ionicons name="copy-outline" size={15} color={palette.primary} />
          </Pressable>
        </View>

        {/* Phone Row with Eye Reveal & Auto-Mask after 10s */}
        <View style={[styles.infoRow, { borderBottomColor: palette.divider, borderBottomWidth: 1 }]}>
          <View style={styles.infoLabelCol}>
            <Text style={[styles.infoLabel, { color: palette.textSecondary }]}>Phone Number</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <Text
                style={[styles.infoValueMain, { color: palette.textPrimary }]}
                numberOfLines={1}
              >
                {isPhoneRevealed ? (phone || 'Not provided') : maskedPhone}
              </Text>
              {phone ? (
                <View style={[styles.microBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7' }]}>
                  <Ionicons name="checkmark-circle" size={10} color="#16A34A" />
                  <Text style={styles.microBadgeText}>Verified</Text>
                </View>
              ) : (
                <Pressable
                  cssInterop={false}
                  onPress={onEditProfile}
                  style={[styles.microBadge, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7' }]}
                >
                  <Text style={[styles.microBadgeText, { color: '#D97706' }]}>+ Add Phone</Text>
                </Pressable>
              )}
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {Boolean(phone) && (
              <Pressable
                cssInterop={false}
                onPress={togglePhoneReveal}
                accessibilityRole="button"
                accessibilityLabel={isPhoneRevealed ? 'Mask phone number' : 'Reveal phone number for 10 seconds'}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.iconActionBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F5F3FF',
                    borderColor: palette.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Ionicons
                  name={isPhoneRevealed ? 'eye-off-outline' : 'eye-outline'}
                  size={15}
                  color={palette.primary}
                />
              </Pressable>
            )}

            <Pressable
              cssInterop={false}
              onPress={() => copyToClipboard(phone, 'Phone number')}
              accessibilityRole="button"
              accessibilityLabel="Copy phone number"
              hitSlop={8}
              style={({ pressed }) => [
                styles.iconActionBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F5F3FF',
                  borderColor: palette.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Ionicons name="copy-outline" size={15} color={palette.primary} />
            </Pressable>
          </View>
        </View>

        {/* Platform Status Row */}
        <View style={[styles.infoRow, { borderBottomColor: palette.divider, borderBottomWidth: 1 }]}>
          <Text style={[styles.infoLabel, { color: palette.textSecondary }]}>Active Platform</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[styles.activeDotPulse, { backgroundColor: isActive ? '#10B981' : '#9CA3AF' }]} />
            <Text style={[styles.infoValueText, { color: isActive ? '#16A34A' : palette.textSecondary }]}>
              {isActive ? 'All Systems Operational' : 'Free Sandbox Mode'}
            </Text>
          </View>
        </View>

        {/* Access Role Row */}
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: palette.textSecondary }]}>Role</Text>
          <View
            style={[
              styles.roleBadge,
              {
                backgroundColor: isAdmin
                  ? isDark ? 'rgba(185, 168, 255, 0.16)' : '#EEE8FF'
                  : isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F1F6',
                borderColor: isAdmin
                  ? isDark ? 'rgba(185, 168, 255, 0.3)' : '#DDD4FA'
                  : palette.border,
              },
            ]}
          >
            {isAdmin && <Ionicons name="shield-checkmark" size={11} color={palette.primary} />}
            <Text
              style={[
                styles.roleBadgeText,
                { color: isAdmin ? palette.primary : palette.textSecondary },
              ]}
            >
              {isAdmin ? 'Administrator' : 'Standard Member'}
            </Text>
          </View>
        </View>
      </AccountCard>

      {/* ─── 2. ACCOUNT SECTION ────────────────────────────────────────────── */}
      <SectionHeading title="Account" isDark={isDark} />
      <AccountCard isDark={isDark}>
        <SettingsRowItem
          icon="diamond-outline"
          iconBg={isDark ? 'rgba(245, 158, 11, 0.16)' : '#FEF3C7'}
          iconColor="#F59E0B"
          title="Plans & Subscriptions"
          subtitle="Manage active tier, AI quotas, and limits"
          rightBadge={isActive ? (planLabel || 'Core') : 'Free'}
          onPress={() => router.push('/account/plans' as any)}
          isDark={isDark}
        />
        <SettingsRowItem
          icon="receipt-outline"
          iconBg={isDark ? 'rgba(139, 92, 246, 0.16)' : '#EDE9FE'}
          iconColor="#8B5CF6"
          title="Billing & Invoices"
          subtitle="Payment receipts, GST invoices & cards"
          onPress={() => onNavigateTab('billing')}
          isDark={isDark}
        />
        <SettingsRowItem
          icon="hardware-chip-outline"
          iconBg={isDark ? 'rgba(6, 182, 212, 0.16)' : '#E0F2FE'}
          iconColor="#06B6D4"
          title="Devices & Sessions"
          subtitle="Active mobile, desktop and web logins"
          rightBadge={`${deviceCount} active`}
          onPress={() => onNavigateTab('security')}
          isDark={isDark}
        />
        <SettingsRowItem
          icon="notifications-outline"
          iconBg={isDark ? 'rgba(236, 72, 153, 0.16)' : '#FCE7F3'}
          iconColor="#EC4899"
          title="Notifications"
          subtitle="Push notifications, critical bot alerts"
          rightBadge={pushEnabled ? 'Active' : 'Off'}
          onPress={() => onNavigateTab('preferences')}
          isDark={isDark}
          isLast
        />
      </AccountCard>

      {/* ─── 3. PREFERENCES SECTION ────────────────────────────────────────── */}
      <SectionHeading title="Preferences" isDark={isDark} />
      <AccountCard isDark={isDark}>
        <SettingsRowItem
          icon="color-palette-outline"
          iconBg={isDark ? 'rgba(16, 185, 129, 0.16)' : '#DCFCE7'}
          iconColor="#10B981"
          title="Customize App"
          subtitle="Custom theme accents, colors, and layout"
          onPress={() => onNavigateTab('preferences')}
          isDark={isDark}
        />
        <SettingsRowItem
          icon="language-outline"
          iconBg={isDark ? 'rgba(59, 130, 246, 0.16)' : '#DBEAFE'}
          iconColor="#3B82F6"
          title="Language"
          subtitle="App interface language and date formatting"
          rightBadge="English (US)"
          onPress={() => onShowToast('Language is set to English (US)')}
          isDark={isDark}
        />

        {/* Inline Theme Segmented Control Row */}
        <View style={styles.themeRow}>
          <View style={[styles.squircleIcon, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.16)' : '#EDE9FE' }]}>
            <Ionicons name="moon-outline" size={18} color="#8B5CF6" />
          </View>
          <View style={{ flex: 1, gap: 1 }}>
            <Text style={[styles.navTitle, { color: palette.textPrimary }]}>Theme</Text>
            <Text style={[styles.navSubtitle, { color: palette.textSecondary }]}>Light, Dark or System preference</Text>
          </View>
        </View>

        {/* Segmented Control Pills */}
        <View
          style={[
            styles.themeSegmentTrack,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F1F6',
              borderColor: palette.border,
            },
          ]}
        >
          {(['light', 'dark', 'system'] as const).map((mode) => {
            const isSelected = themeMode === mode;
            return (
              <Pressable
                key={mode}
                cssInterop={false}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch {}
                  }
                  onSelectTheme(mode);
                }}
                accessibilityRole="button"
                accessibilityLabel={`${mode} theme`}
                accessibilityState={{ selected: isSelected }}
                style={[
                  styles.themeSegmentBtn,
                  isSelected && {
                    backgroundColor: isDark ? '#2D2845' : '#FFFFFF',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2,
                  },
                ]}
              >
                <Ionicons
                  name={mode === 'light' ? 'sunny-outline' : mode === 'dark' ? 'moon-outline' : 'phone-portrait-outline'}
                  size={13}
                  color={isSelected ? palette.primary : palette.textSecondary}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.themeSegmentText,
                    {
                      color: isSelected ? palette.primary : palette.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </AccountCard>

      {/* ─── 4. GROWTH SECTION ─────────────────────────────────────────────── */}
      <SectionHeading title="Growth" isDark={isDark} />
      <AccountCard isDark={isDark}>
        <SettingsRowItem
          icon="gift-outline"
          iconBg={isDark ? 'rgba(234, 179, 8, 0.16)' : '#FEF08A'}
          iconColor="#CA8A04"
          title="Invite Friends"
          subtitle="Share your link & earn ₹100 cash every referral"
          rightBadge="Earn ₹100"
          badgeColor="#EAB308"
          onPress={() => router.push('/Referral' as any)}
          isDark={isDark}
          isLast
        />
      </AccountCard>

      {/* ─── 5. SUPPORT SECTION ────────────────────────────────────────────── */}
      <SectionHeading title="Support" isDark={isDark} />
      <AccountCard isDark={isDark}>
        <SettingsRowItem
          icon="book-outline"
          iconBg={isDark ? 'rgba(112, 85, 232, 0.16)' : '#EEE8FF'}
          iconColor={palette.primary}
          title="Help Center & Docs"
          subtitle="Guides, APIs, FAQs and platform documentation"
          onPress={() => router.push('/account/help' as any)}
          isDark={isDark}
        />
        <SettingsRowItem
          icon="chatbubbles-outline"
          iconBg={isDark ? 'rgba(6, 182, 212, 0.16)' : '#E0F2FE'}
          iconColor="#06B6D4"
          title="Contact Support"
          subtitle="Get 24/7 priority help from human concierge"
          onPress={() => onShowToast('Connecting you with support team...')}
          isDark={isDark}
        />
        <SettingsRowItem
          icon="shield-half-outline"
          iconBg={isDark ? 'rgba(100, 116, 139, 0.16)' : '#F1F5F9'}
          iconColor="#64748B"
          title="Privacy & Data"
          subtitle="Manage cloud telemetry, GDPR & terms"
          onPress={() => onShowToast('Opening privacy controls...')}
          isDark={isDark}
          isLast
        />
      </AccountCard>

      {/* ─── 6. SIGN OUT ACTION (24px spacing above) ───────────────────────── */}
      <View style={styles.signOutWrapper}>
        <DangerButton
          label="Sign Out of GetAiPilot"
          onPress={onSignOut}
          isDark={isDark}
        />
      </View>

      {/* ─── 7. APP FOOTER & LEGAL LINKS (WCAG AA Compliant) ──────────────── */}
      <View style={styles.footerContainer}>
        <Text style={[styles.versionText, { color: palette.textSecondary }]}>
          GetAiPilot Mobile v1.0.0 (Build 42)
        </Text>
        <View style={styles.legalLinksRow}>
          <Pressable
            cssInterop={false}
            onPress={() => onShowToast('Opening Terms of Service...')}
            accessibilityRole="link"
            accessibilityLabel="Terms of Service"
          >
            <Text style={[styles.legalLink, { color: isDark ? '#A1A1AA' : '#52525B' }]}>
              Terms of Service
            </Text>
          </Pressable>
          <Text style={{ color: palette.border }}>•</Text>
          <Pressable
            cssInterop={false}
            onPress={() => onShowToast('Opening Privacy Policy...')}
            accessibilityRole="link"
            accessibilityLabel="Privacy Policy"
          >
            <Text style={[styles.legalLink, { color: isDark ? '#A1A1AA' : '#52525B' }]}>
              Privacy Policy
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

// ─── Reusable Settings Row Item with 56px Min Height & 44px Touch Targets ───
const SettingsRowItem: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  rightBadge?: string;
  badgeColor?: string;
  onPress: () => void;
  isDark: boolean;
  isLast?: boolean;
}> = ({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  rightBadge,
  badgeColor,
  onPress,
  isDark,
  isLast = false,
}) => {
  const palette = getAccountPalette(isDark);

  return (
    <Pressable
      cssInterop={false}
      onPress={() => {
        if (Platform.OS !== 'web') {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch {}
        }
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle || ''}`}
      style={({ pressed }) => [
        styles.navRow,
        !isLast && { borderBottomColor: palette.divider, borderBottomWidth: 1 },
        { opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <View style={[styles.squircleIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={[styles.navTitle, { color: palette.textPrimary }]}>
          {title}
        </Text>
        {Boolean(subtitle) && (
          <Text style={[styles.navSubtitle, { color: palette.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>

      {Boolean(rightBadge) && (
        <View
          style={[
            styles.rightBadgePill,
            {
              backgroundColor: badgeColor
                ? `${badgeColor}18`
                : isDark ? 'rgba(185, 168, 255, 0.14)' : '#EEE8FF',
              borderColor: badgeColor
                ? `${badgeColor}35`
                : isDark ? 'rgba(185, 168, 255, 0.28)' : '#DDD4FA',
            },
          ]}
        >
          <Text
            style={[
              styles.rightBadgeText,
              { color: badgeColor || (isDark ? '#B9A8FF' : '#7055E8') },
            ]}
          >
            {rightBadge}
          </Text>
        </View>
      )}

      <Ionicons name="chevron-forward" size={16} color={palette.textSecondary} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  infoLabelCol: {
    flex: 1,
    paddingRight: 10,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoValueMain: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  infoValueText: {
    fontSize: 13,
    fontWeight: '600',
  },
  iconActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  microBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  microBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  activeDotPulse: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    minHeight: 56, // Accessible 56px minimum height
  },
  squircleIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  navSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 1,
  },
  rightBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  rightBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  themeSegmentTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    gap: 2,
  },
  themeSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
  },
  themeSegmentText: {
    fontSize: 12,
  },
  signOutWrapper: {
    marginTop: 24, // 24px spacing above sign out button as requested
    marginBottom: 16,
  },
  footerContainer: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  legalLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legalLink: {
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
