import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeContext";

import { getColors } from "@/theme";
import { WhatsAppBroadcastsSkeleton } from "../../../components/skeletonScreen";
import { BroadcastCard } from "../components";
import { useWhatsAppBroadcasts } from "../hooks/useWhatsAppBroadcasts";
import { WhatsAppBroadcast } from "../types";
import { WhatsAppBroadcastDetailScreen } from "./WhatsAppBroadcastDetailScreen";

interface WhatsAppBroadcastsScreenProps {
  onBack?: () => void;
}

export const WhatsAppBroadcastsScreen: React.FC<
  WhatsAppBroadcastsScreenProps
> = ({ onBack }) => {
  const router = useRouter();
  const { isDark } = useTheme();
  const color = getColors(isDark);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedBroadcast, setSelectedBroadcast] =
    useState<WhatsAppBroadcast | null>(null);

  const { data, isLoading, refetch, isRefetching } = useWhatsAppBroadcasts({
    status: selectedStatus !== "all" ? selectedStatus : undefined,
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

  const handleStatusSelect = (tab: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedStatus(tab);
  };

  if (selectedBroadcast) {
    return (
      <WhatsAppBroadcastDetailScreen
        broadcast={selectedBroadcast}
        onBack={() => setSelectedBroadcast(null)}
      />
    );
  }

  const broadcasts = data?.broadcasts || [];
  const statusTabs = ["all", "completed", "queued", "scheduled"];

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? "#000000" : "#F8F9FA" },
      ]}
    >
      <View style={styles.container}>
        {/* Header matching Overview Tab */}
        <View
          style={[
            styles.header,
            isDark ? styles.headerDark : styles.headerLight,
          ]}
        >
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
            Broadcast Campaigns
          </Text>
        </View>
      </View>

      {/* Filter Pills */}
      <View style={styles.filterRow}>
        {statusTabs.map((tab) => {
          const isSelected = selectedStatus === tab;
          return (
            <Pressable
              key={tab}
              style={({ pressed }) => [
                styles.filterChip,
                isDark ? styles.filterChipDark : styles.filterChipLight,
                isSelected &&
                  (isDark
                    ? styles.filterChipActiveDark
                    : styles.filterChipActiveLight),
                pressed && styles.filterChipPressed,
              ]}
              onPress={() => handleStatusSelect(tab)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isDark
                    ? styles.filterChipTextDark
                    : styles.filterChipTextLight,
                  isSelected &&
                    (isDark
                      ? styles.filterChipTextActiveDark
                      : styles.filterChipTextActiveLight),
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Broadcasts List */}
      {isLoading && !data ? (
        <WhatsAppBroadcastsSkeleton />
      ) : (
        <FlatList
          data={broadcasts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BroadcastCard
              broadcast={item}
              onPress={(b) => setSelectedBroadcast(b)}
            />
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
                  { color: isDark ? "#94A3B8" : "#64748B" },
                ]}
              >
                No broadcast campaigns found
              </Text>
            </View>
          }
        />
      )}
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
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: StyleSheet.hairlineWidth,
  },
  filterChipDark: {
    backgroundColor: "#1C1C1E",
    borderColor: "#2C2C2E",
  },
  filterChipLight: {
    backgroundColor: "#F2F2F7",
    borderColor: "#E5E7EB",
  },
  filterChipActiveDark: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
  },
  filterChipActiveLight: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  filterChipPressed: {
    opacity: 0.8,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  filterChipTextDark: {
    color: "#8E8E93",
  },
  filterChipTextLight: {
    color: "#6B7280",
  },
  filterChipTextActiveDark: {
    color: "#000000",
    fontWeight: "700",
  },
  filterChipTextActiveLight: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  listContent: {
    padding: 16,
    paddingBottom: 130,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 13,
    marginTop: 10,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
});
