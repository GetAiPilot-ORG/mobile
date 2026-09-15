import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
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
} from '../types';

interface TrackerModalProps {
  visible: boolean;
  onClose: () => void;
}

type TrackerTab = 'connect' | 'links' | 'joins';

export const TrackerModal: React.FC<TrackerModalProps> = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState<TrackerTab>('joins');
  const [loading, setLoading] = useState(false);

  const EMPTY_DASHBOARD: TelegramTrackerDashboardData = {
    kpis: {
      totalJoins: 0,
      todaysJoins: 0,
      thisMonthJoins: 0,
      botStarts: 0,
      pendingJoins: 0,
      conversionRate: 0,
    },
    period: {
      startDate: '',
      endDate: '',
      periodJoins: 0,
      totalTracked: 0,
      allTimeActive: 0,
    },
    channels: [],
    newUsers: [],
    totalUsersCount: 0,
  };

  const [bots, setBots] = useState<TelegramTrackerBot[]>([]);
  const [links, setLinks] = useState<TelegramTrackerLink[]>([]);
  const [dashboard, setDashboard] = useState<TelegramTrackerDashboardData>(EMPTY_DASHBOARD);

  // Connect Bot Modal states
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [botTokenInput, setBotTokenInput] = useState('');
  const [botNameInput, setBotNameInput] = useState('');
  const [botUsernameInput, setBotUsernameInput] = useState('');
  const [connectingBot, setConnectingBot] = useState(false);

  // Create Join Link Modal states
  const [showCreateLinkModal, setShowCreateLinkModal] = useState(false);
  const [linkTitleInput, setLinkTitleInput] = useState('');
  const [selectedBotUsername, setSelectedBotUsername] = useState('');
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
        if (Array.isArray(bList)) {
          setBots(bList);
          if (!selectedBotUsername && bList.length > 0) {
            setSelectedBotUsername(bList[0].bot_username);
          }
        }
      }

      if (linksRes.status === 'fulfilled' && linksRes.value) {
        const val: any = linksRes.value;
        const lList = Array.isArray(val) ? val : val?.data;
        if (Array.isArray(lList)) {
          setLinks(lList);
          if (!selectedBotUsername && lList.length > 0) setSelectedBotUsername(lList[0].bot_username);
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
        botUsername: selectedBotUsername || (bots[0]?.bot_username || 'tracker_bot'),
        channelName: channelNameInput.trim() || (bots[0]?.channel_name || 'Channel'),
        campaignSource: campaignSourceInput.trim() || 'Direct Link',
      });

      const newLink = res?.link || res?.data?.link;
      if (newLink) {
        setLinks([newLink, ...links]);
      } else {
        const botUser = selectedBotUsername || bots[0]?.bot_username || 'tracker_bot';
        setLinks([
          {
            id: `link_${Date.now()}`,
            title: linkTitleInput.trim(),
            bot_username: botUser,
            channel_name: channelNameInput.trim() || bots[0]?.channel_name || 'Channel',
            source_type: campaignSourceInput.trim() || 'Direct Link',
            bot_starts: 0,
            joined: 0,
            conversion_rate: 0,
            deep_link_url: `https://t.me/${botUser}?start=c_${linkTitleInput.toLowerCase().replace(/\s+/g, '_')}`,
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
      <View className="flex-1 bg-[#0B0D10]">
        {/* Top Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-[#262930] bg-[#181A1F]">
          <View className="flex-row items-center gap-3 flex-1">
            <View className="w-10 h-10 rounded-xl bg-[#0084FF]/15 items-center justify-center">
              <Ionicons name="git-network-outline" size={20} color="#0084FF" />
            </View>
            <View>
              <View className="flex-row items-center gap-2">
                <Text className="text-lg font-bold text-white">GAP Tracker</Text>
                <View className="flex-row items-center bg-emerald-500/10 px-2 py-0.5 rounded-full gap-1 border border-emerald-500/20">
                  <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <Text className="text-[11px] font-semibold text-emerald-400">{bots.length} Bots Connected</Text>
                </View>
              </View>
              <Text className="text-xs text-slate-400 mt-0.5">Connect bots, map channels & generate deep link trackers</Text>
            </View>
          </View>
          <Pressable className="w-9 h-9 rounded-full bg-[#111317] items-center justify-center active:opacity-70" onPress={onClose}>
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* 3-Tab Segment Navigation */}
        <View className="flex-row px-4 py-2.5 gap-2 bg-[#181A1F] border-b border-[#262930]">
          <Pressable
            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl gap-1.5 ${
              activeTab === 'connect' ? 'bg-[#0084FF]' : 'bg-[#111317] border border-[#262930]'
            }`}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('connect');
            }}
          >
            <Ionicons
              name="link-outline"
              size={16}
              color={activeTab === 'connect' ? '#FFFFFF' : '#94A3B8'}
            />
            <Text
              className={`text-xs font-semibold ${
                activeTab === 'connect' ? 'text-white font-bold' : 'text-slate-300'
              }`}
            >
              Connect
            </Text>
            <View className={`px-1.5 py-0.5 rounded-full ${activeTab === 'connect' ? 'bg-white/20' : 'bg-[#262930]'}`}>
              <Text className={`text-[10px] font-bold ${activeTab === 'connect' ? 'text-white' : 'text-slate-400'}`}>
                {bots.length}
              </Text>
            </View>
          </Pressable>

          <Pressable
            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl gap-1.5 ${
              activeTab === 'links' ? 'bg-[#0084FF]' : 'bg-[#111317] border border-[#262930]'
            }`}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('links');
            }}
          >
            <Ionicons
              name="globe-outline"
              size={16}
              color={activeTab === 'links' ? '#FFFFFF' : '#94A3B8'}
            />
            <Text
              className={`text-xs font-semibold ${
                activeTab === 'links' ? 'text-white font-bold' : 'text-slate-300'
              }`}
            >
              Join Links
            </Text>
            <View className={`px-1.5 py-0.5 rounded-full ${activeTab === 'links' ? 'bg-white/20' : 'bg-[#262930]'}`}>
              <Text className={`text-[10px] font-bold ${activeTab === 'links' ? 'text-white' : 'text-slate-400'}`}>
                {links.length}
              </Text>
            </View>
          </Pressable>

          <Pressable
            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl gap-1.5 ${
              activeTab === 'joins' ? 'bg-[#0084FF]' : 'bg-[#111317] border border-[#262930]'
            }`}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('joins');
            }}
          >
            <Ionicons
              name="analytics-outline"
              size={16}
              color={activeTab === 'joins' ? '#FFFFFF' : '#94A3B8'}
            />
            <Text
              className={`text-xs font-semibold ${
                activeTab === 'joins' ? 'text-white font-bold' : 'text-slate-300'
              }`}
            >
              Analytics
            </Text>
          </Pressable>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center p-8 gap-3">
            <ActivityIndicator size="large" color="#0084FF" />
            <Text className="text-xs text-slate-400">Syncing Tracker Data...</Text>
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerClassName="p-4 pb-10"
            showsVerticalScrollIndicator={false}
          >
            {/* TAB 1: CONNECT */}
            {activeTab === 'connect' && (
              <View>
                <View className="flex-row items-center justify-between mb-4">
                  <View>
                    <Text className="text-base font-bold text-white">
                      Connected Bots
                    </Text>
                    <Text className="text-xs text-slate-400 mt-0.5">Map bots to your channels to generate tracking links</Text>
                  </View>
                  <Pressable
                    className="flex-row items-center bg-[#0084FF] px-3 py-2 rounded-xl gap-1 active:opacity-90"
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowConnectModal(true);
                    }}
                  >
                    <Ionicons name="add" size={16} color="#FFFFFF" />
                    <Text className="text-white text-xs font-semibold">Connect Bot</Text>
                  </Pressable>
                </View>

                {bots.map((bot) => (
                  <View key={bot.id} className="rounded-2xl p-4 mb-3 border border-[#262930] bg-[#181A1F]">
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center gap-2.5 flex-1">
                        {bot.bot_icon_url ? (
                          <Image source={{ uri: bot.bot_icon_url }} className="w-9 h-9 rounded-full" />
                        ) : (
                          <LinearGradient colors={['#0084FF', '#2563EB']} className="w-9 h-9 rounded-full items-center justify-center">
                            <Ionicons name="hardware-chip-outline" size={20} color="#FFFFFF" />
                          </LinearGradient>
                        )}
                        <View className="flex-1">
                          <Text className="text-sm font-bold text-white">
                            {bot.bot_name}
                          </Text>
                          <Text className="text-xs text-[#0084FF]">@{bot.bot_username}</Text>
                        </View>
                      </View>

                      <View className="flex-row items-center bg-emerald-500/10 px-2 py-1 rounded-full gap-1 border border-emerald-500/20">
                        <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <Text className="text-[10px] font-bold text-emerald-400">{bot.status || 'ACTIVE'}</Text>
                      </View>
                    </View>

                    {/* Mapped Channel Box */}
                    <View className="flex-row items-center justify-between p-3 rounded-xl border border-[#262930] bg-[#111317] mt-1">
                      <View className="flex-row items-center gap-2.5 flex-1">
                        <Ionicons name="megaphone-outline" size={18} color="#0084FF" />
                        <View>
                          <Text className="text-xs font-semibold text-white">
                            {bot.channel_name || 'No channels mapped'}
                          </Text>
                          <Text className="text-[11px] text-slate-400">
                            {bot.channel_id ? `ID: ${bot.channel_id}` : 'No channels mapped'}
                          </Text>
                        </View>
                      </View>

                      {bot.channel_name ? (
                        <Pressable
                          className="flex-row items-center bg-[#0084FF] px-2.5 py-1.5 rounded-lg gap-1 active:opacity-90"
                          onPress={() => {
                            setSelectedBotUsername(bot.bot_username);
                            setChannelNameInput(bot.channel_name || '');
                            setActiveTab('links');
                            setShowCreateLinkModal(true);
                          }}
                        >
                          <Ionicons name="link" size={14} color="#FFFFFF" />
                          <Text className="text-white text-[11px] font-semibold">Create Link</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* TAB 2: CREATE JOIN LINK */}
            {activeTab === 'links' && (
              <View>
                <View className="flex-row items-center justify-between mb-4">
                  <View>
                    <Text className="text-base font-bold text-white">
                      Active Join Links
                    </Text>
                    <Text className="text-xs text-slate-400 mt-0.5">Custom tracking links with start conversion attribution</Text>
                  </View>
                  <Pressable
                    className="flex-row items-center bg-[#0084FF] px-3 py-2 rounded-xl gap-1 active:opacity-90"
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowCreateLinkModal(true);
                    }}
                  >
                    <Ionicons name="add" size={16} color="#FFFFFF" />
                    <Text className="text-white text-xs font-semibold">Create Join Link</Text>
                  </Pressable>
                </View>

                {links.map((link) => {
                  const isCopied = copiedLinkId === link.id;
                  return (
                    <View key={link.id} className="rounded-2xl p-4 mb-3 border border-[#262930] bg-[#181A1F]">
                      <View className="mb-3">
                        <Text className="text-sm font-bold text-white">
                          {link.title}
                        </Text>
                        <View className="mt-0.5">
                          <Text className="text-xs text-slate-400">
                            {link.channel_name} <Text className="text-[#0084FF] font-semibold">@{link.bot_username}</Text>
                          </Text>
                        </View>
                        <View className="flex-row mt-1.5">
                          <View className="bg-[#0084FF]/10 px-2 py-0.5 rounded-md border border-[#0084FF]/20">
                            <Text className="text-[10px] text-[#0084FF] font-semibold">{link.source_type}</Text>
                          </View>
                        </View>
                      </View>

                      {/* 3 Metric Conversion Stats */}
                      <View className="flex-row gap-2 mb-3">
                        <View className="flex-1 items-center justify-center py-2.5 rounded-xl border border-[#262930] bg-[#111317]">
                          <Text className="text-sm font-bold text-white">
                            {link.bot_starts}
                          </Text>
                          <Text className="text-[9px] font-bold text-slate-400 mt-0.5">BOT STARTS</Text>
                        </View>
                        <View className="flex-1 items-center justify-center py-2.5 rounded-xl border border-[#262930] bg-[#111317]">
                          <Text className="text-sm font-bold text-emerald-400">{link.joined}</Text>
                          <Text className="text-[9px] font-bold text-slate-400 mt-0.5">JOINED</Text>
                        </View>
                        <View className="flex-1 items-center justify-center py-2.5 rounded-xl border border-[#262930] bg-[#111317]">
                          <Text className="text-sm font-bold text-[#0084FF]">{link.conversion_rate}%</Text>
                          <Text className="text-[9px] font-bold text-slate-400 mt-0.5">RATE</Text>
                        </View>
                      </View>

                      {/* Copy Action */}
                      <Pressable
                        className={`flex-row items-center justify-center py-2.5 rounded-xl gap-1.5 active:opacity-90 ${
                          isCopied ? 'bg-emerald-500' : 'bg-[#0084FF]'
                        }`}
                        onPress={() => handleCopyLink(link.deep_link_url, link.id)}
                      >
                        <Ionicons
                          name={isCopied ? 'checkmark-circle' : 'copy-outline'}
                          size={16}
                          color="#FFFFFF"
                        />
                        <Text className="text-white text-xs font-semibold">
                          {isCopied ? 'Link Copied to Clipboard!' : 'Copy Deep Link'}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}

            {/* TAB 3: CHANNEL JOIN */}
            {activeTab === 'joins' && dashboard && (
              <View>
                {/* 6 Top KPI Cards */}
                <View className="flex-row flex-wrap gap-2 mb-4">
                  <View className="w-[48.5%] p-3.5 rounded-2xl border border-[#262930] bg-[#181A1F]">
                    <View className="w-8 h-8 rounded-lg items-center justify-center mb-2 bg-[#0084FF]/10">
                      <Ionicons name="people" size={18} color="#0084FF" />
                    </View>
                    <Text className="text-xl font-extrabold text-white">
                      {dashboard.kpis.totalJoins}
                    </Text>
                    <Text className="text-xs font-semibold text-slate-400 mt-0.5">Total Joins</Text>
                    <Text className="text-[10px] text-slate-500 mt-0.5">Active Channel Members</Text>
                  </View>

                  <View className="w-[48.5%] p-3.5 rounded-2xl border border-[#262930] bg-[#181A1F]">
                    <View className="w-8 h-8 rounded-lg items-center justify-center mb-2 bg-emerald-500/10">
                      <Ionicons name="today-outline" size={18} color="#10B981" />
                    </View>
                    <Text className="text-xl font-extrabold text-emerald-400">+{dashboard.kpis.todaysJoins}</Text>
                    <Text className="text-xs font-semibold text-slate-400 mt-0.5">Today's Joins</Text>
                    <Text className="text-[10px] text-slate-500 mt-0.5">New joins today</Text>
                  </View>

                  <View className="w-[48.5%] p-3.5 rounded-2xl border border-[#262930] bg-[#181A1F]">
                    <View className="w-8 h-8 rounded-lg items-center justify-center mb-2 bg-emerald-500/10">
                      <Ionicons name="calendar-outline" size={18} color="#16A34A" />
                    </View>
                    <Text className="text-xl font-extrabold text-emerald-400">+{dashboard.kpis.thisMonthJoins}</Text>
                    <Text className="text-xs font-semibold text-slate-400 mt-0.5">This Month</Text>
                    <Text className="text-[10px] text-slate-500 mt-0.5">New joins this month</Text>
                  </View>

                  <View className="w-[48.5%] p-3.5 rounded-2xl border border-[#262930] bg-[#181A1F]">
                    <View className="w-8 h-8 rounded-lg items-center justify-center mb-2 bg-[#0084FF]/10">
                      <Ionicons name="sparkles-outline" size={18} color="#0084FF" />
                    </View>
                    <Text className="text-xl font-extrabold text-white">
                      {dashboard.kpis.botStarts}
                    </Text>
                    <Text className="text-xs font-semibold text-slate-400 mt-0.5">Bot Starts</Text>
                    <Text className="text-[10px] text-slate-500 mt-0.5">Total bot interactions</Text>
                  </View>

                  <View className="w-[48.5%] p-3.5 rounded-2xl border border-[#262930] bg-[#181A1F]">
                    <View className="w-8 h-8 rounded-lg items-center justify-center mb-2 bg-amber-500/10">
                      <Ionicons name="time-outline" size={18} color="#D97706" />
                    </View>
                    <Text className="text-xl font-extrabold text-amber-400">{dashboard.kpis.pendingJoins}</Text>
                    <Text className="text-xs font-semibold text-slate-400 mt-0.5">Pending Joins</Text>
                    <Text className="text-[10px] text-slate-500 mt-0.5">Started but not joined</Text>
                  </View>

                  <View className="w-[48.5%] p-3.5 rounded-2xl border border-[#262930] bg-[#181A1F]">
                    <View className="w-8 h-8 rounded-lg items-center justify-center mb-2 bg-pink-500/10">
                      <Ionicons name="trending-up-outline" size={18} color="#DB2777" />
                    </View>
                    <Text className="text-xl font-extrabold text-pink-400">{dashboard.kpis.conversionRate}%</Text>
                    <Text className="text-xs font-semibold text-slate-400 mt-0.5">Conversion Rate</Text>
                    <Text className="text-[10px] text-slate-500 mt-0.5">Starts to Joins</Text>
                  </View>
                </View>

                {/* Channel & Links Breakdown Matrix Card */}
                <View className="rounded-2xl p-4 mb-4 border border-[#262930] bg-[#181A1F]">
                  <View className="flex-row items-center justify-between flex-wrap gap-2 mb-3.5">
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="newspaper-outline" size={18} color="#0084FF" />
                      <Text className="text-sm font-bold text-white">
                        Channel & Links Breakdown
                      </Text>
                    </View>
                  </View>

                  {/* Channel Breakdown Cards */}
                  {dashboard.channels.map((chan) => (
                    <View
                      key={chan.channel_id}
                      className="rounded-xl p-3 mb-2.5 border border-[#262930] bg-[#111317]"
                    >
                      <View className="flex-row items-center justify-between flex-wrap gap-1.5 mb-2">
                        <Text className="text-xs font-bold text-white flex-1 min-w-[100px]">
                          {chan.channel_name}
                        </Text>
                        <View className="bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                          <Text className="text-[10px] font-bold text-emerald-400">+{chan.period_joins} Joins (7 Days)</Text>
                        </View>
                      </View>

                      {/* Mini Stats */}
                      <View className="flex-row justify-between py-1.5 px-2 rounded-lg bg-black/20 mb-2">
                        <View className="items-center">
                          <Text className="text-[9px] text-slate-400 font-semibold">JOINED</Text>
                          <Text className="text-xs font-bold text-white mt-0.5">
                            {chan.joined}
                          </Text>
                        </View>
                        <View className="items-center">
                          <Text className="text-[9px] text-slate-400 font-semibold">PERIOD</Text>
                          <Text className="text-xs font-bold text-emerald-400 mt-0.5">+{chan.period_joins}</Text>
                        </View>
                        <View className="items-center">
                          <Text className="text-[9px] text-slate-400 font-semibold">LEFT</Text>
                          <Text className="text-xs font-bold text-rose-400 mt-0.5">{chan.left}</Text>
                        </View>
                        <View className="items-center">
                          <Text className="text-[9px] text-slate-400 font-semibold">ALL ACTIVE</Text>
                          <Text className="text-xs font-bold text-[#0084FF] mt-0.5">{chan.all_active}</Text>
                        </View>
                      </View>

                      {/* Active Links in this channel */}
                      <View className="gap-1">
                        {chan.links.map((linkItem) => (
                          <View key={linkItem.id} className="flex-row items-center justify-between py-1 px-1.5">
                            <Ionicons name="link-outline" size={12} color="#0084FF" />
                            <Text className="text-xs flex-1 ml-1.5 text-white">
                              {linkItem.title}
                            </Text>
                            <View className="bg-[#0084FF]/10 px-1.5 py-0.5 rounded-md">
                              <Text className="text-[10px] font-bold text-[#0084FF]">+{linkItem.joins} joins</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>

                {/* New Users Live Data Table */}
                <View className="rounded-2xl p-4 border border-[#262930] bg-[#181A1F]">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="people-outline" size={18} color="#0084FF" />
                      <Text className="text-sm font-bold text-white">
                        New Users Data
                      </Text>
                    </View>
                    <Text className="text-xs text-slate-400">{filteredUsers.length} total events</Text>
                  </View>

                  {/* Search Bar */}
                  <View className="flex-row items-center px-2.5 rounded-xl border border-[#262930] bg-[#111317] mb-2.5">
                    <Ionicons name="search" size={16} color="#94A3B8" />
                    <TextInput
                      className="flex-1 h-9 text-xs ml-1.5 text-white"
                      placeholder="Search by name, ID or channel..."
                      placeholderTextColor="#64748B"
                      value={userSearch}
                      onChangeText={setUserSearch}
                    />
                  </View>

                  {/* Filter Pills */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-3">
                    {(['All', 'Active', 'Bot Start', 'Leave', 'Pending'] as const).map((st) => (
                      <Pressable
                        key={st}
                        className={`px-2.5 py-1.5 rounded-xl mr-1.5 border ${
                          userStatusFilter === st
                            ? 'bg-[#0084FF] border-[#0084FF]'
                            : 'bg-[#111317] border-[#262930]'
                        }`}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setUserStatusFilter(st);
                        }}
                      >
                        <Text
                          className={`text-xs ${
                            userStatusFilter === st ? 'text-white font-bold' : 'text-slate-300'
                          }`}
                        >
                          {st}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  {/* User Rows */}
                  {filteredUsers.map((user) => {
                    return (
                      <View
                        key={user.id}
                        className="flex-row items-center justify-between py-2.5 border-b border-[#262930]"
                      >
                        <View className="flex-row items-center gap-2.5 flex-1">
                          <View className="w-8 h-8 rounded-full bg-[#0084FF]/10 items-center justify-center">
                            <Text className="text-xs font-bold text-[#0084FF]">{user.name.charAt(0).toUpperCase()}</Text>
                          </View>
                          <View className="flex-1">
                            <Text className="text-xs font-semibold text-white">
                              {user.name}
                            </Text>
                            <Text className="text-[11px] text-slate-400 mt-0.5">
                              Id: {user.telegram_user_id} • {user.channel_name}
                            </Text>
                            <Text className="text-[10px] text-slate-500">{user.time_ago}</Text>
                          </View>
                        </View>

                        <View className="bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          <Text className="text-[10px] font-bold text-emerald-400">
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

        {/* SUB-MODAL: CONNECT BOT */}
        <Modal
          visible={showConnectModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowConnectModal(false)}
        >
          <View className="flex-1 bg-black/70 items-center justify-center p-5">
            <View className="w-full max-w-md rounded-2xl p-5 border border-[#262930] bg-[#181A1F]">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-base font-bold text-white">
                  Connect Telegram Bot
                </Text>
                <Pressable onPress={() => setShowConnectModal(false)}>
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </Pressable>
              </View>

              <Text className="text-[10px] font-bold text-slate-400 mb-1 mt-2">BOT TOKEN (FROM @BOTFATHER)</Text>
              <TextInput
                className="h-10 rounded-xl px-3 text-xs border border-[#262930] bg-[#111317] text-white"
                placeholder="e.g. 7123456789:AAH..."
                placeholderTextColor="#64748B"
                value={botTokenInput}
                onChangeText={setBotTokenInput}
                autoCapitalize="none"
              />

              <Text className="text-[10px] font-bold text-slate-400 mb-1 mt-2">BOT NAME</Text>
              <TextInput
                className="h-10 rounded-xl px-3 text-xs border border-[#262930] bg-[#111317] text-white"
                placeholder="e.g. Trading Guru Tracker"
                placeholderTextColor="#64748B"
                value={botNameInput}
                onChangeText={setBotNameInput}
              />

              <Text className="text-[10px] font-bold text-slate-400 mb-1 mt-2">BOT USERNAME</Text>
              <TextInput
                className="h-10 rounded-xl px-3 text-xs border border-[#262930] bg-[#111317] text-white"
                placeholder="e.g. tradingguru_bot"
                placeholderTextColor="#64748B"
                value={botUsernameInput}
                onChangeText={setBotUsernameInput}
                autoCapitalize="none"
              />

              <Pressable
                className={`flex-row items-center justify-center bg-[#0084FF] py-3 rounded-xl mt-4 gap-2 active:opacity-90 ${
                  connectingBot ? 'opacity-60' : ''
                }`}
                onPress={handleConnectBot}
                disabled={connectingBot}
              >
                {connectingBot ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark-outline" size={16} color="#FFFFFF" />
                    <Text className="text-white text-xs font-bold">Verify & Connect Bot</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* SUB-MODAL: CREATE JOIN LINK */}
        <Modal
          visible={showCreateLinkModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCreateLinkModal(false)}
        >
          <View className="flex-1 bg-black/70 items-center justify-center p-5">
            <View className="w-full max-w-md rounded-2xl p-5 border border-[#262930] bg-[#181A1F]">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-base font-bold text-white">
                  Create Attribution Join Link
                </Text>
                <Pressable onPress={() => setShowCreateLinkModal(false)}>
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </Pressable>
              </View>

              <Text className="text-[10px] font-bold text-slate-400 mb-1 mt-2">CAMPAIGN / LINK TITLE</Text>
              <TextInput
                className="h-10 rounded-xl px-3 text-xs border border-[#262930] bg-[#111317] text-white"
                placeholder="e.g. Instagram Promo 2026"
                placeholderTextColor="#64748B"
                value={linkTitleInput}
                onChangeText={setLinkTitleInput}
              />

              <Text className="text-[10px] font-bold text-slate-400 mb-1 mt-2">TRAFFIC SOURCE TAG</Text>
              <TextInput
                className="h-10 rounded-xl px-3 text-xs border border-[#262930] bg-[#111317] text-white"
                placeholder="e.g. Direct Link, Meta Ads, YouTube"
                placeholderTextColor="#64748B"
                value={campaignSourceInput}
                onChangeText={setCampaignSourceInput}
              />

              <Text className="text-[10px] font-bold text-slate-400 mb-1 mt-2">CHANNEL NAME</Text>
              <TextInput
                className="h-10 rounded-xl px-3 text-xs border border-[#262930] bg-[#111317] text-white"
                placeholder="e.g. Trading Guru SEBI Registered"
                placeholderTextColor="#64748B"
                value={channelNameInput}
                onChangeText={setChannelNameInput}
              />

              <Pressable
                className={`flex-row items-center justify-center bg-[#0084FF] py-3 rounded-xl mt-4 gap-2 active:opacity-90 ${
                  creatingLink ? 'opacity-60' : ''
                }`}
                onPress={handleCreateLink}
                disabled={creatingLink}
              >
                {creatingLink ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                    <Text className="text-white text-xs font-bold">Generate Deep Link</Text>
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

