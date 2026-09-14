import { FileText, Inbox, Pencil, Plus, Trash2 } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";

import { openAuthenticatedTemplate } from "@/lib/template-deep-link";
import { AppScreen } from "../../src/components/AppScreen";
import { AppTopBar } from "../../src/components/AppTopBar";
import { supabase } from "../../src/lib/supabase";

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [forms, setForms] = useState<QuickForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadForms = useCallback(async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setForms([]);
        return;
      }

      const { data, error } = await supabase
        .from("quick_forms")
        .select("*")
        .eq("user_id", user.id)
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
            <FileText size={22} color={isDark ? "#FFFFFF" : "#0A84FF"} />
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
            <Pencil size={17} color={isDark ? "#FFFFFF" : "#111827"} />

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
                <Trash2 size={17} color="#DC2626" />

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

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0A84FF" />

          <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
            Loading your forms...
          </Text>
        </View>
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
              <Inbox size={38} color={isDark ? "#FFFFFF" : "#0A84FF"} />
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
              <Plus size={20} color="#FFFFFF" />

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
                <Plus size={18} color="#FFFFFF" />

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

const styles = StyleSheet.create({
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
    color: "#6B7280",
  },

  loadingTextDark: {
    color: "#8E8E93",
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
    backgroundColor: "#EAF3FF",
    marginBottom: 20,
  },

  emptyIconDark: {
    backgroundColor: "#1C2A3A",
  },

  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
  },

  emptyTitleDark: {
    color: "#FFFFFF",
  },

  emptyDescription: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: "#6B7280",
    textAlign: "center",
    maxWidth: 360,
  },

  emptyDescriptionDark: {
    color: "#8E8E93",
  },

  createButton: {
    marginTop: 24,
    minHeight: 50,
    paddingHorizontal: 22,
    borderRadius: 14,
    backgroundColor: "#0A84FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  createButtonText: {
    color: "#FFFFFF",
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
    color: "#111827",
  },

  sectionTitleDark: {
    color: "#FFFFFF",
  },

  smallCreateButton: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#0A84FF",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  smallCreateText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  listContent: {
    paddingBottom: 120,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 12,
  },

  cardDark: {
    backgroundColor: "#1C1C1E",
    borderColor: "#2C2C2E",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: "#EAF3FF",
    alignItems: "center",
    justifyContent: "center",
  },

  iconContainerDark: {
    backgroundColor: "#263A4D",
  },

  titleContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  formTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },

  formTitleDark: {
    color: "#FFFFFF",
  },

  updatedText: {
    marginTop: 4,
    fontSize: 12,
    color: "#9CA3AF",
  },

  updatedTextDark: {
    color: "#8E8E93",
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#E8F8EE",
  },

  statusText: {
    color: "#15803D",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },

  description: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 19,
    color: "#6B7280",
  },

  descriptionDark: {
    color: "#8E8E93",
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
    borderColor: "#D1D5DB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  editButtonDark: {
    borderColor: "#3A3A3C",
  },

  editButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },

  editButtonTextDark: {
    color: "#FFFFFF",
  },

  deleteButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  deleteText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#DC2626",
  },

  disabledButton: {
    opacity: 0.5,
  },
});
