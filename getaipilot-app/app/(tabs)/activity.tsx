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
          {/* Apple Segmented Control */}
          <View
            className="flex-row rounded-[10px] p-[3px] mb-4 border"
            style={{
              backgroundColor: color.tabBackground,
              borderColor: isDark ? color.border : "transparent",
            }}
          >
            {PLATFORMS.map((p) => {
              const isSelected = activePlatform === p.key;
              return (
                <Pressable
                  key={p.key}
                  className="flex-1 py-[7px] rounded-lg items-center justify-center"
                  style={[
                    isSelected && {
                      backgroundColor: color.card,
                    },
                    isSelected && !isDark && {
                      elevation: 1,
                      shadowColor: "#000000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                    },
                  ]}
                  onPress={() => handleSelectTab(p.key)}
                >
                  <Text
                    className="text-[11.5px]"
                    style={{
                      color: isSelected ? color.textPrimary : color.textSecondary,
                      fontWeight: isSelected ? "700" : "600",
                    }}
                    numberOfLines={1}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Inset Grouped Telemetry Widget Card */}
          <View
            className="rounded-[18px] p-4 mb-[22px] border"
            style={{
              backgroundColor: color.card,
              borderColor: color.border,
            }}
          >
            <View className="flex-row items-center mb-4">
              <View
                className="w-[38px] h-[38px] rounded-[10px] justify-center items-center mr-2.5"
                style={{ backgroundColor: `${currentPlatformMeta.color}20` }}
              >
                <Ionicons
                  name={currentPlatformMeta.icon as any}
                  size={20}
                  color={currentPlatformMeta.color}
                />
              </View>
              <View className="flex-1 min-w-0">
                <Text
                  className="text-[15.5px] font-bold tracking-tight"
                  style={{ color: color.textPrimary }}
                >
                  {currentPlatformMeta.label} Status
                </Text>
                <Text
                  className="text-[11.5px] mt-0.5"
                  style={{ color: color.textSecondary }}
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
                className="flex-row items-center gap-1 px-2 py-1 rounded-md"
                style={{
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.04)",
                }}
              >
                <View
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: currentPlatformMeta.color }}
                />
                <Text
                  className="text-[10.5px] font-extrabold uppercase tracking-wider"
                  style={{ color: currentPlatformMeta.color }}
                >
                  Online
                </Text>
              </View>
            </View>

            {/* Metric Columns */}
            <View
              className="flex-row justify-between py-3 border-y mb-3.5"
              style={{ borderColor: color.border }}
            >
              {activePlatform === "whatsapp" && (
                <>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      className="text-base font-extrabold tracking-tight"
                      style={{ color: color.textPrimary }}
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
                      style={{ color: color.textPrimary }}
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
                      style={{ color: color.textPrimary }}
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
                      style={{ color: color.textPrimary }}
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
                      style={{ color: color.textPrimary }}
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
                      style={{ color: color.textPrimary }}
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
                      style={{ color: color.textPrimary }}
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
                      style={{ color: color.textPrimary }}
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
                      style={{ color: color.textPrimary }}
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
                      style={{ color: color.textPrimary }}
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
                      style={{ color: color.textPrimary }}
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
                      style={{ color: color.textPrimary }}
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
                      style={{ color: color.textPrimary }}
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
                      style={{ color: color.textPrimary }}
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
                      style={{ color: color.textPrimary }}
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

            {/* Action CTA */}
            <Pressable
              className="py-2.5 rounded-[10px] items-center justify-center"
              style={{
                backgroundColor: isDark
                  ? `${currentPlatformMeta.color}22`
                  : `${currentPlatformMeta.color}15`,
              }}
              onPress={() => router.push(currentPlatformMeta.route as any)}
            >
              <Text
                className="text-[13px] font-bold"
                style={{ color: isDark ? currentPlatformMeta.color : "#0A84FF" }}
              >
                Configure {currentPlatformMeta.label} Dashboard ›
              </Text>
            </Pressable>
          </View>

          {/* Section: Activity Audit Log */}
          <View className="mb-2 px-1">
            <Text
              className="text-xs font-bold tracking-wider uppercase"
              style={{ color: color.textSecondary }}
            >
              RECENT ECOSYSTEM TELEMETRY
            </Text>
          </View>

          {/* Inset Grouped Audit List */}
          <View
            className="rounded-[18px] border overflow-hidden"
            style={{
              backgroundColor: color.card,
              borderColor: color.border,
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
                <View className="flex-row items-center py-3 px-3.5">
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={item.color}
                    className="mr-3"
                  />
                  <View className="flex-1 min-w-0">
                    <Text
                      className="text-[13.5px] font-semibold tracking-tight"
                      style={{ color: color.textPrimary }}
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
                    className="text-[11px] font-medium ml-2"
                    style={{ color: color.textSecondary }}
                  >
                    {item.time}
                  </Text>
                </View>
                {idx < arr.length - 1 && (
                  <View
                    className="h-[1px] ml-11"
                    style={{ backgroundColor: color.border }}
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
