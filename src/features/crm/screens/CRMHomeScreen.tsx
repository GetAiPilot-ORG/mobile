import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { crmApi } from '../api/crm.api';
import { LeadCard } from '../components/LeadCard';
import { LeadFilters } from '../components/LeadFilters';
import { PipelineStage } from '../components/PipelineStage';
import { useLeads } from '../hooks/useLeads';
import { usePipelines } from '../hooks/usePipelines';
import { Lead } from '../types';
import { LeadDetailScreen } from './LeadDetailScreen';

export const CRMHomeScreen: React.FC = () => {
  const queryClient = useQueryClient();

  const [selectedStageId, setSelectedStageId] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // New Lead Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [leadName, setLeadName] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [dealValue, setDealValue] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const { data: pipelines, isLoading: pipelinesLoading } = usePipelines();
  const { data: leadsData, isLoading: leadsLoading, refetch, isRefetching } = useLeads({
    stage_id: selectedStageId,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
    search: searchQuery || undefined,
  });

  const createMutation = useMutation({
    mutationFn: (newLead: Partial<Lead>) => crmApi.createLead(newLead),
    onSuccess: () => {
      setShowAddModal(false);
      setLeadName('');
      setCompanyName('');
      setPhone('');
      setEmail('');
      setDealValue('');
      setNotes('');
      queryClient.invalidateQueries({ queryKey: ['crm_leads'] });
      queryClient.invalidateQueries({ queryKey: ['crm_pipelines'] });
      queryClient.invalidateQueries({ queryKey: ['unified_dashboard'] });
    },
  });

  const advanceStageMutation = useMutation({
    mutationFn: ({ id, nextStageId }: { id: string; nextStageId: string }) =>
      crmApi.moveLead(id, nextStageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm_leads'] });
      queryClient.invalidateQueries({ queryKey: ['crm_pipelines'] });
      queryClient.invalidateQueries({ queryKey: ['unified_dashboard'] });
    },
  });

  if (selectedLeadId) {
    return (
      <LeadDetailScreen
        leadId={selectedLeadId}
        onBack={() => {
          setSelectedLeadId(null);
          refetch();
        }}
      />
    );
  }

  const stages = pipelines?.[0]?.stages || [];
  const leads = leadsData?.leads || [];
  const totalPipelineVal = stages.reduce((acc, s) => acc + (s.total_value || 0), 0);
  const totalLeadCount = leadsData?.total_count || leads.length;

  const getNextStageId = (currentStageId: string): string => {
    switch (currentStageId) {
      case 'lead':
        return 'qualified';
      case 'qualified':
        return 'proposal';
      case 'proposal':
        return 'negotiation';
      case 'negotiation':
        return 'closed_won';
      default:
        return 'closed_won';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>GAP CRM</Text>
            <Text style={styles.subtitle}>Sales Pipelines & Lead Conversion</Text>
          </View>
          <Pressable style={styles.newLeadButton} onPress={() => setShowAddModal(true)}>
            <Text style={styles.newLeadButtonText}>+ New Lead</Text>
          </Pressable>
        </View>

        {/* Top KPI Metrics Banner */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Pipeline Value</Text>
            <Text style={styles.kpiValue}>
              ₹{(totalPipelineVal >= 100000 ? `${(totalPipelineVal / 100000).toFixed(1)}L` : totalPipelineVal.toLocaleString())}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Total Leads</Text>
            <Text style={styles.kpiValue}>{totalLeadCount}</Text>
          </View>
        </View>

        {/* Pipeline Stage Switcher */}
        <Text style={styles.sectionTitle}>Pipeline Stages</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stageScroll}>
          <Pressable
            style={[styles.allStagesPill, !selectedStageId && styles.allStagesActive]}
            onPress={() => setSelectedStageId(undefined)}
          >
            <Text style={[styles.allStagesText, !selectedStageId && styles.allStagesActiveText]}>
              All ({totalLeadCount})
            </Text>
          </Pressable>
          {stages.map((stg) => (
            <PipelineStage
              key={stg.id}
              stage={stg}
              isSelected={selectedStageId === stg.id}
              onPress={() => setSelectedStageId(selectedStageId === stg.id ? undefined : stg.id)}
            />
          ))}
        </ScrollView>

        {/* Search Input Bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search leads by name, email, company, phone..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Status Filters */}
        <LeadFilters selectedStatus={selectedStatus} onSelectStatus={setSelectedStatus} />

        {/* Leads List */}
        {leadsLoading && !leadsData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Syncing CRM lead pipeline...</Text>
          </View>
        ) : (
          <FlatList
            data={leads}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <LeadCard
                lead={item}
                onPress={() => setSelectedLeadId(item.id)}
                onAdvanceStage={() =>
                  advanceStageMutation.mutate({
                    id: item.id,
                    nextStageId: getNextStageId(item.stage_id),
                  })
                }
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6366f1" />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📊</Text>
                <Text style={styles.emptyTitle}>No leads found</Text>
                <Text style={styles.emptySubtitle}>
                  Create your first lead or adjust your filter query to view active opportunities.
                </Text>
              </View>
            }
          />
        )}

        {/* Native Lead Creation Modal */}
        <Modal
          visible={showAddModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAddModal(false)}
        >
          <SafeAreaView style={styles.modalSafeArea}>
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create New Opportunity</Text>
                <Pressable onPress={() => setShowAddModal(false)}>
                  <Text style={styles.closeText}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.inputLabel}>Lead / Contact Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor="#64748b"
                value={leadName}
                onChangeText={setLeadName}
              />

              <Text style={styles.inputLabel}>Company Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Apex Global Solutions"
                placeholderTextColor="#64748b"
                value={companyName}
                onChangeText={setCompanyName}
              />

              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="+91 98765 43210"
                placeholderTextColor="#64748b"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="rahul@apex.com"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              <Text style={styles.inputLabel}>Estimated Deal Value (INR)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="150000"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={dealValue}
                onChangeText={setDealValue}
              />

              <Text style={styles.inputLabel}>Initial Opportunity Notes</Text>
              <TextInput
                style={[styles.modalInput, styles.notesInput]}
                placeholder="Enter client background, requirements, and next action items..."
                placeholderTextColor="#64748b"
                value={notes}
                onChangeText={setNotes}
                multiline
              />

              <Pressable
                style={[styles.createButton, !leadName.trim() && styles.buttonDisabled]}
                disabled={!leadName.trim() || createMutation.isPending}
                onPress={() => {
                  createMutation.mutate({
                    name: leadName.trim(),
                    company: companyName.trim() || null,
                    phone: phone.trim() || null,
                    email: email.trim() || null,
                    value: dealValue ? Number(dealValue) : 0,
                    notes: notes.trim() || null,
                    stage_id: 'lead',
                  });
                }}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.createButtonText}>Create Opportunity</Text>
                )}
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020617' },
  container: { flex: 1, paddingHorizontal: 16 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  title: { color: '#f8fafc', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#64748b', fontSize: 13, marginTop: 2 },
  newLeadButton: { backgroundColor: '#6366f1', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  newLeadButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  kpiRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  kpiCard: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  kpiLabel: { color: '#64748b', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  kpiValue: { color: '#34d399', fontSize: 18, fontWeight: '800', marginTop: 4 },
  sectionTitle: { color: '#cbd5e1', fontSize: 13, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  stageScroll: { flexGrow: 0, marginBottom: 12 },
  allStagesPill: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  allStagesActive: { backgroundColor: '#1e1b4b', borderColor: '#6366f1' },
  allStagesText: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
  allStagesActiveText: { color: '#818cf8' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 10,
  },
  searchIcon: { fontSize: 13, marginRight: 8 },
  searchInput: { flex: 1, color: '#f8fafc', fontSize: 13 },
  clearIcon: { color: '#94a3b8', fontSize: 14, padding: 4 },
  listContent: { paddingBottom: 24 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#64748b', fontSize: 13, marginTop: 12 },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 44, marginBottom: 10 },
  emptyTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptySubtitle: { color: '#64748b', fontSize: 13, textAlign: 'center', lineHeight: 18 },
  modalSafeArea: { flex: 1, backgroundColor: '#020617' },
  modalScroll: { flex: 1 },
  modalContent: { padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700' },
  closeText: { color: '#94a3b8', fontSize: 20, padding: 4 },
  inputLabel: { color: '#cbd5e1', fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 10 },
  modalInput: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  notesInput: { minHeight: 70, textAlignVertical: 'top' },
  createButton: { backgroundColor: '#6366f1', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  buttonDisabled: { opacity: 0.5 },
  createButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
});
