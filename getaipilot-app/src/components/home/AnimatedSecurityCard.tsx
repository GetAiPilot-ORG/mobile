import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowRight01Icon, ShieldCheckIcon } from '@hugeicons/core-free-icons';

interface AnimatedSecurityCardProps {
  isDark: boolean;
  activeDeviceCount: number;
  isLoading: boolean;
  onPress: () => void;
}

export function AnimatedSecurityCard({
  isDark,
  activeDeviceCount,
  isLoading,
  onPress,
}: AnimatedSecurityCardProps) {
  // Live pulse animation for the active shield green indicator
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1.4,
            duration: 1200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.1,
            duration: 1200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.7,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(800),
      ])
    );

    pulseAnim.start();

    return () => pulseAnim.stop();
  }, []);

  const deviceText = isLoading
    ? 'Checking active devices…'
    : `${activeDeviceCount} active device${activeDeviceCount === 1 ? '' : 's'} • 256-bit encrypted`;

  return (
    <Pressable
      cssInterop={false}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Account Security and Devices"
      style={({ pressed }) => [
        styles.card,
        {
          borderColor: isDark
            ? 'rgba(34, 197, 94, 0.32)'
            : 'rgba(34, 197, 94, 0.24)',
          transform: [{ scale: pressed ? 0.988 : 1 }],
          shadowOpacity: isDark ? 0.35 : 0.08,
        },
      ]}
    >
      {/* 1. High-Trust Fresh Mint / Cyber Emerald Gradient */}
      <LinearGradient
        colors={
          isDark
            ? ['#0F2A1E', '#081E15', '#04130D']
            : ['#F2FBF6', '#E7F7EE', '#DCF4E5']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* 2. Top Specular Glass Reflection */}
      <LinearGradient
        colors={
          isDark
            ? ['rgba(255, 255, 255, 0.12)', 'transparent']
            : ['rgba(255, 255, 255, 0.75)', 'rgba(255, 255, 255, 0.1)', 'transparent']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0.6 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* 3. Subtle Tilted Shield Watermark in Background */}
      <View style={styles.watermark} pointerEvents="none">
        <HugeiconsIcon
          icon={ShieldCheckIcon}
          size={76}
          color={isDark ? '#22C55E' : '#16A34A'}
          strokeWidth={1.5}
        />
      </View>

      {/* 4. Card Content Row */}
      <View style={styles.contentRow}>
        {/* Left: Elevated Shield Badge with Live Status Glow */}
        <View style={styles.badgeWrapper}>
          <View
            style={[
              styles.shieldBadge,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.12)'
                  : '#FFFFFF',
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.16)'
                  : 'rgba(255, 255, 255, 0.95)',
              },
            ]}
          >
            <HugeiconsIcon
              icon={ShieldCheckIcon}
              size={20}
              color={isDark ? '#4ADE80' : '#16A34A'}
              strokeWidth={2.2}
            />
          </View>

          {/* Animated Pulsing Ring */}
          <Animated.View
            style={[
              styles.pulseRing,
              {
                opacity: pulseOpacity,
                transform: [{ scale: pulseScale }],
              },
            ]}
            pointerEvents="none"
          />

          {/* Solid Green Status Dot */}
          <View style={styles.statusDot} />
        </View>

        {/* Center: Title + Protected Pill + Telemetry */}
        <View style={styles.textColumn}>
          <View style={styles.titleRow}>
            <Text
              numberOfLines={1}
              style={[
                styles.title,
                { color: isDark ? '#FFFFFF' : '#0F291E' },
              ]}
            >
              Account Security & Devices
            </Text>
            <View
              style={[
                styles.pillBadge,
                {
                  backgroundColor: isDark
                    ? 'rgba(34, 197, 94, 0.18)'
                    : 'rgba(34, 197, 94, 0.14)',
                  borderColor: isDark
                    ? 'rgba(34, 197, 94, 0.35)'
                    : 'rgba(34, 197, 94, 0.3)',
                },
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: isDark ? '#4ADE80' : '#15803D' },
                ]}
              >
                PROTECTED
              </Text>
            </View>
          </View>

          <Text
            numberOfLines={1}
            style={[
              styles.subtitle,
              { color: isDark ? '#A7F3D0' : '#3D6A53' },
            ]}
          >
            {deviceText}
          </Text>
        </View>

        {/* Right: Circular Frosted Action Button */}
        <View
          style={[
            styles.actionCircle,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(255, 255, 255, 0.85)',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.15)'
                : 'rgba(255, 255, 255, 0.95)',
            },
          ]}
        >
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={13}
            color={isDark ? '#4ADE80' : '#16A34A'}
            strokeWidth={2.4}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1.2,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  watermark: {
    position: 'absolute',
    right: -10,
    bottom: -16,
    opacity: 0.08,
    transform: [{ rotate: '-12deg' }],
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  badgeWrapper: {
    position: 'relative',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldBadge: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  pulseRing: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#22C55E',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'nowrap',
  },
  title: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  pillBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.8,
  },
  pillText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  actionCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
});
