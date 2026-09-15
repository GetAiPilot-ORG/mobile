import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { TelegramChat, CreateForwardRulePayload } from '../types';

interface AutoforwardModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateForwardRulePayload) => Promise<any>;
  isLoading: boolean;
  chats?: TelegramChat[];
  onRefreshChats?: () => void;
}

export const AutoforwardModal: React.FC<AutoforwardModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isLoading,
  chats = [],
  onRefreshChats,
}) => {
  const [selectedSourceChat, setSelectedSourceChat] = useState<TelegramChat | null>(null);
  const [selectedTargetChat, setSelectedTargetChat] = useState<TelegramChat | null>(null);
  const [customSource, setCustomSource] = useState('');
  const [customTarget, setCustomTarget] = useState('');

  const [whitelistKeywords, setWhitelistKeywords] = useState('');
  const [blacklistKeywords, setBlacklistKeywords] = useState('');
  const [delaySec, setDelaySec] = useState<number>(0);
  const [replaceHeader, setReplaceHeader] = useState('');
  const [replaceFooter, setReplaceFooter] = useState('');
  const [addBranding, setAddBranding] = useState(false);

  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showTargetPicker, setShowTargetPicker] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async () => {
    const sourceTitle = selectedSourceChat ? selectedSourceChat.title : customSource.trim();
    const targetTitle = selectedTargetChat ? selectedTargetChat.title : customTarget.trim();

    if (!sourceTitle) {
      setErrorMessage('Please select or specify a source channel.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (!targetTitle) {
      setErrorMessage('Please select or specify a destination target channel.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setErrorMessage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    await onSubmit({
      sourceChannel: sourceTitle,
      targetChannel: targetTitle,
      sourceChannelId: selectedSourceChat?.id,
      targetChannelId: selectedTargetChat?.id,
      keywordsFilter: whitelistKeywords ? whitelistKeywords.split(',').map((k) => k.trim()).filter(Boolean) : [],
      blacklistKeywords: blacklistKeywords ? blacklistKeywords.split(',').map((k) => k.trim()).filter(Boolean) : [],
      addHeaderFooter: addBranding,
      replaceHeader: addBranding && replaceHeader.trim() ? replaceHeader.trim() : undefined,
      replaceFooter: addBranding && replaceFooter.trim() ? replaceFooter.trim() : undefined,
      delaySeconds: delaySec,
    });
    onClose();
  };

  const delayOptions = [0, 3, 5, 10, 30];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-[#0B0D10]">
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 py-3.5 border-b border-[#262930] bg-[#181A1F]">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-xl bg-[#0084FF]/10 items-center justify-center">
              <Ionicons name="git-compare-outline" size={20} color="#0084FF" />
            </View>
            <View>
              <Text className="text-base font-bold text-white">GAP Autoforwarding</Text>
              <Text className="text-xs text-slate-400">Real-time automated message routing engine</Text>
            </View>
          </View>
          <Pressable
            className="w-8 h-8 rounded-full bg-[#262930] items-center justify-center"
            onPress={onClose}
            hitSlop={8}
          >
            <Ionicons name="close" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="p-4 pb-10" showsVerticalScrollIndicator={false}>
          {errorMessage && (
            <View className="flex-row items-center gap-2 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl mb-4">
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text className="text-xs font-semibold text-rose-400 flex-1">{errorMessage}</Text>
            </View>
          )}

          {/* SOURCE CHANNEL PICKER */}
          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-1.5">
              <Text className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">1. Source Channel / Group (From)</Text>
              {onRefreshChats && (
                <Pressable onPress={onRefreshChats} hitSlop={8} className="flex-row items-center gap-1">
                  <Ionicons name="sync-outline" size={11} color="#0084FF" />
                  <Text className="text-[11px] font-bold text-[#0084FF]">Sync Chats</Text>
                </Pressable>
              )}
            </View>

            <Pressable
              className="flex-row items-center justify-between bg-[#181A1F] border border-[#262930] rounded-xl px-3.5 py-3 active:bg-[#262930]"
              onPress={() => {
                setShowSourcePicker(!showSourcePicker);
                setShowTargetPicker(false);
              }}
            >
              <View className="flex-row items-center gap-2 flex-1 mr-2">
                <Ionicons name="radio-button-on" size={16} color="#0084FF" />
                <Text className="text-xs font-bold text-white flex-1" numberOfLines={1}>
                  {selectedSourceChat ? selectedSourceChat.title : (customSource || 'Select a synced Telegram channel')}
                </Text>
              </View>
              <Ionicons name={showSourcePicker ? 'chevron-up' : 'chevron-down'} size={16} color="#94A3B8" />
            </Pressable>

            {showSourcePicker && (
              <View className="bg-[#181A1F] border border-[#262930] rounded-xl mt-1.5 py-2">
                <Text className="text-[10px] font-bold text-slate-400 px-3 py-1 tracking-wider uppercase">Your Synced Channels</Text>
                {chats.length === 0 ? (
                  <Text className="text-xs text-slate-400 px-3 py-2">No channels synced yet. Type a channel handle below.</Text>
                ) : (
                  chats.map((c, idx) => (
                    <Pressable
                      key={`source_chat_${c.id || c.title || 'chat'}_${idx}`}
                      className={`flex-row items-center justify-between px-3 py-2.5 ${selectedSourceChat?.id === c.id ? 'bg-[#0084FF]/20' : 'active:bg-[#262930]'}`}
                      onPress={() => {
                        setSelectedSourceChat(c);
                        setShowSourcePicker(false);
                      }}
                    >
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-white">{c.title}</Text>
                        <Text className="text-[10px] text-slate-400">{c.type ? c.type.charAt(0).toUpperCase() + c.type.slice(1).toLowerCase() : ''} • {c.member_count || 0} members</Text>
                      </View>
                      {selectedSourceChat?.id === c.id && <Ionicons name="checkmark" size={16} color="#0084FF" />}
                    </Pressable>
                  ))
                )}
                <View className="px-3 pt-2 mt-1 border-t border-[#262930]">
                  <Text className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">Or Enter Custom Handle</Text>
                  <TextInput
                    className="bg-[#111317] border border-[#262930] rounded-lg px-3 py-2 text-xs text-white"
                    placeholder="@channel_or_link"
                    placeholderTextColor="#64748B"
                    value={customSource}
                    onChangeText={(val) => {
                      setCustomSource(val);
                      setSelectedSourceChat(null);
                    }}
                  />
                </View>
              </View>
            )}
          </View>

          {/* TARGET CHANNEL PICKER */}
          <View className="mb-4">
            <Text className="text-[10px] font-bold text-slate-400 mb-1.5 tracking-wider uppercase">2. Target Channel / Group (Forward To)</Text>
            <Pressable
              className="flex-row items-center justify-between bg-[#181A1F] border border-[#262930] rounded-xl px-3.5 py-3 active:bg-[#262930]"
              onPress={() => {
                setShowTargetPicker(!showTargetPicker);
                setShowSourcePicker(false);
              }}
            >
              <View className="flex-row items-center gap-2 flex-1 mr-2">
                <Ionicons name="arrow-redo" size={16} color="#10B981" />
                <Text className="text-xs font-bold text-white flex-1" numberOfLines={1}>
                  {selectedTargetChat ? selectedTargetChat.title : (customTarget || 'Select target destination channel')}
                </Text>
              </View>
              <Ionicons name={showTargetPicker ? 'chevron-up' : 'chevron-down'} size={16} color="#94A3B8" />
            </Pressable>

            {showTargetPicker && (
              <View className="bg-[#181A1F] border border-[#262930] rounded-xl mt-1.5 py-2">
                <Text className="text-[10px] font-bold text-slate-400 px-3 py-1 tracking-wider uppercase">Your Synced Channels</Text>
                {chats.length === 0 ? (
                  <Text className="text-xs text-slate-400 px-3 py-2">No channels synced yet. Type a target channel below.</Text>
                ) : (
                  chats.map((c, idx) => (
                    <Pressable
                      key={`target_chat_${c.id || c.title || 'chat'}_${idx}`}
                      className={`flex-row items-center justify-between px-3 py-2.5 ${selectedTargetChat?.id === c.id ? 'bg-emerald-500/20' : 'active:bg-[#262930]'}`}
                      onPress={() => {
                        setSelectedTargetChat(c);
                        setShowTargetPicker(false);
                      }}
                    >
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-white">{c.title}</Text>
                        <Text className="text-[10px] text-slate-400">{c.type ? c.type.charAt(0).toUpperCase() + c.type.slice(1).toLowerCase() : ''} • {c.member_count || 0} members</Text>
                      </View>
                      {selectedTargetChat?.id === c.id && <Ionicons name="checkmark" size={16} color="#10B981" />}
                    </Pressable>
                  ))
                )}
                <View className="px-3 pt-2 mt-1 border-t border-[#262930]">
                  <Text className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">Or Enter Custom Target</Text>
                  <TextInput
                    className="bg-[#111317] border border-[#262930] rounded-lg px-3 py-2 text-xs text-white"
                    placeholder="@target_channel"
                    placeholderTextColor="#64748B"
                    value={customTarget}
                    onChangeText={(val) => {
                      setCustomTarget(val);
                      setSelectedTargetChat(null);
                    }}
                  />
                </View>
              </View>
            )}
          </View>

          {/* KEYWORD WHITELIST */}
          <View className="mb-4">
            <Text className="text-[10px] font-bold text-slate-400 mb-1.5 tracking-wider uppercase">3. Keyword Whitelist (Required to match)</Text>
            <TextInput
              className="bg-[#181A1F] border border-[#262930] rounded-xl px-3.5 py-3 text-xs text-white"
              placeholder="BUY, SELL, TARGET, STOPLOSS..."
              placeholderTextColor="#64748B"
              value={whitelistKeywords}
              onChangeText={setWhitelistKeywords}
            />
            <Text className="text-[10px] text-slate-500 mt-1">Only messages containing at least one of these words will be forwarded.</Text>
          </View>

          {/* KEYWORD BLACKLIST */}
          <View className="mb-4">
            <Text className="text-[10px] font-bold text-slate-400 mb-1.5 tracking-wider uppercase">4. Keyword Blacklist (Skip message if found)</Text>
            <TextInput
              className="bg-[#181A1F] border border-[#262930] rounded-xl px-3.5 py-3 text-xs text-white"
              placeholder="SPAM, AD, JOIN, PROMO..."
              placeholderTextColor="#64748B"
              value={blacklistKeywords}
              onChangeText={setBlacklistKeywords}
            />
            <Text className="text-[10px] text-slate-500 mt-1">Messages containing any blacklist words will be automatically ignored.</Text>
          </View>

          {/* DELAY SETTINGS */}
          <View className="mb-4">
            <Text className="text-[10px] font-bold text-slate-400 mb-1.5 tracking-wider uppercase">5. Forwarding Delay</Text>
            <View className="flex-row flex-wrap gap-2">
              {delayOptions.map((sec) => (
                <Pressable
                  key={sec}
                  className={`px-3.5 py-2 rounded-xl border ${delaySec === sec ? 'bg-[#0084FF] border-[#0084FF]' : 'bg-[#181A1F] border-[#262930]'}`}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setDelaySec(sec);
                  }}
                >
                  <Text
                    className={`text-xs font-bold ${delaySec === sec ? 'text-white' : 'text-slate-300'}`}
                  >
                    {sec === 0 ? 'Instant (0s)' : `${sec}s delay`}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* CUSTOM BRANDING SWITCH */}
          <View className="flex-row items-center justify-between bg-[#181A1F] border border-[#262930] p-4 rounded-xl mb-4">
            <View className="flex-1 mr-3">
              <Text className="text-sm font-bold text-white">
                Add Header & Footer Branding
              </Text>
              <Text className="text-xs text-slate-400 mt-0.5">Prepend header and append community links to forwarded posts</Text>
            </View>
            <Switch
              value={addBranding}
              onValueChange={setAddBranding}
              trackColor={{ false: '#262930', true: '#0084FF' }}
            />
          </View>

          {addBranding && (
            <View className="bg-[#181A1F] border border-[#262930] p-4 rounded-xl mb-4">
              <View className="mb-3">
                <Text className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">Header Text</Text>
                <TextInput
                  className="bg-[#111317] border border-[#262930] rounded-xl px-3 py-2 text-xs text-white"
                  value={replaceHeader}
                  onChangeText={setReplaceHeader}
                />
              </View>
              <View>
                <Text className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">Footer Link / CTA</Text>
                <TextInput
                  className="bg-[#111317] border border-[#262930] rounded-xl px-3 py-2 text-xs text-white"
                  value={replaceFooter}
                  onChangeText={setReplaceFooter}
                />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View className="p-4 border-t border-[#262930] bg-[#181A1F]">
          <Pressable
            className="bg-[#0084FF] flex-row justify-center items-center gap-2 py-3.5 rounded-xl active:opacity-80"
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="flash-outline" size={18} color="#FFFFFF" />
                <Text className="text-sm font-bold text-white">Save & Activate Forwarding Rule</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};
