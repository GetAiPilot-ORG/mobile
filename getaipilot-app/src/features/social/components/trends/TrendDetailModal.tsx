import React, { useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
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
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Copy01Icon,
  Edit02Icon,
  Folder01Icon,
  Forward01Icon,
  InstagramIcon,
  Rocket01Icon,
  Search01Icon,
  Share01Icon,
  TelescopeIcon,
} from '@/constants/icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { TrendItem } from '../../types';
import { PinterestBrandIcon, YouTubeShortsBrandIcon } from './PlatformBrandIcons';
import {
  formatCompact,
  formatTimeAgo,
  getBestMediaUrl,
  getPlatformMeta,
} from './trendUtils';

interface TrendDetailModalProps {
  visible: boolean;
  trend: TrendItem | null;
  onClose: () => void;
  onUseIdea: (trend: TrendItem) => void;
  onRemix?: (trend: TrendItem) => void;
  isSaved: boolean;
  onToggleSave: (trend: TrendItem) => void;
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

export const TrendDetailModal: React.FC<TrendDetailModalProps> = ({
  visible,
  trend,
  onClose,
  onUseIdea,
  onRemix,
  isSaved,
  onToggleSave,
  isDark,
}) => {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!trend) return null;

  const rawPlatform = (trend.source_platform || trend.platform || '').toLowerCase();
  const platform = getPlatformMeta(rawPlatform);
  const platformIcon = getPlatformIcon(rawPlatform);
  const mediaUrl = getBestMediaUrl(trend);
  const duration = trend.metrics?.duration || (trend.duration ? `${trend.duration}s` : null);
  const quality = trend.metrics?.quality;
  const sourceName = trend.metrics?.source || trend.creator;
  const isShort =
    Boolean(trend.is_short) ||
    String(trend.source_url || '').includes('/shorts/');

  const views = trend.metrics?.views;
  const likes = trend.metrics?.likes;
  const comments = trend.metrics?.comments;
  const saves = trend.metrics?.saves;
  const reposts = trend.metrics?.reposts;
  const searchVolume = trend.metrics?.searchVolume;
  const rank = trend.metrics?.rank;

  const copyToClipboard = async (text: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenSource = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (trend.source_url) {
      Linking.openURL(trend.source_url);
    } else {
      Alert.alert('Source Link', 'Original source link is not available for this item.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          cssInterop={false}
          style={styles.dismissOverlay}
          onPress={onClose}
        />
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? '#1C1A25' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E9EAF1',
            },
          ]}
        >
          {/* Header Drag Handle & Top Controls */}
          <View style={styles.headerBar}>
            <View
              style={[
                styles.handle,
                { backgroundColor: isDark ? '#39304A' : '#E2E8F0' },
              ]}
            />
            <View style={styles.topControlRow}>
              {/* Platform + Matched Topic pills on left */}
              <View style={styles.leftBadgesRow}>
                <View
                  style={[
                    styles.platformPill,
                    { backgroundColor: platform.bg },
                  ]}
                >
                  {rawPlatform.includes('pinterest') ? (
                    <PinterestBrandIcon size={13} />
                  ) : rawPlatform.includes('youtube') ? (
                    <YouTubeShortsBrandIcon size={13} />
                  ) : (
                    <HugeiconsIcon icon={platformIcon} size={13} color={platform.color} />
                  )}
                  <Text style={[styles.platformPillText, { color: platform.color }]}>
                    {isShort ? 'YouTube Short' : platform.label}
                  </Text>
                  {Boolean(quality) && (
                    <Text style={[styles.qualityText, { color: platform.color }]}>
                      • {quality?.toUpperCase()}
                    </Text>
                  )}
                </View>

                {Boolean(trend.matched_topic) && (
                  <View
                    style={[
                      styles.matchedPill,
                      {
                        backgroundColor: isDark ? 'rgba(112,85,232,0.2)' : '#F0ECFF',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.matchedPillText,
                        { color: isDark ? '#C4B5FD' : '#6D28D9' },
                      ]}
                      numberOfLines={1}
                    >
                      {trend.matched_topic}
                    </Text>
                  </View>
                )}
              </View>

              {/* Right: Bookmark + Close */}
              <View style={styles.headerActions}>
                <Pressable
                  cssInterop={false}
                  onPress={() => onToggleSave(trend)}
                  accessibilityRole="button"
                  accessibilityLabel="Save trend"
                  style={({ pressed }) => [
                    styles.iconBtn,
                    {
                      backgroundColor: isSaved
                        ? isDark
                          ? 'rgba(232, 62, 145, 0.2)'
                          : '#FDE7F2'
                        : isDark
                          ? '#252230'
                          : '#F0EEF8',
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <HugeiconsIcon
                    icon={isSaved ? CheckmarkCircle01Icon : Folder01Icon}
                    size={17}
                    color={isSaved ? '#E83E91' : isDark ? '#F5F3FB' : '#20212B'}
                  />
                </Pressable>

                <Pressable
                  cssInterop={false}
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Close detail"
                  style={({ pressed }) => [
                    styles.iconBtn,
                    {
                      backgroundColor: isDark ? '#252230' : '#F0EEF8',
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    size={18}
                    color={isDark ? '#F5F3FB' : '#20212B'}
                  />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            {/* 1. Large Hero Media Preview */}
            {mediaUrl && !imgError ? (
              <View
                style={[
                  styles.mediaWrapper,
                  { backgroundColor: isDark ? '#252230' : '#F0ECFF' },
                ]}
              >
                <Image
                  source={{ uri: mediaUrl }}
                  style={styles.heroImage}
                  resizeMode="cover"
                  onError={() => setImgError(true)}
                />
                {Boolean(duration) && (
                  <View style={styles.mediaDurationBadge}>
                    <HugeiconsIcon icon={Forward01Icon} size={10} color="#FFFFFF" />
                    <Text style={styles.mediaDurationText}>{duration}</Text>
                  </View>
                )}
              </View>
            ) : null}

            {/* 2. Full Content Title & Caption */}
            <Text
              style={[
                styles.detailTitle,
                { color: isDark ? '#F5F3FB' : '#20212B' },
              ]}
            >
              {trend.title || trend.caption || 'Trending Content'}
            </Text>

            {Boolean(trend.caption) &&
              Boolean(trend.title) &&
              trend.caption !== trend.title && (
                <Text
                  style={[
                    styles.detailCaption,
                    { color: isDark ? '#CBD5E1' : '#475569' },
                  ]}
                >
                  {trend.caption}
                </Text>
              )}

            {/* Creator Attribution */}
            {(Boolean(sourceName) || Boolean(trend.source_url)) && (
              <View style={styles.creatorInfoRow}>
                <View
                  style={[
                    styles.creatorAvatar,
                    { backgroundColor: isDark ? '#39304A' : '#E7DEFA' },
                  ]}
                >
                  <Text style={styles.creatorInitial}>
                    {(sourceName ? sourceName[0] : platform.label[0] || 'C').toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.creatorName,
                      { color: isDark ? '#F5F3FB' : '#20212B' },
                    ]}
                    numberOfLines={1}
                  >
                    {sourceName || platform.label}
                  </Text>
                  <Text
                    style={[
                      styles.creatorSubtitle,
                      { color: isDark ? '#9CA3AF' : '#73798B' },
                    ]}
                  >
                    {platform.label} • {formatTimeAgo(trend.published_at)}
                  </Text>
                </View>
                {Boolean(trend.source_url) && (
                  <Pressable
                    cssInterop={false}
                    onPress={handleOpenSource}
                    style={({ pressed }) => [
                      styles.sourceLinkPill,
                      {
                        backgroundColor: isDark ? '#252230' : '#F0EEF8',
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sourceLinkPillText,
                        { color: isDark ? '#B9A8FF' : '#7055E8' },
                      ]}
                    >
                      Original
                    </Text>
                    <HugeiconsIcon
                      icon={ArrowUpRight01Icon}
                      size={12}
                      color={isDark ? '#B9A8FF' : '#7055E8'}
                    />
                  </Pressable>
                )}
              </View>
            )}

            {/* 3. Engagement Metrics Grid */}
            <View
              style={[
                styles.metricsGrid,
                {
                  backgroundColor: isDark ? '#252230' : '#F8F9FD',
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E9EAF1',
                },
              ]}
            >
              {views != null && (
                <View style={styles.metricCard}>
                  <HugeiconsIcon icon={TelescopeIcon} size={16} color="#EC4899" />
                  <Text
                    style={[
                      styles.metricValue,
                      { color: isDark ? '#F5F3FB' : '#20212B' },
                    ]}
                  >
                    {formatCompact(Number(views))}
                  </Text>
                  <Text style={styles.metricLabel}>Total Views</Text>
                </View>
              )}
              {likes != null && (
                <View style={styles.metricCard}>
                  <HugeiconsIcon icon={Activity01Icon} size={16} color="#EF4444" />
                  <Text
                    style={[
                      styles.metricValue,
                      { color: isDark ? '#F5F3FB' : '#20212B' },
                    ]}
                  >
                    {formatCompact(Number(likes))}
                  </Text>
                  <Text style={styles.metricLabel}>Likes</Text>
                </View>
              )}
              {comments != null && (
                <View style={styles.metricCard}>
                  <HugeiconsIcon icon={BubbleChatIcon} size={16} color="#3B82F6" />
                  <Text
                    style={[
                      styles.metricValue,
                      { color: isDark ? '#F5F3FB' : '#20212B' },
                    ]}
                  >
                    {formatCompact(Number(comments))}
                  </Text>
                  <Text style={styles.metricLabel}>Comments</Text>
                </View>
              )}
              {saves != null && (
                <View style={styles.metricCard}>
                  <HugeiconsIcon icon={Folder01Icon} size={16} color="#F59E0B" />
                  <Text
                    style={[
                      styles.metricValue,
                      { color: isDark ? '#F5F3FB' : '#20212B' },
                    ]}
                  >
                    {formatCompact(Number(saves))}
                  </Text>
                  <Text style={styles.metricLabel}>Saves</Text>
                </View>
              )}
              {reposts != null && (
                <View style={styles.metricCard}>
                  <HugeiconsIcon icon={Share01Icon} size={16} color="#10B981" />
                  <Text
                    style={[
                      styles.metricValue,
                      { color: isDark ? '#F5F3FB' : '#20212B' },
                    ]}
                  >
                    {formatCompact(Number(reposts))}
                  </Text>
                  <Text style={styles.metricLabel}>Reposts</Text>
                </View>
              )}
              {searchVolume != null && (
                <View style={styles.metricCard}>
                  <HugeiconsIcon icon={Search01Icon} size={16} color="#8B5CF6" />
                  <Text
                    style={[
                      styles.metricValue,
                      { color: isDark ? '#F5F3FB' : '#20212B' },
                    ]}
                  >
                    {formatCompact(Number(searchVolume)) || String(searchVolume)}
                  </Text>
                  <Text style={styles.metricLabel}>Search Vol</Text>
                </View>
              )}
              {rank != null && (
                <View style={styles.metricCard}>
                  <HugeiconsIcon icon={Activity01Icon} size={16} color="#10B981" />
                  <Text
                    style={[
                      styles.metricValue,
                      { color: isDark ? '#F5F3FB' : '#20212B' },
                    ]}
                  >
                    #{rank}
                  </Text>
                  <Text style={styles.metricLabel}>Trend Rank</Text>
                </View>
              )}
            </View>

            {/* 4. Rising Search Queries */}
            {Array.isArray(trend.related_queries) && trend.related_queries.length > 0 && (
              <View style={styles.tagsContainer}>
                <Text
                  style={[
                    styles.sectionHeading,
                    { color: isDark ? '#9CA3AF' : '#73798B' },
                  ]}
                >
                  RISING KEYWORDS
                </Text>
                <View style={styles.tagChipsWrap}>
                  {trend.related_queries.map((q, i) => (
                    <Pressable
                      key={i}
                      cssInterop={false}
                      onPress={() => copyToClipboard(String(q))}
                      style={({ pressed }) => [
                        styles.tagChip,
                        {
                          backgroundColor: isDark ? '#1E293B' : '#EEF2FF',
                          opacity: pressed ? 0.75 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tagChipText,
                          { color: isDark ? '#93C5FD' : '#4338CA' },
                        ]}
                      >
                        {String(q)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* 5. Hashtags / Niche Tags */}
            {Array.isArray(trend.niche_tags) && trend.niche_tags.length > 0 && (
              <View style={styles.tagsContainer}>
                <Text
                  style={[
                    styles.sectionHeading,
                    { color: isDark ? '#9CA3AF' : '#73798B' },
                  ]}
                >
                  DISCOVERABLE TAGS (TAP TO COPY)
                </Text>
                <View style={styles.tagChipsWrap}>
                  {trend.niche_tags.map((tag, i) => (
                    <Pressable
                      key={i}
                      cssInterop={false}
                      onPress={() => copyToClipboard(`#${tag}`)}
                      style={({ pressed }) => [
                        styles.tagChip,
                        {
                          backgroundColor: isDark ? '#252230' : '#F0EEF8',
                          opacity: pressed ? 0.75 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tagChipText,
                          { color: isDark ? '#B9A8FF' : '#7055E8' },
                        ]}
                      >
                        #{tag}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* 6. AI Content Engine Workflow Options */}
            <View
              style={[
                styles.aiBox,
                {
                  backgroundColor: isDark ? '#252230' : '#F0ECFF',
                  borderColor: isDark ? 'rgba(112,85,232,0.3)' : '#E0D7FA',
                },
              ]}
            >
              <View style={styles.aiBoxHeader}>
                <HugeiconsIcon icon={Rocket01Icon} size={17} color="#7055E8" />
                <Text
                  style={[
                    styles.aiBoxTitle,
                    { color: isDark ? '#F5F3FB' : '#20212B' },
                  ]}
                >
                  AI Content Engine
                </Text>
              </View>
              <Text
                style={[
                  styles.aiBoxDesc,
                  { color: isDark ? '#9CA3AF' : '#73798B' },
                ]}
              >
                Generate 3 viral hooks, a full Reel script, Twitter thread, carousel, and caption — or open directly in Composer.
              </Text>

              {onRemix && (
                <Pressable
                  cssInterop={false}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onClose();
                    onRemix(trend);
                  }}
                  style={({ pressed }) => [
                    styles.primaryAiBtn,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <HugeiconsIcon icon={Rocket01Icon} size={16} color="#FFFFFF" />
                  <Text style={styles.primaryAiBtnText}>
                    Remix Idea with AI (Hooks & Script)
                  </Text>
                </Pressable>
              )}

              <View style={styles.aiActionRow}>
                <Pressable
                  cssInterop={false}
                  onPress={() => {
                    onClose();
                    onUseIdea(trend);
                  }}
                  style={({ pressed }) => [
                    styles.secondaryAiBtn,
                    {
                      flex: 1,
                      backgroundColor: isDark ? '#1C1A25' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(112,85,232,0.35)' : '#DDD6FE',
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <HugeiconsIcon icon={Edit02Icon} size={14} color="#7055E8" />
                  <Text style={[styles.secondaryAiBtnText, { color: '#7055E8' }]}>
                    Use in Post
                  </Text>
                </Pressable>

                <Pressable
                  cssInterop={false}
                  onPress={() => copyToClipboard(trend.title || trend.caption || '')}
                  style={({ pressed }) => [
                    styles.secondaryAiBtn,
                    {
                      backgroundColor: isDark ? '#1C1A25' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E9EAF1',
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <HugeiconsIcon
                    icon={copied ? CheckmarkCircle01Icon : Copy01Icon}
                    size={14}
                    color={copied ? '#16A34A' : isDark ? '#F5F3FB' : '#20212B'}
                  />
                  <Text
                    style={[
                      styles.secondaryAiBtnText,
                      { color: copied ? '#16A34A' : isDark ? '#F5F3FB' : '#20212B' },
                    ]}
                  >
                    {copied ? 'Copied' : 'Copy Title'}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={{ height: 36 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  dismissOverlay: {
    flex: 1,
  },
  sheetContainer: {
    width: '100%',
    maxHeight: '90%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    paddingTop: 10,
    overflow: 'hidden',
  },
  headerBar: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    alignItems: 'center',
    gap: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  topControlRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  leftBadgesRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  platformPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  platformPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  qualityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  matchedPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    maxWidth: 140,
  },
  matchedPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 30,
    gap: 14,
  },
  mediaWrapper: {
    width: '100%',
    height: 210,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  mediaDurationBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mediaDurationText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailTitle: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  detailCaption: {
    fontSize: 13,
    lineHeight: 19,
  },
  creatorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  creatorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorInitial: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7055E8',
  },
  creatorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  creatorSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  sourceLinkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sourceLinkPillText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: 74,
    alignItems: 'center',
    gap: 3,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  metricLabel: {
    fontSize: 10.5,
    color: '#73798B',
    fontWeight: '500',
  },
  tagsContainer: {
    gap: 8,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tagChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tagChipText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  aiBox: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
  },
  aiBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  aiBoxDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  aiActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryAiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#7055E8',
    height: 42,
    borderRadius: 12,
  },
  primaryAiBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryAiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryAiBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
});
