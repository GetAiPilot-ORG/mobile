import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { useTheme, getColors } from '@/theme';

export function OfflineNotice() {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const { isOffline, isReconnected, isChecking, refresh } = useNetworkStatus();

  const isVisible = isOffline || isReconnected;
  const useNative = Platform.OS !== "web";

  // Animation values
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for offline dot/icon
  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation | null = null;
    if (isOffline) {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 800,
            useNativeDriver: useNative,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: useNative,
          }),
        ])
      );
      pulseLoop.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      if (pulseLoop) pulseLoop.stop();
    };
  }, [isOffline, pulseAnim, useNative]);

  // Slide down / slide up animation
  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 15,
          stiffness: 140,
          useNativeDriver: useNative,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: useNative,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -120,
          duration: 300,
          useNativeDriver: useNative,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: useNative,
        }),
      ]).start();
    }
  }, [isVisible, opacity, translateY, useNative]);

  const handleRetry = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await refresh();
  };

  return (
    <View
      style={[
        styles.overlayContainer,
        {
          top: Math.max(insets.top + 6, 12),
          pointerEvents: "box-none" as any,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.banner,
          isReconnected
            ? isDark
              ? styles.reconnectedDark
              : styles.reconnectedLight
            : isDark
            ? styles.offlineDark
            : styles.offlineLight,
          {
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        {isReconnected ? (
          // Back Online UI
          <View style={styles.contentRow}>
            <View style={[styles.iconWrap, styles.iconWrapSuccess]}>
              <Ionicons name="checkmark-circle" size={18} color="#30D158" />
            </View>
            <View style={styles.textWrap}>
              <Text
                style={[
                  styles.titleText,
                  { color: isDark ? "#E5E7EB" : "#111827" },
                ]}
              >
                Back Online
              </Text>
              <Text
                style={[
                  styles.subText,
                  { color: isDark ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                Internet connection restored
              </Text>
            </View>
          </View>
        ) : (
          // Device Offline UI
          <View style={styles.contentRow}>
            <Animated.View
              style={[
                styles.iconWrap,
                styles.iconWrapOffline,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <Ionicons name="cloud-offline-outline" size={18} color="#FF453A" />
            </Animated.View>
            <View style={styles.textWrap}>
              <Text
                style={[
                  styles.titleText,
                  { color: isDark ? "#FFFFFF" : "#111827" },
                ]}
              >
                You're Offline
              </Text>
              <Text
                style={[
                  styles.subText,
                  { color: isDark ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                Check Wi-Fi or mobile data
              </Text>
            </View>

            <Pressable
              onPress={handleRetry}
              disabled={isChecking}
              style={({ pressed }) => [
                styles.retryButton,
                isDark ? styles.retryBtnDark : styles.retryBtnLight,
                pressed && styles.retryBtnPressed,
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {isChecking ? (
                <ActivityIndicator
                  size="small"
                  color={isDark ? "#FFFFFF" : "#111827"}
                />
              ) : (
                <View style={styles.retryInner}>
                  <Ionicons
                    name="refresh-outline"
                    size={14}
                    color={isDark ? "#FFFFFF" : "#111827"}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.retryText,
                      { color: isDark ? "#FFFFFF" : "#111827" },
                    ]}
                  >
                    Retry
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: "center",
  },
  banner: {
    width: "100%",
    maxWidth: 460,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: "0px 6px 16px rgba(0, 0, 0, 0.18)",
      } as any,
      default: {},
    }),
  },
  offlineDark: {
    backgroundColor: "rgba(28, 28, 30, 0.96)",
    borderColor: "rgba(255, 69, 58, 0.35)",
  },
  offlineLight: {
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderColor: "rgba(255, 59, 48, 0.25)",
  },
  reconnectedDark: {
    backgroundColor: "rgba(16, 37, 24, 0.96)",
    borderColor: "rgba(48, 209, 88, 0.35)",
  },
  reconnectedLight: {
    backgroundColor: "rgba(240, 253, 244, 0.98)",
    borderColor: "rgba(34, 197, 94, 0.3)",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  iconWrapOffline: {
    backgroundColor: "rgba(255, 69, 58, 0.14)",
  },
  iconWrapSuccess: {
    backgroundColor: "rgba(48, 209, 88, 0.14)",
  },
  textWrap: {
    flex: 1,
    justifyContent: "center",
  },
  titleText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  subText: {
    fontSize: 11,
    marginTop: 1,
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  retryBtnDark: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  retryBtnLight: {
    backgroundColor: "rgba(0, 0, 0, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
  },
  retryBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  retryInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  retryText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
