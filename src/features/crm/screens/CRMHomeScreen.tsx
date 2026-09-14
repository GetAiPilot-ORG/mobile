import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  useColorScheme,
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#0F1015' : '#F8FAFC' }]} edges={['top']}>
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
            <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>CRM Workspace</Text>
            <Text style={[styles.headerSubtitle, { color: isDark ? '#9CA3AF' : '#64748B' }]}>Daily sales pipeline & customer actions</Text>
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
              style={[styles.secondaryActionBtn, isDark ? styles.secondaryActionBtnDark : styles.secondaryActionBtnLight]}
              onPress={() => setShowAddTask(true)}
              hitSlop={6}
            >
              <Ionicons name="checkbox-outline" size={15} color={isDark ? '#D1D5DB' : '#334155'} />
              <Text style={[styles.secondaryActionText, { color: isDark ? '#D1D5DB' : '#334155' }]}>Task</Text>
            </Pressable>
          </View>
        </View>

        {isLoading && !dashboard ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={[styles.loaderText, { color: isDark ? '#9CA3AF' : '#64748B' }]}>Loading live CRM metrics...</Text>
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
                  gradientColors={isDark ? ['#1E293B', '#0F172A'] : ['#2563EB', '#1D4ED8']}
                  onPress={() => onNavigateTab?.('leads')}
                />
                <CrmStatCard
                  label="Open Deals"
                  value={stats?.openDeals ?? 0}
                  sub={`₹${Number(stats?.totalDealValue || 0).toLocaleString()}`}
                  icon="briefcase"
                  gradientColors={isDark ? ['#1E1B4B', '#0F172A'] : ['#7C3AED', '#6D28D9']}
                  onPress={() => onNavigateTab?.('pipeline')}
                />
              </View>

              <View style={styles.statsRow}>
                <CrmStatCard
                  label="Tasks Due"
                  value={stats?.tasksDueToday ?? 0}
                  sub={stats?.overdueTasks ? `${stats.overdueTasks} overdue` : 'Up to date'}
                  icon="checkbox"
                  gradientColors={isDark ? ['#1C1917', '#0F172A'] : ['#D97706', '#B45309']}
                  onPress={() => onNavigateTab?.('tasks')}
                />
                <CrmStatCard
                  label="Won Deals"
                  value={stats?.wonDealsThisMonth ?? 0}
                  sub={`₹${Number(stats?.wonDealValueThisMonth || 0).toLocaleString()}`}
                  icon="trophy"
                  gradientColors={isDark ? ['#064E3B', '#0F172A'] : ['#059669', '#047857']}
                  onPress={() => onNavigateTab?.('pipeline')}
                />
              </View>
            </View>

            {/* Pipeline Stage Distribution Overview */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Pipeline Distribution</Text>
                <Pressable onPress={() => onNavigateTab?.('pipeline')}>
                  <Text style={styles.sectionLink}>View All Deals</Text>
                </Pressable>
              </View>

              <View style={[styles.pipelineBar, { backgroundColor: isDark ? '#262A34' : '#E2E8F0' }]}>
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
                  <View key={p.stage} style={[styles.stagePill, isDark ? styles.stagePillDark : styles.stagePillLight]}>
                    <View style={[styles.stageDot, { backgroundColor: p.color }]} />
                    <Text style={[styles.stageName, { color: isDark ? '#9CA3AF' : '#64748B' }]}>{p.label}</Text>
                    <Text style={[styles.stageCount, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>{p.count}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Urgent / Upcoming Tasks Section */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="checkbox-outline" size={16} color="#3B82F6" />
                  <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Tasks Requiring Attention</Text>
                </View>
                <Pressable onPress={() => onNavigateTab?.('tasks')}>
                  <Text style={styles.sectionLink}>See All</Text>
                </Pressable>
              </View>

              {upcomingTasks.length === 0 ? (
                <View style={[styles.emptyCard, isDark ? styles.cardDark : styles.cardLight]}>
                  <Ionicons name="checkmark-circle-outline" size={32} color="#10B981" />
                  <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>All caught up!</Text>
                  <Text style={[styles.emptySubtitle, { color: isDark ? '#9CA3AF' : '#64748B' }]}>No pending tasks or follow-ups scheduled for today.</Text>
                  <Pressable style={[styles.emptyBtn, isDark ? styles.emptyBtnDark : styles.emptyBtnLight]} onPress={() => setShowAddTask(true)}>
                    <Text style={styles.emptyBtnText}>+ Create Task</Text>
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
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="people-outline" size={16} color="#3B82F6" />
                  <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Recent Leads Added</Text>
                </View>
                <Pressable onPress={() => onNavigateTab?.('leads')}>
                  <Text style={styles.sectionLink}>View Directory</Text>
                </Pressable>
              </View>

              {recentLeads.length === 0 ? (
                <View style={[styles.emptyCard, isDark ? styles.cardDark : styles.cardLight]}>
                  <Ionicons name="people-outline" size={32} color="#6B7280" />
                  <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>No leads yet</Text>
                  <Text style={[styles.emptySubtitle, { color: isDark ? '#9CA3AF' : '#64748B' }]}>Add your first prospect or link WhatsApp contacts to build pipeline.</Text>
                  <Pressable style={[styles.emptyBtn, isDark ? styles.emptyBtnDark : styles.emptyBtnLight]} onPress={() => setShowAddLead(true)}>
                    <Text style={styles.emptyBtnText}>+ Add New Lead</Text>
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
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="pulse-outline" size={16} color="#3B82F6" />
                  <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Live Customer Touchpoints</Text>
                </View>
                <Pressable onPress={() => onNavigateTab?.('activities')}>
                  <Text style={styles.sectionLink}>Full History</Text>
                </Pressable>
              </View>

              {recentActivities.length === 0 ? (
                <View style={[styles.emptyCard, isDark ? styles.cardDark : styles.cardLight]}>
                  <Ionicons name="time-outline" size={32} color="#6B7280" />
                  <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>No logged activities</Text>
                  <Text style={[styles.emptySubtitle, { color: isDark ? '#9CA3AF' : '#64748B' }]}>Logged calls, meeting notes & messages will stream here.</Text>
                </View>
              ) : (
                <View style={[styles.activitiesCard, isDark ? styles.activitiesCardDark : styles.activitiesCardLight]}>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 130,
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
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
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
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  secondaryActionBtnDark: {
    backgroundColor: '#262A34',
    borderColor: '#334155',
  },
  secondaryActionBtnLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  loaderBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loaderText: {
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
  },
  stagePillDark: {
    backgroundColor: '#181A20',
    borderColor: '#262A34',
  },
  stagePillLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  stageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stageName: {
    fontSize: 11,
  },
  stageCount: {
    fontSize: 11,
    fontWeight: '700',
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
  emptyCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    maxWidth: 240,
  },
  emptyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyBtnDark: {
    backgroundColor: '#262A34',
  },
  emptyBtnLight: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  emptyBtnText: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '600',
  },
  activitiesCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  activitiesCardDark: {
    backgroundColor: '#181A20',
    borderColor: '#262A34',
  },
  activitiesCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
});
