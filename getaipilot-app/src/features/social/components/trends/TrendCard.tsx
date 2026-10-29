import React, { useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { TrendItem } from '../../types';
import { formatCompact, getPlatformMeta } from './trendUtils';

interface TrendCardProps {
  trend: TrendItem;
  index: number;
  isSaved: boolean;
  onToggleSave: (trend: TrendItem) => void;
  onPressCard: (trend: TrendItem) => void;
  onUseIdea: (trend: TrendItem) => void;
  isDark: boolean;
}

export const TrendCard: React.FC<TrendCardProps> = ({
  trend,
  index,
  isSaved,
  onToggleSave,
  onPressCard,
  onUseIdea,
  isDark,
}) => {
  const [imgError, setImgError] = useState(false);
  const platform = getPlatformMeta(trend.source_platform || trend.platform);

  const views = trend.metrics?.views;
  const likes = trend.metrics?.likes;
  const comments = trend.metrics?.comments;
  const searchVolume = trend.metrics?.searchVolume;
  const duration = trend.metrics?.duration || (trend.duration ? `${trend.duration}s` : null);
  const sourceName = trend.metrics?.source || trend.creator;
  const engagement = trend.engagement_score;
  const mediaUrl = trend.thumbnail_url || trend.full_image_url;
  const rank = trend.metrics?.rank ?? index + 1;

  // Single primary tag if useful
  const primaryTag =
    Array.isArray(trend.niche_tags) && trend.niche_tags.length > 0
      ? trend.niche_tags[0]
      : null;

  // Available engagement metric to showcase
  const primaryMetric = views != null
    ? { icon: 'eye-outline' as const, val: formatCompact(Number(views)) }
    : likes != null
      ? { icon: 'heart-outline' as const, val: formatCompact(Number(likes)) }
      : comments != null
        ? { icon: 'chatbubble-outline' as const, val: formatCompact(Number(comments)) }
        : searchVolume != null
          ? { icon: 'search-outline' as const, val: formatCompact(Number(searchVolume)) }
          : null;

  const secondaryMetric = views != null && likes != null
    ? { icon: 'heart-outline' as const, val: formatCompact(Number(likes)) }
    : views != null && comments != null
      ? { icon: 'chatbubble-outline' as const, val: formatCompact(Number(comments)) }
      : null;

  return (
    <Pressable
      cssInterop={false}
      onPress={() => onPressCard(trend)}
      accessibilityRole="button"
      accessibilityLabel={trend.title || trend.caption || 'Trending item'}
      style={({ pressed }) => [
        styles.cardOuter,
        {
          backgroundColor: isDark ? '#1C1A25' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E9EAF1',
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      {/* 1. Large Thumbnail with Overlays */}
      <View
        style={[
          styles.thumbnailWrapper,
          { backgroundColor: isDark ? '#252230' : '#F0ECFF' },
        ]}
      >
        {Boolean(mediaUrl) && !imgError ? (
          <Image
            source={{ uri: mediaUrl }}
            style={styles.thumbnailImage}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={styles.thumbnailFallback}>
            <Ionicons name={platform.icon} size={28} color={platform.color} />
          </View>
        )}

        {/* Top-Left: Compact Platform Badge */}
        <View style={styles.platformBadgeFloating}>
          <Ionicons name={platform.icon} size={11} color="#FFFFFF" />
          <Text style={styles.platformBadgeText} numberOfLines={1}>
            {platform.label}
          </Text>
        </View>

        {/* Top-Right: Bookmark / Save Action */}
        <Pressable
          cssInterop={false}
          hitSlop={8}
          onPress={(e) => {
            e.stopPropagation();
            onToggleSave(trend);
          }}
          accessibilityRole="button"
          accessibilityLabel={isSaved ? 'Remove from saved' : 'Save idea'}
          style={({ pressed }) => [
            styles.bookmarkBtnFloating,
            {
              backgroundColor: isSaved
                ? '#E83E91'
                : 'rgba(0, 0, 0, 0.45)',
              opacity: pressed ? 0.75 : 1,
              transform: [{ scale: pressed ? 0.9 : 1 }],
            },
          ]}
        >
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={13}
            color="#FFFFFF"
          />
        </Pressable>

        {/* Bottom-Right: Duration or Quality Badge if Video */}
        {Boolean(duration) && (
          <View style={styles.durationBadgeFloating}>
            <Ionicons name="play" size={8} color="#FFFFFF" />
            <Text style={styles.durationBadgeText}>{duration}</Text>
          </View>
        )}

        {/* Bottom-Left: Rank / Momentum Indicator */}
        {rank != null && rank <= 50 && (
          <View style={styles.rankBadgeFloating}>
            <Text style={styles.rankBadgeText}>#{rank}</Text>
          </View>
        )}
      </View>

      {/* 2. Card Content Body */}
      <View style={styles.cardBody}>
        {/* Creator Attribution */}
        {Boolean(sourceName) && (
          <Text
            style={[
              styles.creatorText,
              { color: isDark ? '#9CA3AF' : '#73798B' },
            ]}
            numberOfLines={1}
          >
            by <Text style={styles.creatorBold}>{sourceName}</Text>
          </Text>
        )}

        {/* Content Title */}
        <Text
          style={[
            styles.titleText,
            { color: isDark ? '#F5F3FB' : '#20212B' },
          ]}
          numberOfLines={2}
        >
          {trend.title || trend.caption || 'Trending idea'}
        </Text>

        {/* Compact Engagement Metrics & Tag */}
        <View style={styles.metaRow}>
          <View style={styles.metricsGroup}>
            {primaryMetric && (
              <View style={styles.metricItem}>
                <Ionicons
                  name={primaryMetric.icon}
                  size={11}
                  color={isDark ? '#9CA3AF' : '#73798B'}
                />
                <Text
                  style={[
                    styles.metricText,
                    { color: isDark ? '#9CA3AF' : '#73798B' },
                  ]}
                >
                  {primaryMetric.val}
                </Text>
              </View>
            )}
            {secondaryMetric && (
              <View style={styles.metricItem}>
                <Ionicons
                  name={secondaryMetric.icon}
                  size={11}
                  color={isDark ? '#9CA3AF' : '#73798B'}
                />
                <Text
                  style={[
                    styles.metricText,
                    { color: isDark ? '#9CA3AF' : '#73798B' },
                  ]}
                >
                  {secondaryMetric.val}
                </Text>
              </View>
            )}
          </View>

          {primaryTag && (
            <View
              style={[
                styles.tagPill,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F0ECFF' },
              ]}
            >
              <Text
                style={[
                  styles.tagPillText,
                  { color: isDark ? '#B9A8FF' : '#7055E8' },
                ]}
                numberOfLines={1}
              >
                #{primaryTag}
              </Text>
            </View>
          )}
        </View>

        {/* 3. Compact Premium "Use Idea" Action */}
        <Pressable
          cssInterop={false}
          hitSlop={4}
          onPress={(e) => {
            e.stopPropagation();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onUseIdea(trend);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Use idea: ${trend.title || ''}`}
          style={({ pressed }) => [
            styles.useIdeaBtn,
            {
              backgroundColor: isDark
                ? 'rgba(112, 85, 232, 0.18)'
                : '#F0ECFF',
              borderColor: isDark
                ? 'rgba(112, 85, 232, 0.35)'
                : 'rgba(112, 85, 232, 0.22)',
              opacity: pressed ? 0.75 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
        >
          <Ionicons name="sparkles" size={12} color="#7055E8" />
          <Text style={styles.useIdeaBtnText}>Use Idea</Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardOuter: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  thumbnailWrapper: {
    width: '100%',
    height: 140,
    position: 'relative',
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformBadgeFloating: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(17, 17, 23, 0.68)',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  platformBadgeText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  bookmarkBtnFloating: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadgeFloating: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingHorizontal: 5,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  durationBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rankBadgeFloating: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rankBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardBody: {
    padding: 11,
    gap: 6,
  },
  creatorText: {
    fontSize: 10.5,
    fontWeight: '400',
  },
  creatorBold: {
    fontWeight: '600',
  },
  titleText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 2,
  },
  metricsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 1,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metricText: {
    fontSize: 10,
    fontWeight: '600',
  },
  tagPill: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    maxWidth: '45%',
  },
  tagPillText: {
    fontSize: 9,
    fontWeight: '600',
  },
  useIdeaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4.5,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  useIdeaBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#7055E8',
    letterSpacing: -0.1,
  },
});

