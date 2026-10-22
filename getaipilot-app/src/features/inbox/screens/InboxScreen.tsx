import { getColors, useTheme } from "@/theme";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  UserIcon,
  ArrowRight01Icon,
  Search01Icon,
  Cancel01Icon,
  Add01Icon,
  BubbleChatAddIcon,
  BubbleChatIcon,
  WhatsappIcon,
  TelegramIcon,
  InstagramIcon,
} from "@/constants/icons";
import { useProductPalette } from "@/components/ProductUI";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  SkeletonCircle,
  SkeletonRow,
  SkeletonText,
} from "../../../components/Skeleton";
import {
  InboxListSkeleton
} from "../../../components/skeletonScreen";
import { AppScreen } from "../../../components/AppScreen";
import { AppTopBar } from "../../../components/AppTopBar";
import { useAuthStore } from "../../../core/store/authStore";
import { inboxApi } from "../api/inboxApi";
import { ConversationCard } from "../components";
import { useInboxWebSocket } from "../hooks/useInboxWebSocket";
import { ContactItem, NormalizedConversation } from "../types";
import { ConversationScreen } from "./ConversationScreen";

const CHANNEL_FILTERS = [
  { id: "all", label: "All", icon: null, activeColor: "#6366f1" },
  { id: "whatsapp", label: "WhatsApp", icon: WhatsappIcon, activeColor: "#16a34a" },
  { id: "telegram", label: "Telegram", icon: TelegramIcon, activeColor: "#0284c7" },
  { id: "instagram", label: "InstaPilot", icon: InstagramIcon, activeColor: "#db2777" },
] as const;

const INBOX_TABS = [
  { id: "ALL", label: "All" },
  { id: "UNREAD", label: "Unread" },
  { id: "UNASSIGNED", label: "Unassigned" },
  { id: "MINE", label: "Mine" },
  { id: "BOT_ACTIVE", label: "AI active" },
] as const;

export const InboxScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const { isDark } = useTheme();
  const color = getColors(isDark);
  const palette = useProductPalette();

  const [selectedChannel, setSelectedChannel] = useState<
    "all" | "whatsapp" | "telegram" | "instagram"
  >("all");
  const [activeTab, setActiveTab] = useState<
    "ALL" | "UNREAD" | "UNASSIGNED" | "MINE" | "BOT_ACTIVE"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeConversation, setActiveConversation] =
    useState<NormalizedConversation | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState<boolean>(false);
  const [contactSearchQuery, setContactSearchQuery] = useState<string>("");

  const [selectedTelegramBot, setSelectedTelegramBot] = useState<string>("all");

  const user = useAuthStore((s) => s.user);

  // Realtime Global Inbox WebSocket Subscription
  useInboxWebSocket();

  // Fetch conversations
  const {
    data: conversations,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["conversations", user?.id || "guest", searchQuery],
    queryFn: () => inboxApi.getConversations("all", "all", searchQuery),
    staleTime: 5000,
  });

  // Fetch contacts for New Chat
  const { data: contacts, isLoading: isLoadingContacts } = useQuery({
    queryKey: ["inbox_contacts", user?.id || "guest"],
    queryFn: () => inboxApi.getContacts(),
    staleTime: 30000,
  });

  const convList = conversations || [];

  const channelCounts = useMemo(() => {
    const counts = { all: convList.length, whatsapp: 0, telegram: 0, instagram: 0 };
    convList.forEach((c) => {
      if (c.channel === "whatsapp") counts.whatsapp++;
      else if (c.channel === "telegram") counts.telegram++;
      else if (c.channel === "instagram") counts.instagram++;
    });
    return counts;
  }, [convList]);

  // Extract distinct active Telegram chatbots and their chat counts
  const telegramBots = useMemo(() => {
    const botsMap = new Map<string, { id: string; name: string; count: number }>();
    convList.forEach((c) => {
      if (c.channel === "telegram" && c.bot_name) {
        const key = c.bot_id || c.bot_name;
        if (!botsMap.has(key)) {
          botsMap.set(key, { id: key, name: c.bot_name, count: 0 });
        }
        botsMap.get(key)!.count++;
      }
    });
    return Array.from(botsMap.values());
  }, [convList]);

  // Filter conversations according to selected channel, bot filter, and status tab
  const filteredConversations = useMemo(() => {
    return convList.filter((conv) => {
      if (selectedChannel !== "all" && conv.channel !== selectedChannel) {
        return false;
      }
      if (selectedChannel === "telegram" && selectedTelegramBot !== "all") {
        const matchBot = conv.bot_id === selectedTelegramBot || conv.bot_name === selectedTelegramBot;
        if (!matchBot) return false;
      }
      if (activeTab === "UNASSIGNED") {
        return !conv.assigned_to && !conv.assigned_agent_name;
      }
      if (activeTab === "MINE") {
        const myName = user?.name || user?.email?.split("@")[0] || "";
        const myId = user?.id || "";
        return (
          (conv.assigned_to &&
            (conv.assigned_to === myName || conv.assigned_to === myId)) ||
          (conv.assigned_agent_name && conv.assigned_agent_name === myName)
        );
      }
      if (activeTab === "BOT_ACTIVE") {
        return conv.bot_enabled !== false && !conv.bot_paused;
      }
      if (activeTab === "UNREAD") {
        return conv.unread_count > 0;
      }
      return true;
    });
  }, [convList, selectedChannel, selectedTelegramBot, activeTab, user]);

  const filteredContacts = useMemo(() => {
    return (contacts || []).filter((cnt) => {
      if (!contactSearchQuery) return true;
      const q = contactSearchQuery.toLowerCase();
      const name = (cnt.name || cnt.custom_name || "").toLowerCase();
      const phone = cnt.phone || cnt.wa_id || "";
      return name.includes(q) || phone.includes(q);
    });
  }, [contacts, contactSearchQuery]);

  const unreadTotal = convList.reduce(
    (sum, c) => sum + (c.unread_count || 0),
    0,
  );

  const handleStartChatWithContact = async (contact: ContactItem) => {
    setShowNewChatModal(false);
    try {
      const res = await inboxApi.startConversation(contact.id);
      const newConv: NormalizedConversation = {
        id: res.id,
        organization_id: user?.organizationId || "",
        contact: {
          name: contact.name || contact.custom_name || contact.phone,
          handle_or_phone: contact.phone || contact.wa_id || "",
        },
        channel: "whatsapp",
        last_message: {
          content: "Conversation started",
          created_at: new Date().toISOString(),
          direction: "inbound",
        },
        unread_count: 0,
        status: "active",
        bot_enabled: true,
      };
      setActiveConversation(newConv);
      refetch();
    } catch {
      // Direct open fallback
      const fallbackConv: NormalizedConversation = {
        id: `conv_${contact.id}`,
        organization_id: user?.organizationId || "",
        contact: {
          name: contact.name || contact.custom_name || contact.phone,
          handle_or_phone: contact.phone || contact.wa_id || "",
        },
        channel: "whatsapp",
        last_message: {
          content: "Conversation started",
          created_at: new Date().toISOString(),
          direction: "inbound",
        },
        unread_count: 0,
        status: "active",
        bot_enabled: true,
      };
      setActiveConversation(fallbackConv);
    }
  };

  const handleOpenConversation = (item: NormalizedConversation) => {
    // 1. Optimistically clear unread_count in React Query cache so badges clear immediately
    queryClient.setQueriesData<NormalizedConversation[]>(
      { queryKey: ["conversations"] },
      (old) => {
        if (!old) return old;
        return old.map((c) =>
          c.id === item.id ? { ...c, unread_count: 0 } : c,
        );
      },
    );

    // 2. Set active conversation with unread_count: 0
    setActiveConversation({ ...item, unread_count: 0 });

    // 3. Mark as read on the backend
    if (item.unread_count > 0) {
      inboxApi.markAsRead(item.id);
    }
  };

  return (
    <AppScreen safeArea={false} backgroundColor={color.background}>
      <AppTopBar
        title="Inbox"
        showBack={false}
        rightElement={
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {unreadTotal > 0 ? (
              <View style={{ minWidth: 24, height: 24, paddingHorizontal: 7, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: color.accentSoft }}>
                <Text style={{ color: color.accent, fontSize: 11, fontWeight: "700" }}>{unreadTotal}</Text>
              </View>
            ) : null}
            <Pressable
              style={{ minHeight: 40, paddingHorizontal: 14, borderRadius: 20, flexDirection: "row", alignItems: "center", backgroundColor: color.buttonPrimary }}
              onPress={() => setShowNewChatModal(true)}
              accessibilityRole="button"
              accessibilityLabel="Start a new chat"
            >
              <HugeiconsIcon
                icon={BubbleChatAddIcon}
                size={16}
                color={color.buttonPrimaryForeground}
                strokeWidth={2}
                style={{ marginRight: 6 }}
              />
              <Text style={{ color: color.buttonPrimaryForeground, fontSize: 12, fontWeight: "600" }}>New chat</Text>
            </Pressable>
          </View>
        }
      />

      <View style={{ flex: 1, paddingHorizontal: 14 }}>
        {/* Search Bar */}
        <View
          style={{
            minHeight: 50,
            flexDirection: "row",
            alignItems: "center",
            borderRadius: 18,
            paddingHorizontal: 15,
            marginBottom: 14,
            backgroundColor: color.card,
          }}
        >
          <HugeiconsIcon
            icon={Search01Icon}
            size={19}
            color={color.textSecondary}
            strokeWidth={2}
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={{ flex: 1, fontSize: 14, color: color.textPrimary }}
            placeholder="Search conversations"
            placeholderTextColor={color.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={10}>
              <HugeiconsIcon
                icon={Cancel01Icon}
                size={16}
                color={color.textSecondary}
                strokeWidth={2}
              />
            </Pressable>
          ) : null}
        </View>

        {/* Channel Filter Chips (All, WhatsApp, Telegram, InstaPilot) */}
        <View style={{ marginBottom: 10 }}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={CHANNEL_FILTERS}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingRight: 8 }}
            renderItem={({ item: ch }) => {
              const isSelected = selectedChannel === ch.id;
              const count = channelCounts[ch.id as keyof typeof channelCounts] || 0;
              const activeBg =
                ch.id === "whatsapp"
                  ? "rgba(34, 197, 94, 0.12)"
                  : ch.id === "telegram"
                  ? "rgba(14, 165, 233, 0.12)"
                  : ch.id === "instagram"
                  ? "rgba(236, 72, 153, 0.12)"
                  : color.accentSoft;
              const activeTextColor =
                ch.id === "all" ? color.accent : ch.activeColor;

              return (
                <Pressable
                  onPress={() => setSelectedChannel(ch.id as any)}
                  style={{
                    height: 34,
                    paddingHorizontal: 12,
                    marginRight: 8,
                    borderRadius: 17,
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: isSelected ? activeBg : color.card,
                    borderWidth: isSelected ? 1 : 0.5,
                    borderColor: isSelected
                      ? activeTextColor
                      : isDark
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.06)",
                  }}
                >
                  {ch.icon ? (
                    <HugeiconsIcon
                      icon={ch.icon}
                      size={14}
                      color={isSelected ? activeTextColor : color.textSecondary}
                      strokeWidth={2}
                      style={{ marginRight: 6 }}
                    />
                  ) : null}
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: isSelected ? "700" : "500",
                      color: isSelected ? activeTextColor : color.textSecondary,
                      marginRight: 6,
                    }}
                  >
                    {ch.label}
                  </Text>
                  <View
                    style={{
                      minWidth: 18,
                      height: 18,
                      borderRadius: 9,
                      paddingHorizontal: 5,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isSelected
                        ? activeTextColor
                        : isDark
                        ? "rgba(255, 255, 255, 0.08)"
                        : "rgba(0, 0, 0, 0.06)",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "700",
                        color: isSelected ? "#ffffff" : color.textSecondary,
                      }}
                    >
                      {count}
                    </Text>
                  </View>
                </Pressable>
              );
            }}
          />
        </View>

        {/* Telegram Chatbot Sub-filter Pills (e.g. Ads Bot, hello, testing) */}
        {selectedChannel === "telegram" && telegramBots.length > 1 && (
          <View style={{ marginBottom: 10 }}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={[{ id: "all", name: "All Bots", count: channelCounts.telegram }, ...telegramBots]}
              keyExtractor={(b) => b.id}
              contentContainerStyle={{ paddingRight: 8 }}
              renderItem={({ item: bot }) => {
                const isSelected = selectedTelegramBot === bot.id;
                return (
                  <Pressable
                    onPress={() => setSelectedTelegramBot(bot.id)}
                    style={{
                      height: 28,
                      paddingHorizontal: 10,
                      marginRight: 6,
                      borderRadius: 14,
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: isSelected
                        ? isDark
                          ? "rgba(2, 132, 199, 0.25)"
                          : "#E0F2FE"
                        : color.card,
                      borderWidth: isSelected ? 1 : 0.5,
                      borderColor: isSelected
                        ? "#0284c7"
                        : isDark
                        ? "rgba(255, 255, 255, 0.08)"
                        : "rgba(0, 0, 0, 0.06)",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: isSelected ? "700" : "500",
                        color: isSelected ? "#0284c7" : color.textSecondary,
                        marginRight: 5,
                      }}
                    >
                      {bot.name}
                    </Text>
                    <View
                      style={{
                        minWidth: 16,
                        height: 16,
                        borderRadius: 8,
                        paddingHorizontal: 4,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: isSelected
                          ? "#0284c7"
                          : isDark
                          ? "rgba(255, 255, 255, 0.1)"
                          : "rgba(0, 0, 0, 0.06)",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 9.5,
                          fontWeight: "700",
                          color: isSelected ? "#ffffff" : color.textSecondary,
                        }}
                      >
                        {bot.count}
                      </Text>
                    </View>
                  </Pressable>
                );
              }}
            />
          </View>
        )}

        {/* Folder-Style Status Tab Bar */}
        <View style={{ position: "relative", marginBottom: 14 }}>


          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={INBOX_TABS}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingRight: 8 }}
            renderItem={({ item: tab }) => {
              const isActive = activeTab === tab.id;

              return (
                <Pressable
                  onPress={() => setActiveTab(tab.id as any)}
                  style={
                    {
                      height: 38,
                      paddingHorizontal: 14,
                      justifyContent: "center",
                      alignItems: "center",
                      borderRadius: 19,
                      marginRight: 8,
                      backgroundColor: isActive ? color.accentSoft : color.card,
                    }
                  }
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 12,
                      fontWeight: isActive ? "600" : "500",
                      letterSpacing: -0.1,
                      color: isActive ? color.accent : color.textSecondary,
                    }}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>


        {/* Conversation List */}
        {isLoading && !conversations ? (
          <InboxListSkeleton />
        ) : (
          <FlatList
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            data={filteredConversations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ConversationCard
                conversation={item}
                onPress={() => handleOpenConversation(item)}
              />
            )}
            contentContainerStyle={{ paddingBottom: 132 }}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={color.primary}
              />
            }
            ListEmptyComponent={
              <View style={{ paddingHorizontal: 32, paddingVertical: 56, alignItems: "center" }}>
                <View style={{ width: 56, height: 56, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: color.accentSoft }}>
                  <HugeiconsIcon icon={BubbleChatIcon} size={25} color={color.accent} strokeWidth={1.8} />
                </View>
                <Text
                  className="text-[15px] font-bold mt-2.5 mb-1.5"
                  style={{ color: color.textPrimary }}
                >
                  No conversations found
                </Text>
                <Text
                  className="text-[12.5px] text-center leading-[18px]"
                  style={{ color: color.textSecondary }}
                >
                  {activeTab !== "ALL" || selectedChannel !== "all"
                    ? `No conversations match the current filter.`
                    : "Incoming messages from WhatsApp, Telegram, and InstaPilot will appear here in real time."}
                </Text>
                <Pressable
                  className="flex-row items-center px-3.5 py-2 rounded-xl mt-3.5 active:opacity-85"
                  style={{ backgroundColor: color.primary }}
                  onPress={() => setShowNewChatModal(true)}
                >
                  <HugeiconsIcon
                    icon={Add01Icon}
                    size={16}
                    color="#ffffff"
                    strokeWidth={2}
                    style={{ marginRight: 5 }}
                  />
                  <Text className="text-white text-[12.5px] font-bold">
                    Start New Conversation
                  </Text>
                </Pressable>
              </View>
            }
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* Start New Chat / Contact Picker Modal */}
        {/* ------------------------------------------------------------- */}
        <Modal
          visible={showNewChatModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowNewChatModal(false)}
        >
          <View className="flex-1 bg-black/60 justify-end">
            <View
              className="rounded-t-[28px] p-5 max-h-[82%]"
              style={{
                backgroundColor: color.card,
                borderTopWidth: 1,
                borderTopColor: isDark ? "rgba(255, 255, 255, 0.08)" : color.cardBorder,
              }}
            >
              <View className="flex-row justify-between items-start mb-3.5">
                <View className="flex-1">
                  <Text
                    className="text-[17px] font-extrabold"
                    style={{ color: color.textPrimary }}
                  >
                    Start New WhatsApp Chat
                  </Text>
                  <Text
                    className="text-xs mt-0.5 leading-4"
                    style={{ color: color.textSecondary }}
                  >
                    Select a contact from your workspace to open live chat.
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowNewChatModal(false)}
                  hitSlop={10}
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    size={20}
                    color={color.textSecondary}
                    strokeWidth={2}
                  />
                </Pressable>
              </View>

              {/* Search Contacts */}
              <View
                className="flex-row items-center rounded-2xl px-3.5 py-2.5 mb-3"
                style={{
                  backgroundColor: color.background,
                  borderWidth: 1,
                  borderColor: isDark ? "rgba(255, 255, 255, 0.07)" : color.cardBorder,
                }}
              >
                <HugeiconsIcon
                  icon={Search01Icon}
                  size={16}
                  color={color.textSecondary}
                  strokeWidth={2}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  className="flex-1 text-[13px]"
                  style={{ color: color.textPrimary }}
                  placeholder="Search contacts by name or phone..."
                  placeholderTextColor={color.textSecondary}
                  value={contactSearchQuery}
                  onChangeText={setContactSearchQuery}
                />
              </View>

              {/* Contacts List */}
              <ScrollView
                style={{ maxHeight: 360 }}
                showsVerticalScrollIndicator={false}
              >
                {isLoadingContacts ? (
                  <View className="py-2.5">
                    {[1, 2, 3].map((i) => (
                      <SkeletonRow
                        key={i}
                        style={{ paddingVertical: 10, paddingHorizontal: 12 }}
                      >
                        <SkeletonCircle size={40} style={{ marginRight: 12 }} />
                        <View className="flex-1">
                          <SkeletonText
                            width={120}
                            height={14}
                            style={{ marginBottom: 6 }}
                          />
                          <SkeletonText width={160} height={11} />
                        </View>
                      </SkeletonRow>
                    ))}
                  </View>
                ) : filteredContacts.length === 0 ? (
                  <View className="p-5 items-center">
                    <Text
                      className="text-[13px]"
                      style={{ color: color.textSecondary }}
                    >
                      No contacts found
                    </Text>
                  </View>
                ) : (
                  filteredContacts.map((cnt) => (
                    <Pressable
                      key={cnt.id}
                      className="flex-row items-center p-3.5 rounded-[20px] mb-2.5 active:opacity-75"
                      style={{
                        backgroundColor: color.card,
                        borderWidth: 1,
                        borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : color.cardBorder,
                      }}
                      onPress={() => handleStartChatWithContact(cnt)}
                    >
                      <View
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 15,
                          backgroundColor: palette.mint,
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 12,
                        }}
                      >
                        <HugeiconsIcon
                          icon={UserIcon}
                          size={20}
                          color={palette.text}
                          strokeWidth={2}
                        />
                      </View>
                      <View className="flex-1 min-w-0">
                        <Text
                          className="text-sm font-bold"
                          style={{ color: color.textPrimary }}
                        >
                          {cnt.name || cnt.custom_name || "Contact"}
                        </Text>
                        <Text
                          className="text-[11.5px] mt-0.5"
                          style={{ color: color.textSecondary }}
                        >
                          +{cnt.phone || cnt.wa_id}
                        </Text>
                      </View>
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        size={16}
                        color={color.textSecondary}
                        strokeWidth={2}
                      />
                    </Pressable>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Fullscreen WhatsApp Conversation Modal */}
        <Modal
          visible={!!activeConversation}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => {
            setActiveConversation(null);
            refetch();
          }}
        >
          {activeConversation && (
            <ConversationScreen
              conversation={activeConversation}
              onBack={() => {
                setActiveConversation(null);
                refetch();
              }}
            />
          )}
        </Modal>
      </View>
    </AppScreen>
  );
};
