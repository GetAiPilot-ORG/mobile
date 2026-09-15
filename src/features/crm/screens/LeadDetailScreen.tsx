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
  useColorScheme,
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
import { LeadDetailSkeleton } from '../../../components/skeletonScreen';

interface LeadDetailScreenProps {
  leadId: string;
  onBack: () => void;
}

const STATUS_CONFIG: Partial<Record<ContactStatus, { label: string; bg: string; text: string; dot: string }>> = {
  lead: { label: 'New Lead', bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6', dot: '#3B82F6' },
  prospect: { label: 'Prospect', bg: 'rgba(245, 158, 11, 0.15)', text: '#D97706', dot: '#F59E0B' },
  customer: { label: 'Customer', bg: 'rgba(16, 185, 129, 0.15)', text: '#059669', dot: '#10B981' },
  churned: { label: 'Churned', bg: 'rgba(239, 68, 68, 0.15)', text: '#DC2626', dot: '#EF4444' },
  open: { label: 'Open', bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6', dot: '#3B82F6' },
  active: { label: 'Active', bg: 'rgba(16, 185, 129, 0.15)', text: '#059669', dot: '#10B981' },
  archived: { label: 'Archived', bg: 'rgba(156, 163, 175, 0.15)', text: '#6B7280', dot: '#6B7280' },
};

export const LeadDetailScreen: React.FC<LeadDetailScreenProps> = ({ leadId, onBack }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
      <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#0F1015' : '#F8FAFC' }]}>
        <LeadDetailSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#0F1015' : '#F8FAFC' }]} edges={['top']}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? '#1E2028' : '#E2E8F0' }]}>
        <Pressable
          style={[styles.iconBtn, { backgroundColor: isDark ? '#181A20' : '#F1F5F9' }]}
          onPress={onBack}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]} numberOfLines={1}>
          {lead.name || `${lead.first_name} ${lead.last_name}`}
        </Text>
        <Pressable
          style={[styles.iconBtn, { backgroundColor: isDark ? '#181A20' : '#F1F5F9' }]}
          onPress={handleDelete}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={[styles.profileCard, isDark ? styles.cardDark : styles.cardLight]}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: isDark ? '#262A34' : '#E2E8F0' }]}>
              <Text style={styles.avatarText}>
                {(lead.first_name?.[0] || 'L').toUpperCase()}
                {(lead.last_name?.[0] || '').toUpperCase()}
              </Text>
            </View>

            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                {lead.name || `${lead.first_name} ${lead.last_name}`}
              </Text>
              {lead.company || lead.job_title ? (
                <Text style={[styles.profileCompany, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
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
                    text: '#3B82F6',
                    dot: '#3B82F6',
                  };
                  return (
                    <Pressable
                      key={s}
                      style={[
                        styles.statusTab,
                        { backgroundColor: isDark ? '#121316' : '#F8FAFC', borderColor: isDark ? '#262A34' : '#E2E8F0' },
                        isCurrent && { backgroundColor: cfg.bg, borderColor: cfg.dot },
                      ]}
                      onPress={() => handleStatusChange(s)}
                    >
                      <Text
                        style={[
                          styles.statusTabText,
                          isCurrent ? { color: cfg.text, fontWeight: '700' } : { color: isDark ? '#6B7280' : '#94A3B8' },
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
          <View style={[styles.actionToolbar, { borderTopColor: isDark ? '#222630' : '#F1F5F9' }]}>
            <Pressable
              style={[styles.toolBtn, !lead.phone && styles.toolBtnDisabled]}
              onPress={handleCall}
              disabled={!lead.phone}
            >
              <Ionicons name="call" size={16} color={lead.phone ? '#10B981' : isDark ? '#4B5563' : '#CBD5E1'} />
              <Text style={[styles.toolBtnText, { color: isDark ? '#D1D5DB' : '#334155' }, !lead.phone && styles.toolBtnTextDisabled]}>Call</Text>
            </Pressable>

            <Pressable
              style={[styles.toolBtn, !lead.email && styles.toolBtnDisabled]}
              onPress={handleEmail}
              disabled={!lead.email}
            >
              <Ionicons name="mail" size={16} color={lead.email ? '#3B82F6' : isDark ? '#4B5563' : '#CBD5E1'} />
              <Text style={[styles.toolBtnText, { color: isDark ? '#D1D5DB' : '#334155' }, !lead.email && styles.toolBtnTextDisabled]}>Email</Text>
            </Pressable>

            <Pressable style={styles.toolBtn} onPress={() => setShowAddTask(true)}>
              <Ionicons name="checkbox-outline" size={16} color="#F59E0B" />
              <Text style={[styles.toolBtnText, { color: isDark ? '#D1D5DB' : '#334155' }]}>+ Task</Text>
            </Pressable>

            <Pressable style={styles.toolBtn} onPress={() => setShowAddDeal(true)}>
              <Ionicons name="briefcase-outline" size={16} color="#8B5CF6" />
              <Text style={[styles.toolBtnText, { color: isDark ? '#D1D5DB' : '#334155' }]}>+ Deal</Text>
            </Pressable>

            <Pressable style={styles.toolBtn} onPress={() => setShowLogActivity(true)}>
              <Ionicons name="add-circle-outline" size={16} color="#EC4899" />
              <Text style={[styles.toolBtnText, { color: isDark ? '#D1D5DB' : '#334155' }]}>Log</Text>
            </Pressable>
          </View>
        </View>

        {/* Navigation Tabs */}
        <View style={[styles.tabNav, { borderBottomColor: isDark ? '#1E2028' : '#E2E8F0' }]}>
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
                <Text
                  style={[
                    styles.navTabText,
                    { color: isDark ? '#9CA3AF' : '#64748B' },
                    isSelected && (isDark ? styles.navTabTextSelectedDark : styles.navTabTextSelectedLight),
                  ]}
                >
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
              <View style={[styles.infoCard, isDark ? styles.cardDark : styles.cardLight]}>
                <Text style={[styles.infoCardTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Contact Information</Text>

                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={16} color={isDark ? '#9CA3AF' : '#64748B'} />
                  <View style={styles.infoCol}>
                    <Text style={[styles.infoLabel, { color: isDark ? '#6B7280' : '#94A3B8' }]}>Phone</Text>
                    <Text style={[styles.infoValue, { color: isDark ? '#E5E7EB' : '#1E293B' }]}>{lead.phone || 'Not provided'}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={16} color={isDark ? '#9CA3AF' : '#64748B'} />
                  <View style={styles.infoCol}>
                    <Text style={[styles.infoLabel, { color: isDark ? '#6B7280' : '#94A3B8' }]}>Email</Text>
                    <Text style={[styles.infoValue, { color: isDark ? '#E5E7EB' : '#1E293B' }]}>{lead.email || 'Not provided'}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="business-outline" size={16} color={isDark ? '#9CA3AF' : '#64748B'} />
                  <View style={styles.infoCol}>
                    <Text style={[styles.infoLabel, { color: isDark ? '#6B7280' : '#94A3B8' }]}>Company</Text>
                    <Text style={[styles.infoValue, { color: isDark ? '#E5E7EB' : '#1E293B' }]}>{lead.company || 'Not provided'}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="person-circle-outline" size={16} color={isDark ? '#9CA3AF' : '#64748B'} />
                  <View style={styles.infoCol}>
                    <Text style={[styles.infoLabel, { color: isDark ? '#6B7280' : '#94A3B8' }]}>Assigned Representative</Text>
                    <Text style={[styles.infoValue, { color: isDark ? '#E5E7EB' : '#1E293B' }]}>{lead.assignee?.name || 'Unassigned'}</Text>
                  </View>
                </View>
              </View>

              {/* Notes Card */}
              <View style={[styles.infoCard, isDark ? styles.cardDark : styles.cardLight]}>
                <Text style={[styles.infoCardTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Notes & Context</Text>
                <Text style={[styles.notesText, { color: isDark ? '#D1D5DB' : '#334155' }]}>
                  {lead.notes || 'No general notes logged for this contact.'}
                </Text>
              </View>
            </View>
          )}

          {activeTab === 'deals' && (
            <View>
              <View style={styles.subHeader}>
                <Text style={[styles.subHeaderTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Linked Deals</Text>
                <Pressable
                  style={[styles.subHeaderBtn, { backgroundColor: isDark ? '#262A34' : '#EFF6FF' }]}
                  onPress={() => setShowAddDeal(true)}
                >
                  <Text style={styles.subHeaderBtnText}>+ New Deal</Text>
                </Pressable>
              </View>

              {deals.length === 0 ? (
                <View style={[styles.emptyTabCard, isDark ? styles.cardDark : styles.cardLight]}>
                  <Ionicons name="briefcase-outline" size={32} color={isDark ? '#6B7280' : '#94A3B8'} />
                  <Text style={[styles.emptyTabText, { color: isDark ? '#9CA3AF' : '#64748B' }]}>No deals associated with this contact yet.</Text>
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
                <Text style={[styles.subHeaderTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Pending Follow-ups & Tasks</Text>
                <Pressable
                  style={[styles.subHeaderBtn, { backgroundColor: isDark ? '#262A34' : '#EFF6FF' }]}
                  onPress={() => setShowAddTask(true)}
                >
                  <Text style={styles.subHeaderBtnText}>+ New Task</Text>
                </Pressable>
              </View>

              {tasks.length === 0 ? (
                <View style={[styles.emptyTabCard, isDark ? styles.cardDark : styles.cardLight]}>
                  <Ionicons name="checkbox-outline" size={32} color={isDark ? '#6B7280' : '#94A3B8'} />
                  <Text style={[styles.emptyTabText, { color: isDark ? '#9CA3AF' : '#64748B' }]}>No open tasks for this contact.</Text>
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
              <View style={[styles.quickNoteBar, { backgroundColor: isDark ? '#181A20' : '#FFFFFF', borderColor: isDark ? '#262A34' : '#E2E8F0' }]}>
                <TextInput
                  style={[styles.quickNoteInput, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                  placeholder="Add a quick note or update..."
                  placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
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
                <View style={[styles.emptyTabCard, isDark ? styles.cardDark : styles.cardLight]}>
                  <Ionicons name="time-outline" size={32} color={isDark ? '#6B7280' : '#94A3B8'} />
                  <Text style={[styles.emptyTabText, { color: isDark ? '#9CA3AF' : '#64748B' }]}>No activity history logged yet.</Text>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 8,
  },
  scroll: {
    flex: 1,
  },
  profileCard: {
    margin: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  cardDark: {
    backgroundColor: '#181A20',
    borderColor: '#262A34',
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  profileRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
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
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  profileCompany: {
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
    borderWidth: 1,
  },
  statusTabText: {
    fontSize: 11,
  },
  actionToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
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
    fontSize: 14,
    fontWeight: '500',
  },
  navTabTextSelectedDark: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  navTabTextSelectedLight: {
    color: '#0F172A',
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
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  infoCardTitle: {
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
    fontSize: 11,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  notesText: {
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
    fontSize: 15,
    fontWeight: '700',
  },
  subHeaderBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  subHeaderBtnText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyTabCard: {
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyTabText: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  quickNoteBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  quickNoteInput: {
    flex: 1,
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
    fontSize: 13,
    marginTop: 12,
  },
});
