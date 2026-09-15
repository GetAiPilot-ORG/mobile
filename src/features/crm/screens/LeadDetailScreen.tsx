import React, { useState } from 'react';
import {
  Text,
  View,
  ScrollView,
  Pressable,
  Linking,
  TextInput,
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
      <SafeAreaView className="flex-1 bg-[#0B0D10]">
        <LeadDetailSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0B0D10]" edges={['top']}>
      {/* Top Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-[#262930]">
        <Pressable
          className="p-2 rounded-lg bg-[#181A1F] border border-[#262930]"
          onPress={onBack}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </Pressable>
        <Text className="text-white text-base font-bold flex-1 text-center mx-2.5" numberOfLines={1}>
          {lead.name || `${lead.first_name} ${lead.last_name}`}
        </Text>
        <Pressable
          className="p-2 rounded-lg bg-[#181A1F] border border-[#262930]"
          onPress={handleDelete}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </Pressable>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View className="m-4 rounded-2xl p-4 bg-[#181A1F] border border-[#262930]">
          <View className="flex-row mb-4">
            <View className="w-13 h-13 rounded-2xl bg-[#111317] border border-[#262930] items-center justify-center mr-3.5">
              <Text className="text-[#0084FF] text-lg font-bold">
                {(lead.first_name?.[0] || 'L').toUpperCase()}
                {(lead.last_name?.[0] || '').toUpperCase()}
              </Text>
            </View>

            <View className="flex-1">
              <Text className="text-white text-lg font-bold tracking-tight">
                {lead.name || `${lead.first_name} ${lead.last_name}`}
              </Text>
              {lead.company || lead.job_title ? (
                <Text className="text-slate-400 text-xs mt-0.5 mb-2">
                  {[lead.job_title, lead.company].filter(Boolean).join(' • ')}
                </Text>
              ) : null}

              {/* Status Pill Switcher */}
              <View className="flex-row flex-wrap gap-1.5 mt-1">
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
                      className={`px-2 py-1 rounded-md border ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-500/20'
                          : 'bg-[#111317] border-[#262930]'
                      }`}
                      onPress={() => handleStatusChange(s)}
                    >
                      <Text
                        className="text-[11px]"
                        style={{
                          color: isCurrent ? cfg.text : '#94A3B8',
                          fontWeight: isCurrent ? '700' : '500',
                        }}
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
          <View className="flex-row justify-between pt-3 border-t border-[#262930]">
            <Pressable
              className={`flex-1 items-center justify-center gap-1 py-1.5 ${!lead.phone ? 'opacity-40' : ''}`}
              onPress={handleCall}
              disabled={!lead.phone}
            >
              <Ionicons name="call" size={16} color={lead.phone ? '#10B981' : '#64748B'} />
              <Text className={`text-[11px] font-semibold ${lead.phone ? 'text-slate-200' : 'text-slate-500'}`}>Call</Text>
            </Pressable>

            <Pressable
              className={`flex-1 items-center justify-center gap-1 py-1.5 ${!lead.email ? 'opacity-40' : ''}`}
              onPress={handleEmail}
              disabled={!lead.email}
            >
              <Ionicons name="mail" size={16} color={lead.email ? '#0084FF' : '#64748B'} />
              <Text className={`text-[11px] font-semibold ${lead.email ? 'text-slate-200' : 'text-slate-500'}`}>Email</Text>
            </Pressable>

            <Pressable className="flex-1 items-center justify-center gap-1 py-1.5" onPress={() => setShowAddTask(true)}>
              <Ionicons name="checkbox-outline" size={16} color="#F59E0B" />
              <Text className="text-slate-200 text-[11px] font-semibold">+ Task</Text>
            </Pressable>

            <Pressable className="flex-1 items-center justify-center gap-1 py-1.5" onPress={() => setShowAddDeal(true)}>
              <Ionicons name="briefcase-outline" size={16} color="#8B5CF6" />
              <Text className="text-slate-200 text-[11px] font-semibold">+ Deal</Text>
            </Pressable>

            <Pressable className="flex-1 items-center justify-center gap-1 py-1.5" onPress={() => setShowLogActivity(true)}>
              <Ionicons name="add-circle-outline" size={16} color="#EC4899" />
              <Text className="text-slate-200 text-[11px] font-semibold">Log</Text>
            </Pressable>
          </View>
        </View>

        {/* Navigation Tabs */}
        <View className="flex-row px-4 border-b border-[#262930] mb-4">
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
                className={`py-2.5 mr-4 border-b-2 ${
                  isSelected ? 'border-[#0084FF]' : 'border-transparent'
                }`}
                onPress={() => setActiveTab(tab.key as any)}
              >
                <Text
                  className={`text-sm ${
                    isSelected ? 'text-white font-bold' : 'text-slate-400 font-medium'
                  }`}
                >
                  {tab.label} {tab.count !== null ? `(${tab.count})` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Tab Content */}
        <View className="px-4 pb-28">
          {activeTab === 'overview' && (
            <View className="gap-3.5">
              {/* Contact Details Card */}
              <View className="rounded-2xl p-4 bg-[#181A1F] border border-[#262930]">
                <Text className="text-white text-[15px] font-bold mb-3.5">Contact Information</Text>

                <View className="flex-row items-start gap-3 mb-3">
                  <Ionicons name="call-outline" size={16} color="#94A3B8" />
                  <View className="flex-1">
                    <Text className="text-slate-500 text-[11px]">Phone</Text>
                    <Text className="text-slate-200 text-sm font-medium mt-0.5">{lead.phone || 'Not provided'}</Text>
                  </View>
                </View>

                <View className="flex-row items-start gap-3 mb-3">
                  <Ionicons name="mail-outline" size={16} color="#94A3B8" />
                  <View className="flex-1">
                    <Text className="text-slate-500 text-[11px]">Email</Text>
                    <Text className="text-slate-200 text-sm font-medium mt-0.5">{lead.email || 'Not provided'}</Text>
                  </View>
                </View>

                <View className="flex-row items-start gap-3 mb-3">
                  <Ionicons name="business-outline" size={16} color="#94A3B8" />
                  <View className="flex-1">
                    <Text className="text-slate-500 text-[11px]">Company</Text>
                    <Text className="text-slate-200 text-sm font-medium mt-0.5">{lead.company || 'Not provided'}</Text>
                  </View>
                </View>

                <View className="flex-row items-start gap-3">
                  <Ionicons name="person-circle-outline" size={16} color="#94A3B8" />
                  <View className="flex-1">
                    <Text className="text-slate-500 text-[11px]">Assigned Representative</Text>
                    <Text className="text-slate-200 text-sm font-medium mt-0.5">{lead.assignee?.name || 'Unassigned'}</Text>
                  </View>
                </View>
              </View>

              {/* Notes Card */}
              <View className="rounded-2xl p-4 bg-[#181A1F] border border-[#262930]">
                <Text className="text-white text-[15px] font-bold mb-2">Notes & Context</Text>
                <Text className="text-slate-300 text-xs leading-5">
                  {lead.notes || 'No general notes logged for this contact.'}
                </Text>
              </View>
            </View>
          )}

          {activeTab === 'deals' && (
            <View>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-white text-[15px] font-bold">Linked Deals</Text>
                <Pressable
                  className="px-2.5 py-1.5 rounded-lg bg-[#262930]"
                  onPress={() => setShowAddDeal(true)}
                >
                  <Text className="text-[#0084FF] text-xs font-semibold">+ New Deal</Text>
                </Pressable>
              </View>

              {deals.length === 0 ? (
                <View className="rounded-2xl p-6 items-center justify-center bg-[#181A1F] border border-dashed border-[#262930]">
                  <Ionicons name="briefcase-outline" size={32} color="#64748B" />
                  <Text className="text-slate-400 text-xs mt-2 text-center">No deals associated with this contact yet.</Text>
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
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-white text-[15px] font-bold">Pending Follow-ups & Tasks</Text>
                <Pressable
                  className="px-2.5 py-1.5 rounded-lg bg-[#262930]"
                  onPress={() => setShowAddTask(true)}
                >
                  <Text className="text-[#0084FF] text-xs font-semibold">+ New Task</Text>
                </Pressable>
              </View>

              {tasks.length === 0 ? (
                <View className="rounded-2xl p-6 items-center justify-center bg-[#181A1F] border border-dashed border-[#262930]">
                  <Ionicons name="checkbox-outline" size={32} color="#64748B" />
                  <Text className="text-slate-400 text-xs mt-2 text-center">No open tasks for this contact.</Text>
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
              <View className="flex-row items-center gap-2 rounded-xl p-2 bg-[#181A1F] border border-[#262930] mb-4">
                <TextInput
                  className="flex-1 text-white text-xs px-2"
                  placeholder="Add a quick note or update..."
                  placeholderTextColor="#64748B"
                  value={quickNote}
                  onChangeText={setQuickNote}
                />
                <Pressable
                  className={`w-8 h-8 rounded-lg bg-[#0084FF] items-center justify-center ${!quickNote.trim() ? 'opacity-50' : ''}`}
                  onPress={handleSendQuickNote}
                  disabled={!quickNote.trim() || addLeadNote.isPending}
                >
                  <Ionicons name="send" size={16} color="#FFFFFF" />
                </Pressable>
              </View>

              {activities.length === 0 ? (
                <View className="rounded-2xl p-6 items-center justify-center bg-[#181A1F] border border-dashed border-[#262930]">
                  <Ionicons name="time-outline" size={32} color="#64748B" />
                  <Text className="text-slate-400 text-xs mt-2 text-center">No activity history logged yet.</Text>
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
