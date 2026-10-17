import { HomeSkeleton } from "@/components/skeletonScreen/HomeSkeletonScreen";
import { NetworkStatusScreen } from "@/components/StatusScreen";
import { getColors, useTheme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowRight01Icon,
  BrowserIcon,
  Layout01Icon,
  File01Icon,
  Link01Icon,
  ShieldCheckIcon,
  GiftIcon,
} from "@/constants/icons";
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
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <Text style={{ fontSize: 19, lineHeight: 25, fontWeight: "600", letterSpacing: -0.3, color: color.text }}>{title}</Text>
      <Pressable onPress={() => open(route)} accessibilityRole="button" accessibilityLabel={`View all ${title.toLowerCase()}`} hitSlop={6} style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Text style={{ fontSize: 13, fontWeight: "500", color: color.link }}>View all</Text>
        <HugeiconsIcon icon={ArrowRight01Icon} size={14} color={color.link} strokeWidth={2} />
      </Pressable>
    </View>
  );

  return (
    <AppScreen safeArea={false}>
      <AppTopBar showPlanBadge />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 128, gap: 28 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={color.accent} />}
        showsVerticalScrollIndicator={false}
      >
        <TestNotificationButton />
        <View>
          <Text style={{ maxWidth: 310, fontSize: 32, lineHeight: 38, fontWeight: "600", letterSpacing: -0.85, color: color.text }}>Your work,{"\n"}made effortless.</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 22 }}>
            {ENGINES.map((item, index) => (
              <Pressable cssInterop={false} key={item.id} onPress={() => open(item.route)} accessibilityRole="button" accessibilityLabel={item.name}
                style={({ pressed }) => ({ flex: 1, minWidth: 0, minHeight: 90, paddingHorizontal: 4, paddingVertical: 11, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: pastel[index], opacity: pressed ? 0.72 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] })}>
                <Image source={item.logo} style={{ width: 40, height: 40 }} resizeMode="contain" />
                <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82} style={{ width: "100%", textAlign: "center", fontSize: 11, lineHeight: 14, fontWeight: "600", color: color.text, marginTop: 7 }}>{item.name.replace("Smart ", "").replace(" Pilot", "")}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          {section("Your workspace", "/(tabs)/products")}
          <View style={{ backgroundColor: color.card, borderRadius: 24, padding: 20, flexDirection: "row", gap: 10 }}>
            {[
              { label: "Pages", value: telemetry?.landingPagesCount ?? 0, route: "/tools/landing-templates", icon: Layout01Icon },
              { label: "Forms", value: telemetry?.quickFormsCount ?? 0, route: "/tools/quick-forms", icon: File01Icon },
              { label: "Links", value: telemetry?.shortLinksCount ?? 0, route: "/tools/link-shortener", icon: Link01Icon },
            ].map((item, index) => (
              <Pressable key={item.label} onPress={() => open(item.route)} accessibilityRole="button" accessibilityLabel={`${item.value} ${item.label}`} style={{ flex: 1, alignItems: "center", gap: 7 }}>
                <View style={{ width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: pastel[(index + 2) % pastel.length] }}>
                  <HugeiconsIcon icon={item.icon} size={19} color={color.text} strokeWidth={1.8} />
                </View>
                <Text style={{ fontSize: 25, lineHeight: 30, fontWeight: "600", color: color.text, textAlign: "center" }}>{item.value}</Text>
                <Text style={{ fontSize: 12, color: color.textSecondary, textAlign: "center" }}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          {section("Create something", "/(tabs)/tools")}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 4 }}>
            {TOOLS.map((tool, index) => (
              <Pressable cssInterop={false} key={tool.id} onPress={() => open(tool.route)} accessibilityRole="button" accessibilityLabel={tool.name}
                style={({ pressed }) => ({ width: 232, minHeight: 142, borderRadius: 20, padding: 16, backgroundColor: color.card, opacity: pressed ? 0.76 : 1, justifyContent: "space-between", transform: [{ scale: pressed ? 0.985 : 1 }] })}>
                <View style={{ width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: pastel[index % pastel.length] }}>
                  <Ionicons name={tool.icon as any} size={20} color={color.text} />
                </View>
                <View style={{ marginTop: 14 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Text numberOfLines={1} style={{ flex: 1, fontSize: 15, lineHeight: 20, fontWeight: "600", letterSpacing: -0.2, color: color.text }}>{tool.name}</Text>
                    <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: color.accentSoft }}>
                      <HugeiconsIcon icon={ArrowRight01Icon} size={14} color={color.accent} strokeWidth={2} />
                    </View>
                  </View>
                  <Text numberOfLines={2} style={{ marginTop: 5, paddingRight: 30, fontSize: 12, lineHeight: 17, color: color.textSecondary }}>{tool.desc}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

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
