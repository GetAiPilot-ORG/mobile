import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

interface AnimatedHeroProps {
  tagText: string;
  tagIcon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  variant?:
  | 'forward'
  | 'tracker'
  | 'overview'
  | 'sub_manager'
  | 'reactions'
  | 'chatbot'
  | 'report'
  | 'auto_approve'
  | 'broadcast'
  | 'pricing';
}

export const AnimatedHero: React.FC<AnimatedHeroProps> = ({
  tagText,
  tagIcon,
  title,
  subtitle,
  variant = 'overview',
}) => {
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const wave1Scale = useRef(new Animated.Value(0.7)).current;
  const wave1Opacity = useRef(new Animated.Value(0.6)).current;
  const wave2Scale = useRef(new Animated.Value(0.5)).current;
  const wave2Opacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Glowing orb pulsing loop
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // Floating emblem loop
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -5,
          duration: 2400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 3,
          duration: 2600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    // Expanding radar waves
    const wave1Loop = Animated.loop(
      Animated.parallel([
        Animated.timing(wave1Scale, {
          toValue: 1.8,
          duration: 3000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(wave1Opacity, {
            toValue: 0.5,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(wave1Opacity, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    const wave2Loop = Animated.loop(
      Animated.parallel([
        Animated.timing(wave2Scale, {
          toValue: 1.6,
          duration: 2400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(wave2Opacity, {
            toValue: 0.7,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(wave2Opacity, {
            toValue: 0,
            duration: 1600,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    pulseLoop.start();
    floatLoop.start();
    wave1Loop.start();
    wave2Loop.start();

    return () => {
      pulseLoop.stop();
      floatLoop.stop();
      wave1Loop.stop();
      wave2Loop.stop();
    };
  }, [pulseAnim, floatAnim, wave1Scale, wave1Opacity, wave2Scale, wave2Opacity]);

  const isTracker = variant === 'tracker';
  const isOverview = variant === 'overview';
  const isSubManager = variant === 'sub_manager';
  const isReactions = variant === 'reactions';
  const isChatBot = variant === 'chatbot';
  const isReport = variant === 'report';
  const isAutoApprove = variant === 'auto_approve';
  const isBroadcast = variant === 'broadcast';
  const isPricing = variant === 'pricing';

  const gradientColors: [string, string, string] = isTracker
    ? ['#06182E', '#092B54', '#041224']
    : isSubManager
      ? ['#0B1238', '#1A1856', '#090E2A']
      : isPricing
        ? ['#100B29', '#24104F', '#0B061D']
        : isReactions
          ? ['#190A2E', '#320E58', '#0F0520']
          : isChatBot
            ? ['#051B2E', '#0B3658', '#031221']
            : isReport
              ? ['#1C1605', '#3C300B', '#110D02']
              : isAutoApprove
                ? ['#051E1C', '#0B3B36', '#031412']
                : isBroadcast
                  ? ['#1F0A26', '#3E1049', '#120417']
                  : isOverview
                    ? ['#061B36', '#092F5C', '#031429']
                    : ['#071C35', '#0A2548', '#031122'];

  const orbColor1 = isTracker
    ? '#06B6D4'
    : isSubManager
      ? '#6366F1'
      : isPricing
        ? '#8B5CF6'
        : isReactions
          ? '#EC4899'
          : isChatBot
            ? '#0284C7'
            : isReport
              ? '#EAB308'
              : isAutoApprove
                ? '#10B981'
                : isBroadcast
                  ? '#C084FC'
                  : isOverview
                    ? '#0284C7'
                    : '#0284C7';

  const orbColor2 = isTracker
    ? '#8B5CF6'
    : isSubManager
      ? '#10B981'
      : isPricing
        ? '#EC4899'
        : isReactions
          ? '#8B5CF6'
          : isChatBot
            ? '#38BDF8'
            : isReport
              ? '#F59E0B'
              : isAutoApprove
                ? '#06B6D4'
                : isBroadcast
                  ? '#0284C7'
                  : isOverview
                    ? '#10B981'
                    : '#10B981';

  const emblemIcon: keyof typeof Ionicons.glyphMap = isTracker
    ? 'analytics'
    : isSubManager
      ? 'card'
      : isPricing
        ? 'diamond'
        : isReactions
          ? 'sparkles'
          : isChatBot
            ? 'hardware-chip'
            : isReport
              ? 'document-text'
              : isAutoApprove
                ? 'checkmark-circle'
                : isBroadcast
                  ? 'megaphone'
                  : 'paper-plane';

  const emblemColor = isTracker
    ? '#38BDF8'
    : isSubManager
      ? '#818CF8'
      : isPricing
        ? '#C084FC'
        : isReactions
          ? '#F472B6'
          : isChatBot
            ? '#38BDF8'
            : isReport
              ? '#FBBF24'
              : isAutoApprove
                ? '#34D399'
                : isBroadcast
                  ? '#E879F9'
                  : '#38BDF8';

  return (
    <View style={styles.container}>
      {/* 1. Deep Neon Cyber Gradient */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* 2. Cyber Matrix Grid Lines (SVG) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg height="100%" width="100%">
          <Line x1="0" y1="30" x2="100%" y2="30" stroke="rgba(56, 189, 248, 0.08)" strokeWidth="1" strokeDasharray="4,6" />
          <Line x1="0" y1="70" x2="100%" y2="70" stroke="rgba(56, 189, 248, 0.08)" strokeWidth="1" strokeDasharray="4,6" />
          <Line x1="0" y1="110" x2="100%" y2="110" stroke="rgba(56, 189, 248, 0.06)" strokeWidth="1" strokeDasharray="4,6" />
          <Line x1="25%" y1="0" x2="25%" y2="100%" stroke="rgba(56, 189, 248, 0.05)" strokeWidth="1" strokeDasharray="4,6" />
          <Line x1="50%" y1="0" x2="50%" y2="100%" stroke="rgba(56, 189, 248, 0.05)" strokeWidth="1" strokeDasharray="4,6" />
          <Line x1="75%" y1="0" x2="75%" y2="100%" stroke="rgba(56, 189, 248, 0.05)" strokeWidth="1" strokeDasharray="4,6" />
          <Circle cx="85%" cy="50%" r="55" stroke="rgba(56, 189, 248, 0.12)" strokeWidth="1" fill="none" strokeDasharray="6,4" />
        </Svg>
      </View>

      {/* 3. Animated Glowing Ambient Orbs */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glowOrb,
          {
            top: -20,
            right: 40,
            backgroundColor: orbColor1,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glowOrb,
          {
            bottom: -30,
            left: '30%',
            backgroundColor: orbColor2,
            opacity: 0.25,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      {/* 4. Animated Radar Expanding Waves behind Emblem */}
      <View style={styles.radarContainer} pointerEvents="none">
        <Animated.View
          style={[
            styles.radarWave,
            {
              borderColor: orbColor1,
              transform: [{ scale: wave1Scale }],
              opacity: wave1Opacity,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.radarWave,
            {
              borderColor: isTracker ? '#38BDF8' : isSubManager ? '#818CF8' : isReactions ? '#F472B6' : '#34D399',
              transform: [{ scale: wave2Scale }],
              opacity: wave2Opacity,
            },
          ]}
        />
      </View>

      {/* 5. Animated Futuristic Holographic Emblem */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.floatingEmblemWrap,
          { transform: [{ translateY: floatAnim }] },
        ]}
      >
        <LinearGradient
          colors={
            isTracker
              ? ['rgba(6, 182, 212, 0.25)', 'rgba(2, 132, 199, 0.08)']
              : isSubManager
                ? ['rgba(99, 102, 241, 0.32)', 'rgba(16, 185, 129, 0.12)']
                : isPricing
                  ? ['rgba(139, 92, 246, 0.35)', 'rgba(236, 72, 153, 0.15)']
                  : isReactions
                    ? ['rgba(236, 72, 153, 0.32)', 'rgba(139, 92, 246, 0.12)']
                    : isChatBot
                      ? ['rgba(2, 132, 199, 0.32)', 'rgba(56, 189, 248, 0.12)']
                      : isReport
                        ? ['rgba(234, 179, 8, 0.32)', 'rgba(245, 158, 11, 0.12)']
                        : isAutoApprove
                          ? ['rgba(16, 185, 129, 0.32)', 'rgba(6, 182, 212, 0.12)']
                          : isBroadcast
                            ? ['rgba(192, 132, 252, 0.32)', 'rgba(2, 132, 199, 0.12)']
                            : isOverview
                              ? ['rgba(2, 132, 199, 0.32)', 'rgba(16, 185, 129, 0.12)']
                              : ['rgba(2, 132, 199, 0.28)', 'rgba(16, 185, 129, 0.1)']
          }
          style={styles.emblemHexagon}
        >
          <Ionicons
            name={emblemIcon}
            size={32}
            color={emblemColor}
            style={styles.emblemIconGlow}
          />
        </LinearGradient>
      </Animated.View>

      {/* 6. Foreground Content (Badges & Headers) */}
      <View style={styles.contentWrap}>
        {/* Top Badges Row */}
        <View style={styles.topRow}>
          <View style={styles.tagBadge}>
            <Ionicons name={tagIcon} size={11} color="#FFFFFF" />
            <Text style={styles.tagText}>{tagText}</Text>
          </View>
        </View>

        {/* Title & Subtitle */}
        <View style={styles.textWrap}>
          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.subtitleText}>{subtitle}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 122,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'space-between',
  },
  glowOrb: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.35,
  },
  radarContainer: {
    position: 'absolute',
    right: 32,
    top: 24,
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarWave: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
  },
  floatingEmblemWrap: {
    position: 'absolute',
    right: 28,
    top: 22,
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemHexagon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  emblemIconGlow: {
    shadowColor: '#38BDF8',
    shadowOpacity: 0.8,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  contentWrap: {
    ...StyleSheet.absoluteFill,
    padding: 12,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(2, 132, 199, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },
  textWrap: {
    maxWidth: '75%',
  },
  titleText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 1 },
  },
  subtitleText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#CBD5E1',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
  },
});
