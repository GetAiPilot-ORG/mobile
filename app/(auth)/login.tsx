import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  useColorScheme,
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { isValidEmail } from '../../src/lib/validators';

const SAVE_LOGIN_KEY = '@gap_save_login_email';
const REMEMBER_ME_KEY = '@gap_save_login_enabled';
const brandLogo = require('../../assets/images/logo.jpg');

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [saveLoginInfo, setSaveLoginInfo] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  );

  // Load saved login info on mount
  useEffect(() => {
    (async () => {
      try {
        const savedEnabled = await AsyncStorage.getItem(REMEMBER_ME_KEY);
        if (savedEnabled !== null) {
          setSaveLoginInfo(savedEnabled === 'true');
        }
        if (savedEnabled !== 'false') {
          const savedEmail = await AsyncStorage.getItem(SAVE_LOGIN_KEY);
          if (savedEmail) {
            setIdentifier(savedEmail);
          }
        }
      } catch {}
    })();
  }, []);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  };

  const handleToggleSaveLogin = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    const nextState = !saveLoginInfo;
    setSaveLoginInfo(nextState);
    AsyncStorage.setItem(REMEMBER_ME_KEY, String(nextState)).catch(() => {});
    if (!nextState) {
      AsyncStorage.removeItem(SAVE_LOGIN_KEY).catch(() => {});
    }
  };

  const isFormValid = identifier.trim().length > 0 && (authMode === 'otp' || password.length > 0);

  const handleLogin = async () => {
    Keyboard.dismiss();
    setFeedback(null);
    const cleanIdentifier = identifier.trim();

    if (!cleanIdentifier) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      setFeedback({ type: 'error', message: 'Please enter your phone number or email.' });
      return;
    }

    if (authMode === 'password') {
      if (!password) {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
        setFeedback({ type: 'error', message: 'Please enter your password.' });
        return;
      }

      setLoading(true);
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanIdentifier,
          password: password,
        });

        if (error) throw error;

        // Persist email if save login info is enabled
        if (saveLoginInfo) {
          await AsyncStorage.setItem(SAVE_LOGIN_KEY, cleanIdentifier);
        } else {
          await AsyncStorage.removeItem(SAVE_LOGIN_KEY);
        }

        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      } catch (err: any) {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
        setFeedback({
          type: 'error',
          message: err.message || 'Incorrect email or password. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    } else {
      // Magic Link / OTP Mode
      if (!isValidEmail(cleanIdentifier)) {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
        setFeedback({ type: 'error', message: 'Please enter a valid email address for Magic Link.' });
        return;
      }

      setLoading(true);
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

      try {
        const { error } = await supabase.auth.signInWithOtp({
          email: cleanIdentifier,
          options: {
            emailRedirectTo: 'getaipilot://auth/callback',
          },
        });

        if (error) throw error;
        setFeedback({
          type: 'success',
          message: 'Magic login link sent to your inbox! Check your email to sign in.',
        });
      } catch (err: any) {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
        setFeedback({ type: 'error', message: err.message || 'Failed to send magic link.' });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, isDark && styles.containerDark]}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: Math.max(insets.top + 16, 44), paddingBottom: Math.max(insets.bottom + 24, 32) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Brand Logo Section */}
          <View style={styles.logoSection}>
            <View style={[styles.logoWrapper, isDark && styles.logoWrapperDark]}>
              <Image
                source={brandLogo}
                style={styles.logoImage}
                contentFit="cover"
                transition={200}
              />
            </View>
          </View>

          {/* Heading */}
          <Text style={[styles.heading, isDark && styles.headingDark]}>
            Log in with your phone{'\n'}number or account
          </Text>

          {/* Inline Feedback Banner */}
          {feedback && (
            <View
              style={[
                styles.feedbackBanner,
                feedback.type === 'error' ? styles.feedbackBannerError : styles.feedbackBannerSuccess,
              ]}
            >
              <Text
                style={[
                  styles.feedbackBannerText,
                  feedback.type === 'error' ? styles.feedbackErrorText : styles.feedbackSuccessText,
                ]}
              >
                {feedback.message}
              </Text>
            </View>
          )}

          {/* Grouped iOS Input Fields Card */}
          <View style={[styles.inputGroup, isDark && styles.inputGroupDark]}>
            {/* Field 1: Phone / Email */}
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.nativeInput, isDark && styles.nativeInputDark]}
                placeholder="Phone number or email"
                placeholderTextColor={isDark ? '#636366' : '#8E8E93'}
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
              />
              {identifier.length > 0 && (
                <Pressable
                  onPress={() => setIdentifier('')}
                  hitSlop={10}
                  style={styles.clearBtn}
                >
                  <Text style={styles.clearBtnText}>✕</Text>
                </Pressable>
              )}
            </View>

            {/* Hairline Divider */}
            {authMode === 'password' && (
              <View style={[styles.hairlineDivider, isDark && styles.hairlineDividerDark]} />
            )}

            {/* Field 2: Password */}
            {authMode === 'password' && (
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.nativeInput, { flex: 1 }, isDark && styles.nativeInputDark]}
                  placeholder="Password"
                  placeholderTextColor={isDark ? '#636366' : '#8E8E93'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                {password.length > 0 && (
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={8}
                    style={styles.eyeBtn}
                  >
                    <Text style={[styles.eyeBtnText, isDark && styles.eyeBtnTextDark]}>
                      {showPassword ? 'Hide' : 'Show'}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>

          {/* Save Login Info Checkbox Row */}
          <Pressable
            style={styles.saveLoginRow}
            onPress={handleToggleSaveLogin}
            hitSlop={6}
          >
            <View
              style={[
                styles.checkbox,
                saveLoginInfo && styles.checkboxActive,
                isDark && !saveLoginInfo && styles.checkboxDark,
              ]}
            >
              {saveLoginInfo && <Text style={styles.checkmarkIcon}>✓</Text>}
            </View>
            <Text style={[styles.saveLoginText, isDark && styles.saveLoginTextDark]}>
              Save login info
            </Text>
          </Pressable>

          {/* Primary Action Button ("Log in") */}
          <Pressable
            style={[
              styles.primaryButton,
              !isFormValid && styles.primaryButtonDisabled,
              loading && { opacity: 0.8 },
            ]}
            onPress={handleLogin}
            disabled={!isFormValid || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                style={[
                  styles.primaryButtonText,
                  !isFormValid && styles.primaryButtonTextDisabled,
                ]}
              >
                Log in
              </Text>
            )}
          </Pressable>

          {/* Secondary Action Button ("Create new account") */}
          <Pressable
            style={[styles.secondaryButton, isDark && styles.secondaryButtonDark]}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(auth)/signup' as any);
            }}
          >
            <Text style={[styles.secondaryButtonText, isDark && styles.secondaryButtonTextDark]}>
              Create new account
            </Text>
          </Pressable>

          {/* Footer Action Links: Forgot Password & Magic Link toggle */}
          <View style={styles.footerSection}>
            <Pressable
              onPress={() => {
                triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(auth)/forgot-password' as any);
              }}
              hitSlop={8}
            >
              <Text style={styles.forgotPasswordLink}>Forgot password?</Text>
            </Pressable>

            {/* Subtle OTP / Magic link mode toggle */}
            <Pressable
              style={styles.otpToggleBtn}
              onPress={() => {
                triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                setAuthMode(authMode === 'password' ? 'otp' : 'password');
                setFeedback(null);
              }}
              hitSlop={8}
            >
              <Text style={[styles.otpToggleText, isDark && styles.otpToggleTextDark]}>
                {authMode === 'password'
                  ? 'Sign in with Magic Link / OTP'
                  : 'Sign in with Password'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  containerDark: {
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'stretch',
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoWrapper: {
    width: 92,
    height: 92,
    borderRadius: 46,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  logoWrapperDark: {
    backgroundColor: '#1C1C1E',
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.4,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 46,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 31,
    letterSpacing: -0.6,
    marginBottom: 28,
  },
  headingDark: {
    color: '#FFFFFF',
  },
  feedbackBanner: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 18,
  },
  feedbackBannerError: {
    backgroundColor: '#FEE2E2',
  },
  feedbackBannerSuccess: {
    backgroundColor: '#DCFCE7',
  },
  feedbackBannerText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  feedbackErrorText: {
    color: '#DC2626',
  },
  feedbackSuccessText: {
    color: '#16A34A',
  },
  inputGroup: {
    backgroundColor: '#F2F4F7',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  inputGroupDark: {
    backgroundColor: '#1C1C1E',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 52,
  },
  nativeInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: '#000000',
    paddingVertical: 14,
  },
  nativeInputDark: {
    color: '#FFFFFF',
  },
  hairlineDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginLeft: 16,
  },
  hairlineDividerDark: {
    backgroundColor: '#2C2C2E',
  },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  clearBtnText: {
    fontSize: 10,
    color: '#4B5563',
    fontWeight: '800',
  },
  eyeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  eyeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  eyeBtnTextDark: {
    color: '#9CA3AF',
  },
  saveLoginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.8,
    borderColor: '#9CA3AF',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxDark: {
    borderColor: '#4B5563',
  },
  checkboxActive: {
    backgroundColor: '#0084FF',
    borderColor: '#0084FF',
  },
  checkmarkIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  saveLoginText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  saveLoginTextDark: {
    color: '#9CA3AF',
  },
  primaryButton: {
    backgroundColor: '#0084FF',
    paddingVertical: 15,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonDisabled: {
    backgroundColor: '#F2F4F7',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  primaryButtonTextDisabled: {
    color: '#9CA3AF',
  },
  secondaryButton: {
    backgroundColor: '#F2F4F7',
    paddingVertical: 15,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  secondaryButtonDark: {
    backgroundColor: '#1C1C1E',
  },
  secondaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  secondaryButtonTextDark: {
    color: '#FFFFFF',
  },
  footerSection: {
    alignItems: 'center',
    gap: 14,
  },
  forgotPasswordLink: {
    color: '#0084FF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  otpToggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  otpToggleText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  otpToggleTextDark: {
    color: '#9CA3AF',
  },
});
