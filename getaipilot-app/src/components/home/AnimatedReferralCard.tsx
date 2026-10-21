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
import { Ionicons } from '@expo/vector-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { GiftIcon } from '@hugeicons/core-free-icons';

interface AnimatedReferralCardProps {
  isDark: boolean;
  onPress?: () => void;
  referralCode?: string;
  onCopyCode?: () => void;
  onCopyLink?: () => void;
  onShare?: () => void;
  headline?: string;
  badgeText?: string;
  subtitle?: string;
  buttonText?: string;
  style?: any;
}

export function AnimatedReferralCard({
  isDark,
  onPress,
  referralCode,
  onCopyCode,
  onCopyLink,
  onShare,
  headline = 'Invite friends & get discount',
  badgeText = 'Special Discount Unlocked',
  subtitle = 'Share your referral link with friends and unlock instant plan discounts',
  buttonText = 'Share Referral Link',
  style,
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

  const handlePrimaryPress = () => {
    if (onShare) onShare();
    else if (onPress) onPress();
  };

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: isDark
            ? 'rgba(168, 85, 247, 0.35)'
            : 'rgba(147, 51, 234, 0.22)',
          shadowOpacity: isDark ? 0.4 : 0.1,
        },
        style,
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

      {/* TOP: Compact & Proportional Characters Stage */}
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

      {/* BOTTOM: Typography, Frosted Badge, Referral Code & Clean Pill Actions */}
      <View style={styles.contentBody}>
        {/* Main Clear Headline */}
        <Text
          style={[
            styles.headline,
            { color: isDark ? '#FFFFFF' : '#1A0E2E' },
          ]}
        >
          {headline}
        </Text>

        {/* Static Clean Frosted Badge */}
        {Boolean(badgeText) && (
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
              size={13}
              color={isDark ? '#C084FC' : '#7C3AED'}
              strokeWidth={2.4}
            />
            <Text
              style={[
                styles.curiosityText,
                { color: isDark ? '#F5E8FF' : '#5B21B6' },
              ]}
            >
              {badgeText}
            </Text>
          </View>
        )}

        {/* Clean Inviting Subtitle */}
        {Boolean(subtitle) && (
          <Text
            style={[
              styles.subtitle,
              { color: isDark ? '#CBD5E1' : '#4C3B68' },
            ]}
          >
            {subtitle}
          </Text>
        )}

        {/* Integrated Referral Code Row (if provided) */}
        {Boolean(referralCode) && (
          <View
            style={[
              styles.codePillContainer,
              {
                backgroundColor: isDark
                  ? 'rgba(0, 0, 0, 0.35)'
                  : 'rgba(255, 255, 255, 0.65)',
                borderColor: isDark
                  ? 'rgba(168, 85, 247, 0.3)'
                  : 'rgba(147, 51, 234, 0.22)',
              },
            ]}
          >
            <View style={styles.codeTextCol}>
              <Text
                style={[
                  styles.codeLabel,
                  { color: isDark ? '#A78BFA' : '#7C3AED' },
                ]}
              >
                YOUR REFERRAL CODE
              </Text>
              <Text
                style={[
                  styles.codeValue,
                  { color: isDark ? '#FFFFFF' : '#1A0E2E' },
                ]}
                numberOfLines={1}
                selectable
              >
                {referralCode}
              </Text>
            </View>

            <View style={styles.codeButtonsRow}>
              {Boolean(onCopyCode) && (
                <Pressable
                  onPress={onCopyCode}
                  hitSlop={8}
                  accessibilityLabel="Copy referral code"
                  style={({ pressed }) => [
                    styles.iconActionBtn,
                    {
                      backgroundColor: isDark
                        ? 'rgba(168, 85, 247, 0.25)'
                        : 'rgba(147, 51, 234, 0.12)',
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name="copy-outline"
                    size={16}
                    color={isDark ? '#C084FC' : '#7C3AED'}
                  />
                </Pressable>
              )}

              {Boolean(onCopyLink) && (
                <Pressable
                  onPress={onCopyLink}
                  hitSlop={8}
                  accessibilityLabel="Copy referral link"
                  style={({ pressed }) => [
                    styles.iconActionBtn,
                    {
                      backgroundColor: isDark
                        ? 'rgba(168, 85, 247, 0.25)'
                        : 'rgba(147, 51, 234, 0.12)',
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name="link-outline"
                    size={17}
                    color={isDark ? '#C084FC' : '#7C3AED'}
                  />
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Primary CTA Button: Sleek Pill Button */}
        <View style={styles.buttonRow}>
          <Pressable
            cssInterop={false}
            onPress={handlePrimaryPress}
            accessibilityRole="button"
            accessibilityLabel={buttonText}
            style={({ pressed }) => [
              styles.ctaButton,
              {
                backgroundColor: isDark ? '#7C3AED' : '#160928',
                shadowColor: isDark ? '#7C3AED' : '#000000',
                opacity: pressed ? 0.88 : 1,
                transform: [{ scale: pressed ? 0.99 : 1 }],
              },
            ]}
          >
            <Ionicons name="share-social-outline" size={16} color="#FFFFFF" />
            <Text style={styles.ctaButtonText}>{buttonText}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
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
    height: 118,
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
    paddingHorizontal: 16,
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
    paddingVertical: 4.5,
    borderRadius: 18,
    borderWidth: 0.9,
    marginTop: 6,
    marginBottom: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  curiosityText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.15,
  },
  subtitle: {
    fontSize: 11.5,
    lineHeight: 15.5,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 8,
    marginTop: 2,
    marginBottom: 6,
  },
  codePillContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 6,
    marginBottom: 10,
  },
  codeTextCol: {
    flex: 1,
  },
  codeLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  codeValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 1,
  },
  codeButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    width: '100%',
  },
  ctaButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  ctaButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.15,
  },
});
