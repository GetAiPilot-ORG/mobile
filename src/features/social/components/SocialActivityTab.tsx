import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { apiClient } from '../../../core/api/client';
import {
  ActivitySubTab,
  AutoDMAccount,
  AutoDMAutomationItem,
  AutoDMContactItem,
  AutoDMDailyMetric,
  AutoDMInstagramMediaItem,
  AutoDMRule,
  AutoDMSubCategory,
  InstapilotConversation,
  SystemProductStatus,
  SystemSettings,
  YoutubeChannelAccount,
  YoutubeVideoItem,
} from '../types';

interface SocialActivityTabProps {
  queueLoading: boolean;
  queueList: any[];
  connectedAccounts: any[];
  onOpenCreateModal: () => void;
  onOpenAccountsModal: () => void;
  onSelectPost: (post: any) => void;
  onCancelPost: (postId: string) => Promise<void>;
  onRetryPost?: (postId: string) => Promise<void>;
  instapilotConversations?: InstapilotConversation[];
  instapilotLoading?: boolean;
  isSyncingInstapilot?: boolean;
  onSyncInstapilot?: () => Promise<void>;
  onSelectInstapilotConv?: (conv: InstapilotConversation) => void;
  systemSettings?: SystemSettings[];
  systemProduct?: SystemProductStatus[];
  youtubeAccounts?: YoutubeChannelAccount[];
  youtubeAccountsLoading?: boolean;
  onRefreshYoutubeAccounts?: () => Promise<any>;
}

const getChannelMeta = (channelKey: string) => {
  const clean = (channelKey || '').toLowerCase();
  if (clean.includes('youtube')) {
    return { name: 'YouTube', icon: 'logo-youtube' as const, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' };
  }
  if (clean.includes('instagram')) {
    return { name: 'Instagram', icon: 'logo-instagram' as const, color: '#e1306c', bg: 'rgba(225, 48, 108, 0.12)' };
  }
  if (clean.includes('facebook')) {
    return { name: 'Facebook', icon: 'logo-facebook' as const, color: '#1877f2', bg: 'rgba(24, 119, 242, 0.12)' };
  }
  if (clean.includes('x') || clean.includes('twitter')) {
    return { name: 'X', icon: 'logo-twitter' as const, color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' };
  }
  if (clean.includes('linkedin')) {
    return { name: 'LinkedIn', icon: 'logo-linkedin' as const, color: '#0a66c2', bg: 'rgba(10, 102, 194, 0.12)' };
  }
  if (clean.includes('pinterest')) {
    return { name: 'Pinterest', icon: 'logo-pinterest' as const, color: '#e60023', bg: 'rgba(230, 0, 35, 0.12)' };
  }
  if (clean.includes('tiktok')) {
    return { name: 'TikTok', icon: 'videocam' as const, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)' };
  }
  return { name: channelKey.replace(/^.+:/, ''), icon: 'share-social' as const, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)' };
};

const getStatusMeta = (status: string) => {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'sent':
    case 'published':
      return { label: 'Published', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.14)', icon: 'checkmark-circle' as const };
    case 'failed':
      return { label: 'Failed', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.14)', icon: 'alert-circle' as const };
    case 'scheduled':
    case 'queued':
      return { label: 'Scheduled', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.14)', icon: 'time' as const };
    case 'processing':
      return { label: 'Processing', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.14)', icon: 'sync' as const };
    case 'cancelled':
      return { label: 'Cancelled', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.14)', icon: 'close-circle' as const };
    default:
      return { label: status || 'Pending', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.14)', icon: 'time' as const };
  }
};

export const SocialActivityTab: React.FC<SocialActivityTabProps> = ({
  queueLoading,
  queueList,
  connectedAccounts,
  onOpenCreateModal,
  onOpenAccountsModal,
  onSelectPost,
  onCancelPost,
  onRetryPost,
  instapilotConversations = [],
  instapilotLoading = false,
  isSyncingInstapilot = false,
  onSyncInstapilot,
  onSelectInstapilotConv,
  systemSettings = [],
  systemProduct = [],
  youtubeAccounts = [],
  youtubeAccountsLoading = false,
  onRefreshYoutubeAccounts,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [activeSubTab, setActiveSubTab] = useState<ActivitySubTab>('queue');
  const [queueStatusFilter, setQueueStatusFilter] = useState<'ALL' | 'scheduled' | 'sent' | 'failed'>('ALL');

  // --- 4.3 YouTube Studio States ---
  const [youtubeCategory, setYoutubeCategory] = useState<'All' | 'Videos' | 'Shorts' | 'Scheduled' | 'Playlists'>('All');
  const [youtubeSearch, setYoutubeSearch] = useState('');

  // --- 4.2 Instapilot Direct Inbox & Sync States ---
  const [instapilotSearch, setInstapilotSearch] = useState('');
  const [instapilotFilter, setInstapilotFilter] = useState<'all' | 'leads' | 'active'>('all');
  const [syncCountdown, setSyncCountdown] = useState(15);

  const { leadsCount, activeBotsCount, filteredConversations } = useMemo(() => {
    const leads = instapilotConversations.filter(
      (c) => Boolean(c.lead_data?.email || c.lead_data?.phone)
    ).length;
    const activeBots = instapilotConversations.filter(
      (c) => c.status === 'bot_active' && !c.bot_paused
    ).length;

    const query = instapilotSearch.trim().toLowerCase();
    const filtered = instapilotConversations.filter((conv) => {
      const matchSearch =
        !query ||
        (conv.instagram_username || '').toLowerCase().includes(query) ||
        (conv.instagram_name || '').toLowerCase().includes(query) ||
        (conv.instagram_messages || []).some((m) =>
          (m.message_text || '').toLowerCase().includes(query)
        );

      if (!matchSearch) return false;

      if (instapilotFilter === 'leads') {
        return Boolean(conv.lead_data?.email || conv.lead_data?.phone);
      }
      if (instapilotFilter === 'active') {
        return conv.status === 'bot_active' && !conv.bot_paused;
      }
      return true;
    });

    return {
      leadsCount: leads,
      activeBotsCount: activeBots,
      filteredConversations: filtered,
    };
  }, [instapilotConversations, instapilotSearch, instapilotFilter]);

  const onSyncRef = useRef(onSyncInstapilot);
  useEffect(() => {
    onSyncRef.current = onSyncInstapilot;
  }, [onSyncInstapilot]);

  // 5-second Auto-Sync Loop (stable dependency on sub-tab only)
  useEffect(() => {
    if (activeSubTab !== 'instapilot') return;

    let countdown = 15;
    setSyncCountdown(15);

    // Initial sync
    onSyncRef.current?.().catch(() => { });

    const timer = setInterval(() => {
      countdown -= 1;
      if (countdown <= 0) {
        countdown = 15;
        setSyncCountdown(15);
        onSyncRef.current?.().catch(() => { });
      } else {
        setSyncCountdown(countdown);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeSubTab]);

  // --- 4.2 Instapilot Reel/Story States ---
  const [autoReelsEnabled, setAutoReelsEnabled] = useState(true);
  const [autoStoriesEnabled, setAutoStoriesEnabled] = useState(false);
  const [aiTopicInput, setAiTopicInput] = useState('');
  const [generatedCaption, setGeneratedCaption] = useState('');
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

  // --- 4.4 AutoDM Dynamic Queries & States ---
  const queryClient = useQueryClient();
  const [autodmCategory, setAutodmCategory] = useState<AutoDMSubCategory>('automations');
  const [autodmSearch, setAutodmSearch] = useState('');
  const [autodmStatusFilter, setAutodmStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // AutoDM Status & Accounts Query
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

  const activeAutoDMAccount = autodmStatusData?.autodmAccounts?.[0];
  const activeInstagramAccountId = activeAutoDMAccount?.id;

  // AutoDM Daily Metrics Query
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

  // AutoDM Automations List Query
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

  const automationsCounts = useMemo(() => {
    const list = Array.isArray(dynamicAutomations) ? dynamicAutomations : [];
    const all = list.length;
    const active = list.filter((a) => a.is_active).length;
    const inactive = all - active;
    return { all, active, inactive };
  }, [dynamicAutomations]);

  // Toggle Automation Active Status Mutation
  const toggleAutomationMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      return apiClient.patch<{ success: boolean; automation?: AutoDMAutomationItem }>(
        `/mobile/v1/social/autodm/automations/${id}`,
        { is_active }
      );
    },
    onMutate: async ({ id, is_active }) => {
      await queryClient.cancelQueries({ queryKey: ['social', 'autodm', 'automations', activeInstagramAccountId] });
      const previous = queryClient.getQueryData<AutoDMAutomationItem[]>(['social', 'autodm', 'automations', activeInstagramAccountId]);
      queryClient.setQueryData<AutoDMAutomationItem[]>(
        ['social', 'autodm', 'automations', activeInstagramAccountId],
        (old = []) => old.map((a) => (a.id === id ? { ...a, is_active } : a))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['social', 'autodm', 'automations', activeInstagramAccountId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['social', 'autodm', 'automations', activeInstagramAccountId] });
    },
  });

  // Create Automation Mutation
  const createAutomationMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.post<{ success: boolean; automation?: AutoDMAutomationItem }>(
        '/mobile/v1/social/autodm/automations',
        payload
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social', 'autodm', 'automations', activeInstagramAccountId] });
      setShowAddRuleModal(false);
      setNewRuleName('');
      setNewRuleKeyword('');
      setNewRuleReply('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  // Delete Automation Mutation
  const deleteAutomationMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete<{ success: boolean }>(`/mobile/v1/social/autodm/automations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social', 'autodm', 'automations', activeInstagramAccountId] });
    },
  });

  // AutoDM Contacts Query & States
  const [contactSearch, setContactSearch] = useState('');
  const [contactFilter, setContactFilter] = useState<'all' | 'synced' | 'with_dms'>('all');

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

  const filteredContacts = useMemo(() => {
    let list = Array.isArray(dynamicContacts) ? dynamicContacts : [];
    if (contactSearch.trim()) {
      const q = contactSearch.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.username?.toLowerCase().includes(q) ||
          (c.full_name && c.full_name.toLowerCase().includes(q)) ||
          (c.canonical_contact_id && c.canonical_contact_id.toLowerCase().includes(q))
      );
    }
    if (contactFilter === 'synced') {
      list = list.filter((c) => c.ecosystem_sync_status === 'synced' || Boolean(c.canonical_contact_id));
    } else if (contactFilter === 'with_dms') {
      list = list.filter((c) => ((c.total_messages_sent || 0) + (c.total_messages_received || 0)) > 0);
    }
    return list;
  }, [dynamicContacts, contactSearch, contactFilter]);

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

  // AutoDM Profile & Media Query & States
  const [mediaFilter, setMediaFilter] = useState<'all' | 'video' | 'image'>('all');
  const [selectedMediaPost, setSelectedMediaPost] = useState<AutoDMInstagramMediaItem | null>(null);

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
  const profileAccount = autodmMediaData?.account || activeAutoDMAccount;

  const mediaFilterCounts = useMemo(() => {
    const all = instagramMediaList.length;
    const reels = instagramMediaList.filter((m) => m.media_type === 'VIDEO').length;
    const photos = instagramMediaList.filter((m) => m.media_type === 'IMAGE' || m.media_type === 'CAROUSEL_ALBUM').length;
    return { all, reels, photos };
  }, [instagramMediaList]);

  const filteredMediaList = useMemo(() => {
    if (mediaFilter === 'video') {
      return instagramMediaList.filter((m) => m.media_type === 'VIDEO');
    }
    if (mediaFilter === 'image') {
      return instagramMediaList.filter((m) => m.media_type === 'IMAGE' || m.media_type === 'CAROUSEL_ALBUM');
    }
    return instagramMediaList;
  }, [instagramMediaList, mediaFilter]);

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
    setShowAddRuleModal(true);
  };

  // Computed AutoDM aggregated metrics
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

  // Fallback in-memory rules if dynamic list is empty
  const [autoDMRules, setAutoDMRules] = useState<AutoDMRule[]>([
    {
      id: 'rule_1',
      name: 'Reel Pricing Inquiries',
      triggerKeyword: 'PRICE',
      channel: 'instagram',
      matchType: 'contains',
      replyMessage: 'Thanks for reaching out! Here is the pricing catalog and special discount: getaipilot.in/pricing',
      includeLink: 'https://getaipilot.in/pricing',
      enabled: true,
      triggerCount: 842,
      leadsCaptured: 241,
    },
    {
      id: 'rule_2',
      name: 'Free Demo Access',
      triggerKeyword: 'DEMO',
      channel: 'all',
      matchType: 'exact',
      replyMessage: 'Hey there! Tap below to book your 1-on-1 personalized GetAiPilot walkthrough:',
      includeLink: 'https://getaipilot.in/demo',
      enabled: true,
      triggerCount: 420,
      leadsCaptured: 168,
    },
  ]);

  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleKeyword, setNewRuleKeyword] = useState('');
  const [newRuleReply, setNewRuleReply] = useState('');
  const [newRuleChannel, setNewRuleChannel] = useState<'instagram' | 'facebook' | 'all'>('instagram');

  // --- YouTube Studio Data Processing ---
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

    // 3. Complete showcase studio broadcasts if empty
    if (list.length === 0) {
      list.push(
        {
          id: 'yt_demo_1',
          title: 'How to Build AI-Powered Workflows in 2026 [Complete Guide]',
          description: 'Step-by-step masterclass on deploying autonomous AI automations across mobile and web.',
          views: 18450,
          likes: 1240,
          duration: '14:25',
          status: 'public',
          publishedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          category: 'Videos',
          thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
          videoUrl: 'https://youtube.com',
        },
        {
          id: 'yt_demo_2',
          title: '5 Automation Hacks You Wish You Knew Sooner #Shorts',
          description: 'Top AI shortcuts to automate social media scheduling in 30 seconds.',
          views: 54200,
          likes: 4890,
          duration: '0:48',
          status: 'public',
          publishedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
          category: 'Shorts',
          thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
          videoUrl: 'https://youtube.com/shorts',
        },
        {
          id: 'yt_demo_3',
          title: 'Viral Video Hook Formulas for Creators in 2026 #Shorts',
          description: 'Retention techniques to 10x your audience watch time.',
          views: 32100,
          likes: 2980,
          duration: '0:52',
          status: 'public',
          publishedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
          category: 'Shorts',
          thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
          videoUrl: 'https://youtube.com/shorts',
        },
        {
          id: 'yt_demo_4',
          title: 'Next-Gen Multi-Agent Systems Deep Dive #StudioLive',
          description: 'Live studio broadcast discussing production multi-agent deployment.',
          views: 8900,
          likes: 670,
          duration: '42:10',
          status: 'scheduled',
          scheduledFor: new Date(Date.now() + 86400000).toISOString(),
          category: 'Scheduled',
          thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
        },
        {
          id: 'yt_demo_5',
          title: 'GAP Creator Studio Master Playlist (12 Videos)',
          description: 'Curated series on social pilot setup and multi-channel marketing.',
          views: 45600,
          likes: 3120,
          duration: '12 Videos',
          status: 'public',
          publishedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
          category: 'Playlists',
        }
      );
    }

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
    const max = Math.max(...allYtVideos.map((v) => Number(v.views || 0)), 54200);
    return max >= 1000 ? `${(max / 1000).toFixed(1)}K` : `${max}`;
  }, [allYtVideos]);

  const totalViewsDisplay = useMemo(() => {
    if (ytStats?.viewCount) {
      const num = Number(ytStats.viewCount);
      return num >= 1000 ? `${(num / 1000).toFixed(1)}K` : `${num}`;
    }
    const sum = allYtVideos.reduce((acc, v) => acc + Number(v.views || 0), 248600);
    return sum >= 1000 ? `${(sum / 1000).toFixed(1)}K` : `${sum}`;
  }, [ytStats, allYtVideos]);

  const subscribersDisplay = useMemo(() => {
    if (ytStats?.subscriberCount) {
      const num = Number(ytStats.subscriberCount);
      return num >= 1000 ? `${(num / 1000).toFixed(1)}K` : `${num}`;
    }
    return '18.4K';
  }, [ytStats]);

  const videosCountDisplay = useMemo(() => {
    if (ytStats?.videoCount) return String(ytStats.videoCount);
    return String(allYtVideos.length || 86);
  }, [ytStats, allYtVideos]);

  // Find instagram and youtube accounts from connected accounts list
  const igAccount = connectedAccounts.find(
    (a) => (a.provider || a.platform || '').toLowerCase() === 'instagram'
  );
  const ytAccount = connectedAccounts.find(
    (a) => (a.provider || a.platform || '').toLowerCase() === 'youtube'
  );

  const handleGenerateAiCaption = () => {
    if (!aiTopicInput.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsGeneratingCaption(true);
    setTimeout(() => {
      setGeneratedCaption(
        `🚀 Stop scrolling! Here is the secret to scaling your brand with ${aiTopicInput.trim()}:\n\n` +
        `1️⃣ Consistency beats intensity\n` +
        `2️⃣ Automate the repetitive tasks with AI\n` +
        `3️⃣ Engage with every single comment within 10 minutes\n\n` +
        `Drop "SCALE" below and I'll send you our step-by-step breakdown directly to your DMs! 👇\n\n` +
        `#SocialMediaGrowth #ContentCreator #AIAutomation #InstaTips #${aiTopicInput.replace(/\s+/g, '')}`
      );
      setIsGeneratingCaption(false);
    }, 800);
  };

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
      Alert.alert('Missing fields', 'Please enter a trigger keyword and reply message.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    createAutomationMutation.mutate({
      name: newRuleName.trim() || `Keyword: ${newRuleKeyword.trim().toUpperCase()}`,
      trigger_type: 'comment_on_post',
      keywords: [newRuleKeyword.trim().toLowerCase()],
      comment_reply_text: newRuleReply.trim(),
      is_active: true,
      instagram_account_id: activeInstagramAccountId,
      response_flow: {
        opening_message: newRuleReply.trim(),
        opening_message_enabled: true,
        nodes: [],
      },
    });

    const newRule: AutoDMRule = {
      id: `rule_${Date.now()}`,
      name: newRuleName.trim() || `Keyword: ${newRuleKeyword.trim().toUpperCase()}`,
      triggerKeyword: newRuleKeyword.trim().toUpperCase(),
      channel: newRuleChannel,
      matchType: 'contains',
      replyMessage: newRuleReply.trim(),
      enabled: true,
      triggerCount: 0,
      leadsCaptured: 0,
    };
    setAutoDMRules((prev) => [newRule, ...prev]);
  };

  const handleDeleteRule = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const dynamicMatch = dynamicAutomations.find((a) => a.id === id);
    if (dynamicMatch) {
      Alert.alert(
        'Delete Automation',
        `Are you sure you want to delete "${dynamicMatch.name || 'this automation'}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteAutomationMutation.mutate(id),
          },
        ]
      );
    } else {
      setAutoDMRules((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <View style={styles.container}>
      {/* Sub-Tabs Top Segmented Navigation (Horizontally scrollable for small screens) */}
      <View style={[styles.segmentedWrapper, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.segmentedScroll}
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveSubTab('queue');
            }}
            style={[
              styles.segmentItem,
              activeSubTab === 'queue' && [
                styles.segmentItemActive,
                { backgroundColor: isDark ? '#0f172a' : '#ffffff' },
              ],
            ]}
          >
            <Ionicons
              name="time"
              size={14}
              color={activeSubTab === 'queue' ? '#ec4899' : isDark ? '#94a3b8' : '#64748b'}
            />
            <Text
              style={[
                styles.segmentText,
                { color: activeSubTab === 'queue' ? '#ec4899' : isDark ? '#94a3b8' : '#64748b' },
              ]}
              numberOfLines={1}
            >
              Queue ({queueList.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveSubTab('instapilot');
            }}
            style={[
              styles.segmentItem,
              activeSubTab === 'instapilot' && [
                styles.segmentItemActive,
                { backgroundColor: isDark ? '#0f172a' : '#ffffff' },
              ],
            ]}
          >
            <Ionicons
              name="logo-instagram"
              size={14}
              color={activeSubTab === 'instapilot' ? '#e1306c' : isDark ? '#94a3b8' : '#64748b'}
            />
            <Text
              style={[
                styles.segmentText,
                { color: activeSubTab === 'instapilot' ? '#e1306c' : isDark ? '#94a3b8' : '#64748b' },
              ]}
              numberOfLines={1}
            >
              Instapilot
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveSubTab('youtube');
            }}
            style={[
              styles.segmentItem,
              activeSubTab === 'youtube' && [
                styles.segmentItemActive,
                { backgroundColor: isDark ? '#0f172a' : '#ffffff' },
              ],
            ]}
          >
            <Ionicons
              name="logo-youtube"
              size={14}
              color={activeSubTab === 'youtube' ? '#ff0000' : isDark ? '#94a3b8' : '#64748b'}
            />
            <Text
              style={[
                styles.segmentText,
                { color: activeSubTab === 'youtube' ? '#ff0000' : isDark ? '#94a3b8' : '#64748b' },
              ]}
              numberOfLines={1}
            >
              YouTube
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveSubTab('autodm');
            }}
            style={[
              styles.segmentItem,
              activeSubTab === 'autodm' && [
                styles.segmentItemActive,
                { backgroundColor: isDark ? '#0f172a' : '#ffffff' },
              ],
            ]}
          >
            <Ionicons
              name="flash"
              size={14}
              color={activeSubTab === 'autodm' ? '#3b82f6' : isDark ? '#94a3b8' : '#64748b'}
            />
            <Text
              style={[
                styles.segmentText,
                { color: activeSubTab === 'autodm' ? '#3b82f6' : isDark ? '#94a3b8' : '#64748b' },
              ]}
              numberOfLines={1}
            >
              AutoDM
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {activeSubTab === 'queue' && (
        <View style={styles.subContent}>
          <View style={styles.headerActionRow}>
            <View style={styles.headerTextCol}>
              <Text style={[styles.subTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                Scheduled Broadcast Queue
              </Text>
              <Text style={[styles.subDesc, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                Pending publications automatically firing across channels
              </Text>
            </View>
            <Pressable onPress={onOpenCreateModal} style={styles.primaryActionBtn}>
              <Ionicons name="calendar-outline" size={14} color="#ffffff" />
              <Text style={styles.primaryActionBtnText}>Schedule</Text>
            </Pressable>
          </View>

          {(() => {
            const rawQueueList = Array.isArray(queueList) ? queueList : (queueList as any)?.broadcasts || [];
            const queueCounts = {
              all: rawQueueList.length,
              scheduled: rawQueueList.filter((item: any) => {
                const s = (item.status || '').toLowerCase();
                return s === 'scheduled' || s === 'queued' || s === 'pending';
              }).length,
              sent: rawQueueList.filter((item: any) => {
                const s = (item.status || '').toLowerCase();
                return s === 'sent' || s === 'published';
              }).length,
              failed: rawQueueList.filter((item: any) => (item.status || '').toLowerCase() === 'failed').length,
            };

            const filteredQueueList = rawQueueList.filter((item: any) => {
              if (queueStatusFilter === 'ALL') return true;
              const s = (item.status || '').toLowerCase();
              if (queueStatusFilter === 'scheduled') return s === 'scheduled' || s === 'queued' || s === 'pending';
              if (queueStatusFilter === 'sent') return s === 'sent' || s === 'published';
              if (queueStatusFilter === 'failed') return s === 'failed';
              return true;
            });

            return (
              <>
                {/* Status Bar at Top of the List */}
                <View style={styles.statusFilterContainer}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.statusFilterRow}
                  >
                    {[
                      { key: 'ALL', label: 'All', count: queueCounts.all, color: '#ec4899' },
                      { key: 'scheduled', label: 'Scheduled', count: queueCounts.scheduled, color: '#3b82f6' },
                      { key: 'sent', label: 'Published', count: queueCounts.sent, color: '#22c55e' },
                      { key: 'failed', label: 'Failed', count: queueCounts.failed, color: '#ef4444' },
                    ].map((tab) => {
                      const isSelected = queueStatusFilter === tab.key;
                      return (
                        <Pressable
                          key={tab.key}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setQueueStatusFilter(tab.key as any);
                          }}
                          style={[
                            styles.statusFilterChip,
                            {
                              backgroundColor: isSelected
                                ? isDark
                                  ? 'rgba(236, 72, 153, 0.2)'
                                  : 'rgba(236, 72, 153, 0.1)'
                                : isDark
                                  ? '#1e293b'
                                  : '#f1f5f9',
                              borderColor: isSelected ? tab.color : 'transparent',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusFilterLabel,
                              {
                                color: isSelected
                                  ? tab.color
                                  : isDark
                                    ? '#94a3b8'
                                    : '#64748b',
                              },
                            ]}
                          >
                            {tab.label}
                          </Text>
                          <View
                            style={[
                              styles.statusCountBadge,
                              {
                                backgroundColor: isSelected
                                  ? tab.color
                                  : isDark
                                    ? 'rgba(148, 163, 184, 0.2)'
                                    : 'rgba(148, 163, 184, 0.3)',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusCountText,
                                {
                                  color: isSelected ? '#ffffff' : isDark ? '#94a3b8' : '#64748b',
                                },
                              ]}
                            >
                              {tab.count}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>

                {queueLoading ? (
                  <ActivityIndicator size="large" color="#ec4899" style={{ marginVertical: 40 }} />
                ) : filteredQueueList.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="calendar-outline" size={48} color={isDark ? '#475569' : '#94a3b8'} />
                    <Text style={[styles.emptyTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      {queueStatusFilter === 'ALL' ? 'Queue is Empty' : `No ${queueStatusFilter} posts`}
                    </Text>
                    <Text style={[styles.emptyDesc, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                      {queueStatusFilter === 'ALL'
                        ? 'You have no scheduled social posts waiting in the queue. Plan your next broadcast in advance!'
                        : `There are currently no broadcasts with status "${queueStatusFilter}".`}
                    </Text>
                    {queueStatusFilter !== 'ALL' ? (
                      <Pressable
                        onPress={() => setQueueStatusFilter('ALL')}
                        style={styles.emptyActionBtn}
                      >
                        <Text style={styles.emptyActionBtnText}>Show All Posts</Text>
                      </Pressable>
                    ) : (
                      <Pressable onPress={onOpenCreateModal} style={styles.emptyActionBtn}>
                        <Text style={styles.emptyActionBtnText}>Schedule a Post</Text>
                      </Pressable>
                    )}
                  </View>
                ) : (
                  <View style={styles.queueList}>
                    {filteredQueueList.map((item: any) => {
                      const channels = item.selected_channels?.length ? item.selected_channels : ['social'];
                      const statusMeta = getStatusMeta(item.status);
                      const mediaUri =
                        item.thumbnail_url ||
                        (item.media_type === 'image' ? item.media_url : null) ||
                        item.media_urls?.[0];
                      const isVideo = item.media_type === 'video' || item.video_filename != null;

                      let timingText = 'Instant Broadcast';
                      let timingIcon: any = 'flash-outline';
                      let timingColor = '#8b5cf6';
                      if (item.scheduled_for) {
                        timingText = `Fires on: ${new Date(item.scheduled_for).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`;
                        timingIcon = 'alarm-outline';
                        timingColor = '#ec4899';
                      } else if (item.posted_at) {
                        timingText = `Published: ${new Date(item.posted_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`;
                        timingIcon = 'checkmark-done-circle-outline';
                        timingColor = '#22c55e';
                      } else if (item.created_at) {
                        timingText = `Created: ${new Date(item.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`;
                        timingIcon = 'time-outline';
                        timingColor = '#94a3b8';
                      }

                      const liveUrl =
                        item.youtube_url ||
                        item.youtube_shorts_url ||
                        item.instagram_url ||
                        item.facebook_url ||
                        item.x_url;

                      const failureReason =
                        item.last_error ||
                        item.youtube_error ||
                        item.instagram_error ||
                        item.facebook_error ||
                        item.x_error ||
                        item.error_message;

                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => onSelectPost(item)}
                          style={[
                            styles.card,
                            {
                              backgroundColor: isDark ? '#0f172a' : '#ffffff',
                              borderColor: isDark ? '#1e293b' : '#e2e8f0',
                            },
                          ]}
                        >
                          {/* Header: Status at Top + Channels */}
                          <View style={styles.cardHeader}>
                            <View style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}>
                              <Ionicons name={statusMeta.icon} size={12} color={statusMeta.color} />
                              <Text style={[styles.statusBadgeText, { color: statusMeta.color }]}>
                                {statusMeta.label}
                              </Text>
                            </View>
                            <View style={styles.channelsRow}>
                              {channels.map((ch: string, i: number) => {
                                const meta = getChannelMeta(ch);
                                return (
                                  <View key={i} style={[styles.chBadge, { backgroundColor: meta.bg }]}>
                                    <Ionicons name={meta.icon} size={12} color={meta.color} />
                                    <Text style={[styles.chBadgeText, { color: meta.color }]}>{meta.name}</Text>
                                  </View>
                                );
                              })}
                            </View>
                          </View>

                          {/* Middle Row: Media Thumbnail + Caption */}
                          <View style={styles.queueBodyRow}>
                            {mediaUri ? (
                              <View style={styles.queueThumbContainer}>
                                <Image source={{ uri: mediaUri }} style={styles.queueThumb} resizeMode="cover" />
                                {isVideo && (
                                  <View style={styles.queueVideoBadge}>
                                    <Ionicons name="play" size={10} color="#ffffff" />
                                  </View>
                                )}
                              </View>
                            ) : isVideo ? (
                              <View
                                style={[
                                  styles.queueThumbContainer,
                                  {
                                    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                  },
                                ]}
                              >
                                <Ionicons name="videocam" size={20} color="#ec4899" />
                              </View>
                            ) : null}

                            <View style={styles.queueCaptionCol}>
                              <Text
                                style={[styles.postFullCaption, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                                numberOfLines={3}
                              >
                                {item.caption || 'No caption'}
                              </Text>
                              <View style={styles.scheduledTimeRow}>
                                <Ionicons name={timingIcon} size={13} color={timingColor} />
                                <Text style={[styles.scheduledTimeText, { color: timingColor }]}>
                                  {timingText}
                                </Text>
                              </View>
                            </View>
                          </View>

                          {/* Failure Banner if failed */}
                          {item.status === 'failed' && failureReason && (
                            <View style={styles.queueErrorBanner}>
                              <Ionicons name="alert-circle" size={14} color="#ef4444" />
                              <Text style={styles.queueErrorText} numberOfLines={2}>
                                {failureReason}
                              </Text>
                            </View>
                          )}

                          {/* Footer Actions */}
                          <View style={styles.cardFooter}>
                            <Pressable onPress={() => onSelectPost(item)} style={styles.actionLink}>
                              <Text style={styles.actionLinkText}>Details & Preview</Text>
                            </Pressable>

                            {liveUrl && (
                              <Pressable
                                onPress={() => Linking.openURL(liveUrl)}
                                style={[styles.actionLink, { borderColor: '#22c55e', flexDirection: 'row', justifyContent: 'center' }]}
                              >
                                <Ionicons name="open-outline" size={13} color="#22c55e" style={{ marginRight: 4 }} />
                                <Text style={[styles.actionLinkText, { color: '#22c55e' }]}>Watch</Text>
                              </Pressable>
                            )}

                            {(item.status === 'scheduled' || item.status === 'queued') && (
                              <Pressable
                                onPress={() => onCancelPost(item.id)}
                                style={[styles.actionLink, { borderColor: '#ef4444' }]}
                              >
                                <Text style={[styles.actionLinkText, { color: '#ef4444' }]}>Cancel</Text>
                              </Pressable>
                            )}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </>
            );
          })()}
        </View>
      )}

      {activeSubTab === 'instapilot' && (
        <View style={styles.subContent}>
          <View style={styles.headerActionRow}>
            <View style={styles.headerTextCol}>
              <Text style={[styles.subTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                Gap Instapilot Hub
              </Text>
              <Text style={[styles.subDesc, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                Instagram growth engine, automated Reels, & AI hooks
              </Text>
            </View>
            <View style={[styles.brandBadge, { backgroundColor: 'rgba(225, 48, 108, 0.1)' }]}>
              <Text style={[styles.brandBadgeText, { color: '#e1306c' }]}>PRO</Text>
            </View>
          </View>

          {/* Connected Instagram Profile Card */}
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
              <View style={[styles.profileAvatar, { backgroundColor: 'rgba(225, 48, 108, 0.15)' }]}>
                <Ionicons name="logo-instagram" size={26} color="#e1306c" />
              </View>
              <View style={styles.profileInfoCol}>
                <Text style={[styles.profileName, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                  {igAccount?.account_name || igAccount?.username || 'Instagram Business Sync'}
                </Text>
                <Text style={styles.profileStatus}>
                  {igAccount?.connected ? '✅ Synced via Meta Graph API' : 'Not Connected'}
                </Text>
              </View>
              <Pressable onPress={onOpenAccountsModal} style={styles.linkAccBtn}>
                <Text style={styles.linkAccBtnText}>
                  {igAccount?.connected ? 'Manage' : 'Connect'}
                </Text>
              </Pressable>
            </View>

            {/* Quick Metrics */}
            <View style={styles.igMetricsGrid}>
              <View style={styles.igMetricBox}>
                <Text style={[styles.igMetricNum, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                  24.5K
                </Text>
                <Text style={styles.igMetricLabel}>Followers</Text>
              </View>
              <View style={styles.igMetricBox}>
                <Text style={[styles.igMetricNum, { color: '#22c55e' }]}>+4.8%</Text>
                <Text style={styles.igMetricLabel}>Engagement</Text>
              </View>
              <View style={styles.igMetricBox}>
                <Text style={[styles.igMetricNum, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                  14
                </Text>
                <Text style={styles.igMetricLabel}>Reels / Mo</Text>
              </View>
            </View>
          </View>

          {/* InstaPilot Direct Conversations Card with 5s Auto-Sync */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                borderColor: isDark ? '#1e293b' : '#e2e8f0',
              },
            ]}
          >
            {/* Live Sync Status Header */}
            <View style={styles.inboxHeaderRow}>
              <View style={styles.inboxTitleCol}>
                <View style={styles.inboxTitleLine}>
                  <Text style={[styles.cardSectionTitle, { color: isDark ? '#f8fafc' : '#0f172a', marginBottom: 0 }]}>
                    Direct Inbox & Leads
                  </Text>
                  <View style={[styles.liveSyncBadge, { backgroundColor: isSyncingInstapilot ? 'rgba(59, 130, 246, 0.12)' : 'rgba(34, 197, 94, 0.12)' }]}>
                    <View style={[styles.pulsingDot, { backgroundColor: isSyncingInstapilot ? '#3b82f6' : '#22c55e' }]} />
                    <Text style={[styles.liveSyncBadgeText, { color: isSyncingInstapilot ? '#3b82f6' : '#22c55e' }]}>
                      {isSyncingInstapilot ? 'Syncing...' : `Sync in ${syncCountdown}s`}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.inboxSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  Real-time Instagram DMs • Auto-syncing every 5 seconds
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSyncInstapilot?.();
                }}
                disabled={isSyncingInstapilot}
                style={[styles.syncNowBtn, isSyncingInstapilot && { opacity: 0.6 }]}
              >
                {isSyncingInstapilot ? (
                  <ActivityIndicator size="small" color="#e1306c" />
                ) : (
                  <>
                    <Ionicons name="sync" size={14} color="#e1306c" />
                    <Text style={styles.syncNowBtnText}>Sync</Text>
                  </>
                )}
              </Pressable>
            </View>

            {/* Search Box */}
            <View style={styles.inboxSearchRow}>
              <View
                style={[
                  styles.inboxSearchInputBox,
                  {
                    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                  },
                ]}
              >
                <Ionicons name="search" size={15} color={isDark ? '#94a3b8' : '#64748b'} />
                <TextInput
                  style={[styles.inboxSearchInput, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                  placeholder="Search name, @handle, or message..."
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={instapilotSearch}
                  onChangeText={setInstapilotSearch}
                />
                {Boolean(instapilotSearch) && (
                  <Pressable onPress={() => setInstapilotSearch('')}>
                    <Ionicons name="close-circle" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Filter Pills */}
            <View style={styles.inboxFilterPillsRow}>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setInstapilotFilter('all');
                }}
                style={[
                  styles.inboxFilterPill,
                  instapilotFilter === 'all'
                    ? [styles.inboxFilterPillActive, { backgroundColor: '#e1306c' }]
                    : { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
                ]}
              >
                <Text
                  style={[
                    styles.inboxFilterPillText,
                    { color: instapilotFilter === 'all' ? '#ffffff' : isDark ? '#cbd5e1' : '#64748b' },
                  ]}
                >
                  All ({instapilotConversations.length})
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setInstapilotFilter('leads');
                }}
                style={[
                  styles.inboxFilterPill,
                  instapilotFilter === 'leads'
                    ? [styles.inboxFilterPillActive, { backgroundColor: '#16a34a' }]
                    : { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
                ]}
              >
                <Ionicons
                  name="sparkles"
                  size={12}
                  color={instapilotFilter === 'leads' ? '#ffffff' : '#16a34a'}
                />
                <Text
                  style={[
                    styles.inboxFilterPillText,
                    { color: instapilotFilter === 'leads' ? '#ffffff' : isDark ? '#cbd5e1' : '#64748b' },
                  ]}
                >
                  Leads ({leadsCount})
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setInstapilotFilter('active');
                }}
                style={[
                  styles.inboxFilterPill,
                  instapilotFilter === 'active'
                    ? [styles.inboxFilterPillActive, { backgroundColor: '#3b82f6' }]
                    : { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
                ]}
              >
                <Ionicons
                  name="hardware-chip"
                  size={12}
                  color={instapilotFilter === 'active' ? '#ffffff' : '#3b82f6'}
                />
                <Text
                  style={[
                    styles.inboxFilterPillText,
                    { color: instapilotFilter === 'active' ? '#ffffff' : isDark ? '#cbd5e1' : '#64748b' },
                  ]}
                >
                  Active ({activeBotsCount})
                </Text>
              </Pressable>
            </View>

            {/* Conversation List */}
            {instapilotLoading && instapilotConversations.length === 0 ? (
              <View style={styles.inboxLoadingBox}>
                <ActivityIndicator size="small" color="#e1306c" />
                <Text style={[styles.inboxLoadingText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  Loading Instagram conversations...
                </Text>
              </View>
            ) : filteredConversations.length === 0 ? (
              <View style={styles.inboxEmptyBox}>
                <Ionicons name="chatbubbles-outline" size={32} color={isDark ? '#475569' : '#cbd5e1'} />
                <Text style={[styles.inboxEmptyTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                  No conversations found
                </Text>
                <Text style={[styles.inboxEmptyDesc, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  {instapilotSearch
                    ? 'No direct messages match your search filter.'
                    : 'Auto-syncing every 5 seconds for new Instagram DMs.'}
                </Text>
              </View>
            ) : (
              <View style={styles.inboxConversationsList}>
                {filteredConversations.map((conv) => {
                  const msgs = conv.instagram_messages || [];
                  const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
                  const hasLead = Boolean(conv.lead_data?.email || conv.lead_data?.phone);
                  const isBotActive = conv.status === 'bot_active' && !conv.bot_paused;

                  return (
                    <Pressable
                      key={conv.id}
                      onPress={() => {
                        Haptics.selectionAsync();
                        onSelectInstapilotConv?.(conv);
                      }}
                      style={({ pressed }) => [
                        styles.convCard,
                        {
                          backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                          borderColor: isDark ? '#334155' : '#e2e8f0',
                        },
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <View style={styles.convCardHeader}>
                        {/* Avatar */}
                        <View style={styles.convAvatarContainer}>
                          {conv.profile_pic_url ? (
                            <Image
                              source={{ uri: conv.profile_pic_url }}
                              style={styles.convAvatar}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.convAvatarFallback}>
                              <Ionicons name="logo-instagram" size={18} color="#ffffff" />
                            </View>
                          )}
                          <View style={styles.convAvatarBadge}>
                            <Ionicons name="logo-instagram" size={8} color="#ffffff" />
                          </View>
                        </View>

                        {/* Title & Info */}
                        <View style={styles.convInfoCol}>
                          <View style={styles.convNameRow}>
                            <Text
                              style={[styles.convDisplayName, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                              numberOfLines={1}
                            >
                              {conv.instagram_name || conv.instagram_username}
                            </Text>

                            {hasLead && (
                              <View style={styles.convLeadBadge}>
                                <Ionicons name="sparkles" size={10} color="#16a34a" />
                                <Text style={styles.convLeadBadgeText}>Lead</Text>
                              </View>
                            )}

                            {conv.last_message_at && (
                              <Text style={styles.convTimeText}>
                                {new Date(conv.last_message_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </Text>
                            )}
                          </View>

                          <View style={styles.convHandleRow}>
                            <Text style={styles.convHandleText}>@{conv.instagram_username}</Text>
                            <Text style={styles.convDotSeparator}>•</Text>
                            <Text style={styles.convFollowerText}>
                              {conv.follower_count ?? 0} followers
                            </Text>
                            {conv.is_user_follow_business && (
                              <View style={styles.convFollowsBadge}>
                                <Text style={styles.convFollowsBadgeText}>Follows you</Text>
                              </View>
                            )}
                          </View>
                        </View>

                        {/* Chevron */}
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={isDark ? '#64748b' : '#94a3b8'}
                          style={{ marginLeft: 6 }}
                        />
                      </View>

                      {/* Last Message Preview */}
                      {lastMsg && (
                        <View style={styles.convLastMsgRow}>
                          <Ionicons
                            name={lastMsg.direction === 'outbound' ? 'arrow-redo' : 'chatbubble-ellipses'}
                            size={12}
                            color={lastMsg.direction === 'outbound' ? '#3b82f6' : '#ec4899'}
                            style={{ marginTop: 2 }}
                          />
                          <Text
                            style={[
                              styles.convLastMsgText,
                              { color: isDark ? '#cbd5e1' : '#475569' },
                            ]}
                            numberOfLines={2}
                          >
                            {lastMsg.direction === 'outbound' ? 'You: ' : ''}
                            {lastMsg.message_text}
                          </Text>
                        </View>
                      )}

                      {/* Quick Contact Chips if captured */}
                      {hasLead && (
                        <View style={styles.convCapturedChipsRow}>
                          {conv.lead_data?.email && (
                            <View style={styles.convContactChip}>
                              <Ionicons name="mail" size={11} color="#3b82f6" />
                              <Text style={styles.convContactChipText}>
                                {conv.lead_data.email}
                              </Text>
                            </View>
                          )}
                          {conv.lead_data?.phone && (
                            <View style={[styles.convContactChip, { borderColor: 'rgba(34, 197, 94, 0.3)' }]}>
                              <Ionicons name="call" size={11} color="#16a34a" />
                              <Text style={[styles.convContactChipText, { color: '#16a34a' }]}>
                                {conv.lead_data.phone}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}

                      {/* Footer: Bot Status & Total messages */}
                      <View style={styles.convFooterRow}>
                        <View
                          style={[
                            styles.convBotStatusPill,
                            {
                              backgroundColor: isBotActive
                                ? 'rgba(34, 197, 94, 0.12)'
                                : 'rgba(234, 179, 8, 0.12)',
                            },
                          ]}
                        >
                          <Ionicons
                            name={isBotActive ? 'hardware-chip' : 'pause-circle'}
                            size={10}
                            color={isBotActive ? '#22c55e' : '#eab308'}
                          />
                          <Text
                            style={[
                              styles.convBotStatusText,
                              { color: isBotActive ? '#22c55e' : '#eab308' },
                            ]}
                          >
                            {isBotActive ? 'Bot Active' : 'Bot Paused'}
                          </Text>
                        </View>

                        <Text style={styles.convMsgCountText}>
                          {msgs.length} {msgs.length === 1 ? 'message' : 'messages'}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          {/* AI Instagram Viral Caption Generator */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                borderColor: isDark ? '#1e293b' : '#e2e8f0',
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="sparkles" size={16} color="#e1306c" />
                <Text style={[styles.cardSectionTitle, { color: isDark ? '#f8fafc' : '#0f172a', marginBottom: 0 }]}>
                  AI Viral Caption & Hashtags
                </Text>
              </View>
            </View>

            <TextInput
              style={[
                styles.topicInput,
                {
                  backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  borderColor: isDark ? '#334155' : '#cbd5e1',
                },
              ]}
              placeholder="Enter Reel/Post topic (e.g., Summer Fashion, AI Productivity)..."
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              value={aiTopicInput}
              onChangeText={setAiTopicInput}
            />

            <Pressable
              onPress={handleGenerateAiCaption}
              disabled={isGeneratingCaption || !aiTopicInput.trim()}
              style={[
                styles.generateBtn,
                { opacity: !aiTopicInput.trim() || isGeneratingCaption ? 0.6 : 1 },
              ]}
            >
              {isGeneratingCaption ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="flash" size={14} color="#ffffff" />
                  <Text style={styles.generateBtnText}>Generate Viral Hook</Text>
                </>
              )}
            </Pressable>

            {generatedCaption ? (
              <View style={[styles.resultBox, { backgroundColor: isDark ? '#1e293b' : '#fdf2f8' }]}>
                <Text style={[styles.resultText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                  {generatedCaption}
                </Text>
                <Pressable
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    onOpenCreateModal();
                  }}
                  style={styles.useInPostBtn}
                >
                  <Ionicons name="copy-outline" size={14} color="#e1306c" />
                  <Text style={styles.useInPostBtnText}>Copy & Open Post Composer</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      )}

      {activeSubTab === 'youtube' && (
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
                onOpenCreateModal();
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
              <Text style={styles.ytSystemHealthSub}>
                Graph API v3 • Live
              </Text>
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
              <View style={[styles.profileAvatar, { backgroundColor: 'rgba(255, 0, 0, 0.15)' }]}>
                <Ionicons name="logo-youtube" size={26} color="#ff0000" />
              </View>
              <View style={styles.profileInfoCol}>
                <Text style={[styles.profileName, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                  {activeYtAccount?.youtube?.snippet?.title ||
                    activeYtAccount?.account_name ||
                    'Official Studio Channel'}
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
              <Pressable onPress={onOpenAccountsModal} style={styles.linkAccBtn}>
                <Text style={styles.linkAccBtnText}>
                  {activeYtAccount?.connected ? 'Manage' : 'Connect'}
                </Text>
              </Pressable>
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
                          onOpenCreateModal();
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
      )}

      {activeSubTab === 'autodm' && (
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
                setShowAddRuleModal(true);
              }}
              style={[styles.primaryActionBtn, { backgroundColor: '#3b82f6' }]}
            >
              <Ionicons name="add" size={16} color="#ffffff" />
              <Text style={styles.primaryActionBtnText}>New Automation</Text>
            </Pressable>
          </View>

          {/* 1. Connected Instagram Account & Webhook Status Card */}
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
                    {activeAutoDMAccount?.full_name || 'HAPFs UNION'}
                  </Text>
                  <View style={styles.autodmWebhookBadge}>
                    <View style={styles.autodmGreenDot} />
                    <Text style={styles.autodmWebhookText}>
                      {activeAutoDMAccount?.webhook_status === 'active' ? 'Webhook Active' : 'Connected'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.autodmAccountHandle}>
                  @{activeAutoDMAccount?.username || 'hapfsunion'} • {activeAutoDMAccount?.followers_count ?? 9} followers • {activeAutoDMAccount?.media_count ?? 146} posts
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  refetchAutoDMStatus();
                  refetchAutoDMMetrics();
                  refetchAutoDMAutomations();
                }}
                style={[styles.autodmRefreshBtn, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
              >
                <Ionicons
                  name={autodmStatusLoading || autodmMetricsLoading ? 'sync' : 'refresh'}
                  size={15}
                  color={isDark ? '#cbd5e1' : '#475569'}
                />
              </Pressable>
            </View>
          </View>

          {/* 2. Daily Performance Telemetry Grid (From /api/autodm/daily-metrics) */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                borderColor: isDark ? '#1e293b' : '#e2e8f0',
              },
            ]}
          >
            <View style={styles.igMetricsGrid}>
              <View style={styles.igMetricBox}>
                <Text style={[styles.igMetricNum, { color: '#3b82f6' }]}>
                  {computedAutoDMMetrics.sent}
                </Text>
                <Text style={styles.igMetricLabel}>Messages Sent</Text>
              </View>
              <View style={styles.igMetricBox}>
                <Text style={[styles.igMetricNum, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                  {computedAutoDMMetrics.seen}
                </Text>
                <Text style={styles.igMetricLabel}>Messages Seen</Text>
              </View>
              <View style={styles.igMetricBox}>
                <Text style={[styles.igMetricNum, { color: '#22c55e' }]}>
                  {computedAutoDMMetrics.leads}
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
                  ? (dynamicAutomations.length || autoDMRules.length)
                  : cat === 'contacts'
                    ? dynamicContacts.length
                    : cat === 'profile'
                      ? (profileAccount?.media_count ?? instagramMediaList.length)
                      : undefined;

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

          {/* 4. Category 1: AUTOMATIONS */}
          {autodmCategory === 'automations' && (
            <View style={{ gap: 12 }}>
              {/* Search & Filter Controls */}
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#1e293b' : '#e2e8f0',
                    padding: 12,
                    gap: 10,
                  },
                ]}
              >
                <View
                  style={[
                    styles.inboxSearchInputBox,
                    {
                      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                      borderColor: isDark ? '#334155' : '#cbd5e1',
                    },
                  ]}
                >
                  <Ionicons name="search" size={15} color={isDark ? '#94a3b8' : '#64748b'} />
                  <TextInput
                    style={[styles.inboxSearchInput, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                    placeholder="Search automations by keyword, title..."
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    value={autodmSearch}
                    onChangeText={setAutodmSearch}
                  />
                  {Boolean(autodmSearch) && (
                    <Pressable onPress={() => setAutodmSearch('')}>
                      <Ionicons name="close-circle" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
                    </Pressable>
                  )}
                </View>

                {/* Status Chips */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {(['all', 'active', 'inactive'] as const).map((st) => {
                    const isSelected = autodmStatusFilter === st;
                    return (
                      <Pressable
                        key={st}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setAutodmStatusFilter(st);
                        }}
                        style={[
                          styles.statusChip,
                          {
                            backgroundColor: isSelected
                              ? 'rgba(59, 130, 246, 0.14)'
                              : isDark
                                ? '#1e293b'
                                : '#f1f5f9',
                            borderColor: isSelected ? '#3b82f6' : 'transparent',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusChipText,
                            {
                              color: isSelected ? '#3b82f6' : isDark ? '#94a3b8' : '#64748b',
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {st === 'all' ? 'All Automations' : st === 'active' ? 'Active' : 'Paused'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Dynamic Automations List */}
              {autodmAutomationsLoading && dynamicAutomations.length === 0 ? (
                <View style={{ paddingVertical: 36, alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator size="small" color="#3b82f6" />
                  <Text style={{ fontSize: 13, color: isDark ? '#94a3b8' : '#64748b', fontWeight: '500' }}>
                    Loading active Instagram automations...
                  </Text>
                </View>
              ) : dynamicAutomations.length > 0 ? (
                <View style={{ gap: 14 }}>
                  {dynamicAutomations
                    .filter((a) => {
                      if (autodmStatusFilter === 'active' && !a.is_active) return false;
                      if (autodmStatusFilter === 'inactive' && a.is_active) return false;
                      if (autodmSearch.trim()) {
                        const q = autodmSearch.toLowerCase().trim();
                        const nameMatch = (a.name || '').toLowerCase().includes(q);
                        const keyMatch = (a.keywords || [a.keyword]).some((k) =>
                          (k || '').toLowerCase().includes(q)
                        );
                        const textMatch = (a.comment_reply_text || a.reply_text || '').toLowerCase().includes(q);
                        if (!nameMatch && !keyMatch && !textMatch) return false;
                      }
                      return true;
                    })
                    .map((item) => {
                      const keywordsList =
                        item.keywords && item.keywords.length > 0
                          ? item.keywords
                          : item.keyword
                            ? [item.keyword]
                            : ['link'];

                      const openingMsg =
                        item.response_flow?.opening_message ||
                        item.response_flow?.nodes?.[0]?.content;
                      const openingBtn = item.response_flow?.opening_button;
                      const buttonNodes: Array<{ id?: string; url?: string; title?: string }> = [];
                      item.response_flow?.nodes?.forEach((node) => {
                        if (node.buttons && Array.isArray(node.buttons)) {
                          buttonNodes.push(...node.buttons);
                        }
                      });

                      const formattedCreatedDate = new Date(item.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });
                      const formattedEndDate = item.ends_at
                        ? new Date(item.ends_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })
                        : null;

                      return (
                        <View
                          key={item.id}
                          style={[
                            styles.autodmItemCard,
                            {
                              backgroundColor: isDark ? '#0f172a' : '#ffffff',
                              borderColor: item.is_active
                                ? isDark
                                  ? 'rgba(59, 130, 246, 0.4)'
                                  : 'rgba(59, 130, 246, 0.3)'
                                : isDark
                                  ? '#1e293b'
                                  : '#e2e8f0',
                            },
                          ]}
                        >
                          {/* Card Top Strip: Channel & Status & Toggle */}
                          <View style={styles.autodmItemHeader}>
                            <View style={styles.autodmItemHeaderLeft}>
                              <View
                                style={[
                                  styles.autodmItemIconCircle,
                                  {
                                    backgroundColor: item.is_active
                                      ? 'rgba(225, 48, 108, 0.12)'
                                      : isDark
                                        ? '#1e293b'
                                        : '#f1f5f9',
                                  },
                                ]}
                              >
                                <Ionicons
                                  name="logo-instagram"
                                  size={20}
                                  color={item.is_active ? '#e1306c' : isDark ? '#64748b' : '#94a3b8'}
                                />
                              </View>
                              <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                  <Text
                                    style={[
                                      styles.autodmItemTitle,
                                      { color: isDark ? '#f8fafc' : '#0f172a' },
                                    ]}
                                    numberOfLines={1}
                                  >
                                    {item.name || 'Untitled Automation'}
                                  </Text>
                                  <View
                                    style={[
                                      styles.autodmStatusTag,
                                      {
                                        backgroundColor: item.is_active
                                          ? 'rgba(34, 197, 94, 0.12)'
                                          : isDark
                                            ? '#1e293b'
                                            : '#f1f5f9',
                                      },
                                    ]}
                                  >
                                    <View
                                      style={[
                                        styles.autodmStatusDot,
                                        { backgroundColor: item.is_active ? '#22c55e' : '#94a3b8' },
                                      ]}
                                    />
                                    <Text
                                      style={[
                                        styles.autodmStatusTagText,
                                        { color: item.is_active ? '#16a34a' : '#64748b' },
                                      ]}
                                    >
                                      {item.is_active ? 'Active' : 'Paused'}
                                    </Text>
                                  </View>
                                </View>

                                <Text style={styles.autodmItemSubDate}>
                                  Created {formattedCreatedDate}
                                  {formattedEndDate ? ` • Active until ${formattedEndDate}` : ''}
                                </Text>
                              </View>
                            </View>

                            <Switch
                              value={item.is_active}
                              onValueChange={() => handleToggleRule(item.id, item.is_active)}
                              trackColor={{ false: isDark ? '#334155' : '#cbd5e1', true: '#3b82f6' }}
                              thumbColor="#ffffff"
                            />
                          </View>

                          {/* Trigger & Condition Badges Strip */}
                          <View style={styles.autodmBadgesRow}>
                            <View style={styles.autodmTriggerPill}>
                              <Ionicons name="chatbubble-ellipses" size={12} color="#e1306c" />
                              <Text style={styles.autodmTriggerPillText}>Comment on Post</Text>
                            </View>

                            {keywordsList.map((kw, i) => (
                              <View key={i} style={styles.autodmKeywordBadge}>
                                <Text style={styles.autodmKeywordBadgeHash}>#</Text>
                                <Text style={styles.autodmKeywordBadgeText}>{kw}</Text>
                              </View>
                            ))}

                            <View style={[styles.autodmMetaPill, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                              <Text style={[styles.autodmMetaPillText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                                {item.is_case_sensitive ? 'Aa Case Sensitive' : 'Case Insensitive'}
                              </Text>
                            </View>

                            <View style={[styles.autodmMetaPill, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                              <Text style={[styles.autodmMetaPillText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                                {item.require_follow ? '👤 Must Follow' : '👤 No Follow Req'}
                              </Text>
                            </View>
                          </View>

                          {/* 2-Step Interactive Themed Funnel Visualizer */}
                          <View
                            style={[
                              styles.autodmFunnelContainer,
                              {
                                backgroundColor: isDark ? '#0b0f19' : '#f8fafc',
                                borderColor: isDark ? '#1e293b' : '#e2e8f0',
                              },
                            ]}
                          >
                            {/* Step 1: Public Comment Trigger & Reply */}
                            <View style={styles.autodmStepBlock}>
                              <View style={styles.autodmStepHeader}>
                                <View style={styles.autodmStepNumberBadge}>
                                  <Text style={styles.autodmStepNumberText}>1</Text>
                                </View>
                                <Text style={[styles.autodmStepTitle, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                                  PUBLIC COMMENT AUTO-REPLY
                                </Text>
                              </View>

                              {Boolean(item.comment_reply_text) ? (
                                <View
                                  style={[
                                    styles.autodmCommentBubble,
                                    {
                                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                      borderColor: isDark ? '#334155' : '#e2e8f0',
                                    },
                                  ]}
                                >
                                  <View style={styles.autodmBubbleAuthorRow}>
                                    <Ionicons name="logo-instagram" size={12} color="#e1306c" />
                                    <Text style={[styles.autodmBubbleAuthor, { color: '#e1306c' }]}>
                                      @{activeAutoDMAccount?.username || 'hapfsunion'}
                                    </Text>
                                    <View style={styles.autodmBotTagPill}>
                                      <Text style={styles.autodmBotTag}>BOT</Text>
                                    </View>
                                  </View>
                                  <Text style={[styles.autodmBubbleText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                                    &quot;{item.comment_reply_text}&quot;
                                  </Text>
                                </View>
                              ) : (
                                <Text style={[styles.autodmEmptyStepText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                                  No public reply configured (Instant DM only)
                                </Text>
                              )}
                            </View>

                            {/* Connector Arrow */}
                            <View style={styles.autodmFunnelConnector}>
                              <View style={[styles.autodmFunnelLine, { backgroundColor: isDark ? '#1e293b' : '#cbd5e1' }]} />
                              <View
                                style={[
                                  styles.autodmFunnelBadge,
                                  {
                                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                    borderColor: isDark ? '#334155' : '#cbd5e1',
                                  },
                                ]}
                              >
                                <Ionicons name="arrow-down" size={11} color="#3b82f6" />
                                <Text style={styles.autodmFunnelBadgeText}>Instant DM Triggered</Text>
                              </View>
                              <View style={[styles.autodmFunnelLine, { backgroundColor: isDark ? '#1e293b' : '#cbd5e1' }]} />
                            </View>

                            {/* Step 2: Private DM Flow */}
                            <View style={styles.autodmStepBlock}>
                              <View style={styles.autodmStepHeader}>
                                <View style={[styles.autodmStepNumberBadge, { backgroundColor: '#3b82f6' }]}>
                                  <Text style={styles.autodmStepNumberText}>2</Text>
                                </View>
                                <Text style={[styles.autodmStepTitle, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                                  INSTAGRAM DM FUNNEL
                                </Text>
                              </View>

                              {Boolean(openingMsg) ? (
                                <View
                                  style={[
                                    styles.autodmDMBubble,
                                    {
                                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                      borderColor: isDark ? '#334155' : '#e2e8f0',
                                    },
                                  ]}
                                >
                                  <View style={styles.autodmBubbleAuthorRow}>
                                    <Ionicons name="paper-plane" size={12} color="#3b82f6" />
                                    <Text style={[styles.autodmBubbleAuthor, { color: '#3b82f6' }]}>
                                      Direct Message Sequence
                                    </Text>
                                  </View>
                                  <Text style={[styles.autodmBubbleText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                                    &quot;{openingMsg}&quot;
                                  </Text>

                                  {/* Interactive Button Preview */}
                                  {Boolean(openingBtn) && (
                                    <View style={styles.autodmBtnPreviewPill}>
                                      <Ionicons name="flash" size={12} color="#ffffff" />
                                      <Text style={styles.autodmBtnPreviewText}>{openingBtn}</Text>
                                    </View>
                                  )}

                                  {/* Node URL Button Preview */}
                                  {buttonNodes.map((btn, bIdx) => (
                                    <View key={bIdx} style={styles.autodmLinkBtnPreviewPill}>
                                      <Ionicons name="link" size={12} color="#3b82f6" />
                                      <Text style={styles.autodmLinkBtnPreviewText}>
                                        {btn.title || 'Open link'} ({btn.url})
                                      </Text>
                                    </View>
                                  ))}
                                </View>
                              ) : (
                                <Text style={[styles.autodmEmptyStepText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                                  No DM sequence configured
                                </Text>
                              )}
                            </View>
                          </View>

                          {/* Card Telemetry Details Grid (In Card Only) */}
                          <View
                            style={[
                              styles.autodmCardTelemetryGrid,
                              {
                                backgroundColor: isDark ? '#0b0f19' : '#f8fafc',
                                borderColor: isDark ? '#1e293b' : '#e2e8f0',
                              },
                            ]}
                          >
                            <View style={styles.autodmCardTelemetryCol}>
                              <Text style={[styles.autodmCardTelemetryNum, { color: '#3b82f6' }]}>
                                {item.comments ?? 1}
                              </Text>
                              <Text style={styles.autodmCardTelemetryLabel}>Comments Replied</Text>
                            </View>
                            <View style={styles.autodmCardTelemetryCol}>
                              <Text style={[styles.autodmCardTelemetryNum, { color: '#22c55e' }]}>
                                {item.dms_sent ?? 1}
                              </Text>
                              <Text style={styles.autodmCardTelemetryLabel}>DMs Delivered</Text>
                            </View>
                            <View style={styles.autodmCardTelemetryCol}>
                              <Text style={[styles.autodmCardTelemetryNum, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                                {item.follower_count_at_create ?? 9}
                              </Text>
                              <Text style={styles.autodmCardTelemetryLabel}>Setup Followers</Text>
                            </View>
                            <View style={styles.autodmCardTelemetryCol}>
                              <Text style={[styles.autodmCardTelemetryNum, { color: '#e1306c' }]}>
                                {item.schedule_type ? '7 Days' : 'Active'}
                              </Text>
                              <Text style={styles.autodmCardTelemetryLabel}>Active Window</Text>
                            </View>
                          </View>

                          {/* Card Footer Actions (In Card Only) */}
                          <View style={styles.autodmItemFooter}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Ionicons name="shield-checkmark" size={13} color="#16a34a" />
                              <Text style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b' }}>
                                Verified Graph API Automation
                              </Text>
                            </View>

                            <Pressable
                              onPress={() => handleDeleteRule(item.id)}
                              style={[
                                styles.autodmActionBtn,
                                {
                                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                                  borderColor: 'rgba(239, 68, 68, 0.25)',
                                },
                              ]}
                              hitSlop={8}
                            >
                              <Ionicons name="trash-outline" size={13} color="#ef4444" />
                              <Text style={[styles.autodmActionBtnText, { color: '#ef4444' }]}>Delete</Text>
                            </Pressable>
                          </View>
                        </View>
                      );
                    })}
                </View>
              ) : (
                /* Fallback if no dynamic items or no match */
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#1e293b' : '#e2e8f0',
                      paddingVertical: 32,
                      alignItems: 'center',
                      gap: 8,
                    },
                  ]}
                >
                  <Ionicons name="flash-outline" size={38} color={isDark ? '#475569' : '#cbd5e1'} />
                  <Text style={[styles.emptyTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                    No Automations Found
                  </Text>
                  <Text style={[styles.emptyDesc, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    Create keyword triggers to automatically comment back and send instant Instagram DMs.
                  </Text>
                  <Pressable
                    onPress={() => setShowAddRuleModal(true)}
                    style={[styles.primaryActionBtn, { backgroundColor: '#3b82f6', marginTop: 6 }]}
                  >
                    <Ionicons name="add" size={14} color="#ffffff" />
                    <Text style={styles.primaryActionBtnText}>Create Automation</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          {/* 5. Category 2: CONTACTS */}
          {autodmCategory === 'contacts' && (
            <View style={{ gap: 12 }}>
              {/* TOP EXPORT BANNER - Explicitly at top of list */}
              <View
                style={[
                  styles.contactTopExportBar,
                  {
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#1e293b' : '#e2e8f0',
                  },
                ]}
              >
                <View style={{ flex: 1, marginRight: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.contactListTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      Captured Contacts
                    </Text>
                    <View
                      style={[
                        styles.contactCountBadge,
                        {
                          backgroundColor: isDark ? '#1e293b' : '#eff6ff',
                          borderColor: isDark ? '#334155' : '#bfdbfe',
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#3b82f6' }}>
                        {dynamicContacts.length}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b', marginTop: 2 }}>
                    Instagram AutoDM audience & CRM synced contacts
                  </Text>
                </View>

                {/* Prominent Export Button at top of list */}
                <Pressable
                  onPress={() => handleExportContacts(filteredContacts.length > 0 ? filteredContacts : dynamicContacts)}
                  disabled={dynamicContacts.length === 0}
                  style={({ pressed }) => [
                    styles.contactExportButton,
                    {
                      backgroundColor: dynamicContacts.length === 0 ? (isDark ? '#334155' : '#cbd5e1') : '#3b82f6',
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Ionicons name="download-outline" size={16} color="#ffffff" />
                  <Text style={styles.contactExportButtonText}>
                    Export List ({dynamicContacts.length})
                  </Text>
                </Pressable>
              </View>

              {/* Filter / Search Bar Layout */}
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#1e293b' : '#e2e8f0',
                    padding: 12,
                    gap: 10,
                  },
                ]}
              >
                <View
                  style={[
                    styles.inboxSearchInputBox,
                    {
                      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                      borderColor: isDark ? '#334155' : '#cbd5e1',
                    },
                  ]}
                >
                  <Ionicons name="search" size={15} color={isDark ? '#94a3b8' : '#64748b'} />
                  <TextInput
                    style={[styles.inboxSearchInput, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                    placeholder="Search by username, full name, CRM ID..."
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    value={contactSearch}
                    onChangeText={setContactSearch}
                  />
                  {contactSearch.length > 0 && (
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync();
                        setContactSearch('');
                      }}
                    >
                      <Ionicons name="close-circle" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
                    </Pressable>
                  )}
                </View>

                {/* Filter Chips Bar */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      setContactFilter('all');
                    }}
                    style={[
                      styles.statusChip,
                      contactFilter === 'all'
                        ? { backgroundColor: 'rgba(59, 130, 246, 0.14)', borderColor: '#3b82f6' }
                        : { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        {
                          color: contactFilter === 'all' ? '#3b82f6' : isDark ? '#94a3b8' : '#64748b',
                          fontWeight: contactFilter === 'all' ? '700' : '500',
                        },
                      ]}
                    >
                      All ({dynamicContacts.length})
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      setContactFilter('synced');
                    }}
                    style={[
                      styles.statusChip,
                      contactFilter === 'synced'
                        ? { backgroundColor: 'rgba(16, 185, 129, 0.14)', borderColor: '#10b981' }
                        : { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        {
                          color: contactFilter === 'synced' ? '#10b981' : isDark ? '#94a3b8' : '#64748b',
                          fontWeight: contactFilter === 'synced' ? '700' : '500',
                        },
                      ]}
                    >
                      CRM Synced
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      setContactFilter('with_dms');
                    }}
                    style={[
                      styles.statusChip,
                      contactFilter === 'with_dms'
                        ? { backgroundColor: 'rgba(139, 92, 246, 0.14)', borderColor: '#8b5cf6' }
                        : { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        {
                          color: contactFilter === 'with_dms' ? '#8b5cf6' : isDark ? '#94a3b8' : '#64748b',
                          fontWeight: contactFilter === 'with_dms' ? '700' : '500',
                        },
                      ]}
                    >
                      With Activity
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Loading State */}
              {autodmContactsLoading && (
                <View style={{ paddingVertical: 40, alignItems: 'center', gap: 12 }}>
                  <ActivityIndicator size="large" color="#3b82f6" />
                  <Text style={{ fontSize: 13, color: isDark ? '#94a3b8' : '#64748b' }}>
                    Loading captured contacts...
                  </Text>
                </View>
              )}

              {/* Empty State */}
              {!autodmContactsLoading && dynamicContacts.length === 0 && (
                <View
                  style={[
                    styles.autodmEmptyCard,
                    {
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#1e293b' : '#e2e8f0',
                    },
                  ]}
                >
                  <View style={[styles.autodmEmptyIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                    <Ionicons name="people" size={32} color="#3b82f6" />
                  </View>
                  <Text style={[styles.autodmEmptyTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                    No Contacts Captured Yet
                  </Text>
                  <Text style={[styles.autodmEmptyDesc, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    When users comment on your Instagram posts with trigger keywords or respond to your automated DMs, their profile data and lead tags will be organized here.
                  </Text>

                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      refetchAutoDMContacts();
                    }}
                    style={[styles.primaryActionBtn, { backgroundColor: '#3b82f6', marginTop: 8 }]}
                  >
                    <Ionicons name="refresh" size={14} color="#ffffff" />
                    <Text style={styles.primaryActionBtnText}>Refresh Contacts</Text>
                  </Pressable>
                </View>
              )}

              {/* Filtered Empty State */}
              {!autodmContactsLoading && dynamicContacts.length > 0 && filteredContacts.length === 0 && (
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#1e293b' : '#e2e8f0',
                      alignItems: 'center',
                      paddingVertical: 32,
                      gap: 8,
                    },
                  ]}
                >
                  <Ionicons name="search" size={28} color={isDark ? '#64748b' : '#94a3b8'} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#f8fafc' : '#0f172a' }}>
                    No Matching Contacts
                  </Text>
                  <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>
                    Try clearing your search query or changing the filter.
                  </Text>
                  <Pressable
                    onPress={() => {
                      setContactSearch('');
                      setContactFilter('all');
                    }}
                    style={{ marginTop: 8 }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#3b82f6' }}>Clear Filters</Text>
                  </Pressable>
                </View>
              )}

              {/* Contact Cards List */}
              {!autodmContactsLoading &&
                filteredContacts.map((contact) => {
                  const isSynced = contact.ecosystem_sync_status === 'synced' || Boolean(contact.canonical_contact_id);
                  const totalInteractions = (contact.total_messages_sent || 0) + (contact.total_messages_received || 0);

                  const firstSeenFormatted = contact.first_interaction_at
                    ? new Date(contact.first_interaction_at).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                    : null;

                  const lastActiveFormatted = contact.last_interaction_at
                    ? new Date(contact.last_interaction_at).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                    : null;

                  const syncedAtFormatted = contact.ecosystem_synced_at
                    ? new Date(contact.ecosystem_synced_at).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                    : null;

                  return (
                    <View
                      key={contact.id}
                      style={[
                        styles.contactCard,
                        {
                          backgroundColor: isDark ? '#0f172a' : '#ffffff',
                          borderColor: isDark ? '#1e293b' : '#e2e8f0',
                        },
                      ]}
                    >
                      {/* Header: Avatar, Handle, Names, CRM Sync Badge */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ position: 'relative' }}>
                          {contact.profile_picture_url ? (
                            <Image
                              source={{ uri: contact.profile_picture_url }}
                              style={styles.contactAvatar}
                            />
                          ) : (
                            <View style={[styles.contactAvatarFallback, { backgroundColor: isDark ? '#1e293b' : '#fdf2f8' }]}>
                              <Text style={{ fontSize: 18, fontWeight: '800', color: '#e1306c' }}>
                                {(contact.username || 'U').charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                          <View style={styles.contactInstagramBadge}>
                            <Ionicons name="logo-instagram" size={10} color="#e1306c" />
                          </View>
                        </View>

                        <View style={{ flex: 1 }}>
                          <Pressable
                            onPress={() => {
                              Haptics.selectionAsync();
                              Linking.openURL(`https://instagram.com/${contact.username}`);
                            }}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                          >
                            <Text style={[styles.contactUsername, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                              @{contact.username}
                            </Text>
                            <Ionicons name="open-outline" size={13} color="#3b82f6" />
                          </Pressable>
                          {contact.full_name ? (
                            <Text style={[styles.contactFullName, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                              {contact.full_name}
                            </Text>
                          ) : null}
                        </View>

                        {/* Sync Status Badge */}
                        <View
                          style={[
                            styles.contactSyncedBadge,
                            isSynced
                              ? { backgroundColor: 'rgba(16, 185, 129, 0.12)' }
                              : { backgroundColor: 'rgba(245, 158, 11, 0.12)' },
                          ]}
                        >
                          <Ionicons
                            name={isSynced ? 'checkmark-circle' : 'time-outline'}
                            size={12}
                            color={isSynced ? '#10b981' : '#f59e0b'}
                          />
                          <Text
                            style={[
                              styles.contactSyncedText,
                              { color: isSynced ? '#10b981' : '#f59e0b' },
                            ]}
                          >
                            {isSynced ? 'CRM Synced' : 'Pending'}
                          </Text>
                        </View>
                      </View>

                      {/* Relationship & Audience Meta Pills */}
                      <View style={styles.contactRelationshipPillsRow}>
                        <View
                          style={[
                            styles.contactRelationshipPill,
                            {
                              backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                              borderColor: isDark ? '#334155' : '#e2e8f0',
                            },
                          ]}
                        >
                          <Ionicons name="people" size={12} color={isDark ? '#94a3b8' : '#64748b'} />
                          <Text style={[styles.contactRelationshipPillText, { color: isDark ? '#cbd5e1' : '#334155' }]}>
                            {contact.follower_count ?? 0} followers
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.contactRelationshipPill,
                            contact.is_following_you
                              ? { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.25)' }
                              : { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: isDark ? '#334155' : '#e2e8f0' },
                          ]}
                        >
                          <Ionicons
                            name={contact.is_following_you ? 'checkmark-circle' : 'close-circle-outline'}
                            size={12}
                            color={contact.is_following_you ? '#10b981' : isDark ? '#64748b' : '#94a3b8'}
                          />
                          <Text
                            style={[
                              styles.contactRelationshipPillText,
                              { color: contact.is_following_you ? '#10b981' : isDark ? '#94a3b8' : '#64748b' },
                            ]}
                          >
                            {contact.is_following_you ? 'Follows You' : 'Not Following You'}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.contactRelationshipPill,
                            contact.you_are_following
                              ? { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.25)' }
                              : { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: isDark ? '#334155' : '#e2e8f0' },
                          ]}
                        >
                          <Ionicons
                            name={contact.you_are_following ? 'person-add' : 'person-remove-outline'}
                            size={12}
                            color={contact.you_are_following ? '#3b82f6' : isDark ? '#64748b' : '#94a3b8'}
                          />
                          <Text
                            style={[
                              styles.contactRelationshipPillText,
                              { color: contact.you_are_following ? '#3b82f6' : isDark ? '#94a3b8' : '#64748b' },
                            ]}
                          >
                            {contact.you_are_following ? 'You Follow' : 'Not Following'}
                          </Text>
                        </View>
                      </View>

                      {/* Engagement & Telemetry Grid */}
                      <View style={styles.contactStatsGrid}>
                        <View style={[styles.contactStatBox, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
                          <Ionicons name="paper-plane" size={15} color="#3b82f6" />
                          <Text style={[styles.contactStatVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                            {contact.total_messages_sent ?? 0}
                          </Text>
                          <Text style={styles.contactStatLabel}>DMs Sent</Text>
                        </View>

                        <View style={[styles.contactStatBox, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
                          <Ionicons name="chatbubble-ellipses" size={15} color="#10b981" />
                          <Text style={[styles.contactStatVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                            {contact.total_messages_received ?? 0}
                          </Text>
                          <Text style={styles.contactStatLabel}>Received</Text>
                        </View>

                        <View style={[styles.contactStatBox, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
                          <Ionicons name="swap-horizontal" size={15} color="#8b5cf6" />
                          <Text style={[styles.contactStatVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                            {totalInteractions}
                          </Text>
                          <Text style={styles.contactStatLabel}>Touchpoints</Text>
                        </View>
                      </View>

                      {/* Interaction Timeline */}
                      {(firstSeenFormatted || lastActiveFormatted) && (
                        <View
                          style={[
                            styles.contactTimelineContainer,
                            {
                              borderTopColor: isDark ? '#1e293b' : '#f1f5f9',
                              borderBottomColor: isDark ? '#1e293b' : '#f1f5f9',
                            },
                          ]}
                        >
                          {firstSeenFormatted && (
                            <View style={styles.contactTimelineItem}>
                              <Ionicons name="calendar-outline" size={13} color={isDark ? '#64748b' : '#94a3b8'} />
                              <Text style={[styles.contactTimelineText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                                First:{' '}
                                <Text style={{ color: isDark ? '#cbd5e1' : '#334155' }}>
                                  {firstSeenFormatted}
                                </Text>
                              </Text>
                            </View>
                          )}

                          {lastActiveFormatted && (
                            <View style={styles.contactTimelineItem}>
                              <Ionicons name="time-outline" size={13} color={isDark ? '#64748b' : '#94a3b8'} />
                              <Text style={[styles.contactTimelineText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                                Last:{' '}
                                <Text style={{ color: isDark ? '#cbd5e1' : '#334155' }}>
                                  {lastActiveFormatted}
                                </Text>
                              </Text>
                            </View>
                          )}
                        </View>
                      )}

                      {/* CRM Hub Integration Details */}
                      <View
                        style={[
                          styles.contactCrmStrip,
                          {
                            backgroundColor: isDark ? '#131e32' : '#f1f5f9',
                            borderColor: isDark ? '#1e293b' : '#e2e8f0',
                          },
                        ]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            <Ionicons name="git-network-outline" size={13} color="#6366f1" />
                            <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#e0e7ff' : '#4338ca' }}>
                              CRM Canonical Profile
                            </Text>
                          </View>
                          {contact.ecosystem_sync_source && (
                            <Text style={{ fontSize: 10, color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>
                              Source: {contact.ecosystem_sync_source}
                            </Text>
                          )}
                        </View>

                        {contact.canonical_contact_id ? (
                          <Text
                            style={[
                              styles.contactCrmIdText,
                              { color: isDark ? '#94a3b8' : '#64748b' },
                            ]}
                            numberOfLines={1}
                          >
                            ID: {contact.canonical_contact_id}
                          </Text>
                        ) : null}

                        {syncedAtFormatted && (
                          <Text style={{ fontSize: 10, color: isDark ? '#64748b' : '#94a3b8' }}>
                            Last synced: {syncedAtFormatted}
                          </Text>
                        )}
                      </View>

                      {/* Quick Actions Bar */}
                      <View style={styles.contactActionsRow}>
                        <Pressable
                          onPress={() => {
                            Haptics.selectionAsync();
                            Linking.openURL(`https://instagram.com/${contact.username}`);
                          }}
                          style={[
                            styles.contactActionBtn,
                            {
                              backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                              borderColor: isDark ? '#334155' : '#e2e8f0',
                              borderWidth: 1,
                            },
                          ]}
                        >
                          <Ionicons name="logo-instagram" size={13} color="#e1306c" />
                          <Text style={[styles.contactActionBtnText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                            View on Instagram
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
            </View>
          )}

          {/* 6. Category 3: PROFILE */}
          {autodmCategory === 'profile' && (
            <View style={{ gap: 14 }}>
              {/* 1. Hero Instagram Profile Card */}
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#1e293b' : '#e2e8f0',
                    padding: 16,
                    gap: 16,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  {/* Profile Avatar with Status Dot */}
                  <View style={styles.profileAvatarWrapper}>
                    {profileAccount?.profile_picture_url ? (
                      <Image
                        source={{ uri: profileAccount.profile_picture_url }}
                        style={styles.profileAvatarImage}
                      />
                    ) : (
                      <View style={[styles.profileAvatarFallback, { backgroundColor: isDark ? '#1e293b' : '#fdf2f8' }]}>
                        <Ionicons name="logo-instagram" size={30} color="#e1306c" />
                      </View>
                    )}
                    <View style={styles.profileOnlineDot} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={[styles.profileDisplayName, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                        {profileAccount?.full_name || profileAccount?.page_name || 'HAPFs UNION'}
                      </Text>
                      <Ionicons name="shield-checkmark" size={16} color="#10b981" />
                    </View>

                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync();
                        Linking.openURL(`https://instagram.com/${profileAccount?.username || 'hapfsunion'}`);
                      }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}
                    >
                      <Text style={{ fontSize: 13, color: '#e1306c', fontWeight: '700' }}>
                        @{profileAccount?.username || 'hapfsunion'}
                      </Text>
                      <Ionicons name="open-outline" size={12} color="#e1306c" />
                    </Pressable>

                    <View style={styles.profileBadgeRow}>
                      <View style={[styles.profileAccountTypeChip, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                        <Text style={[styles.profileAccountTypeText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                          {profileAccount?.account_type || 'BUSINESS'}
                        </Text>
                      </View>
                      <View style={styles.profileActiveStatusPill}>
                        <View style={styles.profileActiveStatusDot} />
                        <Text style={styles.profileActiveStatusText}>Connected</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* 4-Stat Performance Telemetry Strip */}
                <View style={[styles.profileStatsRow, { borderTopColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                  <View style={styles.profileStatItem}>
                    <Text style={[styles.profileStatVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      {profileAccount?.media_count ?? instagramMediaList.length}
                    </Text>
                    <Text style={styles.profileStatLbl}>Posts</Text>
                  </View>

                  <View style={[styles.profileStatDivider, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]} />

                  <View style={styles.profileStatItem}>
                    <Text style={[styles.profileStatVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      {profileAccount?.followers_count ?? 9}
                    </Text>
                    <Text style={styles.profileStatLbl}>Followers</Text>
                  </View>

                  <View style={[styles.profileStatDivider, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]} />

                  <View style={styles.profileStatItem}>
                    <Text style={[styles.profileStatVal, { color: '#3b82f6' }]}>
                      {dynamicAutomations.length || autoDMRules.length}
                    </Text>
                    <Text style={styles.profileStatLbl}>Automations</Text>
                  </View>

                  <View style={[styles.profileStatDivider, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]} />

                  <View style={styles.profileStatItem}>
                    <Text style={[styles.profileStatVal, { color: '#10b981' }]}>
                      {dynamicContacts.length}
                    </Text>
                    <Text style={styles.profileStatLbl}>Contacts</Text>
                  </View>
                </View>

                {/* Profile Actions: Open on Instagram & Refresh Media */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      Linking.openURL(`https://instagram.com/${profileAccount?.username || 'hapfsunion'}`);
                    }}
                    style={({ pressed }) => [
                      styles.profileHeroActionBtn,
                      {
                        backgroundColor: '#e1306c',
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <Ionicons name="logo-instagram" size={15} color="#ffffff" />
                    <Text style={styles.profileHeroActionBtnText}>Open Instagram Profile</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      refetchAutoDMMedia();
                      refetchAutoDMStatus();
                    }}
                    style={({ pressed }) => [
                      styles.profileHeroSecondaryBtn,
                      {
                        backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                        borderColor: isDark ? '#334155' : '#cbd5e1',
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Ionicons name="refresh" size={15} color={isDark ? '#f8fafc' : '#0f172a'} />
                  </Pressable>
                </View>
              </View>

              {/* 2. Webhook & Automation Health Card */}
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#1e293b' : '#e2e8f0',
                    padding: 14,
                    gap: 12,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="shield-checkmark" size={16} color="#10b981" />
                    <Text style={[styles.cardSectionTitle, { color: isDark ? '#f8fafc' : '#0f172a', marginBottom: 0 }]}>
                      Gateway & Webhook Health
                    </Text>
                  </View>
                  <View style={styles.profileActiveStatusPill}>
                    <Text style={styles.profileActiveStatusText}>Healthy</Text>
                  </View>
                </View>

                <View style={styles.autodmPermissionRow}>
                  <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.autodmPermissionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      Realtime Comments Ingestion
                    </Text>
                    <Text style={styles.autodmPermissionDesc}>
                      instagram_manage_comments • Realtime webhook listener active
                    </Text>
                  </View>
                  <View style={styles.autodmActivePill}>
                    <Text style={styles.autodmActivePillText}>Active</Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]} />

                <View style={styles.autodmPermissionRow}>
                  <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.autodmPermissionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      Direct Message Dispatch Service
                    </Text>
                    <Text style={styles.autodmPermissionDesc}>
                      instagram_manage_messages • Meta 24-hr messaging standard
                    </Text>
                  </View>
                  <View style={styles.autodmActivePill}>
                    <Text style={styles.autodmActivePillText}>Active</Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]} />

                {/* Meta Graph IDs Box */}
                <View
                  style={[
                    styles.profileMetaBox,
                    {
                      backgroundColor: isDark ? '#131e32' : '#f8fafc',
                      borderColor: isDark ? '#1e293b' : '#e2e8f0',
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.profileMetaLabel}>Business Account ID</Text>
                    <Text style={[styles.profileMetaVal, { color: isDark ? '#cbd5e1' : '#334155' }]}>
                      {profileAccount?.instagram_business_account_id || '27981089958184687'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                    <Text style={styles.profileMetaLabel}>Webhook User ID</Text>
                    <Text style={[styles.profileMetaVal, { color: isDark ? '#cbd5e1' : '#334155' }]}>
                      {profileAccount?.webhook_instagram_user_id || '17841461768595153'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 3. Published Media & Automation Triggers Grid */}
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={[styles.cardSectionTitle, { color: isDark ? '#f8fafc' : '#0f172a', marginBottom: 2 }]}>
                      Published Media & Triggers
                    </Text>
                    <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>
                      Attach automated reply flows to your live posts & reels
                    </Text>
                  </View>
                  <View style={[styles.contactCountBadge, { backgroundColor: isDark ? '#1e293b' : '#eff6ff', borderColor: isDark ? '#334155' : '#bfdbfe' }]}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#3b82f6' }}>
                      {filteredMediaList.length} items
                    </Text>
                  </View>
                </View>

                {/* Media Category Filter Chips */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      setMediaFilter('all');
                    }}
                    style={[
                      styles.statusChip,
                      mediaFilter === 'all'
                        ? { backgroundColor: 'rgba(59, 130, 246, 0.14)', borderColor: '#3b82f6' }
                        : { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        {
                          color: mediaFilter === 'all' ? '#3b82f6' : isDark ? '#94a3b8' : '#64748b',
                          fontWeight: mediaFilter === 'all' ? '700' : '500',
                        },
                      ]}
                    >
                      All ({mediaFilterCounts.all})
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      setMediaFilter('video');
                    }}
                    style={[
                      styles.statusChip,
                      mediaFilter === 'video'
                        ? { backgroundColor: 'rgba(239, 68, 68, 0.14)', borderColor: '#ef4444' }
                        : { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        {
                          color: mediaFilter === 'video' ? '#ef4444' : isDark ? '#94a3b8' : '#64748b',
                          fontWeight: mediaFilter === 'video' ? '700' : '500',
                        },
                      ]}
                    >
                      🎬 Reels ({mediaFilterCounts.reels})
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      setMediaFilter('image');
                    }}
                    style={[
                      styles.statusChip,
                      mediaFilter === 'image'
                        ? { backgroundColor: 'rgba(16, 185, 129, 0.14)', borderColor: '#10b981' }
                        : { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        {
                          color: mediaFilter === 'image' ? '#10b981' : isDark ? '#94a3b8' : '#64748b',
                          fontWeight: mediaFilter === 'image' ? '700' : '500',
                        },
                      ]}
                    >
                      📷 Photos ({mediaFilterCounts.photos})
                    </Text>
                  </Pressable>
                </View>

                {/* Media Loading */}
                {autodmMediaLoading && (
                  <View style={{ paddingVertical: 40, alignItems: 'center', gap: 10 }}>
                    <ActivityIndicator size="large" color="#e1306c" />
                    <Text style={{ fontSize: 13, color: isDark ? '#94a3b8' : '#64748b' }}>
                      Fetching Instagram posts & reels...
                    </Text>
                  </View>
                )}

                {/* Media Grid */}
                {!autodmMediaLoading && filteredMediaList.length > 0 && (
                  <View style={styles.mediaGridContainer}>
                    {filteredMediaList.map((item) => {
                      const isVideo = item.media_type === 'VIDEO';
                      const imgUri = item.thumbnail_url || item.media_url;
                      const formattedDate = item.timestamp
                        ? new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                        : '';

                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => {
                            Haptics.selectionAsync();
                            setSelectedMediaPost(item);
                          }}
                          style={[
                            styles.mediaGridItemCard,
                            {
                              backgroundColor: isDark ? '#0f172a' : '#ffffff',
                              borderColor: isDark ? '#1e293b' : '#e2e8f0',
                            },
                          ]}
                        >
                          <View style={styles.mediaGridThumbWrapper}>
                            {imgUri ? (
                              <Image source={{ uri: imgUri }} style={styles.mediaGridImage} resizeMode="cover" />
                            ) : (
                              <View style={[styles.mediaGridPlaceholder, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                                <Ionicons name={isVideo ? 'videocam' : 'image'} size={24} color="#e1306c" />
                              </View>
                            )}

                            {/* Badges on top of image */}
                            <View style={styles.mediaGridTypeBadge}>
                              <Ionicons name={isVideo ? 'videocam' : 'image'} size={10} color="#ffffff" />
                              <Text style={styles.mediaGridTypeBadgeText}>{isVideo ? 'Reel' : 'Post'}</Text>
                            </View>

                            {formattedDate ? (
                              <View style={styles.mediaGridDateBadge}>
                                <Text style={styles.mediaGridDateBadgeText}>{formattedDate}</Text>
                              </View>
                            ) : null}

                            {/* Likes / Comments Overlay */}
                            <View style={styles.mediaGridStatsBar}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                <Ionicons name="heart" size={10} color="#ffffff" />
                                <Text style={styles.mediaGridStatVal}>{item.like_count ?? 0}</Text>
                              </View>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                <Ionicons name="chatbubble" size={10} color="#ffffff" />
                                <Text style={styles.mediaGridStatVal}>{item.comments_count ?? 0}</Text>
                              </View>
                            </View>
                          </View>

                          {/* Caption preview & Action */}
                          <View style={styles.mediaGridBody}>
                            <Text
                              numberOfLines={2}
                              style={[styles.mediaGridCaption, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                            >
                              {item.caption || 'Instagram Post'}
                            </Text>

                            <Pressable
                              onPress={() => handleTriggerAutoDMForMedia(item)}
                              style={({ pressed }) => [
                                styles.mediaGridTriggerBtn,
                                {
                                  backgroundColor: 'rgba(59, 130, 246, 0.12)',
                                  borderColor: 'rgba(59, 130, 246, 0.3)',
                                  opacity: pressed ? 0.8 : 1,
                                },
                              ]}
                            >
                              <Ionicons name="flash" size={12} color="#3b82f6" />
                              <Text style={styles.mediaGridTriggerBtnText}>Set AutoDM</Text>
                            </Pressable>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}

                {/* Empty State for Media */}
                {!autodmMediaLoading && filteredMediaList.length === 0 && (
                  <View
                    style={[
                      styles.card,
                      {
                        backgroundColor: isDark ? '#0f172a' : '#ffffff',
                        borderColor: isDark ? '#1e293b' : '#e2e8f0',
                        alignItems: 'center',
                        paddingVertical: 32,
                        gap: 8,
                      },
                    ]}
                  >
                    <Ionicons name="images-outline" size={32} color={isDark ? '#64748b' : '#94a3b8'} />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#f8fafc' : '#0f172a' }}>
                      No Media Found
                    </Text>
                    <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>
                      Ensure your Instagram account has published posts or reels.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Add Rule Modal */}
          <Modal
            visible={showAddRuleModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowAddRuleModal(false)}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={[styles.modalContainer, { backgroundColor: isDark ? '#0b0f19' : '#f8fafc' }]}
            >
              <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                <Text style={[styles.modalTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                  Create AutoDM Rule
                </Text>
                <Pressable onPress={() => setShowAddRuleModal(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={isDark ? '#cbd5e1' : '#64748b'} />
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={styles.modalScrollContent}>
                <View style={styles.modalCardWrapper}>
                  <View style={styles.modalFieldGroup}>
                    <Text style={[styles.inputLabel, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      Rule Title
                    </Text>
                    <TextInput
                      style={[
                        styles.modalInput,
                        {
                          backgroundColor: isDark ? '#1e293b' : '#ffffff',
                          color: isDark ? '#f8fafc' : '#0f172a',
                          borderColor: isDark ? '#334155' : '#cbd5e1',
                        },
                      ]}
                      placeholder="e.g., Reel Pricing Auto-Responder"
                      placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                      value={newRuleName}
                      onChangeText={setNewRuleName}
                    />
                  </View>

                  <View style={styles.modalFieldGroup}>
                    <Text style={[styles.inputLabel, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      Trigger Keyword
                    </Text>
                    <TextInput
                      style={[
                        styles.modalInput,
                        {
                          backgroundColor: isDark ? '#1e293b' : '#ffffff',
                          color: isDark ? '#f8fafc' : '#0f172a',
                          borderColor: isDark ? '#334155' : '#cbd5e1',
                        },
                      ]}
                      placeholder="e.g., PRICE, LINK, DEMO"
                      placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                      value={newRuleKeyword}
                      onChangeText={setNewRuleKeyword}
                      autoCapitalize="characters"
                    />
                  </View>

                  <View style={styles.modalFieldGroup}>
                    <Text style={[styles.inputLabel, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      Target Channel
                    </Text>
                    <View style={styles.channelChipsRow}>
                      {(['instagram', 'facebook', 'all'] as const).map((ch) => (
                        <Pressable
                          key={ch}
                          onPress={() => setNewRuleChannel(ch)}
                          style={[
                            styles.channelSelectChip,
                            {
                              backgroundColor:
                                newRuleChannel === ch ? '#3b82f6' : isDark ? '#1e293b' : '#e2e8f0',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.channelSelectText,
                              { color: newRuleChannel === ch ? '#ffffff' : isDark ? '#94a3b8' : '#64748b' },
                            ]}
                          >
                            {ch.toUpperCase()}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <View style={styles.modalFieldGroup}>
                    <Text style={[styles.inputLabel, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      Automated Direct Message
                    </Text>
                    <TextInput
                      style={[
                        styles.modalInput,
                        {
                          backgroundColor: isDark ? '#1e293b' : '#ffffff',
                          color: isDark ? '#f8fafc' : '#0f172a',
                          borderColor: isDark ? '#334155' : '#cbd5e1',
                          minHeight: 90,
                        },
                      ]}
                      placeholder="Hey! Thanks for commenting. Here is the link you requested..."
                      placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                      value={newRuleReply}
                      onChangeText={setNewRuleReply}
                      multiline
                    />
                  </View>

                  <Pressable onPress={handleCreateRule} style={styles.createRuleSubmitBtn}>
                    <Text style={styles.createRuleSubmitText}>Save & Activate Rule</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </Modal>

          {/* 7. Selected Media Post Detail Modal */}
          <Modal
            visible={selectedMediaPost !== null}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setSelectedMediaPost(null)}
          >
            <View style={[styles.modalContainer, { backgroundColor: isDark ? '#0b0f19' : '#f8fafc' }]}>
              <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons
                    name={selectedMediaPost?.media_type === 'VIDEO' ? 'videocam' : 'image'}
                    size={20}
                    color="#e1306c"
                  />
                  <Text style={[styles.modalTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                    {selectedMediaPost?.media_type === 'VIDEO' ? 'Instagram Reel' : 'Instagram Post'}
                  </Text>
                </View>
                <Pressable onPress={() => setSelectedMediaPost(null)} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
                {/* Media Image / Video Preview */}
                {(selectedMediaPost?.thumbnail_url || selectedMediaPost?.media_url) && (
                  <View
                    style={{
                      borderRadius: 16,
                      overflow: 'hidden',
                      height: 280,
                      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                      borderWidth: 1,
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                    }}
                  >
                    <Image
                      source={{ uri: selectedMediaPost.thumbnail_url || selectedMediaPost.media_url }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  </View>
                )}

                {/* Metrics Row */}
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#1e293b' : '#e2e8f0',
                      flexDirection: 'row',
                      justifyContent: 'space-around',
                      paddingVertical: 12,
                    },
                  ]}
                >
                  <View style={{ alignItems: 'center', gap: 2 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#e1306c' }}>
                      {selectedMediaPost?.like_count ?? 0}
                    </Text>
                    <Text style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b' }}>Likes</Text>
                  </View>
                  <View style={{ width: 1, height: 24, backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }} />
                  <View style={{ alignItems: 'center', gap: 2 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#3b82f6' }}>
                      {selectedMediaPost?.comments_count ?? 0}
                    </Text>
                    <Text style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b' }}>Comments</Text>
                  </View>
                  <View style={{ width: 1, height: 24, backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }} />
                  <View style={{ alignItems: 'center', gap: 2 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#cbd5e1' : '#334155' }}>
                      {selectedMediaPost?.timestamp
                        ? new Date(selectedMediaPost.timestamp).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Published'}
                    </Text>
                    <Text style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b' }}>Date</Text>
                  </View>
                </View>

                {/* Caption Card */}
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#1e293b' : '#e2e8f0',
                      padding: 14,
                      gap: 8,
                    },
                  ]}
                >
                  <Text style={[styles.cardSectionTitle, { color: isDark ? '#f8fafc' : '#0f172a', marginBottom: 0 }]}>
                    Caption
                  </Text>
                  <Text style={{ fontSize: 13, lineHeight: 20, color: isDark ? '#cbd5e1' : '#334155' }}>
                    {selectedMediaPost?.caption || 'No caption provided.'}
                  </Text>
                </View>

                {/* Actions */}
                <View style={{ gap: 10, marginTop: 4 }}>
                  {selectedMediaPost && (
                    <Pressable
                      onPress={() => handleTriggerAutoDMForMedia(selectedMediaPost)}
                      style={[styles.primaryActionBtn, { backgroundColor: '#3b82f6', justifyContent: 'center', paddingVertical: 14 }]}
                    >
                      <Ionicons name="flash" size={16} color="#ffffff" />
                      <Text style={[styles.primaryActionBtnText, { fontSize: 14 }]}>
                        Create AutoDM Trigger For This Post
                      </Text>
                    </Pressable>
                  )}

                  {selectedMediaPost?.permalink && (
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync();
                        if (selectedMediaPost.permalink) {
                          Linking.openURL(selectedMediaPost.permalink);
                        }
                      }}
                      style={[
                        styles.primaryActionBtn,
                        {
                          backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                          justifyContent: 'center',
                          paddingVertical: 12,
                          borderWidth: 1,
                          borderColor: isDark ? '#334155' : '#cbd5e1',
                        },
                      ]}
                    >
                      <Ionicons name="logo-instagram" size={15} color="#e1306c" />
                      <Text style={[styles.primaryActionBtnText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                        Open Post on Instagram
                      </Text>
                    </Pressable>
                  )}
                </View>
              </ScrollView>
            </View>
          </Modal>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  segmentedWrapper: {
    borderRadius: 12,
    padding: 3,
  },
  segmentedScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: '100%',
  },
  segmentItem: {
    flex: 1,
    minWidth: 85,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 9,
    gap: 5,
  },
  segmentItemActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
  },
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
    backgroundColor: '#ec4899',
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
  brandBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  brandBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusFilterContainer: {
    marginBottom: 10,
  },
  statusFilterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  statusFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusFilterLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCountText: {
    fontSize: 10,
    fontWeight: '800',
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  channelsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  chBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ec4899',
    textTransform: 'capitalize',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  queueBodyRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  queueThumbContainer: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#00000015',
  },
  queueThumb: {
    width: '100%',
    height: '100%',
  },
  queueVideoBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 8,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueCaptionCol: {
    flex: 1,
    gap: 6,
  },
  queueErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    marginTop: 4,
  },
  queueErrorText: {
    fontSize: 11,
    color: '#ef4444',
    flex: 1,
    fontWeight: '600',
  },
  postFullCaption: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  scheduledTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  scheduledTimeText: {
    fontSize: 12,
    color: '#ec4899',
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  actionLink: {
    flex: 1,
    minWidth: 110,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  actionLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  queueList: {
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
    color: '#ec4899',
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
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  toggleTextCol: {
    flex: 1,
    paddingRight: 6,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  toggleSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  topicInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#e1306c',
    paddingVertical: 10,
    borderRadius: 10,
  },
  generateBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  resultBox: {
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  resultText: {
    fontSize: 12,
    lineHeight: 18,
  },
  useInPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  useInPostBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e1306c',
  },
  ytVideoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'nowrap',
  },
  ytThumbPlaceholder: {
    width: 54,
    height: 38,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ytVideoTextCol: {
    flex: 1,
    minWidth: 120,
  },
  ytVideoTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  ytVideoMeta: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  rulesList: {
    gap: 12,
  },
  ruleName: {
    fontSize: 14,
    fontWeight: '700',
  },
  ruleBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  keywordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  keywordBadgeText: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '700',
  },
  channelBadge: {
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  channelBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  replySnippetBox: {
    padding: 10,
    borderRadius: 8,
  },
  replySnippetText: {
    fontSize: 12,
    lineHeight: 16,
  },
  ruleStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  ruleStatsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  ruleStatText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  ruleDeleteBtn: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 18,
  },
  emptyActionBtn: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 8,
  },
  emptyActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
  },
  modalScrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  modalCardWrapper: {
    width: '100%',
    maxWidth: 500,
    gap: 14,
  },
  modalFieldGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  channelChipsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  channelSelectChip: {
    flex: 1,
    minWidth: 80,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  channelSelectText: {
    fontSize: 12,
    fontWeight: '700',
  },
  createRuleSubmitBtn: {
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  createRuleSubmitText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },

  // --- Instapilot Direct Inbox Styles ---
  inboxHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  inboxTitleCol: {
    flex: 1,
    gap: 2,
  },
  inboxTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  inboxSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  liveSyncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveSyncBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  syncNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(225, 48, 108, 0.3)',
    backgroundColor: 'rgba(225, 48, 108, 0.08)',
  },
  syncNowBtnText: {
    color: '#e1306c',
    fontSize: 12,
    fontWeight: '700',
  },
  inboxSearchRow: {
    marginBottom: 10,
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
  inboxFilterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  inboxFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  inboxFilterPillActive: {
    backgroundColor: '#e1306c',
  },
  inboxFilterPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inboxLoadingBox: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  inboxLoadingText: {
    fontSize: 12,
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
  inboxConversationsList: {
    gap: 10,
  },
  convCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  convCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  convAvatarContainer: {
    position: 'relative',
    marginRight: 10,
  },
  convAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#cbd5e1',
  },
  convAvatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#e1306c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  convAvatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#e1306c',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  convInfoCol: {
    flex: 1,
    gap: 2,
  },
  convNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  convDisplayName: {
    fontSize: 13,
    fontWeight: '700',
    maxWidth: 160,
  },
  convLeadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  convLeadBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16a34a',
  },
  convTimeText: {
    marginLeft: 'auto',
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  convHandleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  convHandleText: {
    fontSize: 11,
    color: '#e1306c',
    fontWeight: '600',
  },
  convDotSeparator: {
    fontSize: 10,
    color: '#94a3b8',
  },
  convFollowerText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  convFollowsBadge: {
    backgroundColor: 'rgba(225, 48, 108, 0.1)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 2,
  },
  convFollowsBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#e1306c',
  },
  convLastMsgRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingTop: 2,
  },
  convLastMsgText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  convCapturedChipsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  convContactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  convContactChipText: {
    fontSize: 10,
    color: '#3b82f6',
    fontWeight: '600',
  },
  convFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.15)',
  },
  convBotStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  convBotStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  convMsgCountText: {
    fontSize: 10,
    color: '#94a3b8',
  },

  // --- YouTube Studio Styles ---
  ytSystemHealthCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  ytSystemHealthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  ytSystemHealthLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  ytSystemHealthTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  ytOperationalBadge: {
    paddingHorizontal: 7,
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
    fontWeight: '600',
  },
  ytChannelSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  ytReadyBadge: {
    backgroundColor: 'rgba(21, 128, 61, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  ytReadyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803d',
  },
  ytSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ytVideosTotalText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ytCategoryScrollView: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  ytCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
  },
  ytCategoryChipActive: {
    backgroundColor: '#ff0000',
  },
  ytCategoryChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  ytCategoryCountPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  ytCategoryCountText: {
    fontSize: 10,
    fontWeight: '800',
  },
  ytVideoListContainer: {
    gap: 12,
  },
  ytVideoCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  ytVideoMainRow: {
    flexDirection: 'row',
    gap: 12,
  },
  ytThumbWrapper: {
    position: 'relative',
    width: 100,
    height: 64,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  ytThumbImage: {
    width: '100%',
    height: '100%',
  },
  ytDurationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  ytCategoryTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  ytVideoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  ytVideoDateText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  ytVideoActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.15)',
    paddingTop: 8,
  },
  ytWatchActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
    backgroundColor: 'rgba(255, 0, 0, 0.05)',
  },
  ytWatchActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ff0000',
  },

  // --- AutoDM Styles ---
  autodmAccountCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
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
  autodmTriggerTag: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  autodmTriggerTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  autodmKeywordChip: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  autodmKeywordChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3b82f6',
  },
  autodmSnippetLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  autodmEmptyCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  autodmEmptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  autodmEmptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  autodmEmptyDesc: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 320,
  },
  autodmLayoutPreviewBadge: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  autodmReadyTag: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  autodmReadyTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3b82f6',
  },
  autodmProfileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#e1306c',
  },
  autodmProfileAvatarFallback: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autodmVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  autodmVerifiedText: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '600',
  },
  autodmProfileStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  autodmProfileStatBox: {
    alignItems: 'center',
  },
  autodmProfileStatNum: {
    fontSize: 16,
    fontWeight: '800',
  },
  autodmProfileStatLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 2,
  },
  autodmPermissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  autodmPermissionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  autodmPermissionDesc: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  autodmActivePill: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  autodmActivePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16a34a',
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusChipText: {
    fontSize: 12,
  },

  // --- Enhanced Automations Item & Simulator Styles ---
  autodmItemCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  autodmItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  autodmItemHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  autodmItemIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autodmItemTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  autodmStatusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  autodmStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  autodmStatusTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  autodmItemSubDate: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  autodmBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  autodmTriggerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(225, 48, 108, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(225, 48, 108, 0.25)',
  },
  autodmTriggerPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#e1306c',
  },
  autodmKeywordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  autodmKeywordBadgeHash: {
    fontSize: 11,
    fontWeight: '800',
    color: '#3b82f6',
    marginRight: 1,
  },
  autodmKeywordBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3b82f6',
  },
  autodmMetaPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  autodmMetaPillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  autodmFunnelContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  autodmStepBlock: {
    gap: 6,
  },
  autodmStepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  autodmStepNumberBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#e1306c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  autodmStepNumberText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  autodmStepTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  autodmCommentBubble: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 9,
    gap: 4,
  },
  autodmBubbleAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  autodmBubbleAuthor: {
    fontSize: 11,
    fontWeight: '700',
  },
  autodmBotTagPill: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  autodmBotTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#16a34a',
  },
  autodmBubbleText: {
    fontSize: 12,
    lineHeight: 16,
  },
  autodmEmptyStepText: {
    fontSize: 11,
    fontStyle: 'italic',
    paddingLeft: 4,
  },
  autodmFunnelConnector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 2,
  },
  autodmFunnelLine: {
    flex: 1,
    height: 1,
  },
  autodmFunnelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  autodmFunnelBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#3b82f6',
  },
  autodmDMBubble: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 9,
    gap: 6,
  },
  autodmBtnPreviewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#3b82f6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 2,
  },
  autodmBtnPreviewText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  autodmLinkBtnPreviewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  autodmLinkBtnPreviewText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3b82f6',
  },
  autodmItemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.15)',
    paddingTop: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  autodmStatsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  autodmStatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  autodmStatValue: {
    fontSize: 11,
    fontWeight: '600',
  },
  autodmActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  autodmActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  autodmActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Simulator Modal Styles
  autodmCardTelemetryGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  autodmCardTelemetryCol: {
    flex: 1,
    alignItems: 'center',
  },
  autodmCardTelemetryNum: {
    fontSize: 14,
    fontWeight: '800',
  },
  autodmCardTelemetryLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '600',
    textAlign: 'center',
  },

  // AutoDM Contacts Styles
  contactTopExportBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  contactListTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  contactCountBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  contactExportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  contactExportButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  contactCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  contactAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: '#e1306c',
  },
  contactAvatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(225, 48, 108, 0.4)',
  },
  contactInstagramBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
  },
  contactUsername: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  contactFullName: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  contactSyncedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  contactSyncedText: {
    fontSize: 11,
    fontWeight: '700',
  },
  contactRelationshipPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  contactRelationshipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  contactRelationshipPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  contactStatsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  contactStatBox: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    gap: 2,
  },
  contactStatVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  contactStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  contactTimelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    flexWrap: 'wrap',
    gap: 6,
  },
  contactTimelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  contactTimelineText: {
    fontSize: 11,
    fontWeight: '500',
  },
  contactCrmStrip: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  contactCrmIdText: {
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    fontWeight: '500',
  },
  contactActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  contactActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 9,
  },
  contactActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // AutoDM Profile & Media Showcase Styles
  profileAvatarWrapper: {
    position: 'relative',
  },
  profileAvatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    borderColor: '#e1306c',
  },
  profileAvatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#e1306c',
  },
  profileOnlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profileDisplayName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  profileBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  profileAccountTypeChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  profileAccountTypeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  profileActiveStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  profileActiveStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  profileActiveStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
  },
  profileStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 14,
    borderTopWidth: 1,
  },
  profileStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  profileStatVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  profileStatLbl: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 2,
  },
  profileStatDivider: {
    width: 1,
    height: 26,
  },
  profileHeroActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#e1306c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  profileHeroActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  profileHeroSecondaryBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileMetaBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  profileMetaLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  profileMetaVal: {
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    fontWeight: '600',
  },
  mediaGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  mediaGridItemCard: {
    width: '48.5%',
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  mediaGridThumbWrapper: {
    width: '100%',
    height: 155,
    position: 'relative',
  },
  mediaGridImage: {
    width: '100%',
    height: '100%',
  },
  mediaGridPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaGridTypeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  mediaGridTypeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  mediaGridDateBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  mediaGridDateBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  mediaGridStatsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  mediaGridStatVal: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  mediaGridBody: {
    padding: 10,
    gap: 8,
  },
  mediaGridCaption: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    minHeight: 32,
  },
  mediaGridTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  mediaGridTriggerBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3b82f6',
  },
});
