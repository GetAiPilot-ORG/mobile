import React, { useState } from 'react';
import {
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme, getColors } from '@/theme';

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
  accentColor,
  moreMenuTitle = 'More Options',
  moreTabLabel = 'More',
  moreTabActiveIcon = 'apps',
  moreTabInactiveIcon = 'apps-outline',
  pinPrimaryTabs = false,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const [isMoreModalVisible, setIsMoreModalVisible] = useState(false);

  // Bottom floating offset based on safe area
  const bottomOffset = Math.max(insets.bottom, 12);
  const activeColor = accentColor || colors.primary;

  const hasOverflow = items.length > 5;

  let visibleItems: (
    | ProductTabItem
    | {
      key: string;
      label: string;
      activeIcon: IoniconsName;
      inactiveIcon: IoniconsName;
      description?: string;
      badge?: number | string;
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

  const handleSelectOverflowItem = (key: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setIsMoreModalVisible(false);
    LayoutAnimation.configureNext(tabSpringAnimation);
    onChangeTab(key);
  };

  return (
    <View style={styles.dockRoot} pointerEvents="box-none">
      {/* 1. Full-bleed Bottom Frosted Backdrop that blurs all scrolled content behind it and fills the bottom screen area */}
      <View
        style={[
          styles.backdropWrapper,
          {
            height: 56 + bottomOffset + 12,
          },
        ]}
        pointerEvents="none"
      >
        <BlurView
          intensity={Platform.OS === 'ios' ? 75 : 95}
          tint={isDark ? 'dark' : 'light'}
          experimentalBlurMethod="dimezisBlurView"
          style={[
            StyleSheet.absoluteFill,
            Platform.OS === 'web'
              ? ({ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } as any)
              : undefined,
          ]}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark
                ? 'rgba(17, 16, 15, 0.65)'
                : 'rgba(247, 245, 242, 0.70)',
              // borderTopWidth: StyleSheet.hairlineWidth,
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
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(0, 0, 0, 0.08)',
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: isDark ? 0.45 : 0.12,
              shadowRadius: 18,
              elevation: 12,
            },
          ]}
        >
          {/* Inner Blur on the Pill */}
          <BlurView
            intensity={Platform.OS === 'ios' ? 85 : 70}
            tint={isDark ? 'dark' : 'light'}
            experimentalBlurMethod="dimezisBlurView"
            style={[
              StyleSheet.absoluteFill,
              Platform.OS === 'web'
                ? ({ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } as any)
                : undefined,
            ]}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark
                  ? 'rgba(25, 23, 21, 0.09)'
                  : 'rgba(253, 252, 251, 0)',
              },
            ]}
          />

          {visibleItems.map((item) => {
            const isMoreTab = item.key === '__more__';
            const isFocused = isMoreTab ? isOverflowActive : activeKey === item.key;
            const iconName = isFocused ? item.activeIcon : item.inactiveIcon;

            const onPress = () => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }

              if (isMoreTab) {
                setIsMoreModalVisible(true);
              } else {
                LayoutAnimation.configureNext(tabSpringAnimation);
                onChangeTab(item.key);
              }
            };

            if (isFocused) {
              return (
                <Pressable
                  key={item.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: true }}
                  onPress={onPress}
                  style={[
                    styles.activePill,
                    { backgroundColor: activeColor },
                  ]}
                >
                  <Ionicons
                    name={iconName}
                    size={19}
                    color="#FFFFFF"
                  />
                  <Text
                    style={styles.activeLabel}
                    numberOfLines={1}
                  >
                    {isMoreTab && isOverflowActive
                      ? overflowItems.find((o) => o.key === activeKey)?.label || item.label
                      : item.label}
                  </Text>
                  {'badge' in item && item.badge ? (
                    <View style={styles.badgePillActive}>
                      <Text style={[styles.badgeTextActive, { color: activeColor }]}>
                        {item.badge}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            }

            return (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityState={{ selected: false }}
                onPress={onPress}
                style={[
                  styles.inactiveButton,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.07)'
                      : 'rgba(0, 0, 0, 0.04)',
                  },
                ]}
              >
                <View style={styles.iconWrap}>
                  <Ionicons
                    name={iconName}
                    size={20}
                    color={colors.textMuted}
                  />
                  {'badge' in item && item.badge ? (
                    <View style={[styles.badgeInactive, { backgroundColor: activeColor }]}>
                      <Text style={styles.badgeTextInactive}>{item.badge}</Text>
                    </View>
                  ) : isMoreTab && isOverflowActive ? (
                    <View style={[styles.moreActiveDot, { backgroundColor: activeColor }]} />
                  ) : null}
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
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View
                  style={[
                    styles.modalContainer,
                    {
                      bottom: bottomOffset + 68,
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                    },
                  ]}
                >
                  <BlurView
                    intensity={Platform.OS === 'ios' ? 85 : 95}
                    tint={isDark ? 'dark' : 'light'}
                    experimentalBlurMethod="dimezisBlurView"
                    style={[
                      StyleSheet.absoluteFill,
                      Platform.OS === 'web'
                        ? ({ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } as any)
                        : undefined,
                    ]}
                  />
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        backgroundColor: isDark
                          ? 'rgba(25, 23, 21, 0.88)'
                          : 'rgba(253, 252, 251, 0.90)',
                      },
                    ]}
                  />

                  <View
                    style={[
                      styles.modalHeader,
                      {
                        borderBottomColor: isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.06)',
                      },
                    ]}
                  >
                    <View style={styles.modalHeaderTitleRow}>
                      <View
                        style={[
                          styles.modalHeaderIconBox,
                          { backgroundColor: `${activeColor}18` },
                        ]}
                      >
                        <Ionicons name="grid" size={16} color={activeColor} />
                      </View>
                      <Text
                        style={[
                          styles.modalHeaderTitle,
                          { color: isDark ? '#FFFFFF' : '#0F172A' },
                        ]}
                      >
                        {moreMenuTitle}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setIsMoreModalVisible(false)}
                      style={styles.modalCloseButton}
                      hitSlop={8}
                    >
                      <Ionicons
                        name="close"
                        size={18}
                        color={isDark ? '#8FA3B8' : '#64748B'}
                      />
                    </Pressable>
                  </View>

                  <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                    {overflowItems.map((item, idx) => {
                      const isItemActive = activeKey === item.key;
                      return (
                        <Pressable
                          key={item.key}
                          style={[
                            styles.modalItemRow,
                            isItemActive && {
                              backgroundColor: `${activeColor}15`,
                            },
                            idx < overflowItems.length - 1 && {
                              borderBottomWidth: StyleSheet.hairlineWidth,
                              borderBottomColor: isDark
                                ? 'rgba(255, 255, 255, 0.06)'
                                : 'rgba(0, 0, 0, 0.05)',
                            },
                          ]}
                          onPress={() => handleSelectOverflowItem(item.key)}
                        >
                          <View
                            style={[
                              styles.modalItemIconBox,
                              {
                                backgroundColor: isItemActive
                                  ? `${activeColor}20`
                                  : isDark
                                    ? 'rgba(255, 255, 255, 0.06)'
                                    : 'rgba(0, 0, 0, 0.04)',
                              },
                            ]}
                          >
                            <Ionicons
                              name={isItemActive ? item.activeIcon : item.inactiveIcon}
                              size={18}
                              color={isItemActive ? activeColor : isDark ? '#8FA3B8' : '#64748B'}
                            />
                          </View>

                          <View style={styles.modalItemTextCol}>
                            <Text
                              style={[
                                styles.modalItemLabel,
                                {
                                  color: isItemActive
                                    ? activeColor
                                    : isDark
                                      ? '#FFFFFF'
                                      : '#0F172A',
                                },
                                isItemActive && { fontWeight: '700' },
                              ]}
                            >
                              {item.label}
                            </Text>
                            {item.description ? (
                              <Text
                                style={styles.modalItemDesc}
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
                              color={activeColor}
                            />
                          ) : (
                            <Ionicons
                              name="chevron-forward"
                              size={14}
                              color={isDark ? '#4B5563' : '#CBD5E1'}
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
    </View>
  );
};

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
    borderWidth: 1,
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
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
  },
  activeLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: '#FFFFFF',
  },
  inactiveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    width: 44,
    borderRadius: 22,
  },
  iconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePillActive: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 2,
  },
  badgeTextActive: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeInactive: {
    position: 'absolute',
    top: -5,
    right: -8,
    borderRadius: 8,
    minWidth: 14,
    height: 14,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTextInactive: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  moreActiveDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    maxHeight: 340,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalHeaderIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScroll: {
    flexGrow: 0,
    zIndex: 10,
  },
  modalItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 10,
  },
  modalItemIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalItemTextCol: {
    flex: 1,
  },
  modalItemLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalItemDesc: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
});
