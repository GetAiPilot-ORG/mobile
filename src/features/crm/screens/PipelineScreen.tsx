import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDeals, useCreateDeal, useUpdateDealStage } from '../hooks/useDeals';
import { DealCard } from '../components/DealCard';
import { CreateDealModal } from '../components/CreateDealModal';
import { StageSelectorSheet } from '../components/StageSelectorSheet';
import { CRMDeal, DealStage } from '../types';

const STAGE_CONFIGS: Array<{ key: string; label: string; color: string }> = [
  { key: 'all', label: 'All Stages', color: '#9CA3AF' },
  { key: 'lead', label: 'Lead', color: '#9CA3AF' },
  { key: 'qualified', label: 'Qualified', color: '#60A5FA' },
  { key: 'proposal', label: 'Proposal', color: '#FBBF24' },
  { key: 'negotiation', label: 'Negotiation', color: '#A78BFA' },
  { key: 'closed_won', label: 'Closed Won', color: '#34D399' },
  { key: 'closed_lost', label: 'Closed Lost', color: '#F87171' },
];

export const PipelineScreen: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [selectedDealForStage, setSelectedDealForStage] = useState<CRMDeal | null>(null);

  const { data: deals = [], isLoading, isRefetching, refetch } = useDeals({
    stage: selectedStage !== 'all' ? selectedStage : undefined,
  });

  const createDeal = useCreateDeal();
  const updateDealStage = useUpdateDealStage();

  // Aggregate values
  const totalValue = deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const wonValue = deals
    .filter((d) => d.stage === 'closed_won')
    .reduce((sum, d) => sum + (Number(d.value) || 0), 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Pipeline & Deals</Text>
          <Text style={styles.subtitle}>Track revenue, stages & win rates</Text>
        </View>

        <Pressable
          style={styles.addBtn}
          onPress={() => setShowAddDeal(true)}
          hitSlop={8}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>New Deal</Text>
        </Pressable>
      </View>

      {/* Summary KPI Banner */}
      <View style={styles.kpiBanner}>
        <View style={styles.kpiCol}>
          <Text style={styles.kpiLabel}>Pipeline Value</Text>
          <Text style={styles.kpiValue}>₹{totalValue.toLocaleString()}</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiCol}>
          <Text style={styles.kpiLabel}>Total Deals</Text>
          <Text style={styles.kpiValue}>{deals.length}</Text>
        </View>
      </View>

      {/* Stage Selector Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.stageScroll}
        contentContainerStyle={styles.stageScrollContent}
      >
        {STAGE_CONFIGS.map((s) => {
          const isSelected = selectedStage === s.key;
          return (
            <Pressable
              key={s.key}
              style={[styles.stageChip, isSelected && styles.stageChipSelected]}
              onPress={() => setSelectedStage(s.key)}
            >
              {s.key !== 'all' ? (
                <View style={[styles.stageDot, { backgroundColor: s.color }]} />
              ) : null}
              <Text style={[styles.stageText, isSelected && { color: s.color, fontWeight: '700' }]}>
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Deals List */}
      {isLoading && !deals ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loaderText}>Loading deals...</Text>
        </View>
      ) : deals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="briefcase-outline" size={48} color="#4B5563" />
          <Text style={styles.emptyTitle}>No deals in this stage</Text>
          <Text style={styles.emptySubtitle}>
            {selectedStage !== 'all'
              ? `No deals currently in the ${selectedStage} stage.`
              : 'Add your first sales deal to populate the pipeline.'}
          </Text>
          <Pressable style={styles.emptyBtn} onPress={() => setShowAddDeal(true)}>
            <Text style={styles.emptyBtnText}>+ Add First Deal</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={deals}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DealCard
              deal={item}
              onPress={() => {}}
              onStageChange={() => setSelectedDealForStage(item)}
            />
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
      <CreateDealModal
        visible={showAddDeal}
        defaultStage={selectedStage !== 'all' ? (selectedStage as DealStage) : 'lead'}
        onClose={() => setShowAddDeal(false)}
        onSubmit={async (deal) => {
          await createDeal.mutateAsync(deal);
        }}
        isLoading={createDeal.isPending}
      />

      {selectedDealForStage ? (
        <StageSelectorSheet
          visible={!!selectedDealForStage}
          currentStage={selectedDealForStage.stage}
          onSelectStage={(newStage) => {
            updateDealStage.mutate({ id: selectedDealForStage.id, stage: newStage });
            setSelectedDealForStage(null);
          }}
          onClose={() => setSelectedDealForStage(null)}
        />
      ) : null}
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
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
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
  kpiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181A20',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#262A34',
  },
  kpiCol: {
    flex: 1,
  },
  kpiLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '500',
  },
  kpiValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  kpiDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#262A34',
    marginHorizontal: 12,
  },
  stageScroll: {
    maxHeight: 44,
    marginBottom: 10,
  },
  stageScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  stageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#181A20',
    borderWidth: 1,
    borderColor: '#262A34',
    gap: 6,
  },
  stageChipSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: '#3B82F6',
  },
  stageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stageText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
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
  },
  emptyBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
