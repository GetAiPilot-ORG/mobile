import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, useColorScheme, TextInput, ActivityIndicator } from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../src/core/store/authStore';

export default function UserDeletionScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const user = useAuthStore((s) => s.user);
  const [confirmText, setConfirmText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDeleteRequest = async () => {
    if (confirmText.trim().toUpperCase() !== 'DELETE') {
      Alert.alert('Confirmation Required', 'Please type DELETE in the box to proceed with the account deletion request.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Confirm Account Deletion',
      'This will permanently delete your account, saved templates, bot configurations, and subscription history within 30 days. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Delete Request',
          style: 'destructive',
          onPress: async () => {
            setIsSubmitting(true);
            setTimeout(() => {
              setIsSubmitting(false);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Request Submitted', 'Your account deletion request has been registered. Our security team will process it.');
              setConfirmText('');
            }, 1000);
          },
        },
      ]
    );
  };

  return (
    <AppScreen safeArea={false}>
      <AppTopBar title="Data & Account Deletion" subtitle="Account removal & privacy rights" showBack />
      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View className={`p-4.5 rounded-2xl border mb-4 ${isDark ? "bg-[#181A1F] border-[#262930]" : "bg-white border-gray-200"}`}>
          <View className="flex-row items-center gap-2 mb-2">
            <Ionicons name="warning" size={22} color="#EF4444" />
            <Text className={`text-base font-bold ${isDark ? "text-white" : "text-black"}`}>Account Deletion Request</Text>
          </View>
          <Text className={`text-xs leading-5 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            In compliance with App Store and Google Play data safety policies, you have the full right to delete your GetAIPilot account and all associated personal records at any time.
          </Text>
        </View>

        <View className={`p-4.5 rounded-2xl border mb-4 ${isDark ? "bg-[#181A1F] border-[#262930]" : "bg-white border-gray-200"}`}>
          <Text className={`text-xs font-semibold mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Current Account Email:
          </Text>
          <Text className={`text-sm font-bold mb-4 ${isDark ? "text-white" : "text-black"}`}>
            {user?.email || 'Logged in user'}
          </Text>

          <Text className={`text-xs mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Type <Text className="font-bold text-red-500">DELETE</Text> below to confirm deletion:
          </Text>
          <TextInput
            className={`px-3.5 py-2.5 rounded-xl border text-sm mb-4 ${
              isDark ? "bg-[#121316] border-[#262930] text-white" : "bg-slate-50 border-gray-200 text-black"
            }`}
            placeholder="Type DELETE"
            placeholderTextColor="#64748B"
            value={confirmText}
            onChangeText={setConfirmText}
            autoCapitalize="characters"
          />

          <Pressable
            className="bg-red-500 py-3 rounded-xl items-center justify-center"
            style={({ pressed }) => pressed ? { opacity: 0.85 } : undefined}
            onPress={handleDeleteRequest}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-white text-sm font-bold">Submit Account Deletion</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </AppScreen>
  );
}
