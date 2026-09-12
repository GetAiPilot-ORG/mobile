import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
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

interface CRMHomeScreenProps {
  onNavigateTab?: (tabKey: string) => void;
  onSelectLead?: (leadId: string) => void;
  onSelectDeal?: (dealId: string) => void;
}

export const CRMHomeScreen: React.FC<CRMHomeScreenProps> = ({
  onNavigateTab,
  onSelectLead,
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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#3B82F6"
            colors={['#3B82F6']}
          />
        }
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>CRM Workspace</Text>
            <Text style={styles.headerSubtitle}>Daily sales pipeline & customer actions</Text>
          </View>

          <View style={styles.quickActionRow}>
            <Pressable
              style={styles.primaryActionBtn}
              onPress={() => setShowAddLead(true)}
              hitSlop={6}
            >
              <Ionicons name="person-add" size={15} color="#FFFFFF" />
              <Text style={styles.primaryActionText}>Lead</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryActionBtn}
              onPress={() => setShowAddTask(true)}
              hitSlop={6}
            >
              <Ionicons name="checkbox-outline" size={15} color="#D1D5DB" />
              <Text style={styles.secondaryActionText}>Task</Text>
            </Pressable>
          </View>
        </View>

        {isLoading && !dashboard ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loaderText}>Loading live CRM metrics...</Text>
          </View>
        ) : (
          <>
            {/* KPI Stat Cards Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statsRow}>
                <CrmStatCard
                  label="Total Leads"
                  value={stats?.totalLeads ?? 0}
                  sub={`+${stats?.newContactsThisMonth ?? 0} this mo`}
                  icon="people"
                  gradientColors={['#1E293B', '#0F172A']}
                  onPress={() => onNavigateTab?.('leads')}
                />
                <CrmStatCard
                  label="Open Deals"
                  value={stats?.openDeals ?? 0}
                  sub={`₹${Number(stats?.totalDealValue || 0).toLocaleString()}`}
                  icon="briefcase"
                  gradientColors={['#1E1B4B', '#0F172A']}
                  onPress={() => onNavigateTab?.('pipeline')}
                />
              </View>

              <View style={styles.statsRow}>
                <CrmStatCard
                  label="Tasks Due"
                  value={stats?.tasksDueToday ?? 0}
                  sub={stats?.overdueTasks ? `${stats.overdueTasks} overdue` : 'Up to date'}
                  icon="checkbox"
                  gradientColors={['#1C1917', '#0F172A']}
                  onPress={() => onNavigateTab?.('tasks')}
                />
                <CrmStatCard
                  label="Won Deals"
                  value={stats?.wonDealsThisMonth ?? 0}
                  sub={`₹${Number(stats?.wonDealValueThisMonth || 0).toLocaleString()}`}
                  icon="trophy"
                  gradientColors={['#064E3B', '#0F172A']}
                  onPress={() => onNavigateTab?.('pipeline')}
                />
              </View>
            </View>

            {/* Pipeline Stage Distribution Overview */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Pipeline Distribution</Text>
                <Pressable onPress={() => onNavigateTab?.('pipeline')}>
                  <Text style={styles.sectionLink}>View All Deals</Text>
                </Pressable>
              </View>

              <View style={styles.pipelineBar}>
                {pipelineSummary.map((p) => {
                  const total = pipelineSummary.reduce((acc, curr) => acc + curr.count, 0) || 1;
                  const widthPct = Math.max((p.count / total) * 100, p.count > 0 ? 8 : 0);
                  if (widthPct === 0) return null;
                  return (
                    <View
                      key={p.stage}
                      style={[styles.pipelineSegment, { width: `${widthPct}%`, backgroundColor: p.color }]}
                    />
                  );
                })}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stageScroll}>
                {pipelineSummary.map((p) => (
                  <View key={p.stage} style={styles.stagePill}>
                    <View style={[styles.stageDot, { backgroundColor: p.color }]} />
                    <Text style={styles.stageName}>{p.label}</Text>
                    <Text style={styles.stageCount}>{p.count}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Urgent / Upcoming Tasks Section */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="checkbox-outline" size={16} color="#3B82F6" />
                  <Text style={styles.sectionTitle}>Tasks Requiring Attention</Text>
                </View>
                <Pressable onPress={() => onNavigateTab?.('tasks')}>
                  <Text style={styles.sectionLink}>See All</Text>
                </Pressable>
              </View>

              {upcomingTasks.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="checkmark-circle-outline" size={32} color="#10B981" />
                  <Text style={styles.emptyTitle}>All caught up!</Text>
                  <Text style={styles.emptySubtitle}>No pending tasks or follow-ups scheduled for today.</Text>
                  <Pressable style={styles.emptyBtn} onPress={() => setShowAddTask(true)}>
                    <Text style={styles.emptyBtnText}>+ Create Task</Text>
                  </Pressable>
                </View>
              ) : (
                upcomingTasks.map((t) => (
                  <TaskItem
                    key={t.id}
                    task={t}
                    onToggle={(done) => toggleTask.mutate({ id: t.id, done })}
                  />
                ))
              )}
            </View>

            {/* Recent Leads */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="person-add-outline" size={16} color="#3B82F6" />
                  <Text style={styles.sectionTitle}>Recent Leads</Text>
                </View>
                <Pressable onPress={() => onNavigateTab?.('leads')}>
                  <Text style={styles.sectionLink}>View All Leads</Text>
                </Pressable>
              </View>

              {recentLeads.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="people-outline" size={32} color="#6B7280" />
                  <Text style={styles.emptyTitle}>No leads yet</Text>
                  <Text style={styles.emptySubtitle}>Add your first lead to begin tracking qualifications.</Text>
                  <Pressable style={styles.emptyBtn} onPress={() => setShowAddLead(true)}>
                    <Text style={styles.emptyBtnText}>+ Add First Lead</Text>
                  </Pressable>
                </View>
              ) : (
                recentLeads.map((l) => (
                  <LeadCard
                    key={l.id}
                    lead={l}
                    onPress={() => onSelectLead?.(l.id)}
                  />
                ))
              )}
            </View>

            {/* Recent Activity Stream */}
            {recentActivities.length > 0 ? (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="time-outline" size={16} color="#3B82F6" />
                    <Text style={styles.sectionTitle}>Recent CRM Activity</Text>
                  </View>
                  <Pressable onPress={() => onNavigateTab?.('more')}>
                    <Text style={styles.sectionLink}>Full Stream</Text>
                  </Pressable>
                </View>

                {recentActivities.map((act, index) => (
                  <ActivityTimelineItem
                    key={act.id}
                    activity={act}
                    isLast={index === recentActivities.length - 1}
                  />
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      {/* Modals */}
      <CreateLeadModal
        visible={showAddLead}
        onClose={() => setShowAddLead(false)}
        onSubmit={async (lead) => {
          await createLead.mutateAsync(lead);
        }}
        isLoading={createLead.isPending}
      />

      <CreateDealModal
        visible={showAddDeal}
        onClose={() => setShowAddDeal(false)}
        onSubmit={async (deal) => {
          await createDeal.mutateAsync(deal);
        }}
        isLoading={createDeal.isPending}
      />

      <CreateTaskModal
        visible={showAddTask}
        onClose={() => setShowAddTask(false)}
        onSubmit={async (task) => {
          await createTask.mutateAsync(task);
        }}
        isLoading={createTask.isPending}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F1015',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  quickActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#262A34',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  secondaryActionText: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '500',
  },
  loaderBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loaderText: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 12,
  },
  statsGrid: {
    gap: 12,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sectionBlock: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionLink: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '600',
  },
  pipelineBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#262A34',
    overflow: 'hidden',
    marginBottom: 10,
  },
  pipelineSegment: {
    height: '100%',
  },
  stageScroll: {
    flexDirection: 'row',
  },
  stagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#181A20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#262A34',
  },
  stageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stageName: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  stageCount: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#181A20',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#262A34',
    borderStyle: 'dashed',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
  },
  emptySubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    maxWidth: 240,
  },
  emptyBtn: {
    backgroundColor: '#262A34',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyBtnText: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '600',
  },
});
