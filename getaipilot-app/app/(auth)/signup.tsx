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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Mail01Icon,
  CheckmarkCircle01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
} from '@hugeicons/core-free-icons';

import { supabase } from '../../src/lib/supabase';
import { isValidEmail } from '../../src/lib/validators';
import { useAuthStore } from '../../src/core/store/authStore';
import { useTheme, getColors } from '@/theme';

const brandLogo = require('../../assets/images/icon.png');

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const syncSession = useAuthStore((s) => s.syncSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  );

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  };

  const isFormValid =
    email.trim().length > 0 &&
    password.length >= 6;

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

      // 2. Execute Supabase signup with deep link redirect for magic confirmation
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: fullName,
            full_name: fullName,
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

      // 2. Clear unverified local session so user must verify email before onboarding
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});

      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

      // 4. Navigate directly to verify-email screen
      router.replace({
        pathname: '/(auth)/verify-email',
        params: { email: cleanEmail },
      } as any);
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
});
