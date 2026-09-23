import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter, usePathname } from 'expo-router';
import { useAuthStore } from '../core/store/authStore';
import { useTheme } from '../contexts/ThemeContext';
import React, { useEffect } from 'react';
import { BackHandler, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
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
  const { isDark } = useTheme();
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

  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0;
  const topPadding = Math.max(insets.top, statusBarHeight) + (Platform.OS === 'android' ? 14 : 8);

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
            onPress={handleBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <View
              style={[
                styles.backButton,
                isDark ? styles.backButtonDark : styles.backButtonLight,
              ]}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={isDark ? '#FFFFFF' : '#000000'}
              />
            </View>
          </Pressable>
        ) : leftElement ? (
          leftElement
        ) : !title ? (
          /* Profile Avatar Button on the Left for Home */
          <Pressable
            onPress={handleProfilePress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Profile Account"
          >
            <View
              style={[
                styles.profileBtn,
                isDark ? styles.profileBtnDark : styles.profileBtnLight,
              ]}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.profileAvatarImg} contentFit="cover" />
              ) : (
                <View style={styles.profileAvatarCircle}>
                  <Text style={styles.profileAvatarText}>{avatarInitial}</Text>
                </View>
              )}
            </View>
          </Pressable>
        ) : null}

        <View style={styles.titleWrapper}>
          {title ? (
            <Text
              style={[styles.title, isDark ? styles.titleDark : styles.titleLight]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
          ) : (
            <>
              <Text
                style={[styles.title, isDark ? styles.titleDark : styles.titleLight]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {displayName}
              </Text>
              <Text
                style={[styles.subtitle, isDark ? styles.subtitleDark : styles.subtitleLight]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {subtitle || "Workspace Hub"}
              </Text>
            </>
          )}
          {title && subtitle ? (
            <Text
              style={[styles.subtitle, isDark ? styles.subtitleDark : styles.subtitleLight]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {rightElement ? (
        <View style={styles.rightSection}>{rightElement}</View>
      ) : displayPlanBadge ? (
        <View style={styles.rightSection}>
          <Pressable
            onPress={handlePlanBadgePress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`Current workspace plan: ${planLabel || 'Free'}. Tap to view and upgrade plans`}
          >
            <View
              style={[
                styles.planBadge,
                isDark ? styles.planBadgeDark : styles.planBadgeLight,
              ]}
            >
              <View
                style={[
                  styles.planDot,
                  { backgroundColor: isActive ? '#30D158' : '#F59E0B' },
                ]}
              />
              <Ionicons
                name="sparkles"
                size={13}
                color={isActive ? '#0A84FF' : '#F59E0B'}
                style={styles.planSparkles}
              />
              <Text
                style={[
                  styles.planBadgeText,
                  isDark ? styles.planBadgeTextDark : styles.planBadgeTextLight,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {planLabel || 'Free Plan'}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={13}
                color={isDark ? '#60A5FA' : '#0A84FF'}
                style={styles.planChevron}
              />
            </View>
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
    width: "100%",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 0,
    flexShrink: 0,
  },
  containerLight: {
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 0,
  },
  containerDark: {
    backgroundColor: '#000000',
    borderBottomWidth: 0,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
    minWidth: 0,
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
    width: 42,
    height: 42,
    minWidth: 42,
    minHeight: 42,
    maxWidth: 42,
    maxHeight: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
    borderWidth: 1.5,
    flexShrink: 0,
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
    borderRadius: 21,
  },
  profileAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0A84FF',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  profileAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  titleWrapper: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  titleLight: {
    color: '#000000',
  },
  titleDark: {
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    letterSpacing: -0.1,
    fontWeight: '400',
  },
  subtitleLight: {
    color: '#64748B',
  },
  subtitleDark: {
    color: "#8E8E93",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },
  rightEmpty: {
    width: 0,
    height: 0,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1.5,
    flexShrink: 0,
    alignSelf: 'center',
  },
  planBadgeLight: {
    backgroundColor: 'rgba(10, 132, 255, 0.08)',
    borderColor: 'rgba(10, 132, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  planBadgeDark: {
    backgroundColor: 'rgba(10, 132, 255, 0.16)',
    borderColor: 'rgba(10, 132, 255, 0.45)',
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
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
    flexShrink: 0,
  },
  planSparkles: {
    marginRight: 6,
    flexShrink: 0,
  },
  planChevron: {
    marginLeft: 4,
    flexShrink: 0,
  },
  planBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
    flexShrink: 0,
  },
  planBadgeTextLight: {
    color: '#0A84FF',
  },
  planBadgeTextDark: {
    color: '#38BDF8',
  },
});
