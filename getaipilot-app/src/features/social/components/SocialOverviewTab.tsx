import React from 'react';
import { Alert, Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ProductHeading, ProductMetrics, ProductSection, ProductActions, ProductRow, ProductButton, ProductEmpty, useProductPalette } from '@/components/ProductUI';
import { SocialScreenSkeleton } from '@/components/skeletonScreen';
import { openSocialHandoff } from '../utils/socialHandoff';

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
  isLocked?: boolean;
}


export const SocialOverviewTab: React.FC<SocialOverviewTabProps> = ({
  overviewLoading, overviewError, onRetryOverview, overviewData, entitlementsData,
  connectedList, postsList, queueList, totalSentCount, totalScheduledCount,
  computedSuccessRate, selectedRange, onChangeRange, onOpenCreateModal,
  onOpenAccountsModal, onNavigateToTab, isLocked = false,
}) => {
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
    <ProductSection title="Recent activity" onAction={() => onNavigateToTab('activity')}>
      {activity.length ? activity.map((post: any, index: number) => <ProductRow key={post.id || index} title={post.title || post.caption || post.content || 'Social post'} detail={post.status || 'View details'} icon="document-text-outline" onPress={() => onNavigateToTab('activity')} />) : <ProductEmpty title="A fresh page" description="Your published posts will appear here." />}
    </ProductSection>
    <View style={{ backgroundColor: colors.pink, borderRadius: 26, padding: 22, gap: 16, marginBottom: 26 }}>
      <Text style={{ color: colors.text, fontSize: 21, fontWeight: '500' }}>{plan} workspace</Text>
      <Text style={{ fontSize: 13, lineHeight: 20, color: colors.textSecondary }}>{connectedList.length} / {channelLimit} channels · {queueList.length} / {limits.scheduled_queue ?? 10} queued posts</Text>
      {subscription?.current_period_end && <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Renews {new Date(subscription.current_period_end).toLocaleDateString()}</Text>}
      <ProductButton label="View plan" onPress={() => router.push('/products/social/plans' as any)} />
    </View>
  </View>;
};
