import { useReducedMotion } from '@/hooks/useReducedMotion';
import React, { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

interface TabMotionProps {
  active: boolean;
  children: React.ReactNode;
}

/** Gives every shared navigation tab the same quiet, interruptible feedback. */
export function TabMotion({ active, children }: TabMotionProps) {
  const reducedMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(active ? 1 : 0));

  useEffect(() => {
    progress.stopAnimation();

    if (reducedMotion) {
      progress.setValue(active ? 1 : 0);
      return;
    }

    Animated.timing(progress, {
      toValue: active ? 1 : 0,
      duration: active ? 220 : 140,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    return () => progress.stopAnimation();
  }, [active, progress, reducedMotion]);

  return (
    <Animated.View
      style={[
        styles.container,
        reducedMotion
          ? undefined
          : {
              opacity: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.72, 1],
              }),
            },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
