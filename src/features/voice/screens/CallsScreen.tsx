import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  DedicatedNumber,
  VoiceAssistant,
  VoiceCall,
  voiceApi,
} from "../api/voiceApi";
import {
  CallDetailsModal,
  TriggerCallModal,
} from "../components";
import { openVoiceWebBilling } from "../utils/voiceBilling";

export const CallsScreen: React.FC = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const queryClient = useQueryClient();

  const [selectedCall, setSelectedCall] = useState<VoiceCall | null>(null);
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);

  // Queries
  const {
    data: numbersData,
    isLoading: isNumbersLoading,
    refetch: refetchNumbers,
  } = useQuery({
    queryKey: ["voice", "numbers"],
    queryFn: () => voiceApi.getNumbers(),
  });

  const { data: assistantsData } = useQuery({
    queryKey: ["voice", "assistants"],
    queryFn: () => voiceApi.getAssistants(),
  });

  const {
    data: callsData,
    isLoading: isCallsLoading,
    refetch: refetchCalls,
    isRefetching: isCallsRefetching,
  } = useQuery({
    queryKey: ["voice", "calls"],
    queryFn: () => voiceApi.getCalls(),
  });

  const { data: overviewData, refetch: refetchOverview } = useQuery({
    queryKey: ["voice", "overview"],
    queryFn: () => voiceApi.getOverview(),
  });

  // Mutations
  const triggerTestCallMutation = useMutation({
    mutationFn: (payload: any) => voiceApi.triggerOutboundCall(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice", "calls"] });
      queryClient.invalidateQueries({ queryKey: ["voice", "overview"] });
      queryClient.invalidateQueries({ queryKey: ["voice", "analytics"] });
      setIsTriggerModalOpen(false);
    },
  });

  const isRefreshing = isNumbersLoading || isCallsRefetching;

  const handleRefresh = () => {
    refetchNumbers();
    refetchCalls();
    refetchOverview();
  };

  const calls: VoiceCall[] = callsData || [];
  const assistants: VoiceAssistant[] = assistantsData || [];
  const isPlanExpired = Boolean(overviewData?.isPlanExpired);

  const totalDispatched = calls.length;
  const completedCalls = calls.filter((c) => c.status === "completed").length;
  const failedOrBusy = calls.filter(
    (c) => c.status === "failed" || c.status === "cancelled",
  ).length;

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
    greenLight: isDark ? "rgba(22, 163, 74, 0.2)" : "#DCFCE7",
    red: "#EF4444",
    redLight: isDark ? "rgba(239, 68, 68, 0.2)" : "#FEE2E2",
    amber: "#F59E0B",
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={isDark ? "#FFFFFF" : colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* 1. TITLE & EYEBROW */}
      <View style={styles.headingSection}>
        <Text style={[styles.eyebrowText, { color: colors.textSecondary }]}>
          // TELEPHONY LOGS & CALL RECORDS
        </Text>
        <Text style={[styles.mainHeading, { color: colors.text }]}>
          Call Records
        </Text>
        <Text style={[styles.subHeading, { color: colors.textSecondary }]}>
          Inspect real-time conversation transcripts, audio playback, and call outcomes.
        </Text>
      </View>

      {/* EXPIRED PLAN BANNER */}
      {isPlanExpired && (
        <View
          style={[
            styles.expiredBanner,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.expiredBannerHeader}>
            <View
              style={[
                styles.expiredIconWrap,
                {
                  backgroundColor: isDark
                    ? "rgba(245, 158, 11, 0.15)"
                    : "#FEF3C7",
                },
              ]}
            >
              <Ionicons
                name="information-circle-outline"
                size={22}
                color="#D97706"
              />
            </View>
            <View style={styles.expiredTextWrap}>
              <View style={styles.expiredTitleRow}>
                <Text style={[styles.expiredTitle, { color: colors.text }]}>
                  {overviewData?.planName || "Voice Plan"}
                </Text>
                <View style={styles.planStatusPill}>
                  <Text style={styles.planStatusPillText}>Plan Expired</Text>
                </View>
              </View>
              <Text
                style={[
                  styles.expiredDesc,
                  { color: colors.textSecondary },
                ]}
              >
                Calling lines are paused. Renew your 30-day plan to reactivate calling.
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.expiredTagsRow,
              { borderTopColor: isDark ? "rgba(245, 158, 11, 0.2)" : "#FDE68A" },
            ]}
          >
            <View
              style={[
                styles.expiredTag,
                {
                  backgroundColor: isDark
                    ? "rgba(245, 158, 11, 0.12)"
                    : "#FEF3C7",
                },
              ]}
            >
              <Ionicons name="time-outline" size={12} color="#D97706" />
              <Text style={[styles.expiredTagText, { color: "#D97706" }]}>
                {overviewData?.currentPeriodEnd
                  ? `Expired on ${new Date(overviewData.currentPeriodEnd).toLocaleDateString()}`
                  : "Renewal Required"}
              </Text>
            </View>

            <Pressable
              style={[
                styles.renewActionBtn,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => openVoiceWebBilling(queryClient, isDark)}
            >
              <Ionicons name="sparkles" size={12} color="#FFFFFF" />
              <Text style={styles.renewActionText}>Renew Plan</Text>
              <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      )}

      {/* 2. QUICK TEST CALL ACTION BUTTON */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Quick Test Call"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setIsTriggerModalOpen(true);
        }}
        style={({ pressed }) => [
          styles.quickTestCallBtn,
          { backgroundColor: colors.primary },
          pressed && styles.pressed,
        ]}
      >
        <Ionicons name="call" size={17} color="#FFFFFF" />
        <Text style={styles.quickTestCallBtnText}>Quick Test Call</Text>
        <Ionicons
          name="chevron-forward"
          size={18}
          color="#FFFFFF"
          style={styles.btnChevron}
        />
      </Pressable>

      {/* 3. 3-METRIC STATS ROW (Total Dispatched | Completed Calls | No Answer / Busy) */}
      <View style={styles.statsRow}>
        {/* Stat 1: Total Dispatched */}
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.statHeader}>
            <Ionicons name="call-outline" size={14} color={colors.primary} />
            <Text
              style={[styles.statLabel, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              Total{"\n"}Dispatched
            </Text>
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {totalDispatched}
          </Text>
        </View>

        {/* Stat 2: Completed Calls */}
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.statHeader}>
            <Ionicons name="checkmark-circle" size={14} color={colors.green} />
            <Text
              style={[styles.statLabel, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              Completed{"\n"}Calls
            </Text>
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {completedCalls}
          </Text>
        </View>

        {/* Stat 3: No Answer / Busy */}
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.statHeader}>
            <Ionicons name="close-circle" size={14} color={colors.red} />
            <Text
              style={[styles.statLabel, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              No Answer /{"\n"}Busy
            </Text>
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {failedOrBusy}
          </Text>
        </View>
      </View>

      {/* 4. LIVE TELEPHONY ACTIVITY SECTION */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Live Telephony Activity
        </Text>
      </View>

      {/* 5. CALL LOGS CONTENT AREA */}
      {isCallsLoading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: 40 }}
        />
      ) : calls.length === 0 ? (
        /* Empty State */
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.emptyIconCircle,
              { backgroundColor: colors.primaryLight },
            ]}
          >
            <Ionicons name="call" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No call records yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Your AI calls will appear here in real-time as they are made.
          </Text>
        </View>
      ) : (
        /* Calls List */
        <View
          style={[
            styles.callListCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {calls.map((call, idx, arr) => {
            const isCompleted = call.status === "completed";
            const isFailed = call.status === "failed";
            const statusColor = isCompleted
              ? colors.green
              : isFailed
                ? colors.red
                : colors.amber;
            const statusBg = isCompleted
              ? colors.greenLight
              : isFailed
                ? colors.redLight
                : colors.primaryLight;

            return (
              <View key={call.id || idx}>
                <Pressable
                  style={({ pressed }) => [
                    styles.callRow,
                    pressed && styles.callRowPressed,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCall(call);
                  }}
                >
                  <View
                    style={[
                      styles.callStatusIconBox,
                      { backgroundColor: statusBg },
                    ]}
                  >
                    <Ionicons
                      name={
                        isCompleted
                          ? "checkmark-circle"
                          : isFailed
                            ? "close-circle"
                            : "call"
                      }
                      size={20}
                      color={statusColor}
                    />
                  </View>

                  <View style={styles.callMainInfo}>
                    <View style={styles.callTopLine}>
                      <Text
                        style={[styles.callNumberText, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {call.callerName || call.customerNumber}
                      </Text>
                      <Text
                        style={[
                          styles.callDurationText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {call.duration || "10s"}
                      </Text>
                    </View>

                    <Text
                      style={[styles.callSubText, { color: colors.textSecondary }]}
                    >
                      {call.assistant || "AI Assistant"} • {call.time || "Recent"}
                    </Text>

                    {call.campaign ? (
                      <View
                        style={[
                          styles.campaignTag,
                          { backgroundColor: colors.primaryLight },
                        ]}
                      >
                        <Ionicons
                          name="megaphone"
                          size={11}
                          color={colors.primary}
                        />
                        <Text
                          style={[
                            styles.campaignTagText,
                            { color: colors.primary },
                          ]}
                          numberOfLines={1}
                        >
                          {call.campaign}
                        </Text>
                      </View>
                    ) : null}

                    {call.summary ? (
                      <Text
                        style={[
                          styles.callSummaryText,
                          { color: colors.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {call.summary}
                      </Text>
                    ) : null}
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textSecondary}
                  />
                </Pressable>

                {idx < arr.length - 1 && (
                  <View
                    style={[styles.callDivider, { backgroundColor: colors.border }]}
                  />
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Modals */}
      <CallDetailsModal
        visible={Boolean(selectedCall)}
        call={selectedCall}
        onClose={() => setSelectedCall(null)}
      />

      <TriggerCallModal
        visible={isTriggerModalOpen}
        assistants={assistants}
        onClose={() => setIsTriggerModalOpen(false)}
        onSubmit={async (payload) => {
          await triggerTestCallMutation.mutateAsync(payload);
        }}
        isLoading={triggerTestCallMutation.isPending}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 110,
    gap: 14,
  },
  headingSection: {
    paddingTop: 2,
    gap: 3,
  },
  eyebrowText: {
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  mainHeading: {
    fontSize: 27,
    lineHeight: 33,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  subHeading: {
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: "500",
  },
  quickTestCallBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: 18,
    gap: 8,
    paddingHorizontal: 18,
    shadowColor: "#5B3AF5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
    position: "relative",
  },
  quickTestCallBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  btnChevron: {
    position: "absolute",
    right: 18,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 88,
    justifyContent: "space-between",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: "600",
    lineHeight: 14,
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginTop: 4,
  },
  sectionHeaderRow: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 48,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    maxWidth: 240,
    lineHeight: 18,
  },
  callListCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  callRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  callRowPressed: {
    opacity: 0.75,
  },
  callStatusIconBox: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  callMainInfo: {
    flex: 1,
    gap: 3,
  },
  callTopLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  callNumberText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  callDurationText: {
    fontSize: 12,
    fontWeight: "600",
  },
  callSubText: {
    fontSize: 12,
    fontWeight: "500",
  },
  campaignTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
    marginTop: 2,
  },
  campaignTagText: {
    fontSize: 10.5,
    fontWeight: "700",
  },
  callSummaryText: {
    fontSize: 11.5,
    fontWeight: "500",
    marginTop: 1,
  },
  callDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 64,
  },
  pressed: {
    opacity: 0.8,
  },
  expiredBanner: {
    borderRadius: 16,
    borderWidth: 1,
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
    borderRadius: 12,
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
    backgroundColor: "rgba(245, 158, 11, 0.12)",
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
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  expiredTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },
  expiredTagText: {
    fontSize: 11,
    fontWeight: "600",
  },
  renewActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 8,
  },
  renewActionText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
