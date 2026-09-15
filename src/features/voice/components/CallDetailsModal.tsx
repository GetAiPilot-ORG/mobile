import React from 'react';
import {
  Alert,
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useColorScheme,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface CallDetailsModalProps {
  visible: boolean;
  call: any | null;
  onClose: () => void;
}

export const CallDetailsModal: React.FC<CallDetailsModalProps> = ({ visible, call, onClose }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (!call) return null;

  const messages: Array<{ role: string; content: string; timestamp?: string }> =
    call.transcriptMessages ||
    (call.transcript ? [{ role: 'assistant', content: call.transcript }] : []);

  const handleOpenRecording = async () => {
    let url = call.recordingUrl;
    if (!url) return;

    // If only filename is provided, construct full HTTPS URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://api.vomyra.com/recordings/${url}`;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Recording Unavailable', 'No application found to stream this audio recording URL.');
      }
    } catch (err: any) {
      console.warn('[CallDetailsModal] Failed to open recording URL:', err?.message || err);
      Alert.alert('Playback Error', 'Could not open the call audio recording at this time.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
        {/* Modal Header */}
        <View style={[styles.header, isDark ? styles.headerDark : styles.headerLight]}>
          <View>
            <Text style={[styles.headerTitle, isDark && styles.textDark]}>Call Inspection</Text>
            <Text style={styles.headerSubtitle}>
              {call.customerNumber} • {call.duration || '0s'}
            </Text>
          </View>
          <Pressable
            style={[styles.closeBtn, isDark ? styles.closeBtnDark : styles.closeBtnLight]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
            }}
          >
            <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
          </Pressable>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {/* Metadata Card */}
          <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
            <View style={styles.metaRow}>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>AI ASSISTANT</Text>
                <Text style={[styles.metaVal, isDark && styles.textDark]}>{call.assistant || 'Voice Assistant'}</Text>
              </View>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>STATUS</Text>
                <View style={[styles.badge, call.status === 'completed' ? styles.badgeSuccess : styles.badgeWarning]}>
                  <Text style={[styles.badgeText, call.status === 'completed' ? styles.textSuccess : styles.textWarning]}>
                    {call.status || 'completed'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.divider, isDark ? styles.dividerDark : styles.dividerLight]} />

            <View style={styles.metaRow}>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>DIRECTION</Text>
                <Text style={[styles.metaVal, isDark && styles.textDark]}>{call.direction || 'Outbound'}</Text>
              </View>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>TIMESTAMP</Text>
                <Text style={[styles.metaVal, isDark && styles.textDark]}>{call.time || 'Recent'}</Text>
              </View>
            </View>

            {call.recordingUrl ? (
              <>
                <View style={[styles.divider, isDark ? styles.dividerDark : styles.dividerLight]} />
                <Pressable style={styles.recordingBtn} onPress={handleOpenRecording}>
                  <Ionicons name="play-circle" size={22} color="#8B5CF6" />
                  <Text style={styles.recordingBtnText}>Play Audio Recording</Text>
                  <Ionicons name="open-outline" size={16} color="#8B5CF6" />
                </Pressable>
              </>
            ) : null}
          </View>

          {/* AI Summary */}
          {call.summary ? (
            <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="sparkles" size={16} color="#8B5CF6" />
                <Text style={[styles.sectionTitle, isDark && styles.textDark]}>AI Telemetry Summary</Text>
              </View>
              <Text style={[styles.summaryText, isDark ? styles.summaryTextDark : styles.summaryTextLight]}>
                {call.summary}
              </Text>
            </View>
          ) : null}

          {/* Live Transcript Dialogue */}
          <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="chatbubbles" size={16} color="#0A84FF" />
              <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Conversation Dialogue</Text>
            </View>

            {messages.length > 0 ? (
              <View style={styles.dialogueList}>
                {messages.map((m, idx) => {
                  const isAssistant = m.role === 'assistant' || m.role === 'bot';
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.bubble,
                        isAssistant
                          ? isDark
                            ? styles.assistantBubbleDark
                            : styles.assistantBubbleLight
                          : isDark
                          ? styles.userBubbleDark
                          : styles.userBubbleLight,
                      ]}
                    >
                      <View style={styles.bubbleHeader}>
                        <Text style={[styles.bubbleRole, isAssistant ? styles.roleAssistant : styles.roleUser]}>
                          {isAssistant ? '🤖 Voice Pilot' : '👤 Caller'}
                        </Text>
                        {m.timestamp ? <Text style={styles.bubbleTime}>{m.timestamp}</Text> : null}
                      </View>
                      <Text style={[styles.bubbleText, isDark ? styles.bubbleTextDark : styles.bubbleTextLight]}>
                        {m.content}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.noTranscriptText}>No conversation dialogue recorded for this session.</Text>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerLight: { backgroundColor: '#F2F2F7' },
  containerDark: { backgroundColor: '#000000' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLight: { backgroundColor: '#FFFFFF', borderBottomColor: '#E5E7EB' },
  headerDark: { backgroundColor: '#161B22', borderBottomColor: '#262C36' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000000' },
  headerSubtitle: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  textDark: { color: '#FFFFFF' },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnLight: { backgroundColor: '#E5E7EB' },
  closeBtnDark: { backgroundColor: '#262C36' },
  content: { flex: 1 },
  contentContainer: { padding: 16, gap: 14, paddingBottom: 40 },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardLight: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  cardDark: { backgroundColor: '#161B22', borderColor: '#262C36' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaCol: { flex: 1 },
  metaLabel: { fontSize: 10.5, fontWeight: '700', color: '#8E8E93', marginBottom: 4 },
  metaVal: { fontSize: 14, fontWeight: '600', color: '#000000' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 12 },
  dividerLight: { backgroundColor: '#E5E7EB' },
  dividerDark: { backgroundColor: '#262C36' },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeSuccess: { backgroundColor: 'rgba(48, 209, 88, 0.15)' },
  badgeWarning: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  textSuccess: { color: '#30D158' },
  textWarning: { color: '#F59E0B' },
  recordingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  recordingBtnText: { color: '#8B5CF6', fontSize: 13.5, fontWeight: '700', flex: 1 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#000000' },
  summaryText: { fontSize: 13, lineHeight: 19 },
  summaryTextLight: { color: '#374151' },
  summaryTextDark: { color: '#D1D5DB' },
  dialogueList: { gap: 10 },
  bubble: { padding: 12, borderRadius: 14 },
  assistantBubbleLight: { backgroundColor: 'rgba(139, 92, 246, 0.08)', borderLeftWidth: 3, borderLeftColor: '#8B5CF6' },
  assistantBubbleDark: { backgroundColor: 'rgba(139, 92, 246, 0.15)', borderLeftWidth: 3, borderLeftColor: '#8B5CF6' },
  userBubbleLight: { backgroundColor: 'rgba(0, 0, 0, 0.04)', borderLeftWidth: 3, borderLeftColor: '#8E8E93' },
  userBubbleDark: { backgroundColor: 'rgba(255, 255, 255, 0.06)', borderLeftWidth: 3, borderLeftColor: '#8E8E93' },
  bubbleHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  bubbleRole: { fontSize: 11, fontWeight: '700' },
  roleAssistant: { color: '#8B5CF6' },
  roleUser: { color: '#8E8E93' },
  bubbleTime: { fontSize: 10, color: '#8E8E93' },
  bubbleText: { fontSize: 13, lineHeight: 18 },
  bubbleTextLight: { color: '#1F2937' },
  bubbleTextDark: { color: '#F3F4F6' },
  noTranscriptText: { fontSize: 12, color: '#8E8E93', fontStyle: 'italic', textAlign: 'center', paddingVertical: 10 },
});
