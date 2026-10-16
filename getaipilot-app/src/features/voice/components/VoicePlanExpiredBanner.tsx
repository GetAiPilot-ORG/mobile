import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useTheme, getColors } from "@/theme";
import { VoiceOverview } from "../api/voiceApi";
import { openVoiceWebBilling } from "../utils/voiceBilling";

interface VoicePlanExpiredBannerProps {
  overview?: VoiceOverview | null;
  onNavigateToLines?: () => void;
  style?: any;
}

export const VoicePlanExpiredBanner: React.FC<VoicePlanExpiredBannerProps> = ({
  overview,
  onNavigateToLines,
  style,
}) => {
  const queryClient = useQueryClient();
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);

  const colors = {
    ...themeColors,
    primary: themeColors.products?.voice || "#5844E3",
    text: themeColors.text,
  };

  const isPlanExpired = Boolean(overview?.isPlanExpired);
  if (!isPlanExpired) return null;

  const planName = overview?.planName || "Voice Plan";
  const expiryDate = overview?.currentPeriodEnd
    ? new Date(overview.currentPeriodEnd).toLocaleDateString()
    : null;

  const expiredNumbersCount = overview?.expiredNumbersCount;

  return (
    <View
      className={`rounded-[24px] p-4 gap-3  ${
        isDark ? "bg-stone-900/90" : "bg-amber-50"
      }`}
      style={style}
    >
      {/* Header */}
      <View className="flex-row items-start gap-3">
        <View
          className={`w-9 h-9 rounded-xl items-center justify-center shrink-0 ${
            isDark ? "bg-amber-500/15" : "bg-amber-100/80"
          }`}
        >
          <Ionicons name="information-circle-outline" size={22} color="#D97706" />
        </View>
        <View className="flex-1 gap-1 min-w-0">
          <View className="flex-row items-center gap-2 flex-wrap">
            <Text className="text-base font-bold tracking-tight" style={{ color: colors.text }}>
              {planName}
            </Text>
            <View className="bg-red-500/15 px-2 py-0.5 rounded-full">
              <Text className="text-[11px] font-bold text-red-500">Plan Expired</Text>
            </View>
          </View>
          <Text
            className={`text-xs leading-4 ${isDark ? "text-stone-400" : "text-stone-600"}`}
          >
            Calling lines are paused. Renew your 30-day plan to reactivate calling.
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View
        className={`flex-row items-center justify-between pt-2.5  ${
          isDark ? "border-amber-500/10" : "border-amber-200/50"
        } gap-2`}
      >
        {onNavigateToLines && expiredNumbersCount ? (
          <Pressable
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 active:opacity-75 shrink min-w-0"
            onPress={onNavigateToLines}
          >
            <Ionicons name="phone-portrait-outline" size={12} color="#D97706" />
            <Text className="text-xs font-semibold text-amber-600" numberOfLines={1}>
              {expiredNumbersCount} Inactive Line{expiredNumbersCount > 1 ? "s" : ""}
            </Text>
            <Ionicons name="chevron-forward" size={11} color="#D97706" />
          </Pressable>
        ) : (
          <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 shrink min-w-0">
            <Ionicons name="time-outline" size={12} color="#D97706" />
            <Text className="text-xs font-semibold text-amber-600" numberOfLines={1}>
              {expiryDate ? `Expired on ${expiryDate}` : "Renewal Required"}
            </Text>
          </View>
        )}

        <Pressable
          className="flex-row items-center gap-1.5 px-3.5 py-2 rounded-xl active:opacity-80 shrink-0"
          style={{ backgroundColor: colors.primary }}
          onPress={() => openVoiceWebBilling(queryClient, isDark)}
        >
          <Ionicons name="sparkles" size={12} color="#FFFFFF" />
          <Text className="text-xs font-bold text-white">Renew Plan</Text>
          <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
};
