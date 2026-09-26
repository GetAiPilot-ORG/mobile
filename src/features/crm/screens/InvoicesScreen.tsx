import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Linking, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { crmApi } from '../api/crm.api';
import { CRMInvoice, InvoiceStatus } from '../types';
import { useTheme, getColors } from '@/theme';

const WEB_APP_URL = 'https://getaipilot.in';

const STATUS_COLOR: Record<InvoiceStatus, { bg: string; text: string }> = {
  PAID: { bg: '#ECFDF5', text: '#10B981' },
  DUE: { bg: '#FEF3C7', text: '#F59E0B' },
  PARTIALLY_PAID: { bg: '#EFF6FF', text: '#3B82F6' },
  CANCELLED: { bg: '#FEF2F2', text: '#EF4444' },
};

export function InvoicesScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const router = useRouter();
  const [filter, setFilter] = useState<string | undefined>(undefined);

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['crm-invoices', filter],
    queryFn: () => crmApi.getInvoices({ status: filter }),
  });

  const invoices = data?.invoices || [];
  const bg = isDark ? '#0F1015' : '#F8FAFC';
  const card = isDark ? '#1A1D26' : '#FFFFFF';
  const text = isDark ? '#FFFFFF' : '#0F172A';
  const sub = isDark ? '#9CA3AF' : '#64748B';
  const border = isDark ? '#262A34' : '#E2E8F0';

  const openInvoice = (invoice: CRMInvoice) => {
    Linking.openURL(`${WEB_APP_URL}/dashboard/crm/invoices/${invoice.id}`).catch(() => {});
  };

  const renderInvoice = ({ item }: { item: CRMInvoice }) => {
    const statusStyle = STATUS_COLOR[item.status] || STATUS_COLOR.DUE;
    return (
      <Pressable style={[s.row, { backgroundColor: card, borderColor: border }]} onPress={() => openInvoice(item)}>
        <View style={s.rowLeft}>
          <Text style={[s.invNum, { color: text }]}>{item.invoice_number}</Text>
          <Text style={[s.invContact, { color: sub }]}>
            {item.contact ? `${item.contact.first_name || ''} ${item.contact.last_name || ''}`.trim() : 'No contact'}
          </Text>
          <Text style={[s.invDate, { color: sub }]}>{new Date(item.date).toLocaleDateString('en-IN')}</Text>
        </View>
        <View style={s.rowRight}>
          <Text style={[s.invAmount, { color: text }]}>₹{item.total_amount.toLocaleString('en-IN')}</Text>
          <View style={[s.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[s.statusText, { color: statusStyle.text }]}>{item.status}</Text>
          </View>
          <Ionicons name="open-outline" size={14} color={sub} style={{ marginTop: 4 }} />
        </View>
      </Pressable>
    );
  };

  const FILTERS = [undefined, 'DUE', 'PAID', 'PARTIALLY_PAID', 'CANCELLED'];
  const FILTER_LABELS = ['All', 'Due', 'Paid', 'Partial', 'Cancelled'];

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: bg }]} edges={['top']}>
      <View style={s.header}>
        <View>
          <Text style={[s.title, { color: text }]}>Invoices</Text>
          <Text style={[s.subtitle, { color: sub }]}>{data?.total_count ?? 0} total invoices</Text>
        </View>
        <Pressable
          style={s.createBtn}
          onPress={() => Linking.openURL(`${WEB_APP_URL}/dashboard/crm/invoices/create`).catch(() => {})}
        >
          <Ionicons name="add" size={18} color="#FFF" />
          <Text style={s.createBtnText}>Create</Text>
        </Pressable>
      </View>

      <View style={s.filterRow}>
        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item, index }) => (
            <Pressable
              style={[s.filterChip, filter === item && s.filterChipActive, { backgroundColor: filter === item ? '#3B82F6' : card, borderColor: border }]}
              onPress={() => setFilter(item)}
            >
              <Text style={[s.filterChipText, { color: filter === item ? '#FFF' : sub }]}>{FILTER_LABELS[index]}</Text>
            </Pressable>
          )}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        />
      </View>

      {isLoading ? (
        <View style={s.center}><ActivityIndicator color="#3B82F6" /></View>
      ) : invoices.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="receipt-outline" size={48} color={sub} />
          <Text style={[s.emptyTitle, { color: text }]}>No Invoices</Text>
          <Text style={[s.emptySub, { color: sub }]}>Create your first invoice from the web app</Text>
        </View>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(i) => i.id}
          renderItem={renderInvoice}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#3B82F6" />}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  subtitle: { fontSize: 12, marginTop: 2 },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#3B82F6', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  createBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  filterRow: { marginBottom: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterChipActive: {},
  filterChipText: { fontSize: 13, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 100, gap: 8 },
  row: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 14, alignItems: 'flex-start', justifyContent: 'space-between' },
  rowLeft: { flex: 1 },
  invNum: { fontSize: 14, fontWeight: '700' },
  invContact: { fontSize: 12, marginTop: 2 },
  invDate: { fontSize: 11, marginTop: 4 },
  rowRight: { alignItems: 'flex-end' },
  invAmount: { fontSize: 16, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
  statusText: { fontSize: 11, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center', maxWidth: 240 },
});
