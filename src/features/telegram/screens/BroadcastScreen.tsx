import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { TelegramToolKey } from '../types';
import { StatCard } from '../components/ui/StatCard';

interface Props {
  chats: any[];
  isBroadcasting: boolean;
  onOpenModal: (key: TelegramToolKey) => void;
}

const BROADCAST_TEMPLATES = [
  { id: 'signal', icon: '📈', label: 'Trading Signal', preview: '🔥 BUY BankNifty 51,200 CE | Target: 420 | SL: 290' },
  { id: 'event', icon: '📅', label: 'Event Alert', preview: '⚡️ LIVE Webinar Tonight 8PM - Join Now!' },
  { id: 'update', icon: '📣', label: 'Channel Update', preview: '🎯 New VIP Subscription Plan launched! Limited slots.' },
];

export const BroadcastScreen: React.FC<Props> = ({ chats, isBroadcasting, onOpenModal }) => {
  const isDark = useColorScheme() === 'dark';
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const card = isDark ? styles.cardDark : styles.cardLight;
  const txt = isDark ? styles.textDark : styles.textLight;
  const border = isDark ? styles.borderDark : styles.borderLight;

  return (
    <>
      {/* Hero */}
      <View style={[styles.hero, card]}>
        <View style={[styles.heroIcon, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
          <Ionicons name="megaphone" size={26} color="#F59E0B" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heroTitle, txt]}>Broadcast Message</Text>
          <Text style={styles.heroSub}>Mass message delivery to {(chats || []).length} channels & groups</Text>
          <View style={styles.liveBadge}>
            <View style={styles.dotGreen} />
            <Text style={styles.liveBadgeText}>System Online</Text>
          </View>
        </View>
      </View>

      {/* Stats Row */}
      <View style={[styles.statsRow, { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }]}>
        {[
          { label: 'CHANNELS', val: (chats || []).length, color: '#0284C7', icon: 'megaphone-outline', bg: 'rgba(2,132,199,0.12)', hint: 'Target channels' },
          { label: 'GROUPS', val: 0, color: '#8B5CF6', icon: 'people-outline', bg: 'rgba(139,92,246,0.12)', hint: 'Target groups' },
          { label: 'TOTAL REACH', val: (chats || []).length, color: '#10B981', icon: 'globe-outline', bg: 'rgba(16,185,129,0.12)', hint: 'Estimated users' },
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

      {/* Templates */}
      <View style={[styles.sectionCard, card]}>
        <Text style={[styles.sectionTitle, txt]}>Quick Templates</Text>
        <View style={{ gap: 8, marginTop: 10 }}>
          {BROADCAST_TEMPLATES.map((t) => (
            <Pressable
              key={t.id}
              style={[styles.templateRow, border, selectedTemplate === t.id && styles.templateRowActive]}
              onPress={() => {
                setSelectedTemplate(t.id);
                setMessage(t.preview);
              }}
            >
              <Text style={{ fontSize: 20 }}>{t.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.templateLabel, txt]}>{t.label}</Text>
                <Text style={styles.templatePreview} numberOfLines={1}>{t.preview}</Text>
              </View>
              {selectedTemplate === t.id && <Ionicons name="checkmark-circle" size={18} color="#0284C7" />}
            </Pressable>
          ))}
        </View>
      </View>

      {/* Compose */}
      <View style={[styles.sectionCard, card]}>
        <Text style={[styles.sectionTitle, txt]}>Compose Message</Text>
        <TextInput
          style={[styles.msgInput, txt, border, isDark ? styles.msgInputDark : styles.msgInputLight]}
          multiline
          numberOfLines={5}
          placeholder="Type your broadcast message here..."
          placeholderTextColor="#94A3B8"
          value={message}
          onChangeText={setMessage}
        />
        <Text style={styles.charCount}>{message.length}/4096 characters</Text>
      </View>

      {/* Send */}
      <Pressable
        style={[styles.sendBtn, (isBroadcasting || !message.trim()) && styles.sendBtnDisabled]}
        disabled={isBroadcasting || !message.trim()}
        onPress={() => {
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onOpenModal('broadcast');
        }}
      >
        <Ionicons name={isBroadcasting ? 'hourglass-outline' : 'send'} size={16} color="#FFFFFF" />
        <Text style={styles.sendBtnText}>{isBroadcasting ? 'Sending...' : `Send to ${(chats || []).length} Channels`}</Text>
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
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 14 },
  heroIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 18, fontWeight: '800' },
  heroSub: { fontSize: 12, color: '#64748B', marginTop: 2, lineHeight: 17 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginTop: 8, alignSelf: 'flex-start' },
  dotGreen: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  liveBadgeText: { fontSize: 11, fontWeight: '700', color: '#10B981' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  statVal: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 2 },
  sectionCard: { padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '800' },
  templateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  templateRowActive: { borderColor: '#0284C7', backgroundColor: 'rgba(2,132,199,0.05)' },
  templateLabel: { fontSize: 13, fontWeight: '700' },
  templatePreview: { fontSize: 11, color: '#64748B', marginTop: 2 },
  msgInput: { borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 13, marginTop: 10, minHeight: 110, textAlignVertical: 'top' },
  msgInputLight: { backgroundColor: '#F8FAFC' },
  msgInputDark: { backgroundColor: 'rgba(255,255,255,0.04)' },
  charCount: { fontSize: 10, color: '#94A3B8', textAlign: 'right', marginTop: 6 },
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F59E0B', borderRadius: 12, paddingVertical: 14 },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
