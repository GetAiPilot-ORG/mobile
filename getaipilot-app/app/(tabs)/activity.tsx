import { getColors, useTheme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppScreen } from "../../src/components/AppScreen";
import { AppTopBar } from "../../src/components/AppTopBar";
import { ProductEmpty } from "../../src/components/ProductUI";
import { ActivityScreenSkeleton } from "../../src/components/skeletonScreen";
import { useAuth } from "../../src/contexts/AuthContext";
import { crmApi } from "../../src/features/crm/api/crm.api";
import { voiceApi } from "../../src/features/voice/api/voiceApi";
import { whatsappApi } from "../../src/features/whatsapp/api/whatsapp.api";
import { usePlatformSubscription } from "../../src/hooks/usePlatformSubscription";
import { supabase } from "../../src/lib/supabase";

export type WorkspaceKey = "all" | "whatsapp" | "telegram" | "voice" | "crm" | "social";

export interface ActivityFeedItem {
  id: string;
  platform: "whatsapp" | "telegram" | "voice" | "crm" | "social" | "system";
  title: string;
  sub: string;
  createdAt: string;
  timeAgo: string;
  statusType: "success" | "info" | "warning" | "error";
  statusText?: string;
  logo: any;
  color: string;
  route: string;
}

const PLATFORMS: {
  key: WorkspaceKey;
  label: string;
  icon: any;
  logoImage: any;
  route: string;
  color: string;
}[] = [
  {
    key: "all",
    label: "All Activity",
    icon: "pulse",
    logoImage: require("../../assets/images/network.png"),
    route: "/products",
    color: "#6366F1",
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    icon: "logo-whatsapp",
    logoImage: require("../../assets/images/products/whatsapp.png"),
    route: "/products/whatsapp",
    color: "#25D366",
  },
  {
    key: "telegram",
    label: "Telegram",
    icon: "paper-plane",
    logoImage: require("../../assets/images/products/telegram.png"),
    route: "/products/telegram",
    color: "#0088CC",
  },
  {
    key: "voice",
    label: "Voice AI",
    icon: "mic",
    logoImage: require("../../assets/images/products/voice.png"),
    route: "/products/voice",
    color: "#8B5CF6",
  },
  {
    key: "crm",
    label: "CRM",
    icon: "briefcase",
    logoImage: require("../../assets/images/products/crm.png"),
    route: "/products/crm",
    color: "#F59E0B",
  },
  {
    key: "social",
    label: "Social & Tools",
    icon: "share-social",
    logoImage: require("../../assets/images/products/social.png"),
    route: "/tools",
    color: "#E1306C",
  },
];

const CRM_SUPABASE_URL = "https://hhieilvvechtdhhfjomn.supabase.co/rest/v1";
const CRM_SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDYzNzEsImV4cCI6MjA4OTk4MjM3MX0.jrDgt81FFK5owy3OPIp9RlaaYJddlaZ87Iz2Uz8rXTE";

async function fetchCrmRest(table: string, query: string = ""): Promise<any[]> {
  try {
    const res = await fetch(`${CRM_SUPABASE_URL}/${table}?${query}`, {
      headers: {
        apikey: CRM_SUPABASE_KEY,
        authorization: `Bearer ${CRM_SUPABASE_KEY}`,
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function formatTimeAgo(dateString?: string | null): string {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (isNaN(diffMs)) return "Recently";
  if (diffMs < 0) return "Just now";

  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return "Just now";

  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ConnectedPlatformsPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const color = getColors(isDark);
  const { user } = useAuth();
  const { hasWhatsApp } = usePlatformSubscription();
  const [activePlatform, setActivePlatform] = useState<WorkspaceKey>("all");

  const {
    data: telemetry,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["connected-platforms-telemetry-v3", user?.id || "guest"],
    queryFn: async () => {
      let currentUserId = user?.id;
      let currentOrgId = user?.organizationId;

      if (!currentUserId) {
        try {
          const { data: authData } = await supabase.auth.getUser();
          currentUserId = authData.user?.id;
        } catch {}
      }

      if (currentUserId && !currentOrgId) {
        try {
          const { data: member } = await supabase
            .from("organization_members")
            .select("organization_id")
            .eq("user_id", currentUserId)
            .maybeSingle();
          currentOrgId = member?.organization_id;
        } catch {}
      }

      // Parallel fetch across Main Supabase, CRM Supabase REST, and BFF APIs
      const [
        profileRes,
        socialTokensRes,
        tgJoinRes,
        tgTrackRes,
        tgTradingRes,
        tgForwardRes,
        tgJoinLinksRes,
        quickFormsRes,
        shortLinksRes,
        bioTemplatesRes,
        landingTemplatesRes,
        waWalletRes,
        waLogsRes,
        notificationsRes,
        crmActivities,
        crmContacts,
        crmDeals,
        crmPayments,
        voiceCalls,
        voiceOverview,
        waBroadcasts,
        waStatus,
      ] = await Promise.all([
        currentUserId
          ? supabase.from("profiles").select("*").eq("id", currentUserId).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        currentUserId
          ? supabase.from("social_tokens").select("*").eq("user_id", currentUserId)
          : Promise.resolve({ data: [], error: null }),
        // Real Telegram Bot Joins
        supabase
          .from("tg_bot_join_users")
          .select("id, telegram_first_name, telegram_username, status, joined_channel, created_at")
          .order("created_at", { ascending: false })
          .limit(30),
        // Real Telegram Bot Trackers
        supabase
          .from("tg_tracker")
          .select("id, bot_name, bot_username, status, created_at")
          .order("created_at", { ascending: false })
          .limit(10),
        // Real Telegram SEBI Research Reports
        supabase
          .from("tg_trading_calls")
          .select("id, symbol, strike_price, direction, status, created_at")
          .order("created_at", { ascending: false })
          .limit(10),
        // Telegram Forward mappings
        supabase.from("tg_forward_mappings").select("id, status, updated_at", { count: "exact" }),
        // Telegram Invite Links
        supabase.from("tg_bot_join_links").select("id, name, created_at", { count: "exact" }),
        // Quick forms
        supabase.from("quick_forms").select("id, title, created_at").order("created_at", { ascending: false }).limit(10),
        // Short links
        supabase.from("short_links").select("id, title, short_slug, clicks, created_at").order("created_at", { ascending: false }).limit(10),
        // Bio templates
        supabase.from("free_template_submissions").select("id, page_title, slug, page_views, button_clicks, created_at").order("created_at", { ascending: false }).limit(10),
        // Landing templates
        supabase.from("landing_template_submissions").select("id, page_title, slug, page_views, button_clicks, created_at").order("created_at", { ascending: false }).limit(10),
        // WhatsApp Wallet
        currentOrgId
          ? supabase.from("whatsapp_wallets").select("*").eq("organization_id", currentOrgId).maybeSingle()
          : supabase.from("whatsapp_wallets").select("*").limit(1).maybeSingle(),
        // WhatsApp Logs
        supabase.from("whatsapp_message_usage_logs").select("*").order("created_at", { ascending: false }).limit(10),
        // System Notifications
        supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(10),
        // CRM Activities from CRM Supabase REST
        fetchCrmRest("crm_activities", "select=*&order=created_at.desc&limit=25"),
        // CRM Contacts
        fetchCrmRest("crm_contacts", "select=id,first_name,last_name,company,status,created_at&order=created_at.desc&limit=15"),
        // CRM Deals
        fetchCrmRest("crm_deals", "select=id,title,value,stage,created_at&order=created_at.desc&limit=15"),
        // CRM Payments
        fetchCrmRest("crm_payments", "select=id,amount,payment_method,status,payment_date,created_at&order=created_at.desc&limit=15"),
        // Voice Calls from Voice BFF
        voiceApi.getCalls({ limit: 15 }).catch(() => []),
        // Voice Overview
        voiceApi.getOverview().catch(() => null),
        // WhatsApp Broadcasts
        whatsappApi.getBroadcasts({ limit: 15 }).catch(() => ({ broadcasts: [], total_count: 0 })),
        // WhatsApp Status
        whatsappApi.getStatus().catch(() => null),
      ]);

      const profile = profileRes?.data || {};
      const socialTokens = socialTokensRes?.data || [];
      const shortLinks = shortLinksRes?.data || [];
      const totalClicks = shortLinks.reduce((sum: number, l: any) => sum + (l.clicks || 0), 0);

      const walletPaise =
        waWalletRes?.data?.balance_paise !== undefined
          ? Number(waWalletRes.data.balance_paise)
          : 10000;

      // Build unified, real-time activity items
      const rawActivities: ActivityFeedItem[] = [];

      // 1. Real Telegram Bot Joins
      (tgJoinRes?.data || []).forEach((item: any) => {
        const name = item.telegram_first_name || item.telegram_username || "Subscriber";
        const handle = item.telegram_username ? `@${item.telegram_username}` : "New Member";
        rawActivities.push({
          id: `tg_join_${item.id}`,
          platform: "telegram",
          title: `${name} joined via Bot Link`,
          sub: `${handle} • Channel access verified`,
          createdAt: item.created_at || new Date().toISOString(),
          timeAgo: formatTimeAgo(item.created_at),
          statusType: item.status === "active" ? "success" : "info",
          statusText: item.status === "active" ? "Joined" : "Verified",
          logo: require("../../assets/images/products/telegram.png"),
          color: "#0088CC",
          route: "/products/telegram",
        });
      });

      // 2. Real Telegram SEBI Research Trading Calls
      (tgTradingRes?.data || []).forEach((item: any) => {
        rawActivities.push({
          id: `tg_trade_${item.id}`,
          platform: "telegram",
          title: `Research Report: ${item.symbol || "Market Call"} (${item.direction || "BUY"})`,
          sub: `Strike: ${item.strike_price || "Spot"} • SEBI PDF generated`,
          createdAt: item.created_at || new Date().toISOString(),
          timeAgo: formatTimeAgo(item.created_at),
          statusType: "info",
          statusText: "Report",
          logo: require("../../assets/images/products/telegram.png"),
          color: "#0088CC",
          route: "/products/telegram",
        });
      });

      // 3. Real Telegram Trackers
      (tgTrackRes?.data || []).forEach((item: any) => {
        rawActivities.push({
          id: `tg_bot_${item.id}`,
          platform: "telegram",
          title: `Bot Active: @${item.bot_username || item.bot_name || "Telegram Bot"}`,
          sub: "Tracking & invite listener running",
          createdAt: item.created_at || new Date().toISOString(),
          timeAgo: formatTimeAgo(item.created_at),
          statusType: "success",
          statusText: "Online",
          logo: require("../../assets/images/products/telegram.png"),
          color: "#0088CC",
          route: "/products/telegram",
        });
      });

      // 4. Real CRM Activities (WhatsApp messages sent, template delivery failures, calls, meetings)
      (crmActivities || []).forEach((item: any) => {
        const isWa =
          item.subject?.toLowerCase().includes("whatsapp") ||
          item.description?.toLowerCase().includes("whatsapp");
        const isCall = item.type === "call" || item.subject?.toLowerCase().includes("call");
        const isFailed =
          item.subject?.toLowerCase().includes("failed") || item.status === "failed";

        rawActivities.push({
          id: `crm_act_${item.id}`,
          platform: isWa ? "whatsapp" : isCall ? "voice" : "crm",
          title: item.subject || item.title || "CRM Activity Logged",
          sub: item.description ? item.description.slice(0, 80) : "Activity record updated",
          createdAt: item.created_at || new Date().toISOString(),
          timeAgo: formatTimeAgo(item.created_at),
          statusType: isFailed ? "error" : "success",
          statusText: isFailed ? "Failed" : isWa ? "Delivered" : "Logged",
          logo: isWa
            ? require("../../assets/images/products/whatsapp.png")
            : isCall
            ? require("../../assets/images/products/voice.png")
            : require("../../assets/images/products/crm.png"),
          color: isWa ? "#25D366" : isCall ? "#8B5CF6" : "#F59E0B",
          route: isWa ? "/products/whatsapp" : isCall ? "/products/voice" : "/products/crm",
        });
      });

      // 5. Real CRM Contacts / Leads
      (crmContacts || []).forEach((item: any) => {
        const name = [item.first_name, item.last_name].filter(Boolean).join(" ") || "New Prospect";
        rawActivities.push({
          id: `crm_contact_${item.id}`,
          platform: "crm",
          title: `New Lead: ${name}`,
          sub: `${item.company ? item.company + " • " : ""}Status: ${item.status || "prospect"}`,
          createdAt: item.created_at || new Date().toISOString(),
          timeAgo: formatTimeAgo(item.created_at),
          statusType: "info",
          statusText: (item.status || "Lead").toUpperCase(),
          logo: require("../../assets/images/products/crm.png"),
          color: "#F59E0B",
          route: "/crm/contacts",
        });
      });

      // 6. Real CRM Deals
      (crmDeals || []).forEach((item: any) => {
        rawActivities.push({
          id: `crm_deal_${item.id}`,
          platform: "crm",
          title: `Deal: ${item.title || "Sales Opportunity"}`,
          sub: `Value: ₹${Number(item.value || 0).toLocaleString("en-IN")} • Stage: ${item.stage || "lead"}`,
          createdAt: item.created_at || new Date().toISOString(),
          timeAgo: formatTimeAgo(item.created_at),
          statusType: item.stage === "closed_won" ? "success" : "info",
          statusText: (item.stage || "Deal").toUpperCase(),
          logo: require("../../assets/images/products/crm.png"),
          color: "#F59E0B",
          route: "/crm/deals",
        });
      });

      // 7. Real CRM Payments
      (crmPayments || []).forEach((item: any) => {
        rawActivities.push({
          id: `crm_pay_${item.id}`,
          platform: "crm",
          title: `Payment: ₹${Number(item.amount || 0).toFixed(2)}`,
          sub: `${item.payment_method?.replace(/_/g, " ") || "Bank Transfer"} • ${item.status || "COMPLETED"}`,
          createdAt: item.created_at || item.payment_date || new Date().toISOString(),
          timeAgo: formatTimeAgo(item.created_at || item.payment_date),
          statusType: "success",
          statusText: "Paid",
          logo: require("../../assets/images/products/crm.png"),
          color: "#F59E0B",
          route: "/crm/payments",
        });
      });

      // 8. Real Voice Calls
      (Array.isArray(voiceCalls) ? voiceCalls : []).forEach((item: any) => {
        rawActivities.push({
          id: `voice_call_${item.id}`,
          platform: "voice",
          title: `Voice Call: ${item.customerNumber || item.callerName || "Customer"}`,
          sub: `${item.assistant ? item.assistant + " • " : ""}Duration: ${item.duration || "0s"}`,
          createdAt: item.createdAt || item.time || new Date().toISOString(),
          timeAgo: formatTimeAgo(item.createdAt || item.time),
          statusType:
            item.status === "completed"
              ? "success"
              : item.status === "failed"
              ? "error"
              : "warning",
          statusText: (item.status || "CALL").toUpperCase(),
          logo: require("../../assets/images/products/voice.png"),
          color: "#8B5CF6",
          route: "/products/voice",
        });
      });

      // 9. Real WhatsApp Broadcasts
      const waBroadcastList = Array.isArray(waBroadcasts?.broadcasts)
        ? waBroadcasts.broadcasts
        : Array.isArray(waBroadcasts)
        ? waBroadcasts
        : [];
      waBroadcastList.forEach((item: any) => {
        rawActivities.push({
          id: `wa_broadcast_${item.id}`,
          platform: "whatsapp",
          title: `Broadcast: ${item.name || item.template_name}`,
          sub: `Template: ${item.template_language || "en"} • Delivered: ${item.delivered_count || 0}/${item.sent_count || 0}`,
          createdAt: item.created_at || new Date().toISOString(),
          timeAgo: formatTimeAgo(item.created_at),
          statusType:
            item.status === "completed"
              ? "success"
              : item.status === "failed"
              ? "error"
              : "info",
          statusText: (item.status || "SENT").toUpperCase(),
          logo: require("../../assets/images/products/whatsapp.png"),
          color: "#25D366",
          route: "/products/whatsapp",
        });
      });

      // 10. Real Growth Tools: Short Links, Quick Forms, Landing Pages
      (shortLinksRes?.data || []).forEach((item: any) => {
        rawActivities.push({
          id: `link_${item.id}`,
          platform: "social",
          title: `Smart Link: /${item.short_slug}`,
          sub: `${item.title ? item.title.slice(0, 45) + " • " : ""}${item.clicks || 0} total clicks`,
          createdAt: item.created_at || new Date().toISOString(),
          timeAgo: formatTimeAgo(item.created_at),
          statusType: "info",
          statusText: `${item.clicks || 0} Clicks`,
          logo: require("../../assets/images/products/social.png"),
          color: "#E1306C",
          route: "/tools/link-shortener",
        });
      });

      (quickFormsRes?.data || []).forEach((item: any) => {
        rawActivities.push({
          id: `form_${item.id}`,
          platform: "social",
          title: `Intake Form: ${item.title || "Feedback Form"}`,
          sub: "Form synced & active for new responses",
          createdAt: item.created_at || new Date().toISOString(),
          timeAgo: formatTimeAgo(item.created_at),
          statusType: "success",
          statusText: "Active",
          logo: require("../../assets/images/products/social.png"),
          color: "#E1306C",
          route: "/tools/quick-forms",
        });
      });

      (landingTemplatesRes?.data || []).forEach((item: any) => {
        rawActivities.push({
          id: `landing_${item.id}`,
          platform: "social",
          title: `Landing Page: ${item.page_title || item.slug || "Published Funnel"}`,
          sub: `/${item.slug} • ${item.page_views || 0} views • ${item.button_clicks || 0} clicks`,
          createdAt: item.created_at || new Date().toISOString(),
          timeAgo: formatTimeAgo(item.created_at),
          statusType: "success",
          statusText: "Live",
          logo: require("../../assets/images/products/social.png"),
          color: "#E1306C",
          route: "/tools/my-designs",
        });
      });

      // 11. Real Notifications
      (notificationsRes?.data || []).forEach((item: any) => {
        rawActivities.push({
          id: `notif_${item.id}`,
          platform: "system",
          title: item.title || "Ecosystem Alert",
          sub: item.description ? item.description.slice(0, 80) : "System notification",
          createdAt: item.created_at || new Date().toISOString(),
          timeAgo: formatTimeAgo(item.created_at),
          statusType: "info",
          statusText: "Alert",
          logo: require("../../assets/images/network.png"),
          color: "#6366F1",
          route: "/notifications",
        });
      });

      // Deduplicate and sort newest first
      const seen = new Set<string>();
      const sortedActivities: ActivityFeedItem[] = [];
      rawActivities.forEach((act) => {
        if (!seen.has(act.id)) {
          seen.add(act.id);
          sortedActivities.push(act);
        }
      });
      sortedActivities.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const totalPages =
        (bioTemplatesRes?.data?.length || 0) + (landingTemplatesRes?.data?.length || 0);

      const waEventsCount =
        rawActivities.filter((a) => a.platform === "whatsapp").length +
        (waLogsRes?.data?.length || 0);

      const voiceTotalCalls =
        voiceOverview?.totalCalls !== undefined
          ? voiceOverview.totalCalls
          : Array.isArray(voiceCalls)
          ? voiceCalls.length
          : 0;

      const voiceAssistantsCount = voiceOverview?.totalAssistants || 0;
      const voiceCreditsDisplay = voiceOverview?.creditBalanceDisplay || "₹0.00";

      return {
        profile,
        activities: sortedActivities,
        social: {
          connectedCount: socialTokens.length,
          pagesCount: totalPages,
        },
        whatsapp: {
          wabaPhone: profile.whatsapp_number || waStatus?.phone_number || "Meta Cloud API",
          walletBalancePaise: walletPaise,
          eventsCount: waEventsCount,
          qualityRating: waStatus?.quality_rating || "Green",
          statusText: waStatus?.status || "Connected",
        },
        telegram: {
          joinLinksCount: tgJoinLinksRes?.count || 0,
          trackerCount: tgTrackRes?.data?.length || 0,
          forwardRulesCount: tgForwardRes?.count || 0,
          joinsCount: tgJoinRes?.data?.length || 0,
        },
        voice: {
          totalCalls: voiceTotalCalls,
          totalAssistants: voiceAssistantsCount,
          creditBalanceDisplay: voiceCreditsDisplay,
        },
        crm: {
          contactsCount: crmContacts?.length || 0,
          dealsCount: crmDeals?.length || 0,
          paymentsCount: crmPayments?.length || 0,
          activitiesCount: crmActivities?.length || 0,
          formsCount: quickFormsRes?.data?.length || 0,
          shortLinksCount: shortLinks.length,
          totalClicks,
        },
      };
    },
  });

  const handleSelectTab = (key: WorkspaceKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActivePlatform(key);
  };

  const handleActivityPress = (item: ActivityFeedItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (item.route) {
      router.push(item.route as any);
    }
  };

  const currentPlatformMeta =
    PLATFORMS.find((p) => p.key === activePlatform) || PLATFORMS[0];

  const filteredActivities = useMemo(() => {
    if (!telemetry?.activities) return [];
    if (activePlatform === "all") return telemetry.activities;
    return telemetry.activities.filter((item) => item.platform === activePlatform);
  }, [telemetry?.activities, activePlatform]);

  return (
    <AppScreen safeArea={false} backgroundColor={color.background}>
      <AppTopBar title="Activity" showBack={false} showPlanBadge={true} />

      {isLoading && !telemetry ? (
        <ActivityScreenSkeleton />
      ) : (
        <ScrollView
          className="flex-1"
          style={{ backgroundColor: color.background }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: 130,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={isDark ? "#FFFFFF" : "#0A84FF"}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ marginBottom: 20, gap: 6 }}>
            <Text
              style={{
                fontSize: 30,
                lineHeight: 38,
                fontWeight: "600",
                letterSpacing: -0.6,
                color: color.text,
              }}
            >
              Your activity
            </Text>
            <Text style={{ fontSize: 14, color: color.textSecondary }}>
              Real-time audit telemetry across your connected workspace apps.
            </Text>
          </View>

          {/* Platform Tabs (Folder Style Pill) */}
          <View style={{ position: "relative", marginBottom: 18 }}>
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
                      height: 42,
                      paddingHorizontal: 16,
                      justifyContent: "center",
                      alignItems: "center",
                      borderRadius: 21,
                      marginRight: 8,
                      backgroundColor: isActive ? color.accentSoft : color.card,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: isActive
                        ? color.accent
                        : isDark
                        ? "rgba(255, 255, 255, 0.08)"
                        : color.cardBorder,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: isActive ? "600" : "500",
                        letterSpacing: -0.1,
                        color: isActive ? color.accent : color.textSecondary,
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
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.08)"
                : color.cardBorder,
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
                  backgroundColor: `${currentPlatformMeta.color}15`,
                  marginRight: 12,
                  overflow: "hidden",
                }}
              >
                <Image
                  source={currentPlatformMeta.logoImage}
                  style={{ width: 32, height: 32, borderRadius: 8 }}
                  resizeMode="contain"
                />
              </View>
              <View className="flex-1 min-w-0">
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    letterSpacing: -0.2,
                    color: color.text,
                  }}
                >
                  {currentPlatformMeta.label === "All Activity"
                    ? "Ecosystem Overview"
                    : `${currentPlatformMeta.label} Status`}
                </Text>
                <Text
                  className="text-[11.5px] mt-0.5"
                  style={{ color: color.textSecondary }}
                  numberOfLines={1}
                >
                  {activePlatform === "all" &&
                    `${telemetry?.activities?.length || 0} live telemetry events recorded`}
                  {activePlatform === "whatsapp" &&
                    (hasWhatsApp
                      ? "Meta Cloud API Gateway Active"
                      : "Meta Cloud API Connected")}
                  {activePlatform === "telegram" && "MTProto Forwarder & Bot Engine Running"}
                  {activePlatform === "voice" && "Autonomous Voice AI Network Ready"}
                  {activePlatform === "crm" && "Leads, Deals & Follow-ups Synced"}
                  {activePlatform === "social" &&
                    `${telemetry?.social?.connectedCount || 0} Accounts • Web Funnels Active`}
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
                  style={{
                    fontSize: 10,
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    color: currentPlatformMeta.color,
                  }}
                >
                  Online
                </Text>
              </View>
            </View>

            {/* Dynamic Metric Columns */}
            <View
              className="flex-row justify-between py-3.5 mb-3 border-y"
              style={{
                borderColor: isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(0,0,0,0.05)",
              }}
            >
              {activePlatform === "all" && (
                <>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        letterSpacing: -0.2,
                        color: color.text,
                      }}
                    >
                      {telemetry?.activities?.length || 0}
                    </Text>
                    <Text
                      style={{ fontSize: 11, marginTop: 2, color: color.textSecondary }}
                    >
                      Total Events
                    </Text>
                  </View>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        letterSpacing: -0.2,
                        color: color.text,
                      }}
                    >
                      5 Active
                    </Text>
                    <Text
                      style={{ fontSize: 11, marginTop: 2, color: color.textSecondary }}
                    >
                      Channels
                    </Text>
                  </View>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        letterSpacing: -0.2,
                        color: color.text,
                      }}
                    >
                      Real-time
                    </Text>
                    <Text
                      style={{ fontSize: 11, marginTop: 2, color: color.textSecondary }}
                    >
                      Sync Mode
                    </Text>
                  </View>
                </>
              )}

              {activePlatform === "whatsapp" && (
                <>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        letterSpacing: -0.2,
                        color: color.text,
                      }}
                    >
                      ₹{((telemetry?.whatsapp?.walletBalancePaise ?? 0) / 100).toFixed(2)}
                    </Text>
                    <Text
                      style={{ fontSize: 11, marginTop: 2, color: color.textSecondary }}
                    >
                      Wallet Balance
                    </Text>
                  </View>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        letterSpacing: -0.2,
                        color: color.text,
                      }}
                    >
                      {telemetry?.whatsapp?.eventsCount || 0}
                    </Text>
                    <Text
                      style={{ fontSize: 11, marginTop: 2, color: color.textSecondary }}
                    >
                      Recent Logs
                    </Text>
                  </View>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        letterSpacing: -0.2,
                        color: color.text,
                      }}
                    >
                      {telemetry?.whatsapp?.qualityRating || "Green"}
                    </Text>
                    <Text
                      style={{ fontSize: 11, marginTop: 2, color: color.textSecondary }}
                    >
                      Health Rating
                    </Text>
                  </View>
                </>
              )}

              {activePlatform === "telegram" && (
                <>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        letterSpacing: -0.2,
                        color: color.text,
                      }}
                    >
                      {telemetry?.telegram?.forwardRulesCount || 0}
                    </Text>
                    <Text
                      style={{ fontSize: 11, marginTop: 2, color: color.textSecondary }}
                    >
                      Forward Rules
                    </Text>
                  </View>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        letterSpacing: -0.2,
                        color: color.text,
                      }}
                    >
                      {telemetry?.telegram?.trackerCount || 0}
                    </Text>
                    <Text
                      style={{ fontSize: 11, marginTop: 2, color: color.textSecondary }}
                    >
                      Active Bots
                    </Text>
                  </View>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        letterSpacing: -0.2,
                        color: color.text,
                      }}
                    >
                      {telemetry?.telegram?.joinLinksCount || 0}
                    </Text>
                    <Text
                      style={{ fontSize: 11, marginTop: 2, color: color.textSecondary }}
                    >
                      Invite Links
                    </Text>
                  </View>
                </>
              )}

              {activePlatform === "voice" && (
                <>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        letterSpacing: -0.2,
                        color: color.text,
                      }}
                    >
                      {telemetry?.voice?.totalCalls || 0}
                    </Text>
                    <Text
                      style={{ fontSize: 11, marginTop: 2, color: color.textSecondary }}
                    >
                      Total Calls
                    </Text>
                  </View>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        letterSpacing: -0.2,
                        color: color.text,
                      }}
                    >
                      {telemetry?.voice?.totalAssistants || 0}
                    </Text>
                    <Text
                      style={{ fontSize: 11, marginTop: 2, color: color.textSecondary }}
                    >
                      AI Assistants
                    </Text>
                  </View>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        letterSpacing: -0.2,
                        color: color.text,
                      }}
                    >
                      {telemetry?.voice?.creditBalanceDisplay || "₹0.00"}
                    </Text>
                    <Text
                      style={{ fontSize: 11, marginTop: 2, color: color.textSecondary }}
                    >
                      Credit Balance
                    </Text>
                  </View>
                </>
              )}

              {activePlatform === "crm" && (
                <>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        letterSpacing: -0.2,
                        color: color.text,
                      }}
                    >
                      {telemetry?.crm?.contactsCount || 0}
                    </Text>
                    <Text
                      style={{ fontSize: 11, marginTop: 2, color: color.textSecondary }}
                    >
                      Contacts
                    </Text>
                  </View>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        letterSpacing: -0.2,
                        color: color.text,
                      }}
                    >
                      {telemetry?.crm?.dealsCount || 0}
                    </Text>
                    <Text
                      style={{ fontSize: 11, marginTop: 2, color: color.textSecondary }}
                    >
                      Deals
                    </Text>
                  </View>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        letterSpacing: -0.2,
                        color: color.text,
                      }}
                    >
                      {telemetry?.crm?.activitiesCount || 0}
                    </Text>
                    <Text
                      style={{ fontSize: 11, marginTop: 2, color: color.textSecondary }}
                    >
                      Activities
                    </Text>
                  </View>
                </>
              )}

              {activePlatform === "social" && (
                <>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        letterSpacing: -0.2,
                        color: color.text,
                      }}
                    >
                      {telemetry?.social?.pagesCount || 0}
                    </Text>
                    <Text
                      style={{ fontSize: 11, marginTop: 2, color: color.textSecondary }}
                    >
                      Live Pages
                    </Text>
                  </View>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        letterSpacing: -0.2,
                        color: color.text,
                      }}
                    >
                      {telemetry?.crm?.formsCount || 0}
                    </Text>
                    <Text
                      style={{ fontSize: 11, marginTop: 2, color: color.textSecondary }}
                    >
                      Intake Forms
                    </Text>
                  </View>
                  <View className="flex-1 items-center min-w-0" style={{ flexBasis: 0 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        letterSpacing: -0.2,
                        color: color.text,
                      }}
                    >
                      {telemetry?.crm?.totalClicks || 0}
                    </Text>
                    <Text
                      style={{ fontSize: 11, marginTop: 2, color: color.textSecondary }}
                    >
                      Link Clicks
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
                  fontSize: 12.5,
                  fontWeight: "600",
                  color: color.primary,
                }}
              >
                {activePlatform === "all"
                  ? "Explore Ecosystem Integrations"
                  : `Open ${currentPlatformMeta.label} Dashboard`}
              </Text>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: color.primaryMuted,
                }}
              >
                <Ionicons name="arrow-forward" size={12} color={color.primary} />
              </View>
            </Pressable>
          </View>

          {/* Section: Activity Audit Log */}
          <View className="mb-3 px-1 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  color: color.textSecondary,
                }}
              >
                Recent Ecosystem Telemetry
              </Text>
              <View
                className="px-2 py-0.5 rounded-full"
                style={{ backgroundColor: color.accentSoft }}
              >
                <Text
                  style={{
                    fontSize: 10.5,
                    fontWeight: "600",
                    color: color.accent,
                  }}
                >
                  {filteredActivities.length}
                </Text>
              </View>
            </View>

            <View
              className="flex-row items-center gap-1.5 px-2 py-0.5 rounded-full"
              style={{ backgroundColor: isDark ? "rgba(34, 197, 94, 0.15)" : "#DCFCE7" }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "#16A34A",
                }}
              />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  color: "#16A34A",
                  letterSpacing: 0.4,
                }}
              >
                LIVE
              </Text>
            </View>
          </View>

          {/* Activity Feed List */}
          {filteredActivities.length === 0 ? (
            <ProductEmpty
              title={`No ${currentPlatformMeta.label} Activity Yet`}
              description={`Live triggers, broadcasts, calls, and updates for ${currentPlatformMeta.label} will be tracked here.`}
              action={`Open ${currentPlatformMeta.label}`}
              onAction={() => router.push(currentPlatformMeta.route as any)}
            />
          ) : (
            <View
              className="rounded-[20px] overflow-hidden"
              style={{
                backgroundColor: color.card,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : color.cardBorder,
              }}
            >
              {filteredActivities.map((item, idx, arr) => (
                <View key={item.id}>
                  <Pressable
                    onPress={() => handleActivityPress(item)}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.75 : 1,
                      backgroundColor: pressed
                        ? isDark
                          ? "rgba(255, 255, 255, 0.04)"
                          : "rgba(0, 0, 0, 0.02)"
                        : "transparent",
                    })}
                  >
                    <View className="flex-row items-center py-3.5 px-4">
                      {/* Product Squircle Logo */}
                      <View
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 12,
                          justifyContent: "center",
                          alignItems: "center",
                          backgroundColor: `${item.color}15`,
                          marginRight: 12,
                          overflow: "hidden",
                        }}
                      >
                        <Image
                          source={item.logo}
                          style={{ width: 26, height: 26, borderRadius: 7 }}
                          resizeMode="contain"
                        />
                      </View>

                      {/* Content */}
                      <View className="flex-1 min-w-0 pr-2">
                        <View className="flex-row items-center gap-1.5 mb-0.5">
                          <Text
                            numberOfLines={1}
                            style={{
                              fontSize: 13.5,
                              fontWeight: "600",
                              letterSpacing: -0.15,
                              color: color.text,
                              flexShrink: 1,
                            }}
                          >
                            {item.title}
                          </Text>
                          {Boolean(item.statusText) && (
                            <View
                              style={{
                                paddingHorizontal: 6,
                                paddingVertical: 1.5,
                                borderRadius: 6,
                                backgroundColor:
                                  item.statusType === "error"
                                    ? isDark
                                      ? "rgba(239, 68, 68, 0.2)"
                                      : "#FEE2E2"
                                    : item.statusType === "success"
                                    ? isDark
                                      ? "rgba(34, 197, 94, 0.2)"
                                      : "#DCFCE7"
                                    : isDark
                                    ? "rgba(99, 102, 241, 0.2)"
                                    : "#EEF2FF",
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 9.5,
                                  fontWeight: "700",
                                  letterSpacing: 0.3,
                                  color:
                                    item.statusType === "error"
                                      ? "#EF4444"
                                      : item.statusType === "success"
                                      ? "#16A34A"
                                      : "#6366F1",
                                }}
                              >
                                {item.statusText}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text
                          numberOfLines={1}
                          style={{
                            fontSize: 11.5,
                            lineHeight: 16,
                            color: color.textSecondary,
                          }}
                        >
                          {item.sub}
                        </Text>
                      </View>

                      {/* Relative Time & Arrow */}
                      <View className="items-end pl-1">
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "400",
                            color: color.textSecondary,
                            marginBottom: 2,
                          }}
                        >
                          {item.timeAgo}
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={12}
                          color={color.iconSecondary || color.textSecondary}
                        />
                      </View>
                    </View>
                  </Pressable>

                  {idx < arr.length - 1 && (
                    <View
                      className="h-[1px] ml-16"
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
          )}
        </ScrollView>
      )}
    </AppScreen>
  );
}
