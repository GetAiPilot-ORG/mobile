import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Linking,
  Alert,
  Image,
  Share,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

import { telegramApi } from '../api/telegramApi';
import { ReportBotBrandProfile, TelegramToolKey } from '../types';

interface Props {
  onOpenModal: (key: TelegramToolKey) => void;
}

type ReportBotTab = 'profile' | 'channels' | 'archive';

const LOGO_PRESETS = [
  {
    name: 'GAP Pilot Pro',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
    icon: 'shield-checkmark',
    color: '#0284C7',
  },
  {
    name: 'Bull Market AI',
    url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=200&auto=format&fit=crop&q=80',
    icon: 'trending-up',
    color: '#10B981',
  },
  {
    name: 'Alpha Research',
    url: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=200&auto=format&fit=crop&q=80',
    icon: 'analytics',
    color: '#8B5CF6',
  },
  {
    name: 'Gold Hawk Capital',
    url: 'https://images.unsplash.com/photo-1614028674026-a65e31bfd27c?w=200&auto=format&fit=crop&q=80',
    icon: 'flash',
    color: '#F59E0B',
  },
];

export const ReportBotScreen: React.FC<Props> = ({ onOpenModal }) => {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ReportBotTab>('profile');

  // Form State
  const [advisoryFirm, setAdvisoryFirm] = useState('No Brand');
  const [researchAnalyst, setResearchAnalyst] = useState('SEBI');
  const [sebiRegistration, setSebiRegistration] = useState('INH010600090');
  const [website, setWebsite] = useState('getaipilot.com');
  const [email, setEmail] = useState('research@example.com');
  const [officeAddress, setOfficeAddress] = useState('e.g. Kallam, Latur, Maharashtra');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [page1Disclaimer, setPage1Disclaimer] = useState('Add short SEBI/risk disclaimer for the first page.');
  const [page2Disclosure, setPage2Disclosure] = useState('Optional disclosure content.');
  const [page3Conflicts, setPage3Conflicts] = useState('Optional conflict of interest content.');
  const [page4Policy, setPage4Policy] = useState('Optional risk and policy content.');

  // Modal Dialog States
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [customLogoInput, setCustomLogoInput] = useState('');
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);

  // Fetch Live Data
  const { data: dashboard, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['telegram_report_bot_dashboard'],
    queryFn: telegramApi.getReportBotDashboard,
  });

  useEffect(() => {
    if (dashboard?.brandProfile) {
      const p = dashboard.brandProfile;
      if (p.advisoryFirm) setAdvisoryFirm(p.advisoryFirm);
      if (p.researchAnalyst) setResearchAnalyst(p.researchAnalyst);
      if (p.sebiRegistration) setSebiRegistration(p.sebiRegistration);
      if (p.website) setWebsite(p.website);
      if (p.email) setEmail(p.email);
      if (p.officeAddress) setOfficeAddress(p.officeAddress);
      if (p.logoUrl !== undefined) setLogoUrl(p.logoUrl);
      if (p.page1Disclaimer) setPage1Disclaimer(p.page1Disclaimer);
      if (p.page2Disclosure !== undefined) setPage2Disclosure(p.page2Disclosure || '');
      if (p.page3Conflicts !== undefined) setPage3Conflicts(p.page3Conflicts || '');
      if (p.page4Policy !== undefined) setPage4Policy(p.page4Policy || '');
    }
  }, [dashboard]);

  // Derived Stats
  const channelsCount = dashboard?.channelsCount ?? dashboard?.channels?.length ?? 0;
  const reportsCount = dashboard?.reportsCount ?? dashboard?.reports?.length ?? 0;
  const isDmConnected = dashboard?.dmConnected ?? true;

  // Save Settings Mutation
  const { mutateAsync: saveSettings, isPending: isSaving } = useMutation({
    mutationFn: (profile: Partial<ReportBotBrandProfile>) => telegramApi.saveReportBotSettings(profile),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['telegram_report_bot_dashboard'] });
      Alert.alert('Settings Saved', 'Your SEBI Brand Profile has been successfully updated.');
    },
    onError: (err: any) => {
      Alert.alert('Save Failed', err.message || 'Could not save profile settings.');
    },
  });

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await saveSettings({
      advisoryFirm,
      researchAnalyst,
      sebiRegistration,
      website,
      email,
      officeAddress,
      logoUrl,
      page1Disclaimer,
      page2Disclosure,
      page3Conflicts,
      page4Policy,
    });
  };

  const handleStartBot = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const url = dashboard?.botUrl || 'https://t.me/ResearchReport233_bot';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL('https://t.me/ResearchReport233_bot');
      }
    } catch {
      await Linking.openURL('https://t.me/ResearchReport233_bot');
    }
  };

  const handlePickFromGallery = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPickingImage(true);
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Needed', 'Please allow photo gallery access to choose a brand logo.');
        setIsPickingImage(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        const asset = result.assets[0];
        const finalUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setLogoUrl(finalUri);
        setIsLogoModalOpen(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      Alert.alert('Upload Error', err.message || 'Could not select photo from gallery.');
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleTakeCameraPhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPickingImage(true);
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Needed', 'Please allow camera access to take a photo of your brand logo.');
        setIsPickingImage(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        const asset = result.assets[0];
        const finalUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setLogoUrl(finalUri);
        setIsLogoModalOpen(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      Alert.alert('Camera Error', err.message || 'Could not capture photo.');
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleApplyLogoUrl = (url: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLogoUrl(url);
    setIsLogoModalOpen(false);
    setCustomLogoInput('');
  };

  const handleRemoveLogo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLogoUrl(null);
    setIsLogoModalOpen(false);
  };

  const handleShareReport = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        title: `${advisoryFirm} - SEBI Research Report`,
        message: `📊 SEBI Research Call: BUY NIFTY 24000 CE (Entry: Rs 150 | Target: Rs 200 | SL: Rs 120) by ${researchAnalyst} (${sebiRegistration}). Visit: https://${website}`,
      });
    } catch {
      // Ignored
    }
  };

  return (
    <View className="flex-1 bg-[#0B0D10]">
      {/* Top Header */}
      <View className="flex-row justify-between items-start px-4 pt-4 pb-3 border-b border-[#262930]">
        <View className="flex-1 pr-2.5">
          <View className="flex-row items-center gap-2">
            <Text className="text-lg font-extrabold text-white">GAP Report Bot</Text>
            <View className="bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/25">
              <Text className="text-sky-400 text-[10px] font-extrabold">SEBI Compliant</Text>
            </View>
          </View>
          <Text className="text-slate-400 text-[11px] mt-1 leading-4" numberOfLines={2}>
            Convert Telegram trading calls into branded research PDFs with compliance disclaimers.
          </Text>
        </View>
      </View>

      {/* Action Header Buttons: Start Bot & Refresh Status */}
      <View className="flex-row items-center gap-2.5 px-4 py-2.5 border-b border-[#262930]">
        <Pressable className="bg-[#0084FF] flex-row items-center gap-1.5 px-3.5 py-2 rounded-xl active:opacity-80" onPress={handleStartBot}>
          <Ionicons name="paper-plane" size={14} color="#FFFFFF" />
          <Text className="text-white text-xs font-bold">Start Bot</Text>
          <Ionicons name="open-outline" size={13} color="rgba(255,255,255,0.8)" />
        </Pressable>

        <Pressable
          className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl bg-[#181A1F] border border-[#262930] active:opacity-70 ${isRefetching ? 'opacity-60' : ''}`}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            refetch();
          }}
          disabled={isRefetching}
        >
          <Ionicons
            name="refresh-outline"
            size={15}
            color="#94A3B8"
          />
          <Text className="text-xs font-semibold text-slate-300">
            {isRefetching ? 'Refreshing...' : 'Refresh Status'}
          </Text>
        </Pressable>
      </View>

      {/* Stats Metrics Cards */}
      <View className="flex-row px-4 py-2.5 gap-2 border-b border-[#262930]">
        <View className="flex-1 flex-row items-center gap-2 px-2.5 py-2 rounded-xl bg-[#181A1F] border border-[#262930]">
          <View className="w-6.5 h-6.5 rounded-full bg-emerald-500/10 items-center justify-center">
            <Ionicons name="radio-outline" size={14} color="#10B981" />
          </View>
          <View>
            <Text className="text-[9px] font-extrabold text-slate-400">BOT DM</Text>
            <View className="flex-row items-center gap-1 mt-0.5">
              <View className={`w-1.5 h-1.5 rounded-full ${isDmConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <Text className="text-[11px] font-bold text-white">
                {isDmConnected ? 'Connected' : 'Offline'}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-1 flex-row items-center gap-2 px-2.5 py-2 rounded-xl bg-[#181A1F] border border-[#262930]">
          <View className="w-6.5 h-6.5 rounded-full bg-sky-500/10 items-center justify-center">
            <Ionicons name="megaphone-outline" size={14} color="#0284C7" />
          </View>
          <View>
            <Text className="text-[9px] font-extrabold text-slate-400">CHANNELS</Text>
            <Text className="text-[11px] font-bold text-white">
              {channelsCount} Active
            </Text>
          </View>
        </View>

        <View className="flex-1 flex-row items-center gap-2 px-2.5 py-2 rounded-xl bg-[#181A1F] border border-[#262930]">
          <View className="w-6.5 h-6.5 rounded-full bg-purple-500/10 items-center justify-center">
            <Ionicons name="document-text-outline" size={14} color="#8B5CF6" />
          </View>
          <View>
            <Text className="text-[9px] font-extrabold text-slate-400">REPORTS</Text>
            <Text className="text-[11px] font-bold text-white">
              {reportsCount} Generated
            </Text>
          </View>
        </View>
      </View>

      {/* 3-Segment Tab Bar */}
      <View className="px-4 py-2.5 border-b border-[#262930]">
        <View className="flex-row p-1 rounded-xl bg-[#181A1F] gap-1">
          <Pressable
            className={`flex-1 flex-row py-2 items-center justify-center rounded-lg ${activeTab === 'profile' ? 'bg-[#0084FF]' : ''}`}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('profile');
            }}
          >
            <Ionicons
              name="person-outline"
              size={13}
              color={activeTab === 'profile' ? '#FFFFFF' : '#94A3B8'}
              className="mr-1"
            />
            <Text className={`text-[11px] font-bold ${activeTab === 'profile' ? 'text-white' : 'text-slate-400'}`}>
              Brand Profile
            </Text>
          </Pressable>

          <Pressable
            className={`flex-1 flex-row py-2 items-center justify-center rounded-lg ${activeTab === 'channels' ? 'bg-[#0084FF]' : ''}`}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('channels');
            }}
          >
            <Ionicons
              name="megaphone-outline"
              size={13}
              color={activeTab === 'channels' ? '#FFFFFF' : '#94A3B8'}
              className="mr-1"
            />
            <Text className={`text-[11px] font-bold ${activeTab === 'channels' ? 'text-white' : 'text-slate-400'}`}>
              Channels ({channelsCount})
            </Text>
          </Pressable>

          <Pressable
            className={`flex-1 flex-row py-2 items-center justify-center rounded-lg ${activeTab === 'archive' ? 'bg-[#0084FF]' : ''}`}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('archive');
            }}
          >
            <Ionicons
              name="folder-outline"
              size={13}
              color={activeTab === 'archive' ? '#FFFFFF' : '#94A3B8'}
              className="mr-1"
            />
            <Text className={`text-[11px] font-bold ${activeTab === 'archive' ? 'text-white' : 'text-slate-400'}`}>
              Archive ({reportsCount})
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="p-4 pb-40" showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View className="py-14 items-center justify-center gap-3">
            <ActivityIndicator size="large" color="#0084FF" />
            <Text className="text-xs text-slate-400">
              Loading SEBI Report Bot Suite...
            </Text>
          </View>
        ) : (
          <>
            {/* TAB 1: BRAND PROFILE FORM & PDF PREVIEW */}
            {activeTab === 'profile' && (
              <>
                {/* SEBI Brand Profile Card Header */}
                <View className="p-4 rounded-2xl bg-[#181A1F] border border-[#262930] mb-5">
                  <View className="flex-row justify-between items-start mb-4 gap-3">
                    <View className="flex-1">
                      <Text className="text-base font-extrabold text-white">
                        SEBI Brand Profile
                      </Text>
                      <Text className="text-slate-400 text-[11px] mt-0.5 leading-4">
                        These details appear on every generated research PDF.
                      </Text>
                    </View>
                    <Pressable className="bg-[#0084FF] flex-row items-center gap-1.5 px-3 py-2 rounded-lg active:opacity-80" onPress={handleSave} disabled={isSaving}>
                      {isSaving ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="save-outline" size={14} color="#FFFFFF" />
                          <Text className="text-white text-[11px] font-bold">Save Settings</Text>
                        </>
                      )}
                    </Pressable>
                  </View>

                  {/* SECTION 1: IDENTITY (REQUIRED) */}
                  <View className="flex-row items-center gap-1.5 mb-0.5">
                    <View className="flex-row items-center gap-1 bg-sky-500/10 px-1.5 py-0.5 rounded">
                      <Ionicons name="shield-checkmark-outline" size={12} color="#0284C7" />
                      <Text className="text-sky-400 text-[8px] font-extrabold">REQUIRED</Text>
                    </View>
                    <Text className="text-xs font-bold text-sky-400">Identity & Registration</Text>
                  </View>
                  <Text className="text-slate-400 text-[11px] mb-2.5 leading-4">Mandatory details for official SEBI report header formatting.</Text>

                  <View className="flex-row mb-3">
                    <View className="flex-1 mr-1.5">
                      <Text className="text-slate-400 text-[10px] font-extrabold mb-1">ADVISORY FIRM *</Text>
                      <TextInput
                        className="border border-[#262930] rounded-xl px-3 py-2.5 text-xs text-white bg-[#111317]"
                        value={advisoryFirm}
                        onChangeText={setAdvisoryFirm}
                        placeholder="Advisory Firm Name"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                    <View className="flex-1 ml-1.5">
                      <Text className="text-slate-400 text-[10px] font-extrabold mb-1">RESEARCH ANALYST *</Text>
                      <TextInput
                        className="border border-[#262930] rounded-xl px-3 py-2.5 text-xs text-white bg-[#111317]"
                        value={researchAnalyst}
                        onChangeText={setResearchAnalyst}
                        placeholder="Analyst Name"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  </View>

                  <View className="flex-row mb-3">
                    <View className="flex-1 mr-1.5">
                      <Text className="text-slate-400 text-[10px] font-extrabold mb-1">SEBI REGISTRATION *</Text>
                      <TextInput
                        className="border border-[#262930] rounded-xl px-3 py-2.5 text-xs text-white bg-[#111317]"
                        value={sebiRegistration}
                        onChangeText={setSebiRegistration}
                        placeholder="INH010600090"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                    <View className="flex-1 ml-1.5">
                      <Text className="text-slate-400 text-[10px] font-extrabold mb-1">WEBSITE</Text>
                      <TextInput
                        className="border border-[#262930] rounded-xl px-3 py-2.5 text-xs text-white bg-[#111317]"
                        value={website}
                        onChangeText={setWebsite}
                        placeholder="getaipilot.com"
                        placeholderTextColor="#94A3B8"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  {/* SECTION 2: CONTACT (OPTIONAL) */}
                  <View className="flex-row items-center gap-1.5 mb-0.5 mt-3.5">
                    <View className="flex-row items-center gap-1 bg-slate-500/10 px-1.5 py-0.5 rounded">
                      <Ionicons name="mail-outline" size={12} color="#94A3B8" />
                      <Text className="text-slate-400 text-[8px] font-extrabold">CONTACT</Text>
                    </View>
                    <Text className="text-xs font-bold text-slate-300">Contact & Location</Text>
                  </View>
                  <Text className="text-slate-400 text-[11px] mb-2.5 leading-4">Optional details rendered in PDF footer and compliance page.</Text>

                  <View className="mb-3">
                    <Text className="text-slate-400 text-[10px] font-extrabold mb-1">EMAIL</Text>
                    <TextInput
                      className="border border-[#262930] rounded-xl px-3 py-2.5 text-xs text-white bg-[#111317]"
                      value={email}
                      onChangeText={setEmail}
                      placeholder="research@example.com"
                      placeholderTextColor="#94A3B8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <View className="mb-3">
                    <Text className="text-slate-400 text-[10px] font-extrabold mb-1">LOCATION / OFFICE ADDRESS (OPTIONAL)</Text>
                    <TextInput
                      className="border border-[#262930] rounded-xl px-3 py-2.5 text-xs text-white bg-[#111317]"
                      value={officeAddress}
                      onChangeText={setOfficeAddress}
                      placeholder="e.g. Kallam, Latur, Maharashtra"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  {/* SECTION 3: REPORT ASSETS & CLICKABLE LOGO UPLOAD */}
                  <View className="flex-row items-center gap-1.5 mb-0.5 mt-3.5">
                    <View className="flex-row items-center gap-1 bg-sky-500/10 px-1.5 py-0.5 rounded">
                      <Ionicons name="image-outline" size={12} color="#0284C7" />
                      <Text className="text-sky-400 text-[8px] font-extrabold">BRAND ASSETS</Text>
                    </View>
                    <Text className="text-xs font-bold text-sky-400">Brand Logo & First Page</Text>
                  </View>
                  <Text className="text-slate-400 text-[11px] mb-2.5 leading-4">Logo and page 1 risk language are embedded in every generated PDF.</Text>

                  <View className="flex-row mb-3">
                    {/* Interactive Pressable Logo Box */}
                    <Pressable
                      className={`w-28 h-28 rounded-xl border border-dashed items-center justify-center p-1.5 bg-[#111317] ${
                        logoUrl ? 'border-[#0084FF] border-solid' : 'border-[#262930]'
                      }`}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setIsLogoModalOpen(true);
                      }}
                    >
                      {logoUrl ? (
                        <View className="w-full h-full items-center justify-center relative">
                          <Image source={{ uri: logoUrl }} className="w-20 h-20 rounded-lg" resizeMode="contain" />
                          <View className="absolute -bottom-1 bg-[#0084FF]/90 flex-row items-center gap-1 px-1.5 py-0.5 rounded">
                            <Ionicons name="create-outline" size={10} color="#FFFFFF" />
                            <Text className="text-white text-[8px] font-bold">Change</Text>
                          </View>
                        </View>
                      ) : (
                        <>
                          <Ionicons name="cloud-upload-outline" size={24} color="#0084FF" />
                          <Text className="text-[10px] font-bold text-slate-400 mt-1">Brand Logo</Text>
                          <View className="flex-row items-center gap-0.5 bg-sky-500/10 px-2 py-1 rounded-md mt-1.5">
                            <Ionicons name="add" size={11} color="#0084FF" />
                            <Text className="text-sky-400 text-[9px] font-bold">Upload</Text>
                          </View>
                        </>
                      )}
                    </Pressable>

                    <View className="flex-1 ml-2.5">
                      <Text className="text-slate-400 text-[10px] font-extrabold mb-1">PAGE 1 RISK DISCLAIMER</Text>
                      <TextInput
                        className="border border-[#262930] rounded-xl p-3 text-xs text-white bg-[#111317] h-28"
                        multiline
                        textAlignVertical="top"
                        value={page1Disclaimer}
                        onChangeText={setPage1Disclaimer}
                        placeholder="Add short SEBI/risk disclaimer for the first page..."
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  </View>

                  {/* SECTION 4: OPTIONAL PAGES */}
                  <View className="flex-row items-center gap-1.5 mb-0.5 mt-3.5">
                    <View className="flex-row items-center gap-1 bg-amber-500/10 px-1.5 py-0.5 rounded">
                      <Ionicons name="documents-outline" size={12} color="#F59E0B" />
                      <Text className="text-amber-400 text-[8px] font-extrabold">DISCLOSURES</Text>
                    </View>
                    <Text className="text-xs font-bold text-amber-400">Optional Extra Pages</Text>
                  </View>
                  <Text className="text-slate-400 text-[11px] mb-2.5 leading-4">
                    Add disclosure or policy sections appended after the main recommendation page.
                  </Text>

                  <View className="mb-3">
                    <Text className="text-slate-400 text-[10px] font-extrabold mb-1">PAGE 2 DISCLOSURE</Text>
                    <TextInput
                      className="border border-[#262930] rounded-xl p-3 text-xs text-white bg-[#111317] h-16"
                      multiline
                      textAlignVertical="top"
                      value={page2Disclosure}
                      onChangeText={setPage2Disclosure}
                      placeholder="Optional regulatory disclosure content."
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View className="mb-3">
                    <Text className="text-slate-400 text-[10px] font-extrabold mb-1">PAGE 3 CONFLICTS OF INTEREST</Text>
                    <TextInput
                      className="border border-[#262930] rounded-xl p-3 text-xs text-white bg-[#111317] h-16"
                      multiline
                      textAlignVertical="top"
                      value={page3Conflicts}
                      onChangeText={setPage3Conflicts}
                      placeholder="Optional conflict of interest statement."
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View className="mb-3">
                    <Text className="text-slate-400 text-[10px] font-extrabold mb-1">PAGE 4 RISK & EXECUTION POLICY</Text>
                    <TextInput
                      className="border border-[#262930] rounded-xl p-3 text-xs text-white bg-[#111317] h-16"
                      multiline
                      textAlignVertical="top"
                      value={page4Policy}
                      onChangeText={setPage4Policy}
                      placeholder="Optional risk policy content."
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                {/* 🌟 PDF PREVIEW CARD */}
                <View className="p-4 rounded-2xl bg-[#181A1F] border border-[#262930] mb-5">
                  <View className="flex-row justify-between items-center mb-3">
                    <View className="flex-1">
                      <Text className="text-base font-extrabold text-white">
                        PDF Preview
                      </Text>
                      <Text className="text-slate-400 text-[11px] mt-0.5">Live snapshot rendered from your SEBI brand settings.</Text>
                    </View>
                    <View className="flex-row items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <Text className="text-emerald-400 text-[10px] font-bold">Live Synced</Text>
                    </View>
                  </View>

                  {/* Rendered Sample PDF Sheet View */}
                  <View className="p-3.5 rounded-xl bg-[#111317] border border-[#262930] mb-3">
                    {/* PDF Header with Avatar / Logo & SEBI Registration */}
                    <View className="flex-row items-center gap-3 mb-3">
                      {logoUrl ? (
                        <Image source={{ uri: logoUrl }} className="w-10 h-10 rounded-lg" resizeMode="contain" />
                      ) : (
                        <View className="w-10 h-10 rounded-lg bg-[#0084FF] items-center justify-center">
                          <Text className="text-white text-base font-black">
                            {advisoryFirm ? advisoryFirm.charAt(0).toUpperCase() : 'N'}
                          </Text>
                        </View>
                      )}
                      <View className="flex-1">
                        <Text className="text-sm font-bold text-white" numberOfLines={1}>
                          {advisoryFirm || 'No Brand'}
                        </Text>
                        <Text className="text-[10px] text-slate-400">
                          {researchAnalyst || 'SEBI'} • Reg: {sebiRegistration || 'INH010600090'}
                        </Text>
                      </View>
                    </View>

                    {/* Trade Recommendation Badge Banner */}
                    <View className="flex-row items-center justify-center gap-1.5 bg-emerald-600 rounded-lg py-2 mb-2.5">
                      <Ionicons name="trending-up" size={15} color="#FFFFFF" />
                      <Text className="text-white text-xs font-black">
                        BUY RECOMMENDATION : NIFTY 24000 CE
                      </Text>
                    </View>

                    {/* 3 Call Metrics: Entry, Target, Stop Loss */}
                    <View className="flex-row gap-2 mb-2.5">
                      <View className="flex-1 items-center p-2 rounded-lg bg-[#181A1F] border border-[#262930]">
                        <Text className="text-[9px] font-bold text-slate-400">ENTRY</Text>
                        <Text className="text-xs font-black text-white mt-0.5">Rs 150</Text>
                      </View>
                      <View className="flex-1 items-center p-2 rounded-lg bg-[#181A1F] border border-[#262930]">
                        <Text className="text-[9px] font-bold text-slate-400">TARGET</Text>
                        <Text className="text-xs font-black text-emerald-400 mt-0.5">Rs 200</Text>
                      </View>
                      <View className="flex-1 items-center p-2 rounded-lg bg-[#181A1F] border border-[#262930]">
                        <Text className="text-[9px] font-bold text-slate-400">STOP LOSS</Text>
                        <Text className="text-xs font-black text-red-400 mt-0.5">Rs 120</Text>
                      </View>
                    </View>

                    {/* Disclaimer Snippet */}
                    <Text className="text-[10px] text-slate-400 leading-3.5" numberOfLines={2}>
                      {page1Disclaimer || 'Investment in securities market are subject to market risks. Read all related documents carefully.'}
                    </Text>

                    <View className="flex-row justify-between items-center border-t border-[#262930] pt-2 mt-2.5">
                      <Text className="text-[9px] text-slate-500">
                        {[true, !!page2Disclosure, !!page3Conflicts, !!page4Policy].filter(Boolean).length} pages configured
                      </Text>
                      <Text className="text-[9px] font-bold text-[#0084FF]">Powered by GAP SEBI Engine</Text>
                    </View>
                  </View>

                  {/* Preview CTA Button - Opens Full Interactive PDF Previewer */}
                  <Pressable
                    className="flex-row items-center justify-center gap-2 bg-[#0084FF] rounded-xl py-3 active:opacity-80"
                    onPress={() => {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      setIsPdfPreviewOpen(true);
                    }}
                  >
                    <Ionicons name="eye-outline" size={16} color="#FFFFFF" />
                    <Text className="text-white text-xs font-bold">Preview Full PDF</Text>
                  </Pressable>
                </View>
              </>
            )}

            {/* TAB 2: CHANNELS */}
            {activeTab === 'channels' && (
              <View className="p-4 rounded-2xl bg-[#181A1F] border border-[#262930] mb-5">
                <View className="mb-4">
                  <Text className="text-base font-extrabold text-white">
                    Connected Trading Channels
                  </Text>
                  <Text className="text-slate-400 text-[11px] mt-0.5 leading-4">
                    Channels where @ResearchReport233_bot listens and generates compliance PDFs.
                  </Text>
                </View>

                {(dashboard?.channels || []).length === 0 ? (
                  <View className="py-8 items-center text-center">
                    <View className="w-14 h-14 rounded-full bg-sky-500/10 items-center justify-center mb-3">
                      <Ionicons name="radio-outline" size={30} color="#0084FF" />
                    </View>
                    <Text className="text-sm font-bold text-white text-center">
                      No Channels Connected Yet
                    </Text>
                    <Text className="text-xs text-slate-400 text-center mt-1 px-4 leading-4">
                      Add @ResearchReport233_bot as an Admin to your Telegram trading channel to begin auto-converting calls into branded PDFs.
                    </Text>
                    <Pressable className="bg-[#0084FF] flex-row items-center gap-1.5 px-4 py-2.5 rounded-xl mt-4 active:opacity-80" onPress={handleStartBot}>
                      <Ionicons name="add" size={16} color="#FFFFFF" />
                      <Text className="text-white text-xs font-bold">Connect Channel in Telegram</Text>
                    </Pressable>
                  </View>
                ) : (
                  (dashboard?.channels || []).map((ch: any, idx: number) => (
                    <View key={`ch_${ch.id || idx}`} className="flex-row items-center gap-3 p-3 rounded-xl bg-[#111317] border border-[#262930] mb-2">
                      <View className="w-8 h-8 rounded-lg bg-sky-500/10 items-center justify-center">
                        <Ionicons name="megaphone" size={16} color="#0084FF" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-white">
                          {ch.name}
                        </Text>
                        <View className="flex-row items-center gap-1 mt-0.5">
                          <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <Text className="text-[10px] text-slate-400">Active Listener</Text>
                        </View>
                      </View>
                      <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                    </View>
                  ))
                )}
              </View>
            )}

            {/* TAB 3: REPORTS ARCHIVE */}
            {activeTab === 'archive' && (
              <View className="p-4 rounded-2xl bg-[#181A1F] border border-[#262930] mb-5">
                <View className="mb-4">
                  <Text className="text-base font-extrabold text-white">
                    Generated Reports Archive
                  </Text>
                  <Text className="text-slate-400 text-[11px] mt-0.5 leading-4">
                    Complete compliance history of all generated research PDFs.
                  </Text>
                </View>

                {(dashboard?.reports || []).length === 0 ? (
                  <View className="py-8 items-center text-center">
                    <View className="w-14 h-14 rounded-full bg-red-500/10 items-center justify-center mb-3">
                      <Ionicons name="document-text-outline" size={30} color="#EF4444" />
                    </View>
                    <Text className="text-sm font-bold text-white text-center">
                      No Reports Generated Yet
                    </Text>
                    <Text className="text-xs text-slate-400 text-center mt-1 px-4 leading-4">
                      When you post trading calls in your connected channels, formatted SEBI compliance PDFs will automatically appear here.
                    </Text>
                  </View>
                ) : (
                  (dashboard?.reports || []).map((rep: any) => (
                    <View key={rep.id} className="flex-row items-center gap-3 p-3 rounded-xl bg-[#111317] border border-[#262930] mb-2">
                      <View className="w-8 h-8 rounded-lg bg-red-500/10 items-center justify-center">
                        <Ionicons name="document-text" size={18} color="#EF4444" />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-xs font-bold text-white">
                            {rep.title}
                          </Text>
                          <View className="bg-sky-500/10 px-1.5 py-0.5 rounded">
                            <Text className="text-sky-400 text-[9px] font-bold">{rep.callType}</Text>
                          </View>
                        </View>
                        <Text className="text-[10px] text-slate-400 mt-0.5">
                          Entry: {rep.entry} • Target: {rep.target} • SL: {rep.stopLoss}
                        </Text>
                      </View>
                      <Pressable
                        className="w-8 h-8 rounded-lg bg-[#181A1F] border border-[#262930] items-center justify-center active:opacity-70"
                        onPress={() => {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          setIsPdfPreviewOpen(true);
                        }}
                      >
                        <Ionicons name="eye-outline" size={16} color="#0084FF" />
                      </Pressable>
                    </View>
                  ))
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* 🖼️ BRAND LOGO UPLOADER / SELECTOR MODAL WITH GALLERY & CAMERA */}
      <Modal visible={isLogoModalOpen} transparent animationType="fade" onRequestClose={() => setIsLogoModalOpen(false)}>
        <View className="flex-1 justify-center items-center p-4 bg-black/80">
          <View className="w-full max-w-md p-5 rounded-2xl bg-[#181A1F] border border-[#262930]">
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1">
                <Text className="text-base font-extrabold text-white">Upload Brand Logo</Text>
                <Text className="text-xs text-slate-400 mt-0.5">Choose from gallery, snap a photo, or paste a URL.</Text>
              </View>
              <Pressable onPress={() => setIsLogoModalOpen(false)} className="w-8 h-8 rounded-full items-center justify-center bg-[#111317]">
                <Ionicons name="close" size={18} color="#FFFFFF" />
              </Pressable>
            </View>

            {/* PRIMARY NATIVE ACTIONS: GALLERY & CAMERA */}
            <View className="gap-2.5 mb-4">
              <Pressable
                className="flex-row items-center gap-3 p-3 rounded-xl bg-[#0084FF] active:opacity-80"
                onPress={handlePickFromGallery}
                disabled={isPickingImage}
              >
                {isPickingImage ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="images" size={20} color="#FFFFFF" />
                    <View>
                      <Text className="text-white text-xs font-bold">Choose from Gallery</Text>
                      <Text className="text-white/80 text-[10px] mt-0.5">Pick logo from photo library</Text>
                    </View>
                  </>
                )}
              </Pressable>

              <Pressable
                className="flex-row items-center gap-3 p-3 rounded-xl bg-[#111317] border border-[#262930] active:opacity-80"
                onPress={handleTakeCameraPhoto}
                disabled={isPickingImage}
              >
                <Ionicons name="camera" size={20} color="#0084FF" />
                <View>
                  <Text className="text-xs font-bold text-white">Take Photo</Text>
                  <Text className="text-slate-400 text-[10px] mt-0.5">Snap logo with camera</Text>
                </View>
              </Pressable>
            </View>

            {/* Custom Image URL Input */}
            <View className="mb-3.5">
              <Text className="text-slate-400 text-[10px] font-extrabold mb-1">OR PASTE IMAGE URL</Text>
              <View className="flex-row gap-2">
                <TextInput
                  className="flex-1 border border-[#262930] rounded-xl px-3 py-2 text-xs text-white bg-[#111317]"
                  placeholder="https://example.com/logo.png"
                  placeholderTextColor="#94A3B8"
                  value={customLogoInput}
                  onChangeText={setCustomLogoInput}
                  autoCapitalize="none"
                />
                <Pressable
                  className={`bg-[#0084FF] px-3.5 py-2 rounded-xl justify-center items-center ${!customLogoInput.trim() ? 'opacity-50' : 'active:opacity-80'}`}
                  onPress={() => {
                    if (customLogoInput.trim()) {
                      handleApplyLogoUrl(customLogoInput.trim());
                    }
                  }}
                  disabled={!customLogoInput.trim()}
                >
                  <Text className="text-white text-xs font-bold">Apply</Text>
                </Pressable>
              </View>
            </View>

            {/* Curated Presets Grid */}
            <Text className="text-slate-400 text-[10px] font-extrabold mb-1">OR CHOOSE A BRAND PRESET</Text>
            <View className="flex-row flex-wrap justify-between gap-y-2 mb-4">
              {LOGO_PRESETS.map((preset) => (
                <Pressable
                  key={preset.name}
                  className={`w-[48%] flex-row items-center gap-2 p-2 rounded-xl border bg-[#111317] ${
                    logoUrl === preset.url ? 'border-[#0084FF] bg-sky-500/10' : 'border-[#262930]'
                  }`}
                  onPress={() => handleApplyLogoUrl(preset.url)}
                >
                  <Image source={{ uri: preset.url }} className="w-8 h-8 rounded-lg" resizeMode="cover" />
                  <Text className="text-[11px] font-bold text-white flex-1" numberOfLines={1}>
                    {preset.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Footer with Remove button */}
            {logoUrl && (
              <Pressable className="flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500/10 active:opacity-70" onPress={handleRemoveLogo}>
                <Ionicons name="trash-outline" size={14} color="#EF4444" />
                <Text className="text-red-400 text-xs font-bold">Remove Current Logo</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>

      {/* 📑 FULL INTERACTIVE SEBI PDF REPORT VIEWER MODAL */}
      <Modal
        visible={isPdfPreviewOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsPdfPreviewOpen(false)}
      >
        <View className="flex-1 bg-[#0B0D10]">
          {/* Viewer Top Bar */}
          <View className="flex-row justify-between items-center px-4 py-3.5 border-b border-[#262930]">
            <View className="flex-row items-center gap-2.5 flex-1">
              <Pressable className="w-9 h-9 rounded-full justify-center items-center bg-[#181A1F] active:opacity-70" onPress={() => setIsPdfPreviewOpen(false)}>
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              </Pressable>
              <View className="flex-1">
                <Text className="text-sm font-bold text-white" numberOfLines={1}>
                  SEBI Research Report PDF
                </Text>
                <Text className="text-[11px] text-slate-400" numberOfLines={1}>
                  {advisoryFirm || 'SEBI Research'} • Live Sample
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2">
              <Pressable className="w-9 h-9 rounded-full justify-center items-center bg-sky-500/10 active:opacity-70" onPress={handleShareReport}>
                <Ionicons name="share-outline" size={18} color="#0084FF" />
              </Pressable>
              <Pressable
                className="flex-row items-center gap-1 bg-[#0084FF] px-3 py-2 rounded-xl active:opacity-80"
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  Alert.alert('PDF Ready', 'Report PDF is generated with high-res vector graphics and ready to broadcast.');
                }}
              >
                <Ionicons name="download-outline" size={16} color="#FFFFFF" />
                <Text className="text-white text-xs font-bold">Save</Text>
              </Pressable>
            </View>
          </View>

          {/* Scrollable Multi-Page Document View */}
          <ScrollView
            className="flex-1"
            contentContainerClassName="p-4 pb-20 gap-5"
            showsVerticalScrollIndicator={false}
          >
            {/* PAGE 1: TRADE RECOMMENDATION */}
            <View className="rounded-2xl p-5 border border-[#262930] bg-[#181A1F] relative">
              <View className="absolute top-3.5 right-3.5 bg-slate-500/15 px-2 py-1 rounded">
                <Text className="text-[9px] font-bold text-slate-400">
                  Page 1 of {[true, !!page2Disclosure, !!page3Conflicts, !!page4Policy].filter(Boolean).length}
                </Text>
              </View>

              {/* Branded Header */}
              <View className="flex-row items-center gap-3 mb-3">
                {logoUrl ? (
                  <Image source={{ uri: logoUrl }} className="w-11 h-11 rounded-lg" resizeMode="contain" />
                ) : (
                  <View className="w-11 h-11 rounded-lg bg-[#0084FF] justify-center items-center">
                    <Text className="text-white text-xl font-black">{advisoryFirm ? advisoryFirm.charAt(0).toUpperCase() : 'N'}</Text>
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-base font-extrabold text-[#0084FF]">{advisoryFirm || 'No Brand'}</Text>
                  <Text className="text-[10px] text-slate-400 leading-3.5">
                    Research Analyst: {researchAnalyst} • SEBI Reg: {sebiRegistration}
                  </Text>
                  <Text className="text-[10px] text-slate-400 leading-3.5">
                    Web: {website} • Email: {email}
                  </Text>
                </View>
              </View>

              <View className="h-px bg-[#262930] my-3" />

              {/* Call Banner */}
              <View className="bg-emerald-600 rounded-xl p-3 items-center mb-3.5">
                <Text className="text-emerald-100 text-[9px] font-extrabold tracking-wider mb-0.5">INTRADAY OPTION CALL</Text>
                <Text className="text-white text-base font-black">BUY NIFTY 24000 CE</Text>
                <Text className="text-emerald-200 text-[9px] mt-0.5">
                  Generated on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Text>
              </View>

              {/* Trade Matrix Table */}
              <View className="flex-row border border-[#262930] rounded-xl overflow-hidden mb-3.5">
                <View className="flex-1 p-2.5 items-center bg-[#111317]">
                  <Text className="text-[9px] font-extrabold text-slate-400">ENTRY RANGE</Text>
                  <Text className="text-sm font-black text-white mt-0.5">Rs 150.00</Text>
                </View>
                <View className="flex-1 p-2.5 items-center bg-[#111317] border-l border-r border-[#262930]">
                  <Text className="text-[9px] font-extrabold text-slate-400">TARGET</Text>
                  <Text className="text-sm font-black text-emerald-400 mt-0.5">Rs 200.00</Text>
                </View>
                <View className="flex-1 p-2.5 items-center bg-[#111317]">
                  <Text className="text-[9px] font-extrabold text-slate-400">STOP LOSS</Text>
                  <Text className="text-sm font-black text-red-400 mt-0.5">Rs 120.00</Text>
                </View>
              </View>

              {/* Rationale & Setup Section */}
              <View className="mb-3.5">
                <Text className="text-xs font-bold text-[#0084FF] mb-1">Technical Setup & Rationale</Text>
                <Text className="text-[11px] text-slate-300 leading-4">
                  Nifty 24000 CE is exhibiting strong momentum above resistance with heavy open interest buildup. F&O PCR trend remains bullish with 1:1.67 risk-reward ratio.
                </Text>
              </View>

              {/* Page 1 Mandatory SEBI Disclaimer */}
              <View className="bg-amber-500/10 border-l-2 border-amber-500 p-2.5 rounded-r-lg mb-3.5">
                <Text className="text-[9px] font-extrabold text-amber-400 mb-0.5">SEBI COMPLIANCE & RISK DISCLAIMER</Text>
                <Text className="text-[9px] text-amber-200 leading-3.5">
                  {page1Disclaimer || 'Investment in securities market are subject to market risks. Read all the related documents carefully before investing. Registration granted by SEBI and certification from NISM in no way guarantee performance.'}
                </Text>
              </View>

              {/* Footer Stamp */}
              <View className="border-t border-[#262930] pt-2 flex-row justify-between items-center">
                <Text className="text-[9px] text-slate-400">{officeAddress}</Text>
                <Text className="text-[9px] font-bold text-[#0084FF]">GAP SEBI Report Bot Suite</Text>
              </View>
            </View>

            {/* PAGE 2: DISCLOSURES (IF CONFIGURED) */}
            {page2Disclosure ? (
              <View className="rounded-2xl p-5 border border-[#262930] bg-[#181A1F] relative">
                <View className="absolute top-3.5 right-3.5 bg-slate-500/15 px-2 py-1 rounded">
                  <Text className="text-[9px] font-bold text-slate-400">Page 2</Text>
                </View>
                <Text className="text-base font-extrabold text-[#0084FF] mb-1">{advisoryFirm}</Text>
                <Text className="text-xs font-bold text-slate-300">Regulatory Disclosures</Text>
                <View className="h-px bg-[#262930] my-2.5" />
                <Text className="text-[11px] text-slate-300 leading-4">{page2Disclosure}</Text>
              </View>
            ) : null}

            {/* PAGE 3: CONFLICTS (IF CONFIGURED) */}
            {page3Conflicts ? (
              <View className="rounded-2xl p-5 border border-[#262930] bg-[#181A1F] relative">
                <View className="absolute top-3.5 right-3.5 bg-slate-500/15 px-2 py-1 rounded">
                  <Text className="text-[9px] font-bold text-slate-400">Page 3</Text>
                </View>
                <Text className="text-base font-extrabold text-[#0084FF] mb-1">{advisoryFirm}</Text>
                <Text className="text-xs font-bold text-slate-300">Conflict of Interest Statement</Text>
                <View className="h-px bg-[#262930] my-2.5" />
                <Text className="text-[11px] text-slate-300 leading-4">{page3Conflicts}</Text>
              </View>
            ) : null}

            {/* PAGE 4: POLICY (IF CONFIGURED) */}
            {page4Policy ? (
              <View className="rounded-2xl p-5 border border-[#262930] bg-[#181A1F] relative">
                <View className="absolute top-3.5 right-3.5 bg-slate-500/15 px-2 py-1 rounded">
                  <Text className="text-[9px] font-bold text-slate-400">Page 4</Text>
                </View>
                <Text className="text-base font-extrabold text-[#0084FF] mb-1">{advisoryFirm}</Text>
                <Text className="text-xs font-bold text-slate-300">Risk & Execution Policy</Text>
                <View className="h-px bg-[#262930] my-2.5" />
                <Text className="text-[11px] text-slate-300 leading-4">{page4Policy}</Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};
