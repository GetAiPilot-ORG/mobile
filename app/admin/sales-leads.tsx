import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { colors } from '../../src/theme/colors';
import { supabase } from '../../src/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { usePlatformSubscription } from '../../src/hooks/usePlatformSubscription';

export default function SalesLeadsScreen() {
  const { isAdmin } = usePlatformSubscription();
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'new' | 'active'>('all');

  const { data: profiles, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-sales-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error || !data) return [];
      return data;
    },
    enabled: !!isAdmin,
  });

  const handleWhatsApp = (phone?: string | null) => {
    if (!phone) return;
    const clean = phone.replace(/[^0-9]/g, '');
    Linking.openURL(`https://wa.me/${clean}?text=Hi!%20Connecting%20from%20GetAIPilot%20Sales.`);
  };

  const handleCall = (phone?: string | null) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  if (!isAdmin) {
    return (
      <AppScreen safeArea={false} backgroundColor={colors.background}>
        <View style={styles.deniedWrapper}>
          <Text style={styles.deniedText}>Admin access required.</Text>
        </View>
      </AppScreen>
    );
  }

  const filtered = (profiles || []).filter((p) => {
    const q = search.toLowerCase();
    const nameMatch = (p.full_name || '').toLowerCase().includes(q);
    const emailMatch = (p.email || '').toLowerCase().includes(q);
    return nameMatch || emailMatch;
  });

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar title="Sales Leads Central" subtitle="User Registrations & CRM Outreach" showBack={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Metric Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Users</Text>
            <Text style={styles.summaryValue}>{profiles?.length || 0}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Conversion Ready</Text>
            <Text style={[styles.summaryValue, { color: '#16B882' }]}>
              {profiles?.filter((p) => Boolean(p.business_name)).length || 0}
            </Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search lead by name or email..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Leads Cards */}
        <View style={styles.leadsList}>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
          ) : filtered.length > 0 ? (
            filtered.map((lead) => (
              <View key={lead.id} style={styles.leadCard}>
                <View style={styles.leadTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.leadName}>
                      {lead.full_name || lead.email?.split('@')[0] || 'Prospective Client'}
                    </Text>
                    <Text style={styles.leadEmail}>{lead.email || 'No email'}</Text>
                    {lead.business_name && (
                      <Text style={styles.leadBiz}>🏢 {lead.business_name}</Text>
                    )}
                  </View>
                  <View style={styles.leadBadge}>
                    <Text style={styles.leadBadgeText}>
                      {lead.is_admin ? 'Admin' : 'Prospect'}
                    </Text>
                  </View>
                </View>

                <View style={styles.leadDivider} />

                <View style={styles.leadBottom}>
                  <Text style={styles.leadDate}>
                    Joined: {new Date(lead.created_at).toLocaleDateString()}
                  </Text>
                  <View style={styles.actionsRow}>
                    <Pressable
                      style={styles.actionWa}
                      onPress={() => handleWhatsApp(lead.email)}
                    >
                      <Text style={styles.actionText}>Chat</Text>
                    </Pressable>
                    <Pressable
                      style={styles.actionCall}
                      onPress={() => handleCall(lead.email)}
                    >
                      <Text style={styles.actionText}>Call</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No leads matching your search criteria.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.foreground,
    marginTop: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.foreground,
  },
  leadsList: {
    gap: 12,
  },
  leadCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  leadTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leadName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.foreground,
  },
  leadEmail: {
    fontSize: 12.5,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  leadBiz: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 3,
  },
  leadBadge: {
    backgroundColor: 'rgba(22, 184, 130, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  leadBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#16B882',
  },
  leadDivider: {
    height: 1,
    backgroundColor: colors.muted,
    marginVertical: 10,
  },
  leadBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leadDate: {
    fontSize: 11.5,
    color: colors.mutedForeground,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionWa: {
    backgroundColor: colors.products.whatsapp,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionCall: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  emptyText: {
    color: colors.mutedForeground,
    fontSize: 13,
  },
  deniedWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deniedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.destructive,
  },
});
