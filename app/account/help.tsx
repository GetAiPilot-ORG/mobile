import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Linking,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';

interface FaqItem {
  category: 'general' | 'whatsapp' | 'telegram' | 'voice' | 'security';
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    category: 'whatsapp',
    q: 'How does WhatsApp Meta Cloud API Integration work?',
    a: 'GetAIPilot connects directly to your Meta Cloud API via System User Tokens and Phone Number IDs. This ensures zero ban risk, high throughput rate limits (up to 1,000 TPS), and automated webhook delivery reports.',
  },
  {
    category: 'telegram',
    q: 'How does the Telegram Auto-Forwarding Engine route messages?',
    a: 'Our daemon listens to MTProto user sessions or Bot APIs in real-time (< 200ms latency), applies keyword regex filters, cleans watermark usernames, and forwards directly into target destination channels.',
  },
  {
    category: 'voice',
    q: 'What is the latency of GAP AI Telecaller & Voice Pilot?',
    a: 'Voice calls use WebRTC streaming speech-to-text combined with optimized LLM pipelines, achieving human-parity conversational turn-taking latency under 650ms.',
  },
  {
    category: 'security',
    q: 'How are sensitive API keys and biometrics secured?',
    a: 'All private API secrets and tokens are encrypted with AES-GCM 256-bit keys inside Supabase Vault. On device, your biometrics rely on Apple Secure Enclave & Android StrongBox KeyStore.',
  },
  {
    category: 'general',
    q: 'Can I test features before purchasing an Enterprise plan?',
    a: 'Yes! All 10 Growth Tools (Bio Pages, QR Studio, UTM Builder, etc.) are 100% free and unlimited. Product engines include sandbox trial quotas upon account creation.',
  },
];

const CATEGORIES = [
  { key: 'all', label: 'All FAQs' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'telegram', label: 'Telegram' },
  { key: 'voice', label: 'Voice AI' },
  { key: 'security', label: 'Security' },
];

export default function HelpCenterScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Technical Issue');
  const [ticketMessage, setTicketMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredFaqs =
    selectedCategory === 'all'
      ? FAQS
      : FAQS.filter((f) => f.category === selectedCategory);

  const handleCategorySelect = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(key);
    setExpandedFaq(null);
  };

  const handleToggleFaq = (idx: number) => {
    Haptics.selectionAsync();
    setExpandedFaq(expandedFaq === idx ? null : idx);
  };

  const handleOpenWhatsApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(
      'https://wa.me/919876543210?text=Hello%20GetAIPilot%20Support%20Team%2C%20I%20need%20assistance.'
    );
  };

  const handleOpenEmail = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL('mailto:support@getaipilot.in?subject=GetAIPilot%20Support%20Inquiry');
  };

  const handleOpenDocs = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL('https://getaipilot.in/docs');
  };

  const handleSubmitTicket = () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Missing Details', 'Please provide both a subject and details for your ticket.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Support Ticket Dispatched',
        `Ticket #${Math.floor(100000 + Math.random() * 900000)} has been generated. An engineering lead will review your request within 2 business hours.`,
        [{ text: 'Great' }]
      );
      setTicketSubject('');
      setTicketMessage('');
    }, 600);
  };

  return (
    <AppScreen safeArea={false} className="flex-1 bg-[#0B0D10]">
      <AppTopBar title="Help & Support" subtitle="Documentation, FAQs & Dedicated Engineering" showBack={true} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Quick Connect Inset Group */}
        <View className="mb-6">
          <Text className="text-[11px] font-black tracking-wider uppercase text-slate-400 mb-2.5">
            INSTANT CONNECT
          </Text>

          <View className="flex-row gap-3 mb-3">
            <Pressable
              className="flex-1 rounded-2xl p-4 border border-emerald-500/30 bg-[#052E16]"
              onPress={handleOpenWhatsApp}
            >
              <View className="w-10 h-10 rounded-xl items-center justify-center bg-emerald-500/20 mb-3">
                <Text className="text-lg">💬</Text>
              </View>
              <Text className="text-sm font-extrabold text-white mb-0.5">WhatsApp Priority</Text>
              <Text className="text-[11px] text-slate-400">24/7 Live Concierge</Text>
            </Pressable>

            <Pressable
              className="flex-1 rounded-2xl p-4 border border-sky-500/30 bg-[#0F172A]"
              onPress={handleOpenEmail}
            >
              <View className="w-10 h-10 rounded-xl items-center justify-center bg-sky-500/20 mb-3">
                <Text className="text-lg">✉️</Text>
              </View>
              <Text className="text-sm font-extrabold text-white mb-0.5">Email Support</Text>
              <Text className="text-[11px] text-slate-400">support@getaipilot.in</Text>
            </Pressable>
          </View>

          <Pressable
            className="flex-row items-center rounded-2xl p-3.5 gap-3 border border-[#262930] bg-[#181A1F]"
            onPress={handleOpenDocs}
          >
            <View className="w-9 h-9 rounded-xl items-center justify-center bg-purple-500/20">
              <Text className="text-lg">📖</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-white">GetAIPilot Architecture & API Docs</Text>
              <Text className="text-[11px] text-slate-400 mt-0.5">
                Explore guides, REST APIs, Webhook schemas and samples
              </Text>
            </View>
            <Text className="text-base font-black text-emerald-400">→</Text>
          </Pressable>
        </View>

        {/* FAQs Section */}
        <View className="mb-6">
          <Text className="text-[11px] font-black tracking-wider uppercase text-slate-400 mb-2.5">
            KNOWLEDGE BASE
          </Text>

          {/* Category Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, marginBottom: 14 }}
          >
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.key}
                className={`px-3.5 py-1.5 rounded-full border ${
                  selectedCategory === cat.key
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'bg-[#181A1F] border-[#262930]'
                }`}
                onPress={() => handleCategorySelect(cat.key)}
              >
                <Text
                  className={`text-xs ${
                    selectedCategory === cat.key ? 'text-black font-extrabold' : 'text-slate-400 font-semibold'
                  }`}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Accordions */}
          <View className="gap-2.5">
            {filteredFaqs.map((faq, idx) => {
              const isExpanded = expandedFaq === idx;
              return (
                <Pressable
                  key={idx}
                  className={`rounded-2xl p-4 border ${
                    isExpanded ? 'bg-[#0B1416] border-emerald-500/50' : 'bg-[#181A1F] border-[#262930]'
                  }`}
                  onPress={() => handleToggleFaq(idx)}
                >
                  <View className="flex-row items-center justify-between gap-2.5">
                    <Text className="text-xs font-bold text-white flex-1 leading-4">{faq.q}</Text>
                    <View
                      className={`w-6 h-6 rounded-full items-center justify-center ${
                        isExpanded ? 'bg-emerald-500/20' : 'bg-[#262930]'
                      }`}
                    >
                      <Text className="text-sm font-black text-emerald-400">{isExpanded ? '−' : '+'}</Text>
                    </View>
                  </View>
                  {isExpanded && (
                    <View className="mt-3 pt-3 border-t border-[#262930]">
                      <Text className="text-xs text-slate-300 leading-5">{faq.a}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Create Support Ticket */}
        <View className="mb-5">
          <Text className="text-[11px] font-black tracking-wider uppercase text-slate-400 mb-2.5">
            SUBMIT AN ENGINEERING TICKET
          </Text>

          <View className="rounded-2xl p-4 border border-[#262930] bg-[#181A1F]">
            <Text className="text-xs font-bold text-slate-300 mb-2">Issue Topic</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {['Technical Issue', 'Billing / Plan', 'Feature Request'].map((topic) => {
                const isSelected = ticketCategory === topic;
                return (
                  <Pressable
                    key={topic}
                    className={`px-3 py-1.5 rounded-lg border ${
                      isSelected ? 'bg-emerald-500/20 border-emerald-500' : 'bg-[#111317] border-[#262930]'
                    }`}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setTicketCategory(topic);
                    }}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {topic}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text className="text-xs font-bold text-slate-300 mb-1.5">Subject / Headline</Text>
            <TextInput
              className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2.5 text-xs text-white mb-3.5"
              placeholder="e.g. Webhook delivery failure on WhatsApp trigger"
              placeholderTextColor="#64748B"
              value={ticketSubject}
              onChangeText={setTicketSubject}
            />

            <Text className="text-xs font-bold text-slate-300 mb-1.5">Details & Error Messages</Text>
            <TextInput
              className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2.5 text-xs text-white mb-4 h-24"
              placeholder="Describe what occurred, payload details, or steps to reproduce..."
              placeholderTextColor="#64748B"
              value={ticketMessage}
              onChangeText={setTicketMessage}
              multiline
              textAlignVertical="top"
            />

            <Pressable
              className={`py-3.5 rounded-xl items-center justify-center bg-emerald-500 ${
                isSubmitting ? 'opacity-60' : ''
              }`}
              onPress={handleSubmitTicket}
              disabled={isSubmitting}
            >
              <Text className="text-xs font-extrabold text-black">
                {isSubmitting ? 'Dispatching Ticket...' : 'Dispatch Ticket to Engineering →'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </AppScreen>
  );
}
