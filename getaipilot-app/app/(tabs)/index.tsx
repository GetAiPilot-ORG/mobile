import { HomeSkeleton } from "@/components/skeletonScreen/HomeSkeletonScreen";
import { NetworkStatusScreen } from "@/components/StatusScreen";
import { getColors, useTheme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
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

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "bots" | "tools"
  >("all");
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

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "AI Pilot";

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
      icon: "qr-code",
      iconBg: "#4F46E5",
      route: "/tools/qr-code",
    },
    {
      id: "links",
      name: "Link Shortener",
      desc: "Custom slugs with click analytics",
      icon: "link",
      iconBg: "#0284C7",
      route: "/tools/link-shortener",
    },
    {
      id: "bio",
      name: "Bio Builder",
      desc: "Mobile bio link landing pages",
      icon: "phone-portrait",
      iconBg: "#EC4899",
      route: "/tools/bio-templates",
    },
    {
      id: "forms",
      name: "QuickForms",
      desc: "Conversational lead intake funnels",
      icon: "document-text",
      iconBg: "#0D9488",
      route: "/tools/quick-forms",
    },
    {
      id: "speech",
      name: "Speech to Text",
      desc: "AI audio transcription engine",
      icon: "volume-high",
      iconBg: "#7C3AED",
      route: "/tools/speech-to-text",
    },
    {
      id: "audit",
      name: "Website Audit",
      desc: "SEO & Core Web Vitals health score",
      icon: "speedometer",
      iconBg: "#059669",
      route: "/tools/website-audit",
    },
  ];

  const filteredEngines = ENGINES.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.desc.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredTools = TOOLS.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.desc.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
        {/* iOS Native Search Field */}
        <View
          className="flex-row items-center rounded-2xl px-3 h-10 mb-4 border shadow-sm"
          style={{ backgroundColor: color.card, borderColor: color.border }}
        >
          <Ionicons
            name="search"
            size={16}
            color={color.iconPrimary}
            className="mr-2"
          />
          <TextInput
            className="flex-1 text-sm py-1.5"
            style={{ color: color.textPrimary }}
            placeholder="Search bots, automation & tools..."
            placeholderTextColor={color.inputPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
              <Ionicons
                name="close-circle"
                size={16}
                color={color.iconPrimary}
              />
            </Pressable>
          ) : (
            <Ionicons
              name="options-outline"
              size={16}
              color={color.iconPrimary}
            />
          )}
        </View>

        {/* Dual Telemetry Widgets (Apple Inset Dual Cards) */}
        <View className="flex-row gap-3 mb-4 w-full">
          <Pressable
            className="flex-1 flex-row items-center p-3 rounded-2xl border shadow-sm active:opacity-75 min-w-0 gap-2.5"
            style={{ flexBasis: 0, backgroundColor: color.card, borderColor: color.border }}
            onPress={() => {
              triggerHaptic();
              router.push("/account/plans" as any);
            }}
          >
            <View
              className="w-8 h-8 rounded-xl justify-center items-center"
              style={{ backgroundColor: color.accentSoft }}
            >
              <Ionicons name="diamond" size={17} color={color.primary} />
            </View>
            <View className="flex-1 min-w-0 justify-center">
              <Text
                className="text-[10px] font-medium mb-0.5"
                style={{ color: color.textSecondary }}
                numberOfLines={1}
              >
                Workspace Plan
              </Text>
              <Text
                className="text-[13.5px] font-bold tracking-tight"
                style={{ color: color.textPrimary }}
                numberOfLines={1}
              >
                {planLabel || "GAP Pro Max"}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={13}
              color={color.iconPrimary}
            />
          </Pressable>

          <Pressable
            className="flex-1 flex-row items-center p-3 rounded-2xl border shadow-sm active:opacity-75 min-w-0 gap-2.5"
            style={{ flexBasis: 0, backgroundColor: color.card, borderColor: color.border }}
            onPress={() => {
              triggerHaptic();
              router.push("/(tabs)/activity" as any);
            }}
          >
            <View
              className="w-8 h-8 rounded-xl justify-center items-center"
              style={{ backgroundColor: "rgba(48, 209, 88, 0.15)" }}
            >
              <Ionicons name="rocket" size={17} color="#30D158" />
            </View>
            <View className="flex-1 min-w-0 justify-center">
              <Text
                className="text-[10px] font-medium mb-0.5"
                style={{ color: color.textSecondary }}
                numberOfLines={1}
              >
                Automation Fleet
              </Text>
              <Text
                className="text-[13.5px] font-bold tracking-tight"
                style={{ color: color.textPrimary }}
                numberOfLines={1}
              >
                5 Engines
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={13}
              color={color.iconPrimary}
            />
          </Pressable>
        </View>

        {/* Signed-in device summary. Full device management lives in Account > Security. */}
        <Pressable
          className="flex-row items-center p-3.5 rounded-2xl border mb-4 shadow-sm active:opacity-80"
          style={{ backgroundColor: color.card, borderColor: color.border }}
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
            className="w-10 h-10 rounded-xl justify-center items-center mr-3"
            style={{ backgroundColor: "rgba(16, 185, 129, 0.15)" }}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color="#10B981"
            />
          </View>
          <View className="flex-1 min-w-0">
            <View className="flex-row items-center justify-between gap-2">
              <Text
                className="text-[14.5px] font-bold"
                style={{ color: color.textPrimary }}
              >
                Login security
              </Text>
              <View
                className="px-2 py-0.5 rounded-lg"
                style={{ backgroundColor: color.successSoft }}
              >
                <Text
                  className="text-[10.5px] font-extrabold"
                  style={{ color: color.success }}
                >
                  {isLoadingDevices
                    ? "Checking…"
                    : `${deviceSessions?.activeDeviceCount ?? 0} active`}
                </Text>
              </View>
            </View>
            {deviceSessions?.devices.length ? (
              <View className="mt-1.5 gap-1">
                {deviceSessions.devices.slice(0, 2).map((device) => (
                  <View key={device.sessionId} className="flex-row items-center gap-1.5">
                    <Ionicons
                      name={
                        device.platform === "web"
                          ? "globe-outline"
                          : "phone-portrait-outline"
                      }
                      size={13}
                      color={color.iconPrimary}
                    />
                    <Text
                      className="flex-1 text-xs"
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
                className="text-xs mt-1"
                style={{ color: color.textSecondary }}
              >
                {isLoadingDevices
                  ? "Loading signed-in devices"
                  : "No active device logins found"}
              </Text>
            )}
          </View>
          <Ionicons
            name="chevron-forward"
            size={17}
            color={color.iconPrimary}
          />
        </Pressable>

        {/* Overall Ecosystem Pricing & Upgrades Tile */}
        <Pressable
          className="rounded-2xl p-3.5 border mb-3.5 gap-2.5 shadow-sm active:opacity-85"
          style={{ backgroundColor: color.card, borderColor: color.border }}
          onPress={() => {
            triggerHaptic();
            router.push("/account/plans" as any);
          }}
          accessibilityRole="button"
          accessibilityLabel="Explore overall pricing plans and ecosystem quotas"
        >
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center gap-1.5">
              <View
                className="flex-row items-center gap-1 px-2 py-1 rounded-md"
                style={{ backgroundColor: color.accentSoft }}
              >
                <Ionicons name="sparkles" size={11} color={color.primary} />
                <Text
                  className="text-[10px] font-extrabold tracking-wider"
                  style={{ color: color.foreground }}
                >
                  ECOSYSTEM PRICING
                </Text>
              </View>
              <View
                className="px-2 py-1 rounded-md"
                style={{ backgroundColor: color.accentSoft }}
              >
                <Text
                  className="text-[10px] font-extrabold tracking-wider"
                  style={{ color: color.accent }}
                >
                  FROM ₹799/MO
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={color.iconPrimary}
            />
          </View>

          <View className="gap-0.5">
            <Text
              className="text-[15px] font-extrabold tracking-tight"
              style={{ color: color.textPrimary }}
            >
              Scale Your Automation Fleet
            </Text>
            <Text
              className="text-[11.5px]"
              style={{ color: color.textSecondary }}
            >
              Voice AI Calling · Social Pilot · WhatsApp · Telegram · Smart CRM
            </Text>
          </View>

          {/* Pricing Quick Snapshot Pills */}
          <View className="flex-row flex-wrap gap-1.5 mt-0.5">
            <View
              className="flex-row items-center gap-1 px-2 py-1 rounded-lg"
              style={{ backgroundColor: color.tabBackground }}
            >
              <Ionicons name="call" size={11} color={color.products.voice} />
              <Text
                className="text-[10.5px] font-bold"
                style={{ color: color.textPrimary }}
              >
                Voice AI ₹1,499
              </Text>
            </View>
            <View
              className="flex-row items-center gap-1 px-2 py-1 rounded-lg"
              style={{ backgroundColor: color.tabBackground }}
            >
              <Ionicons name="share-social" size={11} color={color.products.social} />
              <Text
                className="text-[10.5px] font-bold"
                style={{ color: color.textPrimary }}
              >
                Social ₹999
              </Text>
            </View>
            <View
              className="flex-row items-center gap-1 px-2 py-1 rounded-lg"
              style={{ backgroundColor: color.tabBackground }}
            >
              <Ionicons name="logo-whatsapp" size={11} color={color.products.whatsapp} />
              <Text
                className="text-[10.5px] font-bold"
                style={{ color: color.textPrimary }}
              >
                WA ₹999
              </Text>
            </View>
            <View
              className="flex-row items-center gap-1 px-2 py-1 rounded-lg"
              style={{ backgroundColor: color.tabBackground }}
            >
              <Ionicons name="people" size={11} color={color.products.crm} />
              <Text
                className="text-[10.5px] font-bold"
                style={{ color: color.textPrimary }}
              >
                CRM ₹799
              </Text>
            </View>
          </View>

          {/* Bottom Action Strip */}
          <View
            className="flex-row justify-between items-center pt-2 border-t mt-0.5"
            style={{ borderColor: color.border }}
          >
            <Text
              className="text-[11px] font-medium"
              style={{ color: color.textSecondary }}
            >
              Compare all plans, quotas & features
            </Text>
            <View className="flex-row items-center gap-1">
              <Text
                className="text-[11.5px] font-bold"
                style={{ color: color.primary }}
              >
                View Plans
              </Text>
              <Ionicons name="arrow-forward" size={12} color={color.primary} />
            </View>
          </View>
        </Pressable>

        {/* iOS Native Segmented Filter Bar */}
        <View
          className="flex-row rounded-xl p-1 mb-5 gap-1 w-full"
          style={{ backgroundColor: color.tabBackground }}
        >
          <Pressable
            className="flex-1 py-2 rounded-lg items-center justify-center active:opacity-80"
            style={selectedFilter === "all" ? { backgroundColor: color.card } : undefined}
            onPress={() => {
              triggerHaptic();
              setSelectedFilter("all");
            }}
          >
            <Text
              className="text-xs font-semibold"
              style={{
                color: selectedFilter === "all" ? color.textPrimary : color.textSecondary,
              }}
            >
              All Engines
            </Text>
          </Pressable>

          <Pressable
            className="flex-1 py-2 rounded-lg items-center justify-center active:opacity-80"
            style={selectedFilter === "bots" ? { backgroundColor: color.card } : undefined}
            onPress={() => {
              triggerHaptic();
              setSelectedFilter("bots");
            }}
          >
            <Text
              className="text-xs font-semibold"
              style={{
                color: selectedFilter === "bots" ? color.textPrimary : color.textSecondary,
              }}
            >
              Automation Hub
            </Text>
          </Pressable>

          <Pressable
            className="flex-1 py-2 rounded-lg items-center justify-center active:opacity-80"
            style={selectedFilter === "tools" ? { backgroundColor: color.card } : undefined}
            onPress={() => {
              triggerHaptic();
              setSelectedFilter("tools");
            }}
          >
            <Text
              className="text-xs font-semibold"
              style={{
                color: selectedFilter === "tools" ? color.textPrimary : color.textSecondary,
              }}
            >
              Studio Tools
            </Text>
          </Pressable>
        </View>

        {/* SECTION 1: Automation Engines */}
        {(selectedFilter === "all" || selectedFilter === "bots") && (
          <View className="mb-6">
            <View className="flex-row justify-between items-center px-1 mb-2">
              <Text
                className="text-[13px] font-semibold tracking-tight"
                style={{ color: color.textSecondary }}
              >
                Automation Engines
              </Text>
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  router.push("/(tabs)/products" as any);
                }}
              >
                <Text
                  className="text-[13px] font-medium"
                  style={{ color: color.primary }}
                >
                  See All ›
                </Text>
              </Pressable>
            </View>

            {/* Inset Grouped Icon Grid */}
            <View
              className="flex-row justify-between items-center p-3.5 rounded-2xl border shadow-sm"
              style={{ backgroundColor: color.card, borderColor: color.border }}
            >
              {filteredEngines.map((item) => (
                <Pressable
                  key={item.id}
                  className="items-center justify-center active:opacity-75"
                  onPress={() => {
                    triggerHaptic();
                    router.push(item.route as any);
                  }}
                >
                  <Image
                    source={item.logo}
                    className="w-[50px] h-[50px] rounded-xl"
                    resizeMode="contain"
                  />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* SECTION 2: Studio & Utilities (Apple HIG Inset Grouped List) */}
        {(selectedFilter === "all" || selectedFilter === "tools") && (
          <View className="mb-6">
            <View className="flex-row justify-between items-center px-1 mb-2">
              <Text
                className="text-[13px] font-semibold tracking-tight"
                style={{ color: color.textSecondary }}
              >
                Studio & Utilities
              </Text>
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  router.push("/(tabs)/tools" as any);
                }}
              >
                <Text
                  className="text-[13px] font-medium"
                  style={{ color: color.primary }}
                >
                  Explore Tools ›
                </Text>
              </Pressable>
            </View>

            {/* Apple HIG Inset Grouped Unified Card with Hairline Dividers */}
            <View
              className="rounded-2xl border overflow-hidden shadow-sm"
              style={{ backgroundColor: color.card, borderColor: color.border }}
            >
              {filteredTools.map((tool, index) => {
                const isLast = index === filteredTools.length - 1;
                return (
                  <View key={tool.id}>
                    <Pressable
                      className="flex-row items-center py-3 px-3.5 gap-3 active:opacity-75"
                      onPress={() => {
                        triggerHaptic();
                        router.push(tool.route as any);
                      }}
                    >
                      <View
                        className="w-8 h-8 rounded-lg justify-center items-center"
                        style={{ backgroundColor: tool.iconBg }}
                      >
                        <Ionicons
                          name={tool.icon as any}
                          size={18}
                          color="#FFFFFF"
                        />
                      </View>
                      <View className="flex-1 min-w-0">
                        <Text
                          className="text-[14.5px] font-bold tracking-tight mb-0.5"
                          style={{ color: color.textPrimary }}
                        >
                          {tool.name}
                        </Text>
                        <Text
                          className="text-[11.5px]"
                          style={{ color: color.textSecondary }}
                          numberOfLines={1}
                        >
                          {tool.desc}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={17}
                        color={color.iconPrimary}
                      />
                    </Pressable>
                    {!isLast && (
                      <View
                        className="h-[1px] ml-14"
                        style={{ backgroundColor: color.border }}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}
        <Pressable
          onPress={() => router.push('/Referral' as any)}
          // className="mx-2.5 my-2 rounded-2xl overflow-hidden border shadow-sm"
          style={{ borderColor: color.border }}
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

