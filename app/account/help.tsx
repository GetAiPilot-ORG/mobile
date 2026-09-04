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
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { colors } from '../../src/theme/colors';

const FAQS = [
  { q: 'How does WhatsApp Automation work?', a: 'GetAIPilot connects directly with Meta Cloud API to send approved templates, auto-replies, and customer notifications.' },
  { q: 'What is Telegram Auto-Forwarding?', a: 'It allows instantaneous stream forwarding across channels and groups with customizable keyword sanitizers and delay offsets.' },
  { q: 'How do I upgrade or change my plan?', a: 'You can review available tiers under Account > Plans. To upgrade enterprise subscriptions, our support team assists immediately.' },
  { q: 'Is my data secure?', a: 'Yes, all credentials and API tokens are encrypted with AES-256 and stored using secure database sandboxing.' },
];

export default function HelpCenterScreen() {
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleSubmitTicket = () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      Alert.alert('Validation Error', 'Please enter a subject and message for your support ticket.');
      return;
    }

    Alert.alert('Ticket Submitted', 'Our priority engineering team will respond to your email within 2 hours.');
    setTicketSubject('');
    setTicketMessage('');
  };

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar title="Help Center" subtitle="Documentation & Dedicated Support" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Quick Contact Card */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Need Immediate Assistance?</Text>
          <Text style={styles.contactSub}>
            Reach out to GetAIPilot 24/7 dedicated support via WhatsApp or email.
          </Text>
          <View style={styles.btnRow}>
            <Pressable
              style={styles.chatBtn}
              onPress={() => Linking.openURL('https://wa.me/919876543210?text=Hi%20GetAIPilot%20Support')}
            >
              <Text style={styles.btnText}>WhatsApp Support 💬</Text>
            </Pressable>
            <Pressable
              style={styles.emailBtn}
              onPress={() => Linking.openURL('mailto:support@getaipilot.in')}
            >
              <Text style={styles.btnText}>Email Team ✉️</Text>
            </Pressable>
          </View>
        </View>

        {/* FAQs */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.faqList}>
          {FAQS.map((faq, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <Pressable
                key={idx}
                style={styles.faqItem}
                onPress={() => setExpandedFaq(isExpanded ? null : idx)}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQ}>{faq.q}</Text>
                  <Text style={styles.faqArrow}>{isExpanded ? '−' : '+'}</Text>
                </View>
                {isExpanded && <Text style={styles.faqA}>{faq.a}</Text>}
              </Pressable>
            );
          })}
        </View>

        {/* Support Ticket Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Submit Support Request</Text>
          <Text style={styles.cardSubtitle}>
            File an issue or feature request directly with our support team.
          </Text>

          <Text style={styles.inputLabel}>Subject / Topic</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Question about Telegram Forwarder setup"
            placeholderTextColor={colors.mutedForeground}
            value={ticketSubject}
            onChangeText={setTicketSubject}
          />

          <Text style={styles.inputLabel}>Detailed Description</Text>
          <TextInput
            style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
            placeholder="Provide context or error messages..."
            placeholderTextColor={colors.mutedForeground}
            value={ticketMessage}
            onChangeText={setTicketMessage}
            multiline
          />

          <Pressable style={styles.submitBtn} onPress={handleSubmitTicket}>
            <Text style={styles.submitBtnText}>Submit Support Ticket →</Text>
          </Pressable>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  contactCard: {
    backgroundColor: '#003C33',
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
  },
  contactTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  contactSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chatBtn: {
    flex: 1,
    backgroundColor: colors.products.whatsapp,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  emailBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12.5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.foreground,
    marginBottom: 12,
  },
  faqList: {
    gap: 10,
    marginBottom: 24,
  },
  faqItem: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQ: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
    flex: 1,
    marginRight: 8,
  },
  faqArrow: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  faqA: {
    fontSize: 12.5,
    color: colors.mutedForeground,
    marginTop: 10,
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.foreground,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12.5,
    color: colors.mutedForeground,
    lineHeight: 17,
    marginBottom: 14,
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
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
