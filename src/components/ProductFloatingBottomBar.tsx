import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Platform,
  useColorScheme,
  Animated,
  LayoutChangeEvent,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

export type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export interface ProductTabItem {
  key: string;
  label: string;
  activeIcon: IoniconsName;
  inactiveIcon: IoniconsName;
  badge?: number | string;
  description?: string;
}

export interface ProductFloatingBottomBarProps {
  items: ProductTabItem[];
  activeKey: string;
  onChangeTab: (key: string) => void;
  accentColor?: string;
  moreMenuTitle?: string;
  moreTabLabel?: string;
  moreTabActiveIcon?: IoniconsName;
  moreTabInactiveIcon?: IoniconsName;
  pinPrimaryTabs?: boolean;
}

export const ProductFloatingBottomBar: React.FC<ProductFloatingBottomBarProps> = ({
  items,
  activeKey,
  onChangeTab,
  accentColor = '#0A84FF',
  moreMenuTitle = 'More Options',
  moreTabLabel = 'More',
  moreTabActiveIcon = 'apps',
  moreTabInactiveIcon = 'apps-outline',
  pinPrimaryTabs = false,
}) => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [isMoreModalVisible, setIsMoreModalVisible] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  // Bottom floating offset based on safe area
  const bottomOffset = Math.max(insets.bottom, 12);

  const hasOverflow = items.length > 5;

  let visibleItems: (ProductTabItem | { key: string; label: string; activeIcon: IoniconsName; inactiveIcon: IoniconsName; description?: string })[];
  let overflowItems: ProductTabItem[];

  const moreTabItem = {
    key: '__more__',
    label: moreTabLabel,
    activeIcon: moreTabActiveIcon as IoniconsName,
    inactiveIcon: moreTabInactiveIcon as IoniconsName,
    description: 'All additional tools and services',
  };

  if (hasOverflow) {
    const defaultPrimary = items.slice(0, 4);
    const activeItem = items.find((i) => i.key === activeKey);
    const isPrimaryActive = defaultPrimary.some((i) => i.key === activeKey);

    if (!pinPrimaryTabs && !isPrimaryActive && activeItem) {
      visibleItems = [...items.slice(0, 3), activeItem, moreTabItem];
      overflowItems = items.filter((item) => !visibleItems.some((v) => v.key === item.key));
    } else {
      visibleItems = [...defaultPrimary, moreTabItem];
      overflowItems = items.slice(4);
    }
  } else {
    visibleItems = items;
    overflowItems = [];
  }

  const isOverflowActive = overflowItems.some((item) => item.key === activeKey);
  const activeIndex = visibleItems.findIndex((item) =>
    item.key === '__more__' ? isOverflowActive : item.key === activeKey
  );
  const safeActiveIndex = activeIndex >= 0 ? activeIndex : 0;

  const paddingHorizontal = 6;
  const numTabs = visibleItems.length || 4;
  const availableWidth = Math.max(0, containerWidth - paddingHorizontal * 2);
  const tabWidth = numTabs > 0 ? availableWidth / numTabs : 0;
  const pillInset = 4;

  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (tabWidth > 0) {
      Animated.spring(slideAnim, {
        toValue: safeActiveIndex * tabWidth,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }
  }, [safeActiveIndex, tabWidth]);

  const onContainerLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && width !== containerWidth) {
      setContainerWidth(width);
    }
  };

  const handleTabPress = (item: ProductTabItem | { key: string; label: string; activeIcon: IoniconsName; inactiveIcon: IoniconsName }) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (item.key === '__more__') {
      setIsMoreModalVisible(true);
    } else {
      onChangeTab(item.key);
    }
  };

  const handleSelectOverflowItem = (key: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setIsMoreModalVisible(false);
    onChangeTab(key);
  };

  return (
    <>
      <View
        className="absolute left-2.5 right-2.5 items-center z-50"
        style={{ bottom: bottomOffset }}
        pointerEvents="box-none"
      >
        <View
          onLayout={onContainerLayout}
          className={`flex-row items-center w-full max-w-[400px] h-[58px] rounded-full px-1.5 border relative overflow-hidden ${
            isDark
              ? "bg-[#181A1F]/95 border-white/10 shadow-2xl"
              : "bg-white/95 border-black/10 shadow-lg"
          }`}
        >
          {/* Soft Gliding Active Pill */}
          {tabWidth > 0 && (
            <Animated.View
              className="absolute top-1.5 bottom-1.5 justify-center items-center z-0"
              style={{
                width: tabWidth - pillInset * 2,
                left: paddingHorizontal + pillInset,
                transform: [{ translateX: slideAnim }],
              }}
              pointerEvents="none"
            >
              <View
                className="w-full h-full rounded-full"
                style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : `${accentColor}14` }}
              />
            </Animated.View>
          )}

          {/* Tab Items */}
          {visibleItems.map((item, index) => {
            const isMoreTab = item.key === '__more__';
            const isFocused = safeActiveIndex === index;
            const iconName = isFocused ? item.activeIcon : item.inactiveIcon;
            const activeColor = accentColor;
            const inactiveColor = isDark ? '#8E8E93' : '#6B7280';

            return (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                onPress={() => handleTabPress(item)}
                className="flex-1 items-center justify-center h-full z-10"
              >
                <View className="items-center justify-center gap-0.5 w-full">
                  <View className="relative items-center justify-center">
                    <Ionicons
                      name={iconName}
                      size={isFocused ? 21 : 20}
                      color={isFocused ? activeColor : inactiveColor}
                    />
                    {'badge' in item && item.badge ? (
                      <View
                        className="absolute -top-1 -right-2 rounded-full min-w-[14px] h-[14px] px-0.5 items-center justify-center"
                        style={{ backgroundColor: activeColor }}
                      >
                        <Text className="text-white text-[8.5px] font-extrabold">{item.badge}</Text>
                      </View>
                    ) : isMoreTab && isOverflowActive ? (
                      <View
                        className="absolute -top-0.5 -right-1 w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: activeColor }}
                      />
                    ) : null}
                  </View>
                  <Text
                    className={`text-[10.5px] tracking-tight text-center ${
                      isFocused ? 'font-bold' : 'font-medium'
                    }`}
                    style={{
                      color: isFocused ? activeColor : inactiveColor,
                      maxWidth: tabWidth > 0 ? tabWidth - 10 : 55,
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Pop-up Menu Modal for Overflow items */}
      {hasOverflow && (
        <Modal
          visible={isMoreModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsMoreModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setIsMoreModalVisible(false)}>
            <View className="flex-1 bg-black/60 justify-end items-center">
              <TouchableWithoutFeedback>
                <View
                  className={`absolute left-5 right-5 max-w-[380px] rounded-3xl border p-4 max-h-[340px] shadow-2xl ${
                    isDark ? "bg-[#181A1F] border-white/10" : "bg-white border-black/10"
                  }`}
                  style={{ bottom: bottomOffset + 68 }}
                >
                  <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-slate-700/20">
                    <View className="flex-row items-center gap-2">
                      <View
                        className="w-7 h-7 rounded-lg items-center justify-center"
                        style={{ backgroundColor: `${accentColor}18` }}
                      >
                        <Ionicons name="grid" size={16} color={accentColor} />
                      </View>
                      <Text className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                        {moreMenuTitle}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setIsMoreModalVisible(false)}
                      className="p-1"
                      hitSlop={8}
                    >
                      <Ionicons name="close" size={18} color={isDark ? '#94A3B8' : '#64748B'} />
                    </Pressable>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false}>
                    {overflowItems.map((item, idx) => {
                      const isItemActive = activeKey === item.key;
                      return (
                        <Pressable
                          key={item.key}
                          className={`flex-row items-center py-2.5 px-2 rounded-xl gap-2.5 ${
                            isItemActive
                              ? isDark
                                ? "bg-white/5"
                                : "bg-blue-50"
                              : ""
                          } ${
                            idx < overflowItems.length - 1
                              ? isDark
                                ? "border-b border-[#262930]"
                                : "border-b border-slate-100"
                              : ""
                          }`}
                          onPress={() => handleSelectOverflowItem(item.key)}
                        >
                          <View
                            className="w-8.5 h-8.5 rounded-lg items-center justify-center"
                            style={{
                              backgroundColor: isItemActive
                                ? `${accentColor}20`
                                : isDark
                                ? '#121316'
                                : '#F1F5F9',
                            }}
                          >
                            <Ionicons
                              name={isItemActive ? item.activeIcon : item.inactiveIcon}
                              size={18}
                              color={isItemActive ? accentColor : isDark ? '#94A3B8' : '#64748B'}
                            />
                          </View>

                          <View className="flex-1">
                            <Text
                              className={`text-sm ${
                                isItemActive
                                  ? 'font-bold'
                                  : 'font-medium'
                              } ${isDark ? 'text-slate-100' : 'text-slate-900'}`}
                              style={isItemActive ? { color: accentColor } : undefined}
                            >
                              {item.label}
                            </Text>
                            {item.description ? (
                              <Text className="text-xs text-slate-400 mt-0.5" numberOfLines={1}>
                                {item.description}
                              </Text>
                            ) : null}
                          </View>

                          {isItemActive ? (
                            <Ionicons name="checkmark-circle" size={18} color={accentColor} />
                          ) : (
                            <Ionicons name="chevron-forward" size={14} color={isDark ? '#475569' : '#CBD5E1'} />
                          )}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </>
  );
};
