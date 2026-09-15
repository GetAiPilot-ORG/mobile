import React, { useState } from 'react';
import {
  Text,
  View,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCrmDashboard } from '../hooks/useCrmDashboard';
import { useCreateLead } from '../hooks/useLeads';
import { useCreateDeal } from '../hooks/useDeals';
import { useCreateTask, useToggleTask } from '../hooks/useTasks';
import { CrmStatCard } from '../components/CrmStatCard';
import { LeadCard } from '../components/LeadCard';
import { TaskItem } from '../components/TaskItem';
import { ActivityTimelineItem } from '../components/ActivityTimelineItem';
import { CreateLeadModal } from '../components/CreateLeadModal';
import { CreateDealModal } from '../components/CreateDealModal';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { CrmHomeSkeleton } from '../../../components/skeletonScreen';

interface CRMHomeScreenProps {
  onNavigateTab?: (tabKey: string) => void;
  onSelectLead?: (leadId: string) => void;
  onSelectDeal?: (dealId: string) => void;
  onBack?: () => void;
}

export const CRMHomeScreen: React.FC<CRMHomeScreenProps> = ({
  onNavigateTab,
  onSelectLead,
  onSelectDeal,
  onBack,
}) => {
  const { data: dashboard, isLoading, isRefetching, refetch } = useCrmDashboard();

  const createLead = useCreateLead();
  const createDeal = useCreateDeal();
  const createTask = useCreateTask();
  const toggleTask = useToggleTask();

  const [showAddLead, setShowAddLead] = useState(false);
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);

  const stats = dashboard?.stats;
  const recentLeads = dashboard?.recentLeads || [];
  const upcomingTasks = dashboard?.upcomingTasks || [];
  const recentActivities = dashboard?.recentActivities || [];
  const pipelineSummary = dashboard?.pipelineSummary || [];

  return (
    <SafeAreaView className="flex-1 bg-[#0B0D10]" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-32"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#0084FF"
            colors={['#0084FF']}
          />
        }
      >
        {/* Top Header */}
        <View className="flex-row items-center justify-between py-4">
          <View className="flex-row items-center gap-2.5">
            {onBack ? (
              <Pressable
                className="p-1.5 rounded-lg bg-[#181A1F] border border-[#262930]"
                onPress={onBack}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Back"
              >
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              </Pressable>
            ) : null}
            <View>
              <Text className="text-white text-[22px] font-bold tracking-tight">CRM Workspace</Text>
              <Text className="text-slate-400 text-xs mt-0.5">Daily sales pipeline & customer actions</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            <Pressable
              className="flex-row items-center gap-1 bg-[#0084FF] px-3 py-2 rounded-xl"
              onPress={() => setShowAddLead(true)}
              hitSlop={6}
            >
              <Ionicons name="person-add" size={15} color="#FFFFFF" />
              <Text className="text-white text-xs font-semibold">Lead</Text>
            </Pressable>
            <Pressable
              className="flex-row items-center gap-1 bg-[#181A1F] border border-[#262930] px-2.5 py-2 rounded-xl"
              onPress={() => setShowAddTask(true)}
              hitSlop={6}
            >
              <Ionicons name="checkbox-outline" size={15} color="#94A3B8" />
              <Text className="text-slate-300 text-xs font-medium">Task</Text>
            </Pressable>
          </View>
        </View>

        {isLoading && !dashboard ? (
          <CrmHomeSkeleton />
        ) : (
          <>
            {/* KPI Stat Cards Grid */}
            <View className="gap-3 mb-6">
              <View className="flex-row gap-3">
                <CrmStatCard
                  label="Total Leads"
                  value={stats?.totalLeads ?? 0}
                  sub={`+${stats?.newContactsThisMonth ?? 0} this mo`}
                  icon="people"
                  gradientColors={['#181A1F', '#111317']}
                  onPress={() => onNavigateTab?.('leads')}
                />
                <CrmStatCard
                  label="Open Deals"
                  value={stats?.openDeals ?? 0}
                  sub={`₹${Number(stats?.totalDealValue || 0).toLocaleString()}`}
                  icon="briefcase"
                  gradientColors={['#181A1F', '#111317']}
                  onPress={() => onNavigateTab?.('pipeline')}
                />
              </View>

              <View className="flex-row gap-3">
                <CrmStatCard
                  label="Tasks Due"
                  value={stats?.tasksDueToday ?? 0}
                  sub={stats?.overdueTasks ? `${stats.overdueTasks} overdue` : 'Up to date'}
                  icon="checkbox"
                  gradientColors={['#181A1F', '#111317']}
                  onPress={() => onNavigateTab?.('tasks')}
                />
                <CrmStatCard
                  label="Won Deals"
                  value={stats?.wonDealsThisMonth ?? 0}
                  sub={`₹${Number(stats?.wonDealValueThisMonth || 0).toLocaleString()}`}
                  icon="trophy"
                  gradientColors={['#181A1F', '#111317']}
                  onPress={() => onNavigateTab?.('pipeline')}
                />
              </View>
            </View>

            {/* Pipeline Stage Distribution Overview */}
            <View className="mb-7">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-white text-base font-bold tracking-tight">Pipeline Distribution</Text>
                <Pressable onPress={() => onNavigateTab?.('pipeline')}>
                  <Text className="text-[#0084FF] text-xs font-semibold">View All Deals</Text>
                </Pressable>
              </View>

              <View className="flex-row h-1.5 rounded-full overflow-hidden mb-2.5 bg-[#262930]">
                {pipelineSummary.map((p) => {
                  const total = pipelineSummary.reduce((acc, curr) => acc + curr.count, 0) || 1;
                  const widthPct = Math.max((p.count / total) * 100, p.count > 0 ? 8 : 0);
                  if (widthPct === 0) return null;
                  return (
                    <View
                      key={p.stage}
                      className="h-full"
                      style={{ width: `${widthPct}%`, backgroundColor: p.color }}
                    />
                  );
                })}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                {pipelineSummary.map((p) => (
                  <View key={p.stage} className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-lg mr-2 bg-[#181A1F] border border-[#262930]">
                    <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                    <Text className="text-slate-400 text-[11px]">{p.label}</Text>
                    <Text className="text-white text-[11px] font-bold">{p.count}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Urgent / Upcoming Tasks Section */}
            <View className="mb-7">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="checkbox-outline" size={16} color="#0084FF" />
                  <Text className="text-white text-base font-bold tracking-tight">Tasks Requiring Attention</Text>
                </View>
                <Pressable onPress={() => onNavigateTab?.('tasks')}>
                  <Text className="text-[#0084FF] text-xs font-semibold">See All</Text>
                </Pressable>
              </View>

              {upcomingTasks.length === 0 ? (
                <View className="rounded-2xl p-6 items-center justify-center bg-[#181A1F] border border-dashed border-[#262930]">
                  <Ionicons name="checkmark-circle-outline" size={32} color="#10B981" />
                  <Text className="text-white text-[15px] font-semibold mt-2">All caught up!</Text>
                  <Text className="text-slate-400 text-xs text-center mt-1 mb-4 max-w-[240px]">No pending tasks or follow-ups scheduled for today.</Text>
                  <Pressable className="px-3.5 py-2 rounded-xl bg-[#262930]" onPress={() => setShowAddTask(true)}>
                    <Text className="text-[#0084FF] text-xs font-semibold">+ Create Task</Text>
                  </Pressable>
                </View>
              ) : (
                upcomingTasks.map((t) => (
                  <TaskItem
                    key={t.id}
                    task={t}
                    onToggle={(done) => toggleTask.mutate({ id: t.id, done })}
                    onPress={() => onNavigateTab?.('tasks')}
                  />
                ))
              )}
            </View>

            {/* Recent Leads Activity Section */}
            <View className="mb-7">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="people-outline" size={16} color="#0084FF" />
                  <Text className="text-white text-base font-bold tracking-tight">Recent Leads Added</Text>
                </View>
                <Pressable onPress={() => onNavigateTab?.('leads')}>
                  <Text className="text-[#0084FF] text-xs font-semibold">View Directory</Text>
                </Pressable>
              </View>

              {recentLeads.length === 0 ? (
                <View className="rounded-2xl p-6 items-center justify-center bg-[#181A1F] border border-dashed border-[#262930]">
                  <Ionicons name="people-outline" size={32} color="#64748B" />
                  <Text className="text-white text-[15px] font-semibold mt-2">No leads yet</Text>
                  <Text className="text-slate-400 text-xs text-center mt-1 mb-4 max-w-[240px]">Add your first prospect or link WhatsApp contacts to build pipeline.</Text>
                  <Pressable className="px-3.5 py-2 rounded-xl bg-[#262930]" onPress={() => setShowAddLead(true)}>
                    <Text className="text-[#0084FF] text-xs font-semibold">+ Add New Lead</Text>
                  </Pressable>
                </View>
              ) : (
                recentLeads.slice(0, 4).map((l) => (
                  <LeadCard
                    key={l.id}
                    lead={l}
                    onPress={() => onSelectLead?.(l.id)}
                  />
                ))
              )}
            </View>

            {/* Recent Activities Feed */}
            <View className="mb-7">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="pulse-outline" size={16} color="#0084FF" />
                  <Text className="text-white text-base font-bold tracking-tight">Live Customer Touchpoints</Text>
                </View>
                <Pressable onPress={() => onNavigateTab?.('activities')}>
                  <Text className="text-[#0084FF] text-xs font-semibold">Full History</Text>
                </Pressable>
              </View>

              {recentActivities.length === 0 ? (
                <View className="rounded-2xl p-6 items-center justify-center bg-[#181A1F] border border-dashed border-[#262930]">
                  <Ionicons name="time-outline" size={32} color="#64748B" />
                  <Text className="text-white text-[15px] font-semibold mt-2">No logged activities</Text>
                  <Text className="text-slate-400 text-xs text-center mt-1">Logged calls, meeting notes & messages will stream here.</Text>
                </View>
              ) : (
                <View className="rounded-2xl p-4 bg-[#181A1F] border border-[#262930]">
                  {recentActivities.slice(0, 5).map((act, index) => (
                    <ActivityTimelineItem
                      key={act.id}
                      activity={act}
                      isLast={index === Math.min(recentActivities.length, 5) - 1}
                    />
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Modals */}
      <CreateLeadModal
        visible={showAddLead}
        onClose={() => setShowAddLead(false)}
        onSubmit={async (data) => {
          await createLead.mutateAsync(data);
          setShowAddLead(false);
        }}
        isLoading={createLead.isPending}
      />

      <CreateDealModal
        visible={showAddDeal}
        onClose={() => setShowAddDeal(false)}
        onSubmit={async (data) => {
          await createDeal.mutateAsync(data);
          setShowAddDeal(false);
        }}
        isLoading={createDeal.isPending}
      />

      <CreateTaskModal
        visible={showAddTask}
        onClose={() => setShowAddTask(false)}
        onSubmit={async (data) => {
          await createTask.mutateAsync(data);
          setShowAddTask(false);
        }}
        isLoading={createTask.isPending}
      />
    </SafeAreaView>
  );
};
