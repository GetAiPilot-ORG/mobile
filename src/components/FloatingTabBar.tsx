import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  useColorScheme,
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
    inactiveIcon: 'home-sharp',
  },
  products: {
    label: 'Products',
    activeIcon: 'flash',
    inactiveIcon: 'flash-sharp',
  },
  tools: {
    label: 'Tools',
    activeIcon: 'telescope',
    inactiveIcon: 'telescope-sharp',
  },
  account: {
    label: 'Account',
    activeIcon: 'person',
    inactiveIcon: 'person-sharp',
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

  // Calculate bottom floating inset
  const bottomOffset = Math.max(insets.bottom + 6, 20);

  return (
    <View
      style={[
        styles.floatingWrapper,
        { bottom: bottomOffset },
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.tabBarContainer, isDark && styles.tabBarContainerDark]}>
        {state.routes.map((route: { key: string; name: string }, index: number) => {
          const descriptor = descriptors[route.key];
          const options = descriptor ? descriptor.options : ({} as any);

          // Skip hidden routes (like activity or admin tab from bottom bar)
          if (options.href === null || !TAB_CONFIG[route.name]) return null;

          const isFocused = state.index === index;
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
            ? '#0084FF'
            : isDark
            ? '#FFFFFF'
            : '#000000';

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
              <View
                style={[
                  styles.iconCapsule,
                  isFocused && styles.iconCapsuleActive,
                  isDark && isFocused && styles.iconCapsuleActiveDark,
                ]}
              >
                <Ionicons name={iconName} size={22} color={iconColor} />
                <Text
                  style={[
                    styles.tabLabel,
                    isDark && styles.tabLabelDark,
                    isFocused && styles.tabLabelActive,
                    isDark && isFocused && styles.tabLabelActiveDark,
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
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 9999,
  },
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 420,
    height: 68,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 36,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 26,
    elevation: 12,
  },
  tabBarContainerDark: {
    backgroundColor: 'rgba(26, 26, 28, 0.94)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOpacity: 0.45,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconCapsule: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 22,
    gap: 3,
    minWidth: 64,
  },
  iconCapsuleActive: {
    backgroundColor: '#F0F2F5',
  },
  iconCapsuleActiveDark: {
    backgroundColor: 'rgba(0, 132, 255, 0.15)',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.2,
  },
  tabLabelDark: {
    color: '#FFFFFF',
  },
  tabLabelActive: {
    color: '#0084FF',
    fontWeight: '700',
  },
  tabLabelActiveDark: {
    color: '#3B82F6',
    fontWeight: '700',
  },
});
