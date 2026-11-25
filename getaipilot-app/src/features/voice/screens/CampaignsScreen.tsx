import { ProductButton,ProductEmpty,ProductHeading,ProductMetrics,ProductRow,ProductSection } from "@/components/ProductUI";
import { getColors,useTheme } from "@/theme";
import { useMutation,useQuery,useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import React,{ useState } from "react";
import {
ActivityIndicator,
Alert,
RefreshControl,
ScrollView,
View
} from "react-native";
import { VoiceCampaign,voiceApi } from "../api/voiceApi";
import {
CampaignDetailsModal,
CreateCampaignModal,
EditCampaignModal,
VoicePlanExpiredBanner,
} from "../components";

function getStatus(campaign: VoiceCampaign): string {
  return String(campaign.status || "draft").toLowerCase();
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

  const { data: overviewData } = useQuery({
    queryKey: ["voice", "overview"],
    queryFn: () => voiceApi.getOverview(),
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
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 110,
        gap: 8,
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
      <ProductHeading title="Your campaigns">
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <ProductButton label="New campaign" onPress={() => setIsCreateModalOpen(true)} />
          <ProductButton label="CSV template" secondary icon="document-text-outline" onPress={handleDownloadCsvTemplate} />
        </View>
      </ProductHeading>
      {Boolean(overviewData?.isPlanExpired) && <VoicePlanExpiredBanner overview={overviewData} />}
      <ProductMetrics items={[{ label: "Campaigns", value: totalDispatchJobs }, { label: "Completed", value: completedCampaigns }, { label: "Running", value: inProgressCampaigns }]} />
      <ProductSection title="All campaigns">
        {isLoading ? <ActivityIndicator color={colors.accent} /> : campaigns.length === 0 ? <ProductEmpty title="Reach your next audience" description="Add contacts and an assistant to start a calling campaign." action="Create campaign" onAction={() => setIsCreateModalOpen(true)} /> :
          campaigns.map((campaign) => <ProductRow key={campaign.id} title={campaign.name} detail={getStatus(campaign).replace(/_/g, " ") + " · " + campaign.total_contacts + " contacts"} icon="megaphone-outline" tone="lavender" onPress={() => setSelectedCampaign(campaign)} />)}
      </ProductSection>

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
