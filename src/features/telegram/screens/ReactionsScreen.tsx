import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { telegramApi } from '../api/telegramApi';
import { telegramSupabase } from '../api/telegramSupabase';
import { ReactionAutopilotRule, ReactionOrder, TelegramToolKey } from '../types';
import { useTheme, getColors } from '@/theme';

interface Props {
  chats?: any[];
  onOpenModal: (key: TelegramToolKey) => void;
}

type ReactionTab = 'autopilot' | 'boost' | 'orders';

const AVAILABLE_EMOJIS = [
  '👍', '❤️', '🔥', '👏', '🎉', '🤩', '🙏', '👌',
  '🕊️', '😍', '🐳', '⚡', '💯', '🎯', '🚀', '💎',
  '🥰', '🤝', '🏆', '💪'
];

const QUANTITY_PRESETS = [50, 100, 250, 500, 1000];

const CAMPAIGN_TYPES = [
  { id: 'reactions', label: 'Custom Reactions (₹14/1k)', rate: 14, icon: 'heart-outline' },
  { id: 'views', label: 'Auto Views (₹4.8/1k)', rate: 4.8, icon: 'eye-outline' },
  { id: 'members_30d', label: 'Channel Members 30d Refill (₹80/1k)', rate: 80, icon: 'people-outline' },
  { id: 'members_90d', label: 'Channel Members 90d Refill (₹150/1k)', rate: 150, icon: 'shield-checkmark-outline' },
  { id: 'members_365d', label: 'Channel Members 365d Refill (₹250/1k)', rate: 250, icon: 'ribbon-outline' },
];

export const ReactionsScreen: React.FC<Props> = ({ chats, onOpenModal }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const queryClient = useQueryClient();

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<ReactionTab>('autopilot');

  // Boost Form State
  const [campaignType, setCampaignType] = useState('reactions');
  const [postLink, setPostLink] = useState('');
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>(['👍', '❤️', '🔥']);
  const [quantity, setQuantity] = useState<number>(50);

  // Orders Filter State
  const [statusFilter, setStatusFilter] = useState<'All' | 'Completed' | 'Canceled'>('All');

  // Add Rule Modal State
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
  const [newChannel, setNewChannel] = useState('');
  const [newMinQty, setNewMinQty] = useState('10');
  const [newMaxQty, setNewMaxQty] = useState('20');
  const [newRuleEmojis, setNewRuleEmojis] = useState<string[]>(['👍', '❤️', '🔥']);
  const [newPostsLimit, setNewPostsLimit] = useState('');

  // Top Up Modal State
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);

  // Queries
  const { data: dashboard, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['telegram_reactions_dashboard'],
    queryFn: telegramApi.getReactionsDashboard,
    enabled: true,
  });

  const { data: summaryData } = useQuery({
    queryKey: ['telegram_all_data'],
    queryFn: telegramSupabase.getSummary,
  });

  // Mutations
  const { mutateAsync: toggleRule } = useMutation({
    mutationFn: telegramApi.toggleAutopilotRule,
    onSuccess: () => {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['telegram_reactions_dashboard'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to update channel rule');
    },
  });

  const { mutateAsync: createRule, isPending: isCreatingRule } = useMutation({
    mutationFn: telegramApi.createAutopilotRule,
    onSuccess: () => {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsAddRuleOpen(false);
      setNewChannel('');
      setNewPostsLimit('');
      queryClient.invalidateQueries({ queryKey: ['telegram_reactions_dashboard'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to create autopilot rule');
    },
  });

  const { mutateAsync: deleteRule } = useMutation({
    mutationFn: telegramApi.deleteAutopilotRule,
    onSuccess: () => {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['telegram_reactions_dashboard'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to delete rule');
    },
  });

  const { mutateAsync: placeOrder, isPending: isPlacingOrder } = useMutation({
    mutationFn: telegramApi.createReactionOrder,
    onSuccess: () => {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Order Placed! 🚀', 'Your reaction boost order has been submitted successfully.');
      setPostLink('');
      queryClient.invalidateQueries({ queryKey: ['telegram_reactions_dashboard'] });
      setActiveTab('orders');
    },
    onError: (err: any) => {
      Alert.alert('Order Failed', err.message || 'Could not place boost order.');
    },
  });

  const botUsername = dashboard?.botUsername || '@gaptgboostbot';
  const walletBalance = dashboard?.wallet?.balance ?? 49.86;
  const autopilotRules: ReactionAutopilotRule[] = dashboard?.autopilotRules || [];
  const autopilotCount = autopilotRules.length;
  const orders: ReactionOrder[] = dashboard?.orders || (summaryData?.loadedReactionOrders as any[]) || [];
  const ordersCount = orders.length;

  const currentCampaign = CAMPAIGN_TYPES.find((c) => c.id === campaignType) || CAMPAIGN_TYPES[0];
  const orderCost = Number(((quantity / 1000) * currentCampaign.rate).toFixed(2));
  const balanceAfter = Number((walletBalance - orderCost).toFixed(2));

  const toggleEmojiSelection = (emoji: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedEmojis.includes(emoji)) {
      if (selectedEmojis.length === 1) return;
      setSelectedEmojis(selectedEmojis.filter((e) => e !== emoji));
    } else {
      setSelectedEmojis([...selectedEmojis, emoji]);
    }
  };

  const toggleRuleEmoji = (emoji: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (newRuleEmojis.includes(emoji)) {
      if (newRuleEmojis.length === 1) return;
      setNewRuleEmojis(newRuleEmojis.filter((e) => e !== emoji));
    } else {
      setNewRuleEmojis([...newRuleEmojis, emoji]);
    }
  };

  const handleOpenBot = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const cleanUsername = botUsername.replace('@', '');
    Linking.openURL(`https://t.me/${cleanUsername}`);
  };

  const handleCreateRuleSubmit = async () => {
    if (!newChannel.trim()) {
      Alert.alert('Required', 'Please enter your channel username (e.g. @my_channel)');
      return;
    }
    const minQ = parseInt(newMinQty, 10) || 10;
    const maxQ = parseInt(newMaxQty, 10) || 20;
    const limit = newPostsLimit.trim() ? parseInt(newPostsLimit, 10) : null;

    await createRule({
      channelUsername: newChannel.trim(),
      minQuantity: minQ,
      maxQuantity: maxQ,
      reactions: newRuleEmojis,
      postsLimit: limit,
    });
  };

  const handleDeleteRuleConfirm = (ruleId: string, channelName: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Delete Rule',
      `Are you sure you want to stop autopilot reactions for ${channelName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteRule(ruleId) },
      ]
    );
  };

  const handlePlaceOrderSubmit = async () => {
    if (!postLink.trim()) {
      Alert.alert('Required', 'Please enter a valid Telegram message or post link.');
      return;
    }
    if (quantity < 10) {
      Alert.alert('Invalid Quantity', 'Minimum quantity is 10 items.');
      return;
    }
    if (balanceAfter < 0) {
      Alert.alert('Insufficient Balance', `Your order cost is ₹${orderCost}, but your wallet balance is ₹${walletBalance}. Please top up your wallet.`);
      return;
    }

    await placeOrder({
      link: postLink.trim(),
      quantity,
      reactions: selectedEmojis,
      campaignType: currentCampaign.id,
    });
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'All') return true;
    return o.status === statusFilter;
  });

  const card = isDark ? styles.cardDark : styles.cardLight;
  const txt = isDark ? styles.textDark : styles.textLight;
  const border = isDark ? styles.borderDark : styles.borderLight;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F8FAFC' }]}>
      {/* Top Header Card */}
      <View style={[styles.heroHeader, card]}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.heroTitle, txt]}>GAP Reactions</Text>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Live SMM</Text>
              </View>
            </View>
            <Text style={styles.heroSub}>Auto-pilot post booster & instant SMM delivery</Text>
          </View>
        </View>

        {/* Balance & Top Up Bar */}
        <View style={[styles.balanceCard, isDark ? styles.balanceCardDark : styles.balanceCardLight]}>
          <View style={styles.balanceLeft}>
            <View style={styles.walletIconCircle}>
              <Ionicons name="wallet-outline" size={16} color="#0284C7" />
            </View>
            <View>
              <Text style={styles.balanceLabel}>Balance</Text>
              <Text style={[styles.balanceAmount, txt]}>₹{walletBalance.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.balanceRight}>
            <Pressable
              style={styles.refreshIconBtn}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                refetch();
              }}
            >
              <Ionicons name="refresh-outline" size={14} color="#CBD5E1" />
            </Pressable>

            <Pressable
              style={styles.topUpBtn}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsTopUpOpen(true);
              }}
            >
              <Ionicons name="add" size={14} color="#FFFFFF" />
              <Text style={styles.topUpBtnText}>Top Up</Text>
            </Pressable>
          </View>
        </View>

        {/* Segmented Sub-Nav Bar */}
        <View style={styles.navBar}>
          <Pressable
            style={[styles.navTab, activeTab === 'autopilot' && styles.navTabActive]}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('autopilot');
            }}
          >
            <Ionicons name="flash-outline" size={13} color={activeTab === 'autopilot' ? '#0284C7' : '#94A3B8'} />
            <Text style={[styles.navTabText, activeTab === 'autopilot' && styles.navTabTextActive]}>Auto Pilot</Text>
          </Pressable>

          <Pressable
            style={[styles.navTab, activeTab === 'boost' && styles.navTabActive]}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('boost');
            }}
          >
            <Ionicons name="color-wand-outline" size={13} color={activeTab === 'boost' ? '#0284C7' : '#94A3B8'} />
            <Text style={[styles.navTabText, activeTab === 'boost' && styles.navTabTextActive]}>Boost Post</Text>
          </Pressable>

          <Pressable
            style={[styles.navTab, activeTab === 'orders' && styles.navTabActive]}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('orders');
            }}
          >
            <Ionicons name="cube-outline" size={13} color={activeTab === 'orders' ? '#0284C7' : '#94A3B8'} />
            <Text style={[styles.navTabText, activeTab === 'orders' && styles.navTabTextActive]}>Orders</Text>
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>{ordersCount}</Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Bot Admin Setup Banner */}
      <View style={styles.bannerCard}>
        <Pressable style={styles.bannerRow} onPress={handleOpenBot}>
          <View style={styles.botIconBox}>
            <Ionicons name="paper-plane" size={18} color="#0284C7" />
          </View>
          <View style={{ flex: 1, paddingRight: 6 }}>
            <Text style={styles.bannerTitle}>Bot Administrator Setup</Text>
            <Text style={styles.bannerDesc}>
              Add <Text style={styles.linkText}>{botUsername}</Text> as an Administrator to your channel, then tap "+ Add Channel" below.
            </Text>
          </View>
          <Ionicons name="open-outline" size={16} color="#0284C7" />
        </Pressable>
      </View>

      {/* TAB 1: AUTOPILOT CHANNELS */}
      {activeTab === 'autopilot' && (
        <View style={[styles.sectionCard, card]}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, txt]}>Connected Channels ({autopilotCount})</Text>
              <Text style={styles.sectionSub}>Automatic emoji booster delivers to every new post.</Text>
            </View>
            <Pressable
              style={styles.addChannelBtn}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsAddRuleOpen(true);
              }}
            >
              <Ionicons name="add" size={14} color="#FFFFFF" />
              <Text style={styles.addChannelBtnText}>Add Channel</Text>
            </Pressable>
          </View>

          {autopilotCount === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="radio-outline" size={36} color="#0284C7" style={{ marginBottom: 8 }} />
              <Text style={[styles.emptyTitle, txt]}>No Autopilot Channels</Text>
              <Text style={styles.emptyDesc}>
                Add {botUsername} to your Telegram channel and register it to start automatic reactions.
              </Text>
              <Pressable
                style={styles.registerBtn}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsAddRuleOpen(true);
                }}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.registerBtnText}>Register Channel</Text>
              </Pressable>
            </View>
          ) : (
            autopilotRules.map((rule) => {
              const chName = rule.channel_username || (rule as any).channelUsername || 'Channel';
              const isActive = rule.is_active ?? (rule as any).isActive ?? true;
              const minQ = rule.min_quantity ?? (rule as any).minQuantity ?? 10;
              const maxQ = rule.max_quantity ?? (rule as any).maxQuantity ?? 20;
              const limit = rule.posts_limit ?? (rule as any).postsLimit;

              return (
                <View key={rule.id} style={[styles.ruleCard, isDark ? styles.itemDark : styles.itemLight]}>
                  <View style={styles.ruleTop}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.ruleChannel, txt]}>{chName}</Text>
                        <View style={[styles.statusTag, isActive ? styles.statusTagActive : styles.statusTagPaused]}>
                          <Text style={[styles.statusTagText, isActive ? styles.statusTextActive : styles.statusTextPaused]}>
                            {isActive ? 'Active' : 'Paused'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.ruleMeta}>
                        {minQ}-{maxQ} reactions • {limit ? `${limit} posts limit` : 'Unlimited posts'}
                      </Text>
                    </View>
                    <Switch
                      value={isActive}
                      onValueChange={(val) => {
                        toggleRule({ ruleId: rule.id, isActive: val });
                      }}
                      trackColor={{ false: '#3F3F46', true: '#0284C7' }}
                      thumbColor="#FFFFFF"
                    />
                    <Pressable
                      style={{ marginLeft: 8, padding: 4 }}
                      onPress={() => handleDeleteRuleConfirm(rule.id, chName)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </Pressable>
                  </View>
                  <View style={styles.ruleEmojisRow}>
                    <Text style={styles.ruleEmojiLabel}>Active emojis:</Text>
                    <Text style={styles.ruleEmojis}>{(rule.reactions || []).join('  ')}</Text>
                  </View>
                </View>
              );
            })
          )}

          {/* Footer Notice */}
          <View style={styles.noticeFooter}>
            <Ionicons name="information-circle-outline" size={14} color="#64748B" />
            <Text style={styles.noticeText}>Only public Telegram channels are supported for automated reactions.</Text>
          </View>
        </View>
      )}

      {/* TAB 2: BOOST POST FORM */}
      {activeTab === 'boost' && (
        <View style={[styles.sectionCard, card]}>
          <Text style={[styles.sectionTitle, txt]}>Instant Post Booster</Text>
          <Text style={styles.sectionSub}>Boost reactions, views, or members instantly for any Telegram post.</Text>

          {/* Campaign Selector */}
          <Text style={styles.inputLabel}>CAMPAIGN TYPE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {CAMPAIGN_TYPES.map((c) => (
                <Pressable
                  key={c.id}
                  style={[styles.campaignChip, campaignType === c.id && styles.campaignChipActive]}
                  onPress={() => setCampaignType(c.id)}
                >
                  <Ionicons name={c.icon as any} size={14} color={campaignType === c.id ? '#FFFFFF' : '#0284C7'} />
                  <Text style={[styles.campaignChipText, campaignType === c.id && styles.campaignChipTextActive]}>
                    {c.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Post URL Input */}
          <Text style={styles.inputLabel}>TELEGRAM POST LINK *</Text>
          <TextInput
            style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
            value={postLink}
            onChangeText={setPostLink}
            placeholder="https://t.me/channel_name/123"
            placeholderTextColor="#64748B"
            autoCapitalize="none"
          />

          {/* Quantity Selector */}
          <Text style={[styles.inputLabel, { marginTop: 12 }]}>QUANTITY</Text>
          <View style={styles.presetRow}>
            {QUANTITY_PRESETS.map((q) => (
              <Pressable
                key={q}
                style={[styles.presetChip, quantity === q && styles.presetChipActive]}
                onPress={() => setQuantity(q)}
              >
                <Text style={[styles.presetChipText, quantity === q && styles.presetChipTextActive]}>{q}</Text>
              </Pressable>
            ))}
          </View>

          {/* Emojis Grid (for reactions) */}
          {campaignType === 'reactions' && (
            <>
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>SELECT REACTION EMOJIS</Text>
              <View style={styles.emojiGrid}>
                {AVAILABLE_EMOJIS.map((e) => {
                  const active = selectedEmojis.includes(e);
                  return (
                    <Pressable
                      key={e}
                      style={[styles.emojiItem, active && styles.emojiItemActive]}
                      onPress={() => toggleEmojiSelection(e)}
                    >
                      <Text style={{ fontSize: 20 }}>{e}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {/* Price Summary */}
          <View style={styles.priceSummaryBox}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 12, color: '#94A3B8' }}>Total Cost:</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#0284C7' }}>₹{orderCost.toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 11, color: '#64748B' }}>Balance After Order:</Text>
              <Text style={{ fontSize: 11, color: balanceAfter < 0 ? '#EF4444' : '#10B981', fontWeight: '700' }}>
                ₹{balanceAfter.toFixed(2)}
              </Text>
            </View>
          </View>

          <Pressable style={styles.primaryBtn} onPress={handlePlaceOrderSubmit} disabled={isPlacingOrder}>
            {isPlacingOrder ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="rocket-outline" size={16} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Place Boost Order (₹{orderCost})</Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      {/* TAB 3: ORDERS ARCHIVE */}
      {activeTab === 'orders' && (
        <View style={[styles.sectionCard, card]}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionTitle, txt]}>Boost Orders Archive</Text>
              <Text style={styles.sectionSub}>Live status of all submitted reaction & SMM orders.</Text>
            </View>
          </View>

          {/* Filter Pills */}
          <View style={{ flexDirection: 'row', gap: 6, marginVertical: 10 }}>
            {(['All', 'Completed', 'Canceled'] as const).map((st) => (
              <Pressable
                key={st}
                style={[styles.filterPill, statusFilter === st && styles.filterPillActive]}
                onPress={() => setStatusFilter(st)}
              >
                <Text style={[styles.filterPillText, statusFilter === st && styles.filterPillTextActive]}>{st}</Text>
              </Pressable>
            ))}
          </View>

          {filteredOrders.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="cube-outline" size={32} color="#0284C7" style={{ marginBottom: 6 }} />
              <Text style={[styles.emptyTitle, txt]}>No Orders Found</Text>
              <Text style={styles.emptyDesc}>Submit a boost order or register an autopilot channel to start.</Text>
            </View>
          ) : (
            filteredOrders.map((ord: any, idx: number) => (
              <View key={ord.id || idx} style={[styles.orderItem, isDark ? styles.itemDark : styles.itemLight]}>
                <View style={styles.orderLeft}>
                  <Text style={[styles.orderLink, txt]} numberOfLines={1}>{ord.link || ord.target_post_url || 'Telegram Order'}</Text>
                  <Text style={styles.orderMeta}>
                    Qty: {ord.quantity} • {ord.campaign_type || 'Reactions'} • ₹{ord.cost || ord.price || '0'}
                  </Text>
                </View>
                <View style={[styles.statusTag, ord.status === 'Completed' ? styles.statusTagActive : styles.statusTagPaused]}>
                  <Text style={[styles.statusTagText, ord.status === 'Completed' ? styles.statusTextActive : styles.statusTextPaused]}>
                    {ord.status || 'Completed'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* MODAL: ADD AUTOPILOT CHANNEL */}
      <Modal visible={isAddRuleOpen} transparent animationType="fade" onRequestClose={() => setIsAddRuleOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, card]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, txt]}>Register Autopilot Channel</Text>
              <Pressable onPress={() => setIsAddRuleOpen(false)}>
                <Ionicons name="close" size={20} color="#94A3B8" />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>CHANNEL USERNAME OR ID *</Text>
            <TextInput
              style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
              value={newChannel}
              onChangeText={setNewChannel}
              placeholder="@my_trading_channel"
              placeholderTextColor="#64748B"
              autoCapitalize="none"
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>MIN REACTION</Text>
                <TextInput
                  style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                  value={newMinQty}
                  onChangeText={setNewMinQty}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>MAX REACTION</Text>
                <TextInput
                  style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                  value={newMaxQty}
                  onChangeText={setNewMaxQty}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>AUTOPILOT EMOJIS</Text>
            <View style={styles.emojiGrid}>
              {AVAILABLE_EMOJIS.slice(0, 10).map((e) => {
                const active = newRuleEmojis.includes(e);
                return (
                  <Pressable
                    key={e}
                    style={[styles.emojiItem, active && styles.emojiItemActive]}
                    onPress={() => toggleRuleEmoji(e)}
                  >
                    <Text style={{ fontSize: 18 }}>{e}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Pressable style={[styles.modalCancelBtn, border]} onPress={() => setIsAddRuleOpen(false)}>
                <Text style={[styles.modalCancelBtnText, txt]}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSubmitBtn} onPress={handleCreateRuleSubmit} disabled={isCreatingRule}>
                {isCreatingRule ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Register Channel</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: TOP UP WALLET */}
      <Modal visible={isTopUpOpen} transparent animationType="fade" onRequestClose={() => setIsTopUpOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, card]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, txt]}>Top Up Wallet</Text>
              <Pressable onPress={() => setIsTopUpOpen(false)}>
                <Ionicons name="close" size={20} color="#94A3B8" />
              </Pressable>
            </View>
            <Text style={{ fontSize: 13, color: '#94A3B8', marginBottom: 16, lineHeight: 18 }}>
              Add funds to your SMM wallet to enable automatic reactions and high-volume post boosting.
            </Text>
            <Pressable
              style={styles.modalSubmitBtn}
              onPress={() => {
                setIsTopUpOpen(false);
                Linking.openURL('https://getaipilot.in/pricing');
              }}
            >
              <Ionicons name="card-outline" size={16} color="#FFFFFF" />
              <Text style={styles.modalSubmitBtnText}>Add Funds (Web Portal)</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  cardDark: { backgroundColor: '#121212', borderColor: '#27272A' },
  cardLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  textDark: { color: '#F8FAFC' },
  textLight: { color: '#0F172A' },
  borderDark: { borderColor: '#27272A' },
  borderLight: { borderColor: '#E2E8F0' },
  heroHeader: { padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  heroTitle: { fontSize: 17, fontWeight: '800' },
  heroSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16,185,129,0.12)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 12 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  liveText: { fontSize: 10, color: '#10B981', fontWeight: '700' },
  balanceCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderRadius: 12, marginBottom: 12 },
  balanceCardDark: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: '#27272A' },
  balanceCardLight: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  balanceLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  walletIconCircle: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(2,132,199,0.12)', alignItems: 'center', justifyContent: 'center' },
  balanceLabel: { fontSize: 10, color: '#64748B', fontWeight: '600' },
  balanceAmount: { fontSize: 16, fontWeight: '800' },
  balanceRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  refreshIconBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  topUpBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0284C7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  topUpBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  navBar: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 3, gap: 4 },
  navTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 8 },
  navTabActive: { backgroundColor: '#27272A' },
  navTabText: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
  navTabTextActive: { color: '#FFFFFF', fontWeight: '700' },
  badgePill: { backgroundColor: '#0284C7', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 8 },
  badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  bannerCard: { backgroundColor: 'rgba(2,132,199,0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(2,132,199,0.25)', padding: 12, marginBottom: 12 },
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  botIconBox: { width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(2,132,199,0.15)', alignItems: 'center', justifyContent: 'center' },
  bannerTitle: { fontSize: 12, fontWeight: '700', color: '#F8FAFC' },
  bannerDesc: { fontSize: 11, color: '#94A3B8', marginTop: 2, lineHeight: 15 },
  linkText: { color: '#38BDF8', fontWeight: '700' },
  sectionCard: { padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '800' },
  sectionSub: { fontSize: 11, color: '#64748B', marginTop: 1 },
  addChannelBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0284C7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  addChannelBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  emptyBox: { alignItems: 'center', justifyContent: 'center', padding: 24, borderWidth: 1, borderStyle: 'dashed', borderColor: '#27272A', borderRadius: 14, marginVertical: 8 },
  emptyTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  emptyDesc: { fontSize: 11, color: '#64748B', textAlign: 'center', lineHeight: 16, marginBottom: 12, maxWidth: 280 },
  registerBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0284C7', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  registerBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  ruleCard: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  itemDark: { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: '#27272A' },
  itemLight: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  ruleTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ruleChannel: { fontSize: 13, fontWeight: '700' },
  statusTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  statusTagActive: { backgroundColor: 'rgba(16,185,129,0.12)' },
  statusTagPaused: { backgroundColor: 'rgba(239,68,68,0.12)' },
  statusTagText: { fontSize: 10, fontWeight: '700' },
  statusTextActive: { color: '#10B981' },
  statusTextPaused: { color: '#EF4444' },
  ruleMeta: { fontSize: 11, color: '#64748B', marginTop: 3 },
  ruleEmojisRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  ruleEmojiLabel: { fontSize: 10, color: '#64748B', fontWeight: '600' },
  ruleEmojis: { fontSize: 16 },
  noticeFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#27272A' },
  noticeText: { fontSize: 10, color: '#64748B', flex: 1 },
  inputLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 6 },
  input: { height: 42, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 13 },
  inputDark: { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: '#27272A', color: '#F8FAFC' },
  inputLight: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', color: '#0F172A' },
  campaignChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#27272A', backgroundColor: 'rgba(255,255,255,0.04)' },
  campaignChipActive: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  campaignChipText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  campaignChipTextActive: { color: '#FFFFFF', fontWeight: '700' },
  presetRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  presetChip: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#27272A', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  presetChipActive: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  presetChipText: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },
  presetChipTextActive: { color: '#FFFFFF' },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  emojiItem: { width: 38, height: 38, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#27272A' },
  emojiItemActive: { backgroundColor: 'rgba(2,132,199,0.2)', borderColor: '#0284C7' },
  priceSummaryBox: { backgroundColor: 'rgba(2,132,199,0.08)', borderRadius: 10, padding: 12, marginVertical: 12, borderWidth: 1, borderColor: 'rgba(2,132,199,0.2)' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#0284C7', borderRadius: 12, paddingVertical: 12 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  filterPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, borderWidth: 1, borderColor: '#27272A', backgroundColor: 'rgba(255,255,255,0.04)' },
  filterPillActive: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  filterPillText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  filterPillTextActive: { color: '#FFFFFF', fontWeight: '700' },
  orderItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  orderLeft: { flex: 1, paddingRight: 8 },
  orderLink: { fontSize: 12, fontWeight: '700' },
  orderMeta: { fontSize: 11, color: '#64748B', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalCard: { borderRadius: 18, borderWidth: 1, padding: 18 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 16, fontWeight: '800' },
  modalCancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  modalCancelBtnText: { fontSize: 12, fontWeight: '700' },
  modalSubmitBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#0284C7', paddingVertical: 10, borderRadius: 10 },
  modalSubmitBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});
