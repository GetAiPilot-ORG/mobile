import {
  Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React,
  { useState } from "react";
import {
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CrmHomeSkeleton } from "../../../components/skeletonScreen";
import { ActivityTimelineItem } from "../components/ActivityTimelineItem";
import { CreateDealModal } from "../components/CreateDealModal";
import { CreateLeadModal } from "../components/CreateLeadModal";
import { CreateTaskModal } from "../components/CreateTaskModal";
import { CrmStatCard } from "../components/CrmStatCard";
import { LeadCard } from "../components/LeadCard";
import { useCrmDashboard } from "../hooks/useCrmDashboard";
import { useCreateDeal } from "../hooks/useDeals";
import { useCreateLead } from "../hooks/useLeads";
import { useCreateTask, useToggleTask } from "../hooks/useTasks";
import { CRMTask } from "../types";
import { useTheme, getColors } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface CRMHomeScreenProps {
  onNavigateTab?: (tabKey: string) => void;
  onSelectLead?: (leadId: string) => void;
  onSelectDeal?: (dealId: string) => void;
  onBack?: () => void;
}

function formatCurrency(val: number): string {
  if (!val || isNaN(val)) return "₹0";
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
  return `₹${val.toLocaleString()}`;
}

export const CRMHomeScreen: React.FC<CRMHomeScreenProps> = ({
  onNavigateTab,
  onSelectLead,
  onSelectDeal,
  onBack,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const {
    data: dashboard,
    isLoading,
    isRefetching,
    refetch,
  } = useCrmDashboard();

  const createLead = useCreateLead();
  const createDeal = useCreateDeal();
  const createTask = useCreateTask();
  const toggleTask = useToggleTask();

  const [showAddLead, setShowAddLead] = useState(false);
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [fabExpanded, setFabExpanded] = useState(false);

  const stats = dashboard?.stats;
  const recentLeads = dashboard?.recentLeads || [];
  const upcomingTasks = dashboard?.upcomingTasks || [];
  const recentActivities = dashboard?.recentActivities || [];
  const pipelineSummary = dashboard?.pipelineSummary || [];

  const handleToggleFab = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    setFabExpanded((prev) => !prev);
  };

  const handleTaskToggle = (task: CRMTask) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
    const isDone = task.status === "done";
    toggleTask.mutate({ id: task.id, done: !isDone });
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? "#0F1015" : "#F8FAFC" },
      ]}
      edges={["top"]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#3B82F6"
            colors={["#3B82F6"]}
          />
        }
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              flex: 1,
            }}
          >
            {onBack ? (
              <Pressable
                style={[
                  styles.backBtn,
                  { backgroundColor: isDark ? "#1E2028" : "#F1F5F9" },
                ]}
                onPress={onBack}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Back"
              >
                <Ionicons
                  name="arrow-back"
                  size={20}
                  color={isDark ? "#FFFFFF" : "#0F172A"}
                />
              </Pressable>
            ) : null}
            <View style={{ flex: 1 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Text
                  style={[
                    styles.headerTitle,
                    { color: isDark ? "#FFFFFF" : "#0F172A" },
                  ]}
                >
                  CRM Workspace
                </Text>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                </View>
              </View>
              <Text
                style={[
                  styles.headerSubtitle,
                  { color: isDark ? "#9CA3AF" : "#64748B" },
                ]}
                numberOfLines={1}
              >
                Pipeline, sales intelligence & customer actions
              </Text>
            </View>
          </View>

          {/* Quick Header Action Buttons */}
          <View style={styles.quickActionRow}>
            <Pressable
              style={styles.primaryActionBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                  () => { },
                );
                setShowAddLead(true);
              }}
              hitSlop={6}
            >
              <Ionicons name="person-add" size={14} color="#FFFFFF" />
              <Text style={styles.primaryActionText}>Lead</Text>
            </Pressable>
            <Pressable
              style={[
                styles.secondaryActionBtn,
                isDark
                  ? styles.secondaryActionBtnDark
                  : styles.secondaryActionBtnLight,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                  () => { },
                );
                setShowAddTask(true);
              }}
              hitSlop={6}
            >
              <Ionicons
                name="checkbox-outline"
                size={14}
                color={isDark ? "#D1D5DB" : "#334155"}
              />
              <Text
                style={[
                  styles.secondaryActionText,
                  { color: isDark ? "#D1D5DB" : "#334155" },
                ]}
              >
                Task
              </Text>
            </Pressable>
          </View>
        </View>

        {isLoading && !dashboard ? (
          <CrmHomeSkeleton />
        ) : (
          <>
            {/* KPI Stat Cards Grid (2x2) */}
            <View style={styles.statsGrid}>
              <View style={styles.statsRow}>
                <CrmStatCard
                  label="Pipeline Revenue"
                  value={formatCurrency(Number(stats?.totalDealValue || 0))}
                  sub={`${stats?.openDeals ?? 0} active deals`}
                  icon="wallet-outline"
                  gradientColors={
                    isDark ? ["#1E293B", "#0F172A"] : ["#2563EB", "#1D4ED8"]
                  }
                  trend="+14% mo"
                  onPress={() => onNavigateTab?.("pipeline")}
                />
                <CrmStatCard
                  label="Deals Won"
                  value={stats?.wonDealsThisMonth ?? 0}
                  sub={`${formatCurrency(Number(stats?.wonDealValueThisMonth || 0))} booked`}
                  icon="trophy-outline"
                  gradientColors={
                    isDark ? ["#064E3B", "#0F172A"] : ["#059669", "#047857"]
                  }
                  trend="68% Win"
                  progress={0.68}
                  onPress={() => onNavigateTab?.("pipeline")}
                />
              </View>

              <View style={styles.statsRow}>
                <CrmStatCard
                  label="Tasks Due"
                  value={stats?.tasksDueToday ?? 0}
                  sub={
                    stats?.overdueTasks
                      ? `${stats.overdueTasks} overdue`
                      : "On track"
                  }
                  icon="checkbox-outline"
                  gradientColors={
                    isDark ? ["#291807", "#140E04"] : ["#D97706", "#B45309"]
                  }
                  trend={stats?.overdueTasks ? "! urgent" : "Healthy"}
                  onPress={() => onNavigateTab?.("tasks")}
                />
                <CrmStatCard
                  label="Active Leads"
                  value={stats?.totalLeads ?? 0}
                  sub={`+${stats?.newContactsThisMonth ?? 0} added this mo`}
                  icon="people-outline"
                  gradientColors={
                    isDark ? ["#1E1B4B", "#0F172A"] : ["#7C3AED", "#6D28D9"]
                  }
                  trend="Qualified"
                  onPress={() => onNavigateTab?.("leads")}
                />
              </View>
            </View>

            {/* Pipeline Stage Distribution Overview */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons
                    name="git-commit-outline"
                    size={16}
                    color="#3B82F6"
                  />
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: isDark ? "#FFFFFF" : "#0F172A" },
                    ]}
                  >
                    Pipeline Distribution
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(
                      Haptics.ImpactFeedbackStyle.Light,
                    ).catch(() => { });
                    onNavigateTab?.("pipeline");
                  }}
                >
                  <Text style={styles.sectionLink}>View Board →</Text>
                </Pressable>
              </View>

              {/* Segmented Distribution Bar */}
              <View
                style={[
                  styles.pipelineBar,
                  { backgroundColor: isDark ? "#262A34" : "#E2E8F0" },
                ]}
              >
                {pipelineSummary.map((p) => {
                  const total =
                    pipelineSummary.reduce(
                      (acc, curr) => acc + curr.count,
                      0,
                    ) || 1;
                  const widthPct = Math.max(
                    (p.count / total) * 100,
                    p.count > 0 ? 8 : 0,
                  );
                  if (widthPct === 0) return null;
                  return (
                    <View
                      key={p.stage}
                      style={[
                        styles.pipelineSegment,
                        { width: `${widthPct}%`, backgroundColor: p.color },
                      ]}
                    />
                  );
                })}
              </View>

              {/* Horizontal Stage Pills with Counts */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.stageScroll}
                contentContainerStyle={{ gap: 8 }}
              >
                {pipelineSummary.map((p) => (
                  <Pressable
                    key={p.stage}
                    style={[
                      styles.stagePill,
                      isDark ? styles.stagePillDark : styles.stagePillLight,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(
                        Haptics.ImpactFeedbackStyle.Light,
                      ).catch(() => { });
                      onNavigateTab?.("pipeline");
                    }}
                  >
                    <View
                      style={[styles.stageDot, { backgroundColor: p.color }]}
                    />
                    <Text
                      style={[
                        styles.stageName,
                        { color: isDark ? "#9CA3AF" : "#64748B" },
                      ]}
                    >
                      {p.label}
                    </Text>
                    <View
                      style={[
                        styles.stageCountBadge,
                        {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(0,0,0,0.05)",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.stageCount,
                          { color: isDark ? "#FFFFFF" : "#0F172A" },
                        ]}
                      >
                        {p.count}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Today's Priority Follow-ups (Horizontal Card Carousel) */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="time-outline" size={16} color="#F59E0B" />
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: isDark ? "#FFFFFF" : "#0F172A" },
                    ]}
                  >
                    Today's Priority Follow-ups
                  </Text>
                  {upcomingTasks.length > 0 && (
                    <View style={styles.badgeCount}>
                      <Text style={styles.badgeCountText}>
                        {upcomingTasks.length}
                      </Text>
                    </View>
                  )}
                </View>
                <Pressable onPress={() => onNavigateTab?.("tasks")}>
                  <Text style={styles.sectionLink}>All Tasks</Text>
                </Pressable>
              </View>

              {upcomingTasks.length === 0 ? (
                <View
                  style={[
                    styles.emptyCard,
                    isDark ? styles.cardDark : styles.cardLight,
                  ]}
                >
                  <View style={styles.emptyIconCircle}>
                    <Ionicons name="checkmark-done" size={24} color="#10B981" />
                  </View>
                  <Text
                    style={[
                      styles.emptyTitle,
                      { color: isDark ? "#FFFFFF" : "#0F172A" },
                    ]}
                  >
                    All caught up for today!
                  </Text>
                  <Text
                    style={[
                      styles.emptySubtitle,
                      { color: isDark ? "#9CA3AF" : "#64748B" },
                    ]}
                  >
                    No overdue tasks or urgent customer follow-ups pending.
                  </Text>
                  <Pressable
                    style={[
                      styles.emptyBtn,
                      isDark ? styles.emptyBtnDark : styles.emptyBtnLight,
                    ]}
                    onPress={() => setShowAddTask(true)}
                  >
                    <Text style={styles.emptyBtnText}>
                      + Schedule Follow-up
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.taskCarouselContent}
                >
                  {upcomingTasks.map((task) => {
                    const isDone = task.status === "done";
                    const isOverdue =
                      !isDone &&
                      task.due_date &&
                      new Date(task.due_date) < new Date();
                    return (
                      <View
                        key={task.id}
                        style={[
                          styles.followupCard,
                          isDark ? styles.cardDark : styles.cardLight,
                        ]}
                      >
                        <View style={styles.followupTopRow}>
                          <View
                            style={[
                              styles.dueChip,
                              {
                                backgroundColor: isOverdue
                                  ? "rgba(239, 68, 68, 0.15)"
                                  : isDark
                                    ? "rgba(245, 158, 11, 0.15)"
                                    : "#FEF3C7",
                              },
                            ]}
                          >
                            <Ionicons
                              name={isOverdue ? "alert-circle" : "time"}
                              size={12}
                              color={isOverdue ? "#EF4444" : "#D97706"}
                            />
                            <Text
                              style={[
                                styles.dueChipText,
                                { color: isOverdue ? "#EF4444" : "#D97706" },
                              ]}
                            >
                              {isOverdue ? "Overdue" : "Due Today"}
                            </Text>
                          </View>

                          <Pressable
                            style={styles.taskCheckBtn}
                            onPress={() => handleTaskToggle(task)}
                            hitSlop={8}
                          >
                            <Ionicons
                              name={
                                isDone ? "checkmark-circle" : "ellipse-outline"
                              }
                              size={22}
                              color={
                                isDone
                                  ? "#10B981"
                                  : isDark
                                    ? "#6B7280"
                                    : "#94A3B8"
                              }
                            />
                          </Pressable>
                        </View>

                        <Text
                          style={[
                            styles.followupTitle,
                            { color: isDark ? "#FFFFFF" : "#0F172A" },
                            isDone && styles.taskTitleCompleted,
                          ]}
                          numberOfLines={2}
                        >
                          {task.title}
                        </Text>

                        {task.contact ? (
                          <View style={styles.followupContactRow}>
                            <Ionicons
                              name="person-circle-outline"
                              size={14}
                              color={isDark ? "#9CA3AF" : "#64748B"}
                            />
                            <Text
                              style={[
                                styles.followupContactName,
                                { color: isDark ? "#9CA3AF" : "#64748B" },
                              ]}
                              numberOfLines={1}
                            >
                              {task.contact.first_name} {task.contact.last_name}
                            </Text>
                          </View>
                        ) : null}

                        <View style={styles.followupFooter}>
                          <View
                            style={[
                              styles.priorityBadge,
                              task.priority === "urgent"
                                ? { backgroundColor: "rgba(239, 68, 68, 0.15)" }
                                : {
                                  backgroundColor: isDark
                                    ? "#262A34"
                                    : "#F1F5F9",
                                },
                            ]}
                          >
                            <Text
                              style={[
                                styles.priorityBadgeText,
                                {
                                  color:
                                    task.priority === "urgent"
                                      ? "#EF4444"
                                      : isDark
                                        ? "#9CA3AF"
                                        : "#64748B",
                                },
                              ]}
                            >
                              {(task.priority || "normal").toUpperCase()}
                            </Text>
                          </View>

                          <Pressable
                            style={styles.followupActionBtn}
                            onPress={() => onNavigateTab?.("tasks")}
                          >
                            <Text style={styles.followupActionText}>
                              View Details →
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* Recent Leads with Quick Touchpoints */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="people-outline" size={16} color="#3B82F6" />
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: isDark ? "#FFFFFF" : "#0F172A" },
                    ]}
                  >
                    Recent Active Leads
                  </Text>
                </View>
                <Pressable onPress={() => onNavigateTab?.("leads")}>
                  <Text style={styles.sectionLink}>
                    View All ({stats?.totalLeads ?? recentLeads.length})
                  </Text>
                </Pressable>
              </View>

              {recentLeads.length === 0 ? (
                <View
                  style={[
                    styles.emptyCard,
                    isDark ? styles.cardDark : styles.cardLight,
                  ]}
                >
                  <Ionicons name="people-outline" size={32} color="#6B7280" />
                  <Text
                    style={[
                      styles.emptyTitle,
                      { color: isDark ? "#FFFFFF" : "#0F172A" },
                    ]}
                  >
                    No leads yet
                  </Text>
                  <Text
                    style={[
                      styles.emptySubtitle,
                      { color: isDark ? "#9CA3AF" : "#64748B" },
                    ]}
                  >
                    Add your first prospect or link WhatsApp contacts to build
                    your sales pipeline.
                  </Text>
                  <Pressable
                    style={[
                      styles.emptyBtn,
                      isDark ? styles.emptyBtnDark : styles.emptyBtnLight,
                    ]}
                    onPress={() => setShowAddLead(true)}
                  >
                    <Text style={styles.emptyBtnText}>+ Add New Lead</Text>
                  </Pressable>
                </View>
              ) : (
                recentLeads
                  .slice(0, 4)
                  .map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onPress={() => onSelectLead?.(lead.id)}
                    />
                  ))
              )}
            </View>

            {/* Live Customer Touchpoints Feed */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="pulse-outline" size={16} color="#10B981" />
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: isDark ? "#FFFFFF" : "#0F172A" },
                    ]}
                  >
                    Live Touchpoints & History
                  </Text>
                </View>
                <Pressable onPress={() => onNavigateTab?.("activities")}>
                  <Text style={styles.sectionLink}>Full Stream</Text>
                </Pressable>
              </View>

              {recentActivities.length === 0 ? (
                <View
                  style={[
                    styles.emptyCard,
                    isDark ? styles.cardDark : styles.cardLight,
                  ]}
                >
                  <Ionicons name="time-outline" size={32} color="#6B7280" />
                  <Text
                    style={[
                      styles.emptyTitle,
                      { color: isDark ? "#FFFFFF" : "#0F172A" },
                    ]}
                  >
                    No touchpoints logged
                  </Text>
                  <Text
                    style={[
                      styles.emptySubtitle,
                      { color: isDark ? "#9CA3AF" : "#64748B" },
                    ]}
                  >
                    Logged calls, meeting notes & messages will stream here.
                  </Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.activitiesCard,
                    isDark
                      ? styles.activitiesCardDark
                      : styles.activitiesCardLight,
                  ]}
                >
                  {recentActivities.slice(0, 5).map((act, index) => (
                    <ActivityTimelineItem
                      key={act.id}
                      activity={act}
                      isLast={
                        index === Math.min(recentActivities.length, 5) - 1
                      }
                    />
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>



      {/* Primary Floating Action Button */}
      <Pressable
        style={[
          styles.fabBtn,
          fabExpanded && styles.fabBtnActive,
          { backgroundColor: "#3B82F6" },
        ]}
        onPress={handleToggleFab}
        hitSlop={8}
      >
        <Ionicons
          name={fabExpanded ? "close" : "add"}
          size={28}
          color="#FFFFFF"
        />
      </Pressable>

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
    paddingBottom: 120,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  backBtn: {
    padding: 8,
    borderRadius: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  liveIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  quickActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  primaryActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#3B82F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  secondaryActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  secondaryActionBtnDark: {
    backgroundColor: "#1E2028",
    borderColor: "#2D323F",
  },
  secondaryActionBtnLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: "500",
  },
  statsGrid: {
    gap: 12,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  sectionBlock: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  sectionLink: {
    color: "#3B82F6",
    fontSize: 13,
    fontWeight: "600",
  },
  badgeCount: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 2,
  },
  badgeCountText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  pipelineBar: {
    flexDirection: "row",
    height: 7,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  pipelineSegment: {
    height: "100%",
  },
  stageScroll: {
    flexDirection: "row",
  },
  stagePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  stagePillDark: {
    backgroundColor: "#181A20",
    borderColor: "#262A34",
  },
  stagePillLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  stageDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  stageName: {
    fontSize: 12,
    fontWeight: "500",
  },
  stageCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stageCount: {
    fontSize: 11,
    fontWeight: "700",
  },
  taskCarouselContent: {
    paddingRight: 8,
    gap: 12,
  },
  followupCard: {
    width: Math.min(SCREEN_WIDTH * 0.72, 280),
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    justifyContent: "space-between",
  },
  followupTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  dueChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dueChipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  taskCheckBtn: {
    padding: 2,
  },
  followupTitle: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 19,
    marginBottom: 8,
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    opacity: 0.6,
  },
  followupContactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 12,
  },
  followupContactName: {
    fontSize: 12,
    flex: 1,
  },
  followupFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(150, 150, 150, 0.1)",
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  followupActionBtn: {
    paddingVertical: 2,
  },
  followupActionText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#3B82F6",
  },
  cardDark: {
    backgroundColor: "#181A20",
    borderColor: "#262A34",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  cardLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
    maxWidth: 260,
  },
  emptyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  emptyBtnDark: {
    backgroundColor: "#262A34",
  },
  emptyBtnLight: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  emptyBtnText: {
    color: "#3B82F6",
    fontSize: 13,
    fontWeight: "600",
  },
  activitiesCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  activitiesCardDark: {
    backgroundColor: "#181A20",
    borderColor: "#262A34",
  },
  activitiesCardLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  fabBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    paddingBottom: 150,
    paddingRight: 20,
    zIndex: 99,
  },
  fabMenuContainer: {
    gap: 12,
    alignItems: "flex-end",
  },
  fabMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  fabMenuText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  fabBtn: {
    position: "absolute",
    bottom: 84,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 100,
  },
  fabBtnActive: {
    backgroundColor: "#EF4444",
    transform: [{ rotate: "45deg" }],
  },
});
