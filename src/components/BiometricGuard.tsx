import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  AppState,
  AppStateStatus,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BiometricService, BiometricAuthType } from '../lib/biometrics';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, getColors } from '@/theme';

interface BiometricGuardProps {
  children: React.ReactNode;
}

export function BiometricGuard({ children }: BiometricGuardProps) {
  const { session } = useAuth();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [isLocked, setIsLocked] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricAuthType>('NONE');
  const [biometricLabel, setBiometricLabel] = useState<string>('Face ID');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const isAuthenticatingRef = useRef(false);
  const lastUnlockedAtRef = useRef(0);
  const currentAppStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for the glowing sensor circle
  useEffect(() => {
    if (isLocked) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1400,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1400,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    }
  }, [isLocked, pulseAnim]);

  /**
   * Main authentication dispatcher.
   * forcePasscode = true -> triggers numeric passcode keypad.
   * forcePasscode = false -> forces native TrueDepth Face ID Camera HUD on iOS / BiometricPrompt on Android.
   */
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
          useNativeDriver: Platform.OS !== 'web',
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
      // Cooldown buffer so OS state transitions settle
      setTimeout(() => {
        isAuthenticatingRef.current = false;
      }, 600);
    }
  }, [biometricLabel, fadeAnim]);

  // Initial cold-start check
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
        // Delay slightly for fluid UI rendering before native HUD opens
        setTimeout(() => {
          triggerAuth(false);
        }, 350);
      }
    };
    checkInitialLock();
  }, [session, triggerAuth]);

  // App state listener for background to foreground transitions
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      const prevAppState = currentAppStateRef.current;
      currentAppStateRef.current = nextAppState;

      if (!session) {
        setIsLocked(false);
        return;
      }

      // Ignore state events while Face ID or Passcode modal is active
      if (isAuthenticatingRef.current) {
        return;
      }

      // Only record timestamp if app is ACTUALLY minimized to background
      if (nextAppState === 'background') {
        await BiometricService.recordBackgroundTimestamp();
      } else if (nextAppState === 'active' && prevAppState === 'background') {
        // Cooldown buffer (do not re-lock if unlocked within 3 seconds)
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
    <View style={styles.root}>
      {children}

      {isLocked && (
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <StatusBar barStyle="light-content" backgroundColor="#000000" />

          <View style={styles.container}>
            {/* Top Security Pill */}
            <View style={styles.securityPill}>
              <Ionicons name="shield-checkmark" size={14} color="#10B981" />
              <Text style={styles.securityPillText}>GetAIPilot Security Guard</Text>
            </View>

            {/* Glowing Biometric Sensor Circle */}
            <Animated.View style={[styles.iconWrapper, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.iconGlow} />
              <View style={styles.iconCircle}>
                <Ionicons name={getBiometricIcon()} size={46} color="#10B981" />
              </View>
            </Animated.View>

            {/* Title & Subtitle */}
            <Text style={styles.title}>App Locked</Text>
            <Text style={styles.subtitle}>
              Scan {biometricLabel} to access your GetAIPilot dashboard
            </Text>

            {authError && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color="#FF453A" />
                <Text style={styles.errorText}>{authError}</Text>
              </View>
            )}

            {/* Primary Action Button: Face ID / Biometrics */}
            <Pressable
              style={({ pressed }) => [
                styles.unlockButton,
                pressed && styles.unlockButtonPressed,
              ]}
              onPress={() => triggerAuth(false)}
            >
              <Ionicons name={getBiometricIcon()} size={20} color="#FFFFFF" />
              <Text style={styles.unlockButtonText}>Unlock with {biometricLabel}</Text>
            </Pressable>

            {/* Secondary Action: Device Passcode Fallback */}
            <Pressable
              style={({ pressed }) => [
                styles.fallbackButton,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => triggerAuth(true)}
            >
              <Text style={styles.fallbackButtonText}>Use Device Passcode</Text>
            </Pressable>

            {/* Emergency Bypass Option */}
            <Pressable
              style={styles.emergencyButton}
              onPress={async () => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                await BiometricService.setEnabled(false);
                setIsLocked(false);
              }}
            >
              <Text style={styles.emergencyButtonText}>Emergency Unlock & Disable</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 999999,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  securityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    marginBottom: 44,
  },
  securityPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 0.2,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  iconGlow: {
    position: 'absolute',
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#1C1C1E',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14.5,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 290,
    marginBottom: 32,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.25)',
  },
  errorText: {
    fontSize: 13,
    color: '#FF453A',
    fontWeight: '600',
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  unlockButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  unlockButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  fallbackButton: {
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  fallbackButtonText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#0A84FF',
  },
  emergencyButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  emergencyButtonText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#8E8E93',
  },
});
