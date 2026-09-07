import React, { useState } from 'react';
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
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/contexts/AuthContext';

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

  const [step, setStep] = useState<1 | 2>(1);
  const [accountType, setAccountType] = useState<'business' | 'personal'>('business');
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [teamSize, setTeamSize] = useState(TEAM_SIZES[0]);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
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

  const handleCompleteOnboarding = async () => {
    Keyboard.dismiss();
    if (!user) return;
    setError(null);

    if (accountType === 'business' && !businessName.trim()) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      setError('Please provide your business or agency name.');
      return;
    }

    setLoading(true);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    try {
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
                Step {step} of 2 • {step === 1 ? 'Account Type' : 'Workspace Details'}
              </Text>
            </View>
          </View>

          {/* Heading & Subtitle */}
          <Text style={[styles.heading, isDark && styles.headingDark]}>
            {step === 1 ? 'Choose Account Type' : 'Configure Workspace'}
          </Text>
          <Text style={[styles.subheading, isDark && styles.subheadingDark]}>
            {step === 1
              ? 'Tailor your AI workspace engines according to your needs'
              : 'Set up your default workspace profile and automation channels'}
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
          ) : (
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
                  <>
                    <View style={[styles.hairlineDivider, isDark && styles.hairlineDividerDark]} />
                    <View style={styles.inputRow}>
                      <TextInput
                        style={[styles.nativeInput, isDark && styles.nativeInputDark]}
                        placeholder="Business / Company Name *"
                        placeholderTextColor={isDark ? '#636366' : '#8E8E93'}
                        value={businessName}
                        onChangeText={setBusinessName}
                        autoCapitalize="words"
                        returnKeyType="next"
                      />
                    </View>
                  </>
                )}

                <View style={[styles.hairlineDivider, isDark && styles.hairlineDividerDark]} />
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.nativeInput, isDark && styles.nativeInputDark]}
                    placeholder="Phone Number (Optional)"
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
                Primary Industry / Focus
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

              {/* Complete Onboarding Button */}
              <Pressable
                style={[styles.primaryButton, loading && { opacity: 0.8 }]}
                onPress={handleCompleteOnboarding}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Complete Setup & Enter Hub →</Text>
                )}
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
});
