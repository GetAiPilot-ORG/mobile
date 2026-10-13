import { AppTopBar } from "@/components/AppTopBar";
import { ProductActions,ProductEmpty,ProductHeading,ProductMetrics,ProductRow,ProductSection } from "@/components/ProductUI";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React,{ useEffect,useState } from "react";
import {
BackHandler,
Modal,
Platform,
Pressable,
RefreshControl,
ScrollView,
Text,
View,
} from "react-native";
import {
ProductFloatingBottomBar,
ProductTabItem,
} from "../../../components/ProductFloatingBottomBar";
import { WhatsAppHomeSkeleton } from "../../../components/skeletonScreen";
import { getColors,useTheme } from "../../../theme";
import {
ConnectionStatusCard,
UsageCard
} from "../components";
import { useWhatsAppAccounts } from "../hooks/useWhatsAppAccounts";
import { useWhatsAppBroadcasts } from "../hooks/useWhatsAppBroadcasts";
import { useWhatsAppContacts } from "../hooks/useWhatsAppContacts";
import { useWhatsAppStatus } from "../hooks/useWhatsAppStatus";
import { useWhatsAppTemplates } from "../hooks/useWhatsAppTemplates";
import { useWhatsAppUsage } from "../hooks/useWhatsAppUsage";
import { WhatsAppBroadcastsScreen } from "./WhatsAppBroadcastsScreen";
import { WhatsAppContactsScreen } from "./WhatsAppContactsScreen";
import { WhatsAppTemplatesScreen } from "./WhatsAppTemplatesScreen";

type WhatsAppTab = "home" | "broadcasts" | "contacts" | "templates";

const WHATSAPP_TABS: ProductTabItem[] = [
  {
    key: "home",
    label: "Overview",
    activeIcon: "chatbubbles",
    inactiveIcon: "chatbubbles-outline",
  },
  {
    key: "broadcasts",
    label: "Broadcasts",
    activeIcon: "megaphone",
    inactiveIcon: "megaphone-outline",
  },
  {
    key: "contacts",
    label: "Contacts",
    activeIcon: "people",
    inactiveIcon: "people-outline",
  },
  {
    key: "templates",
    label: "Templates",
    activeIcon: "document-text",
    inactiveIcon: "document-text-outline",
  },
];

export const WhatsAppHomeScreen: React.FC = () => {
  const router = useRouter();
  const { isDark } = useTheme();
  const color = getColors(isDark);
  const [activeTab, setActiveTab] = useState<WhatsAppTab>("home");
  const [showAccountSwitcher, setShowAccountSwitcher] =
    useState<boolean>(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );

  const {
    data: status,
    isLoading: statusLoading,
    refetch: refetchStatus,
    isRefetching: statusRefetching,
  } = useWhatsAppStatus();
  const { data: accountsData, refetch: refetchAccounts } =
    useWhatsAppAccounts();
  const { data: contactsData, refetch: refetchContacts } = useWhatsAppContacts({
    limit: 5,
  });
  const { data: templates, refetch: refetchTemplates } =
    useWhatsAppTemplates("APPROVED");
  const { data: broadcastsData, refetch: refetchBroadcasts } =
    useWhatsAppBroadcasts({ limit: 3 });
  const { data: usage, refetch: refetchUsage } = useWhatsAppUsage();

  useEffect(() => {
    const onHardwareBack = () => {
      if (activeTab !== "home") {
        setActiveTab("home");
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
  }, [activeTab, router]);

  const handleRefresh = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await Promise.all([
      refetchStatus(),
      refetchAccounts(),
      refetchContacts(),
      refetchTemplates(),
      refetchBroadcasts(),
      refetchUsage(),
    ]);
  };

  const accounts = accountsData || [];
  const connectedAccounts = accounts.filter((a) => a.status === "connected");
  const activeAccount =
    connectedAccounts.find((a) => a.id === selectedAccountId) ||
    connectedAccounts[0];

  const currentConnection = activeAccount
    ? {
      connected: true,
      status: "connected",
      phone_number: activeAccount.display_phone_number,
      display_name: activeAccount.name,
      quality_rating: activeAccount.quality_rating,
      messaging_limit: activeAccount.messaging_limit,
    }
    : status?.connected
      ? status
      : undefined;

  const isConnected = Boolean(
    currentConnection?.connected && currentConnection?.phone_number,
  );

  const approvedTemplatesCount = templates?.length ?? 0;
  const totalContactsCount =
    contactsData?.total_count ?? contactsData?.contacts?.length ?? 0;
  const deliveryRate =
    usage && usage.messages_sent > 0
      ? `${Math.min(100, Math.round((usage.messages_delivered / usage.messages_sent) * 1000) / 10)}%`
      : "0%";

  const handleSelectTab = (tab: WhatsAppTab) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(tab);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: color.background }}>
      {activeTab === "contacts" && (
        <WhatsAppContactsScreen onBack={() => setActiveTab("home")} />
      )}
      {activeTab === "templates" && (
        <WhatsAppTemplatesScreen onBack={() => setActiveTab("home")} />
      )}
      {activeTab === "broadcasts" && (
        <WhatsAppBroadcastsScreen onBack={() => setActiveTab("home")} />
      )}

      {activeTab === "home" && (
        <View className="flex-1">
          <AppTopBar title="WhatsApp" onBackPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/products")} />
          {statusLoading && !status ? (
            <WhatsAppHomeSkeleton />
          ) : (
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ padding: 20 }}
              refreshControl={
                <RefreshControl
                  refreshing={statusRefetching}
                  onRefresh={handleRefresh}
                  tintColor="#25d366"
                />
              }
            >
              <ProductHeading title={"Messages that\nbring people closer."} />
              <ConnectionStatusCard connection={currentConnection} isLoading={statusLoading} hasMultipleAccounts={connectedAccounts.length > 1} onSwitchAccountPress={() => setShowAccountSwitcher(true)} />
              <ProductSection title="Your audience">
                <ProductActions items={[
                  { title: "Contacts", icon: "people-outline", tone: "mint", onPress: () => handleSelectTab("contacts") },
                  { title: "Templates", icon: "document-text-outline", tone: "lavender", onPress: () => handleSelectTab("templates") },
                  { title: "Broadcasts", icon: "megaphone-outline", tone: "peach", onPress: () => handleSelectTab("broadcasts") },
                ]} />
              </ProductSection>
              <ProductMetrics items={[
                { label: "Contacts", value: totalContactsCount, onPress: () => handleSelectTab("contacts") },
                { label: "Templates", value: approvedTemplatesCount, onPress: () => handleSelectTab("templates") },
                { label: "Delivery", value: deliveryRate },
              ]} />
              <ProductSection title="Recent broadcasts" onAction={() => handleSelectTab("broadcasts")}>
                {!broadcastsData?.broadcasts.length ? <ProductEmpty title="Your next message starts here" description="Choose a template and reach your audience." action="View broadcasts" onAction={() => handleSelectTab("broadcasts")} /> :
                  broadcastsData.broadcasts.map((broadcast) => <ProductRow key={broadcast.id} title={broadcast.name} detail={broadcast.recipients_count + " recipients · " + broadcast.status} icon="megaphone-outline" tone="peach" onPress={() => router.push(("/products/whatsapp/broadcasts/" + broadcast.id) as any)} />)}
              </ProductSection>
              <UsageCard usage={usage} isConnected={isConnected} />

              {/* Bottom Spacing to avoid overlap with Floating Bottom Bar */}
              <View style={{ height: 100 }} />
            </ScrollView>
          )}
        </View>
      )}

      {/* Floating Bottom Navigation Bar */}
      <ProductFloatingBottomBar
        items={WHATSAPP_TABS}
        activeKey={activeTab}
        onChangeTab={(tab) => handleSelectTab(tab as WhatsAppTab)}
        accentColor="#0A84FF"
        moreMenuTitle="WhatsApp Business Suite"
      />

      {/* Account Switcher Modal (iOS Bottom Sheet) */}
      <Modal
        visible={showAccountSwitcher && connectedAccounts.length > 1}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAccountSwitcher(false)}
      >
        <View className="flex-1 bg-black/60 justify-end sm:justify-center items-center p-4">
          <View
            className={`w-full max-w-[420px] rounded-3xl p-5 border shadow-2xl ${
              isDark
                ? "bg-[#252230] border-[#3A3549]"
                : "bg-white border-transparent"
            }`}
          >
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text
                  className={`text-lg font-bold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  Switch Account
                </Text>
                <Text
                  className={`text-xs ${
                    isDark ? "text-[#8E8E93]" : "text-[#64748B]"
                  }`}
                >
                  Select active WhatsApp phone number
                </Text>
              </View>
              <Pressable
                onPress={() => setShowAccountSwitcher(false)}
                className={`w-7 h-7 rounded-full items-center justify-center ${
                  isDark ? "bg-[#3A3549]" : "bg-[#F0EEF8]"
                }`}
              >
                <Ionicons
                  name="close"
                  size={18}
                  color={isDark ? "#FFFFFF" : "#000000"}
                />
              </Pressable>
            </View>

            <View className="gap-2.5">
              {connectedAccounts.map((account) => {
                const isSelected = activeAccount?.id === account.id;
                return (
                  <Pressable
                    key={account.id}
                    className={`flex-row items-center p-3 rounded-2xl border active:opacity-75 ${
                      isSelected
                        ? isDark
                          ? "bg-[#0A84FF]/15 border-[#0A84FF]"
                          : "bg-[#007AFF]/10 border-[#007AFF]"
                        : isDark
                        ? "bg-[#3A3549] border-transparent"
                        : "bg-[#F5F3FB] border-transparent"
                    }`}
                    onPress={() => {
                      if (Platform.OS !== "web") {
                        Haptics.selectionAsync();
                      }
                      setSelectedAccountId(account.id);
                      setShowAccountSwitcher(false);
                    }}
                  >
                    <View
                      className={`w-9 h-9 rounded-xl items-center justify-center mr-3 ${
                        isDark ? "bg-[#3A3A3C]" : "bg-white"
                      }`}
                    >
                      <Ionicons name="logo-whatsapp" size={20} color="#22C55E" />
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`text-sm font-bold ${
                          isDark ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {account.name || "WhatsApp Business"}
                      </Text>
                      <Text
                        className={`text-xs ${
                          isDark ? "text-[#8E8E93]" : "text-[#64748B]"
                        }`}
                      >
                        {account.display_phone_number}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={isDark ? "#0A84FF" : "#007AFF"}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
