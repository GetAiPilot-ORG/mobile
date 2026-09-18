import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
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
import { SocialScreenSkeleton } from '../../../components/skeletonScreen';

interface SocialOverviewTabProps {
  overviewLoading: boolean;
  overviewError?: any;
  onRetryOverview?: () => void;
  overviewData: any;
  statsData?: any;
  entitlementsData?: any;
  connectedList: any[];
  postsList: any[];
  queueList: any[];
  totalSentCount: number;
  totalScheduledCount: number;
  computedSuccessRate: string;
  selectedRange: number;
  onChangeRange: (days: number) => void;
  onOpenCreateModal: () => void;
  onOpenAccountsModal: () => void;
  onNavigateToTab: (tab: 'overview' | 'trends' | 'inbox' | 'activity') => void;
}

const SUPPORTED_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: 'logo-instagram', color: '#e1306c' },
  { key: 'facebook', label: 'Facebook', icon: 'logo-facebook', color: '#1877f2' },
  { key: 'youtube', label: 'YouTube', icon: 'logo-youtube', color: '#ff0000' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'logo-linkedin', color: '#0a66c2' },
  { key: 'x', label: 'X (Twitter)', icon: 'logo-twitter', color: '#000000' },
  { key: 'threads', label: 'Threads', icon: 'at-circle', color: '#000000' },
  { key: 'reddit', label: 'Reddit', icon: 'logo-reddit', color: '#ff4500' },
  { key: 'pinterest', label: 'Pinterest', icon: 'logo-pinterest', color: '#e60023' },
];

export const SocialOverviewTab: React.FC<SocialOverviewTabProps> = ({
  overviewLoading,
  overviewError,
  onRetryOverview,
  overviewData,
  statsData,
  entitlementsData,
  connectedList,
  postsList,
  queueList,
  totalSentCount,
  totalScheduledCount,
  computedSuccessRate,
  selectedRange,
  onChangeRange,
  onOpenCreateModal,
  onOpenAccountsModal,
  onNavigateToTab,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const ops = overviewData?.operations || {};
  const automation = overviewData?.automation || {};
  const igGrowth = overviewData?.instagramGrowth || {};

  const [selectedIgAccountId, setSelectedIgAccountId] = useState<string | null>(null);
  const igAccountsList: any[] = useMemo(() => {
    const list: any[] = [];
    const seen = new Set<string>();
    (igGrowth?.accounts || []).forEach((a: any) => {
      if (a.id && !seen.has(a.id)) {
        seen.add(a.id);
        list.push(a);
      }
    });
    connectedList.forEach((c: any) => {
      const p = (c.provider || c.platform || '').toLowerCase();
      if (p === 'instagram' && c.id && !seen.has(c.id)) {
        seen.add(c.id);
        list.push({
          id: c.id,
          username: c.username,
          profilePicture: c.avatar || c.profilePicture,
          followers: c.followers ?? 0,
          mediaCount: c.mediaCount ?? 0,
          tokenStatus: c.status || 'active',
          topMedia: c.topMedia || [],
        });
      }
    });
    return list;
  }, [igGrowth?.accounts, connectedList]);

  const igAccount = useMemo(() => {
    if (selectedIgAccountId) {
      const found = igAccountsList.find((a: any) => a.id === selectedIgAccountId);
      if (found) return found;
    }
    return igAccountsList[0] || null;
  }, [igAccountsList, selectedIgAccountId]);

  const igSummary = igGrowth?.summary || {};
  const topMediaList = igAccount?.topMedia || [];

  const recentActivityList = (
    ops.recentActivity && ops.recentActivity.length > 0 ? ops.recentActivity : postsList
  ).slice(0, 6);

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

  // Compute Total Aggregate Audience across connected accounts and API data
  const totalAudienceCount = React.useMemo(() => {
    let count = 0;
    const igFollowers = overviewData?.instagramGrowth?.summary?.followers;
    if (igFollowers) {
      count += Number(igFollowers);
    }
    connectedList.forEach((acc) => {
      const followers =
        acc.followerCount ||
        acc.followers ||
        acc.raw?.followers_count ||
        acc.raw?.fans_count ||
        acc.raw?.subscriberCount ||
        acc.raw?.followers ||
        0;
      count += Number(followers) || 0;
    });
    if (count === 0) {
      count = statsData?.totalReach || overviewData?.stats?.totalReach || 9;
    }
    return count;
  }, [connectedList, statsData, overviewData]);

  // Compute Platform Distribution from posts history
  const platformStats = React.useMemo(() => {
    const distribution: Record<string, number> = {};
    const sourceList = ops.recentActivity && ops.recentActivity.length > 0 ? ops.recentActivity : postsList;

    sourceList.forEach((post: any) => {
      const channels: string[] = post.channels || post.selected_channels || ['social'];
      channels.forEach((ch) => {
        const clean = ch.replace(/^.+:/, '').replace(/:.+$/, '').toLowerCase();
        distribution[clean] = (distribution[clean] || 0) + 1;
      });
    });

    const totalTracked = Object.values(distribution).reduce((a, b) => a + b, 0) || 1;
    const sorted = Object.entries(distribution)
      .map(([platform, count]) => ({
        platform,
        count,
        percent: Math.round((count / totalTracked) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    return sorted;
  }, [postsList, ops.recentActivity]);

  const nextScheduledPost = queueList.length > 0 ? queueList[0] : ops.nextScheduled;
  const maxChannelsAllowed = entitlementsData?.maxChannels || 10;
  const planName = entitlementsData?.planName || entitlementsData?.plan?.name || 'GAP Pro Multi-Channel';

  if (overviewLoading && !overviewData) {
    return <SocialScreenSkeleton />;
  }

  if (overviewError && !overviewData) {
    return (
      <View style={[styles.errorCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={[styles.errorTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
          Social Telemetry Unavailable
        </Text>
        <Text style={[styles.errorSub, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          {overviewError?.message || 'Unable to load live overview metrics. Please check network or try again.'}
        </Text>
        {onRetryOverview && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onRetryOverview();
            }}
            style={styles.retryBtn}
          >
            <Ionicons name="refresh" size={16} color="#ffffff" />
            <Text style={styles.retryBtnText}>Retry Connection</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 1. Header Card with Time Range Selector */}
      <View style={[styles.headerCard, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.headerTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                Social Command Hub
              </Text>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveBadgeText}>LIVE API</Text>
              </View>
            </View>
            <Text style={[styles.headerSub, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              {connectedList.length > 0
                ? `${connectedList.length} connected channel${connectedList.length === 1 ? '' : 's'} linked & telemetry active`
                : 'Connect social accounts to broadcast multi-channel'}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              () => Alert.alert('New Post', 'This feature will be available soon');
            }}
            style={styles.actionBtn}
          >
            <Ionicons name="add" size={16} color="#ffffff" />
            <Text style={styles.actionBtnText}>New Post</Text>
          </Pressable>
        </View>

        {/* Range Pill Selector */}
        <View style={styles.rangeRow}>
          <Text style={[styles.rangeLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Period:</Text>
          {[7, 30, 90].map((days) => {
            const isActive = selectedRange === days;
            return (
              <Pressable
                key={days}
                onPress={() => onChangeRange(days)}
                style={[
                  styles.rangePill,
                  {
                    backgroundColor: isActive
                      ? '#ec4899'
                      : isDark
                        ? '#1e293b'
                        : '#f1f5f9',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.rangePillText,
                    { color: isActive ? '#ffffff' : isDark ? '#cbd5e1' : '#475569' },
                  ]}
                >
                  Last {days}d
                </Text>
              </Pressable>
            );
          })}
        </View>

        {overviewError && (
          <View style={[styles.errorBanner, { backgroundColor: isDark ? '#451a03' : '#fef3c7' }]}>
            <Ionicons name="warning-outline" size={14} color="#f59e0b" />
            <Text style={[styles.errorBannerText, { color: isDark ? '#fbbf24' : '#92400e' }]} numberOfLines={1}>
              Sync issue: {overviewError?.message || 'Using cached telemetry'}
            </Text>
            {onRetryOverview && (
              <Pressable onPress={onRetryOverview} hitSlop={8}>
                <Text style={styles.errorBannerAction}>Retry</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* 2. Top Connected Social Media Accounts (Story / Chips Carousel ON THE TOP) */}
      <View style={[styles.topConnectedSection, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>
        <View style={styles.topConnectedHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="share-social" size={16} color="#ec4899" />
            <Text style={[styles.topConnectedTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
              Connected Channels ({connectedList.length})
            </Text>
          </View>
          <Pressable onPress={onOpenAccountsModal} style={styles.topManageLink}>
            <Text style={styles.topManageLinkText}>Manage</Text>
            <Ionicons name="chevron-forward" size={12} color="#ec4899" />
          </Pressable>
        </View>
      </View>

      {/* 3. Core Telemetry 4-Card Grid */}
      <View style={styles.metricsGrid}>
        <View style={[styles.metricCard, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>
          <View style={styles.metricCardHeader}>
            <Ionicons name="send" size={16} color="#22c55e" />
            <Text style={styles.metricCardTag}>Sent</Text>
          </View>
          <Text style={[styles.metricNum, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
            {ops.sent != null ? ops.sent : totalSentCount}
          </Text>
          <Text style={styles.metricLabel}>
            Published {ops.totalPostsDelta != null && `(${ops.totalPostsDelta >= 0 ? '+' : ''}${ops.totalPostsDelta}Δ)`}
          </Text>
        </View>

        <Pressable
          onPress={() => onNavigateToTab('activity')}
          style={[styles.metricCard, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}
        >
          <View style={styles.metricCardHeader}>
            <Ionicons name="time" size={16} color="#3b82f6" />
            <Text style={[styles.metricCardTag, { color: '#3b82f6' }]}>Queue</Text>
          </View>
          <Text style={[styles.metricNum, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
            {ops.queueCount != null ? ops.queueCount : totalScheduledCount}
          </Text>
          <Text style={styles.metricLabel}>Pending Queue</Text>
        </Pressable>

        <View style={[styles.metricCard, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>
          <View style={styles.metricCardHeader}>
            <Ionicons name="checkmark-done-circle" size={16} color="#ec4899" />
            <Text style={[styles.metricCardTag, { color: '#ec4899' }]}>Health</Text>
          </View>
          <Text style={[styles.metricNum, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
            {ops.successRate != null ? `${ops.successRate}%` : computedSuccessRate}
          </Text>
          <Text style={styles.metricLabel}>Delivery Rate</Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>
          <View style={styles.metricCardHeader}>
            <Ionicons name="people" size={16} color="#8b5cf6" />
            <Text style={[styles.metricCardTag, { color: '#8b5cf6' }]}>Audience</Text>
          </View>
          <Text style={[styles.metricNum, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
            {totalAudienceCount}
          </Text>
          <Text style={styles.metricLabel}>Total Followers</Text>
        </View>
      </View>

      {/* 3. GAP Automation Telemetry Section (From API: instapilot + autodm) */}
      {(automation.instapilot || automation.autodm) && (
        <View style={[styles.sectionCard, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="flash" size={18} color="#3b82f6" />
              <Text style={[styles.sectionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                GAP Automation Telemetry
              </Text>
            </View>
            <View style={[styles.planBadge, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Text style={[styles.planBadgeText, { color: '#3b82f6' }]}>ACTIVE</Text>
            </View>
          </View>

          <View style={styles.automationCardsGrid}>
            {/* Instapilot Subcard */}
            {automation.instapilot && (
              <View
                style={[
                  styles.automationSubCard,
                  { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: isDark ? '#334155' : '#e2e8f0' },
                ]}
              >
                <View style={styles.automationCardTop}>
                  <Ionicons name="logo-instagram" size={16} color="#e1306c" />
                  <Text style={[styles.automationCardTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                    Instapilot
                  </Text>
                </View>
                <View style={styles.autoMetricsList}>
                  <View style={styles.autoMetricRow}>
                    <Text style={[styles.autoMetricLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                      Conversations
                    </Text>
                    <Text style={[styles.autoMetricVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      {automation.instapilot.totalConversations ?? 0}
                    </Text>
                  </View>
                  <View style={styles.autoMetricRow}>
                    <Text style={[styles.autoMetricLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                      Bot Replies
                    </Text>
                    <Text style={[styles.autoMetricVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      {automation.instapilot.botReplies ?? 0}
                    </Text>
                  </View>
                  <View style={styles.autoMetricRow}>
                    <Text style={[styles.autoMetricLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                      Leads Captured
                    </Text>
                    <Text style={[styles.autoMetricVal, { color: '#22c55e' }]}>
                      {automation.instapilot.leadsCaptured ?? 0}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* AutoDM Subcard */}
            {automation.autodm && (
              <View
                style={[
                  styles.automationSubCard,
                  { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: isDark ? '#334155' : '#e2e8f0' },
                ]}
              >
                <View style={styles.automationCardTop}>
                  <Ionicons name="chatbubble-ellipses" size={16} color="#3b82f6" />
                  <Text style={[styles.automationCardTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                    AutoDM
                  </Text>
                </View>
                <View style={styles.autoMetricsList}>
                  <View style={styles.autoMetricRow}>
                    <Text style={[styles.autoMetricLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                      DMs Sent
                    </Text>
                    <Text style={[styles.autoMetricVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      {automation.autodm.messagesSent ?? 0}
                    </Text>
                  </View>
                  <View style={styles.autoMetricRow}>
                    <Text style={[styles.autoMetricLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                      DMs Seen
                    </Text>
                    <Text style={[styles.autoMetricVal, { color: '#3b82f6' }]}>
                      {automation.autodm.messagesSeen ?? 0}
                    </Text>
                  </View>
                  <View style={styles.autoMetricRow}>
                    <Text style={[styles.autoMetricLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                      Followers Gained
                    </Text>
                    <Text style={[styles.autoMetricVal, { color: '#22c55e' }]}>
                      +{automation.autodm.followersGained ?? 0}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* 4. Instagram Growth & Top Performing Media (From API: instagramGrowth) */}
      {igAccount && (
        <View style={[styles.sectionCard, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="logo-instagram" size={18} color="#e1306c" />
              <Text style={[styles.sectionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                Instagram Growth Hub (@{igAccount.username})
              </Text>
            </View>
            <View style={styles.statusLivePill}>
              <View style={styles.liveDot} />
              <Text style={styles.statusLiveText}>
                {igAccount.tokenStatus === 'disconnected' ? 'Linked' : 'Synced'}
              </Text>
            </View>
          </View>

          {/* Profile Switcher Chips (when multiple Instagram accounts linked) */}
          {igAccountsList.length > 1 && (
            <View style={styles.igSwitcherBar}>
              <Text style={[styles.igSwitcherLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                Select Profile:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {igAccountsList.map((acc: any) => {
                  const isSelected = igAccount?.id === acc.id;
                  return (
                    <Pressable
                      key={acc.id}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedIgAccountId(acc.id);
                      }}
                      style={[
                        styles.igSwitcherChip,
                        {
                          backgroundColor: isSelected
                            ? '#e1306c'
                            : isDark
                              ? '#1e293b'
                              : '#f1f5f9',
                          borderColor: isSelected ? '#e1306c' : isDark ? '#334155' : '#cbd5e1',
                        },
                      ]}
                    >
                      {acc.profilePicture ? (
                        <Image source={{ uri: acc.profilePicture }} style={styles.igSwitcherAvatar} />
                      ) : (
                        <Ionicons name="logo-instagram" size={12} color={isSelected ? '#ffffff' : '#e1306c'} />
                      )}
                      <Text
                        style={[
                          styles.igSwitcherChipText,
                          { color: isSelected ? '#ffffff' : isDark ? '#f8fafc' : '#0f172a' },
                        ]}
                      >
                        @{acc.username || 'Account'} ({acc.followers ?? 0})
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={12} color="#ffffff" />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* IG Stats Row */}
          <View style={styles.igStatsRow}>
            <View style={styles.igStatItem}>
              <Text style={[styles.igStatNum, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                {igAccount.followers ?? igSummary.followers ?? 0}
              </Text>
              <Text style={styles.igStatLabel}>Followers</Text>
            </View>
            <View style={styles.igStatItem}>
              <Text style={[styles.igStatNum, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                {igAccount.mediaCount ?? 0}
              </Text>
              <Text style={styles.igStatLabel}>Total Posts</Text>
            </View>
            <View style={styles.igStatItem}>
              <Text style={[styles.igStatNum, { color: '#22c55e' }]}>
                {topMediaList.reduce((acc: number, m: any) => acc + (m.engagement || 0), 0)}
              </Text>
              <Text style={styles.igStatLabel}>Top Engagement</Text>
            </View>
          </View>

          {/* Top Performing Media Cards */}
          {topMediaList.length > 0 && (
            <View style={{ marginTop: 14 }}>
              <Text style={[styles.subSectionTitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                Top Performing Posts (from API)
              </Text>
              <View style={styles.topMediaList}>
                {topMediaList.map((media: any) => (
                  <Pressable
                    key={media.id}
                    onPress={() => {
                      if (media.permalink) Linking.openURL(media.permalink).catch(() => { });
                    }}
                    style={[
                      styles.topMediaCard,
                      { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: isDark ? '#334155' : '#e2e8f0' },
                    ]}
                  >
                    {media.mediaUrl && (
                      <Image source={{ uri: media.mediaUrl }} style={styles.topMediaThumb} />
                    )}
                    <View style={{ flex: 1, paddingHorizontal: 10 }}>
                      <Text
                        style={[styles.topMediaCaption, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                        numberOfLines={2}
                      >
                        {media.caption || 'Instagram Post'}
                      </Text>
                      <View style={styles.topMediaStatsRow}>
                        <Text style={styles.topMediaStatText}>❤️ {media.likes ?? 0}</Text>
                        <Text style={styles.topMediaStatText}>💬 {media.comments ?? 0}</Text>
                        <Text style={[styles.topMediaStatText, { color: '#ec4899', fontWeight: '800' }]}>
                          ⚡ {media.engagement ?? 0} Eng
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="open-outline" size={16} color="#ec4899" />
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* 5. Workspace Quota & Entitlements Card */}
      <View style={[styles.sectionCard, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name="shield-checkmark" size={18} color="#ec4899" />
            <Text style={[styles.sectionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
              Workspace Quota & Plan
            </Text>
          </View>
          <View style={[styles.planBadge, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
            <Text style={styles.planBadgeText}>{planName.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.quotaRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.quotaLabelRow}>
              <Text style={[styles.quotaTitle, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                Channels Connected
              </Text>
              <Text style={[styles.quotaVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                {connectedList.length} / {maxChannelsAllowed} Max
              </Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(100, Math.round((connectedList.length / maxChannelsAllowed) * 100))}%`,
                    backgroundColor: '#ec4899',
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      {/* 6. Next Scheduled Broadcast Spotlight (if pending queue exists) */}
      {nextScheduledPost && (
        <Pressable
          onPress={() => onNavigateToTab('activity')}
          style={[
            styles.spotlightCard,
            {
              backgroundColor: isDark ? '#1e1b4b' : '#eff6ff',
              borderColor: isDark ? '#312e81' : '#bfdbfe',
            },
          ]}
        >
          <View style={styles.spotlightHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="alarm" size={16} color="#3b82f6" />
              <Text style={[styles.spotlightTitle, { color: isDark ? '#93c5fd' : '#1d4ed8' }]}>
                Next Scheduled Broadcast
              </Text>
            </View>
            <View style={styles.countdownBadge}>
              <Text style={styles.countdownBadgeText}>
                {new Date(nextScheduledPost.scheduled_for || nextScheduledPost.scheduledFor).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
          <Text
            style={[styles.spotlightCaption, { color: isDark ? '#f8fafc' : '#1e293b' }]}
            numberOfLines={2}
          >
            {nextScheduledPost.caption}
          </Text>
          <View style={styles.spotlightFooter}>
            <Text style={styles.spotlightDate}>
              📅 {new Date(nextScheduledPost.scheduled_for || nextScheduledPost.scheduledFor).toLocaleDateString()}
            </Text>
            <Text style={styles.spotlightActionText}>View in Queue →</Text>
          </View>
        </Pressable>
      )}

      {/* 7. Connected Social Media Accounts (From API: accounts + overviewData) */}
      <View style={[styles.sectionCard, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>


        {connectedList.length > 0 ? (
          <View style={styles.accountsGrid}>
            {connectedList.map((acc: any, idx: number) => {
              const provider = acc.provider || acc.platform || 'channel';
              const name = acc.username || acc.name || acc.channelTitle || provider;
              const avatarUrl = acc.profilePicture || acc.profile_picture_url || acc.avatar;
              const tokenExpiry = acc.tokenExpiry || acc.tokenExpiresAt || acc.raw?.tokenExpiry;
              const followers = acc.followers || acc.followerCount || acc.raw?.followers;

              return (
                <View
                  key={acc.id || idx}
                  style={[
                    styles.accountDetailCard,
                    {
                      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                    },
                  ]}
                >
                  <View style={styles.accountTopRow}>
                    {avatarUrl ? (
                      <Image source={{ uri: avatarUrl }} style={styles.accountAvatar} />
                    ) : (
                      <View
                        style={[
                          styles.accountAvatarPlaceholder,
                          { backgroundColor: `${getPlatformColor(provider)}15` },
                        ]}
                      >
                        <Ionicons
                          name={getPlatformIconName(provider) as any}
                          size={18}
                          color={getPlatformColor(provider)}
                        />
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text
                        style={[styles.accountName, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                        numberOfLines={1}
                      >
                        {name}
                      </Text>
                      <Text style={styles.accountProvider}>
                        {provider.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.statusLivePill}>
                      <View style={styles.liveDot} />
                      <Text style={styles.statusLiveText}>Active</Text>
                    </View>
                  </View>

                  <View style={styles.accountFollowersRow}>
                    <Text style={[styles.followersCount, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                      {followers != null ? `👥 ${Number(followers).toLocaleString()} Followers` : 'Ready to Broadcast'}
                    </Text>
                    {tokenExpiry && (
                      <Text style={styles.tokenExpiryText}>
                        Expires: {new Date(tokenExpiry).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyInlineWrap}>
            <Ionicons name="link-outline" size={24} color={isDark ? '#475569' : '#94a3b8'} />
            <Text style={[styles.emptyInlineText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              No channels connected yet. Tap Manage to link Instagram, Facebook, YouTube, or LinkedIn.
            </Text>
          </View>
        )}

        {/* Quick App Connection Status Grid */}
        <Text style={[styles.subSectionTitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          Channel Availability & Setup
        </Text>
        <View style={styles.platformsOverviewGrid}>
          {SUPPORTED_PLATFORMS.map((plat) => {
            const isConnected = connectedList.some(
              (a) => (a.provider || a.platform || '').toLowerCase() === plat.key
            );
            return (
              <Pressable
                key={plat.key}
                onPress={onOpenAccountsModal}
                style={[
                  styles.platformStatusItem,
                  {
                    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                    borderColor: isConnected ? '#22c55e' : isDark ? '#334155' : '#e2e8f0',
                  },
                ]}
              >
                <Ionicons name={plat.icon as any} size={16} color={plat.color} />
                <Text
                  style={[
                    styles.platformStatusLabel,
                    { color: isDark ? '#f8fafc' : '#0f172a' },
                  ]}
                  numberOfLines={1}
                >
                  asdasda {plat.label}
                </Text>
                <View
                  style={[
                    styles.statusTag,
                    {
                      backgroundColor: isConnected
                        ? 'rgba(34, 197, 94, 0.15)'
                        : isDark
                          ? '#334155'
                          : '#e2e8f0',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusTagText,
                      { color: isConnected ? '#22c55e' : isDark ? '#94a3b8' : '#64748b' },
                    ]}
                  >
                    {isConnected ? 'Linked' : 'Add'}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  headerCard: {
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    gap: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#22c55e',
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
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
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rangeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  rangePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  rangePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  metricCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricCardTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  metricNum: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 6,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  sectionCard: {
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    fontWeight: '700',
  },
  planBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ec4899',
  },
  automationCardsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  automationSubCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  automationCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  automationCardTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  autoMetricsList: {
    gap: 4,
  },
  autoMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  autoMetricLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  autoMetricVal: {
    fontSize: 12,
    fontWeight: '800',
  },
  igStatsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.1)',
  },
  igStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  igStatNum: {
    fontSize: 18,
    fontWeight: '800',
  },
  igStatLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  topMediaList: {
    gap: 10,
  },
  topMediaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  topMediaThumb: {
    width: 46,
    height: 46,
    borderRadius: 6,
    backgroundColor: '#cbd5e1',
  },
  topMediaCaption: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  topMediaStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  topMediaStatText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  quotaRow: {
    marginTop: 4,
  },
  quotaLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  quotaTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  quotaVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  spotlightCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  spotlightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spotlightTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  countdownBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  countdownBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3b82f6',
  },
  spotlightCaption: {
    fontSize: 13,
    lineHeight: 18,
  },
  spotlightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  spotlightDate: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  spotlightActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3b82f6',
  },
  manageLink: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  manageLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ec4899',
  },
  accountsGrid: {
    gap: 10,
    marginBottom: 14,
  },
  accountDetailCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  accountTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  accountAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountName: {
    fontSize: 14,
    fontWeight: '700',
  },
  accountProvider: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700',
    marginTop: 1,
  },
  statusLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  statusLiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#22c55e',
  },
  accountFollowersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.1)',
  },
  followersCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  tokenExpiryText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  subSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  platformsOverviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  platformStatusItem: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  platformStatusLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyInlineWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  emptyInlineText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  distributionList: {
    gap: 10,
  },
  distItem: {
    gap: 4,
  },
  distLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  distPlatformName: {
    fontSize: 12,
    fontWeight: '700',
  },
  distCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  postItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  recentThumb: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#cbd5e1',
  },
  postChannelsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  chTagPill: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ec4899',
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    textTransform: 'uppercase',
  },
  postCaption: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  postMeta: {
    fontSize: 11,
    color: '#94a3b8',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  shortcutsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  shortcutBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  shortcutBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  errorCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  errorSub: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ec4899',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  errorBannerAction: {
    fontSize: 12,
    fontWeight: '700',
    color: '#d97706',
    textDecorationLine: 'underline',
  },
  topConnectedSection: {
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  topConnectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topConnectedTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  topManageLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  topManageLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ec4899',
  },
  topConnectedScroll: {
    gap: 10,
    paddingVertical: 2,
  },
  topAccountChipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  topAccountAvatarWrap: {
    position: 'relative',
  },
  topAccountAvatarImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  topAccountAvatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topAccountProviderBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  topAccountLiveDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  topAccountName: {
    fontSize: 13,
    fontWeight: '700',
  },
  topAccountHandle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  topAccountFollowers: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
  },
  topAddAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  topAddCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topAddText: {
    fontSize: 12,
    fontWeight: '700',
  },
  topEmptyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  topEmptyText: {
    fontSize: 12,
    flex: 1,
  },
  igSwitcherBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  igSwitcherLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  igSwitcherChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  igSwitcherAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  igSwitcherChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
