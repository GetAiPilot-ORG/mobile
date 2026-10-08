import { getColors, useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { DatePickerField } from '../../../components/DatePickerModal';
import { useContacts } from '../hooks/useContacts';
import { useMembers } from '../hooks/useMembers';
import { CRMDeal, DealStage } from '../types';

interface CreateDealModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (deal: Partial<CRMDeal>) => Promise<void>;
  defaultContactId?: string;
  defaultStage?: DealStage;
  isLoading?: boolean;
  orgId?: string;
}

const STAGES: Array<{ key: DealStage; label: string; color: string }> = [
  { key: 'lead', label: 'Lead', color: '#6B7280' },
  { key: 'qualified', label: 'Qualified', color: '#647D8C' },
  { key: 'proposal', label: 'Proposal', color: '#B8863B' },
  { key: 'negotiation', label: 'Negotiation', color: '#8B5CF6' },
  { key: 'closed_won', label: 'Closed Won', color: '#4F8A68' },
  { key: 'closed_lost', label: 'Closed Lost', color: '#B85C5C' },
];

export const CreateDealModal: React.FC<CreateDealModalProps> = ({
  visible,
  onClose,
  onSubmit,
  defaultContactId,
  defaultStage = 'lead',
  isLoading,
  orgId,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

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
        ...(orgId ? { org_id: orgId } : {}),
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
        style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.modalBackground, borderColor: colors.modalBorder }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.modalTitle }]}>Create New Deal</Text>
              <Text style={[styles.headerSubtitle, { color: colors.modalDescription }]}>Add deal to pipeline with value & stage</Text>
            </View>
            <Pressable
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSecondary }]}
              onPress={handleClose}
              hitSlop={8}
            >
              <Ionicons name="close" size={20} color={colors.iconMuted} />
            </Pressable>
          </View>

          {errorMessage ? (
            <View style={[styles.errorBox, { backgroundColor: colors.destructiveSoft }]}>
              <Ionicons name="alert-circle" size={16} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{errorMessage}</Text>
            </View>
          ) : null}

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Deal Title *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputForeground }]}
                placeholder="e.g. Enterprise Software License"
                placeholderTextColor={colors.inputPlaceholder}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Value & Currency */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 2, marginRight: 8 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Deal Value *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputForeground }]}
                  placeholder="50000"
                  placeholderTextColor={colors.inputPlaceholder}
                  keyboardType="numeric"
                  value={value}
                  onChangeText={setValue}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Currency</Text>
                <View style={styles.currencyRow}>
                  {['INR', 'USD'].map((c) => (
                    <Pressable
                      key={c}
                      style={[
                        styles.currencyBtn,
                        { backgroundColor: colors.surfaceSecondary },
                        currency === c && { backgroundColor: colors.primary },
                      ]}
                      onPress={() => setCurrency(c)}
                    >
                      <Text
                        style={[
                          styles.currencyBtnText,
                          { color: colors.mutedText },
                          currency === c && { color: colors.buttonPrimaryForeground, fontWeight: '700' },
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
              <Text style={[styles.label, { color: colors.textSecondary }]}>Pipeline Stage</Text>
              <View style={styles.stageGrid}>
                {STAGES.map((s) => (
                  <Pressable
                    key={s.key}
                    style={[
                      styles.stageChip,
                      { backgroundColor: colors.surfaceSecondary, borderColor: 'transparent' },
                      stage === s.key && { backgroundColor: colors.accentSoft, borderColor: colors.primary },
                    ]}
                    onPress={() => setStage(s.key)}
                  >
                    <Text
                      style={[
                        styles.stageChipText,
                        { color: colors.mutedText },
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
                <Text style={[styles.label, { color: colors.textSecondary }]}>Link Contact / Lead</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  <Pressable
                    style={[
                      styles.chip,
                      { backgroundColor: colors.surfaceSecondary, borderColor: 'transparent' },
                      contactId === '' && { backgroundColor: colors.accentSoft, borderColor: colors.primary },
                    ]}
                    onPress={() => setContactId('')}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: colors.mutedText },
                        contactId === '' && { color: colors.primary, fontWeight: '600' },
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
                        { backgroundColor: colors.surfaceSecondary, borderColor: 'transparent' },
                        contactId === c.id && { backgroundColor: colors.accentSoft, borderColor: colors.primary },
                      ]}
                      onPress={() => setContactId(c.id)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: colors.mutedText },
                          contactId === c.id && { color: colors.primary, fontWeight: '600' },
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
                <Text style={[styles.label, { color: colors.textSecondary }]}>Probability (%)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputForeground }]}
                  placeholder="80"
                  placeholderTextColor={colors.inputPlaceholder}
                  keyboardType="numeric"
                  value={probability}
                  onChangeText={setProbability}
                />
              </View>
            </View>

            {/* Assignee */}
            {members && members.length > 0 ? (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Assignee</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  <Pressable
                    style={[
                      styles.chip,
                      { backgroundColor: colors.surfaceSecondary, borderColor: 'transparent' },
                      assignedTo === '' && { backgroundColor: colors.accentSoft, borderColor: colors.primary },
                    ]}
                    onPress={() => setAssignedTo('')}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: colors.mutedText },
                        assignedTo === '' && { color: colors.primary, fontWeight: '600' },
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
                        { backgroundColor: colors.surfaceSecondary, borderColor: 'transparent' },
                        assignedTo === m.id && { backgroundColor: colors.accentSoft, borderColor: colors.primary },
                      ]}
                      onPress={() => setAssignedTo(m.id)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: colors.mutedText },
                          assignedTo === m.id && { color: colors.primary, fontWeight: '600' },
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
              <Text style={[styles.label, { color: colors.textSecondary }]}>Deal Notes</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputForeground }, styles.textArea]}
                placeholder="Key requirements, client expectations, milestones..."
                placeholderTextColor={colors.inputPlaceholder}
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
              style={[styles.cancelBtn, { backgroundColor: colors.buttonSecondary }]}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={[styles.cancelBtnText, { color: colors.buttonSecondaryForeground }]}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.buttonPrimaryForeground} />
              ) : (
                <Text style={[styles.submitBtnText, { color: colors.buttonPrimaryForeground }]}>Create Deal</Text>
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
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
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
  currencyBtnText: {
    fontSize: 12,
    fontWeight: '600',
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
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
