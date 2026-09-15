import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface CreatePostModalProps {
  visible: boolean;
  connectedAccounts: any[];
  onClose: () => void;
  onSubmit: (payload: {
    caption: string;
    selectedChannels: string[];
    mediaUrls?: string[];
    isScheduled?: boolean;
    scheduledAt?: string;
    postType?: string;
  }) => Promise<void>;
  isLoading: boolean;
}

const AVAILABLE_CHANNELS = [
  { key: 'instagram', label: 'Instagram', icon: 'logo-instagram', color: '#E1306C' },
  { key: 'facebook', label: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
  { key: 'youtube', label: 'YouTube', icon: 'logo-youtube', color: '#FF0000' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'logo-linkedin', color: '#0A66C2' },
  { key: 'x', label: 'X (Twitter)', icon: 'logo-twitter', color: '#1DA1F2' },
  { key: 'pinterest', label: 'Pinterest', icon: 'logo-pinterest', color: '#E60023' },
];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  visible,
  connectedAccounts,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const [caption, setCaption] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['instagram']);
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [postMode, setPostMode] = useState<'now' | 'schedule'>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [postType, setPostType] = useState('post');
  const [error, setError] = useState<string | null>(null);

  const toggleChannel = (channelKey: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedChannels((prev) =>
      prev.includes(channelKey) ? prev.filter((k) => k !== channelKey) : [...prev, channelKey]
    );
  };

  const handlePublish = async () => {
    setError(null);
    if (!caption.trim()) {
      setError('Please enter a caption for your post.');
      return;
    }
    if (selectedChannels.length === 0) {
      setError('Please select at least one publishing channel.');
      return;
    }
    if (postMode === 'schedule' && !scheduledDate.trim()) {
      setError('Please enter a scheduled date/time (e.g. 2026-09-09T10:00:00Z).');
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await onSubmit({
        caption: caption.trim(),
        selectedChannels,
        mediaUrls: mediaUrlInput.trim() ? [mediaUrlInput.trim()] : [],
        isScheduled: postMode === 'schedule',
        scheduledAt: postMode === 'schedule' ? scheduledDate.trim() : undefined,
        postType,
      });
      setCaption('');
      setMediaUrlInput('');
      setScheduledDate('');
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to submit post.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-end">
        <View className="bg-[#181A1F] border-t border-[#262930] rounded-t-3xl max-h-[90%] p-5">
          {/* Modal Header */}
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center gap-2.5">
              <View className="w-9 h-9 rounded-xl justify-center items-center bg-pink-500/15">
                <Ionicons name="megaphone" size={20} color="#EC4899" />
              </View>
              <Text className="text-lg font-extrabold text-white">
                Create Social Broadcast
              </Text>
            </View>
            <Pressable onPress={onClose} className="p-1.5 rounded-lg bg-[#262930]">
              <Ionicons name="close" size={20} color="#94A3B8" />
            </Pressable>
          </View>

          <ScrollView className="max-h-[460px]" showsVerticalScrollIndicator={false}>
            {/* Target Channels */}
            <Text className="text-xs font-bold text-slate-300 mb-2">
              Target Platforms
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {AVAILABLE_CHANNELS.map((ch) => {
                const isSelected = selectedChannels.includes(ch.key);
                return (
                  <Pressable
                    key={ch.key}
                    onPress={() => toggleChannel(ch.key)}
                    className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl border ${
                      isSelected
                        ? 'border-pink-500 bg-pink-500/20'
                        : 'bg-[#111317] border-[#262930]'
                    }`}
                  >
                    <Ionicons
                      name={ch.icon as any}
                      size={16}
                      color={isSelected ? ch.color : '#94A3B8'}
                    />
                    <Text
                      className={`text-xs ${
                        isSelected
                          ? 'text-white font-bold'
                          : 'text-slate-400 font-medium'
                      }`}
                    >
                      {ch.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Caption */}
            <Text className="text-xs font-bold text-slate-300 mt-3.5 mb-2">
              Post Caption / Text
            </Text>
            <TextInput
              className="rounded-xl border border-[#262930] p-3 text-sm min-h-[90px] text-top bg-[#111317] text-white"
              multiline
              numberOfLines={4}
              placeholder="What would you like to broadcast across your social networks?..."
              placeholderTextColor="#64748B"
              value={caption}
              onChangeText={setCaption}
            />

            {/* Media URL */}
            <Text className="text-xs font-bold text-slate-300 mt-3.5 mb-2">
              Media URL (Optional Image or Video)
            </Text>
            <TextInput
              className="rounded-xl border border-[#262930] p-3 text-sm bg-[#111317] text-white"
              placeholder="https://example.com/media.jpg"
              placeholderTextColor="#64748B"
              value={mediaUrlInput}
              onChangeText={setMediaUrlInput}
              autoCapitalize="none"
            />

            {/* Publish Timing */}
            <Text className="text-xs font-bold text-slate-300 mt-3.5 mb-2">
              Publish Mode
            </Text>
            <View className="flex-row gap-2.5">
              <Pressable
                onPress={() => setPostMode('now')}
                className={`flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-xl border ${
                  postMode === 'now'
                    ? 'border-pink-500 bg-pink-500/15'
                    : 'bg-[#111317] border-[#262930]'
                }`}
              >
                <Ionicons
                  name="flash"
                  size={16}
                  color={postMode === 'now' ? '#EC4899' : '#94A3B8'}
                />
                <Text
                  className={`text-xs ${
                    postMode === 'now' ? 'text-pink-400 font-bold' : 'text-slate-400 font-medium'
                  }`}
                >
                  Publish Now
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setPostMode('schedule')}
                className={`flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-xl border ${
                  postMode === 'schedule'
                    ? 'border-pink-500 bg-pink-500/15'
                    : 'bg-[#111317] border-[#262930]'
                }`}
              >
                <Ionicons
                  name="calendar"
                  size={16}
                  color={postMode === 'schedule' ? '#EC4899' : '#94A3B8'}
                />
                <Text
                  className={`text-xs ${
                    postMode === 'schedule' ? 'text-pink-400 font-bold' : 'text-slate-400 font-medium'
                  }`}
                >
                  Schedule Post
                </Text>
              </Pressable>
            </View>

            {postMode === 'schedule' && (
              <View className="mt-2.5">
                <Text className="text-xs font-bold text-slate-300 mb-2">
                  Schedule Date & Time (ISO format)
                </Text>
                <TextInput
                  className="rounded-xl border border-[#262930] p-3 text-sm bg-[#111317] text-white"
                  placeholder={new Date(Date.now() + 4 * 3600000).toISOString()}
                  placeholderTextColor="#64748B"
                  value={scheduledDate}
                  onChangeText={setScheduledDate}
                  autoCapitalize="none"
                />
              </View>
            )}

            {error && (
              <View className="flex-row items-center gap-1.5 bg-red-500/10 p-2.5 rounded-xl mt-3">
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text className="text-red-400 text-xs flex-1 font-semibold">{error}</Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View className="flex-row gap-3 mt-4 pt-3 border-t border-[#262930]">
            <Pressable onPress={onClose} className="flex-1 py-3 rounded-xl items-center justify-center bg-[#262930]">
              <Text className="text-slate-300 text-sm font-bold">
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={handlePublish}
              disabled={isLoading}
              className={`flex-[2] bg-[#EC4899] py-3 rounded-xl flex-row items-center justify-center gap-2 ${isLoading ? 'opacity-60' : ''}`}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons
                    name={postMode === 'now' ? 'paper-plane' : 'time'}
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text className="text-white text-sm font-extrabold">
                    {postMode === 'now' ? 'Broadcast Now' : 'Schedule Broadcast'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
