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

export default function LinkShortenerScreen() {
  const [destinationUrl, setDestinationUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [clickCount, setClickCount] = useState(0);

  const handleShorten = () => {
    if (!destinationUrl.trim() || !destinationUrl.startsWith('http')) {
      Alert.alert('Validation Error', 'Please enter a valid destination URL starting with http:// or https://');
      return;
    }

    const alias = customAlias.trim() || Math.random().toString(36).substring(2, 7);
    const generated = `https://gap.to/${alias}`;
    setShortUrl(generated);
    setClickCount(0);
  };

  const handleShare = async () => {
    if (!shortUrl) return;
    try {
      await Share.share({
        message: shortUrl,
        title: 'Shortened Link',
      });
    } catch (e: any) {
      console.error(e);
    }
  };

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar title="Instant Link Shortener" subtitle="Custom Slugs & Analytics" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Shorten Any URL</Text>
          <Text style={styles.cardSubtitle}>
            Transform long, complex URLs into concise branded links optimized for campaigns and SMS.
          </Text>

          <Text style={styles.inputLabel}>Long Destination URL</Text>
          <TextInput
            style={styles.input}
            placeholder="https://example.com/very/long/landing-page-path"
            placeholderTextColor={colors.mutedForeground}
            value={destinationUrl}
            onChangeText={setDestinationUrl}
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>Custom Alias / Slug (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. promo-2026"
            placeholderTextColor={colors.mutedForeground}
            value={customAlias}
            onChangeText={setCustomAlias}
            autoCapitalize="none"
          />

          <Pressable style={styles.shortenBtn} onPress={handleShorten}>
            <Text style={styles.shortenBtnText}>Create Short Link ⚡</Text>
          </Pressable>
        </View>

        {shortUrl ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Your Shortened Link:</Text>
            <View style={styles.shortBox}>
              <Text style={styles.shortText}>{shortUrl}</Text>
            </View>

            <View style={styles.statsBar}>
              <Text style={styles.statsLabel}>Total Clicks Tracked:</Text>
              <Text style={styles.statsValue}>{clickCount}</Text>
            </View>

            <Pressable style={styles.shareBtn} onPress={handleShare}>
              <Text style={styles.shareBtnText}>Share Link 🔗</Text>
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
  shortenBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  shortenBtnText: {
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
  shortBox: {
    backgroundColor: colors.muted,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  shortText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  statsLabel: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
  statsValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.foreground,
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
