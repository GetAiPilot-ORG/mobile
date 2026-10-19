import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/theme';

interface AnimatedSplashScreenProps {
  minDurationMs?: number;
  onAnimationComplete?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Logo display dimensions calibrated to 348x353 original aspect ratio
const LOGO_WIDTH = 126;
const LOGO_HEIGHT = 128;

// Exact center coordinates of the top-right satellite dot relative to logo center
const scaleFactorX = LOGO_WIDTH / 348;
const scaleFactorY = LOGO_HEIGHT / 353;
const DOT_WIDTH = Math.round(67 * scaleFactorX); // 24
const DOT_HEIGHT = Math.round(67 * scaleFactorY); // 24
const DOT_OFFSET_X = Number((118.5 * scaleFactorX).toFixed(2)); // 42.91
const DOT_OFFSET_Y = Number((-131.0 * scaleFactorY).toFixed(2)); // -47.50

/**
 * AnimatedSplashScreen:
 * - Fluid, cinematic assembly of the GetAiPilot brand identity
 * - The logo body emerges cleanly with organic scale and easing
 * - Exactly ONE satellite dot descends from above like a natural water droplet
 * - Drops directly into its native position with liquid squash, rebound, and concentric impact ripples
 * - Zero extra dots and zero rotated white space/box artifacts
 */
export function AnimatedSplashScreen({
  minDurationMs = 2200,
  onAnimationComplete,
}: AnimatedSplashScreenProps) {
  const { isDark } = useTheme();

  const completeRef = useRef(onAnimationComplete);
  useEffect(() => {
    completeRef.current = onAnimationComplete;
  }, [onAnimationComplete]);

  // 1. Logo Main Body Entrance
  const logoScale = useRef(new Animated.Value(0.35)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;

  // 2. Water Droplet (Satellite Dot) Descent & Squash/Rebound
  const dropY = useRef(new Animated.Value(-150)).current;
  const dropOpacity = useRef(new Animated.Value(0)).current;
  const dropScaleX = useRef(new Animated.Value(0.75)).current;
  const dropScaleY = useRef(new Animated.Value(1.45)).current;

  // 3. Concentric Water Ripples at the Dot Impact Point
  const ripple1 = useRef(new Animated.Value(0)).current;
  const ripple2 = useRef(new Animated.Value(0)).current;
  const ripple3 = useRef(new Animated.Value(0)).current;

  // 4. Brand Typography
  const textTranslateY = useRef(new Animated.Value(18)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  // 5. Screen Exit
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const containerScale = useRef(new Animated.Value(1)).current;

const brandLogo = require('../../../assets/images/icon.png');

export function AnimatedSplashScreen({ minDurationMs = 180, onAnimationComplete }: Props) {
  const { colors, isDark } = useTheme();
  const [opacity] = useState(() => new Animated.Value(1));
  const complete = useRef(onAnimationComplete);
  useEffect(() => { complete.current = onAnimationComplete; }, [onAnimationComplete]);

  useEffect(() => {
    let cancelled = false;
    let completeTimer: ReturnType<typeof setTimeout> | undefined;

    const runCinematicAssemble = () => {
      if (cancelled) return;
      if (!reduced) {
        opacity.setValue(0.75);
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start();
      }
      timer = setTimeout(() => {
        if (!cancelled) complete.current?.();
      }, reduced ? 0 : Math.min(minDurationMs, 250));
    };
    AccessibilityInfo.isReduceMotionEnabled().then(start).catch(() => start(true));
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      opacity.stopAnimation();
    };
  }, [minDurationMs, opacity]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDark ? '#14131B' : '#F5F3FB',
        gap: 16,
      }}
    >
      <Animated.View style={{ opacity, alignItems: 'center', justifyContent: 'center' }}>
        <Image
          source={brandLogo}
          style={{ width: 88, height: 88, backgroundColor: 'transparent' }}
          contentFit="contain"
          transition={200}
        />
      </Animated.View>
      <Text
        style={{
          fontSize: 26,
          fontWeight: '700',
          color: isDark ? '#FFFFFF' : '#000000',
          letterSpacing: -0.5,
        }}
      >
        GetAiPilot
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: isDark ? '#9CA3AF' : '#6B7280',
          fontWeight: '500',
        }}
      >
        Getting things ready…
      </Text>
    </View>
  );
}

