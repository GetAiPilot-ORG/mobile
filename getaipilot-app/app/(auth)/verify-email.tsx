import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  AppState,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { HugeiconsIcon } from '@hugeicons/react-native';
import Mail01Icon from '@hugeicons/core-free-icons/Mail01Icon';
import CheckmarkCircle01Icon from '@hugeicons/core-free-icons/CheckmarkCircle01Icon';
import Copy01Icon from '@hugeicons/core-free-icons/Copy01Icon';
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon';
import ArrowLeft01Icon from '@hugeicons/core-free-icons/ArrowLeft01Icon';
import SparklesIcon from '@hugeicons/core-free-icons/SparklesIcon';
import ShieldCheckIcon from '@hugeicons/core-free-icons/ShieldCheckIcon';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getColors, useTheme } from '@/theme';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/core/store/authStore';

const brandLogo = require('../../assets/images/icon.webp');

export default function VerifyEmailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const syncSession = useAuthStore((s) => s.syncSession);

  const params = useLocalSearchParams<{ email?: string }>();
  const [displayEmail, setDisplayEmail] = useState((params.email || '').trim().toLowerCase());

  useEffect(() => {
    if (!displayEmail) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user?.email) {
          setDisplayEmail(data.user.email.toLowerCase());
        }
      }).catch(() => { });
    }
  }, [displayEmail]);

  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Pulse ring animations
  const pulseAnim1 = useRef(new Animated.Value(0)).current;
  const pulseAnim2 = useRef(new Animated.Value(0)).current;
  const scaleIconAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current; // Fade-in for subtitle

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  };

  // Start animated pulse rings for email icon
  useEffect(() => {
    const createPulse = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim, {
              toValue: 1,
              duration: 2400,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const pulse1 = createPulse(pulseAnim1, 0);
    const pulse2 = createPulse(pulseAnim2, 1200);

    pulse1.start();
    pulse2.start();

    return () => {
      pulse1.stop();
      pulse2.stop();
    };
  }, [pulseAnim1, pulseAnim2]);

  // Fade-in animation for subtitle text
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const isNavigatingRef = useRef(false);

  // Navigate to onboarding strictly once verified
  const proceedToOnboarding = (session?: any) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setFeedback({
      type: 'success',
      message: 'Email confirmed! Directing you to complete your profile...',
    });

    Animated.sequence([
      Animated.timing(scaleIconAnim, { toValue: 1.15, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleIconAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    if (session) {
      syncSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        user: session.user,
      });
    }

    useAuthStore.getState().setOnboardingCompleted(false);

    setTimeout(() => {
      router.replace('/onboarding' as any);
    }, 800);
  };

  // Background auth listener (ONLY proceeds if user email is actually confirmed)
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user?.email_confirmed_at) {
        proceedToOnboarding(session);
      }
    });

    // Check status automatically when returning to app from email client
    const appStateSub = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active') {
        try {
          const { data } = await supabase.auth.getUser();
          if (data?.user?.email_confirmed_at) {
            const { data: sessionData } = await supabase.auth.getSession();
            proceedToOnboarding(sessionData?.session || undefined);
          }
        } catch {
          // Non-blocking check
        }
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
      appStateSub.remove();
    };
  }, []);


  // Copy email to clipboard
  const handleCopyEmail = async () => {
    if (!displayEmail) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(displayEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };


  // Verify OTP code directly if typed (supports 8-digit and 6-digit codes)
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const targetCode = (codeToVerify || otpCode).trim();
    if (targetCode.length < 8 || isVerifyingOtp || !displayEmail) return;

    Keyboard.dismiss();
    setIsVerifyingOtp(true);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setFeedback(null);

    try {
      // 1. Try 'email' type first (primary for mobile signInWithOtp)
      let { data, error } = await supabase.auth.verifyOtp({
        email: displayEmail,
        token: targetCode,
        type: 'email',
      });

      // 2. Fallback to 'signup' type (primary for web signUp)
      if (error) {
        const signupRes = await supabase.auth.verifyOtp({
          email: displayEmail,
          token: targetCode,
          type: 'signup',
        });
        if (!signupRes.error) {
          data = signupRes.data;
          error = null;
        }
      }

      if (error) throw error;

      // 3. Apply password set during mobile signup if available
      try {
        const savedPwd = await AsyncStorage.getItem(`@gap_reg_pwd_${displayEmail}`);
        if (savedPwd) {
          await supabase.auth.updateUser({ password: savedPwd });
          await AsyncStorage.removeItem(`@gap_reg_pwd_${displayEmail}`);
        }
      } catch (pwdErr) {
        console.warn('[VerifyEmail] Error applying registration password:', pwdErr);
      }

      if (data?.session) {
        proceedToOnboarding(data.session);
      } else {
        const { data: sessionData } = await supabase.auth.getSession();
        proceedToOnboarding(sessionData?.session || undefined);
      }
    } catch (err: any) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      setFeedback({
        type: 'error',
        message: err.message || 'Invalid or expired verification code. Please check and try again.',
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Resend confirmation email
  const handleResend = async () => {
    if (resendCooldown > 0 || isResending || !displayEmail) return;
    setIsResending(true);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setFeedback(null);

    try {
      const redirectUrl = Linking.createURL('/(auth)/callback');
      const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';

      if (isMobile) {
        const { error } = await supabase.auth.signInWithOtp({
          email: displayEmail,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              platform: Platform.OS,
              device_os: Platform.OS,
              is_mobile: true,
              signup_source: 'mobile_app',
              client_source: 'getaipilot_mobile',
            },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: displayEmail,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });
        if (error) throw error;
      }

      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      setResendCooldown(60);
      setFeedback({
        type: 'success',
        message: 'A fresh 6-digit verification code has been sent to your email.',
      });
    } catch (err: any) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      setFeedback({
        type: 'error',
        message: err.message || 'Could not resend code right now. Please try again shortly.',
      });
    } finally {
      setIsResending(false);
    }
  };

  const ringScale1 = pulseAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.45],
  });
  const ringOpacity1 = pulseAnim1.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0.45, 0.25, 0],
  });

  const ringScale2 = pulseAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.45],
  });
  const ringOpacity2 = pulseAnim2.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0.45, 0.25, 0],
  });

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

          {/* Verification Main Card */}
          <View style={[styles.card, isDark && styles.cardDark]}>
            {/* Animated Pulse Badge */}
            <View style={styles.iconContainer}>
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    transform: [{ scale: ringScale1 }],
                    opacity: ringOpacity1,
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    transform: [{ scale: ringScale2 }],
                    opacity: ringOpacity2,
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.iconBadge,
                  isDark && styles.iconBadgeDark,
                  { transform: [{ scale: scaleIconAnim }] },
                ]}
              >
                <HugeiconsIcon icon={Mail01Icon} size={36} color="#2563EB" strokeWidth={2} />
              </Animated.View>
            </View>

            <Text style={[styles.title, isDark && styles.titleDark]}>
              Verify your email
            </Text>

            {/* Instruction */}
            <Animated.Text style={[styles.subtitle, isDark && styles.subtitleDark, { opacity: fadeAnim }]}>
              Enter the verification code sent to your email:
            </Animated.Text>

            {/* Email Pill with Copy */}
            {Boolean(displayEmail) && (
              <View style={[styles.emailPill, isDark && styles.emailPillDark]}>
                <View style={styles.emailPillLeft}>
                  <HugeiconsIcon icon={Mail01Icon} size={16} color={isDark ? '#94A3B8' : '#64748B'} strokeWidth={2} />
                  <Text numberOfLines={1} style={[styles.emailPillText, isDark && styles.emailPillTextDark]}>
                    {displayEmail}
                  </Text>
                </View>
                <Pressable onPress={handleCopyEmail} style={styles.copyButton} hitSlop={8}>
                  {copied ? (
                    <>
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} color="#10B981" strokeWidth={2.5} />
                      <Text style={[styles.copyLabel, styles.copyLabelSuccess]}>Copied</Text>
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={Copy01Icon} size={14} color={isDark ? '#94A3B8' : '#64748B'} strokeWidth={2} />
                      <Text style={styles.copyLabel}>Copy</Text>
                    </>
                  )}
                </Pressable>
              </View>
            )}

            {/* Inline Feedback Banner */}
            {feedback && (
              <View
                style={[
                  styles.feedbackBanner,
                  feedback.type === 'error' ? styles.feedbackBannerError : styles.feedbackBannerSuccess,
                ]}
              >
                <HugeiconsIcon
                  icon={feedback.type === 'error' ? Mail01Icon : CheckmarkCircle01Icon}
                  size={16}
                  color={feedback.type === 'error' ? '#DC2626' : '#15803D'}
                  strokeWidth={2}
                />
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

            {/* 6-Digit OTP Verification Section */}
            <View style={styles.otpSection}>
              <View
                style={[
                  styles.otpInputWrapper,
                  isDark && styles.otpInputWrapperDark,
                  otpCode.length > 0 && styles.otpInputWrapperActive,
                ]}
              >
                <TextInput
                  style={[styles.otpInput, isDark && styles.otpInputDark]}
                  placeholder="• • • • • • • •"
                  placeholderTextColor={isDark ? '#475569' : '#CBD5E1'}
                  value={otpCode}
                  onChangeText={(val) => {
                    const clean = val.replace(/\D/g, '').slice(0, 8);
                    setOtpCode(clean);
                    if (clean.length === 8) {
                      handleVerifyOtp(clean);
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={8}
                  editable={!isVerifyingOtp}
                  autoFocus={true}
                />
              </View>
            </View>

            {/* Primary Action Button ("Verify Code") */}
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
                otpCode.length < 8 && { opacity: 0.6 },
              ]}
              onPress={() => handleVerifyOtp()}
              disabled={otpCode.length < 8 || isVerifyingOtp}
            >
              {isVerifyingOtp ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Verify Code</Text>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#FFFFFF" strokeWidth={2.5} />
                </>
              )}
            </Pressable>


            {/* Resend Link Section */}
            <View style={styles.resendSection}>
              <Text style={[styles.resendPromptText, isDark && styles.resendPromptTextDark]}>
                Didn't receive the code?
              </Text>
              <TouchableOpacity
                onPress={handleResend}
                disabled={resendCooldown > 0 || isResending}
                style={styles.resendButton}
              >
                {isResending ? (
                  <ActivityIndicator size="small" color="#2563EB" />
                ) : (
                  <Text
                    style={[
                      styles.resendButtonText,
                      resendCooldown > 0 && styles.resendButtonTextDisabled,
                    ]}
                  >
                    {resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : 'Resend verification code'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Navigation Links Footer */}
          <View style={styles.footerRow}>
            <Pressable
              onPress={() => router.replace('/(auth)/signup' as any)}
              style={styles.footerLink}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} color={isDark ? '#94A3B8' : '#64748B'} strokeWidth={2} />
              <Text style={[styles.footerLinkText, isDark && styles.footerLinkTextDark]}>
                Wrong email? Sign Up again
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  containerDark: {
    backgroundColor: '#0A0D14',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoWrapper: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  logoImage: {
    width: 44,
    height: 44,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 0.1,
    borderColor: '#E2E8F0',
  },
  cardDark: {
    backgroundColor: '#121824',
    borderColor: '#1E293B',
    shadowOpacity: 0.35,
  },
  iconContainer: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(37,99,235,0.22)',
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeDark: {
    backgroundColor: 'rgba(37,99,235,0.18)',
    borderColor: 'rgba(59,130,246,0.35)',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  titleDark: {
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitleDark: {
    color: '#94A3B8',
  },
  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emailPillDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  emailPillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  emailPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    flexShrink: 1,
  },
  emailPillTextDark: {
    color: '#F1F5F9',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  copyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  copyLabelSuccess: {
    color: '#10B981',
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 12,
    width: '100%',
    marginBottom: 16,
  },
  instructionBoxDark: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderColor: 'rgba(16,185,129,0.25)',
  },
  instructionText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#065F46',
    fontWeight: '500',
  },
  instructionTextDark: {
    color: '#A7F3D0',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  feedbackBannerError: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  feedbackBannerSuccess: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  feedbackBannerText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
  },
  feedbackErrorText: {
    color: '#DC2626',
    fontWeight: '500',
  },
  feedbackSuccessText: {
    color: '#15803D',
    fontWeight: '500',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    height: 50,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 10,
  },
  primaryButtonPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.92,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 46,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 16,
  },
  secondaryButtonDark: {
    backgroundColor: 'rgba(37,99,235,0.12)',
    borderColor: 'rgba(59,130,246,0.3)',
  },
  secondaryButtonPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.85,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  secondaryButtonTextDark: {
    color: '#93C5FD',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerLineDark: {
    backgroundColor: '#1E293B',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  dividerTextDark: {
    color: '#64748B',
  },
  otpSection: {
    width: '100%',
    marginBottom: 16,
  },
  otpInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    height: 54,
  },
  otpInputWrapperDark: {
    borderColor: '#334155',
    backgroundColor: '#0F172A',
  },
  otpInputWrapperActive: {
    borderColor: '#2563EB',
    backgroundColor: '#FFFFFF',
  },
  otpInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  otpInputDark: {
    color: '#F8FAFC',
  },
  otpSubmitBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  otpSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  resendSection: {
    alignItems: 'center',
    paddingTop: 4,
  },
  resendPromptText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  resendPromptTextDark: {
    color: '#94A3B8',
  },
  resendButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  resendButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  resendButtonTextDisabled: {
    color: '#94A3B8',
    fontWeight: '500',
  },
  footerRow: {
    width: '100%',
    maxWidth: 440,
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  footerLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  footerLinkTextDark: {
    color: '#94A3B8',
  },
});
