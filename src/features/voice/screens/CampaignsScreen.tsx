import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { voiceApi, VoiceCampaign } from '../api/voiceApi';
import {
  CreateCampaignModal,
  EditCampaignModal,
  CampaignDetailsModal,
  CallDetailsModal,
} from '../components';

type CampaignStatusFilter = 'all' | 'draft' | 'running' | 'paused' | 'completed' | 'failed';

const FILTER_TABS: Array<{ key: CampaignStatusFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'running', label: 'Running' },
  { key: 'paused', label: 'Paused' },
  { key: 'draft', label: 'Draft' },
  { key: 'completed', label: 'Completed' },
  { key: 'failed', label: 'Failed' },
];

export const CampaignsScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const queryClient = useQueryClient();

  const [activeFilter, setActiveFilter] = useState<CampaignStatusFilter>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<VoiceCampaign | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<VoiceCampaign | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [inspectedCall, setInspectedCall] = useState<any | null>(null);

  // Queries
  const {
    data: campaignsData,
    isLoading: isCampaignsLoading,
    refetch: refetchCampaigns,
    isRefetching: isCampaignsRefetching,
  } = useQuery({
    queryKey: ['voice', 'campaigns'],
    queryFn: () => voiceApi.getCampaigns(),
  });

  const {
    data: assistantsData,
  } = useQuery({
    queryKey: ['voice', 'assistants'],
    queryFn: () => voiceApi.getAssistants(),
  });

  const {
    data: numbersData,
  } = useQuery({
    queryKey: ['voice', 'numbers'],
    queryFn: () => voiceApi.getNumbers(),
  });

  // Mutations
  const createCampaignMutation = useMutation({
    mutationFn: (payload: any) => voiceApi.createCampaign(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice', 'campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['voice', 'overview'] });
    },
  });

  const updateCampaignMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      voiceApi.updateCampaign(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice', 'campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['voice', 'overview'] });
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: (id: string) => voiceApi.deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice', 'campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['voice', 'overview'] });
    },
  });

  const statusChangeMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: any }) =>
      voiceApi.updateCampaignStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice', 'campaigns'] });
    },
  });

  const handleRefresh = () => {
    refetchCampaigns();
  };

  const campaigns: VoiceCampaign[] = campaignsData || [];
  const assistants = assistantsData || [];
  const numbers = numbersData || [];

  const filteredCampaigns = campaigns.filter((camp) => {
    if (activeFilter === 'all') return true;
    return camp.status === activeFilter;
  });

  return (
    <ScrollView
      style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={isCampaignsRefetching}
          onRefresh={handleRefresh}
          tintColor={isDark ? '#FFFFFF' : '#8B5CF6'}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header & New Campaign Button */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionHeaderTitle}>AUTOMATED TELECALLING</Text>
          <Text style={[styles.mainTitle, isDark && styles.textDark]}>
            Voice Campaigns ({campaigns.length})
          </Text>
        </View>
        <Pressable
          style={[styles.createBtn, { backgroundColor: '#8B5CF6' }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsCreateModalOpen(true);
          }}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.createBtnText}>New Campaign</Text>
        </Pressable>
      </View>

      {/* Filter Tabs Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {FILTER_TABS.map((tab) => {
          const isSelected = activeFilter === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={[
                styles.filterTab,
                isDark ? styles.filterTabDark : styles.filterTabLight,
                isSelected && styles.filterTabSelected,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveFilter(tab.key);
              }}
            >
              <Text
                style={[
                  styles.filterTabText,
                  isDark && styles.textDark,
                  isSelected && styles.filterTabTextSelected,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Campaigns List */}
      {isCampaignsLoading ? (
        <ActivityIndicator size="large" color="#8B5CF6" style={{ marginTop: 32 }} />
      ) : (
        <View style={styles.cardsStack}>
          {filteredCampaigns.map((camp) => {
            const total = camp.total_contacts || 0;
            const completed = camp.completed_contacts || 0;
            const failed = camp.failed_contacts || 0;
            const pending = camp.pending_contacts ?? Math.max(0, total - completed - failed);
            const progressPct =
              total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

            return (
              <Pressable
                key={camp.id}
                style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedCampaign(camp);
                }}
              >
                {/* Header Row */}
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                    <Ionicons name="rocket" size={20} color="#8B5CF6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.campName, isDark && styles.textDark]} numberOfLines={1}>
                      {camp.name}
                    </Text>
                    <Text style={styles.campCategory}>
                      {camp.category || 'Outreach'} • Agent: {camp.assistant_name || 'Sales Bot'}
                    </Text>
                  </View>
                  <View style={[styles.badge, getStatusBadgeStyle(camp.status)]}>
                    <Text style={[styles.badgeText, { color: getStatusColor(camp.status) }]}>
                      {camp.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBlock}>
                  <View style={styles.progressMeta}>
                    <Text style={styles.progressLabel}>Progress</Text>
                    <Text style={[styles.progressPct, isDark && styles.textDark]}>
                      {completed}/{total} Contacts ({progressPct}%)
                    </Text>
                  </View>
                  <View style={[styles.track, isDark ? styles.trackDark : styles.trackLight]}>
                    <View style={[styles.fill, { width: `${progressPct}%` }]} />
                  </View>
                </View>

                {/* Breakdown Tiles */}
                <View style={styles.breakdownRow}>
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Pending</Text>
                    <Text style={[styles.breakdownVal, { color: '#F59E0B' }]}>{pending}</Text>
                  </View>
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Completed</Text>
                    <Text style={[styles.breakdownVal, { color: '#30D158' }]}>{completed}</Text>
                  </View>
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Failed / DND</Text>
                    <Text style={[styles.breakdownVal, { color: '#EF4444' }]}>{failed}</Text>
                  </View>
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Retries</Text>
                    <Text style={[styles.breakdownVal, isDark && styles.textDark]}>
                      {camp.retry_count ?? 1}x
                    </Text>
                  </View>
                </View>

                <View style={[styles.divider, isDark ? styles.dividerDark : styles.dividerLight]} />

                {/* Footer Controls */}
                <View style={styles.cardFooter}>
                  <Text style={styles.detailsHint}>Tap to view full logs & details</Text>
                  <View style={styles.footerActions}>
                    {camp.status === 'running' ? (
                      <Pressable
                        style={[styles.actionBtn, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}
                        onPress={(e) => {
                          e.stopPropagation();
                          statusChangeMutation.mutate({ id: camp.id, status: 'paused' });
                        }}
                      >
                        <Ionicons name="pause" size={13} color="#F59E0B" />
                        <Text style={[styles.actionBtnText, { color: '#F59E0B' }]}>Pause</Text>
                      </Pressable>
                    ) : camp.status === 'paused' || camp.status === 'draft' ? (
                      <Pressable
                        style={[styles.actionBtn, { backgroundColor: 'rgba(48, 209, 88, 0.15)' }]}
                        onPress={(e) => {
                          e.stopPropagation();
                          statusChangeMutation.mutate({ id: camp.id, status: 'running' });
                        }}
                      >
                        <Ionicons name="play" size={13} color="#30D158" />
                        <Text style={[styles.actionBtnText, { color: '#30D158' }]}>Start</Text>
                      </Pressable>
                    ) : null}

                    <Pressable
                      style={[styles.actionBtn, isDark ? styles.actionBtnDark : styles.actionBtnLight]}
                      onPress={(e) => {
                        e.stopPropagation();
                        setEditingCampaign(camp);
                      }}
                    >
                      <Ionicons name="create-outline" size={14} color={isDark ? '#FFFFFF' : '#000000'} />
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            );
          })}

          {filteredCampaigns.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="rocket-outline" size={42} color="#8E8E93" />
              <Text style={styles.emptyTitle}>No Campaigns in this Filter</Text>
              <Text style={styles.emptySub}>
                {activeFilter !== 'all'
                  ? `No campaigns currently in ${activeFilter} state.`
                  : 'Start your first automated telecalling campaign.'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Modals */}
      <CreateCampaignModal
        visible={isCreateModalOpen}
        assistants={assistants}
        phoneNumbers={numbers}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async (payload) => {
          await createCampaignMutation.mutateAsync(payload);
        }}
        isLoading={createCampaignMutation.isPending}
      />

      <EditCampaignModal
        visible={Boolean(editingCampaign)}
        campaign={editingCampaign}
        assistants={assistants}
        phoneNumbers={numbers}
        onClose={() => setEditingCampaign(null)}
        onSubmit={async (campaignId, payload) => {
          await updateCampaignMutation.mutateAsync({ id: campaignId, payload });
        }}
        isLoading={updateCampaignMutation.isPending}
      />

      <CampaignDetailsModal
        visible={Boolean(selectedCampaign)}
        campaign={selectedCampaign}
        onClose={() => setSelectedCampaign(null)}
        onEdit={(camp) => {
          setSelectedCampaign(null);
          setEditingCampaign(camp);
        }}
        onDelete={async (id) => {
          await deleteCampaignMutation.mutateAsync(id);
        }}
        onStatusChange={async (id, status) => {
          await statusChangeMutation.mutateAsync({ id, status });
          if (selectedCampaign) {
            setSelectedCampaign({ ...selectedCampaign, status });
          }
        }}
        onInspectCall={(call) => setInspectedCall(call)}
        isActionLoading={statusChangeMutation.isPending}
      />

      <CallDetailsModal
        visible={Boolean(inspectedCall)}
        call={inspectedCall}
        onClose={() => setInspectedCall(null)}
      />
    </ScrollView>
  );
};

function getStatusColor(status: string) {
  switch (status) {
    case 'running': return '#30D158';
    case 'paused': return '#F59E0B';
    case 'completed': return '#0A84FF';
    case 'failed': return '#EF4444';
    default: return '#64748B';
  }
}

function getStatusBadgeStyle(status: string) {
  switch (status) {
    case 'running': return { backgroundColor: 'rgba(48, 209, 88, 0.15)' };
    case 'paused': return { backgroundColor: 'rgba(245, 158, 11, 0.15)' };
    case 'completed': return { backgroundColor: 'rgba(10, 132, 255, 0.15)' };
    case 'failed': return { backgroundColor: 'rgba(239, 68, 68, 0.15)' };
    default: return { backgroundColor: 'rgba(100, 116, 139, 0.15)' };
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerLight: { backgroundColor: '#F2F2F7' },
  containerDark: { backgroundColor: '#020617' },
  contentContainer: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 130, gap: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionHeaderTitle: { fontSize: 10.5, fontWeight: '700', color: '#64748B', letterSpacing: 0.5 },
  mainTitle: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  textDark: { color: '#F8FAFC' },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  createBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  filterScroll: { gap: 8, paddingVertical: 4 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  filterTabLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  filterTabDark: { backgroundColor: '#0F172A', borderColor: '#1E293B' },
  filterTabSelected: { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
  filterTabText: { fontSize: 12.5, fontWeight: '600', color: '#64748B' },
  filterTabTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  cardsStack: { gap: 12 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1 },
  cardLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  cardDark: { backgroundColor: '#0F172A', borderColor: '#1E293B' },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  campName: { fontSize: 15, fontWeight: '700' },
  campCategory: { fontSize: 11.5, color: '#64748B', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10.5, fontWeight: '800' },
  progressBlock: { marginTop: 14, gap: 6 },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  progressPct: { fontSize: 12, fontWeight: '700' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  trackLight: { backgroundColor: '#E2E8F0' },
  trackDark: { backgroundColor: '#1E293B' },
  fill: { height: '100%', backgroundColor: '#8B5CF6', borderRadius: 3 },
  breakdownRow: { flexDirection: 'row', marginTop: 14 },
  breakdownItem: { flex: 1 },
  breakdownLabel: { fontSize: 10.5, color: '#64748B', fontWeight: '500' },
  breakdownVal: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  divider: { height: 1, marginVertical: 12 },
  dividerLight: { backgroundColor: '#E2E8F0' },
  dividerDark: { backgroundColor: '#1E293B' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailsHint: { fontSize: 11, color: '#8E8E93' },
  footerActions: { flexDirection: 'row', gap: 6 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  actionBtnText: { fontSize: 11.5, fontWeight: '700' },
  actionBtnLight: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1' },
  actionBtnDark: { backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#64748B' },
  emptySub: { fontSize: 12.5, color: '#94A3B8', textAlign: 'center' },
});
