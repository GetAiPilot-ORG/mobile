import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Share,
} from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';

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
    <AppScreen safeArea={false} className="flex-1 bg-[#0B0D10]">
      <AppTopBar title="Instant Link Shortener" subtitle="Custom Slugs & Analytics" showBack={true} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View className="rounded-2xl p-4 mb-4 border border-[#262930] bg-[#181A1F]">
          <Text className="text-base font-black text-white mb-1">Shorten Any URL</Text>
          <Text className="text-xs text-slate-400 leading-4 mb-4">
            Transform long, complex URLs into concise branded links optimized for campaigns and SMS.
          </Text>

          <Text className="text-xs font-bold text-slate-300 mb-1.5">Long Destination URL</Text>
          <TextInput
            className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2.5 text-xs text-white mb-3"
            placeholder="https://example.com/very/long/landing-page-path"
            placeholderTextColor="#64748B"
            value={destinationUrl}
            onChangeText={setDestinationUrl}
            autoCapitalize="none"
          />

          <Text className="text-xs font-bold text-slate-300 mb-1.5">Custom Alias / Slug (Optional)</Text>
          <TextInput
            className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2.5 text-xs text-white mb-4"
            placeholder="e.g. promo-2026"
            placeholderTextColor="#64748B"
            value={customAlias}
            onChangeText={setCustomAlias}
            autoCapitalize="none"
          />

          <Pressable className="py-3.5 rounded-xl items-center bg-[#0084FF]" onPress={handleShorten}>
            <Text className="text-xs font-extrabold text-white">Create Short Link ⚡</Text>
          </Pressable>
        </View>

        {shortUrl ? (
          <View className="rounded-2xl p-4 border border-[#0084FF]/40 bg-[#181A1F]">
            <Text className="text-xs font-bold text-white mb-2">Your Shortened Link:</Text>
            <View className="p-3 rounded-lg bg-[#111317] border border-[#262930] mb-3">
              <Text className="text-sm font-extrabold text-[#0084FF]">{shortUrl}</Text>
            </View>

            <View className="flex-row justify-between items-center mb-3.5 px-1">
              <Text className="text-xs text-slate-400">Total Clicks Tracked:</Text>
              <Text className="text-sm font-black text-white">{clickCount}</Text>
            </View>

            <Pressable className="py-3 rounded-xl items-center bg-[#0084FF]" onPress={handleShare}>
              <Text className="text-xs font-bold text-white">Share Link 🔗</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}
