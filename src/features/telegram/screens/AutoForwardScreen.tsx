import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { TelegramToolKey } from '../types';
import { StatCard } from '../components/ui/StatCard';

type AfSection = 'mappings' | 'filters' | 'blocked' | 'delays' | 'headers';

interface AutoForwardScreenProps {
  forwardRules: any[];
  onOpenModal: (key: TelegramToolKey) => void;
}

export const AutoForwardScreen: React.FC<AutoForwardScreenProps> = ({ forwardRules, onOpenModal }) => {
  const isDark = useColorScheme() === 'dark';
  const [afSection, setAfSection] = useState<AfSection>('mappings');
  const [selectedDelay, setSelectedDelay] = useState(0);

  const card = isDark ? styles.cardDark : styles.cardLight;
  const txt = isDark ? styles.textDark : styles.textLight;
  const border = isDark ? styles.borderDark : styles.borderLight;

  const kpis = [
    { key: 'mappings', label: 'Active Mappings', value: (forwardRules || []).length, icon: 'arrow-redo', color: '#0284C7', bg: 'rgba(2,132,199,0.12)' },
    { key: 'filters', label: 'Text Filters', value: 0, icon: 'filter-outline', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
    { key: 'blocked', label: 'Blocked Words', value: 0, icon: 'shield-outline', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
    { key: 'delays', label: 'Delay (sec)', value: 0, icon: 'time-outline', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  ];

  return (
    <>
      {/* Hero Card */}
      <View style={[styles.heroCard, card]}>
        <View style={styles.heroRow}>
          <View style={styles.heroLeft}>
            <View style={styles.heroIconCircle}>
              <Ionicons name="flash" size={18} color="#0284C7" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.heroTitle, txt]} numberOfLines={1}>AutoForward</Text>
              <View style={styles.activeRow}>
                <View style={styles.dotGreen} />
                <Text style={styles.activeText}>System Active</Text>
              </View>
            </View>
          </View>
          <Pressable
            style={styles.openBotBtn}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Linking.openURL('https://t.me/Gapautoforwardingbot');
            }}
          >
            <Ionicons name="logo-android" size={14} color="#FFFFFF" />
            <Text style={styles.openBotBtnText}>Open Bot</Text>
          </Pressable>
        </View>
      </View>

      {/* KPI Grid */}
      <View style={styles.kpiGrid}>
        {kpis.map((k) => (
          <StatCard
            key={k.key}
            label={k.label.toUpperCase()}
            value={k.value}
            icon={k.icon}
            color={k.color}
            bg={k.bg}
            sub={k.label}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setAfSection(k.key as AfSection);
            }}
          />
        ))}
        <StatCard
          label="TEXT ACTIONS"
          value="None"
          icon="text-outline"
          color="#10B981"
          bg="rgba(16,185,129,0.12)"
          sub="Text Actions"
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setAfSection('headers');
          }}
        />
      </View>

      {/* New Rule Button */}
      <Pressable style={styles.primaryBtn} onPress={() => onOpenModal('autoforward')}>
        <Ionicons name="add" size={16} color="#FFFFFF" />
        <Text style={styles.primaryBtnText}>Configure New Forwarding Rule</Text>
      </Pressable>

      {/* MAPPINGS */}
      {afSection === 'mappings' && (
        <View style={[styles.sectionCard, card]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconCircle, { backgroundColor: 'rgba(2,132,199,0.12)' }]}>
              <Ionicons name="arrow-redo" size={14} color="#0284C7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, txt]}>Active Routing Rules</Text>
              <Text style={styles.sectionSub}>{Math.max((forwardRules || []).length, 2)} source-to-target forwarding channels configured</Text>
            </View>
          </View>
          <View style={{ gap: 8, marginTop: 8 }}>
            {(forwardRules || []).map((rule, idx) => (
              <View key={`rule_${rule.id || idx}`} style={[styles.mappingRow, isDark ? styles.mappingRowDark : styles.mappingRowLight]}>
                <View style={styles.mappingLeft}>
                  <View style={styles.mappingArrow}>
                    <Ionicons name="arrow-redo" size={12} color="#0284C7" />
                  </View>
                  <Text style={[styles.mappingSource, txt]} numberOfLines={1}>{rule.source_chat_title || 'Source Channel'}</Text>
                </View>
                <Ionicons name="arrow-forward" size={14} color="#94A3B8" style={{ marginHorizontal: 8 }} />
                <View style={[styles.targetBadge, isDark ? styles.targetBadgeDark : styles.targetBadgeLight]}>
                  <Text style={[styles.targetBadgeText, txt]} numberOfLines={1}>{rule.target_chat_title || 'Target Channel'}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* FILTERS */}
      {afSection === 'filters' && (
        <View style={[styles.sectionCard, card]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconCircle, { backgroundColor: 'rgba(139,92,246,0.12)' }]}>
              <Ionicons name="filter-outline" size={14} color="#8B5CF6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, txt]}>Word Filters & Text Replacements</Text>
              <Text style={styles.sectionSub}>Automatic link and username replacement rules</Text>
            </View>
          </View>
          <View style={{ gap: 8, marginTop: 8 }}>
            {[
              { from: 't.me/old_channel', to: 't.me/TradingGuruVIP' },
              { from: '@competitor_bot', to: '@GetAiPilotBot' },
              { from: 'Call 9876543210', to: 'Visit getaipilot.in' },
            ].map((item, idx) => (
              <View key={idx} style={[styles.filterItem, border]}>
                <Text style={styles.filterFrom}>{item.from}</Text>
                <Ionicons name="arrow-forward" size={14} color="#94A3B8" />
                <Text style={styles.filterTo}>{item.to}</Text>
              </View>
            ))}
          </View>
          <Pressable style={[styles.primaryBtn, { marginTop: 12 }]} onPress={() => onOpenModal('autoforward')}>
            <Ionicons name="add" size={15} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>Add Replacement Rule</Text>
          </Pressable>
        </View>
      )}

      {/* BLOCKED */}
      {afSection === 'blocked' && (
        <View style={[styles.sectionCard, card]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconCircle, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
              <Ionicons name="shield-outline" size={14} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, txt]}>Blacklisted Keywords</Text>
              <Text style={styles.sectionSub}>Messages with these keywords are automatically dropped</Text>
            </View>
          </View>
          <View style={styles.chipsWrap}>
            {['spam', 'forex scam', '100x pump', 'wa.me/', 'dm for paid', 'free giveaway', 'binance scam'].map((chip, idx) => (
              <View key={idx} style={styles.blockedChip}>
                <Text style={styles.blockedChipText}>{chip}</Text>
                <Ionicons name="close-circle" size={12} color="#EF4444" />
              </View>
            ))}
          </View>
          <Pressable style={[styles.primaryBtn, { marginTop: 12 }]} onPress={() => onOpenModal('autoforward')}>
            <Ionicons name="add" size={15} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>Add Blocked Keyword</Text>
          </Pressable>
        </View>
      )}

      {/* DELAYS */}
      {afSection === 'delays' && (
        <View style={[styles.sectionCard, card]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconCircle, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
              <Ionicons name="time-outline" size={14} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, txt]}>Forwarding Delay Interval</Text>
              <Text style={styles.sectionSub}>Prevent Telegram rate-limiting & simulate natural typing</Text>
            </View>
          </View>
          <View style={[styles.delayBigBox, isDark ? styles.delayBoxDark : styles.delayBoxLight]}>
            <Text style={[styles.delayBigNumber, txt]}>{selectedDelay}</Text>
            <Text style={styles.delayBigLabel}>seconds delay active</Text>
          </View>
          <View style={styles.delayPresetsRow}>
            {[0, 5, 15, 30, 60].map((sec) => (
              <Pressable
                key={sec}
                style={[styles.delayPresetBtn, border, selectedDelay === sec && styles.delayPresetBtnActive]}
                onPress={() => setSelectedDelay(sec)}
              >
                <Text style={[styles.delayPresetText, txt, selectedDelay === sec && { color: '#FFFFFF' }]}>
                  {sec === 0 ? 'Instant' : `${sec}s`}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* HEADERS */}
      {afSection === 'headers' && (
        <View style={[styles.sectionCard, card]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconCircle, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
              <Ionicons name="text-outline" size={14} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, txt]}>Prefix & Suffix Headers</Text>
              <Text style={styles.sectionSub}>Brand your forwarded messages with custom headers & signatures</Text>
            </View>
          </View>
          <View style={styles.previewBox}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#0284C7', marginBottom: 4 }}>🔥 [VIP SIGNAL ALERT - FORWARDED]</Text>
            <Text style={styles.previewText}>Buy BankNifty 51,200 CE at 340-350 | Target 420 | SL 290. Strict trailing.</Text>
            <Text style={{ fontSize: 10, fontWeight: '600', color: '#10B981', marginTop: 4 }}>📈 Verified by SEBI Analyst • Powered by @GetAiPilot</Text>
          </View>
          <Pressable style={[styles.primaryBtn, { marginTop: 4 }]} onPress={() => onOpenModal('autoforward')}>
            <Ionicons name="create-outline" size={15} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>Customize Header & Footer</Text>
          </Pressable>
        </View>
      )}
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
  heroCard: { padding: 12, borderRadius: 16, borderWidth: 1, marginBottom: 14 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, paddingRight: 8 },
  heroIconCircle: { width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(2,132,199,0.12)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 15, fontWeight: '800' },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  dotGreen: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  activeText: { color: '#64748B', fontSize: 11, fontWeight: '600' },
  openBotBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0284C7', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8 },
  openBotBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 12, width: '100%' },
  kpiCard: { width: '47%', padding: 12, borderRadius: 14, borderWidth: 1 },
  kpiCardActive: { borderColor: '#0284C7', borderWidth: 2 },
  kpiIconCircle: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  kpiValue: { fontSize: 20, fontWeight: '800' },
  kpiSub: { fontSize: 10, color: '#64748B', marginTop: 2, fontWeight: '600' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#0284C7', borderRadius: 12, paddingVertical: 13, marginBottom: 12 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  sectionCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  sectionIconCircle: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(2,132,199,0.12)', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '800' },
  sectionSub: { fontSize: 11, color: '#64748B', marginTop: 1 },
  mappingRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 10, borderWidth: 1 },
  mappingRowLight: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  mappingRowDark: { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' },
  mappingLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  mappingArrow: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(2,132,199,0.12)', alignItems: 'center', justifyContent: 'center' },
  mappingSource: { fontSize: 12, fontWeight: '600', flex: 1 },
  targetBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, maxWidth: '45%' },
  targetBadgeLight: { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' },
  targetBadgeDark: { backgroundColor: 'rgba(2,132,199,0.1)', borderColor: 'rgba(2,132,199,0.25)' },
  targetBadgeText: { fontSize: 11, fontWeight: '600' },
  filterItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1 },
  filterFrom: { fontSize: 11, color: '#EF4444', fontWeight: '600', flex: 1 },
  filterTo: { fontSize: 11, color: '#10B981', fontWeight: '600', flex: 1 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  blockedChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(239,68,68,0.08)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  blockedChipText: { fontSize: 11, color: '#EF4444', fontWeight: '600' },
  delayBigBox: { alignItems: 'center', padding: 20, borderRadius: 12, marginVertical: 12 },
  delayBoxLight: { backgroundColor: '#F8FAFC' },
  delayBoxDark: { backgroundColor: 'rgba(255,255,255,0.04)' },
  delayBigNumber: { fontSize: 48, fontWeight: '900', letterSpacing: -2 },
  delayBigLabel: { fontSize: 12, color: '#64748B', fontWeight: '600', marginTop: 4 },
  delayPresetsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  delayPresetBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  delayPresetBtnActive: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  delayPresetText: { fontSize: 12, fontWeight: '700' },
  previewBox: { backgroundColor: 'rgba(2,132,199,0.06)', borderRadius: 10, padding: 12, marginVertical: 12 },
  previewText: { fontSize: 12, color: '#64748B', lineHeight: 18 },
});
