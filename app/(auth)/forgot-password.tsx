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
} from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { colors } from '../../src/theme/colors';
import { isValidEmail } from '../../src/lib/validators';
import { useRouter } from 'expo-router';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  );

  const handleReset = async () => {
    setFeedback(null);
    const cleanEmail = email.trim();

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      setFeedback({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: 'getaipilot://auth/reset-password',
      });

      if (error) throw error;
      setFeedback({
        type: 'success',
        message: 'Password reset instructions have been sent to your email.',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to send reset email. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>🔑</Text>
          </View>
          <Text style={styles.brandTitle}>Reset Password</Text>
          <Text style={styles.brandSubtitle}>
            Enter your account email to receive reset instructions
          </Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Feedback banner */}
          {feedback && (
            <View
              style={[
                styles.feedbackBox,
                feedback.type === 'error' ? styles.feedbackError : styles.feedbackSuccess,
              ]}
            >
              <Text
                style={[
                  styles.feedbackText,
                  feedback.type === 'error'
                    ? { color: colors.destructive }
                    : { color: colors.success },
                ]}
              >
                {feedback.message}
              </Text>
            </View>
          )}

          <Text style={styles.inputLabel}>Account Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@company.com"
            placeholderTextColor={colors.mutedForeground}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />

          <Pressable
            style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            onPress={handleReset}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryBtnText}>Send Reset Link →</Text>
            )}
          </Pressable>

          <View style={styles.backFooter}>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.backLink}>← Back to Sign In</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
    justifyContent: 'center',
    minHeight: '100%',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoBadgeText: {
    fontSize: 24,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.foreground,
  },
  brandSubtitle: {
    fontSize: 13,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  feedbackBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
  },
  feedbackError: {
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    borderColor: 'rgba(220, 38, 38, 0.25)',
  },
  feedbackSuccess: {
    backgroundColor: 'rgba(22, 184, 130, 0.1)',
    borderColor: 'rgba(22, 184, 130, 0.3)',
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.foreground,
    marginBottom: 14,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  backFooter: {
    alignItems: 'center',
    marginTop: 18,
  },
  backLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});
