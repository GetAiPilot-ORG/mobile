import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { telegramApi } from '../api/telegramApi';
import { ChatBotConfig, ChatBotSession, ChatBotMessage } from '../types';
import { useTheme, getColors } from '@/theme';

interface ChatBotModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ChatBotModal: React.FC<ChatBotModalProps> = ({ visible, onClose }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const queryClient = useQueryClient();

  // Modals state
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [editingChatbot, setEditingChatbot] = useState<ChatBotConfig | null>(null);
  const [activeSessionBot, setActiveSessionBot] = useState<{ botId: string; botName: string } | null>(null);
  const [activeUserThread, setActiveUserThread] = useState<{
    botId: string;
    botName: string;
    telegramUserId: number;
    userName: string;
  } | null>(null);

  // Form State
  const [botToken, setBotToken] = useState('');
  const [botName, setBotName] = useState('');
  const [botUsername, setBotUsername] = useState('');
  const [supportName, setSupportName] = useState('Ads Bot');
  const [provider, setProvider] = useState('OpenAI');
  const [apiKey, setApiKey] = useState('');
  const [knowledgeBaseName, setKnowledgeBaseName] = useState('Multimedia Knowledge Base');
  const [businessInfo, setBusinessInfo] = useState('');

  // Queries
  const { data: chatbots, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['telegram_chatbots'],
    queryFn: telegramApi.getChatbots,
    enabled: visible,
  });

  const { data: sessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ['telegram_chatbot_sessions', activeSessionBot?.botId],
    queryFn: () => (activeSessionBot ? telegramApi.getChatbotSessions(activeSessionBot.botId) : Promise.resolve([])),
    enabled: Boolean(activeSessionBot),
  });

  const { data: threadData, isLoading: isLoadingThread } = useQuery({
    queryKey: ['telegram_chatbot_messages', activeUserThread?.botId, activeUserThread?.telegramUserId],
    queryFn: () =>
      activeUserThread
        ? telegramApi.getChatbotUserMessages(activeUserThread.botId, activeUserThread.telegramUserId)
        : Promise.resolve({ messages: [], memory: null }),
    enabled: Boolean(activeUserThread),
  });

  // Mutations
  const { mutateAsync: connectBot, isPending: isConnecting } = useMutation({
    mutationFn: telegramApi.connectChatbot,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsConnectOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['telegram_chatbots'] });
    },
    onError: (err: any) => {
      Alert.alert('Connection Failed', err.message || 'Could not connect Telegram bot.');
    },
  });

  const { mutateAsync: toggleStatus } = useMutation({
    mutationFn: telegramApi.toggleChatbotStatus,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['telegram_chatbots'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to update status.');
    },
  });

  const { mutateAsync: resetHistory } = useMutation({
    mutationFn: telegramApi.resetChatbotHistory,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('History Cleared', 'Conversational lead memory has been flushed successfully.');
      queryClient.invalidateQueries({ queryKey: ['telegram_chatbots'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to reset history.');
    },
  });

  const { mutateAsync: updateBot, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => telegramApi.updateChatbot(id, payload),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditingChatbot(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['telegram_chatbots'] });
    },
    onError: (err: any) => {
      Alert.alert('Update Failed', err.message || 'Failed to update chatbot.');
    },
  });

  const { mutateAsync: deleteBot } = useMutation({
    mutationFn: telegramApi.deleteChatbot,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['telegram_chatbots'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to delete chatbot.');
    },
  });

  const resetForm = () => {
    setBotToken('');
    setBotName('');
    setBotUsername('');
    setSupportName('Ads Bot');
    setProvider('OpenAI');
    setApiKey('');
    setKnowledgeBaseName('Multimedia Knowledge Base');
    setBusinessInfo('');
  };

  const handleOpenBotLink = (username: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const clean = username.replace('@', '');
    Linking.openURL(`https://t.me/${clean}`);
  };

  const handleEditPress = (bot: ChatBotConfig) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingChatbot(bot);
    setSupportName(bot.support_name || 'Support Agent');
    setProvider(bot.provider || 'OpenAI');
    setApiKey(bot.api_key || '');
    setKnowledgeBaseName(bot.knowledge_base_name || 'Multimedia Knowledge Base');
    setBusinessInfo(bot.business_info || '');
  };

  const handleDeleteConfirm = (configId: string, botName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Delete AI Assistant',
      `Are you sure you want to disconnect AI automation from ${botName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteBot(configId),
        },
      ]
    );
  };

  const handleResetHistoryConfirm = (botId: string, botName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Reset Chat History',
      `Clear all stored conversation lead memories for ${botName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => resetHistory({ botId }),
        },
      ]
    );
  };

  const handleConnectSubmit = async () => {
    if (!botToken.trim()) {
      Alert.alert('Required', 'Please enter your Telegram bot token from @BotFather.');
      return;
    }
    if (!apiKey.trim()) {
      Alert.alert('Required', 'Please enter your OpenAI API key.');
      return;
    }

    await connectBot({
      botToken: botToken.trim(),
      botName: botName.trim() || undefined,
      botUsername: botUsername.trim() || undefined,
      supportName: supportName.trim() || 'AI Assistant',
      provider,
      apiKey: apiKey.trim(),
      knowledgeBaseName: knowledgeBaseName.trim() || 'Multimedia Knowledge Base',
      businessInfo: businessInfo.trim(),
    });
  };

  const handleUpdateSubmit = async () => {
    if (!editingChatbot) return;
    await updateBot({
      id: editingChatbot.id,
      payload: {
        supportName: supportName.trim(),
        provider,
        apiKey: apiKey.trim() || undefined,
        knowledgeBaseName: knowledgeBaseName.trim(),
        businessInfo: businessInfo.trim(),
      },
    });
  };

  const handleOpenUserThread = (session: ChatBotSession) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!activeSessionBot) return;
    setActiveUserThread({
      botId: activeSessionBot.botId,
      botName: activeSessionBot.botName,
      telegramUserId: session.telegram_user_id,
      userName: session.user_name || 'Telegram User',
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
        {/* Header */}
        <View style={[styles.header, isDark ? styles.borderDark : styles.borderLight]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, isDark ? styles.textDark : styles.textLight]}>
              Chat Bot Automation
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              Attach an AI Assistant to your Telegram Bot
            </Text>
          </View>
          <Pressable style={[styles.closeBtn, isDark ? styles.closeBtnDark : styles.closeBtnLight]} onPress={onClose}>
            <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Action Banner */}
          <View style={styles.topActionRow}>
            <Text style={styles.headerDescription}>
              Map business details, upload documents, and link API keys to create automated support agents.
            </Text>
            <Pressable
              style={styles.connectMainBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                resetForm();
                setIsConnectOpen(true);
              }}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.connectMainBtnText}>Connect Telegram Bot</Text>
            </Pressable>
          </View>

          {/* Connected Bot Cards List */}
          {isLoading ? (
            <ActivityIndicator size="large" color="#0284C7" style={{ marginVertical: 40 }} />
          ) : (chatbots || []).length === 0 ? (
            <View style={[styles.emptyCard, isDark ? styles.cardDark : styles.cardLight]}>
              <Ionicons name="chatbubbles-outline" size={40} color="#94A3B8" />
              <Text style={[styles.emptyTitle, isDark ? styles.textDark : styles.textLight]}>
                No AI Chatbots Connected
              </Text>
              <Text style={styles.emptySubtitle}>
                Connect a Telegram bot and link your OpenAI key to start automated customer support.
              </Text>
              <Pressable
                style={styles.emptyAddBtn}
                onPress={() => setIsConnectOpen(true)}
              >
                <Text style={styles.emptyAddBtnText}>+ Connect Telegram Bot</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.botCardsList}>
              {(chatbots || []).map((bot: ChatBotConfig) => {
                const isListening = bot.status === 'active';
                return (
                  <View
                    key={bot.id}
                    style={[styles.botCard, isDark ? styles.cardDark : styles.cardLight]}
                  >
                    {/* Card Top: Avatar, Name, Username */}
                    <View style={styles.botCardTop}>
                      <View style={styles.avatarWrap}>
                        <Ionicons name="logo-android" size={24} color="#0284C7" />
                      </View>
                      <View style={styles.botIdentityCol}>
                        <Text style={[styles.botNameText, isDark ? styles.textDark : styles.textLight]}>
                          {bot.bot_name}
                        </Text>
                        <Text style={styles.botUsernameText}>
                          @{bot.bot_username.replace('@', '')}
                        </Text>
                      </View>
                    </View>

                    {/* Metadata Rows (1:1 with Web UI) */}
                    <View style={styles.metaSection}>
                      <View style={[styles.metaRow, isDark ? styles.metaRowDark : styles.metaRowLight]}>
                        <View style={styles.metaLabelRow}>
                          <Ionicons name="person-outline" size={14} color="#64748B" />
                          <Text style={styles.metaLabel}>Support Name</Text>
                        </View>
                        <Text style={[styles.metaValue, isDark ? styles.textDark : styles.textLight]}>
                          {bot.support_name || 'Ads Bot'}
                        </Text>
                      </View>

                      <View style={[styles.metaRow, isDark ? styles.metaRowDark : styles.metaRowLight]}>
                        <View style={styles.metaLabelRow}>
                          <Ionicons name="settings-outline" size={14} color="#64748B" />
                          <Text style={styles.metaLabel}>Model API</Text>
                        </View>
                        <Text style={[styles.metaValue, isDark ? styles.textDark : styles.textLight]}>
                          {bot.provider || 'OpenAI'}
                        </Text>
                      </View>

                      <View style={[styles.metaRow, isDark ? styles.metaRowDark : styles.metaRowLight]}>
                        <View style={styles.metaLabelRow}>
                          <Ionicons name="document-text-outline" size={14} color="#64748B" />
                          <Text style={styles.metaLabel}>Knowledge Base</Text>
                        </View>
                        <Text
                          style={[styles.metaValueHighlight]}
                          numberOfLines={1}
                        >
                          {bot.knowledge_base_name || 'Multimedia Kn...'}
                        </Text>
                      </View>
                    </View>

                    {/* Status & Open Bot Link Row */}
                    <View style={styles.statusAndLinkRow}>
                      <View style={[styles.statusPill, isListening ? styles.statusListening : styles.statusPaused]}>
                        <View style={[styles.statusDot, { backgroundColor: isListening ? '#10B981' : '#F59E0B' }]} />
                        <Text style={[styles.statusText, { color: isListening ? '#10B981' : '#F59E0B' }]}>
                          {isListening ? 'LISTENING' : 'PAUSED'}
                        </Text>
                      </View>

                      <Pressable
                        style={styles.openBotBtn}
                        onPress={() => handleOpenBotLink(bot.bot_username)}
                      >
                        <Ionicons name="open-outline" size={14} color="#0284C7" />
                        <Text style={styles.openBotText}>Open Bot Link</Text>
                      </Pressable>
                    </View>

                    {/* Action Buttons Row 1: Chats & Reset History */}
                    <View style={styles.actionRowPrimary}>
                      <Pressable
                        style={[styles.actionBtnPrimary, isDark ? styles.btnDark : styles.btnLight]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setActiveSessionBot({ botId: bot.bot_id, botName: bot.bot_name });
                        }}
                      >
                        <Ionicons name="chatbubbles-outline" size={15} color="#6366F1" />
                        <Text style={[styles.actionBtnPrimaryText, { color: '#6366F1' }]}>
                          Chats ({bot.chats_count || 0})
                        </Text>
                      </Pressable>

                      <Pressable
                        style={[styles.actionBtnPrimary, isDark ? styles.btnDark : styles.btnLight]}
                        onPress={() => handleResetHistoryConfirm(bot.bot_id, bot.bot_name)}
                      >
                        <Ionicons name="refresh-outline" size={15} color="#F59E0B" />
                        <Text style={[styles.actionBtnPrimaryText, { color: '#F59E0B' }]}>
                          Reset History
                        </Text>
                      </Pressable>
                    </View>

                    {/* Action Buttons Row 2: Edit, Pause, Delete */}
                    <View style={styles.actionRowSecondary}>
                      <Pressable
                        style={[styles.smallActionBtn, isDark ? styles.btnDark : styles.btnLight]}
                        onPress={() => handleEditPress(bot)}
                      >
                        <Text style={[styles.smallActionText, isDark ? styles.textDark : styles.textLight]}>
                          Edit
                        </Text>
                      </Pressable>

                      <Pressable
                        style={[styles.smallActionBtn, isDark ? styles.btnDark : styles.btnLight]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          toggleStatus({
                            configId: bot.id,
                            status: isListening ? 'paused' : 'active',
                          });
                        }}
                      >
                        <Text style={[styles.smallActionText, isDark ? styles.textDark : styles.textLight]}>
                          {isListening ? 'Pause' : 'Resume'}
                        </Text>
                      </Pressable>

                      <Pressable
                        style={[styles.smallActionBtn, isDark ? styles.btnDark : styles.btnLight]}
                        onPress={() => handleDeleteConfirm(bot.id, bot.bot_name)}
                      >
                        <Text style={[styles.smallActionText, { color: '#EF4444' }]}>
                          Delete
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Connect Telegram Bot Modal */}
        <Modal visible={isConnectOpen} transparent animationType="fade" onRequestClose={() => setIsConnectOpen(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, isDark ? styles.cardDark : styles.cardLight]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, isDark ? styles.textDark : styles.textLight]}>
                  Connect Telegram AI Bot
                </Text>
                <Pressable onPress={() => setIsConnectOpen(false)}>
                  <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                <Text style={[styles.fieldLabel, isDark ? styles.textDark : styles.textLight]}>
                  Telegram Bot Token (from @BotFather)
                </Text>
                <View style={[styles.inputWrapper, isDark ? styles.inputDark : styles.inputLight]}>
                  <TextInput
                    style={[styles.input, isDark ? styles.inputTextDark : styles.inputTextLight]}
                    placeholder="123456789:ABCdefGHIjklMNOpqr..."
                    placeholderTextColor="#94A3B8"
                    value={botToken}
                    onChangeText={setBotToken}
                    autoCapitalize="none"
                  />
                </View>

                <Text style={[styles.fieldLabel, isDark ? styles.textDark : styles.textLight, { marginTop: 10 }]}>
                  Support Agent Persona Name
                </Text>
                <View style={[styles.inputWrapper, isDark ? styles.inputDark : styles.inputLight]}>
                  <TextInput
                    style={[styles.input, isDark ? styles.inputTextDark : styles.inputTextLight]}
                    placeholder="e.g. Ads Bot or Support Agent"
                    placeholderTextColor="#94A3B8"
                    value={supportName}
                    onChangeText={setSupportName}
                  />
                </View>

                <Text style={[styles.fieldLabel, isDark ? styles.textDark : styles.textLight, { marginTop: 10 }]}>
                  OpenAI API Key
                </Text>
                <View style={[styles.inputWrapper, isDark ? styles.inputDark : styles.inputLight]}>
                  <TextInput
                    style={[styles.input, isDark ? styles.inputTextDark : styles.inputTextLight]}
                    placeholder="sk-..."
                    placeholderTextColor="#94A3B8"
                    value={apiKey}
                    onChangeText={setApiKey}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>

                <Text style={[styles.fieldLabel, isDark ? styles.textDark : styles.textLight, { marginTop: 10 }]}>
                  Knowledge Base Title
                </Text>
                <View style={[styles.inputWrapper, isDark ? styles.inputDark : styles.inputLight]}>
                  <TextInput
                    style={[styles.input, isDark ? styles.inputTextDark : styles.inputTextLight]}
                    placeholder="e.g. Multimedia Knowledge Base"
                    placeholderTextColor="#94A3B8"
                    value={knowledgeBaseName}
                    onChangeText={setKnowledgeBaseName}
                  />
                </View>

                <Text style={[styles.fieldLabel, isDark ? styles.textDark : styles.textLight, { marginTop: 10 }]}>
                  System Instructions & Persona Guidelines
                </Text>
                <View style={[styles.inputWrapper, isDark ? styles.inputDark : styles.inputLight, { height: 80 }]}>
                  <TextInput
                    style={[styles.input, isDark ? styles.inputTextDark : styles.inputTextLight, { textAlignVertical: 'top' }]}
                    placeholder="You are a helpful customer sales & support agent for..."
                    placeholderTextColor="#94A3B8"
                    value={businessInfo}
                    onChangeText={setBusinessInfo}
                    multiline
                  />
                </View>
              </ScrollView>

              <Pressable
                style={[styles.submitModalBtn, isConnecting && styles.btnDisabled]}
                onPress={handleConnectSubmit}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitModalBtnText}>Connect & Activate AI</Text>
                )}
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Edit Bot Modal */}
        <Modal visible={Boolean(editingChatbot)} transparent animationType="fade" onRequestClose={() => setEditingChatbot(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, isDark ? styles.cardDark : styles.cardLight]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, isDark ? styles.textDark : styles.textLight]}>
                  Edit {editingChatbot?.bot_name}
                </Text>
                <Pressable onPress={() => setEditingChatbot(null)}>
                  <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                <Text style={[styles.fieldLabel, isDark ? styles.textDark : styles.textLight]}>
                  Support Agent Persona Name
                </Text>
                <View style={[styles.inputWrapper, isDark ? styles.inputDark : styles.inputLight]}>
                  <TextInput
                    style={[styles.input, isDark ? styles.inputTextDark : styles.inputTextLight]}
                    value={supportName}
                    onChangeText={setSupportName}
                  />
                </View>

                <Text style={[styles.fieldLabel, isDark ? styles.textDark : styles.textLight, { marginTop: 10 }]}>
                  OpenAI API Key (Leave blank to keep existing)
                </Text>
                <View style={[styles.inputWrapper, isDark ? styles.inputDark : styles.inputLight]}>
                  <TextInput
                    style={[styles.input, isDark ? styles.inputTextDark : styles.inputTextLight]}
                    placeholder="Update API Key..."
                    placeholderTextColor="#94A3B8"
                    value={apiKey}
                    onChangeText={setApiKey}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>

                <Text style={[styles.fieldLabel, isDark ? styles.textDark : styles.textLight, { marginTop: 10 }]}>
                  Knowledge Base Title
                </Text>
                <View style={[styles.inputWrapper, isDark ? styles.inputDark : styles.inputLight]}>
                  <TextInput
                    style={[styles.input, isDark ? styles.inputTextDark : styles.inputTextLight]}
                    value={knowledgeBaseName}
                    onChangeText={setKnowledgeBaseName}
                  />
                </View>

                <Text style={[styles.fieldLabel, isDark ? styles.textDark : styles.textLight, { marginTop: 10 }]}>
                  System Instructions & Persona Guidelines
                </Text>
                <View style={[styles.inputWrapper, isDark ? styles.inputDark : styles.inputLight, { height: 100 }]}>
                  <TextInput
                    style={[styles.input, isDark ? styles.inputTextDark : styles.inputTextLight, { textAlignVertical: 'top' }]}
                    value={businessInfo}
                    onChangeText={setBusinessInfo}
                    multiline
                  />
                </View>
              </ScrollView>

              <Pressable
                style={[styles.submitModalBtn, isUpdating && styles.btnDisabled]}
                onPress={handleUpdateSubmit}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitModalBtnText}>Save Changes</Text>
                )}
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Sessions & Chat Conversations Modal */}
        <Modal visible={Boolean(activeSessionBot)} transparent animationType="slide" onRequestClose={() => setActiveSessionBot(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.sessionsCard, isDark ? styles.cardDark : styles.cardLight]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, isDark ? styles.textDark : styles.textLight]}>
                    {activeSessionBot?.botName} Chats
                  </Text>
                  <Text style={styles.subtitle}>Tap a contact to read full conversation thread</Text>
                </View>
                <Pressable onPress={() => setActiveSessionBot(null)}>
                  <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
                </Pressable>
              </View>

              {isLoadingSessions ? (
                <ActivityIndicator size="large" color="#0284C7" style={{ marginVertical: 30 }} />
              ) : (sessions || []).length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 30, gap: 6 }}>
                  <Ionicons name="chatbubbles-outline" size={36} color="#94A3B8" />
                  <Text style={[styles.emptyTitle, isDark ? styles.textDark : styles.textLight]}>
                    No Active Sessions Yet
                  </Text>
                  <Text style={styles.emptySubtitle}>Users who message this bot will appear here automatically.</Text>
                </View>
              ) : (
                <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                  <View style={{ gap: 8 }}>
                    {(sessions || []).map((session: ChatBotSession) => (
                      <Pressable
                        key={session.id}
                        style={[styles.sessionRow, isDark ? styles.metaRowDark : styles.metaRowLight]}
                        onPress={() => handleOpenUserThread(session)}
                      >
                        <View style={styles.sessionLeftCol}>
                          <View style={styles.sessionNameRow}>
                            <Ionicons name="person-circle" size={20} color="#0284C7" />
                            <Text style={[styles.sessionUserName, isDark ? styles.textDark : styles.textLight]}>
                              {session.user_name || 'Telegram User'}
                            </Text>
                          </View>
                          <Text style={styles.sessionUserId}>ID: {session.telegram_user_id}</Text>
                          {session.memory?.services_interested && (
                            <Text style={styles.sessionMemoryText} numberOfLines={1}>
                              Interested: {session.memory.services_interested.join(', ')}
                            </Text>
                          )}
                        </View>

                        <View style={styles.sessionRightCol}>
                          {session.memory?.lead_stage && (
                            <View style={styles.leadStageBadge}>
                              <Text style={styles.leadStageText}>{session.memory.lead_stage}</Text>
                            </View>
                          )}
                          <View style={styles.viewChatRow}>
                            <Text style={styles.viewChatText}>View Chat</Text>
                            <Ionicons name="chevron-forward" size={14} color="#0284C7" />
                          </View>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* Live Conversation Thread Viewer Modal */}
        <Modal visible={Boolean(activeUserThread)} transparent animationType="slide" onRequestClose={() => setActiveUserThread(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.threadCard, isDark ? styles.cardDark : styles.cardLight]}>
              {/* Thread Header */}
              <View style={[styles.threadHeader, isDark ? styles.borderDark : styles.borderLight]}>
                <Pressable
                  style={styles.backBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveUserThread(null);
                  }}
                >
                  <Ionicons name="arrow-back" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
                </Pressable>

                <View style={styles.threadHeaderInfo}>
                  <Text style={[styles.threadUserName, isDark ? styles.textDark : styles.textLight]} numberOfLines={1}>
                    {activeUserThread?.userName}
                  </Text>
                  <Text style={styles.threadUserId}>
                    Telegram ID: {activeUserThread?.telegramUserId} · Bot: {activeUserThread?.botName}
                  </Text>
                </View>

                <Pressable onPress={() => setActiveUserThread(null)}>
                  <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
                </Pressable>
              </View>

              {/* Lead Memory Insights Box (if available) */}
              {threadData?.memory && (
                <View style={[styles.leadMemoryBox, isDark ? styles.metaRowDark : styles.metaRowLight]}>
                  <View style={styles.leadMemoryHeader}>
                    <Ionicons name="sparkles" size={14} color="#6366F1" />
                    <Text style={styles.leadMemoryTitle}>AI Lead Intelligence</Text>
                    {threadData.memory.lead_stage && (
                      <View style={styles.leadStageBadge}>
                        <Text style={styles.leadStageText}>{threadData.memory.lead_stage}</Text>
                      </View>
                    )}
                  </View>
                  {threadData.memory.services_interested && (
                    <Text style={styles.leadMemoryItem}>
                      <Text style={{ fontWeight: '700' }}>Services:</Text> {threadData.memory.services_interested.join(', ')}
                    </Text>
                  )}
                  {threadData.memory.language && (
                    <Text style={styles.leadMemoryItem}>
                      <Text style={{ fontWeight: '700' }}>Language:</Text> {threadData.memory.language}
                    </Text>
                  )}
                </View>
              )}

              {/* Message Feed */}
              {isLoadingThread ? (
                <ActivityIndicator size="large" color="#0284C7" style={{ marginVertical: 40 }} />
              ) : (threadData?.messages || []).length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40, gap: 6 }}>
                  <Ionicons name="chatbubble-ellipses-outline" size={36} color="#94A3B8" />
                  <Text style={[styles.emptyTitle, isDark ? styles.textDark : styles.textLight]}>
                    No Messages Recorded
                  </Text>
                  <Text style={styles.emptySubtitle}>Conversations with this user will display here.</Text>
                </View>
              ) : (
                <ScrollView style={styles.messageScrollArea} contentContainerStyle={styles.messageFeedContent}>
                  {(threadData?.messages || []).map((msg: ChatBotMessage) => {
                    const isUser = msg.role === 'user';
                    return (
                      <View
                        key={msg.id}
                        style={[
                          styles.messageRow,
                          isUser ? styles.messageRowUser : styles.messageRowAssistant,
                        ]}
                      >
                        {!isUser && (
                          <View style={styles.aiBubbleAvatar}>
                            <Ionicons name="logo-android" size={14} color="#0284C7" />
                          </View>
                        )}
                        <View
                          style={[
                            styles.messageBubble,
                            isUser
                              ? styles.bubbleUser
                              : isDark
                              ? styles.bubbleAssistantDark
                              : styles.bubbleAssistantLight,
                          ]}
                        >
                          <Text
                            style={[
                              styles.messageContentText,
                              isUser
                                ? styles.textUserMessage
                                : isDark
                                ? styles.textDark
                                : styles.textLight,
                            ]}
                          >
                            {msg.content}
                          </Text>
                          <Text
                            style={[
                              styles.messageTimeText,
                              isUser ? styles.timeUserText : styles.timeAssistantText,
                            ]}
                          >
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerLight: { backgroundColor: '#F8FAFC' },
  containerDark: { backgroundColor: '#0B0F19' },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  borderLight: { borderBottomColor: '#E2E8F0' },
  borderDark: { borderBottomColor: '#27272A' },
  headerLeft: { flex: 1 },
  title: { fontSize: 18, fontWeight: '700' },
  textLight: { color: '#0F172A' },
  textDark: { color: '#F8FAFC' },
  subtitle: { color: '#64748B', fontSize: 12, marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnLight: { backgroundColor: '#F1F5F9' },
  closeBtnDark: { backgroundColor: '#27272A' },

  scrollArea: { flex: 1 },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 40 },

  // Action Banner
  topActionRow: { gap: 10 },
  headerDescription: { fontSize: 12.5, color: '#64748B', lineHeight: 17 },
  connectMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 12,
  },
  connectMainBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13.5 },

  // Bot Cards List
  botCardsList: { gap: 14 },
  botCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  cardLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  cardDark: { backgroundColor: '#121212', borderColor: '#27272A' },

  botCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  botIdentityCol: { flex: 1 },
  botNameText: { fontSize: 15, fontWeight: '700' },
  botUsernameText: { fontSize: 12, color: '#64748B', marginTop: 1 },

  // Meta Rows
  metaSection: { gap: 6 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  metaRowLight: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  metaRowDark: { backgroundColor: '#1F2430', borderColor: '#27272A' },
  metaLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaLabel: { fontSize: 11.5, color: '#64748B', fontWeight: '500' },
  metaValue: { fontSize: 12, fontWeight: '600' },
  metaValueHighlight: { fontSize: 12, fontWeight: '700', color: '#0284C7', maxWidth: 150 },

  // Status & Link
  statusAndLinkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  statusListening: { backgroundColor: 'rgba(16, 185, 129, 0.12)' },
  statusPaused: { backgroundColor: 'rgba(245, 158, 11, 0.12)' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10.5, fontWeight: '700' },
  openBotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  openBotText: { fontSize: 12, color: '#0284C7', fontWeight: '700' },

  // Primary Actions
  actionRowPrimary: { flexDirection: 'row', gap: 10 },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  btnLight: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  btnDark: { backgroundColor: '#1F2430', borderColor: '#27272A' },
  actionBtnPrimaryText: { fontSize: 12, fontWeight: '700' },

  // Secondary Actions
  actionRowSecondary: { flexDirection: 'row', gap: 8 },
  smallActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  smallActionText: { fontSize: 11.5, fontWeight: '600' },

  // Empty Box
  emptyCard: {
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
    marginVertical: 20,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptySubtitle: { fontSize: 12, color: '#94A3B8', textAlign: 'center', lineHeight: 17 },
  emptyAddBtn: {
    marginTop: 8,
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyAddBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12.5 },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  sessionsCard: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  threadCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  fieldLabel: { fontSize: 11.5, fontWeight: '700', marginBottom: 5 },
  inputWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  inputLight: { backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' },
  inputDark: { backgroundColor: '#1F2430', borderColor: '#334155' },
  input: { fontSize: 12.5, padding: 0 },
  inputTextLight: { color: '#0F172A' },
  inputTextDark: { color: '#FFFFFF' },
  submitModalBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  submitModalBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13.5 },

  // Sessions Rows
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  sessionLeftCol: { flex: 1, gap: 2 },
  sessionNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sessionUserName: { fontSize: 13, fontWeight: '700' },
  sessionUserId: { fontSize: 11, color: '#64748B' },
  sessionMemoryText: { fontSize: 11, color: '#0284C7', marginTop: 2 },
  sessionRightCol: { alignItems: 'flex-end', gap: 6 },
  leadStageBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  leadStageText: { fontSize: 9.5, fontWeight: '700', color: '#6366F1' },
  viewChatRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewChatText: { fontSize: 11.5, color: '#0284C7', fontWeight: '600' },

  // Thread Viewer
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
  },
  threadHeaderInfo: { flex: 1 },
  threadUserName: { fontSize: 15, fontWeight: '700' },
  threadUserId: { fontSize: 11, color: '#64748B', marginTop: 1 },

  leadMemoryBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    gap: 3,
  },
  leadMemoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  leadMemoryTitle: { fontSize: 11.5, fontWeight: '700', color: '#6366F1', flex: 1 },
  leadMemoryItem: { fontSize: 11, color: '#64748B' },

  messageScrollArea: { maxHeight: 420 },
  messageFeedContent: { gap: 10, paddingVertical: 6 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  messageRowUser: { justifyContent: 'flex-end' },
  messageRowAssistant: { justifyContent: 'flex-start' },
  aiBubbleAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
  },
  bubbleUser: {
    backgroundColor: '#0284C7',
    borderBottomRightRadius: 2,
  },
  bubbleAssistantLight: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderBottomLeftRadius: 2,
  },
  bubbleAssistantDark: {
    backgroundColor: '#1F2430',
    borderColor: '#27272A',
    borderWidth: 1,
    borderBottomLeftRadius: 2,
  },
  messageContentText: { fontSize: 13, lineHeight: 18 },
  textUserMessage: { color: '#FFFFFF' },
  messageTimeText: { fontSize: 9.5, marginTop: 4, alignSelf: 'flex-end' },
  timeUserText: { color: 'rgba(255, 255, 255, 0.7)' },
  timeAssistantText: { color: '#94A3B8' },
  btnDisabled: { opacity: 0.5 },
});
