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
import { apiClient } from '../../../core/api/client';
import { CallDetailsModal } from '../components/CallDetailsModal';
import { TriggerCallModal } from '../components/TriggerCallModal';
import { CreateCampaignModal } from '../components/CreateCampaignModal';
import { CreateAgentModal } from '../components/CreateAgentModal';

type VoiceSectionKey = 'overview' | 'calls' | 'agents' | 'campaigns' | 'numbers';

const SECTIONS: { key: VoiceSectionKey; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: 'grid-outline' },
  { key: 'calls', label: 'Calls', icon: 'call-outline' },
  { key: 'agents', label: 'Agents', icon: 'mic-outline' },
  { key: 'campaigns', label: 'Campaigns', icon: 'rocket-outline' },
  { key: 'numbers', label: 'Numbers', icon: 'keypad-outline' },
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
        {/* Segmented Control Bar */}
        <View style={[styles.segmentedTrack, isDark && styles.segmentedTrackDark]}>
          {SECTIONS.map((sec) => {
            const isSelected = activeSection === sec.key;
            return (
              <Pressable
                key={sec.key}
                style={[
                  styles.segmentedTab,
                  isSelected && (isDark ? styles.segmentedTabActiveDark : styles.segmentedTabActiveLight),
                ]}
                onPress={() => handleSelectSection(sec.key)}
              >
                <Text
                  style={[
                    styles.segmentedTabText,
                    isSelected && (isDark ? styles.segmentedTabTextActiveDark : styles.segmentedTabTextActiveLight),
                  ]}
                  numberOfLines={1}
                >
                  {sec.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* --- SECTION 1: OVERVIEW --- */}
        {activeSection === 'overview' && (
          <View style={styles.sectionContainer}>
            {/* Telemetry Metric Cards */}
            <View style={styles.metricsGrid}>
              <View style={[styles.metricCard, isDark ? styles.cardDark : styles.cardLight]}>
                <View style={[styles.metricIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                  <Ionicons name="mic" size={16} color="#8B5CF6" />
                </View>
                <Text style={[styles.metricNumber, isDark && styles.textDark]}>
                  {overview.totalAssistants ?? agents.length}
                </Text>
                <Text style={styles.metricLabel}>Active AI Agents</Text>
              </View>

              <View style={[styles.metricCard, isDark ? styles.cardDark : styles.cardLight]}>
                <View style={[styles.metricIconBox, { backgroundColor: 'rgba(10, 132, 255, 0.15)' }]}>
                  <Ionicons name="call" size={16} color="#0A84FF" />
                </View>
                <Text style={[styles.metricNumber, isDark && styles.textDark]}>
                  {overview.totalCalls ?? calls.length}
                </Text>
                <Text style={styles.metricLabel}>Dispatched Calls</Text>
              </View>

              <View style={[styles.metricCard, isDark ? styles.cardDark : styles.cardLight]}>
                <View style={[styles.metricIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Ionicons name="rocket" size={16} color="#F59E0B" />
                </View>
                <Text style={[styles.metricNumber, isDark && styles.textDark]}>
                  {overview.activeCampaigns ?? campaigns.length}
                </Text>
                <Text style={styles.metricLabel}>Voice Campaigns</Text>
              </View>

              <View style={[styles.metricCard, isDark ? styles.cardDark : styles.cardLight]}>
                <View style={[styles.metricIconBox, { backgroundColor: 'rgba(48, 209, 88, 0.15)' }]}>
                  <Ionicons name="wallet" size={16} color="#30D158" />
                </View>
                <Text style={[styles.metricNumber, { color: '#30D158' }]}>
                  {overview.creditBalanceDisplay || `${Math.floor(overview.creditBalance || 94)} AI Mins`}
                </Text>
                <Text style={styles.metricLabel}>Credit Balance</Text>
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
                  <Ionicons name="call" size={16} color="#FFFFFF" />
                  <Text style={styles.primaryActionBtnText}>Trigger Call</Text>
                </Pressable>

                <Pressable
                  style={[styles.primaryActionBtn, { backgroundColor: '#0A84FF' }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIsCampaignModalOpen(true);
                  }}
                >
                  <Ionicons name="rocket" size={16} color="#FFFFFF" />
                  <Text style={styles.primaryActionBtnText}>New Campaign</Text>
                </Pressable>

                <Pressable
                  style={[styles.primaryActionBtn, isDark ? styles.secondaryBtnDark : styles.secondaryBtnLight]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIsAgentModalOpen(true);
                  }}
                >
                  <Ionicons name="add-circle" size={16} color={isDark ? '#FFFFFF' : '#000000'} />
                  <Text style={[styles.primaryActionBtnText, isDark ? styles.textDark : { color: '#000000' }]}>
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
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollViewLight: { backgroundColor: '#F2F2F7' },
  scrollViewDark: { backgroundColor: '#000000' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 130 },
  segmentedTrack: {
    flexDirection: 'row',
    backgroundColor: '#E3E3E8',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  segmentedTrackDark: {
    backgroundColor: '#161B22',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#262C36',
  },
  segmentedTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
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
  segmentedTabActiveDark: { backgroundColor: '#262C36' },
  segmentedTabText: { fontSize: 11, fontWeight: '600', color: '#8E8E93' },
  segmentedTabTextActiveLight: { color: '#000000', fontWeight: '700' },
  segmentedTabTextActiveDark: { color: '#FFFFFF', fontWeight: '700' },
  sectionContainer: { gap: 14 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: {
    width: '48.5%',
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardLight: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  cardDark: { backgroundColor: '#161B22', borderColor: '#262C36' },
  metricIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricNumber: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  metricLabel: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  textDark: { color: '#FFFFFF' },
  actionsCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardHeaderTitle: { fontSize: 11, fontWeight: '700', color: '#8E8E93', letterSpacing: 0.5, marginBottom: 12 },
  actionButtonsRow: { flexDirection: 'row', gap: 8 },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryActionBtnText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '700' },
  secondaryBtnLight: { backgroundColor: '#F3F4F6' },
  secondaryBtnDark: { backgroundColor: '#262C36' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  sectionTitle: { fontSize: 11.5, fontWeight: '700', color: '#8E8E93', letterSpacing: 0.5 },
  headerBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerBtnText: { color: '#8B5CF6', fontSize: 12.5, fontWeight: '700' },
  listCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  callRow: { flexDirection: 'row', alignItems: 'center', padding: 13 },
  callIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  callInfo: { flex: 1, marginRight: 8 },
  callRowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  callPhone: { fontSize: 14, fontWeight: '700' },
  callDuration: { fontSize: 11, color: '#8E8E93', fontWeight: '600' },
  callAgent: { fontSize: 11.5, color: '#8E8E93' },
  callSummarySnippet: { fontSize: 11, color: '#6B7280', fontStyle: 'italic', marginTop: 3 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 60 },
  dividerLight: { backgroundColor: '#E5E7EB' },
  dividerDark: { backgroundColor: '#262C36' },
  emptyContainer: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 12.5, color: '#8E8E93' },
  cardsStack: { gap: 10 },
  agentCard: { borderRadius: 16, padding: 16, borderWidth: StyleSheet.hairlineWidth },
  agentCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  agentAvatarBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  agentName: { fontSize: 15, fontWeight: '700' },
  agentSub: { fontSize: 11.5, color: '#8E8E93', marginTop: 1 },
  onlinePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(48, 209, 88, 0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#30D158' },
  onlinePillText: { fontSize: 10.5, fontWeight: '700', color: '#30D158' },
  agentPromptSnippet: { fontSize: 11.5, color: '#6B7280', fontStyle: 'italic', marginTop: 10, lineHeight: 16 },
  agentPromptSnippetDark: { color: '#9CA3AF' },
  agentCardFooter: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  agentActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  agentActionBtnText: { fontSize: 12, fontWeight: '700' },
  campaignRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  campaignIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  campaignInfo: { flex: 1, marginRight: 8 },
  campaignName: { fontSize: 14, fontWeight: '700' },
  campaignMeta: { fontSize: 11.5, color: '#8E8E93', marginTop: 2 },
  numberRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  numberIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  numberInfo: { flex: 1, marginRight: 8 },
  numberVal: { fontSize: 14, fontWeight: '700' },
  numberMeta: { fontSize: 11.5, color: '#8E8E93', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeSuccess: { backgroundColor: 'rgba(48, 209, 88, 0.15)' },
  badgeWarning: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  badgeText: { fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase' },
  textSuccess: { color: '#30D158' },
  textWarning: { color: '#F59E0B' },
});
