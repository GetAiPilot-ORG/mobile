import { HomeSkeleton } from "@/components/skeletonScreen/HomeSkeletonScreen";
import { NetworkStatusScreen } from "@/components/StatusScreen";
import { getColors, useTheme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { AppScreen } from "../../src/components/AppScreen";
import { AppTopBar } from "../../src/components/AppTopBar";
import { useAuth } from "../../src/contexts/AuthContext";
import { useNetwork } from "../../src/contexts/NetworkContext";
import { apiClient } from "../../src/core/api/client";
import { usePlatformSubscription } from "../../src/hooks/usePlatformSubscription";
import { supabase } from "../../src/lib/supabase";

const { width, height } = Dimensions.get('window')

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

  // Real Workspace Telemetry from Supabase
  const { data: telemetry, refetch: refetchTelemetry } = useQuery({
    queryKey: ["workspace-telemetry-ios", user?.id],
    queryFn: async () => {
      if (!user?.id)
        return {
          landingPagesCount: 0,
          quickFormsCount: 0,
          shortLinksCount: 0,
          botsCount: 0,
        };
      try {
        const [pagesRes, formsRes, linksRes] = await Promise.all([
          supabase
            .from("landing_pages")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
          supabase
            .from("quick_forms")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
          supabase
            .from("short_links")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
        ]);
        return {
          landingPagesCount: pagesRes.count || 0,
          quickFormsCount: formsRes.count || 0,
          shortLinksCount: linksRes.count || 0,
          botsCount: 5,
        };
      } catch {
        return {
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

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  // Studio & Free Utilities
  const TOOLS = [
    {
      id: "qr",
      name: "QR Generator",
      desc: "Custom branded vectors & logos",
      category: "BRANDING",
      badge: "FREE",
      icon: "qr-code",
      iconBg: "#4F46E5",
      route: "/tools/qr-code",
    },
    {
      id: "links",
      name: "Link Shortener",
      desc: "Custom slugs with click analytics",
      category: "ANALYTICS",
      badge: "POPULAR",
      icon: "link",
      iconBg: "#0284C7",
      route: "/tools/link-shortener",
    },
    {
      id: "bio",
      name: "Bio Builder",
      desc: "Mobile bio link landing pages",
      category: "PAGES",
      badge: "FREE",
      icon: "phone-portrait",
      iconBg: "#EC4899",
      route: "/tools/bio-templates",
    },
    {
      id: "forms",
      name: "QuickForms",
      desc: "Conversational lead intake funnels",
      category: "CONVERSIONS",
      badge: "FREE",
      icon: "document-text",
      iconBg: "#0D9488",
      route: "/tools/quick-forms",
    },
    {
      id: "speech",
      name: "Speech to Text",
      desc: "AI audio transcription engine",
      category: "AI AUDIO",
      badge: "AI PRO",
      icon: "volume-high",
      iconBg: "#7C3AED",
      route: "/tools/speech-to-text",
    },
    {
      id: "audit",
      name: "Website Audit",
      desc: "SEO & Core Web Vitals health score",
      category: "SEO SCORE",
      badge: "FREE",
      icon: "speedometer",
      iconBg: "#059669",
      route: "/tools/website-audit",
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
  return (
    <AppScreen safeArea={false}>
      {/* Top Header */}
      <AppTopBar showPlanBadge={true} />

      <ScrollView
        className="flex-1 w-full"
        style={{ backgroundColor: color.background }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 130,
          width: "100%",
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={color.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >

        {/* ─── SECTION A: Automation Engines Dock ─── */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center px-1 mb-3">
            <View className="flex-row items-center gap-2">
              <Text
                className="text-base font-extrabold tracking-tight"
                style={{ color: color.text }}
              >
                Automation Engines
              </Text>
              <View
                className="px-2 py-0.5 rounded-lg"
                style={{ backgroundColor: color.accentSoft }}
              >
                <Text
                  className="text-[10px] font-extrabold tracking-wide"
                  style={{ color: color.primary }}
                >
                  5 ACTIVE
                </Text>
              </View>
            </View>
            <Pressable
              hitSlop={8}
              onPress={() => {
                triggerHaptic();
                router.push("/(tabs)/products" as any);
              }}
            >
              <Text
                className="text-[13px] font-semibold"
                style={{ color: color.primary }}
              >
                See All ›
              </Text>
            </Pressable>
          </View>

          {/* Launchpad Dock */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 18,
              paddingHorizontal: 12,
              borderRadius: 22,
              backgroundColor: color.card,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.25 : 0.05,
              shadowRadius: 8,
            }}
          >
            {ENGINES.map((item) => (
              <Pressable
                key={item.id}
                className="items-center justify-center flex-1"
                style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
                onPress={() => {
                  triggerHaptic();
                  router.push(item.route as any);
                }}
              >
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    backgroundColor: color.surfaceGrouped,
                  }}
                >
                  <Image
                    source={item.logo}
                    style={{ width: 44, height: 44, borderRadius: 12 }}
                    resizeMode="contain"
                  />
                </View>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: color.text,
                    marginTop: 6,
                    textAlign: "center",
                  }}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ─── SECTION B: Studio & Free Utilities (Horizontal Cards) ─── */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center px-1 mb-4 mt-2">
            <View className="flex-row items-center gap-2">
              <Text
                className="text-base font-extrabold tracking-tight"
                style={{ color: color.text }}
              >
                Studio & Utilities
              </Text>
              <View
                className="px-2 py-0.5 rounded-lg"
                style={{ backgroundColor: color.accentSoft }}
              >
                <Text
                  className="text-[10px] font-extrabold tracking-wide"
                  style={{ color: color.primary }}
                >
                  6 TOOLS
                </Text>
              </View>
            </View>
            <Pressable
              hitSlop={8}
              onPress={() => {
                triggerHaptic();
                router.push("/(tabs)/tools" as any);
              }}
            >
              <Text
                className="text-[13px] font-semibold"
                style={{ color: color.primary }}
              >
                See All ›
              </Text>
            </Pressable>
          </View>

          <FlatList
            horizontal
            data={TOOLS}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            style={{ height: 215 }}
            contentContainerStyle={{ gap: 14, paddingHorizontal: 2, paddingBottom: 8 }}
            renderItem={({ item: tool }) => (
              <Pressable
                style={{
                  backgroundColor: color.card,
                  width: 205,
                  height: 200,
                  padding: 16,
                  borderRadius: 20,
                  justifyContent: "space-between",
                  borderWidth: 1,
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.07)"
                    : color.cardBorder,
                  shadowColor: "#00000006",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.25 : 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}
                onPress={() => {
                  triggerHaptic();
                  router.push(tool.route as any);
                }}
              >
                {/* Card Header: Icon + Badge */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: tool.iconBg,
                    }}
                  >
                    <Ionicons name={tool.icon as any} size={21} color="#FFFFFF" />
                  </View>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 8,
                      backgroundColor: color.accentSoft,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 9.5,
                        fontWeight: "800",
                        letterSpacing: 0.8,
                        color: color.accent,
                      }}
                    >
                      {tool.badge}
                    </Text>
                  </View>
                </View>

                {/* Card Body: Category, Name & Desc */}
                <View style={{ flexGrow: 1, justifyContent: "center", gap: 3, marginBottom: 8 }}>
                  <Text
                    style={{
                      fontSize: 9.5,
                      fontWeight: "800",
                      letterSpacing: 1.2,
                      textTransform: "uppercase",
                      color: color.textSecondary,
                    }}
                  >
                    {tool.category}
                  </Text>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "800",
                      letterSpacing: -0.3,
                      color: color.text,
                    }}
                    numberOfLines={1}
                  >
                    {tool.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11.5,
                      lineHeight: 16,
                      color: color.textSecondary,
                    }}
                    numberOfLines={2}
                  >
                    {tool.desc}
                  </Text>
                </View>

                {/* Card Footer: Launch CTA */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: 11,
                    borderTopWidth: 1,
                    borderTopColor: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.05)",
                  }}
                >
                  <Text
                    style={{ fontSize: 11.5, fontWeight: "700", color: color.primary }}
                  >
                    Launch Tool
                  </Text>
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: color.primaryMuted,
                    }}
                  >
                    <Ionicons name="arrow-forward" size={11} color={color.primary} />
                  </View>
                </View>
              </Pressable>
            )}
          />
        </View>

        {/* ─── SECTION C: Workspace Quick-Stats Row ─── */}
        <View className="flex-row gap-3.5 mb-6 w-full">
          {/* Plan Tile */}
          <Pressable
            className="flex-1 p-4 rounded-[22px] justify-between"
            style={
              {
                backgroundColor: isDark
                  ? "rgba(197, 107, 255, 0.08)"
                  : "rgba(176, 68, 242, 0.05)",
                shadowColor: color.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.22 : 0.08,
                shadowRadius: 10,
                minHeight: 120,
              }
            }
            onPress={() => {
              triggerHaptic();
              router.push("/account/plans" as any);
            }}
          >
            {/* Top row: Icon + Action pill */}
            <View className="flex-row items-center justify-between">
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: isDark
                    ? "rgba(197, 107, 255, 0.2)"
                    : "rgba(176, 68, 242, 0.12)",
                }}
              >
                <Ionicons name="diamond" size={20} color={color.primary} />
              </View>
              <View
                className="flex-row items-center gap-1 px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: isDark
                    ? "rgba(197, 107, 255, 0.15)"
                    : "rgba(176, 68, 242, 0.08)",
                }}
              >
                <Text
                  className="text-[9.5px] font-extrabold tracking-wide"
                  style={{ color: color.primary }}
                >
                  ACTIVE
                </Text>
              </View>
            </View>

            {/* Bottom info */}
            <View className="mt-3">
              <Text
                className="text-[10px] font-bold tracking-widest uppercase mb-0.5"
                style={{ color: color.textSecondary }}
              >
                Workspace Plan
              </Text>
              <View className="flex-row items-center justify-between">
                <Text
                  className="text-[14.5px] font-extrabold tracking-tight"
                  style={{ color: color.text }}
                  numberOfLines={1}
                >
                  {planLabel || "GAP Pro Max"}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={12}
                  color={color.primary}
                />
              </View>
            </View>
          </Pressable>

          {/* Fleet Tile */}
          <Pressable
            className="flex-1 p-4 rounded-[22px] justify-between"
            style={
              {
                backgroundColor: isDark
                  ? "rgba(48, 209, 88, 0.08)"
                  : "rgba(22, 132, 91, 0.05)",
                shadowColor: "#30D158",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.22 : 0.08,
                shadowRadius: 10,
                minHeight: 120,
              }
            }
            onPress={() => {
              triggerHaptic();
              router.push("/(tabs)/activity" as any);
            }}
          >
            {/* Top row: Icon + Live Pill */}
            <View className="flex-row items-center justify-between">
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: isDark
                    ? "rgba(48, 209, 88, 0.2)"
                    : "rgba(22, 132, 91, 0.12)",
                }}
              >
                <Ionicons name="rocket" size={20} color="#30D158" />
              </View>
              <View
                className="flex-row items-center gap-1.5 px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: isDark
                    ? "rgba(48, 209, 88, 0.16)"
                    : "rgba(22, 132, 91, 0.1)",
                }}
              >
                <View
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: "#30D158" }}
                />
                <Text
                  className="text-[9.5px] font-extrabold tracking-wide"
                  style={{ color: "#30D158" }}
                >
                  LIVE
                </Text>
              </View>
            </View>

            {/* Bottom info */}
            <View className="mt-3">
              <Text
                className="text-[10px] font-bold tracking-widest uppercase mb-0.5"
                style={{ color: color.textSecondary }}
              >
                Automation Fleet
              </Text>
              <View className="flex-row items-center justify-between">
                <Text
                  className="text-[14.5px] font-extrabold tracking-tight"
                  style={{ color: color.text }}
                  numberOfLines={1}
                >
                  5 Active
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={12}
                  color="#30D158"
                />
              </View>
            </View>
          </Pressable>
        </View>

        {/* ─── SECTION D: Ecosystem Pricing Upgrade Tile ─── */}
        <Pressable
          className="rounded-[22px] p-5 mb-6 gap-3.5"
          style={
            {
              backgroundColor: color.card,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.25 : 0.05,
              shadowRadius: 8,
            }
          }
          onPress={() => {
            triggerHaptic();
            router.push("/account/plans" as any);
          }}
          accessibilityRole="button"
          accessibilityLabel="Explore overall pricing plans and ecosystem quotas"
        >
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center gap-2">
              <View
                className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: color.accentSoft }}
              >
                <Ionicons name="sparkles" size={12} color={color.primary} />
                <Text
                  className="text-[10.5px] font-extrabold tracking-wider"
                  style={{ color: color.primary }}
                >
                  ECOSYSTEM
                </Text>
              </View>
              <View
                className="px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: color.surfaceGrouped }}
              >
                <Text
                  className="text-[10.5px] font-extrabold tracking-wider"
                  style={{ color: color.accent }}
                >
                  FROM ₹799/MO
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={color.textSecondary} />
          </View>

          <View className="gap-1">
            <Text
              className="text-base font-extrabold tracking-tight"
              style={{ color: color.text }}
            >
              Scale Your Automation Fleet
            </Text>
            <Text
              className="text-[12px] leading-[18px]"
              style={{ color: color.textSecondary }}
            >
              Voice AI Calling · Social Pilot · WhatsApp · Telegram · Smart CRM
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-2 mt-0.5">
            <View
              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ backgroundColor: color.products.voiceSoft }}
            >
              <Ionicons name="call" size={12} color={color.products.voice} />
              <Text className="text-[11px] font-bold" style={{ color: color.text }}>Voice AI ₹1,499</Text>
            </View>
            <View
              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ backgroundColor: color.products.socialSoft }}
            >
              <Ionicons name="share-social" size={12} color={color.products.social} />
              <Text className="text-[11px] font-bold" style={{ color: color.text }}>Social ₹999</Text>
            </View>
            <View
              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ backgroundColor: color.products.whatsappSoft }}
            >
              <Ionicons name="logo-whatsapp" size={12} color={color.products.whatsapp} />
              <Text className="text-[11px] font-bold" style={{ color: color.text }}>WA ₹999</Text>
            </View>
            <View
              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ backgroundColor: color.products.crmSoft }}
            >
              <Ionicons name="people" size={12} color={color.products.crm} />
              <Text className="text-[11px] font-bold" style={{ color: color.text }}>CRM ₹799</Text>
            </View>
          </View>

          <View
            className="flex-row justify-between items-center pt-3 border-t mt-1"
            style={{
              borderTopColor: isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.05)",
            }}
          >
            <Text
              className="text-[11.5px] font-medium"
              style={{ color: color.textSecondary }}
            >
              Compare all plans, quotas & features
            </Text>
            <View className="flex-row items-center gap-1">
              <Text className="text-[12px] font-bold" style={{ color: color.primary }}>
                View Plans
              </Text>
              <Ionicons name="arrow-forward" size={13} color={color.primary} />
            </View>
          </View>
        </Pressable>

        {/* ─── SECTION E: Login Security ─── */}
        <Pressable
          className="flex-row items-center p-4.5 rounded-[22px] mb-6"
          style={({ pressed }) => [
            {
              backgroundColor: color.card,
              borderWidth: 1,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.07)"
                : color.cardBorder,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.25 : 0.05,
              shadowRadius: 8,
              elevation: 2,
              opacity: pressed ? 0.82 : 1,
            },
          ]}
          onPress={() => {
            triggerHaptic();
            router.push({
              pathname: "/(tabs)/account",
              params: { tab: "security" },
            } as any);
          }}
          accessibilityRole="button"
          accessibilityLabel="View logged-in devices in account security"
        >
          <View
            className="w-11 h-11 rounded-2xl justify-center items-center mr-3.5"
            style={{ backgroundColor: "rgba(16,185,129,0.14)" }}
          >
            <Ionicons name="shield-checkmark" size={22} color="#10B981" />
          </View>
          <View className="flex-1 min-w-0 mt-4 mb-4">
            <View className="flex-row items-center justify-between gap-2">
              <Text
                className="text-[15px] font-extrabold tracking-tight"
                style={{ color: color.text }}
              >
                Login Security
              </Text>
              <View
                className="flex-row items-center gap-1.5 px-2.5 py-0.5 rounded-full"
                style={{ backgroundColor: color.successSoft }}
              >
                <View
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: color.success }}
                />
                <Text
                  className="text-[11px] font-extrabold"
                  style={{ color: color.success }}
                >
                  {isLoadingDevices
                    ? "Checking…"
                    : `${deviceSessions?.activeDeviceCount ?? 1} Active`}
                </Text>
              </View>
            </View>
            {deviceSessions?.devices.length ? (
              <View className="mt-2 gap-1.5">
                {deviceSessions.devices.slice(0, 2).map((device) => (
                  <View key={device.sessionId} className="flex-row items-center gap-1.5">
                    <Ionicons
                      name={
                        device.platform === "web"
                          ? "globe-outline"
                          : "phone-portrait-outline"
                      }
                      size={13}
                      color={color.textSecondary}
                    />
                    <Text
                      className="flex-1 text-[12px]"
                      style={{ color: color.textSecondary }}
                      numberOfLines={1}
                    >
                      {device.deviceName} ·{" "}
                      {device.isOnline ? "Online" : "Offline"}
                      {device.isCurrent ? " · This device" : ""}
                    </Text>
                  </View>
                ))}
                {deviceSessions.activeDeviceCount > 2 && (
                  <Text
                    className="text-[11.5px] font-bold ml-4"
                    style={{ color: color.primary }}
                  >
                    +{deviceSessions.activeDeviceCount - 2} more device
                    {deviceSessions.activeDeviceCount - 2 === 1 ? "" : "s"}
                  </Text>
                )}
              </View>
            ) : (
              <Text
                className="text-[12px] mt-1"
                style={{ color: color.textSecondary }}
              >
                {isLoadingDevices
                  ? "Loading signed-in devices"
                  : "No active device logins found"}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={16} color={color.textSecondary} />
        </Pressable>

        {/* ─── SECTION F: Referral Banner ─── */}
        <Pressable
          onPress={() => router.push('/Referral' as any)}
          className="rounded-[22px] overflow-hidden mb-6"
          style={{
            borderWidth: 1,
            borderColor: isDark ? "rgba(255, 255, 255, 0.07)" : color.cardBorder,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.25 : 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
          accessibilityRole="button"
          accessibilityLabel="Refer AI Automation Services"
        >
          <Image
            source={require('../../assets/images/referral.png')}
            style={{ height: height * 0.45, width: width * 0.92, borderRadius: 16 }}
            resizeMode='cover'
          />
        </Pressable>
      </ScrollView>
    </AppScreen>
  );
}

