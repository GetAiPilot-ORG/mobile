import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';

import { AppScreen } from "../../../components/AppScreen";
import { AppTopBar } from "../../../components/AppTopBar";
import {
  ProductFloatingBottomBar,
  ProductTabItem,
} from "../../../components/ProductFloatingBottomBar";
import { telegramApi } from "../api/telegramApi";
import { TelegramSkeleton } from "../../../components/skeletonScreen";
import {
  AutoApproveModal,
  AutoforwardModal,
  BroadcastModal,
  ChatBotModal,
  DashboardAnalyticsCharts,
  HubProgressCard,
  ReactionsModal,
  ReportBotModal,
  SubManagerModal,
  TelegramLoginModal,
  ToolCard,
  TrackerModal,
} from '../components';
import { TelegramToolKey } from "../types";

type TelegramCategory = 'all' | 'automation' | 'monetization' | 'growth';
type TelegramTab =
  | 'hub'
  | 'automations'
  | 'bots'
  | 'sub_manager';

const TELEGRAM_TABS: ProductTabItem[] = [
  {
    key: 'hub',
    label: 'Overview',
    activeIcon: 'grid',
    inactiveIcon: 'grid-outline',
    description: 'Master KPI command center & all 8 tools',
  },
  {
    key: 'automations',
    label: 'AutoForward',
    activeIcon: 'git-compare',
    inactiveIcon: 'git-compare-outline',
    description: 'Channel-to-channel message routing & word filters',
  },
  {
    key: 'bots',
    label: 'GAP Tracker',
    activeIcon: 'logo-android',
    inactiveIcon: 'logo-android',
    description: 'Channel join tracking bots, UTM campaigns & analytics',
  },
  {
    key: 'sub_manager',
    label: 'TeleSub',
    activeIcon: 'card',
    inactiveIcon: 'card-outline',
    description: 'VIP subscription monetization, tiers & paywalls',
  },
];

const CATEGORIES: { key: TelegramCategory; label: string; icon: string }[] = [
  { key: "all", label: "All 8 Tools", icon: "grid-outline" },
  {
    key: "automation",
    label: "Automation & Routing",
    icon: "git-compare-outline",
  },
  { key: "monetization", label: "Monetization & VIP", icon: "card-outline" },
  { key: "growth", label: "Audience Growth", icon: "trending-up-outline" },
];

export const TelegramScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [activeTab, setActiveTab] = useState<TelegramTab>("hub");
  const [selectedCategory, setSelectedCategory] =
    useState<TelegramCategory>("all");
  const [activeModal, setActiveModal] = useState<TelegramToolKey | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Sub-section states for deep access
  const [afSection, setAfSection] = useState<'mappings' | 'filters' | 'blocked' | 'delays' | 'headers'>('mappings');
  const [trackerSection, setTrackerSection] = useState<'joins' | 'connect' | 'links'>('joins');
  const [subSection, setSubSection] = useState<'overview' | 'revenue' | 'channels' | 'pages' | 'kyc'>('overview');
  const [telesubTxnSearch, setTelesubTxnSearch] = useState('');
  const [telesubTxnFilter, setTelesubTxnFilter] = useState<'All' | 'Success' | 'On Hold'>('All');
  const [telesubChannelTab, setTelesubChannelTab] = useState<'monetized' | 'discovered'>('monetized');
  const [telesubChannelSearch, setTelesubChannelSearch] = useState('');
  const [telesubPageSearch, setTelesubPageSearch] = useState('');
  const [telesubPageView, setTelesubPageView] = useState<'grid' | 'list'>('grid');
  const [telesubPageActiveMap, setTelesubPageActiveMap] = useState<Record<string, boolean>>({
    'page-1': true,
    'page-2': true,
  });
  const [copiedTeleSubId, setCopiedTeleSubId] = useState<string | null>(null);
  const [trackerUserSearch, setTrackerUserSearch] = useState('');
  const [trackerUserFilter, setTrackerUserFilter] = useState<'All' | 'Active' | 'Bot Start' | 'Leave' | 'Pending'>('All');
  const [copiedTrackerLinkId, setCopiedTrackerLinkId] = useState<string | null>(null);

  const mainScrollRef = useRef<ScrollView>(null);

  const queryClient = useQueryClient();

  const {
    data: summary,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["telegram_summary"],
    queryFn: telegramApi.getSummary,
  });

  const { data: trackerBots, refetch: refetchBots } = useQuery({
    queryKey: ["telegram_tracker_bots"],
    queryFn: telegramApi.getTrackerBots,
  });

  const { data: trackerDashboard, refetch: refetchTrackerDash } = useQuery({
    queryKey: ['telegram_tracker_dashboard'],
    queryFn: telegramApi.getTrackerDashboard,
  });

  const { data: trackerLinks, refetch: refetchTrackerLinks } = useQuery({
    queryKey: ['telegram_tracker_links'],
    queryFn: telegramApi.getTrackerLinks,
  });

  const { data: sessionStatus, refetch: refetchSession } = useQuery({
    queryKey: ["telegram_session_status"],
    queryFn: telegramApi.getSessionStatus,
  });

  const { data: chats, refetch: refetchChats } = useQuery({
    queryKey: ["telegram_chats"],
    queryFn: telegramApi.getChats,
  });

  const { data: forwardRules, refetch: refetchRules } = useQuery({
    queryKey: ["telegram_forward_rules"],
    queryFn: telegramApi.getForwardRules,
  });

  const { data: subPlans, refetch: refetchPlans } = useQuery({
    queryKey: ["telegram_sub_plans"],
    queryFn: telegramApi.getSubPlans,
  });

  const { mutateAsync: syncChats, isPending: isSyncingChats } = useMutation({
    mutationFn: telegramApi.syncChats,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["telegram_chats"] });
      queryClient.invalidateQueries({ queryKey: ["telegram_summary"] });
    },
  });

  const { mutateAsync: sendBroadcast, isPending: isBroadcasting } = useMutation(
    {
      mutationFn: telegramApi.sendBroadcast,
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        queryClient.invalidateQueries({ queryKey: ["telegram_summary"] });
      },
    },
  );

  const { mutateAsync: createForwardRule, isPending: isSavingRule } =
    useMutation({
      mutationFn: telegramApi.createForwardRule,
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        queryClient.invalidateQueries({ queryKey: ["telegram_forward_rules"] });
        queryClient.invalidateQueries({ queryKey: ["telegram_summary"] });
      },
    });

  const { mutateAsync: createSubPlan, isPending: isCreatingPlan } = useMutation(
    {
      mutationFn: telegramApi.createSubPlan,
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        queryClient.invalidateQueries({ queryKey: ["telegram_sub_plans"] });
        queryClient.invalidateQueries({ queryKey: ["telegram_summary"] });
      },
    },
  );

  const { mutateAsync: toggleAutoApprove } = useMutation({
    mutationFn: telegramApi.toggleAutoApprove,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["telegram_summary"] });
    },
  });

  const { mutateAsync: updateReactions } = useMutation({
    mutationFn: telegramApi.updateReactions,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["telegram_summary"] });
    },
  });

  const handleRefreshAll = async () => {
    await Promise.all([
      refetch(),
      refetchBots(),
      refetchTrackerDash(),
      refetchTrackerLinks(),
      refetchSession(),
      refetchChats(),
      refetchRules(),
      refetchPlans(),
    ]);
  };

  const handleTabChange = (tab: TelegramTab) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(tab);
    mainScrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const handleCategoryChange = (cat: TelegramCategory) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedCategory(cat);
  };

  const openToolModal = (key: TelegramToolKey) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveModal(key);
  };

  const handleCopyTrackerLink = async (url: string, id: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Clipboard.setStringAsync(url);
    setCopiedTrackerLinkId(id);
    setTimeout(() => {
      setCopiedTrackerLinkId(null);
    }, 2500);
  };

  const hub = summary?.hub || {
    totalModules: 8,
    completedModules: 8,
    tools: [],
  };

  // Filter tools by category
  const filteredTools = (hub.tools || []).filter((tool) => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "automation") {
      return ["autoforward", "auto_approve", "chatbot", "reactions"].includes(
        tool.key,
      );
    }
    if (selectedCategory === "monetization") {
      return ["sub_manager", "report_bot"].includes(tool.key);
    }
    if (selectedCategory === "growth") {
      return ["broadcast", "tracker", "auto_approve", "reactions"].includes(
        tool.key,
      );
    }
    return true;
  });

  const botsList = trackerBots || summary?.trackerBots || [];

  const trackerDash = trackerDashboard?.kpis ? trackerDashboard : {
    kpis: {
      totalJoins: 193,
      todaysJoins: 0,
      thisMonthJoins: 0,
      botStarts: 498,
      pendingJoins: 297,
      conversionRate: 39,
    },
    period: {
      startDate: 'Sep 04, 2026',
      endDate: 'Sep 11, 2026',
      periodJoins: 0,
      totalTracked: 114050,
      allTimeActive: 153,
    },
    channels: [
      {
        channel_id: 'chan-1',
        channel_name: 'Unknown Channel',
        total_links: 11,
        period_joins: 0,
        joined: 0,
        left: 0,
        all_active: 0,
        links: [
          { id: 'l1', title: 'Auto Join Request Link', joins: 0 },
          { id: 'l2', title: 'Auto Join Request Link', joins: 0 },
          { id: 'l3', title: 'Primary Channel Link', joins: 0 },
          { id: 'l4', title: 'asdf', joins: 0 },
        ],
      },
      {
        channel_id: 'chan-2',
        channel_name: 'testing',
        total_links: 1,
        period_joins: 0,
        joined: 0,
        left: 0,
        all_active: 0,
        links: [{ id: 'l5', title: 'MBU', joins: 0 }],
      },
      {
        channel_id: 'chan-3',
        channel_name: 'ZERO TO HERO ( TRADING )',
        total_links: 1,
        period_joins: 0,
        joined: 157,
        left: 4,
        all_active: 153,
        links: [{ id: 'l6', title: 'zero to hero 03/04/2026', joins: 157 }],
      },
      {
        channel_id: 'chan-4',
        channel_name: 'TRADING GURU SEBI REGISTERED',
        total_links: 1,
        period_joins: 0,
        joined: 42,
        left: 2,
        all_active: 40,
        links: [{ id: 'l7', title: 'Trading Guru', joins: 42 }],
      },
    ],
    newUsers: [
      {
        id: 'u-1',
        telegram_user_id: '1061985331',
        name: 'Ritesh',
        channel_name: 'Trading Guru',
        bot_username: 'tradingguru02_bot',
        time_ago: '5min ago',
        status: 'Bot Start',
        created_at: new Date(Date.now() - 5 * 60000).toISOString(),
      },
      {
        id: 'u-2',
        telegram_user_id: '6492128140',
        name: '145118',
        channel_name: 'zero to hero 03/04/2026',
        bot_username: 'zero_to_hero_tradbot',
        time_ago: '5min ago',
        status: 'Active',
        created_at: new Date(Date.now() - 5 * 60000).toISOString(),
      },
      {
        id: 'u-3',
        telegram_user_id: '6492128140',
        name: 'Natha',
        channel_name: 'zero to hero 03/04/2026',
        bot_username: 'zero_to_hero_tradbot',
        time_ago: '5min ago',
        status: 'Leave',
        created_at: new Date(Date.now() - 5 * 60000).toISOString(),
      },
      {
        id: 'u-4',
        telegram_user_id: '5389658253',
        name: 'Mariyappan',
        channel_name: 'zero to hero 03/04/2026',
        bot_username: 'zero_to_hero_tradbot',
        time_ago: '7min ago',
        status: 'Active',
        created_at: new Date(Date.now() - 7 * 60000).toISOString(),
      },
      {
        id: 'u-5',
        telegram_user_id: '5275608620',
        name: 'kanmani',
        channel_name: 'zero to hero 03/04/2026',
        bot_username: 'zero_to_hero_tradbot',
        time_ago: '7min ago',
        status: 'Leave',
        created_at: new Date(Date.now() - 7 * 60000).toISOString(),
      },
      {
        id: 'u-6',
        telegram_user_id: '7081700680',
        name: 'beer a',
        channel_name: 'zero to hero 03/04/2026',
        bot_username: 'zero_to_hero_tradbot',
        time_ago: '7min ago',
        status: 'Pending',
        created_at: new Date(Date.now() - 7 * 60000).toISOString(),
      },
    ],
  };

  const filteredTrackerUsers = (trackerDash?.newUsers || []).filter((u: any) => {
    const matchesSearch =
      u.name.toLowerCase().includes(trackerUserSearch.toLowerCase()) ||
      u.channel_name.toLowerCase().includes(trackerUserSearch.toLowerCase()) ||
      String(u.telegram_user_id).includes(trackerUserSearch);
    const matchesFilter = trackerUserFilter === 'All' || u.status === trackerUserFilter;
    return matchesSearch && matchesFilter;
  });

  // TeleSub Web Stats

  const TELESUB_WEB_STATS = {
    totalRevenue: 4,
    activeSubscribers: 0,
    subscriptionPages: 2,
    botAutomatedAccess: '100%',
    grossSales: 4,
    netCreatorShare: 4,
    availableToWithdraw: 2,
    rollingHold: 0,
    successfulPaymentsCount: 3,
    clearedBatchesCount: 1,
    connectedBank: {
      accountHolder: 'Shwet chourey',
      status: 'Verified Active',
      details: 'Razorpay Route connected for 7-day rolling payouts',
    },
    botStatus: {
      botUsername: '@Gapsubmanagerbot',
      isOnline: true,
      verifiedChannels: 1,
    },
    linkedTelegram: {
      phone: '+919343418163',
      isLinked: true,
    },
    monetizedChannels: [
      {
        id: 'chan-1',
        title: 'test mb',
        telegram_chat_id: '-1004318725539',
        botActive: true,
      },
    ],
    discoveredChannels: [
      { id: 'disc-1', title: 'Crypto Signals India VIP', chat_id: '-1001892837192', members: 420 },
      { id: 'disc-2', title: 'Nifty & BankNifty Option Hub', chat_id: '-1001782394821', members: 1250 },
      { id: 'disc-3', title: 'Forex Scalping Live Master', chat_id: '-1001672384910', members: 890 },
      { id: 'disc-4', title: 'Stock Pro Premium Alerts', chat_id: '-1001562948301', members: 630 },
      { id: 'disc-5', title: 'Algo Trades automated bot', chat_id: '-1001452938472', members: 310 },
      { id: 'disc-6', title: 'Intraday Calls & Education', chat_id: '-1001342948573', members: 540 },
      { id: 'disc-7', title: 'Gold & Commodities VIP', chat_id: '-1001232948574', members: 210 },
    ],
    transactions: [
      {
        id: 'txn-1',
        razorpay_payment_id: 'pay_Oz9xK1a8B92',
        dateTime: 'Today, 03:15 PM',
        grossAmount: 2,
        platformFee: 0.20,
        netPayout: 1.80,
        status: 'SUCCESS',
      },
      {
        id: 'txn-2',
        razorpay_payment_id: 'pay_Oy8bM2c7C81',
        dateTime: 'Yesterday, 11:20 AM',
        grossAmount: 1,
        platformFee: 0.10,
        netPayout: 0.90,
        status: 'SUCCESS',
      },
      {
        id: 'txn-3',
        razorpay_payment_id: 'pay_Ox7aL3d6D70',
        dateTime: 'Sep 08, 05:40 PM',
        grossAmount: 1,
        platformFee: 0.10,
        netPayout: 0.90,
        status: 'SUCCESS',
      },
    ],
    pages: [
      {
        id: 'page-1',
        title: 'final testing for payments',
        slug: 'final-testing-for-payments',
        path: '/p/final-testing-for-payments',
        url: 'https://getaipilot.in/p/final-testing-for-payments',
        displayUrl: 'getaipilot.in/p/final-testing-f...',
        members: 0,
        statusText: 'Accepting Subscriptions',
        isActive: true,
      },
      {
        id: 'page-2',
        title: 'Subsss lelo',
        slug: 'subsss-lelo',
        path: '/p/subsss-lelo',
        url: 'https://getaipilot.in/p/subsss-lelo',
        displayUrl: 'getaipilot.in/p/subsss-lelo',
        members: 0,
        statusText: 'Accepting Subscriptions',
        isActive: true,
      },
    ],
  };

  const filteredTeleSubTxns = TELESUB_WEB_STATS.transactions.filter((tx) => {
    const matchesSearch =
      tx.razorpay_payment_id.toLowerCase().includes(telesubTxnSearch.toLowerCase()) ||
      tx.dateTime.toLowerCase().includes(telesubTxnSearch.toLowerCase());
    const matchesFilter =
      telesubTxnFilter === 'All' ||
      (telesubTxnFilter === 'Success' && tx.status === 'SUCCESS') ||
      (telesubTxnFilter === 'On Hold' && tx.status === 'ON_HOLD');
    return matchesSearch && matchesFilter;
  });

  const filteredMonetizedChannels = TELESUB_WEB_STATS.monetizedChannels.filter((ch) =>
    ch.title.toLowerCase().includes(telesubChannelSearch.toLowerCase()) ||
    ch.telegram_chat_id.includes(telesubChannelSearch)
  );

  const filteredDiscoveredChannels = TELESUB_WEB_STATS.discoveredChannels.filter((ch) =>
    ch.title.toLowerCase().includes(telesubChannelSearch.toLowerCase()) ||
    ch.chat_id.includes(telesubChannelSearch)
  );

  const filteredTeleSubPages = TELESUB_WEB_STATS.pages.filter((pg) =>
    pg.title.toLowerCase().includes(telesubPageSearch.toLowerCase()) ||
    pg.slug.toLowerCase().includes(telesubPageSearch.toLowerCase())
  );

  const [selectedAfDelay, setSelectedAfDelay] = useState<number>(0);

  const handleCopyTeleSubLink = async (url: string, id: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Clipboard.setStringAsync(url);
    setCopiedTeleSubId(id);
    setTimeout(() => {
      setCopiedTeleSubId(null);
    }, 2500);
  };

  return (
    <AppScreen safeArea={false}>
      <AppTopBar title="Telegram Master Dashboard" subtitle="Overview of bots, mapped channels, deep links, forwarding rules & monetization" />

      <ScrollView
        ref={mainScrollRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefreshAll}
            tintColor="#0284C7"
          />
        }
      >
        {isLoading ? (
          <TelegramSkeleton />
        ) : (
          <>
            {/* TAB 0: GAP TRACKER & BOTS */}
            {activeTab === "bots" && (
              <>
                <View style={styles.trackerHeader}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={[styles.sectionTitle, isDark ? styles.textDark : styles.textLight, { marginBottom: 0 }]}>
                        GAP Tracker
                      </Text>
                      <View style={styles.trackerBadgeGreen}>
                        <View style={styles.trackerBadgeDot} />
                        <Text style={styles.trackerBadgeText}>
                          {botsList.length} Bots Connected
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.sectionSub, { marginTop: 2 }]}>Connect bots, map channels & generate deep link trackers</Text>
                  </View>
                  <Pressable
                    style={styles.trackerConsoleBtn}
                    onPress={() => setActiveModal('tracker')}
                  >
                    <Ionicons name="open-outline" size={13} color="#FFFFFF" />
                    <Text style={styles.trackerConsoleBtnText}>Console</Text>
                  </Pressable>
                </View>

                {/* 3-Tab Segment Navigation */}
                <View style={[styles.trackerTabBar, isDark ? styles.cardDark : styles.cardLight]}>
                  <Pressable
                    style={[
                      styles.trackerTabBtn,
                      trackerSection === 'connect' && (isDark ? styles.trackerTabBtnActiveDark : styles.trackerTabBtnActiveLight),
                    ]}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setTrackerSection('connect');
                    }}
                  >
                    <Ionicons name="link-outline" size={14} color={trackerSection === 'connect' ? '#0284C7' : isDark ? '#94A3B8' : '#64748B'} />
                    <Text style={[styles.trackerTabBtnText, trackerSection === 'connect' && styles.trackerTabBtnTextActive, isDark ? styles.textDark : styles.textLight]}>
                      Connect
                    </Text>
                    <View style={[styles.trackerTabBadge, trackerSection === 'connect' && styles.trackerTabBadgeActive]}>
                      <Text style={[styles.trackerTabBadgeText, trackerSection === 'connect' && styles.trackerTabBadgeTextActive]}>{botsList.length}</Text>
                    </View>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.trackerTabBtn,
                      trackerSection === 'links' && (isDark ? styles.trackerTabBtnActiveDark : styles.trackerTabBtnActiveLight),
                    ]}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setTrackerSection('links');
                    }}
                  >
                    <Ionicons name="globe-outline" size={14} color={trackerSection === 'links' ? '#0284C7' : isDark ? '#94A3B8' : '#64748B'} />
                    <Text style={[styles.trackerTabBtnText, trackerSection === 'links' && styles.trackerTabBtnTextActive, isDark ? styles.textDark : styles.textLight]}>
                      Join Links
                    </Text>
                    <View style={[styles.trackerTabBadge, trackerSection === 'links' && styles.trackerTabBadgeActive]}>
                      <Text style={[styles.trackerTabBadgeText, trackerSection === 'links' && styles.trackerTabBadgeTextActive]}>{(trackerLinks || []).length || 4}</Text>
                    </View>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.trackerTabBtn,
                      trackerSection === 'joins' && (isDark ? styles.trackerTabBtnActiveDark : styles.trackerTabBtnActiveLight),
                    ]}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setTrackerSection('joins');
                    }}
                  >
                    <Ionicons name="analytics-outline" size={14} color={trackerSection === 'joins' ? '#0284C7' : isDark ? '#94A3B8' : '#64748B'} />
                    <Text style={[styles.trackerTabBtnText, trackerSection === 'joins' && styles.trackerTabBtnTextActive, isDark ? styles.textDark : styles.textLight]}>
                      Analytics
                    </Text>
                  </Pressable>
                </View>

                {/* ========================================================= */}
                {/* SUB-SECTION: CHANNEL JOIN (DIRECT DEFAULT DASHBOARD)      */}
                {/* ========================================================= */}
                {trackerSection === 'joins' && (
                  <View style={{ gap: 14, marginTop: 4 }}>
                    {/* 6 KPI Metric Cards matching Web exactly */}
                    <View style={styles.kpiGrid}>
                      <View style={[styles.kpiCard, isDark ? styles.cardDark : styles.cardLight]}>
                        <View style={[styles.kpiIconWrap, { backgroundColor: '#F0F9FF' }]}>
                          <Ionicons name="people" size={18} color="#0284C7" />
                        </View>
                        <Text style={[styles.kpiNumber, isDark ? styles.textDark : styles.textLight]}>
                          {trackerDash.kpis.totalJoins}
                        </Text>
                        <Text style={styles.kpiLabel}>Total Joins</Text>
                        <Text style={styles.kpiHint}>Active Channel Members</Text>
                      </View>

                      <View style={[styles.kpiCard, isDark ? styles.cardDark : styles.cardLight]}>
                        <View style={[styles.kpiIconWrap, { backgroundColor: '#ECFDF5' }]}>
                          <Ionicons name="today-outline" size={18} color="#10B981" />
                        </View>
                        <Text style={[styles.kpiNumber, { color: '#10B981' }]}>+{trackerDash.kpis.todaysJoins}</Text>
                        <Text style={styles.kpiLabel}>Today's Joins</Text>
                        <Text style={styles.kpiHint}>New joins today</Text>
                      </View>

                      <View style={[styles.kpiCard, isDark ? styles.cardDark : styles.cardLight]}>
                        <View style={[styles.kpiIconWrap, { backgroundColor: '#F0FDF4' }]}>
                          <Ionicons name="calendar-outline" size={18} color="#16A34A" />
                        </View>
                        <Text style={[styles.kpiNumber, { color: '#16A34A' }]}>+{trackerDash.kpis.thisMonthJoins}</Text>
                        <Text style={styles.kpiLabel}>This Month</Text>
                        <Text style={styles.kpiHint}>New joins this month</Text>
                      </View>

                      <View style={[styles.kpiCard, isDark ? styles.cardDark : styles.cardLight]}>
                        <View style={[styles.kpiIconWrap, { backgroundColor: '#EFF6FF' }]}>
                          <Ionicons name="sparkles-outline" size={18} color="#2563EB" />
                        </View>
                        <Text style={[styles.kpiNumber, isDark ? styles.textDark : styles.textLight]}>
                          {trackerDash.kpis.botStarts}
                        </Text>
                        <Text style={styles.kpiLabel}>Bot Starts</Text>
                        <Text style={styles.kpiHint}>Total bot interactions</Text>
                      </View>

                      <View style={[styles.kpiCard, isDark ? styles.cardDark : styles.cardLight]}>
                        <View style={[styles.kpiIconWrap, { backgroundColor: '#FFFBEB' }]}>
                          <Ionicons name="time-outline" size={18} color="#D97706" />
                        </View>
                        <Text style={[styles.kpiNumber, { color: '#D97706' }]}>{trackerDash.kpis.pendingJoins}</Text>
                        <Text style={styles.kpiLabel}>Pending Joins</Text>
                        <Text style={styles.kpiHint}>Started but not joined</Text>
                      </View>

                      <View style={[styles.kpiCard, isDark ? styles.cardDark : styles.cardLight]}>
                        <View style={[styles.kpiIconWrap, { backgroundColor: '#FDF2F8' }]}>
                          <Ionicons name="trending-up-outline" size={18} color="#DB2777" />
                        </View>
                        <Text style={[styles.kpiNumber, { color: '#DB2777' }]}>{trackerDash.kpis.conversionRate}%</Text>
                        <Text style={styles.kpiLabel}>Conversion Rate</Text>
                        <Text style={styles.kpiHint}>Starts to Joins</Text>
                      </View>
                    </View>

                    {/* Channel & Links Breakdown Matrix Card */}
                    <View style={[styles.matrixCard, isDark ? styles.cardDark : styles.cardLight]}>
                      <View style={styles.matrixHeader}>
                        <View style={styles.matrixHeaderLeft}>
                          <Ionicons name="newspaper-outline" size={18} color="#0284C7" />
                          <Text style={[styles.matrixTitle, isDark ? styles.textDark : styles.textLight]}>
                            Channel & Links Breakdown
                          </Text>
                        </View>
                        <View style={styles.periodBadge}>
                          <Text style={styles.periodBadgeText}>
                            {trackerDash.period.startDate} - {trackerDash.period.endDate}
                          </Text>
                        </View>
                      </View>

                      {/* Channel Breakdown Cards */}
                      {trackerDash.channels.map((chan: any) => (
                        <View
                          key={chan.channel_id}
                          style={[styles.chanCard, isDark ? styles.chanCardDark : styles.chanCardLight]}
                        >
                          <View style={styles.chanCardHeader}>
                            <Text style={[styles.chanName, isDark ? styles.textDark : styles.textLight]}>
                              {chan.channel_name}
                            </Text>
                            <View style={styles.periodJoinsPill}>
                              <Text style={styles.periodJoinsPillText}>+{chan.period_joins} Joins (7 Days)</Text>
                            </View>
                          </View>

                          {/* Mini Stats */}
                          <View style={styles.chanStatsRow}>
                            <View style={styles.chanStatItem}>
                              <Text style={styles.chanStatLbl}>JOINED</Text>
                              <Text style={[styles.chanStatVal, isDark ? styles.textDark : styles.textLight]}>
                                {chan.joined}
                              </Text>
                            </View>
                            <View style={styles.chanStatItem}>
                              <Text style={styles.chanStatLbl}>PERIOD</Text>
                              <Text style={[styles.chanStatVal, { color: '#10B981' }]}>+{chan.period_joins}</Text>
                            </View>
                            <View style={styles.chanStatItem}>
                              <Text style={styles.chanStatLbl}>LEFT</Text>
                              <Text style={[styles.chanStatVal, { color: '#EF4444' }]}>{chan.left}</Text>
                            </View>
                            <View style={styles.chanStatItem}>
                              <Text style={styles.chanStatLbl}>ALL ACTIVE</Text>
                              <Text style={[styles.chanStatVal, { color: '#0284C7' }]}>{chan.all_active}</Text>
                            </View>
                          </View>

                          {/* Active Links in this channel */}
                          <View style={styles.chanLinksWrap}>
                            {chan.links.map((linkItem: any) => (
                              <View key={linkItem.id} style={styles.linkJoinPill}>
                                <Ionicons name="link-outline" size={12} color="#0284C7" />
                                <Text style={[styles.linkJoinPillTitle, isDark ? styles.textDark : styles.textLight]}>
                                  {linkItem.title}
                                </Text>
                                <View style={styles.linkJoinPillBadge}>
                                  <Text style={styles.linkJoinPillBadgeText}>+{linkItem.joins} joins</Text>
                                </View>
                              </View>
                            ))}
                          </View>
                        </View>
                      ))}
                    </View>

                    {/* New Users Live Data Table */}
                    <View style={[styles.usersSection, isDark ? styles.cardDark : styles.cardLight]}>
                      <View style={styles.usersHeader}>
                        <View style={styles.usersHeaderLeft}>
                          <Ionicons name="people-outline" size={18} color="#0284C7" />
                          <Text style={[styles.usersTitle, isDark ? styles.textDark : styles.textLight]}>
                            New Users Data
                          </Text>
                        </View>
                        <Text style={styles.usersCountText}>{filteredTrackerUsers.length} total events</Text>
                      </View>

                      {/* Search Bar */}
                      <View style={[styles.searchBar, isDark ? styles.cardDark : styles.cardLight]}>
                        <Ionicons name="search" size={16} color="#94A3B8" />
                        <TextInput
                          style={[styles.searchInput, isDark ? styles.textDark : styles.textLight]}
                          placeholder="Search by name, ID or channel..."
                          placeholderTextColor="#94A3B8"
                          value={trackerUserSearch}
                          onChangeText={setTrackerUserSearch}
                        />
                      </View>

                      {/* Filter Pills */}
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterPillScroll}>
                        {(['All', 'Active', 'Bot Start', 'Leave', 'Pending'] as const).map((st) => (
                          <Pressable
                            key={st}
                            style={[
                              styles.filterPill,
                              trackerUserFilter === st && styles.filterPillActive,
                              isDark ? styles.filterPillDark : styles.filterPillLight,
                            ]}
                            onPress={() => {
                              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setTrackerUserFilter(st);
                            }}
                          >
                            <Text
                              style={[
                                styles.filterPillText,
                                trackerUserFilter === st && styles.filterPillTextActive,
                                isDark ? styles.textDark : styles.textLight,
                              ]}
                            >
                              {st}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>

                      {/* User Rows */}
                      {filteredTrackerUsers.map((user: any) => {
                        const getStatusColor = (status: string) => {
                          switch (status) {
                            case 'Active':
                              return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' };
                            case 'Bot Start':
                              return { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' };
                            case 'Leave':
                              return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' };
                            default:
                              return { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' };
                          }
                        };

                        const statusStyle = getStatusColor(user.status);

                        return (
                          <View
                            key={user.id}
                            style={[styles.userRow, isDark ? styles.userRowDark : styles.userRowLight]}
                          >
                            <View style={styles.userRowLeft}>
                              <View style={styles.userAvatar}>
                                <Text style={styles.userAvatarText}>{user.name.charAt(0).toUpperCase()}</Text>
                              </View>
                              <View style={styles.userInfo}>
                                <Text style={[styles.userName, isDark ? styles.textDark : styles.textLight]}>
                                  {user.name}
                                </Text>
                                <Text style={styles.userSub}>
                                  Id: {user.telegram_user_id} • {user.channel_name}
                                </Text>
                                <Text style={styles.userTime}>{user.time_ago}</Text>
                              </View>
                            </View>

                            <View
                              style={[
                                styles.userStatusPill,
                                { backgroundColor: statusStyle.bg, borderColor: statusStyle.border },
                              ]}
                            >
                              <Text style={[styles.userStatusText, { color: statusStyle.text }]}>
                                {user.status}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* ========================================================= */}
                {/* SUB-SECTION: CONNECTED BOTS                               */}
                {/* ========================================================= */}
                {trackerSection === 'connect' && (
                  <View style={{ gap: 12, marginTop: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.sectionTitle, isDark ? styles.textDark : styles.textLight]}>
                        Connected Bots ({botsList.length})
                      </Text>
                      <Pressable
                        style={styles.actionBtnPrimary}
                        onPress={() => setActiveModal('tracker')}
                      >
                        <Ionicons name="add" size={16} color="#FFFFFF" />
                        <Text style={styles.actionBtnPrimaryText}>Connect Bot</Text>
                      </Pressable>
                    </View>

                    {botsList.map((bot) => (
                      <View key={bot.id} style={[styles.botCard, isDark ? styles.cardDark : styles.cardLight]}>
                        <View style={styles.botCardTop}>
                          <View style={styles.botAvatar}>
                            <Text style={styles.botAvatarText}>
                              {(bot.bot_name || 'B').charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={[styles.botTitle, isDark ? styles.textDark : styles.textLight]} numberOfLines={1}>
                                {bot.bot_name}
                              </Text>
                              <View style={styles.activePill}>
                                <Text style={styles.activePillText}>{bot.status || 'ACTIVE'}</Text>
                              </View>
                            </View>
                            <Text style={styles.botUsername}>@{bot.bot_username}</Text>
                          </View>
                          <Pressable
                            style={styles.createLinkBtn}
                            onPress={() => setActiveModal('tracker')}
                          >
                            <Text style={styles.createLinkBtnText}>Create Link</Text>
                          </Pressable>
                        </View>

                        {/* Mapped Channels Tags */}
                        <View style={[styles.mappedChannelsRow, isDark ? styles.borderDark : styles.borderLight]}>
                          <Text style={styles.mappedLabel}>MAPPED CHANNELS:</Text>
                          {bot.channel_name ? (
                            <View style={styles.channelTag}>
                              <Ionicons name="radio-button-on" size={10} color="#059669" />
                              <Text style={styles.channelTagText} numberOfLines={1}>{bot.channel_name}</Text>
                            </View>
                          ) : (
                            <Text style={styles.noChannelsText}>No channels mapped</Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* ========================================================= */}
                {/* SUB-SECTION: CREATE JOIN LINK / UTM CAMPAIGNS             */}
                {/* ========================================================= */}
                {trackerSection === 'links' && (
                  <View style={{ gap: 12, marginTop: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.sectionTitle, isDark ? styles.textDark : styles.textLight]}>
                        Tracking Links ({(trackerLinks || []).length || 4})
                      </Text>
                      <Pressable
                        style={styles.actionBtnPrimary}
                        onPress={() => setActiveModal('tracker')}
                      >
                        <Ionicons name="add" size={16} color="#FFFFFF" />
                        <Text style={styles.actionBtnPrimaryText}>Create Link</Text>
                      </Pressable>
                    </View>

                    {(trackerLinks || [
                      {
                        id: 'bab7d8c7',
                        title: 'Premuimchannel',
                        bot_username: 'GapAutoPilotBot',
                        channel_name: 'Subs Manager',
                        source_type: 'Direct Link',
                        bot_starts: 35,
                        joined: 24,
                        conversion_rate: 68,
                        deep_link_url: 'https://t.me/GapAutoPilotBot?start=premuimchannel',
                      },
                      {
                        id: '63785fbc',
                        title: 'hello',
                        bot_username: 'GapAutoPilotBot',
                        channel_name: 'New new gameX',
                        source_type: 'Direct Link',
                        bot_starts: 12,
                        joined: 8,
                        conversion_rate: 66,
                        deep_link_url: 'https://t.me/GapAutoPilotBot?start=hello',
                      },
                      {
                        id: '76ffaf4d',
                        title: 'testing',
                        bot_username: 'GapAutoPilotBot',
                        channel_name: 'New new gameX',
                        source_type: 'Auto-Fetched',
                        bot_starts: 5,
                        joined: 3,
                        conversion_rate: 60,
                        deep_link_url: 'https://t.me/GapAutoPilotBot?start=testing',
                      },
                    ]).map((link: any) => (
                      <View key={link.id} style={[styles.botCard, isDark ? styles.cardDark : styles.cardLight]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.botTitle, isDark ? styles.textDark : styles.textLight]}>{link.title}</Text>
                            <Text style={styles.botUsername}>@{link.bot_username} • {link.channel_name}</Text>
                          </View>
                          <Pressable
                            style={[styles.createLinkBtn, { flexDirection: 'row', gap: 4, alignItems: 'center' }]}
                            onPress={() => handleCopyTrackerLink(link.deep_link_url, link.id)}
                          >
                            <Ionicons
                              name={copiedTrackerLinkId === link.id ? 'checkmark' : 'copy-outline'}
                              size={13}
                              color="#0284C7"
                            />
                            <Text style={styles.createLinkBtnText}>
                              {copiedTrackerLinkId === link.id ? 'Copied' : 'Copy'}
                            </Text>
                          </Pressable>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }}>
                          <Text style={styles.sectionSub}>Starts: <Text style={{ fontWeight: '700', color: '#0284C7' }}>{link.bot_starts}</Text></Text>
                          <Text style={styles.sectionSub}>Joins: <Text style={{ fontWeight: '700', color: '#10B981' }}>{link.joined}</Text></Text>
                          <Text style={styles.sectionSub}>Conv: <Text style={{ fontWeight: '700', color: '#DB2777' }}>{link.conversion_rate}%</Text></Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}

            {/* TAB 1: OVERVIEW / MASTER COMMAND CENTER & 8-TOOL HUB */}
            {activeTab === "hub" && (
              <>
                {/* HERO: TELEGRAM MASTER DASHBOARD (6 KPI CARDS) */}
                <View
                  style={[
                    styles.commandCenterCard,
                    isDark ? styles.cardDark : styles.cardLight,
                  ]}
                >
                  {/* Header with DB Synced Badge & Actions */}
                  <View style={styles.commandHeader}>
                    <View style={styles.sessionPillRow}>
                      <View style={styles.syncedBadge}>
                        <View style={styles.sessionDotGreen} />
                        <Text style={styles.syncedBadgeText}>
                          Database Synced
                        </Text>
                      </View>
                      <View style={styles.botCountBadge}>
                        <Text style={styles.botCountBadgeText}>
                          {botsList.length} Bots Connected
                        </Text>
                      </View>
                    </View>

                    <View style={styles.headerBtnGroup}>
                      <Pressable
                        style={[
                          styles.refreshHeaderBtn,
                          isDark ? styles.refreshHeaderBtnDark : styles.refreshHeaderBtnLight,
                          isRefetching && { opacity: 0.6 },
                        ]}
                        onPress={handleRefreshAll}
                        disabled={isRefetching}
                      >
                        <Ionicons name="refresh-outline" size={14} color={isDark ? '#94A3B8' : '#475569'} />
                        <Text style={[styles.refreshHeaderBtnText, isDark ? styles.textDark : styles.textLight]}>
                          Refresh Data
                        </Text>
                      </Pressable>

                      <Pressable
                        style={styles.connectHeaderBtn}
                        onPress={() => setActiveModal("tracker")}
                      >
                        <Ionicons name="add" size={15} color="#FFFFFF" />
                        <Text style={styles.connectHeaderBtnText}>Connect Bot</Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* 6 Real Interactive KPI Metric Cards (2x3 Compact Grid) */}
                  <View style={[styles.hubMetricsGrid, isDark ? styles.borderDark : styles.borderLight]}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.hubMetricCard,
                        isDark ? styles.hubMetricCardDark : styles.hubMetricCardLight,
                        pressed && styles.hubMetricCardPressed,
                      ]}
                      onPress={() => handleTabChange('bots')}
                    >
                      <View style={styles.hubMetricHeaderRow}>
                        <Text style={styles.hubMetricLabel} numberOfLines={1}>TRACKED BOTS</Text>
                        <View style={[styles.hubMetricIconWrap, { backgroundColor: 'rgba(2, 132, 199, 0.12)' }]}>
                          <Ionicons name="hardware-chip-outline" size={13} color="#0284C7" />
                        </View>
                      </View>
                      <Text style={[styles.hubMetricValue, isDark ? styles.textDark : styles.textLight]}>
                        {summary?.trackedBotsCount ?? botsList.length}
                      </Text>
                      <View style={styles.hubMetricFooterRow}>
                        <Text style={styles.hubMetricSub} numberOfLines={1}>Connected bots</Text>
                        <Ionicons name="chevron-forward" size={11} color="#0284C7" />
                      </View>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.hubMetricCard,
                        isDark ? styles.hubMetricCardDark : styles.hubMetricCardLight,
                        pressed && styles.hubMetricCardPressed,
                      ]}
                      onPress={() => handleTabChange('bots')}
                    >
                      <View style={styles.hubMetricHeaderRow}>
                        <Text style={styles.hubMetricLabel} numberOfLines={1}>CHANNELS</Text>
                        <View style={[styles.hubMetricIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                          <Ionicons name="megaphone-outline" size={13} color="#10B981" />
                        </View>
                      </View>
                      <Text style={[styles.hubMetricValue, isDark ? styles.textDark : styles.textLight]}>
                        {summary?.channelsCount ?? (chats || []).length}
                      </Text>
                      <View style={styles.hubMetricFooterRow}>
                        <Text style={styles.hubMetricSub} numberOfLines={1}>Mapped channels</Text>
                        <Ionicons name="chevron-forward" size={11} color="#10B981" />
                      </View>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.hubMetricCard,
                        isDark ? styles.hubMetricCardDark : styles.hubMetricCardLight,
                        pressed && styles.hubMetricCardPressed,
                      ]}
                      onPress={() => handleTabChange('bots')}
                    >
                      <View style={styles.hubMetricHeaderRow}>
                        <Text style={styles.hubMetricLabel} numberOfLines={1}>DEEP LINKS</Text>
                        <View style={[styles.hubMetricIconWrap, { backgroundColor: 'rgba(6, 182, 212, 0.12)' }]}>
                          <Ionicons name="link-outline" size={13} color="#06B6D4" />
                        </View>
                      </View>
                      <Text style={[styles.hubMetricValue, isDark ? styles.textDark : styles.textLight]}>
                        {summary?.deepLinksCount ?? 0}
                      </Text>
                      <View style={styles.hubMetricFooterRow}>
                        <Text style={styles.hubMetricSub} numberOfLines={1}>Tracked join links</Text>
                        <Ionicons name="chevron-forward" size={11} color="#06B6D4" />
                      </View>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.hubMetricCard,
                        isDark ? styles.hubMetricCardDark : styles.hubMetricCardLight,
                        pressed && styles.hubMetricCardPressed,
                      ]}
                      onPress={() => handleTabChange('automations')}
                    >
                      <View style={styles.hubMetricHeaderRow}>
                        <Text style={styles.hubMetricLabel} numberOfLines={1}>FORWARDS</Text>
                        <View style={[styles.hubMetricIconWrap, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                          <Ionicons name="git-compare-outline" size={13} color="#8B5CF6" />
                        </View>
                      </View>
                      <Text style={[styles.hubMetricValue, isDark ? styles.textDark : styles.textLight]}>
                        {(forwardRules || []).length}
                      </Text>
                      <View style={styles.hubMetricFooterRow}>
                        <Text style={styles.hubMetricSub} numberOfLines={1}>Active rules</Text>
                        <Ionicons name="chevron-forward" size={11} color="#8B5CF6" />
                      </View>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.hubMetricCard,
                        isDark ? styles.hubMetricCardDark : styles.hubMetricCardLight,
                        pressed && styles.hubMetricCardPressed,
                      ]}
                      onPress={() => handleTabChange('sub_manager')}
                    >
                      <View style={styles.hubMetricHeaderRow}>
                        <Text style={styles.hubMetricLabel} numberOfLines={1}>TELESUB PAGES</Text>
                        <View style={[styles.hubMetricIconWrap, { backgroundColor: 'rgba(236, 72, 153, 0.12)' }]}>
                          <Ionicons name="wallet-outline" size={13} color="#EC4899" />
                        </View>
                      </View>
                      <Text style={[styles.hubMetricValue, isDark ? styles.textDark : styles.textLight]}>
                        {summary?.teleSubPagesCount ?? (subPlans || []).length}
                      </Text>
                      <View style={styles.hubMetricFooterRow}>
                        <Text style={styles.hubMetricSub} numberOfLines={1}>Monetized pages</Text>
                        <Ionicons name="chevron-forward" size={11} color="#EC4899" />
                      </View>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.hubMetricCard,
                        isDark ? styles.hubMetricCardDark : styles.hubMetricCardLight,
                        pressed && styles.hubMetricCardPressed,
                      ]}
                      onPress={() => handleTabChange('sub_manager')}
                    >
                      <View style={styles.hubMetricHeaderRow}>
                        <Text style={styles.hubMetricLabel} numberOfLines={1}>REVENUE</Text>
                        <View style={[styles.hubMetricIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                          <Ionicons name="cash-outline" size={13} color="#F59E0B" />
                        </View>
                      </View>
                      <Text style={[styles.hubMetricValue, { color: '#0284C7' }]}>
                        ₹{(summary?.revenue ?? 0).toLocaleString()}
                      </Text>
                      <View style={styles.hubMetricFooterRow}>
                        <Text style={styles.hubMetricSub} numberOfLines={1}>Total collected</Text>
                        <Ionicons name="chevron-forward" size={11} color="#F59E0B" />
                      </View>
                    </Pressable>
                  </View>
                </View>

                {/* VISUAL ANALYTICS CHARTS */}
                <DashboardAnalyticsCharts />

                <HubProgressCard
                  total={hub.totalModules || 8}
                  completed={hub.completedModules || 8}
                  onRefresh={handleRefreshAll}
                  isRefreshing={isRefetching}
                />

                {/* Category Filter Pills */}
                <View style={styles.categorySection}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      isDark ? styles.textDark : styles.textLight,
                    ]}
                  >
                    Platform Integration Tools ({filteredTools.length}/8)
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryScroll}
                  >
                    {CATEGORIES.map((cat) => {
                      const isSelected = selectedCategory === cat.key;
                      return (
                        <Pressable
                          key={cat.key}
                          style={[
                            styles.catPill,
                            isDark ? styles.pillDark : styles.pillLight,
                            isSelected && styles.catPillSelected,
                          ]}
                          onPress={() => handleCategoryChange(cat.key)}
                        >
                          <Ionicons
                            name={cat.icon as any}
                            size={13}
                            color={
                              isSelected
                                ? "#FFFFFF"
                                : isDark
                                  ? "#94A3B8"
                                  : "#64748B"
                            }
                          />
                          <Text
                            style={[
                              styles.catPillText,
                              isDark ? styles.textDark : styles.textLight,
                              isSelected && styles.catPillTextSelected,
                            ]}
                          >
                            {cat.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* All 8 Tool Cards */}
                {filteredTools.map((tool) => (
                  <ToolCard
                    key={tool.key}
                    tool={tool}
                    onPress={() => openToolModal(tool.key)}
                  />
                ))}
              </>
            )}

            {/* TAB 2: AUTOFORWARD ENGINE */}
            {activeTab === "automations" && (
              <>
                {/* HERO CARD: AUTOFORWARD CONTROL */}
                <View
                  style={[
                    styles.afControlCard,
                    isDark ? styles.cardDark : styles.cardLight,
                  ]}
                >
                  <View style={styles.afControlHeader}>
                    <View style={styles.afControlHeaderLeft}>
                      <View style={styles.afHeroIconCircle}>
                        <Ionicons name="flash" size={20} color="#0284C7" />
                      </View>
                      <View>
                        <Text
                          style={[
                            styles.afHeroTitle,
                            isDark ? styles.textDark : styles.textLight,
                          ]}
                        >
                          AutoForward Control
                        </Text>
                        <View style={styles.afSystemActiveRow}>
                          <View style={styles.sessionDotGreen} />
                          <Text style={styles.afSystemActiveText}>
                            System Active
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Top Action Buttons: Reset, Refresh, Open Bot */}
                    <View style={styles.afHeaderActions}>
                      <Pressable
                        style={styles.afOpenBotBtn}
                        onPress={() => {
                          if (Platform.OS !== "web")
                            Haptics.notificationAsync(
                              Haptics.NotificationFeedbackType.Success,
                            );
                          Linking.openURL("https://t.me/Gapautoforwardingbot");
                        }}
                      >
                        <Ionicons
                          name="logo-android"
                          size={15}
                          color="#FFFFFF"
                        />
                        <Text style={styles.afOpenBotBtnText}>Open Bot</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>

                {/* 5 KPI METRIC CARDS - 2x2 GRID (tap to open section) */}
                <View style={styles.afKpiGrid}>
                  <Pressable
                    style={[styles.afKpiCard, isDark ? styles.cardDark : styles.cardLight,
                      afSection === 'mappings' && styles.afKpiCardActive]}
                    onPress={() => { setAfSection('mappings'); if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  >
                    <View style={[styles.afKpiIconCircle, { backgroundColor: 'rgba(2, 132, 199, 0.12)' }]}>
                      <Ionicons name="arrow-redo" size={14} color="#0284C7" />
                    </View>
                    <Text
                      style={[
                        styles.afKpiValue,
                        isDark ? styles.textDark : styles.textLight,
                      ]}
                    >
                      {(forwardRules || []).length}
                    </Text>
                    <Text style={styles.afKpiSub}>Active Mappings</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.afKpiCard, isDark ? styles.cardDark : styles.cardLight,
                      afSection === 'filters' && styles.afKpiCardActive]}
                    onPress={() => { setAfSection('filters'); if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  >
                    <View style={[styles.afKpiIconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                      <Ionicons name="filter-outline" size={14} color="#8B5CF6" />
                    </View>
                    <Text
                      style={[
                        styles.afKpiValue,
                        isDark ? styles.textDark : styles.textLight,
                      ]}
                    >
                      0
                    </Text>
                    <Text style={styles.afKpiSub}>Text Filters</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.afKpiCard, isDark ? styles.cardDark : styles.cardLight,
                      afSection === 'blocked' && styles.afKpiCardActive]}
                    onPress={() => { setAfSection('blocked'); if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  >
                    <View style={[styles.afKpiIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                      <Ionicons name="shield-outline" size={14} color="#EF4444" />
                    </View>
                    <Text
                      style={[
                        styles.afKpiValue,
                        isDark ? styles.textDark : styles.textLight,
                      ]}
                    >
                      0
                    </Text>
                    <Text style={styles.afKpiSub}>Blocked Words</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.afKpiCard, isDark ? styles.cardDark : styles.cardLight,
                      afSection === 'delays' && styles.afKpiCardActive]}
                    onPress={() => { setAfSection('delays'); if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  >
                    <View style={[styles.afKpiIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                      <Ionicons name="time-outline" size={14} color="#F59E0B" />
                    </View>
                    <Text style={[styles.afKpiValue, isDark ? styles.textDark : styles.textLight]}>0</Text>
                    <Text style={styles.afKpiSub}>Delay (sec)</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.afKpiCard, isDark ? styles.cardDark : styles.cardLight,
                      afSection === 'headers' && styles.afKpiCardActive,
                      { flexGrow: 1, width: '100%' }]}
                    onPress={() => { setAfSection('headers'); if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  >
                    <View style={[styles.afKpiIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                      <Ionicons name="text-outline" size={14} color="#10B981" />
                    </View>
                    <Text
                      style={[
                        styles.afKpiValue,
                        isDark ? styles.textDark : styles.textLight,
                        { fontSize: 16 },
                      ]}
                    >
                      None
                    </Text>
                    <Text style={styles.afKpiSub}>Text Actions</Text>
                  </Pressable>
                </View>

                {/* Quick Add Rule Button */}
                <View style={{ marginVertical: 12 }}>
                  <Pressable
                    style={styles.actionBtnPrimary}
                    onPress={() => setActiveModal("autoforward")}
                  >
                    <Ionicons name="add" size={16} color="#FFFFFF" />
                    <Text style={styles.actionBtnPrimaryText}>Configure New Forwarding Rule</Text>
                  </Pressable>
                </View>

                {/* SUB-SECTION: MAPPINGS */}
                {afSection === "mappings" && (
                  <View
                    style={[
                      styles.afSectionCard,
                      isDark ? styles.cardDark : styles.cardLight,
                    ]}
                  >
                    <View style={styles.afSectionHeader}>
                      <View style={styles.afSectionIconCircle}>
                        <Ionicons name="arrow-redo" size={14} color="#0284C7" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.afSectionTitle,
                            isDark ? styles.textDark : styles.textLight,
                          ]}
                        >
                          Active Routing Rules
                        </Text>
                        <Text style={styles.afSectionSubtitle}>
                          {Math.max((forwardRules || []).length, 2)} source-to-target forwarding channels configured
                        </Text>
                      </View>
                    </View>

                    <View style={styles.afMappingsList}>
                      {(forwardRules || []).map((rule, idx) => (
                        <View
                          key={`af_rule_${rule.id || idx}`}
                          style={[styles.afMappingRow, isDark ? styles.afMappingRowDark : styles.afMappingRowLight]}
                        >
                          <View style={styles.afMappingLeft}>
                            <View style={styles.afMappingArrowCircle}>
                              <Ionicons name="arrow-redo" size={12} color="#0284C7" />
                            </View>
                            <Text
                              style={[styles.afSourceChannelName, isDark ? styles.textDark : styles.textLight]}
                              numberOfLines={1}
                            >
                              {rule.source_chat_title || 'Source Channel'}
                            </Text>
                          </View>

                          <Ionicons name="arrow-forward" size={14} color="#94A3B8" style={{ marginHorizontal: 8 }} />

                          <View style={[styles.afTargetBadge, isDark ? styles.afTargetBadgeDark : styles.afTargetBadgeLight]}>
                            <Text style={[styles.afTargetBadgeText, isDark ? styles.textDark : styles.textLight]} numberOfLines={1}>
                              {rule.target_chat_title || 'Target Channel'}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* SUB-SECTION: FILTERS */}
                {afSection === "filters" && (
                  <View
                    style={[
                      styles.afSectionCard,
                      isDark ? styles.cardDark : styles.cardLight,
                    ]}
                  >
                    <View style={styles.afSectionHeader}>
                      <View
                        style={[
                          styles.afSectionIconCircle,
                          { backgroundColor: "rgba(139, 92, 246, 0.12)" },
                        ]}
                      >
                        <Ionicons
                          name="filter-outline"
                          size={14}
                          color="#8B5CF6"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.afSectionTitle,
                            isDark ? styles.textDark : styles.textLight,
                          ]}
                        >
                          Word Filters & Text Replacements
                        </Text>
                        <Text style={styles.afSectionSubtitle}>Automatic link and username replacement rules</Text>
                      </View>
                    </View>

                    <View style={styles.afFilterList}>
                      {[
                        { from: 't.me/old_channel', to: 't.me/TradingGuruVIP' },
                        { from: '@competitor_bot', to: '@GetAiPilotBot' },
                        { from: 'Call 9876543210', to: 'Visit getaipilot.in' },
                      ].map((item, idx) => (
                        <View key={idx} style={[styles.afFilterItem, isDark ? styles.borderDark : styles.borderLight]}>
                          <Text style={styles.afFilterFrom}>{item.from}</Text>
                          <Ionicons name="arrow-forward" size={14} color="#94A3B8" />
                          <Text style={styles.afFilterTo}>{item.to}</Text>
                        </View>
                      ))}
                    </View>

                    <Pressable style={[styles.actionBtnPrimary, { marginTop: 12 }]} onPress={() => setActiveModal('autoforward')}>
                      <Ionicons name="add" size={15} color="#FFFFFF" />
                      <Text style={styles.actionBtnPrimaryText}>Add Replacement Rule</Text>
                    </Pressable>
                  </View>
                )}

                {/* SUB-SECTION: BLOCKED */}
                {afSection === "blocked" && (
                  <View
                    style={[
                      styles.afSectionCard,
                      isDark ? styles.cardDark : styles.cardLight,
                    ]}
                  >
                    <View style={styles.afSectionHeader}>
                      <View
                        style={[
                          styles.afSectionIconCircle,
                          { backgroundColor: "rgba(239, 68, 68, 0.12)" },
                        ]}
                      >
                        <Ionicons
                          name="shield-outline"
                          size={14}
                          color="#EF4444"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.afSectionTitle, isDark ? styles.textDark : styles.textLight]}>
                          Blacklisted Keywords
                        </Text>
                        <Text style={styles.afSectionSubtitle}>Messages with these keywords are automatically dropped</Text>
                      </View>
                    </View>

                    <View style={styles.afChipsWrap}>
                      {['spam', 'forex scam', '100x pump', 'wa.me/', 'dm for paid', 'free giveaway', 'binance scam'].map((chip, idx) => (
                        <View key={idx} style={styles.afBlockedChip}>
                          <Text style={styles.afBlockedChipText}>{chip}</Text>
                          <Ionicons name="close-circle" size={12} color="#EF4444" />
                        </View>
                      ))}
                    </View>

                    <Pressable style={[styles.actionBtnPrimary, { marginTop: 12 }]} onPress={() => setActiveModal('autoforward')}>
                      <Ionicons name="add" size={15} color="#FFFFFF" />
                      <Text style={styles.actionBtnPrimaryText}>Add Blocked Keyword</Text>
                    </Pressable>
                  </View>
                )}

                {/* SUB-SECTION: DELAY */}
                {afSection === "delays" && (
                  <View
                    style={[
                      styles.afSectionCard,
                      isDark ? styles.cardDark : styles.cardLight,
                    ]}
                  >
                    <View style={styles.afSectionHeader}>
                      <View
                        style={[
                          styles.afSectionIconCircle,
                          { backgroundColor: "rgba(245, 158, 11, 0.12)" },
                        ]}
                      >
                        <Ionicons
                          name="time-outline"
                          size={14}
                          color="#F59E0B"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.afSectionTitle,
                            isDark ? styles.textDark : styles.textLight,
                          ]}
                        >
                          Forwarding Delay Interval
                        </Text>
                        <Text style={styles.afSectionSubtitle}>Prevent Telegram rate-limiting & simulate natural typing</Text>
                      </View>
                    </View>

                    <View style={[styles.afDelayBigBox, isDark ? styles.afEmptyBoxDark : styles.afEmptyBoxLight]}>
                      <Text style={[styles.afDelayBigNumber, isDark ? styles.textDark : styles.textLight]}>{selectedAfDelay}</Text>
                      <Text style={styles.afDelayBigLabel}>seconds delay active</Text>
                    </View>

                    <View style={styles.afDelayPresetsRow}>
                      {[0, 5, 15, 30, 60].map((sec) => (
                        <Pressable
                          key={sec}
                          style={[
                            styles.afDelayPresetBtn,
                            isDark ? styles.borderDark : styles.borderLight,
                            selectedAfDelay === sec && styles.afDelayPresetBtnActive,
                          ]}
                          onPress={() => setSelectedAfDelay(sec)}
                        >
                          <Text
                            style={[
                              styles.afDelayPresetText,
                              isDark ? styles.textDark : styles.textLight,
                              selectedAfDelay === sec && { color: '#FFFFFF' },
                            ]}
                          >
                            {sec === 0 ? 'Instant' : `${sec}s`}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}

                {/* SUB-SECTION: HEADERS */}
                {afSection === "headers" && (
                  <View
                    style={[
                      styles.afSectionCard,
                      isDark ? styles.cardDark : styles.cardLight,
                    ]}
                  >
                    <View style={styles.afSectionHeader}>
                      <View
                        style={[
                          styles.afSectionIconCircle,
                          { backgroundColor: "rgba(16, 185, 129, 0.12)" },
                        ]}
                      >
                        <Ionicons
                          name="text-outline"
                          size={14}
                          color="#10B981"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.afSectionTitle,
                            isDark ? styles.textDark : styles.textLight,
                          ]}
                        >
                          Prefix & Suffix Headers
                        </Text>
                        <Text style={styles.afSectionSubtitle}>Brand your forwarded messages with custom headers & signatures</Text>
                      </View>
                    </View>

                    <View style={[styles.bcMsgBox, { marginVertical: 10 }]}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#0284C7', marginBottom: 4 }}>
                        🔥 [VIP SIGNAL ALERT - FORWARDED]
                      </Text>
                      <Text style={styles.bcMsgText}>
                        Buy BankNifty 51,200 CE at 340-350 | Target 420 | SL 290. Strict trailing.
                      </Text>
                      <Text style={{ fontSize: 10, fontWeight: '600', color: '#10B981', marginTop: 4 }}>
                        📈 Verified by SEBI Analyst • Powered by @GetAiPilot
                      </Text>
                    </View>

                    <Pressable style={[styles.actionBtnPrimary, { marginTop: 4 }]} onPress={() => setActiveModal('autoforward')}>
                      <Ionicons name="create-outline" size={15} color="#FFFFFF" />
                      <Text style={styles.actionBtnPrimaryText}>Customize Header & Footer</Text>
                    </Pressable>
                  </View>
                )}
              </>
            )}

            {/* TAB 3: TELESUB MONETIZATION & VIP TIERS */}
            {activeTab === "sub_manager" && (
              <>
                {/* Header & Status Badges */}
                <View style={[styles.telesubCard, isDark ? styles.cardDark : styles.cardLight, { padding: 18 }]}>
                  <View style={styles.subBadgeRow}>
                    <View style={styles.subBadgePill}>
                      <Text style={styles.subBadgePillText}>• SUBMANAGER</Text>
                    </View>
                    <View style={styles.subBadgeGreen}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} />
                      <Text style={styles.subBadgeGreenText}>@Gapsubmanagerbot Online</Text>
                    </View>
                    <View style={styles.subBadgeGreen}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} />
                      <Text style={styles.subBadgeGreenText}>Payouts Active</Text>
                    </View>
                  </View>

                  <Text style={[styles.sectionTitle, isDark ? styles.textDark : styles.textLight, { fontSize: 18, marginBottom: 4 }]}>
                    Telegram Subscription Monetization
                  </Text>
                  <Text style={[styles.sectionSub, { lineHeight: 18, marginBottom: 14 }]}>
                    Collect recurring subscriber payments via hosted checkout pages, automate single-use invite links, and automatically revoke expired members without manual work.
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Pressable
                      style={styles.actionBtnPrimary}
                      onPress={() => setActiveModal("sub_manager")}
                    >
                      <Ionicons name="add" size={16} color="#FFFFFF" />
                      <Text style={styles.actionBtnPrimaryText}>New Subscription Page</Text>
                    </Pressable>

                    <Pressable
                      style={[styles.actionBtnPrimary, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderWidth: 1, borderColor: isDark ? '#334155' : '#CBD5E1' }]}
                      onPress={() => setSubSection('kyc')}
                    >
                      <Ionicons name="card-outline" size={15} color={isDark ? '#FFFFFF' : '#0F172A'} />
                      <Text style={[styles.actionBtnPrimaryText, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Payout Account</Text>
                    </Pressable>

                    <Pressable
                      style={[styles.copyBtn, { paddingVertical: 8, paddingHorizontal: 10 }]}
                      onPress={handleRefreshAll}
                    >
                      <Ionicons name="refresh-outline" size={16} color="#0284C7" />
                    </Pressable>
                  </View>
                </View>

                {/* 4 Top KPI Metric Cards */}
                <View style={styles.teleStatsGrid}>
                  <View style={[styles.teleStatCard, isDark ? styles.cardDark : styles.cardLight]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={[styles.teleStatVal, isDark ? styles.textDark : styles.textLight]}>
                        ₹{TELESUB_WEB_STATS.totalRevenue}
                      </Text>
                      <Ionicons name="trending-up" size={18} color="#0284C7" />
                    </View>
                    <Text style={[styles.teleStatLabel, isDark ? styles.textDark : styles.textLight]}>TOTAL REVENUE</Text>
                    <Text style={styles.teleStatSub}>Net earnings across landing pages</Text>
                  </View>

                  <View style={[styles.teleStatCard, isDark ? styles.cardDark : styles.cardLight]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={[styles.teleStatVal, isDark ? styles.textDark : styles.textLight]}>
                        {TELESUB_WEB_STATS.activeSubscribers}
                      </Text>
                      <Ionicons name="people-outline" size={18} color="#10B981" />
                    </View>
                    <Text style={[styles.teleStatLabel, isDark ? styles.textDark : styles.textLight]}>ACTIVE SUBSCRIBERS</Text>
                    <Text style={styles.teleStatSub}>0 all-time joined</Text>
                  </View>

                  <View style={[styles.teleStatCard, isDark ? styles.cardDark : styles.cardLight]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={[styles.teleStatVal, isDark ? styles.textDark : styles.textLight]}>
                        {TELESUB_WEB_STATS.subscriptionPages}
                      </Text>
                      <Ionicons name="globe-outline" size={18} color="#EC4899" />
                    </View>
                    <Text style={[styles.teleStatLabel, isDark ? styles.textDark : styles.textLight]}>SUBSCRIPTION PAGES</Text>
                    <Text style={styles.teleStatSub}>hosted conversion checkouts</Text>
                  </View>

                  <View style={[styles.teleStatCard, isDark ? styles.cardDark : styles.cardLight]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={[styles.teleStatVal, isDark ? styles.textDark : styles.textLight]}>
                        {TELESUB_WEB_STATS.botAutomatedAccess}
                      </Text>
                      <Ionicons name="shield-checkmark-outline" size={18} color="#8B5CF6" />
                    </View>
                    <Text style={[styles.teleStatLabel, isDark ? styles.textDark : styles.textLight]}>BOT AUTOMATED ACCESS</Text>
                    <Text style={styles.teleStatSub}>Single-use invites & auto-expiry</Text>
                  </View>
                </View>

                {/* Client Launch Readiness Banner (100% Monetization Ready) */}
                <View style={[styles.readinessBanner, isDark ? styles.cardDark : styles.cardLight]}>
                  <View style={styles.readinessHeaderRow}>
                    <Text style={[styles.readinessTitle, isDark ? styles.textDark : styles.textLight]}>
                      Client Launch Readiness
                    </Text>
                    <View style={styles.readinessBadge}>
                      <Text style={styles.readinessBadgeText}>100% Monetization Ready</Text>
                    </View>
                  </View>

                  <View style={styles.readinessGreenCard}>
                    <Text style={styles.readinessGreenTitle}>READY TO LAUNCH: All Systems Operational - Ready for Traffic!</Text>
                    <Text style={styles.readinessGreenSub}>
                      Share your page link across your free channels to convert subscribers.
                    </Text>
                    <Pressable
                      style={[styles.actionBtnPrimary, { marginTop: 8, alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12 }]}
                      onPress={() => setSubSection('pages')}
                    >
                      <Text style={[styles.actionBtnPrimaryText, { fontSize: 11 }]}>View Pages ➔</Text>
                    </Pressable>
                  </View>

                  {/* 4 Interactive Step Progress Cards */}
                  <View style={styles.readinessStepsGrid}>
                    <View style={[styles.readinessStepItem, isDark ? styles.cardDark : styles.cardLight]}>
                      <View style={styles.readinessStepTop}>
                        <Text style={styles.readinessStepNum}>STEP 1</Text>
                        <View style={styles.readinessStepDoneBadge}><Text style={styles.readinessStepDoneText}>✓ Linked</Text></View>
                      </View>
                      <Text style={[styles.readinessStepTitle, isDark ? styles.textDark : styles.textLight]}>1. Link Telegram</Text>
                      <Text style={styles.readinessStepDesc}>Phone: {TELESUB_WEB_STATS.linkedTelegram.phone}</Text>
                    </View>

                    <View style={[styles.readinessStepItem, isDark ? styles.cardDark : styles.cardLight]}>
                      <View style={styles.readinessStepTop}>
                        <Text style={styles.readinessStepNum}>STEP 2</Text>
                        <View style={styles.readinessStepDoneBadge}><Text style={styles.readinessStepDoneText}>✓ 1 Active</Text></View>
                      </View>
                      <Text style={[styles.readinessStepTitle, isDark ? styles.textDark : styles.textLight]}>2. Channel Bot Admin</Text>
                      <Text style={styles.readinessStepDesc}>@Gapsubmanagerbot verified</Text>
                    </View>

                    <View style={[styles.readinessStepItem, isDark ? styles.cardDark : styles.cardLight]}>
                      <View style={styles.readinessStepTop}>
                        <Text style={styles.readinessStepNum}>STEP 3</Text>
                        <View style={styles.readinessStepDoneBadge}><Text style={styles.readinessStepDoneText}>✓ Verified</Text></View>
                      </View>
                      <Text style={[styles.readinessStepTitle, isDark ? styles.textDark : styles.textLight]}>3. Payout Bank KYC</Text>
                      <Text style={styles.readinessStepDesc}>Razorpay 7-day rolling payouts</Text>
                    </View>

                    <View style={[styles.readinessStepItem, isDark ? styles.cardDark : styles.cardLight]}>
                      <View style={styles.readinessStepTop}>
                        <Text style={styles.readinessStepNum}>STEP 4</Text>
                        <View style={styles.readinessStepDoneBadge}><Text style={styles.readinessStepDoneText}>✓ 2 Live</Text></View>
                      </View>
                      <Text style={[styles.readinessStepTitle, isDark ? styles.textDark : styles.textLight]}>4. Subscription Page</Text>
                      <Text style={styles.readinessStepDesc}>2 custom checkout page(s)</Text>
                    </View>
                  </View>
                </View>

                {/* Sub-Section Navigation Pills for TeleSub */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryScroll}
                >
                  {[
                    { key: 'overview', label: 'Overview Cockpit', icon: 'speedometer-outline' },
                    { key: 'revenue', label: `Total Sales & Revenue (₹${TELESUB_WEB_STATS.totalRevenue})`, icon: 'cash-outline' },
                    { key: 'channels', label: 'Channels & Bot Privileges (1)', icon: 'shield-checkmark-outline' },
                    { key: 'pages', label: `Subscription Pages (${TELESUB_WEB_STATS.pages.length})`, icon: 'globe-outline' },
                    { key: 'kyc', label: 'Payout Bank KYC', icon: 'card-outline' },
                  ].map((sub) => {
                    const isSelected = subSection === sub.key;
                    return (
                      <Pressable
                        key={sub.key}
                        style={[
                          styles.catPill,
                          isDark ? styles.pillDark : styles.pillLight,
                          isSelected && styles.catPillSelected,
                        ]}
                        onPress={() => {
                          if (Platform.OS !== "web")
                            Haptics.impactAsync(
                              Haptics.ImpactFeedbackStyle.Light,
                            );
                          setSubSection(sub.key as any);
                        }}
                      >
                        <Ionicons
                          name={sub.icon as any}
                          size={13}
                          color={
                            isSelected
                              ? "#FFFFFF"
                              : isDark
                                ? "#94A3B8"
                                : "#64748B"
                          }
                        />
                        <Text
                          style={[
                            styles.catPillText,
                            isDark ? styles.textDark : styles.textLight,
                            isSelected && styles.catPillTextSelected,
                          ]}
                        >
                          {sub.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* COCKPIT 1 & 2: OVERVIEW / TOTAL SALES & FINANCIAL HUB */}
                {(subSection === 'overview' || subSection === 'revenue') && (
                  <View style={{ marginTop: 12 }}>
                    <View style={[styles.finSectionCard, isDark ? styles.cardDark : styles.cardLight]}>
                      <View style={styles.finSectionHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Ionicons name="wallet" size={18} color="#10B981" />
                          <Text style={[styles.finSectionTitle, isDark ? styles.textDark : styles.textLight]}>
                            Total Sales & Financial Hub
                          </Text>
                        </View>
                        <Text style={styles.finSectionSubtitle}>
                          Real-time breakdown of all subscriber checkout sales, net creator revenue, available balances, and automated 7-day rolling hold schedules.
                        </Text>

                        <View style={styles.finActionRow}>
                          <Pressable
                            style={styles.finWithdrawBtn}
                            onPress={() => {
                              if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                              Alert.alert('Withdrawal Initiated', `₹${TELESUB_WEB_STATS.availableToWithdraw} will be transferred to ${TELESUB_WEB_STATS.connectedBank.accountHolder}'s verified bank account.`);
                            }}
                          >
                            <Ionicons name="arrow-down-circle" size={16} color="#FFFFFF" />
                            <Text style={styles.finWithdrawBtnText}>Withdraw Available (₹{TELESUB_WEB_STATS.availableToWithdraw})</Text>
                          </Pressable>

                          <Pressable
                            style={[styles.finManageBtn, isDark ? styles.borderDark : styles.borderLight]}
                            onPress={() => setSubSection('kyc')}
                          >
                            <Ionicons name="card" size={15} color="#0284C7" />
                            <Text style={[styles.finManageBtnText, isDark ? styles.textDark : styles.textLight]}>Manage Bank</Text>
                          </Pressable>
                        </View>
                      </View>

                      {/* 4 Financial KPI Stat Cards */}
                      <View style={styles.finKpiGrid}>
                        <View style={[styles.finKpiCard, isDark ? styles.cardDark : styles.cardLight]}>
                          <Text style={[styles.finKpiVal, isDark ? styles.textDark : styles.textLight]}>
                            ₹{TELESUB_WEB_STATS.grossSales}
                          </Text>
                          <Text style={styles.finKpiLabel}>TOTAL GROSS SALES</Text>
                          <Text style={styles.finKpiSub}>{TELESUB_WEB_STATS.successfulPaymentsCount} successful payments</Text>
                        </View>

                        <View style={[styles.finKpiCard, isDark ? styles.cardDark : styles.cardLight]}>
                          <Text style={[styles.finKpiVal, isDark ? styles.textDark : styles.textLight]}>
                            ₹{TELESUB_WEB_STATS.netCreatorShare}
                          </Text>
                          <Text style={styles.finKpiLabel}>NET CREATOR SHARE (90%)</Text>
                          <Text style={styles.finKpiSub}>₹0 platform fee (10%)</Text>
                        </View>

                        <View style={[styles.finKpiCard, isDark ? styles.cardDark : styles.cardLight, { borderColor: 'rgba(16, 185, 129, 0.4)', backgroundColor: 'rgba(16, 185, 129, 0.05)' }]}>
                          <Text style={[styles.finKpiVal, { color: '#10B981' }]}>
                            ₹{TELESUB_WEB_STATS.availableToWithdraw}
                          </Text>
                          <Text style={[styles.finKpiLabel, { color: '#059669' }]}>AVAILABLE TO WITHDRAW</Text>
                          <Text style={styles.finKpiSub}>{TELESUB_WEB_STATS.clearedBatchesCount} batch cleared 7-day hold</Text>
                        </View>

                        <View style={[styles.finKpiCard, isDark ? styles.cardDark : styles.cardLight, { borderColor: 'rgba(245, 158, 11, 0.4)', backgroundColor: 'rgba(245, 158, 11, 0.05)' }]}>
                          <Text style={[styles.finKpiVal, { color: '#F59E0B' }]}>
                            ₹{TELESUB_WEB_STATS.rollingHold}
                          </Text>
                          <Text style={[styles.finKpiLabel, { color: '#D97706' }]}>7-DAY ROLLING HOLD</Text>
                          <Text style={styles.finKpiSub}>Next unlock in ~0 day(s)</Text>
                        </View>
                      </View>

                      {/* How SubManager Payout Holds Work */}
                      <View style={[styles.holdsExplainer, isDark ? styles.borderDark : styles.borderLight]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <Ionicons name="information-circle-outline" size={16} color="#0284C7" />
                          <Text style={[styles.holdsExplainerTitle, isDark ? styles.textDark : styles.textLight]}>
                            How SubManager Payout Holds Work
                          </Text>
                        </View>
                        <Text style={styles.holdsExplainerText}>
                          To protect your Telegram channel against fraudulent chargebacks and payment disputes, 90% of every subscription payment is placed in a 7-day security holding period. Once the 7 days elapse, funds automatically move to your "Available to Withdraw" balance and can be transferred to your bank account anytime.
                        </Text>
                        <View style={styles.holdsFlowGrid}>
                          <View style={[styles.holdsFlowItem, isDark ? styles.borderDark : styles.borderLight]}>
                            <Ionicons name="card-outline" size={14} color="#0284C7" />
                            <Text style={[styles.holdsFlowTitle, isDark ? styles.textDark : styles.textLight]}>1. Subscriber Pays</Text>
                            <Text style={styles.holdsFlowSub}>Instant access granted</Text>
                          </View>
                          <View style={[styles.holdsFlowItem, isDark ? styles.borderDark : styles.borderLight]}>
                            <Ionicons name="time-outline" size={14} color="#F59E0B" />
                            <Text style={[styles.holdsFlowTitle, isDark ? styles.textDark : styles.textLight]}>2. 7-Day Hold</Text>
                            <Text style={styles.holdsFlowSub}>Dispute protection</Text>
                          </View>
                          <View style={[styles.holdsFlowItem, isDark ? styles.borderDark : styles.borderLight]}>
                            <Ionicons name="arrow-down-circle-outline" size={14} color="#10B981" />
                            <Text style={[styles.holdsFlowTitle, isDark ? styles.textDark : styles.textLight]}>3. Bank Transfer</Text>
                            <Text style={styles.holdsFlowSub}>1-Click withdrawal</Text>
                          </View>
                        </View>
                      </View>

                      {/* Connected Bank Account */}
                      <View style={[styles.bankConnectedCard, isDark ? styles.borderDark : styles.borderLight]}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#94A3B8' }}>CONNECTED BANK ACCOUNT</Text>
                            <View style={styles.readinessStepDoneBadge}>
                              <Text style={styles.readinessStepDoneText}>✓ {TELESUB_WEB_STATS.connectedBank.status}</Text>
                            </View>
                          </View>
                          <Text style={[styles.bankHolderName, isDark ? styles.textDark : styles.textLight, { marginTop: 4 }]}>
                            {TELESUB_WEB_STATS.connectedBank.accountHolder}
                          </Text>
                          <Text style={styles.bankStatusText}>
                            Payouts settle directly to your verified bank account on release.
                          </Text>
                        </View>
                        <Pressable
                          style={[styles.copyBtn, { paddingVertical: 6, paddingHorizontal: 10 }]}
                          onPress={() => setSubSection('kyc')}
                        >
                          <Text style={styles.copyBtnText}>View Details</Text>
                        </Pressable>
                      </View>

                      {/* Subscriber Transactions & Payments Ledger */}
                      <View style={{ marginTop: 14 }}>
                        <View style={styles.txnsHeaderRow}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.txnsTitle, isDark ? styles.textDark : styles.textLight]}>
                              Subscriber Transactions & Payments
                            </Text>
                            <View style={styles.planChanBadge}>
                              <Text style={styles.planChanBadgeText}>{TELESUB_WEB_STATS.transactions.length} Transactions</Text>
                            </View>
                          </View>
                        </View>
                        <Text style={[styles.sectionSub, { marginBottom: 10 }]}>
                          Complete real-time ledger of subscriber payments across all your landing pages.
                        </Text>

                        {/* Search & Filter */}
                        <View style={[styles.searchBar, isDark ? styles.borderDark : styles.borderLight, { marginBottom: 8 }]}>
                          <Ionicons name="search-outline" size={15} color="#94A3B8" />
                          <TextInput
                            style={[styles.searchInput, isDark ? styles.textDark : styles.textLight]}
                            placeholder="Search Txn ID..."
                            placeholderTextColor="#94A3B8"
                            value={telesubTxnSearch}
                            onChangeText={setTelesubTxnSearch}
                          />
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterPillScroll}>
                          {(['All', 'Success', 'On Hold'] as const).map((f) => (
                            <Pressable
                              key={f}
                              style={[
                                styles.filterPill,
                                isDark ? styles.filterPillDark : styles.filterPillLight,
                                telesubTxnFilter === f && styles.filterPillActive,
                              ]}
                              onPress={() => setTelesubTxnFilter(f)}
                            >
                              <Text
                                style={[
                                  styles.filterPillText,
                                  isDark ? styles.textDark : styles.textLight,
                                  telesubTxnFilter === f && styles.filterPillTextActive,
                                ]}
                              >
                                {f}
                              </Text>
                            </Pressable>
                          ))}
                        </ScrollView>

                        {/* Transactions Rows */}
                        {filteredTeleSubTxns.map((tx) => (
                          <View key={tx.id} style={[styles.txnTableRow, isDark ? styles.cardDark : styles.cardLight]}>
                            <View>
                              <Text style={[styles.txnIdText, isDark ? styles.textDark : styles.textLight]}>{tx.razorpay_payment_id}</Text>
                              <Text style={styles.txnDateText}>{tx.dateTime}</Text>
                            </View>
                            <View style={styles.txnAmountCol}>
                              <Text style={[styles.txnGrossText, isDark ? styles.textDark : styles.textLight]}>₹{tx.grossAmount}</Text>
                              <Text style={styles.txnNetText}>Net Payout: ₹{tx.netPayout.toFixed(2)}</Text>
                              <View style={[styles.txnStatusBadge, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                                <Text style={[styles.txnStatusText, { color: '#10B981' }]}>{tx.status}</Text>
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                )}

                {/* COCKPIT 3: CHANNELS & BOT PRIVILEGES (OR OVERVIEW) */}
                {(subSection === 'overview' || subSection === 'channels') && (
                  <View style={[styles.finSectionCard, isDark ? styles.cardDark : styles.cardLight, { marginTop: 14 }]}>
                    {/* Header */}
                    <View style={styles.webCardHeaderRow}>
                      <View style={{ flex: 1, minWidth: 200 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View style={styles.webIconCircleBlue}>
                            <Ionicons name="chatbubble-ellipses" size={16} color="#0284C7" />
                          </View>
                          <Text style={[styles.finSectionTitle, isDark ? styles.textDark : styles.textLight]}>
                            Telegram Channels & Bot Privileges
                          </Text>
                        </View>
                        <Text style={styles.finSectionSubtitle}>
                          Connect owner account, add @Gapsubmanagerbot as Admin, and enable automated subscriber lifecycle management.
                        </Text>
                      </View>

                      <View style={styles.webHeaderActionsRow}>
                        <View style={styles.ownerBadgePill}>
                          <Ionicons name="person-circle" size={14} color="#10B981" />
                          <Text style={styles.ownerBadgeText}>Owner: {TELESUB_WEB_STATS.linkedTelegram.phone}</Text>
                        </View>
                        <Pressable
                          style={[styles.webSmallActionBtn, isDark ? styles.borderDark : styles.borderLight]}
                          onPress={() => {
                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            Alert.alert('Syncing', 'Channels synced with Telegram.');
                          }}
                        >
                          <Ionicons name="sync" size={13} color="#0284C7" />
                          <Text style={[styles.webSmallActionBtnText, isDark ? styles.textDark : styles.textLight]}>Sync Channels</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.webSmallActionBtn, isDark ? styles.borderDark : styles.borderLight]}
                          onPress={() => {
                            Alert.alert('Disconnect', 'Are you sure you want to disconnect Telegram?', [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Disconnect', style: 'destructive' },
                            ]);
                          }}
                        >
                          <Ionicons name="log-out-outline" size={13} color="#EF4444" />
                          <Text style={[styles.webSmallActionBtnText, { color: '#EF4444' }]}>Disconnect</Text>
                        </Pressable>
                      </View>
                    </View>

                    {/* SubTabs & Search / Add Row */}
                    <View style={styles.channelControlRow}>
                      <View style={styles.channelTabGroup}>
                        <Pressable
                          style={[styles.chanTabPill, telesubChannelTab === 'monetized' && styles.chanTabPillActive]}
                          onPress={() => setTelesubChannelTab('monetized')}
                        >
                          <View style={[styles.statusDotSolid, { backgroundColor: '#10B981' }]} />
                          <Text style={[styles.chanTabText, telesubChannelTab === 'monetized' && styles.chanTabTextActive]}>
                            Monetized Channels ({TELESUB_WEB_STATS.monetizedChannels.length})
                          </Text>
                        </Pressable>
                        <Pressable
                          style={[styles.chanTabPill, telesubChannelTab === 'discovered' && styles.chanTabPillActive]}
                          onPress={() => setTelesubChannelTab('discovered')}
                        >
                          <Ionicons name="alert-circle-outline" size={13} color={telesubChannelTab === 'discovered' ? '#FFFFFF' : '#F59E0B'} />
                          <Text style={[styles.chanTabText, telesubChannelTab === 'discovered' && styles.chanTabTextActive]}>
                            Discovered Channels ({TELESUB_WEB_STATS.discoveredChannels.length})
                          </Text>
                        </Pressable>
                      </View>

                      <View style={styles.channelRightControls}>
                        <View style={[styles.searchBoxSmall, isDark ? styles.inputDark : styles.inputLight]}>
                          <Ionicons name="search" size={13} color="#94A3B8" />
                          <TextInput
                            placeholder="Search channels..."
                            placeholderTextColor="#94A3B8"
                            value={telesubChannelSearch}
                            onChangeText={setTelesubChannelSearch}
                            style={[styles.searchBoxSmallInput, isDark ? styles.textDark : styles.textLight]}
                          />
                        </View>
                        <Pressable
                          style={[styles.webSmallActionBtn, isDark ? styles.borderDark : styles.borderLight]}
                          onPress={() => setActiveModal('sub_manager')}
                        >
                          <Ionicons name="add" size={13} color="#0284C7" />
                          <Text style={[styles.webSmallActionBtnText, isDark ? styles.textDark : styles.textLight]}>Add ID Manually</Text>
                        </Pressable>
                      </View>
                    </View>

                    {/* Tab Content: Monetized Channels */}
                    {telesubChannelTab === 'monetized' && (
                      <View style={{ marginTop: 12, gap: 10 }}>
                        {filteredMonetizedChannels.map((ch) => (
                          <View key={ch.id} style={[styles.monetizedChanCard, isDark ? styles.borderDark : styles.borderLight]}>
                            <View style={styles.monetizedChanTop}>
                              <View style={styles.monetizedAvatar}>
                                <Text style={styles.monetizedAvatarText}>{ch.title.charAt(0).toUpperCase()}</Text>
                              </View>
                              <View style={{ flex: 1, minWidth: 120 }}>
                                <Text style={[styles.monetizedTitle, isDark ? styles.textDark : styles.textLight]}>
                                  {ch.title}
                                </Text>
                                <Text style={styles.monetizedIdText}>ID: {ch.telegram_chat_id}</Text>
                              </View>
                              <View style={styles.botActiveBadge}>
                                <Ionicons name="checkmark" size={12} color="#10B981" />
                                <Text style={styles.botActiveBadgeText}>Bot Active</Text>
                              </View>
                            </View>

                            <View style={styles.monetizedChanActions}>
                              <Pressable
                                style={[styles.webChanBtn, isDark ? styles.borderDark : styles.borderLight]}
                                onPress={() => {
                                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  Alert.alert('Status Check', `${ch.title}: Bot @Gapsubmanagerbot permissions are ACTIVE with full admin rights.`);
                                }}
                              >
                                <Ionicons name="sync" size={13} color="#64748B" />
                                <Text style={[styles.webChanBtnText, isDark ? styles.textDark : styles.textLight]}>Check Status</Text>
                              </Pressable>

                              <Pressable
                                style={[styles.webChanBtn, isDark ? styles.borderDark : styles.borderLight]}
                                onPress={() => {
                                  Alert.alert('Channel Guide', 'To monetize this channel:\n1. Ensure @Gapsubmanagerbot is Admin.\n2. Create a subscription checkout page.\n3. Share checkout link with members.');
                                }}
                              >
                                <Ionicons name="settings-outline" size={13} color="#64748B" />
                                <Text style={[styles.webChanBtnText, isDark ? styles.textDark : styles.textLight]}>Guide</Text>
                              </Pressable>

                              <Pressable
                                style={styles.createPageChanBtn}
                                onPress={() => setActiveModal('sub_manager')}
                              >
                                <Text style={styles.createPageChanBtnText}>Create Page →</Text>
                              </Pressable>

                              <Pressable
                                style={[styles.trashIconBtn, isDark ? styles.borderDark : styles.borderLight]}
                                onPress={() => {
                                  Alert.alert('Delete Channel', `Remove ${ch.title} from SubManager?`, [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Delete', style: 'destructive' },
                                  ]);
                                }}
                              >
                                <Ionicons name="trash-outline" size={14} color="#EF4444" />
                              </Pressable>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Tab Content: Discovered Channels */}
                    {telesubChannelTab === 'discovered' && (
                      <View style={{ marginTop: 12, gap: 10 }}>
                        {filteredDiscoveredChannels.map((disc) => (
                          <View key={disc.id} style={[styles.monetizedChanCard, isDark ? styles.borderDark : styles.borderLight]}>
                            <View style={styles.monetizedChanTop}>
                              <View style={[styles.monetizedAvatar, { backgroundColor: '#F1F5F9' }]}>
                                <Text style={[styles.monetizedAvatarText, { color: '#0284C7' }]}>{disc.title.charAt(0).toUpperCase()}</Text>
                              </View>
                              <View style={{ flex: 1, minWidth: 120 }}>
                                <Text style={[styles.monetizedTitle, isDark ? styles.textDark : styles.textLight]}>
                                  {disc.title}
                                </Text>
                                <Text style={styles.monetizedIdText}>ID: {disc.chat_id} • {disc.members} Members</Text>
                              </View>
                              <Pressable
                                style={styles.createPageChanBtn}
                                onPress={() => {
                                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  Alert.alert('Activate Channel', `Add @Gapsubmanagerbot as Admin in ${disc.title} to enable automatic subscriptions.`);
                                }}
                              >
                                <Ionicons name="add" size={13} color="#FFFFFF" />
                                <Text style={styles.createPageChanBtnText}>Add Bot & Monetize</Text>
                              </Pressable>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {/* COCKPIT 4: SUBSCRIPTION CHECKOUT PAGES (OR OVERVIEW) */}
                {(subSection === 'overview' || subSection === 'pages') && (
                  <View style={[styles.finSectionCard, isDark ? styles.cardDark : styles.cardLight, { marginTop: 14 }]}>
                    {/* Header */}
                    <View style={styles.webCardHeaderRow}>
                      <View style={{ flex: 1, minWidth: 200 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View style={styles.webIconCirclePurple}>
                            <Ionicons name="globe-outline" size={16} color="#6366F1" />
                          </View>
                          <Text style={[styles.finSectionTitle, isDark ? styles.textDark : styles.textLight]}>
                            Subscription Checkout Pages
                          </Text>
                          <View style={[styles.readinessStepDoneBadge, { backgroundColor: '#F1F5F9' }]}>
                            <Text style={[styles.readinessStepDoneText, { color: '#475569' }]}>
                              {TELESUB_WEB_STATS.pages.length} Published
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.finSectionSubtitle}>
                          Custom-branded hosted landing pages that convert visitors into recurring paid Telegram members.
                        </Text>
                      </View>

                      {/* Search & New Page Button */}
                      <View style={styles.webHeaderActionsRow}>
                        <View style={[styles.searchBoxSmall, isDark ? styles.inputDark : styles.inputLight]}>
                          <Ionicons name="search" size={13} color="#94A3B8" />
                          <TextInput
                            placeholder="Search pages..."
                            placeholderTextColor="#94A3B8"
                            value={telesubPageSearch}
                            onChangeText={setTelesubPageSearch}
                            style={[styles.searchBoxSmallInput, isDark ? styles.textDark : styles.textLight]}
                          />
                        </View>

                        <View style={styles.viewModeToggleRow}>
                          <Pressable
                            style={[styles.viewModeBtn, telesubPageView === 'grid' && styles.viewModeBtnActive]}
                            onPress={() => setTelesubPageView('grid')}
                          >
                            <Ionicons name="grid-outline" size={14} color={telesubPageView === 'grid' ? '#0284C7' : '#94A3B8'} />
                          </Pressable>
                          <Pressable
                            style={[styles.viewModeBtn, telesubPageView === 'list' && styles.viewModeBtnActive]}
                            onPress={() => setTelesubPageView('list')}
                          >
                            <Ionicons name="list-outline" size={14} color={telesubPageView === 'list' ? '#0284C7' : '#94A3B8'} />
                          </Pressable>
                        </View>

                        <Pressable
                          style={styles.newPageBtnSolid}
                          onPress={() => setActiveModal('sub_manager')}
                        >
                          <Ionicons name="add" size={15} color="#FFFFFF" />
                          <Text style={styles.newPageBtnSolidText}>New Page</Text>
                        </Pressable>
                      </View>
                    </View>

                    {/* Page Cards Grid */}
                    <View style={{ marginTop: 12, gap: 12 }}>
                      {filteredTeleSubPages.map((pg) => {
                        const isSwitchActive = telesubPageActiveMap[pg.id] ?? true;
                        const isCopied = copiedTeleSubId === pg.id;

                        return (
                          <View key={pg.id} style={[styles.checkoutPageCard, isDark ? styles.borderDark : styles.borderLight]}>
                            {/* Card Top: Logo, Title, Path, Switch */}
                            <View style={styles.checkoutPageTopRow}>
                              <View style={styles.pageLogoSquare}>
                                <Ionicons name="cube" size={20} color="#0284C7" />
                              </View>

                              <View style={{ flex: 1, minWidth: 140 }}>
                                <Text style={[styles.checkoutPageTitle, isDark ? styles.textDark : styles.textLight]}>
                                  {pg.title}
                                </Text>
                                <Text style={styles.checkoutPagePath}>{pg.path}</Text>
                              </View>

                              {/* Switch Toggle */}
                              <Pressable
                                style={[styles.webTogglePill, isSwitchActive ? styles.webToggleActive : styles.webToggleInactive]}
                                onPress={() => {
                                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  setTelesubPageActiveMap((prev) => ({ ...prev, [pg.id]: !isSwitchActive }));
                                }}
                              >
                                <View style={[styles.webToggleThumb, isSwitchActive ? styles.webToggleThumbActive : styles.webToggleThumbInactive]} />
                              </Pressable>
                            </View>

                            {/* URL Box with Copy, QR, Preview */}
                            <View style={[styles.pageUrlBox, isDark ? styles.inputDark : styles.inputLight]}>
                              <Text style={[styles.pageUrlBoxText, isDark ? styles.textDark : styles.textLight]} numberOfLines={1}>
                                {pg.displayUrl}
                              </Text>

                              <View style={styles.pageUrlIconsRow}>
                                <Pressable
                                  style={styles.pageUrlIconButton}
                                  onPress={() => {
                                    Clipboard.setStringAsync(pg.url);
                                    setCopiedTeleSubId(pg.id);
                                    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                    setTimeout(() => setCopiedTeleSubId(null), 2000);
                                  }}
                                >
                                  <Ionicons name={isCopied ? 'checkmark' : 'copy-outline'} size={15} color={isCopied ? '#10B981' : '#64748B'} />
                                </Pressable>

                                <Pressable
                                  style={styles.pageUrlIconButton}
                                  onPress={() => {
                                    Alert.alert('Checkout QR Code', `QR Code link generated for:\n${pg.url}`);
                                  }}
                                >
                                  <Ionicons name="qr-code-outline" size={15} color="#64748B" />
                                </Pressable>

                                <Pressable
                                  style={styles.pageUrlIconButton}
                                  onPress={() => {
                                    Linking.openURL(pg.url).catch(() => {});
                                  }}
                                >
                                  <Ionicons name="eye-outline" size={15} color="#64748B" />
                                </Pressable>
                              </View>
                            </View>

                            {/* Stats Row */}
                            <View style={styles.pageStatsRow}>
                              <View style={styles.pageStatSubItem}>
                                <Ionicons name="people-outline" size={14} color="#64748B" />
                                <Text style={styles.pageStatSubText}>{pg.members} Members</Text>
                              </View>
                              <View style={styles.pageStatSubItem}>
                                <View style={[styles.statusDotSolid, { backgroundColor: '#10B981' }]} />
                                <Text style={[styles.pageStatSubText, { color: '#10B981', fontWeight: '700' }]}>{pg.statusText}</Text>
                              </View>
                            </View>

                            {/* Card Footer Buttons */}
                            <View style={styles.pageCardFooterRow}>
                              <Pressable
                                style={[styles.pageFooterBtn, isDark ? styles.borderDark : styles.borderLight]}
                                onPress={() => setActiveModal('sub_manager')}
                              >
                                <Ionicons name="pencil-outline" size={14} color="#64748B" />
                                <Text style={[styles.pageFooterBtnText, isDark ? styles.textDark : styles.textLight]}>Edit & Plans</Text>
                              </Pressable>

                              <Pressable
                                style={[styles.pageFooterBtn, isDark ? styles.borderDark : styles.borderLight]}
                                onPress={() => {
                                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  Alert.alert('Subscribers', `Active subscribers for ${pg.title}: 0 members.`);
                                }}
                              >
                                <Ionicons name="people-outline" size={14} color="#64748B" />
                                <Text style={[styles.pageFooterBtnText, isDark ? styles.textDark : styles.textLight]}>Subscribers</Text>
                              </Pressable>

                              <Pressable
                                style={[styles.trashIconBtn, isDark ? styles.borderDark : styles.borderLight]}
                                onPress={() => {
                                  Alert.alert('Delete Page', `Delete ${pg.title}?`, [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Delete', style: 'destructive' },
                                  ]);
                                }}
                              >
                                <Ionicons name="trash-outline" size={14} color="#EF4444" />
                              </Pressable>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* COCKPIT 5: PAYOUT BANK KYC */}
                {subSection === 'kyc' && (
                  <View style={{ marginTop: 12 }}>
                    <View style={[styles.afSectionCard, isDark ? styles.cardDark : styles.cardLight]}>
                      <View style={styles.afSectionHeader}>
                        <View style={[styles.afSectionIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                          <Ionicons name="card" size={16} color="#10B981" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.afSectionTitle, isDark ? styles.textDark : styles.textLight]}>
                            Verified Payout Bank Account
                          </Text>
                          <Text style={styles.afSectionSubtitle}>
                            Automated 90% settlements with 7-day rolling fraud protection
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.bankConnectedCard, isDark ? styles.borderDark : styles.borderLight, { marginTop: 10 }]}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#94A3B8' }}>BENEFICIARY HOLDER</Text>
                            <View style={styles.readinessStepDoneBadge}>
                              <Text style={styles.readinessStepDoneText}>✓ Verified Active</Text>
                            </View>
                          </View>
                          <Text style={[styles.bankHolderName, isDark ? styles.textDark : styles.textLight, { marginTop: 4, fontSize: 15 }]}>
                            {TELESUB_WEB_STATS.connectedBank.accountHolder}
                          </Text>
                          <Text style={[styles.bankStatusText, { marginTop: 4 }]}>
                            Status: Razorpay Route Connected • Automated 7-day rolling bank payouts
                          </Text>
                        </View>
                      </View>

                      <Pressable
                        style={[styles.actionBtnPrimary, { marginTop: 12 }]}
                        onPress={() => {
                          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          Alert.alert('Payout Bank Settings', 'Your bank account is fully verified for automated daily payouts.');
                        }}
                      >
                        <Ionicons name="shield-checkmark-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.actionBtnPrimaryText}>Manage Razorpay Route KYC</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Interactive Modals for all 8 Tools */}
      <AutoforwardModal
        visible={activeModal === "autoforward"}
        onClose={() => setActiveModal(null)}
        onSubmit={createForwardRule}
        isLoading={isSavingRule}
        chats={chats || []}
        onRefreshChats={syncChats}
      />

      <TelegramLoginModal
        visible={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => {
          handleRefreshAll();
        }}
        onStartLogin={(phone) => telegramApi.startLogin(phone)}
        onVerifyOtp={(payload) => telegramApi.verifyOtp(payload)}
        onSubmitPassword={(password) => telegramApi.submitPassword(password)}
      />

      <SubManagerModal
        visible={activeModal === "sub_manager"}
        onClose={() => setActiveModal(null)}
        onSubmit={createSubPlan}
        isLoading={isCreatingPlan}
        chats={chats || []}
      />

      <TrackerModal
        visible={activeModal === "tracker"}
        onClose={() => setActiveModal(null)}
      />

      <ReportBotModal
        visible={activeModal === "report_bot"}
        onClose={() => setActiveModal(null)}
      />

      <BroadcastModal
        visible={activeModal === "broadcast"}
        onClose={() => setActiveModal(null)}
        onSubmit={sendBroadcast}
        isLoading={isBroadcasting}
        chats={chats || []}
      />

      <AutoApproveModal
        visible={activeModal === "auto_approve"}
        onClose={() => setActiveModal(null)}
        onToggle={async (enabled) => {
          await toggleAutoApprove({
            enabled,
            channelId: "@my_private_channel",
          });
        }}
      />

      <ChatBotModal
        visible={activeModal === "chatbot"}
        onClose={() => setActiveModal(null)}
      />

      <ReactionsModal
        visible={activeModal === "reactions"}
        onClose={() => setActiveModal(null)}
        onUpdate={async (emojis, speed) => {
          await updateReactions({ emojis, speed });
        }}
      />

      {/* Floating Home-Style Product Bottom Navigation Bar */}
      <ProductFloatingBottomBar
        items={TELEGRAM_TABS}
        activeKey={activeTab}
        onChangeTab={(key) => handleTabChange(key as TelegramTab)}
        accentColor="#0284C7"
        moreMenuTitle="Telegram Platform Tools"
      />
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 160 },
  tabBarWrapper: {
    borderBottomWidth: 1,
  },
  borderLight: { borderBottomColor: "#E2E8F0", borderTopColor: "#E2E8F0" },
  borderDark: { borderBottomColor: "#262C36", borderTopColor: "#262C36" },
  tabScroll: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabButtonLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
  },
  tabButtonDark: {
    backgroundColor: "#161B26",
    borderColor: "#262C36",
  },
  tabButtonActive: {
    backgroundColor: "#0284C7",
    borderColor: "#0284C7",
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  tabButtonTextLight: { color: "#64748B" },
  tabButtonTextDark: { color: "#94A3B8" },
  tabButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  commandCenterCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  commandHeader: {
    flexDirection: 'column',
    gap: 10,
  },
  sessionPillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  headerBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  refreshHeaderBtn: {
    flex: 1,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
  },
  refreshHeaderBtnLight: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  refreshHeaderBtnDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  refreshHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sessionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sessionDotGreen: {
    backgroundColor: "#10B981",
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  sessionDotYellow: {
    backgroundColor: "#F59E0B",
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  sessionStatusText: {
    fontSize: 13,
    fontWeight: "700",
  },
  syncHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(2, 132, 199, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  syncHeaderBtnText: {
    color: "#0284C7",
    fontSize: 11,
    fontWeight: "700",
  },
  connectHeaderBtn: {
    flex: 1,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    borderRadius: 10,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  connectHeaderBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  hubMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 4,
  },
  hubMetricCard: {
    width: '48.5%',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'space-between',
    minHeight: 88,
  },
  hubMetricCardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  hubMetricCardLight: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  hubMetricCardPressed: {
    opacity: 0.75,
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    borderColor: '#0284C7',
  },
  hubMetricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  hubMetricLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    flex: 1,
  },
  hubMetricIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubMetricValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginVertical: 2,
  },
  hubMetricFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  hubMetricSub: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
    flex: 1,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: 1,
    paddingTop: 12,
    rowGap: 12,
  },
  metricItem: {
    width: "50%",
    paddingRight: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metricItemPressed: {
    opacity: 0.7,
    backgroundColor: "rgba(2, 132, 199, 0.08)",
  },
  metricHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 4,
  },
  metricFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 4,
    marginTop: 2,
  },
  metricLabel: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 2,
  },
  metricSub: {
    fontSize: 10,
    color: "#94A3B8",
  },
  quickLaunchScroll: {
    paddingVertical: 6,
    gap: 8,
    marginBottom: 14,
  },
  quickLaunchPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickLaunchText: {
    fontSize: 12,
    fontWeight: "700",
  },
  categorySection: {
    marginBottom: 12,
  },
  categoryScroll: {
    gap: 8,
    marginTop: 8,
  },
  afPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  pillLight: { backgroundColor: "#FFFFFF", borderColor: "#E2E8F0" },
  pillDark: { backgroundColor: "#161B26", borderColor: "#262C36" },
  catPillSelected: {
    backgroundColor: "#0284C7",
    borderColor: "#0284C7",
  },
  catPillText: {
    fontSize: 11,
    fontWeight: "600",
  },
  catPillTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  sectionSub: {
    fontSize: 12,
    color: "#64748B",
  },
  textLight: { color: "#0F172A" },
  textDark: { color: "#F8FAFC" },
  cardLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: "#161B26",
    borderColor: "#262C36",
  },
  telesubCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  revenueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  revenueLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  revenueVal: {
    color: "#0284C7",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4,
  },
  actionBtnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0284C7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnPrimaryText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  planCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  planTitle: { fontSize: 14, fontWeight: "700" },
  planPrice: { color: "#0284C7", fontSize: 14, fontWeight: "800" },
  planSubtitle: { color: "#64748B", fontSize: 12, marginTop: 4 },
  planFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  planSubs: { color: "#64748B", fontSize: 11, fontWeight: "600" },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(2, 132, 199, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  copyBtnText: { color: "#0284C7", fontSize: 11, fontWeight: "700" },
  ruleCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  ruleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  ruleTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  ruleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  ruleName: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  delayBadge: {
    backgroundColor: "rgba(2, 132, 199, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  delayBadgeText: {
    color: "#0284C7",
    fontSize: 10,
    fontWeight: "700",
  },
  routeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(148, 163, 184, 0.08)",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  routeEndpoint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  routeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  keywordsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  kwTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  kwTagLight: {
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
  },
  kwTagDark: {
    backgroundColor: "#0F172A",
    borderColor: "#334155",
  },
  kwTagText: {
    fontSize: 11,
    color: "#0284C7",
    fontWeight: "600",
  },
  autoCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  autoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  autoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(2, 132, 199, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  autoTitle: { fontSize: 14, fontWeight: "700" },
  autoDesc: { color: "#64748B", fontSize: 12, marginTop: 2 },
  broadcastBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    marginBottom: 16,
  },
  broadcastBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(2, 132, 199, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  broadcastBannerTitle: { fontSize: 15, fontWeight: "700" },
  broadcastBannerDesc: { color: "#64748B", fontSize: 12, marginTop: 2 },
  historyCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyTitle: { fontSize: 13, fontWeight: "700" },
  historyTime: { color: "#64748B", fontSize: 11 },
  historyDesc: { color: "#64748B", fontSize: 12, marginTop: 4 },
  emptyCard: {
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    textAlign: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 300,
  },
  syncedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  syncedBadgeText: { color: "#059669", fontSize: 11, fontWeight: "700" },
  botCountBadge: {
    backgroundColor: "rgba(2, 132, 199, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  botCountBadgeText: { color: "#0284C7", fontSize: 11, fontWeight: "700" },
  botCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  botCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  botAvatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#0284C7",
    justifyContent: "center",
    alignItems: "center",
  },
  botAvatarText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  botTitle: { fontSize: 14, fontWeight: "700", flex: 1 },
  botUsername: {
    color: "#0284C7",
    fontSize: 12,
    marginTop: 1,
    fontWeight: "600",
  },
  activePill: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activePillText: { color: "#059669", fontSize: 9, fontWeight: "800" },
  createLinkBtn: {
    backgroundColor: "rgba(2, 132, 199, 0.1)",
    borderWidth: 1,
    borderColor: "#0284C7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  createLinkBtnText: { color: "#0284C7", fontSize: 11, fontWeight: "700" },
  mappedChannelsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    flexWrap: "wrap",
  },
  mappedLabel: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  channelTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  channelTagText: { color: "#059669", fontSize: 11, fontWeight: "600" },
  noChannelsText: { color: "#94A3B8", fontSize: 11, fontStyle: "italic" },
  // Autoforwarding Pipeline Styles
  pipelineHeroCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  pipelineHeroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  pipelineHeroLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  pipelineHeroIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(2, 132, 199, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  pipelineHeroTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  pipelineHeroSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  pipelineStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pipelineStatusText: {
    color: "#059669",
    fontSize: 11,
    fontWeight: "700",
  },
  flowDiagramBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  flowDiagramDark: { backgroundColor: "rgba(15, 23, 42, 0.6)" },
  flowDiagramLight: { backgroundColor: "rgba(241, 245, 249, 0.8)" },
  flowNode: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  flowNodeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  flowArrowBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  flowFilterTag: {
    fontSize: 9,
    fontWeight: "800",
    color: "#0284C7",
    backgroundColor: "rgba(2, 132, 199, 0.12)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stationActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emptyIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  ruleEditBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: "rgba(148, 163, 184, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  routeBoxDark: {
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    borderColor: "rgba(51, 65, 85, 0.6)",
  },
  routeBoxLight: {
    backgroundColor: "rgba(248, 250, 252, 0.9)",
    borderColor: "#E2E8F0",
  },
  routeDotIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  routeLabelSmall: {
    fontSize: 8,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  routeConnector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  routeConnectorLine: {
    width: 14,
    height: 1.5,
    backgroundColor: "#0284C7",
  },
  keywordsSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(148, 163, 184, 0.12)",
  },
  keywordsSectionLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  // AutoForward Control Styles (Matching Web 1:1)
  afControlCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  afControlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  afControlHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 160,
  },
  afHeroIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(2, 132, 199, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  afHeroTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  afSystemActiveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  afSystemActiveText: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "600",
  },
  afHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: 'wrap',
  },
  afGhostBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  afGhostBtnLight: {
    backgroundColor: "rgba(241, 245, 249, 0.9)",
    borderColor: "#CBD5E1",
  },
  afGhostBtnDark: {
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    borderColor: "#334155",
  },
  afGhostBtnText: { fontSize: 11, fontWeight: "700" },
  afIconBtn: {
    padding: 7,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  afOpenBotBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#0284C7",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  afOpenBotBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  afKpiScroll: {
    paddingVertical: 4,
    gap: 10,
    marginBottom: 16,
  },
  afKpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  afKpiCard: {
    width: '47%',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  afKpiIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  afKpiValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  afKpiCardActive: {
    borderColor: '#0284C7',
    borderWidth: 2,
  },
  afKpiSub: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "600",
  },
  afSectionsStack: {
    gap: 14,
    marginBottom: 16,
  },
  afSectionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  afSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  afSectionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(2, 132, 199, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  afSectionTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  afSectionSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  afEmptyBox: {
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  afEmptyBoxLight: { backgroundColor: "rgba(241, 245, 249, 0.6)" },
  afEmptyBoxDark: { backgroundColor: "rgba(15, 23, 42, 0.4)" },
  afEmptyText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
  },
  afMappingsList: {
    gap: 10,
  },
  afMappingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  afMappingRowLight: {
    backgroundColor: "rgba(248, 250, 252, 0.9)",
    borderColor: "#E2E8F0",
  },
  afMappingRowDark: {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderColor: "#334155",
  },
  afMappingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 60,
  },
  afMappingArrowCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(2, 132, 199, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  afSourceChannelName: {
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
  afTargetBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: '48%',
    flexShrink: 1,
  },
  afTargetBadgeLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
  },
  afTargetBadgeDark: {
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderColor: "#475569",
  },
  afTargetBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  afDelayBigBox: {
    paddingVertical: 24,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  afDelayBigNumber: {
    fontSize: 32,
    fontWeight: "900",
  },
  afDelayBigLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
    marginTop: 2,
  },
  afPrefixSuffixStack: {
    gap: 12,
  },
  afInputLabelSmall: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  afInputDisplayBox: {
    padding: 12,
    borderRadius: 10,
  },
  afInputDisplayText: {
    fontSize: 12,
    color: "#94A3B8",
    fontStyle: "italic",
  },
  // GAP Tracker Styles
  trackerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  trackerBadgeGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  trackerBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 3,
  },
  trackerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  trackerConsoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  trackerConsoleBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  trackerTabBar: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    gap: 2,
    marginBottom: 12,
  },
  trackerTabBtn: {
    flex: 1,
    minWidth: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    gap: 4,
  },
  trackerTabBtnActiveLight: {
    backgroundColor: '#E0F2FE',
  },
  trackerTabBtnActiveDark: {
    backgroundColor: '#0369A1',
  },
  trackerTabBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  trackerTabBtnTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  trackerTabBadge: {
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  trackerTabBadgeActive: {
    backgroundColor: '#0284C7',
  },
  trackerTabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  trackerTabBadgeTextActive: {
    color: '#FFFFFF',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: '47%',
    flexGrow: 0,
    flexShrink: 0,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  kpiIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiNumber: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  kpiLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  kpiHint: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  matrixCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  matrixHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  matrixHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 150,
  },
  matrixTitle: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  periodBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  periodBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  chanCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  chanCardLight: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  chanCardDark: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderColor: '#334155',
  },
  chanCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  chanName: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    minWidth: 100,
  },
  periodJoinsPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  periodJoinsPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  chanStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
    marginBottom: 8,
  },
  chanStatItem: {
    alignItems: 'center',
  },
  chanStatLbl: {
    fontSize: 8,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  chanStatVal: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  chanLinksWrap: {
    gap: 6,
  },
  linkJoinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(2, 132, 199, 0.06)',
  },
  linkJoinPillTitle: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    marginLeft: 6,
  },
  linkJoinPillBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  linkJoinPillBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  usersSection: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  usersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  usersHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  usersTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  usersCountText: {
    fontSize: 11,
    color: '#64748B',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    padding: 0,
  },
  filterPillScroll: {
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1,
  },
  filterPillLight: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  filterPillDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  filterPillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
  },
  userRowLight: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  userRowDark: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderColor: '#334155',
  },
  userRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 12,
    fontWeight: '700',
  },
  userSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  userTime: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 1,
  },
  userStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  userStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  // Rich Section Styles
  planCardNew: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  planCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  planBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  planChanBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  planChanBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  planSubsCountBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  planSubsCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  planPriceWrap: {
    alignItems: 'flex-end',
  },
  planPriceVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0284C7',
  },
  planPricePeriod: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  planFeatureList: {
    marginVertical: 10,
    gap: 6,
  },
  planFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  planFeatureText: {
    fontSize: 12,
    color: '#64748B',
  },
  planActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
  },
  subKpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  subKpiCard: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  subKpiVal: {
    fontSize: 18,
    fontWeight: '800',
  },
  subKpiLbl: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  landingCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  landingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  landingTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  landingThemeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
  },
  landingThemeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EC4899',
  },
  landingUrlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
    marginVertical: 8,
  },
  landingUrlText: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '600',
    flex: 1,
  },
  landingStatsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
    marginVertical: 6,
  },
  landingStatItem: {
    alignItems: 'center',
  },
  landingStatVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  landingStatLbl: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 2,
    letterSpacing: 0.4,
  },
  bcCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  bcHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  bcTargetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bcTargetBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  bcTimeText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  bcTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 6,
  },
  bcMsgBox: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(148, 163, 184, 0.06)',
    marginBottom: 10,
  },
  bcMsgText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#64748B',
  },
  bcBtnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  bcInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#0284C7',
  },
  bcInlineBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bcFooterStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
  },
  bcStatText: {
    fontSize: 11,
    color: '#64748B',
  },
  afFilterList: {
    gap: 8,
    marginTop: 10,
  },
  afFilterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  afFilterFrom: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  afFilterTo: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  afChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  afBlockedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  afBlockedChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },
  afDelayPresetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  afDelayPresetBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  afDelayPresetBtnActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  afDelayPresetText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rcCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  rcHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rcChanTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  rcActivePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rcActivePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  rcEmojiWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 8,
  },
  rcEmojiBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  rcEmojiText: {
    fontSize: 14,
  },
  rcStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
  },
  rcStatVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  aiCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  aiName: {
    fontSize: 14,
    fontWeight: '700',
  },
  aiModelBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  aiModelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  aiPromptBox: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(148, 163, 184, 0.06)',
    marginVertical: 8,
  },
  aiPromptText: {
    fontSize: 11,
    lineHeight: 16,
    color: '#64748B',
    fontStyle: 'italic',
  },
  aiMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  aiMetricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiMetricText: {
    fontSize: 11,
    color: '#64748B',
  },
  aaCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  aaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  aaChanName: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  aaBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  aaBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  aaTemplateBox: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(148, 163, 184, 0.06)',
    marginVertical: 8,
  },
  aaTemplateLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 4,
  },
  aaTemplateText: {
    fontSize: 11,
    lineHeight: 16,
    color: '#64748B',
  },
  repCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  repHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  repTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  repFormatBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  repFormatText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  repDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  repDetailText: {
    fontSize: 11,
    color: '#64748B',
  },
  // TeleSub Web Parity Styles
  subBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  subBadgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#0F172A',
  },
  subBadgePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subBadgeGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  subBadgeGreenText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  teleStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  teleStatCard: {
    width: '48.5%',
    flexGrow: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  teleStatVal: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  teleStatLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  teleStatSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  readinessBanner: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  readinessHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  readinessTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  readinessBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  readinessBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
  },
  readinessGreenCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  readinessGreenTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
    marginBottom: 2,
  },
  readinessGreenSub: {
    fontSize: 11,
    color: '#047857',
    lineHeight: 16,
  },
  readinessStepsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  readinessStepItem: {
    width: '48.5%',
    flexGrow: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  readinessStepTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  readinessStepNum: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  readinessStepDoneBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  readinessStepDoneText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10B981',
  },
  readinessStepTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  readinessStepDesc: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
  },
  finSectionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  finSectionHeader: {
    marginBottom: 14,
  },
  finSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  finSectionSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  finActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  finWithdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  finWithdrawBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  finManageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  finManageBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  finKpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 12,
  },
  finKpiCard: {
    width: '48.5%',
    flexGrow: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  finKpiVal: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  finKpiLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  finKpiSub: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
  },
  holdsExplainer: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 10,
  },
  holdsExplainerTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  holdsExplainerText: {
    fontSize: 10,
    lineHeight: 15,
    color: '#64748B',
    marginBottom: 10,
  },
  holdsFlowGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  holdsFlowItem: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  holdsFlowTitle: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  holdsFlowSub: {
    fontSize: 8,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 1,
  },
  bankConnectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 10,
  },
  bankHolderName: {
    fontSize: 13,
    fontWeight: '800',
  },
  bankStatusText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  txnsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
  },
  txnsTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  txnTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
  },
  txnIdText: {
    fontSize: 11,
    fontWeight: '700',
  },
  txnDateText: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 1,
  },
  txnAmountCol: {
    alignItems: 'flex-end',
  },
  txnGrossText: {
    fontSize: 12,
    fontWeight: '800',
  },
  txnNetText: {
    fontSize: 9,
    color: '#10B981',
    fontWeight: '700',
    marginTop: 1,
  },
  txnStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  txnStatusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  webCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  webIconCircleBlue: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webIconCirclePurple: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webHeaderActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  ownerBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  ownerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
  },
  webSmallActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  webSmallActionBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  channelControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.15)',
  },
  channelTabGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chanTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
  },
  chanTabPillActive: {
    backgroundColor: '#0F172A',
  },
  chanTabText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  chanTabTextActive: {
    color: '#FFFFFF',
  },
  channelRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchBoxSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 130,
  },
  searchBoxSmallInput: {
    fontSize: 11,
    padding: 0,
    minWidth: 80,
  },
  monetizedChanCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  monetizedChanTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  monetizedAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monetizedAvatarText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#4F46E5',
  },
  monetizedTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  monetizedIdText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  botActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  botActiveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
  },
  monetizedChanActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.12)',
  },
  webChanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  webChanBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  createPageChanBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  createPageChanBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  trashIconBtn: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewModeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    padding: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
  },
  viewModeBtn: {
    padding: 4,
    borderRadius: 6,
  },
  viewModeBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  newPageBtnSolid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  newPageBtnSolidText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  checkoutPageCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  checkoutPageTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pageLogoSquare: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutPageTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  checkoutPagePath: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  webTogglePill: {
    width: 36,
    height: 20,
    borderRadius: 10,
    padding: 2,
    justifyContent: 'center',
  },
  webToggleActive: {
    backgroundColor: '#10B981',
    alignItems: 'flex-end',
  },
  webToggleInactive: {
    backgroundColor: '#94A3B8',
    alignItems: 'flex-start',
  },
  webToggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  webToggleThumbActive: {},
  webToggleThumbInactive: {},
  pageUrlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
  },
  pageUrlBoxText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    flex: 1,
    marginRight: 6,
  },
  pageUrlIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pageUrlIconButton: {
    padding: 3,
  },
  pageStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  pageStatSubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pageStatSubText: {
    fontSize: 10,
    color: '#64748B',
  },
  pageCardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.12)',
  },
  pageFooterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  pageFooterBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusDotSolid: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  inputDark: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    color: '#F8FAFC',
  },
  inputLight: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    color: '#0F172A',
  },
});
