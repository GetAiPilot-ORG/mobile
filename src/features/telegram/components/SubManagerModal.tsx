import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
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
  initialMode?: 'dashboard' | 'create';
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

export const SubManagerModal: React.FC<SubManagerModalProps> = ({
  visible,
  onClose,
  initialMode = 'dashboard',
}) => {
  // 2 View Modes only: 'dashboard' & 'create'
  const [viewMode, setViewMode] = useState<'dashboard' | 'create'>(initialMode);

  // Live Data State
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState<LandingPageItem[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals inside
  const [qrModalUrl, setQrModalUrl] = useState<string | null>(null);
  const [plansInspectorPage, setPlansInspectorPage] = useState<LandingPageItem | null>(null);

  // Create Page Form State
  const [formCommunityId, setFormCommunityId] = useState<string>('');
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLogoUrl, setFormLogoUrl] = useState('');
  const [formButtonText, setFormButtonText] = useState('Join Channel');
  const [formTheme, setFormTheme] = useState('Light');
  const [formMetaPixel, setFormMetaPixel] = useState('');

  // Create Page Plans Builder
  const [planDraftName, setPlanDraftName] = useState('');
  const [planDraftPrice, setPlanDraftPrice] = useState('999');
  const [planDraftDurationDays, setPlanDraftDurationDays] = useState(30);
  const [planDraftDurationLabel, setPlanDraftDurationLabel] = useState('1 Month');
  const [createdPlansList, setCreatedPlansList] = useState<NewPlanDraft[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Dashboard data
  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await telegramApi.getSubManagerDashboard();
      if (res) {
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
        setViewMode('dashboard');
        fetchDashboard();
      }
    } catch (err: any) {
      Alert.alert('Error Creating Page', err.message || 'Could not create landing page.');
    } finally {
      setIsSubmitting(false);
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
              fetchDashboard();
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
  const filteredPages = pages.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.communityName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-[#0B0D10]">
        {/* Top Header */}
        <View className="flex-row justify-between items-center px-4 pt-4 pb-3 border-b border-[#262930] bg-[#181A1F]">
          <View className="flex-row items-center gap-2.5 flex-1">
            <LinearGradient colors={['#2563EB', '#0084FF']} className="w-9 h-9 rounded-xl justify-center items-center">
              <Ionicons name="card" size={18} color="#FFFFFF" />
            </LinearGradient>
            <View className="flex-1">
              <Text className="text-base font-extrabold text-white">
                {viewMode === 'dashboard' ? 'Sub Manager' : 'Create Landing Page'}
              </Text>
              <Text className="text-xs text-slate-400 mt-0.5" numberOfLines={1}>
                {viewMode === 'dashboard'
                  ? 'VIP Membership & Monetization Hub'
                  : 'Configure page details & subscription plans'}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            {viewMode === 'dashboard' ? (
              <Pressable
                className="bg-[#0084FF] flex-row items-center gap-1 px-3 py-1.5 rounded-lg active:opacity-90"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setViewMode('create');
                }}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text className="text-white text-xs font-bold">New Page</Text>
              </Pressable>
            ) : (
              <Pressable
                className="px-3 py-1.5 rounded-lg border border-[#262930] bg-[#111317] active:opacity-80"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setViewMode('dashboard');
                }}
              >
                <Text className="text-xs font-semibold text-white">
                  Cancel
                </Text>
              </Pressable>
            )}

            <Pressable
              className="w-8 h-8 rounded-full bg-[#111317] justify-center items-center active:opacity-70"
              onPress={onClose}
            >
              <Ionicons name="close" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {/* ── 1. SINGLE DASHBOARD VIEW ─────────────────────────────────────── */}
        {viewMode === 'dashboard' ? (
          <ScrollView
            className="flex-1"
            contentContainerClassName="p-4 pb-10"
            showsVerticalScrollIndicator={false}
          >
            {/* Top Compact Summary Bar */}
            <View className="flex-row items-center justify-around py-3 rounded-2xl border border-[#262930] bg-[#181A1F] mb-3">
              <View className="items-center">
                <Text className="text-[9px] font-extrabold text-slate-400 tracking-wider mb-0.5">HOSTED PAGES</Text>
                <Text className="text-base font-extrabold text-white">
                  {pages.length}
                </Text>
              </View>
              <View className="w-[1px] h-6 bg-[#262930]" />
              <View className="items-center">
                <Text className="text-[9px] font-extrabold text-slate-400 tracking-wider mb-0.5">ACTIVE SUBSCRIBERS</Text>
                <Text className="text-base font-extrabold text-white">
                  0
                </Text>
              </View>
              <View className="w-[1px] h-6 bg-[#262930]" />
              <View className="items-center">
                <Text className="text-[9px] font-extrabold text-slate-400 tracking-wider mb-0.5">AUTOMATION</Text>
                <Text className="text-base font-extrabold text-emerald-400">100%</Text>
              </View>
            </View>

            {/* Search Row */}
            <View className="mb-3">
              <View className="flex-row items-center gap-2 px-3 py-2.5 rounded-xl border border-[#262930] bg-[#181A1F]">
                <Ionicons name="search" size={16} color="#94A3B8" />
                <TextInput
                  className="flex-1 text-xs text-white p-0"
                  placeholder="Search pages by name or slug..."
                  placeholderTextColor="#64748B"
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
              <View className="py-10 items-center justify-center gap-2">
                <ActivityIndicator size="large" color="#0084FF" />
                <Text className="text-xs text-slate-400">
                  Loading your landing pages...
                </Text>
              </View>
            ) : filteredPages.length === 0 ? (
              <View className="p-7 items-center justify-center rounded-2xl border border-[#262930] bg-[#181A1F]">
                <Ionicons name="document-text-outline" size={40} color="#94A3B8" />
                <Text className="text-base font-bold text-white mt-2">
                  No Pages Found
                </Text>
                <Text className="text-xs text-slate-400 text-center mt-1 mb-3.5 leading-4">
                  Create your first subscription page to start monetizing your Telegram channels.
                </Text>
                <Pressable
                  className="bg-[#0084FF] flex-row items-center gap-1.5 px-3.5 py-2 rounded-xl active:opacity-90"
                  onPress={() => setViewMode('create')}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text className="text-white text-xs font-bold">Create Landing Page</Text>
                </Pressable>
              </View>
            ) : (
              <View className="gap-3">
                {filteredPages.map((page) => (
                  <View
                    key={page.id}
                    className="rounded-2xl border border-[#262930] bg-[#181A1F] p-3.5 gap-2.5"
                  >
                    {/* Card Header: Avatar + Title + Active Toggle */}
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center gap-2.5 flex-1">
                        <LinearGradient
                          colors={['#3B82F6', '#1D4ED8']}
                          className="w-9 h-9 rounded-xl justify-center items-center"
                        >
                          <Text className="text-white text-sm font-extrabold">
                            {page.title.slice(0, 2).toUpperCase()}
                          </Text>
                        </LinearGradient>
                        <View className="flex-1">
                          <Text
                            className="text-sm font-bold text-white"
                            numberOfLines={1}
                          >
                            {page.title}
                          </Text>
                          <Text className="text-[11px] text-slate-400 mt-0.5" numberOfLines={1}>
                            {page.communityName}
                          </Text>
                        </View>
                      </View>

                      <Switch
                        value={page.isActive}
                        onValueChange={() => handleTogglePage(page)}
                        trackColor={{ false: '#262930', true: '#10B981' }}
                        thumbColor="#FFFFFF"
                      />
                    </View>

                    {/* Link Pill with Copy, QR, and Browser actions */}
                    <View className="flex-row justify-between items-center px-2.5 py-2 rounded-xl border border-[#262930] bg-[#111317]">
                      <Text
                        className="text-xs font-mono text-slate-300 flex-1 mr-2"
                        numberOfLines={1}
                      >
                        getaipilot.in/p/{page.slug}
                      </Text>

                      <View className="flex-row items-center gap-2">
                        <Pressable
                          className="p-1 active:opacity-70"
                          onPress={() => handleCopyLink(page.url)}
                        >
                          <Ionicons name="copy-outline" size={15} color="#0084FF" />
                        </Pressable>

                        <Pressable
                          className="p-1 active:opacity-70"
                          onPress={() => setQrModalUrl(page.url)}
                        >
                          <Ionicons name="qr-code-outline" size={15} color="#94A3B8" />
                        </Pressable>

                        <Pressable
                          className="p-1 active:opacity-70"
                          onPress={() => handleOpenUrl(page.url)}
                        >
                          <Ionicons name="open-outline" size={15} color="#94A3B8" />
                        </Pressable>
                      </View>
                    </View>

                    {/* Plans Badges */}
                    {page.plans && page.plans.length > 0 && (
                      <View className="flex-row flex-wrap gap-1.5">
                        {page.plans.map((p) => (
                          <View key={p.id} className="bg-[#0084FF]/10 px-2 py-0.5 rounded-md border border-[#0084FF]/20">
                            <Text className="text-[10px] font-bold text-[#0084FF]">
                              {p.name}: ₹{p.price} ({p.durationUnit})
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Bottom Action Buttons */}
                    <View className="flex-row items-center justify-between border-t border-[#262930] pt-2.5 mt-0.5">
                      <Pressable
                        className="flex-row items-center gap-1 bg-[#0084FF]/10 px-2.5 py-1.5 rounded-lg border border-[#0084FF]/20 active:opacity-80"
                        onPress={() => setPlansInspectorPage(page)}
                      >
                        <Ionicons name="layers-outline" size={14} color="#0084FF" />
                        <Text className="text-xs font-bold text-[#0084FF]">
                          Plans ({page.plans.length})
                        </Text>
                      </Pressable>

                      <Pressable
                        className="flex-row items-center gap-1 px-2 py-1.5 active:opacity-80"
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          Alert.alert('Subscribers', `0 members currently subscribed to ${page.title}.`);
                        }}
                      >
                        <Ionicons name="people-outline" size={14} color="#94A3B8" />
                        <Text className="text-xs text-slate-400 font-semibold">Subscribers</Text>
                      </Pressable>

                      <Pressable
                        className="p-1.5 active:opacity-70"
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
          /* ── 2. SINGLE CREATE LANDING PAGE VIEW ─────────────────────────── */
          <ScrollView
            className="flex-1"
            contentContainerClassName="p-4 pb-10"
            showsVerticalScrollIndicator={false}
          >
            <View className="gap-3.5">
              {/* Page Details Card */}
              <View className="rounded-2xl p-4 border border-[#262930] bg-[#181A1F] gap-3">
                <Text className="text-base font-extrabold text-white">
                  Page Details
                </Text>

                <View className="gap-1">
                  <Text className="text-[11px] font-bold text-slate-400">Community Channel *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-1.5 my-1">
                      {communities.map((comm) => {
                        const isSel = String(formCommunityId) === String(comm.id);
                        return (
                          <Pressable
                            key={`form_comm_${comm.id}`}
                            className={`flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-xl border ${
                              isSel
                                ? 'bg-[#0084FF] border-[#0084FF]'
                                : 'bg-[#111317] border-[#262930]'
                            }`}
                            onPress={() => setFormCommunityId(String(comm.id))}
                          >
                            <Ionicons
                              name={isSel ? 'radio-button-on' : 'radio-button-off'}
                              size={13}
                              color={isSel ? '#FFFFFF' : '#0084FF'}
                            />
                            <Text
                              className={`text-xs ${
                                isSel ? 'text-white font-bold' : 'text-slate-300'
                              }`}
                            >
                              {comm.title || comm.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>

                <View className="gap-1">
                  <Text className="text-[11px] font-bold text-slate-400">Title *</Text>
                  <TextInput
                    className="rounded-xl px-3 py-2 text-xs border border-[#262930] bg-[#111317] text-white"
                    placeholder="e.g. VIP Forex & Crypto Signals"
                    placeholderTextColor="#64748B"
                    value={formTitle}
                    onChangeText={handleTitleChange}
                  />
                </View>

                <View className="gap-1">
                  <Text className="text-[11px] font-bold text-slate-400">Slug (/p/...)*</Text>
                  <TextInput
                    className="rounded-xl px-3 py-2 text-xs border border-[#262930] bg-[#111317] text-white"
                    placeholder="vip-signals"
                    placeholderTextColor="#64748B"
                    value={formSlug}
                    onChangeText={setFormSlug}
                    autoCapitalize="none"
                  />
                </View>

                <View className="gap-1">
                  <Text className="text-[11px] font-bold text-slate-400">Description</Text>
                  <TextInput
                    className="rounded-xl px-3 py-2 text-xs border border-[#262930] bg-[#111317] text-white h-20"
                    style={{ textAlignVertical: 'top' }}
                    placeholder="Tell members what benefits they receive upon joining..."
                    placeholderTextColor="#64748B"
                    value={formDescription}
                    onChangeText={setFormDescription}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>

              {/* Plans Builder Card */}
              <View className="rounded-2xl p-4 border border-[#262930] bg-[#181A1F] gap-3">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-base font-extrabold text-white">
                    Subscription Pricing Plans
                  </Text>
                  <View className="bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    <Text className="text-emerald-400 text-[10px] font-bold">{createdPlansList.length} Added</Text>
                  </View>
                </View>

                {/* Add Plan Box */}
                <View className="border border-dashed border-[#262930] rounded-xl p-3 bg-[#111317]">
                  <TextInput
                    className="rounded-xl px-3 py-2 text-xs border border-[#262930] bg-[#181A1F] text-white mb-2"
                    placeholder="Plan Name (e.g. VIP Monthly)"
                    placeholderTextColor="#64748B"
                    value={planDraftName}
                    onChangeText={setPlanDraftName}
                  />

                  <View className="flex-row gap-2 mb-2">
                    <TextInput
                      className="rounded-xl px-3 py-2 text-xs border border-[#262930] bg-[#181A1F] text-white flex-1"
                      placeholder="₹ 999"
                      placeholderTextColor="#64748B"
                      keyboardType="numeric"
                      value={planDraftPrice}
                      onChangeText={setPlanDraftPrice}
                    />

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
                      <View className="flex-row gap-1">
                        {[
                          { label: '1 Month', days: 30 },
                          { label: '3 Months', days: 90 },
                          { label: '1 Year', days: 365 },
                        ].map((dur) => {
                          const isSel = planDraftDurationDays === dur.days;
                          return (
                            <Pressable
                              key={dur.label}
                              className={`px-2 py-1.5 rounded-lg border ${
                                isSel
                                  ? 'bg-[#0084FF] border-[#0084FF]'
                                  : 'bg-[#181A1F] border-[#262930]'
                              }`}
                              onPress={() => {
                                setPlanDraftDurationDays(dur.days);
                                setPlanDraftDurationLabel(dur.label);
                              }}
                            >
                              <Text
                                className={`text-[10px] ${
                                  isSel ? 'text-white font-bold' : 'text-slate-300'
                                }`}
                              >
                                {dur.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>

                  <Pressable className="bg-[#0084FF] flex-row items-center justify-center gap-1.5 py-2 rounded-lg active:opacity-90" onPress={handleAddPlanDraft}>
                    <Ionicons name="add" size={15} color="#FFFFFF" />
                    <Text className="text-white text-xs font-bold">Add Pricing Tier</Text>
                  </Pressable>
                </View>

                {/* Added Plans List */}
                {createdPlansList.map((plan, idx) => (
                  <View
                    key={`plan_${idx}`}
                    className="flex-row justify-between items-center py-2 border-b border-[#262930]"
                  >
                    <View>
                      <Text className="text-xs font-bold text-white">
                        {plan.name}
                      </Text>
                      <Text className="text-[10px] text-slate-400">{plan.durationLabel}</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-xs font-extrabold text-emerald-400">₹{plan.price}</Text>
                      <Pressable onPress={() => setCreatedPlansList(createdPlansList.filter((_, i) => i !== idx))}>
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>

              {/* Submit Button */}
              <Pressable
                className={`bg-[#0084FF] flex-row items-center justify-center gap-2 py-3.5 rounded-xl active:opacity-90 ${
                  isSubmitting ? 'opacity-60' : ''
                }`}
                onPress={handleCreatePageSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                    <Text className="text-white text-sm font-bold">Publish Landing Page</Text>
                  </>
                )}
              </Pressable>
            </View>
          </ScrollView>
        )}

        {/* Modal: QR Code */}
        {qrModalUrl && (
          <Modal transparent animationType="fade" visible={!!qrModalUrl} onRequestClose={() => setQrModalUrl(null)}>
            <View className="flex-1 bg-black/70 justify-center items-center p-5">
              <View className="w-full max-w-sm rounded-2xl p-5 border border-[#262930] bg-[#181A1F]">
                <Text className="text-base font-extrabold text-white">
                  Scan to Open Checkout
                </Text>
                <Text className="text-slate-400 text-xs mt-0.5 mb-3.5">{qrModalUrl}</Text>
                <View className="items-center justify-center bg-white p-4 rounded-xl">
                  <QRCode value={qrModalUrl} size={180} />
                </View>
                <View className="flex-row gap-2.5 mt-3.5">
                  <Pressable className="flex-1 bg-[#0084FF] flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl active:opacity-90" onPress={() => handleCopyLink(qrModalUrl)}>
                    <Ionicons name="copy-outline" size={15} color="#FFFFFF" />
                    <Text className="text-white text-xs font-bold">Copy Link</Text>
                  </Pressable>
                  <Pressable className="px-4 justify-center items-center active:opacity-70" onPress={() => setQrModalUrl(null)}>
                    <Text className="text-xs font-semibold text-white">Close</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* Modal: Plans Inspector */}
        {plansInspectorPage && (
          <Modal transparent animationType="slide" visible={!!plansInspectorPage} onRequestClose={() => setPlansInspectorPage(null)}>
            <View className="flex-1 bg-black/70 justify-center items-center p-5">
              <View className="w-full max-w-sm rounded-2xl p-5 border border-[#262930] bg-[#181A1F]">
                <View className="flex-row justify-between items-center">
                  <Text className="text-base font-extrabold text-white">
                    {plansInspectorPage.title}
                  </Text>
                  <Pressable onPress={() => setPlansInspectorPage(null)}>
                    <Ionicons name="close" size={20} color="#FFFFFF" />
                  </Pressable>
                </View>

                <ScrollView className="max-h-64 my-2.5">
                  {plansInspectorPage.plans.map((p) => (
                    <View key={p.id} className="flex-row justify-between items-center py-2 border-b border-[#262930]">
                      <View>
                        <Text className="text-xs font-bold text-white">{p.name}</Text>
                        <Text className="text-[10px] text-slate-400">{p.durationUnit}</Text>
                      </View>
                      <Text className="text-xs font-extrabold text-emerald-400">₹{p.price}</Text>
                    </View>
                  ))}
                </ScrollView>

                <Pressable className="bg-[#0084FF] flex-row items-center justify-center py-3 rounded-xl active:opacity-90" onPress={() => setPlansInspectorPage(null)}>
                  <Text className="text-white text-xs font-bold">Close</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
};

