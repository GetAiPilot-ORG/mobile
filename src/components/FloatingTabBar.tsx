import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Platform,
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

  // Bottom floating offset based on safe area
  const bottomOffset = Math.max(insets.bottom, 12);

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
    <View className="absolute left-5 right-5 items-center z-[9999]" style={{ bottom: bottomOffset }} pointerEvents="box-none">
      <View
        onLayout={onContainerLayout}
        className="flex-row items-center w-full max-w-[390px] h-[62px] rounded-full px-1.5 border relative bg-[#161922] border-white/10 shadow-2xl elevation-12"
      >
        {/* Soft Gliding Active Capsule Pill */}
        {tabWidth > 0 && (
          <Animated.View
            className="absolute top-1.5 bottom-1.5 justify-center items-center z-[1]"
            style={{
              width: tabWidth - 4,
              left: paddingHorizontal + 2,
              transform: [{ translateX: slideAnim }],
            }}
            pointerEvents="none"
          >
            <View className="w-full h-full rounded-full bg-white/10" />
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
          const activeColor = '#0084FF';
          const inactiveColor = '#94A3B8';

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              className="flex-1 items-center justify-center h-full z-[2]"
            >
              <View className="items-center justify-center gap-0.5">
                <Ionicons
                  name={iconName}
                  size={isFocused ? 22 : 21}
                  color={isFocused ? activeColor : inactiveColor}
                />
                <Text
                  className={`text-[11px] tracking-tight ${
                    isFocused ? 'font-bold text-[#0084FF]' : 'font-medium text-slate-400'
                  }`}
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
