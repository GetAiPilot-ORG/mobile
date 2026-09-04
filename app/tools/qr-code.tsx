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
  Image,
} from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { colors } from '../../src/theme/colors';

export default function QRCodeGeneratorScreen() {
  const [content, setContent] = useState('https://getaipilot.in');
  const [qrType, setQrType] = useState<'url' | 'text' | 'wifi'>('url');
  const [generatedQrUri, setGeneratedQrUri] = useState('https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://getaipilot.in');

  const handleGenerate = () => {
    if (!content.trim()) {
      Alert.alert('Validation Error', 'Please enter text or a URL to generate a QR code.');
      return;
    }

    const encoded = encodeURIComponent(content.trim());
    const uri = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encoded}&color=003C33&bgcolor=FFFFFF`;
    setGeneratedQrUri(uri);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this QR code content: ${content}`,
      });
    } catch (e: any) {
      console.error(e);
    }
  };

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar title="QR Code Generator" subtitle="High-Resolution Custom QR Codes" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>QR Code Generator</Text>
          <Text style={styles.cardSubtitle}>
            Convert website links, Wi-Fi networks, and contact cards into scannable QR codes instantly.
          </Text>

          <View style={styles.typeTabs}>
            {(['url', 'text', 'wifi'] as const).map((t) => (
              <Pressable
                key={t}
                style={[styles.typeTab, qrType === t && styles.typeTabActive]}
                onPress={() => setQrType(t)}
              >
                <Text style={[styles.typeTabText, qrType === t && styles.typeTabTextActive]}>
                  {t.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.inputLabel}>
            {qrType === 'url' ? 'Target Website URL' : qrType === 'wifi' ? 'Wi-Fi Network Name & Password' : 'Text Content'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder={qrType === 'url' ? 'https://yourwebsite.com' : 'Enter content here...'}
            placeholderTextColor={colors.mutedForeground}
            value={content}
            onChangeText={setContent}
            autoCapitalize="none"
          />

          <Pressable style={styles.generateBtn} onPress={handleGenerate}>
            <Text style={styles.generateBtnText}>Generate Custom QR Code 📱</Text>
          </Pressable>
        </View>

        {generatedQrUri ? (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Scan with Camera</Text>
            
            <View style={styles.qrWrapper}>
              <Image
                source={{ uri: generatedQrUri }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.qrPayload} numberOfLines={1}>
              Payload: {content}
            </Text>

            <Pressable style={styles.shareBtn} onPress={handleShare}>
              <Text style={styles.shareBtnText}>Share Content Link 📤</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.foreground,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.mutedForeground,
    lineHeight: 18,
    marginBottom: 16,
  },
  typeTabs: {
    flexDirection: 'row',
    backgroundColor: colors.muted,
    borderRadius: 8,
    padding: 3,
    marginBottom: 14,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 6,
  },
  typeTabActive: {
    backgroundColor: colors.surface,
  },
  typeTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedForeground,
  },
  typeTabTextActive: {
    color: colors.foreground,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.foreground,
    marginBottom: 14,
  },
  generateBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  generateBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14.5,
  },
  previewCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.foreground,
    marginBottom: 16,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  qrPayload: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginBottom: 16,
  },
  shareBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
