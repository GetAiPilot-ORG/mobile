import React, { useState } from 'react';
import {
  View,
  Text,
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
  { name: 'Classic Dark', color: '#000000', dotColor: '#000000' },
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
  const [qrType, setQrType] = useState<QRType>('url');
  const [selectedColor, setSelectedColor] = useState<QRColorOption>(QR_COLORS[0]);

  // Form Fields
  const [url, setUrl] = useState('https://getaipilot.in');
  const [waPhone, setWaPhone] = useState('919876543210');
  const [waMessage, setWaMessage] = useState('Hi! I want to learn more about GetAiPilot.');
  const [upiVpa, setUpiVpa] = useState('business@upi');
  const [upiName, setUpiName] = useState('GetAiPilot Enterprise');
  const [upiAmount, setUpiAmount] = useState('999');
  const [wifiSsid, setWifiSsid] = useState('GetAiPilot_Guest');
  const [wifiPass, setWifiPass] = useState('Welcome@2026');
  const [contactName, setContactName] = useState('Alex Smith');
  const [contactPhone, setContactPhone] = useState('+91 98765 43210');
  const [contactEmail, setContactEmail] = useState('alex@getaipilot.in');
  const [textContent, setTextContent] = useState('Scan to unlock VIP GetAiPilot discount coupon: PILOT50');

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
    <AppScreen safeArea={false} className="flex-1 bg-[#0B0D10]">
      <AppTopBar title="QR Code Studio" subtitle="High-Resolution Custom QR Generator" showBack={true} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Category Selector Grid */}
        <View className="rounded-2xl p-4 mb-4 border border-[#262930] bg-[#181A1F]">
          <Text className="text-sm font-black text-white mb-1">1. Choose QR Category</Text>
          <Text className="text-xs text-slate-400 mb-3.5 leading-4">
            Select the type of content you want encoded into your high-resolution QR code.
          </Text>

          <View className="flex-row flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                className={`w-[31%] py-3 items-center rounded-xl border gap-1 ${
                  qrType === cat.id ? 'bg-[#0084FF] border-[#0084FF]' : 'bg-[#111317] border-[#262930]'
                }`}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setQrType(cat.id);
                }}
              >
                <Text className="text-xl">{cat.icon}</Text>
                <Text
                  className={`text-xs font-bold ${
                    qrType === cat.id ? 'text-white' : 'text-slate-300'
                  }`}
                >
                  {cat.title}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Dynamic Inputs */}
        <View className="rounded-2xl p-4 mb-4 border border-[#262930] bg-[#181A1F]">
          <Text className="text-sm font-black text-white mb-3">2. Enter Details</Text>

          {qrType === 'url' && (
            <View>
              <Text className="text-xs font-bold text-slate-300 mb-1">Website URL</Text>
              <TextInput
                className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2 text-xs text-white"
                value={url}
                onChangeText={setUrl}
                placeholder="https://yourwebsite.com"
                placeholderTextColor="#64748B"
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
          )}

          {qrType === 'whatsapp' && (
            <View>
              <Text className="text-xs font-bold text-slate-300 mb-1">WhatsApp Number (with Country Code)</Text>
              <TextInput
                className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2 text-xs text-white mb-3"
                value={waPhone}
                onChangeText={setWaPhone}
                placeholder="919876543210"
                placeholderTextColor="#64748B"
                keyboardType="phone-pad"
              />

              <Text className="text-xs font-bold text-slate-300 mb-1">Prefilled Message</Text>
              <TextInput
                className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2 text-xs text-white h-20"
                value={waMessage}
                onChangeText={setWaMessage}
                placeholder="Hi! I am interested in..."
                placeholderTextColor="#64748B"
                multiline
                textAlignVertical="top"
              />
            </View>
          )}

          {qrType === 'upi' && (
            <View>
              <Text className="text-xs font-bold text-slate-300 mb-1">UPI ID (VPA)</Text>
              <TextInput
                className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2 text-xs text-white mb-3"
                value={upiVpa}
                onChangeText={setUpiVpa}
                placeholder="merchant@okhdfcbank"
                placeholderTextColor="#64748B"
                autoCapitalize="none"
              />

              <Text className="text-xs font-bold text-slate-300 mb-1">Payee Business Name</Text>
              <TextInput
                className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2 text-xs text-white mb-3"
                value={upiName}
                onChangeText={setUpiName}
                placeholder="GetAiPilot Store"
                placeholderTextColor="#64748B"
              />

              <Text className="text-xs font-bold text-slate-300 mb-1">Fixed Amount (₹ INR - Optional)</Text>
              <TextInput
                className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2 text-xs text-white"
                value={upiAmount}
                onChangeText={setUpiAmount}
                placeholder="499"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
              />
            </View>
          )}

          {qrType === 'wifi' && (
            <View>
              <Text className="text-xs font-bold text-slate-300 mb-1">Wi-Fi Network Name (SSID)</Text>
              <TextInput
                className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2 text-xs text-white mb-3"
                value={wifiSsid}
                onChangeText={setWifiSsid}
                placeholder="Office_5G_Guest"
                placeholderTextColor="#64748B"
                autoCapitalize="none"
              />

              <Text className="text-xs font-bold text-slate-300 mb-1">Wi-Fi Password</Text>
              <TextInput
                className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2 text-xs text-white"
                value={wifiPass}
                onChangeText={setWifiPass}
                placeholder="SecurityPassword123"
                placeholderTextColor="#64748B"
                autoCapitalize="none"
                secureTextEntry
              />
            </View>
          )}

          {qrType === 'contact' && (
            <View>
              <Text className="text-xs font-bold text-slate-300 mb-1">Full Name</Text>
              <TextInput
                className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2 text-xs text-white mb-3"
                value={contactName}
                onChangeText={setContactName}
                placeholder="Sarah Connor"
                placeholderTextColor="#64748B"
              />

              <Text className="text-xs font-bold text-slate-300 mb-1">Phone Number</Text>
              <TextInput
                className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2 text-xs text-white mb-3"
                value={contactPhone}
                onChangeText={setContactPhone}
                placeholder="+91 98765 43210"
                placeholderTextColor="#64748B"
                keyboardType="phone-pad"
              />

              <Text className="text-xs font-bold text-slate-300 mb-1">Email Address</Text>
              <TextInput
                className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2 text-xs text-white"
                value={contactEmail}
                onChangeText={setContactEmail}
                placeholder="sarah@skynet.ai"
                placeholderTextColor="#64748B"
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          )}

          {qrType === 'text' && (
            <View>
              <Text className="text-xs font-bold text-slate-300 mb-1">Plain Text / Note</Text>
              <TextInput
                className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2 text-xs text-white h-24"
                value={textContent}
                onChangeText={setTextContent}
                placeholder="Type your message, secret code, or note..."
                placeholderTextColor="#64748B"
                multiline
                textAlignVertical="top"
              />
            </View>
          )}

          {/* Color Customizer */}
          <Text className="text-xs font-bold text-slate-300 mb-2 mt-4">3. Custom QR Code Color</Text>
          <View className="flex-row gap-3">
            {QR_COLORS.map((c, i) => (
              <Pressable
                key={i}
                className={`w-9 h-9 rounded-full justify-center items-center ${
                  selectedColor.color === c.color ? 'border-2 border-white scale-110' : ''
                }`}
                style={{ backgroundColor: c.color }}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedColor(c);
                }}
              >
                {selectedColor.color === c.color && (
                  <Text className="text-white text-xs font-bold">✓</Text>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Canvas */}
        {payload ? (
          <View className="rounded-2xl p-5 items-center border border-[#262930] bg-[#181A1F]">
            <Text className="text-base font-black text-white text-center mb-1">Scannable QR Code ✨</Text>
            <Text className="text-xs text-slate-400 text-center mb-4 leading-4">
              High-resolution vector SVG ready for instant mobile scanning and printing.
            </Text>

            <View className="bg-white p-4 rounded-2xl mb-4 shadow-lg">
              <QRCode
                value={payload}
                size={200}
                color={selectedColor.color}
                backgroundColor="#FFFFFF"
              />
            </View>

            <View className="flex-row gap-2 w-full">
              <Pressable
                className="flex-1 py-3 rounded-xl items-center bg-[#0084FF]"
                onPress={handleShare}
              >
                <Text className="text-xs font-bold text-white">Share QR 📤</Text>
              </Pressable>

              <Pressable
                className="flex-1 py-3 rounded-xl items-center border border-[#262930] bg-[#111317]"
                onPress={handleCopyPayload}
              >
                <Text className="text-xs font-bold text-white">Copy Link 📋</Text>
              </Pressable>

              <Pressable
                className="flex-1 py-3 rounded-xl items-center bg-[#25D366]"
                onPress={handleTestPayload}
              >
                <Text className="text-xs font-bold text-black">Test Link 🔗</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}
