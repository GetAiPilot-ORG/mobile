import React, { useEffect, useRef } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
  const scrollRef = useRef<ScrollView>(null);
  const tabPositions = useRef<Record<string, { x: number; width: number }>>({});

  // Auto-scroll the active tab into view
  useEffect(() => {
    const pos = tabPositions.current[activeTab];
    if (pos && scrollRef.current) {
      scrollRef.current.scrollTo({
        x: Math.max(0, pos.x - 32),
        animated: true,
      });
    }
  }, [activeTab]);

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
      <ScrollView
        ref={scrollRef}
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
                onLayout={(e) => {
                  const layout = e.nativeEvent.layout;
                  tabPositions.current[tab.id] = { x: layout.x, width: layout.width };
                }}
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
                    borderWidth: 1,
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

      {/* Right Edge Fade overlay indicating horizontal scrollability */}
      <LinearGradient
        colors={[
          'transparent',
          isDark ? 'rgba(20, 19, 27, 0.85)' : 'rgba(248, 249, 253, 0.88)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.rightEdgeFade}
        pointerEvents="none"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  scrollContent: {
    paddingVertical: 2,
    paddingRight: 24,
  },
  tabsTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 10,
    minHeight: 34,
  },
  tabLabel: {
    fontSize: 12.5,
    letterSpacing: -0.1,
  },
  rightEdgeFade: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 22,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },
});
