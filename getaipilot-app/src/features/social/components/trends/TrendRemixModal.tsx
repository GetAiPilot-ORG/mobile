import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Copy01Icon,
  File01Icon,
  Forward01Icon,
  Layout01Icon,
  Rocket01Icon,
} from '@/constants/icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { apiClient } from '../../../../core/api/client';
import { supabase } from '../../../../lib/supabase';
import { TrendItem, TrendRemixData } from '../../types';
import { PinterestBrandIcon, YouTubeShortsBrandIcon } from './PlatformBrandIcons';
import { getBestMediaUrl } from './trendUtils';

const QUICKPOST_API_URL = 'https://api.getaipilot.in';
const QUICKPOST_SUPABASE_URL = 'https://oqaysrnncwbtrujnxsdo.supabase.co';
const QUICKPOST_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xYXlzcm5uY3didHJ1am54c2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NzkzMDcsImV4cCI6MjA4MzI1NTMwN30.ijLQ4PvBuL9BtuDnNfjQeRh12Q1MPInbI_Tvj1mvOd8';

let cachedQuickPostToken: { token: string; expiresAt: number } | null = null;

async function resolveQuickPostToken(): Promise<string | null> {
  if (cachedQuickPostToken && cachedQuickPostToken.expiresAt > Date.now() + 60_000) {
    return cachedQuickPostToken.token;
  }

  let ssoLaunchUrl = '';
  try {
    const ssoRes = await apiClient.post<{ ssoUrl?: string }>('/mobile/v1/social/sso-url', {
      target: 'trends',
    });
    if (ssoRes?.ssoUrl) ssoLaunchUrl = ssoRes.ssoUrl;
  } catch {
    // Fallback to direct Hub Edge Function
  }

  if (!ssoLaunchUrl) {
    try {
      const { data } = await supabase.functions.invoke('social-sso', {
        body: { dmpilot_url: 'https://social.getaipilot.in' },
      });
      if (data?.launch_url) ssoLaunchUrl = data.launch_url;
    } catch {
      // Ignore edge invocation failure
    }
  }

  if (!ssoLaunchUrl) return null;

  let ssoJwt: string | null = null;
  try {
    ssoJwt = new URL(ssoLaunchUrl).searchParams.get('token');
  } catch {
    const match = ssoLaunchUrl.match(/[?&]token=([^&]+)/);
    ssoJwt = match?.[1] ? decodeURIComponent(match[1]) : null;
  }
  if (!ssoJwt) return null;

  const exRes = await fetch(`${QUICKPOST_API_URL}/api/auth/sso`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: ssoJwt }),
  });
  if (!exRes.ok) return null;
  const exData: any = await exRes.json().catch(() => null);
  const magicUrl = exData?.magic_link_url;
  if (!magicUrl) return null;

  let tokenHash: string | null = null;
  let otpType = 'magiclink';
  try {
    const u = new URL(magicUrl);
    tokenHash = u.searchParams.get('token');
    otpType = u.searchParams.get('type') || 'magiclink';
  } catch {
    const m = String(magicUrl).match(/[?&]token=([^&]+)/);
    tokenHash = m?.[1] ? decodeURIComponent(m[1]) : null;
  }
  if (!tokenHash) return null;

  const verifyRes = await fetch(`${QUICKPOST_SUPABASE_URL}/auth/v1/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: QUICKPOST_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ type: otpType, token_hash: tokenHash }),
  });
  if (!verifyRes.ok) return null;

  const sessionData: any = await verifyRes.json().catch(() => null);
  const accessToken = sessionData?.access_token;
  if (!accessToken) return null;

  let expiresAt = Date.now() + 45 * 60 * 1000;
  try {
    if (typeof globalThis.atob === 'function') {
      const b64 = accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(globalThis.atob(b64));
      if (typeof payload?.exp === 'number') {
        expiresAt = payload.exp * 1000;
      }
    }
  } catch {
    // Keep default TTL
  }

  cachedQuickPostToken = { token: accessToken, expiresAt };
  return accessToken;
}

interface TrendRemixModalProps {
  visible: boolean;
  trend: TrendItem | null;
  onClose: () => void;
  onSendToComposer: (payload: { caption: string; mediaUrl?: string | null; trend: TrendItem }) => void;
  isDark: boolean;
}

function buildFallbackTrendRemix(post: TrendItem): TrendRemixData {
  const cleanTitle = (post.title || post.caption || 'Trending Creator Topic')
    .replace(/\s+/g, ' ')
    .trim();
  const shortTitle = cleanTitle.length > 72 ? `${cleanTitle.slice(0, 69)}...` : cleanTitle;
  const platformLabel = (post.source_platform || post.platform || 'social').toUpperCase();
  const cleanTags = (post.niche_tags || [])
    .map((t) => String(t || '').replace(/^#/, '').trim())
    .filter((t) => t.length >= 2 && !['all', 'shorts', 'short', 'video', 'reel'].includes(t.toLowerCase()) && !t.toLowerCase().startsWith('region:'))
    .slice(0, 5);
  const topicLabel = post.matched_topic || cleanTags[0] || 'content growth';
  const hashtags = (cleanTags.length > 0 ? cleanTags : ['trending', 'contentcreator', 'growth'])
    .map((t) => `#${t.replace(/\s+/g, '')}`)
    .join(' ');
  const sourceRef = post.source_url ? `\nSource: ${post.source_url}` : '';

  return {
    viral_hooks: [
      {
        style: 'Pattern Interrupt',
        hook: `Stop scrolling if you care about ${topicLabel}: "${shortTitle}" just changed the playbook.`,
      },
      {
        style: 'Curiosity Gap',
        hook: `Everyone is talking about "${shortTitle}" on ${platformLabel}, but almost nobody noticed the real takeaway.`,
      },
      {
        style: 'Contrarian Take',
        hook: `Unpopular opinion on ${topicLabel}: why "${shortTitle}" matters way more than what most creators are posting today.`,
      },
    ],
    reel_script: {
      title: shortTitle,
      estimated_duration: '30-45s',
      hook: `0-3s (On-screen bold text + fast cut): "${shortTitle}" — here is why this is blowing up right now.`,
      body_points: [
        `The Signal: What triggered this spike in ${topicLabel} (${post.creator ? `spotted via ${post.creator}` : `trending on ${platformLabel}`}).`,
        `The Breakdown: Explain the 1 core reason your audience should pay attention and what mistake to avoid.`,
        `Quick Action Step: Show how someone in ${topicLabel} can test this angle in their next post today.`,
      ],
      call_to_action: `Save this for your next ${topicLabel} post and comment your take below!`,
    },
    thread_angle: {
      opening_post: `Trending right now in ${topicLabel}:\n\n"${cleanTitle}"\n\nHere is the quick 3-part breakdown you can turn into your next high-retention post:`,
      key_insights: [
        `What is happening: Attention around ${topicLabel} is shifting fast toward sharper, high-utility formats like this.`,
        `What most creators miss: Jumping on the headline without connecting it to a practical takeaway for their own audience.`,
        `How to stand out: Pair this story with your own 1-sentence opinion or real example.`,
      ],
      closing_post: `Would you test this angle on your feed this week? Reply with your take.`,
    },
    carousel_concept: {
      topic: `${topicLabel}: ${shortTitle}`,
      slides: [
        { slide: 1, heading: 'Hook Slide', text: shortTitle },
        { slide: 2, heading: 'The Context', text: `Trending on ${platformLabel} — why creators in ${topicLabel} are watching this closely.` },
        { slide: 3, heading: 'Key Insight', text: 'Break down the core lesson in plain language so viewers can grasp it in 3 seconds.' },
        { slide: 4, heading: 'How to Apply', text: `Use this angle in a Reel, Carousel, or Story tailored to your ${topicLabel} audience.` },
        { slide: 5, heading: 'Save & Share', text: 'Bookmark this blueprint for your weekly content batch.' },
      ],
    },
    ready_to_post_caption: `${cleanTitle}\n\nWhy this is catching attention in ${topicLabel}:\n• Clear hook in the first 2 seconds\n• Practical takeaway your audience can apply today\n• Built for high saves and shares${sourceRef}\n\n${hashtags}`,
  };
}

const REMIX_TABS = [
  { id: 'hooks', label: 'Hooks (3)' },
  { id: 'script', label: 'Reel Script' },
  { id: 'thread', label: 'Thread' },
  { id: 'carousel', label: 'Carousel' },
  { id: 'caption', label: 'Caption' },
] as const;

type RemixTabId = (typeof REMIX_TABS)[number]['id'];

export const TrendRemixModal: React.FC<TrendRemixModalProps> = ({
  visible,
  trend,
  onClose,
  onSendToComposer,
  isDark,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [remixData, setRemixData] = useState<TrendRemixData | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [activeTab, setActiveTab] = useState<RemixTabId>('hooks');
  const [copiedKey, setCopiedKey] = useState('');

  const fetchRemix = useCallback(async (post: TrendItem) => {
    setLoading(true);
    setErrorMsg('');
    setRemixData(null);
    setIsFallbackMode(false);

    const payload = {
      title: post.title || post.caption || 'Trend Inspiration',
      caption: post.caption || '',
      source_platform: post.source_platform || 'trend',
      source_url: post.source_url || '',
      niche: (post.niche_tags || []).join(', ') || 'creator',
    };

    try {
      try {
        const res: any = await apiClient.post('/mobile/v1/social/trends/remix', payload);
        if (res?.remix) {
          setRemixData(res.remix);
          return;
        }
      } catch {
        // Try direct QuickPost endpoint if BFF route isn't running/deployed yet
      }

      try {
        const directToken = await resolveQuickPostToken();
        if (directToken) {
          const directRes = await fetch(`${QUICKPOST_API_URL}/api/trends/remix`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${directToken}`,
            },
            body: JSON.stringify(payload),
          });
          const directJson: any = await directRes.json().catch(() => ({}));
          if (directRes.ok && directJson?.remix) {
            setRemixData(directJson.remix);
            return;
          }
        }
      } catch {
        // Web CORS / network unavailable — use structured trend blueprint below
      }

      setRemixData(buildFallbackTrendRemix(post));
      setIsFallbackMode(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible && trend) {
      setActiveTab('hooks');
      void fetchRemix(trend);
    }
  }, [visible, trend, fetchRemix]);

  const handleCopy = async (text: string, key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  if (!trend) return null;
  const mediaUrl = getBestMediaUrl(trend);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable cssInterop={false} style={styles.dismissArea} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? '#161B22' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' },
            ]}
          >
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: isDark ? '#FFFFFF' : '#111827' },
                ]}
              >
                <HugeiconsIcon
                  icon={Rocket01Icon}
                  size={16}
                  color="#F59E0B"
                  strokeWidth={2.2}
                />
              </View>
              <View>
                <Text style={[styles.title, { color: isDark ? '#F9FAFB' : '#111827' }]}>
                  AI Trend Remix Studio
                </Text>
                <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  Hooks, reel scripts, carousel blueprints & captions
                </Text>
              </View>
            </View>
            <Pressable
              cssInterop={false}
              hitSlop={8}
              onPress={onClose}
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? '#252230' : '#F3F4F6' },
              ]}
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                size={16}
                color={isDark ? '#E5E7EB' : '#374151'}
                strokeWidth={2}
              />
            </Pressable>
          </View>

          {/* Context Bar */}
          <View
            style={[
              styles.contextBar,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
              },
            ]}
          >
            {trend.thumbnail_url ? (
              <Image source={{ uri: trend.thumbnail_url }} style={styles.contextThumb} />
            ) : null}
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                {String(trend.source_platform || '').toLowerCase().includes('pinterest') ? (
                  <PinterestBrandIcon size={12} />
                ) : String(trend.source_platform || '').toLowerCase().includes('youtube') ? (
                  <YouTubeShortsBrandIcon size={12} />
                ) : null}
                <Text style={styles.contextPlatform}>
                  Source: {trend.source_platform || 'trend'}
                </Text>
              </View>
              <Text
                numberOfLines={1}
                style={[
                  styles.contextTitle,
                  { color: isDark ? '#F3F4F6' : '#111827' },
                ]}
              >
                {trend.title || trend.caption || 'Trend Idea'}
              </Text>
            </View>
            <Pressable
              cssInterop={false}
              disabled={loading}
              onPress={() => void fetchRemix(trend)}
              style={[
                styles.regenBtn,
                {
                  backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
                  opacity: loading ? 0.5 : 1,
                },
              ]}
            >
              <Text style={[styles.regenText, { color: isDark ? '#E5E7EB' : '#374151' }]}>
                Regenerate
              </Text>
            </Pressable>
          </View>

          {/* Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[
              styles.tabsBar,
              { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' },
            ]}
            contentContainerStyle={styles.tabsContent}
          >
            {REMIX_TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  cssInterop={false}
                  onPress={() => setActiveTab(tab.id)}
                  style={[
                    styles.tabBtn,
                    active && {
                      borderBottomColor: isDark ? '#FFFFFF' : '#111827',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color: active
                          ? isDark
                            ? '#FFFFFF'
                            : '#111827'
                          : isDark
                          ? '#9CA3AF'
                          : '#6B7280',
                        fontWeight: active ? '700' : '600',
                      },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Body */}
          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color="#F97316" />
                <Text style={[styles.centerTitle, { color: isDark ? '#F3F4F6' : '#111827' }]}>
                  Synthesizing viral remix angles...
                </Text>
                <Text style={[styles.centerSub, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  Extracting hooks, scripts, and pacing models.
                </Text>
              </View>
            ) : errorMsg ? (
              <View style={styles.centerBox}>
                <Text style={[styles.centerTitle, { color: '#EF4444' }]}>
                  Remix Unavailable
                </Text>
                <Text style={[styles.centerSub, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  {errorMsg}
                </Text>
                <Pressable
                  cssInterop={false}
                  onPress={() => void fetchRemix(trend)}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>Try Again</Text>
                </Pressable>
              </View>
            ) : !remixData ? null : (
              <>
                {isFallbackMode && (
                  <View
                    style={[
                      styles.fallbackNote,
                      {
                        backgroundColor: isDark ? 'rgba(112,85,232,0.14)' : '#F5F3FF',
                        borderColor: isDark ? 'rgba(112,85,232,0.3)' : '#DDD6FE',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.fallbackNoteText,
                        { color: isDark ? '#DDD6FE' : '#5B21B6' },
                      ]}
                    >
                      Instant Remix Blueprint (live AI endpoint offline on localhost)
                    </Text>
                  </View>
                )}
                {/* 1. HOOKS */}
                {activeTab === 'hooks' && (
                  <View style={styles.sectionStack}>
                    <Text style={[styles.sectionHint, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                      Proven scroll-stopping hooks based on this trend:
                    </Text>
                    {(remixData.viral_hooks || []).map((hookItem, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.itemBox,
                          {
                            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                            borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB',
                          },
                        ]}
                      >
                        <View style={styles.itemBoxHeader}>
                          <Text style={styles.itemStyleTag}>{hookItem.style}</Text>
                          <View style={styles.itemBoxActions}>
                            <Pressable
                              cssInterop={false}
                              onPress={() => void handleCopy(hookItem.hook, `hook_${idx}`)}
                              style={styles.miniIconBtn}
                            >
                              <HugeiconsIcon
                                icon={copiedKey === `hook_${idx}` ? CheckmarkCircle01Icon : Copy01Icon}
                                size={14}
                                color={copiedKey === `hook_${idx}` ? '#10B981' : isDark ? '#D1D5DB' : '#4B5563'}
                                strokeWidth={2}
                              />
                            </Pressable>
                            <Pressable
                              cssInterop={false}
                              onPress={() => {
                                onClose();
                                onSendToComposer({
                                  caption: `${hookItem.hook}\n\n${trend.caption || ''}\n\nSource: ${trend.source_url || ''}`.trim(),
                                  mediaUrl,
                                  trend,
                                });
                              }}
                              style={[
                                styles.miniUseBtn,
                                { backgroundColor: isDark ? '#FFFFFF' : '#111827' },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.miniUseText,
                                  { color: isDark ? '#111827' : '#FFFFFF' },
                                ]}
                              >
                                Use
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                        <Text style={[styles.hookQuote, { color: isDark ? '#F9FAFB' : '#111827' }]}>
                          "{hookItem.hook}"
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* 2. REEL SCRIPT */}
                {activeTab === 'script' && remixData.reel_script && (
                  <View style={styles.sectionStack}>
                    <View style={styles.itemBoxHeader}>
                      <Text style={[styles.scriptTitle, { color: isDark ? '#F9FAFB' : '#111827' }]}>
                        {remixData.reel_script.title}
                      </Text>
                      {remixData.reel_script.estimated_duration ? (
                        <Text style={styles.durationTag}>
                          {remixData.reel_script.estimated_duration}
                        </Text>
                      ) : null}
                    </View>

                    <View
                      style={[
                        styles.itemBox,
                        {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                          borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB',
                        },
                      ]}
                    >
                      <Text style={styles.amberLabel}>Visual Hook (0-3s)</Text>
                      <Text style={[styles.bodyText, { color: isDark ? '#F9FAFB' : '#111827' }]}>
                        {remixData.reel_script.hook}
                      </Text>
                    </View>

                    <View style={{ gap: 6 }}>
                      <Text style={styles.mutedLabel}>Key Points</Text>
                      {(remixData.reel_script.body_points || []).map((pt, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.pointRow,
                            {
                              backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
                              borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB',
                            },
                          ]}
                        >
                          <Text style={[styles.pointNum, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                            {idx + 1}.
                          </Text>
                          <Text style={[styles.pointText, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                            {pt}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {remixData.reel_script.call_to_action ? (
                      <View
                        style={[
                          styles.itemBox,
                          {
                            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                            borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB',
                          },
                        ]}
                      >
                        <Text style={styles.mutedLabel}>Call to Action</Text>
                        <Text style={[styles.bodyText, { color: isDark ? '#F9FAFB' : '#111827' }]}>
                          {remixData.reel_script.call_to_action}
                        </Text>
                      </View>
                    ) : null}

                    <Pressable
                      cssInterop={false}
                      onPress={() => {
                        const rs = remixData.reel_script!;
                        onClose();
                        onSendToComposer({
                          caption: `REEL SCRIPT: ${rs.title}\n\n[HOOK]: ${rs.hook}\n\n[BODY POINTS]:\n${(rs.body_points || []).join('\n')}\n\n[CTA]: ${rs.call_to_action || ''}`.trim(),
                          mediaUrl,
                          trend,
                        });
                      }}
                      style={styles.primaryBtn}
                    >
                      <HugeiconsIcon icon={Forward01Icon} size={14} color="#FFFFFF" strokeWidth={2} />
                      <Text style={styles.primaryBtnText}>Use Script in Post Composer</Text>
                    </Pressable>
                  </View>
                )}

                {/* 3. THREAD */}
                {activeTab === 'thread' && remixData.thread_angle && (
                  <View style={styles.sectionStack}>
                    <View
                      style={[
                        styles.itemBox,
                        {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                          borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB',
                        },
                      ]}
                    >
                      <Text style={styles.mutedLabel}>Opening Post</Text>
                      <Text style={[styles.bodyText, { color: isDark ? '#F9FAFB' : '#111827' }]}>
                        {remixData.thread_angle.opening_post}
                      </Text>
                    </View>

                    <View style={{ gap: 6 }}>
                      <Text style={styles.mutedLabel}>Insights</Text>
                      {(remixData.thread_angle.key_insights || []).map((insight, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.pointRow,
                            {
                              backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
                              borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB',
                            },
                          ]}
                        >
                          <Text style={[styles.pointNum, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                            #{idx + 1}
                          </Text>
                          <Text style={[styles.pointText, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                            {insight}
                          </Text>
                        </View>
                      ))}
                    </View>

                    <Pressable
                      cssInterop={false}
                      onPress={() => {
                        const th = remixData.thread_angle!;
                        onClose();
                        onSendToComposer({
                          caption: `${th.opening_post}\n\n${(th.key_insights || []).map((i, idx) => `${idx + 1}/ ${i}`).join('\n\n')}\n\n${th.closing_post || ''}`.trim(),
                          mediaUrl,
                          trend,
                        });
                      }}
                      style={styles.primaryBtn}
                    >
                      <HugeiconsIcon icon={Forward01Icon} size={14} color="#FFFFFF" strokeWidth={2} />
                      <Text style={styles.primaryBtnText}>Use Thread in Post Composer</Text>
                    </Pressable>
                  </View>
                )}

                {/* 4. CAROUSEL */}
                {activeTab === 'carousel' && remixData.carousel_concept && (
                  <View style={styles.sectionStack}>
                    <View style={styles.itemBoxHeader}>
                      <Text style={[styles.scriptTitle, { color: isDark ? '#F9FAFB' : '#111827' }]}>
                        {remixData.carousel_concept.topic}
                      </Text>
                      <Text style={styles.durationTag}>
                        {(remixData.carousel_concept.slides || []).length} Slides
                      </Text>
                    </View>

                    {(remixData.carousel_concept.slides || []).map((slide) => (
                      <View
                        key={slide.slide}
                        style={[
                          styles.pointRow,
                          {
                            backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
                            borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB',
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.slideBadge,
                            { backgroundColor: isDark ? '#FFFFFF' : '#111827' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.slideNum,
                              { color: isDark ? '#111827' : '#FFFFFF' },
                            ]}
                          >
                            {slide.slide}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.slideHead, { color: isDark ? '#F9FAFB' : '#111827' }]}>
                            {slide.heading}
                          </Text>
                          <Text style={[styles.slideText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                            {slide.text}
                          </Text>
                        </View>
                      </View>
                    ))}

                    <Pressable
                      cssInterop={false}
                      onPress={() => {
                        const car = remixData.carousel_concept!;
                        onClose();
                        onSendToComposer({
                          caption: `CAROUSEL: ${car.topic}\n\n${(car.slides || []).map((s) => `[Slide ${s.slide}: ${s.heading}]\n${s.text}`).join('\n\n')}`,
                          mediaUrl,
                          trend,
                        });
                      }}
                      style={styles.primaryBtn}
                    >
                      <HugeiconsIcon icon={Layout01Icon} size={14} color="#FFFFFF" strokeWidth={2} />
                      <Text style={styles.primaryBtnText}>Use Carousel in Composer</Text>
                    </Pressable>
                  </View>
                )}

                {/* 5. CAPTION */}
                {activeTab === 'caption' && remixData.ready_to_post_caption && (
                  <View style={styles.sectionStack}>
                    <View style={styles.itemBoxHeader}>
                      <Text style={styles.mutedLabel}>Formatted Caption</Text>
                      <Pressable
                        cssInterop={false}
                        onPress={() =>
                          void handleCopy(remixData.ready_to_post_caption!, 'full_caption')
                        }
                        style={styles.copyInlineBtn}
                      >
                        <HugeiconsIcon
                          icon={copiedKey === 'full_caption' ? CheckmarkCircle01Icon : Copy01Icon}
                          size={13}
                          color={copiedKey === 'full_caption' ? '#10B981' : isDark ? '#D1D5DB' : '#374151'}
                          strokeWidth={2}
                        />
                        <Text
                          style={[
                            styles.copyInlineText,
                            { color: isDark ? '#D1D5DB' : '#374151' },
                          ]}
                        >
                          {copiedKey === 'full_caption' ? 'Copied' : 'Copy'}
                        </Text>
                      </Pressable>
                    </View>

                    <View
                      style={[
                        styles.itemBox,
                        {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                          borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB',
                        },
                      ]}
                    >
                      <Text
                        selectable
                        style={[styles.bodyText, { color: isDark ? '#E5E7EB' : '#1F2937' }]}
                      >
                        {remixData.ready_to_post_caption}
                      </Text>
                    </View>

                    <Pressable
                      cssInterop={false}
                      onPress={() => {
                        onClose();
                        onSendToComposer({
                          caption: remixData.ready_to_post_caption!,
                          mediaUrl,
                          trend,
                        });
                      }}
                      style={styles.primaryBtn}
                    >
                      <HugeiconsIcon icon={File01Icon} size={14} color="#FFFFFF" strokeWidth={2} />
                      <Text style={styles.primaryBtnText}>Open in Post Composer</Text>
                    </Pressable>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    width: '100%',
    maxHeight: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15.5,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  contextThumb: {
    width: 42,
    height: 36,
    borderRadius: 8,
  },
  contextPlatform: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  contextTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  regenBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  regenText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tabsBar: {
    borderBottomWidth: 1,
    maxHeight: 44,
  },
  tabsContent: {
    paddingHorizontal: 14,
    gap: 14,
    alignItems: 'center',
  },
  tabBtn: {
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 12.5,
  },
  bodyScroll: {
    maxHeight: 460,
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  centerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  centerSub: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 260,
  },
  sectionStack: {
    gap: 10,
  },
  sectionHint: {
    fontSize: 12,
    fontWeight: '500',
  },
  itemBox: {
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  itemBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemStyleTag: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  itemBoxActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniIconBtn: {
    padding: 4,
  },
  miniUseBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 7,
  },
  miniUseText: {
    fontSize: 11,
    fontWeight: '700',
  },
  hookQuote: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  scriptTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    flex: 1,
  },
  durationTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  amberLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: '#D97706',
    letterSpacing: 0.5,
  },
  mutedLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  bodyText: {
    fontSize: 12.5,
    lineHeight: 19,
    fontWeight: '500',
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 11,
    borderRadius: 11,
    borderWidth: 1,
  },
  pointNum: {
    fontSize: 12,
    fontWeight: '800',
  },
  pointText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17.5,
  },
  slideBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideNum: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  slideHead: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  slideText: {
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16.5,
  },
  copyInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  copyInlineText: {
    fontSize: 12,
    fontWeight: '600',
  },
  primaryBtn: {
    marginTop: 4,
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#7055E8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  fallbackNote: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  fallbackNoteText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
