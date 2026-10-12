import { getColors, useTheme } from "../../../theme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ProductFloatingBottomBar,
  ProductTabItem,
} from "../../../components/ProductFloatingBottomBar";
import { WhatsAppHomeSkeleton } from "../../../components/skeletonScreen";
import {
  ConnectionStatusCard,
  UsageCard,
  WhatsAppMetricCard,
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
  const insets = useSafeAreaInsets();
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
  }, [activeTab]);

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
  const totalBroadcastsCount =
    broadcastsData?.total_count ?? broadcastsData?.broadcasts?.length ?? 0;
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

  const navigationItems = [
    {
      key: "contacts",
      title: "Audience & Contacts",
      subtitle: "View contacts, segment tags & link CRM leads",
      icon: "people",
      color: "#A855F7",
      badge: totalContactsCount > 0 ? `${totalContactsCount}` : undefined,
      onPress: () => handleSelectTab("contacts"),
    },
    {
      key: "templates",
      title: "Meta Templates",
      subtitle: "Approved marketing, utility & OTP message templates",
      icon: "document-text",
      color: "#3B82F6",
      badge:
        approvedTemplatesCount > 0 ? `${approvedTemplatesCount}` : undefined,
      onPress: () => handleSelectTab("templates"),
    },
    {
      key: "broadcasts",
      title: "Broadcast Campaigns",
      subtitle: "Launch new bulk sends & view delivery funnels",
      icon: "megaphone",
      color: "#F43F5E",
      badge: totalBroadcastsCount > 0 ? `${totalBroadcastsCount}` : undefined,
      onPress: () => handleSelectTab("broadcasts"),
    },
  ];

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
          {/* Standard Safe Header with Circular Back Button */}
          <View
            className={`flex-row items-center px-4 py-3 border-b ${
              isDark
                ? "bg-black border-white/[0.08]"
                : "bg-white border-black/[0.06]"
            }`}
            style={{
              paddingTop: Math.max(
                insets.top,
                Platform.OS === "ios" ? 44 : 12,
              ),
            }}
          >
            <View className="flex-row items-center flex-1">
              <Pressable
                className={`w-10 h-10 rounded-full justify-center items-center mr-3 border active:opacity-70 active:scale-95 shadow-sm ${
                  isDark
                    ? "bg-[#1C1C1E] border-[#2C2C2E]"
                    : "bg-white border-[#E5E7EB]"
                }`}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace("/(tabs)/products");
                  }
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Back"
              >
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={isDark ? "#F8FAFC" : "#0F172A"}
                />
              </Pressable>

              <Text
                className={`text-xl font-bold tracking-tight ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                WhatsApp Business
              </Text>
            </View>
          </View>

          {statusLoading && !status ? (
            <WhatsAppHomeSkeleton />
          ) : (
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ padding: 16 }}
              refreshControl={
                <RefreshControl
                  refreshing={statusRefetching}
                  onRefresh={handleRefresh}
                  tintColor="#25d366"
                />
              }
            >
              {/* Connection Status Card */}
              <ConnectionStatusCard
                connection={currentConnection}
                isLoading={statusLoading}
                hasMultipleAccounts={connectedAccounts.length > 1}
                onSwitchAccountPress={() => setShowAccountSwitcher(true)}
              />

              {/* Cloud Wallet & Usage Card */}
              <UsageCard usage={usage} isConnected={isConnected} />

              {/* Section Header: Overview & Capabilities */}
              <View className="mb-2 mt-4 px-1">
                <Text
                  className={`text-xs font-semibold tracking-wider uppercase ${
                    isDark ? "text-[#8E8E93]" : "text-[#64748B]"
                  }`}
                >
                  Overview & Capabilities
                </Text>
              </View>

              {/* Metrics 2x2 Grid */}
              <View className="w-full gap-3 mb-2">
                <View className="flex-row gap-3 w-full">
                  <View className="flex-1 min-w-0" style={{ flexBasis: 0 }}>
                    <WhatsAppMetricCard
                      label="Contacts"
                      value={totalContactsCount.toLocaleString()}
                      subtext="Synchronized audience"
                      ioniconsName="people"
                      iconColor="#A855F7"
                    />
                  </View>
                  <View className="flex-1 min-w-0" style={{ flexBasis: 0 }}>
                    <WhatsAppMetricCard
                      label="Templates"
                      value={approvedTemplatesCount}
                      subtext="Approved by Meta"
                      ioniconsName="document-text"
                      iconColor="#3B82F6"
                    />
                  </View>
                </View>
                <View className="flex-row gap-3 w-full">
                  <View className="flex-1 min-w-0" style={{ flexBasis: 0 }}>
                    <WhatsAppMetricCard
                      label="Broadcasts"
                      value={totalBroadcastsCount}
                      subtext="Campaigns executed"
                      ioniconsName="megaphone"
                      iconColor="#F43F5E"
                    />
                  </View>
                  <View className="flex-1 min-w-0" style={{ flexBasis: 0 }}>
                    <WhatsAppMetricCard
                      label="Delivery Rate"
                      value={deliveryRate}
                      subtext="Cloud SLA"
                      ioniconsName="flash"
                      iconColor="#F59E0B"
                    />
                  </View>
                </View>
              </View>

              {/* Section Header: Product Navigation */}
              <View className="mb-2 mt-4 px-1">
                <Text
                  className={`text-xs font-semibold tracking-wider uppercase ${
                    isDark ? "text-[#8E8E93]" : "text-[#64748B]"
                  }`}
                >
                  Product Navigation
                </Text>
              </View>

              {/* Quick Actions Navigation List */}
              <View className="flex-col gap-2.5 mb-2">
                {navigationItems.map((item) => (
                  <Pressable
                    key={item.key}
                    className={`flex-row gap-3 items-center justify-between w-full p-3.5 rounded-2xl border active:opacity-75 ${
                      isDark
                        ? "bg-[#1C1C1E] border-[#2C2C2E]"
                        : "bg-white border-[#E5E7EB]"
                    }`}
                    onPress={item.onPress}
                  >
                    <View
                      className={`w-10 h-10 rounded-xl items-center justify-center ${
                        isDark ? "bg-[#2C2C2E]" : "bg-[#F1F5F9]"
                      }`}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={20}
                        color={item.color}
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`text-[15px] font-bold tracking-tight mb-0.5 ${
                          isDark ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {item.title}
                      </Text>
                      <Text
                        className={`text-xs font-normal ${
                          isDark ? "text-[#8E8E93]" : "text-[#64748B]"
                        }`}
                      >
                        {item.subtitle}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={17}
                      color={isDark ? "#636366" : "#C7C7CC"}
                    />
                  </Pressable>
                ))}
              </View>

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
                ? "bg-[#1C1C1E] border-[#2C2C2E]"
                : "bg-white border-[#E5E7EB]"
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
                  isDark ? "bg-[#2C2C2E]" : "bg-[#F1F5F9]"
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
                        ? "bg-[#2C2C2E] border-transparent"
                        : "bg-[#F8F9FA] border-transparent"
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
