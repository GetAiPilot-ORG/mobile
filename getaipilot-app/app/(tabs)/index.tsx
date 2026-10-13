import { HomeSkeleton } from "@/components/skeletonScreen/HomeSkeletonScreen";
import { NetworkStatusScreen } from "@/components/StatusScreen";
import { getColors, useTheme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
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
  const pastel = isDark
    ? ["#263D3D", "#303B32", "#39304A", "#49372D", "#46303C"]
    : ["#D8F0F0", "#E0F1E6", "#E7DEFA", "#F9E5D4", "#F7DFE9"];

  const open = (route: string) => {
    triggerHaptic();
    router.push(route as any);
  };
  const section = (title: string, route: string) => (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <Text style={{ fontSize: 18, fontWeight: "600", color: color.text }}>{title}</Text>
      <Pressable onPress={() => open(route)} accessibilityRole="button" accessibilityLabel={`View all ${title.toLowerCase()}`} style={{ minHeight: 44, justifyContent: "center" }}>
        <Text style={{ fontSize: 13, color: color.link }}>View all</Text>
      </Pressable>
    </View>
  );

  return (
    <AppScreen safeArea={false}>
      <AppTopBar showPlanBadge />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 120, gap: 26 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={color.accent} />}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text style={{ fontSize: 32, lineHeight: 40, fontWeight: "500", letterSpacing: -0.8, color: color.text }}>Your work,{"\n"}made effortless.</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 24 }}>
            {ENGINES.map((item, index) => (
              <Pressable key={item.id} onPress={() => open(item.route)} accessibilityRole="button" accessibilityLabel={item.name}
                style={({ pressed }) => ({ flex: 1, minWidth: 0, paddingVertical: 12, borderRadius: 20, alignItems: "center", backgroundColor: pastel[index], opacity: pressed ? 0.7 : 1 })}>
                <Image source={item.logo} style={{ width: 38, height: 38 }} resizeMode="contain" />
                <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: "500", color: color.text, marginTop: 8 }}>{item.name.replace("Smart ", "").replace(" Pilot", "")}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          {section("Your workspace", "/(tabs)/products")}
          <View style={{ backgroundColor: color.card, borderRadius: 24, padding: 20, flexDirection: "row", gap: 10 }}>
            {[
              { label: "Pages", value: telemetry?.landingPagesCount ?? 0, route: "/tools/landing-templates", icon: "browsers-outline" },
              { label: "Forms", value: telemetry?.quickFormsCount ?? 0, route: "/tools/quick-forms", icon: "document-text-outline" },
              { label: "Links", value: telemetry?.shortLinksCount ?? 0, route: "/tools/link-shortener", icon: "link-outline" },
            ].map((item) => (
              <Pressable key={item.label} onPress={() => open(item.route)} accessibilityRole="button" accessibilityLabel={`${item.value} ${item.label}`} style={{ flex: 1, gap: 6 }}>
                <Ionicons name={item.icon as any} size={18} color={color.accent} />
                <Text style={{ fontSize: 26, fontWeight: "500", color: color.text }}>{item.value}</Text>
                <Text style={{ fontSize: 12, color: color.textSecondary }}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          {section("Create something", "/(tabs)/tools")}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 4 }}>
            {TOOLS.map((tool, index) => (
              <Pressable key={tool.id} onPress={() => open(tool.route)} accessibilityRole="button" accessibilityLabel={tool.name}
                style={({ pressed }) => ({ width: 166, minHeight: 164, borderRadius: 24, padding: 18, backgroundColor: pastel[index % pastel.length], opacity: pressed ? 0.75 : 1, justifyContent: "space-between" })}>
                <Ionicons name={tool.icon as any} size={28} color={color.text} />
                <View style={{ gap: 7 }}>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: color.text }}>{tool.name}</Text>
                  <Text numberOfLines={2} style={{ fontSize: 12, lineHeight: 17, color: color.textSecondary }}>{tool.desc}</Text>
                </View>
                <Ionicons name="arrow-forward" size={17} color={color.text} style={{ alignSelf: "flex-end", marginTop: 8 }} />
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <Pressable onPress={() => open("/account/plans")} accessibilityRole="button" accessibilityLabel="View plans"
          style={({ pressed }) => ({ backgroundColor: isDark ? "#383044" : "#E5DCF9", borderRadius: 24, padding: 22, opacity: pressed ? 0.8 : 1, gap: 16 })}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={{ fontSize: 22, fontWeight: "500", color: color.text }}>Room to grow</Text>
              <Text style={{ fontSize: 13, color: color.textSecondary }}>{planLabel || "Free"} plan</Text>
            </View>
            <View style={{ backgroundColor: color.buttonPrimary, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 24 }}>
              <Text style={{ fontSize: 12, fontWeight: "500", color: color.buttonPrimaryForeground }}>View plans</Text>
            </View>
          </View>
        </Pressable>

        <View style={{ flexDirection: "row", gap: 12 }}>
          {[
            { title: "Security", detail: isLoadingDevices ? "Checking devices…" : `${deviceSessions?.activeDeviceCount ?? 1} signed-in device${(deviceSessions?.activeDeviceCount ?? 1) === 1 ? "" : "s"}`, icon: "shield-checkmark-outline", route: "/(tabs)/account" },
            { title: "Invite friends", detail: "Your referrals", icon: "gift-outline", route: "/Referral" },
          ].map((item) => (
            <Pressable key={item.title} onPress={() => item.title === "Security" ? router.push({ pathname: "/(tabs)/account", params: { tab: "security" } } as any) : open(item.route)}
              accessibilityRole="button" accessibilityLabel={item.title}
              style={({ pressed }) => ({ flex: 1, backgroundColor: color.card, borderRadius: 22, padding: 18, gap: 10, opacity: pressed ? 0.75 : 1 })}>
              <Ionicons name={item.icon as any} size={22} color={color.accent} />
              <Text style={{ fontSize: 15, fontWeight: "600", color: color.text }}>{item.title}</Text>
              <Text style={{ fontSize: 12, lineHeight: 18, color: color.textSecondary }}>{item.detail}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </AppScreen>
  );
}
