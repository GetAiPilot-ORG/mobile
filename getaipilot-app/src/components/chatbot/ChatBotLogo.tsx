import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Bot } from 'lucide-react-native';

interface ChatBotLogoProps {
  size?: number;
  variant?: 'black' | 'gradient';
  withSparkleBadge?: boolean;
  isAnimated?: boolean;
  interactive?: boolean;
  gazeX?: SharedValue<number>;
  gazeY?: SharedValue<number>;
}

export const ChatBotLogo: React.FC<ChatBotLogoProps> = ({
  size = 28,
  variant = 'black',
  isAnimated = true,
  interactive = true,
  gazeX,
  gazeY,
}) => {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.35);
  const eyeScaleY = useSharedValue(1);
  const localLookX = useSharedValue(0);
  const localLookY = useSharedValue(0);

  const isBlackVariant = variant === 'black';
  const maxShiftX = Math.max(1.8, size * 0.1);
  const maxShiftY = Math.max(1.2, size * 0.07);

  useEffect(() => {
    if (!isAnimated) return;

    // Subtle ambient breathing pulse
    scale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.97, { duration: 2200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Ambient glow pulse
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.65, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 2400, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Natural eye blink animation (every ~3.2 seconds)
    eyeScaleY.value = withRepeat(
      withSequence(
        withDelay(
          3200,
          withSequence(
            withTiming(0.08, { duration: 75, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 95, easing: Easing.inOut(Easing.ease) })
          )
        )
      ),
      -1,
      false
    );

    // Autonomous glancing behavior (darting gaze around, similar to live-orb WebGL logic)
    if (!interactive) return;

    let isMounted = true;
    let glanceTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleNextGlance = () => {
      const delay = 1600 + Math.random() * 2000;
      glanceTimer = setTimeout(() => {
        if (!isMounted) return;

        // 30% chance to look directly back at center (rest gaze)
        const returnToCenter = Math.random() < 0.3;
        const targetX = returnToCenter ? 0 : (Math.random() * 2 - 1) * maxShiftX;
        const targetY = returnToCenter ? 0 : (Math.random() * 2 - 1) * maxShiftY;

        localLookX.value = withSpring(targetX, { damping: 18, stiffness: 240 });
        localLookY.value = withSpring(targetY, { damping: 18, stiffness: 240 });

        scheduleNextGlance();
      }, delay);
    };

    scheduleNextGlance();

    return () => {
      isMounted = false;
      if (glanceTimer) clearTimeout(glanceTimer);
    };
  }, [isAnimated, interactive, maxShiftX, maxShiftY]);

  const animatedOrbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: scale.value * 1.2 }],
  }));

  const animatedEyeStyle = useAnimatedStyle(() => {
    // If external interactive gaze is active (e.g. during user drag), steer with it
    const extX = gazeX ? gazeX.value : 0;
    const extY = gazeY ? gazeY.value : 0;
    const combinedX = Math.max(-maxShiftX, Math.min(maxShiftX, localLookX.value + extX));
    const combinedY = Math.max(-maxShiftY, Math.min(maxShiftY, localLookY.value + extY));

    return {
      transform: [
        { translateX: combinedX },
        { translateY: combinedY },
        { scaleY: eyeScaleY.value },
      ],
    };
  });

  const eyeWidth = Math.max(3, Math.round(size * 0.13));
  const eyeHeight = Math.max(6, Math.round(size * 0.28));
  const eyeRadius = Math.round(eyeWidth / 2);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer ambient aura glow */}
      {isAnimated && (
        <Animated.View
          style={[
            styles.glow,
            {
              width: size * 1.35,
              height: size * 1.35,
              borderRadius: (size * 1.35) / 2,
            },
            animatedGlowStyle,
          ]}
        >
          <LinearGradient
            colors={
              isBlackVariant
                ? ['rgba(139, 92, 246, 0.35)', 'rgba(225, 221, 234, 0.2)', 'transparent']
                : ['rgba(129, 140, 248, 0.45)', 'rgba(192, 132, 252, 0.35)', 'transparent']
            }
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
      )}

      {/* Main Orb Badge */}
      <Animated.View
        style={[
          styles.badge,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: isBlackVariant
              ? 'rgba(255, 255, 255, 0.16)'
              : 'rgba(255, 255, 255, 0.35)',
            shadowColor: isBlackVariant ? '#000000' : '#6366F1',
          },
          isAnimated ? animatedOrbStyle : undefined,
        ]}
      >
        {isBlackVariant ? (
          // Website Signature LiveOrb: Black sphere with white capsule eyes
          <>
            <LinearGradient
              colors={['#1f1f23', '#0e0e11', '#050507']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.3, y: 0 }}
              end={{ x: 0.7, y: 1 }}
            />

            {/* Specular soft light highlight */}
            <View
              style={[
                styles.specular,
                {
                  width: size * 0.24,
                  height: size * 0.24,
                  borderRadius: (size * 0.24) / 2,
                  top: size * 0.08,
                  left: size * 0.12,
                  backgroundColor: 'rgba(255, 255, 255, 0.22)',
                },
              ]}
            />

            {/* Two White Capsule Eyes that Glance and Blink */}
            <View
              style={[
                styles.faceContainer,
                {
                  width: size,
                  height: size,
                },
              ]}
              pointerEvents="none"
            >
              {/* Left Eye */}
              <Animated.View
                style={[
                  styles.eyeCapsule,
                  {
                    width: eyeWidth,
                    height: eyeHeight,
                    borderRadius: eyeRadius,
                    left: Math.round(size * 0.31),
                    top: Math.round(size * 0.34),
                  },
                  animatedEyeStyle,
                ]}
              />

              {/* Right Eye */}
              <Animated.View
                style={[
                  styles.eyeCapsule,
                  {
                    width: eyeWidth,
                    height: eyeHeight,
                    borderRadius: eyeRadius,
                    left: Math.round(size * 0.56),
                    top: Math.round(size * 0.34),
                  },
                  animatedEyeStyle,
                ]}
              />
            </View>
          </>
        ) : (
          // Gradient Bot Icon Variant
          <>
            <LinearGradient
              colors={['#0EA5E9', '#6366F1', '#8B5CF6']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Bot size={Math.round(size * 0.52)} color="#FFFFFF" strokeWidth={2.2} />
            <View
              style={[
                styles.specular,
                {
                  width: size * 0.24,
                  height: size * 0.24,
                  borderRadius: (size * 0.24) / 2,
                  top: size * 0.08,
                  left: size * 0.12,
                  backgroundColor: 'rgba(255, 255, 255, 0.45)',
                },
              ]}
            />
          </>
        )}
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
  badge: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    borderWidth: 1,
    position: 'relative',
  },
  faceContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  eyeCapsule: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 2,
  },
  specular: {
    position: 'absolute',
  },
});

export default ChatBotLogo;
