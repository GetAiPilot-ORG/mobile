import React, { useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  Image,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { AppScreen } from '../../../components/AppScreen';
import { AppTopBar } from '../../../components/AppTopBar';
import {
  ProductFloatingBottomBar,
  ProductTabItem,
} from '../../../components/ProductFloatingBottomBar';
import {
  SocialPostsSkeleton,
  SocialScreenSkeleton,
  SocialTrendsSkeleton,
} from '../../../components/skeletonScreen';
import { apiClient } from '../../../core/api/client';
import {
  CreatePostModal,
  PostDetailsModal,
  AccountsModal,
} from '../components';

type TabType = 'overview' | 'posts' | 'calendar' | 'trends' | 'accounts';

const SOCIAL_TABS: ProductTabItem[] = [
  { key: 'overview', label: 'Overview', activeIcon: 'grid', inactiveIcon: 'grid-outline' },
  { key: 'posts', label: 'Posts', activeIcon: 'paper-plane', inactiveIcon: 'paper-plane-outline' },
  { key: 'calendar', label: 'Calendar', activeIcon: 'calendar', inactiveIcon: 'calendar-outline' },
  { key: 'trends', label: 'Trends', activeIcon: 'flame', inactiveIcon: 'flame-outline' },
  { key: 'accounts', label: 'Channels', activeIcon: 'share-social', inactiveIcon: 'share-social-outline' },
];

export const SocialScreen: React.FC = () => {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAccountsModal, setShowAccountsModal] = useState(false);

  // 1. Overview Telemetry Query
  const {
    data: overviewData,
    isLoading: overviewLoading,
    refetch: refetchOverview,
    isRefetching: isOverviewRefetching,
  } = useQuery({
    queryKey: ['social', 'overview'],
    queryFn: async () => apiClient.get<any>('/mobile/v1/social/overview'),
  });

  // 2. Connected Channels / Accounts Query
  const {
    data: accountsData,
    refetch: refetchAccounts,
  } = useQuery({
    queryKey: ['social', 'accounts'],
    queryFn: async () => apiClient.get<any>('/mobile/v1/social/accounts'),
  });

  // 3. Posts History Query
  const {
    data: postsData,
    isLoading: postsLoading,
    refetch: refetchPosts,
    isRefetching: isPostsRefetching,
  } = useQuery({
    queryKey: ['social', 'posts'],
    queryFn: async () => apiClient.get<any[]>('/mobile/v1/social/posts'),
  });

  // 4. Scheduled Queue Query
  const {
    data: queueData,
    refetch: refetchQueue,
  } = useQuery({
    queryKey: ['social', 'queue'],
    queryFn: async () => apiClient.get<any[]>('/mobile/v1/social/queue'),
  });

  // 5. Trend Feed Query
  const {
    data: trendsData,
    isLoading: trendsLoading,
    refetch: refetchTrends,
  } = useQuery({
    queryKey: ['social', 'trends'],
    queryFn: async () => apiClient.get<any[]>('/mobile/v1/social/trends'),
  });

  // Mutations
  const createPostMutation = useMutation({
    mutationFn: async (payload: any) => apiClient.post('/mobile/v1/social/posts', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social', 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['social', 'queue'] });
      queryClient.invalidateQueries({ queryKey: ['social', 'overview'] });
    },
  });

  const cancelPostMutation = useMutation({
    mutationFn: async (postId: string) => apiClient.post(`/mobile/v1/social/posts/${postId}/cancel`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social', 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['social', 'queue'] });
      setSelectedPost(null);
    },
  });

  const retryPostMutation = useMutation({
    mutationFn: async (postId: string) => apiClient.post(`/mobile/v1/social/posts/${postId}/retry`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social', 'posts'] });
      setSelectedPost(null);
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => apiClient.delete(`/mobile/v1/social/posts/${postId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social', 'posts'] });
      setSelectedPost(null);
    },
  });

  const disconnectAccountMutation = useMutation({
    mutationFn: async (payload: { provider: string; accountId?: string }) =>
      apiClient.post('/mobile/v1/social/accounts/disconnect', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social', 'accounts'] });
      queryClient.invalidateQueries({ queryKey: ['social', 'overview'] });
    },
  });

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([
      refetchOverview(),
      refetchAccounts(),
      refetchPosts(),
      refetchQueue(),
      refetchTrends(),
    ]);
  };

  const ops = overviewData?.operations || {};
  const postsList = Array.isArray(postsData) ? postsData : [];
  const queueList = Array.isArray(queueData) ? queueData : [];
  const trendsList = Array.isArray(trendsData) ? trendsData : [];

  // Extract all genuinely connected accounts
  const connectedList = React.useMemo(() => {
    if (Array.isArray(accountsData)) {
      return accountsData.map((a: any) => ({
        ...a,
        provider: a.provider || a.platform || 'channel',
      }));
    }
    if (accountsData && typeof accountsData === 'object') {
      const list: any[] = [];
      const providers = ['facebook', 'instagram', 'threads', 'youtube', 'linkedin', 'x', 'pinterest', 'reddit', 'bluesky', 'mastodon', 'googleBusiness'];
      for (const p of providers) {
        const arrKey = `${p}Accounts`;
        if (Array.isArray(accountsData[arrKey]) && accountsData[arrKey].length > 0) {
          list.push(...accountsData[arrKey].map((a: any) => ({ ...a, provider: a.provider || a.platform || p })));
        } else if (accountsData[p]?.connected) {
          list.push({ ...accountsData[p], provider: accountsData[p].provider || accountsData[p].platform || p });
        }
      }
      return list;
    }
    return [];
  }, [accountsData]);

  const sentPostsCount = postsList.filter((p: any) => {
    const s = (p.status || '').toLowerCase();
    return s === 'sent' || s === 'published' || s === 'completed' || s === 'success' || s === 'delivered';
  }).length;

  const scheduledPostsCount = queueList.length > 0
    ? queueList.length
    : postsList.filter((p: any) => {
        const s = (p.status || '').toLowerCase();
        return s === 'scheduled' || s === 'queued' || s === 'pending';
      }).length;

  const totalSentCount = (ops.sent && ops.sent > 0) ? Math.max(ops.sent, sentPostsCount) : sentPostsCount;
  const totalScheduledCount = (ops.scheduled && ops.scheduled > 0) ? Math.max(ops.scheduled, scheduledPostsCount) : scheduledPostsCount;
  const totalFailedCount = (ops.failed && ops.failed > 0) ? ops.failed : postsList.filter((p: any) => (p.status || '').toLowerCase() === 'failed').length;

  const totalCompleted = totalSentCount + totalFailedCount;
  const computedSuccessRate = totalCompleted > 0
    ? `${Math.round((totalSentCount / totalCompleted) * 100)}%`
    : (totalSentCount > 0 ? '100%' : '0%');
  const recentActivityList = (ops.recentActivity && ops.recentActivity.length > 0 ? ops.recentActivity : postsList).slice(0, 5);

  const getPlatformIconName = (provider?: string) => {
    switch (provider?.toLowerCase()) {
      case 'facebook':
        return 'logo-facebook';
      case 'instagram':
        return 'logo-instagram';
      case 'threads':
        return 'at-circle';
      case 'youtube':
        return 'logo-youtube';
      case 'linkedin':
        return 'logo-linkedin';
      case 'x':
      case 'twitter':
        return 'logo-twitter';
      case 'reddit':
        return 'logo-reddit';
      case 'pinterest':
        return 'logo-pinterest';
      default:
        return 'globe-outline';
    }
  };

  const getPlatformColor = (provider?: string) => {
    switch (provider?.toLowerCase()) {
      case 'facebook':
        return '#0084FF';
      case 'instagram':
        return '#E1306C';
      case 'threads':
        return '#FFFFFF';
      case 'youtube':
        return '#FF0000';
      case 'linkedin':
        return '#0A66C2';
      case 'x':
      case 'twitter':
        return '#38BDF8';
      case 'reddit':
        return '#FF4500';
      case 'pinterest':
        return '#E60023';
      default:
        return '#EC4899';
    }
  };

  return (
    <AppScreen>
      <AppTopBar title="SocialPilot" subtitle="Cross-Platform Social Publishing" />

      {/* Main Content Area */}
      <ScrollView
        className="flex-1 bg-[#0B0D10]"
        contentContainerClassName="px-4 pb-32 pt-2"
        refreshControl={
          <RefreshControl
            refreshing={isOverviewRefetching || isPostsRefetching}
            onRefresh={handleRefresh}
            tintColor="#0084FF"
          />
        }
      >
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          overviewLoading && !overviewData ? (
            <SocialScreenSkeleton />
          ) : (
            <View>
              {/* Quick Action Banner */}
              <View className="flex-row items-center p-4 rounded-2xl mb-3.5 bg-[#181A1F] border border-[#262930]">
                <View className="flex-1 mr-3">
                  <Text className="text-base font-bold text-white">
                    Broadcast Engine Ready
                  </Text>
                  <Text className="text-xs text-slate-400 mt-1">
                    {connectedList.length > 0
                      ? `${connectedList.length} connected channel${connectedList.length === 1 ? '' : 's'} active across your workspace.`
                      : 'Publish or schedule posts across Instagram, Facebook, YouTube, LinkedIn and Threads.'}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setShowCreateModal(true);
                  }}
                  className="flex-row items-center gap-1 bg-[#0084FF] px-3.5 py-2.5 rounded-xl"
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                  <Text className="text-white text-xs font-bold">New Post</Text>
                </Pressable>
              </View>

              {/* Overview Metrics Cards */}
              <View className="flex-row gap-2.5 mb-3.5">
                <View className="flex-1 p-3.5 rounded-2xl items-center bg-[#181A1F] border border-[#262930]">
                  <Ionicons name="send" size={18} color="#10B981" />
                  <Text className="text-lg font-bold text-white mt-1">
                    {totalSentCount}
                  </Text>
                  <Text className="text-[11px] text-slate-400 font-medium">Published</Text>
                </View>

                <View className="flex-1 p-3.5 rounded-2xl items-center bg-[#181A1F] border border-[#262930]">
                  <Ionicons name="time" size={18} color="#0084FF" />
                  <Text className="text-lg font-bold text-white mt-1">
                    {totalScheduledCount}
                  </Text>
                  <Text className="text-[11px] text-slate-400 font-medium">Scheduled</Text>
                </View>

                <View className="flex-1 p-3.5 rounded-2xl items-center bg-[#181A1F] border border-[#262930]">
                  <Ionicons name="checkmark-done-circle" size={18} color="#EC4899" />
                  <Text className="text-lg font-bold text-white mt-1">
                    {ops.successRate != null ? `${ops.successRate}%` : computedSuccessRate}
                  </Text>
                  <Text className="text-[11px] text-slate-400 font-medium">Success Rate</Text>
                </View>
              </View>

              {/* Connected Channels Summary Card */}
              <View className="p-4 rounded-2xl mb-3.5 bg-[#181A1F] border border-[#262930]">
                <View className="flex-row justify-between items-center mb-3">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="share-social" size={18} color="#0084FF" />
                    <Text className="text-sm font-bold text-white">
                      Connected Channels ({connectedList.length})
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setShowAccountsModal(true)}
                    className="px-2 py-1 rounded-md bg-[#262930]"
                  >
                    <Text className="text-[#0084FF] text-xs font-semibold">Manage</Text>
                  </Pressable>
                </View>

                {connectedList.length === 0 ? (
                  <View className="py-4 items-center gap-1.5">
                    <Ionicons name="link-outline" size={20} color="#64748B" />
                    <Text className="text-xs text-center text-slate-400">
                      No active channels connected. Tap Manage to link Instagram, Facebook, Threads or YouTube.
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row flex-wrap gap-2">
                    {connectedList.map((acc: any, idx: number) => {
                      const provider = acc.provider || acc.platform || 'channel';
                      const name = acc.username || acc.name || acc.channelTitle || provider;
                      const avatarUrl = acc.profilePicture || acc.profile_picture_url;
                      return (
                        <View
                          key={acc.id || idx}
                          className="flex-row items-center gap-2 p-2 rounded-xl bg-[#111317] border border-[#262930]"
                        >
                          {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} className="w-5 h-5 rounded-full" />
                          ) : (
                            <Ionicons
                              name={getPlatformIconName(provider) as any}
                              size={14}
                              color={getPlatformColor(provider)}
                            />
                          )}
                          <View className="max-w-[120px]">
                            <Text
                              className="text-xs font-semibold text-white"
                              numberOfLines={1}
                            >
                              {name}
                            </Text>
                            <Text className="text-[10px] text-slate-500">
                              {provider ? provider.charAt(0).toUpperCase() + provider.slice(1).toLowerCase() : ''}
                            </Text>
                          </View>
                          <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Recent Broadcasts */}
              <View className="p-4 rounded-2xl bg-[#181A1F] border border-[#262930]">
                <View className="flex-row justify-between items-center mb-3">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="albums" size={18} color="#0084FF" />
                    <Text className="text-sm font-bold text-white">
                      Recent Activity ({recentActivityList.length})
                    </Text>
                  </View>
                  <Pressable onPress={() => setActiveTab('posts')}>
                    <Text className="text-[#0084FF] text-xs font-semibold">View All</Text>
                  </Pressable>
                </View>

                {recentActivityList.length === 0 ? (
                  <View className="py-4 items-center">
                    <Text className="text-xs text-slate-400">
                      No broadcast history yet. Create your first post above.
                    </Text>
                  </View>
                ) : (
                  recentActivityList.map((post: any) => {
                    const mediaThumb = post.thumbnail_url || post.media_url;
                    return (
                      <Pressable
                        key={post.id}
                        onPress={() => setSelectedPost(post)}
                        className="flex-row items-center py-2.5 border-b border-[#262930] last:border-b-0"
                      >
                        {mediaThumb && (
                          <Image source={{ uri: mediaThumb }} className="w-10 h-10 rounded-lg mr-2.5" />
                        )}
                        <View className="flex-1">
                          <Text
                            className="text-sm font-medium text-white"
                            numberOfLines={2}
                          >
                            {post.caption || 'Untitled Broadcast'}
                          </Text>
                          <Text className="text-[11px] text-slate-500 mt-0.5">
                            {new Date(post.posted_at || post.scheduled_for || post.created_at || Date.now()).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </View>
                        <View
                          className={`px-2 py-0.5 rounded-md ml-2 ${
                            post.status === 'sent' || post.status === 'published'
                              ? 'bg-emerald-500/15'
                              : post.status === 'failed'
                                ? 'bg-red-500/15'
                                : 'bg-blue-500/15'
                          }`}
                        >
                          <Text
                            className={`text-[11px] font-semibold ${
                              post.status === 'sent' || post.status === 'published'
                                ? 'text-emerald-400'
                                : post.status === 'failed'
                                  ? 'text-red-400'
                                  : 'text-blue-400'
                            }`}
                          >
                            {post.status || 'sent'}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })
                )}
              </View>
            </View>
          )
        )}

        {/* TAB 2: POSTS */}
        {activeTab === 'posts' && (
          <View>
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-bold text-white">
                Broadcast Posts ({postsList.length})
              </Text>
              <Pressable
                onPress={() => setShowCreateModal(true)}
                className="flex-row items-center gap-1 bg-[#0084FF] px-3 py-1.5 rounded-xl"
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text className="text-white text-xs font-bold">Create</Text>
              </Pressable>
            </View>

            {postsLoading ? (
              <SocialPostsSkeleton />
            ) : postsList.length === 0 ? (
              <View className="py-12 items-center gap-2">
                <Ionicons name="newspaper-outline" size={40} color="#64748B" />
                <Text className="text-base font-semibold text-white">
                  No Broadcast Posts Found
                </Text>
                <Text className="text-xs text-slate-400">
                  Create your first social media broadcast now.
                </Text>
              </View>
            ) : (
              postsList.map((post: any) => (
                <Pressable
                  key={post.id}
                  onPress={() => setSelectedPost(post)}
                  className="p-4 rounded-2xl mb-3 bg-[#181A1F] border border-[#262930]"
                >
                  <View className="flex-row justify-between items-center mb-2">
                    <View className="flex-row gap-1.5">
                      {(post.selected_channels || ['social']).map((ch: string, i: number) => (
                        <Text key={i} className="text-[11px] font-bold text-[#0084FF] bg-blue-500/10 px-2 py-0.5 rounded-md">
                          {ch.replace(/^.+:/, '')}
                        </Text>
                      ))}
                    </View>
                    <View
                      className={`px-2 py-0.5 rounded-md ${
                        post.status === 'sent' || post.status === 'published'
                          ? 'bg-emerald-500/15'
                          : post.status === 'failed'
                            ? 'bg-red-500/15'
                            : 'bg-blue-500/15'
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-semibold ${
                          post.status === 'sent' || post.status === 'published'
                            ? 'text-emerald-400'
                            : post.status === 'failed'
                              ? 'text-red-400'
                              : 'text-blue-400'
                        }`}
                      >
                        {post.status || 'sent'}
                      </Text>
                    </View>
                  </View>

                  <Text
                    className="text-sm leading-5 text-slate-200 mb-2"
                    numberOfLines={3}
                  >
                    {post.caption || 'No caption provided.'}
                  </Text>

                  {(post.thumbnail_url || post.media_url) && (
                    <Image
                      source={{ uri: post.thumbnail_url || post.media_url }}
                      className="w-full h-44 rounded-xl mb-2.5"
                      resizeMode="cover"
                    />
                  )}

                  <View className="flex-row justify-between items-center pt-2 border-t border-[#262930]">
                    <Text className="text-xs text-slate-500">
                      {new Date(post.posted_at || post.scheduled_for || post.created_at || Date.now()).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#64748B" />
                  </View>
                </Pressable>
              ))
            )}
          </View>
        )}

        {/* TAB 3: CALENDAR */}
        {activeTab === 'calendar' && (
          <View>
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-bold text-white">
                Scheduled Queue ({queueList.length})
              </Text>
              <Pressable
                onPress={() => setShowCreateModal(true)}
                className="flex-row items-center gap-1 bg-[#0084FF] px-3 py-1.5 rounded-xl"
              >
                <Ionicons name="calendar" size={16} color="#FFFFFF" />
                <Text className="text-white text-xs font-bold">Schedule</Text>
              </Pressable>
            </View>

            {queueList.length === 0 ? (
              <View className="py-12 items-center gap-2">
                <Ionicons name="time-outline" size={40} color="#64748B" />
                <Text className="text-base font-semibold text-white">
                  No Pending Scheduled Posts
                </Text>
                <Text className="text-xs text-slate-400">
                  Schedule future posts to maintain an active multi-channel presence.
                </Text>
              </View>
            ) : (
              queueList.map((item: any) => (
                <Pressable
                  key={item.id}
                  onPress={() => setSelectedPost(item)}
                  className="p-4 rounded-2xl mb-3 bg-[#181A1F] border border-[#262930]"
                >
                  <View className="flex-row justify-between items-center mb-2">
                    <View className="flex-row gap-1.5">
                      {(item.selected_channels || ['social']).map((ch: string, i: number) => (
                        <Text key={i} className="text-[11px] font-bold text-[#0084FF] bg-blue-500/10 px-2 py-0.5 rounded-md">
                          {ch}
                        </Text>
                      ))}
                    </View>
                    <View className="px-2 py-0.5 rounded-md bg-blue-500/15">
                      <Text className="text-[11px] font-semibold text-blue-400">
                        {item.status || 'scheduled'}
                      </Text>
                    </View>
                  </View>
                  <Text
                    className="text-sm text-slate-200 mb-2"
                    numberOfLines={2}
                  >
                    {item.caption}
                  </Text>
                  <Text className="text-xs text-pink-400 font-semibold">
                    ⏰ Scheduled for: {new Date(item.scheduled_for).toLocaleString()}
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        )}

        {/* TAB 4: TRENDS */}
        {activeTab === 'trends' && (
          <View>
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-bold text-white">
                Viral Inspiration Feed
              </Text>
            </View>

            {trendsLoading ? (
              <SocialTrendsSkeleton />
            ) : trendsList.length === 0 ? (
              <View className="py-12 items-center gap-2">
                <Ionicons name="flame-outline" size={40} color="#64748B" />
                <Text className="text-base font-semibold text-white">
                  Trending Feed Loading
                </Text>
                <Text className="text-xs text-slate-400">
                  Fetching real-time trending content across YouTube, Reddit and social feeds.
                </Text>
              </View>
            ) : (
              trendsList.map((trend: any, idx: number) => (
                <View
                  key={trend.id || idx}
                  className="p-4 rounded-2xl mb-3 bg-[#181A1F] border border-[#262930]"
                >
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-xs font-bold text-pink-400">
                      {trend.source_platform || trend.platform || 'YouTube'}
                    </Text>
                    <Ionicons name="trending-up" size={16} color="#EC4899" />
                  </View>
                  <Text
                    className="text-sm font-semibold text-white mb-2"
                    numberOfLines={2}
                  >
                    {trend.title || trend.caption || 'Trending viral topic'}
                  </Text>
                  {trend.thumbnail_url && (
                    <Image
                      source={{ uri: trend.thumbnail_url }}
                      className="w-full h-40 rounded-xl mb-2.5"
                      resizeMode="cover"
                    />
                  )}
                  {trend.metrics && (
                    <View className="flex-row gap-3 pt-2 border-t border-[#262930]">
                      {trend.metrics.views != null && (
                        <Text className="text-xs text-slate-400 font-medium">
                          👁️ {Number(trend.metrics.views).toLocaleString()} Views
                        </Text>
                      )}
                      {trend.metrics.likes != null && (
                        <Text className="text-xs text-slate-400 font-medium">
                          ❤️ {Number(trend.metrics.likes).toLocaleString()} Likes
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <CreatePostModal
        visible={showCreateModal}
        connectedAccounts={accountsData || []}
        onClose={() => setShowCreateModal(false)}
        onSubmit={async (payload) => {
          await createPostMutation.mutateAsync(payload);
        }}
        isLoading={createPostMutation.isPending}
      />

      <PostDetailsModal
        visible={Boolean(selectedPost)}
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        onCancel={async (id) => {
          await cancelPostMutation.mutateAsync(id);
        }}
        onRetry={async (id) => {
          await retryPostMutation.mutateAsync(id);
        }}
        onDelete={async (id) => {
          await deletePostMutation.mutateAsync(id);
        }}
        isActionLoading={
          cancelPostMutation.isPending || retryPostMutation.isPending || deletePostMutation.isPending
        }
      />

      <AccountsModal
        visible={showAccountsModal}
        accounts={accountsData}
        onClose={() => setShowAccountsModal(false)}
        onDisconnect={async (provider, id) => {
          await disconnectAccountMutation.mutateAsync({ provider, accountId: id });
        }}
        isLoading={disconnectAccountMutation.isPending}
      />

      {/* Floating Home-Style Product Bottom Navigation Bar */}
      <ProductFloatingBottomBar
        items={SOCIAL_TABS}
        activeKey={activeTab}
        onChangeTab={(key) => {
          if (key === 'accounts') {
            setShowAccountsModal(true);
          } else {
            setActiveTab(key as TabType);
          }
        }}
        accentColor="#0084FF"
        moreMenuTitle="SocialPilot Menu"
      />
    </AppScreen>
  );
};
