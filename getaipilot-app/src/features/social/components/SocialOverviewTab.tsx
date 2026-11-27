import React from 'react';
import { Alert, Image, Linking, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
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

const getProviderMeta = (provider: string) => {
  const p = (provider || '').toLowerCase();
  if (p.includes('instagram')) return { icon: 'logo-instagram' as const, color: '#EC4899', label: 'Instagram' };
  if (p.includes('threads')) return { icon: 'at-circle' as const, color: '#1C1A25', label: 'Threads' };
  if (p.includes('youtube')) return { icon: 'logo-youtube' as const, color: '#EF4444', label: 'YouTube' };
  if (p.includes('facebook')) return { icon: 'logo-facebook' as const, color: '#1877F2', label: 'Facebook' };
  if (p.includes('twitter') || p.includes('x')) return { icon: 'logo-twitter' as const, color: '#1DA1F2', label: 'X' };
  if (p.includes('linkedin')) return { icon: 'logo-linkedin' as const, color: '#0A66C2', label: 'LinkedIn' };
  if (p.includes('pinterest')) return { icon: 'logo-pinterest' as const, color: '#E60023', label: 'Pinterest' };
  if (p.includes('reddit')) return { icon: 'logo-reddit' as const, color: '#FF4500', label: 'Reddit' };
  return { icon: 'share-social-outline' as const, color: '#6366F1', label: provider || 'Channel' };
};

const ChannelAvatar: React.FC<{ account: any; isDark: boolean }> = ({ account, isDark }) => {
  const [imgFailed, setImgFailed] = React.useState(false);
  const avatarUri = account.avatar || account.profilePicture || account.profile_picture_url || account.thumbnailUrl;
  const meta = getProviderMeta(account.provider || account.platform);

  return (
    <View
      style={{
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.85)',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.9)',
      }}
    >
      {avatarUri && !imgFailed ? (
        <Image
          source={{ uri: avatarUri }}
          onError={() => setImgFailed(true)}
          style={{ width: 38, height: 38, borderRadius: 19 }}
          resizeMode="cover"
        />
      ) : (
        <Ionicons
          name={meta.icon}
          size={21}
          color={isDark && meta.icon === 'at-circle' ? '#F3F4F6' : meta.color}
        />
      )}
    </View>
  );
};

const ChannelCard: React.FC<{
  account: any;
  toneBg: string;
  isDark: boolean;
  textColor: string;
  textSecondaryColor: string;
  width?: number | string;
  flex?: number;
  onPress: () => void;
}> = ({ account, toneBg, isDark, textColor, textSecondaryColor, width, flex, onPress }) => {
  const meta = getProviderMeta(account.provider || account.platform);
  const displayName = account.name || account.username || meta.label;
  const displayPlatform = account.provider || account.platform || meta.label;

  return (
    <Pressable
      cssInterop={false}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${displayName}, ${displayPlatform}`}
      style={({ pressed }) => ({
        flex: flex,
        width: width,
        minWidth: 0,
        opacity: pressed ? 0.82 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <View
        style={{
          width: '100%',
          minHeight: 128,
          backgroundColor: toneBg,
          borderRadius: 22,
          padding: 14,
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <ChannelAvatar account={account} isDark={isDark} />
        <View style={{ gap: 2 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: textColor,
              letterSpacing: -0.2,
            }}
          >
            {displayName}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 11,
              color: textSecondaryColor,
              textTransform: 'capitalize',
            }}
          >
            {displayPlatform}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const ConnectCard: React.FC<{
  onPress: () => void;
  cardBg: string;
  borderSubtle: string;
  textSecondary: string;
  accentColor: string;
  width?: number | string;
  flex?: number;
}> = ({ onPress, cardBg, borderSubtle, textSecondary, accentColor, width, flex }) => {
  return (
    <Pressable
      cssInterop={false}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Connect another account"
      style={({ pressed }) => ({
        flex: flex,
        width: width,
        minWidth: 0,
        opacity: pressed ? 0.82 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <View
        style={{
          width: '100%',
          minHeight: 128,
          backgroundColor: cardBg,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: borderSubtle,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: 14,
        }}
      >
        <Ionicons name="add" size={24} color={accentColor} />
        <Text style={{ color: textSecondary, fontSize: 12, fontWeight: '500' }}>Connect</Text>
      </View>
    </Pressable>
  );
};

export const SocialOverviewTab: React.FC<SocialOverviewTabProps> = ({
  overviewLoading, overviewError, onRetryOverview, overviewData, entitlementsData,
  connectedList, postsList, queueList, totalSentCount, totalScheduledCount,
  computedSuccessRate, selectedRange, onChangeRange, onOpenCreateModal,
  onOpenAccountsModal, onNavigateToTab, onSelectPost, isLocked = false,
}) => {
  const { isDark } = useTheme();
  const colors = useProductPalette();
  const { width, fontScale } = useWindowDimensions();
  const router = useRouter();
  const tones = [colors.pink, colors.lavender, colors.mint, colors.peach];
  const isCompact = connectedList.length <= 3 && width >= 340 && fontScale <= 1.2;
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
  const hasPartialWorkspaceData = connectedList.length > 0 || postsList.length > 0 || queueList.length > 0;
  if (overviewError && !overviewData && !hasPartialWorkspaceData) {
    return (
      <ProductEmpty
        title="Couldn't load your workspace"
        description={overviewError.message || 'Check your connection and try again.'}
        action="Try again"
        onAction={onRetryOverview}
      />
    );
  }
  const activity = (overviewData?.operations?.recentActivity?.length ? overviewData.operations.recentActivity : postsList).slice(0, 4);
  const instagram = connectedList.filter((account) => (account.provider || account.platform) === 'instagram');
  const growth = overviewData?.instagramGrowth;
  return <View>
    {overviewError && !overviewData && hasPartialWorkspaceData ? (
      <View
        style={{
          marginBottom: 14,
          padding: 12,
          borderRadius: 14,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>
            Live overview metrics unavailable
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary }} numberOfLines={2}>
            {overviewError.message || 'Check your connection and try again.'}
          </Text>
        </View>
        <Pressable
          cssInterop={false}
          onPress={onRetryOverview}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 999,
            backgroundColor: colors.accent,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>Retry</Text>
        </Pressable>
      </View>
    ) : null}
    <ProductHeading title={"Your content,\nyour next chapter."} action="Create a post" isLocked={isLocked} onAction={onOpenCreateModal} />
    <ProductSection title="Your channels" action="Manage" onAction={onOpenAccountsModal}>
      {!connectedList.length ? (
        <ProductEmpty
          title="Bring your channels together"
          description="Connect a social account to start publishing."
          action="Connect account"
          onAction={connect}
        />
      ) : isCompact ? (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {connectedList.map((account, index) => (
            <ChannelCard
              key={account.id || index}
              account={account}
              toneBg={tones[index % tones.length]}
              isDark={isDark}
              textColor={colors.text}
              textSecondaryColor={colors.textSecondary}
              flex={1}
              onPress={onOpenAccountsModal}
            />
          ))}
          {connectedList.length === 1 && connectedList.length < channelLimit && (
            <ConnectCard
              onPress={connect}
              cardBg={colors.card}
              borderSubtle={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
              textSecondary={colors.textSecondary}
              accentColor={colors.accent}
              flex={1}
            />
          )}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -20 }}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingBottom: 4 }}
        >
          {connectedList.map((account, index) => (
            <ChannelCard
              key={account.id || index}
              account={account}
              toneBg={tones[index % tones.length]}
              isDark={isDark}
              textColor={colors.text}
              textSecondaryColor={colors.textSecondary}
              width={136}
              onPress={onOpenAccountsModal}
            />
          ))}
          {connectedList.length < channelLimit && (
            <ConnectCard
              onPress={connect}
              cardBg={colors.card}
              borderSubtle={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
              textSecondary={colors.textSecondary}
              accentColor={colors.accent}
              width={90}
            />
          )}
        </ScrollView>
      )}
    </ProductSection>
    <ProductSection title="At a glance">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
        {[7, 30, 90].map((days) => <Pressable cssInterop={false} key={days} onPress={() => {
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
                cssInterop={false}
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
