import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TelegramToolKey } from '../types';
import { StatCard } from '../components/ui/StatCard';

interface Props {
  chats: any[];
  summary: any;
  onOpenModal: (key: TelegramToolKey) => void;
}

export const AutoApproveScreen: React.FC<Props> = ({ chats, summary, onOpenModal }) => {
  const isDark = useColorScheme() === 'dark';
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [channelEnabled, setChannelEnabled] = useState<Record<string, boolean>>({});

  const card = isDark ? styles.cardDark : styles.cardLight;
  const txt = isDark ? styles.textDark : styles.textLight;

  const displayChats = chats?.length > 0 ? chats : [
    { id: 'ch-1', title: 'Trading Guru VIP', members: 420 },
    { id: 'ch-2', title: 'Zero To Hero Trading', members: 890 },
    { id: 'ch-3', title: 'BankNifty Option Hub', members: 310 },
  ];

  return (
    <>
      {/* Hero */}
      <View style={[styles.hero, card]}>
        <View style={[styles.heroIcon, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
          <Ionicons name="checkmark-done-circle" size={28} color="#10B981" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heroTitle, txt]}>Auto Approve</Text>
          <Text style={styles.heroSub}>Instant approval of private channel join requests — zero manual work</Text>
        </View>
        <Switch
          value={globalEnabled}
          onValueChange={setGlobalEnabled}
          trackColor={{ false: '#CBD5E1', true: '#10B981' }}
          thumbColor="#FFFFFF"
        />
      </View>

      {/* Stats */}
      <View style={[styles.statsRow, { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }]}>
        {[
          { label: 'CHANNELS', val: displayChats.length, color: '#0284C7', icon: 'megaphone-outline', bg: 'rgba(2,132,199,0.12)', hint: 'Target channels' },
          { label: 'APPROVED TODAY', val: summary?.autoApprovedToday ?? 0, color: '#10B981', icon: 'checkmark-circle-outline', bg: 'rgba(16,185,129,0.12)', hint: 'Approved' },
          { label: 'PENDING', val: summary?.pendingRequests ?? 0, color: '#F59E0B', icon: 'time-outline', bg: 'rgba(245,158,11,0.12)', hint: 'Waitlist' },
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

      {/* How it Works */}
      <View style={[styles.sectionCard, card]}>
        <Text style={[styles.sectionTitle, txt]}>How it Works</Text>
        <View style={{ gap: 10, marginTop: 10 }}>
          {[
            { step: '1', text: 'User clicks join request on your private Telegram channel', color: '#0284C7' },
            { step: '2', text: 'GAP Auto Approve Bot detects the request in real-time', color: '#8B5CF6' },
            { step: '3', text: 'Request instantly approved — user enters channel automatically', color: '#10B981' },
          ].map((item) => (
            <View key={item.step} style={styles.stepRow}>
              <View style={[styles.stepCircle, { backgroundColor: `${item.color}20` }]}>
                <Text style={[styles.stepNum, { color: item.color }]}>{item.step}</Text>
              </View>
              <Text style={[styles.stepText, txt]}>{item.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Channel Toggles */}
      <View style={[styles.sectionCard, card]}>
        <Text style={[styles.sectionTitle, txt]}>Channel Configuration</Text>
        <View style={{ gap: 8, marginTop: 10 }}>
          {displayChats.map((ch: any) => {
            const enabled = channelEnabled[ch.id] !== undefined ? channelEnabled[ch.id] : globalEnabled;
            return (
              <View key={ch.id} style={[styles.chanRow, isDark ? styles.chanRowDark : styles.chanRowLight]}>
                <View style={styles.chanAvatar}>
                  <Text style={styles.chanAvatarText}>{(ch.title || 'C').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.chanName, txt]} numberOfLines={1}>{ch.title}</Text>
                  <Text style={styles.chanStatus}>{enabled ? '🟢 Auto Approve Active' : '🔴 Manual Mode'}</Text>
                </View>
                <Switch
                  value={enabled}
                  onValueChange={(val) => setChannelEnabled((prev) => ({ ...prev, [ch.id]: val }))}
                  trackColor={{ false: '#CBD5E1', true: '#10B981' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            );
          })}
        </View>
      </View>

      {/* Bot Setup CTA */}
      <Pressable style={styles.primaryBtn} onPress={() => onOpenModal('auto_approve')}>
        <Ionicons name="settings-outline" size={16} color="#FFFFFF" />
        <Text style={styles.primaryBtnText}>Configure Bot Settings</Text>
      </Pressable>
    </>
  );
};

const styles = StyleSheet.create({
  cardLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  cardDark: { backgroundColor: '#121212', borderColor: '#27272A' },
  textLight: { color: '#0F172A' },
  textDark: { color: '#F8FAFC' },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 14 },
  heroIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 18, fontWeight: '800' },
  heroSub: { fontSize: 12, color: '#64748B', lineHeight: 17, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, padding: 12, borderRadius: 14, borderWidth: 1, alignItems: 'center', gap: 4 },
  statIconCircle: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statVal: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, color: '#64748B', fontWeight: '600' },
  sectionCard: { padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '800' },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepNum: { fontSize: 13, fontWeight: '900' },
  stepText: { fontSize: 13, lineHeight: 19, flex: 1, paddingTop: 4 },
  chanRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10 },
  chanRowLight: { backgroundColor: '#F8FAFC' },
  chanRowDark: { backgroundColor: 'rgba(255,255,255,0.04)' },
  chanAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#0284C7', alignItems: 'center', justifyContent: 'center' },
  chanAvatarText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  chanName: { fontSize: 13, fontWeight: '700' },
  chanStatus: { fontSize: 10, color: '#64748B', marginTop: 1 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#10B981', borderRadius: 12, paddingVertical: 14 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
