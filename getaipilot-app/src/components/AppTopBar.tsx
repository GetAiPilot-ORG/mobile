import { Ionicons } from '@expo/vector-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter, usePathname } from 'expo-router';
import { useAuthStore } from '../core/store/authStore';
import { useTheme, getColors } from '@/theme';
import React, { useEffect } from 'react';
import { BackHandler, Platform, Pressable, StatusBar, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlatformSubscription } from '../hooks/usePlatformSubscription';

export interface AppTopBarProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
  onBackPress?: () => void;
  parentRoute?: string;
  showPlanBadge?: boolean;
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
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const user = useAuthStore((s) => s.user);

  // Auto-detect: Show back button on all sub-pages with title unless explicitly disabled
  const shouldShowBack = showBack !== undefined ? showBack : !!title;

  const { planLabel, isActive } = usePlatformSubscription();
  const displayPlanBadge = !!showPlanBadge;

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

  return (
    <View
      className="flex-row items-center justify-between w-full px-4 pb-3.5 shrink-0"
      style={{ paddingTop: topPadding, backgroundColor: colors.background }}
    >
      <View className="flex-row items-center flex-1 mr-2.5 min-w-0">
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
          /* Profile Avatar Button on the Left for Home */
          <Pressable cssInterop={false}
            onPress={handleProfilePress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Profile Account"
            style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] }]}
          >
            <View
              className={`w-[42px] h-[42px] rounded-full justify-center items-center mr-2.5 border-[1.5px] shrink-0 ${isDark ? 'border-[#3A3549]' : 'border-[#E9E6F2]'
                }`}
            >
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 0, borderColor: isDark ? '#3A3549' : '#E7DEFA' }}
                  contentFit='cover'
                />
              ) : (
                <View className="w-[42px] h-[42px] rounded-full bg-[#E7DEFA] items-center justify-center shrink-0">
                  <Text className="text-[#41444B] text-lg font-bold">
                    {avatarInitial}
                  </Text>
                </View>
              )}
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
            <Text
              className={`text-[18px] font-extrabold tracking-tight ${isDark ? 'text-[#F7FAFC]' : 'text-[#1E293B]'
                }`}
              numberOfLines={1}
            >
              GetAiPilot
            </Text>
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

      {rightElement ? (
        <View className="flex-row items-center shrink-0">{rightElement}</View>
      ) : displayPlanBadge ? (
        <View className="flex-row items-center shrink-0">
          <Pressable cssInterop={false}
            onPress={handlePlanBadgePress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`Current workspace plan: ${planLabel || 'Free'}. Tap to view and upgrade plans`}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] }]}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                height: 36,
                paddingHorizontal: 12,
                borderRadius: 18,
                borderWidth: 0,
                borderColor: isDark ? 'rgba(47, 140, 255, 0.4)' : 'rgba(10, 132, 255, 0.25)',
                backgroundColor: colors.accentSoft,
                alignSelf: 'center',
              }}
            >
              <View
                className="w-[7px] h-[7px] rounded-full shrink-0"
                style={{ backgroundColor: isActive ? '#30D158' : '#F59E0B' }}
              />
              <Text
                className="text-[13px] font-medium shrink-0"
                style={{ color: colors.accent }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {planLabel || 'Free Plan'}
              </Text>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={13}
                color={colors.accent}
                strokeWidth={2}
                className="ml-0.5 shrink-0"
              />
            </View>
          </Pressable>
        </View>
      ) : (
        <View className="w-0 h-0" />
      )}
    </View>
  );
};
