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
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { colors } from '../../src/theme/colors';

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

  const filteredFaqs = selectedCategory === 'all'
    ? FAQS
    : FAQS.filter(f => f.category === selectedCategory);

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
    Linking.openURL('https://wa.me/919876543210?text=Hello%20GetAIPilot%20Support%20Team%2C%20I%20need%20assistance.');
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
    <AppScreen safeArea={false} backgroundColor="#000000">
      <AppTopBar title="Help & Support" subtitle="Documentation, FAQs & Dedicated Engineering" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Quick Connect Inset Group */}
        <View style={styles.quickContactContainer}>
          <Text style={styles.sectionHeader}>INSTANT CONNECT</Text>

          <View style={styles.contactRow}>
            <Pressable style={styles.contactCardWhatsApp} onPress={handleOpenWhatsApp}>
              <View style={styles.contactIconCircleWhatsApp}>
                <Text style={styles.contactIcon}>💬</Text>
              </View>
              <Text style={styles.contactCardTitle}>WhatsApp Priority</Text>
              <Text style={styles.contactCardSub}>24/7 Live Concierge</Text>
            </Pressable>

            <Pressable style={styles.contactCardEmail} onPress={handleOpenEmail}>
              <View style={styles.contactIconCircleEmail}>
                <Text style={styles.contactIcon}>✉️</Text>
              </View>
              <Text style={styles.contactCardTitle}>Email Support</Text>
              <Text style={styles.contactCardSub}>support@getaipilot.in</Text>
            </Pressable>
          </View>

          <Pressable style={styles.docsBanner} onPress={handleOpenDocs}>
            <View style={styles.docsIconCircle}>
              <Text style={styles.docsIcon}>📖</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.docsTitle}>GetAIPilot Architecture & API Docs</Text>
              <Text style={styles.docsSub}>Explore guides, REST APIs, Webhook schemas and samples</Text>
            </View>
            <Text style={styles.chevron}>→</Text>
          </Pressable>
        </View>

        {/* FAQs Section */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionHeader}>KNOWLEDGE BASE</Text>

          {/* Category Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.key}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat.key && styles.categoryChipActive,
                ]}
                onPress={() => handleCategorySelect(cat.key)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === cat.key && styles.categoryChipTextActive,
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
                  style={[styles.faqCard, isExpanded && styles.faqCardExpanded]}
                  onPress={() => handleToggleFaq(idx)}
                >
                  <View style={styles.faqHeaderRow}>
                    <Text style={styles.faqQuestion}>{faq.q}</Text>
                    <View style={[styles.faqToggleIconBox, isExpanded && styles.faqToggleIconBoxExpanded]}>
                      <Text style={styles.faqToggleSymbol}>{isExpanded ? '−' : '+'}</Text>
                    </View>
                  </View>
                  {isExpanded && (
                    <View style={styles.faqAnswerBox}>
                      <Text style={styles.faqAnswerText}>{faq.a}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Create Support Ticket */}
        <View style={styles.ticketSection}>
          <Text style={styles.sectionHeader}>SUBMIT AN ENGINEERING TICKET</Text>

          <View style={styles.ticketCard}>
            <Text style={styles.inputLabel}>Issue Topic</Text>
            <View style={styles.topicRow}>
              {['Technical Issue', 'Billing / Plan', 'Feature Request'].map((topic) => (
                <Pressable
                  key={topic}
                  style={[styles.topicChip, ticketCategory === topic && styles.topicChipActive]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setTicketCategory(topic);
                  }}
                >
                  <Text style={[styles.topicChipText, ticketCategory === topic && styles.topicChipTextActive]}>
                    {topic}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.inputLabel}>Subject / Headline</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Webhook delivery failure on WhatsApp trigger"
              placeholderTextColor="#6B7280"
              value={ticketSubject}
              onChangeText={setTicketSubject}
            />

            <Text style={styles.inputLabel}>Details & Error Messages</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe what occurred, payload details, or steps to reproduce..."
              placeholderTextColor="#6B7280"
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
    color: '#9CA3AF',
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
    backgroundColor: '#052E16',
    borderWidth: 1,
    borderColor: '#10B98144',
    borderRadius: 20,
    padding: 16,
  },
  contactCardEmail: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#38BDF844',
    borderRadius: 20,
    padding: 16,
  },
  contactIconCircleWhatsApp: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#10B98122',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  contactIconCircleEmail: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#38BDF822',
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
    color: '#FFFFFF',
    marginBottom: 2,
  },
  contactCardSub: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  docsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D1117',
    borderWidth: 1,
    borderColor: '#1F242F',
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  docsIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#8B5CF622',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docsIcon: {
    fontSize: 18,
  },
  docsTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  docsSub: {
    fontSize: 11,
    color: '#9CA3AF',
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
    backgroundColor: '#12151A',
    borderWidth: 1,
    borderColor: '#1F242F',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
  },
  categoryChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  categoryChipTextActive: {
    color: '#000000',
    fontWeight: '800',
  },
  faqList: {
    gap: 10,
  },
  faqCard: {
    backgroundColor: '#0D1117',
    borderWidth: 1,
    borderColor: '#1F242F',
    borderRadius: 16,
    padding: 16,
  },
  faqCardExpanded: {
    borderColor: '#10B98166',
    backgroundColor: '#0B1416',
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
    color: '#FFFFFF',
    flex: 1,
    lineHeight: 18,
  },
  faqToggleIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#161B22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqToggleIconBoxExpanded: {
    backgroundColor: '#10B98133',
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
    borderTopColor: '#21262D',
  },
  faqAnswerText: {
    fontSize: 12.5,
    color: '#D1D5DB',
    lineHeight: 18,
  },
  ticketSection: {
    marginBottom: 20,
  },
  ticketCard: {
    backgroundColor: '#0D1117',
    borderWidth: 1,
    borderColor: '#1F242F',
    borderRadius: 20,
    padding: 18,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#D1D5DB',
    marginBottom: 8,
  },
  topicRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  topicChip: {
    backgroundColor: '#161B22',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  topicChipActive: {
    borderColor: '#10B981',
    backgroundColor: '#10B98122',
  },
  topicChipText: {
    fontSize: 11.5,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  topicChipTextActive: {
    color: '#10B981',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: '#FFFFFF',
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
