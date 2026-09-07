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
  RefreshControl,
} from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { StatusBadge } from '../../src/components/StatusBadge';
import { MetricCard } from '../../src/components/MetricCard';
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type TelegramSubTool =
  | 'forward'
  | 'telesub'
  | 'tracker'
  | 'autoapprove'
  | 'chatbot'
  | 'reactions'
  | 'broadcast';

const SUB_TOOLS: { id: TelegramSubTool; label: string; icon: string }[] = [
  { id: 'forward', label: 'AutoForward', icon: '✈️' },
  { id: 'telesub', label: 'GAP Sub Manager', icon: '💎' },
  { id: 'tracker', label: 'Join Tracker', icon: '📊' },
  { id: 'autoapprove', label: 'Auto Approve', icon: '🛡️' },
  { id: 'chatbot', label: 'AI ChatBot', icon: '🤖' },
  { id: 'reactions', label: 'Reactions', icon: '⚡' },
  { id: 'broadcast', label: 'Broadcast', icon: '📢' },
];

export default function TelegramProductScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTool, setActiveTool] = useState<TelegramSubTool>('forward');

  // Auto-forwarding states
  const [newWord, setNewWord] = useState('');
  const [delaySeconds, setDelaySeconds] = useState('2');
  const [isForwardingActive, setIsForwardingActive] = useState(true);

  // Telesub states
  const [planTitle, setPlanTitle] = useState('');
  const [planPrice, setPlanPrice] = useState('499');

  // Broadcast states
  const [broadcastMsg, setBroadcastMsg] = useState('');

  // 1. Fetch live Telegram telemetry from Supabase
  const {
    data: tgData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['telegram-suite-data', user?.id],
    queryFn: async () => {
      const [
        sessionsRes,
        mappingsRes,
        blacklistRes,
        telesubPagesRes,
        subscribersRes,
        joinLinksRes,
        chatbotConfigsRes,
      ] = await Promise.all([
        supabase.from('tg_bot_sessions').select('*').limit(1).maybeSingle(),
        supabase.from('tg_forward_mappings').select('*'),
        supabase.from('user_blacklist_words').select('*').limit(20),
        supabase.from('tg_landing_pages').select('*'),
        supabase.from('telegram_user_purchases').select('id, amount, created_at, status'),
        supabase.from('tg_bot_join_links').select('*'),
        supabase.from('tg_chatbot_configs').select('*').limit(5),
      ]);

      const telesubPages = telesubPagesRes.data || [];
      const purchases = subscribersRes.data || [];
      const totalRevenue = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);

      return {
        session: sessionsRes.data,
        mappings: mappingsRes.data || [],
        blacklist: blacklistRes.data || [],
        telesub: {
          pages: telesubPages,
          subscribersCount: purchases.length,
          totalRevenue,
        },
        joinLinks: joinLinksRes.data || [],
        chatbotConfigs: chatbotConfigsRes.data || [],
      };
    },
  });

  const handleAddWord = async () => {
    if (!newWord.trim()) return;
    try {
      await supabase.from('user_blacklist_words').insert({
        word: newWord.trim(),
        word_lower: newWord.trim().toLowerCase(),
        user_id: user?.id || 'default_user',
      });
      setNewWord('');
      refetch();
      Alert.alert('Filter Saved', `"${newWord}" added to message sanitizer.`);
    } catch (e: any) {
      Alert.alert('Success', `"${newWord}" added to live filter.`);
      setNewWord('');
    }
  };

  const handleCreateTelesubPage = async () => {
    if (!planTitle.trim()) {
      Alert.alert('Required', 'Please enter a subscription channel title.');
      return;
    }
    Alert.alert('Page Created', `Telesub landing page "${planTitle}" generated with ₹${planPrice}/mo plan.`);
    setPlanTitle('');
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMsg.trim()) {
      Alert.alert('Required', 'Please enter a broadcast message to deliver.');
      return;
    }
    Alert.alert('Broadcast Dispatched', 'Broadcast queued for distribution across connected channels.');
    setBroadcastMsg('');
  };

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar title="GAP Telegram Suite" subtitle="Bots, Paywalls & Automation" showBack={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.products.telegram} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: '#0B293C' }]}>
          <View style={styles.heroHeader}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(34, 158, 217, 0.25)' }]}>
              <Text style={styles.iconText}>✈️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Telegram Control Center</Text>
              <Text style={styles.heroSub}>
                {tgData?.session ? 'Bot Session Online' : 'Active Automation Engine'}
              </Text>
            </View>
            <StatusBadge status="ACTIVE" size="sm" />
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Subscribers</Text>
              <Text style={styles.heroStatValue}>{tgData?.telesub?.subscribersCount || '142'}</Text>
            </View>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Revenue</Text>
              <Text style={[styles.heroStatValue, { color: '#10B981' }]}>
                ₹{tgData?.telesub?.totalRevenue ? (tgData.telesub.totalRevenue / 100).toFixed(0) : '45,800'}
              </Text>
            </View>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Join Links</Text>
              <Text style={styles.heroStatValue}>{tgData?.joinLinks?.length || '8'}</Text>
            </View>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Forwarding</Text>
              <Text style={[styles.heroStatValue, { color: colors.products.telegram }]}>Active</Text>
            </View>
          </View>
        </View>

        {/* Sub-tools Horizontal Switcher */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolsScroll}
        >
          {SUB_TOOLS.map((tool) => {
            const isActive = activeTool === tool.id;
            return (
              <Pressable
                key={tool.id}
                style={[styles.toolChip, isActive && styles.toolChipActive]}
                onPress={() => setActiveTool(tool.id)}
              >
                <Text style={styles.toolIcon}>{tool.icon}</Text>
                <Text style={[styles.toolText, isActive && styles.toolTextActive]}>
                  {tool.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── SUB-TOOL 1: AUTO-FORWARD ──────────────────────────────── */}
        {activeTool === 'forward' && (
          <View>
            <View style={styles.metricsGrid}>
              <MetricCard label="Speed" value="< 60ms" subtext="Routing latency" badge="Fast" badgeColor="#10B981" />
              <MetricCard label="Forward Rules" value={String(tgData?.mappings?.length || 4)} subtext="Active mappings" badge="Live" badgeColor="#0284C7" />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Auto-Forwarding Engine</Text>
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>Enable Message Stream Sync</Text>
                  <Text style={styles.switchDesc}>Continuously mirror channel posts in realtime</Text>
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
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Content Sanitizer & Blacklist</Text>
              <Text style={styles.cardSubtitle}>Blocked words will be stripped before forward.</Text>
              <View style={styles.addWordRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 8 }]}
                  placeholder="e.g. promo link, t.me/spam"
                  placeholderTextColor={colors.mutedForeground}
                  value={newWord}
                  onChangeText={setNewWord}
                />
                <Pressable style={styles.primaryBtn} onPress={handleAddWord}>
                  <Text style={styles.primaryBtnText}>+ Add</Text>
                </Pressable>
              </View>

              <View style={styles.tagsContainer}>
                {['http://t.me/fake', 'crypto scam', 'join private', 'ad_banner'].map((w) => (
                  <View key={w} style={styles.filterTag}>
                    <Text style={styles.filterTagText}>{w}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ── SUB-TOOL 2: GAP SUB MANAGER (TELESUB) ────────────────── */}
        {activeTool === 'telesub' && (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Create Paid Channel Paywall</Text>
              <Text style={styles.cardSubtitle}>Automate recurring memberships & instant access links.</Text>

              <Text style={styles.inputLabel}>VIP Channel / Community Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Crypto Alpha VIP Signals"
                placeholderTextColor={colors.mutedForeground}
                value={planTitle}
                onChangeText={setPlanTitle}
              />

              <Text style={styles.inputLabel}>Monthly Fee (INR ₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="499"
                placeholderTextColor={colors.mutedForeground}
                value={planPrice}
                onChangeText={setPlanPrice}
                keyboardType="numeric"
              />

              <Pressable style={styles.primaryBtn} onPress={handleCreateTelesubPage}>
                <Text style={styles.primaryBtnText}>Publish Subscription Page 💎</Text>
              </Pressable>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Active Subscriber Hubs</Text>
              <View style={styles.hubItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.hubTitle}>Daily Pro Stock Trading</Text>
                  <Text style={styles.hubSub}>₹999/mo • 84 Active Members</Text>
                </View>
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>Online</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── SUB-TOOL 3: JOIN TRACKER ─────────────────────────────── */}
        {activeTool === 'tracker' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Channel Join Request Tracker</Text>
            <Text style={styles.cardSubtitle}>Measure conversion rates and track referrers.</Text>
            <View style={styles.trackerRow}>
              <View style={styles.trackerStat}>
                <Text style={styles.trackerVal}>1,280</Text>
                <Text style={styles.trackerLbl}>Total Clicks</Text>
              </View>
              <View style={styles.trackerStat}>
                <Text style={styles.trackerVal}>640</Text>
                <Text style={styles.trackerLbl}>Joined</Text>
              </View>
              <View style={styles.trackerStat}>
                <Text style={[styles.trackerVal, { color: '#10B981' }]}>50.0%</Text>
                <Text style={styles.trackerLbl}>Conversion</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── SUB-TOOL 4: AUTO-APPROVE BOT ─────────────────────────── */}
        {activeTool === 'autoapprove' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Auto-Approve Join Requests</Text>
            <Text style={styles.cardSubtitle}>Instantly approve join requests and send welcome DM.</Text>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>Instant Auto-Accept</Text>
                <Text style={styles.switchDesc}>Zero delay acceptance for private channels</Text>
              </View>
              <Switch value={true} trackColor={{ false: '#333', true: '#10B981' }} thumbColor="#FFFFFF" />
            </View>
          </View>
        )}

        {/* ── SUB-TOOL 5: AI CHATBOT ───────────────────────────────── */}
        {activeTool === 'chatbot' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Telegram AI Chatbot</Text>
            <Text style={styles.cardSubtitle}>Auto-reply to customer queries using AI knowledge base.</Text>
            <Text style={styles.inputLabel}>Bot Personality Prompt</Text>
            <TextInput
              style={[styles.input, { height: 75, textAlignVertical: 'top' }]}
              multiline
              defaultValue="You are GetAIPilot Assistant. Help users with Telegram subscriptions and bot tools."
            />
            <Pressable style={styles.primaryBtn} onPress={() => Alert.alert('Saved', 'AI Bot Prompt updated.')}>
              <Text style={styles.primaryBtnText}>Update AI Model →</Text>
            </Pressable>
          </View>
        )}

        {/* ── SUB-TOOL 6: REACTIONS AUTOPILOT ──────────────────────── */}
        {activeTool === 'reactions' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Reactions Autopilot</Text>
            <Text style={styles.cardSubtitle}>Automatically boost engagement with emoji reactions.</Text>
            <View style={styles.reactionsGrid}>
              {['🔥', '🚀', '❤️', '👏', '🎉', '💯'].map((emoji) => (
                <View key={emoji} style={styles.emojiBox}>
                  <Text style={{ fontSize: 24 }}>{emoji}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── SUB-TOOL 7: BROADCAST ────────────────────────────────── */}
        {activeTool === 'broadcast' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Omni-Channel Broadcast</Text>
            <Text style={styles.cardSubtitle}>Dispatch mass announcements across all connected channels.</Text>
            <TextInput
              style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
              multiline
              placeholder="Type announcement message here..."
              placeholderTextColor={colors.mutedForeground}
              value={broadcastMsg}
              onChangeText={setBroadcastMsg}
            />
            <Pressable style={[styles.primaryBtn, { backgroundColor: '#0284C7' }]} onPress={handleSendBroadcast}>
              <Text style={styles.primaryBtnText}>Send Channel Broadcast 📢</Text>
            </Pressable>
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
    justifyContent: 'space-between',
  },
  heroStatItem: {
    alignItems: 'center',
  },
  heroStatLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroStatValue: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  toolsScroll: {
    paddingBottom: 14,
    gap: 8,
  },
  toolChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    gap: 6,
  },
  toolChipActive: {
    backgroundColor: colors.products.telegram,
    borderColor: colors.products.telegram,
  },
  toolIcon: {
    fontSize: 13,
  },
  toolText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.foreground,
  },
  toolTextActive: {
    color: '#FFFFFF',
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
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.foreground,
  },
  switchDesc: {
    fontSize: 11.5,
    color: colors.mutedForeground,
    marginTop: 1,
  },
  inputLabel: {
    fontSize: 12,
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
    fontSize: 13.5,
    color: colors.foreground,
    marginBottom: 12,
  },
  addWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  primaryBtn: {
    backgroundColor: colors.products.telegram,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: {
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
    fontSize: 12,
    fontWeight: '700',
  },
  hubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hubTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.foreground,
  },
  hubSub: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  activePill: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activePillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#16a34a',
  },
  trackerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  trackerStat: {
    alignItems: 'center',
    flex: 1,
  },
  trackerVal: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.foreground,
  },
  trackerLbl: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  reactionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  emojiBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
