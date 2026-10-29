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
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { TrendItem } from '../../types';
import { formatCompact, getPlatformMeta } from './trendUtils';

interface TrendDetailModalProps {
  visible: boolean;
  trend: TrendItem | null;
  onClose: () => void;
  onUseIdea: (trend: TrendItem) => void;
  isSaved: boolean;
  onToggleSave: (trend: TrendItem) => void;
  isDark: boolean;
}

export const TrendDetailModal: React.FC<TrendDetailModalProps> = ({
  visible,
  trend,
  onClose,
  onUseIdea,
  isSaved,
  onToggleSave,
  isDark,
}) => {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!trend) return null;

  const platform = getPlatformMeta(trend.source_platform || trend.platform);
  const mediaUrl = trend.full_image_url || trend.thumbnail_url;
  const duration = trend.metrics?.duration || (trend.duration ? `${trend.duration}s` : null);
  const quality = trend.metrics?.quality;
  const sourceName = trend.metrics?.source || trend.creator;

  const views = trend.metrics?.views;
  const likes = trend.metrics?.likes;
  const comments = trend.metrics?.comments;
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
              {/* Platform pill on left */}
              <View
                style={[
                  styles.platformPill,
                  { backgroundColor: platform.bg },
                ]}
              >
                <Ionicons name={platform.icon} size={13} color={platform.color} />
                <Text style={[styles.platformPillText, { color: platform.color }]}>
                  {platform.label}
                </Text>
                {Boolean(quality) && (
                  <Text style={[styles.qualityText, { color: platform.color }]}>
                    • {quality?.toUpperCase()}
                  </Text>
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
                  <Ionicons
                    name={isSaved ? 'bookmark' : 'bookmark-outline'}
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
                  <Ionicons
                    name="close"
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
            {Boolean(mediaUrl) && !imgError ? (
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
                    <Ionicons name="play" size={10} color="#FFFFFF" />
                    <Text style={styles.mediaDurationText}>{duration}</Text>
                  </View>
                )}
              </View>
            ) : null}

            {/* 2. Full Content Title */}
            <Text
              style={[
                styles.detailTitle,
                { color: isDark ? '#F5F3FB' : '#20212B' },
              ]}
            >
              {trend.title || trend.caption || 'Trending Content'}
            </Text>

            {/* Creator Attribution */}
            {Boolean(sourceName) && (
              <View style={styles.creatorInfoRow}>
                <View
                  style={[
                    styles.creatorAvatar,
                    { backgroundColor: isDark ? '#39304A' : '#E7DEFA' },
                  ]}
                >
                  <Text style={styles.creatorInitial}>
                    {((sourceName ? sourceName[0] : 'C')).toUpperCase()}
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
                    {sourceName}
                  </Text>
                  <Text
                    style={[
                      styles.creatorSubtitle,
                      { color: isDark ? '#9CA3AF' : '#73798B' },
                    ]}
                  >
                    {platform.label} Creator
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
                      Original Link
                    </Text>
                    <Ionicons
                      name="open-outline"
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
                  <Ionicons name="eye-outline" size={16} color="#EC4899" />
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
                  <Ionicons name="heart-outline" size={16} color="#EF4444" />
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
                  <Ionicons name="chatbubble-outline" size={16} color="#3B82F6" />
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
              {searchVolume != null && (
                <View style={styles.metricCard}>
                  <Ionicons name="search-outline" size={16} color="#8B5CF6" />
                  <Text
                    style={[
                      styles.metricValue,
                      { color: isDark ? '#F5F3FB' : '#20212B' },
                    ]}
                  >
                    {formatCompact(Number(searchVolume))}
                  </Text>
                  <Text style={styles.metricLabel}>Search Vol</Text>
                </View>
              )}
              {rank != null && (
                <View style={styles.metricCard}>
                  <Ionicons name="trending-up-outline" size={16} color="#10B981" />
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

            {/* 4. Hashtags / Niche Tags */}
            {Array.isArray(trend.niche_tags) && trend.niche_tags.length > 0 && (
              <View style={styles.tagsContainer}>
                <Text
                  style={[
                    styles.sectionHeading,
                    { color: isDark ? '#9CA3AF' : '#73798B' },
                  ]}
                >
                  DISCOVERABLE TAGS
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

            {/* 5. AI Post Creation Workflow Options */}
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
                <Ionicons name="sparkles" size={17} color="#7055E8" />
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
                Turn this trending format into a broadcast across your connected Instagram, Facebook, and Threads channels.
              </Text>

              {/* Action Buttons */}
              <View style={styles.aiActionRow}>
                <Pressable
                  cssInterop={false}
                  onPress={() => {
                    onClose();
                    onUseIdea(trend);
                  }}
                  style={({ pressed }) => [
                    styles.primaryAiBtn,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Ionicons name="create-outline" size={15} color="#FFFFFF" />
                  <Text style={styles.primaryAiBtnText}>Use Idea in Post</Text>
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
                  <Ionicons
                    name={copied ? 'checkmark' : 'copy-outline'}
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

            {/* Spacer for bottom safe area */}
            <View style={{ height: 40 }} />
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
    gap: 16,
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
    minWidth: 80,
    alignItems: 'center',
    gap: 2,
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
    marginTop: 4,
  },
  primaryAiBtn: {
    flex: 1,
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
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryAiBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
});

