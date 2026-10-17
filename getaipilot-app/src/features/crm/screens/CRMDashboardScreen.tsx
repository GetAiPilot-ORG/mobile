import { FeaturePlanModal } from '../../../components/FeaturePlanModal';
import { usePlatformSubscription } from '../../../hooks/usePlatformSubscription';
import { getColors, useTheme } from '../../../theme';
import {
  Ionicons
} from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
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
import { teamApi } from "../../team/api/team.api";
import { crmApi } from "../api/crm.api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const OVERVIEW_CARD_WIDTH = Math.floor((SCREEN_WIDTH - 32 - 10) / 2);

const ENTITY_TILES = [
  {
    key: "contacts",
    label: "Contacts",
    icon: "people",
    color: "#647D8C",
    bg: "#E8F0F3",
    route: "/crm/contacts",
  },
  {
    key: "deals",
    label: "Deals",
    icon: "briefcase",
    color: "#8B5CF6",
    bg: "#EDE9FE",
    route: "/crm/deals",
  },
  {
    key: "tasks",
    label: "Tasks",
    icon: "checkmark-circle",
    color: "#4F8A68",
    bg: "#E6F2EC",
    route: "/crm/tasks",
  },
  {
    key: "billing-profiles",
    label: "Client Profiles",
    icon: "card",
    color: "#E7DEFA",
    bg: "#F0ECE3",
    route: "/crm/billing-profiles",
  },
  {
    key: "payments",
    label: "Payments",
    icon: "cash",
    color: "#9B8F70",
    bg: "#EAE4D8",
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

  const bg = colors.background;
  const card = colors.surface;
  const text = colors.text;
  const sub = colors.textMuted || colors.textSecondary || colors.text;
  const border = colors.border;

  const { hasCRM } = usePlatformSubscription();
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [lockedFeatureName, setLockedFeatureName] = useState("Smart CRM");

  const openLockModal = (name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLockedFeatureName(name);
    setPlanModalVisible(true);
  };

  const planTier = org?.subscription_tier || "free";
  const isPro = planTier !== "free" || hasCRM;
  const planStatus = hasCRM ? "active" : (org?.plan_status || "inactive");
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
    router.push('/account/plans?category=crm' as any);
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
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={s.header}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
            <Pressable
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/(tabs)/products");
                }
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Back to products"
            >
              <Ionicons name="chevron-back" size={22} color={text} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={[s.headerTitle, { color: text }]} numberOfLines={1}>CRM Dashboard</Text>
            </View>
          </View>
        </View>

        {/* Billing Settings Card */}
        <Pressable
          style={[
            s.card,
            s.billingCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.primary,
            },
          ]}
          onPress={openBilling}
        >
          <View style={s.cardRow}>
            <View style={[s.iconCircle, { backgroundColor: colors.primaryMuted }]}>
              <Ionicons name="settings" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.cardTitle, { color: text }]}>
                Billing Settings
              </Text>
              <Text style={[s.cardSub, { color: colors.primary }]}>
                Manage invoices, payment methods & tax info
              </Text>
            </View>
            <Ionicons name="open-outline" size={18} color={colors.primary} />
          </View>
        </Pressable>

        {/* Stats Row */}
        <View style={s.statsRow}>
          {/* Auto Invoice Stat */}
          <Pressable
            style={[
              s.statCard,
              {
                backgroundColor: card,
                borderColor: border,
                opacity: isPro ? 1 : 0.75,
              },
            ]}
            onPress={() => {
              if (!isPro) {
                openLockModal("Automated Invoices");
              }
            }}
          >
            <View style={s.statHeader}>
              <View style={[s.statIcon, { backgroundColor: colors.successSoft }]}>
                <Ionicons name="receipt" size={16} color={colors.success} />
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
            {isPro ? (
              <Pressable
                style={s.viewFeatureBtn}
                onPress={() => navigateTo("/crm/invoices")}
              >
                <Text style={[s.viewFeatureText, { color: colors.success }]}>View</Text>
                <Ionicons name="arrow-forward" size={11} color={colors.success} />
              </Pressable>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="lock-closed" size={11} color={colors.warning} />
                <Text style={[s.lockedText, { color: colors.warning }]}>
                  Upgrade to unlock
                </Text>
              </View>
            )}
          </Pressable>

          {/* Team Activity Stat */}
          <View
            style={[s.statCard, { backgroundColor: card, borderColor: border }]}
          >
            <View style={s.statHeader}>
              <View style={[s.statIcon, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="people" size={16} color={colors.primary} />
              </View>
            </View>
            <Text style={[s.statValue, { color: text }]}>
              {teamActivity?.presentToday ?? stats?.teamCount ?? 0}
            </Text>
            <Text style={[s.statLabel, { color: sub }]}>Team Active</Text>
            <Text style={[s.statExtra, { color: sub }]}>
              {teamActivity
                ? `${(teamActivity as any)?.wfhToday ?? 0} WFH`
                : `of ${stats?.teamCount ?? 0} total`}
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
          {ENTITY_TILES.map((tile) => {
            const isFeatureLocked = !isPro && (tile.key === "deals" || tile.key === "payments" || tile.key === "billing-profiles");
            return (
              <Pressable
                key={tile.key}
                style={[
                  s.tile,
                  {
                    backgroundColor: colors.surface,
                    borderColor: border,
                  },
                ]}
                onPress={() => {
                  if (isFeatureLocked) {
                    openLockModal(tile.label);
                    return;
                  }
                  navigateTo(tile.route);
                }}
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
                {isFeatureLocked ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: colors.accentSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                    <Ionicons name="lock-closed" size={11} color="#F59E0B" />
                    <Text style={{ fontSize: 10, fontWeight: "600", color: "#F59E0B" }}>PLAN</Text>
                  </View>
                ) : (
                  <Ionicons name="chevron-forward" size={14} color={sub} />
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <FeaturePlanModal
        visible={planModalVisible}
        onClose={() => setPlanModalVisible(false)}
        category="crm"
        featureName={lockedFeatureName}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 4,
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 28, fontWeight: '500', letterSpacing: -0.5, lineHeight: 36 },
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
  card: { borderRadius: 24, borderWidth: 0, padding: 16, marginBottom: 12, shadowOpacity: 0 },
  billingCard: { borderWidth: 0, borderRadius: 24, shadowOpacity: 0 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 24, borderWidth: 0, shadowOpacity: 0 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 15, fontWeight: "700", borderRadius: 24, borderWidth: 0, shadowOpacity: 0 },
  cardSub: { fontSize: 13, marginTop: 2, borderRadius: 24, borderWidth: 0, shadowOpacity: 0 },
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
  upgradeBtnText: { fontWeight: "700", fontSize: 14 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 4 },
  statCard: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 0,
    padding: 14,
    minHeight: 110,
    shadowOpacity: 0,
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
  viewFeatureText: { fontSize: 12, fontWeight: "600" },
  lockedText: { fontSize: 11, marginTop: 6, fontWeight: "500" },
  sectionHeader: { marginTop: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '500', letterSpacing: -0.2, lineHeight: 24 },
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },
  overviewCard: {
    width: OVERVIEW_CARD_WIDTH,
    borderRadius: 24,
    borderWidth: 0,
    padding: 14,
    alignItems: "flex-start",
    gap: 4,
    shadowOpacity: 0,
  },
  overviewValue: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  overviewLabel: { fontSize: 12 },
  tilesGrid: { gap: 8, borderRadius: 24, borderWidth: 0, shadowOpacity: 0 },
  tile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 24,
    borderWidth: 0,
    padding: 14,
    shadowOpacity: 0,
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
    shadowOpacity: 0,
  },
  tileLabel: { flex: 1, fontSize: 15, fontWeight: "600", borderRadius: 24, borderWidth: 0, shadowOpacity: 0 },
});
