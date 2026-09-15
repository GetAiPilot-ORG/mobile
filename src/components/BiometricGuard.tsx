import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  AppState,
  AppStateStatus,
  Animated,
  StatusBar,
  useColorScheme,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BiometricService, BiometricAuthType } from '../lib/biometrics';
import { useAuth } from '../contexts/AuthContext';

interface BiometricGuardProps {
  children: React.ReactNode;
}

export function BiometricGuard({ children }: BiometricGuardProps) {
  const { session } = useAuth();
  const colorScheme = useColorScheme();
  const [isLocked, setIsLocked] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricAuthType>('NONE');
  const [biometricLabel, setBiometricLabel] = useState<string>('Face ID');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const isAuthenticatingRef = useRef(false);
  const lastUnlockedAtRef = useRef(0);
  const currentAppStateRef = useRef<AppStateStatus>(AppState.currentState);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isLocked) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1400,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1400,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    }
  }, [isLocked, pulseAnim]);

  const triggerAuth = useCallback(async (forcePasscode: boolean = false) => {
    if (isAuthenticatingRef.current) return;
    isAuthenticatingRef.current = true;
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      const prompt = forcePasscode
        ? 'Enter Device Passcode'
        : `Scan ${biometricLabel} to Unlock GetAIPilot`;

      let result;
      if (forcePasscode) {
        result = await BiometricService.authenticatePasscode(prompt);
      } else {
        result = await BiometricService.authenticateBiometrics(prompt);
      }

      if (result.success) {
        lastUnlockedAtRef.current = Date.now();
        await BiometricService.clearBackgroundTimestamp();
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }).start(() => {
          setIsLocked(false);
          fadeAnim.setValue(1);
        });
      } else if (!result.isCancelled) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        setAuthError('Authentication failed. Please try again.');
      }
    } catch (err) {
      console.warn('Biometric prompt exception:', err);
      setAuthError('Unable to authenticate');
    } finally {
      setIsAuthenticating(false);
      setTimeout(() => {
        isAuthenticatingRef.current = false;
      }, 600);
    }
  }, [biometricLabel, fadeAnim]);

  useEffect(() => {
    const checkInitialLock = async () => {
      if (!session) {
        setIsLocked(false);
        return;
      }
      const settings = await BiometricService.getSettings();
      if (settings.enabled) {
        setBiometricType(settings.biometricType);
        setBiometricLabel(settings.biometricLabel);
        setIsLocked(true);
        setTimeout(() => {
          triggerAuth(false);
        }, 350);
      }
    };
    checkInitialLock();
  }, [session, triggerAuth]);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      const prevAppState = currentAppStateRef.current;
      currentAppStateRef.current = nextAppState;

      if (!session) {
        setIsLocked(false);
        return;
      }

      if (isAuthenticatingRef.current) {
        return;
      }

      if (nextAppState === 'background') {
        await BiometricService.recordBackgroundTimestamp();
      } else if (nextAppState === 'active' && prevAppState === 'background') {
        const timeSinceUnlock = Date.now() - lastUnlockedAtRef.current;
        if (timeSinceUnlock < 3000) {
          return;
        }

        const needsLock = await BiometricService.shouldLock();
        if (needsLock) {
          const settings = await BiometricService.getSettings();
          setBiometricType(settings.biometricType);
          setBiometricLabel(settings.biometricLabel);
          setIsLocked(true);
          setTimeout(() => {
            triggerAuth(false);
          }, 250);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [session, triggerAuth]);

  const getBiometricIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (biometricType) {
      case 'FACE_ID':
        return 'scan-outline';
      case 'TOUCH_ID':
      case 'FINGERPRINT':
        return 'finger-print-outline';
      case 'ANDROID_FACE':
        return 'person-circle-outline';
      default:
        return 'lock-closed-outline';
    }
  };

  return (
    <View className="flex-1">
      {children}

      {isLocked && (
        <Animated.View className="absolute inset-0 bg-black z-50" style={{ opacity: fadeAnim }}>
          <StatusBar barStyle="light-content" backgroundColor="#000000" />

          <View className="flex-1 items-center justify-center px-7">
            {/* Top Security Pill */}
            <View className="flex-row items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/12 border border-emerald-500/25 mb-11">
              <Ionicons name="shield-checkmark" size={14} color="#10B981" />
              <Text className="text-xs font-bold text-emerald-500 tracking-wider">GetAIPilot Security Guard</Text>
            </View>

            {/* Glowing Biometric Sensor Circle */}
            <Animated.View className="items-center justify-center mb-7" style={{ transform: [{ scale: pulseAnim }] }}>
              <View className="absolute w-[124px] h-[124px] rounded-full bg-emerald-500/20" />
              <View className="w-[90px] h-[90px] rounded-full bg-[#1C1C1E] border-1.5 border-emerald-500/40 items-center justify-center shadow-lg">
                <Ionicons name={getBiometricIcon()} size={46} color="#10B981" />
              </View>
            </Animated.View>

            {/* Title & Subtitle */}
            <Text className="text-2xl font-extrabold text-white tracking-tight mb-2">App Locked</Text>
            <Text className="text-sm text-slate-400 text-center leading-5 max-w-[290px] mb-8">
              Scan {biometricLabel} to access your GetAIPilot dashboard
            </Text>

            {authError && (
              <View className="flex-row items-center gap-1.5 mb-5 bg-red-500/12 px-3.5 py-2 rounded-xl border border-red-500/25">
                <Ionicons name="alert-circle" size={14} color="#FF453A" />
                <Text className="text-xs text-red-400 font-semibold">{authError}</Text>
              </View>
            )}

            {/* Primary Action Button */}
            <Pressable
              className="flex-row items-center justify-center gap-2 bg-[#10B981] py-4 px-8 rounded-full w-full max-w-[320px] shadow-lg"
              style={({ pressed }) => pressed ? { opacity: 0.88, transform: [{ scale: 0.98 }] } : undefined}
              onPress={() => triggerAuth(false)}
            >
              <Ionicons name={getBiometricIcon()} size={20} color="#FFFFFF" />
              <Text className="text-base font-bold text-white tracking-tight">Unlock with {biometricLabel}</Text>
            </Pressable>

            {/* Secondary Action */}
            <Pressable
              className="mt-4.5 py-2.5 px-4"
              style={({ pressed }) => pressed ? { opacity: 0.7 } : undefined}
              onPress={() => triggerAuth(true)}
            >
              <Text className="text-sm font-semibold text-sky-500">Use Device Passcode</Text>
            </Pressable>

            {/* Emergency Bypass Option */}
            <Pressable
              className="mt-2.5 py-2 px-4"
              onPress={async () => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                await BiometricService.setEnabled(false);
                setIsLocked(false);
              }}
            >
              <Text className="text-xs font-semibold text-slate-400">Emergency Unlock & Disable</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}
    </View>
  );
}
