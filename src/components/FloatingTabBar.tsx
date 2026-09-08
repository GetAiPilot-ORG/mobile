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
import { LinearGradient } from 'expo-linear-gradient';
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
  activity: {
    label: 'Inbox',
    activeIcon: 'chatbubbles',
    inactiveIcon: 'chatbubbles-sharp',
  },
  products: {
    label: 'Products',
    activeIcon: 'flash',
    inactiveIcon: 'flash-outline',
  },
  tools: {
    label: 'Tools',
    activeIcon: 'telescope',
    inactiveIcon: 'telescope-outline',
  },
  account: {
    label: 'Account',
    activeIcon: 'person',
    inactiveIcon: 'person-outline',
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
  const bottomOffset = Math.max(insets.bottom + 8, 24);

  // Filter visible routes
  const visibleRoutes = state.routes.filter((route: any) => {
    const descriptor = descriptors[route.key];
    const options = descriptor ? descriptor.options : {};
    return options.href !== null && !!TAB_CONFIG[route.name];
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

  // Spring animation for the liquid glass gliding indicator
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (tabWidth > 0) {
      Animated.spring(slideAnim, {
        toValue: activeVisibleIndex * tabWidth,
        tension: 68,
        friction: 9,
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
        {/* Animated Sliding Liquid Glass Pill */}
        {tabWidth > 0 && (
          <Animated.View
            style={[
              styles.slidingIndicator,
              {
                width: tabWidth,
                left: paddingHorizontal,
                transform: [{ translateX: slideAnim }],
              },
            ]}
            pointerEvents="none"
          >
            {isDark ? (
              <LinearGradient
                colors={['rgba(10, 132, 255, 0.32)', 'rgba(10, 132, 255, 0.16)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.indicatorPillDark}
              />
            ) : (
              <LinearGradient
                colors={['rgba(0, 132, 255, 0.16)', 'rgba(0, 132, 255, 0.08)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.indicatorPillLight}
              />
            )}
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
          const iconColor = isFocused
            ? '#0A84FF'
            : isDark
            ? '#8E8E93'
            : '#6B7280';

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
                  color={iconColor}
                  style={isFocused ? styles.activeIconTransform : undefined}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    isDark ? styles.tabLabelDark : styles.tabLabelLight,
                    isFocused && styles.tabLabelActive,
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
    height: 64,
    borderRadius: 32,
    paddingHorizontal: 6,
    borderWidth: 1.2,
    position: 'relative',
  },
  tabBarContainerLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  tabBarContainerDark: {
    backgroundColor: 'rgba(24, 24, 27, 0.88)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 28,
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
    borderRadius: 25,
    borderWidth: 1.2,
    borderColor: 'rgba(10, 132, 255, 0.45)',
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  indicatorPillLight: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(0, 132, 255, 0.25)',
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
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
    gap: 3,
  },
  activeIconTransform: {
    transform: [{ scale: 1.08 }],
  },
  tabLabel: {
    fontSize: 10.5,
    letterSpacing: -0.2,
  },
  tabLabelLight: {
    color: '#6B7280',
    fontWeight: '600',
  },
  tabLabelDark: {
    color: '#8E8E93',
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#0A84FF',
    fontWeight: '800',
  },
});
