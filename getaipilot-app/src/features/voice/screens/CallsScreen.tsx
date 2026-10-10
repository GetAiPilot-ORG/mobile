import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useTheme, getColors } from "@/theme";
import { useRouter } from "expo-router";
import {
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
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);
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
    ...themeColors,
    background: themeColors.background,
    surface: themeColors.surface,
    surfaceAlt: themeColors.surfaceSecondary,
    border: themeColors.border,
    text: themeColors.text,
    textSecondary: themeColors.textMuted,
    primary: themeColors.products?.voice || "#5B3AF5",
    primaryLight: themeColors.products?.voiceSoft || (isDark ? "rgba(91, 58, 245, 0.2)" : "#EDE9FE"),
    green: themeColors.success,
    greenLight: themeColors.successSoft,
    red: themeColors.destructive,
    redLight: themeColors.destructiveSoft,
    amber: themeColors.warning,
  };

  return (
    <ScrollView
      className="flex-1 w-full"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 110,
        gap: 16,
        width: "100%",
      }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={isDark ? "#FFFFFF" : colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* 1. TITLE SECTION */}
      <View className="pt-0.5 gap-1 w-full">
        <Text
          className="text-2xl sm:text-[27px] font-extrabold tracking-tight"
          style={{ color: colors.text }}
        >
          Call Records
        </Text>
        <Text className="text-sm sm:text-base font-medium" style={{ color: colors.textSecondary }}>
          Inspect real-time conversation transcripts, audio playback, and call outcomes.
        </Text>
      </View>

      {/* EXPIRED PLAN BANNER */}
      {isPlanExpired && (
        <View
          className={`rounded-2xl p-4 border gap-3 ${
            isDark ? "bg-[#1C1917] border-amber-500/25" : "bg-amber-50 border-amber-200"
          }`}
        >
          <View className="flex-row items-start gap-3">
            <View
              className={`w-9 h-9 rounded-xl items-center justify-center shrink-0 ${
                isDark ? "bg-amber-500/20" : "bg-amber-100"
              }`}
            >
              <Ionicons name="information-circle-outline" size={22} color="#D97706" />
            </View>
            <View className="flex-1 gap-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-bold" style={{ color: colors.text }}>
                  {overviewData?.planName || "Voice Plan"}
                </Text>
                <View className="bg-red-500/15 px-2 py-0.5 rounded-full">
                  <Text className="text-[11px] font-bold text-red-500">Plan Expired</Text>
                </View>
              </View>
              <Text className="text-xs leading-4 text-stone-400">
                Calling lines are paused. Renew your 30-day plan to reactivate calling.
              </Text>
            </View>
          </View>
          <View className={`flex-row items-center justify-between pt-3 border-t ${isDark ? "border-amber-500/15" : "border-amber-200"}`}>
            <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10">
              <Ionicons name="time-outline" size={12} color="#D97706" />
              <Text className="text-xs font-semibold text-amber-600">
                {overviewData?.currentPeriodEnd
                  ? `Expired on ${new Date(overviewData.currentPeriodEnd).toLocaleDateString()}`
                  : "Renewal Required"}
              </Text>
            </View>

            <Pressable
              className="flex-row items-center gap-1.5 px-3.5 py-2 rounded-xl"
              style={{ backgroundColor: colors.primary }}
              onPress={() => openVoiceWebBilling(queryClient, isDark)}
            >
              <Ionicons name="sparkles" size={12} color="#FFFFFF" />
              <Text className="text-xs font-bold text-white">Renew Plan</Text>
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
        className="flex-row items-center justify-between w-full rounded-2xl p-4 shadow-md active:opacity-75"
        style={{ backgroundColor: colors.primary }}
      >
        <View className="flex-row items-center gap-2.5">
          <Ionicons name="call" size={17} color="#FFFFFF" />
          <Text className="text-white text-base font-bold tracking-tight">Quick Test Call</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
      </Pressable>

      {/* 3. 3-METRIC STATS ROW */}
      <View className="flex-row gap-2.5 w-full">
        {/* Stat 1: Total Dispatched */}
        <View
          className="flex-1 min-w-0 rounded-2xl p-3 border justify-between"
          style={{
            flexBasis: 0,
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <View className="flex-row items-center gap-1.5 mb-1.5">
            <Ionicons name="call-outline" size={14} color={colors.primary} />
            <Text
              className="text-xs font-semibold tracking-tight"
              style={{ color: colors.textSecondary }}
              numberOfLines={2}
            >
              Total{"\n"}Dispatched
            </Text>
          </View>
          <Text className="text-xl font-bold tracking-tight" style={{ color: colors.text }}>
            {totalDispatched}
          </Text>
        </View>

        {/* Stat 2: Completed Calls */}
        <View
          className="flex-1 min-w-0 rounded-2xl p-3 border justify-between"
          style={{
            flexBasis: 0,
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <View className="flex-row items-center gap-1.5 mb-1.5">
            <Ionicons name="checkmark-circle" size={14} color={colors.green} />
            <Text
              className="text-xs font-semibold tracking-tight"
              style={{ color: colors.textSecondary }}
              numberOfLines={2}
            >
              Completed{"\n"}Calls
            </Text>
          </View>
          <Text className="text-xl font-bold tracking-tight" style={{ color: colors.text }}>
            {completedCalls}
          </Text>
        </View>

        {/* Stat 3: No Answer / Busy */}
        <View
          className="flex-1 min-w-0 rounded-2xl p-3 border justify-between"
          style={{
            flexBasis: 0,
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <View className="flex-row items-center gap-1.5 mb-1.5">
            <Ionicons name="close-circle" size={14} color={colors.red} />
            <Text
              className="text-xs font-semibold tracking-tight"
              style={{ color: colors.textSecondary }}
              numberOfLines={2}
            >
              No Answer /{"\n"}Busy
            </Text>
          </View>
          <Text className="text-xl font-bold tracking-tight" style={{ color: colors.text }}>
            {failedOrBusy}
          </Text>
        </View>
      </View>

      {/* 4. LIVE TELEPHONY ACTIVITY SECTION */}
      <View className="mb-0 mt-2 px-1">
        <Text className="text-xs font-semibold tracking-wider uppercase text-slate-500">
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
          className="rounded-2xl p-8 border items-center justify-center shadow-sm"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-3"
            style={{ backgroundColor: colors.primaryLight }}
          >
            <Ionicons name="call" size={32} color={colors.primary} />
          </View>
          <Text className="text-base font-bold mb-1" style={{ color: colors.text }}>
            No call records yet
          </Text>
          <Text className="text-xs text-center max-w-[260px]" style={{ color: colors.textSecondary }}>
            Your AI calls will appear here in real-time as they are made.
          </Text>
        </View>
      ) : (
        /* Calls List */
        <View
          className="rounded-2xl border overflow-hidden shadow-sm"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
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
                  className="flex-row items-center p-3.5 active:opacity-75"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCall(call);
                  }}
                >
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center mr-3 shrink-0"
                    style={{ backgroundColor: statusBg }}
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

                  <View className="flex-1 justify-center mr-2">
                    <View className="flex-row items-center justify-between mb-0.5">
                      <Text
                        className="text-[15px] font-bold tracking-tight flex-1 mr-2"
                        style={{ color: colors.text }}
                        numberOfLines={1}
                      >
                        {call.callerName || call.customerNumber}
                      </Text>
                      <Text
                        className="text-xs font-semibold"
                        style={{ color: colors.textSecondary }}
                      >
                        {call.duration || "10s"}
                      </Text>
                    </View>

                    <Text
                      className="text-xs mb-1"
                      style={{ color: colors.textSecondary }}
                    >
                      {call.assistant || "AI Assistant"} • {call.time || "Recent"}
                    </Text>

                    {call.campaign ? (
                      <View
                        className="flex-row items-center gap-1 px-2 py-0.5 rounded-md self-start mb-1"
                        style={{ backgroundColor: colors.primaryLight }}
                      >
                        <Ionicons name="megaphone" size={11} color={colors.primary} />
                        <Text
                          className="text-[11px] font-semibold"
                          style={{ color: colors.primary }}
                          numberOfLines={1}
                        >
                          {call.campaign}
                        </Text>
                      </View>
                    ) : null}

                    {call.summary ? (
                      <Text
                        className="text-xs italic leading-4"
                        style={{ color: colors.textSecondary }}
                        numberOfLines={1}
                      >
                        "{call.summary}"
                      </Text>
                    ) : null}
                  </View>

                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </Pressable>

                {idx < arr.length - 1 && (
                  <View
                    className="h-[1px] ml-16"
                    style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}
                  />
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Modals */}
      <CallDetailsModal
        visible={!!selectedCall}
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
