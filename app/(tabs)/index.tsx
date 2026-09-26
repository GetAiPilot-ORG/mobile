import { HomeSkeleton } from "@/components/skeletonScreen/HomeSkeletonScreen";
import { NetworkStatusScreen } from "@/components/StatusScreen";
import { getColors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppScreen } from "../../src/components/AppScreen";
import { AppTopBar } from "../../src/components/AppTopBar";
import { useAuth } from "../../src/contexts/AuthContext";
import { useNetwork } from "../../src/contexts/NetworkContext";
import { useTheme } from "../../src/contexts/ThemeContext";
import { apiClient } from "../../src/core/api/client";
import { usePlatformSubscription } from "../../src/hooks/usePlatformSubscription";
import { supabase } from "../../src/lib/supabase";

interface LoginDevice {
  sessionId: string;
  platform: "ios" | "android" | "web";
  deviceName: string;
  osVersion: string | null;
  lastSeenAt: string;
  isOnline: boolean;
  isCurrent: boolean;
}

interface DeviceSessionsResponse {
  activeDeviceCount: number;
  devices: LoginDevice[];
}

export default function HomeScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const color = getColors(isDark);

  const styles = useMemo(() => createStyles(color, isDark), [color, isDark]);
  const { user } = useAuth();
  const {
    planLabel,
    hasTelegram,
    hasWhatsApp,
    hasVoice,
    hasCRM,
    hasSocial,
    refresh: refreshSub,
  } = usePlatformSubscription();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "bots" | "tools"
  >("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isOnline, networkChecked, refresh, isChecking } = useNetwork();

  // Real Workspace Telemetry from Supabase
  const { data: telemetry, refetch: refetchTelemetry } = useQuery({
    queryKey: ["workspace-telemetry-ios", user?.id],
    queryFn: async () => {
      if (!user?.id)
        return {
          landingPagesCount: 0,
          quickFormsCount: 0,
          shortLinksCount: 0,
          botsCount: 0,
        };
      try {
        const [pagesRes, formsRes, linksRes] = await Promise.all([
          supabase
            .from("landing_pages")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
          supabase
            .from("quick_forms")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
          supabase
            .from("short_links")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
        ]);
        return {
          landingPagesCount: pagesRes.count || 0,
          quickFormsCount: formsRes.count || 0,
          shortLinksCount: linksRes.count || 0,
          botsCount: 5,
        };
      } catch {
        return {
          landingPagesCount: 0,
          quickFormsCount: 0,
          shortLinksCount: 0,
          botsCount: 5,
        };
      }
    },
  });

  const {
    data: deviceSessions,
    isLoading: isLoadingDevices,
    refetch: refetchDeviceSessions,
  } = useQuery<DeviceSessionsResponse>({
    queryKey: ["auth-device-sessions", user?.id],
    queryFn: async () => {
      try {
        return await apiClient.get<DeviceSessionsResponse>(
          "/mobile/v1/auth/device-sessions",
        );
      } catch {
        return {
          activeDeviceCount: 1,
          devices: [
            {
              sessionId: "current",
              platform:
                Platform.OS === "web"
                  ? "web"
                  : Platform.OS === "ios"
                    ? "ios"
                    : "android",
              deviceName:
                Platform.OS === "web"
                  ? "Web Browser"
                  : Platform.OS === "ios"
                    ? "iOS Device"
                    : "Android Device",
              osVersion: null,
              lastSeenAt: new Date().toISOString(),
              isOnline: true,
              isCurrent: true,
            },
          ],
        };
      }
    },
    enabled: !!user?.id,
    staleTime: 15_000,
  });

  const onRefresh = async () => {
    setIsRefreshing(true);
    refreshSub();
    await Promise.all([refetchTelemetry(), refetchDeviceSessions()]);
    setIsRefreshing(false);
  };

  const prevOnlineRef = useRef(isOnline);
  useEffect(() => {
    if (!prevOnlineRef.current && isOnline) {
      refetchDeviceSessions();
      refetchTelemetry();
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline, refetchDeviceSessions, refetchTelemetry]);

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "AI Pilot";

  // Primary Automation Engines (Bundled Native Logos)
  const ENGINES = [
    {
      id: "telegram",
      name: "Telegram",
      desc: "Auto-forward feeds, bots & reactions",
      logo: require("../../assets/images/products/telegram.png"),
      iconBg: color.products.telegram,
      route: "/products/telegram",
      status: hasTelegram ? "Active" : "Pro",
      isLive: hasTelegram,
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      desc: "Broadcasts & 24/7 Meta API triggers",
      logo: require("../../assets/images/products/whatsapp.png"),
      iconBg: color.products.whatsapp,
      route: "/products/whatsapp",
      status: hasWhatsApp ? "Active" : "Pro",
      isLive: hasWhatsApp,
    },
    {
      id: "voice",
      name: "Voice AI",
      desc: "AI Voice calling agents & speech streaming",
      logo: require("../../assets/images/products/voice.png"),
      iconBg: color.products.voice,
      route: "/products/voice",
      status: hasVoice ? "Active" : "Pro",
      isLive: hasVoice,
    },
    {
      id: "crm",
      name: "Smart CRM",
      desc: "Pipelines, deals & lead contact automation",
      logo: require("../../assets/images/products/crm.png"),
      iconBg: color.products.crm,
      route: "/products/crm",
      status: hasCRM ? "Active" : "Pro",
      isLive: hasCRM,
    },
    {
      id: "social",
      name: "Social Pilot",
      desc: "Cross-platform auto-poster & queue",
      logo: require("../../assets/images/products/social.png"),
      iconBg: color.products.social,
      route: "/products/social",
      status: hasSocial ? "Active" : "Growth",
      isLive: hasSocial,
    },
  ];

  // Studio & Free Utilities
  const TOOLS = [
    {
      id: "qr",
      name: "QR Generator",
      desc: "Custom branded vectors & logos",
      icon: "qr-code",
      iconBg: "#4F46E5",
      route: "/tools/qr-code",
    },
    {
      id: "links",
      name: "Link Shortener",
      desc: "Custom slugs with click analytics",
      icon: "link",
      iconBg: "#0284C7",
      route: "/tools/link-shortener",
    },
    {
      id: "bio",
      name: "Bio Builder",
      desc: "Mobile bio link landing pages",
      icon: "phone-portrait",
      iconBg: "#EC4899",
      route: "/tools/bio-templates",
    },
    {
      id: "forms",
      name: "QuickForms",
      desc: "Conversational lead intake funnels",
      icon: "document-text",
      iconBg: "#0D9488",
      route: "/tools/quick-forms",
    },
    {
      id: "speech",
      name: "Speech to Text",
      desc: "AI audio transcription engine",
      icon: "volume-high",
      iconBg: "#7C3AED",
      route: "/tools/speech-to-text",
    },
    {
      id: "audit",
      name: "Website Audit",
      desc: "SEO & Core Web Vitals health score",
      icon: "speedometer",
      iconBg: "#059669",
      route: "/tools/website-audit",
    },
  ];

  const filteredEngines = ENGINES.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.desc.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredTools = TOOLS.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.desc.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (!networkChecked) {
    return (
      <AppScreen safeArea={false}>
        <HomeSkeleton />
      </AppScreen>
    );
  }

  if (!isOnline) {
    return <NetworkStatusScreen onRetry={refresh} isChecking={isChecking} />;
  }
  return (
    <AppScreen safeArea={false}>
      {/* Top Header */}
      <AppTopBar showPlanBadge={true} />

      <ScrollView
        style={[styles.scrollView, { backgroundColor: color.background }]}
        contentContainerStyle={[
          styles.scrollContent,
          { backgroundColor: color.background },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={color.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* iOS Native Search Field */}
        <View
          style={[
            styles.searchBarContainer,
            isDark && styles.searchBarContainerDark,
          ]}
        >
          <Ionicons
            name="search"
            size={16}
            color={color.iconPrimary}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput]}
            placeholder="Search bots, automation & tools..."
            placeholderTextColor={color.inputPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
              <Ionicons
                name="close-circle"
                size={16}
                color={color.iconPrimary}
              />
            </Pressable>
          ) : (
            <Ionicons
              name="options-outline"
              size={16}
              color={color.iconPrimary}
            />
          )}
        </View>

        {/* Dual Telemetry Widgets (Apple Inset Dual Cards) */}
        <View style={styles.heroRow}>
          <Pressable
            style={[styles.heroCard]}
            onPress={() => {
              triggerHaptic();
              router.push("/account/plans" as any);
            }}
          >
            <View
              style={[
                styles.heroIconBox,
                { backgroundColor: color.accentSoft },
              ]}
            >
              <Ionicons name="diamond" size={17} color={color.primary} />
            </View>
            <View style={styles.heroCardTextCol}>
              <Text
                style={[
                  styles.heroCardEyebrow,
                  isDark && styles.heroCardEyebrowDark,
                ]}
                numberOfLines={1}
              >
                Workspace Plan
              </Text>
              <Text style={[styles.heroCardTitle]} numberOfLines={1}>
                {planLabel || "GAP Pro Max"}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={13}
              color={color.iconPrimary}
            />
          </Pressable>

          <Pressable
            style={[styles.heroCard]}
            onPress={() => {
              triggerHaptic();
              router.push("/(tabs)/activity" as any);
            }}
          >
            <View
              style={[
                styles.heroIconBox,
                { backgroundColor: "rgba(48, 209, 88, 0.15)" },
              ]}
            >
              <Ionicons name="rocket" size={17} color="#30D158" />
            </View>
            <View style={styles.heroCardTextCol}>
              <Text
                style={[
                  styles.heroCardEyebrow,
                  isDark && styles.heroCardEyebrowDark,
                ]}
                numberOfLines={1}
              >
                Automation Fleet
              </Text>
              <Text style={[styles.heroCardTitle]} numberOfLines={1}>
                5 Engines
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={13}
              color={color.iconPrimary}
            />
          </Pressable>
        </View>

        {/* Signed-in device summary. Full device management lives in Account > Security. */}
        <Pressable
          style={[styles.loginSecurityCard]}
          onPress={() => {
            triggerHaptic();
            router.push({
              pathname: "/(tabs)/account",
              params: { tab: "security" },
            } as any);
          }}
          accessibilityRole="button"
          accessibilityLabel="View logged-in devices in account security"
        >
          <View
            style={[
              styles.loginSecurityIcon,
              { backgroundColor: "rgba(16, 185, 129, 0.15)" },
            ]}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color="#10B981"
            />
          </View>
          <View style={styles.loginSecurityContent}>
            <View style={styles.loginSecurityHeader}>
              <Text style={[styles.loginSecurityTitle]}>Login security</Text>
              <View style={styles.loginSecurityCount}>
                <Text style={styles.loginSecurityCountText}>
                  {isLoadingDevices
                    ? "Checking…"
                    : `${deviceSessions?.activeDeviceCount ?? 0} active`}
                </Text>
              </View>
            </View>
            {deviceSessions?.devices.length ? (
              <View style={styles.loginDeviceList}>
                {deviceSessions.devices.slice(0, 2).map((device) => (
                  <View key={device.sessionId} style={styles.loginDeviceRow}>
                    <Ionicons
                      name={
                        device.platform === "web"
                          ? "globe-outline"
                          : "phone-portrait-outline"
                      }
                      size={13}
                      color={color.iconPrimary}
                    />
                    <Text
                      style={[
                        styles.loginDeviceText,
                        isDark && styles.loginDeviceTextDark,
                      ]}
                      numberOfLines={1}
                    >
                      {device.deviceName} ·{" "}
                      {device.isOnline ? "Online" : "Offline"}
                      {device.isCurrent ? " · This device" : ""}
                    </Text>
                  </View>
                ))}
                {deviceSessions.activeDeviceCount > 2 && (
                  <Text
                    style={[
                      styles.loginMoreDevices,
                      isDark && styles.loginMoreDevicesDark,
                    ]}
                  >
                    +{deviceSessions.activeDeviceCount - 2} more device
                    {deviceSessions.activeDeviceCount - 2 === 1 ? "" : "s"}
                  </Text>
                )}
              </View>
            ) : (
              <Text
                style={[
                  styles.loginSecuritySubtitle,
                  isDark && styles.loginSecuritySubtitleDark,
                ]}
              >
                {isLoadingDevices
                  ? "Loading signed-in devices"
                  : "No active device logins found"}
              </Text>
            )}
          </View>
          <Ionicons
            name="chevron-forward"
            size={17}
            color={color.iconPrimary}
          />
        </Pressable>

        {/* Overall Ecosystem Pricing & Upgrades Tile */}
        <Pressable
          style={[
            styles.pricingTile,
            isDark ? styles.pricingTileDark : styles.pricingTileLight,
          ]}
          onPress={() => {
            triggerHaptic();
            router.push("/account/plans" as any);
          }}
          accessibilityRole="button"
          accessibilityLabel="Explore overall pricing plans and ecosystem quotas"
        >
          <View style={styles.pricingTileHeader}>
            <View style={styles.pricingTileBadgeRow}>
              <View
                style={[
                  styles.pricingBadge,
                  {
                    backgroundColor: color.accentSoft,
                  },
                ]}
              >
                <Ionicons name="sparkles" size={11} color={color.primary} />
                <Text style={styles.pricingBadgeText}>ECOSYSTEM PRICING</Text>
              </View>
              <View
                style={[
                  styles.pricingSaveBadge,
                  { backgroundColor: color.accentSoft },
                ]}
              >
                <Text style={[styles.pricingSaveBadgeText, { color: color.accent }]}>FROM ₹799/MO</Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={color.iconPrimary}
            />
          </View>

          <View style={styles.pricingTileBody}>
            <Text
              style={[
                styles.pricingTileTitle,
                isDark && styles.pricingTileTitleDark,
              ]}
            >
              Scale Your Automation Fleet
            </Text>
            <Text
              style={[
                styles.pricingTileDesc,
                isDark && styles.pricingTileDescDark,
              ]}
            >
              Voice AI Calling · Social Pilot · WhatsApp · Telegram · Smart CRM
            </Text>
          </View>

          {/* Pricing Quick Snapshot Pills */}
          <View style={styles.pricingPillRow}>
            <View
              style={[
                styles.pricePill,
                { backgroundColor: color.tabBackground },
              ]}
            >
              <Ionicons name="call" size={11} color={color.products.voice} />
              <Text
                style={[
                  styles.pricePillText,
                  { color: color.textPrimary },
                ]}
              >
                Voice AI ₹1,499
              </Text>
            </View>
            <View
              style={[
                styles.pricePill,
                { backgroundColor: color.tabBackground },
              ]}
            >
              <Ionicons name="share-social" size={11} color={color.products.social} />
              <Text
                style={[
                  styles.pricePillText,
                  { color: color.textPrimary },
                ]}
              >
                Social ₹999
              </Text>
            </View>
            <View
              style={[
                styles.pricePill,
                { backgroundColor: color.tabBackground },
              ]}
            >
              <Ionicons name="logo-whatsapp" size={11} color={color.products.whatsapp} />
              <Text
                style={[
                  styles.pricePillText,
                  { color: color.textPrimary },
                ]}
              >
                WA ₹999
              </Text>
            </View>
            <View
              style={[
                styles.pricePill,
                { backgroundColor: color.tabBackground },
              ]}
            >
              <Ionicons name="people" size={11} color={color.products.crm} />
              <Text
                style={[
                  styles.pricePillText,
                  { color: color.textPrimary },
                ]}
              >
                CRM ₹799
              </Text>
            </View>
          </View>

          {/* Bottom Action Strip */}
          <View
            style={[
              styles.pricingActionStrip,
              { borderTopColor: color.border },
            ]}
          >
            <Text
              style={[
                styles.pricingActionStripText,
                { color: color.textSecondary },
              ]}
            >
              Compare all plans, quotas & features
            </Text>
            <View style={styles.pricingActionStripBtn}>
              <Text style={styles.pricingActionStripBtnText}>View Plans</Text>
              <Ionicons name="arrow-forward" size={12} color={color.primary} />
            </View>
          </View>
        </Pressable>

        {/* iOS Native Segmented Filter Bar */}
        <View style={[styles.segmentedTrack]}>
          <Pressable
            style={[
              styles.segmentedTab,
              selectedFilter === "all" && styles.segmentedTabActive,
            ]}
            onPress={() => {
              triggerHaptic();
              setSelectedFilter("all");
            }}
          >
            <Text
              style={[
                styles.segmentedTabText,
                selectedFilter === "all" &&
                (isDark
                  ? styles.segmentedTabTextActiveDark
                  : styles.segmentedTabTextActive),
              ]}
            >
              All Engines
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.segmentedTab,
              selectedFilter === "bots" && styles.segmentedTabActive,
            ]}
            onPress={() => {
              triggerHaptic();
              setSelectedFilter("bots");
            }}
          >
            <Text
              style={[
                styles.segmentedTabText,
                selectedFilter === "bots" &&
                (isDark
                  ? styles.segmentedTabTextActiveDark
                  : styles.segmentedTabTextActive),
              ]}
            >
              Automation Hub
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.segmentedTab,
              selectedFilter === "tools" && styles.segmentedTabActive,
            ]}
            onPress={() => {
              triggerHaptic();
              setSelectedFilter("tools");
            }}
          >
            <Text
              style={[
                styles.segmentedTabText,
                selectedFilter === "tools" &&
                (isDark
                  ? styles.segmentedTabTextActiveDark
                  : styles.segmentedTabTextActive),
              ]}
            >
              Studio Tools
            </Text>
          </Pressable>
        </View>

        {/* SECTION 1: Automation Engines */}
        {(selectedFilter === "all" || selectedFilter === "bots") && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text
                style={[
                  styles.sectionHeaderTitle,
                  isDark && styles.sectionHeaderTitleDark,
                ]}
              >
                Automation Engines
              </Text>
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  router.push("/(tabs)/products" as any);
                }}
              >
                <Text style={styles.sectionActionText}>See All ›</Text>
              </Pressable>
            </View>

            {/* Inset Grouped Icon Grid */}
            <View
              style={[styles.gridContainer, isDark && styles.gridContainerDark]}
            >
              {filteredEngines.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.gridItem}
                  onPress={() => {
                    triggerHaptic();
                    router.push(item.route as any);
                  }}
                >
                  <Image
                    source={item.logo}
                    style={styles.gridLogoImage}
                    resizeMode="contain"
                  />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* SECTION 2: Studio & Utilities (Apple HIG Inset Grouped List) */}
        {(selectedFilter === "all" || selectedFilter === "tools") && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text
                style={[
                  styles.sectionHeaderTitle,
                  isDark && styles.sectionHeaderTitleDark,
                ]}
              >
                Studio & Utilities
              </Text>
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  router.push("/(tabs)/tools" as any);
                }}
              >
                <Text style={styles.sectionActionText}>Explore Tools ›</Text>
              </Pressable>
            </View>

            {/* Apple HIG Inset Grouped Unified Card with Hairline Dividers */}
            <View
              style={[
                styles.groupedListContainer,
                isDark && styles.groupedListContainerDark,
              ]}
            >
              {filteredTools.map((tool, index) => {
                const isLast = index === filteredTools.length - 1;
                return (
                  <View key={tool.id}>
                    <Pressable
                      style={styles.groupedListItem}
                      onPress={() => {
                        triggerHaptic();
                        router.push(tool.route as any);
                      }}
                    >
                      <View
                        style={[
                          styles.toolIconBox,
                          { backgroundColor: tool.iconBg },
                        ]}
                      >
                        <Ionicons
                          name={tool.icon as any}
                          size={18}
                          color="#FFFFFF"
                        />
                      </View>
                      <View style={styles.toolInfo}>
                        <Text
                          style={[
                            styles.toolName,
                            isDark && styles.toolNameDark,
                          ]}
                        >
                          {tool.name}
                        </Text>
                        <Text
                          style={[
                            styles.toolDesc,
                            isDark && styles.toolDescDark,
                          ]}
                          numberOfLines={1}
                        >
                          {tool.desc}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={17}
                        color={color.iconPrimary}
                      />
                    </Pressable>
                    {!isLast && (
                      <View
                        style={[
                          styles.hairlineDivider,
                          isDark && styles.hairlineDividerDark,
                        ]}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}
        <Pressable onPress={() => router.push('/Referral' as any)}>
          <Image
            source={require('../../assets/images/network.png')}
            style={{ width: 100, height: 100, borderRadius: 10, alignSelf: 'center', justifyContent: 'center' }}
          />
        </Pressable>
      </ScrollView>
    </AppScreen>
  );
}

function createStyles(color: ReturnType<typeof getColors>, isDark: boolean) {
  return StyleSheet.create({
    scrollView: {
      flex: 1,
      width: "100%",
      backgroundColor: color.background,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 130,
      width: "100%",
    },
    avatarBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: color.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarBtnText: {
      fontSize: 13,
      fontWeight: "800",
      color: color.primaryForeground,
    },
    // ─── iOS Native Search Field ───────────────────────────────────
    searchBarContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: color.card,
      borderRadius: 12,
      paddingHorizontal: 10,
      height: 38,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: color.border,
    },
    searchBarContainerDark: {
      backgroundColor: color.card,
      borderWidth: 1,
      borderColor: color.border,
    },
    searchIcon: {
      marginRight: 6,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: color.textPrimary,
      paddingVertical: 6,
    },
    // ─── Dual Telemetry Widgets ────────────────────────────────────
    heroRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 16,
    },
    heroCard: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: color.card,
      borderRadius: 16,
      paddingVertical: 11,
      paddingHorizontal: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: color.border,
      gap: 9,
    },
    heroIconBox: {
      width: 32,
      height: 32,
      borderRadius: 9,
      justifyContent: "center",
      alignItems: "center",
    },
    heroCardTextCol: {
      flex: 1,
      justifyContent: "center",
    },
    heroCardEyebrow: {
      fontSize: 10,
      fontWeight: "500",
      color: color.textSecondary,
      marginBottom: 2,
    },
    heroCardEyebrowDark: {
      color: color.textSecondary,
    },
    heroCardTitle: {
      fontSize: 13.5,
      fontWeight: "700",
      color: color.textPrimary,
      letterSpacing: -0.2,
    },
    loginSecurityCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: color.card,
      borderRadius: 16,
      padding: 13,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: color.border,
      marginBottom: 16,
    },
    loginSecurityIcon: {
      width: 38,
      height: 38,
      borderRadius: 11,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 11,
    },
    loginSecurityContent: {
      flex: 1,
    },
    loginSecurityHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    loginSecurityTitle: {
      fontSize: 14.5,
      fontWeight: "700",
      color: color.textPrimary,
    },
    loginSecurityCount: {
      backgroundColor: color.successSoft,
      borderRadius: 8,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    loginSecurityCountText: {
      color: color.success,
      fontSize: 10.5,
      fontWeight: "800",
    },
    loginSecuritySubtitle: {
      color: color.textSecondary,
      fontSize: 12,
      marginTop: 3,
    },
    loginSecuritySubtitleDark: {
      color: color.textSecondary,
    },
    loginDeviceList: {
      marginTop: 5,
      gap: 3,
    },
    loginDeviceRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    loginDeviceText: {
      flex: 1,
      color: color.textSecondary,
      fontSize: 12,
    },
    loginDeviceTextDark: {
      color: color.textSecondary,
    },
    loginMoreDevices: {
      color: color.primary,
      fontSize: 11.5,
      fontWeight: "700",
      marginLeft: 18,
    },
    loginMoreDevicesDark: {
      color: color.primary,
    },
    // ─── iOS Native Segmented Track ────────────────────────────────
    segmentedTrack: {
      flexDirection: "row",
      backgroundColor: color.tabBackground,
      borderRadius: 10,
      padding: 3,
      marginBottom: 20,
    },
    segmentedTab: {
      flex: 1,
      paddingVertical: 7,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    segmentedTabActive: {
      backgroundColor: color.card,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    segmentedTabText: {
      fontSize: 12,
      fontWeight: "500",
      color: color.textSecondary,
    },
    segmentedTabTextActive: {
      color: color.textPrimary,
      fontWeight: "600",
    },
    segmentedTabTextActiveDark: {
      color: color.textPrimary,
      fontWeight: "600",
    },
    // ─── Section Header (Apple HIG Style) ──────────────────────────
    sectionBlock: {
      marginBottom: 24,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 4,
      marginBottom: 8,
    },
    sectionHeaderTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: color.textSecondary,
      letterSpacing: -0.2,
    },
    sectionHeaderTitleDark: {
      color: color.textSecondary,
    },
    sectionActionText: {
      fontSize: 13,
      fontWeight: "500",
      color: color.primary,
    },
    // ─── Inset Grouped Grid (5 Engines Row) ────────────────────────
    gridContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: color.card,
      borderRadius: 18,
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: color.border,
    },
    gridContainerDark: {
      backgroundColor: color.card,
      borderColor: color.border,
    },
    gridItem: {
      alignItems: "center",
      justifyContent: "center",
    },
    gridLogoImage: {
      width: 50,
      height: 50,
      borderRadius: 13,
    },
    // ─── Inset Grouped List (Apple HIG Settings Style) ─────────────
    groupedListContainer: {
      backgroundColor: color.card,
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: color.border,
      overflow: "hidden",
    },
    groupedListContainerDark: {
      backgroundColor: color.card,
      borderColor: color.border,
    },
    groupedListItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 14,
      gap: 12,
    },
    toolIconBox: {
      width: 32,
      height: 32,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    toolInfo: {
      flex: 1,
    },
    toolName: {
      fontSize: 14.5,
      fontWeight: "700",
      color: color.textPrimary,
      letterSpacing: -0.2,
      marginBottom: 1,
    },
    toolNameDark: {
      color: color.textPrimary,
    },
    toolDesc: {
      fontSize: 11.5,
      color: color.textSecondary,
    },
    toolDescDark: {
      color: color.textSecondary,
    },
    hairlineDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: color.border,
      marginLeft: 58,
    },
    hairlineDividerDark: {
      backgroundColor: color.border,
    },
    pricingTile: {
      borderRadius: 16,
      padding: 14,
      gap: 10,
      borderWidth: 1,
      marginBottom: 12,
    },
    pricingTileLight: {
      backgroundColor: color.card,
      borderColor: color.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    pricingTileDark: {
      backgroundColor: color.card,
      borderColor: color.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 2,
    },
    pricingTileHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    pricingTileBadgeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    pricingBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: color.accentSoft,
    },
    pricingBadgeText: {
      fontSize: 10,
      fontWeight: "800",
      color: color.foreground,
      letterSpacing: 0.5,
    },
    pricingSaveBadge: {
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: color.accentSoft,
    },
    pricingSaveBadgeText: {
      fontSize: 10,
      fontWeight: "800",
      color: color.accent,
      letterSpacing: 0.5,
    },
    pricingTileBody: {
      gap: 2,
    },
    pricingTileTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: color.textPrimary,
      letterSpacing: -0.2,
    },
    pricingTileTitleDark: {
      color: color.textPrimary,
    },
    pricingTileDesc: {
      fontSize: 11.5,
      color: color.textSecondary,
    },
    pricingTileDescDark: {
      color: color.textSecondary,
    },
    pricingPillRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 2,
    },
    pricePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 7,
    },
    pricePillText: {
      fontSize: 10.5,
      fontWeight: "700",
    },
    pricingActionStrip: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 8,
      borderTopWidth: 1,
      borderColor: color.border,
      marginTop: 2,
    },
    pricingActionStripText: {
      fontSize: 11,
      fontWeight: "500",
      color: color.textSecondary,
    },
    pricingActionStripBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    pricingActionStripBtnText: {
      fontSize: 11.5,
      fontWeight: "700",
      color: color.primary,
    },
  });
}
