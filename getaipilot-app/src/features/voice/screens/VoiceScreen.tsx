import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  BackHandler,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppScreen } from "../../../components/AppScreen";
import {
  ProductFloatingBottomBar,
  ProductTabItem,
} from "../../../components/ProductFloatingBottomBar";
import { useTheme, getColors } from "../../../theme";
import { voiceApi } from "../api/voiceApi";
import {
  CreateAgentModal,
  CreateCampaignModal,
  TriggerCallModal,
} from "../components";
import { CallsScreen } from "./CallsScreen";
import { CampaignsScreen } from "./CampaignsScreen";
import { ContactsScreen } from "./ContactsScreen";
import { VoiceOverviewScreen } from "./VoiceOverviewScreen";

type VoiceTabKey = "overview" | "calls" | "campaigns" | "contacts";

const VOICE_TABS: ProductTabItem[] = [
  {
    key: "overview",
    label: "Overview",
    activeIcon: "home",
    inactiveIcon: "home-outline",
    description: "Executive pulse briefing",
  },
  {
    key: "calls",
    label: "Calls",
    activeIcon: "call",
    inactiveIcon: "call-outline",
    description: "Make and manage your AI calls",
  },
  {
    key: "campaigns",
    label: "Campaigns",
    activeIcon: "megaphone",
    inactiveIcon: "megaphone-outline",
    description: "Create and manage AI campaigns",
  },
  {
    key: "contacts",
    label: "Contacts",
    activeIcon: "people",
    inactiveIcon: "people-outline",
    description: "Contacts, numbers & settings",
  },
];

export const VoiceScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<VoiceTabKey>("overview");
  const [isOverviewTriggerModalOpen, setIsOverviewTriggerModalOpen] =
    useState(false);
  const [selectedAssistantForCall, setSelectedAssistantForCall] = useState("");
  const [isOverviewCreateCampaignOpen, setIsOverviewCreateCampaignOpen] =
    useState(false);
  const [isOverviewCreateAgentOpen, setIsOverviewCreateAgentOpen] =
    useState(false);

  const { data: assistants = [] } = useQuery({
    queryKey: ["voice", "assistants"],
    queryFn: () => voiceApi.getAssistants(),
  });

  const { data: numbers = [] } = useQuery({
    queryKey: ["voice", "numbers"],
    queryFn: () => voiceApi.getNumbers(),
  });

  const triggerCallMutation = useMutation({
    mutationFn: (payload: any) => voiceApi.triggerOutboundCall(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice", "calls"] });
      queryClient.invalidateQueries({ queryKey: ["voice", "overview"] });
      setIsOverviewTriggerModalOpen(false);
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: (payload: any) => voiceApi.createCampaign(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice", "campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["voice", "overview"] });
      setIsOverviewCreateCampaignOpen(false);
    },
  });

  const createAgentMutation = useMutation({
    mutationFn: (payload: any) => voiceApi.createAssistant(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice", "assistants"] });
      queryClient.invalidateQueries({ queryKey: ["voice", "overview"] });
      setIsOverviewCreateAgentOpen(false);
    },
  });

  useEffect(() => {
    const onHardwareBack = () => {
      if (activeTab !== "overview") {
        setActiveTab("overview");
        return true;
      }
      if (router.canGoBack()) {
        router.back();
        return true;
      }
      router.replace("/(tabs)/products");
      return true;
    };

    const sub = BackHandler.addEventListener(
      "hardwareBackPress",
      onHardwareBack,
    );
    return () => sub.remove();
  }, [activeTab]);

  const handleBack = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (activeTab !== "overview") {
      setActiveTab("overview");
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/products");
    }
  };

  const topPadding = Math.max(
    insets.top,
    Platform.OS === "ios" ? 44 : 12,
  );

  const themeColors = getColors(isDark);
  const colors = {
    ...themeColors,
    background: themeColors.background,
    headerBg: themeColors.background,
    text: themeColors.text,
    textSecondary: themeColors.textMuted,
    primary: themeColors.products?.voice || "#5844E3",
    border: themeColors.border,
  };

  return (
    <AppScreen safeArea={false}>
      {/* 1. TOP HEADER */}
      <View
        className="flex-row items-center justify-between px-4 pb-2 w-full max-w-[1100px] self-center"
        style={{
          paddingTop: topPadding,
          backgroundColor: colors.headerBg,
        }}
      >
        <View className="flex-row items-center gap-1.5">
          <Pressable
            onPress={handleBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-10 h-10 rounded-full justify-center items-center mr-2 border active:opacity-70 active:scale-95 shadow-sm"
            style={{
              backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
              borderColor: isDark ? "#2C2C2E" : "#E5E7EB",
            }}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={colors.text}
            />
          </Pressable>

          <View className="justify-center">
            <Text
              className="text-xl font-extrabold tracking-tight"
              style={{ color: colors.text }}
            >
              Voice Pilot
            </Text>
          </View>
        </View>
      </View>

      {/* 2. ACTIVE SCREEN CONTENT */}
      <View
        className="flex-1 w-full"
        style={{ backgroundColor: colors.background }}
      >
        <View className="flex-1 w-full max-w-[1100px] self-center">
          {activeTab === "overview" && (
            <VoiceOverviewScreen
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenTriggerCall={(assistantId) => {
                setSelectedAssistantForCall(assistantId || "");
                setIsOverviewTriggerModalOpen(true);
              }}
              onOpenCreateCampaign={() =>
                setIsOverviewCreateCampaignOpen(true)
              }
              onOpenCreateAssistant={() =>
                setIsOverviewCreateAgentOpen(true)
              }
            />
          )}
          {activeTab === "calls" && <CallsScreen />}
          {activeTab === "campaigns" && <CampaignsScreen />}
          {activeTab === "contacts" && <ContactsScreen />}
        </View>

        {/* 3. BOTTOM FLOATING TAB BAR */}
        <ProductFloatingBottomBar
          items={VOICE_TABS}
          activeKey={activeTab}
          onChangeTab={(key) => setActiveTab(key as VoiceTabKey)}
          accentColor="#5844E3"
          moreMenuTitle="Voice Navigation"
        />
      </View>

      {/* Modals */}
      <TriggerCallModal
        visible={isOverviewTriggerModalOpen}
        assistants={assistants}
        initialAssistantId={selectedAssistantForCall}
        onClose={() => {
          setIsOverviewTriggerModalOpen(false);
          setSelectedAssistantForCall("");
        }}
        onSubmit={async (payload) => {
          await triggerCallMutation.mutateAsync(payload);
        }}
        isLoading={triggerCallMutation.isPending}
      />

      <CreateCampaignModal
        visible={isOverviewCreateCampaignOpen}
        assistants={assistants}
        phoneNumbers={numbers}
        onClose={() => setIsOverviewCreateCampaignOpen(false)}
        onSubmit={async (payload) => {
          await createCampaignMutation.mutateAsync(payload);
        }}
        isLoading={createCampaignMutation.isPending}
      />

      <CreateAgentModal
        visible={isOverviewCreateAgentOpen}
        onClose={() => setIsOverviewCreateAgentOpen(false)}
        onSubmit={async (payload) => {
          await createAgentMutation.mutateAsync(payload);
        }}
        isLoading={createAgentMutation.isPending}
      />
    </AppScreen>
  );
};
