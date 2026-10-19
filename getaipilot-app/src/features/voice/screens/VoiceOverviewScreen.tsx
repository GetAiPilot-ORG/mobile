import { ProductActions, ProductButton, ProductEmpty, ProductHeading, ProductMetrics, ProductRow, ProductSection, useProductPalette } from "@/components/ProductUI";
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
    surface: themeColors.card,
    surfaceAlt: themeColors.surfaceSecondary,
    border: themeColors.border,
    text: themeColors.text,
    textSecondary: themeColors.textMuted,
    primary: themeColors.products?.voice || "#5B3AF5",
    primaryLight: themeColors.products?.voiceSoft || (isDark ? "rgba(91, 58, 245, 0.2)" : "#EDE9FE"),
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
        paddingTop: 8,
        paddingBottom: 130,
        gap: 16,
        width: "100%",
      }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["voice", "assistants"] });
            queryClient.invalidateQueries({ queryKey: ["voice", "numbers"] });
          }}
          tintColor={isDark ? "#FFFFFF" : colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* 1. EXECUTIVE PULSE BRIEFING TITLE */}
      <View className="pt-0.5 gap-1 w-full">
        <Text
          className="text-2xl font-extrabold tracking-tight"
          style={{ color: colors.text }}
        >
          Executive Pulse Briefing
        </Text>
        <Text className="text-sm font-medium" style={{ color: colors.textSecondary }}>
          Your AI voice workforce is active and ready.
        </Text>
      </View>

      {/* EXPIRED PLAN NOTICE BANNER */}
      {data?.isPlanExpired && (
        <VoicePlanExpiredBanner
          overview={data}
          onNavigateToLines={() => navigate("contacts")}
        />
      )}


      {/* 2. TOP HERO GRADIENT CARD */}
      <LinearGradient
        colors={["#5844E3", "#5136EE", "#3B50DF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="w-full rounded-2xl p-4 sm:p-5 shadow-md shadow-indigo-500/20"
        style={{ borderRadius: 16 }}
      >
        <View className="flex-row items-center justify-between">
          {/* Active Campaigns */}
          <Pressable
            className="flex-1 flex-row items-center gap-3 active:opacity-80 p-4"
            style={{ minWidth: 0 }}
            onPress={() => navigate("campaigns")}
          >
            <View className="w-10 h-10 rounded-xl bg-white/15 items-center justify-center shrink-0">
              <Ionicons
                name="megaphone-outline"
                size={20}
                color="#FFFFFF"
              />
            </View>

            <View className="flex-1" style={{ minWidth: 0 }}>
              <Text
                className="text-white text-base font-extrabold tracking-tight"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {activeCampaignsCount} Active
              </Text>

              <Text
                className="text-white/80 text-xs font-medium mt-0.5"
                numberOfLines={1}
              >
                Campaigns
              </Text>
            </View>
          </Pressable>

          {/* Divider */}
          <View className="w-px h-10 bg-white/20 mx-3 shrink-0" />

          {/* AI Voice Balance */}
          <Pressable
            className="flex-1 flex-row items-center gap-3 active:opacity-80 p-4"
            style={{ minWidth: 0 }}
            onPress={() => openVoiceWebBilling(queryClient, isDark)}
          >
            <View className="w-10 h-10 rounded-xl bg-white/15 items-center justify-center shrink-0">
              <Ionicons
                name="flash-outline"
                size={20}
                color="#FFFFFF"
              />
            </View>

            <View className="flex-1" style={{ minWidth: 0 }}>
              <Text
                className="text-white text-base font-extrabold tracking-tight"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {rawMinutes.toLocaleString()} Mins
              </Text>

              <Text
                className="text-white/80 text-xs font-medium mt-0.5"
                numberOfLines={1}
              >
                AI Voice Balance
              </Text>
            </View>
          </Pressable>
        </View>
      </LinearGradient>

      {/* 3. 2x2 METRICS GRID */}
      <View className="w-full gap-3">
        {/* Row 1: AI Assistants & Dedicated Phone Lines */}
        <View className="flex-row gap-3 w-full">
          {/* Card 1: AI Assistants */}
          <View className="flex-1 min-w-0" style={{ flexBasis: 0 }}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (onOpenCreateAssistant) {
                  onOpenCreateAssistant();
                }
              }}
              className="rounded-2xl p-3.5 justify-between active:opacity-75 shadow-xs min-h-[92px]"
              style={{
                backgroundColor: colors.surface,
              }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View
                  className="w-8 h-8 rounded-xl items-center justify-center shrink-0"
                  style={{ backgroundColor: colors.primaryLight }}
                >
                  <Bot size={17} color={colors.primary} strokeWidth={2.2} />
                </View>
                <Ionicons name="chevron-forward" size={14} color={colors.chevron} />
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
                  className="text-xs font-medium mt-0.5"
                  style={{ color: colors.textSecondary }}
                  numberOfLines={1}
                >
                  AI Assistants
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Card 2: Dedicated Phone Lines */}
          <View className="flex-1 min-w-0" style={{ flexBasis: 0 }}>
            <Pressable
              onPress={() => navigate("contacts")}
              className="rounded-2xl p-3.5 justify-between active:opacity-75 shadow-xs min-h-[92px]"
              style={{
                backgroundColor: colors.surface,
              }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View
                  className="w-8 h-8 rounded-xl items-center justify-center shrink-0"
                  style={{
                    backgroundColor: isDark
                      ? "rgba(99, 102, 241, 0.15)"
                      : "#EEF2FF",
                  }}
                >
                  <PhoneCall size={17} color="#6366F1" strokeWidth={2.2} />
                </View>
                <Ionicons name="chevron-forward" size={14} color={colors.chevron} />
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
                  className="text-xs font-medium mt-0.5"
                  style={{ color: colors.textSecondary }}
                  numberOfLines={1}
                >
                  Phone Lines
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Row 2: Total Calls & Voice Wallet */}
        <View className="flex-row gap-3 w-full">
          {/* Card 3: Total Calls */}
          <View className="flex-1 min-w-0" style={{ flexBasis: 0 }}>
            <Pressable
              onPress={() => navigate("calls")}
              className="rounded-2xl p-3.5 justify-between active:opacity-75 shadow-xs min-h-[92px]"
              style={{
                backgroundColor: colors.surface,
              }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View
                  className="w-8 h-8 rounded-xl items-center justify-center shrink-0"
                  style={{
                    backgroundColor: isDark
                      ? "rgba(14, 165, 233, 0.15)"
                      : "#E0F2FE",
                  }}
                >
                  <Phone size={17} color="#0EA5E9" strokeWidth={2.2} />
                </View>
                <Ionicons name="chevron-forward" size={14} color={colors.chevron} />
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
                  className="text-xs font-medium mt-0.5"
                  style={{ color: colors.textSecondary }}
                  numberOfLines={1}
                >
                  Total Calls
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Card 4: Wallet Status */}
          <View className="flex-1 min-w-0" style={{ flexBasis: 0 }}>
            <Pressable
              onPress={() => openVoiceWebBilling(queryClient, isDark)}
              className="rounded-2xl p-3.5 justify-between active:opacity-75 shadow-xs min-h-[92px]"
              style={{
                backgroundColor: colors.surface,
              }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View
                  className="w-8 h-8 rounded-xl items-center justify-center shrink-0"
                  style={{
                    backgroundColor: isDark
                      ? "rgba(16, 185, 129, 0.15)"
                      : "#DCFCE7",
                  }}
                >
                  <Database size={17} color={colors.green} strokeWidth={2.2} />
                </View>
                <Ionicons name="chevron-forward" size={14} color={colors.chevron} />
              </View>
              <View>
                <Text
                  className="text-2xl font-extrabold tracking-tight text-emerald-500"
                  numberOfLines={1}
                >
                  {rawMinutes.toLocaleString()}
                </Text>
                <Text
                  className="text-xs font-medium mt-0.5"
                  style={{ color: colors.textSecondary }}
                  numberOfLines={1}
                >
                  AI Mins Balance
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </View>

      {/* 4. QUICK ACTIONS SECTION */}
      <View className="gap-2 w-full">
        <Text
          className="text-xs font-bold tracking-wider uppercase px-1"
          style={{ color: colors.textSecondary }}
        >
          Quick Actions
        </Text>

        <View className="flex-col gap-2.5">
          {/* Action 1: Create Assistant */}
          <Pressable
            className="flex-row items-center justify-between w-full p-3.5 rounded-2xl active:opacity-80 shadow-xs"
            style={{
              backgroundColor: colors.surface,
            }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (onOpenCreateAssistant) {
                onOpenCreateAssistant();
              } else {
                navigate("overview");
              }
            }}
          >
            <View className="flex-row items-center gap-3 flex-1 mr-2 min-w-0">
              <View
                className="w-10 h-10 rounded-xl items-center justify-center shrink-0"
                style={{ backgroundColor: colors.primaryLight }}
              >
                <Bot size={20} color={colors.primary} strokeWidth={2.2} />
              </View>
              <View className="flex-1 min-w-0">
                <Text
                  className="text-[15px] font-bold tracking-tight"
                  style={{ color: colors.text }}
                  numberOfLines={1}
                >
                  Create Assistant
                </Text>
                <Text
                  className="text-xs mt-0.5"
                  style={{ color: colors.textSecondary }}
                  numberOfLines={1}
                >
                  Configure AI voice persona & instructions
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.chevron}
            />
          </Pressable>

          {/* Action 2: Start Campaign */}
          <Pressable
            className="flex-row items-center justify-between w-full p-3.5 rounded-2xl active:opacity-80 shadow-xs"
            style={{
              backgroundColor: colors.surface,
            }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (onOpenCreateCampaign) {
                onOpenCreateCampaign();
              } else {
                navigate("campaigns");
              }
            }}
          >
            <View className="flex-row items-center gap-3 flex-1 mr-2 min-w-0">
              <View
                className="w-10 h-10 rounded-xl items-center justify-center shrink-0"
                style={{
                  backgroundColor: isDark
                    ? "rgba(16, 185, 129, 0.15)"
                    : "#DCFCE7",
                }}
              >
                <Ionicons
                  name="play"
                  size={18}
                  color="#10B981"
                  style={{ marginLeft: 2 }}
                />
              </View>
              <View className="flex-1 min-w-0">
                <Text
                  className="text-[15px] font-bold tracking-tight"
                  style={{ color: colors.text }}
                  numberOfLines={1}
                >
                  Start Campaign
                </Text>
                <Text
                  className="text-xs mt-0.5"
                  style={{ color: colors.textSecondary }}
                  numberOfLines={1}
                >
                  Launch outbound telecalling to contacts
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.chevron}
            />
          </Pressable>

          {/* Action 3: View Call Logs */}
          <Pressable
            className="flex-row items-center justify-between w-full p-3.5 rounded-2xl active:opacity-80 shadow-xs"
            style={{
              backgroundColor: colors.surface,
            }}
            onPress={() => navigate("calls")}
          >
            <View className="flex-row items-center gap-3 flex-1 mr-2 min-w-0">
              <View
                className="w-10 h-10 rounded-xl items-center justify-center shrink-0"
                style={{
                  backgroundColor: isDark
                    ? "rgba(14, 165, 233, 0.15)"
                    : "#E0F2FE",
                }}
              >
                <Ionicons name="list" size={18} color="#0EA5E9" />
              </View>
              <View className="flex-1 min-w-0">
                <Text
                  className="text-[15px] font-bold tracking-tight"
                  style={{ color: colors.text }}
                  numberOfLines={1}
                >
                  View Call Logs
                </Text>
                <Text
                  className="text-xs mt-0.5"
                  style={{ color: colors.textSecondary }}
                  numberOfLines={1}
                >
                  Review call transcripts and recordings
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.chevron}
            />
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
};
