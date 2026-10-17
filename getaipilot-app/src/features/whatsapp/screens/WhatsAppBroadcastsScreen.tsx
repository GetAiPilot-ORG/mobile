import { ProductPageHeader } from "@/components/ProductUI";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getColors, useTheme } from "@/theme";
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
  const statusTabs = [
    { id: "all", label: "All" },
    { id: "completed", label: "Completed" },
    { id: "queued", label: "Queued" },
    { id: "scheduled", label: "Scheduled" },
  ];

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1"
      style={{ backgroundColor: isDark ? "#000000" : "#F5F3FB" }}
    >
      <View className="flex-1">
        <ProductPageHeader title="Your broadcasts" onBack={handleBack} />

        {/* Filter Pills */}
        <View className="flex-row px-4 py-3 gap-2">
          {statusTabs.map((tab) => {
            const isSelected = selectedStatus === tab.id;
            return (
              <Pressable
                key={tab.id}
                className={`px-4 py-2 rounded-full border active:opacity-80 ${
                  isSelected
                    ? isDark
                      ? "bg-white border-white"
                      : "bg-black border-black"
                    : isDark
                    ? "bg-[#252230] border-[#3A3549]"
                    : "bg-[#F0EEF8] border-[#E9E6F2]"
                }`}
                onPress={() => handleStatusSelect(tab.id)}
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
                  {tab.label}
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
            className="flex-1"
            data={broadcasts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <BroadcastCard
                broadcast={item}
                onPress={(b) => setSelectedBroadcast(b)}
              />
            )}
            contentContainerStyle={{
              padding: 20,
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
                  className={`text-sm ${
                    isDark ? "text-[#777383]" : "text-[#64748B]"
                  }`}
                >
                  No broadcast campaigns found
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};
