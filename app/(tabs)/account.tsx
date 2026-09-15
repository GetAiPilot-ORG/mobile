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
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useColorScheme,
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

/**
 * A stable ID for this app installation.
 *
 * Do not use the Supabase access token or user password as the device ID.
 * The same ID is reused after app restarts, so the backend can upsert one
 * device instead of creating a new device on every request.
 */
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

const getDeviceRegistrationPayload = async () => {
  const deviceId = await getOrCreateDeviceId();

  return {
    deviceId,
    deviceName:
      Platform.OS === 'ios'
        ? 'iPhone / iPad'
        : Platform.OS === 'android'
          ? 'Android Device'
          : 'Web',
    platform:
      Platform.OS === 'ios'
        ? 'ios'
        : Platform.OS === 'android'
          ? 'android'
          : 'web',
    appVersion: 'mobile',
  };
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user, signOut } = useAuth();
  const { isAdmin, planLabel, isActive, plan } = usePlatformSubscription();
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
  const [billingState, setBillingState] = useState('');
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

  // Fetch Billing Profile (RLS-safe via BFF with Supabase fallback)
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

  // Device sessions are BFF-only.
  //
  // IMPORTANT:
  // This GET only reads the registered devices. It does not create a device
  // session. The registration effect below creates/updates the current device.
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

        console.log('[DeviceSessions] GET response:', response);

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

    // Don't keep stale device information for long.
    staleTime: 15_000,

    // One retry is enough. Repeated requests can make debugging harder.
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
      } else if (!cancelled) {
        // Still fetch existing devices if registration failed.
        await refetchDeviceSessions();
      }
    };

    syncCurrentDevice();

    // Keep lastSeenAt / online status fresh while this screen is open.
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

  // Biometric Toggle Handler with instant UI response and verification
  const handleToggleBiometric = async (value: boolean) => {
    if (isUpdatingBiometrics) return;
    setIsUpdatingBiometrics(true);

    // Optimistic UI state update
    setBiometricSettings((prev) => ({ ...prev, enabled: value }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await BiometricService.setEnabled(value);
      const updated = await BiometricService.getSettings();
      setBiometricSettings(updated);

      if (value) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Prompt biometric permission/verification asynchronously
        BiometricService.authenticate(`Verify ${updated.biometricLabel} Lock`).catch((e) =>
          console.warn('Biometric verification error:', e)
        );
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      console.error('Biometric toggle error:', err);
      // Revert if storage fails
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

  // Sign Out Handler
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

  // Calculate Subscription Days Left
  const getDaysLeft = () => {
    if (!subData?.expires_at) return 30;
    const diffTime = new Date(subData.expires_at).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  return (
    <AppScreen safeArea="top">
      <ScrollView
        style={[styles.scrollView, isDark ? styles.scrollViewDark : styles.scrollViewLight]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Apple ID / iCloud Profile Hero Card */}
        <View style={[styles.heroCard, isDark ? styles.heroCardDark : styles.heroCardLight]}>
          <View style={styles.heroTop}>
            <View style={[styles.avatar, isDark ? styles.avatarDark : styles.avatarLight]}>
              <Text style={styles.avatarText}>{initials}</Text>
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
                  <Ionicons name="checkmark-circle" size={13} color="#0A84FF" style={{ marginRight: 4 }} />
                  <Text style={[styles.badgeText, { color: '#0A84FF' }]}>Verified Account</Text>
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

          <View style={[styles.statsRow, isDark ? styles.statsRowDark : styles.statsRowLight]}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Status</Text>
              <Text style={[styles.statValue, { color: '#10B981' }]}>{isActive ? '● Active' : 'Free Trial'}</Text>
            </View>
            <View style={[styles.statItem, styles.statDivider, isDark ? styles.statDividerDark : styles.statDividerLight]}>
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Member Since</Text>
              <Text style={[styles.statValue, isDark && styles.statValueDark]}>{joinDate}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Plan</Text>
              <Text style={[styles.statValue, { color: '#0A84FF', fontWeight: '800' }]}>{planLabel || 'Free'}</Text>
            </View>
          </View>
        </View>

        {/* Apple iOS 18 Segmented Control with Animated Sliding Pill */}
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
              pointerEvents="none"
            />
          )}

          {TABS.map((tab) => {
            const isTabActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                style={styles.tabButton}
                onPress={() => handleTabChange(tab.id)}
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
          <View style={styles.tabContent}>
            {/* Account Information Card */}
            <Text style={[styles.sectionCaption, isDark && styles.sectionCaptionDark]}>
              ACCOUNT INFORMATION
            </Text>
            <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
              <View style={[styles.infoRow, isDark ? styles.infoRowDark : styles.infoRowLight]}>
                <Text style={[styles.infoLabel, isDark && styles.infoLabelDark]}>Email</Text>
                <Text style={[styles.infoValue, isDark && styles.infoValueDark]}>{user?.email || '-'}</Text>
              </View>
              <View style={[styles.infoRow, isDark ? styles.infoRowDark : styles.infoRowLight]}>
                <Text style={[styles.infoLabel, isDark && styles.infoLabelDark]}>Phone</Text>
                <Text style={[styles.infoValue, isDark && styles.infoValueDark]}>{phone || 'Not provided'}</Text>
              </View>
              <View style={[styles.infoRow, isDark ? styles.infoRowDark : styles.infoRowLight]}>
                <Text style={[styles.infoLabel, isDark && styles.infoLabelDark]}>Business Name</Text>
                <Text style={[styles.infoValue, isDark && styles.infoValueDark]}>{profile?.business_name || 'Individual'}</Text>
              </View>
              <View style={[styles.infoRow, isDark ? styles.infoRowDark : styles.infoRowLight]}>
                <Text style={[styles.infoLabel, isDark && styles.infoLabelDark]}>Website</Text>
                <Text style={[styles.infoValue, isDark && styles.infoValueDark]}>{profile?.website || 'Not provided'}</Text>
              </View>
              <View style={[styles.infoRow, isDark ? styles.infoRowDark : styles.infoRowLight]}>
                <Text style={[styles.infoLabel, isDark && styles.infoLabelDark]}>Location</Text>
                <Text style={[styles.infoValue, isDark && styles.infoValueDark]}>
                  {profile?.city ? `${profile.city}, ${profile.country || ''}` : profile?.country || 'Not set'}
                </Text>
              </View>
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.infoLabel, isDark && styles.infoLabelDark]}>Account ID</Text>
                <Text style={[styles.infoValue, isDark && styles.infoValueDark, { fontSize: 12.5 }]}>
                  {user?.id ? `${user.id.slice(0, 10)}...` : '-'}
                </Text>
              </View>
            </View>

            {/* Connected Platform Card */}
            <Text style={[styles.sectionCaption, isDark && styles.sectionCaptionDark]}>
              CONNECTED PLATFORMS
            </Text>
            <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
              <View style={[styles.infoRow, isDark ? styles.infoRowDark : styles.infoRowLight]}>
                <Text style={[styles.infoLabel, isDark && styles.infoLabelDark]}>Telegram ID</Text>
                <Text style={[styles.infoValue, isDark && styles.infoValueDark]}>
                  {profile?.telegram_user_id ? String(profile.telegram_user_id) : 'Not linked'}
                </Text>
              </View>
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.infoLabel, isDark && styles.infoLabelDark]}>Account Type</Text>
                <Text style={[styles.infoValue, isDark && styles.infoValueDark]}>{profile?.account_type || 'Personal'}</Text>
              </View>
            </View>

            {/* Resources & Quick Actions Card */}
            <Text style={[styles.sectionCaption, isDark && styles.sectionCaptionDark]}>
              RESOURCES & SETTINGS
            </Text>
            <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
              <Pressable
                style={[styles.navRow, isDark ? styles.navRowDark : styles.navRowLight]}
                onPress={() => router.push('/account/help' as any)}
              >
                <View style={[styles.navIconBox, { backgroundColor: '#0A84FF' }]}>
                  <Ionicons name="book" size={16} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.navRowTitle, isDark && styles.navRowTitleDark]}>Help Center & Docs</Text>
                  <Text style={[styles.navRowSubtitle, isDark && styles.navRowSubtitleDark]}>
                    Tutorials, FAQs, and ticket submission
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
              </Pressable>

              <Pressable
                style={[styles.navRow, isDark ? styles.navRowDark : styles.navRowLight]}
                onPress={() => router.push('/account/plans' as any)}
              >
                <View style={[styles.navIconBox, { backgroundColor: '#8B5CF6' }]}>
                  <Ionicons name="diamond" size={16} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.navRowTitle, isDark && styles.navRowTitleDark]}>Plans & Subscriptions</Text>
                  <Text style={[styles.navRowSubtitle, isDark && styles.navRowSubtitleDark]}>
                    Upgrade quota, view GAP Max features
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
              </Pressable>

              <Pressable
                style={[styles.navRow, { borderBottomWidth: 0 }]}
                onPress={() => router.push('/account/customize' as any)}
              >
                <View style={[styles.navIconBox, { backgroundColor: '#64748B' }]}>
                  <Ionicons name="options" size={16} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.navRowTitle, isDark && styles.navRowTitleDark]}>Customize App</Text>
                  <Text style={[styles.navRowSubtitle, isDark && styles.navRowSubtitleDark]}>
                    Toggle shortcuts, tool visibility & density
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
              </Pressable>
            </View>

            {/* Admin Center (Protected) */}
            {(profile?.is_admin || isAdmin) && (
              <>
                <Text style={[styles.sectionCaption, isDark && styles.sectionCaptionDark]}>
                  ADMINISTRATION
                </Text>
                <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight, { borderColor: '#10B981' }]}>
                  <View style={styles.adminTitleRow}>
                    <Text style={[styles.cardTitle, { color: '#10B981', marginBottom: 0 }]}>
                      🛡️ Admin Console
                    </Text>
                    <View style={styles.adminTag}>
                      <Text style={styles.adminTagText}>STAFF ONLY</Text>
                    </View>
                  </View>
                  <Text style={[styles.adminSubtitle, isDark && styles.adminSubtitleDark]}>
                    Authorized access to platform management, outreach, and store revenue.
                  </Text>

                  <Pressable
                    style={[styles.navRow, isDark ? styles.navRowDark : styles.navRowLight]}
                    onPress={() => router.push('/(tabs)/admin' as any)}
                  >
                    <View style={[styles.navIconBox, { backgroundColor: '#EF4444' }]}>
                      <Ionicons name="pulse" size={16} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.navRowTitle, isDark && styles.navRowTitleDark]}>System Maintenance Hub</Text>
                      <Text style={[styles.navRowSubtitle, isDark && styles.navRowSubtitleDark]}>Platform kill-switch & product health</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
                  </Pressable>

                  <Pressable
                    style={[styles.navRow, isDark ? styles.navRowDark : styles.navRowLight]}
                    onPress={() => router.push('/admin/sales-leads' as any)}
                  >
                    <View style={[styles.navIconBox, { backgroundColor: '#10B981' }]}>
                      <Ionicons name="people" size={16} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.navRowTitle, isDark && styles.navRowTitleDark]}>Sales Leads & Outreach</Text>
                      <Text style={[styles.navRowSubtitle, isDark && styles.navRowSubtitleDark]}>Prospects, follow-ups & pipeline</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
                  </Pressable>

                  <Pressable
                    style={[styles.navRow, { borderBottomWidth: 0 }]}
                    onPress={() => router.push('/admin/monetize' as any)}
                  >
                    <View style={[styles.navIconBox, { backgroundColor: '#F59E0B' }]}>
                      <Ionicons name="cash" size={16} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.navRowTitle, isDark && styles.navRowTitleDark]}>Monetize & Revenue Engine</Text>
                      <Text style={[styles.navRowSubtitle, isDark && styles.navRowSubtitleDark]}>Store catalog, payout stats & revenue</Text>
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
          <View style={styles.tabContent}>
            <Text style={[styles.sectionCaption, isDark && styles.sectionCaptionDark]}>
              PERSONAL & BUSINESS PROFILE
            </Text>
            <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Full Name</Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your full name"
                placeholderTextColor="#8E8E93"
              />

              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Phone Number</Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                value={phone}
                onChangeText={setPhone}
                placeholder="+1234567890"
                keyboardType="phone-pad"
                placeholderTextColor="#8E8E93"
              />

              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Business / Company Name</Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="Acme Corp"
                placeholderTextColor="#8E8E93"
              />

              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Business Email</Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                value={businessEmail}
                onChangeText={setBusinessEmail}
                placeholder="contact@company.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#8E8E93"
              />

              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Website</Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                value={website}
                onChangeText={setWebsite}
                placeholder="https://example.com"
                autoCapitalize="none"
                placeholderTextColor="#8E8E93"
              />

              <View style={styles.inputGrid}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>City</Text>
                  <TextInput
                    style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                    value={city}
                    onChangeText={setCity}
                    placeholder="New York"
                    placeholderTextColor="#8E8E93"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Country</Text>
                  <TextInput
                    style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                    value={country}
                    onChangeText={setCountry}
                    placeholder="United States"
                    placeholderTextColor="#8E8E93"
                  />
                </View>
              </View>

              <Pressable
                style={[styles.primaryButton, isSaving && { opacity: 0.7 }]}
                onPress={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Save Changes</Text>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {/* TAB 3: SECURITY */}
        {activeTab === 'security' && (
          <View style={styles.tabContent}>
            {/* SECTION 1: APP LOCK & BIOMETRICS */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionCaption, isDark && styles.sectionCaptionDark]}>
                APP LOCK & DEVICE SECURITY
              </Text>
              <View style={[styles.microBadge, biometricSettings.hasHardware ? styles.microBadgeGreen : styles.microBadgeGray]}>
                <Ionicons
                  name={biometricSettings.hasHardware ? 'shield-checkmark' : 'information-circle'}
                  size={11}
                  color={biometricSettings.hasHardware ? '#10B981' : '#8E8E93'}
                />
                <Text style={[styles.microBadgeText, { color: biometricSettings.hasHardware ? '#10B981' : '#8E8E93' }]}>
                  {biometricSettings.hasHardware ? `${biometricSettings.biometricLabel} Ready` : 'Passcode Mode'}
                </Text>
              </View>
            </View>

            <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
              {/* Biometric Toggle Switch */}
              <View style={[styles.actionRow, isDark ? styles.actionRowDark : styles.actionRowLight, !biometricSettings.enabled && { borderBottomWidth: 0 }]}>
                <View style={[styles.rowIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
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
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionTitle, isDark && styles.actionTitleDark]}>
                    {biometricSettings.biometricLabel} Lock
                  </Text>
                  <Text style={[styles.actionSubtitle, isDark && styles.actionSubtitleDark]}>
                    Require biometric scan or passcode to access app
                  </Text>
                </View>
                <Switch
                  value={biometricSettings.enabled}
                  onValueChange={handleToggleBiometric}
                  disabled={isUpdatingBiometrics}
                  trackColor={{ false: isDark ? '#3A3A3C' : '#E5E7EB', true: '#10B981' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Auto-Lock Timeout Config */}
              {biometricSettings.enabled && (
                <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
                  <View style={{ marginBottom: 10 }}>
                    <Text style={[styles.actionTitle, isDark && styles.actionTitleDark, { fontSize: 13.5 }]}>
                      Require {biometricSettings.biometricLabel}
                    </Text>
                    <Text style={[styles.actionSubtitle, isDark && styles.actionSubtitleDark]}>
                      Time elapsed before app locks when minimized
                    </Text>
                  </View>

                  {/* Segmented Timeout Selector */}
                  <View style={[styles.timeoutSegmentTrack, isDark ? styles.timeoutSegmentTrackDark : styles.timeoutSegmentTrackLight]}>
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
                          style={[
                            styles.timeoutPill,
                            isSelected && (isDark ? styles.timeoutPillSelectedDark : styles.timeoutPillSelectedLight),
                          ]}
                          onPress={() => handleChangeTimeout(opt.val)}
                        >
                          <Text
                            style={[
                              styles.timeoutPillText,
                              isDark ? styles.timeoutPillTextDark : styles.timeoutPillTextLight,
                              isSelected && styles.timeoutPillTextActive,
                            ]}
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

            {/* SECTION 2: LOGGED-IN DEVICES */}
            <View style={[styles.sectionHeaderRow, { marginTop: 14 }]}>
              <Text style={[styles.sectionCaption, isDark && styles.sectionCaptionDark]}>
                LOGGED-IN DEVICES
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Refresh logged-in devices"
                onPress={() => refetchDeviceSessions()}
                disabled={isRefreshingDeviceSessions}
                hitSlop={8}
                style={styles.deviceRefreshButton}
              >
                {isRefreshingDeviceSessions ? (
                  <ActivityIndicator size="small" color="#0A84FF" />
                ) : (
                  <Ionicons name="refresh" size={15} color="#0A84FF" />
                )}
                <Text style={styles.deviceRefreshText}>Refresh</Text>
              </Pressable>
            </View>
            <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
              <View style={[styles.deviceSummaryRow, isDark ? styles.actionRowDark : styles.actionRowLight]}>
                <View style={[styles.rowIconCircle, { backgroundColor: 'rgba(10, 132, 255, 0.15)' }]}>
                  <Ionicons name="phone-portrait-outline" size={18} color="#0A84FF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionTitle, isDark && styles.actionTitleDark]}>
                    {deviceSessionsResponse?.activeDeviceCount ?? 0} active {deviceSessionsResponse?.activeDeviceCount === 1 ? 'device' : 'devices'}
                  </Text>
                  <Text style={[styles.actionSubtitle, isDark && styles.actionSubtitleDark]}>
                    Devices currently signed in with this account
                  </Text>
                </View>
              </View>

              {isLoadingDeviceSessions ? (
                <DeviceSessionsSkeleton />
              ) : deviceSessionsError ? (
                <View style={styles.deviceLoadingRow}>
                  <Ionicons name="cloud-offline-outline" size={20} color="#EF4444" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.actionTitle, isDark && styles.actionTitleDark]}>
                      Could not load devices
                    </Text>
                    <Text style={[styles.actionSubtitle, isDark && styles.actionSubtitleDark]}>
                      Check your connection and tap Refresh.
                    </Text>
                  </View>
                </View>
              ) : deviceSessionsResponse?.devices?.length ? (
                deviceSessionsResponse.devices.map((device, index) => (
                  <View
                    key={device.sessionId}
                    style={[
                      styles.deviceRow,
                      index === deviceSessionsResponse.devices.length - 1 && { borderBottomWidth: 0 },
                      isDark ? styles.actionRowDark : styles.actionRowLight,
                    ]}
                  >
                    <View style={[styles.rowIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                      <Ionicons
                        name={device.platform === 'web' ? 'globe-outline' : device.deviceType === 'tablet' ? 'tablet-portrait-outline' : 'phone-portrait-outline'}
                        size={18}
                        color="#10B981"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.actionTitle, isDark && styles.actionTitleDark]} numberOfLines={1}>
                        {device.deviceName}
                      </Text>
                      <Text style={[styles.actionSubtitle, isDark && styles.actionSubtitleDark]} numberOfLines={1}>
                        {[device.platform, device.osVersion, device.isOnline ? 'Online' : 'Offline', formatDeviceLastSeen(device)].filter(Boolean).join(' • ')}
                      </Text>
                    </View>
                    {device.isCurrent ? (
                      <View style={styles.currentDeviceTag}>
                        <Text style={styles.currentDeviceTagText}>This device</Text>
                      </View>
                    ) : (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Sign out ${device.deviceName}`}
                        style={[styles.deviceSignOutButton, isDark && styles.deviceSignOutButtonDark]}
                        onPress={() => handleSignOutOtherDevice(device)}
                        disabled={signingOutDeviceId === device.sessionId}
                      >
                        {signingOutDeviceId === device.sessionId ? (
                          <ActivityIndicator size="small" color="#EF4444" />
                        ) : (
                          <Text style={styles.deviceSignOutText}>Sign out</Text>
                        )}
                      </Pressable>
                    )}
                  </View>
                ))
              ) : (
                <View style={styles.deviceLoadingRow}>
                  <Text style={[styles.actionSubtitle, isDark && styles.actionSubtitleDark]}>No active device logins found.</Text>
                </View>
              )}
            </View>

            {/* SECTION 3: AUTHENTICATION & CREDENTIALS */}
            <Text style={[styles.sectionCaption, isDark && styles.sectionCaptionDark, { marginTop: 14 }]}>
              AUTHENTICATION & CREDENTIALS
            </Text>
            <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
              <View style={[styles.actionRow, isDark ? styles.actionRowDark : styles.actionRowLight]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionTitle, isDark && styles.actionTitleDark]}>Password</Text>
                  <Text style={[styles.actionSubtitle, isDark && styles.actionSubtitleDark]}>
                    Send a secure password reset link to your email
                  </Text>
                </View>
                <Pressable
                  style={[styles.secondaryButton, isDark ? styles.secondaryButtonDark : styles.secondaryButtonLight]}
                  onPress={handlePasswordReset}
                >
                  <Text style={[styles.secondaryButtonText, isDark ? styles.secondaryButtonTextDark : styles.secondaryButtonTextLight]}>
                    Reset
                  </Text>
                </Pressable>
              </View>

              <View style={[styles.actionRow, { borderBottomWidth: 0 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionTitle, isDark && styles.actionTitleDark]}>Two-Factor Authentication</Text>
                  <Text style={[styles.actionSubtitle, isDark && styles.actionSubtitleDark]}>
                    Enforce OTP / Magic link verification on sign-in
                  </Text>
                </View>
                <View style={styles.activeTag}>
                  <Text style={styles.activeTagText}>Active</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* TAB 4: BILLING */}
        {activeTab === 'billing' && (
          <View style={styles.tabContent}>
            {/* Active Plan Card */}
            <Text style={[styles.sectionCaption, isDark && styles.sectionCaptionDark]}>
              ACTIVE SUBSCRIPTION
            </Text>
            <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight, { borderColor: '#0A84FF', borderWidth: 1.5 }]}>
              <View style={styles.planCardHeader}>
                <View>
                  <Text style={[styles.planCardTitle, isDark && styles.planCardTitleDark]}>
                    {subData?.plan_label || planLabel || profile?.subscription || 'Free Trial'}
                  </Text>
                  <Text style={styles.planCardPrice}>
                    {subData?.plan_price_paise ? `₹${(subData.plan_price_paise / 100).toFixed(0)} / ${subData.billing_interval || 'plan'}` : (profile?.subscription ? `${profile.subscription} Member` : 'Active Platform Plan')}
                  </Text>
                </View>
                <View style={[styles.badge, isDark ? styles.badgeDark : styles.badgeLight]}>
                  <Text style={[styles.badgeText, { color: '#0A84FF', fontWeight: '800' }]}>
                    {isActive || subData?.subscription_status === 'active' || profile?.subscription ? 'Active' : 'Trial'}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.planProgressContainer}>
                <View style={styles.planProgressRow}>
                  <Text style={[styles.planProgressLabel, isDark && styles.planProgressLabelDark]}>
                    Subscription Duration
                  </Text>
                  <Text style={[styles.planProgressValue, isDark && styles.planProgressValueDark]}>
                    {getDaysLeft()} Days Left
                  </Text>
                </View>
                <View style={[styles.progressBarTrack, isDark ? styles.progressBarTrackDark : styles.progressBarTrackLight]}>
                  <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(5, (getDaysLeft() / (subData?.plan_duration_days || 180)) * 100))}%` }]} />
                </View>
              </View>

              <Pressable
                style={[styles.primaryButton, { marginTop: 14 }]}
                onPress={() => router.push('/account/plans' as any)}
              >
                <Text style={styles.primaryButtonText}>Upgrade / Change Plan →</Text>
              </Pressable>
            </View>

            {/* Invoices History Table */}
            <Text style={[styles.sectionCaption, isDark && styles.sectionCaptionDark]}>
              PAYMENT INVOICES & RECEIPTS
            </Text>
            <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
              {invoicesData && invoicesData.length > 0 ? (
                invoicesData.map((inv: any, i: number) => (
                  <Pressable
                    key={inv.id}
                    style={[
                      styles.invoiceRow,
                      isDark ? styles.invoiceRowDark : styles.invoiceRowLight,
                      i === invoicesData.length - 1 && { borderBottomWidth: 0 },
                    ]}
                    onPress={() => setSelectedInvoice(inv)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.invoiceNumber, isDark && styles.invoiceNumberDark]}>
                        {inv.plan_label || 'Subscription Payment'}
                      </Text>
                      <Text style={[styles.invoiceDate, isDark && styles.invoiceDateDark]}>
                        {new Date(inv.charged_at || inv.created_at).toLocaleDateString()} • {inv.payment_id || 'Ref #10293'}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.invoiceAmount, isDark && styles.invoiceAmountDark]}>
                        ₹{((inv.amount_paise || 0) / 100).toFixed(2)}
                      </Text>
                      <View style={[styles.miniStatusBadge, isDark ? styles.miniStatusBadgeDark : styles.miniStatusBadgeLight]}>
                        <Text style={[styles.miniStatusText, { color: '#10B981' }]}>{inv.payment_status || 'Paid'}</Text>
                      </View>
                    </View>
                  </Pressable>
                ))
              ) : (
                <View style={styles.emptyInvoiceBox}>
                  <Text style={[styles.emptyInvoiceText, isDark && styles.emptyInvoiceTextDark]}>
                    No previous paid invoice records found.
                  </Text>
                </View>
              )}
            </View>

            {/* Billing Details Form */}
            <Text style={[styles.sectionCaption, isDark && styles.sectionCaptionDark]}>
              GST & INVOICE DETAILS
            </Text>
            <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Billing / Company Name</Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                value={billingName}
                onChangeText={setBillingName}
                placeholder="Business or Personal Name"
                placeholderTextColor="#8E8E93"
              />

              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Billing Email</Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                value={billingEmail}
                onChangeText={setBillingEmail}
                placeholder="billing@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#8E8E93"
              />

              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>GSTIN / Tax ID</Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                value={taxId}
                onChangeText={setTaxId}
                placeholder="27AAAAA0000A1Z5 (Optional)"
                autoCapitalize="characters"
                placeholderTextColor="#8E8E93"
              />

              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Billing Address</Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                value={billingAddress1}
                onChangeText={setBillingAddress1}
                placeholder="Street address / Unit"
                placeholderTextColor="#8E8E93"
              />

              <View style={styles.inputGrid}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>City</Text>
                  <TextInput
                    style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                    value={billingCity}
                    onChangeText={setBillingCity}
                    placeholder="City"
                    placeholderTextColor="#8E8E93"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Postal Code</Text>
                  <TextInput
                    style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                    value={billingPostal}
                    onChangeText={setBillingPostal}
                    placeholder="400001"
                    keyboardType="numeric"
                    placeholderTextColor="#8E8E93"
                  />
                </View>
              </View>

              <Pressable
                style={[styles.primaryButton, isSavingBilling && { opacity: 0.7 }]}
                onPress={handleSaveBilling}
                disabled={isSavingBilling}
              >
                {isSavingBilling ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Save Billing Information</Text>
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
          <View style={styles.modalOverlay}>
            <View style={[styles.invoiceModal, isDark ? styles.invoiceModalDark : styles.invoiceModalLight]}>
              <View style={[styles.modalHeader, isDark ? styles.modalHeaderDark : styles.modalHeaderLight]}>
                <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>Tax Invoice Receipt</Text>
                <Pressable onPress={() => setSelectedInvoice(null)} hitSlop={8}>
                  <Ionicons name="close-circle" size={24} color="#8E8E93" />
                </Pressable>
              </View>

              {selectedInvoice && (
                <View style={{ gap: 12, paddingVertical: 14 }}>
                  <View style={styles.invoiceModalRow}>
                    <Text style={[styles.invoiceModalLabel, isDark && styles.invoiceModalLabelDark]}>Invoice Number:</Text>
                    <Text style={[styles.invoiceModalVal, isDark && styles.invoiceModalValDark]}>
                      GAP-2026-{String(selectedInvoice.id || '001').padStart(6, '0')}
                    </Text>
                  </View>
                  <View style={styles.invoiceModalRow}>
                    <Text style={[styles.invoiceModalLabel, isDark && styles.invoiceModalLabelDark]}>Plan Description:</Text>
                    <Text style={[styles.invoiceModalVal, isDark && styles.invoiceModalValDark]}>
                      {selectedInvoice.plan_label || 'GetAIPilot Subscription'}
                    </Text>
                  </View>
                  <View style={styles.invoiceModalRow}>
                    <Text style={[styles.invoiceModalLabel, isDark && styles.invoiceModalLabelDark]}>Payment ID:</Text>
                    <Text style={[styles.invoiceModalVal, isDark && styles.invoiceModalValDark]}>
                      {selectedInvoice.payment_id || 'Direct Verified'}
                    </Text>
                  </View>
                  <View style={styles.invoiceModalRow}>
                    <Text style={[styles.invoiceModalLabel, isDark && styles.invoiceModalLabelDark]}>Status:</Text>
                    <Text style={[styles.invoiceModalVal, { color: '#10B981', fontWeight: 'bold' }]}>
                      {selectedInvoice.payment_status || 'Paid'}
                    </Text>
                  </View>
                  <View style={[styles.invoiceModalDivider, isDark ? styles.invoiceModalDividerDark : styles.invoiceModalDividerLight]} />
                  <View style={styles.invoiceModalRow}>
                    <Text style={[styles.invoiceModalLabel, { fontSize: 16, fontWeight: 'bold' }, isDark && styles.invoiceModalLabelDark]}>
                      Total Paid:
                    </Text>
                    <Text style={[styles.invoiceModalVal, { fontSize: 18, fontWeight: '800', color: '#0A84FF' }]}>
                      ₹{((selectedInvoice.amount_paise || 0) / 100).toFixed(2)}
                    </Text>
                  </View>
                </View>
              )}

              <Pressable
                style={styles.primaryButton}
                onPress={() => {
                  Alert.alert('Invoice Shared', 'Invoice PDF details copied to clipboard.');
                  setSelectedInvoice(null);
                }}
              >
                <Text style={styles.primaryButtonText}>Share / Save Receipt</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* TAB 5: PREFERENCES */}
        {activeTab === 'preferences' && (
          <View style={styles.tabContent}>
            <Text style={[styles.sectionCaption, isDark && styles.sectionCaptionDark]}>
              APPLICATION PREFERENCES
            </Text>
            <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
              <View style={[styles.switchRow, isDark ? styles.switchRowDark : styles.switchRowLight]}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={[styles.switchTitle, isDark && styles.switchTitleDark]}>Push Notifications</Text>
                  <Text style={[styles.switchSubtitle, isDark && styles.switchSubtitleDark]}>
                    Receive instant alerts on bot and campaign events
                  </Text>
                </View>
                <Switch
                  value={pushEnabled}
                  onValueChange={(val) => handleTogglePref('@pref_push', val, setPushEnabled)}
                  trackColor={{ false: isDark ? '#3A3A3C' : '#E5E7EB', true: '#0A84FF' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={[styles.switchRow, isDark ? styles.switchRowDark : styles.switchRowLight]}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={[styles.switchTitle, isDark && styles.switchTitleDark]}>Email Digests</Text>
                  <Text style={[styles.switchSubtitle, isDark && styles.switchSubtitleDark]}>
                    Weekly reports on automation stats & usage
                  </Text>
                </View>
                <Switch
                  value={emailAlerts}
                  onValueChange={(val) => handleTogglePref('@pref_email', val, setEmailAlerts)}
                  trackColor={{ false: isDark ? '#3A3A3C' : '#E5E7EB', true: '#0A84FF' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={[styles.switchTitle, isDark && styles.switchTitleDark]}>
                    {biometricSettings.biometricLabel} Lock
                  </Text>
                  <Text style={[styles.switchSubtitle, isDark && styles.switchSubtitleDark]}>
                    Require {biometricSettings.biometricLabel} or Passcode when opening the app
                  </Text>
                </View>
                <Switch
                  value={biometricSettings.enabled}
                  onValueChange={handleToggleBiometric}
                  disabled={isUpdatingBiometrics}
                  trackColor={{ false: isDark ? '#3A3A3C' : '#E5E7EB', true: '#10B981' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </View>
        )}

        {/* Sign Out Button */}
        <Pressable
          style={[styles.signOutButton, isDark ? styles.signOutButtonDark : styles.signOutButtonLight]}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </Pressable>

        <Text style={[styles.versionText, isDark && styles.versionTextDark]}>
          GetAiPilot Hub Mobile v1.0.0 (Build 2026)
        </Text>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollViewLight: {
    backgroundColor: '#F8F9FA',
  },
  scrollViewDark: {
    backgroundColor: '#000000',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 150,
  },
  // ─── Apple ID Profile Hero ────────────────────────────────────
  heroCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
  },
  heroCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  heroCardDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 4,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
  },
  avatarLight: {
    backgroundColor: '#0A84FF',
    borderColor: '#EBF5FF',
  },
  avatarDark: {
    backgroundColor: '#0A84FF',
    borderColor: 'rgba(10, 132, 255, 0.45)',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroInfo: {
    flex: 1,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: -0.4,
  },
  heroNameDark: {
    color: '#FFFFFF',
  },
  heroEmail: {
    fontSize: 13.5,
    color: '#6B7280',
    marginTop: 2,
  },
  heroEmailDark: {
    color: '#8E8E93',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeLight: {
    backgroundColor: '#EBF5FF',
  },
  badgeDark: {
    backgroundColor: 'rgba(10, 132, 255, 0.16)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextLight: {
    color: '#0A84FF',
  },
  badgeTextDark: {
    color: '#0A84FF',
  },
  adminBadgeLight: {
    backgroundColor: '#DCFCE7',
  },
  adminBadgeDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 14,
  },
  statsRowLight: {
    borderTopColor: '#F2F4F7',
  },
  statsRowDark: {
    borderTopColor: '#2C2C2E',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  statDividerLight: {
    borderColor: '#F2F4F7',
  },
  statDividerDark: {
    borderColor: '#2C2C2E',
  },
  statLabel: {
    fontSize: 10.5,
    color: '#8E8E93',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: '700',
  },
  statLabelDark: {
    color: '#8E8E93',
  },
  statValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#000000',
  },
  statValueDark: {
    color: '#FFFFFF',
  },
  // ─── Segmented Control Track ──────────────────────────────────
  tabsTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    position: 'relative',
    height: 44,
  },
  tabsTrackLight: {
    backgroundColor: '#F2F4F7',
    borderColor: '#E5E7EB',
  },
  tabsTrackDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  slidingTabPill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: 10,
    zIndex: 1,
  },
  slidingTabPillLight: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  slidingTabPillDark: {
    backgroundColor: '#0A84FF',
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    zIndex: 2,
  },
  tabText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  tabTextLight: {
    color: '#6B7280',
  },
  tabTextDark: {
    color: '#8E8E93',
  },
  tabTextActiveLight: {
    color: '#000000',
    fontWeight: '800',
  },
  tabTextActiveDark: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  tabContent: {
    marginBottom: 8,
  },
  // ─── Section Captions & Cards ─────────────────────────────────
  sectionCaption: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCaptionDark: {
    color: '#8E8E93',
  },
  card: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 20,
    borderWidth: 1,
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  cardDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  infoRowLight: {
    borderBottomColor: '#F2F4F7',
  },
  infoRowDark: {
    borderBottomColor: '#2C2C2E',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoLabelDark: {
    color: '#8E8E93',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  infoValueDark: {
    color: '#FFFFFF',
  },
  // ─── Navigation Rows with Squircle Icons ──────────────────────
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  navRowLight: {
    borderBottomColor: '#F2F4F7',
  },
  navRowDark: {
    borderBottomColor: '#2C2C2E',
  },
  navIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navRowTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#000000',
  },
  navRowTitleDark: {
    color: '#FFFFFF',
  },
  navRowSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  navRowSubtitleDark: {
    color: '#8E8E93',
  },
  adminTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginBottom: 4,
  },
  adminTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  adminTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  adminSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 10,
    lineHeight: 16,
  },
  adminSubtitleDark: {
    color: '#8E8E93',
  },
  // ─── Form Inputs ──────────────────────────────────────────────
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 6,
    marginTop: 12,
  },
  inputLabelDark: {
    color: '#FFFFFF',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
  },
  inputLight: {
    backgroundColor: '#F8F9FA',
    borderColor: '#E5E7EB',
    color: '#000000',
  },
  inputDark: {
    backgroundColor: '#2C2C2E',
    borderColor: '#3A3A3C',
    color: '#FFFFFF',
  },
  inputGrid: {
    flexDirection: 'row',
  },
  primaryButton: {
    backgroundColor: '#0A84FF',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  actionRowLight: {
    borderBottomColor: '#F2F4F7',
  },
  actionRowDark: {
    borderBottomColor: '#2C2C2E',
  },
  rowIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#000000',
  },
  actionTitleDark: {
    color: '#FFFFFF',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  actionSubtitleDark: {
    color: '#8E8E93',
  },
  secondaryButton: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    marginLeft: 12,
  },
  secondaryButtonLight: {
    backgroundColor: '#F2F4F7',
    borderColor: '#E5E7EB',
  },
  secondaryButtonDark: {
    backgroundColor: '#2C2C2E',
    borderColor: '#3A3A3C',
  },
  secondaryButtonText: {
    fontWeight: '700',
    fontSize: 13,
  },
  secondaryButtonTextLight: {
    color: '#000000',
  },
  secondaryButtonTextDark: {
    color: '#FFFFFF',
  },
  activeTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 12,
  },
  activeTagText: {
    color: '#10B981',
    fontWeight: '800',
    fontSize: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  switchRowLight: {
    borderBottomColor: '#F2F4F7',
  },
  switchRowDark: {
    borderBottomColor: '#2C2C2E',
  },
  switchTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#000000',
  },
  switchTitleDark: {
    color: '#FFFFFF',
  },
  switchSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  switchSubtitleDark: {
    color: '#8E8E93',
  },
  signOutButton: {
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
    borderWidth: 1,
  },
  signOutButtonLight: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  signOutButtonDark: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.28)',
  },
  signOutButtonText: {
    color: '#EF4444',
    fontWeight: '800',
    fontSize: 15,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  versionTextDark: {
    color: '#8E8E93',
  },
  // ─── Billing Tab Specifics ────────────────────────────────────
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 10,
    marginBottom: 12,
  },
  planCardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000000',
  },
  planCardTitleDark: {
    color: '#FFFFFF',
  },
  planCardPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0A84FF',
    marginTop: 2,
  },
  planProgressContainer: {
    marginVertical: 8,
  },
  planProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  planProgressLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  planProgressLabelDark: {
    color: '#8E8E93',
  },
  planProgressValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  planProgressValueDark: {
    color: '#FFFFFF',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarTrackLight: {
    backgroundColor: '#E5E7EB',
  },
  progressBarTrackDark: {
    backgroundColor: '#2C2C2E',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0A84FF',
    borderRadius: 3,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  invoiceRowLight: {
    borderBottomColor: '#F2F4F7',
  },
  invoiceRowDark: {
    borderBottomColor: '#2C2C2E',
  },
  invoiceNumber: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#000000',
  },
  invoiceNumberDark: {
    color: '#FFFFFF',
  },
  invoiceDate: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 2,
  },
  invoiceDateDark: {
    color: '#8E8E93',
  },
  invoiceAmount: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#000000',
  },
  invoiceAmountDark: {
    color: '#FFFFFF',
  },
  miniStatusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  miniStatusBadgeLight: {
    backgroundColor: '#DCFCE7',
  },
  miniStatusBadgeDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
  },
  miniStatusText: {
    fontSize: 9.5,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  emptyInvoiceBox: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  emptyInvoiceText: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyInvoiceTextDark: {
    color: '#8E8E93',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  invoiceModal: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
  },
  invoiceModalLight: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E5E7EB',
  },
  invoiceModalDark: {
    backgroundColor: '#1C1C1E',
    borderTopColor: '#2C2C2E',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 14,
  },
  modalHeaderLight: {
    borderBottomColor: '#F2F4F7',
  },
  modalHeaderDark: {
    borderBottomColor: '#2C2C2E',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
  },
  modalTitleDark: {
    color: '#FFFFFF',
  },
  invoiceModalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceModalLabel: {
    fontSize: 13.5,
    color: '#6B7280',
  },
  invoiceModalLabelDark: {
    color: '#8E8E93',
  },
  invoiceModalVal: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#000000',
  },
  invoiceModalValDark: {
    color: '#FFFFFF',
  },
  invoiceModalDivider: {
    height: 1,
    marginVertical: 4,
  },
  invoiceModalDividerLight: {
    backgroundColor: '#F2F4F7',
  },
  invoiceModalDividerDark: {
    backgroundColor: '#2C2C2E',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  deviceRefreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  deviceRefreshText: {
    color: '#0A84FF',
    fontSize: 12,
    fontWeight: '700',
  },
  deviceSummaryRow: {
    paddingVertical: 13,
  },
  deviceLoadingRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  currentDeviceTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    marginLeft: 8,
  },
  currentDeviceTagText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
  },
  deviceSignOutButton: {
    minWidth: 66,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.42)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginLeft: 8,
  },
  deviceSignOutButtonDark: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
  },
  deviceSignOutText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
  },
  microBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  microBadgeGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  microBadgeGray: {
    backgroundColor: 'rgba(142, 142, 147, 0.12)',
  },
  microBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  timeoutSegmentTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    borderRadius: 12,
  },
  timeoutSegmentTrackLight: {
    backgroundColor: '#F2F4F7',
  },
  timeoutSegmentTrackDark: {
    backgroundColor: '#2C2C2E',
  },
  timeoutPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  timeoutPillSelectedLight: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  timeoutPillSelectedDark: {
    backgroundColor: '#3A3A3C',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  timeoutPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeoutPillTextLight: {
    color: '#6B7280',
  },
  timeoutPillTextDark: {
    color: '#8E8E93',
  },
  timeoutPillTextActive: {
    color: '#10B981',
    fontWeight: '800',
  },
});
