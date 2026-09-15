import { HomeSkeleton } from "@/components/skeletonScreen/HomeSkeletonScreen";
import { NetworkStatusScreen } from "@/components/StatusScreen";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Image,
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
    queryFn: () =>
      apiClient.get<DeviceSessionsResponse>("/mobile/v1/auth/device-sessions"),
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
      iconBg: "#0088CC",
      route: "/products/telegram",
      status: hasTelegram ? "Active" : "Pro",
      isLive: hasTelegram,
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      desc: "Broadcasts & 24/7 Meta API triggers",
      logo: require("../../assets/images/products/whatsapp.png"),
      iconBg: "#25D366",
      route: "/products/whatsapp",
      status: hasWhatsApp ? "Active" : "Pro",
      isLive: hasWhatsApp,
    },
    {
      id: "voice",
      name: "Voice AI",
      desc: "AI Voice calling agents & speech streaming",
      logo: require("../../assets/images/products/voice.png"),
      iconBg: "#8B5CF6",
      route: "/products/voice",
      status: hasVoice ? "Active" : "Pro",
      isLive: hasVoice,
    },
    {
      id: "crm",
      name: "Smart CRM",
      desc: "Pipelines, deals & lead contact automation",
      logo: require("../../assets/images/products/crm.png"),
      iconBg: "#F59E0B",
      route: "/products/crm",
      status: hasCRM ? "Active" : "Pro",
      isLive: hasCRM,
    },
    {
      id: "social",
      name: "Social Pilot",
      desc: "Cross-platform auto-poster & queue",
      logo: require("../../assets/images/products/social.png"),
      iconBg: "#E1306C",
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
    return (
      <NetworkStatusScreen
        onRetry={refresh}
        isChecking={isChecking}
      />
    );
  }

  return (
    <AppScreen safeArea={false}>
      {/* Top Header */}
      <AppTopBar />

      <ScrollView
        className="flex-1 bg-[#0B0D10]"
        contentContainerClassName="px-4 pt-3.5 pb-32 bg-[#0B0D10]"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#0A84FF"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* iOS Native Search Field */}
        <View className="flex-row items-center bg-[#181A1F] border border-[#262930] rounded-xl px-2.5 h-10 mb-4">
          <Ionicons
            name="search"
            size={16}
            color="#8E8E93"
            style={{ marginRight: 6 }}
          />
          <TextInput
            className="flex-1 text-sm text-white py-1.5"
            placeholder="Search bots, automation & tools..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color="#8E8E93" />
            </Pressable>
          ) : (
            <Ionicons name="options-outline" size={16} color="#8E8E93" />
          )}
        </View>

        {/* Dual Telemetry Widgets */}
        <View className="flex-row gap-3 mb-4">
          <Pressable
            className="flex-1 flex-row items-center bg-[#181A1F] border border-[#262930] rounded-2xl py-3 px-3 gap-2"
            onPress={() => {
              triggerHaptic();
              router.push("/account/plans" as any);
            }}
          >
            <View className="w-8 h-8 rounded-lg bg-blue-500/15 justify-center items-center">
              <Ionicons name="diamond" size={17} color="#0A84FF" />
            </View>
            <View className="flex-1 justify-center">
              <Text className="text-[10px] font-medium text-slate-400 mb-0.5" numberOfLines={1}>
                Workspace Plan
              </Text>
              <Text className="text-[13.5px] font-bold text-white tracking-tight" numberOfLines={1}>
                {planLabel || "GAP Pro Max"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={13} color="#8E8E93" />
          </Pressable>

          <Pressable
            className="flex-1 flex-row items-center bg-[#181A1F] border border-[#262930] rounded-2xl py-3 px-3 gap-2"
            onPress={() => {
              triggerHaptic();
              router.push("/(tabs)/activity" as any);
            }}
          >
            <View className="w-8 h-8 rounded-lg bg-emerald-500/15 justify-center items-center">
              <Ionicons name="rocket" size={17} color="#30D158" />
            </View>
            <View className="flex-1 justify-center">
              <Text className="text-[10px] font-medium text-slate-400 mb-0.5" numberOfLines={1}>
                Automation Fleet
              </Text>
              <Text className="text-[13.5px] font-bold text-white tracking-tight" numberOfLines={1}>
                5 Engines
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={13} color="#8E8E93" />
          </Pressable>
        </View>

        {/* Signed-in device summary */}
        <Pressable
          className="flex-row items-center bg-[#181A1F] border border-[#262930] rounded-2xl p-3.5 mb-4"
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
          <View className="w-9 h-9 rounded-xl bg-emerald-500/15 justify-center items-center mr-3">
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color="#10B981"
            />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center justify-between gap-2">
              <Text className="text-[14.5px] font-bold text-white">
                Login security
              </Text>
              <View className="bg-emerald-500/15 rounded-md px-2 py-0.5">
                <Text className="text-emerald-400 text-[10.5px] font-extrabold">
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
                      color="#8E8E93"
                    />
                    <Text className="flex-1 text-slate-400 text-xs" numberOfLines={1}>
                      {device.deviceName} ·{" "}
                      {device.isOnline ? "Online" : "Offline"}
                      {device.isCurrent ? " · This device" : ""}
                    </Text>
                  </View>
                ))}
                {deviceSessions.activeDeviceCount > 2 && (
                  <Text className="text-blue-400 text-[11.5px] font-bold ml-4">
                    +{deviceSessions.activeDeviceCount - 2} more device
                    {deviceSessions.activeDeviceCount - 2 === 1 ? "" : "s"}
                  </Text>
                )}
              </View>
            ) : (
              <Text className="text-slate-400 text-xs mt-1">
                {isLoadingDevices
                  ? "Loading signed-in devices"
                  : "No active device logins found"}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={17} color="#8E8E93" />
        </Pressable>

        {/* Segmented Filter Bar */}
        <View className="flex-row bg-[#181A1F] border border-[#262930] rounded-xl p-1 mb-5">
          <Pressable
            className={`flex-1 py-1.5 rounded-lg items-center justify-center ${selectedFilter === "all" ? "bg-[#262930]" : ""}`}
            onPress={() => {
              triggerHaptic();
              setSelectedFilter("all");
            }}
          >
            <Text
              className={`text-xs font-semibold ${selectedFilter === "all" ? "text-white" : "text-slate-400"}`}
            >
              All Engines
            </Text>
          </Pressable>

          <Pressable
            className={`flex-1 py-1.5 rounded-lg items-center justify-center ${selectedFilter === "bots" ? "bg-[#262930]" : ""}`}
            onPress={() => {
              triggerHaptic();
              setSelectedFilter("bots");
            }}
          >
            <Text
              className={`text-xs font-semibold ${selectedFilter === "bots" ? "text-white" : "text-slate-400"}`}
            >
              Automation Hub
            </Text>
          </Pressable>

          <Pressable
            className={`flex-1 py-1.5 rounded-lg items-center justify-center ${selectedFilter === "tools" ? "bg-[#262930]" : ""}`}
            onPress={() => {
              triggerHaptic();
              setSelectedFilter("tools");
            }}
          >
            <Text
              className={`text-xs font-semibold ${selectedFilter === "tools" ? "text-white" : "text-slate-400"}`}
            >
              Studio Tools
            </Text>
          </Pressable>
        </View>

        {/* SECTION 1: Automation Engines */}
        {(selectedFilter === "all" || selectedFilter === "bots") && (
          <View className="mb-6">
            <View className="flex-row justify-between items-center px-1 mb-2">
              <Text className="text-[13px] font-semibold text-slate-400 tracking-tight">
                Automation Engines
              </Text>
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  router.push("/(tabs)/products" as any);
                }}
              >
                <Text className="text-[13px] font-medium text-blue-400">See All ›</Text>
              </Pressable>
            </View>

            {/* Inset Grouped Icon Grid */}
            <View className="flex-row justify-between items-center bg-[#181A1F] border border-[#262930] rounded-2xl py-3.5 px-3.5">
              {filteredEngines.map((item) => (
                <Pressable
                  key={item.id}
                  className="items-center justify-center"
                  onPress={() => {
                    triggerHaptic();
                    router.push(item.route as any);
                  }}
                >
                  <Image
                    source={item.logo}
                    className="w-12 h-12 rounded-xl"
                    resizeMode="contain"
                  />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* SECTION 2: Studio & Utilities */}
        {(selectedFilter === "all" || selectedFilter === "tools") && (
          <View className="mb-6">
            <View className="flex-row justify-between items-center px-1 mb-2">
              <Text className="text-[13px] font-semibold text-slate-400 tracking-tight">
                Studio & Utilities
              </Text>
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  router.push("/(tabs)/tools" as any);
                }}
              >
                <Text className="text-[13px] font-medium text-blue-400">Explore Tools ›</Text>
              </Pressable>
            </View>

            {/* Inset Grouped List */}
            <View className="bg-[#181A1F] border border-[#262930] rounded-2xl overflow-hidden">
              {filteredTools.map((tool, index) => {
                const isLast = index === filteredTools.length - 1;
                return (
                  <View key={tool.id}>
                    <Pressable
                      className="flex-row items-center py-3 px-3.5 gap-3"
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
                      <View className="flex-1">
                        <Text className="text-[14.5px] font-bold text-white tracking-tight mb-0.5">
                          {tool.name}
                        </Text>
                        <Text className="text-[11.5px] text-slate-400" numberOfLines={1}>
                          {tool.desc}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={17}
                        color="#8E8E93"
                      />
                    </Pressable>
                    {!isLast && (
                      <View className="h-[1px] bg-[#262930] ml-14" />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}

