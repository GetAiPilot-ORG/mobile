import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { apiClient } from '../../../core/api/client';
import { TrendItem, TrendFeedResponse } from '../types';
import { useTheme, getColors } from '@/theme';
import {
  CATEGORIES,
  REGIONS,
  TrendCategory,
  TrendCard,
  TrendDetailModal,
  TrendGridSkeleton,
  useSavedTrends,
} from './trends';

interface SocialTrendsTabProps {
  trendsLoading: boolean;
  trendsList: TrendItem[];
  onUseTrendInPost: (trend: TrendItem) => void;
  onRefreshTrends?: () => void;
}

export const SocialTrendsTab: React.FC<SocialTrendsTabProps> = ({
  trendsLoading,
  trendsList,
  onUseTrendInPost,
  onRefreshTrends,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { width } = useWindowDimensions();

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<TrendCategory>(CATEGORIES[0]);
  const [selectedRegion, setSelectedRegion] = useState<string>('US');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSavedTabActive, setIsSavedTabActive] = useState<boolean>(false);

  // Detail Modal State
  const [selectedTrendForDetail, setSelectedTrendForDetail] = useState<TrendItem | null>(null);

  // Feed State
  const [liveTrends, setLiveTrends] = useState<TrendItem[]>([]);
  const [isFetchingCategory, setIsFetchingCategory] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  // Saved Trends Storage Hook
  const {
    savedTrends,
    savedCount,
    isSaved,
    toggleSave,
  } = useSavedTrends();

  // Initialize from incoming trendsList prop
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
              limit: 24,
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

        setPage(targetPage);

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

  // Category Selection
  const handleSelectCategory = (cat: TrendCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSavedTabActive(false);
    setSelectedCategory(cat);
    fetchTrendsFeed(cat, selectedRegion, 1, seenIds, false);
  };

  // Region Selection
  const handleSelectRegion = (region: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSavedTabActive(false);
    setSelectedRegion(region);
    fetchTrendsFeed(selectedCategory, region, 1, seenIds, false);
  };

  // Toggle Saved View
  const handleToggleSavedTab = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSavedTabActive((prev) => !prev);
  };

  // Load More Action
  const handleLoadMore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fetchTrendsFeed(selectedCategory, selectedRegion, page + 1, seenIds, true);
  };

  // Filtering Logic
  const displayList = useMemo(() => {
    const baseList = isSavedTabActive
      ? savedTrends
      : liveTrends.length > 0
      ? liveTrends
      : trendsList;

    if (!searchQuery.trim()) return baseList;

    const q = searchQuery.toLowerCase().trim();
    return baseList.filter((item) => {
      const titleMatch = (item.title || '').toLowerCase().includes(q);
      const captionMatch = (item.caption || '').toLowerCase().includes(q);
      const creatorMatch = (item.creator || '').toLowerCase().includes(q);
      const platformMatch = (item.source_platform || '').toLowerCase().includes(q);
      const tagsMatch = (item.niche_tags || []).some((tag) =>
        tag.toLowerCase().includes(q)
      );
      return titleMatch || captionMatch || creatorMatch || platformMatch || tagsMatch;
    });
  }, [isSavedTabActive, savedTrends, liveTrends, trendsList, searchQuery]);

  // Responsive Grid Calculation (2 cols on mobile, 3 on tablet/desktop)
  const isTablet = width >= 720;
  const numColumns = isTablet ? 3 : 2;

  const columnItems = useMemo(() => {
    const cols: TrendItem[][] = Array.from({ length: numColumns }, () => []);
    displayList.forEach((item, index) => {
      cols[index % numColumns].push(item);
    });
    return cols;
  }, [displayList, numColumns]);

  const isInitialLoading = trendsLoading && liveTrends.length === 0 && !isSavedTabActive;

  return (
    <View style={styles.container}>
      {/* 1. Hero Section Header */}
      <View style={styles.heroSection}>
        <Text
          style={[
            styles.heroHeading,
            { color: isDark ? '#F5F3FB' : '#20212B' },
          ]}
        >
          Discover what's trending
        </Text>
        <Text
          style={[
            styles.heroSubtitle,
            { color: isDark ? '#9CA3AF' : '#73798B' },
          ]}
        >
          Find viral inspiration for your next post.
        </Text>
      </View>

      {/* 2. Premium Search Experience */}
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: isDark ? '#1C1A25' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E9EAF1',
          },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={18}
          color={isDark ? '#9CA3AF' : '#73798B'}
        />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search trends, topics, creators..."
          placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
          style={[
            styles.searchInput,
            { color: isDark ? '#F5F3FB' : '#20212B' },
          ]}
          returnKeyType="search"
          autoCorrect={false}
        />
        {Boolean(searchQuery) && (
          <Pressable
            cssInterop={false}
            hitSlop={8}
            onPress={() => setSearchQuery('')}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={isDark ? '#9CA3AF' : '#73798B'}
            />
          </Pressable>
        )}
      </View>

      {/* 3. Filter Controls: Region Pills + Saved Ideas Toggle */}
      <View style={styles.regionFilterRow}>
        <View style={styles.regionPillsWrap}>
          {REGIONS.map((r) => {
            const isRegActive = !isSavedTabActive && selectedRegion === r.id;
            return (
              <Pressable
                key={r.id}
                cssInterop={false}
                onPress={() => handleSelectRegion(r.id)}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${r.label}`}
                style={({ pressed }) => [
                  styles.regionPill,
                  {
                    backgroundColor: isRegActive
                      ? '#7055E8'
                      : isDark
                      ? '#1C1A25'
                      : '#FFFFFF',
                    borderColor: isRegActive
                      ? '#7055E8'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : '#E9EAF1',
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Ionicons
                  name={r.icon}
                  size={12}
                  color={isRegActive ? '#FFFFFF' : isDark ? '#9CA3AF' : '#73798B'}
                />
                <Text
                  style={[
                    styles.regionPillText,
                    {
                      color: isRegActive
                        ? '#FFFFFF'
                        : isDark
                        ? '#F5F3FB'
                        : '#20212B',
                    },
                  ]}
                >
                  {r.id === 'GLOBAL' ? 'Global' : r.id === 'US' ? 'US' : 'India'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Saved Ideas Bookmark Pill */}
        <Pressable
          cssInterop={false}
          onPress={handleToggleSavedTab}
          accessibilityRole="button"
          accessibilityLabel="View saved ideas"
          style={({ pressed }) => [
            styles.savedPill,
            {
              backgroundColor: isSavedTabActive
                ? '#E83E91'
                : isDark
                ? '#1C1A25'
                : '#FFFFFF',
              borderColor: isSavedTabActive
                ? '#E83E91'
                : isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : '#E9EAF1',
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Ionicons
            name={isSavedTabActive ? 'bookmark' : 'bookmark-outline'}
            size={13}
            color={isSavedTabActive ? '#FFFFFF' : isDark ? '#9CA3AF' : '#73798B'}
          />
          <Text
            style={[
              styles.savedPillText,
              {
                color: isSavedTabActive
                  ? '#FFFFFF'
                  : isDark
                  ? '#F5F3FB'
                  : '#20212B',
              },
            ]}
          >
            Saved {savedCount > 0 ? `(${savedCount})` : ''}
          </Text>
        </Pressable>
      </View>

      {/* 4. Horizontal Content Category Filter Chips */}
      {!isSavedTabActive && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScrollContainer}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory.id === cat.id;
            return (
              <Pressable
                key={cat.id}
                cssInterop={false}
                onPress={() => handleSelectCategory(cat)}
                accessibilityRole="button"
                accessibilityLabel={cat.label}
                style={({ pressed }) => [
                  styles.categoryChip,
                  {
                    backgroundColor: isActive
                      ? '#7055E8'
                      : isDark
                      ? '#1C1A25'
                      : '#FFFFFF',
                    borderColor: isActive
                      ? '#7055E8'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : '#E9EAF1',
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Ionicons
                  name={cat.icon}
                  size={13}
                  color={isActive ? '#FFFFFF' : isDark ? '#9CA3AF' : '#73798B'}
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    {
                      color: isActive
                        ? '#FFFFFF'
                        : isDark
                        ? '#F5F3FB'
                        : '#20212B',
                    },
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Fetching Category Indicator */}
      {isFetchingCategory && (
        <View style={styles.fetchingCategoryBar}>
          <ActivityIndicator size="small" color="#7055E8" />
          <Text
            style={[
              styles.fetchingText,
              { color: isDark ? '#9CA3AF' : '#73798B' },
            ]}
          >
            Updating trends...
          </Text>
        </View>
      )}

      {/* 5. Main Feed Area */}
      {isInitialLoading ? (
        <TrendGridSkeleton isDark={isDark} />
      ) : isSavedTabActive && savedTrends.length === 0 ? (
        /* Empty Saved State */
        <View
          style={[
            styles.emptyStateCard,
            {
              backgroundColor: isDark ? '#1C1A25' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E9EAF1',
            },
          ]}
        >
          <View
            style={[
              styles.emptyIconCircle,
              { backgroundColor: isDark ? '#252230' : '#FDE7F2' },
            ]}
          >
            <Ionicons name="bookmark-outline" size={28} color="#E83E91" />
          </View>
          <Text
            style={[
              styles.emptyTitle,
              { color: isDark ? '#F5F3FB' : '#20212B' },
            ]}
          >
            No Saved Ideas Yet
          </Text>
          <Text
            style={[
              styles.emptySubtitle,
              { color: isDark ? '#9CA3AF' : '#73798B' },
            ]}
          >
            Tap the bookmark icon on any trend card to save viral inspiration for later.
          </Text>
          <Pressable
            cssInterop={false}
            onPress={() => setIsSavedTabActive(false)}
            style={styles.primaryActionButton}
          >
            <Text style={styles.primaryActionButtonText}>Explore Trends</Text>
          </Pressable>
        </View>
      ) : displayList.length === 0 ? (
        /* Empty Search or Feed State */
        <View
          style={[
            styles.emptyStateCard,
            {
              backgroundColor: isDark ? '#1C1A25' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E9EAF1',
            },
          ]}
        >
          <View
            style={[
              styles.emptyIconCircle,
              { backgroundColor: isDark ? '#252230' : '#F0ECFF' },
            ]}
          >
            <Ionicons name="search-outline" size={28} color="#7055E8" />
          </View>
          <Text
            style={[
              styles.emptyTitle,
              { color: isDark ? '#F5F3FB' : '#20212B' },
            ]}
          >
            No Matching Trends
          </Text>
          <Text
            style={[
              styles.emptySubtitle,
              { color: isDark ? '#9CA3AF' : '#73798B' },
            ]}
          >
            {searchQuery
              ? `No items found matching "${searchQuery}". Try different keywords.`
              : 'No trend items found for this category or region.'}
          </Text>
          <Pressable
            cssInterop={false}
            onPress={() => {
              setSearchQuery('');
              setSelectedCategory(CATEGORIES[0]);
              onRefreshTrends?.();
            }}
            style={styles.primaryActionButton}
          >
            <Ionicons name="reload" size={13} color="#FFFFFF" />
            <Text style={styles.primaryActionButtonText}>Reset Filters</Text>
          </Pressable>
        </View>
      ) : (
        /* 2-Column Responsive Discovery Grid */
        <View style={styles.gridWrapper}>
          <View style={styles.columnsRow}>
            {columnItems.map((col, colIndex) => (
              <View key={`col_${colIndex}`} style={styles.gridColumn}>
                {col.map((item, itemIdx) => (
                  <TrendCard
                    key={item.id || `item_${colIndex}_${itemIdx}`}
                    trend={item}
                    index={itemIdx * numColumns + colIndex}
                    isSaved={isSaved(item.id)}
                    onToggleSave={toggleSave}
                    onPressCard={(t) => setSelectedTrendForDetail(t)}
                    onUseIdea={onUseTrendInPost}
                    isDark={isDark}
                  />
                ))}
              </View>
            ))}
          </View>

          {/* Load More Button (Only in Discover mode) */}
          {!isSavedTabActive && (
            <Pressable
              cssInterop={false}
              disabled={isLoadingMore}
              onPress={handleLoadMore}
              accessibilityRole="button"
              accessibilityLabel="Load more fresh trends"
              style={({ pressed }) => [
                styles.loadMoreButton,
                {
                  backgroundColor: isDark ? '#1C1A25' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E9EAF1',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              {isLoadingMore ? (
                <ActivityIndicator size="small" color="#7055E8" />
              ) : (
                <>
                  <Ionicons name="arrow-down-circle-outline" size={16} color="#7055E8" />
                  <Text
                    style={[
                      styles.loadMoreButtonText,
                      { color: isDark ? '#F5F3FB' : '#20212B' },
                    ]}
                  >
                    Load More Fresh Trends
                  </Text>
                </>
              )}
            </Pressable>
          )}

          {/* Dedicated bottom spacer to prevent floating bottom navigation overlap */}
          <View style={styles.bottomNavClearanceSpacer} />
        </View>
      )}

      {/* 6. Trend Detail Modal */}
      <TrendDetailModal
        visible={Boolean(selectedTrendForDetail)}
        trend={selectedTrendForDetail}
        onClose={() => setSelectedTrendForDetail(null)}
        onUseIdea={onUseTrendInPost}
        isSaved={selectedTrendForDetail ? isSaved(selectedTrendForDetail.id) : false}
        onToggleSave={toggleSave}
        isDark={isDark}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  heroSection: {
    gap: 4,
    marginBottom: 4,
  },
  heroHeading: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  regionFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  regionPillsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  regionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  regionPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  savedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  savedPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryScrollContainer: {
    marginHorizontal: -20,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    gap: 7,
    paddingVertical: 2,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7.5,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fetchingCategoryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  fetchingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  gridWrapper: {
    gap: 14,
  },
  columnsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  gridColumn: {
    flex: 1,
    gap: 12,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 6,
  },
  loadMoreButtonText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  bottomNavClearanceSpacer: {
    height: 40,
  },
  emptyStateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 44,
    paddingHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    marginTop: 8,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 280,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7055E8',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 6,
  },
  primaryActionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
