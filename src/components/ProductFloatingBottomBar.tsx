import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  useColorScheme,
  LayoutAnimation,
  UIManager,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Animated,
  LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [containerWidth, setContainerWidth] = useState(0);
  const [isMoreModalVisible, setIsMoreModalVisible] = useState(false);

  // Bottom floating offset based on safe area
  const bottomOffset = Math.max(insets.bottom, 12);

  const activeColor = accentColor;
  const inactiveColor = isDark ? '#94A3B8' : '#64748B';

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
      <View style={[styles.floatingWrapper, { bottom: bottomOffset }]} pointerEvents="box-none">
        <View
          onLayout={onContainerLayout}
          style={[
            styles.tabBarContainer,
            isDark ? styles.tabBarContainerDark : styles.tabBarContainerLight,
          ]}
        >
          {/* Soft Gliding Active Pill */}
          {tabWidth > 0 && (
            <Animated.View
              style={[
                styles.slidingIndicator,
                {
                  width: tabWidth - pillInset * 2,
                  left: paddingHorizontal + pillInset,
                  transform: [{ translateX: slideAnim }],
                },
              ]}
              pointerEvents="none"
            >
              <View
                style={[
                  isDark ? styles.indicatorPillDark : styles.indicatorPillLight,
                  { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : `${accentColor}14` },
                ]}
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
                style={styles.tabItem}
              >
                <View style={styles.tabContentAll}>
                  <View style={styles.iconWrapper}>
                    <Ionicons
                      name={iconName}
                      size={isFocused ? 21 : 20}
                      color={isFocused ? activeColor : inactiveColor}
                    />
                    {'badge' in item && item.badge ? (
                      <View style={[styles.badgeDot, { backgroundColor: activeColor }]}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    ) : isMoreTab && isOverflowActive ? (
                      <View style={[styles.activeMiniDot, { backgroundColor: activeColor }]} />
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.tabLabel,
                      isFocused
                        ? [styles.tabLabelActive, { color: activeColor }]
                        : [styles.tabLabelInactive, { color: inactiveColor }],
                      { maxWidth: tabWidth > 0 ? tabWidth - 10 : 55 },
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
            <View style={styles.modalBackdrop}>
              <TouchableWithoutFeedback>
                <View
                  style={[
                    styles.popupCard,
                    isDark ? styles.popupCardDark : styles.popupCardLight,
                    { bottom: bottomOffset + 68 },
                  ]}
                >
                  <View style={styles.popupHeader}>
                    <View style={styles.popupHeaderLeft}>
                      <View style={[styles.popupIconCircle, { backgroundColor: `${accentColor}18` }]}>
                        <Ionicons name="grid" size={16} color={accentColor} />
                      </View>
                      <Text style={[styles.popupTitle, isDark ? styles.textDark : styles.textLight]}>
                        {moreMenuTitle}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setIsMoreModalVisible(false)}
                      style={styles.closeBtn}
                      hitSlop={8}
                    >
                      <Ionicons name="close" size={18} color={isDark ? '#94A3B8' : '#64748B'} />
                    </Pressable>
                  </View>

                  <ScrollView style={styles.popupScroll} showsVerticalScrollIndicator={false}>
                    {overflowItems.map((item, idx) => {
                      const isItemActive = activeKey === item.key;
                      return (
                        <Pressable
                          key={item.key}
                          style={[
                            styles.popupItem,
                            isItemActive && (isDark ? styles.popupItemActiveDark : styles.popupItemActiveLight),
                            idx < overflowItems.length - 1 && styles.popupItemBorder,
                            idx < overflowItems.length - 1 && (isDark ? styles.borderDark : styles.borderLight),
                          ]}
                          onPress={() => handleSelectOverflowItem(item.key)}
                        >
                          <View
                            style={[
                              styles.popupItemIconBox,
                              { backgroundColor: isItemActive ? `${accentColor}20` : isDark ? '#1E293B' : '#F1F5F9' },
                            ]}
                          >
                            <Ionicons
                              name={isItemActive ? item.activeIcon : item.inactiveIcon}
                              size={18}
                              color={isItemActive ? accentColor : isDark ? '#94A3B8' : '#64748B'}
                            />
                          </View>

                          <View style={styles.popupItemContent}>
                            <Text
                              style={[
                                styles.popupItemLabel,
                                isDark ? styles.textDark : styles.textLight,
                                isItemActive && { color: accentColor, fontWeight: '700' },
                              ]}
                            >
                              {item.label}
                            </Text>
                            {item.description ? (
                              <Text style={styles.popupItemDesc} numberOfLines={1}>
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

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    left: 10,
    right: 10,
    alignItems: 'center',
    zIndex: 9999,
  },
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    height: 58,
    borderRadius: 29,
    paddingHorizontal: 6,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  tabBarContainerLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  tabBarContainerDark: {
    backgroundColor: 'rgba(28, 28, 30, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  slidingIndicator: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  indicatorPillDark: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  indicatorPillLight: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    zIndex: 1,
  },
  tabContentAll: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    flexShrink: 1,
    width: '100%',
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: {
    position: 'absolute',
    top: -4,
    right: -8,
    borderRadius: 8,
    minWidth: 14,
    height: 14,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
  },
  activeMiniDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tabLabel: {
    fontSize: 10.5,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  tabLabelInactive: {
    fontWeight: '500',
  },
  tabLabelActive: {
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  popupCard: {
    position: 'absolute',
    left: 20,
    right: 20,
    maxWidth: 380,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    maxHeight: 340,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 16,
  },
  popupCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  popupCardDark: {
    backgroundColor: '#1E1E24',
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
  },
  popupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  popupIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  popupScroll: {
    flexGrow: 0,
  },
  popupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 10,
  },
  popupItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  borderLight: {
    borderBottomColor: '#F1F5F9',
  },
  borderDark: {
    borderBottomColor: '#2D2D38',
  },
  popupItemActiveLight: {
    backgroundColor: 'rgba(0, 122, 255, 0.06)',
  },
  popupItemActiveDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  popupItemIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupItemContent: {
    flex: 1,
  },
  popupItemLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  popupItemDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  textLight: {
    color: '#0F172A',
  },
  textDark: {
    color: '#F8FAFC',
  },
});
