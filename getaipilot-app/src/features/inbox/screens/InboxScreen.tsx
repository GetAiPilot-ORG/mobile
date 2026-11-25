import React, { useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  SectionList,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Add01Icon } from '@/constants/icons';
import { ArrowUp, WifiOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { AppScreen } from '@/components/AppScreen';
import { useTheme, getColors } from '@/theme';
import { useAuthStore } from '@/core/store/authStore';
import { useNetwork } from '@/contexts/NetworkContext';
import { useChatbotScroll } from '@/components/chatbot';

import { inboxApi } from '../api/inboxApi';
import { useInboxWebSocket } from '../hooks/useInboxWebSocket';
import { ContactItem, NormalizedConversation, InboxChannel } from '../types';
import { ConversationScreen } from './ConversationScreen';

import {
  InboxHeader,
  InboxSearchBar,
  ActiveFilterChips,
  FilterState,
  ChannelChips,
  ChannelFilterId,
  ConversationCard,
  FilterBottomSheet,
  NewChatBottomSheet,
  InboxSkeleton,
} from '../components';

export const InboxScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { isOnline } = useNetwork();
  const user = useAuthStore((s) => s.user);

  // Chatbot auto-hide scroll listener
  const { onScroll: onChatbotScroll } = useChatbotScroll();

  // Filters State
  const [selectedChannel, setSelectedChannel] = useState<ChannelFilterId>('all');
  const [selectedTelegramBot, setSelectedTelegramBot] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState<FilterState>({
    status: 'ALL',
    dateRange: 'ALL',
    assigneeId: 'ALL',
    assigneeName: undefined,
  });

  // Modals & Active Conversation
  const [showFilterSheet, setShowFilterSheet] = useState<boolean>(false);
  const [showNewChatSheet, setShowNewChatSheet] = useState<boolean>(false);
  const [activeConversation, setActiveConversation] =
    useState<NormalizedConversation | null>(null);

  // Multi-Select Mode
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Scroll to top pill state
  const [showScrollTopPill, setShowScrollTopPill] = useState<boolean>(false);
  const sectionListRef = useRef<SectionList>(null);

  // Realtime Global Inbox WebSocket Subscription
  useInboxWebSocket();

  // ── Queries ────────────────────────────────────────────────────────────────
  const {
    data: conversations,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['conversations', user?.id || 'guest', searchQuery],
    queryFn: () => inboxApi.getConversations('all', 'all', searchQuery),
    staleTime: 45000,
  });

  const { data: contacts, isLoading: isLoadingContacts } = useQuery({
    queryKey: ['inbox_contacts', user?.id || 'guest'],
    queryFn: () => inboxApi.getContacts(),
    staleTime: 30000,
  });

  const { data: teamMembers } = useQuery({
    queryKey: ['inbox_team_members', user?.organizationId],
    queryFn: () => inboxApi.getTeamMembers(),
    staleTime: 60000,
  });

  const { data: templates } = useQuery({
    queryKey: ['inbox_templates', user?.organizationId],
    queryFn: () => inboxApi.getTemplates(),
    staleTime: 60000,
  });

  const convList = useMemo(() => conversations || [], [conversations]);

  // Channel counts
  const channelCounts = useMemo(() => {
    const counts = { all: convList.length, whatsapp: 0, telegram: 0, instagram: 0, facebook: 0 };
    convList.forEach((c) => {
      if (c.channel === 'whatsapp') counts.whatsapp++;
      else if (c.channel === 'telegram') counts.telegram++;
      else if (c.channel === 'instagram') counts.instagram++;
      else if (c.channel === 'facebook') counts.facebook++;
    });
    return counts;
  }, [convList]);

  // Telegram chatbots distinct list
  const telegramBots = useMemo(() => {
    const botsMap = new Map<string, { id: string; name: string; count: number }>();
    convList.forEach((c) => {
      if (c.channel === 'telegram' && c.bot_name) {
        const key = c.bot_id || c.bot_name;
        if (!botsMap.has(key)) {
          botsMap.set(key, { id: key, name: c.bot_name, count: 0 });
        }
        botsMap.get(key)!.count++;
      }
    });
    return Array.from(botsMap.values());
  }, [convList]);

  // Filter conversations based on Channel, Telegram bot, and Advanced Filters
  const filteredConversations = useMemo(() => {
    return convList.filter((conv) => {
      // 1. Channel Filter
      if (selectedChannel !== 'all' && conv.channel !== selectedChannel) {
        return false;
      }

      // 2. Telegram Bot Sub-filter
      if (selectedChannel === 'telegram' && selectedTelegramBot !== 'all') {
        const matchBot =
          conv.bot_id === selectedTelegramBot || conv.bot_name === selectedTelegramBot;
        if (!matchBot) return false;
      }

      // 3. Status Filter
      if (filters.status === 'UNASSIGNED') {
        if (conv.assigned_to || conv.assigned_agent_name) return false;
      } else if (filters.status === 'MINE') {
        const myName = user?.name || user?.email?.split('@')[0] || '';
        const myId = user?.id || '';
        const isAssignedToMe =
          (conv.assigned_to && (conv.assigned_to === myName || conv.assigned_to === myId)) ||
          (conv.assigned_agent_name && conv.assigned_agent_name === myName);
        if (!isAssignedToMe) return false;
      } else if (filters.status === 'BOT_ACTIVE') {
        if (conv.bot_enabled === false || conv.bot_paused) return false;
      } else if (filters.status === 'UNREAD') {
        if ((conv.unread_count || 0) <= 0) return false;
      } else if (filters.status === 'RESOLVED') {
        if (conv.status !== 'resolved') return false;
      }

      // 4. Date Range Filter
      if (filters.dateRange !== 'ALL' && conv.last_message.created_at) {
        const msgDate = new Date(conv.last_message.created_at);
        const now = new Date();
        const diffMs = now.getTime() - msgDate.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (filters.dateRange === 'TODAY' && diffHours > 24) return false;
        if (filters.dateRange === 'WEEK' && diffHours > 24 * 7) return false;
        if (filters.dateRange === 'MONTH' && diffHours > 24 * 30) return false;
      }

      // 5. Specific Assignee Filter
      if (filters.assigneeId !== 'ALL') {
        if (
          conv.assigned_agent_id !== filters.assigneeId &&
          conv.assigned_to !== filters.assigneeId
        ) {
          return false;
        }
      }

      return true;
    });
  }, [convList, selectedChannel, selectedTelegramBot, filters, user]);

  // Section Grouping: PINNED, TODAY, YESTERDAY, EARLIER
  const sections = useMemo(() => {
    const pinned: NormalizedConversation[] = [];
    const today: NormalizedConversation[] = [];
    const yesterday: NormalizedConversation[] = [];
    const earlier: NormalizedConversation[] = [];

    const now = new Date();
    const isSameDay = (d1: Date, d2: Date) =>
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();

    const yestDate = new Date(now);
    yestDate.setDate(now.getDate() - 1);

    filteredConversations.forEach((conv) => {
      if (conv.metadata?.pinned) {
        pinned.push(conv);
        return;
      }

      const date = new Date(conv.last_message.created_at);
      if (isNaN(date.getTime()) || isSameDay(date, now)) {
        today.push(conv);
      } else if (isSameDay(date, yestDate)) {
        yesterday.push(conv);
      } else {
        earlier.push(conv);
      }
    });

    const result = [];
    if (pinned.length > 0) result.push({ title: 'PINNED', data: pinned });
    if (today.length > 0) result.push({ title: 'TODAY', data: today });
    if (yesterday.length > 0) result.push({ title: 'YESTERDAY', data: yesterday });
    if (earlier.length > 0) result.push({ title: 'EARLIER', data: earlier });

    return result;
  }, [filteredConversations]);

  const unreadTotal = useMemo(
    () => convList.reduce((sum, c) => sum + (c.unread_count || 0), 0),
    [convList]
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status !== 'ALL') count++;
    if (filters.dateRange !== 'ALL') count++;
    if (filters.assigneeId !== 'ALL') count++;
    return count;
  }, [filters]);

  // ── Conversation Handlers ──────────────────────────────────────────────────
  const handleOpenConversation = (item: NormalizedConversation) => {
    // 1. Optimistically clear unread_count in cache
    queryClient.setQueriesData<NormalizedConversation[]>(
      { queryKey: ['conversations'] },
      (old) => {
        if (!old) return old;
        return old.map((c) => (c.id === item.id ? { ...c, unread_count: 0 } : c));
      }
    );

    setActiveConversation({ ...item, unread_count: 0 });

    if (item.unread_count > 0) {
      inboxApi.markAsRead(item.id);
    }
  };

  const handleStartChatWithContact = async (
    contact: ContactItem,
    channel: InboxChannel,
    _initialMessage?: string
  ) => {
    setShowNewChatSheet(false);
    try {
      const res = await inboxApi.startConversation(contact.id);
      const newConv: NormalizedConversation = {
        id: res.id,
        organization_id: user?.organizationId || '',
        contact: {
          name: contact.name || contact.custom_name || contact.phone,
          handle_or_phone: contact.phone || contact.wa_id || '',
        },
        channel,
        last_message: {
          content: 'Conversation started',
          created_at: new Date().toISOString(),
          direction: 'inbound',
        },
        unread_count: 0,
        status: 'active',
        bot_enabled: true,
      };
      setActiveConversation(newConv);
      refetch();
    } catch {
      const fallbackConv: NormalizedConversation = {
        id: `conv_${contact.id}`,
        organization_id: user?.organizationId || '',
        contact: {
          name: contact.name || contact.custom_name || contact.phone,
          handle_or_phone: contact.phone || contact.wa_id || '',
        },
        channel,
        last_message: {
          content: 'Conversation started',
          created_at: new Date().toISOString(),
          direction: 'inbound',
        },
        unread_count: 0,
        status: 'active',
        bot_enabled: true,
      };
      setActiveConversation(fallbackConv);
    }
  };

  // ── Multi-Select Batch Actions ─────────────────────────────────────────────
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (next.size === 0) setIsSelectionMode(false);
      return next;
    });
  };

  const handleStartSelection = (id: string) => {
    setIsSelectionMode(true);
    setSelectedIds(new Set([id]));
  };

  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleBatchMarkRead = () => {
    selectedIds.forEach((id) => inboxApi.markAsRead(id));
    queryClient.setQueriesData<NormalizedConversation[]>(
      { queryKey: ['conversations'] },
      (old) => {
        if (!old) return old;
        return old.map((c) => (selectedIds.has(c.id) ? { ...c, unread_count: 0 } : c));
      }
    );
    handleCancelSelection();
  };

  const handleBatchAssign = () => {
    selectedIds.forEach((id) =>
      inboxApi.assignAgent(id, user?.id || null, user?.name || null)
    );
    queryClient.setQueriesData<NormalizedConversation[]>(
      { queryKey: ['conversations'] },
      (old) => {
        if (!old) return old;
        return old.map((c) =>
          selectedIds.has(c.id)
            ? { ...c, assigned_to: user?.id, assigned_agent_name: user?.name }
            : c
        );
      }
    );
    handleCancelSelection();
  };

  const handleBatchResolve = () => {
    queryClient.setQueriesData<NormalizedConversation[]>(
      { queryKey: ['conversations'] },
      (old) => {
        if (!old) return old;
        return old.map((c) =>
          selectedIds.has(c.id) ? { ...c, status: 'resolved' as const } : c
        );
      }
    );
    handleCancelSelection();
  };

  const handleBatchDelete = () => {
    queryClient.setQueriesData<NormalizedConversation[]>(
      { queryKey: ['conversations'] },
      (old) => {
        if (!old) return old;
        return old.filter((c) => !selectedIds.has(c.id));
      }
    );
    handleCancelSelection();
  };

  const handleScrollToTop = () => {
    if (sectionListRef.current) {
      sectionListRef.current.scrollToLocation({
        sectionIndex: 0,
        itemIndex: 0,
        animated: true,
      });
      setShowScrollTopPill(false);
    }
  };

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      {/* Offline Notice Banner */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <WifiOff size={14} color="#FFFFFF" strokeWidth={2.4} style={{ marginRight: 6 }} />
          <Text style={styles.offlineText}>
            Offline mode. Reconnecting to live inbox...
          </Text>
        </View>
      )}

      {/* Upgraded Header with Title, Unread Count & Multi-Select Bar */}
      <InboxHeader
        unreadTotal={unreadTotal}
        onNewChat={() => setShowNewChatSheet(true)}
        isSelectionMode={isSelectionMode}
        selectedCount={selectedIds.size}
        onCancelSelection={handleCancelSelection}
        onBatchMarkRead={handleBatchMarkRead}
        onBatchAssign={handleBatchAssign}
        onBatchResolve={handleBatchResolve}
        onBatchDelete={handleBatchDelete}
      />

      {/* Upgraded Search Bar with Clear Button & Filter Button */}
      <InboxSearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={() => setSearchQuery('')}
        onOpenFilterSheet={() => setShowFilterSheet(true)}
        activeFilterCount={activeFilterCount}
      />

      {/* Removable Active Filter Chips */}
      <ActiveFilterChips
        filters={filters}
        onRemoveStatus={() => setFilters((f) => ({ ...f, status: 'ALL' }))}
        onRemoveDateRange={() => setFilters((f) => ({ ...f, dateRange: 'ALL' }))}
        onRemoveAssignee={() =>
          setFilters((f) => ({ ...f, assigneeId: 'ALL', assigneeName: undefined }))
        }
        onClearAll={() =>
          setFilters({
            status: 'ALL',
            dateRange: 'ALL',
            assigneeId: 'ALL',
            assigneeName: undefined,
          })
        }
      />

      {/* Channel Chips with Right-Edge Fade & Sub-bot Filters */}
      <ChannelChips
        selectedChannel={selectedChannel}
        onSelectChannel={setSelectedChannel}
        channelCounts={channelCounts}
        telegramBots={telegramBots}
        selectedTelegramBot={selectedTelegramBot}
        onSelectTelegramBot={setSelectedTelegramBot}
      />

      {/* "New messages" Pill on Scroll */}
      {showScrollTopPill && (
        <Pressable
          onPress={handleScrollToTop}
          style={[styles.scrollTopPill, { backgroundColor: colors.accent }]}
        >
          <ArrowUp size={13} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 4 }} />
          <Text style={styles.scrollTopPillText}>New messages</Text>
        </Pressable>
      )}

      {/* Conversation List with Sticky Timeline Headers */}
      {isLoading && !conversations ? (
        <InboxSkeleton />
      ) : (
        <SectionList
          ref={sectionListRef}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContentContainer}
          onScroll={(e) => {
            onChatbotScroll(e);
            const offsetY = e.nativeEvent.contentOffset.y;
            if (offsetY > 300 && !showScrollTopPill) {
              // Can show pill if new items arrived
            } else if (offsetY <= 100 && showScrollTopPill) {
              setShowScrollTopPill(false);
            }
          }}
          scrollEventThrottle={16}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeaderContainer}>
              <Text
                style={[
                  styles.sectionHeaderText,
                  { color: colors.textSecondary },
                ]}
              >
                {title}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <ConversationCard
              conversation={item}
              onPress={() => handleOpenConversation(item)}
              onLongPress={() => handleStartSelection(item.id)}
              searchQuery={searchQuery}
              isSelectionMode={isSelectionMode}
              isSelected={selectedIds.has(item.id)}
              onToggleSelect={() => handleToggleSelect(item.id)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                refetch();
              }}
              tintColor={colors.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View
                style={[
                  styles.emptyImageBox,
                  {
                    borderColor: colors.cardBorder,
                    shadowColor: colors.accent,
                  },
                ]}
              >
                <Image
                  source={require('../../../../assets/images/inbox-empty.webp')}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                No conversations found
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textSecondary }]}
              >
                {activeFilterCount > 0 || selectedChannel !== 'all' || searchQuery
                  ? 'No conversations match your selected filters. Try clearing filters to see all messages.'
                  : 'Incoming messages from WhatsApp, Telegram, and InstaPilot will arrive here in real time.'}
              </Text>

              <Pressable
                style={[
                  styles.emptyCtaBtn,
                  { backgroundColor: colors.buttonPrimary },
                ]}
                onPress={() => setShowNewChatSheet(true)}
              >
                <HugeiconsIcon
                  icon={Add01Icon}
                  size={15}
                  color={colors.buttonPrimaryForeground}
                  strokeWidth={2}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.emptyCtaText,
                    { color: colors.buttonPrimaryForeground },
                  ]}
                >
                  Start New Conversation
                </Text>
              </Pressable>
            </View>
          }
        />
      )}

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        visible={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        currentFilters={filters}
        onApplyFilters={setFilters}
        teamMembers={teamMembers}
      />

      {/* New Chat Bottom Sheet */}
      <NewChatBottomSheet
        visible={showNewChatSheet}
        onClose={() => setShowNewChatSheet(false)}
        contacts={contacts || []}
        isLoadingContacts={isLoadingContacts}
        onStartChat={handleStartChatWithContact}
        templates={templates || []}
      />

      {/* Fullscreen WhatsApp / Live Conversation Modal */}
      <Modal
        visible={!!activeConversation}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setActiveConversation(null)}
      >
        {activeConversation && (
          <ConversationScreen
            conversation={activeConversation}
            onBack={() => setActiveConversation(null)}
          />
        )}
      </Modal>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  offlineBanner: {
    backgroundColor: '#EF4444',
    paddingVertical: 6,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  listContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 130, // Clears floating bottom nav and floating chat button completely
  },
  sectionHeaderContainer: {
    paddingTop: 8,
    paddingBottom: 6,
    paddingHorizontal: 4,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  scrollTopPill: {
    position: 'absolute',
    top: 155,
    alignSelf: 'center',
    zIndex: 99,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  scrollTopPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingHorizontal: 32,
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyImageBox: {
    width: 120,
    height: 120,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 6,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  emptyCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  emptyCtaText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default InboxScreen;
