import React, { useState, useMemo } from 'react';
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
  useColorScheme,
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
import { ConversationScreen } from './ConversationScreen';

export const InboxScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#0b141a' : '#f8fafc' }]}>
      <View style={styles.container}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: isDark ? '#e9edef' : '#0f172a' }]}>WhatsApp LiveChat</Text>
            <Text style={[styles.subtitle, { color: isDark ? '#8696a0' : '#64748b' }]}>Omnichannel Customer Inbox</Text>
          </View>
          <View style={styles.headerRightActions}>
            {unreadTotal > 0 && (
              <View style={styles.unreadTotalBadge}>
                <Text style={styles.unreadTotalText}>{unreadTotal} Unread</Text>
              </View>
            )}
            <Pressable
              style={styles.newChatBtn}
              onPress={() => setShowNewChatModal(true)}
            >
              <Ionicons name="chatbubble-ellipses" size={15} color="#ffffff" style={{ marginRight: 5 }} />
              <Text style={styles.newChatBtnText}>+ New Chat</Text>
            </Pressable>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBar, isDark ? styles.searchBarDark : styles.searchBarLight]}>
          <Ionicons name="search" size={16} color={isDark ? '#8696a0' : '#94a3b8'} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: isDark ? '#e9edef' : '#0f172a' }]}
            placeholder="Search contacts, numbers or messages..."
            placeholderTextColor={isDark ? '#8696a0' : '#94a3b8'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
              <Ionicons name="close-circle" size={16} color={isDark ? '#8696a0' : '#94a3b8'} />
            </Pressable>
          ) : null}
        </View>

        {/* Filter Tabs Horizontal Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
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
                style={[
                  styles.tabPill,
                  isDark ? styles.tabPillDark : styles.tabPillLight,
                  isActive && styles.activeTabPill,
                ]}
                onPress={() => setActiveTab(tab.id as any)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={13}
                  color={isActive ? '#ffffff' : isDark ? '#8696a0' : '#64748b'}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.tabText,
                    { color: isActive ? '#ffffff' : isDark ? '#8696a0' : '#64748b' },
                    isActive && styles.activeTabText,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Conversation List */}
        {isLoading && !conversations ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00a884" />
            <Text style={[styles.loadingText, { color: isDark ? '#8696a0' : '#64748b' }]}>
              Syncing WhatsApp conversations...
            </Text>
          </View>
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
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#00a884" />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubble-ellipses-outline" size={48} color={isDark ? '#334155' : '#cbd5e1'} />
                <Text style={[styles.emptyTitle, { color: isDark ? '#e9edef' : '#0f172a' }]}>
                  No conversations found
                </Text>
                <Text style={[styles.emptySubtitle, { color: isDark ? '#8696a0' : '#64748b' }]}>
                  {activeTab !== 'ALL'
                    ? `No conversations match the '${activeTab}' filter.`
                    : 'Incoming messages from WhatsApp customers will appear here in real time.'}
                </Text>
                <Pressable
                  style={styles.emptyNewChatBtn}
                  onPress={() => setShowNewChatModal(true)}
                >
                  <Ionicons name="add" size={16} color="#ffffff" style={{ marginRight: 4 }} />
                  <Text style={styles.emptyNewChatBtnText}>Start New Conversation</Text>
                </Pressable>
              </View>
            }
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* Start New Chat / Contact Picker Modal */}
        {/* ------------------------------------------------------------- */}
        <Modal
          visible={showNewChatModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowNewChatModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.newChatModalBox, isDark ? styles.modalBoxDark : styles.modalBoxLight]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: isDark ? '#e9edef' : '#0f172a' }]}>
                    Start New WhatsApp Chat
                  </Text>
                  <Text style={[styles.modalSub, { color: isDark ? '#8696a0' : '#64748b' }]}>
                    Select a contact from your workspace to open live chat.
                  </Text>
                </View>
                <Pressable onPress={() => setShowNewChatModal(false)} hitSlop={10}>
                  <Ionicons name="close" size={24} color={isDark ? '#8696a0' : '#64748b'} />
                </Pressable>
              </View>

              {/* Search Contacts */}
              <View style={[styles.contactSearchBox, isDark ? styles.contactSearchDark : styles.contactSearchLight]}>
                <Ionicons name="search" size={15} color={isDark ? '#8696a0' : '#94a3b8'} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.contactSearchInput, { color: isDark ? '#e9edef' : '#0f172a' }]}
                  placeholder="Search contacts by name or phone..."
                  placeholderTextColor={isDark ? '#8696a0' : '#94a3b8'}
                  value={contactSearchQuery}
                  onChangeText={setContactSearchQuery}
                />
              </View>

              {/* Contacts List */}
              <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                {isLoadingContacts ? (
                  <ActivityIndicator size="small" color="#00a884" style={{ marginVertical: 20 }} />
                ) : filteredContacts.length === 0 ? (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: isDark ? '#8696a0' : '#64748b', fontSize: 13 }}>No contacts found</Text>
                  </View>
                ) : (
                  filteredContacts.map((cnt) => (
                    <Pressable
                      key={cnt.id}
                      style={[styles.contactItemRow, isDark ? styles.contactItemDark : styles.contactItemLight]}
                      onPress={() => handleStartChatWithContact(cnt)}
                    >
                      <View style={styles.contactItemAvatar}>
                        <Text style={styles.contactItemAvatarText}>
                          {cnt.name ? cnt.name.charAt(0).toUpperCase() : 'C'}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.contactItemName, { color: isDark ? '#e9edef' : '#0f172a' }]}>
                          {cnt.name || cnt.custom_name || 'Contact'}
                        </Text>
                        <Text style={[styles.contactItemPhone, { color: isDark ? '#8696a0' : '#64748b' }]}>
                          +{cnt.phone || cnt.wa_id}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={isDark ? '#8696a0' : '#94a3b8'} />
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unreadTotalBadge: {
    backgroundColor: '#00a884',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  unreadTotalText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '800',
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00a884',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  newChatBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchBarDark: {
    backgroundColor: '#111b21',
    borderColor: '#202c33',
  },
  searchBarLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
  },
  tabsScroll: {
    flexGrow: 0,
    marginBottom: 12,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
    borderWidth: 1,
  },
  tabPillDark: {
    backgroundColor: '#111b21',
    borderColor: '#202c33',
  },
  tabPillLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  activeTabPill: {
    backgroundColor: '#00a884',
    borderColor: '#00a884',
  },
  tabText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  listContent: {
    paddingBottom: 110,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    marginTop: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyNewChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00a884',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 14,
  },
  emptyNewChatBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  newChatModalBox: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    maxHeight: '80%',
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
  contactSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  contactSearchDark: {
    backgroundColor: '#111b21',
    borderColor: '#2a3942',
  },
  contactSearchLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  contactSearchInput: {
    flex: 1,
    fontSize: 13,
  },
  contactItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  contactItemDark: {
    backgroundColor: '#111b21',
    borderColor: '#2a3942',
  },
  contactItemLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  contactItemAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00a884',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  contactItemAvatarText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  contactItemName: {
    fontSize: 14,
    fontWeight: '700',
  },
  contactItemPhone: {
    fontSize: 11.5,
    marginTop: 2,
  },
});

