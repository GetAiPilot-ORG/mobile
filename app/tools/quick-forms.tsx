import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { openAuthenticatedTemplate } from "@/lib/template-deep-link";
import { AppScreen } from "../../src/components/AppScreen";
import { AppTopBar } from "../../src/components/AppTopBar";
import { supabase } from "../../src/lib/supabase";
import { QuickFormsSkeleton } from "../../src/components/skeletonScreen";
import { useTheme, getColors } from "@/theme";

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
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

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
    console.log("[QuickForms] Opening form:", form.id);

    await openAuthenticatedTemplate({
      targetTool: "quick-forms",
      quickFormId: form.id,
    });
  };

  const handleCreate = async () => {
    console.log("[QuickForms] Creating new form");

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
      <View style={[styles.card, isDark && styles.cardDark]}>
        <View style={styles.cardHeader}>
          <View
            style={[styles.iconContainer, isDark && styles.iconContainerDark]}
          >
            <Ionicons name="document-text-outline" size={22} color={isDark ? "#FFFFFF" : "#0A84FF"} />
          </View>

          <View style={styles.titleContainer}>
            <Text
              numberOfLines={1}
              style={[styles.formTitle, isDark && styles.formTitleDark]}
            >
              {getFormTitle(item)}
            </Text>

            <Text
              style={[styles.updatedText, isDark && styles.updatedTextDark]}
            >
              Updated {formatDate(item.updated_at)}
            </Text>
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
            onPress={() => handleDelete(item)}
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
        <AppTopBar title="QuickForms" subtitle="Manage your forms" />
        <QuickFormsSkeleton />
      </AppScreen>
    );
  }

  return (
    <AppScreen safeArea={false}>
      <AppTopBar
        title="QuickForms"
        subtitle={
          forms.length > 0
            ? `${forms.length} form${forms.length === 1 ? "" : "s"}`
            : "Create your first form"
        }
      />

      <View style={styles.container}>
        {forms.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, isDark && styles.emptyIconDark]}>
              <Ionicons name="file-tray-outline" size={38} color={isDark ? "#FFFFFF" : "#0A84FF"} />
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

    emptyContainer: {
      flex: 1,
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
      borderRadius: 18,
      borderWidth: 1,
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
