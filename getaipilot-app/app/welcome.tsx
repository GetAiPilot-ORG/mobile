import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Animated,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { soundService } from "../src/services/soundFeedbackService";
import { useAuthStore } from "../src/core/store/authStore";

export const HAS_SEEN_TOUR_KEY = "@gap_has_seen_app_tour";

interface SlideData {
  id: string;
  title: string;
  subtitle: string;
  bgColor: string;
  accentBadge: string;
  graphicType: "messaging" | "goal" | "growth";
}

// User-specified color palette: #746df9, #fe45b5, #fead77
const SLIDES: SlideData[] = [
  {
    id: "messaging",
    title: "Best Digital Solution",
    subtitle: "Automate WhatsApp, Telegram & AI voice agents to convert visitors into customers.",
    bgColor: "#746df9", // Electric Violet / Purple-Blue
    accentBadge: "AI & MESSAGING",
    graphicType: "messaging",
  },
  {
    id: "goal",
    title: "Achieve Your Goal",
    subtitle: "Capture every lead, track deals through visual stages, and close sales faster.",
    bgColor: "#fe45b5", // Vibrant Magenta / Hot Pink
    accentBadge: "SALES & CRM",
    graphicType: "goal",
  },
  {
    id: "growth",
    title: "Increase Your Value",
    subtitle: "Launch high-converting landing funnels, bio sites, and custom branded QR codes.",
    bgColor: "#fead77", // Warm Sunset Peach
    accentBadge: "FUNNELS & QR",
    graphicType: "growth",
  },
];

export default function LiquidWelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const authStatus = useAuthStore((s) => s.authStatus);

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);
  currentIndexRef.current = currentIndex;

  const [touchY, setTouchY] = useState(height * 0.52);
  const [animProgress, setAnimProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [incomingSlideIndex, setIncomingSlideIndex] = useState<number | null>(null);

  // Liquid Wave animation progress (0 = idle wave handle peeking, 1 = wave fully swept)
  const waveAnim = useRef(new Animated.Value(0)).current;
  const isAnimatingRef = useRef(false);

  // Continuous organic floating & bobbing animations for center graphics
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const nudgeAnim = useRef(new Animated.Value(0)).current;

  // Throttled SVG wave progress listener for 60fps rendering without JS thread lock
  useEffect(() => {
    let lastValue = 0;
    let animFrameId: number | null = null;
    const listenerId = waveAnim.addListener(({ value }) => {
      lastValue = value;
      if (animFrameId === null) {
        animFrameId = requestAnimationFrame(() => {
          setAnimProgress(lastValue);
          animFrameId = null;
        });
      }
    });
    return () => {
      waveAnim.removeListener(listenerId);
      if (animFrameId !== null) cancelAnimationFrame(animFrameId);
    };
  }, [waveAnim]);

  // Continuous 60fps organic loops for floating center elements & interactive cues
  useEffect(() => {
    // 1. Organic gentle bobbing loop
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    floatLoop.start();

    // 2. Ambient breathing glow ring pulse
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 3. Subtle sparkle twinkling loop
    const sparkleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    sparkleLoop.start();

    // 4. Interactive nudge cue on the right-edge peek button (JS driven to keep consistent with waveAnim)
    const nudgeLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(nudgeAnim, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(nudgeAnim, {
          toValue: 0,
          duration: 1300,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    );
    nudgeLoop.start();

    return () => {
      floatLoop.stop();
      pulseLoop.stop();
      sparkleLoop.stop();
      nudgeLoop.stop();
    };
  }, [floatAnim, pulseAnim, sparkleAnim, nudgeAnim]);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(style).catch(() => {});
    }
  };

  const currentSlide = SLIDES[currentIndex];
  const nextTargetIndex = (currentIndex + 1) % SLIDES.length;
  const nextSlide = SLIDES[nextTargetIndex];

  // Complete tour and navigate
  const handleFinish = async () => {
    soundService.play("click");
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await AsyncStorage.setItem(HAS_SEEN_TOUR_KEY, "true");
    } catch {}

    if (authStatus === "authenticated") {
      router.replace("/(tabs)" as any);
    } else {
      router.replace("/(auth)/login" as any);
    }
  };

  // Perform the liquid wave sweep animation where background AND elements enter in locked step!
  const goToNextSlide = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    const targetIdx = (currentIndexRef.current + 1) % SLIDES.length;
    setIncomingSlideIndex(targetIdx);
    setIsTransitioning(true);

    soundService.play("pop");
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    Animated.timing(waveAnim, {
      toValue: 1,
      duration: 440,
      easing: Easing.bezier(0.18, 1, 0.32, 1),
      useNativeDriver: false,
    }).start(() => {
      // 1. Update the index ref & React state so Layer 1 prepares the new slide
      currentIndexRef.current = targetIdx;
      setCurrentIndex(targetIdx);

      // 2. Wait two animation frames for React Native to mount & paint Layer 1 underneath
      // before resetting the wave and unmounting Layer 3. This eliminates 100% of the blink!
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          waveAnim.setValue(0);
          setAnimProgress(0);
          setIsTransitioning(false);
          setIncomingSlideIndex(null);
          isAnimatingRef.current = false;
        });
      });
    });
  }, [waveAnim]);

  // Go to previous slide
  const goToPrevSlide = useCallback(() => {
    if (currentIndexRef.current === 0 || isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    soundService.play("click");
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);

    const targetIdx = currentIndexRef.current - 1;
    currentIndexRef.current = targetIdx;
    setCurrentIndex(targetIdx);
    setIsTransitioning(false);
    setIncomingSlideIndex(null);
    waveAnim.setValue(0);
    setAnimProgress(0);
    isAnimatingRef.current = false;
  }, [waveAnim]);

  // Stable refs for PanResponder to always call the latest functions without stale closures
  const goToNextSlideRef = useRef(goToNextSlide);
  goToNextSlideRef.current = goToNextSlide;
  const goToPrevSlideRef = useRef(goToPrevSlide);
  goToPrevSlideRef.current = goToPrevSlide;

  // PanResponder for interactive liquid swipe from right side & vertical scrolling
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (isAnimatingRef.current) return false;
        return Math.abs(gestureState.dx) > 8 || Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => {
        const targetIdx = (currentIndexRef.current + 1) % SLIDES.length;
        setIncomingSlideIndex(targetIdx);
        setIsTransitioning(true);
      },
      onPanResponderMove: (_, gestureState) => {
        if (isAnimatingRef.current) return;

        if (gestureState.moveY) {
          setTouchY(gestureState.moveY);
        }

        // Support horizontal swipe (dx < 0) AND vertical scroll (dy < 0)
        const horizontalDist = -gestureState.dx;
        const verticalDist = -gestureState.dy;
        const activeDist = Math.max(horizontalDist, verticalDist * 0.85);

        if (activeDist > 0) {
          // Dragging left or scrolling up (expanding wave and pulling incoming slide together!)
          const ratio = Math.min(1, Math.max(0, activeDist / (width * 0.72)));
          waveAnim.setValue(ratio);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isAnimatingRef.current) return;

        // Check horizontal swipe or vertical scroll advancement threshold
        const shouldAdvance =
          gestureState.dx < -width * 0.16 ||
          gestureState.dy < -48 ||
          gestureState.vx < -0.38 ||
          gestureState.vy < -0.38;

        const shouldGoBack =
          gestureState.dx > width * 0.16 ||
          gestureState.dy > 48 ||
          gestureState.vx > 0.38 ||
          gestureState.vy > 0.38;

        if (shouldAdvance) {
          goToNextSlideRef.current();
        } else if (shouldGoBack && currentIndexRef.current > 0) {
          setIsTransitioning(false);
          setIncomingSlideIndex(null);
          goToPrevSlideRef.current();
        } else {
          // Snap back
          Animated.spring(waveAnim, {
            toValue: 0,
            friction: 7,
            tension: 60,
            useNativeDriver: false,
          }).start(() => {
            setIsTransitioning(false);
            setIncomingSlideIndex(null);
          });
        }
      },
    })
  ).current;

  // Compute organic liquid SVG wave path matching reference image bulge
  const computeLiquidWavePath = (p: number, tY: number) => {
    const W = width;
    const H = height;
    const baseY = tY || H * 0.52;

    // Apex depth expands smoothly from 38px idle peek up to full screen width
    const apexDepth = 38 + (W + 120) * p;
    const apexX = W - apexDepth;

    // Base edge starts flush at right edge and moves leftwards as wave sweeps
    const baseDepth = (W + 80) * Math.max(0, (p - 0.08) / 0.92);
    const baseX = W - baseDepth;

    // Smooth curvature radius around the apex
    const curveRadius = 140 + 180 * p;
    const topY = Math.max(0, baseY - curveRadius);
    const bottomY = Math.min(H, baseY + curveRadius);

    return `
      M ${W} 0
      L ${baseX} 0
      L ${baseX} ${topY}
      C ${baseX - (apexDepth - baseDepth) * 0.28} ${topY + (baseY - topY) * 0.45},
        ${apexX} ${baseY - (baseY - topY) * 0.28},
        ${apexX} ${baseY}
      C ${apexX} ${baseY + (bottomY - baseY) * 0.28},
        ${baseX - (apexDepth - baseDepth) * 0.28} ${bottomY - (bottomY - baseY) * 0.45},
        ${baseX} ${bottomY}
      L ${baseX} ${H}
      L ${W} ${H}
      Z
    `;
  };

  // Button handle position inside the apex curve
  const handleApexDepth = 38 + (width + 120) * animProgress;
  const handleX = width - handleApexDepth + 18;
  const handleY = touchY || height * 0.52;

  // Interactive nudge offset for the peek handle ( > )
  const peekNudgeX = nudgeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  // Interpolated floating values for center graphics
  const centerBobY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -14],
  });
  const arcBob1 = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-6, 8],
  });
  const arcBob2 = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [8, -7],
  });
  const arcBob3 = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 6],
  });
  const arcBob4 = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [7, -6],
  });
  const arcBob5 = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-5, 7],
  });
  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.08],
  });
  const sparkleOpacity = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.95],
  });
  const sparkleScale = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1.2],
  });

  // Wave Handle Button TranslateX (moves in 100% lockstep with the screen on the exact same animated curve)
  const waveButtonTranslateX = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -(width + 80)],
  });

  // Bottom GET STARTED button subtle scale & bounce in lockstep with the screen
  const bottomButtonScale = waveAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.95, 1],
  });
  const bottomButtonTranslateY = waveAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 3, 0],
  });

  const incomingColor = incomingSlideIndex !== null ? SLIDES[incomingSlideIndex].bgColor : nextSlide.bgColor;

  // Dynamic slide color that morphs with wave progress
  const dynamicSlideColor = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [currentSlide.bgColor, incomingColor],
  });

  // Outgoing slide transforms (drifts left smoothly as wave expands)
  const outgoingTranslateX = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -width * 0.35],
  });
  const outgoingOpacity = waveAnim.interpolate({
    inputRange: [0, 0.75, 1],
    outputRange: [1, 0.45, 0],
  });

  // Incoming slide transforms (enters from the right side IN TANDEM WITH THE WAVE!)
  const incomingTranslateX = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [width, 0],
  });
  const incomingOpacity = waveAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.85, 1],
  });
  const incomingScale = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1],
  });

  // Render 3D-styled animated graphic stage matching reference screenshots
  const renderSlideGraphic = (type: SlideData["graphicType"]) => {
    switch (type) {
      case "messaging":
        return (
          <View style={styles.graphicWrap}>
            {/* Ambient Animated Glow Rings */}
            <Animated.View
              style={[
                styles.ambientCircleBig,
                {
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  transform: [{ scale: pulseScale }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.ambientCircleSmall,
                {
                  backgroundColor: "rgba(255, 255, 255, 0.14)",
                  transform: [{ scale: pulseScale }],
                },
              ]}
            />

            {/* Twinkling Star Sparkles (+) in Background */}
            <Animated.Text
              style={[
                styles.sparkleStar,
                { top: 22, left: 34, opacity: sparkleOpacity, transform: [{ scale: sparkleScale }] },
              ]}
            >
              ✦
            </Animated.Text>
            <Animated.Text
              style={[
                styles.sparkleStar,
                { top: 68, right: 36, opacity: sparkleOpacity, transform: [{ scale: sparkleScale }] },
              ]}
            >
              +
            </Animated.Text>
            <Animated.Text
              style={[
                styles.sparkleStar,
                { bottom: 42, left: 48, opacity: sparkleOpacity, transform: [{ scale: sparkleScale }] },
              ]}
            >
              +
            </Animated.Text>
            <Animated.Text
              style={[
                styles.sparkleStar,
                { bottom: 58, right: 44, opacity: sparkleOpacity, transform: [{ scale: sparkleScale }] },
              ]}
            >
              ✦
            </Animated.Text>

            {/* Arched Floating 3D App Icon Squircles above character (Reference match!) */}
            <View style={styles.floatingArcContainer}>
              {/* 1. Green Chat Bubble (WhatsApp / Messaging) */}
              <Animated.View
                style={[
                  styles.arcIconSquircle,
                  styles.arcPos1,
                  { backgroundColor: "#22C55E", transform: [{ translateY: arcBob1 }] },
                ]}
              >
                <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
              </Animated.View>

              {/* 2. Sky Blue Weather Squircle (Cloud & Sun) */}
              <Animated.View
                style={[
                  styles.arcIconSquircle,
                  styles.arcPos2,
                  { backgroundColor: "#38BDF8", transform: [{ translateY: arcBob2 }] },
                ]}
              >
                <Ionicons name="sunny" size={20} color="#FEF08A" />
              </Animated.View>

              {/* 3. Purple Photo Squircle (Landscape / Media) */}
              <Animated.View
                style={[
                  styles.arcIconSquircle,
                  styles.arcPos3,
                  { backgroundColor: "#8B5CF6", transform: [{ translateY: arcBob3 }] },
                ]}
              >
                <Ionicons name="image" size={20} color="#FFFFFF" />
              </Animated.View>

              {/* 4. Hot Pink Video Squircle (Reels / Play) */}
              <Animated.View
                style={[
                  styles.arcIconSquircle,
                  styles.arcPos4,
                  { backgroundColor: "#EC4899", transform: [{ translateY: arcBob4 }] },
                ]}
              >
                <Ionicons name="play" size={18} color="#FFFFFF" />
              </Animated.View>

              {/* 5. Dark Navy Payment Card Squircle */}
              <Animated.View
                style={[
                  styles.arcIconSquircle,
                  styles.arcPos5,
                  { backgroundColor: "#1E293B", transform: [{ translateY: arcBob5 }] },
                ]}
              >
                <Ionicons name="card" size={19} color="#38BDF8" />
              </Animated.View>

              {/* 6. Color Palette Dots Pill */}
              <Animated.View
                style={[
                  styles.arcPalettePill,
                  { transform: [{ translateY: arcBob2 }] },
                ]}
              >
                <View style={[styles.paletteDot, { backgroundColor: "#EF4444" }]} />
                <View style={[styles.paletteDot, { backgroundColor: "#FBBF24" }]} />
                <View style={[styles.paletteDot, { backgroundColor: "#22C55E" }]} />
                <View style={[styles.paletteDot, { backgroundColor: "#38BDF8" }]} />
              </Animated.View>
            </View>

            {/* Central 3D VR Character with Headset & Controllers */}
            <Animated.View
              style={[
                styles.characterContainer,
                {
                  transform: [{ translateY: centerBobY }],
                },
              ]}
            >
              {/* Character Head & VR Goggles */}
              <View style={styles.characterHeadBox}>
                <View style={styles.characterNeck} />
                <View style={styles.vrHeadsetBand}>
                  <View style={styles.vrVisor}>
                    <View style={styles.vrLensDot} />
                    <View style={styles.vrLensDot} />
                  </View>
                </View>
              </View>

              {/* Character Torso in 3D Violet */}
              <View style={styles.characterTorso}>
                {/* Left Arm Holding Controller */}
                <View style={styles.armLeftWrap}>
                  <View style={styles.armLeftLimb} />
                  <View style={styles.controllerGrip}>
                    <View style={[styles.controllerBulb, { backgroundColor: "#EC4899" }]} />
                  </View>
                </View>

                {/* Right Arm Holding Controller */}
                <View style={styles.armRightWrap}>
                  <View style={styles.armRightLimb} />
                  <View style={styles.controllerGrip}>
                    <View style={[styles.controllerBulb, { backgroundColor: "#38BDF8" }]} />
                  </View>
                </View>
              </View>
            </Animated.View>
          </View>
        );

      case "goal":
        return (
          <View style={styles.graphicWrap}>
            {/* Ambient Animated Glow Rings */}
            <Animated.View
              style={[
                styles.ambientCircleBig,
                {
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  transform: [{ scale: pulseScale }],
                },
              ]}
            />

            {/* Twinkling Star Sparkles */}
            <Animated.Text
              style={[
                styles.sparkleStar,
                { top: 24, left: 36, opacity: sparkleOpacity, transform: [{ scale: sparkleScale }] },
              ]}
            >
              ✦
            </Animated.Text>
            <Animated.Text
              style={[
                styles.sparkleStar,
                { top: 52, right: 38, opacity: sparkleOpacity, transform: [{ scale: sparkleScale }] },
              ]}
            >
              +
            </Animated.Text>
            <Animated.Text
              style={[
                styles.sparkleStar,
                { bottom: 48, right: 42, opacity: sparkleOpacity, transform: [{ scale: sparkleScale }] },
              ]}
            >
              ✦
            </Animated.Text>

            {/* Floating Victory Milestone Badges */}
            <Animated.View
              style={[
                styles.arcIconSquircle,
                { top: 22, left: 28, backgroundColor: "#F59E0B", transform: [{ translateY: arcBob2 }] },
              ]}
            >
              <Ionicons name="trophy" size={21} color="#FFFFFF" />
            </Animated.View>

            <Animated.View
              style={[
                styles.arcIconSquircle,
                { top: 16, right: 34, backgroundColor: "#10B981", transform: [{ translateY: arcBob1 }] },
              ]}
            >
              <Ionicons name="trending-up" size={21} color="#FFFFFF" />
            </Animated.View>

            <Animated.View
              style={[
                styles.arcIconSquircle,
                { bottom: 54, right: 26, backgroundColor: "#6366F1", transform: [{ translateY: arcBob4 }] },
              ]}
            >
              <Ionicons name="funnel" size={19} color="#FFFFFF" />
            </Animated.View>

            {/* 3D Hiker with Backpack Planting Goal Flag on Summit (Reference match!) */}
            <Animated.View
              style={[
                styles.characterContainer,
                {
                  transform: [{ translateY: centerBobY }],
                },
              ]}
            >
              <View style={styles.hikerScene}>
                {/* Tall Pole with Waving White Goal Flag */}
                <View style={styles.flagPoleContainer}>
                  <View style={styles.flagCloth}>
                    <Ionicons name="checkmark-circle" size={16} color="#EC4899" />
                    <Text style={styles.flagClothText}>GOAL WON</Text>
                  </View>
                  <View style={styles.flagPoleMast} />
                </View>

                {/* Hiker Figure with Backpack */}
                <View style={styles.hikerFigure}>
                  <View style={styles.hikerBackpack} />
                  <View style={styles.hikerHead} />
                  <View style={styles.hikerJacket} />
                  <View style={styles.hikerLegsRow}>
                    <View style={styles.hikerLeg} />
                    <View style={styles.hikerLegBent} />
                  </View>
                </View>

                {/* Rocky Mountain Summit Rock */}
                <View style={styles.summitRock} />
              </View>
            </Animated.View>
          </View>
        );

      case "growth":
        return (
          <View style={styles.graphicWrap}>
            {/* Ambient Animated Glow Rings */}
            <Animated.View
              style={[
                styles.ambientCircleBig,
                {
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  transform: [{ scale: pulseScale }],
                },
              ]}
            />

            {/* Twinkling Star Sparkles */}
            <Animated.Text
              style={[
                styles.sparkleStar,
                { top: 26, left: 34, opacity: sparkleOpacity, transform: [{ scale: sparkleScale }] },
              ]}
            >
              ✦
            </Animated.Text>
            <Animated.Text
              style={[
                styles.sparkleStar,
                { top: 62, right: 40, opacity: sparkleOpacity, transform: [{ scale: sparkleScale }] },
              ]}
            >
              +
            </Animated.Text>

            {/* Floating Smiling Emoji Speech Bubble (Reference match!) */}
            <Animated.View
              style={[
                styles.emojiBubblePill,
                { transform: [{ translateY: arcBob1 }] },
              ]}
            >
              <Text style={styles.emojiText}>😎</Text>
            </Animated.View>

            {/* Floating Growth Badges */}
            <Animated.View
              style={[
                styles.arcIconSquircle,
                { top: 20, left: 26, backgroundColor: "#EF4444", transform: [{ translateY: arcBob3 }] },
              ]}
            >
              <Ionicons name="rocket" size={20} color="#FFFFFF" />
            </Animated.View>

            <Animated.View
              style={[
                styles.arcIconSquircle,
                { top: 24, right: 28, backgroundColor: "#0284C7", transform: [{ translateY: arcBob4 }] },
              ]}
            >
              <Ionicons name="qr-code" size={20} color="#FFFFFF" />
            </Animated.View>

            <Animated.View
              style={[
                styles.arcIconSquircle,
                { bottom: 50, left: 32, backgroundColor: "#8B5CF6", transform: [{ translateY: arcBob2 }] },
              ]}
            >
              <Ionicons name="link" size={20} color="#FFFFFF" />
            </Animated.View>

            {/* Character Holding Smartphone with Two Hands (Reference match!) */}
            <Animated.View
              style={[
                styles.characterContainer,
                {
                  transform: [{ translateY: centerBobY }],
                },
              ]}
            >
              <View style={styles.phoneUserScene}>
                {/* Backpack on back */}
                <View style={styles.userBackpack} />
                {/* Head */}
                <View style={styles.userHead} />
                {/* Jacket Body */}
                <View style={styles.userJacket}>
                  {/* Both Arms holding mobile phone */}
                  <View style={styles.armsHoldingPhone}>
                    <View style={styles.mobilePhoneMock}>
                      <View style={styles.mobilePhoneScreen}>
                        <Ionicons name="pulse" size={14} color="#38BDF8" />
                      </View>
                    </View>
                  </View>
                </View>
                {/* Legs */}
                <View style={styles.userLegsRow}>
                  <View style={styles.userLeg} />
                  <View style={styles.userLeg} />
                </View>
              </View>
            </Animated.View>
          </View>
        );
    }
  };

  // Render slide content (Header, 3D Graphic, Title, Subtitle, Stepper)
  const renderSlideContent = (slide: SlideData, slideIdx: number) => {
    return (
      <View style={styles.slideContentWrapper}>
        {/* Top Header Category Pill */}
        <View style={[styles.topHeader, { paddingTop: insets.top + 8 }]}>
          <View style={styles.appTag}>
            <Text style={styles.appTagText}>{slide.accentBadge}</Text>
          </View>
        </View>

        {/* Center 3D Illustration Graphic Stage */}
        <View style={styles.centerStage}>{renderSlideGraphic(slide.graphicType)}</View>

        {/* Bottom Content: Bold Title, Subtitle & Stepper Indicator */}
        <View style={[styles.bottomCard, { paddingBottom: (insets.bottom || 24) + 68 }]}>
          <Text style={styles.titleText} numberOfLines={1}>
            {slide.title}
          </Text>
          <Text style={styles.subtitleText} numberOfLines={2}>
            {slide.subtitle}
          </Text>

          {/* Stepper Indicators */}
          <View style={styles.stepperRow}>
            {SLIDES.map((_, dotIdx) => {
              const isActive = dotIdx === slideIdx;
              return (
                <View
                  key={dotIdx}
                  style={[
                    styles.stepperDot,
                    isActive ? styles.stepperDotActive : styles.stepperDotInactive,
                  ]}
                />
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: dynamicSlideColor,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <StatusBar style="light" />

      {/* Layer 1: CURRENT ACTIVE SLIDE (Slide A) */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: currentSlide.bgColor,
            opacity: outgoingOpacity,
            transform: [{ translateX: outgoingTranslateX }],
          },
        ]}
      >
        {renderSlideContent(currentSlide, currentIndex)}
      </Animated.View>

      {/* Layer 2: SVG LIQUID WAVE LAYER (Curved bulge sweeping across from right to left) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
          <Path d={computeLiquidWavePath(animProgress, touchY)} fill={incomingColor} />
        </Svg>

        {/* Circular Arrow Button ( > ) moving in 100% lockstep with the screen animation */}
        <Animated.View
          style={[
            styles.waveHandleTouch,
            {
              top: handleY - 22,
              transform: [{ translateX: waveButtonTranslateX }],
            },
          ]}
        >
          <Pressable hitSlop={14} onPress={goToNextSlide}>
            <Animated.View
              style={[
                styles.waveHandleBtn,
                {
                  transform: [{ translateX: peekNudgeX }],
                },
              ]}
            >
              <View style={styles.waveHandleCircle}>
                <Ionicons name="chevron-forward" size={19} color={incomingColor} />
              </View>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>

      {/* Layer 3: INCOMING SLIDE (Slide B) - ENTERS WITH THE WAVE FROM THE RIGHT IN LOCKED STEP! */}
      {incomingSlideIndex !== null && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: incomingOpacity,
              transform: [
                { translateX: incomingTranslateX },
                { scale: incomingScale },
              ],
            },
          ]}
          pointerEvents="none"
        >
          {renderSlideContent(SLIDES[incomingSlideIndex], incomingSlideIndex)}
        </Animated.View>
      )}

      {/* Permanently Fixed Bottom Bar */}
      <View
        style={[
          styles.fixedBottomBar,
          {
            paddingBottom: insets.bottom || 20,
          },
        ]}
      >
        <Pressable
          style={styles.actionButtonPressable}
          onPress={() => {
            void handleFinish();
          }}
        >
          {/* Permanent Black GET STARTED Button with synchronized transition feedback */}
          <Animated.View
            style={[
              styles.actionButton,
              styles.actionButtonBlack,
              {
                transform: [
                  { scale: bottomButtonScale },
                  { translateY: bottomButtonTranslateY },
                ],
              },
            ]}
          >
            <Text style={styles.actionButtonText}>GET STARTED</Text>
          </Animated.View>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  slideContentWrapper: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "space-between",
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  appTag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
  },
  appTagText: {
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#FFFFFF",
  },

  // Wave Handle Apex Button ( > )
  waveHandleTouch: {
    position: "absolute",
    right: 14,
    zIndex: 999,
  },
  waveHandleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: -3, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 7,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  waveHandleCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  // Center Stage
  centerStage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  graphicWrap: {
    width: "100%",
    height: 310,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  ambientCircleBig: {
    position: "absolute",
    width: 270,
    height: 270,
    borderRadius: 135,
  },
  ambientCircleSmall: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  sparkleStar: {
    position: "absolute",
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "900",
  },

  // Arched Floating 3D Icon Squircles (Reference Screenshot Match!)
  floatingArcContainer: {
    position: "absolute",
    top: 6,
    width: "100%",
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  arcIconSquircle: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  arcPos1: {
    left: 20,
    top: 72,
  },
  arcPos2: {
    left: 64,
    top: 18,
  },
  arcPos3: {
    top: 6,
    alignSelf: "center",
  },
  arcPos4: {
    right: 64,
    top: 18,
  },
  arcPos5: {
    right: 20,
    top: 68,
  },
  arcPalettePill: {
    position: "absolute",
    right: 28,
    top: 122,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  paletteDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },

  // 3D VR Character (Slide 1)
  characterContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 68,
  },
  characterHeadBox: {
    alignItems: "center",
    justifyContent: "center",
  },
  characterNeck: {
    width: 14,
    height: 10,
    backgroundColor: "#FED7AA",
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    zIndex: 1,
  },
  vrHeadsetBand: {
    width: 58,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FED7AA",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  vrVisor: {
    width: 54,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: -2,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  vrLensDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#0F172A",
  },
  characterTorso: {
    width: 82,
    height: 72,
    backgroundColor: "#4F46E5",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    marginTop: -4,
    position: "relative",
    alignItems: "center",
  },
  armLeftWrap: {
    position: "absolute",
    left: -22,
    top: 12,
    alignItems: "center",
  },
  armLeftLimb: {
    width: 18,
    height: 44,
    borderRadius: 9,
    backgroundColor: "#4338CA",
    transform: [{ rotate: "32deg" }],
  },
  armRightWrap: {
    position: "absolute",
    right: -22,
    top: 12,
    alignItems: "center",
  },
  armRightLimb: {
    width: 18,
    height: 44,
    borderRadius: 9,
    backgroundColor: "#4338CA",
    transform: [{ rotate: "-32deg" }],
  },
  controllerGrip: {
    width: 12,
    height: 24,
    borderRadius: 6,
    backgroundColor: "#1E293B",
    alignItems: "center",
    marginTop: -8,
  },
  controllerBulb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: -8,
  },

  // 3D Hiker with Backpack & Goal Flag (Slide 2)
  hikerScene: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  flagPoleContainer: {
    position: "absolute",
    left: -32,
    top: -54,
    alignItems: "flex-start",
    zIndex: 2,
  },
  flagCloth: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderBottomLeftRadius: 2,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  flagClothText: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.5,
    color: "#0F172A",
  },
  flagPoleMast: {
    width: 4,
    height: 140,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    marginLeft: 2,
  },
  hikerFigure: {
    alignItems: "center",
    position: "relative",
  },
  hikerBackpack: {
    position: "absolute",
    left: -16,
    top: 36,
    width: 22,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#D97706",
  },
  hikerHead: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FED7AA",
  },
  hikerJacket: {
    width: 62,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#4338CA",
    marginTop: -4,
  },
  hikerLegsRow: {
    flexDirection: "row",
    gap: 14,
    marginTop: -2,
  },
  hikerLeg: {
    width: 14,
    height: 48,
    borderRadius: 7,
    backgroundColor: "#334155",
  },
  hikerLegBent: {
    width: 14,
    height: 44,
    borderRadius: 7,
    backgroundColor: "#334155",
    transform: [{ rotate: "15deg" }],
  },
  summitRock: {
    width: 140,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    marginTop: -4,
  },

  // 3D User with Smartphone & Reaction Bubble (Slide 3)
  emojiBubblePill: {
    position: "absolute",
    top: 22,
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.22,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  emojiText: {
    fontSize: 22,
  },
  phoneUserScene: {
    alignItems: "center",
    position: "relative",
  },
  userBackpack: {
    position: "absolute",
    left: -14,
    top: 34,
    width: 22,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#EA580C",
  },
  userHead: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FED7AA",
  },
  userJacket: {
    width: 62,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#6366F1",
    marginTop: -4,
    alignItems: "center",
    justifyContent: "center",
  },
  armsHoldingPhone: {
    alignItems: "center",
    justifyContent: "center",
  },
  mobilePhoneMock: {
    width: 26,
    height: 40,
    borderRadius: 6,
    backgroundColor: "#1E293B",
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  mobilePhoneScreen: {
    flex: 1,
    width: "100%",
    borderRadius: 4,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
  },
  userLegsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: -2,
  },
  userLeg: {
    width: 14,
    height: 50,
    borderRadius: 7,
    backgroundColor: "#334155",
  },

  // Bottom Text Area
  bottomCard: {
    paddingHorizontal: 28,
    paddingTop: 10,
    alignItems: "flex-start",
    gap: 10,
  },
  titleText: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: "#FFFFFF",
  },
  subtitleText: {
    fontSize: 13.5,
    lineHeight: 19,
    color: "rgba(255, 255, 255, 0.85)",
  },

  // Stepper Dashes/Pills matching user screenshots
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  stepperDot: {
    height: 4.5,
    borderRadius: 2.25,
  },
  stepperDotActive: {
    width: 26,
    backgroundColor: "#FFFFFF",
  },
  stepperDotInactive: {
    width: 7,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
  },

  // Permanently Fixed Bottom Bar
  fixedBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    paddingTop: 12,
    backgroundColor: "transparent",
    zIndex: 998,
  },
  actionButtonPressable: {
    width: "100%",
  },
  actionButton: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  actionButtonBlack: {
    backgroundColor: "#000000",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.4,
    color: "#FFFFFF",
  },
});
