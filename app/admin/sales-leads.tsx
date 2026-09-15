import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Linking,
  RefreshControl,
} from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { supabase } from '../../src/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { usePlatformSubscription } from '../../src/hooks/usePlatformSubscription';
import { SalesLeadsSkeleton } from '../../src/components/skeletonScreen';

export default function SalesLeadsScreen() {
  const { isAdmin } = usePlatformSubscription();
  const [search, setSearch] = useState('');

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
      <AppScreen safeArea={false} className="flex-1 bg-[#0B0D10]">
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-base font-bold text-red-500">Admin access required.</Text>
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
    <AppScreen safeArea={false} className="flex-1 bg-[#0B0D10]">
      <AppTopBar title="Sales Leads Central" subtitle="User Registrations & CRM Outreach" showBack={true} />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#0084FF" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Metric Cards */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 rounded-2xl p-3.5 border border-[#262930] bg-[#181A1F]">
            <Text className="text-[11px] font-bold uppercase text-slate-400">Total Users</Text>
            <Text className="text-2xl font-black text-white mt-1">{profiles?.length || 0}</Text>
          </View>
          <View className="flex-1 rounded-2xl p-3.5 border border-[#262930] bg-[#181A1F]">
            <Text className="text-[11px] font-bold uppercase text-slate-400">Conversion Ready</Text>
            <Text className="text-2xl font-black text-emerald-400 mt-1">
              {profiles?.filter((p) => Boolean(p.business_name)).length || 0}
            </Text>
          </View>
        </View>

        {/* Search */}
        <View className="flex-row items-center rounded-xl px-3 h-11 border border-[#262930] bg-[#181A1F] mb-4">
          <Text className="text-sm mr-2">🔍</Text>
          <TextInput
            className="flex-1 text-xs text-white"
            placeholder="Search lead by name or email..."
            placeholderTextColor="#64748B"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Leads Cards */}
        <View className="gap-3">
          {isLoading ? (
            <SalesLeadsSkeleton />
          ) : filtered.length > 0 ? (
            filtered.map((lead) => (
              <View key={lead.id} className="rounded-2xl p-3.5 border border-[#262930] bg-[#181A1F]">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 pr-2">
                    <Text className="text-sm font-black text-white">
                      {lead.full_name || lead.email?.split('@')[0] || 'Prospective Client'}
                    </Text>
                    <Text className="text-xs text-slate-400 mt-0.5">{lead.email || 'No email'}</Text>
                    {lead.business_name ? (
                      <Text className="text-xs text-[#0084FF] font-bold mt-1">🏢 {lead.business_name}</Text>
                    ) : null}
                  </View>
                  <View className="bg-emerald-500/15 px-2 py-0.5 rounded-md">
                    <Text className="text-[10px] font-black text-emerald-400">
                      {lead.is_admin ? 'Admin' : 'Prospect'}
                    </Text>
                  </View>
                </View>

                <View className="h-px bg-[#262930] my-2.5" />

                <View className="flex-row justify-between items-center">
                  <Text className="text-[11px] text-slate-400">
                    Joined: {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'N/A'}
                  </Text>
                  <View className="flex-row gap-2">
                    <Pressable
                      className="px-2.5 py-1 rounded-md bg-[#25D366]"
                      onPress={() => handleWhatsApp(lead.email)}
                    >
                      <Text className="text-white text-[11px] font-bold">Chat</Text>
                    </Pressable>
                    <Pressable
                      className="px-2.5 py-1 rounded-md bg-[#0084FF]"
                      onPress={() => handleCall(lead.email)}
                    >
                      <Text className="text-white text-[11px] font-bold">Call</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View className="p-6 items-center rounded-xl bg-[#181A1F] border border-[#262930]">
              <Text className="text-xs text-slate-400">No leads matching your search criteria.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </AppScreen>
  );
}
