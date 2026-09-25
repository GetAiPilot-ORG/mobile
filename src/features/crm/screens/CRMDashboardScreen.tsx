import {
  Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { teamApi } from "../../team/api/team.api";
import { crmApi } from "../api/crm.api";
import { useTheme, getColors } from '@/theme';

const WEB_APP_URL = "https://getaipilot.in";

const ENTITY_TILES = [
  {
    key: "contacts",
    label: "Contacts",
    icon: "people",
    color: "#3B82F6",
    bg: "#EFF6FF",
    route: "/crm/contacts",
  },
  {
    key: "deals",
    label: "Deals",
    icon: "briefcase",
    color: "#8B5CF6",
    bg: "#F5F3FF",
    route: "/crm/deals",
  },
  {
    key: "tasks",
    label: "Tasks",
    icon: "checkmark-circle",
    color: "#10B981",
    bg: "#ECFDF5",
    route: "/crm/tasks",
  },
  {
    key: "invoices",
    label: "Invoices",
    icon: "receipt",
    color: "#F59E0B",
    bg: "#FFFBEB",
    route: "/crm/invoices",
  },
  {
    key: "quotations",
    label: "Quotations",
    icon: "document-text",
    color: "#EF4444",
    bg: "#FEF2F2",
    route: "/crm/quotations",
  },
  {
    key: "billing-profiles",
    label: "Client Profiles",
    icon: "card",
    color: "#06B6D4",
    bg: "#ECFEFF",
    route: "/crm/billing-profiles",
  },
  {
    key: "payments",
    label: "Payments",
    icon: "cash",
    color: "#EC4899",
    bg: "#FDF2F8",
    route: "/crm/payments",
  },
];

interface CRMDashboardScreenProps {
  onNavigateSection?: (section: string) => void;
}

export function CRMDashboardScreen({ onNavigateSection }: CRMDashboardScreenProps = {}) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const router = useRouter();

  const {
    data: org,
    isLoading: orgLoading,
    refetch: refetchOrg,
  } = useQuery({
    queryKey: ["crm-organization"],
    queryFn: () => crmApi.getOrganization(),
    retry: 1,
  });

  const {
    data: dashboard,
    isLoading: dashLoading,
    refetch: refetchDash,
    isRefetching,
  } = useQuery({
    queryKey: ["crm-dashboard"],
    queryFn: () => crmApi.getDashboard(),
    retry: 1,
  });

  const { data: teamActivity, refetch: refetchTeam } = useQuery({
    queryKey: ["team-activity"],
    queryFn: () => teamApi.getActivity(),
    retry: 1,
  });

  const onRefresh = useCallback(async () => {
    await Promise.all([refetchOrg(), refetchDash(), refetchTeam()]);
  }, [refetchOrg, refetchDash, refetchTeam]);

  const bg = isDark ? "#0F1015" : "#F8FAFC";
  const card = isDark ? "#1A1D26" : "#FFFFFF";
  const text = isDark ? "#FFFFFF" : "#0F172A";
  const sub = isDark ? "#9CA3AF" : "#64748B";
  const border = isDark ? "#262A34" : "#E2E8F0";

  const planTier = org?.subscription_tier || "free";
  const isPro = planTier !== "free";
  const planStatus = org?.plan_status || "inactive";
  const planEndDate = org?.plan_end_date;

  const stats = dashboard?.stats;

  const navigateTo = (route: string) => {
    if (route.startsWith('section:') && onNavigateSection) {
      onNavigateSection(route.replace('section:', ''));
    } else {
      router.push(route as any);
    }
  };

  const openBilling = () => {
    Linking.openURL(`${WEB_APP_URL}/pricing`).catch(() => {});
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: bg }]} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
          />
        }
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={[s.headerTitle, { color: text }]}>CRM Dashboard</Text>
            <Text style={[s.headerSub, { color: sub }]}>
              {org?.name || "Your Organization"}
            </Text>
          </View>
          <View
            style={[
              s.tierBadge,
              { backgroundColor: isPro ? "#8B5CF6" : "#64748B" },
            ]}
          >
            <Ionicons
              name={isPro ? "star" : "star-outline"}
              size={12}
              color="#FFF"
            />
            <Text style={s.tierText}>{planTier.toUpperCase()}</Text>
          </View>
        </View>

        {/* Subscription & Plans Card */}
        <View style={[s.card, { backgroundColor: card, borderColor: border }]}>
          <View style={s.cardRow}>
            <View style={[s.iconCircle, { backgroundColor: "#EDE9FE" }]}>
              <Ionicons name="diamond" size={20} color="#8B5CF6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.cardTitle, { color: text }]}>
                Subscription & Plan
              </Text>
              <Text style={[s.cardSub, { color: sub }]}>
                {org?.plan?.name ||
                  planTier.charAt(0).toUpperCase() + planTier.slice(1)}{" "}
                Plan
                {planEndDate
                  ? ` · Expires ${new Date(planEndDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`
                  : ""}
              </Text>
            </View>
            <View
              style={[
                s.statusDot,
                {
                  backgroundColor:
                    planStatus === "active" ? "#10B981" : "#F59E0B",
                },
              ]}
            />
          </View>

          <View style={s.planMetrics}>
            <View style={s.planMetric}>
              <Text style={[s.planMetricValue, { color: text }]}>
                {org?.max_users ?? "∞"}
              </Text>
              <Text style={[s.planMetricLabel, { color: sub }]}>Max Users</Text>
            </View>
            <View style={[s.planMetricDivider, { backgroundColor: border }]} />
            <View style={s.planMetric}>
              <Text style={[s.planMetricValue, { color: text }]}>
                {org?.max_contacts ?? "∞"}
              </Text>
              <Text style={[s.planMetricLabel, { color: sub }]}>
                Max Contacts
              </Text>
            </View>
            <View style={[s.planMetricDivider, { backgroundColor: border }]} />
            <View style={s.planMetric}>
              <Text style={[s.planMetricValue, { color: text }]}>
                {org?.billing_cycle || "N/A"}
              </Text>
              <Text style={[s.planMetricLabel, { color: sub }]}>Billing</Text>
            </View>
          </View>

          <Pressable
            style={[
              s.upgradeBtn,
              { backgroundColor: isPro ? "#10B981" : "#8B5CF6" },
            ]}
            onPress={() =>
              Linking.openURL(`${WEB_APP_URL}/dashboard/plans`).catch(() => {})
            }
          >
            <Ionicons
              name={isPro ? "checkmark-circle" : "arrow-up-circle"}
              size={16}
              color="#FFF"
            />
            <Text style={s.upgradeBtnText}>
              {isPro ? "Plan Active" : "Upgrade Plan"}
            </Text>
          </Pressable>
        </View>

        {/* Billing Settings Card */}
        <Pressable
          style={[
            s.card,
            s.billingCard,
            {
              backgroundColor: isDark ? "#1A1D26" : "#F0F9FF",
              borderColor: "#3B82F6",
            },
          ]}
          onPress={openBilling}
        >
          <View style={s.cardRow}>
            <View style={[s.iconCircle, { backgroundColor: "#DBEAFE" }]}>
              <Ionicons name="settings" size={20} color="#3B82F6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.cardTitle, { color: text }]}>
                Billing Settings
              </Text>
              <Text style={[s.cardSub, { color: "#3B82F6" }]}>
                Manage invoices, payment methods & tax info
              </Text>
            </View>
            <Ionicons name="open-outline" size={18} color="#3B82F6" />
          </View>
        </Pressable>

        {/* Stats Row */}
        <View style={s.statsRow}>
          {/* Auto Invoice Stat */}
          <View
            style={[
              s.statCard,
              {
                backgroundColor: card,
                borderColor: border,
                opacity: isPro ? 1 : 0.6,
              },
            ]}
          >
            <View style={s.statHeader}>
              <View style={[s.statIcon, { backgroundColor: "#ECFDF5" }]}>
                <Ionicons name="receipt" size={16} color="#10B981" />
              </View>
              {!isPro && (
                <View style={s.lockedBadge}>
                  <Ionicons name="lock-closed" size={10} color="#FFF" />
                </View>
              )}
            </View>
            <Text style={[s.statValue, { color: text }]}>
              {isPro ? (stats?.wonDealsThisMonth ?? 0) : "—"}
            </Text>
            <Text style={[s.statLabel, { color: sub }]}>Auto Invoices</Text>
            {isPro && (
              <Pressable
                style={s.viewFeatureBtn}
                onPress={() => navigateTo("/crm/invoices")}
              >
                <Text style={s.viewFeatureText}>View →</Text>
              </Pressable>
            )}
            {!isPro && (
              <Text style={[s.lockedText, { color: "#F59E0B" }]}>
                Pro feature
              </Text>
            )}
          </View>

          {/* Team Activity Stat */}
          <View
            style={[s.statCard, { backgroundColor: card, borderColor: border }]}
          >
            <View style={s.statHeader}>
              <View style={[s.statIcon, { backgroundColor: "#EFF6FF" }]}>
                <Ionicons name="people" size={16} color="#3B82F6" />
              </View>
            </View>
            <Text style={[s.statValue, { color: text }]}>
              {teamActivity?.presentToday ?? stats?.teamCount ?? 0}
            </Text>
            <Text style={[s.statLabel, { color: sub }]}>Team Active</Text>
            <Text style={[s.statExtra, { color: sub }]}>
              {teamActivity
                ? `${teamActivity.wfhToday} WFH`
                : `of ${teamActivity?.totalMembers ?? 0} total`}
            </Text>
          </View>
        </View>

        {/* CRM Stats Grid */}
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: text }]}>Overview</Text>
        </View>
        <View style={s.overviewGrid}>
          {[
            {
              label: "Contacts",
              value: stats?.totalContacts,
              icon: "people-outline",
              color: "#3B82F6",
            },
            {
              label: "Leads",
              value: stats?.totalLeads,
              icon: "funnel-outline",
              color: "#8B5CF6",
            },
            {
              label: "Open Deals",
              value: stats?.openDeals,
              icon: "briefcase-outline",
              color: "#F59E0B",
            },
            {
              label: "Due Today",
              value: stats?.tasksDueToday,
              icon: "alarm-outline",
              color: "#EF4444",
            },
          ].map((item) => (
            <View
              key={item.label}
              style={[
                s.overviewCard,
                { backgroundColor: card, borderColor: border },
              ]}
            >
              <Ionicons name={item.icon as any} size={18} color={item.color} />
              <Text style={[s.overviewValue, { color: text }]}>
                {item.value ?? 0}
              </Text>
              <Text style={[s.overviewLabel, { color: sub }]}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Entity Tiles */}
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: text }]}>Quick Access</Text>
        </View>
        <View style={s.tilesGrid}>
          {ENTITY_TILES.map((tile) => (
            <Pressable
              key={tile.key}
              style={[
                s.tile,
                {
                  backgroundColor: isDark ? "#1A1D26" : tile.bg,
                  borderColor: border,
                },
              ]}
              onPress={() => navigateTo(tile.route)}
            >
              <View
                style={[s.tileIcon, { backgroundColor: tile.color + "20" }]}
              >
                <Ionicons
                  name={tile.icon as any}
                  size={22}
                  color={tile.color}
                />
              </View>
              <Text style={[s.tileLabel, { color: text }]}>{tile.label}</Text>
              <Ionicons name="chevron-forward" size={14} color={sub} />
            </Pressable>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 4 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  headerSub: { fontSize: 13, marginTop: 2 },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  tierText: { color: "#FFF", fontSize: 11, fontWeight: "700" },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  billingCard: { borderWidth: 1.5 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardSub: { fontSize: 12, marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  planMetrics: { flexDirection: "row", marginTop: 16, marginBottom: 12 },
  planMetric: { flex: 1, alignItems: "center" },
  planMetricValue: { fontSize: 18, fontWeight: "700" },
  planMetricLabel: { fontSize: 11, marginTop: 2 },
  planMetricDivider: { width: 1, marginVertical: 4 },
  upgradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
  },
  upgradeBtnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 4 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    minHeight: 110,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  lockedBadge: {
    backgroundColor: "#F59E0B",
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  statLabel: { fontSize: 12, marginTop: 2 },
  statExtra: { fontSize: 11, marginTop: 2 },
  viewFeatureBtn: { marginTop: 8 },
  viewFeatureText: { color: "#10B981", fontSize: 12, fontWeight: "600" },
  lockedText: { fontSize: 11, marginTop: 6, fontWeight: "500" },
  sectionHeader: { marginTop: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: "700", letterSpacing: -0.2 },
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },
  overviewCard: {
    width: "47%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: "flex-start",
    gap: 4,
  },
  overviewValue: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  overviewLabel: { fontSize: 12 },
  tilesGrid: { gap: 8 },
  tile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tileLabel: { flex: 1, fontSize: 15, fontWeight: "600" },
});
