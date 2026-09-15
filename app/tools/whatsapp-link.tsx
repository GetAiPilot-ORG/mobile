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
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';

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
    <AppScreen safeArea={false} className="flex-1 bg-[#0B0D10]">
      <AppTopBar title="WhatsApp Link Generator" subtitle="Direct Click-to-Chat URL" showBack={true} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View className="rounded-2xl p-4 mb-4 border border-[#262930] bg-[#181A1F]">
          <Text className="text-base font-black text-white mb-1">Create WhatsApp Link</Text>
          <Text className="text-xs text-slate-400 leading-4 mb-4">
            Generate a custom URL that allows customers to start a chat with you instantly without saving your phone number.
          </Text>

          <Text className="text-xs font-bold text-slate-300 mb-1.5">WhatsApp Phone Number (with Country Code)</Text>
          <TextInput
            className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2.5 text-xs text-white mb-3"
            placeholder="e.g. 919876543210"
            placeholderTextColor="#64748B"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />

          <Text className="text-xs font-bold text-slate-300 mb-1.5">Prefilled Message (Optional)</Text>
          <TextInput
            className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2.5 text-xs text-white mb-4 h-24"
            placeholder="Hi! I am interested in learning more about your services."
            placeholderTextColor="#64748B"
            value={prefilledMessage}
            onChangeText={setPrefilledMessage}
            multiline
            textAlignVertical="top"
          />

          <Pressable className="py-3.5 rounded-xl items-center bg-[#25D366]" onPress={handleGenerate}>
            <Text className="text-xs font-extrabold text-black">Generate WhatsApp Link ✨</Text>
          </Pressable>
        </View>

        {generatedUrl ? (
          <View className="rounded-2xl p-4 border border-[#25D366]/40 bg-[#181A1F]">
            <Text className="text-xs font-bold text-white mb-2">Your Direct Chat Link:</Text>
            <View className="p-3 rounded-lg bg-[#111317] border border-[#262930] mb-3.5">
              <Text className="text-xs text-[#25D366] font-mono" numberOfLines={2}>
                {generatedUrl}
              </Text>
            </View>

            <View className="flex-row gap-2.5">
              <Pressable className="flex-1 py-3 rounded-xl items-center bg-[#0084FF]" onPress={handleShare}>
                <Text className="text-xs font-bold text-white">Share Link 🔗</Text>
              </Pressable>
              <Pressable className="flex-1 py-3 rounded-xl items-center bg-[#25D366]" onPress={handleTestLink}>
                <Text className="text-xs font-bold text-black">Open in WhatsApp 💬</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}
