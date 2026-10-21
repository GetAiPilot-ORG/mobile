/**
 * TelegramScreen.tsx  ← SHELL ONLY
 * All business logic & JSX lives in the 9 individual service screens.
 * This file only handles: tab config, routing, shared data fetching, modals.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, getColors } from "../../../theme";

import { AppScreen } from "../../../components/AppScreen";
import { AppTopBar } from "../../../components/AppTopBar";
import {
  ProductFloatingBottomBar,
  ProductTabItem,
} from "../../../components/ProductFloatingBottomBar";
import { supabase } from "../../../lib/supabase";
import { telegramApi } from "../api/telegramApi";
import { telegramSupabase } from "../api/telegramSupabase";
import {
  AutoApproveModal,
  AutoforwardModal,
  BroadcastModal,
  ChatBotModal,
  ReactionsModal,
  ReportBotModal,
  SubManagerModal,
  TelegramLoginModal,
  TelegramConnectModal,
  TrackerModal,
} from "../components";
import { TelegramToolKey } from "../types";

// ── Individual service screens ───────────────────────────────────────────────
import { AutoApproveScreen } from "./AutoApproveScreen";
import { AutoForwardScreen } from "./AutoForwardScreen";
import { BroadcastScreen } from "./BroadcastScreen";
import { ChatBotScreen } from "./ChatBotScreen";
import { OverviewScreen } from "./OverviewScreen";
import { ReactionsScreen } from "./ReactionsScreen";
import { ReportBotScreen } from "./ReportBotScreen";
import { SubManagerScreen } from "./SubManagerScreen";
import { TrackerScreen } from "./TrackerScreen";

// ── Tab definitions ───────────────────────────────────────────────────────────
type TelegramTab =
  | "hub"
  | "automations"
  | "bots"
  | "sub_manager"
  | "report_bot"
  | "broadcast"
  | "auto_approve"
  | "chatbot"
  | "reactions";

const TELEGRAM_TABS: ProductTabItem[] = [
  {
    key: "hub",
    label: "Overview",
    activeIcon: "grid",
    inactiveIcon: "grid-outline",
    description: "Master KPI command center & all 8 tools",
  },
  {
    key: "automations",
    label: "Forward",
    activeIcon: "git-compare",
    inactiveIcon: "git-compare-outline",
    description: "Channel-to-channel message routing",
  },
  {
    key: "bots",
    label: "Tracker",
    activeIcon: "logo-android",
    inactiveIcon: "logo-android",
    description: "Channel join tracking & analytics",
  },
  {
    key: "sub_manager",
    label: "SubMgr",
    activeIcon: "card",
    inactiveIcon: "card-outline",
    description: "VIP subscription monetization",
  },
  {
    key: "report_bot",
    label: "Report",
    activeIcon: "document-text",
    inactiveIcon: "document-text-outline",
    description: "SEBI research PDF generator",
  },
  {
    key: "broadcast",
    label: "Broadcast",
    activeIcon: "megaphone",
    inactiveIcon: "megaphone-outline",
    description: "Mass message delivery",
  },
  {
    key: "auto_approve",
    label: "Approve",
    activeIcon: "checkmark-done-circle",
    inactiveIcon: "checkmark-done-circle-outline",
    description: "Auto-approval of join requests",
  },
  {
    key: "chatbot",
    label: "ChatBot",
    activeIcon: "chatbubbles",
    inactiveIcon: "chatbubbles-outline",
    description: "AI auto-replies & flows",
  },
  {
    key: "reactions",
    label: "Reactions",
    activeIcon: "sparkles",
    inactiveIcon: "sparkles-outline",
    description: "Automated emoji reactions",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export const TelegramScreen: React.FC = () => {
  const { isDark } = useTheme();
  const color = getColors(isDark);

  const [activeTab, setActiveTab] = useState<TelegramTab>("hub");
  const [activeModal, setActiveModal] = useState<TelegramToolKey | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const mainScrollRef = useRef<ScrollView>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  // Safe navigation back handler
  const handleBack = () => {
    if (activeModal) {
      setActiveModal(null);
      return true;
    }
    if (isLoginModalOpen) {
      setIsLoginModalOpen(false);
      return true;
    }
    if (activeTab !== "hub") {
      setActiveTab("hub");
      mainScrollRef.current?.scrollTo({ y: 0, animated: true });
      return true;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/products");
    }
    return true;
  };

  useEffect(() => {
    const onHardwareBack = () => {
      return handleBack();
    };
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onHardwareBack
    );
    return () => subscription.remove();
  }, [activeModal, isLoginModalOpen, activeTab]);

  // ── Shared data queries ─────────────────────────────────────────────────────
  const {
    data: allData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["telegram_all_data"],
    queryFn: telegramSupabase.getSummary,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const {
    data: sessionStatus,
    refetch: refetchSession,
  } = useQuery({
    queryKey: ["telegram_session_status"],
    queryFn: async () => {
      try {
        return await telegramApi.getSessionStatus();
      } catch {
        return null;
      }
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const summary = allData || {};
  const trackerBots = summary.trackerBots || [];
  const trackerLinks = summary.loadedLinks || [];
  const forwardRules = summary.loadedForwards || [];
  const rawSubPages = summary.loadedPages || [];
  const chats = summary.loadedMappings || [];
  const loadedPurchases = summary.loadedPurchases || [];
  const joins = summary.loadedJoins || [];

  // Memoized KPI metrics & dashboard object so 10,000+ items don't re-loop on every re-render
  const {
    todaysJoins,
    thisMonthJoins,
    pendingJoins,
    activeJoins,
    conversionRate,
    channelsList,
    trackerDash,
  } = useMemo(() => {
    const totalJoins = summary.totalJoinsCount ?? joins.length;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const tJoins = joins.filter(
      (j: any) => new Date(j.joined_at || j.created_at) >= today,
    ).length;
    const mJoins = joins.filter(
      (j: any) => new Date(j.joined_at || j.created_at) >= firstDayOfMonth,
    ).length;
    const pJoins = joins.filter(
      (j: any) =>
        j.status === "Pending" ||
        j.status === "Bot Start" ||
        (!j.joined_channel && !j.left_channel),
    ).length;
    const aJoins = summary.activeJoinsCount ?? joins.filter(
      (j: any) =>
        (j.joined_channel && !j.left_channel) ||
        j.status === "Active" ||
        j.status === "joined",
    ).length;
    const cRate =
      totalJoins > 0 ? Math.round((aJoins / totalJoins) * 100) : 0;

    const channelMap: Record<string, any> = {};
    joins.forEach((j: any) => {
      const cname = j.channel_name || "Tracked Channel";
      if (!channelMap[cname]) {
        channelMap[cname] = {
          channel_id: cname,
          channel_name: cname,
          joined: 0,
          period_joins: 0,
          left: 0,
          all_active: 0,
          links: [],
        };
      }
      if (j.left_channel || j.status === "Leave" || j.status === "leaved") {
        channelMap[cname].left++;
      } else if (
        j.joined_channel ||
        j.status === "Active" ||
        j.status === "joined"
      ) {
        channelMap[cname].all_active++;
        channelMap[cname].joined++;
      }
      if (
        new Date(j.joined_at || j.created_at) >=
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ) {
        channelMap[cname].period_joins++;
      }
    });

    const cList = Object.values(channelMap);

    const dash = {
      kpis: {
        totalJoins,
        todaysJoins: tJoins,
        thisMonthJoins: mJoins,
        botStarts: totalJoins,
        pendingJoins: pJoins,
        conversionRate: cRate,
      },
      period: {
        startDate: new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000,
        ).toLocaleDateString(),
        endDate: new Date().toLocaleDateString(),
        periodJoins: joins.filter(
          (j: any) =>
            new Date(j.joined_at || j.created_at) >=
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        ).length,
        totalTracked: totalJoins,
        allTimeActive: aJoins,
      },
      channels: cList,
      newUsers: joins.map((j: any) => ({
        ...j,
        name:
          j.name ||
          j.first_name ||
          j.telegram_first_name ||
          (j.telegram_username ? `@${j.telegram_username}` : "Telegram User"),
        time_ago:
          j.time_ago ||
          (j.joined_at ? new Date(j.joined_at).toLocaleDateString() : "Just now"),
        channel_name: j.channel_name || "Tracked Link",
        status:
          j.left_channel || j.status === "leaved"
            ? "Leave"
            : j.joined_channel || j.status === "joined"
              ? "Active"
              : j.status || "Active",
      })),
    };

    return {
      todaysJoins: tJoins,
      thisMonthJoins: mJoins,
      pendingJoins: pJoins,
      activeJoins: aJoins,
      conversionRate: cRate,
      channelsList: cList,
      trackerDash: dash,
    };
  }, [summary, joins]);
  const subPlans: any[] = [];

  // ── Mutations ───────────────────────────────────────────────────────────────
  const { mutateAsync: sendBroadcast, isPending: isBroadcasting } = useMutation(
    {
      mutationFn: telegramApi.sendBroadcast,
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: ["telegram_all_data"] }),
    },
  );

  // ── Computed data ───────────────────────────────────────────────────────────
  const botsList = trackerBots;

  const subManagerPages = rawSubPages.map((p: any) => ({
    id: p.id || p.slug || String(Math.random()),
    title:
      p.title || p.page_title || p.form_data?.channelTitle || "Untitled Page",
    slug: p.slug || "",
    url: p.url || `https://tg.getaipilot.in/p/${p.slug || ""}`,
    displayUrl: p.displayUrl || `getaipilot.in/p/${p.slug || ""}`,
    members: p.subscribers_count ?? p.memberCount ?? p.members ?? 0,
    statusText:
      p.is_active !== false && p.isActive !== false
        ? "Accepting Subscriptions"
        : "Paused",
    isActive: p.is_active !== false && p.isActive !== false,
  }));

  const realRevenue = summary.revenue || 0;
  const activeSubscribersCount = summary.activeSubscribers || 0;

  const TELESUB_STATS = {
    totalRevenue: realRevenue,
    activeSubscribers: activeSubscribersCount,
    subscriptionPages: subManagerPages.length,
    botAutomatedAccess: "Automated",
    grossSales: realRevenue,
    netCreatorShare: Math.round(realRevenue * 0.9 * 100) / 100,
    availableToWithdraw: Math.round(realRevenue * 0.9 * 100) / 100,
    rollingHold: Math.round(realRevenue * 0.1 * 100) / 100,
    successfulPaymentsCount: loadedPurchases.length,
    clearedBatchesCount: 0,
    connectedBank: {
      accountHolder: summary.loadedBrand?.analyst_name || "Connected Bank",
      status: "Active",
      details: "Direct Bank Settlement (IMPS)",
    },
    botStatus: {
      botUsername: summary.botUsername || "Gapsubmanagerbot",
      isOnline: true,
      verifiedChannels: chats.length,
    },
    linkedTelegram: { phone: summary?.telegramPhone || sessionStatus?.phone || "", isLinked: Boolean((sessionStatus?.connected && (sessionStatus?.user_id || sessionStatus?.phone)) || (typeof summary?.telegramUserId === "number" && summary.telegramUserId > 0) || Boolean(summary?.telegramPhone)) },
    monetizedChannels: chats,
    discoveredChannels: chats,
    transactions: loadedPurchases,
    pages: subManagerPages,
  };

  const isActuallyConnected = Boolean(
    (sessionStatus?.connected && (sessionStatus?.user_id || sessionStatus?.phone)) ||
    (typeof summary?.telegramUserId === "number" && summary.telegramUserId > 0) ||
    Boolean(summary?.telegramPhone)
  );

  const displayTelegramPhone =
    summary?.telegramPhone ||
    sessionStatus?.phone ||
    null;

  const displayTelegramUsername =
    sessionStatus?.username ||
    summary?.telegramUsername ||
    (displayTelegramPhone ? displayTelegramPhone : null);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleRefreshAll = async () => {
    await Promise.all([refetch(), refetchSession()]);
  };

  const handleTabChange = (key: string) => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(key as TelegramTab);
    mainScrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const openModal = (key: TelegramToolKey) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveModal(key);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <AppScreen safeArea={false} backgroundColor={color.background}>
      <AppTopBar
        title="Telegram"
        // subtitle="Bots, routing, monetization & automations"
        onBackPress={handleBack}
        rightElement={
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsLoginModalOpen(true);
            }}
            accessibilityRole="button"
            accessibilityLabel={isActuallyConnected ? "Telegram Connected" : "Connect Telegram"}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 20,
              backgroundColor: isActuallyConnected
                ? (isDark ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.1)")
                : (isDark ? "rgba(2,132,199,0.15)" : "rgba(2,132,199,0.1)"),
            }}
          >
            <Ionicons
              name={isActuallyConnected ? "checkmark-circle" : "paper-plane-outline"}
              size={14}
              color={isActuallyConnected ? "#10B981" : "#0284C7"}
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: isActuallyConnected ? "#10B981" : "#0284C7",
              }}
            >
              {isActuallyConnected
                ? (displayTelegramUsername ? `@${String(displayTelegramUsername).replace(/^@/, '')}` : "Connected")
                : "Connect"}
            </Text>
          </Pressable>
        }
      />

      <ScrollView
        ref={mainScrollRef}
        style={[styles.container, { backgroundColor: color.background }]}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefreshAll}
            tintColor="#0284C7"
          />
        }
      >
        {isLoading && !allData ? (
          <ActivityIndicator
            size="large"
            color="#0284C7"
            style={{ marginTop: 40 }}
          />
        ) : (
          <>
            {activeTab === "hub" && (
              <OverviewScreen
                summary={summary}
                realRevenue={realRevenue}
                deepLinksCount={trackerLinks.length}
                botsList={botsList}
                chats={chats || []}
                forwardRules={forwardRules || []}
                subManagerPages={subManagerPages}
                subPlans={subPlans || []}
                isRefetching={isRefetching}
                onRefresh={handleRefreshAll}
                onNavigate={handleTabChange}
                onOpenModal={openModal}
              />
            )}

            {activeTab === "automations" && (
              <AutoForwardScreen
                forwardRules={forwardRules || []}
                summary={summary}
                onOpenModal={openModal}
              />
            )}

            {activeTab === "bots" && (
              <TrackerScreen
                botsList={botsList}
                trackerDash={trackerDash}
                trackerLinks={trackerLinks || []}
                onOpenModal={openModal}
              />
            )}

            {activeTab === "sub_manager" && (
              <SubManagerScreen
                stats={TELESUB_STATS}
                onOpenModal={openModal}
                onRefresh={handleRefreshAll}
              />
            )}

            {activeTab === "report_bot" && (
              <ReportBotScreen summary={summary} onOpenModal={openModal} />
            )}

            {activeTab === "broadcast" && (
              <BroadcastScreen
                chats={chats || []}
                isBroadcasting={isBroadcasting}
                onOpenModal={openModal}
              />
            )}

            {activeTab === "auto_approve" && (
              <AutoApproveScreen
                chats={chats || []}
                summary={summary}
                onOpenModal={openModal}
              />
            )}

            {activeTab === "chatbot" && (
              <ChatBotScreen onOpenModal={openModal} />
            )}

            {activeTab === "reactions" && (
              <ReactionsScreen chats={chats || []} onOpenModal={openModal} />
            )}
          </>
        )}
      </ScrollView>

      {/* Floating Bottom Navigation */}
      <ProductFloatingBottomBar
        items={TELEGRAM_TABS}
        activeKey={activeTab}
        onChangeTab={handleTabChange}
        accentColor="#0284C7"
      />

      {/* Modals */}
      {activeModal === "autoforward" && (
        <AutoforwardModal
          visible={true}
          chats={chats || []}
          onClose={() => setActiveModal(null)}
          onSubmit={async (data: any) => {
            const res = await telegramApi.createForwardRule(data);
            await queryClient.invalidateQueries({ queryKey: ["telegram_all_data"] });
            return res;
          }}
          isLoading={false}
          onRefreshChats={() => queryClient.invalidateQueries({ queryKey: ["telegram_all_data"] })}
        />
      )}
      {activeModal === "tracker" && (
        <TrackerModal
          visible={true}
          onClose={() => {
            setActiveModal(null);
            queryClient.invalidateQueries({ queryKey: ["telegram_all_data"] });
          }}
        />
      )}
      {activeModal === "sub_manager" && (
        <SubManagerModal
          visible={true}
          chats={chats || []}
          onClose={() => {
            setActiveModal(null);
            queryClient.invalidateQueries({ queryKey: ["telegram_all_data"] });
          }}
        />
      )}
      {activeModal === "report_bot" && (
        <ReportBotModal
          visible={true}
          onClose={() => {
            setActiveModal(null);
            queryClient.invalidateQueries({ queryKey: ["telegram_all_data"] });
          }}
        />
      )}
      {activeModal === "broadcast" && (
        <BroadcastModal
          visible={true}
          chats={chats || []}
          onClose={() => {
            setActiveModal(null);
            queryClient.invalidateQueries({ queryKey: ["telegram_all_data"] });
          }}
        />
      )}
      {activeModal === "auto_approve" && (
        <AutoApproveModal
          visible={true}
          onClose={() => {
            setActiveModal(null);
            queryClient.invalidateQueries({ queryKey: ["telegram_all_data"] });
          }}
        />
      )}
      {activeModal === "chatbot" && (
        <ChatBotModal
          visible={true}
          onClose={() => {
            setActiveModal(null);
            queryClient.invalidateQueries({ queryKey: ["telegram_all_data"] });
          }}
        />
      )}
      {activeModal === "reactions" && (
        <ReactionsModal
          visible={true}
          onClose={() => {
            setActiveModal(null);
            queryClient.invalidateQueries({ queryKey: ["telegram_all_data"] });
          }}
        />
      )}
      {isLoginModalOpen && (
        <TelegramConnectModal
          visible={true}
          onClose={() => setIsLoginModalOpen(false)}
          isConnected={isActuallyConnected}
          connectedPhone={displayTelegramPhone}
          onStartLogin={async (phone: string) => telegramApi.startLogin(phone)}
          onVerifyOtp={async (otp: string) => telegramApi.verifyOtp({ phone: displayTelegramPhone || '', otp })}
          onVerifyPassword={async (password: string, phone?: string) => telegramApi.submitPassword(password)}
          onLogout={async () => {
            try {
              const { data } = await supabase.auth.getUser();
              if (data?.user?.id) {
                await supabase.from("tg_accounts").update({ is_active: false }).eq("user_id", data.user.id);
                await supabase.from("profiles").update({ telegram_user_id: null }).eq("id", data.user.id);
              }
            } catch {}
            queryClient.invalidateQueries({ queryKey: ["telegram_all_data"] });
            queryClient.invalidateQueries({ queryKey: ["telegram_session_status"] });
            setIsLoginModalOpen(false);
          }}
        />
      )}
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
  content: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 120,
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    alignItems: "stretch",
    gap: 0,
  },
});
