import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export default function NotFoundScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
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
      ])
    );

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
      ])
    );

    floating.start();
    pulsing.start();

    return () => {
      floating.stop();
      pulsing.stop();
    };
  }, [fadeAnim, floatAnim, pulseAnim, scaleAnim]);

  const handleHome = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.replace('/(tabs)');
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View
      className="flex-1 items-center justify-center px-6 bg-[#0B0D10]"
      style={{
        paddingTop: Math.max(insets.top + 20, 44),
        paddingBottom: Math.max(insets.bottom + 24, 32),
      }}
    >
      {/* Ambient glow */}
      <Animated.View
        pointerEvents="none"
        className="absolute w-80 h-80 rounded-full top-1/4 bg-blue-500/10"
        style={{
          transform: [{ scale: pulseAnim }],
        }}
      />

      <Animated.View
        className="w-full max-w-[400px] items-center"
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        {/* Animated Badge */}
        <Animated.View
          className="mb-7"
          style={{ transform: [{ translateY: floatAnim }] }}
        >
          <LinearGradient
            colors={['rgba(30, 41, 59, 0.8)', 'rgba(15, 23, 42, 0.95)']}
            className="w-36 h-36 rounded-[36px] border border-white/10 items-center justify-center relative shadow-xl shadow-black/40"
          >
            <View className="w-18 h-18 rounded-3xl items-center justify-center bg-blue-500/15 p-3">
              <Ionicons
                name="compass-outline"
                size={44}
                color="#0A84FF"
              />
            </View>

            {/* Glowing 404 Tag */}
            <View className="absolute -bottom-2.5 px-3 py-1 rounded-xl border border-blue-500/40 bg-blue-500/20">
              <Text className="text-xs font-black tracking-wider text-blue-400">
                404
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Text Header */}
        <Text className="text-[26px] font-extrabold tracking-tight mb-2.5 text-center text-white">
          Page Not Found
        </Text>

        <Text className="text-[14.5px] leading-5 text-center max-w-[320px] mb-8 text-slate-400">
          The screen or resource you're looking for doesn't exist, was moved, or
          is temporarily unavailable.
        </Text>

        {/* Action Buttons */}
        <View className="w-full gap-3 items-center">
          <Pressable
            onPress={handleHome}
            className="w-full h-[52px] rounded-2xl overflow-hidden shadow-md shadow-blue-500/25"
            style={({ pressed }) => pressed ? { opacity: 0.85, transform: [{ scale: 0.985 }] } : undefined}
          >
            <LinearGradient
              colors={['#0A84FF', '#0066CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="w-full h-full flex-row items-center justify-center"
            >
              <Ionicons
                name="home"
                size={18}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text className="text-white text-[15px] font-bold tracking-tight">Back to Home</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={handleBack}
            className="w-full h-12 rounded-2xl border border-[#262930] bg-[#181A1F] flex-row items-center justify-center"
            style={({ pressed }) => pressed ? { opacity: 0.85, transform: [{ scale: 0.985 }] } : undefined}
          >
            <Ionicons
              name="arrow-back"
              size={18}
              color="#E2E8F0"
              style={{ marginRight: 6 }}
            />
            <Text className="text-[#E2E8F0] text-[14.5px] font-semibold tracking-tight">
              Go Back
            </Text>
          </Pressable>
        </View>

        {/* Sub-footer Note */}
        <Text className="text-[11.5px] mt-7 tracking-tight text-slate-500">
          GetAiPilot Workspace Navigation
        </Text>
      </Animated.View>
    </View>
  );
}

