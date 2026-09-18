import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BackHandler,
  RefreshControl,
  ScrollView,
  StyleSheet,
} from 'react-native';

import { AppScreen } from '../../../components/AppScreen';
import { AppTopBar } from '../../../components/AppTopBar';
import {
  ProductFloatingBottomBar,
  ProductTabItem,
} from '../../../components/ProductFloatingBottomBar';
import { apiClient } from '../../../core/api/client';
import {
  AccountsModal,
  CreatePostModal,
  InstapilotConversationModal,
  PostDetailsModal,
  SocialActivityTab,
  SocialInboxTab,
  SocialOverviewTab,
  SocialTrendsTab,
} from '../components';
import {
  InstapilotConversation,
  SocialTabType,
  SystemProductStatus,
  SystemSettings,
  TrendItem,
  YoutubeChannelAccount,
} from '../types';

const SOCIAL_TABS: ProductTabItem[] = [
  {
    key: 'overview',
    label: 'Overview',
    activeIcon: 'grid',
    inactiveIcon: 'grid-outline',
    description: 'Connected social media apps & metrics',
  },
  {
    key: 'trends',
    label: 'Trend Feed',
    activeIcon: 'flame',
    inactiveIcon: 'flame-outline',
    description: 'Viral trends across YouTube, Reddit & Social',
  },
  {
    key: 'inbox',
    label: 'Social Inbox',
    activeIcon: 'chatbubbles',
    inactiveIcon: 'chatbubbles-outline',
    description: 'Instagram DMs & Facebook conversations',
  },
  {
    key: 'activity',
    label: 'Activity',
    activeIcon: 'pulse',
    inactiveIcon: 'pulse-outline',
    description: 'Scheduled Queue, Instapilot, YouTube Studio & AutoDM',
  },
];

export const SocialScreen: React.FC = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<SocialTabType>('overview');
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [selectedInstapilotConv, setSelectedInstapilotConv] = useState<InstapilotConversation | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAccountsModal, setShowAccountsModal] = useState(false);
  const [initialCaptionForCreate, setInitialCaptionForCreate] = useState<string | undefined>(undefined);

  // Hardware Back Handler
  useEffect(() => {
    const onHardwareBack = () => {
      if (selectedInstapilotConv) {
        setSelectedInstapilotConv(null);
        return true;
      }
      if (selectedPost) {
        setSelectedPost(null);
        return true;
      }
      if (activeTab !== 'overview') {
        setActiveTab('overview');
        return true;
      }
      if (router.canGoBack()) {
        router.back();
        return true;
      }
      router.replace('/(tabs)/products');
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [selectedPost, selectedInstapilotConv, activeTab, router]);

  const [selectedRange, setSelectedRange] = useState<number>(30);

  // 1. Overview Telemetry Query
  const {
    data: overviewData,
    isLoading: overviewLoading,
    refetch: refetchOverview,
    isRefetching: isOverviewRefetching,
    error: overviewError,
  } = useQuery({
    queryKey: ['social', 'overview', selectedRange],
    queryFn: async () =>
      apiClient.get<any>('/mobile/v1/social/overview', {
        params: { range: selectedRange },
      }),
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

  // 6. Stats Query
  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['social', 'stats'],
    queryFn: async () => {
      try {
        return await apiClient.get<any>('/mobile/v1/social/stats');
      } catch {
        return null;
      }
    },
  });

  // 7. Entitlements Query
  const { data: entitlementsData, refetch: refetchEntitlements } = useQuery({
    queryKey: ['social', 'entitlements'],
    queryFn: async () => {
      try {
        return await apiClient.get<any>('/mobile/v1/social/entitlements');
      } catch {
        return null;
      }
    },
  });

  // 8. Instapilot Inbox Conversations Query (syncs in 5s)
  const {
    data: instapilotConversationsData,
    isLoading: instapilotLoading,
    refetch: refetchInstapilotConversations,
  } = useQuery({
    queryKey: ['social', 'instapilot', 'conversations'],
    queryFn: async () => apiClient.get<InstapilotConversation[]>('/mobile/v1/social/instapilot/conversations'),
    refetchInterval: activeTab === 'activity' ? 5000 : false,
  });

  // 9. System Settings Query
  const { data: systemSettingsData } = useQuery({
    queryKey: ['social', 'system', 'settings'],
    queryFn: async () => apiClient.get<SystemSettings[]>('/mobile/v1/social/system/settings'),
  });

  // 10. System Product Health Query
  const { data: systemProductData } = useQuery({
    queryKey: ['social', 'system', 'product'],
    queryFn: async () => apiClient.get<SystemProductStatus[]>('/mobile/v1/social/system/product'),
  });

  // 11. YouTube Studio Accounts & Telemetry Query
  const {
    data: youtubeAccountsData,
    isLoading: youtubeAccountsLoading,
    refetch: refetchYoutubeAccounts,
  } = useQuery({
    queryKey: ['social', 'youtube', 'accounts'],
    queryFn: async () => apiClient.get<YoutubeChannelAccount[]>('/mobile/v1/social/youtube/accounts'),
  });

  // Mutations
  const instapilotSyncMutation = useMutation({
    mutationFn: async () => apiClient.post<{ success: boolean; synced: number }>('/mobile/v1/social/instapilot/sync', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social', 'instapilot', 'conversations'] });
    },
  });

  const syncMutateAsync = instapilotSyncMutation.mutateAsync;
  const handleSyncInstapilot = useCallback(async () => {
    try {
      await syncMutateAsync();
    } catch {
      // Ignore background sync errors
    }
  }, [syncMutateAsync]);

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
      refetchStats(),
      refetchEntitlements(),
    ]);
  };

  const ops = overviewData?.operations || {};
  const postsList = Array.isArray(postsData) ? postsData : [];
  const queueList = Array.isArray(queueData) ? queueData : [];
  const trendsList: TrendItem[] = useMemo(() => {
    if (Array.isArray(trendsData)) return trendsData;
    if (Array.isArray((trendsData as any)?.items)) return (trendsData as any).items;
    return [];
  }, [trendsData]);

  // Extract all genuinely connected accounts with full merged telemetry
  const connectedList = useMemo(() => {
    const list: any[] = [];
    const seenMap = new Map<string, number>();

    const addOrMergeAccount = (acc: any) => {
      if (!acc) return;
      const provider = (acc.provider || acc.platform || 'channel').toLowerCase();
      const username = acc.username || acc.name || '';
      const id = acc.id || acc.accountId || (username ? `${provider}_${username}` : `${provider}_${list.length}`);
      const dedupeKey = `${provider}_${username || id}`.toLowerCase();

      const normalized = {
        ...acc,
        id,
        provider,
        platform: provider,
        username,
        name: acc.name || acc.channelTitle || username || provider,
        account_name: acc.account_name || acc.name || username || provider,
        avatar: acc.profilePicture || acc.profile_picture_url || acc.thumbnailUrl || acc.avatar || null,
        profilePicture: acc.profilePicture || acc.profile_picture_url || acc.thumbnailUrl || acc.avatar || null,
        profile_picture_url: acc.profile_picture_url || acc.profilePicture || acc.avatar || null,
        followers: acc.followers ?? acc.followers_count ?? acc.followerCount ?? null,
        followers_count: acc.followers_count ?? acc.followers ?? acc.followerCount ?? null,
        mediaCount: acc.mediaCount ?? acc.media_count ?? null,
        media_count: acc.media_count ?? acc.mediaCount ?? null,
        reach: acc.reach ?? null,
        topMedia: acc.topMedia || [],
        tokenExpiry: acc.tokenExpiry || acc.token_expiry || acc.tokenExpiresAt || null,
        token_expiry: acc.token_expiry || acc.tokenExpiry || acc.tokenExpiresAt || null,
        status: acc.status || (acc.tokenStatus === 'disconnected' ? 'disconnected' : 'connected'),
        connected: acc.connected !== false && acc.tokenStatus !== 'disconnected',
      };

      if (seenMap.has(dedupeKey)) {
        const existingIdx = seenMap.get(dedupeKey)!;
        list[existingIdx] = {
          ...list[existingIdx],
          ...normalized,
          avatar: normalized.avatar || list[existingIdx].avatar,
          profilePicture: normalized.profilePicture || list[existingIdx].profilePicture,
          followers: normalized.followers ?? list[existingIdx].followers,
          followers_count: normalized.followers_count ?? list[existingIdx].followers_count,
          mediaCount: normalized.mediaCount ?? list[existingIdx].mediaCount,
          media_count: normalized.media_count ?? list[existingIdx].media_count,
          reach: normalized.reach ?? list[existingIdx].reach,
          topMedia: normalized.topMedia.length > 0 ? normalized.topMedia : list[existingIdx].topMedia,
          tokenExpiry: normalized.tokenExpiry || list[existingIdx].tokenExpiry,
        };
      } else {
        seenMap.set(dedupeKey, list.length);
        list.push(normalized);
      }
    };

    if (Array.isArray(accountsData)) {
      accountsData.forEach(addOrMergeAccount);
    } else if (accountsData && typeof accountsData === 'object') {
      const providers = [
        'facebook',
        'instagram',
        'threads',
        'youtube',
        'linkedin',
        'x',
        'pinterest',
        'reddit',
        'bluesky',
        'mastodon',
        'googleBusiness',
      ];
      for (const p of providers) {
        const arrKey = `${p}Accounts`;
        if (Array.isArray(accountsData[arrKey])) {
          accountsData[arrKey].forEach((a: any) => addOrMergeAccount({ ...a, provider: p }));
        } else if (accountsData[p]?.connected) {
          addOrMergeAccount({ ...accountsData[p], provider: p });
        }
      }
    }

    if (Array.isArray(overviewData?.accounts?.accounts)) {
      overviewData.accounts.accounts.forEach((a: any) => addOrMergeAccount({ ...a, connected: a.connected !== false }));
    }
    if (Array.isArray(overviewData?.instagramGrowth?.accounts)) {
      overviewData.instagramGrowth.accounts.forEach((ig: any) =>
        addOrMergeAccount({ ...ig, provider: 'instagram', connected: ig.tokenStatus !== 'disconnected' })
      );
    }

    return list;
  }, [accountsData, overviewData]);

  const sentPostsCount = postsList.filter((p: any) => {
    const s = (p.status || '').toLowerCase();
    return s === 'sent' || s === 'published' || s === 'completed' || s === 'success' || s === 'delivered';
  }).length;

  const scheduledPostsCount =
    queueList.length > 0
      ? queueList.length
      : postsList.filter((p: any) => {
        const s = (p.status || '').toLowerCase();
        return s === 'scheduled' || s === 'queued' || s === 'pending';
      }).length;

  const totalSentCount = ops.sent && ops.sent > 0 ? Math.max(ops.sent, sentPostsCount) : sentPostsCount;
  const totalScheduledCount =
    ops.scheduled && ops.scheduled > 0 ? Math.max(ops.scheduled, scheduledPostsCount) : scheduledPostsCount;
  const totalFailedCount =
    ops.failed && ops.failed > 0
      ? ops.failed
      : postsList.filter((p: any) => (p.status || '').toLowerCase() === 'failed').length;

  const totalCompleted = totalSentCount + totalFailedCount;
  const computedSuccessRate =
    totalCompleted > 0
      ? `${Math.round((totalSentCount / totalCompleted) * 100)}%`
      : totalSentCount > 0
        ? '100%'
        : '0%';

  return (
    <AppScreen>
      <AppTopBar title="SocialPilot" subtitle="Cross-Platform Social Publishing" />

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
        {/* TAB 1: OVERVIEW WITH CONNECTED SOCIAL MEDIA APPS */}
        {activeTab === 'overview' && (
          <SocialOverviewTab
            overviewLoading={overviewLoading}
            overviewError={overviewError}
            onRetryOverview={refetchOverview}
            overviewData={overviewData}
            statsData={statsData}
            entitlementsData={entitlementsData}
            connectedList={connectedList}
            postsList={postsList}
            queueList={queueList}
            totalSentCount={totalSentCount}
            totalScheduledCount={totalScheduledCount}
            computedSuccessRate={computedSuccessRate}
            selectedRange={selectedRange}
            onChangeRange={(days) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedRange(days);
            }}
            onOpenCreateModal={() => {
              setInitialCaptionForCreate(undefined);
              setShowCreateModal(true);
            }}
            onOpenAccountsModal={() => setShowAccountsModal(true)}
            // onSelectPost={setSelectedPost}
            onNavigateToTab={setActiveTab}
          />
        )}

        {/* TAB 2: TREND FEED */}
        {activeTab === 'trends' && (
          <SocialTrendsTab
            trendsLoading={trendsLoading}
            trendsList={trendsList}
            onRefreshTrends={refetchTrends}
            onUseTrendInPost={(trend) => {
              setInitialCaptionForCreate(trend.title || trend.caption || '');
              setShowCreateModal(true);
            }}
          />
        )}

        {/* TAB 3: SOCIAL INBOX */}
        {activeTab === 'inbox' && (
          <SocialInboxTab />
        )}

        {/* TAB 4: ACTIVITY (Scheduled Queue, Instapilot, YouTube Studio, AutoDM) */}
        {activeTab === 'activity' && (
          <SocialActivityTab
            queueLoading={queueLoading}
            queueList={queueList}
            connectedAccounts={connectedList}
            onOpenCreateModal={() => {
              setInitialCaptionForCreate(undefined);
              setShowCreateModal(true);
            }}
            onSelectPost={setSelectedPost}
            onCancelPost={async (postId) => {
              await cancelPostMutation.mutateAsync(postId);
            }}
            onRetryPost={async (postId) => {
              await retryPostMutation.mutateAsync(postId);
            }}
            instapilotConversations={instapilotConversationsData || []}
            instapilotLoading={instapilotLoading}
            isSyncingInstapilot={instapilotSyncMutation.isPending}
            onSyncInstapilot={handleSyncInstapilot}
            onSelectInstapilotConv={setSelectedInstapilotConv}
            systemSettings={systemSettingsData}
            systemProduct={systemProductData}
            youtubeAccounts={youtubeAccountsData || []}
            youtubeAccountsLoading={youtubeAccountsLoading}
            onRefreshYoutubeAccounts={refetchYoutubeAccounts}
          />
        )}
      </ScrollView>

      {/* Modals */}
      <CreatePostModal
        key={showCreateModal ? (initialCaptionForCreate || 'modal_open') : 'modal_closed'}
        visible={showCreateModal}
        connectedAccounts={accountsData || []}
        initialCaption={initialCaptionForCreate}
        onClose={() => {
          setShowCreateModal(false);
          setInitialCaptionForCreate(undefined);
        }}
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

      <InstapilotConversationModal
        visible={Boolean(selectedInstapilotConv)}
        conversation={selectedInstapilotConv}
        onClose={() => setSelectedInstapilotConv(null)}
      />

      {/* Floating Home-Style Product Bottom Navigation Bar */}
      <ProductFloatingBottomBar
        items={SOCIAL_TABS}
        activeKey={activeTab}
        onChangeTab={(key) => {
          setActiveTab(key as SocialTabType);
        }}
        accentColor="#EC4899"
        moreMenuTitle="SocialPilot Menu"
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
    paddingTop: 8,
    paddingBottom: 130,
  },
});
