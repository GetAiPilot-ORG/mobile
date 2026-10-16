import { ProductEmpty,ProductHeading,ProductMetrics,ProductRow,ProductSection } from "@/components/ProductUI";
import { getColors,useTheme } from "@/theme";
import { useMutation,useQuery,useQueryClient } from "@tanstack/react-query";
import React,{ useState } from "react";
import {
ActivityIndicator,
RefreshControl,
ScrollView
} from "react-native";
import {
VoiceAssistant,
VoiceCall,
voiceApi,
} from "../api/voiceApi";
import {
CallDetailsModal,
TriggerCallModal,
VoicePlanExpiredBanner,
} from "../components";

export const CallsScreen: React.FC = () => {
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);
  const queryClient = useQueryClient();

  const [selectedCall, setSelectedCall] = useState<VoiceCall | null>(null);
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);

  // Queries
  const {

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
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 110,
        gap: 8,
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
      <ProductHeading title="Your conversations" action="Make a call" onAction={() => setIsTriggerModalOpen(true)} />
      {isPlanExpired && <VoicePlanExpiredBanner overview={overviewData} />}
      <ProductMetrics items={[{ label: "Calls", value: totalDispatched }, { label: "Completed", value: completedCalls }, { label: "Unsuccessful", value: failedOrBusy }]} />
      <ProductSection title="Call history">
        {isCallsLoading ? <ActivityIndicator color={colors.accent} /> : calls.length === 0 ? <ProductEmpty title="No calls yet" description="Your recordings and transcripts will appear here." action="Make a call" onAction={() => setIsTriggerModalOpen(true)} /> :
          calls.map((call) => <ProductRow key={call.id} title={call.callerName || call.customerNumber}
            detail={[call.status.replace(/_/g, " "), call.duration, call.time].filter(Boolean).join(" · ")}
            icon={call.direction === "inbound" ? "call-outline" : "arrow-redo-outline"} tone={call.status === "failed" ? "pink" : "mint"} onPress={() => setSelectedCall(call)} />)}
      </ProductSection>

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
