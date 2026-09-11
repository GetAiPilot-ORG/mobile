import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  useColorScheme,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { AppScreen } from '../../../components/AppScreen';
import { AppTopBar } from '../../../components/AppTopBar';
import { apiClient } from '../../../core/api/client';
import { CreatePostModal } from '../components/CreatePostModal';
import { PostDetailsModal } from '../components/PostDetailsModal';
import { AccountsModal } from '../components/AccountsModal';

type TabType = 'overview' | 'posts' | 'calendar' | 'trends';

export const SocialScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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
    isLoading: accountsLoading,
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
    isLoading: queueLoading,
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
        return '#1877f2';
      case 'instagram':
        return '#e1306c';
      case 'threads':
        return '#000000';
      case 'youtube':
        return '#ff0000';
      case 'linkedin':
        return '#0a66c2';
      case 'x':
      case 'twitter':
        return '#000000';
      case 'reddit':
        return '#ff4500';
      case 'pinterest':
        return '#e60023';
      default:
        return '#ec4899';
    }
  };

  return (
    <AppScreen>
      <AppTopBar title="SocialPilot" subtitle="Cross-Platform Social Publishing" />

      {/* Tab Switcher */}
      <View style={styles.tabBar}>
        {(['overview', 'posts', 'calendar', 'trends'] as TabType[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <Pressable
              key={tab}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab);
              }}
              style={[
                styles.tabItem,
                isActive && [
                  styles.tabItemActive,
                  { backgroundColor: isDark ? '#1e293b' : '#ffffff' },
                ],
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  isActive
                    ? { color: '#ec4899', fontWeight: '800' }
                    : { color: isDark ? '#64748b' : '#94a3b8' },
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Main Content Area */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isOverviewRefetching || isPostsRefetching}
            onRefresh={handleRefresh}
            tintColor="#ec4899"
          />
        }
      >
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <View>
            {/* Quick Action Banner */}
            <View style={[styles.actionBanner, { backgroundColor: isDark ? '#1e1b4b' : '#fdf2f8' }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionTitle, { color: isDark ? '#f472b6' : '#be185d' }]}>
                  Broadcast Engine Ready
                </Text>
                <Text style={[styles.actionSub, { color: isDark ? '#cbd5e1' : '#64748b' }]}>
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
                style={styles.actionBtn}
              >
                <Ionicons name="add" size={18} color="#ffffff" />
                <Text style={styles.actionBtnText}>New Post</Text>
              </Pressable>
            </View>

            {/* Overview Metrics Cards */}
            <View style={styles.metricsGrid}>
              <View style={[styles.metricCard, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>
                <Ionicons name="send" size={18} color="#22c55e" />
                <Text style={[styles.metricNum, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                  {totalSentCount}
                </Text>
                <Text style={styles.metricLabel}>Published</Text>
              </View>

              <View style={[styles.metricCard, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>
                <Ionicons name="time" size={18} color="#3b82f6" />
                <Text style={[styles.metricNum, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                  {totalScheduledCount}
                </Text>
                <Text style={styles.metricLabel}>Scheduled</Text>
              </View>

              <View style={[styles.metricCard, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>
                <Ionicons name="checkmark-done-circle" size={18} color="#ec4899" />
                <Text style={[styles.metricNum, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                  {ops.successRate != null ? `${ops.successRate}%` : computedSuccessRate}
                </Text>
                <Text style={styles.metricLabel}>Success Rate</Text>
              </View>
            </View>

            {/* Connected Channels Summary Card */}
            <View style={[styles.sectionCard, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons name="share-social" size={18} color="#ec4899" />
                  <Text style={[styles.sectionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                    Connected Channels ({connectedList.length})
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowAccountsModal(true)}
                  style={styles.manageLink}
                >
                  <Text style={styles.manageLinkText}>Manage</Text>
                </Pressable>
              </View>

              {connectedList.length === 0 ? (
                <View style={styles.emptyInlineWrap}>
                  <Ionicons name="link-outline" size={20} color={isDark ? '#475569' : '#94a3b8'} />
                  <Text style={[styles.emptyInlineText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    No active channels connected. Tap Manage to link Instagram, Facebook, Threads or YouTube.
                  </Text>
                </View>
              ) : (
                <View style={styles.channelsPillsRow}>
                  {connectedList.map((acc: any, idx: number) => {
                    const provider = acc.provider || acc.platform || 'channel';
                    const name = acc.username || acc.name || acc.channelTitle || provider;
                    const avatarUrl = acc.profilePicture || acc.profile_picture_url;
                    return (
                      <View
                        key={acc.id || idx}
                        style={[
                          styles.platformPill,
                          {
                            backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                            borderColor: isDark ? '#334155' : '#e2e8f0',
                            borderWidth: 1,
                          },
                        ]}
                      >
                        {avatarUrl ? (
                          <Image source={{ uri: avatarUrl }} style={styles.pillAvatar} />
                        ) : (
                          <Ionicons
                            name={getPlatformIconName(provider) as any}
                            size={14}
                            color={getPlatformColor(provider)}
                          />
                        )}
                        <View style={{ maxWidth: 120 }}>
                          <Text
                            style={[styles.platformText, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                            numberOfLines={1}
                          >
                            {name}
                          </Text>
                          <Text style={styles.pillSubText}>
                            {provider.toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.liveDot} />
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Recent Broadcasts */}
            <View style={[styles.sectionCard, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons name="albums" size={18} color="#3b82f6" />
                  <Text style={[styles.sectionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                    Recent Activity ({recentActivityList.length})
                  </Text>
                </View>
                <Pressable onPress={() => setActiveTab('posts')}>
                  <Text style={styles.manageLinkText}>View All</Text>
                </Pressable>
              </View>

              {recentActivityList.length === 0 ? (
                <View style={styles.emptyInlineWrap}>
                  <Text style={[styles.emptyInlineText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
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
                      style={[styles.postItem, { borderBottomColor: isDark ? '#1e293b' : '#f1f5f9' }]}
                    >
                      {mediaThumb && (
                        <Image source={{ uri: mediaThumb }} style={styles.recentThumb} />
                      )}
                      <View style={{ flex: 1, paddingHorizontal: mediaThumb ? 10 : 0 }}>
                        <Text
                          style={[styles.postCaption, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                          numberOfLines={2}
                        >
                          {post.caption || 'Untitled Broadcast'}
                        </Text>
                        <Text style={styles.postMeta}>
                          {new Date(post.posted_at || post.scheduled_for || post.created_at || Date.now()).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor:
                              post.status === 'sent' || post.status === 'published'
                                ? 'rgba(34, 197, 94, 0.15)'
                                : post.status === 'failed'
                                  ? 'rgba(239, 68, 68, 0.15)'
                                  : 'rgba(59, 130, 246, 0.15)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            {
                              color:
                                post.status === 'sent' || post.status === 'published'
                                  ? '#22c55e'
                                  : post.status === 'failed'
                                    ? '#ef4444'
                                    : '#3b82f6',
                            },
                          ]}
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
        )}

        {/* TAB 2: POSTS */}
        {activeTab === 'posts' && (
          <View>
            <View style={styles.tabHeaderRow}>
              <Text style={[styles.tabHeading, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                Broadcast Posts ({postsList.length})
              </Text>
              <Pressable
                onPress={() => setShowCreateModal(true)}
                style={styles.smallCreateBtn}
              >
                <Ionicons name="add" size={16} color="#ffffff" />
                <Text style={styles.smallCreateBtnText}>Create</Text>
              </Pressable>
            </View>

            {postsLoading ? (
              <ActivityIndicator size="large" color="#ec4899" style={{ marginTop: 30 }} />
            ) : postsList.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="newspaper-outline" size={40} color={isDark ? '#475569' : '#94a3b8'} />s
                <Text style={[styles.emptyTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                  No Broadcast Posts Found
                </Text>
                <Text style={[styles.emptyDesc, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                  Create your first social media broadcast now.
                </Text>
              </View>
            ) : (
              postsList.map((post: any) => (
                <Pressable
                  key={post.id}
                  onPress={() => setSelectedPost(post)}
                  style={[styles.fullPostCard, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}
                >
                  <View style={styles.postTop}>
                    <View style={styles.postChannels}>
                      {(post.selected_channels || ['social']).map((ch: string, i: number) => (
                        <Text key={i} style={styles.chTag}>
                          {ch.replace(/^.+:/, '').toUpperCase()}
                        </Text>
                      ))}
                    </View>
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor:
                            post.status === 'sent' || post.status === 'published'
                              ? 'rgba(34, 197, 94, 0.15)'
                              : post.status === 'failed'
                                ? 'rgba(239, 68, 68, 0.15)'
                                : 'rgba(59, 130, 246, 0.15)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          {
                            color:
                              post.status === 'sent' || post.status === 'published'
                                ? '#22c55e'
                                : post.status === 'failed'
                                  ? '#ef4444'
                                  : '#3b82f6',
                          },
                        ]}
                      >
                        {post.status || 'sent'}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[styles.postFullCaption, { color: isDark ? '#e2e8f0' : '#1e293b' }]}
                    numberOfLines={3}
                  >
                    {post.caption || 'No caption provided.'}
                  </Text>

                  {(post.thumbnail_url || post.media_url) && (
                    <Image
                      source={{ uri: post.thumbnail_url || post.media_url }}
                      style={styles.postThumb}
                      resizeMode="cover"
                    />
                  )}

                  <View style={styles.postBottom}>
                    <Text style={styles.postDate}>
                      {new Date(post.posted_at || post.scheduled_for || post.created_at || Date.now()).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#64748b" />
                  </View>
                </Pressable>
              ))
            )}
          </View>
        )}

        {/* TAB 3: CALENDAR */}
        {activeTab === 'calendar' && (
          <View>
            <View style={styles.tabHeaderRow}>
              <Text style={[styles.tabHeading, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                Scheduled Queue ({queueList.length})
              </Text>
              <Pressable
                onPress={() => setShowCreateModal(true)}
                style={styles.smallCreateBtn}
              >
                <Ionicons name="calendar" size={16} color="#ffffff" />
                <Text style={styles.smallCreateBtnText}>Schedule</Text>
              </Pressable>
            </View>

            {queueList.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="time-outline" size={40} color={isDark ? '#475569' : '#94a3b8'} />
                <Text style={[styles.emptyTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                  No Pending Scheduled Posts
                </Text>
                <Text style={[styles.emptyDesc, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                  Schedule future posts to maintain an active multi-channel presence.
                </Text>
              </View>
            ) : (
              queueList.map((item: any) => (
                <Pressable
                  key={item.id}
                  onPress={() => setSelectedPost(item)}
                  style={[styles.fullPostCard, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}
                >
                  <View style={styles.postTop}>
                    <View style={styles.postChannels}>
                      {(item.selected_channels || ['social']).map((ch: string, i: number) => (
                        <Text key={i} style={styles.chTag}>
                          {ch.toUpperCase()}
                        </Text>
                      ))}
                    </View>
                    <View style={[styles.badge, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                      <Text style={[styles.badgeText, { color: '#3b82f6' }]}>
                        {item.status || 'scheduled'}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[styles.postFullCaption, { color: isDark ? '#e2e8f0' : '#1e293b' }]}
                    numberOfLines={2}
                  >
                    {item.caption}
                  </Text>
                  <Text style={[styles.scheduledDateText, { color: '#ec4899' }]}>
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
            <View style={styles.tabHeaderRow}>
              <Text style={[styles.tabHeading, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                Viral Inspiration Feed
              </Text>
            </View>

            {trendsLoading ? (
              <ActivityIndicator size="large" color="#ec4899" style={{ marginTop: 30 }} />
            ) : trendsList.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="flame-outline" size={40} color={isDark ? '#475569' : '#94a3b8'} />
                <Text style={[styles.emptyTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                  Trending Feed Loading
                </Text>
                <Text style={[styles.emptyDesc, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                  Fetching real-time trending content across YouTube, Reddit and social feeds.
                </Text>
              </View>
            ) : (
              trendsList.map((trend: any, idx: number) => (
                <View
                  key={trend.id || idx}
                  style={[styles.trendCard, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}
                >
                  <View style={styles.trendHeader}>
                    <Text style={styles.trendSource}>
                      {(trend.source_platform || trend.platform || 'YOUTUBE').toUpperCase()}
                    </Text>
                    <Ionicons name="trending-up" size={16} color="#ec4899" />
                  </View>
                  <Text
                    style={[styles.trendTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                    numberOfLines={2}
                  >
                    {trend.title || trend.caption || 'Trending viral topic'}
                  </Text>
                  {trend.thumbnail_url && (
                    <Image
                      source={{ uri: trend.thumbnail_url }}
                      style={styles.trendImage}
                      resizeMode="cover"
                    />
                  )}
                  {trend.metrics && (
                    <View style={styles.trendMetricsRow}>
                      {trend.metrics.views != null && (
                        <Text style={styles.trendMetricText}>
                          👁️ {Number(trend.metrics.views).toLocaleString()} Views
                        </Text>
                      )}
                      {trend.metrics.likes != null && (
                        <Text style={styles.trendMetricText}>
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
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    borderRadius: 12,
    padding: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  actionSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  actionBtn: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
  },
  metricNum: {
    fontSize: 18,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  manageLink: {
    paddingHorizontal: 4,
  },
  manageLinkText: {
    color: '#ec4899',
    fontSize: 12,
    fontWeight: '700',
  },
  channelsPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  platformPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pillAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  pillSubText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  emptyInlineWrap: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyInlineText: {
    fontSize: 12,
    textAlign: 'center',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  platformText: {
    fontSize: 11,
    fontWeight: '600',
  },
  recentThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#000',
  },
  postItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  postCaption: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  postMeta: {
    fontSize: 11,
    color: '#64748b',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  tabHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  tabHeading: {
    fontSize: 16,
    fontWeight: '800',
  },
  smallCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ec4899',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  smallCreateBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
  },
  emptyDesc: {
    fontSize: 12,
    textAlign: 'center',
  },
  fullPostCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
  },
  postTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  postChannels: {
    flexDirection: 'row',
    gap: 6,
  },
  chTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ec4899',
  },
  postFullCaption: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  postThumb: {
    height: 140,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#000',
  },
  postBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postDate: {
    fontSize: 11,
    color: '#64748b',
  },
  scheduledDateText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  trendCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendSource: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ec4899',
  },
  trendTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 8,
  },
  trendImage: {
    height: 150,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#000',
  },
  trendMetricsRow: {
    flexDirection: 'row',
    gap: 14,
  },
  trendMetricText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
});
