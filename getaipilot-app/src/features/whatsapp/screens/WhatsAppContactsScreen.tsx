import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, getColors } from "@/theme";
import { CrmListSkeleton } from "../../../components/skeletonScreen";
import { useAuthStore } from "../../../core/store/authStore";
import { inboxApi } from "../../inbox/api/inboxApi";
import { ConversationScreen } from "../../inbox/screens/ConversationScreen";
import { NormalizedConversation } from "../../inbox/types";
import { ContactCard } from "../components/ContactCard";
import { useWhatsAppContacts } from "../hooks/useWhatsAppContacts";
import { WhatsAppContact } from "../types";

interface WhatsAppContactsScreenProps {
  onBack?: () => void;
  onOpenChat?: (contact: WhatsAppContact) => void;
}

export const WhatsAppContactsScreen: React.FC<WhatsAppContactsScreenProps> = ({
  onBack,
  onOpenChat,
}) => {
  const router = useRouter();
  const { isDark } = useTheme();
  const color = getColors(isDark);
  const user = useAuthStore((s) => s.user);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [activeConversation, setActiveConversation] =
    useState<NormalizedConversation | null>(null);

  const { data, isLoading, refetch, isRefetching } = useWhatsAppContacts({
    search: searchQuery || undefined,
    tag: !["ALL", "UNREAD", "UNASSIGNED", "MINE"].includes(activeFilter)
      ? activeFilter
      : undefined,
    limit: 250,
  });

  const handleBack = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/products/whatsapp");
    }
  };

  const handleOpenChat = async (contact: WhatsAppContact) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onOpenChat) {
      onOpenChat(contact);
      return;
    }
    try {
      const res = await inboxApi.startConversation(contact.id);
      const conv: NormalizedConversation = {
        id: res.id,
        organization_id: user?.organizationId || "",
        contact: {
          name: contact.name || contact.phone,
          handle_or_phone: contact.phone || "",
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
      setActiveConversation(conv);
    } catch {
      const conv: NormalizedConversation = {
        id: `conv_${contact.id}`,
        organization_id: user?.organizationId || "",
        contact: {
          name: contact.name || contact.phone,
          handle_or_phone: contact.phone || "",
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
      setActiveConversation(conv);
    }
  };

  const CONTACT_TABS = [
    { id: "ALL", label: "All Chats" },
    { id: "UNREAD", label: "Unread" },
    { id: "UNASSIGNED", label: "Unassigned" },
    { id: "MINE", label: "Assigned to Me" },
  ] as const;

  const rawContacts = data?.contacts || [];

  const contactTags = useMemo(() => {
    return Array.from(
      new Set(rawContacts.flatMap((c) => c.tags || []))
    ).filter(
      (t) =>
        ![
          "all",
          "all chats",
          "unread",
          "unassigned",
          "assigned to me",
          "mine",
        ].includes(t.toLowerCase())
    );
  }, [rawContacts]);

  const allTabs = useMemo(() => [
    ...CONTACT_TABS,
    ...contactTags.map((tag) => ({
      id: tag,
      label: tag.charAt(0).toUpperCase() + tag.slice(1),
    })),
  ], [contactTags]);

  const filteredContacts = useMemo(() => {
    if (activeFilter === "ALL") return rawContacts;
    if (activeFilter === "UNREAD") {
      const list = rawContacts.filter((c) =>
        c.tags?.some((t) => t.toLowerCase() === "unread")
      );
      return list.length > 0 ? list : rawContacts;
    }
    if (activeFilter === "UNASSIGNED") {
      const list = rawContacts.filter(
        (c) =>
          !c.crm_lead_id ||
          c.tags?.some((t) => t.toLowerCase() === "unassigned")
      );
      return list.length > 0 ? list : rawContacts;
    }
    if (activeFilter === "MINE") {
      const list = rawContacts.filter(
        (c) =>
          Boolean(c.crm_lead_id) ||
          c.tags?.some((t) =>
            ["mine", "assigned", "crm"].includes(t.toLowerCase())
          )
      );
      return list.length > 0 ? list : rawContacts;
    }
    return rawContacts.filter((c) =>
      c.tags?.some((t) => t.toLowerCase() === activeFilter.toLowerCase())
    );
  }, [rawContacts, activeFilter]);

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1"
      style={{ backgroundColor: color.background }}
    >
      <View className="flex-1">
        {/* Header matching WhatsApp Suite */}
        <View
          className={`flex-row items-center px-4 py-3.5 shadow-sm ${
            isDark ? "bg-[#1F2C34]" : "bg-[#075E54]"
          }`}
          style={{
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
              onPress={handleBack}
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
              <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
              <Text className="text-lg font-bold tracking-tight text-white">
                WhatsApp Contacts
              </Text>
            </View>
          </View>
        </View>

        {/* Search Bar (Borderless) */}
        <View className="px-4 pt-3 pb-1.5">
          <View
            className={`flex-row items-center rounded-xl px-3 h-10 shadow-sm ${
              isDark
                ? "bg-[#1C1C1E]"
                : "bg-white"
            }`}
            style={{
              borderWidth: 0,
              elevation: 1.5,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isDark ? 0.25 : 0.04,
              shadowRadius: 3,
            }}
          >
            <Ionicons
              name="search"
              size={17}
              color={isDark ? "#8E8E93" : "#8E8E93"}
              style={{ marginRight: 8 }}
            />
            <TextInput
              className={`flex-1 text-sm font-medium py-0 ${
                isDark ? "text-[#F8FAFC]" : "text-[#0F172A]"
              }`}
              placeholder="Search contacts by name or phone..."
              placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                <Ionicons
                  name="close-circle"
                  size={17}
                  color={isDark ? "#8E8E93" : "#8E8E93"}
                />
              </Pressable>
            )}
          </View>
        </View>

        {/* Folder-Style Status Filter Tab Bar (WhatsApp Green from color.ts) */}
        <View className="px-4 pt-1 mb-2">
          <View style={{ position: "relative" }}>
            {/* Continuous baseline across full width in WhatsApp Green */}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 1.5,
                backgroundColor: color.products.whatsapp,
              }}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 2 }}
            >
              {allTabs.map((tab) => {
                const isActive = activeFilter === tab.id;
                const activeColor = isDark
                  ? color.products.whatsapp
                  : (color.products.whatsappDark || "#075E54");

                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => {
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setActiveFilter(tab.id);
                    }}
                    style={{
                      height: 40,
                      paddingHorizontal: 13,
                      justifyContent: "center",
                      alignItems: "center",
                      borderTopLeftRadius: isActive ? 10 : 0,
                      borderTopRightRadius: isActive ? 10 : 0,
                      borderTopWidth: 1.5,
                      borderLeftWidth: 1.5,
                      borderRightWidth: 1.5,
                      borderBottomWidth: 1.5,
                      borderTopColor: isActive ? color.products.whatsapp : "transparent",
                      borderLeftColor: isActive ? color.products.whatsapp : "transparent",
                      borderRightColor: isActive ? color.products.whatsapp : "transparent",
                      borderBottomColor: isActive ? color.background : "transparent",
                      backgroundColor: isActive ? color.background : "transparent",
                      zIndex: isActive ? 2 : 1,
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 13,
                        fontWeight: isActive ? "600" : "500",
                        letterSpacing: -0.1,
                        color: isActive
                          ? activeColor
                          : (color.textSecondary || (isDark ? "#94A3B8" : "#64748B")),
                      }}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* Contacts List */}
        {isLoading && !data ? (
          <CrmListSkeleton />
        ) : (
          <FlatList
            className="flex-1"
            data={filteredContacts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ContactCard contact={item} onOpenChat={handleOpenChat} />
            )}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 4,
              paddingBottom: 130,
            }}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor="#25D366"
              />
            }
            ListEmptyComponent={
              <View className="p-10 items-center justify-center">
                <Text
                  className={`text-sm text-center ${
                    isDark ? "text-[#8E8E93]" : "text-[#64748B]"
                  }`}
                >
                  No contacts found matching your query
                </Text>
              </View>
            }
          />
        )}

        {/* Fullscreen WhatsApp Conversation Modal */}
        <Modal
          visible={!!activeConversation}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setActiveConversation(null)}
        >
          {activeConversation && (
            <ConversationScreen
              conversation={activeConversation}
              onBack={() => setActiveConversation(null)}
            />
          )}
        </Modal>
      </View>
    </SafeAreaView>
  );
};
