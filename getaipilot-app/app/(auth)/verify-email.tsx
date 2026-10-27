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
import {
  Mail01Icon,
  CheckmarkCircle01Icon,
  Copy01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  SparklesIcon,
  ShieldCheckIcon,
} from '@hugeicons/core-free-icons';
import { Ionicons } from '@expo/vector-icons';

import { getColors, useTheme } from '@/theme';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/core/store/authStore';

const brandLogo = require('../../assets/images/icon.png');

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

  // Open default email app
  const handleOpenEmailApp = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (Platform.OS === 'ios') {
        const canOpenMessage = await Linking.canOpenURL('message:');
        if (canOpenMessage) {
          await Linking.openURL('message:');
          return;
        }
      }
      await Linking.openURL('mailto:');
    } catch (err) {
      console.warn('[VerifyEmail] Could not open mail client:', err);
    }
  };

  // Copy email to clipboard
  const handleCopyEmail = async () => {
    if (!displayEmail) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(displayEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Manual Check Confirmation Status
  const handleCheckStatus = async () => {
    if (isCheckingStatus) return;
    setIsCheckingStatus(true);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setFeedback(null);

    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;

      if (data?.user?.email_confirmed_at) {
        const { data: sessionData } = await supabase.auth.getSession();
        proceedToOnboarding(sessionData?.session || undefined);
      } else {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
        setFeedback({
          type: 'error',
          message: 'Your email has not been confirmed yet. Please check your inbox or spam folder and tap the link.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Unable to verify status. Please ensure you clicked the confirmation link.',
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Verify OTP code directly if typed (supports 8-digit and 6-digit codes)
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const targetCode = (codeToVerify || otpCode).trim();
    if (targetCode.length < 6 || isVerifyingOtp || !displayEmail) return;

    Keyboard.dismiss();
    setIsVerifyingOtp(true);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setFeedback(null);

    try {
      // 1. Try type: 'signup'
      let { data, error } = await supabase.auth.verifyOtp({
        email: displayEmail,
        token: targetCode,
        type: 'signup',
      });

      // 2. Fallback to 'email' type if signup token didn't match
      if (error) {
        const emailOtpRes = await supabase.auth.verifyOtp({
          email: displayEmail,
          token: targetCode,
          type: 'email',
        });
        if (!emailOtpRes.error) {
          data = emailOtpRes.data;
          error = null;
        }
      }

      if (error) throw error;

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
      const { error } = await supabase.auth.signInWithOtp({
        email: displayEmail,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        const resendRes = await supabase.auth.resend({
          type: 'signup',
          email: displayEmail,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });
        if (resendRes.error) throw resendRes.error;
      }

      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      setResendCooldown(60);
      setFeedback({
        type: 'success',
        message: 'A fresh confirmation email has been sent to your inbox.',
      });
    } catch (err: any) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      setFeedback({
        type: 'error',
        message: err.message || 'Could not resend email right now. Please try again shortly.',
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
              Check your inbox
            </Text>

            <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
              We sent a confirmation link to verify your email and activate your account.
            </Text>

            {/* Email Address Pill */}
            {displayEmail ? (
              <Pressable
                onPress={handleCopyEmail}
                style={[styles.emailPill, isDark && styles.emailPillDark]}
                android_ripple={{ color: 'rgba(37,99,235,0.1)' }}
              >
                <View style={styles.emailPillLeft}>
                  <HugeiconsIcon icon={Mail01Icon} size={16} color="#2563EB" strokeWidth={2} />
                  <Text
                    style={[styles.emailPillText, isDark && styles.emailPillTextDark]}
                    numberOfLines={1}
                  >
                    {displayEmail}
                  </Text>
                </View>
                <View style={styles.copyButton}>
                  <HugeiconsIcon
                    icon={copied ? CheckmarkCircle01Icon : Copy01Icon}
                    size={16}
                    color={copied ? '#10B981' : isDark ? '#94A3B8' : '#64748B'}
                    strokeWidth={2}
                  />
                  <Text style={[styles.copyLabel, copied && styles.copyLabelSuccess]}>
                    {copied ? 'Copied' : 'Copy'}
                  </Text>
                </View>
              </Pressable>
            ) : null}

            {/* Instruction Callout */}
            <View style={[styles.instructionBox, isDark && styles.instructionBoxDark]}>
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} color="#10B981" strokeWidth={2.4} />
              <Text style={[styles.instructionText, isDark && styles.instructionTextDark]}>
                Click the confirmation link inside your email to jump directly into onboarding.
              </Text>
            </View>

            {/* Feedback Banner */}
            {feedback && (
              <View
                style={[
                  styles.feedbackBanner,
                  feedback.type === 'error' ? styles.feedbackBannerError : styles.feedbackBannerSuccess,
                ]}
              >
                <Ionicons
                  name={feedback.type === 'error' ? 'alert-circle' : 'checkmark-circle'}
                  size={18}
                  color={feedback.type === 'error' ? '#EF4444' : '#10B981'}
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

            {/* Primary Action: Open Email App */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
              ]}
              onPress={handleOpenEmailApp}
            >
              <HugeiconsIcon icon={Mail01Icon} size={20} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.primaryButtonText}>Open Email App</Text>
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#FFFFFF" strokeWidth={2.4} />
            </TouchableOpacity>

            {/* Secondary Action: I've Already Confirmed */}
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                isDark && styles.secondaryButtonDark,
              ]}
              onPress={handleCheckStatus}
              disabled={isCheckingStatus}
            >
              {isCheckingStatus ? (
                <ActivityIndicator size="small" color={isDark ? '#60A5FA' : '#2563EB'} />
              ) : (
                <>
                  <Ionicons
                    name="refresh-outline"
                    size={18}
                    color={isDark ? '#93C5FD' : '#2563EB'}
                  />
                  <Text style={[styles.secondaryButtonText, isDark && styles.secondaryButtonTextDark]}>
                    I've Confirmed, Continue
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, isDark && styles.dividerLineDark]} />
              <Text style={[styles.dividerText, isDark && styles.dividerTextDark]}>
                OR ENTER 8-DIGIT CODE
              </Text>
              <View style={[styles.dividerLine, isDark && styles.dividerLineDark]} />
            </View>

            {/* 8-digit OTP verification option */}
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
                  placeholder="Enter 8-digit verification code"
                  placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
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
                />
                {otpCode.length >= 8 && (
                  <Pressable
                    style={styles.otpSubmitBtn}
                    onPress={() => handleVerifyOtp()}
                    disabled={isVerifyingOtp}
                  >
                    {isVerifyingOtp ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.otpSubmitBtnText}>Verify</Text>
                    )}
                  </Pressable>
                )}
              </View>
            </View>

            {/* Resend Link Section */}
            <View style={styles.resendSection}>
              <Text style={[styles.resendPromptText, isDark && styles.resendPromptTextDark]}>
                Didn't receive the email?
              </Text>
              <TouchableOpacity
                onPress={handleResend}
                disabled={resendCooldown > 0 || isResending}
                style={[
                  styles.resendButton,
                ]}
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
                      : 'Resend confirmation email'}
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

            <Pressable
              onPress={() => router.replace('/(auth)/login' as any)}
              style={styles.footerLink}
            >
              <Text style={[styles.footerLinkText, isDark && styles.footerLinkTextDark]}>
                Back to Sign In
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
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    height: 48,
  },
  otpInputWrapperDark: {
    borderColor: '#334155',
    backgroundColor: '#0F172A',
  },
  otpInputWrapperActive: {
    borderColor: '#2563EB',
  },
  otpInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    letterSpacing: 2,
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
