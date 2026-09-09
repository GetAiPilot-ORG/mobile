import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { AppScreen } from '../../../components/AppScreen';
import { AppTopBar } from '../../../components/AppTopBar';
import { useTelegram } from '../hooks/useTelegram';
import { TelegramApi } from '../api/telegram.api';
import { TelegramConnectModal } from '../components/TelegramConnectModal';
import { TelegramBroadcastModal } from '../components/TelegramBroadcastModal';
import { TelegramSection, TelegramToolType } from '../types/telegram.types';

export const TelegramScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const {
    statusQuery,
    dashboardQuery,
    setupHubQuery,
    chatsQuery,
    autoforwardQuery,
    subManagerQuery,
    trackerQuery,
    reportBotQuery,
    broadcastsQuery,
    autoApproveQuery,
    chatbotsQuery,
    reactionsQuery,
    syncChatsMutation,
    createMappingMutation,
    toggleMappingMutation,
    deleteMappingMutation,
    saveTrackerBotMutation,
    createJoinLinkMutation,
    updateReportBotMutation,
    createBroadcastMutation,
    createReactionOrderMutation,
    logoutMutation,
  } = useTelegram();

  // State
  const [activeSection, setActiveSection] = useState<TelegramSection>('dashboard');
  const [activeTool, setActiveTool] = useState<TelegramToolType>('autoforward');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  // Tool-specific creation modals
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [newSourceChannel, setNewSourceChannel] = useState('');
  const [newDestChannel, setNewDestChannel] = useState('');

  const [showBotModal, setShowBotModal] = useState(false);
  const [newBotToken, setNewBotToken] = useState('');

  const [showJoinLinkModal, setShowJoinLinkModal] = useState(false);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkChannel, setNewLinkChannel] = useState('');

  const [showReactionModal, setShowReactionModal] = useState(false);
  const [reactionPostUrl, setReactionPostUrl] = useState('');
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>(['👍', '🔥', '❤️']);

  const refreshing =
    dashboardQuery.isRefetching ||
    statusQuery.isRefetching ||
    setupHubQuery.isRefetching ||
    chatsQuery.isRefetching;

  const onRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dashboardQuery.refetch();
    statusQuery.refetch();
    setupHubQuery.refetch();
    chatsQuery.refetch();
    autoforwardQuery.refetch();
    subManagerQuery.refetch();
    trackerQuery.refetch();
    reportBotQuery.refetch();
    broadcastsQuery.refetch();
    autoApproveQuery.refetch();
    chatbotsQuery.refetch();
    reactionsQuery.refetch();
  };

  const isConnected = statusQuery.data?.connected;
  const metrics = dashboardQuery.data?.metrics;
  const setupHub = setupHubQuery.data;

  // Render Sub-Sections
  const renderDashboard = () => {
    if (dashboardQuery.isLoading && !dashboardQuery.data) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={[styles.loadingText, isDark ? styles.subTextDark : styles.subTextLight]}>
            Loading Telegram Dashboard...
          </Text>
        </View>
      );
    }

    if (dashboardQuery.isError) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={36} color="#EF4444" />
          <Text style={styles.errorText}>Failed to load Telegram Dashboard data.</Text>
          <Pressable style={styles.retryButton} onPress={() => dashboardQuery.refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {/* Account Status Card */}
      <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
        <View style={styles.cardHeader}>
          <View style={styles.rowAlign}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: isConnected ? '#10B981' : '#F59E0B' },
              ]}
            />
            <Text style={[styles.cardTitle, isDark ? styles.textDark : styles.textLight]}>
              Telegram Session
            </Text>
          </View>
          <View style={[styles.badge, isConnected ? styles.badgeSuccess : styles.badgeWarning]}>
            <Text style={[styles.badgeText, isConnected ? styles.badgeTextSuccess : styles.badgeTextWarning]}>
              {isConnected ? 'Active & Synced' : 'Not Connected'}
            </Text>
          </View>
        </View>

        <Text style={[styles.cardSubText, isDark ? styles.subTextDark : styles.subTextLight]}>
          {isConnected
            ? `Connected phone: ${statusQuery.data?.phone || 'Linked via MTProto Session'}`
            : 'Link your Telegram account to activate live multi-channel automation & routing.'}
        </Text>

        <View style={styles.cardActions}>
          {!isConnected ? (
            <Pressable
              style={[styles.primaryButton, { flex: 1 }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowConnectModal(true);
              }}
            >
              <Ionicons name="link" size={16} color="#FFF" />
              <Text style={styles.primaryButtonText}>Connect Telegram</Text>
            </Pressable>
          ) : (
            <View style={styles.rowGap}>
              <Pressable
                style={[styles.secondaryButton, { flex: 1 }]}
                onPress={() => syncChatsMutation.mutate()}
                disabled={syncChatsMutation.isPending}
              >
                {syncChatsMutation.isPending ? (
                  <ActivityIndicator size="small" color="#6366F1" />
                ) : (
                  <>
                    <Ionicons name="sync" size={16} color="#6366F1" />
                    <Text style={styles.secondaryButtonText}>Sync Channels</Text>
                  </>
                )}
              </Pressable>
              <Pressable
                style={[styles.dangerOutlineButton]}
                onPress={() => logoutMutation.mutate()}
              >
                <Ionicons name="log-out-outline" size={16} color="#EF4444" />
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {/* Metric Grid */}
      <View style={styles.metricsGrid}>
        <View style={[styles.metricCard, isDark ? styles.cardDark : styles.cardLight]}>
          <Ionicons name="chatbubbles" size={20} color="#3B82F6" />
          <Text style={[styles.metricValue, isDark ? styles.textDark : styles.textLight]}>
            {metrics?.totalChannels || chatsQuery.data?.length || 0}
          </Text>
          <Text style={[styles.metricLabel, isDark ? styles.subTextDark : styles.subTextLight]}>
            Channels & Groups
          </Text>
        </View>

        <View style={[styles.metricCard, isDark ? styles.cardDark : styles.cardLight]}>
          <Ionicons name="hardware-chip" size={20} color="#8B5CF6" />
          <Text style={[styles.metricValue, isDark ? styles.textDark : styles.textLight]}>
            {metrics?.activeBots || 0}
          </Text>
          <Text style={[styles.metricLabel, isDark ? styles.subTextDark : styles.subTextLight]}>
            Active Bots
          </Text>
        </View>

        <View style={[styles.metricCard, isDark ? styles.cardDark : styles.cardLight]}>
          <Ionicons name="repeat" size={20} color="#10B981" />
          <Text style={[styles.metricValue, isDark ? styles.textDark : styles.textLight]}>
            {metrics?.activeForwards || 0}
          </Text>
          <Text style={[styles.metricLabel, isDark ? styles.subTextDark : styles.subTextLight]}>
            Forward Mappings
          </Text>
        </View>

        <View style={[styles.metricCard, isDark ? styles.cardDark : styles.cardLight]}>
          <Ionicons name="card" size={20} color="#F59E0B" />
          <Text style={[styles.metricValue, isDark ? styles.textDark : styles.textLight]}>
            {metrics?.totalLandingPages || 0}
          </Text>
          <Text style={[styles.metricLabel, isDark ? styles.subTextDark : styles.subTextLight]}>
            TeleSub Pages
          </Text>
        </View>
      </View>

      {/* Quick Launch Shortcuts */}
      <Text style={[styles.sectionHeader, isDark ? styles.textDark : styles.textLight]}>
        Quick Actions
      </Text>

      <View style={styles.quickActionsRow}>
        <Pressable
          style={[styles.quickActionButton, isDark ? styles.cardDark : styles.cardLight]}
          onPress={() => {
            setActiveSection('setup');
          }}
        >
          <Ionicons name="checkmark-done-circle" size={24} color="#10B981" />
          <Text style={[styles.quickActionText, isDark ? styles.textDark : styles.textLight]}>
            Setup Hub ({setupHub?.completed || 0}/{setupHub?.total || 8})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.quickActionButton, isDark ? styles.cardDark : styles.cardLight]}
          onPress={() => {
            setShowBroadcastModal(true);
          }}
        >
          <Ionicons name="megaphone" size={24} color="#EC4899" />
          <Text style={[styles.quickActionText, isDark ? styles.textDark : styles.textLight]}>
            New Broadcast
          </Text>
        </Pressable>
      </View>
    </View>
  );
  };

  const renderSetupHub = () => (
    <View style={styles.tabContent}>
      {/* Overall Progress */}
      <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, isDark ? styles.textDark : styles.textLight]}>
            Setup Progress
          </Text>
          <Text style={[styles.progressBadge, { color: '#6366F1' }]}>
            {setupHub?.completed || 0} / {setupHub?.total || 8} Completed
          </Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${setupHub?.progressPercentage || 0}%` },
            ]}
          />
        </View>
        <Text style={[styles.cardSubText, isDark ? styles.subTextDark : styles.subTextLight]}>
          Complete module prerequisites to enable automated multi-channel growth.
        </Text>
      </View>

      {/* 8 Module Cards */}
      {(setupHub?.modules || []).map((mod) => (
        <View
          key={mod.id}
          style={[styles.moduleCard, isDark ? styles.cardDark : styles.cardLight]}
        >
          <View style={styles.moduleHeader}>
            <View style={styles.rowAlign}>
              <Ionicons
                name={mod.completed ? 'checkmark-circle' : 'alert-circle'}
                size={22}
                color={mod.completed ? '#10B981' : '#F59E0B'}
              />
              <Text style={[styles.moduleName, isDark ? styles.textDark : styles.textLight]}>
                {mod.name}
              </Text>
            </View>
            <View
              style={[
                styles.badge,
                mod.completed ? styles.badgeSuccess : styles.badgeWarning,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  mod.completed ? styles.badgeTextSuccess : styles.badgeTextWarning,
                ]}
              >
                {mod.completed ? 'Ready' : 'Incomplete'}
              </Text>
            </View>
          </View>
          <Text style={[styles.moduleDesc, isDark ? styles.subTextDark : styles.subTextLight]}>
            {mod.description}
          </Text>
          {mod.missingRequirements.length > 0 && (
            <View style={styles.missingBox}>
              <Text style={styles.missingHeader}>Missing Requirement:</Text>
              {mod.missingRequirements.map((req, idx) => (
                <Text key={idx} style={styles.missingItem}>
                  • {req}
                </Text>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const renderMonetization = () => {
    const subManager = subManagerQuery.data;
    const readiness = subManager?.readiness;

    return (
      <View style={styles.tabContent}>
        {/* Revenue Card */}
        <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
          <Text style={[styles.cardSubText, isDark ? styles.subTextDark : styles.subTextLight]}>
            Total TeleSub Earnings
          </Text>
          <Text style={[styles.revenueAmount, { color: '#10B981' }]}>
            ₹{subManager?.totalRevenue?.toLocaleString('en-IN') || '0.00'}
          </Text>
          <View style={styles.revenueMetaRow}>
            <Text style={[styles.metaLabel, isDark ? styles.subTextDark : styles.subTextLight]}>
              Active Subscribers: <Text style={{ color: '#6366F1', fontWeight: 'bold' }}>{subManager?.activeSubscribers || 0}</Text>
            </Text>
            <Text style={[styles.metaLabel, isDark ? styles.subTextDark : styles.subTextLight]}>
              Subscription Pages: <Text style={{ color: '#6366F1', fontWeight: 'bold' }}>{subManager?.totalPages || 0}</Text>
            </Text>
          </View>
        </View>

        {/* 4-Step Launch Readiness */}
        <Text style={[styles.sectionHeader, isDark ? styles.textDark : styles.textLight]}>
          Client Launch Readiness
        </Text>

        <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
          <View style={styles.readinessItem}>
            <Ionicons
              name={readiness?.telegramOwnerLinked ? 'checkbox' : 'square-outline'}
              size={20}
              color={readiness?.telegramOwnerLinked ? '#10B981' : '#9CA3AF'}
            />
            <Text style={[styles.readinessText, isDark ? styles.textDark : styles.textLight]}>
              1. Link Telegram Owner Account
            </Text>
          </View>

          <View style={styles.readinessItem}>
            <Ionicons
              name={readiness?.channelBotAdmin ? 'checkbox' : 'square-outline'}
              size={20}
              color={readiness?.channelBotAdmin ? '#10B981' : '#9CA3AF'}
            />
            <Text style={[styles.readinessText, isDark ? styles.textDark : styles.textLight]}>
              2. Channel Bot Admin Verification
            </Text>
          </View>

          <View style={styles.readinessItem}>
            <Ionicons
              name={readiness?.payoutKycCompleted ? 'checkbox' : 'square-outline'}
              size={20}
              color={readiness?.payoutKycCompleted ? '#10B981' : '#9CA3AF'}
            />
            <Text style={[styles.readinessText, isDark ? styles.textDark : styles.textLight]}>
              3. Payout Bank KYC (Razorpay Linked)
            </Text>
          </View>

          <View style={styles.readinessItem}>
            <Ionicons
              name={readiness?.subscriptionPagePublished ? 'checkbox' : 'square-outline'}
              size={20}
              color={readiness?.subscriptionPagePublished ? '#10B981' : '#9CA3AF'}
            />
            <Text style={[styles.readinessText, isDark ? styles.textDark : styles.textLight]}>
              4. Subscription Page Published
            </Text>
          </View>
        </View>

        {/* Subscription Pages */}
        <Text style={[styles.sectionHeader, isDark ? styles.textDark : styles.textLight]}>
          Hosted Subscription Pages ({subManager?.pages?.length || 0})
        </Text>

        {(subManager?.pages || []).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, isDark ? styles.subTextDark : styles.subTextLight]}>
              No subscription pages created yet.
            </Text>
          </View>
        ) : (
          subManager?.pages?.map((page) => (
            <View key={page.id} style={[styles.pageCard, isDark ? styles.cardDark : styles.cardLight]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, isDark ? styles.textDark : styles.textLight]}>
                  {page.title}
                </Text>
                <Text style={[styles.pagePrice, { color: '#10B981' }]}>
                  ₹{page.price} / {page.duration_days}d
                </Text>
              </View>
              <Text style={[styles.pageSlug, isDark ? styles.subTextDark : styles.subTextLight]}>
                Slug: /p/{page.slug}
              </Text>
            </View>
          ))
        )}
      </View>
    );
  };

  const renderChannelsAndBots = () => {
    const chats = chatsQuery.data || [];
    const tracker = trackerQuery.data;

    return (
      <View style={styles.tabContent}>
        {/* Tracker Bots Section */}
        <View style={styles.rowBetween}>
          <Text style={[styles.sectionHeader, isDark ? styles.textDark : styles.textLight]}>
            Connected Tracker Bots ({tracker?.bots?.length || 0})
          </Text>
          <Pressable
            style={styles.actionSmallButton}
            onPress={() => setShowBotModal(true)}
          >
            <Ionicons name="add" size={16} color="#FFF" />
            <Text style={styles.actionSmallText}>Add Bot</Text>
          </Pressable>
        </View>

        {(tracker?.bots || []).length === 0 ? (
          <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
            <Text style={[styles.cardSubText, isDark ? styles.subTextDark : styles.subTextLight]}>
              No tracker bots connected. Connect a bot via BotFather token to track channel joins and attribution.
            </Text>
          </View>
        ) : (
          tracker?.bots?.map((bot) => (
            <View key={bot.id} style={[styles.botCard, isDark ? styles.cardDark : styles.cardLight]}>
              <Ionicons name="logo-android" size={24} color="#6366F1" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.botName, isDark ? styles.textDark : styles.textLight]}>
                  {bot.bot_name}
                </Text>
                <Text style={[styles.botUsername, isDark ? styles.subTextDark : styles.subTextLight]}>
                  @{bot.bot_username || 'bot'}
                </Text>
              </View>
              <View style={[styles.badge, styles.badgeSuccess]}>
                <Text style={[styles.badgeText, styles.badgeTextSuccess]}>Active</Text>
              </View>
            </View>
          ))
        )}

        {/* Synced Channels */}
        <View style={styles.rowBetween}>
          <Text style={[styles.sectionHeader, isDark ? styles.textDark : styles.textLight]}>
            Synced Telegram Channels ({chats.length})
          </Text>
          <Pressable
            style={styles.actionSmallSecondaryButton}
            onPress={() => syncChatsMutation.mutate()}
            disabled={syncChatsMutation.isPending}
          >
            <Ionicons name="sync" size={14} color="#6366F1" />
            <Text style={styles.actionSmallSecondaryText}>Sync</Text>
          </Pressable>
        </View>

        {chats.length === 0 ? (
          <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
            <Text style={[styles.cardSubText, isDark ? styles.subTextDark : styles.subTextLight]}>
              No channels synced. Tap Sync to discover channels where you are owner or admin.
            </Text>
          </View>
        ) : (
          chats.map((chat: any) => (
            <View key={chat.id} style={[styles.chatRow, isDark ? styles.cardDark : styles.cardLight]}>
              <Ionicons
                name={chat.type === 'channel' ? 'megaphone-outline' : 'people-outline'}
                size={20}
                color="#3B82F6"
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.chatTitle, isDark ? styles.textDark : styles.textLight]}>
                  {chat.title}
                </Text>
                <Text style={[styles.chatMeta, isDark ? styles.subTextDark : styles.subTextLight]}>
                  {chat.type} • {chat.members_count || 0} members
                </Text>
              </View>
              {chat.is_admin && (
                <View style={[styles.badge, styles.badgeSuccess]}>
                  <Text style={[styles.badgeText, styles.badgeTextSuccess]}>Admin</Text>
                </View>
              )}
            </View>
          ))
        )}
      </View>
    );
  };

  const renderTools = () => {
    const autoforward = autoforwardQuery.data;
    const tracker = trackerQuery.data;
    const reportBot = reportBotQuery.data;
    const broadcasts = broadcastsQuery.data || [];
    const chatbots = chatbotsQuery.data || [];
    const reactions = reactionsQuery.data;

    return (
      <View style={styles.tabContent}>
        {/* Tool Segmented Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toolSelectorScroll}>
          {[
            { id: 'autoforward', label: 'Autoforward' },
            { id: 'tracker', label: 'Tracker' },
            { id: 'report_bot', label: 'Report Bot' },
            { id: 'broadcast', label: 'Broadcast' },
            { id: 'auto_approve', label: 'Auto Approve' },
            { id: 'chatbot', label: 'AI Chatbot' },
            { id: 'reactions', label: 'Reactions' },
          ].map((t) => (
            <Pressable
              key={t.id}
              style={[
                styles.toolPill,
                activeTool === t.id && styles.toolPillActive,
                isDark ? styles.cardDark : styles.cardLight,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTool(t.id as TelegramToolType);
              }}
            >
              <Text
                style={[
                  styles.toolPillText,
                  activeTool === t.id && styles.toolPillTextActive,
                  isDark ? styles.textDark : styles.textLight,
                ]}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* 1. Autoforward Tool */}
        {activeTool === 'autoforward' && (
          <View>
            <View style={styles.rowBetween}>
              <Text style={[styles.sectionHeader, isDark ? styles.textDark : styles.textLight]}>
                Active Forward Mappings ({autoforward?.mappings?.length || 0})
              </Text>
              <Pressable
                style={styles.actionSmallButton}
                onPress={() => setShowMappingModal(true)}
              >
                <Ionicons name="add" size={16} color="#FFF" />
                <Text style={styles.actionSmallText}>Add Mapping</Text>
              </Pressable>
            </View>

            {(autoforward?.mappings || []).length === 0 ? (
              <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
                <Text style={[styles.cardSubText, isDark ? styles.subTextDark : styles.subTextLight]}>
                  No forward mappings configured. Forward posts seamlessly from source channels to destination channels.
                </Text>
              </View>
            ) : (
              autoforward?.mappings?.map((m) => (
                <View key={m.id} style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.mappingText, isDark ? styles.textDark : styles.textLight]}>
                      {m.source_channel_id} → {m.destination_channel_id}
                    </Text>
                    <Pressable
                      onPress={() =>
                        toggleMappingMutation.mutate({ id: m.id, is_active: !m.is_active })
                      }
                    >
                      <Ionicons
                        name={m.is_active ? 'toggle' : 'toggle-outline'}
                        size={28}
                        color={m.is_active ? '#10B981' : '#9CA3AF'}
                      />
                    </Pressable>
                  </View>
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => deleteMappingMutation.mutate(m.id)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>
        )}

        {/* 2. Tracker Tool */}
        {activeTool === 'tracker' && (
          <View>
            <View style={styles.rowBetween}>
              <Text style={[styles.sectionHeader, isDark ? styles.textDark : styles.textLight]}>
                Tracking Join Links ({tracker?.links?.length || 0})
              </Text>
              <Pressable
                style={styles.actionSmallButton}
                onPress={() => setShowJoinLinkModal(true)}
              >
                <Ionicons name="add" size={16} color="#FFF" />
                <Text style={styles.actionSmallText}>Create Link</Text>
              </Pressable>
            </View>

            {(tracker?.links || []).map((link) => (
              <View key={link.id} style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
                <Text style={[styles.cardTitle, isDark ? styles.textDark : styles.textLight]}>
                  {link.link_name}
                </Text>
                <Text style={[styles.cardSubText, isDark ? styles.subTextDark : styles.subTextLight]}>
                  Campaign: {link.campaign_name}
                </Text>
                <Text style={[styles.linkUrlText, { color: '#3B82F6' }]}>
                  {link.public_url}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 3. Report Bot Tool */}
        {activeTool === 'report_bot' && (
          <View>
            <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
              <Text style={[styles.cardTitle, isDark ? styles.textDark : styles.textLight]}>
                SEBI Research Profile
              </Text>
              <Text style={[styles.cardSubText, isDark ? styles.subTextDark : styles.subTextLight]}>
                Analyst: {reportBot?.brand?.analyst_name || 'Not Configured'}
              </Text>
              <Text style={[styles.cardSubText, isDark ? styles.subTextDark : styles.subTextLight]}>
                Registration: {reportBot?.brand?.registration_no || 'Not Configured'}
              </Text>
            </View>

            <Text style={[styles.sectionHeader, isDark ? styles.textDark : styles.textLight]}>
              Recent Trading Call Reports ({reportBot?.recentReports?.length || 0})
            </Text>
          </View>
        )}

        {/* 4. Broadcast Tool */}
        {activeTool === 'broadcast' && (
          <View>
            <View style={styles.rowBetween}>
              <Text style={[styles.sectionHeader, isDark ? styles.textDark : styles.textLight]}>
                Broadcast Tasks ({broadcasts.length})
              </Text>
              <Pressable
                style={styles.actionSmallButton}
                onPress={() => setShowBroadcastModal(true)}
              >
                <Ionicons name="add" size={16} color="#FFF" />
                <Text style={styles.actionSmallText}>Compose</Text>
              </Pressable>
            </View>

            {broadcasts.map((b) => (
              <View key={b.id} style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
                <Text style={[styles.cardTitle, isDark ? styles.textDark : styles.textLight]}>
                  {b.message}
                </Text>
                <Text style={[styles.cardSubText, isDark ? styles.subTextDark : styles.subTextLight]}>
                  Target: {b.target_audience} • Status: {b.status}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 5. Auto Approve Tool */}
        {activeTool === 'auto_approve' && (
          <View>
            <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
              <Text style={[styles.cardTitle, isDark ? styles.textDark : styles.textLight]}>
                24/7 Smart Gatekeeper
              </Text>
              <Text style={[styles.cardSubText, isDark ? styles.subTextDark : styles.subTextLight]}>
                Automatic approval of private channel join requests is active.
              </Text>
            </View>
          </View>
        )}

        {/* 6. AI Chatbot Tool */}
        {activeTool === 'chatbot' && (
          <View>
            <Text style={[styles.sectionHeader, isDark ? styles.textDark : styles.textLight]}>
              AI Chatbot Configurations ({chatbots.length})
            </Text>
            {chatbots.map((cb) => (
              <View key={cb.id} style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
                <Text style={[styles.cardTitle, isDark ? styles.textDark : styles.textLight]}>
                  {cb.bot_name} ({cb.provider})
                </Text>
                <Text style={[styles.cardSubText, isDark ? styles.subTextDark : styles.subTextLight]}>
                  Prompt: {cb.system_prompt || 'Standard Assistant'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 7. Reactions Tool */}
        {activeTool === 'reactions' && (
          <View>
            <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
              <Text style={[styles.cardSubText, isDark ? styles.subTextDark : styles.subTextLight]}>
                Wallet Balance
              </Text>
              <Text style={[styles.revenueAmount, { color: '#6366F1' }]}>
                ₹{reactions?.walletBalance || 0}
              </Text>
            </View>

            <View style={styles.rowBetween}>
              <Text style={[styles.sectionHeader, isDark ? styles.textDark : styles.textLight]}>
                Reaction Orders ({reactions?.orders?.length || 0})
              </Text>
              <Pressable
                style={styles.actionSmallButton}
                onPress={() => setShowReactionModal(true)}
              >
                <Ionicons name="add" size={16} color="#FFF" />
                <Text style={styles.actionSmallText}>New Order</Text>
              </Pressable>
            </View>

            {(reactions?.orders || []).map((o) => (
              <View key={o.id} style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
                <Text style={[styles.cardTitle, isDark ? styles.textDark : styles.textLight]}>
                  {o.post_link}
                </Text>
                <Text style={[styles.cardSubText, isDark ? styles.subTextDark : styles.subTextLight]}>
                  Quantity: {o.quantity} • Status: {o.status}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <AppScreen>
      <AppTopBar title="Telegram Automation" subtitle="Ecosystem & Channels" />

      {/* 5 Primary Tabs */}
      <View style={styles.primaryTabsContainer}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: 'grid-outline' },
          { id: 'setup', label: 'Setup Hub', icon: 'checkbox-outline' },
          { id: 'monetization', label: 'TeleSub', icon: 'cash-outline' },
          { id: 'channels', label: 'Channels & Bots', icon: 'chatbubbles-outline' },
          { id: 'tools', label: 'Tools', icon: 'construct-outline' },
        ].map((tab) => (
          <Pressable
            key={tab.id}
            style={[
              styles.primaryTab,
              activeSection === tab.id && styles.primaryTabActive,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveSection(tab.id as TelegramSection);
            }}
          >
            <Ionicons
              name={tab.icon as any}
              size={18}
              color={activeSection === tab.id ? '#6366F1' : isDark ? '#9CA3AF' : '#6B7280'}
            />
            <Text
              style={[
                styles.primaryTabText,
                activeSection === tab.id && styles.primaryTabTextActive,
                isDark ? styles.textDark : styles.textLight,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeSection === 'dashboard' && renderDashboard()}
        {activeSection === 'setup' && renderSetupHub()}
        {activeSection === 'monetization' && renderMonetization()}
        {activeSection === 'channels' && renderChannelsAndBots()}
        {activeSection === 'tools' && renderTools()}
      </ScrollView>

      {/* Modals */}
      <TelegramConnectModal
        visible={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        isConnected={Boolean(isConnected)}
        connectedPhone={statusQuery.data?.phone}
        onStartLogin={(phone) => TelegramApi.startLogin(phone)}
        onVerifyOtp={(otp) => TelegramApi.verifyOtp(otp)}
        onVerifyPassword={(pass, ph) => TelegramApi.verifyPassword(pass, ph)}
        onLogout={() => logoutMutation.mutateAsync()}
      />

      <TelegramBroadcastModal
        visible={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
        channels={chatsQuery.data || []}
        onSubmit={async (payload) => {
          await createBroadcastMutation.mutateAsync({
            message: payload.text,
            target_audience: payload.channel_id,
          });
          setShowBroadcastModal(false);
        }}
        isLoading={createBroadcastMutation.isPending}
      />

      {/* Mapping Creator Modal */}
      <Modal visible={showMappingModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDark ? styles.cardDark : styles.cardLight]}>
            <Text style={[styles.modalTitle, isDark ? styles.textDark : styles.textLight]}>
              Create Forward Mapping
            </Text>
            <TextInput
              style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
              placeholder="Source Channel ID"
              placeholderTextColor="#9CA3AF"
              value={newSourceChannel}
              onChangeText={setNewSourceChannel}
            />
            <TextInput
              style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
              placeholder="Destination Channel ID"
              placeholderTextColor="#9CA3AF"
              value={newDestChannel}
              onChangeText={setNewDestChannel}
            />
            <View style={styles.rowGap}>
              <Pressable
                style={[styles.secondaryButton, { flex: 1 }]}
                onPress={() => setShowMappingModal(false)}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, { flex: 1 }]}
                onPress={() => {
                  createMappingMutation.mutate({
                    source_channel_id: newSourceChannel,
                    destination_channel_id: newDestChannel,
                  });
                  setShowMappingModal(false);
                  setNewSourceChannel('');
                  setNewDestChannel('');
                }}
              >
                <Text style={styles.primaryButtonText}>Create</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tracker Bot Creator Modal */}
      <Modal visible={showBotModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDark ? styles.cardDark : styles.cardLight]}>
            <Text style={[styles.modalTitle, isDark ? styles.textDark : styles.textLight]}>
              Connect Tracker Bot
            </Text>
            <TextInput
              style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
              placeholder="Enter BotFather Token (e.g. 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11)"
              placeholderTextColor="#9CA3AF"
              value={newBotToken}
              onChangeText={setNewBotToken}
              secureTextEntry
            />
            <View style={styles.rowGap}>
              <Pressable
                style={[styles.secondaryButton, { flex: 1 }]}
                onPress={() => setShowBotModal(false)}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, { flex: 1 }]}
                onPress={() => {
                  saveTrackerBotMutation.mutate(newBotToken);
                  setShowBotModal(false);
                  setNewBotToken('');
                }}
              >
                <Text style={styles.primaryButtonText}>Save Token</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  primaryTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB22',
  },
  primaryTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
  },
  primaryTabActive: {
    backgroundColor: '#6366F11A',
  },
  primaryTabText: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  primaryTabTextActive: {
    color: '#6366F1',
    fontWeight: '700',
  },
  tabContent: {
    padding: 16,
    gap: 14,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  cardDark: {
    backgroundColor: '#1E1E2D',
    borderColor: '#2E2E3E',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  cardSubText: {
    fontSize: 13,
    lineHeight: 18,
  },
  textLight: {
    color: '#111827',
  },
  textDark: {
    color: '#F9FAFB',
  },
  subTextLight: {
    color: '#6B7280',
  },
  subTextDark: {
    color: '#9CA3AF',
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowGap: {
    flexDirection: 'row',
    gap: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeSuccess: {
    backgroundColor: '#10B98120',
  },
  badgeWarning: {
    backgroundColor: '#F59E0B20',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeTextSuccess: {
    color: '#10B981',
  },
  badgeTextWarning: {
    color: '#F59E0B',
  },
  cardActions: {
    marginTop: 12,
  },
  primaryButton: {
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#6366F11A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: '#6366F1',
    fontSize: 13,
    fontWeight: '600',
  },
  dangerOutlineButton: {
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '48%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 12,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 2,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E5E7EB33',
    borderRadius: 4,
    marginVertical: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 4,
  },
  progressBadge: {
    fontSize: 12,
    fontWeight: '700',
  },
  moduleCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moduleName: {
    fontSize: 14,
    fontWeight: '600',
  },
  moduleDesc: {
    fontSize: 12,
  },
  missingBox: {
    backgroundColor: '#F59E0B15',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  missingHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
  },
  missingItem: {
    fontSize: 11,
    color: '#D97706',
    marginTop: 2,
  },
  revenueAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  revenueMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metaLabel: {
    fontSize: 12,
  },
  readinessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  readinessText: {
    fontSize: 13,
  },
  pageCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  pagePrice: {
    fontSize: 13,
    fontWeight: '700',
  },
  pageSlug: {
    fontSize: 11,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
  actionSmallButton: {
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  actionSmallText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  actionSmallSecondaryButton: {
    backgroundColor: '#6366F11A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  actionSmallSecondaryText: {
    color: '#6366F1',
    fontSize: 11,
    fontWeight: '600',
  },
  botCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  botName: {
    fontSize: 14,
    fontWeight: '600',
  },
  botUsername: {
    fontSize: 12,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  chatTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  chatMeta: {
    fontSize: 11,
  },
  toolSelectorScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  toolPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  toolPillActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  toolPillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  toolPillTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  mappingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '600',
  },
  linkUrlText: {
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000080',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  inputLight: {
    backgroundColor: '#F9FAFB',
    borderColor: '#D1D5DB',
    color: '#111827',
  },
  inputDark: {
    backgroundColor: '#111827',
    borderColor: '#374151',
    color: '#F9FAFB',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  errorContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#6366F11A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#6366F1',
    fontSize: 13,
    fontWeight: '600',
  },
});
