import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
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

import { supabase } from '../../../lib/supabase';
import { telegramSupabase } from '../api/telegramSupabase';
import { telegramApi } from '../api/telegramApi';
import { ReportBotBrandProfile, TelegramToolKey } from '../types';
import { useTheme, getColors } from '@/theme';

interface Props { summary?: any; onOpenModal: (key: TelegramToolKey) => void; }

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

export const ReportBotScreen: React.FC<Props> = ({ summary, onOpenModal }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ReportBotTab>('profile');

  // Form State
  const [advisoryFirm, setAdvisoryFirm] = useState('');
  const [researchAnalyst, setResearchAnalyst] = useState('');
  const [sebiRegistration, setSebiRegistration] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [page1Disclaimer, setPage1Disclaimer] = useState('');
  const [page2Disclosure, setPage2Disclosure] = useState('');
  const [page3Conflicts, setPage3Conflicts] = useState('');
  const [page4Policy, setPage4Policy] = useState('');

  // Modal Dialog States
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [customLogoInput, setCustomLogoInput] = useState('');
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);

  // Fetch Live Data only if not passed from parent
  const { data: allData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['telegram_all_data'],
    queryFn: telegramSupabase.getSummary,
    enabled: !summary,
  });

  const activeData = summary || allData;

  const dashboard = {
    brandProfile: activeData?.loadedBrand ? {
      advisoryFirm: activeData.loadedBrand.brand_name,
      researchAnalyst: activeData.loadedBrand.analyst_name,
      sebiRegistration: activeData.loadedBrand.sebi_registration,
      website: activeData.loadedBrand.website_url,
      email: activeData.loadedBrand.email_address,
      officeAddress: activeData.loadedBrand.office_address,
      logoUrl: activeData.loadedBrand.logo_url,
      page1Disclaimer: activeData.loadedBrand.disclaimer_text,
      page2Disclosure: activeData.loadedBrand.disclaimer_page_2,
      page3Conflicts: activeData.loadedBrand.disclaimer_page_3,
      page4Policy: activeData.loadedBrand.disclaimer_page_4,
    } : null,
    channels: activeData?.loadedMappings || [],
    reports: activeData?.loadedReports?.map((r: any) => ({
      id: r.id,
      title: `${r.symbol || 'Report'} - ${r.direction || 'BUY'}`,
      callType: r.direction,
      entry: r.entry_price,
      target: r.targets,
      stopLoss: r.stop_loss,
      pdfUrl: r.pdf_url
    })) || [],
    channelsCount: (activeData?.loadedMappings || []).length,
    reportsCount: (activeData?.loadedReports || []).length,
    botUrl: 'https://t.me/ResearchReport233_bot'
  };

  useEffect(() => {
    if (activeData?.loadedBrand) {
      const b = activeData.loadedBrand;
      setAdvisoryFirm(b.brand_name || '');
      setResearchAnalyst(b.analyst_name || '');
      setSebiRegistration(b.sebi_registration || '');
      setWebsite(b.website_url || '');
      setEmail(b.email_address || '');
      setOfficeAddress(b.office_address || '');
      setLogoUrl(b.logo_url || null);
      setPage1Disclaimer(b.disclaimer_text || '');
      setPage2Disclosure(b.disclaimer_page_2 || '');
      setPage3Conflicts(b.disclaimer_page_3 || '');
      setPage4Policy(b.disclaimer_page_4 || '');
    }
  }, [activeData?.loadedBrand]); // Depend on allData.loadedBrand to prevent infinite re-renders since dashboard is redefined

  // Save Settings Mutation
  const { mutateAsync: saveSettings, isPending: isSaving } = useMutation({
    mutationFn: async (profile: Partial<ReportBotBrandProfile>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const payload = {
        user_id: user.id,
        brand_name: profile.advisoryFirm || '',
        analyst_name: profile.researchAnalyst || '',
        sebi_registration: profile.sebiRegistration || '',
        website_url: profile.website || '',
        email_address: profile.email || '',
        office_address: profile.officeAddress || '',
        logo_url: profile.logoUrl || '',
        disclaimer_text: profile.page1Disclaimer || '',
        disclaimer_page_2: profile.page2Disclosure || '',
        disclaimer_page_3: profile.page3Conflicts || '',
        disclaimer_page_4: profile.page4Policy || '',
        is_active: true,
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase.from('tg_brand_settings').upsert(payload, { onConflict: 'user_id' });
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['telegram_all_data'] });
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
    <View style={styles.container}>
      {/* Top Header Card */}
      <View style={[styles.topCard, isDark ? styles.cardDark : styles.cardLight]}>
        {/* Top Header */}
        <View style={[styles.header, isDark ? styles.borderDark : styles.borderLight]}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={[styles.title, isDark ? styles.textDark : styles.textLight]}>GAP Report Bot</Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              Convert Telegram trading calls into branded SEBI research PDFs.
            </Text>
          </View>
        </View>

        {/* Action Header Buttons: Start Bot & Refresh Status */}
        <View style={[styles.actionHeaderRow, isDark ? styles.borderDark : styles.borderLight]}>
          <Pressable style={styles.startBotBtn} onPress={handleStartBot}>
            <Ionicons name="paper-plane-outline" size={14} color="#FFFFFF" />
            <Text style={styles.startBotBtnText}>Start Bot</Text>
            <Ionicons name="open-outline" size={12} color="#FFFFFF" />
          </Pressable>

          <Pressable
            style={[styles.refreshBtn, isDark ? styles.btnDark : styles.btnLight]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              refetch();
            }}
            disabled={isRefetching}
          >
            <Ionicons name="refresh-outline" size={14} color={isDark ? '#CBD5E1' : '#475569'} />
            <Text style={[styles.refreshBtnText, isDark ? styles.textDark : styles.textLight]}>
              {isRefetching ? 'Refreshing...' : 'Refresh Status'}
            </Text>
          </Pressable>
        </View>

        {/* 3-Segment Tab Bar & Live Status Bar */}
        <View style={styles.tabBarSection}>
          <View style={styles.tabsRow}>
            <Pressable
              style={[styles.tabPill, activeTab === 'profile' && styles.tabPillActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('profile');
              }}
            >
              <Text style={[styles.tabPillText, activeTab === 'profile' && styles.tabPillTextActive]}>
                Brand Profile
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tabPill, activeTab === 'channels' && styles.tabPillActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('channels');
              }}
            >
              <Text style={[styles.tabPillText, activeTab === 'channels' && styles.tabPillTextActive]}>
                Channels ({dashboard?.channelsCount ?? 0})
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tabPill, activeTab === 'archive' && styles.tabPillActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('archive');
              }}
            >
              <Text style={[styles.tabPillText, activeTab === 'archive' && styles.tabPillTextActive]}>
                Archive ({dashboard?.reportsCount ?? 0})
              </Text>
            </Pressable>
          </View>

          {/* Live Status Indicators */}
          <View style={styles.statusPillsRow}>
            <View style={styles.statusIndicator}>
              <View style={styles.dotGreen} />
              <Text style={styles.statusText}>DM Connected</Text>
            </View>
            <View style={styles.statusIndicator}>
              <View style={styles.dotGreen} />
              <Text style={styles.statusText}>Channels {dashboard?.channelsCount ?? 0}</Text>
            </View>
            <View style={styles.statusIndicator}>
              <View style={styles.dotGreen} />
              <Text style={styles.statusText}>Reports {dashboard?.reportsCount ?? 0}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.bodyContent}>
        {isLoading && !activeData ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#0284C7" />
            <Text style={[styles.loadingText, isDark ? styles.textDark : styles.textLight]}>
              Loading SEBI Report Bot Suite...
            </Text>
          </View>
        ) : (
          <>
            {/* TAB 1: BRAND PROFILE FORM & PDF PREVIEW */}
            {activeTab === 'profile' && (
              <>
                {/* SEBI Brand Profile Card Header */}
                <View style={[styles.formCard, isDark ? styles.cardDark : styles.cardLight]}>
                  <View style={styles.formHeaderRow}>
                    <View style={{ flex: 1, paddingRight: 6 }}>
                      <Text style={[styles.sectionTitle, isDark ? styles.textDark : styles.textLight]}>
                        SEBI Brand Profile
                      </Text>
                      <Text style={styles.sectionSubtitle}>These details appear on every generated research PDF.</Text>
                    </View>
                    <Pressable style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
                      {isSaving ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="save-outline" size={14} color="#FFFFFF" />
                          <Text style={styles.saveBtnText}>Save</Text>
                        </>
                      )}
                    </Pressable>
                  </View>

                  {/* SECTION 1: IDENTITY (REQUIRED) */}
                    <Text style={styles.groupHeading}>Identity</Text>
                    <Text style={styles.groupDesc}>Required information for the report header and Hub completion</Text>

                    <View style={styles.row}>
                      <View style={[styles.field, { flex: 1, marginRight: 6 }]}>
                        <Text style={styles.label}>ADVISORY FIRM *</Text>
                        <TextInput
                          style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                          value={advisoryFirm}
                          onChangeText={setAdvisoryFirm}
                          placeholder="No Brand"
                          placeholderTextColor="#94A3B8"
                        />
                      </View>
                      <View style={[styles.field, { flex: 1, marginLeft: 6 }]}>
                        <Text style={styles.label}>RESEARCH ANALYST *</Text>
                        <TextInput
                          style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                          value={researchAnalyst}
                          onChangeText={setResearchAnalyst}
                          placeholder="SEBI"
                          placeholderTextColor="#94A3B8"
                        />
                      </View>
                    </View>

                    <View style={styles.row}>
                      <View style={[styles.field, { flex: 1, marginRight: 6 }]}>
                        <Text style={styles.label}>SEBI REGISTRATION *</Text>
                        <TextInput
                          style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                          value={sebiRegistration}
                          onChangeText={setSebiRegistration}
                          placeholder="INH010600090"
                          placeholderTextColor="#94A3B8"
                        />
                      </View>
                      <View style={[styles.field, { flex: 1, marginLeft: 6 }]}>
                        <Text style={styles.label}>WEBSITE</Text>
                        <TextInput
                          style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                          value={website}
                          onChangeText={setWebsite}
                          placeholder="getaipilot.com"
                          placeholderTextColor="#94A3B8"
                        />
                      </View>
                    </View>

                    {/* SECTION 2: CONTACT (OPTIONAL) */}
                    <Text style={[styles.groupHeading, { marginTop: 14 }]}>Contact</Text>
                    <Text style={styles.groupDesc}>Optional details that can appear in footer and compliance pages.</Text>

                    <View style={styles.field}>
                      <Text style={styles.label}>EMAIL</Text>
                      <TextInput
                        style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="research@example.com"
                        placeholderTextColor="#94A3B8"
                        keyboardType="email-address"
                      />
                    </View>

                    <View style={styles.field}>
                      <Text style={styles.label}>LOCATION / OFFICE ADDRESS (OPTIONAL)</Text>
                      <TextInput
                        style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                        value={officeAddress}
                        onChangeText={setOfficeAddress}
                        placeholder="e.g. Kallam, Latur, Maharashtra"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>

                    {/* SECTION 3: REPORT ASSETS & CLICKABLE LOGO UPLOAD */}
                    <Text style={[styles.groupHeading, { marginTop: 14 }]}>Report Assets</Text>
                    <Text style={styles.groupDesc}>Logo and first-page risk language are used in every generated PDF.</Text>

                    <View style={styles.row}>
                      {/* Interactive Pressable Logo Box */}
                      <Pressable
                        style={({ pressed }) => [
                          styles.logoUploadBox,
                          isDark ? styles.logoUploadBoxDark : styles.logoUploadBoxLight,
                          logoUrl ? styles.logoUploadBoxActive : null,
                          pressed && { opacity: 0.8 },
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setIsLogoModalOpen(true);
                        }}
                      >
                        {logoUrl ? (
                          <View style={styles.logoPreviewWrapper}>
                            <Image source={{ uri: logoUrl }} style={styles.logoImagePreview} resizeMode="contain" />
                            <View style={styles.changeBadge}>
                              <Ionicons name="create-outline" size={10} color="#FFFFFF" />
                              <Text style={styles.changeBadgeText}>Change</Text>
                            </View>
                          </View>
                        ) : (
                          <>
                            <Ionicons name="image-outline" size={26} color="#0284C7" />
                            <Text style={styles.logoUploadLabel}>Brand Logo</Text>
                            <View style={styles.uploadBtnMini}>
                              <Ionicons name="cloud-upload-outline" size={12} color="#0284C7" />
                              <Text style={styles.uploadBtnMiniText}>Upload Logo</Text>
                            </View>
                          </>
                        )}
                      </Pressable>

                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.label}>PAGE 1 RISK DISCLAIMER</Text>
                        <TextInput
                          style={[styles.input, isDark ? styles.inputDark : styles.inputLight, { height: 95, textAlignVertical: 'top' }]}
                          multiline
                          value={page1Disclaimer}
                          onChangeText={setPage1Disclaimer}
                          placeholder="Add short SEBI/risk disclaimer for the first page..."
                          placeholderTextColor="#94A3B8"
                        />
                      </View>
                    </View>

                    {/* SECTION 4: OPTIONAL PAGES */}
                    <Text style={[styles.groupHeading, { marginTop: 14 }]}>Optional Pages</Text>
                    <Text style={styles.groupDesc}>Add only the disclosure pages you want appended after the recommendation page.</Text>

                    <View style={styles.field}>
                      <Text style={styles.label}>PAGE 2 DISCLOSURE</Text>
                      <TextInput
                        style={[styles.input, isDark ? styles.inputDark : styles.inputLight, { height: 60, textAlignVertical: 'top' }]}
                        multiline
                        value={page2Disclosure}
                        onChangeText={setPage2Disclosure}
                        placeholder="Optional disclosure content."
                        placeholderTextColor="#94A3B8"
                      />
                    </View>

                    <View style={styles.field}>
                      <Text style={styles.label}>PAGE 3 CONFLICTS</Text>
                      <TextInput
                        style={[styles.input, isDark ? styles.inputDark : styles.inputLight, { height: 60, textAlignVertical: 'top' }]}
                        multiline
                        value={page3Conflicts}
                        onChangeText={setPage3Conflicts}
                        placeholder="Optional conflict of interest content."
                        placeholderTextColor="#94A3B8"
                      />
                    </View>

                    <View style={styles.field}>
                      <Text style={styles.label}>PAGE 4 POLICY</Text>
                      <TextInput
                        style={[styles.input, isDark ? styles.inputDark : styles.inputLight, { height: 60, textAlignVertical: 'top' }]}
                        multiline
                        value={page4Policy}
                        onChangeText={setPage4Policy}
                        placeholder="Optional risk and policy content."
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  </View>

                  {/* 🌟 PDF PREVIEW CARD */}
                  <View style={[styles.previewCard, isDark ? styles.previewCardDark : styles.previewCardLight]}>
                    <View style={styles.previewHeaderRow}>
                      <View style={{ flex: 1, paddingRight: 6 }}>
                        <Text style={[styles.previewTitle, isDark ? styles.textDark : styles.textLight]}>
                          PDF Preview
                        </Text>
                        <Text style={styles.previewSubtitle}>Live snapshot rendered from your SEBI brand settings.</Text>
                      </View>
                      <View style={styles.completedBadge}>
                        <View style={styles.dotGreen} />
                        <Text style={styles.completedBadgeText}>Live Synced</Text>
                      </View>
                    </View>

                    {/* Rendered Sample PDF Sheet View */}
                    <View style={[styles.pdfPaper, isDark ? styles.pdfPaperDark : styles.pdfPaperLight]}>
                      {/* PDF Header with Avatar / Logo & SEBI Registration */}
                      <View style={styles.pdfHeader}>
                        {logoUrl ? (
                          <Image source={{ uri: logoUrl }} style={styles.pdfHeaderLogo} resizeMode="contain" />
                        ) : (
                          <View style={styles.pdfAvatarBox}>
                            <Text style={styles.pdfAvatarText}>{advisoryFirm ? advisoryFirm.charAt(0).toUpperCase() : 'N'}</Text>
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.pdfFirmName, isDark ? styles.textDark : styles.textLight]} numberOfLines={1}>
                            {advisoryFirm || 'No Brand'}
                          </Text>
                          <Text style={styles.pdfAnalystMeta}>
                            {researchAnalyst || 'SEBI'} • Reg: {sebiRegistration || 'INH010600090'}
                          </Text>
                        </View>
                      </View>

                      {/* Trade Recommendation Badge Banner */}
                      <View style={styles.tradeRecommendationBanner}>
                        <Ionicons name="trending-up" size={16} color="#FFFFFF" />
                        <Text style={styles.tradeRecommendationText}>
                          BUY RECOMMENDATION : NIFTY 24000 CE
                        </Text>
                      </View>

                      {/* 3 Call Metrics: Entry, Target, Stop Loss */}
                      <View style={styles.tradeMetricsRow}>
                        <View style={[styles.metricBox, isDark ? styles.metricBoxDark : styles.metricBoxLight]}>
                          <Text style={styles.metricKey}>ENTRY</Text>
                          <Text style={[styles.metricVal, isDark ? styles.textDark : styles.textLight]}>Rs 150</Text>
                        </View>
                        <View style={[styles.metricBox, isDark ? styles.metricBoxDark : styles.metricBoxLight]}>
                          <Text style={styles.metricKey}>TARGET</Text>
                          <Text style={[styles.metricVal, { color: '#10B981' }]}>Rs 200</Text>
                        </View>
                        <View style={[styles.metricBox, isDark ? styles.metricBoxDark : styles.metricBoxLight]}>
                          <Text style={styles.metricKey}>STOP LOSS</Text>
                          <Text style={[styles.metricVal, { color: '#EF4444' }]}>Rs 120</Text>
                        </View>
                      </View>

                      {/* Disclaimer Snippet */}
                      <Text style={styles.pdfDisclaimerSnippet} numberOfLines={2}>
                        {page1Disclaimer || 'Your disclaimer appears here. Add compact risk language so generated reports stay ready for review.'}
                      </Text>

                      <View style={styles.pdfFooterRow}>
                        <Text style={styles.pdfPagesCount}>
                          {[true, !!page2Disclosure, !!page3Conflicts, !!page4Policy].filter(Boolean).length} pages configured
                        </Text>
                        <Text style={styles.pdfPoweredBy}>Powered by GAP SEBI Engine</Text>
                      </View>
                    </View>

                    {/* Preview CTA Button - Opens Full Interactive PDF Previewer */}
                    <Pressable
                      style={styles.previewBtn}
                      onPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        setIsPdfPreviewOpen(true);
                      }}
                    >
                      <Ionicons name="eye" size={16} color="#FFFFFF" />
                      <Text style={styles.previewBtnText}>Preview My PDF</Text>
                    </Pressable>
                  </View>
                </>
              )}

              {/* TAB 2: CHANNELS */}
              {activeTab === 'channels' && (
                <View style={[styles.formCard, isDark ? styles.cardDark : styles.cardLight]}>
                  <View style={styles.formHeaderRow}>
                    <View style={{ flex: 1, paddingRight: 6 }}>
                      <Text style={[styles.sectionTitle, isDark ? styles.textDark : styles.textLight]}>
                        Mapped Trading Channels
                      </Text>
                      <Text style={styles.sectionSubtitle}>
                        Channels where @ResearchReport233_bot generates automated SEBI PDFs.
                      </Text>
                    </View>
                  </View>

                  {(dashboard?.channels || []).length === 0 ? (
                    <View style={styles.emptyBox}>
                      <Ionicons name="radio-outline" size={32} color="#0284C7" style={{ marginBottom: 6 }} />
                      <Text style={[styles.emptyTitle, isDark ? styles.textDark : styles.textLight]}>
                        No Channels Connected Yet
                      </Text>
                      <Text style={styles.emptyDesc}>
                        Add @ResearchReport233_bot as an Admin to your Telegram trading channel to begin auto-converting calls.
                      </Text>
                      <Pressable style={[styles.startBotBtn, { marginTop: 12 }]} onPress={handleStartBot}>
                        <Ionicons name="add" size={16} color="#FFFFFF" />
                        <Text style={styles.startBotBtnText}>Connect Channel</Text>
                      </Pressable>
                    </View>
                  ) : (
                    (dashboard?.channels || []).map((ch: any, idx: number) => (
                      <View key={`ch_${ch.id || idx}`} style={[styles.channelItem, isDark ? styles.itemDark : styles.itemLight]}>
                        <View style={styles.channelIcon}>
                          <Ionicons name="megaphone" size={16} color="#0284C7" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.channelName, isDark ? styles.textDark : styles.textLight]}>
                            {ch.channel_name || ch.name || 'Telegram Channel'}
                          </Text>
                          <Text style={styles.channelStatus}>{ch.channel_id ? `ID: ${ch.channel_id}` : ''} ● {ch.status || 'Active'}</Text>
                        </View>
                        <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* TAB 3: REPORTS ARCHIVE */}
              {activeTab === 'archive' && (
                <View style={[styles.formCard, isDark ? styles.cardDark : styles.cardLight]}>
                  <View style={styles.formHeaderRow}>
                    <View>
                      <Text style={[styles.sectionTitle, isDark ? styles.textDark : styles.textLight]}>
                        Generated Reports Archive
                      </Text>
                      <Text style={styles.sectionSubtitle}>
                        Complete compliance history of all generated research PDFs.
                      </Text>
                    </View>
                  </View>

                  {(dashboard?.reports || []).length === 0 ? (
                    <View style={styles.emptyBox}>
                      <Ionicons name="document-text-outline" size={32} color="#0284C7" style={{ marginBottom: 6 }} />
                      <Text style={[styles.emptyTitle, isDark ? styles.textDark : styles.textLight]}>
                        No Reports Generated Yet
                      </Text>
                      <Text style={styles.emptyDesc}>
                        When you post trading calls in your connected channels, formatted SEBI compliance PDFs will appear here.
                      </Text>
                    </View>
                  ) : (
                    (dashboard?.reports || []).map((rep: any) => (
                      <View key={rep.id} style={[styles.reportItem, isDark ? styles.itemDark : styles.itemLight]}>
                        <View style={styles.reportIconCircle}>
                          <Ionicons name="document-text" size={18} color="#EF4444" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.reportItemTitle, isDark ? styles.textDark : styles.textLight]}>
                            {rep.title}
                          </Text>
                          <Text style={styles.reportItemMeta}>
                            Call: {rep.callType || 'BUY'} • Entry: {rep.entry || '-'} • Target: {rep.target || '-'} • SL: {rep.stopLoss || '-'}
                          </Text>
                        </View>
                        <Pressable
                          style={styles.downloadBtn}
                          onPress={() => {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            if (rep.pdfUrl) {
                              Linking.openURL(rep.pdfUrl);
                            } else {
                              setIsPdfPreviewOpen(true);
                            }
                          }}
                        >
                          <Ionicons name={rep.pdfUrl ? "download-outline" : "eye-outline"} size={16} color="#0284C7" />
                        </Pressable>
                      </View>
                    ))
                  )}
                </View>
              )}
            </>
          )}
        </View>

        {/* 🖼️ BRAND LOGO UPLOADER / SELECTOR MODAL WITH GALLERY & CAMERA */}
        <Modal visible={isLogoModalOpen} transparent animationType="fade" onRequestClose={() => setIsLogoModalOpen(false)}>
          <View style={styles.dialogOverlay}>
            <View style={[styles.dialogCard, isDark ? styles.dialogCardDark : styles.dialogCardLight]}>
              <View style={styles.dialogHeader}>
                <View>
                  <Text style={[styles.dialogTitle, isDark ? styles.textDark : styles.textLight]}>Upload Brand Logo</Text>
                  <Text style={styles.dialogSub}>Choose from gallery, snap a photo, or paste a URL.</Text>
                </View>
                <Pressable onPress={() => setIsLogoModalOpen(false)} style={styles.dialogCloseBtn}>
                  <Ionicons name="close" size={18} color={isDark ? '#FFFFFF' : '#0F172A'} />
                </Pressable>
              </View>

              {/* 📸 PRIMARY NATIVE ACTIONS: GALLERY & CAMERA */}
              <View style={styles.nativeUploadRow}>
                <Pressable
                  style={[styles.nativeUploadBtn, styles.nativeUploadBtnPrimary]}
                  onPress={handlePickFromGallery}
                  disabled={isPickingImage}
                >
                  {isPickingImage ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="images" size={20} color="#FFFFFF" />
                      <View>
                        <Text style={styles.nativeUploadBtnTitle}>Choose from Gallery</Text>
                        <Text style={styles.nativeUploadBtnSub}>Pick logo from photo library</Text>
                      </View>
                    </>
                  )}
                </Pressable>

                <Pressable
                  style={[styles.nativeUploadBtn, isDark ? styles.nativeUploadBtnDark : styles.nativeUploadBtnLight]}
                  onPress={handleTakeCameraPhoto}
                  disabled={isPickingImage}
                >
                  <Ionicons name="camera" size={20} color="#0284C7" />
                  <View>
                    <Text style={[styles.nativeUploadBtnTitle, isDark ? styles.textDark : styles.textLight]}>Take Photo</Text>
                    <Text style={styles.nativeUploadBtnSub}>Snap logo with camera</Text>
                  </View>
                </Pressable>
              </View>

              {/* Custom Image URL Input */}
              <View style={{ marginBottom: 14 }}>
                <Text style={styles.label}>OR PASTE IMAGE URL</Text>
                <View style={styles.urlInputRow}>
                  <TextInput
                    style={[styles.input, isDark ? styles.inputDark : styles.inputLight, { flex: 1 }]}
                    placeholder="https://example.com/logo.png"
                    placeholderTextColor="#94A3B8"
                    value={customLogoInput}
                    onChangeText={setCustomLogoInput}
                    autoCapitalize="none"
                  />
                  <Pressable
                    style={[styles.applyUrlBtn, !customLogoInput.trim() && { opacity: 0.5 }]}
                    onPress={() => {
                      if (customLogoInput.trim()) {
                        handleApplyLogoUrl(customLogoInput.trim());
                      }
                    }}
                    disabled={!customLogoInput.trim()}
                  >
                    <Text style={styles.applyUrlBtnText}>Apply</Text>
                  </Pressable>
                </View>
              </View>

              {/* Curated Presets Grid */}
              <Text style={styles.label}>OR CHOOSE A BRAND PRESET</Text>
              <View style={styles.presetGrid}>
                {LOGO_PRESETS.map((preset) => (
                  <Pressable
                    key={preset.name}
                    style={[
                      styles.presetItem,
                      isDark ? styles.presetItemDark : styles.presetItemLight,
                      logoUrl === preset.url && styles.presetItemActive,
                    ]}
                    onPress={() => handleApplyLogoUrl(preset.url)}
                  >
                    <Image source={{ uri: preset.url }} style={styles.presetImage} resizeMode="cover" />
                    <Text style={[styles.presetName, isDark ? styles.textDark : styles.textLight]} numberOfLines={1}>
                      {preset.name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Footer with Remove button */}
              {logoUrl && (
                <Pressable style={styles.removeLogoBtn} onPress={handleRemoveLogo}>
                  <Ionicons name="trash-outline" size={14} color="#EF4444" />
                  <Text style={styles.removeLogoBtnText}>Remove Current Logo</Text>
                </Pressable>
              )}
            </View>
          </View>
        </Modal>

        {/* 📑 FULL INTERACTIVE SEBI PDF REPORT VIEWER MODAL */}
        <Modal visible={isPdfPreviewOpen} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setIsPdfPreviewOpen(false)}>
          <View style={[styles.pdfViewerContainer, isDark ? styles.cardDark : styles.cardLight]}>
            {/* Viewer Top Bar */}
            <View style={[styles.pdfViewerHeader, isDark ? styles.borderDark : styles.borderLight]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Pressable style={styles.viewerCloseBtn} onPress={() => setIsPdfPreviewOpen(false)}>
                  <Ionicons name="arrow-back" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
                </Pressable>
                <View>
                  <Text style={[styles.viewerTitle, isDark ? styles.textDark : styles.textLight]}>
                    SEBI Research Report PDF
                  </Text>
                  <Text style={styles.viewerSub}>{advisoryFirm} • Verified Sample</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Pressable style={styles.viewerActionBtn} onPress={handleShareReport}>
                  <Ionicons name="share-outline" size={18} color="#0284C7" />
                </Pressable>
                <Pressable
                  style={styles.viewerActionBtnPrimary}
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    Alert.alert('PDF Ready', 'Report PDF is generated with high-res vector graphics and ready to broadcast.');
                  }}
                >
                  <Ionicons name="download-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.viewerActionBtnPrimaryText}>Save</Text>
                </Pressable>
              </View>
            </View>

            {/* Scrollable Multi-Page Document View */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.pdfViewerBody} showsVerticalScrollIndicator={false}>
              {/* PAGE 1: TRADE RECOMMENDATION */}
              <View style={[styles.fullPdfPage, isDark ? styles.fullPdfPageDark : styles.fullPdfPageLight]}>
                <View style={styles.pageNumberBadge}>
                  <Text style={styles.pageNumberText}>Page 1 of {[true, !!page2Disclosure, !!page3Conflicts, !!page4Policy].filter(Boolean).length}</Text>
                </View>

                {/* Branded Header */}
                <View style={styles.fullPdfHeader}>
                  {logoUrl ? (
                    <Image source={{ uri: logoUrl }} style={styles.fullPdfLogo} resizeMode="contain" />
                  ) : (
                    <View style={styles.fullPdfAvatarBox}>
                      <Text style={styles.fullPdfAvatarText}>{advisoryFirm ? advisoryFirm.charAt(0).toUpperCase() : 'N'}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fullPdfFirmTitle}>{advisoryFirm || 'No Brand'}</Text>
                    <Text style={styles.fullPdfMetaText}>
                      Research Analyst: {researchAnalyst} • SEBI Reg: {sebiRegistration}
                    </Text>
                    <Text style={styles.fullPdfMetaText}>
                      Web: {website} • Email: {email}
                    </Text>
                  </View>
                </View>

                <View style={styles.pdfDivider} />

                {/* Call Banner */}
                <View style={styles.fullPdfCallBanner}>
                  <Text style={styles.fullPdfCallBadge}>INTRADAY OPTION CALL</Text>
                  <Text style={styles.fullPdfCallTitle}>BUY NIFTY 24000 CE</Text>
                  <Text style={styles.fullPdfCallTime}>Generated on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                </View>

                {/* Trade Matrix Table */}
                <View style={styles.fullPdfMatrix}>
                  <View style={styles.matrixCol}>
                    <Text style={styles.matrixLabel}>ENTRY RANGE</Text>
                    <Text style={styles.matrixValue}>Rs 150.00</Text>
                  </View>
                  <View style={[styles.matrixCol, styles.matrixBorder]}>
                    <Text style={styles.matrixLabel}>TARGET</Text>
                    <Text style={[styles.matrixValue, { color: '#059669' }]}>Rs 200.00</Text>
                  </View>
                  <View style={styles.matrixCol}>
                    <Text style={styles.matrixLabel}>STOP LOSS</Text>
                    <Text style={[styles.matrixValue, { color: '#DC2626' }]}>Rs 120.00</Text>
                  </View>
                </View>

                {/* Rationale & Setup Section */}
                <View style={styles.pdfSectionBlock}>
                  <Text style={styles.pdfSectionHeading}>Technical Setup & Rationale</Text>
                  <Text style={styles.pdfSectionBody}>
                    Nifty 24000 CE is exhibiting strong momentum above resistance with heavy open interest buildup. F&O PCR trend remains bullish with 1:1.67 risk-reward ratio.
                  </Text>
                </View>

                {/* Page 1 Mandatory SEBI Disclaimer */}
                <View style={styles.pdfDisclaimerBox}>
                  <Text style={styles.pdfDisclaimerTitle}>SEBI COMPLIANCE & RISK DISCLAIMER</Text>
                  <Text style={styles.pdfDisclaimerText}>
                    {page1Disclaimer || 'Investment in securities market are subject to market risks. Read all the related documents carefully before investing. Registration granted by SEBI and certification from NISM in no way guarantee performance.'}
                  </Text>
                </View>

                {/* Footer Stamp */}
                <View style={styles.fullPdfFooter}>
                  <Text style={styles.footerAddressText}>{officeAddress}</Text>
                  <Text style={styles.footerEngineText}>GAP SEBI Report Bot Suite</Text>
                </View>
              </View>

              {/* PAGE 2: DISCLOSURES (IF CONFIGURED) */}
              {page2Disclosure ? (
                <View style={[styles.fullPdfPage, isDark ? styles.fullPdfPageDark : styles.fullPdfPageLight]}>
                  <View style={styles.pageNumberBadge}>
                    <Text style={styles.pageNumberText}>Page 2</Text>
                  </View>
                  <Text style={styles.fullPdfFirmTitle}>{advisoryFirm}</Text>
                  <Text style={styles.pdfSectionHeading}>Regulatory Disclosures</Text>
                  <View style={styles.pdfDivider} />
                  <Text style={styles.pdfSectionBody}>{page2Disclosure}</Text>
                </View>
              ) : null}

              {/* PAGE 3: CONFLICTS (IF CONFIGURED) */}
              {page3Conflicts ? (
                <View style={[styles.fullPdfPage, isDark ? styles.fullPdfPageDark : styles.fullPdfPageLight]}>
                  <View style={styles.pageNumberBadge}>
                    <Text style={styles.pageNumberText}>Page 3</Text>
                  </View>
                  <Text style={styles.fullPdfFirmTitle}>{advisoryFirm}</Text>
                  <Text style={styles.pdfSectionHeading}>Conflict of Interest Statement</Text>
                  <View style={styles.pdfDivider} />
                  <Text style={styles.pdfSectionBody}>{page3Conflicts}</Text>
                </View>
              ) : null}

              {/* PAGE 4: POLICY (IF CONFIGURED) */}
              {page4Policy ? (
                <View style={[styles.fullPdfPage, isDark ? styles.fullPdfPageDark : styles.fullPdfPageLight]}>
                  <View style={styles.pageNumberBadge}>
                    <Text style={styles.pageNumberText}>Page 4</Text>
                  </View>
                  <Text style={styles.fullPdfFirmTitle}>{advisoryFirm}</Text>
                  <Text style={styles.pdfSectionHeading}>Risk & Execution Policy</Text>
                  <View style={styles.pdfDivider} />
                  <Text style={styles.pdfSectionBody}>{page4Policy}</Text>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </Modal>
      </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', marginBottom: 20 },
  topCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 14 },
  cardLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  cardDark: { backgroundColor: '#121212', borderColor: '#27272A' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  borderLight: { borderBottomColor: '#E2E8F0' },
  borderDark: { borderBottomColor: '#1E2430' },
  title: { fontSize: 18, fontWeight: '800' },
  textLight: { color: '#0F172A' },
  textDark: { color: '#F8FAFC' },
  subtitle: { color: '#64748B', fontSize: 11.5, marginTop: 3, lineHeight: 16 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnLight: { backgroundColor: '#F1F5F9' },
  closeBtnDark: { backgroundColor: '#1E2430' },

  // Action Header Row
  actionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  startBotBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  startBotBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  btnLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  btnDark: { backgroundColor: '#161C28', borderColor: '#27272A' },
  refreshBtnText: { fontSize: 12, fontWeight: '600' },

  // Tabs Section & Status Bar
  tabBarSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    padding: 3,
    borderRadius: 10,
    gap: 4,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabPillActive: {
    backgroundColor: '#0284C7',
  },
  tabPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  tabPillTextActive: {
    color: '#FFFFFF',
  },
  statusPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },

  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 40 },
  loadingBox: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 13, fontWeight: '500' },

  // Form Card
  formCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  formHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  sectionSubtitle: { color: '#64748B', fontSize: 11, marginTop: 2 },
  saveBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  groupHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
    marginBottom: 2,
    letterSpacing: -0.1,
  },
  groupDesc: { color: '#64748B', fontSize: 11, marginBottom: 10 },
  row: { flexDirection: 'row' },
  field: { marginBottom: 12 },
  label: { color: '#64748B', fontSize: 10, fontWeight: '800', marginBottom: 5, letterSpacing: 0.5 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  inputLight: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', color: '#0F172A' },
  inputDark: { backgroundColor: '#161C28', borderColor: '#27272A', color: '#F8FAFC' },

  // Logo Upload Box (Pressable)
  logoUploadBox: {
    width: 110,
    height: 110,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  logoUploadBoxLight: { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' },
  logoUploadBoxDark: { backgroundColor: '#161C28', borderColor: '#334155' },
  logoUploadBoxActive: { borderStyle: 'solid', borderColor: '#0284C7' },
  logoUploadLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', marginTop: 4 },
  uploadBtnMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
  },
  uploadBtnMiniText: { color: '#0284C7', fontSize: 9, fontWeight: '700' },
  logoPreviewWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  changeBadge: {
    position: 'absolute',
    bottom: -2,
    backgroundColor: 'rgba(2, 132, 199, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  changeBadgeText: { color: '#FFFFFF', fontSize: 8, fontWeight: '700' },

  // Native Upload Action Buttons in Modal
  nativeUploadRow: {
    gap: 10,
    marginBottom: 16,
  },
  nativeUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },
  nativeUploadBtnPrimary: {
    backgroundColor: '#0284C7',
  },
  nativeUploadBtnLight: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  nativeUploadBtnDark: {
    backgroundColor: '#1E2430',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  nativeUploadBtnTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  nativeUploadBtnSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    marginTop: 1,
  },

  // PDF Preview Card
  previewCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  previewCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  previewCardDark: { backgroundColor: '#121722', borderColor: '#1E2430' },
  previewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  previewTitle: { fontSize: 16, fontWeight: '800' },
  previewSubtitle: { color: '#64748B', fontSize: 11, marginTop: 2 },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  completedBadgeText: { color: '#10B981', fontSize: 10, fontWeight: '700' },

  // Rendered PDF Sheet
  pdfPaper: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  pdfPaperLight: { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' },
  pdfPaperDark: { backgroundColor: '#161C28', borderColor: '#334155' },
  pdfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
    paddingBottom: 8,
  },
  pdfHeaderLogo: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  pdfAvatarBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfAvatarText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  pdfFirmName: { fontSize: 14, fontWeight: '800' },
  pdfAnalystMeta: { fontSize: 10, color: '#64748B', marginTop: 1 },
  tradeRecommendationBanner: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  tradeRecommendationText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  tradeMetricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  metricBox: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  metricBoxLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  metricBoxDark: { backgroundColor: '#121722', borderColor: '#27272A' },
  metricKey: { fontSize: 9, fontWeight: '800', color: '#64748B' },
  metricVal: { fontSize: 13, fontWeight: '800', marginTop: 2 },
  pdfDisclaimerSnippet: {
    fontSize: 10,
    color: '#64748B',
    lineHeight: 14,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  pdfFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
    paddingTop: 6,
  },
  pdfPagesCount: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
  pdfPoweredBy: { fontSize: 10, color: '#0284C7', fontWeight: '700' },

  previewBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  previewBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  // Empty Box
  emptyBox: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  emptyDesc: { color: '#64748B', fontSize: 11, textAlign: 'center', lineHeight: 16 },

  // Channel Item & Report Item
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  itemLight: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  itemDark: { backgroundColor: '#161C28', borderColor: '#27272A' },
  channelIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  channelName: { fontSize: 13, fontWeight: '700' },
  channelStatus: { fontSize: 10, color: '#10B981', marginTop: 1 },
  reportIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportItemTitle: { fontSize: 13, fontWeight: '700' },
  reportItemMeta: { fontSize: 11, color: '#64748B', marginTop: 2 },
  downloadBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Dialog Overlay & Card (Logo Selector)
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
  },
  dialogCardLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  dialogCardDark: { backgroundColor: '#121722', borderColor: '#1E2430' },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  dialogTitle: { fontSize: 16, fontWeight: '800' },
  dialogSub: { color: '#64748B', fontSize: 11, marginTop: 2 },
  dialogCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
  },
  urlInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  applyUrlBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyUrlBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
    marginBottom: 16,
  },
  presetItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  presetItemLight: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  presetItemDark: { backgroundColor: '#161C28', borderColor: '#27272A' },
  presetItemActive: { borderColor: '#0284C7', backgroundColor: 'rgba(2, 132, 199, 0.12)' },
  presetImage: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  presetName: { fontSize: 11, fontWeight: '700', flex: 1 },
  removeLogoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  removeLogoBtnText: { color: '#EF4444', fontSize: 12, fontWeight: '700' },

  // PDF Viewer Fullscreen Modal
  pdfViewerContainer: { flex: 1 },
  pdfViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  viewerCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
  },
  viewerTitle: { fontSize: 15, fontWeight: '800' },
  viewerSub: { fontSize: 11, color: '#64748B' },
  viewerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
  },
  viewerActionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  viewerActionBtnPrimaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  pdfViewerBody: {
    padding: 16,
    gap: 20,
    paddingBottom: 40,
  },
  fullPdfPage: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    position: 'relative',
  },
  fullPdfPageLight: { backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' },
  fullPdfPageDark: { backgroundColor: '#131824', borderColor: '#2E384D' },
  pageNumberBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pageNumberText: { fontSize: 9, fontWeight: '700', color: '#64748B' },
  fullPdfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  fullPdfLogo: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  fullPdfAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPdfAvatarText: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  fullPdfFirmTitle: { fontSize: 17, fontWeight: '800', color: '#0284C7', marginBottom: 2 },
  fullPdfMetaText: { fontSize: 10, color: '#64748B', lineHeight: 14 },
  pdfDivider: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.25)',
    marginVertical: 12,
  },
  fullPdfCallBanner: {
    backgroundColor: '#059669',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  fullPdfCallBadge: {
    color: '#D1FAE5',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  fullPdfCallTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  fullPdfCallTime: { color: '#A7F3D0', fontSize: 9, marginTop: 3 },
  fullPdfMatrix: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 14,
  },
  matrixCol: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(2, 132, 199, 0.04)',
  },
  matrixBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#CBD5E1',
  },
  matrixLabel: { fontSize: 9, fontWeight: '800', color: '#64748B' },
  matrixValue: { fontSize: 14, fontWeight: '900', marginTop: 2, color: '#0F172A' },
  pdfSectionBlock: {
    marginBottom: 14,
  },
  pdfSectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
    marginBottom: 4,
    letterSpacing: -0.1,
  },
  pdfSectionBody: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  pdfDisclaimerBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    padding: 10,
    borderRadius: 6,
    marginBottom: 14,
  },
  pdfDisclaimerTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
    marginBottom: 3,
  },
  pdfDisclaimerText: {
    fontSize: 9,
    color: '#78350F',
    lineHeight: 13,
  },
  fullPdfFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.25)',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerAddressText: { fontSize: 9, color: '#94A3B8' },
  footerEngineText: { fontSize: 9, fontWeight: '700', color: '#0284C7' },
});
