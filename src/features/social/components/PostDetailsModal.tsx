import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useTheme, getColors } from '@/theme';

interface PostDetailsModalProps {
  visible: boolean;
  post: any | null;
  onClose: () => void;
  onRetry?: (postId: string) => Promise<void>;
  onCancel?: (postId: string) => Promise<void>;
  isActionLoading?: boolean;
}

export const PostDetailsModal: React.FC<PostDetailsModalProps> = ({
  visible,
  post,
  onClose,
  onRetry,
  onCancel,
  isActionLoading,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [copiedCaption, setCopiedCaption] = useState(false);

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

  const displayDate = post.scheduled_for
    ? `Scheduled for: ${new Date(post.scheduled_for).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`
    : post.posted_at
    ? `Published: ${new Date(post.posted_at).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`
    : post.created_at
    ? `Created: ${new Date(post.created_at).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`
    : 'Draft';

  const failureError =
    post.last_error ||
    post.youtube_error ||
    post.instagram_error ||
    post.facebook_error ||
    post.x_error ||
    post.error_message ||
    post.failure_reason;

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
                {displayDate}
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

            {/* Caption Header with Copy Action */}
            <View style={styles.captionHeaderRow}>
              <Text style={[styles.captionTitle, { color: isDark ? '#cbd5e1' : '#334155' }]}>
                Caption
              </Text>
              {Boolean(post.caption) && (
                <Pressable
                  onPress={async () => {
                    await Clipboard.setStringAsync(post.caption || '');
                    try {
                      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch {}
                    setCopiedCaption(true);
                    setTimeout(() => setCopiedCaption(false), 2000);
                  }}
                  style={[styles.copyBtn, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
                  hitSlop={8}
                >
                  <Ionicons
                    name={copiedCaption ? 'checkmark' : 'copy-outline'}
                    size={13}
                    color={copiedCaption ? '#22c55e' : isDark ? '#94a3b8' : '#64748b'}
                  />
                  <Text
                    style={[
                      styles.copyBtnText,
                      { color: copiedCaption ? '#22c55e' : isDark ? '#94a3b8' : '#64748b' },
                    ]}
                  >
                    {copiedCaption ? 'Copied' : 'Copy'}
                  </Text>
                </Pressable>
              )}
            </View>
            <View style={[styles.captionCard, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
              <Text style={[styles.captionText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                {post.caption || 'No caption provided.'}
              </Text>
            </View>

            {/* Platform Delivery Outcomes */}
            {(post.youtube_url ||
              post.youtube_shorts_url ||
              post.instagram_url ||
              post.facebook_url ||
              post.x_url ||
              post.youtube_error ||
              post.instagram_error ||
              post.facebook_error ||
              post.x_error) && (
              <View style={styles.deliverySection}>
                <Text style={[styles.captionTitle, { color: isDark ? '#cbd5e1' : '#334155', marginBottom: 8 }]}>
                  Platform Delivery Outcomes
                </Text>

                {/* YouTube */}
                {(post.youtube_url || post.youtube_shorts_url || post.youtube_video_id || post.youtube_error) && (
                  <View style={[styles.deliveryTile, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
                    <View style={styles.deliveryHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="logo-youtube" size={16} color="#ef4444" />
                        <Text style={[styles.deliveryTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>YouTube</Text>
                      </View>
                      {post.youtube_success || post.youtube_url ? (
                        <View style={[styles.deliveryBadge, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                          <Ionicons name="checkmark-circle" size={12} color="#22c55e" />
                          <Text style={[styles.deliveryBadgeText, { color: '#22c55e' }]}>Published</Text>
                        </View>
                      ) : post.youtube_error ? (
                        <View style={[styles.deliveryBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                          <Ionicons name="alert-circle" size={12} color="#ef4444" />
                          <Text style={[styles.deliveryBadgeText, { color: '#ef4444' }]}>Failed</Text>
                        </View>
                      ) : null}
                    </View>

                    {post.youtube_error && (
                      <Text style={styles.deliveryErrorText}>{post.youtube_error}</Text>
                    )}

                    {(post.youtube_url || post.youtube_shorts_url) && (
                      <Pressable
                        onPress={() => Linking.openURL(post.youtube_shorts_url || post.youtube_url)}
                        style={styles.openPlatformBtn}
                      >
                        <Ionicons name="open-outline" size={15} color="#ef4444" />
                        <Text style={[styles.openPlatformText, { color: '#ef4444' }]}>View on YouTube</Text>
                      </Pressable>
                    )}
                  </View>
                )}

                {/* Instagram */}
                {(post.instagram_url || post.instagram_post_id || post.instagram_error) && (
                  <View style={[styles.deliveryTile, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
                    <View style={styles.deliveryHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="logo-instagram" size={16} color="#e1306c" />
                        <Text style={[styles.deliveryTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Instagram</Text>
                      </View>
                      {post.instagram_success || post.instagram_url ? (
                        <View style={[styles.deliveryBadge, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                          <Ionicons name="checkmark-circle" size={12} color="#22c55e" />
                          <Text style={[styles.deliveryBadgeText, { color: '#22c55e' }]}>Published</Text>
                        </View>
                      ) : post.instagram_error ? (
                        <View style={[styles.deliveryBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                          <Ionicons name="alert-circle" size={12} color="#ef4444" />
                          <Text style={[styles.deliveryBadgeText, { color: '#ef4444' }]}>Failed</Text>
                        </View>
                      ) : null}
                    </View>

                    {post.instagram_error && (
                      <Text style={styles.deliveryErrorText}>{post.instagram_error}</Text>
                    )}

                    {post.instagram_url && (
                      <Pressable
                        onPress={() => Linking.openURL(post.instagram_url)}
                        style={styles.openPlatformBtn}
                      >
                        <Ionicons name="open-outline" size={15} color="#e1306c" />
                        <Text style={[styles.openPlatformText, { color: '#e1306c' }]}>View on Instagram</Text>
                      </Pressable>
                    )}
                  </View>
                )}

                {/* Facebook */}
                {(post.facebook_url || post.facebook_post_id || post.facebook_error) && (
                  <View style={[styles.deliveryTile, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
                    <View style={styles.deliveryHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="logo-facebook" size={16} color="#1877f2" />
                        <Text style={[styles.deliveryTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Facebook</Text>
                      </View>
                      {post.facebook_success || post.facebook_url ? (
                        <View style={[styles.deliveryBadge, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                          <Ionicons name="checkmark-circle" size={12} color="#22c55e" />
                          <Text style={[styles.deliveryBadgeText, { color: '#22c55e' }]}>Published</Text>
                        </View>
                      ) : post.facebook_error ? (
                        <View style={[styles.deliveryBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                          <Ionicons name="alert-circle" size={12} color="#ef4444" />
                          <Text style={[styles.deliveryBadgeText, { color: '#ef4444' }]}>Failed</Text>
                        </View>
                      ) : null}
                    </View>

                    {post.facebook_error && (
                      <Text style={styles.deliveryErrorText}>{post.facebook_error}</Text>
                    )}

                    {post.facebook_url && (
                      <Pressable
                        onPress={() => Linking.openURL(post.facebook_url)}
                        style={styles.openPlatformBtn}
                      >
                        <Ionicons name="open-outline" size={15} color="#1877f2" />
                        <Text style={[styles.openPlatformText, { color: '#1877f2' }]}>View on Facebook</Text>
                      </Pressable>
                    )}
                  </View>
                )}

                {/* X / Twitter */}
                {(post.x_url || post.x_post_id || post.x_error) && (
                  <View style={[styles.deliveryTile, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
                    <View style={styles.deliveryHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="logo-twitter" size={16} color="#38bdf8" />
                        <Text style={[styles.deliveryTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>X (Twitter)</Text>
                      </View>
                      {post.x_success || post.x_url ? (
                        <View style={[styles.deliveryBadge, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                          <Ionicons name="checkmark-circle" size={12} color="#22c55e" />
                          <Text style={[styles.deliveryBadgeText, { color: '#22c55e' }]}>Published</Text>
                        </View>
                      ) : post.x_error ? (
                        <View style={[styles.deliveryBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                          <Ionicons name="alert-circle" size={12} color="#ef4444" />
                          <Text style={[styles.deliveryBadgeText, { color: '#ef4444' }]}>Failed</Text>
                        </View>
                      ) : null}
                    </View>

                    {post.x_error && (
                      <Text style={styles.deliveryErrorText}>{post.x_error}</Text>
                    )}

                    {post.x_url && (
                      <Pressable
                        onPress={() => Linking.openURL(post.x_url)}
                        style={styles.openPlatformBtn}
                      >
                        <Ionicons name="open-outline" size={15} color="#38bdf8" />
                        <Text style={[styles.openPlatformText, { color: '#38bdf8' }]}>View on X</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            )}

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
                    {failureError || 'Provider rejected request.'}
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

            <Pressable
              onPress={onClose}
              style={[
                styles.actionBtn,
                styles.closeSecondaryBtn,
                {
                  backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                },
              ]}
            >
              <Text style={[styles.closeSecondaryBtnText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                Close
              </Text>
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
  deliverySection: {
    marginBottom: 14,
    gap: 8,
  },
  deliveryTile: {
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)',
  },
  deliveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deliveryTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  deliveryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deliveryErrorText: {
    fontSize: 11,
    color: '#ef4444',
    lineHeight: 16,
  },
  openPlatformBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  openPlatformText: {
    fontSize: 12,
    fontWeight: '700',
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
  captionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  closeSecondaryBtn: {
    borderWidth: 1,
  },
  closeSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
