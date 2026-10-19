import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface LiveOrbProps {
  size?: number;
  variant?: 'black' | 'indigo' | 'colorful';
  interactive?: boolean;
}

export const LiveOrb: React.FC<LiveOrbProps> = ({
  size = 32,
  variant = 'black',
}) => {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);
  const rotate = useSharedValue(0);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.96, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.25, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    rotate.value = withRepeat(
      withTiming(360, { duration: 12000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedOrbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: scale.value * 1.3 }],
  }));

  const animatedRotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  const getGradientColors = () => {
    switch (variant) {
      case 'black':
        return ['#1E1B4B', '#312E81', '#0F172A'];
      case 'colorful':
        return ['#06B6D4', '#6366F1', '#EC4899'];
      case 'indigo':
      default:
        return ['#38BDF8', '#6366F1', '#8B5CF6'];
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer ambient glow */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: size * 1.4,
            height: size * 1.4,
            borderRadius: (size * 1.4) / 2,
          },
          animatedGlowStyle,
        ]}
      >
        <LinearGradient
          colors={['#818CF8', '#C084FC', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Main pulsing orb sphere */}
      <Animated.View
        style={[
          styles.orb,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          animatedOrbStyle,
        ]}
      >
        <LinearGradient
          colors={getGradientColors() as any}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 0.9, y: 0.9 }}
        />

        {/* Dynamic Inner Swirl */}
        <Animated.View
          style={[
            styles.swirl,
            {
              width: size * 0.7,
              height: size * 0.7,
              borderRadius: (size * 0.7) / 2,
            },
            animatedRotateStyle,
          ]}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0.05)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        {/* Specular highlight pin */}
        <View
          style={[
            styles.specular,
            {
              width: size * 0.28,
              height: size * 0.28,
              borderRadius: (size * 0.28) / 2,
              top: size * 0.15,
              left: size * 0.18,
            },
          ]}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
  orb: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  swirl: {
    position: 'absolute',
  },
  specular: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
});
