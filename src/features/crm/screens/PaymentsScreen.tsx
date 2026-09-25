import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, useColorScheme, Linking, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { crmApi } from '../api/crm.api';
import { CRMPayment } from '../types';

const WEB_APP_URL = 'https://getaipilot.in';

const METHOD_ICON: Record<string, string> = {
  bank_transfer: 'business-outline',
  upi: 'phone-portrait-outline',
  cash: 'cash-outline',
  cheque: 'document-outline',
  card: 'card-outline',
};

export function PaymentsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['crm-payments'],
    queryFn: () => crmApi.getPayments(),
  });

  const payments = data?.payments || [];
  const bg = isDark ? '#0F1015' : '#F8FAFC';
  const card = isDark ? '#1A1D26' : '#FFFFFF';
  const text = isDark ? '#FFFFFF' : '#0F172A';
  const sub = isDark ? '#9CA3AF' : '#64748B';
  const border = isDark ? '#262A34' : '#E2E8F0';

  const open = (p: CRMPayment) => {
    if (p.invoice_id) {
      Linking.openURL(`${WEB_APP_URL}/dashboard/crm/invoices/${p.invoice_id}`).catch(() => {});
    }
  };

  const totalCollected = payments.reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: bg }]} edges={['top']}>
      <View style={s.header}>
        <View>
          <Text style={[s.title, { color: text }]}>Payments</Text>
          <Text style={[s.subtitle, { color: sub }]}>₹{totalCollected.toLocaleString('en-IN')} collected</Text>
        </View>
        <Pressable style={s.createBtn} onPress={() => Linking.openURL(`${WEB_APP_URL}/dashboard/crm/payments/record`).catch(() => {})}>
          <Ionicons name="add" size={18} color="#FFF" />
          <Text style={s.createBtnText}>Record</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={s.center}><ActivityIndicator color="#EC4899" /></View>
      ) : payments.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="cash-outline" size={48} color={sub} />
          <Text style={[s.emptyTitle, { color: text }]}>No Payments</Text>
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(p) => p.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#EC4899" />}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const methodIcon = (METHOD_ICON[item.payment_method || ''] || 'cash-outline') as any;
            return (
              <Pressable style={[s.row, { backgroundColor: card, borderColor: border }]} onPress={() => open(item)}>
                <View style={[s.methodIcon, { backgroundColor: '#FDF2F8' }]}>
                  <Ionicons name={methodIcon} size={20} color="#EC4899" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.paymentMethod, { color: text }]}>
                    {(item.payment_method || 'Unknown').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Text>
                  {item.invoice && (
                    <Text style={[s.invRef, { color: sub }]}>Invoice: {item.invoice.invoice_number}</Text>
                  )}
                  {item.utr_number && <Text style={[s.utr, { color: sub }]}>UTR: {item.utr_number}</Text>}
                  <Text style={[s.date, { color: sub }]}>{new Date(item.payment_date).toLocaleDateString('en-IN')}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={[s.amount, { color: '#10B981' }]}>+₹{item.amount.toLocaleString('en-IN')}</Text>
                  {item.invoice_id && <Ionicons name="open-outline" size={14} color={sub} />}
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
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EC4899', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  createBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  methodIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  paymentMethod: { fontSize: 14, fontWeight: '700' },
  invRef: { fontSize: 12, marginTop: 2 },
  utr: { fontSize: 11, marginTop: 1 },
  date: { fontSize: 11, marginTop: 2 },
  amount: { fontSize: 17, fontWeight: '800' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
});
