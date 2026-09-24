import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  TextInput,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { voiceApi, DedicatedNumber, KycStatusResponse, VoiceCall, VoiceAssistant } from '../api/voiceApi';
import { CallDetailsModal, KycRequestModal, TriggerCallModal } from '../components';

export const CallsScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const queryClient = useQueryClient();

  const [selectedCall, setSelectedCall] = useState<VoiceCall | null>(null);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);

  // Quick Test Call Local State
  const [testPhone, setTestPhone] = useState('');
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>('');
  const [callStatusNotice, setCallStatusNotice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Queries
  const {
    data: numbersData,
    isLoading: isNumbersLoading,
    refetch: refetchNumbers,
  } = useQuery({
    queryKey: ['voice', 'numbers'],
    queryFn: () => voiceApi.getNumbers(),
  });

  const {
    data: kycData,
    isLoading: isKycLoading,
    refetch: refetchKyc,
  } = useQuery({
    queryKey: ['voice', 'kyc'],
    queryFn: () => voiceApi.getKycStatus(),
  });

  const {
    data: assistantsData,
    isLoading: isAssistantsLoading,
  } = useQuery({
    queryKey: ['voice', 'assistants'],
    queryFn: () => voiceApi.getAssistants(),
  });

  const {
    data: callsData,
    isLoading: isCallsLoading,
    refetch: refetchCalls,
    isRefetching: isCallsRefetching,
  } = useQuery({
    queryKey: ['voice', 'calls'],
    queryFn: () => voiceApi.getCalls(),
  });

  // Sync default assistant
  React.useEffect(() => {
    if (!selectedAssistantId && assistantsData && assistantsData.length > 0) {
      setSelectedAssistantId(assistantsData[0].id);
    }
  }, [assistantsData, selectedAssistantId]);

  // Mutations
  const triggerTestCallMutation = useMutation({
    mutationFn: (payload: any) => voiceApi.triggerOutboundCall(payload),
    onSuccess: (data: any) => {
      setCallStatusNotice('Call successfully queued! Connecting AI voice agent to recipient...');
      queryClient.invalidateQueries({ queryKey: ['voice', 'calls'] });
      queryClient.invalidateQueries({ queryKey: ['voice', 'analytics'] });
      setTimeout(() => setCallStatusNotice(null), 6000);
    },
    onError: (err: any) => {
      setCallStatusNotice(`Call error: ${err?.message || 'Could not reach server'}`);
    },
  });

  const kycMutation = useMutation({
    mutationFn: (payload: any) => voiceApi.submitKycRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice', 'kyc'] });
    },
  });

  const handleTestCall = async () => {
    if (!testPhone.trim()) {
      setCallStatusNotice('Please enter a phone number to test call.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const assignedNum = numbersData?.[0]?.phone_number || '+918047359000';
    await triggerTestCallMutation.mutateAsync({
      customerNumber: testPhone.trim(),
      customerName: 'Test Recipient',
      assistantId: selectedAssistantId,
      assignedNumber: assignedNum,
    });
  };

  const isRefreshing = isNumbersLoading || isKycLoading || isCallsRefetching;

  const handleRefresh = () => {
    refetchNumbers();
    refetchKyc();
    refetchCalls();
  };

  const dedicatedNumber: DedicatedNumber | undefined = numbersData?.[0];
  const kyc: KycStatusResponse = kycData || { status: 'verified', businessName: 'Enterprise' };
  const calls: VoiceCall[] = callsData || [];
  const assistants: VoiceAssistant[] = assistantsData || [];

  const filteredCalls = calls.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.customerNumber.toLowerCase().includes(q) ||
      (c.assistant && c.assistant.toLowerCase().includes(q)) ||
      (c.campaign && c.campaign.toLowerCase().includes(q))
    );
  });

  return (
    <ScrollView
      style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={isDark ? '#FFFFFF' : '#8B5CF6'} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* 1. DEDICATED NUMBER & KYC CARD */}
      <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>DEDICATED CALLER & KYC STATUS</Text>
          <Pressable
            style={styles.kycActionBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsKycModalOpen(true);
            }}
          >
            <Ionicons name="document-text-outline" size={14} color="#8B5CF6" />
            <Text style={styles.kycActionBtnText}>
              {kyc.status === 'verified' ? 'KYC Details' : 'Submit KYC'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.numberRow}>
          <View style={[styles.numIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
            <Ionicons name="call" size={20} color="#8B5CF6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.numVal, isDark && styles.textDark]}>
              {dedicatedNumber?.phone_number || '+91 80 4735 9000'}
            </Text>
            <Text style={styles.numSub}>
              Assigned: {dedicatedNumber?.assistants?.name || 'Sales Representative Bot'}
            </Text>
          </View>
          <View style={[styles.badge, kyc.status === 'verified' ? styles.badgeSuccess : styles.badgeWarning]}>
            <Text style={[styles.badgeText, kyc.status === 'verified' ? styles.textSuccess : styles.textWarning]}>
              {kyc.status === 'verified' ? 'KYC Verified' : 'KYC Pending'}
            </Text>
          </View>
        </View>
      </View>

      {/* 2. QUICK TEST CALL WIDGET */}
      <View style={[styles.card, styles.testCallCard, isDark ? styles.cardDark : styles.cardLight]}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.titleWithIcon}>
            <Ionicons name="flash" size={15} color="#8B5CF6" />
            <Text style={styles.sectionTitle}>QUICK TEST CALL</Text>
          </View>
          <Text style={styles.badgeHint}>Direct Dispatch</Text>
        </View>

        {/* Assistant Selector */}
        <View style={styles.testFieldGroup}>
          <Text style={styles.fieldLabel}>SELECT VOICE ASSISTANT</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.assistantsChips}>
            {(assistants.length > 0 ? assistants : [
              { id: 'ast_1', name: 'Sales Representative Bot' },
              { id: 'ast_2', name: 'Support Receptionist' },
            ]).map((ast) => {
              const isSelected = (selectedAssistantId || assistants[0]?.id) === ast.id;
              return (
                <Pressable
                  key={ast.id}
                  style={[
                    styles.chip,
                    isDark ? styles.chipDark : styles.chipLight,
                    isSelected && styles.chipSelected,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedAssistantId(ast.id);
                  }}
                >
                  <Ionicons name="mic" size={13} color={isSelected ? '#8B5CF6' : '#8E8E93'} />
                  <Text style={[styles.chipText, isDark && styles.textDark, isSelected && styles.chipTextSelected]}>
                    {ast.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Test Phone Input & Action Button */}
        <View style={styles.testFieldGroup}>
          <Text style={styles.fieldLabel}>TEST PHONE NUMBER</Text>
          <View style={styles.inputAndActionRow}>
            <TextInput
              style={[styles.testInput, isDark ? styles.inputDark : styles.inputLight]}
              placeholder="e.g. +91 98765 43210"
              placeholderTextColor="#8E8E93"
              keyboardType="phone-pad"
              value={testPhone}
              onChangeText={setTestPhone}
            />
            <Pressable
              style={[styles.testBtn, triggerTestCallMutation.isPending && styles.btnDisabled]}
              onPress={handleTestCall}
              disabled={triggerTestCallMutation.isPending}
            >
              {triggerTestCallMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="call" size={15} color="#FFFFFF" />
                  <Text style={styles.testBtnText}>Test Call</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>

        {callStatusNotice && (
          <View style={styles.noticeBanner}>
            <Ionicons name="information-circle" size={16} color="#8B5CF6" />
            <Text style={styles.noticeBannerText}>{callStatusNotice}</Text>
          </View>
        )}
      </View>

      {/* 3. CALL HISTORY LIST */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>CALL HISTORY ({filteredCalls.length})</Text>
        <Pressable
          style={styles.headerBtn}
          onPress={() => setIsTriggerModalOpen(true)}
        >
          <Ionicons name="add" size={16} color="#8B5CF6" />
          <Text style={styles.headerBtnText}>Outbound Call</Text>
        </Pressable>
      </View>

      {/* Search Filter */}
      <View style={[styles.searchBar, isDark ? styles.searchBarDark : styles.searchBarLight]}>
        <Ionicons name="search" size={16} color="#8E8E93" />
        <TextInput
          style={[styles.searchInput, isDark && styles.textDark]}
          placeholder="Search by customer phone, assistant, or campaign..."
          placeholderTextColor="#8E8E93"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={16} color="#8E8E93" />
          </Pressable>
        )}
      </View>

      {/* Calls Stream */}
      {isCallsLoading ? (
        <ActivityIndicator size="large" color="#8B5CF6" style={{ marginTop: 24 }} />
      ) : (
        <View style={[styles.card, styles.listCard, isDark ? styles.cardDark : styles.cardLight]}>
          {filteredCalls.map((call, idx, arr) => (
            <View key={call.id || idx}>
              <Pressable
                style={styles.callRow}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedCall(call);
                }}
              >
                <View
                  style={[
                    styles.callIconBox,
                    {
                      backgroundColor:
                        call.status === 'completed'
                          ? 'rgba(48, 209, 88, 0.12)'
                          : call.status === 'failed'
                          ? 'rgba(239, 68, 68, 0.12)'
                          : 'rgba(245, 158, 11, 0.12)',
                    },
                  ]}
                >
                  <Ionicons
                    name={call.recordingUrl ? 'mic' : 'call'}
                    size={18}
                    color={
                      call.status === 'completed'
                        ? '#30D158'
                        : call.status === 'failed'
                        ? '#EF4444'
                        : '#F59E0B'
                    }
                  />
                </View>

                <View style={styles.callInfo}>
                  <View style={styles.callRowHeader}>
                    <Text style={[styles.callPhone, isDark && styles.textDark]}>
                      {call.customerNumber}
                    </Text>
                    <Text style={styles.callDuration}>{call.duration || '10s'}</Text>
                  </View>

                  <Text style={styles.callSub}>
                    {call.assistant || 'Voice Assistant'} • {call.time || 'Recent'}
                  </Text>

                  {call.campaign ? (
                    <View style={styles.campaignPill}>
                      <Ionicons name="rocket-outline" size={10} color="#0A84FF" />
                      <Text style={styles.campaignPillText}>{call.campaign}</Text>
                    </View>
                  ) : null}

                  {call.summary ? (
                    <Text style={styles.callSummary} numberOfLines={1}>
                      "{call.summary}"
                    </Text>
                  ) : null}
                </View>

                <Ionicons name="chevron-forward" size={14} color="#8E8E93" />
              </Pressable>
              {idx < arr.length - 1 && <View style={[styles.divider, isDark ? styles.dividerDark : styles.dividerLight]} />}
            </View>
          ))}

          {filteredCalls.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="call-outline" size={36} color="#8E8E93" />
              <Text style={styles.emptyTitle}>No Calls Found</Text>
              <Text style={styles.emptySub}>
                {searchQuery ? 'Try changing your search keywords.' : 'Dispatch a test call or launch a campaign to populate call logs.'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Modals */}
      <CallDetailsModal
        visible={Boolean(selectedCall)}
        call={selectedCall}
        onClose={() => setSelectedCall(null)}
      />

      <KycRequestModal
        visible={isKycModalOpen}
        onClose={() => setIsKycModalOpen(false)}
        onSubmit={async (payload) => {
          await kycMutation.mutateAsync(payload);
        }}
        isLoading={kycMutation.isPending}
      />

      <TriggerCallModal
        visible={isTriggerModalOpen}
        assistants={assistants}
        onClose={() => setIsTriggerModalOpen(false)}
        onSubmit={async (payload) => {
          await triggerTestCallMutation.mutateAsync(payload);
        }}
        isLoading={triggerTestCallMutation.isPending}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerLight: { backgroundColor: '#F2F2F7' },
  containerDark: { backgroundColor: '#020617' },
  contentContainer: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 130, gap: 14 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1 },
  cardLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  cardDark: { backgroundColor: '#0F172A', borderColor: '#1E293B' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleWithIcon: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 11.5, fontWeight: '700', color: '#64748B', letterSpacing: 0.5 },
  kycActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  kycActionBtnText: { fontSize: 12, fontWeight: '700', color: '#8B5CF6' },
  numberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  numIconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  numVal: { fontSize: 16, fontWeight: '700' },
  numSub: { fontSize: 11.5, color: '#64748B', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeSuccess: { backgroundColor: 'rgba(48, 209, 88, 0.15)' },
  badgeWarning: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  badgeText: { fontSize: 10.5, fontWeight: '800' },
  textSuccess: { color: '#30D158' },
  textWarning: { color: '#F59E0B' },
  textDark: { color: '#F8FAFC' },
  testCallCard: { borderLeftWidth: 4, borderLeftColor: '#8B5CF6' },
  badgeHint: { fontSize: 10, fontWeight: '700', color: '#8B5CF6', backgroundColor: 'rgba(139, 92, 246, 0.12)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  testFieldGroup: { marginTop: 12, gap: 6 },
  fieldLabel: { fontSize: 10.5, fontWeight: '700', color: '#64748B', letterSpacing: 0.5 },
  assistantsChips: { gap: 8, paddingVertical: 2 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  chipLight: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  chipDark: { backgroundColor: '#1E293B', borderColor: '#334155' },
  chipSelected: { borderColor: '#8B5CF6', backgroundColor: 'rgba(139, 92, 246, 0.1)' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  chipTextSelected: { color: '#8B5CF6', fontWeight: '700' },
  inputAndActionRow: { flexDirection: 'row', gap: 8 },
  testInput: { flex: 1, height: 44, borderRadius: 10, paddingHorizontal: 12, fontSize: 13.5, borderWidth: 1 },
  inputLight: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', color: '#000000' },
  inputDark: { backgroundColor: '#1E293B', borderColor: '#334155', color: '#F8FAFC' },
  testBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#8B5CF6', paddingHorizontal: 16, height: 44, borderRadius: 10, justifyContent: 'center' },
  testBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
  noticeBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(139, 92, 246, 0.1)', padding: 10, borderRadius: 10, marginTop: 10 },
  noticeBannerText: { fontSize: 12, color: '#8B5CF6', fontWeight: '600', flex: 1 },
  headerBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerBtnText: { color: '#8B5CF6', fontSize: 12.5, fontWeight: '700' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 42, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1 },
  searchBarLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  searchBarDark: { backgroundColor: '#0F172A', borderColor: '#1E293B' },
  searchInput: { flex: 1, fontSize: 13 },
  listCard: { padding: 0, overflow: 'hidden' },
  callRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  callIconBox: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  callInfo: { flex: 1, marginRight: 8 },
  callRowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  callPhone: { fontSize: 14, fontWeight: '700' },
  callDuration: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  callSub: { fontSize: 11.5, color: '#64748B' },
  campaignPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(10, 132, 255, 0.1)', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  campaignPillText: { fontSize: 10, color: '#0A84FF', fontWeight: '600' },
  callSummary: { fontSize: 11, color: '#94A3B8', fontStyle: 'italic', marginTop: 3 },
  divider: { height: 1, marginLeft: 62 },
  dividerLight: { backgroundColor: '#E2E8F0' },
  dividerDark: { backgroundColor: '#1E293B' },
  emptyContainer: { alignItems: 'center', paddingVertical: 32, gap: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  emptySub: { fontSize: 12, color: '#94A3B8', textAlign: 'center', paddingHorizontal: 20 },
});
