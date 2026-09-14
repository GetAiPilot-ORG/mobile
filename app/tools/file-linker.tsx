import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
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
import { getColors } from "../../src/theme/colors";

type SelectedFile = {
  name: string;
  uri: string;
  size?: number;
  mimeType?: string;
};

export default function FileLinkerScreen() {
  /*
   * =========================================================
   * SYSTEM THEME
   * =========================================================
   */
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = getColors(isDark);

  /*
   * =========================================================
   * STATE
   * =========================================================
   */

  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);

  const [sourceUrl, setSourceUrl] = useState("");

  const [generatedShareUrl, setGeneratedShareUrl] = useState("");

  const [uploading, setUploading] = useState(false);

  /*
   * =========================================================
   * THEME
   *
   * Main colors come from your centralized colors object.
   * isDark is used for subtle UI differences such as
   * shadows, overlays and upload-area appearance.
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
   * FILE EXTENSION
   * =========================================================
   */

  const fileExtension = useMemo(() => {
    if (!selectedFile?.name) {
      return "";
    }

    return selectedFile.name.split(".").pop()?.toLowerCase() || "";
  }, [selectedFile]);

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

  const getFileIcon = () => {
    const mimeType = selectedFile?.mimeType?.toLowerCase() || "";

    if (mimeType.includes("image")) {
      return ImageIcon;
    }

    if (mimeType.includes("video")) {
      return Film;
    }

    if (mimeType.includes("audio")) {
      return Music;
    }

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

  /*
   * =========================================================
   * PICK FILE
   * =========================================================
   */

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        return;
      }

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

  const removeFile = () => {
    setSelectedFile(null);
    setGeneratedShareUrl("");
  };

  /*
   * =========================================================
   * GENERATE LINK
   * =========================================================
   */

  const handleGenerateLink = async () => {
    if (!selectedFile && !sourceUrl.trim()) {
      Alert.alert(
        "File required",
        "Please upload a file or provide a source URL.",
      );

      return;
    }

    setUploading(true);

    try {
      /*
       * =====================================================
       * TODO:
       * Replace this mock upload with your actual backend.
       *
       * Example:
       *
       * const formData = new FormData();
       *
       * formData.append('file', {
       *   uri: selectedFile.uri,
       *   name: selectedFile.name,
       *   type:
       *     selectedFile.mimeType ||
       *     'application/octet-stream',
       * } as any);
       *
       * const response = await fetch(
       *   'YOUR_API_URL',
       *   {
       *     method: 'POST',
       *     body: formData,
       *   }
       * );
       * =====================================================
       */

      await new Promise((resolve) => setTimeout(resolve, 1200));

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

      Alert.alert(
        "Upload failed",
        "We could not create your file link. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  /*
   * =========================================================
   * COPY
   * =========================================================
   */

  const handleCopy = async () => {
    if (!generatedShareUrl) {
      return;
    }

    try {
      await Clipboard.setStringAsync(generatedShareUrl);

      Alert.alert("Copied", "File link copied to clipboard.");
    } catch (error) {
      console.error("Clipboard error:", error);
    }
  };

  /*
   * =========================================================
   * SHARE
   * =========================================================
   */

  const handleShare = async () => {
    if (!generatedShareUrl) {
      return;
    }

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

  /*
   * =========================================================
   * UI
   * =========================================================
   */

  return (
    <AppScreen safeArea={false} backgroundColor={theme.background}>
      <AppTopBar
        title="File Linker"
        subtitle="Upload & share files instantly"
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

            <View
              style={[
                styles.stepBadge,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.stepText,
                  {
                    color: theme.mutedForeground,
                  },
                ]}
              >
                01
              </Text>
            </View>
          </View>

          {!selectedFile ? (
            <Pressable
              onPress={pickFile}
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
                Choose a file
              </Text>

              <Text
                style={[
                  styles.uploadDescription,
                  {
                    color: theme.mutedForeground,
                  },
                ]}
              >
                PDF, DOCX, PPTX, ZIP, images, videos and more
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
                Your file will be securely processed
              </Text>
            </Pressable>
          ) : (
            <View
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
                <FileIcon size={27} color={theme.primary} strokeWidth={2} />
              </View>

              <View style={styles.fileInfo}>
                <Text
                  style={[
                    styles.fileName,
                    {
                      color: theme.foreground,
                    },
                  ]}
                  numberOfLines={2}
                >
                  {selectedFile.name}
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
                    {fileExtension ? fileExtension.toUpperCase() : "FILE"}
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
                    {formatFileSize(selectedFile.size)}
                  </Text>
                </View>

                <View style={styles.readyRow}>
                  <CheckCircle2 size={14} color={theme.primary} />

                  <Text
                    style={[
                      styles.readyText,
                      {
                        color: theme.primary,
                      },
                    ]}
                  >
                    File ready to upload
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={removeFile}
                style={[
                  styles.removeButton,
                  {
                    backgroundColor: theme.iconBackground,
                    borderColor: theme.border,
                  },
                ]}
              >
                <X size={17} color={theme.mutedForeground} />
              </Pressable>
            </View>
          )}
        </View>

        {/* ===================================================
            OR
        =================================================== */}

        <View style={styles.orContainer}>
          <View
            style={[
              styles.divider,
              {
                backgroundColor: theme.border,
              },
            ]}
          />

          <View
            style={[
              styles.orBadge,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.orText,
                {
                  color: theme.mutedForeground,
                },
              ]}
            >
              OR
            </Text>
          </View>

          <View
            style={[
              styles.divider,
              {
                backgroundColor: theme.border,
              },
            ]}
          />
        </View>

        {/* ===================================================
            SOURCE URL CARD
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
            <View style={styles.titleWithIcon}>
              <View
                style={[
                  styles.smallIcon,
                  {
                    backgroundColor: theme.iconBackground,
                    borderColor: theme.border,
                  },
                ]}
              >
                <LinkIcon size={17} color={theme.primary} />
              </View>

              <View>
                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      color: theme.foreground,
                    },
                  ]}
                >
                  Use existing file URL
                </Text>

                <Text
                  style={[
                    styles.sectionSubtitle,
                    {
                      color: theme.mutedForeground,
                    },
                  ]}
                >
                  Google Drive, Dropbox, S3, etc.
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.stepBadge,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.stepText,
                  {
                    color: theme.mutedForeground,
                  },
                ]}
              >
                02
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.urlInputWrapper,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <LinkIcon size={17} color={theme.mutedForeground} />

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
              placeholderTextColor={theme.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={[
                styles.urlInput,
                {
                  color: theme.foreground,
                },
              ]}
            />
          </View>

          <Text
            style={[
              styles.urlHint,
              {
                color: theme.mutedForeground,
              },
            ]}
          >
            Paste a publicly accessible file URL if you don't want to upload a
            file.
          </Text>
        </View>

        {/* ===================================================
            GENERATE SECTION
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

          <Pressable
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
                  Creating link...
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
                  Generate Shareable Link
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* ===================================================
            SUCCESS CARD
        =================================================== */}

        {generatedShareUrl ? (
          <View
            style={[
              styles.successCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.primary,
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
                <CheckCircle2 size={22} color={theme.primary} />
              </View>

              <View style={styles.successContent}>
                <Text
                  style={[
                    styles.successTitle,
                    {
                      color: theme.foreground,
                    },
                  ]}
                >
                  Your link is ready
                </Text>

                <Text
                  style={[
                    styles.successSubtitle,
                    {
                      color: theme.mutedForeground,
                    },
                  ]}
                >
                  Anyone with this link can access the file.
                </Text>
              </View>
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
                numberOfLines={2}
              >
                {generatedShareUrl}
              </Text>

              <Pressable
                onPress={handleCopy}
                style={[
                  styles.copyButton,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Copy size={17} color={theme.primary} />
              </Pressable>
            </View>

            <View style={styles.actionRow}>
              <Pressable
                onPress={handleCopy}
                style={[
                  styles.secondaryAction,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Copy size={17} color={theme.foreground} />

                <Text
                  style={[
                    styles.secondaryActionText,
                    {
                      color: theme.foreground,
                    },
                  ]}
                >
                  Copy Link
                </Text>
              </Pressable>

              <Pressable
                onPress={handleShare}
                style={[
                  styles.primaryAction,
                  {
                    backgroundColor: theme.primary,
                  },
                ]}
              >
                <Share2 size={17} color={theme.primaryForeground} />

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
                Your branded gap.to link is ready to use
              </Text>
            </View>
          </View>
        ) : null}

        {/* ===================================================
            FEATURES
        =================================================== */}

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <View
              style={[
                styles.featureIcon,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <LinkIcon size={16} color={theme.primary} />
            </View>

            <Text
              style={[
                styles.featureText,
                {
                  color: theme.mutedForeground,
                },
              ]}
            >
              Clean URLs
            </Text>
          </View>

          <View style={styles.featureItem}>
            <View
              style={[
                styles.featureIcon,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <Share2 size={16} color={theme.primary} />
            </View>

            <Text
              style={[
                styles.featureText,
                {
                  color: theme.mutedForeground,
                },
              ]}
            >
              Easy sharing
            </Text>
          </View>

          <View style={styles.featureItem}>
            <View
              style={[
                styles.featureIcon,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <CheckCircle2 size={16} color={theme.primary} />
            </View>

            <Text
              style={[
                styles.featureText,
                {
                  color: theme.mutedForeground,
                },
              ]}
            >
              Reliable access
            </Text>
          </View>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

/*
 * =============================================================
 * STYLES
 * =============================================================
 */

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 45,
  },

  /*
   * HERO
   */

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
