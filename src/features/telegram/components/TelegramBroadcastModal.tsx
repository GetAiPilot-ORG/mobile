import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface TelegramBroadcastModalProps {
  visible: boolean;
  channels: any[];
  onClose: () => void;
  onSubmit: (payload: { channel_id: string; text: string; media_url?: string }) => Promise<void>;
  isLoading?: boolean;
}

export const TelegramBroadcastModal: React.FC<TelegramBroadcastModalProps> = ({
  visible,
  channels,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const [selectedChannelId, setSelectedChannelId] = useState<string>(
    channels[0]?.chat_id ? String(channels[0].chat_id) : ''
  );
  const [text, setText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!visible) return null;

  const handleSubmit = async () => {
    if (!selectedChannelId) {
      setError('Please select a target channel or group.');
      return;
    }
    if (!text.trim()) {
      setError('Please enter your broadcast message text.');
      return;
    }

    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await onSubmit({
        channel_id: selectedChannelId,
        text: text.trim(),
        media_url: mediaUrl.trim() || undefined,
      });
      setText('');
      setMediaUrl('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to queue broadcast task.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-end">
        <View className="rounded-t-3xl p-5 max-h-[80%] bg-[#181A1F] border-t border-[#262930]">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center gap-2.5">
              <View className="w-9 h-9 rounded-full items-center justify-center bg-[#0084FF]/15">
                <Ionicons name="megaphone" size={20} color="#0084FF" />
              </View>
              <Text className="text-base font-extrabold text-white">
                New Telegram Broadcast
              </Text>
            </View>
            <Pressable onPress={onClose} className="p-1 active:opacity-70">
              <Ionicons name="close" size={20} color="#94a3b8" />
            </Pressable>
          </View>

          {error && (
            <View className="flex-row items-center gap-2 bg-rose-500/10 p-2.5 rounded-lg mb-3 border border-rose-500/20">
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text className="text-rose-400 text-xs flex-1">{error}</Text>
            </View>
          )}

          <ScrollView className="mb-5" showsVerticalScrollIndicator={false}>
            {/* Target Channel Picker */}
            <Text className="text-xs font-bold text-white mb-2">
              Target Channel / Group
            </Text>
            {channels.length === 0 ? (
              <View className="p-3 rounded-lg bg-rose-500/10 mb-2.5 border border-rose-500/20">
                <Text className="text-xs text-rose-400">
                  No channels synced. Please sync your channels in the Channels tab.
                </Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-2.5">
                {channels.map((ch: any) => {
                  const chId = String(ch.chat_id || ch.id);
                  const isSelected = selectedChannelId === chId;
                  return (
                    <Pressable
                      key={chId}
                      onPress={() => setSelectedChannelId(chId)}
                      className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl border mr-2 ${
                        isSelected
                          ? 'bg-[#0084FF] border-[#0084FF]'
                          : 'bg-[#111317] border-[#262930]'
                      }`}
                    >
                      <Ionicons
                        name={ch.chat_type === 'group' ? 'people' : 'megaphone'}
                        size={14}
                        color={isSelected ? '#ffffff' : '#94a3b8'}
                      />
                      <Text
                        className={`text-xs font-bold ${
                          isSelected ? 'text-white' : 'text-slate-300'
                        }`}
                      >
                        {ch.chat_title || ch.title || 'Channel'}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            {/* Message Body */}
            <Text className="text-xs font-bold text-white mb-2 mt-3">
              Broadcast Message
            </Text>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Type your message or announcement..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={4}
              className="border border-[#262930] rounded-xl p-3 text-sm min-h-[90px] bg-[#111317] text-white"
              style={{ textAlignVertical: 'top' }}
            />

            {/* Optional Media URL */}
            <Text className="text-xs font-bold text-white mb-2 mt-3">
              Media URL (Optional Image/Video)
            </Text>
            <TextInput
              value={mediaUrl}
              onChangeText={setMediaUrl}
              placeholder="https://example.com/image.jpg"
              placeholderTextColor="#64748B"
              keyboardType="url"
              className="border border-[#262930] rounded-xl px-3.5 py-2.5 text-sm mb-4 bg-[#111317] text-white"
            />

            <Pressable
              onPress={handleSubmit}
              disabled={isLoading || channels.length === 0}
              className={`bg-[#0084FF] flex-row items-center justify-center gap-2 py-3.5 rounded-xl mt-2 mb-4 active:opacity-90 ${
                isLoading || channels.length === 0 ? 'opacity-60' : ''
              }`}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="send" size={16} color="#ffffff" />
                  <Text className="text-white text-sm font-extrabold">Queue Broadcast</Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

