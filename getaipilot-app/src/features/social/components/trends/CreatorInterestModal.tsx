import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Activity01Icon,
  ArrowRight01Icon,
  BotMessageSquareIcon,
  BrowserIcon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  CreditCardIcon,
  CrownIcon,
  Edit02Icon,
  File01Icon,
  Forward01Icon,
  GiftIcon,
  Home01Icon,
  Layout01Icon,
  Leaf01Icon,
  Megaphone01Icon,
  PaintBrush01Icon,
  Rocket01Icon,
  ShieldCheckIcon,
  SmartPhone01Icon,
  SmileIcon,
  TelescopeIcon,
  UserGroupIcon,
  VoiceToTextIcon,
} from '@/constants/icons';
import * as Haptics from 'expo-haptics';
import { TOPIC_CATEGORIES, TREND_INTEREST_TOPICS, TrendInterestTopic } from './trendUtils';

function getTopicIconConfig(topic: TrendInterestTopic): {
  icon: any;
  color: string;
  bgLight: string;
  bgDark: string;
} {
  const id = topic.id;
  if (id === 'ai_chatgpt') return { icon: BotMessageSquareIcon, color: '#6366F1', bgLight: '#EEF2FF', bgDark: 'rgba(99,102,241,0.18)' };
  if (id === 'tech_gadgets' || id === 'apple_ecosystem') return { icon: SmartPhone01Icon, color: '#3B82F6', bgLight: '#EFF6FF', bgDark: 'rgba(59,130,246,0.18)' };
  if (id === 'coding_dev') return { icon: BrowserIcon, color: '#0EA5E9', bgLight: '#F0F9FF', bgDark: 'rgba(14,165,233,0.18)' };
  if (id === 'science_space' || id === 'robotics_hardware') return { icon: Rocket01Icon, color: '#8B5CF6', bgLight: '#F5F3FF', bgDark: 'rgba(139,92,246,0.18)' };
  if (id === 'cybersecurity_privacy') return { icon: ShieldCheckIcon, color: '#10B981', bgLight: '#ECFDF5', bgDark: 'rgba(16,185,129,0.18)' };
  if (id === 'crypto_bitcoin') return { icon: CreditCardIcon, color: '#F59E0B', bgLight: '#FFFBEB', bgDark: 'rgba(245,158,11,0.18)' };

  if (id === 'marketing_growth') return { icon: Megaphone01Icon, color: '#F97316', bgLight: '#FFF7ED', bgDark: 'rgba(249,115,22,0.18)' };
  if (id === 'real_estate' || id === 'architecture_interiors') return { icon: Home01Icon, color: '#6366F1', bgLight: '#EEF2FF', bgDark: 'rgba(99,102,241,0.18)' };
  if (id === 'ecommerce_dropship') return { icon: GiftIcon, color: '#EC4899', bgLight: '#FDF2F8', bgDark: 'rgba(236,72,153,0.18)' };
  if (id === 'creator_economy') return { icon: UserGroupIcon, color: '#8B5CF6', bgLight: '#F5F3FF', bgDark: 'rgba(139,92,246,0.18)' };
  if (id === 'startups_saas' || id === 'business_strategy') return { icon: Layout01Icon, color: '#0EA5E9', bgLight: '#F0F9FF', bgDark: 'rgba(14,165,233,0.18)' };
  if (id === 'finance_stocks' || id === 'side_hustles') return { icon: CreditCardIcon, color: '#10B981', bgLight: '#ECFDF5', bgDark: 'rgba(16,185,129,0.18)' };

  if (id === 'design_3d' || id === 'typography_branding') return { icon: PaintBrush01Icon, color: '#F97316', bgLight: '#FFF7ED', bgDark: 'rgba(249,115,22,0.18)' };
  if (id === 'photography_gear' || id === 'travel_nomad' || id === 'luxury_hiddenplaces') return { icon: TelescopeIcon, color: '#06B6D4', bgLight: '#ECFEFF', bgDark: 'rgba(6,182,212,0.18)' };
  if (id === 'reels_video' || id === 'video_editing_vfx' || id === 'animation_motion' || id === 'filmmaking_cinema' || id === 'cinema_movies' || id === 'anime_manga') {
    return { icon: Forward01Icon, color: '#EC4899', bgLight: '#FDF2F8', bgDark: 'rgba(236,72,153,0.18)' };
  }

  if (id === 'productivity_habits' || id === 'mindset_selfhelp') return { icon: CheckmarkCircle01Icon, color: '#7055E8', bgLight: '#F5F3FF', bgDark: 'rgba(112,85,232,0.18)' };
  if (id === 'books_learning' || id === 'history_lore') return { icon: File01Icon, color: '#3B82F6', bgLight: '#EFF6FF', bgDark: 'rgba(59,130,246,0.18)' };
  if (id === 'fashion_style' || id === 'sneakerhead_drops') return { icon: CrownIcon, color: '#EC4899', bgLight: '#FDF2F8', bgDark: 'rgba(236,72,153,0.18)' };
  if (id === 'diy_crafting') return { icon: Edit02Icon, color: '#F59E0B', bgLight: '#FFFBEB', bgDark: 'rgba(245,158,11,0.18)' };
  if (id === 'comedy_memes') return { icon: SmileIcon, color: '#F59E0B', bgLight: '#FFFBEB', bgDark: 'rgba(245,158,11,0.18)' };
  if (id === 'music_audio' || id === 'hiphop_beats' || id === 'podcasts_talks') return { icon: VoiceToTextIcon, color: '#EC4899', bgLight: '#FDF2F8', bgDark: 'rgba(236,72,153,0.18)' };
  if (id === 'gaming_stream' || id === 'retro_nintendo') return { icon: SmartPhone01Icon, color: '#8B5CF6', bgLight: '#F5F3FF', bgDark: 'rgba(139,92,246,0.18)' };
  if (id === 'cars_supercars' || id === 'motorcycles_biker') return { icon: Rocket01Icon, color: '#EF4444', bgLight: '#FEF2F2', bgDark: 'rgba(239,68,68,0.18)' };

  if (topic.category === 'Lifestyle & Health' || topic.category === 'Travel & Culture') {
    return { icon: Leaf01Icon, color: '#10B981', bgLight: '#ECFDF5', bgDark: 'rgba(16,185,129,0.18)' };
  }
  return { icon: Activity01Icon, color: '#6366F1', bgLight: '#EEF2FF', bgDark: 'rgba(99,102,241,0.18)' };
}

export interface CreatorProfileDraft {
  work: string;
  interests: string;
  goal: string;
}

interface CreatorInterestModalProps {
  visible: boolean;
  mode: 'onboarding' | 'tune';
  initialTopicIds: string[];
  initialProfile: CreatorProfileDraft;
  onSave: (topicIds: string[], profile: CreatorProfileDraft) => void;
  onSkip: () => void;
  onClose: () => void;
  onClearTune?: () => void;
  onSwitchMode?: (mode: 'onboarding' | 'tune') => void;
  isDark: boolean;
}

const FORMAT_QUICK_PICKS = [
  '30s Viral Reels & Shorts',
  'Visuals & Carousels',
  'News & X Threads',
];

export const CreatorInterestModal: React.FC<CreatorInterestModalProps> = ({
  visible,
  mode,
  initialTopicIds,
  initialProfile,
  onSave,
  onSkip,
  onClose,
  onClearTune,
  onSwitchMode,
  isDark,
}) => {
  const [localTopicIds, setLocalTopicIds] = useState<string[]>(initialTopicIds || []);
  const [localProfile, setLocalProfile] = useState<CreatorProfileDraft>({
    work: initialProfile?.work || '',
    interests: initialProfile?.interests || '',
    goal: initialProfile?.goal || '',
  });
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const wasVisibleRef = React.useRef(false);
  const prevModeRef = React.useRef<'onboarding' | 'tune'>(mode);

  useEffect(() => {
    const justOpened = visible && !wasVisibleRef.current;
    const modeChanged = visible && prevModeRef.current !== mode;
    if (justOpened || modeChanged) {
      setLocalTopicIds(initialTopicIds || []);
      setLocalProfile({
        work: initialProfile?.work || '',
        interests: initialProfile?.interests || '',
        goal: initialProfile?.goal || '',
      });
      setActiveCategory('All');
    }
    wasVisibleRef.current = visible;
    prevModeRef.current = mode;
  }, [visible, mode, initialTopicIds, initialProfile]);

  const filteredTopics = useMemo(() => {
    if (activeCategory === 'All') return TREND_INTEREST_TOPICS;
    return TREND_INTEREST_TOPICS.filter((t) => t.category === activeCategory);
  }, [activeCategory]);

  const toggleTopic = (topicId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalTopicIds((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId],
    );
  };

  const isTune = mode === 'tune';
  const progressPct = Math.min((localTopicIds.length / 3) * 100, 100);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlayWrap}
      >
        <Pressable
          cssInterop={false}
          style={styles.backdrop}
          onPress={isTune ? onClose : onSkip}
        />

        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#12161F' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E5E7EB',
            },
          ]}
        >
          {/* Top Accent Strip */}
          <View style={styles.accentBar} />

          {/* Header */}
          <View
            style={[
              styles.header,
              {
                borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
                backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: isDark ? '#F8FAFC' : '#111827' }]}>
                {isTune
                  ? 'Tune Your Inspiration Feed'
                  : 'What topics do you create or love?'}
              </Text>
            </View>
            <Pressable
              cssInterop={false}
              hitSlop={8}
              onPress={isTune ? onClose : onSkip}
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? '#1F2937' : '#F1F5F9' },
              ]}
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                size={16}
                color={isDark ? '#D1D5DB' : '#4B5563'}
                strokeWidth={2}
              />
            </Pressable>
          </View>

          {isTune ? (
            <ScrollView
              style={styles.tuneScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.tuneBody}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: isDark ? '#E5E7EB' : '#374151' }]}>
                  Your creator / brand role
                </Text>
                <TextInput
                  value={localProfile.work}
                  onChangeText={(val) => setLocalProfile((p) => ({ ...p, work: val }))}
                  placeholder="e.g. AI SaaS Founder, YouTube Creator, Agency Lead"
                  placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#1B2130' : '#F9FAFB',
                      borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#D1D5DB',
                      color: isDark ? '#FFFFFF' : '#111827',
                    },
                  ]}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: isDark ? '#E5E7EB' : '#374151' }]}>
                  Additional custom keywords (comma-separated)
                </Text>
                <TextInput
                  value={localProfile.interests}
                  onChangeText={(val) => setLocalProfile((p) => ({ ...p, interests: val }))}
                  placeholder="e.g. prompt engineering, notion templates, blender tutorials"
                  placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#1B2130' : '#F9FAFB',
                      borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#D1D5DB',
                      color: isDark ? '#FFFFFF' : '#111827',
                    },
                  ]}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: isDark ? '#E5E7EB' : '#374151' }]}>
                  Preferred content formats
                </Text>
                <TextInput
                  value={localProfile.goal}
                  onChangeText={(val) => setLocalProfile((p) => ({ ...p, goal: val }))}
                  placeholder="e.g. 30s Viral Reels, Carousels, Twitter/X Threads"
                  placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#1B2130' : '#F9FAFB',
                      borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#D1D5DB',
                      color: isDark ? '#FFFFFF' : '#111827',
                    },
                  ]}
                />
                <View style={styles.quickPickRow}>
                  {FORMAT_QUICK_PICKS.map((pick) => (
                    <Pressable
                      key={pick}
                      cssInterop={false}
                      onPress={() =>
                        setLocalProfile((p) => ({
                          ...p,
                          goal: p.goal === pick ? '' : pick,
                        }))
                      }
                      style={[
                        styles.quickPickChip,
                        {
                          backgroundColor: isDark ? '#1E2433' : '#F3F4F6',
                          borderColor:
                            localProfile.goal === pick
                              ? '#F97316'
                              : isDark
                              ? 'rgba(255,255,255,0.08)'
                              : '#E5E7EB',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.quickPickText,
                          { color: isDark ? '#D1D5DB' : '#374151' },
                        ]}
                      >
                        {pick}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>
          ) : (
            <View style={styles.onboardingWrap}>
              {/* Category Tabs */}
              <View style={styles.filterHeader}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.catScroll}
                >
                  {TOPIC_CATEGORIES.map((cat) => {
                    const active = activeCategory === cat;
                    return (
                      <Pressable
                        key={cat}
                        cssInterop={false}
                        onPress={() => setActiveCategory(cat)}
                        style={[
                          styles.catPill,
                          {
                            backgroundColor: active
                              ? '#F97316'
                              : isDark
                              ? '#1E2433'
                              : '#F3F4F6',
                            borderColor: active
                              ? '#F97316'
                              : isDark
                              ? 'rgba(255,255,255,0.08)'
                              : '#E5E7EB',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.catPillText,
                            {
                              color: active
                                ? '#FFFFFF'
                                : isDark
                                ? '#D1D5DB'
                                : '#4B5563',
                            },
                          ]}
                        >
                          {cat}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.topicsGrid}
              >
                {filteredTopics.map((topic) => {
                  const selected = localTopicIds.includes(topic.id);
                  const iconCfg = getTopicIconConfig(topic);
                  return (
                    <Pressable
                      key={topic.id}
                      cssInterop={false}
                      onPress={() => toggleTopic(topic.id)}
                      style={[
                        styles.topicTile,
                        {
                          backgroundColor: selected
                            ? isDark
                              ? 'rgba(245, 158, 11, 0.16)'
                              : '#FFFBEB'
                            : isDark
                            ? 'rgba(255,255,255,0.03)'
                            : '#F8FAFC',
                          borderColor: selected
                            ? '#F59E0B'
                            : isDark
                            ? 'rgba(255,255,255,0.08)'
                            : '#E2E8F0',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.topicIconWrap,
                          {
                            backgroundColor: selected
                              ? isDark
                                ? 'rgba(245,158,11,0.22)'
                                : '#FEF3C7'
                              : isDark
                              ? iconCfg.bgDark
                              : iconCfg.bgLight,
                          },
                        ]}
                      >
                        <HugeiconsIcon
                          icon={iconCfg.icon}
                          size={17}
                          color={selected ? '#F59E0B' : iconCfg.color}
                        />
                      </View>
                      <Text
                        numberOfLines={2}
                        style={[
                          styles.topicLabel,
                          { flex: 1, minWidth: 0, color: isDark ? '#F9FAFB' : '#111827' },
                        ]}
                      >
                        {topic.label}
                      </Text>
                      {selected ? (
                        <HugeiconsIcon
                          icon={CheckmarkCircle01Icon}
                          size={19}
                          color="#F97316"
                        />
                      ) : (
                        <View
                          style={[
                            styles.checkCircle,
                            {
                              borderColor: isDark
                                ? 'rgba(255,255,255,0.22)'
                                : '#CBD5E1',
                            },
                          ]}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Footer */}
          <View
            style={[
              styles.footer,
              {
                borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
                backgroundColor: isDark ? '#12161F' : '#F8FAFC',
              },
            ]}
          >
            {!isTune ? (
              <View style={styles.progressRow}>
                <View
                  style={[
                    styles.progressTrack,
                    { backgroundColor: isDark ? '#1F2937' : '#E5E7EB' },
                  ]}
                >
                  <View
                    style={[styles.progressFill, { width: `${progressPct}%` }]}
                  />
                </View>
                <View style={styles.progressTextRow}>
                  {localTopicIds.length >= 3 ? (
                    <>
                      <HugeiconsIcon
                        icon={CheckmarkCircle01Icon}
                        size={13}
                        color="#10B981"
                        strokeWidth={2.2}
                      />
                      <Text style={styles.progressReady}>
                        Ready ({localTopicIds.length})
                      </Text>
                    </>
                  ) : (
                    <Text
                      style={[
                        styles.progressHint,
                        { color: isDark ? '#9CA3AF' : '#6B7280' },
                      ]}
                    >
                      {localTopicIds.length} / 3 recommended
                    </Text>
                  )}
                </View>
              </View>
            ) : null}

            <View style={styles.footerActions}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Pressable
                  cssInterop={false}
                  onPress={isTune ? onClose : onSkip}
                  style={({ pressed }) => [
                    styles.skipBtn,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text style={[styles.skipText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                    {isTune ? 'Cancel' : 'Skip for now'}
                  </Text>
                </Pressable>

                {isTune &&
                  Boolean(
                    localProfile.work.trim() ||
                      localProfile.interests.trim() ||
                      localProfile.goal.trim()
                  ) && (
                    <Pressable
                      cssInterop={false}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setLocalProfile({ work: '', interests: '', goal: '' });
                        if (onClearTune) {
                          onClose();
                          onClearTune();
                        }
                      }}
                      style={({ pressed }) => [
                        styles.skipBtn,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      <Text style={[styles.skipText, { color: '#EF4444' }]}>
                        Reset
                      </Text>
                    </Pressable>
                  )}
              </View>

              <Pressable
                cssInterop={false}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onSave(localTopicIds, localProfile);
                }}
                style={({ pressed }) => [
                  styles.ctaBtn,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={styles.ctaText} numberOfLines={1}>
                  {isTune ? 'Save & Apply Tuning' : 'Personalize Feed'}
                </Text>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={14}
                  color="#FFFFFF"
                  strokeWidth={2.4}
                />
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.68)',
  },
  card: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '88%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accentBar: {
    height: 4,
    backgroundColor: '#F97316',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboardingWrap: {
    flexShrink: 1,
  },
  filterHeader: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  catScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  catPillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  topicsGrid: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicTile: {
    width: '48.5%',
    minWidth: 145,
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1.25,
  },
  topicIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 16,
  },
  checkCircle: {
    width: 19,
    height: 19,
    borderRadius: 9.5,
    borderWidth: 1.5,
  },
  tuneScroll: {
    flexShrink: 1,
  },
  tuneBody: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
  },
  input: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 13.5,
    lineHeight: 19,
    ...(Platform.OS === 'web'
      ? ({ outlineStyle: 'none', outlineWidth: 0 } as any)
      : {}),
  },
  quickPickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  quickPickChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  quickPickText: {
    fontSize: 11,
    fontWeight: '600',
  },
  switchTopicsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  switchTopicsText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  footer: {
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 14,
    borderTopWidth: 1,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F97316',
    borderRadius: 3,
  },
  progressTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  progressReady: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  progressHint: {
    fontSize: 11,
    fontWeight: '600',
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  skipBtn: {
    paddingHorizontal: 6,
    paddingVertical: 8,
    flexShrink: 0,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F97316',
    flexShrink: 0,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
