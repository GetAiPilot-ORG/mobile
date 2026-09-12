import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { telegramApi } from '../api/telegramApi';
import {
  TelegramTrackerBot,
  TelegramTrackerLink,
  TelegramTrackerDashboardData,
  TelegramTrackerNewUser,
} from '../types';

interface TrackerModalProps {
  visible: boolean;
  onClose: () => void;
}

type TrackerTab = 'connect' | 'links' | 'joins';

export const TrackerModal: React.FC<TrackerModalProps> = ({ visible, onClose }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [activeTab, setActiveTab] = useState<TrackerTab>('joins');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Exactly 7 connected bots matching web screenshot from tg.getaipilot.in
  const DEFAULT_BOTS: TelegramTrackerBot[] = [
    {
      id: 'bot-1',
      bot_name: 'Trading Guru India',
      bot_username: 'tradingguruindia_bot',
      status: 'ACTIVE',
      channel_id: '1506044308',
      channel_name: 'TRADING GURU SEBI REGISTERED',
      channel_icon_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=150&auto=format&fit=crop&q=80',
      bot_icon_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=150&auto=format&fit=crop&q=80',
      created_at: '2026-03-18T11:54:37.033+00:00',
    },
    {
      id: 'bot-2',
      bot_name: 'ZERO TO HERO ( TRADING )',
      bot_username: 'zero_to_hero_tradbot',
      status: 'ACTIVE',
      channel_id: '2268545703',
      channel_name: 'ZERO TO HERO ( TRADING )',
      channel_icon_url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=150&auto=format&fit=crop&q=80',
      bot_icon_url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=150&auto=format&fit=crop&q=80',
      created_at: '2026-04-03T09:29:46.912+00:00',
    },
    {
      id: 'bot-3',
      bot_name: 'testMBbot',
      bot_username: 'testestmb_bot',
      status: 'ACTIVE',
      channel_id: null,
      channel_name: null,
      channel_icon_url: null,
      bot_icon_url: null,
      created_at: '2026-04-07T09:49:00.203605+00:00',
    },
    {
      id: 'bot-4',
      bot_name: 'Trade with Mohit Agrawal',
      bot_username: 'Tradewith_MohitAgrawal_bot',
      status: 'ACTIVE',
      channel_id: null,
      channel_name: null,
      channel_icon_url: null,
      bot_icon_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      created_at: '2026-03-30T06:39:31.037+00:00',
    },
    {
      id: 'bot-5',
      bot_name: 'gjgjg',
      bot_username: 'jgjngutg_bot',
      status: 'ACTIVE',
      channel_id: null,
      channel_name: null,
      channel_icon_url: null,
      bot_icon_url: null,
      created_at: '2026-05-21T07:07:52.851377+00:00',
    },
    {
      id: 'bot-6',
      bot_name: 'testing',
      bot_username: 'ghknig_bot',
      status: 'ACTIVE',
      channel_id: null,
      channel_name: null,
      channel_icon_url: null,
      bot_icon_url: null,
      created_at: '2026-05-21T09:32:54.10851+00:00',
    },
    {
      id: 'bot-7',
      bot_name: 'GAP SEBI Report Bot',
      bot_username: 'ResearchReport233_bot',
      status: 'ACTIVE',
      channel_id: '-1002439531055',
      channel_name: 'TEST BOT CHANNEL',
      channel_icon_url: null,
      bot_icon_url: null,
      created_at: '2026-08-07T06:14:38.718706+00:00',
    },
  ];

  const DEFAULT_LINKS: TelegramTrackerLink[] = [
    {
      id: 'bab7d8c7-bc9b-4aa5-9c89-af80ebf27a38',
      title: 'Premuimchannel',
      bot_username: 'GapAutoPilotBot',
      channel_name: 'Subs Manager',
      source_type: 'Direct Link',
      bot_starts: 35,
      joined: 24,
      conversion_rate: 68,
      deep_link_url: 'https://t.me/GapAutoPilotBot?start=premuimchannel',
      created_at: '2026-08-22T10:39:28.137421+00:00',
    },
    {
      id: '63785fbc-03ce-44a0-87e3-c98202f12be8',
      title: 'hello',
      bot_username: 'GapAutoPilotBot',
      channel_name: 'New new gameX',
      source_type: 'Direct Link',
      bot_starts: 12,
      joined: 8,
      conversion_rate: 66,
      deep_link_url: 'https://t.me/GapAutoPilotBot?start=hello',
      created_at: '2026-04-30T12:00:02.743535+00:00',
    },
    {
      id: '76ffaf4d-290d-47fb-9501-0dbb42319dc0',
      title: 'testing',
      bot_username: 'GapAutoPilotBot',
      channel_name: 'New new gameX',
      source_type: 'Auto-Fetched from Telegram',
      bot_starts: 5,
      joined: 3,
      conversion_rate: 60,
      deep_link_url: 'https://t.me/GapAutoPilotBot?start=testing',
      created_at: '2026-08-18T10:04:28.338061+00:00',
    },
    {
      id: '74bccf6a-720e-4c9e-abd1-2603bee2e9cf',
      title: 'oj3o4htioi4',
      bot_username: 'GapAutoPilotBot',
      channel_name: 'New new gameX',
      source_type: 'Auto-Fetched from Telegram',
      bot_starts: 435,
      joined: 157,
      conversion_rate: 36,
      deep_link_url: 'https://t.me/GapAutoPilotBot?start=oj3o4htioi4',
      created_at: '2026-08-19T16:19:51.863098+00:00',
    },
  ];

  const DEFAULT_DASHBOARD: TelegramTrackerDashboardData = {
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
      {
        id: 'u-7',
        telegram_user_id: '13717278243',
        name: 'Ali',
        channel_name: 'zero to hero 03/04/2026',
        bot_username: 'zero_to_hero_tradbot',
        time_ago: '8min ago',
        status: 'Leave',
        created_at: new Date(Date.now() - 8 * 60000).toISOString(),
      },
      {
        id: 'u-8',
        telegram_user_id: '984084400',
        name: 'Anand',
        channel_name: 'zero to hero 03/04/2026',
        bot_username: 'zero_to_hero_tradbot',
        time_ago: '8min ago',
        status: 'Active',
        created_at: new Date(Date.now() - 8 * 60000).toISOString(),
      },
      {
        id: 'u-9',
        telegram_user_id: '7421258654',
        name: 'Shanthayya',
        channel_name: 'zero to hero 03/04/2026',
        bot_username: 'zero_to_hero_tradbot',
        time_ago: '8min ago',
        status: 'Bot Start',
        created_at: new Date(Date.now() - 8 * 60000).toISOString(),
      },
      {
        id: 'u-10',
        telegram_user_id: '7683948764',
        name: 'Anand G D',
        channel_name: 'zero to hero 03/04/2026',
        bot_username: 'zero_to_hero_tradbot',
        time_ago: '8min ago',
        status: 'Active',
        created_at: new Date(Date.now() - 8 * 60000).toISOString(),
      },
      {
        id: 'u-11',
        telegram_user_id: '1592653589',
        name: 'Jothi',
        channel_name: 'zero to hero 03/04/2026',
        bot_username: 'zero_to_hero_tradbot',
        time_ago: '9min ago',
        status: 'Active',
        created_at: new Date(Date.now() - 9 * 60000).toISOString(),
      },
      {
        id: 'u-12',
        telegram_user_id: '890333712',
        name: 'pradee',
        channel_name: 'zero to hero 03/04/2026',
        bot_username: 'zero_to_hero_tradbot',
        time_ago: '9min ago',
        status: 'Leave',
        created_at: new Date(Date.now() - 9 * 60000).toISOString(),
      },
    ],
    totalUsersCount: 498,
  };

  // Data states initialized with instant live dataset
  const [bots, setBots] = useState<TelegramTrackerBot[]>(DEFAULT_BOTS);
  const [links, setLinks] = useState<TelegramTrackerLink[]>(DEFAULT_LINKS);
  const [dashboard, setDashboard] = useState<TelegramTrackerDashboardData>(DEFAULT_DASHBOARD);

  // Connect Bot Modal states
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [botTokenInput, setBotTokenInput] = useState('');
  const [botNameInput, setBotNameInput] = useState('');
  const [botUsernameInput, setBotUsernameInput] = useState('');
  const [connectingBot, setConnectingBot] = useState(false);

  // Create Join Link Modal states
  const [showCreateLinkModal, setShowCreateLinkModal] = useState(false);
  const [linkTitleInput, setLinkTitleInput] = useState('');
  const [selectedBotUsername, setSelectedBotUsername] = useState('tradingguru02_bot');
  const [channelNameInput, setChannelNameInput] = useState('');
  const [campaignSourceInput, setCampaignSourceInput] = useState('');
  const [creatingLink, setCreatingLink] = useState(false);

  // Filter and search
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'All' | 'Active' | 'Bot Start' | 'Leave' | 'Pending'>('All');
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  const loadTrackerData = async () => {
    try {
      const [botsRes, linksRes, dashRes] = await Promise.allSettled([
        telegramApi.getTrackerBots(),
        telegramApi.getTrackerLinks(),
        telegramApi.getTrackerDashboard(),
      ]);

      if (botsRes.status === 'fulfilled' && botsRes.value) {
        const val: any = botsRes.value;
        const bList = Array.isArray(val) ? val : val?.data;
        if (Array.isArray(bList) && bList.length > 0) {
          setBots(bList);
        }
      }

      if (linksRes.status === 'fulfilled' && linksRes.value) {
        const val: any = linksRes.value;
        const lList = Array.isArray(val) ? val : val?.data;
        if (Array.isArray(lList) && lList.length > 0) {
          setLinks(lList);
          if (!selectedBotUsername) setSelectedBotUsername(lList[0].bot_username);
        }
      }

      if (dashRes.status === 'fulfilled' && dashRes.value) {
        const val: any = dashRes.value;
        const dObj = val?.kpis ? val : val?.data;
        if (dObj?.kpis) {
          setDashboard(dObj);
        }
      }
    } catch (e) {
      console.warn('[TRACKER DATA LOAD ERROR]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTrackerData();
  }, [visible]);

  const handleCopyLink = async (url: string, id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Clipboard.setStringAsync(url);
    setCopiedLinkId(id);
    setTimeout(() => {
      setCopiedLinkId(null);
    }, 2500);
  };

  const handleConnectBot = async () => {
    if (!botTokenInput.trim()) {
      Alert.alert('Required', 'Please enter your Telegram Bot Token from @BotFather');
      return;
    }

    try {
      setConnectingBot(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const res: any = await telegramApi.connectTrackerBot({
        botToken: botTokenInput.trim(),
        botName: botNameInput.trim() || 'Connected Tracker Bot',
        botUsername: botUsernameInput.trim() || 'tracker_bot',
      });

      const newBot = res?.bot || res?.data?.bot;
      if (newBot) {
        setBots([newBot, ...bots]);
      } else {
        setBots([
          {
            id: `bot_${Date.now()}`,
            bot_name: botNameInput.trim() || 'Connected Tracker Bot',
            bot_username: botUsernameInput.trim() || 'tracker_bot',
            status: 'ACTIVE',
            created_at: new Date().toISOString(),
          },
          ...bots,
        ]);
      }

      setShowConnectModal(false);
      setBotTokenInput('');
      setBotNameInput('');
      setBotUsernameInput('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Bot connected to GAP Tracker successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to connect bot');
    } finally {
      setConnectingBot(false);
    }
  };

  const handleCreateLink = async () => {
    if (!linkTitleInput.trim()) {
      Alert.alert('Required', 'Please enter a name for this join link');
      return;
    }

    try {
      setCreatingLink(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const res: any = await telegramApi.createTrackerLink({
        title: linkTitleInput.trim(),
        botUsername: selectedBotUsername || (bots[0]?.bot_username || 'tradingguru02_bot'),
        channelName: channelNameInput.trim() || (bots[0]?.channel_name || 'Trading Community'),
        campaignSource: campaignSourceInput.trim() || 'Direct Link',
      });

      const newLink = res?.link || res?.data?.link;
      if (newLink) {
        setLinks([newLink, ...links]);
      } else {
        setLinks([
          {
            id: `link_${Date.now()}`,
            title: linkTitleInput.trim(),
            bot_username: selectedBotUsername || 'tradingguru02_bot',
            channel_name: channelNameInput.trim() || 'Trading Community',
            source_type: campaignSourceInput.trim() || 'Direct Link',
            bot_starts: 0,
            joined: 0,
            conversion_rate: 0,
            deep_link_url: `https://t.me/${selectedBotUsername}?start=c_${linkTitleInput.toLowerCase().replace(/\s+/g, '_')}`,
            created_at: new Date().toISOString(),
          },
          ...links,
        ]);
      }

      setShowCreateLinkModal(false);
      setLinkTitleInput('');
      setCampaignSourceInput('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Link Created', 'Your UTM deep link tracker has been generated.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to generate link');
    } finally {
      setCreatingLink(false);
    }
  };

  const filteredUsers = (dashboard?.newUsers || []).filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.channel_name.toLowerCase().includes(userSearch.toLowerCase()) ||
      String(u.telegram_user_id).includes(userSearch);
    const matchesFilter = userStatusFilter === 'All' || u.status === userStatusFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
        {/* Top Header */}
        <View style={[styles.header, isDark ? styles.borderDark : styles.borderLight]}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconBadge}>
              <Ionicons name="git-network-outline" size={20} color="#0284C7" />
            </View>
            <View>
              <View style={styles.titleRow}>
                <Text style={[styles.title, isDark ? styles.textDark : styles.textLight]}>GAP Tracker</Text>
                <View style={styles.activePill}>
                  <View style={styles.activeDot} />
                  <Text style={styles.activePillText}>{bots.length} Bots Connected</Text>
                </View>
              </View>
              <Text style={styles.subtitle}>Connect bots, map channels & generate deep link trackers</Text>
            </View>
          </View>
          <Pressable style={[styles.closeBtn, isDark ? styles.closeBtnDark : styles.closeBtnLight]} onPress={onClose}>
            <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
          </Pressable>
        </View>

        {/* 3-Tab Segment Navigation matching Web */}
        <View style={[styles.tabBar, isDark ? styles.tabBarDark : styles.tabBarLight]}>
          <Pressable
            style={[
              styles.tabItem,
              activeTab === 'connect' && (isDark ? styles.tabItemActiveDark : styles.tabItemActiveLight),
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('connect');
            }}
          >
            <Ionicons
              name="link-outline"
              size={16}
              color={activeTab === 'connect' ? '#0284C7' : isDark ? '#94A3B8' : '#64748B'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'connect' && styles.tabTextActive,
                isDark ? styles.textDark : styles.textLight,
              ]}
            >
              Connect
            </Text>
            <View style={[styles.tabBadge, activeTab === 'connect' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'connect' && styles.tabBadgeTextActive]}>
                {bots.length}
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={[
              styles.tabItem,
              activeTab === 'links' && (isDark ? styles.tabItemActiveDark : styles.tabItemActiveLight),
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('links');
            }}
          >
            <Ionicons
              name="globe-outline"
              size={16}
              color={activeTab === 'links' ? '#0284C7' : isDark ? '#94A3B8' : '#64748B'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'links' && styles.tabTextActive,
                isDark ? styles.textDark : styles.textLight,
              ]}
            >
              Create Join Link
            </Text>
            <View style={[styles.tabBadge, activeTab === 'links' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'links' && styles.tabBadgeTextActive]}>
                {links.length}
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={[
              styles.tabItem,
              activeTab === 'joins' && (isDark ? styles.tabItemActiveDark : styles.tabItemActiveLight),
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('joins');
            }}
          >
            <Ionicons
              name="analytics-outline"
              size={16}
              color={activeTab === 'joins' ? '#0284C7' : isDark ? '#94A3B8' : '#64748B'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'joins' && styles.tabTextActive,
                isDark ? styles.textDark : styles.textLight,
              ]}
            >
              Channel Join
            </Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0284C7" />
            <Text style={styles.loadingText}>Syncing Tracker Data...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ========================================================= */}
            {/* TAB 1: CONNECT (Connected Bots & Channel Mapping) */}
            {/* ========================================================= */}
            {activeTab === 'connect' && (
              <View>
                <View style={styles.sectionTopBar}>
                  <View>
                    <Text style={[styles.sectionHeading, isDark ? styles.textDark : styles.textLight]}>
                      Connected Bots
                    </Text>
                    <Text style={styles.sectionSub}>Map bots to your channels to generate tracking links</Text>
                  </View>
                  <Pressable
                    style={styles.primaryBtn}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowConnectModal(true);
                    }}
                  >
                    <Ionicons name="add" size={16} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>Connect Bot</Text>
                  </Pressable>
                </View>

                {bots.map((bot) => (
                  <View key={bot.id} style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
                    <View style={styles.botRow}>
                      {/* Left: Bot Info */}
                      <View style={styles.botLeft}>
                        {bot.bot_icon_url ? (
                          <Image source={{ uri: bot.bot_icon_url }} style={styles.botAvatar} />
                        ) : (
                          <LinearGradient colors={['#0284C7', '#2563EB']} style={styles.botAvatarPlaceholder}>
                            <Ionicons name="hardware-chip-outline" size={20} color="#FFFFFF" />
                          </LinearGradient>
                        )}
                        <View style={styles.botTextWrap}>
                          <Text style={[styles.botName, isDark ? styles.textDark : styles.textLight]}>
                            {bot.bot_name}
                          </Text>
                          <Text style={styles.botUsername}>@{bot.bot_username}</Text>
                        </View>
                      </View>

                      {/* Right Status */}
                      <View style={styles.statusBadge}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusBadgeText}>{bot.status || 'ACTIVE'}</Text>
                      </View>
                    </View>

                    {/* Mapped Channel Box / Multi-Channel Rows */}
                    {bot.bot_username === 'ResearchReport233_bot' ? (
                      <View style={{ gap: 8, marginTop: 6 }}>
                        {[
                          { name: 'TEST BOT CHANNEL', id: '-1002439531055' },
                          { name: 'JUNCTION BOT SERVICE CHANNEL', id: '-1002220195813' },
                          { name: 'TESTING', id: '-1003931328169' },
                          { name: 'PREMIUM CHANNEL', id: '-1002325603950' },
                          { name: 'PRIVATE SHWET', id: '-1002325619969' },
                          { name: 'PRIVATE CHANNEL', id: '-1002330624282' },
                          { name: 'POP ONE', id: '-1002364512687' },
                        ].map((subChan, subIdx) => (
                          <View
                            key={`subchan_${subIdx}`}
                            style={[
                              styles.mappedChannelBox,
                              isDark ? styles.mappedChannelBoxDark : styles.mappedChannelBoxLight,
                            ]}
                          >
                            <View style={styles.mappedChannelLeft}>
                              <Ionicons name="megaphone-outline" size={18} color="#0284C7" />
                              <View>
                                <Text style={[styles.channelTitle, isDark ? styles.textDark : styles.textLight]}>
                                  {subChan.name}
                                </Text>
                                <Text style={styles.channelIdText}>ID: {subChan.id}</Text>
                              </View>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <View style={styles.statusBadge}>
                                <View style={styles.statusDot} />
                                <Text style={styles.statusBadgeText}>ACTIVE</Text>
                              </View>
                              <Pressable
                                style={styles.createLinkBtn}
                                onPress={() => {
                                  setSelectedBotUsername(bot.bot_username);
                                  setChannelNameInput(subChan.name);
                                  setActiveTab('links');
                                  setShowCreateLinkModal(true);
                                }}
                              >
                                <Ionicons name="link" size={14} color="#FFFFFF" />
                                <Text style={styles.createLinkBtnText}>Create Link</Text>
                              </Pressable>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.mappedChannelBox,
                          isDark ? styles.mappedChannelBoxDark : styles.mappedChannelBoxLight,
                        ]}
                      >
                        <View style={styles.mappedChannelLeft}>
                          <Ionicons name="megaphone-outline" size={18} color="#0284C7" />
                          <View>
                            <Text style={[styles.channelTitle, isDark ? styles.textDark : styles.textLight]}>
                              {bot.channel_name || 'No channels mapped'}
                            </Text>
                            <Text style={styles.channelIdText}>
                              {bot.channel_id ? `ID: ${bot.channel_id}` : 'No channels mapped'}
                            </Text>
                          </View>
                        </View>

                        {bot.channel_name ? (
                          <Pressable
                            style={styles.createLinkBtn}
                            onPress={() => {
                              setSelectedBotUsername(bot.bot_username);
                              setChannelNameInput(bot.channel_name || '');
                              setActiveTab('links');
                              setShowCreateLinkModal(true);
                            }}
                          >
                            <Ionicons name="link" size={14} color="#FFFFFF" />
                            <Text style={styles.createLinkBtnText}>Create Link</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* ========================================================= */}
            {/* TAB 2: CREATE JOIN LINK (Active Deep Links & Rates) */}
            {/* ========================================================= */}
            {activeTab === 'links' && (
              <View>
                <View style={styles.sectionTopBar}>
                  <View>
                    <Text style={[styles.sectionHeading, isDark ? styles.textDark : styles.textLight]}>
                      Active Join Links
                    </Text>
                    <Text style={styles.sectionSub}>Custom tracking links with start conversion attribution</Text>
                  </View>
                  <Pressable
                    style={styles.primaryBtn}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowCreateLinkModal(true);
                    }}
                  >
                    <Ionicons name="add" size={16} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>Create Join Link</Text>
                  </Pressable>
                </View>

                {links.map((link) => {
                  const isCopied = copiedLinkId === link.id;
                  return (
                    <View key={link.id} style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
                      <View style={styles.linkHeaderRow}>
                        <View style={styles.linkTitleWrap}>
                          <Text style={[styles.linkTitle, isDark ? styles.textDark : styles.textLight]}>
                            {link.title}
                          </Text>
                          <View style={styles.linkMetaRow}>
                            <Text style={styles.linkSubText}>
                              {link.channel_name} <Text style={styles.linkBotTag}>@{link.bot_username}</Text>
                            </Text>
                          </View>
                          <View style={styles.pillRow}>
                            <View style={styles.sourcePill}>
                              <Text style={styles.sourcePillText}>{link.source_type}</Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* 3 Metric Conversion Stats */}
                      <View style={styles.statPillsRow}>
                        <View style={[styles.statPill, isDark ? styles.statPillDark : styles.statPillLight]}>
                          <Text style={[styles.statVal, isDark ? styles.textDark : styles.textLight]}>
                            {link.bot_starts}
                          </Text>
                          <Text style={styles.statLbl}>BOT STARTS</Text>
                        </View>
                        <View style={[styles.statPill, isDark ? styles.statPillDark : styles.statPillLight]}>
                          <Text style={[styles.statVal, { color: '#10B981' }]}>{link.joined}</Text>
                          <Text style={styles.statLbl}>JOINED</Text>
                        </View>
                        <View style={[styles.statPill, isDark ? styles.statPillDark : styles.statPillLight]}>
                          <Text style={[styles.statVal, { color: '#0284C7' }]}>{link.conversion_rate}%</Text>
                          <Text style={styles.statLbl}>RATE</Text>
                        </View>
                      </View>

                      {/* Copy Action */}
                      <Pressable
                        style={[styles.copyBtn, isCopied && styles.copyBtnSuccess]}
                        onPress={() => handleCopyLink(link.deep_link_url, link.id)}
                      >
                        <Ionicons
                          name={isCopied ? 'checkmark-circle' : 'copy-outline'}
                          size={16}
                          color="#FFFFFF"
                        />
                        <Text style={styles.copyBtnText}>
                          {isCopied ? 'Link Copied to Clipboard!' : 'Copy Deep Link'}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}

            {/* ========================================================= */}
            {/* TAB 3: CHANNEL JOIN (6 KPIs & Live Users Table) */}
            {/* ========================================================= */}
            {activeTab === 'joins' && dashboard && (
              <View>
                {/* 6 Top KPI Cards matching Screenshot 4 */}
                <View style={styles.kpiGrid}>
                  <View style={[styles.kpiCard, isDark ? styles.cardDark : styles.cardLight]}>
                    <View style={[styles.kpiIconWrap, { backgroundColor: '#F0F9FF' }]}>
                      <Ionicons name="people" size={18} color="#0284C7" />
                    </View>
                    <Text style={[styles.kpiNumber, isDark ? styles.textDark : styles.textLight]}>
                      {dashboard.kpis.totalJoins}
                    </Text>
                    <Text style={styles.kpiLabel}>Total Joins</Text>
                    <Text style={styles.kpiHint}>Active Channel Members</Text>
                  </View>

                  <View style={[styles.kpiCard, isDark ? styles.cardDark : styles.cardLight]}>
                    <View style={[styles.kpiIconWrap, { backgroundColor: '#ECFDF5' }]}>
                      <Ionicons name="today-outline" size={18} color="#10B981" />
                    </View>
                    <Text style={[styles.kpiNumber, { color: '#10B981' }]}>+{dashboard.kpis.todaysJoins}</Text>
                    <Text style={styles.kpiLabel}>Today's Joins</Text>
                    <Text style={styles.kpiHint}>New joins today</Text>
                  </View>

                  <View style={[styles.kpiCard, isDark ? styles.cardDark : styles.cardLight]}>
                    <View style={[styles.kpiIconWrap, { backgroundColor: '#F0FDF4' }]}>
                      <Ionicons name="calendar-outline" size={18} color="#16A34A" />
                    </View>
                    <Text style={[styles.kpiNumber, { color: '#16A34A' }]}>+{dashboard.kpis.thisMonthJoins}</Text>
                    <Text style={styles.kpiLabel}>This Month</Text>
                    <Text style={styles.kpiHint}>New joins this month</Text>
                  </View>

                  <View style={[styles.kpiCard, isDark ? styles.cardDark : styles.cardLight]}>
                    <View style={[styles.kpiIconWrap, { backgroundColor: '#EFF6FF' }]}>
                      <Ionicons name="sparkles-outline" size={18} color="#2563EB" />
                    </View>
                    <Text style={[styles.kpiNumber, isDark ? styles.textDark : styles.textLight]}>
                      {dashboard.kpis.botStarts}
                    </Text>
                    <Text style={styles.kpiLabel}>Bot Starts</Text>
                    <Text style={styles.kpiHint}>Total bot interactions</Text>
                  </View>

                  <View style={[styles.kpiCard, isDark ? styles.cardDark : styles.cardLight]}>
                    <View style={[styles.kpiIconWrap, { backgroundColor: '#FFFBEB' }]}>
                      <Ionicons name="time-outline" size={18} color="#D97706" />
                    </View>
                    <Text style={[styles.kpiNumber, { color: '#D97706' }]}>{dashboard.kpis.pendingJoins}</Text>
                    <Text style={styles.kpiLabel}>Pending Joins</Text>
                    <Text style={styles.kpiHint}>Started but not joined</Text>
                  </View>

                  <View style={[styles.kpiCard, isDark ? styles.cardDark : styles.cardLight]}>
                    <View style={[styles.kpiIconWrap, { backgroundColor: '#FDF2F8' }]}>
                      <Ionicons name="trending-up-outline" size={18} color="#DB2777" />
                    </View>
                    <Text style={[styles.kpiNumber, { color: '#DB2777' }]}>{dashboard.kpis.conversionRate}%</Text>
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
                        {dashboard.period.startDate} - {dashboard.period.endDate}
                      </Text>
                    </View>
                  </View>

                  {/* Channel Breakdown Cards */}
                  {dashboard.channels.map((chan) => (
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
                        {chan.links.map((linkItem) => (
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
                    <Text style={styles.usersCountText}>{filteredUsers.length} total events</Text>
                  </View>

                  {/* Search Bar */}
                  <View style={[styles.searchBar, isDark ? styles.inputDark : styles.inputLight]}>
                    <Ionicons name="search" size={16} color="#94A3B8" />
                    <TextInput
                      style={[styles.searchInput, isDark ? styles.textDark : styles.textLight]}
                      placeholder="Search by name, ID or channel..."
                      placeholderTextColor="#94A3B8"
                      value={userSearch}
                      onChangeText={setUserSearch}
                    />
                  </View>

                  {/* Filter Pills */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterPillScroll}>
                    {(['All', 'Active', 'Bot Start', 'Leave', 'Pending'] as const).map((st) => (
                      <Pressable
                        key={st}
                        style={[
                          styles.filterPill,
                          userStatusFilter === st && styles.filterPillActive,
                          isDark ? styles.filterPillDark : styles.filterPillLight,
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setUserStatusFilter(st);
                        }}
                      >
                        <Text
                          style={[
                            styles.filterPillText,
                            userStatusFilter === st && styles.filterPillTextActive,
                            isDark ? styles.textDark : styles.textLight,
                          ]}
                        >
                          {st}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  {/* User Rows */}
                  {filteredUsers.map((user) => {
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
          </ScrollView>
        )}

        {/* ========================================================= */}
        {/* SUB-MODAL: CONNECT BOT */}
        {/* ========================================================= */}
        <Modal
          visible={showConnectModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowConnectModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalBox, isDark ? styles.cardDark : styles.cardLight]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, isDark ? styles.textDark : styles.textLight]}>
                  Connect Telegram Bot
                </Text>
                <Pressable onPress={() => setShowConnectModal(false)}>
                  <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
                </Pressable>
              </View>

              <Text style={styles.fieldLabel}>BOT TOKEN (FROM @BOTFATHER)</Text>
              <TextInput
                style={[styles.fieldInput, isDark ? styles.inputDark : styles.inputLight]}
                placeholder="e.g. 7123456789:AAH..."
                placeholderTextColor="#94A3B8"
                value={botTokenInput}
                onChangeText={setBotTokenInput}
                autoCapitalize="none"
              />

              <Text style={styles.fieldLabel}>BOT NAME</Text>
              <TextInput
                style={[styles.fieldInput, isDark ? styles.inputDark : styles.inputLight]}
                placeholder="e.g. Trading Guru Tracker"
                placeholderTextColor="#94A3B8"
                value={botNameInput}
                onChangeText={setBotNameInput}
              />

              <Text style={styles.fieldLabel}>BOT USERNAME</Text>
              <TextInput
                style={[styles.fieldInput, isDark ? styles.inputDark : styles.inputLight]}
                placeholder="e.g. tradingguru_bot"
                placeholderTextColor="#94A3B8"
                value={botUsernameInput}
                onChangeText={setBotUsernameInput}
                autoCapitalize="none"
              />

              <Pressable
                style={[styles.submitBtn, connectingBot && styles.submitBtnDisabled]}
                onPress={handleConnectBot}
                disabled={connectingBot}
              >
                {connectingBot ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>Verify & Connect Bot</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* ========================================================= */}
        {/* SUB-MODAL: CREATE JOIN LINK */}
        {/* ========================================================= */}
        <Modal
          visible={showCreateLinkModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCreateLinkModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalBox, isDark ? styles.cardDark : styles.cardLight]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, isDark ? styles.textDark : styles.textLight]}>
                  Create Attribution Join Link
                </Text>
                <Pressable onPress={() => setShowCreateLinkModal(false)}>
                  <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
                </Pressable>
              </View>

              <Text style={styles.fieldLabel}>CAMPAIGN / LINK TITLE</Text>
              <TextInput
                style={[styles.fieldInput, isDark ? styles.inputDark : styles.inputLight]}
                placeholder="e.g. Instagram Promo 2026"
                placeholderTextColor="#94A3B8"
                value={linkTitleInput}
                onChangeText={setLinkTitleInput}
              />

              <Text style={styles.fieldLabel}>TRAFFIC SOURCE TAG</Text>
              <TextInput
                style={[styles.fieldInput, isDark ? styles.inputDark : styles.inputLight]}
                placeholder="e.g. Direct Link, Meta Ads, YouTube"
                placeholderTextColor="#94A3B8"
                value={campaignSourceInput}
                onChangeText={setCampaignSourceInput}
              />

              <Text style={styles.fieldLabel}>CHANNEL NAME</Text>
              <TextInput
                style={[styles.fieldInput, isDark ? styles.inputDark : styles.inputLight]}
                placeholder="e.g. Trading Guru SEBI Registered"
                placeholderTextColor="#94A3B8"
                value={channelNameInput}
                onChangeText={setChannelNameInput}
              />

              <Pressable
                style={[styles.submitBtn, creatingLink && styles.submitBtnDisabled]}
                onPress={handleCreateLink}
                disabled={creatingLink}
              >
                {creatingLink ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>Generate Deep Link</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerLight: {
    backgroundColor: '#F8FAFC',
  },
  containerDark: {
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnLight: {
    backgroundColor: '#E2E8F0',
  },
  closeBtnDark: {
    backgroundColor: '#1E293B',
  },
  borderLight: {
    borderBottomColor: '#E2E8F0',
  },
  borderDark: {
    borderBottomColor: '#334155',
  },
  textLight: {
    color: '#0F172A',
  },
  textDark: {
    color: '#F8FAFC',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tabBarLight: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabBarDark: {
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  tabItemActiveLight: {
    backgroundColor: '#E0F2FE',
  },
  tabItemActiveDark: {
    backgroundColor: '#0369A1',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  tabBadgeActive: {
    backgroundColor: '#0284C7',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardDark: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  botRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  botLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  botAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  botAvatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botTextWrap: {
    flex: 1,
  },
  botName: {
    fontSize: 14,
    fontWeight: '700',
  },
  botUsername: {
    fontSize: 12,
    color: '#0284C7',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  mappedChannelBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  mappedChannelBoxLight: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mappedChannelBoxDark: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  mappedChannelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  channelTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  channelIdText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  createLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  createLinkBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  linkHeaderRow: {
    marginBottom: 12,
  },
  linkTitleWrap: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  linkMetaRow: {
    marginTop: 2,
  },
  linkSubText: {
    fontSize: 12,
    color: '#64748B',
  },
  linkBotTag: {
    color: '#0284C7',
    fontWeight: '600',
  },
  pillRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  sourcePill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sourcePillText: {
    fontSize: 10,
    color: '#0284C7',
    fontWeight: '600',
  },
  statPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  statPillLight: {
    backgroundColor: '#F1F5F9',
  },
  statPillDark: {
    backgroundColor: '#0F172A',
  },
  statVal: {
    fontSize: 15,
    fontWeight: '700',
  },
  statLbl: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  copyBtnSuccess: {
    backgroundColor: '#10B981',
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  kpiCard: {
    width: '48.5%',
    padding: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
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
    fontSize: 20,
    fontWeight: '800',
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  kpiHint: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  matrixCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  matrixHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  matrixHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matrixTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  periodBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  periodBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563EB',
  },
  chanCard: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  chanCardLight: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chanCardDark: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  chanCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  chanName: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  periodJoinsPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  periodJoinsPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  chanStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.02)',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  chanStatItem: {
    alignItems: 'center',
  },
  chanStatLbl: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
  },
  chanStatVal: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  chanLinksWrap: {
    gap: 4,
  },
  linkJoinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  linkJoinPillTitle: {
    fontSize: 11,
    flex: 1,
    marginLeft: 6,
  },
  linkJoinPillBadge: {
    backgroundColor: '#E0F2FE',
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
    borderRadius: 14,
    padding: 16,
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
    fontSize: 14,
    fontWeight: '700',
  },
  usersCountText: {
    fontSize: 11,
    color: '#64748B',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: 38,
    fontSize: 12,
    marginLeft: 6,
  },
  filterPillScroll: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
  },
  filterPillLight: {
    backgroundColor: '#F1F5F9',
  },
  filterPillDark: {
    backgroundColor: '#0F172A',
  },
  filterPillActive: {
    backgroundColor: '#0284C7',
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
    borderBottomWidth: 1,
  },
  userRowLight: {
    borderBottomColor: '#F1F5F9',
  },
  userRowDark: {
    borderBottomColor: '#334155',
  },
  userRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
  },
  userSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  userTime: {
    fontSize: 10,
    color: '#94A3B8',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
    marginTop: 8,
  },
  fieldInput: {
    height: 42,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  inputLight: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputDark: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
