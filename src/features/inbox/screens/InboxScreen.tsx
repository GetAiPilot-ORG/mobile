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
  StyleSheet,
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
  const styles = useMemo(() => createStyles(color, isDark), [color, isDark]);

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
        subtitle="LiveChat & Conversations"
        showBack={false}
        rightElement={
          <View style={styles.headerRightActions}>
            {unreadTotal > 0 && (
              <View style={styles.unreadTotalBadge}>
                <Text style={styles.unreadTotalText}>{unreadTotal} Unread</Text>
              </View>
            )}
            <Pressable
              style={styles.newChatBtn}
              onPress={() => setShowNewChatModal(true)}
            >
              <Ionicons
                name="chatbubble-ellipses"
                size={14}
                color="#ffffff"
                style={{ marginRight: 5 }}
              />
              <Text style={styles.newChatBtnText}>+ New Chat</Text>
            </Pressable>
          </View>
        }
      />

      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={16}
            color={color.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
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
          style={styles.tabsScroll}
        >
          {[
            { id: "ALL", label: "All Chats", icon: "chatbubbles" },
            { id: "UNREAD", label: "Unread", icon: "mail-unread" },
            { id: "UNASSIGNED", label: "Unassigned", icon: "person-add" },
            { id: "MINE", label: "Assigned to Me", icon: "person" },
            { id: "BOT_ACTIVE", label: "AI Active", icon: "hardware-chip" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                style={[
                  styles.tabPill,
                  isActive && styles.activeTabPill,
                ]}
                onPress={() => setActiveTab(tab.id as any)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={13}
                  color={isActive ? "#ffffff" : color.textSecondary}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.tabText,
                    isActive && styles.activeTabText,
                  ]}
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
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={color.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={48}
                  color={color.border}
                />
                <Text style={styles.emptyTitle}>
                  No conversations found
                </Text>
                <Text style={styles.emptySubtitle}>
                  {activeTab !== "ALL"
                    ? `No conversations match the '${activeTab}' filter.`
                    : "Incoming messages from WhatsApp customers will appear here in real time."}
                </Text>
                <Pressable
                  style={styles.emptyNewChatBtn}
                  onPress={() => setShowNewChatModal(true)}
                >
                  <Ionicons
                    name="add"
                    size={16}
                    color="#ffffff"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.emptyNewChatBtnText}>
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
          <View style={styles.modalOverlay}>
            <View style={styles.newChatModalBox}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>
                    Start New WhatsApp Chat
                  </Text>
                  <Text style={styles.modalSub}>
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
              <View style={styles.contactSearchBox}>
                <Ionicons
                  name="search"
                  size={15}
                  color={color.textSecondary}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  style={styles.contactSearchInput}
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
                  <View style={{ paddingVertical: 10 }}>
                    {[1, 2, 3].map((i) => (
                      <SkeletonRow
                        key={i}
                        style={{ paddingVertical: 10, paddingHorizontal: 12 }}
                      >
                        <SkeletonCircle size={40} style={{ marginRight: 12 }} />
                        <View style={{ flex: 1 }}>
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
                  <View style={{ padding: 20, alignItems: "center" }}>
                    <Text
                      style={{
                        color: color.textSecondary,
                        fontSize: 13,
                      }}
                    >
                      No contacts found
                    </Text>
                  </View>
                ) : (
                  filteredContacts.map((cnt) => (
                    <Pressable
                      key={cnt.id}
                      style={styles.contactItemRow}
                      onPress={() => handleStartChatWithContact(cnt)}
                    >
                      <View style={styles.contactItemAvatar}>
                        <Text style={styles.contactItemAvatarText}>
                          {cnt.name ? cnt.name.charAt(0).toUpperCase() : "C"}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.contactItemName}>
                          {cnt.name || cnt.custom_name || "Contact"}
                        </Text>
                        <Text style={styles.contactItemPhone}>
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

function createStyles(color: ReturnType<typeof getColors>, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 14,
    },
    headerRightActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    unreadTotalBadge: {
      backgroundColor: color.primary,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    unreadTotalText: {
      color: "#ffffff",
      fontSize: 10.5,
      fontWeight: "800",
    },
    newChatBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: color.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 14,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 2,
    },
    newChatBtnText: {
      color: "#ffffff",
      fontSize: 12,
      fontWeight: "700",
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderWidth: 1,
      backgroundColor: color.card,
      borderColor: color.border,
      marginBottom: 10,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 13.5,
      color: color.textPrimary,
    },
    tabsScroll: {
      flexGrow: 0,
      marginBottom: 12,
    },
    tabPill: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 13,
      paddingVertical: 6.5,
      borderRadius: 16,
      marginRight: 6,
      borderWidth: 1,
      backgroundColor: color.card,
      borderColor: color.border,
    },
    activeTabPill: {
      backgroundColor: color.primary,
      borderColor: color.primary,
    },
    tabText: {
      fontSize: 11.5,
      fontWeight: "600",
      color: color.textSecondary,
    },
    activeTabText: {
      color: "#ffffff",
      fontWeight: "800",
    },
    listContent: {
      paddingBottom: 130,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      fontSize: 13,
      marginTop: 12,
      color: color.textSecondary,
    },
    emptyContainer: {
      padding: 40,
      alignItems: "center",
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: "700",
      marginTop: 10,
      marginBottom: 6,
      color: color.textPrimary,
    },
    emptySubtitle: {
      fontSize: 12.5,
      textAlign: "center",
      lineHeight: 18,
      color: color.textSecondary,
    },
    emptyNewChatBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: color.primary,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
      marginTop: 14,
    },
    emptyNewChatBtnText: {
      color: "#ffffff",
      fontSize: 12.5,
      fontWeight: "700",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      justifyContent: "flex-end",
    },
    newChatModalBox: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 18,
      maxHeight: "80%",
      borderWidth: 1,
      backgroundColor: color.card,
      borderColor: color.border,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: "800",
      color: color.textPrimary,
    },
    modalSub: {
      fontSize: 12,
      marginTop: 2,
      lineHeight: 16,
      color: color.textSecondary,
    },
    contactSearchBox: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      backgroundColor: color.background,
      borderColor: color.border,
      marginBottom: 10,
    },
    contactSearchInput: {
      flex: 1,
      fontSize: 13,
      color: color.textPrimary,
    },
    contactItemRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      backgroundColor: color.card,
      borderColor: color.border,
    },
    contactItemAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: color.primary,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 10,
    },
    contactItemAvatarText: {
      color: "#ffffff",
      fontSize: 15,
      fontWeight: "700",
    },
    contactItemName: {
      fontSize: 14,
      fontWeight: "700",
      color: color.textPrimary,
    },
    contactItemPhone: {
      fontSize: 11.5,
      marginTop: 2,
      color: color.textSecondary,
    },
  });
}
