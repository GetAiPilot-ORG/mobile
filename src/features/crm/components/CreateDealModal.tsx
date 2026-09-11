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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CRMDeal, DealStage } from '../types';
import { useMembers } from '../hooks/useMembers';
import { useContacts } from '../hooks/useContacts';

interface CreateDealModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (deal: Partial<CRMDeal>) => Promise<void>;
  defaultContactId?: string;
  defaultStage?: DealStage;
  isLoading?: boolean;
}

const STAGES: Array<{ key: DealStage; label: string; color: string }> = [
  { key: 'lead', label: 'Lead', color: '#9CA3AF' },
  { key: 'qualified', label: 'Qualified', color: '#60A5FA' },
  { key: 'proposal', label: 'Proposal', color: '#FBBF24' },
  { key: 'negotiation', label: 'Negotiation', color: '#A78BFA' },
  { key: 'closed_won', label: 'Closed Won', color: '#34D399' },
  { key: 'closed_lost', label: 'Closed Lost', color: '#F87171' },
];

export const CreateDealModal: React.FC<CreateDealModalProps> = ({
  visible,
  onClose,
  onSubmit,
  defaultContactId,
  defaultStage = 'lead',
  isLoading,
}) => {
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
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Create New Deal</Text>
              <Text style={styles.headerSubtitle}>Add deal to pipeline with value & stage</Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={20} color="#9CA3AF" />
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
              <Text style={styles.label}>Deal Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Enterprise Software License"
                placeholderTextColor="#6B7280"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Value & Currency */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 2, marginRight: 8 }]}>
                <Text style={styles.label}>Deal Value *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="50000"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                  value={value}
                  onChangeText={setValue}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Currency</Text>
                <View style={styles.currencyRow}>
                  {['INR', 'USD'].map((c) => (
                    <Pressable
                      key={c}
                      style={[styles.currencyBtn, currency === c && styles.currencyBtnSelected]}
                      onPress={() => setCurrency(c)}
                    >
                      <Text
                        style={[
                          styles.currencyBtnText,
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
              <Text style={styles.label}>Pipeline Stage</Text>
              <View style={styles.stageGrid}>
                {STAGES.map((s) => (
                  <Pressable
                    key={s.key}
                    style={[styles.stageChip, stage === s.key && styles.stageChipSelected]}
                    onPress={() => setStage(s.key)}
                  >
                    <Text
                      style={[
                        styles.stageChipText,
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
                <Text style={styles.label}>Link Contact / Lead</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  <Pressable
                    style={[styles.chip, contactId === '' && styles.chipSelected]}
                    onPress={() => setContactId('')}
                  >
                    <Text style={[styles.chipText, contactId === '' && styles.chipTextSelected]}>
                      None
                    </Text>
                  </Pressable>
                  {contactsData.contacts.map((c) => (
                    <Pressable
                      key={c.id}
                      style={[styles.chip, contactId === c.id && styles.chipSelected]}
                      onPress={() => setContactId(c.id)}
                    >
                      <Text
                        style={[styles.chipText, contactId === c.id && styles.chipTextSelected]}
                      >
                        {c.name || `${c.first_name} ${c.last_name}`}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {/* Expected Close & Probability */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Expected Close (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2026-09-30"
                  placeholderTextColor="#6B7280"
                  value={expectedCloseDate}
                  onChangeText={setExpectedCloseDate}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Probability (%)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="80"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                  value={probability}
                  onChangeText={setProbability}
                />
              </View>
            </View>

            {/* Assignee */}
            {members && members.length > 0 ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Assignee</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  <Pressable
                    style={[styles.chip, assignedTo === '' && styles.chipSelected]}
                    onPress={() => setAssignedTo('')}
                  >
                    <Text style={[styles.chipText, assignedTo === '' && styles.chipTextSelected]}>
                      Unassigned
                    </Text>
                  </Pressable>
                  {members.map((m) => (
                    <Pressable
                      key={m.id}
                      style={[styles.chip, assignedTo === m.id && styles.chipSelected]}
                      onPress={() => setAssignedTo(m.id)}
                    >
                      <Text
                        style={[styles.chipText, assignedTo === m.id && styles.chipTextSelected]}
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
              <Text style={styles.label}>Deal Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Key requirements, client expectations, milestones..."
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.modalFooter}>
            <Pressable style={styles.cancelBtn} onPress={handleClose} disabled={isLoading}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#181A20',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: '#262A34',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#262A34',
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
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#121316',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#262A34',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
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
    backgroundColor: '#222630',
    alignItems: 'center',
  },
  currencyBtnSelected: {
    backgroundColor: '#3B82F6',
  },
  currencyBtnText: {
    color: '#9CA3AF',
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
    backgroundColor: '#222630',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  stageChipSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3B82F6',
  },
  stageChipText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  chipScroll: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#222630',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3B82F6',
  },
  chipText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#60A5FA',
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
    backgroundColor: '#262A34',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#D1D5DB',
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
