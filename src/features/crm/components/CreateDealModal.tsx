import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CRMDeal, DealStage } from '../types';
import { useMembers } from '../hooks/useMembers';
import { useContacts } from '../hooks/useContacts';
import { DatePickerField } from '../../../components/DatePickerModal';

interface CreateDealModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (deal: Partial<CRMDeal>) => Promise<void>;
  defaultContactId?: string;
  defaultStage?: DealStage;
  isLoading?: boolean;
}

const STAGES: Array<{ key: DealStage; label: string; color: string }> = [
  { key: 'lead', label: 'Lead', color: '#6B7280' },
  { key: 'qualified', label: 'Qualified', color: '#3B82F6' },
  { key: 'proposal', label: 'Proposal', color: '#D97706' },
  { key: 'negotiation', label: 'Negotiation', color: '#8B5CF6' },
  { key: 'closed_won', label: 'Closed Won', color: '#10B981' },
  { key: 'closed_lost', label: 'Closed Lost', color: '#EF4444' },
];

export const CreateDealModal: React.FC<CreateDealModalProps> = ({
  visible,
  onClose,
  onSubmit,
  defaultContactId,
  defaultStage = 'lead',
  isLoading,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [stage, setStage] = useState<DealStage>(defaultStage);
  const [contactId, setContactId] = useState<string>(defaultContactId || '');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [probability, setProbability] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { data: members } = useMembers();
  const { data: contactsData } = useContacts({ limit: 50 });

  const handleClose = () => {
    setTitle('');
    setValue('');
    setCurrency('INR');
    setStage(defaultStage);
    setContactId(defaultContactId || '');
    setExpectedCloseDate('');
    setProbability('');
    setAssignedTo('');
    setNotes('');
    setErrorMessage('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setErrorMessage('Deal title is required');
      return;
    }

    try {
      setErrorMessage('');
      await onSubmit({
        title: title.trim(),
        value: value ? Number(value) : 0,
        currency,
        stage,
        contact_id: contactId || null,
        expected_close_date: expectedCloseDate.trim() || null,
        probability: probability ? Number(probability) : null,
        assigned_to: assignedTo || null,
        notes: notes.trim() || null,
      });
      handleClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create deal');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalContent, isDark ? styles.modalContentDark : styles.modalContentLight]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Create New Deal</Text>
              <Text style={[styles.headerSubtitle, { color: isDark ? '#9CA3AF' : '#64748B' }]}>Add deal to pipeline with value & stage</Text>
            </View>
            <Pressable
              style={[styles.closeBtn, { backgroundColor: isDark ? '#262A34' : '#F1F5F9' }]}
              onPress={handleClose}
              hitSlop={8}
            >
              <Ionicons name="close" size={20} color={isDark ? '#9CA3AF' : '#64748B'} />
            </Pressable>
          </View>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#334155' }]}>Deal Title *</Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                placeholder="e.g. Enterprise Software License"
                placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Value & Currency */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 2, marginRight: 8 }]}>
                <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#334155' }]}>Deal Value *</Text>
                <TextInput
                  style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                  placeholder="50000"
                  placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                  keyboardType="numeric"
                  value={value}
                  onChangeText={setValue}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#334155' }]}>Currency</Text>
                <View style={styles.currencyRow}>
                  {['INR', 'USD'].map((c) => (
                    <Pressable
                      key={c}
                      style={[
                        styles.currencyBtn,
                        { backgroundColor: isDark ? '#222630' : '#F1F5F9' },
                        currency === c && styles.currencyBtnSelected,
                      ]}
                      onPress={() => setCurrency(c)}
                    >
                      <Text
                        style={[
                          styles.currencyBtnText,
                          { color: isDark ? '#9CA3AF' : '#64748B' },
                          currency === c && styles.currencyBtnTextSelected,
                        ]}
                      >
                        {c}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            {/* Stage Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#334155' }]}>Pipeline Stage</Text>
              <View style={styles.stageGrid}>
                {STAGES.map((s) => (
                  <Pressable
                    key={s.key}
                    style={[
                      styles.stageChip,
                      { backgroundColor: isDark ? '#222630' : '#F1F5F9' },
                      stage === s.key && (isDark ? styles.stageChipSelectedDark : styles.stageChipSelectedLight),
                    ]}
                    onPress={() => setStage(s.key)}
                  >
                    <Text
                      style={[
                        styles.stageChipText,
                        { color: isDark ? '#9CA3AF' : '#64748B' },
                        stage === s.key && { color: s.color, fontWeight: '700' },
                      ]}
                    >
                      {s.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Link Contact */}
            {contactsData?.contacts && contactsData.contacts.length > 0 ? (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#334155' }]}>Link Contact / Lead</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  <Pressable
                    style={[
                      styles.chip,
                      { backgroundColor: isDark ? '#222630' : '#F1F5F9' },
                      contactId === '' && (isDark ? styles.chipSelectedDark : styles.chipSelectedLight),
                    ]}
                    onPress={() => setContactId('')}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isDark ? '#9CA3AF' : '#64748B' },
                        contactId === '' && styles.chipTextSelected,
                      ]}
                    >
                      None
                    </Text>
                  </Pressable>
                  {contactsData.contacts.map((c) => (
                    <Pressable
                      key={c.id}
                      style={[
                        styles.chip,
                        { backgroundColor: isDark ? '#222630' : '#F1F5F9' },
                        contactId === c.id && (isDark ? styles.chipSelectedDark : styles.chipSelectedLight),
                      ]}
                      onPress={() => setContactId(c.id)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: isDark ? '#9CA3AF' : '#64748B' },
                          contactId === c.id && styles.chipTextSelected,
                        ]}
                      >
                        {c.name || `${c.first_name} ${c.last_name}`}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {/* Expected Close Date Picker & Probability */}
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <DatePickerField
                  label="Expected Close"
                  value={expectedCloseDate}
                  onChangeDate={setExpectedCloseDate}
                  placeholder="Pick date..."
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#334155' }]}>Probability (%)</Text>
                <TextInput
                  style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                  placeholder="80"
                  placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                  keyboardType="numeric"
                  value={probability}
                  onChangeText={setProbability}
                />
              </View>
            </View>

            {/* Assignee */}
            {members && members.length > 0 ? (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#334155' }]}>Assignee</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  <Pressable
                    style={[
                      styles.chip,
                      { backgroundColor: isDark ? '#222630' : '#F1F5F9' },
                      assignedTo === '' && (isDark ? styles.chipSelectedDark : styles.chipSelectedLight),
                    ]}
                    onPress={() => setAssignedTo('')}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isDark ? '#9CA3AF' : '#64748B' },
                        assignedTo === '' && styles.chipTextSelected,
                      ]}
                    >
                      Unassigned
                    </Text>
                  </Pressable>
                  {members.map((m) => (
                    <Pressable
                      key={m.id}
                      style={[
                        styles.chip,
                        { backgroundColor: isDark ? '#222630' : '#F1F5F9' },
                        assignedTo === m.id && (isDark ? styles.chipSelectedDark : styles.chipSelectedLight),
                      ]}
                      onPress={() => setAssignedTo(m.id)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: isDark ? '#9CA3AF' : '#64748B' },
                          assignedTo === m.id && styles.chipTextSelected,
                        ]}
                      >
                        {m.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#334155' }]}>Deal Notes</Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : styles.inputLight, styles.textArea]}
                placeholder="Key requirements, client expectations, milestones..."
                placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.modalFooter}>
            <Pressable
              style={[styles.cancelBtn, { backgroundColor: isDark ? '#262A34' : '#F1F5F9' }]}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={[styles.cancelBtnText, { color: isDark ? '#D1D5DB' : '#475569' }]}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.submitBtn} onPress={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Create Deal</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '88%',
    borderWidth: 1,
  },
  modalContentDark: {
    backgroundColor: '#181A20',
    borderColor: '#262A34',
  },
  modalContentLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    flex: 1,
  },
  formScroll: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  inputDark: {
    backgroundColor: '#121316',
    borderColor: '#262A34',
    color: '#FFFFFF',
  },
  inputLight: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    color: '#0F172A',
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 4,
  },
  currencyBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  currencyBtnSelected: {
    backgroundColor: '#3B82F6',
  },
  currencyBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  currencyBtnTextSelected: {
    color: '#FFFFFF',
  },
  stageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  stageChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  stageChipSelectedDark: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3B82F6',
  },
  stageChipSelectedLight: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  stageChipText: {
    fontSize: 12,
  },
  chipScroll: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipSelectedDark: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3B82F6',
  },
  chipSelectedLight: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
