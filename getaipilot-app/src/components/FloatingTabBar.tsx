import { useReducedMotion } from '@/hooks/useReducedMotion';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Home01Icon,
  Message01Icon,
  UserGroupIcon,
  Calendar01Icon,
  TelescopeIcon,
  Activity01Icon,
  ShieldCheckIcon,
  Mail01Icon,
} from '@hugeicons/core-free-icons';
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
import { TabMotion } from './TabMotion';

interface TabItemConfig {
  label: string;
  icon: any;
}

const TAB_CONFIG: Record<string, TabItemConfig> = {
  index: {
    label: 'Home',
    icon: Home01Icon,
  },
  inbox: {
    label: 'Inbox',
    icon: Message01Icon,
  },
  team: {
    label: 'Team',
    icon: UserGroupIcon,
  },
  planner: {
    label: 'Planner',
    icon: Calendar01Icon,
  },
  tools: {
    label: 'Tools',
    icon: TelescopeIcon,
  },
  activity: {
    label: 'Activity',
    icon: Activity01Icon,
  },
  admin: {
    label: 'Admin',
    icon: ShieldCheckIcon,
  },
  communication: {
    label: 'Connect',
    icon: Mail01Icon,
  },
};

export interface FloatingTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  insets?: any;
}

const tabSpringAnimation = {
  duration: 180,
  create: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  update: {
    type: LayoutAnimation.Types.easeInEaseOut,
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
  const reducedMotion = useReducedMotion();
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
      {/* 1. Full-bleed Bottom Frosted Backdrop that blurs all scrolled content behind it and fills the bottom screen area */}
      <View
        style={[
          styles.backdropWrapper,
          {
            height: 56 + bottomOffset + 12,
          },
        ]}
        pointerEvents="none"
      >\
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark
                ? 'rgba(17, 16, 15, 0.65)'
                : 'rgba(247, 245, 242, 0.70)',
              // borderTopWidth: StyleSheet.hairlineWidth,ß
              borderTopColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        />
      </View>

      {/* 2. Floating Pill Tab Bar with rounded frosted glassmorphism */}
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
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark
                  ? 'rgba(25, 23, 21, 0.70)'
                  : 'rgba(253, 252, 251, 0.75)',
              },
            ]}
          />

          {visibleRoutes.map((route: { key: string; name: string }, index: number) => {
            const descriptor = descriptors[route.key];
            const options = descriptor ? descriptor.options : ({} as any);
            const isFocused = activeVisibleIndex === index;
            const config = TAB_CONFIG[route.name];

            const onPress = () => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }

              if (!reducedMotion) LayoutAnimation.configureNext(tabSpringAnimation);

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

            const IconComponent = config?.icon || Home01Icon;

            return (
              <TabMotion key={route.key} active={isFocused}>
                {isFocused ? (
                  <Pressable
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
                    <HugeiconsIcon
                      icon={IconComponent}
                      size={19}
                      color={colors.accent}
                      strokeWidth={2}
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
                ) : (
                  <Pressable
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
                    <HugeiconsIcon
                      icon={IconComponent}
                      size={20}
                      color={colors.textMuted}
                      strokeWidth={1.75}
                    />
                  </Pressable>
                )}
              </TabMotion>
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
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    alignSelf: 'center',
    height: 52,
    borderRadius: 26,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 0,
    overflow: 'hidden',
    gap: 4,
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
