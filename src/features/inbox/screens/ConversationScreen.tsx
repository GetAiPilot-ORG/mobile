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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/store/authStore';
import { crmApi } from '../../crm/api/crm.api';
import { inboxApi } from '../api/inboxApi';
import { ChannelBadge, MessageBubble } from '../components';
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Pressable style={styles.backBtn} onPress={handleBack} hitSlop={10}>
              <Ionicons name="arrow-back" size={22} color="#e9edef" />
            </Pressable>

            {/* Avatar & Contact Info Clickable to Drawer */}
            <Pressable
              style={styles.headerContactPressable}
              onPress={() => setShowContactDrawer(true)}
            >
              <View style={styles.headerAvatar}>
                <Text style={styles.headerAvatarText}>
                  {conversation.contact.name ? conversation.contact.name.charAt(0).toUpperCase() : 'W'}
                </Text>
              </View>

              <View style={styles.headerCenter}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.contactName} numberOfLines={1}>
                    {conversation.contact.name}
                  </Text>
                  <Ionicons name="shield-checkmark" size={13} color="#00a884" />
                </View>
                <Text style={styles.contactHandle} numberOfLines={1}>
                  +{conversation.contact.handle_or_phone}
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
                color={isWindowExpired ? '#f87171' : '#34d399'}
              />
              <Text
                style={[
                  styles.metaWindowText,
                  { color: isWindowExpired ? '#fca5a5' : '#6ee7b7' },
                ]}
              >
                {isWindowExpired ? '24h Window Closed' : `24h Window: ${timeRemainingStr}`}
              </Text>
              <Ionicons name="information-circle-outline" size={12} color={isWindowExpired ? '#fca5a5' : '#6ee7b7'} />
            </Pressable>

            {/* Bot Active / Paused Pill */}
            <Pressable
              style={[
                styles.botControlPill,
                isBotPaused ? styles.botPausedPill : styles.botActivePill,
              ]}
              onPress={toggleBot}
            >
              <Text style={styles.botControlText}>
                {isBotPaused ? '⏸️ Bot Paused' : '🤖 Bot Active'}
              </Text>
            </Pressable>

            {/* Assigned Agent Button */}
            <Pressable
              style={styles.agentPill}
              onPress={() => setShowAgentModal(true)}
            >
              <Ionicons name="person-circle-outline" size={13} color="#8696a0" />
              <Text style={styles.agentPillText} numberOfLines={1}>
                {assignedAgentName}
              </Text>
              <Ionicons name="chevron-down" size={10} color="#8696a0" />
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
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={44} color="#334155" />
              <Text style={styles.emptyTitle}>No messages in this chat yet</Text>
              <Text style={styles.emptySubtitle}>
                Send a message or record an internal note to start communicating with this customer.
              </Text>
            </View>
          }
        />

        {/* WhatsApp Composer Bar */}
        <View
          style={[
            styles.composerWrapper,
            isInternalNote && styles.composerWrapperNote,
            { paddingBottom: Math.max(insets.bottom + 6, 16) },
          ]}
        >
          {/* Note / Reply Mode Toggle Pill Bar */}
          <View style={styles.composerModeBar}>
            <Pressable
              style={[styles.modeTab, !isInternalNote && styles.modeTabActive]}
              onPress={() => setIsInternalNote(false)}
            >
              <Ionicons name="logo-whatsapp" size={13} color={!isInternalNote ? '#00a884' : '#8696a0'} />
              <Text style={[styles.modeTabText, !isInternalNote && styles.modeTabTextActive]}>
                WhatsApp Reply
              </Text>
            </Pressable>

            <Pressable
              style={[styles.modeTab, isInternalNote && styles.modeTabNoteActive]}
              onPress={() => setIsInternalNote(true)}
            >
              <Ionicons name="lock-closed" size={13} color={isInternalNote ? '#fbbf24' : '#8696a0'} />
              <Text style={[styles.modeTabText, isInternalNote && styles.modeTabNoteTextActive]}>
                Internal Note
              </Text>
            </Pressable>
          </View>

          {/* Main Input Row */}
          <View style={[styles.inputRow, isInternalNote && styles.inputRowNote]}>
            <TextInput
              style={styles.textInput}
              placeholder={
                isInternalNote
                  ? 'Write an internal note for your team (customer won’t see this)...'
                  : isWindowExpired
                  ? '24h window closed — write an internal note...'
                  : 'Type a message...'
              }
              placeholderTextColor="#8696a0"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />

            <Pressable
              style={[
                styles.sendBtn,
                !inputText.trim() && styles.sendBtnDisabled,
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
            <View style={styles.agentModalBox}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Assign Agent</Text>
                  <Text style={styles.modalSub}>
                    Route this customer conversation to a workspace team member.
                  </Text>
                </View>
                <Pressable onPress={() => setShowAgentModal(false)} hitSlop={10}>
                  <Ionicons name="close" size={24} color="#8696a0" />
                </Pressable>
              </View>

              {/* Assign to Me Button */}
              <Pressable style={styles.assignOptionBtn} onPress={handleAssignToMe}>
                <View style={styles.agentAvatarPill}>
                  <Ionicons name="person" size={16} color="#00a884" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.assignOptionText}>Assign to Me</Text>
                  <Text style={styles.assignOptionSub}>{user?.email || 'Logged in user'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#8696a0" />
              </Pressable>

              {/* Unassign Button */}
              <Pressable
                style={styles.assignOptionBtn}
                onPress={() => handleAssignAgent(null)}
              >
                <View style={[styles.agentAvatarPill, { backgroundColor: '#334155' }]}>
                  <Ionicons name="close-circle-outline" size={16} color="#94a3b8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.assignOptionText}>Mark as Unassigned</Text>
                  <Text style={styles.assignOptionSub}>Open to any agent in inbox queue</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#8696a0" />
              </Pressable>

              {/* Organization Team Members List */}
              <Text style={styles.sectionHeaderLabel}>Team Members</Text>
              <ScrollView style={{ maxHeight: 200 }}>
                {(teamMembers || []).map((member) => (
                  <Pressable
                    key={member.id}
                    style={styles.memberRow}
                    onPress={() => handleAssignAgent(member)}
                  >
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>
                        {member.name ? member.name.charAt(0).toUpperCase() : 'A'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      <Text style={styles.memberEmail}>{member.email}</Text>
                    </View>
                    <View style={styles.memberRoleTag}>
                      <Text style={styles.memberRoleText}>{member.role}</Text>
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
            <View style={styles.guideModalBox}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="shield-checkmark" size={24} color="#00a884" />
                  <Text style={styles.modalTitle}>Meta 24-Hour Messaging Rule</Text>
                </View>
                <Pressable onPress={() => setShowGuideModal(false)} hitSlop={10}>
                  <Ionicons name="close" size={24} color="#8696a0" />
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <View style={styles.guideCard}>
                  <Text style={styles.guideCardTitle}>⏱️ How the 24-Hour Window Works</Text>
                  <Text style={styles.guideCardBody}>
                    Meta allows businesses to send freeform messages to WhatsApp users only within 24 hours of the customer's last message. Every incoming message from the customer resets this 24-hour timer.
                  </Text>
                </View>

                <View style={styles.guideCard}>
                  <Text style={styles.guideCardTitle}>🔒 When the Window is Closed</Text>
                  <Text style={styles.guideCardBody}>
                    Once 24 hours pass with no customer response, WhatsApp closes freeform messaging to prevent spam. You must send a Meta-approved Template Message to re-open the conversation.
                  </Text>
                </View>

                <View style={styles.guideCard}>
                  <Text style={styles.guideCardTitle}>💡 Internal Team Notes</Text>
                  <Text style={styles.guideCardBody}>
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
            <View style={styles.contactDrawerBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Contact Details</Text>
                <Pressable onPress={() => setShowContactDrawer(false)} hitSlop={10}>
                  <Ionicons name="close" size={24} color="#8696a0" />
                </Pressable>
              </View>

              <View style={styles.drawerAvatarContainer}>
                <View style={styles.drawerAvatar}>
                  <Text style={styles.drawerAvatarText}>
                    {conversation.contact.name ? conversation.contact.name.charAt(0).toUpperCase() : 'C'}
                  </Text>
                </View>
                <Text style={styles.drawerName}>{conversation.contact.name}</Text>
                <Text style={styles.drawerPhone}>+{conversation.contact.handle_or_phone}</Text>
              </View>

              <View style={styles.drawerSection}>
                <Text style={styles.drawerSectionLabel}>Channel Status</Text>
                <View style={styles.drawerRow}>
                  <Text style={styles.drawerRowKey}>Messaging Window</Text>
                  <Text style={[styles.drawerRowVal, { color: isWindowExpired ? '#f87171' : '#34d399' }]}>
                    {isWindowExpired ? 'Closed (>24h)' : `Open (${timeRemainingStr})`}
                  </Text>
                </View>
                <View style={styles.drawerRow}>
                  <Text style={styles.drawerRowKey}>Assigned Agent</Text>
                  <Text style={styles.drawerRowVal}>{assignedAgentName}</Text>
                </View>
                <View style={styles.drawerRow}>
                  <Text style={styles.drawerRowKey}>AI Bot Auto-Reply</Text>
                  <Text style={styles.drawerRowVal}>{isBotPaused ? 'Paused' : 'Active'}</Text>
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
                  style={styles.drawerSecondaryBtn}
                  onPress={() => {
                    const phone = conversation.contact.handle_or_phone.replace(/\D+/g, '');
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
            <View style={styles.crmModalBox}>
              <Text style={styles.modalTitle}>Convert WhatsApp Contact to Lead</Text>
              <Text style={styles.modalSub}>
                Create an instant sales opportunity in GetAiPilot CRM pipeline.
              </Text>

              {leadCreatedSuccess ? (
                <View style={styles.successBox}>
                  <Ionicons name="checkmark-circle" size={40} color="#10b981" />
                  <Text style={styles.successText}>Lead Created Successfully!</Text>
                </View>
              ) : (
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Contact Name</Text>
                  <View style={styles.readOnlyInput}>
                    <Text style={styles.readOnlyText}>{conversation.contact.name}</Text>
                  </View>

                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <View style={styles.readOnlyInput}>
                    <Text style={styles.readOnlyText}>{conversation.contact.handle_or_phone}</Text>
                  </View>

                  <Text style={styles.inputLabel}>Expected Deal Value (₹)</Text>
                  <TextInput
                    style={styles.editableInput}
                    value={leadDealValue}
                    onChangeText={setLeadDealValue}
                    keyboardType="numeric"
                    placeholder="25000"
                    placeholderTextColor="#64748b"
                  />

                  <View style={styles.modalActions}>
                    <Pressable
                      style={styles.cancelBtn}
                      onPress={() => setShowCrmModal(false)}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
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
    backgroundColor: '#0b141a', // WhatsApp Dark background
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
    color: '#f8fafc',
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
    backgroundColor: '#1f2c34', // WhatsApp dark header
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2a3942',
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
    color: '#e9edef',
    fontSize: 15,
    fontWeight: '700',
  },
  contactHandle: {
    color: '#8696a0',
    fontSize: 11.5,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
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
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  metaWindowClosed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
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
    color: '#e9edef',
    fontSize: 10.5,
    fontWeight: '700',
  },
  agentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#111b21',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a3942',
  },
  agentPillText: {
    color: '#8696a0',
    fontSize: 10.5,
    fontWeight: '600',
    maxWidth: 90,
  },
  windowNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b2505',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#78350f',
  },
  windowNoticeTitle: {
    color: '#fbbf24',
    fontSize: 11.5,
    fontWeight: '800',
  },
  windowNoticeText: {
    color: '#fef3c7',
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
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySubtitle: {
    color: '#8696a0',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  composerWrapper: {
    backgroundColor: '#111b21',
    borderTopWidth: 1,
    borderTopColor: '#2a3942',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  composerWrapperNote: {
    backgroundColor: '#271607',
    borderTopColor: '#78350f',
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
    backgroundColor: '#1f2c34',
  },
  modeTabActive: {
    backgroundColor: 'rgba(0, 168, 132, 0.2)',
    borderWidth: 1,
    borderColor: '#00a884',
  },
  modeTabNoteActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  modeTabText: {
    color: '#8696a0',
    fontSize: 11,
    fontWeight: '600',
  },
  modeTabTextActive: {
    color: '#00a884',
    fontWeight: '800',
  },
  modeTabNoteTextActive: {
    color: '#fbbf24',
    fontWeight: '800',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#202c33',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#2a3942',
  },
  inputRowNote: {
    backgroundColor: '#3b200b',
    borderColor: '#78350f',
  },
  textInput: {
    flex: 1,
    color: '#e9edef',
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
  sendBtnDisabled: {
    backgroundColor: '#2a3942',
  },
  sendBtnNote: {
    backgroundColor: '#d97706',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  agentModalBox: {
    backgroundColor: '#1f2c34',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    maxHeight: '75%',
  },
  guideModalBox: {
    backgroundColor: '#1f2c34',
    borderRadius: 20,
    padding: 18,
    margin: 20,
    maxHeight: '80%',
  },
  contactDrawerBox: {
    backgroundColor: '#1f2c34',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  crmModalBox: {
    backgroundColor: '#1f2c34',
    borderRadius: 20,
    padding: 20,
    margin: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalTitle: {
    color: '#e9edef',
    fontSize: 17,
    fontWeight: '800',
  },
  modalSub: {
    color: '#8696a0',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  assignOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111b21',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: '#2a3942',
  },
  agentAvatarPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 168, 132, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignOptionText: {
    color: '#e9edef',
    fontSize: 13.5,
    fontWeight: '700',
  },
  assignOptionSub: {
    color: '#8696a0',
    fontSize: 11,
  },
  sectionHeaderLabel: {
    color: '#8696a0',
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
    borderBottomColor: '#2a3942',
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
    color: '#e9edef',
    fontSize: 13,
    fontWeight: '600',
  },
  memberEmail: {
    color: '#8696a0',
    fontSize: 11,
  },
  memberRoleTag: {
    backgroundColor: '#111b21',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2a3942',
  },
  memberRoleText: {
    color: '#8696a0',
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  guideCard: {
    backgroundColor: '#111b21',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a3942',
  },
  guideCardTitle: {
    color: '#00a884',
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 4,
  },
  guideCardBody: {
    color: '#8696a0',
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
    borderBottomColor: '#2a3942',
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
    color: '#e9edef',
    fontSize: 16,
    fontWeight: '700',
  },
  drawerPhone: {
    color: '#8696a0',
    fontSize: 13,
    marginTop: 2,
  },
  drawerSection: {
    marginTop: 14,
    gap: 8,
  },
  drawerSectionLabel: {
    color: '#8696a0',
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
    color: '#8696a0',
    fontSize: 13,
  },
  drawerRowVal: {
    color: '#e9edef',
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
    backgroundColor: '#111b21',
    borderWidth: 1,
    borderColor: '#00a884',
    paddingVertical: 10,
    borderRadius: 12,
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
    color: '#8696a0',
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  readOnlyInput: {
    backgroundColor: '#111b21',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a3942',
  },
  readOnlyText: {
    color: '#e9edef',
    fontSize: 13,
  },
  editableInput: {
    backgroundColor: '#111b21',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00a884',
    color: '#e9edef',
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
    color: '#8696a0',
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
