import { getColors, useTheme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
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

export const InboxScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const { isDark } = useTheme();
  const color = getColors(isDark);

  const [activeTab, setActiveTab] = useState<
    "ALL" | "UNREAD" | "UNASSIGNED" | "MINE" | "BOT_ACTIVE"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeConversation, setActiveConversation] =
    useState<NormalizedConversation | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState<boolean>(false);
  const [contactSearchQuery, setContactSearchQuery] = useState<string>("");

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
    queryKey: ["conversations", searchQuery],
    queryFn: () => inboxApi.getConversations("all", "all", searchQuery),
    staleTime: 5000,
  });

  // Fetch contacts for New Chat
  const { data: contacts, isLoading: isLoadingContacts } = useQuery({
    queryKey: ["inbox_contacts"],
    queryFn: () => inboxApi.getContacts(),
    staleTime: 30000,
  });

  const convList = conversations || [];

  // Filter conversations according to selected tab
  const filteredConversations = useMemo(() => {
    return convList.filter((conv) => {
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
  }, [convList, activeTab, user]);

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
    <AppScreen>
      <AppTopBar
        title="Inbox"
        showBack={false}
        rightElement={
          <View className="flex-row items-center gap-2">
            {unreadTotal > 0 && (
              <View
                className="px-2 py-0.5 rounded-full"
                style={{ backgroundColor: color.primary }}
              >
                <Text className="text-white text-[10.5px] font-extrabold">{unreadTotal} Unread</Text>
              </View>
            )}
            <Pressable
              className="flex-row items-center px-3 py-1.5 rounded-full shadow-sm active:opacity-85"
              style={{ backgroundColor: color.primary }}
              onPress={() => setShowNewChatModal(true)}
            >
              <Ionicons
                name="chatbubble-ellipses"
                size={14}
                color="#ffffff"
                className="mr-1"
              />
              <Text className="text-white text-xs font-bold">+ New Chat</Text>
            </Pressable>
          </View>
        }
      />

      <View className=" px-3.5">
        {/* Search Bar */}
        <View
          className="flex-row items-center rounded-2xl px-3 py-2 border mb-2.5 shadow-sm"
          style={{ backgroundColor: color.card, borderColor: color.border }}
        >
          <Ionicons
            name="search"
            size={16}
            color={color.textSecondary}
            className="mr-2"
          />
          <TextInput
            className="flex-1 text-[13.5px]"
            style={{ color: color.textPrimary }}
            placeholder="Search contacts, numbers or messages..."
            placeholderTextColor={color.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={10}>
              <Ionicons
                name="close-circle"
                size={16}
                color={color.textSecondary}
              />
            </Pressable>
          ) : null}
        </View>

        {/* Filter Tabs Horizontal Scroll */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 2, paddingVertical: 4 }}
          className="mb-3 shrink-0"
        >
          {[
            { id: "ALL", label: "All Chats", icon: "chatbubbles-outline" },
            { id: "UNREAD", label: "Unread", icon: "mail-unread-outline" },
            { id: "UNASSIGNED", label: "Unassigned", icon: "person-add-outline" },
            { id: "MINE", label: "Assigned to Me", icon: "person-outline" },
            { id: "BOT_ACTIVE", label: "AI Active", icon: "hardware-chip-outline" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id as any)}
                className="flex-row items-center justify-center gap-2 px-4 py-2.5 mr-2 rounded-full border"
                style={({ pressed }) => [
                  {
                    backgroundColor: isActive ? color.primary : color.card,
                    borderColor: isActive ? color.primary : color.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                  isActive && {
                    elevation: 2,
                    shadowColor: "#000000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                  },
                ]}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={15}
                  color={isActive ? "#FFFFFF" : color.textSecondary}
                />

                <Text
                  numberOfLines={1}
                  className="text-xs"
                  style={{
                    color: isActive ? "#FFFFFF" : color.textSecondary,
                    fontWeight: isActive ? "700" : "500",
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>


        {/* Conversation List */}
        {isLoading && !conversations ? (
          <InboxListSkeleton />
        ) : (
          <FlatList
            data={filteredConversations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ConversationCard
                conversation={item}
                onPress={() => handleOpenConversation(item)}
              />
            )}
            contentContainerStyle={{ paddingBottom: 130 }}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={color.primary}
              />
            }
            ListEmptyComponent={
              <View className="p-10 items-center">
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={48}
                  color={color.border}
                />
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
                  {activeTab !== "ALL"
                    ? `No conversations match the '${activeTab}' filter.`
                    : "Incoming messages from WhatsApp customers will appear here in real time."}
                </Text>
                <Pressable
                  className="flex-row items-center px-3.5 py-2 rounded-xl mt-3.5 active:opacity-85"
                  style={{ backgroundColor: color.primary }}
                  onPress={() => setShowNewChatModal(true)}
                >
                  <Ionicons
                    name="add"
                    size={16}
                    color="#ffffff"
                    className="mr-1"
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
              className="rounded-t-3xl p-4.5 max-h-[80%] border p-4"
              style={{ backgroundColor: color.card, borderColor: color.border }}
            >
              <View className="flex-row justify-between items-start mb-3">
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
                  <Ionicons
                    name="close"
                    size={24}
                    color={color.textSecondary}
                  />
                </Pressable>
              </View>

              {/* Search Contacts */}
              <View
                className="flex-row items-center rounded-xl px-3 py-2 border mb-2.5"
                style={{ backgroundColor: color.background, borderColor: color.border }}
              >
                <Ionicons
                  name="search"
                  size={15}
                  color={color.textSecondary}
                  className="mr-2"
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
                      className="flex-row items-center p-3 rounded-xl mb-2 border active:opacity-75"
                      style={{ backgroundColor: color.card, borderColor: color.border }}
                      onPress={() => handleStartChatWithContact(cnt)}
                    >
                      <View
                        className="w-9 h-9 rounded-full justify-center items-center mr-2.5"
                        style={{ backgroundColor: color.primary }}
                      >
                        <Text className="text-white text-[15px] font-bold">
                          {cnt.name ? cnt.name.charAt(0).toUpperCase() : "C"}
                        </Text>
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
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={color.textSecondary}
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
