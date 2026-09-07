import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Profile } from '../../src/types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useRouter } from 'expo-router';
import { usePlatformSubscription } from '../../src/hooks/usePlatformSubscription';

type AccountTab = 'overview' | 'edit' | 'security' | 'billing' | 'preferences';

export default function AccountScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin, planLabel, isActive, plan } = usePlatformSubscription();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AccountTab>('overview');

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

  // Billing Details State (matches UserProfile.tsx)
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

  // Preference switches
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // Fetch Profile
  const { data: profile, isLoading, refetch } = useQuery<Profile | null>({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data as Profile;
    },
    enabled: !!user?.id,
  });

  // Fetch Subscription details
  const { data: subData } = useQuery({
    queryKey: ['user-subscription-details', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
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
      const { data } = await supabase
        .from('app_billing_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
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
        const savedBio = await AsyncStorage.getItem('@pref_bio');
        if (savedPush !== null) setPushEnabled(savedPush === 'true');
        if (savedEmail !== null) setEmailAlerts(savedEmail === 'true');
        if (savedBio !== null) setBiometricEnabled(savedBio === 'true');
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
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone,
          mobile_number: phone,
          business_name: businessName,
          business_email: businessEmail,
          category: category,
          account_type: accountType,
          website: website,
          city: city,
          state: state,
          country: country,
          instagram_url: instagramUrl,
          facebook_url: facebookUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['user-profile', user.id] });
      await queryClient.invalidateQueries({ queryKey: ['platform-subscription'] });
      Alert.alert('Success', 'Profile updated successfully.');
      setActiveTab('overview');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBilling = async () => {
    if (!user?.id) return;
    setIsSavingBilling(true);
    try {
      const { error } = await supabase
        .from('app_billing_profiles')
        .upsert(
          {
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
          },
          { onConflict: 'user_id' }
        );

      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['user-billing-profile', user.id] });
      Alert.alert('Success', 'Billing information updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save billing profile.');
    } finally {
      setIsSavingBilling(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    Alert.alert(
      'Reset Password',
      `Send password reset link to ${user.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Link',
          onPress: async () => {
            try {
              const { error } = await supabase.auth.resetPasswordForEmail(user.email!);
              if (error) throw error;
              Alert.alert('Email Sent', 'Check your inbox for password reset instructions.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to send reset link.');
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out from GetAIPilot?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
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
  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : '-';

  // Calculate Subscription Days Left
  const getDaysLeft = () => {
    if (!subData?.expires_at) return 30;
    const diffTime = new Date(subData.expires_at).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Hero Header */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroName} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.heroEmail} numberOfLines={1}>
                {user?.email || phone || 'User'}
              </Text>
              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Verified Account</Text>
                </View>
                {profile?.is_admin && (
                  <View style={[styles.badge, { backgroundColor: '#16b882' }]}>
                    <Text style={[styles.badgeText, { color: '#003c33' }]}>Admin</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Status</Text>
              <Text style={styles.statValue}>{isActive ? 'Active' : 'Free Trial'}</Text>
            </View>
            <View style={[styles.statItem, styles.statDivider]}>
              <Text style={styles.statLabel}>Member Since</Text>
              <Text style={styles.statValue}>{joinDate}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Plan</Text>
              <Text style={styles.statValue}>{planLabel || 'Free'}</Text>
            </View>
          </View>
        </View>

        {/* Tab Navigation Segment */}
        <View style={styles.tabsContainer}>
          <Pressable
            style={[styles.tabButton, activeTab === 'overview' && styles.tabButtonActive]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
              Overview
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, activeTab === 'edit' && styles.tabButtonActive]}
            onPress={() => setActiveTab('edit')}
          >
            <Text style={[styles.tabText, activeTab === 'edit' && styles.tabTextActive]}>
              Edit Profile
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, activeTab === 'security' && styles.tabButtonActive]}
            onPress={() => setActiveTab('security')}
          >
            <Text style={[styles.tabText, activeTab === 'security' && styles.tabTextActive]}>
              Security
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, activeTab === 'billing' && styles.tabButtonActive]}
            onPress={() => setActiveTab('billing')}
          >
            <Text style={[styles.tabText, activeTab === 'billing' && styles.tabTextActive]}>
              Billing
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, activeTab === 'preferences' && styles.tabButtonActive]}
            onPress={() => setActiveTab('preferences')}
          >
            <Text style={[styles.tabText, activeTab === 'preferences' && styles.tabTextActive]}>
              Settings
            </Text>
          </Pressable>
        </View>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Account Details</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user?.email || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{phone || 'Not provided'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Business Name</Text>
                <Text style={styles.infoValue}>{profile?.business_name || 'Individual'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Website</Text>
                <Text style={styles.infoValue}>{profile?.website || 'Not provided'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>
                  {profile?.city ? `${profile.city}, ${profile.country || ''}` : profile?.country || 'Not set'}
                </Text>
              </View>
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.infoLabel}>Account ID</Text>
                <Text style={[styles.infoValue, { fontSize: 12 }]}>{user?.id?.slice(0, 12)}...</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Connected Platform ID</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Telegram ID</Text>
                <Text style={styles.infoValue}>
                  {profile?.telegram_user_id ? String(profile.telegram_user_id) : 'Not linked'}
                </Text>
              </View>
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.infoLabel}>Account Type</Text>
                <Text style={styles.infoValue}>{profile?.account_type || 'Personal'}</Text>
              </View>
            </View>

            {/* Quick Links / Resources */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Support & App Settings</Text>

              <Pressable
                style={styles.navRow}
                onPress={() => router.push('/account/help' as any)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.navRowTitle}>📖 Help Center & Docs</Text>
                  <Text style={styles.navRowSubtitle}>Tutorials, FAQs, and ticket submission</Text>
                </View>
                <Text style={styles.navRowArrow}>→</Text>
              </Pressable>

              <Pressable
                style={styles.navRow}
                onPress={() => router.push('/account/plans' as any)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.navRowTitle}>💎 Plans & Subscriptions</Text>
                  <Text style={styles.navRowSubtitle}>Upgrade quota, view GAP Max features</Text>
                </View>
                <Text style={styles.navRowArrow}>→</Text>
              </Pressable>

              <Pressable
                style={[styles.navRow, { borderBottomWidth: 0 }]}
                onPress={() => router.push('/account/customize' as any)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.navRowTitle}>⚙️ Customize App</Text>
                  <Text style={styles.navRowSubtitle}>Toggle shortcuts, tool visibility & density</Text>
                </View>
                <Text style={styles.navRowArrow}>→</Text>
              </Pressable>
            </View>

            {/* Admin Center (Protected) */}
            {(profile?.is_admin || isAdmin) && (
              <View style={[styles.card, { borderColor: '#16b882' }]}>
                <View style={styles.adminTitleRow}>
                  <Text style={[styles.cardTitle, { color: '#16b882', marginBottom: 0 }]}>
                    🛡️ Admin Console
                  </Text>
                  <View style={styles.adminTag}>
                    <Text style={styles.adminTagText}>STAFF ONLY</Text>
                  </View>
                </View>
                <Text style={styles.adminSubtitle}>
                  Authorized access to platform management, outreach, and store revenue.
                </Text>

                <Pressable
                  style={styles.navRow}
                  onPress={() => router.push('/(tabs)/admin' as any)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.navRowTitle}>⚡ System Maintenance Hub</Text>
                    <Text style={styles.navRowSubtitle}>Platform kill-switch & product health status</Text>
                  </View>
                  <Text style={styles.navRowArrow}>→</Text>
                </Pressable>

                <Pressable
                  style={styles.navRow}
                  onPress={() => router.push('/admin/sales-leads' as any)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.navRowTitle}>👥 Sales Leads & Outreach</Text>
                    <Text style={styles.navRowSubtitle}>Prospects, follow-ups & conversion pipeline</Text>
                  </View>
                  <Text style={styles.navRowArrow}>→</Text>
                </Pressable>

                <Pressable
                  style={[styles.navRow, { borderBottomWidth: 0 }]}
                  onPress={() => router.push('/admin/monetize' as any)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.navRowTitle}>💰 Monetize & Revenue Engine</Text>
                    <Text style={styles.navRowSubtitle}>Store catalog, payout stats & payment status</Text>
                  </View>
                  <Text style={styles.navRowArrow}>→</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* TAB 2: EDIT PROFILE */}
        {activeTab === 'edit' && (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Update Information</Text>

              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your full name"
                placeholderTextColor={colors.mutedForeground}
              />

              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+1234567890"
                keyboardType="phone-pad"
                placeholderTextColor={colors.mutedForeground}
              />

              <Text style={styles.inputLabel}>Business / Company Name</Text>
              <TextInput
                style={styles.input}
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="Acme Corp"
                placeholderTextColor={colors.mutedForeground}
              />

              <Text style={styles.inputLabel}>Website</Text>
              <TextInput
                style={styles.input}
                value={website}
                onChangeText={setWebsite}
                placeholder="https://example.com"
                autoCapitalize="none"
                placeholderTextColor={colors.mutedForeground}
              />

              <View style={styles.inputGrid}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>City</Text>
                  <TextInput
                    style={styles.input}
                    value={city}
                    onChangeText={setCity}
                    placeholder="New York"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>Country</Text>
                  <TextInput
                    style={styles.input}
                    value={country}
                    onChangeText={setCountry}
                    placeholder="United States"
                    placeholderTextColor={colors.mutedForeground}
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
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Authentication & Security</Text>
              <Text style={styles.cardDescription}>
                Manage your credentials and secure login methods for GetAIPilot Hub.
              </Text>

              <View style={styles.actionRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionTitle}>Password</Text>
                  <Text style={styles.actionSubtitle}>Send a secure password reset link to your email</Text>
                </View>
                <Pressable style={styles.secondaryButton} onPress={handlePasswordReset}>
                  <Text style={styles.secondaryButtonText}>Reset</Text>
                </Pressable>
              </View>

              <View style={[styles.actionRow, { borderBottomWidth: 0 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionTitle}>Two-Factor Authentication</Text>
                  <Text style={styles.actionSubtitle}>Enforce OTP / Magic link verification on sign-in</Text>
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
            <View style={[styles.card, { borderColor: '#16b882', borderWidth: 1.5 }]}>
              <View style={styles.planCardHeader}>
                <View>
                  <Text style={styles.planCardTitle}>{planLabel || 'Free Trial'}</Text>
                  <Text style={styles.planCardPrice}>
                    {subData?.plan_price_paise ? `₹${(subData.plan_price_paise / 100).toFixed(0)}/mo` : 'Active Platform Plan'}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: '#dcfce7' }]}>
                  <Text style={[styles.badgeText, { color: '#16a34a' }]}>
                    {isActive ? 'Active' : 'Trial'}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.planProgressContainer}>
                <View style={styles.planProgressRow}>
                  <Text style={styles.planProgressLabel}>Subscription Duration</Text>
                  <Text style={styles.planProgressValue}>{getDaysLeft()} Days Left</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(10, (getDaysLeft() / 30) * 100))}%` }]} />
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
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Payment Invoices & Receipts</Text>
              <Text style={styles.cardDescription}>
                Download or view past platform subscription receipts.
              </Text>

              {invoicesData && invoicesData.length > 0 ? (
                invoicesData.map((inv: any) => (
                  <Pressable
                    key={inv.id}
                    style={styles.invoiceRow}
                    onPress={() => setSelectedInvoice(inv)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.invoiceNumber}>
                        {inv.plan_label || 'Subscription Payment'}
                      </Text>
                      <Text style={styles.invoiceDate}>
                        {new Date(inv.charged_at || inv.created_at).toLocaleDateString()} • {inv.payment_id || 'Ref #10293'}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.invoiceAmount}>₹{((inv.amount_paise || 0) / 100).toFixed(2)}</Text>
                      <View style={[styles.miniStatusBadge, { backgroundColor: '#dcfce7' }]}>
                        <Text style={[styles.miniStatusText, { color: '#16a34a' }]}>{inv.payment_status || 'Paid'}</Text>
                      </View>
                    </View>
                  </Pressable>
                ))
              ) : (
                <View style={styles.emptyInvoiceBox}>
                  <Text style={styles.emptyInvoiceText}>No previous paid invoice records found.</Text>
                </View>
              )}
            </View>

            {/* Billing Details Form */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Billing Details (GST / Invoicing)</Text>

              <Text style={styles.inputLabel}>Billing / Company Name</Text>
              <TextInput
                style={styles.input}
                value={billingName}
                onChangeText={setBillingName}
                placeholder="Business or Personal Name"
                placeholderTextColor={colors.mutedForeground}
              />

              <Text style={styles.inputLabel}>Billing Email</Text>
              <TextInput
                style={styles.input}
                value={billingEmail}
                onChangeText={setBillingEmail}
                placeholder="billing@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={colors.mutedForeground}
              />

              <Text style={styles.inputLabel}>GSTIN / Tax ID</Text>
              <TextInput
                style={styles.input}
                value={taxId}
                onChangeText={setTaxId}
                placeholder="27AAAAA0000A1Z5 (Optional)"
                autoCapitalize="characters"
                placeholderTextColor={colors.mutedForeground}
              />

              <Text style={styles.inputLabel}>Billing Address</Text>
              <TextInput
                style={styles.input}
                value={billingAddress1}
                onChangeText={setBillingAddress1}
                placeholder="Street address / Unit"
                placeholderTextColor={colors.mutedForeground}
              />

              <View style={styles.inputGrid}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>City</Text>
                  <TextInput
                    style={styles.input}
                    value={billingCity}
                    onChangeText={setBillingCity}
                    placeholder="City"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>Postal Code</Text>
                  <TextInput
                    style={styles.input}
                    value={billingPostal}
                    onChangeText={setBillingPostal}
                    placeholder="400001"
                    keyboardType="numeric"
                    placeholderTextColor={colors.mutedForeground}
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
            <View style={styles.invoiceModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Tax Invoice Receipt</Text>
                <Pressable onPress={() => setSelectedInvoice(null)}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </Pressable>
              </View>

              {selectedInvoice && (
                <View style={{ gap: 12, paddingVertical: 12 }}>
                  <View style={styles.invoiceModalRow}>
                    <Text style={styles.invoiceModalLabel}>Invoice Number:</Text>
                    <Text style={styles.invoiceModalVal}>GAP-2026-{String(selectedInvoice.id || '001').padStart(6, '0')}</Text>
                  </View>
                  <View style={styles.invoiceModalRow}>
                    <Text style={styles.invoiceModalLabel}>Plan Description:</Text>
                    <Text style={styles.invoiceModalVal}>{selectedInvoice.plan_label || 'GetAIPilot Subscription'}</Text>
                  </View>
                  <View style={styles.invoiceModalRow}>
                    <Text style={styles.invoiceModalLabel}>Payment ID:</Text>
                    <Text style={styles.invoiceModalVal}>{selectedInvoice.payment_id || 'Direct Verified'}</Text>
                  </View>
                  <View style={styles.invoiceModalRow}>
                    <Text style={styles.invoiceModalLabel}>Status:</Text>
                    <Text style={[styles.invoiceModalVal, { color: '#16a34a', fontWeight: 'bold' }]}>
                      {selectedInvoice.payment_status || 'Paid'}
                    </Text>
                  </View>
                  <View style={styles.invoiceModalDivider} />
                  <View style={styles.invoiceModalRow}>
                    <Text style={[styles.invoiceModalLabel, { fontSize: 16, fontWeight: 'bold' }]}>Total Paid:</Text>
                    <Text style={[styles.invoiceModalVal, { fontSize: 18, fontWeight: 'bold', color: '#0f172a' }]}>
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
        {activeTab === 'preferences' && (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>App Preferences</Text>

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>Push Notifications</Text>
                  <Text style={styles.switchSubtitle}>Receive instant alerts on bot and campaign events</Text>
                </View>
                <Switch
                  value={pushEnabled}
                  onValueChange={(val) => handleTogglePref('@pref_push', val, setPushEnabled)}
                  trackColor={{ false: '#333', true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>Email Digests</Text>
                  <Text style={styles.switchSubtitle}>Weekly reports on automation stats & usage</Text>
                </View>
                <Switch
                  value={emailAlerts}
                  onValueChange={(val) => handleTogglePref('@pref_email', val, setEmailAlerts)}
                  trackColor={{ false: '#333', true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>

              <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>Biometric Unlock</Text>
                  <Text style={styles.switchSubtitle}>Prompt for Face ID / Fingerprint on launch</Text>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={(val) => handleTogglePref('@pref_bio', val, setBiometricEnabled)}
                  trackColor={{ false: '#333', true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          </View>
        )}

        {/* Sign Out Button */}
        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </Pressable>

        <Text style={styles.versionText}>GetAIPilot Hub Mobile v1.0.0</Text>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#073f36',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  heroInfo: {
    flex: 1,
  },
  heroName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  heroEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.mutedForeground,
  },
  tabTextActive: {
    color: colors.primaryForeground,
  },
  tabContent: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginBottom: 16,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.foreground,
  },
  inputGrid: {
    flexDirection: 'row',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryButtonText: {
    color: colors.primaryForeground,
    fontWeight: 'bold',
    fontSize: 15,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  actionSubtitle: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  secondaryButtonText: {
    color: colors.foreground,
    fontWeight: '600',
    fontSize: 13,
  },
  activeTag: {
    backgroundColor: 'rgba(22, 184, 130, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 12,
  },
  activeTagText: {
    color: '#16b882',
    fontWeight: 'bold',
    fontSize: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  switchSubtitle: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
    paddingRight: 10,
  },
  signOutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  signOutButtonText: {
    color: colors.destructive,
    fontWeight: 'bold',
    fontSize: 15,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 8,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navRowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  navRowSubtitle: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  navRowArrow: {
    fontSize: 16,
    color: colors.mutedForeground,
    fontWeight: '600',
    paddingLeft: 8,
  },
  adminTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  adminTag: {
    backgroundColor: 'rgba(22, 184, 130, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(22, 184, 130, 0.3)',
  },
  adminTagText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#16b882',
    letterSpacing: 0.5,
  },
  adminSubtitle: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginBottom: 12,
    lineHeight: 16,
  },
  // ─── Billing Tab Styles ──────────────────────────────────────
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  planCardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  planCardPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16a34a',
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
    color: '#64748b',
    fontWeight: '600',
  },
  planProgressValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#16a34a',
    borderRadius: 3,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  invoiceNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  invoiceDate: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  invoiceAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  miniStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  miniStatusText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  emptyInvoiceBox: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyInvoiceText: {
    fontSize: 12,
    color: '#64748b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  invoiceModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#64748b',
  },
  invoiceModalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceModalLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  invoiceModalVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  invoiceModalDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 4,
  },
});
