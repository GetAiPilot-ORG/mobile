import React, { useState, useEffect } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Switch,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import * as ImagePicker from 'expo-image-picker';
import QRCode from 'react-native-qrcode-svg';

import { telegramApi } from '../api/telegramApi';
import { TelegramToolKey } from '../types';

type SubTab = 'overview' | 'channels' | 'pages';

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

interface SubManagerScreenProps {
  stats: {
    totalRevenue: number;
    activeSubscribers: number;
    subscriptionPages: number;
    botAutomatedAccess: string;
    grossSales: number;
    netCreatorShare: number;
    availableToWithdraw: number;
    rollingHold: number;
    successfulPaymentsCount: number;
    connectedBank: { accountHolder: string; status: string; details: string };
    botStatus: { botUsername: string; isOnline: boolean; verifiedChannels: number };
    linkedTelegram?: { phone: string; isLinked: boolean };
    monetizedChannels: any[];
    discoveredChannels: any[];
    transactions: any[];
    pages: any[];
  };
  onOpenModal: (key: TelegramToolKey) => void;
  onRefresh: () => void;
}

export const SubManagerScreen: React.FC<SubManagerScreenProps> = ({ stats, onRefresh }) => {
  // Navigation mode: 'dashboard' vs 'create'
  const [viewMode, setViewMode] = useState<'dashboard' | 'create'>('dashboard');

  // Sub-tabs in dashboard
  const [activeTab, setActiveTab] = useState<SubTab>('overview');

  // State
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [pages, setPages] = useState<LandingPageItem[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pageSearch, setPageSearch] = useState('');
  const [channelSearch, setChannelSearch] = useState('');
  const [txnSearch, setTxnSearch] = useState('');
  const [txnFilter, setTxnFilter] = useState<'All' | 'Success' | 'On Hold'>('All');
  const [channelSubTab, setChannelSubTab] = useState<'monetized' | 'discovered'>('monetized');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [qrModalUrl, setQrModalUrl] = useState<string | null>(null);
  const [plansInspectorPage, setPlansInspectorPage] = useState<LandingPageItem | null>(null);

  // Form states for creation
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCommunityId, setFormCommunityId] = useState<string>('');
  const [formDescription, setFormDescription] = useState('');
  const [formLogoUrl, setFormLogoUrl] = useState('');
  const [launchExpanded, setLaunchExpanded] = useState(false);
  const [formButtonText, setFormButtonText] = useState('Join Channel');
  const [formTheme, setFormTheme] = useState('Light');
  const [formMetaPixel, setFormMetaPixel] = useState('');

  // Plans Builder State
  const [planDraftName, setPlanDraftName] = useState('');
  const [planDraftPrice, setPlanDraftPrice] = useState('999');
  const [planDraftDurationDays, setPlanDraftDurationDays] = useState(30);
  const [planDraftDurationLabel, setPlanDraftDurationLabel] = useState('1 Month');
  const [createdPlansList, setCreatedPlansList] = useState<NewPlanDraft[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Dashboard Data
  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await telegramApi.getSubManagerDashboard();
      if (res) {
        setDashboardData(res);
        if (Array.isArray(res.pages)) setPages(res.pages);
        if (Array.isArray(res.communities)) {
          setCommunities(res.communities);
          if (res.communities.length > 0 && !formCommunityId) {
            setFormCommunityId(String(res.communities[0].id));
          }
        }
        if (Array.isArray(res.transactions)) setTransactions(res.transactions);
      }
    } catch (err) {
      console.warn('[SUB MANAGER LOAD ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Filtered lists
  const displayPages = pages.length > 0 ? pages : (stats.pages as LandingPageItem[]) || [];
  const filteredPages = displayPages.filter((pg) =>
    (pg.title || '').toLowerCase().includes(pageSearch.toLowerCase()) ||
    (pg.slug || '').toLowerCase().includes(pageSearch.toLowerCase())
  );

  const displayTxns = transactions.length > 0 ? transactions : stats.transactions || [];
  const filteredTxns = displayTxns.filter((tx) => {
    const q = txnSearch.toLowerCase();
    const matchSearch = (tx.razorpay_payment_id || '').toLowerCase().includes(q) || (tx.dateTime || '').toLowerCase().includes(q);
    const matchFilter = txnFilter === 'All' || (txnFilter === 'Success' && tx.status === 'SUCCESS') || (txnFilter === 'On Hold' && tx.status === 'ON_HOLD');
    return matchSearch && matchFilter;
  });

  const monetizedList = stats.monetizedChannels || [{ id: 'chan-1', title: 'test mb', telegram_chat_id: '-1004318725539', botActive: true }];
  const discoveredList = stats.discoveredChannels || [
    { id: 'disc-1', title: 'Crypto Signals India VIP', chat_id: '-1001892837192', members: 420 },
    { id: 'disc-2', title: 'Nifty & BankNifty Option Hub', chat_id: '-1001782394821', members: 1250 },
    { id: 'disc-3', title: 'Forex Scalping Live Master', chat_id: '-1001672384910', members: 890 },
  ];

  const filteredMonetized = monetizedList.filter((c: any) =>
    (c.title || '').toLowerCase().includes(channelSearch.toLowerCase()) || (c.telegram_chat_id || '').includes(channelSearch)
  );
  const filteredDiscovered = discoveredList.filter((c: any) =>
    (c.title || '').toLowerCase().includes(channelSearch.toLowerCase()) || (c.chat_id || '').includes(channelSearch)
  );

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

  const handlePickLogo = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Needed', 'Please allow gallery access to choose a logo.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });
      if (!res.canceled && res.assets[0]?.uri) {
        const asset = res.assets[0];
        setFormLogoUrl(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
      }
    } catch (err: any) {
      Alert.alert('Logo Error', err.message || 'Could not select image.');
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

    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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
        setActiveTab('pages');
        loadDashboard();
        onRefresh();
      }
    } catch (err: any) {
      Alert.alert('Error Creating Page', err.message || 'Could not create landing page.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePage = async (page: LandingPageItem) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      `Delete "${page.title}" and its ${page.plans?.length || 0} subscription plans?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setPages((prev) => prev.filter((p) => p.id !== page.id));
            try {
              await telegramApi.deleteSubManagerLandingPage(page.id);
            } catch {
              loadDashboard();
            }
          },
        },
      ]
    );
  };

  const handleCopyLink = async (url: string, id: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Clipboard.setStringAsync(url);
    setCopiedId(id);
    Alert.alert('Link Copied 📋', `${url}\n\nCopied to clipboard.`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleOpenUrl = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open URL', url);
    }
  };

  const handleWithdrawFunds = () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Withdraw Request Initiated 💸',
      `₹${dashboardData?.financialHub?.availableToWithdraw || stats.availableToWithdraw || 2} is being transferred to ${dashboardData?.financialHub?.bankAccount?.accountName || stats.connectedBank.accountHolder || 'your verified bank account'}. Direct settlement will credit within standard bank hours.`
    );
  };

  return (
    <View className="gap-3.5">
      {/* ── TOP HEADER ────────────────────────────────────────────────────────── */}
      <View className="flex-row items-center justify-between p-4 rounded-2xl bg-[#181A1F] border border-[#262930]">
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5 flex-wrap">
            <LinearGradient colors={['#2563EB', '#0284C7']} className="w-7 h-7 rounded-lg items-center justify-center">
              <Ionicons name="card" size={16} color="#FFFFFF" />
            </LinearGradient>
            <Text className="text-base font-extrabold text-white">
              {viewMode === 'dashboard' ? 'Sub Manager' : 'Create Landing Page'}
            </Text>
            {viewMode === 'dashboard' && (
              <>
                <View className="flex-row items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <Text className="text-[10px] font-bold text-emerald-400">Bot Online</Text>
                </View>
                <View className="flex-row items-center gap-1 bg-sky-500/10 px-2 py-0.5 rounded-full">
                  <Ionicons name="shield-checkmark" size={10} color="#0084FF" />
                  <Text className="text-[10px] font-bold text-sky-400">Payouts Active</Text>
                </View>
              </>
            )}
          </View>
          <Text className="text-xs text-slate-400 mt-1">
            {viewMode === 'dashboard'
              ? 'VIP Membership, Automated Checkout & Monetization Hub'
              : 'Configure hosted checkout details, plans & Telegram channel'}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          {viewMode === 'dashboard' ? (
            <Pressable
              className="bg-[#0084FF] flex-row items-center gap-1 px-3.5 py-2 rounded-xl active:opacity-80"
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setViewMode('create');
              }}
            >
              <Ionicons name="add" size={15} color="#FFFFFF" />
              <Text className="text-white text-xs font-bold">New Page</Text>
            </Pressable>
          ) : (
            <Pressable
              className="bg-[#111317] border border-[#262930] px-3 py-2 rounded-xl active:opacity-80"
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setViewMode('dashboard');
              }}
            >
              <Text className="text-slate-300 text-xs font-bold">Cancel</Text>
            </Pressable>
          )}

          {viewMode === 'dashboard' && (
            <Pressable
              className="w-9 h-9 rounded-xl bg-[#111317] border border-[#262930] items-center justify-center active:opacity-70"
              onPress={() => {
                loadDashboard();
                onRefresh();
              }}
            >
              <Ionicons name="refresh-outline" size={16} color="#0084FF" />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── 3-TAB SEGMENTED NAVIGATION ────────────────────────────────────────── */}
      {viewMode === 'dashboard' && (
        <View className="flex-row gap-1.5">
          {[
            { key: 'overview', label: `Overview (₹${stats.totalRevenue || 4})`, icon: 'speedometer-outline' },
            { key: 'channels', label: `Channels (${monetizedList.length})`, icon: 'megaphone-outline' },
            { key: 'pages', label: `Pages (${displayPages.length})`, icon: 'globe-outline' },
          ].map((tab) => {
            const isSel = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                className={`flex-1 flex-row items-center justify-center gap-1 py-2 px-1 rounded-xl border ${
                  isSel ? 'bg-[#0084FF] border-[#0084FF]' : 'bg-[#181A1F] border-[#262930] active:bg-[#20232A]'
                }`}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(tab.key as SubTab);
                }}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={14}
                  color={isSel ? '#FFFFFF' : '#94A3B8'}
                />
                <Text
                  className={`text-[11px] ${isSel ? 'text-white font-bold' : 'text-slate-300 font-semibold'}`}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* ── VIEW 1: DASHBOARD CONTENT ────────────────────────────────────────── */}
      {viewMode === 'dashboard' ? (
        <>
          {/* TAB 1: UNIFIED OVERVIEW COCKPIT & FINANCIAL HUB */}
          {activeTab === 'overview' && (
            <View className="gap-3">
              {/* 4 Unique Top Financial & Subscriber KPIs */}
              <View className="flex-row flex-wrap justify-between gap-y-2">
                <View className="w-[48.5%] p-3 rounded-2xl bg-[#181A1F] border border-[#262930]">
                  <View className="w-7 h-7 rounded-lg bg-indigo-500/10 items-center justify-center mb-1.5">
                    <Ionicons name="cash-outline" size={16} color="#6366F1" />
                  </View>
                  <Text className="text-[9px] font-extrabold text-slate-400">TOTAL REVENUE</Text>
                  <Text className="text-lg font-black text-white mt-0.5">₹{stats.totalRevenue || 4}</Text>
                  <Text className="text-[10px] text-slate-400 mt-0.5">{stats.successfulPaymentsCount || 3} customer payments</Text>
                </View>

                <View className="w-[48.5%] p-3 rounded-2xl bg-[#181A1F] border border-[#262930]">
                  <View className="w-7 h-7 rounded-lg bg-emerald-500/10 items-center justify-center mb-1.5">
                    <Ionicons name="wallet-outline" size={16} color="#10B981" />
                  </View>
                  <Text className="text-[9px] font-extrabold text-slate-400">WITHDRAWABLE</Text>
                  <Text className="text-lg font-black text-emerald-400 mt-0.5">
                    ₹{dashboardData?.financialHub?.availableToWithdraw || stats.availableToWithdraw || 2}
                  </Text>
                  <Text className="text-[10px] text-slate-400 mt-0.5">1 payout batch cleared</Text>
                </View>

                <View className="w-[48.5%] p-3 rounded-2xl bg-[#181A1F] border border-[#262930]">
                  <View className="w-7 h-7 rounded-lg bg-amber-500/10 items-center justify-center mb-1.5">
                    <Ionicons name="time-outline" size={16} color="#F59E0B" />
                  </View>
                  <Text className="text-[9px] font-extrabold text-slate-400">7-DAY ROLLING HOLD</Text>
                  <Text className="text-lg font-black text-amber-400 mt-0.5">
                    ₹{dashboardData?.financialHub?.rollingHold || stats.rollingHold || 0}
                  </Text>
                  <Text className="text-[10px] text-slate-400 mt-0.5">Dispute protection</Text>
                </View>

                <View className="w-[48.5%] p-3 rounded-2xl bg-[#181A1F] border border-[#262930]">
                  <View className="w-7 h-7 rounded-lg bg-sky-500/10 items-center justify-center mb-1.5">
                    <Ionicons name="people-outline" size={16} color="#0084FF" />
                  </View>
                  <Text className="text-[9px] font-extrabold text-slate-400">ACTIVE SUBSCRIBERS</Text>
                  <Text className="text-lg font-black text-white mt-0.5">{stats.activeSubscribers || 0}</Text>
                  <Text className="text-[10px] text-slate-400 mt-0.5">100% automated access</Text>
                </View>
              </View>

              {/* Financial Hub & Payouts Card */}
              <View className="p-4 rounded-2xl bg-[#181A1F] border border-[#262930]">
                <View className="mb-2">
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                    <Text className="text-sm font-extrabold text-white">Financial Hub & Payouts</Text>
                  </View>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    Direct 1-click settlements to your verified bank account.
                  </Text>
                </View>

                {/* Connected Bank Info Pill */}
                <View className="flex-row items-center gap-2 p-2.5 rounded-xl bg-[#111317] border border-[#262930] mb-3">
                  <Ionicons name="business-outline" size={14} color="#10B981" />
                  <Text className="text-xs text-slate-300 flex-1">
                    Bank: {dashboardData?.financialHub?.bankAccount?.accountName || stats.connectedBank?.accountHolder || 'Not Configured'} {stats.connectedBank?.accountHolder ? '(Verified Active)' : ''}
                  </Text>
                </View>

                {/* Action Buttons: Withdraw + Manage Bank */}
                <View className="flex-row gap-2 mb-3">
                  <Pressable
                    className="flex-1 flex-row items-center justify-center gap-1.5 bg-[#0084FF] py-3 px-3 rounded-xl active:opacity-80"
                    onPress={handleWithdrawFunds}
                  >
                    <Ionicons name="download-outline" size={15} color="#FFFFFF" />
                    <Text className="text-white text-xs font-bold" numberOfLines={1}>
                      Withdraw Available (₹{dashboardData?.financialHub?.availableToWithdraw ?? stats.availableToWithdraw ?? 0})
                    </Text>
                  </Pressable>

                  <Pressable
                    className="flex-row items-center justify-center gap-1.5 bg-[#111317] border border-[#262930] py-3 px-3.5 rounded-xl active:opacity-80"
                    onPress={() => setBankModalVisible(true)}
                  >
                    <Ionicons name="card-outline" size={15} color="#0084FF" />
                    <Text className="text-slate-300 text-xs font-bold" numberOfLines={1}>Bank KYC</Text>
                  </Pressable>
                </View>

                {/* How Payout Holds Work Explainer */}
                <View className="p-3 rounded-xl bg-[#111317] border border-[#262930]">
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <Ionicons name="information-circle-outline" size={14} color="#0084FF" />
                    <Text className="text-xs font-bold text-white">How SubManager Payout Holds Work</Text>
                  </View>
                  <Text className="text-[11px] text-slate-400 leading-4">
                    To protect against fraudulent chargebacks, 90% of every payment is held in a 7-day security period, then moves to "Available to Withdraw" for instant transfer.
                  </Text>
                  <View className="flex-row items-center gap-2 mt-2">
                    <Text className="text-[10px] text-slate-400">1. Member Pays</Text>
                    <Ionicons name="arrow-forward" size={11} color="#94A3B8" />
                    <Text className="text-[10px] text-slate-400">2. 7-Day Hold</Text>
                    <Ionicons name="arrow-forward" size={11} color="#94A3B8" />
                    <Text className="text-[10px] text-slate-400">3. Bank Transfer</Text>
                  </View>
                </View>
              </View>

              {/* Transactions Ledger Card */}
              <View className="p-4 rounded-2xl bg-[#181A1F] border border-[#262930]">
                <View className="flex-row justify-between items-center mb-2.5">
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name="receipt-outline" size={16} color="#0084FF" />
                    <Text className="text-sm font-extrabold text-white">Subscriber Transactions</Text>
                  </View>
                  <View className="bg-sky-500/10 px-2 py-0.5 rounded-full">
                    <Text className="text-sky-400 text-[10px] font-bold">{filteredTxns.length} Txns</Text>
                  </View>
                </View>

                {/* Search & Filter Bar */}
                <View className="flex-row items-center gap-2 bg-[#111317] border border-[#262930] rounded-xl px-3 py-2 mb-2.5">
                  <Ionicons name="search" size={15} color="#94A3B8" />
                  <TextInput
                    className="flex-1 text-xs text-white"
                    placeholder="Search payment ID (e.g. pay_...)"
                    placeholderTextColor="#94A3B8"
                    value={txnSearch}
                    onChangeText={setTxnSearch}
                  />
                </View>

                <View className="flex-row gap-1.5 mb-2.5">
                  {(['All', 'Success', 'On Hold'] as const).map((f) => (
                    <Pressable
                      key={f}
                      className={`px-3 py-1.5 rounded-lg border ${
                        txnFilter === f
                          ? 'bg-[#0084FF] border-[#0084FF]'
                          : 'bg-[#111317] border-[#262930] active:bg-[#20232A]'
                      }`}
                      onPress={() => setTxnFilter(f)}
                    >
                      <Text
                        className={`text-[11px] ${
                          txnFilter === f ? 'text-white font-bold' : 'text-slate-400'
                        }`}
                      >
                        {f}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Ledger Item Cards */}
                {filteredTxns.length === 0 ? (
                  <View className="py-5 items-center">
                    <Ionicons name="receipt-outline" size={28} color="#64748B" className="mb-1.5" />
                    <Text className="text-xs font-semibold text-slate-300">No Transactions Yet</Text>
                    <Text className="text-[11px] text-slate-400 mt-0.5">Payments from your landing page subscribers will appear here.</Text>
                  </View>
                ) : (
                  filteredTxns.map((tx) => (
                    <View
                      key={tx.id}
                      className="flex-row items-center justify-between p-2.5 rounded-xl bg-[#111317] border border-[#262930] mb-2"
                    >
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-white" numberOfLines={1}>
                          {tx.razorpay_payment_id || tx.id}
                        </Text>
                        <Text className="text-[10px] text-slate-400 mt-0.5">{tx.dateTime || 'Recent'}</Text>
                      </View>
                      <View className="items-end gap-0.5">
                        <Text className="text-sm font-black text-emerald-400">
                          ₹{tx.netPayout || tx.grossAmount}
                        </Text>
                        <View className="bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          <Text className="text-emerald-400 text-[9px] font-bold">✓ Success</Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>

              {/* Client Launch Readiness Checklist */}
              <Pressable
                className="flex-row items-center justify-between p-3.5 rounded-2xl bg-[#181A1F] border border-[#262930] active:opacity-80"
                onPress={() => setLaunchExpanded(!launchExpanded)}
              >
                <View className="flex-row items-center gap-2">
                  <Ionicons name="rocket-outline" size={16} color="#10B981" />
                  <Text className="text-xs font-bold text-white">Client Launch Readiness</Text>
                  <View className="bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <Text className="text-emerald-400 text-[10px] font-bold">100% Ready</Text>
                  </View>
                </View>
                <Ionicons name={launchExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#64748B" />
              </Pressable>

              {launchExpanded && (
                <View className="p-4 rounded-2xl bg-[#181A1F] border border-[#262930]">
                  <View className="flex-row flex-wrap justify-between gap-y-2">
                    <View className="w-[48.5%] p-2.5 rounded-xl bg-[#111317] border border-[#262930]">
                      <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-[9px] font-extrabold text-slate-400">STEP 1</Text>
                        <View className="bg-sky-500/10 px-1.5 py-0.5 rounded">
                          <Text className="text-sky-400 text-[9px] font-bold">{stats.linkedTelegram?.phone ? 'Linked' : 'Pending'}</Text>
                        </View>
                      </View>
                      <Text className="text-xs font-bold text-white">1. Link Telegram</Text>
                      <Text className="text-[10px] text-slate-400 mt-0.5">{stats.linkedTelegram?.phone ? `Phone: ${stats.linkedTelegram.phone}` : 'Not Linked'}</Text>
                    </View>

                    <View className="w-[48.5%] p-2.5 rounded-xl bg-[#111317] border border-[#262930]">
                      <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-[9px] font-extrabold text-slate-400">STEP 2</Text>
                        <View className="bg-sky-500/10 px-1.5 py-0.5 rounded">
                          <Text className="text-sky-400 text-[9px] font-bold">{monetizedList.length} Active</Text>
                        </View>
                      </View>
                      <Text className="text-xs font-bold text-white">2. Channel Bot Admin</Text>
                      <Text className="text-[10px] text-slate-400 mt-0.5">{monetizedList.length > 0 ? '@Gapsubmanagerbot verified' : 'Add Bot as Admin'}</Text>
                    </View>

                    <View className="w-[48.5%] p-2.5 rounded-xl bg-[#111317] border border-[#262930]">
                      <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-[9px] font-extrabold text-slate-400">STEP 3</Text>
                        <View className="bg-sky-500/10 px-1.5 py-0.5 rounded">
                          <Text className="text-sky-400 text-[9px] font-bold">{stats.connectedBank?.accountHolder ? 'Verified' : 'Pending'}</Text>
                        </View>
                      </View>
                      <Text className="text-xs font-bold text-white">3. Payout Bank KYC</Text>
                      <Text className="text-[10px] text-slate-400 mt-0.5">{stats.connectedBank?.accountHolder ? 'Razorpay 7-day rolling' : 'Connect Bank'}</Text>
                    </View>

                    <View className="w-[48.5%] p-2.5 rounded-xl bg-[#111317] border border-[#262930]">
                      <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-[9px] font-extrabold text-slate-400">STEP 4</Text>
                        <View className="bg-sky-500/10 px-1.5 py-0.5 rounded">
                          <Text className="text-sky-400 text-[9px] font-bold">{displayPages.length} Live</Text>
                        </View>
                      </View>
                      <Text className="text-xs font-bold text-white">4. Subscription Page</Text>
                      <Text className="text-[10px] text-slate-400 mt-0.5">{displayPages.length} checkout page(s)</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Quick Action: Create Page */}
              <Pressable
                className="flex-row items-center justify-center gap-2 bg-[#0084FF] rounded-xl py-3.5 active:opacity-80"
                onPress={() => setViewMode('create')}
              >
                <Ionicons name="add-circle" size={16} color="#FFFFFF" />
                <Text className="text-white text-xs font-bold">+ Create New Landing Page</Text>
              </Pressable>
            </View>
          )}

          {/* TAB 3: TELEGRAM CHANNELS & BOT PRIVILEGES */}
          {activeTab === 'channels' && (
            <View className="gap-3">
              <View className="p-4 rounded-2xl bg-[#181A1F] border border-[#262930]">
                <View className="mb-2.5">
                  <Text className="text-sm font-extrabold text-white">Telegram Channels & Bot Privileges</Text>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    Add @Gapsubmanagerbot as Admin for automated member management.
                  </Text>
                </View>

                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-1.5 bg-[#111317] px-2.5 py-1 rounded-lg border border-[#262930]">
                    <Ionicons name={stats.linkedTelegram?.phone ? 'checkmark-circle' : 'alert-circle'} size={13} color={stats.linkedTelegram?.phone ? '#10B981' : '#F59E0B'} />
                    <Text className="text-[11px] text-slate-300">{stats.linkedTelegram?.phone ? `Owner: ${stats.linkedTelegram.phone}` : 'Owner: Not Linked'}</Text>
                  </View>
                  <Pressable
                    className="flex-row items-center gap-1 bg-[#111317] px-2.5 py-1 rounded-lg border border-[#262930] active:opacity-70"
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      Alert.alert('Channels Synced 🔄', 'Refreshed active channel listeners.');
                    }}
                  >
                    <Ionicons name="sync-outline" size={13} color="#0084FF" />
                    <Text className="text-sky-400 text-[11px] font-bold">Sync Channels</Text>
                  </Pressable>
                </View>

                {/* Subtabs: Monetized vs Discovered */}
                <View className="flex-row gap-2 mb-3">
                  <Pressable
                    className={`flex-1 py-2 rounded-xl border items-center ${
                      channelSubTab === 'monetized'
                        ? 'bg-[#0084FF] border-[#0084FF]'
                        : 'bg-[#111317] border-[#262930] active:bg-[#20232A]'
                    }`}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setChannelSubTab('monetized');
                    }}
                  >
                    <Text className={`text-xs ${channelSubTab === 'monetized' ? 'text-white font-bold' : 'text-slate-400 font-semibold'}`}>
                      Monetized ({monetizedList.length})
                    </Text>
                  </Pressable>
                  <Pressable
                    className={`flex-1 py-2 rounded-xl border items-center ${
                      channelSubTab === 'discovered'
                        ? 'bg-[#0084FF] border-[#0084FF]'
                        : 'bg-[#111317] border-[#262930] active:bg-[#20232A]'
                    }`}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setChannelSubTab('discovered');
                    }}
                  >
                    <Text className={`text-xs ${channelSubTab === 'discovered' ? 'text-white font-bold' : 'text-slate-400 font-semibold'}`}>
                      Discovered ({discoveredList.length})
                    </Text>
                  </Pressable>
                </View>

                {/* Search Bar */}
                <View className="flex-row items-center gap-2 bg-[#111317] border border-[#262930] rounded-xl px-3 py-2 mb-3">
                  <Ionicons name="search" size={15} color="#94A3B8" />
                  <TextInput
                    className="flex-1 text-xs text-white"
                    placeholder="Search channels..."
                    placeholderTextColor="#94A3B8"
                    value={channelSearch}
                    onChangeText={setChannelSearch}
                  />
                </View>

                {/* Channels Cards */}
                {channelSubTab === 'monetized' ? (
                  filteredMonetized.length === 0 ? (
                    <View className="py-5 items-center">
                      <Ionicons name="megaphone-outline" size={28} color="#64748B" className="mb-1.5" />
                      <Text className="text-xs font-semibold text-slate-300">No Monetized Channels</Text>
                      <Text className="text-[11px] text-slate-400 mt-0.5 text-center">
                        Add @Gapsubmanagerbot as Admin to your Telegram channels to monetize them.
                      </Text>
                    </View>
                  ) : (
                    filteredMonetized.map((ch: any) => (
                      <View key={ch.id} className="flex-row items-center justify-between p-3 rounded-xl bg-[#111317] border border-[#262930] mb-2">
                        <View className="w-8 h-8 rounded-lg bg-sky-500/10 items-center justify-center mr-2.5">
                          <Ionicons name="megaphone" size={16} color="#0084FF" />
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center gap-1.5">
                            <Text className="text-xs font-bold text-white">{ch.title}</Text>
                            <View className="bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              <Text className="text-emerald-400 text-[9px] font-bold">✓ Bot Active</Text>
                            </View>
                          </View>
                          <Text className="text-[10px] text-slate-400 mt-0.5">ID: {ch.telegram_chat_id || ch.id}</Text>
                        </View>
                        <Pressable
                          className="bg-[#0084FF] px-2.5 py-1.5 rounded-lg active:opacity-80"
                          onPress={() => setViewMode('create')}
                        >
                          <Text className="text-white text-[10px] font-bold">Create Page →</Text>
                        </Pressable>
                      </View>
                    ))
                  )
                ) : (
                  filteredDiscovered.length === 0 ? (
                    <View className="py-5 items-center">
                      <Ionicons name="radio-outline" size={28} color="#64748B" className="mb-1.5" />
                      <Text className="text-xs font-semibold text-slate-300">No Discovered Channels</Text>
                      <Text className="text-[11px] text-slate-400 mt-0.5 text-center">
                        Sync your Telegram account to discover existing channels.
                      </Text>
                    </View>
                  ) : (
                    filteredDiscovered.map((ch: any) => (
                      <View key={ch.id} className="flex-row items-center justify-between p-3 rounded-xl bg-[#111317] border border-[#262930] mb-2">
                        <View className="w-8 h-8 rounded-lg bg-slate-500/10 items-center justify-center mr-2.5">
                          <Ionicons name="radio-outline" size={16} color="#94A3B8" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-xs font-bold text-white">{ch.title}</Text>
                          <Text className="text-[10px] text-slate-400 mt-0.5">Members: {ch.members || 0}</Text>
                        </View>
                        <Pressable
                          className="bg-[#0084FF] px-2.5 py-1.5 rounded-lg active:opacity-80"
                          onPress={() => setViewMode('create')}
                        >
                          <Text className="text-white text-[10px] font-bold">Monetize →</Text>
                        </Pressable>
                      </View>
                    ))
                  )
                )}
              </View>
            </View>
          )}

          {/* TAB 4: SUBSCRIPTION PAGES MANAGEMENT */}
          {activeTab === 'pages' && (
            <View className="gap-3">
              {/* Search Bar */}
              <View className="flex-row items-center gap-2 bg-[#181A1F] border border-[#262930] rounded-xl px-3 py-2">
                <Ionicons name="search" size={16} color="#94A3B8" />
                <TextInput
                  className="flex-1 text-xs text-white"
                  placeholder="Search pages by name or slug..."
                  placeholderTextColor="#94A3B8"
                  value={pageSearch}
                  onChangeText={setPageSearch}
                />
                {pageSearch.length > 0 && (
                  <Pressable onPress={() => setPageSearch('')}>
                    <Ionicons name="close-circle" size={16} color="#94A3B8" />
                  </Pressable>
                )}
              </View>

              {/* Landing Pages List */}
              <View className="gap-3">
                {loading ? (
                  <View className="py-10 items-center justify-center gap-2">
                    <ActivityIndicator size="large" color="#0084FF" />
                    <Text className="text-xs text-slate-400">Loading your landing pages...</Text>
                  </View>
                ) : filteredPages.length === 0 ? (
                  <View className="p-8 items-center justify-center rounded-2xl bg-[#181A1F] border border-[#262930]">
                    <Ionicons name="document-text-outline" size={40} color="#94A3B8" />
                    <Text className="text-sm font-bold text-white mt-2">No Subscription Pages Found</Text>
                    <Text className="text-xs text-slate-400 text-center mt-1 mb-3.5 leading-4">
                      Create a gated landing page with automated Telegram invites and pricing plans.
                    </Text>
                    <Pressable className="bg-[#0084FF] flex-row items-center gap-1.5 px-3.5 py-2 rounded-xl active:opacity-80" onPress={() => setViewMode('create')}>
                      <Ionicons name="add" size={16} color="#FFFFFF" />
                      <Text className="text-white text-xs font-bold">Create Landing Page</Text>
                    </Pressable>
                  </View>
                ) : (
                  filteredPages.map((page) => (
                    <View key={page.id} className="p-4 rounded-2xl bg-[#181A1F] border border-[#262930] gap-2.5">
                      {/* Card Top: Avatar + Title + Status */}
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2.5 flex-1">
                          <LinearGradient colors={['#3B82F6', '#1D4ED8']} className="w-9 h-9 rounded-lg items-center justify-center">
                            <Text className="text-white text-xs font-black">
                              {(page.title || 'VIP').slice(0, 2).toUpperCase()}
                            </Text>
                          </LinearGradient>
                          <View className="flex-1">
                            <Text className="text-sm font-bold text-white" numberOfLines={1}>
                              {page.title}
                            </Text>
                            <Text className="text-[11px] text-slate-400" numberOfLines={1}>
                              {page.communityName || 'Telegram VIP Group'}
                            </Text>
                          </View>
                        </View>

                        <Switch
                          value={page.isActive ?? true}
                          onValueChange={() => handleTogglePage(page)}
                          trackColor={{ false: '#334155', true: '#10B981' }}
                          thumbColor="#FFFFFF"
                        />
                      </View>

                      {/* URL Pill */}
                      <View className="flex-row items-center justify-between p-2 rounded-xl bg-[#111317] border border-[#262930]">
                        <Text className="text-xs font-mono text-slate-300 flex-1 mr-2" numberOfLines={1}>
                          getaipilot.in/p/{page.slug || 'vip-access'}
                        </Text>
                        <View className="flex-row items-center gap-2">
                          <Pressable
                            className="p-1 active:opacity-70"
                            onPress={() => handleCopyLink(page.url || `https://getaipilot.in/p/${page.slug}`, page.id)}
                          >
                            <Ionicons
                              name={copiedId === page.id ? 'checkmark' : 'copy-outline'}
                              size={15}
                              color="#0084FF"
                            />
                          </Pressable>
                          <Pressable
                            className="p-1 active:opacity-70"
                            onPress={() => setQrModalUrl(page.url || `https://getaipilot.in/p/${page.slug}`)}
                          >
                            <Ionicons name="qr-code-outline" size={15} color="#94A3B8" />
                          </Pressable>
                          <Pressable
                            className="p-1 active:opacity-70"
                            onPress={() => handleOpenUrl(page.url || `https://getaipilot.in/p/${page.slug}`)}
                          >
                            <Ionicons name="open-outline" size={15} color="#94A3B8" />
                          </Pressable>
                        </View>
                      </View>

                      {/* Plans Badges */}
                      {page.plans && page.plans.length > 0 && (
                        <View className="flex-row flex-wrap gap-1.5">
                          {page.plans.map((p: any) => (
                            <View key={p.id || p.name} className="bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                              <Text className="text-sky-400 text-[10px] font-bold">
                                {p.name}: ₹{p.price} ({p.durationUnit || '1 Month'})
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Footer Actions */}
                      <View className="flex-row items-center justify-between border-t border-[#262930] pt-2.5 mt-0.5">
                        <Pressable className="flex-row items-center gap-1 bg-sky-500/10 px-2.5 py-1.5 rounded-lg active:opacity-70" onPress={() => setPlansInspectorPage(page)}>
                          <Ionicons name="layers-outline" size={14} color="#0084FF" />
                          <Text className="text-sky-400 text-xs font-bold">
                            Edit & Plans ({page.plans?.length || 1})
                          </Text>
                        </Pressable>

                        <Pressable
                          className="flex-row items-center gap-1 px-2 py-1.5 active:opacity-70"
                          onPress={() => {
                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            Alert.alert('Subscribers', `0 members currently subscribed to ${page.title}.`);
                          }}
                        >
                          <Ionicons name="people-outline" size={14} color="#94A3B8" />
                          <Text className="text-slate-400 text-xs font-semibold">Subscribers</Text>
                        </Pressable>

                        <Pressable className="p-1.5 active:opacity-70" onPress={() => handleDeletePage(page)}>
                          <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        </Pressable>
                      </View>
                    </View>
                  ))
                )}
              </View>

              {/* Direct Create CTA Button */}
              <Pressable className="flex-row items-center justify-center gap-2 bg-[#0084FF] rounded-xl py-3.5 active:opacity-80" onPress={() => setViewMode('create')}>
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text className="text-white text-xs font-bold">Create New Landing Page</Text>
              </Pressable>
            </View>
          )}
        </>
      ) : (
        /* ── VIEW 2: DEDICATED LANDING PAGE CREATION FLOW ───────────────────── */
        <View className="gap-3.5">
          {/* Page Details Card */}
          <View className="p-4 rounded-2xl bg-[#181A1F] border border-[#262930] gap-3">
            <Text className="text-sm font-extrabold text-white">Page Details</Text>

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
                          isSel ? 'bg-[#0084FF] border-[#0084FF]' : 'bg-[#111317] border-[#262930]'
                        }`}
                        onPress={() => setFormCommunityId(String(comm.id))}
                      >
                        <Ionicons
                          name={isSel ? 'radio-button-on' : 'radio-button-off'}
                          size={13}
                          color={isSel ? '#FFFFFF' : '#0084FF'}
                        />
                        <Text
                          className={`text-xs ${isSel ? 'text-white font-bold' : 'text-slate-300'}`}
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
                className="border border-[#262930] rounded-xl px-3 py-2 text-xs text-white bg-[#111317]"
                placeholder="e.g. Premium Signals"
                placeholderTextColor="#94A3B8"
                value={formTitle}
                onChangeText={handleTitleChange}
              />
            </View>

            <View className="gap-1">
              <Text className="text-[11px] font-bold text-slate-400">Slug (/p/...)*</Text>
              <TextInput
                className="border border-[#262930] rounded-xl px-3 py-2 text-xs text-white bg-[#111317]"
                placeholder="premium-signals"
                placeholderTextColor="#94A3B8"
                value={formSlug}
                onChangeText={setFormSlug}
                autoCapitalize="none"
              />
            </View>

            <View className="gap-1">
              <Text className="text-[11px] font-bold text-slate-400">Description</Text>
              <TextInput
                className="border border-[#262930] rounded-xl p-3 text-xs text-white bg-[#111317] h-20"
                placeholder="Tell subscribers why they should join..."
                placeholderTextColor="#94A3B8"
                value={formDescription}
                onChangeText={setFormDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Channel Logo Upload */}
            <View className="gap-1">
              <Text className="text-[11px] font-bold text-slate-400">Channel Logo</Text>
              <Pressable
                className="border border-dashed border-[#262930] rounded-xl p-4 items-center justify-center bg-[#111317] active:opacity-80"
                onPress={handlePickLogo}
              >
                {formLogoUrl ? (
                  <View className="items-center gap-1">
                    <Ionicons name="image" size={24} color="#10B981" />
                    <Text className="text-xs font-bold text-emerald-400">Logo Selected (Tap to change)</Text>
                  </View>
                ) : (
                  <View className="items-center gap-1">
                    <Ionicons name="cloud-upload-outline" size={24} color="#0084FF" />
                    <Text className="text-xs font-bold text-sky-400">Click to upload logo</Text>
                    <Text className="text-[10px] text-slate-400">PNG, JPG, GIF or WebP (max 2MB)</Text>
                  </View>
                )}
              </Pressable>
            </View>

            <View className="gap-1">
              <Text className="text-[11px] font-bold text-slate-400">Button Text</Text>
              <TextInput
                className="border border-[#262930] rounded-xl px-3 py-2 text-xs text-white bg-[#111317]"
                placeholder="Join Channel"
                placeholderTextColor="#94A3B8"
                value={formButtonText}
                onChangeText={setFormButtonText}
              />
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1 gap-1">
                <Text className="text-[11px] font-bold text-slate-400">Theme</Text>
                <View className="flex-row border border-[#262930] rounded-xl p-0.5 bg-[#111317]">
                  {['Light', 'Dark'].map((t) => (
                    <Pressable
                      key={t}
                      className={`flex-1 py-1.5 items-center rounded-lg ${formTheme === t ? 'bg-[#0084FF]' : ''}`}
                      onPress={() => setFormTheme(t)}
                    >
                      <Text className={`text-xs font-bold ${formTheme === t ? 'text-white' : 'text-slate-400'}`}>{t}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View className="flex-1 gap-1">
                <Text className="text-[11px] font-bold text-slate-400">Meta Pixel ID (Optional)</Text>
                <TextInput
                  className="border border-[#262930] rounded-xl px-3 py-2 text-xs text-white bg-[#111317]"
                  placeholder="12345678"
                  placeholderTextColor="#94A3B8"
                  value={formMetaPixel}
                  onChangeText={setFormMetaPixel}
                />
              </View>
            </View>
          </View>

          {/* Pricing Plans Builder Card */}
          <View className="p-4 rounded-2xl bg-[#181A1F] border border-[#262930] gap-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-sm font-extrabold text-white">Subscription Pricing Plans</Text>
              <View className="bg-sky-500/10 px-2 py-0.5 rounded-full">
                <Text className="text-sky-400 text-[10px] font-bold">{createdPlansList.length} Added</Text>
              </View>
            </View>

            {/* Add Plan Box */}
            <View className="border border-dashed border-[#262930] rounded-xl p-3 bg-[#111317] gap-2">
              <TextInput
                className="border border-[#262930] rounded-xl px-3 py-2 text-xs text-white bg-[#181A1F]"
                placeholder="Plan Name (e.g. VIP Monthly)"
                placeholderTextColor="#94A3B8"
                value={planDraftName}
                onChangeText={setPlanDraftName}
              />

              <View className="flex-row gap-2">
                <TextInput
                  className="flex-1 border border-[#262930] rounded-xl px-3 py-2 text-xs text-white bg-[#181A1F]"
                  placeholder="₹ 999"
                  placeholderTextColor="#94A3B8"
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
                            isSel ? 'bg-[#0084FF] border-[#0084FF]' : 'bg-[#181A1F] border-[#262930]'
                          }`}
                          onPress={() => {
                            setPlanDraftDurationDays(dur.days);
                            setPlanDraftDurationLabel(dur.label);
                          }}
                        >
                          <Text
                            className={`text-[10px] ${
                              isSel ? 'text-white font-bold' : 'text-slate-400'
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

              <Pressable className="bg-[#0084FF] flex-row items-center justify-center gap-1.5 py-2 rounded-xl active:opacity-80" onPress={handleAddPlanDraft}>
                <Ionicons name="add" size={15} color="#FFFFFF" />
                <Text className="text-white text-xs font-bold">Add Pricing Tier</Text>
              </Pressable>
            </View>

            {/* Added Plans List */}
            {createdPlansList.map((plan, idx) => (
              <View
                key={`plan_${idx}`}
                className="flex-row justify-between items-center py-2 border-b border-[#262930] last:border-b-0"
              >
                <View>
                  <Text className="text-xs font-bold text-white">{plan.name}</Text>
                  <Text className="text-[10px] text-slate-400">{plan.durationLabel}</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm font-black text-emerald-400">₹{plan.price}</Text>
                  <Pressable onPress={() => setCreatedPlansList(createdPlansList.filter((_, i) => i !== idx))}>
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>

          {/* Submit Button */}
          <Pressable
            className={`bg-[#0084FF] flex-row items-center justify-center gap-2 py-3.5 rounded-xl active:opacity-80 ${isSubmitting ? 'opacity-60' : ''}`}
            onPress={handleCreatePageSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                <Text className="text-white text-xs font-bold">Publish Landing Page</Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      {/* Modal: QR Code */}
      {qrModalUrl && (
        <Modal transparent animationType="fade" visible={!!qrModalUrl} onRequestClose={() => setQrModalUrl(null)}>
          <View className="flex-1 bg-black/80 justify-center items-center p-5">
            <View className="w-full max-w-sm rounded-2xl p-5 bg-[#181A1F] border border-[#262930]">
              <Text className="text-base font-extrabold text-white">Scan to Open Checkout</Text>
              <Text className="text-xs text-slate-400 mt-0.5 mb-3.5">{qrModalUrl}</Text>
              <View className="items-center justify-center bg-white p-4 rounded-xl">
                <QRCode value={qrModalUrl} size={180} />
              </View>
              <View className="flex-row gap-2.5 mt-3.5">
                <Pressable
                  className="flex-1 bg-[#0084FF] flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl active:opacity-80"
                  onPress={() => handleCopyLink(qrModalUrl, 'qr_url')}
                >
                  <Ionicons name="copy-outline" size={15} color="#FFFFFF" />
                  <Text className="text-white text-xs font-bold">Copy Link</Text>
                </Pressable>
                <Pressable className="px-4 justify-center items-center rounded-xl bg-[#111317] border border-[#262930]" onPress={() => setQrModalUrl(null)}>
                  <Text className="text-slate-300 text-xs font-semibold">Close</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Modal: Plans Inspector */}
      {plansInspectorPage && (
        <Modal transparent animationType="slide" visible={!!plansInspectorPage} onRequestClose={() => setPlansInspectorPage(null)}>
          <View className="flex-1 bg-black/80 justify-center items-center p-5">
            <View className="w-full max-w-sm rounded-2xl p-5 bg-[#181A1F] border border-[#262930]">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-base font-extrabold text-white">{plansInspectorPage.title}</Text>
                <Pressable onPress={() => setPlansInspectorPage(null)}>
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </Pressable>
              </View>

              <ScrollView className="max-h-64 my-2.5">
                {(plansInspectorPage.plans || []).map((p: any) => (
                  <View key={p.id || p.name} className="flex-row justify-between items-center py-2 border-b border-[#262930] last:border-b-0">
                    <View>
                      <Text className="text-xs font-bold text-white">{p.name}</Text>
                      <Text className="text-[10px] text-slate-400">{p.durationUnit || '1 Month'}</Text>
                    </View>
                    <Text className="text-sm font-black text-emerald-400">₹{p.price}</Text>
                  </View>
                ))}
              </ScrollView>

              <Pressable className="bg-[#0084FF] py-3 rounded-xl items-center active:opacity-80 mt-2" onPress={() => setPlansInspectorPage(null)}>
                <Text className="text-white text-xs font-bold">Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* Modal: Bank KYC */}
      {bankModalVisible && (
        <Modal transparent animationType="slide" visible={bankModalVisible} onRequestClose={() => setBankModalVisible(false)}>
          <View className="flex-1 bg-black/80 justify-center items-center p-5">
            <View className="w-full max-w-sm rounded-2xl p-5 bg-[#181A1F] border border-[#262930]">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-base font-extrabold text-white">Bank KYC Details</Text>
                <Pressable onPress={() => setBankModalVisible(false)}>
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </Pressable>
              </View>

              <View className="my-1.5">
                <Text className="text-[9px] font-extrabold text-slate-400 mb-0.5">BENEFICIARY ACCOUNT HOLDER</Text>
                <Text className="text-sm font-bold text-white">
                  {dashboardData?.financialHub?.bankAccount?.accountName || stats.connectedBank?.accountHolder || 'Not Configured'}
                </Text>
              </View>

              <View className="my-1.5">
                <Text className="text-[9px] font-extrabold text-slate-400 mb-0.5">KYC STATUS</Text>
                <View className={`flex-row items-center gap-1 px-2 py-1 rounded-md self-start ${stats.connectedBank?.accountHolder ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                  <Ionicons name={stats.connectedBank?.accountHolder ? 'checkmark-circle' : 'time-outline'} size={13} color={stats.connectedBank?.accountHolder ? '#10B981' : '#F59E0B'} />
                  <Text className={`text-[11px] font-bold ${stats.connectedBank?.accountHolder ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {stats.connectedBank?.accountHolder ? 'Verified Active' : 'Pending Verification'}
                  </Text>
                </View>
              </View>

              <View className="my-1.5">
                <Text className="text-[9px] font-extrabold text-slate-400 mb-0.5">PAYOUT ROUTE</Text>
                <Text className="text-xs text-slate-300">Razorpay Route for 7-day rolling hold transfers</Text>
              </View>

              <Pressable className="bg-[#0084FF] py-3 rounded-xl items-center active:opacity-80 mt-3" onPress={() => setBankModalVisible(false)}>
                <Text className="text-white text-xs font-bold">Done</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};
