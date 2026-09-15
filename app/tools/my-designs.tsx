import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppScreen } from "../../src/components/AppScreen";
import { AppTopBar } from "../../src/components/AppTopBar";
import { supabase } from "../../src/lib/supabase";
import { colors } from "../../src/theme/colors";
import { TemplatesListSkeleton } from "../../src/components/skeletonScreen";

type FormData = {
  imageUrl?: string;
  channelLink?: string;
  channelName?: string;
  metaPixelId?: string;
  channelDesc1?: string;
  channelDesc2?: string | null;
  channelTitle?: string;
  ctaButtonText?: string;
  customContent?: Record<string, any>;
  channelSubscribers?: number;
};

type LandingSubmission = {
  id: string;
  user_id: string;
  email: string;
  template_id: string;
  form_data: FormData;
  created_at: string;
  updated_at: string;
  page_title: string;
  slug: string;
  page_views: number;
  button_clicks: number;
};

export default function MyDesignScreen() {
  const [submissions, setSubmissions] = useState<LandingSubmission[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Please login", "You need to login to view your pages.");
        return;
      }

      const { data, error } = await supabase
        .from("landing_template_submissions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setSubmissions(data || []);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      Alert.alert("Error", "Failed to load your landing pages.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewTemplate = (template: LandingSubmission) => {
    Linking.openURL(
      `https://gpage.us/${template.slug == template.slug ? template.slug : template.page_title}/`,
    ).catch((err) => console.error("Error opening URL:", err));
  };

  const renderTemplate = ({ item }: { item: LandingSubmission }) => {
    const formData = item.form_data || {};

    return (
      <View style={styles.templateCard}>
        {/* Preview Image */}
        <View style={styles.imageContainer}>
          {formData.imageUrl ? (
            <Image
              source={{ uri: formData.imageUrl }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>No Preview</Text>
            </View>
          )}

          {/* Template Badge */}
          <View style={styles.templateBadge}>
            <Text style={styles.templateBadgeText}>{item.template_id}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.cardBody}>
          {/* Page Title */}
          <Text style={styles.pageTitle}>
            {item.page_title || "Untitled Page"}
          </Text>

          {/* Channel Name */}
          <Text style={styles.channelName}>
            {formData.channelName || "Your Channel"}
          </Text>

          {/* Channel Title */}
          {formData.channelTitle ? (
            <Text style={styles.channelTitle}>{formData.channelTitle}</Text>
          ) : null}

          {/* Description */}
          {formData.channelDesc1 ? (
            <Text style={styles.description} numberOfLines={2}>
              {formData.channelDesc1}
            </Text>
          ) : null}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{item.page_views || 0}</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{item.button_clicks || 0}</Text>
              <Text style={styles.statLabel}>Clicks</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formData.channelSubscribers || 0}
              </Text>
              <Text style={styles.statLabel}>Subscribers</Text>
            </View>
          </View>

          {/* Slug */}
          <View style={styles.slugContainer}>
            <Text style={styles.slugLabel}>Your Link</Text>

            <Text style={styles.slugText} numberOfLines={1}>
              /{item.slug}
            </Text>
          </View>

          {/* CTA */}
          <Pressable
            style={({ pressed }) => [
              styles.useButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => handleViewTemplate(item)}
          >
            <Text style={styles.useButtonText}>
              {formData.ctaButtonText || "View Template"} →
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar
        title="Bio Link Templates"
        subtitle="High-Converting Profile Themes"
        showBack={true}
      />

      {loading ? (
        <TemplatesListSkeleton />
      ) : (
        <FlatList
          data={submissions}
          keyExtractor={(item) => item.id}
          renderItem={renderTemplate}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.headerCard}>
              <Text style={styles.cardTitle}>My Bio Pages</Text>

              <Text style={styles.cardSubtitle}>
                Manage your landing pages and bio link templates from one place.
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Bio Pages Yet</Text>

              <Text style={styles.emptyText}>
                Create your first bio landing page to see it here.
              </Text>
            </View>
          }
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },

  headerCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.foreground,
    marginBottom: 5,
  },

  cardSubtitle: {
    fontSize: 13,
    color: colors.mutedForeground,
    lineHeight: 19,
  },

  templateCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },

  imageContainer: {
    height: 180,
    width: "100%",
    position: "relative",
    backgroundColor: colors.muted,
  },

  previewImage: {
    width: "100%",
    height: "100%",
  },

  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  imagePlaceholderText: {
    fontSize: 14,
    color: colors.mutedForeground,
    fontWeight: "600",
  },

  templateBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  templateBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },

  cardBody: {
    padding: 16,
  },

  pageTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.foreground,
  },

  channelName: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
    marginTop: 4,
  },

  channelTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.foreground,
    marginTop: 12,
  },

  description: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.mutedForeground,
    marginTop: 5,
  },

  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: colors.muted,
    borderRadius: 12,
  },

  statItem: {
    alignItems: "center",
    flex: 1,
  },

  statValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.foreground,
  },

  statLabel: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 2,
  },

  divider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },

  slugContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },

  slugLabel: {
    fontSize: 11,
    color: colors.mutedForeground,
    fontWeight: "600",
  },

  slugText: {
    flex: 1,
    textAlign: "right",
    marginLeft: 10,
    fontSize: 12,
    fontWeight: "700",
    color: colors.foreground,
  },

  useButton: {
    marginTop: 14,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },

  buttonPressed: {
    opacity: 0.7,
  },

  useButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  loaderContainer: {
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
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 30,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.foreground,
    marginBottom: 6,
  },

  emptyText: {
    textAlign: "center",
    fontSize: 13,
    lineHeight: 19,
    color: colors.mutedForeground,
  },
});
