import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Bot, Database, Megaphone, Phone, PhoneCall } from "lucide-react-native";
import React from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { VoiceOverview, voiceApi } from "../api/voiceApi";
import { openVoiceWebBilling } from "../utils/voiceBilling";

interface Props {
  onNavigateTab?: (
    tab: "overview" | "calls" | "campaigns" | "contacts",
  ) => void;
  onOpenTriggerCall?: (assistantId?: string) => void;
  onOpenCreateCampaign?: () => void;
  onOpenCreateAssistant?: () => void;
}

const EMPTY: VoiceOverview = {
  totalAssistants: 0,
  activeCampaigns: 0,
  totalCalls: 0,
  creditBalance: 0,
  creditBalanceDisplay: "0 AI Mins",
};

export const VoiceOverviewScreen: React.FC<Props> = ({
  onNavigateTab,
  onOpenTriggerCall,
  onOpenCreateCampaign,
  onOpenCreateAssistant,
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isDark = useColorScheme() === "dark";
  const {
    data = EMPTY,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["voice", "overview"],
    queryFn: voiceApi.getOverview,
  });

  const { data: assistants = [] } = useQuery({
    queryKey: ["voice", "assistants"],
    queryFn: () => voiceApi.getAssistants(),
  });

  const { data: numbers = [] } = useQuery({
    queryKey: ["voice", "numbers"],
    queryFn: () => voiceApi.getNumbers(),
  });

  const colors = {
    background: isDark ? "#000000" : "#F7F8FA",
    surface: isDark ? "#161618" : "#FFFFFF",
    surfaceAlt: isDark ? "#1F1F24" : "#F1F3F9",
    border: isDark ? "#2A2A2E" : "#F0F1F5",
    text: isDark ? "#FFFFFF" : "#0F172A",
    textSecondary: isDark ? "#94A3B8" : "#64748B",
    primary: "#5B3AF5",
    primaryLight: isDark ? "rgba(91, 58, 245, 0.2)" : "#EDE9FE",
    green: "#16A34A",
    greenLight: isDark ? "rgba(22, 163, 74, 0.15)" : "#DCFCE7",
    chevron: isDark ? "#64748B" : "#94A3B8",
  };

  const navigate = (tab: "overview" | "calls" | "campaigns" | "contacts") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onNavigateTab?.(tab);
  };

  const activeCampaignsCount = data?.activeCampaigns ?? 0;
  const creditDisplay =
    data?.creditBalanceDisplay || `${data?.creditBalance ?? 0} AI Mins`;
  const totalAssistantsCount = data?.totalAssistants ?? assistants.length ?? 0;
  const totalCallsCount = data?.totalCalls ?? 0;
  const rawMinutes =
    typeof data?.creditBalance === "number"
      ? data.creditBalance
      : parseInt(creditDisplay.replace(/\D/g, "") || "0", 10);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["voice", "assistants"] });
            queryClient.invalidateQueries({ queryKey: ["voice", "numbers"] });
          }}
          tintColor={isDark ? "#FFFFFF" : colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* 1. EXECUTIVE PULSE BRIEFING TITLE */}
      <View style={styles.headingSection}>
        <Text style={[styles.mainHeading, { color: colors.text }]}>
          Executive Pulse Briefing
        </Text>
        <Text style={[styles.subHeading, { color: colors.textSecondary }]}>
          Your AI workforce is ready.
        </Text>
      </View>

      {/* EXPIRED PLAN NOTICE BANNER (Premium, subtle aesthetic) */}
      {data?.isPlanExpired && (
        <View
          style={[
            styles.expiredBanner,
            {
              backgroundColor: isDark ? "#1C1917" : "#FFFBEB",
              borderColor: isDark ? "rgba(245, 158, 11, 0.25)" : "#FDE68A",
            },
          ]}
        >
          <View style={styles.expiredBannerHeader}>
            <View
              style={[
                styles.expiredIconWrap,
                {
                  backgroundColor: isDark
                    ? "rgba(245, 158, 11, 0.2)"
                    : "#FEF3C7",
                },
              ]}
            >
              <Ionicons
                name="alert-circle"
                size={22}
                color="#D97706"
              />
            </View>
            <View style={styles.expiredTextWrap}>
              <View style={styles.expiredTitleRow}>
                <Text style={[styles.expiredTitle, { color: colors.text }]}>
                  {data?.planName || "Voice Plan"}
                </Text>
                <View style={styles.planStatusPill}>
                  <Text style={styles.planStatusPillText}>Plan Expired</Text>
                </View>
              </View>
              <Text
                style={[
                  styles.expiredDesc,
                  { color: isDark ? "#D6D3D1" : "#78716C" },
                ]}
              >
                Your balance of {creditDisplay} is preserved. Dedicated lines are paused until renewed.
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.expiredTagsRow,
              { borderTopColor: isDark ? "rgba(245, 158, 11, 0.15)" : "#FDE68A" },
            ]}
          >
            <Pressable
              style={[
                styles.expiredTag,
                {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.06)"
                    : "rgba(245, 158, 11, 0.12)",
                },
              ]}
              onPress={() => navigate("contacts")}
            >
              <Ionicons
                name="phone-portrait-outline"
                size={13}
                color="#D97706"
              />
              <Text
                style={[
                  styles.expiredTagText,
                  { color: "#D97706" },
                ]}
                numberOfLines={1}
              >
                {data?.expiredNumbersCount ?? 1} Line(s) Inactive
              </Text>
              <Ionicons name="chevron-forward" size={11} color="#D97706" />
            </Pressable>

            <Pressable
              style={[
                styles.renewActionBtn,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => openVoiceWebBilling(queryClient, isDark)}
            >
              <Ionicons name="sparkles" size={13} color="#FFFFFF" />
              <Text style={styles.renewActionText}>Renew Plan</Text>
              <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      )}

      {/* 2. TOP HERO GRADIENT CARD (Executive Calling Fleet Overview) */}
      <LinearGradient
        colors={["#5844E3", "#5136EE", "#3B50DF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradientCard}
      >
        {/* Left Column: Active Campaigns */}
        <Pressable
          style={styles.heroColumn}
          onPress={() => navigate("campaigns")}
        >
          <Ionicons name="megaphone-outline" size={28} color="#FFFFFF" />
          <View style={styles.heroTextWrapper}>
            <Text style={styles.heroBoldCount} numberOfLines={1}>
              {activeCampaignsCount} Active
            </Text>
            <Text style={styles.heroSubText} numberOfLines={1}>
              Campaigns
            </Text>
          </View>
        </Pressable>

        {/* Vertical Divider */}
        <View style={styles.heroDivider} />

        {/* Right Column: AI Mins */}
        <Pressable
          style={styles.heroColumn}
          onPress={() => openVoiceWebBilling(queryClient, isDark)}
        >
          <Ionicons name="flash" size={26} color="#FFFFFF" />
          <View style={styles.heroTextWrapper}>
            <Text style={styles.heroBoldMins} numberOfLines={1}>
              {rawMinutes.toLocaleString()} Mins
            </Text>
            <Text style={styles.heroSubMins} numberOfLines={1}>
              AI Voice Balance
            </Text>
          </View>
        </Pressable>
      </LinearGradient>

      {/* 3. 2x2 METRICS GRID (Comprehensive Fleet Telemetry) */}
      <View style={styles.grid}>
        {/* Card 1: AI Assistants */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (onOpenCreateAssistant) {
              onOpenCreateAssistant();
            }
          }}
          style={[
            styles.metricCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.metricHeaderRow}>
            <View
              style={[
                styles.metricIconWrap,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <Bot size={17} color={colors.primary} strokeWidth={2.2} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              AI Assistants
            </Text>
          </View>
          <Text style={[styles.metricValue, { color: colors.text }]}>
            {totalAssistantsCount}
          </Text>
        </Pressable>

        {/* Card 2: Dedicated Phone Lines */}
        <Pressable
          onPress={() => navigate("contacts")}
          style={[
            styles.metricCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.metricHeaderRow}>
            <View
              style={[
                styles.metricIconWrap,
                {
                  backgroundColor: isDark
                    ? "rgba(99, 102, 241, 0.15)"
                    : "#EEF2FF",
                },
              ]}
            >
              <PhoneCall size={17} color="#6366F1" strokeWidth={2.2} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Phone Lines
            </Text>
          </View>
          <Text style={[styles.metricValue, { color: colors.text }]}>
            {data?.totalNumbersCount ?? numbers.length}
          </Text>
        </Pressable>

        {/* Card 3: Total Calls */}
        <Pressable
          onPress={() => navigate("calls")}
          style={[
            styles.metricCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.metricHeaderRow}>
            <View
              style={[
                styles.metricIconWrap,
                {
                  backgroundColor: isDark
                    ? "rgba(14, 165, 233, 0.15)"
                    : "#E0F2FE",
                },
              ]}
            >
              <Phone size={17} color="#0EA5E9" strokeWidth={2.2} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Total Calls
            </Text>
          </View>
          <Text style={[styles.metricValue, { color: colors.text }]}>
            {totalCallsCount}
          </Text>
        </Pressable>

        {/* Card 4: Wallet Status */}
        <View
          style={[
            styles.metricCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.metricHeaderRow}>
            <View
              style={[
                styles.metricIconWrap,
                {
                  backgroundColor: isDark
                    ? "rgba(22, 163, 74, 0.15)"
                    : "#DCFCE7",
                },
              ]}
            >
              <Database size={17} color={colors.green} strokeWidth={2.2} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Voice Wallet
            </Text>
          </View>
          <Text
            style={[
              styles.metricValue,
              {
                color: colors.green,
                fontSize: 19,
              },
            ]}
          >
            {rawMinutes.toLocaleString()} Mins
          </Text>
        </View>
      </View>



      {/* 5. QUICK ACTIONS SECTION */}
      <View style={styles.quickActionsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Quick Actions
        </Text>

        <View style={styles.actionsList}>
          {/* Action 1: Create Assistant */}
          <Pressable
            style={({ pressed }) => [
              styles.actionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (onOpenCreateAssistant) {
                onOpenCreateAssistant();
              } else {
                navigate("overview");
              }
            }}
          >
            <View
              style={[
                styles.actionIconCircle,
                { backgroundColor: colors.primary },
              ]}
            >
              <Bot size={18} color="#FFFFFF" strokeWidth={2.2} />
            </View>
            <Text style={[styles.actionTitle, { color: colors.text }]}>
              Create Assistant
            </Text>
            <Ionicons
              name="chevron-forward"
              size={19}
              color={colors.chevron}
            />
          </Pressable>

          {/* Action 2: Start Campaign */}
          <Pressable
            style={({ pressed }) => [
              styles.actionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (onOpenCreateCampaign) {
                onOpenCreateCampaign();
              } else {
                navigate("campaigns");
              }
            }}
          >
            <View
              style={[
                styles.actionIconCircle,
                { backgroundColor: colors.primary },
              ]}
            >
              <Ionicons
                name="play"
                size={16}
                color="#FFFFFF"
                style={{ marginLeft: 2 }}
              />
            </View>
            <Text style={[styles.actionTitle, { color: colors.text }]}>
              Start Campaign
            </Text>
            <Ionicons
              name="chevron-forward"
              size={19}
              color={colors.chevron}
            />
          </Pressable>

          {/* Action 3: View Call Logs */}
          <Pressable
            style={({ pressed }) => [
              styles.actionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
            onPress={() => navigate("calls")}
          >
            <View
              style={[
                styles.actionIconCircle,
                { backgroundColor: colors.primary },
              ]}
            >
              <Ionicons name="list" size={18} color="#FFFFFF" />
            </View>
            <Text style={[styles.actionTitle, { color: colors.text }]}>
              View Call Logs
            </Text>
            <Ionicons
              name="chevron-forward"
              size={19}
              color={colors.chevron}
            />
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 110,
    gap: 16,
    width: "100%",
  },
  headingSection: {
    paddingTop: 2,
    gap: 4,
    width: "100%",
  },
  mainHeading: {
    fontSize: 27,
    lineHeight: 33,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  subHeading: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "500",
  },
  heroGradientCard: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    shadowColor: "#5B3AF5",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 5,
  },
  heroColumn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  heroTextWrapper: {
    flex: 1,
    justifyContent: "center",
  },
  heroBoldCount: {
    color: "#FFFFFF",
    fontSize: 15.5,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  heroSubText: {
    color: "rgba(255, 255, 255, 0.88)",
    fontSize: 12.5,
    fontWeight: "600",
    marginTop: 1,
  },
  heroBoldMins: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  heroSubMins: {
    color: "rgba(255, 255, 255, 0.88)",
    fontSize: 12.5,
    fontWeight: "600",
    marginTop: 1,
  },
  heroDivider: {
    width: 1,
    height: 38,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    marginHorizontal: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    gap: 12,
  },
  metricCard: {
    width: "48%",
    flexGrow: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
    minHeight: 96,
    justifyContent: "space-between",
  },
  metricHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metricIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: -0.1,
    flex: 1,
  },
  metricValue: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginTop: 4,
  },
  quickActionsSection: {
    gap: 12,
    marginTop: 4,
    width: "100%",
  },
  sectionTitle: {
    fontSize: 18.5,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  actionsList: {
    gap: 10,
    width: "100%",
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  actionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  actionTitle: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  pressed: {
    opacity: 0.78,
  },
  expiredBanner: {
    borderRadius: 16,
    borderWidth: 1,
    width: "100%",
    padding: 14,
    gap: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  expiredBannerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  expiredIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  expiredTextWrap: {
    flex: 1,
    gap: 3,
  },
  expiredTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  expiredTitle: {
    fontSize: 14.5,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  planStatusPill: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  planStatusPillText: {
    color: "#D97706",
    fontSize: 10,
    fontWeight: "700",
  },
  expiredDesc: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  },
  expiredTagsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  expiredTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    flexShrink: 1,
  },
  expiredTagText: {
    fontSize: 11,
    fontWeight: "600",
  },
  renewActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    flexShrink: 0,
  },
  renewActionText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
