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
      style={{ backgroundColor: color.background }}
    >
      <View className="flex-1">
        {/* Header */}
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
              Broadcast Campaigns
            </Text>
          </View>
        </View>

        {/* Folder-Style Status Filter Tab Bar (WhatsApp Green from color.ts) */}
        <View className="px-4 pt-2 mb-2">
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
              {statusTabs.map((tab) => {
                const isActive = selectedStatus === tab.id;
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
                      handleStatusSelect(tab.id);
                    }}
                    style={{
                      height: 40,
                      paddingHorizontal: 14,
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
                tintColor="#25D366"
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
