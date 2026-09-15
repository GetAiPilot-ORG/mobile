import React from 'react';
import { Text, View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMembers } from '../hooks/useMembers';
import { useCrmDashboard } from '../hooks/useCrmDashboard';

interface CRMMoreScreenProps {
  onSelectSection: (section: 'contacts' | 'activities') => void;
  onBack?: () => void;
}

export const CRMMoreScreen: React.FC<CRMMoreScreenProps> = ({ onSelectSection, onBack }) => {
  const { data: members = [] } = useMembers();
  const { data: dashboard } = useCrmDashboard();

  return (
    <SafeAreaView className="flex-1 bg-[#0B0D10]" edges={['top']}>
      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-28">
        {/* Header */}
        <View className="py-3.5">
          <View className="flex-row items-center gap-2.5">
            {onBack ? (
              <Pressable
                className="p-1.5 rounded-lg bg-[#181A1F] border border-[#262930]"
                onPress={onBack}
                hitSlop={8}
              >
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              </Pressable>
            ) : null}
            <View>
              <Text className="text-white text-xl font-bold tracking-tight">More CRM Modules</Text>
              <Text className="text-slate-400 text-xs mt-0.5">Team directory, contacts & touchpoint analytics</Text>
            </View>
          </View>
        </View>

        {/* Feature Navigation Grid */}
        <View className="gap-3 mb-6">
          <Pressable
            className="flex-row items-center rounded-2xl p-4 bg-[#181A1F] border border-[#262930]"
            onPress={() => onSelectSection('contacts')}
          >
            <View className="w-11 h-11 rounded-xl items-center justify-center mr-3.5 bg-blue-500/15">
              <Ionicons name="people" size={22} color="#0084FF" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-base font-semibold">Contacts Directory</Text>
              <Text className="text-slate-400 text-xs mt-0.5">All leads, customers, and partners in one place</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#64748B" />
          </Pressable>

          <Pressable
            className="flex-row items-center rounded-2xl p-4 bg-[#181A1F] border border-[#262930]"
            onPress={() => onSelectSection('activities')}
          >
            <View className="w-11 h-11 rounded-xl items-center justify-center mr-3.5 bg-amber-500/15">
              <Ionicons name="time" size={22} color="#F59E0B" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-base font-semibold">Activity Stream</Text>
              <Text className="text-slate-400 text-xs mt-0.5">Unified log of calls, meetings, notes & follow-ups</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#64748B" />
          </Pressable>
        </View>

        {/* Team Members Section */}
        <View className="mb-6">
          <Text className="text-white text-base font-bold mb-3">CRM Team ({members.length})</Text>

          <View className="gap-2">
            {members.map((m) => (
              <View key={m.id} className="flex-row items-center rounded-xl p-3 bg-[#181A1F] border border-[#262930]">
                <View className="w-9 h-9 rounded-lg items-center justify-center mr-3 bg-[#111317] border border-[#262930]">
                  <Text className="text-[#0084FF] text-sm font-bold">
                    {(m.name?.[0] || 'U').toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white text-sm font-semibold">{m.name}</Text>
                  <Text className="text-slate-400 text-xs">{m.email}</Text>
                </View>
                <View className="px-2 py-1 rounded-md bg-[#262930]">
                  <Text className="text-slate-300 text-[11px] font-medium">{m.role || 'Sales Rep'}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Performance Highlights */}
        {dashboard?.stats ? (
          <View className="mb-6">
            <Text className="text-white text-base font-bold mb-3">Performance Snapshot</Text>
            <View className="flex-row gap-2">
              <View className="flex-1 rounded-xl p-3 bg-[#181A1F] border border-[#262930]">
                <Text className="text-slate-400 text-[11px]">Total Contacts</Text>
                <Text className="text-white text-base font-bold mt-1">{dashboard.stats.totalContacts}</Text>
              </View>
              <View className="flex-1 rounded-xl p-3 bg-[#181A1F] border border-[#262930]">
                <Text className="text-slate-400 text-[11px]">Active Deals</Text>
                <Text className="text-white text-base font-bold mt-1">{dashboard.stats.openDeals}</Text>
              </View>
              <View className="flex-1 rounded-xl p-3 bg-[#181A1F] border border-[#262930]">
                <Text className="text-slate-400 text-[11px]">Won Value</Text>
                <Text className="text-white text-base font-bold mt-1">₹{dashboard.stats.wonDealValueThisMonth.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};
