import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Bot,
  Database,
  Megaphone,
  Phone,
  PhoneCall,
  Sparkles,
  Zap,
} from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useTheme, getColors } from "@/theme";
import { VoiceOverview, voiceApi } from "../api/voiceApi";
import { VoicePlanExpiredBanner } from "../components";
import { openVoiceWebBilling } from "../utils/voiceBilling";

interface Props {
  onNavigateTab?: (
    tab: "overview" | "calls" | "campaigns" | "contacts",
  ) => void;
  onOpenTriggerCall?: (assistantId?: string) => void;
  onOpenCreateCampaign?: () => void;
  onOpenCreateAssistant?: () => void;
}

const EMPTY: VoiceOverview = {
  totalAssistants: 0,
  activeCampaigns: 0,
  totalCalls: 0,
  creditBalance: 0,
  creditBalanceDisplay: "0 AI Mins",
};

/**
 * Tasteful live soundwave telemetry animation (4 rhythmically oscillating bars).
 * Native driver driven for 60fps performance without CPU overhead.
 */
const VoiceSoundwaveAnimation: React.FC<{ color?: string }> = ({
  color = "#C084FC",
}) => {
  const bar1 = useRef(new Animated.Value(0.4)).current;
  const bar2 = useRef(new Animated.Value(0.85)).current;
  const bar3 = useRef(new Animated.Value(0.3)).current;
  const bar4 = useRef(new Animated.Value(0.75)).current;

  useEffect(() => {
    const createAnim = (
      val: Animated.Value,
      min: number,
      max: number,
      duration: number,
    ) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: max,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: min,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
    };

    const a1 = createAnim(bar1, 0.3, 1.0, 680);
    const a2 = createAnim(bar2, 0.25, 0.95, 820);
    const a3 = createAnim(bar3, 0.35, 1.05, 540);
    const a4 = createAnim(bar4, 0.3, 0.9, 910);

    a1.start();
    a2.start();
    a3.start();
    a4.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
      a4.stop();
    };
  }, [bar1, bar2, bar3, bar4]);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 2.5,
        height: 18,
      }}
    >
      {[bar1, bar2, bar3, bar4].map((anim, idx) => (
        <Animated.View
          key={idx}
          style={{
            width: 3,
            height: 16,
            borderRadius: 2,
            backgroundColor: color,
            transform: [{ scaleY: anim }],
          }}
        />
      ))}
    </View>
  );
};

/**
 * Elegant live green telemetry pulsing dot.
 */
const LivePulseDot: React.FC<{ color?: string }> = ({ color = "#34D399" }) => {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <View
      style={{
        width: 8,
        height: 8,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: color,
          opacity: pulse,
        }}
      />
    </View>
  );
};

/**
 * Real-time Speech Waveform Spectrum (8 dynamic vertical bars)
 */
const TelemetryWaveSpectrum: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const heights = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.6)).current,
    useRef(new Animated.Value(0.9)).current,
    useRef(new Animated.Value(0.4)).current,
    useRef(new Animated.Value(0.8)).current,
    useRef(new Animated.Value(1.0)).current,
    useRef(new Animated.Value(0.5)).current,
    useRef(new Animated.Value(0.7)).current,
  ];

  useEffect(() => {
    const anims = heights.map((val, idx) => {
      const duration = 400 + (idx % 4) * 180;
      return Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: 0.2 + ((idx * 3) % 8) * 0.08,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0.85 + (idx % 2) * 0.15,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    });

    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);

  const barColor = isDark ? "#C084FC" : "#9333EA";

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 3, height: 20 }}>
      {heights.map((h, i) => (
        <Animated.View
          key={i}
          style={{
            width: 3,
            height: 18,
            borderRadius: 1.5,
            backgroundColor: barColor,
            opacity: 0.85,
            transform: [{ scaleY: h }],
          }}
        />
      ))}
    </View>
  );
};

interface ActionCardProps {
  icon: React.ReactNode;
  iconGradient: [string, string];
  title: string;
  badgeText: string;
  badgeBg: string;
  badgeTextColor: string;
  description: string;
  tags: string[];
  actionLabel: string;
  accentColor: string;
  onPress: () => void;
  isDark: boolean;
  surfaceColor: string;
  textColor: string;
  textSecondary: string;
}

/**
 * Tactile, elevated action card with spring micro-interaction and clean modern tags.
 */
const TactileActionCard: React.FC<ActionCardProps> = ({
  icon,
  iconGradient,
  title,
  badgeText,
  badgeBg,
  badgeTextColor,
  description,
  tags,
  actionLabel,
  accentColor,
  onPress,
  isDark,
  surfaceColor,
  textColor,
  textSecondary,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 45,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 35,
      bounciness: 6,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={() => {
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className="p-3.5 sm:p-4 rounded-2xl"
        style={{
          backgroundColor: surfaceColor,
          borderWidth: 0,
          elevation: 2,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.05,
          shadowRadius: 6,
        }}
      >
        <View className="flex-row items-start gap-3">
          {/* Gradient Icon Squircle */}
          <LinearGradient
            colors={iconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="w-11 h-11 rounded-xl items-center justify-center shrink-0"
            style={{
              elevation: 2,
              shadowColor: iconGradient[0],
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
            }}
          >
            {icon}
          </LinearGradient>

          {/* Main Content Area */}
          <View className="flex-1 min-w-0">
            {/* Title & Category Badge */}
            <View className="flex-row items-center justify-between gap-2 mb-1">
              <Text
                className="text-[15px] font-bold tracking-tight flex-1"
                style={{ color: textColor }}
                numberOfLines={1}
              >
                {title}
              </Text>
              <View
                className="px-2 py-0.5 rounded-full"
                style={{ backgroundColor: badgeBg }}
              >
                <Text
                  className="text-[10px] font-extrabold uppercase tracking-wider"
                  style={{ color: badgeTextColor }}
                >
                  {badgeText}
                </Text>
              </View>
            </View>

            {/* Description */}
            <Text
              className="text-xs leading-4"
              style={{ color: textSecondary }}
              numberOfLines={2}
            >
              {description}
            </Text>

            {/* Bottom Row: Feature Tags & Action Pill */}
            <View
              className="flex-row items-center justify-between mt-2.5 pt-2"
              style={{
                borderTopWidth: 1,
                borderTopColor: isDark
                  ? "rgba(255, 255, 255, 0.07)"
                  : "rgba(0, 0, 0, 0.05)",
              }}
            >
              {/* Feature Chips */}
              <View className="flex-row items-center gap-1.5 flex-1 mr-2">
                {tags.map((tag, idx) => (
                  <View
                    key={idx}
                    className="px-2 py-0.5 rounded-md"
                    style={{
                      backgroundColor: isDark
                        ? "rgba(255, 255, 255, 0.06)"
                        : "#F3F4F6",
                    }}
                  >
                    <Text
                      className="text-[10.5px] font-medium"
                      style={{ color: textSecondary }}
                      numberOfLines={1}
                    >
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Action Pill Button */}
              <View
                className="flex-row items-center gap-1 px-2.5 py-1 rounded-full shrink-0"
                style={{
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(0, 0, 0, 0.04)",
                }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: accentColor }}
                >
                  {actionLabel}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={12}
                  color={accentColor}
                />
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export const VoiceOverviewScreen: React.FC<Props> = ({
  onNavigateTab,
  onOpenTriggerCall,
  onOpenCreateCampaign,
  onOpenCreateAssistant,
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);

  const {
    data = EMPTY,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["voice", "overview"],
    queryFn: voiceApi.getOverview,
  });

  const { data: assistants = [] } = useQuery({
    queryKey: ["voice", "assistants"],
    queryFn: () => voiceApi.getAssistants(),
  });

  const { data: numbers = [] } = useQuery({
    queryKey: ["voice", "numbers"],
    queryFn: () => voiceApi.getNumbers(),
  });

  const colors = {
    ...themeColors,
    background: themeColors.background,
    surface: isDark ? "#1A1528" : "#FFFFFF",
    surfaceAlt: themeColors.surfaceSecondary,
    border: themeColors.border,
    text: themeColors.text,
    textSecondary: themeColors.textMuted,
    primary: themeColors.products?.voice || "#A855F7",
    primaryDark: themeColors.products?.voiceDark || "#7E22CE",
    primaryLight:
      themeColors.products?.voiceSoft ||
      (isDark ? "rgba(168, 85, 247, 0.16)" : "#F3E8FF"),
    green: themeColors.success,
    greenLight: themeColors.successSoft,
    chevron: themeColors.iconMuted,
  };

  const navigate = (tab: "overview" | "calls" | "campaigns" | "contacts") => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onNavigateTab?.(tab);
  };

  const activeCampaignsCount = data?.activeCampaigns ?? 0;
  const creditDisplay =
    data?.creditBalanceDisplay || `${data?.creditBalance ?? 0} AI Mins`;
  const totalAssistantsCount = data?.totalAssistants ?? assistants.length ?? 0;
  const totalCallsCount = data?.totalCalls ?? 0;
  const rawMinutes =
    typeof data?.creditBalance === "number"
      ? data.creditBalance
      : parseInt(creditDisplay.replace(/\D/g, "") || "0", 10);

  return (
    <ScrollView
      className="flex-1 w-full"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 180,
        gap: 16,
        width: "100%",
      }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            refetch();
            queryClient.invalidateQueries({
              queryKey: ["voice", "assistants"],
            });
            queryClient.invalidateQueries({ queryKey: ["voice", "numbers"] });
          }}
          tintColor={isDark ? "#C084FC" : colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* 1. TELEPHONY TELEMETRY STATUS RIBBON */}
      <View
        className="flex-row items-center justify-between px-3.5 py-2.5 rounded-2xl"
        style={{
          backgroundColor: isDark ? "#171224" : "#F5F3FF",
          borderWidth: 0,
        }}
      >
        <View className="flex-row items-center gap-2 flex-1 mr-2">
          <LivePulseDot color="#10B981" />
          <View className="flex-1">
            <Text
              className="text-[11px] font-extrabold uppercase tracking-wider"
              style={{ color: isDark ? "#C084FC" : "#6B21A8" }}
              numberOfLines={1}
            >
              Telecom Cloud Ready
            </Text>
            <Text
              className="text-[10px] font-medium"
              style={{ color: colors.textSecondary }}
              numberOfLines={1}
            >
              Autonomous Inbound & Outbound AI Telephony
            </Text>
          </View>
        </View>

        {/* Live Audio Telemetry Animation */}
        <VoiceSoundwaveAnimation color={isDark ? "#C084FC" : "#7E22CE"} />
      </View>

      {/* EXPIRED PLAN NOTICE BANNER */}
      {data?.isPlanExpired && (
        <VoicePlanExpiredBanner
          overview={data}
          onNavigateToLines={() => navigate("contacts")}
        />
      )}

      {/* 2. EXECUTIVE VOICE BALANCE & FLEET HERO CARD */}
      <LinearGradient
        colors={
          isDark
            ? ["#261947", "#1A1033", "#120B24"]
            : ["#581C87", "#4C1D95", "#3B0764"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="w-full rounded-2xl p-4 sm:p-5 shadow-lg overflow-hidden relative"
        style={{
          borderRadius: 20,
          borderWidth: 0,
          elevation: 4,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        }}
      >
        {/* Subtle Watermark Accent */}
        <View className="absolute -bottom-4 -right-4 opacity-10">
          <Ionicons name="call" size={130} color="#FFFFFF" />
        </View>

        {/* Top Header Row in Card */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-full">
            <Ionicons name="flash" size={12} color="#FDE047" />
            <Text className="text-[10.5px] font-extrabold text-white uppercase tracking-wider">
              AI Voice Minutes Pool
            </Text>
          </View>

          <Pressable
            className="flex-row items-center gap-1 bg-white/20 active:opacity-75 px-3 py-1 rounded-xl"
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              openVoiceWebBilling(queryClient, isDark);
            }}
          >
            <Ionicons name="add-circle-outline" size={14} color="#FFFFFF" />
            <Text className="text-xs font-bold text-white">+ Add Minutes</Text>
          </Pressable>
        </View>

        {/* Balance Metric */}
        <View className="mb-4">
          <View className="flex-row items-baseline gap-1.5">
            <Text
              className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight"
              numberOfLines={1}
            >
              {rawMinutes.toLocaleString()}
            </Text>
            <Text className="text-base font-bold text-purple-200">
              Minutes
            </Text>
          </View>
          <Text className="text-xs text-purple-200/80 font-medium mt-1">
            Available for live telecalling campaigns & inbound agent handling
          </Text>
        </View>

        {/* Fleet Status Interactive Chips Row */}
        <View
          className="flex-row items-center gap-2 pt-3 border-t border-white/15"
          style={{ borderTopWidth: 1, borderTopColor: "rgba(255, 255, 255, 0.15)" }}
        >
          {/* Active Campaigns Chip */}
          <Pressable
            className="flex-1 flex-row items-center justify-between bg-white/10 active:opacity-75 px-3 py-2 rounded-xl"
            onPress={() => navigate("campaigns")}
          >
            <View className="flex-row items-center gap-2 flex-1 min-w-0">
              <Ionicons name="megaphone-outline" size={15} color="#FDE047" />
              <Text
                className="text-xs font-bold text-white"
                numberOfLines={1}
              >
                {activeCampaignsCount} Active Run
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={13} color="rgba(255,255,255,0.7)" />
          </Pressable>

          {/* Virtual Phone Lines Chip */}
          <Pressable
            className="flex-1 flex-row items-center justify-between bg-white/10 active:opacity-75 px-3 py-2 rounded-xl"
            onPress={() => navigate("contacts")}
          >
            <View className="flex-row items-center gap-2 flex-1 min-w-0">
              <Ionicons name="call-outline" size={15} color="#A7F3D0" />
              <Text
                className="text-xs font-bold text-white"
                numberOfLines={1}
              >
                {data?.totalNumbersCount ?? numbers.length} Phone Lines
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={13} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </View>
      </LinearGradient>

      {/* 3. 2x2 CORE TELEPHONY METRICS (Clean & Borderless) */}
      <View className="w-full gap-3">
        {/* Row 1: AI Assistants & Dedicated Phone Lines */}
        <View className="flex-row gap-3 w-full">
          {/* Card 1: AI Assistants */}
          <View className="flex-1 min-w-0" style={{ flexBasis: 0 }}>
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                if (onOpenCreateAssistant) {
                  onOpenCreateAssistant();
                }
              }}
              className="rounded-2xl p-3.5 justify-between active:opacity-80 min-h-[96px]"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 0,
                elevation: 2,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isDark ? 0.25 : 0.05,
                shadowRadius: 4,
              }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View
                  className="w-9 h-9 rounded-xl items-center justify-center shrink-0"
                  style={{
                    backgroundColor: isDark
                      ? "rgba(168, 85, 247, 0.18)"
                      : "#F3E8FF",
                  }}
                >
                  <Bot size={18} color={isDark ? "#C084FC" : "#7E22CE"} strokeWidth={2.2} />
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={colors.chevron}
                />
              </View>
              <View>
                <Text
                  className="text-2xl font-extrabold tracking-tight"
                  style={{ color: colors.text }}
                  numberOfLines={1}
                >
                  {totalAssistantsCount}
                </Text>
                <Text
                  className="text-xs font-semibold mt-0.5"
                  style={{ color: colors.textSecondary }}
                  numberOfLines={1}
                >
                  AI Voice Assistants
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Card 2: Dedicated Phone Lines */}
          <View className="flex-1 min-w-0" style={{ flexBasis: 0 }}>
            <Pressable
              onPress={() => navigate("contacts")}
              className="rounded-2xl p-3.5 justify-between active:opacity-80 min-h-[96px]"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 0,
                elevation: 2,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isDark ? 0.25 : 0.05,
                shadowRadius: 4,
              }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View
                  className="w-9 h-9 rounded-xl items-center justify-center shrink-0"
                  style={{
                    backgroundColor: isDark
                      ? "rgba(99, 102, 241, 0.18)"
                      : "#EEF2FF",
                  }}
                >
                  <PhoneCall
                    size={18}
                    color={isDark ? "#818CF8" : "#4F46E5"}
                    strokeWidth={2.2}
                  />
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={colors.chevron}
                />
              </View>
              <View>
                <Text
                  className="text-2xl font-extrabold tracking-tight"
                  style={{ color: colors.text }}
                  numberOfLines={1}
                >
                  {data?.totalNumbersCount ?? numbers.length}
                </Text>
                <Text
                  className="text-xs font-semibold mt-0.5"
                  style={{ color: colors.textSecondary }}
                  numberOfLines={1}
                >
                  Phone Numbers
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Row 2: Total Calls & Active Campaigns */}
        <View className="flex-row gap-3 w-full">
          {/* Card 3: Total Calls */}
          <View className="flex-1 min-w-0" style={{ flexBasis: 0 }}>
            <Pressable
              onPress={() => navigate("calls")}
              className="rounded-2xl p-3.5 justify-between active:opacity-80 min-h-[96px]"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 0,
                elevation: 2,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isDark ? 0.25 : 0.05,
                shadowRadius: 4,
              }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View
                  className="w-9 h-9 rounded-xl items-center justify-center shrink-0"
                  style={{
                    backgroundColor: isDark
                      ? "rgba(14, 165, 233, 0.18)"
                      : "#E0F2FE",
                  }}
                >
                  <Phone
                    size={18}
                    color={isDark ? "#38BDF8" : "#0284C7"}
                    strokeWidth={2.2}
                  />
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={colors.chevron}
                />
              </View>
              <View>
                <Text
                  className="text-2xl font-extrabold tracking-tight"
                  style={{ color: colors.text }}
                  numberOfLines={1}
                >
                  {totalCallsCount}
                </Text>
                <Text
                  className="text-xs font-semibold mt-0.5"
                  style={{ color: colors.textSecondary }}
                  numberOfLines={1}
                >
                  Calls Dispatched
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Card 4: Campaigns Log */}
          <View className="flex-1 min-w-0" style={{ flexBasis: 0 }}>
            <Pressable
              onPress={() => navigate("campaigns")}
              className="rounded-2xl p-3.5 justify-between active:opacity-80 min-h-[96px]"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 0,
                elevation: 2,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isDark ? 0.25 : 0.05,
                shadowRadius: 4,
              }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View
                  className="w-9 h-9 rounded-xl items-center justify-center shrink-0"
                  style={{
                    backgroundColor: isDark
                      ? "rgba(16, 185, 129, 0.18)"
                      : "#DCFCE7",
                  }}
                >
                  <Megaphone
                    size={18}
                    color={isDark ? "#34D399" : "#059669"}
                    strokeWidth={2.2}
                  />
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={colors.chevron}
                />
              </View>
              <View>
                <Text
                  className="text-2xl font-extrabold tracking-tight text-emerald-500"
                  numberOfLines={1}
                >
                  {activeCampaignsCount}
                </Text>
                <Text
                  className="text-xs font-semibold mt-0.5"
                  style={{ color: colors.textSecondary }}
                  numberOfLines={1}
                >
                  Voice Campaigns
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </View>

      {/* 4. AI VOICE ENGINE LIVE TELEMETRY & SPEECH VISUALIZER */}
      <View
        className="w-full rounded-2xl p-4 overflow-hidden"
        style={{
          backgroundColor: isDark ? "#171224" : "#FAF5FF",
          borderWidth: 0,
          elevation: 1,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.2 : 0.04,
          shadowRadius: 4,
        }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <LivePulseDot color="#10B981" />
            <Text
              className="text-xs font-extrabold uppercase tracking-wider"
              style={{ color: isDark ? "#E9D5FF" : "#6B21A8" }}
            >
              Real-Time Speech Engine
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <TelemetryWaveSpectrum isDark={isDark} />
            <View
              className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: isDark
                  ? "rgba(16, 185, 129, 0.18)"
                  : "#DCFCE7",
              }}
            >
              <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <Text className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400">
                99.9% Uptime
              </Text>
            </View>
          </View>
        </View>

        {/* 3 Telemetry Metrics Strip */}
        <View className="flex-row items-center justify-between gap-2 pt-1">
          <View className="flex-1 items-center px-1">
            <Text
              className="text-[11px] font-semibold"
              style={{ color: colors.textSecondary }}
            >
              Avg Latency
            </Text>
            <Text
              className="text-sm font-extrabold mt-0.5"
              style={{ color: isDark ? "#34D399" : "#059669" }}
            >
              ~340ms
            </Text>
            <Text
              className="text-[10px] font-medium"
              style={{ color: colors.textSecondary }}
            >
              Ultra-low streaming
            </Text>
          </View>

          <View
            style={{
              width: 1,
              height: 28,
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.06)",
            }}
          />

          <View className="flex-1 items-center px-1">
            <Text
              className="text-[11px] font-semibold"
              style={{ color: colors.textSecondary }}
            >
              Audio Fidelity
            </Text>
            <Text
              className="text-sm font-extrabold mt-0.5"
              style={{ color: isDark ? "#C084FC" : "#7E22CE" }}
            >
              48 kHz
            </Text>
            <Text
              className="text-[10px] font-medium"
              style={{ color: colors.textSecondary }}
            >
              Dual-Channel HD
            </Text>
          </View>

          <View
            style={{
              width: 1,
              height: 28,
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.06)",
            }}
          />

          <View className="flex-1 items-center px-1">
            <Text
              className="text-[11px] font-semibold"
              style={{ color: colors.textSecondary }}
            >
              Telephony Link
            </Text>
            <Text
              className="text-sm font-extrabold mt-0.5"
              style={{ color: isDark ? "#60A5FA" : "#2563EB" }}
            >
              SIP / WebRTC
            </Text>
            <Text
              className="text-[10px] font-medium"
              style={{ color: colors.textSecondary }}
            >
              Carrier Trunking
            </Text>
          </View>
        </View>
      </View>

      {/* 5. EXECUTIVE ORCHESTRATION ACTIONS */}
      <View className="gap-2.5 w-full">
        <View className="flex-row items-center justify-between px-1">
          <Text
            className="text-xs font-bold tracking-wider uppercase"
            style={{ color: colors.textSecondary }}
          >
            Orchestration & Telephony Actions
          </Text>
          <Text
            className="text-[11px] font-semibold"
            style={{ color: isDark ? "#C084FC" : "#7E22CE" }}
          >
            4 Quick Actions
          </Text>
        </View>

        <View className="flex-col gap-3">
          {/* Action 1: Trigger Outbound Test Call */}
          <TactileActionCard
            icon={<Ionicons name="call" size={20} color="#FFFFFF" />}
            iconGradient={["#10B981", "#059669"]}
            title="Test Voice Agent Call"
            badgeText="Live Dial"
            badgeBg={isDark ? "rgba(16, 185, 129, 0.2)" : "#DCFCE7"}
            badgeTextColor={isDark ? "#34D399" : "#059669"}
            description="Trigger an instant outbound test call to your mobile number with live agent speech"
            tags={["Direct Phone", "<380ms Latency"]}
            actionLabel="Test Call"
            accentColor="#10B981"
            isDark={isDark}
            surfaceColor={colors.surface}
            textColor={colors.text}
            textSecondary={colors.textSecondary}
            onPress={() => {
              if (onOpenTriggerCall) {
                onOpenTriggerCall(assistants[0]?.id);
              } else {
                navigate("calls");
              }
            }}
          />

          {/* Action 2: Create Assistant */}
          <TactileActionCard
            icon={<Bot size={20} color="#FFFFFF" strokeWidth={2.2} />}
            iconGradient={["#A855F7", "#7E22CE"]}
            title="Create Voice Agent"
            badgeText="AI Studio"
            badgeBg={isDark ? "rgba(168, 85, 247, 0.2)" : "#F3E8FF"}
            badgeTextColor={isDark ? "#C084FC" : "#7E22CE"}
            description="Configure LLM instructions, conversational persona, voice tone & telephony rules"
            tags={["Custom Knowledge", "Multi-LLM"]}
            actionLabel="Build"
            accentColor={isDark ? "#C084FC" : "#7E22CE"}
            isDark={isDark}
            surfaceColor={colors.surface}
            textColor={colors.text}
            textSecondary={colors.textSecondary}
            onPress={() => {
              if (onOpenCreateAssistant) {
                onOpenCreateAssistant();
              } else {
                navigate("overview");
              }
            }}
          />

          {/* Action 3: Start Campaign */}
          <TactileActionCard
            icon={<Ionicons name="play" size={19} color="#FFFFFF" style={{ marginLeft: 2 }} />}
            iconGradient={["#6366F1", "#4F46E5"]}
            title="Launch Voice Campaign"
            badgeText="Auto-Dialer"
            badgeBg={isDark ? "rgba(99, 102, 241, 0.2)" : "#EEF2FF"}
            badgeTextColor={isDark ? "#818CF8" : "#4F46E5"}
            description="Broadcast automated conversational telecalling campaigns to your targeted contact lists"
            tags={["Contact Lists", "Auto-Dialer"]}
            actionLabel="Launch"
            accentColor="#6366F1"
            isDark={isDark}
            surfaceColor={colors.surface}
            textColor={colors.text}
            textSecondary={colors.textSecondary}
            onPress={() => {
              if (onOpenCreateCampaign) {
                onOpenCreateCampaign();
              } else {
                navigate("campaigns");
              }
            }}
          />

          {/* Action 4: View Call Logs */}
          <TactileActionCard
            icon={<Ionicons name="mic" size={20} color="#FFFFFF" />}
            iconGradient={["#0EA5E9", "#0284C7"]}
            title="Call Recordings & Transcripts"
            badgeText="Audio & Sentiment"
            badgeBg={isDark ? "rgba(14, 165, 233, 0.2)" : "#E0F2FE"}
            badgeTextColor={isDark ? "#38BDF8" : "#0284C7"}
            description="Listen to audio recordings, inspect turn-by-turn transcripts, sentiment & latency"
            tags={["Audio Playback", "Sentiment AI"]}
            actionLabel="Browse"
            accentColor="#0EA5E9"
            isDark={isDark}
            surfaceColor={colors.surface}
            textColor={colors.text}
            textSecondary={colors.textSecondary}
            onPress={() => navigate("calls")}
          />
        </View>
      </View>
    </ScrollView>
  );
};
