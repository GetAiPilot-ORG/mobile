import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  BackHandler,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppScreen } from "../../../components/AppScreen";
import {
  ProductFloatingBottomBar,
  ProductTabItem,
} from "../../../components/ProductFloatingBottomBar";
import { useTheme } from "../../../contexts/ThemeContext";
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
      } else {
        router.replace("/(tabs)/products");
      }
      return true;
    };

    const sub = BackHandler.addEventListener(
      "hardwareBackPress",
      onHardwareBack,
    );
    return () => sub.remove();
  }, [activeTab, router]);

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

  const statusBarHeight =
    Platform.OS === "android" ? StatusBar.currentHeight || 28 : 0;
  const topPadding =
    Math.max(insets.top, statusBarHeight) +
    (Platform.OS === "android" ? 10 : 6);

  const colors = {
    background: isDark ? "#000000" : "#F7F8FA",
    headerBg: isDark ? "#000000" : "#F7F8FA",
    text: isDark ? "#FFFFFF" : "#0F172A",
    textSecondary: isDark ? "#94A3B8" : "#64748B",
    primary: "#5844E3",
    border: isDark ? "#2A2A2E" : "#E8EAF0",
  };

  return (
    <AppScreen safeArea={false}>
      {/* 1. TOP HEADER */}
      <View
        style={[
          styles.headerContainer,
          {
            paddingTop: topPadding,
            backgroundColor: colors.headerBg,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Pressable
            onPress={handleBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.backButton}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={colors.text}
            />
          </Pressable>

          <View style={styles.brandTitleContainer}>
            <Text style={[styles.brandMainTitle, { color: colors.text }]}>
              Voice Pilot
            </Text>
          </View>
        </View>
      </View>

      {/* 2. ACTIVE SCREEN CONTENT */}
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background },
        ]}
      >
        <View style={styles.screenContainer}>
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

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    width: "100%",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  backButton: {
    paddingRight: 2,
    paddingVertical: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  brandTitleContainer: {
    justifyContent: "center",
  },
  brandMainTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  brandSubTitle: {
    fontSize: 12.5,
    fontWeight: "600",
    letterSpacing: -0.2,
    marginTop: -1,
  },

  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
});
