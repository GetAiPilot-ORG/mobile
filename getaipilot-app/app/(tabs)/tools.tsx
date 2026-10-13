import { useRouter } from "expo-router";
import { ComponentProps, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Calendar03Icon,
  File01Icon,
  Folder01Icon,
  Link01Icon,
  PaintBrush01Icon,
  QrCode01Icon,
  Rocket01Icon,
  SmartPhone01Icon,
  VoiceToTextIcon,
  WhatsappIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
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
  icon: ComponentProps<typeof HugeiconsIcon>["icon"];
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
    icon: PaintBrush01Icon,
    iconBg: "#F7DFE9",
    badge: "CANVAS",
    route: "/tools/my-designs",
  },
  {
    id: "bio-templates",
    title: "Bio Templates",
    category: "TEMPLATES",
    description:
      "Pick mobile bio site themes optimized for creators, agencies, and businesses.",
    icon: SmartPhone01Icon,
    iconBg: "#E7DEFA",
    badge: "POPULAR",
    route: "/tools/bio-templates",
  },
  {
    id: "landing-templates",
    title: "Landing Templates",
    category: "TEMPLATES",
    description:
      "Pre-built high-converting lead capture funnels and product waitlist pages.",
    icon: Rocket01Icon,
    iconBg: "#E7DEFA",
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
    icon: File01Icon,
    iconBg: "#D8F0F0",
    badge: "FREE",
    route: "/tools/quick-forms",
  },
  {
    id: "wa-link",
    title: "WhatsApp Link",
    category: "MESSAGING",
    description:
      "Direct click-to-chat links with custom prefilled messages & QR codes.",
    icon: WhatsappIcon,
    iconBg: "#E0F1E6",
    badge: "POPULAR",
    route: "/tools/whatsapp-link",
  },
  {
    id: "shortener",
    title: "Link Shortener",
    category: "UTILITIES",
    description:
      "Shorten long URLs into branded links with real-time click tracking.",
    icon: Link01Icon,
    iconBg: "#D8F0F0",
    badge: "FAST",
    route: "/tools/link-shortener",
  },
  {
    id: "file-linker",
    title: "File Linker",
    category: "UTILITIES",
    description:
      "Generate trackable public direct download links for PDFs and media assets.",
    icon: Folder01Icon,
    iconBg: "#F9E5D4",
    badge: "CLOUD",
    route: "/tools/file-linker",
  },
  {
    id: "event-links",
    title: "Event Links",
    category: "UTILITIES",
    description:
      "1-click calendar invites for Google Calendar, Apple iCal, and webinars.",
    icon: Calendar03Icon,
    iconBg: "#D8F0F0",
    badge: "CALENDAR",
    route: "/tools/event-links",
  },
  {
    id: "speech-to-text",
    title: "AI Speech to Text",
    category: "AI AUDIO",
    description:
      "Transcribe customer voice notes, audio meetings, and voice memos to text.",
    icon: VoiceToTextIcon,
    iconBg: "#E7DEFA",
    badge: "AI POWERED",
    route: "/tools/speech-to-text",
  },
  {
    id: "qr-gen",
    title: "QR Generator",
    category: "UTILITIES",
    description:
      "High-resolution custom QR codes for websites, text, and Wi-Fi credentials.",
    icon: QrCode01Icon,
    iconBg: "#F7DFE9",
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
        title="Tools"
        showBack={false}
        showPlanBadge={true}
      />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginBottom: 20, gap: 8 }}>
          <Text style={{ fontSize: 30, lineHeight: 38, fontWeight: "500", letterSpacing: -0.6, color: colors.text }}>Create something</Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>Simple tools for your next idea.</Text>
        </View>
        {/* Category Tabs (Folder Style matching inbox status tabs) */}
        <View style={{ position: "relative", marginVertical: 16 }}>


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
                    height: 44,
                    paddingHorizontal: 14,
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: 22,
                    marginRight: 8,
                    borderTopWidth: 0,
                    borderLeftWidth: 0,
                    borderRightWidth: 0,
                    borderBottomWidth: 0,
                    borderTopColor: isActive ? colors.primary : "transparent",
                    borderLeftColor: isActive ? colors.primary : "transparent",
                    borderRightColor: isActive ? colors.primary : "transparent",
                    borderBottomColor: isActive ? colors.background : "transparent",
                    backgroundColor: isActive ? colors.accentSoft : colors.card,
                    zIndex: isActive ? 2 : 1,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12.5,
                      fontWeight: isActive ? "700" : "500",
                      letterSpacing: -0.1,
                      color: isActive ? colors.accent : colors.textSecondary,
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
