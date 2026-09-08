import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type BiometricAuthType = 'FACE_ID' | 'TOUCH_ID' | 'FINGERPRINT' | 'ANDROID_FACE' | 'PASSCODE' | 'NONE';

export interface BiometricCapabilities {
  hasHardware: boolean;
  isEnrolled: boolean;
  biometricType: BiometricAuthType;
  biometricLabel: string;
  hardwareDescription: string;
}

export interface BiometricSettings extends BiometricCapabilities {
  enabled: boolean;
  timeoutMinutes: number; // 0 = Immediately, 1 = 1m, 5 = 5m, 15 = 15m
}

export type AuthResult = {
  success: boolean;
  error?: string;
  isCancelled?: boolean;
};

const STORAGE_KEYS = {
  ENABLED: '@gap_security_biometric_enabled',
  TIMEOUT: '@gap_security_autolock_timeout',
  LAST_ACTIVE: '@gap_security_last_active_timestamp',
};

export const BiometricService = {
  /**
   * Check hardware capabilities, supported biometric types, and enrollment status.
   */
  async checkCapabilities(): Promise<BiometricCapabilities> {
    try {
      if (Platform.OS === 'web') {
        return {
          hasHardware: false,
          isEnrolled: false,
          biometricType: 'NONE',
          biometricLabel: 'Passcode',
          hardwareDescription: 'Web Browser Mode',
        };
      }

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      let biometricType: BiometricAuthType = 'NONE';
      let biometricLabel = 'Device Passcode';
      let hardwareDescription = 'Passcode / PIN Only';

      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        if (Platform.OS === 'ios') {
          biometricType = 'FACE_ID';
          biometricLabel = 'Face ID';
          hardwareDescription = 'Apple TrueDepth Face ID';
        } else {
          biometricType = 'ANDROID_FACE';
          biometricLabel = 'Face Recognition';
          hardwareDescription = 'Android Face Unlock';
        }
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        if (Platform.OS === 'ios') {
          biometricType = 'TOUCH_ID';
          biometricLabel = 'Touch ID';
          hardwareDescription = 'Apple Touch ID';
        } else {
          biometricType = 'FINGERPRINT';
          biometricLabel = 'Fingerprint';
          hardwareDescription = 'Android Biometric Fingerprint';
        }
      } else if (hasHardware && isEnrolled) {
        biometricType = 'PASSCODE';
        biometricLabel = Platform.OS === 'ios' ? 'iPhone Passcode' : 'Device PIN / Pattern';
        hardwareDescription = 'Screen Lock Enabled';
      }

      return {
        hasHardware,
        isEnrolled,
        biometricType,
        biometricLabel,
        hardwareDescription,
      };
    } catch (err) {
      console.warn('Error checking biometric capabilities:', err);
      return {
        hasHardware: false,
        isEnrolled: false,
        biometricType: 'NONE',
        biometricLabel: 'Device Passcode',
        hardwareDescription: 'Device Security',
      };
    }
  },

  /**
   * Get all persisted biometric & lock preferences.
   */
  async getSettings(): Promise<BiometricSettings> {
    const caps = await this.checkCapabilities();
    const enabledStr = await AsyncStorage.getItem(STORAGE_KEYS.ENABLED);
    const timeoutStr = await AsyncStorage.getItem(STORAGE_KEYS.TIMEOUT);

    const enabled = enabledStr === 'true';
    const timeoutMinutes = timeoutStr !== null ? parseInt(timeoutStr, 10) : 0;

    return {
      ...caps,
      enabled,
      timeoutMinutes: isNaN(timeoutMinutes) ? 0 : timeoutMinutes,
    };
  },

  /**
   * Set biometric lock enabled / disabled in storage.
   */
  async setEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ENABLED, enabled ? 'true' : 'false');
  },

  /**
   * Set auto-lock timeout in minutes.
   */
  async setTimeoutMinutes(minutes: number): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.TIMEOUT, minutes.toString());
  },

  /**
   * Record timestamp when app transitions to true background.
   */
  async recordBackgroundTimestamp(): Promise<void> {
    const now = Date.now();
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVE, now.toString());
  },

  /**
   * Clear background timestamp when app is unlocked.
   */
  async clearBackgroundTimestamp(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.LAST_ACTIVE);
  },

  /**
   * Determine if the app should trigger a lock screen based on elapsed time.
   */
  async shouldLock(): Promise<boolean> {
    const settings = await this.getSettings();
    if (!settings.enabled) return false;

    const lastActiveStr = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ACTIVE);
    if (!lastActiveStr) return false;

    if (settings.timeoutMinutes === 0) return true;

    const lastActiveTime = parseInt(lastActiveStr, 10);
    if (isNaN(lastActiveTime)) return false;

    const elapsedMinutes = (Date.now() - lastActiveTime) / (1000 * 60);
    return elapsedMinutes >= settings.timeoutMinutes;
  },

  /**
   * Force TrueDepth Face ID / Android BiometricPrompt camera/sensor scan.
   * Uses disableDeviceFallback: true on iOS so the native Face ID HUD camera scanner appears.
   */
  async authenticateBiometrics(promptMessage: string = 'Scan Face ID to Unlock GetAIPilot'): Promise<AuthResult> {
    try {
      if (Platform.OS === 'web') return { success: true };

      const caps = await this.checkCapabilities();
      if (!caps.hasHardware || !caps.isEnrolled) {
        // Fallback to passcode if device lacks enrolled biometrics
        return await this.authenticatePasscode(promptMessage);
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancel',
        disableDeviceFallback: true, // Forces TrueDepth Face ID Camera HUD on iOS!
      });

      const isCancelled = !result.success && (
        result.error === 'user_cancel' ||
        result.error === 'system_cancel' ||
        result.error === 'app_cancel'
      );

      return {
        success: result.success,
        error: result.success ? undefined : result.error,
        isCancelled,
      };
    } catch (err: any) {
      console.warn('Biometric authentication error:', err);
      // Fallback to passcode if biometrics throws an exception
      return await this.authenticatePasscode(promptMessage);
    }
  },

  /**
   * Trigger System Passcode Keypad / PIN Fallback.
   */
  async authenticatePasscode(promptMessage: string = 'Enter Device Passcode'): Promise<AuthResult> {
    try {
      if (Platform.OS === 'web') return { success: true };

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Use Device Passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      const isCancelled = !result.success && (
        result.error === 'user_cancel' ||
        result.error === 'system_cancel' ||
        result.error === 'app_cancel'
      );

      return {
        success: result.success,
        error: result.success ? undefined : result.error,
        isCancelled,
      };
    } catch (err: any) {
      console.warn('Passcode authentication error:', err);
      return { success: false, error: err?.message, isCancelled: false };
    }
  },

  /**
   * Primary unified authentication entry point.
   */
  async authenticate(promptMessage?: string, forcePasscode: boolean = false): Promise<boolean> {
    const defaultMsg = forcePasscode
      ? 'Enter Device Passcode to Unlock'
      : 'Scan Face ID to Unlock GetAIPilot';
    const msg = promptMessage || defaultMsg;

    if (forcePasscode) {
      const res = await this.authenticatePasscode(msg);
      return res.success;
    }

    const res = await this.authenticateBiometrics(msg);
    return res.success;
  },
};
