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
  useColorScheme,
  View,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/store/authStore';
import { crmApi } from '../../crm/api/crm.api';
import { inboxApi } from '../api/inboxApi';
import { MessageBubble } from '../components/MessageBubble';
import { useInboxWebSocket } from '../hooks/useInboxWebSocket';
import { NormalizedConversation, NormalizedMessage, TeamMember } from '../types';

const CUSTOMER_SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 Hours Meta Window

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const handleBack = onBack || (() => router.back());
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState<string>('');
  const [isInternalNote, setIsInternalNote] = useState<boolean>(false);
  const [showAgentModal, setShowAgentModal] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [showContactDrawer, setShowContactDrawer] = useState<boolean>(false);
  const [isBotPaused, setIsBotPaused] = useState<boolean>(initialConversation?.bot_paused || false);
  const [assignedAgentName, setAssignedAgentName] = useState<string>(
    initialConversation?.assigned_agent_name || initialConversation?.assigned_to || 'Unassigned'
  );

  const flatListRef = useRef<FlatList>(null);
  const user = useAuthStore((s) => s.user);

  const activeId = initialConversation?.id || conversationId || '';

  // Realtime WebSocket Subscription
  useInboxWebSocket(activeId);

  // Fetch conversation details & message history
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['conversation_details', activeId],
    queryFn: () => inboxApi.getConversationDetails(activeId),
    staleTime: 3000,
    refetchInterval: 4000,
    enabled: !!activeId,
  });

  // Fetch team members for agent assignment
  const { data: teamMembers } = useQuery({
    queryKey: ['team_members'],
    queryFn: () => inboxApi.getTeamMembers(),
    staleTime: 60000,
  });

  const conversation = initialConversation || data?.conversation;
  const messages: NormalizedMessage[] = data?.messages || [];

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

  const [timeRemainingStr, setTimeRemainingStr] = useState<string>('');
  const [isWindowExpired, setIsWindowExpired] = useState<boolean>(false);
  const [hoursLeft, setHoursLeft] = useState<number>(0);

  useEffect(() => {
    const checkWindow = () => {
      if (!latestCustomerMessageAt) {
        setIsWindowExpired(true);
        setTimeRemainingStr('Closed');
        setHoursLeft(0);
        return;
      }

      const elapsed = Date.now() - latestCustomerMessageAt;
      const diff = CUSTOMER_SERVICE_WINDOW_MS - elapsed;

      if (diff <= 0) {
        setIsWindowExpired(true);
        setTimeRemainingStr('Closed');
        setHoursLeft(0);
      } else {
        setIsWindowExpired(false);
        const totalMinutes = Math.floor(diff / (60 * 1000));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        setHoursLeft(hours);
        setTimeRemainingStr(`${hours}h ${minutes}m left`);
      }
    };

    checkWindow();
    const interval = setInterval(checkWindow, 30000);
    return () => clearInterval(interval);
  }, [latestCustomerMessageAt]);

  // -------------------------------------------------------------
  // 2. Sending Messages / Notes
  // -------------------------------------------------------------
  const sendMutation = useMutation({
    mutationFn: (payload: { text: string; isNote?: boolean; template?: any }) => {
      if (!conversation) throw new Error('No active conversation');
      return inboxApi.sendMessage({
        conversation_id: conversation.id,
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
        channel: 'whatsapp',
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

      if (conversation) {
        queryClient.setQueryData(['conversation_details', conversation.id], (old: any) => {
          if (!old) return { conversation, messages: [optimisticMsg] };
          return {
            ...old,
            messages: [...old.messages, optimisticMsg],
          };
        });
      }

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);

      return { optimisticMsg };
    },
    onSuccess: (newMessage, _variables, context) => {
      if (conversation) {
        queryClient.setQueryData(['conversation_details', conversation.id], (old: any) => {
          if (!old) return { conversation, messages: [newMessage] };
          const filtered = (old.messages || []).filter((m: any) => m.id !== context?.optimisticMsg?.id);
          return {
            ...old,
            messages: [...filtered, newMessage],
          };
        });
      }
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    onError: (err: any, _variables, context) => {
      if (conversation && context?.optimisticMsg) {
        queryClient.setQueryData(['conversation_details', conversation.id], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            messages: old.messages.map((m: any) =>
              m.id === context.optimisticMsg.id ? { ...m, status: 'failed' } : m
            ),
          };
        });
      }
      Alert.alert('Send Failed', err?.message || 'Failed to dispatch message');
    },
  });

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || sendMutation.isPending) return;

    sendMutation.mutate({ text: trimmed, isNote: isInternalNote });
  };

  // -------------------------------------------------------------
  // 3. Bot Toggle & Agent Handoff Controls
  // -------------------------------------------------------------
  const toggleBot = async () => {
    if (!conversation) return;
    const nextState = !isBotPaused;
    setIsBotPaused(nextState);
    try {
      await inboxApi.toggleBot(conversation.id, !nextState);
      Alert.alert(
        nextState ? '🤖 AI Bot Paused' : '🤖 AI Bot Resumed',
        nextState
          ? 'AI Auto-reply is paused for this conversation. You are now in human takeover mode.'
          : 'AI Auto-reply has been re-enabled for this conversation.'
      );
    } catch {
      // Revert if error
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

  if (isLoading && !conversation) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#00a884" />
          <Text style={styles.loadingText}>Loading WhatsApp conversation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!conversation) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Text style={styles.notFoundTitle}>Conversation not found</Text>
          <Pressable style={styles.backPill} onPress={handleBack}>
            <Text style={styles.backPillText}>← Return to Inbox</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: isDark ? '#0b141a' : '#f0f2f5' }]}
      edges={['top', 'left', 'right']}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Header Bar */}
        <View style={[styles.header, isDark ? styles.headerDark : styles.headerLight]}>
          <View style={styles.headerTopRow}>
            <Pressable style={styles.backBtn} onPress={handleBack} hitSlop={10}>
              <Ionicons name="arrow-back" size={22} color={isDark ? '#e9edef' : '#0f172a'} />
            </Pressable>

            {/* Avatar & Contact Info Clickable to Drawer */}
            <Pressable
              style={styles.headerContactPressable}
              onPress={() => setShowContactDrawer(true)}
            >
              <View style={styles.headerAvatar}>
                <Text style={styles.headerAvatarText}>
                  {conversation?.contact?.name ? conversation.contact.name.charAt(0).toUpperCase() : 'W'}
                </Text>
              </View>

              <View style={styles.headerCenter}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={[styles.contactName, { color: isDark ? '#e9edef' : '#0f172a' }]} numberOfLines={1}>
                    {conversation?.contact?.name || 'WhatsApp Contact'}
                  </Text>
                  <Ionicons name="shield-checkmark" size={13} color="#00a884" />
                </View>
                <Text style={[styles.contactHandle, { color: isDark ? '#8696a0' : '#64748b' }]} numberOfLines={1}>
                  +{conversation?.contact?.handle_or_phone || ''}
                </Text>
              </View>
            </Pressable>

            {/* Quick Actions */}
            <View style={styles.headerRightActions}>
              <Pressable style={styles.crmBtn} onPress={() => setShowCrmModal(true)}>
                <Text style={styles.crmBtnText}>+ CRM</Text>
              </Pressable>
            </View>
          </View>

          {/* Sub-Header Bar: 24h Meta Window Pill + Agent Assignment + Bot Controls */}
          <View style={styles.headerSubBar}>
            {/* 24-Hour Meta Window Badge (Clickable for Guide) */}
            <Pressable
              style={[
                styles.metaWindowPill,
                isWindowExpired ? styles.metaWindowClosed : styles.metaWindowOpen,
              ]}
              onPress={() => setShowGuideModal(true)}
            >
              <Ionicons
                name={isWindowExpired ? 'alert-circle' : 'time'}
                size={12}
                color={isWindowExpired ? '#dc2626' : '#16a34a'}
              />
              <Text
                style={[
                  styles.metaWindowText,
                  { color: isWindowExpired ? (isDark ? '#fca5a5' : '#dc2626') : (isDark ? '#6ee7b7' : '#15803d') },
                ]}
              >
                {isWindowExpired ? '24h Window Closed' : `24h Window: ${timeRemainingStr}`}
              </Text>
              <Ionicons
                name="information-circle-outline"
                size={12}
                color={isWindowExpired ? (isDark ? '#fca5a5' : '#dc2626') : (isDark ? '#6ee7b7' : '#15803d')}
              />
            </Pressable>

            {/* Bot Active / Paused Pill */}
            <Pressable
              style={[
                styles.botControlPill,
                isBotPaused ? styles.botPausedPill : styles.botActivePill,
              ]}
              onPress={toggleBot}
            >
              <Text style={[styles.botControlText, { color: isDark ? '#e9edef' : '#0f172a' }]}>
                {isBotPaused ? '⏸️ Bot Paused' : '🤖 Bot Active'}
              </Text>
            </Pressable>

            {/* Assigned Agent Button */}
            <Pressable
              style={[styles.agentPill, isDark ? styles.agentPillDark : styles.agentPillLight]}
              onPress={() => setShowAgentModal(true)}
            >
              <Ionicons name="person-circle-outline" size={13} color={isDark ? '#8696a0' : '#64748b'} />
              <Text style={[styles.agentPillText, { color: isDark ? '#8696a0' : '#64748b' }]} numberOfLines={1}>
                {assignedAgentName}
              </Text>
              <Ionicons name="chevron-down" size={10} color={isDark ? '#8696a0' : '#64748b'} />
            </Pressable>
          </View>
        </View>

        {/* 24-Hour Policy Warning Banner (When Window is Expired) */}
        {isWindowExpired && (
          <View style={styles.windowNoticeBanner}>
            <Ionicons name="warning" size={18} color="#f59e0b" style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.windowNoticeTitle}>24-Hour Messaging Window Closed</Text>
              <Text style={styles.windowNoticeText}>
                The customer service window is closed. Outbound replies are restricted, but you can still record internal notes.
              </Text>
            </View>
          </View>
        )}

        {/* Chat Message List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          style={{ backgroundColor: isDark ? '#0b141a' : '#efeae2' }}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={44} color={isDark ? '#334155' : '#cbd5e1'} />
              <Text style={[styles.emptyTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                No messages in this chat yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: isDark ? '#8696a0' : '#64748b' }]}>
                Send a message or record an internal note to start communicating with this customer.
              </Text>
            </View>
          }
        />

        {/* WhatsApp Composer Bar */}
        <View
          style={[
            styles.composerWrapper,
            isDark ? styles.composerDark : styles.composerLight,
            isInternalNote && (isDark ? styles.composerWrapperNoteDark : styles.composerWrapperNoteLight),
            { paddingBottom: Math.max(insets.bottom + 6, 16) },
          ]}
        >
          {/* Note / Reply Mode Toggle Pill Bar */}
          <View style={styles.composerModeBar}>
            <Pressable
              style={[
                styles.modeTab,
                isDark ? styles.modeTabDark : styles.modeTabLight,
                !isInternalNote && styles.modeTabActive,
              ]}
              onPress={() => setIsInternalNote(false)}
            >
              <Ionicons
                name="logo-whatsapp"
                size={13}
                color={!isInternalNote ? '#00a884' : isDark ? '#8696a0' : '#64748b'}
              />
              <Text
                style={[
                  styles.modeTabText,
                  { color: !isInternalNote ? '#00a884' : isDark ? '#8696a0' : '#64748b' },
                  !isInternalNote && styles.modeTabTextActive,
                ]}
              >
                WhatsApp Reply
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.modeTab,
                isDark ? styles.modeTabDark : styles.modeTabLight,
                isInternalNote && styles.modeTabNoteActive,
              ]}
              onPress={() => setIsInternalNote(true)}
            >
              <Ionicons
                name="lock-closed"
                size={13}
                color={isInternalNote ? '#fbbf24' : isDark ? '#8696a0' : '#64748b'}
              />
              <Text
                style={[
                  styles.modeTabText,
                  { color: isInternalNote ? '#fbbf24' : isDark ? '#8696a0' : '#64748b' },
                  isInternalNote && styles.modeTabNoteTextActive,
                ]}
              >
                Internal Note
              </Text>
            </Pressable>
          </View>

          {/* Main Input Row */}
          <View
            style={[
              styles.inputRow,
              isDark ? styles.inputRowDark : styles.inputRowLight,
              isInternalNote && (isDark ? styles.inputRowNoteDark : styles.inputRowNoteLight),
            ]}
          >
            <TextInput
              style={[styles.textInput, { color: isDark ? '#e9edef' : '#0f172a' }]}
              placeholder={
                isInternalNote
                  ? 'Write an internal note for your team (customer won’t see this)...'
                  : isWindowExpired
                  ? '24h window closed — write an internal note...'
                  : 'Type a message...'
              }
              placeholderTextColor={isDark ? '#8696a0' : '#94a3b8'}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />

            <Pressable
              style={[
                styles.sendBtn,
                !inputText.trim() && (isDark ? styles.sendBtnDisabledDark : styles.sendBtnDisabledLight),
                isInternalNote && styles.sendBtnNote,
              ]}
              disabled={!inputText.trim() || sendMutation.isPending}
              onPress={handleSend}
            >
              {sendMutation.isPending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons
                  name={isInternalNote ? 'bookmark' : 'send'}
                  size={17}
                  color="#ffffff"
                />
              )}
            </Pressable>
          </View>
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
                  <Text style={[styles.modalTitle, { color: isDark ? '#e9edef' : '#0f172a' }]}>Assign Agent</Text>
                  <Text style={[styles.modalSub, { color: isDark ? '#8696a0' : '#64748b' }]}>
                    Route this customer conversation to a workspace team member.
                  </Text>
                </View>
                <Pressable onPress={() => setShowAgentModal(false)} hitSlop={10}>
                  <Ionicons name="close" size={24} color={isDark ? '#8696a0' : '#64748b'} />
                </Pressable>
              </View>

              {/* Assign to Me Button */}
              <Pressable
                style={[styles.assignOptionBtn, isDark ? styles.assignOptionDark : styles.assignOptionLight]}
                onPress={handleAssignToMe}
              >
                <View style={styles.agentAvatarPill}>
                  <Ionicons name="person" size={16} color="#00a884" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.assignOptionText, { color: isDark ? '#e9edef' : '#0f172a' }]}>
                    Assign to Me
                  </Text>
                  <Text style={[styles.assignOptionSub, { color: isDark ? '#8696a0' : '#64748b' }]}>
                    {user?.email || 'Logged in user'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={isDark ? '#8696a0' : '#94a3b8'} />
              </Pressable>

              {/* Unassign Button */}
              <Pressable
                style={[styles.assignOptionBtn, isDark ? styles.assignOptionDark : styles.assignOptionLight]}
                onPress={() => handleAssignAgent(null)}
              >
                <View style={[styles.agentAvatarPill, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
                  <Ionicons name="close-circle-outline" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.assignOptionText, { color: isDark ? '#e9edef' : '#0f172a' }]}>
                    Mark as Unassigned
                  </Text>
                  <Text style={[styles.assignOptionSub, { color: isDark ? '#8696a0' : '#64748b' }]}>
                    Open to any agent in inbox queue
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={isDark ? '#8696a0' : '#94a3b8'} />
              </Pressable>

              {/* Organization Team Members List */}
              <Text style={[styles.sectionHeaderLabel, { color: isDark ? '#8696a0' : '#64748b' }]}>
                Team Members
              </Text>
              <ScrollView style={{ maxHeight: 200 }}>
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
                      <Text style={[styles.memberName, { color: isDark ? '#e9edef' : '#0f172a' }]}>
                        {member.name}
                      </Text>
                      <Text style={[styles.memberEmail, { color: isDark ? '#8696a0' : '#64748b' }]}>
                        {member.email}
                      </Text>
                    </View>
                    <View style={[styles.memberRoleTag, isDark ? styles.roleTagDark : styles.roleTagLight]}>
                      <Text style={[styles.memberRoleText, { color: isDark ? '#8696a0' : '#64748b' }]}>
                        {member.role}
                      </Text>
                    </View>
                    {assignedAgentName === member.name && (
                      <Ionicons name="checkmark-circle" size={18} color="#00a884" style={{ marginLeft: 6 }} />
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
                  <Ionicons name="shield-checkmark" size={24} color="#00a884" />
                  <Text style={[styles.modalTitle, { color: isDark ? '#e9edef' : '#0f172a' }]}>
                    Meta 24-Hour Messaging Rule
                  </Text>
                </View>
                <Pressable onPress={() => setShowGuideModal(false)} hitSlop={10}>
                  <Ionicons name="close" size={24} color={isDark ? '#8696a0' : '#64748b'} />
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <View style={[styles.guideCard, isDark ? styles.guideCardDark : styles.guideCardLight]}>
                  <Text style={styles.guideCardTitle}>⏱️ How the 24-Hour Window Works</Text>
                  <Text style={[styles.guideCardBody, { color: isDark ? '#8696a0' : '#475569' }]}>
                    Meta allows businesses to send freeform messages to WhatsApp users only within 24 hours of the customer's last message. Every incoming message from the customer resets this 24-hour timer.
                  </Text>
                </View>

                <View style={[styles.guideCard, isDark ? styles.guideCardDark : styles.guideCardLight]}>
                  <Text style={styles.guideCardTitle}>🔒 When the Window is Closed</Text>
                  <Text style={[styles.guideCardBody, { color: isDark ? '#8696a0' : '#475569' }]}>
                    Once 24 hours pass with no customer response, WhatsApp closes freeform messaging to prevent spam. You must send a Meta-approved Template Message to re-open the conversation.
                  </Text>
                </View>

                <View style={[styles.guideCard, isDark ? styles.guideCardDark : styles.guideCardLight]}>
                  <Text style={styles.guideCardTitle}>💡 Internal Team Notes</Text>
                  <Text style={[styles.guideCardBody, { color: isDark ? '#8696a0' : '#475569' }]}>
                    Internal team notes can be added at any time, even when the 24-hour customer window is closed. They are private and only visible to your workspace team members.
                  </Text>
                </View>
              </ScrollView>

              <Pressable
                style={styles.guideGotItBtn}
                onPress={() => setShowGuideModal(false)}
              >
                <Text style={styles.guideGotItText}>Got it, Close</Text>
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
                <Text style={[styles.modalTitle, { color: isDark ? '#e9edef' : '#0f172a' }]}>Contact Details</Text>
                <Pressable onPress={() => setShowContactDrawer(false)} hitSlop={10}>
                  <Ionicons name="close" size={24} color={isDark ? '#8696a0' : '#64748b'} />
                </Pressable>
              </View>

              <View style={[styles.drawerAvatarContainer, isDark ? styles.borderDark : styles.borderLight]}>
                <View style={styles.drawerAvatar}>
                  <Text style={styles.drawerAvatarText}>
                    {conversation?.contact?.name ? conversation.contact.name.charAt(0).toUpperCase() : 'C'}
                  </Text>
                </View>
                <Text style={[styles.drawerName, { color: isDark ? '#e9edef' : '#0f172a' }]}>
                  {conversation?.contact?.name}
                </Text>
                <Text style={[styles.drawerPhone, { color: isDark ? '#8696a0' : '#64748b' }]}>
                  +{conversation?.contact?.handle_or_phone}
                </Text>
              </View>

              <View style={styles.drawerSection}>
                <Text style={[styles.drawerSectionLabel, { color: isDark ? '#8696a0' : '#64748b' }]}>
                  Channel Status
                </Text>
                <View style={styles.drawerRow}>
                  <Text style={[styles.drawerRowKey, { color: isDark ? '#8696a0' : '#64748b' }]}>
                    Messaging Window
                  </Text>
                  <Text
                    style={[
                      styles.drawerRowVal,
                      { color: isWindowExpired ? '#dc2626' : '#16a34a' },
                    ]}
                  >
                    {isWindowExpired ? 'Closed (>24h)' : `Open (${timeRemainingStr})`}
                  </Text>
                </View>
                <View style={styles.drawerRow}>
                  <Text style={[styles.drawerRowKey, { color: isDark ? '#8696a0' : '#64748b' }]}>
                    Assigned Agent
                  </Text>
                  <Text style={[styles.drawerRowVal, { color: isDark ? '#e9edef' : '#0f172a' }]}>
                    {assignedAgentName}
                  </Text>
                </View>
                <View style={styles.drawerRow}>
                  <Text style={[styles.drawerRowKey, { color: isDark ? '#8696a0' : '#64748b' }]}>
                    AI Bot Auto-Reply
                  </Text>
                  <Text style={[styles.drawerRowVal, { color: isDark ? '#e9edef' : '#0f172a' }]}>
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
                  <Ionicons name="briefcase-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.drawerPrimaryBtnText}>Create CRM Lead</Text>
                </Pressable>

                <Pressable
                  style={[styles.drawerSecondaryBtn, isDark ? styles.drawerSecondaryBtnDark : styles.drawerSecondaryBtnLight]}
                  onPress={() => {
                    const phone = (conversation?.contact?.handle_or_phone || '').replace(/\D+/g, '');
                    if (phone) Linking.openURL(`tel:+${phone}`).catch(() => {});
                  }}
                >
                  <Ionicons name="call-outline" size={16} color="#00a884" style={{ marginRight: 6 }} />
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
              <Text style={[styles.modalTitle, { color: isDark ? '#e9edef' : '#0f172a' }]}>
                Convert WhatsApp Contact to Lead
              </Text>
              <Text style={[styles.modalSub, { color: isDark ? '#8696a0' : '#64748b' }]}>
                Create an instant sales opportunity in GetAiPilot CRM pipeline.
              </Text>

              {leadCreatedSuccess ? (
                <View style={styles.successBox}>
                  <Ionicons name="checkmark-circle" size={40} color="#10b981" />
                  <Text style={styles.successText}>Lead Created Successfully!</Text>
                </View>
              ) : (
                <View style={styles.formGroup}>
                  <Text style={[styles.inputLabel, { color: isDark ? '#8696a0' : '#64748b' }]}>
                    Contact Name
                  </Text>
                  <View style={[styles.readOnlyInput, isDark ? styles.inputDark : styles.inputLight]}>
                    <Text style={[styles.readOnlyText, { color: isDark ? '#e9edef' : '#0f172a' }]}>
                      {conversation?.contact?.name}
                    </Text>
                  </View>

                  <Text style={[styles.inputLabel, { color: isDark ? '#8696a0' : '#64748b' }]}>
                    Phone Number
                  </Text>
                  <View style={[styles.readOnlyInput, isDark ? styles.inputDark : styles.inputLight]}>
                    <Text style={[styles.readOnlyText, { color: isDark ? '#e9edef' : '#0f172a' }]}>
                      {conversation?.contact?.handle_or_phone}
                    </Text>
                  </View>

                  <Text style={[styles.inputLabel, { color: isDark ? '#8696a0' : '#64748b' }]}>
                    Expected Deal Value (₹)
                  </Text>
                  <TextInput
                    style={[styles.editableInput, isDark ? styles.inputDark : styles.inputLight]}
                    value={leadDealValue}
                    onChangeText={setLeadDealValue}
                    keyboardType="numeric"
                    placeholder="25000"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  />

                  <View style={styles.modalActions}>
                    <Pressable
                      style={styles.cancelBtn}
                      onPress={() => setShowCrmModal(false)}
                    >
                      <Text style={[styles.cancelBtnText, { color: isDark ? '#8696a0' : '#64748b' }]}>
                        Cancel
                      </Text>
                    </Pressable>
                    <Pressable
                      style={styles.confirmBtn}
                      onPress={() => createLeadFromContactMutation.mutate()}
                      disabled={createLeadFromContactMutation.isPending}
                    >
                      {createLeadFromContactMutation.isPending ? (
                        <ActivityIndicator size="small" color="#ffffff" />
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
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
  loadingText: {
    color: '#8696a0',
    marginTop: 12,
    fontSize: 14,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  backPill: {
    backgroundColor: '#00a884',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backPillText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  header: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerDark: {
    backgroundColor: '#1f2c34',
    borderBottomColor: '#2a3942',
  },
  headerLight: {
    backgroundColor: '#ffffff',
    borderBottomColor: '#e2e8f0',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: 6,
    marginRight: 6,
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
    backgroundColor: '#00a884',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerAvatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  headerCenter: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
  },
  contactHandle: {
    fontSize: 11.5,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  crmBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  crmBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
  },
  headerSubBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
    flexWrap: 'wrap',
  },
  metaWindowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
  },
  metaWindowOpen: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  metaWindowClosed: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  metaWindowText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  botControlPill: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
  },
  botActivePill: {
    backgroundColor: 'rgba(0, 168, 132, 0.15)',
    borderColor: 'rgba(0, 168, 132, 0.4)',
  },
  botPausedPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  botControlText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  agentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
  },
  agentPillDark: {
    backgroundColor: '#111b21',
    borderColor: '#2a3942',
  },
  agentPillLight: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  agentPillText: {
    fontSize: 10.5,
    fontWeight: '600',
    maxWidth: 90,
  },
  windowNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  windowNoticeTitle: {
    color: '#92400e',
    fontSize: 11.5,
    fontWeight: '800',
  },
  windowNoticeText: {
    color: '#78350f',
    fontSize: 10.5,
    lineHeight: 14,
  },
  messagesList: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  composerWrapper: {
    borderTopWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  composerDark: {
    backgroundColor: '#111b21',
    borderTopColor: '#2a3942',
  },
  composerLight: {
    backgroundColor: '#f0f2f5',
    borderTopColor: '#e2e8f0',
  },
  composerWrapperNoteDark: {
    backgroundColor: '#271607',
    borderTopColor: '#78350f',
  },
  composerWrapperNoteLight: {
    backgroundColor: '#fffbeb',
    borderTopColor: '#fde68a',
  },
  composerModeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  modeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  modeTabDark: {
    backgroundColor: '#1f2c34',
    borderColor: '#2a3942',
  },
  modeTabLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  modeTabActive: {
    backgroundColor: 'rgba(0, 168, 132, 0.15)',
    borderColor: '#00a884',
  },
  modeTabNoteActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#fbbf24',
  },
  modeTabText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modeTabTextActive: {
    fontWeight: '800',
  },
  modeTabNoteTextActive: {
    fontWeight: '800',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
  },
  inputRowDark: {
    backgroundColor: '#202c33',
    borderColor: '#2a3942',
  },
  inputRowLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  inputRowNoteDark: {
    backgroundColor: '#3b200b',
    borderColor: '#78350f',
  },
  inputRowNoteLight: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    maxHeight: 100,
    paddingTop: 6,
    paddingBottom: 6,
  },
  sendBtn: {
    backgroundColor: '#00a884',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    marginBottom: 2,
  },
  sendBtnDisabledDark: {
    backgroundColor: '#2a3942',
  },
  sendBtnDisabledLight: {
    backgroundColor: '#cbd5e1',
  },
  sendBtnNote: {
    backgroundColor: '#d97706',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  agentModalBox: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    maxHeight: '75%',
    borderWidth: 1,
  },
  guideModalBox: {
    borderRadius: 20,
    padding: 18,
    margin: 20,
    maxHeight: '80%',
    borderWidth: 1,
  },
  contactDrawerBox: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
    borderWidth: 1,
  },
  crmModalBox: {
    borderRadius: 20,
    padding: 20,
    margin: 20,
    borderWidth: 1,
  },
  modalBoxDark: {
    backgroundColor: '#1f2c34',
    borderColor: '#2a3942',
  },
  modalBoxLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  assignOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 10,
    borderWidth: 1,
  },
  assignOptionDark: {
    backgroundColor: '#111b21',
    borderColor: '#2a3942',
  },
  assignOptionLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  agentAvatarPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 168, 132, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignOptionText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  assignOptionSub: {
    fontSize: 11,
  },
  sectionHeaderLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  memberRowDark: {
    borderBottomColor: '#2a3942',
  },
  memberRowLight: {
    borderBottomColor: '#e2e8f0',
  },
  memberAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  memberAvatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  memberName: {
    fontSize: 13,
    fontWeight: '600',
  },
  memberEmail: {
    fontSize: 11,
  },
  memberRoleTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleTagDark: {
    backgroundColor: '#111b21',
    borderColor: '#2a3942',
  },
  roleTagLight: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  memberRoleText: {
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  guideCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  guideCardDark: {
    backgroundColor: '#111b21',
    borderColor: '#2a3942',
  },
  guideCardLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  guideCardTitle: {
    color: '#00a884',
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 4,
  },
  guideCardBody: {
    fontSize: 12,
    lineHeight: 17,
  },
  guideGotItBtn: {
    backgroundColor: '#00a884',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  guideGotItText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  drawerAvatarContainer: {
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  borderDark: {
    borderBottomColor: '#2a3942',
  },
  borderLight: {
    borderBottomColor: '#e2e8f0',
  },
  drawerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00a884',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  drawerAvatarText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  drawerName: {
    fontSize: 16,
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
    fontSize: 11.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
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
    marginTop: 20,
  },
  drawerPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    borderRadius: 12,
  },
  drawerPrimaryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  drawerSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#00a884',
    paddingVertical: 10,
    borderRadius: 12,
  },
  drawerSecondaryBtnDark: {
    backgroundColor: '#111b21',
  },
  drawerSecondaryBtnLight: {
    backgroundColor: '#f8fafc',
  },
  drawerSecondaryBtnText: {
    color: '#00a884',
    fontWeight: '700',
    fontSize: 13,
  },
  formGroup: {
    marginTop: 10,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  readOnlyInput: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  inputDark: {
    backgroundColor: '#111b21',
    borderColor: '#2a3942',
    color: '#e9edef',
  },
  inputLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    color: '#0f172a',
  },
  readOnlyText: {
    fontSize: 13,
  },
  editableInput: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    fontWeight: '700',
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
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  successText: {
    color: '#10b981',
    fontSize: 15,
    fontWeight: '700',
  },
});
