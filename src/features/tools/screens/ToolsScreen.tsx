import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiClient } from "../../../core/api/client";

export const ToolsScreen: React.FC = () => {
  const router = useRouter();
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
    <SafeAreaView className="flex-1 bg-[#0B0D10]">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-32"
      >
        <View className="mt-2 mb-5">
          <Text className="text-2xl font-extrabold text-white">Free Tools & Builders</Text>
          <Text className="text-[13px] text-slate-400 mt-0.5">
            Utility Suite & Visual Drag-and-Drop Builders
          </Text>
        </View>

        {/* Native Tools */}
        <Text className="text-[15px] font-bold text-white mb-3">Native Free Tools</Text>
        <View className="flex-row flex-wrap justify-between mb-4">
          {nativeTools.map((tool) => (
            <Pressable
              key={tool.route}
              className="w-[48%] rounded-2xl p-3.5 mb-3 bg-[#181A1F] border border-[#262930] active:opacity-80"
              onPress={() => router.push(tool.route as any)}
            >
              <Text className="text-2xl mb-2">{tool.icon}</Text>
              <Text className="text-sm font-bold text-white mb-1">{tool.title}</Text>
              <Text className="text-[11px] leading-[15px] text-slate-400" numberOfLines={2}>
                {tool.desc}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Secure Webview Builders */}
        <Text className="text-[15px] font-bold text-white mb-3">
          Visual Web Builders (Single-Sign-On)
        </Text>
        <View className="mb-4">
          {webviewBuilders.map((builder) => (
            <Pressable
              key={builder.id}
              className="flex-row items-center rounded-2xl p-4 mb-2.5 bg-[#181A1F] border border-[#262930] active:opacity-80"
              disabled={openingTool === builder.id}
              onPress={() => handleOpenBuilder(builder.id)}
            >
              <Text className="text-2xl mr-3.5">{builder.icon}</Text>
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-white">{builder.title}</Text>
                <Text className="text-xs text-slate-400 mt-0.5">{builder.desc}</Text>
              </View>
              {openingTool === builder.id ? (
                <ActivityIndicator size="small" color="#0084FF" />
              ) : (
                <Text className="text-[#0084FF] font-bold text-[13px]">Launch ↗</Text>
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
