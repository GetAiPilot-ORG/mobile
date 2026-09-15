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

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState('');
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
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6;

  const handleSignup = async () => {
    Keyboard.dismiss();
    setFeedback(null);
    const cleanName = fullName.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      setFeedback({ type: 'error', message: 'Please enter your full name.' });
      return;
    }
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

      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

      if (data?.session) {
        setFeedback({
          type: 'success',
          message: 'Account created successfully! Redirecting...',
        });
      } else {
        setFeedback({
          type: 'success',
          message:
            'Account created! We have sent a confirmation link to your email. Please verify to activate.',
        });
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
          <Text className="text-2xl font-extrabold text-white text-center leading-8 tracking-tight mb-7">
            Create your GetAiPilot{'\n'}account
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
          <View className="bg-[#181A1F] border border-[#262930] rounded-2xl overflow-hidden mb-4">
            {/* Field 1: Full Name */}
            <View className="flex-row items-center px-4 min-h-[52px]">
              <TextInput
                className="flex-1 text-base font-normal text-white py-3.5"
                placeholder="Full Name"
                placeholderTextColor="#636366"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                returnKeyType="next"
              />
              {fullName.length > 0 && (
                <Pressable
                  onPress={() => setFullName('')}
                  hitSlop={10}
                  className="w-5 h-5 rounded-full bg-slate-700 justify-center items-center ml-2"
                >
                  <Text className="text-[10px] text-slate-300 font-extrabold">✕</Text>
                </Pressable>
              )}
            </View>

            <View className="h-[1px] bg-[#262930] ml-4" />

            {/* Field 2: Email Address */}
            <View className="flex-row items-center px-4 min-h-[52px]">
              <TextInput
                className="flex-1 text-base font-normal text-white py-3.5"
                placeholder="Email address"
                placeholderTextColor="#636366"
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
                  className="w-5 h-5 rounded-full bg-slate-700 justify-center items-center ml-2"
                >
                  <Text className="text-[10px] text-slate-300 font-extrabold">✕</Text>
                </Pressable>
              )}
            </View>

            <View className="h-[1px] bg-[#262930] ml-4" />

            {/* Field 3: Password */}
            <View className="flex-row items-center px-4 min-h-[52px]">
              <TextInput
                className="flex-1 text-base font-normal text-white py-3.5"
                placeholder="Choose password (min 6 chars)"
                placeholderTextColor="#636366"
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
                  className="px-2 py-1.5"
                >
                  <Text className="text-xs font-semibold text-slate-400">
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Terms Note */}
          <Text className="text-xs text-slate-400 text-center leading-4 mb-5 px-2">
            By signing up, you agree to GetAiPilot's{' '}
            <Text className="text-[#0084FF] font-semibold">Terms of Service</Text> and{' '}
            <Text className="text-[#0084FF] font-semibold">Privacy Policy</Text>.
          </Text>

          {/* Primary Action Button */}
          <Pressable
            className={`py-4 rounded-full items-center justify-center mb-3 shadow-md shadow-blue-500/20 ${
              !isFormValid
                ? 'bg-[#181A1F] border border-[#262930]'
                : 'bg-[#0084FF]'
            } ${loading ? 'opacity-80' : ''}`}
            onPress={handleSignup}
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
                Create account
              </Text>
            )}
          </Pressable>

          {/* Secondary Action Button */}
          <Pressable
            className="bg-[#181A1F] border border-[#262930] py-4 rounded-full items-center justify-center mb-6"
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(auth)/login' as any);
            }}
          >
            <Text className="text-white text-base font-bold tracking-tight">
              Already have an account? Log in
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

