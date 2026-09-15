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
import { ReportBotBrandProfile } from '../types';

interface ReportBotModalProps {
  visible: boolean;
  onClose: () => void;
}

type ReportBotTab = 'profile' | 'channels' | 'archive';

const LOGO_PRESETS = [
  {
    name: 'GAP Pilot Pro',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
    icon: 'shield-checkmark',
    color: '#0084FF',
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

export const ReportBotModal: React.FC<ReportBotModalProps> = ({ visible, onClose }) => {
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
    enabled: visible,
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
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-[#0B0D10]">
        {/* Top Header */}
        <View className="flex-row justify-between items-start px-4 pt-4 pb-3 border-b border-[#262930] bg-[#181A1F]">
          <View className="flex-1 mr-3">
            <View className="flex-row items-center gap-2 mb-1">
              <Text className="text-xl font-bold text-white">GAP Report Bot</Text>
              <View className="bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <Text className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">SEBI Compliant</Text>
              </View>
            </View>
            <Text className="text-xs text-slate-400" numberOfLines={2}>
              Convert Telegram trading calls into branded research PDFs with compliance disclaimers.
            </Text>
          </View>
          <Pressable
            className="w-8 h-8 rounded-full bg-[#262930] items-center justify-center"
            onPress={onClose}
            hitSlop={8}
          >
            <Ionicons name="close" size={18} color="#CBD5E1" />
          </Pressable>
        </View>

        {/* Action Header Buttons: Start Bot & Refresh Status */}
        <View className="flex-row items-center gap-2 px-4 py-3 border-b border-[#262930] bg-[#111317]">
          <Pressable
            className="flex-1 flex-row items-center justify-center gap-1.5 bg-[#0084FF] py-2.5 rounded-xl active:opacity-80"
            onPress={handleStartBot}
          >
            <Ionicons name="paper-plane" size={14} color="#FFFFFF" />
            <Text className="text-xs font-bold text-white">Start Bot</Text>
            <Ionicons name="open-outline" size={13} color="rgba(255,255,255,0.8)" />
          </Pressable>

          <Pressable
            className="flex-1 flex-row items-center justify-center gap-1.5 bg-[#181A1F] border border-[#262930] py-2.5 rounded-xl active:bg-[#262930]"
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
        <View className="flex-row gap-2 px-4 py-3 border-b border-[#262930] bg-[#0B0D10]">
          <View className="flex-1 bg-[#181A1F] border border-[#262930] p-2.5 rounded-xl">
            <View className="flex-row items-center gap-1.5 mb-1">
              <View className="w-5 h-5 rounded-full bg-emerald-500/10 items-center justify-center">
                <Ionicons name="radio-outline" size={11} color="#10B981" />
              </View>
              <Text className="text-[10px] font-bold text-slate-400 tracking-wider">BOT DM</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View className={`w-1.5 h-1.5 rounded-full ${isDmConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <Text className="text-xs font-bold text-white">
                {isDmConnected ? 'Connected' : 'Offline'}
              </Text>
            </View>
          </View>

          <View className="flex-1 bg-[#181A1F] border border-[#262930] p-2.5 rounded-xl">
            <View className="flex-row items-center gap-1.5 mb-1">
              <View className="w-5 h-5 rounded-full bg-[#0084FF]/10 items-center justify-center">
                <Ionicons name="megaphone-outline" size={11} color="#0084FF" />
              </View>
              <Text className="text-[10px] font-bold text-slate-400 tracking-wider">CHANNELS</Text>
            </View>
            <Text className="text-xs font-bold text-white">
              {channelsCount} Active
            </Text>
          </View>

          <View className="flex-1 bg-[#181A1F] border border-[#262930] p-2.5 rounded-xl">
            <View className="flex-row items-center gap-1.5 mb-1">
              <View className="w-5 h-5 rounded-full bg-purple-500/10 items-center justify-center">
                <Ionicons name="document-text-outline" size={11} color="#8B5CF6" />
              </View>
              <Text className="text-[10px] font-bold text-slate-400 tracking-wider">REPORTS</Text>
            </View>
            <Text className="text-xs font-bold text-white">
              {reportsCount} Generated
            </Text>
          </View>
        </View>

        {/* 3-Segment Tab Bar */}
        <View className="px-4 py-2 border-b border-[#262930] bg-[#111317]">
          <View className="flex-row bg-[#181A1F] p-1 rounded-xl border border-[#262930]">
            <Pressable
              className={`flex-1 flex-row items-center justify-center py-2 rounded-lg ${activeTab === 'profile' ? 'bg-[#0084FF]' : ''}`}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('profile');
              }}
            >
              <Ionicons
                name="person-outline"
                size={13}
                color={activeTab === 'profile' ? '#FFFFFF' : '#94A3B8'}
                style={{ marginRight: 4 }}
              />
              <Text className={`text-xs font-bold ${activeTab === 'profile' ? 'text-white' : 'text-slate-400'}`}>
                Brand Profile
              </Text>
            </Pressable>

            <Pressable
              className={`flex-1 flex-row items-center justify-center py-2 rounded-lg ${activeTab === 'channels' ? 'bg-[#0084FF]' : ''}`}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('channels');
              }}
            >
              <Ionicons
                name="megaphone-outline"
                size={13}
                color={activeTab === 'channels' ? '#FFFFFF' : '#94A3B8'}
                style={{ marginRight: 4 }}
              />
              <Text className={`text-xs font-bold ${activeTab === 'channels' ? 'text-white' : 'text-slate-400'}`}>
                Channels ({channelsCount})
              </Text>
            </Pressable>

            <Pressable
              className={`flex-1 flex-row items-center justify-center py-2 rounded-lg ${activeTab === 'archive' ? 'bg-[#0084FF]' : ''}`}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('archive');
              }}
            >
              <Ionicons
                name="folder-outline"
                size={13}
                color={activeTab === 'archive' ? '#FFFFFF' : '#94A3B8'}
                style={{ marginRight: 4 }}
              />
              <Text className={`text-xs font-bold ${activeTab === 'archive' ? 'text-white' : 'text-slate-400'}`}>
                Archive ({reportsCount})
              </Text>
            </Pressable>
          </View>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="p-4 pb-20" showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View className="items-center justify-center py-16">
              <ActivityIndicator size="large" color="#0084FF" />
              <Text className="text-sm font-semibold text-slate-400 mt-3">
                Loading SEBI Report Bot Suite...
              </Text>
            </View>
          ) : (
            <>
              {/* TAB 1: BRAND PROFILE FORM & PDF PREVIEW */}
              {activeTab === 'profile' && (
                <>
                  {/* SEBI Brand Profile Card Header */}
                  <View className="bg-[#181A1F] border border-[#262930] rounded-2xl p-4 mb-4">
                    <View className="flex-row justify-between items-center mb-4">
                      <View className="flex-1 mr-2">
                        <Text className="text-base font-bold text-white">
                          SEBI Brand Profile
                        </Text>
                        <Text className="text-xs text-slate-400">
                          These details appear on every generated research PDF.
                        </Text>
                      </View>
                      <Pressable
                        className="flex-row items-center gap-1.5 bg-[#0084FF] px-3.5 py-2 rounded-xl active:opacity-80"
                        onPress={handleSave}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons name="save-outline" size={14} color="#FFFFFF" />
                            <Text className="text-xs font-bold text-white">Save Settings</Text>
                          </>
                        )}
                      </Pressable>
                    </View>

                    {/* SECTION 1: IDENTITY (REQUIRED) */}
                    <View className="flex-row items-center gap-2 mb-1">
                      <View className="flex-row items-center gap-1 bg-[#0084FF]/10 px-2 py-0.5 rounded-full border border-[#0084FF]/20">
                        <Ionicons name="shield-checkmark-outline" size={11} color="#0084FF" />
                        <Text className="text-[10px] font-bold text-[#0084FF]">REQUIRED</Text>
                      </View>
                      <Text className="text-sm font-bold text-white">Identity & Registration</Text>
                    </View>
                    <Text className="text-xs text-slate-400 mb-3">Mandatory details for official SEBI report header formatting.</Text>

                    <View className="flex-row gap-2 mb-3">
                      <View className="flex-1">
                        <Text className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">Advisory Firm *</Text>
                        <TextInput
                          className="bg-[#111317] border border-[#262930] rounded-xl px-3 py-2.5 text-xs text-white"
                          value={advisoryFirm}
                          onChangeText={setAdvisoryFirm}
                          placeholder="Advisory Firm Name"
                          placeholderTextColor="#64748B"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">Research Analyst *</Text>
                        <TextInput
                          className="bg-[#111317] border border-[#262930] rounded-xl px-3 py-2.5 text-xs text-white"
                          value={researchAnalyst}
                          onChangeText={setResearchAnalyst}
                          placeholder="Analyst Name"
                          placeholderTextColor="#64748B"
                        />
                      </View>
                    </View>

                    <View className="flex-row gap-2 mb-4">
                      <View className="flex-1">
                        <Text className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">SEBI Registration *</Text>
                        <TextInput
                          className="bg-[#111317] border border-[#262930] rounded-xl px-3 py-2.5 text-xs text-white"
                          value={sebiRegistration}
                          onChangeText={setSebiRegistration}
                          placeholder="INH010600090"
                          placeholderTextColor="#64748B"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">Website</Text>
                        <TextInput
                          className="bg-[#111317] border border-[#262930] rounded-xl px-3 py-2.5 text-xs text-white"
                          value={website}
                          onChangeText={setWebsite}
                          placeholder="getaipilot.com"
                          placeholderTextColor="#64748B"
                          autoCapitalize="none"
                        />
                      </View>
                    </View>

                    {/* SECTION 2: CONTACT (OPTIONAL) */}
                    <View className="flex-row items-center gap-2 mb-1 pt-2 border-t border-[#262930]">
                      <View className="flex-row items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                        <Ionicons name="mail-outline" size={11} color="#94A3B8" />
                        <Text className="text-[10px] font-bold text-slate-400">CONTACT</Text>
                      </View>
                      <Text className="text-sm font-bold text-white">Contact & Location</Text>
                    </View>
                    <Text className="text-xs text-slate-400 mb-3">Optional details rendered in PDF footer and compliance page.</Text>

                    <View className="mb-3">
                      <Text className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">Email</Text>
                      <TextInput
                        className="bg-[#111317] border border-[#262930] rounded-xl px-3 py-2.5 text-xs text-white"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="research@example.com"
                        placeholderTextColor="#64748B"
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>

                    <View className="mb-4">
                      <Text className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">Location / Office Address (Optional)</Text>
                      <TextInput
                        className="bg-[#111317] border border-[#262930] rounded-xl px-3 py-2.5 text-xs text-white"
                        value={officeAddress}
                        onChangeText={setOfficeAddress}
                        placeholder="e.g. Kallam, Latur, Maharashtra"
                        placeholderTextColor="#64748B"
                      />
                    </View>

                    {/* SECTION 3: REPORT ASSETS & CLICKABLE LOGO UPLOAD */}
                    <View className="flex-row items-center gap-2 mb-1 pt-2 border-t border-[#262930]">
                      <View className="flex-row items-center gap-1 bg-[#0084FF]/10 px-2 py-0.5 rounded-full border border-[#0084FF]/20">
                        <Ionicons name="image-outline" size={11} color="#0084FF" />
                        <Text className="text-[10px] font-bold text-[#0084FF]">BRAND ASSETS</Text>
                      </View>
                      <Text className="text-sm font-bold text-white">Brand Logo & First Page</Text>
                    </View>
                    <Text className="text-xs text-slate-400 mb-3">Logo and page 1 risk language are embedded in every generated PDF.</Text>

                    <View className="flex-row gap-2 mb-4">
                      {/* Interactive Pressable Logo Box */}
                      <Pressable
                        className="w-28 h-28 rounded-2xl bg-[#111317] border border-dashed border-[#262930] items-center justify-center p-2 active:opacity-80"
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setIsLogoModalOpen(true);
                        }}
                      >
                        {logoUrl ? (
                          <View className="w-full h-full items-center justify-center relative">
                            <Image source={{ uri: logoUrl }} className="w-full h-full rounded-xl" resizeMode="contain" />
                            <View className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded flex-row items-center gap-1">
                              <Ionicons name="create-outline" size={9} color="#FFFFFF" />
                              <Text className="text-[9px] font-bold text-white">Edit</Text>
                            </View>
                          </View>
                        ) : (
                          <>
                            <Ionicons name="cloud-upload-outline" size={24} color="#0084FF" />
                            <Text className="text-[10px] font-bold text-slate-300 mt-1">Brand Logo</Text>
                            <View className="mt-1 flex-row items-center bg-[#0084FF]/10 px-2 py-0.5 rounded border border-[#0084FF]/20">
                              <Ionicons name="add" size={10} color="#0084FF" />
                              <Text className="text-[9px] font-bold text-[#0084FF]">Upload</Text>
                            </View>
                          </>
                        )}
                      </Pressable>

                      <View className="flex-1">
                        <Text className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">Page 1 Risk Disclaimer</Text>
                        <TextInput
                          className="bg-[#111317] border border-[#262930] rounded-xl px-3 py-2 text-xs text-white h-28"
                          multiline
                          textAlignVertical="top"
                          value={page1Disclaimer}
                          onChangeText={setPage1Disclaimer}
                          placeholder="Add short SEBI/risk disclaimer for the first page..."
                          placeholderTextColor="#64748B"
                        />
                      </View>
                    </View>

                    {/* SECTION 4: OPTIONAL PAGES */}
                    <View className="flex-row items-center gap-2 mb-1 pt-2 border-t border-[#262930]">
                      <View className="flex-row items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        <Ionicons name="documents-outline" size={11} color="#F59E0B" />
                        <Text className="text-[10px] font-bold text-amber-400">DISCLOSURES</Text>
                      </View>
                      <Text className="text-sm font-bold text-white">Optional Extra Pages</Text>
                    </View>
                    <Text className="text-xs text-slate-400 mb-3">
                      Add disclosure or policy sections appended after the main recommendation page.
                    </Text>

                    <View className="mb-3">
                      <Text className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">Page 2 Disclosure</Text>
                      <TextInput
                        className="bg-[#111317] border border-[#262930] rounded-xl px-3 py-2 text-xs text-white h-16"
                        multiline
                        textAlignVertical="top"
                        value={page2Disclosure}
                        onChangeText={setPage2Disclosure}
                        placeholder="Optional regulatory disclosure content."
                        placeholderTextColor="#64748B"
                      />
                    </View>

                    <View className="mb-3">
                      <Text className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">Page 3 Conflicts of Interest</Text>
                      <TextInput
                        className="bg-[#111317] border border-[#262930] rounded-xl px-3 py-2 text-xs text-white h-16"
                        multiline
                        textAlignVertical="top"
                        value={page3Conflicts}
                        onChangeText={setPage3Conflicts}
                        placeholder="Optional conflict of interest statement."
                        placeholderTextColor="#64748B"
                      />
                    </View>

                    <View className="mb-1">
                      <Text className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">Page 4 Risk & Execution Policy</Text>
                      <TextInput
                        className="bg-[#111317] border border-[#262930] rounded-xl px-3 py-2 text-xs text-white h-16"
                        multiline
                        textAlignVertical="top"
                        value={page4Policy}
                        onChangeText={setPage4Policy}
                        placeholder="Optional risk policy content."
                        placeholderTextColor="#64748B"
                      />
                    </View>
                  </View>

                  {/* 🌟 PDF PREVIEW CARD */}
                  <View className="bg-[#181A1F] border border-[#262930] rounded-2xl p-4">
                    <View className="flex-row justify-between items-center mb-3">
                      <View className="flex-1">
                        <Text className="text-base font-bold text-white">
                          PDF Preview
                        </Text>
                        <Text className="text-xs text-slate-400">Live snapshot rendered from your SEBI brand settings.</Text>
                      </View>
                      <View className="flex-row items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <Text className="text-[10px] font-bold text-emerald-400">Live Synced</Text>
                      </View>
                    </View>

                    {/* Rendered Sample PDF Sheet View */}
                    <View className="bg-[#111317] border border-[#262930] rounded-xl p-3.5 mb-3">
                      {/* PDF Header with Avatar / Logo & SEBI Registration */}
                      <View className="flex-row items-center gap-2.5 mb-3">
                        {logoUrl ? (
                          <Image source={{ uri: logoUrl }} className="w-10 h-10 rounded-lg" resizeMode="contain" />
                        ) : (
                          <View className="w-10 h-10 rounded-lg bg-[#0084FF] items-center justify-center">
                            <Text className="text-base font-extrabold text-white">
                              {advisoryFirm ? advisoryFirm.charAt(0).toUpperCase() : 'N'}
                            </Text>
                          </View>
                        )}
                        <View className="flex-1">
                          <Text className="text-sm font-bold text-white" numberOfLines={1}>
                            {advisoryFirm || 'No Brand'}
                          </Text>
                          <Text className="text-[11px] text-slate-400">
                            {researchAnalyst || 'SEBI'} • Reg: {sebiRegistration || 'INH010600090'}
                          </Text>
                        </View>
                      </View>

                      {/* Trade Recommendation Badge Banner */}
                      <View className="flex-row items-center gap-2 bg-[#0084FF] px-3 py-2 rounded-lg mb-3">
                        <Ionicons name="trending-up" size={14} color="#FFFFFF" />
                        <Text className="text-xs font-extrabold text-white">
                          BUY RECOMMENDATION : NIFTY 24000 CE
                        </Text>
                      </View>

                      {/* 3 Call Metrics: Entry, Target, Stop Loss */}
                      <View className="flex-row gap-2 mb-3">
                        <View className="flex-1 bg-[#181A1F] border border-[#262930] p-2 rounded-lg">
                          <Text className="text-[9px] font-bold text-slate-400 uppercase">ENTRY</Text>
                          <Text className="text-xs font-bold text-white">Rs 150</Text>
                        </View>
                        <View className="flex-1 bg-[#181A1F] border border-[#262930] p-2 rounded-lg">
                          <Text className="text-[9px] font-bold text-slate-400 uppercase">TARGET</Text>
                          <Text className="text-xs font-bold text-emerald-400">Rs 200</Text>
                        </View>
                        <View className="flex-1 bg-[#181A1F] border border-[#262930] p-2 rounded-lg">
                          <Text className="text-[9px] font-bold text-slate-400 uppercase">STOP LOSS</Text>
                          <Text className="text-xs font-bold text-rose-400">Rs 120</Text>
                        </View>
                      </View>

                      {/* Disclaimer Snippet */}
                      <Text className="text-[10px] text-slate-400 mb-2 leading-relaxed" numberOfLines={2}>
                        {page1Disclaimer || 'Investment in securities market are subject to market risks. Read all related documents carefully.'}
                      </Text>

                      <View className="flex-row justify-between items-center pt-2 border-t border-[#262930]">
                        <Text className="text-[10px] text-slate-500">
                          {[true, !!page2Disclosure, !!page3Conflicts, !!page4Policy].filter(Boolean).length} pages configured
                        </Text>
                        <Text className="text-[10px] font-bold text-[#0084FF]">Powered by GAP SEBI Engine</Text>
                      </View>
                    </View>

                    {/* Preview CTA Button - Opens Full Interactive PDF Previewer */}
                    <Pressable
                      className="flex-row items-center justify-center gap-2 bg-[#0084FF] py-3 rounded-xl active:opacity-80"
                      onPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        setIsPdfPreviewOpen(true);
                      }}
                    >
                      <Ionicons name="eye-outline" size={16} color="#FFFFFF" />
                      <Text className="text-xs font-bold text-white">Preview Full PDF</Text>
                    </Pressable>
                  </View>
                </>
              )}

              {/* TAB 2: CHANNELS */}
              {activeTab === 'channels' && (
                <View className="bg-[#181A1F] border border-[#262930] rounded-2xl p-4">
                  <View className="mb-4">
                    <Text className="text-base font-bold text-white">
                      Connected Trading Channels
                    </Text>
                    <Text className="text-xs text-slate-400">
                      Channels where @ResearchReport233_bot listens and generates compliance PDFs.
                    </Text>
                  </View>

                  {(dashboard?.channels || []).length === 0 ? (
                    <View className="items-center justify-center py-10">
                      <View className="w-14 h-14 rounded-full bg-[#0084FF]/10 items-center justify-center mb-3">
                        <Ionicons name="radio-outline" size={28} color="#0084FF" />
                      </View>
                      <Text className="text-sm font-bold text-white text-center mb-1">
                        No Channels Connected Yet
                      </Text>
                      <Text className="text-xs text-slate-400 text-center px-4 leading-relaxed mb-4">
                        Add @ResearchReport233_bot as an Admin to your Telegram trading channel to begin auto-converting calls into branded PDFs.
                      </Text>
                      <Pressable className="flex-row items-center gap-1.5 bg-[#0084FF] px-4 py-2.5 rounded-xl active:opacity-80" onPress={handleStartBot}>
                        <Ionicons name="add" size={15} color="#FFFFFF" />
                        <Text className="text-xs font-bold text-white">Connect Channel in Telegram</Text>
                      </Pressable>
                    </View>
                  ) : (
                    (dashboard?.channels || []).map((ch, idx) => (
                      <View key={`ch_${ch.id || idx}`} className="flex-row items-center gap-3 bg-[#111317] border border-[#262930] p-3 rounded-xl mb-2">
                        <View className="w-8 h-8 rounded-lg bg-[#0084FF]/10 items-center justify-center">
                          <Ionicons name="megaphone" size={16} color="#0084FF" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-xs font-bold text-white">
                            {ch.name}
                          </Text>
                          <View className="flex-row items-center gap-1 mt-0.5">
                            <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <Text className="text-[10px] text-emerald-400">Active Listener</Text>
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
                <View className="bg-[#181A1F] border border-[#262930] rounded-2xl p-4">
                  <View className="mb-4">
                    <Text className="text-base font-bold text-white">
                      Generated Reports Archive
                    </Text>
                    <Text className="text-xs text-slate-400">
                      Complete compliance history of all generated research PDFs.
                    </Text>
                  </View>

                  {(dashboard?.reports || []).length === 0 ? (
                    <View className="items-center justify-center py-10">
                      <View className="w-14 h-14 rounded-full bg-rose-500/10 items-center justify-center mb-3">
                        <Ionicons name="document-text-outline" size={28} color="#EF4444" />
                      </View>
                      <Text className="text-sm font-bold text-white text-center mb-1">
                        No Reports Generated Yet
                      </Text>
                      <Text className="text-xs text-slate-400 text-center px-4 leading-relaxed">
                        When you post trading calls in your connected channels, formatted SEBI compliance PDFs will automatically appear here.
                      </Text>
                    </View>
                  ) : (
                    (dashboard?.reports || []).map((rep) => (
                      <View key={rep.id} className="flex-row items-center gap-3 bg-[#111317] border border-[#262930] p-3 rounded-xl mb-2">
                        <View className="w-8 h-8 rounded-lg bg-rose-500/10 items-center justify-center">
                          <Ionicons name="document-text" size={16} color="#EF4444" />
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center justify-between gap-1 mb-0.5">
                            <Text className="text-xs font-bold text-white flex-1" numberOfLines={1}>
                              {rep.title}
                            </Text>
                            <View className="bg-[#262930] px-1.5 py-0.5 rounded">
                              <Text className="text-[9px] font-bold text-slate-300">{rep.callType}</Text>
                            </View>
                          </View>
                          <Text className="text-[10px] text-slate-400">
                            Entry: {rep.entry} • Target: {rep.target} • SL: {rep.stopLoss}
                          </Text>
                        </View>
                        <Pressable
                          className="w-8 h-8 rounded-lg bg-[#0084FF]/10 items-center justify-center active:bg-[#0084FF]/20"
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
          <View className="flex-1 bg-black/70 justify-center items-center p-4">
            <View className="bg-[#181A1F] border border-[#262930] rounded-2xl w-full max-w-sm p-4">
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-1 mr-2">
                  <Text className="text-base font-bold text-white">Upload Brand Logo</Text>
                  <Text className="text-xs text-slate-400">Choose from gallery, snap a photo, or paste a URL.</Text>
                </View>
                <Pressable onPress={() => setIsLogoModalOpen(false)} className="w-7 h-7 rounded-full bg-[#262930] items-center justify-center">
                  <Ionicons name="close" size={16} color="#FFFFFF" />
                </Pressable>
              </View>

              {/* PRIMARY NATIVE ACTIONS: GALLERY & CAMERA */}
              <View className="flex-row gap-2 mb-4">
                <Pressable
                  className="flex-1 flex-row items-center justify-center gap-2 bg-[#0084FF] py-3 px-2 rounded-xl active:opacity-80"
                  onPress={handlePickFromGallery}
                  disabled={isPickingImage}
                >
                  {isPickingImage ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="images" size={18} color="#FFFFFF" />
                      <View>
                        <Text className="text-xs font-bold text-white">Gallery</Text>
                        <Text className="text-[9px] text-white/80">Photo library</Text>
                      </View>
                    </>
                  )}
                </Pressable>

                <Pressable
                  className="flex-1 flex-row items-center justify-center gap-2 bg-[#111317] border border-[#262930] py-3 px-2 rounded-xl active:bg-[#262930]"
                  onPress={handleTakeCameraPhoto}
                  disabled={isPickingImage}
                >
                  <Ionicons name="camera" size={18} color="#0084FF" />
                  <View>
                    <Text className="text-xs font-bold text-white">Camera</Text>
                    <Text className="text-[9px] text-slate-400">Snap photo</Text>
                  </View>
                </Pressable>
              </View>

              {/* Custom Image URL Input */}
              <View className="mb-4">
                <Text className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">Or Paste Image URL</Text>
                <View className="flex-row gap-2">
                  <TextInput
                    className="flex-1 bg-[#111317] border border-[#262930] rounded-xl px-3 py-2 text-xs text-white"
                    placeholder="https://example.com/logo.png"
                    placeholderTextColor="#64748B"
                    value={customLogoInput}
                    onChangeText={setCustomLogoInput}
                    autoCapitalize="none"
                  />
                  <Pressable
                    className={`bg-[#0084FF] px-3.5 items-center justify-center rounded-xl ${!customLogoInput.trim() ? 'opacity-50' : 'active:opacity-80'}`}
                    onPress={() => {
                      if (customLogoInput.trim()) {
                        handleApplyLogoUrl(customLogoInput.trim());
                      }
                    }}
                    disabled={!customLogoInput.trim()}
                  >
                    <Text className="text-xs font-bold text-white">Apply</Text>
                  </Pressable>
                </View>
              </View>

              {/* Curated Presets Grid */}
              <Text className="text-[10px] font-bold text-slate-400 mb-1.5 tracking-wider uppercase">Or Choose a Brand Preset</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {LOGO_PRESETS.map((preset) => (
                  <Pressable
                    key={preset.name}
                    className={`flex-row items-center gap-2 bg-[#111317] border ${logoUrl === preset.url ? 'border-[#0084FF]' : 'border-[#262930]'} p-2 rounded-xl flex-1 min-w-[45%]`}
                    onPress={() => handleApplyLogoUrl(preset.url)}
                  >
                    <Image source={{ uri: preset.url }} className="w-6 h-6 rounded-md" resizeMode="cover" />
                    <Text className="text-xs font-semibold text-white flex-1" numberOfLines={1}>
                      {preset.name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Footer with Remove button */}
              {logoUrl && (
                <Pressable className="flex-row items-center justify-center gap-1.5 py-2" onPress={handleRemoveLogo}>
                  <Ionicons name="trash-outline" size={14} color="#EF4444" />
                  <Text className="text-xs font-semibold text-rose-500">Remove Current Logo</Text>
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
            <View className="flex-row items-center justify-between px-4 pt-12 pb-3 border-b border-[#262930] bg-[#181A1F]">
              <View className="flex-row items-center gap-2 flex-1 mr-2">
                <Pressable className="w-8 h-8 rounded-full bg-[#262930] items-center justify-center" onPress={() => setIsPdfPreviewOpen(false)}>
                  <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
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
                <Pressable className="w-8 h-8 rounded-lg bg-[#0084FF]/10 items-center justify-center" onPress={handleShareReport}>
                  <Ionicons name="share-outline" size={16} color="#0084FF" />
                </Pressable>
                <Pressable
                  className="flex-row items-center gap-1 bg-[#0084FF] px-3 py-1.5 rounded-lg active:opacity-80"
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    Alert.alert('PDF Ready', 'Report PDF is generated with high-res vector graphics and ready to broadcast.');
                  }}
                >
                  <Ionicons name="download-outline" size={14} color="#FFFFFF" />
                  <Text className="text-xs font-bold text-white">Save</Text>
                </Pressable>
              </View>
            </View>

            {/* Scrollable Multi-Page Document View */}
            <ScrollView
              className="flex-1"
              contentContainerClassName="p-4 pb-20"
              showsVerticalScrollIndicator={false}
            >
              {/* PAGE 1: TRADE RECOMMENDATION */}
              <View className="bg-[#181A1F] border border-[#262930] rounded-2xl p-4 mb-4 relative">
                <View className="absolute top-4 right-4 bg-[#262930] px-2 py-0.5 rounded-md">
                  <Text className="text-[10px] font-bold text-slate-300">
                    Page 1 of {[true, !!page2Disclosure, !!page3Conflicts, !!page4Policy].filter(Boolean).length}
                  </Text>
                </View>

                {/* Branded Header */}
                <View className="flex-row items-center gap-3 mb-4 pr-16">
                  {logoUrl ? (
                    <Image source={{ uri: logoUrl }} className="w-12 h-12 rounded-xl" resizeMode="contain" />
                  ) : (
                    <View className="w-12 h-12 rounded-xl bg-[#0084FF] items-center justify-center">
                      <Text className="text-lg font-extrabold text-white">{advisoryFirm ? advisoryFirm.charAt(0).toUpperCase() : 'N'}</Text>
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="text-base font-bold text-white">{advisoryFirm || 'No Brand'}</Text>
                    <Text className="text-[11px] text-slate-400">
                      Research Analyst: {researchAnalyst} • SEBI Reg: {sebiRegistration}
                    </Text>
                    <Text className="text-[11px] text-slate-400">
                      Web: {website} • Email: {email}
                    </Text>
                  </View>
                </View>

                <View className="h-px bg-[#262930] mb-4" />

                {/* Call Banner */}
                <View className="bg-[#111317] border border-[#262930] rounded-xl p-3 mb-4">
                  <Text className="text-[10px] font-bold text-[#0084FF] tracking-wider uppercase mb-0.5">INTRADAY OPTION CALL</Text>
                  <Text className="text-base font-extrabold text-white mb-1">BUY NIFTY 24000 CE</Text>
                  <Text className="text-[10px] text-slate-500">
                    Generated on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                </View>

                {/* Trade Matrix Table */}
                <View className="flex-row bg-[#111317] border border-[#262930] rounded-xl p-3 mb-4">
                  <View className="flex-1 items-center">
                    <Text className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mb-0.5">ENTRY RANGE</Text>
                    <Text className="text-xs font-extrabold text-white">Rs 150.00</Text>
                  </View>
                  <View className="flex-1 items-center border-x border-[#262930]">
                    <Text className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mb-0.5">TARGET</Text>
                    <Text className="text-xs font-extrabold text-emerald-400">Rs 200.00</Text>
                  </View>
                  <View className="flex-1 items-center">
                    <Text className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mb-0.5">STOP LOSS</Text>
                    <Text className="text-xs font-extrabold text-rose-400">Rs 120.00</Text>
                  </View>
                </View>

                {/* Rationale & Setup Section */}
                <View className="bg-[#111317] border border-[#262930] rounded-xl p-3 mb-4">
                  <Text className="text-xs font-bold text-white mb-1">Technical Setup & Rationale</Text>
                  <Text className="text-xs text-slate-300 leading-relaxed">
                    Nifty 24000 CE is exhibiting strong momentum above resistance with heavy open interest buildup. F&O PCR trend remains bullish with 1:1.67 risk-reward ratio.
                  </Text>
                </View>

                {/* Page 1 Mandatory SEBI Disclaimer */}
                <View className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
                  <Text className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">SEBI COMPLIANCE & RISK DISCLAIMER</Text>
                  <Text className="text-[11px] text-amber-200/80 leading-relaxed">
                    {page1Disclaimer || 'Investment in securities market are subject to market risks. Read all the related documents carefully before investing. Registration granted by SEBI and certification from NISM in no way guarantee performance.'}
                  </Text>
                </View>

                {/* Footer Stamp */}
                <View className="flex-row justify-between items-center pt-3 border-t border-[#262930]">
                  <Text className="text-[10px] text-slate-500">{officeAddress}</Text>
                  <Text className="text-[10px] font-bold text-[#0084FF]">GAP SEBI Report Bot Suite</Text>
                </View>
              </View>

              {/* PAGE 2: DISCLOSURES (IF CONFIGURED) */}
              {page2Disclosure ? (
                <View className="bg-[#181A1F] border border-[#262930] rounded-2xl p-4 mb-4 relative">
                  <View className="absolute top-4 right-4 bg-[#262930] px-2 py-0.5 rounded-md">
                    <Text className="text-[10px] font-bold text-slate-300">Page 2</Text>
                  </View>
                  <Text className="text-sm font-bold text-white mb-1">{advisoryFirm}</Text>
                  <Text className="text-xs font-semibold text-slate-400 mb-2">Regulatory Disclosures</Text>
                  <View className="h-px bg-[#262930] mb-3" />
                  <Text className="text-xs text-slate-300 leading-relaxed">{page2Disclosure}</Text>
                </View>
              ) : null}

              {/* PAGE 3: CONFLICTS (IF CONFIGURED) */}
              {page3Conflicts ? (
                <View className="bg-[#181A1F] border border-[#262930] rounded-2xl p-4 mb-4 relative">
                  <View className="absolute top-4 right-4 bg-[#262930] px-2 py-0.5 rounded-md">
                    <Text className="text-[10px] font-bold text-slate-300">Page 3</Text>
                  </View>
                  <Text className="text-sm font-bold text-white mb-1">{advisoryFirm}</Text>
                  <Text className="text-xs font-semibold text-slate-400 mb-2">Conflict of Interest Statement</Text>
                  <View className="h-px bg-[#262930] mb-3" />
                  <Text className="text-xs text-slate-300 leading-relaxed">{page3Conflicts}</Text>
                </View>
              ) : null}

              {/* PAGE 4: POLICY (IF CONFIGURED) */}
              {page4Policy ? (
                <View className="bg-[#181A1F] border border-[#262930] rounded-2xl p-4 relative">
                  <View className="absolute top-4 right-4 bg-[#262930] px-2 py-0.5 rounded-md">
                    <Text className="text-[10px] font-bold text-slate-300">Page 4</Text>
                  </View>
                  <Text className="text-sm font-bold text-white mb-1">{advisoryFirm}</Text>
                  <Text className="text-xs font-semibold text-slate-400 mb-2">Risk & Execution Policy</Text>
                  <View className="h-px bg-[#262930] mb-3" />
                  <Text className="text-xs text-slate-300 leading-relaxed">{page4Policy}</Text>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};
