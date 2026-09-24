import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { VoiceAssistant } from '../api/voiceApi';

interface AssignAssistantModalProps {
  visible: boolean;
  phoneNumber?: string;
  numberId?: string;
  currentAssistantId?: string;
  assistants: VoiceAssistant[];
  onClose: () => void;
  onAssign: (numberId: string, assistantId: string) => Promise<void>;
  isLoading: boolean;
}

export const AssignAssistantModal: React.FC<AssignAssistantModalProps> = ({
  visible,
  phoneNumber,
  numberId,
  currentAssistantId,
  assistants,
  onClose,
  onAssign,
  isLoading,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [selectedId, setSelectedId] = useState<string>(currentAssistantId || '');
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (visible) {
      setSelectedId(currentAssistantId || assistants[0]?.id || '');
      setError(null);
    }
  }, [visible, currentAssistantId, assistants]);

  const handleAssign = async () => {
    if (!numberId || !selectedId) {
      setError('Please select an AI assistant to assign.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await onAssign(numberId, selectedId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to assign assistant.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
        {/* Header */}
        <View style={[styles.header, isDark ? styles.headerDark : styles.headerLight]}>
          <View>
            <Text style={[styles.headerTitle, isDark && styles.textDark]}>Assign AI Assistant</Text>
            <Text style={styles.headerSubtitle}>Route Inbound & Outbound for {phoneNumber || 'Selected Line'}</Text>
          </View>
          <Pressable style={[styles.closeBtn, isDark ? styles.closeBtnDark : styles.closeBtnLight]} onPress={onClose}>
            <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
          </Pressable>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.sectionLabel}>CHOOSE VOICE AGENT</Text>

          {assistants.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="sparkles-outline" size={32} color="#8E8E93" />
              <Text style={styles.emptyTitle}>No AI Assistants Available</Text>
              <Text style={styles.emptySubtitle}>Please create an assistant before assigning to this virtual line.</Text>
            </View>
          ) : (
            <View style={styles.assistantList}>
              {assistants.map((ast) => {
                const isSelected = selectedId === ast.id;
                return (
                  <Pressable
                    key={ast.id}
                    style={[
                      styles.assistantCard,
                      isDark ? styles.assistantCardDark : styles.assistantCardLight,
                      isSelected && styles.assistantCardSelected,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedId(ast.id);
                    }}
                  >
                    <View
                      style={[
                        styles.avatarBox,
                        { backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)' },
                      ]}
                    >
                      <Ionicons name="mic" size={18} color="#8B5CF6" />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.astName, isDark && styles.textDark]}>{ast.name}</Text>
                      <Text style={styles.astSub}>
                        {ast.provider?.toUpperCase() || 'VOMYRA'} • {ast.status?.toUpperCase() || 'READY'}
                      </Text>
                    </View>

                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          <Pressable
            style={[styles.saveBtn, { backgroundColor: '#8B5CF6' }, (isLoading || assistants.length === 0) && { opacity: 0.6 }]}
            onPress={handleAssign}
            disabled={isLoading || assistants.length === 0}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Confirm Line Assignment</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerLight: { backgroundColor: '#FFFFFF' },
  containerDark: { backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerLight: { borderBottomColor: '#E2E8F0' },
  headerDark: { borderBottomColor: '#1E293B' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  closeBtnLight: { backgroundColor: '#F1F5F9' },
  closeBtnDark: { backgroundColor: '#1E293B' },
  content: { flex: 1 },
  contentContainer: { padding: 20, gap: 16 },
  textDark: { color: '#F8FAFC' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
    borderRadius: 12,
  },
  errorText: { fontSize: 13, color: '#DC2626', flex: 1 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 0.6 },
  assistantList: { gap: 10 },
  assistantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  assistantCardLight: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  assistantCardDark: { backgroundColor: '#1E293B', borderColor: '#334155' },
  assistantCardSelected: { borderColor: '#8B5CF6', backgroundColor: 'rgba(139, 92, 246, 0.08)' },
  avatarBox: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  astName: { fontSize: 14.5, fontWeight: '700' },
  astSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: { borderColor: '#8B5CF6' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#8B5CF6' },
  emptyBox: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  emptySubtitle: { fontSize: 12, color: '#94A3B8', textAlign: 'center', paddingHorizontal: 16 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  saveBtnText: { fontSize: 14.5, fontWeight: '700', color: '#FFFFFF' },
});
