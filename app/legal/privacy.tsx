import React from 'react';
import { View, Text, ScrollView, useColorScheme } from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyPolicyScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <AppScreen safeArea={false}>
      <AppTopBar title="Privacy Policy" subtitle="Last updated July 2026" showBack />
      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View className={`p-4.5 rounded-2xl border mb-4 ${isDark ? "bg-[#181A1F] border-[#262930]" : "bg-white border-gray-200"}`}>
          <View className="flex-row items-center gap-2 mb-2">
            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            <Text className={`text-base font-bold ${isDark ? "text-white" : "text-black"}`}>Privacy Overview</Text>
          </View>
          <Text className={`text-xs leading-5 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            GetAIPilot respects your privacy and is committed to protecting your personal data across our entire ecosystem including GAP Telegram, GAP WhatsApp, GAP CRM, GAP Voice Pilot, and Social Pilot.
          </Text>
        </View>

        <View className={`p-4.5 rounded-2xl border mb-4 ${isDark ? "bg-[#181A1F] border-[#262930]" : "bg-white border-gray-200"}`}>
          <Text className={`text-sm font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>1. Data We Collect</Text>
          <Text className={`text-xs leading-5 mb-2 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            • Account credentials (email, name, business details, phone number).{"\n"}
            • Integration tokens for third-party services (Telegram Bot tokens, Meta WhatsApp Business API credentials).{"\n"}
            • Campaign statistics, message delivery logs, analytics, and billing transactions.
          </Text>

          <Text className={`text-sm font-bold mb-2 mt-3 ${isDark ? "text-white" : "text-black"}`}>2. How We Use Data</Text>
          <Text className={`text-xs leading-5 mb-2 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            We use your data solely to deliver automated broadcasting, CRM pipelines, AI voice processing, and user authentication. We never sell your personal data to third parties.
          </Text>

          <Text className={`text-sm font-bold mb-2 mt-3 ${isDark ? "text-white" : "text-black"}`}>3. Security & Storage</Text>
          <Text className={`text-xs leading-5 mb-2 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            All sensitive credentials and database interactions are protected via encrypted SSL/TLS connections and stored in secure Supabase enterprise data centers.
          </Text>

          <Text className={`text-sm font-bold mb-2 mt-3 ${isDark ? "text-white" : "text-black"}`}>4. Contact Support</Text>
          <Text className={`text-xs leading-5 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            For privacy inquiries or data requests, please contact privacy@getaipilot.in or support@getaipilot.in.
          </Text>
        </View>
      </ScrollView>
    </AppScreen>
  );
}
