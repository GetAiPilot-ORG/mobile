import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { openAuthenticatedTemplate } from "@/lib/template-deep-link";
import { AppScreen } from "../../src/components/AppScreen";
import { AppTopBar } from "../../src/components/AppTopBar";
import { supabase } from "../../src/lib/supabase";
import { QuickFormsSkeleton } from "../../src/components/skeletonScreen";

interface QuickForm {
  id: string;
  user_id: string;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  slug?: string | null;
  status?: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export default function SimpleQuickFormsScreen() {
  const [forms, setForms] = useState<QuickForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadForms = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setForms([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const { data, error } = await supabase
        .from("quick_forms")
        .select("*")
        .eq("user_id", session.user.id)
        .order("updated_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setForms((data ?? []) as QuickForm[]);
    } catch (error) {
      console.error("[QuickForms] Failed to load forms:", error);

      Alert.alert(
        "Unable to load forms",
        "Something went wrong while loading your forms.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadForms();
  }, [loadForms]);

  const handleRefresh = () => {
    setRefreshing(true);
    void loadForms();
  };

  const handleRedirect = async (form: QuickForm) => {
    await openAuthenticatedTemplate({
      targetTool: "quick-forms",
      quickFormId: form.id,
    });
  };

  const handleCreate = async () => {
    await openAuthenticatedTemplate({
      targetTool: "quick-forms",
    });
  };

  const handleDelete = (form: QuickForm) => {
    Alert.alert(
      "Delete form?",
      `Are you sure you want to delete "${getFormTitle(
        form,
      )}"? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void deleteForm(form.id);
          },
        },
      ],
    );
  };

  const deleteForm = async (formId: string) => {
    try {
      setDeletingId(formId);

      const { error } = await supabase
        .from("quick_forms")
        .delete()
        .eq("id", formId);

      if (error) {
        throw error;
      }

      setForms((current) => current.filter((form) => form.id !== formId));
    } catch (error) {
      console.error("[QuickForms] Failed to delete form:", error);

      Alert.alert(
        "Delete failed",
        "Unable to delete the form. Please try again.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const getFormTitle = (form: QuickForm) => {
    return form.title || form.name || "Untitled Form";
  };

  const getFormDescription = (form: QuickForm) => {
    if (form.description) {
      return form.description;
    }

    return "Create and share your customer form.";
  };

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const renderForm = ({ item }: { item: QuickForm }) => {
    const isDeleting = deletingId === item.id;

    return (
      <View className="rounded-2xl border border-[#262930] bg-[#181A1F] p-4 mb-3">
        <View className="flex-row items-center">
          <View className="w-11 h-11 rounded-xl bg-[#0084FF]/20 items-center justify-center">
            <Ionicons name="document-text-outline" size={22} color="#0084FF" />
          </View>

          <View className="flex-1 ml-3 mr-2">
            <Text numberOfLines={1} className="text-sm font-extrabold text-white">
              {getFormTitle(item)}
            </Text>

            <Text className="text-[11px] text-slate-400 mt-0.5">
              Updated {formatDate(item.updated_at)}
            </Text>
          </View>

          {item.status ? (
            <View className="px-2 py-1 rounded-full bg-emerald-500/20">
              <Text className="text-[10px] font-bold text-emerald-400 capitalize">{String(item.status)}</Text>
            </View>
          ) : null}
        </View>

        <Text numberOfLines={2} className="text-xs text-slate-400 mt-3 leading-4">
          {getFormDescription(item)}
        </Text>

        <View className="flex-row mt-4 gap-2.5">
          <Pressable
            disabled={isDeleting}
            onPress={() => handleRedirect(item)}
            className={`flex-1 min-h-[40px] rounded-xl border border-[#262930] bg-[#111317] flex-row items-center justify-center gap-1.5 ${
              isDeleting ? "opacity-50" : ""
            }`}
          >
            <Ionicons name="pencil-outline" size={16} color="#FFFFFF" />
            <Text className="text-xs font-bold text-white">Edit</Text>
          </Pressable>

          <Pressable
            disabled={isDeleting}
            onPress={() => handleDelete(item)}
            className={`flex-1 min-h-[40px] rounded-xl border border-red-500/30 bg-red-500/10 flex-row items-center justify-center gap-1.5 ${
              isDeleting ? "opacity-50" : ""
            }`}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <Text className="text-xs font-bold text-red-400">Delete</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <AppScreen safeArea={false} className="flex-1 bg-[#0B0D10]">
        <AppTopBar title="QuickForms" subtitle="Manage your forms" />
        <QuickFormsSkeleton />
      </AppScreen>
    );
  }

  return (
    <AppScreen safeArea={false} className="flex-1 bg-[#0B0D10]">
      <AppTopBar
        title="QuickForms"
        subtitle={
          forms.length > 0
            ? `${forms.length} form${forms.length === 1 ? "" : "s"}`
            : "Create your first form"
        }
      />

      <View className="flex-1 px-4">
        {forms.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6 pb-20">
            <View className="w-16 h-16 rounded-full items-center justify-center bg-[#0084FF]/20 mb-5">
              <Ionicons name="file-tray-outline" size={32} color="#0084FF" />
            </View>

            <Text className="text-xl font-black text-white">No forms yet</Text>

            <Text className="mt-2 text-xs text-slate-400 text-center leading-5 max-w-[320px]">
              Create your first form to collect customer information, surveys, consultations, or leads.
            </Text>

            <Pressable
              onPress={() => void handleCreate()}
              className="mt-6 min-h-[48px] px-5 rounded-xl bg-[#0084FF] flex-row items-center justify-center gap-2"
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text className="text-xs font-extrabold text-white">Create Form</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View className="flex-row items-center justify-between py-4">
              <Text className="text-base font-black text-white">Your Forms</Text>

              <Pressable
                onPress={() => void handleCreate()}
                className="min-h-[36px] px-3.5 rounded-xl bg-[#0084FF] flex-row items-center gap-1.5"
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text className="text-xs font-bold text-white">Create</Text>
              </Pressable>
            </View>

            <FlatList
              data={forms}
              keyExtractor={(item) => item.id}
              renderItem={renderForm}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor="#0084FF"
                />
              }
            />
          </>
        )}
      </View>
    </AppScreen>
  );
}
