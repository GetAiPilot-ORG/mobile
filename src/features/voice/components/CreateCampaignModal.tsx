import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme, getColors } from '@/theme';

interface CreateCampaignModalProps {
  visible: boolean;
  assistants: any[];
  phoneNumbers: any[];
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    assistantId: string;
    phoneNumberId?: string;
    numbers?: string;
  }) => Promise<void>;
  isLoading: boolean;
}

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  visible,
  assistants,
  phoneNumbers,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const [campaignName, setCampaignName] = useState('');
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>(assistants[0]?.id || '');
  const [selectedPhoneId, setSelectedPhoneId] = useState<string>(phoneNumbers[0]?.id || '');
  const [numbersText, setNumbersText] = useState('');
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!selectedAssistantId && assistants.length > 0) {
      setSelectedAssistantId(assistants[0].id);
    }
    if (!selectedPhoneId && phoneNumbers.length > 0) {
      setSelectedPhoneId(phoneNumbers[0].id);
    }
  }, [assistants, phoneNumbers]);

  const handleLaunch = async () => {
    setError(null);
    if (!campaignName.trim()) {
      setError('Please enter a campaign name.');
      return;
    }
    if (!selectedAssistantId) {
      setError('Please select an AI Assistant.');
      return;
    }
    if (!numbersText.trim()) {
      setError('Please enter at least one phone number.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await onSubmit({
        name: campaignName.trim(),
        assistantId: selectedAssistantId,
        phoneNumberId: selectedPhoneId || undefined,
        numbers: numbersText.trim(),
      });
      setCampaignName('');
      setNumbersText('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to launch bulk campaign.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
        {/* Header */}
        <View style={[styles.header, isDark ? styles.headerDark : styles.headerLight]}>
          <View>
            <Text style={[styles.headerTitle, isDark && styles.textDark]}>Launch Bulk Voice Campaign</Text>
            <Text style={styles.headerSubtitle}>Automated Concurrent Outbound Telecalling</Text>
          </View>
          <Pressable style={[styles.closeBtn, isDark ? styles.closeBtnDark : styles.closeBtnLight]} onPress={onClose}>
            <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
          </Pressable>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
            <Text style={styles.inputLabel}>CAMPAIGN NAME *</Text>
            <TextInput
              style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
              placeholder="e.g. Q3 Enterprise Webinar Outreach"
              placeholderTextColor="#8E8E93"
              value={campaignName}
              onChangeText={setCampaignName}
            />

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>ASSIGNED AI VOICE AGENT *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.assistantScroll}>
              {assistants.map((ast) => {
                const isSelected = selectedAssistantId === ast.id;
                return (
                  <Pressable
                    key={ast.id}
                    style={[
                      styles.chip,
                      isDark ? styles.chipDark : styles.chipLight,
                      isSelected && styles.chipSelected,
                    ]}
                    onPress={() => setSelectedAssistantId(ast.id)}
                  >
                    <Ionicons name="mic" size={14} color={isSelected ? '#FFFFFF' : '#8B5CF6'} />
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected, !isSelected && (isDark ? styles.textDark : { color: '#000000' })]}>
                      {ast.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>RECIPIENT PHONE NUMBERS (COMMA-SEPARATED) *</Text>
            <TextInput
              style={[styles.textArea, isDark ? styles.inputDark : styles.inputLight]}
              placeholder="+919876543210, +919811223344, +919988776655"
              placeholderTextColor="#8E8E93"
              multiline
              numberOfLines={4}
              value={numbersText}
              onChangeText={setNumbersText}
            />
          </View>

          <Pressable
            style={[styles.submitBtn, (!campaignName.trim() || !numbersText.trim() || isLoading) && styles.submitBtnDisabled]}
            disabled={!campaignName.trim() || !numbersText.trim() || isLoading}
            onPress={handleLaunch}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="rocket" size={18} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Dispatch Campaign Fleet</Text>
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
  contentContainer: { padding: 16, gap: 16 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 10,
  },
  errorText: { color: '#EF4444', fontSize: 12.5, fontWeight: '600', flex: 1 },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardLight: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  cardDark: { backgroundColor: '#161B22', borderColor: '#262C36' },
  inputLabel: { fontSize: 10.5, fontWeight: '700', color: '#8E8E93', marginBottom: 6 },
  input: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  textArea: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    height: 90,
    textAlignVertical: 'top',
    borderWidth: StyleSheet.hairlineWidth,
  },
  inputLight: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB', color: '#000000' },
  inputDark: { backgroundColor: '#0D1117', borderColor: '#262C36', color: '#FFFFFF' },
  assistantScroll: { gap: 8, paddingVertical: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipLight: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  chipDark: { backgroundColor: '#1E242E', borderColor: '#262C36' },
  chipSelected: { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
  chipText: { fontSize: 12, fontWeight: '600' },
  chipTextSelected: { color: '#FFFFFF' },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 14,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
