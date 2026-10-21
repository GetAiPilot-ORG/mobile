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
import { AnimatedCreateSection } from "../../src/components/home/AnimatedCreateSection";
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
import { TestNotificationButton } from "@/components/TestNotification";


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
  const section = (title: string, route: string) => (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
      <Text style={{ fontSize: 18, lineHeight: 24, fontWeight: "600", letterSpacing: -0.3, color: color.text }}>{title}</Text>
      <Pressable onPress={() => open(route)} accessibilityRole="button" accessibilityLabel={`View all ${title.toLowerCase()}`} hitSlop={6} style={{ minHeight: 36, flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Text style={{ fontSize: 13, fontWeight: "500", color: color.link }}>View all</Text>
        <HugeiconsIcon icon={ArrowRight01Icon} size={14} color={color.link} strokeWidth={2} />
      </Pressable>
    </View>
  );

  return (
    <AppScreen safeArea={false} backgroundColor={color.background}>
      <AppTopBar showPlanBadge />
      {/* <TestNotificationButton /> */}
      <ScrollView
        style={{ flex: 1, backgroundColor: color.background }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 128, gap: 26 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={color.accent} />}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text
            style={{
              maxWidth: 310,
              fontSize: 32,
              lineHeight: 38,
              fontWeight: "600",
              letterSpacing: -0.85,
              color: color.text,
            }}
          >
            Your work,{"\n"}made effortless.
          </Text>
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

        <View>
          {section("Your workspace", "/(tabs)/products")}
          <View style={{ backgroundColor: color.card, borderRadius: 24, padding: 20, flexDirection: "row", gap: 10 }}>
            {[
              {
                label: "Pages",
                value: telemetry?.pagesCount ?? telemetry?.landingPagesCount ?? 0,
                route: "/tools/my-designs",
                icon: Layout01Icon,
              },
              { label: "Forms", value: telemetry?.quickFormsCount ?? 0, route: "/tools/quick-forms", icon: File01Icon },
              { label: "Links", value: telemetry?.shortLinksCount ?? 0, route: "/tools/link-shortener", icon: Link01Icon },
            ].map((item, index) => (
              <Pressable cssInterop={false} key={item.label} onPress={() => open(item.route)} accessibilityRole="button" accessibilityLabel={`${item.value} ${item.label}`} style={{ flex: 1, alignItems: "center", gap: 7 }}>
                <View style={{ width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: pastel[(index + 2) % pastel.length] }}>
                  <HugeiconsIcon icon={item.icon} size={19} color={color.text} strokeWidth={1.8} />
                </View>
                <Text style={{ fontSize: 25, lineHeight: 30, fontWeight: "600", color: color.text, textAlign: "center" }}>{item.value}</Text>
                <Text style={{ fontSize: 12, color: color.textSecondary, textAlign: "center" }}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <AnimatedCreateSection
          isDark={isDark}
          onOpen={open}
          sectionHeader={section("Create something", "/(tabs)/tools")}
        />

        <Pressable cssInterop={false} onPress={() => open("/account/plans")} accessibilityRole="button" accessibilityLabel="View plans"
          style={({ pressed }) => ({ backgroundColor: isDark ? "#383044" : "#E5DCF9", borderRadius: 24, padding: 22, opacity: pressed ? 0.78 : 1, transform: [{ scale: pressed ? 0.992 : 1 }] })}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={{ fontSize: 22, lineHeight: 28, fontWeight: "600", letterSpacing: -0.35, color: color.text }}>Room to grow</Text>
              <Text style={{ fontSize: 13, color: color.textSecondary }}>{planLabel || "Free"} plan</Text>
            </View>
            <View style={{ backgroundColor: color.buttonPrimary, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 24 }}>
              <Text style={{ fontSize: 12, fontWeight: "500", color: color.buttonPrimaryForeground }}>View plans</Text>
            </View>
          </View>
        </Pressable>

        <View style={{ flexDirection: "row", gap: 12 }}>
          {[
            { title: "Security", detail: isLoadingDevices ? "Checking devices…" : `${deviceSessions?.activeDeviceCount ?? 1} signed-in device${(deviceSessions?.activeDeviceCount ?? 1) === 1 ? "" : "s"}`, icon: ShieldCheckIcon, route: "/(tabs)/account" },
            { title: "Invite friends", detail: "Your referrals", icon: GiftIcon, route: "/Referral" },
          ].map((item) => (
            <Pressable cssInterop={false} key={item.title} onPress={() => item.title === "Security" ? router.push({ pathname: "/(tabs)/account", params: { tab: "security" } } as any) : open(item.route)}
              accessibilityRole="button" accessibilityLabel={item.title}
              style={({ pressed }) => ({ flex: 1, minHeight: 142, backgroundColor: color.card, borderRadius: 22, padding: 17, gap: 10, opacity: pressed ? 0.72 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] })}>
              <View style={{ width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: color.accentSoft }}>
                <HugeiconsIcon icon={item.icon} size={20} color={color.accent} strokeWidth={1.8} />
              </View>
              <Text style={{ fontSize: 15, fontWeight: "600", color: color.text }}>{item.title}</Text>
              <Text style={{ fontSize: 12, lineHeight: 18, color: color.textSecondary }}>{item.detail}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </AppScreen>
  );
}