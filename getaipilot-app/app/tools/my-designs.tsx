import * as Clipboard from "expo-clipboard";
import { useEffect, useMemo, useState } from "react";
import {
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
import { openAuthenticatedTemplate } from "../../src/lib/template-deep-link";
import { useTheme, getColors, AppColors } from "@/theme";
import { TemplatesListSkeleton } from "../../src/components/skeletonScreen";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Add01Icon,
  ArrowUpRight01Icon,
  Copy01Icon,
  Delete02Icon,
  Edit02Icon,
  Leaf01Icon,
  PaintBrush01Icon,
  Rocket01Icon,
} from "@/constants/icons";

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
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = useMemo(() => createStyles(colors), [colors]);

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
    Alert.alert("Link Copied!", `${url}\n\nCopied to clipboard.`);
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
      ? bioData?.shortBio || "Bio page"
      : landingData?.channelDesc1 || "Landing page";

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
                isBio ? styles.bioThumbnail : styles.landingThumbnail,
              ]}
            >
              <HugeiconsIcon
                icon={isBio ? Leaf01Icon : Rocket01Icon}
                size={22}
                color={colors.foreground}
                strokeWidth={1.8}
              />
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
            <HugeiconsIcon icon={Delete02Icon} size={17} color={colors.mutedForeground} strokeWidth={1.8} />
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
          <View style={styles.copyAction}>
            <HugeiconsIcon icon={Copy01Icon} size={12} color={colors.primary} strokeWidth={2} />
            <Text style={styles.copyPillText}>{isCopied ? "Copied" : "Copy"}</Text>
          </View>
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
          <Pressable cssInterop={false}
            style={({ pressed }) => [
              styles.actionButtonSecondary,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => handleViewLive(item)}
          >
            <Text style={styles.actionButtonSecondaryText}>View live</Text>
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} color={colors.foreground} strokeWidth={2} />
          </Pressable>

          <Pressable cssInterop={false}
            style={({ pressed }) => [
              styles.actionButtonPrimary,
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => handleEditInCanvas(item)}
          >
            <HugeiconsIcon icon={Edit02Icon} size={14} color={colors.buttonPrimaryForeground} strokeWidth={2} />
            <Text style={styles.actionButtonPrimaryText}>Edit design</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar
        title="My Designs"
        // subtitle="Bio Pages & Landing Pages Hub"
        showBack={true}
      />

      {loading ? (
        <TemplatesListSkeleton />
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
              {/* Design overview */}
              <View style={styles.summaryCard}>
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
                    <HugeiconsIcon icon={Add01Icon} size={15} color={colors.buttonPrimaryForeground} strokeWidth={2} />
                    <Text style={styles.createBioBtnText}>
                      Create bio page
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.createLandingBtn}
                    onPress={handleCreateLanding}
                  >
                    <HugeiconsIcon icon={Add01Icon} size={15} color={colors.primary} strokeWidth={2} />
                    <Text style={styles.createLandingBtnText}>
                      Create landing page
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
              <View style={{ marginBottom: 12 }}>
                <HugeiconsIcon icon={PaintBrush01Icon} size={42} color={colors.primary} />
              </View>
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

const createStyles = (colors: AppColors) => StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 48,
  },
  headerContainer: {
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 18,
    borderWidth: 0,
    borderColor: colors.border,
    marginBottom: 16,
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
    fontWeight: "600",
    color: colors.foreground,
  },
  metricLab: {
    fontSize: 10,
    fontWeight: "500",
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
    backgroundColor: colors.buttonPrimary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  createBioBtnText: {
    color: colors.buttonPrimaryForeground,
    fontSize: 12,
    fontWeight: "600",
  },
  createLandingBtn: {
    flex: 1,
    backgroundColor: colors.accentSoft,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  createLandingBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "600",
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
    fontWeight: "500",
    color: colors.mutedForeground,
  },
  tabButtonTextActive: {
    color: colors.foreground,
    fontWeight: "600",
  },
  designCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 16,
    borderWidth: 0,
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
  bioThumbnail: {
    backgroundColor: "#D8F0F0",
  },
  landingThumbnail: {
    backgroundColor: "#E7DEFA",
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
  cardTitleText: {
    fontSize: 16,
    fontWeight: "600",
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
    fontWeight: "600",
    color: colors.primary,
  },
  copyAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: 6,
  },
  cardStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: colors.background,
    borderRadius: 24,
    paddingVertical: 10,
    marginTop: 12,
    borderWidth: 0,
    borderColor: colors.border,
  },
  cardStatCol: {
    alignItems: "center",
    flex: 1,
  },
  cardStatValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.foreground,
  },
  cardStatLabel: {
    fontSize: 10,
    fontWeight: "500",
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
    flexDirection: "row",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonSecondaryText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.foreground,
  },
  actionButtonPrimary: {
    flex: 1,
    backgroundColor: colors.buttonPrimary,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  actionButtonPrimaryText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.buttonPrimaryForeground,
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

