import React, { useState } from 'react';
import {
  Text,
  View,
  FlatList,
  TextInput,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLeads, useCreateLead } from '../hooks/useLeads';
import { LeadCard } from '../components/LeadCard';
import { CreateLeadModal } from '../components/CreateLeadModal';
import { CrmFilterSheet } from '../components/CrmFilterSheet';
import { CrmListSkeleton } from '../../../components/skeletonScreen';

interface LeadListScreenProps {
  onSelectLead: (leadId: string) => void;
  onBack?: () => void;
}

const STATUS_TABS: Array<{ key: string; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'lead', label: 'Leads' },
  { key: 'prospect', label: 'Prospects' },
  { key: 'customer', label: 'Customers' },
  { key: 'churned', label: 'Churned' },
];

export const LeadListScreen: React.FC<LeadListScreenProps> = ({ onSelectLead, onBack }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const { data, isLoading, isRefetching, refetch } = useLeads({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    assigned_to: assigneeFilter !== 'all' ? assigneeFilter : undefined,
    search: search.trim() || undefined,
  });

  const createLead = useCreateLead();
  const leads = data?.leads || [];
  const totalCount = data?.total_count || leads.length;

  return (
    <SafeAreaView className="flex-1 bg-[#0B0D10]" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
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
            <View className="flex-row items-center gap-2">
              <Text className="text-white text-xl font-bold tracking-tight">Leads & Contacts</Text>
              <View className="bg-[#262930] px-2 py-0.5 rounded-full">
                <Text className="text-[#0084FF] text-xs font-bold">{totalCount}</Text>
              </View>
            </View>
            <Text className="text-slate-400 text-xs mt-0.5">
              Prospects & customer directory
            </Text>
          </View>
        </View>

        <Pressable
          className="flex-row items-center gap-1 bg-[#0084FF] px-3 py-2 rounded-xl"
          onPress={() => setShowAddModal(true)}
          hitSlop={8}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text className="text-white text-xs font-semibold">New Lead</Text>
        </Pressable>
      </View>

      {/* Search Bar & Filter Button */}
      <View className="flex-row items-center gap-2 px-4 mb-2.5">
        <View className="flex-1 flex-row items-center gap-2 bg-[#181A1F] rounded-xl px-3 py-2 border border-[#262930]">
          <Ionicons name="search" size={16} color="#94A3B8" />
          <TextInput
            className="flex-1 text-white text-sm py-0.5"
            placeholder="Search by name, company, email..."
            placeholderTextColor="#64748B"
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
          />
          {search ? (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          className={`w-10 h-10 rounded-xl items-center justify-center border ${
            statusFilter !== 'all' || assigneeFilter !== 'all'
              ? 'bg-blue-500/10 border-blue-500'
              : 'bg-[#181A1F] border-[#262930]'
          }`}
          onPress={() => setShowFilterSheet(true)}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={statusFilter !== 'all' || assigneeFilter !== 'all' ? '#0084FF' : '#94A3B8'}
          />
        </Pressable>
      </View>

      {/* Status Segment Chips */}
      <View className="flex-row px-4 gap-1.5 mb-3">
        {STATUS_TABS.map((tab) => {
          const isSelected = statusFilter === tab.key;
          return (
            <Pressable
              key={tab.key}
              className={`px-3 py-1.5 rounded-lg border ${
                isSelected
                  ? 'bg-blue-500/20 border-blue-500'
                  : 'bg-[#181A1F] border-[#262930]'
              }`}
              onPress={() => setStatusFilter(tab.key)}
            >
              <Text
                className={`text-xs ${
                  isSelected ? 'text-blue-400 font-bold' : 'text-slate-400 font-medium'
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Leads FlatList */}
      {isLoading && !data ? (
        <CrmListSkeleton />
      ) : leads.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="people-outline" size={48} color="#475569" />
          <Text className="text-white text-base font-semibold mt-3">No matching records</Text>
          <Text className="text-slate-400 text-xs text-center mt-1.5 mb-5 leading-5">
            {search
              ? `No contacts found matching "${search}"`
              : 'Add your first lead to start building your sales pipeline.'}
          </Text>
          <Pressable
            className="bg-[#0084FF] px-4 py-2.5 rounded-xl"
            onPress={() => setShowAddModal(true)}
          >
            <Text className="text-white text-sm font-semibold">+ Add New Lead</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={leads}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <LeadCard lead={item} onPress={() => onSelectLead(item.id)} />
          )}
          contentContainerClassName="px-4 pb-28"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#0084FF"
              colors={['#0084FF']}
            />
          }
        />
      )}

      {/* Modals */}
      <CreateLeadModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={async (lead) => {
          await createLead.mutateAsync(lead);
        }}
        isLoading={createLead.isPending}
      />

      <CrmFilterSheet
        visible={showFilterSheet}
        selectedStatus={statusFilter}
        selectedAssignee={assigneeFilter}
        onApply={({ status, assigned_to }) => {
          setStatusFilter(status || 'all');
          setAssigneeFilter(assigned_to || 'all');
        }}
        onReset={() => {
          setStatusFilter('all');
          setAssigneeFilter('all');
        }}
        onClose={() => setShowFilterSheet(false)}
      />
    </SafeAreaView>
  );
};
