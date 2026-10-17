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
      {/* 1. TOP HEADER BANNER (Like WhatsApp Suite) */}
      <View
        className="px-4 pb-3.5 shadow-sm w-full"
        style={{
          paddingTop: topPadding,
          backgroundColor: isDark
            ? (themeColors.products?.voiceHeader || "#1C162E")
            : (themeColors.products?.voiceHeader || "#4C1D95"),
          borderBottomWidth: 0,
          elevation: 4,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
        }}
      >
        <View className="flex-row items-center gap-1.5">
          <Pressable
            onPress={handleBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-10 h-10 rounded-full justify-center items-center mr-2 active:opacity-70 active:scale-95 shadow-xs"
            style={{
              backgroundColor: isDark ? "#252230" : "#FFFFFF",
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
              className="text-xl font-semibold tracking-tight"
              style={{ color: colors.text }}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color="#FFFFFF"
              />
            </Pressable>

            <View className="flex-row items-center gap-2.5 flex-1 min-w-0">
              <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center shrink-0">
                <Ionicons name="call" size={17} color="#E9D5FF" />
              </View>
              <View className="flex-1 min-w-0">
                <Text
                  className="text-lg font-bold tracking-tight text-white"
                  numberOfLines={1}
                >
                  Voice Pilot
                </Text>
                <Text
                  className="text-[11px] text-purple-200/90 font-medium"
                  numberOfLines={1}
                >
                  AI Telephony & Voice Agents
                </Text>
              </View>
            </View>
          </View>

          {/* Right Live Gateway Status Pill */}
          <View className="flex-row items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-full shrink-0">
            <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <Text className="text-[11px] font-bold text-white">
              Gateway Live
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
          accentColor={themeColors.products?.voice || "#A855F7"}
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
