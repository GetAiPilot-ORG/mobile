import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowRight01Icon,
  SparklesIcon,
  ZapIcon,
} from '@hugeicons/core-free-icons';
import * as Haptics from 'expo-haptics';
import { soundService } from '../../services/soundFeedbackService';
import { ProductCenterArtwork } from './ProductCenterArtworks';
import { ProductBottomEnvironment } from './ProductBottomEnvironment';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Dribbble Peeking Deck Geometry: Tall, high-impact vertical card
const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.78, 292);
const CARD_HEIGHT = 388;
const CARD_GAP = 14;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP + 16;
// Centering padding so side cards peek symmetrically
const SIDE_PADDING = (SCREEN_WIDTH - CARD_WIDTH) / 2;

interface FeedItem {
  iconEmoji: string;
  badgeBg: string;
  title: string;
  text: string;
  statBadge: string;
  statBadgeColor: string;
}

interface ProductShowcaseCard {
  id: string;
  title: string;
  subtitle: string;
  liveStatus: string;
  image: any;
  route: string;
  headerGradient: readonly [string, string];
  buttonGradient: readonly [string, string];
  accent: string;
  cardBorderLight: string;
  cardBorderDark: string;
  cardShadowColor: string;
  ctaText: string;
  feedItems: FeedItem[];
}

const SHOWCASE_PRODUCTS: ProductShowcaseCard[] = [
  {
    id: 'telegram',
    title: 'TELEGRAM PILOT',
    subtitle: 'Auto-Forward & Multi-Bot Hub',
    liveStatus: 'LIVE RELAY ACTIVE',
    image: require('../../../assets/images/products/telegram.png'),
    route: '/products/telegram',
    headerGradient: ['#0077B6', '#0096C7'] as const,
    buttonGradient: ['#0077B6', '#0284C7'] as const,
    accent: '#0284C7',
    cardBorderLight: 'rgba(2, 132, 199, 0.28)',
    cardBorderDark: 'rgba(56, 189, 248, 0.36)',
    cardShadowColor: '#0284C7',
    ctaText: 'Launch Telegram Pilot',
    feedItems: [
      {
        iconEmoji: '⚡',
        badgeBg: 'rgba(2, 132, 199, 0.14)',
        title: 'Channel Feed Relay',
        text: 'Relayed 14 media posts to 8 VIP channels in 118ms.',
        statBadge: '<120ms Sync',
        statBadgeColor: '#0284C7',
      },
      {
        iconEmoji: '🔥',
        badgeBg: 'rgba(249, 115, 22, 0.14)',
        title: 'Emoji Reaction Trigger',
        text: 'Reaction detected → Automated VIP coupon dispatched.',
        statBadge: 'Instant DM',
        statBadgeColor: '#F97316',
      },
      {
        iconEmoji: '📊',
        badgeBg: 'rgba(16, 185, 129, 0.14)',
        title: 'Channel Network Uptime',
        text: '2,490 active subscribers connected with zero downtime.',
        statBadge: '100% Uptime',
        statBadgeColor: '#10B981',
      },
    ],
  },
  {
    id: 'whatsapp',
    title: 'WHATSAPP CLOUD',
    subtitle: 'Meta Cloud API & Mass Broadcasts',
    liveStatus: 'OFFICIAL API LIVE',
    image: require('../../../assets/images/products/whatsapp.png'),
    route: '/products/whatsapp',
    headerGradient: ['#0F766E', '#10B981'] as const,
    buttonGradient: ['#0F766E', '#059669'] as const,
    accent: '#059669',
    cardBorderLight: 'rgba(16, 185, 129, 0.28)',
    cardBorderDark: 'rgba(52, 211, 153, 0.36)',
    cardShadowColor: '#10B981',
    ctaText: 'Open WhatsApp Cloud',
    feedItems: [
      {
        iconEmoji: '📢',
        badgeBg: 'rgba(16, 185, 129, 0.14)',
        title: 'Mass Template Broadcast',
        text: 'Delivered "VIP Early Access" campaign to 4,200 leads.',
        statBadge: '99.4% Read',
        statBadgeColor: '#059669',
      },
      {
        iconEmoji: '🤖',
        badgeBg: 'rgba(14, 165, 233, 0.14)',
        title: '24/7 Conversational AI',
        text: 'Customer: "Book consultation" → Confirmed for 3:00 PM.',
        statBadge: 'Auto-Booked',
        statBadgeColor: '#0284C7',
      },
      {
        iconEmoji: '🔄',
        badgeBg: 'rgba(139, 92, 246, 0.14)',
        title: 'CRM Lead Sync Engine',
        text: 'New contacts auto-created with lead score in pipeline.',
        statBadge: 'Realtime Sync',
        statBadgeColor: '#7C3AED',
      },
    ],
  },
  {
    id: 'voice',
    title: 'VOICE AI AGENTS',
    subtitle: 'Autonomous Speech & Calling',
    liveStatus: 'NEURAL STREAM READY',
    image: require('../../../assets/images/products/voice.png'),
    route: '/products/voice',
    headerGradient: ['#5B21B6', '#7C3AED'] as const,
    buttonGradient: ['#5B21B6', '#7C3AED'] as const,
    accent: '#7E22CE',
    cardBorderLight: 'rgba(147, 51, 234, 0.28)',
    cardBorderDark: 'rgba(192, 132, 252, 0.36)',
    cardShadowColor: '#9333EA',
    ctaText: 'Deploy Voice AI Agent',
    feedItems: [
      {
        iconEmoji: '📞',
        badgeBg: 'rgba(147, 51, 234, 0.14)',
        title: 'Inbound Reception Call',
        text: 'AI answered, answered custom FAQs and booked calendar.',
        statBadge: '1m 58s Call',
        statBadgeColor: '#7E22CE',
      },
      {
        iconEmoji: '🎙️',
        badgeBg: 'rgba(236, 72, 153, 0.14)',
        title: 'Neural Speech Stream',
        text: 'Human-like conversational audio streaming under 280ms.',
        statBadge: '<280ms Latency',
        statBadgeColor: '#DB2777',
      },
      {
        iconEmoji: '↗️',
        badgeBg: 'rgba(16, 185, 129, 0.14)',
        title: 'Live Agent Transfer',
        text: 'Warm transfer connected VIP enterprise client seamlessly.',
        statBadge: 'Live Transfer',
        statBadgeColor: '#059669',
      },
    ],
  },
  {
    id: 'crm',
    title: 'SMART CRM',
    subtitle: 'Pipelines & Deal Funnels',
    liveStatus: 'PIPELINES ACTIVE',
    image: require('../../../assets/images/products/crm.png'),
    route: '/products/crm',
    headerGradient: ['#B45309', '#D97706'] as const,
    buttonGradient: ['#B45309', '#D97706'] as const,
    accent: '#D97706',
    cardBorderLight: 'rgba(245, 158, 11, 0.28)',
    cardBorderDark: 'rgba(251, 191, 36, 0.36)',
    cardShadowColor: '#F59E0B',
    ctaText: 'Open Smart CRM',
    feedItems: [
      {
        iconEmoji: '🏆',
        badgeBg: 'rgba(245, 158, 11, 0.14)',
        title: 'Deal Won: Enterprise',
        text: 'Acme Corp moved to "Closed Won" → $18,500 contract.',
        statBadge: '+$18.5k Won',
        statBadgeColor: '#D97706',
      },
      {
        iconEmoji: '📈',
        badgeBg: 'rgba(2, 132, 199, 0.14)',
        title: 'Pipeline Velocity',
        text: '28 active opportunities in stage ($94,500 total volume).',
        statBadge: '4.2d Cycle',
        statBadgeColor: '#0284C7',
      },
      {
        iconEmoji: '⏰',
        badgeBg: 'rgba(16, 185, 129, 0.14)',
        title: 'Automated Follow-Up',
        text: 'Day-3 personalized proposal follow-up scheduled.',
        statBadge: 'Tomorrow 9AM',
        statBadgeColor: '#059669',
      },
    ],
  },
  {
    id: 'social',
    title: 'SOCIAL PILOT',
    subtitle: 'Cross-Platform Auto-Poster',
    liveStatus: 'AUTO-QUEUE READY',
    image: require('../../../assets/images/products/social.png'),
    route: '/products/social',
    headerGradient: ['#9D174D', '#BE185D'] as const,
    buttonGradient: ['#9D174D', '#DB2777'] as const,
    accent: '#DB2777',
    cardBorderLight: 'rgba(236, 72, 153, 0.28)',
    cardBorderDark: 'rgba(244, 114, 182, 0.36)',
    cardShadowColor: '#EC4899',
    ctaText: 'Schedule Posts Now',
    feedItems: [
      {
        iconEmoji: '🚀',
        badgeBg: 'rgba(236, 72, 153, 0.14)',
        title: 'Multi-Network Post',
        text: 'Simultaneously published reel to IG, X, LinkedIn & TikTok.',
        statBadge: '4 Channels',
        statBadgeColor: '#DB2777',
      },
      {
        iconEmoji: '📅',
        badgeBg: 'rgba(139, 92, 246, 0.14)',
        title: 'Unified Content Queue',
        text: '16 viral posts scheduled across all business channels.',
        statBadge: 'Today 3:30PM',
        statBadgeColor: '#7C3AED',
      },
      {
        iconEmoji: '📈',
        badgeBg: 'rgba(16, 185, 129, 0.14)',
        title: 'Engagement Growth',
        text: '+42.5% reach and 18,200 impressions over the last 7 days.',
        statBadge: '+42.5% Reach',
        statBadgeColor: '#059669',
      },
    ],
  },
];

interface ShowcaseCardItemProps {
  prod: ProductShowcaseCard;
  index: number;
  scrollX: Animated.Value;
  isDark: boolean;
  onOpen: (route: string) => void;
}

function ShowcaseCardItem({
  prod,
  index,
  scrollX,
  isDark,
  onOpen,
}: ShowcaseCardItemProps) {
  // Independent spring compression on touch
  const pressScale = useRef(new Animated.Value(1)).current;

  // Pulsing live radar dot
  const radarPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(radarPulse, {
          toValue: 1.6,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(radarPulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [radarPulse]);

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 250,
      friction: 12,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 250,
      friction: 12,
    }).start();
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onOpen(prod.route);
  };

  const inputRange = [
    (index - 1) * SNAP_INTERVAL,
    index * SNAP_INTERVAL,
    (index + 1) * SNAP_INTERVAL,
  ];

  // Dynamic scale: Center card is 1.0, side cards scale down to 0.92
  const scrollScale = scrollX.interpolate({
    inputRange,
    outputRange: [0.92, 1.0, 0.92],
    extrapolate: 'clamp',
  });

  // Soft elevation lift
  const translateY = scrollX.interpolate({
    inputRange,
    outputRange: [10, 0, 10],
    extrapolate: 'clamp',
  });

  // Side cards soften slightly in opacity
  const opacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.75, 1.0, 0.75],
    extrapolate: 'clamp',
  });

  const finalScale = Animated.multiply(scrollScale, pressScale);
  const borderColor = isDark ? prod.cardBorderDark : prod.cardBorderLight;

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          transform: [{ scale: finalScale }, { translateY }],
          opacity,
        },
      ]}
    >
      {/* Tappable whole-card container with tactile physics */}
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${prod.title}: Tap to launch ${prod.subtitle}`}
        style={[
          styles.deckCard,
          {
            backgroundColor: isDark ? '#14151F' : '#FFFFFF',
            borderColor,
            shadowColor: prod.cardShadowColor,
            shadowOpacity: isDark ? 0.38 : 0.16,
          },
        ]}
      >
        {/* 1. Header Banner with 3D Logo & Live Radar Signal */}
        <LinearGradient
          colors={prod.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardHeaderBanner}
        >
          {/* Specular gloss highlight */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.35)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.6, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.headerLeft}>
            {/* 3D Elevated Logo Orb */}
            <View style={styles.headerIconContainer}>
              <Image
                source={prod.image}
                style={styles.headerImage}
                resizeMode="contain"
              />
            </View>

            {/* Title & Subtitle */}
            <View style={styles.headerTextCol}>
              <Text numberOfLines={1} style={styles.headerTitleText}>
                {prod.title}
              </Text>
              <Text numberOfLines={1} style={styles.headerSubtitleText}>
                {prod.subtitle}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Crystal Clear Center Vector Artwork (No Background, Infinitely Sharp) */}
        <View style={styles.centerWatermarkContainer} pointerEvents="none">
          <ProductCenterArtwork
            productId={prod.id}
            size={220}
            opacity={isDark ? 0.22 : 0.14}
          />
        </View>

        {/* 2. Feed-Style Live Telemetry Feed (3 items) */}
        <View style={styles.cardBody}>
          {prod.feedItems.map((item, itemIdx) => (
            <View key={itemIdx} style={styles.feedRow}>
              {/* Emoji Badge Icon */}
              <View
                style={[styles.feedIconBadge, { backgroundColor: item.badgeBg }]}
              >
                <Text style={styles.feedIconEmoji}>{item.iconEmoji}</Text>
              </View>

              {/* Feed Content */}
              <View style={styles.feedContentCol}>
                <View style={styles.feedTitleRow}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.feedItemTitle,
                      { color: isDark ? '#FFFFFF' : '#0F172A' },
                    ]}
                  >
                    {item.title}
                  </Text>
                  {/* Micro Metric Badge */}
                  <View
                    style={[
                      styles.statBadgePill,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.04)',
                        borderColor: isDark
                          ? 'rgba(255, 255, 255, 0.12)'
                          : 'rgba(0, 0, 0, 0.08)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statBadgeText,
                        { color: item.statBadgeColor },
                      ]}
                    >
                      {item.statBadge}
                    </Text>
                  </View>
                </View>

                <Text
                  numberOfLines={2}
                  style={[
                    styles.feedItemText,
                    { color: isDark ? 'rgba(241, 245, 249, 0.78)' : '#475569' },
                  ]}
                >
                  {item.text}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* 3. Contextual Environmental Bottom Stage */}
        <ProductBottomEnvironment
          productId={prod.id}
          accent={prod.accent}
          isDark={isDark}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

interface ProductCardCarouselProps {
  isDark: boolean;
  onOpen: (route: string) => void;
  sectionHeader?: React.ReactNode;
}

export function ProductCardCarousel({
  isDark,
  onOpen,
  sectionHeader,
}: ProductCardCarouselProps) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<any>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isUserInteracting = useRef(false);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-scroll loop
  useEffect(() => {
    const timer = setInterval(() => {
      if (isUserInteracting.current || !scrollViewRef.current) return;

      setActiveIndex((prev) => {
        const next = (prev + 1) % SHOWCASE_PRODUCTS.length;
        scrollViewRef.current?.scrollTo({
          x: next * SNAP_INTERVAL,
          animated: true,
        });
        return next;
      });
    }, 5500);

    return () => clearInterval(timer);
  }, []);

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleScrollBeginDrag = () => {
    isUserInteracting.current = true;
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
  };

  const handleScrollEndDrag = () => {
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => {
      isUserInteracting.current = false;
    }, 4000);
  };

  const scrollToCard = (index: number) => {
    triggerHaptic();
    isUserInteracting.current = true;
    setActiveIndex(index);
    scrollViewRef.current?.scrollTo({
      x: index * SNAP_INTERVAL,
      animated: true,
    });
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => {
      isUserInteracting.current = false;
    }, 4000);
  };

  return (
    <View style={styles.container}>
      {/* Dribbble Peeking Deck Showcase */}
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        snapToAlignment="start"
        scrollEventThrottle={16}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          {
            useNativeDriver: true,
            listener: (e: any) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const idx = Math.round(offsetX / SNAP_INTERVAL);
              if (
                idx >= 0 &&
                idx < SHOWCASE_PRODUCTS.length &&
                idx !== activeIndex
              ) {
                setActiveIndex(idx);
              }
            },
          }
        )}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: SIDE_PADDING },
        ]}
      >
        {SHOWCASE_PRODUCTS.map((prod, index) => (
          <ShowcaseCardItem
            key={prod.id}
            prod={prod}
            index={index}
            scrollX={scrollX}
            isDark={isDark}
            onOpen={onOpen}
          />
        ))}
      </Animated.ScrollView>

      {/* Floating Pill Pagination Indicator */}
      <View style={styles.paginationCenter}>
        <View
          style={[
            styles.floatingPill,
            {
              backgroundColor: isDark ? '#1C1D2A' : '#0F172A',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          {SHOWCASE_PRODUCTS.map((prod, idx) => {
            const isActive = idx === activeIndex;
            return (
              <TouchableOpacity
                key={prod.id}
                hitSlop={6}
                onPress={() => scrollToCard(idx)}
                accessibilityRole="button"
                accessibilityLabel={`View ${prod.title}`}
                style={[
                  styles.pillDot,
                  {
                    width: isActive ? 20 : 6,
                    backgroundColor: isActive
                      ? '#FFFFFF'
                      : 'rgba(255, 255, 255, 0.35)',
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  scrollContent: {
    paddingVertical: 12,
    gap: CARD_GAP,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT + 40
  },
  deckCard: {
    width: '100%',
    height: CARD_HEIGHT,
    borderRadius: 24,
    borderWidth: 0.1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
    justifyContent: 'space-between',
  },
  centerWatermarkContainer: {
    position: 'absolute',
    top: 60,
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  centerWatermarkImage: {
    width: 200,
    height: 200,
  },
  cardHeaderBanner: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconContainer: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',

  },
  headerImage: {
    width: 50,
    height: 50,
  },
  headerTextCol: {
    flex: 1,
    gap: 1,
  },
  headerTitleText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: '#FFFFFF',
  },
  headerSubtitleText: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: -0.1,
    color: 'rgba(255, 255, 255, 0.88)',
  },
  liveRadarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  radarDotWrapper: {
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarPulseRing: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34D399',
    opacity: 0.5,
  },
  radarCenterDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#34D399',
  },
  liveRadarText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'space-around',
    gap: 10,
    zIndex: 2,
  },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  feedIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  feedIconEmoji: {
    fontSize: 14,
  },
  feedContentCol: {
    flex: 1,
    gap: 2,
  },
  feedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  feedItemTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: -0.15,
    flex: 1,
  },
  statBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.8,
  },
  statBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  feedItemText: {
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: -0.1,
  },
  cardFooter: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 4,
  },
  magneticCtaButton: {
    borderRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  ctaButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  ctaArrowCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  floatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  pillDot: {
    height: 6,
    borderRadius: 3,
  },
});
