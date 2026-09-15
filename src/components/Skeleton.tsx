import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  DimensionValue,
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  useColorScheme,
} from "react-native";

export interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  circle?: boolean;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

export default function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = 8,
  circle = false,
  style,
  className,
}: SkeletonProps) {
  const isDark = useColorScheme() === "dark";
  const [componentWidth, setComponentWidth] = useState<number>(300);

  const shimmer = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => animation.stop();
  }, [shimmer]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - componentWidth) > 10) {
      setComponentWidth(w);
    }
  };

  const sweepDistance = Math.max(componentWidth, 250);

  const translateX = shimmer.interpolate({
    inputRange: [-1, 1],
    outputRange: [-sweepDistance, sweepDistance * 1.2],
  });

  const finalBorderRadius = circle
    ? typeof height === "number"
      ? height / 2
      : 9999
    : borderRadius;

  return (
    <Animated.View
      onLayout={handleLayout}
      className={`overflow-hidden ${className || ''}`}
      style={[
        {
          width,
          height,
          borderRadius: finalBorderRadius,
          backgroundColor: isDark ? "#1C1C1E" : "#E5E7EB",
        },
        style,
      ]}
    >
      <Animated.View
        className="absolute -top-1/2 left-[10%] h-[200%]"
        style={[
          {
            width: Math.max(sweepDistance * 0.5, 120),
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            "transparent",
            isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.65)",
            "transparent",
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </Animated.View>
  );
}

export { Skeleton };

export function SkeletonText({
  width = "100%",
  height = 14,
  borderRadius = 4,
  style,
  className,
}: SkeletonProps) {
  return (
    <Skeleton
      width={width}
      height={height}
      borderRadius={borderRadius}
      style={style}
      className={className}
    />
  );
}

export function SkeletonCircle({
  size = 40,
  style,
  className,
}: {
  size?: number;
  style?: StyleProp<ViewStyle>;
  className?: string;
}) {
  return (
    <Skeleton
      width={size}
      height={size}
      circle
      style={style}
      className={className}
    />
  );
}

export function SkeletonCard({
  children,
  style,
  className,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
}) {
  const isDark = useColorScheme() === "dark";
  return (
    <View
      className={`rounded-2xl p-4 border mb-3 ${
        isDark ? "bg-[#161B22] border-[#262C36]" : "bg-white border-gray-200"
      } ${className || ''}`}
      style={style}
    >
      {children}
    </View>
  );
}

export function SkeletonRow({
  children,
  style,
  className,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
}) {
  return (
    <View className={`flex-row items-center ${className || ''}`} style={style}>
      {children}
    </View>
  );
}
