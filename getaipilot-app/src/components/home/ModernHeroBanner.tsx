import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowRight01Icon } from "@/constants/icons";
import * as Haptics from "expo-haptics";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { HOME_SPACING, HOME_RADIUS } from "@/theme/homeTokens";

interface ModernHeroBannerProps {
  isDark: boolean;
  onExplorePress: () => void;
}

export function ModernHeroBanner({
  isDark,
  onExplorePress,
}: ModernHeroBannerProps) {
  const reducedMotion = useReducedMotion();

  // Floating levitation and gentle banking tilt for the 3D Pilot Mascot
  const floatAnim = useRef(new Animated.Value(0)).current;
  const tiltAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) return;

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(floatAnim, {
            toValue: -8,
            duration: 2400,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(tiltAnim, {
            toValue: 1,
            duration: 2400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(floatAnim, {
            toValue: 2,
            duration: 2400,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(tiltAnim, {
            toValue: -1,
            duration: 2400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    floatLoop.start();
    return () => floatLoop.stop();
  }, [floatAnim, tiltAnim, reducedMotion]);

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onExplorePress();
  };

  const cardBorder = isDark
    ? "rgba(167, 139, 250, 0.35)"
    : "rgba(147, 51, 234, 0.24)";
  const titleColor = isDark ? "#FFFFFF" : "#1A1726";
  const descColor = isDark ? "#C4BEDB" : "#4A4658";

  const gradientColors = isDark
    ? (["#22163E", "#150D27", "#0C0716"] as const)
    : (["#FAF5FF", "#F1E7FE", "#E2D0F8"] as const);

  const rotateDeg = tiltAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-2.5deg", "2.5deg"],
  });

  return (
    <View style={styles.outerContainer}>
      <View
        style={[
          styles.card,
          {
            borderColor: cardBorder,
            shadowColor: isDark ? "#8B5CF6" : "#6D28D9",
            shadowOpacity: isDark ? 0.38 : 0.12,
          },
        ]}
      >
        {/* 1. Multi-Stop 3D Gradient Surface */}
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* 2. Top Specular Glass Reflection */}
        <LinearGradient
          colors={
            isDark
              ? ["rgba(255, 255, 255, 0.15)", "transparent"]
              : ["rgba(255, 255, 255, 0.8)", "transparent"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0.65, y: 0.55 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* 3. Ambient Cyan & Violet Glow Wash behind Mascot */}
        <View style={styles.ambientAuraContainer} pointerEvents="none">
          <View
            style={[
              styles.cyanThrusterGlow,
              {
                backgroundColor: isDark
                  ? "rgba(56, 189, 248, 0.22)"
                  : "rgba(56, 189, 248, 0.18)",
              },
            ]}
          />
          <View
            style={[
              styles.violetHaloGlow,
              {
                backgroundColor: isDark
                  ? "rgba(168, 85, 247, 0.25)"
                  : "rgba(192, 132, 252, 0.24)",
              },
            ]}
          />
        </View>

        {/* Content Row: Text & CTA on Left, 3D Mascot on Right */}
        <View style={styles.contentRow}>
          {/* Left Text & CTA Block */}
          <View style={styles.textContainer}>
            {/* Pill Tag */}
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: isDark
                    ? "rgba(168, 85, 247, 0.22)"
                    : "rgba(124, 58, 237, 0.1)",
                  borderColor: isDark
                    ? "rgba(192, 132, 252, 0.38)"
                    : "rgba(124, 58, 237, 0.25)",
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: isDark ? "#C084FC" : "#7C3AED" },
                ]}
              >
                ✦ ALL-IN-ONE AI PILOT
              </Text>
            </View>

            {/* Main Headline */}
            <Text
              style={[
                styles.headline,
                { color: titleColor },
              ]}
            >
              Automate{"\n"}your business,{"\n"}your way.
            </Text>

            {/* Subtitle with High Contrast WCAG AA */}
            <Text
              style={[
                styles.subtext,
                { color: descColor },
              ]}
            >
              5 powerful AI engines & 10+ free tools to run your marketing,
              leads, messaging and calls on full autopilot.
            </Text>

            {/* CTA Button */}
            <Pressable
              cssInterop={false}
              onPress={handlePress}
              accessibilityRole="button"
              accessibilityLabel="Explore free tools. 10+ tools available."
              style={({ pressed }) => [
                styles.ctaButton,
                {
                  backgroundColor: isDark ? "#7C3AED" : "#1A1726",
                  transform: [{ scale: pressed && !reducedMotion ? 0.97 : 1 }],
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Text style={styles.ctaText}>Explore Free Tools</Text>
              <View style={styles.ctaIconWrapper}>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={15}
                  color="#FFFFFF"
                  strokeWidth={2.4}
                />
              </View>
            </Pressable>
          </View>

          {/* Right Visual Artwork: 3D Transparent Flying Mascot */}
          <View style={styles.artworkContainer}>
            <Animated.View
              style={[
                styles.floatingMascotWrapper,
                {
                  transform: [
                    { translateY: floatAnim },
                    { rotate: rotateDeg },
                  ],
                },
              ]}
            >
              <Image
                source={require("../../../assets/images/mascot-pilot.png")}
                style={styles.mascotImage}
                resizeMode="contain"
              />
            </Animated.View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: HOME_SPACING.md, // 16px normalized margin
    marginBottom: HOME_SPACING.lg,      // 24px normalized gap
  },
  card: {
    borderRadius: HOME_RADIUS.large,     // 24px normalized radius
    borderWidth: 1.2,
    overflow: "hidden",
    paddingVertical: 18,
    paddingHorizontal: 18,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 4,
    position: "relative",
  },
  ambientAuraContainer: {
    position: "absolute",
    right: -20,
    top: -20,
    width: 220,
    height: 220,
  },
  cyanThrusterGlow: {
    position: "absolute",
    right: 30,
    bottom: 25,
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  violetHaloGlow: {
    position: "absolute",
    right: 15,
    top: 25,
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    zIndex: 2,
  },
  textContainer: {
    flex: 1.15,
    paddingRight: 6,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  headline: {
    fontSize: 26,
    lineHeight: 31,
    fontWeight: "800",
    letterSpacing: -0.7,
    marginBottom: 8,
    includeFontPadding: false,
  },
  subtext: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "500",
    marginBottom: 14,
    includeFontPadding: false,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 9.5,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  ctaText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.2,
    marginRight: 6,
  },
  ctaIconWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  artworkContainer: {
    flex: 0.95,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  floatingMascotWrapper: {
    width: 138,
    height: 150,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  mascotImage: {
    width: 136,
    height: 148,
  },
});
