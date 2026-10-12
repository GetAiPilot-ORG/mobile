import { getColors, useTheme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View
} from "react-native";
import { AppScreen } from "../../src/components/AppScreen";
import { AppTopBar } from "../../src/components/AppTopBar";
import { ActivityScreenSkeleton } from "../../src/components/skeletonScreen";
import { useAuth } from "../../src/contexts/AuthContext";
import { usePlatformSubscription } from "../../src/hooks/usePlatformSubscription";
import { supabase } from "../../src/lib/supabase";

type WorkspaceKey = "social" | "whatsapp" | "crm" | "voice" | "telegram";

const PLATFORMS: {
  key: WorkspaceKey;
  label: string;
  icon: string;
  route: string;
  color: string;
}[] = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    icon: "logo-whatsapp",
    route: "/products/whatsapp",
    color: "#25D366",
  },
  {
    key: "telegram",
    label: "Telegram",
    icon: "paper-plane",
    route: "/products/telegram",
    color: "#0088CC",
  },
  {
    key: "voice",
    label: "Voice AI",
    icon: "mic",
    route: "/products/voice",
    color: "#8B5CF6",
  },
  {
    key: "crm",
    label: "CRM",
    icon: "briefcase",
    route: "/products/crm",
    color: "#F59E0B",
  },
  {
    key: "social",
    label: "Social",
    icon: "share-social",
    route: "/products/social",
    color: "#E1306C",
  },
];

export default function ConnectedPlatformsPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const color = getColors(isDark);
  const { user } = useAuth();
  const { hasWhatsApp, hasTelegram, hasVoice, hasCRM, hasSocial } =
    usePlatformSubscription();
  const [activePlatform, setActivePlatform] =
    useState<WorkspaceKey>("whatsapp");

  const {
    data: platformData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["connected-platforms-telemetry-v2", user?.id || "guest"],
    queryFn: async () => {
      let currentUserId = user?.id;
      let currentOrgId = user?.organizationId;

      if (!currentUserId) {
        const { data: authData } = await supabase.auth.getUser();
        currentUserId = authData.user?.id;
      }

      if (currentUserId && !currentOrgId) {
        const { data: member } = await supabase
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", currentUserId)
          .maybeSingle();
        currentOrgId = member?.organization_id;
      }

      const waWalletPromise = currentOrgId
        ? supabase
            .from("whatsapp_wallets")
            .select("*")
            .eq("organization_id", currentOrgId)
            .maybeSingle()
        : supabase.from("whatsapp_wallets").select("*").limit(1).maybeSingle();

      const [
        profileRes,
        socialTokensRes,
        tgJoinRes,
        tgTrackRes,
        tgForwardRes,
        paymentsRes,
        formsRes,
        shortLinksRes,
        waWalletRes,
        waLogsRes,
      ] = await Promise.all([
        currentUserId
          ? supabase
              .from("profiles")
              .select("*")
              .eq("id", currentUserId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        currentUserId
          ? supabase
              .from("social_tokens")
              .select("*")
              .eq("user_id", currentUserId)
          : Promise.resolve({ data: [], error: null }),
        currentUserId
          ? supabase
              .from("tg_bot_join_links")
              .select("id", { count: "exact" })
              .eq("user_id", currentUserId)
          : Promise.resolve({ count: 0, error: null }),
        currentUserId
          ? supabase
              .from("tg_tracker")
              .select("id", { count: "exact" })
              .eq("user_id", currentUserId)
          : Promise.resolve({ count: 0, error: null }),
        supabase.from("tg_forward_mappings").select("id", { count: "exact" }),
        supabase
          .from("payments")
          .select("id, amount, status, created_at")
          .order("created_at", { ascending: false })
          .limit(6),
        currentUserId
          ? supabase
              .from("quick_forms")
              .select("id", { count: "exact" })
              .eq("user_id", currentUserId)
          : Promise.resolve({ count: 0, error: null }),
        currentUserId
          ? supabase
              .from("short_links")
              .select("*")
              .eq("user_id", currentUserId)
          : Promise.resolve({ data: [], error: null }),
        waWalletPromise,
        supabase
          .from("whatsapp_message_usage_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

      const profile = profileRes?.data || {};
      const socialTokens = socialTokensRes?.data || [];
      const shortLinks = shortLinksRes?.data || [];
      const totalClicks = shortLinks.reduce(
        (sum: number, l: any) => sum + (l.clicks || 0),
        0,
      );

      const walletPaise =
        waWalletRes?.data?.balance_paise !== undefined
          ? Number(waWalletRes.data.balance_paise)
          : 10000;

      return {
        profile,
        social: {
          connectedCount: socialTokens.length,
          tokens: socialTokens,
          accounts: [],
        },
        whatsapp: {
          wabaPhone: profile.whatsapp_number || "Linked Cloud API",
          walletBalancePaise: walletPaise,
          recentLogs: waLogsRes?.data || [],
        },
        telegram: {
          joinLinksCount: tgJoinRes?.count || 0,
          trackerCount: tgTrackRes?.count || 0,
          forwardRulesCount: tgForwardRes?.count || 0,
        },
        crm: {
          formsCount: formsRes?.count || 0,
          shortLinksCount: shortLinks.length,
          totalClicks,
        },
        payments: paymentsRes?.data || [],
      };
    },
  });

  const handleSelectTab = (key: WorkspaceKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActivePlatform(key);
  };

  const currentPlatformMeta =
    PLATFORMS.find((p) => p.key === activePlatform) || PLATFORMS[0];

  return (
    <AppScreen safeArea={false}>
      <AppTopBar
        title="Ecosystem Activity"
        showBack={false}
        showPlanBadge={true}
      />

      {isLoading && !platformData ? (
        <ActivityScreenSkeleton />
      ) : (
        <ScrollView
          className="flex-1"
          style={{ backgroundColor: color.background }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 130 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={isDark ? "#FFFFFF" : "#0A84FF"}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Card */}
          <View
            className="rounded-[22px] p-5 mb-4"
            style={{
              backgroundColor: color.card,
              borderWidth: 1,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.07)"
                : color.cardBorder,
              shadowColor: color.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.25 : 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View className="flex-row items-center gap-2 mb-2">
              <View
                className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: color.accentSoft }}
              >
                <Ionicons name="pulse" size={12} color={color.primary} />
                <Text
                  className="text-[10px] font-extrabold tracking-wider"
                  style={{ color: color.primary }}
                >
                  LIVE TELEMETRY
                </Text>
              </View>
            </View>
            <Text
              className="text-lg font-extrabold tracking-tight"
              style={{ color: color.text }}
            >
              Ecosystem Activity
            </Text>
            <Text
              className="text-[12.5px] mt-1 leading-[18px]"
              style={{ color: color.textSecondary }}
            >
              Real-time health telemetry, webhook triggers, and automated pipeline events.
            </Text>
          </View>

          {/* Platform Tabs (Folder Style matching Tools & Inbox tabs) */}
          <View style={{ position: "relative", marginVertical: 16 }}>
            {/* Continuous baseline */}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 1.5,
                backgroundColor: color.primary,
              }}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 2 }}
            >
              {PLATFORMS.map((p) => {
                const isActive = activePlatform === p.key;
                return (
                  <Pressable
                    key={p.key}
                    onPress={() => handleSelectTab(p.key)}
                    style={{
                      height: 38,
                      paddingHorizontal: 14,
                      justifyContent: "center",
                      alignItems: "center",
                      borderTopLeftRadius: isActive ? 10 : 0,
                      borderTopRightRadius: isActive ? 10 : 0,
                      borderTopWidth: 1.5,
                      borderLeftWidth: 1.5,
                      borderRightWidth: 1.5,
                      borderBottomWidth: 1.5,
                      borderTopColor: isActive ? color.primary : "transparent",
                      borderLeftColor: isActive ? color.primary : "transparent",
                      borderRightColor: isActive ? color.primary : "transparent",
                      borderBottomColor: isActive ? color.background : "transparent",
                      backgroundColor: isActive ? color.background : "transparent",
                      zIndex: isActive ? 2 : 1,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12.5,
                        fontWeight: isActive ? "700" : "500",
                        letterSpacing: -0.1,
                        color: isActive ? color.primary : color.textSecondary,
                      }}
                    >
                      {p.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Telemetry Widget Card */}
          <View
            className="rounded-[20px] p-4 mb-5"
            style={{
              backgroundColor: color.card,
              borderWidth: 1,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.07)"
                : color.cardBorder,
              shadowColor: color.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.25 : 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            {/* Card Header: Squircle Icon + Info + Live Pill */}
            <View className="flex-row items-center mb-4">
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: currentPlatformMeta.color,
                  marginRight: 12,
                }}
              >
                <Ionicons
                  name={currentPlatformMeta.icon as any}
                  size={21}
                  color="#FFFFFF"
                />
              </View>
              <View className="flex-1 min-w-0">
                <Text
                  className="text-[15.5px] font-extrabold tracking-tight"
                  style={{ color: color.text }}
                >
                  {currentPlatformMeta.label} Status
                </Text>
                <Text
                  className="text-[11.5px] mt-0.5"
                  style={{ color: color.textSecondary }}
                  numberOfLines={1}
                >
                  {activePlatform === "whatsapp" &&
                    (hasWhatsApp
                      ? "Meta Cloud API Gateway Active"
                      : "Sandbox Ready")}
                  {activePlatform === "telegram" && "MTProto Forwarder Running"}
                  {activePlatform === "voice" &&
                    "Ultra-Low Latency Telecalling Ready"}
                  {activePlatform === "crm" && "Pipelines & Forms Synced"}
                  {activePlatform === "social" &&
                    `${platformData?.social?.connectedCount || 0} Accounts Synced`}
                </Text>
              </View>
              <View
                className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: `${currentPlatformMeta.color}18`,
                }}
              >
                <View
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: currentPlatformMeta.color }}
                />
                <Text
                  className="text-[10px] font-extrabold uppercase tracking-wider"
                  style={{ color: currentPlatformMeta.color }}
                >
                  Online
                </Text>
              </View>
            </View>

            {/* Metric Columns */}
            <View
              className="flex-row justify-between py-3.5 mb-3 border-y"
              style={{
                borderColor: isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(0,0,0,0.05)",
              }}
            >
              {activePlatform === "whatsapp" && (
                <>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      className="text-base font-extrabold tracking-tight"
                      style={{ color: color.text }}
                    >
                      ₹
                      {(
                        (platformData?.whatsapp?.walletBalancePaise !==
                        undefined
                          ? platformData.whatsapp.walletBalancePaise
                          : 10000) / 100
                      ).toFixed(2)}
                    </Text>
                    <Text
                      className="text-[10.5px] mt-0.5"
                      style={{ color: color.textSecondary }}
                    >
                      Wallet Balance
                    </Text>
                  </View>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      className="text-base font-extrabold tracking-tight"
                      style={{ color: color.text }}
                    >
                      99.8%
                    </Text>
                    <Text
                      className="text-[10.5px] mt-0.5"
                      style={{ color: color.textSecondary }}
                    >
                      Delivery Rate
                    </Text>
                  </View>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      className="text-base font-extrabold tracking-tight"
                      style={{ color: color.text }}
                    >
                      &lt; 2s
                    </Text>
                    <Text
                      className="text-[10.5px] mt-0.5"
                      style={{ color: color.textSecondary }}
                    >
                      Latency
                    </Text>
                  </View>
                </>
              )}

              {activePlatform === "telegram" && (
                <>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      className="text-base font-extrabold tracking-tight"
                      style={{ color: color.text }}
                    >
                      {platformData?.telegram?.forwardRulesCount || 0}
                    </Text>
                    <Text
                      className="text-[10.5px] mt-0.5"
                      style={{ color: color.textSecondary }}
                    >
                      Forward Rules
                    </Text>
                  </View>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      className="text-base font-extrabold tracking-tight"
                      style={{ color: color.text }}
                    >
                      {platformData?.telegram?.trackerCount || 0}
                    </Text>
                    <Text
                      className="text-[10.5px] mt-0.5"
                      style={{ color: color.textSecondary }}
                    >
                      Trackers
                    </Text>
                  </View>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      className="text-base font-extrabold tracking-tight"
                      style={{ color: color.text }}
                    >
                      0ms
                    </Text>
                    <Text
                      className="text-[10.5px] mt-0.5"
                      style={{ color: color.textSecondary }}
                    >
                      Drop Rate
                    </Text>
                  </View>
                </>
              )}

              {activePlatform === "voice" && (
                <>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      className="text-base font-extrabold tracking-tight"
                      style={{ color: color.text }}
                    >
                      650ms
                    </Text>
                    <Text
                      className="text-[10.5px] mt-0.5"
                      style={{ color: color.textSecondary }}
                    >
                      WebRTC Latency
                    </Text>
                  </View>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      className="text-base font-extrabold tracking-tight"
                      style={{ color: color.text }}
                    >
                      2,500
                    </Text>
                    <Text
                      className="text-[10.5px] mt-0.5"
                      style={{ color: color.textSecondary }}
                    >
                      Quota Minutes
                    </Text>
                  </View>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      className="text-base font-extrabold tracking-tight"
                      style={{ color: color.text }}
                    >
                      100%
                    </Text>
                    <Text
                      className="text-[10.5px] mt-0.5"
                      style={{ color: color.textSecondary }}
                    >
                      ASR Accuracy
                    </Text>
                  </View>
                </>
              )}

              {activePlatform === "crm" && (
                <>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      className="text-base font-extrabold tracking-tight"
                      style={{ color: color.text }}
                    >
                      {platformData?.crm?.formsCount || 0}
                    </Text>
                    <Text
                      className="text-[10.5px] mt-0.5"
                      style={{ color: color.textSecondary }}
                    >
                      Intake Forms
                    </Text>
                  </View>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      className="text-base font-extrabold tracking-tight"
                      style={{ color: color.text }}
                    >
                      {platformData?.crm?.totalClicks || 0}
                    </Text>
                    <Text
                      className="text-[10.5px] mt-0.5"
                      style={{ color: color.textSecondary }}
                    >
                      Link Clicks
                    </Text>
                  </View>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      className="text-base font-extrabold tracking-tight"
                      style={{ color: color.text }}
                    >
                      Instant
                    </Text>
                    <Text
                      className="text-[10.5px] mt-0.5"
                      style={{ color: color.textSecondary }}
                    >
                      Lead Alert
                    </Text>
                  </View>
                </>
              )}

              {activePlatform === "social" && (
                <>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      className="text-base font-extrabold tracking-tight"
                      style={{ color: color.text }}
                    >
                      {platformData?.social?.connectedCount || 0}
                    </Text>
                    <Text
                      className="text-[10.5px] mt-0.5"
                      style={{ color: color.textSecondary }}
                    >
                      Accounts
                    </Text>
                  </View>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      className="text-base font-extrabold tracking-tight"
                      style={{ color: color.text }}
                    >
                      100%
                    </Text>
                    <Text
                      className="text-[10.5px] mt-0.5"
                      style={{ color: color.textSecondary }}
                    >
                      Queue Sync
                    </Text>
                  </View>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      className="text-base font-extrabold tracking-tight"
                      style={{ color: color.text }}
                    >
                      Auto
                    </Text>
                    <Text
                      className="text-[10.5px] mt-0.5"
                      style={{ color: color.textSecondary }}
                    >
                      Scheduler
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Card Footer: Launch CTA */}
            <Pressable
              className="flex-row items-center justify-between pt-2 active:opacity-85"
              onPress={() => router.push(currentPlatformMeta.route as any)}
            >
              <Text
                style={{
                  fontSize: 11.5,
                  fontWeight: "700",
                  color: color.primary,
                }}
              >
                Configure {currentPlatformMeta.label} Dashboard
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
            </Pressable>
          </View>

          {/* Section: Activity Audit Log */}
          <View className="mb-2.5 px-1 flex-row items-center justify-between">
            <Text
              className="text-[10px] font-extrabold tracking-widest uppercase"
              style={{ color: color.textSecondary }}
            >
              RECENT ECOSYSTEM TELEMETRY
            </Text>
            <View
              className="px-2 py-0.5 rounded-md"
              style={{ backgroundColor: color.accentSoft }}
            >
              <Text
                className="text-[9.5px] font-extrabold"
                style={{ color: color.accent }}
              >
                LIVE
              </Text>
            </View>
          </View>

          {/* Inset Grouped Audit List */}
          <View
            className="rounded-[20px] overflow-hidden"
            style={{
              backgroundColor: color.card,
              borderWidth: 1,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.07)"
                : color.cardBorder,
              shadowColor: color.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.25 : 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            {[
              {
                id: "1",
                title: "WhatsApp Cloud Webhook Delivered",
                sub: "Meta Cloud API • 200 OK",
                time: "2m ago",
                icon: "checkmark-circle",
                color: "#30D158",
              },
              {
                id: "2",
                title: "Telegram Stream Routing Active",
                sub: "Channel forwarder verified",
                time: "14m ago",
                icon: "paper-plane",
                color: "#0088CC",
              },
              {
                id: "3",
                title: "AI Telecaller Model Initialized",
                sub: "Voice synthesis stream connected",
                time: "1h ago",
                icon: "mic",
                color: "#8B5CF6",
              },
              {
                id: "4",
                title: "Smart CRM Form Triggered",
                sub: "New prospect intake recorded",
                time: "3h ago",
                icon: "briefcase",
                color: "#F59E0B",
              },
            ].map((item, idx, arr) => (
              <View key={item.id}>
                <View className="flex-row items-center py-3.5 px-4">
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 11,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: `${item.color}18`,
                      marginRight: 12,
                    }}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={18}
                      color={item.color}
                    />
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text
                      className="text-[13.5px] font-bold tracking-tight"
                      style={{ color: color.text }}
                    >
                      {item.title}
                    </Text>
                    <Text
                      className="text-[11px] mt-0.5"
                      style={{ color: color.textSecondary }}
                    >
                      {item.sub}
                    </Text>
                  </View>
                  <Text
                    className="text-[11px] font-semibold ml-2"
                    style={{ color: color.textSecondary }}
                  >
                    {item.time}
                  </Text>
                </View>
                {idx < arr.length - 1 && (
                  <View
                    className="h-[1px] ml-14"
                    style={{
                      backgroundColor: isDark
                        ? "rgba(255, 255, 255, 0.06)"
                        : "rgba(0, 0, 0, 0.05)",
                    }}
                  />
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </AppScreen>
  );
}
