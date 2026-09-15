import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
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
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/store/authStore';
import { crmApi } from '../../crm/api/crm.api';
import { inboxApi } from '../api/inboxApi';
import { MessageBubble } from '../components';
import { useInboxWebSocket } from '../hooks/useInboxWebSocket';
import { NormalizedConversation, NormalizedMessage, TeamMember } from '../types';
import { ConversationSkeleton } from '../../../components/skeletonScreen';

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
    initialConversation?.assigned_agent_name || initialConversation?.assigned_to || 'Unassigned'
  );

  const flatListRef = useRef<FlatList>(null);
  const user = useAuthStore((s) => s.user);

  const activeId = initialConversation?.id || conversationId || '';

  // Realtime WebSocket Subscription
  useInboxWebSocket(activeId);

  // Fetch conversation details & message history
  const { data, isLoading } = useQuery({
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

  // 1. Meta 24-Hour Customer Service Window Calculation
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

  useEffect(() => {
    const checkWindow = () => {
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
  }, [latestCustomerMessageAt]);

  // 2. Sending Messages / Notes
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

    if (isWindowExpired && !isInternalNote) {
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

  // 3. Bot Toggle & Agent Handoff Controls
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

  // 4. CRM Lead Quick-Create State
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

  const headerTopPadding = Platform.OS === 'ios' ? Math.max(insets.top, 44) : 8;
  const composerBottomPadding = Platform.OS === 'ios' ? Math.max(insets.bottom, 10) : 8;

  if (isLoading && !conversation) {
    return <ConversationSkeleton />;
  }

  if (!conversation) {
    return (
      <View className="flex-1 bg-[#0B0D10]" style={{ paddingTop: headerTopPadding }}>
        <View className="flex-1 justify-center items-center p-5">
          <Text className="text-[17px] font-semibold text-white mb-4">
            Conversation not found
          </Text>
          <Pressable className="bg-[#0084FF] px-4 py-2 rounded-full" onPress={handleBack}>
            <Text className="text-white font-semibold text-sm">← Return to Inbox</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-[#0B0D10]"
      {...panResponder.panHandlers}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View
          className="px-3.5 pb-2 bg-[#181A1F] border-b border-[#262930]"
          style={{ paddingTop: headerTopPadding }}
        >
          {/* Top Row: Back Button + Contact Info + CRM Button */}
          <View className="flex-row items-center py-1">
            <Pressable
              className="w-9 h-9 rounded-full justify-center items-center mr-1.5 -ml-1 active:bg-white/10"
              onPress={handleBack}
              hitSlop={{ top: 12, bottom: 12, left: 16, right: 12 }}
            >
              <Ionicons
                name="chevron-back"
                size={26}
                color="#0084FF"
              />
            </Pressable>

            {/* Avatar & Contact Info Clickable to Drawer */}
            <Pressable
              className="flex-1 flex-row items-center"
              onPress={() => setShowContactDrawer(true)}
            >
              <View className="w-9 h-9 rounded-full bg-[#0084FF] justify-center items-center mr-2.5">
                <Text className="text-white text-base font-bold">
                  {conversation?.contact?.name ? conversation.contact.name.charAt(0).toUpperCase() : 'W'}
                </Text>
              </View>

              <View className="flex-1">
                <View className="flex-row items-center gap-1">
                  <Text
                    className="text-[15px] font-semibold text-white tracking-tight"
                    numberOfLines={1}
                  >
                    {conversation?.contact?.name || 'WhatsApp Contact'}
                  </Text>
                  <Ionicons name="shield-checkmark" size={13} color="#34C759" />
                </View>
                <Text
                  className="text-xs text-slate-400 mt-0.5"
                  numberOfLines={1}
                >
                  +{conversation?.contact?.handle_or_phone || ''}
                </Text>
              </View>
            </Pressable>

            {/* Quick Actions (+ CRM) */}
            <View className="flex-row items-center gap-1.5">
              <Pressable
                className="flex-row items-center bg-[#5856D6] px-2.5 py-1.5 rounded-full active:opacity-75"
                onPress={() => setShowCrmModal(true)}
              >
                <Ionicons name="briefcase-outline" size={12} color="#FFFFFF" style={{ marginRight: 3 }} />
                <Text className="text-white text-xs font-semibold">+ CRM</Text>
              </Pressable>
            </View>
          </View>

          {/* Sub-Header Horizontal Status Capsules */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="flex-row items-center gap-1.5 pt-2 pb-1"
          >
            {/* 24-Hour Meta Window Badge */}
            <Pressable
              className={`flex-row items-center gap-1 px-2 py-1 rounded-xl ${
                isWindowExpired ? 'bg-rose-500/15' : 'bg-emerald-500/15'
              }`}
              onPress={() => setShowGuideModal(true)}
            >
              <Ionicons
                name={isWindowExpired ? 'alert-circle' : 'time-outline'}
                size={12}
                color={isWindowExpired ? '#FF3B30' : '#34C759'}
              />
              <Text
                className={`text-[11px] font-semibold ${
                  isWindowExpired ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {isWindowExpired ? '24h Window Closed' : timeRemainingStr}
              </Text>
              <Ionicons
                name="information-circle-outline"
                size={11}
                color={isWindowExpired ? '#FF3B30' : '#34C759'}
              />
            </Pressable>

            {/* Bot Active / Paused Switch */}
            <Pressable
              className={`flex-row items-center gap-1 px-2 py-1 rounded-xl ${
                isBotPaused ? 'bg-amber-500/15' : 'bg-blue-500/15'
              }`}
              onPress={toggleBot}
            >
              <Ionicons
                name={isBotPaused ? 'pause-circle-outline' : 'sparkles'}
                size={12}
                color={isBotPaused ? '#FF9500' : '#0084FF'}
              />
              <Text
                className={`text-[11px] font-semibold ${
                  isBotPaused ? 'text-amber-400' : 'text-sky-400'
                }`}
              >
                {isBotPaused ? 'Bot Paused' : 'Bot Active'}
              </Text>
            </Pressable>

            {/* Assigned Agent Button */}
            <Pressable
              className="flex-row items-center gap-1 px-2 py-1 rounded-xl bg-white/10"
              onPress={() => setShowAgentModal(true)}
            >
              <Ionicons
                name="person-outline"
                size={11}
                color="#94a3b8"
              />
              <Text
                className="text-[11px] font-semibold text-slate-300"
                numberOfLines={1}
              >
                {assignedAgentName}
              </Text>
              <Ionicons
                name="chevron-down"
                size={10}
                color="#94a3b8"
              />
            </Pressable>
          </ScrollView>
        </View>

        {/* Chat Message List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          className="bg-[#0B0D10]"
          contentContainerClassName="px-3 py-3 flex-grow"
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center p-8 mt-12">
              <View className="w-16 h-16 rounded-full justify-center items-center mb-3 bg-[#181A1F] border border-[#262930]">
                <Ionicons name="chatbubbles" size={32} color="#64748b" />
              </View>
              <Text className="text-base font-semibold text-white">
                No messages in this chat yet
              </Text>
              <Text className="text-[13px] text-center mt-1.5 leading-[18px] text-slate-400">
                Send a message or record an internal note to start communicating with this customer.
              </Text>
            </View>
          }
        />

        {/* WhatsApp Composer Bar */}
        <View
          className={`border-t px-3 pt-1.5 ${
            isInternalNote
              ? 'bg-[#24180A] border-amber-900/50'
              : 'bg-[#181A1F] border-[#262930]'
          }`}
          style={{ paddingBottom: composerBottomPadding }}
        >
          {/* Segmented Mode Selector */}
          <View className="flex-row rounded-lg p-0.5 mb-1.5 bg-[#111317] border border-[#262930]">
            <Pressable
              className={`flex-1 flex-row items-center justify-center py-1.5 rounded-md ${
                !isInternalNote ? 'bg-[#181A1F]' : ''
              }`}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                setIsInternalNote(false);
              }}
            >
              <Ionicons
                name={isWindowExpired ? 'lock-closed' : 'logo-whatsapp'}
                size={13}
                color={!isInternalNote ? (isWindowExpired ? '#FF9500' : '#34C759') : '#94a3b8'}
                style={{ marginRight: 5 }}
              />
              <Text
                className={`text-[12.5px] tracking-tight ${
                  !isInternalNote ? 'text-white font-semibold' : 'text-slate-400 font-medium'
                }`}
              >
                {isWindowExpired ? 'WhatsApp (Closed)' : 'WhatsApp Reply'}
              </Text>
            </Pressable>

            <Pressable
              className={`flex-1 flex-row items-center justify-center py-1.5 rounded-md ${
                isInternalNote ? 'bg-amber-950/60' : ''
              }`}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                setIsInternalNote(true);
              }}
            >
              <Ionicons
                name="bookmark"
                size={13}
                color={isInternalNote ? '#FF9500' : '#94a3b8'}
                style={{ marginRight: 5 }}
              />
              <Text
                className={`text-[12.5px] tracking-tight ${
                  isInternalNote ? 'text-amber-400 font-semibold' : 'text-slate-400 font-medium'
                }`}
              >
                Internal Note
              </Text>
            </Pressable>
          </View>

          {/* Interaction Area */}
          {isWindowExpired && !isInternalNote ? (
            <View className="rounded-2xl p-3 border bg-amber-500/10 border-amber-500/25">
              <View className="flex-row justify-between items-center mb-1">
                <View className="flex-row items-center">
                  <Ionicons name="lock-closed" size={14} color="#FF9500" style={{ marginRight: 6 }} />
                  <Text className="text-[13px] font-bold text-white">
                    24h Messaging Window Closed
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowGuideModal(true)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text className="text-xs font-semibold text-[#0084FF]">
                    Policy ℹ️
                  </Text>
                </Pressable>
              </View>

              <Text className="text-xs leading-4 mb-2.5 text-slate-400">
                Freeform replies are locked by Meta. Customer must reply, or send an approved WhatsApp Template.
              </Text>

              <View className="flex-row">
                <Pressable
                  className="flex-row items-center justify-center bg-amber-500 py-2 px-3 rounded-xl flex-1 active:opacity-80"
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.selectionAsync();
                    setIsInternalNote(true);
                  }}
                >
                  <Ionicons name="bookmark" size={14} color="#000000" style={{ marginRight: 6 }} />
                  <Text className="text-black text-[12.5px] font-bold">Write Internal Note</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View>
              {isInternalNote && (
                <View className="flex-row items-center mb-1 px-1">
                  <Ionicons name="eye-off-outline" size={12} color="#FFB340" style={{ marginRight: 4 }} />
                  <Text className="text-[11px] font-semibold text-amber-400">
                    Team Note (Private • Customer won't see this)
                  </Text>
                </View>
              )}

              <View
                className={`flex-row items-center rounded-2xl px-3 py-1 border min-h-[40px] ${
                  isInternalNote
                    ? 'bg-[#3D2810] border-[#5C3D18]'
                    : 'bg-[#111317] border-[#262930]'
                }`}
              >
                <TextInput
                  className="flex-1 text-[15px] max-h-[90px] py-1.5 text-white"
                  placeholder={
                    isInternalNote
                      ? 'Write a private note for your team...'
                      : 'Type a message...'
                  }
                  placeholderTextColor="#64748b"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                />

                <Pressable
                  className={`w-8 h-8 rounded-full justify-center items-center ml-1.5 ${
                    !inputText.trim()
                      ? 'bg-[#262930]'
                      : isInternalNote
                      ? 'bg-amber-500'
                      : 'bg-[#0084FF]'
                  } active:opacity-70`}
                  disabled={!inputText.trim() || sendMutation.isPending}
                  onPress={handleSend}
                >
                  {sendMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons
                      name={isInternalNote ? 'bookmark' : 'arrow-up'}
                      size={18}
                      color="#FFFFFF"
                    />
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Agent Assignment Modal */}
        <Modal
          visible={showAgentModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAgentModal(false)}
        >
          <View className="flex-1 bg-black/60 justify-end">
            <View className="rounded-t-3xl p-4 bg-[#181A1F] border-t border-[#262930] max-h-[75%]">
              <View className="flex-row justify-between items-start mb-3">
                <View>
                  <Text className="text-[17px] font-bold text-white">Assign Agent</Text>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    Route this conversation to a team member.
                  </Text>
                </View>
                <Pressable onPress={() => setShowAgentModal(false)} hitSlop={12}>
                  <Ionicons name="close-circle" size={24} color="#94a3b8" />
                </Pressable>
              </View>

              {/* Assign to Me Button */}
              <Pressable
                className="flex-row items-center p-3 rounded-xl mb-2 gap-2.5 bg-[#111317] border border-[#262930] active:opacity-75"
                onPress={handleAssignToMe}
              >
                <View className="w-8 h-8 rounded-full bg-[#0084FF]/15 justify-center items-center">
                  <Ionicons name="person" size={16} color="#0084FF" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-white">
                    Assign to Me
                  </Text>
                  <Text className="text-[11px] text-slate-400 mt-0.5">
                    {user?.email || 'Logged in user'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
              </Pressable>

              {/* Unassign Button */}
              <Pressable
                className="flex-row items-center p-3 rounded-xl mb-2 gap-2.5 bg-[#111317] border border-[#262930] active:opacity-75"
                onPress={() => handleAssignAgent(null)}
              >
                <View className="w-8 h-8 rounded-full bg-[#262930] justify-center items-center">
                  <Ionicons name="close-circle-outline" size={16} color="#94a3b8" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-white">
                    Mark as Unassigned
                  </Text>
                  <Text className="text-[11px] text-slate-400 mt-0.5">
                    Open to any agent in inbox queue
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
              </Pressable>

              {/* Organization Team Members List */}
              <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-2.5 mb-2">
                Team Members
              </Text>
              <ScrollView className="max-h-[220px]" showsVerticalScrollIndicator={false}>
                {(teamMembers || []).map((member) => (
                  <Pressable
                    key={member.id}
                    className="flex-row items-center py-2.5 border-b border-[#262930] active:opacity-75"
                    onPress={() => handleAssignAgent(member)}
                  >
                    <View className="w-8 h-8 rounded-full bg-[#5856D6] justify-center items-center mr-2.5">
                      <Text className="text-white text-xs font-bold">
                        {member.name ? member.name.charAt(0).toUpperCase() : 'A'}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-white">
                        {member.name}
                      </Text>
                      <Text className="text-[11px] text-slate-400 mt-0.5">
                        {member.email}
                      </Text>
                    </View>
                    <View className="px-1.5 py-0.5 rounded-md bg-[#111317] border border-[#262930]">
                      <Text className="text-[10px] font-semibold uppercase text-slate-400">
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

        {/* Meta 24-Hour Customer Window Policy Modal */}
        <Modal
          visible={showGuideModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowGuideModal(false)}
        >
          <View className="flex-1 bg-black/60 justify-center p-5">
            <View className="rounded-3xl p-5 bg-[#181A1F] border border-[#262930] max-h-[80%]">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="shield-checkmark" size={22} color="#34C759" />
                  <Text className="text-[17px] font-bold text-white">
                    Meta 24-Hour Rule
                  </Text>
                </View>
                <Pressable onPress={() => setShowGuideModal(false)} hitSlop={12}>
                  <Ionicons name="close-circle" size={24} color="#94a3b8" />
                </Pressable>
              </View>

              <ScrollView className="max-h-[340px]" showsVerticalScrollIndicator={false}>
                <View className="rounded-2xl p-3 mb-2.5 bg-[#111317] border border-[#262930]">
                  <Text className="text-emerald-400 text-[13.5px] font-bold mb-1">⏱️ How the 24h Window Works</Text>
                  <Text className="text-xs leading-[17px] text-slate-400">
                    Meta WhatsApp allows businesses to send freeform messages to customers only within 24 hours of their last incoming message.
                  </Text>
                </View>

                <View className="rounded-2xl p-3 mb-2.5 bg-[#111317] border border-[#262930]">
                  <Text className="text-emerald-400 text-[13.5px] font-bold mb-1">🔒 When the Window Closes</Text>
                  <Text className="text-xs leading-[17px] text-slate-400">
                    After 24 hours with no customer reply, free-form text is locked by Meta. You must send an approved template to restart the conversation.
                  </Text>
                </View>

                <View className="rounded-2xl p-3 mb-2.5 bg-[#111317] border border-[#262930]">
                  <Text className="text-emerald-400 text-[13.5px] font-bold mb-1">💡 Internal Team Notes</Text>
                  <Text className="text-xs leading-[17px] text-slate-400">
                    Team notes can be added anytime. They are 100% private to your organization and never sent to WhatsApp.
                  </Text>
                </View>
              </ScrollView>

              <Pressable
                className="bg-[#0084FF] py-2.5 rounded-xl items-center mt-2.5 active:opacity-85"
                onPress={() => setShowGuideModal(false)}
              >
                <Text className="text-white font-semibold text-sm">Got it</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Contact Profile & Quick Details Drawer */}
        <Modal
          visible={showContactDrawer}
          transparent
          animationType="slide"
          onRequestClose={() => setShowContactDrawer(false)}
        >
          <View className="flex-1 bg-black/60 justify-end">
            <View className="rounded-t-3xl p-5 bg-[#181A1F] border-t border-[#262930] max-h-[80%]">
              <View className="flex-row justify-between items-start mb-3">
                <Text className="text-[17px] font-bold text-white">Contact Details</Text>
                <Pressable onPress={() => setShowContactDrawer(false)} hitSlop={12}>
                  <Ionicons name="close-circle" size={24} color="#94a3b8" />
                </Pressable>
              </View>

              <View className="items-center py-3.5 border-b border-[#262930]">
                <View className="w-14 h-14 rounded-full bg-[#0084FF] justify-center items-center mb-2">
                  <Text className="text-white text-[22px] font-bold">
                    {conversation?.contact?.name ? conversation.contact.name.charAt(0).toUpperCase() : 'C'}
                  </Text>
                </View>
                <Text className="text-[17px] font-bold text-white">
                  {conversation?.contact?.name}
                </Text>
                <Text className="text-[13px] text-slate-400 mt-0.5">
                  +{conversation?.contact?.handle_or_phone}
                </Text>
              </View>

              <View className="mt-3.5 gap-2">
                <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Status Overview
                </Text>
                <View className="flex-row justify-between py-1">
                  <Text className="text-[13px] text-slate-400">
                    Messaging Window
                  </Text>
                  <Text
                    className={`text-[13px] font-semibold ${
                      isWindowExpired ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {isWindowExpired ? 'Closed (>24h)' : `Open (${timeRemainingStr})`}
                  </Text>
                </View>
                <View className="flex-row justify-between py-1">
                  <Text className="text-[13px] text-slate-400">
                    Assigned Agent
                  </Text>
                  <Text className="text-[13px] font-semibold text-white">
                    {assignedAgentName}
                  </Text>
                </View>
                <View className="flex-row justify-between py-1">
                  <Text className="text-[13px] text-slate-400">
                    AI Bot Auto-Reply
                  </Text>
                  <Text className="text-[13px] font-semibold text-white">
                    {isBotPaused ? 'Paused' : 'Active'}
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-2.5 mt-4.5">
                <Pressable
                  className="flex-1 flex-row items-center justify-center bg-[#5856D6] py-2.5 rounded-xl active:opacity-85"
                  onPress={() => {
                    setShowContactDrawer(false);
                    setShowCrmModal(true);
                  }}
                >
                  <Ionicons name="briefcase-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text className="text-white font-semibold text-[13px]">Create CRM Lead</Text>
                </Pressable>

                <Pressable
                  className="flex-1 flex-row items-center justify-center border border-[#0084FF] bg-[#111317] py-2.5 rounded-xl active:opacity-85"
                  onPress={() => {
                    const phone = (conversation?.contact?.handle_or_phone || '').replace(/\D+/g, '');
                    if (phone) Linking.openURL(`tel:+${phone}`).catch(() => {});
                  }}
                >
                  <Ionicons name="call-outline" size={16} color="#0084FF" style={{ marginRight: 6 }} />
                  <Text className="text-[#0084FF] font-semibold text-[13px]">Call Phone</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* CRM Lead Conversion Modal */}
        <Modal
          visible={showCrmModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCrmModal(false)}
        >
          <View className="flex-1 bg-black/60 justify-center p-5">
            <View className="rounded-3xl p-5 bg-[#181A1F] border border-[#262930]">
              <Text className="text-[17px] font-bold text-white">
                Convert Contact to Lead
              </Text>
              <Text className="text-xs text-slate-400 mt-0.5">
                Create an instant sales opportunity in CRM pipeline.
              </Text>

              {leadCreatedSuccess ? (
                <View className="items-center py-5 gap-2.5">
                  <Ionicons name="checkmark-circle" size={40} color="#34C759" />
                  <Text className="text-[#34C759] text-[15px] font-semibold">Lead Created Successfully!</Text>
                </View>
              ) : (
                <View className="mt-2.5">
                  <Text className="text-[11.5px] font-semibold text-slate-400 mt-2 mb-1">
                    Contact Name
                  </Text>
                  <View className="p-2.5 rounded-lg border bg-[#111317] border-[#262930]">
                    <Text className="text-[13px] text-white">
                      {conversation?.contact?.name}
                    </Text>
                  </View>

                  <Text className="text-[11.5px] font-semibold text-slate-400 mt-2 mb-1">
                    Phone Number
                  </Text>
                  <View className="p-2.5 rounded-lg border bg-[#111317] border-[#262930]">
                    <Text className="text-[13px] text-white">
                      {conversation?.contact?.handle_or_phone}
                    </Text>
                  </View>

                  <Text className="text-[11.5px] font-semibold text-slate-400 mt-2 mb-1">
                    Expected Deal Value (₹)
                  </Text>
                  <TextInput
                    className="p-2.5 rounded-lg border text-sm font-semibold text-white bg-[#111317] border-[#262930]"
                    value={leadDealValue}
                    onChangeText={setLeadDealValue}
                    keyboardType="numeric"
                    placeholder="25000"
                    placeholderTextColor="#64748b"
                  />

                  <View className="flex-row justify-end gap-2.5 mt-4">
                    <Pressable
                      className="px-3.5 py-2 active:opacity-75"
                      onPress={() => setShowCrmModal(false)}
                    >
                      <Text className="text-[13px] text-slate-400">
                        Cancel
                      </Text>
                    </Pressable>
                    <Pressable
                      className="bg-[#5856D6] px-4 py-2 rounded-xl active:opacity-85"
                      onPress={() => createLeadFromContactMutation.mutate()}
                      disabled={createLeadFromContactMutation.isPending}
                    >
                      {createLeadFromContactMutation.isPending ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text className="text-white font-semibold text-[13px]">Create Lead</Text>
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
