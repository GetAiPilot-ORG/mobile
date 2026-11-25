import { useRouter } from "expo-router";
import { ComponentProps, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Cancel01Icon,
  File01Icon,
  Folder01Icon,
  Link01Icon,
  PaintBrush01Icon,
  QrCode01Icon,
  Rocket01Icon,
  Search01Icon,
  SmartPhone01Icon,
  TelegramIcon,
  VoiceToTextIcon,
  WhatsappIcon,
} from "@/constants/icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useTheme, getColors } from "../../src/theme";
import { AppScreen } from "../../src/components/AppScreen";
import { AppTopBar } from "../../src/components/AppTopBar";
import { ToolCard } from "../../src/components/ToolCard";
import { soundService } from "../../src/services/soundFeedbackService";
import {
  openAuthenticatedTemplate,
  openAuthenticatedWebApp,
} from "../../src/lib/template-deep-link";

interface ToolItem {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: ComponentProps<typeof HugeiconsIcon>["icon"];
  image: any;
  iconBgLight: string;
  iconBgDark: string;
  iconColorLight: string;
  iconColorDark: string;
  badge: string;
  badgeBgLight?: string;
  badgeBgDark?: string;
  badgeColorLight?: string;
  badgeColorDark?: string;
  highlighted?: boolean;
  route: string;
  builder?: {
    targetTool: "landing-templates" | "bio-builder" | "web-app" | "telegram-conversions";
    templateId?: string;
  };
}

const ALL_10_FREE_TOOLS: ToolItem[] = [
  {
    id: "my-designs",
    title: "My Designs",
    category: "TEMPLATES",
    description: "Manage and customize your saved bio sites & campaign pages.",
    icon: PaintBrush01Icon,
    image: require("../../assets/icons/my-design.webp"),
    badge: "CANVAS",
    route: "/tools/my-designs",
    iconBgLight: "#FCE7F3",
    iconBgDark: "rgba(244, 114, 182, 0.16)",
    iconColorLight: "#DB2777",
    iconColorDark: "#F472B6",
  },
  {
    id: "bio-templates",
    title: "Bio Templates",
    category: "TEMPLATES",
    description: "Mobile bio site themes for creators, agencies & brands.",
    icon: SmartPhone01Icon,
    image: require("../../assets/icons/bio-template.webp"),
    badge: "POPULAR",
    route: "/tools/bio-templates",
    iconBgLight: "#EDE9FE",
    iconBgDark: "rgba(167, 139, 250, 0.16)",
    iconColorLight: "#7C3AED",
    iconColorDark: "#A78BFA",
  },
  {
    id: "landing-templates",
    title: "Landing Funnels",
    category: "TEMPLATES",
    description: "Pre-built high-converting lead funnels & waitlist pages.",
    icon: Rocket01Icon,
    image: require("../../assets/icons/event-links.webp"),
    badge: "READY",
    route: "/tools/landing-templates",
    iconBgLight: "#FEF3C7",
    iconBgDark: "rgba(251, 191, 36, 0.16)",
    iconColorLight: "#D97706",
    iconColorDark: "#FBBF24",
    builder: {
      targetTool: "landing-templates",
    },
  },
  {
    id: "quick-forms",
    title: "QuickForms",
    category: "UTILITIES",
    description: "Conversational intake funnels and consultation forms.",
    icon: File01Icon,
    image: require("../../assets/icons/quick-form.webp"),
    badge: "FREE",
    route: "/tools/quick-forms",
    iconBgLight: "#E0F2FE",
    iconBgDark: "rgba(56, 189, 248, 0.16)",
    iconColorLight: "#0284C7",
    iconColorDark: "#38BDF8",
  },
  {
    id: "wa-link",
    title: "WhatsApp Link",
    category: "MESSAGING",
    description: "Direct click-to-chat links with prefilled messages & QR.",
    icon: WhatsappIcon,
    image: require("../../assets/images/products/whatsapp.webp"),
    badge: "POPULAR",
    route: "/tools/whatsapp-link",
    iconBgLight: "#DCFCE7",
    iconBgDark: "rgba(74, 222, 128, 0.16)",
    iconColorLight: "#16A34A",
    iconColorDark: "#4ADE80",
  },
  {
    id: "shortener",
    title: "Link Shortener",
    category: "UTILITIES",
    description: "Shorten long URLs with custom slugs & click analytics.",
    icon: Link01Icon,
    image: require("../../assets/icons/link-shortner.webp"),
    badge: "FAST",
    route: "/tools/link-shortener",
    iconBgLight: "#E0E7FF",
    iconBgDark: "rgba(129, 140, 248, 0.16)",
    iconColorLight: "#4F46E5",
    iconColorDark: "#818CF8",
  },
  {
    id: "file-linker",
    title: "File Linker",
    category: "UTILITIES",
    description: "Generate trackable public direct download links for media.",
    icon: Folder01Icon,
    image: require("../../assets/icons/file-linker.webp"),
    badge: "CLOUD",
    route: "/tools/file-linker",
    iconBgLight: "#FFEDD5",
    iconBgDark: "rgba(251, 146, 60, 0.16)",
    iconColorLight: "#EA580C",
    iconColorDark: "#FB923C",
  },
  {
    id: "speech-to-text",
    title: "AI Speech to Text",
    category: "AI AUDIO",
    description: "Transcribe customer voice notes & audio meetings to text.",
    icon: VoiceToTextIcon,
    image: require("../../assets/icons/ai-speech.webp"),
    badge: "AI PRO",
    route: "/tools/speech-to-text",
    iconBgLight: "#F3E8FF",
    iconBgDark: "rgba(192, 132, 252, 0.16)",
    iconColorLight: "#9333EA",
    iconColorDark: "#C084FC",
  },
  {
    id: "qr-gen",
    title: "QR Generator",
    category: "UTILITIES",
    description: "High-resolution custom vector QR codes for websites & Wi-Fi.",
    icon: QrCode01Icon,
    image: require("../../assets/icons/QR-code.webp"),
    badge: "FREE",
    route: "/tools/qr-code",
    iconBgLight: "#CCFBF1",
    iconBgDark: "rgba(45, 212, 191, 0.16)",
    iconColorLight: "#0D9488",
    iconColorDark: "#2DD4BF",
  },
  {
    id: "telegram-conversion",
    title: "Telegram Conversion",
    category: "MESSAGING",
    description: "Track landing clicks, verified Telegram joins & ad spend.",
    icon: TelegramIcon,
    image: require("../../assets/images/products/telegram.webp"),
    badge: "ADVANCED",
    route: "/tools/telegram-conversion",
    iconBgLight: "#E0F2FE",
    iconBgDark: "rgba(56, 189, 248, 0.16)",
    iconColorLight: "#0284C7",
    iconColorDark: "#38BDF8",
    badgeBgLight: "#EEF2FF",
    badgeBgDark: "rgba(129, 140, 248, 0.22)",
    badgeColorLight: "#4338CA",
    badgeColorDark: "#A5B4FC",
    highlighted: true,
  },
];

const CATEGORIES = ["All", "TEMPLATES", "MESSAGING", "UTILITIES", "AI AUDIO"];

export default function FreeToolsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [openingToolId, setOpeningToolId] = useState<string | null>(null);

  const handleToolPress = async (tool: ToolItem) => {
    soundService.play("pop");
    if (openingToolId) return;

    if (!tool.builder) {
      router.push(tool.route as any);
      return;
    }

    try {
      setOpeningToolId(tool.id);
      if (tool.builder.targetTool === "web-app") {
        await openAuthenticatedWebApp();
      } else if (tool.builder.templateId) {
        await openAuthenticatedTemplate(
          tool.builder.targetTool,
          tool.builder.templateId,
        );
      } else if (
        tool.builder.targetTool === "landing-templates" ||
        tool.builder.targetTool === "telegram-conversions"
      ) {
        await openAuthenticatedTemplate(tool.builder.targetTool, "");
      }
    } catch (error) {
      console.error(`Failed to open ${tool.id}:`, error);
    } finally {
      setOpeningToolId(null);
    }
  };

  const filteredTools = ALL_10_FREE_TOOLS.filter((tool) => {
    const matchesSearch =
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tool.category && tool.category.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      selectedCategory === "All" ||
      tool.category?.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar
        title="Tools"
        showBack={false}
        showPlanBadge={true}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Title & Counter */}
        <View style={{ marginBottom: 16, gap: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text
              style={{
                fontSize: 28,
                lineHeight: 34,
                fontWeight: "700",
                letterSpacing: -0.6,
                color: colors.text,
              }}
            >
              Create something
            </Text>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : colors.surfaceSecondary,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : colors.cardBorder,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  letterSpacing: 0.2,
                  color: colors.textSecondary,
                }}
              >
                {filteredTools.length} {filteredTools.length === 1 ? "tool" : "tools"}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 13.5, lineHeight: 18, color: colors.textSecondary }}>
            Simple high-impact utilities and builders for your next idea.
          </Text>
        </View>

        {/* Apple-style Themed Search Bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            height: 44,
            borderRadius: 14,
            backgroundColor: isDark ? "#1C1A25" : "#FFFFFF",
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : colors.cardBorder,
            marginBottom: 14,
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isDark ? 0.2 : 0.04,
            shadowRadius: 3,
            elevation: 1,
          }}
        >
          <HugeiconsIcon
            icon={Search01Icon}
            size={18}
            color={colors.textSecondary}
            strokeWidth={1.8}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search tools, templates, utilities..."
            placeholderTextColor={colors.inputPlaceholder}
            style={{
              flex: 1,
              marginLeft: 10,
              fontSize: 13.5,
              color: colors.text,
              paddingVertical: 0,
            }}
            returnKeyType="search"
            clearButtonMode="never"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => {
                soundService.play("click");
                setSearchQuery("");
              }}
              hitSlop={8}
              style={{
                padding: 4,
                borderRadius: 10,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)",
              }}
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                size={14}
                color={colors.textSecondary}
                strokeWidth={2}
              />
            </Pressable>
          )}
        </View>

        {/* Category Pills (Themed Apple-style Filter) */}
        <View style={{ marginBottom: 16 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 1, gap: 8 }}
          >
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => {
                    soundService.play("click");
                    setSelectedCategory(cat);
                  }}
                  style={{
                    height: 36,
                    paddingHorizontal: 14,
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: 18,
                    backgroundColor: isActive
                      ? colors.primary
                      : isDark
                      ? "#1C1A25"
                      : "#FFFFFF",
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: isActive
                      ? colors.primary
                      : isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : colors.cardBorder,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: isActive ? "700" : "500",
                      letterSpacing: -0.1,
                      color: isActive ? colors.primaryForeground : colors.textSecondary,
                    }}
                  >
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Tools 2-Column Clean Grid */}
        {filteredTools.length > 0 ? (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
              rowGap: 12,
            }}
          >
            {filteredTools.map((tool) => (
              <ToolCard
                key={tool.id}
                title={tool.title}
                category={tool.category}
                description={tool.description}
                icon={tool.icon}
                image={tool.image}
                badge={tool.badge}
                iconBg={isDark ? tool.iconBgDark : tool.iconBgLight}
                iconColor={isDark ? tool.iconColorDark : tool.iconColorLight}
                badgeBg={
                  isDark
                    ? (tool.badgeBgDark || "rgba(255, 255, 255, 0.08)")
                    : (tool.badgeBgLight || colors.accentSoft)
                }
                badgeColor={
                  isDark
                    ? (tool.badgeColorDark || tool.iconColorDark)
                    : (tool.badgeColorLight || tool.iconColorLight)
                }
                style={[
                  {
                    width: "48.2%",
                  },
                  tool.highlighted && {
                    backgroundColor: isDark ? "#13212E" : "#F4FAFF",
                    borderColor: isDark
                      ? "rgba(56, 189, 248, 0.34)"
                      : "rgba(2, 132, 199, 0.26)",
                    borderWidth: 1.25,
                    shadowColor: isDark ? "#38BDF8" : "#0284C7",
                    shadowOpacity: isDark ? 0.16 : 0.08,
                    shadowRadius: 8,
                  },
                ]}
                onPress={() => void handleToolPress(tool)}
              />
            ))}
          </View>
        ) : (
          /* Themed Empty State */
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 48,
              paddingHorizontal: 24,
              borderRadius: 20,
              backgroundColor: isDark ? "#1C1A25" : "#FFFFFF",
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : colors.cardBorder,
              marginTop: 8,
              gap: 12,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : colors.accentSoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <HugeiconsIcon
                icon={Search01Icon}
                size={24}
                color={colors.textSecondary}
                strokeWidth={1.8}
              />
            </View>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: colors.text,
                textAlign: "center",
              }}
            >
              No tools found
            </Text>
            <Text
              style={{
                fontSize: 12.5,
                lineHeight: 18,
                color: colors.textSecondary,
                textAlign: "center",
                maxWidth: 240,
              }}
            >
              We couldn't find any tools matching "{searchQuery}".
            </Text>
            <Pressable
              onPress={() => {
                soundService.play("click");
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              style={{
                marginTop: 6,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: colors.primary,
              }}
            >
              <Text
                style={{
                  fontSize: 12.5,
                  fontWeight: "700",
                  color: colors.primaryForeground,
                }}
              >
                Reset Filters
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}
