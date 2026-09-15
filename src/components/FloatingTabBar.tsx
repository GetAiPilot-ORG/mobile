import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  useColorScheme,
  Animated,
  LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

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
};

export interface FloatingTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  insets?: any;
}

export function FloatingTabBar({ state, descriptors, navigation }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Bottom floating offset based on safe area
  const bottomOffset = Math.max(insets.bottom + 6, 20);

  // Filter visible routes: strictly the 4 main tabs (Home, Inbox, Tools, Activity)
  const visibleRoutes = state.routes.filter((route: any) => {
    const descriptor = descriptors[route.key];
    const options = descriptor ? descriptor.options : {};
    return options.href !== null && !!TAB_CONFIG[route.name] && route.name !== 'products';
  });

  const currentRouteName = state.routes[state.index]?.name;
  const activeVisibleIndex = Math.max(
    0,
    visibleRoutes.findIndex((r: any) => r.name === currentRouteName)
  );

  // Layout measurement for mathematical symmetry
  const [containerWidth, setContainerWidth] = useState(0);
  const paddingHorizontal = 6;
  const numTabs = visibleRoutes.length || 4;
  const availableWidth = Math.max(0, containerWidth - paddingHorizontal * 2);
  const tabWidth = numTabs > 0 ? availableWidth / numTabs : 0;

  // Spring animation for the smooth gliding active capsule pill
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (tabWidth > 0) {
      Animated.spring(slideAnim, {
        toValue: activeVisibleIndex * tabWidth,
        tension: 90,
        friction: 11,
        useNativeDriver: true,
      }).start();
    }
  }, [activeVisibleIndex, tabWidth]);

  const onContainerLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && width !== containerWidth) {
      setContainerWidth(width);
    }
  };

  return (
    <View style={[styles.floatingWrapper, { bottom: bottomOffset }]} pointerEvents="box-none">
      <View
        onLayout={onContainerLayout}
        style={[
          styles.tabBarContainer,
          isDark ? styles.tabBarContainerDark : styles.tabBarContainerLight,
        ]}
      >
        {/* Soft Gliding Active Capsule Pill */}
        {tabWidth > 0 && (
          <Animated.View
            style={[
              styles.slidingIndicator,
              {
                width: tabWidth - 4,
                left: paddingHorizontal + 2,
                transform: [{ translateX: slideAnim }],
              },
            ]}
            pointerEvents="none"
          >
            <View style={isDark ? styles.indicatorPillDark : styles.indicatorPillLight} />
          </Animated.View>
        )}

        {/* Symmetric Tab Items */}
        {visibleRoutes.map((route: { key: string; name: string }, index: number) => {
          const descriptor = descriptors[route.key];
          const options = descriptor ? descriptor.options : ({} as any);
          const isFocused = activeVisibleIndex === index;
          const config = TAB_CONFIG[route.name];

          const onPress = () => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }

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
          const activeColor = isDark ? '#38BDF8' : '#0055D4';
          const inactiveColor = isDark ? '#94A3B8' : '#0F172A';

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabItem}
            >
              <View style={styles.tabContent}>
                <Ionicons
                  name={iconName}
                  size={isFocused ? 22 : 21}
                  color={isFocused ? activeColor : inactiveColor}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    isFocused
                      ? [styles.tabLabelActive, { color: activeColor }]
                      : [styles.tabLabelInactive, { color: inactiveColor }],
                  ]}
                  numberOfLines={1}
                >
                  {config.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 9999,
  },
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 390,
    height: 62,
    borderRadius: 31,
    paddingHorizontal: 6,
    borderWidth: 1,
    position: 'relative',
  },
  tabBarContainerLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 10,
  },
  tabBarContainerDark: {
    backgroundColor: '#161922',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    elevation: 12,
  },
  slidingIndicator: {
    position: 'absolute',
    top: 5,
    bottom: 5,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  indicatorPillDark: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  indicatorPillLight: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    zIndex: 2,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: -0.2,
  },
  tabLabelInactive: {
    fontWeight: '500',
  },
  tabLabelActive: {
    fontWeight: '700',
  },
});

