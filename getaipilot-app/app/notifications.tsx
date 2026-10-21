import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  Alert,
  Platform,
  StyleSheet,
  Animated,
  PanResponder,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { AppScreen } from '../src/components/AppScreen';
import { AppTopBar } from '../src/components/AppTopBar';
import { useNotifications, AppNotification } from '../src/contexts/NotificationContext';
import { useTheme, getColors } from '@/theme';

type FilterTab = 'all' | 'unread' | 'clicks' | 'lead' | 'broadcast' | 'system';

interface SwipeableCardProps {
  item: AppNotification;
  isDark: boolean;
  accentColor: string;
  onPress: (item: AppNotification) => void;
  onToggleRead: (item: AppNotification) => void;
  onDelete: (item: AppNotification) => void;
}

/**
 * 100% Native PanResponder-based Swipeable Card
 * Guaranteed to work smoothly on all Android & iOS devices without FlatList gesture conflicts!
 */
function SwipeableNotificationCard({
  item,
  isDark,
  accentColor,
  onPress,
  onToggleRead,
  onDelete,
}: SwipeableCardProps) {
  const pan = useRef(new Animated.Value(0)).current;
  const isUnread = !item.isRead;
  const isActionOpen = useRef(false);

  // Category Meta (Icon, Color, Label)
  const getCategoryMeta = (type?: string) => {
    switch (type) {
      case 'lead':
        return {
          icon: 'person-add' as const,
          color: '#10B981',
          bg: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5',
          label: 'Lead Alert',
        };
      case 'message':
        return {
          icon: 'chatbubbles' as const,
          color: '#3B82F6',
          bg: isDark ? 'rgba(59, 130, 246, 0.2)' : '#EFF6FF',
          label: 'Message',
        };
      case 'billing':
        return {
          icon: 'card' as const,
          color: '#8B5CF6',
          bg: isDark ? 'rgba(139, 92, 246, 0.2)' : '#F5F3FF',
          label: 'Billing',
        };
      case 'system':
        return {
          icon: 'shield-checkmark' as const,
          color: '#6366F1',
          bg: isDark ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF',
          label: 'System',
        };
      case 'info':
      case 'broadcast':
      case 'announcement':
        return {
          icon: 'megaphone' as const,
          color: '#0EA5E9',
          bg: isDark ? 'rgba(14, 165, 233, 0.2)' : '#E0F2FE',
          label: 'Admin Broadcast',
        };
      case 'page_click':
        return {
          icon: 'trophy' as const,
          color: '#F59E0B',
          bg: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7',
          label: 'Milestone',
        };
      case 'page_view':
        return {
          icon: 'eye' as const,
          color: '#8B5CF6',
          bg: isDark ? 'rgba(139, 92, 246, 0.2)' : '#F5F3FF',
          label: 'Page View',
        };
      case 'analytics':
        return {
          icon: 'stats-chart' as const,
          color: '#3B82F6',
          bg: isDark ? 'rgba(59, 130, 246, 0.2)' : '#EFF6FF',
          label: 'Analytics',
        };
      default:
        return {
          icon: 'notifications' as const,
          color: '#F59E0B',
          bg: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7',
          label: 'Update',
        };
    }
  };

  const meta = getCategoryMeta(item.type);

  // Helper for relative timestamps
  const getRelativeTime = (isoString?: string) => {
    if (!isoString) return '';
    const now = Date.now();
    const created = new Date(isoString).getTime();
    const diffMin = Math.floor((now - created) / 60000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  const resetPosition = () => {
    isActionOpen.current = false;
    Animated.spring(pan, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  };

  const snapOpenRight = () => {
    isActionOpen.current = true;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.spring(pan, {
      toValue: 90,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  };

  const snapOpenLeft = () => {
    isActionOpen.current = true;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.spring(pan, {
      toValue: -90,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Detect horizontal movement and ignore mostly-vertical scrolling
        return (
          Math.abs(gestureState.dx) > 12 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5
        );
      },
      onPanResponderMove: (_, gestureState) => {
        // Limit maximum swipe distance with gentle resistance
        let newX = gestureState.dx;
        if (newX > 140) newX = 140 + (newX - 140) * 0.2;
        if (newX < -140) newX = -140 + (newX + 140) * 0.2;
        pan.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        // Full swipe left -> delete immediately
        if (gestureState.dx < -150) {
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
          Animated.timing(pan, {
            toValue: -400,
            duration: 200,
            useNativeDriver: true,
          }).start(() => onDelete(item));
          return;
        }

        // Full swipe right -> toggle read immediately
        if (gestureState.dx > 150) {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          resetPosition();
          onToggleRead(item);
          return;
        }

        // Medium swipe left -> snap open to reveal Delete button
        if (gestureState.dx < -45) {
          snapOpenLeft();
          return;
        }

        // Medium swipe right -> snap open to reveal Read/Unread button
        if (gestureState.dx > 45) {
          snapOpenRight();
          return;
        }

        // Slight drag -> spring back to center
        resetPosition();
      },
      onPanResponderTerminate: () => {
        resetPosition();
      },
    })
  ).current;

  // Distinct Solid Card Colors for Read vs Unread (100% opaque, zero bleed-through)
  const cardBg = isUnread
    ? isDark
      ? '#221D38' // Elevated rich purple-slate for Unread
      : '#FFFFFF' // Clean high-contrast white on light canvas
    : isDark
    ? '#161322' // Solid opaque dark surface for Read
    : '#F6F3FA'; // Solid opaque soft surface for Read

  const cardBorderColor = isUnread
    ? isDark
      ? 'rgba(167, 139, 250, 0.45)' // Glowing border for Unread
      : '#DDD6FE'
    : isDark
    ? '#272338' // Solid subtle border for Read
    : '#E8E3F2';

  const titleColor = isUnread
    ? isDark
      ? '#FFFFFF'
      : '#111827'
    : isDark
    ? '#8C869D'
    : '#6B7280';

  const bodyColor = isUnread
    ? isDark
      ? '#D1C9E2'
      : '#374151'
    : isDark
    ? '#716B80'
    : '#8F8A9E';

  // Distinct Color for Swipe Actions:
  // Slide Left Action = Delete Red (#EF4444)
  // Slide Right Action = Mark Read Emerald (#10B981) OR Mark Unread Blue (#6366F1)
  const readActionBg = isUnread ? '#10B981' : '#6366F1';

  // Interpolate action button opacities: hidden at rest (0), fade in on swipe
  const leftActionOpacity = pan.interpolate({
    inputRange: [0, 25, 75],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });

  const rightActionOpacity = pan.interpolate({
    inputRange: [-75, -25, 0],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.cardOuterWrapper}>
      {/* BACKGROUND ACTIONS LAYER (Only visible when swiping) */}
      <View style={styles.actionsBackgroundLayer}>
        {/* Left Action (Revealed on Swipe Right): Mark Read / Unread */}
        <Animated.View style={[styles.underActionWrapper, { opacity: leftActionOpacity }]}>
          <Pressable
            style={[styles.underActionLeft, { backgroundColor: readActionBg }]}
            onPress={() => {
              resetPosition();
              onToggleRead(item);
            }}
          >
            <Ionicons
              name={isUnread ? 'checkmark-circle' : 'mail-unread'}
              size={22}
              color="#FFFFFF"
            />
            <Text style={styles.underActionText}>
              {isUnread ? 'Mark Read' : 'Unread'}
            </Text>
          </Pressable>
        </Animated.View>

        {/* Right Action (Revealed on Swipe Left): Delete */}
        <Animated.View style={[styles.underActionWrapper, { opacity: rightActionOpacity }]}>
          <Pressable
            style={[styles.underActionRight, { backgroundColor: '#EF4444' }]}
            onPress={() => {
              resetPosition();
              onDelete(item);
            }}
          >
            <Ionicons name="trash" size={22} color="#FFFFFF" />
            <Text style={styles.underActionText}>Delete</Text>
          </Pressable>
        </Animated.View>
      </View>

      {/* FOREGROUND SWIPEABLE CARD */}
      <Animated.View
        style={[
          styles.cardContainer,
          {
            backgroundColor: cardBg,
            borderColor: cardBorderColor,
            opacity: 1, // Always 100% solid opacity so actions underneath never bleed through
            transform: [{ translateX: pan }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Pressable
          onPress={() => {
            if (isActionOpen.current) {
              resetPosition();
            } else {
              onPress(item);
            }
          }}
          style={({ pressed }) => [{ opacity: pressed ? 0.94 : 1 }]}
        >
          {/* Top Right Status Badge / Pill */}
          <View style={styles.topStatusRight}>
            {isUnread ? (
              <View style={styles.unreadStatusPill}>
                <View style={[styles.unreadPulseDot, { backgroundColor: meta.color }]} />
                <Text style={[styles.unreadStatusText, { color: meta.color }]}>NEW</Text>
              </View>
            ) : (
              <View style={styles.readStatusPill}>
                <Ionicons name="checkmark" size={12} color={isDark ? '#6B657B' : '#948E9F'} />
                <Text style={[styles.readStatusText, { color: isDark ? '#6B657B' : '#948E9F' }]}>
                  Read
                </Text>
              </View>
            )}
          </View>

          <View style={styles.cardHeaderRow}>
            {/* Category Icon */}
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: meta.bg,
                  opacity: isUnread ? 1 : 0.65,
                },
              ]}
            >
              <Ionicons name={meta.icon} size={18} color={meta.color} />
            </View>

            {/* Title & Category Badge */}
            <View style={styles.titleColumn}>
              <View style={styles.badgeRow}>
                <Text
                  style={[
                    styles.categoryBadgeText,
                    { color: meta.color, backgroundColor: meta.bg },
                  ]}
                >
                  {meta.label}
                </Text>
                <Text
                  style={[
                    styles.timestampText,
                    { color: isDark ? '#8A829D' : '#8E8A9E' },
                  ]}
                >
                  {getRelativeTime(item.createdAt)}
                </Text>
              </View>

              <Text
                style={[
                  styles.notificationTitle,
                  {
                    color: titleColor,
                    fontWeight: isUnread ? '700' : '500',
                  },
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
            </View>
          </View>

          {/* Notification Body */}
          <Text
            style={[
              styles.notificationBody,
              { color: bodyColor },
            ]}
            numberOfLines={3}
          >
            {item.body}
          </Text>

          {/* Hint row for gestures & navigation */}
          <View style={styles.cardFooter}>
            <View style={styles.swipeHintRow}>
              <Ionicons
                name="swap-horizontal-outline"
                size={12}
                color={isDark ? '#746D84' : '#9B94AB'}
              />
              <Text
                style={[
                  styles.swipeHintText,
                  { color: isDark ? '#746D84' : '#9B94AB' },
                ]}
              >
                Slide ➔ {isUnread ? 'Read' : 'Unread'} | Slide  Delete
              </Text>
            </View>

            {item.data?.route ? (
              <View style={styles.routeActionRow}>
                <Text style={[styles.routeActionText, { color: accentColor }]}>
                  Open
                </Text>
                <Ionicons name="chevron-forward" size={13} color={accentColor} />
              </View>
            ) : null}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const {
    notificationsList,
    unreadCount,
    markAsRead,
    toggleReadStatus,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    addNotification,
    refreshNotifications,
    isRefreshing,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  // Filtered notifications
  const filteredNotifications = notificationsList.filter((item) => {
    if (activeTab === 'unread') return !item.isRead;
    if (activeTab === 'clicks')
      return item.type === 'page_click' || item.type === 'page_view' || item.type === 'analytics';
    if (activeTab === 'lead') return item.type === 'lead';
    if (activeTab === 'broadcast')
      return item.type === 'info' || item.type === 'broadcast' || item.type === 'announcement';
    if (activeTab === 'system') return item.type === 'system';
    return true;
  });

  const handleCardPress = async (item: AppNotification) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (!item.isRead) {
      await markAsRead(item.id);
    }
    const route =
      item.data?.route ||
      item.data?.url ||
      (item.type === 'page_click' || item.type === 'page_view' || item.type === 'analytics'
        ? '/tools/my-designs'
        : undefined);
    if (route && typeof route === 'string') {
      try {
        router.push(route as any);
      } catch (err) {
        console.warn('Failed to route from notification:', err);
      }
    }
  };

  const handleToggleRead = async (item: AppNotification) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await toggleReadStatus(item.id);
  };

  const handleDelete = (item: AppNotification) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    deleteNotification(item.id);
  };

  const handleClearAll = () => {
    if (notificationsList.length === 0) return;
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to remove all notifications from your inbox?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            clearAllNotifications();
          },
        },
      ]
    );
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await markAllAsRead();
  };

  return (
    <AppScreen safeArea={false}>
      {/* Top Header */}
      <AppTopBar
        title="Notifications"
        showBack={true}
        showNotificationIcon={false}
        rightElement={
          <View style={styles.headerRightActions}>

            {unreadCount > 0 && (
              <Pressable
                onPress={handleMarkAllRead}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.headerIconButton,
                  {
                    backgroundColor: isDark ? '#252136' : '#EFEBF8',
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                accessibilityLabel="Mark all as read"
              >
                <Ionicons name="checkmark-done" size={17} color={colors.accent || '#6366F1'} />
              </Pressable>
            )}

            {notificationsList.length > 0 && (
              <Pressable
                onPress={handleClearAll}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.headerIconButton,
                  {
                    backgroundColor: isDark ? '#252136' : '#EFEBF8',
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                accessibilityLabel="Clear all notifications"
              >
                <Ionicons name="trash-outline" size={17} color="#EF4444" />
              </Pressable>
            )}
          </View>
        }
      />

      {/* Scrollable Category Filter Tabs FlatList */}
      <View style={[styles.filterBarContainer, { borderBottomColor: isDark ? '#252136' : '#ECE8F5' }]}>
        <FlatList
          data={[
            { id: 'all' as const, label: 'All', count: notificationsList.length },
            { id: 'unread' as const, label: 'Unread', count: unreadCount },
            {
              id: 'clicks' as const,
              label: 'Milestones',
              count: notificationsList.filter(
                (n) => n.type === 'page_click' || n.type === 'page_view' || n.type === 'analytics'
              ).length,
            },
            {
              id: 'lead' as const,
              label: 'Leads',
              count: notificationsList.filter((n) => n.type === 'lead').length,
            },
            {
              id: 'broadcast' as const,
              label: 'Broadcasts',
              count: notificationsList.filter(
                (n) => n.type === 'info' || n.type === 'broadcast' || n.type === 'announcement'
              ).length,
            },
            {
              id: 'system' as const,
              label: 'System',
              count: notificationsList.filter((n) => n.type === 'system').length,
            },
          ]}
          keyExtractor={(tab) => tab.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
          renderItem={({ item: tab }) => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setActiveTab(tab.id);
                }}
                style={[
                  styles.tabButton,
                  isActive
                    ? {
                        backgroundColor: isDark ? '#2C2740' : '#E9E3FA',
                        borderColor: colors.accent || '#6366F1',
                        borderWidth: 1,
                      }
                    : {
                        backgroundColor: isDark ? '#1B1728' : '#F6F2FC',
                        borderColor: isDark ? '#28233A' : '#EAE4F4',
                        borderWidth: 1,
                      },
                ]}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive
                        ? colors.accent || '#6366F1'
                        : isDark
                        ? '#8E87A1'
                        : '#6B667A',
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
                {tab.count > 0 && (
                  <View
                    style={[
                      styles.tabBadge,
                      {
                        backgroundColor: isActive
                          ? colors.accent || '#6366F1'
                          : isDark
                          ? '#352F4C'
                          : '#DDD7EC',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeText,
                        { color: isActive ? '#FFFFFF' : isDark ? '#B3ABD0' : '#575168' },
                      ]}
                    >
                      {tab.count}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          }}
        />
      </View>

      {/* Notifications List / Empty State */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshNotifications}
            tintColor={colors.accent || '#6366F1'}
            colors={[colors.accent || '#6366F1']}
          />
        }
        renderItem={({ item }) => (
          <SwipeableNotificationCard
            item={item}
            isDark={isDark}
            accentColor={colors.accent || '#6366F1'}
            onPress={handleCardPress}
            onToggleRead={handleToggleRead}
            onDelete={handleDelete}
          />
        )}
        contentContainerStyle={[
          styles.listContainer,
          filteredNotifications.length === 0 && styles.emptyListContainer,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: isDark ? '#221F31' : '#F1EDFA' },
              ]}
            >
              <Ionicons
                name="notifications-off-outline"
                size={42}
                color={isDark ? '#7E7693' : '#9B93AD'}
              />
            </View>
            <Text
              style={[
                styles.emptyTitle,
                { color: isDark ? '#FFFFFF' : '#14121F' },
              ]}
            >
              {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </Text>
            <Text
              style={[
                styles.emptySubtitle,
                { color: isDark ? '#9B94AB' : '#6A637C' },
              ]}
            >
              Jab bhi aapko lead, CRM activity ya bot alerts aayenge, woh yahan real-time me dikhenge.
            </Text>
          </View>
        }
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBarContainer: {
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  tabLabel: {
    fontSize: 13,
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 60,
    gap: 12,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardOuterWrapper: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
  },
  actionsBackgroundLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  underActionWrapper: {
    height: '100%',
  },
  underActionLeft: {
    height: '100%',
    width: 85,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    gap: 4,
  },
  underActionRight: {
    height: '100%',
    width: 85,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    gap: 4,
  },
  underActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  cardContainer: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    gap: 10,
    position: 'relative',
  },
  topStatusRight: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  unreadStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  readStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(156, 163, 175, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  readStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleColumn: {
    flex: 1,
    gap: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 60,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  timestampText: {
    fontSize: 11,
    fontWeight: '500',
  },
  notificationTitle: {
    fontSize: 15,
    marginTop: 2,
    letterSpacing: -0.2,
  },
  notificationBody: {
    fontSize: 13,
    lineHeight: 18,
    paddingLeft: 50,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 50,
    marginTop: 2,
  },
  swipeHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  swipeHintText: {
    fontSize: 11,
  },
  routeActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  routeActionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 24,
  },
});
