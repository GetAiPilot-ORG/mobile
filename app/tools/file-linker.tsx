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
} from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { colors } from '../../src/theme/colors';

export default function FileLinkerScreen() {
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [generatedShareUrl, setGeneratedShareUrl] = useState('');

  const handleGenerateLink = () => {
    if (!fileName.trim()) {
      Alert.alert('Validation Error', 'Please enter a filename or resource title.');
      return;
    }

    const slug = fileName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
    const link = `https://gap.to/f/${slug}-${Math.random().toString(36).substring(2, 6)}`;
    setGeneratedShareUrl(link);
  };

  const handleShare = async () => {
    if (!generatedShareUrl) return;
    try {
      await Share.share({
        message: `Download file "${fileName}": ${generatedShareUrl}`,
        title: 'Direct File Access Link',
      });
    } catch (e: any) {
      console.error(e);
    }
  };

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar title="File Linker" subtitle="Direct Shareable File URLs" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create Direct File Link</Text>
          <Text style={styles.cardSubtitle}>
            Generate branded, trackable download links for PDFs, presentations, lead magnets, and media assets.
          </Text>

          <Text style={styles.inputLabel}>File / Document Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 2026-Automation-Blueprint.pdf"
            placeholderTextColor={colors.mutedForeground}
            value={fileName}
            onChangeText={setFileName}
          />

          <Text style={styles.inputLabel}>Source Storage URL (Drive / Cloud)</Text>
          <TextInput
            style={styles.input}
            placeholder="https://drive.google.com/file/..."
            placeholderTextColor={colors.mutedForeground}
            value={fileUrl}
            onChangeText={setFileUrl}
            autoCapitalize="none"
          />

          <Pressable style={styles.generateBtn} onPress={handleGenerateLink}>
            <Text style={styles.generateBtnText}>Generate Shareable Link 📁</Text>
          </Pressable>
        </View>

        {generatedShareUrl ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Public Download Link Ready:</Text>
            <View style={styles.urlBox}>
              <Text style={styles.urlText}>{generatedShareUrl}</Text>
            </View>

            <Pressable style={styles.shareBtn} onPress={handleShare}>
              <Text style={styles.shareBtnText}>Share File Link 📤</Text>
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
    marginBottom: 12,
  },
  generateBtn: {
    backgroundColor: colors.primary,
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
    borderColor: colors.primary,
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
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  shareBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
