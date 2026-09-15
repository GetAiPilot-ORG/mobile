import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  if (!post) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
      case 'published':
        return '#22c55e';
      case 'scheduled':
      case 'queued':
        return '#0084FF';
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
      <View className="flex-1 bg-black/70 justify-end">
        <View className="bg-[#181A1F] border-t border-[#262930] rounded-t-3xl max-h-[90%] p-5">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-3.5">
            <View className="flex-row items-center gap-2.5">
              <View className="flex-row items-center gap-1.5 px-2 py-1 rounded-md" style={{ backgroundColor: `${statusColor}20` }}>
                <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
                <Text className="text-[11px] font-extrabold" style={{ color: statusColor }}>
                  {post.status ? post.status.charAt(0).toUpperCase() + post.status.slice(1).toLowerCase() : 'Draft'}
                </Text>
              </View>
              <Text className="text-xs text-slate-400">
                {new Date(post.posted_at || post.scheduled_for || post.created_at || Date.now()).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            <Pressable onPress={onClose} className="p-1.5 rounded-lg bg-[#262930]">
              <Ionicons name="close" size={20} color="#94A3B8" />
            </Pressable>
          </View>

          <ScrollView className="max-h-[460px]" showsVerticalScrollIndicator={false}>
            {/* Target Channels */}
            <View className="flex-row flex-wrap gap-1.5 mb-3">
              {channels.map((ch: string, index: number) => (
                <View
                  key={index}
                  className="flex-row items-center gap-1 px-2 py-1 rounded-md bg-[#111317] border border-[#262930]"
                >
                  <Ionicons name="share-social" size={12} color="#EC4899" />
                  <Text className="text-[10px] font-bold text-slate-300">
                    {ch.replace(/^.+:/, '')}
                  </Text>
                </View>
              ))}
            </View>

            {/* Media Preview if present */}
            {(post.thumbnail_url || post.media_url || post.mediaUrl) && (
              <View className="rounded-2xl overflow-hidden mb-3.5 h-44 bg-black">
                <Image
                  source={{ uri: post.thumbnail_url || post.media_url || post.mediaUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Caption */}
            <Text className="text-xs font-semibold text-slate-300 mb-1.5">
              Caption
            </Text>
            <View className="rounded-xl p-3.5 mb-3.5 bg-[#111317] border border-[#262930]">
              <Text className="text-sm leading-5 text-white">
                {post.caption || 'No caption provided.'}
              </Text>
            </View>

            {/* Live Metrics if available */}
            {(post.youtube_views != null || post.metrics?.views != null || post.metrics?.likes != null) && (
              <View className="mb-3.5">
                <Text className="text-xs font-semibold text-slate-300 mb-2">
                  Live Engagement Telemetry
                </Text>
                <View className="flex-row gap-2">
                  <View className="flex-1 p-3 rounded-xl items-center gap-1 bg-[#111317] border border-[#262930]">
                    <Ionicons name="eye" size={16} color="#0084FF" />
                    <Text className="text-[15px] font-extrabold text-white">
                      {(post.youtube_views || post.metrics?.views || 0).toLocaleString()}
                    </Text>
                    <Text className="text-[11px] text-slate-400 font-medium">Views</Text>
                  </View>
                  <View className="flex-1 p-3 rounded-xl items-center gap-1 bg-[#111317] border border-[#262930]">
                    <Ionicons name="heart" size={16} color="#EC4899" />
                    <Text className="text-[15px] font-extrabold text-white">
                      {(post.youtube_likes || post.metrics?.likes || 0).toLocaleString()}
                    </Text>
                    <Text className="text-[11px] text-slate-400 font-medium">Likes</Text>
                  </View>
                  <View className="flex-1 p-3 rounded-xl items-center gap-1 bg-[#111317] border border-[#262930]">
                    <Ionicons name="chatbubble-ellipses" size={16} color="#10B981" />
                    <Text className="text-[15px] font-extrabold text-white">
                      {(post.youtube_comments || post.metrics?.comments || 0).toLocaleString()}
                    </Text>
                    <Text className="text-[11px] text-slate-400 font-medium">Comments</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Failure reason if failed */}
            {post.status === 'failed' && (
              <View className="flex-row items-start gap-2 bg-red-500/10 p-3 rounded-xl mb-3.5">
                <Ionicons name="alert-circle" size={18} color="#EF4444" />
                <View className="flex-1">
                  <Text className="text-red-400 text-xs font-bold">Publishing Failed</Text>
                  <Text className="text-red-300 text-[11px] mt-0.5">
                    {post.error_message || post.failure_reason || 'Provider rejected request.'}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Action Footer */}
          <View className="flex-row gap-2.5 mt-3.5 pt-3 border-t border-[#262930]">
            {post.status === 'failed' && onRetry && (
              <Pressable
                onPress={() => onRetry(post.id)}
                disabled={isActionLoading}
                className="flex-1 py-3 rounded-xl flex-row items-center justify-center gap-1.5 bg-[#0084FF]"
              >
                {isActionLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="refresh" size={16} color="#FFFFFF" />
                    <Text className="text-white text-xs font-bold">Retry Broadcast</Text>
                  </>
                )}
              </Pressable>
            )}

            {(post.status === 'scheduled' || post.status === 'queued') && onCancel && (
              <Pressable
                onPress={() => onCancel(post.id)}
                disabled={isActionLoading}
                className="flex-1 py-3 rounded-xl flex-row items-center justify-center gap-1.5 bg-amber-500"
              >
                {isActionLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="close-circle" size={16} color="#FFFFFF" />
                    <Text className="text-white text-xs font-bold">Cancel Scheduled</Text>
                  </>
                )}
              </Pressable>
            )}

            {onDelete && (
              <Pressable
                onPress={() => onDelete(post.id)}
                disabled={isActionLoading}
                className="flex-1 py-3 rounded-xl flex-row items-center justify-center gap-1.5 bg-red-500/10 border border-red-500/20"
              >
                <Ionicons name="trash" size={16} color="#EF4444" />
                <Text className="text-red-400 text-xs font-bold">Delete</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};
