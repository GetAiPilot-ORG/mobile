import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter, usePathname } from 'expo-router';
import { useAuthStore } from '../core/store/authStore';
import React, { useEffect } from 'react';
import { BackHandler, Platform, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePlatformSubscription } from '../hooks/usePlatformSubscription';

const brandLogo = require("../../assets/images/logo.jpg");

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

  // 3.5 Social sub-screens -> go to Social overview
  if (pathname.startsWith('/products/social/plans')) {
    return '/products/social';
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
  showPlanBadge,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const user = useAuthStore((s) => s.user);

  // Auto-detect: Show back button on all sub-pages with title unless explicitly disabled
  const shouldShowBack = showBack !== undefined ? showBack : !!title;

  const { planLabel, isActive } = usePlatformSubscription();
  const displayPlanBadge = showPlanBadge !== undefined ? showPlanBadge : (!title && !shouldShowBack);

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

  const topPadding = Math.max(insets.top, 12);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: topPadding },
        isDark ? styles.containerDark : styles.containerLight,
      ]}
    >
      <View style={styles.leftSection}>
        {shouldShowBack ? (
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              isDark ? styles.backButtonDark : styles.backButtonLight,
              pressed && styles.backButtonPressed,
            ]}
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
            style={({ pressed }) => [
              styles.profileBtn,
              isDark ? styles.profileBtnDark : styles.profileBtnLight,
              pressed && styles.profileBtnPressed,
            ]}
            onPress={handleProfilePress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Profile Account"
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.profileAvatarImg} contentFit="cover" />
            ) : (
              <View style={styles.profileAvatarCircle}>
                <Text style={styles.profileAvatarText}>{avatarInitial}</Text>
              </View>
            )}
          </Pressable>
        ) : null}

        <View style={styles.titleWrapper}>
          {title ? (
            <Text style={[styles.title, isDark ? styles.titleDark : styles.titleLight]} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
          {subtitle && (
            <Text style={[styles.subtitle, isDark ? styles.subtitleDark : styles.subtitleLight]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {rightElement ? (
        <View style={styles.rightSection}>{rightElement}</View>
      ) : displayPlanBadge ? (
        <View style={styles.rightSection}>
          <Pressable
            onPress={handlePlanBadgePress}
            style={({ pressed }) => [
              styles.planBadge,
              isDark ? styles.planBadgeDark : styles.planBadgeLight,
              pressed && styles.planBadgePressed,
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`Current workspace plan: ${planLabel || 'Free'}. Tap to view and upgrade plans`}
          >
            <View
              style={[
                styles.planDot,
                { backgroundColor: isActive ? '#10B981' : '#F59E0B' },
              ]}
            />
            <Ionicons name="sparkles" size={11} color={isActive ? '#0A84FF' : '#F59E0B'} />
            <Text
              style={[
                styles.planBadgeText,
                isDark ? styles.planBadgeTextDark : styles.planBadgeTextLight,
              ]}
              numberOfLines={1}
            >
              {planLabel || 'Free Plan'}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={11}
              color={isDark ? '#94A3B8' : '#64748B'}
            />
          </Pressable>
        </View>
      ) : (
        <View style={styles.rightEmpty} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  containerLight: {
    backgroundColor: '#FFFFFF',
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  containerDark: {
    backgroundColor: '#000000',
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  backButtonLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  backButtonDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  backButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
  profileBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1.5,
  },
  profileBtnLight: {
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  profileBtnDark: {
    borderColor: '#2C2C2E',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  profileBtnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.94 }],
  },
  profileAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  profileAvatarCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  titleWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  titleLight: {
    color: '#0F172A',
  },
  titleDark: {
    color: "#F8FAFC",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
    letterSpacing: -0.1,
    fontWeight: '400',
  },
  subtitleLight: {
    color: '#64748B',
  },
  subtitleDark: {
    color: "#94A3B8",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rightEmpty: {
    width: 0,
    height: 0,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 20,
    borderWidth: 1,
  },
  planBadgeLight: {
    backgroundColor: 'rgba(10, 132, 255, 0.08)',
    borderColor: 'rgba(10, 132, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  planBadgeDark: {
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    borderColor: 'rgba(10, 132, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 1,
  },
  planBadgePressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  planDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.2,
    maxWidth: 120,
  },
  planBadgeTextLight: {
    color: '#0A84FF',
  },
  planBadgeTextDark: {
    color: '#38BDF8',
  },
});
