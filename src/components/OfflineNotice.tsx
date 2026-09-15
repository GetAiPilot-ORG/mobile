import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  ActivityIndicator,
  useColorScheme,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

export function OfflineNotice() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

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
      className="absolute left-4 right-4 z-50 items-center pointer-events-box-none"
      style={{ top: Math.max(insets.top + 6, 12) }}
      pointerEvents="box-none"
    >
      <Animated.View
        className={`w-full max-w-[460px] rounded-2xl py-2.5 px-3.5 border shadow-lg ${
          isReconnected
            ? isDark
              ? "bg-[#102518]/95 border-emerald-500/35"
              : "bg-emerald-50/95 border-emerald-500/30"
            : isDark
            ? "bg-[#181A1F]/95 border-red-500/35"
            : "bg-white/95 border-red-500/25"
        }`}
        style={{ opacity, transform: [{ translateY }] }}
      >
        {isReconnected ? (
          // Back Online UI
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full justify-center items-center mr-2.5 bg-emerald-500/15">
              <Ionicons name="checkmark-circle" size={18} color="#30D158" />
            </View>
            <View className="flex-1 justify-center">
              <Text className={`text-xs font-semibold tracking-tight ${isDark ? "text-gray-200" : "text-gray-900"}`}>
                Back Online
              </Text>
              <Text className={`text-[11px] mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Internet connection restored
              </Text>
            </View>
          </View>
        ) : (
          // Device Offline UI
          <View className="flex-row items-center">
            <Animated.View
              className="w-8 h-8 rounded-full justify-center items-center mr-2.5 bg-red-500/15"
              style={{ transform: [{ scale: pulseAnim }] }}
            >
              <Ionicons name="cloud-offline-outline" size={18} color="#FF453A" />
            </Animated.View>
            <View className="flex-1 justify-center">
              <Text className={`text-xs font-semibold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                You're Offline
              </Text>
              <Text className={`text-[11px] mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Check Wi-Fi or mobile data
              </Text>
            </View>

            <Pressable
              onPress={handleRetry}
              disabled={isChecking}
              className={`px-3 py-1.5 rounded-xl justify-center items-center ml-2 border ${
                isDark ? "bg-white/10 border-white/15" : "bg-black/5 border-black/10"
              }`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {isChecking ? (
                <ActivityIndicator size="small" color={isDark ? "#FFFFFF" : "#111827"} />
              ) : (
                <View className="flex-row items-center">
                  <Ionicons
                    name="refresh-outline"
                    size={14}
                    color={isDark ? "#FFFFFF" : "#111827"}
                    className="mr-1"
                  />
                  <Text className={`text-xs font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
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
