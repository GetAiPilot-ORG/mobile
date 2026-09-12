import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Linking,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLead, useUpdateLead, useDeleteLead } from '../hooks/useLeads';
import { useDeals, useCreateDeal } from '../hooks/useDeals';
import { useTasks, useCreateTask, useToggleTask } from '../hooks/useTasks';
import { useActivities, useCreateActivity, useAddLeadNote } from '../hooks/useActivities';
import { ContactStatus } from '../types';
import { DealCard } from '../components/DealCard';
import { TaskItem } from '../components/TaskItem';
import { ActivityTimelineItem } from '../components/ActivityTimelineItem';
import { CreateDealModal } from '../components/CreateDealModal';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { LogActivityModal } from '../components/LogActivityModal';

interface LeadDetailScreenProps {
  leadId: string;
  onBack: () => void;
}

const STATUS_CONFIG: Partial<Record<ContactStatus, { label: string; bg: string; text: string; dot: string }>> = {
  lead: { label: 'New Lead', bg: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA', dot: '#3B82F6' },
  prospect: { label: 'Prospect', bg: 'rgba(245, 158, 11, 0.15)', text: '#FBBF24', dot: '#F59E0B' },
  customer: { label: 'Customer', bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', dot: '#10B981' },
  churned: { label: 'Churned', bg: 'rgba(239, 68, 68, 0.15)', text: '#F87171', dot: '#EF4444' },
  open: { label: 'Open', bg: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA', dot: '#3B82F6' },
  active: { label: 'Active', bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', dot: '#10B981' },
  archived: { label: 'Archived', bg: 'rgba(156, 163, 175, 0.15)', text: '#9CA3AF', dot: '#6B7280' },
};

export const LeadDetailScreen: React.FC<LeadDetailScreenProps> = ({ leadId, onBack }) => {
  const { data: lead, isLoading, refetch } = useLead(leadId);
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  const { data: deals = [] } = useDeals({ contact_id: leadId });
  const { data: tasks = [] } = useTasks({ contact_id: leadId });
  const { data: activities = [] } = useActivities({ contact_id: leadId });

  const createDeal = useCreateDeal();
  const createTask = useCreateTask();
  const toggleTask = useToggleTask();
  const createActivity = useCreateActivity();
  const addLeadNote = useAddLeadNote();

  const [activeTab, setActiveTab] = useState<'overview' | 'deals' | 'tasks' | 'timeline'>('overview');
  const [quickNote, setQuickNote] = useState('');
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showLogActivity, setShowLogActivity] = useState(false);

  const handleCall = () => {
    if (lead?.phone) Linking.openURL(`tel:${lead.phone}`);
  };

  const handleEmail = () => {
    if (lead?.email) Linking.openURL(`mailto:${lead.email}`);
  };

  const handleStatusChange = (newStatus: ContactStatus) => {
    if (lead) {
      updateLead.mutate({ id: lead.id, patch: { status: newStatus } });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Lead',
      'Are you sure you want to delete this lead? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (lead) {
              await deleteLead.mutateAsync(lead.id);
              onBack();
            }
          },
        },
      ]
    );
  };

  const handleSendQuickNote = async () => {
    if (!quickNote.trim() || !lead) return;
    await addLeadNote.mutateAsync({ leadId: lead.id, note: quickNote.trim() });
    setQuickNote('');
  };

  if (isLoading || !lead) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loaderText}>Loading contact details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={onBack} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {lead.name || `${lead.first_name} ${lead.last_name}`}
        </Text>
        <Pressable style={styles.iconBtn} onPress={handleDelete} hitSlop={8}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(lead.first_name?.[0] || 'L').toUpperCase()}
                {(lead.last_name?.[0] || '').toUpperCase()}
              </Text>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {lead.name || `${lead.first_name} ${lead.last_name}`}
              </Text>
              {lead.company || lead.job_title ? (
                <Text style={styles.profileCompany}>
                  {[lead.job_title, lead.company].filter(Boolean).join(' • ')}
                </Text>
              ) : null}

              {/* Status Pill Switcher */}
              <View style={styles.statusRow}>
                {(['lead', 'prospect', 'customer', 'churned'] as ContactStatus[]).map((s) => {
                  const isCurrent = lead.status === s;
                  const cfg = STATUS_CONFIG[s] || {
                    label: s,
                    bg: 'rgba(59, 130, 246, 0.15)',
                    text: '#60A5FA',
                    dot: '#3B82F6',
                  };
                  return (
                    <Pressable
                      key={s}
                      style={[styles.statusTab, isCurrent && { backgroundColor: cfg.bg, borderColor: cfg.dot }]}
                      onPress={() => handleStatusChange(s)}
                    >
                      <Text
                        style={[
                          styles.statusTabText,
                          isCurrent ? { color: cfg.text, fontWeight: '700' } : { color: '#6B7280' },
                        ]}
                      >
                        {cfg.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Quick Action Toolbar */}
          <View style={styles.actionToolbar}>
            <Pressable
              style={[styles.toolBtn, !lead.phone && styles.toolBtnDisabled]}
              onPress={handleCall}
              disabled={!lead.phone}
            >
              <Ionicons name="call" size={16} color={lead.phone ? '#10B981' : '#4B5563'} />
              <Text style={[styles.toolBtnText, !lead.phone && styles.toolBtnTextDisabled]}>Call</Text>
            </Pressable>

            <Pressable
              style={[styles.toolBtn, !lead.email && styles.toolBtnDisabled]}
              onPress={handleEmail}
              disabled={!lead.email}
            >
              <Ionicons name="mail" size={16} color={lead.email ? '#3B82F6' : '#4B5563'} />
              <Text style={[styles.toolBtnText, !lead.email && styles.toolBtnTextDisabled]}>Email</Text>
            </Pressable>

            <Pressable style={styles.toolBtn} onPress={() => setShowAddTask(true)}>
              <Ionicons name="checkbox-outline" size={16} color="#F59E0B" />
              <Text style={styles.toolBtnText}>+ Task</Text>
            </Pressable>

            <Pressable style={styles.toolBtn} onPress={() => setShowAddDeal(true)}>
              <Ionicons name="briefcase-outline" size={16} color="#8B5CF6" />
              <Text style={styles.toolBtnText}>+ Deal</Text>
            </Pressable>

            <Pressable style={styles.toolBtn} onPress={() => setShowLogActivity(true)}>
              <Ionicons name="add-circle-outline" size={16} color="#EC4899" />
              <Text style={styles.toolBtnText}>Log</Text>
            </Pressable>
          </View>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabNav}>
          {[
            { key: 'overview', label: 'Overview', count: null },
            { key: 'deals', label: 'Deals', count: deals.length },
            { key: 'tasks', label: 'Tasks', count: tasks.length },
            { key: 'timeline', label: 'Timeline', count: activities.length },
          ].map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                style={[styles.navTabItem, isSelected && styles.navTabItemSelected]}
                onPress={() => setActiveTab(tab.key as any)}
              >
                <Text style={[styles.navTabText, isSelected && styles.navTabTextSelected]}>
                  {tab.label} {tab.count !== null ? `(${tab.count})` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'overview' && (
            <View style={styles.overviewContainer}>
              {/* Contact Details Card */}
              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>Contact Information</Text>

                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={16} color="#9CA3AF" />
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={styles.infoValue}>{lead.phone || 'Not provided'}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={16} color="#9CA3AF" />
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{lead.email || 'Not provided'}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="business-outline" size={16} color="#9CA3AF" />
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Company</Text>
                    <Text style={styles.infoValue}>{lead.company || 'Not provided'}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="person-circle-outline" size={16} color="#9CA3AF" />
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Assigned Representative</Text>
                    <Text style={styles.infoValue}>{lead.assignee?.name || 'Unassigned'}</Text>
                  </View>
                </View>
              </View>

              {/* Notes Card */}
              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>Notes & Context</Text>
                <Text style={styles.notesText}>
                  {lead.notes || 'No general notes logged for this contact.'}
                </Text>
              </View>
            </View>
          )}

          {activeTab === 'deals' && (
            <View>
              <View style={styles.subHeader}>
                <Text style={styles.subHeaderTitle}>Linked Deals</Text>
                <Pressable style={styles.subHeaderBtn} onPress={() => setShowAddDeal(true)}>
                  <Text style={styles.subHeaderBtnText}>+ New Deal</Text>
                </Pressable>
              </View>

              {deals.length === 0 ? (
                <View style={styles.emptyTabCard}>
                  <Ionicons name="briefcase-outline" size={32} color="#6B7280" />
                  <Text style={styles.emptyTabText}>No deals associated with this contact yet.</Text>
                </View>
              ) : (
                deals.map((d) => (
                  <DealCard key={d.id} deal={d} onPress={() => {}} />
                ))
              )}
            </View>
          )}

          {activeTab === 'tasks' && (
            <View>
              <View style={styles.subHeader}>
                <Text style={styles.subHeaderTitle}>Pending Follow-ups & Tasks</Text>
                <Pressable style={styles.subHeaderBtn} onPress={() => setShowAddTask(true)}>
                  <Text style={styles.subHeaderBtnText}>+ New Task</Text>
                </Pressable>
              </View>

              {tasks.length === 0 ? (
                <View style={styles.emptyTabCard}>
                  <Ionicons name="checkbox-outline" size={32} color="#6B7280" />
                  <Text style={styles.emptyTabText}>No open tasks for this contact.</Text>
                </View>
              ) : (
                tasks.map((t) => (
                  <TaskItem
                    key={t.id}
                    task={t}
                    onToggle={(done) => toggleTask.mutate({ id: t.id, done })}
                  />
                ))
              )}
            </View>
          )}

          {activeTab === 'timeline' && (
            <View>
              {/* Quick Note Input Bar */}
              <View style={styles.quickNoteBar}>
                <TextInput
                  style={styles.quickNoteInput}
                  placeholder="Add a quick note or update..."
                  placeholderTextColor="#6B7280"
                  value={quickNote}
                  onChangeText={setQuickNote}
                />
                <Pressable
                  style={[styles.quickNoteSendBtn, !quickNote.trim() && { opacity: 0.5 }]}
                  onPress={handleSendQuickNote}
                  disabled={!quickNote.trim() || addLeadNote.isPending}
                >
                  <Ionicons name="send" size={16} color="#FFFFFF" />
                </Pressable>
              </View>

              {activities.length === 0 ? (
                <View style={styles.emptyTabCard}>
                  <Ionicons name="time-outline" size={32} color="#6B7280" />
                  <Text style={styles.emptyTabText}>No activity history logged yet.</Text>
                </View>
              ) : (
                activities.map((act, idx) => (
                  <ActivityTimelineItem
                    key={act.id}
                    activity={act}
                    isLast={idx === activities.length - 1}
                  />
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <CreateDealModal
        visible={showAddDeal}
        defaultContactId={lead.id}
        onClose={() => setShowAddDeal(false)}
        onSubmit={async (deal) => {
          await createDeal.mutateAsync({ ...deal, contact_id: lead.id });
          refetch();
        }}
        isLoading={createDeal.isPending}
      />

      <CreateTaskModal
        visible={showAddTask}
        defaultContactId={lead.id}
        onClose={() => setShowAddTask(false)}
        onSubmit={async (task) => {
          await createTask.mutateAsync({ ...task, contact_id: lead.id });
          refetch();
        }}
        isLoading={createTask.isPending}
      />

      <LogActivityModal
        visible={showLogActivity}
        defaultContactId={lead.id}
        onClose={() => setShowLogActivity(false)}
        onSubmit={async (act) => {
          await createActivity.mutateAsync({ ...act, contact_id: lead.id });
          refetch();
        }}
        isLoading={createActivity.isPending}
      />
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
    borderBottomWidth: 1,
    borderBottomColor: '#1E2028',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#181A20',
  },
  scroll: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: '#181A20',
    margin: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#262A34',
  },
  profileRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#262A34',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#3B82F6',
    fontSize: 18,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  profileCompany: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 2,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusTab: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#121316',
    borderWidth: 1,
    borderColor: '#262A34',
  },
  statusTabText: {
    fontSize: 11,
  },
  actionToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#222630',
  },
  toolBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  toolBtnDisabled: {
    opacity: 0.4,
  },
  toolBtnText: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '600',
  },
  toolBtnTextDisabled: {
    color: '#6B7280',
  },
  tabNav: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2028',
    marginBottom: 16,
  },
  navTabItem: {
    paddingVertical: 10,
    marginRight: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  navTabItemSelected: {
    borderBottomColor: '#3B82F6',
  },
  navTabText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  navTabTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  overviewContainer: {
    gap: 14,
  },
  infoCard: {
    backgroundColor: '#181A20',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#262A34',
  },
  infoCardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    color: '#6B7280',
    fontSize: 11,
  },
  infoValue: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  notesText: {
    color: '#D1D5DB',
    fontSize: 13,
    lineHeight: 20,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  subHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  subHeaderBtn: {
    backgroundColor: '#262A34',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  subHeaderBtnText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyTabCard: {
    backgroundColor: '#181A20',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#262A34',
    borderStyle: 'dashed',
  },
  emptyTabText: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  quickNoteBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#181A20',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#262A34',
    marginBottom: 16,
  },
  quickNoteInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    paddingHorizontal: 8,
  },
  quickNoteSendBtn: {
    backgroundColor: '#3B82F6',
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
});
