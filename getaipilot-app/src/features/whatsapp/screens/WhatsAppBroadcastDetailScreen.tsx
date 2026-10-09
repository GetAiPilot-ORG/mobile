import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getColors, useTheme } from "../../../theme";
import { useWhatsAppBroadcasts } from "../hooks/useWhatsAppBroadcasts";
import { WhatsAppBroadcast } from "../types";

interface WhatsAppBroadcastDetailScreenProps {
  broadcast?: WhatsAppBroadcast;
  broadcastId?: string;
  onBack?: () => void;
}

export const WhatsAppBroadcastDetailScreen: React.FC<
  WhatsAppBroadcastDetailScreenProps
> = ({ broadcast: initialBroadcast, broadcastId, onBack }) => {
  const router = useRouter();
  const { isDark } = useTheme();
  const color = getColors(isDark);

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

  const { data: broadcastsData, isLoading } = useWhatsAppBroadcasts();
  const broadcast =
    initialBroadcast ||
    broadcastsData?.broadcasts.find((b) => b.id === broadcastId);

  if (isLoading && !broadcast) {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        className="flex-1"
        style={{ backgroundColor: color.background }}
      >
        <View className="flex-1 justify-center items-center p-6">
          <ActivityIndicator
            size="large"
            color={isDark ? "#F8FAFC" : "#0A84FF"}
          />
          <Text
            className={`text-sm mt-3 ${
              isDark ? "text-[#94A3B8]" : "text-[#64748B]"
            }`}
          >
            Loading broadcast analytics...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!broadcast) {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        className="flex-1"
        style={{ backgroundColor: color.background }}
      >
        <View className="flex-1 justify-center items-center p-6">
          <Text
            className={`text-base font-semibold ${
              isDark ? "text-[#F8FAFC]" : "text-[#0F172A]"
            }`}
          >
            Broadcast campaign not found
          </Text>
          <Pressable
            className={`flex-row items-center px-4 py-2.5 rounded-full border mt-3.5 active:opacity-75 ${
              isDark
                ? "bg-[#1C1C1E] border-[#2C2C2E]"
                : "bg-white border-[#E5E7EB]"
            }`}
            onPress={handleBack}
          >
            <Ionicons
              name="chevron-back"
              size={16}
              color={isDark ? "#F8FAFC" : "#0F172A"}
              style={{ marginRight: 4 }}
            />
            <Text
              className={`text-sm font-semibold ${
                isDark ? "text-[#F8FAFC]" : "text-[#0F172A]"
              }`}
            >
              Return to Broadcasts
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isCompleted = broadcast.status === "completed";
  const isQueued =
    broadcast.status === "queued" || broadcast.status === "preparing";
  const isScheduled = broadcast.status === "scheduled";

  const statusBg = isCompleted
    ? isDark
      ? "rgba(52, 199, 89, 0.16)"
      : "rgba(52, 199, 89, 0.12)"
    : isQueued
      ? isDark
        ? "rgba(10, 132, 255, 0.16)"
        : "rgba(0, 122, 255, 0.12)"
      : isScheduled
        ? isDark
          ? "rgba(255, 159, 10, 0.16)"
          : "rgba(255, 149, 0, 0.12)"
        : isDark
          ? "rgba(255, 69, 58, 0.16)"
          : "rgba(255, 59, 48, 0.12)";

  const statusText = isCompleted
    ? isDark
      ? "#30D158"
      : "#248A3D"
    : isQueued
      ? isDark
        ? "#0A84FF"
        : "#007AFF"
      : isScheduled
        ? isDark
          ? "#FF9F0A"
          : "#D97706"
        : isDark
          ? "#FF453A"
          : "#DC2626";

  const deliveryRate =
    broadcast.sent_count > 0
      ? Math.round((broadcast.delivered_count / broadcast.sent_count) * 100)
      : 0;
  const readRate =
    broadcast.sent_count > 0
      ? Math.round((broadcast.read_count / broadcast.sent_count) * 100)
      : 0;

  const funnelSteps = [
    {
      label: "Total Audience",
      value: broadcast.recipients_count.toLocaleString(),
      icon: "people-outline" as const,
      iconColor: isDark ? "#94A3B8" : "#64748B",
      bgColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#F1F5F9",
    },
    {
      label: "Dispatched / Sent",
      value: broadcast.sent_count.toLocaleString(),
      icon: "paper-plane-outline" as const,
      iconColor: "#0A84FF",
      bgColor: isDark ? "rgba(10, 132, 255, 0.12)" : "rgba(0, 122, 255, 0.08)",
    },
    {
      label: `Delivered (${deliveryRate}%)`,
      value: broadcast.delivered_count.toLocaleString(),
      icon: "checkmark-done-outline" as const,
      iconColor: isDark ? "#30D158" : "#248A3D",
      bgColor: isDark ? "rgba(52, 199, 89, 0.12)" : "rgba(52, 199, 89, 0.08)",
    },
    {
      label: `Read / Opened (${readRate}%)`,
      value: broadcast.read_count.toLocaleString(),
      icon: "mail-open-outline" as const,
      iconColor: isDark ? "#38BDF8" : "#0284C7",
      bgColor: isDark ? "rgba(56, 189, 248, 0.12)" : "rgba(2, 132, 199, 0.08)",
    },
    ...(broadcast.failed_count > 0
      ? [
        {
          label: "Failed / Undelivered",
          value: broadcast.failed_count.toLocaleString(),
          icon: "alert-circle-outline" as const,
          iconColor: isDark ? "#FF453A" : "#DC2626",
          bgColor: isDark
            ? "rgba(255, 69, 58, 0.12)"
            : "rgba(220, 38, 38, 0.08)",
        },
      ]
      : []),
  ];

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1"
      style={{ backgroundColor: color.background }}
    >
      {/* Header */}
      <View
        className={`flex-row items-center px-4 py-3 border-b ${
          isDark
            ? "bg-black border-white/[0.08]"
            : "bg-white border-black/[0.06]"
        }`}
      >
        <View className="flex-row items-center flex-1">
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
            className={`text-xl font-bold tracking-tight flex-1 ${
              isDark ? "text-[#F8FAFC]" : "text-[#0F172A]"
            }`}
            numberOfLines={1}
          >
            {broadcast.name}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Campaign Summary Card */}
        <View
          className={`rounded-2xl p-4 border mb-4 shadow-sm ${
            isDark ? "bg-[#1C1C1E] border-[#2C2C2E]" : "bg-white border-[#E5E7EB]"
          }`}
        >
          <View className="flex-row justify-between items-center mb-2">
            <Text
              className={`text-xs font-semibold ${
                isDark ? "text-[#8E8E93]" : "text-[#64748B]"
              }`}
            >
              Execution Status
            </Text>
            <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: statusBg }}>
              <Text className="text-xs font-semibold" style={{ color: statusText }}>
                {broadcast.status.charAt(0).toUpperCase() +
                  broadcast.status.slice(1).toLowerCase()}
              </Text>
            </View>
          </View>
          <Text
            className={`text-xl font-bold tracking-tight mb-1 ${
              isDark ? "text-[#F8FAFC]" : "text-[#0F172A]"
            }`}
          >
            {broadcast.name}
          </Text>
          <Text
            className={`text-xs font-medium ${
              isDark ? "text-[#94A3B8]" : "text-[#64748B]"
            }`}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            Template: {broadcast.template_name} ({broadcast.template_language})
          </Text>
        </View>

        {/* Funnel Telemetry Breakdown */}
        <Text
          className={`text-xs font-semibold tracking-wider uppercase mb-2 ml-1 ${
            isDark ? "text-[#8E8E93]" : "text-[#64748B]"
          }`}
        >
          Delivery Funnel
        </Text>
        <View
          className={`rounded-2xl border mb-5 shadow-sm overflow-hidden ${
            isDark ? "bg-[#1C1C1E] border-[#2C2C2E]" : "bg-white border-[#E5E7EB]"
          }`}
        >
          {funnelSteps.map((step, index) => (
            <React.Fragment key={step.label}>
              <View className="flex-row items-center p-3.5">
                <View
                  className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: step.bgColor }}
                >
                  <Ionicons name={step.icon} size={18} color={step.iconColor} />
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-sm font-semibold ${
                      isDark ? "text-[#F8FAFC]" : "text-[#0F172A]"
                    }`}
                  >
                    {step.label}
                  </Text>
                </View>
                <Text
                  className={`text-base font-bold ${
                    isDark ? "text-[#F8FAFC]" : "text-[#0F172A]"
                  }`}
                >
                  {step.value}
                </Text>
              </View>
              {index < funnelSteps.length - 1 && (
                <View
                  className={`h-[1px] ml-15 ${
                    isDark ? "bg-white/[0.08]" : "bg-black/[0.06]"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Campaign Metadata Details */}
        <Text
          className={`text-xs font-semibold tracking-wider uppercase mb-2 ml-1 ${
            isDark ? "text-[#8E8E93]" : "text-[#64748B]"
          }`}
        >
          Campaign Details
        </Text>
        <View
          className={`rounded-2xl border mb-8 shadow-sm overflow-hidden ${
            isDark ? "bg-[#1C1C1E] border-[#2C2C2E]" : "bg-white border-[#E5E7EB]"
          }`}
        >
          <View className="flex-row justify-between items-center p-3.5">
            <Text className={`text-xs font-medium ${isDark ? "text-[#94A3B8]" : "text-[#64748B]"}`}>
              Audience Segment
            </Text>
            <Text className={`text-sm font-semibold ${isDark ? "text-[#F8FAFC]" : "text-[#0F172A]"}`}>
              {broadcast.audience_tag || "All Contacts"}
            </Text>
          </View>
          <View className={`h-[1px] ${isDark ? "bg-white/[0.08]" : "bg-black/[0.06]"}`} />

          <View className="flex-row justify-between items-center p-3.5">
            <Text className={`text-xs font-medium ${isDark ? "text-[#94A3B8]" : "text-[#64748B]"}`}>
              Audience Type
            </Text>
            <Text className={`text-sm font-semibold ${isDark ? "text-[#F8FAFC]" : "text-[#0F172A]"}`}>
              {broadcast.audience_type
                ? broadcast.audience_type.charAt(0).toUpperCase() +
                  broadcast.audience_type.slice(1).toLowerCase()
                : "Custom"}
            </Text>
          </View>
          <View className={`h-[1px] ${isDark ? "bg-white/[0.08]" : "bg-black/[0.06]"}`} />

          <View className="flex-row justify-between items-center p-3.5">
            <Text className={`text-xs font-medium ${isDark ? "text-[#94A3B8]" : "text-[#64748B]"}`}>
              Cost Incurred
            </Text>
            <Text className={`text-sm font-semibold ${isDark ? "text-[#F8FAFC]" : "text-[#0F172A]"}`}>
              ₹
              {(
                (broadcast.actual_cost_paise ||
                  broadcast.estimated_cost_paise ||
                  0) / 100
              ).toFixed(2)}
            </Text>
          </View>
          <View className={`h-[1px] ${isDark ? "bg-white/[0.08]" : "bg-black/[0.06]"}`} />

          <View className="flex-row justify-between items-center p-3.5">
            <Text className={`text-xs font-medium ${isDark ? "text-[#94A3B8]" : "text-[#64748B]"}`}>
              Created At
            </Text>
            <Text className={`text-sm font-semibold ${isDark ? "text-[#F8FAFC]" : "text-[#0F172A]"}`}>
              {new Date(broadcast.created_at).toLocaleString()}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
