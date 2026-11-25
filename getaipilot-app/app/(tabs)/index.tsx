import { HomeSkeleton } from "@/components/skeletonScreen/HomeSkeletonScreen";
import { NetworkStatusScreen } from "@/components/StatusScreen";
import { getColors, useTheme } from "@/theme";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowRight01Icon } from "@/constants/icons";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppScreen } from "../../src/components/AppScreen";
import { AppTopBar } from "../../src/components/AppTopBar";
import { ModernHeroBanner } from "../../src/components/home/ModernHeroBanner";
import { FiveProductsSection } from "../../src/components/home/FiveProductsSection";
import { AnimatedWorkspaceCards } from "../../src/components/home/AnimatedWorkspaceCards";
import { AnimatedCreateSection } from "../../src/components/home/AnimatedCreateSection";
import { HomeSecurityAndInviteCards } from "../../src/components/home/HomeSecurityAndInviteCards";
import { useAuth } from "../../src/contexts/AuthContext";
import { useNetwork } from "../../src/contexts/NetworkContext";
import { useNotifications } from "../../src/contexts/NotificationContext";
import { isExpoGo } from "../../src/services/notificationService";
import { apiClient } from "../../src/core/api/client";
import { usePlatformSubscription } from "../../src/hooks/usePlatformSubscription";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { supabase } from "../../src/lib/supabase";
import { HOME_SPACING, HOME_RADIUS } from "@/theme/homeTokens";

interface LoginDevice {
  sessionId: string;
  platform: "ios" | "android" | "web";
  deviceName: string;
  osVersion: string | null;
  lastSeenAt: string;
  isOnline: boolean;
  isCurrent: boolean;
}

interface DeviceSessionsResponse {
  activeDeviceCount: number;
  devices: LoginDevice[];
}

export default function HomeScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const color = getColors(isDark);
  const reducedMotion = useReducedMotion();

  const { user } = useAuth();
  const {
    planLabel,
    hasTelegram,
    hasWhatsApp,
    hasVoice,
    hasCRM,
    hasSocial,
    refresh: refreshSub,
  } = usePlatformSubscription();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isOnline, networkChecked, refresh, isChecking } = useNetwork();
  const { expoPushToken, requestPermissions } = useNotifications();

  useEffect(() => {
    if (Platform.OS === 'web') return;
    (async () => {
      try {
        const token =
          expoPushToken || (requestPermissions ? await requestPermissions() : null);
        console.log(
          '[HomeScreen] Push Token:',
          token
            ? 'Active'
            : isExpoGo
              ? 'Disabled in Expo Go (Active in Release Builds)'
              : 'Unregistered'
        );
      } catch (err) {
        console.log('[HomeScreen] Push token notice:', err);
      }
    })();
  }, [expoPushToken]);

  // Real Workspace Telemetry from Supabase
  const { data: telemetry, isLoading: isLoadingTelemetry, refetch: refetchTelemetry } = useQuery({
    queryKey: ["workspace-telemetry-ios", user?.id],
    queryFn: async () => {
      let currentUserId = user?.id;
      if (!currentUserId) {
        const { data: sessionData } = await supabase.auth.getSession();
        currentUserId = sessionData?.session?.user?.id;
      }

      if (!currentUserId)
        return {
          pagesCount: 0,
          landingPagesCount: 0,
          quickFormsCount: 0,
          shortLinksCount: 0,
          botsCount: 5,
        };

      try {
        const [
          bioRes,
          landingTemplateRes,
          landingPagesRes,
          tgLandingRes,
          formsRes,
          linksRes,
        ] = await Promise.allSettled([
          supabase
            .from("free_template_submissions")
            .select("id", { count: "exact", head: true })
            .eq("user_id", currentUserId)
            .neq("niche", "earn_storefront"),
          supabase
            .from("landing_template_submissions")
            .select("id", { count: "exact", head: true })
            .eq("user_id", currentUserId),
          supabase
            .from("landing_pages")
            .select("id", { count: "exact", head: true })
            .eq("user_id", currentUserId),
          supabase
            .from("tg_landing_pages")
            .select("id", { count: "exact", head: true })
            .eq("user_id", currentUserId),
          supabase
            .from("quick_forms")
            .select("id", { count: "exact", head: true })
            .eq("user_id", currentUserId),
          supabase
            .from("short_links")
            .select("id", { count: "exact", head: true })
            .eq("user_id", currentUserId),
        ]);

        const getCount = (settled: PromiseSettledResult<any>) =>
          settled.status === "fulfilled" && !settled.value?.error
            ? settled.value?.count || 0
            : 0;

        const bioCount = getCount(bioRes);
        const landingTemplateCount = getCount(landingTemplateRes);
        const legacyLandingCount = getCount(landingPagesRes);
        const tgLandingCount = getCount(tgLandingRes);

        const totalPages =
          bioCount + landingTemplateCount + legacyLandingCount + tgLandingCount;
        const formsCount = getCount(formsRes);
        const linksCount = getCount(linksRes);

        return {
          pagesCount: totalPages,
          landingPagesCount: totalPages,
          quickFormsCount: formsCount,
          shortLinksCount: linksCount,
          botsCount: 5,
        };
      } catch {
        return {
          pagesCount: 0,
          landingPagesCount: 0,
          quickFormsCount: 0,
          shortLinksCount: 0,
          botsCount: 5,
        };
      }
    },
  });

  const {
    data: deviceSessions,
    isLoading: isLoadingDevices,
    refetch: refetchDeviceSessions,
  } = useQuery<DeviceSessionsResponse>({
    queryKey: ["auth-device-sessions", user?.id],
    queryFn: async () => {
      try {
        return await apiClient.get<DeviceSessionsResponse>(
          "/mobile/v1/auth/device-sessions",
        );
      } catch {
        return {
          activeDeviceCount: 1,
          devices: [
            {
              sessionId: "current",
              platform:
                Platform.OS === "web"
                  ? "web"
                  : Platform.OS === "ios"
                    ? "ios"
                    : "android",
              deviceName:
                Platform.OS === "web"
                  ? "Web Browser"
                  : Platform.OS === "ios"
                    ? "iOS Device"
                    : "Android Device",
              osVersion: null,
              lastSeenAt: new Date().toISOString(),
              isOnline: true,
              isCurrent: true,
            },
          ],
        };
      }
    },
    enabled: !!user?.id,
    staleTime: 15_000,
  });

  const onRefresh = async () => {
    setIsRefreshing(true);
    triggerHaptic();
    refreshSub();
    await Promise.all([refetchTelemetry(), refetchDeviceSessions()]);
    setIsRefreshing(false);
  };

  const prevOnlineRef = useRef(isOnline);
  useEffect(() => {
    if (!prevOnlineRef.current && isOnline) {
      refetchDeviceSessions();
      refetchTelemetry();
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline, refetchDeviceSessions, refetchTelemetry]);

  useFocusEffect(
    useCallback(() => {
      refetchTelemetry();
    }, [refetchTelemetry])
  );

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== "web") Haptics.impactAsync(style);
  };

  const open = (route: string) => {
    triggerHaptic();
    router.push(route as any);
  };

  const section = (title: string, route: string) => {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <Text style={{ fontSize: 18, lineHeight: 24, fontWeight: "700", letterSpacing: -0.3, color: color.text }}>{title}</Text>
        <Pressable onPress={() => open(route)} accessibilityRole="button" accessibilityLabel={`View all ${title.toLowerCase()}`} hitSlop={6} style={{ minHeight: 36, flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: color.link }}>View all</Text>
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} color={color.link} strokeWidth={2.2} />
        </Pressable>
      </View>
    );
  };

  if (!networkChecked) {
    return (
      <AppScreen safeArea={false}>
        <HomeSkeleton />
      </AppScreen>
    );
  }

  if (!isOnline) {
    return <NetworkStatusScreen onRetry={refresh} isChecking={isChecking} />;
  }

  return (
    <AppScreen safeArea={false} backgroundColor={color.background}>
      {/* Pinned Top Bar with Core Plan chip, Settings Gear, and Bell */}
      <AppTopBar showPlanBadge showSettingsIcon />
      <ScrollView
        style={{ flex: 1, backgroundColor: color.background }}
        contentContainerStyle={{ paddingHorizontal: 0, paddingTop: 12, paddingBottom: 132 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={color.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Top: Hero Banner in 3D Card Styling (Normalized 16px margin, 24px bottom gap) */}
        <ModernHeroBanner
          isDark={isDark}
          onExplorePress={() => open("/(tabs)/tools")}
        />

        {/* 2. All 5 AI Products in 3D Card Styling (Telegram, WhatsApp, Social, Voice AI, CRM) */}
        <FiveProductsSection
          isDark={isDark}
          onOpen={open}
          sectionHeader={section("AI Products", "/(tabs)/products")}
          activeSubscriptions={{
            telegram: hasTelegram,
            whatsapp: hasWhatsApp,
            voice: hasVoice,
            crm: hasCRM,
            social: hasSocial,
          }}
        />

        {/* 3. 3D Workspace Telemetry Cards: Pages, Forms, Links (Normalized 16px padding, 24px bottom gap) */}
        <View style={{ paddingHorizontal: HOME_SPACING.md, marginBottom: HOME_SPACING.lg }}>
          <AnimatedWorkspaceCards
            isDark={isDark}
            color={color}
            telemetry={telemetry}
            onOpen={open}
          />
        </View>

        {/* 4. "Create something" Free Tools Carousel with 3D cards, snap peek & pagination dots */}
        <View style={{ marginBottom: HOME_SPACING.lg }}>
          <AnimatedCreateSection
            isDark={isDark}
            onOpen={open}
            sectionHeader={section("Create something", "/(tabs)/tools")}
          />
        </View>

        {/* 5. "Room to grow" Plans Banner with 3D Crown & gold coins (Normalized 16px margin, 24px bottom gap) */}
        <Pressable
          cssInterop={false}
          onPress={() => open("/account/plans")}
          accessibilityRole="button"
          accessibilityLabel={`View plans. Currently on ${planLabel || "Free"} plan`}
          style={({ pressed }) => ({
            backgroundColor: isDark ? "#2C2042" : "#EDE7FA",
            borderRadius: HOME_RADIUS.large,
            padding: 18,
            borderWidth: 1.2,
            borderColor: isDark ? "rgba(167, 139, 250, 0.28)" : "rgba(147, 51, 234, 0.18)",
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed && !reducedMotion ? 0.97 : 1 }],
            position: "relative",
            overflow: "hidden",
            shadowColor: "#8B5CF6",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isDark ? 0.35 : 0.1,
            shadowRadius: 12,
            elevation: 4,
            marginHorizontal: HOME_SPACING.md,
            marginBottom: HOME_SPACING.lg,
          })}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Image
                source={require("../../assets/images/plans-crown.png")}
                style={{ width: "100%", height: "100%" }}
                resizeMode="contain"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 19, lineHeight: 24, fontWeight: "800", letterSpacing: -0.35, color: isDark ? "#FFFFFF" : "#1A1726" }}>
                Room to grow
              </Text>
              <Text style={{ fontSize: 12, color: isDark ? "#C4BEDB" : "#4A4658", marginTop: 2, fontWeight: "500" }}>
                {planLabel || "Free"} plan • Scale without limits
              </Text>
            </View>
            <View style={{ backgroundColor: color.buttonPrimary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginLeft: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: color.buttonPrimaryForeground }}>View plans</Text>
            </View>
          </View>
        </Pressable>

        {/* 6. Security 256-bit AES & Invite Friends ₹100 Standout 3D Cards */}
        <View style={{ marginBottom: HOME_SPACING.lg }}>
          <HomeSecurityAndInviteCards
            isDark={isDark}
            activeDeviceCount={deviceSessions?.activeDeviceCount ?? 1}
            isLoadingDevices={isLoadingDevices}
            onOpenSecurity={() =>
              router.push({
                pathname: "/(tabs)/account",
                params: { tab: "security" },
              } as any)
            }
            onOpenReferral={() => open("/Referral")}
          />
        </View>
      </ScrollView>
    </AppScreen>
  );
}
