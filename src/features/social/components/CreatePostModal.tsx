import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
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
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { apiClient } from '../../../core/api/client';
import { openSocialHandoff } from '../utils/socialHandoff';

interface CreatePostModalProps {
  visible: boolean;
  connectedAccounts: any[];
  initialCaption?: string;
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
  entitlementsData?: any;
  queueCount?: number;
}

interface UploadedMediaItem {
  localUri: string;
  publicUrl: string;
  type: 'image' | 'video';
  fileName?: string;
  fileSize?: number;
  duration?: number;
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
  initialCaption,
  onClose,
  onSubmit,
  isLoading,
  entitlementsData,
  queueCount = 0,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [caption, setCaption] = useState(initialCaption || '');
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['instagram']);
  const [attachedMedia, setAttachedMedia] = useState<UploadedMediaItem[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [postMode, setPostMode] = useState<'now' | 'schedule'>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [postType] = useState('post');
  const [error, setError] = useState<string | null>(null);

  // Sync initialCaption when opened or updated
  useEffect(() => {
    if (initialCaption != null) {
      setCaption(initialCaption);
    }
  }, [initialCaption]);

  const toggleChannel = (channelKey: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedChannels((prev) =>
      prev.includes(channelKey) ? prev.filter((k) => k !== channelKey) : [...prev, channelKey]
    );
  };

  const processAndUploadAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    setIsUploadingMedia(true);
    setUploadStatusText('Uploading from device to CDN...');
    setError(null);

    try {
      const isVideo =
        asset.type === 'video' ||
        (asset.mimeType && asset.mimeType.startsWith('video/')) ||
        (asset.uri && (asset.uri.endsWith('.mp4') || asset.uri.endsWith('.mov')));

      const mimeType = asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg');
      const base64Data = asset.base64
        ? `data:${mimeType};base64,${asset.base64}`
        : asset.uri;

      const uploadRes = await apiClient.post<{
        success: boolean;
        publicUrl: string;
        fileName: string;
        size: number;
      }>('/mobile/v1/social/media/upload', {
        fileData: base64Data,
        fileName: asset.fileName || (isVideo ? `video_${Date.now()}.mp4` : `photo_${Date.now()}.jpg`),
        contentType: mimeType,
      });

      if (uploadRes?.publicUrl) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setAttachedMedia((prev) => [
          ...prev,
          {
            localUri: asset.uri,
            publicUrl: uploadRes.publicUrl,
            type: isVideo ? 'video' : 'image',
            fileName: uploadRes.fileName,
            fileSize: uploadRes.size,
            duration: asset.duration || undefined,
          },
        ]);
      } else {
        throw new Error('Upload succeeded but no public URL was returned.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to upload selected media.');
    } finally {
      setIsUploadingMedia(false);
      setUploadStatusText('');
    }
  };

  const handlePickFromGallery = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError(null);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Needed',
          'Please allow photo and video library access to select media from your mobile device.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        await processAndUploadAsset(result.assets[0]);
      }
    } catch (err: any) {
      setError(err?.message || 'Could not pick media from gallery.');
    }
  };

  const handleCaptureCamera = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError(null);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Needed',
          'Please allow camera access to capture a photo or video directly from your phone.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        await processAndUploadAsset(result.assets[0]);
      }
    } catch (err: any) {
      setError(err?.message || 'Could not capture photo or video.');
    }
  };

  const handleRemoveMedia = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAttachedMedia((prev) => prev.filter((_, i) => i !== index));
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
    if (postMode === 'schedule') {
      if (!scheduledDate.trim()) {
        setError('Please enter a scheduled date/time (e.g. 2026-09-16T18:00:00Z).');
        return;
      }
      const queueLimit = entitlementsData?.limits?.scheduled_queue ?? 10;
      const isUnlimitedQueue = queueLimit >= 1000000;
      if (!isUnlimitedQueue && queueCount >= queueLimit) {
        const pName = entitlementsData?.plan?.name || 'Free';
        setError(`Plan queue limit reached (${queueCount}/${queueLimit}). Upgrade to schedule more.`);
        Alert.alert(
          'Queue Limit Reached',
          `Your ${pName} plan allows up to ${queueLimit} scheduled posts in queue. Upgrade to Starter or Growth for unlimited queue publications.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Upgrade Plan',
              onPress: () => {
                onClose();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/products/social/plans' as any);
              },
            },
          ]
        );
        return;
      }
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await onSubmit({
        caption: caption.trim(),
        selectedChannels,
        mediaUrls: attachedMedia.map((m) => m.publicUrl),
        isScheduled: postMode === 'schedule',
        scheduledAt: postMode === 'schedule' ? scheduledDate.trim() : undefined,
        postType,
      });
      setCaption('');
      setAttachedMedia([]);
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

            {/* Media Upload from Mobile Device */}
            <View style={styles.mediaSectionHeader}>
              <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#334155' }]}>
                Media Attachments (Photos & Videos)
              </Text>
              {attachedMedia.length > 0 && (
                <Text style={styles.mediaCountBadge}>
                  {attachedMedia.length} attached
                </Text>
              )}
            </View>

            {/* Attached Media Cards */}
            {attachedMedia.map((item, idx) => (
              <View
                key={`${item.publicUrl}_${idx}`}
                style={[
                  styles.attachedMediaCard,
                  {
                    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                  },
                ]}
              >
                <Image
                  source={{ uri: item.localUri || item.publicUrl }}
                  style={styles.mediaThumb}
                  resizeMode="cover"
                />
                <View style={styles.mediaInfo}>
                  <View style={styles.mediaTypeRow}>
                    <View
                      style={[
                        styles.mediaTypeBadge,
                        {
                          backgroundColor:
                            item.type === 'video'
                              ? 'rgba(239, 68, 68, 0.15)'
                              : 'rgba(16, 185, 129, 0.15)',
                        },
                      ]}
                    >
                      <Ionicons
                        name={item.type === 'video' ? 'videocam' : 'image'}
                        size={12}
                        color={item.type === 'video' ? '#ef4444' : '#10b981'}
                      />
                      <Text
                        style={[
                          styles.mediaTypeText,
                          { color: item.type === 'video' ? '#ef4444' : '#10b981' },
                        ]}
                      >
                        {item.type.toUpperCase()}
                        {item.duration ? ` • ${Math.round(item.duration)}s` : ''}
                      </Text>
                    </View>
                    <Text style={styles.uploadStatusOk}>✓ Uploaded to CDN</Text>
                  </View>
                  <Text
                    style={[styles.mediaFileName, { color: isDark ? '#cbd5e1' : '#475569' }]}
                    numberOfLines={1}
                  >
                    {item.fileName || 'Attached media item'}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleRemoveMedia(idx)}
                  style={styles.removeMediaBtn}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </Pressable>
              </View>
            ))}

            {/* Uploading Spinner */}
            {isUploadingMedia && (
              <View
                style={[
                  styles.uploadingBox,
                  {
                    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                  },
                ]}
              >
                <ActivityIndicator size="small" color="#ec4899" />
                <Text style={[styles.uploadingText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                  {uploadStatusText || 'Uploading media from device...'}
                </Text>
              </View>
            )}

            {/* Device Picker Buttons */}
            {attachedMedia.length < 4 && !isUploadingMedia && (
              <View style={styles.uploadActionRow}>
                <Pressable
                  onPress={handlePickFromGallery}
                  style={[
                    styles.uploadPickerBtn,
                    {
                      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                      borderColor: isDark ? '#334155' : '#cbd5e1',
                    },
                  ]}
                >
                  <Ionicons name="images" size={18} color="#ec4899" />
                  <Text style={[styles.uploadPickerBtnText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                    Upload from Gallery
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleCaptureCamera}
                  style={[
                    styles.uploadPickerBtn,
                    {
                      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                      borderColor: isDark ? '#334155' : '#cbd5e1',
                    },
                  ]}
                >
                  <Ionicons name="camera" size={18} color="#3b82f6" />
                  <Text style={[styles.uploadPickerBtnText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                    Take Photo
                  </Text>
                </Pressable>
              </View>
            )}

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
                  placeholder="2026-09-16T18:00:00Z"
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
              disabled={isLoading || isUploadingMedia}
              style={[styles.submitBtn, (isLoading || isUploadingMedia) && { opacity: 0.6 }]}
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
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    maxHeight: 520,
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
    borderRadius: 20,
    borderWidth: 1.5,
  },
  channelChipText: {
    fontSize: 12,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  mediaSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  mediaCountBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ec4899',
  },
  attachedMediaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  mediaThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#cbd5e1',
  },
  mediaInfo: {
    flex: 1,
    gap: 4,
  },
  mediaTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mediaTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mediaTypeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  uploadStatusOk: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10b981',
  },
  mediaFileName: {
    fontSize: 12,
    fontWeight: '500',
  },
  removeMediaBtn: {
    padding: 6,
  },
  uploadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  uploadingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  uploadActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  uploadPickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  uploadPickerBtnText: {
    fontSize: 12,
    fontWeight: '700',
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
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modeBtnActive: {
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.15)',
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ec4899',
    paddingVertical: 12,
    borderRadius: 12,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
