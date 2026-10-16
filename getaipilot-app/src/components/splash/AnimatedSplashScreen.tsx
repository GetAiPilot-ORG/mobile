import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Text, View } from 'react-native';
import { useTheme } from '@/theme';

interface Props { minDurationMs?: number; onAnimationComplete?: () => void; }

export function AnimatedSplashScreen({ minDurationMs = 180, onAnimationComplete }: Props) {
  const { colors } = useTheme();
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
        Animated.timing(opacity, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
      }
      timer = setTimeout(() => { if (!cancelled) complete.current?.(); }, reduced ? 0 : Math.min(minDurationMs, 250));
    };
    AccessibilityInfo.isReduceMotionEnabled().then(start).catch(() => start(true));
    return () => { cancelled = true; if (timer) clearTimeout(timer); opacity.stopAnimation(); };
  }, [minDurationMs, opacity]);
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, gap: 22 }}>
    <Animated.View style={{ opacity }}>
      <Image source={require('../../../assets/images/logobag.png')} style={{ width: 88, height: 88, borderRadius: 44 }} />
    </Animated.View>
    <Text style={{ fontSize: 26, fontWeight: '500', color: colors.text }}>GetAiPilot</Text>
    <Text style={{ fontSize: 13, color: colors.textSecondary }}>Getting things ready…</Text>
  </View>;
}
