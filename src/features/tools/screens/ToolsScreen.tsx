import * as Linking from "expo-linking";
import {
  useRouter } from "expo-router";
import React,
  { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiClient } from "../../../core/api/client";
import { useTheme, getColors } from '@/theme';

export const ToolsScreen: React.FC = () => {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [openingTool, setOpeningTool] = useState<string | null>(null);

  const nativeTools = [
    {
      title: "QR Code Generator",
      route: "/tools/qr-code",
      icon: "🏁",
      desc: "Create custom styled QR codes",
    },
    {
      title: "Link Shortener",
      route: "/tools/link-shortener",
      icon: "🔗",
      desc: "Short links with click tracking",
    },
    {
      title: "WhatsApp Direct Link",
      route: "/tools/whatsapp-link",
      icon: "💬",
      desc: "Instant chat links with prefilled text",
    },
    {
      title: "UPI Payment Link",
      route: "/tools/payment-link",
      icon: "💳",
      desc: "One-click UPI payment links",
    },
    {
      title: "File Cloud Linker",
      route: "/tools/file-linker",
      icon: "📁",
      desc: "Share documents & media files",
    },
    {
      title: "Event Calendar Links",
      route: "/tools/event-links",
      icon: "📅",
      desc: "Add-to-calendar event URLs",
    },
    {
      title: "AI Speech-to-Text",
      route: "/tools/speech-to-text",
      icon: "🎙️",
      desc: "Transcribe voice memos to text",
    },
    {
      title: "Website SEO Audit",
      route: "/tools/website-audit",
      icon: "⚡",
      desc: "Performance and metadata checks",
    },
    {
      title: "QuickForms Creator",
      route: "/tools/quick-forms",
      icon: "📝",
      desc: "Dynamic lead generation forms",
    },
  ];

  const webviewBuilders = [
    {
      id: "landing-templates",
      title: "Landing Page Builder",
      icon: "🌐",
      desc: "Visual landing page designer",
    },
    {
      id: "bio-builder",
      title: "Link-in-Bio Builder",
      icon: "👤",
      desc: "Mobile-first social bio link canvas",
    },
    {
      id: "flow-builder",
      title: "Automation Flow Builder",
      icon: "⚡",
      desc: "Visual conversational bot flows",
    },
  ];

  const handleOpenBuilder = async (builderId: string) => {
    setOpeningTool(builderId);
    try {
      const response = await apiClient.post<{ targetUrl: string }>(
        "/mobile/v1/webview/session-token",
        {
          targetTool: builderId,
        },
      );
      if (response.targetUrl) {
        await Linking.openURL(response.targetUrl);
      }
    } catch (e) {
      console.warn("Failed to open builder webview", e);
    } finally {
      setOpeningTool(null);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? "#020617" : "#f8fafc" }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDark ? "#f8fafc" : "#0f172a" }]}>Free Tools & Builders</Text>
          <Text style={[styles.subtitle, { color: isDark ? "#94a3b8" : "#64748b" }]}>
            Utility Suite & Visual Drag-and-Drop Builders
          </Text>
        </View>

        {/* Native Tools */}
        <Text style={[styles.sectionTitle, { color: isDark ? "#cbd5e1" : "#475569" }]}>Native Free Tools</Text>
        <View style={styles.grid}>
          {nativeTools.map((tool) => (
            <Pressable
              key={tool.route}
              style={({ pressed }) => [
                styles.card,
                isDark ? styles.cardDark : styles.cardLight,
                pressed && styles.cardPressed,
              ]}
              onPress={() => router.push(tool.route as any)}
            >
              <Text style={styles.toolIcon}>{tool.icon}</Text>
              <Text style={[styles.toolTitle, { color: isDark ? "#f8fafc" : "#0f172a" }]}>{tool.title}</Text>
              <Text style={[styles.toolDesc, { color: isDark ? "#94a3b8" : "#64748b" }]} numberOfLines={2}>
                {tool.desc}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Secure Webview Builders */}
        <Text style={[styles.sectionTitle, { color: isDark ? "#cbd5e1" : "#475569" }]}>
          Visual Web Builders (Single-Sign-On)
        </Text>
        <View style={styles.buildersList}>
          {webviewBuilders.map((builder) => (
            <Pressable
              key={builder.id}
              style={({ pressed }) => [
                styles.builderCard,
                isDark ? styles.builderCardDark : styles.builderCardLight,
                pressed && styles.cardPressed,
              ]}
              disabled={openingTool === builder.id}
              onPress={() => handleOpenBuilder(builder.id)}
            >
              <Text style={styles.builderIcon}>{builder.icon}</Text>
              <View style={styles.builderInfo}>
                <Text style={[styles.builderTitle, { color: isDark ? "#f8fafc" : "#0f172a" }]}>{builder.title}</Text>
                <Text style={[styles.builderDesc, { color: isDark ? "#94a3b8" : "#64748b" }]}>{builder.desc}</Text>
              </View>
              {openingTool === builder.id ? (
                <ActivityIndicator size="small" color="#6366f1" />
              ) : (
                <Text style={styles.builderAction}>Launch ↗</Text>
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 130 },
  header: { marginTop: 8, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "800" },
  subtitle: { fontSize: 13, marginTop: 2 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  card: {
    width: "48%",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardDark: {
    backgroundColor: "#0f172a",
    borderColor: "#1e293b",
  },
  cardLight: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardPressed: { opacity: 0.8 },
  toolIcon: { fontSize: 24, marginBottom: 8 },
  toolTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  toolDesc: { fontSize: 11, lineHeight: 15 },
  buildersList: { marginBottom: 16 },
  builderCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  builderCardDark: {
    backgroundColor: "#0f172a",
    borderColor: "#1e293b",
  },
  builderCardLight: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  builderIcon: { fontSize: 24, marginRight: 14 },
  builderInfo: { flex: 1 },
  builderTitle: { fontSize: 15, fontWeight: "700" },
  builderDesc: { fontSize: 12, marginTop: 2 },
  builderAction: { color: "#818cf8", fontWeight: "700", fontSize: 13 },
});
