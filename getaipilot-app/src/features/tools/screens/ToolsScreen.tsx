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
import { Ionicons } from '@expo/vector-icons';

export const ToolsScreen: React.FC = () => {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [openingTool, setOpeningTool] = useState<string | null>(null);

  const nativeTools: Array<{
    title: string;
    route: string;
    icon: keyof typeof Ionicons.glyphMap;
    desc: string;
  }> = [
    {
      title: "QR Code Generator",
      route: "/tools/qr-code",
      icon: "qr-code-outline",
      desc: "Create custom styled QR codes",
    },
    {
      title: "Link Shortener",
      route: "/tools/link-shortener",
      icon: "link-outline",
      desc: "Short links with click tracking",
    },
    {
      title: "WhatsApp Direct Link",
      route: "/tools/whatsapp-link",
      icon: "logo-whatsapp",
      desc: "Instant chat links with prefilled text",
    },
    {
      title: "UPI Payment Link",
      route: "/tools/payment-link",
      icon: "card-outline",
      desc: "One-click UPI payment links",
    },
    {
      title: "File Cloud Linker",
      route: "/tools/file-linker",
      icon: "document-text-outline",
      desc: "Share documents & media files",
    },
    {
      title: "Event Calendar Links",
      route: "/tools/event-links",
      icon: "calendar-outline",
      desc: "Add-to-calendar event URLs",
    },
    {
      title: "AI Speech-to-Text",
      route: "/tools/speech-to-text",
      icon: "mic-outline",
      desc: "Transcribe voice memos to text",
    },
    {
      title: "Website SEO Audit",
      route: "/tools/website-audit",
      icon: "speedometer-outline",
      desc: "Performance and metadata checks",
    },
    {
      title: "QuickForms Creator",
      route: "/tools/quick-forms",
      icon: "reader-outline",
      desc: "Dynamic lead generation forms",
    },
  ];

  const webviewBuilders: Array<{
    id: string;
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    desc: string;
  }> = [
    {
      id: "landing-templates",
      title: "Landing Page Builder",
      icon: "globe-outline",
      desc: "Visual landing page designer",
    },
    {
      id: "bio-builder",
      title: "Link-in-Bio Builder",
      icon: "person-outline",
      desc: "Mobile-first social bio link canvas",
    },
    {
      id: "flow-builder",
      title: "Automation Flow Builder",
      icon: "git-network-outline",
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? "#020617" : "#F5F3FB" }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDark ? "#F5F3FB" : "#0f172a" }]}>Free Tools & Builders</Text>
          <Text style={[styles.subtitle, { color: isDark ? "#777383" : "#64748b" }]}>
            Utility Suite & Visual Drag-and-Drop Builders
          </Text>
        </View>

        {/* Native Tools */}
        <Text style={[styles.sectionTitle, { color: isDark ? "#cbd5e1" : "#475569" }]}>Native Free Tools</Text>
        <View style={styles.grid}>
          {nativeTools.map((tool) => (
            <Pressable cssInterop={false}
              key={tool.route}
              style={({ pressed }) => [
                styles.card,
                isDark ? styles.cardDark : styles.cardLight,
                pressed && styles.cardPressed,
              ]}
              onPress={() => router.push(tool.route as any)}
            >
              <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF' }]}>
                <Ionicons name={tool.icon} size={20} color="#6366f1" />
              </View>
              <Text style={[styles.toolTitle, { color: isDark ? "#F5F3FB" : "#0f172a" }]}>{tool.title}</Text>
              <Text style={[styles.toolDesc, { color: isDark ? "#777383" : "#64748b" }]} numberOfLines={2}>
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
            <Pressable cssInterop={false}
              key={builder.id}
              style={({ pressed }) => [
                styles.builderCard,
                isDark ? styles.builderCardDark : styles.builderCardLight,
                pressed && styles.cardPressed,
              ]}
              disabled={openingTool === builder.id}
              onPress={() => handleOpenBuilder(builder.id)}
            >
              <View style={[styles.builderIconBox, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF' }]}>
                <Ionicons name={builder.icon} size={22} color="#6366f1" />
              </View>
              <View style={styles.builderInfo}>
                <Text style={[styles.builderTitle, { color: isDark ? "#F5F3FB" : "#0f172a" }]}>{builder.title}</Text>
                <Text style={[styles.builderDesc, { color: isDark ? "#777383" : "#64748b" }]}>{builder.desc}</Text>
              </View>
              {openingTool === builder.id ? (
                <ActivityIndicator size="small" color="#6366f1" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.builderAction}>Launch</Text>
                  <Ionicons name="open-outline" size={14} color="#818cf8" />
                </View>
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
    borderRadius: 24,
    padding: 14,
    marginBottom: 12,
    borderWidth: 0,
  },
  cardDark: {
    backgroundColor: "#0f172a",
    borderColor: "#1e293b",
  },
  cardLight: {
    backgroundColor: "#ffffff",
    borderColor: "#E9E6F2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardPressed: { opacity: 0.8 },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  builderIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
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
    borderRadius: 24,
    padding: 16,
    marginBottom: 10,
    borderWidth: 0,
  },
  builderCardDark: {
    backgroundColor: "#0f172a",
    borderColor: "#1e293b",
  },
  builderCardLight: {
    backgroundColor: "#ffffff",
    borderColor: "#E9E6F2",
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
