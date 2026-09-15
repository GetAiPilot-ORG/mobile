import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppScreen } from "../../src/components/AppScreen";
import { AppTopBar } from "../../src/components/AppTopBar";
import {
  openAuthenticatedDashboard,
  openAuthenticatedTemplate,
} from "../../src/lib/template-deep-link";

interface LandingTemplate {
  id: string;
  name: string;
  category:
    | "Business"
    | "Crypto"
    | "Real Estate"
    | "Fitness"
    | "E-Commerce"
    | "Travel";
  conversionRate: string;
  color: string;
  desc: string;
  tags: string[];
}

const CATEGORIES = [
  "All",
  "Business",
  "Crypto",
  "Real Estate",
  "Fitness",
  "E-Commerce",
  "Travel",
] as const;

const LANDING_TEMPLATES_CATALOG: LandingTemplate[] = [
  {
    id: "axnix-saas",
    name: "Axnix SaaS & AI Suite",
    category: "Business",
    conversionRate: "26.4%",
    color: "#0084FF",
    desc: "High-converting dark modern SaaS hero with live metric counters & pricing toggle.",
    tags: ["AI Engine", "Waitlist", "SaaS"],
  },
  {
    id: "threadly-fashion",
    name: "Threadly Apparel & Brand",
    category: "E-Commerce",
    conversionRate: "22.8%",
    color: "#EC4899",
    desc: "Minimalist boutique clothing showcase with lookbook carousel and instant WhatsApp checkout.",
    tags: ["E-Commerce", "Lookbook", "Store"],
  },
  {
    id: "bull-run-crypto",
    name: "Bull Run Crypto & Options",
    category: "Crypto",
    conversionRate: "31.2%",
    color: "#0284C7",
    desc: "Telegram VIP channel lead capture funnel for crypto trading signals and market alpha.",
    tags: ["Trading", "Telegram", "VIP Signals"],
  },
  {
    id: "dark-luxury-estates",
    name: "Aura Luxury Real Estate",
    category: "Real Estate",
    conversionRate: "19.5%",
    color: "#D97706",
    desc: "Premium gold & onyx architectural portfolio with property walkthrough request forms.",
    tags: ["Villas", "Brochures", "Luxury"],
  },
  {
    id: "pulse-forge-gym",
    name: "Pulse Forge Fitness & Gym",
    category: "Fitness",
    conversionRate: "28.0%",
    color: "#DC2626",
    desc: "High-energy transformation showcase with membership tier selection and free trial booking.",
    tags: ["Gym", "Free Pass", "Coaching"],
  },
  {
    id: "omni-resort-travel",
    name: "Omni Luxury Resort & Escape",
    category: "Travel",
    conversionRate: "24.7%",
    color: "#10B981",
    desc: "Scenic getaway booking lander with seasonal discounts, photo galleries and reviews.",
    tags: ["Resort", "Booking", "Vacation"],
  },
];

export default function LandingTemplatesScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [openingTemplateId, setOpeningTemplateId] = useState<string | null>(null);

  const filtered = LANDING_TEMPLATES_CATALOG.filter((item) => {
    const matchesCat =
      selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.desc.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleOpenCanvas = async (item: LandingTemplate) => {
    try {
      setOpeningTemplateId(item.id);
      await openAuthenticatedTemplate("landing-templates", item.id);
    } catch (error) {
      console.error("Failed to open authenticated landing template:", error);
    } finally {
      setOpeningTemplateId(null);
    }
  };

  const handleOpenLandingDashboard = async () => {
    try {
      await openAuthenticatedDashboard("landing-dashboard");
    } catch (error) {
      console.error("Failed to open landing dashboard:", error);
      Alert.alert("Unable to open dashboard", "Please check your connection and try again.");
    }
  };

  const handleDeploy = (item: LandingTemplate) => {
    Alert.alert(
      "Deploy Landing Page",
      `Deploying ${item.name}. Would you like to launch the visual editor or copy the share link?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Share Link 🔗",
          onPress: () => {
            Share.share({
              message: `Check out our landing page template: https://getaipilot.in/lp/${item.id}`,
            });
          },
        },
        {
          text: "Open in Canvas 🚀",
          onPress: () => {
            void handleOpenCanvas(item);
          },
        },
      ],
    );
  };

  return (
    <AppScreen safeArea={false} className="flex-1 bg-[#0B0D10]">
      <AppTopBar
        title="Landing Templates"
        subtitle="100+ Category Layouts"
        showBack={true}
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-xs text-slate-400">Pick a template to build or edit:</Text>
          <Pressable
            className="bg-[#0084FF] px-3 py-1.5 rounded-lg"
            onPress={handleOpenLandingDashboard}
          >
            <Text className="text-white text-xs font-bold">Web Dashboard ↗</Text>
          </Pressable>
        </View>

        {/* Search */}
        <TextInput
          className="rounded-xl border border-[#262930] bg-[#181A1F] px-3.5 py-2.5 text-xs text-white mb-3"
          placeholder="🔍 Search templates (SaaS, Crypto, Gym, Real Estate)..."
          placeholderTextColor="#64748B"
          value={search}
          onChangeText={setSearch}
        />

        {/* Category horizontal scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-3"
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              className={`px-3.5 py-2 rounded-xl border mr-2 ${
                selectedCategory === cat ? 'bg-[#0084FF] border-[#0084FF]' : 'bg-[#181A1F] border-[#262930]'
              }`}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                className={`text-xs font-bold ${
                  selectedCategory === cat ? 'text-white' : 'text-slate-400'
                }`}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text className="text-xs text-slate-400 mb-3 font-semibold">
          Showing {filtered.length} high-converting template{filtered.length !== 1 ? "s" : ""}
        </Text>

        <View className="gap-3.5">
          {filtered.map((item) => (
            <View key={item.id} className="rounded-2xl border border-[#262930] bg-[#181A1F] overflow-hidden">
              <View style={{ height: 4, width: "100%", backgroundColor: item.color }} />
              <View className="p-4">
                <View className="flex-row justify-between items-center mb-1.5">
                  <Text className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {item.category.toUpperCase()}
                  </Text>
                  <View className="bg-emerald-500/15 px-2 py-0.5 rounded-md">
                    <Text className="text-[10px] font-bold text-emerald-400">
                      Avg CVR: {item.conversionRate}
                    </Text>
                  </View>
                </View>

                <Text className="text-base font-black text-white">{item.name}</Text>
                <Text className="text-xs text-slate-400 mt-1 leading-4">{item.desc}</Text>

                <View className="flex-row flex-wrap gap-1.5 my-3">
                  {item.tags.map((t) => (
                    <View key={t} className="bg-[#111317] border border-[#262930] px-2 py-0.5 rounded-md">
                      <Text className="text-[10px] font-semibold text-slate-400">#{t}</Text>
                    </View>
                  ))}
                </View>

                <Pressable
                  className="py-2.5 rounded-xl items-center"
                  style={{ backgroundColor: item.color }}
                  onPress={() => handleDeploy(item)}
                  disabled={openingTemplateId === item.id}
                >
                  {openingTemplateId === item.id ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-white text-xs font-extrabold">Deploy Template →</Text>
                  )}
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </AppScreen>
  );
}
