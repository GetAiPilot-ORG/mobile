import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme, getColors } from '@/theme';

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
  const { isDark } = useTheme();
  const colors = getColors(isDark);

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
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: isDark ? '#1C1A25' : '#ffffff' }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconWrap, { backgroundColor: 'rgba(14, 165, 233, 0.15)' }]}>
                <Ionicons name="megaphone" size={20} color="#0ea5e9" />
              </View>
              <Text style={[styles.title, { color: isDark ? '#F5F3FB' : '#1C1A25' }]}>
                New Telegram Broadcast
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={isDark ? '#777383' : '#64748b'} />
            </Pressable>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Target Channel Picker */}
            <Text style={[styles.label, { color: isDark ? '#F5F3FB' : '#1C1A25' }]}>
              Target Channel / Group
            </Text>
            {channels.length === 0 ? (
              <View style={styles.emptyChannelsBox}>
                <Text style={styles.emptyChannelsText}>
                  No channels synced. Please sync your channels in the Channels tab.
                </Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.channelsRow}>
                {channels.map((ch: any) => {
                  const chId = String(ch.chat_id || ch.id);
                  const isSelected = selectedChannelId === chId;
                  return (
                    <Pressable
                      key={chId}
                      onPress={() => setSelectedChannelId(chId)}
                      style={[
                        styles.channelChip,
                        {
                          backgroundColor: isSelected
                            ? '#0ea5e9'
                            : isDark
                            ? '#252230'
                            : '#F0EEF8',
                          borderColor: isSelected ? '#0ea5e9' : isDark ? '#334155' : '#E9E6F2',
                        },
                      ]}
                    >
                      <Ionicons
                        name={ch.chat_type === 'group' ? 'people' : 'megaphone'}
                        size={14}
                        color={isSelected ? '#ffffff' : isDark ? '#777383' : '#64748b'}
                      />
                      <Text
                        style={[
                          styles.channelChipText,
                          { color: isSelected ? '#ffffff' : isDark ? '#F5F3FB' : '#1C1A25' },
                        ]}
                      >
                        {ch.chat_title || ch.title || 'Channel'}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            {/* Message Body */}
            <Text style={[styles.label, { color: isDark ? '#F5F3FB' : '#1C1A25', marginTop: 14 }]}>
              Broadcast Message
            </Text>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Type your message or announcement..."
              placeholderTextColor={isDark ? '#475569' : '#777383'}
              multiline
              numberOfLines={4}
              style={[
                styles.textArea,
                {
                  backgroundColor: isDark ? '#252230' : '#F5F3FB',
                  color: isDark ? '#F5F3FB' : '#1C1A25',
                  borderColor: isDark ? '#334155' : '#E9E6F2',
                },
              ]}
            />

            {/* Optional Media URL */}
            <Text style={[styles.label, { color: isDark ? '#F5F3FB' : '#1C1A25', marginTop: 14 }]}>
              Media URL (Optional Image/Video)
            </Text>
            <TextInput
              value={mediaUrl}
              onChangeText={setMediaUrl}
              placeholder="https://example.com/image.jpg"
              placeholderTextColor={isDark ? '#475569' : '#777383'}
              keyboardType="url"
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#252230' : '#F5F3FB',
                  color: isDark ? '#F5F3FB' : '#1C1A25',
                  borderColor: isDark ? '#334155' : '#E9E6F2',
                },
              ]}
            />

            <Pressable
              onPress={handleSubmit}
              disabled={isLoading || channels.length === 0}
              style={[
                styles.submitBtn,
                (isLoading || channels.length === 0) && { opacity: 0.6 },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="send" size={16} color="#ffffff" />
                  <Text style={styles.submitBtnText}>Queue Broadcast</Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%', borderRadius: 24 , borderWidth: 0 , shadowOpacity: 0 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '500', lineHeight: 36 , letterSpacing: -0.5 },
  closeBtn: {
    padding: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    flex: 1,
  },
  scrollBody: {
    paddingBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  channelsRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  channelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
  },
  channelChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyChannelsBox: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    marginBottom: 10,
  },
  emptyChannelsText: {
    fontSize: 12,
    color: '#ef4444',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  input: {
    borderWidth: 0,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 18, minHeight: 48 },
  submitBtn: {
    backgroundColor: '#0ea5e9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
