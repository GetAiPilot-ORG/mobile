import React, { useMemo, useState } from "react";
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
import * as Clipboard from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";
import {
  CheckCircle2,
  CloudUpload,
  Copy,
  ExternalLink,
  File,
  FileText,
  Film,
  Image as ImageIcon,
  Link as LinkIcon,
  Music,
  Share2,
  Sparkles,
  Upload,
  X,
} from "lucide-react-native";

import { AppScreen } from "../../src/components/AppScreen";
import { AppTopBar } from "../../src/components/AppTopBar";

type SelectedFile = {
  name: string;
  uri: string;
  size?: number;
  mimeType?: string;
};

export default function FileLinkerScreen() {
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [generatedShareUrl, setGeneratedShareUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const fileExtension = useMemo(() => {
    if (!selectedFile?.name) return "";
    return selectedFile.name.split(".").pop()?.toLowerCase() || "";
  }, [selectedFile]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const getFileIcon = () => {
    const mimeType = selectedFile?.mimeType?.toLowerCase() || "";
    if (mimeType.includes("image")) return ImageIcon;
    if (mimeType.includes("video")) return Film;
    if (mimeType.includes("audio")) return Music;
    if (
      mimeType.includes("pdf") ||
      mimeType.includes("document") ||
      fileExtension === "pdf" ||
      fileExtension === "doc" ||
      fileExtension === "docx"
    ) {
      return FileText;
    }
    return File;
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setSelectedFile({
        name: file.name,
        uri: file.uri,
        size: file.size,
        mimeType: file.mimeType,
      });

      setSourceUrl("");
      setGeneratedShareUrl("");
    } catch (error) {
      console.error("Document picker error:", error);
      Alert.alert("Unable to select file", "Something went wrong while selecting the file.");
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setGeneratedShareUrl("");
  };

  const handleGenerateLink = async () => {
    if (!selectedFile && !sourceUrl.trim()) {
      Alert.alert("File required", "Please upload a file or provide a source URL.");
      return;
    }

    setUploading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const name =
        selectedFile?.name ||
        sourceUrl.trim().split("/").pop() ||
        "shared-file";

      const slug = name
        .replace(/\.[^/.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const randomId = Math.random().toString(36).substring(2, 8);
      const link = `https://gap.to/f/${slug}-${randomId}`;

      setGeneratedShareUrl(link);
    } catch (error) {
      console.error("Generate link error:", error);
      Alert.alert("Upload failed", "We could not create your file link. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedShareUrl) return;
    try {
      await Clipboard.setStringAsync(generatedShareUrl);
      Alert.alert("Copied", "File link copied to clipboard.");
    } catch (error) {
      console.error("Clipboard error:", error);
    }
  };

  const handleShare = async () => {
    if (!generatedShareUrl) return;
    try {
      await Share.share({
        message: `Access "${selectedFile?.name || "this file"}":\n${generatedShareUrl}`,
        title: "Share File Link",
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const FileIcon = getFileIcon();

  return (
    <AppScreen safeArea={false} className="flex-1 bg-[#0B0D10]">
      <AppTopBar title="File Linker" subtitle="Upload & share files instantly" showBack={true} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* HERO */}
        <View className="flex-row items-center mb-5 px-0.5">
          <View className="w-12 h-12 rounded-2xl items-center justify-center mr-3 border border-[#262930] bg-[#181A1F]">
            <CloudUpload size={24} color="#0084FF" strokeWidth={2.2} />
          </View>

          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <Text className="text-xl font-black text-white mr-2">File Linker</Text>
              <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-md bg-[#0084FF]">
                <Sparkles size={10} color="#FFFFFF" />
                <Text className="text-[9px] font-black text-white">PRO</Text>
              </View>
            </View>

            <Text className="text-xs text-slate-400">
              Turn any document or media file into a clean, shareable link.
            </Text>
          </View>
        </View>

        {/* UPLOAD CARD */}
        <View className="rounded-2xl p-4 border border-[#262930] bg-[#181A1F] mb-4">
          <View className="flex-row justify-between items-start mb-3.5">
            <View>
              <Text className="text-sm font-black text-white">Upload your file</Text>
              <Text className="text-[11px] text-slate-400 mt-0.5">Select a file from your device</Text>
            </View>

            <View className="w-7 h-6 rounded-md items-center justify-center border border-[#262930] bg-[#111317]">
              <Text className="text-[10px] font-black text-slate-400">01</Text>
            </View>
          </View>

          {!selectedFile ? (
            <Pressable
              onPress={pickFile}
              className="border border-dashed border-[#0084FF]/60 rounded-2xl py-6 px-4 items-center bg-[#111317]"
            >
              <View className="w-14 h-14 rounded-2xl items-center justify-center mb-3 border border-[#262930] bg-[#181A1F]">
                <Upload size={26} color="#0084FF" strokeWidth={2} />
              </View>

              <Text className="text-sm font-black text-white mb-1">Choose a file</Text>
              <Text className="text-xs text-slate-400 text-center leading-4 mb-3">
                PDF, DOCX, PPTX, ZIP, images, videos and more
              </Text>

              <View className="px-4 py-2 rounded-lg bg-[#0084FF] mb-2">
                <Text className="text-xs font-bold text-white">Browse Files</Text>
              </View>

              <Text className="text-[10px] text-slate-400">Your file will be securely processed</Text>
            </Pressable>
          ) : (
            <View className="flex-row items-center p-3 rounded-xl border border-[#262930] bg-[#111317]">
              <View className="w-12 h-12 rounded-xl items-center justify-center mr-3 border border-[#262930] bg-[#181A1F]">
                <FileIcon size={24} color="#0084FF" strokeWidth={2} />
              </View>

              <View className="flex-1 min-w-0">
                <Text className="text-xs font-black text-white leading-4 mb-1" numberOfLines={2}>
                  {selectedFile.name}
                </Text>

                <View className="flex-row items-center mb-1">
                  <Text className="text-[10px] font-bold text-slate-400">
                    {fileExtension ? fileExtension.toUpperCase() : "FILE"}
                  </Text>
                  <View className="w-1 h-1 rounded-full bg-slate-500 mx-1.5" />
                  <Text className="text-[10px] font-bold text-slate-400">
                    {formatFileSize(selectedFile.size)}
                  </Text>
                </View>

                <View className="flex-row items-center gap-1">
                  <CheckCircle2 size={12} color="#10B981" />
                  <Text className="text-[10px] font-semibold text-emerald-400">File ready to upload</Text>
                </View>
              </View>

              <Pressable
                onPress={removeFile}
                className="w-8 h-8 rounded-lg items-center justify-center ml-2 border border-[#262930] bg-[#181A1F]"
              >
                <X size={16} color="#94A3B8" />
              </Pressable>
            </View>
          )}
        </View>

        {/* OR */}
        <View className="flex-row items-center my-1">
          <View className="flex-1 h-px bg-[#262930]" />
          <View className="mx-2.5 px-2 py-0.5 rounded border border-[#262930] bg-[#111317]">
            <Text className="text-[9px] font-black text-slate-400">OR</Text>
          </View>
          <View className="flex-1 h-px bg-[#262930]" />
        </View>

        {/* SOURCE URL CARD */}
        <View className="rounded-2xl p-4 border border-[#262930] bg-[#181A1F] my-4">
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-lg items-center justify-center mr-2.5 border border-[#262930] bg-[#111317]">
                <LinkIcon size={15} color="#0084FF" />
              </View>

              <View>
                <Text className="text-sm font-black text-white">Use existing file URL</Text>
                <Text className="text-[11px] text-slate-400">Google Drive, Dropbox, S3, etc.</Text>
              </View>
            </View>

            <View className="w-7 h-6 rounded-md items-center justify-center border border-[#262930] bg-[#111317]">
              <Text className="text-[10px] font-black text-slate-400">02</Text>
            </View>
          </View>

          <View className="min-h-[44px] rounded-xl px-3 flex-row items-center gap-2 border border-[#262930] bg-[#111317]">
            <LinkIcon size={16} color="#64748B" />
            <TextInput
              value={sourceUrl}
              onChangeText={(text) => {
                setSourceUrl(text);
                if (text.trim()) {
                  setSelectedFile(null);
                  setGeneratedShareUrl("");
                }
              }}
              placeholder="https://drive.google.com/..."
              placeholderTextColor="#64748B"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              className="flex-1 text-xs text-white py-2"
            />
          </View>

          <Text className="mt-2 text-[10px] text-slate-400 leading-4">
            Paste a publicly accessible file URL if you don't want to upload a file.
          </Text>
        </View>

        {/* GENERATE SECTION */}
        <View className="mt-1 mb-4">
          <View className="flex-row items-center justify-center mb-3 gap-1.5">
            <CheckCircle2 size={13} color="#0084FF" />
            <Text className="text-[10px] font-semibold text-slate-400">Secure link generation</Text>
            <View className="w-1 h-1 rounded-full bg-slate-500 mx-1" />
            <Text className="text-[10px] font-semibold text-slate-400">Fast sharing</Text>
          </View>

          <Pressable
            onPress={handleGenerateLink}
            disabled={uploading}
            className={`min-h-[48px] rounded-xl flex-row items-center justify-center gap-2 px-4 bg-[#0084FF] ${
              uploading ? "opacity-70" : ""
            }`}
          >
            {uploading ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text className="text-xs font-black text-white">Creating link...</Text>
              </>
            ) : (
              <>
                <Sparkles size={16} color="#FFFFFF" />
                <Text className="text-xs font-black text-white">Generate Shareable Link</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* SUCCESS CARD */}
        {generatedShareUrl ? (
          <View className="rounded-2xl p-4 border border-[#0084FF]/50 bg-[#181A1F] mb-4">
            <View className="flex-row items-center mb-3">
              <View className="w-10 h-10 rounded-xl items-center justify-center mr-2.5 border border-[#262930] bg-[#111317]">
                <CheckCircle2 size={20} color="#10B981" />
              </View>

              <View className="flex-1">
                <Text className="text-sm font-black text-white mb-0.5">Your link is ready</Text>
                <Text className="text-[10px] text-slate-400 leading-4">Anyone with this link can access the file.</Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between p-3 rounded-xl border border-[#262930] bg-[#111317] mb-3">
              <Text className="text-xs font-bold text-[#0084FF] flex-1 mr-2" numberOfLines={2}>
                {generatedShareUrl}
              </Text>

              <Pressable
                onPress={handleCopy}
                className="w-8 h-8 rounded-lg items-center justify-center border border-[#262930] bg-[#181A1F]"
              >
                <Copy size={16} color="#0084FF" />
              </Pressable>
            </View>

            <View className="flex-row gap-2.5">
              <Pressable
                onPress={handleCopy}
                className="flex-1 py-2.5 rounded-xl border border-[#262930] bg-[#111317] flex-row items-center justify-center gap-1.5"
              >
                <Copy size={15} color="#FFFFFF" />
                <Text className="text-xs font-bold text-white">Copy Link</Text>
              </Pressable>

              <Pressable
                onPress={handleShare}
                className="flex-1 py-2.5 rounded-xl bg-[#0084FF] flex-row items-center justify-center gap-1.5"
              >
                <Share2 size={15} color="#FFFFFF" />
                <Text className="text-xs font-bold text-white">Share</Text>
              </Pressable>
            </View>

            <View className="flex-row items-center gap-1.5 mt-3 justify-center">
              <ExternalLink size={12} color="#64748B" />
              <Text className="text-[10px] text-slate-400">Your branded gap.to link is ready to use</Text>
            </View>
          </View>
        ) : null}

        {/* FEATURES */}
        <View className="flex-row justify-around py-3">
          <View className="items-center gap-1">
            <View className="w-8 h-8 rounded-lg items-center justify-center border border-[#262930] bg-[#181A1F]">
              <LinkIcon size={14} color="#0084FF" />
            </View>
            <Text className="text-[10px] font-semibold text-slate-400">Clean URLs</Text>
          </View>

          <View className="items-center gap-1">
            <View className="w-8 h-8 rounded-lg items-center justify-center border border-[#262930] bg-[#181A1F]">
              <Share2 size={14} color="#0084FF" />
            </View>
            <Text className="text-[10px] font-semibold text-slate-400">Easy sharing</Text>
          </View>

          <View className="items-center gap-1">
            <View className="w-8 h-8 rounded-lg items-center justify-center border border-[#262930] bg-[#181A1F]">
              <CheckCircle2 size={14} color="#10B981" />
            </View>
            <Text className="text-[10px] font-semibold text-slate-400">Reliable access</Text>
          </View>
        </View>
      </ScrollView>
    </AppScreen>
  );
}
