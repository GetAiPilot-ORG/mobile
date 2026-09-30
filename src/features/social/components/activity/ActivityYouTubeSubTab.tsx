import {
  Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React,
  { useMemo,
  useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  SystemProductStatus,
  SystemSettings,
  YoutubeChannelAccount,
  YoutubeVideoItem,
} from '../../types';
import { openSocialHandoff } from '../../utils/socialHandoff';
import { useTheme, getColors } from '@/theme';

export interface ActivityYouTubeSubTabProps {
  youtubeAccounts?: YoutubeChannelAccount[];
  youtubeAccountsLoading?: boolean;
  onRefreshYoutubeAccounts?: () => Promise<any>;
  connectedAccounts: any[];
  queueList: any[];
  systemSettings?: SystemSettings[];
  systemProduct?: SystemProductStatus[];
}

export const ActivityYouTubeSubTab: React.FC<ActivityYouTubeSubTabProps> = ({
  youtubeAccounts = [],
  connectedAccounts,
  queueList,
  systemSettings = [],
  systemProduct = [],
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const [youtubeCategory, setYoutubeCategory] = useState<'All' | 'Videos' | 'Shorts' | 'Scheduled' | 'Playlists'>('All');
  const [youtubeSearch, setYoutubeSearch] = useState('');

  const productStatus = systemProduct?.[0];
  const settingsStatus = systemSettings?.[0];
  const isSystemOperational =
    productStatus?.status === 'operational' &&
    !productStatus?.maintenance_enabled &&
    !settingsStatus?.global_maintenance_enabled;

  const activeYtAccount =
    youtubeAccounts?.[0] ||
    connectedAccounts.find(
      (a) => (a.provider || a.platform || '').toLowerCase() === 'youtube'
    );
  const ytStats = activeYtAccount?.youtube?.statistics;

  const allYtVideos: YoutubeVideoItem[] = useMemo(() => {
    const list: YoutubeVideoItem[] = [];

    // 1. Live account videos from YouTube API
    if (activeYtAccount?.videos && activeYtAccount.videos.length > 0) {
      activeYtAccount.videos.forEach((v) => list.push(v));
    }

    // 2. Scheduled YouTube broadcasts from queue
    (queueList || []).forEach((item) => {
      const isYoutube =
        (item.channels || item.selected_channels || []).some((c: string) =>
          (c || '').toLowerCase().includes('youtube')
        ) || (item.channel || '').toLowerCase().includes('youtube');

      if (isYoutube) {
        const isShort = item.post_type === 'short' || item.aspect_ratio === '9:16';
        list.push({
          id: `queue_${item.id}`,
          title: item.caption || item.title || 'Scheduled YouTube Broadcast',
          description: item.caption || '',
          views: item.views || 0,
          likes: item.likes || 0,
          duration: isShort ? '0:58' : '5:30',
          status: item.status || 'scheduled',
          scheduledFor: item.scheduled_for,
          publishedAt: item.posted_at || item.created_at,
          thumbnailUrl: item.media_urls?.[0] || item.thumbnail_url,
          category: isShort ? 'Shorts' : 'Videos',
          videoUrl: item.published_url,
        });
      }
    });



    return list;
  }, [activeYtAccount, queueList]);

  const filteredYtVideos = useMemo(() => {
    return allYtVideos.filter((v) => {
      const q = youtubeSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        (v.title || '').toLowerCase().includes(q) ||
        (v.description || '').toLowerCase().includes(q);
      if (!matchSearch) return false;

      if (youtubeCategory === 'All') return true;
      if (youtubeCategory === 'Videos') return v.category === 'Videos';
      if (youtubeCategory === 'Shorts') return v.category === 'Shorts';
      if (youtubeCategory === 'Scheduled') {
        return v.status === 'scheduled' || v.status === 'queued' || v.category === 'Scheduled';
      }
      if (youtubeCategory === 'Playlists') return v.category === 'Playlists';
      return true;
    });
  }, [allYtVideos, youtubeCategory, youtubeSearch]);

  const ytCategoryCounts = useMemo(() => {
    return {
      All: allYtVideos.length,
      Videos: allYtVideos.filter((v) => v.category === 'Videos').length,
      Shorts: allYtVideos.filter((v) => v.category === 'Shorts').length,
      Scheduled: allYtVideos.filter(
        (v) => v.status === 'scheduled' || v.status === 'queued' || v.category === 'Scheduled'
      ).length,
      Playlists: allYtVideos.filter((v) => v.category === 'Playlists').length,
    };
  }, [allYtVideos]);

  const topVideoViewsDisplay = useMemo(() => {
    if (!allYtVideos || allYtVideos.length === 0) return '0';
    const max = Math.max(...allYtVideos.map((v) => Number(v.views || 0)));
    if (max <= 0) return '0';
    return max >= 1000 ? `${(max / 1000).toFixed(1)}K` : `${max}`;
  }, [allYtVideos]);

  const totalViewsDisplay = useMemo(() => {
    if (ytStats?.viewCount !== undefined && ytStats?.viewCount !== null) {
      const num = Number(ytStats.viewCount);
      return num >= 1000 ? `${(num / 1000).toFixed(1)}K` : `${num}`;
    }
    if (!allYtVideos || allYtVideos.length === 0) return '0';
    const sum = allYtVideos.reduce((acc, v) => acc + Number(v.views || 0), 0);
    return sum >= 1000 ? `${(sum / 1000).toFixed(1)}K` : `${sum}`;
  }, [ytStats, allYtVideos]);

  const subscribersDisplay = useMemo(() => {
    if (ytStats?.subscriberCount !== undefined && ytStats?.subscriberCount !== null) {
      const num = Number(ytStats.subscriberCount);
      return num >= 1000 ? `${(num / 1000).toFixed(1)}K` : `${num}`;
    }
    return activeYtAccount?.connected ? '0' : '--';
  }, [ytStats, activeYtAccount]);

  const videosCountDisplay = useMemo(() => {
    if (ytStats?.videoCount !== undefined && ytStats?.videoCount !== null) return String(ytStats.videoCount);
    return String(allYtVideos.length);
  }, [ytStats, allYtVideos]);

  return (
    <View style={styles.subContent}>
      {/* Header Action Row */}
      <View style={styles.headerActionRow}>
        <View style={styles.headerTextCol}>
          <Text style={[styles.subTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
            YouTube Studio
          </Text>
          <Text style={[styles.subDesc, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            Video publishing, Shorts manager & channel telemetry
          </Text>
        </View>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            openSocialHandoff('upload-short');
          }}
          style={[styles.primaryActionBtn, { backgroundColor: '#ff0000' }]}
        >
          <Ionicons name="videocam" size={14} color="#ffffff" />
          <Text style={styles.primaryActionBtnText}>Upload Short</Text>
        </Pressable>
      </View>

      {/* 1. Operational System Status Banner (from Supabase system_products & system_settings) */}
      <View
        style={[
          styles.ytSystemHealthCard,
          {
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            borderColor: isDark ? '#1e293b' : '#e2e8f0',
          },
        ]}
      >
        <View style={styles.ytSystemHealthRow}>
          <View style={styles.ytSystemHealthLeft}>
            <View
              style={[
                styles.pulsingDot,
                { backgroundColor: isSystemOperational ? '#22c55e' : '#f59e0b' },
              ]}
            />
            <Text style={[styles.ytSystemHealthTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
              {productStatus?.product_name || 'GAP Social Pilot'}
            </Text>
            <View
              style={[
                styles.ytOperationalBadge,
                {
                  backgroundColor: isSystemOperational
                    ? 'rgba(34, 197, 94, 0.12)'
                    : 'rgba(245, 158, 11, 0.12)',
                },
              ]}
            >
              <Text
                style={[
                  styles.ytOperationalBadgeText,
                  { color: isSystemOperational ? '#16a34a' : '#d97706' },
                ]}
              >
                {isSystemOperational ? 'Operational' : productStatus?.status || 'Maintenance'}
              </Text>
            </View>
          </View>
          <Text style={styles.ytSystemHealthSub}>Graph API v3 • Live</Text>
        </View>
      </View>

      {/* 2. YouTube Channel Identity Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            borderColor: isDark ? '#1e293b' : '#e2e8f0',
          },
        ]}
      >
        <View style={styles.profileRow}>
          {Boolean(activeYtAccount?.youtube?.snippet?.thumbnails?.default?.url || (activeYtAccount as any)?.avatar || (activeYtAccount as any)?.profilePicture) ? (
            <Image
              source={{ uri: activeYtAccount?.youtube?.snippet?.thumbnails?.default?.url || (activeYtAccount as any)?.avatar || (activeYtAccount as any)?.profilePicture }}
              style={[styles.profileAvatar, { borderWidth: 1.5, borderColor: '#ff0000' }]}
            />
          ) : (
            <View style={[styles.profileAvatar, { backgroundColor: 'rgba(255, 0, 0, 0.15)' }]}>
              <Ionicons name="logo-youtube" size={26} color="#ff0000" />
            </View>
          )}
          <View style={styles.profileInfoCol}>
            <Text style={[styles.profileName, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
              {activeYtAccount?.youtube?.snippet?.title ||
                activeYtAccount?.account_name ||
                (activeYtAccount?.connected ? 'Connected YouTube Channel' : 'No Channel Connected')}
            </Text>
            <View style={styles.ytChannelSubtitleRow}>
              <Text style={styles.profileStatus}>
                {activeYtAccount?.connected ? '✅ Verified Partner Channel' : 'Ready to link channel'}
              </Text>
              <View style={styles.ytReadyBadge}>
                <Text style={styles.ytReadyBadgeText}>Ready</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 3. Analytics on Top of the List (4 Metrics Grid) */}
        <View style={styles.igMetricsGrid}>
          <View style={styles.igMetricBox}>
            <Text style={[styles.igMetricNum, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
              {subscribersDisplay}
            </Text>
            <Text style={styles.igMetricLabel}>Subscribers</Text>
          </View>
          <View style={styles.igMetricBox}>
            <Text style={[styles.igMetricNum, { color: '#ff0000' }]}>
              {totalViewsDisplay}
            </Text>
            <Text style={styles.igMetricLabel}>Total Views</Text>
          </View>
          <View style={styles.igMetricBox}>
            <Text style={[styles.igMetricNum, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
              {videosCountDisplay}
            </Text>
            <Text style={styles.igMetricLabel}>Videos</Text>
          </View>
          <View style={styles.igMetricBox}>
            <Text style={[styles.igMetricNum, { color: '#22c55e' }]}>
              {topVideoViewsDisplay}
            </Text>
            <Text style={styles.igMetricLabel}>Top Video Views</Text>
          </View>
        </View>
      </View>

      {/* 4. Category Filter Bar (Top of List) */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            borderColor: isDark ? '#1e293b' : '#e2e8f0',
            paddingBottom: 6,
          },
        ]}
      >
        <View style={styles.ytSectionHeaderRow}>
          <Text style={[styles.cardSectionTitle, { color: isDark ? '#f8fafc' : '#0f172a', marginBottom: 0 }]}>
            Video Broadcasts & Telemetry
          </Text>
          <Text style={[styles.ytVideosTotalText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            {filteredYtVideos.length} {filteredYtVideos.length === 1 ? 'item' : 'items'}
          </Text>
        </View>

        {/* Search Input */}
        <View
          style={[
            styles.inboxSearchInputBox,
            {
              backgroundColor: isDark ? '#1e293b' : '#f8fafc',
              borderColor: isDark ? '#334155' : '#cbd5e1',
              marginVertical: 10,
            },
          ]}
        >
          <Ionicons name="search" size={15} color={isDark ? '#94a3b8' : '#64748b'} />
          <TextInput
            style={[styles.inboxSearchInput, { color: isDark ? '#f8fafc' : '#0f172a' }]}
            placeholder="Search videos, shorts, or tags..."
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            value={youtubeSearch}
            onChangeText={setYoutubeSearch}
          />
          {Boolean(youtubeSearch) && (
            <Pressable onPress={() => setYoutubeSearch('')}>
              <Ionicons name="close-circle" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
            </Pressable>
          )}
        </View>

        {/* Category Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ytCategoryScrollView}>
          {(['All', 'Videos', 'Shorts', 'Scheduled', 'Playlists'] as const).map((cat) => {
            const count = ytCategoryCounts[cat] || 0;
            const isSelected = youtubeCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => {
                  Haptics.selectionAsync();
                  setYoutubeCategory(cat);
                }}
                style={[
                  styles.ytCategoryChip,
                  isSelected
                    ? [styles.ytCategoryChipActive, { backgroundColor: '#ff0000' }]
                    : { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
                ]}
              >
                <Text
                  style={[
                    styles.ytCategoryChipText,
                    { color: isSelected ? '#ffffff' : isDark ? '#cbd5e1' : '#64748b' },
                  ]}
                >
                  {cat}
                </Text>
                <View
                  style={[
                    styles.ytCategoryCountPill,
                    {
                      backgroundColor: isSelected
                        ? 'rgba(255, 255, 255, 0.25)'
                        : isDark
                          ? 'rgba(148, 163, 184, 0.2)'
                          : 'rgba(148, 163, 184, 0.3)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.ytCategoryCountText,
                      { color: isSelected ? '#ffffff' : isDark ? '#94a3b8' : '#64748b' },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 5. List with Category & Details */}
      {filteredYtVideos.length === 0 ? (
        <View style={styles.inboxEmptyBox}>
          <Ionicons name="videocam-outline" size={32} color={isDark ? '#475569' : '#cbd5e1'} />
          <Text style={[styles.inboxEmptyTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
            No videos found
          </Text>
          <Text style={[styles.inboxEmptyDesc, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            No items match the &quot;{youtubeCategory}&quot; category filter.
          </Text>
        </View>
      ) : (
        <View style={styles.ytVideoListContainer}>
          {filteredYtVideos.map((video) => {
            const isShort = video.category === 'Shorts';
            const isScheduled = video.status === 'scheduled' || video.status === 'queued';
            const formattedViews =
              typeof video.views === 'number'
                ? video.views >= 1000
                  ? `${(video.views / 1000).toFixed(1)}K`
                  : `${video.views}`
                : video.views || '0';

            return (
              <View
                key={video.id}
                style={[
                  styles.ytVideoCard,
                  {
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#1e293b' : '#e2e8f0',
                  },
                ]}
              >
                <View style={styles.ytVideoMainRow}>
                  {/* Thumbnail with duration badge */}
                  <View style={styles.ytThumbWrapper}>
                    {video.thumbnailUrl ? (
                      <Image
                        source={{ uri: video.thumbnailUrl }}
                        style={styles.ytThumbImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={[
                          styles.ytThumbPlaceholder,
                          { backgroundColor: isShort ? 'rgba(255, 0, 0, 0.15)' : 'rgba(59, 130, 246, 0.15)' },
                        ]}
                      >
                        <Ionicons
                          name={isShort ? 'flash' : 'play'}
                          size={20}
                          color={isShort ? '#ff0000' : '#3b82f6'}
                        />
                      </View>
                    )}
                    <View style={styles.ytDurationBadge}>
                      <Text style={styles.ytDurationText}>{video.duration || (isShort ? '0:50' : '10:00')}</Text>
                    </View>
                  </View>

                  {/* Video info */}
                  <View style={styles.ytVideoInfoCol}>
                    <View style={styles.ytVideoCategoryLine}>
                      <View
                        style={[
                          styles.ytCategoryTag,
                          {
                            backgroundColor: isShort
                              ? 'rgba(255, 0, 0, 0.12)'
                              : video.category === 'Playlists'
                                ? 'rgba(168, 85, 247, 0.12)'
                                : 'rgba(59, 130, 246, 0.12)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.ytCategoryTagText,
                            {
                              color: isShort
                                ? '#ff0000'
                                : video.category === 'Playlists'
                                  ? '#a855f7'
                                  : '#3b82f6',
                            },
                          ]}
                        >
                          {isShort ? '#Shorts' : video.category || 'Video'}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              video.status === 'public'
                                ? 'rgba(34, 197, 94, 0.14)'
                                : isScheduled
                                  ? 'rgba(59, 130, 246, 0.14)'
                                  : 'rgba(245, 158, 11, 0.14)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            {
                              color:
                                video.status === 'public'
                                  ? '#22c55e'
                                  : isScheduled
                                    ? '#3b82f6'
                                    : '#f59e0b',
                            },
                          ]}
                        >
                          {video.status === 'public' ? 'Public' : isScheduled ? 'Scheduled' : 'Unlisted'}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={[styles.ytVideoTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                      numberOfLines={2}
                    >
                      {video.title}
                    </Text>

                    {/* Metrics Row */}
                    <View style={styles.ytVideoMetaRow}>
                      <Text style={styles.ytVideoMeta}>
                        {isScheduled && video.scheduledFor
                          ? `⏰ Fires on ${new Date(video.scheduledFor).toLocaleDateString([], { month: 'short', day: 'numeric' })}`
                          : `${formattedViews} views • ${video.likes ? `${video.likes} likes` : ''}`}
                      </Text>
                      {video.publishedAt && !isScheduled && (
                        <Text style={styles.ytVideoDateText}>
                          {new Date(video.publishedAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* Actions Row */}
                <View style={styles.ytVideoActionsRow}>
                  {video.videoUrl ? (
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        Linking.openURL(video.videoUrl!);
                      }}
                      style={styles.ytWatchActionBtn}
                    >
                      <Ionicons name="logo-youtube" size={13} color="#ff0000" />
                      <Text style={styles.ytWatchActionBtnText}>Watch on YouTube</Text>
                    </Pressable>
                  ) : null}

                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      openSocialHandoff('upload-short');
                    }}
                    style={[styles.ytWatchActionBtn, { borderColor: 'rgba(59, 130, 246, 0.3)' }]}
                  >
                    <Ionicons name="create-outline" size={13} color="#3b82f6" />
                    <Text style={[styles.ytWatchActionBtnText, { color: '#3b82f6' }]}>
                      Composer
                    </Text>
                  </Pressable>
                </View>
              </View>
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
  ytSystemHealthCard: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  ytSystemHealthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  ytSystemHealthLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ytSystemHealthTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  ytOperationalBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ytOperationalBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  ytSystemHealthSub: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
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
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfoCol: {
    flex: 1,
    minWidth: 130,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '700',
  },
  profileStatus: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  ytChannelSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  ytReadyBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  ytReadyBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#16a34a',
  },
  linkAccBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignSelf: 'center',
  },
  linkAccBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ff0000',
  },
  igMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.1)',
  },
  igMetricBox: {
    flex: 1,
    minWidth: 80,
    alignItems: 'center',
    paddingVertical: 4,
  },
  igMetricNum: {
    fontSize: 16,
    fontWeight: '800',
  },
  igMetricLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    textAlign: 'center',
  },
  ytSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  ytVideosTotalText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inboxSearchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    gap: 6,
  },
  inboxSearchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  ytCategoryScrollView: {
    flexDirection: 'row',
  },
  ytCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
  },
  ytCategoryChipActive: {
    backgroundColor: '#ff0000',
  },
  ytCategoryChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ytCategoryCountPill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  ytCategoryCountText: {
    fontSize: 10,
    fontWeight: '800',
  },
  inboxEmptyBox: {
    paddingVertical: 28,
    alignItems: 'center',
    gap: 6,
  },
  inboxEmptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  inboxEmptyDesc: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  ytVideoListContainer: {
    gap: 12,
  },
  ytVideoCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    gap: 10,
  },
  ytVideoMainRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  ytThumbWrapper: {
    width: 90,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#00000015',
  },
  ytThumbImage: {
    width: '100%',
    height: '100%',
  },
  ytThumbPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ytDurationBadge: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  ytDurationText: {
    fontSize: 9,
    color: '#ffffff',
    fontWeight: '700',
  },
  ytVideoInfoCol: {
    flex: 1,
    gap: 4,
  },
  ytVideoCategoryLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  ytCategoryTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ytCategoryTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  ytVideoTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  ytVideoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 4,
  },
  ytVideoMeta: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  ytVideoDateText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  ytVideoActionsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.1)',
    paddingTop: 8,
  },
  ytWatchActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.25)',
  },
  ytWatchActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ff0000',
  },
});
