import { FeaturePlanModal } from "@/components/FeaturePlanModal";
import { ProductActions, ProductButton, ProductEmpty, ProductMetrics, ProductRow, ProductSection, useProductPalette } from "@/components/ProductUI";
import { usePlatformSubscription } from "@/hooks/usePlatformSubscription";
import { useTheme } from "@/theme";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  View
} from "react-native";
import { VoiceOverview, voiceApi } from "../api/voiceApi";
import { VoicePlanExpiredBanner } from "../components";
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
  const queryClient = useQueryClient();
  const { isDark } = useTheme();
  const palette = useProductPalette();
  const { hasVoice } = usePlatformSubscription();
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [lockedFeatureName, setLockedFeatureName] = useState("AI Voice Calls");

  const openLockModal = (name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLockedFeatureName(name);
    setPlanModalVisible(true);
  };

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
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: palette.background }}
        contentContainerStyle={{ padding: 20, paddingBottom: 130 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetch();
              queryClient.invalidateQueries({ queryKey: ["voice", "assistants"] });
              queryClient.invalidateQueries({ queryKey: ["voice", "numbers"] });
            }}
            tintColor={palette.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {data?.isPlanExpired && (
          <VoicePlanExpiredBanner
            overview={data}
            onNavigateToLines={() => navigate("contacts")}
          />
        )}

        <View
          style={{
            flexDirection: "row",
            gap: 12,
            marginBottom: 26,
          }}
        >
          {/* Left: A better way to call */}
          <View
            style={{
              flex: 1,
              backgroundColor: palette.card,
              borderRadius: 24,
              padding: 18,
              justifyContent: "space-between",
              gap: 16,
              minHeight: 185,
            }}
          >
            <View style={{ gap: 6 }}>
              <Text
                style={{
                  fontSize: 22,
                  lineHeight: 27,
                  letterSpacing: -0.5,
                  fontWeight: "600",
                  color: palette.text,
                }}
              >
                {"A better way\nto call."}
              </Text>
            </View>

            <ProductButton
              label="Make a call"
              fullWidth
              isLocked={!hasVoice}
              onPress={() => {
                if (!hasVoice) {
                  openLockModal("AI Voice Calls");
                  return;
                }
                onOpenTriggerCall?.();
              }}
            />
          </View>

          {/* Right: Your calling balance */}
          <View
            style={{
              flex: 1,
              backgroundColor: palette.lavender,
              borderRadius: 24,
              padding: 18,
              justifyContent: "space-between",
              gap: 16,
              minHeight: 185,
            }}
          >
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 13, color: palette.textSecondary, fontWeight: "500" }}>
                Your calling balance
              </Text>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "600",
                  color: palette.text,
                  letterSpacing: -0.5,
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {rawMinutes.toLocaleString()}{" "}
                <Text style={{ fontSize: 14, fontWeight: "500", color: palette.textSecondary }}>
                  AI mins
                </Text>
              </Text>
            </View>

            <ProductButton
              label="Add minutes"
              fullWidth
              isLocked={!hasVoice}
              onPress={() => {
                if (!hasVoice) {
                  openLockModal("AI Calling Minutes");
                  return;
                }
                openVoiceWebBilling(queryClient, isDark);
              }}
            />
          </View>
        </View>

        <ProductMetrics
          items={[
            { label: "Assistants", value: totalAssistantsCount },
            { label: "Campaigns", value: activeCampaignsCount, onPress: () => navigate("campaigns") },
            { label: "Calls", value: totalCallsCount, onPress: () => navigate("calls") },
          ]}
        />

        <ProductSection title="Get started">
          <ProductActions
            items={[
              {
                title: "New assistant",
                icon: "sparkles-outline",
                tone: "lavender",
                isLocked: !hasVoice,
                onPress: () => {
                  if (!hasVoice) {
                    openLockModal("AI Voice Assistants");
                    return;
                  }
                  onOpenCreateAssistant?.();
                },
              },
              {
                title: "New campaign",
                icon: "megaphone-outline",
                tone: "mint",
                isLocked: !hasVoice,
                onPress: () => {
                  if (!hasVoice) {
                    openLockModal("Voice Campaigns");
                    return;
                  }
                  if (onOpenCreateCampaign) {
                    onOpenCreateCampaign();
                  } else {
                    navigate("campaigns");
                  }
                },
              },
              {
                title: "Call history",
                icon: "call-outline",
                tone: "peach",
                onPress: () => navigate("calls"),
              },
            ]}
          />
        </ProductSection>

        <ProductSection
          title="Your assistants"
          action="Add new"
          onAction={() => {
            if (!hasVoice) {
              openLockModal("Custom AI Voice Assistants");
              return;
            }
            onOpenCreateAssistant?.();
          }}
        >
          {assistants.length === 0 ? (
            <ProductEmpty
              title={isLoading ? "Loading assistants…" : "Your first assistant starts here"}
              description="Set up a voice and instructions for your calls."
              action="Create assistant"
              onAction={() => {
                if (!hasVoice) {
                  openLockModal("Custom AI Voice Assistants");
                  return;
                }
                onOpenCreateAssistant?.();
              }}
            />
          ) : (
            assistants.map((assistant) => (
              <ProductRow
                key={assistant.id}
                title={assistant.name}
                detail="Choose for a call"
                icon="sparkles-outline"
                tone="lavender"
                isLocked={!hasVoice}
                onPress={() => {
                  if (!hasVoice) {
                    openLockModal("AI Voice Calls");
                    return;
                  }
                  onOpenTriggerCall?.(assistant.id);
                }}
              />
            ))
          )}
        </ProductSection>

        <ProductSection title="Phone lines" onAction={() => navigate("contacts")}>
          {numbers.length === 0 ? (
            <ProductEmpty
              title="No phone lines yet"
              action="Manage lines"
              onAction={() => navigate("contacts")}
            />
          ) : (
            numbers.slice(0, 3).map((number) => (
              <ProductRow
                key={number.id}
                title={number.phone_number}
                detail={number.status}
                icon="phone-portrait-outline"
                onPress={() => navigate("contacts")}
              />
            ))
          )}
        </ProductSection>
      </ScrollView>

      <FeaturePlanModal
        visible={planModalVisible}
        onClose={() => setPlanModalVisible(false)}
        category="calling"
        featureName={lockedFeatureName}
      />
    </>
  );
};
