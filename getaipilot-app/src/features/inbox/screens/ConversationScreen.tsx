import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  Alert,
  Linking,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/store/authStore';
import { crmApi } from '../../crm/api/crm.api';
import { inboxApi } from '../api/inboxApi';
import { MessageBubble } from '../components';
import { useInboxWebSocket } from '../hooks/useInboxWebSocket';
import { NormalizedConversation, NormalizedMessage, TeamMember } from '../types';
import { ConversationSkeleton } from '../../../components/skeletonScreen';
import { useTheme, getColors } from '@/theme';

const CUSTOMER_SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 Hours Meta Window

const INSTA_QUICK_REPLIES = [
  'Thanks for reaching out! We are glad to help.',
  'Here is the link to get started!',
  'Can I help you with anything else?',
  'How can I open my account with your referral?',
  'Our team is available 9 AM – 6 PM.',
];

interface ConversationScreenProps {
  conversation?: NormalizedConversation;
  conversationId?: string;
  onBack?: () => void;
}

export const ConversationScreen: React.FC<ConversationScreenProps> = ({
  conversation: initialConversation,
  conversationId,
  onBack,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/inbox' as any);
    }
  };

  // iOS Edge Swipe to Go Back Gesture
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          // Trigger when gesture starts from left edge (x < 45) and moves right
          return gestureState.x0 < 45 && gestureState.dx > 15 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx > 60 || (gestureState.dx > 30 && gestureState.vx > 0.4)) {
            handleBack();
          }
        },
      }),
    [handleBack]
  );

  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState<string>('');
  const [isInternalNote, setIsInternalNote] = useState<boolean>(false);
  const [showAgentModal, setShowAgentModal] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [showContactDrawer, setShowContactDrawer] = useState<boolean>(false);
  const [isBotPaused, setIsBotPaused] = useState<boolean>(initialConversation?.bot_paused || false);
  const [assignedAgentName, setAssignedAgentName] = useState<string>(
    initialConversation?.assigned_agent_name
      || (initialConversation?.assigned_to ? 'Assigned' : 'Unassigned')
  );

  const flatListRef = useRef<FlatList>(null);
  const user = useAuthStore((s) => s.user);

  const activeId = initialConversation?.id || conversationId || '';

  const handleCopyChat = async () => {
    if (messages.length === 0) {
      Alert.alert('Empty Chat', 'No messages to copy yet.');
      return;
    }
    const chatText = messages
      .map(
        (m) =>
          `[${new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] ${
            m.direction === 'inbound' ? conversation?.contact?.name || 'User' : 'Agent/Bot'
          }: ${m.content}`
      )
      .join('\n');
    await Clipboard.setStringAsync(chatText);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert('Chat Copied', 'Full conversation history copied to clipboard.');
  };

  const handleResetChat = () => {
    Alert.alert(
      'Reset Chat',
      'Are you sure you want to clear/reset this conversation view?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            queryClient.setQueryData(['conversation_details', activeId], (old: any) => ({
              ...old,
              messages: [],
            }));
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
          },
        },
      ]
    );
  };

  const handleSelectQuickReply = (text: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setInputText(text);
  };

  // Realtime WebSocket Subscription
  useInboxWebSocket(activeId);

  // Fetch conversation details & message history
  const { data, isLoading } = useQuery({
    queryKey: ['conversation_details', activeId],
    queryFn: () => inboxApi.getConversationDetails(activeId, initialConversation?.channel),
    staleTime: 15000,
    refetchInterval: 30000,
    enabled: !!activeId,
  });

  // Fetch team members for agent assignment
  const { data: teamMembers } = useQuery({
    queryKey: ['team_members'],
    queryFn: () => inboxApi.getTeamMembers(),
    staleTime: 60000,
  });

  const conversation = initialConversation || data?.conversation;
  const messages: NormalizedMessage[] = useMemo(() => {
    if (data?.messages && data.messages.length > 0) {
      return data.messages;
    }
    // Fallback for social/Instagram threads where thread detail only has initial incoming message
    if (conversation?.channel === 'instagram' && conversation?.last_message?.content) {
      return [
        {
          id: `initial_${conversation.id}`,
          conversation_id: conversation.id,
          channel: 'instagram',
          direction: conversation.last_message.direction || 'inbound',
          content: conversation.last_message.content,
          media: [],
          sender: {
            name: conversation.contact?.name || 'Contact',
            type: conversation.last_message.direction === 'outbound' ? 'agent' : 'contact',
          },
          status: 'delivered',
          created_at: conversation.last_message.created_at || new Date().toISOString(),
        },
      ];
    }
    return [];
  }, [data?.messages, conversation]);

  // Update local states if conversation updates
  useEffect(() => {
    if (conversation?.bot_paused !== undefined) {
      setIsBotPaused(conversation.bot_paused);
    }
    if (conversation?.assigned_agent_name) {
      setAssignedAgentName(conversation.assigned_agent_name);
    }
  }, [conversation]);

  // Mark conversation as read on open
  useEffect(() => {
    if (activeId) {
      queryClient.setQueriesData<NormalizedConversation[]>({ queryKey: ['conversations'] }, (old) => {
        if (!old) return old;
        return old.map((c) => (c.id === activeId ? { ...c, unread_count: 0 } : c));
      });
      inboxApi.markAsRead(activeId);
    }
  }, [activeId, queryClient]);

  // -------------------------------------------------------------
  // 1. Meta 24-Hour Customer Service Window Calculation
  // -------------------------------------------------------------
  const latestCustomerMessageAt = useMemo(() => {
    if (messages.length === 0) return null;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].direction === 'inbound') {
        const parsed = new Date(messages[i].created_at).getTime();
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    }
    return null;
  }, [messages]);

  const channel = conversation?.channel || 'whatsapp';
  const isInstagram = channel === 'instagram';
  const isTelegram = channel === 'telegram';
  const isWhatsApp = !isInstagram && !isTelegram;
  const [timeRemainingStr, setTimeRemainingStr] = useState<string>('');
  const [isWindowExpired, setIsWindowExpired] = useState<boolean>(false);

  useEffect(() => {
    const checkWindow = () => {
      if (!isWhatsApp) {
        setIsWindowExpired(false);
        setTimeRemainingStr('Always Open');
        return;
      }

      if (!latestCustomerMessageAt) {
        setIsWindowExpired(true);
        setTimeRemainingStr('Closed');
        return;
      }

      const elapsed = Date.now() - latestCustomerMessageAt;
      const diff = CUSTOMER_SERVICE_WINDOW_MS - elapsed;

      if (diff <= 0) {
        setIsWindowExpired(true);
        setTimeRemainingStr('Closed');
      } else {
        setIsWindowExpired(false);
        const totalMinutes = Math.floor(diff / (60 * 1000));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        setTimeRemainingStr(`${hours}h ${minutes}m left`);
      }
    };

    checkWindow();
    const interval = setInterval(checkWindow, 30000);
    return () => clearInterval(interval);
  }, [latestCustomerMessageAt, isWhatsApp]);

  // -------------------------------------------------------------
  // 2. Sending Messages / Notes
  // -------------------------------------------------------------
  const sendMutation = useMutation({
    mutationFn: (payload: { text: string; isNote?: boolean; template?: any }) => {
      if (!conversation) throw new Error('No active conversation');
      return inboxApi.sendMessage({
        conversation_id: conversation.id,
        channel: conversation.channel,
        message: payload.text,
        is_internal_note: payload.isNote,
        template: payload.template,
      });
    },
    onMutate: async (payload) => {
      const text = payload.text;
      setInputText('');
      const optimisticMsg: NormalizedMessage = {
        id: `optimistic_${Date.now()}`,
        conversation_id: conversation?.id || '',
        channel: conversation?.channel || 'whatsapp',
        direction: 'outbound',
        content: text,
        media: [],
        sender: {
          name: payload.isNote ? 'Agent Note' : 'You',
          type: 'agent',
        },
        is_internal_note: payload.isNote,
        is_bot_reply: false,
        status: 'sent',
        created_at: new Date().toISOString(),
      };

      const updateCache = (key: string) => {
        queryClient.setQueryData(['conversation_details', key], (old: any) => {
          if (!old) return { conversation: conversation || null, messages: [optimisticMsg] };
          return {
            ...old,
            messages: [...(old.messages || []), optimisticMsg],
          };
        });
      };

      if (conversation) updateCache(conversation.id);
      if (activeId && (!conversation || activeId !== conversation.id)) updateCache(activeId);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);

      return { optimisticMsg };
    },
    onSuccess: (newMessage, _variables, context) => {
      const updateCache = (key: string) => {
        queryClient.setQueryData(['conversation_details', key], (old: any) => {
          if (!old) return { conversation: conversation || null, messages: [newMessage] };
          const filtered = (old.messages || []).filter(
            (m: any) => m.id !== context?.optimisticMsg?.id && m.id !== newMessage.id
          );
          return {
            ...old,
            messages: [...filtered, newMessage],
          };
        });
      };

      if (conversation) updateCache(conversation.id);
      if (activeId && (!conversation || activeId !== conversation.id)) updateCache(activeId);
      if (newMessage.conversation_id && (!conversation || newMessage.conversation_id !== conversation.id)) {
        updateCache(newMessage.conversation_id);
      }

      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation_details', activeId] });
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    onError: (err: any, _variables, context) => {
      const updateCache = (key: string) => {
        queryClient.setQueryData(['conversation_details', key], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            messages: (old.messages || []).map((m: any) =>
              m.id === context?.optimisticMsg?.id ? { ...m, status: 'failed' } : m
            ),
          };
        });
      };

      if (conversation) updateCache(conversation.id);
      if (activeId && (!conversation || activeId !== conversation.id)) updateCache(activeId);
      Alert.alert('Send Failed', err?.message || 'Failed to dispatch message');
    },
  });

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || sendMutation.isPending) return;

    if (isWhatsApp && isWindowExpired && !isInternalNote) {
      Alert.alert(
        '24-Hour Window Closed',
        'Meta WhatsApp blocks outbound free-form messages 24 hours after customer\'s last message. Switch to Internal Note to record private notes, or send an approved Template.',
        [
          { text: 'Switch to Note', onPress: () => setIsInternalNote(true) },
          { text: 'Policy Details', onPress: () => setShowGuideModal(true) },
          { text: 'OK', style: 'cancel' },
        ]
      );
      return;
    }

    sendMutation.mutate({ text: trimmed, isNote: isInternalNote });
  };

  // -------------------------------------------------------------
  // 3. Bot Toggle & Agent Handoff Controls
  // -------------------------------------------------------------
  const toggleBot = async () => {
    if (!conversation) return;
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    const nextState = !isBotPaused;
    setIsBotPaused(nextState);
    try {
      await inboxApi.toggleBot(conversation.id, !nextState);
    } catch {
      setIsBotPaused(!nextState);
    }
  };

  const handleAssignAgent = async (agent: TeamMember | null) => {
    if (!conversation) return;
    const agentId = agent ? agent.user_id : null;
    const agentName = agent ? agent.name : 'Unassigned';

    setAssignedAgentName(agentName);
    setShowAgentModal(false);

    try {
      await inboxApi.assignAgent(conversation.id, agentId, agentName);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch (err: any) {
      Alert.alert('Assignment Error', err?.message || 'Failed to assign agent');
    }
  };

  const handleAssignToMe = () => {
    const currentUserId = user?.id || '';
    const currentName = user?.name || user?.email?.split('@')[0] || 'Agent';
    const meMember: TeamMember = {
      id: currentUserId,
      organization_id: conversation?.organization_id || '',
      user_id: currentUserId,
      role: 'agent',
      name: currentName,
      email: user?.email || '',
      is_active: true,
    };
    handleAssignAgent(meMember);
  };

  // -------------------------------------------------------------
  // 4. CRM Lead Quick-Create State
  // -------------------------------------------------------------
  const [showCrmModal, setShowCrmModal] = useState<boolean>(false);
  const [leadDealValue, setLeadDealValue] = useState<string>('25000');
  const [leadCreatedSuccess, setLeadCreatedSuccess] = useState<boolean>(false);

  const createLeadFromContactMutation = useMutation({
    mutationFn: async () => {
      if (!conversation) throw new Error('No active conversation');
      const isEmail = conversation.contact.handle_or_phone.includes('@');
      return await crmApi.createLead({
        name: conversation.contact.name,
        phone: isEmail ? undefined : conversation.contact.handle_or_phone,
        email: isEmail ? conversation.contact.handle_or_phone : undefined,
        value: parseFloat(leadDealValue) || 25000,
        source: 'WHATSAPP',
        status: 'open',
      });
    },
    onSuccess: () => {
      setLeadCreatedSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['crm_leads'] });
      queryClient.invalidateQueries({ queryKey: ['crm_pipelines'] });
      setTimeout(() => {
        setShowCrmModal(false);
        setLeadCreatedSuccess(false);
      }, 1500);
    },
  });

  const headerTopPadding = Math.max(insets.top, Platform.OS === 'ios' ? 44 : 12);
  const composerBottomPadding = Math.max(insets.bottom, 10);

  const chatBackground = useMemo(() => {
    if (isInstagram || isTelegram) {
      return isDark ? '#000000' : '#FFFFFF';
    }
    return isDark ? '#0B141A' : '#EFEAE2';
  }, [isInstagram, isTelegram, isDark]);

  const inputRowCustomStyle = useMemo(() => {
    if (isInternalNote) {
      return isDark ? styles.inputRowNoteDark : styles.inputRowNoteLight;
    }
    if (isInstagram) {
      return {
        backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
        borderColor: isDark ? '#374151' : '#E5E7EB',
        borderRadius: 24,
      };
    }
    if (isTelegram) {
      return {
        backgroundColor: isDark ? '#1F2937' : '#F1F5F9',
        borderColor: isDark ? '#374151' : '#E2E8F0',
        borderRadius: 24,
      };
    }
    return isDark ? styles.inputRowDark : styles.inputRowLight;
  }, [isInternalNote, isInstagram, isTelegram, isDark]);

  const sendBtnBgColor = useMemo(() => {
    if (!inputText.trim()) {
      return isDark ? '#3A3A3C' : '#C7C7CC';
    }
    if (isInternalNote) return '#FF9500';
    if (isInstagram) return '#EC4899';
    if (isTelegram) return '#0284C7';
    return '#00a884';
  }, [inputText, isInternalNote, isInstagram, isTelegram, isDark]);

  const sendBtnIcon = useMemo(() => {
    if (isInternalNote) return 'bookmark';
    if (isTelegram) return 'paper-plane';
    if (isInstagram) return 'send';
    return 'arrow-up';
  }, [isInternalNote, isTelegram, isInstagram]);

  if (isLoading && !conversation) {
    return <ConversationSkeleton />;
  }

  if (!conversation) {
    return (
      <View style={[styles.root, { backgroundColor: isDark ? '#000000' : '#F0EEF8', paddingTop: headerTopPadding }]}>
        <View style={styles.centerContainer}>
          <Text style={[styles.notFoundTitle, { color: isDark ? '#F0EEF8' : '#000000' }]}>
            Conversation not found
          </Text>
          <Pressable style={styles.backPill} onPress={handleBack}>
            <Text style={styles.backPillText}>← Return to Inbox</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: isDark
            ? '#000000'
            : isInstagram || isTelegram
            ? '#FFFFFF'
            : '#F0EEF8',
        },
      ]}
      {...panResponder.panHandlers}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* iOS Redesigned Modern Header */}
        <View
          style={[
            styles.header,
            isDark ? styles.headerDark : styles.headerLight,
            { paddingTop: headerTopPadding },
          ]}
        >
          {/* Top Row: Back Button + Contact Info + Channel Action Buttons */}
          <View style={styles.headerTopRow}>
            <Pressable cssInterop={false}
              style={({ pressed }) => [
                styles.backBtn,
                pressed && (isDark ? styles.btnPressedDark : styles.btnPressedLight),
              ]}
              onPress={handleBack}
              hitSlop={{ top: 12, bottom: 12, left: 16, right: 12 }}
            >
              <Ionicons
                name="chevron-back"
                size={26}
                color={isDark ? '#0A84FF' : '#007AFF'}
              />
            </Pressable>

            {/* Avatar & Contact Info Clickable to Drawer */}
            <Pressable
              style={styles.headerContactPressable}
              onPress={() => setShowContactDrawer(true)}
            >
              <View
                style={[
                  styles.headerAvatar,
                  isInstagram && { backgroundColor: '#E1306C' },
                  isTelegram && { backgroundColor: '#0284C7' },
                ]}
              >
                <Text style={styles.headerAvatarText}>
                  {conversation?.contact?.name
                    ? conversation.contact.name.charAt(0).toUpperCase()
                    : conversation?.channel === 'telegram'
                    ? 'T'
                    : conversation?.channel === 'instagram'
                    ? 'I'
                    : 'W'}
                </Text>
              </View>

              <View style={styles.headerCenter}>
                <View style={styles.contactNameRow}>
                  <Text
                    style={[styles.contactName, { color: isDark ? '#FFFFFF' : '#000000' }]}
                    numberOfLines={1}
                  >
                    {conversation?.contact?.name ||
                      (conversation?.channel === 'telegram'
                        ? 'Telegram User'
                        : conversation?.channel === 'instagram'
                        ? 'InstaPilot User'
                        : 'WhatsApp Contact')}
                  </Text>
                  {isWhatsApp && <Ionicons name="shield-checkmark" size={13} color="#34C759" />}
                </View>
                <Text
                  style={[styles.contactHandle, { color: isDark ? '#8E8E93' : '#687076' }]}
                  numberOfLines={1}
                >
                  {isTelegram
                    ? `User ID: ${conversation?.contact?.handle_or_phone || '2093321330'}`
                    : isInstagram
                    ? `${conversation?.contact?.handle_or_phone?.startsWith('@') ? conversation.contact.handle_or_phone : `@${conversation?.contact?.handle_or_phone || 'user'}`} • via getaipilot`
                    : conversation?.contact?.handle_or_phone?.startsWith('@')
                    ? conversation.contact.handle_or_phone
                    : `+${conversation?.contact?.handle_or_phone || ''}`}
                </Text>
              </View>
            </Pressable>

            {/* Channel Right Actions */}
            {isTelegram ? (
              <View style={styles.headerRightActions}>
                <Pressable
                  style={[styles.headerActionPill, isDark ? styles.headerActionPillDark : styles.headerActionPillLight]}
                  onPress={handleCopyChat}
                >
                  <Ionicons name="copy-outline" size={13} color={isDark ? '#CBD5E1' : '#475569'} style={{ marginRight: 4 }} />
                  <Text style={[styles.headerActionPillText, { color: isDark ? '#E2E8F0' : '#334155' }]}>Copy Chat</Text>
                </Pressable>
                <Pressable
                  style={[styles.headerActionPillDanger, isDark ? styles.headerActionPillDangerDark : styles.headerActionPillDangerLight]}
                  onPress={handleResetChat}
                >
                  <Ionicons name="trash-outline" size={13} color="#EF4444" style={{ marginRight: 4 }} />
                  <Text style={styles.headerActionPillDangerText}>Reset Chat</Text>
                </Pressable>
              </View>
            ) : isInstagram ? (
              <View style={styles.headerRightActions}>
                <Pressable cssInterop={false}
                  style={({ pressed }) => [
                    styles.crmBtn,
                    pressed && { opacity: 0.75 },
                  ]}
                  onPress={() => setShowCrmModal(true)}
                >
                  <Ionicons name="briefcase-outline" size={12} color="#FFFFFF" style={{ marginRight: 3 }} />
                  <Text style={styles.crmBtnText}>+ CRM</Text>
                </Pressable>
                <Pressable
                  style={[styles.closeRoundBtn, isDark ? styles.closeRoundBtnDark : styles.closeRoundBtnLight]}
                  onPress={handleBack}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={18} color={isDark ? '#E2E8F0' : '#475569'} />
                </Pressable>
              </View>
            ) : (
              <View style={styles.headerRightActions}>
                <Pressable cssInterop={false}
                  style={({ pressed }) => [
                    styles.crmBtn,
                    pressed && { opacity: 0.75 },
                  ]}
                  onPress={() => setShowCrmModal(true)}
                >
                  <Ionicons name="briefcase-outline" size={12} color="#FFFFFF" style={{ marginRight: 3 }} />
                  <Text style={styles.crmBtnText}>+ CRM</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Sub-Header Horizontal Status Capsules */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.headerSubBar}
          >
            {/* 24-Hour Meta Window Badge or Channel Autopilot Badge */}
            {isWhatsApp ? (
              <Pressable
                style={[
                  styles.subBadge,
                  isWindowExpired ? styles.subBadgeExpired : styles.subBadgeOpen,
                ]}
                onPress={() => setShowGuideModal(true)}
              >
                <Ionicons
                  name={isWindowExpired ? 'alert-circle' : 'time-outline'}
                  size={12}
                  color={isWindowExpired ? '#FF3B30' : '#34C759'}
                />
                <Text
                  style={[
                    styles.subBadgeText,
                    { color: isWindowExpired ? (isDark ? '#FF6961' : '#D70015') : (isDark ? '#32D74B' : '#248A3D') },
                  ]}
                >
                  {isWindowExpired ? '24h Window Closed' : timeRemainingStr}
                </Text>
                <Ionicons
                  name="information-circle-outline"
                  size={11}
                  color={isWindowExpired ? (isDark ? '#FF6961' : '#D70015') : (isDark ? '#32D74B' : '#248A3D')}
                />
              </Pressable>
            ) : (
              <View
                style={[
                  styles.subBadge,
                  {
                    backgroundColor:
                      conversation?.channel === 'telegram'
                        ? 'rgba(14, 165, 233, 0.12)'
                        : 'rgba(236, 72, 153, 0.12)',
                    borderColor: 'transparent',
                  },
                ]}
              >
                <Ionicons
                  name={conversation?.channel === 'telegram' ? 'paper-plane' : 'logo-instagram'}
                  size={12}
                  color={conversation?.channel === 'telegram' ? '#0284c7' : '#db2777'}
                />
                <Text
                  style={[
                    styles.subBadgeText,
                    {
                      color: conversation?.channel === 'telegram' ? '#0284c7' : '#db2777',
                      fontWeight: '600',
                    },
                  ]}
                >
                  {conversation?.channel === 'telegram' ? 'Telegram Autopilot' : 'InstaPilot Direct'}
                </Text>
              </View>
            )}

            {/* Bot Active / Paused Switch */}
            <Pressable
              style={[
                styles.subBadge,
                isBotPaused ? styles.subBadgePaused : styles.subBadgeBotActive,
              ]}
              onPress={toggleBot}
            >
              <Ionicons
                name={isBotPaused ? 'pause-circle-outline' : 'sparkles'}
                size={12}
                color={isBotPaused ? '#FF9500' : '#0A84FF'}
              />
              <Text
                style={[
                  styles.subBadgeText,
                  { color: isBotPaused ? (isDark ? '#FFB340' : '#C97A00') : (isDark ? '#64D2FF' : '#0071A4') },
                ]}
              >
                {isBotPaused ? 'Bot Paused' : 'Bot Active'}
              </Text>
            </Pressable>

            {/* Assigned Agent Button */}
            <Pressable
              style={[
                styles.subBadge,
                isDark ? styles.subBadgeDark : styles.subBadgeLight,
              ]}
              onPress={() => setShowAgentModal(true)}
            >
              <Ionicons
                name="person-outline"
                size={11}
                color={isDark ? '#8E8E93' : '#687076'}
              />
              <Text
                style={[
                  styles.subBadgeText,
                  { color: isDark ? '#D1D1D6' : '#3C3C43' },
                ]}
                numberOfLines={1}
              >
                {assignedAgentName}
              </Text>
              <Ionicons
                name="chevron-down"
                size={10}
                color={isDark ? '#8E8E93' : '#8E8E93'}
              />
            </Pressable>
          </ScrollView>
        </View>

        {/* Chat Message List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} channel={conversation.channel} />}
          style={{ backgroundColor: chatBackground }}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListHeaderComponent={
            isInstagram ? (
              <View style={styles.instaEncryptedPillWrapper}>
                <View style={[styles.instaEncryptedPill, isDark ? styles.instaEncryptedPillDark : styles.instaEncryptedPillLight]}>
                  <Ionicons name="logo-instagram" size={13} color="#E1306C" style={{ marginRight: 6 }} />
                  <Text style={[styles.instaEncryptedText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Encrypted social thread • Instagram Direct
                  </Text>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? '#252230' : '#E5E5EA' }]}>
                <Ionicons
                  name={
                    isTelegram
                      ? 'paper-plane'
                      : isInstagram
                      ? 'logo-instagram'
                      : 'chatbubbles'
                  }
                  size={32}
                  color={
                    isTelegram
                      ? '#0284c7'
                      : isInstagram
                      ? '#db2777'
                      : isDark
                      ? '#636366'
                      : '#8E8E93'
                  }
                />
              </View>
              <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                No messages in this chat yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: isDark ? '#8E8E93' : '#687076' }]}>
                {isTelegram
                  ? 'Send a message or record an internal note to communicate with this Telegram user.'
                  : isInstagram
                  ? 'Send a DM or record an internal note to communicate with this Instagram user.'
                  : 'Send a message or record an internal note to start communicating with this customer.'}
              </Text>
            </View>
          }
        />

        {/* Streamlined Multi-Channel Composer Bar */}
        <View
          style={[
            styles.composerWrapper,
            isDark ? styles.composerDark : styles.composerLight,
            isInternalNote && (isDark ? styles.composerWrapperNoteDark : styles.composerWrapperNoteLight),
            {
              backgroundColor: isInternalNote
                ? (isDark ? '#2D1B07' : '#FFFDF2')
                : isInstagram
                ? (isDark ? '#000000' : '#FFFFFF')
                : isTelegram
                ? (isDark ? '#17212B' : '#FFFFFF')
                : (isDark ? '#1F2C34' : '#F0F2F5'),
              paddingBottom: composerBottomPadding,
            },
          ]}
        >
          {/* Segmented Mode Selector */}
          <View style={[styles.segmentContainer, isDark ? styles.segmentDark : styles.segmentLight]}>
            <Pressable
              style={[
                styles.segmentTab,
                !isInternalNote && (isDark ? styles.segmentTabActiveDark : styles.segmentTabActiveLight),
              ]}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                setIsInternalNote(false);
              }}
            >
              <Ionicons
                name={
                  isWhatsApp
                    ? isWindowExpired
                      ? 'lock-closed'
                      : 'logo-whatsapp'
                    : conversation?.channel === 'telegram'
                    ? 'paper-plane'
                    : 'logo-instagram'
                }
                size={13}
                color={
                  !isInternalNote
                    ? isWhatsApp
                      ? isWindowExpired
                        ? '#FF9500'
                        : '#34C759'
                      : conversation?.channel === 'telegram'
                      ? '#0284c7'
                      : '#db2777'
                    : isDark
                    ? '#8E8E93'
                    : '#8E8E93'
                }
                style={{ marginRight: 5 }}
              />
              <Text
                style={[
                  styles.segmentTabText,
                  {
                    color: !isInternalNote
                      ? (isDark ? '#FFFFFF' : '#000000')
                      : (isDark ? '#8E8E93' : '#8E8E93'),
                    fontWeight: !isInternalNote ? '600' : '500',
                  },
                ]}
              >
                {isWhatsApp
                  ? isWindowExpired
                    ? 'WhatsApp (Closed)'
                    : 'WhatsApp Reply'
                  : conversation?.channel === 'telegram'
                  ? 'Telegram Reply'
                  : 'InstaPilot Reply'}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.segmentTab,
                isInternalNote && (isDark ? styles.segmentTabActiveNoteDark : styles.segmentTabActiveNoteLight),
              ]}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                setIsInternalNote(true);
              }}
            >
              <Ionicons
                name="bookmark"
                size={13}
                color={isInternalNote ? '#FF9500' : (isDark ? '#8E8E93' : '#8E8E93')}
                style={{ marginRight: 5 }}
              />
              <Text
                style={[
                  styles.segmentTabText,
                  {
                    color: isInternalNote
                      ? (isDark ? '#FFB340' : '#B25E00')
                      : (isDark ? '#8E8E93' : '#8E8E93'),
                    fontWeight: isInternalNote ? '600' : '500',
                  },
                ]}
              >
                Internal Note
              </Text>
            </Pressable>
          </View>

          {/* Interaction Area: Clean iOS Notice Card if 24h Closed, or Active Composer */}
          {isWindowExpired && !isInternalNote ? (
            <View style={[styles.closedCard, isDark ? styles.closedCardDark : styles.closedCardLight]}>
              <View style={styles.closedCardHeader}>
                <View style={styles.closedCardTitleRow}>
                  <Ionicons name="lock-closed" size={14} color="#FF9500" style={{ marginRight: 6 }} />
                  <Text style={[styles.closedCardTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                    24h Messaging Window Closed
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowGuideModal(true)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.closedCardInfoLink, { color: isDark ? '#0A84FF' : '#007AFF' }]}>
                    Policy ℹ️
                  </Text>
                </Pressable>
              </View>

              <Text style={[styles.closedCardDesc, { color: isDark ? '#8E8E93' : '#687076' }]}>
                Freeform replies are locked by Meta. Customer must reply, or send an approved WhatsApp Template.
              </Text>

              <View style={styles.closedCardActions}>
                <Pressable cssInterop={false}
                  style={({ pressed }) => [
                    styles.closedSwitchBtn,
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.selectionAsync();
                    setIsInternalNote(true);
                  }}
                >
                  <Ionicons name="bookmark" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.closedSwitchBtnText}>Write Internal Note</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View>
              {/* Telegram Training Banner */}
              {isTelegram && !isInternalNote && (
                <View style={[styles.telegramTrainingBanner, isDark ? styles.telegramTrainingBannerDark : styles.telegramTrainingBannerLight]}>
                  <Ionicons name="sparkles" size={18} color="#8B5CF6" style={{ marginRight: 8 }} />
                  <Text style={[styles.telegramTrainingText, { color: isDark ? '#CBD5E1' : '#475569' }]}>
                    Refine and train this bot based on this user's queries by editing Knowledge Base or Prompts!
                  </Text>
                  <Pressable
                    style={styles.telegramPromptBtn}
                    onPress={() => {
                      Alert.alert(
                        'Bot Knowledge & Prompts',
                        'Fine-tune system prompts and knowledge base entries based on this user\'s queries in the Telegram Bot Settings.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Open Settings', onPress: () => router.push('/(tabs)/tools' as any) },
                        ]
                      );
                    }}
                  >
                    <Text style={styles.telegramPromptBtnText}>Go to Prompt</Text>
                  </Pressable>
                </View>
              )}

              {/* Instagram Quick Reply Pills */}
              {isInstagram && !isInternalNote && (
                <View style={styles.quickRepliesContainer}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.quickRepliesScroll}
                  >
                    {INSTA_QUICK_REPLIES.map((reply, idx) => (
                      <Pressable
                        key={idx}
                        style={[styles.quickReplyPill, isDark ? styles.quickReplyPillDark : styles.quickReplyPillLight]}
                        onPress={() => handleSelectQuickReply(reply)}
                      >
                        <Text style={[styles.quickReplyText, { color: isDark ? '#E2E8F0' : '#374151' }]} numberOfLines={1}>
                          {reply}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}

              {isInternalNote && (
                <View style={styles.noteIndicatorRow}>
                  <Ionicons name="eye-off-outline" size={12} color={isDark ? '#FFB340' : '#B25E00'} style={{ marginRight: 4 }} />
                  <Text style={[styles.noteIndicatorText, { color: isDark ? '#FFB340' : '#B25E00' }]}>
                    Team Note (Private • Customer won't see this)
                  </Text>
                </View>
              )}

              <View
                style={[
                  styles.inputRow,
                  inputRowCustomStyle,
                ]}
              >
                <TextInput
                  style={[
                    styles.textInput,
                    { color: isDark ? '#FFFFFF' : '#000000' },
                  ]}
                  placeholder={
                    isInternalNote
                      ? 'Write a private note for your team...'
                      : isTelegram
                      ? `Reply to ${conversation.contact.name || 'user'}...`
                      : isInstagram
                      ? `Reply to @${conversation.contact.handle_or_phone?.replace('@', '') || 'user'}...`
                      : 'Type a WhatsApp message...'
                  }
                  placeholderTextColor={isDark ? '#636366' : '#8E8E93'}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                />

                <Pressable cssInterop={false}
                  style={({ pressed }) => [
                    styles.sendBtn,
                    { backgroundColor: sendBtnBgColor },
                    pressed && { opacity: 0.7 },
                  ]}
                  disabled={!inputText.trim() || sendMutation.isPending}
                  onPress={handleSend}
                >
                  {sendMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons
                      name={sendBtnIcon as any}
                      size={18}
                      color="#FFFFFF"
                    />
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* ------------------------------------------------------------- */}
        {/* Agent Assignment Modal */}
        {/* ------------------------------------------------------------- */}
        <Modal
          visible={showAgentModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAgentModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.agentModalBox, isDark ? styles.modalBoxDark : styles.modalBoxLight]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>Assign Agent</Text>
                  <Text style={[styles.modalSub, { color: isDark ? '#8E8E93' : '#687076' }]}>
                    Route this conversation to a team member.
                  </Text>
                </View>
                <Pressable onPress={() => setShowAgentModal(false)} hitSlop={12}>
                  <Ionicons name="close-circle" size={24} color={isDark ? '#636366' : '#C7C7CC'} />
                </Pressable>
              </View>

              {/* Assign to Me Button */}
              <Pressable
                style={[styles.assignOptionBtn, isDark ? styles.assignOptionDark : styles.assignOptionLight]}
                onPress={handleAssignToMe}
              >
                <View style={styles.agentAvatarPill}>
                  <Ionicons name="person" size={16} color="#0A84FF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.assignOptionText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                    Assign to Me
                  </Text>
                  <Text style={[styles.assignOptionSub, { color: isDark ? '#8E8E93' : '#687076' }]}>
                    {user?.email || 'Logged in user'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={isDark ? '#636366' : '#C7C7CC'} />
              </Pressable>

              {/* Unassign Button */}
              <Pressable
                style={[styles.assignOptionBtn, isDark ? styles.assignOptionDark : styles.assignOptionLight]}
                onPress={() => handleAssignAgent(null)}
              >
                <View style={[styles.agentAvatarPill, { backgroundColor: isDark ? '#3A3549' : '#E5E5EA' }]}>
                  <Ionicons name="close-circle-outline" size={16} color={isDark ? '#8E8E93' : '#687076'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.assignOptionText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                    Mark as Unassigned
                  </Text>
                  <Text style={[styles.assignOptionSub, { color: isDark ? '#8E8E93' : '#687076' }]}>
                    Open to any agent in inbox queue
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={isDark ? '#636366' : '#C7C7CC'} />
              </Pressable>

              {/* Organization Team Members List */}
              <Text style={[styles.sectionHeaderLabel, { color: isDark ? '#8E8E93' : '#687076' }]}>
                Team Members
              </Text>
              <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                {(teamMembers || []).map((member) => (
                  <Pressable
                    key={member.id}
                    style={[styles.memberRow, isDark ? styles.memberRowDark : styles.memberRowLight]}
                    onPress={() => handleAssignAgent(member)}
                  >
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>
                        {member.name ? member.name.charAt(0).toUpperCase() : 'A'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.memberName, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        {member.name}
                      </Text>
                      <Text style={[styles.memberEmail, { color: isDark ? '#8E8E93' : '#687076' }]}>
                        {member.email}
                      </Text>
                    </View>
                    <View style={[styles.memberRoleTag, isDark ? styles.roleTagDark : styles.roleTagLight]}>
                      <Text style={[styles.memberRoleText, { color: isDark ? '#8E8E93' : '#687076' }]}>
                        {member.role}
                      </Text>
                    </View>
                    {assignedAgentName === member.name && (
                      <Ionicons name="checkmark-circle" size={18} color="#34C759" style={{ marginLeft: 6 }} />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ------------------------------------------------------------- */}
        {/* Meta 24-Hour Customer Window Policy Modal */}
        {/* ------------------------------------------------------------- */}
        <Modal
          visible={showGuideModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowGuideModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.guideModalBox, isDark ? styles.modalBoxDark : styles.modalBoxLight]}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="shield-checkmark" size={22} color="#34C759" />
                  <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                    Meta 24-Hour Rule
                  </Text>
                </View>
                <Pressable onPress={() => setShowGuideModal(false)} hitSlop={12}>
                  <Ionicons name="close-circle" size={24} color={isDark ? '#636366' : '#C7C7CC'} />
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
                <View style={[styles.guideCard, isDark ? styles.guideCardDark : styles.guideCardLight]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Ionicons name="time-outline" size={16} color="#34C759" />
                    <Text style={styles.guideCardTitle}>How the 24h Window Works</Text>
                  </View>
                  <Text style={[styles.guideCardBody, { color: isDark ? '#8E8E93' : '#3C3C43' }]}>
                    Meta WhatsApp allows businesses to send freeform messages to customers only within 24 hours of their last incoming message.
                  </Text>
                </View>

                <View style={[styles.guideCard, isDark ? styles.guideCardDark : styles.guideCardLight]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Ionicons name="lock-closed-outline" size={16} color="#F59E0B" />
                    <Text style={styles.guideCardTitle}>When the Window Closes</Text>
                  </View>
                  <Text style={[styles.guideCardBody, { color: isDark ? '#8E8E93' : '#3C3C43' }]}>
                    After 24 hours with no customer reply, free-form text is locked by Meta. You must send an approved template to restart the conversation.
                  </Text>
                </View>

                <View style={[styles.guideCard, isDark ? styles.guideCardDark : styles.guideCardLight]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Ionicons name="bulb-outline" size={16} color="#3B82F6" />
                    <Text style={styles.guideCardTitle}>Internal Team Notes</Text>
                  </View>
                  <Text style={[styles.guideCardBody, { color: isDark ? '#8E8E93' : '#3C3C43' }]}>
                    Team notes can be added anytime. They are 100% private to your organization and never sent to WhatsApp.
                  </Text>
                </View>
              </ScrollView>

              <Pressable
                style={styles.guideGotItBtn}
                onPress={() => setShowGuideModal(false)}
              >
                <Text style={styles.guideGotItText}>Got it</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* ------------------------------------------------------------- */}
        {/* Contact Profile & Quick Details Drawer */}
        {/* ------------------------------------------------------------- */}
        <Modal
          visible={showContactDrawer}
          transparent
          animationType="slide"
          onRequestClose={() => setShowContactDrawer(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.contactDrawerBox, isDark ? styles.modalBoxDark : styles.modalBoxLight]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>Contact Details</Text>
                <Pressable onPress={() => setShowContactDrawer(false)} hitSlop={12}>
                  <Ionicons name="close-circle" size={24} color={isDark ? '#636366' : '#C7C7CC'} />
                </Pressable>
              </View>

              <View style={[styles.drawerAvatarContainer, isDark ? styles.borderDark : styles.borderLight]}>
                <View style={styles.drawerAvatar}>
                  <Text style={styles.drawerAvatarText}>
                    {conversation?.contact?.name ? conversation.contact.name.charAt(0).toUpperCase() : 'C'}
                  </Text>
                </View>
                <Text style={[styles.drawerName, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  {conversation?.contact?.name}
                </Text>
                <Text style={[styles.drawerPhone, { color: isDark ? '#8E8E93' : '#687076' }]}>
                  +{conversation?.contact?.handle_or_phone}
                </Text>
              </View>

              <View style={styles.drawerSection}>
                <Text style={[styles.drawerSectionLabel, { color: isDark ? '#8E8E93' : '#687076' }]}>
                  Status Overview
                </Text>
                <View style={styles.drawerRow}>
                  <Text style={[styles.drawerRowKey, { color: isDark ? '#8E8E93' : '#687076' }]}>
                    Messaging Window
                  </Text>
                  <Text
                    style={[
                      styles.drawerRowVal,
                      { color: isWindowExpired ? '#FF3B30' : '#34C759' },
                    ]}
                  >
                    {isWindowExpired ? 'Closed (>24h)' : `Open (${timeRemainingStr})`}
                  </Text>
                </View>
                <View style={styles.drawerRow}>
                  <Text style={[styles.drawerRowKey, { color: isDark ? '#8E8E93' : '#687076' }]}>
                    Assigned Agent
                  </Text>
                  <Text style={[styles.drawerRowVal, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                    {assignedAgentName}
                  </Text>
                </View>
                <View style={styles.drawerRow}>
                  <Text style={[styles.drawerRowKey, { color: isDark ? '#8E8E93' : '#687076' }]}>
                    AI Bot Auto-Reply
                  </Text>
                  <Text style={[styles.drawerRowVal, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                    {isBotPaused ? 'Paused' : 'Active'}
                  </Text>
                </View>
              </View>

              <View style={styles.drawerActionButtons}>
                <Pressable
                  style={styles.drawerPrimaryBtn}
                  onPress={() => {
                    setShowContactDrawer(false);
                    setShowCrmModal(true);
                  }}
                >
                  <Ionicons name="briefcase-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.drawerPrimaryBtnText}>Create CRM Lead</Text>
                </Pressable>

                <Pressable
                  style={[styles.drawerSecondaryBtn, isDark ? styles.drawerSecondaryBtnDark : styles.drawerSecondaryBtnLight]}
                  onPress={() => {
                    const phone = (conversation?.contact?.handle_or_phone || '').replace(/\D+/g, '');
                    if (phone) Linking.openURL(`tel:+${phone}`).catch(() => {});
                  }}
                >
                  <Ionicons name="call-outline" size={16} color="#0A84FF" style={{ marginRight: 6 }} />
                  <Text style={styles.drawerSecondaryBtnText}>Call Phone</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* ------------------------------------------------------------- */}
        {/* CRM Lead Conversion Modal */}
        {/* ------------------------------------------------------------- */}
        <Modal
          visible={showCrmModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCrmModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.crmModalBox, isDark ? styles.modalBoxDark : styles.modalBoxLight]}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                Convert Contact to Lead
              </Text>
              <Text style={[styles.modalSub, { color: isDark ? '#8E8E93' : '#687076' }]}>
                Create an instant sales opportunity in CRM pipeline.
              </Text>

              {leadCreatedSuccess ? (
                <View style={styles.successBox}>
                  <Ionicons name="checkmark-circle" size={40} color="#34C759" />
                  <Text style={styles.successText}>Lead Created Successfully!</Text>
                </View>
              ) : (
                <View style={styles.formGroup}>
                  <Text style={[styles.inputLabel, { color: isDark ? '#8E8E93' : '#687076' }]}>
                    Contact Name
                  </Text>
                  <View style={[styles.readOnlyInput, isDark ? styles.inputDark : styles.inputLight]}>
                    <Text style={[styles.readOnlyText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                      {conversation?.contact?.name}
                    </Text>
                  </View>

                  <Text style={[styles.inputLabel, { color: isDark ? '#8E8E93' : '#687076' }]}>
                    Phone Number
                  </Text>
                  <View style={[styles.readOnlyInput, isDark ? styles.inputDark : styles.inputLight]}>
                    <Text style={[styles.readOnlyText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                      {conversation?.contact?.handle_or_phone}
                    </Text>
                  </View>

                  <Text style={[styles.inputLabel, { color: isDark ? '#8E8E93' : '#687076' }]}>
                    Expected Deal Value (₹)
                  </Text>
                  <TextInput
                    style={[styles.editableInput, isDark ? styles.inputDark : styles.inputLight]}
                    value={leadDealValue}
                    onChangeText={setLeadDealValue}
                    keyboardType="numeric"
                    placeholder="25000"
                    placeholderTextColor={isDark ? '#636366' : '#8E8E93'}
                  />

                  <View style={styles.modalActions}>
                    <Pressable
                      style={styles.cancelBtn}
                      onPress={() => setShowCrmModal(false)}
                    >
                      <Text style={[styles.cancelBtnText, { color: isDark ? '#8E8E93' : '#687076' }]}>
                        Cancel
                      </Text>
                    </Pressable>
                    <Pressable
                      style={styles.confirmBtn}
                      onPress={() => createLeadFromContactMutation.mutate()}
                      disabled={createLeadFromContactMutation.isPending}
                    >
                      {createLeadFromContactMutation.isPending ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.confirmBtnText}>Create Lead</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notFoundTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 16,
  },
  backPill: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  backPillText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  header: {
    paddingHorizontal: 14,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerDark: {
    backgroundColor: '#252230',
    borderBottomColor: '#3A3549',
  },
  headerLight: {
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#E5E5EA',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    marginLeft: -4,
  },
  btnPressedDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  btnPressedLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerContactPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0A84FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  headerCenter: {
    flex: 1,
  },
  contactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  contactHandle: {
    fontSize: 12,
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  crmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5856D6',
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 14,
  },
  crmBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  headerSubBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    paddingBottom: 4,
  },
  subBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subBadgeOpen: {
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
  },
  subBadgeExpired: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
  },
  subBadgeBotActive: {
    backgroundColor: 'rgba(10, 132, 255, 0.12)',
  },
  subBadgePaused: {
    backgroundColor: 'rgba(255, 149, 0, 0.12)',
  },
  subBadgeDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  subBadgeLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  subBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  messagesList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 50,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  composerWrapper: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  composerDark: {
    backgroundColor: '#252230',
    borderTopColor: '#3A3549',
  },
  composerLight: {
    backgroundColor: '#F0EEF8',
    borderTopColor: '#E5E5EA',
  },
  composerWrapperNoteDark: {
    backgroundColor: '#24180A',
    borderTopColor: '#3D2810',
  },
  composerWrapperNoteLight: {
    backgroundColor: '#FFFDF5',
    borderTopColor: '#FFE7A0',
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
    marginBottom: 6,
  },
  segmentDark: {
    backgroundColor: '#3A3549',
  },
  segmentLight: {
    backgroundColor: '#E5E5EA',
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 7,
  },
  segmentTabActiveDark: {
    backgroundColor: '#3A3A3C',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentTabActiveLight: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentTabActiveNoteDark: {
    backgroundColor: '#3D2810',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentTabActiveNoteLight: {
    backgroundColor: '#FEF3C7',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentTabText: {
    fontSize: 12.5,
    letterSpacing: -0.2,
  },
  closedCard: {
    borderRadius: 24,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  closedCardDark: {
    backgroundColor: 'rgba(255, 149, 0, 0.08)',
    borderColor: 'rgba(255, 149, 0, 0.25)',
  },
  closedCardLight: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderColor: 'rgba(255, 149, 0, 0.3)',
  },
  closedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  closedCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closedCardTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  closedCardInfoLink: {
    fontSize: 12,
    fontWeight: '600',
  },
  closedCardDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  closedCardActions: {
    flexDirection: 'row',
  },
  closedSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9500',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
  },
  closedSwitchBtnText: {
    color: '#000000',
    fontSize: 12.5,
    fontWeight: '700',
  },
  noteIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  noteIndicatorText: {
    fontSize: 11,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 40,
  },
  inputRowDark: {
    backgroundColor: '#3A3549',
    borderColor: '#3A3A3C',
  },
  inputRowLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D1D6',
  },
  inputRowNoteDark: {
    backgroundColor: '#3D2810',
    borderColor: '#5C3D18',
  },
  inputRowNoteLight: {
    backgroundColor: '#FEF9C3',
    borderColor: '#FDE047',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    maxHeight: 90,
    paddingTop: 6,
    paddingBottom: 6,
  },
  textInputDisabled: {
    fontStyle: 'italic',
  },
  sendBtn: {
    backgroundColor: '#007AFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  sendBtnDisabledDark: {
    backgroundColor: '#3A3A3C',
  },
  sendBtnDisabledLight: {
    backgroundColor: '#C7C7CC',
  },
  sendBtnNote: {
    backgroundColor: '#FF9500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  agentModalBox: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    maxHeight: '75%',
    borderWidth: StyleSheet.hairlineWidth,
  },
  guideModalBox: {
    borderRadius: 18,
    padding: 18,
    margin: 20,
    maxHeight: '80%',
    borderWidth: StyleSheet.hairlineWidth,
  },
  contactDrawerBox: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
    borderWidth: StyleSheet.hairlineWidth,
  },
  crmModalBox: {
    borderRadius: 18,
    padding: 20,
    margin: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  modalBoxDark: {
    backgroundColor: '#252230',
    borderColor: '#3A3549',
  },
  modalBoxLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E5EA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalSub: {
    fontSize: 12,
    marginTop: 2,
  },
  assignOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  assignOptionDark: {
    backgroundColor: '#3A3549',
    borderColor: '#3A3A3C',
  },
  assignOptionLight: {
    backgroundColor: '#F0EEF8',
    borderColor: '#E5E5EA',
  },
  agentAvatarPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(10, 132, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  assignOptionSub: {
    fontSize: 11,
    marginTop: 1,
  },
  sectionHeaderLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  memberRowDark: {
    borderBottomColor: '#3A3549',
  },
  memberRowLight: {
    borderBottomColor: '#E5E5EA',
  },
  memberAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#5856D6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  memberAvatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
  },
  memberEmail: {
    fontSize: 11,
    marginTop: 1,
  },
  memberRoleTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleTagDark: {
    backgroundColor: '#3A3549',
  },
  roleTagLight: {
    backgroundColor: '#E5E5EA',
  },
  memberRoleText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  guideCard: {
    borderRadius: 24,
    padding: 12,
    marginBottom: 10,
  },
  guideCardDark: {
    backgroundColor: '#3A3549',
  },
  guideCardLight: {
    backgroundColor: '#F0EEF8',
  },
  guideCardTitle: {
    color: '#34C759',
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 4,
  },
  guideCardBody: {
    fontSize: 12,
    lineHeight: 17,
  },
  guideGotItBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  guideGotItText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  drawerAvatarContainer: {
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  borderDark: {
    borderBottomColor: '#3A3549',
  },
  borderLight: {
    borderBottomColor: '#E5E5EA',
  },
  drawerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0A84FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  drawerAvatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  drawerName: {
    fontSize: 17,
    fontWeight: '700',
  },
  drawerPhone: {
    fontSize: 13,
    marginTop: 2,
  },
  drawerSection: {
    marginTop: 14,
    gap: 8,
  },
  drawerSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  drawerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  drawerRowKey: {
    fontSize: 13,
  },
  drawerRowVal: {
    fontSize: 13,
    fontWeight: '600',
  },
  drawerActionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  drawerPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5856D6',
    paddingVertical: 10,
    borderRadius: 12,
  },
  drawerPrimaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  drawerSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#0A84FF',
    paddingVertical: 10,
    borderRadius: 12,
  },
  drawerSecondaryBtnDark: {
    backgroundColor: '#3A3549',
  },
  drawerSecondaryBtnLight: {
    backgroundColor: '#F0EEF8',
  },
  drawerSecondaryBtnText: {
    color: '#0A84FF',
    fontWeight: '600',
    fontSize: 13,
  },
  formGroup: {
    marginTop: 10,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  readOnlyInput: {
    padding: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  inputDark: {
    backgroundColor: '#3A3549',
    borderColor: '#3A3A3C',
    color: '#FFFFFF',
  },
  inputLight: {
    backgroundColor: '#F0EEF8',
    borderColor: '#D1D1D6',
    color: '#000000',
  },
  readOnlyText: {
    fontSize: 13,
  },
  editableInput: {
    padding: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 14,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cancelBtnText: {
    fontSize: 13,
  },
  confirmBtn: {
    backgroundColor: '#5856D6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  successText: {
    color: '#34C759',
    fontSize: 15,
    fontWeight: '600',
  },

  // ── Instagram Encrypted Social Thread Pill ──────────────────────────────
  instaEncryptedPillWrapper: {
    alignItems: 'center',
    marginVertical: 12,
  },
  instaEncryptedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  instaEncryptedPillLight: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  instaEncryptedPillDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  instaEncryptedText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // ── Telegram Bot Training Banner ─────────────────────────────────────────
  telegramTrainingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  telegramTrainingBannerLight: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  telegramTrainingBannerDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  telegramTrainingText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
    marginRight: 8,
  },
  telegramPromptBtn: {
    backgroundColor: '#0055D4',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  telegramPromptBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Instagram Quick Replies Bar ──────────────────────────────────────────
  quickRepliesContainer: {
    marginBottom: 8,
  },
  quickRepliesScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 2,
  },
  quickReplyPill: {
    paddingHorizontal: 12,
    paddingVertical: 6.5,
    borderRadius: 18,
    borderWidth: 1,
  },
  quickReplyPillLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  quickReplyPillDark: {
    backgroundColor: '#1E293B',
    borderColor: '#374151',
  },
  quickReplyText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // ── Header Action Buttons (Telegram & Instagram) ─────────────────────────
  headerActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5.5,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  headerActionPillLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
  },
  headerActionPillDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  headerActionPillText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  headerActionPillDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5.5,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  headerActionPillDangerLight: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECDD3',
  },
  headerActionPillDangerDark: {
    backgroundColor: '#381E24',
    borderColor: '#5C222E',
  },
  headerActionPillDangerText: {
    color: '#EF4444',
    fontSize: 11.5,
    fontWeight: '600',
  },
  closeRoundBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  closeRoundBtnLight: {
    backgroundColor: '#F3F4F6',
  },
  closeRoundBtnDark: {
    backgroundColor: '#262626',
  },
});

