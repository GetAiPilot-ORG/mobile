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
          <View className="flex-row items-center flex-1">
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
                Message Templates
              </Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View className="px-4 pt-3 pb-1.5">
          <View
            className={`flex-row items-center rounded-2xl px-3.5 h-11 ${
              isDark ? "bg-[#1F2C34]" : "bg-white"
            }`}
            style={{
              borderWidth: 0,
              elevation: 2,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isDark ? 0.25 : 0.05,
              shadowRadius: 4,
            }}
          >
            <Ionicons
              name="search"
              size={17}
              color={color.textSecondary || (isDark ? "#94A3B8" : "#64748B")}
              style={{ marginRight: 8 }}
            />
            <TextInput
              className={`flex-1 text-sm font-medium py-0 ${
                isDark ? "text-[#F8FAFC]" : "text-[#0F172A]"
              }`}
              placeholder="Search templates by name or text..."
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
        </View>

        {/* Folder-Style Category Tab Bar (WhatsApp Green from color.ts) */}
        <View className="px-4 pt-2 mb-1">
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
              {categoryOptions.map((cat) => {
                const isActive = activeCategory === cat.val;
                const activeColor = isDark
                  ? color.products.whatsapp
                  : (color.products.whatsappDark || "#075E54");

                return (
                  <Pressable
                    key={cat.val}
                    onPress={() => {
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setActiveCategory(cat.val);
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
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* Status Pills & Sync Meta Row */}
        <View className="flex-row items-center justify-between px-4 py-2 mb-1">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: "row",
              gap: 6,
              alignItems: "center",
            }}
          >
            {/* All */}
            <Pressable
              className={`flex-row items-center px-2.5 py-1 rounded-full active:opacity-75 ${
                activeStatus === "ALL"
                  ? isDark
                    ? "bg-white/20"
                    : "bg-black/10"
                  : isDark
                  ? "bg-white/[0.06]"
                  : "bg-black/[0.04]"
              }`}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setActiveStatus("ALL");
              }}
            >
              <Text
                className={`text-[11px] font-semibold ${
                  activeStatus === "ALL"
                    ? isDark
                      ? "text-white font-bold"
                      : "text-black font-bold"
                    : isDark
                    ? "text-[#94A3B8]"
                    : "text-[#64748B]"
                }`}
              >
                All ({stats.total})
              </Text>
            </Pressable>

            {/* Approved */}
            <Pressable
              className={`flex-row items-center gap-1 px-2.5 py-1 rounded-full active:opacity-75 ${
                activeStatus === "APPROVED"
                  ? "bg-emerald-500/25"
                  : "bg-emerald-500/10"
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
              <Ionicons name="checkmark-circle" size={11} color="#25D366" />
              <Text className="text-[11px] font-bold text-emerald-500">
                Approved ({stats.approved})
              </Text>
            </Pressable>

            {/* In Review / Pending */}
            <Pressable
              className={`flex-row items-center gap-1 px-2.5 py-1 rounded-full active:opacity-75 ${
                activeStatus === "PENDING"
                  ? "bg-amber-500/25"
                  : "bg-amber-500/10"
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
              <Ionicons name="time" size={11} color="#F59E0B" />
              <Text className="text-[11px] font-bold text-amber-500">
                In Review ({stats.pending})
              </Text>
            </Pressable>

            {/* Rejected */}
            <Pressable
              className={`flex-row items-center gap-1 px-2.5 py-1 rounded-full active:opacity-75 ${
                activeStatus === "REJECTED"
                  ? "bg-rose-500/25"
                  : "bg-rose-500/10"
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
              <Ionicons name="alert-circle" size={11} color="#EF4444" />
              <Text className="text-[11px] font-bold text-rose-500">
                Rejected ({stats.rejected})
              </Text>
            </Pressable>
          </ScrollView>

          {/* Sync Meta Button */}
          <Pressable
            className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 active:opacity-75 ml-2"
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              refetch();
            }}
            disabled={isRefetching}
          >
            <Ionicons name="refresh" size={12} color="#25D366" />
            <Text className="text-[11px] font-bold text-emerald-500">
              {isRefetching ? "Syncing..." : "Sync Meta"}
            </Text>
          </Pressable>
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
                    isDark ? "text-[#64748B]" : "text-[#94A3B8]"
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

        {/* Meta Status Bar Footer (Borderless WhatsApp Theme) */}
        <View
          className={`flex-row items-center justify-between px-4 py-2.5 shadow-xs ${
            isDark
              ? "bg-[#1C1C1E]"
              : "bg-white"
          }`}
          style={{
            borderTopWidth: 0,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -1 },
            shadowOpacity: isDark ? 0.2 : 0.04,
            shadowRadius: 3,
          }}
        >
          <Text
            className={`text-xs font-medium ${
              isDark ? "text-[#94A3B8]" : "text-[#64748B]"
            }`}
          >
            Showing {filteredTemplates.length} of {templates?.length || 0}{" "}
            templates
          </Text>

          <View className="flex-row items-center gap-1.5 bg-emerald-500/15 px-2.5 py-1 rounded-full">
            <View className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
            <Text className="text-[11px] font-bold text-emerald-500">
              Meta Cloud Live
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};
