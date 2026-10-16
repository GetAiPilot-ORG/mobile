import { AppTopBar } from "@/components/AppTopBar";
import { ProductActions,ProductButton,ProductEmpty,ProductHeading,ProductMetrics,ProductRow,ProductSection,useProductPalette } from "@/components/ProductUI";
import {
Ionicons
} from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React,{ useState } from "react";
import {
Pressable,
RefreshControl,
ScrollView,
Text,
View
} from "react-native";
import { CrmHomeSkeleton } from "../../../components/skeletonScreen";
import { CreateDealModal } from "../components/CreateDealModal";
import { CreateLeadModal } from "../components/CreateLeadModal";
import { CreateTaskModal } from "../components/CreateTaskModal";
import { LeadCard } from "../components/LeadCard";
import { useCrmDashboard } from "../hooks/useCrmDashboard";
import { useCreateDeal } from "../hooks/useDeals";
import { useCreateLead } from "../hooks/useLeads";
import { useCreateTask,useToggleTask } from "../hooks/useTasks";
import { CRMTask } from "../types";


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
  const colors = useProductPalette();

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

  const stats = dashboard?.stats;
  const recentLeads = dashboard?.recentLeads || [];
  const upcomingTasks = dashboard?.upcomingTasks || [];
  const recentActivities = dashboard?.recentActivities || [];
  const pipelineSummary = dashboard?.pipelineSummary || [];

  const handleTaskToggle = (task: CRMTask) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
    const isDone = task.status === "done";
    toggleTask.mutate({ id: task.id, done: !isDone });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppTopBar title="CRM" onBackPress={onBack} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 130 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />}>
        <ProductHeading title={"Good relationships.\nBetter business."} />
        {isLoading && !dashboard ? <CrmHomeSkeleton /> : <>
          <View style={{ backgroundColor: colors.peach, borderRadius: 26, padding: 22, gap: 14, marginBottom: 26 }}>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>Your open pipeline</Text>
            <Text style={{ fontSize: 34, fontWeight: "500", color: colors.text }}>{formatCurrency(Number(stats?.totalDealValue || 0))}</Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>{stats?.openDeals ?? 0} open deals</Text>
            <ProductButton label="Open pipeline" onPress={() => onNavigateTab?.("pipeline")} />
          </View>
          <ProductMetrics items={[
            { label: "Leads", value: stats?.totalLeads ?? 0, onPress: () => onNavigateTab?.("leads") },
            { label: "Deals won", value: stats?.wonDealsThisMonth ?? 0, onPress: () => onNavigateTab?.("pipeline") },
            { label: "Due today", value: stats?.tasksDueToday ?? 0, onPress: () => onNavigateTab?.("tasks") },
          ]} />
          <ProductSection title="Make your next move">
            <ProductActions items={[
              { title: "New lead", icon: "person-add-outline", tone: "mint", onPress: () => setShowAddLead(true) },
              { title: "New deal", icon: "briefcase-outline", tone: "peach", onPress: () => setShowAddDeal(true) },
              { title: "New task", icon: "checkbox-outline", tone: "lavender", onPress: () => setShowAddTask(true) },
            ]} />
          </ProductSection>
          <ProductSection title="Your follow-ups" onAction={() => onNavigateTab?.("tasks")}>
            {upcomingTasks.length === 0 ? <ProductEmpty title="You're all caught up" description="Your upcoming follow-ups will appear here." action="Add a task" onAction={() => setShowAddTask(true)} /> :
              upcomingTasks.slice(0, 5).map((task) => <ProductRow key={task.id} title={task.title}
                detail={[task.contact ? task.contact.first_name + " " + task.contact.last_name : "", task.due_date ? new Date(task.due_date).toLocaleDateString() : "No due date"].filter(Boolean).join(" · ")}
                icon="calendar-outline" tone="lavender" onPress={() => onNavigateTab?.("tasks")}
                trailing={<Pressable onPress={(event) => { event.stopPropagation(); handleTaskToggle(task); }} accessibilityRole="checkbox" accessibilityState={{ checked: task.status === "done" }} accessibilityLabel={"Complete " + task.title} hitSlop={8} style={{ minWidth: 44, minHeight: 44, justifyContent: "center", alignItems: "center" }}><Ionicons name={task.status === "done" ? "checkmark-circle" : "ellipse-outline"} size={24} color={colors.accent} /></Pressable>} />)}
          </ProductSection>
          <ProductSection title="Recent leads" onAction={() => onNavigateTab?.("leads")}>
            {recentLeads.length === 0 ? <ProductEmpty title="Meet your next customer" action="Add a lead" onAction={() => setShowAddLead(true)} /> :
              recentLeads.slice(0, 4).map((lead) => <LeadCard key={lead.id} lead={lead} onPress={() => onSelectLead?.(lead.id)} />)}
          </ProductSection>
          <ProductSection title="Pipeline stages" onAction={() => onNavigateTab?.("pipeline")}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {pipelineSummary.map((stage) => <Pressable key={stage.stage} onPress={() => onNavigateTab?.("pipeline")} accessibilityRole="button" style={{ minWidth: 130, backgroundColor: colors.card, borderRadius: 22, padding: 18, gap: 12 }}>
                <Text style={{ fontSize: 25, color: colors.text }}>{stage.count}</Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>{stage.label}</Text>
              </Pressable>)}
            </ScrollView>
          </ProductSection>
          <ProductSection title="Recent activity" onAction={() => onNavigateTab?.("activities")}>
            {recentActivities.length === 0 ? <ProductEmpty title="A fresh start" description="Calls, notes, and meetings will appear here." /> :
              recentActivities.slice(0, 4).map((activity) => <ProductRow key={activity.id} title={activity.subject || activity.title || activity.type} detail={new Date(activity.created_at).toLocaleDateString()} icon="time-outline" onPress={() => onNavigateTab?.("activities")} />)}
          </ProductSection>
        </>}
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
    </View>
  );
};
