import { ProductPageHeader } from "@/components/ProductUI";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
  const [activeConversation, setActiveConversation] =
    useState<NormalizedConversation | null>(null);

  const { data, isLoading, refetch, isRefetching } = useWhatsAppContacts({
    search: searchQuery || undefined,
    tag: selectedTag,
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

  const contacts = data?.contacts || [];
  const tags = [
    "All",
    ...Array.from(
      new Set(
        contacts.flatMap((c) => c.tags || [])
      )
    ),
  ];

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1"
      style={{ backgroundColor: color.background }}
    >
      <View className="flex-1">
        <ProductPageHeader title="Your contacts" onBack={handleBack} />

        {/* Search Bar */}
        <View className="px-4 pt-3 pb-1.5">
          <View
            className={`flex-row items-center rounded-xl px-3 h-10 border ${
              isDark
                ? "bg-[#252230] border-[#3A3549]"
                : "bg-[#F0EEF8] border-[#E9E6F2]"
            }`}
          >
            <Ionicons
              name="search"
              size={17}
              color={isDark ? "#8E8E93" : "#8E8E93"}
              style={{ marginRight: 8 }}
            />
            <TextInput
              className={`flex-1 text-sm font-medium py-0 ${
                isDark ? "text-[#F5F3FB]" : "text-[#1C1A25]"
              }`}
              placeholder="Search contacts by name or phone..."
              placeholderTextColor={isDark ? "#64748B" : "#777383"}
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

        {/* Tag Filters */}
        <View className="py-1.5 mb-1.5">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            {tags.map((item) => {
              const isSelected =
                item === "All" ? !selectedTag : selectedTag === item;
              return (
                <Pressable
                  key={item}
                  className={`px-4 py-1.5 rounded-full border items-center justify-center active:opacity-80 ${
                    isSelected
                      ? isDark
                        ? "bg-white border-white"
                        : "bg-black border-black"
                      : isDark
                      ? "bg-[#252230] border-[#3A3549]"
                      : "bg-[#F0EEF8] border-[#E9E6F2]"
                  }`}
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSelectedTag(item === "All" ? undefined : item);
                  }}
                >
                  <Text
                    className={`text-xs font-semibold tracking-tight ${
                      isSelected
                        ? isDark
                          ? "text-black font-bold"
                          : "text-white font-bold"
                        : isDark
                        ? "text-[#8E8E93]"
                        : "text-[#6B7280]"
                    }`}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Contacts List */}
        {isLoading && !data ? (
          <CrmListSkeleton />
        ) : (
          <FlatList
            className="flex-1"
            data={contacts}
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
                tintColor={isDark ? "#FFFFFF" : "#0A84FF"}
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
