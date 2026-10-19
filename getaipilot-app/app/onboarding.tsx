import { getColors, useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../src/contexts/AuthContext';
import { useAuthStore } from '../src/core/store/authStore';
import { BiometricService, BiometricSettings } from '../src/lib/biometrics';
import { supabase } from '../src/lib/supabase';
import { isValidEmail } from '../src/lib/validators';
import { getPendingReferralCode, handlePendingReferral } from '../src/services/referralService';

const brandLogo = require('../assets/images/icon.png');

const CATEGORIES = [
  'Agency & Marketing',
  'Creators & Influencers',
  'Brand & Business',
  'E-Commerce & Retail',
  'Crypto & Stocks',
  'Real Estate',
  'Health & Fitness',
  'SaaS & Tech',
  'Other',
];

const TEAM_SIZES = ['1-5', '6-15', '16-50', '50+'];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { user, refreshProfile } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [accountType, setAccountType] = useState<'business' | 'personal'>('business');

  // Form Fields matching website onboarding & DB schema
  const [firstName, setFirstName] = useState(() => {
    const raw = (user as any)?.user_metadata?.first_name || '';
    if (raw) return raw;
    const fn = (user as any)?.user_metadata?.full_name || '';
    return fn.split(' ')[0] || '';
  });
  const [lastName, setLastName] = useState(() => {
    const raw = (user as any)?.user_metadata?.last_name || '';
    if (raw) return raw;
    const fn = (user as any)?.user_metadata?.full_name || '';
    return fn.split(' ').slice(1).join(' ') || '';
  });
  const [state, setState] = useState('');
  const [phone, setPhone] = useState((user as any)?.phone || '');
  const [businessName, setBusinessName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [teamSize, setTeamSize] = useState(TEAM_SIZES[0]);
  const [referralCode, setReferralCode] = useState('');
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

    async function loadPendingReferral() {
      const pending = await getPendingReferralCode();
      if (pending) {
        setReferralCode(pending);
      }
    }
    loadPendingReferral();
  }, []);

  useEffect(() => {
    const onBackPress = () => {
      if (step === 3) {
        setStep(2);
        return true;
      }
      if (step === 2) {
        setStep(1);
        return true;
      }
      return true; // prevent exiting to protected tabs
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [step]);

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
    if (!firstName.trim()) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      setError('Please provide your first name.');
      return;
    }
    if (!lastName.trim()) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      setError('Please provide your last name.');
      return;
    }
    if (accountType === 'business') {
      if (!businessName.trim()) {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
        setError('Please provide your business or agency name.');
        return;
      }
      if (businessEmail.trim() && !isValidEmail(businessEmail.trim())) {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
        setError('Please provide a valid business email address.');
        return;
      }
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
      // Save local device preferences
      await AsyncStorage.setItem('@pref_push', notificationsEnabled ? 'true' : 'false');
      await AsyncStorage.setItem('@pref_haptics', hapticsEnabled ? 'true' : 'false');

      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim() || user.email?.split('@')[0];

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            first_name: firstName.trim() || null,
            last_name: lastName.trim() || null,
            full_name: fullName,
            account_type: accountType,
            business_name: accountType === 'business' ? (businessName.trim() || null) : null,
            business_email: accountType === 'business' ? (businessEmail.trim() || null) : null,
            state: state.trim() || null,
            category: accountType === 'business' ? category : null,
            team_size: accountType === 'business' ? teamSize : '1',
            phone: phone.trim() || null,
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (updateError) throw updateError;

      useAuthStore.getState().setOnboardingCompleted(true);

      // Link referral code if provided
      const cleanRef = referralCode.trim();
      if (cleanRef) {
        try {
          await handlePendingReferral(cleanRef);
        } catch (refErr) {
          console.warn('[Onboarding] Referral linking error:', refErr);
        }
      }

      // Activate Free Trial via Supabase RPC
      try {
        await supabase.rpc('activate_free_trial');
      } catch (trialErr) {
        console.warn('[Onboarding] Free trial activation error:', trialErr);
      }

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
      <View style={[styles.container, isDark && styles.containerDark]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
          enabled={Platform.OS === 'ios'}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingTop: Math.max(insets.top + 16, 44),
                paddingBottom: Math.max(insets.bottom + 24, 32),
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Top Bar with Sign Out & Skip to Home */}
            <View style={styles.topBar}>
              <Pressable
                onPress={async () => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                  await useAuthStore.getState().logout();
                  router.replace('/(auth)/login' as any);
                }}
                hitSlop={8}
                style={styles.signOutBtn}
              >
                <Text style={[styles.signOutText, isDark && styles.signOutTextDark]}>Sign out</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                  useAuthStore.getState().setOnboardingCompleted(true);
                  router.replace('/(tabs)' as any);
                }}
                hitSlop={8}
                style={styles.skipBtn}
              >
                <Text style={[styles.skipText, isDark && styles.skipTextDark]}>Skip to Home →</Text>
              </Pressable>
            </View>

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

            {/* iOS Step Progress Indicator */}
            <View style={styles.stepBadgeContainer}>
              <View style={[styles.stepBadge, isDark && styles.stepBadgeDark]}>
                <Text style={[styles.stepBadgeText, isDark && styles.stepBadgeTextDark]}>
                  Step {step} of 3 • {step === 1 ? 'Account Type' : step === 2 ? 'Workspace Details' : 'Security & Alerts'}
                </Text>
              </View>
            </View>

            {/* Heading & Subtitle */}
            <Text style={[styles.heading, isDark && styles.headingDark]}>
              {step === 1 ? 'Choose Account Type' : step === 2 ? 'Configure Workspace' : 'Security & Permissions'}
            </Text>
            <Text style={[styles.subheading, isDark && styles.subheadingDark]}>
              {step === 1
                ? 'Tailor your AI workspace engines according to your specific needs'
                : step === 2
                  ? 'Set up your default workspace profile and automation contact information'
                  : 'Authorize device security and real-time alerts for an optimal experience'}
            </Text>

            {/* Inline Error Banner */}
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            {step === 1 ? (
              /* STEP 1: Account Type Selection */
              <View style={styles.stepContent}>
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
                    <Ionicons
                      name="business-outline"
                      size={22}
                      color={accountType === 'business' ? '#0084FF' : (isDark ? '#9CA3AF' : '#6B7280')}
                    />
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
                    {accountType === 'business' && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
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
                    <Ionicons
                      name="person-outline"
                      size={22}
                      color={accountType === 'personal' ? '#0084FF' : (isDark ? '#9CA3AF' : '#6B7280')}
                    />
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
                    {accountType === 'personal' && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                  </View>
                </Pressable>

                {/* Primary Action Button */}
                <Pressable style={[styles.primaryButton, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }]} onPress={handleContinueToStep2}>
                  <Text style={styles.primaryButtonText}>Continue to Details</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </Pressable>
              </View>
            ) : step === 2 ? (
              /* STEP 2: Workspace Details (matching website onboarding) */
              <View style={styles.stepContent}>
                {/* Personal Information Group */}
                <Text style={[styles.fieldCategoryLabel, isDark && styles.fieldCategoryLabelDark]}>
                  Profile Details
                </Text>
                <View style={[styles.inputGroup, isDark && styles.inputGroupDark]}>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={[styles.nativeInput, isDark && styles.nativeInputDark]}
                      placeholder="First Name *"
                      placeholderTextColor={colors.inputPlaceholder}
                      value={firstName}
                      onChangeText={setFirstName}
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                  </View>

                  <View style={[styles.hairlineDivider, isDark && styles.hairlineDividerDark]} />

                  <View style={styles.inputRow}>
                    <TextInput
                      style={[styles.nativeInput, isDark && styles.nativeInputDark]}
                      placeholder="Last Name *"
                      placeholderTextColor={colors.inputPlaceholder}
                      value={lastName}
                      onChangeText={setLastName}
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                  </View>

                  <View style={[styles.hairlineDivider, isDark && styles.hairlineDividerDark]} />

                  <View style={styles.inputRow}>
                    <TextInput
                      style={[styles.nativeInput, isDark && styles.nativeInputDark]}
                      placeholder="Mobile / WhatsApp Number"
                      placeholderTextColor={colors.inputPlaceholder}
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      returnKeyType="next"
                    />
                  </View>

                  <View style={[styles.hairlineDivider, isDark && styles.hairlineDividerDark]} />

                  <View style={styles.inputRow}>
                    <TextInput
                      style={[styles.nativeInput, isDark && styles.nativeInputDark]}
                      placeholder="State / Region (e.g. California, Delhi, Ontario)"
                      placeholderTextColor={colors.inputPlaceholder}
                      value={state}
                      onChangeText={setState}
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                  </View>
                </View>

                {/* Business Specific Details (when accountType === 'business') */}
                {accountType === 'business' && (
                  <>
                    <Text style={[styles.fieldCategoryLabel, isDark && styles.fieldCategoryLabelDark]}>
                      Organization Details
                    </Text>
                    <View style={[styles.inputGroup, isDark && styles.inputGroupDark]}>
                      <View style={styles.inputRow}>
                        <TextInput
                          style={[styles.nativeInput, isDark && styles.nativeInputDark]}
                          placeholder="Business / Company Name *"
                          placeholderTextColor={colors.inputPlaceholder}
                          value={businessName}
                          onChangeText={setBusinessName}
                          autoCapitalize="words"
                          returnKeyType="next"
                        />
                      </View>

                      <View style={[styles.hairlineDivider, isDark && styles.hairlineDividerDark]} />

                      <View style={styles.inputRow}>
                        <TextInput
                          style={[styles.nativeInput, isDark && styles.nativeInputDark]}
                          placeholder="Work / Business Email"
                          placeholderTextColor={colors.inputPlaceholder}
                          value={businessEmail}
                          onChangeText={setBusinessEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="next"
                        />
                      </View>
                    </View>

                    {/* Industry Category */}
                    <Text style={[styles.fieldCategoryLabel, isDark && styles.fieldCategoryLabelDark]}>
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
                    <Text style={[styles.fieldCategoryLabel, isDark && styles.fieldCategoryLabelDark]}>
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
                  </>
                )}

                {/* Referral Code Group */}
                <Text style={[styles.fieldCategoryLabel, isDark && styles.fieldCategoryLabelDark]}>
                  Referral Code
                </Text>
                <View style={[styles.inputGroup, isDark && styles.inputGroupDark]}>
                  <View style={[styles.inputRow, { flexDirection: 'row', alignItems: 'center' }]}>
                    <TextInput
                      style={[
                        styles.nativeInput,
                        isDark && styles.nativeInputDark,
                        { flex: 1, letterSpacing: referralCode ? 1.2 : 0 },
                      ]}
                      placeholder="Referral Code (Optional) - 5% Off"
                      placeholderTextColor={colors.inputPlaceholder}
                      value={referralCode}
                      onChangeText={(txt) => setReferralCode(txt.toUpperCase().trim())}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      returnKeyType="done"
                    />
                    {referralCode.trim().length >= 3 && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountBadgeText}>5% OFF</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Continue to Step 3 Button */}
                <Pressable style={styles.primaryButton} onPress={handleContinueToStep3}>
                  <Text style={styles.primaryButtonText}>Continue to Security & Alerts →</Text>
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
                    ← Back to Account Type
                  </Text>
                </Pressable>
              </View>
            ) : (
              /* STEP 3: Permissions & Security Setup */
              <View style={styles.stepContent}>
                <View style={[styles.permissionGroup, isDark && styles.permissionGroupDark]}>
                  {/* 1. Biometric / Face ID Card */}
                  <View style={styles.permissionRow}>
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
                        1-tap fast biometric access & encrypted local credentials
                      </Text>
                    </View>
                    <Switch
                      value={biometricSettings.enabled}
                      onValueChange={handleToggleBiometricInOnboarding}
                      disabled={isUpdatingBiometrics}
                      trackColor={{ false: isDark ? '#3A3A3C' : '#E9E6F2', true: '#10B981' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  <View style={[styles.hairlineDivider, isDark && styles.hairlineDividerDark]} />

                  {/* 2. Push Notifications Card */}
                  <View style={styles.permissionRow}>
                    <View style={[styles.permissionIconCircle, { backgroundColor: 'rgba(10, 132, 255, 0.15)' }]}>
                      <Ionicons name="notifications-outline" size={22} color="#0A84FF" />
                    </View>
                    <View style={styles.permissionTextBox}>
                      <Text style={[styles.permissionTitle, isDark && styles.permissionTitleDark]}>
                        Push Notifications
                      </Text>
                      <Text style={[styles.permissionDesc, isDark && styles.permissionDescDark]}>
                        Real-time alerts when new leads arrive & automations run
                      </Text>
                    </View>
                    <Switch
                      value={notificationsEnabled}
                      onValueChange={(val) => {
                        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                        setNotificationsEnabled(val);
                      }}
                      trackColor={{ false: isDark ? '#3A3A3C' : '#E9E6F2', true: '#0A84FF' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  <View style={[styles.hairlineDivider, isDark && styles.hairlineDividerDark]} />

                  {/* 3. Sensory Haptics */}
                  <View style={styles.permissionRow}>
                    <View style={[styles.permissionIconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                      <Ionicons name="phone-portrait-outline" size={22} color="#8B5CF6" />
                    </View>
                    <View style={styles.permissionTextBox}>
                      <Text style={[styles.permissionTitle, isDark && styles.permissionTitleDark]}>
                        Tactile Haptic Feedback
                      </Text>
                      <Text style={[styles.permissionDesc, isDark && styles.permissionDescDark]}>
                        Responsive tactile vibrations on buttons and actions
                      </Text>
                    </View>
                    <Switch
                      value={hapticsEnabled}
                      onValueChange={(val) => {
                        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                        setHapticsEnabled(val);
                      }}
                      trackColor={{ false: isDark ? '#3A3A3C' : '#E9E6F2', true: '#8B5CF6' }}
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
                    <Text style={styles.primaryButtonText}>Complete Setup & Enter Hub</Text>
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
                    ← Back to Workspace Details
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  signOutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  signOutText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  signOutTextDark: {
    color: '#9CA3AF',
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  skipText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
  },
  skipTextDark: {
    color: '#60A5FA',
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
  stepBadgeContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  stepBadge: {
    backgroundColor: '#F0EEF8',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  stepBadgeDark: {
    backgroundColor: '#252230',
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
    fontSize: 24,
    fontWeight: '700',
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
  stepContent: {
    gap: 14,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EEF8',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 14,
  },
  optionCardDark: {
    backgroundColor: '#252230',
  },
  optionCardActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#0084FF',
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  optionCardActiveDark: {
    backgroundColor: '#1E293B',
    borderColor: '#3B82F6',
  },
  optionIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  optionIconBoxDark: {
    backgroundColor: '#3A3549',
  },
  optionIconEmoji: {
    fontSize: 22,
  },
  optionTextBox: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  optionTitleDark: {
    color: '#FFFFFF',
  },
  optionDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  optionDescDark: {
    color: '#9CA3AF',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleDark: {
    borderColor: '#6B7280',
  },
  radioCircleActive: {
    backgroundColor: '#0084FF',
    borderColor: '#0084FF',
  },
  radioCheckmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  fieldCategoryLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
    marginTop: 4,
  },
  fieldCategoryLabelDark: {
    color: '#9CA3AF',
  },
  inputGroup: {
    backgroundColor: '#F0EEF8',
    borderRadius: 16,
    overflow: 'hidden',
  },
  inputGroupDark: {
    backgroundColor: '#252230',
  },
  inputRow: {
    paddingHorizontal: 16,
    minHeight: 52,
    justifyContent: 'center',
  },
  nativeInput: {
    fontSize: 15,
    color: '#000000',
    paddingVertical: 14,
  },
  nativeInputDark: {
    color: '#FFFFFF',
  },
  hairlineDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E9E6F2',
    marginLeft: 16,
  },
  hairlineDividerDark: {
    backgroundColor: '#3A3549',
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    backgroundColor: '#F0EEF8',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipDark: {
    backgroundColor: '#252230',
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
    backgroundColor: '#F0EEF8',
    borderRadius: 14,
    padding: 4,
  },
  segmentedControlDark: {
    backgroundColor: '#252230',
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
    backgroundColor: '#3A3549',
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
  discountBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 4,
  },
  discountBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#0084FF',
    paddingVertical: 15,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
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
    backgroundColor: '#F0EEF8',
    paddingVertical: 15,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonDark: {
    backgroundColor: '#252230',
  },
  secondaryButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  secondaryButtonTextDark: {
    color: '#FFFFFF',
  },
  permissionGroup: {
    backgroundColor: '#F0EEF8',
    borderRadius: 16,
    overflow: 'hidden',
  },
  permissionGroupDark: {
    backgroundColor: '#252230',
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  permissionDescDark: {
    color: '#9CA3AF',
  },
});
