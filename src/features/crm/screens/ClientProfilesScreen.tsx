import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, useColorScheme, Linking, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { crmApi } from '../api/crm.api';
import { CRMBillingProfile } from '../types';

const WEB_APP_URL = 'https://getaipilot.in';

export function ClientProfilesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['crm-billing-profiles'],
    queryFn: () => crmApi.getBillingProfiles(),
  });

  const profiles = data?.profiles || [];
  const bg = isDark ? '#0F1015' : '#F8FAFC';
  const card = isDark ? '#1A1D26' : '#FFFFFF';
  const text = isDark ? '#FFFFFF' : '#0F172A';
  const sub = isDark ? '#9CA3AF' : '#64748B';
  const border = isDark ? '#262A34' : '#E2E8F0';

  const open = (p: CRMBillingProfile) => {
    Linking.openURL(`${WEB_APP_URL}/dashboard/crm/billing-profiles/${p.id}`).catch(() => {});
  };

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: bg }]} edges={['top']}>
      <View style={s.header}>
        <View>
          <Text style={[s.title, { color: text }]}>Client Profiles</Text>
          <Text style={[s.subtitle, { color: sub }]}>{data?.total_count ?? 0} billing profiles</Text>
        </View>
        <Pressable style={s.createBtn} onPress={() => Linking.openURL(`${WEB_APP_URL}/dashboard/crm/billing-profiles/create`).catch(() => {})}>
          <Ionicons name="add" size={18} color="#FFF" />
          <Text style={s.createBtnText}>Create</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={s.center}><ActivityIndicator color="#06B6D4" /></View>
      ) : profiles.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="card-outline" size={48} color={sub} />
          <Text style={[s.emptyTitle, { color: text }]}>No Client Profiles</Text>
          <Text style={[s.emptySub, { color: sub }]}>Add billing profiles for your clients</Text>
        </View>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(p) => p.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#06B6D4" />}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable style={[s.row, { backgroundColor: card, borderColor: border }]} onPress={() => open(item)}>
              <View style={[s.avatar, { backgroundColor: '#ECFEFF' }]}>
                <Text style={s.avatarText}>{item.legal_name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.name, { color: text }]}>{item.legal_name}</Text>
                {item.gstin && <Text style={[s.sub, { color: sub }]}>GST: {item.gstin}</Text>}
                {item.billing_address_city && (
                  <Text style={[s.sub, { color: sub }]}>
                    {[item.billing_address_city, item.billing_address_state].filter(Boolean).join(', ')}
                  </Text>
                )}
              </View>
              <Ionicons name="open-outline" size={16} color={sub} />
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  subtitle: { fontSize: 12, marginTop: 2 },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#06B6D4', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  createBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  avatar: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#06B6D4' },
  name: { fontSize: 15, fontWeight: '700' },
  sub: { fontSize: 12, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center', maxWidth: 240 },
});
