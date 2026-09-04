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
  Alert,
} from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { colors } from '../../src/theme/colors';
import { isValidEmail } from '../../src/lib/validators';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  );

  const handleLogin = async () => {
    setFeedback(null);
    const cleanEmail = email.trim();

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      setFeedback({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    if (authMode === 'password') {
      if (!password) {
        setFeedback({ type: 'error', message: 'Please enter your account password.' });
        return;
      }

      setLoading(true);
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

        if (error) throw error;
        // Navigation is handled automatically by AuthContext in root layout
      } catch (err: any) {
        setFeedback({ type: 'error', message: err.message || 'Invalid email or password.' });
      } finally {
        setLoading(false);
      }
    } else {
      // Magic Link / OTP Mode
      setLoading(true);
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
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
        setFeedback({ type: 'error', message: err.message || 'Failed to send magic link.' });
      } finally {
        setLoading(false);
      }
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
          <Text style={styles.brandTitle}>GetAIPilot Hub</Text>
          <Text style={styles.brandSubtitle}>
            AI-powered automation suite for WhatsApp, Telegram, Voice & CRM
          </Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>
          <Text style={styles.cardSubtitle}>Access your unified command dashboard</Text>

          {/* Mode Switch Tabs */}
          <View style={styles.modeTabs}>
            <Pressable
              style={[styles.modeTab, authMode === 'password' && styles.modeTabActive]}
              onPress={() => {
                setAuthMode('password');
                setFeedback(null);
              }}
            >
              <Text
                style={[styles.modeTabText, authMode === 'password' && styles.modeTabTextActive]}
              >
                Password
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modeTab, authMode === 'otp' && styles.modeTabActive]}
              onPress={() => {
                setAuthMode('otp');
                setFeedback(null);
              }}
            >
              <Text
                style={[styles.modeTabText, authMode === 'otp' && styles.modeTabTextActive]}
              >
                Magic Link (OTP)
              </Text>
            </Pressable>
          </View>

          {/* Feedback message banner */}
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

          {/* Email Input */}
          <Text style={styles.inputLabel}>Work / Personal Email</Text>
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

          {/* Password Input (if password mode) */}
          {authMode === 'password' && (
            <View style={{ marginTop: 12 }}>
              <View style={styles.passwordHeader}>
                <Text style={styles.inputLabel}>Password</Text>
                <Pressable onPress={() => router.push('/(auth)/forgot-password' as any)}>
                  <Text style={styles.forgotLink}>Forgot password?</Text>
                </Pressable>
              </View>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Enter your password"
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
            </View>
          )}

          {/* Submit Button */}
          <Pressable
            style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {authMode === 'password' ? 'Sign In to Hub →' : 'Send Magic Link →'}
              </Text>
            )}
          </Pressable>

          {/* Switch to Signup */}
          <View style={styles.signupFooter}>
            <Text style={styles.signupPrompt}>Don't have an account?</Text>
            <Pressable onPress={() => router.push('/(auth)/signup' as any)}>
              <Text style={styles.signupLink}>Create account</Text>
            </Pressable>
          </View>
        </View>

        {/* Security assurance */}
        <Text style={styles.securityNote}>
          🔒 End-to-end encrypted • Enterprise-grade session security
        </Text>
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
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  logoBadgeText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#16B882',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: -0.5,
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
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: colors.muted,
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeTabActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.mutedForeground,
  },
  modeTabTextActive: {
    color: colors.foreground,
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
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
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
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  signupFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 6,
  },
  signupPrompt: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
  signupLink: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  securityNote: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 20,
  },
});
