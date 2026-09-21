import { Ionicons } from '@expo/vector-icons';

export interface ChannelMeta {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
}

export interface StatusMeta {
  label: string;
  color: string;
  bg: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const getChannelMeta = (channelKey: string): ChannelMeta => {
  const clean = (channelKey || '').toLowerCase();
  if (clean.includes('youtube')) {
    return { name: 'YouTube', icon: 'logo-youtube', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' };
  }
  if (clean.includes('instagram')) {
    return { name: 'Instagram', icon: 'logo-instagram', color: '#e1306c', bg: 'rgba(225, 48, 108, 0.12)' };
  }
  if (clean.includes('facebook')) {
    return { name: 'Facebook', icon: 'logo-facebook', color: '#1877f2', bg: 'rgba(24, 119, 242, 0.12)' };
  }
  if (clean.includes('x') || clean.includes('twitter')) {
    return { name: 'X', icon: 'logo-twitter', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' };
  }
  if (clean.includes('linkedin')) {
    return { name: 'LinkedIn', icon: 'logo-linkedin', color: '#0a66c2', bg: 'rgba(10, 102, 194, 0.12)' };
  }
  if (clean.includes('pinterest')) {
    return { name: 'Pinterest', icon: 'logo-pinterest', color: '#e60023', bg: 'rgba(230, 0, 35, 0.12)' };
  }
  if (clean.includes('tiktok')) {
    return { name: 'TikTok', icon: 'videocam', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)' };
  }
  return { name: channelKey.replace(/^.+:/, ''), icon: 'share-social', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)' };
};

export const getStatusMeta = (status: string): StatusMeta => {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'sent':
    case 'published':
      return { label: 'Published', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.14)', icon: 'checkmark-circle' };
    case 'failed':
      return { label: 'Failed', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.14)', icon: 'alert-circle' };
    case 'scheduled':
    case 'queued':
      return { label: 'Scheduled', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.14)', icon: 'time' };
    case 'processing':
      return { label: 'Processing', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.14)', icon: 'sync' };
    case 'cancelled':
      return { label: 'Cancelled', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.14)', icon: 'close-circle' };
    default:
      return { label: status || 'Pending', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.14)', icon: 'time' };
  }
};
