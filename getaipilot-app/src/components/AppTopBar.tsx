import { Ionicons } from '@expo/vector-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, ArrowRight01Icon } from '@/constants/icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter, usePathname } from 'expo-router';
import { useAuthStore } from '../core/store/authStore';
import { useTheme, getColors } from '@/theme';
import React, { useEffect } from 'react';
import { BackHandler, Platform, Pressable, StatusBar, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlatformSubscription } from '../hooks/usePlatformSubscription';
import { useNotifications } from '../contexts/NotificationContext';

export interface AppTopBarProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
  onBackPress?: () => void;
  parentRoute?: string;
  showPlanBadge?: boolean;
  showNotificationIcon?: boolean;
}

/**
 * Intelligent parent route resolver so sub-screens never fall back blindly to Home screen
 */
export const getParentRoute = (pathname: string): string => {
  if (!pathname) return '/(tabs)';

  // 1. Tool sub-screens -> go to Tools tab
  if (pathname.startsWith('/tools/')) {
    return '/(tabs)/tools';
  }

  // 2. Pricing / Plans routes -> go to Account or Products tab
  if (pathname === '/pricing' || pathname === '/plans') {
    return '/(tabs)/account';
  }
  if (pathname.startsWith('/account/plans')) {
    return '/(tabs)/account';
  }

  // 3. CRM sub-screens -> go to CRM overview or Products tab
  if (pathname.startsWith('/products/crm/leads/')) {
    return '/products/crm';
  }
  if (pathname.startsWith('/products/crm/pipeline')) {
    return '/products/crm';
  }
  if (pathname.startsWith('/products/crm')) {
    return '/(tabs)/products';
  }
  if (pathname.startsWith('/crm/')) {
    return '/products/crm';
  }

  // 4. WhatsApp sub-screens -> go to WhatsApp overview or Products tab
  if (pathname.startsWith('/products/whatsapp/broadcasts/')) {
    return '/products/whatsapp';
  }
  if (pathname.startsWith('/products/whatsapp/')) {
    return '/products/whatsapp';
  }
  if (pathname.startsWith('/products/whatsapp')) {
    return '/(tabs)/products';
  }

  // 5. Social sub-screens -> go to Social overview or Products tab
  if (pathname.startsWith('/products/social/plans')) {
    return '/products/social';
  }
  if (pathname.startsWith('/products/social')) {
    return '/(tabs)/products';
  }

  // 6. Other products -> go to Products tab
  if (
    pathname.startsWith('/products/voice') ||
    pathname.startsWith('/products/telegram') ||
    pathname.startsWith('/products/')
  ) {
    return '/(tabs)/products';
  }

  // 7. Referral -> go to Account tab or Home
  if (pathname.startsWith('/Referral') || pathname.startsWith('/referral')) {
    return '/(tabs)/account';
  }

  // 8. Account sub-screens -> go to Account tab
  if (pathname.startsWith('/account/')) {
    return '/(tabs)/account';
  }

  // 9. Admin sub-screens -> go to Admin tab
  if (pathname.startsWith('/admin/')) {
    return '/(tabs)/admin';
  }

  // 10. Inbox sub-screens -> go to Inbox tab
  if (pathname.startsWith('/inbox/')) {
    return '/(tabs)/inbox';
  }

  return '/(tabs)';
};

export const AppTopBar: React.FC<AppTopBarProps> = ({
  title,
  subtitle,
  showBack,
  rightElement,
  leftElement,
  onBackPress,
  parentRoute,
  showPlanBadge,
  showNotificationIcon,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const user = useAuthStore((s) => s.user);
  const { unreadCount } = useNotifications();

  // Auto-detect: Show back button on all sub-pages with title unless explicitly disabled
  const shouldShowBack = showBack !== undefined ? showBack : !!title;

  const { planLabel, isActive } = usePlatformSubscription();
  const displayPlanBadge = !!showPlanBadge;
  const displayNotificationIcon = showNotificationIcon !== undefined 
    ? showNotificationIcon 
    : (!title && pathname !== '/notifications');

  const handlePlanBadgePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/account/plans' as any);
  };

  const handleBack = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (onBackPress) {
      onBackPress();
      return;
    }

    const fallbackParent = parentRoute || getParentRoute(pathname);

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallbackParent as any);
    }
  };

  // Android hardware back button handler
  useEffect(() => {
    if (!shouldShowBack) return;

    const onHardwareBack = () => {
      handleBack();
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [shouldShowBack, onBackPress, parentRoute, pathname]);

  const handleProfilePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/(tabs)/account' as any);
  };

  const displayName = user?.name || user?.user_metadata?.full_name || user?.email || 'User';
  const avatarInitial = displayName.charAt(0).toUpperCase() || 'G';
  const avatarUrl = user?.user_metadata?.avatar_url;

  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0;
  const topPadding = Math.max(insets.top, statusBarHeight) + (Platform.OS === 'android' ? 14 : 8);

  const compactPlan = React.useMemo(() => {
    if (!planLabel) return 'Free';
    const clean = planLabel
      .replace(/GetAiPilot\s*-\s*/gi, '')
      .replace(/\(Yearly\)|\(Monthly\)|\(Quarterly\)/gi, '')
      .trim();

    if (clean.toLowerCase().includes('core')) return 'Core';
    if (clean.toLowerCase().includes('pro')) return 'Pro';
    if (clean.toLowerCase().includes('growth')) return 'Growth';
    if (clean.toLowerCase().includes('starter')) return 'Starter';
    if (clean.toLowerCase().includes('free')) return 'Free';
    if (clean.toLowerCase().includes('bundle')) return 'Bundle';
    return clean.slice(0, 10);
  }, [planLabel]);

  return (
    <View
      className="flex-row items-center justify-between w-full px-4 pb-3.5 shrink-0"
      style={{ paddingTop: topPadding, backgroundColor: colors.background }}
    >
      <View className="flex-row items-center flex-1 mr-2 min-w-0">
        {shouldShowBack ? (
          <Pressable cssInterop={false}
            onPress={handleBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] }]}
          >
            <View
              className="w-11 h-11 rounded-full justify-center items-center mr-3"
              style={{ backgroundColor: colors.card }}
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={20}
                color={colors.foreground}
                strokeWidth={2}
              />
            </View>
          </Pressable>
        ) : leftElement ? (
          leftElement
        ) : !title ? (
          /* Profile Avatar with Luxury Border & Presence Ring */
          <Pressable cssInterop={false}
            onPress={handleProfilePress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Profile Account"
            style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] }]}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
                position: 'relative',
                borderWidth: 1.5,
                borderColor: isDark ? '#8B5CF6' : '#A855F7',
                padding: 1.5,
              }}
            >
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={{ width: '100%', height: '100%', borderRadius: 18 }}
                  contentFit='cover'
                />
              ) : (
                <View
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 18,
                    backgroundColor: isDark ? '#382052' : '#EDE4FB',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: isDark ? '#E9D5FF' : '#5B21B6',
                      fontSize: 16,
                      fontWeight: '800',
                    }}
                  >
                    {avatarInitial}
                  </Text>
                </View>
              )}
              {/* Active Green Presence Dot */}
              <View
                style={{
                  position: 'absolute',
                  bottom: -1,
                  right: -1,
                  width: 9,
                  height: 9,
                  borderRadius: 4.5,
                  backgroundColor: '#22C55E',
                  borderWidth: 1.5,
                  borderColor: colors.background,
                }}
              />
            </View>
          </Pressable>
        ) : null}

        <View className="flex-1 justify-center min-w-0">
          {title ? (
            <Text
              className={`text-[17px] font-bold tracking-tight ${isDark ? 'text-[#F7FAFC]' : 'text-[#41444B]'
                }`}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Text
                style={{
                  fontSize: 19,
                  lineHeight: 24,
                  fontWeight: '800',
                  letterSpacing: -0.5,
                  color: isDark ? '#FFFFFF' : '#0F172A',
                }}
                numberOfLines={1}
              >
                GetAi<Text style={{ color: isDark ? '#C084FC' : '#7C3AED' }}>Pilot</Text>
              </Text>
              <View
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 2.5,
                  backgroundColor: isDark ? '#C084FC' : '#7C3AED',
                  marginTop: -2,
                }}
              />
            </View>
          )}
          {title && subtitle ? (
            <Text
              className={`text-xs mt-0.5 tracking-tight font-normal ${isDark ? 'text-[#ACA6BB]' : 'text-[#6B7076]'
                }`}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View className="flex-row items-center shrink-0" style={{ gap: 8 }}>
        {rightElement}

        {displayPlanBadge && (
          <Pressable cssInterop={false}
            onPress={handlePlanBadgePress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`Current workspace plan: ${compactPlan}. Tap to view and upgrade plans`}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] }]}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                height: 28,
                paddingHorizontal: 9,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(168, 85, 247, 0.35)' : 'rgba(147, 51, 234, 0.22)',
                backgroundColor: isDark ? 'rgba(168, 85, 247, 0.16)' : '#F3E8FF',
                alignSelf: 'center',
                shadowColor: '#8B5CF6',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isDark ? 0.2 : 0.06,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: isActive ? '#22C55E' : '#F59E0B',
                }}
              />
              <Text
                style={{
                  fontSize: 11.5,
                  fontWeight: '700',
                  color: isDark ? '#E9D5FF' : '#6D28D9',
                  letterSpacing: -0.1,
                }}
                numberOfLines={1}
              >
                {compactPlan}
              </Text>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={10}
                color={isDark ? '#C084FC' : '#7C3AED'}
                strokeWidth={2.4}
              />
            </View>
          </Pressable>
        )}

        {displayNotificationIcon && (
          <Pressable cssInterop={false}
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push('/notifications' as any);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`Notifications. ${unreadCount} unread`}
            style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.94 : 1 }] }]}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: colors.card,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: isDark ? '#2D283E' : '#E8E4F3',
              }}
            >
              <Ionicons
                name={unreadCount > 0 ? "notifications" : "notifications-outline"}
                size={20}
                color={unreadCount > 0 ? colors.accent : colors.foreground}
              />
              {unreadCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: '#EF4444',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 3,
                    borderWidth: 1.5,
                    borderColor: colors.background,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '700' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        )}
      </View>
    </View>
  );
};
