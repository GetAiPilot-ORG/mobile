import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { VoiceCall } from "../api/voiceApi";

interface CallDetailsModalProps {
  visible: boolean;
  call: VoiceCall | null;
  onClose: () => void;
}

export const CallDetailsModal: React.FC<CallDetailsModalProps> = ({
  visible,
  call,
  onClose,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  if (!call) return null;

  const messages: Array<{ role: string; content: string; timestamp?: string }> =
    (call as any).transcriptMessages?.length
      ? (call as any).transcriptMessages
      : call.transcript
      ? [{ role: "assistant", content: call.transcript }]
      : [];

  const outcome = (call as any).outcome || (call.status === "completed" ? "COMPLETED" : "MISSED");
  const isPositive =
    outcome.toUpperCase() === "POSITIVE" ||
    outcome.toUpperCase() === "COMPLETED" ||
    call.status === "completed";
  const isNegative =
    outcome.toUpperCase() === "NEGATIVE" ||
    call.status === "failed" ||
    call.status === "cancelled";

  const colors = {
    background: isDark ? "#0A0A0E" : "#FFFFFF",
    surface: isDark ? "#141418" : "#F8FAFC",
    surfaceAlt: isDark ? "#1C1C22" : "#F1F5F9",
    border: isDark ? "#282832" : "#E2E8F0",
    text: isDark ? "#FFFFFF" : "#0F172A",
    textSecondary: isDark ? "#94A3B8" : "#64748B",
    primary: "#5844E3",
    primaryLight: isDark ? "rgba(88, 68, 227, 0.15)" : "#EEF2FF",
    summaryBg: isDark ? "#1A1813" : "#FEFCE8",
    summaryBorder: isDark ? "rgba(245, 158, 11, 0.25)" : "#FEF08A",
    summaryText: isDark ? "#FDE68A" : "#713F12",
    emerald: "#059669",
    emeraldLight: isDark ? "rgba(5, 150, 105, 0.15)" : "#ECFDF5",
    emeraldBubble: "#059669",
    assistantBubble: isDark ? "#1E1E26" : "#FFFFFF",
  };

  const handleOpenRecording = async () => {
    let url = call.recordingUrl;
    if (!url) return;

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://api.vomyra.com/recordings/${url}`;
    }

    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Recording Unavailable",
          "Could not open this audio recording URL on this device.",
        );
      }
    } catch (err: any) {
      Alert.alert(
        "Playback Error",
        "Could not open the call audio recording at this time.",
      );
    }
  };

  const shortCallId =
    call.id && call.id.length > 12 ? `${call.id.slice(0, 10)}...` : call.id || "call_session";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* 1. TOP HEADER (Matches GAP_VoicePilot exactly) */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerTitleCol}>
            <View style={styles.headerBadgeRow}>
              <Text style={[styles.headerMainTitle, { color: colors.text }]}>
                Call Details
              </Text>
              <View
                style={[
                  styles.callIdPill,
                  {
                    backgroundColor: colors.surfaceAlt,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[styles.callIdPillText, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {shortCallId}
                </Text>
              </View>
              <View
                style={[
                  styles.outcomePill,
                  {
                    backgroundColor: isPositive
                      ? colors.emeraldLight
                      : isNegative
                      ? "rgba(239, 68, 68, 0.12)"
                      : colors.surfaceAlt,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.outcomePillText,
                    {
                      color: isPositive
                        ? colors.emerald
                        : isNegative
                        ? "#EF4444"
                        : colors.textSecondary,
                    },
                  ]}
                >
                  {outcome}
                </Text>
              </View>
            </View>

            <Text
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {call.time || "Recent"} • Assistant:{" "}
              {call.assistant || "Voice Assistant"}
            </Text>
          </View>

          <Pressable
            style={[styles.closeBtn, { backgroundColor: colors.surfaceAlt }]}
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              onClose();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Audio Recording Playback Bar (if available) */}
          {call.recordingUrl ? (
            <Pressable
              style={[
                styles.audioBar,
                {
                  backgroundColor: colors.primaryLight,
                  borderColor: isDark ? "rgba(88, 68, 227, 0.3)" : "#DDD6FE",
                },
              ]}
              onPress={handleOpenRecording}
            >
              <View style={styles.audioBarLeft}>
                <Ionicons name="play-circle" size={20} color={colors.primary} />
                <Text style={[styles.audioBarText, { color: colors.primary }]}>
                  Play Carrier Audio Recording
                </Text>
              </View>
              <Ionicons
                name="open-outline"
                size={16}
                color={colors.primary}
              />
            </Pressable>
          ) : null}

          {/* 2. AI SUMMARY CARD (Matches GAP_VoicePilot block-cream aesthetic) */}
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: colors.summaryBg,
                borderColor: colors.summaryBorder,
              },
            ]}
          >
            <View style={styles.summaryHeaderRow}>
              <Ionicons name="sparkles" size={15} color="#10B981" />
              <Text
                style={[
                  styles.summaryHeading,
                  { color: isDark ? "#FDE68A" : "#854D0E" },
                ]}
              >
                AI WhatsApp &amp; Call Summary
              </Text>
            </View>
            <View
              style={[
                styles.summaryInnerBox,
                {
                  backgroundColor: isDark ? "#141418" : "#FFFFFF",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
                },
              ]}
            >
              <Text
                style={[
                  styles.summaryBodyText,
                  { color: isDark ? "#E2E8F0" : "#334155" },
                ]}
              >
                {call.summary || "Conversation completed and logged successfully."}
              </Text>
            </View>
          </View>

          {/* 3. TURN-BY-TURN TRANSCRIPTION MESSAGES (1:1 with Web) */}
          <View style={styles.transcriptSection}>
            <View style={styles.sectionTitleRow}>
              <Ionicons
                name="document-text-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text
                style={[
                  styles.sectionTitleText,
                  { color: colors.textSecondary },
                ]}
              >
                TURN-BY-TURN TRANSCRIPTION
              </Text>
            </View>

            <View
              style={[
                styles.transcriptContainer,
                {
                  backgroundColor: isDark ? "#121216" : "#F8FAFC",
                  borderColor: colors.border,
                },
              ]}
            >
              {messages.length > 0 ? (
                messages.map((msg, idx) => {
                  const isAssistant =
                    msg.role === "assistant" || msg.role === "bot";

                  return (
                    <View
                      key={idx}
                      style={[
                        styles.messageRow,
                        isAssistant
                          ? styles.messageRowAssistant
                          : styles.messageRowCustomer,
                      ]}
                    >
                      {/* Assistant Avatar (Left) */}
                      {isAssistant && (
                        <View style={styles.avatarDarkCircle}>
                          <Ionicons name="hardware-chip" size={12} color="#FFFFFF" />
                        </View>
                      )}

                      {/* Bubble */}
                      <View
                        style={[
                          styles.chatBubble,
                          isAssistant
                            ? [
                                styles.chatBubbleAssistant,
                                {
                                  backgroundColor: colors.assistantBubble,
                                  borderColor: colors.border,
                                },
                              ]
                            : [
                                styles.chatBubbleCustomer,
                                { backgroundColor: colors.emeraldBubble },
                              ],
                        ]}
                      >
                        <View style={styles.bubbleHeaderRow}>
                          <Text
                            style={[
                              styles.bubbleSpeakerText,
                              {
                                color: isAssistant
                                  ? colors.textSecondary
                                  : "rgba(255, 255, 255, 0.8)",
                              },
                            ]}
                          >
                            {isAssistant
                              ? call.assistant || "Voice Assistant"
                              : "Customer"}
                          </Text>
                          {msg.timestamp ? (
                            <Text
                              style={[
                                styles.bubbleTimeText,
                                {
                                  color: isAssistant
                                    ? colors.textSecondary
                                    : "rgba(255, 255, 255, 0.7)",
                                },
                              ]}
                            >
                              {msg.timestamp}
                            </Text>
                          ) : null}
                        </View>

                        <Text
                          style={[
                            styles.bubbleContentText,
                            {
                              color: isAssistant ? colors.text : "#FFFFFF",
                            },
                          ]}
                        >
                          {msg.content}
                        </Text>
                      </View>

                      {/* Customer Avatar (Right) */}
                      {!isAssistant && (
                        <View style={styles.avatarEmeraldCircle}>
                          <Ionicons name="person" size={12} color="#FFFFFF" />
                        </View>
                      )}
                    </View>
                  );
                })
              ) : (
                <Text
                  style={[
                    styles.noTranscriptText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {call.transcript ||
                    "No conversation dialogue recorded for this session."}
                </Text>
              )}
            </View>
          </View>

          {/* 4. CALL TELEPHONY METADATA GRID (4-Box Grid from GAP_VoicePilot) */}
          <View style={styles.metaGrid}>
            {/* Box 1: Customer Number */}
            <View
              style={[
                styles.metaGridCard,
                {
                  backgroundColor: colors.surfaceAlt,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[styles.metaGridLabel, { color: colors.textSecondary }]}
              >
                CUSTOMER NUMBER
              </Text>
              <Text
                style={[styles.metaGridValue, { color: colors.text }]}
                numberOfLines={1}
              >
                {call.customerNumber}
              </Text>
            </View>

            {/* Box 2: Assigned Number */}
            <View
              style={[
                styles.metaGridCard,
                {
                  backgroundColor: colors.surfaceAlt,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[styles.metaGridLabel, { color: colors.textSecondary }]}
              >
                ASSIGNED NUMBER
              </Text>
              <Text
                style={[styles.metaGridValue, { color: colors.text }]}
                numberOfLines={1}
              >
                {call.assignedNumber || "VoicePilot Line"}
              </Text>
            </View>

            {/* Box 3: Duration & Latency */}
            <View
              style={[
                styles.metaGridCard,
                {
                  backgroundColor: colors.surfaceAlt,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[styles.metaGridLabel, { color: colors.textSecondary }]}
              >
                DURATION &amp; LATENCY
              </Text>
              <Text
                style={[styles.metaGridValue, { color: colors.text }]}
                numberOfLines={1}
              >
                {call.duration || "0s"} ({(call as any).latency || "Normal"})
              </Text>
            </View>

            {/* Box 4: Estimated Cost */}
            <View
              style={[
                styles.metaGridCard,
                {
                  backgroundColor: colors.surfaceAlt,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[styles.metaGridLabel, { color: colors.textSecondary }]}
              >
                ESTIMATED COST
              </Text>
              <Text
                style={[styles.metaGridValue, { color: colors.emerald }]}
                numberOfLines={1}
              >
                {call.cost || "Free Plan"}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleCol: {
    flex: 1,
    gap: 3,
  },
  headerBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  headerMainTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  callIdPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
  },
  callIdPillText: {
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontWeight: "600",
  },
  outcomePill: {
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  outcomePillText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  headerSubtitle: {
    fontSize: 11.5,
    fontWeight: "500",
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    paddingBottom: 32,
  },
  audioBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  audioBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  audioBarText: {
    fontSize: 12.5,
    fontWeight: "700",
  },
  summaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 7,
  },
  summaryHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  summaryHeading: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: -0.1,
  },
  summaryInnerBox: {
    padding: 9,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  summaryBodyText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
  },
  transcriptSection: {
    gap: 6,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sectionTitleText: {
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  transcriptContainer: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    gap: 8,
  },
  messageRow: {
    flexDirection: "row",
    gap: 6,
  },
  messageRowAssistant: {
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  messageRowCustomer: {
    justifyContent: "flex-end",
    alignItems: "flex-start",
  },
  avatarDarkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  avatarEmeraldCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#047857",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  chatBubble: {
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 7,
    maxWidth: "80%",
    gap: 2,
  },
  chatBubbleAssistant: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  chatBubbleCustomer: {},
  bubbleHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  bubbleSpeakerText: {
    fontSize: 9.5,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  bubbleTimeText: {
    fontSize: 9,
  },
  bubbleContentText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  },
  noTranscriptText: {
    fontSize: 11.5,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 8,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaGridCard: {
    width: "48%",
    flexGrow: 1,
    padding: 9,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  metaGridLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  metaGridValue: {
    fontSize: 12.5,
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
});
