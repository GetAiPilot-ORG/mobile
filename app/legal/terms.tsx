import React from 'react';
import { View, Text, ScrollView, useColorScheme } from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { Ionicons } from '@expo/vector-icons';

export default function TermsAndConditionsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <AppScreen safeArea={false}>
      <AppTopBar title="Terms & Conditions" subtitle="Agreement of Service" showBack />
      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View className={`p-4.5 rounded-2xl border mb-4 ${isDark ? "bg-[#181A1F] border-[#262930]" : "bg-white border-gray-200"}`}>
          <View className="flex-row items-center gap-2 mb-2">
            <Ionicons name="document-text" size={20} color="#0284C7" />
            <Text className={`text-base font-bold ${isDark ? "text-white" : "text-black"}`}>Terms of Service</Text>
          </View>
          <Text className={`text-xs leading-5 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            By signing up or accessing GetAIPilot products, you agree to comply with our platform policies, fair usage limits, and applicable laws.
          </Text>
        </View>

        <View className={`p-4.5 rounded-2xl border mb-4 ${isDark ? "bg-[#181A1F] border-[#262930]" : "bg-white border-gray-200"}`}>
          <Text className={`text-sm font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>1. Acceptable Use</Text>
          <Text className={`text-xs leading-5 mb-2 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            You may not use GetAIPilot tools for unsolicited spamming, illegal content distribution, harassment, or violating Meta/Telegram terms of service.
          </Text>

          <Text className={`text-sm font-bold mb-2 mt-3 ${isDark ? "text-white" : "text-black"}`}>2. Subscription & Payments</Text>
          <Text className={`text-xs leading-5 mb-2 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            Subscriptions are billed in advance on a recurring monthly or yearly cycle. You can cancel at any time directly through your billing portal.
          </Text>

          <Text className={`text-sm font-bold mb-2 mt-3 ${isDark ? "text-white" : "text-black"}`}>3. Service Availability</Text>
          <Text className={`text-xs leading-5 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            We strive for 99.9% uptime across all automation microservices, but occasional maintenance windows may occur with advance notice.
          </Text>
        </View>
      </ScrollView>
    </AppScreen>
  );
}
