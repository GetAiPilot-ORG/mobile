import React, { useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Activity01Icon,
  ArrowUpRight01Icon,
  BrowserIcon,
  BubbleChatIcon,
  CheckmarkCircle01Icon,
  Edit02Icon,
  Folder01Icon,
  Forward01Icon,
  InstagramIcon,
  Search01Icon,
  ShuffleIcon,
  TelescopeIcon,
} from '@/constants/icons';
import * as Haptics from 'expo-haptics';
import { TrendItem } from '../../types';
import { PinterestBrandIcon, YouTubeShortsBrandIcon } from './PlatformBrandIcons';
import { formatCompact, getBestMediaUrl, getPlatformMeta } from './trendUtils';

interface TrendCardProps {
  trend: TrendItem;
  index: number;
  isSaved: boolean;
  onToggleSave: (trend: TrendItem) => void;
  onPressCard: (trend: TrendItem) => void;
  onUseIdea: (trend: TrendItem) => void;
  onRemix?: (trend: TrendItem) => void;
  isDark: boolean;
}

function getPlatformIcon(platformRaw: string = '') {
  const p = (platformRaw || '').toLowerCase();
  if (p.includes('instagram')) return InstagramIcon;
  if (p.includes('google_trends') || p.includes('trend')) return Activity01Icon;
  if (p.includes('gnews') || p.includes('news')) return BrowserIcon;
  if (p.includes('youtube') || p.includes('pexels')) return Forward01Icon;
  return TelescopeIcon;
}

export const TrendCard: React.FC<TrendCardProps> = ({
  trend,
  index,
  isSaved,
  onToggleSave,
  onPressCard,
  onUseIdea,
  onRemix,
  isDark,
}) => {
  const [imgError, setImgError] = useState(false);
  const rawPlatform = (trend.source_platform || trend.platform || '').toLowerCase();
  const isGoogleTrend = rawPlatform === 'google_trends';
  const platform = getPlatformMeta(rawPlatform);
  const platformIcon = getPlatformIcon(rawPlatform);

  const views = trend.metrics?.views;
  const likes = trend.metrics?.likes;
  const comments = trend.metrics?.comments;
  const saves = trend.metrics?.saves;
  const searchVolume = trend.metrics?.searchVolume;
  const duration = trend.metrics?.duration || (trend.duration ? `${trend.duration}s` : null);
  const sourceName = trend.metrics?.source || trend.creator;
  const mediaUrl = getBestMediaUrl(trend);
  const rank = trend.metrics?.rank ?? index + 1;
  const isShort =
    Boolean(trend.is_short) ||
    String(trend.source_url || '').includes('/shorts/');
  const isVideo =
    trend.content_type === 'video' ||
    trend.content_type === 'reel_video' ||
    Boolean(trend.video_url) ||
    rawPlatform === 'youtube';

  const primaryTag =
    Array.isArray(trend.niche_tags) && trend.niche_tags.length > 0
      ? trend.niche_tags[0]
      : null;

  // Dedicated high-contrast Search Surge card for Google Trends (mirrors web TrendFeedPage)
  if (isGoogleTrend) {
    const relatedList = Array.isArray(trend.related_queries)
      ? trend.related_queries
      : Array.isArray(trend.niche_tags)
        ? trend.niche_tags
        : [];

    return (
      <View style={styles.searchSurgeCard}>
        <View style={styles.searchSurgeHeader}>
          <Pressable
            cssInterop={false}
            onPress={() => onPressCard(trend)}
            style={styles.searchSurgeHeaderClick}
          >
            <View style={styles.searchSurgeBadge}>
              <HugeiconsIcon icon={Activity01Icon} size={11} color="#A5B4FC" />
              <Text style={styles.searchSurgeBadgeText}>Search Surge</Text>
            </View>
          </Pressable>
          <Pressable
            cssInterop={false}
            hitSlop={8}
            onPress={() => onToggleSave(trend)}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? 'Remove from saved' : 'Save idea'}
            style={[
              styles.surgeSaveBtn,
              isSaved && { backgroundColor: '#E83E91' },
            ]}
          >
            <HugeiconsIcon
              icon={isSaved ? CheckmarkCircle01Icon : Folder01Icon}
              size={13}
              color="#FFFFFF"
            />
          </Pressable>
        </View>

        <Pressable
          cssInterop={false}
          onPress={() => onPressCard(trend)}
          style={({ pressed }) => [
            styles.surgeBodyClick,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          {Boolean(trend.matched_topic) && (
            <View style={styles.matchedTopicChipDark}>
              <Text style={styles.matchedTopicTextDark} numberOfLines={1}>
                {trend.matched_topic}
              </Text>
            </View>
          )}

          <Text style={styles.searchSurgeTitle} numberOfLines={3}>
            {trend.title || trend.caption || 'Trending Search'}
          </Text>

          {Boolean(searchVolume) && (
            <View style={styles.searchVolumeRow}>
              <HugeiconsIcon icon={Search01Icon} size={11} color="#34D399" />
              <Text style={styles.searchVolumeText}>
                {String(searchVolume)} searches
              </Text>
            </View>
          )}

          {relatedList.length > 0 && (
            <View style={styles.surgeTagsRow}>
              {relatedList.slice(0, 3).map((q, i) => (
                <View key={i} style={styles.surgeTagChip}>
                  <Text style={styles.surgeTagText} numberOfLines={1}>
                    #{String(q).replace(/^#/, '')}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Pressable>

        <View style={styles.cardActionRow}>
          <Pressable
            cssInterop={false}
            hitSlop={4}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (onRemix) {
                onRemix(trend);
              } else {
                onUseIdea(trend);
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={`Remix idea: ${trend.title || ''}`}
            style={({ pressed }) => [
              styles.surgeRemixBtn,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <HugeiconsIcon icon={ShuffleIcon} size={11} color="#FFFFFF" />
            <Text style={styles.surgeRemixBtnText}>Remix</Text>
          </Pressable>

          <Pressable
            cssInterop={false}
            hitSlop={4}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onUseIdea(trend);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Use idea: ${trend.title || ''}`}
            style={({ pressed }) => [
              styles.surgeUseBtn,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <HugeiconsIcon icon={Edit02Icon} size={11} color="#C7D2FE" />
            <Text style={styles.surgeUseBtnText}>Use</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const primaryMetric =
    views != null
      ? { icon: TelescopeIcon, val: formatCompact(Number(views)) }
      : likes != null
        ? { icon: Activity01Icon, val: formatCompact(Number(likes)) }
        : comments != null
          ? { icon: BubbleChatIcon, val: formatCompact(Number(comments)) }
          : saves != null
            ? { icon: Folder01Icon, val: formatCompact(Number(saves)) }
            : searchVolume != null
              ? { icon: Search01Icon, val: formatCompact(Number(searchVolume)) }
              : null;

  const secondaryMetric =
    views != null && likes != null
      ? { icon: Activity01Icon, val: formatCompact(Number(likes)) }
      : views != null && comments != null
        ? { icon: BubbleChatIcon, val: formatCompact(Number(comments)) }
        : likes != null && saves != null
          ? { icon: Folder01Icon, val: formatCompact(Number(saves)) }
          : null;

  return (
    <View
      style={[
        styles.cardOuter,
        {
          backgroundColor: isDark ? '#1C1A25' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E9EAF1',
        },
      ]}
    >
      {/* 1. Thumbnail with Overlays */}
      <View
        style={[
          styles.thumbnailWrapper,
          { backgroundColor: isDark ? '#252230' : '#F0ECFF' },
        ]}
      >
        <Pressable
          cssInterop={false}
          onPress={() => onPressCard(trend)}
          accessibilityRole="button"
          accessibilityLabel={trend.title || trend.caption || 'Open trend details'}
          style={({ pressed }) => [
            styles.thumbPressArea,
            { opacity: pressed ? 0.9 : 1 },
          ]}
        >
          {mediaUrl && !imgError ? (
            <Image
              source={{ uri: mediaUrl }}
              style={styles.thumbnailImage}
              resizeMode="cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <View style={styles.thumbnailFallback}>
              {rawPlatform.includes('pinterest') ? (
                <PinterestBrandIcon size={30} />
              ) : rawPlatform.includes('youtube') ? (
                <YouTubeShortsBrandIcon size={30} />
              ) : (
                <HugeiconsIcon icon={platformIcon} size={28} color={platform.color} />
              )}
            </View>
          )}

          {/* Bottom-Right: Duration Badge */}
          {Boolean(duration) && (
            <View style={styles.durationBadgeFloating}>
              <HugeiconsIcon icon={Forward01Icon} size={9} color="#FFFFFF" />
              <Text style={styles.durationBadgeText}>{duration}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* 2. Card Content Body */}
      <View style={styles.cardBody}>
        <Pressable
          cssInterop={false}
          onPress={() => onPressCard(trend)}
          style={({ pressed }) => [
            styles.cardInfoPressArea,
            { opacity: pressed ? 0.82 : 1 },
          ]}
        >
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
              {primaryMetric?.val && (
                <View style={styles.metricItem}>
                  <HugeiconsIcon
                    icon={primaryMetric.icon}
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
              {secondaryMetric?.val && (
                <View style={styles.metricItem}>
                  <HugeiconsIcon
                    icon={secondaryMetric.icon}
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
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F0ECFF',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 3,
                  },
                ]}
              >
                {rawPlatform.includes('pinterest') ? (
                  <PinterestBrandIcon size={11} />
                ) : rawPlatform.includes('youtube') ? (
                  <YouTubeShortsBrandIcon size={11} />
                ) : null}
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
            {!primaryTag && (rawPlatform.includes('youtube') || rawPlatform.includes('pinterest')) && (
              <View
                style={[
                  styles.tagPill,
                  {
                    backgroundColor: platform.bg,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 3,
                  },
                ]}
              >
                {rawPlatform.includes('pinterest') ? (
                  <PinterestBrandIcon size={11} />
                ) : (
                  <YouTubeShortsBrandIcon size={11} />
                )}
                <Text
                  style={[styles.tagPillText, { color: platform.color }]}
                  numberOfLines={1}
                >
                  {rawPlatform.includes('pinterest')
                    ? 'Pinterest'
                    : isShort
                      ? 'Shorts'
                      : 'YouTube'}
                </Text>
              </View>
            )}
          </View>
        </Pressable>

        {/* 3. Action Row: Remix + Use Idea (siblings, never nested) */}
        <View style={styles.cardActionRow}>
          <Pressable
            cssInterop={false}
            hitSlop={4}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (onRemix) {
                onRemix(trend);
              } else {
                onUseIdea(trend);
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={`Remix idea: ${trend.title || ''}`}
            style={({ pressed }) => [
              styles.remixBtn,
              {
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <HugeiconsIcon icon={ShuffleIcon} size={11} color="#FFFFFF" />
            <Text style={styles.remixBtnText}>Remix</Text>
          </Pressable>

          <Pressable
            cssInterop={false}
            hitSlop={4}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onUseIdea(trend);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Use idea: ${trend.title || ''}`}
            style={({ pressed }) => [
              styles.useIdeaBtn,
              {
                backgroundColor: isDark
                  ? 'rgba(112, 85, 232, 0.16)'
                  : '#F0ECFF',
                borderColor: isDark
                  ? 'rgba(112, 85, 232, 0.35)'
                  : 'rgba(112, 85, 232, 0.22)',
                opacity: pressed ? 0.75 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <HugeiconsIcon icon={Edit02Icon} size={11} color="#7055E8" />
            <Text style={styles.useIdeaBtnText}>Use</Text>
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={10} color="#7055E8" />
          </Pressable>
        </View>
      </View>
    </View>
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
  thumbPressArea: {
    width: '100%',
    height: '100%',
  },
  searchSurgeHeaderClick: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  surgeBodyClick: {
    gap: 8,
  },
  cardInfoPressArea: {
    gap: 6,
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
  topLeftOverlays: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  platformBadgeFloating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(17, 17, 23, 0.72)',
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
  formatBadgeFloating: {
    backgroundColor: 'rgba(112, 85, 232, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  formatBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 6,
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
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
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
  matchedTopicChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  matchedTopicText: {
    fontSize: 9.5,
    fontWeight: '700',
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
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  remixBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3.5,
    height: 27,
    borderRadius: 8,
    backgroundColor: '#7055E8',
  },
  remixBtnText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  useIdeaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 27,
    borderRadius: 8,
    borderWidth: 1,
  },
  useIdeaBtnText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#7055E8',
    letterSpacing: -0.1,
  },
  // Google Trends Search Surge dark card
  searchSurgeCard: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#312E81',
    padding: 13,
    gap: 9,
  },
  searchSurgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  searchSurgeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 10,
  },
  searchSurgeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A5B4FC',
  },
  searchSurgeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  surgeRankPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  surgeRankText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#34D399',
  },
  surgeSaveBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchedTopicChipDark: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(167, 139, 250, 0.16)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  matchedTopicTextDark: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#DDD6FE',
  },
  searchSurgeTitle: {
    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  searchVolumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  searchVolumeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#34D399',
  },
  surgeTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  surgeTagChip: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  surgeTagText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  surgeRemixBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3.5,
    height: 27,
    borderRadius: 8,
    backgroundColor: '#6366F1',
  },
  surgeRemixBtnText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  surgeUseBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3.5,
    height: 27,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(199,210,254,0.25)',
  },
  surgeUseBtnText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#E0E7FF',
  },
});
