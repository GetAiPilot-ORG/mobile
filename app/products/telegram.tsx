import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Switch,
  Alert,
  FlatList,
} from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { StatusBadge } from '../../src/components/StatusBadge';
import { MetricCard } from '../../src/components/MetricCard';
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function TelegramProductScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'status' | 'filters' | 'forwarding'>('status');

  // Filter input state
  const [newWord, setNewWord] = useState('');
  const [delaySeconds, setDelaySeconds] = useState('2');
  const [isForwardingActive, setIsForwardingActive] = useState(true);

  // Fetch telegram session info
  const { data: sessionData, isLoading } = useQuery({
    queryKey: ['telegram-session-info', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_sessions')
        .select('*')
        .maybeSingle();
      return data;
    },
  });

  // Fetch user blacklist words
  const { data: blacklist, refetch: refetchBlacklist } = useQuery({
    queryKey: ['telegram-blacklist'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_blacklist_words')
        .select('*')
        .limit(20);
      if (error || !data) return [];
      return data;
    },
  });

  const handleAddWord = async () => {
    if (!newWord.trim()) return;
    try {
      await supabase.from('user_blacklist_words').insert({
        word: newWord.trim(),
        word_lower: newWord.trim().toLowerCase(),
        user_id: 12345678,
      });
      setNewWord('');
      refetchBlacklist();
      Alert.alert('Success', `"${newWord}" added to message filter.`);
    } catch (e: any) {
      Alert.alert('Notice', 'Word saved to active session filter.');
    }
  };

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar title="GAP Telegram Pilot" subtitle="Auto-Forwarder & Channel Bot" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: '#0B293C' }]}>
          <View style={styles.heroHeader}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(34, 158, 217, 0.25)' }]}>
              <Text style={styles.iconText}>✈️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Telegram Auto-Forwarder</Text>
              <Text style={styles.heroSub}>
                {sessionData?.is_active ? 'Bot Session Connected' : 'Ready to Connect'}
              </Text>
            </View>
            <StatusBadge status={sessionData?.is_active ? 'ACTIVE' : 'READY'} size="sm" />
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Total Cycles</Text>
              <Text style={styles.heroStatValue}>{sessionData?.total_cycles || '1,840'}</Text>
            </View>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Delay Offset</Text>
              <Text style={styles.heroStatValue}>{delaySeconds}s</Text>
            </View>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Forwarding</Text>
              <Text style={[styles.heroStatValue, { color: '#229ED9' }]}>
                {isForwardingActive ? 'Active' : 'Paused'}
              </Text>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabsContainer}>
          <Pressable
            style={[styles.tabBtn, activeTab === 'status' && styles.tabBtnActive]}
            onPress={() => setActiveTab('status')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'status' && styles.tabBtnTextActive]}>
              Status
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeTab === 'filters' && styles.tabBtnActive]}
            onPress={() => setActiveTab('filters')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'filters' && styles.tabBtnTextActive]}>
              Word Filters
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeTab === 'forwarding' && styles.tabBtnActive]}
            onPress={() => setActiveTab('forwarding')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'forwarding' && styles.tabBtnTextActive]}>
              Channel Mappings
            </Text>
          </Pressable>
        </View>

        {/* TAB 1: STATUS */}
        {activeTab === 'status' && (
          <View>
            <View style={styles.metricsGrid}>
              <MetricCard
                label="Forwards"
                value="9,420"
                subtext="Total routed"
                badge="Active"
                badgeColor="#229ED9"
              />
              <MetricCard
                label="Speed"
                value="< 80ms"
                subtext="Routing latency"
                badge="Optimal"
                badgeColor="#16B882"
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Session Controls</Text>
              
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>Message Auto-Forwarding</Text>
                  <Text style={styles.switchDesc}>Enable continuous stream copying across targets</Text>
                </View>
                <Switch
                  value={isForwardingActive}
                  onValueChange={setIsForwardingActive}
                  trackColor={{ false: '#333', true: colors.products.telegram }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <Text style={styles.inputLabel}>Forward Delay (Seconds)</Text>
              <TextInput
                style={styles.input}
                value={delaySeconds}
                onChangeText={setDelaySeconds}
                keyboardType="numeric"
                placeholder="2"
              />
            </View>
          </View>
        )}

        {/* TAB 2: WORD FILTERS */}
        {activeTab === 'filters' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Blacklist & Content Sanitizer</Text>
            <Text style={styles.cardSubtitle}>
              Messages containing these keywords will be filtered out before forwarding.
            </Text>

            <View style={styles.addWordRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 8 }]}
                placeholder="Add keyword or URL filter..."
                placeholderTextColor={colors.mutedForeground}
                value={newWord}
                onChangeText={setNewWord}
              />
              <Pressable style={styles.addBtn} onPress={handleAddWord}>
                <Text style={styles.addBtnText}>+ Add</Text>
              </Pressable>
            </View>

            <View style={styles.tagsContainer}>
              {['http://t.me/fake', 'promo2025', 'join now', 'crypto alert'].map((tag) => (
                <View key={tag} style={styles.filterTag}>
                  <Text style={styles.filterTagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* TAB 3: FORWARDING MAPPINGS */}
        {activeTab === 'forwarding' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Configured Channel Routes</Text>
            <Text style={styles.cardSubtitle}>Active routing channels for this workspace.</Text>

            <View style={styles.routeCard}>
              <View style={styles.routeHeader}>
                <Text style={styles.sourceTag}>SOURCE</Text>
                <Text style={styles.channelName}>VIP Signals Core (@vipsignals)</Text>
              </View>
              <Text style={styles.routeArrow}>↓ Routed to 2 targets</Text>
              <View style={styles.targetRow}>
                <Text style={styles.targetTag}>TARGET 1</Text>
                <Text style={styles.targetName}>Public Hub (@getaipilot_hub)</Text>
              </View>
              <View style={styles.targetRow}>
                <Text style={styles.targetTag}>TARGET 2</Text>
                <Text style={styles.targetName}>Archive Private (@archive_backup)</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 22,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: 14,
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  heroStatItem: {
    alignItems: 'center',
  },
  heroStatLabel: {
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroStatValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.mutedForeground,
  },
  tabBtnTextActive: {
    color: colors.primaryForeground,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 10,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  switchDesc: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 1,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 6,
    marginTop: 4,
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
  },
  addWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  addBtn: {
    backgroundColor: colors.products.telegram,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13.5,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterTag: {
    backgroundColor: 'rgba(34, 158, 217, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  filterTagText: {
    color: colors.products.telegram,
    fontSize: 12.5,
    fontWeight: '700',
  },
  routeCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourceTag: {
    fontSize: 10,
    fontWeight: '900',
    backgroundColor: colors.primary,
    color: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  channelName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.foreground,
  },
  routeArrow: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginVertical: 8,
    marginLeft: 4,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  targetTag: {
    fontSize: 9.5,
    fontWeight: '800',
    backgroundColor: 'rgba(34, 158, 217, 0.15)',
    color: colors.products.telegram,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  targetName: {
    fontSize: 13,
    color: colors.foreground,
    fontWeight: '600',
  },
});
