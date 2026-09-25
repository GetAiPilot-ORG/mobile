import { getColors, useTheme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NotFoundScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const color = getColors(isDark);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Initial entrance spring + fade
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 65,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating idle animation
    const floating = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 8,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    );

    // Pulse animation for accent glow
    const pulsing = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
      ]),
    );

    floating.start();
    pulsing.start();

    return () => {
      floating.stop();
      pulsing.stop();
    };
  }, [fadeAnim, floatAnim, pulseAnim, scaleAnim]);

  const handleHome = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.replace("/(tabs)");
  };

  const handleBack = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: color.background,
          paddingTop: Math.max(insets.top + 20, 44),
          paddingBottom: Math.max(insets.bottom + 24, 32),
        },
      ]}
    >
      {/* Ambient background glow */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glowCircle,
          {
            transform: [{ scale: pulseAnim }],
            backgroundColor: isDark
              ? "rgba(10, 132, 255, 0.12)"
              : "rgba(0, 122, 255, 0.08)",
          },
        ]}
      />

      <Animated.View
        style={[
          styles.contentWrapper,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Animated Badge / Illustration */}
        <Animated.View
          style={[
            styles.badgeContainer,
            { transform: [{ translateY: floatAnim }] },
          ]}
        >
          <LinearGradient
            colors={
              isDark
                ? ["rgba(30, 41, 59, 0.8)", "rgba(15, 23, 42, 0.95)"]
                : ["rgba(255, 255, 255, 0.95)", "rgba(241, 245, 249, 0.9)"]
            }
            style={[
              styles.badgeGradient,
              {
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.12)"
                  : "rgba(0, 0, 0, 0.08)",
              },
            ]}
          >
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: isDark
                    ? "rgba(10, 132, 255, 0.15)"
                    : "rgba(0, 122, 255, 0.12)",
                },
              ]}
            >
              <Ionicons
                name="compass-outline"
                size={44}
                color={isDark ? "#0A84FF" : "#007AFF"}
              />
            </View>

            {/* Glowing 404 Tag */}
            <View
              style={[
                styles.codePill,
                {
                  backgroundColor: isDark
                    ? "rgba(10, 132, 255, 0.2)"
                    : "rgba(0, 122, 255, 0.1)",
                  borderColor: isDark
                    ? "rgba(10, 132, 255, 0.4)"
                    : "rgba(0, 122, 255, 0.3)",
                },
              ]}
            >
              <Text
                style={[
                  styles.codeText,
                  { color: isDark ? "#60A5FA" : "#007AFF" },
                ]}
              >
                404
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Text Header */}
        <Text style={[styles.title, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
          Page Not Found
        </Text>

        <Text
          style={[
            styles.description,
            { color: isDark ? "#94A3B8" : "#64748B" },
          ]}
        >
          The screen or resource you're looking for doesn't exist, was moved, or
          is temporarily unavailable.
        </Text>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Pressable
            onPress={handleHome}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.btnPressed,
            ]}
          >
            <LinearGradient
              colors={["#0A84FF", "#0066CC"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryBtnGradient}
            >
              <Ionicons
                name="home"
                size={18}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.primaryBtnText}>Back to Home</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.secondaryBtn,
              {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(0, 0, 0, 0.04)",
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.12)"
                  : "rgba(0, 0, 0, 0.08)",
              },
              pressed && styles.btnPressed,
            ]}
          >
            <Ionicons
              name="arrow-back"
              size={18}
              color={isDark ? "#E2E8F0" : "#334155"}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.secondaryBtnText,
                { color: isDark ? "#E2E8F0" : "#334155" },
              ]}
            >
              Go Back
            </Text>
          </Pressable>
        </View>

        {/* Sub-footer Note */}
        <Text
          style={[styles.footerNote, { color: isDark ? "#475569" : "#94A3B8" }]}
        >
          GetAiPilot Workspace Navigation
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  glowCircle: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    top: "25%",
  },
  contentWrapper: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  badgeContainer: {
    marginBottom: 28,
  },
  badgeGradient: {
    width: 140,
    height: 140,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: "0 12px 28px rgba(0, 0, 0, 0.16)",
      } as any,
      default: {},
    }),
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  codePill: {
    position: "absolute",
    bottom: -10,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  codeText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginBottom: 10,
    textAlign: "center",
  },
  description: {
    fontSize: 14.5,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 320,
    marginBottom: 32,
  },
  actionsContainer: {
    width: "100%",
    gap: 12,
    alignItems: "center",
  },
  primaryBtn: {
    width: "100%",
    height: 52,
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#0A84FF",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: "0 6px 16px rgba(10, 132, 255, 0.28)",
      } as any,
      default: {},
    }),
  },
  primaryBtnGradient: {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  secondaryBtn: {
    width: "100%",
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    fontSize: 14.5,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  footerNote: {
    fontSize: 11.5,
    marginTop: 28,
    letterSpacing: -0.1,
  },
});
