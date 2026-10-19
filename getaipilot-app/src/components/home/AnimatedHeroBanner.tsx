import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { SparklesIcon } from '@hugeicons/core-free-icons';
import * as Haptics from 'expo-haptics';

interface AnimatedHeroBannerProps {
  onExplorePress?: () => void;
  planLabel?: string | null;
}

interface ChannelItem {
  id: string;
  name: string;
  image: any;
  prefix: string;
  highlight: string;
  color: string;
  subtitle: string;
  badge: string;
}

// 5 Ecosystem Channels that dynamically swap hero position
const CHANNELS: ChannelItem[] = [
  {
    id: 'crm',
    name: 'Smart CRM',
    image: require('../../../assets/images/products/crm.png'),
    prefix: 'made',
    highlight: 'effortless.',
    color: '#F472B6', // Neon Rose Pink
    subtitle: 'Smart CRM & Multi-Channel AI',
    badge: 'Smart CRM',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp AI',
    image: require('../../../assets/images/products/whatsapp.png'),
    prefix: 'on full',
    highlight: 'autopilot.',
    color: '#34D399', // Emerald Green
    subtitle: '24/7 Meta API & Chat Autopilot',
    badge: 'WhatsApp AI',
  },
  {
    id: 'voice',
    name: 'Voice AI',
    image: require('../../../assets/images/products/voice.png'),
    prefix: 'powered by',
    highlight: 'smart AI.',
    color: '#C084FC', // Bright Violet
    subtitle: 'Real-Time AI Voice Calling',
    badge: 'Voice AI',
  },
  {
    id: 'social',
    name: 'Social Pilot',
    image: require('../../../assets/images/products/social.png'),
    prefix: 'always',
    highlight: 'connected.',
    color: '#FB7185', // Coral Rose
    subtitle: 'Cross-Platform Social Sync',
    badge: 'Social Pilot',
  },
  {
    id: 'telegram',
    name: 'Telegram Pilot',
    image: require('../../../assets/images/products/telegram.png'),
    prefix: 'lightning',
    highlight: 'fast.',
    color: '#38BDF8', // Cyan Sky
    subtitle: 'Auto-Forward Feeds & Reactions',
    badge: 'Telegram AI',
  },
];

// 5 Cluster Slots: Slot 0 = Big Centerpiece, Slots 1-4 = Close Asymmetric Satellites
const SLOTS = [
  { x: 0, y: 0, scale: 1.0, deg: 0 }, // 0: Center Hero
  { x: -32, y: -30, scale: 0.38, deg: -9 }, // 1: Top-Left
  { x: 34, y: -32, scale: 0.39, deg: 12 }, // 2: Top-Right
  { x: -34, y: 30, scale: 0.35, deg: -14 }, // 3: Bottom-Left
  { x: 30, y: 30, scale: 0.36, deg: 7 }, // 4: Bottom-Right
];

// Helper to determine slot mapping for any step
function getSlotForChannel(channelIdx: number, step: number): number {
  const heroChannelIdx = step % 5;
  if (channelIdx === heroChannelIdx) return 0; // Slot 0 = Center
  let slot = 1;
  for (let c = 0; c < 5; c++) {
    if (c === heroChannelIdx) continue;
    if (c === channelIdx) return slot;
    slot++;
  }
  return 1;
}

export function AnimatedHeroBanner({
  onExplorePress,
  planLabel,
}: AnimatedHeroBannerProps) {
  const [step, setStep] = useState(0);

  // Card entrance
  const cardScale = useRef(new Animated.Value(0.96)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  // Text transition animations
  const textTranslateY = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;

  // Cluster subtle ambient breathing (gentle continuous floating)
  const clusterBreatheScale = useRef(new Animated.Value(1)).current;
  const clusterBreatheY = useRef(new Animated.Value(0)).current;

  // 5 Channels individual animated nodes (X, Y, Scale, Rotation)
  const channelNodes = useRef(
    CHANNELS.map((_, i) => {
      const initialSlotIdx = getSlotForChannel(i, 0);
      const slot = SLOTS[initialSlotIdx];
      return {
        posX: new Animated.Value(slot.x),
        posY: new Animated.Value(slot.y),
        scale: new Animated.Value(slot.scale),
        rotateDeg: new Animated.Value(slot.deg),
      };
    })
  ).current;

  useEffect(() => {
    // Card Entrance
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();

    // Cluster gentle ambient breath
    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(clusterBreatheScale, {
            toValue: 1.025,
            duration: 2200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(clusterBreatheY, {
            toValue: -1.2,
            duration: 2200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(clusterBreatheScale, {
            toValue: 1,
            duration: 2200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(clusterBreatheY, {
            toValue: 0,
            duration: 2200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    breatheLoop.start();

    return () => {
      breatheLoop.stop();
    };
  }, []);

  // Automatic Smooth Icon Swapping & Text Sync Interval
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Text slide-out
      Animated.parallel([
        Animated.timing(textTranslateY, {
          toValue: -10,
          duration: 190,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 0,
          duration: 170,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // 2. Advance step
        const nextStep = step + 1;
        setStep(nextStep);
        textTranslateY.setValue(10);

        // 3. Trigger smooth spring glide for all 5 channels to their new slots
        const swapSprings = channelNodes.map((node, i) => {
          const targetSlotIdx = getSlotForChannel(i, nextStep);
          const target = SLOTS[targetSlotIdx];
          const isEnteringCenter = targetSlotIdx === 0;

          return Animated.parallel([
            Animated.spring(node.posX, {
              toValue: target.x,
              friction: isEnteringCenter ? 6.5 : 7,
              tension: isEnteringCenter ? 60 : 50,
              useNativeDriver: true,
            }),
            Animated.spring(node.posY, {
              toValue: target.y,
              friction: isEnteringCenter ? 6.5 : 7,
              tension: isEnteringCenter ? 60 : 50,
              useNativeDriver: true,
            }),
            Animated.spring(node.scale, {
              toValue: target.scale,
              friction: isEnteringCenter ? 6 : 7.5,
              tension: isEnteringCenter ? 65 : 55,
              useNativeDriver: true,
            }),
            Animated.timing(node.rotateDeg, {
              toValue: target.deg,
              duration: 380,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]);
        });

        // 4. Run Icon Swap & Text Entrance in seamless synchronization
        Animated.parallel([
          ...swapSprings,
          Animated.spring(textTranslateY, {
            toValue: 0,
            friction: 6,
            tension: 70,
            useNativeDriver: true,
          }),
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();

        // Subtle haptic touch when hero swaps
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
      });
    }, 3400);

    return () => clearInterval(interval);
  }, [step]);

  const heroIdx = step % 5;
  const currentHero = CHANNELS[heroIdx];

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onExplorePress?.();
  };

  return (
    <Animated.View
      style={[
        styles.outerContainer,
        {
          opacity: cardOpacity,
          transform: [{ scale: cardScale }],
        },
      ]}
    >
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.card,
          { transform: [{ scale: pressed ? 0.99 : 1 }] },
        ]}
      >
        {/* Rich Dark Wine / Plum Background Gradient */}
        <LinearGradient
          colors={['#420B38', '#260423', '#140113']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Specular Diagonal Highlight across top edge */}
        <LinearGradient
          colors={['rgba(255, 110, 199, 0.2)', 'rgba(255, 255, 255, 0.04)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 0.6 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Card Content: Fixed height layout ensuring 0 height change */}
        <View style={styles.cardContent}>
          {/* LEFT COLUMN: Brand Badge + Animated Headline (Strictly 2 lines) + Subtitle + Dots */}
          <View style={styles.leftColumn}>
            {/* Top Row: Circular White Brand Badge & Compact Tag */}
            <View style={styles.brandRow}>
              <View style={styles.whiteLogoCircle}>
                <Image
                  source={require('../../../assets/images/logo-sm.png')}
                  style={styles.logoBadgeImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.brandPill}>
                <HugeiconsIcon
                  icon={SparklesIcon}
                  size={11}
                  color={currentHero.color}
                  strokeWidth={2}
                />
                <Text style={styles.brandPillText} numberOfLines={1}>
                  {currentHero.badge}
                </Text>
              </View>
            </View>

            {/* Headline: Exactly 2 Lines Always (Fixed Height Container) */}
            <View style={styles.headlineWrapper}>
              <Text style={styles.headlineLead} numberOfLines={1}>
                Your work,
              </Text>
              <Animated.View
                style={[
                  styles.animatedLineRow,
                  {
                    opacity: textOpacity,
                    transform: [{ translateY: textTranslateY }],
                  },
                ]}
              >
                <Text style={styles.headlinePrefix} numberOfLines={1}>
                  {currentHero.prefix}{' '}
                </Text>
                <Text
                  style={[
                    styles.headlineHighlight,
                    { color: currentHero.color },
                  ]}
                  numberOfLines={1}
                >
                  {currentHero.highlight}
                </Text>
              </Animated.View>
            </View>

            {/* Subtitle */}
            <Animated.Text
              style={[
                styles.subtitleText,
                { opacity: textOpacity },
              ]}
              numberOfLines={1}
            >
              {currentHero.subtitle}
            </Animated.Text>

            {/* Pagination Dots */}
            <View style={styles.dotsRow}>
              {CHANNELS.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === heroIdx ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* RIGHT COLUMN: 5 Channels Dynamically Swapping Positions with Smooth Springs */}
          <Animated.View
            style={[
              styles.rightCluster,
              {
                transform: [
                  { translateY: clusterBreatheY },
                  { scale: clusterBreatheScale },
                ],
              },
            ]}
          >
            {CHANNELS.map((channel, idx) => {
              const node = channelNodes[idx];
              const isHero = idx === heroIdx;

              const rotationStyle = node.rotateDeg.interpolate({
                inputRange: [-20, 20],
                outputRange: ['-20deg', '20deg'],
              });

              return (
                <Animated.View
                  key={channel.id}
                  style={[
                    styles.channelIconContainer,
                    {
                      zIndex: isHero ? 20 : 10,
                      transform: [
                        { translateX: node.posX },
                        { translateY: node.posY },
                        { scale: node.scale },
                        { rotate: rotationStyle },
                      ],
                    },
                  ]}
                >
                  <Image
                    source={channel.image}
                    style={styles.channelImage}
                    resizeMode="contain"
                  />
                </Animated.View>
              );
            })}
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
  },
  card: {
    borderRadius: 26,
    borderWidth: 1.2,
    borderColor: 'rgba(244, 114, 182, 0.28)',
    position: 'relative',
    overflow: 'hidden',
    height: 154,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 15,
    paddingBottom: 15,
    height: 154,
  },
  leftColumn: {
    flex: 1,
    paddingRight: 6,
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  whiteLogoCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadgeImage: {
    width: 18,
    height: 18,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    gap: 4,
    maxWidth: 120,
  },
  brandPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FCE7F3',
    letterSpacing: 0.2,
  },
  headlineWrapper: {
    height: 52,
    justifyContent: 'center',
    marginBottom: 4,
  },
  headlineLead: {
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.6,
  },
  animatedLineRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'nowrap',
  },
  headlinePrefix: {
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.6,
  },
  headlineHighlight: {
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  subtitleText: {
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.72)',
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  dotActive: {
    width: 14,
    backgroundColor: '#F472B6',
  },
  dotInactive: {
    width: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.26)',
  },

  // RIGHT CLUSTER (Center + Satellites all rendered from 60x60 base image smoothly scaling and translating)
  rightCluster: {
    width: 136,
    height: 136,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  channelIconContainer: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelImage: {
    width: 60,
    height: 60,
  },
});
