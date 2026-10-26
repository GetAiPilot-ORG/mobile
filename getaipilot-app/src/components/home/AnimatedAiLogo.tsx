import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';

interface AnimatedAiLogoProps {
  size?: number;
  isDark?: boolean;
  onPress?: () => void;
}

/**
 * AnimatedAiLogo
 * A living AI Agent & Business Automation brand mark for GetAiPilot.
 *
 * Visual Systems:
 * 1. AI Synapse Core: Pulsing gradient aura behind the logo representing agent cognition.
 * 2. Automation Orbit Ring: An orbital path with a high-speed telemetry packet rotating 360°
 *    representing background business workflows in flight.
 * 3. Living Swirl Body: Gentle organic breathing scale & micro-rotation of the primary "ai" swirl.
 * 4. Autonomous Satellite Orb: Floating, bobbing dot of the "i" with independent levitation physics.
 * 5. Interactive Touch Haptics: Tactile spring compression on tap.
 */
export function AnimatedAiLogo({
  size = 66,
  isDark = true,
  onPress,
}: AnimatedAiLogoProps) {
  // 1. Tactile press spring
  const pressScale = useRef(new Animated.Value(1)).current;

  // 2. Swirl body breathing
  const bodyBreathing = useRef(new Animated.Value(1)).current;

  // 3. Dot levitation (independent satellite floating)
  const dotFloating = useRef(new Animated.Value(0)).current;
  const dotScale = useRef(new Animated.Value(1)).current;

  // 4. Automation 360° orbital rotation
  const orbitRotation = useRef(new Animated.Value(0)).current;

  // 5. Ambient neural pulse wave
  const auraPulse = useRef(new Animated.Value(0.7)).current;
  const rippleScale = useRef(new Animated.Value(0.85)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Main body breathing loop (gentle sinusoidal breath)
    const bodyLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bodyBreathing, {
          toValue: 1.04,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bodyBreathing, {
          toValue: 0.98,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // 2. Satellite dot floating loop (levitating bobbing motion)
    const dotFloatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(dotFloating, {
          toValue: -3.5,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(dotFloating, {
          toValue: 2,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    // 3. Continuous 360° Automation Orbit
    const orbitLoop = Animated.loop(
      Animated.timing(orbitRotation, {
        toValue: 1,
        duration: 4800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // 4. Ambient neural aura glow breathing
    const auraLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(auraPulse, {
          toValue: 1.15,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(auraPulse, {
          toValue: 0.75,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // 5. Periodic AI synapsing ripple wave (emits every ~3.5s)
    const rippleLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(1000),
        Animated.parallel([
          Animated.timing(rippleScale, {
            toValue: 1.45,
            duration: 1600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(rippleOpacity, {
              toValue: 0.65,
              duration: 350,
              useNativeDriver: true,
            }),
            Animated.timing(rippleOpacity, {
              toValue: 0,
              duration: 1250,
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.timing(rippleScale, {
          toValue: 0.85,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(1200),
      ])
    );

    bodyLoop.start();
    dotFloatLoop.start();
    orbitLoop.start();
    auraLoop.start();
    rippleLoop.start();

    return () => {
      bodyLoop.stop();
      dotFloatLoop.stop();
      orbitLoop.stop();
      auraLoop.stop();
      rippleLoop.stop();
    };
  }, [bodyBreathing, dotFloating, dotScale, orbitRotation, auraPulse, rippleScale, rippleOpacity]);

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.9,
      useNativeDriver: true,
      tension: 300,
      friction: 12,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 250,
      friction: 10,
    }).start();
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress?.();
  };

  const orbitSpin = orbitRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const finalBodyScale = Animated.multiply(bodyBreathing, pressScale);
  const logoImageSize = Math.round(size * 0.80);

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="GetAiPilot AI Agent Automation"
      style={[
        styles.container,
        {
          width: size,
          height: size,
        },
      ]}
    >
      {/* 1. Synapse Neural Ripple Wave */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.synapseRipple,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale: rippleScale }],
            opacity: rippleOpacity,
            borderColor: isDark ? '#EC4899' : '#8B5CF6',
          },
        ]}
      />

      {/* 2. Ambient Core Neural Glow */}


      {/* 3. Automation Workflow Orbit Ring with Rotating Energy Packet */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.orbitRingContainer,
          {
            width: size,
            height: size,
            transform: [{ rotate: orbitSpin }],
          },
        ]}
      >

        {/* Orbiting Telemetry Data Packet */}
        <View
          style={[
            styles.orbitPacketWrapper,
            {
              top: 1,
              left: size / 2 - 4,
            },
          ]}
        >
          <View style={styles.orbitPacketCore} />
        </View>
      </Animated.View>

      {/* 4. Living AI Swirl Body */}
      <Animated.View
        style={[
          styles.bodyLayer,
          {
            width: logoImageSize,
            height: logoImageSize,
            transform: [{ scale: finalBodyScale }],
          },
        ]}
      >
        <Image
          source={require('../../../assets/images/logo_body.png')}
          style={{ width: logoImageSize, height: logoImageSize }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* 5. Autonomous Levitating Satellite Dot (The AI Brain) */}
      <Animated.View
        style={[
          styles.dotLayer,
          {
            width: logoImageSize,
            height: logoImageSize,
            transform: [
              { scale: Animated.multiply(dotScale, pressScale) },
              { translateY: dotFloating },
            ],
          },
        ]}
        pointerEvents="none"
      >
        <Image
          source={require('../../../assets/images/logo_dot.png')}
          style={{ width: logoImageSize, height: logoImageSize }}
          resizeMode="contain"
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  synapseRipple: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  ambientCoreGlow: {
    position: 'absolute',
    shadowColor: '#EC4899',
    shadowOpacity: 0.9,
    shadowRadius: 18,
    elevation: 8,
  },
  orbitRingContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitPacketWrapper: {
    position: 'absolute',
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitPacketCore: {
    width: 3.5,
    height: 3.5,
    borderRadius: 1.75,
    backgroundColor: '#FFFFFF',
  },
  bodyLayer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotLayer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
