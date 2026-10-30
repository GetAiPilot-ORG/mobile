import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getAccountPalette } from './AccountUIComponents';

export type AccountTab = 'overview' | 'edit' | 'security' | 'billing' | 'preferences';

interface TabItem {
  id: AccountTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const TABS: TabItem[] = [
  { id: 'overview', label: 'Profile', icon: 'person-outline' },
  { id: 'edit', label: 'Edit', icon: 'create-outline' },
  { id: 'security', label: 'Security', icon: 'shield-checkmark-outline' },
  { id: 'billing', label: 'Billing', icon: 'card-outline' },
  { id: 'preferences', label: 'Settings', icon: 'settings-outline' },
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChangeTab(tabId);
  };

  return (
    <View style={styles.outerContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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
                accessibilityLabel={tab.label}
                accessibilityState={{ selected: isActive }}
                style={({ pressed }) => [
                  styles.tabItem,
                  {
                    backgroundColor: isActive
                      ? isDark
                        ? 'rgba(185, 168, 255, 0.16)'
                        : '#EEE8FF'
                      : 'transparent',
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Ionicons
                  name={tab.icon}
                  size={14}
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
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    marginBottom: 16,
  },
  scrollContent: {
    paddingVertical: 2,
  },
  tabsTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 3,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    minHeight: 34,
  },
  tabLabel: {
    fontSize: 12.5,
    letterSpacing: -0.1,
  },
});

