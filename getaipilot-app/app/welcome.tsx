import React, { useRef, useState, useEffect } from "react";
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
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Link01Icon,
  QrCode01Icon,
  Rocket01Icon,
  TelegramIcon,
  VoiceToTextIcon,
  WhatsappIcon,
} from "@/constants/icons";
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
  const [touchY, setTouchY] = useState(height * 0.52);

  // Animation progress: 0 = idle handle peeking, 1 = wave fully covers screen
  const waveAnim = useRef(new Animated.Value(0)).current;
  const [animProgress, setAnimProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Content fade animation during slide changes
  const contentFadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const listenerId = waveAnim.addListener(({ value }) => {
      setAnimProgress(value);
    });
    return () => {
      waveAnim.removeListener(listenerId);
    };
  }, [waveAnim]);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(style).catch(() => { });
    }
  };

  const currentSlide = SLIDES[currentIndex];
  const nextIndex = (currentIndex + 1) % SLIDES.length;
  const nextSlide = SLIDES[nextIndex];
  const isLastSlide = currentIndex === SLIDES.length - 1;

  // Complete tour and navigate
  const handleFinish = async () => {
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
  };

  // Perform wave sweep transition to next slide
  const goToNextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    soundService.play("pop");
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    // Fade out current slide text slightly
    Animated.timing(contentFadeAnim, {
      toValue: 0.1,
      duration: 180,
      useNativeDriver: true,
    }).start();

    Animated.timing(waveAnim, {
      toValue: 1,
      duration: 520,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: false,
    }).start(() => {
      setCurrentIndex(nextIndex);
      waveAnim.setValue(0);
      setAnimProgress(0);
      setIsAnimating(false);

      // Fade in new slide content
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
  };

  // Go to previous slide
  const goToPrevSlide = () => {
    if (currentIndex === 0 || isAnimating) return;
    setIsAnimating(true);
    soundService.play("click");
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);

    Animated.timing(contentFadeAnim, {
      toValue: 0.1,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setCurrentIndex(currentIndex - 1);
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setIsAnimating(false);
      });
    });
  };

  // PanResponder to support interactive horizontal/vertical swipe
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 12 && !isAnimating;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.moveY) {
          setTouchY(gestureState.moveY);
        }
        if (gestureState.dx < 0) {
          // Dragging left (expanding wave)
          const ratio = Math.min(1, Math.max(0, -gestureState.dx / (width * 0.75)));
          waveAnim.setValue(ratio);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -width * 0.22 || gestureState.vx < -0.5) {
          goToNextSlide();
        } else if (gestureState.dx > width * 0.25 || gestureState.vx > 0.5) {
          goToPrevSlide();
        } else {
          // Snap back
          Animated.spring(waveAnim, {
            toValue: 0,
            useNativeDriver: false,
            bounciness: 6,
          }).start();
        }
      },
    })
  ).current;

  // Compute organic liquid SVG wave path
  const computeLiquidWavePath = (p: number, tY: number) => {
    const W = width;
    const H = height;
    const baseY = tY || H * 0.52;

    // Peak protrusion: starts at 54px when idle, sweeps across to beyond -80px
    const apexDepth = 54 + (W + 120) * p;
    const apexX = W - apexDepth;

    // Base background wall advances smoothly as progress increases
    const baseDepth = (W + 80) * Math.max(0, (p - 0.08) / 0.92);
    const baseX = W - baseDepth;

    // Vertical curve spread
    const curveRadius = 135 + 160 * p;
    const topY = Math.max(0, baseY - curveRadius);
    const bottomY = Math.min(H, baseY + curveRadius);

    return `
      M ${W} 0
      L ${baseX} 0
      L ${baseX} ${topY}
      C ${baseX - (apexDepth - baseDepth) * 0.25} ${topY + (baseY - topY) * 0.45},
        ${apexX} ${baseY - (baseY - topY) * 0.25},
        ${apexX} ${baseY}
      C ${apexX} ${baseY + (bottomY - baseY) * 0.25},
        ${baseX - (apexDepth - baseDepth) * 0.25} ${bottomY - (bottomY - baseY) * 0.45},
        ${baseX} ${bottomY}
      L ${baseX} ${H}
      L ${W} ${H}
      Z
    `;
  };

  // Button handle position inside the apex
  const handleApexDepth = 54 + (width + 120) * animProgress;
  const handleX = width - handleApexDepth + 26;
  const handleY = touchY || height * 0.52;

  // Render 3D-styled graphics for each slide
  const renderSlideGraphic = (type: SlideData["graphicType"]) => {
    switch (type) {
      case "messaging":
        return (
          <View style={styles.graphicWrap}>
            {/* Ambient Background Circles */}
            <View style={[styles.ambientCircleBig, { backgroundColor: "rgba(255, 255, 255, 0.1)" }]} />
            <View style={[styles.ambientCircleSmall, { backgroundColor: "rgba(255, 255, 255, 0.16)" }]} />

            {/* Central 3D Avatar Stage */}
            <View style={styles.avatarStageBox}>
              <View style={styles.avatarHeadphoneRing}>
                <Ionicons name="headset" size={42} color="#FFFFFF" />
              </View>
              <View style={styles.vrGogglePill}>
                <View style={styles.vrLens} />
                <View style={styles.vrLens} />
              </View>
            </View>

            {/* Orbiting Floating Feature Cards */}
            <View style={[styles.floatingCard, styles.floatTopLeft]}>
              <HugeiconsIcon icon={WhatsappIcon} size={18} color="#22C55E" strokeWidth={2} />
              <Text style={styles.floatingCardText}>WhatsApp API</Text>
            </View>

            <View style={[styles.floatingCard, styles.floatTopRight]}>
              <HugeiconsIcon icon={TelegramIcon} size={18} color="#38BDF8" strokeWidth={2} />
              <Text style={styles.floatingCardText}>Telegram Bot</Text>
            </View>

            <View style={[styles.floatingCard, styles.floatBottomLeft]}>
              <Ionicons name="chatbubbles" size={16} color="#FBBF24" />
              <Text style={styles.floatingCardText}>AI Chatbot</Text>
            </View>

            <View style={[styles.floatingCard, styles.floatBottomRight]}>
              <Ionicons name="call" size={15} color="#A78BFA" />
              <Text style={styles.floatingCardText}>Voice Agents</Text>
            </View>
          </View>
        );

      case "goal":
        return (
          <View style={styles.graphicWrap}>
            {/* Ambient Circles */}
            <View style={[styles.ambientCircleBig, { backgroundColor: "rgba(255, 255, 255, 0.1)" }]} />

            {/* Mountain Peak & Victory Flag */}
            <View style={styles.goalStageBox}>
              <View style={styles.flagPole}>
                <View style={styles.flagBanner}>
                  <Ionicons name="flag" size={24} color="#FFFFFF" />
                  <Text style={styles.flagText}>Goal Won</Text>
                </View>
              </View>
              <View style={styles.peakBase} />
            </View>

            {/* CRM Deal Metrics floating */}
            <View style={[styles.floatingCard, styles.floatTopLeft]}>
              <Ionicons name="trophy" size={16} color="#FBBF24" />
              <Text style={styles.floatingCardText}>Deal Won: $4,800</Text>
            </View>

            <View style={[styles.floatingCard, styles.floatTopRight]}>
              <Ionicons name="funnel" size={16} color="#10B981" />
              <Text style={styles.floatingCardText}>Pipeline CRM</Text>
            </View>

            <View style={[styles.floatingCard, styles.floatBottomLeft]}>
              <Ionicons name="document-text" size={16} color="#38BDF8" />
              <Text style={styles.floatingCardText}>Instant Invoices</Text>
            </View>

            <View style={[styles.floatingCard, styles.floatBottomRight]}>
              <Ionicons name="trending-up" size={16} color="#EC4899" />
              <Text style={styles.floatingCardText}>+184% Growth</Text>
            </View>
          </View>
        );

      case "growth":
        return (
          <View style={styles.graphicWrap}>
            {/* Ambient Circles */}
            <View style={[styles.ambientCircleBig, { backgroundColor: "rgba(255, 255, 255, 0.1)" }]} />

            {/* Mobile Device with Bio Site & QR */}
            <View style={styles.phoneMockupBox}>
              <View style={styles.phoneMockupInner}>
                <View style={styles.phoneMockupNotch} />
                <View style={styles.qrCenterBox}>
                  <HugeiconsIcon icon={QrCode01Icon} size={36} color="#FFFFFF" strokeWidth={2} />
                </View>
                <View style={styles.bioLinkMockPill}>
                  <Text style={styles.bioLinkMockText}>getaipilot.in/bio</Text>
                </View>
              </View>
            </View>

            {/* Floating Growth Badges */}
            <View style={[styles.floatingCard, styles.floatTopLeft]}>
              <HugeiconsIcon icon={Rocket01Icon} size={16} color="#F43F5E" strokeWidth={2} />
              <Text style={styles.floatingCardText}>Landing Funnels</Text>
            </View>

            <View style={[styles.floatingCard, styles.floatTopRight]}>
              <HugeiconsIcon icon={Link01Icon} size={16} color="#38BDF8" strokeWidth={2} />
              <Text style={styles.floatingCardText}>Tracked Short Links</Text>
            </View>

            <View style={[styles.floatingCard, styles.floatBottomLeft]}>
              <HugeiconsIcon icon={VoiceToTextIcon} size={16} color="#FBBF24" strokeWidth={2} />
              <Text style={styles.floatingCardText}>AI Audio-to-Text</Text>
            </View>

            <View style={[styles.floatingCard, styles.floatBottomRight]}>
              <Ionicons name="print-outline" size={16} color="#7C3AED" />
              <Text style={styles.floatingCardText}>Print Standees</Text>
            </View>
          </View>
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: currentSlide.bgColor }]} {...panResponder.panHandlers}>
      <StatusBar style="light" />

      {/* SVG Liquid Wave Layer: overlays next slide's color */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
          <Path d={computeLiquidWavePath(animProgress, touchY)} fill={nextSlide.bgColor} />
        </Svg>

        {/* Circular Arrow Button ( > ) positioned at the wave handle apex */}
        <Pressable
          style={[
            styles.waveHandleBtn,
            {
              left: Math.max(16, Math.min(width - 48, handleX)),
              top: handleY - 22,
            },
          ]}
          hitSlop={14}
          onPress={goToNextSlide}
        >
          <View style={styles.waveHandleCircle}>
            <Ionicons name="chevron-forward" size={18} color={nextSlide.bgColor} />
          </View>
        </Pressable>
      </View>

      {/* Top Header Tag */}
      <View style={[styles.topHeader, { paddingTop: insets.top + 8 }]}>
        <View style={styles.appTag}>
          <Text style={styles.appTagText}>{currentSlide.accentBadge}</Text>
        </View>
      </View>

      {/* Center 3D Illustration Graphic Stage */}
      <Animated.View style={[styles.centerStage, { opacity: contentFadeAnim }]}>
        {renderSlideGraphic(currentSlide.graphicType)}
      </Animated.View>

      {/* Bottom Content: Title, Subtitle & Stepper Dots */}
      <Animated.View
        style={[
          styles.bottomCard,
          {
            paddingBottom: (insets.bottom || 24) + 68,
            opacity: contentFadeAnim,
          },
        ]}
      >
        {/* 1. Bold Title (One Line Title matching user screenshot) */}
        <Text style={styles.titleText} numberOfLines={1}>
          {currentSlide.title}
        </Text>

        {/* 2. Subtitle */}
        <Text style={styles.subtitleText} numberOfLines={2}>
          {currentSlide.subtitle}
        </Text>

        {/* 3. Stepper Indicators (Dashes / Pills matching user screenshot) */}
        <View style={styles.stepperRow}>
          {SLIDES.map((_, idx) => {
            const isActive = idx === currentIndex;
            return (
              <View
                key={idx}
                style={[
                  styles.stepperDot,
                  isActive ? styles.stepperDotActive : styles.stepperDotInactive,
                ]}
              />
            );
          })}
        </View>
      </Animated.View>

      {/* 4. Permanently Fixed Bottom Button: [ GET STARTED ] */}
      <View
        style={[
          styles.fixedBottomBar,
          {
            paddingBottom: insets.bottom || 20,
          },
        ]}
      >
        <Pressable
          style={[styles.actionButton, styles.actionButtonFinal]}
          onPress={() => {
            void handleFinish();
          }}
        >
          <Text
            style={[
              styles.actionButtonText,
              styles.actionButtonFinalText,
              { color: currentSlide.bgColor },
            ]}
          >
            GET STARTED
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
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

  // Liquid Wave Handle Button ( > ) with Platform.select Shadow
  waveHandleBtn: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    zIndex: 999,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: -2, height: 3 },
        shadowOpacity: 0.28,
        shadowRadius: 6,
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
    paddingHorizontal: 20,
  },
  graphicWrap: {
    width: "100%",
    height: 290,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  ambientCircleBig: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  ambientCircleSmall: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
  },

  // 3D Avatar Box (Slide 1) with Platform Shadow
  avatarStageBox: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  avatarHeadphoneRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 10,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  vrGogglePill: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    marginTop: -16,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  vrLens: {
    width: 12,
    height: 10,
    borderRadius: 4,
    backgroundColor: "#1E1E24",
  },

  // Floating Cards with Platform Shadow
  floatingCard: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  floatingCardText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#0F172A",
  },
  floatTopLeft: {
    top: 18,
    left: 8,
  },
  floatTopRight: {
    top: 24,
    right: 14,
  },
  floatBottomLeft: {
    bottom: 24,
    left: 10,
  },
  floatBottomRight: {
    bottom: 20,
    right: 12,
  },

  // Mountain & Flag (Slide 2)
  goalStageBox: {
    alignItems: "center",
    justifyContent: "center",
  },
  flagPole: {
    alignItems: "flex-start",
  },
  flagBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  flagText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  peakBase: {
    width: 120,
    height: 30,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 15,
    marginTop: 14,
  },

  // Phone Mockup (Slide 3)
  phoneMockupBox: {
    width: 140,
    height: 180,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.45)",
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  phoneMockupInner: {
    flex: 1,
    width: "100%",
    backgroundColor: "#1E1A2E",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  phoneMockupNotch: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  qrCenterBox: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  bioLinkMockPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  bioLinkMockText: {
    fontSize: 8.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Bottom Text Area
  bottomCard: {
    paddingHorizontal: 28,
    paddingTop: 10,
    alignItems: "flex-start",
    gap: 12,
  },
  titleText: {
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: "#FFFFFF",
  },
  subtitleText: {
    fontSize: 13.5,
    lineHeight: 19,
    color: "rgba(255, 255, 255, 0.82)",
  },

  // Stepper Dashes/Pills matching user screenshots
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginVertical: 4,
  },
  stepperDot: {
    height: 4.5,
    borderRadius: 2.25,
  },
  stepperDotActive: {
    width: 24,
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
    backgroundColor: "transparent",
    zIndex: 998,
  },
  actionButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonOutline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  actionButtonFinal: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  actionButtonText: {
    fontSize: 13.5,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  actionButtonOutlineText: {
    color: "#FFFFFF",
  },
  actionButtonFinalText: {
    fontWeight: "900",
  },
});
