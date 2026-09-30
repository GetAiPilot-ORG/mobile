import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { isValidEmail } from '../../src/lib/validators';
import { useTheme, getColors } from '@/theme';

const brandLogo = require('../../assets/images/logo.jpg');

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  );

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  };

  const isFormValid = email.trim().length > 0 && isValidEmail(email.trim());

  const handleReset = async () => {
    Keyboard.dismiss();
    setFeedback(null);
    const cleanEmail = email.trim();

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      setFeedback({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    setLoading(true);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: 'getaipilot://auth/reset-password',
      });

      if (error) throw error;

      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      setFeedback({
        type: 'success',
        message: 'Password reset instructions have been sent to your email. Check your inbox!',
      });
    } catch (err: any) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to send reset email. Please try again.',
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
            Reset your account{'\n'}password
          </Text>
          <Text style={[styles.subheading, isDark && styles.subheadingDark]}>
            Enter the email associated with your GetAiPilot account and we'll send you reset instructions.
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
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.nativeInput, isDark && styles.nativeInputDark]}
                placeholder="Account email address"
                placeholderTextColor={isDark ? '#636366' : '#8E8E93'}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="done"
                onSubmitEditing={handleReset}
              />
              {email.length > 0 && (
                <Pressable
                  onPress={() => setEmail('')}
                  hitSlop={10}
                  style={styles.clearBtn}
                >
                  <Text style={styles.clearBtnText}>✕</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Primary Action Button ("Send reset instructions") */}
          <Pressable
            style={[
              styles.primaryButton,
              !isFormValid && styles.primaryButtonDisabled,
              loading && { opacity: 0.8 },
            ]}
            onPress={handleReset}
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
                Send reset link
              </Text>
            )}
          </Pressable>

          {/* Secondary Action Button ("Back to Log in") */}
          <Pressable
            style={[styles.secondaryButton, isDark && styles.secondaryButtonDark]}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Text style={[styles.secondaryButtonText, isDark && styles.secondaryButtonTextDark]}>
              Back to Log in
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
    marginBottom: 8,
  },
  headingDark: {
    color: '#FFFFFF',
  },
  subheading: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  subheadingDark: {
    color: '#9CA3AF',
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
    marginBottom: 20,
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
});
