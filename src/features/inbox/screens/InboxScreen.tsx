import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../core/store/authStore';
import { inboxApi } from '../api/inboxApi';
import { ConversationCard } from '../components/ConversationCard';
import { useInboxWebSocket } from '../hooks/useInboxWebSocket';
import { NormalizedConversation } from '../types';
import { ConversationScreen } from './ConversationScreen';

export const InboxScreen: React.FC = () => {
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeConversation, setActiveConversation] = useState<NormalizedConversation | null>(null);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Realtime Global Inbox WebSocket Subscription
  useInboxWebSocket();

  const { data: conversations, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['conversations', selectedChannel, selectedStatus, searchQuery],
    queryFn: () => inboxApi.getConversations(selectedChannel, selectedStatus, searchQuery),
    enabled: isAuthenticated,
    staleTime: 10000,
  });

  const channels: Array<{ id: string; label: string; icon: string }> = [
    { id: 'all', label: 'All Channels', icon: '🌐' },
    { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
    { id: 'telegram', label: 'Telegram', icon: '✈️' },
    { id: 'instagram', label: 'Instagram', icon: '📸' },
    { id: 'facebook', label: 'Facebook', icon: '👤' },
  ];

  if (activeConversation) {
    return (
      <ConversationScreen
        conversation={activeConversation}
        onBack={() => {
          setActiveConversation(null);
          refetch();
        }}
      />
    );
  }

  const convList = conversations || [];
  const unreadTotal = convList.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Screen Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Unified Inbox</Text>
            <Text style={styles.subtitle}>Omnichannel Conversations</Text>
          </View>
          {unreadTotal > 0 && (
            <View style={styles.unreadTotalBadge}>
              <Text style={styles.unreadTotalText}>{unreadTotal} Unread</Text>
            </View>
          )}
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts, numbers or message content..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Channel Filter Horizontal Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.channelScroll}>
          {channels.map((ch) => (
            <Pressable
              key={ch.id}
              style={[styles.channelPill, selectedChannel === ch.id && styles.activeChannelPill]}
              onPress={() => setSelectedChannel(ch.id)}
            >
              <Text style={styles.channelIcon}>{ch.icon}</Text>
              <Text
                style={[
                  styles.channelText,
                  selectedChannel === ch.id && styles.activeChannelText,
                ]}
              >
                {ch.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Conversation List */}
        {isLoading && !conversations ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Syncing omnichannel conversations...</Text>
          </View>
        ) : (
          <FlatList
            data={convList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ConversationCard
                conversation={item}
                onPress={() => setActiveConversation(item)}
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6366f1" />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyTitle}>No conversations found</Text>
                <Text style={styles.emptySubtitle}>
                  Incoming messages from WhatsApp, Telegram, Instagram & Facebook will appear here in real-time.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020617',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  title: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 2,
  },
  unreadTotalBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadTotalText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 14,
  },
  clearIcon: {
    color: '#94a3b8',
    fontSize: 14,
    padding: 4,
  },
  channelScroll: {
    flexGrow: 0,
    marginBottom: 14,
  },
  channelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0f172a',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  activeChannelPill: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  channelIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  channelText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  activeChannelText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});

