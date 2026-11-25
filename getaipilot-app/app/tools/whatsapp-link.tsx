import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Share,
  Linking,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  WhatsappIcon,
  Copy01Icon,
  Share01Icon,
  QrCode01Icon,
  ArrowUpRight01Icon,
  CheckmarkCircle01Icon,
  BubbleChatIcon,
  SmartPhone01Icon,
} from '@/constants/icons';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { useTheme, getColors, AppColors } from '@/theme';

interface CountryCodePreset {
  code: string;
  flag: string;
  name: string;
}

const COUNTRY_PRESETS: CountryCodePreset[] = [
  { code: '91', flag: '🇮🇳', name: '+91' },
  { code: '1', flag: '🇺🇸', name: '+1' },
  { code: '44', flag: '🇬🇧', name: '+44' },
  { code: '971', flag: '🇦🇪', name: '+971' },
  { code: '61', flag: '🇦🇺', name: '+61' },
  { code: '65', flag: '🇸🇬', name: '+65' },
];

interface MessageTemplate {
  label: string;
  text: string;
}

const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    label: '💼 Product Inquiry',
    text: 'Hi! I am interested in learning more about your products and services.',
  },
  {
    label: '📅 Consultation',
    text: 'Hello, I would like to schedule a 1-on-1 strategy call with your team.',
  },
  {
    label: '🛠️ Support',
    text: 'Hi GetAiPilot Support, I have a quick question regarding my account setup.',
  },
  {
    label: '🏷️ Pricing & Quote',
    text: 'Hello, could you please share your latest pricing packages and features?',
  },
];

export default function WhatsAppLinkGeneratorScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [selectedCountry, setSelectedCountry] = useState('91');
  const [phoneDigits, setPhoneDigits] = useState('9876543210');
  const [message, setMessage] = useState('Hi! I want to explore GetAiPilot automation.');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-generate URL when inputs change
  const currentFullPhone = useMemo(() => {
    const rawDigits = phoneDigits.replace(/[^0-9]/g, '');
    if (rawDigits.startsWith(selectedCountry)) {
      return rawDigits;
    }
    return `${selectedCountry}${rawDigits}`;
  }, [selectedCountry, phoneDigits]);

  const handleSelectCountry = (code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCountry(code);
  };

  const handleApplyTemplate = (tmpl: MessageTemplate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMessage(tmpl.text);
  };

  const handleGenerate = () => {
    const cleanNumber = currentFullPhone.replace(/[^0-9]/g, '');
    if (cleanNumber.length < 7) {
      Alert.alert('Invalid Number', 'Please enter a valid phone number with country code.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const encoded = encodeURIComponent(message.trim());
    const url = encoded
      ? `https://wa.me/${cleanNumber}?text=${encoded}`
      : `https://wa.me/${cleanNumber}`;

    setGeneratedUrl(url);
  };

  const handleCopy = async (linkText: string) => {
    await Clipboard.setStringAsync(linkText);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!generatedUrl) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        message: `Chat directly on WhatsApp:\n\n${generatedUrl}`,
        title: 'WhatsApp Direct Chat Link',
      });
    } catch {}
  };

  const handleOpenWhatsApp = () => {
    if (!generatedUrl) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(generatedUrl).catch(() => {
      Alert.alert('Notice', 'Unable to launch WhatsApp on this device.');
    });
  };

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar title="WhatsApp Link Generator" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Creator Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.headerIconBubble, { backgroundColor: '#E0F7E9' }]}>
              <HugeiconsIcon icon={WhatsappIcon} size={20} color="#16A34A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Direct Click-to-Chat</Text>
              <Text style={styles.cardSubtitle}>
                Allow clients to start a conversation without saving your number
              </Text>
            </View>
          </View>

          {/* Quick Country Code Chips */}
          <Text style={styles.inputLabel}>Dialing Country Code</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.countryScroll}
          >
            {COUNTRY_PRESETS.map((p) => {
              const active = selectedCountry === p.code;
              return (
                <Pressable
                  key={p.code}
                  style={[
                    styles.countryChip,
                    active && styles.countryChipActive,
                  ]}
                  onPress={() => handleSelectCountry(p.code)}
                >
                  <Text style={{ fontSize: 13 }}>{p.flag}</Text>
                  <Text
                    style={[
                      styles.countryChipText,
                      active && styles.countryChipTextActive,
                    ]}
                  >
                    {p.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Phone Input */}
          <View style={[styles.inputGroup, { marginTop: 12 }]}>
            <Text style={styles.inputLabel}>WhatsApp Phone Number</Text>
            <View style={styles.inputBox}>
              <View style={styles.countryPrefixBox}>
                <Text style={styles.countryPrefixText}>+{selectedCountry}</Text>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="9876543210"
                placeholderTextColor={colors.mutedForeground}
                value={phoneDigits}
                onChangeText={setPhoneDigits}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Quick Message Templates */}
          <View style={[styles.inputGroup, { marginTop: 14 }]}>
            <Text style={styles.inputLabel}>Quick Message Presets</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.templateScroll}
            >
              {MESSAGE_TEMPLATES.map((tmpl) => (
                <Pressable
                  key={tmpl.label}
                  style={styles.templateChip}
                  onPress={() => handleApplyTemplate(tmpl)}
                >
                  <Text style={styles.templateChipText}>{tmpl.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Prefilled Message (Optional)</Text>
            <TextInput
              style={[styles.textInputArea, { minHeight: 80 }]}
              placeholder="Hi! I want to ask about..."
              placeholderTextColor={colors.mutedForeground}
              value={message}
              onChangeText={setMessage}
              multiline
            />
          </View>

          {/* Generate Button */}
          <Pressable
            style={({ pressed }) => [
              styles.generateBtn,
              { opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] },
            ]}
            onPress={handleGenerate}
          >
            <HugeiconsIcon icon={WhatsappIcon} size={18} color="#FFFFFF" strokeWidth={2.2} />
            <Text style={styles.generateBtnText}>Generate WhatsApp Link</Text>
          </Pressable>
        </View>

        {/* Live WhatsApp Chat Bubble Preview */}
        <View style={styles.previewContainer}>
          <View style={styles.previewHeaderRow}>
            <View style={styles.previewBadge}>
              <HugeiconsIcon icon={BubbleChatIcon} size={14} color="#16A34A" />
              <Text style={styles.previewBadgeText}>CLIENT CHAT PREVIEW</Text>
            </View>
            <Text style={styles.previewPhoneHint}>+{currentFullPhone}</Text>
          </View>

          {/* Simulated WhatsApp Chat Room */}
          <View style={styles.chatWall}>
            <View style={styles.chatBubbleOutgoing}>
              <Text style={styles.chatBubbleText}>
                {message.trim() || 'Hi! I would like to get in touch.'}
              </Text>
              <View style={styles.chatMetaRow}>
                <Text style={styles.chatTime}>10:45 AM</Text>
                <Text style={styles.chatTicks}>✓✓</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Generated Result Section */}
        {generatedUrl ? (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.resultStatusBadge}>
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={13} color="#16A34A" />
                <Text style={styles.resultStatusText}>READY TO SHARE</Text>
              </View>
              <Pressable
                onPress={() => setShowQr(!showQr)}
                style={[styles.qrToggleBtn, showQr && styles.qrToggleBtnActive]}
              >
                <HugeiconsIcon
                  icon={QrCode01Icon}
                  size={15}
                  color={showQr ? colors.accent : colors.textSecondary}
                />
                <Text style={[styles.qrToggleText, showQr && { color: colors.accent, fontWeight: '700' }]}>
                  {showQr ? 'Hide QR' : 'Show QR'}
                </Text>
              </Pressable>
            </View>

            {/* Generated URL Box */}
            <View style={styles.urlContainer}>
              <Text style={styles.urlText} numberOfLines={2} selectable>
                {generatedUrl}
              </Text>
            </View>

            {/* Scannable WhatsApp QR Code */}
            {showQr && (
              <View style={styles.qrExpandWrapper}>
                <View style={styles.qrFrameInner}>
                  <QRCode value={generatedUrl} size={160} color="#16A34A" backgroundColor="#FFFFFF" />
                </View>
                <Text style={styles.qrScanHint}>Scan to open WhatsApp conversation directly</Text>
              </View>
            )}

            {/* 3 Action Buttons */}
            <View style={styles.actionsRow}>
              <Pressable
                style={styles.actionBtnPrimary}
                onPress={handleOpenWhatsApp}
              >
                <HugeiconsIcon icon={WhatsappIcon} size={16} color="#FFFFFF" />
                <Text style={styles.actionBtnPrimaryText}>Chat Now</Text>
              </Pressable>

              <Pressable
                style={styles.actionBtnSecondary}
                onPress={() => handleCopy(generatedUrl)}
              >
                <HugeiconsIcon
                  icon={copied ? CheckmarkCircle01Icon : Copy01Icon}
                  size={16}
                  color={copied ? '#16A34A' : colors.text}
                />
                <Text style={styles.actionBtnSecondaryText}>{copied ? 'Copied!' : 'Copy Link'}</Text>
              </Pressable>

              <Pressable
                style={styles.actionBtnOutline}
                onPress={handleShare}
              >
                <HugeiconsIcon icon={Share01Icon} size={16} color={colors.text} />
                <Text style={styles.actionBtnOutlineText}>Share</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

const createStyles = (colors: AppColors, isDark: boolean) =>
  StyleSheet.create({
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 18,
      marginBottom: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.cardBorder,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    },
    headerIconBubble: {
      width: 40,
      height: 40,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.foreground,
    },
    cardSubtitle: {
      fontSize: 12,
      color: colors.mutedForeground,
      marginTop: 2,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.foreground,
      marginBottom: 6,
    },
    countryScroll: {
      gap: 8,
      paddingVertical: 4,
      marginBottom: 4,
    },
    countryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 11,
      paddingVertical: 7,
      borderRadius: 11,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.surfaceSecondary,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border,
    },
    countryChipActive: {
      backgroundColor: colors.buttonPrimary,
      borderColor: colors.buttonPrimary,
    },
    countryChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    countryChipTextActive: {
      color: colors.buttonPrimaryForeground,
      fontWeight: '700',
    },
    inputGroup: {
      gap: 6,
    },
    inputBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : colors.cardBorder,
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: Platform.OS === 'ios' ? 10 : 7,
    },
    countryPrefixBox: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.surfaceSecondary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    countryPrefixText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.foreground,
    },
    textInput: {
      flex: 1,
      fontSize: 14,
      color: colors.foreground,
      padding: 0,
    },
    templateScroll: {
      gap: 6,
      paddingVertical: 4,
      marginBottom: 4,
    },
    templateChip: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.surfaceSecondary,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border,
    },
    templateChipText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    textInputArea: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : colors.cardBorder,
      borderRadius: 14,
      padding: 12,
      fontSize: 14,
      color: colors.foreground,
      textAlignVertical: 'top',
    },
    generateBtn: {
      marginTop: 18,
      backgroundColor: '#16A34A',
      paddingVertical: 14,
      borderRadius: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      shadowColor: '#16A34A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 10,
      elevation: 3,
    },
    generateBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    previewContainer: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 16,
      marginBottom: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.cardBorder,
    },
    previewHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    previewBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(22, 163, 74, 0.12)',
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 999,
    },
    previewBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.6,
      color: '#16A34A',
    },
    previewPhoneHint: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.mutedForeground,
    },
    chatWall: {
      backgroundColor: isDark ? '#0B141A' : '#EFEAE2',
      borderRadius: 18,
      padding: 14,
      minHeight: 90,
      justifyContent: 'center',
    },
    chatBubbleOutgoing: {
      backgroundColor: isDark ? '#005C4B' : '#E7FFDB',
      alignSelf: 'flex-end',
      borderRadius: 14,
      borderTopRightRadius: 2,
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 6,
      maxWidth: '85%',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 1,
    },
    chatBubbleText: {
      fontSize: 13.5,
      lineHeight: 18,
      color: isDark ? '#E9EDEF' : '#111B21',
    },
    chatMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 4,
      marginTop: 3,
    },
    chatTime: {
      fontSize: 10,
      color: isDark ? 'rgba(233, 237, 239, 0.6)' : '#667781',
    },
    chatTicks: {
      fontSize: 11,
      fontWeight: '700',
      color: '#53BDEB',
    },
    resultCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.cardBorder,
    },
    resultHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    resultStatusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(22, 163, 74, 0.12)',
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 999,
    },
    resultStatusText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.6,
      color: '#16A34A',
    },
    qrToggleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.surfaceSecondary,
      paddingHorizontal: 9,
      paddingVertical: 4.5,
      borderRadius: 10,
    },
    qrToggleBtnActive: {
      backgroundColor: colors.accentSoft,
    },
    qrToggleText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    urlContainer: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.surfaceSecondary,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 14,
      marginBottom: 14,
    },
    urlText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.foreground,
    },
    qrExpandWrapper: {
      alignItems: 'center',
      paddingVertical: 12,
      marginBottom: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.cardBorder,
    },
    qrFrameInner: {
      backgroundColor: '#FFFFFF',
      padding: 12,
      borderRadius: 16,
      shadowColor: '#29213E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 3,
      marginBottom: 8,
    },
    qrScanHint: {
      fontSize: 11,
      color: colors.mutedForeground,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    actionBtnPrimary: {
      flex: 1.2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: '#16A34A',
      paddingVertical: 12,
      borderRadius: 14,
    },
    actionBtnPrimaryText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    actionBtnSecondary: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.accentSoft,
      paddingVertical: 12,
      borderRadius: 14,
    },
    actionBtnSecondaryText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    actionBtnOutline: {
      flex: 0.8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: 'transparent',
      borderWidth: 1.2,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : colors.cardBorder,
      paddingVertical: 12,
      borderRadius: 14,
    },
    actionBtnOutlineText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
  });
