import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LeaveRequest } from '../../crm/types';
import { teamApi } from '../api/team.api';

type TabType = 'email' | 'wfh';

const WFH_STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#F59E0B' },
  approved: { bg: '#ECFDF5', text: '#10B981' },
  rejected: { bg: '#FEF2F2', text: '#EF4444' },
  cancelled: { bg: '#F1F5F9', text: '#64748B' },
};

export function CommunicationScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [activeTab, setActiveTab] = useState<TabType>('wfh');

  const bg = isDark ? '#0F1015' : '#F8FAFC';
  const card = isDark ? '#1A1D26' : '#FFFFFF';
  const text = isDark ? '#FFFFFF' : '#0F172A';
  const sub = isDark ? '#9CA3AF' : '#64748B';
  const border = isDark ? '#262A34' : '#E2E8F0';

  const { data: wfhData, isLoading: wfhLoading, refetch: refetchWFH, isRefetching: wfhRefetching } = useQuery({
    queryKey: ['team-wfh'],
    queryFn: teamApi.getWFH,
    enabled: activeTab === 'wfh',
  });

  const renderWFH = ({ item }: { item: LeaveRequest }) => {
    const sc = WFH_STATUS_COLOR[item.status] || WFH_STATUS_COLOR.pending;
    const today = new Date().toISOString().split('T')[0];
    const isActive = item.start_date <= today && item.end_date >= today;
    return (
      <View style={[s.card, { backgroundColor: card, borderColor: isActive ? '#8B5CF6' : border, borderWidth: isActive ? 1.5 : 1 }]}>
        <View style={[s.avatar, { backgroundColor: '#F5F3FF' }]}>
          <Text style={[s.avatarText, { color: '#8B5CF6' }]}>
            {item.member?.name?.charAt(0).toUpperCase() ?? '?'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.memberName, { color: text }]}>{item.member?.name || 'Unknown'}</Text>
          <Text style={[s.memberRole, { color: sub }]}>{item.member?.role || ''}</Text>
          <Text style={[s.dateRange, { color: sub }]}>
            {new Date(item.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} →{' '}
            {new Date(item.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
            {' · '}{item.total_days} day{item.total_days !== 1 ? 's' : ''}
          </Text>
          {item.reason && <Text style={[s.reason, { color: sub }]} numberOfLines={1}>{item.reason}</Text>}
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[s.statusText, { color: sc.text }]}>{item.status}</Text>
          </View>
          {isActive && (
            <View style={[s.statusBadge, { backgroundColor: '#F5F3FF' }]}>
              <Text style={[s.statusText, { color: '#8B5CF6' }]}>Active</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const TABS: { key: TabType; label: string; icon: string }[] = [
    { key: 'email', label: 'Email', icon: 'mail' },
    // { key: 'chat', label: 'Chat', icon: 'chatbubbles' },
    { key: 'wfh', label: 'Work from Home', icon: 'home' },
  ];

  const EMAIL_TOOLS = [
    { label: 'Compose Email', icon: 'create-outline', color: '#3B82F6', onPress: () => Linking.openURL('mailto:') },
    { label: 'Open Gmail', icon: 'logo-google', color: '#EF4444', onPress: () => Linking.openURL('https://mail.google.com') },
    { label: 'Open Outlook', icon: 'mail-open-outline', color: '#0078D4', onPress: () => Linking.openURL('https://outlook.com') },
  ];

  const CHAT_TOOLS = [
    { label: 'Open Slack', icon: 'logo-slack', color: '#4A154B', onPress: () => Linking.openURL('https://slack.com') },
    { label: 'Open Teams', icon: 'people-outline', color: '#6264A7', onPress: () => Linking.openURL('https://teams.microsoft.com') },
    { label: 'Open WhatsApp', icon: 'logo-whatsapp', color: '#25D366', onPress: () => Linking.openURL('whatsapp://') },
    { label: 'Open Telegram', icon: 'paper-plane-outline', color: '#2AABEE', onPress: () => Linking.openURL('tg://') },
  ];

  const today = new Date().toISOString().split('T')[0];
  const activeWFH = wfhData?.wfh?.filter(w => w.start_date <= today && w.end_date >= today && w.status === 'approved').length ?? 0;
  const pendingWFH = wfhData?.wfh?.filter(w => w.status === 'pending').length ?? 0;

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: bg }]} edges={['top']}>
      <View style={s.header}>
        <View>
          <Text style={[s.title, { color: text }]}>Communication</Text>
          <Text style={[s.subtitle, { color: sub }]}>Team connectivity hub</Text>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={[s.tabContainer, { backgroundColor: card, borderColor: border }]}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[s.tabBtn, activeTab === tab.key && s.tabBtnActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons name={tab.icon as any} size={16} color={activeTab === tab.key ? '#FFF' : sub} />
            <Text style={[s.tabBtnText, { color: activeTab === tab.key ? '#FFF' : sub }]}>
              {tab.key === 'wfh' ? 'WFH' : tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {activeTab === 'email' && (
          <View style={{ paddingHorizontal: 16, gap: 10, paddingTop: 8 }}>
            <View style={[s.infoCard, { backgroundColor: isDark ? '#1A1D26' : '#EFF6FF', borderColor: '#BFDBFE' }]}>
              <Ionicons name="mail" size={28} color="#3B82F6" />
              <View>
                <Text style={[s.infoTitle, { color: text }]}>Email</Text>
                <Text style={[s.infoSub, { color: sub }]}>Quick access to email tools</Text>
              </View>
            </View>
            {EMAIL_TOOLS.map((tool) => (
              <Pressable key={tool.label} style={[s.toolBtn, { backgroundColor: card, borderColor: border }]} onPress={tool.onPress}>
                <View style={[s.toolIcon, { backgroundColor: tool.color + '20' }]}>
                  <Ionicons name={tool.icon as any} size={22} color={tool.color} />
                </View>
                <Text style={[s.toolLabel, { color: text }]}>{tool.label}</Text>
                <Ionicons name="open-outline" size={16} color={sub} />
              </Pressable>
            ))}
          </View>
        )}
        {/* 
        {activeTab === 'chat' && (
          <View style={{ paddingHorizontal: 16, gap: 10, paddingTop: 8 }}>
            <View style={[s.infoCard, { backgroundColor: isDark ? '#1A1D26' : '#F5F3FF', borderColor: '#DDD6FE' }]}>
              <Ionicons name="chatbubbles" size={28} color="#8B5CF6" />
              <View>
                <Text style={[s.infoTitle, { color: text }]}>Chat & Messaging</Text>
                <Text style={[s.infoSub, { color: sub }]}>Quick launch team chat apps</Text>
              </View>
            </View>
            {CHAT_TOOLS.map((tool) => (
              <Pressable key={tool.label} style={[s.toolBtn, { backgroundColor: card, borderColor: border }]} onPress={tool.onPress}>
                <View style={[s.toolIcon, { backgroundColor: tool.color + '20' }]}>
                  <Ionicons name={tool.icon as any} size={22} color={tool.color} />
                </View>
                <Text style={[s.toolLabel, { color: text }]}>{tool.label}</Text>
                <Ionicons name="open-outline" size={16} color={sub} />
              </Pressable>
            ))}
          </View>
        )} */}

        {activeTab === 'wfh' && (
          <View>
            {/* Summary */}
            <View style={s.wfhSummaryRow}>
              <View style={[s.wfhSummaryCard, { backgroundColor: card, borderColor: border }]}>
                <Ionicons name="home" size={22} color="#8B5CF6" />
                <Text style={[s.wfhSummaryValue, { color: text }]}>{activeWFH}</Text>
                <Text style={[s.wfhSummaryLabel, { color: sub }]}>Active WFH Today</Text>
              </View>
              <View style={[s.wfhSummaryCard, { backgroundColor: card, borderColor: border }]}>
                <Ionicons name="time" size={22} color="#F59E0B" />
                <Text style={[s.wfhSummaryValue, { color: text }]}>{pendingWFH}</Text>
                <Text style={[s.wfhSummaryLabel, { color: sub }]}>Pending Requests</Text>
              </View>
            </View>

            {wfhLoading ? (
              <View style={s.center}><ActivityIndicator color="#8B5CF6" /></View>
            ) : !wfhData?.wfh?.length ? (
              <View style={s.center}>
                <Ionicons name="home-outline" size={48} color={sub} />
                <Text style={[s.emptyTitle, { color: text }]}>No WFH Records</Text>
              </View>
            ) : (
              <View style={{ paddingHorizontal: 16, gap: 8 }}>
                <Text style={[s.sectionLabel, { color: sub }]}>All WFH Requests</Text>
                {wfhData.wfh.map((item) => renderWFH({ item }))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  tabContainer: { flexDirection: 'row', marginHorizontal: 16, borderRadius: 14, padding: 4, borderWidth: 1, marginBottom: 16 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 9, borderRadius: 10 },
  tabBtnActive: { backgroundColor: '#8B5CF6' },
  tabBtnText: { fontSize: 12, fontWeight: '700' },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 4 },
  infoTitle: { fontSize: 15, fontWeight: '700' },
  infoSub: { fontSize: 12, marginTop: 2 },
  toolBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  toolIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  toolLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  wfhSummaryRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  wfhSummaryCard: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 14, alignItems: 'center', gap: 4 },
  wfhSummaryValue: { fontSize: 28, fontWeight: '800' },
  wfhSummaryLabel: { fontSize: 11, textAlign: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 14 },
  avatar: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800' },
  memberName: { fontSize: 14, fontWeight: '700' },
  memberRole: { fontSize: 11, marginTop: 1 },
  dateRange: { fontSize: 12, marginTop: 3 },
  reason: { fontSize: 11, marginTop: 2, fontStyle: 'italic' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  sectionLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  center: { paddingTop: 60, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '600' },
});
