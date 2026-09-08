import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppScreen } from "../../src/components/AppScreen";
import { AppTopBar } from "../../src/components/AppTopBar";
import { colors } from "../../src/theme/colors";

type BioTemplate = {
  id: string;
  title: string;
  style: string;
  tags: string[];
  color: string;
};

const BIO_TEMPLATES: BioTemplate[] = [
  {
    id: "1",
    title: "Creator & Influencer",
    style: "Dark Glassmorphic",
    tags: ["Instagram", "YouTube"],
    color: "#E1306C",
  },
  {
    id: "2",
    title: "Agency Portfolio",
    style: "Forest Clean",
    tags: ["Services", "Booking"],
    color: "#003C33",
  },
  {
    id: "3",
    title: "Developer & Tech",
    style: "Minimalist Terminal",
    tags: ["GitHub", "Portfolio"],
    color: "#229ED9",
  },
  {
    id: "4",
    title: "E-commerce & Store",
    style: "Vibrant Showcase",
    tags: ["Products", "Discounts"],
    color: "#F59E0B",
  },
];

export default function BioTemplatesScreen() {
  const handleUseTemplate = (template: BioTemplate) => {
    Alert.alert(
      "Template Selected",
      `Ready to launch ${template.title}.\n\nCanvas initialized with ${template.style} presets.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Continue",
          onPress: () => {
            console.log("Selected template:", template.id);
            console.log("Template:", template.title);
          },
        },
      ],
    );
  };

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar
        title="Bio Link Templates"
        subtitle="High-Converting Profile Themes"
        showBack={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mobile Bio Presets</Text>

          <Text style={styles.cardSubtitle}>
            Select a verified responsive template to launch your single-link
            profile across Instagram, TikTok, and Twitter.
          </Text>
        </View>

        {/* Template List */}
        <View style={styles.templateList}>
          {BIO_TEMPLATES.map((template) => (
            <View key={template.id} style={styles.templateCard}>
              {/* Color Bar */}
              <View
                style={[
                  styles.colorBar,
                  {
                    backgroundColor: template.color,
                  },
                ]}
              />

              <View style={styles.cardBody}>
                {/* Title + Style */}
                <View style={styles.cardTop}>
                  <Text style={styles.tplTitle}>{template.title}</Text>

                  <Text style={styles.tplStyle}>{template.style}</Text>
                </View>

                {/* Tags */}
                <View style={styles.tagsRow}>
                  {template.tags.map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>

                {/* Use Template */}
                <Pressable
                  style={({ pressed }) => [
                    styles.useBtn,
                    {
                      backgroundColor: template.color,
                    },
                    pressed && styles.useBtnPressed,
                  ]}
                  onPress={() => handleUseTemplate(template)}
                >
                  <Text style={styles.useBtnText}>Use Template →</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
        <Pressable onPress={() => Alert.prompt("View More Templates pressed")}>
          <Text
            style={{
              color: colors.primary,
              fontSize: 14,
              fontWeight: "700",
              textAlign: "center",
              marginTop: 20,
            }}
          >
            View More Templates
          </Text>
        </Pressable>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.foreground,
    marginBottom: 4,
  },

  cardSubtitle: {
    fontSize: 13,
    color: colors.mutedForeground,
    lineHeight: 18,
  },

  templateList: {
    gap: 14,
  },

  templateCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },

  colorBar: {
    height: 6,
    width: "100%",
  },

  cardBody: {
    padding: 16,
  },

  cardTop: {
    marginBottom: 10,
  },

  tplTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.foreground,
  },

  tplStyle: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 3,
  },

  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },

  tag: {
    backgroundColor: colors.muted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  tagText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.mutedForeground,
  },

  useBtn: {
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  useBtnPressed: {
    opacity: 0.7,
  },

  useBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },
});
