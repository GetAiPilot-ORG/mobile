import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { telegramApi } from '../api/telegramApi';
import { ReactionAutopilotRule, ReactionOrder } from '../types';

interface ReactionsModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdate?: (emojis: string[], speed: string) => Promise<void>;
}

type ReactionTab = 'autopilot' | 'boost' | 'orders';

const AVAILABLE_EMOJIS = [
  '👍', '❤️', '🔥', '👏', '🎉', '🤩', '🙏', '👌',
  '🕊️', '😍', '🐳', '⚡', '💯', '🎯', '🚀', '💎',
  '🥰', '🤝', '🏆', '🎉'
];

const QUANTITY_PRESETS = [50, 100, 250, 500, 1000];

const CAMPAIGN_TYPES = [
  { id: 'reactions', label: 'Custom Reactions (₹14/1k)', rate: 14, icon: 'heart-outline' },
  { id: 'views', label: 'Auto Views (₹4.8/1k)', rate: 4.8, icon: 'eye-outline' },
  { id: 'members_30d', label: 'Channel Members 30d Refill (₹80/1k)', rate: 80, icon: 'people-outline' },
  { id: 'members_90d', label: 'Channel Members 90d Refill (₹150/1k)', rate: 150, icon: 'shield-checkmark-outline' },
  { id: 'members_365d', label: 'Channel Members 365d Refill (₹250/1k)', rate: 250, icon: 'ribbon-outline' },
];

export const ReactionsModal: React.FC<ReactionsModalProps> = ({
  visible,
  onClose,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const queryClient = useQueryClient();

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<ReactionTab>('autopilot');

  // Boost Form State
  const [campaignType, setCampaignType] = useState('reactions');
  const [postLink, setPostLink] = useState('');
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>(['👍', '❤️', '🔥']);
  const [isRandomSpread, setIsRandomSpread] = useState(true);
  const [quantity, setQuantity] = useState<number>(50);
  const [speed, setSpeed] = useState('Instant');
  const [isSpeedOpen, setIsSpeedOpen] = useState(false);

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
    enabled: visible,
  });

  // Mutations
  const { mutateAsync: toggleRule } = useMutation({
    mutationFn: telegramApi.toggleAutopilotRule,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['telegram_reactions_dashboard'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to update channel rule');
    },
  });

  const { mutateAsync: createRule, isPending: isCreatingRule } = useMutation({
    mutationFn: telegramApi.createAutopilotRule,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['telegram_reactions_dashboard'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to delete rule');
    },
  });

  const { mutateAsync: placeOrder, isPending: isPlacingOrder } = useMutation({
    mutationFn: telegramApi.createReactionOrder,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Order Placed! 🚀', 'Your reaction boost order has been submitted successfully.');
      setPostLink('');
      queryClient.invalidateQueries({ queryKey: ['telegram_reactions_dashboard'] });
      setActiveTab('orders'); // Jump to orders history to see it live!
    },
    onError: (err: any) => {
      Alert.alert('Order Failed', err.message || 'Could not place boost order.');
    },
  });

  const botUsername = dashboard?.botUsername || '@gaptgboostbot';
  const walletBalance = dashboard?.wallet?.balance ?? 100;
  const autopilotCount = (dashboard?.autopilotRules || []).length;
  const ordersCount = (dashboard?.orders || []).length;

  // Selected Campaign Calculations
  const currentCampaign = CAMPAIGN_TYPES.find((c) => c.id === campaignType) || CAMPAIGN_TYPES[0];
  const orderCost = Number(((quantity / 1000) * currentCampaign.rate).toFixed(2));
  const balanceAfter = Number((walletBalance - orderCost).toFixed(2));

  const toggleEmojiSelection = (emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedEmojis.includes(emoji)) {
      if (selectedEmojis.length === 1) return;
      setSelectedEmojis(selectedEmojis.filter((e) => e !== emoji));
    } else {
      setSelectedEmojis([...selectedEmojis, emoji]);
    }
  };

  const toggleRuleEmoji = (emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (newRuleEmojis.includes(emoji)) {
      if (newRuleEmojis.length === 1) return;
      setNewRuleEmojis(newRuleEmojis.filter((e) => e !== emoji));
    } else {
      setNewRuleEmojis([...newRuleEmojis, emoji]);
    }
  };

  const handleOpenBot = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Delete Rule',
      `Are you sure you want to stop autopilot reactions for ${channelName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteRule(ruleId),
        },
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

  const filteredOrders = (dashboard?.orders || []).filter((o) => {
    if (statusFilter === 'All') return true;
    return o.status === statusFilter;
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
        
        {/* Sticky Header Bar */}
        <View style={[styles.header, isDark ? styles.borderDark : styles.borderLight]}>
          <View style={styles.headerLeft}>
            <View style={styles.headerTitleRow}>
              <Text style={[styles.title, isDark ? styles.textDark : styles.textLight]}>
                GAP Reactions
              </Text>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Live SMM</Text>
              </View>
            </View>
            <Text style={styles.subtitle} numberOfLines={1}>
              Auto-pilot post booster & instant SMM delivery
            </Text>
          </View>
          <Pressable style={[styles.closeBtn, isDark ? styles.closeBtnDark : styles.closeBtnLight]} onPress={onClose}>
            <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
          </Pressable>
        </View>

        {/* Balance & Top-Up Bar */}
        <View style={[styles.walletBar, isDark ? styles.cardDark : styles.cardLight]}>
          <View style={styles.walletBarLeft}>
            <Ionicons name="wallet" size={18} color="#0284C7" />
            <Text style={styles.walletBarLabel}>Balance:</Text>
            <Text style={[styles.walletBarValue, isDark ? styles.textDark : styles.textLight]}>
              ₹{walletBalance.toFixed(2)}
            </Text>
          </View>

          <View style={styles.walletBarRight}>
            <Pressable
              style={styles.refreshIconBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                refetch();
              }}
            >
              {isRefetching ? (
                <ActivityIndicator size="small" color="#0284C7" />
              ) : (
                <Ionicons name="refresh" size={16} color={isDark ? '#94A3B8' : '#64748B'} />
              )}
            </Pressable>

            <Pressable
              style={styles.topUpPillBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsTopUpOpen(true);
              }}
            >
              <Ionicons name="add" size={14} color="#FFFFFF" />
              <Text style={styles.topUpPillText}>Top Up</Text>
            </Pressable>
          </View>
        </View>

        {/* Clean Segmented Sub-Tabs */}
        <View style={[styles.tabBarWrapper, isDark ? styles.borderDark : styles.borderLight]}>
          <View style={[styles.tabContainer, isDark ? styles.tabContainerDark : styles.tabContainerLight]}>
            <Pressable
              style={[styles.tabBtn, activeTab === 'autopilot' && styles.tabBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('autopilot');
              }}
            >
              <Ionicons
                name="flash"
                size={14}
                color={activeTab === 'autopilot' ? '#0284C7' : isDark ? '#94A3B8' : '#64748B'}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  isDark ? styles.textDark : styles.textLight,
                  activeTab === 'autopilot' && styles.tabBtnTextActive,
                ]}
              >
                Auto Pilot
              </Text>
              {autopilotCount > 0 && (
                <View style={[styles.tabCountPill, activeTab === 'autopilot' && styles.tabCountPillActive]}>
                  <Text style={[styles.tabCountText, activeTab === 'autopilot' && styles.tabCountTextActive]}>
                    {autopilotCount}
                  </Text>
                </View>
              )}
            </Pressable>

            <Pressable
              style={[styles.tabBtn, activeTab === 'boost' && styles.tabBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('boost');
              }}
            >
              <Ionicons
                name="color-wand"
                size={14}
                color={activeTab === 'boost' ? '#0284C7' : isDark ? '#94A3B8' : '#64748B'}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  isDark ? styles.textDark : styles.textLight,
                  activeTab === 'boost' && styles.tabBtnTextActive,
                ]}
              >
                Boost Post
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tabBtn, activeTab === 'orders' && styles.tabBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('orders');
              }}
            >
              <Ionicons
                name="receipt"
                size={14}
                color={activeTab === 'orders' ? '#0284C7' : isDark ? '#94A3B8' : '#64748B'}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  isDark ? styles.textDark : styles.textLight,
                  activeTab === 'orders' && styles.tabBtnTextActive,
                ]}
              >
                Orders
              </Text>
              {ordersCount > 0 && (
                <View style={[styles.tabCountPill, activeTab === 'orders' && styles.tabCountPillActive]}>
                  <Text style={[styles.tabCountText, activeTab === 'orders' && styles.tabCountTextActive]}>
                    {ordersCount}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* Tab Content Area */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* TAB 1: AUTO PILOT */}
          {activeTab === 'autopilot' && (
            <View style={styles.tabSection}>
              {/* Bot Administrator Setup Banner */}
              <Pressable style={styles.botSetupBanner} onPress={handleOpenBot}>
                <View style={styles.botSetupIconWrap}>
                  <Ionicons name="paper-plane" size={18} color="#0284C7" />
                </View>
                <View style={styles.botSetupContent}>
                  <Text style={styles.botSetupTitle}>Bot Administrator Setup</Text>
                  <Text style={styles.botSetupText}>
                    Add <Text style={styles.botSetupHighlight}>{botUsername}</Text> as an Administrator to your channel, then tap "+ Add Channel" below.
                  </Text>
                </View>
                <Ionicons name="open-outline" size={16} color="#0284C7" />
              </Pressable>

              {/* Channels Header Row */}
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={[styles.sectionTitle, isDark ? styles.textDark : styles.textLight]}>
                    Connected Channels ({autopilotCount})
                  </Text>
                  <Text style={styles.sectionSubtitleSmall}>
                    Automatic emoji booster delivers to every new post
                  </Text>
                </View>
                <Pressable
                  style={styles.addChannelBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIsAddRuleOpen(true);
                  }}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.addChannelBtnText}>Add Channel</Text>
                </Pressable>
              </View>

              {/* Channel Rules Cards */}
              {isLoading ? (
                <ActivityIndicator size="large" color="#0284C7" style={{ marginVertical: 30 }} />
              ) : (dashboard?.autopilotRules || []).length === 0 ? (
                <View style={[styles.emptyCard, isDark ? styles.cardDark : styles.cardLight]}>
                  <Ionicons name="radio-outline" size={36} color="#94A3B8" />
                  <Text style={[styles.emptyTitle, isDark ? styles.textDark : styles.textLight]}>
                    No Autopilot Channels
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    Add {botUsername} to your Telegram channel and register it to start automatic reactions.
                  </Text>
                  <Pressable
                    style={styles.emptyAddBtn}
                    onPress={() => setIsAddRuleOpen(true)}
                  >
                    <Text style={styles.emptyAddBtnText}>+ Register Channel</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.rulesList}>
                  {(dashboard?.autopilotRules || []).map((rule: ReactionAutopilotRule) => (
                    <View
                      key={rule.id}
                      style={[styles.channelCard, isDark ? styles.cardDark : styles.cardLight]}
                    >
                      <View style={styles.channelCardTop}>
                        <View style={styles.channelNameCol}>
                          <View style={styles.channelNameRow}>
                            <Text style={[styles.channelNameText, isDark ? styles.textDark : styles.textLight]}>
                              {rule.channel_username}
                            </Text>
                            <View style={styles.emojisBadge}>
                              <Text style={styles.emojisBadgeText}>EMOJIS</Text>
                            </View>
                          </View>
                          <Text style={styles.channelSubtext}>
                            Range: {rule.min_quantity}-{rule.max_quantity} per post · Posts: {rule.posts_processed} / {rule.posts_limit || 'Unlimited'}
                          </Text>
                        </View>

                        <Switch
                          value={rule.is_active}
                          onValueChange={(val) => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            toggleRule({ ruleId: rule.id, isActive: val });
                          }}
                          trackColor={{ false: '#CBD5E1', true: '#0284C7' }}
                        />
                      </View>

                      <View style={styles.channelCardBottom}>
                        <View style={styles.emojisPillList}>
                          {(rule.reactions || []).map((em, idx) => (
                            <View key={`${rule.id}-em-${idx}`} style={styles.miniEmojiBubble}>
                              <Text style={styles.miniEmojiText}>{em}</Text>
                            </View>
                          ))}
                        </View>

                        <Pressable
                          style={styles.deleteChannelBtn}
                          onPress={() => handleDeleteRuleConfirm(rule.id, rule.channel_username)}
                        >
                          <Ionicons name="trash-outline" size={16} color="#EF4444" />
                          <Text style={styles.deleteChannelBtnText}>Delete</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Notice Reminder */}
              <View style={styles.slimNoticeBox}>
                <Ionicons name="information-circle-outline" size={16} color="#64748B" />
                <Text style={styles.slimNoticeText}>
                  Only public Telegram channels are supported for automated reactions.
                </Text>
              </View>
            </View>
          )}

          {/* TAB 2: BOOST SINGLE POST */}
          {activeTab === 'boost' && (
            <View style={styles.tabSection}>
              {/* Campaign Type Chips */}
              <Text style={[styles.fieldLabel, isDark ? styles.textDark : styles.textLight]}>
                Select Campaign Service
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.campaignScroll}>
                {CAMPAIGN_TYPES.map((type) => {
                  const isSelected = campaignType === type.id;
                  return (
                    <Pressable
                      key={type.id}
                      style={[
                        styles.campaignChip,
                        isDark ? styles.cardDark : styles.cardLight,
                        isSelected && styles.campaignChipActive,
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setCampaignType(type.id);
                      }}
                    >
                      <Ionicons
                        name={type.icon as any}
                        size={14}
                        color={isSelected ? '#0284C7' : isDark ? '#94A3B8' : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.campaignChipText,
                          isDark ? styles.textDark : styles.textLight,
                          isSelected && styles.campaignChipTextActive,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Message Link Input */}
              <Text style={[styles.fieldLabel, isDark ? styles.textDark : styles.textLight, { marginTop: 12 }]}>
                Telegram Post / Message Link
              </Text>
              <View style={[styles.inputWrapper, isDark ? styles.inputDark : styles.inputLight]}>
                <Ionicons name="link-outline" size={18} color="#64748B" />
                <TextInput
                  style={[styles.input, isDark ? styles.inputTextDark : styles.inputTextLight]}
                  placeholder="https://t.me/channel_name/123"
                  placeholderTextColor="#94A3B8"
                  value={postLink}
                  onChangeText={setPostLink}
                  autoCapitalize="none"
                />
              </View>

              {/* Emojis Selector (If reactions campaign) */}
              {campaignType === 'reactions' && (
                <>
                  <View style={styles.emojiHeaderRow}>
                    <Text style={[styles.fieldLabel, isDark ? styles.textDark : styles.textLight]}>
                      Select Emojis ({selectedEmojis.length})
                    </Text>
                    <View style={styles.toggleRowCompact}>
                      <Text style={styles.toggleSubtitleCompact}>Random Spread</Text>
                      <Switch
                        value={isRandomSpread}
                        onValueChange={setIsRandomSpread}
                        trackColor={{ false: '#CBD5E1', true: '#0284C7' }}
                      />
                    </View>
                  </View>

                  <View style={styles.emojiGrid}>
                    {AVAILABLE_EMOJIS.map((emoji, idx) => {
                      const isSel = selectedEmojis.includes(emoji);
                      return (
                        <Pressable
                          key={`b-em-${emoji}-${idx}`}
                          style={[
                            styles.emojiChip,
                            isDark ? styles.cardDark : styles.cardLight,
                            isSel && styles.emojiChipSelected,
                          ]}
                          onPress={() => toggleEmojiSelection(emoji)}
                        >
                          <Text style={styles.emojiIcon}>{emoji}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}

              {/* Quantity Selector */}
              <View style={styles.quantityHeader}>
                <Text style={[styles.fieldLabel, isDark ? styles.textDark : styles.textLight]}>
                  Total Quantity
                </Text>
                <Text style={styles.quantityMinMax}>Min: 10 - Max: 100,000</Text>
              </View>

              <View style={styles.presetRow}>
                {QUANTITY_PRESETS.map((preset) => {
                  const isSel = quantity === preset;
                  return (
                    <Pressable
                      key={preset}
                      style={[
                        styles.presetChip,
                        isDark ? styles.cardDark : styles.cardLight,
                        isSel && styles.presetChipActive,
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setQuantity(preset);
                      }}
                    >
                      <Text
                        style={[
                          styles.presetText,
                          isDark ? styles.textDark : styles.textLight,
                          isSel && styles.presetTextActive,
                        ]}
                      >
                        {preset}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={[styles.inputWrapper, isDark ? styles.inputDark : styles.inputLight, { marginTop: 8 }]}>
                <TextInput
                  style={[styles.input, isDark ? styles.inputTextDark : styles.inputTextLight]}
                  value={String(quantity)}
                  onChangeText={(text) => {
                    const val = parseInt(text.replace(/[^0-9]/g, ''), 10);
                    setQuantity(isNaN(val) ? 0 : val);
                  }}
                  keyboardType="numeric"
                />
              </View>

              {/* Delivery Speed Accordion */}
              <Pressable
                style={[styles.accordionHeader, isDark ? styles.cardDark : styles.cardLight]}
                onPress={() => setIsSpeedOpen(!isSpeedOpen)}
              >
                <Ionicons name="time-outline" size={16} color="#64748B" />
                <Text style={[styles.accordionTitle, isDark ? styles.textDark : styles.textLight]}>
                  Delivery Speed: <Text style={{ color: '#0284C7', fontWeight: '700' }}>{speed}</Text>
                </Text>
                <Ionicons
                  name={isSpeedOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={isDark ? '#94A3B8' : '#64748B'}
                />
              </Pressable>

              {isSpeedOpen && (
                <View style={styles.speedOptions}>
                  {['Instant', 'Spread 5s', 'Random 1-3m', 'Gradual 5-10m'].map((sp) => (
                    <Pressable
                      key={sp}
                      style={[
                        styles.speedOption,
                        speed === sp && styles.speedOptionSelected,
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSpeed(sp);
                        setIsSpeedOpen(false);
                      }}
                    >
                      <Text style={[styles.speedOptionText, speed === sp && { color: '#0284C7', fontWeight: '700' }]}>
                        {sp}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Price Calculation Box */}
              <View style={[styles.priceBox, isDark ? styles.priceBoxDark : styles.priceBoxLight]}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Order Cost ({quantity} Items):</Text>
                  <Text style={styles.priceValue}>₹{orderCost.toFixed(2)}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Wallet Balance:</Text>
                  <Text style={styles.priceLabel}>₹{walletBalance.toFixed(2)}</Text>
                </View>
                <View style={[styles.priceRow, styles.priceRowFinal]}>
                  <Text style={[styles.priceLabel, { fontWeight: '700' }]}>Balance after order:</Text>
                  <Text
                    style={[
                      styles.priceValueFinal,
                      balanceAfter < 0 && { color: '#EF4444' },
                    ]}
                  >
                    ₹{balanceAfter.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Place Order Button */}
              <Pressable
                style={[
                  styles.payOrderBtn,
                  (isPlacingOrder || balanceAfter < 0) && styles.btnDisabled,
                ]}
                onPress={handlePlaceOrderSubmit}
                disabled={isPlacingOrder || balanceAfter < 0}
              >
                {isPlacingOrder ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="flash" size={18} color="#FFFFFF" />
                    <Text style={styles.payOrderBtnText}>Pay ₹{orderCost.toFixed(2)} & Place Boost</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}

          {/* TAB 3: ORDERS & CAMPAIGNS HISTORY */}
          {activeTab === 'orders' && (
            <View style={styles.tabSection}>
              {/* 3 Metric Cards */}
              <View style={styles.kpiRow}>
                <View style={[styles.kpiCard, isDark ? styles.cardDark : styles.cardLight]}>
                  <Text style={styles.kpiLabel}>Active</Text>
                  <Text style={[styles.kpiValue, isDark ? styles.textDark : styles.textLight]}>
                    {dashboard?.kpis?.active ?? 0}
                  </Text>
                </View>

                <View style={[styles.kpiCard, isDark ? styles.cardDark : styles.cardLight]}>
                  <Text style={styles.kpiLabel}>Total Emojis</Text>
                  <Text style={[styles.kpiValue, isDark ? styles.textDark : styles.textLight]}>
                    {dashboard?.kpis?.totalEmojis ?? 0}
                  </Text>
                </View>

                <View style={[styles.kpiCard, isDark ? styles.cardDark : styles.cardLight]}>
                  <Text style={styles.kpiLabel}>Success Rate</Text>
                  <Text style={[styles.kpiValue, { color: '#10B981' }]}>
                    {dashboard?.kpis?.successRate ?? 100}%
                  </Text>
                </View>
              </View>

              {/* Filter Pills */}
              <View style={styles.ordersFilterRow}>
                {(['All', 'Completed', 'Canceled'] as const).map((filter) => {
                  const isSel = statusFilter === filter;
                  return (
                    <Pressable
                      key={filter}
                      style={[
                        styles.filterChip,
                        isDark ? styles.cardDark : styles.cardLight,
                        isSel && styles.filterChipActive,
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setStatusFilter(filter);
                      }}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          isDark ? styles.textDark : styles.textLight,
                          isSel && styles.filterChipTextActive,
                        ]}
                      >
                        {filter}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Orders List */}
              {filteredOrders.length === 0 ? (
                <View style={[styles.emptyCard, isDark ? styles.cardDark : styles.cardLight]}>
                  <Ionicons name="document-text-outline" size={36} color="#94A3B8" />
                  <Text style={[styles.emptyTitle, isDark ? styles.textDark : styles.textLight]}>
                    No Orders in this Status
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    All your delivered reactions and boost logs appear here.
                  </Text>
                </View>
              ) : (
                <View style={styles.ordersList}>
                  {filteredOrders.map((order: ReactionOrder) => {
                    const isCompleted = order.status === 'Completed';
                    const isCanceled = order.status === 'Canceled';
                    return (
                      <View
                        key={order.id}
                        style={[styles.orderCard, isDark ? styles.cardDark : styles.cardLight]}
                      >
                        <View style={styles.orderCardHeader}>
                          <Pressable
                            style={styles.orderLinkWrap}
                            onPress={() => {
                              if (order.link) Linking.openURL(order.link);
                            }}
                          >
                            <Text style={styles.orderLinkText} numberOfLines={1}>
                              {order.link.includes('t.me/') ? 'Post Link ↗' : order.link}
                            </Text>
                          </Pressable>

                          <View
                            style={[
                              styles.statusPill,
                              isCompleted && styles.statusCompleted,
                              isCanceled && styles.statusCanceled,
                            ]}
                          >
                            <Ionicons
                              name={isCompleted ? 'checkmark-circle' : isCanceled ? 'close-circle' : 'time'}
                              size={12}
                              color={isCompleted ? '#10B981' : isCanceled ? '#EF4444' : '#F59E0B'}
                            />
                            <Text
                              style={[
                                styles.statusPillText,
                                isCompleted && { color: '#10B981' },
                                isCanceled && { color: '#EF4444' },
                              ]}
                            >
                              {order.status}
                            </Text>
                          </View>
                        </View>

                        <Text style={[styles.orderCampaignText, isDark ? styles.textDark : styles.textLight]}>
                          {order.reactions || 'Auto Reactions'}
                        </Text>

                        <View style={styles.orderCardFooter}>
                          <Text style={styles.orderProgressText}>
                            Progress: {order.quantity}/{order.quantity} (100%)
                          </Text>
                          <Text style={styles.orderCostText}>
                            ₹{(order.cost_charged || order.charge || 0).toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Add Autopilot Rule Modal */}
        <Modal visible={isAddRuleOpen} transparent animationType="fade" onRequestClose={() => setIsAddRuleOpen(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, isDark ? styles.cardDark : styles.cardLight]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, isDark ? styles.textDark : styles.textLight]}>
                  Add Autopilot Channel
                </Text>
                <Pressable onPress={() => setIsAddRuleOpen(false)}>
                  <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
                </Pressable>
              </View>

              <Text style={[styles.fieldLabel, isDark ? styles.textDark : styles.textLight]}>
                Public Channel Username
              </Text>
              <View style={[styles.inputWrapper, isDark ? styles.inputDark : styles.inputLight]}>
                <TextInput
                  style={[styles.input, isDark ? styles.inputTextDark : styles.inputTextLight]}
                  placeholder="@my_channel_name"
                  placeholderTextColor="#94A3B8"
                  value={newChannel}
                  onChangeText={setNewChannel}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.minMaxRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, isDark ? styles.textDark : styles.textLight]}>Min Qty / Post</Text>
                  <View style={[styles.inputWrapper, isDark ? styles.inputDark : styles.inputLight]}>
                    <TextInput
                      style={[styles.input, isDark ? styles.inputTextDark : styles.inputTextLight]}
                      value={newMinQty}
                      onChangeText={setNewMinQty}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, isDark ? styles.textDark : styles.textLight]}>Max Qty / Post</Text>
                  <View style={[styles.inputWrapper, isDark ? styles.inputDark : styles.inputLight]}>
                    <TextInput
                      style={[styles.input, isDark ? styles.inputTextDark : styles.inputTextLight]}
                      value={newMaxQty}
                      onChangeText={setNewMaxQty}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              <Text style={[styles.fieldLabel, isDark ? styles.textDark : styles.textLight, { marginTop: 10 }]}>
                Select Emoji Pack
              </Text>
              <View style={styles.emojiGrid}>
                {['👍', '❤️', '🔥', '👏', '🎉', '🤩', '💎', '🚀'].map((em) => {
                  const isSel = newRuleEmojis.includes(em);
                  return (
                    <Pressable
                      key={`rule-em-${em}`}
                      style={[
                        styles.emojiChip,
                        isDark ? styles.cardDark : styles.cardLight,
                        isSel && styles.emojiChipSelected,
                      ]}
                      onPress={() => toggleRuleEmoji(em)}
                    >
                      <Text style={styles.emojiIcon}>{em}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.fieldLabel, isDark ? styles.textDark : styles.textLight, { marginTop: 10 }]}>
                Posts Limit (Optional, Leave blank for Unlimited)
              </Text>
              <View style={[styles.inputWrapper, isDark ? styles.inputDark : styles.inputLight]}>
                <TextInput
                  style={[styles.input, isDark ? styles.inputTextDark : styles.inputTextLight]}
                  placeholder="e.g. 5 or Unlimited"
                  placeholderTextColor="#94A3B8"
                  value={newPostsLimit}
                  onChangeText={setNewPostsLimit}
                  keyboardType="numeric"
                />
              </View>

              <Pressable
                style={[styles.saveRuleSubmitBtn, isCreatingRule && styles.btnDisabled]}
                onPress={handleCreateRuleSubmit}
                disabled={isCreatingRule}
              >
                {isCreatingRule ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveRuleSubmitBtnText}>Create Autopilot Rule</Text>
                )}
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Top Up Information Modal */}
        <Modal visible={isTopUpOpen} transparent animationType="fade" onRequestClose={() => setIsTopUpOpen(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, isDark ? styles.cardDark : styles.cardLight]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, isDark ? styles.textDark : styles.textLight]}>
                  Wallet Top Up
                </Text>
                <Pressable onPress={() => setIsTopUpOpen(false)}>
                  <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
                </Pressable>
              </View>

              <Text style={styles.topUpModalDesc}>
                Recharge your SMM reactions balance securely via UPI, Razorpay, or Net Banking on the web portal.
              </Text>

              <View style={styles.walletBoxModal}>
                <Text style={styles.walletBoxLabel}>Current Wallet Balance</Text>
                <Text style={styles.walletBoxVal}>₹{walletBalance.toFixed(2)}</Text>
              </View>

              <Pressable
                style={styles.openWebPortalBtn}
                onPress={() => {
                  Linking.openURL('https://tg.getaipilot.in/reactions');
                  setIsTopUpOpen(false);
                }}
              >
                <Ionicons name="open-outline" size={18} color="#FFFFFF" />
                <Text style={styles.openWebPortalBtnText}>Open Web Top-Up Portal</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerLight: { backgroundColor: '#F8FAFC' },
  containerDark: { backgroundColor: '#0B0F19' },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  borderLight: { borderBottomColor: '#E2E8F0' },
  borderDark: { borderBottomColor: '#27272A' },
  headerLeft: { flex: 1 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 17, fontWeight: '700' },
  textLight: { color: '#0F172A' },
  textDark: { color: '#F8FAFC' },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  liveText: { fontSize: 10.5, fontWeight: '700', color: '#10B981' },
  subtitle: { color: '#64748B', fontSize: 11.5, marginTop: 2 },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnLight: { backgroundColor: '#F1F5F9' },
  closeBtnDark: { backgroundColor: '#27272A' },

  // Wallet Bar
  walletBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  walletBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  walletBarLabel: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  walletBarValue: { fontSize: 14, fontWeight: '700' },
  walletBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  refreshIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topUpPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  topUpPillText: { color: '#FFFFFF', fontWeight: '700', fontSize: 11.5 },

  // Segmented Tabs
  tabBarWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  tabContainerLight: { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' },
  tabContainerDark: { backgroundColor: '#121212', borderColor: '#27272A' },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 9,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabBtnText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  tabBtnTextActive: { color: '#0284C7', fontWeight: '700' },
  tabCountPill: {
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  tabCountPillActive: { backgroundColor: 'rgba(2, 132, 199, 0.15)' },
  tabCountText: { fontSize: 10, fontWeight: '700', color: '#64748B' },
  tabCountTextActive: { color: '#0284C7' },

  // Scroll Content
  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 30 },
  tabSection: { gap: 12 },

  // Common Cards & Styles
  cardLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  cardDark: { backgroundColor: '#121212', borderColor: '#27272A' },

  // Bot Setup Banner
  botSetupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.25)',
    borderRadius: 12,
    padding: 12,
  },
  botSetupIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  botSetupContent: { flex: 1 },
  botSetupTitle: { fontSize: 12.5, fontWeight: '700', color: '#0284C7', marginBottom: 2 },
  botSetupText: { fontSize: 11.5, color: '#0369A1', lineHeight: 16 },
  botSetupHighlight: { fontWeight: '700', textDecorationLine: 'underline' },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  sectionSubtitleSmall: { fontSize: 11, color: '#64748B', marginTop: 1 },
  addChannelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6366F1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addChannelBtnText: { color: '#FFFFFF', fontSize: 11.5, fontWeight: '700' },

  // Channel Rules List
  rulesList: { gap: 10 },
  channelCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  channelCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  channelNameCol: { flex: 1 },
  channelNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  channelNameText: { fontSize: 13.5, fontWeight: '700' },
  emojisBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  emojisBadgeText: { fontSize: 9.5, fontWeight: '700', color: '#6366F1' },
  channelSubtext: { fontSize: 11, color: '#64748B', marginTop: 2 },
  channelCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.15)',
    paddingTop: 8,
  },
  emojisPillList: { flexDirection: 'row', gap: 4 },
  miniEmojiBubble: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(100, 116, 139, 0.08)',
  },
  miniEmojiText: { fontSize: 13 },
  deleteChannelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteChannelBtnText: { fontSize: 11, color: '#EF4444', fontWeight: '600' },

  // Slim Notice Box
  slimNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    backgroundColor: 'rgba(100, 116, 139, 0.06)',
    borderRadius: 10,
  },
  slimNoticeText: { fontSize: 11, color: '#64748B', flex: 1 },

  // Empty Card
  emptyCard: {
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: { fontSize: 14, fontWeight: '700' },
  emptySubtitle: { fontSize: 11.5, color: '#94A3B8', textAlign: 'center', lineHeight: 16 },
  emptyAddBtn: {
    marginTop: 8,
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  emptyAddBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },

  // Boost Form Elements
  fieldLabel: { fontSize: 11.5, fontWeight: '700', marginBottom: 5 },
  campaignScroll: { gap: 6, paddingVertical: 2 },
  campaignChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  campaignChipActive: {
    borderColor: '#0284C7',
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
  },
  campaignChipText: { fontSize: 11.5, fontWeight: '600' },
  campaignChipTextActive: { color: '#0284C7', fontWeight: '700' },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  inputLight: { backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' },
  inputDark: { backgroundColor: '#1F2430', borderColor: '#334155' },
  input: { flex: 1, fontSize: 12.5, padding: 0 },
  inputTextLight: { color: '#0F172A' },
  inputTextDark: { color: '#FFFFFF' },

  emojiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  toggleRowCompact: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toggleSubtitleCompact: { fontSize: 11, color: '#64748B' },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  emojiChip: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiChipSelected: {
    borderColor: '#0284C7',
    backgroundColor: 'rgba(2, 132, 199, 0.16)',
  },
  emojiIcon: { fontSize: 18 },

  quantityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  quantityMinMax: { fontSize: 10.5, color: '#64748B' },
  presetRow: { flexDirection: 'row', gap: 6 },
  presetChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetChipActive: {
    borderColor: '#0284C7',
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
  },
  presetText: { fontSize: 11.5, fontWeight: '600' },
  presetTextActive: { color: '#0284C7', fontWeight: '700' },

  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
  },
  accordionTitle: { fontSize: 11.5, flex: 1, marginLeft: 6 },
  speedOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: 6,
  },
  speedOption: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
  },
  speedOptionSelected: {
    backgroundColor: 'rgba(2, 132, 199, 0.16)',
    borderColor: '#0284C7',
  },
  speedOptionText: { fontSize: 11, color: '#64748B' },

  priceBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    gap: 5,
  },
  priceBoxLight: { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' },
  priceBoxDark: { backgroundColor: '#1F2430', borderColor: '#27272A' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceRowFinal: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.2)',
    paddingTop: 6,
    marginTop: 2,
  },
  priceLabel: { fontSize: 11.5, color: '#64748B' },
  priceValue: { fontSize: 12, fontWeight: '700', color: '#0284C7' },
  priceValueFinal: { fontSize: 13.5, fontWeight: '700', color: '#10B981' },

  payOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  payOrderBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13.5 },
  btnDisabled: { opacity: 0.5 },

  // Orders Tab
  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  kpiCard: { flex: 1, padding: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  kpiLabel: { fontSize: 10.5, color: '#64748B', marginBottom: 2 },
  kpiValue: { fontSize: 15, fontWeight: '700' },

  ordersFilterRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  filterChipText: { fontSize: 11.5, fontWeight: '600', color: '#64748B' },
  filterChipTextActive: { color: '#FFFFFF', fontWeight: '700' },

  ordersList: { gap: 8 },
  orderCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderLinkWrap: { flex: 1 },
  orderLinkText: { fontSize: 12, color: '#0284C7', fontWeight: '700' },
  orderCampaignText: { fontSize: 11.5 },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.12)',
    paddingTop: 6,
  },
  orderProgressText: { fontSize: 10.5, color: '#64748B' },
  orderCostText: { fontSize: 12, fontWeight: '700', color: '#0284C7' },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  statusCompleted: { backgroundColor: 'rgba(16, 185, 129, 0.12)' },
  statusCanceled: { backgroundColor: 'rgba(239, 68, 68, 0.12)' },
  statusPillText: { fontSize: 9.5, fontWeight: '700' },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: { fontSize: 15, fontWeight: '700' },
  minMaxRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  saveRuleSubmitBtn: {
    backgroundColor: '#6366F1',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  saveRuleSubmitBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  topUpModalDesc: { fontSize: 12.5, color: '#64748B', lineHeight: 17, marginBottom: 12 },
  walletBoxModal: {
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 14,
  },
  walletBoxLabel: { fontSize: 11.5, color: '#64748B' },
  walletBoxVal: { fontSize: 20, fontWeight: '700', color: '#0284C7', marginTop: 2 },
  openWebPortalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingVertical: 11,
    borderRadius: 10,
  },
  openWebPortalBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});
