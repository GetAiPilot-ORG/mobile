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

export default function SignupScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  );

  const handleSignup = async () => {
    setFeedback(null);
    const cleanEmail = email.trim();
    const cleanName = fullName.trim();

    if (!cleanName) {
      setFeedback({ type: 'error', message: 'Please enter your full name.' });
      return;
    }
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      setFeedback({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }
    if (!password || password.length < 6) {
      setFeedback({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            full_name: cleanName,
          },
        },
      });

      if (error) throw error;

      if (data?.session) {
        // Automatically signed in!
        setFeedback({
          type: 'success',
          message: 'Account created successfully! Redirecting...',
        });
      } else {
        // Email confirmation required
        setFeedback({
          type: 'success',
          message:
            'Account created! We have sent a confirmation link to your email. Please verify to activate.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to create account. Please try again.',
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
            <Text style={styles.logoBadgeText}>G</Text>
          </View>
          <Text style={styles.brandTitle}>Join GetAIPilot</Text>
          <Text style={styles.brandSubtitle}>
            Unlock enterprise AI bots, voice agents & WhatsApp automation
          </Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create Account</Text>
          <Text style={styles.cardSubtitle}>Get started with your 7-day free access</Text>

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

          {/* Full Name */}
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Shweta / Company Name"
            placeholderTextColor={colors.mutedForeground}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />

          {/* Email */}
          <Text style={styles.inputLabel}>Email Address</Text>
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

          {/* Password */}
          <Text style={styles.inputLabel}>Choose Password</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Minimum 6 characters"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable
              style={styles.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={8}
            >
              <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
            </Pressable>
          </View>

          {/* Terms Note */}
          <Text style={styles.termsText}>
            By continuing, you agree to GetAIPilot's Terms of Service and Privacy Policy.
          </Text>

          {/* Submit Button */}
          <Pressable
            style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryBtnText}>Create Account →</Text>
            )}
          </Pressable>

          {/* Switch to Login */}
          <View style={styles.loginFooter}>
            <Text style={styles.loginPrompt}>Already have an account?</Text>
            <Pressable onPress={() => router.push('/(auth)/login' as any)}>
              <Text style={styles.loginLink}>Sign in</Text>
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
    paddingTop: 30,
    paddingBottom: 40,
    justifyContent: 'center',
    minHeight: '100%',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoBadgeText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#16B882',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primary,
  },
  brandSubtitle: {
    fontSize: 13,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 290,
    lineHeight: 18,
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
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.foreground,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 2,
    marginBottom: 16,
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
    marginBottom: 12,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    marginBottom: 12,
  },
  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  eyeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.mutedForeground,
  },
  termsText: {
    fontSize: 11,
    color: colors.mutedForeground,
    lineHeight: 15,
    marginBottom: 16,
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
  loginFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    gap: 6,
  },
  loginPrompt: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
});
