import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../../core/api/client';

export const VoiceScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const [showCallModal, setShowCallModal] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState<string>('');

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['voice_summary'],
    queryFn: async () => apiClient.get<any>('/mobile/v1/voice/summary'),
  });

  const { data: calls, isLoading: callsLoading, refetch, isRefetching } = useQuery({
    queryKey: ['voice_calls'],
    queryFn: async () => apiClient.get<any[]>('/mobile/v1/calls'),
  });

  const callMutation = useMutation({
    mutationFn: (phone: string) =>
      apiClient.post('/mobile/v1/calls/outbound', { agentId: 'agent_v_1', phone }),
    onSuccess: () => {
      setShowCallModal(false);
      setPhoneNumber('');
      queryClient.invalidateQueries({ queryKey: ['voice_calls'] });
      queryClient.invalidateQueries({ queryKey: ['voice_summary'] });
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>GAP VoicePilot</Text>
            <Text style={styles.subtitle}>AI Voice Agents & Telecalling Hub</Text>
          </View>
          <Pressable style={styles.callButton} onPress={() => setShowCallModal(true)}>
            <Text style={styles.callButtonText}>📞 Trigger Call</Text>
          </Pressable>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.walletLabel}>Wallet Balance</Text>
              <Text style={styles.walletVal}>
                ₹{(summary?.walletCreditsRemaining || 4850).toLocaleString()}
              </Text>
            </View>
            <View style={styles.agentBadge}>
              <Text style={styles.agentBadgeText}>
                {summary?.activeAgentsCount || 3} Active AI Agents
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent AI Voice Calls</Text>

        {callsLoading ? (
          <ActivityIndicator size="large" color="#a855f7" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={calls || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.callCard}>
                <View style={styles.callHeader}>
                  <Text style={styles.callPhone}>{item.customerPhone}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          item.status === 'completed'
                            ? 'rgba(34, 197, 94, 0.15)'
                            : 'rgba(245, 158, 11, 0.15)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: item.status === 'completed' ? '#22c55e' : '#f59e0b' },
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.agentName}>🤖 {item.agentName}</Text>

                {item.transcriptSnippet ? (
                  <Text style={styles.transcript} numberOfLines={2}>
                    "{item.transcriptSnippet}"
                  </Text>
                ) : null}

                <View style={styles.callFooter}>
                  <Text style={styles.duration}>⏱️ {item.durationSeconds}s</Text>
                  <Text style={styles.timestamp}>
                    {new Date(item.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#a855f7" />
            }
          />
        )}

        {/* Trigger Outbound Call Modal */}
        <Modal
          visible={showCallModal}
          animationType="slide"
          presentationStyle="formSheet"
          onRequestClose={() => setShowCallModal(false)}
        >
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Trigger AI Outbound Call</Text>
                <Pressable onPress={() => setShowCallModal(false)}>
                  <Text style={styles.closeText}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.inputLabel}>Recipient Phone Number *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="+91 98765 43210"
                placeholderTextColor="#64748b"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />

              <Pressable
                style={[styles.startCallButton, !phoneNumber.trim() && styles.buttonDisabled]}
                disabled={!phoneNumber.trim() || callMutation.isPending}
                onPress={() => callMutation.mutate(phoneNumber.trim())}
              >
                <Text style={styles.startCallText}>
                  {callMutation.isPending ? 'Initiating...' : 'Start AI Call Now'}
                </Text>
              </Pressable>
            </View>
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
    marginBottom: 16,
  },
  title: { color: '#f8fafc', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#64748b', fontSize: 13, marginTop: 2 },
  callButton: { backgroundColor: '#a855f7', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  callButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  summaryCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  walletLabel: { color: '#94a3b8', fontSize: 12 },
  walletVal: { color: '#34d399', fontSize: 22, fontWeight: '800', marginTop: 2 },
  agentBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  agentBadgeText: { color: '#c084fc', fontSize: 11, fontWeight: '700' },
  sectionTitle: { color: '#cbd5e1', fontSize: 15, fontWeight: '700', marginBottom: 12 },
  listContent: { paddingBottom: 24 },
  callCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  callHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  callPhone: { color: '#f8fafc', fontSize: 16, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  agentName: { color: '#c084fc', fontSize: 13, marginTop: 4, fontWeight: '600' },
  transcript: { color: '#94a3b8', fontSize: 12, marginTop: 8, fontStyle: 'italic', lineHeight: 16 },
  callFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  duration: { color: '#64748b', fontSize: 12 },
  timestamp: { color: '#64748b', fontSize: 12 },
  modalSafeArea: { flex: 1, backgroundColor: '#020617' },
  modalContent: { padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#f8fafc', fontSize: 20, fontWeight: '700' },
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
  startCallButton: {
    backgroundColor: '#a855f7',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.5 },
  startCallText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
});
