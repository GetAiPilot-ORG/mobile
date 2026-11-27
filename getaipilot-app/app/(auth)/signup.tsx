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
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import Mail01Icon from '@hugeicons/core-free-icons/Mail01Icon';
import CheckmarkCircle01Icon from '@hugeicons/core-free-icons/CheckmarkCircle01Icon';
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon';
import ArrowLeft01Icon from '@hugeicons/core-free-icons/ArrowLeft01Icon';

import { supabase } from '../../src/lib/supabase';
import { isValidEmail } from '../../src/lib/validators';
import { useAuthStore } from '../../src/core/store/authStore';
import { PhoneInputField } from '../../src/components/auth/PhoneInputField';
import { WhatsAppOtpVerification } from '../../src/components/auth/WhatsAppOtpVerification';
import { sendWhatsAppOtp, verifyWhatsAppOtp } from '../../src/lib/phoneAuthService';
import { useTheme, getColors } from '@/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { savePendingReferralCode, getPendingReferralCode } from '../../src/services/referralService';

const brandLogo = require('../../assets/images/icon.webp');

export default function SignupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ ref?: string; referral?: string }>();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const syncSession = useAuthStore((s) => s.syncSession);

  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneRaw, setPhoneRaw] = useState('');
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  );
  const [referralParam, setReferralParam] = useState<string | null>(null);

  useEffect(() => {
    const rawRef = params.ref || params.referral;
    if (rawRef) {
      const cleanRef = String(rawRef).trim().toUpperCase();
      savePendingReferralCode(cleanRef).then(() => {
        setReferralParam(cleanRef);
      });
    } else {
      getPendingReferralCode().then((code) => {
        if (code) setReferralParam(code);
      });
    }
  }, [params.ref, params.referral]);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  };

  const isFormValid =
    email.trim().length > 0 &&
    password.length >= 6;

  const handleSendPhoneOtp = async () => {
    Keyboard.dismiss();
    setFeedback(null);

    if (!isPhoneValid || !normalizedPhone) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      setFeedback({ type: 'error', message: 'Please enter a valid phone number.' });
      return;
    }

    setLoading(true);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    const res = await sendWhatsAppOtp(normalizedPhone, { mode: 'signup' });
    setLoading(false);

    if (!res.success) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      setFeedback({
        type: 'error',
        message: res.error || 'Failed to send verification code. Please try again.',
      });
    } else {
      setOtpSent(true);
      setFeedback(null);
    }
  };

  const handleVerifyPhoneOtp = async (code: string) => {
    Keyboard.dismiss();
    setFeedback(null);
    setLoading(true);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    const res = await verifyWhatsAppOtp(normalizedPhone, code);
    if (!res.success) {
      setLoading(false);
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      setFeedback({
        type: 'error',
        message: res.error || 'Invalid verification code. Please try again.',
      });
      return;
    }

    try {
      if (res.session) {
        await syncSession(res.session);
      }
      setLoading(false);
      const isOnboarded = useAuthStore.getState().onboardingCompleted;
      if (isOnboarded === false) {
        router.replace('/onboarding' as any);
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setLoading(false);
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to complete sign up. Please try again.',
      });
    }
  };

  const handleSignup = async () => {
    Keyboard.dismiss();
    setFeedback(null);
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      setFeedback({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }
    if (!password || password.length < 6) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      setFeedback({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }

    setLoading(true);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // 1. Pre-check email uniqueness (matching bot-dashboard)
      try {
        const { data: emailExists } = await supabase.rpc('check_email_exists', {
          email_to_check: cleanEmail,
        });
        if (emailExists) {
          setLoading(false);
          triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
          setFeedback({
            type: 'error',
            message: 'An account with this email already exists. Please sign in or reset your password.',
          });
          return;
        }
      } catch {
        // Non-blocking fallback if RPC is unavailable
      }

      const redirectUrl = Linking.createURL('/(auth)/callback');
      const fullName = cleanEmail.split('@')[0];
      const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';

      if (isMobile) {
        // Mobile device flow (iOS/Android): Save password temporarily to apply upon OTP verification
        if (password) {
          await AsyncStorage.setItem(`@gap_reg_pwd_${cleanEmail}`, password);
        }

        // Trigger OTP email (Supabase routes to getaipilot_confirm_email_otp template!)
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            shouldCreateUser: true,
            emailRedirectTo: redirectUrl,
            data: {
              username: fullName,
              full_name: fullName,
              platform: Platform.OS,
              device_os: Platform.OS,
              is_mobile: true,
              signup_source: 'mobile_app',
              client_source: 'getaipilot_mobile',
              template: 'getaipilot_confirm_email_otp',
              template_key: 'getaipilot_confirm_email_otp',
            },
          },
        });

        if (otpError) throw otpError;

        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

        // Navigate directly to verify-email screen with mobile OTP flow
        router.replace({
          pathname: '/(auth)/verify-email',
          params: { email: cleanEmail, fromSignup: 'true' },
        } as any);
      } else {
        // Web device flow: Standard signUp with email confirmation link
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              username: fullName,
              full_name: fullName,
              platform: 'web',
              device_os: 'web',
              is_mobile: false,
              signup_source: 'web',
              client_source: 'getaipilot_web',
            },
          },
        });

        if (error) throw error;

        // Supabase returns empty identities array if user already registered
        if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
          setFeedback({
            type: 'error',
            message: 'An account with this email already exists. Please sign in or reset your password.',
          });
          return;
        }

        // Clear unverified local session so user must verify email before onboarding
        await supabase.auth.signOut({ scope: 'local' }).catch(() => { });

        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

        router.replace({
          pathname: '/(auth)/verify-email',
          params: { email: cleanEmail },
        } as any);
      }
    } catch (err: any) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to create account. Please try again.',
      });
    } finally {
      setLoading(false);
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
            <View style={styles.logoWrapper}>
              <Image
                source={brandLogo}
                style={styles.logoImage}
                contentFit="contain"
                transition={200}
              />
            </View>
          </View>

          {/* Heading */}
          <Text style={[styles.heading, isDark && styles.headingDark]}>
            Create your GetAiPilot{'\n'}account
          </Text>

          {/* Referral Welcome Banner */}
          {referralParam ? (
            <View style={[styles.referralBanner, isDark && styles.referralBannerDark]}>
              <View style={styles.referralBannerIconWrap}>
                <Ionicons name="gift" size={18} color="#10B981" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.referralBannerTitle, isDark && styles.referralBannerTitleDark]}>
                  5% Welcome Discount Applied!
                </Text>
                <Text style={[styles.referralBannerSub, isDark && styles.referralBannerSubDark]}>
                  Invited by partner <Text style={styles.referralCodeHighlight}>{referralParam}</Text>
                </Text>
              </View>
            </View>
          ) : null}

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

          {/* Authentication Method Selector: [ Email ] [ WhatsApp OTP ] */}
          {!otpSent && (
            <View style={[styles.methodSwitcher, isDark && styles.methodSwitcherDark]}>
              <Pressable
                style={[
                  styles.methodTab,
                  authMethod === 'email' &&
                    (isDark ? styles.methodTabActiveDark : styles.methodTabActive),
                ]}
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                  setAuthMethod('email');
                  setFeedback(null);
                }}
              >
                <Ionicons
                  name="mail-outline"
                  size={15}
                  color={
                    authMethod === 'email'
                      ? isDark
                        ? '#FFFFFF'
                        : '#17171C'
                      : isDark
                      ? '#9CA3AF'
                      : '#6B7280'
                  }
                />
                <Text
                  style={[
                    styles.methodTabText,
                    isDark && styles.methodTabTextDark,
                    authMethod === 'email' &&
                      (isDark ? styles.methodTabTextActiveDark : styles.methodTabTextActive),
                  ]}
                >
                  Email
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.methodTab,
                  authMethod === 'phone' &&
                    (isDark ? styles.methodTabActiveDark : styles.methodTabActive),
                ]}
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                  setAuthMethod('phone');
                  setFeedback(null);
                }}
              >
                <Ionicons
                  name="logo-whatsapp"
                  size={15}
                  color={
                    authMethod === 'phone'
                      ? '#059669'
                      : isDark
                      ? '#9CA3AF'
                      : '#6B7280'
                  }
                />
                <Text
                  style={[
                    styles.methodTabText,
                    isDark && styles.methodTabTextDark,
                    authMethod === 'phone' &&
                      (isDark ? styles.methodTabTextActiveDark : styles.methodTabTextActive),
                  ]}
                >
                  WhatsApp OTP
                </Text>
              </Pressable>
            </View>
          )}

          {otpSent ? (
            <WhatsAppOtpVerification
              phone={normalizedPhone}
              onVerify={handleVerifyPhoneOtp}
              onResend={handleSendPhoneOtp}
              onChangePhone={() => {
                setOtpSent(false);
                setFeedback(null);
              }}
              loading={loading}
              isDark={isDark}
              buttonLabel="Verify & Create Account"
            />
          ) : authMethod === 'phone' ? (
            <>
              <View style={{ marginBottom: 10 }}>
                <PhoneInputField
                  value={phoneRaw}
                  onChange={(raw, normalized, isValid) => {
                    setPhoneRaw(raw);
                    setNormalizedPhone(normalized);
                    setIsPhoneValid(isValid);
                    if (feedback) setFeedback(null);
                  }}
                  disabled={loading}
                  isDark={isDark}
                  placeholderColor={isDark ? '#636366' : '#8E8E93'}
                  onSubmitEditing={handleSendPhoneOtp}
                />
              </View>

              <View style={styles.whatsappHintRow}>
                <Ionicons
                  name="logo-whatsapp"
                  size={14}
                  color={isDark ? '#34D399' : '#059669'}
                />
                <Text style={[styles.whatsappHintText, isDark && styles.whatsappHintTextDark]}>
                  We'll send a 6-digit verification code to your WhatsApp.
                </Text>
              </View>

              <Text style={[styles.termsText, isDark && styles.termsTextDark]}>
                By signing up, you agree to GetAiPilot's{' '}
                <Text style={styles.termsHighlight}>Terms of Service</Text> and{' '}
                <Text style={styles.termsHighlight}>Privacy Policy</Text>.
              </Text>

              <Pressable
                style={[
                  styles.primaryButton,
                  !isPhoneValid && styles.primaryButtonDisabled,
                  loading && { opacity: 0.8 },
                ]}
                onPress={handleSendPhoneOtp}
                disabled={!isPhoneValid || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text
                    style={[
                      styles.primaryButtonText,
                      !isPhoneValid && styles.primaryButtonTextDisabled,
                    ]}
                  >
                    Sign up with WhatsApp
                  </Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
          {/* Grouped iOS Input Fields Card */}
          <View style={[styles.inputGroup, isDark && styles.inputGroupDark]}>
            {/* Field 1: Email Address */}
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.nativeInput, isDark && styles.nativeInputDark]}
                placeholder="Email address"
                placeholderTextColor={isDark ? '#636366' : '#8E8E93'}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
              />
              {email.length > 0 && (
                <Pressable
                  onPress={() => setEmail('')}
                  hitSlop={10}
                  style={styles.clearBtn}
                >
                  <Ionicons name="close-circle" size={16} color={isDark ? '#6B7280' : '#9CA3AF'} />
                </Pressable>
              )}
            </View>

            <View style={[styles.hairlineDivider, isDark && styles.hairlineDividerDark]} />

            {/* Field 2: Password */}
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.nativeInput, { flex: 1 }, isDark && styles.nativeInputDark]}
                placeholder="Choose password (min 6 chars)"
                placeholderTextColor={isDark ? '#636366' : '#8E8E93'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleSignup}
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
          </View>

          {/* Terms Note */}
          <Text style={[styles.termsText, isDark && styles.termsTextDark]}>
            By signing up, you agree to GetAiPilot's{' '}
            <Text style={styles.termsHighlight}>Terms of Service</Text> and{' '}
            <Text style={styles.termsHighlight}>Privacy Policy</Text>.
          </Text>

          {/* Primary Action Button ("Create account") */}
          <Pressable
            style={[
              styles.primaryButton,
              !isFormValid && styles.primaryButtonDisabled,
              loading && { opacity: 0.8 },
            ]}
            onPress={handleSignup}
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
                Create account
              </Text>
            )}
          </Pressable>
            </>
          )}

          {/* Secondary Action Button ("Log in instead") */}
          <Pressable
            style={[styles.secondaryButton, isDark && styles.secondaryButtonDark]}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(auth)/login' as any);
            }}
          >
            <Text style={[styles.secondaryButtonText, isDark && styles.secondaryButtonTextDark]}>
              Already have an account? Log in
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3FB',
  },
  containerDark: {
    backgroundColor: '#14131B',
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
    justifyContent: 'center',
    marginBottom: 20,
    width: '100%',
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  logoImage: {
    width: 80,
    height: 80,
    backgroundColor: 'transparent',
  },
  heading: {
    fontSize: 24,
    fontWeight: '600',
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
    borderRadius: 24,
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
    backgroundColor: '#F0EEF8',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  inputGroupDark: {
    backgroundColor: '#252230',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  nativeInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    padding: 0,
    fontWeight: '400',
  },
  nativeInputDark: {
    color: '#FFFFFF',
  },
  hairlineDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E2DFEC',
    marginLeft: 16,
  },
  hairlineDividerDark: {
    backgroundColor: '#383446',
  },
  clearBtn: {
    paddingLeft: 8,
  },
  eyeBtn: {
    paddingLeft: 8,
  },
  eyeBtnText: {
    fontSize: 14,
    color: '#0A84FF',
    fontWeight: '500',
  },
  eyeBtnTextDark: {
    color: '#0A84FF',
  },
  termsText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  termsTextDark: {
    color: '#636366',
  },
  termsHighlight: {
    color: '#0A84FF',
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    height: 50,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
    gap: 8,
  },
  primaryButtonDisabled: {
    backgroundColor: '#E2DFEC',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  primaryButtonTextDisabled: {
    color: '#AEAEB2',
  },
  secondaryButton: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  secondaryButtonDark: {
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  secondaryButtonTextDark: {
    color: '#FFFFFF',
  },

  /* Verification Card Styles */
  verifyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    marginBottom: 16,
  },
  verifyCardDark: {
    backgroundColor: '#1E1C27',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  verifyIconBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  verifyIconBadgeDark: {
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
  },
  verifyBodyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  verifyBodyTextDark: {
    color: '#94A3B8',
  },
  verifyEmailHighlight: {
    fontWeight: '700',
    color: '#0F172A',
  },
  verifyEmailHighlightDark: {
    color: '#F8FAFC',
  },
  infoCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginBottom: 16,
  },
  infoCalloutDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  infoCalloutText: {
    flex: 1,
    fontSize: 12,
    color: '#065F46',
    lineHeight: 17,
    fontWeight: '500',
  },
  infoCalloutTextDark: {
    color: '#A7F3D0',
  },
  resendButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  resendButtonDark: {},
  resendButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  resendButtonTextDark: {
    color: '#60A5FA',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 4,
  },
  backBtnText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  backBtnTextDark: {
    color: '#94A3B8',
  },
  referralBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  referralBannerDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.28)',
  },
  referralBannerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  referralBannerTitleDark: {
    color: '#34D399',
  },
  referralBannerSub: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
  },
  referralBannerSubDark: {
    color: '#A7F3D0',
  },
  referralCodeHighlight: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '800',
  },
  methodSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#EAE7F5',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  methodSwitcherDark: {
    backgroundColor: '#1F1C29',
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 11,
  },
  methodTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  methodTabActiveDark: {
    backgroundColor: '#2C283A',
  },
  methodTabText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#6B7280',
  },
  methodTabTextDark: {
    color: '#9CA3AF',
  },
  methodTabTextActive: {
    color: '#17171C',
    fontWeight: '600',
  },
  methodTabTextActiveDark: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  whatsappHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  whatsappHintText: {
    fontSize: 12.5,
    color: '#6B7280',
    flex: 1,
  },
  whatsappHintTextDark: {
    color: '#9CA3AF',
  },
});
