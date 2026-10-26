import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

interface EnvironmentProps {
  productId: string;
  accent: string;
  isDark: boolean;
}

/**
 * 1. TELEGRAM: Cybernetic Fiber-Optic Highway & Dual Hyper-Stream Photons
 * - Continuous high-speed data stream across circuit rails
 * - Dual staggered glowing photon pulses with trailing neon auras
 * - 4 pulsating relay beacon nodes that flare as data packets traverse
 */
function TelegramBottomEnvironment({ isDark }: { accent: string; isDark: boolean }) {
  const photon1TranslateX = useRef(new Animated.Value(0)).current;
  const photon1Opacity = useRef(new Animated.Value(0)).current;
  const photon2TranslateX = useRef(new Animated.Value(0)).current;
  const photon2Opacity = useRef(new Animated.Value(0)).current;
  const beaconPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Photon 1 loop (Fast primary packet)
    const p1Anim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.sequence([
            Animated.timing(photon1Opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.delay(1200),
            Animated.timing(photon1Opacity, { toValue: 0, duration: 350, useNativeDriver: true }),
          ]),
          Animated.timing(photon1TranslateX, {
            toValue: 220,
            duration: 1800,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(photon1TranslateX, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(300),
      ])
    );

    // Photon 2 loop (Staggered trailing secondary packet)
    const p2Anim = Animated.loop(
      Animated.sequence([
        Animated.delay(650),
        Animated.parallel([
          Animated.sequence([
            Animated.timing(photon2Opacity, { toValue: 0.9, duration: 250, useNativeDriver: true }),
            Animated.delay(1300),
            Animated.timing(photon2Opacity, { toValue: 0, duration: 350, useNativeDriver: true }),
          ]),
          Animated.timing(photon2TranslateX, {
            toValue: 220,
            duration: 1900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(photon2TranslateX, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(200),
      ])
    );

    // Beacons breathing pulse
    const beaconAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(beaconPulse, { toValue: 1.35, duration: 900, useNativeDriver: true }),
        Animated.timing(beaconPulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );

    p1Anim.start();
    p2Anim.start();
    beaconAnim.start();

    return () => {
      p1Anim.stop();
      p2Anim.stop();
      beaconAnim.stop();
    };
  }, [photon1TranslateX, photon1Opacity, photon2TranslateX, photon2Opacity, beaconPulse]);

  return (
    <View style={styles.envContainer}>
      <LinearGradient
        colors={[
          'transparent',
          isDark ? 'rgba(2, 132, 199, 0.28)' : 'rgba(2, 132, 199, 0.10)',
        ]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.stageFrame}>
        <Svg width="100%" height="48" viewBox="0 0 260 48">
          <Defs>
            <SvgGradient id="tgMainRail" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor="#38BDF8" stopOpacity="0.15" />
              <Stop offset="25%" stopColor="#0284C7" stopOpacity="0.85" />
              <Stop offset="75%" stopColor="#38BDF8" stopOpacity="0.9" />
              <Stop offset="100%" stopColor="#0284C7" stopOpacity="0.2" />
            </SvgGradient>
            <SvgGradient id="tgBeamGlow" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor="#BAE6FD" stopOpacity="0" />
              <Stop offset="50%" stopColor="#38BDF8" stopOpacity="0.5" />
              <Stop offset="100%" stopColor="#BAE6FD" stopOpacity="0" />
            </SvgGradient>
          </Defs>

          {/* Underglow ambient beam */}
          <Path
            d="M 12 24 L 248 24"
            stroke="url(#tgBeamGlow)"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Primary fiber optic bus */}
          <Path
            d="M 14 24 L 246 24"
            stroke="url(#tgMainRail)"
            strokeWidth="2.4"
            strokeDasharray="6 3"
          />

          {/* Top high-speed routing loop */}
          <Path
            d="M 38 24 C 65 10 95 10 125 24 C 155 38 185 38 215 24"
            stroke="#38BDF8"
            strokeWidth="1.4"
            strokeDasharray="4 4"
            fill="none"
            opacity="0.6"
          />

          {/* Secondary micro circuit traces */}
          <Path
            d="M 60 24 L 75 14 L 110 14"
            stroke="#0284C7"
            strokeWidth="1.2"
            fill="none"
            opacity="0.5"
          />
          <Path
            d="M 150 24 L 165 34 L 195 34"
            stroke="#0284C7"
            strokeWidth="1.2"
            fill="none"
            opacity="0.5"
          />

          {/* Circuit connection pads */}
          <Circle cx="110" cy="14" r="2.5" fill="#38BDF8" />
          <Circle cx="195" cy="34" r="2.5" fill="#38BDF8" />

          {/* Relay Node Beacons */}
          <Circle cx="38" cy="24" r="4.5" fill="#38BDF8" />
          <Circle cx="125" cy="24" r="6" fill="#0284C7" />
          <Circle cx="125" cy="24" r="2.5" fill="#FFFFFF" />
          <Circle cx="215" cy="24" r="4.5" fill="#38BDF8" />
        </Svg>

        {/* Pulsing Beacon Halo around Center Node */}
        <Animated.View
          style={[
            styles.tgCenterHalo,
            {
              transform: [{ scale: beaconPulse }],
              opacity: beaconPulse.interpolate({
                inputRange: [1, 1.35],
                outputRange: [0.7, 0.1],
              }),
            },
          ]}
        />

        {/* Photon 1: Cyan High-Energy Packet */}
        <Animated.View
          style={[
            styles.photonWrapper,
            {
              transform: [{ translateX: photon1TranslateX }],
              opacity: photon1Opacity,
            },
          ]}
        >
          <View style={[styles.photonAura, { backgroundColor: '#38BDF8' }]} />
          <View style={styles.photonCore} />
        </Animated.View>

        {/* Photon 2: Trailing Sky-Blue Packet */}
        <Animated.View
          style={[
            styles.photonWrapper,
            {
              transform: [{ translateX: photon2TranslateX }],
              opacity: photon2Opacity,
            },
          ]}
        >
          <View style={[styles.photonAura, { backgroundColor: '#7DD3FC', width: 12, height: 12 }]} />
          <View style={[styles.photonCore, { width: 5, height: 5 }]} />
        </Animated.View>
      </View>
    </View>
  );
}

/**
 * 2. WHATSAPP: Radial Sonar Acoustic Field & Floating Micro-Message Nodes
 * - Triple concentric expanding sonar ripples
 * - Floating neon emerald message nodes bobbing organically
 * - Central quantum transceiver beacon
 */
function WhatsAppBottomEnvironment({ isDark }: { accent: string; isDark: boolean }) {
  const pulse1 = useRef(new Animated.Value(0.3)).current;
  const pulse2 = useRef(new Animated.Value(0.3)).current;
  const pulse3 = useRef(new Animated.Value(0.3)).current;
  const floatOrb1 = useRef(new Animated.Value(0)).current;
  const floatOrb2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makeRipple = (val: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 2.1,
            duration: 2100,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(val, { toValue: 0.3, duration: 0, useNativeDriver: true }),
        ])
      );
    };

    const r1 = makeRipple(pulse1, 0);
    const r2 = makeRipple(pulse2, 700);
    const r3 = makeRipple(pulse3, 1400);

    // Floating bobbing motion for side message nodes
    const makeBobbing = (val: Animated.Value, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: -5,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 5,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
    };

    const b1 = makeBobbing(floatOrb1, 1400);
    const b2 = makeBobbing(floatOrb2, 1700);

    r1.start();
    r2.start();
    r3.start();
    b1.start();
    b2.start();

    return () => {
      r1.stop();
      r2.stop();
      r3.stop();
      b1.stop();
      b2.stop();
    };
  }, [pulse1, pulse2, pulse3, floatOrb1, floatOrb2]);

  return (
    <View style={styles.envContainer}>
      <LinearGradient
        colors={[
          'transparent',
          isDark ? 'rgba(16, 185, 129, 0.28)' : 'rgba(16, 185, 129, 0.10)',
        ]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.stageFrame}>
        <Svg width="100%" height="48" viewBox="0 0 260 48">
          <Defs>
            <SvgGradient id="waArchGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor="#34D399" stopOpacity="0.2" />
              <Stop offset="50%" stopColor="#10B981" stopOpacity="0.9" />
              <Stop offset="100%" stopColor="#34D399" stopOpacity="0.2" />
            </SvgGradient>
          </Defs>

          {/* Curved Resonance Acoustic Arcs */}
          <Path
            d="M 20 36 C 80 12 180 12 240 36"
            stroke="url(#waArchGrad)"
            strokeWidth="2.2"
            fill="none"
          />
          <Path
            d="M 45 38 C 95 22 165 22 215 38"
            stroke="#34D399"
            strokeWidth="1.2"
            strokeDasharray="5 3"
            fill="none"
            opacity="0.65"
          />

          {/* Acoustic Ground Nodes */}
          <Circle cx="20" cy="36" r="3.5" fill="#34D399" />
          <Circle cx="240" cy="36" r="3.5" fill="#34D399" />

          {/* Central Emitter Node Base */}
          <Circle cx="130" cy="18" r="7" fill="#10B981" />
          <Circle cx="130" cy="18" r="3" fill="#FFFFFF" />
        </Svg>

        {/* 3 Concentric Sonar Pulse Rings */}
        {[pulse1, pulse2, pulse3].map((pulseVal, i) => (
          <Animated.View
            key={i}
            style={[
              styles.waSonarRing,
              {
                transform: [{ scale: pulseVal }],
                opacity: pulseVal.interpolate({
                  inputRange: [0.3, 1.2, 2.1],
                  outputRange: [0.85, 0.45, 0],
                }),
              },
            ]}
          />
        ))}

        {/* Left Floating Message Pod */}
        <Animated.View
          style={[
            styles.waLeftPod,
            { transform: [{ translateY: floatOrb1 }] },
          ]}
        >
          <View style={styles.podGlow} />
          <View style={styles.podCoreEmerald} />
        </Animated.View>

        {/* Right Floating Message Pod */}
        <Animated.View
          style={[
            styles.waRightPod,
            { transform: [{ translateY: floatOrb2 }] },
          ]}
        >
          <View style={styles.podGlow} />
          <View style={styles.podCoreMint} />
        </Animated.View>
      </View>
    </View>
  );
}

/**
 * 3. VOICE AI: 17-Band Organic Dancing Equalizer & Floating Vocal Embers
 * - 17 spectrum bars dancing across decoupled frequency channels
 * - Glowing floating sound ember sparks rising up from the soundwave
 * - Neon purple / fuchsia energetic gradient wave
 */
function VoiceAIBottomEnvironment({ accent, isDark }: { accent: string; isDark: boolean }) {
  const barAnim1 = useRef(new Animated.Value(1)).current;
  const barAnim2 = useRef(new Animated.Value(1)).current;
  const barAnim3 = useRef(new Animated.Value(1)).current;
  const barAnim4 = useRef(new Animated.Value(1)).current;
  const sparkAnim1 = useRef(new Animated.Value(0)).current;
  const sparkAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makeDance = (anim: Animated.Value, maxScale: number, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: maxScale,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
    };

    const d1 = makeDance(barAnim1, 1.85, 380);
    const d2 = makeDance(barAnim2, 2.1, 520);
    const d3 = makeDance(barAnim3, 1.6, 440);
    const d4 = makeDance(barAnim4, 1.95, 600);

    // Drifting vocal embers
    const makeSpark = (val: Animated.Value, delay: number, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(val, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
    };

    const s1 = makeSpark(sparkAnim1, 0, 1500);
    const s2 = makeSpark(sparkAnim2, 600, 1800);

    d1.start();
    d2.start();
    d3.start();
    d4.start();
    s1.start();
    s2.start();

    return () => {
      d1.stop();
      d2.stop();
      d3.stop();
      d4.stop();
      s1.stop();
      s2.stop();
    };
  }, [barAnim1, barAnim2, barAnim3, barAnim4, sparkAnim1, sparkAnim2]);

  const bars = [
    { baseH: 8, anim: barAnim1 },
    { baseH: 12, anim: barAnim3 },
    { baseH: 18, anim: barAnim2 },
    { baseH: 26, anim: barAnim4 },
    { baseH: 15, anim: barAnim1 },
    { baseH: 30, anim: barAnim2 },
    { baseH: 22, anim: barAnim3 },
    { baseH: 34, anim: barAnim4 },
    { baseH: 24, anim: barAnim1 },
    { baseH: 34, anim: barAnim2 },
    { baseH: 22, anim: barAnim3 },
    { baseH: 28, anim: barAnim4 },
    { baseH: 16, anim: barAnim1 },
    { baseH: 24, anim: barAnim2 },
    { baseH: 18, anim: barAnim3 },
    { baseH: 12, anim: barAnim4 },
    { baseH: 8, anim: barAnim1 },
  ];

  return (
    <View style={styles.envContainer}>
      <LinearGradient
        colors={[
          'transparent',
          isDark ? 'rgba(147, 51, 234, 0.28)' : 'rgba(147, 51, 234, 0.10)',
        ]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.stageFrame}>
        {/* Equalizer Waveform Cluster */}
        <View style={styles.equalizerRow}>
          {bars.map((bar, idx) => (
            <Animated.View
              key={idx}
              style={[
                styles.eqBar,
                {
                  height: bar.baseH,
                  backgroundColor:
                    idx % 3 === 0
                      ? '#E879F9'
                      : idx % 2 === 0
                      ? accent
                      : isDark
                      ? '#C084FC'
                      : '#9333EA',
                  opacity: 0.65 + (idx % 3) * 0.12,
                  transform: [{ scaleY: bar.anim }],
                },
              ]}
            />
          ))}
        </View>

        {/* Floating Vocal Ember Spark 1 */}
        <Animated.View
          style={[
            styles.vocalEmber,
            {
              left: 95,
              transform: [
                {
                  translateY: sparkAnim1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, -10],
                  }),
                },
                {
                  translateX: sparkAnim1.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 6, -2],
                  }),
                },
              ],
              opacity: sparkAnim1.interpolate({
                inputRange: [0, 0.2, 0.8, 1],
                outputRange: [0, 1, 0.8, 0],
              }),
            },
          ]}
        />

        {/* Floating Vocal Ember Spark 2 */}
        <Animated.View
          style={[
            styles.vocalEmber,
            {
              left: 155,
              transform: [
                {
                  translateY: sparkAnim2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, -12],
                  }),
                },
                {
                  translateX: sparkAnim2.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, -6, 3],
                  }),
                },
              ],
              opacity: sparkAnim2.interpolate({
                inputRange: [0, 0.2, 0.8, 1],
                outputRange: [0, 1, 0.8, 0],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

/**
 * 4. SMART CRM: 4-Stage Pipeline Conduit & Golden Token Victory Explosion
 * - Multi-stage pipeline rail with glowing connectors
 * - Glowing gold deal token traveling from stage to stage
 * - Goal node with dual bursting victory ripples
 * - Twinkling gold milestone stars
 */
function CRMBottomEnvironment({ accent, isDark }: { accent: string; isDark: boolean }) {
  const flowProgress = useRef(new Animated.Value(0)).current;
  const victoryHalo = useRef(new Animated.Value(1)).current;
  const starTwinkle = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Deal flow loop
    const flowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flowProgress, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(350),
        Animated.timing(flowProgress, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );

    // Goal victory halo burst
    const haloLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(victoryHalo, { toValue: 2.2, duration: 1100, useNativeDriver: true }),
        Animated.timing(victoryHalo, { toValue: 1, duration: 1100, useNativeDriver: true }),
      ])
    );

    // Star twinkle loop
    const starLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(starTwinkle, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(starTwinkle, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );

    flowLoop.start();
    haloLoop.start();
    starLoop.start();

    return () => {
      flowLoop.stop();
      haloLoop.stop();
      starLoop.stop();
    };
  }, [flowProgress, victoryHalo, starTwinkle]);

  return (
    <View style={styles.envContainer}>
      <LinearGradient
        colors={[
          'transparent',
          isDark ? 'rgba(245, 158, 11, 0.28)' : 'rgba(245, 158, 11, 0.10)',
        ]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.stageFrame}>
        <View style={styles.pipelineConduitTrack}>
          {/* Stage 1: Lead Capture */}
          <View style={[styles.stageNode, { backgroundColor: accent, borderColor: '#FDE68A' }]} />
          <View
            style={[
              styles.pipeConnector,
              { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.45)' : 'rgba(245, 158, 11, 0.35)' },
            ]}
          />

          {/* Stage 2: Qualified */}
          <View style={[styles.stageNode, { backgroundColor: accent, borderColor: '#FDE68A' }]} />
          <View
            style={[
              styles.pipeConnector,
              { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.45)' : 'rgba(245, 158, 11, 0.35)' },
            ]}
          />

          {/* Stage 3: Proposal */}
          <View style={[styles.stageNode, { backgroundColor: accent, borderColor: '#FDE68A' }]} />
          <View
            style={[
              styles.pipeConnector,
              { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.45)' : 'rgba(245, 158, 11, 0.35)' },
            ]}
          />

          {/* Stage 4: Closed Won with Dual Victory Halo */}
          <View style={styles.wonNodeContainer}>
            <Animated.View
              style={[
                styles.wonHaloRing,
                {
                  transform: [{ scale: victoryHalo }],
                  opacity: victoryHalo.interpolate({
                    inputRange: [1, 2.2],
                    outputRange: [0.75, 0],
                  }),
                },
              ]}
            />
            <View style={[styles.wonNodeCore, { backgroundColor: '#10B981', borderColor: '#6EE7B7' }]}>
              <View style={styles.wonInnerDot} />
            </View>
          </View>

          {/* Animated Gold Deal Coin Particle */}
          <Animated.View
            style={[
              styles.travelingDealCoin,
              {
                transform: [
                  {
                    translateX: flowProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 184],
                    }),
                  },
                ],
                opacity: flowProgress.interpolate({
                  inputRange: [0, 0.08, 0.92, 1],
                  outputRange: [0, 1, 1, 0],
                }),
              },
            ]}
          >
            <View style={styles.coinGlow} />
            <View style={styles.coinCenter} />
          </Animated.View>
        </View>

        {/* Twinkling Gold Stars */}
        <Animated.View style={[styles.crmStar1, { opacity: starTwinkle }]} />
        <Animated.View
          style={[
            styles.crmStar2,
            {
              opacity: starTwinkle.interpolate({
                inputRange: [0.3, 1],
                outputRange: [1, 0.3],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

/**
 * 5. SOCIAL PILOT: Multi-Orbit Galaxy Relay & Gliding Cosmic Satellite
 * - Dual elliptical galaxy orbit tracks
 * - Gliding satellite with glowing aura orbiting smoothly
 * - Shooting star comet streak
 * - Twinkling cosmic constellation star cluster
 */
function SocialBottomEnvironment({ isDark }: { accent: string; isDark: boolean }) {
  const satelliteProgress = useRef(new Animated.Value(0)).current;
  const meteorProgress = useRef(new Animated.Value(0)).current;
  const starPulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Satellite elliptical glide
    const orbitLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(satelliteProgress, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(200),
        Animated.timing(satelliteProgress, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );

    // Fast shooting star / comet flash
    const meteorLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(meteorProgress, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(meteorProgress, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(1500),
      ])
    );

    // Galaxy constellation stars twinkling
    const starLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(starPulse, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(starPulse, { toValue: 0.3, duration: 850, useNativeDriver: true }),
      ])
    );

    orbitLoop.start();
    meteorLoop.start();
    starLoop.start();

    return () => {
      orbitLoop.stop();
      meteorLoop.stop();
      starLoop.stop();
    };
  }, [satelliteProgress, meteorProgress, starPulse]);

  return (
    <View style={styles.envContainer}>
      <LinearGradient
        colors={[
          'transparent',
          isDark ? 'rgba(236, 72, 153, 0.28)' : 'rgba(236, 72, 153, 0.10)',
        ]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.stageFrame}>
        <Svg width="100%" height="48" viewBox="0 0 260 48">
          <Defs>
            <SvgGradient id="socialOrbitGrad1" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor="#F472B6" stopOpacity="0.2" />
              <Stop offset="50%" stopColor="#EC4899" stopOpacity="0.9" />
              <Stop offset="100%" stopColor="#F472B6" stopOpacity="0.2" />
            </SvgGradient>
            <SvgGradient id="socialOrbitGrad2" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor="#EC4899" stopOpacity="0.1" />
              <Stop offset="50%" stopColor="#FB7185" stopOpacity="0.6" />
              <Stop offset="100%" stopColor="#EC4899" stopOpacity="0.1" />
            </SvgGradient>
          </Defs>

          {/* Primary Curved Planetary Orbit */}
          <Path
            d="M 16 34 Q 130 8 244 34"
            stroke="url(#socialOrbitGrad1)"
            strokeWidth="2.2"
            fill="none"
          />

          {/* Intersecting Secondary Orbit Stream */}
          <Path
            d="M 28 18 Q 130 42 232 18"
            stroke="url(#socialOrbitGrad2)"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            fill="none"
          />

          {/* Planetary Anchor Nodes */}
          <Circle cx="50" cy="27" r="4.5" fill="#F472B6" />
          <Circle cx="130" cy="21" r="6" fill="#EC4899" />
          <Circle cx="130" cy="21" r="2.5" fill="#FFFFFF" />
          <Circle cx="210" cy="27" r="4.5" fill="#F472B6" />
        </Svg>

        {/* Gliding Satellite Node traversing orbit */}
        <Animated.View
          style={[
            styles.glidingSatellite,
            {
              transform: [
                {
                  translateX: satelliteProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 224],
                  }),
                },
                {
                  translateY: satelliteProgress.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [10, -7, 10],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.satelliteGlow} />
          <View style={styles.satelliteBody} />
        </Animated.View>

        {/* Shooting Star / Comet Streak */}
        <Animated.View
          style={[
            styles.shootingComet,
            {
              transform: [
                {
                  translateX: meteorProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 210],
                  }),
                },
                {
                  translateY: meteorProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-6, 12],
                  }),
                },
              ],
              opacity: meteorProgress.interpolate({
                inputRange: [0, 0.2, 0.8, 1],
                outputRange: [0, 1, 0.9, 0],
              }),
            },
          ]}
        >
          <View style={styles.cometHead} />
          <View style={styles.cometTail} />
        </Animated.View>

        {/* Twinkling Constellation Stars */}
        <Animated.View style={[styles.galaxyStar1, { opacity: starPulse }]} />
        <Animated.View
          style={[
            styles.galaxyStar2,
            {
              opacity: starPulse.interpolate({
                inputRange: [0.3, 1],
                outputRange: [1, 0.3],
              }),
            },
          ]}
        />
        <Animated.View style={[styles.galaxyStar3, { opacity: starPulse }]} />
      </View>
    </View>
  );
}

/**
 * Dispatcher to render the contextual visual environment with living animation
 */
export function ProductBottomEnvironment({
  productId,
  accent,
  isDark,
}: EnvironmentProps) {
  switch (productId) {
    case 'telegram':
      return <TelegramBottomEnvironment accent={accent} isDark={isDark} />;
    case 'whatsapp':
      return <WhatsAppBottomEnvironment accent={accent} isDark={isDark} />;
    case 'voice':
      return <VoiceAIBottomEnvironment accent={accent} isDark={isDark} />;
    case 'crm':
      return <CRMBottomEnvironment accent={accent} isDark={isDark} />;
    case 'social':
      return <SocialBottomEnvironment accent={accent} isDark={isDark} />;
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  envContainer: {
    height: 58,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  stageFrame: {
    width: '100%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  // 1. Telegram
  tgCenterHalo: {
    position: 'absolute',
    left: 121,
    top: 15,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#38BDF8',
  },
  photonWrapper: {
    position: 'absolute',
    left: 12,
    top: 17,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photonAura: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    opacity: 0.6,
    shadowColor: '#38BDF8',
    shadowOpacity: 0.9,
    shadowRadius: 5,
  },
  photonCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },

  // 2. WhatsApp
  waSonarRing: {
    position: 'absolute',
    left: 122,
    top: 10,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#34D399',
  },
  waLeftPod: {
    position: 'absolute',
    left: 45,
    top: 18,
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waRightPod: {
    position: 'absolute',
    right: 45,
    top: 18,
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podGlow: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    opacity: 0.45,
  },
  podCoreEmerald: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  podCoreMint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6EE7B7',
  },

  // 3. Voice AI
  equalizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4.5,
    height: 48,
  },
  eqBar: {
    width: 4,
    borderRadius: 2,
  },
  vocalEmber: {
    position: 'absolute',
    top: 12,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F0ABFC',
    shadowColor: '#E879F9',
    shadowRadius: 4,
    shadowOpacity: 0.9,
  },

  // 4. Smart CRM
  pipelineConduitTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 22,
    height: 48,
    position: 'relative',
  },
  stageNode: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.2,
  },
  pipeConnector: {
    flex: 1,
    height: 2.2,
    marginHorizontal: 5,
    borderRadius: 1.1,
  },
  wonNodeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    position: 'relative',
  },
  wonHaloRing: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
  },
  wonNodeCore: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wonInnerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },
  travelingDealCoin: {
    position: 'absolute',
    left: 24,
    top: 19,
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinGlow: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F59E0B',
    opacity: 0.6,
  },
  coinCenter: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FEF08A',
  },
  crmStar1: {
    position: 'absolute',
    left: 70,
    top: 6,
    width: 3.5,
    height: 3.5,
    borderRadius: 1.75,
    backgroundColor: '#FDE68A',
  },
  crmStar2: {
    position: 'absolute',
    right: 80,
    top: 8,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FCD34D',
  },

  // 5. Social Pilot
  glidingSatellite: {
    position: 'absolute',
    left: 10,
    top: 15,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  satelliteGlow: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F472B6',
    opacity: 0.6,
    shadowColor: '#EC4899',
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  satelliteBody: {
    width: 5.5,
    height: 5.5,
    borderRadius: 2.75,
    backgroundColor: '#FFFFFF',
  },
  shootingComet: {
    position: 'absolute',
    left: 0,
    top: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cometHead: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  cometTail: {
    width: 16,
    height: 1.5,
    backgroundColor: '#F472B6',
    borderRadius: 1,
    opacity: 0.7,
  },
  galaxyStar1: {
    position: 'absolute',
    left: 36,
    top: 8,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FDF2F8',
  },
  galaxyStar2: {
    position: 'absolute',
    right: 36,
    top: 10,
    width: 3.5,
    height: 3.5,
    borderRadius: 1.75,
    backgroundColor: '#FCE7F3',
  },
  galaxyStar3: {
    position: 'absolute',
    left: 175,
    top: 6,
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: '#FFFFFF',
  },
});
