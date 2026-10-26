import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';

interface ToolItem {
  id: string;
  name: string;
  desc: string;
  category: string;
  badge: string;
  icon: keyof typeof Ionicons.glyphMap;
  image?: any;
  route: string;
  gradientLight: readonly [string, string];
  gradientDark: readonly [string, string];
  borderColorLight: string;
  borderColorDark: string;
  accentLight: string;
  accentDark: string;
  badgeBgLight: string;
  badgeBgDark: string;
  shadowColor: string;
}

const TOOLS_CONFIG: ToolItem[] = [
  {
    id: 'qr',
    name: 'QR Generator',
    desc: 'Custom branded vectors & trackable logos',
    category: 'BRANDING',
    badge: 'FREE',
    icon: 'qr-code',
    image: require('../../../assets/icons/QR-code.png'),
    route: '/tools/qr-code',
    gradientLight: ['#F3E8FF', '#E9D5FF'] as const,
    gradientDark: ['#281442', '#180B28'] as const,
    borderColorLight: 'rgba(147, 51, 234, 0.25)',
    borderColorDark: 'rgba(192, 132, 252, 0.28)',
    accentLight: '#7E22CE',
    accentDark: '#C084FC',
    badgeBgLight: 'rgba(147, 51, 234, 0.12)',
    badgeBgDark: 'rgba(192, 132, 252, 0.22)',
    shadowColor: '#9333EA',
  },
  {
    id: 'links',
    name: 'Link Shortener',
    desc: 'Custom slugs with real-time click analytics',
    category: 'ANALYTICS',
    badge: 'POPULAR',
    icon: 'link',
    image: require('../../../assets/icons/link-shortner.png'),
    route: '/tools/link-shortener',
    gradientLight: ['#E0F2FE', '#BAE6FD'] as const,
    gradientDark: ['#082F49', '#041C2C'] as const,
    borderColorLight: 'rgba(2, 132, 199, 0.25)',
    borderColorDark: 'rgba(56, 189, 248, 0.28)',
    accentLight: '#0284C7',
    accentDark: '#38BDF8',
    badgeBgLight: 'rgba(2, 132, 199, 0.12)',
    badgeBgDark: 'rgba(56, 189, 248, 0.22)',
    shadowColor: '#0284C7',
  },
  {
    id: 'bio',
    name: 'Bio Builder',
    desc: 'Mobile bio link landing pages & templates',
    category: 'PAGES',
    badge: 'FREE',
    icon: 'phone-portrait',
    image: require('../../../assets/icons/bio-template.png'),
    route: '/tools/bio-templates',
    gradientLight: ['#FDF2F8', '#FBCFE8'] as const,
    gradientDark: ['#3D122B', '#240A1A'] as const,
    borderColorLight: 'rgba(236, 72, 153, 0.25)',
    borderColorDark: 'rgba(244, 114, 182, 0.28)',
    accentLight: '#DB2777',
    accentDark: '#F472B6',
    badgeBgLight: 'rgba(236, 72, 153, 0.12)',
    badgeBgDark: 'rgba(244, 114, 182, 0.22)',
    shadowColor: '#EC4899',
  },
  {
    id: 'forms',
    name: 'QuickForms',
    desc: 'High-converting conversational intake funnels',
    category: 'CONVERSIONS',
    badge: 'NEW',
    icon: 'document-text',
    image: require('../../../assets/icons/quick-form.png'),
    route: '/tools/quick-forms',
    gradientLight: ['#ECFDF5', '#A7F3D0'] as const,
    gradientDark: ['#063323', '#031F15'] as const,
    borderColorLight: 'rgba(16, 185, 129, 0.25)',
    borderColorDark: 'rgba(52, 211, 153, 0.28)',
    accentLight: '#059669',
    accentDark: '#34D399',
    badgeBgLight: 'rgba(16, 185, 129, 0.12)',
    badgeBgDark: 'rgba(52, 211, 153, 0.22)',
    shadowColor: '#10B981',
  },
  {
    id: 'speech',
    name: 'Speech to Text',
    desc: 'AI audio transcription & voice streaming',
    category: 'AI AUDIO',
    badge: 'AI PRO',
    icon: 'volume-high',
    image: require('../../../assets/icons/ai-speech.png'),
    route: '/tools/speech-to-text',
    gradientLight: ['#FAF5FF', '#E9D5FF'] as const,
    gradientDark: ['#2E1065', '#1B093D'] as const,
    borderColorLight: 'rgba(139, 92, 246, 0.25)',
    borderColorDark: 'rgba(167, 139, 250, 0.28)',
    accentLight: '#7C3AED',
    accentDark: '#A78BFA',
    badgeBgLight: 'rgba(139, 92, 246, 0.12)',
    badgeBgDark: 'rgba(167, 139, 250, 0.22)',
    shadowColor: '#8B5CF6',
  },
  {
    id: 'audit',
    name: 'Website Audit',
    desc: 'SEO, Core Web Vitals & performance scores',
    category: 'SEO SCORE',
    badge: 'FREE',
    icon: 'speedometer',
    image: require('../../../assets/icons/file-linker.png'),
    route: '/tools/website-audit',
    gradientLight: ['#FFFBEB', '#FDE68A'] as const,
    gradientDark: ['#3D2C06', '#251A03'] as const,
    borderColorLight: 'rgba(245, 158, 11, 0.25)',
    borderColorDark: 'rgba(251, 191, 36, 0.28)',
    accentLight: '#D97706',
    accentDark: '#FBBF24',
    badgeBgLight: 'rgba(245, 158, 11, 0.12)',
    badgeBgDark: 'rgba(251, 191, 36, 0.22)',
    shadowColor: '#F59E0B',
  },
];

const CARD_WIDTH = 236;
const CARD_GAP = 12;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

interface AnimatedCreateSectionProps {
  isDark: boolean;
  onOpen: (route: string) => void;
  sectionHeader: React.ReactNode;
}

export function AnimatedCreateSection({
  isDark,
  onOpen,
  sectionHeader,
}: AnimatedCreateSectionProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isUserDragging = useRef(false);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subtle auto-sliding timer (every 4 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      if (isUserDragging.current || !scrollViewRef.current) return;

      setActiveIndex((prev) => {
        const next = (prev + 1) % TOOLS_CONFIG.length;
        scrollViewRef.current?.scrollTo({
          x: next * SNAP_INTERVAL,
          animated: true,
        });
        return next;
      });
    }, 4200);

    return () => clearInterval(timer);
  }, []);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SNAP_INTERVAL);
    if (index >= 0 && index < TOOLS_CONFIG.length && index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const handleScrollBeginDrag = () => {
    isUserDragging.current = true;
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
  };

  const handleScrollEndDrag = () => {
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => {
      isUserDragging.current = false;
    }, 3000);
  };

  const scrollToCard = (index: number) => {
    isUserDragging.current = true;
    setActiveIndex(index);
    scrollViewRef.current?.scrollTo({
      x: index * SNAP_INTERVAL,
      animated: true,
    });
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => {
      isUserDragging.current = false;
    }, 3000);
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      {sectionHeader}

      {/* Horizontal Carousel */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        snapToAlignment="start"
        onScroll={handleScroll}
        scrollEventThrottle={32}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleScroll}
        contentContainerStyle={styles.scrollContent}
      >
        {TOOLS_CONFIG.map((tool, index) => {
          const accent = isDark ? tool.accentDark : tool.accentLight;
          const badgeBg = isDark ? tool.badgeBgDark : tool.badgeBgLight;
          const borderColor = isDark ? tool.borderColorDark : tool.borderColorLight;
          const gradientColors = isDark ? tool.gradientDark : tool.gradientLight;

          return (
            <Pressable
              key={tool.id}
              cssInterop={false}
              onPress={() => onOpen(tool.route)}
              accessibilityRole="button"
              accessibilityLabel={`${tool.name}: ${tool.desc}`}
              style={({ pressed }) => [
                styles.card,
                {
                  borderColor: borderColor,
                  shadowColor: tool.shadowColor,
                  shadowOpacity: isDark ? 0.35 : 0.12,
                  shadowOffset: { width: 0, height: 4 },
                  shadowRadius: 10,
                  elevation: 3,
                  transform: [{ scale: pressed ? 0.975 : 1 }],
                },
              ]}
            >
              {/* 1. Dynamic Gradient Surface */}
              <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              {/* 2. Glass Specular Highlight */}
              <LinearGradient
                colors={
                  isDark
                    ? ['rgba(255, 255, 255, 0.08)', 'transparent']
                    : ['rgba(255, 255, 255, 0.65)', 'transparent']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 0.6, y: 0.55 }}
                style={StyleSheet.absoluteFill}
              />

              {/* 3. Watermark Graphic in Corner */}
              <View
                style={{
                  position: 'absolute',
                  right: -10,
                  bottom: -10,
                  opacity: isDark ? 0.22 : 0.12,
                  transform: [{ rotate: '-12deg' }],
                }}
                pointerEvents="none"
              >
                {tool.image ? (
                  <Image source={tool.image} style={{ width: 68, height: 68 }} resizeMode="contain" />
                ) : (
                  <Ionicons name={tool.icon} size={74} color={accent} />
                )}
              </View>

              {/* 4. Card Content */}
              <View style={styles.cardContent}>
                {/* Top Row: Elevated Icon + Badge + Arrow */}
                <View style={styles.topRow}>
                  {/* Icon Badge with gentle pastel accent */}
                  <View
                    style={[
                      styles.iconBadge,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.14)'
                          : '#FFFFFF',
                        borderColor: isDark
                          ? 'rgba(255, 255, 255, 0.18)'
                          : 'rgba(255, 255, 255, 0.9)',
                        shadowColor: '#000000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: isDark ? 0 : 0.08,
                        shadowRadius: 4,
                        elevation: 2,
                      },
                    ]}
                  >
                    <Ionicons name={tool.icon} size={20} color={accent} />
                  </View>

                  {/* Right: Pill Badge + Mini Action Arrow */}
                  <View style={styles.topRightActions}>
                    <View
                      style={[
                        styles.pillBadge,
                        {
                          backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.1)'
                            : 'rgba(255, 255, 255, 0.75)',
                          borderColor: isDark
                            ? 'rgba(255, 255, 255, 0.14)'
                            : 'rgba(255, 255, 255, 0.9)',
                        },
                      ]}
                    >
                      <Text style={[styles.badgeText, { color: accent }]}>
                        {tool.badge}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.actionArrow,
                        {
                          backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.12)'
                            : 'rgba(255, 255, 255, 0.75)',
                          borderColor: isDark
                            ? 'rgba(255, 255, 255, 0.16)'
                            : 'rgba(255, 255, 255, 0.9)',
                        },
                      ]}
                    >
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        size={12}
                        color={accent}
                        strokeWidth={2.4}
                      />
                    </View>
                  </View>
                </View>

                {/* Bottom: Typography */}
                <View style={styles.textContainer}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.toolTitle,
                      { color: isDark ? '#F8FAFC' : '#0F172A' },
                    ]}
                  >
                    {tool.name}
                  </Text>
                  <Text
                    numberOfLines={2}
                    style={[
                      styles.toolDesc,
                      { color: isDark ? 'rgba(241, 245, 249, 0.75)' : '#475569' },
                    ]}
                  >
                    {tool.desc}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Subtle Pagination Indicator Dots */}
      <View style={styles.dotsRow}>
        {TOOLS_CONFIG.map((tool, idx) => {
          const isActive = idx === activeIndex;
          return (
            <Pressable
              key={tool.id}
              hitSlop={6}
              onPress={() => scrollToCard(idx)}
              accessibilityRole="button"
              accessibilityLabel={`Slide ${idx + 1}`}
              style={[
                styles.dot,
                {
                  width: isActive ? 18 : 6,
                  backgroundColor: isActive
                    ? isDark
                      ? '#A78BFA'
                      : '#7C3AED'
                    : isDark
                      ? 'rgba(255, 255, 255, 0.2)'
                      : 'rgba(0, 0, 0, 0.14)',
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  scrollContent: {
    gap: CARD_GAP,
    paddingBottom: 4,
  },
  card: {
    width: CARD_WIDTH,
    minHeight: 148,
    borderRadius: 22,
    borderWidth: 0.1,
    position: 'relative',
    overflow: 'hidden',
    ...(Platform.OS == 'ios' ? {
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
    } : {
      elevation: 2,
    }),
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 0.8,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  actionArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.8,
  },
  textContainer: {
    marginTop: 14,
  },
  toolTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    letterSpacing: -0.25,
  },
  toolDesc: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 16,
    letterSpacing: -0.1,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 4,
  },
  dot: {
    height: 5,
    borderRadius: 2.5,
  },
});
