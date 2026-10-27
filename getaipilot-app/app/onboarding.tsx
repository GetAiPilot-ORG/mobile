import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Building02Icon,
  UserIcon,
  CheckmarkCircle01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  Logout01Icon,
  SparklesIcon,
  ShieldCheckIcon,
  Notification01Icon,
  FaceIdIcon,
  ZapIcon,
  Briefcase01Icon,
  Mail01Icon,
} from '@hugeicons/core-free-icons';

import { getColors, useTheme } from '@/theme';
import { AnimatedAiLogo } from '../src/components/home/AnimatedAiLogo';
import { useAuth } from '../src/contexts/AuthContext';
import { useAuthStore } from '../src/core/store/authStore';
import { BiometricService, BiometricSettings } from '../src/lib/biometrics';
import { supabase } from '../src/lib/supabase';
import { isValidEmail } from '../src/lib/validators';
import { getPendingReferralCode, handlePendingReferral } from '../src/services/referralService';

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

export const generateReferralCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  let code = '';

  for (let i = 0; i < 8; i++) {
    code += chars.charAt(
      Math.floor(Math.random() * chars.length)
    );
  }

  return code;
};

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { user, refreshProfile } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [accountType, setAccountType] = useState<'business' | 'personal'>('business');

  // Animation values for smooth step transitions and card interactions
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

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
  const userEmail = user?.email || '';
  const isTruecaller = userEmail.endsWith('@truecaller.getaipilot.in');
  const isPhoneOrTruecaller = !userEmail || isTruecaller || !!(user as any)?.phone;

  const [email, setEmail] = useState(() => (user?.email && !isTruecaller ? user.email : ''));
  const [state, setState] = useState('');
  const [phone, setPhone] = useState((user as any)?.phone || '');
  const [businessName, setBusinessName] = useState('');
  const [businessEmail, setBusinessEmail] = useState(() => (user?.email && !isTruecaller ? user.email : ''));
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [teamSize, setTeamSize] = useState(TEAM_SIZES[0]);
  const [loading, setLoading] = useState(false);
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
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
  const isSubmittingRef = useRef(false);

  // Guard: strictly ensure user has confirmed their email before entering onboarding
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data?.user;
      if (u) {
        const isEmailAccount = u.email && !u.email.endsWith('@truecaller.getaipilot.in');
        if (isEmailAccount && !u.email_confirmed_at && !u.phone) {
          console.warn('[Onboarding] User email not confirmed yet -> redirecting to /verify-email');
          router.replace({
            pathname: '/(auth)/verify-email',
            params: { email: u.email || '' },
          } as any);
        }
      }
    }).catch(() => {});
  }, []);


  // Prefill phone and email if known (matching bot-dashboard)
  useEffect(() => {
    if (user) {
      if (user.email && !isTruecaller) {
        setEmail((prev) => prev || user.email || '');
        setBusinessEmail((prev) => prev || user.email || '');
      }
      if ((user as any)?.phone) {
        setPhone((prev: string) => prev || (user as any).phone || '');
      }
    }
  }, [user, isTruecaller]);

  useEffect(() => {
    async function loadBiometrics() {
      const settings = await BiometricService.getSettings();
      setBiometricSettings(settings);
    }
    loadBiometrics();
  }, []);

  useEffect(() => {
    const onBackPress = () => {
      if (loading || isSubmittingRef.current) return true;
      if (step === 3) {
        animateToStep(2);
        return true;
      }
      if (step === 2) {
        animateToStep(1);
        return true;
      }
      return true; // prevent exiting to protected tabs
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [step, loading]);

  const animateToStep = (nextStep: 1 | 2 | 3) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: nextStep > step ? -14 : 14,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(nextStep > step ? 14 : -14);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

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
    animateToStep(2);
  };

  const handleContinueToStep3 = async () => {
    Keyboard.dismiss();
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

    const targetEmail = (accountType === 'business' ? businessEmail : email || userEmail || '').trim().toLowerCase();

    // 1. Business email validation
    if (accountType === 'business') {
      if (!businessName.trim()) {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
        setError('Please provide your business or agency name.');
        return;
      }
      if (!targetEmail) {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
        setError('Please provide your work or business email.');
        return;
      }
      if (!isValidEmail(targetEmail)) {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
        setError('Please provide a valid business email address.');
        return;
      }
    } else {
      // 2. Personal email validation (Required for Phone/Truecaller user, matching bot-dashboard)
      if (isPhoneOrTruecaller && !targetEmail) {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
        setError('Please provide your email address for account recovery.');
        return;
      }
      if (targetEmail && !isValidEmail(targetEmail)) {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
        setError('Please provide a valid email address.');
        return;
      }
    }

    // 3. Email & Phone Uniqueness Check via Supabase RPC (matching bot-dashboard)
    setIsValidatingEmail(true);
    setError(null);

    try {
      // Retrieve current session user email reliably
      let currentAccountEmail = (user?.email || userEmail || '').trim().toLowerCase();
      let currentAccountId = user?.id;
      if (!currentAccountEmail || !currentAccountId) {
        const { data: currentAuth } = await supabase.auth.getUser();
        if (currentAuth?.user) {
          currentAccountEmail = (currentAuth.user.email || '').trim().toLowerCase();
          currentAccountId = currentAuth.user.id;
        }
      }

      if (targetEmail && targetEmail !== currentAccountEmail) {
        const { data: emailTaken, error: rpcEmailErr } = await supabase.rpc('check_email_exists', {
          email_to_check: targetEmail,
        });
        if (!rpcEmailErr && emailTaken) {
          triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
          setError('This email address is already registered with another account. Please use a different email.');
          setIsValidatingEmail(false);
          return;
        }
      }

      const cleanPhone = phone.trim();
      if (cleanPhone) {
        const { data: phoneTaken, error: rpcPhoneErr } = await supabase.rpc('check_phone_exists', {
          phone_to_check: cleanPhone,
          exclude_user_id: currentAccountId || user?.id,
        });
        if (!rpcPhoneErr && phoneTaken) {
          triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
          setError('This phone number is already registered with another account. Please use your own unique phone number.');
          setIsValidatingEmail(false);
          return;
        }
      }
    } catch (verifyErr) {
      console.warn('[Onboarding] check_email_exists notice:', verifyErr);
    } finally {
      setIsValidatingEmail(false);
    }

    setError(null);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    animateToStep(3);
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
        BiometricService.authenticate(`Enable ${updated.biometricLabel} for GetAiPilot`).catch((e) =>
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

    // 1. Double-tap & concurrency lock
    if (loading || isSubmittingRef.current) return;

    // 2. Validate essential fields before committing to database
    if (!firstName.trim() || !lastName.trim()) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      setError('Please provide your first and last name.');
      animateToStep(2);
      return;
    }
    if (accountType === 'business' && !businessName.trim()) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      setError('Please provide your business or agency name.');
      animateToStep(2);
      return;
    }

    const targetEmail = (accountType === 'business' ? businessEmail : email || userEmail || '').trim().toLowerCase();
    if ((isPhoneOrTruecaller || accountType === 'business') && !targetEmail) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      setError('Please provide a valid email address.');
      animateToStep(2);
      return;
    }

    // 3. Ensure valid active user session
    let userId = user?.id;
    let activeUserEmail = user?.email;
    if (!userId) {
      const { data: sessionData } = await supabase.auth.getSession();
      userId = sessionData?.session?.user?.id;
      activeUserEmail = sessionData?.session?.user?.email;
    }
    if (!userId) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      setError('Your session has expired. Please log in again.');
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    setError(null);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Save local device preferences
      await AsyncStorage.setItem('@pref_push', notificationsEnabled ? 'true' : 'false');
      await AsyncStorage.setItem('@pref_haptics', hapticsEnabled ? 'true' : 'false');

      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim() || targetEmail?.split('@')[0] || activeUserEmail?.split('@')[0];

      // ---- REFERRAL CODE: reuse existing if present, else generate (matching bot-dashboard) ----
      const { data: existingProfile, error: existingProfileError } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', userId)
        .maybeSingle();

      if (existingProfileError) {
        console.warn('[Onboarding] Could not fetch existing profile:', existingProfileError);
      }

      let referralCode = existingProfile?.referral_code ?? null;

      if (!referralCode) {
        referralCode = generateReferralCode();
        console.log('[Onboarding] Generated new referral code for user:', referralCode);
      } else {
        console.log('[Onboarding] Reusing existing referral code:', referralCode);
      }

      const cachedPushToken = await AsyncStorage.getItem('@getaipilot_expo_push_token');

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: userId,
            first_name: firstName.trim() || null,
            last_name: lastName.trim() || null,
            full_name: fullName,
            email: targetEmail || activeUserEmail || null,
            account_type: accountType,
            business_name: accountType === 'business' ? (businessName.trim() || null) : null,
            business_email: accountType === 'business' ? (targetEmail || null) : null,
            state: state.trim() || null,
            category: accountType === 'business' ? category : null,
            team_size: accountType === 'business' ? teamSize : '1',
            phone: phone.trim() || null,
            push_token: notificationsEnabled ? cachedPushToken : null,
            referral_code: referralCode,
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (updateError) throw updateError;

      // Update email in auth.users if user joined via Phone or Truecaller (matching bot-dashboard)
      if (targetEmail && isPhoneOrTruecaller && targetEmail !== (activeUserEmail || '').toLowerCase()) {
        try {
          await supabase.auth.updateUser({ email: targetEmail });
          console.log('[Onboarding] Updated auth user email to:', targetEmail);
        } catch (authEmailErr) {
          console.warn('[Onboarding] Notice updating auth user email:', authEmailErr);
        }
      }

      useAuthStore.getState().setOnboardingCompleted(true);

      // Link pending referral code if user arrived via invite link
      try {
        const pendingRef = await getPendingReferralCode();
        if (pendingRef) {
          await handlePendingReferral(pendingRef);
        }
      } catch (refErr) {
        console.warn('[Onboarding] Referral linking error:', refErr);
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
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, isDark && styles.containerDark]}
      >
        {/* Ambient Top Glow Orbs */}
        <View pointerEvents="none" style={styles.ambientGlowContainer}>
          <LinearGradient
            colors={
              isDark
                ? ['rgba(59, 130, 246, 0.16)', 'rgba(139, 92, 246, 0.08)', 'transparent']
                : ['rgba(59, 130, 246, 0.12)', 'rgba(167, 139, 250, 0.06)', 'transparent']
            }
            style={styles.ambientTopGlow}
          />
        </View>

        <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingTop: Math.max(insets.top + 12, 36),
                paddingBottom: Math.max(insets.bottom + 28, 36),
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Header Bar: Navigation */}
            <View style={styles.topBar}>
              {step > 1 ? (
                <TouchableOpacity
                  disabled={loading}
                  onPress={() => {
                    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                    animateToStep((step - 1) as 1 | 2);
                  }}
                  hitSlop={8}
                  style={[styles.navPillBtn, isDark && styles.navPillBtnDark, loading && { opacity: 0.5 }]}
                >
                  <HugeiconsIcon
                    icon={ArrowLeft01Icon}
                    size={14}
                    color={isDark ? '#94A3B8' : '#64748B'}
                    strokeWidth={2}
                  />
                  <Text style={[styles.navBtnText, isDark && styles.navBtnTextDark]}>Back</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ width: 40 }} />
              )}

              <TouchableOpacity
                disabled={loading}
                onPress={async () => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                  await useAuthStore.getState().logout();
                  router.replace('/(auth)/login' as any);
                }}
                hitSlop={8}
                style={[styles.navPillBtn, isDark && styles.navPillBtnDark, loading && { opacity: 0.5 }]}
              >
                <HugeiconsIcon
                  icon={Logout01Icon}
                  size={14}
                  color={isDark ? '#94A3B8' : '#64748B'}
                  strokeWidth={2}
                />
                <Text style={[styles.navBtnText, isDark && styles.navBtnTextDark]}>Sign out</Text>
              </TouchableOpacity>
            </View>

            {/* 2. Brand Hero: Living AI Logo + Step Badge + Typography */}
            <View style={styles.heroSection}>
              <View style={[styles.aiLogoHalo, isDark && styles.aiLogoHaloDark]}>
                <AnimatedAiLogo size={70} isDark={isDark} />
              </View>

              <View style={[styles.stepPillBadge, isDark && styles.stepPillBadgeDark]}>
                <View style={styles.stepPulseDot} />
                <Text style={[styles.stepPillText, isDark && styles.stepPillTextDark]}>
                  STEP {step} OF 3 • {step === 1 ? 'ACCOUNT PROFILE' : step === 2 ? 'WORKSPACE SETUP' : 'SECURITY & ALERTS'}
                </Text>
              </View>

              <Text style={[styles.heroHeading, isDark && styles.heroHeadingDark]}>
                {step === 1 ? 'Choose Account Type' : step === 2 ? 'Configure Workspace' : 'Security & Permissions'}
              </Text>
              <Text style={[styles.heroSubheading, isDark && styles.heroSubheadingDark]}>
                {step === 1
                  ? 'Tailor your AI workspace engines according to your specific needs'
                  : step === 2
                    ? 'Set up your default workspace profile and automation contact information'
                    : 'Authorize device security and real-time alerts for an optimal experience'}
              </Text>
            </View>

            {/* Inline Error Notice */}
            {error && (
              <View style={[styles.errorBanner, isDark && styles.errorBannerDark]}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            {/* Animated Step Body Content */}
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              {step === 1 ? (
                /* ========================================================
                   STEP 1: Premium Account Type Selection Cards
                   ======================================================== */
                <View style={styles.stepContent}>
                  {/* Option 1: Business / Agency Card */}
                  <TouchableOpacity
                    style={[
                      styles.accountCard,
                      accountType === 'business' && styles.accountCardActiveBusiness,
                      isDark && styles.accountCardDark,
                      isDark && accountType === 'business' && styles.accountCardActiveBusinessDark,
                    ]}
                    onPress={() => handleSelectAccountType('business')}
                  >
                    {/* Top Row: Icon Squircle + Title + Badge + Selector */}
                    <View style={styles.cardHeaderRow}>
                      <LinearGradient
                        colors={
                          accountType === 'business'
                            ? ['#2563EB', '#1D4ED8']
                            : isDark
                              ? ['#2C2B38', '#201F2B']
                              : ['#F1F5F9', '#E2E8F0']
                        }
                        style={styles.cardIconSquircle}
                      >
                        <HugeiconsIcon
                          icon={Building02Icon}
                          size={24}
                          color={accountType === 'business' ? '#FFFFFF' : isDark ? '#94A3B8' : '#475569'}
                          strokeWidth={2}
                        />
                      </LinearGradient>

                      <View style={styles.cardHeaderCol}>
                        <View style={styles.cardTitleTagRow}>
                          <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>
                            Business / Agency
                          </Text>
                          <View style={styles.popularTagPill}>
                            <Text style={styles.popularTagText}>RECOMMENDED</Text>
                          </View>
                        </View>
                        <Text style={[styles.cardSubtitle, isDark && styles.cardSubtitleDark]}>
                          For marketing teams, agencies, and businesses managing multiple automation channels
                        </Text>
                      </View>

                      {/* Selector Radio / Checked Indicator */}
                      <View
                        style={[
                          styles.selectorCircle,
                          accountType === 'business' && styles.selectorCircleActiveBusiness,
                          isDark && styles.selectorCircleDark,
                        ]}
                      >
                        {accountType === 'business' ? (
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={22} color="#2563EB" strokeWidth={2.4} />
                        ) : null}
                      </View>
                    </View>

                    {/* Feature Micro-Badges Row */}
                    <View style={styles.featurePillsRow}>
                      <View style={[styles.featurePill, isDark && styles.featurePillDark]}>
                        <HugeiconsIcon icon={ZapIcon} size={11} color="#2563EB" strokeWidth={2.2} />
                        <Text style={[styles.featurePillText, isDark && styles.featurePillTextDark]}>
                          Multi-Bot Relays
                        </Text>
                      </View>
                      <View style={[styles.featurePill, isDark && styles.featurePillDark]}>
                        <HugeiconsIcon icon={Briefcase01Icon} size={11} color="#2563EB" strokeWidth={2.2} />
                        <Text style={[styles.featurePillText, isDark && styles.featurePillTextDark]}>
                          Smart CRM Sync
                        </Text>
                      </View>
                      <View style={[styles.featurePill, isDark && styles.featurePillDark]}>
                        <HugeiconsIcon icon={SparklesIcon} size={11} color="#2563EB" strokeWidth={2.2} />
                        <Text style={[styles.featurePillText, isDark && styles.featurePillTextDark]}>
                          Meta Cloud API
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Option 2: Creator / Individual Card */}
                  <TouchableOpacity
                    style={[
                      styles.accountCard,
                      accountType === 'personal' && styles.accountCardActivePersonal,
                      isDark && styles.accountCardDark,
                      isDark && accountType === 'personal' && styles.accountCardActivePersonalDark,
                    ]}
                    onPress={() => handleSelectAccountType('personal')}
                  >
                    {/* Top Row: Icon Squircle + Title + Badge + Selector */}
                    <View style={styles.cardHeaderRow}>
                      <LinearGradient
                        colors={
                          accountType === 'personal'
                            ? ['#8B5CF6', '#6D28D9']
                            : isDark
                              ? ['#2C2B38', '#201F2B']
                              : ['#F1F5F9', '#E2E8F0']
                        }
                        style={styles.cardIconSquircle}
                      >
                        <HugeiconsIcon
                          icon={UserIcon}
                          size={24}
                          color={accountType === 'personal' ? '#FFFFFF' : isDark ? '#94A3B8' : '#475569'}
                          strokeWidth={2}
                        />
                      </LinearGradient>

                      <View style={styles.cardHeaderCol}>
                        <View style={styles.cardTitleTagRow}>
                          <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>
                            Creator / Individual
                          </Text>
                          <View style={styles.soloTagPill}>
                            <Text style={styles.soloTagText}>SOLO & CREATOR</Text>
                          </View>
                        </View>
                        <Text style={[styles.cardSubtitle, isDark && styles.cardSubtitleDark]}>
                          For solo founders, content creators, and community managers
                        </Text>
                      </View>

                      {/* Selector Radio / Checked Indicator */}
                      <View
                        style={[
                          styles.selectorCircle,
                          accountType === 'personal' && styles.selectorCircleActivePersonal,
                          isDark && styles.selectorCircleDark,
                        ]}
                      >
                        {accountType === 'personal' ? (
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={22} color="#8B5CF6" strokeWidth={2.4} />
                        ) : null}
                      </View>
                    </View>

                    {/* Feature Micro-Badges Row */}
                    <View style={styles.featurePillsRow}>
                      <View style={[styles.featurePill, isDark && styles.featurePillDark]}>
                        <HugeiconsIcon icon={SparklesIcon} size={11} color="#8B5CF6" strokeWidth={2.2} />
                        <Text style={[styles.featurePillText, isDark && styles.featurePillTextDark]}>
                          Bio & Link Builder
                        </Text>
                      </View>
                      <View style={[styles.featurePill, isDark && styles.featurePillDark]}>
                        <HugeiconsIcon icon={ZapIcon} size={11} color="#8B5CF6" strokeWidth={2.2} />
                        <Text style={[styles.featurePillText, isDark && styles.featurePillTextDark]}>
                          Social Auto-Post
                        </Text>
                      </View>
                      <View style={[styles.featurePill, isDark && styles.featurePillDark]}>
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={11} color="#8B5CF6" strokeWidth={2.2} />
                        <Text style={[styles.featurePillText, isDark && styles.featurePillTextDark]}>
                          Quick Lead Forms
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Primary CTA Button */}
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={handleContinueToStep2}
                    style={styles.primaryCtaWrapper}
                  >
                    <LinearGradient
                      colors={
                        accountType === 'business'
                          ? ['#2563EB', '#1D4ED8']
                          : ['#8B5CF6', '#7C3AED']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.primaryCtaGradient}
                    >
                      <Text style={styles.primaryCtaText}>Continue to Details</Text>
                      <View style={styles.primaryCtaIconCircle}>
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          size={15}
                          color="#FFFFFF"
                          strokeWidth={2.4}
                        />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : step === 2 ? (
                /* ========================================================
                   STEP 2: Workspace Details (matching website onboarding)
                   ======================================================== */
                <View style={styles.stepContent}>
                  {/* Profile Details Group */}
                  <View style={styles.sectionHeaderRow}>
                    <HugeiconsIcon icon={UserIcon} size={16} color={colors.accent} strokeWidth={2} />
                    <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
                      Profile Information
                    </Text>
                  </View>

                  <View style={[styles.glassInputCard, isDark && styles.glassInputCardDark]}>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={[styles.nativeInput, isDark && styles.nativeInputDark]}
                        placeholder="First Name *"
                        placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
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
                        placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                        value={lastName}
                        onChangeText={setLastName}
                        autoCapitalize="words"
                        returnKeyType="next"
                      />
                    </View>

                    {/* Email Input - matching bot-dashboard (Required for Phone & Truecaller signups) */}
                    <View style={[styles.hairlineDivider, isDark && styles.hairlineDividerDark]} />

                    <View style={styles.inputRow}>
                      <TextInput
                        style={[styles.nativeInput, isDark && styles.nativeInputDark]}
                        placeholder={
                          isPhoneOrTruecaller
                            ? 'Email Address (Required for Recovery) *'
                            : 'Email Address'
                        }
                        placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="next"
                      />
                    </View>

                    <View style={[styles.hairlineDivider, isDark && styles.hairlineDividerDark]} />

                    <View style={styles.inputRow}>
                      <TextInput
                        style={[styles.nativeInput, isDark && styles.nativeInputDark]}
                        placeholder="Mobile / WhatsApp Number"
                        placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
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
                        placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
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
                      <View style={[styles.sectionHeaderRow, { marginTop: 10 }]}>
                        <HugeiconsIcon icon={Building02Icon} size={16} color={colors.accent} strokeWidth={2} />
                        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
                          Organization Details
                        </Text>
                      </View>

                      <View style={[styles.glassInputCard, isDark && styles.glassInputCardDark]}>
                        <View style={styles.inputRow}>
                          <TextInput
                            style={[styles.nativeInput, isDark && styles.nativeInputDark]}
                            placeholder="Business / Company Name *"
                            placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
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
                            placeholder="Work / Business Email *"
                            placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
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
                      <Text style={[styles.subSectionTitle, isDark && styles.subSectionTitleDark]}>
                        Industry Category
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.chipsScrollContent}
                      >
                        {CATEGORIES.map((cat) => {
                          const isSelected = category === cat;
                          return (
                            <TouchableOpacity
                              key={cat}
                              style={[
                                styles.categoryChip,
                                isSelected && styles.categoryChipActive,
                                isDark && styles.categoryChipDark,
                                isDark && isSelected && styles.categoryChipActiveDark,
                              ]}
                              onPress={() => {
                                triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                                setCategory(cat);
                              }}
                            >
                              <Text
                                style={[
                                  styles.categoryChipText,
                                  isSelected && styles.categoryChipTextActive,
                                  isDark && styles.categoryChipTextDark,
                                ]}
                              >
                                {cat}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>

                      {/* Team Size Segmented Control */}
                      <Text style={[styles.subSectionTitle, isDark && styles.subSectionTitleDark]}>
                        Team Size
                      </Text>
                      <View style={[styles.segmentedWrapper, isDark && styles.segmentedWrapperDark]}>
                        {TEAM_SIZES.map((size) => {
                          const isSelected = teamSize === size;
                          return (
                            <TouchableOpacity
                              key={size}
                              style={[
                                styles.segmentPill,
                                isSelected && styles.segmentPillActive,
                                isDark && styles.segmentPillDark,
                                isDark && isSelected && styles.segmentPillActiveDark,
                              ]}
                              onPress={() => {
                                triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                                setTeamSize(size);
                              }}
                            >
                              <Text
                                style={[
                                  styles.segmentPillText,
                                  isSelected && styles.segmentPillTextActive,
                                  isDark && styles.segmentPillTextDark,
                                ]}
                              >
                                {size}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </>
                  )}

                  {/* Continue Button */}
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={handleContinueToStep3}
                    disabled={isValidatingEmail || loading}
                    style={[styles.primaryCtaWrapper, (isValidatingEmail || loading) && { opacity: 0.85 }]}
                  >
                    <LinearGradient
                      colors={['#2563EB', '#1D4ED8']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.primaryCtaGradient}
                    >
                      {isValidatingEmail ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Text style={styles.primaryCtaText}>Continue to Security & Alerts</Text>
                          <View style={styles.primaryCtaIconCircle}>
                            <HugeiconsIcon icon={ArrowRight01Icon} size={15} color="#FFFFFF" strokeWidth={2.4} />
                          </View>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Back to Step 1 Button */}
                  <TouchableOpacity
                    style={[styles.backNavBtn, isDark && styles.backNavBtnDark]}
                    onPress={() => {
                      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                      animateToStep(1);
                    }}
                  >
                    <HugeiconsIcon
                      icon={ArrowLeft01Icon}
                      size={15}
                      color={isDark ? '#94A3B8' : '#64748B'}
                      strokeWidth={2}
                    />
                    <Text style={[styles.backNavBtnText, isDark && styles.backNavBtnTextDark]}>
                      Back to Account Type
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* ========================================================
                   STEP 3: Permissions & Security Setup
                   ======================================================== */
                <View style={styles.stepContent}>
                  <View style={[styles.permissionCardGroup, isDark && styles.permissionCardGroupDark]}>
                    {/* 1. Biometric / Face ID Card */}
                    <View style={styles.permissionItemRow}>
                      <LinearGradient
                        colors={['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.08)']}
                        style={styles.permissionIconSurface}
                      >
                        <HugeiconsIcon
                          icon={
                            biometricSettings.biometricType === 'FACE_ID'
                              ? FaceIdIcon
                              : ShieldCheckIcon
                          }
                          size={22}
                          color="#10B981"
                          strokeWidth={2}
                        />
                      </LinearGradient>
                      <View style={styles.permissionContentCol}>
                        <Text style={[styles.permissionHeading, isDark && styles.permissionHeadingDark]}>
                          {biometricSettings.biometricLabel} Lock
                        </Text>
                        <Text style={[styles.permissionDetails, isDark && styles.permissionDetailsDark]}>
                          1-tap fast biometric access & encrypted local credentials
                        </Text>
                      </View>
                      <Switch
                        value={biometricSettings.enabled}
                        onValueChange={handleToggleBiometricInOnboarding}
                        disabled={isUpdatingBiometrics || loading}
                        trackColor={{ false: isDark ? '#334155' : '#E2E8F0', true: '#10B981' }}
                        thumbColor="#FFFFFF"
                      />
                    </View>

                    <View style={[styles.hairlineDivider, isDark && styles.hairlineDividerDark]} />

                    {/* 2. Push Notifications Card */}
                    <View style={styles.permissionItemRow}>
                      <LinearGradient
                        colors={['rgba(37, 99, 235, 0.2)', 'rgba(37, 99, 235, 0.08)']}
                        style={styles.permissionIconSurface}
                      >
                        <HugeiconsIcon icon={Notification01Icon} size={22} color="#2563EB" strokeWidth={2} />
                      </LinearGradient>
                      <View style={styles.permissionContentCol}>
                        <Text style={[styles.permissionHeading, isDark && styles.permissionHeadingDark]}>
                          Push Notifications
                        </Text>
                        <Text style={[styles.permissionDetails, isDark && styles.permissionDetailsDark]}>
                          Real-time alerts when new leads arrive & automations run
                        </Text>
                      </View>
                      <Switch
                        value={notificationsEnabled}
                        disabled={loading}
                        onValueChange={(val) => {
                          triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                          setNotificationsEnabled(val);
                        }}
                        trackColor={{ false: isDark ? '#334155' : '#E2E8F0', true: '#2563EB' }}
                        thumbColor="#FFFFFF"
                      />
                    </View>

                    <View style={[styles.hairlineDivider, isDark && styles.hairlineDividerDark]} />

                    {/* 3. Sensory Haptics Card */}
                    <View style={styles.permissionItemRow}>
                      <LinearGradient
                        colors={['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.08)']}
                        style={styles.permissionIconSurface}
                      >
                        <HugeiconsIcon icon={ZapIcon} size={22} color="#8B5CF6" strokeWidth={2} />
                      </LinearGradient>
                      <View style={styles.permissionContentCol}>
                        <Text style={[styles.permissionHeading, isDark && styles.permissionHeadingDark]}>
                          Tactile Haptic Feedback
                        </Text>
                        <Text style={[styles.permissionDetails, isDark && styles.permissionDetailsDark]}>
                          Responsive tactile vibrations on buttons and actions
                        </Text>
                      </View>
                      <Switch
                        value={hapticsEnabled}
                        disabled={loading}
                        onValueChange={(val) => {
                          triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                          setHapticsEnabled(val);
                        }}
                        trackColor={{ false: isDark ? '#334155' : '#E2E8F0', true: '#8B5CF6' }}
                        thumbColor="#FFFFFF"
                      />
                    </View>
                  </View>

                  {/* Complete Setup Primary CTA */}
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={handleCompleteOnboarding}
                    disabled={loading}
                    style={[styles.primaryCtaWrapper, loading && { opacity: 0.85 }]}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.primaryCtaGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Text style={styles.primaryCtaText}>Complete Workspace Setup</Text>
                          <View style={styles.primaryCtaIconCircle}>
                            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} color="#FFFFFF" strokeWidth={2.4} />
                          </View>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Back to Step 2 Button */}
                  <TouchableOpacity
                    disabled={loading}
                    style={[styles.backNavBtn, isDark && styles.backNavBtnDark, loading && { opacity: 0.5 }]}
                    onPress={() => {
                      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                      animateToStep(2);
                    }}
                  >
                    <HugeiconsIcon
                      icon={ArrowLeft01Icon}
                      size={15}
                      color={isDark ? '#94A3B8' : '#64748B'}
                      strokeWidth={2}
                    />
                    <Text style={[styles.backNavBtnText, isDark && styles.backNavBtnTextDark]}>
                      Back to Workspace Details
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  containerDark: {
    backgroundColor: '#0D0E15',
  },
  ambientGlowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 380,
    overflow: 'hidden',
  },
  ambientTopGlow: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },

  /* Top Navigation Bar */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  navPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 0.1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  navPillBtnDark: {
    backgroundColor: 'rgba(28, 29, 41, 0.75)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  navBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  navBtnTextDark: {
    color: '#94A3B8',
  },
  skipBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  skipBtnTextDark: {
    color: '#60A5FA',
  },

  /* 3-Step Segments Indicator */
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperSegment: {
    width: 18,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
  },
  stepperSegmentDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  stepperSegmentActive: {
    width: 32,
    backgroundColor: '#2563EB',
  },
  stepperSegmentActiveDark: {
    width: 32,
    backgroundColor: '#60A5FA',
  },
  stepperSegmentCompleted: {
    width: 20,
    backgroundColor: '#10B981',
  },
  stepperSegmentCompletedDark: {
    width: 20,
    backgroundColor: '#10B981',
  },

  /* Brand Hero Section */
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  aiLogoHalo: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 0.1,
    borderColor: 'rgba(59, 130, 246, 0.18)',
    marginBottom: 16,
  },
  aiLogoHaloDark: {
    backgroundColor: 'rgba(28, 29, 41, 0.65)',
    borderColor: 'rgba(96, 165, 250, 0.24)',
    shadowOpacity: 0.28,
  },
  stepPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderWidth: 0.1,
    borderColor: 'rgba(37, 99, 235, 0.18)',
    marginBottom: 10,
  },
  stepPillBadgeDark: {
    backgroundColor: 'rgba(96, 165, 250, 0.12)',
    borderColor: 'rgba(96, 165, 250, 0.22)',
  },
  stepPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
  },
  stepPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.8,
  },
  stepPillTextDark: {
    color: '#60A5FA',
  },
  heroHeading: {
    fontSize: 27,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 33,
    letterSpacing: -0.7,
    marginBottom: 6,
  },
  heroHeadingDark: {
    color: '#FFFFFF',
  },
  heroSubheading: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 14,
  },
  heroSubheadingDark: {
    color: '#94A3B8',
  },

  /* Error Banner */
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 0.1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  errorBannerDark: {
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  errorBannerText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },

  /* Step Content Wrapper */
  stepContent: {
    gap: 14,
    marginTop: 4,
  },

  /* ========================================================
     Account Type Selection Cards (Step 1)
     ======================================================== */
  accountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 0.1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  accountCardDark: {
    backgroundColor: '#151622',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
  },
  accountCardActiveBusiness: {
    borderColor: '#2563EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#2563EB',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 4,
  },
  accountCardActiveBusinessDark: {
    backgroundColor: '#141829',
    borderColor: '#3B82F6',
    shadowOpacity: 0.35,
  },
  accountCardActivePersonal: {
    borderColor: '#8B5CF6',
    backgroundColor: '#FFFFFF',
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 4,
  },
  accountCardActivePersonalDark: {
    backgroundColor: '#1B1429',
    borderColor: '#A855F7',
    shadowOpacity: 0.35,
  },

  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardIconSquircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderCol: {
    flex: 1,
    gap: 3,
  },
  cardTitleTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: '#0F172A',
  },
  cardTitleDark: {
    color: '#FFFFFF',
  },
  popularTagPill: {
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  popularTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.5,
  },
  soloTagPill: {
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  soloTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8B5CF6',
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 12,
    lineHeight: 16.5,
    color: '#64748B',
  },
  cardSubtitleDark: {
    color: '#94A3B8',
  },
  selectorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 0.1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  selectorCircleDark: {
    borderColor: '#475569',
  },
  selectorCircleActiveBusiness: {
    borderColor: '#2563EB',
    borderWidth: 0,
  },
  selectorCircleActivePersonal: {
    borderColor: '#8B5CF6',
    borderWidth: 0,
  },

  featurePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 0.1,
    borderColor: '#E2E8F0',
  },
  featurePillDark: {
    backgroundColor: '#1E2030',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  featurePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  featurePillTextDark: {
    color: '#CBD5E1',
  },

  /* Primary High-Impact CTA Button */
  primaryCtaWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 8,
  },
  primaryCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  primaryCtaIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Back Button */
  backNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.1,
    borderColor: '#E2E8F0',
  },
  backNavBtnDark: {
    backgroundColor: '#151622',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  backNavBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  backNavBtnTextDark: {
    color: '#CBD5E1',
  },

  /* ========================================================
     Step 2: Workspace Details Components
     ======================================================== */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    marginBottom: -4,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: -0.2,
  },
  sectionTitleDark: {
    color: '#F1F5F9',
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginTop: 4,
  },
  subSectionTitleDark: {
    color: '#94A3B8',
  },
  glassInputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 0.1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  glassInputCardDark: {
    backgroundColor: '#151622',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  inputRow: {
    paddingHorizontal: 16,
    minHeight: 50,
    justifyContent: 'center',
  },
  nativeInput: {
    fontSize: 14.5,
    color: '#0F172A',
    paddingVertical: 13,
  },
  nativeInputDark: {
    color: '#FFFFFF',
  },
  hairlineDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F1F5F9',
    marginLeft: 16,
  },
  hairlineDividerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },

  /* Chips */
  chipsScrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  categoryChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
    borderWidth: 0.1,
    borderColor: '#E2E8F0',
  },
  categoryChipDark: {
    backgroundColor: '#151622',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  categoryChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  categoryChipActiveDark: {
    backgroundColor: '#172554',
    borderColor: '#3B82F6',
  },
  categoryChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  categoryChipTextDark: {
    color: '#94A3B8',
  },
  categoryChipTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },

  /* Segmented Control */
  segmentedWrapper: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    borderWidth: 0.1,
    borderColor: '#E2E8F0',
  },
  segmentedWrapperDark: {
    backgroundColor: '#151622',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  segmentPill: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 12,
  },
  segmentPillDark: {},
  segmentPillActive: {
    backgroundColor: '#2563EB',
  },
  segmentPillActiveDark: {
    backgroundColor: '#3B82F6',
  },
  segmentPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentPillTextDark: {
    color: '#94A3B8',
  },
  segmentPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  discountBadgePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  /* ========================================================
     Step 3: Security & Permissions Components
     ======================================================== */
  permissionCardGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 0.1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  permissionCardGroupDark: {
    backgroundColor: '#151622',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  permissionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  permissionIconSurface: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionContentCol: {
    flex: 1,
    gap: 2,
  },
  permissionHeading: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  permissionHeadingDark: {
    color: '#FFFFFF',
  },
  permissionDetails: {
    fontSize: 11.5,
    lineHeight: 16,
    color: '#64748B',
  },
  permissionDetailsDark: {
    color: '#94A3B8',
  },
});
