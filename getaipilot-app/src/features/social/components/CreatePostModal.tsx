import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { apiClient } from '../../../core/api/client';
import { useTheme } from '@/theme';
import { useProductPalette } from '@/components/ProductUI';

interface CreatePostModalProps {
  visible: boolean;
  connectedAccounts: any[];
  initialCaption?: string;
  onClose: () => void;
  onSubmit: (payload: {
    caption: string;
    selectedChannels: string[];
    mediaUrls?: string[];
    isScheduled?: boolean;
    scheduledAt?: string;
    postType?: string;
    platformData?: Record<string, any>;
    platformPresets?: Record<string, any>;
    selectedAspectRatio?: string;
    selectedPostSizePreset?: string;
  }) => Promise<void>;
  isLoading: boolean;
  entitlementsData?: any;
  queueCount?: number;
  onOpenConnectModal?: () => void;
}

interface UploadedMediaItem {
  localUri: string;
  publicUrl: string;
  type: 'image' | 'video';
  fileName?: string;
  fileSize?: number;
  duration?: number;
}

const QUICKPOST_PLATFORMS = [
  { id: 'instagram', name: 'Instagram', color: '#E1306C', icon: 'logo-instagram' },
  { id: 'facebook', name: 'Facebook', color: '#1877F2', icon: 'logo-facebook' },
  { id: 'youtube', name: 'YouTube', color: '#FF0000', icon: 'logo-youtube' },
  { id: 'linkedin', name: 'LinkedIn', color: '#0A66C2', icon: 'logo-linkedin' },
  { id: 'threads', name: 'Threads', color: '#141413', icon: 'at' },
  { id: 'pinterest', name: 'Pinterest', color: '#E60023', icon: 'logo-pinterest' },
  { id: 'bluesky', name: 'Bluesky', color: '#0285FF', icon: 'cloudy' },
  { id: 'mastodon', name: 'Mastodon', color: '#6364FF', icon: 'chatbubbles' },
  { id: 'x', name: 'X', color: '#14171A', icon: 'logo-twitter', comingSoon: true },
  { id: 'reddit', name: 'Reddit', color: '#FF4500', icon: 'logo-reddit', comingSoon: true },
];

const QUICK_IDEAS = [
  'Building something special...',
  'Insights from the week 📈',
  'Consistency is the key 🗝️',
  'Quick thoughts on this 💡',
  'Milestone reached! 🎯',
  'Behind the strategy 🧠',
  'Leveling up... ⚡',
  'Fresh perspective 🌿',
  'Daily workflow 💻',
  'Beyond the surface 🌊',
  'Crafting the future ✨',
  'Systematic growth 📈',
];

const SUGGESTED_HASHTAGS = [
  '#getaipilot',
  '#productivity',
  '#marketing',
  '#growth',
  '#creator',
  '#digitalmarketing',
  '#branding',
  '#socialmedia',
];

const QUICKPOST_ASPECT_RATIOS = [
  { id: '1:1', label: 'Square', desc: '1:1', ratioValue: 1 },
  { id: '4:5', label: 'Portrait', desc: '4:5', ratioValue: 0.8 },
  { id: '9:16', label: 'Vertical', desc: '9:16', ratioValue: 9 / 16 },
  { id: '16:9', label: 'Landscape', desc: '16:9', ratioValue: 16 / 9 },
  { id: '2:3', label: 'Pin Standard', desc: '2:3', ratioValue: 2 / 3 },
  { id: '1.91:1', label: 'Wide', desc: '1.91:1', ratioValue: 1.91 },
];

const PLATFORM_SUPPORTED_RATIOS: Record<string, string[]> = {
  instagram: ['1:1', '4:5', '9:16', '16:9'],
  facebook: ['1:1', '9:16', '16:9'],
  x: ['1:1', '16:9'],
  linkedin: ['1:1', '1.91:1'],
  youtube: ['16:9', '9:16'],
  threads: ['1:1', '9:16'],
  pinterest: ['2:3', '1:1', '9:16'],
  bluesky: ['1:1', '16:9'],
  mastodon: ['1:1', '16:9'],
  reddit: ['1:1', '16:9'],
};

const PLATFORM_LAYOUT_PRESETS: Record<string, Array<{ id: string; ratio: string; title: string; subtitle: string }>> = {
  instagram: [
    { id: 'ig-post-square', ratio: '1:1', title: 'Post Square', subtitle: '1080×1080' },
    { id: 'ig-portrait', ratio: '4:5', title: 'Portrait', subtitle: '1080×1350' },
    { id: 'ig-reel', ratio: '9:16', title: 'Reel', subtitle: '1080×1920' },
    { id: 'ig-story', ratio: '9:16', title: 'Story', subtitle: '1080×1920' },
    { id: 'ig-landscape', ratio: '16:9', title: 'Landscape', subtitle: '1920×1080' },
  ],
  youtube: [
    { id: 'yt-video', ratio: '16:9', title: 'Video', subtitle: '1920×1080' },
    { id: 'yt-shorts', ratio: '9:16', title: 'Shorts', subtitle: '1080×1920' },
    { id: 'yt-community', ratio: '1:1', title: 'Community', subtitle: '1080×1080' },
  ],
  pinterest: [
    { id: 'pin-standard', ratio: '2:3', title: 'Standard Pin', subtitle: '1000×1500' },
    { id: 'pin-idea', ratio: '9:16', title: 'Idea Pin', subtitle: '1080×1920' },
    { id: 'pin-square', ratio: '1:1', title: 'Square Pin', subtitle: '1000×1000' },
  ],
  facebook: [
    { id: 'fb-image', ratio: '1:1', title: 'Image', subtitle: '1200×1200' },
    { id: 'fb-reel', ratio: '9:16', title: 'Reel', subtitle: '1080×1920' },
    { id: 'fb-story', ratio: '9:16', title: 'Story', subtitle: '1080×1920' },
  ],
  linkedin: [
    { id: 'li-image', ratio: '1.91:1', title: 'Feed Image', subtitle: '1200×627' },
    { id: 'li-square', ratio: '1:1', title: 'Square', subtitle: '1080×1080' },
  ],
  threads: [
    { id: 'threads-post', ratio: '1:1', title: 'Post', subtitle: '1080×1080' },
    { id: 'threads-vertical', ratio: '9:16', title: 'Vertical', subtitle: '1080×1920' },
  ],
  bluesky: [
    { id: 'bsky-image', ratio: '16:9', title: 'Image', subtitle: '1200×675' },
    { id: 'bsky-square', ratio: '1:1', title: 'Square', subtitle: '1080×1080' },
  ],
  mastodon: [
    { id: 'masto-image', ratio: '16:9', title: 'Image', subtitle: '1200×675' },
    { id: 'masto-square', ratio: '1:1', title: 'Square', subtitle: '1080×1080' },
  ],
  x: [
    { id: 'x-image', ratio: '16:9', title: 'Wide Tweet', subtitle: '1200×675' },
    { id: 'x-square', ratio: '1:1', title: 'Square', subtitle: '1080×1080' },
  ],
  reddit: [
    { id: 'reddit-image', ratio: '16:9', title: 'Image', subtitle: '1200×675' },
    { id: 'reddit-square', ratio: '1:1', title: 'Square', subtitle: '1080×1080' },
  ],
};

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  visible,
  connectedAccounts = [],
  initialCaption,
  onClose,
  onSubmit,
  isLoading,
  entitlementsData,
  queueCount = 0,
  onOpenConnectModal,
}) => {
  const { isDark } = useTheme();
  const palette = useProductPalette();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Mode: Compose vs Live Preview (QuickPost feature)
  const [activeView, setActiveView] = useState<'compose' | 'preview'>('compose');

  const [caption, setCaption] = useState(initialCaption || '');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [attachedMedia, setAttachedMedia] = useState<UploadedMediaItem[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [postMode, setPostMode] = useState<'now' | 'schedule'>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  // QuickPost Platform-Specific Customization State
  const [instagramPostType, setInstagramPostType] = useState<'post' | 'reel' | 'story'>('post');
  const [youtubeVideoType, setYoutubeVideoType] = useState<'video' | 'short'>('video');
  const [pinterestBoardId, setPinterestBoardId] = useState('');
  const [pinterestTitle, setPinterestTitle] = useState('');

  // Live Pinterest Boards State
  const [pinterestBoards, setPinterestBoards] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingBoards, setIsLoadingBoards] = useState(false);
  const [customBoardMode, setCustomBoardMode] = useState(false);

  // QuickPost Smart Size & Aspect Ratio Presets
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>('1:1');
  const [platformPresets, setPlatformPresets] = useState<Record<string, string>>({
    instagram: 'ig-post-square',
    youtube: 'yt-video',
    pinterest: 'pin-standard',
    facebook: 'fb-image',
    linkedin: 'li-square',
    threads: 'threads-post',
    bluesky: 'bsky-image',
    mastodon: 'masto-image',
    x: 'x-image',
    reddit: 'reddit-image',
  });

  // In-modal dialog state (ensures cut/close button, backdrop tap, and action buttons work 100% reliably inside this Modal)
  const [activeDialog, setActiveDialog] = useState<{
    visible: boolean;
    title: string;
    description: string;
    buttons: Array<{ text: string; style?: 'cancel' | 'default'; onPress: () => void }>;
  } | null>(null);

  // Sync initial caption
  useEffect(() => {
    if (initialCaption != null) {
      setCaption(initialCaption);
    }
  }, [initialCaption]);

  // Map connected accounts from QuickPost format + add all supported platforms
  const resolvedAccounts = useMemo(() => {
    const list: Array<{
      targetKey: string;
      platformId: string;
      platformName: string;
      username?: string;
      avatar?: string;
      color: string;
      icon: string;
      isConnected: boolean;
      comingSoon?: boolean;
    }> = [];

    const connectedPlatformIds = new Set<string>();

    // 1. Add all active connected accounts
    if (Array.isArray(connectedAccounts)) {
      connectedAccounts.forEach((acc: any) => {
        const provider = (acc.provider || acc.platform || '').toLowerCase();
        const platformMeta = QUICKPOST_PLATFORMS.find((p) => p.id === provider) || {
          id: provider,
          name: acc.name || provider,
          color: '#6C55C5',
          icon: 'share-social',
        };
        const isConnected = acc.connected !== false && acc.status !== 'disconnected';

        if (isConnected) {
          connectedPlatformIds.add(provider);
          const targetKey = acc.id ? `${provider}:${acc.id}` : provider;
          list.push({
            targetKey,
            platformId: provider,
            platformName: platformMeta.name,
            username: acc.username || acc.name || undefined,
            avatar: acc.profilePicture || acc.avatar || acc.thumbnailUrl || undefined,
            color: platformMeta.color,
            icon: platformMeta.icon,
            isConnected: true,
          });
        }
      });
    }

    // 2. Add fallback entry for supported platforms if not already present
    QUICKPOST_PLATFORMS.forEach((p) => {
      const alreadyHas = list.some((item) => item.platformId === p.id);
      if (!alreadyHas) {
        list.push({
          targetKey: p.id,
          platformId: p.id,
          platformName: p.name,
          color: p.color,
          icon: p.icon,
          isConnected: false,
          comingSoon: Boolean(p.comingSoon),
        });
      }
    });

    return list;
  }, [connectedAccounts]);

  // Channel selection is explicitly user-driven.
  // Do not silently force or re-select channels behind the user's back.

  const hasPinterest = selectedChannels.some((c) => c === 'pinterest' || c.startsWith('pinterest:'));
  const hasInstagram = selectedChannels.some((c) => c === 'instagram' || c.startsWith('instagram:'));
  const hasYouTube = selectedChannels.some((c) => c === 'youtube' || c.startsWith('youtube:'));
  const hasBluesky = selectedChannels.some((c) => c === 'bluesky' || c.startsWith('bluesky:'));
  const hasX = selectedChannels.some((c) => c === 'x' || c.startsWith('x:'));
  const hasFacebook = selectedChannels.some((c) => c === 'facebook' || c.startsWith('facebook:'));
  const hasLinkedIn = selectedChannels.some((c) => c === 'linkedin' || c.startsWith('linkedin:'));
  const hasThreads = selectedChannels.some((c) => c === 'threads' || c.startsWith('threads:'));

  // Base platform list from selected channels
  const selectedBasePlatforms = useMemo(() => {
    const set = new Set<string>();
    selectedChannels.forEach((ch) => {
      const base = String(ch || '').split(':')[0].toLowerCase();
      if (base) set.add(base);
    });
    return Array.from(set);
  }, [selectedChannels]);

  // Compute Smart Sizes across all selected platforms (QuickPost SmartSizeEngine)
  const smartRatios = useMemo(() => {
    if (selectedBasePlatforms.length === 0) {
      return QUICKPOST_ASPECT_RATIOS.map((r) => ({
        ...r,
        status: 'best' as const,
        supportedCount: 0,
        unsupportedPlatforms: [] as string[],
      }));
    }

    return QUICKPOST_ASPECT_RATIOS.map((r) => {
      const supported = selectedBasePlatforms.filter((p) =>
        (PLATFORM_SUPPORTED_RATIOS[p] || []).includes(r.id)
      );
      const unsupported = selectedBasePlatforms.filter(
        (p) => !(PLATFORM_SUPPORTED_RATIOS[p] || []).includes(r.id)
      );

      let status: 'best' | 'partial' | 'incompatible' = 'best';
      if (supported.length === selectedBasePlatforms.length) {
        status = 'best';
      } else if (supported.length > 0) {
        status = 'partial';
      } else {
        status = 'incompatible';
      }

      return {
        ...r,
        status,
        supportedCount: supported.length,
        unsupportedPlatforms: unsupported,
      };
    });
  }, [selectedBasePlatforms]);

  // Auto-align selected aspect ratio if current becomes incompatible with selected platforms
  useEffect(() => {
    if (selectedBasePlatforms.length === 0) return;
    const currentRatioInfo = smartRatios.find((r) => r.id === selectedAspectRatio);
    if (!currentRatioInfo || currentRatioInfo.status === 'incompatible') {
      const best = smartRatios.find((r) => r.status === 'best') || smartRatios.find((r) => r.status === 'partial');
      if (best && best.id !== selectedAspectRatio) {
        setSelectedAspectRatio(best.id);
      }
    }
  }, [selectedBasePlatforms, smartRatios, selectedAspectRatio]);

  // Live Pinterest Board Fetcher (Direct from QuickPost / BFF API + fallback to connected accounts cache)
  const fetchPinterestBoards = useCallback(async () => {
    setIsLoadingBoards(true);
    try {
      const res = await apiClient.get<any>('/mobile/v1/social/pinterest/boards');
      const boards = Array.isArray(res?.boards) ? res.boards : Array.isArray(res) ? res : [];
      if (boards.length > 0) {
        setPinterestBoards(boards);
        if (!pinterestBoardId) {
          const defaultId = res?.defaultBoardId || boards[0]?.id;
          if (defaultId) setPinterestBoardId(String(defaultId));
        }
        return;
      }
    } catch (e: any) {
      console.warn('Could not fetch Pinterest boards from API, checking connected accounts cache:', e?.message);
    } finally {
      setIsLoadingBoards(false);
    }

    // Fallback: check boards in connectedAccounts cache
    if (Array.isArray(connectedAccounts)) {
      const pinAcc = connectedAccounts.find(
        (a) => (a.provider || a.platform || '').toLowerCase() === 'pinterest'
      );
      const cached = pinAcc?.boards || pinAcc?.profileData?.boards || pinAcc?.profile_data?.boards || [];
      if (Array.isArray(cached) && cached.length > 0) {
        setPinterestBoards(cached.map((b: any) => ({ id: String(b.id || b.name), name: String(b.name || b.id) })));
        if (!pinterestBoardId) {
          setPinterestBoardId(String(cached[0]?.id || cached[0]?.name || ''));
        }
      }
    }
  }, [connectedAccounts, pinterestBoardId]);

  useEffect(() => {
    if (hasPinterest && pinterestBoards.length === 0) {
      fetchPinterestBoards();
    }
  }, [hasPinterest, fetchPinterestBoards, pinterestBoards.length]);

  const selectableKeys = useMemo(
    () => resolvedAccounts.filter((a) => a.isConnected && !a.comingSoon).map((a) => a.targetKey),
    [resolvedAccounts]
  );
  const isAllSelected =
    selectableKeys.length > 0 && selectableKeys.every((k) => selectedChannels.includes(k));

  const toggleSelectAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isAllSelected) {
      setSelectedChannels([]);
    } else {
      setSelectedChannels(selectableKeys);
    }
  };

  const toggleChannel = (
    targetKey: string,
    isConnected: boolean,
    comingSoon?: boolean,
    platformName?: string
  ) => {
    if (comingSoon) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setActiveDialog({
        visible: true,
        title: 'Coming Soon',
        description: `Support for ${platformName || 'this network'} is launching soon in an upcoming update.`,
        buttons: [
          {
            text: 'OK',
            onPress: () => setActiveDialog(null),
          },
        ],
      });
      return;
    }

    if (!isConnected) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setActiveDialog({
        visible: true,
        title: `Connect ${platformName || 'Channel'}`,
        description: `You haven't connected a ${platformName || 'channel'} account yet. Would you like to connect it now?`,
        buttons: [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setActiveDialog(null),
          },
          {
            text: 'Connect Now',
            onPress: () => {
              setActiveDialog(null);
              onClose();
              onOpenConnectModal?.();
            },
          },
        ],
      });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedChannels((prev) =>
      prev.includes(targetKey) ? prev.filter((k) => k !== targetKey) : [...prev, targetKey]
    );
  };

  const processAndUploadAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    setIsUploadingMedia(true);
    setUploadStatusText('Uploading to CDN...');
    setError(null);

    try {
      const isVideo =
        asset.type === 'video' ||
        (asset.mimeType && asset.mimeType.startsWith('video/')) ||
        (asset.uri && (asset.uri.endsWith('.mp4') || asset.uri.endsWith('.mov')));

      const mimeType = asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg');
      let base64Data = '';

      if (asset.base64) {
        base64Data = `data:${mimeType};base64,${asset.base64}`;
      } else if (asset.uri) {
        // Read local file as base64 using fetch + blob + FileReader
        try {
          const res = await fetch(asset.uri);
          const blob = await res.blob();
          base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                resolve(reader.result);
              } else {
                reject(new Error('Failed to read file as data URL.'));
              }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (readErr: any) {
          console.warn('Could not read asset uri via FileReader, falling back to uri:', readErr?.message);
          base64Data = asset.uri;
        }
      }

      const uploadRes = await apiClient.post<{
        success: boolean;
        publicUrl: string;
        fileName: string;
        size: number;
      }>('/mobile/v1/social/media/upload', {
        fileData: base64Data,
        fileName: asset.fileName || (isVideo ? `video_${Date.now()}.mp4` : `photo_${Date.now()}.jpg`),
        contentType: mimeType,
      });

      if (uploadRes?.publicUrl) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setAttachedMedia((prev) => [
          ...prev,
          {
            localUri: asset.uri,
            publicUrl: uploadRes.publicUrl,
            type: isVideo ? 'video' : 'image',
            fileName: uploadRes.fileName,
            fileSize: uploadRes.size,
            duration: asset.duration || undefined,
          },
        ]);
      } else {
        throw new Error('Upload succeeded but no public URL was returned.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to upload selected media.');
    } finally {
      setIsUploadingMedia(false);
      setUploadStatusText('');
    }
  };

  const handlePickFromGallery = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError(null);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Needed', 'Please allow photo and video library access to select media.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        await processAndUploadAsset(result.assets[0]);
      }
    } catch (err: any) {
      setError(err?.message || 'Could not pick media from gallery.');
    }
  };

  const handleCaptureCamera = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError(null);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Needed', 'Please allow camera access to capture a photo or video.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        await processAndUploadAsset(result.assets[0]);
      }
    } catch (err: any) {
      setError(err?.message || 'Could not capture photo or video.');
    }
  };

  const handleRemoveMedia = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAttachedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const applyIdea = (idea: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCaption(idea);
  };

  const appendHashtag = (tag: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCaption((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return tag;
      if (trimmed.includes(tag)) return prev;
      return `${trimmed} ${tag}`;
    });
  };

  const applySchedulePreset = (preset: '1h' | 'tmrw-morning' | 'tmrw-evening' | '2d') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const now = new Date();
    let target = new Date(now);

    if (preset === '1h') {
      target.setHours(target.getHours() + 1);
    } else if (preset === 'tmrw-morning') {
      target.setDate(target.getDate() + 1);
      target.setHours(9, 0, 0, 0);
    } else if (preset === 'tmrw-evening') {
      target.setDate(target.getDate() + 1);
      target.setHours(18, 0, 0, 0);
    } else if (preset === '2d') {
      target.setDate(target.getDate() + 2);
      target.setHours(12, 0, 0, 0);
    }

    setScheduledDate(target.toISOString());
  };

  const handlePublish = async () => {
    setError(null);
    if (!caption.trim()) {
      setError('Please write some text in your post caption.');
      return;
    }
    if (selectedChannels.length === 0) {
      setError('Please select at least one channel to broadcast to.');
      return;
    }

    if (hasInstagram && attachedMedia.length === 0) {
      setError('Instagram requires at least one image or video to publish.');
      return;
    }

    if (hasPinterest) {
      if (attachedMedia.length === 0) {
        setError('Pinterest requires at least one image or video to publish a Pin.');
        return;
      }
      if (!pinterestBoardId.trim()) {
        setError('Please select or enter a Pinterest board.');
        return;
      }
    }

    if (hasYouTube) {
      const hasVideo = attachedMedia.some((m) => m.type === 'video');
      if (!hasVideo) {
        setError('YouTube requires a video file (.mp4, .mov). Please attach a video.');
        return;
      }
    }

    if (postMode === 'schedule') {
      if (!scheduledDate.trim()) {
        setError('Please choose or enter a scheduled date and time.');
        return;
      }
      const queueLimit = entitlementsData?.limits?.scheduled_queue ?? 10;
      const isUnlimitedQueue = queueLimit >= 1000000;
      if (!isUnlimitedQueue && queueCount >= queueLimit) {
        const pName = entitlementsData?.plan?.name || 'Free';
        setError(`Plan queue limit reached (${queueCount}/${queueLimit}). Upgrade to schedule more.`);
        Alert.alert(
          'Queue Limit Reached',
          `Your ${pName} plan allows up to ${queueLimit} scheduled posts in queue. Upgrade for unlimited queue publications.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Upgrade Plan',
              onPress: () => {
                onClose();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/products/social/plans' as any);
              },
            },
          ]
        );
        return;
      }
    }

    const platformData: Record<string, any> = {
      instagram: { type: instagramPostType },
      youtube: { type: youtubeVideoType },
    };
    if (hasPinterest) {
      platformData.pinterest = {
        boardId: pinterestBoardId.trim(),
        title: pinterestTitle.trim() || caption.slice(0, 50),
      };
    }

    const validMediaUrls = attachedMedia
      .map((m) => m.publicUrl)
      .filter((u): u is string => typeof u === 'string' && u.startsWith('http'));

    if ((hasInstagram || hasPinterest) && validMediaUrls.length === 0) {
      setError('Media upload is not complete yet. Please wait for upload to finish.');
      return;
    }

    // Build platform presets map (aligned with QuickPost format)
    const effectivePlatformPresets: Record<string, string> = {
      ...platformPresets,
      ...(hasInstagram && instagramPostType !== 'post'
        ? { instagram: instagramPostType === 'reel' ? 'ig-reel' : 'ig-story' }
        : {}),
    };

    const primaryPlatform = selectedBasePlatforms[0] || 'instagram';
    const selectedPostSizePreset = effectivePlatformPresets[primaryPlatform] || '';

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await onSubmit({
        caption: caption.trim(),
        selectedChannels,
        mediaUrls: validMediaUrls,
        isScheduled: postMode === 'schedule',
        scheduledAt: postMode === 'schedule' ? scheduledDate.trim() : undefined,
        postType: instagramPostType,
        platformData,
        platformPresets: effectivePlatformPresets,
        selectedAspectRatio,
        selectedPostSizePreset,
      });
      setCaption('');
      setAttachedMedia([]);
      setScheduledDate('');
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to submit broadcast.');
    }
  };

  // Compute preview primary account
  const previewAccount = useMemo(() => {
    if (selectedChannels.length === 0) return resolvedAccounts[0] || null;
    const firstKey = selectedChannels[0];
    return resolvedAccounts.find((a) => a.targetKey === firstKey) || resolvedAccounts[0] || null;
  }, [selectedChannels, resolvedAccounts]);

  const activeChannelCount = selectedChannels.length;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          <View
            style={[
              styles.sheetCard,
              {
                backgroundColor: isDark ? palette.canvas : '#FFFFFF',
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            {/* Top Sheet Grab Handle */}
            <View
              style={[
                styles.handleBar,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : '#E5E5EA' },
              ]}
            />

            {/* Header: Title + Platform Count + Segmented View Switcher + Close */}
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <Text style={[styles.sheetTitle, { color: palette.text }]}>Create Post</Text>
                <View
                  style={[
                    styles.platformBadge,
                    {
                      backgroundColor: isDark ? palette.lavender : '#E7DEFA',
                    },
                  ]}
                >
                  <Ionicons name="flash" size={11} color={isDark ? palette.primary : '#6C55C5'} />
                  <Text style={[styles.platformBadgeText, { color: isDark ? palette.primary : '#55419F' }]}>
                    {activeChannelCount} channel{activeChannelCount !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>

              <View style={styles.headerRight}>
                {/* View Switcher: Compose vs Preview */}
                <View
                  style={[
                    styles.viewSwitcher,
                    { backgroundColor: isDark ? palette.surfaceSecondary : '#F0EEF8' },
                  ]}
                >
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActiveView('compose');
                    }}
                    style={[
                      styles.viewSwitchBtn,
                      activeView === 'compose' && [
                        styles.viewSwitchBtnActive,
                        { backgroundColor: isDark ? palette.card : '#FFFFFF' },
                      ],
                    ]}
                  >
                    <Ionicons
                      name="create-outline"
                      size={13}
                      color={activeView === 'compose' ? palette.text : palette.textSecondary}
                    />
                    <Text
                      style={[
                        styles.viewSwitchText,
                        {
                          color: activeView === 'compose' ? palette.text : palette.textSecondary,
                          fontWeight: activeView === 'compose' ? '600' : '400',
                        },
                      ]}
                    >
                      Write
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActiveView('preview');
                    }}
                    style={[
                      styles.viewSwitchBtn,
                      activeView === 'preview' && [
                        styles.viewSwitchBtnActive,
                        { backgroundColor: isDark ? palette.card : '#FFFFFF' },
                      ],
                    ]}
                  >
                    <Ionicons
                      name="eye-outline"
                      size={13}
                      color={activeView === 'preview' ? palette.text : palette.textSecondary}
                    />
                    <Text
                      style={[
                        styles.viewSwitchText,
                        {
                          color: activeView === 'preview' ? palette.text : palette.textSecondary,
                          fontWeight: activeView === 'preview' ? '600' : '400',
                        },
                      ]}
                    >
                      Preview
                    </Text>
                  </Pressable>
                </View>

                {/* Close Button */}
                <Pressable
                  onPress={onClose}
                  style={[
                    styles.closeCircle,
                    { backgroundColor: isDark ? palette.surfaceSecondary : '#F0EEF8' },
                  ]}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={17} color={palette.textSecondary} />
                </Pressable>
              </View>
            </View>

            {/* Scrollable Content */}
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* SECTION: Channel Selector (QuickPost Style Wrapping Grid) */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionHeaderLeft}>
                    <Text style={[styles.sectionLabel, { color: palette.textSecondary }]}>
                      POST TO CHANNELS
                    </Text>
                    <View
                      style={[
                        styles.channelCountChip,
                        { backgroundColor: isDark ? palette.lavender : '#E7DEFA' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.channelCountChipText,
                          { color: isDark ? palette.primary : '#55419F' },
                        ]}
                      >
                        {selectedChannels.length} selected
                      </Text>
                    </View>
                  </View>
                  {resolvedAccounts.length > 0 && (
                    <Pressable onPress={toggleSelectAll} hitSlop={8}>
                      <Text style={[styles.actionLinkText, { color: palette.accent }]}>
                        {isAllSelected ? 'Deselect all' : 'Select all'}
                      </Text>
                    </Pressable>
                  )}
                </View>

                {resolvedAccounts.length === 0 ? (
                  <View
                    style={[
                      styles.emptyChannelCard,
                      {
                        backgroundColor: isDark ? palette.card : '#FAF8FF',
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : palette.cardBorder,
                      },
                    ]}
                  >
                    <Ionicons name="link-outline" size={18} color={palette.textSecondary} />
                    <Text style={[styles.emptyChannelText, { color: palette.textSecondary }]}>
                      No channels found. Connect your accounts in Settings or Overview.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.channelsGrid}>
                    {resolvedAccounts.map((account) => {
                      const isSelected = selectedChannels.includes(account.targetKey) && account.isConnected;
                      return (
                        <Pressable
                          key={account.targetKey}
                          onPress={() =>
                            toggleChannel(
                              account.targetKey,
                              account.isConnected,
                              account.comingSoon,
                              account.platformName
                            )
                          }
                          style={styles.channelItem}
                        >
                          <View
                            style={[
                              styles.channelCircle,
                              {
                                backgroundColor: isDark ? palette.card : '#FFFFFF',
                                borderColor: isSelected
                                  ? isDark
                                    ? palette.primary
                                    : '#6C55C5'
                                  : isDark
                                  ? 'rgba(255,255,255,0.1)'
                                  : palette.cardBorder,
                              },
                              isSelected && styles.channelCircleSelected,
                              !account.isConnected && styles.channelCircleUnconnected,
                            ]}
                          >
                            {account.avatar ? (
                              <Image
                                source={{ uri: account.avatar }}
                                style={styles.channelAvatarImg}
                                contentFit="cover"
                              />
                            ) : (
                              <Ionicons
                                name={account.icon as any}
                                size={20}
                                color={account.color}
                              />
                            )}

                            {/* Mini Platform Badge if account has an avatar */}
                            {account.avatar && (
                              <View
                                style={[
                                  styles.platformMiniBadge,
                                  {
                                    backgroundColor: isDark
                                      ? palette.card
                                      : '#FFFFFF',
                                    borderColor: isDark
                                      ? palette.card
                                      : '#FFFFFF',
                                  },
                                ]}
                              >
                                <Ionicons
                                  name={account.icon as any}
                                  size={9}
                                  color={account.color}
                                />
                              </View>
                            )}

                            {/* Checkmark badge: ONLY for connected and selected accounts */}
                            {isSelected && (
                              <View
                                style={[
                                  styles.checkCircleBadge,
                                  {
                                    backgroundColor: isDark
                                      ? palette.primary
                                      : '#6C55C5',
                                    borderColor: isDark
                                      ? palette.card
                                      : '#FFFFFF',
                                  },
                                ]}
                              >
                                <Ionicons
                                  name="checkmark"
                                  size={10}
                                  color={
                                    isDark
                                      ? palette.buttonPrimaryForeground
                                      : '#FFFFFF'
                                  }
                                />
                              </View>
                            )}

                            {/* Unconnected + badge (to show tapping lets you connect) */}
                            {!account.isConnected && !account.comingSoon && (
                              <View
                                style={[
                                  styles.connectMiniBadge,
                                  {
                                    backgroundColor: isDark ? palette.surfaceSecondary : '#F0EEF8',
                                    borderColor: isDark ? palette.card : '#FFFFFF',
                                  },
                                ]}
                              >
                                <Ionicons name="add" size={10} color={palette.textSecondary} />
                              </View>
                            )}

                            {/* Coming Soon mini badge */}
                            {account.comingSoon && (
                              <View style={styles.soonMiniBadge}>
                                <Text style={styles.soonMiniText}>SOON</Text>
                              </View>
                            )}
                          </View>

                          <Text
                            numberOfLines={1}
                            style={[
                              styles.channelLabel,
                              {
                                color: isSelected
                                  ? palette.text
                                  : palette.textSecondary,
                                fontWeight: isSelected ? '600' : '400',
                              },
                            ]}
                          >
                            {account.username
                              ? `@${account.username}`
                              : account.platformName}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* VIEW: PREVIEW MODE (When user clicks Preview tab) */}
              {activeView === 'preview' ? (
                <View style={styles.previewContainer}>
                  <View
                    style={[
                      styles.previewMockupCard,
                      {
                        backgroundColor: isDark ? palette.card : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : palette.cardBorder,
                      },
                    ]}
                  >
                    {/* Mockup Header */}
                    <View style={styles.previewHeader}>
                      <View style={styles.previewHeaderUser}>
                        {previewAccount?.avatar ? (
                          <Image
                            source={{ uri: previewAccount.avatar }}
                            style={styles.previewAvatar}
                            contentFit="cover"
                          />
                        ) : (
                          <View
                            style={[
                              styles.previewAvatar,
                              { backgroundColor: isDark ? palette.surfaceSecondary : '#F0EEF8' },
                            ]}
                          >
                            <Ionicons
                              name={previewAccount?.icon as any || 'person'}
                              size={18}
                              color={palette.accent}
                            />
                          </View>
                        )}
                        <View>
                          <Text style={[styles.previewHandleText, { color: palette.text }]}>
                            {previewAccount?.username
                              ? `@${previewAccount.username}`
                              : previewAccount?.platformName || 'Your Channel'}
                          </Text>
                          <Text style={[styles.previewSubtext, { color: palette.textSecondary }]}>
                            {hasInstagram
                              ? `Instagram ${instagramPostType.toUpperCase()}`
                              : hasYouTube
                              ? `YouTube ${youtubeVideoType.toUpperCase()}`
                              : hasPinterest
                              ? 'Pinterest Pin'
                              : 'Social Broadcast'}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.previewStatusTag,
                          { backgroundColor: isDark ? palette.mint : '#D8F0F0' },
                        ]}
                      >
                        <Text style={[styles.previewStatusTagText, { color: isDark ? '#A7F3D0' : '#047857' }]}>
                          Ready
                        </Text>
                      </View>
                    </View>

                    {/* Mockup Caption */}
                    <Text
                      style={[
                        styles.previewCaption,
                        { color: palette.text },
                        !caption.trim() && { fontStyle: 'italic', color: palette.textSecondary },
                      ]}
                    >
                      {caption.trim() || 'No caption entered yet. Type in the compose box to preview.'}
                    </Text>

                    {/* Mockup Attached Media */}
                    {attachedMedia.length > 0 && (
                      <View
                        style={[
                          styles.previewMediaWrap,
                          selectedAspectRatio === '1:1' && { aspectRatio: 1, height: undefined },
                          selectedAspectRatio === '4:5' && { aspectRatio: 4 / 5, height: undefined },
                          selectedAspectRatio === '9:16' && { aspectRatio: 9 / 16, height: undefined, maxHeight: 320 },
                          selectedAspectRatio === '16:9' && { aspectRatio: 16 / 9, height: undefined },
                          selectedAspectRatio === '2:3' && { aspectRatio: 2 / 3, height: undefined, maxHeight: 300 },
                          selectedAspectRatio === '1.91:1' && { aspectRatio: 1.91, height: undefined },
                        ]}
                      >
                        <Image
                          source={{ uri: attachedMedia[0].localUri || attachedMedia[0].publicUrl }}
                          style={styles.previewImageCover}
                          contentFit="cover"
                        />
                        {attachedMedia[0].type === 'video' && (
                          <View style={styles.videoPlayOverlay}>
                            <Ionicons name="play" size={26} color="#FFFFFF" />
                          </View>
                        )}
                        {attachedMedia.length > 1 && (
                          <View style={styles.multiMediaBadge}>
                            <Ionicons name="copy-outline" size={12} color="#FFFFFF" />
                            <Text style={styles.multiMediaText}>1/{attachedMedia.length}</Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Mockup Action Bar */}
                    <View style={styles.previewActions}>
                      <View style={styles.previewActionsLeft}>
                        <Ionicons name="heart-outline" size={20} color={palette.textSecondary} />
                        <Ionicons name="chatbubble-outline" size={18} color={palette.textSecondary} />
                        <Ionicons name="paper-plane-outline" size={18} color={palette.textSecondary} />
                      </View>
                      <Ionicons name="bookmark-outline" size={20} color={palette.textSecondary} />
                    </View>
                  </View>
                </View>
              ) : (
                /* VIEW: COMPOSE MODE */
                <>
                  {/* SECTION: Caption Textarea */}
                  <View style={styles.sectionContainer}>
                    <View
                      style={[
                        styles.composerCard,
                        {
                          backgroundColor: isDark ? palette.card : '#FFFFFF',
                          borderColor: isDark ? 'rgba(255,255,255,0.08)' : palette.cardBorder,
                        },
                      ]}
                    >
                      <TextInput
                        style={[styles.composerInput, { color: palette.text }]}
                        multiline
                        placeholder="What's on your mind? Share an idea, update, or thought..."
                        placeholderTextColor={palette.textSecondary}
                        value={caption}
                        onChangeText={(val) => {
                          setCaption(val);
                          setError(null);
                        }}
                      />

                      {/* Card Bottom Helpers: Clear & Character Counter */}
                      <View style={styles.composerFooter}>
                        <View style={styles.composerFooterLeft}>
                          {caption.length > 0 && (
                            <Pressable
                              onPress={() => setCaption('')}
                              hitSlop={6}
                              style={styles.clearCaptionBtn}
                            >
                              <Text style={[styles.clearCaptionText, { color: palette.textSecondary }]}>
                                Clear
                              </Text>
                            </Pressable>
                          )}
                          {hasBluesky && caption.length > 300 && (
                            <Text style={styles.charWarningText}>Bluesky max 300</Text>
                          )}
                          {hasX && caption.length > 280 && (
                            <Text style={styles.charWarningText}>X max 280</Text>
                          )}
                        </View>

                        <Text style={[styles.counterText, { color: palette.textSecondary }]}>
                          {caption.length} characters
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* SECTION: Media Attachments (Seamlessly placed right after text) */}
                  <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionHeaderLeft}>
                        <Ionicons name="images-outline" size={14} color={palette.accent} />
                        <Text style={[styles.sectionLabel, { color: palette.textSecondary }]}>
                          MEDIA ATTACHMENTS
                        </Text>
                      </View>
                      {attachedMedia.length > 0 && (
                        <Text style={[styles.mediaCountBadge, { color: palette.accent }]}>
                          {attachedMedia.length} attached
                        </Text>
                      )}
                    </View>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.mediaCarousel}
                    >
                      {attachedMedia.map((item, idx) => (
                        <View key={`${item.publicUrl}_${idx}`} style={styles.mediaThumbCard}>
                          <Image
                            source={{ uri: item.localUri || item.publicUrl }}
                            style={styles.mediaThumbImage}
                            contentFit="cover"
                          />
                          <View style={styles.mediaThumbBadge}>
                            <Text style={styles.mediaThumbBadgeText}>
                              {item.type.toUpperCase()}
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => handleRemoveMedia(idx)}
                            style={styles.mediaThumbDelete}
                            hitSlop={6}
                          >
                            <Ionicons name="close" size={13} color="#FFFFFF" />
                          </Pressable>
                        </View>
                      ))}

                      {/* Quick Add Media Buttons */}
                      {attachedMedia.length < 5 && !isUploadingMedia && (
                        <View style={styles.addMediaBtnsRow}>
                          <Pressable
                            onPress={handlePickFromGallery}
                            style={[
                              styles.addMediaBtn,
                              {
                                backgroundColor: isDark ? palette.card : '#FAF8FF',
                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : palette.cardBorder,
                              },
                            ]}
                          >
                            <Ionicons name="image-outline" size={18} color={palette.accent} />
                            <Text style={[styles.addMediaBtnText, { color: palette.text }]}>
                              Photos
                            </Text>
                          </Pressable>

                          <Pressable
                            onPress={handleCaptureCamera}
                            style={[
                              styles.addMediaBtn,
                              {
                                backgroundColor: isDark ? palette.card : '#FAF8FF',
                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : palette.cardBorder,
                              },
                            ]}
                          >
                            <Ionicons name="camera-outline" size={18} color={palette.accent} />
                            <Text style={[styles.addMediaBtnText, { color: palette.text }]}>
                              Camera
                            </Text>
                          </Pressable>
                        </View>
                      )}
                    </ScrollView>

                    {isUploadingMedia && (
                      <View
                        style={[
                          styles.uploadingNotice,
                          {
                            backgroundColor: isDark ? palette.surfaceSecondary : '#F0EEF8',
                          },
                        ]}
                      >
                        <ActivityIndicator size="small" color={palette.accent} />
                        <Text style={[styles.uploadingNoticeText, { color: palette.text }]}>
                          {uploadStatusText || 'Uploading media to CDN...'}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* SECTION: Quick Ideas (QuickPost Feature) */}
                  <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionLabel, { color: palette.textSecondary }]}>
                      QUICK INSPIRATION
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.horizontalPillsScroll}
                    >
                      {QUICK_IDEAS.map((idea, idx) => (
                        <Pressable
                          key={idx}
                          onPress={() => applyIdea(idea)}
                          style={[
                            styles.suggestionPill,
                            {
                              backgroundColor: isDark ? palette.surfaceSecondary : '#F0EEF8',
                              borderColor: isDark ? 'rgba(255,255,255,0.06)' : palette.cardBorder,
                            },
                          ]}
                        >
                          <Text style={[styles.suggestionText, { color: palette.text }]}>
                            {idea}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>

                  {/* SECTION: Suggested Hashtags (QuickPost Feature) */}
                  <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionLabel, { color: palette.textSecondary }]}>
                      TRENDING HASHTAGS
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.horizontalPillsScroll}
                    >
                      {SUGGESTED_HASHTAGS.map((tag, idx) => {
                        const isAdded = caption.includes(tag);
                        return (
                          <Pressable
                            key={idx}
                            onPress={() => appendHashtag(tag)}
                            style={[
                              styles.hashtagPill,
                              {
                                backgroundColor: isAdded
                                  ? isDark
                                    ? palette.lavender
                                    : '#E7DEFA'
                                  : isDark
                                  ? palette.surfaceSecondary
                                  : '#F8F7FC',
                                borderColor: isAdded
                                  ? isDark
                                    ? palette.primary
                                    : '#6C55C5'
                                  : isDark
                                  ? 'rgba(255,255,255,0.06)'
                                  : palette.cardBorder,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.hashtagText,
                                {
                                  color: isAdded
                                    ? isDark
                                      ? palette.primary
                                      : '#55419F'
                                    : palette.accent,
                                  fontWeight: isAdded ? '600' : '500',
                                },
                              ]}
                            >
                              {tag}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* SECTION: Platform Specific Formats (Instagram / YouTube / Pinterest) */}
                  {hasInstagram && (
                    <View style={styles.sectionContainer}>
                      <Text style={[styles.sectionLabel, { color: palette.textSecondary }]}>
                        INSTAGRAM FORMAT
                      </Text>
                      <View
                        style={[
                          styles.segmentedFormatRow,
                          {
                            backgroundColor: isDark ? palette.surfaceSecondary : '#F0EEF8',
                          },
                        ]}
                      >
                        {(['post', 'reel', 'story'] as const).map((fmt) => {
                          const isCurrent = instagramPostType === fmt;
                          return (
                            <Pressable
                              key={fmt}
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setInstagramPostType(fmt);
                              }}
                              style={[
                                styles.segmentedFormatBtn,
                                isCurrent && [
                                  styles.segmentedFormatBtnActive,
                                  {
                                    backgroundColor: isDark ? palette.card : '#FFFFFF',
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.08,
                                    shadowRadius: 3,
                                  },
                                ],
                              ]}
                            >
                              <Text
                                style={[
                                  styles.segmentedFormatText,
                                  {
                                    color: isCurrent ? palette.text : palette.textSecondary,
                                    fontWeight: isCurrent ? '600' : '500',
                                  },
                                ]}
                              >
                                {fmt === 'post' ? 'Feed Post (1:1)' : fmt === 'reel' ? 'Reel (9:16)' : 'Story (9:16)'}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {hasYouTube && (
                    <View style={styles.sectionContainer}>
                      <Text style={[styles.sectionLabel, { color: palette.textSecondary }]}>
                        YOUTUBE VIDEO TYPE
                      </Text>
                      <View
                        style={[
                          styles.segmentedFormatRow,
                          {
                            backgroundColor: isDark ? palette.surfaceSecondary : '#F0EEF8',
                          },
                        ]}
                      >
                        {(['video', 'short'] as const).map((ytType) => {
                          const isCurrent = youtubeVideoType === ytType;
                          return (
                            <Pressable
                              key={ytType}
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setYoutubeVideoType(ytType);
                              }}
                              style={[
                                styles.segmentedFormatBtn,
                                isCurrent && [
                                  styles.segmentedFormatBtnActive,
                                  {
                                    backgroundColor: isDark ? palette.card : '#FFFFFF',
                                  },
                                ],
                              ]}
                            >
                              <Text
                                style={[
                                  styles.segmentedFormatText,
                                  {
                                    color: isCurrent ? palette.text : palette.textSecondary,
                                    fontWeight: isCurrent ? '600' : '500',
                                  },
                                ]}
                              >
                                {ytType === 'video' ? 'Standard Video (16:9)' : 'YouTube Shorts (9:16)'}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* SECTION: Pinterest Boards & Title (Live Fetched from QuickPost) */}
                  {hasPinterest && (
                    <View style={styles.sectionContainer}>
                      <View style={styles.sectionHeader}>
                        <View style={styles.sectionHeaderLeft}>
                          <Ionicons name="logo-pinterest" size={14} color="#E60023" />
                          <Text style={[styles.sectionLabel, { color: palette.textSecondary }]}>
                            PINTEREST BOARD & TITLE
                          </Text>
                        </View>
                        <View style={styles.pinterestHeaderActions}>
                          <Pressable
                            onPress={fetchPinterestBoards}
                            disabled={isLoadingBoards}
                            hitSlop={8}
                            style={styles.refreshBoardsBtn}
                          >
                            {isLoadingBoards ? (
                              <ActivityIndicator size="small" color={palette.accent} />
                            ) : (
                              <Ionicons name="reload" size={13} color={palette.accent} />
                            )}
                            <Text style={[styles.actionLinkText, { color: palette.accent, marginLeft: 4 }]}>
                              {isLoadingBoards ? 'Loading...' : 'Refresh'}
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={() => setCustomBoardMode(!customBoardMode)}
                            hitSlop={8}
                            style={{ marginLeft: 12 }}
                          >
                            <Text style={[styles.actionLinkText, { color: palette.accent }]}>
                              {customBoardMode ? 'Pick from list' : '+ Custom'}
                            </Text>
                          </Pressable>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.pinterestCard,
                          {
                            backgroundColor: isDark ? palette.card : '#FFFFFF',
                            borderColor: isDark ? 'rgba(255,255,255,0.08)' : palette.cardBorder,
                          },
                        ]}
                      >
                        {isLoadingBoards && pinterestBoards.length === 0 ? (
                          <View style={styles.boardsLoadingWrap}>
                            <ActivityIndicator size="small" color="#E60023" />
                            <Text style={[styles.boardsLoadingText, { color: palette.textSecondary }]}>
                              Fetching your Pinterest boards...
                            </Text>
                          </View>
                        ) : !customBoardMode && pinterestBoards.length > 0 ? (
                          <View style={styles.boardsContainer}>
                            <Text style={[styles.fieldHintText, { color: palette.textSecondary }]}>
                              Select a destination board:
                            </Text>
                            <ScrollView
                              horizontal
                              showsHorizontalScrollIndicator={false}
                              contentContainerStyle={styles.boardsScroll}
                            >
                              {pinterestBoards.map((b) => {
                                const isSelected = pinterestBoardId === b.id;
                                return (
                                  <Pressable
                                    key={b.id}
                                    onPress={() => {
                                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                      setPinterestBoardId(b.id);
                                    }}
                                    style={[
                                      styles.boardChip,
                                      {
                                        backgroundColor: isSelected
                                          ? isDark
                                            ? palette.lavender
                                            : '#E7DEFA'
                                          : isDark
                                          ? palette.surfaceSecondary
                                          : '#F8F7FC',
                                        borderColor: isSelected
                                          ? isDark
                                            ? palette.primary
                                            : '#6C55C5'
                                          : isDark
                                          ? 'rgba(255,255,255,0.08)'
                                          : palette.cardBorder,
                                      },
                                    ]}
                                  >
                                    <Ionicons
                                      name={isSelected ? 'checkmark-circle' : 'bookmark-outline'}
                                      size={14}
                                      color={isSelected ? (isDark ? palette.primary : '#55419F') : palette.textSecondary}
                                    />
                                    <Text
                                      style={[
                                        styles.boardChipText,
                                        {
                                          color: isSelected ? palette.text : palette.text,
                                          fontWeight: isSelected ? '600' : '500',
                                        },
                                      ]}
                                    >
                                      {b.name}
                                    </Text>
                                  </Pressable>
                                );
                              })}
                            </ScrollView>
                          </View>
                        ) : (
                          <View style={{ gap: 6 }}>
                            <Text style={[styles.fieldHintText, { color: palette.textSecondary }]}>
                              {pinterestBoards.length === 0
                                ? 'No live boards found. Enter your board name or ID:'
                                : 'Enter Custom Board Name or ID:'}
                            </Text>
                            <TextInput
                              style={[
                                styles.pinterestInput,
                                {
                                  backgroundColor: isDark ? palette.surfaceSecondary : '#F8F7FC',
                                  color: palette.text,
                                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : palette.cardBorder,
                                },
                              ]}
                              placeholder="e.g. Design Inspiration, Quotes..."
                              placeholderTextColor={palette.textSecondary}
                              value={pinterestBoardId}
                              onChangeText={setPinterestBoardId}
                            />
                          </View>
                        )}

                        {/* Pin Title */}
                        <View style={{ marginTop: 10 }}>
                          <Text style={[styles.fieldHintText, { color: palette.textSecondary }]}>
                            Pin Title (optional)
                          </Text>
                          <TextInput
                            style={[
                              styles.pinterestInput,
                              {
                                backgroundColor: isDark ? palette.surfaceSecondary : '#F8F7FC',
                                color: palette.text,
                                borderColor: isDark ? 'rgba(255,255,255,0.08)' : palette.cardBorder,
                                marginTop: 4,
                              },
                            ]}
                            placeholder="Catchy Pin Title (defaults to caption)..."
                            placeholderTextColor={palette.textSecondary}
                            value={pinterestTitle}
                            onChangeText={setPinterestTitle}
                          />
                        </View>
                      </View>
                    </View>
                  )}

                  {/* SECTION: QuickPost Smart Format & Aspect Ratio Selector */}
                  <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionHeaderLeft}>
                        <Ionicons name="crop-outline" size={14} color={palette.accent} />
                        <Text style={[styles.sectionLabel, { color: palette.textSecondary }]}>
                          SMART FORMAT & ASPECT RATIO
                        </Text>
                      </View>
                      <Text style={[styles.fieldHintText, { color: palette.textSecondary }]}>
                        {smartRatios.find((r) => r.id === selectedAspectRatio)?.label || selectedAspectRatio}
                      </Text>
                    </View>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.aspectRatioScroll}
                    >
                      {smartRatios.map((item) => {
                        const isSelected = selectedAspectRatio === item.id;
                        const isBest = item.status === 'best';
                        const isPartial = item.status === 'partial';
                        const isIncompatible = item.status === 'incompatible';

                        return (
                          <Pressable
                            key={item.id}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setSelectedAspectRatio(item.id);

                              // Sync platform presets to match chosen ratio
                              const updatedPresets = { ...platformPresets };
                              selectedBasePlatforms.forEach((p) => {
                                const presets = PLATFORM_LAYOUT_PRESETS[p] || [];
                                const match = presets.find((pr) => pr.ratio === item.id);
                                if (match) {
                                  updatedPresets[p] = match.id;
                                }
                              });
                              setPlatformPresets(updatedPresets);

                              // Automatically sync Instagram post type if 9:16 is chosen
                              if (item.id === '9:16' && instagramPostType === 'post') {
                                setInstagramPostType('reel');
                              } else if (item.id === '1:1' && (instagramPostType === 'reel' || instagramPostType === 'story')) {
                                setInstagramPostType('post');
                              }
                            }}
                            style={[
                              styles.aspectRatioCard,
                              {
                                backgroundColor: isSelected
                                  ? isDark
                                    ? palette.lavender
                                    : '#E7DEFA'
                                  : isDark
                                  ? palette.surfaceSecondary
                                  : '#FAF8FC',
                                borderColor: isSelected
                                  ? isDark
                                    ? palette.primary
                                    : '#6C55C5'
                                  : isDark
                                  ? 'rgba(255,255,255,0.06)'
                                  : palette.cardBorder,
                                opacity: isIncompatible ? 0.45 : 1,
                              },
                            ]}
                          >
                            <View style={styles.aspectRatioHeader}>
                              <Text
                                style={[
                                  styles.aspectRatioTitle,
                                  {
                                    color: isSelected
                                      ? isDark
                                        ? palette.primary
                                        : '#4B369D'
                                      : palette.text,
                                    fontWeight: isSelected ? '700' : '600',
                                  },
                                ]}
                              >
                                {item.id}
                              </Text>
                              {isBest && selectedBasePlatforms.length > 0 && (
                                <View style={[styles.ratioBadge, { backgroundColor: '#10B981' }]}>
                                  <Text style={styles.ratioBadgeText}>BEST</Text>
                                </View>
                              )}
                              {isPartial && selectedBasePlatforms.length > 0 && (
                                <View style={[styles.ratioBadge, { backgroundColor: '#F59E0B' }]}>
                                  <Text style={styles.ratioBadgeText}>PARTIAL</Text>
                                </View>
                              )}
                            </View>
                            <Text
                              style={[
                                styles.aspectRatioLabel,
                                {
                                  color: isSelected
                                    ? isDark
                                      ? palette.primary
                                      : '#55419F'
                                    : palette.textSecondary,
                                },
                              ]}
                            >
                              {item.label}
                            </Text>
                            {isIncompatible && item.unsupportedPlatforms.length > 0 && (
                              <Text style={styles.aspectRatioWarn}>
                                Rejects: {item.unsupportedPlatforms.join(', ')}
                              </Text>
                            )}
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* SECTION: Publish Timing */}
                  <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionLabel, { color: palette.textSecondary }]}>
                      PUBLISH TIMING
                    </Text>
                    <View
                      style={[
                        styles.segmentedTimingRow,
                        {
                          backgroundColor: isDark ? palette.surfaceSecondary : '#F0EEF8',
                        },
                      ]}
                    >
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setPostMode('now');
                        }}
                        style={[
                          styles.segmentedTimingBtn,
                          postMode === 'now' && [
                            styles.segmentedTimingBtnActive,
                            { backgroundColor: isDark ? palette.card : '#FFFFFF' },
                          ],
                        ]}
                      >
                        <Ionicons
                          name="flash"
                          size={14}
                          color={postMode === 'now' ? palette.text : palette.textSecondary}
                        />
                        <Text
                          style={[
                            styles.segmentedTimingText,
                            {
                              color: postMode === 'now' ? palette.text : palette.textSecondary,
                              fontWeight: postMode === 'now' ? '600' : '500',
                            },
                          ]}
                        >
                          Publish Now
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setPostMode('schedule');
                          if (!scheduledDate) {
                            applySchedulePreset('1h');
                          }
                        }}
                        style={[
                          styles.segmentedTimingBtn,
                          postMode === 'schedule' && [
                            styles.segmentedTimingBtnActive,
                            { backgroundColor: isDark ? palette.card : '#FFFFFF' },
                          ],
                        ]}
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={14}
                          color={postMode === 'schedule' ? palette.text : palette.textSecondary}
                        />
                        <Text
                          style={[
                            styles.segmentedTimingText,
                            {
                              color: postMode === 'schedule' ? palette.text : palette.textSecondary,
                              fontWeight: postMode === 'schedule' ? '600' : '500',
                            },
                          ]}
                        >
                          Schedule
                        </Text>
                      </Pressable>
                    </View>

                    {/* Schedule Presets Drawer */}
                    {postMode === 'schedule' && (
                      <View
                        style={[
                          styles.scheduleCard,
                          {
                            backgroundColor: isDark ? palette.card : '#FFFFFF',
                            borderColor: isDark ? 'rgba(255,255,255,0.08)' : palette.cardBorder,
                          },
                        ]}
                      >
                        <Text style={[styles.scheduleSubtitle, { color: palette.textSecondary }]}>
                          Quick Schedule Presets:
                        </Text>
                        <View style={styles.presetsGrid}>
                          <Pressable
                            onPress={() => applySchedulePreset('1h')}
                            style={[
                              styles.presetChip,
                              { backgroundColor: isDark ? palette.surfaceSecondary : '#F0EEF8' },
                            ]}
                          >
                            <Text style={[styles.presetChipText, { color: palette.text }]}>
                              In 1 hour
                            </Text>
                          </Pressable>

                          <Pressable
                            onPress={() => applySchedulePreset('tmrw-morning')}
                            style={[
                              styles.presetChip,
                              { backgroundColor: isDark ? palette.surfaceSecondary : '#F0EEF8' },
                            ]}
                          >
                            <Text style={[styles.presetChipText, { color: palette.text }]}>
                              Tomorrow 9 AM
                            </Text>
                          </Pressable>

                          <Pressable
                            onPress={() => applySchedulePreset('tmrw-evening')}
                            style={[
                              styles.presetChip,
                              { backgroundColor: isDark ? palette.surfaceSecondary : '#F0EEF8' },
                            ]}
                          >
                            <Text style={[styles.presetChipText, { color: palette.text }]}>
                              Tomorrow 6 PM
                            </Text>
                          </Pressable>

                          <Pressable
                            onPress={() => applySchedulePreset('2d')}
                            style={[
                              styles.presetChip,
                              { backgroundColor: isDark ? palette.surfaceSecondary : '#F0EEF8' },
                            ]}
                          >
                            <Text style={[styles.presetChipText, { color: palette.text }]}>
                              In 2 days
                            </Text>
                          </Pressable>
                        </View>

                        {/* Selected Time Display or Custom Input */}
                        <View style={styles.scheduleIsoWrap}>
                          <Text style={[styles.scheduleFieldLabel, { color: palette.textSecondary }]}>
                            Scheduled Time (ISO string)
                          </Text>
                          <TextInput
                            style={[
                              styles.scheduleInput,
                              {
                                backgroundColor: isDark ? palette.surfaceSecondary : '#F8F7FC',
                                color: palette.text,
                                borderColor: isDark ? 'rgba(255,255,255,0.08)' : palette.cardBorder,
                              },
                            ]}
                            placeholder="e.g. 2026-10-20T18:00:00.000Z"
                            placeholderTextColor={palette.textSecondary}
                            value={scheduledDate}
                            onChangeText={setScheduledDate}
                            autoCapitalize="none"
                          />
                          {scheduledDate ? (
                            <Text style={[styles.readableScheduleText, { color: palette.accent }]}>
                              📅 {new Date(scheduledDate).toLocaleString([], {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    )}
                  </View>
                </>
              )}

              {/* Error Callout */}
              {error && (
                <View
                  style={[
                    styles.errorBanner,
                    {
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                    },
                  ]}
                >
                  <Ionicons name="alert-circle" size={17} color="#EF4444" />
                  <Text style={styles.errorBannerText}>{error}</Text>
                </View>
              )}
            </ScrollView>

            {/* Sticky Bottom Actions */}
            <View
              style={[
                styles.bottomBar,
                {
                  borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : palette.cardBorder,
                },
              ]}
            >
              <Pressable
                onPress={onClose}
                style={[
                  styles.cancelBtn,
                  { backgroundColor: isDark ? palette.surfaceSecondary : '#F0EEF8' },
                ]}
                hitSlop={6}
              >
                <Text style={[styles.cancelBtnText, { color: palette.textSecondary }]}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handlePublish}
                disabled={isLoading || isUploadingMedia}
                style={[
                  styles.primaryPublishBtn,
                  {
                    backgroundColor: isDark ? palette.buttonPrimary : '#17171C',
                    opacity: isLoading || isUploadingMedia ? 0.6 : 1,
                  },
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color={isDark ? palette.buttonPrimaryForeground : '#FFFFFF'} size="small" />
                ) : (
                  <>
                    <Ionicons
                      name={postMode === 'now' ? 'paper-plane' : 'calendar'}
                      size={15}
                      color={isDark ? palette.buttonPrimaryForeground : '#FFFFFF'}
                    />
                    <Text
                      style={[
                        styles.primaryPublishBtnText,
                        { color: isDark ? palette.buttonPrimaryForeground : '#FFFFFF' },
                      ]}
                    >
                      {postMode === 'now'
                        ? activeChannelCount > 1
                          ? `Publish to ${activeChannelCount} Channels`
                          : 'Publish Now'
                        : 'Schedule Post'}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* In-Modal Alert Dialog with explicit top cut/close button */}
        {activeDialog && (
          <View style={styles.inModalDialogOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setActiveDialog(null)}
            />
            <View
              style={[
                styles.inModalDialogCard,
                {
                  backgroundColor: isDark ? '#1C1A25' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                },
              ]}
            >
              {/* Top-Right Cut/Close Icon */}
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setActiveDialog(null);
                }}
                style={[
                  styles.inModalDialogCloseBtn,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                ]}
                hitSlop={14}
              >
                <Ionicons name="close" size={17} color={palette.text} />
              </Pressable>

              {/* Icon */}
              <View
                style={[
                  styles.inModalDialogIconCircle,
                  {
                    backgroundColor: isDark ? palette.lavender : '#E7DEFA',
                  },
                ]}
              >
                <Ionicons
                  name="information-circle"
                  size={26}
                  color={isDark ? palette.primary : '#6C55C5'}
                />
              </View>

              {/* Title & Description */}
              <Text style={[styles.inModalDialogTitle, { color: palette.text }]}>
                {activeDialog.title}
              </Text>
              <Text style={[styles.inModalDialogDesc, { color: palette.textSecondary }]}>
                {activeDialog.description}
              </Text>

              {/* Action Buttons */}
              <View style={styles.inModalDialogButtonsRow}>
                {activeDialog.buttons.map((btn, idx) => {
                  const isCancel = btn.style === 'cancel' || btn.text.toLowerCase() === 'cancel';
                  return (
                    <Pressable
                      key={idx}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        btn.onPress();
                      }}
                      style={[
                        styles.inModalDialogBtn,
                        isCancel
                          ? [
                              styles.inModalDialogBtnCancel,
                              { backgroundColor: isDark ? palette.surfaceSecondary : '#F0EEF8' },
                            ]
                          : [
                              styles.inModalDialogBtnPrimary,
                              { backgroundColor: isDark ? palette.primary : '#6C55C5' },
                            ],
                      ]}
                    >
                      <Text
                        style={[
                          styles.inModalDialogBtnText,
                          {
                            color: isCancel
                              ? palette.text
                              : isDark
                              ? palette.buttonPrimaryForeground
                              : '#FFFFFF',
                          },
                        ]}
                      >
                        {btn.text}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    width: '100%',
    maxHeight: '94%',
  },
  sheetCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    maxHeight: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 24,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 16,
  },
  platformBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewSwitcher: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 3,
  },
  viewSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 16,
  },
  viewSwitchBtnActive: {},
  viewSwitchText: {
    fontSize: 12,
  },
  closeCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    maxHeight: 520,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sectionContainer: {
    marginTop: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  channelCountChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
  },
  channelCountChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  actionLinkText: {
    fontSize: 12,
    fontWeight: '600',
  },
  channelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
    marginBottom: 4,
  },
  channelItem: {
    width: '22%',
    minWidth: 64,
    alignItems: 'center',
    marginBottom: 8,
  },
  channelCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  channelCircleSelected: {
    transform: [{ scale: 1.05 }],
  },
  channelCircleUnconnected: {
    opacity: 0.6,
    borderStyle: 'dashed',
  },
  channelAvatarImg: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  platformMiniBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectMiniBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soonMiniBadge: {
    position: 'absolute',
    bottom: -3,
    backgroundColor: 'rgba(100, 116, 139, 0.9)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  soonMiniText: {
    fontSize: 7,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  channelLabel: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 68,
  },
  emptyChannelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyChannelText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  composerCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
  },
  composerInput: {
    fontSize: 15,
    lineHeight: 22,
    minHeight: 110,
    textAlignVertical: 'top',
  },
  composerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
  },
  composerFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearCaptionBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  clearCaptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  charWarningText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F59E0B',
  },
  counterText: {
    fontSize: 11,
    fontWeight: '500',
  },
  horizontalPillsScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  suggestionPill: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  hashtagPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  hashtagText: {
    fontSize: 12,
  },
  segmentedFormatRow: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 3,
    gap: 4,
  },
  segmentedFormatBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 17,
  },
  segmentedFormatBtnActive: {},
  segmentedFormatText: {
    fontSize: 12,
  },
  pinterestHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshBoardsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinterestCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  boardsLoadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  boardsLoadingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  boardsContainer: {
    gap: 6,
  },
  fieldHintText: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  boardsScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  boardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  boardChipText: {
    fontSize: 12,
  },
  pinterestInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
  },
  mediaCountBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  mediaCarousel: {
    gap: 8,
    paddingVertical: 4,
  },
  mediaThumbCard: {
    width: 76,
    height: 76,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaThumbImage: {
    width: '100%',
    height: '100%',
  },
  mediaThumbBadge: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mediaThumbBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },
  mediaThumbDelete: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMediaBtnsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addMediaBtn: {
    width: 76,
    height: 76,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addMediaBtnText: {
    fontSize: 11,
    fontWeight: '500',
  },
  uploadingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 14,
    marginTop: 8,
  },
  uploadingNoticeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  segmentedTimingRow: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 3,
    gap: 4,
  },
  segmentedTimingBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 17,
  },
  segmentedTimingBtnActive: {},
  segmentedTimingText: {
    fontSize: 13,
  },
  scheduleCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    marginTop: 10,
  },
  aspectRatioScroll: {
    paddingHorizontal: 2,
    gap: 8,
    paddingVertical: 4,
  },
  aspectRatioCard: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 90,
  },
  aspectRatioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  aspectRatioTitle: {
    fontSize: 13,
  },
  ratioBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  ratioBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  aspectRatioLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  aspectRatioWarn: {
    fontSize: 9,
    color: '#EF4444',
    marginTop: 3,
    fontWeight: '500',
  },
  scheduleSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  scheduleIsoWrap: {
    marginTop: 12,
  },
  scheduleFieldLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  scheduleInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
  },
  readableScheduleText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  previewContainer: {
    marginTop: 8,
  },
  previewMockupCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewHeaderUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewHandleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  previewSubtext: {
    fontSize: 11,
  },
  previewStatusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  previewStatusTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  previewCaption: {
    fontSize: 14,
    lineHeight: 20,
  },
  previewMediaWrap: {
    width: '100%',
    height: 180,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImageCover: {
    width: '100%',
    height: '100%',
  },
  videoPlayOverlay: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  multiMediaBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  multiMediaText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  previewActionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 24,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryPublishBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 24,
  },
  primaryPublishBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inModalDialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 9999,
  },
  inModalDialogCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  inModalDialogCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  inModalDialogIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    marginTop: 4,
  },
  inModalDialogTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  inModalDialogDesc: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  inModalDialogButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  inModalDialogBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inModalDialogBtnCancel: {},
  inModalDialogBtnPrimary: {},
  inModalDialogBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
