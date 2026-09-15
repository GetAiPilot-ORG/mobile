import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Switch,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/contexts/AuthContext';
import { BiometricService, BiometricSettings } from '../src/lib/biometrics';

const brandLogo = require('../assets/images/logo.png');

const CATEGORIES = [
  'Agency & Marketing',
  'Creators & Influencers',
  'Brand & Business',
  'E-Commerce & Retail',
  'Crypto & Stocks',
  'Real Estate',
  'Health & Fitness',
  'Other',
];

const TEAM_SIZES = ['1-5', '6-15', '16-50', '50+'];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshProfile } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [accountType, setAccountType] = useState<'business' | 'personal'>('business');
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [teamSize, setTeamSize] = useState(TEAM_SIZES[0]);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 3 Permissions State
  const [biometricSettings, setBiometricSettings] = useState<BiometricSettings>({
    enabled: false,
    timeoutMinutes: 0,
    biometricType: 'NONE',
    biometricLabel: 'Face ID / Passcode',
    hardwareDescription: 'Device Security',
    hasHardware: false,
    isEnrolled: false,
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [isUpdatingBiometrics, setIsUpdatingBiometrics] = useState(false);

  useEffect(() => {
    async function loadBiometrics() {
      const settings = await BiometricService.getSettings();
      setBiometricSettings(settings);
    }
    loadBiometrics();
  }, []);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web' && hapticsEnabled) {
      Haptics.impactAsync(style);
    }
  };

  const handleSelectAccountType = (type: 'business' | 'personal') => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setAccountType(type);
  };

  const handleContinueToStep2 = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setStep(2);
  };

  const handleContinueToStep3 = () => {
    if (accountType === 'business' && !businessName.trim()) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      setError('Please provide your business or agency name.');
      return;
    }
    setError(null);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setStep(3);
  };

  const handleToggleBiometricInOnboarding = async (val: boolean) => {
    if (isUpdatingBiometrics) return;
    setIsUpdatingBiometrics(true);
    setBiometricSettings((prev) => ({ ...prev, enabled: val }));
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);

    try {
      await BiometricService.setEnabled(val);
      const updated = await BiometricService.getSettings();
      setBiometricSettings(updated);

      if (val) {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
        BiometricService.authenticate(`Enable ${updated.biometricLabel} for GetAIPilot`).catch((e) =>
          console.warn('Onboarding biometric error:', e)
        );
      }
    } catch (e) {
      console.warn('Onboarding biometric error:', e);
      setBiometricSettings((prev) => ({ ...prev, enabled: !val }));
    } finally {
      setIsUpdatingBiometrics(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    Keyboard.dismiss();
    if (!user) return;
    setError(null);

    setLoading(true);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await AsyncStorage.setItem('@pref_push', notificationsEnabled ? 'true' : 'false');
      await AsyncStorage.setItem('@pref_haptics', hapticsEnabled ? 'true' : 'false');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim() || businessName.trim() || user.email?.split('@')[0],
          account_type: accountType,
          business_name: businessName.trim() || null,
          category,
          team_size: teamSize,
          phone: phone.trim() || null,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      await refreshProfile();
      router.replace('/(tabs)' as any);
    } catch (err: any) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      setError(err.message || 'Failed to complete onboarding. Please try again.');
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
          {/* Top Brand Logo */}
          <View className="items-center mb-5">
            <View className="w-[92px] h-[92px] rounded-full overflow-hidden bg-[#181A1F] border border-[#262930] shadow-lg shadow-purple-500/20">
              <Image
                source={brandLogo}
                className="w-full h-full rounded-full"
                contentFit="cover"
                transition={200}
              />
            </View>
          </View>

          {/* Segmented Step Badge */}
          <View className="items-center mb-3">
            <View className="bg-[#181A1F] border border-[#262930] px-3.5 py-1.5 rounded-xl">
              <Text className="text-xs font-bold text-blue-400 tracking-wider">
                Step {step} of 3 • {step === 1 ? 'Account Type' : step === 2 ? 'Workspace Details' : 'Permissions & Security'}
              </Text>
            </View>
          </View>

          {/* Heading & Subtitle */}
          <Text className="text-[26px] font-extrabold text-white text-center leading-8 tracking-tight mb-2">
            {step === 1 ? 'Choose Account Type' : step === 2 ? 'Configure Workspace' : 'Permissions & Security'}
          </Text>
          <Text className="text-sm text-slate-400 text-center leading-5 mb-6 px-3">
            {step === 1
              ? 'Tailor your AI workspace engines according to your needs'
              : step === 2
              ? 'Set up your default workspace profile and automation channels'
              : 'Authorize security and real-time alerts for an optimal experience'}
          </Text>

          {/* Error Banner */}
          {error && (
            <View className="bg-red-500/15 border border-red-500/30 py-2.5 px-3.5 rounded-xl mb-4.5">
              <Text className="text-red-400 text-xs font-semibold text-center leading-5">{error}</Text>
            </View>
          )}

          {step === 1 ? (
            /* STEP 1: Account Type Selection */
            <View className="gap-3.5">
              {/* Option 1: Business / Agency */}
              <Pressable
                className={`flex-row items-center rounded-2xl p-4 border-2 gap-3.5 ${
                  accountType === 'business'
                    ? 'bg-[#181A1F] border-blue-500'
                    : 'bg-[#181A1F] border-transparent'
                }`}
                onPress={() => handleSelectAccountType('business')}
              >
                <View className="w-12 h-12 rounded-xl bg-[#262930] justify-center items-center">
                  <Text className="text-2xl">🏢</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-white mb-1">
                    Business / Agency
                  </Text>
                  <Text className="text-xs text-slate-400 leading-4">
                    For marketing teams, agencies, and businesses managing multiple automation channels
                  </Text>
                </View>
                <View
                  className={`w-6 h-6 rounded-full border-2 justify-center items-center ${
                    accountType === 'business'
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-slate-600 bg-transparent'
                  }`}
                >
                  {accountType === 'business' && <Text className="text-white text-xs font-black">✓</Text>}
                </View>
              </Pressable>

              {/* Option 2: Creator / Individual */}
              <Pressable
                className={`flex-row items-center rounded-2xl p-4 border-2 gap-3.5 ${
                  accountType === 'personal'
                    ? 'bg-[#181A1F] border-blue-500'
                    : 'bg-[#181A1F] border-transparent'
                }`}
                onPress={() => handleSelectAccountType('personal')}
              >
                <View className="w-12 h-12 rounded-xl bg-[#262930] justify-center items-center">
                  <Text className="text-2xl">👤</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-white mb-1">
                    Creator / Individual
                  </Text>
                  <Text className="text-xs text-slate-400 leading-4">
                    For solo founders, content creators, and community managers
                  </Text>
                </View>
                <View
                  className={`w-6 h-6 rounded-full border-2 justify-center items-center ${
                    accountType === 'personal'
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-slate-600 bg-transparent'
                  }`}
                >
                  {accountType === 'personal' && <Text className="text-white text-xs font-black">✓</Text>}
                </View>
              </Pressable>

              {/* Primary Action Button */}
              <Pressable
                className="bg-blue-600 py-4 rounded-full items-center justify-center mt-2 shadow-md shadow-blue-500/20"
                onPress={handleContinueToStep2}
              >
                <Text className="text-white text-base font-bold tracking-tight">Continue to Details →</Text>
              </Pressable>
            </View>
          ) : step === 2 ? (
            /* STEP 2: Workspace Details */
            <View className="gap-4">
              {/* Grouped Profile Inputs Card */}
              <View className="bg-[#181A1F] border border-[#262930] rounded-2xl overflow-hidden">
                <View className="px-4 min-h-[52px] justify-center">
                  <TextInput
                    className="text-base text-white py-3.5"
                    placeholder="Your Full Name"
                    placeholderTextColor="#636366"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>

                {accountType === 'business' && (
                  <View className="px-4 min-h-[52px] justify-center border-t border-[#262930]">
                    <TextInput
                      className="text-base text-white py-3.5"
                      placeholder="Business / Agency Name *"
                      placeholderTextColor="#636366"
                      value={businessName}
                      onChangeText={setBusinessName}
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                  </View>
                )}

                <View className="px-4 min-h-[52px] justify-center border-t border-[#262930]">
                  <TextInput
                    className="text-base text-white py-3.5"
                    placeholder="Mobile / WhatsApp Number"
                    placeholderTextColor="#636366"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    returnKeyType="done"
                  />
                </View>
              </View>

              {/* Category Selector */}
              <Text className="text-xs font-bold text-slate-400 mt-1">
                Industry Category
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="flex-row gap-2 py-0.5"
              >
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <Pressable
                      key={cat}
                      className={`px-3.5 py-2 rounded-full border ${
                        isSelected
                          ? 'bg-blue-500/20 border-blue-500'
                          : 'bg-[#181A1F] border-[#262930]'
                      }`}
                      onPress={() => {
                        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                        setCategory(cat);
                      }}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          isSelected ? 'text-blue-400 font-bold' : 'text-slate-400'
                        }`}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Team Size Control */}
              <Text className="text-xs font-bold text-slate-400 mt-1">
                Team Size
              </Text>
              <View className="flex-row bg-[#181A1F] border border-[#262930] rounded-xl p-1">
                {TEAM_SIZES.map((size) => {
                  const isSelected = teamSize === size;
                  return (
                    <Pressable
                      key={size}
                      className={`flex-1 py-2.5 items-center rounded-lg ${
                        isSelected ? 'bg-[#262930]' : ''
                      }`}
                      onPress={() => {
                        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                        setTeamSize(size);
                      }}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          isSelected ? 'text-blue-400 font-bold' : 'text-slate-400'
                        }`}
                      >
                        {size}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Continue to Step 3 Button */}
              <Pressable
                className="bg-blue-600 py-4 rounded-full items-center justify-center mt-2 shadow-md shadow-blue-500/20"
                onPress={handleContinueToStep3}
              >
                <Text className="text-white text-base font-bold tracking-tight">Continue to Permissions & Security →</Text>
              </Pressable>

              {/* Back Button */}
              <Pressable
                className="bg-[#181A1F] border border-[#262930] py-4 rounded-full items-center justify-center"
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                  setStep(1);
                }}
              >
                <Text className="text-white text-base font-bold tracking-tight">
                  ← Back to Step 1
                </Text>
              </Pressable>
            </View>
          ) : (
            /* STEP 3: Permissions & Security Setup */
            <View className="gap-4">
              <View className="bg-[#181A1F] border border-[#262930] rounded-2xl overflow-hidden mb-5">
                {/* 1. Biometric / Face ID Card */}
                <View className="flex-row items-center px-4 py-3.5">
                  <View className="w-10 h-10 rounded-xl bg-emerald-500/15 items-center justify-center mr-3.5">
                    <Ionicons
                      name={
                        biometricSettings.biometricType === 'FACE_ID'
                          ? 'scan-outline'
                          : biometricSettings.biometricType === 'TOUCH_ID' || biometricSettings.biometricType === 'FINGERPRINT'
                          ? 'finger-print-outline'
                          : 'shield-checkmark-outline'
                      }
                      size={22}
                      color="#10B981"
                    />
                  </View>
                  <View className="flex-1 pr-2.5">
                    <Text className="text-[15px] font-bold text-white mb-0.5">
                      {biometricSettings.biometricLabel} Lock
                    </Text>
                    <Text className="text-xs text-slate-400 leading-4">
                      1-tap fast biometric access & account data encryption
                    </Text>
                  </View>
                  <Switch
                    value={biometricSettings.enabled}
                    onValueChange={handleToggleBiometricInOnboarding}
                    disabled={isUpdatingBiometrics}
                    trackColor={{ false: '#3A3A3C', true: '#10B981' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {/* 2. Push Notifications Card */}
                <View className="flex-row items-center px-4 py-3.5 border-t border-[#262930]">
                  <View className="w-10 h-10 rounded-xl bg-blue-500/15 items-center justify-center mr-3.5">
                    <Ionicons name="notifications-outline" size={22} color="#0A84FF" />
                  </View>
                  <View className="flex-1 pr-2.5">
                    <Text className="text-[15px] font-bold text-white mb-0.5">
                      Push Notifications
                    </Text>
                    <Text className="text-xs text-slate-400 leading-4">
                      Real-time alerts when leads arrive & automations run
                    </Text>
                  </View>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={(val) => {
                      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                      setNotificationsEnabled(val);
                    }}
                    trackColor={{ false: '#3A3A3C', true: '#0A84FF' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {/* 3. Sensory Haptics */}
                <View className="flex-row items-center px-4 py-3.5 border-t border-[#262930]">
                  <View className="w-10 h-10 rounded-xl bg-purple-500/15 items-center justify-center mr-3.5">
                    <Ionicons name="phone-portrait-outline" size={22} color="#8B5CF6" />
                  </View>
                  <View className="flex-1 pr-2.5">
                    <Text className="text-[15px] font-bold text-white mb-0.5">
                      Tactile Haptic Feedback
                    </Text>
                    <Text className="text-xs text-slate-400 leading-4">
                      Smooth tactile vibrations on actions & buttons
                    </Text>
                  </View>
                  <Switch
                    value={hapticsEnabled}
                    onValueChange={(val) => {
                      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                      setHapticsEnabled(val);
                    }}
                    trackColor={{ false: '#3A3A3C', true: '#8B5CF6' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>

              {/* Complete Setup Primary CTA */}
              <Pressable
                className={`bg-blue-600 py-4 rounded-full items-center justify-center shadow-md shadow-blue-500/20 ${loading ? 'opacity-80' : ''}`}
                onPress={handleCompleteOnboarding}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-base font-bold tracking-tight">Complete Setup & Enter Hub 🚀</Text>
                )}
              </Pressable>

              {/* Back to Step 2 */}
              <Pressable
                className="bg-[#181A1F] border border-[#262930] py-4 rounded-full items-center justify-center"
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                  setStep(2);
                }}
              >
                <Text className="text-white text-base font-bold tracking-tight">
                  ← Back to Step 2
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

