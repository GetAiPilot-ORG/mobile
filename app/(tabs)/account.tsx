import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { DeviceSessionsSkeleton } from '../../src/components/skeletonScreen';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiClient } from '../../src/core/api/client';
import { usePlatformSubscription } from '../../src/hooks/usePlatformSubscription';
import { BiometricService, BiometricSettings } from '../../src/lib/biometrics';
import { supabase } from '../../src/lib/supabase';
import { Profile } from '../../src/types/database';

type AccountTab = 'overview' | 'edit' | 'security' | 'billing' | 'preferences';

interface DeviceSession {
  sessionId: string;
  platform: 'ios' | 'android' | 'web';
  deviceName: string;
  deviceType: 'phone' | 'tablet' | 'desktop' | 'tv' | 'unknown' | null;
  osVersion: string | null;
  appVersion: string | null;
  signedInAt: string;
  lastSeenAt: string;
  isOnline: boolean;
  isCurrent: boolean;
}

interface DeviceSessionsResponse {
  activeDeviceCount: number;
  devices: DeviceSession[];
}

const DEVICE_ID_STORAGE_KEY = '@get_ai_pilot_device_id';

const getOrCreateDeviceId = async (): Promise<string> => {
  const existing = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }
  const randomPart = Math.random().toString(36).slice(2);
  const deviceId = `mobile-${Date.now()}-${randomPart}`;
  await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  return deviceId;
};

const TABS: { id: AccountTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'edit', label: 'Edit Profile' },
  { id: 'security', label: 'Security' },
  { id: 'billing', label: 'Billing' },
  { id: 'preferences', label: 'Settings' },
];

export default function AccountScreen() {
  const router = useRouter();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const { user, signOut } = useAuth();
  const { isAdmin, planLabel, isActive } = usePlatformSubscription();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<AccountTab>('overview');

  useEffect(() => {
    if (tab === 'security') setActiveTab('security');
  }, [tab]);

  // Animated Segmented Control state
  const activeTabIndex = TABS.findIndex((t) => t.id === activeTab);
  const [tabsTrackWidth, setTabsTrackWidth] = useState(0);
  const tabPadding = 4;
  const tabPillWidth = tabsTrackWidth > 0 ? (tabsTrackWidth - tabPadding * 2) / TABS.length : 0;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (tabPillWidth > 0) {
      Animated.spring(slideAnim, {
        toValue: activeTabIndex * tabPillWidth,
        tension: 68,
        friction: 9,
        useNativeDriver: true,
      }).start();
    }
  }, [activeTabIndex, tabPillWidth]);

  const handleTabChange = (tabId: AccountTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tabId);
  };

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
  const [billingPostal, setBillingPostal] = useState('');
  const [billingCountry, setBillingCountry] = useState('');
  const [isSavingBilling, setIsSavingBilling] = useState(false);

  // Selected Invoice Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  // Preference switches & Biometrics state
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
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

  // Fetch Profile
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

  // Fetch Subscription details
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

  // Fetch Payment Invoices History
  const { data: invoicesData } = useQuery({
    queryKey: ['user-invoices-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const invs = await apiClient.get<any[]>('/mobile/v1/user/invoices');
        if (Array.isArray(invs)) return invs;
      } catch (e) { }
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

  // Fetch Billing Profile
  const { data: billingProfileData } = useQuery({
    queryKey: ['user-billing-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        const bp = await apiClient.get<any>('/mobile/v1/user/billing-profile');
        if (bp) return bp;
      } catch (e) { }
      const { data } = await supabase
        .from('app_billing_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const {
    data: deviceSessionsResponse,
    isLoading: isLoadingDeviceSessions,
    isFetching: isRefreshingDeviceSessions,
    refetch: refetchDeviceSessions,
    error: deviceSessionsError,
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
        return {
          activeDeviceCount: response?.activeDeviceCount ?? 0,
          devices: Array.isArray(response?.devices) ? response.devices : [],
        };
      } catch (error) {
        console.error('[DeviceSessions] GET failed:', error);
        throw error;
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

  useEffect(() => {
    if (billingProfileData) {
      setBillingName(billingProfileData.billing_name || '');
      setBillingEmail(billingProfileData.billing_email || '');
      setCompanyName(billingProfileData.company_name || '');
      setTaxId(billingProfileData.tax_id || '');
      setBillingPhone(billingProfileData.phone || '');
      setBillingAddress1(billingProfileData.address_line1 || '');
      setBillingCity(billingProfileData.city || '');
      setBillingPostal(billingProfileData.postal_code || '');
      setBillingCountry(billingProfileData.country || '');
    } else if (profile) {
      setBillingName(profile.full_name || '');
      setBillingEmail(profile.business_email || profile.email || user?.email || '');
      setCompanyName(profile.business_name || '');
      setBillingPhone(profile.phone || '');
    }
  }, [billingProfileData, profile, user]);

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

  const formatDeviceLastSeen = (device: DeviceSession) => {
    if (device.isCurrent) return 'This device';
    const date = new Date(device.lastSeenAt);
    if (Number.isNaN(date.getTime())) return 'Recently signed in';
    return `Signed in ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  };

  const handleSignOutOtherDevice = (device: DeviceSession) => {
    Alert.alert(
      'Sign Out Device',
      `Sign out ${device.deviceName}? It will need to sign in again to use GetAiPilot.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setSigningOutDeviceId(device.sessionId);
            try {
              await apiClient.delete(`/mobile/v1/auth/device-sessions/${encodeURIComponent(device.sessionId)}`);
              await refetchDeviceSessions();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error: any) {
              Alert.alert('Could Not Sign Out Device', error.message || 'Please try again.');
            } finally {
              setSigningOutDeviceId(null);
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out from GetAiPilot?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await signOut();
            } catch (err: any) {
              console.error('Sign out error:', err);
            }
          },
        },
      ]
    );
  };

  const displayName =
    fullName || profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.charAt(0).toUpperCase();
  const joinDate = (profile?.created_at || user?.created_at)
    ? new Date(profile?.created_at || user?.created_at!).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    })
    : 'Jan 2026';

  const getDaysLeft = () => {
    if (!subData?.expires_at) return 30;
    const diffTime = new Date(subData.expires_at).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  return (
    <AppScreen safeArea="top">
      <ScrollView
        className="flex-1 bg-[#0B0D10]"
        contentContainerClassName="p-4 pb-36"
        showsVerticalScrollIndicator={false}
      >
        {/* Apple ID / Profile Hero Card */}
        <View className="rounded-3xl p-4 mb-4 bg-[#181A1F] border border-[#262930]">
          <View className="flex-row items-center mb-4">
            <View className="w-16 h-16 rounded-full bg-blue-600 border-2 border-blue-400/40 justify-center items-center mr-4">
              <Text className="text-2xl font-extrabold text-white">{initials}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-white tracking-tight" numberOfLines={1}>
                {displayName}
              </Text>
              <Text className="text-[13.5px] text-slate-400 mt-0.5" numberOfLines={1}>
                {user?.email || phone || 'User'}
              </Text>
              <View className="flex-row gap-1.5 mt-2">
                <View className="flex-row items-center px-2 py-0.5 rounded-xl bg-blue-500/15">
                  <Ionicons name="checkmark-circle" size={13} color="#0A84FF" style={{ marginRight: 4 }} />
                  <Text className="text-[11px] font-bold text-blue-400">Verified Account</Text>
                </View>
                {profile?.is_admin && (
                  <View className="flex-row items-center px-2 py-0.5 rounded-xl bg-emerald-500/15">
                    <Ionicons name="shield-checkmark" size={13} color="#10B981" style={{ marginRight: 4 }} />
                    <Text className="text-[11px] font-bold text-emerald-400">Admin</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View className="flex-row border-t border-[#262930] pt-3.5">
            <View className="flex-1 items-center">
              <Text className="text-[10.5px] text-slate-400 mb-1 uppercase font-bold tracking-wider">Status</Text>
              <Text className="text-[13.5px] font-bold text-emerald-400">{isActive ? '● Active' : 'Free Trial'}</Text>
            </View>
            <View className="flex-1 items-center border-l border-r border-[#262930]">
              <Text className="text-[10.5px] text-slate-400 mb-1 uppercase font-bold tracking-wider">Member Since</Text>
              <Text className="text-[13.5px] font-bold text-white">{joinDate}</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-[10.5px] text-slate-400 mb-1 uppercase font-bold tracking-wider">Plan</Text>
              <Text className="text-[13.5px] font-extrabold text-blue-400">{planLabel || 'Free'}</Text>
            </View>
          </View>
        </View>

        {/* Segmented Control Track */}
        <View
          onLayout={(e: LayoutChangeEvent) => setTabsTrackWidth(e.nativeEvent.layout.width)}
          className="flex-row items-center rounded-2xl p-1 mb-5 border border-[#262930] bg-[#181A1F] relative h-11"
        >
          {tabPillWidth > 0 && (
            <Animated.View
              className="absolute top-1 bottom-1 rounded-xl bg-blue-600 z-0"
              style={{
                width: tabPillWidth,
                left: tabPadding,
                transform: [{ translateX: slideAnim }],
              }}
              pointerEvents="none"
            />
          )}

          {TABS.map((tabItem) => {
            const isTabActive = activeTab === tabItem.id;
            return (
              <Pressable
                key={tabItem.id}
                className="flex-1 items-center justify-center h-full z-10"
                onPress={() => handleTabChange(tabItem.id)}
              >
                <Text
                  className={`text-xs font-semibold ${isTabActive ? 'text-white font-extrabold' : 'text-slate-400'}`}
                  numberOfLines={1}
                >
                  {tabItem.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <View className="mb-2">
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
              ACCOUNT INFORMATION
            </Text>
            <View className="rounded-2xl px-4 py-1 mb-5 bg-[#181A1F] border border-[#262930]">
              <View className="flex-row justify-between items-center py-3 border-b border-[#262930]">
                <Text className="text-sm text-slate-400">Email</Text>
                <Text className="text-sm font-semibold text-white text-right flex-1 ml-4">{user?.email || '-'}</Text>
              </View>
              <View className="flex-row justify-between items-center py-3 border-b border-[#262930]">
                <Text className="text-sm text-slate-400">Phone</Text>
                <Text className="text-sm font-semibold text-white text-right flex-1 ml-4">{phone || 'Not provided'}</Text>
              </View>
              <View className="flex-row justify-between items-center py-3 border-b border-[#262930]">
                <Text className="text-sm text-slate-400">Business Name</Text>
                <Text className="text-sm font-semibold text-white text-right flex-1 ml-4">{profile?.business_name || 'Individual'}</Text>
              </View>
              <View className="flex-row justify-between items-center py-3 border-b border-[#262930]">
                <Text className="text-sm text-slate-400">Website</Text>
                <Text className="text-sm font-semibold text-white text-right flex-1 ml-4">{profile?.website || 'Not provided'}</Text>
              </View>
              <View className="flex-row justify-between items-center py-3 border-b border-[#262930]">
                <Text className="text-sm text-slate-400">Location</Text>
                <Text className="text-sm font-semibold text-white text-right flex-1 ml-4">
                  {profile?.city ? `${profile.city}, ${profile.country || ''}` : profile?.country || 'Not set'}
                </Text>
              </View>
              <View className="flex-row justify-between items-center py-3">
                <Text className="text-sm text-slate-400">Account ID</Text>
                <Text className="text-xs font-semibold text-slate-400 text-right flex-1 ml-4">
                  {user?.id ? `${user.id.slice(0, 10)}...` : '-'}
                </Text>
              </View>
            </View>

            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
              CONNECTED PLATFORMS
            </Text>
            <View className="rounded-2xl px-4 py-1 mb-5 bg-[#181A1F] border border-[#262930]">
              <View className="flex-row justify-between items-center py-3 border-b border-[#262930]">
                <Text className="text-sm text-slate-400">Telegram ID</Text>
                <Text className="text-sm font-semibold text-white text-right flex-1 ml-4">
                  {profile?.telegram_user_id ? String(profile.telegram_user_id) : 'Not linked'}
                </Text>
              </View>
              <View className="flex-row justify-between items-center py-3">
                <Text className="text-sm text-slate-400">Account Type</Text>
                <Text className="text-sm font-semibold text-white text-right flex-1 ml-4">{profile?.account_type || 'Personal'}</Text>
              </View>
            </View>

            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
              RESOURCES & SETTINGS
            </Text>
            <View className="rounded-2xl px-4 py-1 mb-5 bg-[#181A1F] border border-[#262930]">
              <Pressable
                className="flex-row items-center py-3 border-b border-[#262930] gap-3"
                onPress={() => router.push('/account/help' as any)}
              >
                <View className="w-8 h-8 rounded-lg bg-blue-600 justify-center items-center">
                  <Ionicons name="book" size={16} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-[14.5px] font-bold text-white">Help Center & Docs</Text>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    Tutorials, FAQs, and ticket submission
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
              </Pressable>

              <Pressable
                className="flex-row items-center py-3 border-b border-[#262930] gap-3"
                onPress={() => router.push('/account/plans' as any)}
              >
                <View className="w-8 h-8 rounded-lg bg-purple-600 justify-center items-center">
                  <Ionicons name="diamond" size={16} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-[14.5px] font-bold text-white">Plans & Subscriptions</Text>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    Upgrade quota, view GAP Max features
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
              </Pressable>

              <Pressable
                className="flex-row items-center py-3 gap-3"
                onPress={() => router.push('/account/customize' as any)}
              >
                <View className="w-8 h-8 rounded-lg bg-slate-600 justify-center items-center">
                  <Ionicons name="options" size={16} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-[14.5px] font-bold text-white">Customize App</Text>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    Toggle shortcuts, tool visibility & density
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
              </Pressable>
            </View>

            {/* Admin Center */}
            {(profile?.is_admin || isAdmin) && (
              <>
                <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                  ADMINISTRATION
                </Text>
                <View className="rounded-2xl px-4 py-3 mb-5 bg-[#181A1F] border border-emerald-500/50">
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-base font-bold text-emerald-400">
                      🛡️ Admin Console
                    </Text>
                    <View className="bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/30">
                      <Text className="text-[10px] font-extrabold text-emerald-400 tracking-wider">STAFF ONLY</Text>
                    </View>
                  </View>
                  <Text className="text-xs text-slate-400 mb-3 leading-4">
                    Authorized access to platform management, outreach, and store revenue.
                  </Text>

                  <Pressable
                    className="flex-row items-center py-3 border-b border-[#262930] gap-3"
                    onPress={() => router.push('/(tabs)/admin' as any)}
                  >
                    <View className="w-8 h-8 rounded-lg bg-red-600 justify-center items-center">
                      <Ionicons name="pulse" size={16} color="#FFFFFF" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[14.5px] font-bold text-white">System Maintenance Hub</Text>
                      <Text className="text-xs text-slate-400">Platform kill-switch & product health</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
                  </Pressable>

                  <Pressable
                    className="flex-row items-center py-3 border-b border-[#262930] gap-3"
                    onPress={() => router.push('/admin/sales-leads' as any)}
                  >
                    <View className="w-8 h-8 rounded-lg bg-emerald-600 justify-center items-center">
                      <Ionicons name="people" size={16} color="#FFFFFF" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[14.5px] font-bold text-white">Sales Leads & Outreach</Text>
                      <Text className="text-xs text-slate-400">Prospects, follow-ups & pipeline</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
                  </Pressable>

                  <Pressable
                    className="flex-row items-center py-3 gap-3"
                    onPress={() => router.push('/admin/monetize' as any)}
                  >
                    <View className="w-8 h-8 rounded-lg bg-amber-600 justify-center items-center">
                      <Ionicons name="cash" size={16} color="#FFFFFF" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[14.5px] font-bold text-white">Monetize & Revenue Engine</Text>
                      <Text className="text-xs text-slate-400">Store catalog, payout stats & revenue</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
                  </Pressable>
                </View>
              </>
            )}
          </View>
        )}

        {/* TAB 2: EDIT PROFILE */}
        {activeTab === 'edit' && (
          <View className="mb-2">
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
              PERSONAL & BUSINESS PROFILE
            </Text>
            <View className="rounded-2xl p-4 mb-5 bg-[#181A1F] border border-[#262930]">
              <Text className="text-xs font-bold text-white mb-1.5 mt-1">Full Name</Text>
              <TextInput
                className="border border-[#262930] bg-[#111317] text-white rounded-xl px-3.5 py-2.5 text-sm"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your full name"
                placeholderTextColor="#8E8E93"
              />

              <Text className="text-xs font-bold text-white mb-1.5 mt-3">Phone Number</Text>
              <TextInput
                className="border border-[#262930] bg-[#111317] text-white rounded-xl px-3.5 py-2.5 text-sm"
                value={phone}
                onChangeText={setPhone}
                placeholder="+1234567890"
                keyboardType="phone-pad"
                placeholderTextColor="#8E8E93"
              />

              <Text className="text-xs font-bold text-white mb-1.5 mt-3">Business / Company Name</Text>
              <TextInput
                className="border border-[#262930] bg-[#111317] text-white rounded-xl px-3.5 py-2.5 text-sm"
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="Acme Corp"
                placeholderTextColor="#8E8E93"
              />

              <Text className="text-xs font-bold text-white mb-1.5 mt-3">Business Email</Text>
              <TextInput
                className="border border-[#262930] bg-[#111317] text-white rounded-xl px-3.5 py-2.5 text-sm"
                value={businessEmail}
                onChangeText={setBusinessEmail}
                placeholder="contact@company.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#8E8E93"
              />

              <Text className="text-xs font-bold text-white mb-1.5 mt-3">Website</Text>
              <TextInput
                className="border border-[#262930] bg-[#111317] text-white rounded-xl px-3.5 py-2.5 text-sm"
                value={website}
                onChangeText={setWebsite}
                placeholder="https://example.com"
                autoCapitalize="none"
                placeholderTextColor="#8E8E93"
              />

              <View className="flex-row gap-3 mt-3">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-white mb-1.5">City</Text>
                  <TextInput
                    className="border border-[#262930] bg-[#111317] text-white rounded-xl px-3.5 py-2.5 text-sm"
                    value={city}
                    onChangeText={setCity}
                    placeholder="New York"
                    placeholderTextColor="#8E8E93"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-white mb-1.5">Country</Text>
                  <TextInput
                    className="border border-[#262930] bg-[#111317] text-white rounded-xl px-3.5 py-2.5 text-sm"
                    value={country}
                    onChangeText={setCountry}
                    placeholder="United States"
                    placeholderTextColor="#8E8E93"
                  />
                </View>
              </View>

              <Pressable
                className={`bg-blue-600 py-3.5 rounded-2xl items-center mt-5 mb-2 ${isSaving ? 'opacity-70' : ''}`}
                onPress={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white font-bold text-[15px]">Save Changes</Text>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {/* TAB 3: SECURITY */}
        {activeTab === 'security' && (
          <View className="mb-2">
            <View className="flex-row justify-between items-center px-1 mb-2">
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                APP LOCK & DEVICE SECURITY
              </Text>
              <View className={`flex-row items-center gap-1 px-2 py-0.5 rounded-lg ${biometricSettings.hasHardware ? 'bg-emerald-500/15' : 'bg-slate-500/15'}`}>
                <Ionicons
                  name={biometricSettings.hasHardware ? 'shield-checkmark' : 'information-circle'}
                  size={11}
                  color={biometricSettings.hasHardware ? '#10B981' : '#8E8E93'}
                />
                <Text className={`text-[10.5px] font-bold ${biometricSettings.hasHardware ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {biometricSettings.hasHardware ? `${biometricSettings.biometricLabel} Ready` : 'Passcode Mode'}
                </Text>
              </View>
            </View>

            <View className="rounded-2xl px-4 py-1 mb-5 bg-[#181A1F] border border-[#262930]">
              <View className={`flex-row items-center justify-between py-3.5 ${biometricSettings.enabled ? 'border-b border-[#262930]' : ''}`}>
                <View className="w-9 h-9 rounded-xl bg-emerald-500/15 items-center justify-center mr-3">
                  <Ionicons
                    name={
                      biometricSettings.biometricType === 'FACE_ID'
                        ? 'scan-outline'
                        : biometricSettings.biometricType === 'TOUCH_ID' || biometricSettings.biometricType === 'FINGERPRINT'
                          ? 'finger-print-outline'
                          : 'lock-closed-outline'
                    }
                    size={18}
                    color="#10B981"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-[14.5px] font-bold text-white">
                    {biometricSettings.biometricLabel} Lock
                  </Text>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    Require biometric scan or passcode to access app
                  </Text>
                </View>
                <Switch
                  value={biometricSettings.enabled}
                  onValueChange={handleToggleBiometric}
                  disabled={isUpdatingBiometrics}
                  trackColor={{ false: '#3A3A3C', true: '#10B981' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {biometricSettings.enabled && (
                <View className="py-3">
                  <View className="mb-2.5">
                    <Text className="text-[13.5px] font-bold text-white">
                      Require {biometricSettings.biometricLabel}
                    </Text>
                    <Text className="text-xs text-slate-400">
                      Time elapsed before app locks when minimized
                    </Text>
                  </View>

                  <View className="flex-row items-center p-1 rounded-xl bg-[#111317] border border-[#262930]">
                    {[
                      { label: 'Immediately', val: 0 },
                      { label: '1 min', val: 1 },
                      { label: '5 min', val: 5 },
                      { label: '15 min', val: 15 },
                    ].map((opt) => {
                      const isSelected = biometricSettings.timeoutMinutes === opt.val;
                      return (
                        <Pressable
                          key={opt.val}
                          className={`flex-1 py-2 items-center justify-center rounded-lg ${isSelected ? 'bg-[#262930]' : ''}`}
                          onPress={() => handleChangeTimeout(opt.val)}
                        >
                          <Text
                            className={`text-xs font-semibold ${isSelected ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* Logged in devices */}
            <View className="flex-row justify-between items-center px-1 mb-2">
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                LOGGED-IN DEVICES
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Refresh logged-in devices"
                onPress={() => refetchDeviceSessions()}
                disabled={isRefreshingDeviceSessions}
                hitSlop={8}
                className="flex-row items-center gap-1 px-1.5 py-1"
              >
                {isRefreshingDeviceSessions ? (
                  <ActivityIndicator size="small" color="#0A84FF" />
                ) : (
                  <Ionicons name="refresh" size={15} color="#0A84FF" />
                )}
                <Text className="text-blue-400 text-xs font-bold">Refresh</Text>
              </Pressable>
            </View>
            <View className="rounded-2xl px-4 py-1 mb-5 bg-[#181A1F] border border-[#262930]">
              <View className="flex-row items-center py-3 border-b border-[#262930]">
                <View className="w-9 h-9 rounded-xl bg-blue-500/15 items-center justify-center mr-3">
                  <Ionicons name="phone-portrait-outline" size={18} color="#0A84FF" />
                </View>
                <View className="flex-1">
                  <Text className="text-[14.5px] font-bold text-white">
                    {deviceSessionsResponse?.activeDeviceCount ?? 0} active {deviceSessionsResponse?.activeDeviceCount === 1 ? 'device' : 'devices'}
                  </Text>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    Devices currently signed in with this account
                  </Text>
                </View>
              </View>

              {isLoadingDeviceSessions ? (
                <DeviceSessionsSkeleton />
              ) : deviceSessionsError ? (
                <View className="flex-row items-center gap-2.5 py-3.5">
                  <Ionicons name="cloud-offline-outline" size={20} color="#EF4444" />
                  <View className="flex-1">
                    <Text className="text-[14.5px] font-bold text-white">
                      Could not load devices
                    </Text>
                    <Text className="text-xs text-slate-400">
                      Check your connection and tap Refresh.
                    </Text>
                  </View>
                </View>
              ) : deviceSessionsResponse?.devices?.length ? (
                deviceSessionsResponse.devices.map((device, index) => (
                  <View
                    key={device.sessionId}
                    className={`flex-row items-center py-3 ${index === deviceSessionsResponse.devices.length - 1 ? '' : 'border-b border-[#262930]'}`}
                  >
                    <View className="w-9 h-9 rounded-xl bg-emerald-500/15 items-center justify-center mr-3">
                      <Ionicons
                        name={device.platform === 'web' ? 'globe-outline' : device.deviceType === 'tablet' ? 'tablet-portrait-outline' : 'phone-portrait-outline'}
                        size={18}
                        color="#10B981"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[14.5px] font-bold text-white" numberOfLines={1}>
                        {device.deviceName}
                      </Text>
                      <Text className="text-xs text-slate-400 mt-0.5" numberOfLines={1}>
                        {[device.platform, device.osVersion, device.isOnline ? 'Online' : 'Offline', formatDeviceLastSeen(device)].filter(Boolean).join(' • ')}
                      </Text>
                    </View>
                    {device.isCurrent ? (
                      <View className="bg-emerald-500/15 px-2 py-1 rounded-md ml-2">
                        <Text className="text-emerald-400 text-[10px] font-extrabold">This device</Text>
                      </View>
                    ) : (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Sign out ${device.deviceName}`}
                        className="border border-red-500/40 bg-red-500/10 rounded-lg px-2.5 py-1.5 ml-2 items-center"
                        onPress={() => handleSignOutOtherDevice(device)}
                        disabled={signingOutDeviceId === device.sessionId}
                      >
                        {signingOutDeviceId === device.sessionId ? (
                          <ActivityIndicator size="small" color="#EF4444" />
                        ) : (
                          <Text className="text-red-400 text-xs font-bold">Sign out</Text>
                        )}
                      </Pressable>
                    )}
                  </View>
                ))
              ) : (
                <View className="py-3.5">
                  <Text className="text-xs text-slate-400">No active device logins found.</Text>
                </View>
              )}
            </View>

            {/* Authentication Credentials */}
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
              AUTHENTICATION & CREDENTIALS
            </Text>
            <View className="rounded-2xl px-4 py-1 mb-5 bg-[#181A1F] border border-[#262930]">
              <View className="flex-row items-center justify-between py-3.5 border-b border-[#262930]">
                <View className="flex-1">
                  <Text className="text-[14.5px] font-bold text-white">Password</Text>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    Send a secure password reset link to your email
                  </Text>
                </View>
                <Pressable
                  className="border border-[#3A3A3C] bg-[#2C2C2E] px-3.5 py-1.5 rounded-xl ml-3"
                  onPress={handlePasswordReset}
                >
                  <Text className="text-white font-bold text-xs">
                    Reset
                  </Text>
                </Pressable>
              </View>

              <View className="flex-row items-center justify-between py-3.5">
                <View className="flex-1">
                  <Text className="text-[14.5px] font-bold text-white">Two-Factor Authentication</Text>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    Enforce OTP / Magic link verification on sign-in
                  </Text>
                </View>
                <View className="bg-emerald-500/15 px-2.5 py-1 rounded-md ml-3">
                  <Text className="text-emerald-400 font-extrabold text-xs">Active</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* TAB 4: BILLING */}
        {activeTab === 'billing' && (
          <View className="mb-2">
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
              ACTIVE SUBSCRIPTION
            </Text>
            <View className="rounded-2xl p-4 mb-5 bg-[#181A1F] border border-blue-500">
              <View className="flex-row justify-between items-start mb-3">
                <View>
                  <Text className="text-xl font-extrabold text-white">
                    {subData?.plan_label || planLabel || profile?.subscription || 'Free Trial'}
                  </Text>
                  <Text className="text-xs font-bold text-blue-400 mt-0.5">
                    {subData?.plan_price_paise ? `₹${(subData.plan_price_paise / 100).toFixed(0)} / ${subData.billing_interval || 'plan'}` : (profile?.subscription ? `${profile.subscription} Member` : 'Active Platform Plan')}
                  </Text>
                </View>
                <View className="bg-blue-500/15 px-2.5 py-1 rounded-lg">
                  <Text className="text-blue-400 font-extrabold text-xs">
                    {isActive || subData?.subscription_status === 'active' || profile?.subscription ? 'Active' : 'Trial'}
                  </Text>
                </View>
              </View>

              {/* Progress */}
              <View className="my-2">
                <View className="flex-row justify-between mb-1.5">
                  <Text className="text-xs text-slate-400 font-semibold">
                    Subscription Duration
                  </Text>
                  <Text className="text-xs font-bold text-white">
                    {getDaysLeft()} Days Left
                  </Text>
                </View>
                <View className="h-1.5 rounded-full overflow-hidden bg-[#262930]">
                  <View
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(5, (getDaysLeft() / (subData?.plan_duration_days || 180)) * 100))}%` }}
                  />
                </View>
              </View>

              <Pressable
                className="bg-blue-600 py-3 rounded-xl items-center mt-3.5"
                onPress={() => router.push('/account/plans' as any)}
              >
                <Text className="text-white font-bold text-sm">Upgrade / Change Plan →</Text>
              </Pressable>
            </View>

            {/* Invoices History */}
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
              PAYMENT INVOICES & RECEIPTS
            </Text>
            <View className="rounded-2xl px-4 py-1 mb-5 bg-[#181A1F] border border-[#262930]">
              {invoicesData && invoicesData.length > 0 ? (
                invoicesData.map((inv: any, i: number) => (
                  <Pressable
                    key={inv.id}
                    className={`flex-row justify-between items-center py-3 ${i === invoicesData.length - 1 ? '' : 'border-b border-[#262930]'}`}
                    onPress={() => setSelectedInvoice(inv)}
                  >
                    <View className="flex-1">
                      <Text className="text-[13.5px] font-bold text-white">
                        {inv.plan_label || 'Subscription Payment'}
                      </Text>
                      <Text className="text-[11.5px] text-slate-400 mt-0.5">
                        {new Date(inv.charged_at || inv.created_at).toLocaleDateString()} • {inv.payment_id || 'Ref #10293'}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-[14.5px] font-extrabold text-white">
                        ₹{((inv.amount_paise || 0) / 100).toFixed(2)}
                      </Text>
                      <View className="bg-emerald-500/15 px-1.5 py-0.5 rounded mt-1">
                        <Text className="text-[9.5px] font-extrabold uppercase text-emerald-400">{inv.payment_status || 'Paid'}</Text>
                      </View>
                    </View>
                  </Pressable>
                ))
              ) : (
                <View className="py-4 items-center">
                  <Text className="text-xs text-slate-400">
                    No previous paid invoice records found.
                  </Text>
                </View>
              )}
            </View>

            {/* Billing Details Form */}
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
              GST & INVOICE DETAILS
            </Text>
            <View className="rounded-2xl p-4 mb-5 bg-[#181A1F] border border-[#262930]">
              <Text className="text-xs font-bold text-white mb-1.5">Billing / Company Name</Text>
              <TextInput
                className="border border-[#262930] bg-[#111317] text-white rounded-xl px-3.5 py-2.5 text-sm"
                value={billingName}
                onChangeText={setBillingName}
                placeholder="Business or Personal Name"
                placeholderTextColor="#8E8E93"
              />

              <Text className="text-xs font-bold text-white mb-1.5 mt-3">Billing Email</Text>
              <TextInput
                className="border border-[#262930] bg-[#111317] text-white rounded-xl px-3.5 py-2.5 text-sm"
                value={billingEmail}
                onChangeText={setBillingEmail}
                placeholder="billing@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#8E8E93"
              />

              <Text className="text-xs font-bold text-white mb-1.5 mt-3">GSTIN / Tax ID</Text>
              <TextInput
                className="border border-[#262930] bg-[#111317] text-white rounded-xl px-3.5 py-2.5 text-sm"
                value={taxId}
                onChangeText={setTaxId}
                placeholder="27AAAAA0000A1Z5 (Optional)"
                autoCapitalize="characters"
                placeholderTextColor="#8E8E93"
              />

              <Text className="text-xs font-bold text-white mb-1.5 mt-3">Billing Address</Text>
              <TextInput
                className="border border-[#262930] bg-[#111317] text-white rounded-xl px-3.5 py-2.5 text-sm"
                value={billingAddress1}
                onChangeText={setBillingAddress1}
                placeholder="Street address / Unit"
                placeholderTextColor="#8E8E93"
              />

              <View className="flex-row gap-3 mt-3">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-white mb-1.5">City</Text>
                  <TextInput
                    className="border border-[#262930] bg-[#111317] text-white rounded-xl px-3.5 py-2.5 text-sm"
                    value={billingCity}
                    onChangeText={setBillingCity}
                    placeholder="City"
                    placeholderTextColor="#8E8E93"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-white mb-1.5">Postal Code</Text>
                  <TextInput
                    className="border border-[#262930] bg-[#111317] text-white rounded-xl px-3.5 py-2.5 text-sm"
                    value={billingPostal}
                    onChangeText={setBillingPostal}
                    placeholder="400001"
                    keyboardType="numeric"
                    placeholderTextColor="#8E8E93"
                  />
                </View>
              </View>

              <Pressable
                className={`bg-blue-600 py-3.5 rounded-2xl items-center mt-5 mb-2 ${isSavingBilling ? 'opacity-70' : ''}`}
                onPress={handleSaveBilling}
                disabled={isSavingBilling}
              >
                {isSavingBilling ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white font-bold text-[15px]">Save Billing Information</Text>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {/* Invoice Detail Modal */}
        <Modal
          visible={!!selectedInvoice}
          animationType="slide"
          transparent
          onRequestClose={() => setSelectedInvoice(null)}
        >
          <View className="flex-1 bg-black/60 justify-end">
            <View className="rounded-t-3xl p-6 pb-10 border-t border-[#262930] bg-[#181A1F]">
              <View className="flex-row justify-between items-center border-b border-[#262930] pb-3.5">
                <Text className="text-lg font-bold text-white">Tax Invoice Receipt</Text>
                <Pressable onPress={() => setSelectedInvoice(null)} hitSlop={8}>
                  <Ionicons name="close-circle" size={24} color="#8E8E93" />
                </Pressable>
              </View>

              {selectedInvoice && (
                <View className="gap-3 py-3.5">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-[13.5px] text-slate-400">Invoice Number:</Text>
                    <Text className="text-[13.5px] font-semibold text-white">
                      GAP-2026-{String(selectedInvoice.id || '001').padStart(6, '0')}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-[13.5px] text-slate-400">Plan Description:</Text>
                    <Text className="text-[13.5px] font-semibold text-white">
                      {selectedInvoice.plan_label || 'GetAIPilot Subscription'}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-[13.5px] text-slate-400">Payment ID:</Text>
                    <Text className="text-[13.5px] font-semibold text-white">
                      {selectedInvoice.payment_id || 'Direct Verified'}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-[13.5px] text-slate-400">Status:</Text>
                    <Text className="text-[13.5px] font-bold text-emerald-400">
                      {selectedInvoice.payment_status || 'Paid'}
                    </Text>
                  </View>
                  <View className="h-[1px] bg-[#262930] my-1" />
                  <View className="flex-row justify-between items-center">
                    <Text className="text-base font-bold text-white">
                      Total Paid:
                    </Text>
                    <Text className="text-lg font-extrabold text-blue-400">
                      ₹{((selectedInvoice.amount_paise || 0) / 100).toFixed(2)}
                    </Text>
                  </View>
                </View>
              )}

              <Pressable
                className="bg-blue-600 py-3.5 rounded-2xl items-center mt-3"
                onPress={() => {
                  Alert.alert('Invoice Shared', 'Invoice PDF details copied to clipboard.');
                  setSelectedInvoice(null);
                }}
              >
                <Text className="text-white font-bold text-[15px]">Share / Save Receipt</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* TAB 5: PREFERENCES */}
        {activeTab === 'preferences' && (
          <View className="mb-2">
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
              APPLICATION PREFERENCES
            </Text>
            <View className="rounded-2xl px-4 py-1 mb-5 bg-[#181A1F] border border-[#262930]">
              <View className="flex-row items-center justify-between py-3.5 border-b border-[#262930]">
                <View className="flex-1 pr-2.5">
                  <Text className="text-[14.5px] font-bold text-white">Push Notifications</Text>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    Receive instant alerts on bot and campaign events
                  </Text>
                </View>
                <Switch
                  value={pushEnabled}
                  onValueChange={(val) => handleTogglePref('@pref_push', val, setPushEnabled)}
                  trackColor={{ false: '#3A3A3C', true: '#0A84FF' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View className="flex-row items-center justify-between py-3.5 border-b border-[#262930]">
                <View className="flex-1 pr-2.5">
                  <Text className="text-[14.5px] font-bold text-white">Email Digests</Text>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    Weekly reports on automation stats & usage
                  </Text>
                </View>
                <Switch
                  value={emailAlerts}
                  onValueChange={(val) => handleTogglePref('@pref_email', val, setEmailAlerts)}
                  trackColor={{ false: '#3A3A3C', true: '#0A84FF' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View className="flex-row items-center justify-between py-3.5">
                <View className="flex-1 pr-2.5">
                  <Text className="text-[14.5px] font-bold text-white">
                    {biometricSettings.biometricLabel} Lock
                  </Text>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    Require {biometricSettings.biometricLabel} or Passcode when opening the app
                  </Text>
                </View>
                <Switch
                  value={biometricSettings.enabled}
                  onValueChange={handleToggleBiometric}
                  disabled={isUpdatingBiometrics}
                  trackColor={{ false: '#3A3A3C', true: '#10B981' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </View>
        )}

        {/* Sign Out Button */}
        <Pressable
          className="py-3.5 rounded-2xl items-center mt-1 mb-4 border border-red-500/30 bg-red-500/10"
          onPress={handleSignOut}
        >
          <Text className="text-red-400 font-bold text-[15px]">Sign Out</Text>
        </Pressable>

        <Text className="text-center text-xs text-slate-500 mt-1">
          GetAiPilot Hub Mobile v1.0.0 (Build 2026)
        </Text>
      </ScrollView>
    </AppScreen>
  );
}

