import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { useTheme, getColors } from '@/theme';

interface AnimatedSplashScreenProps {
  onAnimationComplete?: () => void;
  minDurationMs?: number;
}

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({
  onAnimationComplete,
  minDurationMs = 2200,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { width, height } = useWindowDimensions();

  // Animation drivers
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;

  const dotScale = useRef(new Animated.Value(0)).current;
  const dotTranslateY = useRef(new Animated.Value(18)).current;
  const dotGlow = useRef(new Animated.Value(0)).current;

  const ring1Scale = useRef(new Animated.Value(0.7)).current;
  const ring1Opacity = useRef(new Animated.Value(0)).current;
  const ring2Scale = useRef(new Animated.Value(0.5)).current;
  const ring2Opacity = useRef(new Animated.Value(0)).current;

  const ambientPulse = useRef(new Animated.Value(1)).current;
  const particleRotate = useRef(new Animated.Value(0)).current;

  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(16)).current;

  const barWidth = useRef(new Animated.Value(0)).current;
  const screenFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Ambient pulsing background loop
    const ambientLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ambientPulse, {
          toValue: 1.25,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(ambientPulse, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // 2. Cosmic slow rotating orbit loop
    const particleLoop = Animated.loop(
      Animated.timing(particleRotate, {
        toValue: 1,
        duration: 14000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // 3. Radar wave resonance loops
    const wave1Loop = Animated.loop(
      Animated.parallel([
        Animated.timing(ring1Scale, {
          toValue: 1.9,
          duration: 2800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(ring1Opacity, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(ring1Opacity, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    const wave2Loop = Animated.loop(
      Animated.parallel([
        Animated.timing(ring2Scale, {
          toValue: 1.6,
          duration: 2400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(ring2Opacity, {
            toValue: 0.7,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(ring2Opacity, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    ambientLoop.start();
    particleLoop.start();
    wave1Loop.start();
    wave2Loop.start();

    // 4. Main Sequence Entrance
    Animated.sequence([
      // A. Logo Ribbon swoosh entrance
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 750,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6.5,
          tension: 45,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 850,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true,
        }),
      ]),

      // B. Autonomous dot "i" dot bounces up and settles
      Animated.parallel([
        Animated.spring(dotScale, {
          toValue: 1,
          friction: 5,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.spring(dotTranslateY, {
          toValue: 0,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(dotGlow, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),

      // C. Brand Typography & Slogan reveal
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        // D. Progress bar fills smoothly
        Animated.timing(barWidth, {
          toValue: 1,
          duration: minDurationMs * 0.45,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    ]).start(() => {
      if (onAnimationComplete) {
        Animated.timing(screenFade, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(() => {
          onAnimationComplete();
        });
      }
    });

    return () => {
      ambientLoop.stop();
      particleLoop.stop();
      wave1Loop.stop();
      wave2Loop.stop();
    };
  }, []);

  const spinInterpolation = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-25deg', '0deg'],
  });

  const particleSpin = particleRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const bgThemeColor = isDark ? '#08060D' : '#F9F8FD';

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        styles.container,
        {
          backgroundColor: bgThemeColor,
          opacity: screenFade,
        },
      ]}
      pointerEvents="auto"
    >
      {/* 1. Ambient Glowing Background Gradients */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Top-Right Neon Coral/Pink Glow */}
        <Animated.View
          style={[
            styles.ambientOrb,
            {
              top: height * 0.12,
              right: -width * 0.15,
              backgroundColor: '#FF2E93',
              transform: [{ scale: ambientPulse }],
              opacity: isDark ? 0.35 : 0.22,
            },
          ]}
        />
        {/* Center Cyan/Blue Glow */}
        <Animated.View
          style={[
            styles.ambientOrb,
            {
              top: height * 0.4,
              left: -width * 0.18,
              backgroundColor: '#00C8FF',
              transform: [{ scale: ambientPulse }],
              opacity: isDark ? 0.28 : 0.18,
            },
          ]}
        />
        {/* Bottom Violet Glow */}
        <Animated.View
          style={[
            styles.ambientOrb,
            {
              bottom: height * 0.1,
              right: width * 0.2,
              backgroundColor: '#7C3AED',
              transform: [{ scale: ambientPulse }],
              opacity: isDark ? 0.25 : 0.16,
            },
          ]}
        />
      </View>

      {/* 2. Cyber Matrix Orbital Ring (SVG) */}
      <Animated.View
        style={[
          styles.orbitSvgContainer,
          { transform: [{ rotate: particleSpin }] },
        ]}
        pointerEvents="none"
      >
        <Svg width={320} height={320} viewBox="0 0 320 320">
          <Circle
            cx="160"
            cy="160"
            r="140"
            stroke={isDark ? 'rgba(255, 46, 147, 0.12)' : 'rgba(255, 46, 147, 0.18)'}
            strokeWidth="1.5"
            strokeDasharray="6 8"
            fill="none"
          />
          <Circle
            cx="160"
            cy="160"
            r="115"
            stroke={isDark ? 'rgba(0, 200, 255, 0.14)' : 'rgba(0, 200, 255, 0.18)'}
            strokeWidth="1"
            strokeDasharray="4 6"
            fill="none"
          />
          {/* Orbital Satellite Dots */}
          <Circle cx="160" cy="20" r="3.5" fill="#FF5E62" />
          <Circle cx="300" cy="160" r="3" fill="#00D2FF" />
          <Circle cx="60" cy="240" r="2.5" fill="#D946EF" />
        </Svg>
      </Animated.View>

      {/* 3. Expanding Radar Ripple Waves */}
      <View style={styles.rippleWrapper} pointerEvents="none">
        <Animated.View
          style={[
            styles.rippleRing,
            {
              borderColor: '#FF2E93',
              transform: [{ scale: ring1Scale }],
              opacity: ring1Opacity,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.rippleRing,
            {
              borderColor: '#00D2FF',
              transform: [{ scale: ring2Scale }],
              opacity: ring2Opacity,
            },
          ]}
        />
      </View>

      {/* 4. Central Graphic Emblem: The AI Logo Vector Path */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [
              { scale: logoScale },
              { rotate: spinInterpolation },
            ],
          },
        ]}
      >
        <Svg width={180} height={180} viewBox="0 0 200 200">
          <Defs>
            {/* The primary flow gradient from orange-coral to magenta-pink to violet-blue */}
            <LinearGradient id="aiFlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFA439" stopOpacity="1" />
              <Stop offset="25%" stopColor="#FF416C" stopOpacity="1" />
              <Stop offset="55%" stopColor="#E02494" stopOpacity="1" />
              <Stop offset="80%" stopColor="#8A2BE2" stopOpacity="1" />
              <Stop offset="100%" stopColor="#00B4D8" stopOpacity="1" />
            </LinearGradient>

            {/* Radiant Dot Gradient */}
            <LinearGradient id="dotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FF7A00" stopOpacity="1" />
              <Stop offset="60%" stopColor="#FF007A" stopOpacity="1" />
              <Stop offset="100%" stopColor="#7928CA" stopOpacity="1" />
            </LinearGradient>

            {/* Outer Glow filter Simulation */}
            <RadialGradient id="innerGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Outer Curved Swirl Body (The "a" and "i" continuous loop ribbon) */}
          <Path
            d="
              M 95,22 
              C 142,22 178,58 178,102 
              C 178,136 156,165 125,176 
              C 84,191 38,168 25,127 
              C 12,86 35,42 75,26 
              C 81,24 88,23 95,22 Z
            "
            fill="url(#aiFlowGrad)"
          />

          {/* Inner cutout creating the looping "a" loop and the "i" stem */}
          <Path
            d="
              M 98,46
              C 127,46 151,70 151,99
              C 151,126 130,148 103,150
              C 74,152 49,130 47,101
              C 45,71 69,47 98,46 Z
            "
            fill={bgThemeColor}
          />

          {/* Center inner hook forming the core 'a' spiral and ascending wave */}
          <Path
            d="
              M 98,68
              C 115,68 128,82 128,99
              C 128,114 116,126 101,126
              C 87,126 77,115 77,101
              C 77,88 87,79 99,79
              C 107,79 113,84 113,92
              C 113,96 109,100 104,100
              C 99,100 96,96 97,91
              C 97,84 104,80 110,84
              C 119,90 120,105 111,114
              C 100,125 81,120 74,107
              C 66,92 75,72 91,69 Z
            "
            fill="url(#aiFlowGrad)"
          />

          {/* High-gloss white light accent curve */}
          <Path
            d="M 95,26 C 138,26 172,60 172,102"
            stroke="rgba(255, 255, 255, 0.45)"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
        </Svg>

        {/* Floating autonomous "i" dot */}
        <Animated.View
          style={[
            styles.floatingDot,
            {
              transform: [
                { scale: dotScale },
                { translateY: dotTranslateY },
              ],
            },
          ]}
        >
          <Svg width={36} height={36} viewBox="0 0 36 36">
            <Defs>
              <LinearGradient id="dotGradSphere" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FFA439" />
                <Stop offset="50%" stopColor="#FF007A" />
                <Stop offset="100%" stopColor="#7928CA" />
              </LinearGradient>
            </Defs>
            <Circle cx="18" cy="18" r="16" fill="url(#dotGradSphere)" />
            {/* Sphere highlight */}
            <Circle cx="14" cy="13" r="5" fill="rgba(255,255,255,0.45)" />
          </Svg>
        </Animated.View>
      </Animated.View>

      {/* 5. Typography & Brand Title */}
      <Animated.View
        style={[
          styles.textSection,
          {
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
          },
        ]}
      >
        <View style={styles.brandTitleRow}>
          <Text
            style={[
              styles.brandTitleMain,
              { color: colors.text },
            ]}
          >
            Get
          </Text>
          <Text style={styles.brandTitleGradient}>AiPilot</Text>
        </View>

        <Text
          style={[
            styles.brandSubtitle,
            { color: isDark ? '#A1A1AA' : '#64748B' },
          ]}
        >
          Next-Gen Autonomous Agent Orchestration
        </Text>

        {/* Engine Pills Row */}
        <View style={styles.enginePillRow}>
          <View
            style={[
              styles.enginePill,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
            ]}
          >
            <View style={[styles.dotSmall, { backgroundColor: '#FF007A' }]} />
            <Text style={[styles.enginePillText, { color: isDark ? '#E4E4E7' : '#475569' }]}>
              Multi-Agent AI
            </Text>
          </View>
          <View
            style={[
              styles.enginePill,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
            ]}
          >
            <View style={[styles.dotSmall, { backgroundColor: '#00D2FF' }]} />
            <Text style={[styles.enginePillText, { color: isDark ? '#E4E4E7' : '#475569' }]}>
              Enterprise Sync
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* 6. Glowing Launch Progress Bar */}
      <View style={styles.bottomBarContainer}>
        <View
          style={[
            styles.barTrack,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
          ]}
        >
          <Animated.View
            style={[
              styles.barFill,
              {
                width: barWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text
          style={[
            styles.loadingFootnote,
            { color: isDark ? '#71717A' : '#94A3B8' },
          ]}
        >
          Initializing neural workspace...
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 999999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ambientOrb: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  orbitSvgContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rippleWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 260,
    height: 260,
  },
  rippleRing: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1.5,
  },
  logoContainer: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 24,
  },
  floatingDot: {
    position: 'absolute',
    top: 4,
    right: 14,
    shadowColor: '#FF007A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  textSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  brandTitleMain: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  brandTitleGradient: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FF2E93',
    letterSpacing: -0.6,
    marginLeft: 2,
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
    marginBottom: 16,
  },
  enginePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  enginePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 6,
  },
  dotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  enginePillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
    width: '70%',
    maxWidth: 260,
  },
  barTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    height: '100%',
    backgroundColor: '#FF2E93',
    borderRadius: 2,
  },
  loadingFootnote: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
