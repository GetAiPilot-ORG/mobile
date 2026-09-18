import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { apiClient } from '../../../core/api/client';
import {
  SocialInboxConversationItem,
  SocialInboxMessageItem,
  SocialInboxReplyPayload,
} from '../types';

interface SocialInboxTabProps {
  onOpenAccountsModal: () => void;
}

const QUICK_REPLIES = [
  'Thanks for reaching out! 🙌',
  'Here is the link you requested: https://getaipilot.in 🔗',
  'Let us know if you need help with setup! 🚀',
  'Could you share your email or phone number? 📱',
];

const formatMessageTime = (dateStr?: string | null) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diffHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
    if (diffHours < 24 && d.getDate() === now.getDate()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

export const SocialInboxTab: React.FC<SocialInboxTabProps> = ({ onOpenAccountsModal }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const queryClient = useQueryClient();
  const messagesScrollRef = useRef<ScrollView>(null);

  // Filter & Search states
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'instagram' | 'facebook'>('all');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNREAD' | 'REPLIED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected thread & reply state
  const [selectedConversation, setSelectedConversation] = useState<SocialInboxConversationItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendErrorBanner, setSendErrorBanner] = useState<string | null>(null);

  // 1. Fetch Conversations from Upstream API
  const {
    data: conversations = [],
    isLoading: convsLoading,
    isRefetching: convsRefetching,
    refetch: refetchConversations,
  } = useQuery({
    queryKey: ['social', 'inbox', 'conversations'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; items: SocialInboxConversationItem[] }>(
        '/mobile/v1/social/inbox/conversations',
        { params: { limit: 50 } }
      );
      return Array.isArray(res?.items) ? res.items : [];
    },
  });

  // 2. Fetch Messages for selected conversation
  const {
    data: messages = [],
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ['social', 'inbox', 'messages', selectedConversation?.databaseId],
    enabled: Boolean(selectedConversation?.databaseId),
    queryFn: async () => {
      if (!selectedConversation?.databaseId) return [];
      const res = await apiClient.get<{ success: boolean; messages: SocialInboxMessageItem[] }>(
        `/mobile/v1/social/inbox/conversations/${selectedConversation.databaseId}/messages`,
        { params: { limit: 50 } }
      );
      return Array.isArray(res?.messages) ? res.messages : [];
    },
  });

  // 3. Mark Conversation as Read Mutation
  const markReadMutation = useMutation({
    mutationFn: async (databaseId: string) => {
      return apiClient.post(`/mobile/v1/social/inbox/conversations/${databaseId}/read`, {});
    },
    onSuccess: (_, databaseId) => {
      queryClient.setQueryData(
        ['social', 'inbox', 'conversations'],
        (prev: SocialInboxConversationItem[] = []) =>
          prev.map((c) => (c.databaseId === databaseId ? { ...c, unread: false } : c))
      );
    },
  });

  // 4. Send Message / Reply Mutation
  const sendReplyMutation = useMutation({
    mutationFn: async (payload: SocialInboxReplyPayload) => {
      return apiClient.post<{
        success: boolean;
        error?: string;
        message?: string;
        replyId?: string;
      }>('/mobile/v1/social/inbox/reply', payload);
    },
    onSuccess: (res, variables) => {
      if (res?.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setReplyText('');
        setSendErrorBanner(null);

        // Optimistically append outbound message to current message list
        const newMsg: SocialInboxMessageItem = {
          id: res.replyId || `rep_${Date.now()}`,
          text: variables.text,
          createdAt: new Date().toISOString(),
          isSelf: true,
          status: 'sent',
        };

        queryClient.setQueryData(
          ['social', 'inbox', 'messages', variables.conversationDatabaseId],
          (prev: SocialInboxMessageItem[] = []) => [...prev, newMsg]
        );

        // Update replied & unread status in conversations list
        queryClient.setQueryData(
          ['social', 'inbox', 'conversations'],
          (prev: SocialInboxConversationItem[] = []) =>
            prev.map((c) =>
              c.databaseId === variables.conversationDatabaseId
                ? { ...c, replied: true, unread: false }
                : c
            )
        );

        // Scroll to bottom
        setTimeout(() => {
          messagesScrollRef.current?.scrollToEnd({ animated: true });
        }, 150);

        queryClient.invalidateQueries({ queryKey: ['social', 'inbox', 'conversations'] });
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const errMsg =
          res?.message ||
          res?.error ||
          'Message not sent: Outside 24-hour allowed window or messaging restrictions apply.';
        setSendErrorBanner(errMsg);
        Alert.alert('Delivery Notice', errMsg);
      }
    },
    onError: (err: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errMsg = err?.message || 'Failed to send message. Please check your network connection.';
      setSendErrorBanner(errMsg);
      Alert.alert('Delivery Error', errMsg);
    },
  });

  // Handle open conversation
  const handleOpenConversation = (conv: SocialInboxConversationItem) => {
    Haptics.selectionAsync();
    setSelectedConversation(conv);
    setSendErrorBanner(null);
    if (conv.unread && conv.databaseId) {
      markReadMutation.mutate(conv.databaseId);
    }
  };

  // Handle Send click
  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedConversation) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSendErrorBanner(null);

    const payload: SocialInboxReplyPayload = {
      platform: selectedConversation.platform || 'instagram',
      accountId: selectedConversation.accountId,
      commentId: selectedConversation.commentId || undefined,
      recipientId: selectedConversation.replyRecipientId || undefined,
      postId: selectedConversation.postId || null,
      text: replyText.trim(),
      conversationDatabaseId: selectedConversation.databaseId,
    };

    await sendReplyMutation.mutateAsync(payload);
  };

  // Filtered conversation list
  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      // Platform filter
      if (selectedPlatform !== 'all' && conv.platform !== selectedPlatform) {
        return false;
      }
      // Status filter
      if (statusFilter === 'UNREAD' && !conv.unread) {
        return false;
      }
      if (statusFilter === 'REPLIED' && !conv.replied) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const authorMatch = (conv.authorName || '').toLowerCase().includes(q);
        const handleMatch = (conv.authorHandle || '').toLowerCase().includes(q);
        const textMatch = (conv.text || '').toLowerCase().includes(q);
        const accountMatch = (conv.accountName || '').toLowerCase().includes(q);
        if (!authorMatch && !handleMatch && !textMatch && !accountMatch) {
          return false;
        }
      }
      return true;
    });
  }, [conversations, selectedPlatform, statusFilter, searchQuery]);

  // Metric counts
  const totalCount = conversations.length;
  const unreadCount = conversations.filter((c) => c.unread).length;
  const repliedCount = conversations.filter((c) => c.replied).length;

  return (
    <View style={styles.container}>
      {/* 1. Header Overview & Stats Card */}
      <View
        style={[
          styles.headerCard,
          {
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            borderColor: isDark ? '#1e293b' : '#e2e8f0',
          },
        ]}
      >
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.headerTitleRow}>
              <View style={styles.livePulseDot} />
              <Text style={[styles.tabHeading, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                Social Inbox
              </Text>
            </View>
            <Text style={[styles.tabSubheading, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              Instagram Direct Messages, Comments & Customer Inquiries
            </Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                refetchConversations();
              }}
              style={[
                styles.iconBtn,
                { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
              ]}
            >
              <Ionicons
                name={convsRefetching ? 'sync' : 'refresh'}
                size={16}
                color={isDark ? '#cbd5e1' : '#475569'}
              />
            </Pressable>

            <Pressable onPress={onOpenAccountsModal} style={styles.channelsBtn}>
              <Ionicons name="link" size={13} color="#e1306c" />
              <Text style={styles.channelsBtnText}>Connected</Text>
            </Pressable>
          </View>
        </View>

        {/* Quick Metric Pills */}
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statPill,
              { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: isDark ? '#334155' : '#e2e8f0' },
            ]}
          >
            <Text style={[styles.statNum, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{totalCount}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>

          <View
            style={[
              styles.statPill,
              {
                backgroundColor: unreadCount > 0 ? 'rgba(244, 63, 94, 0.12)' : isDark ? '#1e293b' : '#f8fafc',
                borderColor: unreadCount > 0 ? '#f43f5e' : isDark ? '#334155' : '#e2e8f0',
              },
            ]}
          >
            <Text style={[styles.statNum, { color: unreadCount > 0 ? '#f43f5e' : isDark ? '#f8fafc' : '#0f172a' }]}>
              {unreadCount}
            </Text>
            <Text style={styles.statLabel}>Unread</Text>
          </View>

          <View
            style={[
              styles.statPill,
              { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: isDark ? '#334155' : '#e2e8f0' },
            ]}
          >
            <Text style={[styles.statNum, { color: '#22c55e' }]}>{repliedCount}</Text>
            <Text style={styles.statLabel}>Replied</Text>
          </View>
        </View>
      </View>

      {/* 2. Platform Filter Chips */}
      <View style={styles.filterRow}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedPlatform('all');
          }}
          style={[
            styles.channelChip,
            selectedPlatform === 'all'
              ? [styles.channelChipActive, { backgroundColor: '#e1306c' }]
              : { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
          ]}
        >
          <Ionicons
            name="chatbubbles"
            size={14}
            color={selectedPlatform === 'all' ? '#ffffff' : isDark ? '#94a3b8' : '#64748b'}
          />
          <Text
            style={[
              styles.channelChipText,
              { color: selectedPlatform === 'all' ? '#ffffff' : isDark ? '#f8fafc' : '#0f172a' },
            ]}
          >
            All Platforms
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedPlatform('instagram');
          }}
          style={[
            styles.channelChip,
            selectedPlatform === 'instagram'
              ? [styles.channelChipActive, { backgroundColor: '#e1306c' }]
              : { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
          ]}
        >
          <Ionicons
            name="logo-instagram"
            size={14}
            color={selectedPlatform === 'instagram' ? '#ffffff' : '#e1306c'}
          />
          <Text
            style={[
              styles.channelChipText,
              { color: selectedPlatform === 'instagram' ? '#ffffff' : isDark ? '#f8fafc' : '#0f172a' },
            ]}
          >
            Instagram
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedPlatform('facebook');
          }}
          style={[
            styles.channelChip,
            selectedPlatform === 'facebook'
              ? [styles.channelChipActive, { backgroundColor: '#1877f2' }]
              : { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
          ]}
        >
          <Ionicons
            name="logo-facebook"
            size={14}
            color={selectedPlatform === 'facebook' ? '#ffffff' : '#1877f2'}
          />
          <Text
            style={[
              styles.channelChipText,
              { color: selectedPlatform === 'facebook' ? '#ffffff' : isDark ? '#f8fafc' : '#0f172a' },
            ]}
          >
            Facebook
          </Text>
        </Pressable>
      </View>

      {/* 3. Search and Status Row */}
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            borderColor: isDark ? '#1e293b' : '#e2e8f0',
          },
        ]}
      >
        <View
          style={[
            styles.searchInputBox,
            {
              backgroundColor: isDark ? '#1e293b' : '#f8fafc',
              borderColor: isDark ? '#334155' : '#cbd5e1',
            },
          ]}
        >
          <Ionicons name="search" size={15} color={isDark ? '#94a3b8' : '#64748b'} />
          <TextInput
            style={[styles.searchInput, { color: isDark ? '#f8fafc' : '#0f172a' }]}
            placeholder="Search by username, handle or message..."
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {Boolean(searchQuery) && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
            </Pressable>
          )}
        </View>

        <View style={styles.statusChipsRow}>
          {(['ALL', 'UNREAD', 'REPLIED'] as const).map((st) => {
            const isSelected = statusFilter === st;
            return (
              <Pressable
                key={st}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setStatusFilter(st);
                }}
                style={[
                  styles.statusChip,
                  {
                    backgroundColor: isSelected
                      ? 'rgba(225, 48, 108, 0.14)'
                      : isDark
                      ? '#1e293b'
                      : '#f1f5f9',
                    borderColor: isSelected ? '#e1306c' : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    {
                      color: isSelected ? '#e1306c' : isDark ? '#94a3b8' : '#64748b',
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {st === 'ALL' ? 'All Threads' : st === 'UNREAD' ? 'Unread' : 'Replied'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 4. Conversations List */}
      {convsLoading && conversations.length === 0 ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#e1306c" />
          <Text style={[styles.loadingText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            Loading inbox conversations from social channels...
          </Text>
        </View>
      ) : filteredConversations.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            {
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              borderColor: isDark ? '#1e293b' : '#e2e8f0',
            },
          ]}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={44} color={isDark ? '#475569' : '#cbd5e1'} />
          <Text style={[styles.emptyTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
            No Conversations Found
          </Text>
          <Text style={[styles.emptyDesc, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            {searchQuery
              ? `No messages matched "${searchQuery}".`
              : 'Direct messages and comments across connected accounts will appear here.'}
          </Text>
          {Boolean(searchQuery) && (
            <Pressable onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Text style={styles.clearSearchBtnText}>Clear Search</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <View style={styles.conversationsList}>
          {filteredConversations.map((conv) => {
            const isInstagram = (conv.platform || '').toLowerCase().includes('instagram');
            const author = conv.authorName || conv.authorHandle?.replace(/^@/, '') || 'Social Contact';
            const handle = conv.authorHandle || `@${conv.authorName || 'user'}`;
            const timeFormatted = formatMessageTime(conv.createdAt);

            return (
              <Pressable
                key={conv.id || conv.databaseId}
                onPress={() => handleOpenConversation(conv)}
                style={({ pressed }) => [
                  styles.convCard,
                  {
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: conv.unread
                      ? '#e1306c'
                      : isDark
                      ? '#1e293b'
                      : '#e2e8f0',
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                {/* Avatar with Platform Pill */}
                <View style={styles.avatarContainer}>
                  {conv.authorAvatar ? (
                    <Image source={{ uri: conv.authorAvatar }} style={styles.avatarImg} />
                  ) : (
                    <View
                      style={[
                        styles.avatarFallback,
                        {
                          backgroundColor: isInstagram
                            ? 'rgba(225, 48, 108, 0.16)'
                            : 'rgba(24, 119, 242, 0.16)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.avatarInitial,
                          { color: isInstagram ? '#e1306c' : '#1877f2' },
                        ]}
                      >
                        {author.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <View
                    style={[
                      styles.platformBadgeWrap,
                      { backgroundColor: isInstagram ? '#e1306c' : '#1877f2' },
                    ]}
                  >
                    <Ionicons
                      name={isInstagram ? 'logo-instagram' : 'logo-facebook'}
                      size={10}
                      color="#ffffff"
                    />
                  </View>
                </View>

                {/* Content info */}
                <View style={styles.convDetailsCol}>
                  <View style={styles.convHeaderRow}>
                    <Text
                      style={[
                        styles.contactName,
                        { color: isDark ? '#f8fafc' : '#0f172a' },
                        conv.unread ? { fontWeight: '800' } : null,
                      ]}
                      numberOfLines={1}
                    >
                      {author}
                    </Text>
                    <Text style={styles.convTimeText}>{timeFormatted}</Text>
                  </View>

                  <View style={styles.convHandleRow}>
                    <Text style={styles.convHandleText} numberOfLines={1}>
                      {handle}
                    </Text>
                    {conv.accountName && (
                      <Text style={styles.convAccountTag} numberOfLines={1}>
                        • via {conv.accountName}
                      </Text>
                    )}
                  </View>

                  <Text
                    style={[
                      styles.previewText,
                      { color: isDark ? '#cbd5e1' : '#475569' },
                      conv.unread ? { color: isDark ? '#ffffff' : '#0f172a', fontWeight: '600' } : null,
                    ]}
                    numberOfLines={2}
                  >
                    {conv.text || 'Direct message thread'}
                  </Text>

                  {/* Status Pills */}
                  <View style={styles.convMetaBadgeRow}>
                    {conv.unread ? (
                      <View style={styles.unreadPill}>
                        <View style={styles.unreadDot} />
                        <Text style={styles.unreadPillText}>New Message</Text>
                      </View>
                    ) : conv.replied ? (
                      <View style={styles.repliedPill}>
                        <Ionicons name="checkmark-done" size={12} color="#16a34a" />
                        <Text style={styles.repliedPillText}>Replied</Text>
                      </View>
                    ) : (
                      <View style={styles.openPill}>
                        <Text style={styles.openPillText}>Open Thread</Text>
                      </View>
                    )}

                    {conv.starred && (
                      <View style={styles.starredPill}>
                        <Ionicons name="star" size={11} color="#eab308" />
                      </View>
                    )}
                  </View>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={isDark ? '#475569' : '#cbd5e1'}
                  style={{ alignSelf: 'center' }}
                />
              </Pressable>
            );
          })}
        </View>
      )}

      {/* 5. Chat Thread Viewer & Reply Modal */}
      <Modal
        visible={Boolean(selectedConversation)}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedConversation(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.modalContainer, { backgroundColor: isDark ? '#0b0f19' : '#f8fafc' }]}
        >
          {/* Modal Header */}
          <View
            style={[
              styles.modalHeader,
              {
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                borderBottomColor: isDark ? '#1e293b' : '#e2e8f0',
              },
            ]}
          >
            <View style={styles.modalHeaderInfo}>
              <View style={styles.modalAvatarBox}>
                {selectedConversation?.authorAvatar ? (
                  <Image source={{ uri: selectedConversation.authorAvatar }} style={styles.modalAvatarImg} />
                ) : (
                  <View
                    style={[
                      styles.avatarFallback,
                      {
                        backgroundColor:
                          (selectedConversation?.platform || '').toLowerCase() === 'instagram'
                            ? 'rgba(225, 48, 108, 0.16)'
                            : 'rgba(24, 119, 242, 0.16)',
                        width: 36,
                        height: 36,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.avatarInitial,
                        {
                          color:
                            (selectedConversation?.platform || '').toLowerCase() === 'instagram'
                              ? '#e1306c'
                              : '#1877f2',
                          fontSize: 14,
                        },
                      ]}
                    >
                      {(selectedConversation?.authorName || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]} numberOfLines={1}>
                  {selectedConversation?.authorName || selectedConversation?.authorHandle || 'Contact'}
                </Text>
                <Text style={styles.modalSub} numberOfLines={1}>
                  {selectedConversation?.authorHandle} •{' '}
                  {(selectedConversation?.platform || 'INSTAGRAM').toUpperCase()}
                  {selectedConversation?.accountName ? ` • via ${selectedConversation.accountName}` : ''}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  refetchMessages();
                }}
                style={[styles.modalHeaderBtn, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
              >
                <Ionicons name="refresh" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
              </Pressable>

              <Pressable
                onPress={() => setSelectedConversation(null)}
                style={[styles.modalHeaderBtn, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
              >
                <Ionicons name="close" size={18} color={isDark ? '#cbd5e1' : '#64748b'} />
              </Pressable>
            </View>
          </View>

          {/* Delivery Error / Warning Banner */}
          {Boolean(sendErrorBanner) && (
            <View style={styles.errorBannerBox}>
              <Ionicons name="alert-circle" size={18} color="#f43f5e" />
              <Text style={styles.errorBannerText}>{sendErrorBanner}</Text>
              <Pressable onPress={() => setSendErrorBanner(null)}>
                <Ionicons name="close" size={16} color="#f43f5e" />
              </Pressable>
            </View>
          )}

          {/* Messages Feed */}
          <ScrollView
            ref={messagesScrollRef}
            contentContainerStyle={styles.messagesContainer}
            onContentSizeChange={() => messagesScrollRef.current?.scrollToEnd({ animated: false })}
          >
            {/* Conversation Context Pill */}
            <View style={styles.threadMetaPill}>
              <Ionicons
                name={
                  (selectedConversation?.platform || '').toLowerCase() === 'instagram'
                    ? 'logo-instagram'
                    : 'logo-facebook'
                }
                size={13}
                color={
                  (selectedConversation?.platform || '').toLowerCase() === 'instagram'
                    ? '#e1306c'
                    : '#1877f2'
                }
              />
              <Text style={styles.threadMetaText}>
                Encrypted social thread • Contact ID:{' '}
                {selectedConversation?.replyRecipientId || selectedConversation?.externalConversationId || 'Live'}
              </Text>
            </View>

            {messagesLoading && messages.length === 0 ? (
              <View style={{ paddingVertical: 30, alignItems: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color="#e1306c" />
                <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>
                  Loading message history...
                </Text>
              </View>
            ) : messages.length === 0 ? (
              /* Fallback initial message if thread messages array is empty */
              <View style={styles.sampleChatBubbleWrap}>
                <View
                  style={[
                    styles.inboundBubble,
                    { backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0' },
                  ]}
                >
                  <Text style={[styles.bubbleText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                    {selectedConversation?.text || 'Hello! Wanted to connect with you regarding your social post.'}
                  </Text>
                  <Text style={styles.bubbleTime}>
                    {formatMessageTime(selectedConversation?.createdAt)}
                  </Text>
                </View>
              </View>
            ) : (
              messages.map((msg, index) => {
                const isOutbound = msg.isSelf || msg.status === 'sent';
                return (
                  <View
                    key={msg.id || `msg_${index}`}
                    style={[
                      styles.bubbleWrap,
                      isOutbound ? styles.outboundWrap : styles.inboundWrap,
                    ]}
                  >
                    <View
                      style={[
                        styles.chatBubble,
                        isOutbound
                          ? styles.outboundBubble
                          : [
                              styles.inboundBubble,
                              {
                                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                borderColor: isDark ? '#334155' : '#e2e8f0',
                              },
                            ],
                      ]}
                    >
                      <Text
                        style={[
                          styles.bubbleText,
                          { color: isOutbound ? '#ffffff' : isDark ? '#f8fafc' : '#0f172a' },
                        ]}
                      >
                        {msg.text || (isOutbound ? 'Outbound reply' : 'Inbound message')}
                      </Text>
                      <View style={styles.bubbleFooterRow}>
                        <Text
                          style={[
                            styles.bubbleTime,
                            { color: isOutbound ? 'rgba(255, 255, 255, 0.75)' : '#94a3b8' },
                          ]}
                        >
                          {formatMessageTime(msg.createdAt)}
                        </Text>
                        {isOutbound && (
                          <Ionicons name="checkmark-done" size={12} color="rgba(255, 255, 255, 0.85)" />
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Quick Suggestions Chips */}
          <View style={styles.quickRepliesWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRepliesScroll}>
              {QUICK_REPLIES.map((reply, i) => (
                <Pressable
                  key={i}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setReplyText(reply);
                  }}
                  style={[
                    styles.quickReplyChip,
                    {
                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                    },
                  ]}
                >
                  <Text style={[styles.quickReplyText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                    {reply}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Reply Bar */}
          <View
            style={[
              styles.replyBar,
              {
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                borderTopColor: isDark ? '#1e293b' : '#e2e8f0',
              },
            ]}
          >
            <TextInput
              style={[
                styles.replyInput,
                {
                  backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  borderColor: isDark ? '#334155' : '#cbd5e1',
                },
              ]}
              placeholder={`Reply to ${selectedConversation?.authorHandle || 'contact'}...`}
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              value={replyText}
              onChangeText={setReplyText}
              multiline
              maxLength={1000}
            />

            <Pressable
              onPress={handleSendReply}
              disabled={sendReplyMutation.isPending || !replyText.trim()}
              style={[
                styles.sendBtn,
                {
                  opacity: !replyText.trim() || sendReplyMutation.isPending ? 0.5 : 1,
                  backgroundColor: '#e1306c',
                },
              ]}
            >
              {sendReplyMutation.isPending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="send" size={16} color="#ffffff" />
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  headerCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  tabHeading: {
    fontSize: 18,
    fontWeight: '800',
  },
  tabSubheading: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(225, 48, 108, 0.1)',
  },
  channelsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e1306c',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statPill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  channelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  channelChipActive: {},
  channelChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchContainer: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  searchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  statusChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusChipText: {
    fontSize: 11,
  },
  loadingCenter: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  clearSearchBtn: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(225, 48, 108, 0.1)',
  },
  clearSearchBtnText: {
    fontSize: 12,
    color: '#e1306c',
    fontWeight: '700',
  },
  conversationsList: {
    gap: 10,
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '800',
  },
  platformBadgeWrap: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  convDetailsCol: {
    flex: 1,
    gap: 2,
  },
  convHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactName: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  convTimeText: {
    fontSize: 11,
    color: '#94a3b8',
    marginLeft: 6,
  },
  convHandleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 3,
  },
  convHandleText: {
    fontSize: 11,
    color: '#e1306c',
    fontWeight: '700',
  },
  convAccountTag: {
    fontSize: 11,
    color: '#94a3b8',
    marginLeft: 4,
  },
  previewText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  convMetaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f43f5e',
  },
  unreadPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f43f5e',
  },
  repliedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  repliedPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16a34a',
  },
  openPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
  },
  openPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  starredPill: {
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(234, 179, 8, 0.14)',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  modalAvatarBox: {},
  modalAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
  },
  modalHeaderBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBannerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(244, 63, 94, 0.2)',
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#f43f5e',
    fontWeight: '600',
    lineHeight: 16,
  },
  messagesContainer: {
    padding: 16,
    gap: 12,
  },
  threadMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    marginBottom: 8,
  },
  threadMetaText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  sampleChatBubbleWrap: {
    marginVertical: 6,
  },
  bubbleWrap: {
    marginVertical: 4,
  },
  inboundWrap: {
    alignItems: 'flex-start',
  },
  outboundWrap: {
    alignItems: 'flex-end',
  },
  chatBubble: {
    maxWidth: '82%',
    padding: 12,
    borderRadius: 16,
  },
  inboundBubble: {
    borderTopLeftRadius: 4,
    borderWidth: 1,
  },
  outboundBubble: {
    backgroundColor: '#e1306c',
    borderTopRightRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  bubbleTime: {
    fontSize: 10,
  },
  quickRepliesWrap: {
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148, 163, 184, 0.15)',
  },
  quickRepliesScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  quickReplyChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  quickReplyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  replyInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderWidth: 1,
    maxHeight: 90,
    fontSize: 14,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
