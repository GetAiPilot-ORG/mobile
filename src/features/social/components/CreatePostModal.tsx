import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  useColorScheme,
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>
          {/* Modal Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconWrap, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                <Ionicons name="megaphone" size={20} color="#ec4899" />
              </View>
              <Text style={[styles.title, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                Create Social Broadcast
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Target Channels */}
            <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#334155' }]}>
              Target Platforms
            </Text>
            <View style={styles.channelsWrap}>
              {AVAILABLE_CHANNELS.map((ch) => {
                const isSelected = selectedChannels.includes(ch.key);
                return (
                  <Pressable
                    key={ch.key}
                    onPress={() => toggleChannel(ch.key)}
                    style={[
                      styles.channelChip,
                      {
                        backgroundColor: isSelected
                          ? `${ch.color}20`
                          : isDark
                          ? '#1e293b'
                          : '#f1f5f9',
                        borderColor: isSelected ? ch.color : 'transparent',
                      },
                    ]}
                  >
                    <Ionicons
                      name={ch.icon as any}
                      size={16}
                      color={isSelected ? ch.color : isDark ? '#94a3b8' : '#64748b'}
                    />
                    <Text
                      style={[
                        styles.channelChipText,
                        {
                          color: isSelected
                            ? ch.color
                            : isDark
                            ? '#cbd5e1'
                            : '#475569',
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {ch.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Caption */}
            <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#334155', marginTop: 14 }]}>
              Post Caption / Text
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                },
              ]}
              multiline
              numberOfLines={4}
              placeholder="What would you like to broadcast across your social networks?..."
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              value={caption}
              onChangeText={setCaption}
            />

            {/* Media URL */}
            <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#334155', marginTop: 14 }]}>
              Media URL (Optional Image or Video)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                },
              ]}
              placeholder="https://example.com/media.jpg"
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              value={mediaUrlInput}
              onChangeText={setMediaUrlInput}
              autoCapitalize="none"
            />

            {/* Publish Timing */}
            <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#334155', marginTop: 14 }]}>
              Publish Mode
            </Text>
            <View style={styles.modeRow}>
              <Pressable
                onPress={() => setPostMode('now')}
                style={[
                  styles.modeBtn,
                  postMode === 'now' && styles.modeBtnActive,
                  { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
                ]}
              >
                <Ionicons
                  name="flash"
                  size={16}
                  color={postMode === 'now' ? '#ec4899' : isDark ? '#94a3b8' : '#64748b'}
                />
                <Text
                  style={[
                    styles.modeBtnText,
                    postMode === 'now' && { color: '#ec4899', fontWeight: '700' },
                  ]}
                >
                  Publish Now
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setPostMode('schedule')}
                style={[
                  styles.modeBtn,
                  postMode === 'schedule' && styles.modeBtnActive,
                  { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
                ]}
              >
                <Ionicons
                  name="calendar"
                  size={16}
                  color={postMode === 'schedule' ? '#ec4899' : isDark ? '#94a3b8' : '#64748b'}
                />
                <Text
                  style={[
                    styles.modeBtnText,
                    postMode === 'schedule' && { color: '#ec4899', fontWeight: '700' },
                  ]}
                >
                  Schedule Post
                </Text>
              </Pressable>
            </View>

            {postMode === 'schedule' && (
              <View style={{ marginTop: 10 }}>
                <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#334155' }]}>
                  Schedule Date & Time (ISO format)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                    },
                  ]}
                  placeholder={new Date(Date.now() + 4 * 3600000).toISOString()}
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={scheduledDate}
                  onChangeText={setScheduledDate}
                  autoCapitalize="none"
                />
              </View>
            )}

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={[styles.cancelBtnText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={handlePublish}
              disabled={isLoading}
              style={[styles.submitBtn, isLoading && { opacity: 0.6 }]}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons
                    name={postMode === 'now' ? 'paper-plane' : 'time'}
                    size={16}
                    color="#ffffff"
                  />
                  <Text style={styles.submitBtnText}>
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
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
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
  },
  scrollBody: {
    maxHeight: 460,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  channelsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  channelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  channelChipText: {
    fontSize: 12,
  },
  textArea: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modeBtnActive: {
    borderColor: '#ec4899',
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
  },
  modeBtnText: {
    fontSize: 13,
    color: '#64748b',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.1)',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 2,
    backgroundColor: '#ec4899',
    paddingVertical: 13,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
