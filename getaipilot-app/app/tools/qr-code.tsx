import React, { useState } from 'react';
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
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { useTheme, getColors } from '@/theme';

type QRType = 'url' | 'whatsapp' | 'upi' | 'wifi' | 'contact' | 'text';

interface QRColorOption {
  name: string;
  color: string;
  dotColor: string;
}

const QR_COLORS: QRColorOption[] = [
  { name: 'Brand Blue', color: '#0084FF', dotColor: '#0084FF' },
  { name: 'Emerald', color: '#10B981', dotColor: '#10B981' },
  { name: 'Royal Purple', color: '#8B5CF6', dotColor: '#8B5CF6' },
  { name: 'Crimson', color: '#E11D48', dotColor: '#E11D48' },
  { name: 'Classic Dark', color: '#0F172A', dotColor: '#0F172A' },
];

const CATEGORIES: { id: QRType; title: string; icon: string }[] = [
  { id: 'url', title: 'Website', icon: '🔗' },
  { id: 'whatsapp', title: 'WhatsApp', icon: '💬' },
  { id: 'upi', title: 'UPI Pay', icon: '💳' },
  { id: 'wifi', title: 'Wi-Fi', icon: '📶' },
  { id: 'contact', title: 'Contact', icon: '👤' },
  { id: 'text', title: 'Text Note', icon: '📝' },
];

export default function QRCodeGeneratorScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const [qrType, setQrType] = useState<QRType>('url');
  const [selectedColor, setSelectedColor] = useState<QRColorOption>(QR_COLORS[0]);

  // Form Fields
  const [url, setUrl] = useState('https://getaipilot.in');
  
  // WhatsApp
  const [waPhone, setWaPhone] = useState('919876543210');
  const [waMessage, setWaMessage] = useState('Hi! I want to learn more about GetAiPilot.');

  // UPI
  const [upiVpa, setUpiVpa] = useState('business@upi');
  const [upiName, setUpiName] = useState('GetAiPilot Enterprise');
  const [upiAmount, setUpiAmount] = useState('999');

  // Wi-Fi
  const [wifiSsid, setWifiSsid] = useState('GetAiPilot_Guest');
  const [wifiPass, setWifiPass] = useState('Welcome@2026');

  // Contact vCard
  const [contactName, setContactName] = useState('Alex Smith');
  const [contactPhone, setContactPhone] = useState('+91 98765 43210');
  const [contactEmail, setContactEmail] = useState('alex@getaipilot.in');

  // Text
  const [textContent, setTextContent] = useState('Scan to unlock VIP GetAiPilot discount coupon: PILOT50');

  // Dynamic Theme Mapping
  const theme = {
    bg: colors.background,
    card: colors.card,
    cardBorder: colors.border,
    text: colors.foreground,
    mutedText: colors.mutedForeground,
    inputBg: isDark ? '#141416' : '#FFFFFF',
    inputBorder: colors.border,
    primary: colors.primary,
  };

  // Compute final QR payload
  const getQRValue = (): string => {
    switch (qrType) {
      case 'url':
        return url.trim();
      case 'whatsapp': {
        const cleanNumber = waPhone.replace(/[^0-9]/g, '');
        const encoded = encodeURIComponent(waMessage.trim());
        return encoded ? `https://wa.me/${cleanNumber}?text=${encoded}` : `https://wa.me/${cleanNumber}`;
      }
      case 'upi':
        return `upi://pay?pa=${upiVpa.trim()}&pn=${encodeURIComponent(upiName.trim())}${upiAmount ? `&am=${upiAmount.trim()}` : ''}&cu=INR`;
      case 'wifi':
        return `WIFI:T:WPA;S:${wifiSsid.trim()};P:${wifiPass};;`;
      case 'contact':
        return `BEGIN:VCARD\nVERSION:3.0\nN:${contactName}\nTEL:${contactPhone}\nEMAIL:${contactEmail}\nEND:VCARD`;
      case 'text':
        return textContent.trim();
      default:
        return 'https://getaipilot.in';
    }
  };

  const payload = getQRValue();

  const handleCopyPayload = async () => {
    if (!payload) return;
    await Clipboard.setStringAsync(payload);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied! 📋', 'QR Code payload copied to clipboard.');
  };

  const handleShare = async () => {
    if (!payload) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        message: `📱 Scannable QR Code Data:\n\n${payload}\n\nGenerated with GetAiPilot Mobile.`,
      });
    } catch {}
  };

  const handleTestPayload = () => {
    if (qrType === 'url' || qrType === 'whatsapp') {
      Linking.openURL(payload).catch(() => {
        Alert.alert('Unable to Open', 'The generated link could not be opened on this device.');
      });
    } else {
      Alert.alert('Scannable Code Ready', 'Point any smartphone camera at the QR code above to trigger action.');
    }
  };

  return (
    <AppScreen safeArea={false} backgroundColor={theme.bg}>
      <AppTopBar title="QR Code Studio" subtitle="High-Resolution Custom QR Generator" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Category Selector Grid */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>1. Choose QR Category</Text>
          <Text style={[styles.cardSubtitle, { color: theme.mutedText }]}>
            Select the type of content you want encoded into your high-resolution QR code.
          </Text>

          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                style={[
                  styles.categoryBtn,
                  {
                    backgroundColor: qrType === cat.id ? theme.primary : isDark ? '#141416' : '#F3F4F6',
                    borderColor: qrType === cat.id ? theme.primary : theme.cardBorder,
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setQrType(cat.id);
                }}
              >
                <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.categoryBtnText,
                    { color: qrType === cat.id ? '#FFFFFF' : theme.text },
                  ]}
                >
                  {cat.title}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Dynamic Inputs Based on Selected Category */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>2. Enter Details</Text>

          {qrType === 'url' && (
            <View>
              <Text style={[styles.inputLabel, { color: theme.mutedText }]}>Website URL</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                value={url}
                onChangeText={setUrl}
                placeholder="https://yourwebsite.com"
                placeholderTextColor={theme.mutedText}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
          )}

          {qrType === 'whatsapp' && (
            <View>
              <Text style={[styles.inputLabel, { color: theme.mutedText }]}>WhatsApp Number (with Country Code)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                value={waPhone}
                onChangeText={setWaPhone}
                placeholder="919876543210"
                placeholderTextColor={theme.mutedText}
                keyboardType="phone-pad"
              />

              <Text style={[styles.inputLabel, { color: theme.mutedText, marginTop: 10 }]}>Prefilled Message</Text>
              <TextInput
                style={[styles.input, { height: 75, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                value={waMessage}
                onChangeText={setWaMessage}
                placeholder="Hi! I am interested in..."
                placeholderTextColor={theme.mutedText}
                multiline
              />
            </View>
          )}

          {qrType === 'upi' && (
            <View>
              <Text style={[styles.inputLabel, { color: theme.mutedText }]}>UPI ID (VPA)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                value={upiVpa}
                onChangeText={setUpiVpa}
                placeholder="merchant@okhdfcbank"
                placeholderTextColor={theme.mutedText}
                autoCapitalize="none"
              />

              <Text style={[styles.inputLabel, { color: theme.mutedText, marginTop: 10 }]}>Payee Business Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                value={upiName}
                onChangeText={setUpiName}
                placeholder="GetAiPilot Store"
                placeholderTextColor={theme.mutedText}
              />

              <Text style={[styles.inputLabel, { color: theme.mutedText, marginTop: 10 }]}>Fixed Amount (₹ INR - Optional)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                value={upiAmount}
                onChangeText={setUpiAmount}
                placeholder="499"
                placeholderTextColor={theme.mutedText}
                keyboardType="numeric"
              />
            </View>
          )}

          {qrType === 'wifi' && (
            <View>
              <Text style={[styles.inputLabel, { color: theme.mutedText }]}>Wi-Fi Network Name (SSID)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                value={wifiSsid}
                onChangeText={setWifiSsid}
                placeholder="Office_5G_Guest"
                placeholderTextColor={theme.mutedText}
                autoCapitalize="none"
              />

              <Text style={[styles.inputLabel, { color: theme.mutedText, marginTop: 10 }]}>Wi-Fi Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                value={wifiPass}
                onChangeText={setWifiPass}
                placeholder="SecurityPassword123"
                placeholderTextColor={theme.mutedText}
                autoCapitalize="none"
                secureTextEntry
              />
            </View>
          )}

          {qrType === 'contact' && (
            <View>
              <Text style={[styles.inputLabel, { color: theme.mutedText }]}>Full Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                value={contactName}
                onChangeText={setContactName}
                placeholder="Sarah Connor"
                placeholderTextColor={theme.mutedText}
              />

              <Text style={[styles.inputLabel, { color: theme.mutedText, marginTop: 10 }]}>Phone Number</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                value={contactPhone}
                onChangeText={setContactPhone}
                placeholder="+91 98765 43210"
                placeholderTextColor={theme.mutedText}
                keyboardType="phone-pad"
              />

              <Text style={[styles.inputLabel, { color: theme.mutedText, marginTop: 10 }]}>Email Address</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                value={contactEmail}
                onChangeText={setContactEmail}
                placeholder="sarah@skynet.ai"
                placeholderTextColor={theme.mutedText}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          )}

          {qrType === 'text' && (
            <View>
              <Text style={[styles.inputLabel, { color: theme.mutedText }]}>Plain Text / Note</Text>
              <TextInput
                style={[styles.input, { height: 90, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                value={textContent}
                onChangeText={setTextContent}
                placeholder="Type your message, secret code, or note..."
                placeholderTextColor={theme.mutedText}
                multiline
              />
            </View>
          )}

          {/* Color Customizer */}
          <Text style={[styles.inputLabel, { color: theme.mutedText, marginTop: 16 }]}>3. Custom QR Code Color</Text>
          <View style={styles.colorPaletteRow}>
            {QR_COLORS.map((c, i) => (
              <Pressable
                key={i}
                style={[
                  styles.colorCircleBtn,
                  { backgroundColor: c.color },
                  selectedColor.color === c.color && styles.colorCircleBtnActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedColor(c);
                }}
              >
                {selectedColor.color === c.color && (
                  <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' }}>✓</Text>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── LIVE SCANNABLE QR CODE CANVAS ──────────────────────────── */}
        {payload ? (
          <View style={[styles.qrCanvasCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.cardTitle, { color: theme.text, textAlign: 'center', marginBottom: 4 }]}>
              Scannable QR Code ✨
            </Text>
            <Text style={[styles.cardSubtitle, { color: theme.mutedText, textAlign: 'center', marginBottom: 16 }]}>
              High-resolution vector SVG ready for instant mobile scanning and printing.
            </Text>

            {/* Framed QR Code Chassis */}
            <View style={styles.qrChassis}>
              <QRCode
                value={payload}
                size={220}
                color={selectedColor.color}
                backgroundColor="#FFFFFF"
              />
            </View>

            {/* 3-Action Button Bar */}
            <View style={styles.actionsRow}>
              <Pressable style={[styles.actionBtn, { backgroundColor: theme.primary }]} onPress={handleShare}>
                <Text style={styles.actionBtnText}>Share QR 📤</Text>
              </Pressable>

              <Pressable
                style={[styles.actionBtn, { backgroundColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}
                onPress={handleCopyPayload}
              >
                <Text style={[styles.actionBtnText, { color: theme.text }]}>Copy Link 📋</Text>
              </Pressable>

              <Pressable
                style={[styles.actionBtn, { backgroundColor: colors.products.whatsapp }]}
                onPress={handleTestPayload}
              >
                <Text style={styles.actionBtnText}>Test Link 🔗</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 50,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 14,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBtn: {
    width: '31%',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  categoryBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    borderWidth: 1,
  },
  colorPaletteRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  colorCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCircleBtnActive: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.1 }],
  },
  qrCanvasCard: {
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  qrChassis: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 16,
  },
  payloadBox: {
    width: '100%',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  payloadLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  payloadText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12.5,
  },
});
