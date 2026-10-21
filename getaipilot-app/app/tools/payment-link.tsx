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
  CreditCardIcon,
  Copy01Icon,
  Share01Icon,
  ArrowUpRight01Icon,
  CheckmarkCircle01Icon,
  QrCode01Icon,
  UserIcon,
} from '@/constants/icons';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { useTheme, getColors, AppColors } from '@/theme';

const QUICK_AMOUNTS = ['199', '499', '999', '1499', '2999', '4999'];

export default function PaymentLinkGeneratorScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [upiId, setUpiId] = useState('getaipilot@upi');
  const [payeeName, setPayeeName] = useState('GetAiPilot Hub');
  const [amount, setAmount] = useState('499');
  const [note, setNote] = useState('Services Payment');
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(true);

  // Computed UPI Payment URI
  const upiUri = useMemo(() => {
    const cleanUpi = upiId.trim();
    if (!cleanUpi) return '';
    const cleanAmount = amount.trim();
    const encodedName = encodeURIComponent(payeeName.trim() || 'Payee');
    const encodedNote = encodeURIComponent(note.trim() || 'Payment');

    let uri = `upi://pay?pa=${cleanUpi}&pn=${encodedName}&cu=INR`;
    if (cleanAmount && !isNaN(Number(cleanAmount))) {
      uri += `&am=${cleanAmount}`;
    }
    if (encodedNote) {
      uri += `&tn=${encodedNote}`;
    }
    return uri;
  }, [upiId, payeeName, amount, note]);

  const handleSelectAmount = (val: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAmount(val);
  };

  const handleOpenUPI = () => {
    if (!upiUri) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(upiUri).catch(() => {
      Alert.alert(
        'No UPI App Detected',
        'We could not find an installed UPI app (Google Pay, PhonePe, Paytm, or BHIM) on this device. You can still share the payment details or scan the QR code.'
      );
    });
  };

  const handleCopy = async () => {
    if (!upiUri) return;
    await Clipboard.setStringAsync(upiUri);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!upiUri) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        message: `UPI Payment Request: ₹${amount || '0'} to ${payeeName} (${upiId}).\n\nPay securely: ${upiUri}`,
        title: 'UPI Payment Request',
      });
    } catch {}
  };

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar title="UPI Payment Studio" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Creator Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.headerIconBubble}>
              <HugeiconsIcon icon={CreditCardIcon} size={19} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Create UPI Request</Text>
              <Text style={styles.cardSubtitle}>
                Instant zero-fee collection links for GPay, PhonePe, & Paytm
              </Text>
            </View>
          </View>

          {/* Recipient UPI ID */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Recipient UPI ID / VPA</Text>
            <View style={styles.inputBox}>
              <HugeiconsIcon icon={CreditCardIcon} size={18} color={colors.mutedForeground} />
              <TextInput
                style={styles.textInput}
                placeholder="merchant@upi or phone@paytm"
                placeholderTextColor={colors.mutedForeground}
                value={upiId}
                onChangeText={setUpiId}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Payee / Business Name */}
          <View style={[styles.inputGroup, { marginTop: 12 }]}>
            <Text style={styles.inputLabel}>Payee / Business Name</Text>
            <View style={styles.inputBox}>
              <HugeiconsIcon icon={UserIcon} size={18} color={colors.mutedForeground} />
              <TextInput
                style={styles.textInput}
                placeholder="Acme Enterprises"
                placeholderTextColor={colors.mutedForeground}
                value={payeeName}
                onChangeText={setPayeeName}
              />
            </View>
          </View>

          {/* Amount and Quick Amount Chips */}
          <View style={[styles.inputGroup, { marginTop: 12 }]}>
            <Text style={styles.inputLabel}>Requested Amount (₹ INR)</Text>
            <View style={styles.inputBox}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.foreground }}>₹</Text>
              <TextInput
                style={[styles.textInput, { fontSize: 16, fontWeight: '700' }]}
                placeholder="499"
                placeholderTextColor={colors.mutedForeground}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>

            {/* Quick Amount Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.amountScroll}
            >
              {QUICK_AMOUNTS.map((val) => {
                const active = amount === val;
                return (
                  <Pressable
                    key={val}
                    style={[styles.amountChip, active && styles.amountChipActive]}
                    onPress={() => handleSelectAmount(val)}
                  >
                    <Text
                      style={[
                        styles.amountChipText,
                        active && styles.amountChipTextActive,
                      ]}
                    >
                      ₹{val}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Payment Reference Note */}
          <View style={[styles.inputGroup, { marginTop: 10 }]}>
            <Text style={styles.inputLabel}>Payment Reference Note (Optional)</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Invoice #2041 or Consulting"
                placeholderTextColor={colors.mutedForeground}
                value={note}
                onChangeText={setNote}
              />
            </View>
          </View>
        </View>

        {/* Digital Payment Pass Preview */}
        <View style={styles.passCard}>
          <View style={styles.passHeader}>
            <View>
              <Text style={styles.passPayeeName}>{payeeName || 'Your Business'}</Text>
              <Text style={styles.passUpiId}>{upiId || 'yourname@upi'}</Text>
            </View>
            <View style={styles.upiBadge}>
              <Text style={styles.upiBadgeText}>BHIM UPI</Text>
            </View>
          </View>

          <View style={styles.amountHeroSection}>
            <Text style={styles.amountHeroCurrency}>₹</Text>
            <Text style={styles.amountHeroText}>{amount || '0'}</Text>
          </View>

          {note ? (
            <Text style={styles.passNoteText}>Note: {note}</Text>
          ) : null}

          {/* Embedded UPI QR Code */}
          {upiUri ? (
            <View style={styles.qrChassis}>
              <QRCode value={upiUri} size={150} color="#18181B" backgroundColor="#FFFFFF" />
              <Text style={styles.qrScanHint}>Scan with GPay, PhonePe, or Paytm</Text>
            </View>
          ) : null}

          {/* Action Dock */}
          <View style={styles.actionsRow}>
            <Pressable
              style={({ pressed }) => [
                styles.actionBtnPrimary,
                { opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
              ]}
              onPress={handleOpenUPI}
            >
              <HugeiconsIcon
                icon={CreditCardIcon}
                size={16}
                color={colors.buttonPrimaryForeground}
              />
              <Text style={styles.actionBtnPrimaryText}>Pay with App</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionBtnSecondary,
                { opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
              ]}
              onPress={handleCopy}
            >
              <HugeiconsIcon
                icon={copied ? CheckmarkCircle01Icon : Copy01Icon}
                size={16}
                color={copied ? '#10B981' : colors.text}
              />
              <Text style={styles.actionBtnSecondaryText}>
                {copied ? 'Copied!' : 'Copy Link'}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionBtnOutline,
                { opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
              ]}
              onPress={handleShare}
            >
              <HugeiconsIcon icon={Share01Icon} size={16} color={colors.text} />
              <Text style={styles.actionBtnOutlineText}>Share</Text>
            </Pressable>
          </View>
        </View>
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
      backgroundColor: colors.accentSoft,
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
    inputGroup: {
      gap: 6,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.foreground,
    },
    inputBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : colors.cardBorder,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === 'ios' ? 12 : 9,
    },
    textInput: {
      flex: 1,
      fontSize: 14,
      color: colors.foreground,
      padding: 0,
    },
    amountScroll: {
      gap: 8,
      paddingVertical: 6,
    },
    amountChip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.surfaceSecondary,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border,
    },
    amountChipActive: {
      backgroundColor: colors.buttonPrimary,
      borderColor: colors.buttonPrimary,
    },
    amountChipText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    amountChipTextActive: {
      color: colors.buttonPrimaryForeground,
    },
    passCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.cardBorder,
    },
    passHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    passPayeeName: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.foreground,
    },
    passUpiId: {
      fontSize: 12.5,
      fontWeight: '600',
      color: colors.accent,
      marginTop: 2,
    },
    upiBadge: {
      backgroundColor: colors.accentSoft,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 8,
    },
    upiBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: colors.accent,
    },
    amountHeroSection: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 3,
      marginVertical: 10,
    },
    amountHeroCurrency: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.foreground,
      marginTop: 4,
    },
    amountHeroText: {
      fontSize: 38,
      fontWeight: '900',
      letterSpacing: -1,
      color: colors.foreground,
    },
    passNoteText: {
      fontSize: 12,
      color: colors.mutedForeground,
      marginBottom: 14,
    },
    qrChassis: {
      backgroundColor: '#FFFFFF',
      padding: 14,
      borderRadius: 18,
      alignItems: 'center',
      alignSelf: 'center',
      shadowColor: '#29213E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
      marginBottom: 16,
    },
    qrScanHint: {
      fontSize: 11,
      fontWeight: '600',
      color: '#6B7280',
      marginTop: 8,
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
      backgroundColor: colors.buttonPrimary,
      paddingVertical: 12,
      borderRadius: 14,
    },
    actionBtnPrimaryText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.buttonPrimaryForeground,
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
