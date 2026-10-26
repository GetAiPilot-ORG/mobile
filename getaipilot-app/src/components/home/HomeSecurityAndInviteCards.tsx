import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { soundService } from '../../services/soundFeedbackService';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowRight01Icon,
  ShieldCheckIcon,
  GiftIcon,
} from '@/constants/icons';
import Svg, { Path } from 'react-native-svg';

interface HomeSecurityAndInviteCardsProps {
  isDark: boolean;
  activeDeviceCount: number;
  isLoadingDevices: boolean;
  onOpenSecurity: () => void;
  onOpenReferral: () => void;
}

/**
 * Twin animated cards for the home screen:
 * 1. AI Security & Device Sentinel (Live radar pulse, 256-bit encryption badge, live device count)
 * 2. Invite Friends & Earn Rewards (Floating 3D money stack, twinkling rewards, 20% bonus badge)
 */
export function HomeSecurityAndInviteCards({
  isDark,
  activeDeviceCount,
  isLoadingDevices,
  onOpenSecurity,
  onOpenReferral,
}: HomeSecurityAndInviteCardsProps) {
  // --- 1. Security Card Animations ---
  const securityPressScale = useRef(new Animated.Value(1)).current;
  const radarPulse = useRef(new Animated.Value(1)).current;
  const radarOpacity = useRef(new Animated.Value(0.75)).current;
  const shieldBreathe = useRef(new Animated.Value(1)).current;

  // --- 2. Referral Card Animations ---
  const referralPressScale = useRef(new Animated.Value(1)).current;
  const moneyFloatY = useRef(new Animated.Value(0)).current;
  const moneyRotate = useRef(new Animated.Value(0)).current;
  const starPulse1 = useRef(new Animated.Value(0.3)).current;
  const starPulse2 = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // 1. Security live radar ripple
    const radarAnim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(radarPulse, {
            toValue: 1.85,
            duration: 1400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(radarOpacity, {
            toValue: 0,
            duration: 1400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(radarPulse, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(radarOpacity, { toValue: 0.75, duration: 0, useNativeDriver: true }),
        ]),
        Animated.delay(600),
      ])
    );

    // Shield subtle breathing
    const shieldAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(shieldBreathe, {
          toValue: 1.06,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(shieldBreathe, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // 2. Referral 3D Money Stack levitation
    const moneyAnim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(moneyFloatY, {
            toValue: -4,
            duration: 1600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(moneyRotate, {
            toValue: 1,
            duration: 1600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(moneyFloatY, {
            toValue: 3,
            duration: 1600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(moneyRotate, {
            toValue: -1,
            duration: 1600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // Star sparkle twinkling
    const starAnim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(starPulse1, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(starPulse2, { toValue: 0.3, duration: 900, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(starPulse1, { toValue: 0.3, duration: 900, useNativeDriver: true }),
          Animated.timing(starPulse2, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
      ])
    );

    radarAnim.start();
    shieldAnim.start();
    moneyAnim.start();
    starAnim.start();

    return () => {
      radarAnim.stop();
      shieldAnim.stop();
      moneyAnim.stop();
      starAnim.stop();
    };
  }, [radarPulse, radarOpacity, shieldBreathe, moneyFloatY, moneyRotate, starPulse1, starPulse2]);

  const handleSecurityPress = () => {
    soundService.play('radar');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onOpenSecurity();
  };

  const handleReferralPress = () => {
    soundService.play('success');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onOpenReferral();
  };

  const moneyRotationDeg = moneyRotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-3deg', '3deg'],
  });

  const deviceSubtitle = isLoadingDevices
    ? 'Checking devices…'
    : `${activeDeviceCount} signed-in device${activeDeviceCount === 1 ? '' : 's'}`;

  return (
    <View style={styles.gridRow}>
      {/* ========================================================
          CARD 1: AI SECURITY & DEVICE SENTINEL
         ======================================================== */}
      <Animated.View
        style={[
          styles.cardWrapper,
          { transform: [{ scale: securityPressScale }] },
        ]}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={() => {
            Animated.spring(securityPressScale, {
              toValue: 0.965,
              useNativeDriver: true,
              tension: 250,
              friction: 12,
            }).start();
          }}
          onPressOut={() => {
            Animated.spring(securityPressScale, {
              toValue: 1,
              useNativeDriver: true,
              tension: 250,
              friction: 12,
            }).start();
          }}
          onPress={handleSecurityPress}
          accessibilityRole="button"
          accessibilityLabel="Security and Active Devices"
          style={[
            styles.twinCard,
            {
              borderColor: isDark
                ? 'rgba(34, 197, 94, 0.32)'
                : 'rgba(34, 197, 94, 0.22)',
              shadowColor: '#22C55E',
              shadowOpacity: isDark ? 0.28 : 0.08,
            },
          ]}
        >
          {/* Cyber Emerald Background Gradient */}
          <LinearGradient
            colors={
              isDark
                ? ['#0D2419', '#071A12', '#03100A']
                : ['#F2FBF6', '#E6F8EE', '#D9F5E4']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Top Specular Gloss Reflection */}
          <LinearGradient
            colors={
              isDark
                ? ['rgba(255, 255, 255, 0.12)', 'transparent']
                : ['rgba(255, 255, 255, 0.85)', 'rgba(255, 255, 255, 0.1)', 'transparent']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 0.8, y: 0.6 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* Subtle Background Shield Watermark */}
          <View style={styles.securityWatermark} pointerEvents="none">
            <HugeiconsIcon
              icon={ShieldCheckIcon}
              size={82}
              color={isDark ? '#22C55E' : '#16A34A'}
              strokeWidth={1.2}
            />
          </View>

          {/* Top Header Row: Icon Badge + Protected Pill */}
          <View style={styles.cardHeaderRow}>
            {/* Elevated Shield Badge with Live Sonar Pulse */}
            <View style={styles.badgeWrapper}>
              <Animated.View
                style={[
                  styles.radarPulseRing,
                  {
                    transform: [{ scale: radarPulse }],
                    opacity: radarOpacity,
                  },
                ]}
                pointerEvents="none"
              />
              <Animated.View
                style={[
                  styles.shieldIconBadge,
                  {
                    transform: [{ scale: shieldBreathe }],
                    backgroundColor: isDark
                      ? 'rgba(34, 197, 94, 0.18)'
                      : '#FFFFFF',
                    borderColor: isDark
                      ? 'rgba(34, 197, 94, 0.35)'
                      : 'rgba(34, 197, 94, 0.22)',
                  },
                ]}
              >
                <HugeiconsIcon
                  icon={ShieldCheckIcon}
                  size={20}
                  color={isDark ? '#4ADE80' : '#16A34A'}
                  strokeWidth={2.2}
                />
              </Animated.View>

              {/* Solid Green Live Status Dot */}
              <View style={styles.liveStatusDot} />
            </View>

            {/* Micro Protected Pill */}
            <View
              style={[
                styles.microPill,
                {
                  backgroundColor: isDark
                    ? 'rgba(34, 197, 94, 0.16)'
                    : 'rgba(34, 197, 94, 0.12)',
                  borderColor: isDark
                    ? 'rgba(34, 197, 94, 0.38)'
                    : 'rgba(34, 197, 94, 0.28)',
                },
              ]}
            >
              <Text
                style={[
                  styles.microPillText,
                  { color: isDark ? '#4ADE80' : '#15803D' },
                ]}
              >
                SECURE
              </Text>
            </View>
          </View>

          {/* Middle Body: Title & Telemetry */}
          <View style={styles.cardBody}>
            <Text
              numberOfLines={1}
              style={[
                styles.cardTitle,
                { color: isDark ? '#FFFFFF' : '#0F291E' },
              ]}
            >
              Security
            </Text>
            <Text
              numberOfLines={2}
              style={[
                styles.cardSubtitle,
                { color: isDark ? '#A7F3D0' : '#336248' },
              ]}
            >
              {deviceSubtitle}
            </Text>
          </View>

          {/* Bottom Footer Row: Encryption Chip & Arrow Button */}
          <View style={styles.cardFooterRow}>
            <View
              style={[
                styles.techChip,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.07)'
                    : 'rgba(0, 0, 0, 0.04)',
                },
              ]}
            >
              <Text
                style={[
                  styles.techChipText,
                  { color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#336248' },
                ]}
              >
                256-bit AES
              </Text>
            </View>

            <View
              style={[
                styles.actionCircleBtn,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.1)'
                    : '#FFFFFF',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.15)'
                    : 'rgba(34, 197, 94, 0.2)',
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
        </TouchableOpacity>
      </Animated.View>

      {/* ========================================================
          CARD 2: INVITE FRIENDS & EARN REWARDS
         ======================================================== */}
      <Animated.View
        style={[
          styles.cardWrapper,
          { transform: [{ scale: referralPressScale }] },
        ]}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={() => {
            Animated.spring(referralPressScale, {
              toValue: 0.965,
              useNativeDriver: true,
              tension: 250,
              friction: 12,
            }).start();
          }}
          onPressOut={() => {
            Animated.spring(referralPressScale, {
              toValue: 1,
              useNativeDriver: true,
              tension: 250,
              friction: 12,
            }).start();
          }}
          onPress={handleReferralPress}
          accessibilityRole="button"
          accessibilityLabel="Invite friends and earn rewards"
          style={[
            styles.twinCard,
            {
              borderColor: isDark
                ? 'rgba(168, 85, 247, 0.35)'
                : 'rgba(147, 51, 234, 0.22)',
              shadowColor: '#8B5CF6',
              shadowOpacity: isDark ? 0.28 : 0.08,
            },
          ]}
        >
          {/* Royal Violet / Amethyst Background Gradient */}
          <LinearGradient
            colors={
              isDark
                ? ['#25123E', '#1A0A30', '#100520']
                : ['#FAF5FF', '#F3E8FF', '#E9D5FF']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Top Specular Gloss Reflection */}
          <LinearGradient
            colors={
              isDark
                ? ['rgba(255, 255, 255, 0.12)', 'transparent']
                : ['rgba(255, 255, 255, 0.85)', 'rgba(255, 255, 255, 0.1)', 'transparent']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 0.8, y: 0.6 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* Background Sparkles Watermark */}
          <View style={styles.referralWatermark} pointerEvents="none">
            <Svg width="72" height="72" viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"
                fill={isDark ? '#A855F7' : '#9333EA'}
                opacity={0.12}
              />
            </Svg>
          </View>

          {/* Floating Twinkling Golden Stars */}
          <Animated.View
            style={[styles.floatingStar1, { opacity: starPulse1 }]}
            pointerEvents="none"
          />
          <Animated.View
            style={[styles.floatingStar2, { opacity: starPulse2 }]}
            pointerEvents="none"
          />

          {/* Top Header Row: 3D Levitating Money + Earn 20% Pill */}
          <View style={styles.cardHeaderRow}>
            {/* Elevated Badge with Floating 3D Money Stack */}
            <View style={styles.badgeWrapper}>
              <View
                style={[
                  styles.moneyAuraGlow,
                  {
                    backgroundColor: isDark
                      ? 'rgba(245, 158, 11, 0.28)'
                      : 'rgba(245, 158, 11, 0.18)',
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.moneyIconBadge,
                  {
                    backgroundColor: isDark
                      ? 'rgba(168, 85, 247, 0.18)'
                      : '#FFFFFF',
                    borderColor: isDark
                      ? 'rgba(168, 85, 247, 0.35)'
                      : 'rgba(147, 51, 234, 0.22)',
                    transform: [
                      { translateY: moneyFloatY },
                      { rotate: moneyRotationDeg },
                    ],
                  },
                ]}
              >
                <Image
                  source={require('../../../assets/images/money.png')}
                  style={{ width: 28, height: 28 }}
                  resizeMode="contain"
                />
              </Animated.View>
            </View>

            {/* Micro Reward Pill */}
            <View
              style={[
                styles.microPill,
                {
                  backgroundColor: isDark
                    ? 'rgba(245, 158, 11, 0.18)'
                    : 'rgba(245, 158, 11, 0.14)',
                  borderColor: isDark
                    ? 'rgba(245, 158, 11, 0.42)'
                    : 'rgba(245, 158, 11, 0.35)',
                },
              ]}
            >
              <Text
                style={[
                  styles.microPillText,
                  { color: isDark ? '#FDE68A' : '#B45309' },
                ]}
              >
                EARN 20%
              </Text>
            </View>
          </View>

          {/* Middle Body: Title & Reward Promise */}
          <View style={styles.cardBody}>
            <Text
              numberOfLines={1}
              style={[
                styles.cardTitle,
                { color: isDark ? '#FFFFFF' : '#1A0E2E' },
              ]}
            >
              Invite friends
            </Text>
            <Text
              numberOfLines={2}
              style={[
                styles.cardSubtitle,
                { color: isDark ? '#DDD6FE' : '#4C3B68' },
              ]}
            >
              Share link & earn recurring commissions
            </Text>
          </View>

          {/* Bottom Footer Row: Bonus Chip & Arrow Button */}
          <View style={styles.cardFooterRow}>
            <View
              style={[
                styles.techChip,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.07)'
                    : 'rgba(0, 0, 0, 0.04)',
                },
              ]}
            >
              <Text
                style={[
                  styles.techChipText,
                  { color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#4C3B68' },
                ]}
              >
                Cash reward
              </Text>
            </View>

            <View
              style={[
                styles.actionCircleBtn,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.1)'
                    : '#FFFFFF',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.15)'
                    : 'rgba(147, 51, 234, 0.2)',
                },
              ]}
            >
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={13}
                color={isDark ? '#C084FC' : '#7C3AED'}
                strokeWidth={2.4}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cardWrapper: {
    flex: 1,
  },
  twinCard: {
    borderRadius: 22,
    borderWidth: 0.1,
    padding: 15,
    minHeight: 164,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 4,
  },
  securityWatermark: {
    position: 'absolute',
    right: -10,
    bottom: -12,
    opacity: 0.08,
    transform: [{ rotate: '-12deg' }],
  },
  referralWatermark: {
    position: 'absolute',
    right: -12,
    bottom: -12,
    opacity: 0.12,
    transform: [{ rotate: '15deg' }],
  },
  floatingStar1: {
    position: 'absolute',
    top: 14,
    right: 28,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FDE68A',
    shadowColor: '#F59E0B',
    shadowRadius: 3,
  },
  floatingStar2: {
    position: 'absolute',
    bottom: 34,
    left: 14,
    width: 3.5,
    height: 3.5,
    borderRadius: 1.75,
    backgroundColor: '#FEF08A',
    shadowColor: '#F59E0B',
    shadowRadius: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeWrapper: {
    position: 'relative',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarPulseRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#22C55E',
  },
  shieldIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  liveStatusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  moneyAuraGlow: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    shadowColor: '#F59E0B',
    shadowRadius: 8,
    shadowOpacity: 0.8,
  },
  moneyIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  microPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 0.8,
  },
  microPillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  cardBody: {
    gap: 3,
    marginVertical: 8,
  },
  cardTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  techChip: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 7,
  },
  techChipText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  actionCircleBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
});
