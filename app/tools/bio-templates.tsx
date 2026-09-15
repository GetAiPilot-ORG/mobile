import { useCallback, useEffect, useState } from "react";
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
import { openAuthenticatedTemplate } from "../../src/lib/template-deep-link";
import { supabase } from "../../src/lib/supabase";
import { colors } from "../../src/theme/colors";
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
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setTemplates([]);
        return;
      }

      const { data, error } = await supabase
        .from("free_template_submissions")
        .select("*")
        .eq("user_id", user.id)
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
    // Defer the initial network request until after this render is committed.
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
        <View style={styles.templateCard}>
          {/* Preview */}
          <View style={styles.previewContainer}>
            {formData.imageUrl ? (
              <Image
                source={{ uri: formData.imageUrl }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.previewPlaceholder}>
                <Text style={styles.previewPlaceholderText}>
                  Template Preview
                </Text>
              </View>
            )}

            <View style={styles.templateBadge}>
              <Text style={styles.templateBadgeText}>TEMPLATE</Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.cardContent}>
            <Text style={styles.templateName} numberOfLines={1}>
              {templateName}
            </Text>

            <Text style={styles.templateId} numberOfLines={1}>
              {item.template_id}
            </Text>

            {formData.channelTitle ? (
              <Text style={styles.channelTitle} numberOfLines={1}>
                {formData.channelTitle}
              </Text>
            ) : null}

            {formData.channelDesc1 ? (
              <Text style={styles.description} numberOfLines={2}>
                {formData.channelDesc1}
              </Text>
            ) : null}

            {/* Meta */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Niche</Text>

                <Text style={styles.metaValue} numberOfLines={1}>
                  {item.niche || "General"}
                </Text>
              </View>

              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Downloaded</Text>

                <Text style={styles.metaValue}>
                  {formatDate(item.downloaded_at)}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [
                  styles.previewButton,
                  pressed && styles.pressed,
                ]}
                onPress={() => handlePreview(item)}
              >
                <Text style={styles.previewButtonText}>Preview</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.editButton,
                  pressed && styles.pressed,
                ]}
                onPress={() => handleOpenEditor(item)}
                disabled={openingId === item.id}
              >
                {openingId === item.id ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.editButtonText}>Edit</Text>
                )}
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.deleteButton,
                  pressed && styles.pressed,
                ]}
                onPress={() => handleDelete(item)}
                disabled={deletingId === item.id}
              >
                {deletingId === item.id ? (
                  <ActivityIndicator size="small" color={colors.foreground} />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete</Text>
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
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar
        title="Bio Templates"
        subtitle="Your downloaded templates"
        showBack
      />

      {loading ? (
        <TemplatesListSkeleton />
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(item) => item.id}
          renderItem={renderTemplate}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            templates.length === 0 && styles.emptyListContent,
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListHeaderComponent={
            templates.length > 0 ? (
              <View style={styles.headerCard}>
                <View>
                  <Text style={styles.headerTitle}>My Templates</Text>

                  <Text style={styles.headerSubtitle}>
                    {templates.length}{" "}
                    {templates.length === 1 ? "template" : "templates"}{" "}
                    downloaded
                  </Text>
                </View>

                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{templates.length}</Text>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>▣</Text>

              <Text style={styles.emptyTitle}>No Templates Found</Text>

              <Text style={styles.emptyText}>
                Your downloaded bio templates will appear here.
              </Text>
            </View>
          }
        />
      )}
    </AppScreen>
  );
}

/* ---------------- Helpers ---------------- */

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

  if (Number.isNaN(parsedDate.getTime())) {
    return "N/A";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.foreground,
  },

  headerSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: colors.mutedForeground,
  },

  countBadge: {
    minWidth: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.muted,
  },

  countText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.foreground,
  },

  templateCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: 14,
  },

  previewContainer: {
    height: 170,
    backgroundColor: colors.muted,
    position: "relative",
  },

  previewImage: {
    width: "100%",
    height: "100%",
  },

  previewPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  previewPlaceholderText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.mutedForeground,
  },

  templateBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: "rgba(0,0,0,0.65)",
  },

  templateBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },

  cardContent: {
    padding: 16,
  },

  templateName: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.foreground,
  },

  templateId: {
    marginTop: 3,
    fontSize: 11,
    color: colors.mutedForeground,
  },

  channelTitle: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "700",
    color: colors.foreground,
  },

  description: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: colors.mutedForeground,
  },

  metaRow: {
    flexDirection: "row",
    marginTop: 14,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  metaItem: {
    flex: 1,
  },

  metaLabel: {
    fontSize: 10,
    color: colors.mutedForeground,
    marginBottom: 3,
  },

  metaValue: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.foreground,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
  },

  previewButton: {
    flex: 1,
    height: 42,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },

  previewButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  editButton: {
    width: 72,
    height: 42,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },

  editButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  deleteButton: {
    width: 90,
    height: 42,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.muted,
    borderWidth: 1,
    borderColor: colors.border,
  },

  deleteButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.foreground,
  },

  pressed: {
    opacity: 0.7,
  },

  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: colors.mutedForeground,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyIcon: {
    fontSize: 38,
    color: colors.mutedForeground,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.foreground,
  },

  emptyText: {
    marginTop: 6,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 19,
    color: colors.mutedForeground,
  },
});
