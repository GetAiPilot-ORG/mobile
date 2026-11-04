import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { HOME_RADIUS } from '@/theme/homeTokens';

export interface GlassCardProps {
  children: React.ReactNode;
  gradientColors: readonly [string, string, ...string[]];
  borderColor?: string;
  shadowColor?: string;
  shadowOpacity?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onLongPress?: () => void;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'none';
  specular?: boolean;
  isDark?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  gradientColors,
  borderColor = 'rgba(255, 255, 255, 0.15)',
  shadowColor = '#000000',
  shadowOpacity = 0.1,
  radius = HOME_RADIUS.large,
  style,
  contentStyle,
  onPress,
  onLongPress,
  accessibilityLabel,
  accessibilityRole = onPress ? 'button' : 'none',
  specular = true,
  isDark = false,
}) => {
  const reducedMotion = useReducedMotion();

  const cardContent = (
    <>
      {/* 1. Multi-stop Gradient Surface */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* 2. Top Specular Glass Reflection */}
      {specular && (
        <LinearGradient
          colors={
            isDark
              ? ['rgba(255, 255, 255, 0.12)', 'transparent']
              : ['rgba(255, 255, 255, 0.75)', 'transparent']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 0.55 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}

      {/* Inner Children Content */}
      <View style={[styles.innerContent, contentStyle]}>{children}</View>
    </>
  );

  if (onPress || onLongPress) {
    return (
      <Pressable
        cssInterop={false}
        onPress={onPress}
        onLongPress={onLongPress}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [
          styles.baseCard,
          {
            borderRadius: radius,
            borderColor,
            shadowColor,
            shadowOpacity,
            transform: [{ scale: pressed && !reducedMotion ? 0.97 : 1 }],
            opacity: pressed ? 0.92 : 1,
          },
          style,
        ]}
      >
        {cardContent}
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.baseCard,
        {
          borderRadius: radius,
          borderColor,
          shadowColor,
          shadowOpacity,
        },
        style,
      ]}
    >
      {cardContent}
    </View>
  );
};

const styles = StyleSheet.create({
  baseCard: {
    borderWidth: 1.2,
    position: 'relative',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  innerContent: {
    position: 'relative',
    zIndex: 2,
  },
});

