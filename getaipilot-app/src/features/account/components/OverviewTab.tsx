import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  AccountCard,
  DangerButton,
  InfoRow,
  SectionHeading,
  SettingsNavRow,
  getAccountPalette,
} from './AccountUIComponents';

interface OverviewTabProps {
  email: string;
  phone: string;
  isActive: boolean;
  isAdmin: boolean;
  onSignOut: () => void;
  isDark: boolean;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  email,
  phone,
  isActive,
  isAdmin,
  onSignOut,
  isDark,
}) => {
  const router = useRouter();
  const palette = getAccountPalette(isDark);

  return (
    <View style={styles.container}>
      {/* 1. Account Information */}
      <SectionHeading title="Account Information" isDark={isDark} />
      <AccountCard isDark={isDark}>
        <InfoRow label="Email" value={email} isDark={isDark} />
        <InfoRow label="Phone" value={phone || 'Not provided'} isDark={isDark} />
        <InfoRow
          label="Account Status"
          value={isActive ? 'Active Platform' : 'Free Trial'}
          isDark={isDark}
        />
        <InfoRow
          label="Role"
          value={isAdmin ? 'Administrator' : 'Standard Member'}
          isDark={isDark}
          isLast
        />
      </AccountCard>

      {/* 2. Manage App & Resources */}
      <SectionHeading title="Manage & Resources" isDark={isDark} />
      <AccountCard isDark={isDark}>
        <SettingsNavRow
          icon="book-outline"
          iconBg={isDark ? 'rgba(112, 85, 232, 0.16)' : '#EEE8FF'}
          iconColor={palette.primary}
          title="Help Center & Docs"
          subtitle="Guides, APIs, FAQs and platform documentation"
          onPress={() => router.push('/account/help' as any)}
          isDark={isDark}
        />
        <SettingsNavRow
          icon="diamond-outline"
          iconBg={isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7'}
          iconColor="#F59E0B"
          title="Plans & Subscriptions"
          subtitle="Manage active tier, quotas, and limits"
          onPress={() => router.push('/account/plans' as any)}
          isDark={isDark}
        />
        <SettingsNavRow
          icon="color-palette-outline"
          iconBg={isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7'}
          iconColor="#10B981"
          title="Customize App"
          subtitle="Custom theme accents, colors, and layout"
          onPress={() => router.push('/account/customize' as any)}
          isDark={isDark}
          isLast
        />
      </AccountCard>

      {/* 3. Sign Out Action */}
      <View style={styles.signOutWrapper}>
        <DangerButton
          label="Sign Out of GetAiPilot"
          onPress={onSignOut}
          isDark={isDark}
        />
      </View>

      {/* 4. App Version Footer */}
      <Text style={[styles.versionText, { color: palette.textSecondary }]}>
        GetAiPilot Mobile v1.0.0
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  signOutWrapper: {
    marginTop: 8,
    marginBottom: 10,
  },
  versionText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '400',
    marginTop: 4,
    marginBottom: 10,
  },
});

