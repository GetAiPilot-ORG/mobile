import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/theme';

interface Props { minDurationMs?: number; onAnimationComplete?: () => void; }

const brandLogo = require('../../../assets/images/icon.png');

export function AnimatedSplashScreen({ minDurationMs = 180, onAnimationComplete }: Props) {
  const { colors, isDark } = useTheme();
  const [opacity] = useState(() => new Animated.Value(1));
  const complete = useRef(onAnimationComplete);
  useEffect(() => { complete.current = onAnimationComplete; }, [onAnimationComplete]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const start = (reduced: boolean) => {
      if (cancelled) return;
      if (!reduced) {
        opacity.setValue(0.75);
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start();
      }
      timer = setTimeout(() => {
        if (!cancelled) complete.current?.();
      }, reduced ? 0 : Math.min(minDurationMs, 250));
    };
    AccessibilityInfo.isReduceMotionEnabled().then(start).catch(() => start(true));
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      opacity.stopAnimation();
    };
  }, [minDurationMs, opacity]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDark ? '#14131B' : '#F5F3FB',
        gap: 16,
      }}
    >
      <Animated.View style={{ opacity, alignItems: 'center', justifyContent: 'center' }}>
        <Image
          source={brandLogo}
          style={{ width: 88, height: 88, backgroundColor: 'transparent' }}
          contentFit="contain"
          transition={200}
        />
      </Animated.View>
      <Text
        style={{
          fontSize: 26,
          fontWeight: '700',
          color: isDark ? '#FFFFFF' : '#000000',
          letterSpacing: -0.5,
        }}
      >
        GetAiPilot
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: isDark ? '#9CA3AF' : '#6B7280',
          fontWeight: '500',
        }}
      >
        Getting things ready…
      </Text>
    </View>
  );
}

