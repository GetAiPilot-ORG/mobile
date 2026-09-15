import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { telegramApi } from '../api/telegramApi';
import { ReactionAutopilotRule, ReactionOrder, TelegramToolKey } from '../types';

interface Props {
  chats?: any[];
  onOpenModal?: (key: TelegramToolKey) => void;
}

const ALL_EMOJIS = [
  '👍', '👎', '❤️', '🔥', '🥰', '👏', '😁', '🎉',
  '🤩', '😱', '💩', '🤮', '💸', '⚡️', '💔', '💯',
  '🤝', '👻', '🍓', '🍾', '🕊', '🤡', '🥱', '✍️',
  '🏆', '🐳', '💅', '👨‍💻', '🦄', '🎯'
];

const QUANTITY_PRESETS = [50, 100, 250, 500, 1000];

const CAMPAIGN_TYPES = [
  { id: 'reactions', label: 'Custom Reactions (₹14/1k)', rate: 14, icon: 'heart-outline', desc: 'Real custom emoji delivery' },
  { id: 'views', label: 'Auto Views (₹4.8/1k)', rate: 4.8, icon: 'eye-outline', desc: 'Fast post view impressions' },
  { id: 'members_30d', label: 'Channel Members 30d (₹80/1k)', rate: 80, icon: 'people-outline', desc: '30-day refill guarantee' },
  { id: 'members_90d', label: 'Channel Members 90d (₹150/1k)', rate: 150, icon: 'shield-checkmark-outline', desc: '90-day refill guarantee' },
  { id: 'members_365d', label: 'Channel Members 365d (₹250/1k)', rate: 250, icon: 'ribbon-outline', desc: '365-day refill guarantee' },
  { id: 'members_indian', label: 'Indian Channel Members (₹120/1k)', rate: 120, icon: 'flag-outline', desc: 'HQ Indian geo-targeted' },
];

const DELIVERY_SPEEDS = [
  { id: 'Instant', label: 'Instant (Fastest)' },
  { id: '15m', label: '15 Minutes' },
  { id: '30m', label: '30 Minutes' },
  { id: '1h', label: '1 Hour' },
  { id: '2h', label: '2 Hours' },
  { id: '6h', label: '6 Hours' },
];

export const ReactionsScreen: React.FC<Props> = ({ chats = [], onOpenModal }) => {
  const queryClient = useQueryClient();

  // Active view section tab
  const [activeSection, setActiveSection] = useState<'boost' | 'autopilot' | 'orders'>('boost');

  // One-Time Boost Form State
  const [campaignType, setCampaignType] = useState('reactions');
  const [isCampaignDropdownOpen, setIsCampaignDropdownOpen] = useState(false);
  const [postLink, setPostLink] = useState('');
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>(['👍', '❤️', '🔥']);
  const [isRandomSpread, setIsRandomSpread] = useState(true);
  const [quantity, setQuantity] = useState<number>(50);
  const [customQtyText, setCustomQtyText] = useState('50');
  const [deliverySpeed, setDeliverySpeed] = useState('Instant');
  const [isSpeedOpen, setIsSpeedOpen] = useState(false);

  // Orders History State
  const [statusFilter, setStatusFilter] = useState<'All' | 'Completed' | 'In Progress' | 'Canceled'>('All');

  // Modals
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isServicesExplorerOpen, setIsServicesExplorerOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(50);
  const [customTopUpText, setCustomTopUpText] = useState('50');

  // Add Rule Form State
  const [ruleChannel, setRuleChannel] = useState('');
  const [ruleMinQty, setRuleMinQty] = useState('10');
  const [ruleMaxQty, setRuleMaxQty] = useState('50');
  const [ruleEmojis, setRuleEmojis] = useState<string[]>(['👍', '❤️', '🔥', '🎉']);
  const [rulePostsLimit, setRulePostsLimit] = useState('');

  // Live Query
  const { data: dashboard, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['telegram_reactions_dashboard'],
    queryFn: telegramApi.getReactionsDashboard,
    staleTime: 10000,
  });

  const walletBalance = dashboard?.wallet?.balance ?? 0;
  const currentService = CAMPAIGN_TYPES.find((c) => c.id === campaignType) || CAMPAIGN_TYPES[0];
  const orderCost = parseFloat(((currentService.rate * quantity) / 1000).toFixed(2));
  const balanceAfterOrder = parseFloat((walletBalance - orderCost).toFixed(2));
  const isInsufficient = walletBalance < orderCost;
  const shortfall = parseFloat((orderCost - walletBalance).toFixed(2));

  // Mutations
  const { mutateAsync: placeOrder, isPending: isPlacingOrder } = useMutation({
    mutationFn: telegramApi.createReactionOrder,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Campaign Launched! 🚀', `Your ${currentService.label} campaign for ${quantity} items was submitted successfully.`);
      setPostLink('');
      queryClient.invalidateQueries({ queryKey: ['telegram_reactions_dashboard'] });
    },
    onError: (err: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Order Failed', err.message || 'Could not place order. Please check your balance or link.');
    },
  });

  const { mutateAsync: addRule, isPending: isAddingRule } = useMutation({
    mutationFn: telegramApi.createAutopilotRule,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Rule Registered! ⚡', `Auto-Pilot will now automatically react to new posts on @${ruleChannel.replace(/^@/, '')}.`);
      setIsAddRuleOpen(false);
      setRuleChannel('');
      queryClient.invalidateQueries({ queryKey: ['telegram_reactions_dashboard'] });
    },
    onError: (err: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Failed to Add Rule', err.message || 'Check channel username and admin permissions.');
    },
  });

  const { mutateAsync: toggleRule } = useMutation({
    mutationFn: telegramApi.toggleAutopilotRule,
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      queryClient.invalidateQueries({ queryKey: ['telegram_reactions_dashboard'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Could not update rule status.');
    },
  });

  const { mutateAsync: deleteRule } = useMutation({
    mutationFn: telegramApi.deleteAutopilotRule,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      queryClient.invalidateQueries({ queryKey: ['telegram_reactions_dashboard'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Could not delete rule.');
    },
  });

  // Emoji Toggle Helpers
  const toggleEmoji = (emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEmojis((prev) =>
      prev.includes(emoji)
        ? prev.length > 1
          ? prev.filter((e) => e !== emoji)
          : prev
        : [...prev, emoji]
    );
  };

  const toggleRuleEmoji = (emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRuleEmojis((prev) =>
      prev.includes(emoji)
        ? prev.length > 1
          ? prev.filter((e) => e !== emoji)
          : prev
        : [...prev, emoji]
    );
  };

  const handleQtyPreset = (q: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuantity(q);
    setCustomQtyText(String(q));
  };

  const handleCustomQtyChange = (val: string) => {
    setCustomQtyText(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      setQuantity(num);
    }
  };

  const handleLaunchCampaign = async () => {
    if (!postLink.trim()) {
      Alert.alert('Required Link', 'Please enter a valid public Telegram post link (e.g., https://t.me/channel/123).');
      return;
    }
    if (postLink.includes('/c/')) {
      Alert.alert('Public Links Only', 'Private channel links (/c/...) are not supported. Please provide a public link.');
      return;
    }
    if (quantity < 10) {
      Alert.alert('Minimum Quantity', 'The minimum order quantity is 10.');
      return;
    }
    if (isInsufficient) {
      setIsTopUpOpen(true);
      return;
    }

    await placeOrder({
      link: postLink.trim(),
      quantity,
      reactions: selectedEmojis,
      campaignType,
    });
  };

  const handleCreateRuleSubmit = async () => {
    const cleanChan = ruleChannel.trim().replace(/^@/, '').replace('https://t.me/', '');
    if (!cleanChan) {
      Alert.alert('Channel Required', 'Please enter your public Telegram channel username.');
      return;
    }
    const minQ = parseInt(ruleMinQty, 10) || 10;
    const maxQ = parseInt(ruleMaxQty, 10) || 50;
    if (minQ > maxQ) {
      Alert.alert('Invalid Range', 'Minimum quantity cannot exceed maximum quantity.');
      return;
    }
    const limit = rulePostsLimit.trim() ? parseInt(rulePostsLimit, 10) : null;

    await addRule({
      channelUsername: cleanChan,
      minQuantity: minQ,
      maxQuantity: maxQ,
      reactions: ruleEmojis,
      postsLimit: limit,
    });
  };

  const filteredOrders = (dashboard?.orders || []).filter((o: ReactionOrder) => {
    if (statusFilter === 'All') return true;
    if (statusFilter === 'Completed') return (o.status || '').toLowerCase() === 'completed';
    if (statusFilter === 'In Progress') return ['in progress', 'processing', 'pending'].includes((o.status || '').toLowerCase());
    if (statusFilter === 'Canceled') return (o.status || '').toLowerCase() === 'canceled';
    return true;
  });

  return (
    <View className="gap-3.5 pb-6">
      {/* ── HEADER WITH BALANCE & TOP-UP ──────────────────────────────────── */}
      <View className="rounded-2xl p-4 border border-[#262930] bg-[#181A1F]">
        <View className="gap-3">
          <View>
            <View className="flex-row items-center gap-2 flex-wrap mb-1">
              <Text className="text-xl font-black text-white tracking-tight">Auto Views & Reactions</Text>
              <View className="flex-row items-center gap-1.5 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <Text className="text-[10px] font-bold text-emerald-400">Live SMM</Text>
              </View>
            </View>
            <Text className="text-xs text-slate-400 leading-4">
              Automatically deliver views and emoji reactions on future posts, or place a manual order for specific messages.
            </Text>
          </View>

          {/* Balance Box */}
          <View className="flex-row items-center px-3 py-2 rounded-xl border border-[#262930] bg-[#111317] gap-2.5 self-start">
            <View className="w-7 h-7 rounded-lg bg-indigo-500/20 items-center justify-center">
              <Ionicons name="wallet-outline" size={14} color="#818CF8" />
            </View>
            <View>
              <Text className="text-[9px] font-bold text-slate-400 uppercase">Balance</Text>
              <Text className="text-sm font-extrabold text-white">₹{walletBalance.toFixed(2)}</Text>
            </View>
            <Pressable
              className="p-1.5 rounded-lg bg-white/5"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                refetch();
              }}
            >
              <Ionicons
                name="refresh"
                size={14}
                color={isRefetching ? '#0084FF' : '#94A3B8'}
              />
            </Pressable>
            <Pressable
              className="flex-row items-center gap-1 bg-indigo-600 px-2.5 py-1.5 rounded-lg"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsTopUpOpen(true);
              }}
            >
              <Ionicons name="add" size={12} color="#FFFFFF" />
              <Text className="text-xs font-bold text-white">Top Up</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* ── PUBLIC CHANNEL NOTICE BANNER ─────────────────────────────────── */}
      <View className="flex-row gap-3 p-3.5 rounded-2xl bg-[#1E1B10] border border-amber-900/60">
        <View className="mt-0.5">
          <Ionicons name="warning" size={18} color="#FBBF24" />
        </View>
        <View className="flex-1">
          <Text className="text-xs font-bold text-amber-400 mb-0.5">Public Channel Requirement Notice</Text>
          <Text className="text-[11px] text-zinc-300 leading-4">
            All Telegram views, reactions, and autopilot services <Text className="font-bold text-amber-300">strictly support public channels and public links only</Text>. Private channel links (e.g. <Text className="font-mono text-[10px]">t.me/c/...</Text>) are not supported.
          </Text>
        </View>
      </View>

      {/* ── GAP REACTIONS SERVICES EXPLORER BANNER ────────────────────────── */}
      <Pressable
        className="flex-row items-center gap-3 p-3.5 rounded-2xl bg-[#161622] border border-indigo-900/70"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setIsServicesExplorerOpen(true);
        }}
      >
        <View className="w-9 h-9 rounded-xl bg-indigo-500/20 items-center justify-center">
          <Ionicons name="sparkles" size={18} color="#818CF8" />
        </View>
        <View className="flex-1">
          <Text className="text-xs font-bold text-indigo-200">GAP Reactions Services</Text>
          <Text className="text-[10px] text-slate-400 mt-0.5">
            Click to explore auto-reactions, auto-views, channel members, and one-time boosts.
          </Text>
        </View>
        <View className="flex-row items-center gap-1 px-2 py-1 rounded-md bg-indigo-500/15">
          <Text className="text-[10px] font-black text-indigo-400">EXPLORE</Text>
          <Ionicons name="chevron-down" size={12} color="#818CF8" />
        </View>
      </Pressable>

      {/* ── SECTION NAVIGATION TABS ──────────────────────────────────────── */}
      <View className="flex-row gap-2">
        <Pressable
          className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl border ${
            activeSection === 'boost' ? 'bg-[#0084FF]/20 border-[#0084FF]' : 'bg-[#181A1F] border-[#262930]'
          }`}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveSection('boost');
          }}
        >
          <Ionicons name="rocket-outline" size={14} color={activeSection === 'boost' ? '#0084FF' : '#94A3B8'} />
          <Text className={`text-xs font-bold ${activeSection === 'boost' ? 'text-[#0084FF]' : 'text-slate-400'}`}>
            Boost
          </Text>
        </Pressable>

        <Pressable
          className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl border ${
            activeSection === 'autopilot' ? 'bg-[#0084FF]/20 border-[#0084FF]' : 'bg-[#181A1F] border-[#262930]'
          }`}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveSection('autopilot');
          }}
        >
          <Ionicons name="flash-outline" size={14} color={activeSection === 'autopilot' ? '#0084FF' : '#94A3B8'} />
          <Text className={`text-xs font-bold ${activeSection === 'autopilot' ? 'text-[#0084FF]' : 'text-slate-400'}`}>
            Auto-Pilot
          </Text>
          {(dashboard?.autopilotRules || []).length > 0 && (
            <View className="bg-[#0084FF] px-1.5 py-0.5 rounded-full">
              <Text className="text-[9px] text-white font-black">{(dashboard?.autopilotRules || []).length}</Text>
            </View>
          )}
        </Pressable>

        <Pressable
          className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl border ${
            activeSection === 'orders' ? 'bg-[#0084FF]/20 border-[#0084FF]' : 'bg-[#181A1F] border-[#262930]'
          }`}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveSection('orders');
          }}
        >
          <Ionicons name="time-outline" size={14} color={activeSection === 'orders' ? '#0084FF' : '#94A3B8'} />
          <Text className={`text-xs font-bold ${activeSection === 'orders' ? 'text-[#0084FF]' : 'text-slate-400'}`}>
            Orders
          </Text>
          {(dashboard?.orders || []).length > 0 && (
            <View className="bg-[#0084FF] px-1.5 py-0.5 rounded-full">
              <Text className="text-[9px] text-white font-black">{(dashboard?.orders || []).length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* ── SECTION 1: ONE-TIME MESSAGE BOOST ─────────────────────────────── */}
      {activeSection === 'boost' && (
        <View className="rounded-2xl p-4 border border-[#262930] bg-[#181A1F] gap-3.5">
          <View>
            <Text className="text-base font-black text-white">One-Time Message Boost</Text>
            <Text className="text-xs text-slate-400 mt-0.5">
              Boost a single message or post link with custom reactions, views, or poll votes.
            </Text>
          </View>

          {/* Campaign Type Dropdown */}
          <View className="gap-1.5">
            <Text className="text-xs font-bold text-slate-300">Campaign Type</Text>
            <Pressable
              className="flex-row items-center justify-between p-3 rounded-xl border border-[#262930] bg-[#111317]"
              onPress={() => setIsCampaignDropdownOpen(!isCampaignDropdownOpen)}
            >
              <View className="flex-row items-center gap-2.5">
                <Ionicons name={currentService.icon as any} size={18} color="#0084FF" />
                <View>
                  <Text className="text-xs font-bold text-white">{currentService.label}</Text>
                  <Text className="text-[10px] text-slate-400">{currentService.desc}</Text>
                </View>
              </View>
              <Ionicons
                name={isCampaignDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="#94A3B8"
              />
            </Pressable>

            {isCampaignDropdownOpen && (
              <View className="rounded-xl border border-[#262930] bg-[#111317] mt-1 overflow-hidden">
                {CAMPAIGN_TYPES.map((type) => (
                  <Pressable
                    key={type.id}
                    className={`flex-row items-center gap-2.5 p-3 border-b border-[#262930] ${
                      campaignType === type.id ? 'bg-[#0084FF]/15' : ''
                    }`}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCampaignType(type.id);
                      setIsCampaignDropdownOpen(false);
                    }}
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={16}
                      color={campaignType === type.id ? '#0084FF' : '#94A3B8'}
                    />
                    <View className="flex-1">
                      <Text
                        className={`text-xs font-semibold ${
                          campaignType === type.id ? 'text-[#0084FF] font-bold' : 'text-white'
                        }`}
                      >
                        {type.label}
                      </Text>
                      <Text className="text-[10px] text-slate-400">{type.desc}</Text>
                    </View>
                    {campaignType === type.id && (
                      <Ionicons name="checkmark-circle" size={16} color="#0084FF" />
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Telegram Message Link Input */}
          <View className="gap-1.5">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="link-outline" size={14} color="#0084FF" />
              <Text className="text-xs font-bold text-slate-300">Telegram Message Link</Text>
            </View>
            <TextInput
              className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2.5 text-xs text-white"
              placeholder="e.g. https://t.me/channel_name/123"
              placeholderTextColor="#64748B"
              value={postLink}
              onChangeText={setPostLink}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text className="text-[10px] text-amber-400 leading-4">
              ⚠️ Note: Private channels without an invite link or private message links ('t.me/c/...') are not supported.
            </Text>
          </View>

          {/* Select Reaction Emojis */}
          {(campaignType === 'reactions' || campaignType.startsWith('members')) && (
            <View className="gap-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-xs font-bold text-slate-300">
                  Select Reaction Emojis ({selectedEmojis.length} selected)
                </Text>
                <Pressable onPress={() => setSelectedEmojis(ALL_EMOJIS.slice(0, 10))}>
                  <Text className="text-[11px] text-[#0084FF] font-bold">Select Top 10</Text>
                </Pressable>
              </View>

              <View className="flex-row flex-wrap gap-1.5">
                {ALL_EMOJIS.map((emoji) => {
                  const isSelected = selectedEmojis.includes(emoji);
                  return (
                    <Pressable
                      key={emoji}
                      className={`w-10 h-10 rounded-xl border items-center justify-center relative ${
                        isSelected ? 'border-[#0084FF] bg-[#0084FF]/20' : 'border-[#262930] bg-[#111317]'
                      }`}
                      onPress={() => toggleEmoji(emoji)}
                    >
                      <Text className="text-lg">{emoji}</Text>
                      {isSelected && (
                        <View className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[#0084FF] items-center justify-center">
                          <Ionicons name="checkmark" size={8} color="#FFFFFF" />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {/* Random Quantities Switch */}
              <View className="flex-row items-center justify-between p-3 rounded-xl border border-[#262930] bg-[#111317] mt-1">
                <View className="flex-1 pr-2">
                  <Text className="text-xs font-bold text-white">Random Quantities</Text>
                  <Text className="text-[10px] text-slate-400">Spread counts randomly across selected emojis.</Text>
                </View>
                <Switch
                  value={isRandomSpread}
                  onValueChange={setIsRandomSpread}
                  trackColor={{ false: '#262930', true: '#0084FF' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          )}

          {/* Total Quantity */}
          <View className="gap-1.5">
            <View className="flex-row justify-between items-center">
              <Text className="text-xs font-bold text-slate-300">Total Quantity</Text>
              <Text className="text-[10px] text-slate-400">Min: 10 • Max: 100,000</Text>
            </View>

            {/* Presets */}
            <View className="flex-row gap-1.5">
              {QUANTITY_PRESETS.map((p) => (
                <Pressable
                  key={p}
                  className={`flex-1 py-2 rounded-xl border items-center ${
                    quantity === p ? 'bg-[#0084FF]/20 border-[#0084FF]' : 'bg-[#111317] border-[#262930]'
                  }`}
                  onPress={() => handleQtyPreset(p)}
                >
                  <Text
                    className={`text-xs font-bold ${
                      quantity === p ? 'text-[#0084FF]' : 'text-slate-300'
                    }`}
                  >
                    {p}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Custom Input */}
            <TextInput
              className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2 text-xs text-white mt-1"
              keyboardType="numeric"
              placeholder="Enter custom quantity (e.g. 50)"
              placeholderTextColor="#64748B"
              value={customQtyText}
              onChangeText={handleCustomQtyChange}
            />
          </View>

          {/* Delivery Speed */}
          <View className="gap-1.5">
            <Pressable
              className="flex-row items-center justify-between p-3 rounded-xl border border-[#262930] bg-[#111317]"
              onPress={() => setIsSpeedOpen(!isSpeedOpen)}
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="time-outline" size={15} color="#0084FF" />
                <Text className="text-xs font-bold text-slate-300">Delivery Speed</Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <Text className="text-xs text-[#0084FF] font-bold">
                  {DELIVERY_SPEEDS.find((s) => s.id === deliverySpeed)?.label || deliverySpeed}
                </Text>
                <Ionicons
                  name={isSpeedOpen ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color="#94A3B8"
                />
              </View>
            </Pressable>

            {isSpeedOpen && (
              <View className="rounded-xl border border-[#262930] bg-[#111317] overflow-hidden">
                {DELIVERY_SPEEDS.map((s) => (
                  <Pressable
                    key={s.id}
                    className={`p-3 border-b border-[#262930] ${
                      deliverySpeed === s.id ? 'bg-[#0084FF]/15' : ''
                    }`}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setDeliverySpeed(s.id);
                      setIsSpeedOpen(false);
                    }}
                  >
                    <Text
                      className={`text-xs ${
                        deliverySpeed === s.id ? 'text-[#0084FF] font-bold' : 'text-slate-300'
                      }`}
                    >
                      {s.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Real-Time Cost Calculation Box */}
          <View className="p-3 rounded-xl border border-[#262930] bg-[#111317] gap-2">
            <View className="flex-row justify-between items-center">
              <Text className="text-xs text-slate-400">Order Cost ({quantity} items):</Text>
              <Text className="text-xs font-black text-sky-400">₹{orderCost.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-xs text-slate-400">Wallet Balance:</Text>
              <Text className="text-xs font-black text-white">₹{walletBalance.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between items-center pt-2 border-t border-[#262930]">
              <Text className="text-xs text-slate-400 font-semibold">Balance after order:</Text>
              <Text className={`text-xs font-black ${balanceAfterOrder < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {balanceAfterOrder < 0 ? `-₹${Math.abs(balanceAfterOrder).toFixed(2)}` : `₹${balanceAfterOrder.toFixed(2)}`}
              </Text>
            </View>

            {/* Insufficient Warning */}
            {isInsufficient && (
              <View className="flex-row items-center justify-between p-2 rounded-lg bg-red-500/15 border border-red-500/30 mt-1">
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="alert-circle" size={15} color="#EF4444" />
                  <Text className="text-[11px] font-bold text-red-400">Need ₹{shortfall.toFixed(2)} more</Text>
                </View>
                <Pressable
                  className="px-2.5 py-1 rounded bg-red-500"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setTopUpAmount(50);
                    setCustomTopUpText('50');
                    setIsTopUpOpen(true);
                  }}
                >
                  <Text className="text-[10px] font-black text-white">+ Top Up ₹50</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Action Button */}
          {isInsufficient ? (
            <Pressable
              className="py-3.5 rounded-xl items-center flex-row justify-center gap-2 bg-indigo-600"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTopUpAmount(50);
                setIsTopUpOpen(true);
              }}
            >
              <Ionicons name="card-outline" size={16} color="#FFFFFF" />
              <Text className="text-xs font-extrabold text-white">Add ₹50 to Place Order</Text>
            </Pressable>
          ) : (
            <Pressable
              className={`py-3.5 rounded-xl items-center flex-row justify-center gap-2 bg-[#0084FF] ${
                isPlacingOrder ? 'opacity-70' : ''
              }`}
              disabled={isPlacingOrder}
              onPress={handleLaunchCampaign}
            >
              {isPlacingOrder ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="rocket" size={16} color="#FFFFFF" />
                  <Text className="text-xs font-extrabold text-white">
                    Launch Boost Campaign (₹{orderCost.toFixed(2)})
                  </Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      )}

      {/* ── SECTION 2: AUTO-PILOT SETTINGS ───────────────────────────────── */}
      {activeSection === 'autopilot' && (
        <View className="rounded-2xl p-4 border border-[#262930] bg-[#181A1F] gap-3.5">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-2">
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="flash" size={16} color="#FBBF24" />
                <Text className="text-base font-black text-white">Auto-Pilot Settings</Text>
              </View>
              <Text className="text-xs text-slate-400 mt-0.5">
                Automatically deliver views and emoji reactions to all new posts in your channel.
              </Text>
            </View>
            <Pressable
              className="flex-row items-center gap-1 bg-[#0084FF] px-3 py-1.5 rounded-xl"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsAddRuleOpen(true);
              }}
            >
              <Ionicons name="add" size={14} color="#FFFFFF" />
              <Text className="text-xs font-bold text-white">Add Rule</Text>
            </Pressable>
          </View>

          {/* Setup Instructions Box */}
          <View className="flex-row gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <Ionicons name="bulb-outline" size={18} color="#F59E0B" />
            <Text className="text-[11px] text-slate-300 flex-1 leading-4">
              <Text className="font-bold text-amber-400">Setup:</Text> Add our bot{' '}
              <Text className="font-bold text-sky-400">@GapAutoPilotBot</Text> as an{' '}
              <Text className="font-bold text-white">Administrator</Text> in your channel, then register your channel below. (Public Channels Only)
            </Text>
          </View>

          {/* Rules List / Empty State */}
          {isLoading ? (
            <ActivityIndicator size="small" color="#0084FF" className="my-6" />
          ) : (dashboard?.autopilotRules || []).length === 0 ? (
            <View className="p-6 items-center rounded-xl bg-[#111317] border border-[#262930]">
              <Ionicons name="sparkles-outline" size={32} color="#64748B" />
              <Text className="text-sm font-black text-white mt-2">No active Auto-Pilot rules</Text>
              <Text className="text-xs text-slate-400 text-center mt-1 mb-4 leading-4">
                Click "Add Rule" to register your public channel and automate post engagement.
              </Text>
              <Pressable
                className="bg-[#0084FF] px-4 py-2 rounded-xl"
                onPress={() => setIsAddRuleOpen(true)}
              >
                <Text className="text-xs font-bold text-white">+ Add First Channel Rule</Text>
              </Pressable>
            </View>
          ) : (
            <View className="gap-2.5">
              {(dashboard?.autopilotRules || []).map((rule: ReactionAutopilotRule) => (
                <View key={rule.id} className="p-3.5 rounded-xl border border-[#262930] bg-[#111317]">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2 flex-1 pr-2">
                      <View className="w-7 h-7 rounded-lg bg-[#0084FF]/20 items-center justify-center">
                        <Ionicons name="megaphone" size={13} color="#0084FF" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-white" numberOfLines={1}>
                          @{rule.channel_username}
                        </Text>
                        <Text className="text-[10px] text-slate-400">
                          {rule.min_quantity} - {rule.max_quantity} reactions per post
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center gap-3">
                      <Switch
                        value={rule.is_active}
                        onValueChange={(val) => {
                          toggleRule({ ruleId: rule.id, isActive: val });
                        }}
                        trackColor={{ false: '#262930', true: '#10B981' }}
                        thumbColor="#FFFFFF"
                      />
                      <Pressable
                        onPress={() => {
                          Alert.alert(
                            'Delete Rule',
                            `Are you sure you want to stop autopilot for @${rule.channel_username}?`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Delete', style: 'destructive', onPress: () => deleteRule(rule.id) },
                            ]
                          );
                        }}
                      >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      </Pressable>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-1.5 mt-2.5 pt-2.5 border-t border-[#262930]">
                    <Text className="text-[10px] text-slate-400 font-semibold">Target Emojis:</Text>
                    <Text className="text-sm">{(rule.reactions || []).join(' ')}</Text>
                  </View>

                  {typeof rule.posts_processed === 'number' && (
                    <View className="mt-1.5">
                      <Text className="text-[10px] text-slate-400">
                        ⚡ Posts Processed: {rule.posts_processed}
                        {rule.posts_limit ? ` / ${rule.posts_limit}` : ' (Unlimited)'}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* ── SECTION 3: ORDERS & CAMPAIGNS HISTORY ────────────────────────── */}
      {activeSection === 'orders' && (
        <View className="rounded-2xl p-4 border border-[#262930] bg-[#181A1F] gap-3.5">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-2">
              <Text className="text-base font-black text-white">Orders & Campaigns</Text>
              <Text className="text-xs text-slate-400 mt-0.5">
                Track status and delivery details of your manual and autopilot campaigns.
              </Text>
            </View>

            <Pressable
              className="flex-row items-center gap-1 bg-[#111317] border border-[#262930] px-2.5 py-1.5 rounded-lg"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                refetch();
              }}
            >
              <Ionicons name="sync-outline" size={13} color="#0084FF" />
              <Text className="text-[11px] font-bold text-[#0084FF]">Sync</Text>
            </Pressable>
          </View>

          {/* Filter Bar */}
          <View className="flex-row gap-1.5">
            {(['All', 'Completed', 'In Progress', 'Canceled'] as const).map((f) => (
              <Pressable
                key={f}
                className={`flex-1 py-2 rounded-xl border items-center ${
                  statusFilter === f ? 'bg-[#0084FF]/20 border-[#0084FF]' : 'bg-[#111317] border-[#262930]'
                }`}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setStatusFilter(f);
                }}
              >
                <Text
                  className={`text-xs font-bold ${
                    statusFilter === f ? 'text-[#0084FF]' : 'text-slate-400'
                  }`}
                >
                  {f}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Orders List / Empty State */}
          {isLoading ? (
            <ActivityIndicator size="small" color="#0084FF" className="my-8" />
          ) : filteredOrders.length === 0 ? (
            <View className="p-6 items-center rounded-xl bg-[#111317] border border-[#262930]">
              <Ionicons name="hardware-chip-outline" size={40} color="#64748B" />
              <Text className="text-sm font-black text-white mt-2">No Campaigns Launched Yet</Text>
              <Text className="text-xs text-slate-400 text-center mt-1 mb-4 leading-4">
                Select your target post link, choose reactions or views from the Boost panel and boost your Telegram channel instantly.
              </Text>
              <Pressable
                className="flex-row items-center gap-1.5 bg-[#0084FF] px-4 py-2 rounded-xl"
                onPress={() => setActiveSection('boost')}
              >
                <Ionicons name="rocket-outline" size={14} color="#FFFFFF" />
                <Text className="text-xs font-bold text-white">Start First Boost</Text>
              </Pressable>
            </View>
          ) : (
            <View className="gap-2.5">
              {filteredOrders.map((order: ReactionOrder) => {
                const isCompleted = (order.status || '').toLowerCase() === 'completed';
                const isCanceled = (order.status || '').toLowerCase() === 'canceled';
                const statusColor = isCompleted ? '#10B981' : isCanceled ? '#EF4444' : '#F59E0B';

                return (
                  <View key={order.id} className="p-3 rounded-xl border border-[#262930] bg-[#111317] gap-2">
                    <View className="flex-row items-center justify-between">
                      <View className="px-2 py-0.5 rounded-md" style={{ backgroundColor: `${statusColor}22` }}>
                        <Text className="text-[10px] font-extrabold uppercase" style={{ color: statusColor }}>
                          {order.status || 'Processing'}
                        </Text>
                      </View>
                      <Text className="text-xs font-bold text-white">₹{(order.charge || 0).toFixed(2)}</Text>
                    </View>

                    <Pressable
                      className="flex-row items-center gap-1.5"
                      onPress={() => order.link && Linking.openURL(order.link)}
                    >
                      <Ionicons name="link" size={12} color="#0084FF" />
                      <Text className="text-xs text-[#0084FF] font-mono flex-1" numberOfLines={1}>
                        {order.link}
                      </Text>
                    </Pressable>

                    <View className="flex-row items-center justify-between pt-1 text-slate-400">
                      <Text className="text-[11px] text-slate-400">
                        Qty: <Text className="text-white font-bold">{order.quantity}</Text>
                      </Text>
                      {order.reactions && (
                        <Text className="text-[11px] text-slate-400">
                          Emojis: <Text className="text-sm">{order.reactions}</Text>
                        </Text>
                      )}
                      <Text className="text-[10px] text-slate-400">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : ''}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* ── MODAL 1: ADD AUTOPILOT RULE ───────────────────────────────────── */}
      <Modal visible={isAddRuleOpen} transparent animationType="slide">
        <View className="flex-1 bg-black/75 justify-center p-4">
          <View className="rounded-3xl p-5 border border-[#262930] bg-[#181A1F]">
            <View className="flex-row items-center justify-between mb-3.5">
              <View className="flex-row items-center gap-2">
                <Ionicons name="flash" size={18} color="#FBBF24" />
                <Text className="text-base font-black text-white">Add Auto-Pilot Rule</Text>
              </View>
              <Pressable onPress={() => setIsAddRuleOpen(false)}>
                <Ionicons name="close" size={20} color="#94A3B8" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 10 }}>
              <View className="flex-row gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <Ionicons name="shield-checkmark" size={16} color="#F59E0B" />
                <Text className="text-[11px] text-slate-300 flex-1 leading-4">
                  Ensure <Text className="font-bold text-sky-400">@GapAutoPilotBot</Text> is added as an administrator in your public channel before registering.
                </Text>
              </View>

              {/* Channel Username */}
              <View>
                <Text className="text-xs font-bold text-slate-300 mb-1">Public Channel Username</Text>
                <TextInput
                  className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2 text-xs text-white"
                  placeholder="e.g. trading_signals or @trading_signals"
                  placeholderTextColor="#64748B"
                  value={ruleChannel}
                  onChangeText={setRuleChannel}
                  autoCapitalize="none"
                />
              </View>

              {/* Min and Max Quantity */}
              <View className="flex-row gap-2.5">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-300 mb-1">Min Reactions</Text>
                  <TextInput
                    className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2 text-xs text-white"
                    keyboardType="numeric"
                    placeholder="10"
                    placeholderTextColor="#64748B"
                    value={ruleMinQty}
                    onChangeText={setRuleMinQty}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-300 mb-1">Max Reactions</Text>
                  <TextInput
                    className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2 text-xs text-white"
                    keyboardType="numeric"
                    placeholder="50"
                    placeholderTextColor="#64748B"
                    value={ruleMaxQty}
                    onChangeText={setRuleMaxQty}
                  />
                </View>
              </View>

              {/* Emoji Selection */}
              <View>
                <Text className="text-xs font-bold text-slate-300 mb-1.5">
                  Target Emojis ({ruleEmojis.length} selected)
                </Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {ALL_EMOJIS.slice(0, 18).map((emoji) => {
                    const isSelected = ruleEmojis.includes(emoji);
                    return (
                      <Pressable
                        key={emoji}
                        className={`w-9 h-9 rounded-xl border items-center justify-center relative ${
                          isSelected ? 'border-[#0084FF] bg-[#0084FF]/20' : 'border-[#262930] bg-[#111317]'
                        }`}
                        onPress={() => toggleRuleEmoji(emoji)}
                      >
                        <Text className="text-base">{emoji}</Text>
                        {isSelected && (
                          <View className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-[#0084FF] items-center justify-center">
                            <Ionicons name="checkmark" size={7} color="#FFFFFF" />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Posts Limit */}
              <View>
                <Text className="text-xs font-bold text-slate-300 mb-1">Posts Limit (Optional)</Text>
                <TextInput
                  className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2 text-xs text-white"
                  keyboardType="numeric"
                  placeholder="Leave blank for unlimited posts"
                  placeholderTextColor="#64748B"
                  value={rulePostsLimit}
                  onChangeText={setRulePostsLimit}
                />
              </View>

              {/* Submit Button */}
              <Pressable
                className={`py-3.5 rounded-xl items-center flex-row justify-center gap-2 bg-[#0084FF] mt-1 ${
                  isAddingRule ? 'opacity-70' : ''
                }`}
                disabled={isAddingRule}
                onPress={handleCreateRuleSubmit}
              >
                {isAddingRule ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                    <Text className="text-xs font-extrabold text-white">Register Channel Rule</Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 2: WALLET TOP-UP ────────────────────────────────────────── */}
      <Modal visible={isTopUpOpen} transparent animationType="slide">
        <View className="flex-1 bg-black/75 justify-center p-4">
          <View className="rounded-3xl p-5 border border-[#262930] bg-[#181A1F]">
            <View className="flex-row items-center justify-between mb-3.5">
              <View className="flex-row items-center gap-2">
                <Ionicons name="wallet" size={18} color="#818CF8" />
                <Text className="text-base font-black text-white">Top Up SMM Wallet</Text>
              </View>
              <Pressable onPress={() => setIsTopUpOpen(false)}>
                <Ionicons name="close" size={20} color="#94A3B8" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 10 }}>
              <View className="p-3.5 rounded-2xl border border-[#262930] bg-[#111317]">
                <Text className="text-[10px] font-bold text-slate-400 uppercase">Current Balance</Text>
                <Text className="text-2xl font-black text-white mt-0.5">₹{walletBalance.toFixed(2)}</Text>
                <Text className="text-[10px] text-slate-400 mt-1">Instant recharge via UPI, QR, NetBanking</Text>
              </View>

              {/* Presets */}
              <View>
                <Text className="text-xs font-bold text-slate-300 mb-1.5">Select Recharge Amount</Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {[50, 100, 250, 500, 1000, 2500].map((amt) => (
                    <Pressable
                      key={amt}
                      className={`w-[31%] py-2.5 rounded-xl border items-center ${
                        topUpAmount === amt ? 'bg-indigo-600 border-indigo-500' : 'bg-[#111317] border-[#262930]'
                      }`}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setTopUpAmount(amt);
                        setCustomTopUpText(String(amt));
                      }}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          topUpAmount === amt ? 'text-white' : 'text-slate-300'
                        }`}
                      >
                        ₹{amt}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Custom Input */}
              <View>
                <Text className="text-xs font-bold text-slate-300 mb-1">Or Enter Custom Amount (₹)</Text>
                <TextInput
                  className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2 text-xs text-white"
                  keyboardType="numeric"
                  placeholder="e.g. 150"
                  placeholderTextColor="#64748B"
                  value={customTopUpText}
                  onChangeText={(val) => {
                    setCustomTopUpText(val);
                    const n = parseInt(val, 10);
                    if (!isNaN(n) && n > 0) setTopUpAmount(n);
                  }}
                />
              </View>

              {/* Payment Gateway CTA */}
              <Pressable
                className="py-3.5 rounded-xl items-center flex-row justify-center gap-2 bg-indigo-600 mt-1"
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  Alert.alert(
                    'Instant Top-Up Gateway',
                    `Proceeding to checkout for ₹${topUpAmount}. (Integrated with Razorpay / UPI Gateway).`,
                    [
                      {
                        text: 'Simulate Success (Demo)',
                        onPress: () => {
                          setIsTopUpOpen(false);
                          refetch();
                        },
                      },
                      { text: 'Cancel', style: 'cancel' },
                    ]
                  );
                }}
              >
                <Ionicons name="flash" size={16} color="#FFFFFF" />
                <Text className="text-xs font-extrabold text-white">Proceed to Pay ₹{topUpAmount}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 3: GAP REACTIONS SERVICES EXPLORER ─────────────────────── */}
      <Modal visible={isServicesExplorerOpen} transparent animationType="slide">
        <View className="flex-1 bg-black/75 justify-center p-4">
          <View className="rounded-3xl p-5 border border-[#262930] bg-[#181A1F] max-h-[85%]">
            <View className="flex-row items-center justify-between mb-3.5">
              <View className="flex-row items-center gap-2">
                <Ionicons name="sparkles" size={18} color="#818CF8" />
                <Text className="text-base font-black text-white">GAP SMM Service Catalog</Text>
              </View>
              <Pressable onPress={() => setIsServicesExplorerOpen(false)}>
                <Ionicons name="close" size={20} color="#94A3B8" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ gap: 10, paddingBottom: 10 }}>
              {CAMPAIGN_TYPES.map((service) => (
                <View key={service.id} className="p-3.5 rounded-2xl border border-[#262930] bg-[#111317]">
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-row items-center gap-2">
                      <Ionicons name={service.icon as any} size={16} color="#818CF8" />
                      <Text className="text-xs font-bold text-white">{service.label}</Text>
                    </View>
                    <Text className="text-xs font-black text-indigo-400">₹{service.rate}/1k</Text>
                  </View>
                  <Text className="text-[11px] text-slate-400 mb-3">{service.desc}</Text>
                  <Pressable
                    className="py-2 rounded-xl items-center bg-[#181A1F] border border-[#262930]"
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCampaignType(service.id);
                      setIsServicesExplorerOpen(false);
                      setActiveSection('boost');
                    }}
                  >
                    <Text className="text-xs font-bold text-indigo-300">Select this service →</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};
