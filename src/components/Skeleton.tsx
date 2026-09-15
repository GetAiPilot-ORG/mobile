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
}

export default function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = 8,
  circle = false,
  style,
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
      style={[
        styles.skeleton,
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
        style={[
          styles.shimmer,
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
}: SkeletonProps) {
  return (
    <Skeleton
      width={width}
      height={height}
      borderRadius={borderRadius}
      style={style}
    />
  );
}

export function SkeletonCircle({
  size = 40,
  style,
}: {
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Skeleton
      width={size}
      height={size}
      circle
      style={style}
    />
  );
}

export function SkeletonCard({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const isDark = useColorScheme() === "dark";
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "#161B22" : "#FFFFFF",
          borderColor: isDark ? "#262C36" : "#E5E7EB",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function SkeletonRow({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.row, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: "hidden",
  },
  shimmer: {
    position: "absolute",
    height: "200%",
    top: "-50%",
    left: "10%",
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
