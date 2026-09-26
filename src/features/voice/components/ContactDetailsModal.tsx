import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useColorScheme,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { VoiceContact } from "../api/voiceApi";

interface ContactDetailsModalProps {
  visible: boolean;
  contact: VoiceContact | null;
  onClose: () => void;
  onCall: (contact: VoiceContact) => void;
  onEdit: (contact: VoiceContact) => void;
  onDelete: (contactId: string) => Promise<void>;
  onInspectCall?: (call: any) => void;
}

export const ContactDetailsModal: React.FC<ContactDetailsModalProps> = ({
  visible,
  contact,
  onClose,
  onCall,
  onEdit,
  onDelete,
  onInspectCall,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  if (!contact) return null;

  const handleDelete = () => {
    Alert.alert(
      "Delete Contact",
      `Are you sure you want to remove "${contact.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await onDelete(contact.id);
            onClose();
          },
        },
      ],
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          isDark ? styles.containerDark : styles.containerLight,
        ]}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            isDark ? styles.headerDark : styles.headerLight,
          ]}
        >
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text
              style={[styles.headerTitle, isDark && styles.textDark]}
              numberOfLines={1}
            >
              {contact.name}
            </Text>
            <Text style={styles.headerSubtitle}>
              {contact.company || "Direct Contact"} • Added{" "}
              {contact.created_at
                ? new Date(contact.created_at).toLocaleDateString()
                : "Recently"}
            </Text>
          </View>
          <Pressable
            style={[
              styles.closeBtn,
              isDark ? styles.closeBtnDark : styles.closeBtnLight,
            ]}
            onPress={onClose}
          >
            <Ionicons
              name="close"
              size={20}
              color={isDark ? "#FFFFFF" : "#000000"}
            />
          </Pressable>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Quick Contact & Action Card */}
          <View
            style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}
          >
            <View style={styles.contactHeaderRow}>
              <View
                style={[
                  styles.avatarBox,
                  { backgroundColor: "rgba(109, 60, 245, 0.15)" },
                ]}
              >
                <Ionicons name="person" size={22} color="#6D3CF5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.contactPhone, isDark && styles.textDark]}>
                  {contact.phone}
                </Text>
                {contact.email ? (
                  <Text style={styles.contactEmail}>{contact.email}</Text>
                ) : null}
              </View>
            </View>

            {contact.notes ? (
              <View
                style={[
                  styles.notesBox,
                  isDark ? styles.notesBoxDark : styles.notesBoxLight,
                ]}
              >
                <Ionicons
                  name="document-text-outline"
                  size={14}
                  color="#8E8E93"
                />
                <Text
                  style={[styles.notesText, isDark && styles.textDark]}
                  numberOfLines={3}
                >
                  "{contact.notes}"
                </Text>
              </View>
            ) : null}

            <View
              style={[
                styles.divider,
                isDark ? styles.dividerDark : styles.dividerLight,
              ]}
            />

            {/* Actions Bar */}
            <View style={styles.actionsBar}>
              <Pressable
                style={[
                  styles.primaryActionBtn,
                  { backgroundColor: "#6D3CF5" },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onClose();
                  onCall(contact);
                }}
              >
                <Ionicons name="call" size={15} color="#FFFFFF" />
                <Text style={styles.primaryActionBtnText}>Call Contact</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.actionIconBtn,
                  isDark ? styles.btnDark : styles.btnLight,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onEdit(contact);
                }}
              >
                <Ionicons
                  name="create-outline"
                  size={16}
                  color={isDark ? "#FFFFFF" : "#000000"}
                />
                <Text style={[styles.actionBtnText, isDark && styles.textDark]}>
                  Edit
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.actionIconBtn,
                  { backgroundColor: "rgba(239, 68, 68, 0.12)" },
                ]}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
              </Pressable>
            </View>
          </View>

          {/* Campaign Participation History */}
          <View
            style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}
          >
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="rocket-outline" size={16} color="#0A84FF" />
              <Text style={styles.sectionTitle}>CAMPAIGN PARTICIPATION</Text>
            </View>

            {contact.campaign_history && contact.campaign_history.length > 0 ? (
              contact.campaign_history.map((camp, idx, arr) => (
                <View key={camp.id || idx}>
                  <View style={styles.historyRow}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.historyTitle, isDark && styles.textDark]}
                      >
                        {camp.name}
                      </Text>
                      <Text style={styles.historyMeta}>
                        {camp.date} • Duration: {camp.duration}
                      </Text>
                    </View>
                    <View style={styles.badgeSuccess}>
                      <Text style={styles.textSuccess}>{camp.status}</Text>
                    </View>
                  </View>
                  {idx < arr.length - 1 && (
                    <View
                      style={[
                        styles.divider,
                        isDark ? styles.dividerDark : styles.dividerLight,
                      ]}
                    />
                  )}
                </View>
              ))
            ) : (
              <Text
                style={{
                  fontSize: 13,
                  color: "#8E8E93",
                  paddingVertical: 12,
                  textAlign: "center",
                }}
              >
                No campaign participation history recorded for this contact.
              </Text>
            )}
          </View>

          {/* Call History */}
          <View
            style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}
          >
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="call-outline" size={16} color="#6D3CF5" />
              <Text style={styles.sectionTitle}>CALL LOGS & SESSIONS</Text>
            </View>

            {contact.call_history && contact.call_history.length > 0 ? (
              contact.call_history.map((cl, idx, arr) => (
                <View key={cl.id || idx}>
                  <Pressable
                    style={styles.historyRow}
                    onPress={() => onInspectCall && onInspectCall(cl)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.historyTitle, isDark && styles.textDark]}
                      >
                        {cl.assistant}
                      </Text>
                      <Text style={styles.historyMeta}>
                        {cl.time} • {cl.duration}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color="#8E8E93"
                    />
                  </Pressable>
                  {idx < arr.length - 1 && (
                    <View
                      style={[
                        styles.divider,
                        isDark ? styles.dividerDark : styles.dividerLight,
                      ]}
                    />
                  )}
                </View>
              ))
            ) : (
              <Text
                style={{
                  fontSize: 13,
                  color: "#8E8E93",
                  paddingVertical: 12,
                  textAlign: "center",
                }}
              >
                No call logs found for this contact.
              </Text>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerLight: { backgroundColor: "#F7F7F8" },
  containerDark: { backgroundColor: "#000000" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLight: { backgroundColor: "#FFFFFF", borderBottomColor: "#E5E5EA" },
  headerDark: { backgroundColor: "#1C1C1E", borderBottomColor: "#2C2C2E" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#000000" },
  headerSubtitle: { fontSize: 12, color: "#65656B", marginTop: 2 },
  textDark: { color: "#F7F7F8" },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnLight: { backgroundColor: "#E5E5EA" },
  closeBtnDark: { backgroundColor: "#2C2C2E" },
  content: { flex: 1 },
  contentContainer: { padding: 16, gap: 14, paddingBottom: 40 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1 },
  cardLight: { backgroundColor: "#FFFFFF", borderColor: "#E5E5EA" },
  cardDark: { backgroundColor: "#1C1C1E", borderColor: "#2C2C2E" },
  contactHeaderRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  contactPhone: { fontSize: 16, fontWeight: "700" },
  contactEmail: { fontSize: 12, color: "#65656B", marginTop: 2 },
  notesBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  notesBoxLight: { backgroundColor: "#F1F5F9" },
  notesBoxDark: { backgroundColor: "#2C2C2E" },
  notesText: {
    fontSize: 12,
    color: "#65656B",
    fontStyle: "italic",
    flex: 1,
    lineHeight: 16,
  },
  divider: { height: 1, marginVertical: 12 },
  dividerLight: { backgroundColor: "#E5E5EA" },
  dividerDark: { backgroundColor: "#2C2C2E" },
  actionsBar: { flexDirection: "row", gap: 8 },
  primaryActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryActionBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  actionIconBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnLight: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  btnDark: {
    backgroundColor: "#2C2C2E",
    borderWidth: 1,
    borderColor: "#3A3A3C",
  },
  actionBtnText: { fontSize: 12, fontWeight: "700" },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#65656B",
    letterSpacing: 0.5,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  historyTitle: { fontSize: 13.5, fontWeight: "600" },
  historyMeta: { fontSize: 11, color: "#65656B", marginTop: 2 },
  badgeSuccess: {
    backgroundColor: "rgba(48, 209, 88, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  textSuccess: { color: "#30D158", fontSize: 11, fontWeight: "700" },
});
