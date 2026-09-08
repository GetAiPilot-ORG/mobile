import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  TextInput,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { useAuth } from '../../src/contexts/AuthContext';

interface ChatThread {
  id: string;
  name: string;
  channel: 'whatsapp' | 'telegram' | 'voice' | 'crm';
  lastMessage: string;
  time: string;
  unreadCount: number;
  avatarBg: string;
}

const CHAT_THREADS: ChatThread[] = [
  {
    id: '1',
    name: 'Aarav Sharma (Enterprise Lead)',
    channel: 'whatsapp',
    lastMessage: 'Can you share the pricing sheet for 10,000 voice minutes?',
    time: '2m ago',
    unreadCount: 2,
    avatarBg: '#25D366',
  },
  {
    id: '2',
    name: 'Crypto Alpha Channel Bot',
    channel: 'telegram',
    lastMessage: 'Forwarded 14 messages with keyword filter: #VIP',
    time: '18m ago',
    unreadCount: 0,
    avatarBg: '#0088CC',
  },
  {
    id: '3',
    name: 'Rohan Varma (Inbound Call)',
    channel: 'voice',
    lastMessage: 'AI Voice Pilot completed qualification call (Duration: 2m 45s)',
    time: '1h ago',
    unreadCount: 1,
    avatarBg: '#8B5CF6',
  },
  {
    id: '4',
    name: 'Sneha Patel (Landing Page Lead)',
    channel: 'crm',
    lastMessage: 'Submitted QuickForm: "Enterprise Demo Request"',
    time: '3h ago',
    unreadCount: 0,
    avatarBg: '#F59E0B',
  },
  {
    id: '5',
    name: 'TechCorp Support Inquiries',
    channel: 'whatsapp',
    lastMessage: 'Auto-reply sent: "Welcome to GetAIPilot Support."',
    time: 'Yesterday',
    unreadCount: 0,
    avatarBg: '#25D366',
  },
];

const CHANNELS = [
  { key: 'all', label: 'All Inboxes' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'telegram', label: 'Telegram' },
  { key: 'voice', label: 'Voice AI' },
  { key: 'crm', label: 'CRM Leads' },
];

export default function InboxScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredThreads = CHAT_THREADS.filter((thread) => {
    const matchesChannel = selectedChannel === 'all' || thread.channel === selectedChannel;
    const matchesSearch =
      thread.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesChannel && matchesSearch;
  });

  const onRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleSelectChannel = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedChannel(key);
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return 'logo-whatsapp';
      case 'telegram':
        return 'paper-plane';
      case 'voice':
        return 'mic';
      case 'crm':
        return 'briefcase';
      default:
        return 'chatbubble';
    }
  };

  return (
    <AppScreen safeArea={false}>
      <AppTopBar title="Unified Inbox" subtitle="Multi-Channel Customer Stream" />

      <ScrollView
        style={[styles.scrollView, isDark ? styles.scrollViewDark : styles.scrollViewLight]}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? '#FFFFFF' : '#0A84FF'}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* iOS Native Search Field */}
        <View style={[styles.searchBarContainer, isDark && styles.searchBarContainerDark]}>
          <Ionicons name="search" size={16} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, isDark && styles.searchInputDark]}
            placeholder="Search conversations, prospects & logs..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color="#8E8E93" />
            </Pressable>
          )}
        </View>

        {/* Channel Filter Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.channelScroll}
        >
          {CHANNELS.map((ch) => {
            const isSelected = selectedChannel === ch.key;
            return (
              <Pressable
                key={ch.key}
                style={[
                  styles.channelChip,
                  isDark ? styles.channelChipDark : styles.channelChipLight,
                  isSelected && (isDark ? styles.channelChipActiveDark : styles.channelChipActiveLight),
                ]}
                onPress={() => handleSelectChannel(ch.key)}
              >
                <Text
                  style={[
                    styles.channelChipText,
                    isDark ? styles.channelChipTextDark : styles.channelChipTextLight,
                    isSelected && (isDark ? styles.channelChipTextActiveDark : styles.channelChipTextActiveLight),
                  ]}
                >
                  {ch.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Inset Grouped Conversations List */}
        <View style={[styles.conversationsCard, isDark && styles.conversationsCardDark]}>
          {filteredThreads.map((thread, index) => {
            const isLast = index === filteredThreads.length - 1;
            return (
              <View key={thread.id}>
                <Pressable
                  style={styles.threadRow}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (thread.channel === 'whatsapp') router.push('/products/whatsapp' as any);
                    else if (thread.channel === 'telegram') router.push('/products/telegram' as any);
                    else if (thread.channel === 'voice') router.push('/products/voice' as any);
                    else router.push('/products/crm' as any);
                  }}
                >
                  {/* Channel Avatar */}
                  <View style={[styles.avatarBox, { backgroundColor: `${thread.avatarBg}18` }]}>
                    <Ionicons name={getChannelIcon(thread.channel) as any} size={20} color={thread.avatarBg} />
                  </View>

                  {/* Thread Meta */}
                  <View style={styles.threadInfo}>
                    <View style={styles.threadHeader}>
                      <Text style={[styles.threadName, isDark && styles.threadNameDark]} numberOfLines={1}>
                        {thread.name}
                      </Text>
                      <Text style={styles.threadTime}>{thread.time}</Text>
                    </View>
                    <Text style={[styles.threadMessage, isDark && styles.threadMessageDark]} numberOfLines={1}>
                      {thread.lastMessage}
                    </Text>
                  </View>

                  {/* Unread Badge */}
                  {thread.unreadCount > 0 ? (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{thread.unreadCount}</Text>
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={16} color="#8E8E93" style={styles.chevron} />
                  )}
                </Pressable>
                {!isLast && <View style={[styles.hairlineDivider, isDark && styles.hairlineDividerDark]} />}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollViewLight: {
    backgroundColor: '#F2F2F7',
  },
  scrollViewDark: {
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 140,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3E3E8',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 14,
  },
  searchBarContainerDark: {
    backgroundColor: '#1C1C1E',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#262C36',
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    paddingVertical: 6,
  },
  searchInputDark: {
    color: '#FFFFFF',
  },
  channelScroll: {
    gap: 8,
    marginBottom: 18,
  },
  channelChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  channelChipLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  channelChipDark: {
    backgroundColor: '#161B22',
    borderColor: '#262C36',
  },
  channelChipActiveLight: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  channelChipActiveDark: {
    backgroundColor: '#0A84FF',
    borderColor: '#0A84FF',
  },
  channelChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  channelChipTextLight: {
    color: '#4B5563',
  },
  channelChipTextDark: {
    color: '#9CA3AF',
  },
  channelChipTextActiveLight: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  channelChipTextActiveDark: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  conversationsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  conversationsCardDark: {
    backgroundColor: '#161B22',
    borderColor: '#262C36',
  },
  threadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  threadInfo: {
    flex: 1,
    marginRight: 8,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  threadName: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.2,
  },
  threadNameDark: {
    color: '#FFFFFF',
  },
  threadTime: {
    fontSize: 11,
    color: '#8E8E93',
  },
  threadMessage: {
    fontSize: 12.5,
    color: '#6B7280',
    lineHeight: 16,
  },
  threadMessageDark: {
    color: '#9CA3AF',
  },
  unreadBadge: {
    backgroundColor: '#0A84FF',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  chevron: {
    marginLeft: 4,
  },
  hairlineDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginLeft: 66,
  },
  hairlineDividerDark: {
    backgroundColor: '#262C36',
  },
});
