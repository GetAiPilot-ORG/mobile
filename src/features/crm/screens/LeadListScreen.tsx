import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLeads, useCreateLead } from '../hooks/useLeads';
import { LeadCard } from '../components/LeadCard';
import { CreateLeadModal } from '../components/CreateLeadModal';
import { CrmFilterSheet } from '../components/CrmFilterSheet';
import { ContactStatus } from '../types';

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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onBack ? (
            <Pressable style={styles.backBtn} onPress={onBack} hitSlop={8}>
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </Pressable>
          ) : null}
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Leads & Contacts</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{totalCount}</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>Prospects & customer directory</Text>
          </View>
        </View>

        <Pressable
          style={styles.addBtn}
          onPress={() => setShowAddModal(true)}
          hitSlop={8}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>New Lead</Text>
        </Pressable>
      </View>

      {/* Search Bar & Filter Button */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, company, email..."
            placeholderTextColor="#6B7280"
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
          />
          {search ? (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#9CA3AF" />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          style={[styles.filterBtn, (statusFilter !== 'all' || assigneeFilter !== 'all') && styles.filterBtnActive]}
          onPress={() => setShowFilterSheet(true)}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={statusFilter !== 'all' || assigneeFilter !== 'all' ? '#3B82F6' : '#9CA3AF'}
          />
        </Pressable>
      </View>

      {/* Status Segment Chips */}
      <View style={styles.tabContainer}>
        {STATUS_TABS.map((tab) => {
          const isSelected = statusFilter === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={[styles.tabChip, isSelected && styles.tabChipSelected]}
              onPress={() => setStatusFilter(tab.key)}
            >
              <Text style={[styles.tabText, isSelected && styles.tabTextSelected]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Leads FlatList */}
      {isLoading && !data ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loaderText}>Loading leads...</Text>
        </View>
      ) : leads.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color="#4B5563" />
          <Text style={styles.emptyTitle}>No matching records</Text>
          <Text style={styles.emptySubtitle}>
            {search
              ? `No contacts found matching "${search}"`
              : 'Add your first lead to start building your sales pipeline.'}
          </Text>
          <Pressable style={styles.emptyAddBtn} onPress={() => setShowAddModal(true)}>
            <Text style={styles.emptyAddBtnText}>+ Add New Lead</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={leads}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <LeadCard lead={item} onPress={() => onSelectLead(item.id)} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#3B82F6"
              colors={['#3B82F6']}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F1015',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#1E2028',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: '#262A34',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '700',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#181A20',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#262A34',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#181A20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#262A34',
  },
  filterBtnActive: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 12,
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#181A20',
    borderWidth: 1,
    borderColor: '#262A34',
  },
  tabChipSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3B82F6',
  },
  tabText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  tabTextSelected: {
    color: '#60A5FA',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  loaderBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 18,
  },
  emptyAddBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
