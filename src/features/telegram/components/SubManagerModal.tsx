import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import QRCode from 'react-native-qrcode-svg';

import { telegramApi } from '../api/telegramApi';
import { TelegramChat } from '../types';

interface SubManagerModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => Promise<void>;
  isLoading?: boolean;
  chats?: TelegramChat[];
  initialMode?: 'admin' | 'create';
}

interface LandingPageItem {
  id: string;
  title: string;
  slug: string;
  url: string;
  communityId?: number | string | null;
  communityName: string;
  description?: string;
  logoUrl?: string | null;
  buttonText?: string;
  theme?: string;
  metaPixelId?: string;
  isActive: boolean;
  memberCount: number;
  plansCount: number;
  plans: Array<{
    id: string;
    name: string;
    price: number;
    currency: string;
    durationDays: number;
    durationUnit: string;
  }>;
  createdAt?: string;
}

interface NewPlanDraft {
  name: string;
  price: string;
  durationDays: number;
  durationLabel: string;
}

type SubTab = 'pages' | 'revenue' | 'setup';

export const SubManagerModal: React.FC<SubManagerModalProps> = ({
  visible,
  onClose,
  chats = [],
  initialMode = 'admin',
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // View state
  const [viewMode, setViewMode] = useState<'admin' | 'create'>(initialMode);
  const [activeTab, setActiveTab] = useState<SubTab>('pages');
  const [isReadinessExpanded, setIsReadinessExpanded] = useState(true);

  // Live Data State
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [pages, setPages] = useState<LandingPageItem[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals inside
  const [qrModalUrl, setQrModalUrl] = useState<string | null>(null);
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [plansInspectorPage, setPlansInspectorPage] = useState<LandingPageItem | null>(null);

  // Telegram Linking State
  const [linkPhone, setLinkPhone] = useState('');
  const [linkOtp, setLinkOtp] = useState('');
  const [linkCodeHash, setLinkCodeHash] = useState('');
  const [linkOtpSent, setLinkOtpSent] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [linkPassword, setLinkPassword] = useState('');
  const [isTelegramConnected, setIsTelegramConnected] = useState(false);

  // Create Page Form State
  const [formCommunityId, setFormCommunityId] = useState<string>('');
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLogoUrl, setFormLogoUrl] = useState('');
  const [formButtonText, setFormButtonText] = useState('Join Channel');
  const [formTheme, setFormTheme] = useState('Light');
  const [formMetaPixel, setFormMetaPixel] = useState('');

  // Create Page Plans
  const [planDraftName, setPlanDraftName] = useState('');
  const [planDraftPrice, setPlanDraftPrice] = useState('999');
  const [planDraftDurationDays, setPlanDraftDurationDays] = useState(30);
  const [planDraftDurationLabel, setPlanDraftDurationLabel] = useState('1 Month');
  const [createdPlansList, setCreatedPlansList] = useState<NewPlanDraft[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Dashboard
  const fetchDashboard = async (isPullRefresh = false) => {
    if (isPullRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await telegramApi.getSubManagerDashboard();
      if (res) {
        setDashboardData(res);
        if (Array.isArray(res.pages)) {
          setPages(res.pages);
        }
        if (Array.isArray(res.communities)) {
          setCommunities(res.communities);
          if (res.communities.length > 0 && !formCommunityId) {
            setFormCommunityId(String(res.communities[0].id));
          }
        }
      }
    } catch (err) {
      console.warn('[SUB MANAGER FETCH ERROR]', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (visible) {
      setViewMode(initialMode);
      fetchDashboard();
    }
  }, [visible, initialMode]);

  // Form Handlers
  const handleTitleChange = (text: string) => {
    setFormTitle(text);
    if (!formSlug || formSlug === formTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')) {
      const generated = text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      setFormSlug(generated);
    }
  };

  const handleAddPlanDraft = () => {
    if (!planDraftName.trim()) {
      Alert.alert('Required', 'Please enter a plan name (e.g. VIP Monthly)');
      return;
    }
    const priceNum = parseFloat(planDraftPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price amount.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCreatedPlansList([
      ...createdPlansList,
      {
        name: planDraftName.trim(),
        price: planDraftPrice.trim(),
        durationDays: planDraftDurationDays,
        durationLabel: planDraftDurationLabel,
      },
    ]);

    setPlanDraftName('');
    setPlanDraftPrice('999');
  };

  const handleCreatePageSubmit = async () => {
    if (!formTitle.trim()) {
      Alert.alert('Required Field', 'Please provide a title for your landing page.');
      return;
    }
    if (!formSlug.trim()) {
      Alert.alert('Required Field', 'Please provide a unique slug for the URL.');
      return;
    }

    try {
      setIsSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const payload = {
        communityId: formCommunityId || undefined,
        title: formTitle.trim(),
        slug: formSlug.trim(),
        description: formDescription.trim(),
        logoUrl: formLogoUrl.trim() || undefined,
        buttonText: formButtonText.trim() || 'Join Channel',
        theme: formTheme.toLowerCase(),
        metaPixelId: formMetaPixel.trim() || undefined,
        plans: createdPlansList.map((p) => ({
          name: p.name,
          price: parseFloat(p.price) || 0,
          durationDays: p.durationDays,
          currency: 'INR',
        })),
      };

      const res = await telegramApi.createSubManagerLandingPage(payload);
      if (res?.success) {
        Alert.alert('Page Created! 🎉', `Your landing page is live at https://tg.getaipilot.in/p/${res.landingPage?.slug || formSlug}`);
        setFormTitle('');
        setFormSlug('');
        setFormDescription('');
        setFormLogoUrl('');
        setCreatedPlansList([]);
        setViewMode('admin');
        setActiveTab('pages');
        fetchDashboard(true);
      }
    } catch (err: any) {
      Alert.alert('Error Creating Page', err.message || 'Could not create landing page.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Telegram Linking Handlers
  const handleSendTelegramOtp = async () => {
    const rawPhone = linkPhone.trim().replace(/\D/g, '');
    if (rawPhone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    const fullPhone = rawPhone.startsWith('91') ? `+${rawPhone}` : `+91${rawPhone}`;

    try {
      setIsLinking(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await telegramApi.startLogin(fullPhone);
      if (res?.success) {
        setLinkOtpSent(true);
        if (res.phone_code_hash) setLinkCodeHash(res.phone_code_hash);
        Alert.alert('Code Sent! 📲', `A 5-digit code was sent to your Telegram app for ${fullPhone}.`);
      } else {
        setLinkOtpSent(true);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not send verification code.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleVerifyTelegramOtp = async () => {
    if (!linkOtp.trim()) {
      Alert.alert('Required', 'Please enter the verification code.');
      return;
    }
    const rawPhone = linkPhone.trim().replace(/\D/g, '');
    const fullPhone = rawPhone.startsWith('91') ? `+${rawPhone}` : `+91${rawPhone}`;

    try {
      setIsLinking(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await telegramApi.verifyOtp({
        phone: fullPhone,
        otp: linkOtp.trim(),
        phone_code_hash: linkCodeHash || undefined,
      });

      if (res?.requires_password) {
        setRequiresPassword(true);
        Alert.alert('2FA Password', 'Please enter your Telegram Cloud 2FA Password.');
      } else if (res?.success) {
        setIsTelegramConnected(true);
        setLinkOtpSent(false);
        setLinkOtp('');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Telegram Linked! 🎉', 'Your Telegram account is now connected.');
        fetchDashboard(true);
      }
    } catch (err: any) {
      Alert.alert('Verification Failed', err.message || 'Incorrect OTP code.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleTogglePage = async (page: LandingPageItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newStatus = !page.isActive;
    setPages((prev) =>
      prev.map((p) => (p.id === page.id ? { ...p, isActive: newStatus } : p))
    );

    try {
      await telegramApi.toggleSubManagerLandingPage({ pageId: page.id, isActive: newStatus });
    } catch {
      setPages((prev) =>
        prev.map((p) => (p.id === page.id ? { ...p, isActive: page.isActive } : p))
      );
    }
  };

  const handleDeletePage = (page: LandingPageItem) => {
    Alert.alert(
      'Delete Landing Page',
      `Delete "${page.title}" and its ${page.plans.length} subscription plans?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setPages((prev) => prev.filter((p) => p.id !== page.id));
            try {
              await telegramApi.deleteSubManagerLandingPage(page.id);
            } catch {
              fetchDashboard(true);
            }
          },
        },
      ]
    );
  };

  const handleCopyLink = async (url: string) => {
    await Clipboard.setStringAsync(url);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Link Copied 📋', `${url}\n\nCopied to clipboard.`);
  };

  const handleOpenUrl = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open URL', url);
    }
  };

  // Filtered pages
  const filteredPages = pages.filter((p: any) => {
    const q = searchQuery.toLowerCase();
    return (
      (p.title || '').toLowerCase().includes(q) ||
      (p.slug || '').toLowerCase().includes(q) ||
      (p.communityName || '').toLowerCase().includes(q)
    );
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
        {/* Top Header */}
        <View style={[styles.header, isDark ? styles.borderDark : styles.borderLight]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <LinearGradient colors={['#2563EB', '#0284C7']} style={styles.headerIconCircle}>
              <Ionicons name="card" size={18} color="#FFFFFF" />
            </LinearGradient>
            <View>
              <Text style={[styles.title, isDark ? styles.textDark : styles.textLight]}>
                {viewMode === 'admin' ? 'Sub Manager' : 'Create Landing Page'}
              </Text>
              <Text style={styles.subtitle}>
                {viewMode === 'admin'
                  ? 'VIP Membership & Monetization Hub'
                  : 'Configure page details & subscription plans'}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {viewMode === 'admin' ? (
              <Pressable
                style={styles.newBtnTop}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setViewMode('create');
                }}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.newBtnText}>New Page</Text>
              </Pressable>
            ) : (
              <Pressable
                style={[styles.cancelBtnTop, isDark ? styles.cardDark : styles.cardLight]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setViewMode('admin');
                }}
              >
                <Text style={[styles.cancelBtnText, isDark ? styles.textDark : styles.textLight]}>
                  Cancel
                </Text>
              </Pressable>
            )}

            <Pressable
              style={[styles.closeBtn, isDark ? styles.closeBtnDark : styles.closeBtnLight]}
              onPress={onClose}
            >
              <Ionicons name="close" size={18} color={isDark ? '#FFFFFF' : '#0F172A'} />
            </Pressable>
          </View>
        </View>

        {viewMode === 'admin' ? (
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Top Compact Summary Bar */}
            <View style={[styles.compactStatBar, isDark ? styles.cardDark : styles.cardLight]}>
                    <View style={styles.compactStatItem}>
                      <Text style={styles.compactStatLabel}>HOSTED PAGES</Text>
                      <Text style={[styles.compactStatVal, isDark ? styles.textDark : styles.textLight]}>
                        {pages.length}
                      </Text>
                    </View>
                    <View style={styles.compactStatDivider} />
                    <View style={styles.compactStatItem}>
                      <Text style={styles.compactStatLabel}>ACTIVE SUBSCRIBERS</Text>
                      <Text style={[styles.compactStatVal, isDark ? styles.textDark : styles.textLight]}>
                        0
                      </Text>
                    </View>
                    <View style={styles.compactStatDivider} />
                    <View style={styles.compactStatItem}>
                      <Text style={styles.compactStatLabel}>AUTOMATION</Text>
                      <Text style={[styles.compactStatVal, { color: '#10B981' }]}>100%</Text>
                    </View>
                  </View>

                  {/* Search Row */}
                  <View style={styles.searchRow}>
                    <View style={[styles.searchBox, isDark ? styles.searchBoxDark : styles.searchBoxLight]}>
                      <Ionicons name="search" size={16} color="#94A3B8" />
                      <TextInput
                        style={[styles.searchInput, isDark ? styles.textDark : styles.textLight]}
                        placeholder="Search pages by name or slug..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                      />
                      {searchQuery.length > 0 && (
                        <Pressable onPress={() => setSearchQuery('')}>
                          <Ionicons name="close-circle" size={16} color="#94A3B8" />
                        </Pressable>
                      )}
                    </View>
                  </View>

                  {/* Landing Pages Cards List */}
                  {loading ? (
                    <View style={styles.centerLoading}>
                      <ActivityIndicator size="large" color="#2563EB" />
                      <Text style={[styles.loadingText, isDark ? styles.textDark : styles.textLight]}>
                        Loading your landing pages...
                      </Text>
                    </View>
                  ) : filteredPages.length === 0 ? (
                    <View style={[styles.emptyCard, isDark ? styles.cardDark : styles.cardLight]}>
                      <Ionicons name="document-text-outline" size={40} color="#94A3B8" />
                      <Text style={[styles.emptyTitle, isDark ? styles.textDark : styles.textLight]}>
                        No Pages Found
                      </Text>
                      <Text style={styles.emptySub}>
                        Create your first subscription page to start monetizing your Telegram channels.
                      </Text>
                      <Pressable
                        style={styles.createFirstBtn}
                        onPress={() => setViewMode('create')}
                      >
                        <Ionicons name="add" size={16} color="#FFFFFF" />
                        <Text style={styles.createFirstBtnText}>Create Landing Page</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.pagesGrid}>
                      {filteredPages.map((page) => (
                        <View
                          key={page.id}
                          style={[styles.pageCard, isDark ? styles.cardDark : styles.cardLight]}
                        >
                          {/* Card Header: Avatar + Title + Active Toggle */}
                          <View style={styles.pageCardTop}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                              <LinearGradient
                                colors={['#3B82F6', '#1D4ED8']}
                                style={styles.pageAvatar}
                              >
                                <Text style={styles.pageAvatarText}>
                                  {page.title.slice(0, 2).toUpperCase()}
                                </Text>
                              </LinearGradient>
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={[styles.pageTitleText, isDark ? styles.textDark : styles.textLight]}
                                  numberOfLines={1}
                                >
                                  {page.title}
                                </Text>
                                <Text style={styles.pageCommunityName} numberOfLines={1}>
                                  {page.communityName}
                                </Text>
                              </View>
                            </View>

                            <Switch
                              value={page.isActive}
                              onValueChange={() => handleTogglePage(page)}
                              trackColor={{ false: '#CBD5E1', true: '#10B981' }}
                              thumbColor="#FFFFFF"
                            />
                          </View>

                          {/* Link Pill with Copy, QR, and Browser actions */}
                          <View style={[styles.urlPill, isDark ? styles.urlPillDark : styles.urlPillLight]}>
                            <Text
                              style={[styles.urlPillText, isDark ? styles.textDark : styles.textLight]}
                              numberOfLines={1}
                            >
                              getaipilot.in/p/{page.slug}
                            </Text>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Pressable
                                style={styles.urlIconAction}
                                onPress={() => handleCopyLink(page.url)}
                              >
                                <Ionicons name="copy-outline" size={15} color="#2563EB" />
                              </Pressable>

                              <Pressable
                                style={styles.urlIconAction}
                                onPress={() => setQrModalUrl(page.url)}
                              >
                                <Ionicons name="qr-code-outline" size={15} color="#64748B" />
                              </Pressable>

                              <Pressable
                                style={styles.urlIconAction}
                                onPress={() => handleOpenUrl(page.url)}
                              >
                                <Ionicons name="open-outline" size={15} color="#64748B" />
                              </Pressable>
                            </View>
                          </View>

                          {/* Plans Badges */}
                          {page.plans && page.plans.length > 0 && (
                            <View style={styles.plansPillRow}>
                              {page.plans.map((p) => (
                                <View key={p.id} style={styles.planBadge}>
                                  <Text style={styles.planBadgeText}>
                                    {p.name}: ₹{p.price} ({p.durationUnit})
                                  </Text>
                                </View>
                              ))}
                            </View>
                          )}

                          {/* Bottom Action Buttons */}
                          <View style={[styles.pageFooterActions, isDark ? styles.borderDark : styles.borderLight]}>
                            <Pressable
                              style={styles.pageActionBtn}
                              onPress={() => setPlansInspectorPage(page)}
                            >
                              <Ionicons name="layers-outline" size={14} color="#2563EB" />
                              <Text style={styles.pageActionBtnText}>
                                Plans ({page.plans.length})
                              </Text>
                            </Pressable>

                            <Pressable
                              style={styles.pageActionBtnSec}
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                Alert.alert('Subscribers', `0 members currently subscribed to ${page.title}.`);
                              }}
                            >
                              <Ionicons name="people-outline" size={14} color="#64748B" />
                              <Text style={styles.pageActionBtnTextSec}>Subscribers</Text>
                            </Pressable>

                            <Pressable
                              style={styles.deletePageBtn}
                              onPress={() => handleDeletePage(page)}
                            >
                              <Ionicons name="trash-outline" size={16} color="#EF4444" />
                            </Pressable>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
          </ScrollView>
        ) : (
          /* View 2: Create Landing Page Form */
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ gap: 14 }}>
              {/* Page Details Card */}
              <View style={[styles.sectionCard, isDark ? styles.cardDark : styles.cardLight]}>
                <Text style={[styles.sectionCardTitle, isDark ? styles.textDark : styles.textLight]}>
                  Page Details
                </Text>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Community Channel *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 6, marginVertical: 4 }}>
                      {communities.map((comm) => {
                        const isSel = String(formCommunityId) === String(comm.id);
                        return (
                          <Pressable
                            key={`form_comm_${comm.id}`}
                            style={[
                              styles.commPill,
                              isDark ? styles.cardDark : styles.cardLight,
                              isSel && styles.commPillActive,
                            ]}
                            onPress={() => setFormCommunityId(String(comm.id))}
                          >
                            <Ionicons
                              name={isSel ? 'radio-button-on' : 'radio-button-off'}
                              size={13}
                              color={isSel ? '#FFFFFF' : '#2563EB'}
                            />
                            <Text
                              style={[
                                styles.commPillText,
                                isDark ? styles.textDark : styles.textLight,
                                isSel && { color: '#FFFFFF', fontWeight: '700' },
                              ]}
                            >
                              {comm.title || comm.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Title *</Text>
                  <TextInput
                    style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
                    placeholder="e.g. VIP Forex & Crypto Signals"
                    placeholderTextColor="#94A3B8"
                    value={formTitle}
                    onChangeText={handleTitleChange}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Slug (/p/...)*</Text>
                  <TextInput
                    style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
                    placeholder="vip-signals"
                    placeholderTextColor="#94A3B8"
                    value={formSlug}
                    onChangeText={setFormSlug}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Description</Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      styles.formTextArea,
                      isDark ? styles.formInputDark : styles.formInputLight,
                    ]}
                    placeholder="Tell members what benefits they receive upon joining..."
                    placeholderTextColor="#94A3B8"
                    value={formDescription}
                    onChangeText={setFormDescription}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>

              {/* Plans Builder Card */}
              <View style={[styles.sectionCard, isDark ? styles.cardDark : styles.cardLight]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={[styles.sectionCardTitle, isDark ? styles.textDark : styles.textLight]}>
                    Subscription Pricing Plans
                  </Text>
                  <View style={styles.readyBadge}>
                    <Text style={styles.readyBadgeText}>{createdPlansList.length} Added</Text>
                  </View>
                </View>

                {/* Add Plan Box */}
                <View style={[styles.planDraftBox, isDark ? styles.borderDark : styles.borderLight]}>
                  <TextInput
                    style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight, { marginBottom: 8 }]}
                    placeholder="Plan Name (e.g. VIP Monthly)"
                    placeholderTextColor="#94A3B8"
                    value={planDraftName}
                    onChangeText={setPlanDraftName}
                  />

                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                    <TextInput
                      style={[styles.formInput, { flex: 1 }, isDark ? styles.formInputDark : styles.formInputLight]}
                      placeholder="₹ 999"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={planDraftPrice}
                      onChangeText={setPlanDraftPrice}
                    />

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', gap: 4 }}>
                        {[
                          { label: '1 Month', days: 30 },
                          { label: '3 Months', days: 90 },
                          { label: '1 Year', days: 365 },
                        ].map((dur) => {
                          const isSel = planDraftDurationDays === dur.days;
                          return (
                            <Pressable
                              key={dur.label}
                              style={[
                                styles.durPill,
                                isDark ? styles.cardDark : styles.cardLight,
                                isSel && styles.durPillActive,
                              ]}
                              onPress={() => {
                                setPlanDraftDurationDays(dur.days);
                                setPlanDraftDurationLabel(dur.label);
                              }}
                            >
                              <Text
                                style={[
                                  styles.durPillText,
                                  isDark ? styles.textDark : styles.textLight,
                                  isSel && { color: '#FFFFFF', fontWeight: '700' },
                                ]}
                              >
                                {dur.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>

                  <Pressable style={styles.addPlanBtn} onPress={handleAddPlanDraft}>
                    <Ionicons name="add" size={15} color="#FFFFFF" />
                    <Text style={styles.addPlanBtnText}>Add Pricing Tier</Text>
                  </Pressable>
                </View>

                {/* Added Plans List */}
                {createdPlansList.map((plan, idx) => (
                  <View
                    key={`plan_${idx}`}
                    style={[styles.addedPlanRow, isDark ? styles.borderDark : styles.borderLight]}
                  >
                    <View>
                      <Text style={[styles.addedPlanName, isDark ? styles.textDark : styles.textLight]}>
                        {plan.name}
                      </Text>
                      <Text style={styles.addedPlanDur}>{plan.durationLabel}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.addedPlanPrice}>₹{plan.price}</Text>
                      <Pressable onPress={() => setCreatedPlansList(createdPlansList.filter((_, i) => i !== idx))}>
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>

              {/* Submit Button */}
              <Pressable
                style={[styles.savePageBtn, isSubmitting && { opacity: 0.6 }]}
                onPress={handleCreatePageSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.savePageBtnText}>Publish Landing Page</Text>
                  </>
                )}
              </Pressable>
            </View>
          </ScrollView>
        )}

        {/* Modal: QR Code */}
        {qrModalUrl && (
          <Modal transparent animationType="fade" visible={!!qrModalUrl} onRequestClose={() => setQrModalUrl(null)}>
            <View style={styles.modalBackdrop}>
              <View style={[styles.modalCard, isDark ? styles.cardDark : styles.cardLight]}>
                <Text style={[styles.modalTitle, isDark ? styles.textDark : styles.textLight]}>
                  Scan to Open Checkout
                </Text>
                <Text style={styles.modalSub}>{qrModalUrl}</Text>
                <View style={styles.qrBox}>
                  <QRCode value={qrModalUrl} size={180} />
                </View>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                  <Pressable style={styles.qrActionBtn} onPress={() => handleCopyLink(qrModalUrl)}>
                    <Ionicons name="copy-outline" size={15} color="#FFFFFF" />
                    <Text style={styles.qrActionBtnText}>Copy Link</Text>
                  </Pressable>
                  <Pressable style={styles.qrCloseBtn} onPress={() => setQrModalUrl(null)}>
                    <Text style={[styles.qrCloseBtnText, isDark ? styles.textDark : styles.textLight]}>Close</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* Modal: Bank KYC */}
        {bankModalVisible && (
          <Modal transparent animationType="slide" visible={bankModalVisible} onRequestClose={() => setBankModalVisible(false)}>
            <View style={styles.modalBackdrop}>
              <View style={[styles.modalCard, isDark ? styles.cardDark : styles.cardLight]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[styles.modalTitle, isDark ? styles.textDark : styles.textLight]}>
                    Bank KYC Details
                  </Text>
                  <Pressable onPress={() => setBankModalVisible(false)}>
                    <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
                  </Pressable>
                </View>

                <View style={styles.kycItem}>
                  <Text style={styles.kycLabel}>BENEFICIARY ACCOUNT</Text>
                  <Text style={[styles.kycVal, isDark ? styles.textDark : styles.textLight]}>GetAi Pilot</Text>
                </View>

                <View style={styles.kycItem}>
                  <Text style={styles.kycLabel}>STATUS</Text>
                  <View style={styles.verifiedActiveBadge}>
                    <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                    <Text style={styles.verifiedActiveText}>KYC Verified & Active</Text>
                  </View>
                </View>

                <View style={styles.kycItem}>
                  <Text style={styles.kycLabel}>SETTLEMENT SCHEDULE</Text>
                  <Text style={[styles.kycVal, isDark ? styles.textDark : styles.textLight]}>
                    7-Day Rolling Hold Cycle (Direct Bank Transfer)
                  </Text>
                </View>

                <Pressable style={styles.savePageBtn} onPress={() => setBankModalVisible(false)}>
                  <Text style={styles.savePageBtnText}>Done</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        )}

        {/* Modal: Plans Inspector */}
        {plansInspectorPage && (
          <Modal transparent animationType="slide" visible={!!plansInspectorPage} onRequestClose={() => setPlansInspectorPage(null)}>
            <View style={styles.modalBackdrop}>
              <View style={[styles.modalCard, isDark ? styles.cardDark : styles.cardLight]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[styles.modalTitle, isDark ? styles.textDark : styles.textLight]}>
                    {plansInspectorPage.title}
                  </Text>
                  <Pressable onPress={() => setPlansInspectorPage(null)}>
                    <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
                  </Pressable>
                </View>

                <ScrollView style={{ maxHeight: 260, marginVertical: 10 }}>
                  {plansInspectorPage.plans.map((p) => (
                    <View key={p.id} style={[styles.addedPlanRow, isDark ? styles.borderDark : styles.borderLight]}>
                      <View>
                        <Text style={[styles.addedPlanName, isDark ? styles.textDark : styles.textLight]}>{p.name}</Text>
                        <Text style={styles.addedPlanDur}>{p.durationUnit}</Text>
                      </View>
                      <Text style={styles.addedPlanPrice}>₹{p.price}</Text>
                    </View>
                  ))}
                </ScrollView>

                <Pressable style={styles.savePageBtn} onPress={() => setPlansInspectorPage(null)}>
                  <Text style={styles.savePageBtnText}>Close</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerLight: {
    backgroundColor: '#F8FAFC',
  },
  containerDark: {
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  borderLight: {
    borderColor: '#E2E8F0',
  },
  borderDark: {
    borderColor: '#334155',
  },
  headerIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  textLight: {
    color: '#0F172A',
  },
  textDark: {
    color: '#F8FAFC',
  },
  newBtnTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  newBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cancelBtnTop: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnLight: {
    backgroundColor: '#F1F5F9',
  },
  closeBtnDark: {
    backgroundColor: '#1E293B',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabItemActiveLight: {
    backgroundColor: '#EFF6FF',
  },
  tabItemActiveDark: {
    backgroundColor: '#1E293B',
  },
  tabText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10,
  },
  tabBadgeActive: {
    backgroundColor: '#2563EB',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
  },
  cardDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
  },
  compactStatBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  compactStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  compactStatLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  compactStatVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  compactStatDivider: {
    width: StyleSheet.hairlineWidth,
    height: 20,
    backgroundColor: '#CBD5E1',
  },
  searchRow: {
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  searchBoxLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  searchBoxDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    padding: 0,
  },
  pagesGrid: {
    gap: 10,
  },
  pageCard: {
    borderRadius: 12,
    padding: 12,
  },
  pageCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pageAvatar: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageAvatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  pageTitleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pageCommunityName: {
    fontSize: 10.5,
    color: '#64748B',
  },
  urlPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginBottom: 6,
  },
  urlPillLight: {
    backgroundColor: '#F8FAFC',
  },
  urlPillDark: {
    backgroundColor: '#0F172A',
  },
  urlPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
    flex: 1,
  },
  urlIconAction: {
    padding: 3,
  },
  plansPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  planBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563EB',
  },
  pageFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  pageActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  pageActionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
  pageActionBtnSec: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  pageActionBtnTextSec: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  deletePageBtn: {
    padding: 4,
  },
  revenueHeroCard: {
    padding: 16,
    borderRadius: 14,
  },
  revenueHeroLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.5,
  },
  revenueHeroVal: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginVertical: 4,
  },
  revenueHeroSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
  },
  revenueHeroDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 12,
  },
  revenueHeroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  revenueHeroFooterLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  revenueHeroFooterVal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 1,
  },
  sectionCard: {
    padding: 14,
    borderRadius: 12,
  },
  sectionCardTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionCardSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  verifiedActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedActiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  bankInfoBox: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
  },
  bankInfoText: {
    fontSize: 10.5,
    color: '#64748B',
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#2563EB',
    paddingVertical: 8,
    borderRadius: 8,
  },
  outlineBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#2563EB',
  },
  readyBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  readyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  stepperMiniGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  stepperMiniItem: {
    flex: 1,
    minWidth: '47%',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  stepperMiniNum: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#64748B',
  },
  stepperMiniStatus: {
    fontSize: 8.5,
    fontWeight: '700',
  },
  stepperMiniTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  countryPill: {
    paddingHorizontal: 8,
    height: 38,
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  phoneInput: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 12,
    borderWidth: 1,
  },
  sendOtpBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOtpBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '600',
  },
  otpHint: {
    fontSize: 11,
    color: '#64748B',
  },
  linkedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    marginTop: 4,
  },
  linkedText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#10B981',
  },
  channelCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  channelTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  channelId: {
    fontSize: 9.5,
    color: '#94A3B8',
  },
  formGroup: {
    marginTop: 10,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  formInput: {
    height: 38,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 12,
    borderWidth: 1,
  },
  formInputLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    color: '#0F172A',
  },
  formInputDark: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    color: '#F8FAFC',
  },
  formTextArea: {
    height: 65,
    paddingTop: 8,
    textAlignVertical: 'top',
  },
  commPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  commPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  commPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  planDraftBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  durPill: {
    paddingHorizontal: 8,
    height: 38,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  durPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  durPillText: {
    fontSize: 10.5,
  },
  addPlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingVertical: 7,
    borderRadius: 6,
  },
  addPlanBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '600',
  },
  addedPlanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 4,
  },
  addedPlanName: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  addedPlanDur: {
    fontSize: 10,
    color: '#64748B',
  },
  addedPlanPrice: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#059669',
  },
  savePageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  savePageBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  centerLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 12,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 240,
  },
  createFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    marginTop: 6,
  },
  createFirstBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalSub: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
  },
  qrBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  qrActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    borderRadius: 8,
  },
  qrActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  qrCloseBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  qrCloseBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  kycItem: {
    gap: 2,
  },
  kycLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#64748B',
  },
  kycVal: {
    fontSize: 12,
    fontWeight: '600',
  },
  readinessCard: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  readinessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readinessTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepperScrollRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  stepPillCard: {
    width: 130,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  stepNumBadge: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#64748B',
  },
  stepStatusBadge: {
    fontSize: 8.5,
    fontWeight: '700',
  },
  stepCardTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  stepCardSub: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 1,
  },
});
