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
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeContext";

import { getColors } from "@/theme";
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

  const tags = [
    "All",
    "VIP",
    "Enterprise",
    "Lead",
    "Retail",
    "High-Value",
    "Agency",
    "Creator",
  ];

  const contacts = data?.contacts || [];
  const totalCount = data?.total_count ?? contacts.length;

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: color.background }]}
    >
      <View style={styles.container}>
        {/* Header matching Overview Tab */}
        <View
          style={[
            styles.header,
            isDark ? styles.headerDark : styles.headerLight,
          ]}
        >
          <View style={styles.headerLeftRow}>
            <Pressable
              style={({ pressed }) => [
                styles.backButton,
                isDark ? styles.backButtonDark : styles.backButtonLight,
                pressed && styles.backButtonPressed,
              ]}
              onPress={handleBack}
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
              style={[
                styles.title,
                isDark ? styles.titleDark : styles.titleLight,
              ]}
            >
              WhatsApp Contacts
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchBar,
              isDark ? styles.searchBarDark : styles.searchBarLight,
            ]}
          >
            <Ionicons
              name="search"
              size={17}
              color={isDark ? "#8E8E93" : "#8E8E93"}
              style={styles.searchIcon}
            />
            <TextInput
              style={[
                styles.searchInput,
                isDark ? styles.textPrimaryDark : styles.textPrimaryLight,
              ]}
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

        {/* Tag Filters */}
        <View style={styles.tagWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagList}
          >
            {tags.map((item) => {
              const isSelected =
                item === "All" ? !selectedTag : selectedTag === item;
              return (
                <Pressable
                  key={item}
                  style={({ pressed }) => [
                    styles.tagChip,
                    isDark ? styles.tagChipDark : styles.tagChipLight,
                    isSelected &&
                      (isDark
                        ? styles.tagChipActiveDark
                        : styles.tagChipActiveLight),
                    pressed && styles.tagChipPressed,
                  ]}
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSelectedTag(item === "All" ? undefined : item);
                  }}
                >
                  <Text
                    style={[
                      styles.tagChipText,
                      isDark ? styles.tagChipTextDark : styles.tagChipTextLight,
                      isSelected &&
                        (isDark
                          ? styles.tagChipTextActiveDark
                          : styles.tagChipTextActiveLight),
                    ]}
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
            style={styles.contactsFlatList}
            data={contacts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ContactCard contact={item} onOpenChat={handleOpenChat} />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={isDark ? "#FFFFFF" : "#0A84FF"}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text
                  style={[
                    styles.emptyText,
                    isDark
                      ? styles.textSecondaryDark
                      : styles.textSecondaryLight,
                  ]}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerDark: {
    backgroundColor: "#000000",
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  headerLight: {
    backgroundColor: "#FFFFFF",
    borderBottomColor: "rgba(0, 0, 0, 0.06)",
  },
  headerLeftRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
  },
  backButtonLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  backButtonDark: {
    backgroundColor: "#1C1C1E",
    borderColor: "#2C2C2E",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  backButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  titleLight: {
    color: "#0F172A",
  },
  titleDark: {
    color: "#F8FAFC",
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "400",
    marginTop: 1,
    letterSpacing: -0.1,
  },
  subtitleLight: {
    color: "#64748B",
  },
  subtitleDark: {
    color: "#8E8E93",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchBarDark: {
    backgroundColor: "#1C1C1E",
    borderColor: "#2C2C2E",
  },
  searchBarLight: {
    backgroundColor: "#F2F2F7",
    borderColor: "#E5E7EB",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    paddingVertical: 0,
  },
  tagWrapper: {
    paddingVertical: 6,
    marginBottom: 6,
  },
  tagList: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  tagChipDark: {
    backgroundColor: "#1C1C1E",
    borderColor: "#2C2C2E",
  },
  tagChipLight: {
    backgroundColor: "#F2F2F7",
    borderColor: "#E5E7EB",
  },
  tagChipActiveDark: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
  },
  tagChipActiveLight: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  tagChipPressed: {
    opacity: 0.8,
  },
  tagChipText: {
    fontSize: 12.5,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  tagChipTextDark: {
    color: "#8E8E93",
  },
  tagChipTextLight: {
    color: "#6B7280",
  },
  tagChipTextActiveDark: {
    color: "#000000",
    fontWeight: "700",
  },
  tagChipTextActiveLight: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  contactsFlatList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 130,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  textPrimaryDark: {
    color: "#F8FAFC",
  },
  textPrimaryLight: {
    color: "#0F172A",
  },
  textSecondaryDark: {
    color: "#8E8E93",
  },
  textSecondaryLight: {
    color: "#64748B",
  },
});
