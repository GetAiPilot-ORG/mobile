import { getColors, useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CrmListSkeleton } from '../../../components/skeletonScreen';
import { CreateLeadModal } from '../components/CreateLeadModal';
import { CrmFilterSheet } from '../components/CrmFilterSheet';
import { LeadCard } from '../components/LeadCard';
import { useCreateLead, useLeads } from '../hooks/useLeads';

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
  const { isDark } = useTheme();
  const colors = getColors(isDark);

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onBack ? (
            <Pressable
              style={[styles.backBtn, { backgroundColor: colors.buttonPrimary }]}
              onPress={onBack}
              hitSlop={8}
            >
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
            </Pressable>
          ) : null}
          <View>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.text }]}>Leads & Contacts</Text>
              <View style={[styles.countBadge, { backgroundColor: colors.surface }]}>
                <Text style={styles.countText}>{totalCount}</Text>
              </View>
            </View>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Prospects & customer directory
            </Text>
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
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by name, company, email..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
          />
          {search ? (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          style={[
            styles.filterBtn,
            { backgroundColor: colors.surface, borderColor: colors.border },
            (statusFilter !== 'all' || assigneeFilter !== 'all') && styles.filterBtnActive,
          ]}
          onPress={() => setShowFilterSheet(true)}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={statusFilter !== 'all' || assigneeFilter !== 'all' ? '#3B82F6' : colors.textMuted}
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
              style={[
                styles.tabChip,
                { backgroundColor: colors.surface, borderColor: colors.border },
                isSelected && (isDark ? styles.tabChipSelectedDark : styles.tabChipSelectedLight),
              ]}
              onPress={() => setStatusFilter(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: colors.textMuted },
                  isSelected && styles.tabTextSelected,
                ]}
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
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color={colors.text} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No matching records</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
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
  tabChipSelectedDark: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3B82F6',
  },
  tabChipSelectedLight: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tabTextSelected: {
    color: '#3B82F6',
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
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtitle: {
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
