import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, getColors } from '@/theme';
import { useAuth } from '../contexts/AuthContext';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface TabItemConfig {
  label: string;
  activeIcon: IoniconsName;
  inactiveIcon: IoniconsName;
}

const TAB_CONFIG: Record<string, TabItemConfig> = {
  index: {
    label: 'Home',
    activeIcon: 'home',
    inactiveIcon: 'home-outline',
  },
  inbox: {
    label: 'Inbox',
    activeIcon: 'chatbubbles',
    inactiveIcon: 'chatbubbles-outline',
  },
  team: {
    label: 'Team',
    activeIcon: 'people',
    inactiveIcon: 'people-outline',
  },
  planner: {
    label: 'Planner',
    activeIcon: 'calendar',
    inactiveIcon: 'calendar-outline',
  },
  tools: {
    label: 'Tools',
    activeIcon: 'telescope',
    inactiveIcon: 'telescope-outline',
  },
  activity: {
    label: 'Activity',
    activeIcon: 'pulse',
    inactiveIcon: 'pulse-outline',
  },
  admin: {
    label: 'Admin',
    activeIcon: 'shield-checkmark',
    inactiveIcon: 'shield-checkmark-outline',
  },
  communication: {
    label: 'Connect',
    activeIcon: 'mail',
    inactiveIcon: 'mail-outline',
  },
};

export interface FloatingTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  insets?: any;
}

const tabSpringAnimation = {
  duration: 260,
  create: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  update: {
    type: LayoutAnimation.Types.spring,
    springDamping: 0.75,
  },
  delete: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
};

export function FloatingTabBar({ state, descriptors, navigation }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { user, profile } = useAuth();

  if (!state?.routes || !descriptors || !navigation) {
    return null;
  }

  const userRole = (user?.role || profile?.role || '').toLowerCase();
  const isAdmin = Boolean(
    userRole === 'admin' ||
    (user as any)?.is_admin === true ||
    profile?.is_admin === true
  );

  // Bottom floating offset based on safe area
  const bottomOffset = Math.max(insets.bottom, 12);

  // Filter visible routes: Home, Inbox, Tools, Activity, and Admin ONLY for admin users
  const visibleRoutes = (state.routes || []).filter((route: any) => {
    const descriptor = descriptors[route.key];
    const options = descriptor ? descriptor.options : {};

    // Explicitly hide products, account, fleet from bottom bar
    if (route.name === 'products' || route.name === 'account' || route.name === 'fleet') {
      return false;
    }

    // Admin tab should ONLY show when the user is admin
    if (route.name === 'admin') {
      return Boolean(isAdmin);
    }

    return options.href !== null && !!TAB_CONFIG[route.name];
  });

  const currentRouteName = state.routes[state.index]?.name;
  const activeVisibleIndex = Math.max(
    0,
    visibleRoutes.findIndex((r: any) => r.name === currentRouteName)
  );

  return (
    <View style={styles.dockRoot} pointerEvents="box-none">
      {/* 2. Rounded navigation dock */}
      <View style={[styles.floatingWrapper, { bottom: bottomOffset }]} pointerEvents="box-none">
        <View
          style={[
            styles.tabBarContainer,
            {
              backgroundColor: colors.card,
              borderWidth: 0,
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: isDark ? 0.2 : 0.06,
              shadowRadius: 18,
              elevation: 3,
            },
          ]}
        >
          {visibleRoutes.map((route: { key: string; name: string }, index: number) => {
            const descriptor = descriptors[route.key];
            const options = descriptor ? descriptor.options : ({} as any);
            const isFocused = activeVisibleIndex === index;
            const config = TAB_CONFIG[route.name];

            const onPress = () => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }

              LayoutAnimation.configureNext(tabSpringAnimation);

              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            const iconName = isFocused ? config.activeIcon : config.inactiveIcon;

            if (isFocused) {
              return (
                <Pressable
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: true }}
                  accessibilityLabel={options?.tabBarAccessibilityLabel || config.label}
                  testID={options?.tabBarButtonTestID}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  style={[
                    styles.activePill,
                    { backgroundColor: colors.accentSoft },
                  ]}
                >
                  <Ionicons
                    name={iconName}
                    size={19}
                    color={colors.accent}
                  />
                  <Text
                    style={[
                      styles.activeLabel,
                      { color: colors.accent },
                    ]}
                    numberOfLines={1}
                  >
                    {config.label}
                  </Text>
                </Pressable>
              );
            }

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={{ selected: false }}
                accessibilityLabel={options?.tabBarAccessibilityLabel || config.label}
                testID={options?.tabBarButtonTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={[
                  styles.inactiveButton,
                  {
                    backgroundColor: 'transparent',
                  },
                ]}
              >
                <Ionicons
                  name={iconName}
                  size={20}
                  color={colors.textMuted}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dockRoot: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  backdropWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  floatingWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 10000,
  },
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    height: 52,
    borderRadius: 26,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderWidth: 0,
    overflow: 'hidden',
    gap: 6,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    paddingHorizontal: 15,
    borderRadius: 22,
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0,
    shadowRadius: 6,
    elevation: 0,
  },
  activeLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  inactiveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    width: 44,
    borderRadius: 22,
  },
});
