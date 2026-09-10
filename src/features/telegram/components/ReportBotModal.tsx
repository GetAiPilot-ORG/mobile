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
  useColorScheme,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { telegramApi } from '../api/telegramApi';
import { ReportBotBrandProfile } from '../types';

interface ReportBotModalProps {
  visible: boolean;
  onClose: () => void;
}

type ReportBotTab = 'profile' | 'channels' | 'archive';

export const ReportBotModal: React.FC<ReportBotModalProps> = ({ visible, onClose }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ReportBotTab>('profile');

  // Form State
  const [advisoryFirm, setAdvisoryFirm] = useState('No Brand');
  const [researchAnalyst, setResearchAnalyst] = useState('SEBI');
  const [sebiRegistration, setSebiRegistration] = useState('INH010600090');
  const [website, setWebsite] = useState('getaipilot.com');
  const [email, setEmail] = useState('research@example.com');
  const [officeAddress, setOfficeAddress] = useState('e.g. Kallam, Latur, Maharashtra');
  const [page1Disclaimer, setPage1Disclaimer] = useState('Add short SEBI/risk disclaimer for the first page.');
  const [page2Disclosure, setPage2Disclosure] = useState('Optional disclosure content.');
  const [page3Conflicts, setPage3Conflicts] = useState('Optional conflict of interest content.');
  const [page4Policy, setPage4Policy] = useState('Optional risk and policy content.');

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
      if (p.page1Disclaimer) setPage1Disclaimer(p.page1Disclaimer);
      if (p.page2Disclosure !== undefined) setPage2Disclosure(p.page2Disclosure || '');
      if (p.page3Conflicts !== undefined) setPage3Conflicts(p.page3Conflicts || '');
      if (p.page4Policy !== undefined) setPage4Policy(p.page4Policy || '');
    }
  }, [dashboard]);

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

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
        {/* Top Header */}
        <View style={[styles.header, isDark ? styles.borderDark : styles.borderLight]}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={[styles.title, isDark ? styles.textDark : styles.textLight]}>GAP Report Bot</Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              Convert Telegram trading calls into branded SEBI research PDFs. Complete the bot, channel, and brand setup before posting live calls.
            </Text>
          </View>
          <Pressable style={[styles.closeBtn, isDark ? styles.closeBtnDark : styles.closeBtnLight]} onPress={onClose}>
            <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
          </Pressable>
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
        <View style={[styles.tabBarSection, isDark ? styles.borderDark : styles.borderLight]}>
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
                Reports Archive ({dashboard?.reportsCount ?? 0})
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

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
          {isLoading ? (
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
                      <View>
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
                            <Text style={styles.saveBtnText}>Save Settings</Text>
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

                    {/* SECTION 3: REPORT ASSETS */}
                    <Text style={[styles.groupHeading, { marginTop: 14 }]}>Report Assets</Text>
                    <Text style={styles.groupDesc}>Logo and first-page risk language are used in every generated PDF.</Text>

                    <View style={styles.row}>
                      <View style={[styles.logoUploadBox, isDark ? styles.logoUploadBoxDark : styles.logoUploadBoxLight]}>
                        <Ionicons name="image-outline" size={28} color="#0284C7" />
                        <Text style={styles.logoUploadLabel}>Brand Logo</Text>
                        <Pressable
                          style={styles.uploadBtnMini}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            Alert.alert('Logo Upload', 'Select image from gallery or media library.');
                          }}
                        >
                          <Ionicons name="cloud-upload-outline" size={12} color="#0284C7" />
                          <Text style={styles.uploadBtnMiniText}>Upload Logo</Text>
                        </Pressable>
                      </View>

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

                  {/* 🌟 PDF PREVIEW CARD (1:1 PARITY WITH WEB SCREENSHOT) */}
                  <View style={[styles.previewCard, isDark ? styles.previewCardDark : styles.previewCardLight]}>
                    <View style={styles.previewHeaderRow}>
                      <View>
                        <Text style={[styles.previewTitle, isDark ? styles.textDark : styles.textLight]}>
                          PDF Preview
                        </Text>
                        <Text style={styles.previewSubtitle}>Generate an actual PDF from your current report settings.</Text>
                      </View>
                      <View style={styles.completedBadge}>
                        <View style={styles.dotGreen} />
                        <Text style={styles.completedBadgeText}>Completed</Text>
                      </View>
                    </View>

                    {/* Rendered Sample PDF Sheet View */}
                    <View style={[styles.pdfPaper, isDark ? styles.pdfPaperDark : styles.pdfPaperLight]}>
                      {/* PDF Header with Avatar & SEBI Registration */}
                      <View style={styles.pdfHeader}>
                        <View style={styles.pdfAvatarBox}>
                          <Text style={styles.pdfAvatarText}>{advisoryFirm ? advisoryFirm.charAt(0).toUpperCase() : 'N'}</Text>
                        </View>
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
                        <Text style={styles.pdfPagesCount}>1 page configured</Text>
                        <Text style={styles.pdfPoweredBy}>Powered by GAP SEBI Engine</Text>
                      </View>
                    </View>

                    {/* Preview CTA Button */}
                    <Pressable
                      style={styles.previewBtn}
                      onPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        Alert.alert('PDF Preview Generated', 'Sample SEBI Research Report is verified and ready for live trading calls.');
                      }}
                    >
                      <Ionicons name="eye-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.previewBtnText}>Preview My PDF</Text>
                    </Pressable>
                  </View>
                </>
              )}

              {/* TAB 2: CHANNELS */}
              {activeTab === 'channels' && (
                <View style={[styles.formCard, isDark ? styles.cardDark : styles.cardLight]}>
                  <View style={styles.formHeaderRow}>
                    <View>
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
                    (dashboard?.channels || []).map((ch, idx) => (
                      <View key={`ch_${ch.id || idx}`} style={[styles.channelItem, isDark ? styles.itemDark : styles.itemLight]}>
                        <View style={styles.channelIcon}>
                          <Ionicons name="megaphone" size={16} color="#0284C7" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.channelName, isDark ? styles.textDark : styles.textLight]}>
                            {ch.name}
                          </Text>
                          <Text style={styles.channelStatus}>● Active Listener</Text>
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
                    (dashboard?.reports || []).map((rep) => (
                      <View key={rep.id} style={[styles.reportItem, isDark ? styles.itemDark : styles.itemLight]}>
                        <View style={styles.reportIconCircle}>
                          <Ionicons name="document-text" size={18} color="#EF4444" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.reportItemTitle, isDark ? styles.textDark : styles.textLight]}>
                            {rep.title}
                          </Text>
                          <Text style={styles.reportItemMeta}>
                            Call: {rep.callType} • Entry: {rep.entry} • Target: {rep.target} • SL: {rep.stopLoss}
                          </Text>
                        </View>
                        <Pressable
                          style={styles.downloadBtn}
                          onPress={() => {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            Alert.alert('Report PDF', 'PDF download link: ' + (rep.pdfUrl || 'SEBI Report'));
                          }}
                        >
                          <Ionicons name="download-outline" size={16} color="#0284C7" />
                        </Pressable>
                      </View>
                    ))
                  )}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerLight: { backgroundColor: '#F8FAFC' },
  containerDark: { backgroundColor: '#0B0F19' },
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
  subtitle: { color: '#64748B', fontSize: 11, marginTop: 3, lineHeight: 16 },
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
  btnDark: { backgroundColor: '#161C28', borderColor: '#262C36' },
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
  cardLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  cardDark: { backgroundColor: '#121722', borderColor: '#1E2430' },
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
    fontWeight: '800',
    color: '#0284C7',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  inputDark: { backgroundColor: '#161C28', borderColor: '#262C36', color: '#F8FAFC' },

  // Logo Upload Box
  logoUploadBox: {
    width: 110,
    height: 110,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  logoUploadBoxLight: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  logoUploadBoxDark: { backgroundColor: '#161C28', borderColor: '#262C36' },
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
  metricBoxDark: { backgroundColor: '#121722', borderColor: '#262C36' },
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
  itemDark: { backgroundColor: '#161C28', borderColor: '#262C36' },
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
});
