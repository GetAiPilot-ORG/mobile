import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, getColors } from "../../src/theme";
import { AppScreen } from "../../src/components/AppScreen";
import { AppTopBar } from "../../src/components/AppTopBar";
import { ToolCard } from "../../src/components/ToolCard";
import {
  openAuthenticatedTemplate,
  openAuthenticatedWebApp,
} from "../../src/lib/template-deep-link";

interface ToolItem {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: string;
  iconBg: string;
  badge: string;
  route: string;
  builder?: {
    targetTool: "landing-templates" | "bio-builder" | "web-app";
    templateId?: string;
  };
}

const ALL_10_FREE_TOOLS: ToolItem[] = [
  {
    id: "my-designs",
    title: "My Designs",
    category: "TEMPLATES",
    description:
      "Manage and customize your saved bio websites and campaign landing pages.",
    icon: "color-palette",
    iconBg: "#EC4899",
    badge: "CANVAS",
    route: "/tools/my-designs",
  },
  {
    id: "bio-templates",
    title: "Bio Templates",
    category: "TEMPLATES",
    description:
      "Pick mobile bio site themes optimized for creators, agencies, and businesses.",
    icon: "phone-portrait",
    iconBg: "#8B5CF6",
    badge: "POPULAR",
    route: "/tools/bio-templates",
  },
  {
    id: "landing-templates",
    title: "Landing Templates",
    category: "TEMPLATES",
    description:
      "Pre-built high-converting lead capture funnels and product waitlist pages.",
    icon: "rocket",
    iconBg: "#6366F1",
    badge: "READY",
    route: "/tools/landing-templates",
    builder: {
      targetTool: "landing-templates",
    },
  },
  {
    id: "quick-forms",
    title: "QuickForms",
    category: "UTILITIES",
    description:
      "Embeddable survey forms and customer consultation intake funnels.",
    icon: "document-text",
    iconBg: "#10B981",
    badge: "FREE",
    route: "/tools/quick-forms",
  },
  {
    id: "wa-link",
    title: "WhatsApp Link",
    category: "MESSAGING",
    description:
      "Direct click-to-chat links with custom prefilled messages & QR codes.",
    icon: "logo-whatsapp",
    iconBg: "#25D366",
    badge: "POPULAR",
    route: "/tools/whatsapp-link",
  },
  {
    id: "shortener",
    title: "Link Shortener",
    category: "UTILITIES",
    description:
      "Shorten long URLs into branded links with real-time click tracking.",
    icon: "link",
    iconBg: "#0284C7",
    badge: "FAST",
    route: "/tools/link-shortener",
  },
  {
    id: "file-linker",
    title: "File Linker",
    category: "UTILITIES",
    description:
      "Generate trackable public direct download links for PDFs and media assets.",
    icon: "folder",
    iconBg: "#F59E0B",
    badge: "CLOUD",
    route: "/tools/file-linker",
  },
  {
    id: "event-links",
    title: "Event Links",
    category: "UTILITIES",
    description:
      "1-click calendar invites for Google Calendar, Apple iCal, and webinars.",
    icon: "calendar",
    iconBg: "#3B82F6",
    badge: "CALENDAR",
    route: "/tools/event-links",
  },
  {
    id: "speech-to-text",
    title: "AI Speech to Text",
    category: "AI AUDIO",
    description:
      "Transcribe customer voice notes, audio meetings, and voice memos to text.",
    icon: "mic",
    iconBg: "#A855F7",
    badge: "AI POWERED",
    route: "/tools/speech-to-text",
  },
  {
    id: "qr-gen",
    title: "QR Generator",
    category: "UTILITIES",
    description:
      "High-resolution custom QR codes for websites, text, and Wi-Fi credentials.",
    icon: "qr-code",
    iconBg: "#4F46E5",
    badge: "FREE",
    route: "/tools/qr-code",
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
      } else if (tool.builder.targetTool === "landing-templates") {
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
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" ||
      tool.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <AppScreen safeArea={false}>
      <AppTopBar
        title="Free Tools Hub"
        showBack={false}
        showPlanBadge={true}
      />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View
          className="rounded-[22px] p-5 mb-4"
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: isDark ? "rgba(255, 255, 255, 0.07)" : colors.cardBorder,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.25 : 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View className="flex-row items-center gap-2 mb-2">
            <View
              className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-lg"
              style={{ backgroundColor: colors.accentSoft }}
            >
              <Ionicons name="sparkles" size={12} color={colors.primary} />
              <Text
                className="text-[10px] font-extrabold tracking-wider"
                style={{ color: colors.primary }}
              >
                10 UTILITIES
              </Text>
            </View>
          </View>
          <Text
            className="text-lg font-extrabold tracking-tight"
            style={{ color: colors.text }}
          >
            Production Utilities
          </Text>
          <Text
            className="text-[12.5px] mt-1 leading-[18px]"
            style={{ color: colors.textSecondary }}
          >
            Zero-cost growth tools powered by GetAIPilot infrastructure. No
            credit card required.
          </Text>
        </View>
        {/* Category Tabs (Folder Style matching inbox status tabs) */}
        <View style={{ position: "relative", marginVertical: 16 }}>
          {/* Continuous baseline */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 1.5,
              backgroundColor: colors.primary,
            }}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 2 }}
          >
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={{
                    height: 38,
                    paddingHorizontal: 14,
                    justifyContent: "center",
                    alignItems: "center",
                    borderTopLeftRadius: isActive ? 10 : 0,
                    borderTopRightRadius: isActive ? 10 : 0,
                    borderTopWidth: 1.5,
                    borderLeftWidth: 1.5,
                    borderRightWidth: 1.5,
                    borderBottomWidth: 1.5,
                    borderTopColor: isActive ? colors.primary : "transparent",
                    borderLeftColor: isActive ? colors.primary : "transparent",
                    borderRightColor: isActive ? colors.primary : "transparent",
                    borderBottomColor: isActive ? colors.background : "transparent",
                    backgroundColor: isActive ? colors.background : "transparent",
                    zIndex: isActive ? 2 : 1,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12.5,
                      fontWeight: isActive ? "700" : "500",
                      letterSpacing: -0.1,
                      color: isActive ? colors.primary : colors.textSecondary,
                    }}
                  >
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Tools Grid */}
        <View className="mt-1 ">
          {filteredTools.map((tool) => (
            <ToolCard
              key={tool.id}
              title={tool.title}
              category={tool.category}
              description={tool.description}
              icon={tool.icon}
              iconBg={tool.iconBg}
              badge={tool.badge}
              onPress={() => void handleToolPress(tool)}
            />
          ))}
        </View>
      </ScrollView>
    </AppScreen>
  );
}
