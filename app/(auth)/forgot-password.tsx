import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
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

const brandLogo = require('../../assets/images/logo.png');

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
        className="flex-1 bg-[#0B0D10]"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow px-6 justify-center max-w-[500px] w-full self-center"
          contentContainerStyle={{
            paddingTop: Math.max(insets.top + 16, 44),
            paddingBottom: Math.max(insets.bottom + 24, 32),
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Brand Logo Section */}
          <View className="items-center mb-6">
            <View className="w-[92px] h-[92px] rounded-full overflow-hidden bg-[#181A1F] border border-[#262930] shadow-lg shadow-purple-500/20">
              <Image
                source={brandLogo}
                className="w-full h-full rounded-full"
                contentFit="cover"
                transition={200}
              />
            </View>
          </View>

          {/* Heading */}
          <Text className="text-2xl font-extrabold text-white text-center leading-8 tracking-tight mb-2">
            Reset your account{'\n'}password
          </Text>
          <Text className="text-sm text-slate-400 text-center leading-5 mb-6 px-3">
            Enter the email associated with your GetAiPilot account and we'll send you reset instructions.
          </Text>

          {/* Inline Feedback Banner */}
          {feedback && (
            <View
              className={`py-2.5 px-3.5 rounded-xl mb-4.5 ${
                feedback.type === 'error'
                  ? 'bg-red-500/15 border border-red-500/30'
                  : 'bg-emerald-500/15 border border-emerald-500/30'
              }`}
            >
              <Text
                className={`text-xs font-semibold text-center leading-5 ${
                  feedback.type === 'error' ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {feedback.message}
              </Text>
            </View>
          )}

          {/* Grouped Input Fields Card */}
          <View className="bg-[#181A1F] border border-[#262930] rounded-2xl overflow-hidden mb-5">
            <View className="flex-row items-center px-4 min-h-[52px]">
              <TextInput
                className="flex-1 text-base font-normal text-white py-3.5"
                placeholder="Account email address"
                placeholderTextColor="#636366"
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
                  className="w-5 h-5 rounded-full bg-slate-700 justify-center items-center ml-2"
                >
                  <Text className="text-[10px] text-slate-300 font-extrabold">✕</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Primary Action Button */}
          <Pressable
            className={`py-4 rounded-full items-center justify-center mb-3 shadow-md shadow-blue-500/20 ${
              !isFormValid
                ? 'bg-[#181A1F] border border-[#262930]'
                : 'bg-[#0084FF]'
            } ${loading ? 'opacity-80' : ''}`}
            onPress={handleReset}
            disabled={!isFormValid || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                className={`text-base font-bold tracking-tight ${
                  !isFormValid ? 'text-slate-500' : 'text-white'
                }`}
              >
                Send reset link
              </Text>
            )}
          </Pressable>

          {/* Secondary Action Button */}
          <Pressable
            className="bg-[#181A1F] border border-[#262930] py-4 rounded-full items-center justify-center mb-6"
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Text className="text-white text-base font-bold tracking-tight">
              Back to Log in
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

