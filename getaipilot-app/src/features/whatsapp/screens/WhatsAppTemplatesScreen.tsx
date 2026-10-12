import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getColors, useTheme } from "@/theme";
import { WhatsAppTemplatesSkeleton } from "../../../components/skeletonScreen";
import { TemplateCard } from "../components";
import { useWhatsAppTemplates } from "../hooks/useWhatsAppTemplates";

interface WhatsAppTemplatesScreenProps {
  onBack?: () => void;
}

export const WhatsAppTemplatesScreen: React.FC<
  WhatsAppTemplatesScreenProps
> = ({ onBack }) => {
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

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [activeStatus, setActiveStatus] = useState<string>("ALL");

  const {
    data: templates,
    isLoading,
    refetch,
    isRefetching,
  } = useWhatsAppTemplates();

  const categoryOptions = [
    { val: "ALL", label: "All Templates" },
    { val: "UTILITY", label: "Utility" },
    { val: "MARKETING", label: "Marketing" },
    { val: "AUTHENTICATION", label: "Authentication" },
  ];

  // Calculate Status Counts
  const stats = useMemo(() => {
    const list = templates || [];
    const approved = list.filter((t) => t.status === "APPROVED").length;
    const pending = list.filter((t) => t.status === "PENDING").length;
    const rejected = list.filter(
      (t) => t.status === "REJECTED" || t.status === "PAUSED",
    ).length;
    return { approved, pending, rejected, total: list.length };
  }, [templates]);

  // Filter templates by category, status, and search query
  const filteredTemplates = useMemo(() => {
    let list = templates || [];

    if (activeCategory !== "ALL") {
      list = list.filter(
        (t) => (t.category || "").toUpperCase() === activeCategory,
      );
    }

    if (activeStatus !== "ALL") {
      list = list.filter(
        (t) => (t.status || "").toUpperCase() === activeStatus,
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((t) => {
        const nameMatch = t.name.toLowerCase().includes(q);
        const bodyComp = t.components?.find((c: any) => c.type === "BODY");
        const bodyMatch = bodyComp?.text
          ? bodyComp.text.toLowerCase().includes(q)
          : false;
        return nameMatch || bodyMatch;
      });
    }

    return list;
  }, [templates, activeCategory, activeStatus, searchQuery]);

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: color.background }}
      edges={["top", "left", "right"]}
    >
      <View className="flex-1">
        {/* Top Header */}
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
              className={`text-xl font-bold tracking-tight ${
                isDark ? "text-[#F8FAFC]" : "text-[#0F172A]"
              }`}
            >
              Message Templates
            </Text>
          </View>
        </View>

        {/* Filter & Search Controls Card */}
        <View
          className={`m-3.5 p-3 rounded-2xl border shadow-sm ${
            isDark
              ? "bg-[#1C1C1E] border-[#2C2C2E]"
              : "bg-white border-[#E5E7EB]"
          }`}
        >
          {/* Search Bar */}
          <View
            className={`flex-row items-center rounded-xl px-3 h-10 border mb-2.5 ${
              isDark
                ? "bg-[#121214] border-[#2C2C2E]"
                : "bg-[#F8F9FA] border-[#E5E7EB]"
            }`}
          >
            <Ionicons
              name="search-outline"
              size={18}
              color={isDark ? "#64748B" : "#94A3B8"}
              style={{ marginRight: 8 }}
            />
            <TextInput
              className={`flex-1 text-sm font-medium py-0 ${
                isDark ? "text-[#F8FAFC]" : "text-[#0F172A]"
              }`}
              placeholder="Search template name or message..."
              placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={isDark ? "#64748B" : "#94A3B8"}
                />
              </Pressable>
            )}
          </View>

          {/* Category Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: "row",
              gap: 6,
              paddingBottom: 2,
            }}
          >
            {categoryOptions.map((cat) => {
              const isSelected = activeCategory === cat.val;
              return (
                <Pressable
                  key={cat.val}
                  className={`px-3 py-1.5 rounded-full border active:opacity-80 ${
                    isSelected
                      ? isDark
                        ? "bg-white border-white"
                        : "bg-black border-black"
                      : isDark
                      ? "bg-white/[0.05] border-white/[0.08]"
                      : "bg-[#F2F2F7] border-[#E5E7EB]"
                  }`}
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setActiveCategory(cat.val);
                  }}
                >
                  <Text
                    className={`text-xs ${
                      isSelected
                        ? isDark
                          ? "text-black font-bold"
                          : "text-white font-bold"
                        : isDark
                        ? "text-[#94A3B8] font-medium"
                        : "text-[#64748B] font-medium"
                    }`}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Status Stats Row with Clickable Badges */}
          <View
            className={`flex-row items-center justify-between mt-2.5 pt-2.5 border-t ${
              isDark ? "border-white/[0.08]" : "border-black/[0.06]"
            }`}
          >
            <View className="flex-row items-center gap-1.5 flex-wrap flex-1">
              {/* All Badge */}
              <Pressable
                className={`px-2 py-1 rounded-md border active:opacity-75 ${
                  activeStatus === "ALL"
                    ? isDark
                      ? "bg-white/10 border-white/20"
                      : "bg-black/10 border-black/20"
                    : isDark
                    ? "bg-white/[0.04] border-transparent"
                    : "bg-black/[0.04] border-transparent"
                }`}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setActiveStatus("ALL");
                }}
              >
                <Text
                  className={`text-[11px] font-medium ${
                    isDark ? "text-[#94A3B8]" : "text-[#64748B]"
                  }`}
                >
                  All:{" "}
                  <Text
                    className={`font-bold ${
                      isDark ? "text-[#F8FAFC]" : "text-[#0F172A]"
                    }`}
                  >
                    {stats.total}
                  </Text>
                </Text>
              </Pressable>

              {/* Approved Badge */}
              <Pressable
                className={`flex-row items-center gap-1 px-2 py-1 rounded-md border active:opacity-75 ${
                  activeStatus === "APPROVED"
                    ? "bg-emerald-500/20 border-emerald-500/40"
                    : "bg-emerald-500/10 border-transparent"
                }`}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setActiveStatus(
                    activeStatus === "APPROVED" ? "ALL" : "APPROVED",
                  );
                }}
              >
                <Ionicons name="checkmark-circle" size={12} color="#25D366" />
                <Text className="text-[11px] font-bold text-emerald-500">
                  {stats.approved}
                </Text>
              </Pressable>

              {/* Pending Badge */}
              <Pressable
                className={`flex-row items-center gap-1 px-2 py-1 rounded-md border active:opacity-75 ${
                  activeStatus === "PENDING"
                    ? "bg-amber-500/20 border-amber-500/40"
                    : "bg-amber-500/10 border-transparent"
                }`}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setActiveStatus(
                    activeStatus === "PENDING" ? "ALL" : "PENDING",
                  );
                }}
              >
                <Ionicons name="time-outline" size={12} color="#FBBF24" />
                <Text className="text-[11px] font-bold text-amber-400">
                  {stats.pending}
                </Text>
              </Pressable>

              {/* Rejected Badge */}
              <Pressable
                className={`flex-row items-center gap-1 px-2 py-1 rounded-md border active:opacity-75 ${
                  activeStatus === "REJECTED"
                    ? "bg-red-500/20 border-red-500/40"
                    : "bg-red-500/10 border-transparent"
                }`}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setActiveStatus(
                    activeStatus === "REJECTED" ? "ALL" : "REJECTED",
                  );
                }}
              >
                <Ionicons name="close-circle" size={12} color="#F87171" />
                <Text className="text-[11px] font-bold text-red-400">
                  {stats.rejected}
                </Text>
              </Pressable>
            </View>

            {/* Sync Meta Templates Button */}
            <Pressable
              className="flex-row items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 active:opacity-75"
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                refetch();
              }}
              disabled={isRefetching}
            >
              <Ionicons
                name="refresh-outline"
                size={13}
                color="#25D366"
                style={isRefetching ? { transform: [{ rotate: "45deg" }] } : {}}
              />
              <Text className="text-xs font-semibold text-emerald-500">
                {isRefetching ? "Syncing..." : "Sync"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Templates FlatList */}
        {isLoading && !templates ? (
          <WhatsAppTemplatesSkeleton />
        ) : (
          <FlatList
            className="flex-1"
            data={filteredTemplates}
            keyExtractor={(item) => item.id || item.name}
            renderItem={({ item }) => <TemplateCard template={item} />}
            contentContainerStyle={{
              paddingHorizontal: 16,
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
                <Ionicons
                  name="document-text-outline"
                  size={48}
                  color={isDark ? "#334155" : "#CBD5E1"}
                />
                <Text
                  className={`text-base font-bold mt-3 mb-1 text-center ${
                    isDark ? "text-[#F8FAFC]" : "text-[#0F172A]"
                  }`}
                >
                  No WhatsApp Templates Found
                </Text>
                <Text
                  className={`text-xs text-center leading-4 max-w-[280px] ${
                    isDark ? "text-[#64748B]" : "#94A3B8"
                  }`}
                >
                  {searchQuery ||
                  activeCategory !== "ALL" ||
                  activeStatus !== "ALL"
                    ? "No templates match your active filters. Try clearing filters or search query."
                    : "No WhatsApp message templates available for this account."}
                </Text>
              </View>
            }
          />
        )}

        {/* Meta Status Bar Footer */}
        <View
          className={`flex-row items-center justify-between px-4 py-2.5 border-t ${
            isDark
              ? "bg-[#0A111B] border-white/[0.08]"
              : "bg-white border-black/[0.06]"
          }`}
        >
          <Text
            className={`text-xs ${
              isDark ? "text-[#64748B]" : "text-[#94A3B8]"
            }`}
          >
            Showing {filteredTemplates.length} of {templates?.length || 0}{" "}
            templates
          </Text>

          <View className="flex-row items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <Text className="text-[10.5px] font-semibold text-emerald-500">
              Meta Cloud Live
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};
