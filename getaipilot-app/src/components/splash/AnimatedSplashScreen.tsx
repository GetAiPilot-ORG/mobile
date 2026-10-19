import React, { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
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

  useEffect(() => {
    let cancelled = false;
    let completeTimer: ReturnType<typeof setTimeout> | undefined;

    const runCinematicAssemble = () => {
      if (cancelled) return;

      Animated.sequence([
        // STEP 1: Logo body unfolds cleanly from center (0ms - 420ms)
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 360,
            useNativeDriver: true,
          }),
          Animated.spring(logoScale, {
            toValue: 1,
            friction: 6,
            tension: 60,
            useNativeDriver: true,
          }),
          Animated.timing(logoRotate, {
            toValue: 1,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),

        // STEP 2: The single water droplet descends from above and impacts onto the logo (420ms - 800ms)
        Animated.parallel([
          Animated.timing(dropOpacity, {
            toValue: 1,
            duration: 80,
            useNativeDriver: true,
          }),
          // Descent with gravity acceleration
          Animated.timing(dropY, {
            toValue: 0,
            duration: 380,
            easing: Easing.bezier(0.5, 0.05, 0.8, 0.3),
            useNativeDriver: true,
          }),
          // Liquid teardrop stretch while falling, impact squash, elastic spring rebound
          Animated.sequence([
            Animated.timing(dropScaleY, {
              toValue: 1.45,
              duration: 230,
              useNativeDriver: true,
            }),
            Animated.timing(dropScaleY, {
              toValue: 0.58,
              duration: 120,
              useNativeDriver: true,
            }),
            Animated.spring(dropScaleY, {
              toValue: 1,
              friction: 4,
              tension: 80,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(dropScaleX, {
              toValue: 0.78,
              duration: 230,
              useNativeDriver: true,
            }),
            Animated.timing(dropScaleX, {
              toValue: 1.35,
              duration: 120,
              useNativeDriver: true,
            }),
            Animated.spring(dropScaleX, {
              toValue: 1,
              friction: 4,
              tension: 80,
              useNativeDriver: true,
            }),
          ]),
        ]),

        // STEP 3: Concentric ripples expand on impact & typography glides in (800ms - 1300ms)
        Animated.parallel([
          // Ripple 1
          Animated.timing(ripple1, {
            toValue: 1,
            duration: 650,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          // Ripple 2
          Animated.sequence([
            Animated.delay(100),
            Animated.timing(ripple2, {
              toValue: 1,
              duration: 650,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
          // Ripple 3
          Animated.sequence([
            Animated.delay(200),
            Animated.timing(ripple3, {
              toValue: 1,
              duration: 700,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),

          // Brand Typography floats into position
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 420,
            useNativeDriver: true,
          }),
          Animated.spring(textTranslateY, {
            toValue: 0,
            friction: 7,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),

        // STEP 4: Ambient appreciation
        Animated.delay(Math.max(100, minDurationMs - 1850)),

        // STEP 5: Seamless cinematic exit fade
        Animated.parallel([
          Animated.timing(containerOpacity, {
            toValue: 0,
            duration: 240,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(containerScale, {
            toValue: 1.02,
            duration: 240,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        if (!cancelled) {
          completeRef.current?.();
        }
      });

      // Medium haptic impact right when the water droplet hits the logo
      setTimeout(() => {
        if (!cancelled && Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        }
      }, 790);
    };

    // Accessibility check
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        if (reduced) {
          logoOpacity.setValue(1);
          logoScale.setValue(1);
          dropOpacity.setValue(1);
          dropY.setValue(0);
          textOpacity.setValue(1);
          textTranslateY.setValue(0);
          completeTimer = setTimeout(() => {
            if (!cancelled) completeRef.current?.();
          }, 350);
        } else {
          runCinematicAssemble();
        }
      })
      .catch(() => runCinematicAssemble());

    return () => {
      cancelled = true;
      if (completeTimer) clearTimeout(completeTimer);
    };
  }, [minDurationMs]);

  // Interpolations
  const logoRotationStyle = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-14deg', '0deg'],
  });

  // Ripple 1
  const r1Scale = ripple1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 2.6],
  });
  const r1Opacity = ripple1.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0.9, 0.45, 0],
  });

  // Ripple 2
  const r2Scale = ripple2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 3.2],
  });
  const r2Opacity = ripple2.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0.75, 0.35, 0],
  });

  // Ripple 3
  const r3Scale = ripple3.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 3.8],
  });
  const r3Opacity = ripple3.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0.55, 0.2, 0],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#080612' : '#F7F6FC',
          opacity: containerOpacity,
          transform: [{ scale: containerScale }],
        },
      ]}
    >
      {/* Background Soft Ambient Radial Glow (Clean circular glow, no boxes or edges) */}
      <View style={styles.ambientGlowContainer} pointerEvents="none">
        <LinearGradient
          colors={
            isDark
              ? ['rgba(147, 51, 234, 0.18)', 'rgba(236, 72, 153, 0.10)', 'transparent']
              : ['rgba(147, 51, 234, 0.08)', 'rgba(59, 130, 246, 0.05)', 'transparent']
          }
          style={styles.ambientGradientOrb}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </View>

      {/* Main Assembly Stage */}
      <View style={styles.stage}>
        {/* 1. Logo Main Body (The spiral sphere without the satellite dot) */}
        <Animated.View
          style={[
            styles.logoBodyContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }, { rotate: logoRotationStyle }],
            },
          ]}
        >
          <Image
            source={require('../../../assets/images/logo_body.png')}
            style={styles.logoBodyImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* 2. Concentric Water Ripples radiating from the exact satellite dot position */}
        <View
          style={[
            styles.dotAnchor,
            {
              transform: [
                { translateX: DOT_OFFSET_X },
                { translateY: DOT_OFFSET_Y },
              ],
            },
          ]}
          pointerEvents="none"
        >
          {/* Ripple 3 */}
          <Animated.View
            style={[
              styles.waterRipple,
              {
                borderColor: isDark ? 'rgba(56, 189, 248, 0.6)' : 'rgba(14, 165, 233, 0.5)',
                transform: [{ scale: r3Scale }],
                opacity: r3Opacity,
              },
            ]}
          />

          {/* Ripple 2 */}
          <Animated.View
            style={[
              styles.waterRipple,
              {
                borderColor: isDark ? 'rgba(168, 85, 247, 0.75)' : 'rgba(147, 51, 234, 0.6)',
                transform: [{ scale: r2Scale }],
                opacity: r2Opacity,
              },
            ]}
          />

          {/* Ripple 1 */}
          <Animated.View
            style={[
              styles.waterRipple,
              {
                borderColor: isDark ? 'rgba(244, 63, 94, 0.9)' : 'rgba(225, 29, 72, 0.75)',
                transform: [{ scale: r1Scale }],
                opacity: r1Opacity,
              },
            ]}
          />
        </View>

        {/* 3. The Single Authentic Water Drop (Satellite Dot) */}
        <Animated.View
          style={[
            styles.dotWrapper,
            {
              transform: [
                { translateX: DOT_OFFSET_X },
                { translateY: DOT_OFFSET_Y },
                { translateY: dropY },
                { scaleX: dropScaleX },
                { scaleY: dropScaleY },
              ],
              opacity: dropOpacity,
            },
          ]}
        >
          <Image
            source={require('../../../assets/images/logo_dot_cropped.png')}
            style={styles.dotImage}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {/* Typography: Brand Title & Subtitle */}
      <View style={styles.brandContainer}>
        <Animated.View
          style={{
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
            alignItems: 'center',
          }}
        >
          {/* Brand Name */}
          <View style={styles.brandRow}>
            <Text
              style={[
                styles.brandTitle,
                { color: isDark ? '#FFFFFF' : '#0F172A' },
              ]}
            >
              GetAi<Text style={styles.brandTitleAccent}>Pilot</Text>
            </Text>
          </View>

          {/* Subtitle */}
          <Text
            style={[
              styles.brandSubtitle,
              { color: isDark ? 'rgba(226, 232, 240, 0.75)' : '#64748B' },
            ]}
          >
            AI Autopilot for Modern Teams
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientGlowContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientGradientOrb: {
    width: SCREEN_WIDTH * 1.2,
    height: SCREEN_WIDTH * 1.2,
    borderRadius: (SCREEN_WIDTH * 1.2) / 2,
  },
  stage: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoBodyContainer: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBodyImage: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
  },
  dotAnchor: {
    position: 'absolute',
    width: 1,
    height: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 8,
  },
  waterRipple: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
  },
  dotWrapper: {
    position: 'absolute',
    width: DOT_WIDTH,
    height: DOT_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  dotImage: {
    width: DOT_WIDTH,
    height: DOT_HEIGHT,
  },
  brandContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  brandTitleAccent: {
    color: '#EC4899',
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
    marginTop: 5,
  },
});
