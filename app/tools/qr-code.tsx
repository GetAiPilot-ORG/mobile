import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

import { handleCopyToClipboard } from "@/lib/utils";
import { AppScreen } from "../../src/components/AppScreen";
import { AppTopBar } from "../../src/components/AppTopBar";
import { colors } from "../../src/theme/colors";

type QRType = "url" | "text" | "wifi";

const placeholderText: Record<QRType, string> = {
  url: "Enter a website URL (e.g., https://example.com)",
  text: "Enter any text content",
  wifi: "Enter Wi-Fi name and password",
};

export default function QRCodeGeneratorScreen() {
  const [qrType, setQrType] = useState<QRType>("url");

  const [content, setContent] = useState("https://getaipilot.in");

  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");

  const [copied, setCopied] = useState(false);

  const getQRValue = (): string => {
    switch (qrType) {
      case "url":
        return content.trim();

      case "text":
        return content.trim();

      case "wifi":
        if (!ssid.trim()) {
          return "";
        }

        return `WIFI:T:WPA;S:${ssid.trim()};P:${password};;`;

      default:
        return content.trim();
    }
  };

  const getQrShareUrl = (): string => {
    const qrValue = getQRValue();

    const encoded = encodeURIComponent(qrValue);

    return `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encoded}&color=003C33&bgcolor=FFFFFF`;
  };

  const handleQrTypeChange = (type: QRType) => {
    setQrType(type);
    setCopied(false);
    if (type === "url") {
      setContent("https://getaipilot.in");
    } else if (type === "text") {
      setContent("");
    } else if (type === "wifi") {
      setContent("");
      setSsid("");
      setPassword("");
    }
  };

  const handleShare = async () => {
    try {
      const qrValue = getQRValue();

      if (!qrValue) {
        Alert.alert(
          "Validation Error",
          qrType === "wifi"
            ? "Please enter Wi-Fi name and password."
            : "Please enter text or a URL to generate a QR code.",
        );
        return;
      }

      const qrShareUrl = getQrShareUrl();

      await Share.share({
        message: `Check out this QR code:\n\n${qrShareUrl}`,
      });
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const qrValue = getQRValue();

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar
        title="QR Code Generator"
        subtitle="High-Resolution Custom QR Codes"
        showBack={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Generator Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>QR Code Generator</Text>

          <Text style={styles.cardSubtitle}>
            Convert website links, Wi-Fi networks, and text into scannable QR
            codes instantly.
          </Text>

          {/* QR Type Tabs */}
          <View style={styles.typeTabs}>
            {(["url", "text", "wifi"] as const).map((type) => (
              <Pressable
                key={type}
                style={[
                  styles.typeTab,
                  qrType === type && styles.typeTabActive,
                ]}
                onPress={() => handleQrTypeChange(type)}
              >
                <Text
                  style={[
                    styles.typeTabText,
                    qrType === type && styles.typeTabTextActive,
                  ]}
                >
                  {type.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Input Label */}
          <Text style={styles.inputLabel}>
            {qrType === "url"
              ? "Target Website URL"
              : qrType === "wifi"
                ? "Wi-Fi Network Name & Password"
                : "Text Content"}
          </Text>

          {/* Wi-Fi Inputs */}
          {qrType === "wifi" ? (
            <View>
              <TextInput
                style={styles.input}
                placeholder="Wi-Fi Name (SSID)"
                placeholderTextColor={colors.mutedForeground}
                value={ssid}
                onChangeText={(value) => {
                  setSsid(value);
                  setCopied(false);
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TextInput
                style={styles.input}
                placeholder="Wi-Fi Password"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setCopied(false);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
            </View>
          ) : (
            /* URL / Text Input */
            <TextInput
              style={[styles.input, qrType === "text" && styles.textArea]}
              placeholder={placeholderText[qrType]}
              placeholderTextColor={colors.mutedForeground}
              value={content}
              onChangeText={(value) => {
                setContent(value);
                setCopied(false);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              multiline={qrType === "text"}
              textAlignVertical={qrType === "text" ? "top" : "center"}
            />
          )}
        </View>

        {/* QR Preview */}
        {qrValue ? (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Scan with Camera</Text>

            {/* QR Code */}
            <View style={styles.qrWrapper}>
              <QRCode
                value={qrValue}
                size={200}
                color="#003C33"
                backgroundColor="#FFFFFF"
              />
            </View>

            {/* Payload */}
            <Text style={styles.qrPayload} numberOfLines={2}>
              Payload: {qrType === "wifi" ? `Wi-Fi: ${ssid}` : content}
            </Text>

            {/* Share Button */}
            <Pressable style={styles.shareBtn} onPress={handleShare}>
              <Text style={styles.shareBtnText}>Share QR Link 📤</Text>
            </Pressable>

            {/* Copy Button */}
            <Pressable
              style={[styles.shareBtn, styles.copyBtn]}
              onPress={() => {
                void handleCopyToClipboard(
                  getQRValue(),
                  getQrShareUrl(),
                  qrType,
                  setCopied,
                );
              }}
            >
              <Text style={styles.shareBtnText}>
                {copied ? "Copied to Clipboard ✅" : "Copy QR Link 📋"}
              </Text>
            </Pressable>

            {/* Share URL Preview */}
            <Text style={styles.urlPreview} numberOfLines={3}>
              {getQrShareUrl()}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.foreground,
    marginBottom: 4,
  },

  cardSubtitle: {
    fontSize: 13,
    color: colors.mutedForeground,
    lineHeight: 18,
    marginBottom: 16,
  },

  typeTabs: {
    flexDirection: "row",
    backgroundColor: colors.muted,
    borderRadius: 8,
    padding: 3,
    marginBottom: 14,
  },

  typeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },

  typeTabActive: {
    backgroundColor: colors.surface,
  },

  typeTabText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.mutedForeground,
  },

  typeTabTextActive: {
    color: colors.foreground,
  },

  inputLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: 6,
  },

  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.foreground,
    marginBottom: 14,
  },

  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },

  previewCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },

  previewTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.foreground,
    marginBottom: 16,
  },

  qrWrapper: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },

  qrPayload: {
    width: "100%",
    fontSize: 12,
    color: colors.mutedForeground,
    marginBottom: 16,
    textAlign: "center",
  },

  shareBtn: {
    width: "100%",
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  copyBtn: {
    marginTop: 10,
  },

  shareBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },

  urlPreview: {
    width: "100%",
    marginTop: 14,
    padding: 10,
    borderRadius: 8,
    backgroundColor: colors.muted,
    color: colors.mutedForeground,
    fontSize: 10,
    lineHeight: 15,
  },
});
