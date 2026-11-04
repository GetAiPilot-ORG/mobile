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
} from '@/constants/icons';
import * as Haptics from 'expo-haptics';
import { soundService } from '../services/soundFeedbackService';
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
import { useNavigation } from 'expo-router';
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
  navigation?: any;
  emitter?: any;
  navigateToTab?: (key: string) => void;
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

export function FloatingTabBar({ state, descriptors, navigation, emitter, navigateToTab }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const reducedMotion = useReducedMotion();
  const { user, profile } = useAuth();
  const hookNavigation = useNavigation();
  const nav = navigation || hookNavigation;

  if (!state?.routes || !descriptors) {
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

  const webRootStyle = Platform.OS === 'web'
    ? ({ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 9999 } as any)
    : undefined;

  return (
    <View style={[styles.dockRoot, webRootStyle]} pointerEvents="box-none">
      {/* Floating Pill Tab Bar with frosted glassmorphic background */}
      <View style={[styles.floatingWrapper, { bottom: bottomOffset }]} pointerEvents="box-none">
        <View
          style={[
            styles.tabBarContainer,
            {
              backgroundColor: isDark
                ? 'rgba(28, 26, 37, 0.88)'
                : 'rgba(255, 255, 255, 0.90)',
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.14)'
                : 'rgba(0, 0, 0, 0.08)',
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: isDark ? 0.25 : 0.08,
              shadowRadius: 18,
              elevation: 4,
            },
          ]}
        >
          {visibleRoutes.map((route: { key: string; name: string }, index: number) => {
            const descriptor = descriptors[route.key];
            const options = descriptor ? descriptor.options : ({} as any);
            const isFocused = activeVisibleIndex === index;
            const config = TAB_CONFIG[route.name];

            const onPress = () => {
              soundService.play('click');
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }

              if (!reducedMotion) LayoutAnimation.configureNext(tabSpringAnimation);

              const event = emitter
                ? emitter.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  })
                : nav?.emit?.({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });

              if (!isFocused && !event?.defaultPrevented) {
                if (navigateToTab) {
                  navigateToTab(route.key);
                } else if (nav?.navigate) {
                  nav.navigate(route.name);
                }
              }
            };

            const onLongPress = () => {
              if (emitter) {
                emitter.emit({
                  type: 'tabLongPress',
                  target: route.key,
                });
              } else if (nav?.emit) {
                nav.emit({
                  type: 'tabLongPress',
                  target: route.key,
                });
              }
            };

            const IconComponent = config?.icon || Home01Icon;

            return (
              <TabMotion key={route.key} active={isFocused}>
                {isFocused ? (
                  <Pressable
                    cssInterop={false}
                    accessibilityRole="button"
                    accessibilityState={{ selected: true }}
                    accessibilityLabel={options?.tabBarAccessibilityLabel || config.label}
                    testID={options?.tabBarButtonTestID}
                    onPress={onPress}
                    onLongPress={onLongPress}
                    style={({ pressed }) => [
                      styles.activePill,
                      {
                        backgroundColor: colors.accentSoft,
                        transform: [{ scale: pressed && !reducedMotion ? 0.96 : 1 }],
                      },
                    ]}
                  >
                    <HugeiconsIcon
                      icon={IconComponent}
                      size={18}
                      color={colors.accent}
                      strokeWidth={2.2}
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
                    cssInterop={false}
                    accessibilityRole="button"
                    accessibilityState={{ selected: false }}
                    accessibilityLabel={options?.tabBarAccessibilityLabel || config.label}
                    testID={options?.tabBarButtonTestID}
                    onPress={onPress}
                    onLongPress={onLongPress}
                    style={({ pressed }) => [
                      styles.inactiveButton,
                      {
                        backgroundColor: 'transparent',
                        transform: [{ scale: pressed && !reducedMotion ? 0.94 : 1 }],
                      },
                    ]}
                  >
                    <HugeiconsIcon
                      icon={IconComponent}
                      size={19}
                      color={isDark ? '#A19BB5' : '#696478'}
                      strokeWidth={1.8}
                    />
                    <Text
                      style={[
                        styles.inactiveLabel,
                        { color: isDark ? '#A19BB5' : '#696478' },
                      ]}
                      numberOfLines={1}
                    >
                      {config.label}
                    </Text>
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
    height: 58,
    borderRadius: 29,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 0,
    overflow: 'hidden',
    gap: 4,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 23,
    gap: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  activeLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  inactiveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    minWidth: 46,
    paddingHorizontal: 6,
    borderRadius: 23,
    gap: 2,
  },
  inactiveLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: -0.1,
    includeFontPadding: false,
  },
});
