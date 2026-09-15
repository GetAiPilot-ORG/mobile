import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { telegramApi } from '../api/telegramApi';
import { ChatBotConfig, ChatBotSession, ChatBotMessage } from '../types';

interface ChatBotModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ChatBotModal: React.FC<ChatBotModalProps> = ({ visible, onClose }) => {
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
  const { data: chatbots, isLoading } = useQuery({
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
      <View className="flex-1 bg-[#0B0D10]">
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 py-3.5 border-b border-[#262930] bg-[#181A1F]">
          <View className="flex-1">
            <Text className="text-lg font-bold text-white">
              Chat Bot Automation
            </Text>
            <Text className="text-xs text-slate-400 mt-0.5" numberOfLines={1}>
              Attach an AI Assistant to your Telegram Bot
            </Text>
          </View>
          <Pressable className="w-8 h-8 rounded-full bg-[#111317] justify-center items-center active:opacity-70" onPress={onClose}>
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="p-4 gap-3.5 pb-10"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Action Banner */}
          <View className="gap-2.5">
            <Text className="text-xs text-slate-400 leading-5">
              Map business details, upload documents, and link API keys to create automated support agents.
            </Text>
            <Pressable
              className="flex-row items-center justify-center gap-1.5 bg-[#0084FF] py-3 rounded-xl active:opacity-90"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                resetForm();
                setIsConnectOpen(true);
              }}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text className="text-white font-bold text-sm">Connect Telegram Bot</Text>
            </Pressable>
          </View>

          {/* Connected Bot Cards List */}
          {isLoading ? (
            <ActivityIndicator size="large" color="#0084FF" className="my-10" />
          ) : (chatbots || []).length === 0 ? (
            <View className="p-7 rounded-2xl border border-[#262930] bg-[#181A1F] items-center gap-2 my-5">
              <Ionicons name="chatbubbles-outline" size={40} color="#94A3B8" />
              <Text className="text-base font-bold text-white">
                No AI Chatbots Connected
              </Text>
              <Text className="text-xs text-slate-400 text-center leading-5">
                Connect a Telegram bot and link your OpenAI key to start automated customer support.
              </Text>
              <Pressable
                className="mt-2 bg-[#0084FF] px-4 py-2.5 rounded-xl active:opacity-90"
                onPress={() => setIsConnectOpen(true)}
              >
                <Text className="text-white font-bold text-xs">+ Connect Telegram Bot</Text>
              </Pressable>
            </View>
          ) : (
            <View className="gap-3.5">
              {(chatbots || []).map((bot: ChatBotConfig) => {
                const isListening = bot.status === 'active';
                return (
                  <View
                    key={bot.id}
                    className="p-4 rounded-2xl border border-[#262930] bg-[#181A1F] gap-3"
                  >
                    {/* Card Top: Avatar, Name, Username */}
                    <View className="flex-row items-center gap-3">
                      <View className="w-11 h-11 rounded-full bg-[#0084FF]/10 justify-center items-center">
                        <Ionicons name="logo-android" size={24} color="#0084FF" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-bold text-white">
                          {bot.bot_name}
                        </Text>
                        <Text className="text-xs text-slate-400 mt-0.5">
                          @{bot.bot_username.replace('@', '')}
                        </Text>
                      </View>
                    </View>

                    {/* Metadata Rows */}
                    <View className="gap-1.5">
                      <View className="flex-row justify-between items-center px-3 py-2 rounded-xl border border-[#262930] bg-[#111317]">
                        <View className="flex-row items-center gap-1.5">
                          <Ionicons name="person-outline" size={14} color="#64748B" />
                          <Text className="text-xs text-slate-400 font-medium">Support Name</Text>
                        </View>
                        <Text className="text-xs font-semibold text-white">
                          {bot.support_name || 'Ads Bot'}
                        </Text>
                      </View>

                      <View className="flex-row justify-between items-center px-3 py-2 rounded-xl border border-[#262930] bg-[#111317]">
                        <View className="flex-row items-center gap-1.5">
                          <Ionicons name="settings-outline" size={14} color="#64748B" />
                          <Text className="text-xs text-slate-400 font-medium">Model API</Text>
                        </View>
                        <Text className="text-xs font-semibold text-white">
                          {bot.provider || 'OpenAI'}
                        </Text>
                      </View>

                      <View className="flex-row justify-between items-center px-3 py-2 rounded-xl border border-[#262930] bg-[#111317]">
                        <View className="flex-row items-center gap-1.5">
                          <Ionicons name="document-text-outline" size={14} color="#64748B" />
                          <Text className="text-xs text-slate-400 font-medium">Knowledge Base</Text>
                        </View>
                        <Text
                          className="text-xs font-bold text-[#0084FF] max-w-[150px]"
                          numberOfLines={1}
                        >
                          {bot.knowledge_base_name || 'Multimedia Kn...'}
                        </Text>
                      </View>
                    </View>

                    {/* Status & Open Bot Link Row */}
                    <View className="flex-row justify-between items-center py-0.5">
                      <View className={`flex-row items-center gap-1 px-2 py-1 rounded-lg ${isListening ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                        <View className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        <Text className={`text-[10px] font-bold ${isListening ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {isListening ? 'LISTENING' : 'PAUSED'}
                        </Text>
                      </View>

                      <Pressable
                        className="flex-row items-center gap-1 active:opacity-70"
                        onPress={() => handleOpenBotLink(bot.bot_username)}
                      >
                        <Ionicons name="open-outline" size={14} color="#0084FF" />
                        <Text className="text-xs text-[#0084FF] font-bold">Open Bot Link</Text>
                      </Pressable>
                    </View>

                    {/* Action Buttons Row 1: Chats & Reset History */}
                    <View className="flex-row gap-2.5">
                      <Pressable
                        className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#262930] bg-[#111317] active:opacity-80"
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setActiveSessionBot({ botId: bot.bot_id, botName: bot.bot_name });
                        }}
                      >
                        <Ionicons name="chatbubbles-outline" size={15} color="#818cf8" />
                        <Text className="text-xs font-bold text-indigo-400">
                          Chats ({bot.chats_count || 0})
                        </Text>
                      </Pressable>

                      <Pressable
                        className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#262930] bg-[#111317] active:opacity-80"
                        onPress={() => handleResetHistoryConfirm(bot.bot_id, bot.bot_name)}
                      >
                        <Ionicons name="refresh-outline" size={15} color="#fbbf24" />
                        <Text className="text-xs font-bold text-amber-400">
                          Reset History
                        </Text>
                      </Pressable>
                    </View>

                    {/* Action Buttons Row 2: Edit, Pause, Delete */}
                    <View className="flex-row gap-2">
                      <Pressable
                        className="flex-1 items-center justify-center py-2 rounded-lg border border-[#262930] bg-[#111317] active:opacity-80"
                        onPress={() => handleEditPress(bot)}
                      >
                        <Text className="text-xs font-semibold text-white">
                          Edit
                        </Text>
                      </Pressable>

                      <Pressable
                        className="flex-1 items-center justify-center py-2 rounded-lg border border-[#262930] bg-[#111317] active:opacity-80"
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          toggleStatus({
                            configId: bot.id,
                            status: isListening ? 'paused' : 'active',
                          });
                        }}
                      >
                        <Text className="text-xs font-semibold text-white">
                          {isListening ? 'Pause' : 'Resume'}
                        </Text>
                      </Pressable>

                      <Pressable
                        className="flex-1 items-center justify-center py-2 rounded-lg border border-rose-500/20 bg-rose-500/10 active:opacity-80"
                        onPress={() => handleDeleteConfirm(bot.id, bot.bot_name)}
                      >
                        <Text className="text-xs font-semibold text-rose-400">
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
          <View className="flex-1 bg-black/70 justify-center items-center p-5">
            <View className="w-full max-w-md rounded-2xl border border-[#262930] bg-[#181A1F] p-4">
              <View className="flex-row justify-between items-center mb-3.5">
                <Text className="text-base font-bold text-white">
                  Connect Telegram AI Bot
                </Text>
                <Pressable onPress={() => setIsConnectOpen(false)}>
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </Pressable>
              </View>

              <ScrollView className="max-h-[420px]" showsVerticalScrollIndicator={false}>
                <Text className="text-xs font-bold text-white mb-1.5">
                  Telegram Bot Token (from @BotFather)
                </Text>
                <View className="px-3 py-2 rounded-xl border border-[#262930] bg-[#111317]">
                  <TextInput
                    className="text-xs text-white p-0"
                    placeholder="123456789:ABCdefGHIjklMNOpqr..."
                    placeholderTextColor="#64748B"
                    value={botToken}
                    onChangeText={setBotToken}
                    autoCapitalize="none"
                  />
                </View>

                <Text className="text-xs font-bold text-white mb-1.5 mt-2.5">
                  Support Agent Persona Name
                </Text>
                <View className="px-3 py-2 rounded-xl border border-[#262930] bg-[#111317]">
                  <TextInput
                    className="text-xs text-white p-0"
                    placeholder="e.g. Ads Bot or Support Agent"
                    placeholderTextColor="#64748B"
                    value={supportName}
                    onChangeText={setSupportName}
                  />
                </View>

                <Text className="text-xs font-bold text-white mb-1.5 mt-2.5">
                  OpenAI API Key
                </Text>
                <View className="px-3 py-2 rounded-xl border border-[#262930] bg-[#111317]">
                  <TextInput
                    className="text-xs text-white p-0"
                    placeholder="sk-..."
                    placeholderTextColor="#64748B"
                    value={apiKey}
                    onChangeText={setApiKey}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>

                <Text className="text-xs font-bold text-white mb-1.5 mt-2.5">
                  Knowledge Base Title
                </Text>
                <View className="px-3 py-2 rounded-xl border border-[#262930] bg-[#111317]">
                  <TextInput
                    className="text-xs text-white p-0"
                    placeholder="e.g. Multimedia Knowledge Base"
                    placeholderTextColor="#64748B"
                    value={knowledgeBaseName}
                    onChangeText={setKnowledgeBaseName}
                  />
                </View>

                <Text className="text-xs font-bold text-white mb-1.5 mt-2.5">
                  System Instructions & Persona Guidelines
                </Text>
                <View className="px-3 py-2 rounded-xl border border-[#262930] bg-[#111317] h-20">
                  <TextInput
                    className="text-xs text-white p-0"
                    style={{ textAlignVertical: 'top' }}
                    placeholder="You are a helpful customer sales & support agent for..."
                    placeholderTextColor="#64748B"
                    value={businessInfo}
                    onChangeText={setBusinessInfo}
                    multiline
                  />
                </View>
              </ScrollView>

              <Pressable
                className={`bg-[#0084FF] py-3 rounded-xl items-center mt-3.5 active:opacity-90 ${
                  isConnecting ? 'opacity-50' : ''
                }`}
                onPress={handleConnectSubmit}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-bold text-sm">Connect & Activate AI</Text>
                )}
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Edit Bot Modal */}
        <Modal visible={Boolean(editingChatbot)} transparent animationType="fade" onRequestClose={() => setEditingChatbot(null)}>
          <View className="flex-1 bg-black/70 justify-center items-center p-5">
            <View className="w-full max-w-md rounded-2xl border border-[#262930] bg-[#181A1F] p-4">
              <View className="flex-row justify-between items-center mb-3.5">
                <Text className="text-base font-bold text-white">
                  Edit {editingChatbot?.bot_name}
                </Text>
                <Pressable onPress={() => setEditingChatbot(null)}>
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </Pressable>
              </View>

              <ScrollView className="max-h-[420px]" showsVerticalScrollIndicator={false}>
                <Text className="text-xs font-bold text-white mb-1.5">
                  Support Agent Persona Name
                </Text>
                <View className="px-3 py-2 rounded-xl border border-[#262930] bg-[#111317]">
                  <TextInput
                    className="text-xs text-white p-0"
                    value={supportName}
                    onChangeText={setSupportName}
                  />
                </View>

                <Text className="text-xs font-bold text-white mb-1.5 mt-2.5">
                  OpenAI API Key (Leave blank to keep existing)
                </Text>
                <View className="px-3 py-2 rounded-xl border border-[#262930] bg-[#111317]">
                  <TextInput
                    className="text-xs text-white p-0"
                    placeholder="Update API Key..."
                    placeholderTextColor="#64748B"
                    value={apiKey}
                    onChangeText={setApiKey}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>

                <Text className="text-xs font-bold text-white mb-1.5 mt-2.5">
                  Knowledge Base Title
                </Text>
                <View className="px-3 py-2 rounded-xl border border-[#262930] bg-[#111317]">
                  <TextInput
                    className="text-xs text-white p-0"
                    value={knowledgeBaseName}
                    onChangeText={setKnowledgeBaseName}
                  />
                </View>

                <Text className="text-xs font-bold text-white mb-1.5 mt-2.5">
                  System Instructions & Persona Guidelines
                </Text>
                <View className="px-3 py-2 rounded-xl border border-[#262930] bg-[#111317] h-24">
                  <TextInput
                    className="text-xs text-white p-0"
                    style={{ textAlignVertical: 'top' }}
                    value={businessInfo}
                    onChangeText={setBusinessInfo}
                    multiline
                  />
                </View>
              </ScrollView>

              <Pressable
                className={`bg-[#0084FF] py-3 rounded-xl items-center mt-3.5 active:opacity-90 ${
                  isUpdating ? 'opacity-50' : ''
                }`}
                onPress={handleUpdateSubmit}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-bold text-sm">Save Changes</Text>
                )}
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Sessions & Chat Conversations Modal */}
        <Modal visible={Boolean(activeSessionBot)} transparent animationType="slide" onRequestClose={() => setActiveSessionBot(null)}>
          <View className="flex-1 bg-black/70 justify-center items-center p-5">
            <View className="w-full max-w-lg rounded-2xl border border-[#262930] bg-[#181A1F] p-4">
              <View className="flex-row justify-between items-center mb-3.5">
                <View>
                  <Text className="text-base font-bold text-white">
                    {activeSessionBot?.botName} Chats
                  </Text>
                  <Text className="text-xs text-slate-400 mt-0.5">Tap a contact to read full conversation thread</Text>
                </View>
                <Pressable onPress={() => setActiveSessionBot(null)}>
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </Pressable>
              </View>

              {isLoadingSessions ? (
                <ActivityIndicator size="large" color="#0084FF" className="my-8" />
              ) : (sessions || []).length === 0 ? (
                <View className="items-center py-8 gap-1.5">
                  <Ionicons name="chatbubbles-outline" size={36} color="#94A3B8" />
                  <Text className="text-sm font-bold text-white">
                    No Active Sessions Yet
                  </Text>
                  <Text className="text-xs text-slate-400">Users who message this bot will appear here automatically.</Text>
                </View>
              ) : (
                <ScrollView className="max-h-[420px]" showsVerticalScrollIndicator={false}>
                  <View className="gap-2">
                    {(sessions || []).map((session: ChatBotSession) => (
                      <Pressable
                        key={session.id}
                        className="flex-row justify-between items-center p-3 rounded-xl border border-[#262930] bg-[#111317] active:opacity-80"
                        onPress={() => handleOpenUserThread(session)}
                      >
                        <View className="flex-1 gap-0.5">
                          <View className="flex-row items-center gap-1.5">
                            <Ionicons name="person-circle" size={20} color="#0084FF" />
                            <Text className="text-xs font-bold text-white">
                              {session.user_name || 'Telegram User'}
                            </Text>
                          </View>
                          <Text className="text-[11px] text-slate-400">ID: {session.telegram_user_id}</Text>
                          {session.memory?.services_interested && (
                            <Text className="text-[11px] text-[#0084FF] mt-0.5" numberOfLines={1}>
                              Interested: {session.memory.services_interested.join(', ')}
                            </Text>
                          )}
                        </View>

                        <View className="items-end gap-1.5">
                          {session.memory?.lead_stage && (
                            <View className="bg-indigo-500/10 px-1.5 py-0.5 rounded-md">
                              <Text className="text-[10px] font-bold text-indigo-400">{session.memory.lead_stage}</Text>
                            </View>
                          )}
                          <View className="flex-row items-center gap-0.5">
                            <Text className="text-xs text-[#0084FF] font-semibold">View Chat</Text>
                            <Ionicons name="chevron-forward" size={14} color="#0084FF" />
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
          <View className="flex-1 bg-black/70 justify-center items-center p-4">
            <View className="w-full max-w-lg max-h-[90%] rounded-2xl border border-[#262930] bg-[#181A1F] p-4">
              {/* Thread Header */}
              <View className="flex-row items-center gap-2.5 pb-3 border-b border-[#262930] mb-2.5">
                <Pressable
                  className="w-8 h-8 rounded-full justify-center items-center bg-[#111317] active:opacity-70"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveUserThread(null);
                  }}
                >
                  <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                </Pressable>

                <View className="flex-1">
                  <Text className="text-sm font-bold text-white" numberOfLines={1}>
                    {activeUserThread?.userName}
                  </Text>
                  <Text className="text-[11px] text-slate-400 mt-0.5">
                    Telegram ID: {activeUserThread?.telegramUserId} · Bot: {activeUserThread?.botName}
                  </Text>
                </View>

                <Pressable onPress={() => setActiveUserThread(null)}>
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </Pressable>
              </View>

              {/* Lead Memory Insights Box (if available) */}
              {threadData?.memory && (
                <View className="p-2.5 rounded-xl border border-[#262930] bg-[#111317] mb-2.5 gap-1">
                  <View className="flex-row items-center gap-1.5 mb-0.5">
                    <Ionicons name="sparkles" size={14} color="#818cf8" />
                    <Text className="text-xs font-bold text-indigo-400 flex-1">AI Lead Intelligence</Text>
                    {threadData.memory.lead_stage && (
                      <View className="bg-indigo-500/10 px-1.5 py-0.5 rounded-md">
                        <Text className="text-[10px] font-bold text-indigo-400">{threadData.memory.lead_stage}</Text>
                      </View>
                    )}
                  </View>
                  {threadData.memory.services_interested && (
                    <Text className="text-xs text-slate-400">
                      <Text className="font-bold text-slate-300">Services:</Text> {threadData.memory.services_interested.join(', ')}
                    </Text>
                  )}
                  {threadData.memory.language && (
                    <Text className="text-xs text-slate-400">
                      <Text className="font-bold text-slate-300">Language:</Text> {threadData.memory.language}
                    </Text>
                  )}
                </View>
              )}

              {/* Message Feed */}
              {isLoadingThread ? (
                <ActivityIndicator size="large" color="#0084FF" className="my-10" />
              ) : (threadData?.messages || []).length === 0 ? (
                <View className="items-center py-10 gap-1.5">
                  <Ionicons name="chatbubble-ellipses-outline" size={36} color="#94A3B8" />
                  <Text className="text-sm font-bold text-white">
                    No Messages Recorded
                  </Text>
                  <Text className="text-xs text-slate-400">Conversations with this user will display here.</Text>
                </View>
              ) : (
                <ScrollView className="max-h-[420px]" contentContainerClassName="gap-2.5 py-1.5">
                  {(threadData?.messages || []).map((msg: ChatBotMessage) => {
                    const isUser = msg.role === 'user';
                    return (
                      <View
                        key={msg.id}
                        className={`flex-row items-end gap-1.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isUser && (
                          <View className="w-6 h-6 rounded-full bg-[#0084FF]/15 justify-center items-center mb-0.5">
                            <Ionicons name="logo-android" size={14} color="#0084FF" />
                          </View>
                        )}
                        <View
                          className={`max-w-[82%] px-3 py-2 rounded-2xl ${
                            isUser
                              ? 'bg-[#0084FF] rounded-br-none'
                              : 'bg-[#111317] border border-[#262930] rounded-bl-none'
                          }`}
                        >
                          <Text
                            className={`text-xs leading-5 ${isUser ? 'text-white' : 'text-slate-200'}`}
                          >
                            {msg.content}
                          </Text>
                          <Text
                            className={`text-[9px] mt-1 self-end ${
                              isUser ? 'text-white/70' : 'text-slate-400'
                            }`}
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

