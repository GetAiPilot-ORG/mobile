import React from 'react';
import { Alert, Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ProductHeading, ProductMetrics, ProductSection, ProductActions, ProductRow, ProductButton, ProductEmpty, useProductPalette } from '@/components/ProductUI';
import { useTheme } from '@/theme';
import { SocialScreenSkeleton } from '@/components/skeletonScreen';
import { openSocialHandoff } from '../utils/socialHandoff';
import { filterAndNormalizeChannels } from './activity/socialActivityHelpers';

interface SocialOverviewTabProps {
  overviewLoading: boolean;
  overviewRefetching?: boolean;
  overviewError?: any;
  onRetryOverview?: () => void;
  overviewData: any;
  statsData?: any;
  entitlementsData?: any;
  plansData?: any;
  plansLoading?: boolean;
  onRetryPlans?: () => void;
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
  onOpenConnectModal: () => void;
  onNavigateToTab: (tab: 'overview' | 'trends' | 'inbox' | 'activity') => void;
  onSelectPost?: (post: any) => void;
  isLocked?: boolean;
}


export const SocialOverviewTab: React.FC<SocialOverviewTabProps> = ({
  overviewLoading, overviewError, onRetryOverview, overviewData, entitlementsData,
  connectedList, postsList, queueList, totalSentCount, totalScheduledCount,
  computedSuccessRate, selectedRange, onChangeRange, onOpenCreateModal,
  onOpenAccountsModal, onNavigateToTab, onSelectPost, isLocked = false,
}) => {
  const { isDark } = useTheme();
  const colors = useProductPalette();
  const router = useRouter();
  const plan = entitlementsData?.plan?.name || 'Free';
  const limits = entitlementsData?.limits || {};
  const channelLimit = limits.social_accounts ?? entitlementsData?.maxChannels ?? 3;
  const historyLimit = limits.history_days ?? 7;
  const subscription = entitlementsData?.subscription;
  const iconFor = (provider: string): React.ComponentProps<typeof Ionicons>['name'] => ({
    instagram: 'logo-instagram', facebook: 'logo-facebook', youtube: 'logo-youtube',
    linkedin: 'logo-linkedin', threads: 'at-circle', x: 'logo-twitter', twitter: 'logo-twitter',
    pinterest: 'logo-pinterest', reddit: 'logo-reddit',
  }[provider?.toLowerCase()] as React.ComponentProps<typeof Ionicons>['name']) || 'share-social-outline';
  const connect = () => {
    if (connectedList.length >= channelLimit) {
      Alert.alert('Channel limit reached', 'Your ' + plan + ' plan supports ' + channelLimit + ' channels.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'View plans', onPress: () => router.push('/products/social/plans' as any) },
      ]);
      return;
    }
    // onOpenConnectModal();
  };
  if (overviewLoading && !overviewData) return <SocialScreenSkeleton />;
  if (overviewError && !overviewData) return <ProductEmpty title="Couldn't load your workspace" description={overviewError.message || 'Check your connection and try again.'} action="Try again" onAction={onRetryOverview} />;
  const activity = (overviewData?.operations?.recentActivity?.length ? overviewData.operations.recentActivity : postsList).slice(0, 4);
  const instagram = connectedList.filter((account) => (account.provider || account.platform) === 'instagram');
  const growth = overviewData?.instagramGrowth;
  return <View>
    <ProductHeading title={"Your content,\nyour next chapter."} action="Create a post" isLocked={isLocked} onAction={onOpenCreateModal} />
    <ProductSection title="Your channels" action="Manage" onAction={onOpenAccountsModal}>
      {!connectedList.length ? <ProductEmpty title="Bring your channels together" description="Connect a social account to start publishing." action="Connect account" onAction={connect} /> :
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
          {connectedList.map((account, index) => <Pressable key={account.id || index} onPress={onOpenAccountsModal} accessibilityRole="button" accessibilityLabel={account.name || account.username || account.provider}
            style={{ width: 128, minHeight: 132, backgroundColor: index % 2 ? colors.lavender : colors.pink, borderRadius: 24, padding: 16, justifyContent: 'space-between', gap: 12 }}>
            {account.avatar ? <Image source={{ uri: account.avatar }} style={{ width: 40, height: 40, borderRadius: 20 }} /> : <Ionicons name={iconFor(account.provider || account.platform)} size={28} color={colors.text} />}
            <View style={{ gap: 4 }}><Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '500', color: colors.text }}>{account.name || account.username || account.provider}</Text><Text style={{ fontSize: 12, color: colors.textSecondary }}>{account.provider || account.platform}</Text></View>
          </Pressable>)}
          <Pressable onPress={connect} accessibilityRole="button" accessibilityLabel="Connect another account" style={{ width: 90, backgroundColor: colors.card, borderRadius: 24, alignItems: 'center', justifyContent: 'center', gap: 12 }}><Ionicons name="add" size={26} color={colors.accent} /><Text style={{ color: colors.textSecondary, fontSize: 12 }}>Connect</Text></Pressable>
        </ScrollView>}
    </ProductSection>
    <ProductSection title="At a glance">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
        {[7, 30, 90].map((days) => <Pressable key={days} onPress={() => {
          if (days > historyLimit) { Alert.alert('More history with an upgrade', 'Your current plan includes ' + historyLimit + ' days of history.', [{ text: 'Cancel', style: 'cancel' }, { text: 'View plans', onPress: () => router.push('/products/social/plans' as any) }]); return; }
          onChangeRange(days);
        }} accessibilityRole="button" accessibilityState={{ selected: days === selectedRange }} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 24, backgroundColor: days === selectedRange ? colors.lavender : colors.card }}><Text style={{ fontSize: 13, color: days === selectedRange ? colors.accent : colors.textSecondary }}>{days} days</Text></Pressable>)}
      </ScrollView>
      <ProductMetrics items={[{ label: 'Published', value: totalSentCount }, { label: 'Scheduled', value: totalScheduledCount }, { label: 'Success', value: computedSuccessRate }]} />
    </ProductSection>
    <ProductSection title="Your next post" onAction={() => onNavigateToTab('activity')}>
      {queueList.length ? queueList.slice(0, 3).map((post: any) => <ProductRow key={post.id} title={post.title || post.caption || post.content || 'Scheduled post'} detail={post.scheduled_at || post.scheduledAt ? new Date(post.scheduled_at || post.scheduledAt).toLocaleString() : 'In your publishing queue'} icon="calendar-outline" tone="peach" onPress={() => onNavigateToTab('activity')} />) :
        <ProductEmpty title="Make space for your next idea" action="Create a post" onAction={onOpenCreateModal} />}
    </ProductSection>
    <ProductSection title="Keep creating">
      <ProductActions items={[
        { title: 'Find inspiration', icon: 'sparkles-outline', tone: 'lavender', onPress: () => onNavigateToTab('trends') },
        { title: 'Your inbox', icon: 'chatbubbles-outline', tone: 'mint', onPress: () => onNavigateToTab('inbox') },
        { title: 'Automations', icon: 'flash-outline', tone: 'peach', onPress: () => onNavigateToTab('activity') },
      ]} />
    </ProductSection>
    {instagram.length > 0 && <ProductSection title="Instagram growth">
      {instagram.map((account) => <ProductRow key={account.id} title={account.username || account.name || 'Instagram'} detail={(account.followers ?? growth?.summary?.totalFollowers ?? 0).toLocaleString() + ' followers'} icon="logo-instagram" tone="pink" onPress={onOpenAccountsModal} />)}
      {(growth?.accounts || []).flatMap((account: any) => account.topMedia || []).slice(0, 3).map((media: any, index: number) => <ProductRow key={media.id || index} title={media.caption || 'Instagram post'} detail={(media.likes ?? 0) + ' likes · ' + (media.comments ?? 0) + ' comments'} icon="image-outline" tone="pink" onPress={media.permalink ? () => Linking.openURL(media.permalink) : undefined} />)}
    </ProductSection>}
    {/* SECTION: Recent Activity (Redesigned with Minimal Pastel Palette & Rich Post Cards) */}
    <ProductSection title="Recent activity" action="See all" onAction={() => onNavigateToTab('activity')}>
      {!activity.length ? (
        <ProductEmpty
          title="A fresh page"
          description="Your published posts and queued broadcasts will appear here."
          action="Create first post"
          onAction={onOpenCreateModal}
        />
      ) : (
        <View style={{ gap: 10 }}>
          {activity.map((post: any, index: number) => {
            const rawStatus = (post.status || 'published').toLowerCase();
            const isFailed = rawStatus === 'failed';
            const isScheduled = rawStatus === 'scheduled' || rawStatus === 'queued' || rawStatus === 'pending';
            const isSuccess = rawStatus === 'sent' || rawStatus === 'published' || rawStatus === 'completed' || rawStatus === 'success';

            // Minimal pastel tone for the card & badge
            const statusLabel = isSuccess ? 'Published' : isScheduled ? 'Scheduled' : isFailed ? 'Failed' : 'Pending';
            const statusBg = isSuccess
              ? colors.mint
              : isScheduled
              ? colors.lavender
              : isFailed
              ? '#FDE8E8'
              : colors.peach;
            const statusTextColor = isSuccess
              ? '#0F766E'
              : isScheduled
              ? colors.accent
              : isFailed
              ? '#DC2626'
              : '#B45309';

            const channels: string[] = filterAndNormalizeChannels(
              post.selected_channels?.length
                ? post.selected_channels
                : post.channels?.length
                ? post.channels
                : post.platform
                ? [post.platform]
                : []
            );

            const mediaThumb =
              post.thumbnail_url ||
              post.thumbnailUrl ||
              post.media_urls?.[0] ||
              post.mediaUrls?.[0] ||
              (post.media_type === 'image' ? post.media_url : null) ||
              post.media_url ||
              post.mediaUrl;

            const timeStr = post.scheduled_for || post.scheduledAt || post.posted_at || post.postedAt || post.created_at || post.createdAt;
            const formattedTime = timeStr
              ? new Date(timeStr).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : null;

            return (
              <Pressable
                key={post.id || index}
                onPress={() => {
                  if (onSelectPost) {
                    onSelectPost(post);
                  } else {
                    onNavigateToTab('activity');
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel={post.caption || post.title || 'Social post'}
                style={({ pressed }) => ({
                  backgroundColor: colors.card,
                  borderRadius: 22,
                  padding: 16,
                  gap: 12,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  opacity: pressed ? 0.8 : 1,
                  transform: [{ scale: pressed ? 0.99 : 1 }],
                })}
              >
                {/* Header: Platform Icons on Left, Status Pill on Right */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {channels.length > 0 ? (
                      channels.slice(0, 3).map((ch, chIdx) => {
                        const cleanCh = (ch || '').toLowerCase();
                        return (
                          <View
                            key={chIdx}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 14,
                              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Ionicons name={iconFor(cleanCh)} size={15} color={colors.text} />
                          </View>
                        );
                      })
                    ) : (
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: colors.lavender,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="share-social-outline" size={15} color={colors.accent} />
                      </View>
                    )}
                    {channels.length > 3 && (
                      <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary }}>
                        +{channels.length - 3}
                      </Text>
                    )}
                  </View>

                  {/* Status Pill */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: statusBg,
                      paddingHorizontal: 9,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 2.5,
                        backgroundColor: statusTextColor,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: statusTextColor,
                        textTransform: 'capitalize',
                      }}
                    >
                      {statusLabel}
                    </Text>
                  </View>
                </View>

                {/* Body: Caption + Media Preview */}
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  {mediaThumb ? (
                    <Image
                      source={{ uri: mediaThumb }}
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        backgroundColor: isDark ? '#201E2B' : '#F1EFF8',
                      }}
                      resizeMode="cover"
                    />
                  ) : null}
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text
                      numberOfLines={2}
                      style={{
                        fontSize: 14,
                        lineHeight: 20,
                        fontWeight: '500',
                        color: colors.text,
                      }}
                    >
                      {post.caption || post.title || post.content || 'Untitled broadcast'}
                    </Text>
                    {formattedTime && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                        <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                          {formattedTime}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.iconSecondary} />
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </ProductSection>
    <View style={{ backgroundColor: colors.pink, borderRadius: 26, padding: 22, gap: 16, marginBottom: 26 }}>
      <Text style={{ color: colors.text, fontSize: 21, fontWeight: '500' }}>{plan} workspace</Text>
      <Text style={{ fontSize: 13, lineHeight: 20, color: colors.textSecondary }}>{connectedList.length} / {channelLimit} channels · {queueList.length} / {limits.scheduled_queue ?? 10} queued posts</Text>
      {subscription?.current_period_end && <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Renews {new Date(subscription.current_period_end).toLocaleDateString()}</Text>}
      <ProductButton label="View plan" onPress={() => router.push('/products/social/plans' as any)} />
    </View>
  </View>;
};
