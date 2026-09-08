import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  useColorScheme,
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

const brandLogo = require('../assets/images/logo.jpg');

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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

    // Optimistic UI state update
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
      // Save local preferences
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
          {/* Top Brand Logo */}
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

          {/* iOS Segmented Step Badge */}
          <View style={styles.stepBadgeContainer}>
            <View style={[styles.stepBadge, isDark && styles.stepBadgeDark]}>
              <Text style={[styles.stepBadgeText, isDark && styles.stepBadgeTextDark]}>
                Step {step} of 3 • {step === 1 ? 'Account Type' : step === 2 ? 'Workspace Details' : 'Permissions & Security'}
              </Text>
            </View>
          </View>

          {/* Heading & Subtitle */}
          <Text style={[styles.heading, isDark && styles.headingDark]}>
            {step === 1 ? 'Choose Account Type' : step === 2 ? 'Configure Workspace' : 'Permissions & Security'}
          </Text>
          <Text style={[styles.subheading, isDark && styles.subheadingDark]}>
            {step === 1
              ? 'Tailor your AI workspace engines according to your needs'
              : step === 2
              ? 'Set up your default workspace profile and automation channels'
              : 'Authorize security and real-time alerts for an optimal iOS experience'}
          </Text>

          {/* Inline Error Banner */}
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          {step === 1 ? (
            /* STEP 1: Account Type Selection */
            <View style={styles.stepOneContent}>
              {/* Option 1: Business / Agency */}
              <Pressable
                style={[
                  styles.optionCard,
                  accountType === 'business' && styles.optionCardActive,
                  isDark && styles.optionCardDark,
                  isDark && accountType === 'business' && styles.optionCardActiveDark,
                ]}
                onPress={() => handleSelectAccountType('business')}
              >
                <View style={[styles.optionIconBox, isDark && styles.optionIconBoxDark]}>
                  <Text style={styles.optionIconEmoji}>🏢</Text>
                </View>
                <View style={styles.optionTextBox}>
                  <Text style={[styles.optionTitle, isDark && styles.optionTitleDark]}>
                    Business / Agency
                  </Text>
                  <Text style={[styles.optionDesc, isDark && styles.optionDescDark]}>
                    For marketing teams, agencies, and businesses managing multiple automation channels
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    accountType === 'business' && styles.radioCircleActive,
                    isDark && styles.radioCircleDark,
                  ]}
                >
                  {accountType === 'business' && <Text style={styles.radioCheckmark}>✓</Text>}
                </View>
              </Pressable>

              {/* Option 2: Creator / Individual */}
              <Pressable
                style={[
                  styles.optionCard,
                  accountType === 'personal' && styles.optionCardActive,
                  isDark && styles.optionCardDark,
                  isDark && accountType === 'personal' && styles.optionCardActiveDark,
                ]}
                onPress={() => handleSelectAccountType('personal')}
              >
                <View style={[styles.optionIconBox, isDark && styles.optionIconBoxDark]}>
                  <Text style={styles.optionIconEmoji}>👤</Text>
                </View>
                <View style={styles.optionTextBox}>
                  <Text style={[styles.optionTitle, isDark && styles.optionTitleDark]}>
                    Creator / Individual
                  </Text>
                  <Text style={[styles.optionDesc, isDark && styles.optionDescDark]}>
                    For solo founders, content creators, and community managers
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    accountType === 'personal' && styles.radioCircleActive,
                    isDark && styles.radioCircleDark,
                  ]}
                >
                  {accountType === 'personal' && <Text style={styles.radioCheckmark}>✓</Text>}
                </View>
              </Pressable>

              {/* Primary Action Button */}
              <Pressable style={styles.primaryButton} onPress={handleContinueToStep2}>
                <Text style={styles.primaryButtonText}>Continue to Details →</Text>
              </Pressable>
            </View>
          ) : step === 2 ? (
            /* STEP 2: Workspace Details */
            <View style={styles.stepTwoContent}>
              {/* Grouped Profile Inputs Card */}
              <View style={[styles.inputGroup, isDark && styles.inputGroupDark]}>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.nativeInput, isDark && styles.nativeInputDark]}
                    placeholder="Your Full Name"
                    placeholderTextColor={isDark ? '#636366' : '#8E8E93'}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>

                {accountType === 'business' && (
                  <View style={[styles.inputRow, styles.inputRowBorder, isDark && styles.inputRowBorderDark]}>
                    <TextInput
                      style={[styles.nativeInput, isDark && styles.nativeInputDark]}
                      placeholder="Business / Agency Name *"
                      placeholderTextColor={isDark ? '#636366' : '#8E8E93'}
                      value={businessName}
                      onChangeText={setBusinessName}
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                  </View>
                )}

                <View style={[styles.inputRow, styles.inputRowBorder, isDark && styles.inputRowBorderDark]}>
                  <TextInput
                    style={[styles.nativeInput, isDark && styles.nativeInputDark]}
                    placeholder="Mobile / WhatsApp Number"
                    placeholderTextColor={isDark ? '#636366' : '#8E8E93'}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    returnKeyType="done"
                  />
                </View>
              </View>

              {/* Category Selector */}
              <Text style={[styles.sectionLabel, isDark && styles.sectionLabelDark]}>
                Industry Category
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsContainer}
              >
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <Pressable
                      key={cat}
                      style={[
                        styles.chip,
                        isSelected && styles.chipActive,
                        isDark && styles.chipDark,
                        isDark && isSelected && styles.chipActiveDark,
                      ]}
                      onPress={() => {
                        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                        setCategory(cat);
                      }}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextActive,
                          isDark && styles.chipTextDark,
                        ]}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Team Size Segmented Control */}
              <Text style={[styles.sectionLabel, isDark && styles.sectionLabelDark]}>
                Team Size
              </Text>
              <View style={[styles.segmentedControl, isDark && styles.segmentedControlDark]}>
                {TEAM_SIZES.map((size) => {
                  const isSelected = teamSize === size;
                  return (
                    <Pressable
                      key={size}
                      style={[
                        styles.segmentButton,
                        isSelected && styles.segmentButtonActive,
                        isDark && isSelected && styles.segmentButtonActiveDark,
                      ]}
                      onPress={() => {
                        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                        setTeamSize(size);
                      }}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          isSelected && styles.segmentTextActive,
                          isDark && styles.segmentTextDark,
                        ]}
                      >
                        {size}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Continue to Step 3 Button */}
              <Pressable
                style={styles.primaryButton}
                onPress={handleContinueToStep3}
              >
                <Text style={styles.primaryButtonText}>Continue to Permissions & Security →</Text>
              </Pressable>

              {/* Back Button */}
              <Pressable
                style={[styles.secondaryButton, isDark && styles.secondaryButtonDark]}
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                  setStep(1);
                }}
              >
                <Text style={[styles.secondaryButtonText, isDark && styles.secondaryButtonTextDark]}>
                  ← Back to Step 1
                </Text>
              </Pressable>
            </View>
          ) : (
            /* STEP 3: Permissions & Security Setup */
            <View style={styles.stepTwoContent}>
              <View style={[styles.permissionGroup, isDark && styles.permissionGroupDark]}>
                {/* 1. Biometric / Face ID Card */}
                <View style={[styles.permissionRow, isDark && styles.permissionRowDark]}>
                  <View style={[styles.permissionIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
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
                  <View style={styles.permissionTextBox}>
                    <Text style={[styles.permissionTitle, isDark && styles.permissionTitleDark]}>
                      {biometricSettings.biometricLabel} Lock
                    </Text>
                    <Text style={[styles.permissionDesc, isDark && styles.permissionDescDark]}>
                      1-tap fast biometric access & account data encryption
                    </Text>
                  </View>
                  <Switch
                    value={biometricSettings.enabled}
                    onValueChange={handleToggleBiometricInOnboarding}
                    disabled={isUpdatingBiometrics}
                    trackColor={{ false: isDark ? '#3A3A3C' : '#E5E7EB', true: '#10B981' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {/* 2. Push Notifications Card */}
                <View style={[styles.permissionRow, styles.inputRowBorder, isDark && styles.inputRowBorderDark, isDark && styles.permissionRowDark]}>
                  <View style={[styles.permissionIconCircle, { backgroundColor: 'rgba(10, 132, 255, 0.15)' }]}>
                    <Ionicons name="notifications-outline" size={22} color="#0A84FF" />
                  </View>
                  <View style={styles.permissionTextBox}>
                    <Text style={[styles.permissionTitle, isDark && styles.permissionTitleDark]}>
                      Push Notifications
                    </Text>
                    <Text style={[styles.permissionDesc, isDark && styles.permissionDescDark]}>
                      Real-time alerts when leads arrive & automations run
                    </Text>
                  </View>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={(val) => {
                      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                      setNotificationsEnabled(val);
                    }}
                    trackColor={{ false: isDark ? '#3A3A3C' : '#E5E7EB', true: '#0A84FF' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {/* 3. Sensory Haptics */}
                <View style={[styles.permissionRow, styles.inputRowBorder, isDark && styles.inputRowBorderDark, isDark && styles.permissionRowDark, { borderBottomWidth: 0 }]}>
                  <View style={[styles.permissionIconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                    <Ionicons name="phone-portrait-outline" size={22} color="#8B5CF6" />
                  </View>
                  <View style={styles.permissionTextBox}>
                    <Text style={[styles.permissionTitle, isDark && styles.permissionTitleDark]}>
                      Tactile Haptic Feedback
                    </Text>
                    <Text style={[styles.permissionDesc, isDark && styles.permissionDescDark]}>
                      Smooth iOS tactile vibrations on actions & buttons
                    </Text>
                  </View>
                  <Switch
                    value={hapticsEnabled}
                    onValueChange={(val) => {
                      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                      setHapticsEnabled(val);
                    }}
                    trackColor={{ false: isDark ? '#3A3A3C' : '#E5E7EB', true: '#8B5CF6' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>

              {/* Complete Setup Primary CTA */}
              <Pressable
                style={[styles.primaryButton, loading && { opacity: 0.8 }]}
                onPress={handleCompleteOnboarding}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Complete Setup & Enter Hub 🚀</Text>
                )}
              </Pressable>

              {/* Back to Step 2 */}
              <Pressable
                style={[styles.secondaryButton, isDark && styles.secondaryButtonDark]}
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                  setStep(2);
                }}
              >
                <Text style={[styles.secondaryButtonText, isDark && styles.secondaryButtonTextDark]}>
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
    marginBottom: 20,
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
  stepBadgeContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  stepBadge: {
    backgroundColor: '#F2F4F7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  stepBadgeDark: {
    backgroundColor: '#1C1C1E',
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0084FF',
    letterSpacing: 0.2,
  },
  stepBadgeTextDark: {
    color: '#3B82F6',
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 32,
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
  errorBanner: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 18,
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  stepOneContent: {
    gap: 14,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F4F7',
    borderRadius: 18,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 14,
  },
  optionCardDark: {
    backgroundColor: '#1C1C1E',
  },
  optionCardActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#0084FF',
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  optionCardActiveDark: {
    backgroundColor: '#1E293B',
    borderColor: '#3B82F6',
  },
  optionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  optionIconBoxDark: {
    backgroundColor: '#2C2C2E',
  },
  optionIconEmoji: {
    fontSize: 24,
  },
  optionTextBox: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  optionTitleDark: {
    color: '#FFFFFF',
  },
  optionDesc: {
    fontSize: 12.5,
    color: '#6B7280',
    lineHeight: 17,
  },
  optionDescDark: {
    color: '#9CA3AF',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleDark: {
    borderColor: '#4B5563',
  },
  radioCircleActive: {
    backgroundColor: '#0084FF',
    borderColor: '#0084FF',
  },
  radioCheckmark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  stepTwoContent: {
    gap: 16,
  },
  inputGroup: {
    backgroundColor: '#F2F4F7',
    borderRadius: 16,
    overflow: 'hidden',
  },
  inputGroupDark: {
    backgroundColor: '#1C1C1E',
  },
  inputRow: {
    paddingHorizontal: 16,
    minHeight: 52,
    justifyContent: 'center',
  },
  nativeInput: {
    fontSize: 16,
    color: '#000000',
    paddingVertical: 14,
  },
  nativeInputDark: {
    color: '#FFFFFF',
  },
  hairlineDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginLeft: 16,
  },
  hairlineDividerDark: {
    backgroundColor: '#2C2C2E',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
    marginTop: 4,
  },
  sectionLabelDark: {
    color: '#9CA3AF',
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    backgroundColor: '#F2F4F7',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipDark: {
    backgroundColor: '#1C1C1E',
  },
  chipActive: {
    backgroundColor: '#EBF5FF',
    borderColor: '#0084FF',
  },
  chipActiveDark: {
    backgroundColor: '#1E293B',
    borderColor: '#3B82F6',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  chipTextDark: {
    color: '#9CA3AF',
  },
  chipTextActive: {
    color: '#0084FF',
    fontWeight: '700',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F2F4F7',
    borderRadius: 14,
    padding: 4,
  },
  segmentedControlDark: {
    backgroundColor: '#1C1C1E',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentButtonActiveDark: {
    backgroundColor: '#2C2C2E',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  segmentTextDark: {
    color: '#9CA3AF',
  },
  segmentTextActive: {
    color: '#0084FF',
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#0084FF',
    paddingVertical: 15,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  secondaryButton: {
    backgroundColor: '#F2F4F7',
    paddingVertical: 15,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
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
  inputRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F2F4F7',
  },
  inputRowBorderDark: {
    borderTopColor: '#2C2C2E',
  },
  permissionGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  permissionGroupDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  permissionRowDark: {
    backgroundColor: '#1C1C1E',
  },
  permissionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  permissionTextBox: {
    flex: 1,
    paddingRight: 10,
  },
  permissionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 2,
  },
  permissionTitleDark: {
    color: '#FFFFFF',
  },
  permissionDesc: {
    fontSize: 12.5,
    color: '#6B7280',
    lineHeight: 17,
  },
  permissionDescDark: {
    color: '#8E8E93',
  },
});
