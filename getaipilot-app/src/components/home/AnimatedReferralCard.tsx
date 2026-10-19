import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowRight01Icon, GiftIcon } from '@hugeicons/core-free-icons';

interface AnimatedReferralCardProps {
  isDark: boolean;
  onPress: () => void;
}

export function AnimatedReferralCard({
  isDark,
  onPress,
}: AnimatedReferralCardProps) {
  // Lifelike character floating & gentle breathing animation
  const characterBreatheY = useRef(new Animated.Value(0)).current;
  const characterSway = useRef(new Animated.Value(0)).current;

  // Paper airplane flight floating motion
  const planeFloatY = useRef(new Animated.Value(0)).current;
  const planeFloatX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Smooth lifelike breathing & gentle sway for the characters
    const characterAnim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(characterBreatheY, {
            toValue: -3,
            duration: 2200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(characterSway, {
            toValue: 0.5,
            duration: 2200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(characterBreatheY, {
            toValue: 0,
            duration: 2200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(characterSway, {
            toValue: -0.5,
            duration: 2200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // Floating gliding motion for the paper airplane
    const planeAnim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(planeFloatY, {
            toValue: -4,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(planeFloatX, {
            toValue: 3,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(planeFloatY, {
            toValue: 3,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(planeFloatX, {
            toValue: -3,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    characterAnim.start();
    planeAnim.start();

    return () => {
      characterAnim.stop();
      planeAnim.stop();
    };
  }, []);

  const characterRotation = characterSway.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-0.6deg', '0.6deg'],
  });

  return (
    <Pressable
      cssInterop={false}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Invite friends and get discount"
      style={({ pressed }) => [
        styles.card,
        {
          borderColor: isDark
            ? 'rgba(168, 85, 247, 0.35)'
            : 'rgba(147, 51, 234, 0.22)',
          transform: [{ scale: pressed ? 0.985 : 1 }],
          shadowOpacity: isDark ? 0.4 : 0.1,
        },
      ]}
    >
      {/* 1. Rich Luxury Lavender/Lilac Background Gradient */}
      <LinearGradient
        colors={
          isDark
            ? ['#281645', '#1B0E30', '#110720']
            : ['#EAE0F8', '#DFCFF5', '#D6C4F0']
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
            : ['rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.08)', 'transparent']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0.6 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* TOP: Compact & Proportional Characters Stage (Zero head cropping) */}
      <View style={styles.illustrationContainer}>
        <Animated.View
          style={[
            styles.charactersAnimatedWrapper,
            {
              transform: [
                { translateY: characterBreatheY },
                { rotate: characterRotation },
              ],
            },
          ]}
        >
          {/* Transparent PNG Illustration */}
          <Image
            source={require('../../../assets/images/referral-invite.png')}
            style={styles.illustrationImage}
            resizeMode="contain"
          />

          {/* Animated Gliding Paper Airplane Glow */}
          <Animated.View
            style={[
              styles.planeGlider,
              {
                transform: [
                  { translateY: planeFloatY },
                  { translateX: planeFloatX },
                ],
              },
            ]}
            pointerEvents="none"
          >
            <View style={styles.planeGlowHalo} />
          </Animated.View>
        </Animated.View>
      </View>

      {/* BOTTOM: Compact Typography, Frosted Gift Badge & Sleek Dark Pill Button */}
      <View style={styles.contentBody}>
        {/* Main Clear Headline */}
        <Text
          style={[
            styles.headline,
            { color: isDark ? '#FFFFFF' : '#1A0E2E' },
          ]}
        >
          Invite friends & get discount
        </Text>

        {/* Static Clean Frosted Badge */}
        <View
          style={[
            styles.curiosityBadge,
            {
              backgroundColor: isDark
                ? 'rgba(168, 85, 247, 0.22)'
                : '#FFFFFF',
              borderColor: isDark
                ? 'rgba(192, 132, 252, 0.45)'
                : 'rgba(147, 51, 234, 0.22)',
            },
          ]}
        >
          <HugeiconsIcon
            icon={GiftIcon}
            size={14}
            color={isDark ? '#C084FC' : '#7C3AED'}
            strokeWidth={2.4}
          />
          <Text
            style={[
              styles.curiosityText,
              { color: isDark ? '#F5E8FF' : '#5B21B6' },
            ]}
          >
            Special Discount Unlocked
          </Text>
        </View>

        {/* Clean Inviting Subtitle */}
        <Text
          style={[
            styles.subtitle,
            { color: isDark ? '#CBD5E1' : '#4C3B68' },
          ]}
        >
          Share your referral link with friends and unlock instant plan discounts
        </Text>

        {/* CTA Button: Sleek Dark Pill Button */}
        <View style={styles.buttonRow}>
          <View
            style={[
              styles.ctaButton,
              {
                backgroundColor: isDark ? '#7C3AED' : '#160928',
                shadowColor: isDark ? '#7C3AED' : '#000000',
              },
            ]}
          >
            <Text style={styles.ctaButtonText}>Get discount now</Text>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={13}
              color="#FFFFFF"
              strokeWidth={2.4}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1.2,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 14,
    elevation: 3,
  },
  illustrationContainer: {
    width: '100%',
    height: 122,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginTop: 6,
  },
  charactersAnimatedWrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  illustrationImage: {
    width: '90%',
    height: '100%',
  },
  planeGlider: {
    position: 'absolute',
    top: '32%',
    left: '52%',
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planeGlowHalo: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(34, 197, 94, 0.35)',
  },
  contentBody: {
    paddingHorizontal: 18,
    paddingTop: 2,
    paddingBottom: 16,
    alignItems: 'center',
  },
  headline: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    letterSpacing: -0.25,
    textAlign: 'center',
  },
  curiosityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 18,
    borderWidth: 0.9,
    marginTop: 6,
    marginBottom: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  curiosityText: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: -0.15,
  },
  subtitle: {
    fontSize: 11.5,
    lineHeight: 15.5,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 10,
    marginTop: 2,
    marginBottom: 12,
  },
  buttonRow: {
    width: '100%',
    alignItems: 'center',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  ctaButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.15,
  },
});
