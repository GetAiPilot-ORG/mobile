import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { AppScreen } from "../../src/components/AppScreen";
import { AppTopBar } from "../../src/components/AppTopBar";
import { useAuthStore } from "../../src/core/store/authStore";
import { supabase } from "../../src/lib/supabase";
import {
  openAuthenticatedDashboard,
  openAuthenticatedTemplate,
} from "../../src/lib/template-deep-link";
import { TemplatesListSkeleton } from "../../src/components/skeletonScreen";

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
      <View className="rounded-2xl p-4 border border-[#262930] bg-[#181A1F] mb-3.5">
        {/* Card Header & Thumbnail */}
        <View className="flex-row items-center">
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              className="w-13 h-13 rounded-2xl bg-[#111317]"
              resizeMode="cover"
            />
          ) : (
            <View
              className={`w-13 h-13 rounded-2xl items-center justify-center ${
                isBio ? 'bg-emerald-500' : 'bg-blue-600'
              }`}
            >
              <Text className="text-xl">{isBio ? "🌿" : "🚀"}</Text>
            </View>
          )}

          <View className="flex-1 ml-3">
            <View className="flex-row items-center gap-1.5 mb-1">
              <View
                className={`px-2 py-0.5 rounded-md ${
                  isBio ? 'bg-emerald-500/20' : 'bg-blue-500/20'
                }`}
              >
                <Text
                  className={`text-[9px] font-black uppercase ${
                    isBio ? 'text-emerald-400' : 'text-blue-400'
                  }`}
                >
                  {isBio ? "Bio Page" : "Landing Page"}
                </Text>
              </View>

              <View className="bg-[#111317] border border-[#262930] px-2 py-0.5 rounded-md">
                <Text className="text-[9px] font-bold text-slate-400">{item.template_id}</Text>
              </View>
            </View>

            <Text className="text-sm font-extrabold text-white" numberOfLines={1}>
              {title}
            </Text>

            <Text className="text-[11px] text-slate-400 mt-0.5" numberOfLines={1}>
              {subtitle}
            </Text>
          </View>

          {/* Delete Action */}
          <Pressable
            className="w-8 h-8 rounded-lg items-center justify-center ml-1"
            onPress={() => handleDeleteItem(item)}
            hitSlop={8}
          >
            <Text className="text-sm">🗑️</Text>
          </Pressable>
        </View>

        {/* Live Link Chip */}
        <Pressable
          className={`flex-row items-center rounded-xl p-2.5 my-3 border ${
            isCopied ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[#111317] border-[#262930]'
          }`}
          onPress={() => handleCopyLink(item)}
        >
          <Text className="text-xs text-slate-400 font-mono">
            {isBio ? "gbio.us/" : "gpage.us/"}
          </Text>
          <Text className="text-xs text-[#0084FF] font-mono font-bold flex-1" numberOfLines={1}>
            {item.slug}
          </Text>
          <Text className={`text-[10px] font-bold ${isCopied ? 'text-emerald-400' : 'text-slate-400'}`}>
            {isCopied ? "Copied ✓" : "Copy 📋"}
          </Text>
        </Pressable>

        {/* Analytics Mini-Grid */}
        <View className="flex-row items-center justify-between rounded-xl py-2 px-3 bg-[#111317] border border-[#262930] mb-3">
          <View className="flex-1 items-center">
            <Text className="text-xs font-black text-white">{item.page_views || 0}</Text>
            <Text className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Views</Text>
          </View>
          <View className="w-px h-5 bg-[#262930]" />
          <View className="flex-1 items-center">
            <Text className="text-xs font-black text-white">{item.button_clicks || 0}</Text>
            <Text className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Clicks</Text>
          </View>
          <View className="w-px h-5 bg-[#262930]" />
          <View className="flex-1 items-center">
            <Text className="text-xs font-black text-white">
              {item.page_views && item.page_views > 0
                ? `${(((item.button_clicks || 0) / item.page_views) * 100).toFixed(0)}%`
                : "0%"}
            </Text>
            <Text className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">CTR</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-2.5">
          <Pressable
            className="flex-1 py-2.5 rounded-xl items-center border border-[#262930] bg-[#111317]"
            onPress={() => handleViewLive(item)}
          >
            <Text className="text-xs font-bold text-white">View Live ↗</Text>
          </Pressable>

          <Pressable
            className="flex-1 py-2.5 rounded-xl items-center bg-[#0084FF]"
            onPress={() => handleEditInCanvas(item)}
          >
            <Text className="text-xs font-extrabold text-white">Edit in Canvas 🚀</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <AppScreen safeArea={false} className="flex-1 bg-[#0B0D10]">
      <AppTopBar
        title="My Designs"
        subtitle="Bio Pages & Landing Pages Hub"
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
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0084FF"
            />
          }
          ListHeaderComponent={
            <View className="mb-4">
              {/* Top Summary Banner */}
              <View className="rounded-2xl p-4 border border-[#262930] bg-[#181A1F] mb-4">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="text-lg font-black text-white tracking-tight">Unified Studio</Text>
                    <Text className="text-xs text-slate-400 mt-1 leading-4">
                      Manage your Bio Pages and Landing Pages from one dashboard.
                    </Text>
                  </View>
                  <Pressable
                    className="bg-[#0084FF] px-3 py-1.5 rounded-lg ml-2"
                    onPress={handleOpenWebDashboard}
                  >
                    <Text className="text-white text-[11px] font-bold">Web Studio ↗</Text>
                  </Pressable>
                </View>

                {/* Metrics Stats Row */}
                <View className="flex-row items-center justify-between rounded-xl py-3 px-2.5 bg-[#111317] border border-[#262930] mt-4">
                  <View className="flex-1 items-center">
                    <Text className="text-sm font-black text-white">{stats.totalDesigns}</Text>
                    <Text className="text-[9px] font-bold uppercase text-slate-400 mt-0.5">Total Designs</Text>
                  </View>
                  <View className="w-px h-6 bg-[#262930]" />
                  <View className="flex-1 items-center">
                    <Text className="text-sm font-black text-white">{stats.totalViews}</Text>
                    <Text className="text-[9px] font-bold uppercase text-slate-400 mt-0.5">Total Views</Text>
                  </View>
                  <View className="w-px h-6 bg-[#262930]" />
                  <View className="flex-1 items-center">
                    <Text className="text-sm font-black text-white">{stats.totalClicks}</Text>
                    <Text className="text-[9px] font-bold uppercase text-slate-400 mt-0.5">Total Clicks</Text>
                  </View>
                  <View className="w-px h-6 bg-[#262930]" />
                  <View className="flex-1 items-center">
                    <Text className="text-sm font-black text-white">{stats.avgCtr}%</Text>
                    <Text className="text-[9px] font-bold uppercase text-slate-400 mt-0.5">Avg CTR</Text>
                  </View>
                </View>

                {/* Quick Create Buttons */}
                <View className="flex-row gap-2.5 mt-4">
                  <Pressable
                    className="flex-1 py-3 rounded-xl items-center bg-emerald-600"
                    onPress={handleCreateBio}
                  >
                    <Text className="text-white text-xs font-bold">+ Create Bio Page</Text>
                  </Pressable>

                  <Pressable
                    className="flex-1 py-3 rounded-xl items-center bg-blue-600"
                    onPress={handleCreateLanding}
                  >
                    <Text className="text-white text-xs font-bold">+ Create Landing Page</Text>
                  </Pressable>
                </View>
              </View>

              {/* Filter Tabs */}
              <View className="flex-row rounded-xl p-1 gap-1 border border-[#262930] bg-[#111317]">
                <Pressable
                  className={`flex-1 py-2 rounded-lg items-center ${activeTab === "all" ? "bg-[#181A1F] border border-[#262930]" : ""}`}
                  onPress={() => setActiveTab("all")}
                >
                  <Text
                    className={`text-xs font-bold ${activeTab === "all" ? "text-white" : "text-slate-400"}`}
                  >
                    All ({bioPages.length + landingPages.length})
                  </Text>
                </Pressable>

                <Pressable
                  className={`flex-1 py-2 rounded-lg items-center ${activeTab === "bio" ? "bg-[#181A1F] border border-[#262930]" : ""}`}
                  onPress={() => setActiveTab("bio")}
                >
                  <Text
                    className={`text-xs font-bold ${activeTab === "bio" ? "text-white" : "text-slate-400"}`}
                  >
                    Bio Pages ({bioPages.length})
                  </Text>
                </Pressable>

                <Pressable
                  className={`flex-1 py-2 rounded-lg items-center ${activeTab === "landing" ? "bg-[#181A1F] border border-[#262930]" : ""}`}
                  onPress={() => setActiveTab("landing")}
                >
                  <Text
                    className={`text-xs font-bold ${activeTab === "landing" ? "text-white" : "text-slate-400"}`}
                  >
                    Landing Pages ({landingPages.length})
                  </Text>
                </Pressable>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View className="items-center justify-center p-8">
              <Text className="text-3xl mb-2">🎨</Text>
              <Text className="text-base font-black text-white">
                {activeTab === "bio"
                  ? "No Bio Pages Yet"
                  : activeTab === "landing"
                  ? "No Landing Pages Yet"
                  : "No Designs Created Yet"}
              </Text>
              <Text className="text-xs text-slate-400 text-center mt-1 leading-5">
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
