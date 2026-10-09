import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Platform,
  LayoutAnimation,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Animated,
  LayoutChangeEvent,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';

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
  const { isDark } = useTheme();

  const [containerWidth, setContainerWidth] = useState(0);
  const [isMoreModalVisible, setIsMoreModalVisible] = useState(false);

  // Bottom floating offset based on safe area
  const bottomOffset = Math.max(insets.bottom, 12);

  const activeColor = accentColor;
  const inactiveColor = isDark ? '#8E8E93' : '#64748B';

  const hasOverflow = items.length > 5;

  let visibleItems: (
    | ProductTabItem
    | {
        key: string;
        label: string;
        activeIcon: IoniconsName;
        inactiveIcon: IoniconsName;
        description?: string;
      }
  )[];
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
      overflowItems = items.filter(
        (item) => !visibleItems.some((v) => v.key === item.key)
      );
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

  const paddingHorizontal = 8;
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
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
  }, [safeActiveIndex, tabWidth]);

  const onContainerLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && width !== containerWidth) {
      setContainerWidth(width);
    }
  };

  const handleTabPress = (
    item:
      | ProductTabItem
      | {
          key: string;
          label: string;
          activeIcon: IoniconsName;
          inactiveIcon: IoniconsName;
        }
  ) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (item.key === '__more__') {
      setIsMoreModalVisible(true);
    } else {
      LayoutAnimation.configureNext(tabSpringAnimation);
      onChangeTab(item.key);
    }
  };

  const handleSelectOverflowItem = (key: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setIsMoreModalVisible(false);
    LayoutAnimation.configureNext(tabSpringAnimation);
    onChangeTab(key);
  };

  return (
    <>
      <View
        pointerEvents="box-none"
        className="absolute left-4 right-4 items-center z-[9999]"
        style={{ bottom: bottomOffset }}
      >
        <View
          onLayout={onContainerLayout}
          style={{
            position: 'relative',
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
            maxWidth: 460,
            height: 64,
            borderRadius: 32,
            paddingHorizontal: 8,
            borderWidth: 1,
            overflow: 'hidden',
            borderColor: isDark ? 'rgba(35, 69, 99, 0.6)' : 'rgba(0, 0, 0, 0.1)',
            shadowColor: '#000000',
            shadowOpacity: isDark ? 0.6 : 0.15,
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 16,
            elevation: 12,
          }}
        >
          {/* Background Blur Effect */}
          <BlurView
            intensity={Platform.OS === 'ios' ? 85 : 100}
            tint={isDark ? 'dark' : 'light'}
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />
          {/* Glass Tint Overlay */}
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark
                  ? 'rgba(10, 17, 27, 0.50)'
                  : 'rgba(255, 255, 255, 0.60)',
              },
            ]}
          />

          {/* Soft Gliding Active Pill */}
          {tabWidth > 0 && (
            <Animated.View
              style={{
                position: 'absolute',
                top: 6,
                bottom: 6,
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 0,
                pointerEvents: 'none' as any,
                width: tabWidth - pillInset * 2,
                left: paddingHorizontal + pillInset,
                transform: [{ translateX: slideAnim }],
              }}
            >
              <View
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 22,
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : `${accentColor}18`,
                }}
              />
            </Animated.View>
          )}

          {/* Tab Items */}
          {visibleItems.map((item, index) => {
            const isMoreTab = item.key === '__more__';
            const isFocused = safeActiveIndex === index;
            const iconName = isFocused ? item.activeIcon : item.inactiveIcon;

            return (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                onPress={() => handleTabPress(item)}
                className="flex-1 items-center justify-center h-full z-10"
              >
                <View className="items-center justify-center gap-0.5 shrink w-full">
                  <View className="relative items-center justify-center">
                    <Ionicons
                      name={iconName}
                      size={isFocused ? 21 : 20}
                      color={isFocused ? activeColor : inactiveColor}
                    />
                    {'badge' in item && item.badge ? (
                      <View
                        className="absolute -top-1 -right-2 rounded-full min-w-[14px] h-[14px] px-1 items-center justify-center"
                        style={{ backgroundColor: activeColor }}
                      >
                        <Text className="text-white text-[9px] font-extrabold">{item.badge}</Text>
                      </View>
                    ) : isMoreTab && isOverflowActive ? (
                      <View
                        className="absolute -top-0.5 -right-1 w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: activeColor }}
                      />
                    ) : null}
                  </View>
                  <Text
                    className={`text-[11px] tracking-tight text-center ${
                      isFocused ? 'font-bold' : 'font-medium'
                    }`}
                    style={[
                      { color: isFocused ? activeColor : inactiveColor },
                      { maxWidth: tabWidth > 0 ? tabWidth - 8 : 55 },
                    ]}
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

      {/* Pop-up Menu Modal for Overflow items (> 5 items) */}
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
                  className={`absolute left-5 right-5 max-w-[380px] rounded-[24px] border p-4 max-h-[340px] shadow-2xl overflow-hidden ${
                    isDark
                      ? 'border-[#234563]/80 shadow-black/80'
                      : 'border-black/10 shadow-black/20'
                  }`}
                  style={{
                    bottom: bottomOffset + 74,
                    borderRadius: 24,
                    overflow: 'hidden',
                  }}
                >
                  <BlurView
                    intensity={Platform.OS === 'ios' ? 80 : 95}
                    tint={isDark ? 'dark' : 'light'}
                    style={StyleSheet.absoluteFill}
                  />
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        backgroundColor: isDark
                          ? 'rgba(13, 23, 36, 0.90)'
                          : 'rgba(255, 255, 255, 0.92)',
                      },
                    ]}
                  />

                  <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-slate-400/20 z-10">
                    <View className="flex-row items-center gap-2">
                      <View
                        className="w-7 h-7 rounded-lg items-center justify-center"
                        style={{ backgroundColor: `${accentColor}18` }}
                      >
                        <Ionicons name="grid" size={16} color={accentColor} />
                      </View>
                      <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {moreMenuTitle}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setIsMoreModalVisible(false)}
                      className="p-1"
                      hitSlop={8}
                    >
                      <Ionicons name="close" size={18} color={isDark ? '#8FA3B8' : '#64748B'} />
                    </Pressable>
                  </View>

                  <ScrollView className="grow-0 z-10" showsVerticalScrollIndicator={false}>
                    {overflowItems.map((item, idx) => {
                      const isItemActive = activeKey === item.key;
                      return (
                        <Pressable
                          key={item.key}
                          className={`flex-row items-center py-2.5 px-2 rounded-xl gap-2.5 ${
                            isItemActive
                              ? isDark
                                ? 'bg-[#2F8CFF]/10'
                                : 'bg-[#007AFF]/10'
                              : ''
                          } ${
                            idx < overflowItems.length - 1
                              ? isDark
                                ? 'border-b border-[#162B3F]'
                                : 'border-b border-slate-100'
                              : ''
                          }`}
                          onPress={() => handleSelectOverflowItem(item.key)}
                        >
                          <View
                            className={`w-[34px] h-[34px] rounded-[10px] items-center justify-center ${
                              isItemActive
                                ? ''
                                : isDark
                                ? 'bg-[#101C2A]'
                                : 'bg-slate-100'
                            }`}
                            style={isItemActive ? { backgroundColor: `${accentColor}20` } : undefined}
                          >
                            <Ionicons
                              name={isItemActive ? item.activeIcon : item.inactiveIcon}
                              size={18}
                              color={isItemActive ? accentColor : isDark ? '#8FA3B8' : '#64748B'}
                            />
                          </View>

                          <View className="flex-1">
                            <Text
                              className={`text-[13px] ${
                                isItemActive ? 'font-bold' : 'font-semibold'
                              } ${isDark ? 'text-white' : 'text-slate-900'}`}
                              style={isItemActive ? { color: accentColor } : undefined}
                            >
                              {item.label}
                            </Text>
                            {item.description ? (
                              <Text
                                className="text-[11px] text-[#8E8E93] mt-0.5"
                                numberOfLines={1}
                              >
                                {item.description}
                              </Text>
                            ) : null}
                          </View>

                          {isItemActive ? (
                            <Ionicons
                              name="checkmark-circle"
                              size={18}
                              color={accentColor}
                            />
                          ) : (
                            <Ionicons
                              name="chevron-forward"
                              size={14}
                              color={isDark ? '#234563' : '#CBD5E1'}
                            />
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
