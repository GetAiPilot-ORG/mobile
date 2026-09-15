import React, { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TelegramToolKey } from '../types';
import { StatCard } from '../components/ui/StatCard';

interface Props { onOpenModal: (key: TelegramToolKey) => void; }

const QUICK_REPLIES = [
  { id: 'qr1', trigger: '/start', response: '👋 Welcome! I\'m your AI assistant. How can I help you today?', active: true },
  { id: 'qr2', trigger: 'price', response: '📊 Check our latest plans at getaipilot.in/plans', active: true },
  { id: 'qr3', trigger: 'support', response: '🎧 Our team responds within 2 hours. Email: support@getaipilot.in', active: false },
];

export const ChatBotScreen: React.FC<Props> = ({ onOpenModal }) => {
  const isDark = useColorScheme() === 'dark';
  const [aiEnabled, setAiEnabled] = useState(true);
  const [replies, setReplies] = useState(QUICK_REPLIES);

  const card = isDark ? styles.cardDark : styles.cardLight;
  const txt = isDark ? styles.textDark : styles.textLight;
  const border = isDark ? styles.borderDark : styles.borderLight;

  const toggleReply = (id: string) => {
    setReplies((prev) => prev.map((r) => r.id === id ? { ...r, active: !r.active } : r));
  };

  return (
    <>
      {/* Hero */}
      <View style={[styles.hero, card]}>
        <View style={[styles.heroIcon, { backgroundColor: 'rgba(139,92,246,0.12)' }]}>
          <Ionicons name="chatbubbles" size={28} color="#8B5CF6" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heroTitle, txt]}>AI ChatBot</Text>
          <Text style={styles.heroSub}>AI auto-replies & conversational flows for Telegram communities</Text>
        </View>
        <Switch value={aiEnabled} onValueChange={setAiEnabled} trackColor={{ false: '#CBD5E1', true: '#8B5CF6' }} thumbColor="#FFFFFF" />
      </View>

      {/* Stats */}
      <View style={[styles.statsRow, { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }]}>
        {[
          { label: 'ACTIVE FLOWS', val: replies.filter(r => r.active).length, color: '#8B5CF6', icon: 'git-branch-outline', bg: 'rgba(139,92,246,0.12)', hint: 'Configured rules' },
          { label: 'REPLIES SENT', val: 247, color: '#0284C7', icon: 'chatbubbles-outline', bg: 'rgba(2,132,199,0.12)', hint: 'Total automated' },
          { label: 'RESPONSE RATE', val: '98%', color: '#10B981', icon: 'flash-outline', bg: 'rgba(16,185,129,0.12)', hint: 'Accuracy' },
        ].map((s, i) => (
          <StatCard
            key={i}
            label={s.label}
            value={s.val}
            icon={s.icon}
            color={s.color}
            bg={s.bg}
            sub={s.hint}
          />
        ))}
      </View>

      {/* Capabilities */}
      <View style={[styles.sectionCard, card]}>
        <Text style={[styles.sectionTitle, txt]}>AI Capabilities</Text>
        <View style={{ gap: 10, marginTop: 10 }}>
          {[
            { icon: 'flash-outline', color: '#F59E0B', title: 'Instant Keyword Triggers', desc: 'Detect keywords and respond instantly with pre-set messages.' },
            { icon: 'bulb-outline', color: '#8B5CF6', title: 'GPT-Powered Replies', desc: 'AI generates contextual responses for complex queries.' },
            { icon: 'git-branch-outline', color: '#0284C7', title: 'Conversation Flows', desc: 'Multi-step guided conversations with decision trees.' },
          ].map((cap, i) => (
            <View key={i} style={[styles.capRow, border]}>
              <View style={[styles.capIcon, { backgroundColor: `${cap.color}20` }]}>
                <Ionicons name={cap.icon as any} size={16} color={cap.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.capTitle, txt]}>{cap.title}</Text>
                <Text style={styles.capDesc}>{cap.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Replies */}
      <View style={[styles.sectionCard, card]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={[styles.sectionTitle, txt]}>Auto-Reply Rules</Text>
          <Pressable style={styles.addBtn} onPress={() => onOpenModal('chatbot')}>
            <Ionicons name="add" size={14} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Add Rule</Text>
          </Pressable>
        </View>
        {replies.map((r) => (
          <View key={r.id} style={[styles.replyCard, isDark ? styles.replyCardDark : styles.replyCardLight]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <View style={styles.triggerBadge}>
                <Text style={styles.triggerBadgeText}>{r.trigger}</Text>
              </View>
              <Switch value={r.active} onValueChange={() => toggleReply(r.id)} trackColor={{ false: '#CBD5E1', true: '#8B5CF6' }} thumbColor="#FFFFFF" style={{ transform: [{ scale: 0.85 }] }} />
            </View>
            <Text style={[styles.replyText, txt]} numberOfLines={2}>{r.response}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.primaryBtn} onPress={() => onOpenModal('chatbot')}>
        <Ionicons name="create-outline" size={16} color="#FFFFFF" />
        <Text style={styles.primaryBtnText}>Open Full ChatBot Console</Text>
      </Pressable>
    </>
  );
};

const styles = StyleSheet.create({
  cardLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  cardDark: { backgroundColor: '#121212', borderColor: '#27272A' },
  textLight: { color: '#0F172A' },
  textDark: { color: '#F8FAFC' },
  borderLight: { borderColor: '#E2E8F0' },
  borderDark: { borderColor: '#27272A' },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 14 },
  heroIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 18, fontWeight: '800' },
  heroSub: { fontSize: 12, color: '#64748B', lineHeight: 17, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, padding: 12, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, color: '#64748B', fontWeight: '600', marginTop: 2 },
  sectionCard: { padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '800' },
  capRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingBottom: 10, borderBottomWidth: 1 },
  capIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  capTitle: { fontSize: 13, fontWeight: '700' },
  capDesc: { fontSize: 11, color: '#64748B', marginTop: 2, lineHeight: 16 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#8B5CF6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  addBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  replyCard: { padding: 10, borderRadius: 10, marginBottom: 8 },
  replyCardLight: { backgroundColor: '#F8FAFC' },
  replyCardDark: { backgroundColor: 'rgba(255,255,255,0.04)' },
  triggerBadge: { backgroundColor: 'rgba(139,92,246,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  triggerBadgeText: { fontSize: 12, fontWeight: '800', color: '#8B5CF6', fontFamily: 'monospace' },
  replyText: { fontSize: 12, lineHeight: 17 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#8B5CF6', borderRadius: 12, paddingVertical: 14 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
