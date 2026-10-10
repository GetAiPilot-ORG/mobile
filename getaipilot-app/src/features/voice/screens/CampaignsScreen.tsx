import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useTheme, getColors } from "@/theme";
import { VoiceCampaign, voiceApi } from "../api/voiceApi";
import {
  CampaignDetailsModal,
  CreateCampaignModal,
  EditCampaignModal,
} from "../components";

function getStatus(campaign: VoiceCampaign): string {
  return String(campaign.status || "draft").toLowerCase();
}

function formatDate(dateString?: string): string {
  if (!dateString) return "Recent";
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  } catch {
    return "Recent";
  }
}

export const CampaignsScreen: React.FC = () => {
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);
  const queryClient = useQueryClient();

  const [selectedCampaign, setSelectedCampaign] =
    useState<VoiceCampaign | null>(null);
  const [editingCampaign, setEditingCampaign] =
    useState<VoiceCampaign | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Queries
  const {
    data: campaigns = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["voice", "campaigns"],
    queryFn: () => voiceApi.getCampaigns(),
  });

  const { data: assistants = [] } = useQuery({
    queryKey: ["voice", "assistants"],
    queryFn: () => voiceApi.getAssistants(),
  });

  const { data: numbers = [] } = useQuery({
    queryKey: ["voice", "numbers"],
    queryFn: () => voiceApi.getNumbers(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => voiceApi.createCampaign(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice", "campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["voice", "overview"] });
      queryClient.invalidateQueries({ queryKey: ["voice", "analytics"] });
      setIsCreateModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      voiceApi.updateCampaign(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice", "campaigns"] });
      setEditingCampaign(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => voiceApi.deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice", "campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["voice", "overview"] });
      setSelectedCampaign(null);
    },
    onError: (err: any) => {
      Alert.alert("Delete Error", err?.message || "Failed to delete campaign.");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "running" | "paused" | "completed";
    }) => voiceApi.updateCampaignStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice", "campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["voice", "overview"] });
    },
  });

  const totalDispatchJobs = campaigns.length;
  const completedCampaigns = campaigns.filter(
    (c) => getStatus(c) === "completed",
  ).length;
  const inProgressCampaigns = campaigns.filter((c) =>
    ["running", "in_progress", "active", "processing", "queued"].includes(
      getStatus(c),
    ),
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
    blue: themeColors.info,
    blueLight: themeColors.infoSoft,
  };

  const handleDownloadCsvTemplate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "CSV Template",
      "Template headers: name, phone, followUpDate, details\n\nEnsure phone numbers include country code (e.g. +91 9876543210).",
    );
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
          refreshing={isRefetching}
          onRefresh={refetch}
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
          Campaigns
        </Text>
        <Text className="text-sm sm:text-base font-medium" style={{ color: colors.textSecondary }}>
          Monitor and manage high-concurrency bulk AI call jobs.
        </Text>
      </View>

      {/* 2. TOP ACTION BUTTONS ROW */}
      <View className="flex-row items-center gap-2.5 w-full">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh"
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            refetch();
          }}
          className="w-10 h-10 rounded-xl border items-center justify-center active:opacity-75 shadow-xs"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <Ionicons
            name="refresh-outline"
            size={18}
            color={colors.text}
            style={isRefetching ? { transform: [{ rotate: "45deg" }] } : undefined}
          />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="CSV Template"
          onPress={handleDownloadCsvTemplate}
          className="flex-row items-center gap-2 px-3.5 h-10 rounded-xl border active:opacity-75 shadow-xs"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          <Ionicons
            name="document-text-outline"
            size={16}
            color={colors.text}
          />
          <Text className="text-xs font-bold" style={{ color: colors.text }}>
            CSV Template
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add New Job"
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            setIsCreateModalOpen(true);
          }}
          className="flex-row items-center gap-1.5 px-4 h-10 rounded-xl flex-1 justify-center active:opacity-75 shadow-md"
          style={{ backgroundColor: colors.primary }}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text className="text-white text-xs font-bold tracking-tight">Add New Job</Text>
        </Pressable>
      </View>

      {/* 3. 3-METRIC STATS ROW */}
      <View className="flex-row gap-2.5 w-full">
        {/* Stat 1: Total Dispatch Jobs */}
        <View
          className="flex-1 min-w-0 rounded-2xl p-3 border justify-between"
          style={{
            flexBasis: 0,
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <Text
            className="text-[10.5px] font-bold tracking-wider mb-1"
            style={{ color: colors.textSecondary }}
            numberOfLines={1}
          >
            TOTAL DISPATCH
          </Text>
          <Text className="text-xl font-bold tracking-tight" style={{ color: colors.text }}>
            {totalDispatchJobs}
          </Text>
        </View>

        {/* Stat 2: Completed Campaigns */}
        <View
          className="flex-1 min-w-0 rounded-2xl p-3 border justify-between"
          style={{
            flexBasis: 0,
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <Text
            className="text-[10.5px] font-bold tracking-wider mb-1"
            style={{ color: colors.textSecondary }}
            numberOfLines={1}
          >
            COMPLETED
          </Text>
          <Text className="text-xl font-bold tracking-tight" style={{ color: colors.green }}>
            {completedCampaigns}
          </Text>
        </View>

        {/* Stat 3: In Progress */}
        <View
          className="flex-1 min-w-0 rounded-2xl p-3 border justify-between"
          style={{
            flexBasis: 0,
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <Text
            className="text-[10.5px] font-bold tracking-wider mb-1"
            style={{ color: colors.textSecondary }}
            numberOfLines={1}
          >
            IN PROGRESS
          </Text>
          <Text className="text-xl font-bold tracking-tight" style={{ color: colors.primary }}>
            {inProgressCampaigns}
          </Text>
        </View>
      </View>

      {/* 4. ACTIVE & HISTORIC JOBS SECTION */}
      <View className="flex-row justify-between items-center mb-0 mt-2 px-1">
        <Text className="text-xs font-semibold tracking-wider uppercase text-slate-500">
          Active & Historic Jobs
        </Text>
        <View
          className="px-2 py-0.5 rounded-md border"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          <Text
            className="text-[10px] font-bold"
            style={{ color: colors.textSecondary }}
          >
            {totalDispatchJobs} JOBS
          </Text>
        </View>
      </View>

      {/* 5. CAMPAIGN JOBS LIST */}
      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: 40 }}
        />
      ) : campaigns.length === 0 ? (
        /* Empty State */
        <View
          className="rounded-2xl p-8 border items-center justify-center shadow-sm"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-3"
            style={{ backgroundColor: colors.primaryLight }}
          >
            <Ionicons name="megaphone-outline" size={32} color={colors.primary} />
          </View>
          <Text className="text-base font-bold mb-1" style={{ color: colors.text }}>
            No campaign jobs found
          </Text>
          <Text className="text-xs text-center max-w-[260px]" style={{ color: colors.textSecondary }}>
            Upload contacts or tap Add New Job to queue your first automated outbound calling campaign.
          </Text>
        </View>
      ) : (
        /* Real Campaigns List */
        <View
          className="rounded-2xl border overflow-hidden shadow-sm"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          {campaigns.map((camp, idx, arr) => {
            const status = getStatus(camp);
            const isCompleted = status === "completed";
            const statusLabel = isCompleted ? "Completed" : "In Progress";
            const statusColor = isCompleted ? colors.green : colors.primary;
            const statusBg = isCompleted ? colors.greenLight : colors.primaryLight;

            return (
              <View key={camp.id || idx}>
                <Pressable
                  className="flex-row items-center justify-between p-3.5 active:opacity-75"
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSelectedCampaign(camp);
                  }}
                >
                  <View className="flex-1 justify-center mr-3">
                    <Text
                      className="text-[15px] font-bold tracking-tight mb-0.5"
                      style={{ color: colors.text }}
                      numberOfLines={1}
                    >
                      {camp.name}
                    </Text>

                    <Text
                      className="text-xs"
                      style={{ color: colors.textSecondary }}
                    >
                      {formatDate(camp.created_at)}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-2">
                    <View
                      className="flex-row items-center gap-1 px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: statusBg }}
                    >
                      <Ionicons
                        name={isCompleted ? "checkmark-circle" : "time-outline"}
                        size={12}
                        color={statusColor}
                      />
                      <Text
                        className="text-[11px] font-bold"
                        style={{ color: statusColor }}
                      >
                        {statusLabel}
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.textSecondary}
                    />
                  </View>
                </Pressable>

                {idx < arr.length - 1 && (
                  <View
                    className="h-[1px]"
                    style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}
                  />
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Modals */}
      <CreateCampaignModal
        visible={isCreateModalOpen}
        assistants={assistants}
        phoneNumbers={numbers}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async (payload) => {
          await createMutation.mutateAsync(payload);
        }}
        isLoading={createMutation.isPending}
      />

      <EditCampaignModal
        visible={!!editingCampaign}
        campaign={editingCampaign}
        assistants={assistants}
        phoneNumbers={numbers}
        onClose={() => setEditingCampaign(null)}
        onSubmit={async (payload) => {
          if (editingCampaign) {
            await updateMutation.mutateAsync({
              id: editingCampaign.id,
              payload,
            });
          }
        }}
        isLoading={updateMutation.isPending}
      />

      <CampaignDetailsModal
        visible={!!selectedCampaign}
        campaign={selectedCampaign}
        onClose={() => setSelectedCampaign(null)}
        onEdit={(camp) => {
          setSelectedCampaign(null);
          setEditingCampaign(camp);
        }}
        onDelete={async (id) => {
          await deleteMutation.mutateAsync(id);
        }}
        onStatusChange={async (id, status) => {
          await statusMutation.mutateAsync({ id, status });
        }}
        isActionLoading={deleteMutation.isPending || statusMutation.isPending}
      />
    </ScrollView>
  );
};
