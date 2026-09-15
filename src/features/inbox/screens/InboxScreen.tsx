import React, { useState, useMemo } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/store/authStore';
import { inboxApi } from '../api/inboxApi';
import { ConversationCard } from '../components';
import { useInboxWebSocket } from '../hooks/useInboxWebSocket';
import { ContactItem, NormalizedConversation } from '../types';
import { SkeletonCircle, SkeletonRow, SkeletonText } from '../../../components/Skeleton';
import { InboxListSkeleton } from '../../../components/skeletonScreen';
import { ConversationScreen } from './ConversationScreen';

export const InboxScreen: React.FC = () => {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'UNASSIGNED' | 'MINE' | 'BOT_ACTIVE'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeConversation, setActiveConversation] = useState<NormalizedConversation | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState<boolean>(false);
  const [contactSearchQuery, setContactSearchQuery] = useState<string>('');

  const user = useAuthStore((s) => s.user);

  // Realtime Global Inbox WebSocket Subscription
  useInboxWebSocket();

  // Fetch conversations
  const { data: conversations, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['conversations', searchQuery],
    queryFn: () => inboxApi.getConversations('all', 'all', searchQuery),
    staleTime: 5000,
  });

  // Fetch contacts for New Chat
  const { data: contacts, isLoading: isLoadingContacts } = useQuery({
    queryKey: ['inbox_contacts'],
    queryFn: () => inboxApi.getContacts(),
    staleTime: 30000,
  });

  const convList = conversations || [];

  // Filter conversations according to selected tab
  const filteredConversations = useMemo(() => {
    return convList.filter((conv) => {
      if (activeTab === 'UNASSIGNED') {
        return !conv.assigned_to && !conv.assigned_agent_name;
      }
      if (activeTab === 'MINE') {
        const myName = user?.name || user?.email?.split('@')[0] || '';
        const myId = user?.id || '';
        return (
          (conv.assigned_to && (conv.assigned_to === myName || conv.assigned_to === myId)) ||
          (conv.assigned_agent_name && conv.assigned_agent_name === myName)
        );
      }
      if (activeTab === 'BOT_ACTIVE') {
        return conv.bot_enabled !== false && !conv.bot_paused;
      }
      if (activeTab === 'UNREAD') {
        return conv.unread_count > 0;
      }
      return true;
    });
  }, [convList, activeTab, user]);

  const filteredContacts = useMemo(() => {
    return (contacts || []).filter((cnt) => {
      if (!contactSearchQuery) return true;
      const q = contactSearchQuery.toLowerCase();
      const name = (cnt.name || cnt.custom_name || '').toLowerCase();
      const phone = cnt.phone || cnt.wa_id || '';
      return name.includes(q) || phone.includes(q);
    });
  }, [contacts, contactSearchQuery]);

  const unreadTotal = convList.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  const handleStartChatWithContact = async (contact: ContactItem) => {
    setShowNewChatModal(false);
    try {
      const res = await inboxApi.startConversation(contact.id);
      const newConv: NormalizedConversation = {
        id: res.id,
        organization_id: user?.organizationId || '',
        contact: {
          name: contact.name || contact.custom_name || contact.phone,
          handle_or_phone: contact.phone || contact.wa_id || '',
        },
        channel: 'whatsapp',
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
      // Direct open fallback
      const fallbackConv: NormalizedConversation = {
        id: `conv_${contact.id}`,
        organization_id: user?.organizationId || '',
        contact: {
          name: contact.name || contact.custom_name || contact.phone,
          handle_or_phone: contact.phone || contact.wa_id || '',
        },
        channel: 'whatsapp',
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

  const handleOpenConversation = (item: NormalizedConversation) => {
    // 1. Optimistically clear unread_count in React Query cache so badges clear immediately
    queryClient.setQueriesData<NormalizedConversation[]>({ queryKey: ['conversations'] }, (old) => {
      if (!old) return old;
      return old.map((c) => (c.id === item.id ? { ...c, unread_count: 0 } : c));
    });

    // 2. Set active conversation with unread_count: 0
    setActiveConversation({ ...item, unread_count: 0 });

    // 3. Mark as read on the backend
    if (item.unread_count > 0) {
      inboxApi.markAsRead(item.id);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0B0D10]">
      <View className="flex-1 px-3.5">
        {/* Header Bar */}
        <View className="flex-row justify-between items-center mt-2 mb-3.5">
          <View>
            <Text className="text-[22px] font-extrabold text-white">WhatsApp LiveChat</Text>
            <Text className="text-xs text-slate-400 mt-0.5">Omnichannel Customer Inbox</Text>
          </View>
          <View className="flex-row items-center gap-2">
            {unreadTotal > 0 && (
              <View className="bg-emerald-600 px-2 py-0.5 rounded-lg">
                <Text className="text-white text-[10.5px] font-extrabold">{unreadTotal} Unread</Text>
              </View>
            )}
            <Pressable
              className="flex-row items-center bg-[#0084FF] px-3 py-1.5 rounded-xl active:opacity-85"
              onPress={() => setShowNewChatModal(true)}
            >
              <Ionicons name="chatbubble-ellipses" size={15} color="#ffffff" style={{ marginRight: 5 }} />
              <Text className="text-white text-xs font-bold">+ New Chat</Text>
            </Pressable>
          </View>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center rounded-xl px-3 py-2.5 bg-[#111317] border border-[#262930] mb-2.5">
          <Ionicons name="search" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            className="flex-1 text-[13.5px] text-white p-0"
            placeholder="Search contacts, numbers or messages..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </Pressable>
          ) : null}
        </View>

        {/* Filter Tabs Horizontal Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-grow-0 mb-3">
          {[
            { id: 'ALL', label: 'All Chats', icon: 'chatbubbles' },
            { id: 'UNREAD', label: 'Unread', icon: 'mail-unread' },
            { id: 'UNASSIGNED', label: 'Unassigned', icon: 'person-add' },
            { id: 'MINE', label: 'Assigned to Me', icon: 'person' },
            { id: 'BOT_ACTIVE', label: 'AI Active', icon: 'hardware-chip' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                className={`flex-row items-center px-3 py-1.5 rounded-full mr-1.5 border ${
                  isActive
                    ? 'bg-[#0084FF] border-[#0084FF]'
                    : 'bg-[#181A1F] border-[#262930]'
                }`}
                onPress={() => setActiveTab(tab.id as any)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={13}
                  color={isActive ? '#ffffff' : '#94a3b8'}
                  style={{ marginRight: 5 }}
                />
                <Text
                  className={`text-[11.5px] ${
                    isActive ? 'text-white font-extrabold' : 'text-slate-400 font-semibold'
                  }`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Conversation List */}
        {isLoading && !conversations ? (
          <InboxListSkeleton />
        ) : (
          <FlatList
            data={filteredConversations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ConversationCard
                conversation={item}
                onPress={() => handleOpenConversation(item)}
              />
            )}
            contentContainerClassName="pb-28"
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#0084FF" />
            }
            ListEmptyComponent={
              <View className="py-10 px-4 items-center">
                <Ionicons name="chatbubble-ellipses-outline" size={48} color="#334155" />
                <Text className="text-[15px] font-bold text-white mt-2.5 mb-1.5">
                  No conversations found
                </Text>
                <Text className="text-[12.5px] text-center leading-[18px] text-slate-400">
                  {activeTab !== 'ALL'
                    ? `No conversations match the '${activeTab}' filter.`
                    : 'Incoming messages from WhatsApp customers will appear here in real time.'}
                </Text>
                <Pressable
                  className="flex-row items-center bg-[#0084FF] px-3.5 py-2 rounded-xl mt-3.5 active:opacity-85"
                  onPress={() => setShowNewChatModal(true)}
                >
                  <Ionicons name="add" size={16} color="#ffffff" style={{ marginRight: 4 }} />
                  <Text className="text-white text-[12.5px] font-bold">Start New Conversation</Text>
                </Pressable>
              </View>
            }
          />
        )}

        {/* Start New Chat / Contact Picker Modal */}
        <Modal
          visible={showNewChatModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowNewChatModal(false)}
        >
          <View className="flex-1 bg-black/60 justify-end">
            <View className="rounded-t-3xl p-4 bg-[#181A1F] border-t border-[#262930] max-h-[80%]">
              <View className="flex-row justify-between items-start mb-3">
                <View>
                  <Text className="text-[17px] font-extrabold text-white">
                    Start New WhatsApp Chat
                  </Text>
                  <Text className="text-xs text-slate-400 mt-0.5 leading-4">
                    Select a contact from your workspace to open live chat.
                  </Text>
                </View>
                <Pressable onPress={() => setShowNewChatModal(false)} hitSlop={10}>
                  <Ionicons name="close" size={24} color="#94a3b8" />
                </Pressable>
              </View>

              {/* Search Contacts */}
              <View className="flex-row items-center rounded-xl px-3 py-2 bg-[#111317] border border-[#262930] mb-2.5">
                <Ionicons name="search" size={15} color="#94a3b8" style={{ marginRight: 8 }} />
                <TextInput
                  className="flex-1 text-[13px] text-white p-0"
                  placeholder="Search contacts by name or phone..."
                  placeholderTextColor="#64748b"
                  value={contactSearchQuery}
                  onChangeText={setContactSearchQuery}
                />
              </View>

              {/* Contacts List */}
              <ScrollView className="max-h-[360px]" showsVerticalScrollIndicator={false}>
                {isLoadingContacts ? (
                  <View className="py-2.5">
                    {[1, 2, 3].map((i) => (
                      <SkeletonRow key={i} className="py-2.5 px-3">
                        <SkeletonCircle size={40} className="mr-3" />
                        <View className="flex-1">
                          <SkeletonText width={120} height={14} className="mb-1.5" />
                          <SkeletonText width={160} height={11} />
                        </View>
                      </SkeletonRow>
                    ))}
                  </View>
                ) : filteredContacts.length === 0 ? (
                  <View className="p-5 items-center">
                    <Text className="text-slate-400 text-[13px]">No contacts found</Text>
                  </View>
                ) : (
                  filteredContacts.map((cnt) => (
                    <Pressable
                      key={cnt.id}
                      className="flex-row items-center p-3 rounded-xl mb-2 bg-[#111317] border border-[#262930] active:opacity-75"
                      onPress={() => handleStartChatWithContact(cnt)}
                    >
                      <View className="w-9 h-9 rounded-full bg-[#0084FF] justify-center items-center mr-2.5">
                        <Text className="text-white text-[15px] font-bold">
                          {cnt.name ? cnt.name.charAt(0).toUpperCase() : 'C'}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-bold text-white">
                          {cnt.name || cnt.custom_name || 'Contact'}
                        </Text>
                        <Text className="text-[11.5px] text-slate-400 mt-0.5">
                          +{cnt.phone || cnt.wa_id}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                    </Pressable>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Fullscreen WhatsApp Conversation Modal */}
        <Modal
          visible={!!activeConversation}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => {
            setActiveConversation(null);
            refetch();
          }}
        >
          {activeConversation && (
            <ConversationScreen
              conversation={activeConversation}
              onBack={() => {
                setActiveConversation(null);
                refetch();
              }}
            />
          )}
        </Modal>
      </View>
    </SafeAreaView>
  );
};
