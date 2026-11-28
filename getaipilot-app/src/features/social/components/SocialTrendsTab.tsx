import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Activity01Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Edit02Icon,
  Folder01Icon,
  RefreshCwIcon,
  Search01Icon,
  TelescopeIcon,
} from '@/constants/icons';
import * as Haptics from 'expo-haptics';
import { apiClient } from '../../../core/api/client';
import { useAuthStore } from '../../../core/store/authStore';
import { supabase } from '../../../lib/supabase';
import {
  HotTopicItem,
  TrendFeedResponse,
  TrendItem,
  TrendPreferences,
} from '../types';
import { getColors, useTheme } from '@/theme';
import {
  CreatorInterestModal,
  CreatorProfileDraft,
  FORMAT_TABS,
  FormatTab,
  PinterestBrandIcon,
  REGION_OPTIONS,
  RegionOption,
  SavedIdeasModal,
  TREND_INTEREST_TOPICS,
  TrendCard,
  TrendDetailModal,
  TrendGridSkeleton,
  TrendRemixModal,
  YouTubeShortsBrandIcon,
  addTermToInterestsString,
  dedupeClientPosts,
  detectFormatFromGoal,
  getClientPostKey,
  sanitizeRecentSearches,
  useSavedTrends,
} from './trends';

interface SocialTrendsTabProps {
  trendsLoading: boolean;
  trendsList: TrendItem[];
  onUseTrendInPost: (trend: TrendItem) => void;
  onRefreshTrends?: () => void;
  onRegisterLoadMore?: (fn: (() => void) | null) => void;
}

const DEFAULT_PROFILE: CreatorProfileDraft = {
  work: '',
  interests: '',
  goal: '',
};

function shuffleTrendBatch<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const SocialTrendsTab: React.FC<SocialTrendsTabProps> = ({
  trendsLoading,
  trendsList,
  onUseTrendInPost,
  onRefreshTrends,
  onRegisterLoadMore,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { width } = useWindowDimensions();
  const user = useAuthStore((s) => s.user);
  const authStatus = useAuthStore((s) => s.authStatus);
  const userKey = user?.id || user?.email || 'anon';

  const prefsStorageKey = `@qp_trend_prefs_v1_${userKey}`;
  const dismissedSearchesKey = `@qp_trend_dismissed_searches_v1_${userKey}`;
  const tunedDismissedKey = `@qp_trend_tuned_dismissed_v1_${userKey}`;

  // Filters & Feed Mode
  const [selectedFormat, setSelectedFormat] = useState<FormatTab['id']>('all');
  const [selectedRegion, setSelectedRegion] = useState<RegionOption>(REGION_OPTIONS[0]);
  const [showRegionModal, setShowRegionModal] = useState(false);

  // Search & Active Tuned Topic Filters
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [activeTunedTerms, setActiveTunedTerms] = useState<string[]>([]);

  // Onboarding / Creator Preferences / Topics Rail
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [profile, setProfile] = useState<CreatorProfileDraft>(DEFAULT_PROFILE);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [dismissedSearches, setDismissedSearches] = useState<string[]>([]);
  const [isTunedDismissed, setIsTunedDismissed] = useState(false);
  const [activeTopicFilter, setActiveTopicFilter] = useState<string | null>(null);
  const [interestModalOpen, setInterestModalOpen] = useState(false);
  const [interestModalMode, setInterestModalMode] = useState<'onboarding' | 'tune'>('onboarding');
  const autoPromptedOnboardingRef = useRef<string | null>(null);

  // Hot Topics Radar
  const [hotTopics, setHotTopics] = useState<HotTopicItem[]>([]);

  // Feed Data & Pagination
  const [feedItems, setFeedItems] = useState<TrendItem[]>(trendsList || []);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCandidateCount, setTotalCandidateCount] = useState<number>(0);
  const [isFetchingFeed, setIsFetchingFeed] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreTrends, setHasMoreTrends] = useState(true);
  const seenKeysRef = useRef<Set<string>>(new Set());
  const seenIdsRef = useRef<Set<string>>(new Set());
  const refreshCycleRef = useRef(0);
  const fetchRequestIdRef = useRef(0);
  const skipNextEffectRef = useRef(false);
  const loadMoreLockRef = useRef(false);
  const hasMoreRef = useRef(true);
  const emptyAppendStreakRef = useRef(0);

  // Modals & Drawers
  const [selectedTrend, setSelectedTrend] = useState<TrendItem | null>(null);
  const [remixTrend, setRemixTrend] = useState<TrendItem | null>(null);
  const [savedModalOpen, setSavedModalOpen] = useState(false);

  const {
    savedTrends,
    savedIds,
    toggleSave,
    removeSaved,
    clearAllSaved,
  } = useSavedTrends(userKey);

  // Keep feed synced with initial parent trendsList before customized fetch runs
  useEffect(() => {
    if (
      Array.isArray(trendsList) &&
      trendsList.length > 0 &&
      feedItems.length === 0 &&
      !activeSearch &&
      !activeTopicFilter &&
      selectedFormat === 'all'
    ) {
      const deduped = dedupeClientPosts(trendsList);
      setFeedItems(deduped);
    }
  }, [trendsList, feedItems.length, activeSearch, activeTopicFilter, selectedFormat]);

  // Visible searched topic pills (filtered by dismissed list & sanitized)
  const visibleSearchedTopics = useMemo(() => {
    const clean = sanitizeRecentSearches(recentSearches);
    const dismissedLower = new Set(dismissedSearches.map((d) => d.toLowerCase()));
    return clean.filter((term) => !dismissedLower.has(term.toLowerCase()));
  }, [recentSearches, dismissedSearches]);

  const isTuned = Boolean(
    !isTunedDismissed &&
      (profile.work.trim() || profile.interests.trim() || profile.goal.trim())
  );

  // 1. Load Preferences across BFF (/preferences + /search-history + /trends fallback), Supabase metadata, and AsyncStorage
  useEffect(() => {
    if (authStatus === 'hydrating') return;

    let mounted = true;
    (async () => {
      try {
        const anonPrefsKey = '@qp_trend_prefs_v1_anon';
        const [localPrefsRaw, anonPrefsRaw, localDismissedRaw, localTunedDismissedRaw] =
          await Promise.all([
            AsyncStorage.getItem(prefsStorageKey),
            userKey !== 'anon' ? AsyncStorage.getItem(anonPrefsKey) : Promise.resolve(null),
            AsyncStorage.getItem(dismissedSearchesKey),
            AsyncStorage.getItem(tunedDismissedKey),
          ]);

        if (mounted && localDismissedRaw) {
          const parsedDismissed = JSON.parse(localDismissedRaw);
          if (Array.isArray(parsedDismissed)) setDismissedSearches(parsedDismissed);
        }
        if (mounted && localTunedDismissedRaw === 'true') {
          setIsTunedDismissed(true);
        }

        let bffPrefs: Partial<TrendPreferences> | null = null;
        let bffHistorySearches: string[] = [];
        let metaPrefs: Partial<TrendPreferences> | null = null;
        let localPrefs: Partial<TrendPreferences> | null = null;

        const [bffPrefResult, bffHistResult, supaUserResult] = await Promise.allSettled([
          apiClient.get<{
            success?: boolean;
            preferences?: TrendPreferences;
          }>('/mobile/v1/social/trends/preferences'),
          apiClient.get<{
            success?: boolean;
            searches?: string[];
          }>('/mobile/v1/social/trends/search-history'),
          supabase.auth.getUser(),
        ]);

        if (bffPrefResult.status === 'fulfilled' && bffPrefResult.value?.preferences) {
          bffPrefs = bffPrefResult.value.preferences;
        }
        if (bffHistResult.status === 'fulfilled' && Array.isArray(bffHistResult.value?.searches)) {
          bffHistorySearches = bffHistResult.value.searches;
        }
        if (supaUserResult.status === 'fulfilled') {
          const mp = supaUserResult.value?.data?.user?.user_metadata?.trend_preferences;
          if (mp && typeof mp === 'object') {
            metaPrefs = mp;
          }
        }

        const parseJsonObj = (raw: string | null): Partial<TrendPreferences> | null => {
          if (!raw) return null;
          try {
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : null;
          } catch {
            return null;
          }
        };

        localPrefs = parseJsonObj(localPrefsRaw) || parseJsonObj(anonPrefsRaw);

        // Merge non-empty topics, searches, and profile fields from DB (authoritative when reachable) or fallback caches
        const pickList = (arr?: unknown[]) =>
          Array.isArray(arr)
            ? (arr.filter((x) => typeof x === 'string' && x.trim().length > 0) as string[])
            : [];

        const bffSucceeded = bffPrefResult.status === 'fulfilled' && Boolean(bffPrefs);

        let mergedTopicIds = bffSucceeded
          ? pickList(bffPrefs?.selectedTopicIds)
          : Array.from(
              new Set([
                ...pickList(metaPrefs?.selectedTopicIds),
                ...pickList(localPrefs?.selectedTopicIds),
              ])
            );

        let mergedRawSearches = bffSucceeded
          ? Array.from(
              new Set([
                ...pickList(bffPrefs?.recentSearches),
                ...pickList(bffHistorySearches),
              ])
            )
          : Array.from(
              new Set([
                ...pickList(bffHistorySearches),
                ...pickList(metaPrefs?.recentSearches),
                ...pickList(localPrefs?.recentSearches),
              ])
            );

        const mergedProfile: CreatorProfileDraft = bffSucceeded
          ? {
              work: String(bffPrefs?.work || '').trim(),
              interests: String(bffPrefs?.interests || '').trim(),
              goal: String(bffPrefs?.goal || '').trim(),
            }
          : {
              work: String(metaPrefs?.work || localPrefs?.work || '').trim(),
              interests: String(metaPrefs?.interests || localPrefs?.interests || '').trim(),
              goal: String(metaPrefs?.goal || localPrefs?.goal || '').trim(),
            };

        let feedPersonalizedHint = false;
        let hasAnyDbInterestTopics =
          mergedTopicIds.length > 0 ||
          mergedRawSearches.length > 0 ||
          Boolean(mergedProfile.work) ||
          Boolean(mergedProfile.interests);

        // If /trends/preferences failed (e.g. un-deployed BFF) or returned empty,
        // probe /mobile/v1/social/trends which carries QuickPost's topics/recentSearches/isPersonalized!
        if (!hasAnyDbInterestTopics && !bffSucceeded) {
          try {
            const feedProbe = await apiClient.get<TrendFeedResponse>('/mobile/v1/social/trends', {
              params: { type: 'all', region: selectedRegion.code, limit: 12, page: 1 },
            });
            const probeTopics = Array.isArray(feedProbe?.topics)
              ? feedProbe.topics.map((t) => t?.id).filter((id): id is string => Boolean(id))
              : [];
            const probeSearches = pickList(feedProbe?.recentSearches);

            if (
              feedProbe?.isPersonalized ||
              probeTopics.length > 0 ||
              probeSearches.length > 0
            ) {
              feedPersonalizedHint = true;
              mergedTopicIds = Array.from(new Set([...mergedTopicIds, ...probeTopics]));
              mergedRawSearches = Array.from(new Set([...mergedRawSearches, ...probeSearches]));
            }
          } catch {
            // Keep existing check result
          }
        }

        if (!mounted) return;

        const sanitizedSearches = sanitizeRecentSearches(mergedRawSearches);
        hasAnyDbInterestTopics =
          hasAnyDbInterestTopics ||
          feedPersonalizedHint ||
          mergedTopicIds.length > 0 ||
          mergedRawSearches.length > 0 ||
          sanitizedSearches.length > 0;

        setSelectedTopicIds(mergedTopicIds);
        setProfile(mergedProfile);
        setRecentSearches(sanitizedSearches);
        setPrefsLoaded(true);

        if (hasAnyDbInterestTopics) {
          autoPromptedOnboardingRef.current = userKey;
          setInterestModalOpen((prevOpen) =>
            prevOpen && interestModalMode === 'onboarding' ? false : prevOpen
          );
        } else {
          // DB me koi interest topic / search nahi h -> clear stale local cache & show onboarding on reload
          AsyncStorage.removeItem(prefsStorageKey).catch(() => {});
          if (autoPromptedOnboardingRef.current !== userKey) {
            autoPromptedOnboardingRef.current = userKey;
            setInterestModalMode('onboarding');
            setInterestModalOpen(true);
          }
        }
      } catch {
        if (mounted) setPrefsLoaded(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [authStatus, userKey, prefsStorageKey, dismissedSearchesKey, tunedDismissedKey]);

  const persistPreferences = useCallback(
    async (
      nextTopics: string[],
      nextProfile: CreatorProfileDraft,
      nextSearches: string[],
      onboarded = true
    ) => {
      const payload: TrendPreferences = {
        selectedTopicIds: nextTopics,
        work: nextProfile.work.trim(),
        interests: nextProfile.interests.trim(),
        goal: nextProfile.goal.trim(),
        recentSearches: sanitizeRecentSearches(nextSearches),
        onboarded,
      };

      await AsyncStorage.setItem(prefsStorageKey, JSON.stringify(payload)).catch(() => {});

      await Promise.allSettled([
        apiClient.post('/mobile/v1/social/trends/preferences', payload),
        supabase.auth.updateUser({
          data: {
            trend_preferences: payload,
          },
        }),
      ]);
    },
    [prefsStorageKey]
  );

  // 2. Fetch Hot Topics Radar
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiClient.get<{
          success?: boolean;
          hotTopics?: HotTopicItem[];
          topics?: HotTopicItem[];
        }>('/mobile/v1/social/trends/hot-topics', {
          params: {
            region: selectedRegion.code,
            limit: 12,
          },
        });
        const serverTopics = Array.isArray(res?.hotTopics)
          ? res.hotTopics
          : Array.isArray(res?.topics)
            ? res.topics
            : [];
        if (mounted && serverTopics.length > 0) {
          setHotTopics(serverTopics);
          return;
        }
      } catch {
        // Fallback below derives radar topics from loaded items
      }

      if (!mounted) return;
      const derived: HotTopicItem[] = [];
      const seenQ = new Set<string>();
      for (const item of feedItems) {
        if (item.source_platform === 'google_trends' && item.title) {
          const q = item.title.trim();
          if (q && !seenQ.has(q.toLowerCase())) {
            seenQ.add(q.toLowerCase());
            derived.push({
              query: q,
              volume: item.metrics?.formattedTraffic || item.metrics?.searchVolume,
              source: 'google_trends',
            });
          }
        }
        if (derived.length >= 10) break;
      }
      if (derived.length < 6) {
        for (const item of feedItems) {
          if (Array.isArray(item.niche_tags)) {
            for (const tag of item.niche_tags) {
              const q = String(tag || '').replace(/^#/, '').trim();
              if (q.length >= 2 && !seenQ.has(q.toLowerCase())) {
                seenQ.add(q.toLowerCase());
                derived.push({ query: q });
              }
              if (derived.length >= 10) break;
            }
          }
          if (derived.length >= 10) break;
        }
      }
      if (mounted && derived.length > 0) {
        setHotTopics(derived);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedRegion.code, feedItems.length]);

  // 3. Fetch Feed Function (Full parity with web TrendFeedPage.jsx)
  const fetchFeed = useCallback(
    async (
      opts: {
        page?: number;
        cursor?: string | null;
        append?: boolean;
        refresh?: boolean;
        bustCache?: boolean;
        format?: FormatTab['id'];
        regionCode?: string;
        searchOverride?: string;
        tunedTermsOverride?: string[];
        topicOverride?: string | null;
        topicsOverride?: string[];
        searchesOverride?: string[];
        interestsOverride?: string;
      } = {}
    ) => {
      const requestId = ++fetchRequestIdRef.current;
      const page = opts.page ?? 1;
      const append = opts.append ?? false;
      const fmt = opts.format ?? selectedFormat;
      const regionCode = opts.regionCode ?? selectedRegion.code;
      const searchVal =
        opts.searchOverride !== undefined ? opts.searchOverride : activeSearch;
      const tunedTermsVal =
        opts.tunedTermsOverride !== undefined ? opts.tunedTermsOverride : activeTunedTerms;
      const topicVal =
        opts.topicOverride !== undefined ? opts.topicOverride : activeTopicFilter;
      const topicIdsVal = opts.topicsOverride ?? selectedTopicIds;
      const searchesVal = opts.searchesOverride ?? visibleSearchedTopics;
      const defaultProfileInterests = [profile.work, profile.interests, profile.goal]
        .map((v) => String(v || '').trim())
        .filter(Boolean)
        .join(', ');
      const interestsVal =
        opts.interestsOverride !== undefined
          ? opts.interestsOverride
          : isTunedDismissed
            ? ''
            : defaultProfileInterests;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsFetchingFeed(true);
        hasMoreRef.current = true;
        setHasMoreTrends(true);
        emptyAppendStreakRef.current = 0;
        if (!opts.refresh) {
          seenKeysRef.current.clear();
          seenIdsRef.current.clear();
          refreshCycleRef.current = 0;
        }
      }

      try {
        const seenStr =
          (append || opts.refresh) && seenIdsRef.current.size > 0
            ? Array.from(seenIdsRef.current).slice(-120).join(',')
            : undefined;

        let res: TrendFeedResponse | null = null;
        let incoming: TrendItem[] = [];

        // If user tuned multiple keywords/role (and no manual single search override is active),
        // dynamically query each tuned term and interleave them cleanly without unrelated fallback topics.
        const effectiveTerms =
          !searchVal.trim() && tunedTermsVal.length > 0
            ? tunedTermsVal.slice(0, 4)
            : [];

        if (effectiveTerms.length > 0) {
          const perTermLimit = Math.max(8, Math.ceil(24 / effectiveTerms.length));
          const responses = await Promise.all(
            effectiveTerms.map((term) => {
              const termParams: Record<string, any> = {
                type: fmt,
                region: regionCode,
                limit: perTermLimit,
                page,
                search: term,
              };
              if (opts.cursor) termParams.cursor = opts.cursor;
              if (seenStr) termParams.seen = seenStr;
              if (opts.refresh || opts.bustCache) termParams.refresh = Date.now();
              return apiClient
                .get<TrendFeedResponse>('/mobile/v1/social/trends', {
                  params: termParams,
                })
                .catch(() => null);
            })
          );

          if (requestId !== fetchRequestIdRef.current) {
            return;
          }

          const buckets = responses.map((r) =>
            Array.isArray(r?.items) ? r.items : []
          );
          const maxLen = Math.max(0, ...buckets.map((b) => b.length));
          const interleaved: TrendItem[] = [];
          for (let i = 0; i < maxLen; i += 1) {
            for (const b of buckets) {
              if (i < b.length) interleaved.push(b[i]);
            }
          }
          incoming = dedupeClientPosts(interleaved);
          res = responses.find((r): r is TrendFeedResponse => Boolean(r)) || null;
        } else {
          const params: Record<string, any> = {
            type: fmt,
            region: regionCode,
            limit: 24,
            page,
          };
          if (opts.cursor) params.cursor = opts.cursor;
          if (seenStr) params.seen = seenStr;
          if (opts.refresh || opts.bustCache) params.refresh = Date.now();
          if (searchVal.trim()) params.search = searchVal.trim();
          if (topicVal) params.topic = topicVal;
          if (topicIdsVal.length > 0) params.topics = topicIdsVal.join(',');
          if (searchesVal.length > 0) params.searches = searchesVal.join(',');
          if (interestsVal.trim()) params.interests = interestsVal.trim();

          res = await apiClient.get<TrendFeedResponse>(
            '/mobile/v1/social/trends',
            { params }
          );

          if (requestId !== fetchRequestIdRef.current) {
            return;
          }

          incoming = Array.isArray(res?.items) ? res.items : [];
        }
        incoming.forEach((item) => {
          const k = getClientPostKey(item);
          if (k) seenKeysRef.current.add(k);
          if (item?.id) seenIdsRef.current.add(String(item.id));
        });
        if (seenIdsRef.current.size > 160) {
          const kept = Array.from(seenIdsRef.current).slice(-120);
          seenIdsRef.current = new Set(kept);
        }

        const cleanIncoming = dedupeClientPosts(incoming);
        let didExhaust = false;
        setFeedItems((prev) => {
          if (append) {
            const prevKeys = new Set(prev.map((item) => getClientPostKey(item)).filter(Boolean));
            const netNewCount = cleanIncoming.filter((item) => {
              const k = getClientPostKey(item);
              return k ? !prevKeys.has(k) : !prev.some((p) => p.id === item.id);
            }).length;
            if (cleanIncoming.length === 0 || netNewCount === 0) {
              emptyAppendStreakRef.current += 1;
              if (cleanIncoming.length === 0 || emptyAppendStreakRef.current >= 2) {
                didExhaust = true;
              }
            } else {
              emptyAppendStreakRef.current = 0;
            }
            return dedupeClientPosts([...prev, ...cleanIncoming]);
          }
          if (opts.refresh) {
            if (cleanIncoming.length === 0) {
              // Keep the same topic feed populated & visibly rotated if upstream exhausted further pages
              if (prev.length <= 1) return prev;
              const rotated = [...prev.slice(Math.min(4, prev.length)), ...prev.slice(0, Math.min(4, prev.length))];
              return shuffleTrendBatch(rotated);
            }
            const prevKeys = new Set(prev.map((item) => getClientPostKey(item)).filter(Boolean));
            const unseenFirst = shuffleTrendBatch(
              cleanIncoming.filter((item) => {
                const k = getClientPostKey(item);
                return !k || !prevKeys.has(k);
              })
            );
            const overlapRest = shuffleTrendBatch(
              cleanIncoming.filter((item) => {
                const k = getClientPostKey(item);
                return Boolean(k && prevKeys.has(k));
              })
            );
            return unseenFirst.length >= 8
              ? [...unseenFirst, ...overlapRest.slice(0, 4)]
              : [...unseenFirst, ...overlapRest];
          }
          return cleanIncoming;
        });
        const serverHasMore = res?.hasMore !== false || Boolean(res?.nextCursor);
        if (append && (didExhaust || (!serverHasMore && cleanIncoming.length === 0))) {
          hasMoreRef.current = false;
          setHasMoreTrends(false);
        }
        setNextCursor(res?.nextCursor || null);
        setCurrentPage(page);
        setTotalCandidateCount(res?.totalCandidateCount ?? incoming.length);

        // If backend reports personalized topics or recent searches, ensure onboarding stays dismissed and rail stays synced
        const feedTopicIds = Array.isArray(res?.topics)
          ? res.topics.map((t) => t?.id).filter((id): id is string => Boolean(id))
          : [];
        const feedSearches = Array.isArray(res?.recentSearches)
          ? res.recentSearches.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
          : [];

        if (feedTopicIds.length > 0) {
          setSelectedTopicIds((prev) => {
            const merged = Array.from(new Set([...prev, ...feedTopicIds]));
            return merged.length === prev.length ? prev : merged;
          });
        }
        if (feedSearches.length > 0) {
          setRecentSearches((prev) => {
            const merged = sanitizeRecentSearches([...prev, ...feedSearches]);
            return merged.length === prev.length ? prev : merged;
          });
        }
        if (res?.isPersonalized || feedTopicIds.length > 0 || feedSearches.length > 0) {
          autoPromptedOnboardingRef.current = userKey;
          setInterestModalOpen((prevOpen) =>
            prevOpen && interestModalMode === 'onboarding' ? false : prevOpen
          );
        }
      } catch {
        // Keep existing feed on transient error
      } finally {
        loadMoreLockRef.current = false;
        setIsFetchingFeed(false);
        setIsLoadingMore(false);
      }
    },
    [
      selectedFormat,
      selectedRegion.code,
      activeSearch,
      activeTunedTerms,
      activeTopicFilter,
      selectedTopicIds,
      visibleSearchedTopics,
      isTunedDismissed,
      profile.work,
      profile.interests,
      profile.goal,
    ]
  );

  // Trigger fetch whenever core filter inputs change after preferences finish loading
  useEffect(() => {
    if (!prefsLoaded) return;
    if (skipNextEffectRef.current) {
      skipNextEffectRef.current = false;
      return;
    }
    fetchFeed({ page: 1, append: false });
  }, [
    prefsLoaded,
    selectedFormat,
    selectedRegion.code,
    activeSearch,
    activeTunedTerms,
    activeTopicFilter,
    selectedTopicIds,
  ]);

  // Handlers
  const handleSelectFormat = (fmt: FormatTab['id']) => {
    if (fmt === selectedFormat) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFormat(fmt);
  };

  const handleSelectRegion = (region: RegionOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowRegionModal(false);
    if (region.code !== selectedRegion.code) {
      setSelectedRegion(region);
    }
  };

  const handleExecuteSearch = useCallback(
    (overrideQuery?: string) => {
      const raw = typeof overrideQuery === 'string' ? overrideQuery : searchInput;
      const cleanTerm = raw.trim().replace(/^#/, '');
      if (!cleanTerm) {
        if (activeSearch) {
          setActiveSearch('');
        }
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSearchInput(cleanTerm);
      setActiveTopicFilter(null);
      setActiveTunedTerms([]);
      setActiveSearch(cleanTerm);

      // 1. Match searched term against canonical TREND_INTEREST_TOPICS & add to selectedTopicIds
      const cleanLower = cleanTerm.toLowerCase();
      const matchedTopic = TREND_INTEREST_TOPICS.find(
        (t) =>
          t.id.toLowerCase() === cleanLower ||
          t.label.toLowerCase() === cleanLower ||
          t.keywords
            .split(',')
            .map((k) => k.trim().toLowerCase())
            .some((k) => k === cleanLower || (cleanLower.length >= 3 && k.includes(cleanLower)))
      );
      const nextTopicIds =
        matchedTopic && !selectedTopicIds.includes(matchedTopic.id)
          ? [...selectedTopicIds, matchedTopic.id]
          : selectedTopicIds;

      // 2. Always add searched term to search history & interest keywords (Topics Rail + DB)
      const nextSearches = sanitizeRecentSearches([
        cleanTerm,
        ...recentSearches.filter(
          (s) => s.toLowerCase() !== cleanLower
        ),
      ]);
      const nextDismissed = dismissedSearches.filter(
        (d) => d.toLowerCase() !== cleanLower
      );
      const nextInterests = addTermToInterestsString(profile.interests, cleanTerm);
      const nextProfile: CreatorProfileDraft = {
        ...profile,
        interests: nextInterests,
      };

      setSelectedTopicIds(nextTopicIds);
      setRecentSearches(nextSearches);
      setDismissedSearches(nextDismissed);
      setIsTunedDismissed(false);
      setProfile(nextProfile);
      autoPromptedOnboardingRef.current = userKey;

      AsyncStorage.setItem(
        dismissedSearchesKey,
        JSON.stringify(nextDismissed)
      ).catch(() => {});
      AsyncStorage.removeItem(tunedDismissedKey).catch(() => {});

      apiClient
        .post('/mobile/v1/social/trends/search-history', { query: cleanTerm })
        .catch(() => {});

      persistPreferences(nextTopicIds, nextProfile, nextSearches, true);
    },
    [
      searchInput,
      activeSearch,
      recentSearches,
      dismissedSearches,
      profile,
      selectedTopicIds,
      dismissedSearchesKey,
      tunedDismissedKey,
      userKey,
      persistPreferences,
    ]
  );

  const handleClearSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchInput('');
    setActiveSearch('');
    setActiveTunedTerms([]);
  };

  const handleDismissSearchSuggestion = async (term: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const termLower = term.toLowerCase();
    const nextDismissed = Array.from(new Set([...dismissedSearches, term]));
    const nextRecent = recentSearches.filter(
      (s) => s.toLowerCase() !== termLower
    );
    const nextInterests = profile.interests
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && s.toLowerCase() !== termLower)
      .join(', ');
    const nextWork =
      profile.work.trim().toLowerCase() === termLower ? '' : profile.work;

    const nextProfile: CreatorProfileDraft = {
      ...profile,
      work: nextWork,
      interests: nextInterests,
    };

    const nextActiveTuned = activeTunedTerms.filter(
      (t) => t.toLowerCase() !== termLower
    );
    const wasInTunedTerms = nextActiveTuned.length !== activeTunedTerms.length;
    const wasActiveSingle =
      activeSearch.trim().toLowerCase() === termLower ||
      searchInput.trim().toLowerCase() === termLower;

    const needsReload = wasInTunedTerms || wasActiveSingle;

    if (needsReload) {
      skipNextEffectRef.current = true;
      setActiveTunedTerms(nextActiveTuned);
      if (nextActiveTuned.length > 0) {
        const displayStr = nextActiveTuned.join(', ');
        setSearchInput(displayStr);
        setActiveSearch('');
      } else {
        setSearchInput('');
        setActiveSearch('');
      }
      setFeedItems([]);
      seenKeysRef.current.clear();
      seenIdsRef.current.clear();
      refreshCycleRef.current = 0;
    }

    setDismissedSearches(nextDismissed);
    setRecentSearches(nextRecent);
    setProfile(nextProfile);

    AsyncStorage.setItem(
      dismissedSearchesKey,
      JSON.stringify(nextDismissed)
    ).catch(() => {});

    await Promise.allSettled([
      apiClient.delete(
        `/mobile/v1/social/trends/search-history?query=${encodeURIComponent(term)}`
      ),
      persistPreferences(
        selectedTopicIds,
        nextProfile,
        nextRecent,
        selectedTopicIds.length > 0 ||
          Boolean(nextProfile.interests.trim()) ||
          Boolean(nextProfile.work.trim()) ||
          nextRecent.length > 0
      ),
    ]);

    if (needsReload) {
      const nextCombinedInterests = [nextProfile.work, nextProfile.interests, nextProfile.goal]
        .map((v) => String(v || '').trim())
        .filter(Boolean)
        .join(', ');
      fetchFeed({
        page: 1,
        append: false,
        bustCache: true,
        searchOverride: '',
        tunedTermsOverride: nextActiveTuned,
        searchesOverride: nextRecent.filter(
          (s) => !nextDismissed.some((d) => d.toLowerCase() === s.toLowerCase())
        ),
        interestsOverride: nextCombinedInterests,
      });
    }
  };

  const handleClearTunedFilter = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsTunedDismissed(true);
    const clearedProfile: CreatorProfileDraft = {
      work: '',
      interests: '',
      goal: '',
    };
    if (activeSearch || searchInput || activeTunedTerms.length > 0) {
      skipNextEffectRef.current = true;
    }
    setProfile(clearedProfile);
    setActiveSearch('');
    setActiveTunedTerms([]);
    setSearchInput('');
    setFeedItems([]);
    seenKeysRef.current.clear();
    seenIdsRef.current.clear();
    refreshCycleRef.current = 0;

    AsyncStorage.setItem(tunedDismissedKey, 'true').catch(() => {});
    const hasRemaining = selectedTopicIds.length > 0 || recentSearches.length > 0;
    await persistPreferences(selectedTopicIds, clearedProfile, recentSearches, hasRemaining);

    fetchFeed({
      page: 1,
      append: false,
      bustCache: true,
      searchOverride: '',
      tunedTermsOverride: [],
      interestsOverride: '',
    });
  };

  const handleSaveModal = async (
    nextTopics: string[],
    nextProfile: CreatorProfileDraft
  ) => {
    const isTuneMode = interestModalMode === 'tune';
    const roleTerm = String(nextProfile.work || '').trim();
    const customKeywords = String(nextProfile.interests || '').trim();
    const goalTerm = String(nextProfile.goal || '').trim();

    const cleanedProfile: CreatorProfileDraft = {
      work: roleTerm,
      interests: customKeywords,
      goal: goalTerm,
    };

    // Collect role + all comma-separated keywords dynamically so none are ignored
    const newTunedTerms: string[] = [];
    if (isTuneMode) {
      if (roleTerm.length > 1) {
        newTunedTerms.push(roleTerm);
      }
      customKeywords.split(',').forEach((part) => {
        const clean = part.trim().replace(/^#/, '');
        if (clean.length > 1 && !newTunedTerms.some((t) => t.toLowerCase() === clean.toLowerCase())) {
          newTunedTerms.push(clean);
        }
      });
    }

    const updatedSearches =
      newTunedTerms.length > 0
        ? sanitizeRecentSearches([...newTunedTerms, ...recentSearches])
        : recentSearches;

    if (newTunedTerms.length > 0) {
      const lowerNew = new Set(newTunedTerms.map((t) => t.toLowerCase()));
      const nextDismissed = dismissedSearches.filter((d) => !lowerNew.has(d.toLowerCase()));
      if (nextDismissed.length !== dismissedSearches.length) {
        setDismissedSearches(nextDismissed);
        AsyncStorage.setItem(dismissedSearchesKey, JSON.stringify(nextDismissed)).catch(() => {});
      }
      newTunedTerms.forEach((t) => {
        apiClient.post('/mobile/v1/social/trends/search-history', { query: t }).catch(() => {});
      });
    }

    // Activate all tuned terms dynamically (both role + custom keywords) and show them as search chips
    const nextActiveTuned = isTuneMode ? newTunedTerms : [];
    const displaySearchText = nextActiveTuned.length === 1 ? nextActiveTuned[0] : '';

    const detectedFmt = goalTerm ? detectFormatFromGoal(goalTerm) : null;
    const nextFmt = detectedFmt || selectedFormat;
    const willStateTriggerEffect =
      nextFmt !== selectedFormat ||
      JSON.stringify(nextTopics) !== JSON.stringify(selectedTopicIds) ||
      Boolean(activeSearch) ||
      JSON.stringify(nextActiveTuned) !== JSON.stringify(activeTunedTerms) ||
      Boolean(activeTopicFilter);

    if (willStateTriggerEffect) {
      skipNextEffectRef.current = true;
    }

    setInterestModalOpen(false);
    setIsTunedDismissed(false);
    AsyncStorage.removeItem(tunedDismissedKey).catch(() => {});

    setSelectedTopicIds(nextTopics);
    setProfile(cleanedProfile);
    setRecentSearches(updatedSearches);
    setActiveTopicFilter(null);
    setActiveSearch('');
    setActiveTunedTerms(nextActiveTuned);
    setSearchInput(displaySearchText);
    if (detectedFmt && detectedFmt !== selectedFormat) {
      setSelectedFormat(detectedFmt);
    }

    // Reset visible cards so the newly tuned feed loads fresh immediately
    setFeedItems([]);
    seenKeysRef.current.clear();
    seenIdsRef.current.clear();
    refreshCycleRef.current = 0;

    const hasSavedAny =
      nextTopics.length > 0 ||
      Boolean(customKeywords) ||
      Boolean(roleTerm) ||
      Boolean(goalTerm) ||
      updatedSearches.length > 0;

    if (hasSavedAny) {
      autoPromptedOnboardingRef.current = userKey;
      await persistPreferences(nextTopics, cleanedProfile, updatedSearches, true);
    } else {
      AsyncStorage.removeItem(prefsStorageKey).catch(() => {});
    }

    const combinedTuningInterests = [roleTerm, customKeywords, goalTerm]
      .filter(Boolean)
      .join(', ');

    fetchFeed({
      page: 1,
      append: false,
      bustCache: true,
      format: nextFmt,
      topicsOverride: nextTopics,
      searchesOverride: updatedSearches,
      interestsOverride: combinedTuningInterests,
      searchOverride: '',
      tunedTermsOverride: nextActiveTuned,
      topicOverride: null,
    });
  };

  const handleSkipOnboarding = () => {
    // User ne koi topic select nahi kiya -> sirf abhi ke liye close karo; page refresh par dobara show hoga
    setInterestModalOpen(false);
    const hasExistingTopics =
      selectedTopicIds.length > 0 ||
      Boolean(profile.interests.trim()) ||
      Boolean(profile.work.trim()) ||
      recentSearches.length > 0;
    if (!hasExistingTopics) {
      AsyncStorage.removeItem(prefsStorageKey).catch(() => {});
    }
  };

  const handleRefresh = () => {
    if (isFetchingFeed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Keep same topic/search/format/region, advance page + send seen IDs so fresh content loads every tap
    refreshCycleRef.current += 1;
    const targetPage = (refreshCycleRef.current % 5) + 1;
    fetchFeed({
      page: targetPage,
      cursor: targetPage > 1 ? nextCursor : null,
      append: false,
      refresh: true,
    });
  };

  const handleLoadMore = useCallback(() => {
    if (
      isLoadingMore ||
      isFetchingFeed ||
      loadMoreLockRef.current ||
      !hasMoreRef.current ||
      feedItems.length === 0
    ) {
      return;
    }
    loadMoreLockRef.current = true;
    fetchFeed({
      page: currentPage + 1,
      cursor: nextCursor,
      append: true,
    });
  }, [isLoadingMore, isFetchingFeed, feedItems.length, currentPage, nextCursor, fetchFeed]);

  useEffect(() => {
    onRegisterLoadMore?.(handleLoadMore);
    return () => {
      onRegisterLoadMore?.(null);
    };
  }, [handleLoadMore, onRegisterLoadMore]);

  const handleResetAllFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchInput('');
    setActiveSearch('');
    setActiveTopicFilter(null);
    setSelectedFormat('all');
  };

  // Multi-column masonry layout
  const isTablet = width >= 768;
  const numCols = isTablet ? 3 : 2;
  const columns = useMemo(() => {
    const cols: TrendItem[][] = Array.from({ length: numCols }, () => []);
    feedItems.forEach((item, idx) => {
      cols[idx % numCols].push(item);
    });
    return cols;
  }, [feedItems, numCols]);

  const showInitialSkeleton =
    (trendsLoading || isFetchingFeed) && feedItems.length === 0;

  return (
    <View style={styles.container}>
      {/* 1. Single-Row Compact Header & Utility Controls */}
      <View style={styles.titleRow}>
        <Text style={[styles.mainTitle, { color: colors.text }]}>
          Trends
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.headerActionStrip}
          style={styles.headerActionScroll}
        >
          <Pressable
            cssInterop={false}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowRegionModal(true);
            }}
            style={({ pressed }) => [
              styles.actionChip,
              {
                backgroundColor: isDark ? '#252230' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E9EAF1',
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Text style={styles.regionFlag}>{selectedRegion.flag}</Text>
            <Text style={[styles.regionCode, { color: colors.text }]}>
              {selectedRegion.code}
            </Text>
          </Pressable>

          <Pressable
            cssInterop={false}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSavedModalOpen(true);
            }}
            style={({ pressed }) => [
              styles.actionChip,
              {
                backgroundColor: isDark ? '#252230' : '#FFFFFF',
                borderColor:
                  savedTrends.length > 0
                    ? '#E83E91'
                    : isDark
                      ? 'rgba(255,255,255,0.1)'
                      : '#E9EAF1',
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <HugeiconsIcon
              icon={Folder01Icon}
              size={13}
              color={savedTrends.length > 0 ? '#E83E91' : colors.textMuted}
            />
            <Text style={[styles.actionChipText, { color: colors.text }]}>
              Saved ({savedTrends.length})
            </Text>
          </Pressable>

          <Pressable
            cssInterop={false}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setInterestModalMode('tune');
              setInterestModalOpen(true);
            }}
            style={({ pressed }) => [
              styles.actionChip,
              {
                backgroundColor: isTuned
                  ? isDark
                    ? 'rgba(16,185,129,0.16)'
                    : '#ECFDF5'
                  : isDark
                    ? '#252230'
                    : '#FFFFFF',
                borderColor: isTuned
                  ? '#10B981'
                  : isDark
                    ? 'rgba(255,255,255,0.1)'
                    : '#E9EAF1',
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <HugeiconsIcon
              icon={Edit02Icon}
              size={13}
              color={isTuned ? '#10B981' : colors.textMuted}
            />
            <Text
              style={[
                styles.actionChipText,
                { color: isTuned ? '#10B981' : colors.text },
              ]}
            >
              Tune
            </Text>
            {isTuned && <View style={styles.activeDot} />}
          </Pressable>
        </ScrollView>

        <Pressable
          cssInterop={false}
          onPress={handleRefresh}
          disabled={isFetchingFeed}
          accessibilityRole="button"
          accessibilityLabel="Refresh trends"
          style={({ pressed }) => [
            styles.refreshIconBtn,
            {
              backgroundColor: isDark ? '#252230' : '#F4F1FF',
              borderColor: isDark ? 'rgba(112,85,232,0.35)' : '#DDD6FE',
              opacity: pressed ? 0.75 : 1,
              transform: [{ scale: pressed ? 0.94 : 1 }],
            },
          ]}
        >
          {isFetchingFeed && feedItems.length > 0 ? (
            <ActivityIndicator size="small" color="#7055E8" />
          ) : (
            <HugeiconsIcon
              icon={RefreshCwIcon}
              size={15}
              color="#7055E8"
            />
          )}
        </Pressable>
      </View>

      {/* 2. Compact Live Search Bar */}
      <View
        style={[
          styles.searchBarContainer,
          {
            backgroundColor: isDark ? '#1C1A25' : '#FFFFFF',
            borderColor: activeSearch
              ? '#7055E8'
              : isDark
                ? 'rgba(255,255,255,0.1)'
                : '#E9EAF1',
          },
        ]}
      >
        <HugeiconsIcon
          icon={Search01Icon}
          size={15}
          color={activeSearch || activeTunedTerms.length > 0 ? '#7055E8' : colors.textMuted}
        />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search any niche, topic, or #tag..."
          placeholderTextColor={colors.textMuted}
          value={searchInput}
          onChangeText={(txt) => {
            setSearchInput(txt);
            if (!txt.trim() && (activeSearch || activeTunedTerms.length > 0)) {
              setActiveSearch('');
              setActiveTunedTerms([]);
            }
          }}
          returnKeyType="search"
          onSubmitEditing={() => handleExecuteSearch()}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {(searchInput.length > 0 || Boolean(activeSearch) || activeTunedTerms.length > 0) && (
          <Pressable
            cssInterop={false}
            hitSlop={8}
            onPress={handleClearSearch}
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              size={15}
              color={colors.textMuted}
            />
          </Pressable>
        )}
        <Pressable
          cssInterop={false}
          onPress={() => handleExecuteSearch()}
          style={({ pressed }) => [
            styles.searchGoBtn,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={styles.searchGoText}>Search</Text>
        </Pressable>
      </View>

      {/* 3. Format Filter Tabs (7 Web Tabs) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.formatBarContent}
        style={styles.formatBar}
      >
        {FORMAT_TABS.map((tab) => {
          const isActive = selectedFormat === tab.id;
          return (
            <Pressable
              key={tab.id}
              cssInterop={false}
              onPress={() => handleSelectFormat(tab.id)}
              style={({ pressed }) => [
                styles.formatPill,
                {
                  backgroundColor: isActive
                    ? '#7055E8'
                    : isDark
                      ? '#252230'
                      : '#FFFFFF',
                  borderColor: isActive
                    ? '#7055E8'
                    : isDark
                      ? 'rgba(255,255,255,0.09)'
                      : '#E9EAF1',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              {tab.id === 'shorts' ? (
                <YouTubeShortsBrandIcon size={14} withLightHalo={isActive} />
              ) : tab.id === 'pinterest' ? (
                <PinterestBrandIcon size={14} withLightHalo={isActive} />
              ) : null}
              <Text
                style={[
                  styles.formatPillText,
                  { color: isActive ? '#FFFFFF' : colors.text },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 4. Searched Topics & Hot Topics Radar (single sleek bar) */}
      {(visibleSearchedTopics.length > 0 || hotTopics.length > 0) && (
        <View style={styles.hotRadarContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hotRadarScroll}
          >
            {visibleSearchedTopics.map((term) => {
              const termLower = term.toLowerCase();
              const isSelected =
                activeSearch.trim().toLowerCase() === termLower ||
                activeTunedTerms.some((t) => t.toLowerCase() === termLower);
              return (
                <View
                  key={`searched_${term}`}
                  style={[
                    styles.searchedHotChip,
                    {
                      backgroundColor: isSelected
                        ? '#7055E8'
                        : isDark
                          ? '#252230'
                          : '#FFFFFF',
                      borderColor: isSelected
                        ? '#7055E8'
                        : isDark
                          ? 'rgba(112,85,232,0.4)'
                          : '#DDD6FE',
                    },
                  ]}
                >
                  <Pressable
                    cssInterop={false}
                    onPress={() => handleExecuteSearch(term)}
                    style={({ pressed }) => [
                      styles.searchedHotChipTap,
                      { opacity: pressed ? 0.75 : 1 },
                    ]}
                  >
                    <HugeiconsIcon
                      icon={Search01Icon}
                      size={10}
                      color={isSelected ? '#FFFFFF' : '#7055E8'}
                    />
                    <Text
                      style={[
                        styles.hotTopicChipText,
                        { color: isSelected ? '#FFFFFF' : colors.text },
                      ]}
                      numberOfLines={1}
                    >
                      {term}
                    </Text>
                  </Pressable>
                  <Pressable
                    cssInterop={false}
                    hitSlop={6}
                    onPress={() => handleDismissSearchSuggestion(term)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove search ${term}`}
                    style={({ pressed }) => [{ opacity: pressed ? 0.65 : 1 }]}
                  >
                    <HugeiconsIcon
                      icon={Cancel01Icon}
                      size={11}
                      color={isSelected ? '#E0E7FF' : colors.textMuted}
                    />
                  </Pressable>
                </View>
              );
            })}

            {hotTopics.length > 0 && (
              <View
                style={[
                  styles.hotRadarLabel,
                  { backgroundColor: isDark ? '#252230' : '#FEF2F2' },
                ]}
              >
                <HugeiconsIcon icon={Activity01Icon} size={12} color="#EF4444" />
                <Text style={styles.hotRadarLabelText}>TRENDING</Text>
              </View>
            )}
            {hotTopics.map((topic, idx) => (
              <Pressable
                key={`${topic.query}_${idx}`}
                cssInterop={false}
                onPress={() => handleExecuteSearch(topic.query)}
                style={({ pressed }) => [
                  styles.hotTopicChip,
                  {
                    backgroundColor: isDark ? '#1C1A25' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E9EAF1',
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Text
                  style={[styles.hotTopicChipText, { color: colors.text }]}
                  numberOfLines={1}
                >
                  #{topic.query.replace(/^#/, '')}
                </Text>
                {Boolean(topic.volume) && (
                  <Text style={styles.hotTopicVol}>{String(topic.volume)}</Text>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 5. Content Area (Skeleton / Grid / Empty) */}
      {showInitialSkeleton ? (
        <TrendGridSkeleton isDark={isDark} />
      ) : feedItems.length === 0 ? (
        <View
          style={[
            styles.emptyBox,
            {
              backgroundColor: isDark ? '#1C1A25' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E9EAF1',
            },
          ]}
        >
          <HugeiconsIcon
            icon={TelescopeIcon}
            size={36}
            color={colors.textMuted}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No trends matched right now
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
            Try switching region, clearing active search, or exploring All Trends.
          </Text>
          <Pressable
            cssInterop={false}
            onPress={handleResetAllFilters}
            style={({ pressed }) => [
              styles.resetBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.resetBtnText}>Reset All Filters</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.feedWrapper}>
          <View style={styles.masonryContainer}>
            {columns.map((colItems, colIndex) => (
              <View key={colIndex} style={styles.masonryColumn}>
                {colItems.map((trend, idx) => (
                  <TrendCard
                    key={trend.id || `${colIndex}_${idx}`}
                    trend={trend}
                    index={colIndex + idx * numCols}
                    isSaved={savedIds.has(trend.id)}
                    onToggleSave={toggleSave}
                    onPressCard={(item) => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedTrend(item);
                    }}
                    onUseIdea={onUseTrendInPost}
                    onRemix={(item) => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setRemixTrend(item);
                    }}
                    isDark={isDark}
                  />
                ))}
              </View>
            ))}
          </View>

          {/* Auto-fetch Scroll Footer */}
          {isLoadingMore ? (
            <View style={styles.autoLoadFooter}>
              <ActivityIndicator size="small" color="#7055E8" />
              <Text style={[styles.autoLoadText, { color: colors.textMuted }]}>
                Loading more trends...
              </Text>
            </View>
          ) : !hasMoreTrends && feedItems.length > 0 ? (
            <View style={styles.autoLoadFooter}>
              <Text style={[styles.autoLoadText, { color: colors.textMuted }]}>
                You&apos;re caught up on this feed
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Region Selector Modal */}
      <Modal
        visible={showRegionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRegionModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            cssInterop={false}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={() => setShowRegionModal(false)}
          />
          <View
            style={[
              styles.regionModalBox,
              {
                backgroundColor: isDark ? '#1C1A25' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E9EAF1',
              },
            ]}
          >
            <Text style={[styles.regionModalTitle, { color: colors.text }]}>
              Select Trend Region
            </Text>
            {REGION_OPTIONS.map((reg) => {
              const isSelected = reg.code === selectedRegion.code;
              return (
                <Pressable
                  key={reg.code}
                  cssInterop={false}
                  onPress={() => handleSelectRegion(reg)}
                  style={({ pressed }) => [
                    styles.regionOptionRow,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? 'rgba(112,85,232,0.18)'
                          : '#F0ECFF'
                        : 'transparent',
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <Text style={styles.regionOptionFlag}>{reg.flag}</Text>
                  <Text
                    style={[
                      styles.regionOptionLabel,
                      {
                        color: isSelected ? '#7055E8' : colors.text,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {reg.label}
                  </Text>
                  {isSelected && (
                    <HugeiconsIcon
                      icon={CheckmarkCircle01Icon}
                      size={18}
                      color="#7055E8"
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* Trend Detail Sheet */}
      <TrendDetailModal
        visible={selectedTrend !== null}
        trend={selectedTrend}
        onClose={() => setSelectedTrend(null)}
        onUseIdea={onUseTrendInPost}
        onRemix={(item) => setRemixTrend(item)}
        isSaved={selectedTrend ? savedIds.has(selectedTrend.id) : false}
        onToggleSave={toggleSave}
        isDark={isDark}
      />

      {/* AI Trend Remix Studio Modal */}
      <TrendRemixModal
        visible={remixTrend !== null}
        trend={remixTrend}
        onClose={() => setRemixTrend(null)}
        onSendToComposer={({ caption, mediaUrl, trend }) => {
          onUseTrendInPost({
            ...trend,
            title: undefined,
            caption,
            full_image_url: mediaUrl || trend.full_image_url,
            thumbnail_url: mediaUrl || trend.thumbnail_url,
          });
        }}
        isDark={isDark}
      />

      {/* Saved Inspiration Board Modal */}
      <SavedIdeasModal
        visible={savedModalOpen}
        savedPosts={savedTrends}
        onClose={() => setSavedModalOpen(false)}
        onRemove={removeSaved}
        onClearAll={clearAllSaved}
        onRemix={(item) => setRemixTrend(item)}
        onCompose={onUseTrendInPost}
        isDark={isDark}
      />

      {/* Creator Onboarding Topics & Tune Feed Modal */}
      <CreatorInterestModal
        visible={interestModalOpen}
        mode={interestModalMode}
        initialTopicIds={selectedTopicIds}
        initialProfile={profile}
        onSave={handleSaveModal}
        onSkip={handleSkipOnboarding}
        onClose={() => setInterestModalOpen(false)}
        onClearTune={handleClearTunedFilter}
        onSwitchMode={(mode) => setInterestModalMode(mode)}
        isDark={isDark}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 7,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  mainTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  regionFlag: {
    fontSize: 12,
  },
  regionCode: {
    fontSize: 11,
    fontWeight: '700',
  },
  headerActionScroll: {
    flex: 1,
    minWidth: 0,
  },
  headerActionStrip: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    gap: 5,
    alignItems: 'center',
    paddingRight: 2,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    height: 29,
    paddingHorizontal: 7,
    borderRadius: 9,
    borderWidth: 1,
  },
  refreshIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    paddingLeft: 11,
    paddingRight: 5,
    gap: 7,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    height: '100%',
    borderWidth: 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        outlineWidth: 0,
        boxShadow: 'none',
      } as any,
    }),
  },
  searchGoBtn: {
    backgroundColor: '#7055E8',
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchGoText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  formatBar: {
    maxHeight: 32,
  },
  formatBarContent: {
    gap: 6,
    paddingRight: 8,
  },
  formatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 30,
    paddingHorizontal: 11,
    borderRadius: 10,
    borderWidth: 1,
  },
  formatPillText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  hotRadarContainer: {
    marginTop: 0,
  },
  hotRadarScroll: {
    gap: 6,
    alignItems: 'center',
    paddingRight: 8,
  },
  hotRadarLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },
  hotRadarLabelText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#EF4444',
    letterSpacing: 0.4,
  },
  hotTopicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchedHotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingLeft: 8,
    paddingRight: 7,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchedHotChipTap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hotTopicChipText: {
    fontSize: 11,
    fontWeight: '600',
    maxWidth: 130,
  },
  hotTopicVol: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#10B981',
  },
  topicsRailWrapper: {
    marginTop: 0,
  },
  topicsRailScroll: {
    gap: 6,
    alignItems: 'center',
    paddingRight: 8,
  },
  railPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 9,
    borderWidth: 1,
  },
  railDismissablePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingLeft: 9,
    paddingRight: 7,
    paddingVertical: 4.5,
    borderRadius: 9,
    borderWidth: 1,
  },
  railSearchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 140,
  },
  railPillText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  tunedRailText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#059669',
    maxWidth: 160,
  },
  feedWrapper: {
    gap: 14,
  },
  masonryContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  masonryColumn: {
    flex: 1,
    gap: 10,
  },
  autoLoadFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  autoLoadText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyBox: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  emptyDesc: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
  },
  resetBtn: {
    marginTop: 8,
    backgroundColor: '#7055E8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  regionModalBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  regionModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  regionOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
  },
  regionOptionFlag: {
    fontSize: 18,
  },
  regionOptionLabel: {
    flex: 1,
    fontSize: 14,
  },
});
