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
      color: "#25D366",
      badge: totalContactsCount > 0 ? `${totalContactsCount}` : undefined,
      onPress: () => handleSelectTab("contacts"),
    },
    {
      key: "templates",
      title: "Meta Templates",
      subtitle: "Approved marketing, utility & OTP message templates",
      icon: "document-text",
      color: "#128C7E",
      badge:
        approvedTemplatesCount > 0 ? `${approvedTemplatesCount}` : undefined,
      onPress: () => handleSelectTab("templates"),
    },
    {
      key: "broadcasts",
      title: "Broadcast Campaigns",
      subtitle: "Launch new bulk sends & view delivery funnels",
      icon: "megaphone",
      color: "#075E54",
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
          {/* Authentic WhatsApp Theme Header (Borderless) */}
          <View
            className={`flex-row items-center px-4 py-3.5 shadow-sm ${
              isDark ? "bg-[#1F2C34]" : "bg-[#075E54]"
            }`}
            style={{
              paddingTop: Math.max(
                insets.top,
                Platform.OS === "ios" ? 44 : 12,
              ),
              borderBottomWidth: 0,
              elevation: 4,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
            }}
          >
            <View className="flex-row items-center flex-1">
              <Pressable
                className="w-9 h-9 rounded-full justify-center items-center mr-3 active:opacity-70 active:scale-95 bg-white/15"
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
                style={{ borderWidth: 0 }}
              >
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color="#FFFFFF"
                />
              </Pressable>

              <View className="flex-row items-center gap-2">
                <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                <View>
                  <Text className="text-lg font-bold tracking-tight text-white">
                    WhatsApp Business
                  </Text>
                  <Text className="text-[11px] text-emerald-200/90 font-medium">
                    Meta Cloud API Suite
                  </Text>
                </View>
              </View>
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
                  tintColor="#25D366"
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
              <View className="mb-2 mt-4 px-1 flex-row items-center gap-1.5">
                <View className="w-1.5 h-3.5 rounded-full bg-[#25D366]" />
                <Text
                  className={`text-xs font-bold tracking-wider uppercase ${
                    isDark ? "text-emerald-400" : "text-[#075E54]"
                  }`}
                >
                  Overview & Capabilities
                </Text>
              </View>

              {/* Metrics 2x2 Grid with WhatsApp Palette */}
              <View className="w-full gap-3 mb-2">
                <View className="flex-row gap-3 w-full">
                  <View className="flex-1 min-w-0" style={{ flexBasis: 0 }}>
                    <WhatsAppMetricCard
                      label="Contacts"
                      value={totalContactsCount.toLocaleString()}
                      subtext="Synchronized audience"
                      ioniconsName="people"
                      iconColor="#25D366"
                    />
                  </View>
                  <View className="flex-1 min-w-0" style={{ flexBasis: 0 }}>
                    <WhatsAppMetricCard
                      label="Templates"
                      value={approvedTemplatesCount}
                      subtext="Approved by Meta"
                      ioniconsName="document-text"
                      iconColor="#128C7E"
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
                      iconColor="#075E54"
                    />
                  </View>
                  <View className="flex-1 min-w-0" style={{ flexBasis: 0 }}>
                    <WhatsAppMetricCard
                      label="Delivery Rate"
                      value={deliveryRate}
                      subtext="Cloud SLA"
                      ioniconsName="flash"
                      iconColor="#25D366"
                    />
                  </View>
                </View>
              </View>

              {/* Section Header: Product Navigation */}
              <View className="mb-2 mt-4 px-1 flex-row items-center gap-1.5">
                <View className="w-1.5 h-3.5 rounded-full bg-[#25D366]" />
                <Text
                  className={`text-xs font-bold tracking-wider uppercase ${
                    isDark ? "text-emerald-400" : "text-[#075E54]"
                  }`}
                >
                  Product Navigation
                </Text>
              </View>

              {/* Quick Actions Navigation List (Borderless) */}
              <View className="flex-col gap-2.5 mb-2">
                {navigationItems.map((item) => (
                  <Pressable
                    key={item.key}
                    className={`flex-row gap-3 items-center justify-between w-full p-3.5 rounded-2xl shadow-sm active:opacity-75 ${
                      isDark
                        ? "bg-[#1C1C1E]"
                        : "bg-white"
                    }`}
                    style={{
                      borderWidth: 0,
                      elevation: 2,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: isDark ? 0.25 : 0.05,
                      shadowRadius: 4,
                    }}
                    onPress={item.onPress}
                  >
                    <View
                      className={`w-10 h-10 rounded-xl items-center justify-center ${
                        isDark ? "bg-[#25D366]/15" : "bg-[#25D366]/10"
                      }`}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={20}
                        color={isDark ? "#25D366" : item.color}
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
                      color={isDark ? "#636366" : "#A0AEC0"}
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

      {/* Floating Bottom Navigation Bar with WhatsApp Green Accent */}
      <ProductFloatingBottomBar
        items={WHATSAPP_TABS}
        activeKey={activeTab}
        onChangeTab={(tab) => handleSelectTab(tab as WhatsAppTab)}
        accentColor={isDark ? "#25D366" : "#075E54"}
        moreMenuTitle="WhatsApp Business Suite"
      />

      {/* Account Switcher Modal (Borderless) */}
      <Modal
        visible={showAccountSwitcher && connectedAccounts.length > 1}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAccountSwitcher(false)}
      >
        <View className="flex-1 bg-black/60 justify-end sm:justify-center items-center p-4">
          <View
            className={`w-full max-w-[420px] rounded-3xl p-5 shadow-2xl ${
              isDark
                ? "bg-[#1C1C1E]"
                : "bg-white"
            }`}
            style={{
              borderWidth: 0,
              elevation: 8,
            }}
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
                    className={`flex-row items-center p-3 rounded-2xl active:opacity-75 ${
                      isSelected
                        ? isDark
                          ? "bg-[#25D366]/20"
                          : "bg-[#25D366]/12"
                        : isDark
                        ? "bg-[#2C2C2E]"
                        : "bg-[#F8F9FA]"
                    }`}
                    style={{ borderWidth: 0 }}
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
                      <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
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
                        color={isDark ? "#25D366" : "#075E54"}
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
