import { ProductHeading } from "@/components/ProductUI";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { apiClient } from '../../../core/api/client';
import { SocialTrendsSkeleton } from '../../../components/skeletonScreen';
import { TrendItem, TrendFeedResponse } from '../types';
import { useTheme, getColors } from '@/theme';

interface SocialTrendsTabProps {
  trendsLoading: boolean;
  trendsList: TrendItem[];
  onUseTrendInPost: (trend: TrendItem) => void;
  onRefreshTrends?: () => void;
}

interface TrendCategory {
  id: string;
  label: string;
  type: string;
  category: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const CATEGORIES: TrendCategory[] = [
  { id: 'all', label: 'All Trends', type: 'all', category: 'all', icon: 'flame' },
  { id: 'reels', label: 'Reels & Shorts', type: 'reel_video', category: 'all', icon: 'videocam' },
  { id: 'youtube', label: 'YouTube Viral', type: 'video', category: 'all', icon: 'logo-youtube' },
  { id: 'visuals', label: 'Visual Inspo', type: 'visual', category: 'aesthetic', icon: 'camera' },
  { id: 'tech', label: 'Tech & AI', type: 'all', category: 'tech', icon: 'hardware-chip' },
  { id: 'business', label: 'Business', type: 'all', category: 'business', icon: 'briefcase' },
  { id: 'news', label: 'Breaking News', type: 'news', category: 'all', icon: 'newspaper' },
  { id: 'surges', label: 'Search Surges', type: 'trend_query', category: 'all', icon: 'trending-up' },
];

const REGIONS = [
  { id: 'GLOBAL', label: 'Global', icon: 'globe-outline' as const },
  { id: 'US', label: 'US', icon: 'location-outline' as const },
  { id: 'IN', label: 'India', icon: 'location-outline' as const },
];

export const SocialTrendsTab: React.FC<SocialTrendsTabProps> = ({
  trendsLoading,
  trendsList,
  onUseTrendInPost,
  onRefreshTrends,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<TrendCategory>(CATEGORIES[0]);
  const [selectedRegion, setSelectedRegion] = useState<string>('US');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Feed State
  const [liveTrends, setLiveTrends] = useState<TrendItem[]>([]);
  const [isFetchingCategory, setIsFetchingCategory] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalCandidates, setTotalCandidates] = useState<number | null>(null);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  // Initialize from props
  useEffect(() => {
    if (trendsList && trendsList.length > 0 && liveTrends.length === 0) {
      setLiveTrends(trendsList);
      const newSeen = new Set<string>();
      trendsList.forEach((item) => {
        if (item.id) newSeen.add(item.id);
      });
      setSeenIds(newSeen);
    }
  }, [trendsList, liveTrends.length]);

  // Fetch trend feed from API
  const fetchTrendsFeed = useCallback(
    async (
      cat: TrendCategory,
      region: string,
      targetPage: number = 1,
      currentSeen: Set<string> = new Set(),
      isAppend: boolean = false
    ) => {
      try {
        if (isAppend) {
          setIsLoadingMore(true);
        } else {
          setIsFetchingCategory(true);
        }

        const seenParam = Array.from(currentSeen).slice(0, 120).join(',');

        const res: TrendFeedResponse = await apiClient.get<TrendFeedResponse>(
          '/mobile/v1/social/trends',
          {
            params: {
              limit: 25,
              page: targetPage,
              type: cat.type,
              category: cat.category,
              region,
              seen: seenParam || undefined,
            },
          }
        );

        const newItems: TrendItem[] = Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res)
          ? (res as any)
          : [];

        if (isAppend) {
          setLiveTrends((prev) => {
            const existingIds = new Set(prev.map((i) => i.id));
            const filteredNew = newItems.filter((i) => !existingIds.has(i.id));
            return [...prev, ...filteredNew];
          });
        } else {
          setLiveTrends(newItems);
        }

        if (res?.totalCandidateCount != null) {
          setTotalCandidates(res.totalCandidateCount);
        }

        setPage(targetPage);

        // Update seen IDs
        setSeenIds((prev) => {
          const updated = new Set(prev);
          newItems.forEach((i) => {
            if (i.id) updated.add(i.id);
          });
          return updated;
        });
      } catch (err) {
        console.warn('[TRENDS TAB] Error fetching trend feed:', err);
      } finally {
        setIsFetchingCategory(false);
        setIsLoadingMore(false);
      }
    },
    []
  );

  // Handle Category Change
  const handleSelectCategory = (cat: TrendCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(cat);
    fetchTrendsFeed(cat, selectedRegion, 1, seenIds, false);
  };

  // Handle Region Change
  const handleSelectRegion = (region: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedRegion(region);
    fetchTrendsFeed(selectedCategory, region, 1, seenIds, false);
  };

  // Handle Load More
  const handleLoadMore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fetchTrendsFeed(selectedCategory, selectedRegion, page + 1, seenIds, true);
  };

  // Client-side search and filtering
  const displayList = useMemo(() => {
    const list = liveTrends.length > 0 ? liveTrends : trendsList;
    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase().trim();
    return list.filter((item) => {
      const titleMatch = (item.title || '').toLowerCase().includes(q);
      const captionMatch = (item.caption || '').toLowerCase().includes(q);
      const creatorMatch = (item.creator || '').toLowerCase().includes(q);
      const platformMatch = (item.source_platform || '').toLowerCase().includes(q);
      const tagsMatch = (item.niche_tags || []).some((tag) =>
        tag.toLowerCase().includes(q)
      );
      return titleMatch || captionMatch || creatorMatch || platformMatch || tagsMatch;
    });
  }, [liveTrends, trendsList, searchQuery]);

  // Format numbers nicely (e.g. 2,865,086 -> 2.8M, 25,099 -> 25.1K)
  const formatCompact = (val?: number) => {
    if (val == null) return null;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
    return val.toLocaleString();
  };

  // Helper for platform styling & icons
  const getPlatformMeta = (platformRaw: string = '') => {
    const p = platformRaw.toLowerCase();
    if (p.includes('youtube')) {
      return {
        label: 'YouTube',
        icon: 'logo-youtube' as const,
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.12)',
      };
    }
    if (p.includes('pexels')) {
      return {
        label: 'Pexels Reel',
        icon: 'videocam' as const,
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.12)',
      };
    }
    if (p.includes('unsplash')) {
      return {
        label: 'Unsplash',
        icon: 'camera' as const,
        color: '#06b6d4',
        bg: 'rgba(6, 182, 212, 0.12)',
      };
    }
    if (p.includes('gnews') || p.includes('news')) {
      return {
        label: 'Google News',
        icon: 'newspaper' as const,
        color: '#3b82f6',
        bg: 'rgba(59, 130, 246, 0.12)',
      };
    }
    if (p.includes('google_trends') || p.includes('trend')) {
      return {
        label: 'Google Trends',
        icon: 'trending-up' as const,
        color: '#8b5cf6',
        bg: 'rgba(139, 92, 246, 0.12)',
      };
    }
    if (p.includes('reddit')) {
      return {
        label: 'Reddit',
        icon: 'logo-reddit' as const,
        color: '#f97316',
        bg: 'rgba(249, 115, 22, 0.12)',
      };
    }
    return {
      label: platformRaw || 'Social',
      icon: 'flame' as const,
      color: '#ec4899',
      bg: 'rgba(236, 72, 153, 0.12)',
    };
  };

  const isInitialLoading = trendsLoading && liveTrends.length === 0;

  const renderTrendCard = (trend: TrendItem, idx: number) => {
    const platform = getPlatformMeta(
      trend.source_platform || trend.platform
    );
    const views = trend.metrics?.views;
    const likes = trend.metrics?.likes;
    const comments = trend.metrics?.comments;
    const searchVolume = trend.metrics?.searchVolume;
    const duration = trend.metrics?.duration || (trend.duration ? `${trend.duration}s` : null);
    const quality = trend.metrics?.quality;
    const sourceName = trend.metrics?.source || trend.creator;
    const engagement = trend.engagement_score;
    const mediaUrl = trend.thumbnail_url || trend.full_image_url;

    return (
      <View
        key={trend.id || `trend_${idx}`}
        style={[
          styles.trendCard,
          {
            backgroundColor: isDark ? '#1C1A25' : '#ffffff',
            borderColor: isDark ? '#252230' : '#E9E6F2',
          },
        ]}
      >
        {/* Header: Platform Badge + Rank Badge */}
        <View style={styles.trendHeader}>
          <View
            style={[
              styles.sourceBadge,
              { backgroundColor: platform.bg },
            ]}
          >
            <Ionicons
              name={platform.icon}
              size={11}
              color={platform.color}
            />
            <Text
              style={[
                styles.trendSource,
                { color: platform.color },
              ]}
              numberOfLines={1}
            >
              {platform.label}
            </Text>
          </View>

          <View style={styles.headerRightBadges}>
            {engagement != null && engagement > 0 && (
              <View style={styles.engagementBadge}>
                <Ionicons name="flame" size={10} color="#f59e0b" />
                <Text style={styles.engagementText}>
                  {formatCompact(engagement)}
                </Text>
              </View>
            )}
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#{idx + 1}</Text>
            </View>
          </View>
        </View>

        {/* Creator Attribution */}
        {Boolean(sourceName) && (
          <View style={styles.creatorRow}>
            <Text
              style={[
                styles.creatorText,
                { color: isDark ? '#777383' : '#64748b' },
              ]}
              numberOfLines={1}
            >
              by{' '}
              <Text
                style={[
                  styles.creatorHighlight,
                  { color: isDark ? '#F0EEF8' : '#252230' },
                ]}
              >
                {sourceName}
              </Text>
              {quality ? ` • ${quality.toUpperCase()}` : null}
              {duration ? ` • ${duration}` : null}
            </Text>
          </View>
        )}

        {/* Title */}
        <Text
          style={[
            styles.trendTitle,
            { color: isDark ? '#F5F3FB' : '#1C1A25' },
          ]}
          numberOfLines={3}
        >
          {trend.title || trend.caption || 'Trending viral topic'}
        </Text>

        {/* Media Preview Image */}
        {Boolean(mediaUrl) && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: mediaUrl }}
              style={styles.trendImage}
              resizeMode="cover"
            />
            {Boolean(duration) && (
              <View style={styles.videoDurationBadge}>
                <Ionicons name="play" size={9} color="#ffffff" />
                <Text style={styles.videoDurationText}>{duration}</Text>
              </View>
            )}
            {Boolean(trend.color) && (
              <View
                style={[
                  styles.colorDot,
                  { backgroundColor: trend.color },
                ]}
              />
            )}
          </View>
        )}

        {/* Metrics Row */}
        <View style={styles.metricsRow}>
          {views != null && (
            <View style={styles.metricBadge}>
              <Ionicons
                name="eye-outline"
                size={11}
                color="#ec4899"
              />
              <Text style={styles.metricBadgeText}>
                {formatCompact(Number(views))}
              </Text>
            </View>
          )}
          {likes != null && (
            <View style={styles.metricBadge}>
              <Ionicons
                name="heart-outline"
                size={11}
                color="#ec4899"
              />
              <Text style={styles.metricBadgeText}>
                {formatCompact(Number(likes))}
              </Text>
            </View>
          )}
          {comments != null && (
            <View style={styles.metricBadge}>
              <Ionicons
                name="chatbubble-outline"
                size={11}
                color="#ec4899"
              />
              <Text style={styles.metricBadgeText}>
                {formatCompact(Number(comments))}
              </Text>
            </View>
          )}
          {searchVolume != null && (
            <View style={styles.metricBadge}>
              <Ionicons
                name="search-outline"
                size={11}
                color="#8b5cf6"
              />
              <Text
                style={[styles.metricBadgeText, { color: '#8b5cf6' }]}
              >
                {formatCompact(Number(searchVolume))}
              </Text>
            </View>
          )}
        </View>

        {/* Niche Tags Pills */}
        {Array.isArray(trend.niche_tags) && trend.niche_tags.length > 0 && (
          <View style={styles.tagsRow}>
            {trend.niche_tags.slice(0, 2).map((tag, tagIdx) => (
              <View
                key={`${trend.id}_tag_${tagIdx}`}
                style={[
                  styles.tagPill,
                  {
                    backgroundColor: isDark ? '#252230' : '#F0EEF8',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tagPillText,
                    { color: isDark ? '#777383' : '#64748b' },
                  ]}
                  numberOfLines={1}
                >
                  #{tag}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons Row */}
        <View style={styles.cardActionsRow}>
          {Boolean(trend.source_url) && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (trend.source_url) {
                  Linking.openURL(trend.source_url);
                }
              }}
              style={[
                styles.sourceLinkBtn,
                {
                  backgroundColor: isDark ? '#252230' : '#F5F3FB',
                  borderColor: isDark ? '#334155' : '#E9E6F2',
                },
              ]}
            >
              <Ionicons
                name="open-outline"
                size={13}
                color={isDark ? '#777383' : '#64748b'}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onUseTrendInPost(trend);
            }}
            style={styles.useTopicBtn}
          >
            <Ionicons name="sparkles" size={12} color="#ec4899" />
            <Text style={styles.useTopicBtnText}>Use Idea</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ProductHeading title="Find your next idea" />
      {/* Search and Region Controls Header */}
      <View style={styles.topFilterBar}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: isDark ? '#252230' : '#F0EEF8',
              borderColor: isDark ? '#334155' : '#E9E6F2',
            },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={16}
            color={isDark ? '#777383' : '#64748b'}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search viral keywords, hooks, niches..."
            placeholderTextColor={isDark ? '#64748b' : '#777383'}
            style={[styles.searchInput, { color: isDark ? '#F5F3FB' : '#1C1A25' }]}
          />
          {Boolean(searchQuery) && (
            <TouchableOpacity activeOpacity={0.7} onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons
                name="close-circle"
                size={16}
                color={isDark ? '#777383' : '#64748b'}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Region Chips */}
        <View style={styles.regionSelectorRow}>
          {REGIONS.map((r) => {
            const isRegActive = selectedRegion === r.id;
            return (
              <TouchableOpacity
                key={r.id}
                activeOpacity={0.7}
                onPress={() => handleSelectRegion(r.id)}
                style={[
                  styles.regionChip,
                  { flexDirection: 'row', alignItems: 'center', gap: 4 },
                  {
                    backgroundColor: isRegActive
                      ? isDark
                        ? '#3b82f6'
                        : '#2563eb'
                      : isDark
                      ? '#252230'
                      : '#F0EEF8',
                  },
                ]}
              >
                <Ionicons
                  name={r.icon}
                  size={12}
                  color={isRegActive ? '#ffffff' : isDark ? '#777383' : '#64748b'}
                />
                <Text
                  style={[
                    styles.regionText,
                    {
                      color: isRegActive
                        ? '#ffffff'
                        : isDark
                        ? '#777383'
                        : '#64748b',
                    },
                  ]}
                >
                  {r.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Category Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory.id === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.7}
              onPress={() => handleSelectCategory(cat)}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: isActive
                    ? '#ec4899'
                    : isDark
                    ? '#252230'
                    : '#F0EEF8',
                },
              ]}
            >
              <Ionicons
                name={cat.icon}
                size={14}
                color={isActive ? '#ffffff' : isDark ? '#777383' : '#64748b'}
              />
              <Text
                style={[
                  styles.categoryText,
                  {
                    color: isActive
                      ? '#ffffff'
                      : isDark
                      ? '#777383'
                      : '#64748b',
                  },
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isFetchingCategory && <ActivityIndicator size="small" color={colors.accent} />}

      {/* Main Content Area */}
      {isInitialLoading ? (
        <SocialTrendsSkeleton />
      ) : displayList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="flame-outline"
            size={48}
            color={isDark ? '#475569' : '#777383'}
          />
          <Text
            style={[styles.emptyTitle, { color: isDark ? '#F5F3FB' : '#1C1A25' }]}
          >
            No Trends Found
          </Text>
          <Text
            style={[styles.emptyDesc, { color: isDark ? '#64748b' : '#777383' }]}
          >
            {searchQuery
              ? `No matching items found for "${searchQuery}". Try clearing search.`
              : 'Try selecting another category or region to discover real-time viral media.'}
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setSearchQuery('');
              handleSelectCategory(CATEGORIES[0]);
              onRefreshTrends?.();
            }}
            style={styles.refreshEmptyBtn}
          >
            <Ionicons name="reload" size={14} color="#ffffff" />
            <Text style={styles.refreshEmptyBtnText}>Reset to All Trends</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.feedWrapper}>
          <View style={styles.masonryContainer}>
            <View style={styles.masonryColumn}>
              {displayList
                .filter((_, idx) => idx % 2 === 0)
                .map((trend, colIdx) => renderTrendCard(trend, colIdx * 2))}
            </View>
            <View style={styles.masonryColumn}>
              {displayList
                .filter((_, idx) => idx % 2 === 1)
                .map((trend, colIdx) => renderTrendCard(trend, colIdx * 2 + 1))}
            </View>
          </View>

          {/* Load More Button */}
          <TouchableOpacity
            disabled={isLoadingMore}
            activeOpacity={0.8}
            onPress={handleLoadMore}
            style={[
              styles.loadMoreBtn,
              {
                backgroundColor: isDark ? '#252230' : '#F0EEF8',
                borderColor: isDark ? '#334155' : '#E9E6F2',
              },
            ]}
          >
            {isLoadingMore ? (
              <ActivityIndicator size="small" color="#ec4899" />
            ) : (
              <>
                <Ionicons name="arrow-down-circle-outline" size={16} color="#ec4899" />
                <Text
                  style={[
                    styles.loadMoreText,
                    { color: isDark ? '#F0EEF8' : '#252230' },
                  ]}
                >
                  Load More Fresh Trends
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  topFilterBar: {
    gap: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 0,
    gap: 8, minHeight: 48 },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  regionSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  regionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  regionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabHeading: {
    fontSize: 18,
    fontWeight: '800',
  },
  tabSubheading: {
    fontSize: 13,
    marginTop: 2,
  },
  feedWrapper: {
    gap: 12,
  },
  masonryContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  masonryColumn: {
    flex: 1,
    gap: 10,
  },
  trendCard: {
    width: '100%',
    borderRadius: 18,
    padding: 12,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: '65%',
  },
  trendSource: {
    fontSize: 10,
    fontWeight: '700',
  },
  headerRightBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  engagementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 5,
  },
  engagementText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#d97706',
  },
  rankBadge: {
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
  },
  rankText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748b',
  },
  creatorRow: {
    marginBottom: 4,
  },
  creatorText: {
    fontSize: 10,
    fontWeight: '500',
  },
  creatorHighlight: {
    fontWeight: '700',
  },
  trendTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 8,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  trendImage: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    backgroundColor: '#cbd5e1',
  },
  videoDurationBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
  },
  videoDurationText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
  },
  colorDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  metricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metricBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#777383',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 10,
  },
  tagPill: {
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  tagPillText: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  sourceLinkBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    width: 32,
    height: 32,
  },
  sourceLinkText: {
    fontSize: 11,
    fontWeight: '600',
  },
  useTopicBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#ec4899',
    borderRadius: 8,
    height: 32,
    backgroundColor: 'rgba(236, 72, 153, 0.08)',
  },
  useTopicBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ec4899',
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
  refreshEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ec4899',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 8,
  },
  refreshEmptyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 6,
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
