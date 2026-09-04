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
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { colors } from '../../src/theme/colors';

export default function WhatsAppLinkGeneratorScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [prefilledMessage, setPrefilledMessage] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');

  const handleGenerate = () => {
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
    if (!cleanNumber) {
      Alert.alert('Validation Error', 'Please enter a valid phone number with country code (e.g. 919876543210).');
      return;
    }

    const encodedMsg = encodeURIComponent(prefilledMessage.trim());
    const url = encodedMsg
      ? `https://wa.me/${cleanNumber}?text=${encodedMsg}`
      : `https://wa.me/${cleanNumber}`;

    setGeneratedUrl(url);
  };

  const handleShare = async () => {
    if (!generatedUrl) return;
    try {
      await Share.share({
        message: generatedUrl,
        title: 'WhatsApp Direct Chat Link',
      });
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleTestLink = () => {
    if (generatedUrl) {
      Linking.openURL(generatedUrl);
    }
  };

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar title="WhatsApp Link Generator" subtitle="Direct Click-to-Chat URL" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create WhatsApp Link</Text>
          <Text style={styles.cardSubtitle}>
            Generate a custom URL that allows customers to start a chat with you instantly without saving your phone number.
          </Text>

          <Text style={styles.inputLabel}>WhatsApp Phone Number (with Country Code)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 919876543210"
            placeholderTextColor={colors.mutedForeground}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />

          <Text style={styles.inputLabel}>Prefilled Message (Optional)</Text>
          <TextInput
            style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
            placeholder="Hi! I am interested in learning more about your services."
            placeholderTextColor={colors.mutedForeground}
            value={prefilledMessage}
            onChangeText={setPrefilledMessage}
            multiline
          />

          <Pressable style={styles.generateBtn} onPress={handleGenerate}>
            <Text style={styles.generateBtnText}>Generate WhatsApp Link ✨</Text>
          </Pressable>
        </View>

        {generatedUrl ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Your Direct Chat Link:</Text>
            <View style={styles.urlBox}>
              <Text style={styles.urlText} numberOfLines={2}>
                {generatedUrl}
              </Text>
            </View>

            <View style={styles.btnRow}>
              <Pressable style={styles.actionBtnShare} onPress={handleShare}>
                <Text style={styles.btnText}>Share Link 🔗</Text>
              </Pressable>
              <Pressable style={styles.actionBtnTest} onPress={handleTestLink}>
                <Text style={styles.btnText}>Open in WhatsApp 💬</Text>
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
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 6,
    marginTop: 6,
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
    marginBottom: 12,
  },
  generateBtn: {
    backgroundColor: colors.products.whatsapp,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  generateBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14.5,
  },
  resultCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.products.whatsapp,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.foreground,
    marginBottom: 8,
  },
  urlBox: {
    backgroundColor: colors.muted,
    padding: 12,
    borderRadius: 8,
    marginBottom: 14,
  },
  urlText: {
    fontSize: 13,
    color: colors.foreground,
    fontFamily: 'monospace',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtnShare: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnTest: {
    flex: 1,
    backgroundColor: colors.products.whatsapp,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
