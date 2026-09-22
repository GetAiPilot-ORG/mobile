import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  ScrollView,
  RefreshControl,
  TextInput,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useDeals, useCreateDeal, useUpdateDealStage } from '../hooks/useDeals';
import { DealCard } from '../components/DealCard';
import { CreateDealModal } from '../components/CreateDealModal';
import { StageSelectorSheet } from '../components/StageSelectorSheet';
import { CRMDeal, DealStage } from '../types';
import { CrmPipelineSkeleton } from '../../../components/skeletonScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 320);

const KANBAN_STAGES: Array<{ key: DealStage; label: string; color: string; bg: string }> = [
  { key: 'lead', label: 'Lead', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.12)' },
  { key: 'qualified', label: 'Qualified', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  { key: 'proposal', label: 'Proposal', color: '#D97706', bg: 'rgba(217, 119, 6, 0.12)' },
  { key: 'negotiation', label: 'Negotiation', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' },
  { key: 'closed_won', label: 'Closed Won', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  { key: 'closed_lost', label: 'Closed Lost', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
];

const NEXT_STAGE_MAP: Record<DealStage, DealStage | null> = {
  lead: 'qualified',
  qualified: 'proposal',
  proposal: 'negotiation',
  negotiation: 'closed_won',
  closed_won: null,
  closed_lost: null,
};

function formatCurrency(val: number): string {
  if (!val || isNaN(val)) return '₹0';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
  return `₹${val.toLocaleString()}`;
}

interface PipelineScreenProps {
  onBack?: () => void;
  onSelectDeal?: (dealId: string) => void;
}

export const PipelineScreen: React.FC<PipelineScreenProps> = ({ onBack, onSelectDeal }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddDeal, setShowAddDeal] = useState<boolean>(false);
  const [defaultStageForAdd, setDefaultStageForAdd] = useState<DealStage>('lead');
  const [selectedDealForStage, setSelectedDealForStage] = useState<CRMDeal | null>(null);

  const { data: allDeals = [], isLoading, isRefetching, refetch } = useDeals();
  const createDeal = useCreateDeal();
  const updateDealStage = useUpdateDealStage();

  // Search filtered deals
  const filteredDeals = useMemo(() => {
    return allDeals.filter((d) => {
      const matchesSearch =
        !searchQuery.trim() ||
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.contact?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.contact?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.contact?.company?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStage =
        selectedStageFilter === 'all' || d.stage === selectedStageFilter;

      return matchesSearch && matchesStage;
    });
  }, [allDeals, searchQuery, selectedStageFilter]);

  // Aggregate KPI metrics
  const totalPipelineValue = useMemo(() => {
    return allDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  }, [allDeals]);

  const wonValue = useMemo(() => {
    return allDeals
      .filter((d) => d.stage === 'closed_won')
      .reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  }, [allDeals]);

  const wonCount = useMemo(() => {
    return allDeals.filter((d) => d.stage === 'closed_won').length;
  }, [allDeals]);

  // Group deals by stage for Kanban Board
  const stageGroups = useMemo(() => {
    const groups: Record<DealStage, CRMDeal[]> = {
      lead: [],
      qualified: [],
      proposal: [],
      negotiation: [],
      closed_won: [],
      closed_lost: [],
    };

    allDeals.forEach((deal) => {
      if (searchQuery.trim()) {
        const matches =
          deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          deal.contact?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          deal.contact?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          deal.contact?.company?.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matches) return;
      }
      if (groups[deal.stage]) {
        groups[deal.stage].push(deal);
      }
    });

    return groups;
  }, [allDeals, searchQuery]);

  const handleAdvanceStage = (deal: CRMDeal) => {
    const nextStage = NEXT_STAGE_MAP[deal.stage];
    if (nextStage) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      updateDealStage.mutate({ id: deal.id, stage: nextStage });
    } else {
      setSelectedDealForStage(deal);
    }
  };

  const handleOpenAddDeal = (stage: DealStage = 'lead') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setDefaultStageForAdd(stage);
    setShowAddDeal(true);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#0F1015' : '#F8FAFC' }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onBack ? (
            <Pressable
              style={[styles.backBtn, { backgroundColor: isDark ? '#1E2028' : '#F1F5F9' }]}
              onPress={onBack}
              hitSlop={8}
            >
              <Ionicons name="arrow-back" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
            </Pressable>
          ) : null}
          <View>
            <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Sales Pipeline</Text>
            <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
              {allDeals.length} active deals • {formatCurrency(totalPipelineValue)}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Board / List Toggle */}
          <View style={[styles.toggleContainer, { backgroundColor: isDark ? '#1E2028' : '#F1F5F9' }]}>
            <Pressable
              style={[styles.toggleBtn, viewMode === 'board' && styles.toggleBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setViewMode('board');
              }}
            >
              <Ionicons
                name="grid-outline"
                size={16}
                color={viewMode === 'board' ? '#FFFFFF' : isDark ? '#9CA3AF' : '#64748B'}
              />
            </Pressable>
            <Pressable
              style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setViewMode('list');
              }}
            >
              <Ionicons
                name="list-outline"
                size={16}
                color={viewMode === 'list' ? '#FFFFFF' : isDark ? '#9CA3AF' : '#64748B'}
              />
            </Pressable>
          </View>

          {/* New Deal Button */}
          <Pressable
            style={styles.addBtn}
            onPress={() => handleOpenAddDeal('lead')}
            hitSlop={8}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Deal</Text>
          </Pressable>
        </View>
      </View>

      {/* Summary KPI Banner */}
      <View
        style={[
          styles.kpiBanner,
          { backgroundColor: isDark ? '#181A20' : '#FFFFFF', borderColor: isDark ? '#262A34' : '#E2E8F0' },
        ]}
      >
        <View style={styles.kpiCol}>
          <Text style={[styles.kpiLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>Total Pipeline</Text>
          <Text style={[styles.kpiValue, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            {formatCurrency(totalPipelineValue)}
          </Text>
        </View>
        <View style={[styles.kpiDivider, { backgroundColor: isDark ? '#262A34' : '#E2E8F0' }]} />
        <View style={styles.kpiCol}>
          <Text style={[styles.kpiLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>Deals Won</Text>
          <Text style={[styles.kpiValue, { color: '#10B981' }]}>
            {formatCurrency(wonValue)}
          </Text>
        </View>
        <View style={[styles.kpiDivider, { backgroundColor: isDark ? '#262A34' : '#E2E8F0' }]} />
        <View style={styles.kpiCol}>
          <Text style={[styles.kpiLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>Win Ratio</Text>
          <Text style={[styles.kpiValue, { color: '#3B82F6' }]}>
            {allDeals.length > 0 ? `${Math.round((wonCount / allDeals.length) * 100)}%` : '0%'}
          </Text>
        </View>
      </View>

      {/* Search Input Bar */}
      <View
        style={[
          styles.searchBar,
          { backgroundColor: isDark ? '#181A20' : '#FFFFFF', borderColor: isDark ? '#262A34' : '#E2E8F0' },
        ]}
      >
        <Ionicons name="search" size={16} color={isDark ? '#6B7280' : '#94A3B8'} />
        <TextInput
          style={[styles.searchInput, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
          placeholder="Filter deals by title or client..."
          placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
            <Ionicons name="close-circle" size={16} color={isDark ? '#6B7280' : '#94A3B8'} />
          </Pressable>
        ) : null}
      </View>

      {/* Main Content: Kanban Board vs List View */}
      {isLoading && !allDeals ? (
        <CrmPipelineSkeleton />
      ) : viewMode === 'board' ? (
        /* HORIZONTAL SWIPEABLE KANBAN BOARD */
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={COLUMN_WIDTH + 14}
          decelerationRate="fast"
          contentContainerStyle={styles.boardScrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#3B82F6"
              colors={['#3B82F6']}
            />
          }
        >
          {KANBAN_STAGES.map((stageCfg) => {
            const stageDeals = stageGroups[stageCfg.key] || [];
            const stageTotal = stageDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);

            return (
              <View
                key={stageCfg.key}
                style={[
                  styles.kanbanColumn,
                  { backgroundColor: isDark ? '#14161C' : '#F1F5F9', borderColor: isDark ? '#222630' : '#E2E8F0' },
                ]}
              >
                {/* Column Header */}
                <View style={[styles.columnHeader, { borderBottomColor: isDark ? '#222630' : '#E2E8F0' }]}>
                  <View style={styles.columnHeaderLeft}>
                    <View style={[styles.stageDot, { backgroundColor: stageCfg.color }]} />
                    <Text style={[styles.columnTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                      {stageCfg.label}
                    </Text>
                    <View style={[styles.countBadge, { backgroundColor: stageCfg.bg }]}>
                      <Text style={[styles.countBadgeText, { color: stageCfg.color }]}>
                        {stageDeals.length}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.columnTotalText, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                      {formatCurrency(stageTotal)}
                    </Text>
                    <Pressable
                      style={[styles.addDealInStageBtn, { backgroundColor: isDark ? '#262A34' : '#FFFFFF' }]}
                      onPress={() => handleOpenAddDeal(stageCfg.key)}
                      hitSlop={6}
                    >
                      <Ionicons name="add" size={14} color={stageCfg.color} />
                    </Pressable>
                  </View>
                </View>

                {/* Column Deal Cards Scroll */}
                <ScrollView
                  style={styles.columnCardsScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.columnCardsContainer}
                >
                  {stageDeals.length === 0 ? (
                    <View style={styles.emptyColumn}>
                      <Ionicons name="folder-open-outline" size={28} color={isDark ? '#4B5563' : '#CBD5E1'} />
                      <Text style={[styles.emptyColumnText, { color: isDark ? '#6B7280' : '#94A3B8' }]}>
                        No deals in {stageCfg.label.toLowerCase()}
                      </Text>
                    </View>
                  ) : (
                    stageDeals.map((deal) => {
                      const nextStageKey = NEXT_STAGE_MAP[deal.stage];
                      return (
                        <View key={deal.id} style={styles.kanbanCardWrapper}>
                          <DealCard
                            deal={deal}
                            onPress={() => onSelectDeal?.(deal.id)}
                            onStageChange={() => setSelectedDealForStage(deal)}
                          />

                          {/* Quick 1-Tap Advance Stage Button */}
                          {nextStageKey ? (
                            <Pressable
                              style={[
                                styles.advanceStageBtn,
                                {
                                  backgroundColor: isDark ? '#1E222B' : '#EFF6FF',
                                  borderColor: isDark ? '#2D323F' : '#DBEAFE',
                                },
                              ]}
                              onPress={() => handleAdvanceStage(deal)}
                            >
                              <Text style={styles.advanceStageText}>Move to {nextStageKey.replace('_', ' ')}</Text>
                              <Ionicons name="arrow-forward" size={12} color="#3B82F6" />
                            </Pressable>
                          ) : null}
                        </View>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        /* LIST VIEW */
        <View style={styles.listContainer}>
          {/* Stage Selector Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.stageScroll}
            contentContainerStyle={styles.stageScrollContent}
          >
            {[{ key: 'all', label: 'All Stages', color: '#6B7280' }, ...KANBAN_STAGES].map((s) => {
              const isSelected = selectedStageFilter === s.key;
              return (
                <Pressable
                  key={s.key}
                  style={[
                    styles.stageChip,
                    { backgroundColor: isDark ? '#181A20' : '#FFFFFF', borderColor: isDark ? '#262A34' : '#E2E8F0' },
                    isSelected && (isDark ? styles.stageChipSelectedDark : styles.stageChipSelectedLight),
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setSelectedStageFilter(s.key);
                  }}
                >
                  {s.key !== 'all' ? <View style={[styles.stageDot, { backgroundColor: s.color }]} /> : null}
                  <Text
                    style={[
                      styles.stageText,
                      { color: isDark ? '#9CA3AF' : '#64748B' },
                      isSelected && { color: s.color, fontWeight: '700' },
                    ]}
                  >
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <FlatList
            data={filteredDeals}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <DealCard
                deal={item}
                onPress={() => onSelectDeal?.(item.id)}
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
        </View>
      )}

      {/* Modals */}
      <CreateDealModal
        visible={showAddDeal}
        defaultStage={defaultStageForAdd}
        onClose={() => setShowAddDeal(false)}
        onSubmit={async (deal) => {
          await createDeal.mutateAsync(deal);
          setShowAddDeal(false);
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
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    padding: 8,
    borderRadius: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    borderRadius: 8,
  },
  toggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: '#3B82F6',
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
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  kpiCol: {
    flex: 1,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  kpiDivider: {
    width: 1,
    height: 24,
    marginHorizontal: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  boardScrollContent: {
    paddingHorizontal: 16,
    paddingRight: 32,
    gap: 14,
    paddingBottom: 24,
  },
  kanbanColumn: {
    width: COLUMN_WIDTH,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '100%',
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  columnHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  columnTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  columnTotalText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addDealInStageBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnCardsScroll: {
    flex: 1,
  },
  columnCardsContainer: {
    padding: 12,
    paddingBottom: 40,
    gap: 10,
  },
  kanbanCardWrapper: {
    position: 'relative',
  },
  advanceStageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: -4,
    marginBottom: 6,
  },
  advanceStageText: {
    color: '#3B82F6',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 6,
  },
  emptyColumnText: {
    fontSize: 12,
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
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
    borderWidth: 1,
    gap: 6,
  },
  stageChipSelectedDark: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: '#3B82F6',
  },
  stageChipSelectedLight: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  stageText: {
    fontSize: 12,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
});
