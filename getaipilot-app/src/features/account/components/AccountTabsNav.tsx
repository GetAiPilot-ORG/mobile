import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getAccountPalette } from './AccountUIComponents';

export type AccountTab = 'overview' | 'security' | 'billing' | 'preferences';

interface TabItem {
  id: AccountTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const TABS: TabItem[] = [
  { id: 'overview', label: 'Profile', icon: 'person-outline' },
  { id: 'security', label: 'Security', icon: 'shield-checkmark-outline' },
  { id: 'billing', label: 'Billing', icon: 'card-outline' },
  { id: 'preferences', label: 'Preferences', icon: 'settings-outline' },
];

interface AccountTabsNavProps {
  activeTab: AccountTab;
  onChangeTab: (tab: AccountTab) => void;
  isDark: boolean;
}

export const AccountTabsNav: React.FC<AccountTabsNavProps> = ({
  activeTab,
  onChangeTab,
  isDark,
}) => {
  const palette = getAccountPalette(isDark);

  const handleSelectTab = (tabId: AccountTab) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    onChangeTab(tabId);
  };

  return (
    <View style={styles.outerContainer}>
      <View
        style={[
          styles.tabsTrack,
          {
            backgroundColor: isDark ? '#1C1A25' : '#FFFFFF',
            borderColor: palette.border,
          },
        ]}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              cssInterop={false}
              onPress={() => handleSelectTab(tab.id)}
              accessibilityRole="tab"
              accessibilityLabel={`${tab.label} tab`}
              accessibilityState={{ selected: isActive }}
              style={({ pressed }) => [
                styles.tabItem,
                {
                  backgroundColor: isActive
                    ? isDark
                      ? 'rgba(185, 168, 255, 0.18)'
                      : '#EEE8FF'
                    : 'transparent',
                  borderColor: isActive
                    ? isDark
                      ? 'rgba(185, 168, 255, 0.28)'
                      : 'rgba(112, 85, 232, 0.2)'
                    : 'transparent',
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Ionicons
                name={tab.icon}
                size={13}
                color={isActive ? palette.primary : palette.textSecondary}
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? palette.primary : palette.textSecondary,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    marginBottom: 16,
  },
  tabsTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 3,
    borderRadius: 14,
    borderWidth: 1,
    gap: 3,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 2,
    paddingVertical: 7,
    borderRadius: 10,
    minHeight: 34,
    borderWidth: 1,
  },
  tabLabel: {
    fontSize: 11.5,
    letterSpacing: -0.2,
  },
});
