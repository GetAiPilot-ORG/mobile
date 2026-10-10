import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme";
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
      className="flex-1"
      style={{ backgroundColor: isDark ? "#000000" : "#F8F9FA" }}
    >
      <View className="flex-1">
        {/* Header */}
        <View
          className={`flex-row items-center px-4 py-3 border-b ${
            isDark
              ? "bg-black border-white/[0.08]"
              : "bg-white border-black/[0.06]"
          }`}
        >
          <Pressable
            className={`w-10 h-10 rounded-full justify-center items-center mr-3 border active:opacity-70 active:scale-95 shadow-sm ${
              isDark
                ? "bg-[#1C1C1E] border-[#2C2C2E]"
                : "bg-white border-[#E5E7EB]"
            }`}
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
            className={`text-xl font-bold tracking-tight ${
              isDark ? "text-[#F8FAFC]" : "text-[#0F172A]"
            }`}
          >
            Broadcast Campaigns
          </Text>
        </View>

        {/* Filter Pills */}
        <View className="flex-row px-4 py-3 gap-2">
          {statusTabs.map((tab) => {
            const isSelected = selectedStatus === tab;
            return (
              <Pressable
                key={tab}
                className={`px-4 py-2 rounded-full border active:opacity-80 ${
                  isSelected
                    ? isDark
                      ? "bg-white border-white"
                      : "bg-black border-black"
                    : isDark
                    ? "bg-[#1C1C1E] border-[#2C2C2E]"
                    : "bg-[#F2F2F7] border-[#E5E7EB]"
                }`}
                onPress={() => handleStatusSelect(tab)}
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
              padding: 16,
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
                  className={`text-sm ${
                    isDark ? "text-[#94A3B8]" : "text-[#64748B]"
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
