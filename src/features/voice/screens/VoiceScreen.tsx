import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppScreen } from '../../../components/AppScreen';
import { AppTopBar } from '../../../components/AppTopBar';
import {
  ProductFloatingBottomBar,
  ProductTabItem,
} from '../../../components/ProductFloatingBottomBar';
import { apiClient } from '../../../core/api/client';
import {
  CallDetailsModal,
  TriggerCallModal,
  CreateCampaignModal,
  CreateAgentModal,
} from '../components';

type VoiceSectionKey = 'overview' | 'calls' | 'agents' | 'campaigns' | 'numbers';

const VOICE_TABS: ProductTabItem[] = [
  { key: 'overview', label: 'Overview', activeIcon: 'grid', inactiveIcon: 'grid-outline' },
  { key: 'calls', label: 'Calls', activeIcon: 'call', inactiveIcon: 'call-outline' },
  { key: 'agents', label: 'Agents', activeIcon: 'mic', inactiveIcon: 'mic-outline' },
  { key: 'campaigns', label: 'Campaigns', activeIcon: 'rocket', inactiveIcon: 'rocket-outline' },
  { key: 'numbers', label: 'Numbers', activeIcon: 'keypad', inactiveIcon: 'keypad-outline' },
];

export const VoiceScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const queryClient = useQueryClient();

  const [activeSection, setActiveSection] = useState<VoiceSectionKey>('overview');
  const [selectedCall, setSelectedCall] = useState<any | null>(null);
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);

  // 1. Fetch Overview Metrics
  const {
    data: overviewData,
    isLoading: isOverviewLoading,
    refetch: refetchOverview,
    isRefetching: isOverviewRefetching,
  } = useQuery({
    queryKey: ['voice', 'overview'],
    queryFn: async () => apiClient.get<any>('/mobile/v1/voice/overview'),
  });

  // 2. Fetch Call Logs
  const {
    data: callsData,
    isLoading: isCallsLoading,
    refetch: refetchCalls,
    isRefetching: isCallsRefetching,
  } = useQuery({
    queryKey: ['voice', 'calls'],
    queryFn: async () => apiClient.get<any[]>('/mobile/v1/voice/calls'),
  });

  // 3. Fetch Voice Agents
  const {
    data: agentsData,
    isLoading: isAgentsLoading,
    refetch: refetchAgents,
    isRefetching: isAgentsRefetching,
  } = useQuery({
    queryKey: ['voice', 'agents'],
    queryFn: async () => apiClient.get<any[]>('/mobile/v1/voice/agents'),
  });

  // 4. Fetch Campaigns
  const {
    data: campaignsData,
    isLoading: isCampaignsLoading,
    refetch: refetchCampaigns,
    isRefetching: isCampaignsRefetching,
  } = useQuery({
    queryKey: ['voice', 'campaigns'],
    queryFn: async () => apiClient.get<any[]>('/mobile/v1/voice/campaigns'),
  });

  // 5. Fetch Numbers
  const {
    data: numbersData,
    isLoading: isNumbersLoading,
    refetch: refetchNumbers,
    isRefetching: isNumbersRefetching,
  } = useQuery({
    queryKey: ['voice', 'numbers'],
    queryFn: async () => apiClient.get<any[]>('/mobile/v1/voice/numbers'),
  });

  // Mutations
  const triggerCallMutation = useMutation({
    mutationFn: (payload: any) => apiClient.post('/mobile/v1/voice/calls', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice', 'calls'] });
      queryClient.invalidateQueries({ queryKey: ['voice', 'overview'] });
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: (payload: any) => apiClient.post('/mobile/v1/voice/campaigns', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice', 'campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['voice', 'overview'] });
    },
  });

  const createAgentMutation = useMutation({
    mutationFn: (payload: any) => apiClient.post('/mobile/v1/voice/agents', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice', 'agents'] });
      queryClient.invalidateQueries({ queryKey: ['voice', 'overview'] });
    },
  });

  const handleRefresh = () => {
    refetchOverview();
    refetchCalls();
    refetchAgents();
    refetchCampaigns();
    refetchNumbers();
  };

  const isRefreshing =
    isOverviewRefetching ||
    isCallsRefetching ||
    isAgentsRefetching ||
    isCampaignsRefetching ||
    isNumbersRefetching;

  const handleSelectSection = (key: VoiceSectionKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveSection(key);
  };

  const overview = overviewData?.data || overviewData || {};
  const calls: any[] = Array.isArray(callsData) ? callsData : (callsData as any)?.calls || [];
  const agents: any[] = Array.isArray(agentsData) ? agentsData : (agentsData as any)?.assistants || [];
  const campaigns: any[] = Array.isArray(campaignsData) ? campaignsData : (campaignsData as any)?.campaigns || [];
  const numbers: any[] = Array.isArray(numbersData) ? numbersData : (numbersData as any)?.phone_numbers || [];

  return (
    <AppScreen safeArea={false}>
      <AppTopBar title="VoicePilot" subtitle="AI Telecalling & Voice Agents" showBack={true} />

      <ScrollView
        style={[styles.scrollView, isDark ? styles.scrollViewDark : styles.scrollViewLight]}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={isDark ? '#FFFFFF' : '#8B5CF6'} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* --- SECTION 1: OVERVIEW --- */}
        {activeSection === 'overview' && (
          <View style={styles.sectionContainer}>
            {/* Telemetry Metric Cards - Balanced 2x2 Grid */}
            <View style={styles.metricsGridContainer}>
              {/* Row 1 */}
              <View style={styles.metricsRow}>
                <View style={[styles.metricCard, isDark ? styles.cardDark : styles.cardLight]}>
                  <View style={styles.metricHeader}>
                    <View style={[styles.metricIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                      <Ionicons name="mic" size={18} color="#8B5CF6" />
                    </View>
                  </View>
                  <Text style={[styles.metricNumber, isDark && styles.textDark]} numberOfLines={1}>
                    {overview.totalAssistants ?? agents.length}
                  </Text>
                  <Text style={styles.metricLabel}>Active AI Agents</Text>
                </View>

                <View style={[styles.metricCard, isDark ? styles.cardDark : styles.cardLight]}>
                  <View style={styles.metricHeader}>
                    <View style={[styles.metricIconBox, { backgroundColor: 'rgba(10, 132, 255, 0.15)' }]}>
                      <Ionicons name="call" size={18} color="#0A84FF" />
                    </View>
                  </View>
                  <Text style={[styles.metricNumber, isDark && styles.textDark]} numberOfLines={1}>
                    {overview.totalCalls ?? calls.length}
                  </Text>
                  <Text style={styles.metricLabel}>Dispatched Calls</Text>
                </View>
              </View>

              {/* Row 2 */}
              <View style={styles.metricsRow}>
                <View style={[styles.metricCard, isDark ? styles.cardDark : styles.cardLight]}>
                  <View style={styles.metricHeader}>
                    <View style={[styles.metricIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                      <Ionicons name="rocket" size={18} color="#F59E0B" />
                    </View>
                  </View>
                  <Text style={[styles.metricNumber, isDark && styles.textDark]} numberOfLines={1}>
                    {overview.activeCampaigns ?? campaigns.length}
                  </Text>
                  <Text style={styles.metricLabel}>Voice Campaigns</Text>
                </View>

                <View style={[styles.metricCard, isDark ? styles.cardDark : styles.cardLight]}>
                  <View style={styles.metricHeader}>
                    <View style={[styles.metricIconBox, { backgroundColor: 'rgba(48, 209, 88, 0.15)' }]}>
                      <Ionicons name="wallet" size={18} color="#30D158" />
                    </View>
                  </View>
                  <Text style={[styles.metricNumber, { color: '#30D158' }]} numberOfLines={1}>
                    {overview.creditBalanceDisplay || `${Math.floor(overview.creditBalance ?? 0)} AI Mins`}
                  </Text>
                  <Text style={styles.metricLabel}>Credit Balance</Text>
                </View>
              </View>
            </View>

            {/* Quick Action Dock */}
            <View style={[styles.actionsCard, isDark ? styles.cardDark : styles.cardLight]}>
              <Text style={styles.cardHeaderTitle}>VOICEPILOT CONTROL ACTIONS</Text>
              <View style={styles.actionButtonsRow}>
                <Pressable
                  style={[styles.primaryActionBtn, { backgroundColor: '#8B5CF6' }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIsTriggerModalOpen(true);
                  }}
                >
                  <Ionicons name="call" size={15} color="#FFFFFF" />
                  <Text style={styles.primaryActionBtnText} numberOfLines={1}>Trigger Call</Text>
                </Pressable>

                <Pressable
                  style={[styles.primaryActionBtn, { backgroundColor: '#0A84FF' }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIsCampaignModalOpen(true);
                  }}
                >
                  <Ionicons name="rocket" size={15} color="#FFFFFF" />
                  <Text style={styles.primaryActionBtnText} numberOfLines={1}>Campaign</Text>
                </Pressable>

                <Pressable
                  style={[styles.primaryActionBtn, isDark ? styles.secondaryBtnDark : styles.secondaryBtnLight]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIsAgentModalOpen(true);
                  }}
                >
                  <Ionicons name="add-circle" size={16} color={isDark ? '#FFFFFF' : '#000000'} />
                  <Text style={[styles.primaryActionBtnText, isDark ? styles.textDark : { color: '#000000' }]} numberOfLines={1}>
                    New Agent
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Recent Call Telemetry Stream */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>RECENT CALL TELEMETRY</Text>
            </View>

            <View style={[styles.listCard, isDark ? styles.cardDark : styles.cardLight]}>
              {calls.slice(0, 5).map((call, idx, arr) => (
                <View key={call.id || idx}>
                  <Pressable
                    style={styles.callRow}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedCall(call);
                    }}
                  >
                    <View style={[styles.callIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                      <Ionicons name="call" size={18} color="#8B5CF6" />
                    </View>
                    <View style={styles.callInfo}>
                      <View style={styles.callRowHeader}>
                        <Text style={[styles.callPhone, isDark && styles.textDark]} numberOfLines={1}>
                          {call.customerNumber || call.phone_number || 'Unknown Recipient'}
                        </Text>
                        <Text style={styles.callDuration}>{call.duration || '0s'}</Text>
                      </View>
                      <Text style={styles.callAgent}>{call.assistant || 'Voice Assistant'}</Text>
                      {call.summary ? (
                        <Text style={styles.callSummarySnippet} numberOfLines={1}>
                          "{call.summary}"
                        </Text>
                      ) : null}
                    </View>
                    <Ionicons name="chevron-forward" size={14} color="#8E8E93" />
                  </Pressable>
                  {idx < arr.length - 1 && <View style={[styles.divider, isDark ? styles.dividerDark : styles.dividerLight]} />}
                </View>
              ))}

              {calls.length === 0 && !isCallsLoading && (
                <View style={styles.emptyContainer}>
                  <Ionicons name="call-outline" size={32} color="#8E8E93" />
                  <Text style={styles.emptyText}>No recent calls dispatched yet.</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* --- SECTION 2: CALL LOGS --- */}
        {activeSection === 'calls' && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>CALL LOGS & TRANSCRIPTS ({calls.length})</Text>
              <Pressable
                style={styles.headerBtn}
                onPress={() => setIsTriggerModalOpen(true)}
              >
                <Ionicons name="add" size={16} color="#8B5CF6" />
                <Text style={styles.headerBtnText}>Trigger Call</Text>
              </Pressable>
            </View>

            {isCallsLoading ? (
              <ActivityIndicator size="large" color="#8B5CF6" style={{ marginTop: 24 }} />
            ) : (
              <View style={[styles.listCard, isDark ? styles.cardDark : styles.cardLight]}>
                {calls.map((call, idx, arr) => (
                  <View key={call.id || idx}>
                    <Pressable
                      style={styles.callRow}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedCall(call);
                      }}
                    >
                      <View style={[styles.callIconBox, { backgroundColor: call.status === 'completed' ? 'rgba(48, 209, 88, 0.12)' : 'rgba(245, 158, 11, 0.12)' }]}>
                        <Ionicons name={call.recordingUrl ? 'mic' : 'call'} size={18} color={call.status === 'completed' ? '#30D158' : '#F59E0B'} />
                      </View>
                      <View style={styles.callInfo}>
                        <View style={styles.callRowHeader}>
                          <Text style={[styles.callPhone, isDark && styles.textDark]}>
                            {call.customerNumber || call.phone_number}
                          </Text>
                          <Text style={styles.callDuration}>{call.duration}</Text>
                        </View>
                        <Text style={styles.callAgent}>{call.assistant} • {call.time || 'Recent'}</Text>
                        {call.summary ? (
                          <Text style={styles.callSummarySnippet} numberOfLines={1}>
                            "{call.summary}"
                          </Text>
                        ) : null}
                      </View>
                      <Ionicons name="chevron-forward" size={14} color="#8E8E93" />
                    </Pressable>
                    {idx < arr.length - 1 && <View style={[styles.divider, isDark ? styles.dividerDark : styles.dividerLight]} />}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* --- SECTION 3: AGENTS --- */}
        {activeSection === 'agents' && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>AI VOICE ASSISTANTS ({agents.length})</Text>
              <Pressable style={styles.headerBtn} onPress={() => setIsAgentModalOpen(true)}>
                <Ionicons name="add" size={16} color="#8B5CF6" />
                <Text style={styles.headerBtnText}>New Agent</Text>
              </Pressable>
            </View>

            {isAgentsLoading ? (
              <ActivityIndicator size="large" color="#8B5CF6" style={{ marginTop: 24 }} />
            ) : (
              <View style={styles.cardsStack}>
                {agents.map((ast) => (
                  <View key={ast.id} style={[styles.agentCard, isDark ? styles.cardDark : styles.cardLight]}>
                    <View style={styles.agentCardHeader}>
                      <View style={[styles.agentAvatarBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                        <Ionicons name="mic" size={20} color="#8B5CF6" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.agentName, isDark && styles.textDark]}>{ast.name}</Text>
                        <Text style={styles.agentSub}>
                          {ast.provider || 'vomyra'} • Status: {ast.status || 'active'}
                        </Text>
                      </View>
                      <View style={styles.onlinePill}>
                        <View style={styles.onlineDot} />
                        <Text style={styles.onlinePillText}>Ready</Text>
                      </View>
                    </View>

                    {ast.config_snapshot?.prompt || ast.config_snapshot?.system_prompt ? (
                      <Text style={[styles.agentPromptSnippet, isDark && styles.agentPromptSnippetDark]} numberOfLines={2}>
                        "{ast.config_snapshot?.prompt || ast.config_snapshot?.system_prompt}"
                      </Text>
                    ) : null}

                    <View style={styles.agentCardFooter}>
                      <Pressable
                        style={[styles.agentActionBtn, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setIsTriggerModalOpen(true);
                        }}
                      >
                        <Ionicons name="call" size={14} color="#8B5CF6" />
                        <Text style={[styles.agentActionBtnText, { color: '#8B5CF6' }]}>Test Call</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* --- SECTION 4: CAMPAIGNS --- */}
        {activeSection === 'campaigns' && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>BULK VOICE CAMPAIGNS ({campaigns.length})</Text>
              <Pressable style={styles.headerBtn} onPress={() => setIsCampaignModalOpen(true)}>
                <Ionicons name="add" size={16} color="#8B5CF6" />
                <Text style={styles.headerBtnText}>Start Campaign</Text>
              </Pressable>
            </View>

            {isCampaignsLoading ? (
              <ActivityIndicator size="large" color="#8B5CF6" style={{ marginTop: 24 }} />
            ) : (
              <View style={[styles.listCard, isDark ? styles.cardDark : styles.cardLight]}>
                {campaigns.map((camp, idx, arr) => (
                  <View key={camp.id || idx}>
                    <View style={styles.campaignRow}>
                      <View style={[styles.campaignIconBox, { backgroundColor: 'rgba(10, 132, 255, 0.12)' }]}>
                        <Ionicons name="rocket" size={18} color="#0A84FF" />
                      </View>
                      <View style={styles.campaignInfo}>
                        <Text style={[styles.campaignName, isDark && styles.textDark]}>{camp.name}</Text>
                        <Text style={styles.campaignMeta}>
                          {camp.total_contacts || 0} Contacts • Status: {camp.status || 'completed'}
                        </Text>
                      </View>
                      <View style={[styles.badge, camp.status === 'running' ? styles.badgeWarning : styles.badgeSuccess]}>
                        <Text style={[styles.badgeText, camp.status === 'running' ? styles.textWarning : styles.textSuccess]}>
                          {camp.status || 'completed'}
                        </Text>
                      </View>
                    </View>
                    {idx < arr.length - 1 && <View style={[styles.divider, isDark ? styles.dividerDark : styles.dividerLight]} />}
                  </View>
                ))}

                {campaigns.length === 0 && (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="rocket-outline" size={32} color="#8E8E93" />
                    <Text style={styles.emptyText}>No automated voice campaigns created yet.</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* --- SECTION 5: NUMBERS --- */}
        {activeSection === 'numbers' && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>VIRTUAL PHONE NUMBERS ({numbers.length})</Text>
            </View>

            {isNumbersLoading ? (
              <ActivityIndicator size="large" color="#8B5CF6" style={{ marginTop: 24 }} />
            ) : (
              <View style={[styles.listCard, isDark ? styles.cardDark : styles.cardLight]}>
                {numbers.map((pn, idx, arr) => (
                  <View key={pn.id || idx}>
                    <View style={styles.numberRow}>
                      <View style={[styles.numberIconBox, { backgroundColor: 'rgba(48, 209, 88, 0.12)' }]}>
                        <Ionicons name="keypad" size={18} color="#30D158" />
                      </View>
                      <View style={styles.numberInfo}>
                        <Text style={[styles.numberVal, isDark && styles.textDark]}>{pn.phone_number}</Text>
                        <Text style={styles.numberMeta}>
                          {pn.assistants?.name ? `Assigned to: ${pn.assistants.name}` : 'Unassigned'} • Provider: {pn.provider || 'vomyra'}
                        </Text>
                      </View>
                      <View style={styles.badgeSuccess}>
                        <Text style={[styles.badgeText, styles.textSuccess]}>{pn.status || 'active'}</Text>
                      </View>
                    </View>
                    {idx < arr.length - 1 && <View style={[styles.divider, isDark ? styles.dividerDark : styles.dividerLight]} />}
                  </View>
                ))}

                {numbers.length === 0 && (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="keypad-outline" size={32} color="#8E8E93" />
                    <Text style={styles.emptyText}>No virtual phone numbers claimed yet.</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Inspection Modal */}
      <CallDetailsModal
        visible={Boolean(selectedCall)}
        call={selectedCall}
        onClose={() => setSelectedCall(null)}
      />

      {/* Trigger Outbound Call Modal */}
      <TriggerCallModal
        visible={isTriggerModalOpen}
        assistants={agents}
        onClose={() => setIsTriggerModalOpen(false)}
        onSubmit={async (payload) => {
          await triggerCallMutation.mutateAsync(payload);
        }}
        isLoading={triggerCallMutation.isPending}
      />

      {/* Bulk Campaign Modal */}
      <CreateCampaignModal
        visible={isCampaignModalOpen}
        assistants={agents}
        phoneNumbers={numbers}
        onClose={() => setIsCampaignModalOpen(false)}
        onSubmit={async (payload) => {
          await createCampaignMutation.mutateAsync(payload);
        }}
        isLoading={createCampaignMutation.isPending}
      />

      {/* Create Agent Modal */}
      <CreateAgentModal
        visible={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        onSubmit={async (payload) => {
          await createAgentMutation.mutateAsync(payload);
        }}
        isLoading={createAgentMutation.isPending}
      />

      {/* Floating Home-Style Product Bottom Navigation Bar */}
      <ProductFloatingBottomBar
        items={VOICE_TABS}
        activeKey={activeSection}
        onChangeTab={(key) => setActiveSection(key as VoiceSectionKey)}
        accentColor="#8B5CF6"
        moreMenuTitle="VoicePilot Tools"
      />
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollViewLight: { backgroundColor: '#F2F2F7' },
  scrollViewDark: { backgroundColor: '#020617' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 130 },
  segmentedTrack: {
    flexDirection: 'row',
    backgroundColor: '#E3E3E8',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  segmentedTrackDark: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  segmentedTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedTabActiveLight: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentedTabActiveDark: { backgroundColor: '#1E293B' },
  segmentedTabText: { fontSize: 11.5, fontWeight: '600', color: '#64748B' },
  segmentedTabTextActiveLight: { color: '#000000', fontWeight: '700' },
  segmentedTabTextActiveDark: { color: '#F8FAFC', fontWeight: '700' },
  sectionContainer: { gap: 14 },
  metricsGridContainer: { gap: 10 },
  metricsRow: { flexDirection: 'row', gap: 10 },
  metricCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    justifyContent: 'space-between',
    minHeight: 104,
  },
  cardLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  cardDark: { backgroundColor: '#0F172A', borderColor: '#1E293B' },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricNumber: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  metricLabel: { fontSize: 11.5, color: '#64748B', marginTop: 3, fontWeight: '500' },
  textDark: { color: '#F8FAFC' },
  actionsCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  cardHeaderTitle: { fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 0.6, marginBottom: 12 },
  actionButtonsRow: { flexDirection: 'row', gap: 8 },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  primaryActionBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  secondaryBtnLight: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1' },
  secondaryBtnDark: { backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  sectionTitle: { fontSize: 11.5, fontWeight: '700', color: '#64748B', letterSpacing: 0.5 },
  headerBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerBtnText: { color: '#8B5CF6', fontSize: 12.5, fontWeight: '700' },
  listCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  callRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  callIconBox: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  callInfo: { flex: 1, marginRight: 8 },
  callRowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  callPhone: { fontSize: 14, fontWeight: '700' },
  callDuration: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  callAgent: { fontSize: 11.5, color: '#64748B' },
  callSummarySnippet: { fontSize: 11, color: '#94A3B8', fontStyle: 'italic', marginTop: 3 },
  divider: { height: 1, marginLeft: 62 },
  dividerLight: { backgroundColor: '#E2E8F0' },
  dividerDark: { backgroundColor: '#1E293B' },
  emptyContainer: { alignItems: 'center', paddingVertical: 28, gap: 8 },
  emptyText: { fontSize: 12.5, color: '#64748B' },
  cardsStack: { gap: 10 },
  agentCard: { borderRadius: 16, padding: 16, borderWidth: 1 },
  agentCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  agentAvatarBox: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  agentName: { fontSize: 15, fontWeight: '700' },
  agentSub: { fontSize: 11.5, color: '#64748B', marginTop: 1 },
  onlinePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(48, 209, 88, 0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#30D158' },
  onlinePillText: { fontSize: 10.5, fontWeight: '700', color: '#30D158' },
  agentPromptSnippet: { fontSize: 11.5, color: '#94A3B8', fontStyle: 'italic', marginTop: 10, lineHeight: 16 },
  agentPromptSnippetDark: { color: '#94A3B8' },
  agentCardFooter: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  agentActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  agentActionBtnText: { fontSize: 12, fontWeight: '700' },
  campaignRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  campaignIconBox: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  campaignInfo: { flex: 1, marginRight: 8 },
  campaignName: { fontSize: 14, fontWeight: '700' },
  campaignMeta: { fontSize: 11.5, color: '#64748B', marginTop: 2 },
  numberRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  numberIconBox: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  numberInfo: { flex: 1, marginRight: 8 },
  numberVal: { fontSize: 14, fontWeight: '700' },
  numberMeta: { fontSize: 11.5, color: '#64748B', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeSuccess: { backgroundColor: 'rgba(48, 209, 88, 0.15)' },
  badgeWarning: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  badgeText: { fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase' },
  textSuccess: { color: '#30D158' },
  textWarning: { color: '#F59E0B' },
});
