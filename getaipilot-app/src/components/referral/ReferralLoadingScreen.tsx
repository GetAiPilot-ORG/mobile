import { Image } from "expo-image";
import { Coins, Crown, Gift, Share2, Sparkles } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Defs,
  Path,
  Rect,
  Stop,
  LinearGradient as SvgLinearGradient,
} from "react-native-svg";
import { useTheme } from "../../theme";

interface ReferralLoadingScreenProps {
  minDurationMs?: number;
  isDark?: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export function ReferralLoadingScreen({
  minDurationMs = 3500,
  isDark: isDarkProp,
}: ReferralLoadingScreenProps) {
  // Theme resolution
  let contextIsDark = false;
  try {
    const themeContext = useTheme();
    contextIsDark = Boolean(themeContext?.isDark);
  } catch {
    contextIsDark = false;
  }
  const isDark = isDarkProp !== undefined ? isDarkProp : contextIsDark;

  // ---------------------------------------------------------------------------
  // 1. INDEPENDENT ANIMATION CONTROLLERS (Every element is alive!)
  // ---------------------------------------------------------------------------

  // Gift Box: Floating bounce, 3D rotation wobble, and breathing scale
  const giftFloat = useRef(new Animated.Value(0)).current;
  const giftWobble = useRef(new Animated.Value(0)).current;
  const giftScale = useRef(new Animated.Value(1)).current;
  const giftRibbonShimmer = useRef(new Animated.Value(-60)).current;

  // VIP Gift Card: 3D perspective float, tilt & specular sheen sweep
  const cardFloat = useRef(new Animated.Value(0)).current;
  const cardTilt = useRef(new Animated.Value(0)).current;
  const cardShimmer = useRef(new Animated.Value(-120)).current;
  const goldAuraPulse = useRef(new Animated.Value(0.4)).current;

  // 3D Floating Gold Reward Coins: Float & gentle rotation
  const coin1Float = useRef(new Animated.Value(0)).current;
  const coin2Float = useRef(new Animated.Value(0)).current;
  const coinRotate = useRef(new Animated.Value(0)).current;

  // Pedestal: Aura pulse and expanding radar ripple
  const pedestalPulse = useRef(new Animated.Value(0.4)).current;
  const pedestalRipple1 = useRef(new Animated.Value(0)).current;
  const pedestalRipple2 = useRef(new Animated.Value(0)).current;

  // Top Avatar (Green shirt boy): Independent float & breathing
  const topAvatarFloat = useRef(new Animated.Value(0)).current;
  const topAvatarScale = useRef(new Animated.Value(1)).current;

  // Left Avatar (Purple shirt girl): Sway, float & tilt
  const leftAvatarFloat = useRef(new Animated.Value(0)).current;
  const leftAvatarSway = useRef(new Animated.Value(0)).current;
  const leftAvatarTilt = useRef(new Animated.Value(0)).current;

  // Right Avatar (Pink hoodie boy with glasses): Float & tilt
  const rightAvatarFloat = useRef(new Animated.Value(0)).current;
  const rightAvatarTilt = useRef(new Animated.Value(0)).current;

  // Badges: Share badge bounce & AI badge float
  const shareBadgeFloat = useRef(new Animated.Value(0)).current;
  const shareBadgeScale = useRef(new Animated.Value(1)).current;
  const aiBadgeFloat = useRef(new Animated.Value(0)).current;

  // Connection Arcs: Glow wave pulse
  const arcsGlow = useRef(new Animated.Value(0.4)).current;

  // Sparkles & Star Particles: Independent twinkling
  const sparkle1 = useRef(new Animated.Value(0.2)).current;
  const sparkle2 = useRef(new Animated.Value(0.3)).current;
  const sparkle3 = useRef(new Animated.Value(0.1)).current;
  const cardSparkle = useRef(new Animated.Value(0.3)).current;

  // Brand Logo: Subtle breathing pulse
  const logoPulse = useRef(new Animated.Value(1)).current;

  // Headline: "shared." emerald glow pulse
  const headlineGlow = useRef(new Animated.Value(0.85)).current;

  // Three Loading Dots: Wave bouncing & scaling
  const dot1Y = useRef(new Animated.Value(0)).current;
  const dot2Y = useRef(new Animated.Value(0)).current;
  const dot3Y = useRef(new Animated.Value(0)).current;
  const dot1Scale = useRef(new Animated.Value(1)).current;
  const dot2Scale = useRef(new Animated.Value(1)).current;
  const dot3Scale = useRef(new Animated.Value(1)).current;

  // Subtitle: Animated ellipsis cycle
  const [ellipsis, setEllipsis] = useState("...");

  useEffect(() => {
    // -------------------------------------------------------------
    // A. GIFT BOX & 3D VIP GIFT CARD ANIMATIONS
    // -------------------------------------------------------------
    // Gift Box Vertical Float
    Animated.loop(
      Animated.sequence([
        Animated.timing(giftFloat, {
          toValue: -12,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(giftFloat, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Gift Box Wobble
    Animated.loop(
      Animated.sequence([
        Animated.timing(giftWobble, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(giftWobble, {
          toValue: -1,
          duration: 2400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Gift Box Breathing Scale
    Animated.loop(
      Animated.sequence([
        Animated.timing(giftScale, {
          toValue: 1.04,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(giftScale, {
          toValue: 0.97,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Ribbon Shimmer Ray
    Animated.loop(
      Animated.sequence([
        Animated.timing(giftRibbonShimmer, {
          toValue: 90,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(giftRibbonShimmer, {
          toValue: -60,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(1200),
      ])
    ).start();

    // VIP Gift Card Float (offset slightly from box for dynamic 3D depth)
    Animated.loop(
      Animated.sequence([
        Animated.timing(cardFloat, {
          toValue: -16,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(cardFloat, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // VIP Gift Card 3D Tilt Sway
    Animated.loop(
      Animated.sequence([
        Animated.timing(cardTilt, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(cardTilt, {
          toValue: -1,
          duration: 2600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // VIP Gift Card Specular Diagonal Sheen Sweep
    Animated.loop(
      Animated.sequence([
        Animated.timing(cardShimmer, {
          toValue: 190,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(cardShimmer, {
          toValue: -120,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(1400),
      ])
    ).start();

    // Golden Aura Breathing Glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(goldAuraPulse, {
          toValue: 0.85,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(goldAuraPulse, {
          toValue: 0.35,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // -------------------------------------------------------------
    // B. FLOATING 3D GOLD REWARD COINS
    // -------------------------------------------------------------
    // Coin 1 (Top-Right): Bouncing & floating
    Animated.loop(
      Animated.sequence([
        Animated.timing(coin1Float, {
          toValue: -12,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(coin1Float, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Coin 2 (Bottom-Left): Delayed bouncing
    Animated.loop(
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(coin2Float, {
          toValue: -10,
          duration: 1700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(coin2Float, {
          toValue: 0,
          duration: 1700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Coin Tilt/Spin Oscillation
    Animated.loop(
      Animated.sequence([
        Animated.timing(coinRotate, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(coinRotate, {
          toValue: -1,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // -------------------------------------------------------------
    // C. PEDESTAL PULSE & RADAR RIPPLES
    // -------------------------------------------------------------
    Animated.loop(
      Animated.sequence([
        Animated.timing(pedestalPulse, {
          toValue: 0.9,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pedestalPulse, {
          toValue: 0.35,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    const startRipple = (rippleAnim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(rippleAnim, {
            toValue: 1,
            duration: 2200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(rippleAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    startRipple(pedestalRipple1, 0);
    startRipple(pedestalRipple2, 1100);

    // -------------------------------------------------------------
    // D. THREE AVATARS INDEPENDENT PHYSICS
    // -------------------------------------------------------------
    // Top Avatar: Gentle vertical hover & scale
    Animated.loop(
      Animated.sequence([
        Animated.timing(topAvatarFloat, {
          toValue: -9,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(topAvatarFloat, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(topAvatarScale, {
          toValue: 1.03,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(topAvatarScale, {
          toValue: 0.98,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Left Avatar: Sway, tilt, delayed float
    Animated.loop(
      Animated.sequence([
        Animated.delay(300),
        Animated.timing(leftAvatarFloat, {
          toValue: -8,
          duration: 1900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(leftAvatarFloat, {
          toValue: 0,
          duration: 1900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(leftAvatarSway, {
          toValue: 3,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(leftAvatarSway, {
          toValue: -3,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(leftAvatarTilt, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(leftAvatarTilt, {
          toValue: -1,
          duration: 2600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Right Avatar: Delayed float & gentle tilt
    Animated.loop(
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(rightAvatarFloat, {
          toValue: -10,
          duration: 2100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(rightAvatarFloat, {
          toValue: 0,
          duration: 2100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(rightAvatarTilt, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(rightAvatarTilt, {
          toValue: -1,
          duration: 2800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // -------------------------------------------------------------
    // E. BADGES ANIMATION (Share Badge & AI Badge)
    // -------------------------------------------------------------
    Animated.loop(
      Animated.sequence([
        Animated.timing(shareBadgeFloat, {
          toValue: -6,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(shareBadgeFloat, {
          toValue: 0,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shareBadgeScale, {
          toValue: 1.08,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shareBadgeScale, {
          toValue: 0.95,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(200),
        Animated.timing(aiBadgeFloat, {
          toValue: -7,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(aiBadgeFloat, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // -------------------------------------------------------------
    // F. ARCS GLOW & PARTICLES TWINKLE
    // -------------------------------------------------------------
    Animated.loop(
      Animated.sequence([
        Animated.timing(arcsGlow, {
          toValue: 0.95,
          duration: 1300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(arcsGlow, {
          toValue: 0.45,
          duration: 1300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    const startTwinkle = (anim: Animated.Value, dur: number, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: dur,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.15,
            duration: dur,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    startTwinkle(sparkle1, 800, 0);
    startTwinkle(sparkle2, 1000, 300);
    startTwinkle(sparkle3, 900, 600);
    startTwinkle(cardSparkle, 700, 150);

    // -------------------------------------------------------------
    // G. HEADER LOGO & HEADLINE GLOW
    // -------------------------------------------------------------
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, {
          toValue: 1.06,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoPulse, {
          toValue: 0.97,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(headlineGlow, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(headlineGlow, {
          toValue: 0.8,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // -------------------------------------------------------------
    // H. SEQUENTIAL 3-DOT WAVE (Bouncing Y + Scaling)
    // -------------------------------------------------------------
    const startDotWave = (yAnim: Animated.Value, scaleAnim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(yAnim, {
              toValue: -6,
              duration: 350,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1.35,
              duration: 350,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(yAnim, {
              toValue: 0,
              duration: 350,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 350,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          Animated.delay(Math.max(0, 1100 - delay - 700)),
        ])
      ).start();
    };

    startDotWave(dot1Y, dot1Scale, 0);
    startDotWave(dot2Y, dot2Scale, 280);
    startDotWave(dot3Y, dot3Scale, 560);
  }, []);

  // ---------------------------------------------------------------------------
  // THEME COLORS & INTERPOLATIONS
  // ---------------------------------------------------------------------------
  const bgColor = isDark ? "#0A0D18" : "#FAF7F2";
  const gridLineColor = isDark ? "rgba(255, 255, 255, 0.035)" : "rgba(0, 0, 0, 0.035)";
  const headlineColor = isDark ? "#FFFFFF" : "#0A1128";
  const emeraldAccent = isDark ? "#10B981" : "#059669";
  const subtitleColor = isDark ? "#94A3B8" : "#6B7280";
  const cardShadowColor = isDark ? "rgba(0, 0, 0, 0.6)" : "rgba(0, 0, 0, 0.08)";

  // Wobble & Tilt interpolations
  const giftRotate = giftWobble.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-2.5deg", "2.5deg"],
  });

  const cardRotate = cardTilt.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-8deg", "-4deg"],
  });

  const coin1Rotate = coinRotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-10deg", "14deg"],
  });

  const coin2Rotate = coinRotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ["12deg", "-8deg"],
  });

  const leftAvatarRotate = leftAvatarTilt.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-3deg", "1.5deg"],
  });

  const rightAvatarRotate = rightAvatarTilt.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-1.5deg", "3deg"],
  });

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* 1. Dynamic Background Grid with subtle breathing opacity */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[0.14, 0.28, 0.42, 0.56, 0.70, 0.84].map((pos, i) => (
          <View
            key={`h-${i}`}
            style={[styles.gridH, { top: SCREEN_HEIGHT * pos, backgroundColor: gridLineColor }]}
          />
        ))}
        {[0.2, 0.4, 0.6, 0.8].map((pos, i) => (
          <View
            key={`v-${i}`}
            style={[styles.gridV, { left: SCREEN_WIDTH * pos, backgroundColor: gridLineColor }]}
          />
        ))}
      </View>

      {/* 2. Top Header: Animated Logo Pulse */}
      <SafeAreaView edges={["top"]} style={styles.topHeader}>
        <Animated.View
          style={[
            styles.logoRow,
            {
              transform: [{ scale: logoPulse }],
            },
          ]}
        >
          <Image
            source={require("../../../assets/images/logo_dot.webp")}
            style={styles.logoIcon}
            contentFit="contain"
          />
          <Text style={[styles.logoText, { color: headlineColor }]}>
            GetAiPilot
          </Text>
        </Animated.View>
      </SafeAreaView>

      {/* 3. Center Hero Stage: Everything is Individually Animated! */}
      <View style={styles.heroStage}>
        {/* SVG Curved Connection Arcs between Avatars and Gift */}
        <Animated.View
          style={[
            styles.svgOverlay,
            {
              opacity: arcsGlow,
            },
          ]}
          pointerEvents="none"
        >
          <Svg width={SCREEN_WIDTH} height={260} viewBox={`0 0 ${SCREEN_WIDTH} 260`}>
            <Defs>
              <SvgLinearGradient id="emeraldArc" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
                <Stop offset="50%" stopColor="#34D399" stopOpacity="1" />
                <Stop offset="100%" stopColor="#10B981" stopOpacity="0.8" />
              </SvgLinearGradient>
            </Defs>
            {/* Left Arc: Left girl avatar -> Top center avatar */}
            <Path
              d={`M ${SCREEN_WIDTH * 0.28} 145 Q ${SCREEN_WIDTH * 0.32} 70 ${SCREEN_WIDTH * 0.45} 55`}
              stroke="url(#emeraldArc)"
              strokeWidth="2.5"
              fill="none"
              strokeDasharray="4 3"
            />
            {/* Right Arc: Top center avatar -> Right boy avatar */}
            <Path
              d={`M ${SCREEN_WIDTH * 0.55} 55 Q ${SCREEN_WIDTH * 0.68} 70 ${SCREEN_WIDTH * 0.72} 145`}
              stroke="url(#emeraldArc)"
              strokeWidth="2.5"
              fill="none"
              strokeDasharray="4 3"
            />
          </Svg>
        </Animated.View>

        {/* Emerald Pedestal Aura Breathing Glow */}
        <Animated.View
          style={[
            styles.pedestalAura,
            {
              opacity: pedestalPulse,
              transform: [
                {
                  scale: pedestalPulse.interpolate({
                    inputRange: [0.35, 0.9],
                    outputRange: [0.9, 1.2],
                  }),
                },
              ],
            },
          ]}
        />

        {/* Expanding Pedestal Radar Ripple Waves */}
        {[pedestalRipple1, pedestalRipple2].map((rip, i) => (
          <Animated.View
            key={`rip-${i}`}
            pointerEvents="none"
            style={[
              styles.pedestalRipple,
              {
                opacity: rip.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.55, 0.25, 0],
                }),
                transform: [
                  {
                    scale: rip.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1.8],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}

        {/* Grounded 3D Emerald Pedestal */}
        <View style={styles.pedestalContainer}>
          <Image
            source={require("../../../assets/images/referral-pedestal-only.png")}
            style={styles.pedestalImage}
            contentFit="contain"
          />
        </View>

        {/* Top Avatar: Green Shirt Boy (Independent Float & Breathing) */}
        <Animated.View
          style={[
            styles.topAvatarWrap,
            {
              transform: [
                { translateY: topAvatarFloat },
                { scale: topAvatarScale },
              ],
            },
          ]}
        >
          <View style={[styles.avatarShadowCard, { shadowColor: cardShadowColor }]}>
            <Image
              source={require("../../../assets/images/referral-avatar-top.png")}
              style={styles.topAvatarImage}
              contentFit="contain"
            />
          </View>
        </Animated.View>

        {/* Floating Green Share Badge */}
        <Animated.View
          style={[
            styles.shareBadgeWrap,
            {
              transform: [
                { translateY: shareBadgeFloat },
                { scale: shareBadgeScale },
              ],
            },
          ]}
        >
          <View style={styles.shareBadgeCircle}>
            <Share2 size={13} color="#FFFFFF" strokeWidth={2.5} />
          </View>
        </Animated.View>

        {/* Floating AI Brand Badge */}
        <Animated.View
          style={[
            styles.aiBadgeWrap,
            {
              transform: [
                { translateY: aiBadgeFloat },
              ],
            },
          ]}
        >
          <View style={styles.aiBadgeCard}>
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        </Animated.View>

        {/* Left Avatar: Purple Top Girl (Sway + Float + Tilt + Soft Lavender Halo) */}
        <Animated.View
          style={[
            styles.leftAvatarWrap,
            {
              transform: [
                { translateY: leftAvatarFloat },
                { translateX: leftAvatarSway },
                { rotate: leftAvatarRotate },
              ],
            },
          ]}
        >
          <View style={[styles.avatarShadowCard, { shadowColor: cardShadowColor }]}>
            <Image
              source={require("../../../assets/images/referral-avatar-left.png")}
              style={styles.sideAvatarImage}
              contentFit="contain"
            />
          </View>
        </Animated.View>

        {/* Right Avatar: Pink Hoodie Boy with Glasses (Float + Tilt + Soft Pink Halo) */}
        <Animated.View
          style={[
            styles.rightAvatarWrap,
            {
              transform: [
                { translateY: rightAvatarFloat },
                { rotate: rightAvatarRotate },
              ],
            },
          ]}
        >
          <View style={[styles.avatarShadowCard, { shadowColor: cardShadowColor }]}>
            <Image
              source={require("../../../assets/images/referral-avatar-right.png")}
              style={styles.sideAvatarImage}
              contentFit="contain"
            />
          </View>
        </Animated.View>

        {/* ------------------------------------------------------------- */}
        {/* CENTERPIECE: FINISHED 3D VIP GIFT CARD & 3D GIFT BOX SUITE   */}
        {/* ------------------------------------------------------------- */}
        <View style={styles.centerGiftSuite}>
          {/* Ambient Golden & Emerald Radiant Back-Aura */}
          <Animated.View
            style={[
              styles.giftAmbientAura,
              {
                opacity: goldAuraPulse,
                transform: [
                  {
                    scale: goldAuraPulse.interpolate({
                      inputRange: [0.35, 0.85],
                      outputRange: [0.85, 1.15],
                    }),
                  },
                ],
              },
            ]}
            pointerEvents="none"
          />

          {/* 1. LUXURY 3D VIP GIFT CARD (Peeking & Floating behind the Gift Box) */}
          <Animated.View
            style={[
              styles.luxuryGiftCardWrap,
              {
                transform: [
                  { translateY: cardFloat },
                  { rotate: cardRotate },
                ],
              },
            ]}
          >
            {/* Multi-layered Card Body with Glassmorphism & Gold Trim */}
            <View style={styles.luxuryGiftCard}>
              {/* SVG Gradient Background & Gold Circuit Elements */}
              <Svg width={154} height={96} viewBox="0 0 154 96" style={StyleSheet.absoluteFill}>
                <Defs>
                  <SvgLinearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#064E3B" stopOpacity="0.96" />
                    <Stop offset="45%" stopColor="#047857" stopOpacity="0.95" />
                    <Stop offset="100%" stopColor="#022C22" stopOpacity="0.98" />
                  </SvgLinearGradient>
                  <SvgLinearGradient id="goldBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#FDE68A" stopOpacity="0.9" />
                    <Stop offset="30%" stopColor="#F59E0B" stopOpacity="1" />
                    <Stop offset="70%" stopColor="#FBBF24" stopOpacity="0.9" />
                    <Stop offset="100%" stopColor="#D97706" stopOpacity="0.8" />
                  </SvgLinearGradient>
                  <SvgLinearGradient id="chipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#FDE68A" />
                    <Stop offset="50%" stopColor="#F59E0B" />
                    <Stop offset="100%" stopColor="#B45309" />
                  </SvgLinearGradient>
                </Defs>

                {/* Card Outer Shape with Gold Bevel */}
                <Rect
                  x={1}
                  y={1}
                  width={152}
                  height={94}
                  rx={12}
                  fill="url(#cardBg)"
                  stroke="url(#goldBorderGrad)"
                  strokeWidth={1.5}
                />

                {/* Decorative Subtle Holographic Mesh Arcs */}
                <Circle cx={140} cy={10} r={40} stroke="rgba(255,255,255,0.08)" strokeWidth={1} fill="none" />
                <Circle cx={140} cy={10} r={55} stroke="rgba(251,191,36,0.12)" strokeWidth={0.8} fill="none" />
                <Circle cx={14} cy={85} r={35} stroke="rgba(255,255,255,0.06)" strokeWidth={1} fill="none" />

                {/* Realistic Gold EMV Smart Microchip */}
                <Rect x={14} y={15} width={22} height={16} rx={3} fill="url(#chipGrad)" />
                <Path d="M 14 23 L 36 23 M 25 15 L 25 31" stroke="#78350F" strokeWidth={0.7} />
              </Svg>

              {/* Card Header: Brand & VIP Crown */}
              <View style={styles.cardHeaderRow}>
                <View style={{ width: 22 }} />
                <View style={styles.cardBrandBadge}>
                  <Crown size={10} color="#FDE68A" />
                  <Text style={styles.cardBrandText}>VIP REWARD</Text>
                </View>
              </View>

              {/* Card Center: Exclusive Value Badge */}
              <View style={styles.cardCenterValueRow}>
                <View style={styles.cardValuePill}>
                  <Text style={styles.cardValueSymbol}>₹</Text>
                  <Text style={styles.cardValueNumber}>1,000</Text>
                  <Text style={styles.cardValueTier}>GIFT</Text>
                </View>
              </View>

              {/* Card Footer: Security Dots & Foil Stars */}
              <View style={styles.cardFooterRow}>
                <Text style={styles.cardHolderLabel}>GetAiPilot PASS</Text>
                <View style={styles.cardChipSparkle}>
                  <Sparkles size={10} color="#FDE68A" />
                </View>
              </View>

              {/* Sweeping Specular Glass Shimmer Beam across the Card */}
              <Animated.View
                style={[
                  styles.cardShimmerBeam,
                  {
                    transform: [{ translateX: cardShimmer }, { rotate: "30deg" }],
                  },
                ]}
                pointerEvents="none"
              />

              {/* Corner Twinkling Diamond Star */}
              <Animated.View
                style={[
                  styles.cardStarSparkle,
                  {
                    opacity: cardSparkle,
                  },
                ]}
                pointerEvents="none"
              >
                <Sparkles size={11} color="#FDE68A" />
              </Animated.View>
            </View>
          </Animated.View>

          {/* 2. FLOATING 3D GOLD REWARD COIN #1 (Top-Right of Gift Card) */}
          <Animated.View
            style={[
              styles.goldCoin1Wrap,
              {
                transform: [
                  { translateY: coin1Float },
                  { rotate: coin1Rotate },
                ],
              },
            ]}
          >
            <View style={styles.goldCoin}>
              <View style={styles.goldCoinInner}>
                <Text style={styles.goldCoinSymbol}>₹</Text>
              </View>
            </View>
          </Animated.View>

          {/* 3. FLOATING 3D GOLD REWARD COIN #2 (Bottom-Left of Gift Box) */}
          <Animated.View
            style={[
              styles.goldCoin2Wrap,
              {
                transform: [
                  { translateY: coin2Float },
                  { rotate: coin2Rotate },
                ],
              },
            ]}
          >
            <View style={[styles.goldCoin, styles.goldCoinSmall]}>
              <View style={[styles.goldCoinInner, styles.goldCoinInnerSmall]}>
                <Crown size={9} color="#D97706" />
              </View>
            </View>
          </Animated.View>

          {/* 4. CENTER 3D GIFT BOX (With Emerald Ribbon & Bow) */}
          <Animated.View
            style={[
              styles.giftBoxWrap,
              {
                transform: [
                  { translateY: giftFloat },
                  { rotate: giftRotate },
                  { scale: giftScale },
                ],
              },
            ]}
          >
            <Image
              source={require("../../../assets/images/referral-gift-only.png")}
              style={styles.giftBoxImage}
              contentFit="contain"
            />

            {/* Sweeping Specular Shimmer on the Emerald Ribbon */}
            <Animated.View
              style={[
                styles.shimmerRay,
                {
                  transform: [{ translateX: giftRibbonShimmer }, { rotate: "35deg" }],
                },
              ]}
              pointerEvents="none"
            />
          </Animated.View>
        </View>

        {/* Sparkling Diamond Stars Twinkling at Staggered Times */}
        <Animated.View style={[styles.sparkleWrap, { top: 50, left: SCREEN_WIDTH * 0.32, opacity: sparkle1 }]}>
          <Sparkles size={14} color="#10B981" />
        </Animated.View>
        <Animated.View style={[styles.sparkleWrap, { top: 70, right: SCREEN_WIDTH * 0.28, opacity: sparkle2 }]}>
          <Sparkles size={16} color="#8B5CF6" />
        </Animated.View>
        <Animated.View style={[styles.sparkleWrap, { bottom: 80, left: SCREEN_WIDTH * 0.25, opacity: sparkle3 }]}>
          <Sparkles size={12} color="#10B981" />
        </Animated.View>
      </View>

      {/* 4. Bottom Section: Headline, Animated Dots & Dynamic Subtitle */}
      <SafeAreaView edges={["bottom"]} style={styles.bottomSection}>
        {/* Animated Headline with Glowing Emerald "shared." */}
        <View style={styles.headlineWrap}>
          <Text style={[styles.headlineText, { color: headlineColor }]}>
            Good things grow
          </Text>
          <Text style={[styles.headlineText, { color: headlineColor }]}>
            when{" "}
            <Animated.Text
              style={[
                styles.headlineHighlight,
                {
                  color: emeraldAccent,
                  opacity: headlineGlow,
                },
              ]}
            >
              shared.
            </Animated.Text>
          </Text>
        </View>

        {/* Sequential 3-Dot Wave (Bouncing Y + Scaling) */}
        <View style={styles.dotsRow}>
          <Animated.View
            style={[
              styles.dot,
              {
                backgroundColor: emeraldAccent,
                transform: [
                  { translateY: dot1Y },
                  { scale: dot1Scale },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                backgroundColor: emeraldAccent,
                transform: [
                  { translateY: dot2Y },
                  { scale: dot2Scale },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                backgroundColor: emeraldAccent,
                transform: [
                  { translateY: dot3Y },
                  { scale: dot3Scale },
                ],
              },
            ]}
          />
        </View>

        {/* Dynamic Typing Subtitle */}
        <Text style={[styles.statusSubtitle, { color: subtitleColor }]}>
          Preparing your referral experience{ellipsis}
        </Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 9999,
  },
  gridH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
  },
  gridV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
  },
  topHeader: {
    alignItems: "center",
    width: "100%",
    paddingTop: 16,
    zIndex: 20,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoIcon: {
    width: 28,
    height: 28,
  },
  logoText: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  heroStage: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginTop: -10,
  },
  svgOverlay: {
    position: "absolute",
    top: 30,
    width: SCREEN_WIDTH,
    height: 260,
    zIndex: 5,
  },
  pedestalAura: {
    position: "absolute",
    bottom: 30,
    width: 200,
    height: 60,
    borderRadius: 80,
    backgroundColor: "rgba(16, 185, 129, 0.45)",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 32,
    elevation: 10,
    zIndex: 2,
  },
  pedestalRipple: {
    position: "absolute",
    bottom: 38,
    width: 170,
    height: 52,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: "rgba(16, 185, 129, 0.55)",
    zIndex: 2,
  },
  pedestalContainer: {
    position: "absolute",
    bottom: 22,
    width: 180,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  pedestalImage: {
    width: "100%",
    height: "100%",
  },

  // -------------------------------------------------------------
  // CENTER GIFT SUITE & LUXURY GIFT CARD
  // -------------------------------------------------------------
  centerGiftSuite: {
    position: "absolute",
    bottom: 42,
    width: 220,
    height: 190,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 8,
  },
  giftAmbientAura: {
    position: "absolute",
    width: 175,
    height: 145,
    borderRadius: 85,
    backgroundColor: "rgba(225, 29, 72, 0.22)",
    shadowColor: "#E11D48",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 38,
    elevation: 8,
    zIndex: 1,
  },
  luxuryGiftCardWrap: {
    position: "absolute",
    top: 8,
    alignSelf: "center",
    zIndex: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  luxuryGiftCard: {
    width: 154,
    height: 96,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: "space-between",
    overflow: "hidden",
    position: "relative",
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardBrandBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(251, 191, 36, 0.18)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.8,
    borderColor: "rgba(251, 191, 36, 0.4)",
  },
  cardBrandText: {
    color: "#FDE68A",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  cardCenterValueRow: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: -2,
  },
  cardValuePill: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  cardValueSymbol: {
    color: "#FBBF24",
    fontSize: 13,
    fontWeight: "900",
  },
  cardValueNumber: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  cardValueTier: {
    color: "#34D399",
    fontSize: 9,
    fontWeight: "800",
    marginLeft: 3,
    letterSpacing: 0.4,
  },
  cardFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardHolderLabel: {
    color: "rgba(255, 255, 255, 0.65)",
    fontSize: 8.5,
    fontWeight: "600",
    letterSpacing: 0.6,
  },
  cardChipSparkle: {
    opacity: 0.9,
  },
  cardShimmerBeam: {
    position: "absolute",
    top: -40,
    left: -20,
    width: 32,
    height: 180,
    backgroundColor: "rgba(255, 255, 255, 0.28)",
  },
  cardStarSparkle: {
    position: "absolute",
    top: 4,
    right: 6,
  },

  // -------------------------------------------------------------
  // FLOATING 3D GOLD COINS
  // -------------------------------------------------------------
  goldCoin1Wrap: {
    position: "absolute",
    top: 14,
    right: 8,
    zIndex: 9,
    shadowColor: "#D97706",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 6,
  },
  goldCoin2Wrap: {
    position: "absolute",
    bottom: 34,
    left: 8,
    zIndex: 9,
    shadowColor: "#D97706",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 6,
  },
  goldCoin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#F59E0B",
    borderWidth: 1.5,
    borderColor: "#FDE68A",
    alignItems: "center",
    justifyContent: "center",
  },
  goldCoinSmall: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#D97706",
  },
  goldCoinInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(254, 240, 138, 0.6)",
    backgroundColor: "#B45309",
    alignItems: "center",
    justifyContent: "center",
  },
  goldCoinInnerSmall: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: "#92400E",
  },
  goldCoinSymbol: {
    color: "#FDE68A",
    fontSize: 10,
    fontWeight: "900",
  },

  // -------------------------------------------------------------
  // 3D GIFT BOX FOREGROUND
  // -------------------------------------------------------------
  giftBoxWrap: {
    position: "absolute",
    bottom: 2,
    width: 132,
    height: 112,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 7,
  },
  giftBoxImage: {
    width: "100%",
    height: "100%",
  },
  shimmerRay: {
    position: "absolute",
    width: 20,
    height: 160,
    backgroundColor: "rgba(255, 255, 255, 0.45)",
  },

  // -------------------------------------------------------------
  // AVATARS & BADGES
  // -------------------------------------------------------------
  topAvatarWrap: {
    position: "absolute",
    top: 20,
    alignSelf: "center",
    width: 88,
    height: 98,
    zIndex: 10,
  },
  topAvatarImage: {
    width: "100%",
    height: "100%",
  },
  leftAvatarWrap: {
    position: "absolute",
    top: 95,
    left: SCREEN_WIDTH * 0.12,
    width: 90,
    height: 100,
    zIndex: 9,
  },
  rightAvatarWrap: {
    position: "absolute",
    top: 105,
    right: SCREEN_WIDTH * 0.12,
    width: 90,
    height: 100,
    zIndex: 9,
  },
  sideAvatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarShadowCard: {
    width: "100%",
    height: "100%",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  shareBadgeWrap: {
    position: "absolute",
    top: 48,
    left: SCREEN_WIDTH * 0.18,
    zIndex: 12,
  },
  shareBadgeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  aiBadgeWrap: {
    position: "absolute",
    top: 50,
    right: SCREEN_WIDTH * 0.20,
    zIndex: 12,
  },
  aiBadgeCard: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aiBadgeText: {
    color: "#059669",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  sparkleWrap: {
    position: "absolute",
    zIndex: 15,
  },
  bottomSection: {
    width: "100%",
    alignItems: "center",
    paddingBottom: 38,
    paddingHorizontal: 24,
    zIndex: 20,
  },
  headlineWrap: {
    alignItems: "center",
    marginBottom: 24,
  },
  headlineText: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.6,
    lineHeight: 38,
    textAlign: "center",
  },
  headlineHighlight: {
    fontWeight: "900",
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  statusSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.2,
    textAlign: "center",
  },
});
