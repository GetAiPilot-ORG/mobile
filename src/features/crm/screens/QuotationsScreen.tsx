import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { crmApi } from '../api/crm.api';
import { CRMQuotation, QuotationStatus } from '../types';

const WEB_APP_URL = 'https://getaipilot.in';

const STATUS_COLOR: Record<QuotationStatus, { bg: string; text: string }> = {
  DRAFT: { bg: '#F1F5F9', text: '#64748B' },
  SENT: { bg: '#EFF6FF', text: '#3B82F6' },
  ACCEPTED: { bg: '#ECFDF5', text: '#10B981' },
  REJECTED: { bg: '#FEF2F2', text: '#EF4444' },
  CONVERTED: { bg: '#F5F3FF', text: '#8B5CF6' },
};

export function QuotationsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [filter, setFilter] = useState<string | undefined>(undefined);

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['crm-quotations', filter],
    queryFn: () => crmApi.getQuotations({ status: filter }),
  });

  const quotations = data?.quotations || [];
  const bg = isDark ? '#0F1015' : '#F8FAFC';
  const card = isDark ? '#1A1D26' : '#FFFFFF';
  const text = isDark ? '#FFFFFF' : '#0F172A';
  const sub = isDark ? '#9CA3AF' : '#64748B';
  const border = isDark ? '#262A34' : '#E2E8F0';

  const openQuotation = (q: CRMQuotation) => {
    Linking.openURL(`${WEB_APP_URL}/dashboard/crm/quotations/${q.id}`).catch(() => { });
  };

  const FILTERS = [undefined, 'DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'CONVERTED'];
  const LABELS = ['All', 'Draft', 'Sent', 'Accepted', 'Rejected', 'Converted'];

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: bg }]} edges={['top']}>
      <View style={[s.header]}>
        <View>
          <Text style={[s.title, { color: text }]}>Quotations</Text>
          <Text style={[s.subtitle, { color: sub }]}>{data?.total_count ?? 0} total</Text>
        </View>
        <Pressable style={s.createBtn} onPress={() => Linking.openURL(`${WEB_APP_URL}/dashboard/crm/quotations/create`).catch(() => { })}>
          <Ionicons name="add" size={18} color="#FFF" />
          <Text style={s.createBtnText}>Create</Text>
        </Pressable>
      </View>

      <FlatList
        data={FILTERS}
        horizontal showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item, index }) => (
          <Pressable
            style={[s.chip, { backgroundColor: filter === item ? '#8B5CF6' : card, borderColor: border }]}
            onPress={() => setFilter(item)}
          >
            <Text style={[s.chipText, { color: filter === item ? '#FFF' : sub }]}>{LABELS[index]}</Text>
          </Pressable>
        )}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 12 }}
      />

      {isLoading ? (
        <View style={s.center}><ActivityIndicator color="#8B5CF6" /></View>
      ) : quotations.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="document-text-outline" size={48} color={sub} />
          <Text style={[s.emptyTitle, { color: text }]}>No Quotations</Text>
        </View>
      ) : (
        <FlatList
          data={quotations}
          keyExtractor={(q) => q.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#8B5CF6" />}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const ss = STATUS_COLOR[item.status] || STATUS_COLOR.DRAFT;
            return (
              <Pressable style={[s.row, { backgroundColor: card, borderColor: border }]} onPress={() => openQuotation(item)}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.qNum, { color: text }]}>{item.quote_number}</Text>
                  <Text style={[s.qSub, { color: sub }]}>
                    {item.contact ? `${item.contact.first_name || ''} ${item.contact.last_name || ''}`.trim() : 'No client'}
                  </Text>
                  <Text style={[s.qDate, { color: sub }]}>{new Date(item.date).toLocaleDateString('en-IN')}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={[s.qAmount, { color: text }]}>₹{item.total_amount.toLocaleString('en-IN')}</Text>
                  <View style={[s.badge, { backgroundColor: ss.bg }]}>
                    <Text style={[s.badgeText, { color: ss.text }]}>{item.status}</Text>
                  </View>
                  <Ionicons name="open-outline" size={14} color={sub} />
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  subtitle: { fontSize: 12, marginTop: 2 },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#8B5CF6', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  createBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 14 },
  qNum: { fontSize: 14, fontWeight: '700' },
  qSub: { fontSize: 12, marginTop: 2 },
  qDate: { fontSize: 11, marginTop: 4 },
  qAmount: { fontSize: 16, fontWeight: '800' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
});
