import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { getChannelMeta, getStatusMeta } from './socialActivityHelpers';

export interface ActivityQueueSubTabProps {
  queueLoading: boolean;
  queueList: any[];
  onSelectPost: (post: any) => void;
  onCancelPost: (postId: string) => Promise<void>;
  onRetryPost?: (postId: string) => Promise<void>;
}

export const ActivityQueueSubTab: React.FC<ActivityQueueSubTabProps> = ({
  queueLoading,
  queueList,
  onSelectPost,
  onCancelPost,
  onRetryPost,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [queueStatusFilter, setQueueStatusFilter] = useState<'ALL' | 'scheduled' | 'sent' | 'failed'>('ALL');

  const rawQueueList = Array.isArray(queueList) ? queueList : (queueList as any)?.broadcasts || [];
  const queueCounts = {
    all: rawQueueList.length,
    scheduled: rawQueueList.filter((item: any) => {
      const s = (item.status || '').toLowerCase();
      return s === 'scheduled' || s === 'queued' || s === 'pending';
    }).length,
    sent: rawQueueList.filter((item: any) => {
      const s = (item.status || '').toLowerCase();
      return s === 'sent' || s === 'published';
    }).length,
    failed: rawQueueList.filter((item: any) => (item.status || '').toLowerCase() === 'failed').length,
  };

  const filteredQueueList = rawQueueList.filter((item: any) => {
    if (queueStatusFilter === 'ALL') return true;
    const s = (item.status || '').toLowerCase();
    if (queueStatusFilter === 'scheduled') return s === 'scheduled' || s === 'queued' || s === 'pending';
    if (queueStatusFilter === 'sent') return s === 'sent' || s === 'published';
    if (queueStatusFilter === 'failed') return s === 'failed';
    return true;
  });

  return (
    <View style={styles.subContent}>
      <View style={styles.headerActionRow}>
        <View style={styles.headerTextCol}>
          <Text style={[styles.subTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
            Scheduled Broadcast Queue
          </Text>
          <Text style={[styles.subDesc, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            Pending publications automatically firing across channels
          </Text>
        </View>
        <Pressable onPress={() => Alert.alert('Schedule', 'This feature will be available soon')} style={styles.primaryActionBtn}>
          <Ionicons name="calendar-outline" size={14} color="#ffffff" />
          <Text style={styles.primaryActionBtnText}>Schedule</Text>
        </Pressable>
      </View>

      {/* Status Bar at Top of the List */}
      <View style={styles.statusFilterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusFilterRow}
        >
          {[
            { key: 'ALL', label: 'All', count: queueCounts.all, color: '#ec4899' },
            { key: 'scheduled', label: 'Scheduled', count: queueCounts.scheduled, color: '#3b82f6' },
            { key: 'sent', label: 'Published', count: queueCounts.sent, color: '#22c55e' },
            { key: 'failed', label: 'Failed', count: queueCounts.failed, color: '#ef4444' },
          ].map((tab) => {
            const isSelected = queueStatusFilter === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setQueueStatusFilter(tab.key as any);
                }}
                style={[
                  styles.statusFilterChip,
                  {
                    backgroundColor: isSelected
                      ? isDark
                        ? 'rgba(236, 72, 153, 0.2)'
                        : 'rgba(236, 72, 153, 0.1)'
                      : isDark
                        ? '#1e293b'
                        : '#f1f5f9',
                    borderColor: isSelected ? tab.color : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusFilterLabel,
                    {
                      color: isSelected ? tab.color : isDark ? '#94a3b8' : '#64748b',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
                <View
                  style={[
                    styles.statusCountBadge,
                    {
                      backgroundColor: isSelected
                        ? tab.color
                        : isDark
                          ? 'rgba(148, 163, 184, 0.2)'
                          : 'rgba(148, 163, 184, 0.3)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusCountText,
                      {
                        color: isSelected ? '#ffffff' : isDark ? '#94a3b8' : '#64748b',
                      },
                    ]}
                  >
                    {tab.count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {queueLoading ? (
        <ActivityIndicator size="large" color="#ec4899" style={{ marginVertical: 40 }} />
      ) : filteredQueueList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={48} color={isDark ? '#475569' : '#94a3b8'} />
          <Text style={[styles.emptyTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
            {queueStatusFilter === 'ALL' ? 'Queue is Empty' : `No ${queueStatusFilter} posts`}
          </Text>
          <Text style={[styles.emptyDesc, { color: isDark ? '#64748b' : '#94a3b8' }]}>
            {queueStatusFilter === 'ALL'
              ? 'You have no scheduled social posts waiting in the queue. Plan your next broadcast in advance!'
              : `There are currently no broadcasts with status "${queueStatusFilter}".`}
          </Text>
          {queueStatusFilter !== 'ALL' ? (
            <Pressable
              onPress={() => setQueueStatusFilter('ALL')}
              style={styles.emptyActionBtn}
            >
              <Text style={styles.emptyActionBtnText}>Show All Posts</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => Alert.alert("Schedule", "This feature will be available soon")} style={styles.emptyActionBtn}>
              <Text style={styles.emptyActionBtnText}>Schedule a Post</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <View style={styles.queueList}>
          {filteredQueueList.map((item: any) => {
            const channels = item.selected_channels?.length ? item.selected_channels : ['social'];
            const statusMeta = getStatusMeta(item.status);
            const mediaUri =
              item.thumbnail_url ||
              (item.media_type === 'image' ? item.media_url : null) ||
              item.media_urls?.[0];
            const isVideo = item.media_type === 'video' || item.video_filename != null;

            let timingText = 'Instant Broadcast';
            let timingIcon: any = 'flash-outline';
            let timingColor = '#8b5cf6';
            if (item.scheduled_for) {
              timingText = `Fires on: ${new Date(item.scheduled_for).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}`;
              timingIcon = 'alarm-outline';
              timingColor = '#ec4899';
            } else if (item.posted_at) {
              timingText = `Published: ${new Date(item.posted_at).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}`;
              timingIcon = 'checkmark-done-circle-outline';
              timingColor = '#22c55e';
            } else if (item.created_at) {
              timingText = `Created: ${new Date(item.created_at).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}`;
              timingIcon = 'time-outline';
              timingColor = '#94a3b8';
            }

            const liveUrl =
              item.youtube_url ||
              item.youtube_shorts_url ||
              item.instagram_url ||
              item.facebook_url ||
              item.x_url;

            const failureReason =
              item.last_error ||
              item.youtube_error ||
              item.instagram_error ||
              item.facebook_error ||
              item.x_error ||
              item.error_message;

            return (
              <Pressable
                key={item.id}
                onPress={() => onSelectPost(item)}
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#1e293b' : '#e2e8f0',
                  },
                ]}
              >
                {/* Header: Status at Top + Channels */}
                <View style={styles.cardHeader}>
                  <View style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}>
                    <Ionicons name={statusMeta.icon} size={12} color={statusMeta.color} />
                    <Text style={[styles.statusBadgeText, { color: statusMeta.color }]}>
                      {statusMeta.label}
                    </Text>
                  </View>
                  <View style={styles.channelsRow}>
                    {channels.map((ch: string, i: number) => {
                      const meta = getChannelMeta(ch);
                      return (
                        <View key={i} style={[styles.chBadge, { backgroundColor: meta.bg }]}>
                          <Ionicons name={meta.icon} size={12} color={meta.color} />
                          <Text style={[styles.chBadgeText, { color: meta.color }]}>{meta.name}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Middle Row: Media Thumbnail + Caption */}
                <View style={styles.queueBodyRow}>
                  {mediaUri ? (
                    <View style={styles.queueThumbContainer}>
                      <Image source={{ uri: mediaUri }} style={styles.queueThumb} resizeMode="cover" />
                      {isVideo && (
                        <View style={styles.queueVideoBadge}>
                          <Ionicons name="play" size={10} color="#ffffff" />
                        </View>
                      )}
                    </View>
                  ) : isVideo ? (
                    <View
                      style={[
                        styles.queueThumbContainer,
                        {
                          backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                          justifyContent: 'center',
                          alignItems: 'center',
                        },
                      ]}
                    >
                      <Ionicons name="videocam" size={20} color="#ec4899" />
                    </View>
                  ) : null}

                  <View style={styles.queueCaptionCol}>
                    <Text
                      style={[styles.postFullCaption, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                      numberOfLines={3}
                    >
                      {item.caption || 'No caption'}
                    </Text>
                    <View style={styles.scheduledTimeRow}>
                      <Ionicons name={timingIcon} size={13} color={timingColor} />
                      <Text style={[styles.scheduledTimeText, { color: timingColor }]}>
                        {timingText}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Failure Banner if failed */}
                {item.status === 'failed' && failureReason && (
                  <View style={styles.queueErrorBanner}>
                    <Ionicons name="alert-circle" size={14} color="#ef4444" />
                    <Text style={styles.queueErrorText} numberOfLines={2}>
                      {failureReason}
                    </Text>
                  </View>
                )}

                {/* Footer Actions */}
                <View style={styles.cardFooter}>
                  <Pressable onPress={() => onSelectPost(item)} style={styles.actionLink}>
                    <Text style={styles.actionLinkText}>Details & Preview</Text>
                  </Pressable>

                  {item.status === 'failed' && onRetryPost && (
                    <Pressable
                      onPress={() => onRetryPost(item.id)}
                      style={[styles.actionLink, { borderColor: '#f59e0b' }]}
                    >
                      <Text style={[styles.actionLinkText, { color: '#f59e0b' }]}>Retry</Text>
                    </Pressable>
                  )}

                  {liveUrl && (
                    <Pressable
                      onPress={() => Linking.openURL(liveUrl)}
                      style={[styles.actionLink, { borderColor: '#22c55e', flexDirection: 'row', justifyContent: 'center' }]}
                    >
                      <Ionicons name="open-outline" size={13} color="#22c55e" style={{ marginRight: 4 }} />
                      <Text style={[styles.actionLinkText, { color: '#22c55e' }]}>Watch</Text>
                    </Pressable>
                  )}

                  {(item.status === 'scheduled' || item.status === 'queued') && (
                    <Pressable
                      onPress={() => onCancelPost(item.id)}
                      style={[styles.actionLink, { borderColor: '#ef4444' }]}
                    >
                      <Text style={[styles.actionLinkText, { color: '#ef4444' }]}>Cancel</Text>
                    </Pressable>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  subContent: {
    gap: 16,
  },
  headerActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  headerTextCol: {
    flex: 1,
    minWidth: 180,
  },
  subTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  subDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ec4899',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'center',
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  statusFilterContainer: {
    marginBottom: 10,
  },
  statusFilterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  statusFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusFilterLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCountText: {
    fontSize: 10,
    fontWeight: '800',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  channelsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  chBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ec4899',
    textTransform: 'capitalize',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  queueBodyRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  queueThumbContainer: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#00000015',
  },
  queueThumb: {
    width: '100%',
    height: '100%',
  },
  queueVideoBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 8,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueCaptionCol: {
    flex: 1,
    gap: 6,
  },
  queueErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    marginTop: 4,
  },
  queueErrorText: {
    fontSize: 11,
    color: '#ef4444',
    flex: 1,
    fontWeight: '600',
  },
  postFullCaption: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  scheduledTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  scheduledTimeText: {
    fontSize: 12,
    color: '#ec4899',
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  actionLink: {
    flex: 1,
    minWidth: 110,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  actionLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  queueList: {
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 18,
  },
  emptyActionBtn: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 8,
  },
  emptyActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
