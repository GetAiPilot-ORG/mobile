import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";

import { openAuthenticatedTemplate } from "@/lib/template-deep-link";
import { AppScreen } from "../../src/components/AppScreen";
import { AppTopBar } from "../../src/components/AppTopBar";
import { supabase } from "../../src/lib/supabase";
import { QuickFormsSkeleton } from "../../src/components/skeletonScreen";
import { useTheme, getColors } from "@/theme";
import { useAuth } from "../../src/contexts/AuthContext";
import { useAuthStore } from "../../src/core/store/authStore";
import { authStorage } from "../../src/core/storage/authStorage";

interface QuickForm {
  id: string;
  user_id: string;
  title?: string | null;
  name?: string | null;
  page_title?: string | null;
  form_name?: string | null;
  description?: string | null;
  slug?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export default function SimpleQuickFormsScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const { user } = useAuth();
  const authStoreUser = useAuthStore((s) => s.user);

  const [forms, setForms] = useState<QuickForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getResolvedUserId = useCallback(async (): Promise<string | null> => {
    // 1. Direct user from AuthContext or Zustand store
    if (user?.id) return user.id;
    if (authStoreUser?.id) return authStoreUser.id;
    const storeUser = useAuthStore.getState().user;
    if (storeUser?.id) return storeUser.id;

    // 2. Supabase session check
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user?.id) {
        return sessionData.session.user.id;
      }
    } catch {}

    // 3. If Supabase session is unhydrated, try to re-authenticate with stored token
    try {
      const token = await authStorage.getAccessToken();
      const refreshToken = await authStorage.getRefreshToken();
      if (token) {
        const { data: refreshed } = await supabase.auth.setSession({
          access_token: token,
          refresh_token: refreshToken || "",
        });
        if (refreshed?.user?.id) {
          return refreshed.user.id;
        }
      }
    } catch {}

    // 4. Supabase getUser fallback
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.id) {
        return userData.user.id;
      }
    } catch {}

    return null;
  }, [user?.id, authStoreUser?.id]);

  const loadForms = useCallback(async () => {
    try {
      const currentUserId = await getResolvedUserId();

      if (!currentUserId) {
        console.warn("[QuickForms] No active user session found.");
        setForms([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      let formsData: any[] | null = null;

      // Tier 1: Try quick_forms ordered by updated_at descending
      const res1 = await supabase
        .from("quick_forms")
        .select("*")
        .eq("user_id", currentUserId)
        .order("updated_at", { ascending: false });

      if (!res1.error && res1.data) {
        formsData = res1.data;
      } else {
        // Tier 2: Try quick_forms ordered by created_at descending
        const res2 = await supabase
          .from("quick_forms")
          .select("*")
          .eq("user_id", currentUserId)
          .order("created_at", { ascending: false });

        if (!res2.error && res2.data) {
          formsData = res2.data;
        } else {
          // Tier 3: Try quick_forms unordered
          const res3 = await supabase
            .from("quick_forms")
            .select("*")
            .eq("user_id", currentUserId);

          if (!res3.error && res3.data) {
            formsData = res3.data;
          }
        }
      }

      // Tier 4: Fallback check on free_template_submissions for form-type entries
      if (!formsData || formsData.length === 0) {
        try {
          const resTemplates = await supabase
            .from("free_template_submissions")
            .select("*")
            .eq("user_id", currentUserId)
            .in("niche", ["form", "quick_forms", "quick-forms", "forms"]);

          if (resTemplates.data && resTemplates.data.length > 0) {
            formsData = resTemplates.data.map((f: any) => ({
              id: f.id,
              user_id: f.user_id,
              title: f.page_title || f.title || f.name || "Quick Form",
              name: f.page_title || f.title,
              description:
                f.form_data?.description ||
                f.description ||
                "Conversational intake funnel",
              slug: f.slug,
              status: f.status || "active",
              created_at: f.created_at || f.downloaded_at || new Date().toISOString(),
              updated_at: f.updated_at || f.created_at || new Date().toISOString(),
            }));
          }
        } catch {}
      }

      setForms((formsData ?? []) as QuickForm[]);
    } catch (error) {
      console.error("[QuickForms] Failed to load forms:", error);
      setForms([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getResolvedUserId]);

  useFocusEffect(
    useCallback(() => {
      void loadForms();
    }, [loadForms])
  );

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

  const confirmDelete = (message: string): Promise<boolean> => {
    if (Platform.OS === "web") {
      return Promise.resolve(
        typeof globalThis.confirm === "function"
          ? globalThis.confirm(message)
          : false,
      );
    }

    return new Promise((resolve) => {
      Alert.alert(
        "Delete form?",
        message,
        [
          { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
          { text: "Delete", style: "destructive", onPress: () => resolve(true) },
        ],
        { cancelable: true, onDismiss: () => resolve(false) },
      );
    });
  };

  const showDeleteError = (message: string) => {
    if (Platform.OS === "web" && typeof globalThis.alert === "function") {
      globalThis.alert(message);
      return;
    }
    Alert.alert("Delete failed", message);
  };

  const handleDelete = async (form: QuickForm) => {
    const confirmed = await confirmDelete(
      `Delete "${getFormTitle(form)}"? This action cannot be undone.`,
    );
    if (confirmed) {
      await deleteForm(form.id);
    }
  };

  const deleteForm = async (formId: string) => {
    try {
      setDeletingId(formId);

      const currentUserId = await getResolvedUserId();
      if (!currentUserId) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const { data: deletedRows, error } = await supabase
        .from("quick_forms")
        .delete()
        .eq("id", formId)
        .eq("user_id", currentUserId)
        .select("id");

      if (error) {
        throw error;
      }
      if (!deletedRows?.length) {
        throw new Error("The form was not deleted. Check the database delete policy.");
      }

      setForms((current) => current.filter((form) => form.id !== formId));
    } catch (error) {
      console.error("[QuickForms] Failed to delete form:", error);
      showDeleteError(
        error instanceof Error
          ? error.message
          : "Unable to delete the form. Please try again.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const getFormTitle = (form: QuickForm) => {
    return (
      form.title ||
      form.name ||
      form.page_title ||
      form.form_name ||
      (form as any)?.settings?.title ||
      (form as any)?.schema?.title ||
      "Untitled Form"
    );
  };

  const getFormDescription = (form: QuickForm) => {
    if (form.description) {
      return form.description;
    }
    if ((form as any)?.settings?.description) {
      return (form as any).settings.description;
    }
    if ((form as any)?.form_data?.description) {
      return (form as any).form_data.description;
    }
    if ((form as any)?.sub_title) {
      return (form as any).sub_title;
    }

    return "Create and share your customer form.";
  };

  const formatDate = (date?: string | null) => {
    if (!date) return "";
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
    const dateStr = item.updated_at || item.created_at;

    return (
      <View style={[styles.card, isDark && styles.cardDark]}>
        <View style={styles.cardHeader}>
          <View
            style={[styles.iconContainer, isDark && styles.iconContainerDark]}
          >
            <Ionicons name="document-text-outline" size={22} color={colors.accent} />
          </View>

          <View style={styles.titleContainer}>
            <Text
              numberOfLines={1}
              style={[styles.formTitle, isDark && styles.formTitleDark]}
            >
              {getFormTitle(item)}
            </Text>

            {dateStr ? (
              <Text
                style={[styles.updatedText, isDark && styles.updatedTextDark]}
              >
                Updated {formatDate(dateStr)}
              </Text>
            ) : null}
          </View>

          {item.status ? (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{String(item.status)}</Text>
            </View>
          ) : null}
        </View>

        <Text
          numberOfLines={2}
          style={[styles.description, isDark && styles.descriptionDark]}
        >
          {getFormDescription(item)}
        </Text>

        <View style={styles.actions}>
          <Pressable
            disabled={isDeleting}
            onPress={() => handleRedirect(item)}
            style={[
              styles.editButton,
              isDark && styles.editButtonDark,
              isDeleting && styles.disabledButton,
            ]}
          >
            <Ionicons name="pencil-outline" size={17} color={isDark ? "#FFFFFF" : "#111827"} />

            <Text
              style={[
                styles.editButtonText,
                isDark && styles.editButtonTextDark,
              ]}
            >
              Edit
            </Text>
          </Pressable>

          <Pressable
            disabled={isDeleting}
            onPress={() => void handleDelete(item)}
            style={[styles.deleteButton, isDeleting && styles.disabledButton]}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={17} color="#DC2626" />

                <Text style={styles.deleteText}>Delete</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <AppScreen safeArea={false}>
        <AppTopBar title="QuickForms" />
        <QuickFormsSkeleton />
      </AppScreen>
    );
  }

  return (
    <AppScreen safeArea={false}>
      <AppTopBar title="QuickForms" />

      <View style={styles.container}>
        {forms.length === 0 ? (
          <ScrollView
            contentContainerStyle={styles.emptyScrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
          >
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIcon, isDark && styles.emptyIconDark]}>
                <Ionicons name="file-tray-outline" size={38} color={colors.accent} />
              </View>

              <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
                No forms yet
              </Text>

              <Text
                style={[
                  styles.emptyDescription,
                  isDark && styles.emptyDescriptionDark,
                ]}
              >
                Create your first form to collect customer information, surveys,
                consultations, or leads.
              </Text>

              <Pressable
                onPress={() => void handleCreate()}
                style={styles.createButton}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />

                <Text style={styles.createButtonText}>Create Form</Text>
              </Pressable>
            </View>
          </ScrollView>
        ) : (
          <>
            <View style={styles.topActions}>
              <Text
                style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}
              >
                Your Forms
              </Text>

              <Pressable
                onPress={() => void handleCreate()}
                style={styles.smallCreateButton}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />

                <Text style={styles.smallCreateText}>Create</Text>
              </Pressable>
            </View>

            <FlatList
              data={forms}
              keyExtractor={(item) => item.id}
              renderItem={renderForm}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                />
              }
            />
          </>
        )}
      </View>
    </AppScreen>
  );
}

function createStyles(colors: ReturnType<typeof getColors>, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 16,
    },

    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },

    loadingText: {
      fontSize: 14,
      color: colors.mutedForeground,
    },

    loadingTextDark: {
      color: colors.mutedForeground,
    },

    emptyScrollContent: {
      flexGrow: 1,
      justifyContent: "center",
    },

    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      paddingBottom: 80,
    },

    emptyIcon: {
      width: 76,
      height: 76,
      borderRadius: 38,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSoft,
      marginBottom: 20,
    },

    emptyIconDark: {
      backgroundColor: colors.accentSoft,
    },

    emptyTitle: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.foreground,
    },

    emptyTitleDark: {
      color: colors.foreground,
    },

    emptyDescription: {
      marginTop: 10,
      fontSize: 14,
      lineHeight: 21,
      color: colors.mutedForeground,
      textAlign: "center",
      maxWidth: 360,
    },

    emptyDescriptionDark: {
      color: colors.mutedForeground,
    },

    createButton: {
      marginTop: 24,
      minHeight: 50,
      paddingHorizontal: 22,
      borderRadius: 14,
      backgroundColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },

    createButtonText: {
      color: colors.primaryForeground,
      fontSize: 15,
      fontWeight: "700",
    },

    topActions: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 16,
    },

    sectionTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: colors.foreground,
    },

    sectionTitleDark: {
      color: colors.foreground,
    },

    smallCreateButton: {
      minHeight: 40,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    smallCreateText: {
      color: colors.primaryForeground,
      fontSize: 13,
      fontWeight: "700",
    },

    listContent: {
      paddingBottom: 120,
    },

    card: {
      backgroundColor: colors.card,
      borderRadius: 24,
      borderWidth: 0,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 12,
    },

    cardDark: {
      backgroundColor: colors.card,
      borderColor: colors.border,
    },

    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
    },

    iconContainer: {
      width: 46,
      height: 46,
      borderRadius: 13,
      backgroundColor: colors.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },

    iconContainerDark: {
      backgroundColor: colors.accentSoft,
    },

    titleContainer: {
      flex: 1,
      marginLeft: 12,
      marginRight: 8,
    },

    formTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.foreground,
    },

    formTitleDark: {
      color: colors.foreground,
    },

    updatedText: {
      marginTop: 4,
      fontSize: 12,
      color: colors.mutedForeground,
    },

    updatedTextDark: {
      color: colors.mutedForeground,
    },

    statusBadge: {
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 20,
      backgroundColor: colors.successSoft,
    },

    statusText: {
      color: colors.success,
      fontSize: 11,
      fontWeight: "700",
      textTransform: "capitalize",
    },

    description: {
      marginTop: 14,
      fontSize: 13,
      lineHeight: 19,
      color: colors.mutedForeground,
    },

    descriptionDark: {
      color: colors.mutedForeground,
    },

    actions: {
      flexDirection: "row",
      marginTop: 16,
      gap: 10,
    },

    editButton: {
      flex: 1,
      minHeight: 42,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },

    editButtonDark: {
      borderColor: colors.border,
    },

    editButtonText: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.foreground,
    },

    editButtonTextDark: {
      color: colors.foreground,
    },

    deleteButton: {
      flex: 1,
      minHeight: 42,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.destructiveSoft,
      backgroundColor: colors.destructiveSoft,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },

    deleteText: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.destructive,
    },

    disabledButton: {
      opacity: 0.5,
    },
  });
}
