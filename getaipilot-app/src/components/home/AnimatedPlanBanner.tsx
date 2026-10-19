import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowRight01Icon, SparklesIcon } from '@hugeicons/core-free-icons';

interface AnimatedPlanBannerProps {
  planLabel?: string | null;
  onPress: () => void;
}

export function AnimatedPlanBanner({
  planLabel,
  onPress,
}: AnimatedPlanBannerProps) {
  // Flash shimmer animation values
  const flashAnim = useRef(new Animated.Value(-160)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;

  // Pulse animation for the CTA button & badge
  const badgePulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let isMounted = true;
    let loopTimeout: ReturnType<typeof setTimeout> | null = null;

    // Periodic flash shimmer sweep across the banner
    const runFlash = () => {
      if (!isMounted) return;
      flashAnim.setValue(-160);
      flashOpacity.setValue(0);

      Animated.sequence([
        Animated.delay(1000),
        Animated.parallel([
          Animated.timing(flashOpacity, {
            toValue: 1,
            duration: 160,
            useNativeDriver: true,
          }),
          Animated.timing(flashAnim, {
            toValue: 460,
            duration: 1100,
            easing: Easing.bezier(0.22, 1, 0.36, 1),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(flashOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (isMounted) {
          loopTimeout = setTimeout(runFlash, 4000);
        }
      });
    };

    runFlash();

    // Gentle breathing pulse for the PRO tag
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(badgePulse, {
          toValue: 1.05,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(badgePulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnim.start();

    return () => {
      isMounted = false;
      if (loopTimeout) clearTimeout(loopTimeout);
      pulseAnim.stop();
    };
  }, []);

  return (
    <Pressable
      cssInterop={false}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="View plans and upgrade"
      style={({ pressed }) => [
        styles.container,
        {
          transform: [{ scale: pressed ? 0.985 : 1 }],
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {/* 1. Deep Luxury Dark Midnight Violet Gradient */}
      <LinearGradient
        colors={['#1E1138', '#140A28', '#0A0318']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* 2. Ambient Radiant Violet & Magenta Light Orbs */}
      <View style={styles.topAmbientOrb} pointerEvents="none" />
      <View style={styles.bottomAmbientOrb} pointerEvents="none" />

      {/* 3. Top Specular Glass Reflection */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.16)', 'rgba(255, 255, 255, 0.02)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0.6 }}
        style={StyleSheet.absoluteFill}
      />

      {/* 4. Subtle Watermark Sparkle in Right Background */}
      <View style={styles.watermarkWrapper} pointerEvents="none">
        <Ionicons name="sparkles" size={88} color="rgba(192, 132, 252, 0.12)" />
      </View>

      {/* 5. Sweeping Flash Light Beam Animation */}
      <Animated.View
        style={[
          styles.flashBeamWrapper,
          {
            opacity: flashOpacity,
            transform: [
              { translateX: flashAnim },
              { rotate: '24deg' },
            ],
          },
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[
            'transparent',
            'rgba(255, 255, 255, 0.06)',
            'rgba(255, 255, 255, 0.42)',
            'rgba(255, 255, 255, 0.06)',
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* 6. Banner Content Row */}
      <View style={styles.contentRow}>
        {/* Left Column: Pill + Title + Plan Status */}
        <View style={styles.leftColumn}>
          {/* Glowing Top Pill */}
          <Animated.View
            style={[
              styles.pillBadge,
              { transform: [{ scale: badgePulse }] },
            ]}
          >
            <HugeiconsIcon icon={SparklesIcon} size={11} color="#C084FC" strokeWidth={2.4} />
            <Text style={styles.pillText}>PRO ECOSYSTEM</Text>
          </Animated.View>

          {/* Bold White Headline */}
          <Text numberOfLines={1} style={styles.headline}>
            Room to grow
          </Text>

          {/* Current Plan Indicator & Details */}
          <View style={styles.planStatusRow}>
            <View style={styles.statusDot} />
            <Text numberOfLines={1} style={styles.planDetailText}>
              {planLabel ? `${planLabel} plan` : 'GetAiPilot - GAP Core (Yearly)'}
            </Text>
          </View>
        </View>

        {/* Right Column: Luminous Vibrant CTA Button */}
        <View style={styles.buttonWrapper}>
          <LinearGradient
            colors={['#A855F7', '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>View plans</Text>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={13}
              color="#FFFFFF"
              strokeWidth={2.4}
            />
          </LinearGradient>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: 'rgba(168, 85, 247, 0.35)',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 4,
  },
  topAmbientOrb: {
    position: 'absolute',
    top: -30,
    left: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
  },
  bottomAmbientOrb: {
    position: 'absolute',
    bottom: -30,
    right: 40,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(236, 72, 153, 0.14)',
  },
  watermarkWrapper: {
    position: 'absolute',
    right: -10,
    bottom: -18,
    transform: [{ rotate: '-12deg' }],
  },
  flashBeamWrapper: {
    position: 'absolute',
    top: -50,
    bottom: -50,
    width: 80,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    zIndex: 10,
  },
  leftColumn: {
    flex: 1,
    paddingRight: 12,
  },
  pillBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 10,
    backgroundColor: 'rgba(168, 85, 247, 0.22)',
    borderWidth: 0.8,
    borderColor: 'rgba(192, 132, 252, 0.4)',
    marginBottom: 8,
  },
  pillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#E9D5FF',
    letterSpacing: 0.5,
  },
  headline: {
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  planStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
    shadowColor: '#34D399',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  planDetailText: {
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255, 255, 255, 0.72)',
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  buttonWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  buttonText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
});
