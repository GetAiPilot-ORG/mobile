import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  Text,
  useColorScheme,
  View,
} from "react-native";

interface NetworkStatusScreenProps {
  onRetry?: () => void;
  isChecking?: boolean;
}

export function NetworkStatusScreen({ onRetry, isChecking = false }: NetworkStatusScreenProps) {
  const isDark = useColorScheme() === "dark";

  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        damping: 12,
        stiffness: 120,
        useNativeDriver: true,
      }),

      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );

    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, [opacity, pulse, scale]);

  return (
    <View
      className={`flex-1 justify-center items-center px-7 ${
        isDark ? "bg-black" : "bg-[#F2F2F7]"
      }`}
    >
      <Animated.View
        className="w-full max-w-[420px] items-center"
        style={{ opacity, transform: [{ scale }] }}
      >
        <Animated.View
          className="w-[130px] h-[130px] rounded-full justify-center items-center mb-7.5 bg-red-500/10"
          style={{ transform: [{ scale: pulse }] }}
        >
          <View className="w-24 h-24 rounded-full bg-red-500/15 justify-center items-center">
            <Ionicons name="cloud-offline-outline" size={52} color="#FF453A" />
          </View>
        </Animated.View>

        <Text
          className={`text-3xl font-extrabold tracking-tight mb-2.5 ${
            isDark ? "text-white" : "text-black"
          }`}
        >
          You're Offline
        </Text>

        <Text
          className={`text-sm leading-5.5 text-center max-w-[330px] mb-7 ${
            isDark ? "text-slate-400" : "text-slate-500"
          }`}
        >
          No internet connection detected. Check your Wi-Fi or mobile data and try again.
        </Text>

        <View
          className={`w-full min-h-[70px] rounded-2xl border px-3.5 flex-row items-center mb-4.5 ${
            isDark ? "bg-[#181A1F] border-[#262930]" : "bg-white border-gray-200"
          }`}
        >
          <View className="w-10.5 h-10.5 rounded-xl bg-red-500/12 justify-center items-center mr-3">
            <Ionicons name="wifi-outline" size={20} color="#FF453A" />
          </View>

          <View className="flex-1">
            <Text
              className={`text-sm font-bold mb-0.5 ${
                isDark ? "text-white" : "text-black"
              }`}
            >
              No Internet
            </Text>

            <Text
              className={`text-xs ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Waiting for connection...
            </Text>
          </View>

          <View className="w-2.5 h-2.5 rounded-full bg-[#FF453A]" />
        </View>

        <Pressable
          className="w-full h-12 rounded-2xl bg-[#0284C7] flex-row justify-center items-center gap-2"
          style={({ pressed }) => [
            pressed && { opacity: 0.75, transform: [{ scale: 0.98 }] },
            isChecking && { opacity: 0.75 },
          ]}
          onPress={onRetry}
          disabled={isChecking}
        >
          {isChecking ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
          )}

          <Text className="text-white text-sm font-bold">
            {isChecking ? "Checking Connection..." : "Try Again"}
          </Text>
        </Pressable>

        <Text
          className={`text-xs mt-4.5 ${
            isDark ? "text-slate-500" : "text-slate-400"
          }`}
        >
          GetAiPilot will reconnect automatically
        </Text>
      </Animated.View>
    </View>
  );
}
