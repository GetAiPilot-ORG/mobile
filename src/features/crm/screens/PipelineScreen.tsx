import React, { useState } from 'react';
import {
  Text,
  View,
  FlatList,
  Pressable,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDeals, useCreateDeal, useUpdateDealStage } from '../hooks/useDeals';
import { DealCard } from '../components/DealCard';
import { CreateDealModal } from '../components/CreateDealModal';
import { StageSelectorSheet } from '../components/StageSelectorSheet';
import { CRMDeal, DealStage } from '../types';
import { CrmPipelineSkeleton } from '../../../components/skeletonScreen';

const STAGE_CONFIGS: Array<{ key: string; label: string; color: string }> = [
  { key: 'all', label: 'All Stages', color: '#9CA3AF' },
  { key: 'lead', label: 'Lead', color: '#9CA3AF' },
  { key: 'qualified', label: 'Qualified', color: '#3B82F6' },
  { key: 'proposal', label: 'Proposal', color: '#FBBF24' },
  { key: 'negotiation', label: 'Negotiation', color: '#8B5CF6' },
  { key: 'closed_won', label: 'Closed Won', color: '#10B981' },
  { key: 'closed_lost', label: 'Closed Lost', color: '#EF4444' },
];

interface PipelineScreenProps {
  onBack?: () => void;
}

export const PipelineScreen: React.FC<PipelineScreenProps> = ({ onBack }) => {
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
            <Text className="text-white text-xl font-bold tracking-tight">Pipeline & Deals</Text>
            <Text className="text-slate-400 text-xs mt-0.5">Track revenue, stages & win rates</Text>
          </View>
        </View>

        <Pressable
          className="flex-row items-center gap-1 bg-[#0084FF] px-3 py-2 rounded-xl"
          onPress={() => setShowAddDeal(true)}
          hitSlop={8}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text className="text-white text-xs font-semibold">New Deal</Text>
        </Pressable>
      </View>

      {/* Summary KPI Banner */}
      <View className="flex-row items-center bg-[#181A1F] mx-4 mb-3 rounded-2xl py-3 px-4 border border-[#262930]">
        <View className="flex-1">
          <Text className="text-slate-400 text-[11px] font-medium">Pipeline Value</Text>
          <Text className="text-white text-lg font-bold mt-0.5">₹{totalValue.toLocaleString()}</Text>
        </View>
        <View className="w-[1px] h-7 bg-[#262930] mx-3" />
        <View className="flex-1">
          <Text className="text-slate-400 text-[11px] font-medium">Total Deals</Text>
          <Text className="text-white text-lg font-bold mt-0.5">{deals.length}</Text>
        </View>
      </View>

      {/* Stage Selector Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="max-h-11 mb-2.5"
        contentContainerClassName="px-4 gap-2 flex-row items-center"
      >
        {STAGE_CONFIGS.map((s) => {
          const isSelected = selectedStage === s.key;
          return (
            <Pressable
              key={s.key}
              className={`flex-row items-center px-3 py-2 rounded-xl border gap-1.5 ${
                isSelected
                  ? 'bg-blue-500/15 border-blue-500'
                  : 'bg-[#181A1F] border-[#262930]'
              }`}
              onPress={() => setSelectedStage(s.key)}
            >
              {s.key !== 'all' ? (
                <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
              ) : null}
              <Text
                className="text-xs"
                style={{
                  color: isSelected ? s.color : '#94A3B8',
                  fontWeight: isSelected ? '700' : '500',
                }}
              >
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Deals List */}
      {isLoading && !deals ? (
        <CrmPipelineSkeleton />
      ) : deals.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="briefcase-outline" size={48} color="#475569" />
          <Text className="text-white text-base font-semibold mt-3">No deals in this stage</Text>
          <Text className="text-slate-400 text-xs text-center mt-1.5 mb-5">
            {selectedStage !== 'all'
              ? `No deals currently in the ${selectedStage} stage.`
              : 'Add your first sales deal to populate the pipeline.'}
          </Text>
          <Pressable
            className="bg-[#0084FF] px-4 py-2.5 rounded-xl"
            onPress={() => setShowAddDeal(true)}
          >
            <Text className="text-white text-sm font-semibold">+ Add First Deal</Text>
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
