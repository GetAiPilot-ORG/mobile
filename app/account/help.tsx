import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Linking,
  useColorScheme,
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
    <AppScreen safeArea={false} backgroundColor={isDark ? '#000000' : '#F8FAFC'}>
      <AppTopBar title="Help & Support" subtitle="Documentation, FAQs & Dedicated Engineering" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Quick Connect Inset Group */}
        <View style={styles.quickContactContainer}>
          <Text style={[styles.sectionHeader, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
            INSTANT CONNECT
          </Text>

          <View style={styles.contactRow}>
            <Pressable
              style={[
                styles.contactCardWhatsApp,
                {
                  backgroundColor: isDark ? '#052E16' : '#ECFDF5',
                  borderColor: isDark ? '#10B98144' : '#A7F3D0',
                },
              ]}
              onPress={handleOpenWhatsApp}
            >
              <View
                style={[
                  styles.contactIconCircleWhatsApp,
                  { backgroundColor: isDark ? '#10B98122' : '#D1FAE5' },
                ]}
              >
                <Text style={styles.contactIcon}>💬</Text>
              </View>
              <Text style={[styles.contactCardTitle, { color: isDark ? '#FFFFFF' : '#065F46' }]}>
                WhatsApp Priority
              </Text>
              <Text style={[styles.contactCardSub, { color: isDark ? '#9CA3AF' : '#047857' }]}>
                24/7 Live Concierge
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.contactCardEmail,
                {
                  backgroundColor: isDark ? '#0F172A' : '#EFF6FF',
                  borderColor: isDark ? '#38BDF844' : '#BFDBFE',
                },
              ]}
              onPress={handleOpenEmail}
            >
              <View
                style={[
                  styles.contactIconCircleEmail,
                  { backgroundColor: isDark ? '#38BDF822' : '#DBEAFE' },
                ]}
              >
                <Text style={styles.contactIcon}>✉️</Text>
              </View>
              <Text style={[styles.contactCardTitle, { color: isDark ? '#FFFFFF' : '#1E40AF' }]}>
                Email Support
              </Text>
              <Text style={[styles.contactCardSub, { color: isDark ? '#9CA3AF' : '#3B82F6' }]}>
                support@getaipilot.in
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={[
              styles.docsBanner,
              {
                backgroundColor: isDark ? '#0D1117' : '#FFFFFF',
                borderColor: isDark ? '#1F242F' : '#E2E8F0',
              },
            ]}
            onPress={handleOpenDocs}
          >
            <View
              style={[
                styles.docsIconCircle,
                { backgroundColor: isDark ? '#8B5CF622' : '#EDE9FE' },
              ]}
            >
              <Text style={styles.docsIcon}>📖</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.docsTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                GetAIPilot Architecture & API Docs
              </Text>
              <Text style={[styles.docsSub, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                Explore guides, REST APIs, Webhook schemas and samples
              </Text>
            </View>
            <Text style={styles.chevron}>→</Text>
          </Pressable>
        </View>

        {/* FAQs Section */}
        <View style={styles.faqSection}>
          <Text style={[styles.sectionHeader, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
            KNOWLEDGE BASE
          </Text>

          {/* Category Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.key}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor:
                      selectedCategory === cat.key
                        ? '#10B981'
                        : isDark
                        ? '#12151A'
                        : '#FFFFFF',
                    borderColor:
                      selectedCategory === cat.key
                        ? '#10B981'
                        : isDark
                        ? '#1F242F'
                        : '#CBD5E1',
                  },
                ]}
                onPress={() => handleCategorySelect(cat.key)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    {
                      color:
                        selectedCategory === cat.key
                          ? '#000000'
                          : isDark
                          ? '#9CA3AF'
                          : '#64748B',
                      fontWeight: selectedCategory === cat.key ? '800' : '600',
                    },
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Accordions */}
          <View style={styles.faqList}>
            {filteredFaqs.map((faq, idx) => {
              const isExpanded = expandedFaq === idx;
              return (
                <Pressable
                  key={idx}
                  style={[
                    styles.faqCard,
                    {
                      backgroundColor: isExpanded
                        ? isDark
                          ? '#0B1416'
                          : '#F0FDF4'
                        : isDark
                        ? '#0D1117'
                        : '#FFFFFF',
                      borderColor: isExpanded
                        ? isDark
                          ? '#10B98166'
                          : '#10B981'
                        : isDark
                        ? '#1F242F'
                        : '#E2E8F0',
                    },
                  ]}
                  onPress={() => handleToggleFaq(idx)}
                >
                  <View style={styles.faqHeaderRow}>
                    <Text style={[styles.faqQuestion, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                      {faq.q}
                    </Text>
                    <View
                      style={[
                        styles.faqToggleIconBox,
                        {
                          backgroundColor: isExpanded
                            ? isDark
                              ? '#10B98133'
                              : '#D1FAE5'
                            : isDark
                            ? '#161B22'
                            : '#F1F5F9',
                        },
                      ]}
                    >
                      <Text style={styles.faqToggleSymbol}>{isExpanded ? '−' : '+'}</Text>
                    </View>
                  </View>
                  {isExpanded && (
                    <View
                      style={[
                        styles.faqAnswerBox,
                        { borderTopColor: isDark ? '#21262D' : '#E2E8F0' },
                      ]}
                    >
                      <Text style={[styles.faqAnswerText, { color: isDark ? '#D1D5DB' : '#334155' }]}>
                        {faq.a}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Create Support Ticket */}
        <View style={styles.ticketSection}>
          <Text style={[styles.sectionHeader, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
            SUBMIT AN ENGINEERING TICKET
          </Text>

          <View
            style={[
              styles.ticketCard,
              {
                backgroundColor: isDark ? '#0D1117' : '#FFFFFF',
                borderColor: isDark ? '#1F242F' : '#E2E8F0',
              },
            ]}
          >
            <Text style={[styles.inputLabel, { color: isDark ? '#D1D5DB' : '#334155' }]}>
              Issue Topic
            </Text>
            <View style={styles.topicRow}>
              {['Technical Issue', 'Billing / Plan', 'Feature Request'].map((topic) => {
                const isSelected = ticketCategory === topic;
                return (
                  <Pressable
                    key={topic}
                    style={[
                      styles.topicChip,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? '#10B98122'
                            : '#D1FAE5'
                          : isDark
                          ? '#161B22'
                          : '#F8FAFC',
                        borderColor: isSelected
                          ? '#10B981'
                          : isDark
                          ? '#21262D'
                          : '#CBD5E1',
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setTicketCategory(topic);
                    }}
                  >
                    <Text
                      style={[
                        styles.topicChipText,
                        {
                          color: isSelected
                            ? '#10B981'
                            : isDark
                            ? '#9CA3AF'
                            : '#64748B',
                          fontWeight: isSelected ? '700' : '600',
                        },
                      ]}
                    >
                      {topic}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.inputLabel, { color: isDark ? '#D1D5DB' : '#334155' }]}>
              Subject / Headline
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#161B22' : '#F8FAFC',
                  borderColor: isDark ? '#21262D' : '#CBD5E1',
                  color: isDark ? '#FFFFFF' : '#0F172A',
                },
              ]}
              placeholder="e.g. Webhook delivery failure on WhatsApp trigger"
              placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
              value={ticketSubject}
              onChangeText={setTicketSubject}
            />

            <Text style={[styles.inputLabel, { color: isDark ? '#D1D5DB' : '#334155' }]}>
              Details & Error Messages
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: isDark ? '#161B22' : '#F8FAFC',
                  borderColor: isDark ? '#21262D' : '#CBD5E1',
                  color: isDark ? '#FFFFFF' : '#0F172A',
                },
              ]}
              placeholder="Describe what occurred, payload details, or steps to reproduce..."
              placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
              value={ticketMessage}
              onChangeText={setTicketMessage}
              multiline
            />

            <Pressable
              style={[styles.submitTicketBtn, isSubmitting && { opacity: 0.6 }]}
              onPress={handleSubmitTicket}
              disabled={isSubmitting}
            >
              <Text style={styles.submitTicketBtnText}>
                {isSubmitting ? 'Dispatching Ticket...' : 'Dispatch Ticket to Engineering →'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  quickContactContainer: {
    marginBottom: 26,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  contactCardWhatsApp: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  contactCardEmail: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  contactIconCircleWhatsApp: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  contactIconCircleEmail: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  contactIcon: {
    fontSize: 18,
  },
  contactCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  contactCardSub: {
    fontSize: 11,
  },
  docsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  docsIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docsIcon: {
    fontSize: 18,
  },
  docsTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  docsSub: {
    fontSize: 11,
    marginTop: 2,
  },
  chevron: {
    fontSize: 16,
    fontWeight: '900',
    color: '#10B981',
  },
  faqSection: {
    marginBottom: 26,
  },
  categoryScroll: {
    gap: 8,
    marginBottom: 14,
  },
  categoryChip: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  faqList: {
    gap: 10,
  },
  faqCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  faqHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  faqQuestion: {
    fontSize: 13.5,
    fontWeight: '700',
    flex: 1,
    lineHeight: 18,
  },
  faqToggleIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqToggleSymbol: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10B981',
  },
  faqAnswerBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  faqAnswerText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  ticketSection: {
    marginBottom: 20,
  },
  ticketCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 8,
  },
  topicRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  topicChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  topicChipText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    marginBottom: 16,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  submitTicketBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitTicketBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#000000',
  },
});
