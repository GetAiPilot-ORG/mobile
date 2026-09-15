import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface PostDetailsModalProps {
  visible: boolean;
  post: any | null;
  onClose: () => void;
  onRetry?: (postId: string) => Promise<void>;
  onCancel?: (postId: string) => Promise<void>;
  onDelete?: (postId: string) => Promise<void>;
  isActionLoading?: boolean;
}

export const PostDetailsModal: React.FC<PostDetailsModalProps> = ({
  visible,
  post,
  onClose,
  onRetry,
  onCancel,
  onDelete,
  isActionLoading,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (!post) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
      case 'published':
        return '#22c55e';
      case 'scheduled':
      case 'queued':
        return '#3b82f6';
      case 'processing':
        return '#eab308';
      case 'failed':
        return '#ef4444';
      case 'cancelled':
        return '#94a3b8';
      default:
        return '#64748b';
    }
  };

  const statusColor = getStatusColor(post.status);
  const channels = Array.isArray(post.selected_channels)
    ? post.selected_channels
    : Array.isArray(post.channels)
    ? post.channels
    : ['social'];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {post.status ? post.status.charAt(0).toUpperCase() + post.status.slice(1).toLowerCase() : 'Draft'}
                </Text>
              </View>
              <Text style={[styles.headerDate, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                {new Date(post.posted_at || post.scheduled_for || post.created_at || Date.now()).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Target Channels */}
            <View style={styles.channelsRow}>
              {channels.map((ch: string, index: number) => (
                <View
                  key={index}
                  style={[styles.channelBadge, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
                >
                  <Ionicons name="share-social" size={12} color="#ec4899" />
                  <Text style={[styles.channelText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                    {ch.replace(/^.+:/, '')}
                  </Text>
                </View>
              ))}
            </View>

            {/* Media Preview if present */}
            {(post.thumbnail_url || post.media_url || post.mediaUrl) && (
              <View style={styles.mediaContainer}>
                <Image
                  source={{ uri: post.thumbnail_url || post.media_url || post.mediaUrl }}
                  style={styles.mediaImage}
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Caption */}
            <Text style={[styles.captionTitle, { color: isDark ? '#cbd5e1' : '#334155' }]}>
              Caption
            </Text>
            <View style={[styles.captionCard, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
              <Text style={[styles.captionText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                {post.caption || 'No caption provided.'}
              </Text>
            </View>

            {/* Live Metrics if available */}
            {(post.youtube_views != null || post.metrics?.views != null || post.metrics?.likes != null) && (
              <View style={styles.metricsContainer}>
                <Text style={[styles.metricsTitle, { color: isDark ? '#cbd5e1' : '#334155' }]}>
                  Live Engagement Telemetry
                </Text>
                <View style={styles.metricsGrid}>
                  <View style={[styles.metricCard, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
                    <Ionicons name="eye" size={16} color="#3b82f6" />
                    <Text style={[styles.metricValue, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      {(post.youtube_views || post.metrics?.views || 0).toLocaleString()}
                    </Text>
                    <Text style={styles.metricLabel}>Views</Text>
                  </View>
                  <View style={[styles.metricCard, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
                    <Ionicons name="heart" size={16} color="#ec4899" />
                    <Text style={[styles.metricValue, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      {(post.youtube_likes || post.metrics?.likes || 0).toLocaleString()}
                    </Text>
                    <Text style={styles.metricLabel}>Likes</Text>
                  </View>
                  <View style={[styles.metricCard, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
                    <Ionicons name="chatbubble-ellipses" size={16} color="#22c55e" />
                    <Text style={[styles.metricValue, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      {(post.youtube_comments || post.metrics?.comments || 0).toLocaleString()}
                    </Text>
                    <Text style={styles.metricLabel}>Comments</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Failure reason if failed */}
            {post.status === 'failed' && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#ef4444" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.errorTitle}>Publishing Failed</Text>
                  <Text style={styles.errorDesc}>
                    {post.error_message || post.failure_reason || 'Provider rejected request.'}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footer}>
            {post.status === 'failed' && onRetry && (
              <Pressable
                onPress={() => onRetry(post.id)}
                disabled={isActionLoading}
                style={[styles.actionBtn, styles.retryBtn]}
              >
                {isActionLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Ionicons name="refresh" size={16} color="#ffffff" />
                    <Text style={styles.actionBtnText}>Retry Broadcast</Text>
                  </>
                )}
              </Pressable>
            )}

            {(post.status === 'scheduled' || post.status === 'queued') && onCancel && (
              <Pressable
                onPress={() => onCancel(post.id)}
                disabled={isActionLoading}
                style={[styles.actionBtn, styles.cancelPostBtn]}
              >
                {isActionLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Ionicons name="close-circle" size={16} color="#ffffff" />
                    <Text style={styles.actionBtnText}>Cancel Scheduled</Text>
                  </>
                )}
              </Pressable>
            )}

            {onDelete && (
              <Pressable
                onPress={() => onDelete(post.id)}
                disabled={isActionLoading}
                style={[styles.actionBtn, styles.deleteBtn]}
              >
                <Ionicons name="trash" size={16} color="#ef4444" />
                <Text style={styles.deleteBtnText}>Delete</Text>
              </Pressable>
            )}
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
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  headerDate: {
    fontSize: 12,
  },
  closeBtn: {
    padding: 6,
  },
  scrollBody: {
    maxHeight: 460,
  },
  channelsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  channelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  channelText: {
    fontSize: 10,
    fontWeight: '700',
  },
  mediaContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
    height: 180,
    backgroundColor: '#000',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  captionTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  captionCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  captionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  metricsContainer: {
    marginBottom: 14,
  },
  metricsTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: -0.1,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  errorTitle: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700',
  },
  errorDesc: {
    color: '#f87171',
    fontSize: 11,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.1)',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  retryBtn: {
    backgroundColor: '#3b82f6',
  },
  cancelPostBtn: {
    backgroundColor: '#eab308',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  deleteBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700',
  },
});
