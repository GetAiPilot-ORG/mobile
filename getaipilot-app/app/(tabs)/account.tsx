import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
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
import { useChatbotScroll } from '../../src/components/chatbot';

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
  AvatarActionSheet,
  EditProfileSheet,
  SignOutConfirmSheet,
  CopyToast,
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
  const { confirmDialog, showAlert } = useThemedDialog();

  // Floating Chatbot scroll auto-hide hook
  const chatbotScroll = useChatbotScroll();

  // Tabs state: Profile ('overview') | Security ('security') | Billing ('billing') | Preferences ('preferences')
  const [activeTab, setActiveTab] = useState<AccountTab>('overview');

  // Interactive Sheets & Modals state
  const [isAvatarSheetOpen, setIsAvatarSheetOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isSignOutSheetOpen, setIsSignOutSheetOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  useEffect(() => {
    if (tab === 'security') setActiveTab('security');
    if (tab === 'billing') setActiveTab('billing');
    if (tab === 'edit') {
      setActiveTab('overview');
      setIsEditSheetOpen(true);
    }
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
  const { data: profile, isLoading: isLoadingProfile, refetch: refetchProfile } = useQuery<Profile | null>({
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
  const { data: subData, refetch: refetchSubscription } = useQuery({
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
  const { data: invoicesData, refetch: refetchInvoices } = useQuery({
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
  const { data: billingProfileData, refetch: refetchBillingProfile } = useQuery({
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
          activeDeviceCount: 1,
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
              ? 'Safari on localhost'
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
              ? 'Safari on localhost'
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
    enabled: !!user?.id,
    staleTime: 15_000,
  });

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
      if (profile.avatar_url) {
        setAvatarUrl(profile.avatar_url);
      }
    } else if (user) {
      setFullName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
      setPhone(user.phone || user.user_metadata?.phone || '');
    }
  }, [profile, user]);

  // Load cached local avatar
  useEffect(() => {
    async function loadCachedAvatar() {
      if (!user?.id) return;
      try {
        const cached = await AsyncStorage.getItem(`@user_avatar_${user.id}`);
        if (cached) {
          setAvatarUrl((prev) => prev || cached);
        }
      } catch {}
    }
    loadCachedAvatar();
  }, [user?.id]);

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
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    if (val) {
      const token = await requestPermissions();
      if (token || permissionGranted || !isDevice) {
        setPushEnabled(true);
        await AsyncStorage.setItem('@pref_push', 'true');
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
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

  // Save Profile Handler (Used by EditProfileSheet and EditProfileTab)
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

      await refetchProfile();
      await queryClient.invalidateQueries({ queryKey: ['platform-subscription'] });
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      showToast('Profile updated successfully');
      setIsEditSheetOpen(false);
    } catch (err: any) {
      console.error('Save profile error:', err);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
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
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      showToast('Billing details updated');
    } catch (err: any) {
      console.error('Save billing error:', err);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
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
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
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
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      await BiometricService.setEnabled(value);
      const updated = await BiometricService.getSettings();
      setBiometricSettings(updated);

      if (value) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        BiometricService.authenticate(`Verify ${updated.biometricLabel} Lock`).catch((e) =>
          console.warn('Biometric verification error:', e)
        );
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
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
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
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          showToast(`Signed out ${device.deviceName}`);
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

  // Sign Out Confirmation Action
  const handleConfirmSignOut = async () => {
    setIsSignOutSheetOpen(false);
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      await signOut();
      router.replace('/(auth)/login' as any);
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  // Avatar Actions
  const handleSelectAvatarOption = async (option: 'camera' | 'gallery' | 'remove') => {
    if (option === 'remove') {
      try {
        setIsUploadingAvatar(true);
        setAvatarUrl(null);
        if (user?.id) {
          await AsyncStorage.removeItem(`@user_avatar_${user.id}`);
        }
        try {
          await apiClient.patch('/mobile/v1/user/profile', { avatar_url: null });
        } catch {
          if (user?.id) {
            await supabase
              .from('profiles')
              .update({ avatar_url: null, updated_at: new Date().toISOString() })
              .eq('id', user.id);
          }
        }
        await refetchProfile();
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        showToast('Profile photo removed');
      } catch (err: any) {
        console.error('Error removing avatar:', err);
        showToast('Failed to remove avatar');
      } finally {
        setIsUploadingAvatar(false);
      }
      return;
    }

    try {
      let result: ImagePicker.ImagePickerResult | null = null;

      if (option === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Camera Permission Needed',
            'Please allow camera access in your device settings to take a profile picture.'
          );
          return;
        }

        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
          base64: true,
        });
      } else if (option === 'gallery') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Photos Permission Needed',
            'Please allow photo library access in your device settings to select a profile picture.'
          );
          return;
        }

        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
          base64: true,
        });
      }

      if (!result || result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const localUri = asset.uri;
      const base64Data = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : null;

      // Optimistically update UI immediately
      setAvatarUrl(localUri);
      setIsUploadingAvatar(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      showToast('Updating profile picture...');

      if (user?.id) {
        await AsyncStorage.setItem(`@user_avatar_${user.id}`, localUri);
      }

      let persistentUrl: string = base64Data || localUri;

      // Attempt Supabase Storage upload to 'avatars' bucket if base64 is available
      if (user?.id && asset.base64) {
        try {
          const fileName = `${user.id}/${Date.now()}.jpg`;
          const binaryString = atob(asset.base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const { data: uploadData, error: uploadErr } = await supabase.storage
            .from('avatars')
            .upload(fileName, bytes.buffer, {
              contentType: 'image/jpeg',
              upsert: true,
            });

          if (!uploadErr && uploadData) {
            const { data: publicData } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName);
            if (publicData?.publicUrl) {
              persistentUrl = publicData.publicUrl;
            }
          }
        } catch (storageErr) {
          console.warn('[Avatar] Supabase storage upload notice:', storageErr);
        }
      }

      // Persist to backend (BFF with Supabase direct update fallback)
      if (user?.id) {
        try {
          await apiClient.patch('/mobile/v1/user/profile', { avatar_url: persistentUrl });
        } catch (bffErr) {
          await supabase
            .from('profiles')
            .update({ avatar_url: persistentUrl, updated_at: new Date().toISOString() })
            .eq('id', user.id);
        }

        await AsyncStorage.setItem(`@user_avatar_${user.id}`, persistentUrl);
        setAvatarUrl(persistentUrl);
        await refetchProfile();
      }

      showToast('Profile photo updated successfully');
    } catch (err: any) {
      console.error('Error selecting avatar:', err);
      Alert.alert('Upload Error', err?.message || 'Could not update profile picture.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Pull-to-Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchProfile(),
        refetchSubscription(),
        refetchInvoices(),
        refetchBillingProfile(),
        refetchDeviceSessions(),
      ]);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      console.warn('Account refresh notice:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Sanitize Name: Trim trailing punctuation (stray dots, commas) and spaces, fallback to email prefix
  const rawDisplayName =
    fullName || profile?.full_name || user?.user_metadata?.full_name || user?.name || '';
  const displayName = React.useMemo(() => {
    const trimmed = rawDisplayName.trim().replace(/[\s.,_-]+$/, '').trim();
    if (trimmed) return trimmed;
    if (user?.email) return user.email.split('@')[0];
    return 'GetAiPilot User';
  }, [rawDisplayName, user?.email]);

  const initials = (displayName.charAt(0) || 'G').toUpperCase();

  const getDaysLeft = () => {
    if (!subData?.expires_at) return 24;
    const diffTime = new Date(subData.expires_at).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const daysRemaining = getDaysLeft();

  return (
    <AppScreen safeArea={false}>
      <AppTopBar title="Account" showBack onBackPress={() => router.navigate('/(tabs)' as any)} />

      {/* Floating Clipboard Toast */}
      <CopyToast message={toastMessage} isDark={isDark} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={chatbotScroll.onScroll}
          scrollEventThrottle={chatbotScroll.scrollEventThrottle}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={palette.primary}
              colors={[palette.primary]}
            />
          }
        >
          {/* Account Profile Card (Header) */}
          <AccountHeader
            displayName={displayName}
            email={user?.email || phone || 'User'}
            phone={phone}
            backupEmail={businessEmail}
            initials={initials}
            avatarUrl={avatarUrl || profile?.avatar_url}
            isUploadingAvatar={isUploadingAvatar}
            isAdmin={Boolean(isAdmin || profile?.is_admin)}
            isActive={Boolean(isActive || subData?.subscription_status === 'active')}
            planLabel={isActive ? (planLabel || 'Core') : 'Free'}
            quotaPercent={68}
            renewalDateText={`Renews in ${daysRemaining} days`}
            memberSince="Oct 2024"
            connectedAppsCount={5}
            deviceCount={deviceSessionsResponse?.activeDeviceCount ?? 1}
            isDark={isDark}
            onEditAvatar={() => setIsAvatarSheetOpen(true)}
            onEditProfile={() => setIsEditSheetOpen(true)}
            onPressPlan={() => router.push('/account/plans' as any)}
            onPressDevices={() => setActiveTab('security')}
            onPressApps={() => router.push('/(tabs)/products' as any)}
          />

          {/* Fixed Segmented Tab Bar (Non-scrollable) */}
          <AccountTabsNav
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            isDark={isDark}
          />

          {/* TAB 1: PROFILE / OVERVIEW */}
          {activeTab === 'overview' && (
            <OverviewTab
              email={user?.email || '—'}
              phone={phone}
              isActive={Boolean(isActive || subData?.subscription_status === 'active')}
              isAdmin={Boolean(isAdmin || profile?.is_admin)}
              planLabel={isActive ? (planLabel || 'Core') : 'Free'}
              deviceCount={deviceSessionsResponse?.activeDeviceCount ?? 1}
              pushEnabled={pushEnabled}
              themeMode={themeMode}
              onSelectTheme={async (mode) => {
                await setThemeMode(mode);
              }}
              onNavigateTab={(target) => setActiveTab(target)}
              onEditProfile={() => setIsEditSheetOpen(true)}
              onSignOut={() => setIsSignOutSheetOpen(true)}
              onShowToast={showToast}
              isDark={isDark}
            />
          )}

          {/* TAB 2: SECURITY */}
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

          {/* TAB 3: BILLING */}
          {activeTab === 'billing' && (
            <BillingTab
              subData={subData}
              planLabel={planLabel || 'Core'}
              isActive={Boolean(isActive || subData?.subscription_status === 'active')}
              profileSubscription={profile?.subscription || undefined}
              daysLeft={daysRemaining}
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

          {/* TAB 4: PREFERENCES */}
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
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─── Bottom Sheets & Action Drawers ───────────────────────────────── */}
      {/* 1. Avatar Actions Bottom Sheet */}
      <AvatarActionSheet
        visible={isAvatarSheetOpen}
        onClose={() => setIsAvatarSheetOpen(false)}
        onSelectOption={handleSelectAvatarOption}
        isDark={isDark}
      />

      {/* 2. Quick Edit Profile Bottom Sheet */}
      <EditProfileSheet
        visible={isEditSheetOpen}
        onClose={() => setIsEditSheetOpen(false)}
        fullName={fullName}
        setFullName={setFullName}
        phone={phone}
        setPhone={setPhone}
        businessEmail={businessEmail}
        setBusinessEmail={setBusinessEmail}
        businessName={businessName}
        setBusinessName={setBusinessName}
        city={city}
        setCity={setCity}
        isSaving={isSaving}
        onSave={handleSaveProfile}
        isDark={isDark}
      />

      {/* 3. Sign Out Confirmation Sheet */}
      <SignOutConfirmSheet
        visible={isSignOutSheetOpen}
        onClose={() => setIsSignOutSheetOpen(false)}
        onConfirm={handleConfirmSignOut}
        isDark={isDark}
      />

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
    paddingBottom: 160, // Clear floating bottom navigation bar
  },
});
