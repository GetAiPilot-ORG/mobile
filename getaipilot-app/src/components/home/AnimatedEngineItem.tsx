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

interface EngineItemData {
  id: string;
  name: string;
  logo: any;
  route: string;
}

interface AnimatedEngineItemProps {
  item: EngineItemData;
  index: number;
  bgColor: string;
  textColor: string;
  onPress: () => void;
  cycleTick: number;
}

export function AnimatedEngineItem({
  item,
  index,
  bgColor,
  textColor,
  onPress,
  cycleTick,
}: AnimatedEngineItemProps) {
  // Main icon transforms (subtle, calm & elegant)
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotateDeg = useRef(new Animated.Value(0)).current;

  // WhatsApp Center Line Drawing (subtle diagonal shimmer)
  const waLineProgress = useRef(new Animated.Value(-20)).current;
  const waLineOpacity = useRef(new Animated.Value(0)).current;

  // CRM Glass Sheen
  const crmShineX = useRef(new Animated.Value(-35)).current;
  const crmShineOpacity = useRef(new Animated.Value(0)).current;

  // Trigger signature animation based on engine type (calibrated to be subtle & premium)
  const triggerSignatureAnimation = () => {
    switch (item.id) {
      case 'telegram':
        // TELEGRAM: Subtle paper plane flight - gentle lift, slight bank, soft landing
        Animated.sequence([
          // Gentle lift-off & banking
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: 2.5,
              duration: 260,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: -3,
              duration: 260,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(rotateDeg, {
              toValue: 6,
              duration: 260,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1.06,
              duration: 260,
              useNativeDriver: true,
            }),
          ]),
          // Soft glide back into position
          Animated.parallel([
            Animated.spring(translateX, { toValue: 0, friction: 6, tension: 50, useNativeDriver: true }),
            Animated.spring(translateY, { toValue: 0, friction: 6, tension: 50, useNativeDriver: true }),
            Animated.spring(rotateDeg, { toValue: 0, friction: 6, tension: 50, useNativeDriver: true }),
            Animated.spring(scale, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
          ]),
        ]).start();
        break;

      case 'whatsapp':
        // WHATSAPP: Subtle line drawing beam across center line + gentle breath
        Animated.parallel([
          Animated.sequence([
            Animated.timing(waLineOpacity, { toValue: 0.7, duration: 60, useNativeDriver: true }),
            Animated.timing(waLineProgress, {
              toValue: 0,
              duration: 380,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(waLineOpacity, { toValue: 0, duration: 160, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(scale, { toValue: 1.05, duration: 220, useNativeDriver: true }),
            Animated.spring(scale, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
          ]),
        ]).start(() => {
          waLineProgress.setValue(-20);
        });
        break;

      case 'voice':
        // VOICE AI: Subtle audio resonance breath
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scale, { toValue: 1.06, duration: 180, useNativeDriver: true }),
            Animated.timing(rotateDeg, { toValue: -3, duration: 180, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scale, { toValue: 1.03, duration: 120, useNativeDriver: true }),
            Animated.timing(rotateDeg, { toValue: 2, duration: 120, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.spring(scale, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
            Animated.spring(rotateDeg, { toValue: 0, friction: 6, tension: 50, useNativeDriver: true }),
          ]),
        ]).start();
        break;

      case 'crm':
        // CRM: Subtle pipeline lift & soft glass sheen
        Animated.parallel([
          Animated.sequence([
            Animated.parallel([
              Animated.timing(translateY, { toValue: -2.5, duration: 200, useNativeDriver: true }),
              Animated.timing(scale, { toValue: 1.05, duration: 200, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.spring(translateY, { toValue: 0, friction: 6, tension: 50, useNativeDriver: true }),
              Animated.spring(scale, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
            ]),
          ]),
          Animated.sequence([
            Animated.timing(crmShineOpacity, { toValue: 0.55, duration: 70, useNativeDriver: true }),
            Animated.timing(crmShineX, {
              toValue: 35,
              duration: 320,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(crmShineOpacity, { toValue: 0, duration: 80, useNativeDriver: true }),
          ]),
        ]).start(() => {
          crmShineX.setValue(-35);
        });
        break;

      case 'social':
        // SOCIAL: Subtle growth lift & slight positive tilt
        Animated.sequence([
          Animated.parallel([
            Animated.timing(translateY, { toValue: -2.5, duration: 200, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 1.05, duration: 200, useNativeDriver: true }),
            Animated.timing(rotateDeg, { toValue: 3, duration: 200, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.spring(translateY, { toValue: 0, friction: 6, tension: 50, useNativeDriver: true }),
            Animated.spring(scale, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
            Animated.spring(rotateDeg, { toValue: 0, friction: 6, tension: 50, useNativeDriver: true }),
          ]),
        ]).start();
        break;
    }
  };

  // Staggered wave animation on cycle tick (quick, cohesive 350ms stagger)
  useEffect(() => {
    if (cycleTick === 0) return;
    const delay = index * 350;
    const timer = setTimeout(() => {
      triggerSignatureAnimation();
    }, delay);

    return () => clearTimeout(timer);
  }, [cycleTick, index]);

  const rotationInterpolated = rotateDeg.interpolate({
    inputRange: [-10, 10],
    outputRange: ['-10deg', '10deg'],
  });

  const handlePress = () => {
    triggerSignatureAnimation();
    onPress();
  };

  return (
    <Pressable
      cssInterop={false}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={item.name}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: bgColor,
          opacity: pressed ? 0.72 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}
    >
      {/* Icon Presentation Stage */}
      <View style={styles.iconStage}>
        {/* Animated Native Engine Icon */}
        <Animated.View
          style={[
            styles.animatedIconWrapper,
            {
              transform: [
                { translateX },
                { translateY },
                { scale },
                { rotate: rotationInterpolated },
              ],
            },
          ]}
        >
          <Image
            source={item.logo}
            style={styles.logoImage}
            resizeMode="contain"
          />

          {/* WHATSAPP: Subtle line drawing shimmer along center diagonal */}
          {item.id === 'whatsapp' && (
            <Animated.View
              style={[
                styles.waLineTrack,
                { opacity: waLineOpacity },
              ]}
              pointerEvents="none"
            >
              <Animated.View
                style={[
                  styles.waLineBar,
                  {
                    transform: [{ translateX: waLineProgress }],
                  },
                ]}
              >
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.2)', '#FFFFFF', 'rgba(74, 222, 128, 0.8)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </Animated.View>
          )}

          {/* CRM: Soft diagonal glass sheen */}
          {item.id === 'crm' && (
            <Animated.View
              style={[
                styles.crmShineWrapper,
                {
                  opacity: crmShineOpacity,
                  transform: [
                    { translateX: crmShineX },
                    { rotate: '25deg' },
                  ],
                },
              ]}
              pointerEvents="none"
            >
              <LinearGradient
                colors={['transparent', 'rgba(255, 255, 255, 0.7)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          )}
        </Animated.View>
      </View>

      {/* Label */}
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={[styles.label, { color: textColor }]}
      >
        {item.name.replace('Smart ', '').replace(' Pilot', '')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    minHeight: 74,
    paddingHorizontal: 2,
    paddingVertical: 9,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconStage: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  animatedIconWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 9,
  },
  logoImage: {
    width: 32,
    height: 32,
  },
  // WhatsApp center line subtle drawing track
  waLineTrack: {
    position: 'absolute',
    width: 16,
    height: 2.6,
    borderRadius: 1.3,
    overflow: 'hidden',
    transform: [{ rotate: '-42deg' }],
  },
  waLineBar: {
    width: 16,
    height: 2.6,
  },
  // CRM checkmark soft sheen
  crmShineWrapper: {
    position: 'absolute',
    top: -8,
    bottom: -8,
    width: 10,
  },
  label: {
    width: '100%',
    textAlign: 'center',
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: '600',
    marginTop: 5,
    letterSpacing: -0.2,
  },
});
