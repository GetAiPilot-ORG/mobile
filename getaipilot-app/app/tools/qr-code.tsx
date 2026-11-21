import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { useTheme, getColors } from '@/theme';
import { supabase } from '@/lib/supabase';
import {
  CanvasTemplateId,
  CanvasConfig,
  QRStyles,
  QRType,
  CANVAS_TEMPLATES,
  DEFAULT_CANVAS_CONFIG,
  SavedQRCode,
  ReviewFeedback,
} from '../../src/components/qr-studio/types';
import { CanvasGallery } from '../../src/components/qr-studio/CanvasGallery';
import { CanvasFormInputs } from '../../src/components/qr-studio/CanvasFormInputs';
import { CanvasPreview } from '../../src/components/qr-studio/CanvasPreview';
import { SavedStandeesList } from '../../src/components/qr-studio/SavedStandeesList';
import { CustomerReviewsList } from '../../src/components/qr-studio/CustomerReviewsList';

const formatExternalUrl = (url: string) => {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

export default function QRCodeGeneratorScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  // Global View Mode: Canvas Studio vs Customer Reviews
  const [viewMode, setViewMode] = useState<'generator' | 'reviews'>('generator');

  // Wizard Step: 1 = Choose Canvas, 2 = Customize Details, 3 = Preview & Export
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [selectedCanvas, setSelectedCanvas] = useState<CanvasTemplateId>('bold-retail-promo');
  const [canvasConfig, setCanvasConfig] = useState<CanvasConfig>(DEFAULT_CANVAS_CONFIG);

  // Core QR Payload
  const [qrType, setQrType] = useState<QRType>('url');
  const [title, setTitle] = useState('Bold Retail Promo Standee');
  const [isTitleCustomized, setIsTitleCustomized] = useState(false);

  // Web URL
  const [urlContent, setUrlContent] = useState('https://getaipilot.in');

  // Wi-Fi Credentials
  const [wifiSsid, setWifiSsid] = useState('GrandVista_Guest');
  const [wifiPassword, setWifiPassword] = useState('welcomevista26');
  const [wifiEncryption, setWifiEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');

  // vCard Profile
  const [vcardFirst, setVcardFirst] = useState('John');
  const [vcardLast, setVcardLast] = useState('Doe');
  const [vcardPhone, setVcardPhone] = useState('+91 89822 85510');
  const [vcardEmail, setVcardEmail] = useState('hello@getaipilot.in');
  const [vcardOrg, setVcardOrg] = useState('The Grand Vista');
  const [vcardTitle, setVcardTitle] = useState('General Manager');
  const [vcardUrl, setVcardUrl] = useState('https://getaipilot.in');

  // Google Review Gate
  const [googleReviewUrl, setGoogleReviewUrl] = useState('https://g.page/r/sample-google-review-url');
  const [reviewBizName, setReviewBizName] = useState('The Grand Vista Hotel');
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('Thank you for your valuable feedback!');
  const [reviewDesc, setReviewDesc] = useState('Please rate your experience with us today');

  // Email Mailto
  const [emailTo, setEmailTo] = useState('support@getaipilot.in');
  const [emailSubject, setEmailSubject] = useState('Inquiry from QR Standee');
  const [emailBody, setEmailBody] = useState('Hello, I would like to learn more about your services.');

  // QR Aesthetics
  const [qrStyles, setQRStyles] = useState<QRStyles>({
    fgColor: '#000000',
    bgColor: '#ffffff',
    level: 'H',
    size: 240,
    includeMargin: false,
  });

  // Saved codes & reviews states
  const [savedCodes, setSavedCodes] = useState<SavedQRCode[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const [activeQRId, setActiveQRId] = useState<string | null>(null);

  // Feedback list
  const [allFeedbacks, setAllFeedbacks] = useState<ReviewFeedback[]>([]);
  const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(false);

  // ══ COMPUTED QR CODE PAYLOAD ══
  const computedQRContent = useMemo(() => {
    switch (qrType) {
      case 'review': {
        const baseUrl = 'https://getaipilot.in';
        if (activeQRId) {
          return `${baseUrl}/r/${activeQRId}`;
        }
        const params = new URLSearchParams({
          biz: reviewBizName || canvasConfig.brandName || 'Your Business',
          url: formatExternalUrl(googleReviewUrl || canvasConfig.targetUrl || 'https://google.com'),
          msg: reviewSuccessMsg || 'Thank you for your feedback!',
          desc: reviewDesc || '',
        }).toString();
        return `${baseUrl}/r/preview?${params}`;
      }
      case 'wifi':
        return `WIFI:S:${wifiSsid};T:${wifiEncryption};P:${wifiPassword};;`;
      case 'vcard': {
        const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0'];
        const cleanFirst = (vcardFirst || '').trim();
        const cleanLast = (vcardLast || '').trim();
        const cleanOrg = (vcardOrg || '').trim();
        const cleanTitle = (vcardTitle || '').trim();
        const cleanPhone = (vcardPhone || '').trim();
        const cleanEmail = (vcardEmail || '').trim();
        const cleanUrl = (vcardUrl || '').trim();

        lines.push(`N:${cleanLast};${cleanFirst};;;`);
        const fnValue =
          [cleanFirst, cleanLast].filter(Boolean).join(' ') ||
          cleanOrg ||
          canvasConfig.brandName ||
          'Contact';
        lines.push(`FN:${fnValue}`);

        if (cleanOrg) lines.push(`ORG:${cleanOrg}`);
        if (cleanTitle) lines.push(`TITLE:${cleanTitle}`);
        if (cleanPhone) lines.push(`TEL;TYPE=CELL,VOICE:${cleanPhone}`);
        if (cleanEmail) lines.push(`EMAIL:${cleanEmail}`);
        if (cleanUrl) lines.push(`URL:${formatExternalUrl(cleanUrl)}`);

        lines.push('END:VCARD');
        return lines.join('\r\n');
      }
      case 'email':
        return `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      case 'url':
      default: {
        const raw = canvasConfig.targetUrl || urlContent || 'https://getaipilot.in';
        return formatExternalUrl(raw);
      }
    }
  }, [
    qrType,
    activeQRId,
    reviewBizName,
    canvasConfig.brandName,
    canvasConfig.targetUrl,
    googleReviewUrl,
    reviewSuccessMsg,
    reviewDesc,
    wifiSsid,
    wifiEncryption,
    wifiPassword,
    vcardLast,
    vcardFirst,
    vcardOrg,
    vcardTitle,
    vcardPhone,
    vcardEmail,
    vcardUrl,
    emailTo,
    emailSubject,
    emailBody,
    urlContent,
  ]);

  // Load saved codes on mount
  useEffect(() => {
    fetchSavedCodes();
  }, []);

  // Load feedbacks when entering reviews view
  useEffect(() => {
    if (viewMode === 'reviews') {
      fetchCustomerReviews();
    }
  }, [viewMode]);

  const fetchSavedCodes = async () => {
    try {
      setIsLoadingSaved(true);
      // 1. Try Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('qr_codes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setSavedCodes(data);
          return;
        }
      }

      // 2. Fallback to AsyncStorage
      const localJson = await AsyncStorage.getItem('@saved_qr_codes');
      if (localJson) {
        setSavedCodes(JSON.parse(localJson));
      }
    } catch (e) {
      console.warn('[QRCodeGenerator] Error fetching saved QR codes:', e);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const fetchCustomerReviews = async () => {
    try {
      setIsLoadingFeedbacks(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAllFeedbacks([]);
        return;
      }

      const { data: userQRs, error: qrError } = await supabase
        .from('qr_codes')
        .select('id, title')
        .eq('user_id', user.id);

      if (qrError || !userQRs || userQRs.length === 0) {
        setAllFeedbacks([]);
        return;
      }

      const qrIds = userQRs.map((q) => q.id);
      const qrMap = new Map(userQRs.map((q) => [q.id, q.title]));

      const { data: fbData, error: fbError } = await supabase
        .from('review_feedback')
        .select('*')
        .in('qr_code_id', qrIds)
        .order('created_at', { ascending: false });

      if (fbError) throw fbError;

      const joinedData: ReviewFeedback[] = (fbData || []).map((fb: any) => ({
        ...fb,
        qr_title: qrMap.get(fb.qr_code_id) || 'Untitled QR',
      }));

      setAllFeedbacks(joinedData);
    } catch (e) {
      console.warn('[QRCodeGenerator] Error fetching customer reviews:', e);
    } finally {
      setIsLoadingFeedbacks(false);
    }
  };

  // When a canvas is selected, auto-update smart defaults
  const handleSelectCanvas = (id: CanvasTemplateId) => {
    setSelectedCanvas(id);
    setActiveStep(2);
    setActiveQRId(null);

    const template = CANVAS_TEMPLATES.find((t) => t.id === id);
    if (template && !isTitleCustomized) {
      setTitle(`${canvasConfig.brandName || 'My Business'} ${template.name}`);
    }

    if (id === 'acrylic-standee' || id === 'floral-review') {
      setQrType('review');
    } else if (id === 'hexagon-dual') {
      setQrType('wifi');
    } else {
      setQrType('url');
    }
  };

  // Save to Dashboard
  const handleSaveToDashboard = async () => {
    try {
      setIsSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const savedStyleConfig = {
        ...qrStyles,
        selectedCanvas,
        canvasConfig,
        type: qrType,
        googleReviewUrl,
        businessName: reviewBizName || canvasConfig.brandName,
        successMessage: reviewSuccessMsg,
        description: reviewDesc,
        wifiSsid,
        wifiPassword,
        wifiEncryption,
        vcardFirst,
        vcardLast,
        vcardPhone,
        vcardEmail,
        vcardOrg,
        vcardTitle,
        vcardUrl,
      };

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        if (activeQRId) {
          const updatePayload: any = {
            title: title || canvasConfig.brandName || 'My Business QR Standee',
            style_config: savedStyleConfig,
          };
          if (qrType !== 'review') {
            updatePayload.content = computedQRContent;
          }

          const { data, error } = await supabase
            .from('qr_codes')
            .update(updatePayload)
            .eq('id', activeQRId)
            .select()
            .single();

          if (error) throw error;
          setSavedCodes((prev) =>
            prev.map((item) => (item.id === activeQRId ? data : item))
          );
          Alert.alert('Updated!', 'QR Standee updated in your dashboard.');
        } else {
          const { data, error } = await supabase
            .from('qr_codes')
            .insert([
              {
                user_id: user.id,
                content: qrType === 'review' ? 'temp' : computedQRContent,
                title: title || canvasConfig.brandName || 'My Business QR Standee',
                style_config: savedStyleConfig,
              },
            ])
            .select()
            .single();

          if (error) throw error;

          if (qrType === 'review') {
            const finalUrl = `https://getaipilot.in/r/${data.id}`;
            await supabase.from('qr_codes').update({ content: finalUrl }).eq('id', data.id);
            data.content = finalUrl;
          }

          setSavedCodes([data, ...savedCodes]);
          setActiveQRId(data.id);
          Alert.alert('Saved!', 'QR Standee saved to your dashboard.');
        }
      } else {
        // Offline / Guest Local Save
        const newItem: SavedQRCode = {
          id: activeQRId || `local-${Date.now()}`,
          content: computedQRContent,
          title: title || canvasConfig.brandName || 'My Business QR Standee',
          style_config: savedStyleConfig,
          created_at: new Date().toISOString(),
        };

        let updatedList: SavedQRCode[] = [];
        if (activeQRId) {
          updatedList = savedCodes.map((item) => (item.id === activeQRId ? newItem : item));
        } else {
          updatedList = [newItem, ...savedCodes];
          setActiveQRId(newItem.id);
        }

        setSavedCodes(updatedList);
        await AsyncStorage.setItem('@saved_qr_codes', JSON.stringify(updatedList));
        Alert.alert('Saved Locally', 'Saved to your offline device storage.');
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Could not save QR Standee');
    } finally {
      setIsSaving(false);
    }
  };

  // Load Saved QR Standee into editor
  const handleLoadSavedQR = (saved: SavedQRCode) => {
    setTitle(saved.title);
    setIsTitleCustomized(true);
    setActiveQRId(saved.id);

    if (saved.style_config) {
      const cfg = saved.style_config;
      if (cfg.selectedCanvas) setSelectedCanvas(cfg.selectedCanvas);
      if (cfg.canvasConfig) setCanvasConfig(cfg.canvasConfig);
      if (cfg.type) setQrType(cfg.type);
      if (cfg.googleReviewUrl) setGoogleReviewUrl(cfg.googleReviewUrl);
      if (cfg.businessName) setReviewBizName(cfg.businessName);
      if (cfg.successMessage) setReviewSuccessMsg(cfg.successMessage);
      if (cfg.description) setReviewDesc(cfg.description);
      if (cfg.wifiSsid) setWifiSsid(cfg.wifiSsid);
      if (cfg.wifiPassword) setWifiPassword(cfg.wifiPassword);
      if (cfg.wifiEncryption) setWifiEncryption(cfg.wifiEncryption);
      if (cfg.vcardFirst) setVcardFirst(cfg.vcardFirst);
      if (cfg.vcardLast) setVcardLast(cfg.vcardLast);
      if (cfg.vcardPhone) setVcardPhone(cfg.vcardPhone);
      if (cfg.vcardEmail) setVcardEmail(cfg.vcardEmail);
      if (cfg.vcardOrg) setVcardOrg(cfg.vcardOrg);
      if (cfg.vcardTitle) setVcardTitle(cfg.vcardTitle);
      if (cfg.vcardUrl) setVcardUrl(cfg.vcardUrl);
      if (cfg.fgColor) {
        setQRStyles((prev) => ({
          ...prev,
          fgColor: cfg.fgColor,
          bgColor: cfg.bgColor || prev.bgColor,
          level: cfg.level || prev.level,
        }));
      }
    }

    setActiveStep(3); // Jump to preview
    Alert.alert('Loaded', `Loaded "${saved.title}"`);
  };

  // Delete saved code
  const handleDeleteSaved = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('qr_codes').delete().eq('id', id);
      }
      const filtered = savedCodes.filter((c) => c.id !== id);
      setSavedCodes(filtered);
      await AsyncStorage.setItem('@saved_qr_codes', JSON.stringify(filtered));
      if (activeQRId === id) setActiveQRId(null);
    } catch (e) {
      console.warn('[QRCodeGenerator] Delete error:', e);
    }
  };

  const activeTemplateMeta =
    CANVAS_TEMPLATES.find((t) => t.id === selectedCanvas) || CANVAS_TEMPLATES[0];

  return (
    <AppScreen safeArea={true} style={{ backgroundColor: colors.background }}>
      {/* Top Header Bar */}
      <AppTopBar
        title="QR Standee Studio"
        onBackPress={() => router.back()}
        rightElement={
          <View
            style={[
              styles.modePill,
              {
                backgroundColor: isDark ? '#1C1B24' : '#E2E8F0',
                borderColor: colors.border,
              },
            ]}
          >
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setViewMode('generator');
              }}
              style={[
                styles.modeBtn,
                viewMode === 'generator' && [
                  styles.modeBtnActive,
                  { backgroundColor: isDark ? '#262435' : '#FFFFFF' },
                ],
              ]}
            >
              <Text
                style={[
                  styles.modeBtnText,
                  {
                    color:
                      viewMode === 'generator'
                        ? colors.foreground
                        : colors.mutedForeground,
                    fontWeight: viewMode === 'generator' ? '800' : '600',
                  },
                ]}
              >
                Studio
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setViewMode('reviews');
              }}
              style={[
                styles.modeBtn,
                viewMode === 'reviews' && [
                  styles.modeBtnActive,
                  { backgroundColor: isDark ? '#262435' : '#FFFFFF' },
                ],
              ]}
            >
              <Text
                style={[
                  styles.modeBtnText,
                  {
                    color:
                      viewMode === 'reviews'
                        ? '#EF4444'
                        : colors.mutedForeground,
                    fontWeight: viewMode === 'reviews' ? '800' : '600',
                  },
                ]}
              >
                Reviews
              </Text>
              {allFeedbacks.length > 0 && (
                <View style={styles.badgeCount}>
                  <Text style={styles.badgeCountText}>{allFeedbacks.length}</Text>
                </View>
              )}
            </Pressable>
          </View>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {viewMode === 'generator' ? (
          <>
            {/* ══ 3-STEP WIZARD PROGRESS BAR ══ */}
            <View
              style={[
                styles.wizardContainer,
                {
                  backgroundColor: isDark ? '#181722' : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.wizardRow}>
                {[
                  { step: 1, title: '1. Canvas', subtitle: activeTemplateMeta.name },
                  { step: 2, title: '2. Details', subtitle: 'Design & Link' },
                  { step: 3, title: '3. Export', subtitle: '300 DPI Print' },
                ].map((s) => {
                  const isActive = activeStep === s.step;
                  const isPassed = activeStep > s.step;
                  return (
                    <Pressable
                      key={s.step}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setActiveStep(s.step as 1 | 2 | 3);
                      }}
                      style={[
                        styles.stepBtn,
                        {
                          backgroundColor: isActive
                            ? isDark
                              ? '#143126'
                              : '#ECFDF5'
                            : isDark
                            ? '#201F2C'
                            : '#F8FAFC',
                          borderColor: isActive
                            ? '#0A4737'
                            : isPassed
                            ? isDark
                              ? '#1E3A2F'
                              : '#A7F3D0'
                            : colors.border,
                        },
                      ]}
                    >
                      <View style={styles.stepTitleRow}>
                        <Text
                          style={[
                            styles.stepTitle,
                            {
                              color: isActive
                                ? isDark
                                  ? '#6EE7B7'
                                  : '#0A4737'
                                : colors.foreground,
                              fontWeight: isActive ? '800' : '600',
                            },
                          ]}
                        >
                          {s.title}
                        </Text>
                        {isPassed && (
                          <Ionicons name="checkmark-circle" size={14} color="#0A4737" />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.stepSubtitle,
                          { color: colors.mutedForeground },
                        ]}
                        numberOfLines={1}
                      >
                        {s.subtitle}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* ══ STEP 1: CHOOSE CANVAS GALLERY ══ */}
            {activeStep === 1 && (
              <CanvasGallery
                selectedCanvas={selectedCanvas}
                onSelectCanvas={handleSelectCanvas}
                onNextStep={() => setActiveStep(2)}
              />
            )}

            {/* ══ STEP 2: BUSINESS & PAYLOAD DETAILS ══ */}
            {activeStep === 2 && (
              <CanvasFormInputs
                canvasId={selectedCanvas}
                config={canvasConfig}
                onChangeConfig={setCanvasConfig}
                styles={qrStyles}
                onChangeStyles={setQRStyles}
                qrType={qrType}
                onChangeQrType={setQrType}
                title={title}
                onChangeTitle={(v) => {
                  setTitle(v);
                  setIsTitleCustomized(true);
                }}
                urlContent={urlContent}
                onChangeUrlContent={setUrlContent}
                wifiSsid={wifiSsid}
                onChangeWifiSsid={setWifiSsid}
                wifiPassword={wifiPassword}
                onChangeWifiPassword={setWifiPassword}
                wifiEncryption={wifiEncryption}
                onChangeWifiEncryption={setWifiEncryption}
                vcardFirst={vcardFirst}
                onChangeVcardFirst={setVcardFirst}
                vcardLast={vcardLast}
                onChangeVcardLast={setVcardLast}
                vcardPhone={vcardPhone}
                onChangeVcardPhone={setVcardPhone}
                vcardEmail={vcardEmail}
                onChangeVcardEmail={setVcardEmail}
                vcardOrg={vcardOrg}
                onChangeVcardOrg={setVcardOrg}
                vcardTitle={vcardTitle}
                onChangeVcardTitle={setVcardTitle}
                vcardUrl={vcardUrl}
                onChangeVcardUrl={setVcardUrl}
                googleReviewUrl={googleReviewUrl}
                onChangeGoogleReviewUrl={setGoogleReviewUrl}
                reviewBizName={reviewBizName}
                onChangeReviewBizName={setReviewBizName}
                reviewSuccessMsg={reviewSuccessMsg}
                onChangeReviewSuccessMsg={setReviewSuccessMsg}
                reviewDesc={reviewDesc}
                onChangeReviewDesc={setReviewDesc}
                emailTo={emailTo}
                onChangeEmailTo={setEmailTo}
                emailSubject={emailSubject}
                onChangeEmailSubject={setEmailSubject}
                emailBody={emailBody}
                onChangeEmailBody={setEmailBody}
                onNextStep={() => setActiveStep(3)}
              />
            )}

            {/* ══ STEP 3: PREVIEW & EXPORT ══ */}
            {activeStep === 3 && (
              <CanvasPreview
                canvasId={selectedCanvas}
                config={canvasConfig}
                styles={qrStyles}
                qrContent={computedQRContent}
                qrType={qrType}
                title={title}
                onSaveToDashboard={handleSaveToDashboard}
                isSaving={isSaving}
                isSaved={Boolean(activeQRId)}
              />
            )}

            {/* ══ SAVED QR STANDEES SECTION ══ */}
            <SavedStandeesList
              savedCodes={savedCodes}
              isLoading={isLoadingSaved}
              onLoadSaved={handleLoadSavedQR}
              onDeleteSaved={handleDeleteSaved}
            />
          </>
        ) : (
          /* ══ CUSTOMER REVIEWS TAB ══ */
          <CustomerReviewsList
            feedbacks={allFeedbacks}
            isLoading={isLoadingFeedbacks}
            onRefresh={fetchCustomerReviews}
          />
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 12,
  },
  modePill: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 2,
    borderWidth: 1,
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
  },
  modeBtnActive: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeBtnText: {
    fontSize: 11.5,
  },
  badgeCount: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  badgeCountText: {
    color: '#B91C1C',
    fontSize: 9.5,
    fontWeight: '800',
  },
  wizardContainer: {
    padding: 8,
    borderRadius: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  wizardRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stepBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepTitle: {
    fontSize: 11.5,
  },
  stepSubtitle: {
    fontSize: 10,
    marginTop: 2,
  },
});
