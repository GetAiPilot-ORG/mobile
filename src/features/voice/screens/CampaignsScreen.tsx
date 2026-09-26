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
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
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
    blue: "#2563EB",
    blueLight: isDark ? "rgba(37, 99, 235, 0.2)" : "#DBEAFE",
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
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
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
      <View style={styles.headingSection}>
        <Text style={[styles.mainHeading, { color: colors.text }]}>
          Campaigns
        </Text>
        <Text style={[styles.subHeading, { color: colors.textSecondary }]}>
          Monitor and manage high-concurrency bulk AI call jobs.
        </Text>
      </View>

      {/* 2. TOP ACTION BUTTONS ROW (Refresh | CSV Template | + Add New Job) */}
      <View style={styles.topActionsRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh"
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            refetch();
          }}
          style={({ pressed }) => [
            styles.refreshBtn,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
            pressed && styles.pressed,
          ]}
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
          style={({ pressed }) => [
            styles.csvTemplateBtn,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="document-text-outline"
            size={16}
            color={colors.text}
          />
          <Text style={[styles.csvTemplateBtnText, { color: colors.text }]}>
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
          style={({ pressed }) => [
            styles.addNewJobBtn,
            { backgroundColor: colors.primary },
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addNewJobBtnText}>Add New Job</Text>
        </Pressable>
      </View>

      {/* 3. 3-METRIC STATS ROW (Total Dispatch Jobs | Completed Campaigns | In Progress) */}
      <View style={styles.statsRow}>
        {/* Stat 1: Total Dispatch Jobs */}
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text
            style={[styles.statLabel, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            TOTAL DISPATCH
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {totalDispatchJobs}
          </Text>
        </View>

        {/* Stat 2: Completed Campaigns */}
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text
            style={[styles.statLabel, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            COMPLETED
          </Text>
          <Text style={[styles.statValue, { color: colors.green }]}>
            {completedCampaigns}
          </Text>
        </View>

        {/* Stat 3: In Progress */}
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text
            style={[styles.statLabel, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            IN PROGRESS
          </Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {inProgressCampaigns}
          </Text>
        </View>
      </View>

      {/* 4. ACTIVE & HISTORIC JOBS SECTION */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Active & Historic Jobs
        </Text>
        <View
          style={[
            styles.jobsCountBadge,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text
            style={[styles.jobsCountBadgeText, { color: colors.textSecondary }]}
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
            <Ionicons name="megaphone-outline" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No campaign jobs found
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Upload contacts or tap Add New Job to queue your first automated outbound calling campaign.
          </Text>
        </View>
      ) : (
        /* Real Campaigns List */
        <View
          style={[
            styles.jobsListCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
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
                  style={({ pressed }) => [
                    styles.jobRow,
                    pressed && styles.jobRowPressed,
                  ]}
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSelectedCampaign(camp);
                  }}
                >
                  <View style={styles.jobMainInfo}>
                    <Text
                      style={[styles.jobNameText, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {camp.name}
                    </Text>

                    <Text
                      style={[
                        styles.jobDateText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {formatDate(camp.created_at)}
                    </Text>
                  </View>

                  <View style={styles.jobActionsWrap}>
                    <View
                      style={[
                        styles.inProgressPill,
                        { backgroundColor: statusBg },
                      ]}
                    >
                      <Ionicons
                        name={isCompleted ? "checkmark-circle" : "time-outline"}
                        size={12}
                        color={statusColor}
                      />
                      <Text
                        style={[
                          styles.inProgressPillText,
                          { color: statusColor },
                        ]}
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
                    style={[
                      styles.jobDivider,
                      { backgroundColor: colors.border },
                    ]}
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
        visible={Boolean(editingCampaign)}
        campaign={editingCampaign}
        assistants={assistants}
        phoneNumbers={numbers}
        onClose={() => setEditingCampaign(null)}
        onSubmit={async (campaignId, payload) => {
          await updateMutation.mutateAsync({ id: campaignId, payload });
        }}
        isLoading={updateMutation.isPending}
      />

      <CampaignDetailsModal
        visible={Boolean(selectedCampaign)}
        campaign={selectedCampaign}
        onClose={() => setSelectedCampaign(null)}
        onEdit={(campaign) => {
          setSelectedCampaign(null);
          setEditingCampaign(campaign);
        }}
        onDelete={async (campaignId) => {
          await deleteMutation.mutateAsync(campaignId);
        }}
        onStatusChange={async (campaignId, status) => {
          await statusMutation.mutateAsync({ id: campaignId, status });
        }}
        isActionLoading={statusMutation.isPending || deleteMutation.isPending}
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
  topActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  csvTemplateBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  csvTemplateBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  addNewJobBtn: {
    flex: 1.2,
    height: 44,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowColor: "#5B3AF5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  addNewJobBtnText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 74,
    justifyContent: "center",
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  sectionHeaderRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  jobsCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  jobsCountBadgeText: {
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  jobsListCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  jobRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  jobRowPressed: {
    opacity: 0.75,
  },
  jobMainInfo: {
    flex: 1,
    gap: 3,
    marginRight: 10,
  },
  jobNameText: {
    fontSize: 14.5,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  jobDateText: {
    fontSize: 12,
    fontWeight: "500",
  },
  jobActionsWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inProgressPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },
  inProgressPillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  viewLogsBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  viewLogsText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 12.5,
    fontWeight: "500",
    textAlign: "center",
    maxWidth: 240,
    lineHeight: 17,
  },
  jobDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 14,
  },
  pressed: {
    opacity: 0.8,
  },
});
