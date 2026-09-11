import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { crmApi } from '../api/crm.api';
import { LeadActivityItem, LeadValueBadge } from '../components';
import { useLead } from '../hooks/useLead';
import { usePipelines } from '../hooks/usePipelines';

import { useRouter } from 'expo-router';

interface LeadDetailScreenProps {
  leadId: string;
  onBack?: () => void;
}

export const LeadDetailScreen: React.FC<LeadDetailScreenProps> = ({ leadId, onBack }) => {
  const router = useRouter();
  const handleBack = onBack || (() => router.back());
  const queryClient = useQueryClient();
  const { lead, isLoadingLead, activities, isLoadingActivities, refetch } = useLead(leadId);
  const { data: pipelines } = usePipelines();

  const [noteText, setNoteText] = useState<string>('');
  const [showStageModal, setShowStageModal] = useState<boolean>(false);

  const moveMutation = useMutation({
    mutationFn: (stageId: string) => crmApi.moveLead(leadId, stageId),
    onSuccess: () => {
      setShowStageModal(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['crm_leads'] });
      queryClient.invalidateQueries({ queryKey: ['crm_pipelines'] });
      queryClient.invalidateQueries({ queryKey: ['unified_dashboard'] });
    },
  });

  const noteMutation = useMutation({
    mutationFn: (note: string) => crmApi.addLeadNote(leadId, note),
    onSuccess: () => {
      setNoteText('');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['crm_lead_activities', leadId] });
    },
  });

  if (isLoadingLead && !lead) {
    return (
      <SafeAreaView style={styles.stateContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.stateText}>Loading lead profile & timeline...</Text>
      </SafeAreaView>
    );
  }

  if (!lead) {
    return (
      <SafeAreaView style={styles.stateContainer}>
        <Text style={styles.errorText}>Lead not found</Text>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>← Return to Leads</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const stages = pipelines?.[0]?.stages || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Navigation Header */}
        <View style={styles.navHeader}>
          <Pressable style={styles.navBack} onPress={handleBack}>
            <Text style={styles.navBackText}>← Back</Text>
          </Pressable>
          <Text style={styles.navTitle}>Lead Overview</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Lead Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarChar}>{lead.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.leadName}>{lead.name}</Text>
              <Text style={styles.companyName}>{lead.company || 'Individual Client'}</Text>
              <Text style={styles.sourceText}>Source: {lead.source || 'Direct Inbound'}</Text>
            </View>
          </View>

          <View style={styles.profileMetaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Estimated Value</Text>
              <LeadValueBadge value={lead.value} currency={lead.currency} />
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Assigned Owner</Text>
              <Text style={styles.metaVal}>👤 {lead.owner?.name || 'Unassigned'}</Text>
            </View>
          </View>

          {/* Contact Details */}
          <View style={styles.contactDetails}>
            {lead.phone ? <Text style={styles.contactRow}>📞 {lead.phone}</Text> : null}
            {lead.email ? <Text style={styles.contactRow}>✉️ {lead.email}</Text> : null}
          </View>

          {/* Current Stage Action */}
          <View style={styles.stageActionRow}>
            <View>
              <Text style={styles.stageActionLabel}>Current Pipeline Stage</Text>
              <Text style={styles.stageActionCurrent}>{lead.stage_name}</Text>
            </View>
            <Pressable style={styles.changeStageButton} onPress={() => setShowStageModal(true)}>
              <Text style={styles.changeStageText}>Change Stage ▾</Text>
            </Pressable>
          </View>
        </View>

        {/* Notes Input Section */}
        <Text style={styles.sectionTitle}>Add Team Note</Text>
        <View style={styles.noteInputCard}>
          <TextInput
            style={styles.noteInput}
            placeholder="Log call notes, meeting takeaways, or next steps..."
            placeholderTextColor="#64748b"
            value={noteText}
            onChangeText={setNoteText}
            multiline
          />
          <Pressable
            style={[styles.saveNoteButton, !noteText.trim() && styles.buttonDisabled]}
            disabled={!noteText.trim() || noteMutation.isPending}
            onPress={() => noteMutation.mutate(noteText.trim())}
          >
            <Text style={styles.saveNoteText}>
              {noteMutation.isPending ? 'Saving...' : 'Add Note'}
            </Text>
          </Pressable>
        </View>

        {/* Unified Ecosystem Activity Timeline */}
        <Text style={styles.sectionTitle}>Unified Cross-Product Timeline</Text>
        <View style={styles.timelineCard}>
          {isLoadingActivities ? (
            <ActivityIndicator size="small" color="#6366f1" style={{ padding: 20 }} />
          ) : activities.length > 0 ? (
            activities.map((act) => <LeadActivityItem key={act.id} activity={act} />)
          ) : (
            <View style={styles.emptyTimeline}>
              <Text style={styles.emptyTimelineText}>No activities logged yet</Text>
            </View>
          )}
        </View>

        {/* Stage Selection Modal */}
        <Modal
          visible={showStageModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowStageModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowStageModal(false)}>
            <View style={styles.modalBody}>
              <Text style={styles.modalHeading}>Move Lead to Stage</Text>
              {stages.map((stg) => (
                <Pressable
                  key={stg.id}
                  style={[styles.stageOption, lead.stage_id === stg.id && styles.stageOptionActive]}
                  onPress={() => moveMutation.mutate(stg.id)}
                >
                  <Text style={[styles.stageOptionText, lead.stage_id === stg.id && styles.stageOptionTextActive]}>
                    {stg.name}
                  </Text>
                  {lead.stage_id === stg.id ? <Text style={styles.checkIcon}>✓</Text> : null}
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020617' },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  stateContainer: { flex: 1, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center' },
  stateText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
  errorText: { color: '#ef4444', fontSize: 16, fontWeight: '700' },
  backButton: { marginTop: 16, backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  backButtonText: { color: '#818cf8', fontWeight: '700' },
  navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  navBack: { backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  navBackText: { color: '#818cf8', fontWeight: '700', fontSize: 13 },
  navTitle: { color: '#f8fafc', fontSize: 17, fontWeight: '700' },
  profileCard: { backgroundColor: '#0f172a', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1e293b', marginBottom: 16 },
  profileTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatarBox: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', marginRight: 14, borderWidth: 2, borderColor: '#3b82f6' },
  avatarChar: { color: '#f8fafc', fontSize: 20, fontWeight: '800' },
  profileInfo: { flex: 1 },
  leadName: { color: '#f8fafc', fontSize: 18, fontWeight: '800' },
  companyName: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
  sourceText: { color: '#64748b', fontSize: 11, marginTop: 2 },
  profileMetaGrid: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingVertical: 10 },
  metaItem: { flex: 1 },
  metaLabel: { color: '#64748b', fontSize: 11, marginBottom: 4 },
  metaVal: { color: '#f8fafc', fontSize: 13, fontWeight: '600' },
  contactDetails: { backgroundColor: '#020617', borderRadius: 10, padding: 12, marginVertical: 10, borderWidth: 1, borderColor: '#1e293b' },
  contactRow: { color: '#cbd5e1', fontSize: 13, marginVertical: 2 },
  stageActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  stageActionLabel: { color: '#64748b', fontSize: 11 },
  stageActionCurrent: { color: '#818cf8', fontSize: 15, fontWeight: '700', marginTop: 2 },
  changeStageButton: { backgroundColor: '#1e1b4b', borderWidth: 1, borderColor: '#6366f1', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  changeStageText: { color: '#818cf8', fontSize: 12, fontWeight: '700' },
  sectionTitle: { color: '#cbd5e1', fontSize: 15, fontWeight: '700', marginTop: 14, marginBottom: 8 },
  noteInputCard: { backgroundColor: '#0f172a', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#1e293b', marginBottom: 16 },
  noteInput: { backgroundColor: '#020617', borderRadius: 10, padding: 12, color: '#f8fafc', fontSize: 13, minHeight: 60, textAlignVertical: 'top', borderWidth: 1, borderColor: '#1e293b' },
  saveNoteButton: { alignSelf: 'flex-end', backgroundColor: '#6366f1', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, marginTop: 10 },
  buttonDisabled: { opacity: 0.5 },
  saveNoteText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  timelineCard: { backgroundColor: '#0f172a', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1e293b' },
  emptyTimeline: { padding: 20, alignItems: 'center' },
  emptyTimelineText: { color: '#64748b', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBody: { width: '100%', maxWidth: 360, backgroundColor: '#0f172a', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#1e293b' },
  modalHeading: { color: '#f8fafc', fontSize: 18, fontWeight: '700', marginBottom: 14 },
  stageOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, marginBottom: 6 },
  stageOptionActive: { backgroundColor: '#1e1b4b' },
  stageOptionText: { color: '#cbd5e1', fontSize: 14, fontWeight: '600' },
  stageOptionTextActive: { color: '#818cf8', fontWeight: '700' },
  checkIcon: { color: '#818cf8', fontWeight: '800' },
});
