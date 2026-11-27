import React from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Forward01Icon,
  Rocket01Icon,
} from '@/constants/icons';
import { TrendItem } from '../../types';
import { PinterestBrandIcon, YouTubeShortsBrandIcon } from './PlatformBrandIcons';
import { getPlatformMeta } from './trendUtils';

interface SavedIdeasModalProps {
  visible: boolean;
  savedPosts: TrendItem[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
  onRemix: (trend: TrendItem) => void;
  onCompose: (trend: TrendItem) => void;
  isDark: boolean;
}

export const SavedIdeasModal: React.FC<SavedIdeasModalProps> = ({
  visible,
  savedPosts,
  onClose,
  onRemove,
  onClearAll,
  onRemix,
  onCompose,
  isDark,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable cssInterop={false} style={styles.dismissArea} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? '#161B22' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
            },
          ]}
        >
          <View
            style={[
              styles.header,
              { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' },
            ]}
          >
            <View style={styles.headerLeft}>
              <HugeiconsIcon
                icon={CheckmarkCircle01Icon}
                size={18}
                color="#F59E0B"
                strokeWidth={2.2}
              />
              <View>
                <Text style={[styles.title, { color: isDark ? '#F9FAFB' : '#111827' }]}>
                  Inspiration Board
                </Text>
                <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  {savedPosts.length} saved trend spark{savedPosts.length === 1 ? '' : 's'}
                </Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              {savedPosts.length > 0 ? (
                <Pressable cssInterop={false} onPress={onClearAll} style={styles.clearBtn}>
                  <Text style={styles.clearText}>Clear All</Text>
                </Pressable>
              ) : null}
              <Pressable
                cssInterop={false}
                hitSlop={8}
                onPress={onClose}
                style={[
                  styles.closeBtn,
                  { backgroundColor: isDark ? '#252230' : '#F3F4F6' },
                ]}
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  size={16}
                  color={isDark ? '#E5E7EB' : '#374151'}
                  strokeWidth={2}
                />
              </Pressable>
            </View>
          </View>

          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {savedPosts.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={[styles.emptyTitle, { color: isDark ? '#F3F4F6' : '#111827' }]}>
                  Your board is empty
                </Text>
                <Text style={[styles.emptySub, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  Tap the bookmark icon on any trend card to save it for your next posting run.
                </Text>
              </View>
            ) : (
              savedPosts.map((post) => {
                const platRaw = (post.source_platform || post.platform || '').toLowerCase();
                const plat = getPlatformMeta(platRaw);
                return (
                  <View
                    key={post.id}
                    style={[
                      styles.cardRow,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB',
                      },
                    ]}
                  >
                    {post.thumbnail_url ? (
                      <Image source={{ uri: post.thumbnail_url }} style={styles.thumb} />
                    ) : null}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        {platRaw.includes('pinterest') ? (
                          <PinterestBrandIcon size={12} />
                        ) : platRaw.includes('youtube') ? (
                          <YouTubeShortsBrandIcon size={12} />
                        ) : null}
                        <Text style={[styles.platformTag, { color: plat.color }]}>
                          {plat.label}
                        </Text>
                      </View>
                      <Text
                        numberOfLines={2}
                        style={[
                          styles.cardTitle,
                          { color: isDark ? '#F9FAFB' : '#111827' },
                        ]}
                      >
                        {post.title || post.caption || 'Saved trend'}
                      </Text>
                      <View style={styles.actionsRow}>
                        <Pressable
                          cssInterop={false}
                          onPress={() => {
                            onClose();
                            onRemix(post);
                          }}
                          style={[
                            styles.remixBtn,
                            { backgroundColor: isDark ? '#FFFFFF' : '#111827' },
                          ]}
                        >
                          <HugeiconsIcon
                            icon={Rocket01Icon}
                            size={11}
                            color="#F59E0B"
                            strokeWidth={2}
                          />
                          <Text
                            style={[
                              styles.remixText,
                              { color: isDark ? '#111827' : '#FFFFFF' },
                            ]}
                          >
                            Remix
                          </Text>
                        </Pressable>
                        <Pressable
                          cssInterop={false}
                          onPress={() => {
                            onClose();
                            onCompose(post);
                          }}
                          style={[
                            styles.composeBtn,
                            { borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#D1D5DB' },
                          ]}
                        >
                          <HugeiconsIcon
                            icon={Forward01Icon}
                            size={11}
                            color={isDark ? '#E5E7EB' : '#374151'}
                            strokeWidth={2}
                          />
                          <Text
                            style={[
                              styles.composeText,
                              { color: isDark ? '#E5E7EB' : '#374151' },
                            ]}
                          >
                            Compose
                          </Text>
                        </Pressable>
                        <Pressable
                          cssInterop={false}
                          onPress={() => onRemove(post.id)}
                          style={{ marginLeft: 'auto', padding: 4 }}
                        >
                          <Text style={styles.removeText}>Remove</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.58)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    width: '100%',
    maxHeight: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyScroll: {
    maxHeight: 480,
  },
  bodyContent: {
    padding: 16,
    gap: 10,
    paddingBottom: 32,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 12.5,
    textAlign: 'center',
    maxWidth: 260,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  thumb: {
    width: 58,
    height: 58,
    borderRadius: 10,
  },
  platformTag: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  remixBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
  },
  remixText: {
    fontSize: 11,
    fontWeight: '700',
  },
  composeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
  },
  composeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  removeText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#EF4444',
  },
});
