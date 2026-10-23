import { useMemo, useState } from "react";
import { supabase } from "../../src/lib/supabase";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import * as Clipboard from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";

import {
  Check,
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
  Plus,
  Share2,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react-native";

import { AppScreen } from "../../src/components/AppScreen";
import { AppTopBar } from "../../src/components/AppTopBar";
import { useTheme, getColors } from "@/theme";

type SelectedFile = {
  name: string;
  uri: string;
  size?: number;
  mimeType?: string;
};

type GeneratedLink = {
  id: string;
  url: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: string;
};

export default function FileLinkerScreen() {
  /*
   * =========================================================
   * SYSTEM THEME
   * =========================================================
   */
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  /*
   * =========================================================
   * STATE
   * =========================================================
   */

  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [sourceUrl, setSourceUrl] = useState("");
  const [generatedLinks, setGeneratedLinks] = useState<GeneratedLink[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  /*
   * =========================================================
   * THEME
   * =========================================================
   */

  const theme = useMemo(
    () => ({
      background: colors.background,
      card: colors.card,
      surface: colors.surface,
      foreground: colors.foreground,
      mutedForeground: colors.mutedForeground,
      border: colors.border,
      primary: colors.primary,
      primaryForeground: colors.primaryForeground,

      uploadBackground: isDark ? colors.surface : colors.surface,
      inputBackground: isDark ? colors.surface : colors.surface,
      iconBackground: isDark ? colors.surface : colors.card,
      softBackground: isDark ? colors.surface : colors.surface,

      shadowOpacity: isDark ? 0.22 : 0.06,
      shadowRadius: isDark ? 10 : 12,
      overlayBorder: isDark ? "rgba(255,255,255,0.10)" : colors.border,
    }),
    [isDark],
  );

  /*
   * =========================================================
   * FILE SIZE
   * =========================================================
   */

  const formatFileSize = (bytes?: number) => {
    if (!bytes) {
      return "Unknown size";
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  /*
   * =========================================================
   * FILE ICON
   * =========================================================
   */

  const getFileIcon = (mime?: string, name?: string) => {
    const mimeType = mime?.toLowerCase() || "";
    const ext = name ? name.split(".").pop()?.toLowerCase() || "" : "";

    if (
      mimeType.includes("image") ||
      ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext)
    ) {
      return ImageIcon;
    }

    if (
      mimeType.includes("video") ||
      ["mp4", "mov", "avi", "mkv", "webm", "m4v"].includes(ext)
    ) {
      return Film;
    }

    if (
      mimeType.includes("audio") ||
      ["mp3", "wav", "m4a", "aac", "ogg", "flac"].includes(ext)
    ) {
      return Music;
    }

    if (
      mimeType.includes("pdf") ||
      mimeType.includes("document") ||
      ["pdf", "doc", "docx", "txt", "rtf", "xls", "xlsx", "ppt", "pptx", "csv"].includes(ext)
    ) {
      return FileText;
    }

    return File;
  };

  /*
   * =========================================================
   * PICK FILES (Single or Multiple)
   * =========================================================
   */

  const pickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const newFiles: SelectedFile[] = result.assets.map((file) => ({
        name: file.name,
        uri: file.uri,
        size: file.size,
        mimeType: file.mimeType,
      }));

      setSelectedFiles((prev) => {
        const existingKeys = new Set(
          prev.map((f) => `${f.name}_${f.size || 0}`)
        );
        const unique = newFiles.filter(
          (f) => !existingKeys.has(`${f.name}_${f.size || 0}`)
        );
        return [...prev, ...unique];
      });

      setSourceUrl("");
    } catch (error) {
      console.error("Document picker error:", error);
      Alert.alert(
        "Unable to select file",
        "Something went wrong while selecting the file.",
      );
    }
  };

  /*
   * =========================================================
   * REMOVE FILE
   * =========================================================
   */

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearSelectedFiles = () => {
    setSelectedFiles([]);
  };

  /*
   * =========================================================
   * GENERATE LINK(S)
   * =========================================================
   */

  const handleGenerateLink = async () => {
    if (selectedFiles.length === 0 && !sourceUrl.trim()) {
      Alert.alert(
        "File required",
        "Please select one or more files or provide a source URL.",
      );
      return;
    }

    setUploading(true);

    try {
      // ── Branch 1: Source URL provided ─────────────────────────────────
      if (selectedFiles.length === 0 && sourceUrl.trim()) {
        const trimmed = sourceUrl.trim();
        if (!/^https?:\/\//i.test(trimmed)) {
          Alert.alert(
            "Invalid URL",
            "Please enter a valid URL starting with http:// or https://"
          );
          setUploading(false);
          return;
        }

        const newLink: GeneratedLink = {
          id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          url: trimmed,
          fileName: trimmed.length > 35 ? `${trimmed.substring(0, 32)}...` : trimmed,
          createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setGeneratedLinks((prev) => [newLink, ...prev]);
        setSourceUrl("");
        Alert.alert("Link ready", "Your shareable link has been generated!");
        return;
      }

      // ── Branch 2: Local files selected → upload to Supabase Storage ────
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id || "anonymous";

      const newlyGenerated: GeneratedLink[] = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        if (selectedFiles.length > 1) {
          setUploadProgressText(`Uploading ${i + 1} of ${selectedFiles.length}...`);
        } else {
          setUploadProgressText("Creating link...");
        }

        const randomPrefix = Math.random().toString(36).substring(2, 10);
        const lastDot = file.name.lastIndexOf(".");
        const baseName = lastDot > 0 ? file.name.slice(0, lastDot) : file.name;
        const ext = lastDot > 0 ? file.name.slice(lastDot) : "";
        const sanitisedBase = baseName.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
        const sanitisedName = `${sanitisedBase}${ext}`;
        const storagePath = `${userId}/${randomPrefix}_${sanitisedName}`;

        const fileResponse = await fetch(file.uri);
        const blob = await fileResponse.blob();

        const { error: uploadError } = await supabase.storage
          .from("shared_files")
          .upload(storagePath, blob, {
            contentType: file.mimeType || "application/octet-stream",
            upsert: false,
          });

        if (uploadError) {
          console.error(`[FileLinker] Upload failed for ${file.name}:`, uploadError);
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from("shared_files")
          .getPublicUrl(storagePath);

        if (!publicUrlData?.publicUrl) {
          throw new Error(`Could not retrieve public URL for ${file.name}`);
        }

        newlyGenerated.push({
          id: `${Date.now()}_${i}_${randomPrefix}`,
          url: publicUrlData.publicUrl,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.mimeType,
          createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
      }

      setGeneratedLinks((prev) => [...newlyGenerated, ...prev]);
      setSelectedFiles([]);
      Alert.alert(
        "Links Generated",
        `Successfully generated ${newlyGenerated.length} shareable link${newlyGenerated.length > 1 ? "s" : ""}!`
      );
    } catch (error: any) {
      console.error("Generate link error:", error);
      Alert.alert(
        "Upload failed",
        error?.message || "We could not create your file link. Please try again.",
      );
    } finally {
      setUploading(false);
      setUploadProgressText("");
    }
  };

  /*
   * =========================================================
   * COPY, SHARE, OPEN, DELETE
   * =========================================================
   */

  const handleCopyLink = async (url: string, id: string) => {
    try {
      await Clipboard.setStringAsync(url);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((curr) => (curr === id ? null : curr));
      }, 2000);
      Alert.alert("Copied", "File link copied to clipboard.");
    } catch (error) {
      console.error("Clipboard error:", error);
    }
  };

  const handleCopyAll = async () => {
    if (generatedLinks.length === 0) return;
    const allUrls = generatedLinks.map((item) => item.url).join("\n");
    await Clipboard.setStringAsync(allUrls);
    Alert.alert(
      "Copied All",
      `Copied ${generatedLinks.length} link${generatedLinks.length > 1 ? "s" : ""} to clipboard.`
    );
  };

  const handleShareLink = async (item: GeneratedLink) => {
    try {
      await Share.share({
        message: `Access "${item.fileName}":\n${item.url}`,
        title: "Share File Link",
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const handleOpenLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Cannot open this URL on your device.");
      }
    } catch (error) {
      console.error("Open URL error:", error);
    }
  };

  const handleDeleteLink = (id: string) => {
    setGeneratedLinks((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAllLinks = () => {
    Alert.alert(
      "Clear all generated links?",
      "Are you sure you want to clear all links from this list?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => setGeneratedLinks([]),
        },
      ]
    );
  };

  /*
   * =========================================================
   * UI
   * =========================================================
   */

  return (
    <AppScreen safeArea={false} backgroundColor={theme.background}>
      <AppTopBar
        title="File Linker"
        // subtitle="Upload & share files instantly"
        showBack={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ===================================================
            HERO
        =================================================== */}

        <View style={styles.hero}>
          <View
            style={[
              styles.heroIcon,
              {
                backgroundColor: theme.iconBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <CloudUpload size={25} color={theme.primary} strokeWidth={2.2} />
          </View>

          <View style={styles.heroContent}>
            <View style={styles.heroTitleRow}>
              <Text
                style={[
                  styles.heroTitle,
                  {
                    color: theme.foreground,
                  },
                ]}
              >
                File Linker
              </Text>

              <View
                style={[
                  styles.proBadge,
                  {
                    backgroundColor: theme.primary,
                  },
                ]}
              >
                <Sparkles size={11} color={theme.primaryForeground} />

                <Text
                  style={[
                    styles.proBadgeText,
                    {
                      color: theme.primaryForeground,
                    },
                  ]}
                >
                  PRO
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.heroDescription,
                {
                  color: theme.mutedForeground,
                },
              ]}
            >
              Turn any document or media file into a clean, shareable link.
            </Text>
          </View>
        </View>

        {/* ===================================================
            UPLOAD CARD
        =================================================== */}

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              shadowOpacity: theme.shadowOpacity,
              shadowRadius: theme.shadowRadius,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: theme.foreground,
                  },
                ]}
              >
                Upload your file
              </Text>

              <Text
                style={[
                  styles.sectionSubtitle,
                  {
                    color: theme.mutedForeground,
                  },
                ]}
              >
                Select a file from your device
              </Text>
            </View>
          </View>

          {selectedFiles.length === 0 ? (
            <Pressable cssInterop={false}
              onPress={pickFiles}
              style={({ pressed }) => [
                styles.uploadArea,
                {
                  backgroundColor: theme.uploadBackground,
                  borderColor: theme.primary,
                },
                pressed && styles.uploadAreaPressed,
              ]}
            >
              <View
                style={[
                  styles.uploadIconContainer,
                  {
                    backgroundColor: theme.iconBackground,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Upload size={28} color={theme.primary} strokeWidth={2} />
              </View>

              <Text
                style={[
                  styles.uploadTitle,
                  {
                    color: theme.foreground,
                  },
                ]}
              >
                Choose files
              </Text>

              <Text
                style={[
                  styles.uploadDescription,
                  {
                    color: theme.mutedForeground,
                  },
                ]}
              >
                Select single or multiple files (PDF, DOCX, images, videos, etc.)
              </Text>

              <View
                style={[
                  styles.browseButton,
                  {
                    backgroundColor: theme.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.browseButtonText,
                    {
                      color: theme.primaryForeground,
                    },
                  ]}
                >
                  Browse Files
                </Text>
              </View>

              <Text
                style={[
                  styles.uploadHint,
                  {
                    color: theme.mutedForeground,
                  },
                ]}
              >
                Your files will be securely processed
              </Text>
            </Pressable>
          ) : (
            <View style={styles.selectedFilesContainer}>
              <View style={styles.selectedFilesHeader}>
                <Text style={[styles.selectedFilesCountText, { color: theme.foreground }]}>
                  {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""} selected
                </Text>
                <View style={styles.selectedFilesActions}>
                  <Pressable
                    onPress={pickFiles}
                    style={[
                      styles.addMoreButton,
                      { borderColor: theme.border, backgroundColor: theme.surface },
                    ]}
                  >
                    <Plus size={13} color={theme.primary} />
                    <Text style={[styles.addMoreButtonText, { color: theme.primary }]}>
                      Add More
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={clearSelectedFiles}
                    style={[
                      styles.clearSelectedButton,
                      { borderColor: theme.border, backgroundColor: theme.surface },
                    ]}
                  >
                    <Text
                      style={[styles.clearSelectedButtonText, { color: theme.mutedForeground }]}
                    >
                      Clear
                    </Text>
                  </Pressable>
                </View>
              </View>

              {selectedFiles.map((file, index) => {
                const ItemIcon = getFileIcon(file.mimeType, file.name);
                const ext = file.name.split(".").pop()?.toUpperCase() || "FILE";
                return (
                  <View
                    key={`${file.name}_${index}`}
                    style={[
                      styles.filePreview,
                      {
                        backgroundColor: theme.softBackground,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.fileIconWrapper,
                        {
                          backgroundColor: theme.iconBackground,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <ItemIcon size={25} color={theme.primary} strokeWidth={2} />
                    </View>

                    <View style={styles.fileInfo}>
                      <Text
                        style={[
                          styles.fileName,
                          {
                            color: theme.foreground,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {file.name}
                      </Text>

                      <View style={styles.fileMeta}>
                        <Text
                          style={[
                            styles.fileMetaText,
                            {
                              color: theme.mutedForeground,
                            },
                          ]}
                        >
                          {ext}
                        </Text>

                        <View
                          style={[
                            styles.metaDot,
                            {
                              backgroundColor: theme.mutedForeground,
                            },
                          ]}
                        />

                        <Text
                          style={[
                            styles.fileMetaText,
                            {
                              color: theme.mutedForeground,
                            },
                          ]}
                        >
                          {formatFileSize(file.size)}
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => removeFile(index)}
                      style={[
                        styles.removeButton,
                        {
                          backgroundColor: theme.iconBackground,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <X size={16} color={theme.mutedForeground} />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ===================================================
            GENERATE BUTTON
        =================================================== */}

        <View style={styles.generateSection}>
          <View style={styles.securityRow}>
            <CheckCircle2 size={15} color={theme.primary} />

            <Text
              style={[
                styles.securityText,
                {
                  color: theme.mutedForeground,
                },
              ]}
            >
              Secure link generation
            </Text>

            <View
              style={[
                styles.securityDot,
                {
                  backgroundColor: theme.mutedForeground,
                },
              ]}
            />

            <Text
              style={[
                styles.securityText,
                {
                  color: theme.mutedForeground,
                },
              ]}
            >
              Fast sharing
            </Text>
          </View>

          <Pressable cssInterop={false}
            onPress={handleGenerateLink}
            disabled={uploading}
            style={({ pressed }) => [
              styles.generateButton,
              {
                backgroundColor: theme.primary,
              },
              pressed && styles.generateButtonPressed,
              uploading && styles.generateButtonDisabled,
            ]}
          >
            {uploading ? (
              <>
                <ActivityIndicator
                  size="small"
                  color={theme.primaryForeground}
                />

                <Text
                  style={[
                    styles.generateButtonText,
                    {
                      color: theme.primaryForeground,
                    },
                  ]}
                >
                  {uploadProgressText || "Creating links..."}
                </Text>
              </>
            ) : (
              <>
                <Sparkles size={19} color={theme.primaryForeground} />

                <Text
                  style={[
                    styles.generateButtonText,
                    {
                      color: theme.primaryForeground,
                    },
                  ]}
                >
                  {selectedFiles.length > 1
                    ? `Generate ${selectedFiles.length} Shareable Links`
                    : "Generate Shareable Link"}
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* ===================================================
            GENERATED LINKS LIST
        =================================================== */}

        {generatedLinks.length > 0 ? (
          <View style={styles.generatedSection}>
            <View style={styles.generatedSectionHeader}>
              <View style={styles.generatedTitleRow}>
                <CheckCircle2 size={19} color={theme.primary} />
                <Text
                  style={[
                    styles.generatedSectionTitle,
                    {
                      color: theme.foreground,
                    },
                  ]}
                >
                  Generated Links
                </Text>
                <View
                  style={[
                    styles.countBadge,
                    {
                      backgroundColor: theme.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.countBadgeText,
                      {
                        color: theme.primaryForeground,
                      },
                    ]}
                  >
                    {generatedLinks.length}
                  </Text>
                </View>
              </View>

              <View style={styles.generatedHeaderActions}>
                {generatedLinks.length > 1 && (
                  <Pressable
                    onPress={handleCopyAll}
                    style={[
                      styles.miniHeaderButton,
                      {
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Copy size={13} color={theme.primary} />
                    <Text
                      style={[
                        styles.miniHeaderButtonText,
                        {
                          color: theme.primary,
                        },
                      ]}
                    >
                      Copy All
                    </Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={handleClearAllLinks}
                  style={[
                    styles.miniHeaderButton,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Trash2 size={13} color={theme.mutedForeground} />
                  <Text
                    style={[
                      styles.miniHeaderButtonText,
                      {
                        color: theme.mutedForeground,
                      },
                    ]}
                  >
                    Clear
                  </Text>
                </Pressable>
              </View>
            </View>

            {generatedLinks.map((item) => {
              const ItemIcon = getFileIcon(item.mimeType, item.fileName);
              const isItemCopied = copiedId === item.id;

              return (
                <View
                  key={item.id}
                  style={[
                    styles.successCard,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                      shadowOpacity: theme.shadowOpacity,
                      shadowRadius: theme.shadowRadius,
                    },
                  ]}
                >
                  <View style={styles.successHeader}>
                    <View
                      style={[
                        styles.successIcon,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <ItemIcon size={20} color={theme.primary} />
                    </View>

                    <View style={styles.successContent}>
                      <Text
                        style={[
                          styles.successTitle,
                          {
                            color: theme.foreground,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {item.fileName}
                      </Text>

                      <View style={styles.generatedMetaRow}>
                        {item.fileSize ? (
                          <>
                            <Text
                              style={[
                                styles.generatedMetaText,
                                {
                                  color: theme.mutedForeground,
                                },
                              ]}
                            >
                              {formatFileSize(item.fileSize)}
                            </Text>
                            <View
                              style={[
                                styles.metaDot,
                                {
                                  backgroundColor: theme.mutedForeground,
                                },
                              ]}
                            />
                          </>
                        ) : null}
                        <Text
                          style={[
                            styles.generatedMetaText,
                            {
                              color: theme.mutedForeground,
                            },
                          ]}
                        >
                          {item.createdAt}
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => handleDeleteLink(item.id)}
                      style={[
                        styles.deleteItemButton,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <X size={15} color={theme.mutedForeground} />
                    </Pressable>
                  </View>

                  <View
                    style={[
                      styles.linkBox,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.linkText,
                        {
                          color: theme.primary,
                        },
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="middle"
                    >
                      {item.url}
                    </Text>

                    <Pressable
                      onPress={() => handleCopyLink(item.url, item.id)}
                      style={[
                        styles.copyButton,
                        {
                          backgroundColor: theme.card,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      {isItemCopied ? (
                        <Check size={16} color={theme.primary} />
                      ) : (
                        <Copy size={16} color={theme.primary} />
                      )}
                    </Pressable>
                  </View>

                  <View style={styles.actionRow}>
                    <Pressable
                      onPress={() => handleCopyLink(item.url, item.id)}
                      style={[
                        styles.secondaryAction,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      {isItemCopied ? (
                        <Check size={15} color={theme.foreground} />
                      ) : (
                        <Copy size={15} color={theme.foreground} />
                      )}

                      <Text
                        style={[
                          styles.secondaryActionText,
                          {
                            color: theme.foreground,
                          },
                        ]}
                      >
                        {isItemCopied ? "Copied!" : "Copy Link"}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleShareLink(item)}
                      style={[
                        styles.primaryAction,
                        {
                          backgroundColor: theme.primary,
                        },
                      ]}
                    >
                      <Share2 size={15} color={theme.primaryForeground} />

                      <Text
                        style={[
                          styles.primaryActionText,
                          {
                            color: theme.primaryForeground,
                          },
                        ]}
                      >
                        Share
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleOpenLink(item.url)}
                      style={[
                        styles.iconAction,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <ExternalLink size={16} color={theme.foreground} />
                    </Pressable>
                  </View>

                  <View style={styles.linkFooter}>
                    <ExternalLink size={13} color={theme.mutedForeground} />

                    <Text
                      style={[
                        styles.linkFooterText,
                        {
                          color: theme.mutedForeground,
                        },
                      ]}
                    >
                      Direct Supabase Storage link ready to share
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}


const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 45,
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    paddingHorizontal: 2,
  },

  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
    borderWidth: 1,
  },

  heroContent: {
    flex: 1,
  },

  heroTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },

  heroTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginRight: 8,
  },

  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },

  proBadgeText: {
    fontSize: 9,
    fontWeight: "900",
  },

  heroDescription: {
    fontSize: 12.5,
    lineHeight: 18,
    maxWidth: "95%",
  },

  /*
   * CARD
   */

  card: {
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    marginBottom: 14,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 2,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 3,
  },

  sectionSubtitle: {
    fontSize: 11.5,
  },

  stepBadge: {
    width: 30,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  stepText: {
    fontSize: 10,
    fontWeight: "900",
  },

  /*
   * UPLOAD
   */

  uploadArea: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 15,
    paddingVertical: 28,
    paddingHorizontal: 18,
    alignItems: "center",
  },

  uploadAreaPressed: {
    opacity: 0.75,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  uploadIconContainer: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
    borderWidth: 1,
  },

  uploadTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 5,
  },

  uploadDescription: {
    fontSize: 11.5,
    textAlign: "center",
    lineHeight: 17,
    marginBottom: 15,
  },

  browseButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 9,
    marginBottom: 10,
  },

  browseButtonText: {
    fontSize: 12.5,
    fontWeight: "800",
  },

  uploadHint: {
    fontSize: 10,
  },

  /*
   * SELECTED FILE
   */

  selectedFilesContainer: {
    gap: 8,
  },

  selectedFilesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    paddingHorizontal: 2,
  },

  selectedFilesCountText: {
    fontSize: 12,
    fontWeight: "800",
  },

  selectedFilesActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  addMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },

  addMoreButtonText: {
    fontSize: 11,
    fontWeight: "700",
  },

  clearSelectedButton: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },

  clearSelectedButtonText: {
    fontSize: 11,
    fontWeight: "600",
  },

  filePreview: {
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
    borderRadius: 13,
    borderWidth: 1,
  },

  fileIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
  },

  fileInfo: {
    flex: 1,
    minWidth: 0,
  },

  fileName: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    marginBottom: 5,
  },

  fileMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  fileMetaText: {
    fontSize: 9.5,
    fontWeight: "700",
  },

  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    marginHorizontal: 6,
  },

  readyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  readyText: {
    fontSize: 10,
    fontWeight: "600",
  },

  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    borderWidth: 1,
  },

  /*
   * OR
   */

  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },

  divider: {
    flex: 1,
    height: 1,
  },

  orBadge: {
    marginHorizontal: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },

  orText: {
    fontSize: 9,
    fontWeight: "800",
  },

  /*
   * SOURCE URL
   */

  titleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
  },

  smallIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
    borderWidth: 1,
  },

  urlInputWrapper: {
    minHeight: 48,
    borderRadius: 11,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderWidth: 1,
  },

  urlInput: {
    flex: 1,
    fontSize: 12,
    paddingVertical: 10,
  },

  urlHint: {
    marginTop: 8,
    fontSize: 10,
    lineHeight: 15,
  },

  /*
   * GENERATE
   */

  generateSection: {
    marginTop: 4,
    marginBottom: 17,
  },

  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    gap: 5,
  },

  securityText: {
    fontSize: 10,
    fontWeight: "600",
  },

  securityDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    marginHorizontal: 3,
  },

  generateButton: {
    minHeight: 53,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingHorizontal: 18,
  },

  generateButtonPressed: {
    opacity: 0.85,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  generateButtonDisabled: {
    opacity: 0.7,
  },

  generateButtonText: {
    fontSize: 14,
    fontWeight: "900",
  },

  /*
   * SUCCESS
   */

  successCard: {
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    marginBottom: 18,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 2,
  },

  successHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  successIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
    borderWidth: 1,
  },

  successContent: {
    flex: 1,
  },

  successTitle: {
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 3,
  },

  successSubtitle: {
    fontSize: 10.5,
    lineHeight: 15,
  },

  linkBox: {
    minHeight: 53,
    borderRadius: 11,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
  },

  linkText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: "700",
  },

  copyButton: {
    width: 40,
    height: 40,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    borderWidth: 1,
  },

  actionRow: {
    flexDirection: "row",
    gap: 9,
  },

  secondaryAction: {
    flex: 1,
    height: 45,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderWidth: 1,
  },

  secondaryActionText: {
    fontSize: 12,
    fontWeight: "800",
  },

  primaryAction: {
    flex: 1,
    height: 45,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  primaryActionText: {
    fontSize: 12,
    fontWeight: "800",
  },

  linkFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 12,
  },

  linkFooterText: {
    fontSize: 9.5,
  },

  /*
   * GENERATED LINKS
   */

  generatedSection: {
    marginBottom: 18,
  },

  generatedSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 2,
  },

  generatedTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  generatedSectionTitle: {
    fontSize: 15,
    fontWeight: "800",
  },

  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },

  countBadgeText: {
    fontSize: 11,
    fontWeight: "900",
  },

  generatedHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  miniHeaderButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },

  miniHeaderButtonText: {
    fontSize: 11,
    fontWeight: "700",
  },

  generatedMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },

  generatedMetaText: {
    fontSize: 10.5,
    fontWeight: "600",
  },

  deleteItemButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginLeft: 6,
  },

  iconAction: {
    width: 45,
    height: 45,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  /*
   * FEATURES
   */

  features: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 3,
  },

  featureItem: {
    alignItems: "center",
    flex: 1,
  },

  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    borderWidth: 1,
  },

  featureText: {
    fontSize: 9.5,
    fontWeight: "700",
  },
});
