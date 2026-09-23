import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { VoiceCampaign } from '../api/voiceApi';

interface EditCampaignModalProps {
  visible: boolean;
  campaign: VoiceCampaign | null;
  assistants: any[];
  phoneNumbers: any[];
  onClose: () => void;
  onSubmit: (campaignId: string, payload: any) => Promise<void>;
  isLoading: boolean;
}

export const EditCampaignModal: React.FC<EditCampaignModalProps> = ({
  visible,
  campaign,
  assistants,
  phoneNumbers,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Outreach');
  const [selectedAssistantId, setSelectedAssistantId] = useState('');
  const [selectedNumberId, setSelectedNumberId] = useState('');
  const [status, setStatus] = useState<'draft' | 'running' | 'paused' | 'completed' | 'failed'>('draft');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (campaign) {
      setName(campaign.name || '');
      setCategory(campaign.category || 'Outreach');
      setSelectedAssistantId(campaign.assistant_id || assistants[0]?.id || '');
      setSelectedNumberId(campaign.phone_number_id || phoneNumbers[0]?.id || '');
      setStatus(campaign.status || 'draft');
    }
  }, [campaign, assistants, phoneNumbers]);

  const handleSave = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Please provide a campaign name.');
      return;
    }
    if (!campaign) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await onSubmit(campaign.id, {
        name: name.trim(),
        category,
        assistantId: selectedAssistantId,
        phoneNumberId: selectedNumberId,
        status,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update campaign details.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
        {/* Header */}
        <View style={[styles.header, isDark ? styles.headerDark : styles.headerLight]}>
          <View>
            <Text style={[styles.headerTitle, isDark && styles.textDark]}>Edit Voice Campaign</Text>
            <Text style={styles.headerSubtitle}>Update Target Agent & Routing Settings</Text>
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

          {/* Campaign Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>CAMPAIGN TITLE</Text>
            <TextInput
              style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
              placeholder="e.g. Q3 Enterprise Telecalling Outreach"
              placeholderTextColor="#8E8E93"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Category */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>CATEGORY / TAG</Text>
            <TextInput
              style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
              placeholder="e.g. Sales, Survey, Reminder, Follow-up"
              placeholderTextColor="#8E8E93"
              value={category}
              onChangeText={setCategory}
            />
          </View>

          {/* Assistant Selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>ASSIGNED AI VOICE AGENT</Text>
            <View style={styles.optionsList}>
              {assistants.map((ast) => {
                const isSelected = selectedAssistantId === ast.id;
                return (
                  <Pressable
                    key={ast.id}
                    style={[
                      styles.optionChip,
                      isDark ? styles.optionChipDark : styles.optionChipLight,
                      isSelected && styles.optionChipSelected,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedAssistantId(ast.id);
                    }}
                  >
                    <Ionicons
                      name="mic"
                      size={14}
                      color={isSelected ? '#8B5CF6' : '#8E8E93'}
                    />
                    <Text
                      style={[
                        styles.optionChipText,
                        isDark && styles.textDark,
                        isSelected && styles.optionChipTextSelected,
                      ]}
                    >
                      {ast.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Dedicated Number Selector */}
          {phoneNumbers.length > 0 && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>DEDICATED CALLER NUMBER</Text>
              <View style={styles.optionsList}>
                {phoneNumbers.map((num) => {
                  const isSelected = selectedNumberId === num.id;
                  return (
                    <Pressable
                      key={num.id}
                      style={[
                        styles.optionChip,
                        isDark ? styles.optionChipDark : styles.optionChipLight,
                        isSelected && styles.optionChipSelected,
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedNumberId(num.id);
                      }}
                    >
                      <Ionicons
                        name="keypad"
                        size={14}
                        color={isSelected ? '#8B5CF6' : '#8E8E93'}
                      />
                      <Text
                        style={[
                          styles.optionChipText,
                          isDark && styles.textDark,
                          isSelected && styles.optionChipTextSelected,
                        ]}
                      >
                        {num.phone_number}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Status Selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>STATUS</Text>
            <View style={styles.statusChipsRow}>
              {(['draft', 'running', 'paused', 'completed'] as const).map((st) => {
                const isSelected = status === st;
                return (
                  <Pressable
                    key={st}
                    style={[
                      styles.statusChip,
                      isDark ? styles.optionChipDark : styles.optionChipLight,
                      isSelected && styles.optionChipSelected,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setStatus(st);
                    }}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        isDark && styles.textDark,
                        isSelected && styles.optionChipTextSelected,
                      ]}
                    >
                      {st.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Save Action */}
          <Pressable
            style={[styles.saveButton, isLoading && styles.btnDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Save Changes</Text>
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
  containerDark: { backgroundColor: '#020617' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLight: { backgroundColor: '#FFFFFF', borderBottomColor: '#E2E8F0' },
  headerDark: { backgroundColor: '#0F172A', borderBottomColor: '#1E293B' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000000' },
  headerSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  textDark: { color: '#F8FAFC' },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnLight: { backgroundColor: '#E2E8F0' },
  closeBtnDark: { backgroundColor: '#1E293B' },
  content: { flex: 1 },
  contentContainer: { padding: 16, gap: 16, paddingBottom: 40 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 12,
  },
  errorText: { color: '#EF4444', fontSize: 12.5, fontWeight: '600', flex: 1 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 0.5 },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    borderWidth: 1,
  },
  inputLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#000000' },
  inputDark: { backgroundColor: '#0F172A', borderColor: '#1E293B', color: '#F8FAFC' },
  optionsList: { gap: 8 },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  optionChipLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  optionChipDark: { backgroundColor: '#0F172A', borderColor: '#1E293B' },
  optionChipSelected: { borderColor: '#8B5CF6', backgroundColor: 'rgba(139, 92, 246, 0.08)' },
  optionChipText: { fontSize: 13, fontWeight: '500' },
  optionChipTextSelected: { color: '#8B5CF6', fontWeight: '700' },
  statusChipsRow: { flexDirection: 'row', gap: 6 },
  statusChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  statusChipText: { fontSize: 11, fontWeight: '700' },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});
