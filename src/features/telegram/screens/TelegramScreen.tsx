/**
 * TelegramScreen.tsx  ← SHELL ONLY
 * All business logic & JSX lives in the 9 individual service screens.
 * This file only handles: tab config, routing, shared data fetching, modals.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
} from "react-native";
import { getColors, useTheme } from "../../../contexts/ThemeContext";

import { AppScreen } from "../../../components/AppScreen";
import { AppTopBar } from "../../../components/AppTopBar";
import {
  ProductFloatingBottomBar,
  ProductTabItem,
} from "../../../components/ProductFloatingBottomBar";
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

  // ── Shared data queries ─────────────────────────────────────────────────────
  const {
    data: allData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["telegram_all_data"],
    queryFn: telegramSupabase.getSummary,
  });

  const summary = allData || {};
  const trackerBots = summary.trackerBots || [];
  const trackerLinks = summary.loadedLinks || [];
  const forwardRules = summary.loadedForwards || [];
  const rawSubPages = summary.loadedPages || [];
  const chats = summary.loadedMappings || [];
  const loadedPurchases = summary.loadedPurchases || [];
  const joins = summary.loadedJoins || [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const todaysJoins = joins.filter(
    (j: any) => new Date(j.joined_at || j.created_at) >= today,
  ).length;
  const thisMonthJoins = joins.filter(
    (j: any) => new Date(j.joined_at || j.created_at) >= firstDayOfMonth,
  ).length;
  const pendingJoins = joins.filter(
    (j: any) =>
      j.status === "Pending" ||
      j.status === "Bot Start" ||
      (!j.joined_channel && !j.left_channel),
  ).length;
  const activeJoins = joins.filter(
    (j: any) =>
      (j.joined_channel && !j.left_channel) ||
      j.status === "Active" ||
      j.status === "joined",
  ).length;
  const conversionRate =
    joins.length > 0 ? Math.round((activeJoins / joins.length) * 100) : 0;

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

  const channelsList = Object.values(channelMap);

  const trackerDash = {
    kpis: {
      totalJoins: joins.length,
      todaysJoins,
      thisMonthJoins,
      botStarts: joins.length,
      pendingJoins,
      conversionRate,
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
      totalTracked: joins.length,
      allTimeActive: activeJoins,
    },
    channels: channelsList,
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
    linkedTelegram: { phone: "", isLinked: !!summary.telegramUserId },
    monetizedChannels: chats,
    discoveredChannels: chats,
    transactions: loadedPurchases,
    pages: subManagerPages,
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleRefreshAll = async () => {
    await refetch();
  };

  const handleTabChange = (key: string) => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(key as TelegramTab);
    mainScrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const openModal = (key: TelegramToolKey) => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveModal(key);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <AppScreen safeArea={false} backgroundColor={color.background}>
      <AppTopBar
        title="Telegram Dashboard"
        subtitle="Bots, routing, monetization & automations"
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
          onClose={() => setActiveModal(null)}
          onSubmit={async (data: any) => {
            return {};
          }}
          isLoading={false}
        />
      )}
      {activeModal === "sub_manager" && (
        <SubManagerModal visible={true} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === "report_bot" && (
        <ReportBotModal visible={true} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === "broadcast" && (
        <BroadcastModal visible={true} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === "auto_approve" && (
        <AutoApproveModal visible={true} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === "chatbot" && (
        <ChatBotModal visible={true} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === "reactions" && (
        <ReactionsModal visible={true} onClose={() => setActiveModal(null)} />
      )}
      {isLoginModalOpen && (
        <TelegramLoginModal
          visible={true}
          onClose={() => setIsLoginModalOpen(false)}
          onStartLogin={async () => ({ success: true, message: "" })}
          onVerifyOtp={async () => ({ success: true, message: "" })}
          onSubmitPassword={async () => ({ success: true, message: "" })}
          onSuccess={() => {}}
        />
      )}
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110,
    gap: 0,
  },
});
