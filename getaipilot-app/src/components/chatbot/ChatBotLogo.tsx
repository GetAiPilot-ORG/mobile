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
import { Bot, Sparkles } from 'lucide-react-native';

interface ChatBotLogoProps {
  size?: number;
  withSparkleBadge?: boolean;
  isAnimated?: boolean;
}

export const ChatBotLogo: React.FC<ChatBotLogoProps> = ({
  size = 32,
  isAnimated = true,
}) => {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    if (!isAnimated) return;

    scale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
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
  }, [isAnimated]);

  const animatedOrbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: scale.value * 1.25 }],
  }));

  const iconSize = Math.round(size * 0.54);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer ambient glow */}
      {isAnimated && (
        <Animated.View
          style={[
            styles.glow,
            {
              // width: size * 1.35,
              // height: size * 1.35,
              // borderRadius: 50,
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
      )}

      {/* Main Bot Badge Container */}
      <Animated.View
        style={[
          styles.badge,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          isAnimated ? animatedOrbStyle : undefined,
        ]}
      >
        <LinearGradient
          colors={['#0EA5E9', '#6366F1', '#8B5CF6']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* AI Bot Icon */}
        <Bot size={iconSize} color="#FFFFFF" strokeWidth={2.2} />

        {/* Specular light highlight */}
        <View
          style={[
            styles.specular,
            {
              width: size * 0.24,
              height: size * 0.24,
              borderRadius: (size * 0.24) / 2,
              top: size * 0.08,
              left: size * 0.12,
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
  badge: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  specular: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  sparkleBadge: {
    position: 'absolute',
    backgroundColor: '#1E1B4B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    elevation: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
  },
});

export default ChatBotLogo;
