import { getColors, useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { crmApi } from '../api/crm.api';
import { CRMBillingProfile } from '../types';

const WEB_APP_URL = 'https://getaipilot.in';

export interface ClientProfilesScreenProps {
  onBack?: () => void;
}

export function ClientProfilesScreen({ onBack }: ClientProfilesScreenProps = {}) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/products/crm');
    }
  };

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['crm-billing-profiles'],
    queryFn: () => crmApi.getBillingProfiles(),
  });

  const profiles = data?.profiles || [];
  const bg = colors.background;
  const card = colors.surface;
  const text = colors.text;
  const sub = colors.textMuted;
  const border = colors.border;

  const open = (p: CRMBillingProfile) => {
    Linking.openURL(`${WEB_APP_URL}/dashboard/crm/billing-profiles/${p.id}`).catch(() => { });
  };

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: bg }]} edges={['top']}>
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: card,
            }}
            onPress={handleBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={20} color={text} />
          </Pressable>
          <View>
            <Text style={[s.title, { color: text }]}>Client Profiles</Text>
            <Text style={[s.subtitle, { color: sub }]}>{data?.total_count ?? 0} billing profiles</Text>
          </View>
        </View>
        <Pressable style={s.createBtn} onPress={() => Linking.openURL(`${WEB_APP_URL}/dashboard/crm/billing-profiles/create`).catch(() => { })}>
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
          renderItem={({ item }) => {
            const displayName = item.legal_name || 'Client';
            const initial = (displayName.trim().charAt(0) || 'C').toUpperCase();
            const location = [item.billing_address_city, item.billing_address_state].filter(Boolean).join(', ');

            return (
              <Pressable style={[s.row, { backgroundColor: card, borderColor: border }]} onPress={() => open(item)}>
                <View style={[s.avatar, { backgroundColor: '#ECFEFF' }]}>
                  <Text style={s.avatarText}>{initial}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.name, { color: text }]}>{displayName}</Text>
                  {Boolean(item.gstin) && (
                    <Text style={[s.sub, { color: sub }]}>GST: {item.gstin}</Text>
                  )}
                  {Boolean(location) && (
                    <Text style={[s.sub, { color: sub }]}>{location}</Text>
                  )}
                </View>
                <Ionicons name="open-outline" size={16} color={sub} />
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
