import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

interface AnimatedCardHeaderGraphicsProps {
  productId: string;
  gradientColors: readonly [string, string];
  accent: string;
  isDark: boolean;
}

/**
 * Animated dynamic graphics with geometric half-circle top-right color effect:
 * - Top-Right Half Circle: Pure geometric semi-circle dome blooming from top-right edge.
 * - Telegram: Supersonic laser relay beam sweep & live telemetry radar waves.
 * - WhatsApp: Concentric broadcast ripple waves & floating neon data particles.
 * - Voice AI: Live 7-band rhythmic audio equalizer & acoustic soundwave arcs.
 * - Smart CRM: Upward pipeline trajectory graph with glowing data point traveler.
 * - Social Pilot: 360° rotating orbital constellation ring & viral twinkle stars.
 * + Universal diagonal holographic sheen sweep.
 */
export function AnimatedCardHeaderGraphics({
  productId,
  gradientColors,
  accent,
  isDark,
}: AnimatedCardHeaderGraphicsProps) {

  // --- Universal Specular Sheen Sweep ---
  const sheenTranslateX = useRef(new Animated.Value(-160)).current;

  // --- Telegram Animations: Relay laser & pulse ---
  const tgLaserX = useRef(new Animated.Value(-120)).current;
  const tgPulseScale = useRef(new Animated.Value(1)).current;
  const tgPulseOpacity = useRef(new Animated.Value(0.7)).current;

  // --- WhatsApp Animations: Multi-layer broadcast ripples ---
  const waRipple1 = useRef(new Animated.Value(0.4)).current;
  const waRipple1Opacity = useRef(new Animated.Value(0.8)).current;
  const waRipple2 = useRef(new Animated.Value(0.2)).current;
  const waRipple2Opacity = useRef(new Animated.Value(0.5)).current;
  const waParticleFloat = useRef(new Animated.Value(0)).current;

  // --- Voice AI Animations: 7 Equalizer Bars & soundwave arcs ---
  const eqBar1 = useRef(new Animated.Value(0.35)).current;
  const eqBar2 = useRef(new Animated.Value(0.75)).current;
  const eqBar3 = useRef(new Animated.Value(0.95)).current;
  const eqBar4 = useRef(new Animated.Value(0.55)).current;
  const eqBar5 = useRef(new Animated.Value(0.85)).current;
  const eqBar6 = useRef(new Animated.Value(0.4)).current;
  const eqBar7 = useRef(new Animated.Value(0.65)).current;
  const voiceAcousticWave = useRef(new Animated.Value(1)).current;

  // --- Smart CRM Animations: Ascending node beacon & graph pulse ---
  const crmBeaconProgress = useRef(new Animated.Value(0)).current;
  const crmGlowPulse = useRef(new Animated.Value(0.4)).current;

  // --- Social Pilot Animations: Orbital rotation & stars ---
  const socialOrbitRotation = useRef(new Animated.Value(0)).current;
  const socialStarTwinkle = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {

    // 2. Universal Holographic Glass Sheen Sweep (Every 4.5s)
    const sheenAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(sheenTranslateX, {
          toValue: 360,
          duration: 1800,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(2400),
        Animated.timing(sheenTranslateX, {
          toValue: -160,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    sheenAnim.start();

    // 3. Telegram Relay Laser Sweep
    const tgLaserAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(tgLaserX, {
          toValue: 320,
          duration: 2000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(1200),
        Animated.timing(tgLaserX, {
          toValue: -120,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    const tgPulseAnim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(tgPulseScale, {
            toValue: 2.1,
            duration: 1600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(tgPulseOpacity, {
            toValue: 0,
            duration: 1600,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(tgPulseScale, { toValue: 0.8, duration: 0, useNativeDriver: true }),
        Animated.timing(tgPulseOpacity, { toValue: 0.7, duration: 0, useNativeDriver: true }),
      ])
    );

    // 4. WhatsApp Broadcast Waves
    const waRipplesAnim = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.parallel([
            Animated.timing(waRipple1, { toValue: 2.4, duration: 2200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(waRipple1Opacity, { toValue: 0, duration: 2200, useNativeDriver: true }),
          ]),
          Animated.timing(waRipple1, { toValue: 0.3, duration: 0, useNativeDriver: true }),
          Animated.timing(waRipple1Opacity, { toValue: 0.8, duration: 0, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.delay(800),
          Animated.parallel([
            Animated.timing(waRipple2, { toValue: 2.2, duration: 2000, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(waRipple2Opacity, { toValue: 0, duration: 2000, useNativeDriver: true }),
          ]),
          Animated.timing(waRipple2, { toValue: 0.2, duration: 0, useNativeDriver: true }),
          Animated.timing(waRipple2Opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(waParticleFloat, { toValue: -6, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(waParticleFloat, { toValue: 4, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ])
    );

    // 5. Voice AI Equalizer Spectrum Oscillations
    const createEqLoop = (anim: Animated.Value, min: number, max: number, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: max, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(anim, { toValue: min, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );

    const voiceEqAnim = Animated.parallel([
      createEqLoop(eqBar1, 0.2, 0.7, 420),
      createEqLoop(eqBar2, 0.3, 1.0, 560),
      createEqLoop(eqBar3, 0.4, 0.95, 380),
      createEqLoop(eqBar4, 0.25, 0.85, 490),
      createEqLoop(eqBar5, 0.35, 1.0, 440),
      createEqLoop(eqBar6, 0.15, 0.65, 520),
      createEqLoop(eqBar7, 0.3, 0.9, 410),
      Animated.loop(
        Animated.sequence([
          Animated.timing(voiceAcousticWave, { toValue: 1.4, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(voiceAcousticWave, { toValue: 1.0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ),
    ]);

    // 6. Smart CRM Pipeline Node Traveler
    const crmAnim = Animated.parallel([
      Animated.loop(
        Animated.sequence([
          Animated.timing(crmBeaconProgress, {
            toValue: 1,
            duration: 2600,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.delay(400),
          Animated.timing(crmBeaconProgress, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(crmGlowPulse, { toValue: 0.9, duration: 1100, useNativeDriver: true }),
          Animated.timing(crmGlowPulse, { toValue: 0.35, duration: 1100, useNativeDriver: true }),
        ])
      ),
    ]);

    // 7. Social Pilot Constellation Orbit
    const socialAnim = Animated.parallel([
      Animated.loop(
        Animated.timing(socialOrbitRotation, {
          toValue: 1,
          duration: 7000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(socialStarTwinkle, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(socialStarTwinkle, { toValue: 0.25, duration: 800, useNativeDriver: true }),
        ])
      ),
    ]);

    tgLaserAnim.start();
    tgPulseAnim.start();
    waRipplesAnim.start();
    voiceEqAnim.start();
    crmAnim.start();
    socialAnim.start();

    return () => {
      sheenAnim.stop();
      tgLaserAnim.stop();
      tgPulseAnim.stop();
      waRipplesAnim.stop();
      voiceEqAnim.stop();
      crmAnim.stop();
      socialAnim.stop();
    };
  }, []);

  const spin = socialOrbitRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const crmTravelerX = crmBeaconProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 240],
  });

  const crmTravelerY = crmBeaconProgress.interpolate({
    inputRange: [0, 0.4, 0.7, 1],
    outputRange: [38, 26, 32, 14],
  });

  const primaryColor = gradientColors[0] || accent;
  const secondaryColor = gradientColors[1] || accent;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* ======================================================== */}
      {/* 1. RIGHT-TOP CORNER HALF-CIRCLE COLOR EFFECT             */}
      {/* Anchored at corner vertex: spans top edge & right side   */}
      {/* ======================================================== */}
      <View style={styles.curvyTopRightContainer}>
        <Svg width="140" height="105" viewBox="0 0 140 105">
          <Defs>
            {/* Main Vibrant Radial Half-Circle Gradient radiating from top-right corner */}
            <RadialGradient
              id={`halfCircleGrad_${productId}`}
              cx="140"
              cy="0"
              r="120"
            >
              <Stop
                offset="0%"
                stopColor={secondaryColor}
                stopOpacity={isDark ? '0.90' : '0.62'}
              />
              <Stop
                offset="45%"
                stopColor={primaryColor}
                stopOpacity={isDark ? '0.58' : '0.36'}
              />
              <Stop
                offset="80%"
                stopColor={accent}
                stopOpacity={isDark ? '0.24' : '0.14'}
              />
              <Stop offset="100%" stopColor={accent} stopOpacity="0" />
            </RadialGradient>

            {/* Ambient Outer Halo Gradient from top-right corner */}
            <RadialGradient
              id={`halfCircleSoft_${productId}`}
              cx="140"
              cy="0"
              r="140"
            >
              <Stop
                offset="0%"
                stopColor={secondaryColor}
                stopOpacity={isDark ? '0.45' : '0.26'}
              />
              <Stop
                offset="70%"
                stopColor={primaryColor}
                stopOpacity={isDark ? '0.18' : '0.08'}
              />
              <Stop offset="100%" stopColor={accent} stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Layer A: Ambient outer glowing half-circle halo (spans top & side of right) */}
          <Path
            d="M 140 0 L 4 0 A 136 102 0 0 1 140 102 Z"
            fill={`url(#halfCircleSoft_${productId})`}
          />

          {/* Layer B: Main geometric curved half-circle corner dome */}
          <Path
            d="M 140 0 L 22 0 A 118 88 0 0 1 140 88 Z"
            fill={`url(#halfCircleGrad_${productId})`}
          />

          {/* Layer C: Specular glowing circular perimeter line from top to right side */}
          <Path
            d="M 22 0 A 118 88 0 0 1 140 88"
            stroke={secondaryColor}
            strokeWidth="1.8"
            strokeOpacity={isDark ? '0.8' : '0.5'}
            fill="none"
          />

          {/* Layer D: Concentric dashed micro cyber arc */}
          <Path
            d="M 58 0 A 82 60 0 0 1 140 60"
            stroke={primaryColor}
            strokeWidth="1.2"
            strokeDasharray="4 3"
            strokeOpacity={isDark ? '0.6' : '0.35'}
            fill="none"
          />

          {/* Layer E: Glowing corner core point */}
          <Path
            d="M 140 0 L 96 0 A 44 34 0 0 1 140 34 Z"
            fill={accent}
            opacity={isDark ? 0.42 : 0.25}
          />
        </Svg>
      </View>

      {/* ======================================================== */}
      {/* 2. PRODUCT-SPECIFIC ANIMATED SCENES                      */}
      {/* ======================================================== */}

      {/* === A. TELEGRAM: Supersonic Relay Beams & Radar Ring === */}
      {productId === 'telegram' && (
        <View style={StyleSheet.absoluteFill}>
          {/* Radar beacon behind logo orb */}
          <Animated.View
            style={[
              styles.radarRing,
              {
                left: 18,
                top: 14,
                borderColor: accent,
                transform: [{ scale: tgPulseScale }],
                opacity: tgPulseOpacity,
              },
            ]}
          />

          {/* Sweeping Neon Laser Beam */}
          <Animated.View
            style={[
              styles.laserBeamContainer,
              {
                transform: [{ translateX: tgLaserX }],
              },
            ]}
          >
            <LinearGradient
              colors={['transparent', accent, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.laserBeam, { opacity: isDark ? 0.35 : 0.2 }]}
            />
          </Animated.View>

          {/* Diagonal Telemetry Stream Lines */}
          <Svg style={StyleSheet.absoluteFill} viewBox="0 0 300 64">
            <Path
              d="M 50 48 L 140 26 L 220 34 L 290 16"
              stroke={accent}
              strokeWidth="1.2"
              strokeDasharray="4 4"
              fill="none"
              opacity={isDark ? 0.35 : 0.25}
            />
          </Svg>
        </View>
      )}

      {/* === B. WHATSAPP: Expanding Concentric Broadcast Ripples === */}
      {productId === 'whatsapp' && (
        <View style={StyleSheet.absoluteFill}>
          {/* Expanding Ripple Wave 1 */}
          <Animated.View
            style={[
              styles.waRipple,
              {
                borderColor: accent,
                transform: [{ scale: waRipple1 }],
                opacity: waRipple1Opacity,
              },
            ]}
          />
          {/* Expanding Ripple Wave 2 */}
          <Animated.View
            style={[
              styles.waRipple,
              {
                borderColor: accent,
                transform: [{ scale: waRipple2 }],
                opacity: waRipple2Opacity,
              },
            ]}
          />

          {/* Floating Message Signal Dots */}
          <Animated.View
            style={[
              styles.floatingDot,
              {
                right: 36,
                top: 18,
                backgroundColor: accent,
                transform: [{ translateY: waParticleFloat }],
                opacity: isDark ? 0.8 : 0.6,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.floatingDot,
              {
                right: 70,
                top: 36,
                width: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor: accent,
                transform: [{ translateY: Animated.multiply(waParticleFloat, -0.8) }],
                opacity: isDark ? 0.6 : 0.45,
              },
            ]}
          />
        </View>
      )}

      {/* === C. VOICE AI: Live 7-Band Equalizer Spectrum === */}
      {productId === 'voice' && (
        <View style={StyleSheet.absoluteFill}>
          {/* Pulsing Acoustic Soundwave Arc */}
          <Animated.View
            style={[
              styles.acousticArc,
              {
                borderColor: accent,
                transform: [{ scale: voiceAcousticWave }],
                opacity: isDark ? 0.45 : 0.3,
              },
            ]}
          />

          {/* 7-Band Visualizer Equalizer positioned at right corner */}
          <View style={styles.equalizerContainer}>
            {[
              { anim: eqBar1, height: 26 },
              { anim: eqBar2, height: 32 },
              { anim: eqBar3, height: 34 },
              { anim: eqBar4, height: 28 },
              { anim: eqBar5, height: 36 },
              { anim: eqBar6, height: 24 },
              { anim: eqBar7, height: 30 },
            ].map((bar, bIdx) => (
              <Animated.View
                key={bIdx}
                style={[
                  styles.eqBar,
                  {
                    height: bar.height,
                    backgroundColor: accent,
                    opacity: isDark ? 0.8 : 0.6,
                    transform: [{ scaleY: bar.anim }],
                  },
                ]}
              />
            ))}
          </View>
        </View>
      )}

      {/* === D. SMART CRM: Ascending Pipeline Vector with Beacon === */}
      {productId === 'crm' && (
        <View style={StyleSheet.absoluteFill}>
          {/* Ascending Pipeline Trajectory */}
          <Svg style={StyleSheet.absoluteFill} viewBox="0 0 300 64">
            <Path
              d="M 20 40 Q 90 42 130 28 T 240 14"
              stroke={accent}
              strokeWidth="2"
              fill="none"
              opacity={isDark ? 0.45 : 0.3}
            />
            {/* Target Milestone Nodes */}
            <Circle cx="130" cy="28" r="3.5" fill={accent} opacity={0.7} />
            <Circle cx="240" cy="14" r="4.5" fill={accent} opacity={0.9} />
          </Svg>

          {/* Traveling Golden Deal Beacon */}
          <Animated.View
            style={[
              styles.crmBeacon,
              {
                backgroundColor: accent,
                shadowColor: accent,
                transform: [
                  { translateX: crmTravelerX },
                  { translateY: crmTravelerY },
                ],
                opacity: crmGlowPulse,
              },
            ]}
          />
        </View>
      )}

      {/* === E. SOCIAL PILOT: Orbital Constellation Ring & Star Twinkles === */}
      {productId === 'social' && (
        <View style={StyleSheet.absoluteFill}>
          {/* Continuously Rotating Satellite Orbit Ring */}
          <Animated.View
            style={[
              styles.socialOrbitRing,
              {
                borderColor: accent,
                opacity: isDark ? 0.45 : 0.3,
                transform: [{ rotate: spin }],
              },
            ]}
          >
            <View style={[styles.orbitSatelliteDot, { backgroundColor: accent }]} />
            <View style={[styles.orbitSatelliteDot, { top: 40, left: 2, backgroundColor: accent }]} />
          </Animated.View>

          {/* Twinkling Viral Reach Star Glints */}
          <Animated.View
            style={[
              styles.twinkleStar,
              {
                right: 32,
                top: 14,
                opacity: socialStarTwinkle,
              },
            ]}
          >
            <Svg width="14" height="14" viewBox="0 0 16 16">
              <Path
                d="M 8 0 L 9.8 6.2 L 16 8 L 9.8 9.8 L 8 16 L 6.2 9.8 L 0 8 L 6.2 6.2 Z"
                fill={accent}
              />
            </Svg>
          </Animated.View>

          <Animated.View
            style={[
              styles.twinkleStar,
              {
                right: 74,
                top: 32,
                opacity: Animated.multiply(socialStarTwinkle, 0.7),
              },
            ]}
          >
            <Svg width="10" height="10" viewBox="0 0 16 16">
              <Path
                d="M 8 0 L 9.8 6.2 L 16 8 L 9.8 9.8 L 8 16 L 6.2 9.8 L 0 8 L 6.2 6.2 Z"
                fill={accent}
              />
            </Svg>
          </Animated.View>
        </View>
      )}

      {/* 3. Universal Diagonal Glass Holographic Sheen Sweep */}
      <Animated.View
        style={[
          styles.sheenBar,
          {
            transform: [{ translateX: sheenTranslateX }, { rotate: '25deg' }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            'transparent',
            isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
            isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.05)',
            isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  curvyTopRightContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 140,
    height: 105,
    overflow: 'hidden',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  sheenBar: {
    position: 'absolute',
    top: -40,
    bottom: -40,
    width: 65,
    opacity: 0.85,
  },

  // Telegram Styles
  radarRing: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  laserBeamContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 90,
  },
  laserBeam: {
    width: '100%',
    height: '100%',
  },

  // WhatsApp Styles
  waRipple: {
    position: 'absolute',
    left: 18,
    top: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  floatingDot: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },

  // Voice AI Styles
  equalizerContainer: {
    position: 'absolute',
    right: 14,
    top: 14,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
  },
  eqBar: {
    width: 3,
    borderRadius: 2,
  },
  acousticArc: {
    position: 'absolute',
    left: 14,
    top: 8,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
  },

  // CRM Styles
  crmBeacon: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 4.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 4,
  },

  // Social Pilot Styles
  socialOrbitRing: {
    position: 'absolute',
    right: 20,
    top: 6,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitSatelliteDot: {
    position: 'absolute',
    top: 0,
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
  },
  twinkleStar: {
    position: 'absolute',
  },
});
