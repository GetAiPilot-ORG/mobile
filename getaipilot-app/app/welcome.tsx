import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Animated,
  Easing,
  Image,
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
  image: any;
  aspectRatio: number;
  heightRatio?: number;
  paddingLeft?: number;
}

// User-specified color palette: #746df9, #e545feff, #bf1162ff
const SLIDES: SlideData[] = [
  {
    id: "messaging",
    title: "Best Digital Solution",
    subtitle: "Automate WhatsApp, Telegram & AI voice agents to convert visitors into customers.",
    bgColor: "#746df9", // Electric Violet / Purple-Blue
    image: require("../assets/images/welcome-slide-1.png"),
    aspectRatio: 396 / 752,
    heightRatio: 0.54,
    paddingLeft: 24,
  },
  {
    id: "goal",
    title: "Achieve Your Goal",
    subtitle: "Capture every lead, track deals through visual stages, and close sales faster.",
    bgColor: "#bf1162ff", // Vibrant Magenta / Hot Pink
    image: require("../assets/images/welcome-slide-2.png"),
    aspectRatio: 576 / 770,
    heightRatio: 0.46, // Calibrated height so the wider robot image and head align flush-left
    paddingLeft: 20,
  },
  {
    id: "growth",
    title: "Increase Your Value",
    subtitle: "Launch high-converting landing funnels, bio sites, and custom branded QR codes.",
    bgColor: "#e545feff", // Warm Sunset Peach
    image: require("../assets/images/welcome-slide-3.png"),
    aspectRatio: 474 / 732,
    heightRatio: 0.52,
    paddingLeft: 24,
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

  // Interactive nudge cue on the right-edge peek button
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

  // Subtle nudge animation for right peek button
  useEffect(() => {
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
      nudgeLoop.stop();
    };
  }, [nudgeAnim]);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(style).catch(() => { });
    }
  };

  const currentSlide = SLIDES[currentIndex];
  const nextTargetIndex = Math.min(SLIDES.length - 1, currentIndex + 1);
  const nextSlide = SLIDES[nextTargetIndex];

  // Complete tour and navigate to login screen
  const handleFinish = useCallback(async () => {
    soundService.play("click");
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await AsyncStorage.setItem(HAS_SEEN_TOUR_KEY, "true");
    } catch { }

    if (authStatus === "authenticated") {
      router.replace("/(tabs)" as any);
    } else {
      router.replace("/(auth)/login" as any);
    }
  }, [authStatus, router]);

  // When reaching the third screen (index 2), automatically navigate to login screen
  useEffect(() => {
    if (currentIndex === SLIDES.length - 1 && !isTransitioning) {
      const timer = setTimeout(() => {
        void handleFinish();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, isTransitioning, handleFinish]);

  // Perform the liquid wave sweep animation
  const goToNextSlide = useCallback(() => {
    if (isAnimatingRef.current) return;

    // If on the third screen already, directly go to login
    if (currentIndexRef.current >= SLIDES.length - 1) {
      void handleFinish();
      return;
    }

    isAnimatingRef.current = true;
    const targetIdx = currentIndexRef.current + 1;
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
      currentIndexRef.current = targetIdx;
      setCurrentIndex(targetIdx);

      // Wait two frames before resetting wave to eliminate blink
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
  }, [waveAnim, handleFinish]);

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

  const goToNextSlideRef = useRef(goToNextSlide);
  goToNextSlideRef.current = goToNextSlide;
  const goToPrevSlideRef = useRef(goToPrevSlide);
  goToPrevSlideRef.current = goToPrevSlide;

  // PanResponder for interactive liquid swipe
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (isAnimatingRef.current) return false;
        return Math.abs(gestureState.dx) > 8 || Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => {
        if (currentIndexRef.current >= SLIDES.length - 1) return;
        const targetIdx = currentIndexRef.current + 1;
        setIncomingSlideIndex(targetIdx);
        setIsTransitioning(true);
      },
      onPanResponderMove: (_, gestureState) => {
        if (isAnimatingRef.current || currentIndexRef.current >= SLIDES.length - 1) return;

        if (gestureState.moveY) {
          setTouchY(gestureState.moveY);
        }

        const horizontalDist = -gestureState.dx;
        const verticalDist = -gestureState.dy;
        const activeDist = Math.max(horizontalDist, verticalDist * 0.85);

        if (activeDist > 0) {
          const ratio = Math.min(1, Math.max(0, activeDist / (width * 0.72)));
          waveAnim.setValue(ratio);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isAnimatingRef.current) return;

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
          if (currentIndexRef.current >= SLIDES.length - 1) {
            void handleFinish();
          } else {
            goToNextSlideRef.current();
          }
        } else if (shouldGoBack && currentIndexRef.current > 0) {
          setIsTransitioning(false);
          setIncomingSlideIndex(null);
          goToPrevSlideRef.current();
        } else {
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

  // Compute organic liquid SVG wave path
  const computeLiquidWavePath = (p: number, tY: number) => {
    const W = width;
    const H = height;
    const baseY = tY || H * 0.52;

    const apexDepth = 38 + (W + 120) * p;
    const apexX = W - apexDepth;

    const baseDepth = (W + 80) * Math.max(0, (p - 0.08) / 0.92);
    const baseX = W - baseDepth;

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

  const handleApexDepth = 38 + (width + 120) * animProgress;
  const handleX = width - handleApexDepth + 18;
  const handleY = touchY || height * 0.52;

  const peekNudgeX = nudgeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  const waveButtonTranslateX = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -(width + 80)],
  });

  const bottomButtonScale = waveAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.95, 1],
  });
  const bottomButtonTranslateY = waveAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 3, 0],
  });

  const incomingColor = incomingSlideIndex !== null ? SLIDES[incomingSlideIndex].bgColor : nextSlide.bgColor;

  const dynamicSlideColor = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [currentSlide.bgColor, incomingColor],
  });

  const outgoingTranslateX = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -width * 0.35],
  });
  const outgoingOpacity = waveAnim.interpolate({
    inputRange: [0, 0.75, 1],
    outputRange: [1, 0.45, 0],
  });

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

  // Render slide content (Top Bar, Top-left Title & Subtitle, Center Static Image, Centered Stepper)
  const renderSlideContent = (slide: SlideData, slideIdx: number) => {
    return (
      <View style={styles.slideContentWrapper}>
        {/* Top Bar: Counter (01 / 03), Segmented Bars, and Skip button */}
        <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.counterText}>{`0${slideIdx + 1} / 0${SLIDES.length}`}</Text>
          <View style={styles.progressSegmentsRow}>
            {SLIDES.map((_, pIdx) => (
              <View
                key={pIdx}
                style={[
                  styles.progressSegment,
                  pIdx <= slideIdx ? styles.progressSegmentActive : styles.progressSegmentInactive,
                ]}
              />
            ))}
          </View>
          <Pressable onPress={() => void handleFinish()} hitSlop={12}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        {/* Top-Left Title and Subtitle */}
        <View style={styles.topHeader}>
          <Text style={styles.titleText}>{slide.title}</Text>
          <Text style={styles.subtitleText}>{slide.subtitle}</Text>
        </View>

        {/* Left-Aligned & Enlarged Static 3D Image */}
        <View
          style={[
            styles.centerStage,
            {
              paddingBottom: (insets.bottom || 20) + 72,
              paddingLeft: slide.paddingLeft ?? 24,
            },
          ]}
        >
          <Image
            source={slide.image}
            style={[
              styles.centerImage,
              {
                height: Math.min(height * (slide.heightRatio ?? 0.54), 480),
                aspectRatio: slide.aspectRatio,
              },
            ]}
            resizeMode="contain"
          />
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

      {/* Layer 1: CURRENT ACTIVE SLIDE */}
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

      {/* Layer 2: SVG LIQUID WAVE LAYER */}
      {currentIndex < SLIDES.length - 1 && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
            <Path d={computeLiquidWavePath(animProgress, touchY)} fill={incomingColor} />
          </Svg>

          {/* Circular Arrow Button ( > ) */}
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
      )}

      {/* Layer 3: INCOMING SLIDE */}
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
            <Text style={styles.actionButtonText}>Get Started →</Text>
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
  topBar: {
    paddingHorizontal: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  counterText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  progressSegmentsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    marginHorizontal: 16,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
  },
  progressSegmentActive: {
    backgroundColor: "#FFFFFF",
  },
  progressSegmentInactive: {
    backgroundColor: "rgba(255, 255, 255, 0.28)",
  },
  skipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    opacity: 0.88,
  },
  topHeader: {
    paddingHorizontal: 28,
    alignItems: "flex-start",
    gap: 8,
  },
  titleText: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.5,
    color: "#FFFFFF",
    textAlign: "left",
  },
  subtitleText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.88)",
    textAlign: "left",
    maxWidth: "92%",
  },

  // Center Stage with left-aligned enlarged image
  centerStage: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  centerImage: {
    alignSelf: "flex-start",
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
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: "#FFFFFF",
  },
});
