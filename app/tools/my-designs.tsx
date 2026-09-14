import * as Clipboard from "expo-clipboard";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppScreen } from "../../src/components/AppScreen";
import { AppTopBar } from "../../src/components/AppTopBar";
import { useAuthStore } from "../../src/core/store/authStore";
import { supabase } from "../../src/lib/supabase";
import {
  openAuthenticatedDashboard,
  openAuthenticatedTemplate,
} from "../../src/lib/template-deep-link";
import { colors } from "../../src/theme/colors";

export interface SavedBioPage {
  id: string;
  template_id: string;
  page_title: string;
  slug: string;
  niche?: string;
  form_data?: {
    profileName?: string;
    profileImage?: string;
    shortBio?: string;
    buttons?: { text: string; url: string }[];
  };
  downloaded_at?: string;
  created_at?: string;
  updated_at?: string;
  page_views?: number;
  button_clicks?: number;
}

export interface SavedLandingPage {
  id: string;
  template_id: string;
  page_title: string;
  slug: string;
  form_data?: {
    channelName?: string;
    channelTitle?: string;
    channelSubscribers?: number;
    channelDesc1?: string;
    channelDesc2?: string | null;
    ctaButtonText?: string;
    channelLink?: string;
    imageUrl?: string;
    customContent?: Record<string, any>;
  };
  created_at: string;
  updated_at?: string;
  page_views?: number;
  button_clicks?: number;
}

export type UnifiedDesignItem =
  | (SavedBioPage & { type: "bio"; sortDate: string })
  | (SavedLandingPage & { type: "landing"; sortDate: string });

export default function MyDesignScreen() {
  const authUser = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<"all" | "bio" | "landing">("all");
  const [bioPages, setBioPages] = useState<SavedBioPage[]>([]);
  const [landingPages, setLandingPages] = useState<SavedLandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchDesigns();
  }, [authUser?.id]);

  const fetchDesigns = async () => {
    try {
      let currentUserId = authUser?.id;

      if (!currentUserId) {
        const { data: sessionData } = await supabase.auth.getSession();
        currentUserId = sessionData?.session?.user?.id;
      }

      if (!currentUserId) {
        setBioPages([]);
        setLandingPages([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const [bioRes, landingRes] = await Promise.all([
        supabase
          .from("free_template_submissions")
          .select("*")
          .eq("user_id", currentUserId)
          .neq("niche", "earn_storefront")
          .order("downloaded_at", { ascending: false }),
        supabase
          .from("landing_template_submissions")
          .select("*")
          .eq("user_id", currentUserId)
          .order("created_at", { ascending: false }),
      ]);

      if (bioRes.error) {
        console.warn("[MyDesigns] Bio pages fetch warning:", bioRes.error.message);
      }
      if (landingRes.error) {
        console.warn("[MyDesigns] Landing pages fetch warning:", landingRes.error.message);
      }

      setBioPages((bioRes.data || []) as SavedBioPage[]);
      setLandingPages((landingRes.data || []) as SavedLandingPage[]);
    } catch (err) {
      console.error("[MyDesigns] Error fetching designs:", err);
      Alert.alert("Error", "Failed to load your designs. Please pull to refresh.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDesigns();
  };

  const unifiedList = useMemo<UnifiedDesignItem[]>(() => {
    const bios: UnifiedDesignItem[] = bioPages.map((b) => ({
      ...b,
      type: "bio" as const,
      sortDate: b.updated_at || b.downloaded_at || b.created_at || "",
    }));

    const landings: UnifiedDesignItem[] = landingPages.map((l) => ({
      ...l,
      type: "landing" as const,
      sortDate: l.updated_at || l.created_at || "",
    }));

    const all = [...bios, ...landings].sort((a, b) =>
      (b.sortDate || "").localeCompare(a.sortDate || "")
    );

    if (activeTab === "bio") return all.filter((i) => i.type === "bio");
    if (activeTab === "landing") return all.filter((i) => i.type === "landing");
    return all;
  }, [bioPages, landingPages, activeTab]);

  const stats = useMemo(() => {
    const totalDesigns = bioPages.length + landingPages.length;
    const totalViews =
      bioPages.reduce((acc, item) => acc + (item.page_views || 0), 0) +
      landingPages.reduce((acc, item) => acc + (item.page_views || 0), 0);
    const totalClicks =
      bioPages.reduce((acc, item) => acc + (item.button_clicks || 0), 0) +
      landingPages.reduce((acc, item) => acc + (item.button_clicks || 0), 0);
    const avgCtr =
      totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0.0";

    return { totalDesigns, totalViews, totalClicks, avgCtr };
  }, [bioPages, landingPages]);

  const handleCopyLink = async (item: UnifiedDesignItem) => {
    const url =
      item.type === "bio"
        ? `https://gbio.us/${item.slug}`
        : `https://gpage.us/${item.slug}`;

    await Clipboard.setStringAsync(url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
    Alert.alert("Link Copied! 📋", `${url}\n\nCopied to clipboard.`);
  };

  const handleViewLive = (item: UnifiedDesignItem) => {
    const url =
      item.type === "bio"
        ? `https://gbio.us/${item.slug}`
        : `https://gpage.us/${item.slug}`;

    Linking.openURL(url).catch((err) =>
      console.error("[MyDesigns] Error opening live URL:", err)
    );
  };

  const handleEditInCanvas = async (item: UnifiedDesignItem) => {
    try {
      if (item.type === "bio") {
        await openAuthenticatedTemplate("bio-builder", item.id || item.template_id);
      } else {
        await openAuthenticatedTemplate("landing-templates", item.template_id);
      }
    } catch (error) {
      console.error("[MyDesigns] Failed to open canvas editor:", error);
      Alert.alert("Unable to open canvas", "Please check your connection and try again.");
    }
  };

  const handleDeleteItem = (item: UnifiedDesignItem) => {
    Alert.alert(
      "Delete Design",
      `Are you sure you want to permanently delete "${item.page_title || item.slug}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const table =
                item.type === "bio"
                  ? "free_template_submissions"
                  : "landing_template_submissions";

              const { error } = await supabase
                .from(table)
                .delete()
                .eq("id", item.id);

              if (error) throw error;

              if (item.type === "bio") {
                setBioPages((prev) => prev.filter((p) => p.id !== item.id));
              } else {
                setLandingPages((prev) => prev.filter((p) => p.id !== item.id));
              }
              Alert.alert("Deleted", "Design removed successfully.");
            } catch (err: any) {
              Alert.alert("Delete Failed", err?.message || "Could not delete design.");
            }
          },
        },
      ]
    );
  };

  const handleCreateBio = async () => {
    try {
      await openAuthenticatedTemplate("bio-builder", "creators-v1");
    } catch (e) {
      Alert.alert("Error", "Could not open Bio Builder");
    }
  };

  const handleCreateLanding = async () => {
    try {
      await openAuthenticatedTemplate("landing-templates");
    } catch (e) {
      Alert.alert("Error", "Could not open Landing Templates");
    }
  };

  const handleOpenWebDashboard = async () => {
    try {
      await openAuthenticatedDashboard("my-designs");
    } catch (error) {
      Alert.alert("Error", "Could not open Web Dashboard");
    }
  };

  const renderDesignCard = ({ item }: { item: UnifiedDesignItem }) => {
    const isBio = item.type === "bio";
    const bioData = isBio ? (item as SavedBioPage).form_data : undefined;
    const landingData = !isBio ? (item as SavedLandingPage).form_data : undefined;

    const imageUrl = isBio ? bioData?.profileImage : landingData?.imageUrl;
    const title =
      item.page_title ||
      bioData?.profileName ||
      landingData?.channelName ||
      landingData?.channelTitle ||
      "Untitled Design";

    const subtitle = isBio
      ? bioData?.shortBio || `Template: ${item.template_id}`
      : landingData?.channelDesc1 || `Template: ${item.template_id}`;

    const isCopied = copiedId === item.id;

    return (
      <View style={styles.designCard}>
        {/* Card Header & Thumbnail */}
        <View style={styles.cardHeaderRow}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.thumbnailPlaceholder,
                { backgroundColor: isBio ? "#10B981" : "#3B82F6" },
              ]}
            >
              <Text style={styles.thumbnailInitial}>
                {isBio ? "🌿" : "🚀"}
              </Text>
            </View>
          )}

          <View style={styles.cardInfoCol}>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.typeBadge,
                  isBio ? styles.bioBadge : styles.landingBadge,
                ]}
              >
                <Text
                  style={[
                    styles.typeBadgeText,
                    isBio ? styles.bioBadgeText : styles.landingBadgeText,
                  ]}
                >
                  {isBio ? "Bio Page" : "Landing Page"}
                </Text>
              </View>

              <View style={styles.templatePill}>
                <Text style={styles.templatePillText}>{item.template_id}</Text>
              </View>
            </View>

            <Text style={styles.cardTitleText} numberOfLines={1}>
              {title}
            </Text>

            <Text style={styles.cardSubtitleText} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>

          {/* Delete Action */}
          <Pressable
            style={styles.deleteButton}
            onPress={() => handleDeleteItem(item)}
            hitSlop={8}
          >
            <Text style={styles.deleteIconText}>🗑️</Text>
          </Pressable>
        </View>

        {/* Live Link Chip */}
        <Pressable
          style={[styles.linkChip, isCopied && styles.linkChipCopied]}
          onPress={() => handleCopyLink(item)}
        >
          <Text style={styles.linkPrefixText}>
            {isBio ? "gbio.us/" : "gpage.us/"}
          </Text>
          <Text style={styles.linkSlugText} numberOfLines={1}>
            {item.slug}
          </Text>
          <Text style={styles.copyPillText}>
            {isCopied ? "Copied ✓" : "Copy 📋"}
          </Text>
        </Pressable>

        {/* Analytics Mini-Grid */}
        <View style={styles.cardStatsRow}>
          <View style={styles.cardStatCol}>
            <Text style={styles.cardStatValue}>{item.page_views || 0}</Text>
            <Text style={styles.cardStatLabel}>Views</Text>
          </View>
          <View style={styles.cardStatDivider} />
          <View style={styles.cardStatCol}>
            <Text style={styles.cardStatValue}>{item.button_clicks || 0}</Text>
            <Text style={styles.cardStatLabel}>Clicks</Text>
          </View>
          <View style={styles.cardStatDivider} />
          <View style={styles.cardStatCol}>
            <Text style={styles.cardStatValue}>
              {item.page_views && item.page_views > 0
                ? `${(((item.button_clicks || 0) / item.page_views) * 100).toFixed(0)}%`
                : "0%"}
            </Text>
            <Text style={styles.cardStatLabel}>CTR</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.cardActionRow}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButtonSecondary,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => handleViewLive(item)}
          >
            <Text style={styles.actionButtonSecondaryText}>View Live ↗</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButtonPrimary,
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => handleEditInCanvas(item)}
          >
            <Text style={styles.actionButtonPrimaryText}>
              Edit in Canvas 🚀
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar
        title="My Designs"
        subtitle="Bio Pages & Landing Pages Hub"
        showBack={true}
      />

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading all your designs...</Text>
        </View>
      ) : (
        <FlatList
          data={unifiedList}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          renderItem={renderDesignCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.headerContainer}>
              {/* Top Summary Banner */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.summaryTitle}>Unified Studio</Text>
                    <Text style={styles.summarySubtitle}>
                      Manage your Bio Pages and Landing Pages from one dashboard.
                    </Text>
                  </View>
                  <Pressable
                    style={styles.webDashboardButton}
                    onPress={handleOpenWebDashboard}
                  >
                    <Text style={styles.webDashboardButtonText}>
                      Web Studio ↗
                    </Text>
                  </Pressable>
                </View>

                {/* Metrics Stats Row */}
                <View style={styles.metricsRow}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricVal}>{stats.totalDesigns}</Text>
                    <Text style={styles.metricLab}>Total Designs</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricItem}>
                    <Text style={styles.metricVal}>{stats.totalViews}</Text>
                    <Text style={styles.metricLab}>Total Views</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricItem}>
                    <Text style={styles.metricVal}>{stats.totalClicks}</Text>
                    <Text style={styles.metricLab}>Total Clicks</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricItem}>
                    <Text style={styles.metricVal}>{stats.avgCtr}%</Text>
                    <Text style={styles.metricLab}>Avg CTR</Text>
                  </View>
                </View>

                {/* Quick Create Buttons */}
                <View style={styles.createButtonsRow}>
                  <Pressable
                    style={styles.createBioBtn}
                    onPress={handleCreateBio}
                  >
                    <Text style={styles.createBioBtnText}>
                      + Create Bio Page
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.createLandingBtn}
                    onPress={handleCreateLanding}
                  >
                    <Text style={styles.createLandingBtnText}>
                      + Create Landing Page
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Filter Tabs */}
              <View style={styles.tabsContainer}>
                <Pressable
                  style={[
                    styles.tabButton,
                    activeTab === "all" && styles.tabButtonActive,
                  ]}
                  onPress={() => setActiveTab("all")}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === "all" && styles.tabButtonTextActive,
                    ]}
                  >
                    All ({bioPages.length + landingPages.length})
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.tabButton,
                    activeTab === "bio" && styles.tabButtonActive,
                  ]}
                  onPress={() => setActiveTab("bio")}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === "bio" && styles.tabButtonTextActive,
                    ]}
                  >
                    Bio Pages ({bioPages.length})
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.tabButton,
                    activeTab === "landing" && styles.tabButtonActive,
                  ]}
                  onPress={() => setActiveTab("landing")}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === "landing" && styles.tabButtonTextActive,
                    ]}
                  >
                    Landing Pages ({landingPages.length})
                  </Text>
                </Pressable>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIconText}>🎨</Text>
              <Text style={styles.emptyTitle}>
                {activeTab === "bio"
                  ? "No Bio Pages Yet"
                  : activeTab === "landing"
                  ? "No Landing Pages Yet"
                  : "No Designs Created Yet"}
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === "bio"
                  ? "Create your personal Link-in-Bio profile to showcase all your links."
                  : activeTab === "landing"
                  ? "Create a high-converting Telegram landing page with 1-click themes."
                  : "Start creating your custom Bio and Landing Pages using the buttons above."}
              </Text>
            </View>
          }
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 48,
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: colors.mutedForeground,
    fontWeight: "600",
  },
  headerContainer: {
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.foreground,
    letterSpacing: -0.4,
  },
  summarySubtitle: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 4,
    lineHeight: 18,
  },
  webDashboardButton: {
    backgroundColor: "#0A84FF",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    marginLeft: 10,
  },
  webDashboardButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.muted,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginTop: 16,
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
  },
  metricVal: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.foreground,
  },
  metricLab: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.mutedForeground,
    marginTop: 2,
    textTransform: "uppercase",
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  createButtonsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  createBioBtn: {
    flex: 1,
    backgroundColor: "#059669",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  createBioBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  createLandingBtn: {
    flex: 1,
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  createLandingBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: colors.muted,
    padding: 4,
    borderRadius: 14,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: {
    backgroundColor: colors.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.mutedForeground,
  },
  tabButtonTextActive: {
    color: colors.foreground,
    fontWeight: "900",
  },
  designCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  thumbnailImage: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.muted,
  },
  thumbnailPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailInitial: {
    fontSize: 22,
  },
  cardInfoCol: {
    flex: 1,
    marginLeft: 12,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bioBadge: {
    backgroundColor: "#DCFCE7",
  },
  bioBadgeText: {
    color: "#15803D",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  landingBadge: {
    backgroundColor: "#DBEAFE",
  },
  landingBadgeText: {
    color: "#1D4ED8",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  templatePill: {
    backgroundColor: colors.muted,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  templatePillText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.mutedForeground,
  },
  cardTitleText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.foreground,
  },
  cardSubtitleText: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  deleteButton: {
    padding: 6,
    marginLeft: 4,
  },
  deleteIconText: {
    fontSize: 16,
  },
  linkChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.muted,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkChipCopied: {
    borderColor: "#10B981",
    backgroundColor: "#ECFDF5",
  },
  linkPrefixText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.mutedForeground,
  },
  linkSlugText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    color: colors.foreground,
  },
  copyPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primary,
    marginLeft: 6,
  },
  cardStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardStatCol: {
    alignItems: "center",
    flex: 1,
  },
  cardStatValue: {
    fontSize: 14,
    fontWeight: "900",
    color: colors.foreground,
  },
  cardStatLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.mutedForeground,
    marginTop: 1,
    textTransform: "uppercase",
  },
  cardStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
  },
  cardActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  actionButtonSecondary: {
    flex: 1,
    backgroundColor: colors.muted,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonSecondaryText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.foreground,
  },
  actionButtonPrimary: {
    flex: 1,
    backgroundColor: "#0A84FF",
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonPrimaryText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconText: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.foreground,
    marginBottom: 6,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 13,
    color: colors.mutedForeground,
    lineHeight: 19,
  },
});

