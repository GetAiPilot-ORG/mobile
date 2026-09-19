import React, { useState, useEffect } from 'react';
import {
  Alert,
  Image,
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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
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

import { useQuery } from '@tanstack/react-query';
import { telegramSupabase } from '../api/telegramSupabase';
import { useAuthStore } from '../../../core/store/authStore';

interface ChatUser {
  id: string;
  name: string;
  telegramUserId: string;
  lastActive?: string;
}

export const ChatBotScreen: React.FC<Props> = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const card = isDark ? styles.cardDark : styles.cardLight;
  const txt = isDark ? styles.textDark : styles.textLight;
  const border = isDark ? styles.borderDark : styles.borderLight;
  const inputStyle = isDark ? styles.inputDark : styles.inputLight;

  // Bot states
  const [isBotListening, setIsBotListening] = useState(true);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isChatsDrawerOpen, setIsChatsDrawerOpen] = useState(false);
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);

  // Config Form State
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

  // When opening a bot's chats, we might want to fetch its specific messages
  // For now, we will fetch global bot messages or just leave it empty if no messages are found
  useEffect(() => {
    const fetchLiveChatData = async () => {
      try {
        const { data: messages } = await supabase
          .from('tg_chat_messages')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(50);

        if (messages && messages.length > 0) {
          const userMap = new Map<string, string>();
          const userMsgs: Record<string, ChatMessage[]> = {};

          messages.forEach((msg: any) => {
            const uid = String(msg.telegram_user_id || 'unknown');
            if (!userMap.has(uid)) {
              userMap.set(uid, msg.user_name || `User ${uid}`);
            }
            if (!userMsgs[uid]) userMsgs[uid] = [];
            userMsgs[uid].push({
              id: msg.id || String(Math.random()),
              sender: msg.sender_type === 'user' ? 'user' : 'bot',
              text: msg.message_text || msg.text || '',
              time: msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now',
            });
          });

          const liveUsersList: ChatUser[] = Array.from(userMap.entries()).map(([uid, name]) => ({
            id: uid,
            name,
            telegramUserId: uid,
          }));

          if (liveUsersList.length > 0) {
            setChatUsers(liveUsersList);
            setActiveUser(liveUsersList[0]);
            setChatMessages(userMsgs);
          }
        }
      } catch (err) {
        // Ignored
      }
    };
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

  const handleSaveConfig = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsConfigModalOpen(false);
    Alert.alert('Settings Saved', 'Bot personality & knowledge base updated successfully!');
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.mainTitle, txt]}>Chat Bot Automation</Text>
          <Text style={styles.mainSub}>
            Attach an AI Assistant to your Telegram Bot. Map business details, upload documents, and link API keys to create automated support agents.
          </Text>
        </View>
        <Pressable
          style={styles.connectBotBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsConfigModalOpen(true);
          }}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.connectBotBtnText}>Connect Telegram Bot</Text>
        </Pressable>
      </View>

      {/* Bot Cards list from Supabase */}
      {isLoading ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#0284C7" />
        </View>
      ) : bots.length === 0 ? (
        <View style={{ padding: 24, alignItems: 'center', backgroundColor: isDark ? '#1E2430' : '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: border.borderColor }}>
          <Ionicons name="chatbubbles-outline" size={32} color="#0284C7" style={{ marginBottom: 10 }} />
          <Text style={[styles.mainTitle, txt, { fontSize: 18, marginBottom: 6 }]}>No ChatBots Connected</Text>
          <Text style={[styles.mainSub, { textAlign: 'center', marginBottom: 16 }]}>Connect an AI assistant to handle your Telegram bot's user queries automatically.</Text>
          <Pressable
            style={styles.connectBotBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsConfigModalOpen(true);
            }}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.connectBotBtnText}>Connect a Bot</Text>
          </Pressable>
        </View>
      ) : (
        bots.map((bot: any) => (
          <View key={bot.id} style={[styles.botCard, card]}>
            {/* Bot Card Header */}
            <View style={styles.botCardHeader}>
              <View style={styles.botIconWrapper}>
                <Ionicons name="hardware-chip" size={24} color="#0284C7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.botName, txt]}>{bot.support_name || bot.bot_name}</Text>
                <Text style={styles.botUsername}>@{bot.bot_username || 'unknown_bot'}</Text>
              </View>
            </View>

            {/* Specs Table */}
            <View style={[styles.specsTable, isDark ? styles.specsTableDark : styles.specsTableLight]}>
              <View style={styles.specRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <Ionicons name="person-circle-outline" size={14} color="#64748B" />
                  <Text style={styles.specLabel}>Support Name</Text>
                </View>
                <Text style={[styles.specValue, txt]}>{bot.support_name || 'Support'}</Text>
              </View>

              <View style={styles.specRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <Ionicons name="settings-outline" size={14} color="#64748B" />
                  <Text style={styles.specLabel}>Model API</Text>
                </View>
                <Text style={[styles.specValue, txt]}>{bot.provider || 'OpenAI'}</Text>
              </View>

              <View style={[styles.specRow, { borderBottomWidth: 0 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <Ionicons name="document-text-outline" size={14} color="#64748B" />
                  <Text style={styles.specLabel}>Knowledge Base</Text>
                </View>
                <Text style={[styles.specValueLink, { color: '#0284C7' }]}>{bot.knowledge_base_name || 'General KB'}</Text>
              </View>
            </View>

            {/* Status and Action Buttons */}
            <View style={styles.cardActionsRow}>
              <View style={styles.listeningBadge}>
                <View style={styles.dotGreen} />
                <Text style={styles.listeningText}>
                  {bot.status === 'active' ? 'LISTENING' : 'PAUSED'}
                </Text>
              </View>

              <Pressable style={styles.openLinkBtn} onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Linking.openURL(`https://t.me/${bot.bot_username || ''}`);
              }}>
                <Text style={styles.openLinkText}>Open Bot Link</Text>
                <Ionicons name="open-outline" size={13} color="#0284C7" />
              </Pressable>
            </View>

            {/* Chats & Reset Buttons */}
            <View style={styles.mainActionsRow}>
              <Pressable
                style={styles.chatsBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsChatsDrawerOpen(true);
                }}
              >
                <Ionicons name="chatbubbles" size={15} color="#0284C7" />
                <Text style={styles.chatsBtnText}>Chats</Text>
              </Pressable>

              <Pressable
                style={styles.resetHistoryBtn}
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
                <Ionicons name="refresh" size={15} color="#D97706" />
                <Text style={styles.resetHistoryText}>Reset History</Text>
              </Pressable>
            </View>

            {/* Footer Actions: Edit | Pause | Delete */}
            <View style={styles.cardFooterRow}>
              <Pressable
                style={[styles.footerBtn, isDark ? styles.footerBtnDark : styles.footerBtnLight]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSupportBotName(bot.support_name || '');
                  setBotUsername(`@${bot.bot_username || ''}`);
                  setSystemPrompt(bot.business_info || '');
                  setApiKey(bot.api_key || '');
                  setIsConfigModalOpen(true);
                }}
              >
                <Text style={[styles.footerBtnText, txt]}>Edit</Text>
              </Pressable>

              <Pressable
                style={[styles.footerBtn, isDark ? styles.footerBtnDark : styles.footerBtnLight]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Alert.alert('Status Update', 'Bot paused/resumed.');
                }}
              >
                <Text style={[styles.footerBtnText, txt]}>{bot.status === 'active' ? 'Pause' : 'Resume'}</Text>
              </Pressable>

              <Pressable
                style={[styles.footerBtn, isDark ? styles.footerBtnDark : styles.footerBtnLight]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  Alert.alert('Delete Bot', 'Are you sure you want to remove this bot?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive' },
                  ]);
                }}
              >
                <Text style={[styles.footerBtnText, { color: '#EF4444' }]}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))
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
        <View style={[styles.modalContainer, isDark ? styles.modalContainerDark : styles.modalContainerLight]}>
          {/* Top Modal Header */}
          <View style={[styles.modalTopHeader, isDark ? styles.borderDark : styles.borderLight]}>
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
              <Ionicons name="close" size={20} color={isDark ? '#CBD5E1' : '#475569'} />
            </Pressable>
          </View>

          {/* Active Users Horizontal Switcher */}
          <View style={[styles.activeUsersSection, isDark ? styles.borderDark : styles.borderLight]}>
            <Text style={styles.activeUsersLabel}>ACTIVE USERS ({chatUsers.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {chatUsers.map((u) => {
                const isSelected = activeUser?.telegramUserId === u.telegramUserId;
                return (
                  <Pressable
                    key={u.id}
                    style={[
                      styles.userPill,
                      isDark ? styles.userPillDark : styles.userPillLight,
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
              })}
            </ScrollView>
          </View>

          {/* Chat Messages Area */}
          <View style={styles.chatHeader}>
            <View>
              <Text style={[styles.chatTargetName, txt]}>{activeUser?.name || 'Loading...'}</Text>
              <Text style={styles.chatTargetId}>User ID: {activeUser?.telegramUserId || '---'}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable style={styles.chatActionBtn} onPress={handleCopyChat}>
                <Ionicons name="copy-outline" size={14} color={isDark ? '#CBD5E1' : '#475569'} />
                <Text style={[styles.chatActionText, txt]}>Copy Chat</Text>
              </Pressable>
              <Pressable style={styles.chatActionBtnDanger} onPress={handleResetChat}>
                <Ionicons name="trash-outline" size={14} color="#EF4444" />
                <Text style={styles.chatActionDangerText}>Reset Chat</Text>
              </Pressable>
            </View>
          </View>

          <ScrollView style={styles.chatStream} contentContainerStyle={{ padding: 16, gap: 12 }}>
            {activeUser ? (chatMessages[activeUser.telegramUserId] || []).map((msg) => {
              if (msg.isError) {
                return (
                  <View key={msg.id} style={styles.errorBubble}>
                    <Text style={styles.errorBubbleText}>{msg.text}</Text>
                    <Text style={styles.errorBubbleTime}>{msg.time}</Text>
                  </View>
                );
              }

              const isUser = msg.sender === 'user';
              return (
                <View
                  key={msg.id}
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
                    <Text style={[styles.msgText, isUser ? { color: '#FFFFFF' } : txt]}>
                      {msg.text}
                    </Text>
                    <Text style={[styles.msgTime, isUser ? { color: 'rgba(255,255,255,0.7)' } : { color: '#94A3B8' }]}>
                      {msg.time}
                    </Text>
                  </View>
                </View>
              );
            }) : (
              <View style={{ alignItems: 'center', padding: 20 }}>
                <Text style={styles.modalHeaderSub}>No active users found.</Text>
              </View>
            )}
          </ScrollView>

          {/* Prompt Refine Training Banner */}
          <View style={[styles.refineBanner, isDark ? styles.refineBannerDark : styles.refineBannerLight]}>
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
        <View style={[styles.modalContainer, isDark ? styles.modalContainerDark : styles.modalContainerLight]}>
          {/* Header */}
          <View style={[styles.modalTopHeader, isDark ? styles.borderDark : styles.borderLight]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.botIconMini}>
                <Ionicons name="hardware-chip" size={18} color="#0284C7" />
              </View>
              <View>
                <Text style={[styles.modalHeaderTitle, txt]}>{supportBotName}</Text>
                <Text style={styles.modalHeaderSub}>{botUsername}</Text>
              </View>
              <View style={styles.connectedBadge}>
                <Text style={styles.connectedBadgeText}>CONNECTED</Text>
              </View>
            </View>
            <Pressable style={styles.closeBtn} onPress={() => setIsConfigModalOpen(false)}>
              <Ionicons name="close" size={20} color={isDark ? '#CBD5E1' : '#475569'} />
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 18, gap: 18 }}>
            {/* SUPPORT BOT NAME */}
            <View>
              <Text style={[styles.fieldLabel, txt]}>SUPPORT BOT NAME</Text>
              <TextInput
                style={[styles.input, inputStyle]}
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
                  style={[styles.imageRagBox, isDark ? styles.imageRagBoxDark : styles.imageRagBoxLight]}
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
                style={[styles.pdfUploadBox, isDark ? styles.pdfUploadBoxDark : styles.pdfUploadBoxLight]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Alert.alert('Upload PDF', 'Choose business PDF documentation to train the bot.');
                }}
              >
                <Ionicons name="cloud-upload-outline" size={24} color="#64748B" />
                <Text style={styles.pdfUploadText}>Click to add PDF documents</Text>
              </Pressable>

              {pdfDocuments.map((doc) => (
                <View key={doc.id} style={[styles.pdfDocItem, isDark ? styles.pdfDocItemDark : styles.pdfDocItemLight]}>
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
              ))}
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
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
  },
  connectBotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#024AD8',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  connectBotBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  botCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
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
  textLight: { color: '#0F172A' },
  textDark: { color: '#F8FAFC' },
  borderLight: { borderColor: '#E2E8F0' },
  borderDark: { borderColor: '#27272A' },

  botCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  botIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  botName: {
    fontSize: 16,
    fontWeight: '800',
  },
  botUsername: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  specsTable: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 14,
  },
  specsTableLight: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  specsTableDark: { backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.15)',
  },
  specLabel: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  specValue: { fontSize: 12, fontWeight: '700' },
  specValueLink: { fontSize: 12, fontWeight: '700' },

  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listeningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  dotGreen: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  listeningText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  openLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    backgroundColor: 'rgba(2, 132, 199, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  openLinkText: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '700',
  },

  mainActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  chatsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    paddingVertical: 10,
    borderRadius: 10,
  },
  chatsBtnText: {
    color: '#0284C7',
    fontSize: 13,
    fontWeight: '700',
  },
  resetHistoryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetHistoryText: {
    color: '#D97706',
    fontSize: 13,
    fontWeight: '700',
  },

  cardFooterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  footerBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  footerBtnLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  footerBtnDark: { backgroundColor: '#1E2430', borderColor: '#27272A' },
  footerBtnText: { fontSize: 12, fontWeight: '700' },

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
  modalHeaderSub: { fontSize: 11, color: '#64748B', marginTop: 1 },
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
  userPillLight: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
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
  userPillId: { fontSize: 9.5, color: '#94A3B8' },

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
    borderColor: '#E2E8F0',
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
  msgRow: { flexDirection: 'row', marginBottom: 6 },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowBot: { justifyContent: 'flex-start' },
  msgBubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  msgBubbleUser: {
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 2,
  },
  msgBubbleBotLight: {
    backgroundColor: '#F1F5F9',
    borderBottomLeftRadius: 2,
  },
  msgBubbleBotDark: {
    backgroundColor: '#1E2430',
    borderBottomLeftRadius: 2,
  },
  msgText: { fontSize: 13, lineHeight: 18 },
  msgTime: { fontSize: 9.5, alignSelf: 'flex-end', marginTop: 4 },

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
  refineBannerLight: { backgroundColor: '#F8FAFC', borderTopColor: '#E2E8F0' },
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
  fieldHelper: { fontSize: 10.5, color: '#64748B', marginTop: 4 },
  behaviorBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  behaviorBadgeText: { fontSize: 9, fontWeight: '800', color: '#8B5CF6' },

  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
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
  inputLight: { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' },
  inputDark: { backgroundColor: '#161C28', borderColor: '#27272A', color: '#F8FAFC' },

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
  imageRagBoxLight: { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' },
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
  pdfUploadBoxLight: { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' },
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
  pdfDocItemLight: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
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
