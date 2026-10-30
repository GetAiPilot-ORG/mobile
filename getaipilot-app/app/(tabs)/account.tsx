import React, { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useTheme, getColors } from '@/theme';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiClient } from '../../src/core/api/client';
import { usePlatformSubscription } from '../../src/hooks/usePlatformSubscription';
import { useNotifications } from '../../src/hooks/useNotifications';
import { BiometricService, BiometricSettings } from '../../src/lib/biometrics';
import { supabase } from '../../src/lib/supabase';
import { Profile } from '../../src/types/database';
import { useThemedDialog } from '@/components';
import { soundService } from '../../src/services/soundFeedbackService';
import { SoundFeedbackDemoModal } from '../../src/components/dev/SoundFeedbackDemoModal';

import {
  AccountHeader,
  AccountTabsNav,
  AccountTab,
  OverviewTab,
  EditProfileTab,
  SecurityTab,
  BillingTab,
  SettingsTab,
  InvoiceReceiptModal,
  getAccountPalette,
  DeviceSession,
} from '../../src/features/account/components';

interface DeviceSessionsResponse {
  activeDeviceCount: number;
  devices: DeviceSession[];
}

export default function AccountScreen() {
  const router = useRouter();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const { isDark, themeMode, setThemeMode } = useTheme();
  const colors = getColors(isDark);
  const palette = getAccountPalette(isDark);

  const { user, signOut } = useAuth();
  const { isAdmin, planLabel, isActive, plan } = usePlatformSubscription();
  const {
    expoPushToken,
    permissionGranted,
    requestPermissions,
    isDevice,
  } = useNotifications();
  const queryClient = useQueryClient();
  const { confirmLogout, confirm: confirmDialog, showAlert } = useThemedDialog();

  const [activeTab, setActiveTab] = useState<AccountTab>('overview');

  useEffect(() => {
    if (tab === 'security') setActiveTab('security');
    if (tab === 'billing') setActiveTab('billing');
    if (tab === 'edit') setActiveTab('edit');
    if (tab === 'preferences') setActiveTab('preferences');
  }, [tab]);

  // Form State for Edit Profile
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [category, setCategory] = useState('');
  const [accountType, setAccountType] = useState('personal');
  const [website, setWebsite] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Billing Details State
  const [billingName, setBillingName] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [billingPhone, setBillingPhone] = useState('');
  const [billingAddress1, setBillingAddress1] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('');
  const [billingPostal, setBillingPostal] = useState('');
  const [billingCountry, setBillingCountry] = useState('');
  const [isSavingBilling, setIsSavingBilling] = useState(false);

  // Selected Invoice Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  // Preference switches & Biometrics state
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(soundService?.isSoundOn?.() ?? true);
  const [hapticsEnabled, setHapticsEnabled] = useState(soundService?.isHapticsOn?.() ?? true);
  const [showSoundDemo, setShowSoundDemo] = useState(false);
  const [biometricSettings, setBiometricSettings] = useState<BiometricSettings>({
    enabled: false,
    timeoutMinutes: 0,
    biometricType: 'NONE',
    biometricLabel: 'Device Passcode',
    hardwareDescription: 'Device Security',
    hasHardware: false,
    isEnrolled: false,
  });
  const [isUpdatingBiometrics, setIsUpdatingBiometrics] = useState(false);
  const [signingOutDeviceId, setSigningOutDeviceId] = useState<string | null>(null);

  // Load Biometric settings
  useEffect(() => {
    async function loadBiometrics() {
      const settings = await BiometricService.getSettings();
      setBiometricSettings(settings);
    }
    loadBiometrics();
  }, [activeTab]);

  // Fetch Profile (RLS-safe via BFF with Supabase fallback)
  const { data: profile, refetch } = useQuery<Profile | null>({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        const p = await apiClient.get<Profile>('/mobile/v1/user/profile');
        if (p && p.id) return p;
      } catch (e) {
        console.warn('[AccountScreen] Profile BFF error:', e);
      }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      return data as Profile;
    },
    enabled: !!user?.id,
  });

  // Fetch Subscription details (RLS-safe via BFF with Supabase fallback)
  const { data: subData } = useQuery({
    queryKey: ['user-subscription-details', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        const res = await apiClient.get<any>('/mobile/v1/user/subscription');
        if (res?.sub) return res.sub;
      } catch (e) {
        console.warn('[AccountScreen] Subscription BFF error:', e);
      }
      const { data } = await supabase
        .from('app_user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch Payment Invoices History (RLS-safe via BFF with Supabase fallback)
  const { data: invoicesData } = useQuery({
    queryKey: ['user-invoices-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const invs = await apiClient.get<any[]>('/mobile/v1/user/invoices');
        if (Array.isArray(invs)) return invs;
      } catch (e) {}
      const { data } = await supabase
        .from('app_subscription_payments')
        .select('*')
        .eq('user_id', user.id)
        .order('charged_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch Billing Profile (RLS-safe via BFF with Supabase fallback)
  const { data: billingProfileData } = useQuery({
    queryKey: ['user-billing-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        const bp = await apiClient.get<any>('/mobile/v1/user/billing-profile');
        if (bp) return bp;
      } catch (e) {}
      const { data } = await supabase
        .from('app_billing_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  // Device Sessions Query
  const {
    data: deviceSessionsResponse,
    isLoading: isLoadingDeviceSessions,
    isFetching: isRefreshingDeviceSessions,
    refetch: refetchDeviceSessions,
  } = useQuery<DeviceSessionsResponse>({
    queryKey: ['auth-device-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return {
          activeDeviceCount: 0,
          devices: [],
        };
      }

      try {
        const response = await apiClient.get<DeviceSessionsResponse>(
          '/mobile/v1/auth/device-sessions'
        );

        const fallbackDevice: DeviceSession = {
          sessionId: 'current',
          platform: Platform.OS === 'web' ? 'web' : Platform.OS === 'ios' ? 'ios' : 'android',
          deviceName:
            Platform.OS === 'web'
              ? 'Web Browser'
              : Platform.OS === 'ios'
              ? 'iOS Device'
              : 'Android Device',
          deviceType: Platform.OS === 'web' ? 'desktop' : 'phone',
          osVersion: null,
          appVersion: '1.0.0',
          signedInAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          isOnline: true,
          isCurrent: true,
        };

        return {
          activeDeviceCount: response?.activeDeviceCount ?? 1,
          devices:
            Array.isArray(response?.devices) && response.devices.length > 0
              ? response.devices
              : [fallbackDevice],
        };
      } catch (error) {
        const fallbackDevice: DeviceSession = {
          sessionId: 'current',
          platform: Platform.OS === 'web' ? 'web' : Platform.OS === 'ios' ? 'ios' : 'android',
          deviceName:
            Platform.OS === 'web'
              ? 'Web Browser'
              : Platform.OS === 'ios'
              ? 'iOS Device'
              : 'Android Device',
          deviceType: Platform.OS === 'web' ? 'desktop' : 'phone',
          osVersion: null,
          appVersion: '1.0.0',
          signedInAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          isOnline: true,
          isCurrent: true,
        };
        return {
          activeDeviceCount: 1,
          devices: [fallbackDevice],
        };
      }
    },
    enabled: activeTab === 'security' && !!user?.id,
    staleTime: 15_000,
    retry: 1,
  });

  useEffect(() => {
    if (activeTab !== 'security' || !user?.id) return;
    let cancelled = false;

    const syncCurrentDevice = async () => {
      if (!cancelled) {
        await queryClient.invalidateQueries({
          queryKey: ['auth-device-sessions', user.id],
        });
        await refetchDeviceSessions();
      }
    };

    syncCurrentDevice();

    const heartbeat = setInterval(async () => {
      if (!cancelled) {
        await refetchDeviceSessions();
      }
    }, 30_000);

    return () => {
      cancelled = true;
      clearInterval(heartbeat);
    };
  }, [activeTab, user?.id]);

  // Sync form state when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || user?.user_metadata?.full_name || '');
      setPhone(profile.phone || profile.mobile_number || user?.phone || user?.user_metadata?.phone || '');
      setBusinessName(profile.business_name || '');
      setBusinessEmail(profile.business_email || '');
      setCategory(profile.category || '');
      setAccountType(profile.account_type || 'personal');
      setWebsite(profile.website || '');
      setCity(profile.city || '');
      setState(profile.state || '');
      setCountry(profile.country || '');
      setInstagramUrl(profile.instagram_url || '');
      setFacebookUrl(profile.facebook_url || '');
    } else if (user) {
      setFullName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
      setPhone(user.phone || user.user_metadata?.phone || '');
    }
  }, [profile, user]);

  // Sync billing profile
  useEffect(() => {
    if (billingProfileData) {
      setBillingName(billingProfileData.billing_name || '');
      setBillingEmail(billingProfileData.billing_email || '');
      setCompanyName(billingProfileData.company_name || '');
      setTaxId(billingProfileData.tax_id || '');
      setBillingPhone(billingProfileData.phone || '');
      setBillingAddress1(billingProfileData.address_line1 || '');
      setBillingCity(billingProfileData.city || '');
      setBillingState(billingProfileData.state || '');
      setBillingPostal(billingProfileData.postal_code || '');
      setBillingCountry(billingProfileData.country || '');
    } else if (profile) {
      setBillingName(profile.full_name || '');
      setBillingEmail(profile.business_email || profile.email || user?.email || '');
      setCompanyName(profile.business_name || '');
      setBillingPhone(profile.phone || '');
    }
  }, [billingProfileData, profile, user]);

  // Load local preferences
  useEffect(() => {
    async function loadPrefs() {
      try {
        const savedPush = await AsyncStorage.getItem('@pref_push');
        const savedEmail = await AsyncStorage.getItem('@pref_email');
        if (savedPush !== null) setPushEnabled(savedPush === 'true');
        if (savedEmail !== null) setEmailAlerts(savedEmail === 'true');
      } catch (e) {
        console.error('Error loading preferences:', e);
      }
    }
    loadPrefs();
  }, []);

  const handleTogglePref = async (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    try {
      await AsyncStorage.setItem(key, String(value));
    } catch (e) {
      console.error('Error saving preference:', e);
    }
  };

  const handleTogglePush = async (val: boolean) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (val) {
      const token = await requestPermissions();
      if (token || permissionGranted || !isDevice) {
        setPushEnabled(true);
        await AsyncStorage.setItem('@pref_push', 'true');
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert(
          'Notifications Required',
          'Please enable notifications for GetAiPilot in your device settings to receive instant alerts.'
        );
        setPushEnabled(false);
        await AsyncStorage.setItem('@pref_push', 'false');
      }
    } else {
      setPushEnabled(false);
      await AsyncStorage.setItem('@pref_push', 'false');
    }
  };

  // Save Profile Handler
  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const updates = {
        full_name: fullName,
        phone,
        mobile_number: phone,
        business_name: businessName,
        business_email: businessEmail,
        category,
        account_type: accountType,
        website,
        city,
        state,
        country,
        instagram_url: instagramUrl,
        facebook_url: facebookUrl,
        updated_at: new Date().toISOString(),
      };

      try {
        await apiClient.patch('/mobile/v1/user/profile', updates);
      } catch (bffErr) {
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);
        if (error) throw error;
      }

      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['platform-subscription'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Profile updated successfully.');
      setActiveTab('overview');
    } catch (err: any) {
      console.error('Save profile error:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Billing Profile Handler
  const handleSaveBilling = async () => {
    if (!user?.id) return;
    setIsSavingBilling(true);
    try {
      const payload = {
        user_id: user.id,
        billing_name: billingName,
        billing_email: billingEmail,
        company_name: companyName,
        tax_id: taxId,
        phone: billingPhone,
        address_line1: billingAddress1,
        city: billingCity,
        state: billingState,
        postal_code: billingPostal,
        country: billingCountry,
        currency: 'INR',
        updated_at: new Date().toISOString(),
      };

      try {
        await apiClient.post('/mobile/v1/user/billing-profile', payload);
      } catch (bffErr) {
        const { error } = await supabase
          .from('app_billing_profiles')
          .upsert(payload, { onConflict: 'user_id' });
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ['user-billing-profile', user.id] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Billing information saved.');
    } catch (err: any) {
      console.error('Save billing error:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', err.message || 'Failed to update billing details.');
    } finally {
      setIsSavingBilling(false);
    }
  };

  // Password Reset Email Trigger
  const handlePasswordReset = async () => {
    if (!user?.email) {
      Alert.alert('Error', 'No email address associated with this account.');
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: 'getaipilot://reset-password',
      });
      if (error) throw error;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Password Reset Sent', `Check ${user.email} for password reset instructions.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not send reset instructions.');
    }
  };

  // Biometric Toggle Handler
  const handleToggleBiometric = async (value: boolean) => {
    if (isUpdatingBiometrics) return;
    setIsUpdatingBiometrics(true);

    setBiometricSettings((prev) => ({ ...prev, enabled: value }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await BiometricService.setEnabled(value);
      const updated = await BiometricService.getSettings();
      setBiometricSettings(updated);

      if (value) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        BiometricService.authenticate(`Verify ${updated.biometricLabel} Lock`).catch((e) =>
          console.warn('Biometric verification error:', e)
        );
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      console.error('Biometric toggle error:', err);
      setBiometricSettings((prev) => ({ ...prev, enabled: !value }));
      Alert.alert('Security Error', err.message || 'Could not update biometric settings.');
    } finally {
      setIsUpdatingBiometrics(false);
    }
  };

  // Change Auto-Lock Timeout
  const handleChangeTimeout = async (minutes: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await BiometricService.setTimeoutMinutes(minutes);
      const updated = await BiometricService.getSettings();
      setBiometricSettings(updated);
    } catch (err: any) {
      console.error('Error updating timeout:', err);
    }
  };

  const handleSignOutOtherDevice = (device: DeviceSession) => {
    confirmDialog({
      title: 'Sign Out Device',
      message: `Sign out ${device.deviceName}? It will need to sign in again to use GetAiPilot.`,
      confirmText: 'Sign Out',
      destructive: true,
      onConfirm: async () => {
        setSigningOutDeviceId(device.sessionId);
        try {
          await apiClient.delete(`/mobile/v1/auth/device-sessions/${encodeURIComponent(device.sessionId)}`);
          await refetchDeviceSessions();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error: any) {
          showAlert({
            title: 'Could Not Sign Out Device',
            message: error.message || 'Please try again.',
            type: 'destructive',
          });
        } finally {
          setSigningOutDeviceId(null);
        }
      },
    });
  };

  // Sign Out Handler
  const handleSignOut = () => {
    confirmLogout({
      onConfirm: async () => {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await signOut();
          router.replace('/(auth)/login' as any);
        } catch (err: any) {
          console.error('Sign out error:', err);
        }
      },
      confirmBgColor: 'rgba(239, 68, 68, 0.16)',
      confirmTextColor: '#EF4444',
      cancelBgColor: 'rgba(255, 255, 255, 0.08)',
      buttonAlign: 'right',
    });
  };

  const displayName =
    fullName || profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.charAt(0).toUpperCase();

  const getDaysLeft = () => {
    if (!subData?.expires_at) return 30;
    const diffTime = new Date(subData.expires_at).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  return (
    <AppScreen safeArea={false}>
      <AppTopBar title="Account" showBack onBackPress={() => router.navigate('/(tabs)' as any)} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={[styles.scrollView, isDark ? styles.scrollViewDark : styles.scrollViewLight]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Minimal profile summary */}
        <View style={[styles.heroCard, isDark ? styles.heroCardDark : styles.heroCardLight]}>
          <View style={styles.heroTop}>
            <View style={[styles.avatar, isDark ? styles.avatarDark : styles.avatarLight]}>
              <Text style={[styles.avatarText, isDark && styles.avatarTextDark]}>{initials}</Text>
            </View>
            <View style={styles.heroInfo}>
              <Text style={[styles.heroName, isDark && styles.heroNameDark]} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={[styles.heroEmail, isDark && styles.heroEmailDark]} numberOfLines={1}>
                {user?.email || phone || 'User'}
              </Text>
              <View style={styles.badgeRow}>
                <View style={[styles.badge, isDark ? styles.badgeDark : styles.badgeLight]}>
                  <Ionicons name="checkmark-circle" size={13} color={colors.accent} style={{ marginRight: 4 }} />
                  <Text style={[styles.badgeText, { color: colors.accent }]}>Verified</Text>
                </View>
                {profile?.is_admin && (
                  <View style={[styles.badge, isDark ? styles.adminBadgeDark : styles.adminBadgeLight]}>
                    <Ionicons name="shield-checkmark" size={13} color="#10B981" style={{ marginRight: 4 }} />
                    <Text style={[styles.badgeText, { color: '#10B981' }]}>Admin</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Status</Text>
              <Text style={[styles.statValue, { color: colors.success }]}>{isActive ? 'Active' : 'Free'}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Plan</Text>
              <Text style={[styles.statValue, { color: colors.accent }]}>{planLabel || 'Free'}</Text>
            </View>
          </View>
        </View>

        {/* Account sections */}
        <View
          onLayout={(e: LayoutChangeEvent) => setTabsTrackWidth(e.nativeEvent.layout.width)}
          style={[styles.tabsTrack, isDark ? styles.tabsTrackDark : styles.tabsTrackLight]}
        >
          {tabPillWidth > 0 && (
            <Animated.View
              style={[
                styles.slidingTabPill,
                {
                  width: tabPillWidth,
                  left: tabPadding,
                  transform: [{ translateX: slideAnim }],
                },
                isDark ? styles.slidingTabPillDark : styles.slidingTabPillLight,
              ]}
            />
          )}

          {TABS.map((tab) => {
            const isTabActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                style={styles.tabButton}
                onPress={() => handleTabChange(tab.id)}
                accessibilityRole="tab"
                accessibilityLabel={tab.label}
                accessibilityState={{ selected: isTabActive }}
              >
                <Text
                  style={[
                    styles.tabText,
                    isDark ? styles.tabTextDark : styles.tabTextLight,
                    isTabActive && (isDark ? styles.tabTextActiveDark : styles.tabTextActiveLight),
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <OverviewTab
            email={user?.email || '—'}
            phone={phone}
            isActive={Boolean(isActive || subData?.subscription_status === 'active')}
            isAdmin={Boolean(isAdmin || profile?.is_admin)}
            onSignOut={handleSignOut}
            isDark={isDark}
          />
        )}

        {activeTab === 'edit' && (
          <EditProfileTab
            fullName={fullName}
            setFullName={setFullName}
            phone={phone}
            setPhone={setPhone}
            businessName={businessName}
            setBusinessName={setBusinessName}
            businessEmail={businessEmail}
            setBusinessEmail={setBusinessEmail}
            website={website}
            setWebsite={setWebsite}
            city={city}
            setCity={setCity}
            country={country}
            setCountry={setCountry}
            isSaving={isSaving}
            onSave={handleSaveProfile}
            isDark={isDark}
          />
        )}

        {activeTab === 'security' && (
          <SecurityTab
            biometricSettings={biometricSettings}
            isUpdatingBiometrics={isUpdatingBiometrics}
            onToggleBiometric={handleToggleBiometric}
            onChangeTimeout={handleChangeTimeout}
            deviceSessions={deviceSessionsResponse?.devices || []}
            activeDeviceCount={deviceSessionsResponse?.activeDeviceCount ?? 1}
            isLoadingDevices={isLoadingDeviceSessions}
            isRefreshingDevices={isRefreshingDeviceSessions}
            onRefreshDevices={refetchDeviceSessions}
            onSignOutOtherDevice={handleSignOutOtherDevice}
            signingOutDeviceId={signingOutDeviceId}
            onPasswordReset={handlePasswordReset}
            isDark={isDark}
          />
        )}

        {activeTab === 'billing' && (
          <BillingTab
            subData={subData}
            planLabel={planLabel || ''}
            isActive={Boolean(isActive || subData?.subscription_status === 'active')}
            profileSubscription={profile?.subscription || undefined}
            daysLeft={getDaysLeft()}
            invoicesData={invoicesData || []}
            onSelectInvoice={setSelectedInvoice}
            billingName={billingName}
            setBillingName={setBillingName}
            billingEmail={billingEmail}
            setBillingEmail={setBillingEmail}
            taxId={taxId}
            setTaxId={setTaxId}
            billingAddress1={billingAddress1}
            setBillingAddress1={setBillingAddress1}
            billingCity={billingCity}
            setBillingCity={setBillingCity}
            billingPostal={billingPostal}
            setBillingPostal={setBillingPostal}
            isSavingBilling={isSavingBilling}
            onSaveBilling={handleSaveBilling}
            isDark={isDark}
          />
        )}

        {activeTab === 'preferences' && (
          <SettingsTab
            soundEnabled={soundEnabled}
            onToggleSound={(val) => {
              setSoundEnabled(val);
              soundService.setSoundEnabled(val);
              if (val) soundService.play('pop');
            }}
            hapticsEnabled={hapticsEnabled}
            onToggleHaptics={(val) => {
              setHapticsEnabled(val);
              soundService.setHapticsEnabled(val);
              if (val && Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
            }}
            themeMode={themeMode}
            onSelectTheme={async (mode) => {
              await setThemeMode(mode);
            }}
            pushEnabled={pushEnabled}
            onTogglePush={handleTogglePush}
            emailAlerts={emailAlerts}
            onToggleEmailAlerts={(val) => handleTogglePref('@pref_email', val, setEmailAlerts)}
            biometricEnabled={biometricSettings.enabled}
            onToggleBiometric={handleToggleBiometric}
            biometricLabel={biometricSettings.biometricLabel}
            isDark={isDark}
          />
        )}

        {/* Invoice Modal */}
        <InvoiceReceiptModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          isDark={isDark}
        />

        {/* Audio & Haptic Evaluation Demo Modal */}
        <SoundFeedbackDemoModal
          visible={showSoundDemo}
          onClose={() => setShowSoundDemo(false)}
          isDark={isDark}
        />
      </ScrollView>
    </KeyboardAvoidingView>

      {/* Audio & Haptic Evaluation Suite Modal */}
      <SoundFeedbackDemoModal
        visible={showSoundDemo}
        onClose={() => setShowSoundDemo(false)}
        isDark={isDark}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 170, // Ensures full clearance above the floating bottom navigation bar
  },
});
