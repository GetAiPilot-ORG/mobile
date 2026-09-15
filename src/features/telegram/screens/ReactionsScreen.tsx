import React, { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TelegramToolKey } from '../types';
import { StatCard } from '../components/ui/StatCard';

interface Props {
  chats: any[];
  onOpenModal: (key: TelegramToolKey) => void;
}

const REACTION_EMOJIS = ['👍', '❤️', '🔥', '🎉', '💎', '🚀', '💯', '⚡️', '🏆', '💪'];

export const ReactionsScreen: React.FC<Props> = ({ chats, onOpenModal }) => {
  const isDark = useColorScheme() === 'dark';
  const [enabled, setEnabled] = useState(true);
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>(['👍', '🔥', '💎']);
  const [delay, setDelay] = useState(3);
  const [count, setCount] = useState(10);

  const card = isDark ? styles.cardDark : styles.cardLight;
  const txt = isDark ? styles.textDark : styles.textLight;

  const toggleEmoji = (emoji: string) => {
    setSelectedEmojis((prev) =>
      prev.includes(emoji) ? prev.filter((e) => e !== emoji) : prev.length < 5 ? [...prev, emoji] : prev
    );
  };

  return (
    <>
      {/* Hero */}
      <View style={[styles.hero, card]}>
        <View style={[styles.heroIcon, { backgroundColor: 'rgba(251,191,36,0.12)' }]}>
          <Ionicons name="sparkles" size={28} color="#FBBF24" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heroTitle, txt]}>GAP Reactions</Text>
          <Text style={styles.heroSub}>Automated emoji reaction delivery to posts for social proof & engagement</Text>
        </View>
        <Switch value={enabled} onValueChange={setEnabled} trackColor={{ false: '#CBD5E1', true: '#FBBF24' }} thumbColor="#FFFFFF" />
      </View>

      {/* Stats */}
      <View style={[styles.statsRow, { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }]}>
        {[
          { label: 'CHANNELS', val: (chats || []).length, color: '#0284C7', icon: 'megaphone-outline', bg: 'rgba(2,132,199,0.12)', hint: 'Target channels' },
          { label: 'REACTIONS SENT', val: 0, color: '#FBBF24', icon: 'sparkles-outline', bg: 'rgba(251,191,36,0.12)', hint: 'Total sent' },
          { label: 'POSTS BOOSTED', val: 0, color: '#10B981', icon: 'trending-up-outline', bg: 'rgba(16,185,129,0.12)', hint: 'Engaged posts' },
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

      {/* Emoji Picker */}
      <View style={[styles.sectionCard, card]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={[styles.sectionTitle, txt]}>Select Emojis (max 5)</Text>
          <Text style={styles.selectedCount}>{selectedEmojis.length}/5 selected</Text>
        </View>
        <View style={styles.emojiGrid}>
          {REACTION_EMOJIS.map((emoji) => {
            const isSelected = selectedEmojis.includes(emoji);
            return (
              <Pressable
                key={emoji}
                style={[styles.emojiBtn, isSelected && styles.emojiBtnActive]}
                onPress={() => toggleEmoji(emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
                {isSelected && (
                  <View style={styles.emojiCheck}>
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
        <View style={styles.selectedPreview}>
          <Text style={styles.selectedPreviewLabel}>Active reactions:</Text>
          <Text style={{ fontSize: 22 }}>{selectedEmojis.join('  ')}</Text>
        </View>
      </View>

      {/* Config */}
      <View style={[styles.sectionCard, card]}>
        <Text style={[styles.sectionTitle, txt]}>Delivery Config</Text>
        <View style={{ gap: 14, marginTop: 10 }}>
          {/* Delay */}
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={[styles.configLabel, txt]}>Delivery Delay</Text>
              <Text style={styles.configValue}>{delay}s after post</Text>
            </View>
            <View style={styles.sliderRow}>
              {[1, 3, 5, 10, 30].map((d) => (
                <Pressable key={d} style={[styles.sliderBtn, delay === d && styles.sliderBtnActive]} onPress={() => setDelay(d)}>
                  <Text style={[styles.sliderBtnText, delay === d && styles.sliderBtnTextActive]}>{d}s</Text>
                </Pressable>
              ))}
            </View>
          </View>
          {/* Count */}
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={[styles.configLabel, txt]}>Reactions per Post</Text>
              <Text style={styles.configValue}>{count} reactions</Text>
            </View>
            <View style={styles.sliderRow}>
              {[5, 10, 25, 50, 100].map((c) => (
                <Pressable key={c} style={[styles.sliderBtn, count === c && styles.sliderBtnActive]} onPress={() => setCount(c)}>
                  <Text style={[styles.sliderBtnText, count === c && styles.sliderBtnTextActive]}>{c}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* CTA */}
      <Pressable style={styles.primaryBtn} onPress={() => onOpenModal('reactions')}>
        <Ionicons name="settings-outline" size={16} color="#FFFFFF" />
        <Text style={styles.primaryBtnText}>Open Reactions Console</Text>
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
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 14, width: '100%' },
  statVal: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 10, color: '#64748B', fontWeight: '600', marginTop: 2 },
  sectionCard: { padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '800' },
  selectedCount: { fontSize: 11, color: '#FBBF24', fontWeight: '700' },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiBtn: { width: 52, height: 52, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  emojiBtnActive: { backgroundColor: 'rgba(251,191,36,0.15)', borderWidth: 2, borderColor: '#FBBF24' },
  emojiText: { fontSize: 26 },
  emojiCheck: { position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: 8, backgroundColor: '#FBBF24', alignItems: 'center', justifyContent: 'center' },
  selectedPreview: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  selectedPreviewLabel: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  configLabel: { fontSize: 13, fontWeight: '700' },
  configValue: { fontSize: 12, color: '#FBBF24', fontWeight: '700' },
  sliderRow: { flexDirection: 'row', gap: 8 },
  sliderBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  sliderBtnActive: { backgroundColor: '#FBBF24', borderColor: '#FBBF24' },
  sliderBtnText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  sliderBtnTextActive: { color: '#FFFFFF' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FBBF24', borderRadius: 12, paddingVertical: 14 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
