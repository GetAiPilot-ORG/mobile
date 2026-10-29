import { Ionicons } from '@expo/vector-icons';

export interface TrendPlatformMeta {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
}

export function formatCompact(val?: number): string | null {
  if (val == null || isNaN(val)) return null;
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return val.toLocaleString();
}

export function getPlatformMeta(platformRaw: string = ''): TrendPlatformMeta {
  const p = (platformRaw || '').toLowerCase();
  if (p.includes('youtube')) {
    return {
      label: 'YouTube',
      icon: 'logo-youtube',
      color: '#EF4444',
      bg: 'rgba(239, 68, 68, 0.12)',
    };
  }
  if (p.includes('pexels')) {
    return {
      label: 'Pexels Reel',
      icon: 'videocam',
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.12)',
    };
  }
  if (p.includes('unsplash')) {
    return {
      label: 'Unsplash',
      icon: 'camera',
      color: '#06B6D4',
      bg: 'rgba(6, 182, 212, 0.12)',
    };
  }
  if (p.includes('gnews') || p.includes('news')) {
    return {
      label: 'Google News',
      icon: 'newspaper',
      color: '#3B82F6',
      bg: 'rgba(59, 130, 246, 0.12)',
    };
  }
  if (p.includes('google_trends') || p.includes('trend')) {
    return {
      label: 'Google Trends',
      icon: 'trending-up',
      color: '#8B5CF6',
      bg: 'rgba(139, 92, 246, 0.12)',
    };
  }
  if (p.includes('reddit')) {
    return {
      label: 'Reddit',
      icon: 'logo-reddit',
      color: '#F97316',
      bg: 'rgba(249, 115, 22, 0.12)',
    };
  }
  return {
    label: platformRaw || 'Social Trend',
    icon: 'flame',
    color: '#7055E8',
    bg: 'rgba(112, 85, 232, 0.12)',
  };
}

export interface TrendCategory {
  id: string;
  label: string;
  type: string;
  category: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const CATEGORIES: TrendCategory[] = [
  { id: 'all', label: 'All Trends', type: 'all', category: 'all', icon: 'flame-outline' },
  { id: 'reels', label: 'Reels & Shorts', type: 'reel_video', category: 'all', icon: 'videocam-outline' },
  { id: 'youtube', label: 'YouTube Viral', type: 'video', category: 'all', icon: 'logo-youtube' },
  { id: 'visuals', label: 'Visual Inspo', type: 'visual', category: 'aesthetic', icon: 'image-outline' },
  { id: 'tech', label: 'Tech & AI', type: 'all', category: 'tech', icon: 'hardware-chip-outline' },
  { id: 'business', label: 'Business', type: 'all', category: 'business', icon: 'briefcase-outline' },
  { id: 'news', label: 'News', type: 'news', category: 'all', icon: 'newspaper-outline' },
  { id: 'surges', label: 'Search Surges', type: 'trend_query', category: 'all', icon: 'trending-up-outline' },
];

export const REGIONS = [
  { id: 'GLOBAL', label: 'Global', icon: 'globe-outline' as const },
  { id: 'US', label: 'United States', icon: 'location-outline' as const },
  { id: 'IN', label: 'India', icon: 'location-outline' as const },
];

