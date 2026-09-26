import {
  Ionicons } from "@expo/vector-icons";
import { useMutation,
  useQuery,
  useQueryClient } from "@tanstack/react-query";
import { useCallback,
  useMemo,
  useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CampaignSkeleton } from "../../../components/skeletonScreen/CampaiganSkeleton";
import { supabase } from "../../../lib/supabase";
import { voiceSupabase } from "../../../lib/voice-supabase";
import { useTheme, getColors } from '@/theme';

type CampaignStatus =
  | "draft"
  | "pending"
  | "queued"
  | "running"
  | "in_progress"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "paused"
  | string;

interface Campaign {
  id: string;
  name?: string;
  status?: CampaignStatus;

  total_contacts?: number;
  totalContacts?: number;

  completed_contacts?: number;
  completedContacts?: number;

  failed_contacts?: number;
  failedContacts?: number;

  pending_contacts?: number;
  pendingContacts?: number;

  dispatched?: number;
  total_dispatched?: number;
  totalDispatched?: number;

  progress?: number;

  created_at?: string;
  createdAt?: string;

  updated_at?: string;
  updatedAt?: string;

  assistant_id?: string;
  assistantId?: string;

  phone_number_id?: string;
  phoneNumberId?: string;

  [key: string]: any;
}

const campaignApi = {
  async getCampaigns(): Promise<Campaign[]> {
    try {
      // Project A
      const {
        data: { user },
        error: sessionError,
      } = await supabase.auth.getUser();

      console.log("Project A user:", user);
      console.log("Project A auth error:", sessionError);

      if (sessionError) {
        throw sessionError;
      }

      if (!user) {
        console.log("No authenticated user in Project A");
        return [];
      }

      console.log("User ID:", user.id);

      // Project B
      const { data: campaigns, error: voiceError } = await voiceSupabase
        .from("campaigns")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      console.log("Project B campaigns:", campaigns);
      console.log("Project B error:", voiceError);

      if (voiceError) {
        throw voiceError;
      }

      return campaigns ?? [];
    } catch (error) {
      console.error("getCampaigns error:", error);
      throw error;
    }
  },
};
function getStatus(campaign: Campaign): string {
  return String(campaign.status || "draft").toLowerCase();
}

function getTotalContacts(campaign: Campaign): number {
  return Number(
    campaign.total_contacts ??
      campaign.totalContacts ??
      campaign.total_dispatched ??
      campaign.totalDispatched ??
      0,
  );
}

function getCompletedContacts(campaign: Campaign): number {
  return Number(
    campaign.completed_contacts ??
      campaign.completedContacts ??
      campaign.dispatched ??
      0,
  );
}

function getFailedContacts(campaign: Campaign): number {
  return Number(campaign.failed_contacts ?? campaign.failedContacts ?? 0);
}

function getPendingContacts(campaign: Campaign): number {
  const explicitPending = campaign.pending_contacts ?? campaign.pendingContacts;

  if (explicitPending !== undefined && explicitPending !== null) {
    return Number(explicitPending);
  }

  const total = getTotalContacts(campaign);
  const completed = getCompletedContacts(campaign);
  const failed = getFailedContacts(campaign);

  return Math.max(total - completed - failed, 0);
}

function getProgress(campaign: Campaign): number {
  if (campaign.progress !== undefined && campaign.progress !== null) {
    const value = Number(campaign.progress);

    if (value > 1) {
      return Math.min(Math.max(value, 0), 100);
    }

    return Math.min(Math.max(value * 100, 0), 100);
  }

  const total = getTotalContacts(campaign);

  if (!total) {
    return getStatus(campaign) === "completed" ? 100 : 0;
  }

  const completed = getCompletedContacts(campaign);
  const failed = getFailedContacts(campaign);

  return Math.min(Math.max(((completed + failed) / total) * 100, 0), 100);
}

function formatDate(date?: string) {
  if (!date) return "No date";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "No date";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function getStatusLabel(status: string) {
  switch (status) {
    case "running":
      return "Running";

    case "in_progress":
      return "In Progress";

    case "processing":
      return "Processing";

    case "queued":
      return "Queued";

    case "pending":
      return "Pending";

    case "completed":
      return "Completed";

    case "failed":
      return "Failed";

    case "cancelled":
      return "Cancelled";

    case "paused":
      return "Paused";

    case "draft":
      return "Draft";

    default:
      return status
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "completed":
      return "#16A34A";

    case "running":
    case "in_progress":
    case "processing":
      return "#2563EB";

    case "queued":
    case "pending":
      return "#F59E0B";

    case "paused":
      return "#8B5CF6";

    case "failed":
    case "cancelled":
      return "#EF4444";

    case "draft":
    default:
      return "#64748B";
  }
}

function getStatusBackground(status: string, isDark: boolean) {
  switch (status) {
    case "completed":
      return isDark ? "#12351F" : "#DCFCE7";

    case "running":
    case "in_progress":
    case "processing":
      return isDark ? "#102B4D" : "#DBEAFE";

    case "queued":
    case "pending":
      return isDark ? "#3A2B0D" : "#FEF3C7";

    case "paused":
      return isDark ? "#2E1D4D" : "#EDE9FE";

    case "failed":
    case "cancelled":
      return isDark ? "#451A1A" : "#FEE2E2";

    default:
      return isDark ? "#27272A" : "#F1F5F9";
  }
}

function StatCard({
  title,
  value,
  icon,
  isDark,
  iconColor,
}: {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  isDark: boolean;
  iconColor: string;
}) {
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: isDark ? "#17181C" : "#FFFFFF",
          borderColor: isDark ? "#292B32" : "#E5E7EB",
        },
      ]}
    >
      <View
        style={[
          styles.statIcon,
          {
            backgroundColor: isDark ? `${iconColor}22` : `${iconColor}15`,
          },
        ]}
      >
        <Ionicons name={icon} size={19} color={iconColor} />
      </View>

      <Text
        style={[
          styles.statValue,
          {
            color: isDark ? "#FFFFFF" : "#111827",
          },
        ]}
      >
        {value}
      </Text>

      <Text
        style={[
          styles.statTitle,
          {
            color: isDark ? "#9CA3AF" : "#6B7280",
          },
        ]}
      >
        {title}
      </Text>
    </View>
  );
}

function CampaignCard({
  campaign,
  isDark,
  onPress,
  onStart,
  starting,
}: {
  campaign: Campaign;
  isDark: boolean;
  onPress: () => void;
  onStart: () => void;
  starting: boolean;
}) {
  const status = getStatus(campaign);
  const statusColor = getStatusColor(status);
  const statusBackground = getStatusBackground(status, isDark);

  const total = getTotalContacts(campaign);
  const completed = getCompletedContacts(campaign);
  const failed = getFailedContacts(campaign);
  const pending = getPendingContacts(campaign);
  const progress = getProgress(campaign);

  const canStart =
    status === "draft" || status === "paused" || status === "pending";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.campaignCard,
        {
          backgroundColor: isDark ? "#17181C" : "#FFFFFF",
          borderColor: isDark ? "#292B32" : "#E5E7EB",
          opacity: pressed ? 0.96 : 1,
        },
      ]}
    >
      <View style={styles.campaignHeader}>
        <View style={styles.campaignTitleWrapper}>
          <View
            style={[
              styles.campaignIcon,
              {
                backgroundColor: isDark ? "#25272D" : "#EFF6FF",
              },
            ]}
          >
            <Ionicons name="megaphone-outline" size={20} color="#2563EB" />
          </View>

          <View style={styles.campaignTitleContent}>
            <Text
              numberOfLines={1}
              style={[
                styles.campaignName,
                {
                  color: isDark ? "#FFFFFF" : "#111827",
                },
              ]}
            >
              {campaign.name || "Untitled Campaign"}
            </Text>

            <Text
              style={[
                styles.campaignDate,
                {
                  color: isDark ? "#8B8D96" : "#6B7280",
                },
              ]}
            >
              Created {formatDate(campaign.created_at || campaign.createdAt)}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: statusBackground,
            },
          ]}
        >
          {status === "running" ||
          status === "in_progress" ||
          status === "processing" ? (
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: statusColor,
                },
              ]}
            />
          ) : null}

          <Text
            style={[
              styles.statusText,
              {
                color: statusColor,
              },
            ]}
          >
            {getStatusLabel(status)}
          </Text>
        </View>
      </View>

      <View style={styles.progressHeader}>
        <Text
          style={[
            styles.progressLabel,
            {
              color: isDark ? "#9CA3AF" : "#6B7280",
            },
          ]}
        >
          Campaign progress
        </Text>

        <Text
          style={[
            styles.progressValue,
            {
              color: isDark ? "#FFFFFF" : "#111827",
            },
          ]}
        >
          {Math.round(progress)}%
        </Text>
      </View>

      <View
        style={[
          styles.progressTrack,
          {
            backgroundColor: isDark ? "#2A2C33" : "#E5E7EB",
          },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${progress}%`,
              backgroundColor: statusColor,
            },
          ]}
        />
      </View>

      <View style={styles.metricsRow}>
        <Metric label="Total" value={total} isDark={isDark} />

        <Metric label="Completed" value={completed} isDark={isDark} />

        <Metric label="Pending" value={pending} isDark={isDark} />

        <Metric label="Failed" value={failed} isDark={isDark} />
      </View>

      {canStart ? (
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onStart();
          }}
          disabled={starting}
          style={({ pressed }) => [
            styles.startButton,
            {
              opacity: starting ? 0.6 : pressed ? 0.85 : 1,
            },
          ]}
        >
          {starting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="play" size={16} color="#FFFFFF" />

              <Text style={styles.startButtonText}>Start Campaign</Text>
            </>
          )}
        </Pressable>
      ) : null}
    </Pressable>
  );
}

function Metric({
  label,
  value,
  isDark,
}: {
  label: string;
  value: number;
  isDark: boolean;
}) {
  return (
    <View style={styles.metric}>
      <Text
        style={[
          styles.metricValue,
          {
            color: isDark ? "#FFFFFF" : "#111827",
          },
        ]}
      >
        {formatNumber(value)}
      </Text>

      <Text
        style={[
          styles.metricLabel,
          {
            color: isDark ? "#8B8D96" : "#6B7280",
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function CampaignsScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const queryClient = useQueryClient();

  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null,
  );

  const [startingCampaignId, setStartingCampaignId] = useState<string | null>(
    null,
  );

  const {
    data: campaigns = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["voice-campaigns"],
    queryFn: campaignApi.getCampaigns,
    staleTime: 15000,
  });

  const startMutation = useMutation({
    mutationFn: (campaignId: string) => campaignApi.startCampaign(campaignId),

    onMutate: (campaignId) => {
      setStartingCampaignId(campaignId);
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["voice-campaigns"],
      });

      Alert.alert(
        "Campaign Started",
        "The campaign has been started successfully.",
      );
    },

    onError: (mutationError: any) => {
      Alert.alert(
        "Unable to Start",
        mutationError?.response?.data?.message ||
          mutationError?.message ||
          "Unable to start the campaign.",
      );
    },

    onSettled: () => {
      setStartingCampaignId(null);
    },
  });

  const stats = useMemo(() => {
    const completedCampaigns = campaigns.filter(
      (campaign) => getStatus(campaign) === "completed",
    ).length;

    const totalDispatch = campaigns.reduce(
      (sum, campaign) => sum + getCompletedContacts(campaign),
      0,
    );

    const inProgressCampaigns = campaigns.filter((campaign) =>
      ["running", "in_progress", "processing", "queued"].includes(
        getStatus(campaign),
      ),
    ).length;

    return {
      completedCampaigns,
      totalDispatch,
      inProgressCampaigns,
    };
  }, [campaigns]);

  const handleCampaignPress = useCallback((campaign: Campaign) => {
    setSelectedCampaign(campaign);
  }, []);

  const handleStartCampaign = useCallback(
    (campaign: Campaign) => {
      if (!campaign.id) {
        Alert.alert("Invalid Campaign", "Campaign ID is missing.");
        return;
      }

      Alert.alert(
        "Start Campaign",
        `Are you sure you want to start "${campaign.name || "this campaign"}"?`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Start",
            onPress: () => {
              startMutation.mutate(campaign.id);
            },
          },
        ],
      );
    },
    [startMutation],
  );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const backgroundColor = isDark ? "#0D0E11" : "#F8FAFC";

  const textColor = isDark ? "#FFFFFF" : "#111827";

  const secondaryColor = isDark ? "#8B8D96" : "#6B7280";

  return (
    <SafeAreaView
      edges={["top"]}
      style={[
        styles.safeArea,
        {
          backgroundColor,
        },
      ]}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text
              style={[
                styles.headerTitle,
                {
                  color: textColor,
                },
              ]}
            >
              Campaigns
            </Text>

            <Text
              style={[
                styles.headerSubtitle,
                {
                  color: secondaryColor,
                },
              ]}
            >
              Manage and track your campaigns
            </Text>
          </View>

          <Pressable
            onPress={handleRefresh}
            style={[
              styles.refreshButton,
              {
                backgroundColor: isDark ? "#1A1B20" : "#FFFFFF",
                borderColor: isDark ? "#292B32" : "#E5E7EB",
              },
            ]}
          >
            <Ionicons
              name="refresh"
              size={20}
              color={isDark ? "#FFFFFF" : "#111827"}
            />
          </Pressable>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Completed"
            value={stats.completedCampaigns}
            icon="checkmark-circle"
            iconColor="#16A34A"
            isDark={isDark}
          />

          <StatCard
            title="Total Dispatch"
            value={formatNumber(stats.totalDispatch)}
            icon="paper-plane"
            iconColor="#2563EB"
            isDark={isDark}
          />

          <StatCard
            title="In Progress"
            value={stats.inProgressCampaigns}
            icon="pulse"
            iconColor="#F59E0B"
            isDark={isDark}
          />
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: textColor,
                },
              ]}
            >
              All Campaigns
            </Text>

            <Text
              style={[
                styles.sectionSubtitle,
                {
                  color: secondaryColor,
                },
              ]}
            >
              {campaigns.length}{" "}
              {campaigns.length === 1 ? "campaign" : "campaigns"}
            </Text>
          </View>

          {isFetching && !isLoading ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : null}
        </View>

        {/* Content */}
        {isLoading ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            <CampaignSkeleton isDark={isDark} />
            <CampaignSkeleton isDark={isDark} />
            <CampaignSkeleton isDark={isDark} />
          </ScrollView>
        ) : isError ? (
          <View style={styles.centerState}>
            <View
              style={[
                styles.stateIcon,
                {
                  backgroundColor: isDark ? "#451A1A" : "#FEE2E2",
                },
              ]}
            >
              <Ionicons name="alert-circle-outline" size={30} color="#EF4444" />
            </View>

            <Text
              style={[
                styles.stateTitle,
                {
                  color: textColor,
                },
              ]}
            >
              Unable to load campaigns
            </Text>

            <Text
              style={[
                styles.stateMessage,
                {
                  color: secondaryColor,
                },
              ]}
            >
              {error instanceof Error
                ? error.message
                : "Something went wrong while loading campaigns."}
            </Text>

            <Pressable onPress={handleRefresh} style={styles.retryButton}>
              <Ionicons name="refresh" size={17} color="#FFFFFF" />

              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        ) : campaigns.length === 0 ? (
          <View style={styles.centerState}>
            <View
              style={[
                styles.stateIcon,
                {
                  backgroundColor: isDark ? "#1E293B" : "#EFF6FF",
                },
              ]}
            >
              <Ionicons name="megaphone-outline" size={30} color="#2563EB" />
            </View>

            <Text
              style={[
                styles.stateTitle,
                {
                  color: textColor,
                },
              ]}
            >
              No campaigns yet
            </Text>

            <Text
              style={[
                styles.stateMessage,
                {
                  color: secondaryColor,
                },
              ]}
            >
              Your campaigns will appear here once they are created.
            </Text>
          </View>
        ) : (
          <FlatList
            data={campaigns}
            keyExtractor={(item, index) => item.id || `campaign-${index}`}
            renderItem={({ item }) => (
              <CampaignCard
                campaign={item}
                isDark={isDark}
                onPress={() => handleCampaignPress(item)}
                onStart={() => handleStartCampaign(item)}
                starting={startingCampaignId === item.id}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isFetching && !isLoading}
                onRefresh={handleRefresh}
                tintColor="#2563EB"
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  container: {
    flex: 1,
    paddingHorizontal: 16,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 18,
  },

  headerTitle: {
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  headerSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },

  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  statsContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },

  statCard: {
    flex: 1,
    minHeight: 122,
    borderWidth: 1,
    borderRadius: 17,
    padding: 13,
  },

  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  statValue: {
    fontSize: 21,
    fontWeight: "800",
  },

  statTitle: {
    fontSize: 11,
    marginTop: 3,
    fontWeight: "500",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
  },

  sectionSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },

  listContent: {
    paddingBottom: 30,
  },

  campaignCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },

  campaignHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  campaignTitleWrapper: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 8,
  },

  campaignIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  campaignTitleContent: {
    flex: 1,
    marginLeft: 11,
  },

  campaignName: {
    fontSize: 16,
    // fontWeight: "750",
  },

  campaignDate: {
    fontSize: 11,
    marginTop: 4,
  },

  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 7,
  },

  progressLabel: {
    fontSize: 11,
    fontWeight: "500",
  },

  progressValue: {
    fontSize: 12,
    fontWeight: "800",
  },

  progressTrack: {
    height: 7,
    borderRadius: 10,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 10,
  },

  metricsRow: {
    flexDirection: "row",
    marginTop: 17,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#00000012",
  },

  metric: {
    flex: 1,
  },

  metricValue: {
    fontSize: 14,
    // fontWeight: "750",
  },

  metricLabel: {
    fontSize: 10,
    marginTop: 3,
  },

  startButton: {
    height: 42,
    borderRadius: 12,
    marginTop: 15,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },

  startButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  stateIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  stateTitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },

  stateMessage: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 7,
  },

  retryButton: {
    height: 42,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    marginTop: 18,
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  skeletonCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },

  skeletonLarge: {
    width: "60%",
    height: 18,
    borderRadius: 7,
  },

  skeletonMedium: {
    width: "35%",
    height: 12,
    borderRadius: 6,
    marginTop: 9,
  },

  skeletonLine: {
    width: "100%",
    height: 7,
    borderRadius: 5,
    marginTop: 17,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },

  modalContainer: {
    height: "82%",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: "hidden",
  },

  modalHeader: {
    height: 68,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#00000012",
  },

  modalTitle: {
    fontSize: 19,
    fontWeight: "800",
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  modalContent: {
    padding: 18,
    paddingBottom: 40,
  },

  detailCampaignName: {
    fontSize: 23,
    fontWeight: "800",
  },

  detailStatus: {
    alignSelf: "flex-start",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 10,
  },

  detailProgressSection: {
    marginTop: 24,
  },

  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 22,
  },

  detailBox: {
    width: "48%",
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 15,
    padding: 13,
  },

  detailBoxValue: {
    fontSize: 19,
    fontWeight: "800",
    marginTop: 9,
  },

  detailBoxTitle: {
    fontSize: 11,
    marginTop: 2,
  },

  detailRow: {
    minHeight: 55,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 15,
  },

  detailRowLabel: {
    fontSize: 12,
    fontWeight: "500",
  },

  detailRowValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 12,
    fontWeight: "600",
  },
});
