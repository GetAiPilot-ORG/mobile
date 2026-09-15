import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { AppScreen } from "../../src/components/AppScreen";
import { AppTopBar } from "../../src/components/AppTopBar";
import { SearchInput } from "../../src/components/SearchInput";
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
    category: "Templates",
    description:
      "Manage and customize your saved bio websites and campaign landing pages.",
    icon: "🎨",
    badge: "Canvas",
    route: "/tools/my-designs",
  },
  {
    id: "bio-templates",
    title: "Bio Templates",
    category: "Templates",
    description:
      "Pick mobile bio site themes optimized for creators, agencies, and businesses.",
    icon: "🔗",
    badge: "Popular",
    route: "/tools/bio-templates",
  },
  {
    id: "landing-templates",
    title: "Landing Templates",
    category: "Templates",
    description:
      "Pre-built high-converting lead capture funnels and product waitlist pages.",
    icon: "🚀",
    badge: "Ready",
    route: "/tools/landing-templates",
    builder: {
      targetTool: "landing-templates",
    },
  },
  {
    id: "quick-forms",
    title: "QuickForms",
    category: "Utilities",
    description:
      "Embeddable survey forms and customer consultation intake funnels.",
    icon: "📝",
    badge: "CRM Sync",
    route: "/tools/quick-forms",
  },
  {
    id: "wa-link",
    title: "WhatsApp Link",
    category: "Messaging",
    description:
      "Direct click-to-chat links with custom prefilled messages & QR codes.",
    icon: "💬",
    badge: "Popular",
    route: "/tools/whatsapp-link",
  },
  {
    id: "shortener",
    title: "Link Shortener",
    category: "Utilities",
    description:
      "Shorten long URLs into branded links with real-time click tracking.",
    icon: "⚡",
    badge: "Fast",
    route: "/tools/link-shortener",
  },
  {
    id: "file-linker",
    title: "File Linker",
    category: "Utilities",
    description:
      "Generate trackable public direct download links for PDFs and media assets.",
    icon: "📁",
    badge: "Cloud",
    route: "/tools/file-linker",
  },
  {
    id: "event-links",
    title: "Event Links",
    category: "Utilities",
    description:
      "1-click calendar invites for Google Calendar, Apple iCal, and webinars.",
    icon: "📅",
    badge: "Calendar",
    route: "/tools/event-links",
  },
  {
    id: "speech-to-text",
    title: "AI Speech to Text",
    category: "AI Audio",
    description:
      "Transcribe customer voice notes, audio meetings, and voice memos to text.",
    icon: "🎙️",
    badge: "AI Powered",
    route: "/tools/speech-to-text",
  },
  {
    id: "qr-gen",
    title: "QR Generator",
    category: "Utilities",
    description:
      "High-resolution custom QR codes for websites, text, and Wi-Fi credentials.",
    icon: "📱",
    badge: "Free",
    route: "/tools/qr-code",
  },
];

const CATEGORIES = ["All", "Templates", "Messaging", "Utilities", "AI Audio"];

export default function FreeToolsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
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
      selectedCategory === "All" || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppScreen safeArea={false}>
      <AppTopBar
        title="Free Tools Hub"
        subtitle="Complete Utility Inventory (10 Tools)"
        showBack={false}
      />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View
          className={`rounded-2xl p-4.5 mb-4 border ${
            isDark
              ? "bg-[#181A1F] border-[#262930]"
              : "bg-sky-600 border-sky-600 shadow-md"
          }`}
        >
          <Text className="text-lg font-black text-white">Production Utilities</Text>
          <Text
            className={`text-xs mt-1 leading-4.5 ${
              isDark ? "text-slate-400" : "text-white/85"
            }`}
          >
            Zero-cost growth tools powered by GetAIPilot infrastructure. No credit card required.
          </Text>
        </View>

        {/* Search Bar */}
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search all 10 tools..."
        />

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row mb-4"
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              className={`px-3.5 py-1.5 rounded-full mr-2 border ${
                selectedCategory === cat
                  ? "bg-[#0284C7] border-[#0284C7]"
                  : isDark
                  ? "bg-[#181A1F] border-[#262930]"
                  : "bg-white border-gray-200"
              }`}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                className={`text-xs font-bold ${
                  selectedCategory === cat
                    ? "text-white"
                    : isDark
                    ? "text-slate-400"
                    : "text-slate-600"
                }`}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Tools Grid */}
        <View className="mt-1">
          {filteredTools.map((tool) => (
            <ToolCard
              key={tool.id}
              title={tool.title}
              category={tool.category}
              description={tool.description}
              icon={tool.icon}
              badge={tool.badge}
              onPress={() => void handleToolPress(tool)}
            />
          ))}
        </View>
      </ScrollView>
    </AppScreen>
  );
}
