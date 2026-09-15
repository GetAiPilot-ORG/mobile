import React, { useCallback, useEffect, useState } from "react";
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

import { AppScreen } from "../../src/components/AppScreen";
import { AppTopBar } from "../../src/components/AppTopBar";
import {
  openAuthenticatedDashboard,
  openAuthenticatedTemplate,
} from "../../src/lib/template-deep-link";
import { supabase } from "../../src/lib/supabase";
import { TemplatesListSkeleton } from "../../src/components/skeletonScreen";

type TemplateFormData = {
  imageUrl?: string;
  channelName?: string;
  channelTitle?: string;
  channelDesc1?: string;
  channelLink?: string;
  ctaButtonText?: string;
};

type TemplateSubmission = {
  id: string;
  user_id: string;
  email: string;
  template_id: string;
  niche: string;
  form_data?: TemplateFormData;
  downloaded_at?: string;
  created_at?: string;
  slug?: string;
};

export default function BioTemplatesScreen() {
  const [templates, setTemplates] = useState<TemplateSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setTemplates([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const { data, error } = await supabase
        .from("free_template_submissions")
        .select("*")
        .eq("user_id", session.user.id)
        .neq("niche", "earn_storefront")
        .order("downloaded_at", {
          ascending: false,
        });

      if (error) throw error;

      setTemplates(data ?? []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      Alert.alert("Error", "Failed to load your templates.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      void fetchTemplates();
    }, 0);

    return () => clearTimeout(loadTimer);
  }, [fetchTemplates]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTemplates();
  }, [fetchTemplates]);

  const handleDelete = useCallback((template: TemplateSubmission) => {
    Alert.alert(
      "Delete Template",
      `Are you sure you want to delete "${getTemplateName(template)}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingId(template.id);

              const {
                data: { user },
              } = await supabase.auth.getUser();

              if (!user) {
                Alert.alert("Error", "Please login again.");
                return;
              }

              const { error } = await supabase
                .from("free_template_submissions")
                .delete()
                .eq("id", template.id)
                .eq("user_id", user.id);

              if (error) throw error;

              setTemplates((current) =>
                current.filter((item) => item.id !== template.id),
              );
            } catch (error) {
              console.error("Delete template error:", error);
              Alert.alert("Error", "Failed to delete template.");
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  }, []);

  const handlePreview = useCallback((template: TemplateSubmission) => {
    Linking.openURL(`https://gbio.us/${template.slug}/` || "").catch((err) => {
      console.error("Failed to open URL:", err);
      Alert.alert("Error", "Failed to open the template link.");
    });
  }, []);

  const handleOpenBioDashboard = useCallback(async () => {
    try {
      await openAuthenticatedDashboard("bio-dashboard");
    } catch (error) {
      console.error("Failed to open bio dashboard:", error);
      Alert.alert("Unable to open dashboard", "Please check your connection and try again.");
    }
  }, []);

  const handleOpenEditor = useCallback(async (template: TemplateSubmission) => {
    try {
      setOpeningId(template.id);
      await openAuthenticatedTemplate("bio-builder", template.id);
    } catch (error) {
      console.error("Failed to open authenticated bio template:", error);
    } finally {
      setOpeningId(null);
    }
  }, []);

  const renderTemplate = useCallback(
    ({ item }: { item: TemplateSubmission }) => {
      const formData = item.form_data ?? {};
      const templateName = getTemplateName(item);

      return (
        <View className="rounded-2xl border border-[#262930] bg-[#181A1F] overflow-hidden mb-3.5">
          {/* Preview */}
          <View className="h-44 bg-[#111317] relative">
            {formData.imageUrl ? (
              <Image
                source={{ uri: formData.imageUrl }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Text className="text-xs font-bold text-slate-400">Template Preview</Text>
              </View>
            )}

            <View className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/65">
              <Text className="text-white text-[9px] font-black">TEMPLATE</Text>
            </View>
          </View>

          {/* Content */}
          <View className="p-4">
            <Text className="text-base font-black text-white" numberOfLines={1}>
              {templateName}
            </Text>

            <Text className="text-[11px] text-slate-400 mt-0.5" numberOfLines={1}>
              {item.template_id}
            </Text>

            {formData.channelTitle ? (
              <Text className="text-xs font-bold text-white mt-2" numberOfLines={1}>
                {formData.channelTitle}
              </Text>
            ) : null}

            {formData.channelDesc1 ? (
              <Text className="text-xs text-slate-400 mt-1 leading-4" numberOfLines={2}>
                {formData.channelDesc1}
              </Text>
            ) : null}

            {/* Meta */}
            <View className="flex-row mt-3.5 pt-3 border-t border-[#262930]">
              <View className="flex-1">
                <Text className="text-[10px] text-slate-400 mb-0.5">Niche</Text>
                <Text className="text-xs font-bold text-white" numberOfLines={1}>
                  {item.niche || "General"}
                </Text>
              </View>

              <View className="flex-1">
                <Text className="text-[10px] text-slate-400 mb-0.5">Downloaded</Text>
                <Text className="text-xs font-bold text-white">
                  {formatDate(item.downloaded_at)}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View className="flex-row gap-2.5 mt-4">
              <Pressable
                className="flex-1 h-10 rounded-xl items-center justify-center bg-[#0084FF]"
                onPress={() => handlePreview(item)}
              >
                <Text className="text-white text-xs font-extrabold">Preview</Text>
              </Pressable>

              <Pressable
                className="w-16 h-10 rounded-xl items-center justify-center bg-[#111317] border border-[#262930]"
                onPress={() => handleOpenEditor(item)}
                disabled={openingId === item.id}
              >
                {openingId === item.id ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-xs font-extrabold">Edit</Text>
                )}
              </Pressable>

              <Pressable
                className="w-20 h-10 rounded-xl items-center justify-center bg-red-500/10 border border-red-500/30"
                onPress={() => handleDelete(item)}
                disabled={deletingId === item.id}
              >
                {deletingId === item.id ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <Text className="text-red-400 text-xs font-bold">Delete</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      );
    },
    [deletingId, handleDelete, handleOpenEditor, handlePreview, openingId],
  );

  return (
    <AppScreen safeArea={false} className="flex-1 bg-[#0B0D10]">
      <AppTopBar title="Bio Templates" subtitle="Your downloaded templates" showBack />

      {loading ? (
        <TemplatesListSkeleton />
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(item) => item.id}
          renderItem={renderTemplate}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 60, flexGrow: templates.length === 0 ? 1 : undefined }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#0084FF" />
          }
          ListHeaderComponent={
            templates.length > 0 ? (
              <View className="flex-row items-center justify-between rounded-2xl border border-[#262930] bg-[#181A1F] p-4 mb-4">
                <View className="flex-1">
                  <Text className="text-base font-black text-white">My Templates</Text>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    {templates.length}{" "}
                    {templates.length === 1 ? "template" : "templates"}{" "}
                    downloaded
                  </Text>
                </View>

                <Pressable
                  className="bg-[#0084FF] px-3 py-1.5 rounded-lg mr-2"
                  onPress={handleOpenBioDashboard}
                >
                  <Text className="text-white text-xs font-bold">Web Dashboard ↗</Text>
                </Pressable>

                <View className="w-9 h-9 rounded-full items-center justify-center bg-[#111317] border border-[#262930]">
                  <Text className="text-xs font-black text-white">{templates.length}</Text>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-8 pb-20">
              <Text className="text-4xl mb-3">▣</Text>
              <Text className="text-lg font-black text-white">No Templates Found</Text>
              <Text className="mt-1 text-xs text-slate-400 text-center leading-5">
                Your downloaded bio templates will appear here.
              </Text>

              <Pressable
                className="mt-4 px-4 py-3 rounded-xl bg-[#0084FF]"
                onPress={() => handleOpenEditor({ id: "creators-v1" } as any)}
              >
                <Text className="text-white text-xs font-bold">Create Bio Page 🚀</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </AppScreen>
  );
}

const getTemplateName = (template: TemplateSubmission) => {
  return (
    template.form_data?.channelName ||
    template.form_data?.channelTitle ||
    template.template_id ||
    "Untitled Template"
  );
};

const formatDate = (date?: string) => {
  if (!date) return "N/A";
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "N/A";
  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
