import {
  Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AutoDMInstagramMediaItem } from '../../../types';
import { useTheme, getColors } from '@/theme';

export interface AutoDMMediaPreviewModalProps {
  visible: boolean;
  media: AutoDMInstagramMediaItem | null;
  onClose: () => void;
  onTriggerAutoDM: (media: AutoDMInstagramMediaItem) => void;
}

export const AutoDMMediaPreviewModal: React.FC<AutoDMMediaPreviewModalProps> = ({
  visible,
  media,
  onClose,
  onTriggerAutoDM,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  if (!media) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: isDark ? '#0b0f19' : '#F5F3FB' }]}>
        <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#252230' : '#E9E6F2' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons
              name={media.media_type === 'VIDEO' ? 'videocam' : 'image'}
              size={20}
              color="#e1306c"
            />
            <Text style={[styles.modalTitle, { color: isDark ? '#F5F3FB' : '#1C1A25' }]}>
              {media.media_type === 'VIDEO' ? 'Instagram Reel' : 'Instagram Post'}
            </Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={isDark ? '#777383' : '#64748b'} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          {/* Media Image / Video Preview */}
          {(media.thumbnail_url || media.media_url) && (
            <View
              style={{
                borderRadius: 16,
                overflow: 'hidden',
                height: 280,
                backgroundColor: isDark ? '#252230' : '#F0EEF8',
                borderWidth: 1,
                borderColor: isDark ? '#334155' : '#E9E6F2',
              }}
            >
              <Image
                source={{ uri: media.thumbnail_url || media.media_url }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Metrics Row */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? '#1C1A25' : '#ffffff',
                borderColor: isDark ? '#252230' : '#E9E6F2',
                flexDirection: 'row',
                justifyContent: 'space-around',
                paddingVertical: 12,
              },
            ]}
          >
            <View style={{ alignItems: 'center', gap: 2 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#e1306c' }}>
                {media.like_count ?? 0}
              </Text>
              <Text style={{ fontSize: 11, color: isDark ? '#777383' : '#64748b' }}>Likes</Text>
            </View>
            <View style={{ width: 1, height: 24, backgroundColor: isDark ? '#252230' : '#F0EEF8' }} />
            <View style={{ alignItems: 'center', gap: 2 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#3b82f6' }}>
                {media.comments_count ?? 0}
              </Text>
              <Text style={{ fontSize: 11, color: isDark ? '#777383' : '#64748b' }}>Comments</Text>
            </View>
            <View style={{ width: 1, height: 24, backgroundColor: isDark ? '#252230' : '#F0EEF8' }} />
            <View style={{ alignItems: 'center', gap: 2 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#cbd5e1' : '#334155' }}>
                {media.timestamp
                  ? new Date(media.timestamp).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Published'}
              </Text>
              <Text style={{ fontSize: 11, color: isDark ? '#777383' : '#64748b' }}>Date</Text>
            </View>
          </View>

          {/* Caption Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? '#1C1A25' : '#ffffff',
                borderColor: isDark ? '#252230' : '#E9E6F2',
                padding: 14,
                gap: 8,
              },
            ]}
          >
            <Text style={[styles.cardSectionTitle, { color: isDark ? '#F5F3FB' : '#1C1A25' }]}>
              Caption
            </Text>
            <Text style={{ fontSize: 13, lineHeight: 20, color: isDark ? '#cbd5e1' : '#334155' }}>
              {media.caption || 'No caption provided.'}
            </Text>
          </View>

          {/* Actions */}
          <View style={{ gap: 10, marginTop: 4 }}>
            <Pressable
              onPress={() => onTriggerAutoDM(media)}
              style={[
                styles.primaryActionBtn,
                { backgroundColor: '#3b82f6', justifyContent: 'center', paddingVertical: 14 },
              ]}
            >
              <Ionicons name="flash" size={16} color="#ffffff" />
              <Text style={[styles.primaryActionBtnText, { fontSize: 14 }]}>
                Create AutoDM Trigger For This Post
              </Text>
            </Pressable>

            {media.permalink && (
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  if (media.permalink) {
                    Linking.openURL(media.permalink);
                  }
                }}
                style={[
                  styles.primaryActionBtn,
                  {
                    backgroundColor: isDark ? '#252230' : '#F0EEF8',
                    justifyContent: 'center',
                    paddingVertical: 12,
                    borderWidth: 1,
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                  },
                ]}
              >
                <Ionicons name="logo-instagram" size={15} color="#e1306c" />
                <Text style={[styles.primaryActionBtnText, { color: isDark ? '#F5F3FB' : '#1C1A25' }]}>
                  Open Post on Instagram
                </Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
  },
  card: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0,
    shadowRadius: 2,
    elevation: 1,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '700', borderRadius: 24 , borderWidth: 0 , shadowOpacity: 0 },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 28, backgroundColor: '#17171C' , minHeight: 44 , shadowOpacity: 0 },
  primaryActionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});
