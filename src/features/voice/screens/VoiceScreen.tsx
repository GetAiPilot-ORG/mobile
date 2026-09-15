import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
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
import { VoiceCallsSkeleton } from '../../../components/skeletonScreen';
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

  const overview = overviewData?.data || overviewData || {};
  const calls: any[] = Array.isArray(callsData) ? callsData : (callsData as any)?.calls || [];
  const agents: any[] = Array.isArray(agentsData) ? agentsData : (agentsData as any)?.assistants || [];
  const campaigns: any[] = Array.isArray(campaignsData) ? campaignsData : (campaignsData as any)?.campaigns || [];
  const numbers: any[] = Array.isArray(numbersData) ? numbersData : (numbersData as any)?.phone_numbers || [];

  return (
    <AppScreen safeArea={false}>
      <AppTopBar title="VoicePilot" subtitle="AI Telecalling & Voice Agents" showBack={true} />

      <ScrollView
        className="flex-1 bg-[#0B0D10]"
        contentContainerClassName="px-4 pt-3.5 pb-32"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#0084FF" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* --- SECTION 1: OVERVIEW --- */}
        {activeSection === 'overview' && (
          <View className="gap-3.5">
            {/* Telemetry Metric Cards */}
            <View className="gap-2.5">
              {/* Row 1 */}
              <View className="flex-row gap-2.5">
                <View className="flex-1 rounded-2xl p-3.5 bg-[#181A1F] border border-[#262930] justify-between min-h-[104px]">
                  <View className="flex-row justify-between items-center mb-2">
                    <View className="w-8 h-8 rounded-xl justify-center items-center bg-blue-500/15">
                      <Ionicons name="mic" size={18} color="#0084FF" />
                    </View>
                  </View>
                  <Text className="text-xl font-extrabold tracking-tight text-white" numberOfLines={1}>
                    {overview.totalAssistants ?? agents.length}
                  </Text>
                  <Text className="text-[11px] text-slate-400 font-medium mt-0.5">Active AI Agents</Text>
                </View>

                <View className="flex-1 rounded-2xl p-3.5 bg-[#181A1F] border border-[#262930] justify-between min-h-[104px]">
                  <View className="flex-row justify-between items-center mb-2">
                    <View className="w-8 h-8 rounded-xl justify-center items-center bg-blue-500/15">
                      <Ionicons name="call" size={18} color="#0084FF" />
                    </View>
                  </View>
                  <Text className="text-xl font-extrabold tracking-tight text-white" numberOfLines={1}>
                    {overview.totalCalls ?? calls.length}
                  </Text>
                  <Text className="text-[11px] text-slate-400 font-medium mt-0.5">Dispatched Calls</Text>
                </View>
              </View>

              {/* Row 2 */}
              <View className="flex-row gap-2.5">
                <View className="flex-1 rounded-2xl p-3.5 bg-[#181A1F] border border-[#262930] justify-between min-h-[104px]">
                  <View className="flex-row justify-between items-center mb-2">
                    <View className="w-8 h-8 rounded-xl justify-center items-center bg-amber-500/15">
                      <Ionicons name="rocket" size={18} color="#F59E0B" />
                    </View>
                  </View>
                  <Text className="text-xl font-extrabold tracking-tight text-white" numberOfLines={1}>
                    {overview.activeCampaigns ?? campaigns.length}
                  </Text>
                  <Text className="text-[11px] text-slate-400 font-medium mt-0.5">Voice Campaigns</Text>
                </View>

                <View className="flex-1 rounded-2xl p-3.5 bg-[#181A1F] border border-[#262930] justify-between min-h-[104px]">
                  <View className="flex-row justify-between items-center mb-2">
                    <View className="w-8 h-8 rounded-xl justify-center items-center bg-emerald-500/15">
                      <Ionicons name="wallet" size={18} color="#10B981" />
                    </View>
                  </View>
                  <Text className="text-xl font-extrabold tracking-tight text-emerald-400" numberOfLines={1}>
                    {overview.creditBalanceDisplay || `${Math.floor(overview.creditBalance ?? 0)} AI Mins`}
                  </Text>
                  <Text className="text-[11px] text-slate-400 font-medium mt-0.5">Credit Balance</Text>
                </View>
              </View>
            </View>

            {/* Quick Action Dock */}
            <View className="rounded-2xl p-4 bg-[#181A1F] border border-[#262930]">
              <Text className="text-[11px] font-bold text-slate-400 tracking-wider mb-3">VOICEPILOT CONTROL ACTIONS</Text>
              <View className="flex-row gap-2">
                <Pressable
                  className="flex-1 flex-row items-center justify-center gap-1 py-2.5 px-1 rounded-xl bg-[#0084FF]"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIsTriggerModalOpen(true);
                  }}
                >
                  <Ionicons name="call" size={15} color="#FFFFFF" />
                  <Text className="text-white text-xs font-bold" numberOfLines={1}>Trigger Call</Text>
                </Pressable>

                <Pressable
                  className="flex-1 flex-row items-center justify-center gap-1 py-2.5 px-1 rounded-xl bg-blue-600"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIsCampaignModalOpen(true);
                  }}
                >
                  <Ionicons name="rocket" size={15} color="#FFFFFF" />
                  <Text className="text-white text-xs font-bold" numberOfLines={1}>Campaign</Text>
                </Pressable>

                <Pressable
                  className="flex-1 flex-row items-center justify-center gap-1 py-2.5 px-1 rounded-xl bg-[#262930] border border-[#334155]"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIsAgentModalOpen(true);
                  }}
                >
                  <Ionicons name="add-circle" size={16} color="#FFFFFF" />
                  <Text className="text-white text-xs font-bold" numberOfLines={1}>
                    New Agent
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Recent Call Telemetry Stream */}
            <View className="flex-row justify-between items-center mt-1.5">
              <Text className="text-[11.5px] font-bold text-slate-400 tracking-wider">RECENT CALL TELEMETRY</Text>
            </View>

            <View className="rounded-2xl border border-[#262930] overflow-hidden bg-[#181A1F]">
              {calls.slice(0, 5).map((call, idx, arr) => (
                <View key={call.id || idx}>
                  <Pressable
                    className="flex-row items-center p-3.5"
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedCall(call);
                    }}
                  >
                    <View className="w-9 h-9 rounded-xl justify-center items-center mr-3 bg-blue-500/15">
                      <Ionicons name="call" size={18} color="#0084FF" />
                    </View>
                    <View className="flex-1 mr-2">
                      <View className="flex-row justify-between mb-0.5">
                        <Text className="text-sm font-bold text-white" numberOfLines={1}>
                          {call.customerNumber || call.phone_number || 'Unknown Recipient'}
                        </Text>
                        <Text className="text-[11px] text-slate-400 font-semibold">{call.duration || '0s'}</Text>
                      </View>
                      <Text className="text-[11.5px] text-slate-400">{call.assistant || 'Voice Assistant'}</Text>
                      {call.summary ? (
                        <Text className="text-[11px] text-slate-500 italic mt-0.5" numberOfLines={1}>
                          "{call.summary}"
                        </Text>
                      ) : null}
                    </View>
                    <Ionicons name="chevron-forward" size={14} color="#64748B" />
                  </Pressable>
                  {idx < arr.length - 1 && <View className="h-[1px] ml-15 bg-[#262930]" />}
                </View>
              ))}

              {calls.length === 0 && !isCallsLoading && (
                <View className="items-center py-7 gap-2">
                  <Ionicons name="call-outline" size={32} color="#64748B" />
                  <Text className="text-xs text-slate-400">No recent calls dispatched yet.</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* --- SECTION 2: CALL LOGS --- */}
        {activeSection === 'calls' && (
          <View className="gap-3.5">
            <View className="flex-row justify-between items-center mt-1.5">
              <Text className="text-[11.5px] font-bold text-slate-400 tracking-wider">CALL LOGS & TRANSCRIPTS ({calls.length})</Text>
              <Pressable
                className="flex-row items-center gap-1"
                onPress={() => setIsTriggerModalOpen(true)}
              >
                <Ionicons name="add" size={16} color="#0084FF" />
                <Text className="text-[#0084FF] text-xs font-bold">Trigger Call</Text>
              </Pressable>
            </View>

            {isCallsLoading ? (
              <VoiceCallsSkeleton />
            ) : (
              <View className="rounded-2xl border border-[#262930] overflow-hidden bg-[#181A1F]">
                {calls.map((call, idx, arr) => (
                  <View key={call.id || idx}>
                    <Pressable
                      className="flex-row items-center p-3.5"
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedCall(call);
                      }}
                    >
                      <View className={`w-9 h-9 rounded-xl justify-center items-center mr-3 ${call.status === 'completed' ? 'bg-emerald-500/15' : 'bg-amber-500/15'}`}>
                        <Ionicons name={call.recordingUrl ? 'mic' : 'call'} size={18} color={call.status === 'completed' ? '#10B981' : '#F59E0B'} />
                      </View>
                      <View className="flex-1 mr-2">
                        <View className="flex-row justify-between mb-0.5">
                          <Text className="text-sm font-bold text-white">
                            {call.customerNumber || call.phone_number}
                          </Text>
                          <Text className="text-[11px] text-slate-400 font-semibold">{call.duration}</Text>
                        </View>
                        <Text className="text-[11.5px] text-slate-400">{call.assistant} • {call.time || 'Recent'}</Text>
                        {call.summary ? (
                          <Text className="text-[11px] text-slate-500 italic mt-0.5" numberOfLines={1}>
                            "{call.summary}"
                          </Text>
                        ) : null}
                      </View>
                      <Ionicons name="chevron-forward" size={14} color="#64748B" />
                    </Pressable>
                    {idx < arr.length - 1 && <View className="h-[1px] ml-15 bg-[#262930]" />}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* --- SECTION 3: AGENTS --- */}
        {activeSection === 'agents' && (
          <View className="gap-3.5">
            <View className="flex-row justify-between items-center mt-1.5">
              <Text className="text-[11.5px] font-bold text-slate-400 tracking-wider">AI VOICE ASSISTANTS ({agents.length})</Text>
              <Pressable className="flex-row items-center gap-1" onPress={() => setIsAgentModalOpen(true)}>
                <Ionicons name="add" size={16} color="#0084FF" />
                <Text className="text-[#0084FF] text-xs font-bold">New Agent</Text>
              </Pressable>
            </View>

            {isAgentsLoading ? (
              <ActivityIndicator size="large" color="#0084FF" className="mt-6" />
            ) : (
              <View className="gap-2.5">
                {agents.map((ast) => (
                  <View key={ast.id} className="rounded-2xl p-4 bg-[#181A1F] border border-[#262930]">
                    <View className="flex-row items-center gap-3">
                      <View className="w-10 h-10 rounded-xl justify-center items-center bg-blue-500/15">
                        <Ionicons name="mic" size={20} color="#0084FF" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[15px] font-bold text-white">{ast.name}</Text>
                        <Text className="text-[11.5px] text-slate-400 mt-0.5">
                          {ast.provider || 'vomyra'} • Status: {ast.status || 'active'}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-md">
                        <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <Text className="text-[10.5px] font-bold text-emerald-400">Ready</Text>
                      </View>
                    </View>

                    {ast.config_snapshot?.prompt || ast.config_snapshot?.system_prompt ? (
                      <Text className="text-xs text-slate-400 italic mt-2.5 leading-4" numberOfLines={2}>
                        "{ast.config_snapshot?.prompt || ast.config_snapshot?.system_prompt}"
                      </Text>
                    ) : null}

                    <View className="flex-row justify-end mt-3">
                      <Pressable
                        className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15"
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setIsTriggerModalOpen(true);
                        }}
                      >
                        <Ionicons name="call" size={14} color="#0084FF" />
                        <Text className="text-xs font-bold text-[#0084FF]">Test Call</Text>
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
          <View className="gap-3.5">
            <View className="flex-row justify-between items-center mt-1.5">
              <Text className="text-[11.5px] font-bold text-slate-400 tracking-wider">BULK VOICE CAMPAIGNS ({campaigns.length})</Text>
              <Pressable className="flex-row items-center gap-1" onPress={() => setIsCampaignModalOpen(true)}>
                <Ionicons name="add" size={16} color="#0084FF" />
                <Text className="text-[#0084FF] text-xs font-bold">Start Campaign</Text>
              </Pressable>
            </View>

            {isCampaignsLoading ? (
              <ActivityIndicator size="large" color="#0084FF" className="mt-6" />
            ) : (
              <View className="rounded-2xl border border-[#262930] overflow-hidden bg-[#181A1F]">
                {campaigns.map((camp, idx, arr) => (
                  <View key={camp.id || idx}>
                    <View className="flex-row items-center p-3.5">
                      <View className="w-9 h-9 rounded-xl justify-center items-center mr-3 bg-blue-500/15">
                        <Ionicons name="rocket" size={18} color="#0084FF" />
                      </View>
                      <View className="flex-1 mr-2">
                        <Text className="text-sm font-bold text-white">{camp.name}</Text>
                        <Text className="text-[11.5px] text-slate-400 mt-0.5">
                          {camp.total_contacts || 0} Contacts • Status: {camp.status || 'completed'}
                        </Text>
                      </View>
                      <View className={`px-2 py-1 rounded-md ${camp.status === 'running' ? 'bg-amber-500/15' : 'bg-emerald-500/15'}`}>
                        <Text className={`text-[11px] font-semibold ${camp.status === 'running' ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {camp.status || 'completed'}
                        </Text>
                      </View>
                    </View>
                    {idx < arr.length - 1 && <View className="h-[1px] ml-15 bg-[#262930]" />}
                  </View>
                ))}

                {campaigns.length === 0 && (
                  <View className="items-center py-7 gap-2">
                    <Ionicons name="rocket-outline" size={32} color="#64748B" />
                    <Text className="text-xs text-slate-400">No automated voice campaigns created yet.</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* --- SECTION 5: NUMBERS --- */}
        {activeSection === 'numbers' && (
          <View className="gap-3.5">
            <View className="flex-row justify-between items-center mt-1.5">
              <Text className="text-[11.5px] font-bold text-slate-400 tracking-wider">VIRTUAL PHONE NUMBERS ({numbers.length})</Text>
            </View>

            {isNumbersLoading ? (
              <ActivityIndicator size="large" color="#0084FF" className="mt-6" />
            ) : (
              <View className="rounded-2xl border border-[#262930] overflow-hidden bg-[#181A1F]">
                {numbers.map((pn, idx, arr) => (
                  <View key={pn.id || idx}>
                    <View className="flex-row items-center p-3.5">
                      <View className="w-9 h-9 rounded-xl justify-center items-center mr-3 bg-emerald-500/15">
                        <Ionicons name="keypad" size={18} color="#10B981" />
                      </View>
                      <View className="flex-1 mr-2">
                        <Text className="text-sm font-bold text-white">{pn.phone_number}</Text>
                        <Text className="text-[11.5px] text-slate-400 mt-0.5">
                          {pn.assistants?.name ? `Assigned to: ${pn.assistants.name}` : 'Unassigned'} • Provider: {pn.provider || 'vomyra'}
                        </Text>
                      </View>
                      <View className="bg-emerald-500/15 px-2 py-1 rounded-md">
                        <Text className="text-[11px] font-semibold text-emerald-400">{pn.status || 'active'}</Text>
                      </View>
                    </View>
                    {idx < arr.length - 1 && <View className="h-[1px] ml-15 bg-[#262930]" />}
                  </View>
                ))}

                {numbers.length === 0 && (
                  <View className="items-center py-7 gap-2">
                    <Ionicons name="keypad-outline" size={32} color="#64748B" />
                    <Text className="text-xs text-slate-400">No virtual phone numbers claimed yet.</Text>
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
        accentColor="#0084FF"
        moreMenuTitle="VoicePilot Tools"
      />
    </AppScreen>
  );
};
