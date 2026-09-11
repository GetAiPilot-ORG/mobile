import React, { useState, useRef } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { AppScreen } from '../../../components/AppScreen';
import { AppTopBar } from '../../../components/AppTopBar';
import { telegramApi } from '../api/telegramApi';
import { TelegramToolKey, TelegramHubTool } from '../types';
import {
  HubProgressCard,
  ToolCard,
  AutoforwardModal,
  SubManagerModal,
  TrackerModal,
  ReportBotModal,
  BroadcastModal,
  AutoApproveModal,
  ChatBotModal,
  ReactionsModal,
  TelegramLoginModal,
  DashboardAnalyticsCharts,
} from '../components';

type TelegramCategory = 'all' | 'automation' | 'monetization' | 'growth';
type TelegramTab = 'bots' | 'hub' | 'automations' | 'sub_manager' | 'broadcasts' | 'reactions';

const CATEGORIES: { key: TelegramCategory; label: string; icon: string }[] = [
  { key: 'all', label: 'All 8 Tools', icon: 'grid-outline' },
  { key: 'automation', label: 'Automation & Routing', icon: 'git-compare-outline' },
  { key: 'monetization', label: 'Monetization & VIP', icon: 'card-outline' },
  { key: 'growth', label: 'Audience Growth', icon: 'trending-up-outline' },
];

export const TelegramScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [activeTab, setActiveTab] = useState<TelegramTab>('automations');
  const [selectedCategory, setSelectedCategory] = useState<TelegramCategory>('all');
  const [activeModal, setActiveModal] = useState<TelegramToolKey | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const mainScrollRef = useRef<ScrollView>(null);
  const sectionContentY = useRef<number>(0);

  const queryClient = useQueryClient();

  const { data: summary, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['telegram_summary'],
    queryFn: telegramApi.getSummary,
  });

  const { data: trackerBots, refetch: refetchBots } = useQuery({
    queryKey: ['telegram_tracker_bots'],
    queryFn: telegramApi.getTrackerBots,
  });

  const { data: sessionStatus, refetch: refetchSession } = useQuery({
    queryKey: ['telegram_session_status'],
    queryFn: telegramApi.getSessionStatus,
  });

  const { data: chats, refetch: refetchChats } = useQuery({
    queryKey: ['telegram_chats'],
    queryFn: telegramApi.getChats,
  });

  const { data: forwardRules, refetch: refetchRules } = useQuery({
    queryKey: ['telegram_forward_rules'],
    queryFn: telegramApi.getForwardRules,
  });

  const { data: subPlans, refetch: refetchPlans } = useQuery({
    queryKey: ['telegram_sub_plans'],
    queryFn: telegramApi.getSubPlans,
  });

  const { mutateAsync: syncChats, isPending: isSyncingChats } = useMutation({
    mutationFn: telegramApi.syncChats,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['telegram_chats'] });
      queryClient.invalidateQueries({ queryKey: ['telegram_summary'] });
    },
  });

  const { mutateAsync: sendBroadcast, isPending: isBroadcasting } = useMutation({
    mutationFn: telegramApi.sendBroadcast,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['telegram_summary'] });
    },
  });

  const { mutateAsync: createForwardRule, isPending: isSavingRule } = useMutation({
    mutationFn: telegramApi.createForwardRule,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['telegram_forward_rules'] });
      queryClient.invalidateQueries({ queryKey: ['telegram_summary'] });
    },
  });

  const { mutateAsync: createSubPlan, isPending: isCreatingPlan } = useMutation({
    mutationFn: telegramApi.createSubPlan,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['telegram_sub_plans'] });
      queryClient.invalidateQueries({ queryKey: ['telegram_summary'] });
    },
  });

  const { mutateAsync: toggleAutoApprove } = useMutation({
    mutationFn: telegramApi.toggleAutoApprove,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['telegram_summary'] });
    },
  });

  const { mutateAsync: updateReactions } = useMutation({
    mutationFn: telegramApi.updateReactions,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['telegram_summary'] });
    },
  });

  const handleRefreshAll = async () => {
    await Promise.all([refetch(), refetchBots(), refetchSession(), refetchChats(), refetchRules(), refetchPlans()]);
  };

  const handleTabChange = (tab: TelegramTab, shouldScroll = false) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
    if (shouldScroll || tab === 'hub') {
      setTimeout(() => {
        mainScrollRef.current?.scrollTo({
          y: sectionContentY.current > 0 ? sectionContentY.current - 12 : 540,
          animated: true,
        });
      }, 60);
    }
  };

  const handleCategoryChange = (cat: TelegramCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(cat);
  };

  const openToolModal = (key: TelegramToolKey) => {
    if (key === 'autoforward') {
      handleTabChange('automations');
      return;
    }
    if (key === 'sub_manager') {
      handleTabChange('sub_manager');
      return;
    }
    if (key === 'tracker') {
      handleTabChange('bots');
      return;
    }
    setActiveModal(key);
  };

  const hub = summary?.hub || {
    totalModules: 8,
    completedModules: 8,
    tools: [],
  };

  // Filter tools by category
  const filteredTools = (hub.tools || []).filter((tool) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'automation') {
      return ['autoforward', 'auto_approve', 'chatbot', 'reactions'].includes(tool.key);
    }
    if (selectedCategory === 'monetization') {
      return ['sub_manager', 'report_bot'].includes(tool.key);
    }
    if (selectedCategory === 'growth') {
      return ['broadcast', 'tracker', 'auto_approve', 'reactions'].includes(tool.key);
    }
    return true;
  });

  const botsList = trackerBots || summary?.trackerBots || [];

  return (
    <AppScreen safeArea="top">
      <AppTopBar title="Telegram Master Dashboard" subtitle="Overview of bots, mapped channels, deep links, forwarding rules & monetization" />

      {/* Quick Launch & Section Action Bar */}
      <View style={[styles.tabBarWrapper, isDark ? styles.borderDark : styles.borderLight]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          <Pressable
            style={[
              styles.quickLaunchPill,
              {
                borderColor: '#0284C7',
                backgroundColor: activeTab === 'hub'
                  ? '#0284C7'
                  : isDark ? 'rgba(2,132,199,0.15)' : 'rgba(2,132,199,0.08)',
              },
            ]}
            onPress={() => handleTabChange('hub', true)}
          >
            <Ionicons name="apps" size={15} color={activeTab === 'hub' ? '#FFFFFF' : '#0284C7'} />
            <Text
              style={[
                styles.quickLaunchText,
                { color: activeTab === 'hub' ? '#FFFFFF' : '#0284C7', fontWeight: '800' },
              ]}
            >
              8-Tool Suite
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.quickLaunchPill,
              {
                borderColor: '#8B5CF6',
                backgroundColor: activeTab === 'automations'
                  ? '#8B5CF6'
                  : isDark ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.08)',
              },
            ]}
            onPress={() => {
              handleTabChange('automations');
              openToolModal('autoforward');
            }}
          >
            <Ionicons name="git-compare" size={15} color={activeTab === 'automations' ? '#FFFFFF' : '#8B5CF6'} />
            <Text
              style={[
                styles.quickLaunchText,
                { color: activeTab === 'automations' ? '#FFFFFF' : '#8B5CF6' },
              ]}
            >
              + Forward Rule
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.quickLaunchPill,
              {
                borderColor: '#EC4899',
                backgroundColor: activeTab === 'sub_manager'
                  ? '#EC4899'
                  : isDark ? 'rgba(236,72,153,0.15)' : 'rgba(236,72,153,0.08)',
              },
            ]}
            onPress={() => {
              handleTabChange('sub_manager');
              openToolModal('sub_manager');
            }}
          >
            <Ionicons name="card" size={15} color={activeTab === 'sub_manager' ? '#FFFFFF' : '#EC4899'} />
            <Text
              style={[
                styles.quickLaunchText,
                { color: activeTab === 'sub_manager' ? '#FFFFFF' : '#EC4899' },
              ]}
            >
              TeleSub Pages
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.quickLaunchPill,
              {
                borderColor: '#0284C7',
                backgroundColor: activeTab === 'broadcasts'
                  ? '#0284C7'
                  : isDark ? 'rgba(2,132,199,0.15)' : 'rgba(2,132,199,0.08)',
              },
            ]}
            onPress={() => handleTabChange('broadcasts', true)}
          >
            <Ionicons name="megaphone" size={15} color={activeTab === 'broadcasts' ? '#FFFFFF' : '#0284C7'} />
            <Text
              style={[
                styles.quickLaunchText,
                { color: activeTab === 'broadcasts' ? '#FFFFFF' : '#0284C7' },
              ]}
            >
              Broadcast
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.quickLaunchPill,
              {
                borderColor: '#F59E0B',
                backgroundColor: activeTab === 'reactions'
                  ? '#F59E0B'
                  : isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.08)',
              },
            ]}
            onPress={() => handleTabChange('reactions', true)}
          >
            <Ionicons name="flash" size={15} color={activeTab === 'reactions' ? '#FFFFFF' : '#F59E0B'} />
            <Text
              style={[
                styles.quickLaunchText,
                { color: activeTab === 'reactions' ? '#FFFFFF' : '#F59E0B' },
              ]}
            >
              Reactions
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.quickLaunchPill,
              {
                borderColor: '#10B981',
                backgroundColor: activeTab === 'bots'
                  ? '#10B981'
                  : isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.08)',
              },
            ]}
            onPress={() => {
              handleTabChange('bots');
              openToolModal('tracker');
            }}
          >
            <Ionicons name="analytics" size={15} color={activeTab === 'bots' ? '#FFFFFF' : '#10B981'} />
            <Text
              style={[
                styles.quickLaunchText,
                { color: activeTab === 'bots' ? '#FFFFFF' : '#10B981' },
              ]}
            >
              Tracker Bots
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      <ScrollView
        ref={mainScrollRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefreshAll} tintColor="#0284C7" />
        }
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#0284C7" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* HERO: TELEGRAM MASTER DASHBOARD (6 KPI CARDS) */}
            <View style={[styles.commandCenterCard, isDark ? styles.cardDark : styles.cardLight]}>
              {/* Header with DB Synced Badge & Actions */}
              <View style={styles.commandHeader}>
                <View style={styles.sessionPillRow}>
                  <View style={styles.syncedBadge}>
                    <View style={styles.sessionDotGreen} />
                    <Text style={styles.syncedBadgeText}>Database Synced</Text>
                  </View>
                  <View style={styles.botCountBadge}>
                    <Text style={styles.botCountBadgeText}>{botsList.length} Bots Connected</Text>
                  </View>
                </View>

                <View style={styles.headerBtnGroup}>
                  <Pressable
                    style={[styles.refreshHeaderBtn, isRefetching && { opacity: 0.6 }]}
                    onPress={handleRefreshAll}
                    disabled={isRefetching}
                  >
                    <Ionicons name="refresh-outline" size={13} color={isDark ? '#94A3B8' : '#475569'} />
                    <Text style={[styles.refreshHeaderBtnText, isDark ? styles.textDark : styles.textLight]}>
                      Refresh Data
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.connectHeaderBtn}
                    onPress={() => openToolModal('tracker')}
                  >
                    <Ionicons name="add" size={14} color="#FFFFFF" />
                    <Text style={styles.connectHeaderBtnText}>+ Connect New Bot</Text>
                  </Pressable>
                </View>
              </View>

              {/* 6 Real Interactive KPI Metric Cards matching Web Dashboard */}
              <View style={[styles.metricsGrid, isDark ? styles.borderDark : styles.borderLight]}>
                {/* 1. Tracked Bots */}
                <Pressable
                  style={({ pressed }) => [
                    styles.metricItem,
                    pressed && styles.metricItemPressed,
                  ]}
                  onPress={() => handleTabChange('bots')}
                >
                  <View style={styles.metricHeaderRow}>
                    <Text style={styles.metricLabel}>TRACKED BOTS</Text>
                    <Ionicons name="cloud-outline" size={13} color="#0284C7" />
                  </View>
                  <Text style={[styles.metricValue, isDark ? styles.textDark : styles.textLight]}>
                    {summary?.trackedBotsCount ?? botsList.length}
                  </Text>
                  <View style={styles.metricFooterRow}>
                    <Text style={styles.metricSub}>Connected bots</Text>
                    <Ionicons name="chevron-forward" size={11} color="#0284C7" />
                  </View>
                </Pressable>

                {/* 2. Channels */}
                <Pressable
                  style={({ pressed }) => [
                    styles.metricItem,
                    pressed && styles.metricItemPressed,
                  ]}
                  onPress={() => openToolModal('tracker')}
                >
                  <View style={styles.metricHeaderRow}>
                    <Text style={styles.metricLabel}>CHANNELS</Text>
                    <Ionicons name="share-social-outline" size={13} color="#10B981" />
                  </View>
                  <Text style={[styles.metricValue, isDark ? styles.textDark : styles.textLight]}>
                    {summary?.channelsCount ?? (chats || []).length}
                  </Text>
                  <View style={styles.metricFooterRow}>
                    <Text style={styles.metricSub}>Mapped channels</Text>
                    <Ionicons name="chevron-forward" size={11} color="#10B981" />
                  </View>
                </Pressable>

                {/* 3. Deep Links */}
                <Pressable
                  style={({ pressed }) => [
                    styles.metricItem,
                    pressed && styles.metricItemPressed,
                  ]}
                  onPress={() => openToolModal('tracker')}
                >
                  <View style={styles.metricHeaderRow}>
                    <Text style={styles.metricLabel}>DEEP LINKS</Text>
                    <Ionicons name="link-outline" size={13} color="#0284C7" />
                  </View>
                  <Text style={[styles.metricValue, isDark ? styles.textDark : styles.textLight]}>
                    {summary?.deepLinksCount ?? 15}
                  </Text>
                  <View style={styles.metricFooterRow}>
                    <Text style={styles.metricSub}>Tracked join links</Text>
                    <Ionicons name="chevron-forward" size={11} color="#0284C7" />
                  </View>
                </Pressable>

                {/* 4. Forwards -> Redirects to automations tab */}
                <Pressable
                  style={({ pressed }) => [
                    styles.metricItem,
                    pressed && styles.metricItemPressed,
                  ]}
                  onPress={() => handleTabChange('automations')}
                >
                  <View style={styles.metricHeaderRow}>
                    <Text style={styles.metricLabel}>FORWARDS</Text>
                    <Ionicons name="git-compare-outline" size={13} color="#8B5CF6" />
                  </View>
                  <Text style={[styles.metricValue, isDark ? styles.textDark : styles.textLight]}>
                    {(forwardRules || []).length}
                  </Text>
                  <View style={styles.metricFooterRow}>
                    <Text style={styles.metricSub}>Active rules</Text>
                    <Ionicons name="chevron-forward" size={11} color="#8B5CF6" />
                  </View>
                </Pressable>

                {/* 5. TeleSub Pages -> Redirects to sub_manager tab */}
                <Pressable
                  style={({ pressed }) => [
                    styles.metricItem,
                    pressed && styles.metricItemPressed,
                  ]}
                  onPress={() => handleTabChange('sub_manager')}
                >
                  <View style={styles.metricHeaderRow}>
                    <Text style={styles.metricLabel}>TELESUB PAGES</Text>
                    <Ionicons name="wallet-outline" size={13} color="#EC4899" />
                  </View>
                  <Text style={[styles.metricValue, isDark ? styles.textDark : styles.textLight]}>
                    {summary?.teleSubPagesCount ?? (subPlans || []).length}
                  </Text>
                  <View style={styles.metricFooterRow}>
                    <Text style={styles.metricSub}>Monetized pages</Text>
                    <Ionicons name="chevron-forward" size={11} color="#EC4899" />
                  </View>
                </Pressable>

                {/* 6. Revenue -> Redirects to sub_manager tab */}
                <Pressable
                  style={({ pressed }) => [
                    styles.metricItem,
                    pressed && styles.metricItemPressed,
                  ]}
                  onPress={() => handleTabChange('sub_manager')}
                >
                  <View style={styles.metricHeaderRow}>
                    <Text style={styles.metricLabel}>REVENUE</Text>
                    <Ionicons name="card-outline" size={13} color="#F59E0B" />
                  </View>
                  <Text style={[styles.metricValue, { color: '#0284C7' }]}>
                    ₹{(summary?.revenue ?? 0).toLocaleString()}
                  </Text>
                  <View style={styles.metricFooterRow}>
                    <Text style={styles.metricSub}>Total collected</Text>
                    <Ionicons name="chevron-forward" size={11} color="#F59E0B" />
                  </View>
                </Pressable>
              </View>
            </View>

            {/* VISUAL ANALYTICS CHARTS (CHANNEL JOIN TRACKING & TELESUB REVENUE) */}
            <DashboardAnalyticsCharts />

            {/* ACTIVE TAB CONTENT SECTIONS CONTAINER */}
            <View
              onLayout={(e) => {
                sectionContentY.current = e.nativeEvent.layout.y;
              }}
            >
              {/* TAB 0: CONNECTED TRACKER BOTS */}
              {activeTab === 'bots' && (
              <>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={[styles.sectionTitle, isDark ? styles.textDark : styles.textLight, { marginBottom: 2 }]}>
                      Connected Tracker Bots ({botsList.length})
                    </Text>
                    <Text style={styles.sectionSub}>Live bots tracking joins, campaigns, and mapped communities</Text>
                  </View>
                  <Pressable
                    style={styles.actionBtnPrimary}
                    onPress={() => openToolModal('tracker')}
                  >
                    <Ionicons name="add" size={16} color="#FFFFFF" />
                    <Text style={styles.actionBtnPrimaryText}>New Bot</Text>
                  </Pressable>
                </View>

                {botsList.length === 0 ? (
                  <View style={[styles.emptyCard, isDark ? styles.cardDark : styles.cardLight]}>
                    <Ionicons name="logo-android" size={36} color="#0284C7" style={{ marginBottom: 8 }} />
                    <Text style={[styles.emptyTitle, isDark ? styles.textDark : styles.textLight]}>No Bots Connected</Text>
                    <Text style={styles.emptySubtitle}>
                      Connect Telegram bots to track channel joins, conversions, and automate subscriber flows.
                    </Text>
                    <Pressable
                      style={[styles.actionBtnPrimary, { marginTop: 12 }]}
                      onPress={() => openToolModal('tracker')}
                    >
                      <Ionicons name="add" size={16} color="#FFFFFF" />
                      <Text style={styles.actionBtnPrimaryText}>Connect First Bot</Text>
                    </Pressable>
                  </View>
                ) : (
                  botsList.map((bot) => (
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
                          onPress={() => openToolModal('tracker')}
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
                  ))
                )}
              </>
            )}

            {/* TAB 1: 8-TOOL SHOWCASE HUB */}
            {activeTab === 'hub' && (
              <>
                <HubProgressCard
                  total={hub.totalModules || 8}
                  completed={hub.completedModules || 8}
                  onRefresh={handleRefreshAll}
                  isRefreshing={isRefetching}
                />

                {/* Category Filter Pills */}
                <View style={styles.categorySection}>
                  <Text style={[styles.sectionTitle, isDark ? styles.textDark : styles.textLight]}>
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
                            color={isSelected ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'}
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

            {/* TAB 2: 1:1 GAP AUTOFORWARD CONTROL DASHBOARD */}
            {activeTab === 'automations' && (
              <>
                {/* HERO CARD: AUTOFORWARD CONTROL */}
                <View style={[styles.afControlCard, isDark ? styles.cardDark : styles.cardLight]}>
                  <View style={styles.afControlHeader}>
                    <View style={styles.afControlHeaderLeft}>
                      <View style={styles.afHeroIconCircle}>
                        <Ionicons name="flash" size={20} color="#0284C7" />
                      </View>
                      <View>
                        <Text style={[styles.afHeroTitle, isDark ? styles.textDark : styles.textLight]}>
                          AutoForward Control
                        </Text>
                        <View style={styles.afSystemActiveRow}>
                          <View style={styles.sessionDotGreen} />
                          <Text style={styles.afSystemActiveText}>System Active</Text>
                        </View>
                      </View>
                    </View>

                    {/* Top Action Buttons: Reset, Refresh, Open Bot */}
                    <View style={styles.afHeaderActions}>
                      <Pressable
                        style={[styles.afGhostBtn, isDark ? styles.afGhostBtnDark : styles.afGhostBtnLight]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          refetchRules();
                        }}
                      >
                        <Ionicons name="log-out-outline" size={13} color={isDark ? '#CBD5E1' : '#475569'} />
                        <Text style={[styles.afGhostBtnText, isDark ? styles.textDark : styles.textLight]}>Reset</Text>
                      </Pressable>

                      <Pressable
                        style={[styles.afIconBtn, isDark ? styles.afGhostBtnDark : styles.afGhostBtnLight]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          refetchRules();
                        }}
                      >
                        <Ionicons name="sync-outline" size={14} color={isDark ? '#CBD5E1' : '#475569'} />
                      </Pressable>

                      <Pressable
                        style={styles.afOpenBotBtn}
                        onPress={() => {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          Linking.openURL('https://t.me/Gapautoforwardingbot');
                        }}
                      >
                        <Ionicons name="logo-android" size={15} color="#FFFFFF" />
                        <Text style={styles.afOpenBotBtnText}>Open Bot</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>

                {/* 5 KPI METRIC CARDS ROW */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.afKpiScroll}
                >
                  {/* KPI 1: Active Mappings */}
                  <View style={[styles.afKpiCard, isDark ? styles.cardDark : styles.cardLight]}>
                    <View style={[styles.afKpiIconCircle, { backgroundColor: 'rgba(2, 132, 199, 0.12)' }]}>
                      <Ionicons name="arrow-redo" size={14} color="#0284C7" />
                    </View>
                    <Text style={[styles.afKpiValue, isDark ? styles.textDark : styles.textLight]}>
                      {(forwardRules || []).length}
                    </Text>
                    <Text style={styles.afKpiSub}>Active Mappings</Text>
                  </View>

                  {/* KPI 2: Text Filters */}
                  <View style={[styles.afKpiCard, isDark ? styles.cardDark : styles.cardLight]}>
                    <View style={[styles.afKpiIconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                      <Ionicons name="filter-outline" size={14} color="#8B5CF6" />
                    </View>
                    <Text style={[styles.afKpiValue, isDark ? styles.textDark : styles.textLight]}>0</Text>
                    <Text style={styles.afKpiSub}>Text Filters</Text>
                  </View>

                  {/* KPI 3: Blocked Words */}
                  <View style={[styles.afKpiCard, isDark ? styles.cardDark : styles.cardLight]}>
                    <View style={[styles.afKpiIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                      <Ionicons name="shield-outline" size={14} color="#EF4444" />
                    </View>
                    <Text style={[styles.afKpiValue, isDark ? styles.textDark : styles.textLight]}>0</Text>
                    <Text style={styles.afKpiSub}>Blocked Words</Text>
                  </View>

                  {/* KPI 4: Forwarding Delay */}
                  <View style={[styles.afKpiCard, isDark ? styles.cardDark : styles.cardLight]}>
                    <View style={[styles.afKpiIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                      <Ionicons name="time-outline" size={14} color="#F59E0B" />
                    </View>
                    <Text style={[styles.afKpiValue, isDark ? styles.textDark : styles.textLight]}>0</Text>
                    <Text style={styles.afKpiSub}>Delay (seconds)</Text>
                  </View>

                  {/* KPI 5: Text Actions */}
                  <View style={[styles.afKpiCard, isDark ? styles.cardDark : styles.cardLight]}>
                    <View style={[styles.afKpiIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                      <Ionicons name="text-outline" size={14} color="#10B981" />
                    </View>
                    <Text style={[styles.afKpiValue, isDark ? styles.textDark : styles.textLight, { fontSize: 16 }]}>
                      None
                    </Text>
                    <Text style={styles.afKpiSub}>Text Actions</Text>
                  </View>
                </ScrollView>

                {/* 5 MAIN DASHBOARD CONTROL SECTIONS (MATCHING SCREENSHOT) */}
                <View style={styles.afSectionsStack}>
                  {/* SECTION 1: ACTIVE MAPPINGS */}
                  <View style={[styles.afSectionCard, isDark ? styles.cardDark : styles.cardLight]}>
                    <View style={styles.afSectionHeader}>
                      <View style={styles.afSectionIconCircle}>
                        <Ionicons name="arrow-redo" size={14} color="#0284C7" />
                      </View>
                      <View>
                        <Text style={[styles.afSectionTitle, isDark ? styles.textDark : styles.textLight]}>
                          Active Mappings
                        </Text>
                        <Text style={styles.afSectionSubtitle}>
                          {(forwardRules || []).length} forwarding rules configured
                        </Text>
                      </View>
                    </View>

                    {(forwardRules || []).length === 0 ? (
                      <View style={[styles.afEmptyBox, isDark ? styles.afEmptyBoxDark : styles.afEmptyBoxLight]}>
                        <Text style={styles.afEmptyText}>No active mappings configured</Text>
                      </View>
                    ) : (
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
                    )}
                  </View>

                  {/* SECTION 2: TEXT FILTERS */}
                  <View style={[styles.afSectionCard, isDark ? styles.cardDark : styles.cardLight]}>
                    <View style={styles.afSectionHeader}>
                      <View style={[styles.afSectionIconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                        <Ionicons name="filter-outline" size={14} color="#8B5CF6" />
                      </View>
                      <View>
                        <Text style={[styles.afSectionTitle, isDark ? styles.textDark : styles.textLight]}>
                          Text Filters
                        </Text>
                        <Text style={styles.afSectionSubtitle}>0 replacement rules active</Text>
                      </View>
                    </View>
                    <View style={[styles.afEmptyBox, isDark ? styles.afEmptyBoxDark : styles.afEmptyBoxLight]}>
                      <Text style={styles.afEmptyText}>No text filters configured</Text>
                    </View>
                  </View>

                  {/* SECTION 3: BLOCKED WORDS */}
                  <View style={[styles.afSectionCard, isDark ? styles.cardDark : styles.cardLight]}>
                    <View style={styles.afSectionHeader}>
                      <View style={[styles.afSectionIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                        <Ionicons name="shield-outline" size={14} color="#EF4444" />
                      </View>
                      <View>
                        <Text style={[styles.afSectionTitle, isDark ? styles.textDark : styles.textLight]}>
                          Blocked Words
                        </Text>
                        <Text style={styles.afSectionSubtitle}>0 words blocked from forwarding</Text>
                      </View>
                    </View>
                    <View style={[styles.afEmptyBox, isDark ? styles.afEmptyBoxDark : styles.afEmptyBoxLight]}>
                      <Text style={styles.afEmptyText}>No blocked words configured</Text>
                    </View>
                  </View>

                  {/* SECTION 4: FORWARDING DELAY */}
                  <View style={[styles.afSectionCard, isDark ? styles.cardDark : styles.cardLight]}>
                    <View style={styles.afSectionHeader}>
                      <View style={[styles.afSectionIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                        <Ionicons name="time-outline" size={14} color="#F59E0B" />
                      </View>
                      <View>
                        <Text style={[styles.afSectionTitle, isDark ? styles.textDark : styles.textLight]}>
                          Forwarding Delay
                        </Text>
                        <Text style={styles.afSectionSubtitle}>Time to wait before forwarding each message</Text>
                      </View>
                    </View>
                    <View style={[styles.afDelayBigBox, isDark ? styles.afEmptyBoxDark : styles.afEmptyBoxLight]}>
                      <Text style={[styles.afDelayBigNumber, isDark ? styles.textDark : styles.textLight]}>0</Text>
                      <Text style={styles.afDelayBigLabel}>seconds</Text>
                    </View>
                  </View>

                  {/* SECTION 5: PREFIX & SUFFIX */}
                  <View style={[styles.afSectionCard, isDark ? styles.cardDark : styles.cardLight]}>
                    <View style={styles.afSectionHeader}>
                      <View style={[styles.afSectionIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                        <Ionicons name="text-outline" size={14} color="#10B981" />
                      </View>
                      <View>
                        <Text style={[styles.afSectionTitle, isDark ? styles.textDark : styles.textLight]}>
                          Prefix & Suffix
                        </Text>
                        <Text style={styles.afSectionSubtitle}>Custom text added to the start or end of messages</Text>
                      </View>
                    </View>

                    <View style={styles.afPrefixSuffixStack}>
                      <View>
                        <Text style={styles.afInputLabelSmall}>PREFIX (START TEXT)</Text>
                        <View style={[styles.afInputDisplayBox, isDark ? styles.afEmptyBoxDark : styles.afEmptyBoxLight]}>
                          <Text style={styles.afInputDisplayText}>No prefix configured</Text>
                        </View>
                      </View>

                      <View style={{ marginTop: 10 }}>
                        <Text style={styles.afInputLabelSmall}>SUFFIX (END TEXT)</Text>
                        <View style={[styles.afInputDisplayBox, isDark ? styles.afEmptyBoxDark : styles.afEmptyBoxLight]}>
                          <Text style={styles.afInputDisplayText}>No suffix configured</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                <Text style={[styles.sectionTitle, isDark ? styles.textDark : styles.textLight, { marginTop: 24 }]}>
                  Other Automation Modules
                </Text>

                <Pressable style={[styles.autoCard, isDark ? styles.cardDark : styles.cardLight]} onPress={() => openToolModal('auto_approve')}>
                  <View style={styles.autoRow}>
                    <View style={[styles.autoIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                      <Ionicons name="checkmark-done" size={18} color="#059669" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.autoTitle, isDark ? styles.textDark : styles.textLight]}>Auto-Approval & Welcome DM</Text>
                      <Text style={styles.autoDesc}>Approve join requests in private channels automatically</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                  </View>
                </Pressable>

                <Pressable style={[styles.autoCard, isDark ? styles.cardDark : styles.cardLight]} onPress={() => openToolModal('reactions')}>
                  <View style={styles.autoRow}>
                    <View style={[styles.autoIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                      <Ionicons name="flash" size={18} color="#F59E0B" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.autoTitle, isDark ? styles.textDark : styles.textLight]}>AI Reaction Booster</Text>
                      <Text style={styles.autoDesc}>Auto-deliver reaction emojis to channel posts instantaneously</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                  </View>
                </Pressable>

                <Pressable style={[styles.autoCard, isDark ? styles.cardDark : styles.cardLight]} onPress={() => openToolModal('chatbot')}>
                  <View style={styles.autoRow}>
                    <View style={[styles.autoIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                      <Ionicons name="chatbubble-ellipses" size={18} color="#8B5CF6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.autoTitle, isDark ? styles.textDark : styles.textLight]}>Chat Bot Auto-Responses</Text>
                      <Text style={styles.autoDesc}>AI assistant responding to subscriber inquiries</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                  </View>
                </Pressable>
              </>
            )}

            {/* TAB 3: SUB MANAGER & VIP TIERS */}
            {activeTab === 'sub_manager' && (
              <>
                <View style={[styles.telesubCard, isDark ? styles.cardDark : styles.cardLight]}>
                  <View style={styles.revenueRow}>
                    <View>
                      <Text style={styles.revenueLabel}>ESTIMATED MRR</Text>
                      <Text style={styles.revenueVal}>₹{(summary?.telesubMonthlyRevenue || 0).toLocaleString()}</Text>
                    </View>
                    <Pressable
                      style={styles.actionBtnPrimary}
                      onPress={() => openToolModal('sub_manager')}
                    >
                      <Ionicons name="add" size={16} color="#FFFFFF" />
                      <Text style={styles.actionBtnPrimaryText}>Add Tier</Text>
                    </Pressable>
                  </View>
                </View>

                <Text style={[styles.sectionTitle, isDark ? styles.textDark : styles.textLight]}>
                  Active Subscription Tiers ({(subPlans || []).length})
                </Text>

                {(subPlans || []).length === 0 ? (
                  <View style={[styles.emptyCard, isDark ? styles.cardDark : styles.cardLight]}>
                    <Ionicons name="card-outline" size={36} color="#0284C7" style={{ marginBottom: 8 }} />
                    <Text style={[styles.emptyTitle, isDark ? styles.textDark : styles.textLight]}>No Subscription Tiers Yet</Text>
                    <Text style={styles.emptySubtitle}>
                      Create monetized VIP membership plans and landing pages for your Telegram channels.
                    </Text>
                    <Pressable
                      style={[styles.actionBtnPrimary, { marginTop: 12 }]}
                      onPress={() => openToolModal('sub_manager')}
                    >
                      <Ionicons name="add" size={16} color="#FFFFFF" />
                      <Text style={styles.actionBtnPrimaryText}>Create First Tier</Text>
                    </Pressable>
                  </View>
                ) : (
                  (subPlans || []).map((plan) => (
                    <View key={plan.id} style={[styles.planCard, isDark ? styles.cardDark : styles.cardLight]}>
                      <View style={styles.planHeader}>
                        <Text style={[styles.planTitle, isDark ? styles.textDark : styles.textLight]}>{plan.name}</Text>
                        <Text style={styles.planPrice}>₹{plan.price} / {plan.durationDays}d</Text>
                      </View>
                      <Text style={styles.planSubtitle}>{plan.landingPageTitle || 'VIP Community Membership'}</Text>
                      <View style={[styles.planFooter, isDark ? styles.borderDark : styles.borderLight]}>
                        <Text style={styles.planSubs}>{plan.inviteLink ? 'Live Landing Page' : 'VIP Channel Access'}</Text>
                        <Pressable
                          style={styles.copyBtn}
                          onPress={() => {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          }}
                        >
                          <Ionicons name="copy-outline" size={14} color="#0284C7" />
                          <Text style={styles.copyBtnText}>Copy Link</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))
                )}
              </>
            )}

            {/* TAB 4: BROADCASTS & OUTREACH */}
            {activeTab === 'broadcasts' && (
              <>
                <Pressable
                  style={[styles.broadcastBanner, isDark ? styles.cardDark : styles.cardLight]}
                  onPress={() => openToolModal('broadcast')}
                >
                  <View style={styles.broadcastBannerIcon}>
                    <Ionicons name="megaphone" size={24} color="#0284C7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.broadcastBannerTitle, isDark ? styles.textDark : styles.textLight]}>
                      Create New Broadcast
                    </Text>
                    <Text style={styles.broadcastBannerDesc}>
                      Blast rich announcements with CTA buttons to your Telegram audience
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward-circle" size={28} color="#0284C7" />
                </Pressable>

                <Text style={[styles.sectionTitle, isDark ? styles.textDark : styles.textLight]}>
                  Recent Broadcast History
                </Text>

                <View style={[styles.emptyCard, isDark ? styles.cardDark : styles.cardLight]}>
                  <Ionicons name="megaphone-outline" size={36} color="#0284C7" style={{ marginBottom: 8 }} />
                  <Text style={[styles.emptyTitle, isDark ? styles.textDark : styles.textLight]}>No Broadcasts Sent Yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Send instant or scheduled announcements to all your connected Telegram communities.
                  </Text>
                  <Pressable
                    style={[styles.actionBtnPrimary, { marginTop: 12 }]}
                    onPress={() => openToolModal('broadcast')}
                  >
                    <Ionicons name="megaphone" size={16} color="#FFFFFF" />
                    <Text style={styles.actionBtnPrimaryText}>Send First Broadcast</Text>
                  </Pressable>
                </View>
              </>
            )}

            {/* TAB 5: REACTIONS & AUDIENCE ENGAGEMENT */}
            {activeTab === 'reactions' && (
              <>
                <Pressable
                  style={[styles.broadcastBanner, isDark ? styles.cardDark : styles.cardLight]}
                  onPress={() => openToolModal('reactions')}
                >
                  <View style={[styles.broadcastBannerIcon, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
                    <Ionicons name="flash" size={24} color="#F59E0B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.broadcastBannerTitle, isDark ? styles.textDark : styles.textLight]}>
                      Configure Auto Reactions & Boosts
                    </Text>
                    <Text style={styles.broadcastBannerDesc}>
                      Set up instant emoji reactions, post views, and member retention boosts
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward-circle" size={28} color="#F59E0B" />
                </Pressable>

                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={[styles.sectionTitle, isDark ? styles.textDark : styles.textLight, { marginBottom: 2 }]}>
                      Reaction Automation & Refill Services
                    </Text>
                    <Text style={styles.sectionSub}>Live boost rates & engagement engine</Text>
                  </View>
                  <Pressable
                    style={[styles.actionBtnPrimary, { backgroundColor: '#F59E0B' }]}
                    onPress={() => openToolModal('reactions')}
                  >
                    <Ionicons name="cart" size={16} color="#FFFFFF" />
                    <Text style={styles.actionBtnPrimaryText}>Open Console</Text>
                  </Pressable>
                </View>

                {/* 4 Quick Highlight Service Cards */}
                <View style={[styles.metricsGrid, { borderTopWidth: 0, paddingTop: 0, marginBottom: 16 }]}>
                  <View style={[styles.metricItem, isDark ? styles.cardDark : styles.cardLight, { padding: 12, borderRadius: 12, borderWidth: 1 }]}>
                    <Text style={styles.metricLabel}>CUSTOM REACTIONS</Text>
                    <Text style={[styles.metricValue, { color: '#F59E0B' }]}>₹14 / 1k</Text>
                    <Text style={styles.metricSub}>❤️ 👍 🔥 👏 🚀 🥰</Text>
                  </View>
                  <View style={[styles.metricItem, isDark ? styles.cardDark : styles.cardLight, { padding: 12, borderRadius: 12, borderWidth: 1 }]}>
                    <Text style={styles.metricLabel}>AUTO VIEWS</Text>
                    <Text style={[styles.metricValue, { color: '#0284C7' }]}>₹4.8 / 1k</Text>
                    <Text style={styles.metricSub}>Immediate post delivery</Text>
                  </View>
                  <View style={[styles.metricItem, isDark ? styles.cardDark : styles.cardLight, { padding: 12, borderRadius: 12, borderWidth: 1 }]}>
                    <Text style={styles.metricLabel}>MEMBERS 30D</Text>
                    <Text style={[styles.metricValue, { color: '#10B981' }]}>₹80 / 1k</Text>
                    <Text style={styles.metricSub}>30-Day auto-refill</Text>
                  </View>
                  <View style={[styles.metricItem, isDark ? styles.cardDark : styles.cardLight, { padding: 12, borderRadius: 12, borderWidth: 1 }]}>
                    <Text style={styles.metricLabel}>MEMBERS 365D</Text>
                    <Text style={[styles.metricValue, { color: '#8B5CF6' }]}>₹250 / 1k</Text>
                    <Text style={styles.metricSub}>1-Year persistent refill</Text>
                  </View>
                </View>
              </>
            )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Interactive Modals for all 8 Tools */}
      <AutoforwardModal
        visible={activeModal === 'autoforward'}
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
        visible={activeModal === 'sub_manager'}
        onClose={() => setActiveModal(null)}
        onSubmit={createSubPlan}
        isLoading={isCreatingPlan}
        chats={chats || []}
      />

      <TrackerModal
        visible={activeModal === 'tracker'}
        onClose={() => setActiveModal(null)}
      />

      <ReportBotModal
        visible={activeModal === 'report_bot'}
        onClose={() => setActiveModal(null)}
      />

      <BroadcastModal
        visible={activeModal === 'broadcast'}
        onClose={() => setActiveModal(null)}
        onSubmit={sendBroadcast}
        isLoading={isBroadcasting}
        chats={chats || []}
      />

      <AutoApproveModal
        visible={activeModal === 'auto_approve'}
        onClose={() => setActiveModal(null)}
        onToggle={async (enabled) => {
          await toggleAutoApprove({ enabled, channelId: '@my_private_channel' });
        }}
      />

      <ChatBotModal
        visible={activeModal === 'chatbot'}
        onClose={() => setActiveModal(null)}
      />

      <ReactionsModal
        visible={activeModal === 'reactions'}
        onClose={() => setActiveModal(null)}
        onUpdate={async (emojis, speed) => {
          await updateReactions({ emojis, speed });
        }}
      />
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  tabBarWrapper: {
    borderBottomWidth: 1,
  },
  borderLight: { borderBottomColor: '#E2E8F0', borderTopColor: '#E2E8F0' },
  borderDark: { borderBottomColor: '#262C36', borderTopColor: '#262C36' },
  tabScroll: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabButtonLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  tabButtonDark: {
    backgroundColor: '#161B26',
    borderColor: '#262C36',
  },
  tabButtonActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabButtonTextLight: { color: '#64748B' },
  tabButtonTextDark: { color: '#94A3B8' },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  commandCenterCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  commandHeader: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 14,
  },
  sessionPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  headerBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  refreshHeaderBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sessionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sessionDotGreen: { backgroundColor: '#10B981', width: 7, height: 7, borderRadius: 3.5 },
  sessionDotYellow: { backgroundColor: '#F59E0B', width: 7, height: 7, borderRadius: 3.5 },
  sessionStatusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  syncHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  syncHeaderBtnText: {
    color: '#0284C7',
    fontSize: 11,
    fontWeight: '700',
  },
  connectHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  connectHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    paddingTop: 12,
    rowGap: 12,
  },
  metricItem: {
    width: '50%',
    paddingRight: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metricItemPressed: {
    opacity: 0.7,
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
  },
  metricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 4,
  },
  metricFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 4,
    marginTop: 2,
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  metricSub: {
    fontSize: 10,
    color: '#94A3B8',
  },
  quickLaunchScroll: {
    paddingVertical: 6,
    gap: 8,
    marginBottom: 14,
  },
  quickLaunchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickLaunchText: {
    fontSize: 12,
    fontWeight: '700',
  },
  categorySection: {
    marginBottom: 12,
  },
  categoryScroll: {
    gap: 8,
    marginTop: 8,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  pillLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  pillDark: { backgroundColor: '#161B26', borderColor: '#262C36' },
  catPillSelected: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  catPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  catPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
  },
  textLight: { color: '#0F172A' },
  textDark: { color: '#F8FAFC' },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: '#161B26',
    borderColor: '#262C36',
  },
  telesubCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revenueLabel: { color: '#64748B', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  revenueVal: { color: '#0284C7', fontSize: 24, fontWeight: '800', marginTop: 4 },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnPrimaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  planCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planTitle: { fontSize: 14, fontWeight: '700' },
  planPrice: { color: '#0284C7', fontSize: 14, fontWeight: '800' },
  planSubtitle: { color: '#64748B', fontSize: 12, marginTop: 4 },
  planFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  planSubs: { color: '#64748B', fontSize: 11, fontWeight: '600' },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  copyBtnText: { color: '#0284C7', fontSize: 11, fontWeight: '700' },
  ruleCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ruleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  ruleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  ruleName: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  delayBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  delayBadgeText: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: '700',
  },
  routeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  routeEndpoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  routeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  keywordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  kwTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  kwTagLight: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  kwTagDark: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
  },
  kwTagText: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '600',
  },
  autoCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  autoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  autoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  autoTitle: { fontSize: 14, fontWeight: '700' },
  autoDesc: { color: '#64748B', fontSize: 12, marginTop: 2 },
  broadcastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  broadcastBannerTitle: { fontSize: 15, fontWeight: '700' },
  broadcastBannerDesc: { color: '#64748B', fontSize: 12, marginTop: 2 },
  historyCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyTitle: { fontSize: 13, fontWeight: '700' },
  historyTime: { color: '#64748B', fontSize: 11 },
  historyDesc: { color: '#64748B', fontSize: 12, marginTop: 4 },
  emptyCard: {
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
  },
  syncedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  syncedBadgeText: { color: '#059669', fontSize: 11, fontWeight: '700' },
  botCountBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  botCountBadgeText: { color: '#0284C7', fontSize: 11, fontWeight: '700' },
  botCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  botCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  botAvatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  botAvatarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  botTitle: { fontSize: 14, fontWeight: '700', flex: 1 },
  botUsername: { color: '#0284C7', fontSize: 12, marginTop: 1, fontWeight: '600' },
  activePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activePillText: { color: '#059669', fontSize: 9, fontWeight: '800' },
  createLinkBtn: {
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    borderWidth: 1,
    borderColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  createLinkBtnText: { color: '#0284C7', fontSize: 11, fontWeight: '700' },
  mappedChannelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    flexWrap: 'wrap',
  },
  mappedLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  channelTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  channelTagText: { color: '#059669', fontSize: 11, fontWeight: '600' },
  noChannelsText: { color: '#94A3B8', fontSize: 11, fontStyle: 'italic' },
  // Autoforwarding Pipeline Styles
  pipelineHeroCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  pipelineHeroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  pipelineHeroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  pipelineHeroIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pipelineHeroTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  pipelineHeroSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  pipelineStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pipelineStatusText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
  },
  flowDiagramBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  flowDiagramDark: { backgroundColor: 'rgba(15, 23, 42, 0.6)' },
  flowDiagramLight: { backgroundColor: 'rgba(241, 245, 249, 0.8)' },
  flowNode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flowNodeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  flowArrowBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flowFilterTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0284C7',
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stationActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  ruleEditBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeBoxDark: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderColor: 'rgba(51, 65, 85, 0.6)',
  },
  routeBoxLight: {
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    borderColor: '#E2E8F0',
  },
  routeDotIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeLabelSmall: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  routeConnector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  routeConnectorLine: {
    width: 14,
    height: 1.5,
    backgroundColor: '#0284C7',
  },
  keywordsSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.12)',
  },
  keywordsSectionLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
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
  },
  afControlHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  afHeroIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  afHeroTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  afSystemActiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  afSystemActiveText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  afHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  afGhostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  afGhostBtnLight: { backgroundColor: 'rgba(241, 245, 249, 0.9)', borderColor: '#CBD5E1' },
  afGhostBtnDark: { backgroundColor: 'rgba(30, 41, 59, 0.7)', borderColor: '#334155' },
  afGhostBtnText: { fontSize: 11, fontWeight: '700' },
  afIconBtn: {
    padding: 7,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  afOpenBotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  afOpenBotBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  afKpiScroll: {
    paddingVertical: 4,
    gap: 10,
    marginBottom: 16,
  },
  afKpiCard: {
    width: 120,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  afKpiIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  afKpiValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  afKpiSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  afSectionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  afSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  afSectionSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  afEmptyBox: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  afEmptyBoxLight: { backgroundColor: 'rgba(241, 245, 249, 0.6)' },
  afEmptyBoxDark: { backgroundColor: 'rgba(15, 23, 42, 0.4)' },
  afEmptyText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  afMappingsList: {
    gap: 10,
  },
  afMappingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  afMappingRowLight: {
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    borderColor: '#E2E8F0',
  },
  afMappingRowDark: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderColor: '#334155',
  },
  afMappingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  afMappingArrowCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  afSourceChannelName: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  afTargetBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: '50%',
  },
  afTargetBadgeLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
  },
  afTargetBadgeDark: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderColor: '#475569',
  },
  afTargetBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  afDelayBigBox: {
    paddingVertical: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  afDelayBigNumber: {
    fontSize: 32,
    fontWeight: '900',
  },
  afDelayBigLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 2,
  },
  afPrefixSuffixStack: {
    gap: 12,
  },
  afInputLabelSmall: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  afInputDisplayBox: {
    padding: 12,
    borderRadius: 10,
  },
  afInputDisplayText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
});
