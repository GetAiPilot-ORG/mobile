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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/core/store/authStore';
import { useTheme, getColors } from '@/theme';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const syncSession = useAuthStore((s) => s.syncSession);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  };

  const isFormValid = password.length >= 6 && password === confirmPassword;

  const handleUpdatePassword = async () => {
    Keyboard.dismiss();
    setFeedback(null);

    if (password.length < 6) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      setFeedback({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }

    if (password !== confirmPassword) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      setFeedback({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { data, error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      setFeedback({
        type: 'success',
        message: 'Password updated successfully! Entering your workspace...',
      });

      // Synchronize session if user is returned
      if (data?.user) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          await syncSession({
            access_token: sessionData.session.access_token,
            refresh_token: sessionData.session.refresh_token,
            user: sessionData.session.user,
          });
        }
      }

      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1500);
    } catch (err: any) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update password. Please try again.',
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
            { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: isDark ? 'rgba(10, 132, 255, 0.15)' : '#E0F2FE' },
              ]}
            >
              <Ionicons name="key-outline" size={32} color="#0A84FF" />
            </View>
            <Text style={[styles.title, isDark && styles.titleDark]}>Set New Password</Text>
            <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
              Please choose a strong password with at least 6 characters.
            </Text>
          </View>

          {/* Feedback Banner */}
          {feedback && (
            <View
              style={[
                styles.feedbackBox,
                feedback.type === 'error' ? styles.feedbackError : styles.feedbackSuccess,
              ]}
            >
              <Ionicons
                name={feedback.type === 'error' ? 'alert-circle' : 'checkmark-circle'}
                size={18}
                color={feedback.type === 'error' ? '#EF4444' : '#10B981'}
              />
              <Text
                style={[
                  styles.feedbackText,
                  feedback.type === 'error' ? styles.feedbackTextError : styles.feedbackTextSuccess,
                ]}
              >
                {feedback.message}
              </Text>
            </View>
          )}

          <View style={styles.form}>
            {/* New Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.labelDark]}>New Password</Text>
              <View
                style={[
                  styles.passwordInputContainer,
                  isDark && styles.passwordInputContainerDark,
                ]}
              >
                <TextInput
                  style={[styles.inputFlex, isDark && styles.inputTextDark]}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={8}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={isDark ? '#9CA3AF' : '#6B7280'}
                  />
                </Pressable>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.labelDark]}>Confirm Password</Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                placeholder="Re-enter password"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
              />
            </View>

            {/* Submit Button */}
            <Pressable
              style={[
                styles.primaryBtn,
                (!isFormValid || loading) && styles.disabledBtn,
              ]}
              onPress={handleUpdatePassword}
              disabled={!isFormValid || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>Update Password & Sign In</Text>
              )}
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
    backgroundColor: '#F8F9FA',
  },
  containerDark: {
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingHorizontal: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  titleDark: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  subtitleDark: {
    color: '#9CA3AF',
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  feedbackError: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  feedbackSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  feedbackText: {
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  feedbackTextError: {
    color: '#EF4444',
  },
  feedbackTextSuccess: {
    color: '#10B981',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  labelDark: {
    color: '#D1D5DB',
  },
  input: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#111827',
  },
  inputDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
    color: '#FFFFFF',
  },
  passwordInputContainer: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInputContainerDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  inputFlex: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  inputTextDark: {
    color: '#FFFFFF',
  },
  eyeBtn: {
    padding: 4,
  },
  primaryBtn: {
    height: 48,
    backgroundColor: '#0A84FF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
