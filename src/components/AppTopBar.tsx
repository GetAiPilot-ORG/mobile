import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter, usePathname } from 'expo-router';
import { useAuthStore } from '../core/store/authStore';
import React, { useEffect } from 'react';
import { BackHandler, Platform, Pressable, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface AppTopBarProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
  onBackPress?: () => void;
  parentRoute?: string;
  className?: string;
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

  // 2. CRM sub-screens -> go to CRM overview or Products tab
  if (pathname.startsWith('/products/crm/leads/')) {
    return '/products/crm';
  }
  if (pathname.startsWith('/products/crm')) {
    return '/(tabs)/products';
  }

  // 3. WhatsApp sub-screens -> go to WhatsApp overview or Products tab
  if (pathname.startsWith('/products/whatsapp/broadcasts/')) {
    return '/products/whatsapp';
  }
  if (pathname.startsWith('/products/whatsapp/')) {
    return '/products/whatsapp';
  }
  if (pathname.startsWith('/products/whatsapp')) {
    return '/(tabs)/products';
  }

  // 4. Other products -> go to Products tab
  if (
    pathname.startsWith('/products/voice') ||
    pathname.startsWith('/products/social') ||
    pathname.startsWith('/products/telegram') ||
    pathname.startsWith('/products/')
  ) {
    return '/(tabs)/products';
  }

  // 5. Account sub-screens -> go to Account tab
  if (pathname.startsWith('/account/')) {
    return '/(tabs)/account';
  }

  // 6. Admin sub-screens -> go to Admin tab
  if (pathname.startsWith('/admin/')) {
    return '/(tabs)/admin';
  }

  // 7. Inbox sub-screens -> go to Inbox tab
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
  className,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const user = useAuthStore((s) => s.user);

  // Auto-detect: Show back button on all sub-pages with title unless explicitly disabled
  const shouldShowBack = showBack !== undefined ? showBack : !!title;

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

  const topPadding = Math.max(insets.top, 12);

  return (
    <View
      className={`flex-row items-center justify-between px-4 pb-3 border-b ${
        isDark ? "bg-[#0B0D10] border-white/10" : "bg-white border-black/5"
      } ${className || ''}`}
      style={{ paddingTop: topPadding }}
    >
      <View className="flex-row items-center flex-1">
        {shouldShowBack ? (
          <Pressable
            className={`w-10 h-10 rounded-full justify-center items-center mr-3 border ${
              isDark ? "bg-[#181A1F] border-[#262930]" : "bg-white border-gray-200"
            }`}
            style={({ pressed }) => pressed ? { opacity: 0.7, transform: [{ scale: 0.94 }] } : undefined}
            onPress={handleBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={isDark ? '#F8FAFC' : '#0F172A'}
            />
          </Pressable>
        ) : leftElement ? (
          leftElement
        ) : !title ? (
          /* Profile Avatar Button on the Left for Home */
          <Pressable
            className={`w-9.5 h-9.5 rounded-full justify-center items-center mr-3 border-1.5 ${
              isDark ? "border-[#262930]" : "border-gray-200"
            }`}
            style={({ pressed }) => pressed ? { opacity: 0.75, transform: [{ scale: 0.94 }] } : undefined}
            onPress={handleProfilePress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Profile Account"
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} className="w-full h-full rounded-full" contentFit="cover" />
            ) : (
              <View className="w-full h-full rounded-full bg-[#0284C7] justify-center items-center">
                <Text className="text-white text-base font-bold">{avatarInitial}</Text>
              </View>
            )}
          </Pressable>
        ) : null}

        <View className="flex-1 justify-center">
          {title ? (
            <Text
              className={`text-lg font-bold tracking-tight ${isDark ? "text-[#F8FAFC]" : "text-[#0F172A]"}`}
              numberOfLines={1}
            >
              {title}
            </Text>
          ) : null}
          {subtitle && (
            <Text
              className={`text-xs mt-0.5 ${isDark ? "text-[#94A3B8]" : "text-[#64748B]"}`}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {rightElement ? <View className="flex-row items-center gap-2">{rightElement}</View> : <View className="w-0 h-0" />}
    </View>
  );
};
