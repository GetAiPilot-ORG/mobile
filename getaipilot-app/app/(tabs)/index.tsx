import { HomeSkeleton } from "@/components/skeletonScreen/HomeSkeletonScreen";
import { NetworkStatusScreen } from "@/components/StatusScreen";
import { getColors, useTheme } from "@/theme";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowRight01Icon,
  Layout01Icon,
  File01Icon,
  Link01Icon,
  ShieldCheckIcon,
  GiftIcon,
} from "@/constants/icons";
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
import { LinearGradient } from "expo-linear-gradient";
import { AppScreen } from "../../src/components/AppScreen";
import { AppTopBar } from "../../src/components/AppTopBar";
// Preserved for future use:
// import { AnimatedHeroBanner } from "../../src/components/home/AnimatedHeroBanner";
import { AnimatedEngineItem } from "../../src/components/home/AnimatedEngineItem";
import { AnimatedAiLogo } from "../../src/components/home/AnimatedAiLogo";
import { ProductCardCarousel } from "../../src/components/home/ProductCardCarousel";
import { AnimatedCreateSection } from "../../src/components/home/AnimatedCreateSection";
import { AnimatedWorkspaceCards } from "../../src/components/home/AnimatedWorkspaceCards";
import { HomeSecurityAndInviteCards } from "../../src/components/home/HomeSecurityAndInviteCards";
// Preserved for future use:
// import { AnimatedPlanBanner } from "../../src/components/home/AnimatedPlanBanner";
// Preserved for future use:
// import { AnimatedSecurityCard } from "../../src/components/home/AnimatedSecurityCard";
// import { AnimatedReferralCard } from "../../src/components/home/AnimatedReferralCard";
import { useAuth } from "../../src/contexts/AuthContext";
import { useNetwork } from "../../src/contexts/NetworkContext";
import { useNotifications } from "../../src/contexts/NotificationContext";
import { apiClient } from "../../src/core/api/client";
import { usePlatformSubscription } from "../../src/hooks/usePlatformSubscription";
import { supabase } from "../../src/lib/supabase";


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
  // Engine micro-animation cycle tick
  const [engineCycleTick, setEngineCycleTick] = useState(0);
  const { expoPushToken, requestPermissions } = useNotifications();

  useEffect(() => {
    // Staggered wave animation cycle for engine icons every 8 seconds
    const timer = setInterval(() => {
      setEngineCycleTick((prev) => prev + 1);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token =
          expoPushToken || (requestPermissions ? await requestPermissions() : null);
        console.log('==============================================');
        console.log('📲 [HomeScreen] CONSOLE PUSH TOKEN:');
        console.log(
          token ||
          '⚠️ No push token generated (check permissions, physical device, or development build)'
        );
        console.log('==============================================');
      } catch (err) {
        console.log('ℹ️ [HomeScreen] Push token notice:', err);
      }
    })();
  }, [expoPushToken, requestPermissions]);

  // Real Workspace Telemetry from Supabase
  const { data: telemetry, refetch: refetchTelemetry } = useQuery({
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
          botsCount: 0,
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

  const triggerHaptic = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Primary Automation Engines (Bundled Native Logos)
  const ENGINES = [
    {
      id: "telegram",
      name: "Telegram",
      desc: "Auto-forward feeds, bots & reactions",
      logo: require("../../assets/images/products/telegram.png"),
      iconBg: color.products.telegram,
      route: "/products/telegram",
      status: hasTelegram ? "Active" : "Pro",
      isLive: hasTelegram,
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      desc: "Broadcasts & 24/7 Meta API triggers",
      logo: require("../../assets/images/products/whatsapp.png"),
      iconBg: color.products.whatsapp,
      route: "/products/whatsapp",
      status: hasWhatsApp ? "Active" : "Pro",
      isLive: hasWhatsApp,
    },
    {
      id: "voice",
      name: "Voice AI",
      desc: "AI Voice calling agents & speech streaming",
      logo: require("../../assets/images/products/voice.png"),
      iconBg: color.products.voice,
      route: "/products/voice",
      status: hasVoice ? "Active" : "Pro",
      isLive: hasVoice,
    },
    {
      id: "crm",
      name: "Smart CRM",
      desc: "Pipelines, deals & lead contact automation",
      logo: require("../../assets/images/products/crm.png"),
      iconBg: color.products.crm,
      route: "/products/crm",
      status: hasCRM ? "Active" : "Pro",
      isLive: hasCRM,
    },
    {
      id: "social",
      name: "Social Pilot",
      desc: "Cross-platform auto-poster & queue",
      logo: require("../../assets/images/products/social.png"),
      iconBg: color.products.social,
      route: "/products/social",
      status: hasSocial ? "Active" : "Growth",
      isLive: hasSocial,
    },
  ];



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
  const pastel = isDark
    ? ["#263D3D", "#303B32", "#39304A", "#49372D", "#46303C"]
    : ["#D8F0F0", "#E0F1E6", "#E7DEFA", "#F9E5D4", "#F7DFE9"];

  const open = (route: string) => {
    triggerHaptic();
    router.push(route as any);
  };
  const section = (title: string, route: string) => {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <Text style={{ fontSize: 18, lineHeight: 24, fontWeight: "600", letterSpacing: -0.3, color: color.text }}>{title}</Text>
        <Pressable onPress={() => open(route)} accessibilityRole="button" accessibilityLabel={`View all ${title.toLowerCase()}`} hitSlop={6} style={{ minHeight: 36, flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Text style={{ fontSize: 13, fontWeight: "500", color: color.link }}>View all</Text>
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} color={color.link} strokeWidth={2} />
        </Pressable>
      </View>
    )
  };

  return (
    <AppScreen safeArea={false} backgroundColor={color.background}>
      <AppTopBar showPlanBadge />
      <ScrollView
        style={{ flex: 1, backgroundColor: color.background }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 128, gap: 26 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={color.accent} />}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text
                style={{
                  fontSize: 32,
                  lineHeight: 38,
                  fontWeight: "600",
                  letterSpacing: -0.85,
                  color: color.text,
                }}
              >
                Your work,{"\n"}made effortless.
              </Text>
            </View>
            <AnimatedAiLogo
              size={66}
              isDark={isDark}
            />
          </View>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 20 }}>
            {ENGINES.map((item, index) => (
              <AnimatedEngineItem
                key={item.id}
                item={item}
                index={index}
                bgColor={pastel[index]}
                textColor={color.text}
                onPress={() => open(item.route)}
                cycleTick={engineCycleTick}
              />
            ))}
          </View>
        </View>

        <ProductCardCarousel
          isDark={isDark}
          onOpen={open} />

        <View>
          {section("Your workspace", "/(tabs)/products")}
          <AnimatedWorkspaceCards
            isDark={isDark}
            color={color}
            telemetry={telemetry}
            onOpen={open}
          />
        </View>

        <AnimatedCreateSection
          isDark={isDark}
          onOpen={open}
          sectionHeader={section("Create something", "/(tabs)/tools")}
        />

        <Pressable
          cssInterop={false}
          onPress={() => open("/account/plans")}
          accessibilityRole="button"
          accessibilityLabel="View plans"
          style={({ pressed }) => ({
            backgroundColor: isDark ? "#2C2042" : "#EDE7FA",
            borderRadius: 24,
            padding: 18,
            borderWidth: 1.2,
            borderColor: isDark ? "rgba(167, 139, 250, 0.24)" : "rgba(147, 51, 234, 0.16)",
            opacity: pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.992 : 1 }],
            position: "relative",
            overflow: "hidden",
            shadowColor: "#8B5CF6",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 12,
            elevation: 4,
          })}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
            <View
              style={{
                width: 54,
                height: 54,
                borderRadius: 16,
                overflow: "hidden",
                backgroundColor: "#FFFFFF",
                shadowColor: "#8B5CF6",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.25,
                shadowRadius: 6,
                elevation: 4,
              }}
            >
              <Image
                source={require("../../assets/images/growimage.jpg")}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ fontSize: 19, lineHeight: 24, fontWeight: "700", letterSpacing: -0.35, color: color.text }}>
                Room to grow
              </Text>
              <Text style={{ fontSize: 12, color: color.textSecondary }}>
                {planLabel || "Free"} plan • Scale without limits
              </Text>
            </View>
            <View style={{ backgroundColor: color.buttonPrimary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: color.buttonPrimaryForeground }}>View plans</Text>
            </View>
          </View>
        </Pressable>

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
      </ScrollView>
    </AppScreen>
  );
}