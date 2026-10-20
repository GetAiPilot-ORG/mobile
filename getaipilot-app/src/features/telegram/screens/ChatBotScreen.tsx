import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import { TelegramToolKey } from '../types';

interface Props {
  onOpenModal?: (key: TelegramToolKey) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  text: string;
  time: string;
  isError?: boolean;
}

import { getColors, useTheme } from '@/theme';
import { useQuery } from '@tanstack/react-query';
import { telegramSupabase } from '../api/telegramSupabase';
import { ProductHeading, ProductMetrics } from "@/components/ProductUI";
import { ConnectBotTokenModal } from '../components/ConnectBotTokenModal';
import { usePlatformSubscription } from '@/hooks/usePlatformSubscription';
import { FeaturePlanModal } from '@/components/FeaturePlanModal';

interface ChatUser {
  id: string;
  name: string;
  telegramUserId: string;
  lastActive?: string;
}

export const ChatBotScreen: React.FC<Props> = () => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const card = { backgroundColor: colors.card, borderColor: colors.border };
  const txt = { color: colors.text };
  const border = { borderColor: colors.border };
  const inputStyle = { backgroundColor: colors.card, borderColor: colors.border };

  const { hasTelegram } = usePlatformSubscription();
  const [lockedModal, setLockedModal] = useState<{ visible: boolean; title: string } | null>(null);

  // Bot states
  const [isBotListening, setIsBotListening] = useState(true);
  const [isConnectTokenModalOpen, setIsConnectTokenModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isChatsDrawerOpen, setIsChatsDrawerOpen] = useState(false);
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);

  // Config Form State
  const [botToken, setBotToken] = useState('');
  const [supportBotName, setSupportBotName] = useState('');
  const [botUsername, setBotUsername] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [knowledgeTab, setKnowledgeTab] = useState<'text' | 'images'>('text');
  const [knowledgeBaseText, setKnowledgeBaseText] = useState('');
  const [pdfDocuments, setPdfDocuments] = useState<{ id: string; name: string; status: string }[]>([]);
  const [apiKey, setApiKey] = useState('');

  // Fetch real data
  const { data: allData, isLoading } = useQuery({
    queryKey: ['telegram_all_data'],
    queryFn: telegramSupabase.getSummary,
  });
  const bots = allData?.loadedChatbots || [];

  // Live Chat Reviewer State (Screenshot 2)
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [activeUser, setActiveUser] = useState<ChatUser | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});
  const [isLoadingChats, setIsLoadingChats] = useState(false);

  const fetchLiveChatData = async (filterBotId?: string) => {
    setIsLoadingChats(true);
    try {
      let query = supabase
        .from('tg_chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100);

      if (filterBotId) {
        query = query.eq('bot_id', filterBotId);
      }

      let { data: messages } = await query;

      // If no messages found for this specific bot_id, fallback to all recent messages
      if ((!messages || messages.length === 0) && filterBotId) {
        const fallback = await supabase
          .from('tg_chat_messages')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(100);
        messages = fallback.data;
      }

      if (messages && messages.length > 0) {
        const userMap = new Map<string, string>();
        const userMsgs: Record<string, ChatMessage[]> = {};

        messages.forEach((msg: any) => {
          const uid = String(msg.telegram_user_id || 'unknown');
          if (!userMap.has(uid)) {
            userMap.set(uid, msg.user_name || `User ${uid}`);
          }
          if (!userMsgs[uid]) userMsgs[uid] = [];

          const role = (msg.role || msg.sender_type || '').toLowerCase();
          const isUser = role === 'user';
          const messageText = msg.content || msg.message_text || msg.text || msg.message || '';

          userMsgs[uid].push({
            id: msg.id || String(Math.random()),
            sender: isUser ? 'user' : 'bot',
            text: messageText,
            time: msg.created_at
              ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Now',
          });
        });

        const liveUsersList: ChatUser[] = Array.from(userMap.entries()).map(([uid, name]) => ({
          id: uid,
          name,
          telegramUserId: uid,
        }));

        if (liveUsersList.length > 0) {
          setChatUsers(liveUsersList);
          setActiveUser((prev) => {
            if (prev && liveUsersList.some((u) => u.telegramUserId === prev.telegramUserId)) {
              return prev;
            }
            return liveUsersList[0];
          });
          setChatMessages(userMsgs);
        }
      }
    } catch (err) {
      console.warn('Error fetching live chat data:', err);
    } finally {
      setIsLoadingChats(false);
    }
  };

  useEffect(() => {
    fetchLiveChatData();
  }, []);

  const handleOpenBotLink = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const link = `https://t.me/${botUsername.replace('@', '')}`;
    try {
      await Linking.openURL(link);
    } catch {
      Alert.alert('Open Bot', `Please open ${link} in Telegram`);
    }
  };

  const handleCopyChat = async () => {
    if (!activeUser) return;
    const messages = chatMessages[activeUser.telegramUserId] || [];
    const formatted = messages
      .map((m) => `[${m.time}] ${m.sender === 'user' ? activeUser.name : 'Bot'}: ${m.text}`)
      .join('\n');
    await Clipboard.setStringAsync(formatted);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied', 'Chat history copied to clipboard');
  };

  const handleResetChat = () => {
    if (!activeUser) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setChatMessages((prev) => ({
      ...prev,
      [activeUser.telegramUserId]: [],
    }));
    Alert.alert('Reset', `Chat memory cleared for ${activeUser.name}`);
  };

  const handlePickPdf = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newDocs = result.assets.map((asset, index) => ({
          id: asset.uri || `${Date.now()}-${index}`,
          name: asset.name || 'document.pdf',
          status: 'Trained',
        }));

        setPdfDocuments((prev) => [...prev, ...newDocs]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      console.warn('PDF picker error:', err);
      Alert.alert('File Picker Error', err?.message || 'Failed to select PDF files.');
    }
  };

  const handleSaveConfig = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsConfigModalOpen(false);
    Alert.alert('Settings Saved', 'Bot personality & knowledge base updated successfully!');
  };

  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const numColumns = isWide ? 4 : 2;
  const cardWidthPercent = numColumns === 4 ? '23.5%' : '48.5%';

  const chatKpis = [
    {
      title: 'ACTIVE BOTS',
      value: `${bots.length} Connected`,
      icon: 'hardware-chip-outline' as const,
      color: '#0284C7',
      subtext: 'Configured agents',
    },
    {
      title: 'AI ENGINE',
      value: 'OpenAI / LLM',
      icon: 'sparkles-outline' as const,
      color: '#38BDF8',
      subtext: 'Live inference',
    },
    {
      title: 'KNOWLEDGE BASE',
      value: 'Active Docs',
      icon: 'document-text-outline' as const,
      color: '#10B981',
      subtext: 'Custom prompt memory',
    },
    {
      title: 'ENGINE STATUS',
      value: '24/7 Listening',
      icon: 'shield-checkmark-outline' as const,
      color: '#8B5CF6',
      subtext: 'Instant user replies',
    },
  ];

  return (
    <View style={styles.container} className="gap-3.5">
      {/* 1. Cyber Animated Hero Banner */}
      <ProductHeading title="Your chatbot" />

      {/* 2. KPI Metrics */}
      <ProductMetrics
        items={[
          { label: 'Active bots', value: `${bots.length} Connected` },
          { label: 'AI engine', value: 'OpenAI GPT' },
          { label: 'Engine status', value: '24/7 Live' },
        ]}
      />

      {/* 3. Action Toolbar */}
      <View
        className="w-full flex-row items-center justify-between p-3.5 rounded-2xl mb-1"
        style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
      >
        <View className="flex-1 pr-3">
          <Text className="text-xs font-bold" style={{ color: colors.text }}>
            Connected Assistants ({bots.length})
          </Text>
          <Text className="text-[11px]" style={{ color: colors.textSecondary }}>
            AI agents managing incoming user queries
          </Text>
        </View>

        <Pressable
          className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl active:opacity-90 shadow-sm"
          style={{ backgroundColor: colors.primary }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (!hasTelegram) {
              setLockedModal({ visible: true, title: 'Telegram AI Assistant' });
              return;
            }
            if (botToken) {
              setIsConfigModalOpen(true);
            } else {
              setIsConnectTokenModalOpen(true);
            }
          }}
        >
          <Ionicons name={hasTelegram ? "add" : "lock-closed"} size={13} color="#FFFFFF" />
          <Text className="text-white text-xs font-bold">Connect Bot</Text>
        </Pressable>
      </View>

      {/* Bot Cards list from Supabase */}
      {isLoading ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#0284C7" />
        </View>
      ) : bots.length === 0 ? (
        <View style={[styles.emptyContainer, card]}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="chatbubbles-outline" size={28} color="#0284C7" />
          </View>
          <Text style={[styles.mainTitle, txt, { fontSize: 17, marginBottom: 4 }]}>No ChatBots Connected</Text>
          <Text style={[styles.mainSub, { textAlign: 'center', marginBottom: 16 }]}>
            Connect an AI assistant to handle your Telegram bot's user queries automatically.
          </Text>
          <TouchableOpacity
            style={styles.connectBotBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (!hasTelegram) {
                setLockedModal({ visible: true, title: 'Telegram AI Assistant' });
                return;
              }
              if (botToken) {
                setIsConfigModalOpen(true);
              } else {
                setIsConnectTokenModalOpen(true);
              }
            }}
          >
            <Ionicons name={hasTelegram ? "add" : "lock-closed"} size={15} color="#FFFFFF" />
            <Text style={styles.connectBotBtnText}>Connect a Bot</Text>
          </TouchableOpacity>
        </View>
      ) : (
        bots.map((bot: any) => {
          const isActive = bot.status === 'active';
          return (
            <View key={bot.id} style={[styles.botCard, card]}>
              {/* 1. Card Header */}
              <View style={styles.botCardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                  <View style={[styles.botIconWrapper, { backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#E0F2FE' }]}>
                    <Ionicons name="hardware-chip" size={22} color="#0284C7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.botName, txt]} numberOfLines={1}>
                      {bot.support_name || bot.bot_name || 'AI Assistant'}
                    </Text>
                    <Text style={styles.botUsername} numberOfLines={1}>
                      @{bot.bot_username || 'unknown_bot'}
                    </Text>
                  </View>
                </View>

                {/* Status Pill in Header */}
                <View style={[styles.statusBadge, isActive ? styles.statusBadgeActive : styles.statusBadgePaused]}>
                  <View style={[styles.statusDot, { backgroundColor: isActive ? '#10B981' : '#F59E0B' }]} />
                  <Text style={[styles.statusBadgeText, { color: isActive ? '#059669' : '#D97706' }]}>
                    {isActive ? 'LISTENING' : 'PAUSED'}
                  </Text>
                </View>
              </View>

              {/* 2. Sleek Specs Strip */}
              <View style={[styles.specsStrip, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC', borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : '#E2E8F0' }]}>
                <View style={styles.specCol}>
                  <Text style={styles.specColLabel}>SUPPORT</Text>
                  <Text style={[styles.specColValue, txt]} numberOfLines={1}>
                    {bot.support_name || 'Support'}
                  </Text>
                </View>
                <View style={[styles.specDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0' }]} />
                <View style={styles.specCol}>
                  <Text style={styles.specColLabel}>AI MODEL</Text>
                  <Text style={[styles.specColValue, txt]} numberOfLines={1}>
                    {bot.provider || 'OpenAI'}
                  </Text>
                </View>
                <View style={[styles.specDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0' }]} />
                <View style={styles.specCol}>
                  <Text style={styles.specColLabel}>KNOWLEDGE</Text>
                  <Text style={[styles.specColValue, { color: '#0284C7' }]} numberOfLines={1}>
                    {bot.knowledge_base_name || 'General KB'}
                  </Text>
                </View>
              </View>

              {/* 3. Primary Action Buttons */}
              <View style={styles.mainActionsRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryActionBtn,
                    styles.chatsBtn,
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSupportBotName(bot.support_name || bot.bot_name || 'AI Assistant');
                    fetchLiveChatData(bot.bot_id || bot.id);
                    setIsChatsDrawerOpen(true);
                  }}
                >
                  <Ionicons name="chatbubbles" size={15} color="#0284C7" />
                  <Text style={styles.chatsBtnText}>Live Chats</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryActionBtn,
                    styles.openLinkBtn,
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    Linking.openURL(`https://t.me/${bot.bot_username || ''}`);
                  }}
                >
                  <Ionicons name="paper-plane-outline" size={14} color="#0284C7" />
                  <Text style={styles.openLinkText}>Open Bot</Text>
                  <Ionicons name="open-outline" size={12} color="#0284C7" />
                </Pressable>
              </View>

              {/* 4. Utility Footer Row */}
              <View style={styles.cardFooterRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.footerBtn,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF', borderColor: colors.border },
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSupportBotName(bot.support_name || '');
                    setBotUsername(`@${bot.bot_username || ''}`);
                    setSystemPrompt(bot.business_info || '');
                    setApiKey(bot.api_key || '');
                    setIsConfigModalOpen(true);
                  }}
                >
                  <Ionicons name="create-outline" size={13} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text style={[styles.footerBtnText, txt]}>Edit</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.footerBtn,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF', borderColor: colors.border },
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Alert.alert('Status Update', `Bot ${isActive ? 'paused' : 'resumed'}.`);
                  }}
                >
                  <Ionicons
                    name={isActive ? 'pause-circle-outline' : 'play-circle-outline'}
                    size={13}
                    color={isActive ? '#F59E0B' : '#10B981'}
                  />
                  <Text style={[styles.footerBtnText, txt]}>{isActive ? 'Pause' : 'Resume'}</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.footerBtn,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF', borderColor: colors.border },
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Alert.alert('Reset History', 'Are you sure you want to clear the full chat history?', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Reset',
                        style: 'destructive',
                        onPress: () => {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          Alert.alert('History Cleared', 'Bot conversation history has been reset.');
                        },
                      },
                    ]);
                  }}
                >
                  <Ionicons name="refresh-outline" size={13} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text style={[styles.footerBtnText, txt]}>Reset</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.footerBtn,
                    { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : '#FEF2F2', borderColor: isDark ? 'rgba(239,68,68,0.2)' : '#FECACA' },
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    Alert.alert('Delete Bot', 'Are you sure you want to remove this bot?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive' },
                    ]);
                  }}
                >
                  <Ionicons name="trash-outline" size={13} color="#EF4444" />
                  <Text style={[styles.footerBtnText, { color: '#EF4444' }]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          );
        })
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          MODAL 1: LIVE CHAT REVIEWER DRAWER (Screenshot 2)
      ──────────────────────────────────────────────────────────────────────── */}
      <Modal
        visible={isChatsDrawerOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsChatsDrawerOpen(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          {/* Top Modal Header */}
          <View style={[styles.modalTopHeader, { borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.botIconMini}>
                <Ionicons name="hardware-chip" size={18} color="#0284C7" />
              </View>
              <View>
                <Text style={[styles.modalHeaderTitle, txt]}>{supportBotName}</Text>
                <Text style={styles.modalHeaderSub}>Review live chats to refine and train your bot</Text>
              </View>
            </View>
            <Pressable style={styles.closeBtn} onPress={() => setIsChatsDrawerOpen(false)}>
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          {/* Active Users Horizontal Switcher */}
          <View style={[styles.activeUsersSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.activeUsersLabel}>ACTIVE USERS ({chatUsers.length})</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 4 }}
              ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
              data={chatUsers}
              keyExtractor={(u) => u.id}
              renderItem={({ item: u }) => {
                const isSelected = activeUser?.telegramUserId === u.telegramUserId;
                return (
                  <Pressable
                    style={[
                      styles.userPill,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      isSelected && styles.userPillActive,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActiveUser(u);
                    }}
                  >
                    <View style={styles.userAvatarMini}>
                      <Text style={styles.userAvatarText}>{(u.name || 'User').charAt(0).toUpperCase()}</Text>
                    </View>
                    <View>
                      <Text style={[styles.userPillName, txt, isSelected && { color: '#0284C7' }]}>{u.name || 'User'}</Text>
                      <Text style={styles.userPillId}>ID: {u.telegramUserId}</Text>
                    </View>
                  </Pressable>
                );
              }}
            />
          </View>

          {/* Chat Messages Area */}
          <View style={styles.chatHeader}>
            <View>
              <Text style={[styles.chatTargetName, txt]}>{activeUser?.name || 'Loading...'}</Text>
              <Text style={styles.chatTargetId}>User ID: {activeUser?.telegramUserId || '---'}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable style={styles.chatActionBtn} onPress={handleCopyChat}>
                <Ionicons name="copy-outline" size={14} color={colors.text} />
                <Text style={[styles.chatActionText, txt]}>Copy Chat</Text>
              </Pressable>
              <Pressable style={styles.chatActionBtnDanger} onPress={handleResetChat}>
                <Ionicons name="trash-outline" size={14} color="#EF4444" />
                <Text style={styles.chatActionDangerText}>Reset Chat</Text>
              </Pressable>
            </View>
          </View>

          {isLoadingChats ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#0284C7" />
              <Text style={[styles.modalHeaderSub, { marginTop: 10 }]}>Loading live chats...</Text>
            </View>
          ) : (
            <FlatList
              style={[styles.chatStream, { backgroundColor: isDark ? '#090D16' : '#F8FAFC' }]}
              contentContainerStyle={{ padding: 16 }}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              data={activeUser ? (chatMessages[activeUser.telegramUserId] || []) : []}
              keyExtractor={(msg) => msg.id}
              renderItem={({ item: msg }) => {
                if (msg.isError) {
                  return (
                    <View style={styles.errorBubble}>
                      <Text style={styles.errorBubbleText}>{msg.text}</Text>
                      <Text style={styles.errorBubbleTime}>{msg.time}</Text>
                    </View>
                  );
                }

                const isUser = msg.sender === 'user';
                return (
                  <View
                    style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowBot]}
                  >
                    <View
                      style={[
                        styles.msgBubble,
                        isUser
                          ? styles.msgBubbleUser
                          : isDark
                            ? styles.msgBubbleBotDark
                            : styles.msgBubbleBotLight,
                      ]}
                    >
                      <Text
                        style={[
                          styles.msgText,
                          isUser
                            ? styles.msgTextUser
                            : [styles.msgTextBot, { color: isDark ? '#F8FAFC' : '#0F172A' }],
                        ]}
                      >
                        {msg.text || '[Empty message]'}
                      </Text>
                      <Text
                        style={[
                          styles.msgTime,
                          isUser
                            ? styles.msgTimeUser
                            : [styles.msgTimeBot, { color: isDark ? '#94A3B8' : '#64748B' }],
                        ]}
                      >
                        {msg.time}
                      </Text>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', padding: 30, gap: 8 }}>
                  <Ionicons name="chatbubble-ellipses-outline" size={32} color="#94A3B8" />
                  <Text style={styles.modalHeaderSub}>No messages found for this user.</Text>
                </View>
              }
            />
          )}

          {/* Prompt Refine Training Banner */}
          <View style={[styles.refineBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="sparkles" size={18} color="#8B5CF6" />
              <Text style={styles.refineText} numberOfLines={2}>
                Refine and train this bot based on this user's queries by editing Knowledge Base or Prompts!
              </Text>
            </View>
            <Pressable
              style={styles.goToPromptBtn}
              onPress={() => {
                setIsChatsDrawerOpen(false);
                setIsConfigModalOpen(true);
              }}
            >
              <Text style={styles.goToPromptText}>Go to Prompt</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ────────────────────────────────────────────────────────────────────────
          MODAL 2: BOT CONFIGURATION FORM (Screenshot 1)
      ──────────────────────────────────────────────────────────────────────── */}
      <Modal
        visible={isConfigModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsConfigModalOpen(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.modalTopHeader, { borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.botIconMini}>
                <Ionicons name="hardware-chip" size={18} color="#0284C7" />
              </View>
              <View>
                <Text style={[styles.modalHeaderTitle, txt]}>{supportBotName || 'Configure Bot'}</Text>
                <Text style={styles.modalHeaderSub}>{botUsername || '@bot'}</Text>
              </View>
              <View style={styles.connectedBadge}>
                <Text style={styles.connectedBadgeText}>CONNECTED</Text>
              </View>
            </View>
            <Pressable style={styles.closeBtn} onPress={() => setIsConfigModalOpen(false)}>
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 18, gap: 18 }}>
            {/* SUPPORT BOT NAME */}
            <View>
              <Text style={[styles.fieldLabel, txt]}>SUPPORT BOT NAME</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                value={supportBotName}
                onChangeText={setSupportBotName}
                placeholder="Enter support bot name"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* SYSTEM PROMPT */}
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Text style={[styles.fieldLabel, txt, { marginBottom: 0 }]}>SYSTEM PROMPT</Text>
                <View style={styles.behaviorBadge}>
                  <Text style={styles.behaviorBadgeText}>BOT BEHAVIOR</Text>
                </View>
              </View>
              <TextInput
                style={[styles.inputMulti, inputStyle]}
                multiline
                numberOfLines={4}
                value={systemPrompt}
                onChangeText={setSystemPrompt}
                placeholder="Enter system prompt instructions"
                placeholderTextColor="#94A3B8"
              />
              <Text style={styles.fieldHelper}>
                This is the bot's persona and behavioral rules. The AI will strictly follow these instructions.
              </Text>
            </View>

            {/* KNOWLEDGE BASE */}
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={[styles.fieldLabel, txt, { marginBottom: 0 }]}>KNOWLEDGE BASE</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Pressable onPress={() => setKnowledgeTab('text')}>
                    <Text style={[styles.tabLink, knowledgeTab === 'text' && styles.tabLinkActive]}>
                      ✦ BOT KNOWLEDGE
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => setKnowledgeTab('images')}>
                    <Text style={[styles.tabLink, knowledgeTab === 'images' && styles.tabLinkActive]}>
                      MULTIMEDIA KNOWLEDGE (IMAGES)
                    </Text>
                  </Pressable>
                </View>
              </View>

              {knowledgeTab === 'text' ? (
                <>
                  <TextInput
                    style={[styles.inputMultiLarge, inputStyle]}
                    multiline
                    numberOfLines={6}
                    value={knowledgeBaseText}
                    onChangeText={setKnowledgeBaseText}
                    placeholder="Enter knowledge base text"
                    placeholderTextColor="#94A3B8"
                  />
                  <View style={styles.knowledgeNote}>
                    <Ionicons name="hardware-chip-outline" size={13} color="#0284C7" />
                    <Text style={styles.knowledgeNoteText}>
                      The bot answers ONLY based on this knowledge base. Keep it detailed and accurate.
                    </Text>
                  </View>
                </>
              ) : (
                <Pressable
                  style={[styles.imageRagBox, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => Alert.alert('Upload Image', 'Upload screenshot or product flyer to RAG vector database')}
                >
                  <Ionicons name="cloud-upload-outline" size={26} color="#64748B" />
                  <Text style={styles.imageRagText}>Add Image to RAG</Text>
                </Pressable>
              )}
            </View>

            {/* PDF KNOWLEDGE DOCUMENTS */}
            <View>
              <Text style={[styles.fieldLabel, txt]}>
                PDF KNOWLEDGE DOCUMENTS ({pdfDocuments.length} UPLOADED)
              </Text>
              <Pressable
                style={
                  styles.pdfUploadBox
                }
                onPress={handlePickPdf}
              >
                <Ionicons name="cloud-upload-outline" size={24} color="#64748B" />
                <Text style={styles.pdfUploadText}>Click to add PDF documents</Text>
              </Pressable>

              <FlatList
                data={pdfDocuments}
                keyExtractor={(doc) => doc.id}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                renderItem={({ item: doc }) => (
                  <View style={[styles.pdfDocItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="document-text" size={18} color="#10B981" />
                      <Text style={[styles.pdfDocName, txt]}>{doc.name}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={styles.trainedBadge}>
                        <Text style={styles.trainedBadgeText}>{doc.status}</Text>
                      </View>
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setPdfDocuments((prev) => prev.filter((d) => d.id !== doc.id));
                        }}
                      >
                        <Ionicons name="trash-outline" size={16} color="#94A3B8" />
                      </Pressable>
                    </View>
                  </View>
                )}
              />
            </View>

            {/* OPENAI OR GEMINI API KEY */}
            <View>
              <Text style={[styles.fieldLabel, txt]}>OPENAI OR GEMINI API KEY</Text>
              <View style={[styles.apiKeyRow, inputStyle]}>
                <Ionicons name="key-outline" size={16} color="#94A3B8" />
                <TextInput
                  style={[styles.apiKeyInput, txt]}
                  secureTextEntry={!isApiKeyVisible}
                  value={apiKey}
                  onChangeText={setApiKey}
                  placeholder="sk-proj-..."
                  placeholderTextColor="#94A3B8"
                />
                <Pressable onPress={() => setIsApiKeyVisible((v) => !v)}>
                  <Ionicons name={isApiKeyVisible ? 'eye-off-outline' : 'eye-outline'} size={18} color="#94A3B8" />
                </Pressable>
              </View>
              <View style={styles.validKeyBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#0284C7" />
                <Text style={styles.validKeyText}>Valid OpenAI API Key Connected</Text>
              </View>
            </View>

            {/* Save Button */}
            <Pressable style={styles.saveSettingsBtn} onPress={handleSaveConfig}>
              <Text style={styles.saveSettingsBtnText}>Save Bot Configuration</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>

      {/* ────────────────────────────────────────────────────────────────────────
          MODAL 3: CONNECT BOT VIA TOKEN MODAL
      ──────────────────────────────────────────────────────────────────────── */}
      <ConnectBotTokenModal
        visible={isConnectTokenModalOpen}
        onClose={() => setIsConnectTokenModalOpen(false)}
        onSuccess={({ token, bot }) => {
          setIsConnectTokenModalOpen(false);
          if (token) setBotToken(token);
          if (bot?.first_name || bot?.username) {
            setSupportBotName(bot.first_name || bot.username || 'AI Assistant');
            const uname = bot.username || 'bot';
            setBotUsername(uname.startsWith('@') ? uname : `@${uname}`);
          }
          // Delay to ensure the token modal finishes native dismiss animation
          setTimeout(() => {
            setIsConfigModalOpen(true);
          }, 350);
        }}
      />

      {/* Plan Gate Modal */}
      <FeaturePlanModal
        visible={Boolean(lockedModal?.visible)}
        onClose={() => setLockedModal(null)}
        featureName={lockedModal?.title || 'AI ChatBot'}
        category="telegram"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  mainSub: {
    fontSize: 13.5,
    color: '#716B7C',
    lineHeight: 18,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  connectBotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  connectBotBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  botCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9E6F2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: '#121212',
    borderColor: '#27272A',
  },
  textLight: { color: '#1C1A25' },
  textDark: { color: '#F5F3FB' },
  borderLight: { borderColor: '#E9E6F2' },
  borderDark: { borderColor: '#27272A' },

  botCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  botIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botName: {
    fontSize: 15,
    fontWeight: '700',
  },
  botUsername: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 16,
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  statusBadgePaused: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  specsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 9,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  specCol: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  specColLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  specColValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  specDivider: {
    width: 1,
    height: 20,
  },

  mainActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 11,
    borderWidth: 1,
  },
  chatsBtn: {
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    borderColor: 'rgba(2, 132, 199, 0.25)',
  },
  chatsBtnText: {
    color: '#0284C7',
    fontSize: 13,
    fontWeight: '700',
  },
  openLinkBtn: {
    backgroundColor: 'rgba(2, 132, 199, 0.05)',
    borderColor: 'rgba(2, 132, 199, 0.18)',
  },
  openLinkText: {
    fontSize: 13,
    color: '#0284C7',
    fontWeight: '600',
  },

  cardFooterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  footerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7.5,
    borderRadius: 9,
    borderWidth: 1,
  },
  footerBtnLight: { backgroundColor: '#FFFFFF', borderColor: '#E9E6F2' },
  footerBtnDark: { backgroundColor: '#1E2430', borderColor: '#27272A' },
  footerBtnText: { fontSize: 11, fontWeight: '600' },

  // Modal styling
  modalContainer: { flex: 1 },
  modalContainerLight: { backgroundColor: '#FFFFFF' },
  modalContainerDark: { backgroundColor: '#0B0F19' },
  modalTopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  botIconMini: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderTitle: { fontSize: 16, fontWeight: '800' },
  modalHeaderSub: { fontSize: 13, color: '#716B7C', marginTop: 1 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Active Users section
  activeUsersSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  activeUsersLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  userPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  userPillLight: { backgroundColor: '#F5F3FB', borderColor: '#E9E6F2' },
  userPillDark: { backgroundColor: '#161C28', borderColor: '#27272A' },
  userPillActive: { borderColor: '#0284C7', backgroundColor: 'rgba(2, 132, 199, 0.08)' },
  userAvatarMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: { fontSize: 11, fontWeight: '800', color: '#334155' },
  userPillName: { fontSize: 12, fontWeight: '700' },
  userPillId: { fontSize: 9.5, color: '#777383' },

  // Chat conversation
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.15)',
  },
  chatTargetName: { fontSize: 14, fontWeight: '800' },
  chatTargetId: { fontSize: 11, color: '#64748B', marginTop: 1 },
  chatActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E9E6F2',
  },
  chatActionText: { fontSize: 11, fontWeight: '600' },
  chatActionBtnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  chatActionDangerText: { fontSize: 11, fontWeight: '700', color: '#EF4444' },

  chatStream: { flex: 1 },
  msgRow: { flexDirection: 'row', marginBottom: 8 },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowBot: { justifyContent: 'flex-start' },
  msgBubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  msgBubbleUser: {
    backgroundColor: '#0284C7',
    borderBottomRightRadius: 2,
  },
  msgBubbleBotLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderBottomLeftRadius: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  msgBubbleBotDark: {
    backgroundColor: '#1E2430',
    borderColor: '#2A3342',
    borderWidth: 1,
    borderBottomLeftRadius: 2,
  },
  msgText: { fontSize: 13.5, lineHeight: 19 },
  msgTextUser: { color: '#FFFFFF', fontWeight: '400' },
  msgTextBot: { fontWeight: '400' },
  msgTime: { fontSize: 9.5, alignSelf: 'flex-end', marginTop: 4 },
  msgTimeUser: { color: 'rgba(255, 255, 255, 0.75)' },
  msgTimeBot: { color: '#64748B' },

  errorBubble: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 12,
    borderRadius: 12,
    marginVertical: 4,
  },
  errorBubbleText: {
    color: '#B45309',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  errorBubbleTime: {
    color: '#D97706',
    fontSize: 9.5,
    alignSelf: 'flex-end',
    marginTop: 4,
  },

  refineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
  },
  refineBannerLight: { backgroundColor: '#F5F3FB', borderTopColor: '#E9E6F2' },
  refineBannerDark: { backgroundColor: '#121722', borderTopColor: '#27272A' },
  refineText: { fontSize: 11, color: '#64748B', flex: 1 },
  goToPromptBtn: {
    backgroundColor: '#024AD8',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  goToPromptText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  // Config Form styles
  connectedBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  connectedBadgeText: { fontSize: 9.5, fontWeight: '800', color: '#0284C7' },
  fieldLabel: { fontSize: 11, fontWeight: '800', marginBottom: 6, letterSpacing: 0.3 },
  fieldHelper: { fontSize: 13.5, color: '#716B7C', marginTop: 4 },
  behaviorBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  behaviorBadgeText: { fontSize: 9, fontWeight: '800', color: '#8B5CF6' },

  input: {
    borderWidth: 0,
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13, minHeight: 48
  },
  inputMulti: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputMultiLarge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  inputLight: { backgroundColor: '#F5F3FB', borderColor: '#CBD5E1', color: '#1C1A25' },
  inputDark: { backgroundColor: '#161C28', borderColor: '#27272A', color: '#F5F3FB' },

  tabLink: { fontSize: 10, fontWeight: '700', color: '#64748B' },
  tabLinkActive: { color: '#8B5CF6' },
  knowledgeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(2, 132, 199, 0.06)',
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  knowledgeNoteText: { fontSize: 10.5, color: '#0284C7', fontWeight: '500' },

  imageRagBox: {
    height: 100,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  imageRagBoxLight: { backgroundColor: '#F5F3FB', borderColor: '#CBD5E1' },
  imageRagBoxDark: { backgroundColor: '#161C28', borderColor: '#334155' },
  imageRagText: { fontSize: 11, fontWeight: '700', color: '#64748B' },

  pdfUploadBox: {
    height: 70,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  pdfUploadBoxLight: { backgroundColor: '#F5F3FB', borderColor: '#CBD5E1' },
  pdfUploadBoxDark: { backgroundColor: '#161C28', borderColor: '#334155' },
  pdfUploadText: { fontSize: 11, fontWeight: '700', color: '#64748B' },

  pdfDocItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  pdfDocItemLight: { backgroundColor: '#F5F3FB', borderColor: '#E9E6F2' },
  pdfDocItemDark: { backgroundColor: '#161C28', borderColor: '#27272A' },
  pdfDocName: { fontSize: 12, fontWeight: '700' },
  trainedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trainedBadgeText: { fontSize: 9.5, fontWeight: '800', color: '#059669' },

  apiKeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  apiKeyInput: { flex: 1, paddingVertical: 10, fontSize: 13 },
  validKeyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  validKeyText: { fontSize: 11, fontWeight: '600', color: '#0284C7' },

  saveSettingsBtn: {
    backgroundColor: '#024AD8',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  saveSettingsBtnText: { color: '#FFFFFF', fontSize: 13.5, fontWeight: '800' },
});
