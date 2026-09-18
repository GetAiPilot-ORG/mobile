import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { apiClient } from '../../../../core/api/client';
import {
  AutoDMAccount,
  AutoDMAutomationItem,
  AutoDMContactItem,
  AutoDMDailyMetric,
  AutoDMInstagramMediaItem,
  AutoDMRule,
  AutoDMSubCategory,
} from '../../types';
import { AutoDMAutomationsView } from './autodm/AutoDMAutomationsView';
import { AutoDMContactsView } from './autodm/AutoDMContactsView';
import { AutoDMMediaPreviewModal } from './autodm/AutoDMMediaPreviewModal';
import { AutoDMProfileView } from './autodm/AutoDMProfileView';

export interface ActivityAutoDMSubTabProps {
  connectedAccounts?: any[];
}

export const ActivityAutoDMSubTab: React.FC<ActivityAutoDMSubTabProps> = ({
  connectedAccounts = [],
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const queryClient = useQueryClient();

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [autodmCategory, setAutodmCategory] = useState<AutoDMSubCategory>('automations');

  // 1. AutoDM Status & Accounts Query
  const {
    data: autodmStatusData,
    isLoading: autodmStatusLoading,
    refetch: refetchAutoDMStatus,
  } = useQuery({
    queryKey: ['social', 'autodm', 'status'],
    queryFn: async () => {
      const res = await apiClient.get<{
        success: boolean;
        autodmAccounts?: AutoDMAccount[];
        hasSocialInstagramConnection?: boolean;
        socialInstagram?: any;
      }>('/mobile/v1/social/autodm/status');
      return res;
    },
  });

  // Consolidate all available Instagram accounts
  const availableAccounts: AutoDMAccount[] = useMemo(() => {
    const map = new Map<string, AutoDMAccount>();

    // Add all accounts from autodmStatusData
    (autodmStatusData?.autodmAccounts || []).forEach((acc) => {
      if (acc.id) {
        map.set(acc.id, acc);
      }
    });

    // Merge and enrich with connectedAccounts
    (connectedAccounts || []).forEach((c) => {
      const provider = (c.provider || c.platform || '').toLowerCase();
      if (provider === 'instagram' && c.id) {
        if (!map.has(c.id)) {
          map.set(c.id, {
            id: c.id,
            user_id: c.raw?.user_id || '',
            page_id: c.raw?.page_id || c.raw?.instagram_business_id || c.id,
            instagram_business_account_id: c.raw?.instagram_business_id || c.raw?.instagram_business_account_id || '',
            instagram_username: c.username || c.raw?.username || '',
            username: c.username || c.raw?.username || '',
            full_name: c.name || c.account_name || c.username || '',
            profile_picture_url: c.avatar || c.profilePicture || c.raw?.profilePicture || '',
            webhook_status: c.raw?.webhook_status || 'active',
            token_status: c.raw?.token_status || 'active',
            is_connected: c.connected !== false,
            followers_count: c.followers ?? c.followers_count ?? 0,
            media_count: c.mediaCount ?? c.media_count ?? 0,
          } as AutoDMAccount);
        } else {
          const existing = map.get(c.id)!;
          if (!existing.profile_picture_url && (c.avatar || c.profilePicture)) {
            existing.profile_picture_url = c.avatar || c.profilePicture;
          }
          if (c.followers != null && !existing.followers_count) {
            existing.followers_count = c.followers;
          }
          if (c.mediaCount != null && !existing.media_count) {
            existing.media_count = c.mediaCount;
          }
        }
      }
    });

    return Array.from(map.values());
  }, [autodmStatusData?.autodmAccounts, connectedAccounts]);

  const activeAutoDMAccount = useMemo(() => {
    if (selectedAccountId) {
      const found = availableAccounts.find((a) => a.id === selectedAccountId);
      if (found) return found;
    }
    return availableAccounts[0] || null;
  }, [availableAccounts, selectedAccountId]);

  const activeInstagramAccountId = activeAutoDMAccount?.id;

  // 2. AutoDM Daily Metrics Query
  const {
    data: autodmMetricsData,
    isLoading: autodmMetricsLoading,
    refetch: refetchAutoDMMetrics,
  } = useQuery({
    queryKey: ['social', 'autodm', 'metrics', activeInstagramAccountId],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; metrics?: AutoDMDailyMetric[] }>(
        '/mobile/v1/social/autodm/daily-metrics',
        { params: activeInstagramAccountId ? { instagramAccountId: activeInstagramAccountId } : {} }
      );
      return res?.metrics || [];
    },
  });

  // 3. AutoDM Automations List Query
  const {
    data: dynamicAutomations = [],
    isLoading: autodmAutomationsLoading,
    refetch: refetchAutoDMAutomations,
  } = useQuery({
    queryKey: ['social', 'autodm', 'automations', activeInstagramAccountId],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; automations?: AutoDMAutomationItem[] }>(
        '/mobile/v1/social/autodm/automations',
        { params: activeInstagramAccountId ? { instagramAccountId: activeInstagramAccountId } : {} }
      );
      return Array.isArray(res?.automations) ? res.automations : [];
    },
  });

  // 4. AutoDM Contacts Query
  const {
    data: dynamicContacts = [],
    isLoading: autodmContactsLoading,
    refetch: refetchAutoDMContacts,
  } = useQuery({
    queryKey: ['social', 'autodm', 'contacts', activeInstagramAccountId],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; contacts?: AutoDMContactItem[] }>(
        '/mobile/v1/social/autodm/contacts',
        { params: activeInstagramAccountId ? { instagramAccountId: activeInstagramAccountId } : {} }
      );
      return Array.isArray(res?.contacts) ? res.contacts : [];
    },
  });

  // 5. AutoDM Profile & Media Query
  const {
    data: autodmMediaData,
    isLoading: autodmMediaLoading,
    refetch: refetchAutoDMMedia,
  } = useQuery({
    queryKey: ['social', 'autodm', 'media', activeInstagramAccountId],
    queryFn: async () => {
      const res = await apiClient.get<{
        success: boolean;
        media?: AutoDMInstagramMediaItem[];
        account?: AutoDMAccount;
      }>('/mobile/v1/social/autodm/instagram-media', {
        params: activeInstagramAccountId ? { instagramAccountId: activeInstagramAccountId } : {},
      });
      return {
        media: Array.isArray(res?.media) ? res.media : [],
        account: res?.account || null,
      };
    },
  });

  const instagramMediaList = autodmMediaData?.media || [];
  const profileAccount = useMemo(() => {
    const upstreamAcc = autodmMediaData?.account;
    if (upstreamAcc && upstreamAcc.id === activeInstagramAccountId) {
      return upstreamAcc;
    }
    return activeAutoDMAccount || undefined;
  }, [autodmMediaData?.account, activeAutoDMAccount, activeInstagramAccountId]);

  // Mutations
  const toggleAutomationMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      return apiClient.patch<{ success: boolean; automation?: AutoDMAutomationItem }>(
        `/mobile/v1/social/autodm/automations/${id}`,
        { is_active }
      );
    },
    onMutate: async ({ id, is_active }) => {
      await queryClient.cancelQueries({ queryKey: ['social', 'autodm', 'automations', activeInstagramAccountId] });
      const previous = queryClient.getQueryData<AutoDMAutomationItem[]>([
        'social',
        'autodm',
        'automations',
        activeInstagramAccountId,
      ]);
      queryClient.setQueryData<AutoDMAutomationItem[]>(
        ['social', 'autodm', 'automations', activeInstagramAccountId],
        (old = []) => old.map((a) => (a.id === id ? { ...a, is_active } : a))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ['social', 'autodm', 'automations', activeInstagramAccountId],
          context.previous
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['social', 'autodm', 'automations', activeInstagramAccountId] });
    },
  });

  const createAutomationMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.post<{ success: boolean; automation?: AutoDMAutomationItem }>(
        '/mobile/v1/social/autodm/automations',
        payload
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social', 'autodm', 'automations', activeInstagramAccountId] });

      setNewRuleName('');
      setNewRuleKeyword('');
      setNewRuleReply('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const deleteAutomationMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete<{ success: boolean }>(`/mobile/v1/social/autodm/automations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social', 'autodm', 'automations', activeInstagramAccountId] });
    },
  });

  // Modals & Rule Form State
  const [selectedMediaPost, setSelectedMediaPost] = useState<AutoDMInstagramMediaItem | null>(null);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleKeyword, setNewRuleKeyword] = useState('');
  const [newRuleReply, setNewRuleReply] = useState('');
  const [newRuleChannel, setNewRuleChannel] = useState<'instagram' | 'facebook' | 'all'>('instagram');

  // Fallback in-memory rules if dynamic list is empty
  const [autoDMRules, setAutoDMRules] = useState<AutoDMRule[]>([]);

  const handleToggleRule = (id: string, currentActive?: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const dynamicMatch = dynamicAutomations.find((a) => a.id === id);
    if (dynamicMatch) {
      toggleAutomationMutation.mutate({
        id,
        is_active: currentActive !== undefined ? !currentActive : !dynamicMatch.is_active,
      });
    } else {
      setAutoDMRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
      );
    }
  };

  const handleCreateRule = () => {
    if (!newRuleKeyword.trim() || !newRuleReply.trim()) {
      Alert.alert('Missing Details', 'Please specify both a trigger keyword and reply message.');
      return;
    }
    createAutomationMutation.mutate({
      name: newRuleName.trim() || `AutoDM for #${newRuleKeyword.trim().toUpperCase()}`,
      keyword: newRuleKeyword.trim().toUpperCase(),
      keywords: [newRuleKeyword.trim().toUpperCase()],
      comment_reply_text: `Thanks! Sent the link to your DMs 🔥`,
      reply_text: newRuleReply.trim(),
      channel: newRuleChannel,
      instagram_account_id: activeInstagramAccountId,
      is_active: true,
    });
  };

  const handleDeleteRule = (id: string) => {
    Alert.alert('Delete Automation', 'Are you sure you want to delete this AutoDM automation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteAutomationMutation.mutate(id);
        },
      },
    ]);
  };

  const handleTriggerAutoDMForMedia = (media: AutoDMInstagramMediaItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const isVideo = media.media_type === 'VIDEO';
    setNewRuleName(`AutoDM for ${isVideo ? 'Reel' : 'Post'}`);
    const hashtagMatch = media.caption?.match(/#(\w+)/);
    setNewRuleKeyword(hashtagMatch ? hashtagMatch[1].toUpperCase() : 'INFO');
    setNewRuleReply(
      `Hey! Thanks for commenting on our ${isVideo ? 'reel' : 'post'}. Here is your access link: https://getaipilot.in 🔥`
    );
    setSelectedMediaPost(null);
  };

  const handleExportContacts = async (contactsToExport: AutoDMContactItem[]) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (!contactsToExport || contactsToExport.length === 0) {
        Alert.alert('No Contacts', 'There are no contacts available to export.');
        return;
      }

      const headers = [
        'Contact ID',
        'Instagram Username',
        'Full Name',
        'Followers',
        'Follows You',
        'You Follow',
        'Total DMs Sent',
        'Total Messages Received',
        'First Interaction',
        'Last Interaction',
        'CRM Sync Status',
        'Canonical CRM ID',
      ];

      const escapeCsvCell = (val: any) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const rows = contactsToExport.map((c) =>
        [
          escapeCsvCell(c.id),
          escapeCsvCell(c.username),
          escapeCsvCell(c.full_name || ''),
          escapeCsvCell(c.follower_count ?? 0),
          escapeCsvCell(c.is_following_you ? 'Yes' : 'No'),
          escapeCsvCell(c.you_are_following ? 'Yes' : 'No'),
          escapeCsvCell(c.total_messages_sent ?? 0),
          escapeCsvCell(c.total_messages_received ?? 0),
          escapeCsvCell(c.first_interaction_at || ''),
          escapeCsvCell(c.last_interaction_at || ''),
          escapeCsvCell(c.ecosystem_sync_status || 'synced'),
          escapeCsvCell(c.canonical_contact_id || ''),
        ].join(',')
      );

      const csvContent = [headers.join(','), ...rows].join('\n');

      await Share.share({
        title: `AutoDM_Contacts_${new Date().toISOString().slice(0, 10)}.csv`,
        message: csvContent,
      });
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        Alert.alert('Export Notice', error?.message || 'Could not export contacts.');
      }
    }
  };

  // Computed aggregated metrics
  const computedAutoDMMetrics = useMemo(() => {
    let sent = 0;
    let seen = 0;
    let clicks = 0;
    let leads = 0;
    let followers = 0;

    const list = Array.isArray(autodmMetricsData) ? autodmMetricsData : [];
    list.forEach((m: AutoDMDailyMetric) => {
      sent += Number(m.messages_sent || 0);
      seen += Number(m.messages_seen || 0);
      clicks += Number(m.total_clicks || 0);
      leads += Number(m.leads_captured || 0);
      followers += Number(m.followers_gained || 0);
    });

    return { sent, seen, clicks, leads, followers };
  }, [autodmMetricsData]);

  return (
    <View style={styles.subContent}>
      {/* Header Action Row */}
      <View style={styles.headerActionRow}>
        <View style={styles.headerTextCol}>
          <Text style={[styles.subTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
            Gap AutoDM
          </Text>
          <Text style={[styles.subDesc, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            Automated Instagram comment-to-DM triggers & lead captures
          </Text>
        </View>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
          style={[styles.primaryActionBtn, { backgroundColor: '#3b82f6' }]}
        >
          <Ionicons name="add" size={16} color="#ffffff" />
          <Text style={styles.primaryActionBtnText}>New Automation</Text>
        </Pressable>
      </View>

      {/* 1. ALL CONNECTED INSTAGRAM ACCOUNTS ON TOP (Account Switcher) */}
      <View style={styles.topAccountsSection}>
        <View style={styles.topAccountsHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="logo-instagram" size={17} color="#e1306c" />
            <Text style={[styles.topAccountsTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
              Connected Profiles ({availableAccounts.length})
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topAccountsScroll}
        >
          {availableAccounts.map((acc) => {
            const isSelected = activeAutoDMAccount?.id === acc.id;
            const avatarUrl = acc.profile_picture_url;
            const displayName = acc.full_name || acc.page_name || acc.username || 'Instagram';
            const handle = acc.username ? `@${acc.username}` : '';
            const followers = acc.followers_count ?? 0;
            const posts = acc.media_count ?? 0;

            return (
              <Pressable
                key={acc.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setSelectedAccountId(acc.id);
                }}
                style={[
                  styles.accountCardItem,
                  {
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isSelected ? '#e1306c' : isDark ? '#1e293b' : '#e2e8f0',
                  },
                  isSelected && styles.accountCardItemSelected,
                ]}
              >
                <View style={styles.accountCardHeader}>
                  <View style={styles.accountAvatarWrapper}>
                    {avatarUrl ? (
                      <Image source={{ uri: avatarUrl }} style={styles.accountAvatarImg} />
                    ) : (
                      <View style={[styles.accountAvatarFallback, { backgroundColor: 'rgba(225, 48, 108, 0.15)' }]}>
                        <Ionicons name="logo-instagram" size={18} color="#e1306c" />
                      </View>
                    )}
                    <View style={styles.accountOnlineDot} />
                  </View>

                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text
                      style={[
                        styles.accountCardName,
                        { color: isDark ? '#f8fafc' : '#0f172a' },
                        isSelected && { fontWeight: '700' },
                      ]}
                      numberOfLines={1}
                    >
                      {displayName}
                    </Text>
                    {handle ? (
                      <Text style={styles.accountCardHandle} numberOfLines={1}>
                        {handle}
                      </Text>
                    ) : null}
                  </View>

                  {isSelected && (
                    <View style={styles.selectedCheckBadge}>
                      <Ionicons name="checkmark-circle" size={18} color="#e1306c" />
                    </View>
                  )}
                </View>

                <View style={styles.accountCardStatsRow}>
                  <Text style={[styles.accountCardStatText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    👥 {followers} followers
                  </Text>
                  <Text style={[styles.accountCardStatText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    📸 {posts} posts
                  </Text>
                </View>

                <View style={styles.accountCardFooter}>
                  <View style={styles.accountStatusPill}>
                    <View style={styles.accountStatusGreenDot} />
                    <Text style={styles.accountStatusPillText}>
                      {acc.webhook_status === 'active' ? 'Webhook Live' : 'Connected'}
                    </Text>
                  </View>
                  {isSelected && (
                    <Text style={styles.activeViewingLabel}>Active Target</Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Active Account Quick Focus Bar */}
      {activeAutoDMAccount && (
        <View
          style={[
            styles.autodmAccountCard,
            {
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              borderColor: isDark ? '#1e293b' : '#e2e8f0',
            },
          ]}
        >
          <View style={styles.autodmAccountRow}>
            {activeAutoDMAccount?.profile_picture_url ? (
              <Image
                source={{ uri: activeAutoDMAccount.profile_picture_url }}
                style={styles.autodmAvatarImg}
              />
            ) : (
              <View style={[styles.autodmAvatarFallback, { backgroundColor: 'rgba(225, 48, 108, 0.15)' }]}>
                <Ionicons name="logo-instagram" size={20} color="#e1306c" />
              </View>
            )}

            <View style={{ flex: 1 }}>
              <View style={styles.autodmAccountTitleRow}>
                <Text style={[styles.autodmAccountName, { color: isDark ? '#f8fafc' : '#0f172a' }]} numberOfLines={1}>
                  {activeAutoDMAccount?.full_name || activeAutoDMAccount?.username || 'Instagram Account'}
                </Text>
                <View style={styles.autodmWebhookBadge}>
                  <View style={styles.autodmGreenDot} />
                  <Text style={styles.autodmWebhookText}>
                    {activeAutoDMAccount?.webhook_status === 'active' ? 'Webhook Active' : 'Connected'}
                  </Text>
                </View>
              </View>

              <Text style={styles.autodmAccountHandle}>
                @{activeAutoDMAccount?.username || '--'} • {activeAutoDMAccount?.followers_count ?? 0} followers • {activeAutoDMAccount?.media_count ?? 0} posts
              </Text>
            </View>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                refetchAutoDMStatus();
                refetchAutoDMMetrics();
                refetchAutoDMAutomations();
                refetchAutoDMMedia();
                refetchAutoDMContacts();
              }}
              style={[styles.autodmRefreshBtn, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
            >
              <Ionicons
                name={autodmStatusLoading || autodmMetricsLoading || autodmMediaLoading ? 'sync' : 'refresh'}
                size={15}
                color={isDark ? '#cbd5e1' : '#475569'}
              />
            </Pressable>
          </View>
        </View>
      )}

      {/* 2. Daily Performance Telemetry Grid */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            borderColor: isDark ? '#1e293b' : '#e2e8f0',
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="analytics" size={15} color="#3b82f6" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#f8fafc' : '#0f172a' }}>
              AutoDM Telemetry (Last 7 Days)
            </Text>
          </View>
          {autodmMetricsLoading && (
            <Ionicons name="sync" size={13} color="#3b82f6" />
          )}
        </View>

        <View style={styles.igMetricsGrid}>
          <View style={styles.igMetricBox}>
            <Text style={[styles.igMetricNum, { color: '#3b82f6' }]}>
              {computedAutoDMMetrics.sent}
            </Text>
            <Text style={styles.igMetricLabel}>DMs Sent</Text>
          </View>
          <View style={styles.igMetricBox}>
            <Text style={[styles.igMetricNum, { color: '#10b981' }]}>
              {computedAutoDMMetrics.sent > 0
                ? `${Math.round((computedAutoDMMetrics.seen / computedAutoDMMetrics.sent) * 100)}%`
                : '0%'}
            </Text>
            <Text style={styles.igMetricLabel}>Open Rate</Text>
          </View>
          <View style={styles.igMetricBox}>
            <Text style={[styles.igMetricNum, { color: '#f59e0b' }]}>
              {dynamicContacts.length}
            </Text>
            <Text style={styles.igMetricLabel}>Leads Captured</Text>
          </View>
          <View style={styles.igMetricBox}>
            <Text style={[styles.igMetricNum, { color: '#ec4899' }]}>
              {computedAutoDMMetrics.clicks}
            </Text>
            <Text style={styles.igMetricLabel}>Total Clicks</Text>
          </View>
        </View>
      </View>

      {/* 3. AutoDM Category Navigation Tabs */}
      <View style={styles.autodmCategoryBar}>
        {(['automations', 'contacts', 'profile'] as const).map((cat) => {
          const isSelected = autodmCategory === cat;
          const label = cat === 'automations' ? 'Automations' : cat === 'contacts' ? 'Contacts' : 'Profile';
          const iconName = cat === 'automations' ? 'flash' : cat === 'contacts' ? 'people' : 'person-circle';
          const badgeCount =
            cat === 'automations'
              ? dynamicAutomations.length || autoDMRules.length
              : cat === 'contacts'
                ? dynamicContacts.length
                : profileAccount?.media_count ?? instagramMediaList.length;

          return (
            <Pressable
              key={cat}
              onPress={() => {
                Haptics.selectionAsync();
                setAutodmCategory(cat);
              }}
              style={[
                styles.autodmCategoryTab,
                isSelected
                  ? [styles.autodmCategoryTabActive, { backgroundColor: '#3b82f6' }]
                  : { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
              ]}
            >
              <Ionicons
                name={iconName as any}
                size={14}
                color={isSelected ? '#ffffff' : isDark ? '#94a3b8' : '#64748b'}
              />
              <Text
                style={[
                  styles.autodmCategoryTabText,
                  { color: isSelected ? '#ffffff' : isDark ? '#cbd5e1' : '#64748b' },
                ]}
              >
                {label}
              </Text>
              {badgeCount !== undefined && (
                <View
                  style={[
                    styles.autodmCategoryCountBadge,
                    {
                      backgroundColor: isSelected
                        ? 'rgba(255, 255, 255, 0.25)'
                        : isDark
                          ? 'rgba(148, 163, 184, 0.2)'
                          : 'rgba(59, 130, 246, 0.12)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.autodmCategoryCountText,
                      { color: isSelected ? '#ffffff' : '#3b82f6' },
                    ]}
                  >
                    {badgeCount}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* 4. Subviews based on active category */}
      {autodmCategory === 'automations' && (
        <AutoDMAutomationsView
          dynamicAutomations={dynamicAutomations}
          isLoading={autodmAutomationsLoading}
          activeAutoDMAccount={activeAutoDMAccount}
          onToggleRule={handleToggleRule}
          onDeleteRule={handleDeleteRule}
        />
      )}

      {autodmCategory === 'contacts' && (
        <AutoDMContactsView
          dynamicContacts={dynamicContacts}
          isLoading={autodmContactsLoading}
          onExportContacts={handleExportContacts}
          onRefreshContacts={refetchAutoDMContacts}
        />
      )}

      {autodmCategory === 'profile' && (
        <AutoDMProfileView
          profileAccount={profileAccount}
          allAccounts={availableAccounts}
          onSelectAccount={setSelectedAccountId}
          instagramMediaList={instagramMediaList}
          automationsCount={dynamicAutomations.length || autoDMRules.length}
          contactsCount={dynamicContacts.length}
          isLoadingMedia={autodmMediaLoading}
          onRefreshProfile={() => {
            refetchAutoDMMedia();
            refetchAutoDMStatus();
          }}
          onSelectMediaPost={setSelectedMediaPost}
          onTriggerAutoDM={handleTriggerAutoDMForMedia}
        />
      )}

      {/* Selected Media Post Detail Modal */}
      <AutoDMMediaPreviewModal
        visible={selectedMediaPost !== null}
        media={selectedMediaPost}
        onClose={() => setSelectedMediaPost(null)}
        onTriggerAutoDM={handleTriggerAutoDMForMedia}
      />
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
  autodmAccountCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  autodmAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  autodmAvatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#e1306c',
  },
  autodmAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autodmAccountTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  autodmAccountName: {
    fontSize: 15,
    fontWeight: '700',
  },
  autodmWebhookBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
  },
  autodmGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  autodmWebhookText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16a34a',
  },
  autodmAccountHandle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '500',
  },
  autodmRefreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  igMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  autodmCategoryBar: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  autodmCategoryTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  autodmCategoryTabActive: {
    backgroundColor: '#3b82f6',
  },
  autodmCategoryTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  autodmCategoryCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  autodmCategoryCountText: {
    fontSize: 10,
    fontWeight: '800',
  },
  topAccountsSection: {
    gap: 10,
    marginBottom: 4,
  },
  topAccountsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  topAccountsTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  manageAccountsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  manageAccountsBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  topAccountsScroll: {
    gap: 12,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  accountCardItem: {
    width: 220,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  accountCardItemSelected: {
    borderWidth: 2,
    borderColor: '#e1306c',
  },
  accountCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountAvatarWrapper: {
    position: 'relative',
  },
  accountAvatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e1306c',
  },
  accountAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  accountCardName: {
    fontSize: 14,
    fontWeight: '600',
  },
  accountCardHandle: {
    fontSize: 11,
    color: '#e1306c',
    fontWeight: '600',
    marginTop: 1,
  },
  selectedCheckBadge: {
    marginLeft: 4,
  },
  accountCardStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.15)',
  },
  accountCardStatText: {
    fontSize: 11,
    fontWeight: '600',
  },
  accountCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accountStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  accountStatusGreenDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#22c55e',
  },
  accountStatusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16a34a',
  },
  activeViewingLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#e1306c',
    textTransform: 'uppercase',
  },
  addAccountCard: {
    width: 140,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  addAccountCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAccountText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
});
